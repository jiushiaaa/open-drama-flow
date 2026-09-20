import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { createHash } from "node:crypto";

const temp = await fs.mkdtemp(path.join(os.tmpdir(), "odf-vendors-"));
process.env.AI_DRAMA_DATA_DIR = temp;
process.env.LOCALAPPDATA = temp;
process.env.AI_DRAMA_PORT = "0";
const { PROFILES, VENDORS, PRICE_PRESETS } = await import("../src/provider-presets.mjs");
const { adapterSubmit, adapterPoll, adapterRequest, tencentHeaders } = await import("../src/provider-adapters.mjs");
const { providerPayload, prepareProviderJob, submitProviderJob, reconcileProviderJob, providerCatalog, providerRequestSchema } = await import("../src/providers.mjs");
const { saveCustomProvider, customProviderSchema, configuredProfiles } = await import("../src/provider-config.mjs");
const { publicAddress, providerUrl } = await import("../src/provider-network.mjs");
const { setPriceRule, freezeCallCost, effectivePrices, priceRuleSchema } = await import("../src/cost-ledger.mjs");
const { usageDashboard } = await import("../src/usage-dashboard.mjs");
const { mutateState, readState } = await import("../src/store.mjs");
await mutateState(s => { s.projects.push({ id: "fixture", shots: [], assets: [] }); });
test.after(async () => { assert.equal(path.dirname(temp), os.tmpdir()); await fs.rm(temp, { recursive: true, force: true }); });
const input = profile => ({ projectId: "fixture", requestKey: profile, profile, prompt: "测试 hello", maxCalls: 1, imageFallbackReason: "user-explicit-request", fallbackEvidence: "fixture" });
const makeJob = id => {
  const p = PROFILES.find(p => p.id === id), v = VENDORS.find(v => v.id === p.provider);
  return { ...p, payload: providerPayload(input(id)), connection: { provider: v.id, protocol: p.protocol, baseUrl: p.baseUrl || v.baseUrl, submitPath: p.submitPath, credentials: v.credentials }, providerTaskId: "task-1" };
};
const credentials = { apiKey: "fixture-secret", accessKey: "fixture-ak", secretKey: "fixture-sk" };
const media = "https://media.example.com/result.png";

test("catalog IDs, official models and price identities are unique", () => {
  assert.equal(new Set(PROFILES.map(p => p.id)).size, PROFILES.length);
  assert.equal(new Set(VENDORS.map(p => p.id)).size, VENDORS.length);
  assert.equal(new Set(PRICE_PRESETS.map(p => `${p.provider}/${p.profile}/${p.model}`)).size, PRICE_PRESETS.length);
  for (const p of PROFILES) assert.ok(VENDORS.some(v => v.id === p.provider));
  for (const p of PRICE_PRESETS) assert.ok(PROFILES.some(v => v.id === p.profile && v.model === p.model && v.provider === p.provider));
});

test("Windows vendor secrets round-trip encrypted and stay out of state/catalog", { skip: process.platform !== "win32" }, async () => {
  const { changeVendorSecret, credentialSlot } = await import("../src/provider-config.mjs");
  const { readProviderKey, credentialStatusPathForDebug } = await import("../src/secrets.mjs");
  assert.ok(credentialStatusPathForDebug().startsWith(temp + path.sep));
  const secret = "fixture-only-not-an-account-key";
  try {
    await changeVendorSecret("minimax-cn", "apiKey", secret);
    assert.equal(await readProviderKey(credentialSlot("minimax-cn", "apiKey")), secret);
    const catalog = await providerCatalog();
    assert.equal(catalog.vendors.find(v => v.id === "minimax-cn").credentialStatus.apiKey, true);
    assert.equal(catalog.vendors.find(v => v.id === "minimax").credentialStatus.apiKey, false);
    assert.ok(!JSON.stringify(catalog).includes(secret));
    assert.ok(!JSON.stringify(await readState()).includes(secret));
  } finally { await changeVendorSecret("minimax-cn", "apiKey", undefined, true); }
  assert.equal((await providerCatalog()).vendors.find(v => v.id === "minimax-cn").credentialStatus.apiKey, false);
});

