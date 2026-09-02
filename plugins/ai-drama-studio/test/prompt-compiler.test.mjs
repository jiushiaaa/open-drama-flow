import assert from "node:assert/strict";
import test from "node:test";
import { compileShotRequests, normalizeShotContract, promptDigest, validateShotContract } from "../src/prompt-compiler.mjs";

const settings = {
  imageProvider: "codex-imagegen",
  seedreamModel: "seedream-test",
  seedanceModel: "seedance-test",
  ratio: "9:16",
  resolution: "720p",
  generateAudio: false,
  watermark: false
};

function structuredShot(overrides = {}) {
  return {
    id: "shot-01",
    sceneId: "scene-platform",
    purpose: "建立人物发现异常相机的悬念",
    subjectIds: ["character-lin-xia"],
    subject: "十九岁的林夏，黑色短发，穿海军蓝连帽雨衣",
    duration: 6,
    scene: "雨夜废弃车站",
    framing: "中近景",
    startState: "林夏低头蹲在积水旁",
    endState: "林夏抬眼看向镜头外",
    camera: { angle: "略低机位", movement: "缓慢推近", speed: "克制", relation: "始终保持人物在画面左侧" },
    motion: { subject: "她捡起旧相机，拇指擦去镜面水珠后抬眼", environment: "雨丝斜落，站台灯轻微闪烁", timing: ["0–2 秒建立静止状态", "2–5 秒完成捡起与擦拭", "5–6 秒抬眼停留"] },
    style: "克制的电影感日系悬疑",
    continuityConstraints: ["黑色短发", "红色细长发卡", "海军蓝连帽雨衣"],
    negativeConstraints: ["可读文字", "人物身份漂移"],
    acceptanceCriteria: ["相机始终只有一台"],
    promptContractVersion: 2,
    generationMode: "seedance",
    audioMode: "none",
    ...overrides
  };
}

function assetBinding(overrides = {}) {
  return {
    assetId: "asset-frame-1",
    familyId: "asset-frame",
    version: 1,
    sha256: "a".repeat(64),
    kind: "image",
    referenceRole: "first-frame",
    ...overrides
  };
}

test("compiles an explicit first-frame I2V request with Ark-compatible logical parameters", () => {
  const compiled = compileShotRequests({
    shot: structuredShot(),
    settings,
    inputAssetBinding: assetBinding(),
    videoInputMode: "image-to-video"
  });
  assert.equal(compiled.executable, true);
  assert.equal(compiled.requests.image, null);
  assert.equal(compiled.requests.video.inputMode, "image-to-video");
  assert.deepEqual(compiled.requests.video.parameters, {
    ratio: "9:16",
    duration: 6,
    watermark: false,
    return_last_frame: true,
    resolution: "720p"
  });
  assert.equal(compiled.requests.video.inputs[0].assetId, "asset-frame-1");
  assert.equal(compiled.requests.video.inputs[0].sha256, "a".repeat(64));
  assert.equal(compiled.requests.video.inputs[0].providerRole, "reference_image");
  assert.doesNotMatch(compiled.videoPrompt, /场景：雨夜废弃车站/);
  assert.match(compiled.videoPrompt, /主体动作：她捡起旧相机/);
  assert.equal(compiled.requestDigests.video.length, 64);
  assert.deepEqual(compiled, compileShotRequests({
    shot: structuredShot(),
    settings,
    inputAssetBinding: assetBinding(),
    videoInputMode: "image-to-video"
  }));
});

test("uses the current Ark Seedream payload field names", () => {
  const compiled = compileShotRequests({
    shot: structuredShot(),
    settings: { ...settings, imageProvider: "ark-seedream" },
    videoInputMode: "image-to-video"
  });
  assert.deepEqual(compiled.requests.image.parameters, {
    size: "2K",
    response_format: "url",
    watermark: false,
    output_format: "png"
  });
  assert.equal("aspectRatio" in compiled.requests.image.parameters, false);
});

