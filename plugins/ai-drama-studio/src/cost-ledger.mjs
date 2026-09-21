import { z } from "zod";
import { PRICE_PRESETS } from "./provider-presets.mjs";

const kinds = ["seedream-image", "seedance-video", "asr", "tts", "music", "fal-image", "fal-video", "replicate-image"];
export const priceRuleSchema = z.object({
  kind: z.string().refine(v => kinds.includes(v) || /^[a-z0-9-]+-(image|video|audio)$/.test(v)), model: z.string().trim().min(1).max(160),
  provider: z.string().regex(/^[a-z0-9-]{1,100}$/).optional(), profile: z.string().regex(/^[a-z0-9-]{1,100}$/).optional(),
  variant: z.string().regex(/^[a-z0-9-]{1,100}$/).optional(),
  conditions: z.object({ resolution: z.enum(["480p", "580p", "720p", "1080p"]), videoInput: z.boolean().optional() }).strict().optional(),
  currency: z.string().regex(/^[A-Z]{3}$/), unit: z.enum(["request", "image", "second", "character", "million_tokens", "megapixel"]),
  rate: z.number().finite().nonnegative().max(1000000),
  source: z.string().trim().min(1).max(500)
}).strict().superRefine((rule, ctx) => {
  if (!kinds.includes(rule.kind) && (!rule.provider || rule.kind !== `${rule.provider}-${rule.kind.split("-").at(-1)}`)) ctx.addIssue({ code: "custom", message: "COST_PROVIDER_REQUIRED_AND_MUST_MATCH_KIND" });
  if (Boolean(rule.variant) !== Boolean(rule.conditions)) ctx.addIssue({ code: "custom", message: "COST_VARIANT_CONDITIONS_REQUIRED" });
  const allowed = { "seedream-image": ["request", "image"], "seedance-video": ["request", "second", "million_tokens"], asr: ["request", "second"], tts: ["request", "character"], music: ["request", "second"], "fal-image": ["request", "image", "megapixel"], "fal-video": ["request", "second"], "replicate-image": ["request", "image"] };
  const units = allowed[rule.kind] || (rule.kind.endsWith("image") ? ["request", "image", "megapixel"] : rule.kind.endsWith("video") ? ["request", "second", "million_tokens"] : ["request", "character", "second"]);
  if (!units.includes(rule.unit)) ctx.addIssue({ code: "custom", message: "COST_UNIT_UNSUPPORTED_FOR_KIND" });
});
export const settlementSchema = z.object({
  receiptId: z.string().trim().min(1).max(160), currency: z.string().regex(/^[A-Z]{3}$/),
  amount: z.number().finite().nonnegative().max(1000000000),
  source: z.string().trim().min(1).max(500)
}).strict();

export function callModel(call) {
  return call.model || call.requestSnapshot?.model || null;
}

// Only numeric usage fields are retained: no prompts, headers, audio or URLs.
export function numericUsage(value, depth = 0) {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 2) return null;
  const result = {};
  for (const [key, item] of Object.entries(value).slice(0, 64)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(key) || /key|token_secret|authorization|password/i.test(key)) continue;
    if (typeof item === "number" && Number.isFinite(item) && item >= 0) result[key] = item;
    else if (item && typeof item === "object") {
      const nested = numericUsage(item, depth + 1);
      if (nested) result[key] = nested;
    }
  }
  return Object.keys(result).length ? result : null;
}

export function priceProvider(rule) { return rule.provider === "doubao-speech" ? "speech" : rule.provider || (["asr", "tts", "music"].includes(rule.kind) ? "speech" : rule.kind?.startsWith("fal-") ? "fal" : rule.kind?.startsWith("replicate-") ? "replicate" : "ark"); }
const priceKind = kind => kind === "seedream-image" ? "ark-image" : kind;
const priceModel = model => model === "doubao-seedream-5-0-lite-260128" ? "doubao-seedream-5-0-260128" : model;
const callProfile = call => call.profile || ({ "seedream-image": "ark-seedream", "seedance-video": "ark", asr: "speech", tts: "speech", music: "speech" }[call.kind]);
const priceIdentity = r => `${priceProvider(r)}|${priceKind(r.kind)}|${priceModel(r.model)}|${r.profile || ""}|${r.variant || ""}`;
export function effectivePrices(state) {
  const overrides = state.settings.costPrices || [];
  return [...PRICE_PRESETS.filter(p => !overrides.some(r => priceIdentity(r) === priceIdentity(p))), ...overrides];
}
export function setPriceRule(state, input) {
  const rule = { ...priceRuleSchema.parse(input), recordedAt: new Date().toISOString() };
  rule.provider = priceProvider(rule);
  state.settings.costPrices = (state.settings.costPrices || []).filter(item => priceIdentity(item) !== priceIdentity(rule));
  state.settings.costPrices.push(rule);
  return rule;
}

