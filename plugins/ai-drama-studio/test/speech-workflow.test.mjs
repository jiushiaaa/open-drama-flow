import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after, beforeEach } from "node:test";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "odf-speech-workflow-"));
process.env.AI_DRAMA_DATA_DIR = root;
const { createProject, createCreation, importLocalAsset, updateAsset } = await import("../src/workflow.mjs");
const { requestSpeechJob, authorizeSpeechJob, getSpeechJob } = await import("../src/speech-workflow.mjs");
const { readState, mutateState } = await import("../src/store.mjs");
const { mediaCommand } = await import("../src/media-inspection.mjs");
const { drainBackgroundJobs } = await import("../src/background-jobs.mjs");
const deps = { hasKey: async () => true, readKey: async () => "fake-test-key" };
const accept = async () => ({ action: "accept", content: { confirm: true } });
beforeEach(async () => mutateState(state => { state.settings.executionMode = "manual"; }));
after(async () => { await drainBackgroundJobs(); await fs.rm(root, { recursive: true, force: true }); });

async function ttsJob() {
  const project = await createProject({ title: "Isolated speech test" });
  const creation = await createCreation(project.id, { title: "Speech fixture" });
  return requestSpeechJob({ projectId: project.id, creationId: creation.id, mode: "tts", text: "测试旁白" }, deps);
}

test("no key blocks independent speech without blocking project creation", async () => {
  await assert.rejects(requestSpeechJob({ mode: "tts" }, { hasKey: async () => false }), /KEY_NOT_CONFIGURED/);
});

test("pending, decline, cancel, missing confirm, unavailable elicitation all make zero calls", async () => {
  let calls = 0;
  for (const answer of [{ action: "decline" }, { action: "cancel" }, { action: "accept", content: {} }]) {
    const job = await ttsJob();
    assert.equal(job.attempts, 0);
    await authorizeSpeechJob(job.id, async request => { assert.match(request.message, /最多 1 次/); return answer; }, { ...deps, run: async () => { calls++; } });
    assert.equal((await getSpeechJob(job.id)).attempts, 0);
  }
  const job = await ttsJob();
  await assert.rejects(authorizeSpeechJob(job.id, async () => { throw new Error("unavailable"); }, deps), /USER_CONFIRMATION_UNAVAILABLE/);
  assert.equal(calls, 0);
});

test("post-approval snapshot change is rejected before any paid call", async () => {
  const job = await ttsJob();
  await assert.rejects(authorizeSpeechJob(job.id, async () => {
    await mutateState(state => { state.speechJobs.find(item => item.id === job.id).snapshot.text = "changed"; });
    return accept();
  }, deps), /SNAPSHOT_CHANGED/);
  assert.equal((await getSpeechJob(job.id)).attempts, 0);
});

test("accepted TTS writes versioned real MP3 asset; concurrency cannot duplicate calls", async () => {
  const fixture = path.join(root, "test-tone.mp3");
  await mediaCommand("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", fixture]);
  const bytes = await fs.readFile(fixture);
  const job = await ttsJob();
  let calls = 0;
  const options = { ...deps, run: async () => { calls++; return { audio: bytes, logId: "fixture-log", providerCode: "20000000" }; } };
  const outcomes = await Promise.allSettled([authorizeSpeechJob(job.id, accept, options), authorizeSpeechJob(job.id, accept, options)]);
  assert.equal(calls, 1);
  assert.equal(outcomes.filter(item => item.status === "fulfilled").length, 1);
  const saved = await getSpeechJob(job.id);
  assert.equal(saved.status, "succeeded");
  assert.equal(saved.result.reviewStatus, "unreviewed");
  assert.ok(saved.result.media.audio);
  const asset = (await readState()).projects.find(item => item.id === job.projectId).assets.find(item => item.id === saved.result.assetId);
  assert.equal(asset.provider, "doubao-speech");
  assert.equal(asset.requestDigest, job.requestDigest);
  await assert.rejects(authorizeSpeechJob(job.id, accept, options), /NOT_PENDING/);
});

test("timeouts are uncertain, service rejection is failed, neither auto-retries nor leaks key", async () => {
  for (const definitive of [true, false]) {
    const job = await ttsJob();
    let calls = 0;
    const result = await authorizeSpeechJob(job.id, accept, { ...deps, run: async () => { calls++; throw Object.assign(new Error("fake-test-key in provider failure"), { definitive }); } });
    assert.equal(result.status, definitive ? "failed" : "uncertain");
    assert.equal(calls, 1);
    assert.ok(!JSON.stringify(result).includes("fake-test-key"));
    await assert.rejects(authorizeSpeechJob(job.id, accept, deps), /NOT_PENDING/);
  }
});

