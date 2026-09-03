import test from "node:test";
import assert from "node:assert/strict";
import { compileShotRequests } from "../src/prompt-compiler.mjs";
import { seedanceProfile, validateSeedanceRequest, providerContent } from "../src/seedance-contract.mjs";
import { parseSignalEvidence, validateReferenceMedia } from "../src/media-inspection.mjs";
import { validatePlaybackReview } from "../src/quality-contract.mjs";
import { normalizeMemoryEntry, searchApprovedMemory } from "../src/project-memory.mjs";

const settings = { seedanceModel: "doubao-seedance-2-5-260628", imageProvider: "codex-imagegen", ratio: "9:16", resolution: "720p", generateAudio: false };
const binding = (id, kind, role) => ({ assetId: id, kind, referenceRole: role, version: 1, sha256: "a".repeat(64) });
const compile = (mode, inputs = [], patch = {}) => compileShotRequests({ shot: { id: "shot", duration: 30, prompt: "A red cube rolls smoothly left to right.", generationMode: "seedance", audioMode: "none", videoInputMode: mode, ...patch }, settings, inputAssetBindings: inputs });

test("six supported task contracts preserve typed roles and 30 second requests", () => {
  for (const [mode, inputs] of [
    ["text-to-video", []],
    ["image-to-video", [binding("a", "image", "first_frame")]],
    ["first-last-frame", [binding("a", "image", "first_frame"), binding("b", "image", "last_frame")]],
    ["multimodal-reference", [binding("a", "image", "reference_image"), binding("b", "video", "reference_video"), binding("c", "audio", "reference_audio")]],
    ["video-extend", [binding("b", "video", "reference_video")]],
    ["video-edit", [binding("b", "video", "reference_video")]]
  ]) {
    const result = compile(mode, inputs);
    assert.equal(result.executable, true, JSON.stringify(result.validation));
    assert.equal(result.requests.video.parameters.duration, 30);
    assert.equal(result.requests.video.parameters.generate_audio, false);
    assert.deepEqual(result.requests.video.inputs.map(item => item.providerRole), inputs.map(item => item.referenceRole));
    assert.equal(result.requests.image, null);
  }
});

test("reference order, all media versions, sound and edit preservation affect approval digests", () => {
  const inputs = [binding("a", "image", "reference_image"), binding("b", "video", "reference_video"), binding("c", "audio", "reference_audio")];
  const baseline = compile("multimodal-reference", inputs);
  assert.notEqual(baseline.requestDigests.video, compile("multimodal-reference", [...inputs].reverse()).requestDigests.video);
  assert.notEqual(baseline.requestDigests.video, compile("multimodal-reference", inputs.map(item => ({ ...item, version: 2 }))).requestDigests.video);
  assert.notEqual(baseline.requestDigests.video, compile("multimodal-reference", inputs, { audioMode: "provider-native", soundPlan: { ambience: "Wind" } }).requestDigests.video);
  const edit = { startSeconds: 1, endSeconds: 2, instruction: "Replace the cube with a ball", preserve: ["camera", "background"] };
  const edited = compile("video-edit", [inputs[1]], { edit });
  assert.equal(edited.executable, true);
  assert.match(edited.requests.video.prompt, /1.*2/);
  assert.notEqual(edited.requestDigests.video, compile("video-edit", [inputs[1]], { edit: { ...edit, endSeconds: 3 } }).requestDigests.video);
});

test("model constraints fail closed, and do not silently drop extra parameters", () => {
  assert.equal(compile("first-last-frame", [binding("a", "image", "first_frame")]).executable, false);
  assert.equal(compile("image-to-video", [binding("a", "image", "reference_image")]).executable, false);
  assert.equal(compile("multimodal-reference", [binding("a", "video", "reference_audio")]).executable, false);
  assert.equal(compile("video-extend", []).executable, false);
  assert.equal(compile("text-to-video", [], { videoParameters: { resolution: "1080p" } }).executable, false);
  assert.equal(compile("text-to-video", [], { videoParameters: { seed: 42 } }).executable, false);
  const payload = compile("text-to-video").requests.video;
  assert.ok(validateSeedanceRequest({ ...payload, model: "unverified-model" }).some(item => item.code === "SEEDANCE_MODEL_PROFILE_UNVERIFIED"));
  assert.ok(validateSeedanceRequest({ ...payload, parameters: { ...payload.parameters, generate_audio: undefined } }).some(item => item.code === "EXPLICIT_AUDIO_BOOLEAN_REQUIRED"));
  assert.equal(compile("multimodal-reference", Array.from({ length: 30 }, (_, i) => binding(`i${i}`, "image", "reference_image"))).executable, true);
  assert.equal(compile("multimodal-reference", Array.from({ length: 31 }, (_, i) => binding(`i${i}`, "image", "reference_image"))).executable, false);
  for (const kind of ["video", "audio"]) {
    assert.equal(compile("multimodal-reference", Array.from({ length: 10 }, (_, i) => binding(`i${i}`, kind, `reference_${kind}`))).executable, true);
    assert.equal(compile("multimodal-reference", Array.from({ length: 11 }, (_, i) => binding(`i${i}`, kind, `reference_${kind}`))).executable, false);
  }
});

