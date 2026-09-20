import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import http from "node:http";
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "odf-console-test-"));
process.env.AI_DRAMA_DATA_DIR = temp;
process.env.AI_DRAMA_PORT = "0";
const { mutateState, readState } = await import("../src/store.mjs");
const { providerPayload, prepareProviderJob, submitProviderJob, reconcileProviderJob, getProviderJob } = await import("../src/providers.mjs");
const { usageDashboard } = await import("../src/usage-dashboard.mjs");
const { searchShotAssets, selectWorkflow } = await import("../src/production-discovery.mjs");
const { fetchAccountBill, billHeaders } = await import("../src/billing-sync.mjs");
const { upscaleGeometry, upscaleRuntimeSchema, configureUpscale, createUpscale, startUpscale, getUpscale, fileHash } = await import("../src/upscale.mjs");
const { drainBackgroundJobs } = await import("../src/background-jobs.mjs");
await mutateState(s => { s.projects.push({ id: "fixture", title: "Fixture", shots: [], assets: [], creations: [{ id: "c", plan: { shots: [{ id: "shot", title: "雨夜" }] }, assetRefs: [] }] }); });
test.after(async () => { await drainBackgroundJobs(); assert.equal(path.dirname(temp), os.tmpdir()); await fs.rm(temp, { recursive: true, force: true }); });
const base = { projectId: "fixture", creationId: "c", shotId: "shot", requestKey: "one", profile: "fal-wan", prompt: "fixture", maxCalls: 1 };

test("provider schemas reject unsupported fields and preserve image-primary gate", () => {
  assert.equal(providerPayload(base).num_frames, 81);
  assert.throws(() => providerPayload({ ...base, referenceImages: ["a"] }), /Unrecognized/);
  assert.throws(() => providerPayload({ ...base, frames: 1000 }), /161/);
  assert.throws(() => providerPayload({ ...base, profile: "fal-flux" }), /FALLBACK_EVIDENCE/);
  assert.equal(providerPayload({ ...base, profile: "replicate-flux", imageFallbackReason: "user-explicit-request", fallbackEvidence: "test request" }).num_outputs, 1);
});

test("standalone Seedream stores a candidate URL without library admission or duplicate submissions", async () => {
  const input = { ...base, requestKey: "seedream-standalone", profile: "ark-seedream", imageFallbackReason: "verified-host-unavailable", fallbackEvidence: "generic Agent fixture has no Codex tool" };
  assert.throws(() => providerPayload({ ...input, referenceImages: ["must-not-drop"] }), /Unrecognized/);
  assert.throws(() => providerPayload({ ...input, imageFallbackReason: undefined }), /FALLBACK_EVIDENCE/);
  const job = await prepareProviderJob(input); let count = 0;
  const deps = { readKey: async provider => { assert.equal(provider, "ark"); return "fake-key"; }, fetcher: async (url, options) => {
    count++;
    assert.equal(String(url), "https://ark.cn-beijing.volces.com/api/v3/images/generations");
    assert.equal(options.headers.Authorization, "Bearer fake-key");
    assert.equal(JSON.parse(options.body).model, "doubao-seedream-5-0-260128");
    return Response.json({ data: [{ url: "https://fixture.volces.com/image.png" }], usage: { total_tokens: 1 } });
  } };
  const generated = await submitProviderJob(job.id, false, deps);
  assert.equal(generated.status, "generated");
  assert.equal(generated.acceptance, "pending-no-library-import");
  assert.equal((await readState()).projects[0].assets.length, 0);
  assert.equal((await reconcileProviderJob(job.id, deps)).status, "generated");
  await assert.rejects(submitProviderJob(job.id, false, deps), /ALREADY_SUBMITTED/);
  assert.equal(count, 1);
});

