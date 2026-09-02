import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { dataRoot, safeId } from "./config.mjs";
import { appendEvent, mutateState, readState } from "./store.mjs";
import { readArkKey } from "./secrets.mjs";
import { createShotVideo, normalizeVideoClip, probeDuration, probeMedia, renderFinal, srtTimestamp } from "./ffmpeg.mjs";
import { createSeedanceTask, downloadSeedanceVideo, generateSeedreamImage, waitForSeedanceTask } from "./ark.mjs";
import { ensureAssetRemoteUrl } from "./asset-bridge.mjs";
import { buildProductionStatus, dimensionsForAspectRatio, normalizeProductionBrief, validateSeedanceShots } from "./production-harness.mjs";
import { approvedMemoryDigest, buildContextPack as buildProjectContextPack, normalizeMemoryEntry } from "./project-memory.mjs";
import { compileShotRequests } from "./prompt-compiler.mjs";
import { createReviewEvidencePack } from "./review-evidence.mjs";

const workflowInstanceId = safeId("runtime");
const realJobLeaseMs = 60_000;

function projectDir(projectId) {
  return path.join(dataRoot, "projects", projectId);
}

const retryableMoveCodes = new Set(["EACCES", "EBUSY", "ENOTEMPTY", "EPERM"]);

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export async function moveDirectoryToTrash(source, destination, operations = {}) {
  const rename = operations.rename || fs.rename;
  const copy = operations.copy || fs.cp;
  const remove = operations.remove || fs.rm;
  let renameError = null;

  await fs.mkdir(path.dirname(destination), { recursive: true });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await rename(source, destination);
      return { moved: true, method: "rename", sourceRetained: false };
    } catch (error) {
      if (error?.code === "ENOENT") return { moved: false, method: "missing", sourceRetained: false };
      if (!retryableMoveCodes.has(error?.code)) throw error;
      renameError = error;
      if (attempt < 3) await wait(75 * (attempt + 1));
    }
  }

  try {
    await copy(source, destination, { recursive: true, errorOnExist: true, force: false });
  } catch (error) {
    try { await remove(destination, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch {}
    if (error?.code === "ENOENT") return { moved: false, method: "missing", sourceRetained: false };
    throw renameError || error;
  }

  let sourceRetained = false;
  try {
    await remove(source, { recursive: true, force: true, maxRetries: 6, retryDelay: 150 });
  } catch {
    sourceRetained = true;
  }
  return { moved: true, method: "copy", sourceRetained };
}

function canvasDefaults() {
  return { viewport: { x: 120, y: 90, zoom: 0.78 }, positions: {} };
}

function baseProjectFolders(now) {
  return [
    { id: safeId("folder"), name: "00_原作与改编依据", parentId: null, scope: "project", worldId: null, creationId: null, createdAt: now, updatedAt: now },
    { id: safeId("folder"), name: "01_系列公共资产", parentId: null, scope: "series", worldId: null, creationId: null, createdAt: now, updatedAt: now },
    { id: safeId("folder"), name: "90_候选与废案", parentId: null, scope: "candidate", worldId: null, creationId: null, createdAt: now, updatedAt: now }
  ];
}

function requireWorld(project, worldId) {
  if (!worldId) return null;
  const world = project.worlds?.find(item => item.id === worldId);
  if (!world) throw new Error("WORLD_NOT_FOUND");
  return world;
}

function productionUnit(project, creationId = null) {
  if (!creationId) return project;
  const creation = project.creations?.find(item => item.id === creationId);
  if (!creation) throw new Error("CREATION_NOT_FOUND");
  if (creation.planSource === "project-legacy") return project;
  return creation.plan || { logline: "", brief: {}, selectedSkills: [], planRevision: 0, revisionHistory: [], script: { premise: "", scenes: [] }, characters: [], shots: [] };
}

function assetBelongsToCreation(asset, creationId, referencedIds = new Set()) {
  return !asset.stale && (!creationId || asset.creationId === creationId || referencedIds.has(asset.id));
}

function explicitCreationReferenceIds(creation, production) {
  return new Set([
    ...(creation?.assetRefs || []).map(ref => ref.assetId),
    ...(production?.brief?.sourceAssetIds || []),
    ...(production?.characters || []).flatMap(character => character.referenceAssetIds || []),
    ...(production?.shots || []).flatMap(shot => [
      ...(shot.referenceAssetIds || []),
      shot.sourceVideoAssetId,
      shot.sourceAudioAssetId
    ])
  ].map(value => String(value || "").trim()).filter(Boolean));
}

function requireReferencedAsset(project, assetId, expectedKind = null) {
  const asset = (project.assets || []).find(item => item.id === assetId);
  if (!asset) throw new Error(`ASSET_REFERENCE_NOT_FOUND:${assetId}`);
  if (asset.stale) throw new Error(`ASSET_REFERENCE_STALE:${assetId}`);
  if (expectedKind && asset.kind !== expectedKind) throw new Error(`ASSET_REFERENCE_KIND_INVALID:${assetId}:${expectedKind}`);
  return asset;
}

function creationReferenceIds(project, creation, production) {
  const explicitIds = explicitCreationReferenceIds(creation, production);
  for (const assetId of explicitIds) requireReferencedAsset(project, assetId);
  for (const reference of creation?.assetRefs || []) {
    const asset = requireReferencedAsset(project, reference.assetId);
    if (Number(reference.version || 1) !== Number(asset.version || 1)) throw new Error(`ASSET_REFERENCE_STALE:${asset.id}`);
  }
  const inheritedIds = (project.assets || [])
    .filter(asset => !asset.stale && (asset.scope === "series" || (creation?.worldId && asset.scope === "world" && asset.worldId === creation.worldId)))
    .map(asset => asset.id);
  return new Set([...explicitIds, ...inheritedIds]);
}

function selectShotImageAsset(project, shot, creationId, referencedIds = new Set()) {
  for (const assetId of shot.referenceAssetIds || []) {
    const explicit = (project.assets || []).find(asset => asset.id === assetId && asset.kind === "image" && assetBelongsToCreation(asset, creationId, referencedIds));
    if (explicit) return explicit;
  }
  const candidates = (project.assets || []).filter(asset => asset.kind === "image" && asset.shotId === shot.id && assetBelongsToCreation(asset, creationId, referencedIds));
  return candidates.sort((a, b) => Number(b.version || 1) - Number(a.version || 1) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0] || null;
}

function assetVersionEvidence(asset) {
  if (!asset?.sha256) throw new Error(`ASSET_HASH_REQUIRED:${asset?.id || "unknown"}`);
  return {
    assetId: asset.id,
    familyId: asset.familyId || asset.id,
    version: Number(asset.version || 1),
    kind: asset.kind,
    sha256: asset.sha256
  };
}

function resolveShotSourceAsset(project, shot, field, expectedKind, required = false) {
  const assetId = String(shot?.[field] || "").trim();
  if (!assetId) {
    if (required) throw new Error(field === "sourceVideoAssetId" ? "SHOT_SOURCE_VIDEO_ASSET_REQUIRED" : "SHOT_SOURCE_AUDIO_ASSET_REQUIRED");
    return null;
  }
  return requireReferencedAsset(project, assetId, expectedKind);
}

function validateProductionAssetReferences(project, creation, production) {
  const referenceIds = creationReferenceIds(project, creation, production);
  for (const shot of production.shots || []) {
    resolveShotSourceAsset(project, shot, "sourceVideoAssetId", "video");
    resolveShotSourceAsset(project, shot, "sourceAudioAssetId", "audio");
  }
  return referenceIds;
}

function nextAssetIdentity(project, shotId, kind, creationId) {
  const previous = (project.assets || [])
    .filter(asset => asset.shotId === shotId && asset.kind === kind && (asset.creationId || null) === (creationId || null))
    .sort((a, b) => Number(b.version || 1) - Number(a.version || 1))[0] || null;
  const id = safeId("asset");
  return {
    id,
    familyId: previous?.familyId || previous?.id || id,
    version: previous ? Number(previous.version || 1) + 1 : 1,
    previousAssetId: previous?.id || null
  };
}

function safeJobFailure(error) {
  const raw = String(error?.message || error || "UNKNOWN_ERROR");
  const code = raw.match(/^[A-Z0-9_]+/)?.[0] || "JOB_FAILED";
  if (code.startsWith("ASSET_BRIDGE")) return { code, message: "参考图 HTTPS 桥暂时不可用。素材与原审批均已保留，恢复桥接后可继续，不会重复提交已创建的视频任务。" };
  if (code === "SEEDANCE_REQUIRES_REMOTE_IMAGE_URL") return { code, message: "Codex 图片目前只有本地副本。请为对应图片任务补充可访问的 HTTPS 地址后续跑；不会重复已成功步骤或产生额外调用。" };
  if (code.startsWith("FFMPEG")) return { code, message: "本地 FFmpeg 渲染失败。请检查素材格式和 FFmpeg 后重试。" };
  if (code === "SHOT_VIDEO_CLIP_REQUIRED") return { code, message: "至少一个非静态镜头还没有真实视频片段。本地渲染不会用静态图片冒充 Seedance 或已上传视频。" };
  if (code.startsWith("SHOT_SOURCE_VIDEO")) return { code, message: "uploaded-video 镜头必须绑定可校验的视频素材 assetId，不能使用任意文件路径。" };
  if (code.startsWith("SHOT_SOURCE_AUDIO") || code === "SHOT_AUDIO_SOURCE_REQUIRED") return { code, message: "镜头声明了声音，但尚未绑定可校验的音频素材 assetId。系统不会用静音轨伪装完成。" };
  if (code === "SHOT_VIDEO_VERSION_STALE") return { code, message: "镜头视频文件与当前修订记录的哈希或供应商结果不一致。系统已停止合成，请恢复原版本或重新生成。" };
  if (code.startsWith("SEEDREAM")) return { code, message: "Seedream 图片步骤未完成。已成功产物会保留，请检查模型 ID、权限或提示词后新建审批重试。" };
  if (code.startsWith("SEEDANCE")) return { code, message: "Seedance 视频步骤未完成。请先查询已有任务状态，避免重复付费提交。" };
  if (code.startsWith("ARK_KEY")) return { code, message: "尚未配置可用的火山方舟 API Key。请在“API Key”中保存后重试。" };
  if (code === "APPROVAL_SCOPE_STALE") return { code, message: "制作方案或已锁定素材在审批后发生了变化。旧审批已失效，系统没有继续调用模型；请按当前方案重新创建审批。" };
  if (code === "ASSET_VERSION_CONTENT_CHANGED") return { code, message: "已锁定素材文件的内容与该版本记录不一致。系统已停止生成；请将改动保存为新素材版本并重新审批。" };
  if (code === "PROVIDER_SUBMISSION_UNCERTAIN") return { code, message: "供应商提交结果不确定。系统已停止自动重试以避免重复付费，请先核对供应商任务记录再决定是否新建审批。" };
  if (code === "PLAN_CHANGED_DURING_RENDER") return { code, message: "本地渲染期间制作方案发生变化，旧版本结果未登记为成片；请按最新方案重新渲染。" };
  return { code, message: "任务未完成。已成功产物已保留，请根据失败阶段重试。" };
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function fileDigest(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", chunk => hash.update(chunk));
    stream.once("error", reject);
    stream.once("end", resolve);
  });
  return hash.digest("hex");
}

