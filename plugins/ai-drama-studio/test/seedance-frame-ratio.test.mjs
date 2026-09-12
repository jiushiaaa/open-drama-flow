import test from "node:test";
import assert from "node:assert/strict";
import { compileShotRequests } from "../src/prompt-compiler.mjs";
import { validateSeedanceRequest } from "../src/seedance-contract.mjs";

function compile(mode, model = "doubao-seedance-2-5-260628") {
  const roles = mode === "first-last-frame" ? ["first_frame", "last_frame"] : mode === "image-to-video" ? ["first_frame"] : [];
  return compileShotRequests({
    shot: { id: "frame-ratio", generationMode: "seedance", duration: 8, videoInputMode: mode, audioMode: "none", prompt: "Turn naturally toward the other person.", videoParameters: { ratio: "16:9", resolution: "720p" } },
    settings: { seedanceModel: model, imageProvider: "codex-imagegen", ratio: "9:16", resolution: "720p" },
    inputAssetBindings: roles.map((referenceRole, i) => ({ assetId: `frame-${i}`, kind: "image", referenceRole, version: 1, sha256: "a".repeat(64) }))
  });
}

for (const mode of ["image-to-video", "first-last-frame"]) {
  test(`2.5 ${mode} freezes first-frame-following ratio before dispatch`, () => {
    const result = compile(mode);
    assert.equal(result.executable, true);
    assert.equal(result.requests.video.parameters.ratio, "adaptive");
    assert.equal(result.requests.video.parameters.duration, 8);
    const bad = { ...result.requests.video, parameters: { ...result.requests.video.parameters, ratio: "16:9" } };
    assert.ok(validateSeedanceRequest(bad).some(e => e.code === "SEEDANCE_FRAME_RATIO_MUST_FOLLOW_SOURCE"));
    assert.deepEqual(validateSeedanceRequest(result.requests.video), []);
  });
}

test("frame ratio repair does not change text-to-video or legacy 2.0 geometry", () => {
  assert.equal(compile("text-to-video").requests.video.parameters.ratio, "16:9");
  assert.equal(compile("image-to-video", "doubao-seedance-2-0-260128").requests.video.parameters.ratio, "16:9");
});
