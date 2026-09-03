import { compileShotRequests } from "./prompt-compiler.mjs";
import { seedanceProfile, shotInputMode, shotMediaReferences, shotNeedsImage, MEDIA_ROLES, validateSeedanceRequest } from "./seedance-contract.mjs";
import { validatePlaybackReview } from "./quality-contract.mjs";
import { hasExecutionAuthorization } from "./execution-policy.mjs";
import { canonicalSkillNames } from "./skill-identifiers.mjs";

const allowedAspectRatios = new Set(["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive"]);
const allowedGenerationModes = new Set(["auto", "seedance", "static-motion", "uploaded-video"]);

function text(value, max = 1000) {
  return String(value || "").trim().slice(0, max);
}

function textList(value, maxItems = 30, maxLength = 500) {
  return Array.isArray(value)
    ? value.map(item => text(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

function statusNode(id, label, status, detail, dependsOn = []) {
  return { id, label, status, detail, dependsOn };
}

function emptyProduction() {
  return { logline: "", brief: {}, selectedSkills: [], planRevision: 0, script: { premise: "", scenes: [] }, characters: [], shots: [] };
}

function validHash(value) {
  return /^[a-f0-9]{64}$/i.test(String(value || ""));
}

function hasAudioStream(media) {
  return Boolean(media?.audio && (media.audio.codec || media.audio.channels || media.audio.sampleRate));
}

function hasVerifiedAudio(item) {
  return Boolean(
    hasAudioStream(item?.media)
    && (
      item.audioAnalysis?.audible === true
      || item.media?.audio?.audible === true
      || item.inspection?.audio === "passed"
    )
  );
}

function usableSourceAsset(asset, kind) {
  return Boolean(
    asset
    && !asset.stale
    && asset.kind === kind
    && text(asset.localPath, 1000)
    && validHash(asset.sha256)
    && Number(asset.size || asset.bytes || 0) > 0
  );
}

function expectedQualityCriteria(brief, shots) {
  const criteria = [...(brief.acceptanceCriteria || [])];
  const briefCriteria = new Set(criteria);
  for (const shot of shots) {
    for (const criterion of shot.acceptanceCriteria || []) {
      if (!briefCriteria.has(criterion)) criteria.push(`镜头 ${shot.id}: ${criterion}`);
    }
  }
  return [...new Set(criteria.map(item => text(item, 500)).filter(Boolean))];
}

function completeReviewEvidence(review, brief, shots, output) {
  if (output?.reviewEvidence?.temporal) {
    try { validatePlaybackReview(review || {}, output.reviewEvidence, shots, "passed"); } catch { return false; }
  }
  const checks = review?.checks || {};
  const criteriaByName = new Map((review?.criteriaResults || []).map(item => [text(item?.criterion, 500), item]));
  const criteriaComplete = expectedQualityCriteria(brief, shots).every(criterion => {
    const result = criteriaByName.get(criterion);
    return result?.status === "passed" && Boolean(text(result.evidence, 2000));
  });
  const hasSubtitles = shots.some(shot => text(shot.subtitle, 1000));
  const hasAudioIntent = shots.some(shot => text(shot.audio, 1000) || Object.values(shot.soundPlan || {}).some(value => text(value, 1000)) || !["", "none"].includes(text(shot.audioMode, 40)));
  const audioSourceEvidenceComplete = shots.filter(shot => text(shot.audio, 1000) || Object.values(shot.soundPlan || {}).some(value => text(value, 1000)) || !["", "none"].includes(text(shot.audioMode, 40))).every(shot => {
    const evidence = output?.inputShots?.find(item => item.shotId === shot.id);
    const sourceAudio = evidence?.sourceAudioAsset;
    return evidence?.sourceHasAudio === true || Boolean(
      sourceAudio?.assetId
      && sourceAudio.kind === "audio"
      && validHash(sourceAudio.sha256)
    );
  });
  const checksComplete = ["visual", "continuity", "subtitles", "audio", "brandAccuracy"]
    .every(name => ["passed", "not-applicable"].includes(checks[name]));
  return Boolean(
    review?.decision === "passed"
    && review.id
    && text(review.notes, 5000)
    && text(review.inspectedBy, 120)
    && text(review.inspectedAt, 80)
    && checks.visual === "passed"
    && checksComplete
    && (shots.length < 2 || checks.continuity === "passed")
    && (!hasSubtitles || checks.subtitles === "passed")
    && (!hasAudioIntent || (checks.audio === "passed" && audioSourceEvidenceComplete && hasAudioStream(review.fileEvidence?.media)))
    && (!brief.brandName || checks.brandAccuracy === "passed")
    && criteriaComplete
    && review.technical?.playable === true
    && validHash(review.fileEvidence?.sha256)
    && Number(review.fileEvidence?.bytes || 0) > 0
    && Number(review.fileEvidence?.media?.duration || 0) > 0
    && Number(review.fileEvidence?.media?.video?.width || 0) > 0
    && Number(review.fileEvidence?.media?.video?.height || 0) > 0
    && validHash(review.evidencePack?.digest)
    && Number(review.evidencePack?.frameCount || 0) > 0
    && Array.isArray(review.inspectedFrameSha256s)
    && review.inspectedFrameSha256s.length === Number(review.evidencePack?.frameCount || 0)
    && review.inspectedFrameSha256s.every(validHash)
  );
}

function completeDeliveryEvidence(delivery, output, review, planRevision) {
  return Boolean(
    delivery?.status === "delivered"
    && delivery.localOnly === true
    && text(delivery.deliveredAt, 80)
    && text(delivery.localPath, 1000)
    && /\.mp4$/i.test(delivery.localPath)
    && delivery.localPath === output?.localPath
    && validHash(delivery.sha256)
    && Number(delivery.bytes || 0) > 0
    && Number(delivery.duration || 0) > 0
    && Number(delivery.duration || 0) === Number(review?.fileEvidence?.media?.duration || 0)
    && Number(delivery.planRevision || 0) === planRevision
    && delivery.reviewId === review?.id
    && delivery.sha256 === review?.fileEvidence?.sha256
    && Number(delivery.bytes || 0) === Number(review?.fileEvidence?.bytes || 0)
    && Number(delivery.media?.video?.width || 0) > 0
    && Number(delivery.media?.video?.height || 0) > 0
    && Number(delivery.media?.video?.width || 0) === Number(review?.fileEvidence?.media?.video?.width || 0)
    && Number(delivery.media?.video?.height || 0) === Number(review?.fileEvidence?.media?.video?.height || 0)
  );
}

export function getProductionHarnessProfile() {
  return {
    productionUnit: "creation-page",
    delivery: {
      format: "video/mp4",
      location: "local",
      maximumFilesPerCreation: 1,
      qualityReviewRequired: true
    }
  };
}

export function normalizeProductionBrief(input = {}, current = {}, fallback = {}) {
  const duration = Number(input.durationSeconds ?? current.durationSeconds ?? 0);
  const aspectRatio = text(input.aspectRatio ?? current.aspectRatio ?? fallback.aspectRatio, 20);
  const preferredText = (inputValue, currentValue, fallbackValue) => {
    if (inputValue !== undefined) return inputValue;
    return text(currentValue) ? currentValue : fallbackValue;
  };
  return {
    objective: text(preferredText(input.objective, current.objective, fallback.objective), 1200),
    contentType: text(input.contentType ?? current.contentType, 80),
    audience: text(input.audience ?? current.audience, 500),
    platform: text(input.platform ?? current.platform, 120),
    durationSeconds: Number.isFinite(duration) && duration > 0 ? Math.min(duration, 86400) : 0,
    aspectRatio: allowedAspectRatios.has(aspectRatio) ? aspectRatio : (fallback.aspectRatio || "9:16"),
    language: text(input.language ?? current.language, 80),
    brandName: text(input.brandName ?? current.brandName, 160),
    sellingPoints: textList(input.sellingPoints ?? current.sellingPoints, 30, 300),
    callToAction: text(input.callToAction ?? current.callToAction, 500),
    style: text(input.style ?? current.style, 800),
    constraints: textList(input.constraints ?? current.constraints, 50, 500),
    deliverables: textList(input.deliverables ?? current.deliverables, 30, 300),
    acceptanceCriteria: textList(input.acceptanceCriteria ?? current.acceptanceCriteria, 50, 500),
    sourceAssetIds: textList(input.sourceAssetIds ?? current.sourceAssetIds, 500, 120)
  };
}

export function getSeedanceCapabilityProfile(settings = {}) {
  const profile = seedanceProfile(settings.seedanceModel);
  return {
    provider: "volcengine-ark",
    model: text(settings.seedanceModel, 120),
    adapter: "OpenDramaFlow multimodal Seedance",
    acceptedInputs: ["text", "image_url:https", "image_url:asset", "video_url:https", "video_url:asset", "audio_url:https", "audio_url:asset"],
    modes: profile.modes,
    maxReferenceImages: profile.maxImages,
    maxReferenceVideos: profile.maxVideos,
    maxReferenceAudios: profile.maxAudios,
    supportedRatios: profile.ratios,
    supportedResolutions: profile.resolutions,
    duration: { integerSeconds: true, minimum: profile.minimum, maximum: profile.maximum },
    generateAudio: Boolean(settings.generateAudio),
    returnsLastFrame: true,
    accountVerified: false,
    editing: "prompt-guided temporal edits; new version, not destructive in-place or guaranteed pixel masks",
    unsupportedByAdapter: ["guaranteed pixel-exact masked edits", "managed voice cloning", "professional NLE project export"]
  };
}

export function dimensionsForAspectRatio(aspectRatio = "9:16") {
  const dimensions = {
    "16:9": { width: 1280, height: 720 },
    "4:3": { width: 960, height: 720 },
    "1:1": { width: 720, height: 720 },
    "3:4": { width: 720, height: 960 },
    "9:16": { width: 720, height: 1280 },
    "21:9": { width: 1260, height: 540 }
  };
  return dimensions[aspectRatio] || dimensions["9:16"];
}

export function validateSeedanceShots(shots = [], settings = {}, brief = {}) {
  const profile = getSeedanceCapabilityProfile(settings);
  const errors = [];
  const warnings = [];
  const normalized = [];
  const requiresSeedance = shots.some(shot => !["static-motion", "uploaded-video"].includes(shot.generationMode) && !shot.clipPath);
  const requestedRatio = text(brief.aspectRatio, 20);
  if (requiresSeedance && requestedRatio && requestedRatio !== "adaptive" && !profile.supportedRatios.includes(requestedRatio)) {
    errors.push({
      shotId: null,
      code: "SEEDANCE_RATIO_MISMATCH",
      message: `交付画幅为 ${requestedRatio}，当前 Seedance 批次锁定为 ${profile.supportedRatios[0]}；请先统一模型参数与交付画幅`
    });
  }
  for (const shot of shots) {
    if (["static-motion", "uploaded-video"].includes(shot.generationMode) || shot.clipPath) continue;
    const referenceAssetIds = [...new Set((shot.referenceAssetIds || []).map(item => text(item, 120)).filter(Boolean))];
    if (referenceAssetIds.length > profile.maxReferenceImages) {
      errors.push({ shotId: shot.id, code: "SEEDANCE_REFERENCE_LIMIT_EXCEEDED", message: `镜头 ${shot.id} 提供了 ${referenceAssetIds.length} 张参考图，当前适配器最多支持 ${profile.maxReferenceImages} 张` });
    }
    const duration = Number(shot.duration || 0);
    const compiled = compileShotRequests({ shot, settings, inputAssetBinding: referenceAssetIds.length ? { assetId: referenceAssetIds[0] } : null, videoInputMode: shotInputMode(shot) });
    const inputs = shotMediaReferences(shot).map(ref => ({ role: ref.role }));
    if (shot.continuation) inputs.unshift({ role: shot.continuation.source === "last-frame" ? "first_frame" : "reference_video" });
    if (!inputs.length && shotInputMode(shot) === "image-to-video") inputs.push({ role: "first_frame" }); // Missing image is a separate gate.
    for (const issue of validateSeedanceRequest({ model: settings.seedanceModel, inputMode: shotInputMode(shot), inputs, parameters: compiled.requests.video?.parameters, edit: shot.edit })) {
      errors.push({ shotId: shot.id, ...issue, message: `镜头 ${shot.id} 输入合同不兼容：${issue.code}` });
    }
    for (const issue of compiled.validation.capabilityErrors.filter(item => item.code === "SEEDANCE_PARAMETER_UNSUPPORTED")) errors.push({ shotId: shot.id, ...issue });
    if (!text(compiled.videoPrompt, 3000)) errors.push({ shotId: shot.id, code: "SHOT_VIDEO_PROMPT_REQUIRED", message: "Seedance 镜头缺少可执行的运动 Prompt" });
    for (const issue of compiled.validation.errors) {
      errors.push({ shotId: shot.id, code: issue.code, message: `镜头 ${shot.id} 的结构化镜头合同不完整：${issue.field}` });
    }
    for (const issue of compiled.validation.warnings) {
      if (issue.code === "LEGACY_PROMPT_CONTRACT") continue;
      warnings.push({ shotId: shot.id, code: issue.code, message: `镜头 ${shot.id} 的 Prompt 合同需要复核：${issue.field}` });
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      errors.push({ shotId: shot.id, code: "SHOT_DURATION_INVALID", message: "Seedance 镜头时长无效" });
      continue;
    }
    if (duration > profile.duration.maximum) {
      errors.push({ shotId: shot.id, code: "SEEDANCE_DURATION_EXCEEDS_ADAPTER", message: `镜头 ${shot.id} 为 ${duration}s，当前适配器单次最多 ${profile.duration.maximum}s；请拆分镜头` });
      continue;
    }
    const providerDuration = duration;
    if (!Number.isInteger(duration) || duration < profile.duration.minimum) errors.push({ shotId: shot.id, code: "SEEDANCE_DURATION_UNSUPPORTED", message: "生成时长必须为模型范围内整数；不自动改写已审批时长" });
    normalized.push({ shotId: shot.id, requestedDuration: duration, providerDuration });
  }
  return { compatible: errors.length === 0, profile, errors, warnings, normalized };
}

function productionUnit(project, creationId) {
  if (!creationId) return { creation: null, production: project, scopeCreationId: null };
  const creation = project.creations?.find(item => item.id === creationId);
  if (!creation) throw new Error("CREATION_NOT_FOUND");
  const legacy = creation.planSource === "project-legacy";
  return { creation, production: legacy ? project : (creation.plan || emptyProduction()), scopeCreationId: legacy ? null : creationId };
}

function belongsToCreation(asset, creationId, refs) {
  return !creationId || asset.creationId === creationId || refs.has(asset.id);
}

function latestFor(items, predicate) {
  return (items || []).filter(predicate).sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))[0] || null;
}

export function buildProductionStatus(state, projectId, creationId = null, options = {}) {
  const project = state.projects?.find(item => item.id === projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const { creation, production, scopeCreationId } = productionUnit(project, creationId);
  const shots = production.shots || [];
  const brief = normalizeProductionBrief(production.brief, production.brief, {
    objective: production.logline || production.script?.premise || "",
    aspectRatio: state.settings?.ratio || "9:16"
  });
  const selectedSkills = canonicalSkillNames(Array.isArray(production.selectedSkills) ? production.selectedSkills : []);
  const planRevision = Number(production.planRevision || 0);
  const projectAssets = project.assets || [];
  const harnessProfile = getProductionHarnessProfile();
  const deliveryBoundaryExceeded = brief.deliverables.length > harnessProfile.delivery.maximumFilesPerCreation;
  const excessDeliverables = brief.deliverables.slice(harnessProfile.delivery.maximumFilesPerCreation);
  const referenceRequests = [
    ...(creation?.assetRefs || []).map(reference => ({
      assetId: text(reference?.assetId, 120),
      ownerType: "creation",
      ownerId: creation?.id || null,
      expectedKind: null,
      expectedVersion: Number.isInteger(Number(reference?.version)) && Number(reference.version) > 0 ? Number(reference.version) : null
    })),
    ...brief.sourceAssetIds.map(assetId => ({ assetId, ownerType: "brief", ownerId: null, expectedKind: null, expectedVersion: null })),
    ...(production.characters || []).flatMap(character => (character.referenceAssetIds || []).map(assetId => ({
      assetId: text(assetId, 120),
      ownerType: "character",
      ownerId: text(character.id || character.name, 120) || null,
      expectedKind: "image",
      expectedVersion: null
    }))),
    ...shots.flatMap(shot => [
      ...(shot.mediaReferences || []).map(ref => ({ assetId: ref.assetId, ownerType: "shot-media", ownerId: shot.id, expectedKind: MEDIA_ROLES[ref.role], expectedVersion: ref.version || null })),
      ...(shot.referenceAssetIds || []).map(assetId => ({ assetId: text(assetId, 120), ownerType: "shot-reference", ownerId: text(shot.id, 80) || null, expectedKind: "image", expectedVersion: null })),
      shot.sourceVideoAssetId ? { assetId: text(shot.sourceVideoAssetId, 120), ownerType: "shot-video", ownerId: text(shot.id, 80) || null, expectedKind: "video", expectedVersion: null } : null,
      shot.sourceAudioAssetId ? { assetId: text(shot.sourceAudioAssetId, 120), ownerType: "shot-audio", ownerId: text(shot.id, 80) || null, expectedKind: "audio", expectedVersion: null } : null
    ])
  ].filter(reference => reference?.assetId);
  const assetById = new Map(projectAssets.map(asset => [asset.id, asset]));
  const referenceIssues = referenceRequests.flatMap(reference => {
    const asset = assetById.get(reference.assetId);
    if (!asset) return [{ ...reference, code: "ASSET_REFERENCE_NOT_FOUND", actualKind: null, actualVersion: null }];
    if (asset.stale) return [{ ...reference, code: "ASSET_REFERENCE_STALE", actualKind: asset.kind || null, actualVersion: Number(asset.version || 1) }];
    if (reference.expectedKind && asset.kind !== reference.expectedKind) {
      return [{ ...reference, code: "ASSET_REFERENCE_KIND_INVALID", actualKind: asset.kind || null, actualVersion: Number(asset.version || 1) }];
    }
    if (reference.expectedVersion && reference.expectedVersion !== Number(asset.version || 1)) {
      return [{ ...reference, code: "ASSET_REFERENCE_VERSION_MISMATCH", actualKind: asset.kind || null, actualVersion: Number(asset.version || 1) }];
    }
    return [];
  });
  const referenceIdsFor = code => [...new Set(referenceIssues.filter(issue => issue.code === code).map(issue => issue.assetId))];
  const missingReferenceAssetIds = referenceIdsFor("ASSET_REFERENCE_NOT_FOUND");
  const staleReferenceAssetIds = referenceIdsFor("ASSET_REFERENCE_STALE");
  const invalidReferenceKinds = referenceIssues.filter(issue => issue.code === "ASSET_REFERENCE_KIND_INVALID");
  const mismatchedReferenceVersions = referenceIssues.filter(issue => issue.code === "ASSET_REFERENCE_VERSION_MISMATCH");
  const referencesValid = referenceIssues.length === 0;
  const sourceAssets = brief.sourceAssetIds.map(assetId => projectAssets.find(asset => asset.id === assetId));
  const missingSourceAssetIds = brief.sourceAssetIds.filter((assetId, index) => !sourceAssets[index]);
  const staleSourceAssetIds = brief.sourceAssetIds.filter((assetId, index) => sourceAssets[index]?.stale);
  const requiredBriefFields = [
    ["objective", Boolean(brief.objective)],
    ["contentType", Boolean(brief.contentType)],
    ["audience", Boolean(brief.audience)],
    ["platform", Boolean(brief.platform)],
    ["durationSeconds", Number(brief.durationSeconds || 0) > 0],
    ["aspectRatio", allowedAspectRatios.has(brief.aspectRatio)],
    ["deliverables", brief.deliverables.length > 0],
    ["acceptanceCriteria", brief.acceptanceCriteria.length > 0]
  ];
  const missingBriefFields = requiredBriefFields.filter(([, present]) => !present).map(([field]) => field);
  const briefComplete = !missingBriefFields.length && !missingSourceAssetIds.length && !staleSourceAssetIds.length;
  const refs = new Set(referenceRequests.map(reference => reference.assetId));
  const sourceVideoFor = shot => shot.sourceVideoAssetId
    ? projectAssets.find(asset => asset.id === shot.sourceVideoAssetId && usableSourceAsset(asset, "video")) || null
    : null;
  const sourceAudioFor = shot => shot.sourceAudioAssetId
    ? projectAssets.find(asset => asset.id === shot.sourceAudioAssetId && usableSourceAsset(asset, "audio")) || null
    : null;
  const scopedAssets = (project.assets || []).filter(asset => !asset.stale && belongsToCreation(asset, scopeCreationId, refs));
  const imageFor = shot => (shot.referenceAssetIds || [])
    .map(assetId => scopedAssets.find(asset => asset.id === assetId && asset.kind === "image"))
    .find(Boolean) || scopedAssets.find(asset => asset.shotId === shot.id && asset.kind === "image") || null;
  const compiledShots = shots.map(shot => ({
    shot,
    compiled: compileShotRequests({ shot, settings: state.settings || {}, inputAssetBinding: imageFor(shot) ? { assetId: imageFor(shot).id } : null, videoInputMode: shotInputMode(shot) })
  }));
  const missingPrompts = compiledShots.filter(({ shot, compiled }) => {
    if (shot.generationMode === "uploaded-video") return false;
    if (shotNeedsImage(shot) && !compiled.imagePrompt && !shot.clipPath) return true;
    return !["static-motion"].includes(shot.generationMode) && !shot.clipPath && !compiled.videoPrompt;
  }).map(({ shot }) => shot.id);
  const invalidPromptContracts = compiledShots
    .filter(({ compiled }) => !compiled.validation.valid)
    .map(({ shot, compiled }) => ({ shotId: shot.id, errors: compiled.validation.errors }));
  const promptContractWarnings = compiledShots
    .flatMap(({ shot, compiled }) => compiled.validation.warnings.map(warning => ({ shotId: shot.id, ...warning })));
  const legacyPromptShots = promptContractWarnings.filter(item => item.code === "LEGACY_PROMPT_CONTRACT").map(item => item.shotId);
  const shotIdCounts = shots.reduce((counts, shot) => {
    const id = text(shot.id, 80);
    counts.set(id, (counts.get(id) || 0) + 1);
    return counts;
  }, new Map());
  const invalidShotIds = shots.filter(shot => !text(shot.id, 80)).map((_, index) => `index:${index}`);
  const duplicateShotIds = [...shotIdCounts.entries()].filter(([id, count]) => id && count > 1).map(([id]) => id);
  const invalidGenerationModes = shots.filter(shot => !allowedGenerationModes.has(shot.generationMode || "auto")).map(shot => shot.id || "unknown");
  const invalidShotDurations = shots.filter(shot => !Number.isFinite(Number(shot.duration)) || Number(shot.duration) <= 0).map(shot => shot.id);
  const invalidShots = [...new Set([...invalidShotIds, ...duplicateShotIds, ...invalidGenerationModes, ...invalidShotDurations, ...invalidPromptContracts.map(item => item.shotId)])];
  const missingImages = shots.filter(shot => !shot.clipPath && shotNeedsImage(shot) && !imageFor(shot) && !shotMediaReferences(shot).some(ref => MEDIA_ROLES[ref.role] === "image")).map(shot => shot.id);
  const missingUploadedVideos = shots.filter(shot => !shot.clipPath && shot.generationMode === "uploaded-video" && !sourceVideoFor(shot)).map(shot => shot.id);
  const missingGeneratedVideos = shots.filter(shot => !shot.clipPath && !["static-motion", "uploaded-video"].includes(shot.generationMode)).map(shot => shot.id);
  const missingVideos = [...missingUploadedVideos, ...missingGeneratedVideos];
  const staticShotsWithoutImages = shots.filter(shot => !shot.clipPath && shot.generationMode === "static-motion" && !imageFor(shot)).map(shot => shot.id);
  const approval = latestFor(state.approvals, item => item.projectId === projectId && (item.creationId || null) === scopeCreationId);
  const approvalCurrent = Boolean(approval && Number(approval.scopeSnapshot?.planRevision || 0) === planRevision);
  const approvalScopeRecorded = Boolean(approvalCurrent && validHash(approval?.scopeDigest));
  const currentJobs = (state.jobs || []).filter(item => item.projectId === projectId && (item.creationId || null) === scopeCreationId && Number(item.planRevision || 0) === planRevision);
  const boundJob = approval?.jobId ? currentJobs.find(item => item.id === approval.jobId && item.approvalId === approval.id && item.type === "real-pipeline") || null : null;
  const job = boundJob;
  const approvalAuthorized = hasExecutionAuthorization(approval);
  const automaticScope = approval?.scopeSnapshot?.executionMode === "automatic";
  const approvalTrusted = Boolean(approvalScopeRecorded && approval?.status === "approved" && approvalAuthorized && boundJob);
  const localRenderJob = latestFor(currentJobs, item => item.type === "local-render" && ["queued", "running"].includes(item.status));
  const shotVersions = new Map(shots.map(shot => [shot.id, Number(shot.promptVersion || 1)]));
  const missingImageIds = new Set(missingImages);
  const mediaTasks = (state.tasks || []).filter(item =>
    item.kind === "codex-imagegen"
    && item.projectId === projectId
    && (item.creationId || null) === scopeCreationId
    && Number(item.planRevision || 0) === planRevision
    && approvalTrusted
    && item.approvalId === approval?.id
    && missingImageIds.has(item.shotId)
    && Number(item.promptVersion || 1) === shotVersions.get(item.shotId)
  );
  const queuedTasks = mediaTasks.filter(item => item.status === "queued");
  const claimedTasks = mediaTasks.filter(item => item.status === "claimed");
  const failedTasks = mediaTasks.filter(item => item.status === "failed");
  const activeImageTasks = (state.tasks || []).filter(item =>
    item.kind === "codex-imagegen"
    && item.projectId === projectId
    && (item.creationId || null) === scopeCreationId
    && Number(item.planRevision || 0) === planRevision
    && approvalTrusted
    && item.approvalId === approval?.id
    && Number(item.promptVersion || 1) === shotVersions.get(item.shotId)
    && ["queued", "claimed"].includes(item.status)
  );
  const output = latestFor(project.outputs, item => !item.stale && (item.creationId || null) === scopeCreationId && Number(item.planRevision || 0) === planRevision);
  const outputIsLocalMp4 = Boolean(output?.localPath && /\.mp4$/i.test(output.localPath));
  const review = output?.reviews?.at(-1) || null;
  const delivery = output?.delivery || null;
  const seedance = validateSeedanceShots(shots, state.settings || {}, brief);
  const plannedDurationSeconds = shots.reduce((sum, shot) => sum + (Number.isFinite(Number(shot.duration)) ? Number(shot.duration) : 0), 0);
  const durationMismatch = Boolean(shots.length && brief.durationSeconds > 0 && (invalidShotDurations.length || Math.abs(plannedDurationSeconds - brief.durationSeconds) > 0.01));
  const currentProviderCalls = (state.providerCalls || []).filter(call =>
    call.projectId === projectId
    && call.provider !== "doubao-speech"
    && (call.creationId || null) === scopeCreationId
    && Number(call.planRevision || 0) === planRevision
  );
  const missingAudio = shots.filter(shot => {
    const soundIntent = text(shot.audio, 1000) || Object.values(shot.soundPlan || {}).some(value => text(value, 1000));
    const audioMode = text(shot.audioMode, 40) || (soundIntent ? "post" : "none");
    if (!soundIntent && audioMode === "none") return false;
    const sourceAudio = sourceAudioFor(shot);
    if (sourceAudio) return false;
    const sourceVideo = sourceVideoFor(shot);
    if (sourceVideo && hasVerifiedAudio(sourceVideo)) return false;
    const videoAsset = scopedAssets.find(asset => asset.kind === "video" && asset.shotId === shot.id && hasVerifiedAudio(asset));
    const providerAudio = currentProviderCalls.some(call => call.shotId === shot.id && call.status === "succeeded" && hasVerifiedAudio(call));
    const clipAudio = hasVerifiedAudio(shot);
    const modelWillGenerateAudio = audioMode === "provider-native" && !shot.clipPath && !["static-motion", "uploaded-video"].includes(shot.generationMode);
    return !sourceAudio && !videoAsset && !providerAudio && !clipAudio && !modelWillGenerateAudio;
  }).map(shot => shot.id);
  const reviewEvidence = output?.reviewEvidence || null;
  const reviewEvidenceReady = Boolean(outputIsLocalMp4 && reviewEvidence?.automatedVisualAcceptance === false && validHash(reviewEvidence?.digest) && validHash(reviewEvidence?.source?.sha256) && (!validHash(output?.sha256) || reviewEvidence.source.sha256 === output.sha256) && Number(reviewEvidence?.source?.bytes || 0) > 0 && Array.isArray(reviewEvidence?.frames) && reviewEvidence.frames.length > 0 && reviewEvidence.frames.every(frame => validHash(frame.sha256)));
  const reviewComplete = outputIsLocalMp4 && completeReviewEvidence(review, brief, shots, output);
  const deliveryComplete = !deliveryBoundaryExceeded && reviewComplete && completeDeliveryEvidence(delivery, output, review, planRevision);
  const paidWorkMissing = missingImages.length > 0 || missingGeneratedVideos.length > 0;
  const requiresArk = missingGeneratedVideos.length > 0 || (missingImages.length > 0 && state.settings?.imageProvider !== "codex-imagegen");
  const credentialsMissing = requiresArk && options.credentialStatus?.arkConfigured === false;
  const nodes = [
    statusNode("brief", "制作简报", briefComplete ? "completed" : "blocked", briefComplete ? "创作目标、交付约束与来源素材已记录" : `缺少或失效：${[...missingBriefFields, ...missingSourceAssetIds.map(id => `source:${id}`), ...staleSourceAssetIds.map(id => `stale:${id}`)].join("、")}`),
    statusNode("delivery-scope", "创作页交付边界", deliveryBoundaryExceeded ? "blocked" : "completed", deliveryBoundaryExceeded ? `当前简报包含 ${brief.deliverables.length} 个交付物；一个创作页只支持 1 个经复核的本地 MP4` : "当前创作页对应 1 个经复核的本地 MP4", ["brief"]),
    statusNode("routing", "专业能力路由", selectedSkills.length ? "completed" : "blocked", selectedSkills.length ? selectedSkills.join("、") : "尚未持久化已选 Skill", ["brief", "delivery-scope"]),
    statusNode("storyboard", "镜头合同", shots.length && !missingPrompts.length && !invalidShots.length && !durationMismatch ? "completed" : "blocked", shots.length ? (missingPrompts.length ? `${missingPrompts.length} 个镜头缺少分用途 Prompt` : invalidShotIds.length ? `${invalidShotIds.length} 个镜头缺少稳定 ID` : duplicateShotIds.length ? `镜头 ID 重复：${duplicateShotIds.join("、")}` : invalidGenerationModes.length ? `生成模式无效：${invalidGenerationModes.join("、")}` : invalidShotDurations.length ? `${invalidShotDurations.length} 个镜头时长无效` : invalidPromptContracts.length ? `${invalidPromptContracts.length} 个结构化镜头合同不完整` : durationMismatch ? `镜头总时长 ${plannedDurationSeconds}s 与简报 ${brief.durationSeconds}s 不一致` : `${shots.length} 个镜头已规划${legacyPromptShots.length ? `；${legacyPromptShots.length} 个旧镜头仍使用兼容 Prompt` : ""}`) : "尚无镜头", ["brief", "routing"]),
    statusNode("references", "素材引用", referencesValid ? "completed" : "blocked", referencesValid ? `${referenceRequests.length} 个显式素材引用有效` : `${referenceIssues.length} 个素材引用不存在、失效、类型错误或版本不匹配`, ["storyboard"]),
    statusNode("capability", "模型能力检查", seedance.compatible ? "completed" : "blocked", seedance.compatible ? "当前 Seedance 适配器参数兼容" : `${seedance.errors.length} 个能力冲突`, ["references"]),
    statusNode("images", "图片与参考素材", !missingImages.length ? "completed" : (queuedTasks.length || claimedTasks.length ? "waiting" : "blocked"), `${missingImages.length} 个镜头缺图`, ["references"]),
    statusNode("approval", "模型调用范围", !paidWorkMissing ? "skipped" : approvalTrusted ? "completed" : approvalScopeRecorded && approval?.status === "pending" ? "waiting" : "blocked", approvalTrusted ? `范围 ${approval.id}: ${automaticScope ? "已记录自动执行策略" : "已记录可信用户确认"}` : approvalCurrent ? `范围 ${approval.id}: ${approval.status}，等待按执行策略启动` : approval ? `范围 ${approval.id} 已因方案修订失效` : "尚无覆盖缺失镜头的调用范围", ["capability"]),
    statusNode("videos", "视频镜头", !missingVideos.length ? "completed" : job && ["queued", "running", "waiting"].includes(job.status) ? "waiting" : "blocked", `${missingVideos.length} 个镜头缺少视频`, ["images", "approval"]),
    statusNode("audio", "声音素材", !missingAudio.length ? "completed" : "blocked", missingAudio.length ? `${missingAudio.length} 个镜头只有声音意图，没有可验证音源` : "声音要求已有来源或生成模式证据", ["videos"]),
    statusNode("edit", "确定性剪辑", outputIsLocalMp4 ? "completed" : localRenderJob ? "waiting" : "blocked", output?.localPath ? `当前输出不是可交付的本地 MP4：${output.localPath}` : localRenderJob ? `本地剪辑任务 ${localRenderJob.id} 正在 ${localRenderJob.stage}` : "尚无本地成片", ["videos", "audio"]),
    statusNode("review", "质量复核", reviewComplete ? "completed" : review?.decision === "changes-required" ? "blocked" : "waiting", reviewComplete ? "复核通过且绑定当前文件及全部抽帧证据" : review ? `最近复核: ${review.decision}，证据尚未闭合` : reviewEvidenceReady ? `${reviewEvidence.frames.length} 帧证据已准备，等待实际查看` : "尚未准备首尾帧与镜头边界证据", ["edit"]),
    statusNode("delivery", "交付", deliveryComplete ? "completed" : "blocked", deliveryComplete ? `已交付 ${delivery.deliveredAt}` : delivery?.status === "delivered" ? "交付记录存在，但文件清单证据不完整或与复核不一致" : "尚未完成交付门禁", ["review"])
  ];

  const nextActions = [];
  const action = (tool, reason, authority = "agent", input = {}) => nextActions.push({ tool, reason, authority, input });
  const scopeInput = extra => ({ projectId, creationId: scopeCreationId, ...extra });
  const now = Number.isFinite(Date.parse(options.now || "")) ? Date.parse(options.now) : Date.now();
  const leaseExpiresAt = Date.parse(job?.leaseExpiresAt || "");
  const leaseActive = job?.status === "running" && Number.isFinite(leaseExpiresAt) && leaseExpiresAt > now;
  const unresolvedProviderCalls = currentProviderCalls.filter(call => ["submitting", "uncertain", "submitted", "running", "processing", "download-pending"].includes(call.status));
  const unresolvedJobProviderCalls = unresolvedProviderCalls.filter(call => call.jobId === job?.id);
  const providerCallHasTaskId = unresolvedJobProviderCalls.length > 0 && unresolvedJobProviderCalls.every(call => call.providerTaskId);
  if (!briefComplete) action("drama_update_plan", "补齐制作简报必填项，并修复不存在或已失效的来源素材引用", "agent", scopeInput());
  else if (deliveryBoundaryExceeded) action("drama_update_plan", `当前创作页只支持 1 个经复核的本地 MP4；将 brief.deliverables 收敛为 1 项，并为其余交付物分别新建创作页：${excessDeliverables.join("、")}`, "user-choice", scopeInput({ brief: { deliverables: brief.deliverables.slice(0, 1) } }));
  else if (!selectedSkills.length) action("drama_route_skills", "根据制作简报选择专业 Skill，并把结果写回计划", "agent", scopeInput({ request: brief.objective }));
  else if (!shots.length || missingPrompts.length || invalidShots.length || durationMismatch) action("drama_update_plan", invalidShotIds.length ? "为每个镜头补齐唯一稳定 ID" : duplicateShotIds.length ? `修正重复镜头 ID：${duplicateShotIds.join("、")}` : invalidGenerationModes.length ? `修正非法生成模式：${invalidGenerationModes.join("、")}` : invalidShotDurations.length ? `修正无效镜头时长：${invalidShotDurations.join("、")}` : invalidPromptContracts.length ? `补齐结构化镜头合同：${invalidPromptContracts.map(item => `${item.shotId}(${item.errors.map(error => error.field).join("、")})`).join("；")}` : durationMismatch ? `调整镜头时长：当前合计 ${plannedDurationSeconds}s，简报要求 ${brief.durationSeconds}s` : "补齐有序镜头合同，并分别编译静帧 Prompt 与运动 Prompt", "agent", scopeInput());
  else if (!referencesValid) action("drama_update_plan", `修复当前镜头、角色或创作页的显式素材引用：${referenceIssues.map(issue => `${issue.assetId}(${issue.code})`).join("、")}`, "agent", scopeInput());
  else if (missingUploadedVideos.length) action("drama_update_plan", `为 uploaded-video 镜头绑定真实视频素材：${missingUploadedVideos.join("、")}`, "agent", scopeInput());
  else if (missingAudio.length) action("drama_update_plan", `为镜头绑定 sourceAudioAssetId、提供已证实带音频的视频，或选择真实可用的音频生成模式：${missingAudio.join("、")}。${options.credentialStatus?.speechConfigured ? "如需独立旁白/补录，可先用 drama_request_speech_job 准备 TTS，按执行模式调用并试听后显式绑定返回资产。" : "未配置豆包语音时，优先将有声音意图的待生成镜头明确设为 provider-native；无声镜头保持 none。不能把无声的既有视频标成有声。"}`, "agent", scopeInput());
  else if (!seedance.compatible) action("drama_update_plan", seedance.errors.map(item => item.message).join("；"), "agent", scopeInput());
  else if (queuedTasks.length) action("drama_claim_image_task", `领取 ${queuedTasks.length} 个排队中的 Codex Image Gen 任务`, "agent", { taskId: queuedTasks[0].id });
  else if (claimedTasks.length) action("drama_complete_image_task", `生成、目检并回填已领取任务 ${claimedTasks[0].id}`, "agent-after-visual-inspection", { taskId: claimedTasks[0].id });
  else if (credentialsMissing) action("wait", "真实模型仍需火山方舟凭据；请由用户在本机 API Key 页面配置后重新读取状态", "user", scopeInput());
  else if (failedTasks.length && job?.status === "waiting" && job.stage === "codex-images") action("drama_resume_paid_batch", "图片任务已记录失败；续跑原审批任务以在剩余调用上限内重建任务", "agent", { jobId: job.id });
  else if (job?.status === "waiting" && ["codex-images", "asset-bridge"].includes(job.stage)) action("drama_resume_paid_batch", "续跑原审批任务且保留原调用上限与已完成证据", "agent", { jobId: job.id });
  else if (job?.status === "waiting" && job.stage === "provider-status-check") {
    if (providerCallHasTaskId) action("drama_resume_paid_batch", "供应商任务 ID 已持久化；续跑时只查询原任务，不重复提交", "agent", { jobId: job.id });
    else action("wait", "供应商提交结果不确定且没有可查询任务 ID；必须先由用户或供应商侧核对，禁止自动重提", "user-provider-reconciliation", { jobId: job.id });
  }
  else if (!job && currentProviderCalls.some(call => ["submitting", "uncertain", "submitted", "running", "processing", "download-pending"].includes(call.status))) action("wait", "存在未绑定到可恢复任务的供应商调用；必须先人工核对供应商状态，禁止自动重提", "user-provider-reconciliation", scopeInput());
  else if (job?.status === "waiting" && job.stage === "approval-cap") action("wait", "本次调用上限已用尽；需要用户追加额度，不能用新批次绕过上限", "user-budget-change", scopeInput());
  else if (paidWorkMissing) {
    if (!approvalCurrent || !["pending", "approved"].includes(approval?.status)) action("drama_request_paid_batch", "为当前缺失的真实图片和视频创建费用上限明确的审批", "agent", scopeInput());
    else if (!approvalScopeRecorded) action("drama_request_paid_batch", "现有审批缺少完整范围摘要，不能执行；请为当前修订创建新审批", "agent", scopeInput());
    else if (approval.status === "pending") action("drama_authorize_and_start_paid_batch", automaticScope ? "自动启动已冻结范围，保留调用上限和版本追踪" : "由 MCP 直接向用户展示冻结范围与调用上限，并在确认后原子启动", automaticScope ? "agent" : "user-explicit-approval", { approvalId: approval.id });
    else if (!approvalTrusted && approval.jobId) action("drama_request_paid_batch", "现有任务没有可信用户授权证据，不能续跑；请创建新的明确范围审批", "agent", scopeInput());
    else if (!approvalTrusted) action("drama_authorize_and_start_paid_batch", "按冻结的执行模式验证授权并启动", automaticScope ? "agent" : "user-explicit-approval", { approvalId: approval.id });
    else if (approval.status === "approved" && !approval.jobId) action("drama_authorize_and_start_paid_batch", "范围记录尚未绑定任务，按执行模式验证后启动", automaticScope ? "agent" : "user-explicit-approval", { approvalId: approval.id });
    else if (job?.status === "queued") action("drama_resume_paid_batch", "任务仍在排队态；安全启动或接管同一个已审批任务", "agent", { jobId: job.id });
    else if (leaseActive) action("wait", `任务 ${job.id} 正在 ${job.stage}`, "system", { jobId: job.id });
    else if (job?.status === "running") action("drama_resume_paid_batch", "任务租约已过期或缺失；安全接管并续跑原任务", "agent", { jobId: job.id });
    else if (job && ["failed", "succeeded", "superseded"].includes(job.status)) action("drama_request_paid_batch", `任务 ${job.id} 已为 ${job.status}，但当前修订仍缺少真实素材；需要新的范围审批`, "agent", scopeInput());
    else if (job?.status === "waiting") action("drama_resume_paid_batch", "任务仍在可恢复等待态；续跑原任务并保留调用上限", "agent", { jobId: job.id });
    else if (job) action("drama_request_paid_batch", `任务 ${job.id} 处于不可恢复状态 ${job.status || "unknown"}；当前修订仍缺素材，需要新的范围审批`, "agent", scopeInput());
  } else if (!output && localRenderJob) action("wait", `本地剪辑任务 ${localRenderJob.id} 正在 ${localRenderJob.stage}`, "system", { jobId: localRenderJob.id });
  else if (!output || !outputIsLocalMp4) action("drama_render_project", output?.localPath ? "当前输出不是本地 MP4；按创作页交付边界重新执行确定性剪辑" : "所有镜头已就绪，执行确定性剪辑", "agent", scopeInput());
  else if (review?.decision === "changes-required") action("drama_update_plan", `按质量复核意见修改当前修订后重新渲染：${text(review.notes, 500) || "存在未通过项"}`, "agent", scopeInput());
  else if (!reviewEvidenceReady) action("drama_prepare_quality_evidence", "为当前成片抽取首帧、中间帧、末帧及镜头边界前后帧；此步骤只准备证据，不自动判定通过", "agent", scopeInput({ outputId: output.id }));
  else if (!reviewComplete) action("drama_record_quality_review", "打开并实际查看全部抽帧证据及可播放成片，再记录字幕、声音、连续性和验收结论", "agent-after-visual-inspection", scopeInput({ outputId: output.id, inspectedFrameSha256s: reviewEvidence.frames.map(frame => frame.sha256) }));
  else if (!deliveryComplete) action("drama_finalize_delivery", "复核已通过；重新验证当前文件并生成完整 SHA-256 交付清单", "agent", scopeInput({ outputId: output.id }));

  const activeJobs = currentJobs.filter(item => ["queued", "running", "waiting"].includes(item.status));
  const graphComplete = nodes.every(node => ["completed", "skipped"].includes(node.status))
    && !activeImageTasks.length
    && !activeJobs.length
    && !unresolvedProviderCalls.length;
  if (!graphComplete && !nextActions.length) action("drama_get_state", "当前证据状态不一致；重新读取持久化状态后再决定，不能跳过门禁", "agent", scopeInput());

  return {
    projectId,
    creationId,
    brief,
    selectedSkills,
    planRevision,
    summary: { shots: shots.length, plannedDurationSeconds, durationMismatch, invalidShots, invalidShotIds, duplicateShotIds, invalidGenerationModes, invalidShotDurations, invalidPromptContracts, promptContractWarnings, legacyPromptShots, missingBriefFields, missingSourceAssetIds, staleSourceAssetIds, missingReferenceAssetIds, staleReferenceAssetIds, invalidReferenceKinds, mismatchedReferenceVersions, referenceIssues, missingPrompts, missingImages, missingVideos, missingUploadedVideos, missingGeneratedVideos, missingAudio, staticShotsWithoutImages, queuedImageTasks: queuedTasks.length, claimedImageTasks: claimedTasks.length, activeImageTasks: activeImageTasks.length, failedImageTasks: failedTasks.length },
    harnessProfile,
    deliveryBoundary: { exceeded: deliveryBoundaryExceeded, requestedFiles: brief.deliverables.length, maximumFiles: harnessProfile.delivery.maximumFilesPerCreation, excessDeliverables },
    capabilityCheck: seedance,
    activeApproval: approval,
    activeJob: job,
    latestOutput: output,
    graph: { nodes, complete: graphComplete },
    nextActions,
    credentialStatus: options.credentialStatus || null
  };
}
