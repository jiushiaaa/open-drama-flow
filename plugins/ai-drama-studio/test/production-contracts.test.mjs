import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
const root = await fs.mkdtemp(path.join(os.tmpdir(), "odf-contracts-test-"));
process.env.AI_DRAMA_DATA_DIR = root;
const { readState, mutateState } = await import("../src/store.mjs");
const { recordStageCheckpoint, recordProductionDecision, getProductionProgress } = await import("../src/production-journal.mjs");
const { stageContracts, productionTypes } = await import("../src/production-stages.mjs");
const { selectWorkflow } = await import("../src/production-discovery.mjs");
const { knowledgeIndex, readProductionKnowledge, knowledgeForTool } = await import("../src/production-knowledge.mjs");
test.after(async () => {
  assert.equal(path.dirname(await fs.realpath(root)), await fs.realpath(os.tmpdir()));
  assert.ok(path.basename(root).startsWith("odf-contracts-test-"));
  await fs.rm(root, { recursive: true, force: true });
});
let serial = 0;
async function fixture() {
  const projectId = `p-${++serial}`;
  await mutateState(state => { state.projects.push({ id: projectId, planRevision: 0, assets: [], shots: [], memories: [],
    creations: [{ id: "a", plan: { planRevision: 2 } }, { id: "b", plan: { planRevision: 2 } }, { id: "legacy", planSource: "project-legacy" }] }); });
  return { projectId, creationId: "a", type: "drama", planRevision: 2 };
}
async function artifact(name) {
  const content = `isolated test report ${++serial}`;
  const file = path.join(root, `${serial}.md`);
  await fs.writeFile(file, content);
  return { name, path: file, sha256: createHash("sha256").update(content).digest("hex") };
}
async function checkpoint(base, index = 0) {
  const stage = stageContracts(base.type)[index];
  return { ...base, stageId: stage.id, requestKey: `cp-${++serial}`, outcome: "complete",
    artifacts: [await artifact(stage.produces[0].name)],
    checks: stage.acceptance.map(c => ({ id: c.id, passed: true, observation: "Fixture observation; no media generation or real review.", evidenceNames: [stage.produces[0].name] })),
    resumeNote: "Read original task; never resubmit unknown calls." };
}
function decision(base) {
  return { ...base, stageId: "source", requestKey: `choice-${++serial}`, category: "creative", subject: "Test comparison", selected: "reuse", reason: "Preserve accepted work",
    options: [{ id: "reuse", description: "Reuse", reason: "Preserves accepted work" }, { id: "new", description: "Generate", reason: "Different treatment", rejectedBecause: "Unnecessary call" }],
    costImpact: { status: "unknown", basis: "No verified rate" } };
}

