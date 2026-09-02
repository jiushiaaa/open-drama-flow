import test from "node:test";
import assert from "node:assert/strict";
import { approvedMemoryDigest, buildContextPack, estimateMemoryTokens, normalizeMemoryEntry } from "../src/project-memory.mjs";

const hash = character => character.repeat(64);

function memory(id, overrides = {}) {
  return {
    id,
    version: 1,
    projectId: "project-a",
    scope: "series",
    kind: "summary",
    status: "approved",
    content: `Memory ${id}`,
    ...overrides
  };
}

test("normalizes a stable memory entry and canonical source metadata", () => {
  const input = {
    projectId: " project-a ",
    scope: "creation",
    worldId: "volume-a",
    creationId: "creation-a",
    kind: "canon",
    status: "approved",
    stableKey: "hero-identity",
    content: " 李阎左眉有旧伤。 ",
    version: 2,
    priority: 140,
    tags: ["角色", "锁定", "角色"],
    purposes: ["分镜", "continuity", "分镜"],
    sourceRefs: [
      { assetId: "asset-b", version: 2, sha256: hash("b"), locator: "角色母版" },
      { assetId: "asset-a", version: 1, sha256: hash("a") },
      { assetId: "asset-a", version: 1, sha256: hash("a") }
    ]
  };
  const first = normalizeMemoryEntry(input);
  const second = normalizeMemoryEntry({ ...input, tags: [...input.tags].reverse(), sourceRefs: [...input.sourceRefs].reverse() });

  assert.equal(first.id, second.id);
  assert.match(first.id, /^memory_[a-f0-9]{24}$/);
  assert.equal(first.version, 2);
  assert.equal(first.volumeId, "volume-a");
  assert.equal(first.priority, 100);
  assert.deepEqual(first.tags, ["角色", "锁定"]);
  assert.deepEqual(first.purposes, ["continuity", "分镜"]);
  assert.deepEqual(first.sourceRefs.map(item => item.assetId), ["asset-a", "asset-b"]);
});

test("rejects scope identities that could leak memory across levels", () => {
  assert.throws(() => normalizeMemoryEntry(memory("bad-series", { volumeId: "volume-a" })), /MEMORY_SERIES_SCOPE_IDS_INVALID/);
  assert.throws(() => normalizeMemoryEntry(memory("bad-volume", { scope: "volume" })), /MEMORY_VOLUME_ID_REQUIRED/);
  assert.throws(() => normalizeMemoryEntry(memory("bad-creation", { scope: "creation" })), /MEMORY_CREATION_ID_REQUIRED/);
  assert.throws(() => normalizeMemoryEntry(memory("bad-hash", { sourceRefs: [{ assetId: "asset-a", sha256: "not-a-hash" }] })), /MEMORY_SOURCE_REF_SHA256_INVALID/);
});

test("builds a deterministic pack with strict project, creation and volume isolation", () => {
  const entries = [
    memory("series-summary"),
    memory("series-canon", { kind: "canon" }),
    memory("volume-summary", { scope: "volume", volumeId: "volume-a" }),
    memory("volume-constraint", { scope: "volume", volumeId: "volume-a", kind: "constraint" }),
    memory("creation-summary", { scope: "creation", volumeId: "volume-a", creationId: "creation-a" }),
    memory("other-volume", { scope: "volume", volumeId: "volume-b", kind: "constraint" }),
    memory("other-creation", { scope: "creation", volumeId: "volume-a", creationId: "creation-b", kind: "canon" }),
    memory("candidate", { status: "candidate", kind: "constraint" }),
    memory("other-project", { projectId: "project-b", kind: "constraint" })
  ];
  const query = { projectId: "project-a", creationId: "creation-a", purpose: "分镜", maxTokens: 20_000 };
  const first = buildContextPack(entries, query);
  const second = buildContextPack([...entries].reverse(), query);

  assert.equal(first.volumeId, "volume-a");
  assert.deepEqual(first.selectedIds, ["creation-summary", "volume-constraint", "volume-summary", "series-canon", "series-summary"]);
  assert.deepEqual(second.selectedIds, first.selectedIds);
  assert.equal(second.digest, first.digest);
  assert.equal(first.omitted.find(item => item.id === "other-volume").reason, "other-volume");
  assert.equal(first.omitted.find(item => item.id === "other-creation").reason, "other-creation");
  assert.equal(first.omitted.find(item => item.id === "candidate").reason, "status-candidate");
  assert.equal(first.omitted.find(item => item.id === "other-project").reason, "project-mismatch");
});

