import test from "node:test";
import assert from "node:assert/strict";
import { backfillCostEstimates, costReport } from "../src/cost-ledger.mjs";

test("backfill preserves originals and bills, uses recorded quantities, and is idempotent", () => {
  const old = { version: 1, estimateStatus: "price-not-configured", estimate: null, requestedQuantities: { second: 20 }, settlements: [{ receiptId: "bill", currency: "CNY", amount: 0.01 }] };
  const state = { settings: {}, providerCalls: [
    { id: "asr", kind: "asr", model: "volc.bigasr.auc_turbo", status: "succeeded", cost: structuredClone(old) },
    { id: "video", kind: "seedance-video", model: "doubao-seedance-2-5-260628", status: "succeeded", pricingContext: { resolution: "720p", videoInput: false }, usage: { completion_tokens: 100000 } },
    { id: "missing", kind: "seedance-video", model: "doubao-seedance-2-5-260628", status: "succeeded", pricingContext: { resolution: "720p", videoInput: false } },
    { id: "failed", kind: "asr", model: "volc.bigasr.auc_turbo", status: "failed", cost: structuredClone(old) },
    { id: "host", kind: "codex-imagegen", status: "succeeded" }
  ] };
  assert.deepEqual(backfillCostEstimates(state), { updated: 2, retained: 0, missingEvidence: 1, missingPrice: 1, notSucceeded: 1 });
  const { backfill, ...original } = state.providerCalls[0].cost;
  assert.deepEqual(original, old);
  assert.equal(backfill.basis, "current-price-and-recorded-usage");
  const report = costReport(state);
  assert.equal(report.records[0].estimate.amount, 0.025);
  assert.equal(report.records[0].actual.amount, 0.01);
  assert.equal(report.records[1].estimate.amount, 7);
  assert.equal(report.records[1].actual, null);
  assert.equal(report.records[2].estimate, null);
  const saved = structuredClone(state);
  state.settings.costPrices = [{ kind: "asr", model: "volc.bigasr.auc_turbo", currency: "CNY", unit: "second", rate: 99, source: "discount" }];
  assert.equal(backfillCostEstimates(state).updated, 0);
  assert.deepEqual(state.providerCalls, saved.providerCalls);
});

test("existing estimates are never repriced; speech recovery requires matching request digest", () => {
  const state = { settings: {}, providerCalls: [
    { id: "frozen", status: "succeeded", cost: { estimate: { amount: 4 } } },
    { id: "speech", jobId: "j", requestDigest: "same", kind: "tts", status: "succeeded" },
    { id: "wrong", jobId: "j", requestDigest: "different", kind: "tts", status: "succeeded" }
  ], speechJobs: [{ id: "j", requestDigest: "same", snapshot: { profile: { resourceId: "seed-tts-2.0" }, text: "你好" } }] };
  assert.equal(backfillCostEstimates(state).updated, 1);
  assert.equal(costReport(state).records[0].estimate.amount, 4);
  assert.ok(costReport(state).records[1].estimate.amount > 0);
  assert.equal(costReport(state).records[2].estimate, null);
});
