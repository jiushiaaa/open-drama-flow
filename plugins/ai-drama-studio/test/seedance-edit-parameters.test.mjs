import test from "node:test";
import assert from "node:assert/strict";
import { compileShotRequests } from "../src/prompt-compiler.mjs";
import { validateSeedanceRequest } from "../src/seedance-contract.mjs";

const model = "doubao-seedance-2-5-260628";
test("2.5 video edit compiles source-following parameters before the digest is frozen", () => {
  const shot = { id: "repair", generationMode: "seedance", duration: 23, videoInputMode: "video-edit", audioMode: "none", prompt: "Remove a stain, preserve the source.", videoParameters: { ratio: "16:9", resolution: "720p" } };
  const result = compileShotRequests({ shot, settings: { seedanceModel: model, imageProvider: "codex-imagegen", ratio: "16:9", resolution: "720p" }, inputAssetBindings: [{ assetId: "source", kind: "video", referenceRole: "reference_video", version: 1, sha256: "a".repeat(64) }] });
  assert.equal(result.executable, true);
  assert.equal(result.requests.video.parameters.duration, -1);
  assert.equal(result.requests.video.parameters.ratio, "adaptive");
  assert.equal(shot.duration, 23);
  const request = result.requests.video;
  assert.deepEqual(validateSeedanceRequest(request), []);
  assert.ok(validateSeedanceRequest({ ...request, parameters: { ...request.parameters, duration: 23 } }).some(e => e.code === "SEEDANCE_EDIT_DURATION_MUST_FOLLOW_SOURCE"));
  assert.ok(validateSeedanceRequest({ ...request, parameters: { ...request.parameters, ratio: "16:9" } }).some(e => e.code === "SEEDANCE_EDIT_RATIO_MUST_FOLLOW_SOURCE"));
});

test("2.5 video extend inherits source ratio while keeping the planned extension duration", () => {
  const shot = { id: "extend", generationMode: "seedance", duration: 16, videoInputMode: "video-extend", audioMode: "provider-native", prompt: "Continue the source video.", videoParameters: { ratio: "16:9", resolution: "720p" } };
  const result = compileShotRequests({ shot, settings: { seedanceModel: model, imageProvider: "codex-imagegen", ratio: "9:16", resolution: "720p" }, inputAssetBindings: [{ assetId: "source", kind: "video", referenceRole: "reference_video", version: 1, sha256: "b".repeat(64) }] });
  assert.equal(result.executable, true);
  assert.equal(result.requests.video.parameters.duration, 16);
  assert.equal(result.requests.video.parameters.ratio, "adaptive");
  assert.deepEqual(validateSeedanceRequest(result.requests.video), []);
  assert.ok(validateSeedanceRequest({ ...result.requests.video, parameters: { ...result.requests.video.parameters, ratio: "16:9" } }).some(e => e.code === "SEEDANCE_EXTEND_RATIO_MUST_FOLLOW_SOURCE"));
});

test("source-following duration is not silently enabled for other modes or 2.0", () => {
  for (const [inputMode, requestModel] of [["video-extend", model], ["multimodal-reference", model], ["video-edit", "doubao-seedance-2-0-260128"]]) {
    const errors = validateSeedanceRequest({ model: requestModel, inputMode, inputs: [{ kind: "video", providerRole: "reference_video" }], parameters: { duration: -1, ratio: "adaptive", resolution: "720p", generate_audio: false } });
    assert.ok(errors.some(e => e.code === "SEEDANCE_DURATION_UNSUPPORTED"));
  }
});
