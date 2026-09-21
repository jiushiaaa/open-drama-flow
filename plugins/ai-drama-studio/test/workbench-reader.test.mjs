import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createWorkbenchReader } from "../src/workbench-reader.mjs";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "drama-workbench-read-"));
process.env.AI_DRAMA_DATA_DIR = root;
const { workbenchState, registeredMediaPath } = await import("../src/workbench-state.mjs");
const reader = createWorkbenchReader();
after(async () => { await reader.close(); await fs.rm(root, { recursive: true, force: true }); });
const snapshot = () => ({
  updatedAt: "2026-09-21T00:00:00Z", settings: {}, jobs: [], tasks: [], events: [],
  approvals: [{ id: "approval", projectId: "p", status: "pending", snapshot: { secret: "private-history" } }],
  projects: [{ id: "p", title: "Project", assets: [{ id: "a", kind: "image", originalName: "master.png", version: 2, localPath: path.join(root, "master.png"), scope: "series", reference: "private-history" }],
    outputs: [], shots: [], memories: [], worlds: [], assetFolders: [],
    creations: [{ id: "c", title: "Episode", assetRefs: [{ assetId: "a", version: 2 }], canvas: { positions: { a: { x: 10, y: 20 } } },
      messages: [{ id: "m", role: "user", content: "Keep action", metadata: "private-history" }],
      plan: { logline: "Story", shots: [{ id: "s", scene: "Scene", prompt: "Action", snapshot: "private-history" }], revisionHistory: ["private-history"] } }] }],
  providerCalls: [{ id: "call", kind: "seedance-video", model: "doubao-seedance-2-5-260628", provider: "ark", at: "2026-09-21T00:00:00Z", status: "succeeded", cost: { estimate: { currency: "CNY", amount: 2 }, settlements: [] } }]
});
async function write(state) {
  const temp = path.join(root, `state-${crypto.randomUUID()}.tmp`);
  await fs.writeFile(temp, JSON.stringify(state));
  await fs.rename(temp, path.join(root, "state.json"));
}
test("display projection preserves assets, versions, canvas and scripts without production snapshots", () => {
  const state = snapshot(), original = structuredClone(state), view = workbenchState(state);
  assert.equal(view.projects[0].assets[0].mediaUrl, "/media/assets/a");
  assert.equal(view.projects[0].assets[0].version, 2);
  assert.deepEqual(view.projects[0].creations[0].assetRefs, [{ assetId: "a", version: 2 }]);
  assert.equal(view.projects[0].creations[0].plan.shots[0].prompt, "Action");
  assert.equal(view.projects[0].creations[0].canvas.positions.a.x, 10);
  assert.equal(view.projects[0].creations[0].messages[0].content, "Keep action");
  assert.ok(!JSON.stringify(view).includes("private-history"));
  assert.ok(!JSON.stringify(view).includes("localPath"));
  assert.deepEqual(state, original);
});
test("shared reader invalidates after atomic replacement and cannot be mutated through responses", async () => {
  const state = snapshot(); await write(state);
  const [view, usage] = await Promise.all([reader.read("workbench"), reader.read("usage")]);
  assert.equal(usage.summary.calls, 1);
  view.projects[0].title = "client-only";
  assert.equal((await reader.read("workbench")).projects[0].title, "Project");
  state.projects[0].title = "Changed";
  state.providerCalls.push({ ...state.providerCalls[0], id: "call-2" });
  // File identity, not only updatedAt, detects external writers.
  await write(state);
  assert.equal((await reader.read("workbench")).projects[0].title, "Changed");
  assert.equal((await reader.read("usage")).summary.calls, 2);
  assert.equal((await reader.read("usage", { provider: "speech" })).summary.calls, 0);
  assert.equal(await reader.read("media", { kind: "assets", id: "a" }), path.join(root, "master.png"));
  await assert.rejects(reader.read("media", { kind: "assets", id: "missing" }), /FILE_NOT_FOUND/);
  assert.equal((await reader.read("usage")).summary.calls, 2);
});
test("media path checks and removed assets remain enforced", async () => {
  const state = snapshot();
  state.projects[0].assets[0].localPath = path.join(os.tmpdir(), "outside-master.png");
  assert.throws(() => registeredMediaPath(state, "assets", "a"), /PATH_OUTSIDE_WORKSPACE/);
  state.projects[0].assets = [];
  await write(state);
  await assert.rejects(reader.read("media", { kind: "assets", id: "a" }), /FILE_NOT_FOUND/);
});