async function captureFileEvidence(filePath) {
  const before = await fs.stat(filePath);
  if (!before.isFile() || before.size <= 0) throw new Error("OUTPUT_FILE_INVALID");
  const media = await probeMedia(filePath);
  const sha256 = await fileDigest(filePath);
  const after = await fs.stat(filePath);
  if (!after.isFile() || before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error("OUTPUT_CHANGED_DURING_INSPECTION");
  return { sha256, bytes: after.size, mtimeMs: after.mtimeMs, media };
}

function hasAudioStream(media) {
  return Boolean(media?.audio && (media.audio.codec || media.audio.channels || media.audio.sampleRate));
}

async function assertAssetContentCurrent(asset) {
  if (!asset?.localPath || !asset.sha256) return;
  const actual = await fileDigest(asset.localPath);
  if (actual !== asset.sha256) throw new Error("ASSET_VERSION_CONTENT_CHANGED");
}

function requiredQualityCriteria(production) {
  const brief = normalizeProductionBrief(production.brief, production.brief, { objective: production.logline || production.script?.premise || "" });
  const criteria = [...brief.acceptanceCriteria];
  const briefCriteria = new Set(brief.acceptanceCriteria);
  for (const shot of production.shots || []) {
    for (const criterion of shot.acceptanceCriteria || []) {
      if (!briefCriteria.has(criterion)) criteria.push(`镜头 ${shot.id}: ${criterion}`);
    }
  }
  return [...new Set(criteria.map(item => String(item || "").trim()).filter(Boolean))];
}

function assertApprovalBriefComplete(production, brief) {
  const missing = [
    ["objective", brief.objective],
    ["contentType", brief.contentType],
    ["audience", brief.audience],
    ["platform", brief.platform],
    ["durationSeconds", Number(brief.durationSeconds) > 0],
    ["aspectRatio", brief.aspectRatio],
    ["deliverables", brief.deliverables?.length],
    ["acceptanceCriteria", brief.acceptanceCriteria?.length]
  ].filter(([, present]) => !present).map(([field]) => field);
  if (missing.length) throw new Error(`PRODUCTION_BRIEF_INCOMPLETE:${missing.join(",")}`);
  if (brief.deliverables.length !== 1) throw new Error("DELIVERY_SCOPE_REQUIRES_ONE_VIDEO_PER_CREATION");
  const plannedDuration = (production.shots || []).reduce((sum, shot) => sum + Number(shot.duration || 0), 0);
  if (Math.abs(plannedDuration - Number(brief.durationSeconds)) > 0.01) throw new Error(`PRODUCTION_DURATION_MISMATCH:${plannedDuration}:${brief.durationSeconds}`);
}

function archiveShotVisualEvidence(shot, now) {
  shot.revisions = [...(shot.revisions || []), {
    promptVersion: Number(shot.promptVersion || 1), prompt: shot.prompt || "", clipPath: shot.clipPath || null,
    promptContract: {
      promptContractVersion: shot.promptContractVersion || 1,
      sceneId: shot.sceneId || "",
      purpose: shot.purpose || "",
      subjectIds: [...(shot.subjectIds || [])],
      startState: shot.startState || "",
      endState: shot.endState || "",
      camera: shot.camera || {},
      motion: shot.motion || {},
      style: shot.style || "",
      transition: shot.transition || "",
      soundPlan: shot.soundPlan || {},
      audioMode: shot.audioMode || "none",
      continuityFromShotId: shot.continuityFromShotId || null,
      continuityConstraints: [...(shot.continuityConstraints || [])],
      negativeConstraints: [...(shot.negativeConstraints || [])],
      qualityRisks: [...(shot.qualityRisks || [])],
      imagePrompt: shot.imagePrompt || "",
      videoPrompt: shot.videoPrompt || "",
      videoInputMode: shot.videoInputMode || "image-to-video"
    },
    providerTaskId: shot.providerTaskId || null, imageSubmission: shot.imageSubmission || null,
    providerSubmission: shot.providerSubmission || null, archivedAt: now
  }].slice(-20);
  shot.promptVersion = Number(shot.promptVersion || 1) + 1;
  delete shot.clipPath;
  delete shot.clipMedia;
  delete shot.providerTaskId;
  delete shot.imageSubmission;
  delete shot.providerSubmission;
  shot.status = "planned";
}

function staleGeneratedShotAssets(project, shotIds, creationId, now, reason) {
  for (const asset of project.assets || []) {
    if (!shotIds.has(asset.shotId) || (creationId && asset.creationId !== creationId)) continue;
    if (!asset.provider && !asset.approvalId && asset.planRevision === undefined && asset.promptVersion === undefined) continue;
    asset.stale = true;
    asset.staleAt = now;
    asset.staleReason = reason;
  }
}

function updateProjectAggregateStatus(project, stage = "production") {
  const creations = (project.creations || []).filter(creation => !creation.type || creation.type === "episode");
  if (!creations.length) {
    project.status = "draft";
    project.currentStage = "story";
  } else if (creations.every(creation => creation.status === "completed")) {
    project.status = "completed";
    project.currentStage = "final";
  } else if (creations.some(creation => creation.status === "changes-required")) {
    project.status = "changes-required";
    project.currentStage = "revision";
  } else {
    project.status = "in-progress";
    project.currentStage = stage;
  }
}

function approvalScopeSnapshot(project, creationId, settings, limits, lockedInputBindings = null) {
  const production = productionUnit(project, creationId);
  const brief = normalizeProductionBrief(production.brief, production.brief, { objective: production.logline || production.script?.premise || "", aspectRatio: settings.ratio });
  const creation = creationId ? project.creations?.find(item => item.id === creationId) : null;
  const referenceIds = creationReferenceIds(project, creation, production);
  const inputAssetBindings = lockedInputBindings || (production.shots || []).map(shot => {
    const asset = selectShotImageAsset(project, shot, creationId, referenceIds);
    return asset ? { shotId: shot.id, referenceRole: "first-frame", ...assetVersionEvidence(asset) } : { shotId: shot.id, assetId: null, familyId: null, version: null, kind: null, sha256: null, referenceRole: "first-frame" };
  });
  for (const binding of inputAssetBindings) {
    if (!binding.assetId) continue;
    const asset = project.assets?.find(item => item.id === binding.assetId);
    if (!asset || asset.stale || (asset.familyId || asset.id) !== binding.familyId || Number(asset.version || 1) !== Number(binding.version || 1) || asset.kind !== binding.kind || !binding.sha256 || asset.sha256 !== binding.sha256) throw new Error("APPROVAL_SCOPE_STALE");
  }
  const referenceAssets = (project.assets || [])
    .filter(asset => referenceIds.has(asset.id))
    .map(assetVersionEvidence)
    .sort((a, b) => a.assetId.localeCompare(b.assetId));
  return {
    projectId: project.id,
    creationId: creationId || null,
    approvedMemoryDigest: approvedMemoryDigest(project.memories || [], { projectId: project.id, creationId: creationId || null, volumeId: creation?.worldId || null }),
    planRevision: Number(production.planRevision || 0),
    briefDigest: digest(production.brief || {}),
    briefSummary: {
      objective: brief.objective,
      contentType: brief.contentType,
      audience: brief.audience,
      platform: brief.platform,
      durationSeconds: brief.durationSeconds,
      aspectRatio: brief.aspectRatio,
      deliverables: brief.deliverables
    },
    selectedSkills: [...(production.selectedSkills || [])],
    shots: (production.shots || []).map(shot => {
      const lockedBinding = inputAssetBindings.find(item => item.shotId === shot.id) || null;
      const initial = compileShotRequests({ shot, settings, inputAssetBinding: lockedBinding?.assetId ? lockedBinding : null, videoInputMode: "image-to-video" });
      const needsVideo = ["auto", "seedance"].includes(shot.generationMode || "auto");
      const inputAssetBinding = needsVideo ? (lockedBinding?.assetId ? lockedBinding : { referenceRole: "first-frame", upstreamRequestDigest: initial.requestDigests.image }) : null;
      const compiled = compileShotRequests({ shot, settings, inputAssetBinding, videoInputMode: "image-to-video" });
      if (!compiled.validation.valid || compiled.executable === false) {
        const errors = compiled.validation.errors?.map(item => item.code).filter(Boolean).join(",") || "PROMPT_REQUEST_NOT_EXECUTABLE";
        throw new Error(`SHOT_PROMPT_CONTRACT_INVALID:${shot.id}:${errors}`);
      }
      return {
        id: shot.id,
        promptVersion: Number(shot.promptVersion || 1),
        promptDigest: digest(shot.prompt || ""),
        duration: Number(shot.duration || 0),
        generationMode: shot.generationMode || "auto",
        referenceAssetIds: [...(shot.referenceAssetIds || [])].sort(),
        sourceVideoAssetId: shot.sourceVideoAssetId || null,
        sourceAudioAssetId: shot.sourceAudioAssetId || null,
        promptCompilation: {
          compilerVersion: compiled.compilerVersion,
          contractVersion: compiled.contractVersion,
          contract: compiled.contract,
          requests: compiled.requests,
          requestDigests: compiled.requestDigests,
          digest: compiled.digest,
          inputAssetBinding
        }
      };
    }),
    inputAssetBindings,
    referenceAssets,
    generation: {
      imageProvider: settings.imageProvider,
      seedreamModel: settings.seedreamModel,
      seedanceModel: settings.seedanceModel,
      ratio: settings.ratio,
      resolution: settings.resolution,
      generateAudio: Boolean(settings.generateAudio),
      watermark: Boolean(settings.watermark)
    },
    limits
  };
}

function assertApprovalScopeCurrent(state, approval) {
  const project = state.projects.find(item => item.id === approval.projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  let currentScope;
  try {
    currentScope = approvalScopeSnapshot(
      project,
      approval.creationId || null,
      state.settings,
      { maxImageCalls: approval.maxImageCalls, maxVideoCalls: approval.maxVideoCalls },
      approval.scopeSnapshot?.inputAssetBindings || null
    );
  } catch (error) {
    if (/^(ASSET_REFERENCE_|ASSET_HASH_REQUIRED)/.test(String(error?.message || error))) throw new Error("APPROVAL_SCOPE_STALE");
    throw error;
  }
  if (digest(currentScope) !== approval.scopeDigest) throw new Error("APPROVAL_SCOPE_STALE");
  return { project, production: productionUnit(project, approval.creationId || null), currentScope };
}

async function assertApprovalAssetContentsCurrent(project, approval) {
  const locked = [
    ...(approval.scopeSnapshot?.referenceAssets || []),
    ...(approval.scopeSnapshot?.inputAssetBindings || []).filter(item => item.assetId)
  ];
  const checked = new Set();
  for (const evidence of locked) {
    if (checked.has(evidence.assetId)) continue;
    checked.add(evidence.assetId);
    const asset = project.assets?.find(item => item.id === evidence.assetId);
    if (!asset || asset.stale || (asset.familyId || asset.id) !== evidence.familyId || Number(asset.version || 1) !== Number(evidence.version || 1) || asset.kind !== evidence.kind || !evidence.sha256 || asset.sha256 !== evidence.sha256) throw new Error("APPROVAL_SCOPE_STALE");
    await assertAssetContentCurrent(asset);
  }
}

function selectApprovedShotImage(project, shot, approval, creationId) {
  const binding = approval.scopeSnapshot?.inputAssetBindings?.find(item => item.shotId === shot.id);
  if (binding?.assetId) {
    const asset = project.assets?.find(item => item.id === binding.assetId);
    if (asset && !asset.stale && asset.kind === "image" && binding.kind === "image" && (asset.familyId || asset.id) === binding.familyId && Number(asset.version || 1) === Number(binding.version || 1) && binding.sha256 && asset.sha256 === binding.sha256) return asset;
    throw new Error("APPROVAL_SCOPE_STALE");
  }
  return (project.assets || []).find(asset => !asset.stale && asset.approvalId === approval.id && asset.shotId === shot.id && asset.kind === "image" && (asset.creationId || null) === (creationId || null) && Number(asset.planRevision || 0) === Number(approval.scopeSnapshot?.planRevision || 0)) || null;
}

function currentProviderCall(state, approvalId, shotId, kind) {
  return (state.providerCalls || []).find(call => call.approvalId === approvalId && call.shotId === shotId && call.kind === kind && !["failed", "cancelled"].includes(call.status)) || null;
}

function approvedShotCompilation(approval, shotId) {
  const frozen = approval.scopeSnapshot?.shots?.find(item => item.id === shotId)?.promptCompilation;
  if (!frozen?.compilerVersion || !frozen?.requests || !frozen?.requestDigests) {
    throw new Error("APPROVAL_COMPILED_REQUEST_REQUIRED");
  }
  return frozen;
}

function providerFailureIsUncertain(error) {
  return error?.name === "AbortError" || !Number.isFinite(Number(error?.httpStatus));
}

function approvalSummary(approval, project) {
  const inputAssetBindings = approval.scopeSnapshot?.inputAssetBindings || [];
  return {
    id: approval.id,
    projectId: approval.projectId,
    projectTitle: project.title,
    creationId: approval.creationId || null,
    status: approval.status,
    purpose: approval.purpose,
    maxImageCalls: approval.maxImageCalls,
    maxVideoCalls: approval.maxVideoCalls,
    usedImageCalls: approval.usedImageCalls,
    usedVideoCalls: approval.usedVideoCalls,
    planRevision: Number(approval.scopeSnapshot?.planRevision || 0),
    objective: approval.scopeSnapshot?.briefSummary?.objective || "",
    contentType: approval.scopeSnapshot?.briefSummary?.contentType || "",
    imageProvider: approval.scopeSnapshot?.generation?.imageProvider || null,
    imageModel: approval.scopeSnapshot?.generation?.seedreamModel || null,
    model: approval.scopeSnapshot?.generation?.seedanceModel || null,
    ratio: approval.scopeSnapshot?.generation?.ratio || null,
    resolution: approval.scopeSnapshot?.generation?.resolution || null,
    generateAudio: Boolean(approval.scopeSnapshot?.generation?.generateAudio),
    watermark: Boolean(approval.scopeSnapshot?.generation?.watermark),
    shotCount: approval.scopeSnapshot?.shots?.length || 0,
    promptCompilerVersions: [...new Set((approval.scopeSnapshot?.shots || []).map(item => item.promptCompilation?.compilerVersion).filter(Boolean))],
    requestDigests: (approval.scopeSnapshot?.shots || []).map(item => ({ shotId: item.id, ...item.promptCompilation?.requestDigests })),
    inputAssets: inputAssetBindings.filter(item => item.assetId).map(item => ({ shotId: item.shotId, assetId: item.assetId, version: item.version })),
    warning: "失败或被供应商拒绝的调用仍可能计入费用；授权仅覆盖此处冻结的方案与调用上限。"
  };
}

export async function createProject({ title = "未命名漫剧", logline = "" } = {}) {
  const id = safeId("project");
  const now = new Date().toISOString();
  const project = {
    id, title: String(title).slice(0, 80), logline: String(logline).slice(0, 500),
    status: "draft", currentStage: "story", pinned: false, createdAt: now, updatedAt: now,
    brief: normalizeProductionBrief({}, {}, { objective: logline, aspectRatio: "9:16" }), selectedSkills: [], planRevision: 0, revisionHistory: [],
    script: { premise: "", scenes: [] }, characters: [], shots: [], assets: [], assetFolders: baseProjectFolders(now), worlds: [], outputs: [], creations: [], memories: []
  };
  await fs.mkdir(projectDir(id), { recursive: true });
  await mutateState(state => {
    state.projects.unshift(project);
    appendEvent(state, "project.created", `已创建项目《${project.title}》`, { projectId: id });
  });
  return project;
}

export async function renameProject(projectId, title) {
  const normalized = String(title || "").trim().slice(0, 80);
  if (!normalized) throw new Error("PROJECT_TITLE_REQUIRED");
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    project.title = normalized;
    project.updatedAt = new Date().toISOString();
    appendEvent(state, "project.renamed", `项目已重命名为《${normalized}》`, { projectId });
    return project;
  });
}

export async function setProjectPinned(projectId, pinned) {
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    project.pinned = Boolean(pinned);
    project.updatedAt = new Date().toISOString();
    appendEvent(state, "project.pinned", project.pinned ? `《${project.title}》已置顶` : `《${project.title}》已取消置顶`, { projectId });
    return project;
  });
}

export async function deleteProject(projectId) {
  const state = await readState();
  const project = state.projects.find(item => item.id === projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const source = projectDir(projectId);
  const trashRoot = path.join(dataRoot, ".trash");
  const trashedPath = path.join(trashRoot, `${projectId}-${Date.now()}`);
  const moveResult = await moveDirectoryToTrash(source, trashedPath);
  try {
    await mutateState(next => {
      next.projects = next.projects.filter(item => item.id !== projectId);
      next.jobs = next.jobs.filter(item => item.projectId !== projectId);
      next.approvals = next.approvals.filter(item => item.projectId !== projectId);
      next.tasks = next.tasks.filter(item => item.projectId !== projectId);
      next.providerCalls = (next.providerCalls || []).filter(item => item.projectId !== projectId);
      appendEvent(next, "project.deleted", `项目《${project.title}》已移入本机回收区`, { projectId, sourceCleanupPending: moveResult.sourceRetained });
    });
  } catch (error) {
    if (moveResult.moved && moveResult.sourceRetained) {
      try { await fs.rm(trashedPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch {}
    } else if (moveResult.moved) {
      try { await moveDirectoryToTrash(trashedPath, source); } catch {}
    }
    throw error;
  }
  return { id: projectId, title: project.title, recoverablePath: trashedPath, sourceCleanupPending: moveResult.sourceRetained };
}

export async function createWorld(projectId, input = {}) {
  const normalized = String(input.title || "").trim().slice(0, 80);
  if (!normalized) throw new Error("WORLD_TITLE_REQUIRED");
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    project.worlds ||= [];
    project.assetFolders ||= [];
    const now = new Date().toISOString();
    const world = { id: safeId("world"), title: normalized, description: String(input.description || "").trim().slice(0, 500), pinned: false, createdAt: now, updatedAt: now };
    const ordinal = String((project.worlds.length + 1) * 10).padStart(2, "0");
    const root = { id: safeId("folder"), name: `${ordinal}_${normalized}`, parentId: null, scope: "world", worldId: world.id, creationId: null, createdAt: now, updatedAt: now };
    const childNames = ["分卷与季度设定", "角色", "场景", "道具与传承", "分镜", "图片", "视频", "音频", "成片"];
    project.worlds.push(world);
    project.assetFolders.push(root, ...childNames.map(name => ({ id: safeId("folder"), name, parentId: root.id, scope: "world", worldId: world.id, creationId: null, createdAt: now, updatedAt: now })));
    project.updatedAt = now;
    appendEvent(state, "world.created", `《${project.title}》已新建分卷/季度“${normalized}”`, { projectId, worldId: world.id, folderId: root.id });
    return world;
  });
}

export async function updateWorld(projectId, worldId, patch = {}) {
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const world = requireWorld(project, worldId);
    if (patch.title !== undefined) {
      const title = String(patch.title || "").trim().slice(0, 80);
      if (!title) throw new Error("WORLD_TITLE_REQUIRED");
      world.title = title;
    }
    if (patch.description !== undefined) world.description = String(patch.description || "").trim().slice(0, 500);
    if (patch.pinned !== undefined) world.pinned = Boolean(patch.pinned);
    world.updatedAt = new Date().toISOString();
    project.updatedAt = world.updatedAt;
    appendEvent(state, "world.updated", `分卷/季度“${world.title}”已更新`, { projectId, worldId });
    return world;
  });
}

export async function deleteWorld(projectId, worldId) {
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const world = requireWorld(project, worldId);
    if (project.creations?.some(item => item.worldId === worldId)) throw new Error("WORLD_HAS_CREATIONS");
    if (project.assets?.some(item => item.worldId === worldId)) throw new Error("WORLD_HAS_ASSETS");
    const folderIds = new Set((project.assetFolders || []).filter(item => item.worldId === worldId).map(item => item.id));
    project.assetFolders = (project.assetFolders || []).filter(item => !folderIds.has(item.id));
    project.worlds = project.worlds.filter(item => item.id !== worldId);
    project.updatedAt = new Date().toISOString();
    appendEvent(state, "world.deleted", `分卷/季度“${world.title}”已删除`, { projectId, worldId });
    return world;
  });
}

export async function createCreation(projectId, input) {
  const values = typeof input === "string" ? { title: input } : (input || {});
  const normalized = String(values.title || "").trim().slice(0, 80);
  if (!normalized) throw new Error("CREATION_TITLE_REQUIRED");
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const world = requireWorld(project, values.worldId || null);
    project.creations ||= [];
    const now = new Date().toISOString();
    const allowedTypes = new Set(["episode", "world-control", "series-control", "asset-development"]);
    const type = allowedTypes.has(values.type) ? values.type : "episode";
    const creation = {
      id: safeId("creation"), title: normalized, status: "draft", pinned: false, worldId: world?.id || null, type,
      assetRefs: [], messages: [], canvas: canvasDefaults(),
      plan: { logline: "", brief: normalizeProductionBrief({}, {}, { aspectRatio: state.settings.ratio }), selectedSkills: [], planRevision: 0, revisionHistory: [], script: { premise: "", scenes: [] }, characters: [], shots: [] },
      createdAt: now, updatedAt: now
    };
    project.creations.unshift(creation);
    updateProjectAggregateStatus(project, "production");
    project.updatedAt = now;
    appendEvent(state, "creation.created", `《${project.title}》已新建创作页“${normalized}”`, { projectId, creationId: creation.id, worldId: creation.worldId, type });
    return creation;
  });
}

