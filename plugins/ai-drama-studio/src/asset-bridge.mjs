import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { assetBridgeControlPort, assetBridgePort, dataRoot, host, runtimeBinRoot, workspaceRoot, assertInside } from "./config.mjs";
import { appendEvent, mutateState, readState } from "./store.mjs";

const bridgeTtlMs = 60 * 60 * 1000;
const mimeTypes = new Map([
  [".png", "image/png"], [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".webp", "image/webp"],
  [".mp4", "video/mp4"], [".mov", "video/quicktime"], [".mp3", "audio/mpeg"], [".wav", "audio/wav"]
]);

let bridgeServer = null;
let tunnelProcess = null;
let publicBaseUrl = "";
let tunnelMode = "idle";

function safeLocalAssetPath(candidate) {
  const resolved = path.resolve(candidate || "");
  for (const root of [dataRoot, workspaceRoot]) {
    try { return assertInside(root, resolved); }
    catch {}
  }
  throw new Error("ASSET_BRIDGE_PATH_NOT_ALLOWED");
}

function isSupportedReferenceUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" || url.protocol === "asset:";
  } catch { return false; }
}

async function bridgeAssetByToken(token) {
  const state = await readState();
  for (const project of state.projects) {
    const asset = project.assets.find(item => item.bridge?.token === token);
    if (!asset) continue;
    if (!asset.bridge?.expiresAt || Date.parse(asset.bridge.expiresAt) <= Date.now()) throw new Error("ASSET_BRIDGE_TOKEN_EXPIRED");
    return { asset, filePath: safeLocalAssetPath(asset.localPath) };
  }
  throw new Error("ASSET_BRIDGE_TOKEN_NOT_FOUND");
}

async function bridgeHandler(req, res) {
  try {
    const url = new URL(req.url, `http://${host}:${assetBridgePort}`);
    if (["GET", "HEAD"].includes(req.method) && url.pathname === "/healthz") {
      const payload = Buffer.from("open-drama-flow");
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Content-Length": payload.length, "Cache-Control": "no-store" });
      res.end(req.method === "HEAD" ? undefined : payload);
      return;
    }
    if (!["GET", "HEAD"].includes(req.method) || !url.pathname.startsWith("/a/")) {
      res.writeHead(404, { "Cache-Control": "no-store" }); res.end(); return;
    }
    const token = decodeURIComponent(url.pathname.slice(3));
    if (!/^[A-Za-z0-9_-]{32,160}$/.test(token)) throw new Error("ASSET_BRIDGE_TOKEN_INVALID");
    const { filePath } = await bridgeAssetByToken(token);
    const stat = await fsp.stat(filePath);
    const type = mimeTypes.get(path.extname(filePath).toLowerCase());
    if (!type || !stat.isFile()) throw new Error("ASSET_BRIDGE_FILE_UNSUPPORTED");
    let start = 0;
    let end = stat.size - 1;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) { res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }); res.end(); return; }
      start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
      end = match[1] && match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
      if (start > end || start >= stat.size) { res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }); res.end(); return; }
    }
    res.writeHead(req.headers.range ? 206 : 200, {
      "Content-Type": type,
      "Content-Length": end - start + 1,
      "Accept-Ranges": "bytes",
      ...(req.headers.range ? { "Content-Range": `bytes ${start}-${end}/${stat.size}` } : {}),
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    });
    if (req.method === "HEAD") res.end();
    else {
      const stream = fs.createReadStream(filePath, { start, end });
      stream.on("error", () => res.destroy());
      res.on("close", () => stream.destroy());
      stream.pipe(res);
    }
  } catch {
    res.writeHead(404, { "Cache-Control": "no-store" }); res.end();
  }
}

async function waitForPublicTunnel(baseUrl) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/healthz`, { signal: AbortSignal.timeout(1200), cache: "no-store" });
      if (response.ok && await response.text() === "open-drama-flow") return true;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return false;
}

export async function startAssetBridgeServer() {
  if (bridgeServer?.listening) return bridgeServer;
  bridgeServer = http.createServer(bridgeHandler);
  await new Promise((resolve, reject) => {
    bridgeServer.once("error", reject);
    bridgeServer.listen(assetBridgePort, host, resolve);
  });
  return bridgeServer;
}

async function readNgrokTunnel() {
  try {
    const response = await fetch(`http://${host}:${assetBridgeControlPort}/api/tunnels`, { signal: AbortSignal.timeout(900) });
    if (!response.ok) return "";
    const body = await response.json();
    const tunnel = body.tunnels?.find(item => item.proto === "https" && String(item.config?.addr || "").includes(String(assetBridgePort)));
    return tunnel?.public_url || "";
  } catch { return ""; }
}

async function waitForNgrokTunnel() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const url = publicBaseUrl || await readNgrokTunnel();
    if (url) return url;
    if (tunnelProcess?.exitCode !== null) break;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error("ASSET_BRIDGE_TUNNEL_UNAVAILABLE");
}

function cloudflaredCandidates() {
  return [...new Set([
    String(process.env.AI_DRAMA_CLOUDFLARED_PATH || "").trim(),
    path.join(runtimeBinRoot, process.platform === "win32" ? "cloudflared.exe" : "cloudflared"),
    process.platform === "win32" ? "cloudflared.exe" : "cloudflared"
  ].filter(Boolean))];
}

function captureCloudflareUrl(stream) {
  if (!stream) return;
  stream.setEncoding("utf8");
  stream.on("data", chunk => {
    const match = String(chunk).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (match) publicBaseUrl = match[0].replace(/\/$/, "");
  });
}