for (const [id, response] of [
  ["minimax-image", { base_resp: { status_code: 0 }, data: { image_urls: [media] } }],
  ["minimax-cn-image", { data: { image_urls: [media] } }],
  ["minimax-tts", { data: { audio: media }, extra_info: { usage_characters: 12 } }],
  ["minimax-cn-tts", { data: { audio: media } }],
  ["zhipu-image", { data: [{ url: media }] }],
  ["tencent-image", { Response: { ResultImage: media } }]
]) test(`${id} synchronous output uses the intended endpoint and isolated credentials`, async () => {
  const job = makeJob(id);
  const result = await adapterSubmit(job, credentials, { fetcher: async (url, options) => {
    assert.equal(String(url), `${job.connection.baseUrl}${job.connection.submitPath}`);
    assert.equal(options.method, "POST"); assert.equal(options.redirect, "error");
    assert.deepEqual(JSON.parse(options.body), job.payload);
    assert.match(options.headers.Authorization, id === "tencent-image" ? /^TC3-HMAC-SHA256 Credential=fixture-ak/ : /^Bearer fixture-secret$/);
    if (id === "tencent-image") assert.equal(options.headers["X-TC-Action"], "TextToImageLite");
    return Response.json(response);
  } });
  assert.equal(result.status, "generated"); assert.deepEqual(result.outputUrls, [media]);
});

for (const [id, submit, done] of [
  ["minimax-video", { task_id: "task-1" }, { status: "Success", file_id: "123" }],
  ["minimax-cn-video", { task_id: "task-1" }, { status: "Success", file_id: "123" }],
  ["dashscope-image", { output: { task_id: "task-1" } }, { output: { task_status: "SUCCEEDED", results: [{ url: media }] } }],
  ["dashscope-video", { output: { task_id: "task-1" } }, { output: { task_status: "SUCCEEDED", video_url: media } }],
  ["tencent-video", { Response: { JobId: "task-1" } }, { Response: { Status: "DONE", ResultVideoUrl: media } }],
  ["kling-image", { code: 0, data: { task_id: "task-1" } }, { code: 0, data: { task_status: "succeed", task_result: { images: [{ url: media }] } } }],
  ["kling-video", { code: 0, data: { id: "task-1" } }, { code: 0, data: [{ id: "task-1", status: "succeeded", outputs: [{ type: "video", url: media }] }] }],
  ["zhipu-video", { id: "task-1", request_id: "not-the-task" }, { task_status: "SUCCESS", video_result: [{ url: media }] }],
  ["runway-image", { id: "task-1" }, { status: "SUCCEEDED", output: [media] }],
  ["runway-video", { id: "task-1" }, { status: "SUCCEEDED", output: [media] }]
]) test(`${id} persists original task ID and parses its query result`, async () => {
  const job = makeJob(id), calls = [];
  const deps = { fetcher: async (url, options) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) return Response.json(submit);
    if (String(url).includes("/files/retrieve")) return Response.json({ file: { download_url: media } });
    return Response.json(done);
  } };
  const started = await adapterSubmit(job, credentials, deps);
  assert.equal(started.providerTaskId, "task-1"); assert.equal(started.status, "submitted");
  assert.equal((await adapterPoll({ ...job, ...started }, credentials, deps)).outputUrls[0], media);
  assert.equal(calls.filter(c => c.options.method === "POST").length, id === "tencent-video" ? 2 : 1);
  if (id === "tencent-video") assert.equal(calls[1].options.headers["X-TC-Action"], "DescribeHunyuanToVideoJob");
  if (id.startsWith("dashscope")) assert.equal(calls[0].options.headers["X-DashScope-Async"], "enable");
  if (id.startsWith("runway")) assert.equal(calls[0].options.headers["X-Runway-Version"], "2024-11-06");
  if (id === "kling-video") assert.ok(calls[1].url.endsWith("/tasks?task_ids=task-1"));
});

