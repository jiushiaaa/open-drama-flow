import test from "node:test";
import assert from "node:assert/strict";
import { usageDashboard } from "../src/usage-dashboard.mjs";

const call = (id, at, provider = "ark", model = "doubao-seedance-2-5-260628", amount = 2) => ({ id, at, provider, model, kind: "seedance-video", status: "succeeded", cost: { estimate: { amount, currency: "CNY" }, settlements: [] } });
const state = { settings: {}, providerCalls: [call("before", "2026-09-19T23:59:59.999Z"), call("start", "2026-09-20T00:00:00.000Z"), call("end", "2026-09-20T23:59:59.999Z"), call("after", "2026-09-21T00:00:00.000Z"), call("speech", "2026-09-20T12:00:00Z", "speech", "seed-tts-2.0", 1)] };

test("date filters include both UTC day boundaries, agree across totals, tables and trend", () => {
  const r = usageDashboard(state, { from: "2026-09-20", to: "2026-09-20", provider: "ark" });
  assert.deepEqual(r.records.map(c => c.callId), ["end", "start"]);
  assert.equal(r.summary.calls, 2);
  assert.equal(r.summary.currencies.CNY.estimated, 4);
  assert.equal(r.trend.length, 1);
  assert.equal(r.trend[0].currencies.CNY.estimated, 4);
  assert.equal(r.byProvider[0].calls, 2);
  assert.equal(usageDashboard(state).summary.calls, 5);
  assert.equal(usageDashboard(state, { from: "2026-09-21" }).summary.calls, 1);
  assert.equal(usageDashboard(state, { to: "2026-09-19" }).summary.calls, 1);
});
test("reject invalid calendar dates and inverted ranges", () => {
  for (const filters of [{ from: "2026-02-30" }, { to: "2026-13-01" }, { from: "2026-09-21", to: "2026-09-20" }]) assert.throws(() => usageDashboard(state, filters));
});
test("catalog contains real vendor names and models without usage; empty selections do not fall back", () => {
  const r = usageDashboard(state, { provider: "ark", model: "doubao-seedream-5-0-260128" });
  assert.equal(r.filterOptions.vendors.find(v => v.id === "ark").name, "火山方舟");
  assert.ok(r.filterOptions.models.some(m => m.provider === "speech" && m.model === "seed-tts-2.0"));
  assert.ok(r.filterOptions.models.some(m => m.provider === "ark" && m.model === "doubao-seedream-5-0-260128"));
  assert.equal(r.summary.calls, 0);
  assert.deepEqual(r.records, []);
  assert.deepEqual(r.trend, []);
  assert.deepEqual(r.byModel, []);
  assert.equal(usageDashboard(state, { provider: "speech", model: "doubao-seedance-2-5-260628" }).summary.calls, 0);
});