export async function updateCreation(projectId, creationId, patch = {}) {
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const creation = project.creations?.find(item => item.id === creationId);
    if (!creation) throw new Error("CREATION_NOT_FOUND");
    let referencesChanged = false;
    let productionContextChanged = false;
    if (patch.title !== undefined) {
      const title = String(patch.title || "").trim().slice(0, 80);
      if (!title) throw new Error("CREATION_TITLE_REQUIRED");
      creation.title = title;
    }
    if (patch.pinned !== undefined) creation.pinned = Boolean(patch.pinned);
    if (patch.worldId !== undefined) {
      const nextWorldId = requireWorld(project, patch.worldId || null)?.id || null;
      productionContextChanged = nextWorldId !== (creation.worldId || null);
      creation.worldId = nextWorldId;
      if (productionContextChanged) {
        for (const memory of project.memories || []) {
          if (memory.scope === "creation" && memory.creationId === creationId) memory.volumeId = nextWorldId;
        }
      }
    }
    if (patch.type !== undefined) {
      if (!["episode", "world-control", "series-control", "asset-development"].includes(patch.type)) throw new Error("CREATION_TYPE_INVALID");
      creation.type = patch.type;
    }
    if (patch.canvas !== undefined) {
      const viewport = patch.canvas?.viewport || creation.canvas?.viewport || canvasDefaults().viewport;
      const zoom = Math.min(2, Math.max(0.2, Number(viewport.zoom || 0.78)));
      const positions = {};
      for (const [nodeId, value] of Object.entries(patch.canvas?.positions || creation.canvas?.positions || {}).slice(0, 800)) {
        positions[String(nodeId).slice(0, 120)] = { x: Math.round(Number(value?.x || 0)), y: Math.round(Number(value?.y || 0)) };
      }
      creation.canvas = { viewport: { x: Math.round(Number(viewport.x || 0)), y: Math.round(Number(viewport.y || 0)), zoom }, positions };
    }
    if (Array.isArray(patch.assetRefs)) {
      const nextRefs = patch.assetRefs.slice(0, 1000).map(ref => {
        const asset = project.assets?.find(item => item.id === String(ref.assetId || ""));
        if (!asset) throw new Error("ASSET_NOT_FOUND");
        return { assetId: asset.id, version: asset.version || 1, locked: Boolean(ref.locked), addedAt: ref.addedAt || new Date().toISOString() };
      });
      for (const locked of creation.assetRefs?.filter(ref => ref.locked) || []) {
        if (!nextRefs.some(ref => ref.assetId === locked.assetId && Number(ref.version || 1) === Number(locked.version || 1) && ref.locked)) throw new Error("ASSET_REFERENCE_LOCKED");
      }
      const signature = refs => refs.map(ref => ({ assetId: ref.assetId, version: Number(ref.version || 1), locked: Boolean(ref.locked) }));
      referencesChanged = JSON.stringify(signature(nextRefs)) !== JSON.stringify(signature(creation.assetRefs || []));
      creation.assetRefs = nextRefs;
    }
    if (referencesChanged || productionContextChanged) {
      const now = new Date().toISOString();
      const production = productionUnit(project, creationId);
      validateProductionAssetReferences(project, creation, production);
      production.planRevision = Number(production.planRevision || 0) + 1;
      production.revisionHistory ||= [];
      const changedFields = [referencesChanged ? "assetRefs" : null, productionContextChanged ? "worldId" : null].filter(Boolean);
      const changedShotIds = new Set((production.shots || []).map(shot => shot.id));
      for (const shot of production.shots || []) archiveShotVisualEvidence(shot, now);
      staleGeneratedShotAssets(project, changedShotIds, creationId, now, "creation-context-revised");
      production.revisionHistory.push({ revision: production.planRevision, changedFields, changedShotIds: [...changedShotIds], at: now });
      production.revisionHistory = production.revisionHistory.slice(-100);
      for (const output of project.outputs || []) {
        if ((output.creationId || null) === creationId) Object.assign(output, { stale: true, staleAt: now, staleReason: `plan-revision-${production.planRevision}` });
      }
      for (const approval of state.approvals || []) {
        if (approval.projectId === projectId && (approval.creationId || null) === creationId && ["pending", "approved"].includes(approval.status)) Object.assign(approval, { status: "stale", staleAt: now, staleReason: `plan-revision-${production.planRevision}` });
      }
      for (const task of state.tasks || []) {
        if (task.projectId === projectId && (task.creationId || null) === creationId && ["queued", "claimed"].includes(task.status)) Object.assign(task, { status: "superseded", staleAt: now, staleReason: `plan-revision-${production.planRevision}` });
      }
      for (const job of state.jobs || []) {
        if (job.projectId === projectId && (job.creationId || null) === creationId && ["queued", "running", "waiting"].includes(job.status)) Object.assign(job, { status: "superseded", staleAt: now, staleReason: `plan-revision-${production.planRevision}` });
      }
      creation.status = production.shots?.length ? "ready" : "draft";
    }
    creation.updatedAt = new Date().toISOString();
    project.updatedAt = creation.updatedAt;
    updateProjectAggregateStatus(project, "production");
    appendEvent(state, "creation.updated", `创作页“${creation.title}”已更新`, { projectId, creationId });
    return creation;
  });
}

export async function deleteCreation(projectId, creationId) {
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const creation = project.creations?.find(item => item.id === creationId);
    if (!creation) throw new Error("CREATION_NOT_FOUND");
    project.creations = project.creations.filter(item => item.id !== creationId);
    updateProjectAggregateStatus(project, "production");
    project.updatedAt = new Date().toISOString();
    appendEvent(state, "creation.deleted", `创作页“${creation.title}”已删除`, { projectId, creationId });
    return creation;
  });
}

export async function createAssetFolder(projectId, name, parentId = null, options = {}) {
  const normalized = String(name || "").trim().slice(0, 80);
  if (!normalized) throw new Error("ASSET_FOLDER_NAME_REQUIRED");
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    project.assetFolders ||= [];
    const normalizedParentId = parentId ? String(parentId) : null;
    if (normalizedParentId && !project.assetFolders.some(folder => folder.id === normalizedParentId)) throw new Error("ASSET_FOLDER_PARENT_NOT_FOUND");
    const now = new Date().toISOString();
    const parent = normalizedParentId ? project.assetFolders.find(item => item.id === normalizedParentId) : null;
    const worldId = options.worldId || parent?.worldId || null;
    const creationId = options.creationId || parent?.creationId || null;
    if (worldId) requireWorld(project, worldId);
    if (creationId && !project.creations?.some(item => item.id === creationId)) throw new Error("CREATION_NOT_FOUND");
    const scope = options.scope || parent?.scope || (creationId ? "creation" : worldId ? "world" : "project");
    const folder = { id: safeId("folder"), name: normalized, parentId: normalizedParentId, scope, worldId, creationId, createdAt: now, updatedAt: now };
    project.assetFolders.push(folder);
    project.updatedAt = now;
    appendEvent(state, "asset.folder_created", `《${project.title}》已新建素材文件夹“${normalized}”`, { projectId, folderId: folder.id, parentId: normalizedParentId });
    return folder;
  });
}

export async function updateAssetFolder(projectId, folderId, patch = {}) {
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const folder = project.assetFolders?.find(item => item.id === folderId);
    if (!folder) throw new Error("ASSET_FOLDER_NOT_FOUND");
    if (patch.name !== undefined) {
      const name = String(patch.name || "").trim().slice(0, 80);
      if (!name) throw new Error("ASSET_FOLDER_NAME_REQUIRED");
      folder.name = name;
    }
    if (patch.parentId !== undefined) {
      const parentId = patch.parentId || null;
      if (parentId === folder.id) throw new Error("ASSET_FOLDER_CYCLE");
      let cursor = parentId ? project.assetFolders.find(item => item.id === parentId) : null;
      if (parentId && !cursor) throw new Error("ASSET_FOLDER_PARENT_NOT_FOUND");
      while (cursor) {
        if (cursor.id === folder.id) throw new Error("ASSET_FOLDER_CYCLE");
        cursor = project.assetFolders.find(item => item.id === cursor.parentId);
      }
      folder.parentId = parentId;
      if (parentId) {
        const parent = project.assetFolders.find(item => item.id === parentId);
        folder.scope = parent.scope;
        folder.worldId = parent.worldId || null;
        folder.creationId = parent.creationId || null;
      }
    }
    folder.updatedAt = new Date().toISOString();
    project.updatedAt = folder.updatedAt;
    appendEvent(state, "asset.folder_updated", `素材文件夹“${folder.name}”已更新`, { projectId, folderId });
    return folder;
  });
}

export async function updateAsset(projectId, assetId, patch = {}) {
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const asset = project.assets?.find(item => item.id === assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    if (patch.folderId !== undefined) {
      const folder = patch.folderId ? project.assetFolders?.find(item => item.id === patch.folderId) : null;
      if (patch.folderId && !folder) throw new Error("ASSET_FOLDER_NOT_FOUND");
      asset.folderId = folder?.id || null;
      asset.scope = folder?.scope || asset.scope || "project";
      asset.worldId = folder?.worldId || null;
      asset.creationId = folder?.creationId || null;
    }
    if (patch.originalName !== undefined) {
      const originalName = String(patch.originalName || "").trim().slice(0, 180);
      if (!originalName) throw new Error("ASSET_NAME_REQUIRED");
      const currentExtension = path.extname(asset.originalName || asset.localPath || "");
      const requestedExtension = path.extname(originalName);
      asset.originalName = requestedExtension || !currentExtension ? originalName : `${originalName}${currentExtension}`;
    }
    if (patch.tags !== undefined) asset.tags = [...new Set((Array.isArray(patch.tags) ? patch.tags : []).map(tag => String(tag).trim().slice(0, 40)).filter(Boolean))].slice(0, 30);
    asset.updatedAt = new Date().toISOString();
    project.updatedAt = asset.updatedAt;
    appendEvent(state, "asset.updated", `素材“${asset.originalName || asset.id}”已更新`, { projectId, assetId });
    return asset;
  });
}

export async function deleteAsset(projectId, assetId) {
  const state = await readState();
  const project = state.projects.find(item => item.id === projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const asset = project.assets?.find(item => item.id === assetId);
  if (!asset) throw new Error("ASSET_NOT_FOUND");
  const lockedReference = project.creations?.some(creation => creation.assetRefs?.some(ref => ref.assetId === assetId && ref.locked));
  if (lockedReference) throw new Error("ASSET_LOCKED_IN_CREATION");

  let recoverablePath = null;
  const source = asset.localPath ? path.resolve(asset.localPath) : null;
  const managedRoot = path.resolve(dataRoot);
  if (source && (source === managedRoot || source.startsWith(`${managedRoot}${path.sep}`))) {
    const trashRoot = path.join(dataRoot, ".trash", "assets", projectId);
    recoverablePath = path.join(trashRoot, `${assetId}-${Date.now()}${path.extname(source)}`);
    await fs.mkdir(trashRoot, { recursive: true });
    try { await fs.rename(source, recoverablePath); }
    catch (error) { if (error?.code !== "ENOENT") throw error; }
  }

  try {
    await mutateState(next => {
      const target = next.projects.find(item => item.id === projectId);
      if (!target) throw new Error("PROJECT_NOT_FOUND");
      target.assets = (target.assets || []).filter(item => item.id !== assetId);
      for (const creation of target.creations || []) creation.assetRefs = (creation.assetRefs || []).filter(ref => ref.assetId !== assetId);
      target.updatedAt = new Date().toISOString();
      appendEvent(next, "asset.deleted", `素材“${asset.originalName || asset.id}”已移出项目${recoverablePath ? "并放入本机回收区" : ""}`, { projectId, assetId });
    });
  } catch (error) {
    if (recoverablePath && source) {
      try { await fs.mkdir(path.dirname(source), { recursive: true }); await fs.rename(recoverablePath, source); } catch {}
    }
    throw error;
  }
  return { id: assetId, recoverablePath };
}

export async function deleteAssetFolder(projectId, folderId) {
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const folder = project.assetFolders?.find(item => item.id === folderId);
    if (!folder) throw new Error("ASSET_FOLDER_NOT_FOUND");
    if (project.assetFolders?.some(item => item.parentId === folderId) || project.assets?.some(item => item.folderId === folderId)) throw new Error("ASSET_FOLDER_NOT_EMPTY");
    project.assetFolders = project.assetFolders.filter(item => item.id !== folderId);
    project.updatedAt = new Date().toISOString();
    appendEvent(state, "asset.folder_deleted", `素材文件夹“${folder.name}”已删除`, { projectId, folderId });
    return folder;
  });
}

export async function promoteAsset(projectId, assetId, scope = "series", folderId = null) {
  if (!["series", "world"].includes(scope)) throw new Error("ASSET_SCOPE_INVALID");
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const asset = project.assets?.find(item => item.id === assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    const folder = folderId ? project.assetFolders?.find(item => item.id === folderId) : scope === "series" ? project.assetFolders?.find(item => item.scope === "series") : null;
    if (folderId && !folder) throw new Error("ASSET_FOLDER_NOT_FOUND");
    asset.scope = scope;
    asset.folderId = folder?.id || asset.folderId || null;
    asset.worldId = scope === "world" ? (folder?.worldId || asset.worldId || null) : null;
    asset.creationId = null;
    asset.updatedAt = new Date().toISOString();
    project.updatedAt = asset.updatedAt;
    appendEvent(state, "asset.promoted", `素材“${asset.originalName || asset.id}”已提升为${scope === "series" ? "系列" : "分卷/季度"}公共资产`, { projectId, assetId, scope });
    return asset;
  });
}

export async function appendCreationMessage(projectId, creationId, input = {}) {
  const content = String(input.content || "").trim().slice(0, 8000);
  if (!content) throw new Error("MESSAGE_CONTENT_REQUIRED");
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const creation = project.creations?.find(item => item.id === creationId);
    if (!creation) throw new Error("CREATION_NOT_FOUND");
    creation.messages ||= [];
    const message = { id: safeId("message"), role: input.role === "assistant" ? "assistant" : "user", content, createdAt: new Date().toISOString() };
    creation.messages.push(message);
    creation.messages = creation.messages.slice(-200);
    creation.updatedAt = message.createdAt;
    project.updatedAt = message.createdAt;
    appendEvent(state, "creation.message_added", `创作页“${creation.title}”新增了一条${message.role === "user" ? "创作指令" : "Agent 记录"}`, { projectId, creationId, messageId: message.id });
    return message;
  });
}

function memoryScopeIds(project, input) {
  const scope = String(input?.scope || "").trim();
  const requestedVolumeId = String(input?.volumeId ?? input?.worldId ?? "").trim() || null;
  const requestedCreationId = String(input?.creationId || "").trim() || null;
  if (scope === "creation") {
    if (!requestedCreationId) throw new Error("MEMORY_CREATION_ID_REQUIRED");
    const creation = project.creations?.find(item => item.id === requestedCreationId);
    if (!creation) throw new Error("CREATION_NOT_FOUND");
    if (requestedVolumeId && requestedVolumeId !== (creation.worldId || null)) throw new Error("MEMORY_CREATION_VOLUME_MISMATCH");
    return { creationId: creation.id, volumeId: creation.worldId || null };
  }
  if (scope === "volume") {
    if (!requestedVolumeId) throw new Error("MEMORY_VOLUME_ID_REQUIRED");
    requireWorld(project, requestedVolumeId);
  }
  return { creationId: requestedCreationId, volumeId: requestedVolumeId };
}

function memoryAffectsApproval(project, memory, approval) {
  if (memory.scope === "series") return true;
  if (memory.scope === "creation") return (approval.creationId || null) === memory.creationId;
  const creation = approval.creationId ? project.creations?.find(item => item.id === approval.creationId) : null;
  return Boolean(creation && (creation.worldId || null) === memory.volumeId);
}

function invalidateMemoryBoundApprovals(state, project, memory, now) {
  for (const approval of state.approvals || []) {
    if (approval.projectId !== project.id || !["pending", "approved"].includes(approval.status) || !memoryAffectsApproval(project, memory, approval)) continue;
    let current = null;
    try {
      current = approvalScopeSnapshot(
        project,
        approval.creationId || null,
        state.settings,
        { maxImageCalls: approval.maxImageCalls, maxVideoCalls: approval.maxVideoCalls },
        approval.scopeSnapshot?.inputAssetBindings || null
      );
    } catch {}
    if (current && digest(current) === approval.scopeDigest) continue;
    approval.status = "stale";
    approval.staleAt = now;
    approval.staleReason = `approved-memory-${memory.id}-v${memory.version}`;
    for (const job of state.jobs || []) {
      if (job.approvalId === approval.id && ["queued", "running", "waiting"].includes(job.status)) Object.assign(job, { status: "superseded", staleAt: now, staleReason: approval.staleReason });
    }
    for (const task of state.tasks || []) {
      if (task.approvalId === approval.id && ["queued", "claimed"].includes(task.status)) Object.assign(task, { status: "superseded", staleAt: now, staleReason: approval.staleReason });
    }
    appendEvent(state, "approval.stale", "已批准的项目记忆发生变化，旧模型审批已失效", { approvalId: approval.id, projectId: project.id, memoryId: memory.id, memoryVersion: memory.version });
  }
}