async function startCloudflareQuickTunnel() {
  for (const executable of cloudflaredCandidates()) {
    if (path.isAbsolute(executable)) {
      try { await fsp.access(executable); }
      catch { continue; }
    }
    const processCandidate = spawn(executable, ["tunnel", "--url", `http://${host}:${assetBridgePort}`, "--no-autoupdate"], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });
    captureCloudflareUrl(processCandidate.stdout);
    captureCloudflareUrl(processCandidate.stderr);
    let spawnFailed = false;
    processCandidate.once("error", () => { spawnFailed = true; });
    processCandidate.once("exit", () => {
      if (tunnelProcess === processCandidate) {
        publicBaseUrl = "";
        tunnelMode = "idle";
      }
    });
    tunnelProcess = processCandidate;
    tunnelMode = "cloudflare-quick";
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (publicBaseUrl) {
        if (await waitForPublicTunnel(publicBaseUrl)) return publicBaseUrl;
        publicBaseUrl = "";
        break;
      }
      if (spawnFailed || processCandidate.exitCode !== null) break;
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    if (processCandidate.exitCode === null) processCandidate.kill();
    tunnelProcess = null;
    tunnelMode = "idle";
  }
  return "";
}

async function startNgrokTunnel() {
  const running = await readNgrokTunnel();
  if (running) {
    tunnelMode = "ngrok";
    publicBaseUrl = running.replace(/\/$/, "");
    return publicBaseUrl;
  }
  tunnelProcess = spawn("ngrok", ["http", `http://${host}:${assetBridgePort}`, "--log", "stdout", "--log-format", "json"], {
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"]
  });
  tunnelProcess.once("error", () => { publicBaseUrl = ""; tunnelMode = "idle"; });
  tunnelMode = "ngrok";
  let logBuffer = "";
  tunnelProcess.stdout.setEncoding("utf8");
  tunnelProcess.stdout.on("data", chunk => {
    logBuffer += chunk;
    const lines = logBuffer.split(/\r?\n/);
    logBuffer = lines.pop() || "";
    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        if (event.msg === "started tunnel" && event.url?.startsWith("https://")) publicBaseUrl = event.url.replace(/\/$/, "");
      } catch {}
    }
  });
  tunnelProcess.on("exit", () => { if (tunnelProcess?.exitCode !== null) publicBaseUrl = ""; });
  const url = (await waitForNgrokTunnel()).replace(/\/$/, "");
  if (!await waitForPublicTunnel(url)) throw new Error("ASSET_BRIDGE_TUNNEL_UNAVAILABLE");
  return url;
}

export async function ensureAssetBridgePublicUrl() {
  const configured = String(process.env.AI_DRAMA_ASSET_BRIDGE_BASE_URL || "").trim();
  if (configured) {
    const url = new URL(configured);
    if (url.protocol !== "https:") throw new Error("ASSET_BRIDGE_BASE_URL_MUST_BE_HTTPS");
    tunnelMode = "hosted";
    return url.toString().replace(/\/$/, "");
  }
  await startAssetBridgeServer();
  if (publicBaseUrl && tunnelProcess?.exitCode === null) return publicBaseUrl;
  publicBaseUrl = await startCloudflareQuickTunnel();
  if (!publicBaseUrl) publicBaseUrl = await startNgrokTunnel();
  return publicBaseUrl;
}

export async function ensureAssetRemoteUrl(projectId, assetId) {
  const before = await readState();
  const project = before.projects.find(item => item.id === projectId);
  const asset = project?.assets.find(item => item.id === assetId);
  if (!asset?.localPath) throw new Error("ASSET_BRIDGE_LOCAL_FILE_REQUIRED");
  if (!mimeTypes.has(path.extname(asset.localPath).toLowerCase())) throw new Error("ASSET_BRIDGE_FILE_UNSUPPORTED");
  if (isSupportedReferenceUrl(asset.remoteUrl) && asset.remoteSource !== "local-bridge") return asset.remoteUrl;
  await fsp.access(safeLocalAssetPath(asset.localPath));
  const baseUrl = await ensureAssetBridgePublicUrl();
  // Do not revoke a URL that an already submitted task may still be fetching.
  const current = (await readState()).projects.find(item => item.id === projectId)?.assets.find(item => item.id === assetId);
  if (current?.bridge?.origin === baseUrl && Date.parse(current.bridge.expiresAt) > Date.now() + 5 * 60 * 1000) return current.remoteUrl;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + bridgeTtlMs).toISOString();
  const remoteUrl = `${baseUrl}/a/${token}`;
  await mutateState(state => {
    const target = state.projects.find(item => item.id === projectId)?.assets.find(item => item.id === assetId);
    if (!target) throw new Error("ASSET_NOT_FOUND");
    target.remoteUrl = remoteUrl;
    target.remoteSource = "local-bridge";
    target.bridge = { token, expiresAt, origin: baseUrl };
    appendEvent(state, "asset.bridge_ready", "本地素材已获得受控 HTTPS 参考地址", { projectId, assetId, expiresAt });
  });
  return remoteUrl;
}

export async function getAssetBridgeStatus() {
  const configured = Boolean(String(process.env.AI_DRAMA_ASSET_BRIDGE_BASE_URL || "").trim());
  const runningUrl = publicBaseUrl || await readNgrokTunnel();
  return { configured, mode: configured ? "hosted" : tunnelMode === "idle" && runningUrl ? "ngrok" : tunnelMode, ready: Boolean(runningUrl), publicUrlAvailable: Boolean(runningUrl) };
}

export function closeAssetBridge() {
  if (bridgeServer?.listening) bridgeServer.close();
  if (tunnelProcess && tunnelProcess.exitCode === null) tunnelProcess.kill();
  bridgeServer = null;
  tunnelProcess = null;
  publicBaseUrl = "";
  tunnelMode = "idle";
}
