import test from "node:test";
import assert from "node:assert/strict";
import { costReport, setPriceRule, freezeCallCost, recordSettlement, numericUsage } from "../src/cost-ledger.mjs";
import { getToolCatalog } from "../src/tool-catalog.mjs";
import { generateSeedreamImage } from "../src/ark.mjs";

test("cost estimates freeze once; receipts are idempotent and currencies never combine", () => {
  const state = { settings: {}, providerCalls: [] };
  const rule = { kind: "seedance-video", model: "test-model", currency: "CNY", unit: "second", rate: 0.2, source: "synthetic fixture, not live pricing" };
  setPriceRule(state, rule);
  const call = { id: "one", kind: rule.kind, requestSnapshot: { model: rule.model }, projectId: "p", shotId: "s", status: "uncertain", charged: true };
  state.providerCalls.push(call);
  freezeCallCost(state, call, { second: 5 });
  setPriceRule(state, { ...rule, rate: 8 });
  freezeCallCost(state, call, { second: 20 });
  assert.equal(call.cost.estimate.amount, 1);
  assert.equal(costReport(state).unreconciledCalls, 1);
  assert.equal(costReport(state).currencies.CNY.actual, 0);
  assert.equal(costReport(state).records[0].actual, null);
  const receipt = { receiptId: "bill-1", currency: "CNY", amount: 0.8, source: "synthetic bill" };
  recordSettlement(state, call.id, receipt);
  recordSettlement(state, call.id, receipt);
  assert.equal(call.cost.settlements.length, 1);
  assert.throws(() => recordSettlement(state, call.id, { ...receipt, amount: 1 }), /RECEIPT_CONFLICT/);
  assert.throws(() => recordSettlement(state, call.id, { ...receipt, receiptId: "other", currency: "USD" }), /CURRENCY_CHANGED/);
  recordSettlement(state, call.id, { ...receipt, receiptId: "refund-net-bill", amount: 0.3 });
  const usd = { id: "two", kind: "tts", model: "test-tts", projectId: "p2", status: "failed" };
  state.providerCalls.push(usd);
  recordSettlement(state, usd.id, { ...receipt, currency: "USD", amount: 2 });
  const report = costReport(state);
  assert.equal(report.currencies.CNY.actual, 0.3);
  assert.equal(report.currencies.USD.actual, 2);
  assert.equal(report.currencies.CNY.unreconciledEstimate, 0);
  assert.equal(report.records[0].settlementHistory.length, 2);
  assert.equal(costReport(state, { projectId: "p", shotId: "s" }).calls, 1);
  assert.equal(costReport(state, { creationId: "missing" }).calls, 0);
});

test("unknown rates and historical failed calls remain unknown, not retroactively repriced", () => {
  const state = { settings: {}, providerCalls: [{ id: "legacy", kind: "music", status: "failed" }] };
  const call = { id: "unknown", kind: "seedance-video", model: "test", status: "submitted" };
  state.providerCalls.push(call);
  freezeCallCost(state, call, { second: 4 });
  setPriceRule(state, { kind: call.kind, model: "test", unit: "second", currency: "CNY", rate: 1, source: "fixture" });
  assert.equal(costReport(state).unpricedCalls, 2);
  assert.deepEqual(costReport(state).currencies, {});
  assert.equal(call.cost.estimateStatus, "price-not-configured");
  assert.deepEqual(costReport(state).records[1].requestedQuantities, { second: 4 });
  assert.throws(() => setPriceRule(state, { kind: "music", model: "test", unit: "character", currency: "CNY", rate: 1, source: "fixture" }), /UNIT_UNSUPPORTED/);
  assert.throws(() => recordSettlement(state, "missing", { receiptId: "a", currency: "CNY", amount: 0, source: "fixture" }), /CALL_NOT_FOUND/);
  assert.deepEqual(numericUsage({ completion_tokens: 123, url: "secret", api_key: 123, nested: { tokens: 8, prompt: "secret" } }), { completion_tokens: 123, nested: { tokens: 8 } });
});

test("catalog separates host availability, credentials, dependency readiness and historical evidence", async () => {
  const state = { settings: { seedanceModel: "doubao-seedance-2-5-260628", seedreamModel: "image-model" }, providerCalls: [
    { id: "old-model", kind: "seedance-video", model: "old", status: "succeeded" },
    { id: "current", kind: "seedance-video", requestSnapshot: { model: "doubao-seedance-2-5-260628" }, status: "download-pending", providerStatus: "succeeded" }
  ] };
  const options = { probeDependencies: async () => ({ ffmpeg: true, ffprobe: true, filters: { loudnorm: true, afftdn: false } }) };
  const catalog = await getToolCatalog(state, { arkConfigured: true, speechConfigured: false }, options);
  const entry = id => catalog.entries.find(item => item.id === id);
  assert.equal(new Set(catalog.entries.map(item => item.id)).size, catalog.entries.length);
  assert.equal(entry("codex-imagegen").readiness, "host-session-dependent");
  assert.equal(entry("seedance-video").readiness, "credential-configured-not-entitlement-verified");
  assert.equal(entry("seedance-video").historicalProviderSuccess.callId, "current");
  assert.equal(entry("seedance-video").historicalProviderSuccess.currentEntitlementVerified, false);
  assert.equal(entry("speech-asr").readiness, "credential-missing");
  assert.equal(entry("drama_process_local_audio/normalize").readiness, "dependency-ready");
  assert.equal(entry("drama_process_local_audio/denoise").readiness, "dependency-missing");
  assert.equal(entry("real-esrgan-upscale").adapterImplemented, true);
  assert.equal(entry("real-esrgan-upscale").readiness, "runtime-missing");
});

test("image provider usage survives a subsequent download failure", async () => {
  const originalFetch = globalThis.fetch;
  let recorded;
  globalThis.fetch = async (_url, options) => options?.method === "POST"
    ? Response.json({ usage: { generated_images: 1 }, data: [{ url: "https://fixture.invalid/image" }] })
    : new Response("unavailable", { status: 503 });
  try {
    await assert.rejects(generateSeedreamImage({ apiKey: "fake", baseUrl: "https://fixture.invalid", model: "fake", prompt: "fixture", outputPath: "unused", onUsage: value => { recorded = value; } }), /DOWNLOAD_FAILED/);
    assert.deepEqual(recorded, { generated_images: 1 });
  } finally { globalThis.fetch = originalFetch; }
});