test("uncertain synchronous Seedream requests stay blocked, including a changed request key", async () => {
  const input = { ...base, requestKey: "seedream-timeout", profile: "ark-seedream", imageFallbackReason: "verified-host-unavailable", fallbackEvidence: "generic fixture" };
  const job = await prepareProviderJob(input);
  await assert.rejects(submitProviderJob(job.id, false, { readKey: async () => "fake", fetcher: async () => { throw new Error("timeout"); } }), /timeout/);
  await assert.rejects(reconcileProviderJob(job.id), /NO_AUTOMATIC_RESUBMIT/);
  await assert.rejects(prepareProviderJob({ ...input, requestKey: "seedream-bypass" }), /UNRESOLVED_SCOPE/);
  await mutateState(s => { s.externalJobs.find(j => j.id === job.id).status = "failed"; });
});
test("unknown paid submission cannot be retried; requestKey is idempotent", async () => {
  const prepared = await prepareProviderJob(base); let posts = 0;
  assert.equal((await prepareProviderJob(base)).id, prepared.id);
  await assert.rejects(prepareProviderJob({ ...base, prompt: "changed" }), /REQUEST_KEY_CONFLICT/);
  const deps = { readKey: async () => "fixture-key", fetcher: async () => { posts++; throw new Error("timeout"); } };
  await assert.rejects(submitProviderJob(prepared.id, false, deps), /timeout/);
  await assert.rejects(submitProviderJob(prepared.id, false, deps), /ALREADY_SUBMITTED/);
  assert.equal(posts, 1);
  assert.equal((await getProviderJob(prepared.id)).status, "submission-unknown");
  await assert.rejects(prepareProviderJob({ ...base, requestKey: "attempt-bypass" }), /UNRESOLVED_SCOPE/);
  // Isolate later fixtures; this is not a production reconciliation API.
  await mutateState(s => { s.externalJobs.find(j => j.id === prepared.id).status = "failed"; });
});
test("fal saves original ID, checks result, refuses credential-bearing external links", async () => {
  const job = await prepareProviderJob({ ...base, requestKey: "fal-success" });
  const seen = [];
  const deps = { readKey: async () => "fake", fetcher: async (url, options) => {
    seen.push({ url: String(url), method: options.method });
    if (options.method === "POST") return Response.json({ request_id: "original-id", status_url: "https://queue.fal.run/model/requests/original-id/status", response_url: "https://queue.fal.run/model/requests/original-id/response" });
    return Response.json(String(url).endsWith("status") ? { status: "COMPLETED", metrics: { inference_time: 2 } } : { video: { url: "https://fal.media/video.mp4" } });
  } };
  await submitProviderJob(job.id, false, deps);
  assert.equal((await reconcileProviderJob(job.id, deps)).status, "generated");
  await reconcileProviderJob(job.id, deps);
  assert.equal(seen.filter(x => x.method === "POST").length, 1);
  await mutateState(s => { const stored = s.externalJobs.find(j => j.id === job.id); stored.links.status = "https://attacker.invalid/status"; stored.status = "running"; });
  const count = seen.length;
  await assert.rejects(reconcileProviderJob(job.id, deps), /URL_REJECTED/); assert.equal(seen.length, count);
  await mutateState(s => { s.externalJobs.find(j => j.id === job.id).status = "failed"; });
});
test("replicate official-model request and manual policy require trusted approval", async () => {
  await mutateState(s => { s.settings.executionMode = "manual"; });
  const job = await prepareProviderJob({ ...base, requestKey: "replicate", profile: "replicate-flux", imageFallbackReason: "user-explicit-request", fallbackEvidence: "fixture" });
  const deps = { readKey: async () => "fake", fetcher: async (url, options) => {
    if (options.method === "POST") { assert.match(String(url), /\/models\/black-forest-labs\/flux-schnell\/predictions$/); assert.equal(JSON.parse(options.body).input.num_outputs, 1); return Response.json({ id: "replicate1" }); }
    return Response.json({ status: "succeeded", output: ["https://replicate.delivery/result.png"], metrics: { predict_time: 1 } });
  } };
  await assert.rejects(submitProviderJob(job.id, false, deps), /APPROVAL_REQUIRED/);
  await submitProviderJob(job.id, true, deps); assert.equal((await reconcileProviderJob(job.id, deps)).status, "generated");
  await mutateState(s => { s.settings.executionMode = "automatic"; });
});
test("scope edits invalidate prepared provider calls", async () => {
  const job = await prepareProviderJob({ ...base, requestKey: "scope" });
  await mutateState(s => { s.projects[0].creations[0].plan.shots[0].title = "Changed"; });
  await assert.rejects(submitProviderJob(job.id, false, { readKey: async () => "fake" }), /SCOPE_CHANGED/);
});
test("usage filters, pagination, and currency separation do not sum estimates and bills", () => {
  const state = { settings: {}, providerCalls: Array.from({ length: 25 }, (_, i) => ({ id: String(i), kind: "fal-video", provider: "fal", model: "wan", createdAt: "2026-09-20T00:00:00Z", cost: { estimate: { currency: "USD", amount: 1 }, settlements: i ? [] : [{ currency: "CNY", amount: 2 }] } })) };
  const result = usageDashboard(state, { page: 2 });
  assert.equal(result.records.length, 5); assert.equal(result.pages, 2);
  assert.equal(result.summary.currencies.USD.estimated, 25); assert.equal(result.summary.currencies.CNY.actual, 2);
  assert.equal(usageDashboard(state, { provider: "ark" }).summary.calls, 0);
  assert.equal(usageDashboard(state, { from: "2026-09-21" }).summary.calls, 0);
});
test("shot retrieval rejects stale/candidate scope and returns honest byte/acceptance evidence", async () => {
  const asset = { id: "asset", originalName: "雨夜参考", sha256: "hash", localPath: "fixture", kind: "image", version: 2 };
  const state = { projects: [{ id: "p", creations: [{ id: "c", worldId: "w", plan: { shots: [{ id: "s", title: "雨夜" }] }, assetRefs: [{ assetId: "asset", version: 2, locked: true }] }], assets: [asset, { ...asset, id: "stale", stale: true }, { ...asset, id: "candidate", scope: "candidate" }, { ...asset, id: "wrong-world", worldId: "other" }] }] };
  const result = await searchShotAssets(state, { projectId: "p", creationId: "c", shotId: "s" }, async () => "hash");
  assert.equal(result.results.length, 1); assert.equal(result.results[0].bytesCurrent, true); assert.equal(result.results[0].acceptance, "locked-reference");
  assert.equal((await searchShotAssets(state, { projectId: "p", creationId: "c", shotId: "s" }, async () => "changed")).results[0].bytesCurrent, false);
  assert.equal(selectWorkflow("drama", []).skills[0].enabled, false);
});
test("billing signatures, pagination and account attribution stay separate", async () => {
  const headers = billHeaders("{}", "fake-ak", "fake-sk", new Date("2026-09-20T00:00:00Z"));
  assert.equal(headers["x-date"], "20260920T000000Z"); assert.match(headers.authorization, /cn-beijing\/billing\/request/);
  let count = 0;
  const bill = await fetchAccountBill("2026-09", "fake-ak", "fake-sk", async (url, options) => {
    assert.equal(new URL(url).hostname, "billing.volcengineapi.com"); assert.equal(options.redirect, "error");
    const offset = JSON.parse(options.body).Offset; count++;
    return Response.json({ Result: { Total: 101, List: Array.from({ length: offset ? 1 : 100 }, (_, i) => ({ BillDetailId: String(i + offset), PayableAmount: "0.10", Currency: "CNY", Product: "ark", OwnerID: "private" })) } });
  });
  assert.equal(count, 2); assert.equal(bill.totals.CNY, 10.1); assert.equal(bill.rows[0].OwnerID, undefined); assert.equal(bill.attribution, "account-level-not-shot-level");
  await assert.rejects(fetchAccountBill("2026-09", "fake", "fake", async () => Response.json({ Result: { Total: 1, List: [] } })), /PAGINATION_INCOMPLETE/);
});
test("upscale geometry preserves portrait landscape ratio and limits", () => {
  assert.deepEqual(upscaleGeometry(1280, 720, 3840), { width: 3840, height: 2160 });
  assert.deepEqual(upscaleGeometry(720, 1280, 3840), { width: 2160, height: 3840 });
  assert.throws(() => upscaleGeometry(100, 100, 3840), /AT_MOST_FOUR/);
  assert.throws(() => upscaleRuntimeSchema.parse({ executable: "x", modelsDirectory: "x", model: "../evil" }));
});