export async function upsertMemory(projectId, input = {}) {
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    project.memories ||= [];
    const scopeIds = memoryScopeIds(project, input);
    const identity = normalizeMemoryEntry({ ...input, ...scopeIds, projectId, status: "candidate", version: input.version ?? 1 });
    const versions = project.memories.filter(item => item.id === identity.id).sort((left, right) => Number(right.version || 1) - Number(left.version || 1));
    const latest = versions[0] || null;
    const requestedVersion = input.version === undefined
      ? (latest?.status === "candidate" ? latest.version : latest ? Number(latest.version || 1) + 1 : 1)
      : Number(input.version);
    const existing = versions.find(item => Number(item.version || 1) === requestedVersion) || null;
    if (existing && existing.status !== "candidate") throw new Error("MEMORY_REVIEWED_VERSION_IMMUTABLE");
    if (!existing && requestedVersion !== (latest ? Number(latest.version || 1) + 1 : 1)) throw new Error("MEMORY_VERSION_SEQUENCE_INVALID");
    const memory = normalizeMemoryEntry({ ...input, ...scopeIds, id: identity.id, version: requestedVersion, projectId, status: "candidate" });
    if (existing) project.memories[project.memories.indexOf(existing)] = memory;
    else project.memories.push(memory);
    project.updatedAt = new Date().toISOString();
    appendEvent(state, "memory.upserted", `《${project.title}》已保存候选项目记忆`, { projectId, memoryId: memory.id, memoryVersion: memory.version, scope: memory.scope, volumeId: memory.volumeId, creationId: memory.creationId, kind: memory.kind, status: memory.status });
    return memory;
  });
}

export async function reviewMemory(projectId, memoryId, version, status, notes = "") {
  if (!["approved", "superseded", "disabled"].includes(status)) throw new Error("MEMORY_REVIEW_STATUS_INVALID");
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const index = (project.memories || []).findIndex(item => item.id === memoryId && Number(item.version || 1) === Number(version));
    if (index < 0) throw new Error("MEMORY_NOT_FOUND");
    const previous = project.memories[index];
    if (status === "approved" && !["candidate", "approved"].includes(previous.status)) throw new Error("MEMORY_REVIEW_TRANSITION_INVALID");
    const memory = normalizeMemoryEntry({ ...previous, status });
    project.memories[index] = memory;
    const now = new Date().toISOString();
    project.updatedAt = now;
    appendEvent(state, "memory.reviewed", `项目记忆已${status === "approved" ? "批准" : status === "superseded" ? "标记为已取代" : "停用"}`, { projectId, memoryId: memory.id, memoryVersion: memory.version, previousStatus: previous.status, status, notes: String(notes || "").trim().slice(0, 1000) });
    if (previous.status !== status && (previous.status === "approved" || status === "approved")) invalidateMemoryBoundApprovals(state, project, memory, now);
    return memory;
  });
}

export async function getContextPack(projectId, options = {}) {
  const state = await readState();
  const project = state.projects.find(item => item.id === projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const creationId = String(options.creationId || "").trim() || null;
  const creation = creationId ? project.creations?.find(item => item.id === creationId) : null;
  if (creationId && !creation) throw new Error("CREATION_NOT_FOUND");
  return buildProjectContextPack(project.memories || [], {
    projectId,
    creationId,
    volumeId: creation?.worldId || null,
    purpose: options.purpose || "",
    maxTokens: options.maxTokens ?? 2_000
  });
}

export async function updateProjectPlan(projectId, plan) {
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    project.creations ||= [];
    if (!project.creations.length) {
      const now = new Date().toISOString();
      project.creations.push({ id: safeId("creation"), title: "主创作页", status: "draft", pinned: false, worldId: null, type: "episode", planSource: "project-legacy", assetRefs: [], messages: [], canvas: canvasDefaults(), createdAt: now, updatedAt: now });
    }
    const creation = plan.creationId ? project.creations.find(item => item.id === plan.creationId) : project.creations[0];
    if (plan.creationId && !creation) throw new Error("CREATION_NOT_FOUND");
    const target = plan.creationId ? (creation.plan ||= { logline: "", brief: normalizeProductionBrief({}, {}, { aspectRatio: state.settings.ratio }), selectedSkills: [], planRevision: 0, revisionHistory: [], script: { premise: "", scenes: [] }, characters: [], shots: [] }) : project;
    target.script ||= { premise: "", scenes: [] };
    target.characters ||= [];
    target.shots ||= [];
    const originalShotIds = new Set(target.shots.map(shot => shot.id));
    target.brief = normalizeProductionBrief(target.brief, target.brief, { objective: target.logline || target.script.premise || "", aspectRatio: state.settings.ratio });
    target.selectedSkills = Array.isArray(target.selectedSkills) ? target.selectedSkills : [];
    target.revisionHistory = Array.isArray(target.revisionHistory) ? target.revisionHistory : [];
    const changedFields = [];
    const changedShotIds = new Set();
    const visualChangedShotIds = new Set();
    const editChangedShotIds = new Set();
    const reviewChangedShotIds = new Set();
    const removedShotIds = new Set();
    let invalidationLevel = 0;
    let globalVisualChanged = false;
    let metadataChanged = false;
    const raiseInvalidation = level => { invalidationLevel = Math.max(invalidationLevel, level); };
    if (plan.title !== undefined) {
      const title = String(plan.title).trim().slice(0, 80);
      if (title) {
        const currentTitle = plan.creationId ? creation.title : project.title;
        metadataChanged = title !== currentTitle;
        if (plan.creationId) creation.title = title; else project.title = title;
      }
    }
    if (plan.logline !== undefined) {
      const value = String(plan.logline).trim().slice(0, 500);
      if (value !== target.logline) { changedFields.push("logline"); raiseInvalidation(3); globalVisualChanged = true; }
      target.logline = value;
    }
    if (plan.premise !== undefined) {
      const value = String(plan.premise).trim().slice(0, 1200);
      if (value !== target.script.premise) { changedFields.push("premise"); raiseInvalidation(3); globalVisualChanged = true; }
      target.script.premise = value;
    }
    if (plan.brief !== undefined) {
      const nextBrief = normalizeProductionBrief(plan.brief, target.brief, { objective: target.logline || target.script.premise || "", aspectRatio: state.settings.ratio });
      const changedBriefKeys = Object.keys(nextBrief).filter(key => JSON.stringify(nextBrief[key]) !== JSON.stringify(target.brief[key]));
      if (changedBriefKeys.length) {
        changedFields.push("brief");
        const reviewOnly = changedBriefKeys.every(key => key === "acceptanceCriteria");
        raiseInvalidation(reviewOnly ? 1 : 3);
        if (!reviewOnly) globalVisualChanged = true;
      }
      target.brief = nextBrief;
    } else if (!target.brief.objective && (target.logline || target.script.premise)) {
      const nextBrief = normalizeProductionBrief({}, target.brief, { objective: target.logline || target.script.premise, aspectRatio: state.settings.ratio });
      if (JSON.stringify(nextBrief) !== JSON.stringify(target.brief)) { changedFields.push("brief"); raiseInvalidation(3); globalVisualChanged = true; }
      target.brief = nextBrief;
    }
    if (Array.isArray(plan.selectedSkills)) {
      const values = [...new Set(plan.selectedSkills.map(item => String(typeof item === "string" ? item : item?.name || "").trim()).filter(Boolean))].slice(0, 5);
      if (JSON.stringify(values) !== JSON.stringify(target.selectedSkills)) { changedFields.push("selectedSkills"); raiseInvalidation(3); globalVisualChanged = true; }
      target.selectedSkills = values;
    }
    if (Array.isArray(plan.scenes)) {
      const scenes = plan.scenes.slice(0, 100).map((scene, index) => ({
        id: String(scene.id || `scene-${index + 1}`).slice(0, 80),
        heading: String(scene.heading || `场景 ${index + 1}`).slice(0, 160),
        summary: String(scene.summary || "").slice(0, 1200)
      }));
      if (JSON.stringify(scenes) !== JSON.stringify(target.script.scenes)) { changedFields.push("scenes"); raiseInvalidation(3); globalVisualChanged = true; }
      target.script.scenes = scenes;
    }
    if (Array.isArray(plan.characters)) {
      const characters = plan.characters.slice(0, 50).map((character, index) => ({
        id: String(character.id || `character-${index + 1}`).slice(0, 80),
        name: String(character.name || `角色 ${index + 1}`).slice(0, 80),
        role: String(character.role || "").slice(0, 300),
        visual: String(character.visual || "").slice(0, 1200),
        referenceAssetIds: Array.isArray(character.referenceAssetIds) ? character.referenceAssetIds.map(String).slice(0, 20) : []
      }));
      if (JSON.stringify(characters) !== JSON.stringify(target.characters)) { changedFields.push("characters"); raiseInvalidation(3); globalVisualChanged = true; }
      target.characters = characters;
    }
    if (Array.isArray(plan.shots)) {
      const previous = new Map(target.shots.map(shot => [shot.id, shot]));
      target.shots = plan.shots.slice(0, 300).map((shot, index) => {
        const id = String(shot.id || `shot-${index + 1}`).slice(0, 80);
        const existing = previous.get(id) || {};
        const next = {
          ...existing,
          id,
          order: index + 1,
          duration: Math.min(Math.max(Number(shot.duration || existing.duration || 3), 0.5), 30),
          scene: String(shot.scene || existing.scene || "未命名场景").slice(0, 160),
          framing: String(shot.framing || existing.framing || "中景").slice(0, 80),
          prompt: String(shot.prompt || existing.prompt || "").slice(0, 3000),
          promptContractVersion: shot.promptContractVersion === undefined ? Number(existing.promptContractVersion || 1) : Number(shot.promptContractVersion),
          sceneId: String(shot.sceneId ?? existing.sceneId ?? "").trim().slice(0, 80),
          purpose: String(shot.purpose ?? existing.purpose ?? "").trim().slice(0, 500),
          subjectIds: Array.isArray(shot.subjectIds) ? shot.subjectIds.map(String).map(item => item.trim()).filter(Boolean).slice(0, 20) : (existing.subjectIds || []),
          startState: String(shot.startState ?? existing.startState ?? "").trim().slice(0, 800),
          endState: String(shot.endState ?? existing.endState ?? "").trim().slice(0, 800),
          camera: shot.camera && typeof shot.camera === "object" ? structuredClone(shot.camera) : (existing.camera || {}),
          motion: shot.motion !== undefined ? (typeof shot.motion === "string" ? shot.motion.slice(0, 1200) : structuredClone(shot.motion || {})) : (existing.motion || {}),
          style: String(shot.style ?? existing.style ?? "").trim().slice(0, 500),
          transition: String(shot.transition ?? existing.transition ?? "").trim().slice(0, 300),
          soundPlan: shot.soundPlan && typeof shot.soundPlan === "object" ? structuredClone(shot.soundPlan) : (existing.soundPlan || {}),
          audioMode: shot.audioMode === undefined ? existing.audioMode : String(shot.audioMode),
          continuityFromShotId: shot.continuityFromShotId === undefined ? (existing.continuityFromShotId || null) : (String(shot.continuityFromShotId || "").trim().slice(0, 80) || null),
          continuityConstraints: Array.isArray(shot.continuityConstraints) ? shot.continuityConstraints.map(String).map(item => item.trim().slice(0, 300)).filter(Boolean).slice(0, 30) : (existing.continuityConstraints || []),
          negativeConstraints: Array.isArray(shot.negativeConstraints) ? shot.negativeConstraints.map(String).map(item => item.trim().slice(0, 300)).filter(Boolean).slice(0, 30) : (existing.negativeConstraints || []),
          qualityRisks: Array.isArray(shot.qualityRisks) ? shot.qualityRisks.map(String).map(item => item.trim().slice(0, 300)).filter(Boolean).slice(0, 30) : (existing.qualityRisks || []),
          imagePrompt: String(shot.imagePrompt ?? existing.imagePrompt ?? "").trim().slice(0, 3000),
          videoPrompt: String(shot.videoPrompt ?? existing.videoPrompt ?? "").trim().slice(0, 3000),
          videoInputMode: String(shot.videoInputMode ?? existing.videoInputMode ?? "image-to-video"),
          action: String(shot.action || existing.action || "").slice(0, 1200),
          subtitle: String(shot.subtitle || existing.subtitle || "").slice(0, 1000),
          audio: String(shot.audio || existing.audio || "").slice(0, 1000),
          generationMode: shot.generationMode === undefined ? (existing.generationMode || "auto") : String(shot.generationMode),
          referenceAssetIds: Array.isArray(shot.referenceAssetIds) ? shot.referenceAssetIds.map(String).slice(0, 20) : (existing.referenceAssetIds || []),
          sourceVideoAssetId: shot.sourceVideoAssetId === undefined ? (existing.sourceVideoAssetId || null) : (String(shot.sourceVideoAssetId || "").trim() || null),
          sourceAudioAssetId: shot.sourceAudioAssetId === undefined ? (existing.sourceAudioAssetId || null) : (String(shot.sourceAudioAssetId || "").trim() || null),
          acceptanceCriteria: Array.isArray(shot.acceptanceCriteria) ? shot.acceptanceCriteria.map(item => String(item).trim().slice(0, 300)).filter(Boolean).slice(0, 20) : (existing.acceptanceCriteria || []),
          status: existing.status || "planned"
        };
        const visualKeys = ["duration", "scene", "framing", "prompt", "promptContractVersion", "sceneId", "purpose", "subjectIds", "startState", "endState", "camera", "motion", "style", "transition", "soundPlan", "audioMode", "continuityFromShotId", "continuityConstraints", "negativeConstraints", "qualityRisks", "imagePrompt", "videoPrompt", "videoInputMode", "action", "generationMode", "referenceAssetIds", "sourceVideoAssetId"];
        const editKeys = ["order", "subtitle", "audio", "sourceAudioAssetId"];
        const reviewKeys = ["acceptanceCriteria"];
        const differs = key => JSON.stringify(existing[key] ?? null) !== JSON.stringify(next[key] ?? null);
        if (!Object.keys(existing).length) {
          changedShotIds.add(id);
          visualChangedShotIds.add(id);
          raiseInvalidation(3);
          next.promptVersion = 1;
        } else if (visualKeys.some(differs)) {
          changedShotIds.add(id);
          visualChangedShotIds.add(id);
          raiseInvalidation(3);
          archiveShotVisualEvidence(next, new Date().toISOString());
        } else {
          next.promptVersion = Number(existing.promptVersion || 1);
          if (editKeys.some(differs)) {
            changedShotIds.add(id);
            editChangedShotIds.add(id);
            raiseInvalidation(2);
          } else if (reviewKeys.some(differs)) {
            changedShotIds.add(id);
            reviewChangedShotIds.add(id);
            raiseInvalidation(1);
          }
        }
        return next;
      });
      const removedIds = [...previous.keys()].filter(id => !target.shots.some(shot => shot.id === id));
      for (const id of removedIds) {
        changedShotIds.add(id);
        removedShotIds.add(id);
        editChangedShotIds.add(id);
        raiseInvalidation(2);
      }
      if (changedShotIds.size || target.shots.length !== previous.size) changedFields.push("shots");
    }
    validateProductionAssetReferences(project, plan.creationId ? creation : null, target);
    if (globalVisualChanged) {
      for (const shot of target.shots) {
        if (!originalShotIds.has(shot.id) || visualChangedShotIds.has(shot.id)) continue;
        changedShotIds.add(shot.id);
        visualChangedShotIds.add(shot.id);
        archiveShotVisualEvidence(shot, new Date().toISOString());
      }
      if (target.shots.length && !changedFields.includes("shots")) changedFields.push("shots");
    }
    const now = new Date().toISOString();
    if (changedFields.length) {
      target.planRevision = Number(target.planRevision || 0) + 1;
      target.revisionHistory.push({ revision: target.planRevision, changedFields: [...new Set(changedFields)], changedShotIds: [...changedShotIds], at: now });
      target.revisionHistory = target.revisionHistory.slice(-100);
      staleGeneratedShotAssets(project, new Set([...visualChangedShotIds, ...removedShotIds]), plan.creationId || null, now, "shot-visual-plan-revised");
      for (const output of project.outputs || []) {
        if ((output.creationId || null) === (plan.creationId || null)) {
          if (invalidationLevel === 1 && !output.stale) {
            output.carriedForwardFromRevision = Number(output.planRevision || 0);
            output.planRevision = target.planRevision;
            output.reviews = [];
            output.delivery = null;
            output.reviewResetAt = now;
            output.reviewResetReason = "acceptance-criteria-revised";
          } else {
            output.stale = true;
            output.staleAt = now;
            output.staleReason = `plan-revision-${target.planRevision}`;
          }
        }
      }
      for (const approval of state.approvals || []) {
        if (approval.projectId === projectId && (approval.creationId || null) === (plan.creationId || null) && ["pending", "approved"].includes(approval.status)) {
          approval.status = "stale";
          approval.staleAt = now;
          approval.staleReason = `plan-revision-${target.planRevision}`;
        }
      }
      for (const task of state.tasks || []) {
        if (task.projectId === projectId && (task.creationId || null) === (plan.creationId || null) && ["queued", "claimed"].includes(task.status)) {
          task.status = "superseded";
          task.staleAt = now;
          task.staleReason = `plan-revision-${target.planRevision}`;
        }
      }
      for (const job of state.jobs || []) {
        if (job.projectId === projectId && (job.creationId || null) === (plan.creationId || null) && ["queued", "running", "waiting"].includes(job.status)) {
          job.status = "superseded";
          job.staleAt = now;
          job.staleReason = `plan-revision-${target.planRevision}`;
        }
      }
      if (invalidationLevel === 1 && (project.outputs || []).some(output => !output.stale && (output.creationId || null) === (plan.creationId || null) && Number(output.planRevision || 0) === Number(target.planRevision || 0))) {
        target.currentStage = "review";
        target.status = "awaiting-review";
      } else {
        target.currentStage = target.shots.length ? "storyboard" : target.characters.length ? "characters" : "story";
        target.status = target.shots.length ? "ready" : "draft";
      }
      if (plan.creationId) {
        creation.updatedAt = now;
        creation.status = target.status;
        updateProjectAggregateStatus(project, "production");
      } else {
        project.currentStage = target.currentStage;
        project.status = target.status;
      }
      project.updatedAt = now;
      appendEvent(state, "project.plan_updated", `《${project.title}》${plan.creationId ? `的创作页“${creation.title}”` : ""}正式制作方案已更新`, { projectId, creationId: plan.creationId || null, revision: target.planRevision, invalidationLevel, changedFields: [...new Set(changedFields)], scenes: target.script.scenes.length, characters: target.characters.length, shots: target.shots.length });
    } else if (metadataChanged) {
      project.updatedAt = now;
      if (plan.creationId) creation.updatedAt = now;
      appendEvent(state, "project.plan_metadata_updated", `《${project.title}》${plan.creationId ? `的创作页“${creation.title}”` : ""}名称已更新`, { projectId, creationId: plan.creationId || null, revision: Number(target.planRevision || 0) });
    }
    return project;
  });
}