export function freezeCallCost(state, call, quantities = {}) {
  // Freeze once, inside the existing atomic call reservation. Never charge or retry here.
  if (call.cost) return call.cost;
  const model = callModel(call);
  const request = call.requestSnapshot;
  const context = call.pricingContext || { resolution: request?.parameters?.resolution,
    videoInput: Array.isArray(request?.inputs) ? request.inputs.some(i => ["reference_video", "video"].includes(i.providerRole) || i.kind === "video") : undefined };
  const matches = item => priceKind(item.kind) === priceKind(call.kind) && priceModel(item.model) === priceModel(model) && priceProvider(item) === priceProvider(call) && (!item.profile || item.profile === callProfile(call))
    && (!item.conditions || Object.entries(item.conditions).every(([key, value]) => context[key] === value));
  const rule = (state.settings.costPrices || []).find(matches) || PRICE_PRESETS.find(matches);
  const quantity = rule?.unit === "request" ? 1 : quantities[rule?.unit];
  const valid = rule && Number.isFinite(quantity) && quantity >= 0;
  call.cost = { version: 2, model, frozenRule: rule ? structuredClone(rule) : null, requestedQuantities: numericUsage(quantities), estimate: valid ? {
    amount: Number((rule.rate * quantity).toFixed(8)), currency: rule.currency,
    quantity, unit: rule.unit, rate: rule.rate, source: rule.source, priceRecordedAt: rule.recordedAt
  } : null, estimateStatus: valid ? "estimated-not-billed" : rule ? "quantity-unknown" : "price-not-configured", settlements: [] };
  return call.cost;
}

// fal bills rounded-up output megapixels, not image count or inference time.
export function falImageUsage(output) {
  const images = output?.images;
  const known = Array.isArray(images) && images.length > 0 && images.every(i => Number.isInteger(i.width) && i.width > 0 && Number.isInteger(i.height) && i.height > 0);
  return numericUsage({ ...output?.timings, ...(known ? { billing_megapixels: images.reduce((n, i) => n + Math.ceil(i.width * i.height / 1000000), 0) } : {}) });
}

function callEstimate(call) {
  const cost = call.cost?.frozenRule || call.cost?.estimate ? call.cost : call.cost?.backfill || call.cost, rule = cost?.frozenRule;
  // Use the original price, or an explicitly requested, separately preserved backfill.
  const raw = rule?.unit === "million_tokens" ? call.usage?.completion_tokens
    : rule?.unit === "megapixel" ? call.usage?.billing_megapixels
    : call.kind === "music" && rule?.unit === "second" ? call.usage?.billing_duration_seconds : undefined;
  const quantity = rule?.unit === "million_tokens" ? raw / 1000000 : raw;
  if (Number.isFinite(quantity) && quantity >= 0) return {
    estimate: { amount: Number((rule.rate * quantity).toFixed(8)), currency: rule.currency, quantity, unit: rule.unit, rate: rule.rate, source: rule.source, priceRecordedAt: rule.recordedAt },
    estimateStatus: "provider-usage-estimated-not-billed"
  };
  return { estimate: cost?.estimate || null, estimateStatus: cost?.estimateStatus || "historical-unknown" };
}

