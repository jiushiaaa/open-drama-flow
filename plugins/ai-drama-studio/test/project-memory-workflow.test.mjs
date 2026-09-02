import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ai-drama-project-memory-workflow-"));
process.env.AI_DRAMA_DATA_DIR = tempRoot;

const { mutateState, readState } = await import("../src/store.mjs");
const { createApproval, createCreation, createProject, createWorld, getContextPack, reviewMemory, updateProjectPlan, upsertMemory } = await import("../src/workflow.mjs");

after(async () => {
  await fs.rm(tempRoot, { recursive: true, force: true });
});

function completePlan(creationId) {
  return {
    creationId,
    brief: {
      objective: "制作一条可交付视频",
      contentType: "短视频",
      audience: "目标观众",
      platform: "抖音",
      durationSeconds: 5,
      aspectRatio: "9:16",
      deliverables: ["竖屏 MP4"],
      acceptanceCriteria: ["设定准确"]
    },
    selectedSkills: ["minimax-brand-promo-video-generator"],
    shots: [{ id: "shot-1", duration: 5, scene: "场景", framing: "中景", prompt: "稳定的静态镜头", generationMode: "static-motion" }]
  };
}

test("schema v5 reads legacy projects with an empty durable memory collection", async () => {
  const project = await createProject({ title: "旧项目兼容" });
  await mutateState(state => {
    state.schemaVersion = 4;
    delete state.projects.find(item => item.id === project.id).memories;
  });

  const state = await readState();
  assert.equal(state.schemaVersion, 5);
  assert.deepEqual(state.projects.find(item => item.id === project.id).memories, []);
});

test("workflow keeps candidates out and maps creation.worldId to the memory volume", async () => {
  const project = await createProject({ title: "从姑获鸟开始" });
  const volumeA = await createWorld(project.id, { title: "第一卷" });
  const volumeB = await createWorld(project.id, { title: "第二卷" });
  const creationA = await createCreation(project.id, { title: "EP01", worldId: volumeA.id });
  const creationB = await createCreation(project.id, { title: "EP02", worldId: volumeB.id });

  const series = await upsertMemory(project.id, { scope: "series", kind: "canon", stableKey: "hero", content: "主角名为李阎" });
  const currentVolume = await upsertMemory(project.id, { scope: "volume", volumeId: volumeA.id, kind: "constraint", stableKey: "weather", content: "九龙城寨持续暴雨" });
  const otherVolume = await upsertMemory(project.id, { scope: "volume", volumeId: volumeB.id, kind: "canon", stableKey: "era", content: "壬辰鏖战发生在古代" });
  const currentCreation = await upsertMemory(project.id, { scope: "creation", creationId: creationA.id, kind: "continuity", stableKey: "entry", content: "本集从雨夜车站开始" });
  const otherCreation = await upsertMemory(project.id, { scope: "creation", creationId: creationB.id, kind: "continuity", stableKey: "entry", content: "另一卷创作页内容" });
  const draft = await upsertMemory(project.id, { scope: "creation", creationId: creationA.id, kind: "summary", stableKey: "draft", content: "尚未批准的候选摘要" });

  assert.equal(currentCreation.volumeId, volumeA.id);
  assert.equal(otherCreation.volumeId, volumeB.id);
  assert.deepEqual((await getContextPack(project.id, { creationId: creationA.id, maxTokens: 20_000 })).selectedIds, []);

  for (const item of [series, currentVolume, otherVolume, currentCreation, otherCreation]) await reviewMemory(project.id, item.id, item.version, "approved", "人工确认");
  const pack = await getContextPack(project.id, { creationId: creationA.id, purpose: "分镜", maxTokens: 20_000 });

  assert.equal(pack.volumeId, volumeA.id);
  assert.deepEqual(pack.selectedIds, [currentCreation.id, currentVolume.id, series.id]);
  assert.equal(pack.omitted.find(item => item.id === otherVolume.id).reason, "other-volume");
  assert.equal(pack.omitted.find(item => item.id === otherCreation.id).reason, "other-creation");
  assert.equal(pack.omitted.find(item => item.id === draft.id).reason, "status-candidate");
  assert.equal(pack.digest.length, 64);
  assert.equal(pack.approvedMemoryDigest.length, 64);

  const state = await readState();
  assert.equal(state.events.filter(event => event.type === "memory.upserted").length, 6);
  assert.equal(state.events.filter(event => event.type === "memory.reviewed").length, 5);
});

test("upsert preserves identity, versions reviewed memory and requires explicit review states", async () => {
  const project = await createProject({ title: "记忆版本" });
  const first = await upsertMemory(project.id, { scope: "series", kind: "canon", stableKey: "lead-name", content: "主角叫李阎" });
  await reviewMemory(project.id, first.id, first.version, "approved");
  const second = await upsertMemory(project.id, { id: first.id, scope: "series", kind: "canon", stableKey: "lead-name", content: "主角仍叫李阎，左眉有旧伤" });

  assert.equal(second.id, first.id);
  assert.equal(second.version, 2);
  assert.equal(second.status, "candidate");
  assert.deepEqual((await getContextPack(project.id, { maxTokens: 20_000 })).selected.map(item => [item.id, item.version]), [[first.id, 1]]);
  await assert.rejects(reviewMemory(project.id, second.id, second.version, "candidate"), /MEMORY_REVIEW_STATUS_INVALID/);
  await reviewMemory(project.id, second.id, second.version, "approved");
  assert.deepEqual((await getContextPack(project.id, { maxTokens: 20_000 })).selected.map(item => [item.id, item.version]), [[first.id, 2]]);
});

test("approval memory digest ignores drafts and other volumes but stales on relevant approval", async () => {
  const project = await createProject({ title: "记忆审批绑定" });
  const volumeA = await createWorld(project.id, { title: "第一卷" });
  const volumeB = await createWorld(project.id, { title: "第二卷" });
  const creation = await createCreation(project.id, { title: "EP01", worldId: volumeA.id });
  await updateProjectPlan(project.id, completePlan(creation.id));
  const relevant = await upsertMemory(project.id, { scope: "volume", volumeId: volumeA.id, kind: "constraint", stableKey: "rain", content: "必须保持雨夜" });
  const unrelated = await upsertMemory(project.id, { scope: "volume", volumeId: volumeB.id, kind: "constraint", stableKey: "sea", content: "海战必须发生在白天" });
  const approval = await createApproval(project.id, { creationId: creation.id, maxImageCalls: 1, maxVideoCalls: 0 });

  assert.equal(approval.scopeSnapshot.approvedMemoryDigest.length, 64);
  await reviewMemory(project.id, unrelated.id, unrelated.version, "approved");
  let state = await readState();
  assert.equal(state.approvals.find(item => item.id === approval.id).status, "pending");

  await reviewMemory(project.id, relevant.id, relevant.version, "approved");
  state = await readState();
  const stale = state.approvals.find(item => item.id === approval.id);
  assert.equal(stale.status, "stale");
  assert.match(stale.staleReason, new RegExp(relevant.id));
  assert.ok(state.events.some(event => event.type === "approval.stale" && event.detail.approvalId === approval.id));
});

test("MCP surface exposes the three explicit project-memory operations", async () => {
  const source = await fs.readFile(new URL("../src/mcp-server.mjs", import.meta.url), "utf8");
  for (const name of ["drama_upsert_memory", "drama_review_memory", "drama_get_context_pack"]) assert.match(source, new RegExp(`registerTool\\(\"${name}\"`));
});