async function updateJob(jobId, patch, eventMessage) {
  return mutateState(state => {
    const job = state.jobs.find(item => item.id === jobId);
    if (!job) throw new Error("JOB_NOT_FOUND");
    if (job.status === "superseded") return job;
    Object.assign(job, patch, { updatedAt: new Date().toISOString() });
    if (eventMessage) appendEvent(state, "job.updated", eventMessage, { jobId, projectId: job.projectId, stage: job.stage });
    return job;
  });
}

async function acquireRealJobLease(jobId, approvalId) {
  return mutateState(state => {
    const job = state.jobs.find(item => item.id === jobId && item.approvalId === approvalId && item.type === "real-pipeline");
    if (!job) throw new Error("REAL_JOB_NOT_FOUND");
    if (job.status === "superseded") throw new Error("APPROVAL_SCOPE_STALE");
    const leaseActive = job.status === "running" && Date.parse(job.leaseExpiresAt || "") > Date.now();
    if (leaseActive) return null;
    const approval = state.approvals.find(item => item.id === approvalId);
    if (!approval || !["approved", "consumed"].includes(approval.status) || approval.jobId !== jobId || approval.authorization?.method !== "mcp-elicitation") throw new Error("APPROVAL_REQUIRED");
    assertApprovalScopeCurrent(state, approval);
    const now = new Date();
    job.status = "running";
    job.stage = job.stage === "queued" ? "images" : job.stage;
    job.runToken = safeId("run");
    job.runnerInstanceId = workflowInstanceId;
    job.leaseExpiresAt = new Date(now.getTime() + realJobLeaseMs).toISOString();
    job.updatedAt = now.toISOString();
    appendEvent(state, "job.runner_acquired", "真实模型批次执行器已取得可恢复租约", { jobId, approvalId, runToken: job.runToken });
    return { runToken: job.runToken, job };
  });
}

async function updateRealJob(jobId, runToken, patch, eventMessage) {
  return mutateState(state => {
    const job = state.jobs.find(item => item.id === jobId);
    if (!job) throw new Error("JOB_NOT_FOUND");
    if (job.status === "superseded") throw new Error("APPROVAL_SCOPE_STALE");
    if (job.runToken !== runToken) throw new Error("JOB_LEASE_LOST");
    const now = new Date();
    const releasesLease = patch.status && patch.status !== "running";
    Object.assign(job, patch, {
      updatedAt: now.toISOString(),
      leaseExpiresAt: releasesLease ? null : new Date(now.getTime() + realJobLeaseMs).toISOString(),
      runToken: releasesLease ? null : runToken
    });
    if (eventMessage) appendEvent(state, "job.updated", eventMessage, { jobId, projectId: job.projectId, stage: job.stage });
    return job;
  });
}

function assertRealJobLease(state, jobId, runToken) {
  const job = state.jobs.find(item => item.id === jobId && item.type === "real-pipeline");
  if (!job || job.status !== "running" || job.runToken !== runToken || Date.parse(job.leaseExpiresAt || "") <= Date.now()) throw new Error("JOB_LEASE_LOST");
  return job;
}

async function finishRealJob(jobId, approvalId, runToken, patch, eventMessage) {
  if (!["waiting", "succeeded"].includes(patch?.status)) throw new Error("REAL_JOB_FINAL_STATUS_INVALID");
  return mutateState(state => {
    const job = assertRealJobLease(state, jobId, runToken);
    if (job.approvalId !== approvalId) throw new Error("APPROVAL_REQUIRED");
    const approval = state.approvals.find(item => item.id === approvalId);
    if (!approval || !["approved", "consumed"].includes(approval.status) || approval.jobId !== jobId || approval.authorization?.method !== "mcp-elicitation") throw new Error("APPROVAL_REQUIRED");
    assertApprovalScopeCurrent(state, approval);
    const now = new Date().toISOString();
    approval.status = "consumed";
    approval.consumedAt ||= now;
    Object.assign(job, patch, { updatedAt: now, leaseExpiresAt: null, runToken: null });
    if (eventMessage) appendEvent(state, "job.updated", eventMessage, { jobId, projectId: job.projectId, stage: job.stage });
    return job;
  });
}

async function withRealJobHeartbeat(jobId, runToken, operation) {
  let heartbeat = Promise.resolve();
  let heartbeatError = null;
  const refresh = () => {
    heartbeat = heartbeat.then(() => updateRealJob(jobId, runToken, { status: "running" })).catch(error => { heartbeatError ||= error; });
  };
  const timer = setInterval(refresh, Math.max(5_000, Math.floor(realJobLeaseMs / 4)));
  timer.unref?.();
  try {
    const result = await operation();
    await heartbeat;
    if (heartbeatError) throw heartbeatError;
    return result;
  } finally {
    clearInterval(timer);
  }
}

export async function startLocalRender(projectId, creationId = null) {
  const launch = await mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const production = productionUnit(project, creationId);
    if (!production.shots.length) throw new Error("PROJECT_HAS_NO_SHOTS");
    const brief = normalizeProductionBrief(production.brief, production.brief, { objective: production.logline || production.script?.premise || "", aspectRatio: state.settings.ratio });
    assertApprovalBriefComplete(production, brief);
    if (!(production.selectedSkills || []).length) throw new Error("SKILL_ROUTING_REQUIRED");
    const creation = creationId ? project.creations?.find(item => item.id === creationId) : null;
    validateProductionAssetReferences(project, creation, production);
    const existing = state.jobs.find(item => item.projectId === projectId && (item.creationId || null) === (creationId || null) && item.type === "local-render" && Number(item.planRevision || 0) === Number(production.planRevision || 0) && ["queued", "running"].includes(item.status));
    if (existing) return { job: existing, shouldRun: false };
    const now = new Date().toISOString();
    const job = { id: safeId("job"), projectId, creationId, planRevision: Number(production.planRevision || 0), type: "local-render", status: "queued", stage: "queued", createdAt: now, updatedAt: now, error: null };
    state.jobs.unshift(job);
    appendEvent(state, "job.queued", `《${project.title}》本地剪辑已排队`, { jobId: job.id, projectId, creationId, planRevision: job.planRevision });
    return { job, shouldRun: true };
  });
  if (launch.shouldRun) void runLocalRender(launch.job.id, projectId, creationId);
  return launch.job;
}

async function runLocalRender(jobId, projectId, creationId = null) {
  try {
    await updateJob(jobId, { status: "running", stage: "clips" }, "正在准备 Seedance 与静态漫画混合镜头");
    const state = await readState();
    const currentJob = state.jobs.find(item => item.id === jobId && item.type === "local-render");
    if (!currentJob || currentJob.status === "superseded") throw new Error("PLAN_CHANGED_DURING_RENDER");
    const project = state.projects.find(item => item.id === projectId);
    const creation = creationId ? project.creations?.find(item => item.id === creationId) : null;
    const production = productionUnit(project, creationId);
    if (Number(currentJob.planRevision || 0) !== Number(production.planRevision || 0)) throw new Error("PLAN_CHANGED_DURING_RENDER");
    const brief = normalizeProductionBrief(production.brief, production.brief, { objective: production.logline || production.script?.premise || "", aspectRatio: state.settings.ratio });
    const renderRatio = brief.aspectRatio === "adaptive" ? state.settings.ratio : brief.aspectRatio;
    const renderDimensions = dimensionsForAspectRatio(renderRatio);
    const clipsDir = path.join(projectDir(projectId), "clips");
    const renderDir = path.join(projectDir(projectId), "renders", jobId);
    const clips = [];
    const clipDurations = [];
    const inputAssets = [];
    const inputShots = [];
    const referencedIds = validateProductionAssetReferences(project, creation, production);
    for (let index = 0; index < production.shots.length; index += 1) {
      const shot = production.shots[index];
      const sourceVideoAsset = shot.generationMode === "uploaded-video" ? resolveShotSourceAsset(project, shot, "sourceVideoAssetId", "video", true) : null;
      const sourceAudioAsset = resolveShotSourceAsset(project, shot, "sourceAudioAssetId", "audio");
      let sourceVideoEvidence = null;
      let sourceAudioEvidence = null;
      let sourceClip;
      if (sourceVideoAsset) {
        if (!sourceVideoAsset.localPath) throw new Error("SHOT_SOURCE_VIDEO_FILE_REQUIRED");
        sourceVideoEvidence = assetVersionEvidence(sourceVideoAsset);
        await assertAssetContentCurrent(sourceVideoAsset);
        inputAssets.push({ ...sourceVideoEvidence, shotId: shot.id, role: "source-video" });
        sourceClip = sourceVideoAsset.localPath;
      } else if (shot.clipPath) {
        await fs.access(shot.clipPath);
        sourceClip = shot.clipPath;
        const providerCallId = shot.providerSubmission?.callId;
        const providerCall = providerCallId ? state.providerCalls?.find(item => item.id === providerCallId) : null;
        if (providerCall && (providerCall.outputPath !== sourceClip || Number(providerCall.planRevision || 0) !== Number(production.planRevision || 0) || Number(providerCall.promptVersion || 1) !== Number(shot.promptVersion || 1))) throw new Error("SHOT_VIDEO_VERSION_STALE");
      } else {
        if (shot.generationMode !== "static-motion") throw new Error("SHOT_VIDEO_CLIP_REQUIRED");
        const asset = selectShotImageAsset(project, shot, creationId, referencedIds);
        if (!asset?.localPath) throw new Error("SHOT_ASSET_OR_CLIP_REQUIRED");
        await assertAssetContentCurrent(asset);
        const imageEvidence = asset.sha256 ? assetVersionEvidence(asset) : {
          assetId: asset.id,
          familyId: asset.familyId || asset.id,
          version: Number(asset.version || 1),
          kind: asset.kind,
          sha256: await fileDigest(asset.localPath)
        };
        inputAssets.push({ ...imageEvidence, shotId: shot.id, role: "source-image" });
        sourceClip = path.join(clipsDir, `${shot.id}-static.mp4`);
        await createShotVideo(asset.localPath, sourceClip, shot.duration, index, renderDimensions);
      }
      if (sourceAudioAsset) {
        if (!sourceAudioAsset.localPath) throw new Error("SHOT_SOURCE_AUDIO_FILE_REQUIRED");
        sourceAudioEvidence = assetVersionEvidence(sourceAudioAsset);
        await assertAssetContentCurrent(sourceAudioAsset);
        inputAssets.push({ ...sourceAudioEvidence, shotId: shot.id, role: "source-audio" });
      }
      const sourceMedia = await probeMedia(sourceClip);
      const sourceHasAudio = hasAudioStream(sourceMedia);
      if (shot.audio && !sourceAudioAsset && !sourceHasAudio) throw new Error("SHOT_AUDIO_SOURCE_REQUIRED");
      const clipSha256 = await fileDigest(sourceClip);
      const providerCall = shot.providerSubmission?.callId ? state.providerCalls?.find(item => item.id === shot.providerSubmission.callId) : null;
      if (providerCall?.sha256 && providerCall.sha256 !== clipSha256) throw new Error("SHOT_VIDEO_VERSION_STALE");
      inputShots.push({
        shotId: shot.id,
        promptVersion: Number(shot.promptVersion || 1),
        clipPath: shot.generationMode === "uploaded-video" ? null : (shot.clipPath || null),
        providerTaskId: shot.providerTaskId || null,
        sourceSha256: clipSha256,
        sourceHasAudio,
        sourceVideoAsset: sourceVideoEvidence,
        sourceAudioAsset: sourceAudioEvidence
      });
      const normalized = path.join(renderDir, `normalized-${String(index + 1).padStart(3, "0")}.mp4`);
      await normalizeVideoClip(sourceClip, normalized, renderDimensions, shot.duration, sourceAudioAsset?.localPath || null);
      clips.push(normalized);
      clipDurations.push(await probeDuration(normalized));
    }

    await updateJob(jobId, { stage: "render" }, "正在合成镜头、音轨和中文字幕");
    let cursor = 0;
    const subtitles = production.shots.map((shot, index) => {
      const start = cursor;
      cursor += clipDurations[index];
      return `${index + 1}\n${srtTimestamp(start)} --> ${srtTimestamp(cursor)}\n${shot.subtitle || " "}\n`;
    }).join("\n");
    const outputPath = path.join(projectDir(projectId), "outputs", `${jobId}.mp4`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await renderFinal({ clips, subtitles, outputPath, workingDir: renderDir });
    await mutateState(next => {
      const target = next.projects.find(item => item.id === projectId);
      const currentProduction = productionUnit(target, creationId);
      if (Number(currentProduction.planRevision || 0) !== Number(currentJob.planRevision || 0)) throw new Error("PLAN_CHANGED_DURING_RENDER");
      target.outputs.unshift({ id: safeId("output"), creationId, planRevision: Number(production.planRevision || 0), inputAssets, inputShots, kind: "video", localPath: outputPath, duration: cursor, reviews: [], delivery: null, stale: false, createdAt: new Date().toISOString(), jobId });
      const creation = creationId ? target.creations?.find(item => item.id === creationId) : null;
      if (creation) {
        creation.status = "awaiting-review";
        const lockedAt = new Date().toISOString();
        creation.assetRefs ||= [];
        for (const input of inputAssets) {
          const existingRef = creation.assetRefs.find(ref => ref.assetId === input.assetId);
          if (existingRef) Object.assign(existingRef, { version: input.version, locked: true, lockedAt });
          else creation.assetRefs.push({ assetId: input.assetId, version: input.version, locked: true, addedAt: lockedAt, lockedAt });
        }
        creation.updatedAt = new Date().toISOString();
        updateProjectAggregateStatus(target, "production");
      } else {
        target.currentStage = "review";
        target.status = "rendered";
      }
    });
    await updateJob(jobId, { status: "succeeded", stage: "complete", outputPath }, "本地混合剪辑成片已完成");
  } catch (error) {
    const failure = safeJobFailure(error);
    await updateJob(jobId, { status: "failed", stage: "failed", error: failure.message, errorCode: failure.code }, "本地剪辑未完成，素材和镜头均已保留");
  }
}

export async function createApproval(projectId, requested = {}) {
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const creationId = requested.creationId || null;
    const production = productionUnit(project, creationId);
    if (!(production.shots || []).length) throw new Error("PROJECT_HAS_NO_SHOTS");
    const brief = normalizeProductionBrief(production.brief, production.brief, { objective: production.logline || production.script?.premise || "", aspectRatio: state.settings.ratio });
    assertApprovalBriefComplete(production, brief);
    if (!(production.selectedSkills || []).length) throw new Error("SKILL_ROUTING_REQUIRED");
    const creation = creationId ? project.creations.find(item => item.id === creationId) : null;
    const references = validateProductionAssetReferences(project, creation, production);
    const scoped = { shots: production.shots, assets: project.assets.filter(asset => assetBelongsToCreation(asset, creationId, references)) };
    const limits = resolveApprovalLimits(scoped, state.settings, requested);
    if (limits.maxImageCalls === 0 && limits.maxVideoCalls === 0) throw new Error("NO_PAID_WORK_REQUIRED");
    const capability = validateSeedanceShots(production.shots, state.settings, brief);
    if (limits.maxVideoCalls > 0 && !capability.compatible) throw new Error(`SEEDANCE_CAPABILITY_MISMATCH:${capability.errors.map(item => item.code).join(",")}`);
    const scopeSnapshot = approvalScopeSnapshot(project, creationId, state.settings, limits);
    const scopeDigest = digest(scopeSnapshot);
    const existing = state.approvals.find(item => item.scopeDigest === scopeDigest && item.status === "pending" && !item.jobId);
    if (existing) return existing;
    const approval = {
      id: safeId("approval"), projectId, creationId, status: "pending", purpose: "生成当前创作页尚缺的付费图片与视频镜头",
      ...limits, usedImageCalls: 0, usedVideoCalls: 0, scopeDigest, scopeSnapshot,
      createdAt: new Date().toISOString(), decidedAt: null, authorization: null
    };
    state.approvals.unshift(approval);
    appendEvent(state, "approval.requested", `《${project.title}》真实模型批次等待审批`, { approvalId: approval.id, projectId, creationId, maxImageCalls: limits.maxImageCalls, maxVideoCalls: limits.maxVideoCalls, scopeDigest });
    return approval;
  });
}