export function backfillCostEstimates(state) {
  const result = { updated: 0, retained: 0, missingEvidence: 0, missingPrice: 0, notSucceeded: 0 };
  for (const call of state.providerCalls || []) {
    if (call.cost?.frozenRule || call.cost?.estimate || call.cost?.backfill) { result.retained++; continue; }
    if (call.status !== "succeeded") { result.notSucceeded++; continue; }
    const job = (state.speechJobs || []).find(j => j.id === call.jobId && j.requestDigest && j.requestDigest === call.requestDigest);
    const snapshot = job?.snapshot;
    const model = callModel(call) || snapshot?.profile?.resourceId || snapshot?.profile?.model;
    const quantities = { second: snapshot?.audio?.durationSeconds, character: typeof snapshot?.text === "string" ? [...snapshot.text].length : undefined, ...call.cost?.requestedQuantities };
    const candidate = { ...call, model, cost: undefined };
    freezeCallCost(state, candidate, quantities);
    const calculated = callEstimate(candidate);
    if (!candidate.cost.frozenRule) { result.missingPrice++; continue; }
    if (!calculated.estimate) result.missingEvidence++;
    call.cost ||= { version: 1, model: callModel(call), estimate: null, estimateStatus: "historical-unknown", settlements: [] };
    call.cost.backfill = { ...candidate.cost, ...calculated, recordedAt: new Date().toISOString(), basis: "current-price-and-recorded-usage" };
    if (calculated.estimate) result.updated++;
  }
  return result;
}

export function recordSettlement(state, callId, input) {
  const receipt = settlementSchema.parse(input);
  const call = (state.providerCalls || []).find(item => item.id === callId);
  if (!call) throw new Error("COST_CALL_NOT_FOUND");
  call.cost ||= { version: 1, model: callModel(call), estimate: null, estimateStatus: "historical-unknown", settlements: [] };
  const existing = call.cost.settlements.find(item => item.receiptId === receipt.receiptId);
  if (existing) {
    if (["amount", "currency", "source"].some(key => existing[key] !== receipt[key])) throw new Error("COST_RECEIPT_CONFLICT");
    return existing;
  }
  if (call.cost.settlements.some(item => item.currency !== receipt.currency)) throw new Error("COST_RECEIPT_CURRENCY_CHANGED");
  const entry = { ...receipt, recordedAt: new Date().toISOString(), evidenceType: "operator-recorded-provider-bill" };
  // Each new receipt is the cumulative net bill for THIS call, not an additional charge.
  call.cost.settlements.push(entry);
  return entry;
}

export function costReport(state, { projectId, creationId, shotId } = {}) {
  const records = (state.providerCalls || []).filter(call => (!projectId || call.projectId === projectId) && (!creationId || call.creationId === creationId) && (!shotId || call.shotId === shotId)).map(call => ({
    callId: call.id, projectId: call.projectId, creationId: call.creationId || null, shotId: call.shotId || null,
    kind: call.kind, model: callModel(call), status: call.status,
    provider: priceProvider(call),
    providerTaskId: call.providerTaskId || null, requestDigest: call.requestDigest || null,
    at: call.createdAt || call.at || null, usage: numericUsage(call.usage), requestedQuantities: call.cost?.requestedQuantities || null,
    ...callEstimate(call),
    actual: call.cost?.settlements?.at(-1) || null, settlementHistory: call.cost?.settlements || [],
    billingStatus: call.cost?.settlements?.length ? "recorded-bill" : "unreconciled"
  }));
  const currencies = {};
  for (const record of records) {
    for (const [field, value] of [["estimated", record.estimate], ["actual", record.actual], ["unreconciledEstimate", record.actual ? null : record.estimate]]) {
      if (!value) continue;
      currencies[value.currency] ||= { estimated: 0, actual: 0, unreconciledEstimate: 0 };
      currencies[value.currency][field] = Number((currencies[value.currency][field] + value.amount).toFixed(8));
    }
  }
  return { records, currencies, calls: records.length,
    unpricedCalls: records.filter(item => !item.estimate).length,
    unreconciledCalls: records.filter(item => !item.actual).length,
    boundary: "Estimates and recorded bills are separate, never summed or currency-converted. Failed/uncertain calls are not assumed free. charged means call-cap consumption, not money. Codex host billing and local electricity/hardware costs are outside this ledger. No spending authorization is changed." };
}