test("ASR trims video audio, binds exact version, tolerates rename and persists transcript without review approval", async () => {
  const source = path.join(root, "asr-source.mp4");
  await mediaCommand("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=s=320x320:d=2", "-f", "lavfi", "-i", "sine=frequency=400:duration=2", "-shortest", source]);
  const project = await createProject({ title: "ASR fixture" });
  const asset = await importLocalAsset(project.id, source);
  const job = await requestSpeechJob({ projectId: project.id, mode: "asr", assetId: asset.id, durationSeconds: 1, startSeconds: 0.5, expectedText: "你好！" }, deps);
  await updateAsset(project.id, asset.id, { name: "renamed" });
  assert.equal(job.snapshot.audio.durationSeconds, 1);
  const result = await authorizeSpeechJob(job.id, accept, { ...deps, run: async (snapshot, options) => {
    assert.equal(options.audio.toString("ascii", 0, 4), "RIFF");
    return { text: "你好", utterances: [{ startMs: 0, endMs: 800, text: "你好" }], providerCode: "20000000", logId: "fixture" };
  } });
  assert.equal(result.status, "succeeded");
  assert.equal(result.result.transcript.exactTextMatch, true);
  assert.equal(result.result.transcript.reviewStatus, "unreviewed");
  const changed = await requestSpeechJob({ projectId: project.id, mode: "asr", assetId: asset.id, durationSeconds: 1 }, deps);
  await fs.appendFile(asset.localPath, "mutated");
  await assert.rejects(authorizeSpeechJob(changed.id, accept, deps), /SOURCE_CHANGED/);
});

test("background speech work remains owned and drainable", async () => {
  const job = await ttsJob();
  const result = await authorizeSpeechJob(job.id, accept, { ...deps, background: true, run: async () => { throw new Error("timeout"); } });
  assert.equal(result.attempts, 1);
  await drainBackgroundJobs();
  assert.equal((await getSpeechJob(job.id)).status, "uncertain");
});

test("dead speech owner becomes uncertain rather than eligible for resubmission", async () => {
  const job = await ttsJob();
  await mutateState(state => { Object.assign(state.speechJobs.find(item => item.id === job.id), { status: "running", attempts: 1, ownerPid: 2147483647 }); });
  const result = await getSpeechJob(job.id);
  assert.equal(result.status, "uncertain");
  assert.equal(result.error.code, "SPEECH_OWNER_EXITED");
  await assert.rejects(authorizeSpeechJob(job.id, accept, deps), /NOT_PENDING/);
});

test("automatic ASR then TTS never elicits; both keep hashes, one-call caps and unreviewed outputs", async () => {
  await mutateState(state => { state.settings.executionMode = "automatic"; });
  const source = path.join(root, "automatic-fixture.wav");
  const mp3 = path.join(root, "automatic-fixture.mp3");
  await mediaCommand("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", source]);
  await mediaCommand("ffmpeg", ["-v", "error", "-i", source, mp3]);
  const project = await createProject({ title: "Automatic speech fixture" });
  const asset = await importLocalAsset(project.id, source);
  const bytes = await fs.readFile(mp3);
  let calls = 0;
  const noForm = async () => assert.fail("automatic policy must not elicit");
  for (const mode of ["asr", "tts"]) {
    const job = await requestSpeechJob({ projectId: project.id, mode, assetId: asset.id, durationSeconds: 1, text: "测试" }, deps);
    assert.equal(job.snapshot.executionMode, "automatic");
    const run = async () => { calls++; return mode === "asr" ? { text: "测试", utterances: [], providerCode: "20000000" } : { audio: bytes, providerCode: "20000000" }; };
    const outcomes = await Promise.allSettled([authorizeSpeechJob(job.id, noForm, { ...deps, run }), authorizeSpeechJob(job.id, noForm, { ...deps, run })]);
    assert.equal(outcomes.filter(item => item.status === "fulfilled").length, 1);
    const saved = await getSpeechJob(job.id);
    assert.equal(saved.status, "succeeded");
    assert.equal(saved.attempts, 1);
    assert.equal(saved.approval.method, "automatic-policy");
    assert.equal(saved.approval.action, "start");
    assert.equal(saved.approval.requestDigest, saved.requestDigest);
    assert.equal(saved.result.reviewStatus, "unreviewed");
    assert.match(saved.result.sha256, /^[a-f0-9]{64}$/);
  }
  assert.equal(calls, 2);
});

test("policy changes cannot auto-run old manual, rejected or mutated speech requests", async () => {
  const manual = await ttsJob();
  const rejected = await ttsJob();
  await authorizeSpeechJob(rejected.id, async () => ({ action: "decline" }), deps);
  await mutateState(state => { state.settings.executionMode = "automatic"; });
  await assert.rejects(authorizeSpeechJob(manual.id, accept, deps), /EXECUTION_MODE_CHANGED/);
  await assert.rejects(authorizeSpeechJob(rejected.id, accept, deps), /NOT_PENDING/);
  const automatic = await ttsJob();
  await mutateState(state => { state.speechJobs.find(item => item.id === automatic.id).snapshot.text = "tampered"; });
  await assert.rejects(authorizeSpeechJob(automatic.id, accept, deps), /SNAPSHOT_CHANGED/);
  const race = await ttsJob();
  await assert.rejects(authorizeSpeechJob(race.id, accept, { ...deps, readKey: async () => {
    await mutateState(state => { state.settings.executionMode = "manual"; });
    return "fake-test-key";
  } }), /EXECUTION_MODE_CHANGED/);
  assert.equal((await getSpeechJob(race.id)).attempts, 0);
});

test("manual confirmation diagnostics distinguish accepted-without-checkmark from consent", async () => {
  for (const confirm of [false, "true", undefined]) {
    const job = await ttsJob();
    const result = await authorizeSpeechJob(job.id, async () => ({ action: "accept", content: { confirm } }), deps);
    assert.equal(result.status, "pending");
    assert.equal(result.attempts, 0);
    assert.equal(result.lastConfirmation.action, "accept");
    assert.equal(result.lastConfirmation.confirmed, false);
  }
});