export function resolveApprovalLimits(project, settings, requested = {}) {
  const shotCount = project.shots.length;
  const missingImages = project.shots.filter(shot => !shot.clipPath && shot.generationMode !== "uploaded-video" && !project.assets.some(asset => !asset.stale && asset.kind === "image" && (asset.shotId === shot.id || (shot.referenceAssetIds || []).includes(asset.id)))).length;
  const missingVideos = project.shots.filter(shot => !shot.clipPath && !["static-motion", "uploaded-video"].includes(shot.generationMode)).length;
  const bounded = (value, fallback) => Math.min(Math.max(Number(value ?? fallback) || 0, 0), shotCount);
  return {
    maxImageCalls: bounded(requested.maxImageCalls, missingImages),
    maxVideoCalls: bounded(requested.maxVideoCalls, missingVideos)
  };
}

export async function getApprovalSummary(approvalId) {
  const state = await readState();
  const approval = state.approvals.find(item => item.id === approvalId);
  if (!approval) throw new Error("APPROVAL_NOT_FOUND");
  const project = state.projects.find(item => item.id === approval.projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  return approvalSummary(approval, project);
}

export async function decideApproval(approvalId, decision, evidence = {}) {
  if (!['approved', 'rejected'].includes(decision)) throw new Error("APPROVAL_DECISION_INVALID");
  if (evidence.method !== "mcp-elicitation") throw new Error("TRUSTED_USER_CONFIRMATION_REQUIRED");
  return mutateState(state => {
    const approval = state.approvals.find(item => item.id === approvalId);
    if (!approval) throw new Error("APPROVAL_NOT_FOUND");
    if (approval.status === decision) return approval;
    if (approval.status !== "pending") throw new Error("APPROVAL_ALREADY_DECIDED");
    approval.status = decision;
    approval.decidedAt = new Date().toISOString();
    approval.authorization = { method: evidence.method, action: evidence.action || decision, recordedAt: approval.decidedAt };
    appendEvent(state, `approval.${decision}`, decision === "approved" ? "真实模型批次已批准" : "真实模型批次已拒绝", { approvalId, projectId: approval.projectId });
    return approval;
  });
}

export async function startRealPipeline(approvalId) {
  const launch = await mutateState(state => {
    const approval = state.approvals.find(item => item.id === approvalId);
    if (approval?.status === "stale") throw new Error("APPROVAL_SCOPE_STALE");
    if (!approval || approval.status !== "approved" || approval.authorization?.method !== "mcp-elicitation") throw new Error("APPROVAL_REQUIRED");
    if (approval.jobId) {
      const existing = state.jobs.find(item => item.id === approval.jobId);
      if (existing) return { job: existing, shouldRun: false };
      throw new Error("APPROVAL_ALREADY_CONSUMED");
    }
    const { currentScope } = assertApprovalScopeCurrent(state, approval);
    const now = new Date().toISOString();
    const created = { id: safeId("job"), projectId: approval.projectId, creationId: approval.creationId || null, approvalId, planRevision: currentScope.planRevision, type: "real-pipeline", status: "queued", stage: "queued", createdAt: now, updatedAt: now, error: null };
    approval.jobId = created.id;
    state.jobs.unshift(created);
    appendEvent(state, "job.queued", "真实模型批次已排队", { jobId: created.id, approvalId });
    return { job: created, shouldRun: true };
  });
  if (launch.shouldRun) void runRealPipeline(launch.job.id, approvalId);
  return launch.job;
}

export async function authorizeAndStartPipeline(approvalId, evidence = {}) {
  if (evidence.method !== "mcp-elicitation" || evidence.action !== "accept") throw new Error("TRUSTED_USER_CONFIRMATION_REQUIRED");
  const launch = await mutateState(state => {
    const approval = state.approvals.find(item => item.id === approvalId);
    if (!approval) throw new Error("APPROVAL_NOT_FOUND");
    if (approval.jobId) {
      const existing = state.jobs.find(item => item.id === approval.jobId);
      if (existing) return { job: existing, shouldRun: false };
      throw new Error("APPROVAL_ALREADY_CONSUMED");
    }
    if (approval.status === "stale") throw new Error("APPROVAL_SCOPE_STALE");
    if (!['pending', 'approved'].includes(approval.status)) throw new Error("APPROVAL_ALREADY_DECIDED");
    const { currentScope } = assertApprovalScopeCurrent(state, approval);
    const now = new Date().toISOString();
    approval.status = "approved";
    approval.decidedAt = now;
    approval.authorization = { method: evidence.method, action: evidence.action, recordedAt: now };
    const created = { id: safeId("job"), projectId: approval.projectId, creationId: approval.creationId || null, approvalId, planRevision: currentScope.planRevision, type: "real-pipeline", status: "queued", stage: "queued", createdAt: now, updatedAt: now, error: null };
    approval.jobId = created.id;
    state.jobs.unshift(created);
    appendEvent(state, "approval.approved", "用户已通过 Codex 确认真实模型批次", { approvalId, projectId: approval.projectId });
    appendEvent(state, "job.queued", "真实模型批次已排队", { jobId: created.id, approvalId });
    return { job: created, shouldRun: true };
  });
  if (launch.shouldRun) void runRealPipeline(launch.job.id, approvalId);
  return launch.job;
}

async function runRealPipeline(jobId, approvalId) {
  let runToken = null;
  try {
    const lease = await acquireRealJobLease(jobId, approvalId);
    if (!lease) return;
    runToken = lease.runToken;
    let apiKey = null;
    const arkKey = async () => {
      apiKey ||= await readArkKey();
      return apiKey;
    };
    let state = await readState();
    let approval = state.approvals.find(item => item.id === approvalId);
    let { project, production } = assertApprovalScopeCurrent(state, approval);
    await assertApprovalAssetContentsCurrent(project, approval);
    const creationId = approval.creationId || null;
    const settings = state.settings;
    await updateRealJob(jobId, runToken, { status: "running", stage: "images" }, "真实批次正在准备图片素材");

    for (const plannedShot of production.shots) {
      state = await readState();
      approval = state.approvals.find(item => item.id === approvalId);
      ({ project, production } = assertApprovalScopeCurrent(state, approval));
      const shot = production.shots.find(item => item.id === plannedShot.id);
      if (!shot) throw new Error("APPROVAL_SCOPE_STALE");
      const creation = creationId ? project.creations.find(item => item.id === creationId) : null;
      if (shot.generationMode === "uploaded-video") continue;
      if (selectApprovedShotImage(project, shot, approval, creationId)) continue;
      if (settings.imageProvider === "codex-imagegen") {
        await mutateState(next => {
          assertRealJobLease(next, jobId, runToken);
          const targetApproval = next.approvals.find(item => item.id === approvalId);
          if (!targetApproval || targetApproval.status !== "approved" || targetApproval.jobId !== jobId) throw new Error("APPROVAL_REQUIRED");
          const { project: targetProject, production: targetProduction } = assertApprovalScopeCurrent(next, targetApproval);
          const targetShot = targetProduction.shots.find(item => item.id === shot.id);
          if (!targetShot || Number(targetShot.promptVersion || 1) !== Number(shot.promptVersion || 1)) throw new Error("APPROVAL_SCOPE_STALE");
          const compiled = approvedShotCompilation(targetApproval, targetShot.id);
          const existingTask = next.tasks.find(task => task.approvalId === approvalId && task.shotId === shot.id && task.kind === "codex-imagegen" && ["queued", "claimed", "completed"].includes(task.status));
          if (existingTask) return existingTask;
          const queuedForApproval = next.tasks.filter(task => task.approvalId === approvalId && task.kind === "codex-imagegen" && task.status === "queued").length;
          if (targetApproval.usedImageCalls + queuedForApproval >= targetApproval.maxImageCalls) return null;
          const task = { id: safeId("task"), projectId: targetProject.id, creationId, worldId: creation?.worldId || null, approvalId, planRevision: Number(targetProduction.planRevision || 0), promptVersion: Number(targetShot.promptVersion || 1), shotId: targetShot.id, kind: "codex-imagegen", status: "queued", prompt: compiled.requests.image.prompt, requestDigest: compiled.requestDigests.image, requestSnapshot: compiled.requests.image, promptCompilerVersion: compiled.compilerVersion, createdAt: new Date().toISOString(), claimedAt: null, completedAt: null, inspection: null, assetId: null, callCharged: false };
          next.tasks.push(task);
          appendEvent(next, "task.created", `镜头 ${targetShot.order} 等待 Codex Image Gen`, { taskId: task.id, projectId: targetProject.id, creationId, approvalId });
          return task;
        });
        continue;
      }
      const currentKey = await arkKey();
      const reservation = await mutateState(next => {
        assertRealJobLease(next, jobId, runToken);
        const targetApproval = next.approvals.find(item => item.id === approvalId);
        if (!targetApproval || targetApproval.status !== "approved" || targetApproval.jobId !== jobId) throw new Error("APPROVAL_REQUIRED");
        const { project: targetProject, production: targetProduction } = assertApprovalScopeCurrent(next, targetApproval);
        const targetShot = targetProduction.shots.find(item => item.id === shot.id);
        if (!targetShot || Number(targetShot.promptVersion || 1) !== Number(shot.promptVersion || 1)) throw new Error("APPROVAL_SCOPE_STALE");
        const compiled = approvedShotCompilation(targetApproval, targetShot.id);
        const existing = currentProviderCall(next, approvalId, shot.id, "seedream-image");
        if (existing) return { call: existing, created: false };
        if (targetApproval.usedImageCalls >= targetApproval.maxImageCalls) return { call: null, created: false };
        targetApproval.usedImageCalls += 1;
        const call = { id: safeId("call"), jobId, approvalId, projectId: targetProject.id, creationId, shotId: shot.id, kind: "seedream-image", status: "submitting", charged: true, planRevision: Number(targetProduction.planRevision || 0), promptVersion: Number(targetShot.promptVersion || 1), requestDigest: compiled.requestDigests.image, requestSnapshot: compiled.requests.image, promptCompilerVersion: compiled.compilerVersion, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), error: null };
        next.providerCalls ||= [];
        next.providerCalls.unshift(call);
        targetShot.imageSubmission = { callId: call.id, status: call.status, approvalId };
        return { call, created: true };
      });
      if (!reservation.call) break;
      if (!reservation.created) {
        if (["submitting", "uncertain"].includes(reservation.call.status)) throw new Error("PROVIDER_SUBMISSION_UNCERTAIN");
        if (reservation.call.status === "succeeded" && reservation.call.outputPath) {
          const recoveredStat = await fs.stat(reservation.call.outputPath);
          const recoveredSha256 = await fileDigest(reservation.call.outputPath);
          if ((reservation.call.sha256 && reservation.call.sha256 !== recoveredSha256) || !recoveredStat.isFile()) throw new Error("ASSET_VERSION_CONTENT_CHANGED");
          await mutateState(next => {
            assertRealJobLease(next, jobId, runToken);
            const targetApproval = next.approvals.find(item => item.id === approvalId);
            const { project: targetProject, production: targetProduction } = assertApprovalScopeCurrent(next, targetApproval);
            const targetShot = targetProduction.shots.find(item => item.id === shot.id);
            if (!targetShot || Number(targetShot.promptVersion || 1) !== Number(reservation.call.promptVersion || 1)) throw new Error("APPROVAL_SCOPE_STALE");
            if (!selectApprovedShotImage(targetProject, targetShot, targetApproval, creationId)) {
              const identity = nextAssetIdentity(targetProject, shot.id, "image", creationId);
              targetProject.assets.push({ ...identity, approvalId, planRevision: reservation.call.planRevision, promptVersion: reservation.call.promptVersion, sha256: recoveredSha256, size: recoveredStat.size, tags: [], scope: creationId ? "creation" : "project", worldId: creation?.worldId || null, creationId, folderId: null, projectId: targetProject.id, shotId: shot.id, kind: "image", provider: "ark-seedream", localPath: reservation.call.outputPath, remoteUrl: reservation.call.remoteUrl || "", createdAt: new Date().toISOString() });
            }
            targetShot.imageSubmission = { callId: reservation.call.id, status: "succeeded", approvalId };
          });
        }
        continue;
      }
      const outputPath = path.join(projectDir(project.id), "assets", `${shot.id}-r${production.planRevision}-p${shot.promptVersion || 1}-seedream.png`);
      try {
        const request = reservation.call.requestSnapshot;
        const result = await withRealJobHeartbeat(jobId, runToken, () => generateSeedreamImage({ apiKey: currentKey, baseUrl: settings.arkBaseUrl, model: request.model, prompt: request.prompt, size: request.parameters?.size || "2K", outputPath, watermark: Boolean(request.parameters?.watermark) }));
        const imageStat = await fs.stat(result.outputPath);
        const imageSha256 = await fileDigest(result.outputPath);
        await mutateState(next => {
          const call = next.providerCalls.find(item => item.id === reservation.call.id);
          if (!call) throw new Error("PROVIDER_CALL_NOT_FOUND");
          Object.assign(call, { status: "succeeded", outputPath: result.outputPath, remoteUrl: result.remoteUrl, usage: result.usage || null, sha256: imageSha256, bytes: imageStat.size, updatedAt: new Date().toISOString() });
        });
        await mutateState(next => {
          assertRealJobLease(next, jobId, runToken);
          const targetApproval = next.approvals.find(item => item.id === approvalId);
          const { project: targetProject, production: targetProduction } = assertApprovalScopeCurrent(next, targetApproval);
          const targetShot = targetProduction.shots.find(item => item.id === shot.id);
          if (!targetShot || Number(targetShot.promptVersion || 1) !== Number(reservation.call.promptVersion || 1)) throw new Error("APPROVAL_SCOPE_STALE");
          const identity = nextAssetIdentity(targetProject, shot.id, "image", creationId);
          targetProject.assets.push({ ...identity, approvalId, planRevision: reservation.call.planRevision, promptVersion: reservation.call.promptVersion, sha256: imageSha256, size: imageStat.size, tags: [], scope: creationId ? "creation" : "project", worldId: creation?.worldId || null, creationId, folderId: null, projectId: targetProject.id, shotId: shot.id, kind: "image", provider: "ark-seedream", localPath: result.outputPath, remoteUrl: result.remoteUrl, createdAt: new Date().toISOString() });
          targetShot.imageSubmission = { callId: reservation.call.id, status: "succeeded", approvalId };
        });
      } catch (error) {
        await mutateState(next => {
          const call = next.providerCalls?.find(item => item.id === reservation.call.id);
          if (call && call.status !== "succeeded") Object.assign(call, { status: providerFailureIsUncertain(error) ? "uncertain" : "failed", error: String(error?.message || error), updatedAt: new Date().toISOString() });
        });
        if (String(error?.message || error) === "APPROVAL_SCOPE_STALE") throw error;
        if (providerFailureIsUncertain(error)) throw new Error("PROVIDER_SUBMISSION_UNCERTAIN");
        throw error;
      }
    }

    {
      const afterTasks = await readState();
      approval = afterTasks.approvals.find(item => item.id === approvalId);
      const { project: afterProject, production: afterProduction } = assertApprovalScopeCurrent(afterTasks, approval);
      const missingImages = afterProduction.shots.filter(shot => !shot.clipPath && shot.generationMode !== "uploaded-video" && !selectApprovedShotImage(afterProject, shot, approval, creationId));
      if (missingImages.length) {
        const activeTasks = afterTasks.tasks.filter(task => task.approvalId === approvalId && ["queued", "claimed"].includes(task.status));
        if (activeTasks.length) {
          await updateRealJob(jobId, runToken, { status: "waiting", stage: "codex-images" }, `还有 ${missingImages.length} 个镜头等待 Codex Image Gen 回填`);
        } else {
          await finishRealJob(jobId, approvalId, runToken, { status: "waiting", stage: "approval-cap" }, `图片调用上限已用尽，仍有 ${missingImages.length} 个镜头缺图`);
        }
        return;
      }
      const missingRemoteSources = afterProduction.shots
        .filter(shot => !currentProviderCall(afterTasks, approvalId, shot.id, "seedance-video")?.providerTaskId)
        .map(shot => selectApprovedShotImage(afterProject, shot, approval, creationId))
        .filter(asset => asset && (!asset.remoteUrl || asset.remoteSource === "local-bridge"));
      try {
        for (const asset of missingRemoteSources) {
          await assertAssetContentCurrent(asset);
          await ensureAssetRemoteUrl(project.id, asset.id);
        }
      } catch (error) {
        const failure = safeJobFailure(error);
        await updateRealJob(jobId, runToken, { status: "waiting", stage: "asset-bridge", error: failure.message, errorCode: failure.code }, "参考图片等待受控 HTTPS 桥接");
        return;
      }
    }

    await updateRealJob(jobId, runToken, { status: "running", stage: "videos" }, "真实批次正在生成视频镜头");
    state = await readState();
    approval = state.approvals.find(item => item.id === approvalId);
    let latest = assertApprovalScopeCurrent(state, approval);
    const latestProduction = latest.production;
    for (const shot of latestProduction.shots) {
      if (shot.clipPath) continue;
      if (["static-motion", "uploaded-video"].includes(shot.generationMode)) continue;
      state = await readState();
      approval = state.approvals.find(item => item.id === approvalId);
      latest = assertApprovalScopeCurrent(state, approval);
      const currentShot = latest.production.shots.find(item => item.id === shot.id);
      if (!currentShot || Number(currentShot.promptVersion || 1) !== Number(shot.promptVersion || 1)) throw new Error("APPROVAL_SCOPE_STALE");
      const asset = selectApprovedShotImage(latest.project, currentShot, approval, creationId);
      if (!asset) throw new Error("SEEDANCE_REQUIRES_REMOTE_IMAGE_URL");
      let call = currentProviderCall(state, approvalId, shot.id, "seedance-video");
      if (call && ["submitting", "uncertain"].includes(call.status) && !call.providerTaskId) throw new Error("PROVIDER_SUBMISSION_UNCERTAIN");
      let taskId = call?.providerTaskId || null;
      if (!taskId) {
        await assertAssetContentCurrent(asset);
        if (!asset.remoteUrl) throw new Error("SEEDANCE_REQUIRES_REMOTE_IMAGE_URL");
        const currentKey = await arkKey();
        const reservation = await mutateState(next => {
          assertRealJobLease(next, jobId, runToken);
          const targetApproval = next.approvals.find(item => item.id === approvalId);
          if (!targetApproval || targetApproval.status !== "approved" || targetApproval.jobId !== jobId) throw new Error("APPROVAL_REQUIRED");
          const { project: targetProject, production: targetProduction } = assertApprovalScopeCurrent(next, targetApproval);
          const targetShot = targetProduction.shots.find(item => item.id === shot.id);
          if (!targetShot || Number(targetShot.promptVersion || 1) !== Number(shot.promptVersion || 1)) throw new Error("APPROVAL_SCOPE_STALE");
          const targetAsset = selectApprovedShotImage(targetProject, targetShot, targetApproval, creationId);
          if (!targetAsset || targetAsset.id !== asset.id || !targetAsset.remoteUrl) throw new Error("APPROVAL_SCOPE_STALE");
          const compiled = approvedShotCompilation(targetApproval, targetShot.id);
          const inputAsset = { referenceRole: "first-frame", ...assetVersionEvidence(targetAsset) };
          const providerPayload = {
            model: compiled.requests.video.model,
            prompt: compiled.requests.video.prompt,
            imageUrlDigest: digest(targetAsset.remoteUrl),
            inputAsset,
            parameters: compiled.requests.video.parameters
          };
          const existing = currentProviderCall(next, approvalId, shot.id, "seedance-video");
          if (existing) return { call: existing, created: false };
          if (targetApproval.usedVideoCalls >= targetApproval.maxVideoCalls) return { call: null, created: false };
          targetApproval.usedVideoCalls += 1;
          const nextCall = { id: safeId("call"), jobId, approvalId, projectId: targetProject.id, creationId, shotId: shot.id, kind: "seedance-video", status: "submitting", charged: true, planRevision: Number(targetProduction.planRevision || 0), promptVersion: Number(targetShot.promptVersion || 1), inputAsset, requestDigest: compiled.requestDigests.video, requestSnapshot: compiled.requests.video, promptCompilerVersion: compiled.compilerVersion, providerPayloadDigest: digest(providerPayload), providerPayloadSnapshot: providerPayload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), error: null };
          next.providerCalls ||= [];
          next.providerCalls.unshift(nextCall);
          targetShot.providerSubmission = { callId: nextCall.id, status: nextCall.status, approvalId };
          return { call: nextCall, created: true };
        });
        if (!reservation.call) break;
        call = reservation.call;
        if (!reservation.created) {
          if (["submitting", "uncertain"].includes(call.status) && !call.providerTaskId) throw new Error("PROVIDER_SUBMISSION_UNCERTAIN");
          taskId = call.providerTaskId;
        } else {
          try {
            const request = call.requestSnapshot;
            taskId = await withRealJobHeartbeat(jobId, runToken, () => createSeedanceTask({ apiKey: currentKey, baseUrl: settings.arkBaseUrl, model: request.model, prompt: request.prompt, imageUrl: asset.remoteUrl, ratio: request.parameters?.ratio, resolution: request.parameters?.resolution, generateAudio: Boolean(request.parameters?.generate_audio), watermark: Boolean(request.parameters?.watermark), duration: request.parameters?.duration }));
            await mutateState(next => {
              const targetCall = next.providerCalls.find(item => item.id === call.id);
              if (!targetCall) throw new Error("PROVIDER_CALL_NOT_FOUND");
              Object.assign(targetCall, { status: "submitted", providerTaskId: taskId, updatedAt: new Date().toISOString() });
            });
            await mutateState(next => {
              assertRealJobLease(next, jobId, runToken);
              const targetCall = next.providerCalls.find(item => item.id === call.id);
              if (!targetCall || targetCall.providerTaskId !== taskId) throw new Error("PROVIDER_CALL_NOT_FOUND");
              const targetApproval = next.approvals.find(item => item.id === approvalId);
              const { production: targetProduction } = assertApprovalScopeCurrent(next, targetApproval);
              const targetShot = targetProduction.shots.find(item => item.id === shot.id);
              if (!targetShot || Number(targetShot.promptVersion || 1) !== Number(targetCall.promptVersion || 1)) throw new Error("APPROVAL_SCOPE_STALE");
              targetShot.providerTaskId = taskId;
              targetShot.providerSubmission = { callId: targetCall.id, status: "submitted", approvalId };
              targetShot.status = "video-running";
            });
          } catch (error) {
            await mutateState(next => {
              const targetCall = next.providerCalls?.find(item => item.id === call.id);
              if (targetCall && !targetCall.providerTaskId) Object.assign(targetCall, { status: providerFailureIsUncertain(error) ? "uncertain" : "failed", error: String(error?.message || error), updatedAt: new Date().toISOString() });
            });
            if (String(error?.message || error) === "APPROVAL_SCOPE_STALE") throw error;
            if (providerFailureIsUncertain(error)) throw new Error("PROVIDER_SUBMISSION_UNCERTAIN");
            throw error;
          }
        }
      }
      if (!taskId) throw new Error("PROVIDER_SUBMISSION_UNCERTAIN");
      const currentKey = await arkKey();
      let result;
      try {
        result = await withRealJobHeartbeat(jobId, runToken, () => waitForSeedanceTask({
          apiKey: currentKey,
          baseUrl: settings.arkBaseUrl,
          taskId,
          onStatus: async status => {
            await updateRealJob(jobId, runToken, { status: "running", stage: `video-${shot.order}-${status}` });
            await mutateState(next => {
              const targetCall = next.providerCalls?.find(item => item.id === call.id);
              if (targetCall) Object.assign(targetCall, { status: status === "succeeded" ? "submitted" : status, providerStatus: status, updatedAt: new Date().toISOString() });
            });
          },
          onPoll: async () => updateRealJob(jobId, runToken, { status: "running" })
        }));
      } catch (error) {
        const errorMessage = String(error?.message || error);
        const terminal = /^SEEDANCE_(FAILED|CANCELLED|EXPIRED)/.test(errorMessage);
        await mutateState(next => {
          const targetCall = next.providerCalls?.find(item => item.id === call.id);
          if (targetCall) Object.assign(targetCall, { status: terminal ? "failed" : "submitted", error: errorMessage, updatedAt: new Date().toISOString() });
        });
        if (!terminal && !["JOB_LEASE_LOST", "APPROVAL_SCOPE_STALE"].includes(errorMessage)) throw new Error("SEEDANCE_STATUS_UNKNOWN_AFTER_TIMEOUT");
        throw error;
      }
      const outputPath = path.join(projectDir(project.id), "clips", `${shot.id}-r${call.planRevision}-p${call.promptVersion}-seedance.mp4`);
      let downloaded;
      try {
        downloaded = await withRealJobHeartbeat(jobId, runToken, () => downloadSeedanceVideo(result, outputPath));
      } catch (error) {
        await mutateState(next => {
          const targetCall = next.providerCalls?.find(item => item.id === call.id);
          if (targetCall) Object.assign(targetCall, { status: "download-pending", error: String(error?.message || error), updatedAt: new Date().toISOString() });
        });
        throw new Error("SEEDANCE_OUTPUT_DOWNLOAD_PENDING");
      }
      const clipEvidence = await captureFileEvidence(outputPath);
      await mutateState(next => {
        const targetCall = next.providerCalls?.find(item => item.id === call.id);
        if (!targetCall) throw new Error("PROVIDER_CALL_NOT_FOUND");
        Object.assign(targetCall, { status: "succeeded", providerStatus: "succeeded", outputPath, remoteUrl: downloaded.remoteUrl, sha256: clipEvidence.sha256, bytes: clipEvidence.bytes, media: clipEvidence.media, updatedAt: new Date().toISOString() });
      });
      await mutateState(next => {
        assertRealJobLease(next, jobId, runToken);
        const targetCall = next.providerCalls?.find(item => item.id === call.id);
        if (!targetCall || targetCall.outputPath !== outputPath) throw new Error("PROVIDER_CALL_NOT_FOUND");
        const targetApproval = next.approvals.find(item => item.id === approvalId);
        const { production: targetProduction } = assertApprovalScopeCurrent(next, targetApproval);
        const targetShot = targetProduction.shots.find(item => item.id === shot.id);
        if (!targetShot || Number(targetShot.promptVersion || 1) !== Number(targetCall.promptVersion || 1)) throw new Error("APPROVAL_SCOPE_STALE");
        targetShot.providerTaskId = taskId;
        targetShot.providerSubmission = { callId: targetCall.id, status: "succeeded", approvalId };
        targetShot.clipPath = outputPath;
        targetShot.clipPlanRevision = targetCall.planRevision;
        targetShot.clipPromptVersion = targetCall.promptVersion;
        targetShot.status = "video-ready";
      });
    }
    const finishedState = await readState();
    approval = finishedState.approvals.find(item => item.id === approvalId);
    const { production: finishedProduction } = assertApprovalScopeCurrent(finishedState, approval);
    const missingVideos = finishedProduction.shots.filter(shot => !shot.clipPath && !["static-motion", "uploaded-video"].includes(shot.generationMode));
    if (missingVideos.length) {
      await finishRealJob(jobId, approvalId, runToken, { status: "waiting", stage: "approval-cap" }, `视频调用上限已用尽，仍有 ${missingVideos.length} 个镜头未生成`);
      return;
    }
    await finishRealJob(jobId, approvalId, runToken, { status: "succeeded", stage: "videos-ready" }, "真实视频镜头已生成，可进入确定性剪辑");
  } catch (error) {
    const failure = safeJobFailure(error);
    if (!runToken) return;
    const recoverable = ["PROVIDER_SUBMISSION_UNCERTAIN", "SEEDANCE_STATUS_UNKNOWN_AFTER_TIMEOUT", "SEEDANCE_OUTPUT_DOWNLOAD_PENDING"].includes(failure.code);
    try {
      await updateRealJob(jobId, runToken, { status: recoverable ? "waiting" : "failed", stage: recoverable ? "provider-status-check" : "failed", error: failure.message, errorCode: failure.code }, recoverable ? "真实模型任务状态待核对，系统不会自动重复提交" : "真实模型批次停止，已成功产物已保留");
    } catch (updateError) {
      if (!["JOB_LEASE_LOST", "APPROVAL_SCOPE_STALE"].includes(String(updateError?.message || updateError))) throw updateError;
    }
  }
}

