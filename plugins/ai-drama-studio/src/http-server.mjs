import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";
import { allowedAudioExtensions, allowedDocumentExtensions, allowedImageExtensions, allowedSpreadsheetExtensions, allowedVideoExtensions, assertInside, dataRoot, defaultSettings, host, lockedGenerationSettings, port, publicRoot, safeId, workspaceRoot } from "./config.mjs";
import { appendEvent, mutateState, readState } from "./store.mjs";
import { clearArkKey, hasArkKey, saveArkKey } from "./secrets.mjs";
import { getAssetBridgeStatus } from "./asset-bridge.mjs";
import { getManagedSkill, importSkillFile, listManagedSkills, setManagedSkillEnabled } from "./skill-registry.mjs";
import { appendCreationMessage, attachTaskRemoteUrl, claimTask, completeTask, createApproval, createAssetFolder, createCreation, createProject, createWorld, decideApproval, deleteAsset, deleteAssetFolder, deleteCreation, deleteProject, deleteWorld, promoteAsset, renameProject, resumeRealPipeline, setProjectPinned, startLocalRender, startRealPipeline, updateAsset, updateAssetFolder, updateCreation, updateWorld } from "./workflow.mjs";

const mimeTypes = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".aac": "audio/aac", ".flac": "audio/flac", ".ogg": "audio/ogg",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".doc": "application/msword", ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".pdf": "application/pdf", ".csv": "text/csv; charset=utf-8", ".json": "application/json; charset=utf-8", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xls": "application/vnd.ms-excel", ".svg": "image/svg+xml"
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

