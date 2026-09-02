import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";

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
    assert.equal(initial.settings.maxImageCallsPerBatch, 20);
    assert.equal(initial.settings.maxVideoCallsPerBatch, 20);

    const attemptedOverride = await fetch(`${baseUrl}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seedanceModel: "user-entered-model", ratio: "16:9", watermark: true, maxVideoCallsPerBatch: 1 })
    });
    assert.equal(attemptedOverride.ok, true);
    const overridden = await attemptedOverride.json();
    assert.equal(overridden.settings.seedanceModel, "doubao-seedance-2-5-260628");
    assert.equal(overridden.settings.ratio, "9:16");
    assert.equal(overridden.settings.watermark, false);
    assert.equal(overridden.settings.maxVideoCallsPerBatch, 20);

    const created = await post(baseUrl, "/api/projects", { title: "空白项目验证" });
    assert.equal(created.project.logline, "");
    assert.deepEqual(created.project.script, { premise: "", scenes: [] });
    assert.deepEqual(created.project.characters, []);
    assert.deepEqual(created.project.shots, []);
    assert.deepEqual(created.project.assets, []);
    assert.deepEqual(created.project.outputs, []);

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
    assert.match(page, /内容不会写入项目库或任务记录/);
    assert.doesNotMatch(page, /写入演示剧本|运行零付费全流程/);
  } finally {
    child.kill();
    await new Promise(resolve => child.once("close", resolve));
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