test("explicit prompts retain structured execution and continuity constraints", () => {
  const compiled = compileShotRequests({
    shot: structuredShot({ imagePrompt: "锁定版静帧提示词", videoPrompt: "锁定版运动提示词" }),
    settings,
    inputAssetBinding: assetBinding(),
    videoInputMode: "image-to-video"
  });
  assert.match(compiled.imagePrompt, /^锁定版静帧提示词/);
  assert.match(compiled.imagePrompt, /场景：雨夜废弃车站/);
  assert.match(compiled.imagePrompt, /主体：十九岁的林夏/);
  assert.match(compiled.imagePrompt, /视觉风格：克制的电影感日系悬疑/);
  assert.match(compiled.imagePrompt, /必须保持：黑色短发/);
  assert.match(compiled.imagePrompt, /避免出现：可读文字/);
  assert.match(compiled.videoPrompt, /^锁定版运动提示词/);
  assert.match(compiled.videoPrompt, /主体动作：她捡起旧相机/);
  assert.match(compiled.videoPrompt, /全程保持：黑色短发/);
});

test("only a first-frame binding enables motion-first prompt shaping", () => {
  const firstFrame = compileShotRequests({ shot: structuredShot(), settings, inputAssetBinding: assetBinding(), videoInputMode: "image-to-video" });
  const subjectReference = compileShotRequests({
    shot: structuredShot(),
    settings,
    inputAssetBinding: assetBinding({ referenceRole: "subject" }),
    videoInputMode: "image-to-video"
  });
  assert.doesNotMatch(firstFrame.videoPrompt, /场景：雨夜废弃车站/);
  assert.match(subjectReference.videoPrompt, /场景：雨夜废弃车站/);
  assert.match(subjectReference.videoPrompt, /主体：十九岁的林夏/);
});

test("currently rejects implicit or text-to-video execution", () => {
  const implicit = compileShotRequests({ shot: structuredShot(), settings, inputAssetBinding: assetBinding() });
  const textToVideo = compileShotRequests({ shot: structuredShot(), settings, videoInputMode: "text-to-video" });
  assert.equal(implicit.executable, false);
  assert.equal(implicit.validation.capabilityErrors.some(item => item.code === "VIDEO_INPUT_MODE_REQUIRED"), true);
  assert.equal(textToVideo.executable, false);
  assert.equal(textToVideo.validation.capabilityErrors.some(item => item.code === "VIDEO_INPUT_MODE_UNSUPPORTED"), true);
  assert.equal(textToVideo.requests.video.inputMode, "image-to-video");
});

test("binds video digests to stable asset version and content evidence", () => {
  const compileWith = inputAssetBinding => compileShotRequests({
    shot: structuredShot(), settings, inputAssetBinding, videoInputMode: "image-to-video"
  });
  const first = compileWith(assetBinding());
  const nextVersion = compileWith(assetBinding({ version: 2 }));
  const changedBytes = compileWith(assetBinding({ sha256: "b".repeat(64) }));
  assert.notEqual(first.requestDigests.video, nextVersion.requestDigests.video);
  assert.notEqual(first.requestDigests.video, changedBytes.requestDigests.video);
});

test("accepts a frozen upstream image request digest for a not-yet-generated first frame", () => {
  const initial = compileShotRequests({ shot: structuredShot(), settings, videoInputMode: "image-to-video" });
  const upstreamRequestDigest = initial.requestDigests.image;
  const compiled = compileShotRequests({
    shot: structuredShot(),
    settings,
    inputAssetBinding: { referenceRole: "first-frame", upstreamRequestDigest },
    videoInputMode: "image-to-video"
  });
  assert.equal(compiled.executable, true);
  assert.deepEqual(compiled.requests.image, initial.requests.image);
  assert.equal(compiled.requestDigests.image, upstreamRequestDigest);
  assert.equal(compiled.requests.video.inputs[0].upstreamRequestDigest, upstreamRequestDigest);
  assert.equal(compiled.requests.video.inputs[0].source, "upstream-image-request");
});