function decodeXmlText(value) {
  return String(value || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

function encodeXmlText(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function readDocxText(buffer) {
  const zip = new AdmZip(buffer);
  const xml = zip.readAsText("word/document.xml");
  if (!xml) throw new Error("DOCX_CONTENT_MISSING");
  return decodeXmlText(xml.replace(/<w:tab\/?\s*>/g, "\t").replace(/<w:br\/?\s*>/g, "\n").replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, "")).replace(/\n{3,}/g, "\n\n").trim();
}

function writeDocxText(buffer, content) {
  const zip = new AdmZip(buffer);
  const xml = zip.readAsText("word/document.xml");
  if (!xml) throw new Error("DOCX_CONTENT_MISSING");
  const bodyMatch = xml.match(/<w:body>([\s\S]*?)<\/w:body>/);
  if (!bodyMatch) throw new Error("DOCX_CONTENT_INVALID");
  const section = bodyMatch[1].match(/<w:sectPr[\s\S]*?<\/w:sectPr>/)?.[0] || "";
  const paragraphs = String(content || "").split(/\r?\n/).map(line => `<w:p><w:r><w:t xml:space="preserve">${encodeXmlText(line)}</w:t></w:r></w:p>`).join("");
  zip.updateFile("word/document.xml", Buffer.from(xml.replace(bodyMatch[0], `<w:body>${paragraphs}${section}</w:body>`), "utf8"));
  return zip.toBuffer();
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

function publicState(state, keyConfigured, assetBridge) {
  return {
    ...state,
    credentialStatus: { arkConfigured: keyConfigured },
    assetBridge,
    projects: state.projects.map(project => ({
      ...project,
      shots: project.shots.map(({ clipPath, ...shot }) => ({ ...shot, hasClip: Boolean(clipPath) })),
      assets: project.assets.map(({ localPath, remoteUrl, bridge, ...asset }) => ({ ...asset, mediaUrl: `/media/assets/${encodeURIComponent(asset.id)}`, hasRemoteSource: Boolean(remoteUrl), remoteSourceType: remoteUrl?.startsWith("asset://") ? "asset" : remoteUrl ? "https" : "local" })),
      outputs: project.outputs.map(({ localPath, ...output }) => ({ ...output, mediaUrl: `/media/outputs/${encodeURIComponent(output.id)}` }))
    })),
    jobs: state.jobs.map(({ outputPath, ...job }) => job),
    tasks: state.tasks.map(({ localPath, remoteUrl, ...task }) => ({ ...task, hasLocalAsset: Boolean(localPath), hasRemoteSource: Boolean(remoteUrl) }))
  };
}

function registeredMediaPath(state, kind, id) {
  const collection = kind === "assets"
    ? state.projects.flatMap(project => project.assets)
    : kind === "outputs" ? state.projects.flatMap(project => project.outputs) : [];
  const item = collection.find(entry => entry.id === id);
  if (!item?.localPath) throw new Error("FILE_NOT_FOUND");
  const candidate = path.resolve(item.localPath);
  for (const root of [dataRoot, workspaceRoot]) {
    try { return assertInside(root, candidate); }
    catch {}
  }
  throw new Error("PATH_OUTSIDE_WORKSPACE");
}

function editableAssetExtension(asset) {
  const extension = path.extname(asset?.originalName || asset?.localPath || "").toLowerCase();
  return new Set([".md", ".txt", ".docx"]).has(extension) ? extension : "";
}

function requireProjectAsset(state, projectId, assetId) {
  const project = state.projects.find(item => item.id === projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const asset = project.assets?.find(item => item.id === assetId);
  if (!asset) throw new Error("ASSET_NOT_FOUND");
  return { project, asset };
}

async function readAssetContent(projectId, assetId) {
  const state = await readState();
  const { asset } = requireProjectAsset(state, projectId, assetId);
  const extension = editableAssetExtension(asset);
  if (!extension) throw new Error("ASSET_NOT_EDITABLE");
  const source = registeredMediaPath(state, "assets", assetId);
  const buffer = await fsp.readFile(source);
  const content = extension === ".docx" ? readDocxText(buffer) : buffer.toString("utf8");
  return { assetId, content, format: extension.slice(1), editable: true, version: asset.version || 1 };
}

async function saveAssetContentVersion(projectId, assetId, content) {
  const state = await readState();
  const { project, asset } = requireProjectAsset(state, projectId, assetId);
  const extension = editableAssetExtension(asset);
  if (!extension) throw new Error("ASSET_NOT_EDITABLE");
  const source = registeredMediaPath(state, "assets", assetId);
  const version = Math.max(...project.assets.filter(item => item.familyId === asset.familyId).map(item => Number(item.version || 1)), Number(asset.version || 1)) + 1;
  const destination = path.join(dataRoot, "projects", projectId, "imports", `${safeId("edit")}${extension}`);
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  const payload = extension === ".docx" ? writeDocxText(await fsp.readFile(source), content) : Buffer.from(String(content || ""), "utf8");
  await fsp.writeFile(destination, payload);
  const now = new Date().toISOString();
  const nextAsset = { ...asset, id: safeId("asset"), familyId: asset.familyId || asset.id, version, provider: "editor", localPath: destination, remoteUrl: "", bridge: null, size: payload.length, createdAt: now, updatedAt: now };
  try {
    await mutateState(next => {
      const target = next.projects.find(item => item.id === projectId);
      if (!target) throw new Error("PROJECT_NOT_FOUND");
      target.assets.push(nextAsset);
      target.updatedAt = now;
      appendEvent(next, "asset.version_created", `素材“${asset.originalName || asset.id}”已保存为 v${version}，既有创作引用保持原版本`, { projectId, assetId: nextAsset.id, familyId: nextAsset.familyId, version });
    });
  } catch (error) {
    try { await fsp.unlink(destination); } catch {}
    throw error;
  }
  return nextAsset;
}

function revealLocalPath(filePath) {
  const child = process.platform === "win32"
    ? spawn("explorer.exe", ["/select,", filePath], { detached: true, stdio: "ignore", windowsHide: true })
    : process.platform === "darwin"
      ? spawn("open", ["-R", filePath], { detached: true, stdio: "ignore" })
      : spawn("xdg-open", [path.dirname(filePath)], { detached: true, stdio: "ignore" });
  child.unref();
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
  return { ...next, ...lockedGenerationSettings };
}

async function handleApi(req, res, url) {
  const segments = url.pathname.split("/").filter(Boolean);
  if (req.method === "GET" && url.pathname === "/api/health") {
    json(res, 200, { ok: true, service: "ai-drama-studio", now: new Date().toISOString(), ffmpeg: true, assetBridge: await getAssetBridgeStatus() }); return;
  }
  if (req.method === "GET" && url.pathname === "/api/state") {
    json(res, 200, publicState(await readState(), await hasArkKey(), await getAssetBridgeStatus())); return;
  }
  if (req.method === "GET" && url.pathname === "/api/skills") {
    const skills = await listManagedSkills();
    json(res, 200, { count: skills.length, skills }); return;
  }
  if (req.method === "POST" && url.pathname === "/api/skills/import") {
    const form = await parseMultipart(req);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new Error("SKILL_FILE_REQUIRED");
    json(res, 201, { skill: await importSkillFile(file.name, Buffer.from(await file.arrayBuffer())) }); return;
  }
  if (segments[0] === "api" && segments[1] === "skills" && segments[2]) {
    const skillName = decodeURIComponent(segments[2]);
    if (req.method === "GET") {
      json(res, 200, await getManagedSkill(skillName, url.searchParams.get("file") || "SKILL.md")); return;
    }
    if (req.method === "PATCH") {
      const body = await readJson(req, 4096);
      if (typeof body.enabled !== "boolean") throw new Error("SKILL_ENABLED_REQUIRED");
      json(res, 200, { skill: await setManagedSkillEnabled(skillName, body.enabled) }); return;
    }
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
    if (req.method === "PATCH" && segments.length === 3) {
      const body = await readJson(req);
      let project = body.title !== undefined ? await renameProject(projectId, body.title) : (await readState()).projects.find(item => item.id === projectId);
      if (body.pinned !== undefined) project = await setProjectPinned(projectId, body.pinned);
      if (!project) throw new Error("PROJECT_NOT_FOUND");
      json(res, 200, { project }); return;
    }
    if (req.method === "DELETE" && segments.length === 3) { await deleteProject(projectId); json(res, 200, { deleted: true }); return; }
    if (segments[3] === "worlds" && segments.length === 4 && req.method === "POST") { json(res, 201, { world: await createWorld(projectId, await readJson(req)) }); return; }
    if (segments[3] === "worlds" && segments[4] && req.method === "PATCH") { json(res, 200, { world: await updateWorld(projectId, segments[4], await readJson(req)) }); return; }
    if (segments[3] === "worlds" && segments[4] && req.method === "DELETE") { await deleteWorld(projectId, segments[4]); json(res, 200, { deleted: true }); return; }
    if (segments[3] === "creations" && segments.length === 4 && req.method === "POST") { json(res, 201, { creation: await createCreation(projectId, await readJson(req)) }); return; }
    if (segments[3] === "creations" && segments[4] && req.method === "PATCH") { json(res, 200, { creation: await updateCreation(projectId, segments[4], await readJson(req)) }); return; }
    if (segments[3] === "creations" && segments[4] && req.method === "DELETE") { await deleteCreation(projectId, segments[4]); json(res, 200, { deleted: true }); return; }
    if (segments[3] === "creations" && segments[4] && segments[5] === "messages" && req.method === "POST") { json(res, 201, { message: await appendCreationMessage(projectId, segments[4], await readJson(req)) }); return; }
    if (segments[3] === "asset-folders" && segments.length === 4 && req.method === "POST") {
      const body = await readJson(req);
      json(res, 201, { folder: await createAssetFolder(projectId, body.name, body.parentId || null, body) }); return;
    }
    if (segments[3] === "asset-folders" && segments[4] && req.method === "PATCH") { json(res, 200, { folder: await updateAssetFolder(projectId, segments[4], await readJson(req)) }); return; }
    if (segments[3] === "asset-folders" && segments[4] && req.method === "DELETE") { await deleteAssetFolder(projectId, segments[4]); json(res, 200, { deleted: true }); return; }
    if (segments[3] === "assets" && segments[4] && segments[5] === "promote" && req.method === "POST") {
      const body = await readJson(req);
      json(res, 200, { asset: await promoteAsset(projectId, segments[4], body.scope || "series", body.folderId || null) }); return;
    }
    if (segments[3] === "assets" && segments[4] && segments[5] === "content" && req.method === "GET") { json(res, 200, await readAssetContent(projectId, segments[4])); return; }
    if (segments[3] === "assets" && segments[4] && segments[5] === "content" && req.method === "PUT") {
      const body = await readJson(req, 2 * 1024 * 1024);
      const asset = await saveAssetContentVersion(projectId, segments[4], body.content);
      json(res, 201, { asset: { ...asset, localPath: undefined, mediaUrl: `/media/assets/${encodeURIComponent(asset.id)}` } }); return;
    }
    if (segments[3] === "assets" && segments[4] && segments[5] === "reveal" && req.method === "POST") {
      const state = await readState();
      requireProjectAsset(state, projectId, segments[4]);
      revealLocalPath(registeredMediaPath(state, "assets", segments[4]));
      json(res, 200, { revealed: true }); return;
    }
    if (segments[3] === "assets" && segments[4] && req.method === "PATCH") { json(res, 200, { asset: await updateAsset(projectId, segments[4], await readJson(req)) }); return; }
    if (segments[3] === "assets" && segments[4] && req.method === "DELETE") { await deleteAsset(projectId, segments[4]); json(res, 200, { deleted: true }); return; }
    if (req.method === "POST" && segments[3] === "render") { const body = await readJson(req); json(res, 202, { job: await startLocalRender(projectId, body.creationId || null) }); return; }
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
    const folderId = String(form.get("folderId") || "") || null;
    const worldId = String(form.get("worldId") || "") || null;
    const creationId = String(form.get("creationId") || "") || null;
    const versionOfAssetId = String(form.get("versionOfAssetId") || "") || null;
    const file = form.get("file");
    const state = await readState();
    if (!state.projects.some(project => project.id === projectId)) throw new Error("PROJECT_NOT_FOUND");
    if (!(file instanceof File) || file.size === 0) throw new Error("FILE_REQUIRED");
    if (file.size > 30 * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
    const extension = path.extname(file.name).toLowerCase();
    const kind = allowedImageExtensions.has(extension) ? "image" : allowedVideoExtensions.has(extension) ? "video" : allowedAudioExtensions.has(extension) ? "audio" : allowedSpreadsheetExtensions.has(extension) ? "spreadsheet" : allowedDocumentExtensions.has(extension) ? "document" : "";
    if (!kind) throw new Error("FILE_TYPE_UNSUPPORTED");
    const project = state.projects.find(item => item.id === projectId);
    if (folderId && !project.assetFolders?.some(folder => folder.id === folderId)) throw new Error("ASSET_FOLDER_NOT_FOUND");
    if (worldId && !project.worlds?.some(world => world.id === worldId)) throw new Error("WORLD_NOT_FOUND");
    if (creationId && !project.creations?.some(creation => creation.id === creationId)) throw new Error("CREATION_NOT_FOUND");
    const previousVersion = versionOfAssetId ? project.assets?.find(asset => asset.id === versionOfAssetId) : null;
    if (versionOfAssetId && !previousVersion) throw new Error("ASSET_NOT_FOUND");
    const destination = path.join(dataRoot, "projects", projectId, "imports", `${safeId("import")}${extension}`);
    await fsp.mkdir(path.dirname(destination), { recursive: true });
    await fsp.writeFile(destination, Buffer.from(await file.arrayBuffer()));
    const assetId = safeId("asset");
    const folder = folderId ? project.assetFolders.find(item => item.id === folderId) : null;
    const asset = { id: assetId, familyId: previousVersion?.familyId || assetId, version: previousVersion ? Math.max(...project.assets.filter(item => item.familyId === previousVersion.familyId).map(item => Number(item.version || 1))) + 1 : 1, tags: previousVersion?.tags || [], projectId, shotId: previousVersion?.shotId || null, folderId, scope: folder?.scope || (creationId ? "creation" : worldId ? "world" : "project"), worldId: folder?.worldId || worldId, creationId: folder?.creationId || creationId, kind, provider: "import", localPath: destination, remoteUrl: "", originalName: file.name.slice(0, 180), size: file.size, createdAt: new Date().toISOString() };
    await mutateState(next => {
      const target = next.projects.find(item => item.id === projectId);
      target.assets.push(asset);
      if (creationId) {
        const creation = target.creations.find(item => item.id === creationId);
        creation.assetRefs ||= [];
        creation.assetRefs.push({ assetId: asset.id, version: asset.version, locked: false, addedAt: asset.createdAt });
        creation.updatedAt = asset.createdAt;
      }
      appendEvent(next, "asset.imported", previousVersion ? "素材新版本已导入，既有创作引用保持原版本" : "本地素材已导入", { projectId, assetId: asset.id, familyId: asset.familyId, version: asset.version, kind, creationId });
    });
    json(res, 201, { asset: { id: asset.id, projectId, folderId, kind, provider: asset.provider, originalName: asset.originalName, size: asset.size, mediaUrl: `/media/assets/${encodeURIComponent(asset.id)}` } }); return;
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
    if (req.method === "POST" && segments[3] === "remote-source") {
      const body = await readJson(req);
      json(res, 200, { task: await attachTaskRemoteUrl(segments[2], body.remoteUrl) }); return;
    }
  }
  json(res, 404, { error: { code: "NOT_FOUND", message: "未找到该接口。" } });
}

async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${host}:${port}`);
    if (url.pathname.startsWith("/api/")) { await handleApi(req, res, url); return; }
    if (url.pathname.startsWith("/media/")) {
      const [, , kind, encodedId] = url.pathname.split("/");
      await serveFile(req, res, registeredMediaPath(await readState(), kind, decodeURIComponent(encodedId || ""))); return;
    }
    const requestPath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    await serveFile(req, res, assertInside(publicRoot, path.join(publicRoot, requestPath)));
  } catch (error) {
    const payload = safeError(error);
    const status = error?.code === "ENOENT" || payload.code === "FILE_NOT_FOUND" ? 404 : payload.code.includes("NOT_FOUND") ? 404 : payload.code.includes("LOCKED") || payload.code.includes("NOT_EMPTY") ? 409 : payload.code.includes("INVALID") || payload.code.includes("REQUIRED") || payload.code.includes("HAS_NO") || payload.code.includes("TOO_LARGE") || payload.code.includes("UNSUPPORTED") || payload.code.includes("NOT_EDITABLE") ? 400 : 500;
    json(res, status, { error: payload });
  }
}

let runningServer = null;

async function existingWorkbenchIsHealthy() {
  try {
    const response = await fetch(`http://${host}:${port}/api/health`, { signal: AbortSignal.timeout(900) });
    const body = await response.json();
    return response.ok && body?.service === "ai-drama-studio";
  } catch {
    return false;
  }
}

export async function startHttpServer({ log = false } = {}) {
  const url = `http://${host}:${port}`;
  if (runningServer?.listening) return { server: runningServer, url, reused: false };
  if (await existingWorkbenchIsHealthy()) {
    if (log) console.log(`OpenDramaFlow: ${url}（复用已运行服务）`);
    return { server: null, url, reused: true };
  }
  await fsp.mkdir(dataRoot, { recursive: true });
  const server = http.createServer(handler);
  return new Promise((resolve, reject) => {
    server.once("error", async error => {
      if (error?.code === "EADDRINUSE" && await existingWorkbenchIsHealthy()) {
        resolve({ server: null, url, reused: true });
        return;
      }
      reject(error);
    });
    server.listen(port, host, () => {
      runningServer = server;
      if (log) console.log(`OpenDramaFlow: ${url}`);
      resolve({ server, url, reused: false });
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await startHttpServer({ log: true });

export { handler };