export async function resumeRealPipeline(jobId) {
  const launch = await mutateState(state => {
    const target = state.jobs.find(item => item.id === jobId);
    if (!target || target.type !== "real-pipeline") throw new Error("REAL_JOB_NOT_FOUND");
    if (target.status === "superseded") throw new Error("APPROVAL_SCOPE_STALE");
    if (target.status === "running" && Date.parse(target.leaseExpiresAt || "") > Date.now()) return { job: target, shouldRun: false };
    if (!["queued", "running", "waiting"].includes(target.status)) throw new Error("REAL_JOB_NOT_WAITING");
    const approval = state.approvals.find(item => item.id === target.approvalId);
    if (!approval || approval.status !== "approved" || approval.jobId !== target.id || approval.authorization?.method !== "mcp-elicitation") throw new Error("APPROVAL_REQUIRED");
    assertApprovalScopeCurrent(state, approval);
    target.status = "queued";
    target.stage = "resume-queued";
    target.error = null;
    target.updatedAt = new Date().toISOString();
    appendEvent(state, "job.updated", "真实模型批次准备续跑", { jobId, projectId: target.projectId, stage: target.stage });
    return { job: target, shouldRun: true };
  });
  if (launch.shouldRun) void runRealPipeline(jobId, launch.job.approvalId);
  return launch.job;
}

export async function claimTask(taskId, actor = "codex") {
  return mutateState(state => {
    const task = state.tasks.find(item => item.id === taskId);
    if (!task) throw new Error("TASK_NOT_FOUND");
    if (task.status !== "queued") throw new Error("TASK_NOT_CLAIMABLE");
    if (task.approvalId) {
      const approval = state.approvals.find(item => item.id === task.approvalId);
      if (!approval || approval.status !== "approved") throw new Error("APPROVAL_REQUIRED");
      const { production } = assertApprovalScopeCurrent(state, approval);
      if (Number(production.planRevision || 0) !== Number(task.planRevision || 0)) throw new Error("TASK_PLAN_STALE");
      if (!task.callCharged) {
        if (approval.usedImageCalls >= approval.maxImageCalls) throw new Error("APPROVAL_IMAGE_CAP_REACHED");
        approval.usedImageCalls += 1;
        task.callCharged = true;
        task.callChargedAt = new Date().toISOString();
      }
    }
    task.status = "claimed";
    task.claimedBy = actor;
    task.claimedAt = new Date().toISOString();
    return task;
  });
}

