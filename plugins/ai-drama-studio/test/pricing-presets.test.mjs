import test from "node:test";
import assert from "node:assert/strict";
import { PRICE_PRESETS, SPEECH_PRICE_MODELS } from "../src/provider-presets.mjs";
import { freezeCallCost, costReport, effectivePrices, setPriceRule, priceRuleSchema, falImageUsage } from "../src/cost-ledger.mjs";
import { usageDashboard } from "../src/usage-dashboard.mjs";

const state = () => ({ settings: {}, providerCalls: [] });
const editable = ({ recordedAt, specification, preset, ...rule }) => rule;
const seedance = (resolution, videoInput) => ({ kind: "seedance-video", requestSnapshot: {
  model: "doubao-seedance-2-5-260628", parameters: { resolution, duration: 5 },
  inputs: videoInput ? [{ providerRole: "reference_video" }] : [{ providerRole: "reference_image" }]
} });

test("all official rates validate, with all three speech services priced", () => {
  for (const rule of PRICE_PRESETS) assert.deepEqual(priceRuleSchema.parse(editable(rule)), editable(rule));
  for (const model of SPEECH_PRICE_MODELS) assert.ok(PRICE_PRESETS.some(p => p.model === model.model && p.unit === model.unit));
});

test("Seedance selects resolution/reference token rates and freezes them until usage arrives", () => {
  for (const [resolution, plain, reference] of [["480p", 70, 42], ["720p", 70, 42], ["1080p", 77, 46]]) {
    for (const [video, rate] of [[false, plain], [true, reference]]) {
      const s = state(), call = seedance(resolution, video);
      s.providerCalls.push(call);
      freezeCallCost(s, call, { second: 5 });
      assert.equal(call.cost.estimateStatus, "quantity-unknown");
      assert.equal(call.cost.frozenRule.rate, rate);
      setPriceRule(s, { ...editable(call.cost.frozenRule), rate: 999 });
      call.usage = { completion_tokens: 108000, total_tokens: 9999999 };
      const report = costReport(s).records[0];
      assert.equal(report.estimate.amount, Number((rate * .108).toFixed(8)));
      assert.equal(report.estimateStatus, "provider-usage-estimated-not-billed");
      assert.equal(report.actual, null);
      assert.equal(call.cost.estimate, null); // Read-only reporting, original reservation retained.
    }
  }
});

test("unknown geometry/reference context never silently uses a cheaper token rate", () => {
  for (const call of [seedance("adaptive", true), { kind: "seedance-video", model: "doubao-seedance-2-5-260628" }]) {
    freezeCallCost(state(), call, { second: 5 });
    assert.equal(call.cost.estimateStatus, "price-not-configured");
  }
  const call = seedance("720p", false);
  call.requestSnapshot.parameters.generate_audio = true;
  freezeCallCost(state(), call);
  assert.equal(call.cost.frozenRule.rate, 70);
});

test("Seedream native and provider routes, including the official Lite alias, use the same price", () => {
  for (const model of ["doubao-seedream-5-0-260128", "doubao-seedream-5-0-lite-260128"]) {
    for (const call of [{ kind: "seedream-image", requestSnapshot: { model } }, { provider: "ark", profile: "ark-seedream", kind: "ark-image", model }]) {
      freezeCallCost(state(), call, { image: 1 });
      assert.equal(call.cost.estimate.amount, .22);
    }
  }
  const call = { kind: "seedream-image", model: "doubao-seedream-5-0-pro-260628" };
  freezeCallCost(state(), call, { image: 1 });
  assert.equal(call.cost.estimate, null);
});

test("speech units are service-specific; music uses original returned duration", () => {
  for (const [kind, model, quantities, amount] of [
    ["asr", "volc.bigasr.auc_turbo", { second: 3600 }, 4.5],
    ["tts", "seed-tts-2.0", { character: 10000 }, 3]
  ]) {
    const call = { kind, model, provider: "doubao-speech" };
    freezeCallCost(state(), call, quantities);
    assert.equal(call.cost.estimate.amount, amount);
  }
  const s = state(), call = { kind: "music", model: "seed-audio-1.0", provider: "doubao-speech" };
  s.providerCalls.push(call);
  freezeCallCost(s, call);
  assert.equal(call.cost.estimateStatus, "quantity-unknown");
  call.usage = { billing_duration_seconds: 60 };
  assert.equal(costReport(s).records[0].estimate.amount, 1);
});

test("fal pricing uses resolution and frame-based seconds, not Replicate image pricing", () => {
  for (const [resolution, rate] of [["480p", .04], ["580p", .06], ["720p", .08]]) {
    const call = { provider: "fal", profile: "fal-wan", kind: "fal-video", model: "fal-ai/wan/v2.2-a14b/text-to-video", pricingContext: { resolution } };
    freezeCallCost(state(), call, { second: 81 / 16 });
    assert.equal(call.cost.estimate.amount, Number((rate * 81 / 16).toFixed(8)));
  }
  const s = state(), call = { provider: "fal", profile: "fal-flux", kind: "fal-image", model: "fal-ai/flux/schnell" };
  s.providerCalls.push(call);
  freezeCallCost(s, call, { image: 1 });
  assert.equal(call.cost.estimate, null);
  call.usage = falImageUsage({ images: [{ width: 1024, height: 1024 }], timings: { inference: 2 } });
  assert.equal(costReport(s).records[0].estimate.amount, .006);
  assert.equal(falImageUsage({ images: [{ width: 1024 }] }), null);
  assert.equal(falImageUsage({ images: [{ width: 1000, height: 1000 }, { width: 1024, height: 1024 }] }).billing_megapixels, 3);
  const replica = { provider: "replicate", profile: "replicate-flux", kind: "replicate-image", model: "black-forest-labs/flux-schnell" };
  freezeCallCost(s, replica, { image: 1 });
  assert.equal(replica.cost.estimate.amount, .003);
});

test("variant overrides affect only their own specification; old estimates and history stay intact", () => {
  const s = state(), preset = PRICE_PRESETS.find(p => p.variant === "720p-no-video");
  setPriceRule(s, { ...editable(preset), rate: 50 });
  const rules = effectivePrices(s).filter(p => p.profile === "ark");
  assert.equal(rules.length, 6);
  assert.equal(rules.find(p => p.variant === "720p-no-video").rate, 50);
  assert.equal(rules.find(p => p.variant === "720p-video").rate, 42);
  assert.throws(() => priceRuleSchema.parse({ ...editable(preset), conditions: undefined }), /CONDITIONS_REQUIRED/);
  s.providerCalls.push({ ...seedance("720p", false), usage: { completion_tokens: 108000 } });
  assert.equal(costReport(s).records[0].estimate, null);
  assert.deepEqual(usageDashboard(s).summary.estimateGaps, { historical: 1, quantity: 0, price: 0 });
});
