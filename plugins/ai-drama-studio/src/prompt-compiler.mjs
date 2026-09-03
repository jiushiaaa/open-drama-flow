import { createHash } from "node:crypto";
import { shotInputMode, validateSeedanceRequest, MEDIA_ROLES } from "./seedance-contract.mjs";

export const PROMPT_COMPILER_VERSION = "shot-prompt-compiler/3";

const PROMPT_LIMIT = 3000;
const SOURCE_PROMPT_LIMIT = 30000;
const supportedContractVersions = new Set([1, 2]);
const supportedModes = new Set(["auto", "seedance", "static-motion", "uploaded-video"]);
const supportedAudioModes = new Set(["none", "provider-native", "source-asset", "post"]);
const supportedReferenceRoles = new Set(["first-frame", "subject", "scene", "style", ...Object.keys(MEDIA_ROLES)]);
const supportedImageProviders = new Set(["codex-imagegen", "ark-seedream"]);

function cleanText(value) {
  return String(value ?? "").trim().normalize("NFC");
}

function clipText(value, max = PROMPT_LIMIT) {
  return [...cleanText(value)].slice(0, max).join("");
}

function text(value, max = PROMPT_LIMIT) {
  return clipText(value, max);
}

function textList(value, maxItems = 30, maxLength = 300) {
  return Array.isArray(value)
    ? [...new Set(value.map(item => text(item, maxLength)).filter(Boolean))].slice(0, maxItems)
    : [];
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => {
    if (item === null || item === undefined || item === "") return false;
    if (Array.isArray(item)) return item.length > 0;
    if (typeof item === "object") return Object.keys(item).length > 0;
    return true;
  }));
}

function canonicalize(value) {
  if (value === undefined) return { $type: "undefined" };
  if (typeof value === "number" && !Number.isFinite(value)) return { $type: "number", value: String(value) };
  if (typeof value === "bigint") return { $type: "bigint", value: value.toString() };
  if (typeof value === "string") return value.normalize("NFC");
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  }
  return value;
}