export async function completeTask(taskId, localPath, remoteUrl = "", inspection = null) {
  const normalized = path.resolve(localPath);
  const fileStat = await fs.stat(normalized);
  if (!fileStat.isFile() || fileStat.size <= 0) throw new Error("IMAGE_FILE_INVALID");
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(path.extname(normalized).toLowerCase())) throw new Error("IMAGE_FILE_TYPE_INVALID");
  const sha256 = await fileDigest(normalized);
  if (remoteUrl) {
    const parsed = new URL(String(remoteUrl));
    if (!["https:", "asset:"].includes(parsed.protocol)) throw new Error("REMOTE_IMAGE_URL_MUST_BE_HTTPS_OR_ASSET");
    remoteUrl = parsed.toString();
  }
  return mutateState(state => {
    const task = state.tasks.find(item => item.id === taskId);
    if (!task) throw new Error("TASK_NOT_FOUND");
    if (task.status === "completed") return task;
    if (task.status !== "claimed") throw new Error("TASK_NOT_COMPLETABLE");
    if (task.approvalId) {
      const requiredChecks = ["composition", "identity", "artifacts", "cropSafety"];
      if (!inspection?.accepted || !String(inspection.notes || "").trim() || requiredChecks.some(key => !["passed", "not-applicable"].includes(inspection[key]))) throw new Error("IMAGE_INSPECTION_REQUIRED");
      const approval = state.approvals.find(item => item.id === task.approvalId);
      if (!approval || approval.status !== "approved") throw new Error("APPROVAL_REQUIRED");
      const { production } = assertApprovalScopeCurrent(state, approval);
      if (Number(production.planRevision || 0) !== Number(task.planRevision || 0)) throw new Error("TASK_PLAN_STALE");
    }
    task.status = "completed";
    task.completedAt = new Date().toISOString();
    task.localPath = normalized;
    task.sha256 = sha256;
    task.bytes = fileStat.size;
    task.remoteUrl = remoteUrl;
    task.inspection = inspection ? { ...inspection, notes: String(inspection.notes).trim().slice(0, 2000), inspectedAt: new Date().toISOString() } : null;
    const project = state.projects.find(item => item.id === task.projectId);
    const identity = nextAssetIdentity(project, task.shotId, "image", task.creationId || null);
    task.assetId = identity.id;
    project.assets.push({ ...identity, approvalId: task.approvalId || null, planRevision: Number(task.planRevision || 0), promptVersion: Number(task.promptVersion || 1), inspection: task.inspection, sha256, size: fileStat.size, tags: [], scope: task.creationId ? "creation" : "project", worldId: task.worldId || null, creationId: task.creationId || null, folderId: null, projectId: task.projectId, shotId: task.shotId, kind: "image", provider: "codex-imagegen", localPath: normalized, remoteUrl, remoteSource: remoteUrl ? "external" : "", createdAt: new Date().toISOString() });
    appendEvent(state, "task.completed", "Codex Image Gen 素材已回填", { taskId, projectId: task.projectId, shotId: task.shotId });
    return task;
  });
}

export async function failTask(taskId, reason) {
  const message = String(reason || "IMAGE_GENERATION_FAILED").trim().slice(0, 2000);
  return mutateState(state => {
    const task = state.tasks.find(item => item.id === taskId);
    if (!task || task.kind !== "codex-imagegen") throw new Error("TASK_NOT_FOUND");
    if (task.status === "failed") return task;
    if (task.status !== "claimed") throw new Error("TASK_NOT_FAILABLE");
    task.status = "failed";
    task.error = message;
    task.failedAt = new Date().toISOString();
    appendEvent(state, "task.failed", "Codex Image Gen 任务失败；本次已领取调用仍计入审批上限", { taskId, projectId: task.projectId, shotId: task.shotId });
    return task;
  });
}

export async function attachTaskRemoteUrl(taskId, remoteUrl) {
  const normalized = new URL(String(remoteUrl || ""));
  if (!["https:", "asset:"].includes(normalized.protocol)) throw new Error("REMOTE_IMAGE_URL_MUST_BE_HTTPS_OR_ASSET");
  return mutateState(state => {
    const task = state.tasks.find(item => item.id === taskId);
    if (!task || task.kind !== "codex-imagegen") throw new Error("TASK_NOT_FOUND");
    if (task.status !== "completed") throw new Error("TASK_NOT_COMPLETED");
    const project = state.projects.find(item => item.id === task.projectId);
    const asset = project.assets.find(item => item.id === task.assetId);
    if (!asset) throw new Error("TASK_ASSET_NOT_FOUND");
    task.remoteUrl = normalized.toString();
    asset.remoteUrl = normalized.toString();
    asset.remoteSource = "external";
    appendEvent(state, "task.remote_source_attached", "Codex 图片的远程素材地址已补充", { taskId, projectId: task.projectId, shotId: task.shotId });
    return task;
  });
}

export async function getProductionStatus(projectId, creationId = null, options = {}) {
  return buildProductionStatus(await readState(), projectId, creationId, options);
}

export async function prepareQualityEvidence(projectId, creationId, outputId) {
  const state = await readState();
  const project = state.projects.find(item => item.id === projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const output = project.outputs?.find(item => item.id === outputId && (item.creationId || null) === (creationId || null));
  if (!output || output.stale) throw new Error("OUTPUT_NOT_FOUND_OR_STALE");
  const production = productionUnit(project, creationId || null);
  if (Number(output.planRevision || 0) !== Number(production.planRevision || 0)) throw new Error("OUTPUT_PLAN_STALE");
  const outputDir = path.join(projectDir(projectId), "review-evidence", outputId);
  const manifest = await createReviewEvidencePack({ inputPath: output.localPath, outputDir, shots: production.shots || [] });
  const evidence = {
    schema: manifest.schema,
    purpose: manifest.purpose,
    automatedVisualAcceptance: false,
    manifestPath: path.join(outputDir, "review-evidence.json"),
    digest: digest(manifest),
    source: manifest.source,
    media: manifest.media,
    frames: manifest.frames,
    preparedAt: new Date().toISOString()
  };
  return mutateState(next => {
    const targetProject = next.projects.find(item => item.id === projectId);
    const targetOutput = targetProject?.outputs?.find(item => item.id === outputId && (item.creationId || null) === (creationId || null));
    if (!targetOutput || targetOutput.stale || path.resolve(targetOutput.localPath) !== manifest.source.path) throw new Error("OUTPUT_NOT_FOUND_OR_STALE");
    const targetProduction = productionUnit(targetProject, creationId || null);
    if (Number(targetOutput.planRevision || 0) !== Number(targetProduction.planRevision || 0)) throw new Error("OUTPUT_PLAN_STALE");
    targetOutput.reviewEvidence = evidence;
    appendEvent(next, "output.review_evidence_prepared", "成片首尾帧与镜头边界证据已准备，等待实际目检", { projectId, creationId: creationId || null, outputId, evidenceDigest: evidence.digest, frameCount: evidence.frames.length });
    return evidence;
  });
}

export async function recordQualityReview(projectId, creationId, outputId, input = {}) {
  const allowed = new Set(["passed", "failed", "not-applicable"]);
  const decision = input.decision === "passed" ? "passed" : "changes-required";
  const checkNames = ["visual", "continuity", "subtitles", "audio", "brandAccuracy"];
  const checks = Object.fromEntries(checkNames.map(name => [name, allowed.has(input.checks?.[name]) ? input.checks[name] : "failed"]));
  const criteriaResults = (Array.isArray(input.criteriaResults) ? input.criteriaResults : []).map(item => ({
    criterion: String(item?.criterion || "").trim().slice(0, 500),
    status: allowed.has(item?.status) ? item.status : "failed",
    evidence: String(item?.evidence || "").trim().slice(0, 2000)
  })).filter(item => item.criterion);
  const notes = String(input.notes || "").trim().slice(0, 5000);
  if (!notes) throw new Error("QUALITY_REVIEW_NOTES_REQUIRED");
  const state = await readState();
  const project = state.projects.find(item => item.id === projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const output = project.outputs?.find(item => item.id === outputId && (item.creationId || null) === (creationId || null));
  if (!output || output.stale) throw new Error("OUTPUT_NOT_FOUND_OR_STALE");
  const production = productionUnit(project, creationId || null);
  if (Number(output.planRevision || 0) !== Number(production.planRevision || 0)) throw new Error("OUTPUT_PLAN_STALE");
  const brief = normalizeProductionBrief(production.brief, production.brief, { objective: production.logline || production.script?.premise || "", aspectRatio: state.settings.ratio });
  assertApprovalBriefComplete(production, brief);
  const requiredCriteria = requiredQualityCriteria(production);
  const criteriaByName = new Map(criteriaResults.map(item => [item.criterion, item]));
  const missingCriteria = requiredCriteria.filter(criterion => criteriaByName.get(criterion)?.status !== "passed" || !criteriaByName.get(criterion)?.evidence);
  if (decision === "passed") {
    if (checks.visual !== "passed" || Object.values(checks).includes("failed")) throw new Error("QUALITY_REVIEW_CHECKS_NOT_PASSED");
    if ((production.shots || []).length > 1 && checks.continuity !== "passed") throw new Error("QUALITY_REVIEW_CONTINUITY_REQUIRED");
    if ((production.shots || []).some(shot => shot.subtitle) && checks.subtitles !== "passed") throw new Error("QUALITY_REVIEW_SUBTITLES_REQUIRED");
    const audioShots = (production.shots || []).filter(shot => shot.audio);
    if (audioShots.length && checks.audio !== "passed") throw new Error("QUALITY_REVIEW_AUDIO_REQUIRED");
    const missingAudioEvidence = audioShots.filter(shot => {
      const evidence = output.inputShots?.find(item => item.shotId === shot.id);
      return !evidence?.sourceAudioAsset && evidence?.sourceHasAudio !== true;
    });
    if (missingAudioEvidence.length) throw new Error(`QUALITY_OUTPUT_AUDIO_SOURCE_EVIDENCE_REQUIRED:${missingAudioEvidence.map(shot => shot.id).join(",")}`);
    if (brief.brandName && checks.brandAccuracy !== "passed") throw new Error("QUALITY_REVIEW_BRAND_ACCURACY_REQUIRED");
    if (missingCriteria.length) throw new Error(`QUALITY_ACCEPTANCE_CRITERIA_NOT_PASSED:${missingCriteria.join("|")}`);
  }
  const fileEvidence = await captureFileEvidence(output.localPath);
  const evidencePack = output.reviewEvidence;
  if (!evidencePack?.digest || evidencePack.automatedVisualAcceptance !== false || evidencePack.source?.sha256 !== fileEvidence.sha256 || evidencePack.source?.bytes !== fileEvidence.bytes || !Array.isArray(evidencePack.frames) || !evidencePack.frames.length) {
    throw new Error("QUALITY_REVIEW_EVIDENCE_PACK_REQUIRED");
  }
  const inspectedFrameSha256s = (Array.isArray(input.inspectedFrameSha256s) ? input.inspectedFrameSha256s : []).map(item => String(item || "").trim()).filter(Boolean);
  const expectedFrameSha256s = evidencePack.frames.map(frame => frame.sha256);
  if (inspectedFrameSha256s.length !== expectedFrameSha256s.length || expectedFrameSha256s.some((sha256, index) => inspectedFrameSha256s[index] !== sha256)) {
    throw new Error("QUALITY_REVIEW_ALL_EVIDENCE_FRAMES_MUST_BE_INSPECTED");
  }
  if (decision === "passed") {
    const targetRatio = brief.aspectRatio === "adaptive" ? state.settings.ratio : brief.aspectRatio;
    const expectedDimensions = dimensionsForAspectRatio(targetRatio);
    const actualRatio = fileEvidence.media.video.width / fileEvidence.media.video.height;
    const expectedRatio = expectedDimensions.width / expectedDimensions.height;
    if (!Number.isFinite(actualRatio) || Math.abs(actualRatio - expectedRatio) > 0.015) throw new Error("QUALITY_OUTPUT_ASPECT_RATIO_MISMATCH");
    const plannedDuration = (production.shots || []).reduce((sum, shot) => sum + Number(shot.duration || 0), 0);
    if (plannedDuration > 0 && Math.abs(fileEvidence.media.duration - plannedDuration) > Math.max(0.5, plannedDuration * 0.02)) throw new Error("QUALITY_OUTPUT_DURATION_MISMATCH");
    if (brief.durationSeconds > 0 && Math.abs(fileEvidence.media.duration - brief.durationSeconds) > Math.max(0.5, brief.durationSeconds * 0.02)) throw new Error("QUALITY_OUTPUT_BRIEF_DURATION_MISMATCH");
  }
  return mutateState(next => {
    const targetProject = next.projects.find(item => item.id === projectId);
    const targetOutput = targetProject.outputs.find(item => item.id === outputId);
    if (!targetOutput || targetOutput.stale) throw new Error("OUTPUT_NOT_FOUND_OR_STALE");
    const production = productionUnit(targetProject, creationId || null);
    if (Number(targetOutput.planRevision || 0) !== Number(production.planRevision || 0)) throw new Error("OUTPUT_PLAN_STALE");
    const review = { id: safeId("review"), decision, checks, requiredCriteria, criteriaResults, notes, technical: { playable: true, ...fileEvidence.media }, fileEvidence, evidencePack: { digest: evidencePack.digest, manifestPath: evidencePack.manifestPath, frameCount: evidencePack.frames.length }, inspectedFrameSha256s, inspectedBy: "codex", inspectedAt: new Date().toISOString() };
    targetOutput.reviews ||= [];
    targetOutput.reviews.push(review);
    targetOutput.delivery = null;
    const creation = creationId ? targetProject.creations?.find(item => item.id === creationId) : null;
    if (creation) {
      creation.status = decision === "passed" ? "reviewed" : "changes-required";
      creation.updatedAt = new Date().toISOString();
      updateProjectAggregateStatus(targetProject, "production");
    } else {
      targetProject.currentStage = decision === "passed" ? "delivery" : "revision";
      targetProject.status = decision === "passed" ? "reviewed" : "changes-required";
    }
    appendEvent(next, "output.reviewed", decision === "passed" ? "成片质量复核已通过" : "成片需要修改", { projectId, creationId: creationId || null, outputId, reviewId: review.id });
    return review;
  });
}

export async function finalizeDelivery(projectId, creationId, outputId, notes = "") {
  const state = await readState();
  const project = state.projects.find(item => item.id === projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const output = project.outputs?.find(item => item.id === outputId && (item.creationId || null) === (creationId || null));
  if (!output || output.stale) throw new Error("OUTPUT_NOT_FOUND_OR_STALE");
  const review = output.reviews?.at(-1);
  if (review?.decision !== "passed") throw new Error("QUALITY_REVIEW_REQUIRED");
  if (!review.fileEvidence?.sha256) throw new Error("QUALITY_REVIEW_FILE_EVIDENCE_REQUIRED");
  const production = productionUnit(project, creationId || null);
  if (Number(output.planRevision || 0) !== Number(production.planRevision || 0)) throw new Error("OUTPUT_PLAN_STALE");
  const brief = normalizeProductionBrief(production.brief, production.brief, { objective: production.logline || production.script?.premise || "", aspectRatio: state.settings.ratio });
  assertApprovalBriefComplete(production, brief);
  const fileEvidence = await captureFileEvidence(output.localPath);
  if (fileEvidence.sha256 !== review.fileEvidence.sha256 || fileEvidence.bytes !== review.fileEvidence.bytes) throw new Error("OUTPUT_CHANGED_AFTER_REVIEW");
  return mutateState(next => {
    const targetProject = next.projects.find(item => item.id === projectId);
    const targetOutput = targetProject.outputs.find(item => item.id === outputId);
    if (!targetOutput || targetOutput.stale || targetOutput.reviews?.at(-1)?.decision !== "passed") throw new Error("QUALITY_REVIEW_REQUIRED");
    const targetProduction = productionUnit(targetProject, creationId || null);
    if (Number(targetOutput.planRevision || 0) !== Number(targetProduction.planRevision || 0)) throw new Error("OUTPUT_PLAN_STALE");
    const targetReview = targetOutput.reviews.at(-1);
    if (targetReview.id !== review.id || targetReview.fileEvidence?.sha256 !== fileEvidence.sha256) throw new Error("OUTPUT_CHANGED_AFTER_REVIEW");
    const delivery = { status: "delivered", localOnly: true, localPath: targetOutput.localPath, bytes: fileEvidence.bytes, duration: fileEvidence.media.duration, sha256: fileEvidence.sha256, media: fileEvidence.media, reviewId: targetReview.id, planRevision: Number(targetOutput.planRevision || 0), notes: String(notes || "").trim().slice(0, 3000), deliveredAt: new Date().toISOString() };
    targetOutput.delivery = delivery;
    const creation = creationId ? targetProject.creations?.find(item => item.id === creationId) : null;
    if (creation) {
      creation.status = "completed";
      creation.updatedAt = delivery.deliveredAt;
      updateProjectAggregateStatus(targetProject, "production");
    } else {
      targetProject.currentStage = "final";
      targetProject.status = "completed";
    }
    appendEvent(next, "output.delivered", "本地成片已通过复核并生成交付清单", { projectId, creationId: creationId || null, outputId, sha256: fileEvidence.sha256 });
    return delivery;
  });
}
