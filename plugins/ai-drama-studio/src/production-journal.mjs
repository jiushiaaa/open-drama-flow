import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { readState, mutateState } from "./store.mjs";
import { costReport } from "./cost-ledger.mjs";
import { stageContracts, productionTypes } from "./production-stages.mjs";

const note = z.string().trim().min(1).max(8000);
const id = z.string().min(1).max(200);
export const productionScopeSchema = z.object({ projectId: id, creationId: id.optional(), type: z.enum(productionTypes) }).strict();
const writeScope = productionScopeSchema.extend({ stageId: id, planRevision: z.number().int().min(0), requestKey: id });
const fileSchema = z.object({ name: id, path: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const stageCheckpointSchema = writeScope.extend({
  outcome: z.enum(["complete", "blocked"]),
  artifacts: z.array(fileSchema).max(10),
  checks: z.array(z.object({ id, passed: z.boolean(), observation: note, evidenceNames: z.array(id).max(10) }).strict()).max(20),
  resumeNote: note
}).strict();
const impactSchema = z.object({ status: z.enum(["unknown", "estimate", "no-additional-provider-call"]),
  amountDelta: z.number().finite().optional(), currency: z.string().regex(/^[A-Z]{3}$/).optional(), basis: note
}).strict().superRefine((value, ctx) => {
  if (value.status === "estimate" ? value.amountDelta === undefined || !value.currency : value.amountDelta !== undefined || value.currency !== undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Only estimates require amountDelta and currency; unknown cost is not zero." });
  }
});
export const productionDecisionSchema = writeScope.extend({
  category: z.enum(["creative", "provider", "reference", "editing", "recovery", "cost"]), subject: note,
  options: z.array(z.object({ id, description: note, reason: note, rejectedBecause: note.optional() }).strict()).min(1).max(12),
  selected: id, reason: note, confidence: z.number().min(0).max(1).optional(), costImpact: impactSchema,
  evidence: z.array(fileSchema).max(10).default([]), supersedes: id.optional()
}).strict().superRefine((value, ctx) => {
  if (new Set(value.options.map(o => o.id)).size !== value.options.length || !value.options.some(o => o.id === value.selected)
      || value.options.some(o => o.id !== value.selected && !o.rejectedBecause)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Options must be unique, selected must exist, and rejected alternatives need reasons." });
  }
});

function scope(state, request) {
  const project = state.projects.find(p => p.id === request.projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const creation = request.creationId ? project.creations?.find(c => c.id === request.creationId) : null;
  if (request.creationId && !creation) throw new Error("CREATION_NOT_FOUND");
  const legacy = !creation || creation.planSource === "project-legacy";
  const production = legacy ? project : creation.plan || {};
  return { project, creationId: legacy ? null : creation.id, planRevision: Number(production.planRevision || 0) };
}
function inScope(record, s, type) { return record.type === type && record.creationId === s.creationId; }
function current(record, s, type) { return inScope(record, s, type) && record.planRevision === s.planRevision && record.contractVersion === 1; }
function digest(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
async function verifyFile(file) {
  if (!path.isAbsolute(file.path) || !(await fs.stat(file.path)).isFile()) throw new Error("ARTIFACT_FILE_REQUIRED");
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file.path)) hash.update(chunk);
  if (hash.digest("hex") !== file.sha256) throw new Error("ARTIFACT_HASH_CHANGED");
}
async function filesCurrent(files) {
  try { for (const file of files) await verifyFile(file); return true; } catch { return false; }
}
function snapshot(state, s) {
  const calls = (state.providerCalls || []).filter(c => c.projectId === s.project.id && (c.creationId || null) === s.creationId);
  const { records, ...summary } = costReport({ ...state, providerCalls: calls });
  return { ...summary, callIds: records.map(r => r.callId), capturedAt: new Date().toISOString() };
}
function prepare(state, input, collection) {
  const s = scope(state, input);
  if (input.planRevision !== s.planRevision) throw new Error("PRODUCTION_REVISION_CHANGED");
  const stages = stageContracts(input.type), stage = stages.find(item => item.id === input.stageId);
  if (!stage) throw new Error("PRODUCTION_STAGE_UNKNOWN");
  const normalized = { ...input, creationId: s.creationId };
  const requestDigest = digest(normalized);
  const existing = (s.project[collection] || []).find(r => r.creationId === s.creationId && r.requestKey === input.requestKey);
  if (existing && existing.requestDigest !== requestDigest) throw new Error("PRODUCTION_REQUEST_CONFLICT");
  return { s, stage, stages, normalized, requestDigest, existing };
}

export async function productionProgress(state, input) {
  const request = productionScopeSchema.parse(input), s = scope(state, request);
  const history = (s.project.stageCheckpoints || []).filter(r => inScope(r, s, request.type));
  const stages = [];
  const accepted = new Map();
  for (const definition of stageContracts(request.type)) {
    const record = history.filter(r => current(r, s, request.type) && r.stageId === definition.id).at(-1);
    const parents = definition.inputs.map(name => accepted.get(name));
    const upstreamCurrent = parents.every(Boolean);
    const dependenciesCurrent = record && JSON.stringify(record.upstreamCheckpointIds) === JSON.stringify([...new Set(parents.filter(Boolean).map(p => p.id))]);
    const bytesCurrent = record ? await filesCurrent(record.artifacts) : false;
    const valid = Boolean(record?.outcome === "complete" && upstreamCurrent && dependenciesCurrent && bytesCurrent);
    if (valid) for (const artifact of record.artifacts) accepted.set(artifact.name, record);
    stages.push({ ...definition, status: valid ? "evidence-current" : record?.outcome === "blocked" ? "blocked" : record ? "stale" : "pending",
      checkpointId: record?.id || null, bytesCurrent, upstreamCurrent, resumeNote: record?.resumeNote || definition.recovery });
  }
  const nextStage = stages.find(stage => stage.status !== "evidence-current") || null;
  return { projectId: s.project.id, creationId: s.creationId, type: request.type, contractVersion: 1, planRevision: s.planRevision,
    stages, nextStage, recordedStageCount: stages.filter(stage => stage.status === "evidence-current").length,
    checkpoints: history, decisions: (s.project.productionDecisions || []).filter(r => inScope(r, s, request.type)),
    boundary: "Agent-reported stage evidence, not independent creative verification, image acceptance, activated memory, spending approval or final delivery. Existing production gates remain authoritative." };
}

export async function recordStageCheckpoint(raw) {
  const input = stageCheckpointSchema.parse(raw);
  return mutateState(async state => {
    const { s, stage, stages, normalized, requestDigest, existing } = prepare(state, input, "stageCheckpoints");
    if (existing) return existing;
    const names = input.artifacts.map(a => a.name), checkIds = input.checks.map(c => c.id);
    if (new Set(names).size !== names.length || names.some(name => !stage.produces.some(a => a.name === name))) throw new Error("STAGE_ARTIFACT_NAMES_INVALID");
    if (new Set(checkIds).size !== checkIds.length || input.checks.some(c => !stage.acceptance.some(a => a.id === c.id) || c.evidenceNames.some(name => !names.includes(name)))) throw new Error("STAGE_CHECKS_INVALID");
    const progress = await productionProgress(state, { projectId: input.projectId, creationId: input.creationId, type: input.type });
    const preceding = progress.stages.slice(0, stages.findIndex(item => item.id === stage.id));
    if (input.outcome === "complete" && (preceding.some(s => s.status !== "evidence-current")
      || stage.produces.some(a => !names.includes(a.name))
      || stage.acceptance.some(a => !input.checks.some(c => c.id === a.id && c.passed && c.evidenceNames.length)))) throw new Error("STAGE_EVIDENCE_INCOMPLETE");
    for (const artifact of input.artifacts) await verifyFile(artifact);
    const record = { ...normalized, id: `stage-${randomUUID()}`, contractVersion: 1, requestDigest,
      upstreamCheckpointIds: preceding.filter(s => s.status === "evidence-current").map(s => s.checkpointId),
      recordedAt: new Date().toISOString(), reviewAuthority: "agent-reported", costSnapshot: snapshot(state, s) };
    (s.project.stageCheckpoints ||= []).push(record);
    return record;
  });
}

export async function recordProductionDecision(raw) {
  const input = productionDecisionSchema.parse(raw);
  return mutateState(async state => {
    const { s, normalized, requestDigest, existing } = prepare(state, input, "productionDecisions");
    if (existing) return existing;
    if (input.supersedes && !(s.project.productionDecisions || []).some(r => r.id === input.supersedes && inScope(r, s, input.type))) throw new Error("DECISION_SCOPE_MISMATCH");
    for (const file of input.evidence) await verifyFile(file);
    const record = { ...normalized, id: `decision-${randomUUID()}`, contractVersion: 1, requestDigest,
      recordedAt: new Date().toISOString(), authority: "agent-decision-not-user-approval", costSnapshot: snapshot(state, s) };
    (s.project.productionDecisions ||= []).push(record);
    return record;
  });
}

export async function getProductionProgress(input) { return productionProgress(await readState(), input); }