test("console HTTP saves provider choices and prices but rejects cross-origin and invalid configuration", async () => {
  const { handler } = await import("../src/http-server.mjs");
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const put = (endpoint, body, origin = url) => fetch(url + endpoint, { method: "PUT", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body) });
  try {
    const selection = { video: "fal-wan", fallbackImage: "replicate-flux", speech: "speech" };
    assert.equal((await put("/api/providers", selection, "https://attacker.invalid")).status, 403);
    assert.equal((await put("/api/providers", selection)).status, 200);
    assert.deepEqual((await (await fetch(url + "/api/providers")).json()).selection, selection);
    assert.equal((await put("/api/providers", { ...selection, video: "unsupported" })).status, 400);
    assert.equal((await put("/api/usage/prices", { kind: "fal-video", model: "fixture", currency: "USD", unit: "second", rate: 0.01, source: "test fixture" })).status, 200);
    assert.equal((await put("/api/usage/prices", { rate: -1 })).status, 400);
    assert.equal((await fetch(url + "/api/secrets/fal")).status, 404);
    assert.equal((await fetch(url + "/api/usage?page=0")).status, 400);
    assert.equal((await fetch(url + "/api/billing", { headers: { origin: "https://attacker.invalid" } })).status, 403);
    await put("/api/providers", { video: "ark", fallbackImage: "ark-seedream" });
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
test("real NCNN smoke: audio preserved, checkpoint hashes and finished-job protection", { skip: !process.env.UPSCALE_SMOKE_EXE }, async () => {
  const source = path.join(temp, "source.mp4");
  await promisify(execFile)("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "testsrc2=size=64x48:rate=4:duration=1", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", source], { windowsHide: true });
  await configureUpscale({ executable: process.env.UPSCALE_SMOKE_EXE, modelsDirectory: process.env.UPSCALE_SMOKE_MODELS });
  const job = await createUpscale({ sourcePath: source, sourceSha256: await fileHash(source), longEdge: 256, chunkFrames: 2 });
  await startUpscale(job.id); await drainBackgroundJobs();
  const done = await getUpscale(job.id);
  assert.equal(done.status, "succeeded", done.error); assert.equal(done.chunks.length, 2); assert.equal(done.audioPreserved, true);
  assert.equal(await fileHash(done.outputPath), done.outputSha256);
  await assert.rejects(startUpscale(job.id), /ALREADY_FINISHED/);
  // Simulate interrupted assembly: verified chunks must be reused unchanged.
  const times = await Promise.all(done.chunks.map(c => fs.stat(path.join(done.directory, c.name)).then(s => s.mtimeMs)));
  await mutateState(s => { s.upscaleJobs.find(j => j.id === job.id).status = "paused"; });
  await startUpscale(job.id); await drainBackgroundJobs();
  assert.equal((await getUpscale(job.id)).status, "succeeded");
  assert.deepEqual(await Promise.all(done.chunks.map(c => fs.stat(path.join(done.directory, c.name)).then(s => s.mtimeMs))), times);
});
