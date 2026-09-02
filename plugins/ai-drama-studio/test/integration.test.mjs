import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";
import { moveDirectoryToTrash, resolveApprovalLimits } from "../src/workflow.mjs";

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

test("project trash move falls back when Windows rejects directory rename", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ai-drama-trash-test-"));
  const source = path.join(tempRoot, "projects", "project-locked");
  const destination = path.join(tempRoot, ".trash", "project-locked");
  try {
    await fs.mkdir(source, { recursive: true });
    await fs.writeFile(path.join(source, "asset.txt"), "recoverable project data");
    const result = await moveDirectoryToTrash(source, destination, {
      rename: async () => {
        const error = new Error("Windows denied directory rename");
        error.code = "EPERM";
        throw error;
      }
    });
    assert.deepEqual(result, { moved: true, method: "copy", sourceRetained: false });
    assert.equal(await fs.readFile(path.join(destination, "asset.txt"), "utf8"), "recoverable project data");
    await assert.rejects(fs.stat(source), error => error?.code === "ENOENT");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

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
    assert.deepEqual(created.project.assetFolders.map(folder => folder.name), ["00_原作与改编依据", "01_系列公共资产", "90_候选与废案"]);
    assert.deepEqual(created.project.worlds, []);
    assert.deepEqual(created.project.outputs, []);
    assert.deepEqual(created.project.creations, []);

    const sourceFolder = await post(baseUrl, `/api/projects/${created.project.id}/asset-folders`, { name: "原作与设定" });
    const chapterFolder = await post(baseUrl, `/api/projects/${created.project.id}/asset-folders`, { name: "第一章", parentId: sourceFolder.folder.id });
    assert.equal(chapterFolder.folder.parentId, sourceFolder.folder.id);

    let editableAsset = null;
    for (const [fileName, mimeType, expectedKind] of [
      ["chapter-01.md", "text/markdown", "document"],
      ["story-bible.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "document"],
      ["shot-list.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "spreadsheet"],
      ["characters.csv", "text/csv", "spreadsheet"],
      ["narration.mp3", "audio/mpeg", "audio"]
    ]) {
      const upload = new FormData();
      upload.append("projectId", created.project.id);
      upload.append("folderId", chapterFolder.folder.id);
      upload.append("file", new Blob([`asset fixture for ${fileName}`], { type: mimeType }), fileName);
      const imported = await fetch(`${baseUrl}/api/assets/import`, { method: "POST", body: upload });
      assert.equal(imported.ok, true);
      const importedBody = await imported.json();
      assert.equal(importedBody.asset.kind, expectedKind);
      assert.equal(importedBody.asset.folderId, chapterFolder.folder.id);
      assert.equal(importedBody.asset.size > 0, true);
      if (fileName.endsWith(".md")) editableAsset = importedBody.asset;
    }

    const nonEmptyFolderDelete = await fetch(`${baseUrl}/api/projects/${created.project.id}/asset-folders/${chapterFolder.folder.id}`, { method: "DELETE" });
    assert.equal(nonEmptyFolderDelete.status, 409);
    assert.equal((await nonEmptyFolderDelete.json()).error.code, "ASSET_FOLDER_NOT_EMPTY");

    const editableContent = await (await fetch(`${baseUrl}/api/projects/${created.project.id}/assets/${editableAsset.id}/content`)).json();
    assert.match(editableContent.content, /chapter-01\.md/);
    const savedVersion = await fetch(`${baseUrl}/api/projects/${created.project.id}/assets/${editableAsset.id}/content`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: "# 第一章\n\n新的编辑内容" }) });
    assert.equal(savedVersion.status, 201);
    const savedAsset = (await savedVersion.json()).asset;
    assert.equal(savedAsset.version, 2);
    const editedContent = await (await fetch(`${baseUrl}/api/projects/${created.project.id}/assets/${savedAsset.id}/content`)).json();
    assert.equal(editedContent.content, "# 第一章\n\n新的编辑内容");

    const renamedAsset = await fetch(`${baseUrl}/api/projects/${created.project.id}/assets/${savedAsset.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ originalName: "第一章修订版.md" }) });
    assert.equal(renamedAsset.ok, true);
    assert.equal((await renamedAsset.json()).asset.originalName, "第一章修订版.md");

    const world = await post(baseUrl, `/api/projects/${created.project.id}/worlds`, { title: "九龙城寨" });
    assert.equal(world.world.title, "九龙城寨");
    const afterWorld = await (await fetch(`${baseUrl}/api/state`)).json();
    assert.equal(afterWorld.projects[0].assetFolders.some(folder => folder.worldId === world.world.id && folder.name === "角色"), true);

    const creation = await post(baseUrl, `/api/projects/${created.project.id}/creations`, { title: "EP01 三分恶气", worldId: world.world.id, type: "episode" });
    assert.equal(creation.creation.title, "EP01 三分恶气");
    assert.equal(creation.creation.pinned, false);
    assert.equal(creation.creation.worldId, world.world.id);
    assert.equal(creation.creation.type, "episode");

    const firstVersionForm = new FormData();
    firstVersionForm.append("projectId", created.project.id);
    firstVersionForm.append("creationId", creation.creation.id);
    firstVersionForm.append("worldId", world.world.id);
    firstVersionForm.append("file", new Blob(["v1"], { type: "image/png" }), "li-yan-v1.png");
    const firstVersionResponse = await fetch(`${baseUrl}/api/assets/import`, { method: "POST", body: firstVersionForm });
    assert.equal(firstVersionResponse.ok, true);
    const firstAsset = (await firstVersionResponse.json()).asset;

    const lockedReference = await fetch(`${baseUrl}/api/projects/${created.project.id}/creations/${creation.creation.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assetRefs: [{ assetId: firstAsset.id, locked: true }], canvas: { viewport: { x: 80, y: 70, zoom: 0.65 }, positions: { "asset-master": { x: 420, y: 260 } } } })
    });
    assert.equal(lockedReference.ok, true);
    const lockedDelete = await fetch(`${baseUrl}/api/projects/${created.project.id}/assets/${firstAsset.id}`, { method: "DELETE" });
    assert.equal(lockedDelete.status, 409);
    assert.equal((await lockedDelete.json()).error.code, "ASSET_LOCKED_IN_CREATION");

    const secondVersionForm = new FormData();
    secondVersionForm.append("projectId", created.project.id);
    secondVersionForm.append("versionOfAssetId", firstAsset.id);
    secondVersionForm.append("file", new Blob(["v2"], { type: "image/png" }), "li-yan-v2.png");
    const secondVersionResponse = await fetch(`${baseUrl}/api/assets/import`, { method: "POST", body: secondVersionForm });
    assert.equal(secondVersionResponse.ok, true);
    const secondAsset = (await secondVersionResponse.json()).asset;
    const versionedState = await (await fetch(`${baseUrl}/api/state`)).json();
    const versionedProject = versionedState.projects[0];
    assert.equal(versionedProject.assets.find(asset => asset.id === firstAsset.id).version, 1);
    assert.equal(versionedProject.assets.find(asset => asset.id === secondAsset.id).version, 2);
    assert.equal(versionedProject.assets.find(asset => asset.id === secondAsset.id).familyId, versionedProject.assets.find(asset => asset.id === firstAsset.id).familyId);
    assert.deepEqual(versionedProject.creations.find(item => item.id === creation.creation.id).assetRefs.map(ref => ref.assetId), [firstAsset.id]);

    const seriesFolder = versionedProject.assetFolders.find(folder => folder.scope === "series");
    const movedAsset = await fetch(`${baseUrl}/api/projects/${created.project.id}/assets/${firstAsset.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId: seriesFolder.id, tags: ["主要角色", "八卦掌", "1986", "已锁定"] }) });
    assert.equal(movedAsset.ok, true);
    const promoted = await post(baseUrl, `/api/projects/${created.project.id}/assets/${firstAsset.id}/promote`, { scope: "series", folderId: seriesFolder.id });
    assert.equal(promoted.asset.id, firstAsset.id);
    const stableState = await (await fetch(`${baseUrl}/api/state`)).json();
    assert.deepEqual(stableState.projects[0].creations.find(item => item.id === creation.creation.id).assetRefs.map(ref => ref.assetId), [firstAsset.id]);
    const pinnedCreation = await fetch(`${baseUrl}/api/projects/${created.project.id}/creations/${creation.creation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "置顶创作页", pinned: true })
    });
    assert.equal(pinnedCreation.ok, true);
    assert.equal((await pinnedCreation.json()).creation.pinned, true);
    const renamed = await fetch(`${baseUrl}/api/projects/${created.project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "空白项目已重命名", pinned: true })
    });
    assert.equal(renamed.ok, true);
    assert.equal((await renamed.json()).project.pinned, true);

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

    const removedCreation = await fetch(`${baseUrl}/api/projects/${created.project.id}/creations/${creation.creation.id}`, { method: "DELETE" });
    assert.equal(removedCreation.ok, true);
    assert.deepEqual((await (await fetch(`${baseUrl}/api/state`)).json()).projects[0].creations, []);

    const page = await (await fetch(baseUrl)).text();
    assert.match(page, /项目新手指引/);
    assert.match(page, /不会写入项目数据/);
    assert.match(page, /id="start-view"/);
    assert.match(page, /用 Codex 创作你的 AI 视频/);
    assert.match(page, /图片 · 视频 · 音频 · 文档 · 表格/);
    assert.match(page, /\.docx.*\.xlsx.*\.csv/);
    assert.match(page, /id="project-library-view"/);
    assert.match(page, /id="canvas-stage"/);
    assert.doesNotMatch(page, /canvas-inspector-resizer|创作检查器|canvas-toolbar|canvas-fit-bottom/);
    assert.match(page, /分卷 \/ 季度/);
    assert.doesNotMatch(page, /新建世界|所属世界|世界总控|生成可用/);
    assert.match(page, /id="world-filter-list"/);
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
  assert.deepEqual(resolveApprovalLimits(project, { imageProvider: "codex-imagegen" }), { maxImageCalls: 40, maxVideoCalls: 40 });
  assert.deepEqual(resolveApprovalLimits(project, { imageProvider: "ark-seedream" }), { maxImageCalls: 40, maxVideoCalls: 40 });
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
