import assert from "node:assert/strict";
import test from "node:test";
import { SPEECH, runSpeechRequest, speechCapabilities } from "../src/speech.mjs";

const snapshot = mode => ({ mode, profile: SPEECH[mode], text: "你好，这是语音测试。" });
const headers = { "X-Api-Status-Code": "20000000", "X-Tt-Logid": "test-log" };

test("speech is optional; no key leaves native sound and no fake ASR capability", () => {
  assert.equal(speechCapabilities(false).strategy, "seedance-native");
  assert.equal(speechCapabilities(false).asr.available, false);
  assert.equal(speechCapabilities(true).tts.available, true);
  assert.equal(speechCapabilities(true).serviceEntitlementVerified, false);
});

test("ASR fixed endpoint, key headers, embedded audio, exact request ID and timestamps", async () => {
  let calls = 0;
  const result = await runSpeechRequest(snapshot("asr"), { key: "fake-only", requestId: "test-id", audio: Buffer.from("fake-audio"), fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, SPEECH.asr.endpoint);
    assert.equal(options.redirect, "error");
    assert.equal(options.headers["X-Api-Key"], "fake-only");
    assert.equal(options.headers["X-Api-Request-Id"], "test-id");
    assert.equal(options.headers["X-Api-Resource-Id"], "volc.bigasr.auc_turbo");
    const body = JSON.parse(options.body);
    assert.equal(body.audio.data, Buffer.from("fake-audio").toString("base64"));
    assert.equal(body.request.show_utterances, true);
    return new Response(JSON.stringify({ result: { text: "你好", utterances: [{ text: "你好", start_time: 0, end_time: 500 }] } }), { headers });
  } });
  assert.equal(calls, 1);
  assert.deepEqual(result.utterances, [{ text: "你好", startMs: 0, endMs: 500 }]);
});

test("TTS consumes completed SSE only and requests stock voice / MP3", async () => {
  const output = await runSpeechRequest(snapshot("tts"), { key: "fake-only", fetchImpl: async (url, options) => {
    assert.equal(url, SPEECH.tts.endpoint);
    const body = JSON.parse(options.body);
    assert.equal(body.req_params.speaker, SPEECH.tts.speaker);
    assert.equal(body.req_params.audio_params.format, "mp3");
    return new Response('data: {"code":0,"data":"YWJj"}\n\ndata: {"code":20000000}\n\n');
  } });
  assert.equal(output.audio.toString(), "abc");
});

test("HTTP success is not service success, provider bodies/keys never enter errors", async () => {
  await assert.rejects(runSpeechRequest(snapshot("asr"), { key: "fake-secret", audio: Buffer.from("a"), fetchImpl: async () => new Response("fake-secret", { status: 401, headers: { "X-Api-Status-Code": "45000010", "X-Api-Message": "fake-secret" } }) }), error => {
    assert.equal(error.message, "SPEECH_PROVIDER_ERROR_45000010");
    assert.equal(error.definitive, true);
    assert.ok(!JSON.stringify(error).includes("fake-secret"));
    return true;
  });
  await assert.rejects(runSpeechRequest(snapshot("asr"), { key: "fake", audio: Buffer.from("a"), fetchImpl: async () => new Response('{}', { headers: { "X-Api-Status-Code": "45000002" } }) }), /SPEECH_PROVIDER/);
});

test("partial/error/malformed/empty SSE is never accepted as usable audio", async () => {
  for (const raw of ['data: {"code":0,"data":"YWJj"}\n', 'data: {"code":20000000}\n', 'data: {"code":45000010,"message":"secret"}\n', 'data: nope\n']) {
    await assert.rejects(runSpeechRequest(snapshot("tts"), { key: "fake", fetchImpl: async () => new Response(raw) }));
  }
});

test("invalid TTS limits and changed endpoint fail before dispatch", async () => {
  let calls = 0;
  const options = { key: "fake", fetchImpl: async () => { calls++; throw new Error("should not call"); } };
  await assert.rejects(runSpeechRequest({ ...snapshot("tts"), text: "x".repeat(501) }, options), /TEXT_INVALID/);
  await assert.rejects(runSpeechRequest({ ...snapshot("tts"), profile: { ...SPEECH.tts, endpoint: "https://example.com" } }, options), /PROFILE_CHANGED/);
  assert.equal(calls, 0);
});