test("fixed media specifications reject silently dropped input and image approval bypass", () => {
  assert.throws(() => providerPayload({ ...input("dashscope-video"), duration: 30 }), /DURATION/);
  assert.throws(() => providerPayload({ ...input("runway-video"), resolution: "1080p" }), /RESOLUTION/);
  assert.throws(() => providerPayload({ ...input("tencent-video"), duration: 5 }), /DURATION/);
  assert.throws(() => providerPayload({ ...input("minimax-video"), aspectRatio: "9:16" }), /ASPECT/);
  assert.throws(() => providerPayload({ ...input("zhipu-image"), prompt: "a".repeat(1001) }), /PROMPT_MAX/);
  assert.throws(() => providerPayload({ ...input("zhipu-video"), prompt: "a".repeat(513) }), /PROMPT_MAX_512/);
  assert.equal(providerPayload(input("zhipu-video")).duration, 5);
  assert.throws(() => providerPayload({ ...input("minimax-image"), resolution: "720p" }), /PARAMETER/);
  assert.throws(() => providerPayload({ ...input("runway-video"), frames: 80 }), /FRAMES/);
  assert.throws(() => providerPayload({ ...input("minimax-image"), imageFallbackReason: undefined }), /FALLBACK_EVIDENCE/);
  assert.throws(() => providerPayload({ ...input("dashscope-video"), referenceImages: [media] }), /Unrecognized/);
  assert.deepEqual(makeJob("kling-video").payload.settings, { aspect_ratio: "16:9", duration: 5, resolution: "720p", audio: "off", multi_shot: false });
});

test("network boundaries refuse local/private destinations and credential redirects before fetch", async () => {
  for (const value of ["http://example.com", "https://127.0.0.1", "https://169.254.169.254/latest", "https://user:secret@example.com", "https://example.com:444", "https://service.internal"]) assert.throws(() => providerUrl(value));
  for (const ip of ["10.1.2.3", "172.16.0.1", "192.168.1.1", "100.64.0.1", "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1"]) assert.equal(publicAddress(ip), false);
  assert.equal(publicAddress("8.8.8.8"), true);
  let fetched = false;
  await assert.rejects(adapterRequest(makeJob("minimax-video").connection, credentials, "https://attacker.example.com/query", "GET", undefined, { fetcher: async () => { fetched = true; } }), /URL_REJECTED/);
  assert.equal(fetched, false);
});

test("provider error bodies do not leak secrets and oversized responses are rejected", async () => {
  const p = makeJob("minimax-video").connection;
  await assert.rejects(adapterRequest(p, credentials, "/query", "GET", undefined, { fetcher: async () => Response.json({ base_resp: { status_code: 1004, status_msg: "fixture-secret" } }) }), /^Error: PROVIDER_RESPONSE_ERROR$/);
  await assert.rejects(adapterRequest(p, credentials, "/query", "GET", undefined, { fetcher: async () => new Response("fixture-secret") }), /^Error: PROVIDER_RESPONSE_INVALID_JSON$/);
  await assert.rejects(adapterRequest(p, credentials, "/query", "GET", undefined, { fetcher: async () => new Response("a".repeat(2100000)) }), /TOO_LARGE/);
  const signed = tencentHeaders("https://vclm.tencentcloudapi.com/", "{}", "SubmitHunyuanToVideoJob", "ak", "sk", 0);
  assert.match(signed.Authorization, /1970-01-01\/vclm\/tc3_request/); assert.equal(signed["X-TC-Timestamp"], "0");
});

const custom = { id: "custom-fixture", name: "Fixture API", protocol: "openai-image", baseUrl: "https://api.example.com/v1", model: "image-model", submitPath: "/images/generations" };
test("custom provider connections are immutable and restart-safe, with no arbitrary protocol", async () => {
  await saveCustomProvider(custom);
  assert.equal(configuredProfiles(await readState()).find(p => p.id === custom.id).kind, "image");
  await assert.rejects(saveCustomProvider({ ...custom, baseUrl: "https://other.example.com/v1" }), /IMMUTABLE/);
  assert.throws(() => customProviderSchema.parse({ ...custom, protocol: "chat" }));
  assert.throws(() => customProviderSchema.parse({ ...custom, baseUrl: "https://api.example.com/v1?api_key=secret" }));
  const p = configuredProfiles(await readState()).find(p => p.id === custom.id);
  assert.throws(() => providerPayload(input(custom.id), p), /USE_SQUARE/);
  const job = await prepareProviderJob({ ...input(custom.id), aspectRatio: "1:1" });
  assert.equal(job.connection.baseUrl, custom.baseUrl);
  assert.equal((await providerCatalog()).vendors.find(v => v.id === custom.id).credentialStatus.apiKey, false);
});