test("rejects a stale upstream image digest instead of freezing mismatched requests", () => {
  const compiled = compileShotRequests({
    shot: structuredShot(),
    settings,
    inputAssetBinding: { referenceRole: "first-frame", upstreamRequestDigest: "c".repeat(64) },
    videoInputMode: "image-to-video"
  });
  assert.equal(compiled.executable, false);
  assert.equal(compiled.validation.capabilityErrors.some(item => item.code === "VIDEO_UPSTREAM_DIGEST_MISMATCH"), true);
});

test("auto-binds the same compilation's image request when no asset exists", () => {
  const compiled = compileShotRequests({ shot: structuredShot(), settings, videoInputMode: "image-to-video" });
  assert.equal(compiled.executable, true);
  assert.equal(compiled.requests.video.inputs[0].upstreamRequestDigest, compiled.requestDigests.image);
  assert.equal(compiled.requests.video.inputs[0].referenceRole, "first-frame");
});

test("rejects incomplete asset evidence instead of hashing an asset id alone", () => {
  const compiled = compileShotRequests({
    shot: structuredShot(), settings, inputAssetBinding: { assetId: "asset-only", referenceRole: "first-frame" }, videoInputMode: "image-to-video"
  });
  assert.equal(compiled.executable, false);
  assert.equal(compiled.validation.capabilityErrors.some(item => item.code === "VIDEO_INPUT_ASSET_VERSION_REQUIRED"), true);
  assert.equal(compiled.validation.capabilityErrors.some(item => item.code === "VIDEO_INPUT_ASSET_HASH_REQUIRED"), true);
});

test("does not silently clamp unsupported Seedance duration", () => {
  for (const duration of [3, 6.5, 16]) {
    const compiled = compileShotRequests({ shot: structuredShot({ duration }), settings, videoInputMode: "image-to-video" });
    assert.equal(compiled.executable, false);
    assert.equal(compiled.requests.video.parameters.duration, duration);
    assert.equal(compiled.validation.capabilityErrors.some(item => item.code === "SEEDANCE_DURATION_UNSUPPORTED"), true);
  }
});

test("accepts only exact contract, generation and audio modes", () => {
  assert.equal(validateShotContract(structuredShot({ promptContractVersion: 3 })).errors.some(item => item.code === "PROMPT_CONTRACT_VERSION_UNSUPPORTED"), true);
  assert.equal(validateShotContract(structuredShot({ promptContractVersion: "2" })).errors.some(item => item.code === "PROMPT_CONTRACT_VERSION_UNSUPPORTED"), true);
  assert.equal(validateShotContract(structuredShot({ generationMode: "seedance-video" })).errors.some(item => item.code === "SHOT_GENERATION_MODE_UNSUPPORTED"), true);
  assert.equal(validateShotContract(structuredShot({ audioMode: "auto" })).errors.some(item => item.code === "SHOT_AUDIO_MODE_UNSUPPORTED"), true);
  assert.equal(normalizeShotContract({ id: "legacy", duration: 5, prompt: "旧 Prompt" }).promptContractVersion, 1);
  assert.equal(validateShotContract(structuredShot({ motion: {}, videoPrompt: "显式 Prompt" })).errors.some(item => item.code === "SHOT_SUBJECT_MOTION_REQUIRED"), true);
});

test("does not require a video input for non-video generation modes", () => {
  const staticMotion = compileShotRequests({ shot: structuredShot({ generationMode: "static-motion" }), settings });
  const uploadedVideo = compileShotRequests({ shot: structuredShot({ generationMode: "uploaded-video" }), settings });
  assert.equal(staticMotion.executable, true);
  assert.ok(staticMotion.requests.image);
  assert.equal(staticMotion.requests.video, null);
  assert.equal(uploadedVideo.executable, true);
  assert.equal(uploadedVideo.requests.image, null);
  assert.equal(uploadedVideo.requests.video, null);
});