test("uses purpose and explicit priority only after scope and memory kind", () => {
  const entries = [
    memory("plain-constraint", { kind: "constraint", priority: 0 }),
    memory("purpose-summary", { kind: "summary", priority: 100, purposes: ["storyboard"] }),
    memory("lower-priority-canon", { kind: "canon", priority: 10, purposes: ["other"] }),
    memory("higher-priority-canon", { kind: "canon", priority: 90, purposes: ["storyboard"] })
  ];
  const pack = buildContextPack(entries, { projectId: "project-a", purpose: "storyboard", maxTokens: 20_000 });
  assert.deepEqual(pack.selectedIds, ["plain-constraint", "higher-priority-canon", "lower-priority-canon", "purpose-summary"]);
});

test("honors a hard token budget and reports deterministic omissions", () => {
  const oversized = memory("oversized", { scope: "creation", creationId: "creation-a", kind: "constraint", content: "设".repeat(1_000) });
  const compact = memory("compact", { scope: "series", kind: "canon", content: "不得改变角色姓名。" });
  const compactTokens = estimateMemoryTokens(normalizeMemoryEntry(compact));
  const pack = buildContextPack([oversized, compact], { projectId: "project-a", creationId: "creation-a", maxTokens: compactTokens });

  assert.deepEqual(pack.selectedIds, ["compact"]);
  assert.ok(pack.estimatedTokens <= pack.maxTokens);
  assert.equal(pack.omitted.find(item => item.id === "oversized").reason, "token-budget");
});

test("selects only the newest approved version for one stable memory id", () => {
  const pack = buildContextPack([
    memory("hero", { version: 1, content: "旧版角色设定" }),
    memory("hero", { version: 2, content: "新版角色设定" }),
    memory("hero", { version: 3, status: "candidate", content: "尚未批准的候选设定" })
  ], { projectId: "project-a", maxTokens: 20_000 });

  assert.equal(pack.selected.length, 1);
  assert.equal(pack.selected[0].version, 2);
  assert.equal(pack.omitted.find(item => item.id === "hero" && item.version === 1).reason, "older-approved-version");
  assert.equal(pack.omitted.find(item => item.id === "hero" && item.version === 3).reason, "status-candidate");
});

test("approved memory digest changes only for approved memory in the active scope", () => {
  const base = [
    memory("series-canon", { kind: "canon", content: "主角叫李阎" }),
    memory("volume-a", { scope: "volume", volumeId: "volume-a", kind: "continuity" }),
    memory("volume-b", { scope: "volume", volumeId: "volume-b", kind: "continuity" }),
    memory("candidate", { status: "candidate", kind: "constraint" })
  ];
  const query = { projectId: "project-a", volumeId: "volume-a" };
  const original = approvedMemoryDigest(base, query);
  const unrelatedCandidateEdit = approvedMemoryDigest(base.map(item => item.id === "candidate" ? { ...item, content: "候选内容已变化" } : item), query);
  const otherVolumeEdit = approvedMemoryDigest(base.map(item => item.id === "volume-b" ? { ...item, content: "其他分卷已变化" } : item), query);
  const activeEdit = approvedMemoryDigest(base.map(item => item.id === "volume-a" ? { ...item, version: 2, content: "当前分卷已变化" } : item), query);

  assert.equal(unrelatedCandidateEdit, original);
  assert.equal(otherVolumeEdit, original);
  assert.notEqual(activeEdit, original);
});
