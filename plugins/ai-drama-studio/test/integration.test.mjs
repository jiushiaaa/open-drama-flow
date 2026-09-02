import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";
import { resolveApprovalLimits } from "../src/workflow.mjs";

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(baseUrl) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("TEST_SERVER_DID_NOT_START");
}

async function post(baseUrl, route, payload = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
}

test("a blank project never receives sample production data", { timeout: 15_000 }, async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ai-drama-studio-test-"));
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["src/http-server.mjs"], {
    cwd: path.resolve("."),
    env: { ...process.env, AI_DRAMA_DATA_DIR: tempRoot, AI_DRAMA_PORT: String(port) },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"]
  });

  try {
    await waitForServer(baseUrl);
    const initial = await (await fetch(`${baseUrl}/api/state`)).json();
    assert.deepEqual(initial.projects, []);
    assert.deepEqual(initial.jobs, []);
    assert.deepEqual(initial.approvals, []);
    assert.deepEqual(initial.tasks, []);
    assert.equal(JSON.stringify(initial).includes("apiKey"), false);
    assert.equal(initial.settings.seedreamModel, "doubao-seedream-5-0-260128");
    assert.equal(initial.settings.seedanceModel, "doubao-seedance-2-5-260628");
    assert.equal(initial.settings.ratio, "9:16");
    assert.equal(initial.settings.resolution, "720p");
    assert.equal(initial.settings.generateAudio, false);
    assert.equal(initial.settings.watermark, false);
    assert.equal("maxImageCallsPerBatch" in initial.settings, false);
    assert.equal("maxVideoCallsPerBatch" in initial.settings, false);

    const attemptedOverride = await fetch(`${baseUrl}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seedanceModel: "user-entered-model", ratio: "16:9", watermark: true })
    });
    assert.equal(attemptedOverride.ok, true);
    const overridden = await attemptedOverride.json();
    assert.equal(overridden.settings.seedanceModel, "doubao-seedance-2-5-260628");
    assert.equal(overridden.settings.ratio, "9:16");
    assert.equal(overridden.settings.watermark, false);

    const created = await post(baseUrl, "/api/projects", { title: "空白项目验证" });
    assert.equal(created.project.logline, "");
    assert.deepEqual(created.project.script, { premise: "", scenes: [] });
    assert.deepEqual(created.project.characters, []);
    assert.deepEqual(created.project.shots, []);
    assert.deepEqual(created.project.assets, []);
    assert.deepEqual(created.project.outputs, []);
    assert.deepEqual(created.project.creations, []);

    const creation = await post(baseUrl, `/api/projects/${created.project.id}/creations`, { title: "第一创作页" });
    assert.equal(creation.creation.title, "第一创作页");
    const renamed = await fetch(`${baseUrl}/api/projects/${created.project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "空白项目已重命名" })
    });
    assert.equal(renamed.ok, true);

    const emptyApproval = await fetch(`${baseUrl}/api/projects/${created.project.id}/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    });
    assert.equal(emptyApproval.status, 400);
    assert.equal((await emptyApproval.json()).error.code, "PROJECT_HAS_NO_SHOTS");

    const state = await (await fetch(`${baseUrl}/api/state`)).json();
    assert.equal(state.projects.length, 1);
    assert.deepEqual(state.jobs, []);
    assert.deepEqual(state.approvals, []);
    assert.deepEqual(state.tasks, []);

    const page = await (await fetch(baseUrl)).text();
    assert.match(page, /项目新手指引/);
    assert.match(page, /不会写入项目数据/);
    assert.match(page, /id="project-library-view"/);
    assert.match(page, /id="project-guide-view"[^>]*hidden/);
    assert.doesNotMatch(page, /登录|本地项目|共创项目/);
    assert.doesNotMatch(page, /写入演示剧本|运行零付费全流程/);

    const removed = await fetch(`${baseUrl}/api/projects/${created.project.id}`, { method: "DELETE" });
    assert.equal(removed.ok, true);
    assert.deepEqual((await (await fetch(`${baseUrl}/api/state`)).json()).projects, []);
    assert.equal((await fs.stat(path.join(tempRoot, ".trash"))).isDirectory(), true);
  } finally {
    child.kill();
    await new Promise(resolve => child.once("close", resolve));
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("approval defaults follow the real missing work without an arbitrary global cap", () => {
  const project = {
    shots: Array.from({ length: 42 }, (_, index) => ({ id: `shot-${index + 1}`, clipPath: index < 2 ? `clip-${index}.mp4` : "" })),
    assets: [{ shotId: "shot-1", kind: "image" }]
  };
  assert.deepEqual(resolveApprovalLimits(project, { imageProvider: "codex-imagegen" }), { maxImageCalls: 0, maxVideoCalls: 40 });
  assert.deepEqual(resolveApprovalLimits(project, { imageProvider: "ark-seedream" }), { maxImageCalls: 41, maxVideoCalls: 40 });
  assert.deepEqual(resolveApprovalLimits(project, { imageProvider: "ark-seedream" }, { maxImageCalls: 0, maxVideoCalls: 7 }), { maxImageCalls: 0, maxVideoCalls: 7 });
});

test("loading the MCP plugin also starts the local workbench", { timeout: 15_000 }, async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ai-drama-mcp-test-"));
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["src/mcp-server.mjs"], {
    cwd: path.resolve("."),
    env: { ...process.env, AI_DRAMA_DATA_DIR: tempRoot, AI_DRAMA_PORT: String(port) },
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"]
  });
  let closed = false;
  try {
    await waitForServer(baseUrl);
    const health = await (await fetch(`${baseUrl}/api/health`)).json();
    assert.equal(health.service, "ai-drama-studio");
    child.stdin.end();
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("MCP_DID_NOT_RELEASE_WORKBENCH")), 3000);
      child.once("close", () => { clearTimeout(timeout); closed = true; resolve(); });
    });
    await assert.rejects(fetch(`${baseUrl}/api/health`));
  } finally {
    if (!closed) {
      child.kill();
      await new Promise(resolve => child.once("close", resolve));
    }
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
