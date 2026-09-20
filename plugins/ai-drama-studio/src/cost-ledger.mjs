import { z } from "zod";

const kinds = ["seedream-image", "seedance-video", "asr", "tts", "music", "fal-image", "fal-video", "replicate-image"];
export const priceRuleSchema = z.object({
  kind: z.enum(kinds), model: z.string().trim().min(1).max(160),
  currency: z.string().regex(/^[A-Z]{3}$/), unit: z.enum(["request", "image", "second", "character"]),
  rate: z.number().finite().nonnegative().max(1000000),
  source: z.string().trim().min(1).max(500)
}).strict().superRefine((rule, ctx) => {
  const allowed = { "seedream-image": ["request", "image"], "seedance-video": ["request", "second"], asr: ["request", "second"], tts: ["request", "character"], music: ["request"], "fal-image": ["request", "image"], "fal-video": ["request", "second"], "replicate-image": ["request", "image"] };
  if (!allowed[rule.kind].includes(rule.unit)) ctx.addIssue({ code: "custom", message: "COST_UNIT_UNSUPPORTED_FOR_KIND" });
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

export function setPriceRule(state, input) {
  const rule = { ...priceRuleSchema.parse(input), recordedAt: new Date().toISOString() };
  state.settings.costPrices = (state.settings.costPrices || []).filter(item => item.kind !== rule.kind || item.model !== rule.model);
  state.settings.costPrices.push(rule);
  return rule;
}

export function freezeCallCost(state, call, quantities = {}) {
  // Freeze once, inside the existing atomic call reservation. Never charge or retry here.
  if (call.cost) return call.cost;
  const model = callModel(call);
  const rule = (state.settings.costPrices || []).find(item => item.kind === call.kind && item.model === model);
  const quantity = rule?.unit === "request" ? 1 : quantities[rule?.unit];
  const valid = rule && Number.isFinite(quantity) && quantity >= 0;
  call.cost = { version: 1, model, requestedQuantities: numericUsage(quantities), estimate: valid ? {
    amount: Number((rule.rate * quantity).toFixed(8)), currency: rule.currency,
    quantity, unit: rule.unit, rate: rule.rate, source: rule.source, priceRecordedAt: rule.recordedAt
  } : null, estimateStatus: valid ? "estimated-not-billed" : rule ? "quantity-unknown" : "price-not-configured", settlements: [] };
  return call.cost;
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
    provider: call.provider || (["asr", "tts", "music"].includes(call.kind) ? "speech" : "ark"),
    providerTaskId: call.providerTaskId || null, requestDigest: call.requestDigest || null,
    at: call.createdAt || call.at || null, usage: numericUsage(call.usage), requestedQuantities: call.cost?.requestedQuantities || null,
    estimate: call.cost?.estimate || null, estimateStatus: call.cost?.estimateStatus || "historical-unknown",
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
