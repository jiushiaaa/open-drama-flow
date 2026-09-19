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

test("ASR retains supplied word times without fabricating missing timings", async () => {
  const result = await runSpeechRequest(snapshot("asr"), { key: "fake-only", audio: Buffer.from("fake-audio"), fetchImpl: async () => new Response(JSON.stringify({ result: {
    text: "你好", utterances: [{ text: "你好", start_time: 0, end_time: 500, words: [
      { text: "你", start_time: 0, end_time: 180 }, { word: "好", start_time: 220, end_time: 500 },
      { text: "invalid", start_time: "unknown", end_time: 510 },
      { text: "missing", end_time: 510 }, { text: "null", start_time: null, end_time: 510 },
      { text: "empty", start_time: "", end_time: " " }, { text: "boolean", start_time: false, end_time: true }, null
    ] }]
  } }), { headers }) });
  assert.deepEqual(result.utterances[0].words, [{ text: "你", startMs: 0, endMs: 180 }, { text: "好", startMs: 220, endMs: 500 }]);
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


test("music uses the evidenced SeedAudio JSON endpoint with one request", async () => {
  let calls = 0;
  const output = await runSpeechRequest(snapshot("music"), { key: "fake-only", requestId: "music-fixture", fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, "https://openspeech.bytedance.com/api/v3/tts/create");
    assert.equal(options.redirect, "error");
    const body = JSON.parse(options.body);
    assert.equal(body.model, "seed-audio-1.0");
    assert.equal(body.text_prompt, snapshot("music").text);
    assert.equal(body.audio_config.format, "wav");
    return new Response(JSON.stringify({ audio: Buffer.from("fixture").toString("base64"), duration: 30, subtitle: [] }));
  } });
  assert.equal(calls, 1);
  assert.equal(output.audio.toString(), "fixture");
  assert.equal(output.durationSeconds, 30);
  assert.equal(speechCapabilities(true).standaloneMusic, true);
  assert.equal(speechCapabilities(false).music.available, false);
});

test("music rejects missing or malformed audio and enforces its frozen profile", async () => {
  for (const body of [{}, {audio:"https://untrusted.invalid/a.wav"}, {audio:""}]) {
    await assert.rejects(runSpeechRequest(snapshot("music"), {key:"fake", fetchImpl:async()=>new Response(JSON.stringify(body))}));
  }
  await assert.rejects(runSpeechRequest({...snapshot("music"), text:"x".repeat(501)}, {key:"fake", fetchImpl:async()=>{throw Error("must not dispatch");}}), /TEXT_INVALID/);
});


test("stock voice selection is honored without permitting malformed identifiers", async () => {
  const speaker = "fixture_verified_male_bigtts"; // fixture only, not an advertised provider voice
  await runSpeechRequest({...snapshot("tts"),speaker}, {key:"fake",fetchImpl:async(url,options)=>{
    assert.equal(JSON.parse(options.body).req_params.speaker,speaker);
    return new Response('data: {"code":0,"data":"YWJj"}\n\ndata: {"code":20000000}\n');
  }});
  await assert.rejects(runSpeechRequest({...snapshot("tts"),speaker:"https://example.invalid"}, {key:"fake",fetchImpl:async()=>assert.fail("invalid voice dispatched")}),/SPEAKER_INVALID/);
});