test("provider content uses official fields, not invented mode or edit endpoints", () => {
  const content = providerContent("Instruction", [ { providerRole: "first_frame", url: "https://media.example/a.png" }, { providerRole: "last_frame", url: "asset://tail" }, { providerRole: "reference_video", url: "https://media.example/b.mp4" }, { providerRole: "reference_audio", url: "https://media.example/c.wav" } ]);
  assert.deepEqual(content.map(item => item.type), ["text", "image_url", "image_url", "video_url", "audio_url"]);
  assert.equal(content[1].role, "first_frame");
  assert.throws(() => providerContent("x", [{ providerRole: "first_frame", url: "file:///C:/private.png" }]), /URL_UNSUPPORTED/);
});

test("temporal scans detect silence and freeze without claiming identity or dialogue acceptance", () => {
  const signals = parseSignalEvidence("silence_start: 0\nsilence_end: 2\nfreeze_start: 1\nmax_volume: -inf dB", { duration: 4, audio: { codec: "aac" } });
  assert.equal(signals.audio.audible, false);
  assert.deepEqual(signals.audio.silence, [{ start: 0, end: 2 }]);
  assert.deepEqual(signals.motion.freezes, [{ start: 1, end: 4 }]);
  const profile = seedanceProfile(settings.seedanceModel);
  assert.ok(validateReferenceMedia({ localPath: "audio.flac", kind: "audio", size: 2000 }, { duration: 31, audio: {} }, profile).includes("REFERENCE_FORMAT_NEEDS_CONVERSION"));
  assert.ok(validateReferenceMedia({ localPath: "video.mp4", kind: "video", size: 2000 }, { duration: 4, video: { width: 320, height: 320, fps: 24 } }, profile).includes("REFERENCE_VIDEO_DIMENSIONS_UNSUPPORTED"));
});

test("quality acceptance requires motion, identity, listening, dialogue and edit preservation evidence", () => {
  const shots = [{ id: "one", duration: 4, soundPlan: { dialogue: "Hello" }, subtitle: "你好", subjectIds: ["hero"], videoInputMode: "video-edit" }];
  const evidence = { source: { sha256: "v" }, temporal: { audioPlayback: { sha256: "a" } } };
  const row = { shotId: "one", start: 0, end: 4, notes: "Verified playback", motion: "passed", identity: "passed", dialogue: "passed", audio: "passed", subtitles: "passed", continuity: "not-applicable", editPreservation: "passed", heardDialogue: "Hello", observedSubtitles: "你好" };
  const input = { playbackSourceSha256: "v", listenedAudioSha256: "a", observations: [row] };
  assert.equal(validatePlaybackReview(input, evidence, shots, "passed").length, 1);
  assert.throws(() => validatePlaybackReview({ ...input, listenedAudioSha256: null }, evidence, shots, "passed"), /LISTENING/);
  assert.throws(() => validatePlaybackReview({ ...input, observations: [{ ...row, motion: "not-applicable" }] }, evidence, shots, "passed"), /NOT_PASSED:motion/);
  assert.throws(() => validatePlaybackReview({ ...input, observations: [{ ...row, editPreservation: "failed" }] }, evidence, shots, "passed"), /NOT_PASSED/);
});

test("Chinese memory retrieval finds relevant approved excerpts with scope and token isolation", () => {
  const entry = overrides => normalizeMemoryEntry({ projectId: "p", scope: "series", kind: "canon", title: "角色母版", status: "approved", content: "李阎黑色头发，使用八卦掌。", ...overrides });
  const memories = [entry({ id: "public", content: "无关背景。".repeat(200) + "李阎的武器是长剑，不是短刀。" }), entry({ id: "candidate", status: "candidate" }), entry({ id: "other", scope: "volume", volumeId: "other" })];
  const result = searchApprovedMemory(memories, { projectId: "p", volumeId: "active", purpose: "李阎武器", maxTokens: 1400 });
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].id, "public");
  assert.match(result.matches[0].content, /长剑/);
  assert.ok(result.estimatedTokens <= 1400);
  assert.deepEqual(searchApprovedMemory(memories, { projectId: "p", purpose: "不存在的角色", maxTokens: 0 }).matches, []);
});
