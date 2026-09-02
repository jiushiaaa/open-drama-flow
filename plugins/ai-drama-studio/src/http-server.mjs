import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { allowedImageExtensions, allowedVideoExtensions, assertInside, dataRoot, defaultSettings, host, lockedGenerationSettings, port, publicRoot, safeId } from "./config.mjs";
import { appendEvent, mutateState, readState } from "./store.mjs";
import { clearArkKey, hasArkKey, saveArkKey } from "./secrets.mjs";
import { claimTask, completeTask, createApproval, createProject, decideApproval, resumeRealPipeline, startLocalRender, startRealPipeline } from "./workflow.mjs";

const mimeTypes = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".svg": "image/svg+xml"
};

function json(res, status, body) {
  const payload = Buffer.from(JSON.stringify(body));
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": payload.length, "Cache-Control": "no-store" });
  res.end(payload);
}

function safeError(error) {
  const message = String(error?.message || error || "UNKNOWN_ERROR");
  const known = message.match(/^[A-Z0-9_]+/)?.[0];
  return { code: known || "REQUEST_FAILED", message: known ? message : "请求未完成，请查看本地服务日志。" };
}

async function readJson(req, maxBytes = 1024 * 1024) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("REQUEST_BODY_TOO_LARGE");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new Error("JSON_INVALID"); }
}

function publicState(state, keyConfigured) {
  return {
    ...state,
    credentialStatus: { arkConfigured: keyConfigured },
    projects: state.projects.map(project => ({
      ...project,
      assets: project.assets.map(asset => ({ ...asset, mediaUrl: `/media/${path.relative(dataRoot, asset.localPath).replaceAll("\\", "/")}` })),
      outputs: project.outputs.map(output => ({ ...output, mediaUrl: `/media/${path.relative(dataRoot, output.localPath).replaceAll("\\", "/")}` }))
    }))
  };
}

async function serveFile(req, res, filePath) {
  const stat = await fsp.stat(filePath);
  if (!stat.isFile()) throw new Error("FILE_NOT_FOUND");
  const type = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;
  if (range && type.startsWith("video/")) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) { res.writeHead(416); res.end(); return; }
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
    if (start > end || start >= stat.size) { res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }); res.end(); return; }
    res.writeHead(206, { "Content-Type": type, "Content-Length": end - start + 1, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Accept-Ranges": "bytes" });
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { "Content-Type": type, "Content-Length": stat.size, "Accept-Ranges": "bytes" });
  fs.createReadStream(filePath).pipe(res);
}