test("durable external jobs freeze cost, keep candidates outside library and block resubmission", async () => {
  const job = await prepareProviderJob(input("minimax-cn-tts")); let posts = 0;
  const deps = { readKey: async slot => { assert.equal(slot, "vendor-minimax-cn-apikey"); return "fixture"; }, fetcher: async () => { posts++; return Response.json({ data: { audio: media } }); } };
  const done = await submitProviderJob(job.id, false, deps);
  assert.equal(done.acceptance, "pending-no-library-import");
  const state = await readState(), call = state.providerCalls.find(c => c.id === done.callId);
  assert.equal(call.cost.estimate.quantity, 10); // two Han characters count double; space + hello
  assert.equal(call.cost.estimate.currency, "CNY"); assert.equal(state.projects[0].assets.length, 0);
  await reconcileProviderJob(job.id, deps); await assert.rejects(submitProviderJob(job.id, false, deps), /ALREADY_SUBMITTED/); assert.equal(posts, 1);
});

test("legacy request hashes resume the original job, including old schema defaults", async () => {
  const req = providerRequestSchema.parse({ ...input("fal-wan"), requestKey: "legacy", resolution: "720p" });
  const job = await prepareProviderJob(req);
  await mutateState(s => { const old = s.externalJobs.find(j => j.id === job.id); delete old.connection; old.requestDigest = createHash("sha256").update(JSON.stringify({ request: req, scopeDigest: old.scopeDigest })).digest("hex"); });
  assert.equal((await prepareProviderJob({ ...input("fal-wan"), requestKey: "legacy" })).id, job.id);
});

test("pricing isolates vendors/models/currencies, supports speech legacy identity, and never reprices history", () => {
  const state = { settings: {}, providerCalls: [] }, p = PRICE_PRESETS.find(p => p.profile === "minimax-cn-image");
  const call = { id: "old", provider: p.provider, profile: p.profile, model: p.model, kind: p.kind };
  freezeCallCost(state, call, { image: 1 }); assert.equal(call.cost.estimate.amount, 0.025);
  const { preset, specification, recordedAt, ...rule } = p; setPriceRule(state, { ...rule, rate: 0.01 });
  freezeCallCost(state, call, { image: 1 }); assert.equal(call.cost.estimate.amount, 0.025);
  assert.equal(freezeCallCost(state, { ...call, cost: undefined }, { image: 1 }).estimate.amount, 0.01);
  assert.equal(effectivePrices(state).filter(r => r.profile === p.profile).length, 1);
  const overseas = PRICE_PRESETS.find(p => p.profile === "minimax-image");
  assert.equal(freezeCallCost(state, { ...overseas, cost: undefined }, { image: 1 }).estimate.currency, "USD");
  setPriceRule(state, { provider: "speech", kind: "tts", model: "seed-tts-2.0", currency: "CNY", unit: "character", rate: 0.001, source: "fixture" });
  assert.equal(freezeCallCost(state, { provider: "doubao-speech", model: "seed-tts-2.0", kind: "tts" }, { character: 5 }).estimate.amount, 0.005);
  assert.throws(() => priceRuleSchema.parse({ ...rule, provider: undefined }));
  state.providerCalls = [call, { id: "other", provider: "runway", model: "different", kind: "runway-video" }];
  assert.deepEqual(usageDashboard(state, { provider: p.provider }).options.models, [p.model]);
});

test("HTTP custom configuration and routing enforce origin, schema and secret read boundaries", async () => {
  const { handler } = await import("../src/http-server.mjs"); const server = http.createServer(handler);
  await new Promise(r => server.listen(0, "127.0.0.1", r)); const url = `http://127.0.0.1:${server.address().port}`;
  const send = (route, data, origin = url, method = "POST") => fetch(url + route, { method, headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(data) });
  try {
    assert.equal((await send("/api/providers/custom", { ...custom, id: "custom-http" }, "https://evil.example.com")).status, 403);
    assert.equal((await send("/api/providers/custom", { ...custom, id: "custom-http" })).status, 200);
    assert.equal((await send("/api/providers", { video: "minimax-cn-video", fallbackImage: "custom-http", speech: "minimax-cn-tts" }, url, "PUT")).status, 200);
    assert.equal((await send("/api/providers", { video: "custom-http", fallbackImage: "ark-seedream" }, url, "PUT")).status, 400);
    assert.equal((await fetch(url + "/api/providers/minimax/credentials/apiKey")).status, 404);
    const catalog = await (await fetch(url + "/api/providers")).json(); assert.equal(catalog.selection.speech, "minimax-cn-tts");
    assert.equal(JSON.stringify(catalog).includes("fixture-secret"), false);
  } finally { server.closeAllConnections(); await new Promise(r => server.close(r)); }
});