export function promptDigest(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function normalizeCamera(camera, framing) {
  const source = camera && typeof camera === "object" ? camera : {};
  return compactObject({
    shotSize: text(source.shotSize || framing, 80),
    angle: text(source.angle, 80),
    movement: text(source.movement, 160),
    speed: text(source.speed, 80),
    relation: text(source.relation, 180)
  });
}

function normalizeMotion(motion, action) {
  if (typeof motion === "string") return compactObject({ subject: text(motion || action, 1200) });
  const source = motion && typeof motion === "object" ? motion : {};
  return compactObject({
    subject: text(source.subject || action, 1200),
    environment: text(source.environment, 800),
    timing: textList(source.timing, 12, 240)
  });
}

function normalizeSoundPlan(soundPlan, audio, dialogue) {
  const source = typeof soundPlan === "string"
    ? { notes: soundPlan }
    : soundPlan && typeof soundPlan === "object" ? soundPlan : {};
  return compactObject({
    dialogue: text(source.dialogue || dialogue, 1000),
    ambience: text(source.ambience, 500),
    soundEffects: text(source.soundEffects, 500),
    music: text(source.music, 500),
    notes: text(source.notes || audio, 1000)
  });
}

function exactEnumValue(rawValue, fallback) {
  return rawValue === undefined || rawValue === null || rawValue === "" ? fallback : rawValue;
}

export function normalizeShotContract(shot = {}) {
  const rawAudioMode = shot.audioMode;
  return {
    id: text(shot.id, 80),
    sceneId: text(shot.sceneId, 80),
    purpose: text(shot.purpose, 500),
    subjectIds: textList(shot.subjectIds, 20, 120),
    subject: text(shot.subject || shot.subjectDescription, 1200),
    scene: text(shot.scene, 500),
    startState: text(shot.startState, 800),
    endState: text(shot.endState, 800),
    camera: normalizeCamera(shot.camera, shot.framing),
    motion: normalizeMotion(shot.motion, shot.action),
    style: text(shot.style, 500),
    transition: text(shot.transition, 300),
    soundPlan: normalizeSoundPlan(shot.soundPlan, shot.audio, shot.dialogue),
    audioMode: exactEnumValue(rawAudioMode, "none"),
    audioModeDeclared: rawAudioMode !== undefined && rawAudioMode !== null && rawAudioMode !== "",
    sourceAudioAssetId: text(shot.sourceAudioAssetId, 120) || null,
    continuityFromShotId: text(shot.continuityFromShotId, 80) || null,
    continuityConstraints: textList(shot.continuityConstraints, 30, 300),
    negativeConstraints: textList(shot.negativeConstraints, 30, 300),
    qualityRisks: textList(shot.qualityRisks, 30, 300),
    acceptanceCriteria: textList(shot.acceptanceCriteria, 30, 300),
    imagePrompt: text(shot.imagePrompt, SOURCE_PROMPT_LIMIT),
    videoPrompt: text(shot.videoPrompt, SOURCE_PROMPT_LIMIT),
    legacyPrompt: text(shot.prompt, SOURCE_PROMPT_LIMIT),
    promptContractVersion: exactEnumValue(shot.promptContractVersion, 1),
    generationMode: exactEnumValue(shot.generationMode, "auto"),
    videoInputMode: shotInputMode(shot),
    videoParameters: shot.videoParameters || {},
    edit: shot.edit || null,
    continuation: shot.continuation || null,
    duration: Number(shot.duration ?? 0)
  };
}

function cameraSentence(camera) {
  const values = [camera.shotSize, camera.angle, camera.movement, camera.speed, camera.relation].filter(Boolean);
  return values.length ? `摄影机：${values.join("，")}` : "";
}

function soundSentence(soundPlan) {
  const parts = [];
  if (soundPlan.dialogue) parts.push(`对白："${soundPlan.dialogue.replaceAll('"', "'")}"`);
  if (soundPlan.ambience) parts.push(`环境声：${soundPlan.ambience}`);
  if (soundPlan.soundEffects) parts.push(`音效：${soundPlan.soundEffects}`);
  if (soundPlan.music) parts.push(`音乐：${soundPlan.music}`);
  if (soundPlan.notes) parts.push(`声音要求：${soundPlan.notes}`);
  return parts.length ? `声音：${parts.join("；")}` : "";
}

function joinParts(parts) {
  return parts.filter(Boolean).map(cleanText).filter(Boolean).join("。 ");
}

function composePrompt(coreParts, constraintParts, limit = PROMPT_LIMIT) {
  const core = joinParts(coreParts);
  const constraints = joinParts(constraintParts);
  const separator = core && constraints ? "。 " : "";
  const full = `${core}${separator}${constraints}`;
  const originalLength = [...full].length;
  if (originalLength <= limit) return { prompt: full, truncated: false, originalLength, limit, truncatedSections: [] };

  const constraintLength = [...constraints].length;
  if (!constraints) {
    return { prompt: clipText(core, limit), truncated: true, originalLength, limit, truncatedSections: ["core"] };
  }
  if (constraintLength >= limit) {
    return { prompt: clipText(constraints, limit), truncated: true, originalLength, limit, truncatedSections: ["core", "constraints"] };
  }
  const availableCoreLength = Math.max(0, limit - constraintLength - [...separator].length);
  const clippedCore = clipText(core, availableCoreLength);
  return {
    prompt: `${clippedCore}${clippedCore ? separator : ""}${constraints}`,
    truncated: true,
    originalLength,
    limit,
    truncatedSections: ["core"]
  };
}

function continuitySentences(contract, prefix = "必须保持") {
  return [
    contract.continuityConstraints.length && `${prefix}：${contract.continuityConstraints.join("；")}`,
    contract.negativeConstraints.length && `避免出现：${contract.negativeConstraints.join("；")}`
  ];
}

function compileImagePrompt(contract) {
  const explicit = contract.imagePrompt || (contract.promptContractVersion === 1 ? contract.legacyPrompt : "");
  const structuredContext = [
    contract.scene && `场景：${contract.scene}`,
    contract.purpose && `镜头目的：${contract.purpose}`,
    contract.subject && `主体：${contract.subject}`,
    !contract.subject && contract.subjectIds.length && `主体身份锚：${contract.subjectIds.join("、")}`,
    contract.startState && `静帧状态：${contract.startState}`,
    cameraSentence({ ...contract.camera, movement: "", speed: "" }),
    contract.style && `视觉风格：${contract.style}`,
    contract.promptContractVersion === 2 && contract.legacyPrompt && `补充描述：${contract.legacyPrompt}`
  ];
  return composePrompt(explicit ? [explicit] : structuredContext, [
    ...(explicit ? structuredContext : []),
    ...continuitySentences(contract)
  ]);
}

function compileVideoPrompt(contract, { motionFirst = false, nativeAudio = false } = {}) {
  const explicit = contract.videoPrompt || (contract.promptContractVersion === 1 ? contract.legacyPrompt : "");
  const visualContext = [
    !motionFirst && contract.scene && `场景：${contract.scene}`,
    !motionFirst && contract.subject && `主体：${contract.subject}`,
    !motionFirst && !contract.subject && contract.subjectIds.length && `主体身份锚：${contract.subjectIds.join("、")}`,
    contract.promptContractVersion === 2 && contract.legacyPrompt && `补充描述：${contract.legacyPrompt}`
  ];
  const executionConstraints = [
    contract.motion.subject && `主体动作：${contract.motion.subject}`,
    contract.motion.environment && `环境动态：${contract.motion.environment}`,
    cameraSentence(contract.camera),
    contract.motion.timing?.length && `时间节奏：${contract.motion.timing.join("；")}`,
    contract.startState && contract.endState && `状态变化：从“${contract.startState}”自然过渡到“${contract.endState}”`,
    contract.transition && `转场：${contract.transition}`,
    nativeAudio && soundSentence(contract.soundPlan),
    ...continuitySentences(contract, "全程保持")
  ];
  return composePrompt(explicit ? [explicit] : visualContext, [
    ...(explicit ? visualContext : []),
    ...executionConstraints
  ]);
}

function isSha256(value) {
  return /^[a-f0-9]{64}$/i.test(String(value || ""));
}

function normalizeInputAssetBinding(inputAssetBinding) {
  if (!inputAssetBinding) return { provided: false, binding: null, errors: [] };
  if (typeof inputAssetBinding !== "object") {
    return { provided: true, binding: null, errors: [{ code: "VIDEO_INPUT_BINDING_INVALID", field: "inputAssetBinding" }] };
  }

  const errors = [];
  const referenceRole = text(inputAssetBinding.referenceRole, 40);
  if (!supportedReferenceRoles.has(referenceRole)) errors.push({ code: "VIDEO_REFERENCE_ROLE_UNSUPPORTED", field: "inputAssetBinding.referenceRole" });

  const upstreamRequestDigest = text(inputAssetBinding.upstreamRequestDigest, 80);
  const assetId = text(inputAssetBinding.assetId, 120);
  if (upstreamRequestDigest && assetId) errors.push({ code: "VIDEO_INPUT_BINDING_AMBIGUOUS", field: "inputAssetBinding" });
  if (upstreamRequestDigest) {
    if (!isSha256(upstreamRequestDigest)) errors.push({ code: "VIDEO_UPSTREAM_DIGEST_INVALID", field: "inputAssetBinding.upstreamRequestDigest" });
    return {
      provided: true,
      binding: errors.length ? null : { source: inputAssetBinding.source || "upstream-image-request", referenceRole, upstreamRequestDigest: upstreamRequestDigest.toLowerCase(), ...(inputAssetBinding.upstreamShotId ? { upstreamShotId: inputAssetBinding.upstreamShotId, result: inputAssetBinding.result } : {}) },
      errors
    };
  }

  const version = Number(inputAssetBinding.version);
  const sha256 = text(inputAssetBinding.sha256, 80).toLowerCase();
  const kind = text(inputAssetBinding.kind, 40);
  if (!assetId) errors.push({ code: "VIDEO_INPUT_ASSET_ID_REQUIRED", field: "inputAssetBinding.assetId" });
  if (!Number.isInteger(version) || version < 1) errors.push({ code: "VIDEO_INPUT_ASSET_VERSION_REQUIRED", field: "inputAssetBinding.version" });
  if (!isSha256(sha256)) errors.push({ code: "VIDEO_INPUT_ASSET_HASH_REQUIRED", field: "inputAssetBinding.sha256" });
  if (kind !== (MEDIA_ROLES[referenceRole] || "image")) errors.push({ code: "VIDEO_INPUT_ASSET_KIND_INVALID", field: "inputAssetBinding.kind" });
  return {
    provided: true,
    binding: errors.length ? null : compactObject({
      source: "asset",
      assetId,
      familyId: text(inputAssetBinding.familyId, 120) || assetId,
      version,
      sha256,
      kind,
      referenceRole
    }),
    errors
  };
}

export function validateShotContract(shot = {}, options = {}) {
  const contract = normalizeShotContract(shot);
  const errors = [];
  const warnings = [];
  if (!contract.id) errors.push({ code: "SHOT_ID_REQUIRED", field: "id" });
  if (!supportedContractVersions.has(contract.promptContractVersion)) errors.push({ code: "PROMPT_CONTRACT_VERSION_UNSUPPORTED", field: "promptContractVersion" });
  if (!supportedModes.has(contract.generationMode)) errors.push({ code: "SHOT_GENERATION_MODE_UNSUPPORTED", field: "generationMode" });
  if (!supportedAudioModes.has(contract.audioMode)) errors.push({ code: "SHOT_AUDIO_MODE_UNSUPPORTED", field: "audioMode" });
  if (!Number.isFinite(contract.duration) || contract.duration <= 0) errors.push({ code: "SHOT_DURATION_INVALID", field: "duration" });
  if (contract.promptContractVersion === 2) {
    if (!contract.purpose) errors.push({ code: "SHOT_PURPOSE_REQUIRED", field: "purpose" });
    if (!contract.sceneId) errors.push({ code: "SHOT_SCENE_ID_REQUIRED", field: "sceneId" });
    if (!contract.motion.subject && !["static-motion", "uploaded-video"].includes(contract.generationMode)) {
      errors.push({ code: "SHOT_SUBJECT_MOTION_REQUIRED", field: "motion.subject" });
    }
    if (Object.keys(contract.soundPlan).length && !contract.audioModeDeclared) errors.push({ code: "SHOT_AUDIO_MODE_REQUIRED", field: "audioMode" });
    if (contract.audioMode === "source-asset" && !contract.sourceAudioAssetId) errors.push({ code: "SHOT_SOURCE_AUDIO_ASSET_REQUIRED", field: "sourceAudioAssetId" });
    if (!contract.startState) warnings.push({ code: "SHOT_START_STATE_RECOMMENDED", field: "startState" });
    if (!contract.endState && !["static-motion", "uploaded-video"].includes(contract.generationMode)) warnings.push({ code: "SHOT_END_STATE_RECOMMENDED", field: "endState" });
    if (!contract.camera.shotSize) warnings.push({ code: "SHOT_SIZE_RECOMMENDED", field: "camera.shotSize" });
    if (contract.audioMode === "provider-native" && !Object.keys(contract.soundPlan).length) warnings.push({ code: "SHOT_NATIVE_AUDIO_PLAN_RECOMMENDED", field: "soundPlan" });
    if (contract.audioMode === "none" && Object.keys(contract.soundPlan).length) warnings.push({ code: "SHOT_SOUND_PLAN_IGNORED", field: "soundPlan" });
  } else if (contract.promptContractVersion === 1) {
    warnings.push({ code: "LEGACY_PROMPT_CONTRACT", field: "promptContractVersion" });
  }
  const cameraMovements = textList(shot.camera?.movements, 10, 80);
  if (cameraMovements.length > 1) warnings.push({ code: "MULTIPLE_PRIMARY_CAMERA_MOVES", field: "camera.movements", count: cameraMovements.length });
  const timing = contract.motion.timing || [];
  if (timing.length > Math.max(3, Math.ceil(contract.duration / 2))) warnings.push({ code: "SHOT_TIMELINE_TOO_DENSE", field: "motion.timing", count: timing.length });
  const complexityScore = [contract.motion.subject, contract.motion.environment, contract.camera.movement, contract.transition, ...timing].filter(Boolean).length;
  if (complexityScore > Number(options.maxComplexity || 6)) warnings.push({ code: "SHOT_COMPLEXITY_BUDGET_EXCEEDED", field: "motion", score: complexityScore });
  return { valid: errors.length === 0, contract, errors, warnings, complexityScore };
}

function imageRequestFor(contract, settings, prompt) {
  if (settings.imageProvider === "codex-imagegen") return { kind: "codex-imagegen", model: "codex-imagegen", prompt, parameters: {} };
  return {
    kind: "seedream-image",
    model: text(settings.seedreamModel, 160),
    prompt,
    parameters: {
      size: "2K",
      response_format: "url",
      watermark: settings.watermark === true,
      output_format: "png"
    }
  };
}

function videoRequestFor(contract, settings, prompt, inputBindings) {
  const nativeAudio = contract.audioModeDeclared ? contract.audioMode === "provider-native" : settings.generateAudio === true;
  const operationPrompt = contract.videoInputMode === "video-extend" ? "延长参考视频，承接参考视频结束时的动作与声音；输出后续的新内容。 " : contract.videoInputMode === "video-edit" ? "编辑参考视频，保留未指定修改的内容。 " : "";
  const editPrompt = contract.edit ? ` 仅修改 ${contract.edit.startSeconds}–${contract.edit.endSeconds} 秒：${contract.edit.instruction}。保持：${(contract.edit.preserve || []).join("；")}。` : "";
  return {
    kind: "seedance-video",
    model: text(settings.seedanceModel, 160),
    prompt: operationPrompt + prompt + editPrompt,
    inputMode: contract.videoInputMode,
    inputs: inputBindings.map(binding => ({ ...binding, providerRole: binding.referenceRole === "first-frame" ? "first_frame" : MEDIA_ROLES[binding.referenceRole] ? binding.referenceRole : "reference_image" })),
    parameters: compactObject({
      ratio: text(contract.videoParameters.ratio || settings.ratio, 20),
      duration: contract.duration,
      watermark: settings.watermark === true,
      return_last_frame: true,
      resolution: text(contract.videoParameters.resolution || settings.resolution, 30),
      generate_audio: nativeAudio
    })
  };
}

function promptTruncationWarning(field, compilation) {
  return {
    code: "PROMPT_TRUNCATED",
    field,
    originalLength: compilation.originalLength,
    limit: compilation.limit,
    truncatedSections: compilation.truncatedSections
  };
}

export function compileShotRequests({ shot = {}, settings = {}, inputAssetBinding = null, inputAssetBindings = null, videoInputMode = null } = {}) {
  const validation = validateShotContract(shot);
  const contract = validation.contract;
  contract.videoInputMode = videoInputMode || contract.videoInputMode;
  const videoGenerationRequired = ["auto", "seedance"].includes(contract.generationMode);
  const imageGenerationApplicable = contract.generationMode === "static-motion" || (contract.generationMode !== "uploaded-video" && contract.videoInputMode === "image-to-video" && !contract.continuation);
  const suppliedBindings = (inputAssetBindings || (inputAssetBinding ? [inputAssetBinding] : [])).map(normalizeInputAssetBinding);
  const suppliedBinding = suppliedBindings[0] || normalizeInputAssetBinding(null);
  const imageGenerationRequired = imageGenerationApplicable && !suppliedBindings.some(value => value.binding?.source === "asset");
  const nativeAudio = contract.audioMode === "provider-native"
    || (contract.promptContractVersion === 1 && !contract.audioModeDeclared && settings.generateAudio === true);

  const imageCompilation = compileImagePrompt(contract);
  const imageRequest = imageGenerationRequired ? imageRequestFor(contract, settings, imageCompilation.prompt) : null;
  const imageRequestDigest = imageRequest ? promptDigest(imageRequest) : null;
  const effectiveBinding = suppliedBinding.binding || (!suppliedBinding.provided && imageRequestDigest
    ? { source: "upstream-image-request", referenceRole: "first-frame", upstreamRequestDigest: imageRequestDigest }
    : null);
  const effectiveBindings = suppliedBindings.length ? suppliedBindings.map(value => value.binding).filter(Boolean) : effectiveBinding ? [effectiveBinding] : [];
  const videoCompilation = compileVideoPrompt(contract, {
    motionFirst: ["first-frame", "first_frame"].includes(effectiveBinding?.referenceRole),
    nativeAudio
  });
  const videoRequest = videoGenerationRequired
    ? videoRequestFor(contract, settings, videoCompilation.prompt, effectiveBindings)
    : null;

  const errors = [...validation.errors];
  const warnings = [...validation.warnings];
  const capabilityErrors = suppliedBindings.flatMap(value => value.errors);
  for (const key of Object.keys(contract.videoParameters)) {
    if (!["ratio", "resolution"].includes(key)) capabilityErrors.push({ code: "SEEDANCE_PARAMETER_UNSUPPORTED", field: `videoParameters.${key}` });
  }
  if (imageCompilation.truncated) warnings.push(promptTruncationWarning("imagePrompt", imageCompilation));
  if (videoCompilation.truncated) warnings.push(promptTruncationWarning("videoPrompt", videoCompilation));

  if (imageGenerationRequired && !supportedImageProviders.has(settings.imageProvider)) capabilityErrors.push({ code: "IMAGE_PROVIDER_UNSUPPORTED", field: "settings.imageProvider" });
  if (imageGenerationRequired && settings.imageProvider === "ark-seedream" && !text(settings.seedreamModel, 160)) capabilityErrors.push({ code: "SEEDREAM_MODEL_REQUIRED", field: "settings.seedreamModel" });
  if (suppliedBinding.binding?.source === "upstream-image-request" && suppliedBinding.binding.upstreamRequestDigest !== imageRequestDigest) {
    capabilityErrors.push({ code: "VIDEO_UPSTREAM_DIGEST_MISMATCH", field: "inputAssetBinding.upstreamRequestDigest" });
  }
  if (videoGenerationRequired) {
    if (!text(settings.seedanceModel, 160)) capabilityErrors.push({ code: "SEEDANCE_MODEL_REQUIRED", field: "settings.seedanceModel" });
    capabilityErrors.push(...validateSeedanceRequest({ ...videoRequest, edit: contract.edit }));
  }
  if (imageGenerationRequired && !imageCompilation.prompt) errors.push({ code: "SHOT_IMAGE_PROMPT_REQUIRED", field: "imagePrompt" });
  if (videoGenerationRequired && !videoCompilation.prompt) errors.push({ code: "SHOT_VIDEO_PROMPT_REQUIRED", field: "videoPrompt" });

  const requests = { image: imageRequest, video: videoRequest };
  const requestDigests = {
    image: imageRequestDigest,
    video: videoRequest ? promptDigest(videoRequest) : null
  };
  const valid = errors.length === 0;
  const executable = valid && capabilityErrors.length === 0;
  return {
    compilerVersion: PROMPT_COMPILER_VERSION,
    contractVersion: contract.promptContractVersion,
    contract,
    imagePrompt: imageCompilation.prompt,
    videoPrompt: videoCompilation.prompt,
    validation: { valid, errors, warnings, complexityScore: validation.complexityScore, capabilityErrors },
    executable,
    requests,
    requestDigests,
    digest: promptDigest({ compilerVersion: PROMPT_COMPILER_VERSION, contract, requests, executable, capabilityErrors })
  };
}