test("all five workflows have connected contracts and real MCP tools, without a research stage", async () => {
  const server = await fs.readFile(new URL("../src/mcp-server.mjs", import.meta.url), "utf8");
  const tools = new Set([...server.matchAll(/registerTool\("([^"]+)"/g)].map(m => m[1]));
  assert.equal(productionTypes.length, 5);
  for (const type of productionTypes) {
    const workflow = selectWorkflow(type, []);
    assert.equal(workflow.stageContracts.length, workflow.stages.length);
    const outputs = [];
    for (const stage of workflow.stageContracts) {
      assert.deepEqual(stage.inputs, outputs);
      assert.ok(stage.acceptance.length >= 2 && stage.recovery && stage.director.reference);
      for (const tool of stage.tools) assert.ok(tools.has(tool), tool);
      outputs.push(...stage.produces.map(a => a.name));
      assert.notEqual(stage.id, "research");
    }
    assert.equal(new Set(outputs).size, outputs.length);
  }
});

test("five complete sequences persist checkpoints and survive a fresh state read without authorizing work", async () => {
  for (const type of productionTypes) {
    const base = { ...await fixture(), type };
    const before = await readState();
    for (let i = 0; i < 7; i++) await recordStageCheckpoint(await checkpoint(base, i));
    const progress = await getProductionProgress({ projectId: base.projectId, creationId: base.creationId, type });
    assert.equal(progress.recordedStageCount, 7);
    assert.equal(progress.nextStage, null);
    assert.equal(progress.checkpoints.length, 7);
    const after = await readState();
    for (const key of ["settings", "approvals", "jobs", "tasks", "providerCalls"]) assert.deepEqual(after[key], before[key]);
    assert.equal(after.projects.find(p => p.id === base.projectId).memories.length, 0);
    assert.equal(progress.checkpoints[0].reviewAuthority, "agent-reported");
  }
});

test("missing, failed, forged, or out-of-order stage evidence is rejected", async () => {
  const base = await fixture(), first = await checkpoint(base);
  await assert.rejects(recordStageCheckpoint(await checkpoint(base, 1)), /STAGE_EVIDENCE_INCOMPLETE/);
  await assert.rejects(recordStageCheckpoint({ ...first, artifacts: [] }), /STAGE_CHECKS_INVALID|STAGE_EVIDENCE_INCOMPLETE/);
  await assert.rejects(recordStageCheckpoint({ ...first, checks: [] }), /STAGE_EVIDENCE_INCOMPLETE/);
  await assert.rejects(recordStageCheckpoint({ ...first, checks: first.checks.map(c => ({ ...c, passed: false })) }), /STAGE_EVIDENCE_INCOMPLETE/);
  await assert.rejects(recordStageCheckpoint({ ...first, artifacts: [{ ...first.artifacts[0], sha256: "0".repeat(64) }] }), /ARTIFACT_HASH_CHANGED/);
  await assert.rejects(recordStageCheckpoint({ ...first, artifacts: [{ ...first.artifacts[0], path: "relative.md" }] }), /ARTIFACT_FILE_REQUIRED/);
  await assert.rejects(recordStageCheckpoint({ ...first, planRevision: 1 }), /PRODUCTION_REVISION_CHANGED/);
  await assert.rejects(recordStageCheckpoint({ ...first, creationId: "unknown" }), /CREATION_NOT_FOUND/);
  await assert.rejects(recordStageCheckpoint({ ...first, stageId: "unknown" }), /PRODUCTION_STAGE_UNKNOWN/);
});

test("replayed writes are idempotent under concurrency and conflicting payloads cannot overwrite", async () => {
  const base = await fixture(), input = await checkpoint(base);
  const [a, b] = await Promise.all([recordStageCheckpoint(input), recordStageCheckpoint(input)]);
  assert.equal(a.id, b.id);
  await assert.rejects(recordStageCheckpoint({ ...input, resumeNote: "Changed" }), /PRODUCTION_REQUEST_CONFLICT/);
  const d = decision(base), [x, y] = await Promise.all([recordProductionDecision(d), recordProductionDecision(d)]);
  assert.equal(x.id, y.id);
  await assert.rejects(recordProductionDecision({ ...d, reason: "Changed" }), /PRODUCTION_REQUEST_CONFLICT/);
});

test("file changes, upstream replacement and plan revision invalidate dependent evidence without deleting it", async () => {
  const base = await fixture(), one = await checkpoint(base), two = await checkpoint(base, 1);
  await recordStageCheckpoint(one); await recordStageCheckpoint(two);
  const query = { projectId: base.projectId, creationId: base.creationId, type: base.type };
  assert.equal((await getProductionProgress(query)).recordedStageCount, 2);
  await fs.appendFile(one.artifacts[0].path, "modified");
  let p = await getProductionProgress(query);
  assert.equal(p.recordedStageCount, 0); assert.equal(p.stages[1].status, "stale");
  await recordStageCheckpoint(await checkpoint(base));
  p = await getProductionProgress(query);
  assert.equal(p.recordedStageCount, 1); assert.equal(p.stages[1].status, "stale");
  await mutateState(state => { state.projects.find(p => p.id === base.projectId).creations[0].plan.planRevision++; });
  p = await getProductionProgress(query);
  assert.equal(p.recordedStageCount, 0); assert.equal(p.checkpoints.length, 3);
  await assert.rejects(recordStageCheckpoint(one), /PRODUCTION_REVISION_CHANGED/);
});

test("blocked stages preserve recovery, scope isolation and legacy project mapping", async () => {
  const base = await fixture();
  await recordStageCheckpoint({ ...base, stageId: "source", requestKey: "blocked", outcome: "blocked", artifacts: [], checks: [], resumeNote: "Source not yet available" });
  const query = { projectId: base.projectId, creationId: "a", type: "drama" };
  assert.equal((await getProductionProgress(query)).nextStage.status, "blocked");
  assert.equal((await getProductionProgress({ ...query, creationId: "b" })).checkpoints.length, 0);
  assert.equal((await getProductionProgress({ ...query, type: "motion" })).checkpoints.length, 0);
  const legacy = await checkpoint({ ...base, creationId: "legacy", planRevision: 0 });
  await recordStageCheckpoint(legacy);
  assert.equal((await getProductionProgress({ projectId: base.projectId, type: "drama" })).recordedStageCount, 1);
  assert.equal((await getProductionProgress(query)).recordedStageCount, 0);
});

test("decisions require honest alternatives/cost semantics; corrections append within the same scope", async () => {
  const base = await fixture(), d = decision(base);
  await assert.rejects(recordProductionDecision({ ...d, selected: "missing" }));
  await assert.rejects(recordProductionDecision({ ...d, options: d.options.map(o => ({ ...o, rejectedBecause: undefined })) }));
  await assert.rejects(recordProductionDecision({ ...d, costImpact: { status: "unknown", basis: "unknown", amountDelta: 0 } }));
  await assert.rejects(recordProductionDecision({ ...d, costImpact: { status: "estimate", basis: "missing amount" } }));
  await assert.rejects(recordProductionDecision({ ...d, userApproved: true }));
  const first = await recordProductionDecision(d);
  await assert.rejects(recordProductionDecision({ ...d, creationId: "b", requestKey: "wrong-scope", supersedes: first.id }), /DECISION_SCOPE_MISMATCH/);
  const second = await recordProductionDecision({ ...d, requestKey: "correction", supersedes: first.id, costImpact: { status: "estimate", amountDelta: -2, currency: "CNY", basis: "Fixture estimate; not a bill" } });
  const result = await getProductionProgress({ projectId: base.projectId, creationId: "a", type: "drama" });
  assert.equal(result.decisions.length, 2); assert.equal(second.supersedes, first.id);
  assert.equal(second.authority, "agent-decision-not-user-approval");
});

test("cost snapshots are scope-bound, frozen and keep unknowns/currencies separate", async () => {
  const base = await fixture();
  await mutateState(state => { state.providerCalls.push(
    { id: "included", projectId: base.projectId, creationId: "a", status: "failed" },
    { id: "other", projectId: base.projectId, creationId: "b", cost: { estimate: { amount: 100, currency: "USD" } } }
  ); });
  const row = await recordProductionDecision(decision(base));
  assert.deepEqual(row.costSnapshot.callIds, ["included"]);
  assert.equal(row.costSnapshot.unpricedCalls, 1); assert.deepEqual(row.costSnapshot.currencies, {});
  await mutateState(state => { state.providerCalls.find(c => c.id === "included").cost = { estimate: { amount: 1, currency: "CNY" } }; });
  const query = await getProductionProgress({ projectId: base.projectId, creationId: "a", type: "drama" });
  assert.equal(query.decisions[0].costSnapshot.unpricedCalls, 1);
});

test("knowledge references resolve, are hashed and reject arbitrary paths", async () => {
  const index = knowledgeIndex();
  assert.equal(index.layers.length, 3);
  for (const entry of index.references) {
    const read = await readProductionKnowledge(entry.id);
    assert.equal(read.sha256, createHash("sha256").update(read.content).digest("hex"));
  }
  for (const name of ["seedance-video", "speech-asr", "drama_edit_local_media", "external-text-generation", "real-esrgan-upscale"]) {
    assert.ok(knowledgeForTool(name).every(id => index.references.some(r => r.id === id)));
  }
  await assert.rejects(readProductionKnowledge("../../secrets"), /KNOWLEDGE_REFERENCE_UNKNOWN/);
});