test("requires native audio intent and Ark generate_audio to agree", () => {
  const soundPlan = { dialogue: "林夏说：谁在那里？", ambience: "雨声" };
  const disabled = compileShotRequests({
    shot: structuredShot({ audioMode: "provider-native", soundPlan }), settings, videoInputMode: "image-to-video"
  });
  assert.equal(disabled.executable, false);
  assert.equal(disabled.validation.capabilityErrors.some(item => item.code === "SEEDANCE_NATIVE_AUDIO_DISABLED"), true);

  const enabled = compileShotRequests({
    shot: structuredShot({ audioMode: "provider-native", soundPlan }),
    settings: { ...settings, generateAudio: true },
    videoInputMode: "image-to-video"
  });
  assert.equal(enabled.executable, true);
  assert.equal(enabled.requests.video.parameters.generate_audio, true);
  assert.match(enabled.videoPrompt, /声音：对白/);

  const unrequested = compileShotRequests({
    shot: structuredShot({ audioMode: "none" }),
    settings: { ...settings, generateAudio: true },
    videoInputMode: "image-to-video"
  });
  assert.equal(unrequested.executable, false);
  assert.equal(unrequested.validation.capabilityErrors.some(item => item.code === "SEEDANCE_NATIVE_AUDIO_UNREQUESTED"), true);
});

test("keeps legacy projects compatible while marking them for migration", () => {
  const legacy = { id: "legacy", duration: 5, prompt: "旧项目的单一提示词", framing: "特写", generationMode: "seedance" };
  const validation = validateShotContract(legacy);
  const compiled = compileShotRequests({ shot: legacy, settings, videoInputMode: "image-to-video" });
  assert.equal(validation.valid, true);
  assert.equal(validation.warnings.some(item => item.code === "LEGACY_PROMPT_CONTRACT"), true);
  assert.match(compiled.imagePrompt, /^旧项目的单一提示词/);
  assert.match(compiled.imagePrompt, /摄影机：特写/);
  assert.match(compiled.videoPrompt, /^旧项目的单一提示词/);
  assert.match(compiled.videoPrompt, /摄影机：特写/);
  assert.equal(compiled.executable, true);
});

test("reports prompt truncation and preserves structured constraints", () => {
  const compiled = compileShotRequests({
    shot: structuredShot({ videoPrompt: "长".repeat(5000), continuityConstraints: ["角色脸部必须稳定"] }),
    settings,
    videoInputMode: "image-to-video"
  });
  assert.equal([...compiled.videoPrompt].length, 3000);
  assert.match(compiled.videoPrompt, /全程保持：角色脸部必须稳定/);
  const warning = compiled.validation.warnings.find(item => item.code === "PROMPT_TRUNCATED" && item.field === "videoPrompt");
  assert.ok(warning);
  assert.equal("prompt" in warning, false);
  assert.equal(warning.limit, 3000);
});

test("canonical digests ignore object key order but distinguish non-finite values", () => {
  assert.equal(promptDigest({ a: 1, b: { x: 2, y: 3 } }), promptDigest({ b: { y: 3, x: 2 }, a: 1 }));
  assert.notEqual(promptDigest({ value: Number.NaN }), promptDigest({ value: Number.POSITIVE_INFINITY }));
});

test("warns when one shot exceeds its motion complexity budget", () => {
  const validation = validateShotContract(structuredShot({
    camera: { movement: "推近", movements: ["推近", "环绕"] },
    motion: { subject: "转身", environment: "雨落", timing: ["建立", "转身", "冲刺", "爆炸", "停留"] },
    transition: "闪白"
  }), { maxComplexity: 4 });
  assert.equal(validation.warnings.some(item => item.code === "MULTIPLE_PRIMARY_CAMERA_MOVES"), true);
  assert.equal(validation.warnings.some(item => item.code === "SHOT_COMPLEXITY_BUDGET_EXCEEDED"), true);
});