async function parseMultipart(req) {
  const webRequest = new Request(`http://${host}:${port}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: Readable.toWeb(req),
    duplex: "half"
  });
  return webRequest.formData();
}

function validateSettings(input, previous) {
  const next = { ...previous };
  if (input.arkBaseUrl !== undefined) {
    const url = new URL(String(input.arkBaseUrl));
    if (url.protocol !== "https:") throw new Error("ARK_BASE_URL_MUST_BE_HTTPS");
    next.arkBaseUrl = url.toString().replace(/\/$/, "");
  }
  if (input.imageProvider !== undefined) {
    if (!["codex-imagegen", "ark-seedream"].includes(input.imageProvider)) throw new Error("IMAGE_PROVIDER_INVALID");
    next.imageProvider = input.imageProvider;
  }
  for (const key of ["seedreamModel", "seedanceModel", "publicAssetBaseUrl"]) {
    if (input[key] !== undefined) next[key] = String(input[key]).trim().slice(0, 300);
  }
  if (input.ratio !== undefined) {
    if (!["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive"].includes(input.ratio)) throw new Error("RATIO_INVALID");
    next.ratio = input.ratio;
  }
  if (input.resolution !== undefined) next.resolution = String(input.resolution).trim().slice(0, 30);
  for (const key of ["generateAudio", "watermark"]) if (input[key] !== undefined) next[key] = Boolean(input[key]);
  for (const key of ["maxImageCallsPerBatch", "maxVideoCallsPerBatch"]) {
    if (input[key] !== undefined) next[key] = Math.min(Math.max(Number.parseInt(input[key], 10) || 0, 0), 20);
  }
  return { ...next, ...lockedGenerationSettings };
}

async function handleApi(req, res, url) {
  const segments = url.pathname.split("/").filter(Boolean);
  if (req.method === "GET" && url.pathname === "/api/health") {
    json(res, 200, { ok: true, service: "ai-drama-studio", now: new Date().toISOString(), ffmpeg: true }); return;
  }
  if (req.method === "GET" && url.pathname === "/api/state") {
    json(res, 200, publicState(await readState(), await hasArkKey())); return;
  }
  if (req.method === "PUT" && url.pathname === "/api/settings") {
    const body = await readJson(req);
    const result = await mutateState(state => {
      state.settings = validateSettings(body, { ...defaultSettings, ...state.settings });
      appendEvent(state, "settings.updated", "系统生成配置已同步");
      return state.settings;
    });
    json(res, 200, { settings: result }); return;
  }
  if (req.method === "PUT" && url.pathname === "/api/secrets/ark") {
    const body = await readJson(req, 4096);
    await saveArkKey(body.apiKey);
    json(res, 200, { configured: true }); return;
  }
  if (req.method === "DELETE" && url.pathname === "/api/secrets/ark") {
    await clearArkKey();
    json(res, 200, { configured: false }); return;
  }
  if (req.method === "POST" && url.pathname === "/api/projects") {
    json(res, 201, { project: await createProject(await readJson(req)) }); return;
  }
  if (segments[0] === "api" && segments[1] === "projects" && segments[2]) {
    const projectId = segments[2];
    if (req.method === "POST" && segments[3] === "render") { json(res, 202, { job: await startLocalRender(projectId) }); return; }
    if (req.method === "POST" && segments[3] === "approvals") { json(res, 201, { approval: await createApproval(projectId, await readJson(req)) }); return; }
  }
  if (segments[0] === "api" && segments[1] === "jobs" && segments[2] && req.method === "POST" && segments[3] === "resume") {
    json(res, 202, { job: await resumeRealPipeline(segments[2]) }); return;
  }
  if (segments[0] === "api" && segments[1] === "approvals" && segments[2]) {
    const approvalId = segments[2];
    if (req.method === "POST" && segments[3] === "decision") {
      const body = await readJson(req);
      json(res, 200, { approval: await decideApproval(approvalId, body.decision) }); return;
    }
    if (req.method === "POST" && segments[3] === "run") { json(res, 202, { job: await startRealPipeline(approvalId) }); return; }
  }
  if (req.method === "POST" && url.pathname === "/api/assets/import") {
    const form = await parseMultipart(req);
    const projectId = String(form.get("projectId") || "");
    const file = form.get("file");
    const state = await readState();
    if (!state.projects.some(project => project.id === projectId)) throw new Error("PROJECT_NOT_FOUND");
    if (!(file instanceof File) || file.size === 0) throw new Error("FILE_REQUIRED");
    if (file.size > 30 * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
    const extension = path.extname(file.name).toLowerCase();
    const kind = allowedImageExtensions.has(extension) ? "image" : allowedVideoExtensions.has(extension) ? "video" : "";
    if (!kind) throw new Error("FILE_TYPE_UNSUPPORTED");
    const destination = path.join(dataRoot, "projects", projectId, "imports", `${safeId("import")}${extension}`);
    await fsp.mkdir(path.dirname(destination), { recursive: true });
    await fsp.writeFile(destination, Buffer.from(await file.arrayBuffer()));
    const asset = { id: safeId("asset"), projectId, shotId: null, kind, provider: "import", localPath: destination, remoteUrl: "", originalName: file.name.slice(0, 180), createdAt: new Date().toISOString() };
    await mutateState(next => { next.projects.find(project => project.id === projectId).assets.push(asset); appendEvent(next, "asset.imported", "本地素材已导入", { projectId, assetId: asset.id, kind }); });
    json(res, 201, { asset: { ...asset, mediaUrl: `/media/${path.relative(dataRoot, destination).replaceAll("\\", "/")}` } }); return;
  }
  if (req.method === "GET" && url.pathname === "/api/tasks") {
    const state = await readState();
    const status = url.searchParams.get("status");
    json(res, 200, { tasks: status ? state.tasks.filter(task => task.status === status) : state.tasks }); return;
  }
  if (segments[0] === "api" && segments[1] === "tasks" && segments[2]) {
    if (req.method === "POST" && segments[3] === "claim") { json(res, 200, { task: await claimTask(segments[2], "codex") }); return; }
    if (req.method === "POST" && segments[3] === "complete") {
      const body = await readJson(req);
      json(res, 200, { task: await completeTask(segments[2], body.localPath, body.remoteUrl || "") }); return;
    }
  }
  json(res, 404, { error: { code: "NOT_FOUND", message: "未找到该接口。" } });
}

async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${host}:${port}`);
    if (url.pathname.startsWith("/api/")) { await handleApi(req, res, url); return; }
    if (url.pathname.startsWith("/media/")) {
      const relative = decodeURIComponent(url.pathname.slice("/media/".length));
      await serveFile(req, res, assertInside(dataRoot, path.join(dataRoot, relative))); return;
    }
    const requestPath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    await serveFile(req, res, assertInside(publicRoot, path.join(publicRoot, requestPath)));
  } catch (error) {
    const payload = safeError(error);
    const status = error?.code === "ENOENT" || payload.code === "FILE_NOT_FOUND" ? 404 : payload.code.includes("NOT_FOUND") ? 404 : payload.code.includes("INVALID") || payload.code.includes("REQUIRED") || payload.code.includes("HAS_NO") || payload.code.includes("TOO_LARGE") || payload.code.includes("UNSUPPORTED") ? 400 : 500;
    json(res, status, { error: payload });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await fsp.mkdir(dataRoot, { recursive: true });
  const server = http.createServer(handler);
  server.listen(port, host, () => console.log(`OpenDramaFlow: http://${host}:${port}`));
}

export { handler };
