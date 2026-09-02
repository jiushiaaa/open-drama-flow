import assert from "node:assert/strict";
import test from "node:test";
import { buildProductionStatus, getProductionHarnessProfile, getSeedanceCapabilityProfile, normalizeProductionBrief, validateSeedanceShots } from "../src/production-harness.mjs";

function fixture(overrides = {}) {
  const plan = {
    logline: "让用户理解产品价值",
    brief: normalizeProductionBrief({ objective: "制作一条 5 秒产品广告", contentType: "电商广告", audience: "通勤人群", platform: "抖音", durationSeconds: 5, deliverables: ["5 秒竖屏 MP4"], acceptanceCriteria: ["产品外观准确"] }),
    selectedSkills: ["minimax-minimalist-product-ad-generator"],
    planRevision: 1,
    script: { premise: "产品特写展示降噪价值", scenes: [] },
    characters: [],
    shots: [{ id: "shot-1", order: 1, duration: 5, scene: "通勤地铁", framing: "特写", action: "拿起耳机", prompt: "无线耳机在冷色科技灯光下旋转展示", generationMode: "seedance", promptVersion: 1 }]
  };
  const creation = { id: "creation-1", title: "广告 A", plan, assetRefs: [] };
  const project = { id: "project-1", title: "耳机广告", assets: [], outputs: [], creations: [creation] };
  return {
    schemaVersion: 4,
    settings: { imageProvider: "codex-imagegen", seedanceModel: "doubao-seedance-2-5-260628", ratio: "9:16", resolution: "720p", generateAudio: false, watermark: false },
    projects: [project], approvals: [], jobs: [], tasks: [], providerCalls: [],
    ...overrides
  };
}

function passedReview({ id = "review-1", sha256 = "a".repeat(64), bytes = 1024 } = {}) {
  const frameSha256 = "f".repeat(64);
  return {
    id,
    decision: "passed",
    checks: { visual: "passed", continuity: "not-applicable", subtitles: "not-applicable", audio: "not-applicable", brandAccuracy: "not-applicable" },
    requiredCriteria: ["产品外观准确"],
    criteriaResults: [{ criterion: "产品外观准确", status: "passed", evidence: "已逐项检查产品外观" }],
    notes: "已实际播放并完成质量检查",
    technical: { playable: true },
    fileEvidence: { sha256, bytes, media: { duration: 5, video: { width: 720, height: 1280 }, audio: { codec: "aac", channels: 2, sampleRate: 48000 } } },
    evidencePack: { digest: "e".repeat(64), frameCount: 1, manifestPath: "C:\\outputs\\review-evidence.json" },
    inspectedFrameSha256s: [frameSha256],
    inspectedBy: "codex",
    inspectedAt: "2026-01-01T00:01:00.000Z"
  };
}

function preparedEvidence(sha256 = "a".repeat(64), bytes = 1024) {
  return { automatedVisualAcceptance: false, digest: "e".repeat(64), source: { sha256, bytes }, frames: [{ sha256: "f".repeat(64) }] };
}

function trustedApproval(overrides = {}) {
  return {
    scopeDigest: "d".repeat(64),
    authorization: { method: "mcp-elicitation", action: "accept", recordedAt: "2026-01-01T00:00:00.000Z" },
    ...overrides
  };
}

function addDeliveredOutput(state, { sha256 = "a".repeat(64), bytes = 1024 } = {}) {
  const project = state.projects[0];
  project.creations[0].plan.shots[0].clipPath = "C:\\clips\\shot-1.mp4";
  project.outputs.push({
    id: "output-delivered",
    creationId: "creation-1",
    planRevision: 1,
    localPath: "C:\\outputs\\final.mp4",
    reviewEvidence: preparedEvidence(sha256, bytes),
    reviews: [passedReview({ sha256, bytes })],
    delivery: {
      status: "delivered",
      localOnly: true,
      localPath: "C:\\outputs\\final.mp4",
      sha256,
      bytes,
      duration: 5,
      media: { duration: 5, video: { width: 720, height: 1280 }, audio: { codec: "aac", channels: 2, sampleRate: 48000 } },
      reviewId: "review-1",
      planRevision: 1,
      deliveredAt: "2026-01-01T00:02:00.000Z"
    },
    createdAt: "2026-01-01T00:00:00.000Z"
  });
}

test("normalizes a general commercial-video brief without drama-only fields", () => {
  const brief = normalizeProductionBrief({ objective: "发布 SaaS 新功能", contentType: "产品宣传片", audience: "运营团队", sellingPoints: ["批量处理", "可追溯"], callToAction: "申请试用", deliverables: ["16:9 MP4"] });
  assert.equal(brief.objective, "发布 SaaS 新功能");
  assert.deepEqual(brief.sellingPoints, ["批量处理", "可追溯"]);
  assert.equal(brief.callToAction, "申请试用");
  assert.deepEqual(brief.deliverables, ["16:9 MP4"]);
  assert.equal("characters" in brief, false);
});

test("publishes the exact implemented Seedance adapter boundary", () => {
  const profile = getSeedanceCapabilityProfile(fixture().settings);
  assert.equal(profile.maxReferenceImages, 1);
  assert.deepEqual(profile.supportedRatios, ["9:16"]);
  assert.deepEqual(profile.duration, { integerSeconds: true, minimum: 4, maximum: 15 });
  assert.equal(profile.unsupportedByAdapter.includes("multiple reference inputs"), true);
});

test("publishes the single reviewed local MP4 delivery boundary", () => {
  const profile = getProductionHarnessProfile();
  assert.deepEqual(profile.delivery, {
    format: "video/mp4",
    location: "local",
    maximumFilesPerCreation: 1,
    qualityReviewRequired: true
  });
});

test("blocks an overlong Seedance shot and reports local trim for a short shot", () => {
  const check = validateSeedanceShots([
    { id: "short", duration: 2.5, prompt: "短镜头" },
    { id: "long", duration: 20, prompt: "长镜头" },
    { id: "static", duration: 30, prompt: "静态镜头", generationMode: "static-motion" }
  ], fixture().settings);
  assert.equal(check.compatible, false);
  assert.equal(check.errors.some(item => item.shotId === "long" && item.code === "SEEDANCE_DURATION_EXCEEDS_ADAPTER"), true);
  assert.equal(check.warnings.some(item => item.shotId === "short" && item.code === "SEEDANCE_DURATION_WILL_BE_TRIMMED"), true);
  assert.equal(check.errors.some(item => item.shotId === "static"), false);

  const references = validateSeedanceShots([{ id: "refs", duration: 5, prompt: "多参考图", referenceAssetIds: ["image-1", "image-2"] }], fixture().settings);
  assert.equal(references.errors.some(item => item.code === "SEEDANCE_REFERENCE_LIMIT_EXCEEDED"), true);
});

test("derives a deterministic approval action from durable state", () => {
  const state = fixture();
  let guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.nextActions[0].tool, "drama_request_paid_batch");
  assert.equal(guidance.graph.complete, false);

  state.approvals.push({ id: "approval-1", projectId: "project-1", creationId: "creation-1", status: "pending", maxImageCalls: 1, maxVideoCalls: 1, usedImageCalls: 0, usedVideoCalls: 0, scopeSnapshot: { planRevision: 1 }, scopeDigest: "d".repeat(64), createdAt: "2026-01-01T00:00:00.000Z" });
  guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.nextActions[0].tool, "drama_authorize_and_start_paid_batch");
  assert.equal(guidance.nextActions[0].authority, "user-explicit-approval");
});

test("prioritizes queued and claimed Codex image work before provider resume", () => {
  const state = fixture({
    approvals: [trustedApproval({ id: "approval-1", projectId: "project-1", creationId: "creation-1", status: "approved", jobId: "job-1", scopeSnapshot: { planRevision: 1 }, createdAt: "2026-01-01T00:00:00.000Z" })],
    jobs: [{ id: "job-1", approvalId: "approval-1", projectId: "project-1", creationId: "creation-1", planRevision: 1, type: "real-pipeline", status: "waiting", stage: "codex-images", createdAt: "2026-01-01T00:00:00.000Z" }],
    tasks: [{ id: "task-1", approvalId: "approval-1", projectId: "project-1", creationId: "creation-1", planRevision: 1, promptVersion: 1, shotId: "shot-1", kind: "codex-imagegen", status: "queued", createdAt: "2026-01-01T00:00:00.000Z" }]
  });
  let guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.nextActions[0].tool, "drama_claim_image_task");
  state.tasks[0].status = "claimed";
  guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.nextActions[0].tool, "drama_complete_image_task");
});

test("render, review and delivery are separate evidence gates", () => {
  const state = fixture();
  const project = state.projects[0];
  const shot = project.creations[0].plan.shots[0];
  shot.clipPath = "C:\\clips\\shot-1.mp4";
  let guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.nextActions[0].tool, "drama_render_project");

  project.outputs.push({ id: "output-1", creationId: "creation-1", planRevision: 1, localPath: "C:\\outputs\\final.mp4", reviews: [], delivery: null, createdAt: "2026-01-01T00:00:00.000Z" });
  guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.nextActions[0].tool, "drama_prepare_quality_evidence");

  const sha256 = "a".repeat(64);
  project.outputs[0].reviewEvidence = preparedEvidence(sha256);
  guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.nextActions[0].tool, "drama_record_quality_review");

  project.outputs[0].reviews.push(passedReview({ sha256 }));
  guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.nextActions[0].tool, "drama_finalize_delivery");

  project.outputs[0].delivery = {
    status: "delivered",
    localOnly: true,
    localPath: project.outputs[0].localPath,
    sha256,
    bytes: 1024,
    duration: 5,
    media: { duration: 5, video: { width: 720, height: 1280 } },
    reviewId: "review-1",
    planRevision: 1,
    deliveredAt: "2026-01-01T00:02:00.000Z"
  };
  guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.nextActions.length, 0);
  assert.equal(guidance.graph.complete, true);
});

test("an independent creation without a plan never inherits the project plan", () => {
  const state = fixture();
  const project = state.projects[0];
  project.brief = normalizeProductionBrief({
    objective: "父项目目标",
    contentType: "父项目类型",
    audience: "父项目受众",
    platform: "父项目平台",
    durationSeconds: 5,
    deliverables: ["父项目交付"],
    acceptanceCriteria: ["父项目标准"]
  });
  project.selectedSkills = ["parent-skill"];
  project.shots = [{ id: "parent-shot", duration: 5, prompt: "父项目镜头", generationMode: "static-motion" }];
  project.creations[0].plan = null;

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.brief.objective, "");
  assert.deepEqual(guidance.selectedSkills, []);
  assert.equal(guidance.summary.shots, 0);
  assert.equal(guidance.nextActions[0].tool, "drama_update_plan");
});

test("a legacy main creation still reads project-scoped production evidence", () => {
  const state = fixture();
  const project = state.projects[0];
  const independentPlan = project.creations[0].plan;
  Object.assign(project, independentPlan);
  project.creations[0] = { id: "creation-legacy", title: "旧版主创作页", planSource: "project-legacy", assetRefs: [] };
  project.shots[0].generationMode = "static-motion";
  project.assets.push({ id: "legacy-image", creationId: null, shotId: "shot-1", kind: "image", stale: false });

  const guidance = buildProductionStatus(state, "project-1", "creation-legacy");
  assert.equal(guidance.brief.objective, "制作一条 5 秒产品广告");
  assert.deepEqual(guidance.summary.missingImages, []);
  assert.equal(guidance.nextActions[0].tool, "drama_render_project");
  assert.deepEqual(guidance.nextActions[0].input, { projectId: "project-1", creationId: null });
});

test("the brief gate requires production fields and valid source assets", () => {
  const state = fixture();
  const plan = state.projects[0].creations[0].plan;
  plan.brief.contentType = "";
  plan.brief.sourceAssetIds = ["missing-source", "stale-source"];
  state.projects[0].assets.push({ id: "stale-source", kind: "document", stale: true });

  let guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.deepEqual(guidance.summary.missingBriefFields, ["contentType"]);
  assert.deepEqual(guidance.summary.missingSourceAssetIds, ["missing-source"]);
  assert.deepEqual(guidance.summary.staleSourceAssetIds, ["stale-source"]);
  assert.equal(guidance.graph.nodes.find(node => node.id === "brief").status, "blocked");
  assert.equal(guidance.nextActions[0].tool, "drama_update_plan");

  plan.brief.contentType = "电商广告";
  plan.brief.sourceAssetIds = ["current-source"];
  state.projects[0].assets.push({ id: "current-source", kind: "document", stale: false });
  guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.deepEqual(guidance.summary.missingBriefFields, []);
  assert.deepEqual(guidance.summary.missingSourceAssetIds, []);
  assert.equal(guidance.graph.nodes.find(node => node.id === "brief").status, "completed");
});

test("a shot can use an explicitly referenced image without a matching shotId", () => {
  const state = fixture();
  const shot = state.projects[0].creations[0].plan.shots[0];
  shot.generationMode = "static-motion";
  shot.referenceAssetIds = ["reference-image"];
  state.projects[0].assets.push({ id: "reference-image", creationId: null, kind: "image", stale: false });

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.deepEqual(guidance.summary.missingImages, []);
  assert.equal(guidance.nextActions[0].tool, "drama_render_project");
});

test("all explicit references are checked for existence, freshness, kind and pinned version", () => {
  const state = fixture();
  const project = state.projects[0];
  const creation = project.creations[0];
  const plan = creation.plan;
  creation.assetRefs = [{ assetId: "versioned", version: 1, locked: true }];
  plan.characters = [{ id: "lead", name: "主角", visual: "短发", referenceAssetIds: ["stale-character"] }];
  plan.shots[0].referenceAssetIds = ["wrong-kind"];
  project.assets.push(
    { id: "versioned", version: 2, kind: "document", stale: false },
    { id: "stale-character", version: 1, kind: "image", stale: true },
    { id: "wrong-kind", version: 1, kind: "document", stale: false }
  );

  let guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.deepEqual(guidance.summary.staleReferenceAssetIds, ["stale-character"]);
  assert.deepEqual(guidance.summary.invalidReferenceKinds.map(issue => issue.assetId), ["wrong-kind"]);
  assert.deepEqual(guidance.summary.mismatchedReferenceVersions.map(issue => issue.assetId), ["versioned"]);
  assert.equal(guidance.graph.nodes.find(node => node.id === "references").status, "blocked");
  assert.equal(guidance.nextActions[0].tool, "drama_update_plan");

  creation.assetRefs[0].version = 2;
  project.assets.find(asset => asset.id === "stale-character").stale = false;
  project.assets.find(asset => asset.id === "wrong-kind").kind = "image";
  guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.deepEqual(guidance.summary.referenceIssues, []);
  assert.equal(guidance.graph.nodes.find(node => node.id === "references").status, "completed");
});

test("missing shot and character references cannot fall through to paid generation", () => {
  const state = fixture();
  const plan = state.projects[0].creations[0].plan;
  plan.characters = [{ id: "lead", name: "主角", visual: "短发", referenceAssetIds: ["missing-character"] }];
  plan.shots[0].referenceAssetIds = ["missing-shot"];

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.deepEqual(guidance.summary.missingReferenceAssetIds, ["missing-character", "missing-shot"]);
  assert.equal(guidance.nextActions[0].tool, "drama_update_plan");
  assert.match(guidance.nextActions[0].reason, /ASSET_REFERENCE_NOT_FOUND/);
});

test("multiple deliverables are split before production because one creation delivers one MP4", () => {
  const state = fixture();
  state.projects[0].creations[0].plan.brief.deliverables = ["9:16 主片 MP4", "16:9 横版 MP4"];

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.deliveryBoundary.exceeded, true);
  assert.deepEqual(guidance.deliveryBoundary.excessDeliverables, ["16:9 横版 MP4"]);
  assert.equal(guidance.graph.nodes.find(node => node.id === "delivery-scope").status, "blocked");
  assert.equal(guidance.nextActions[0].tool, "drama_update_plan");
  assert.equal(guidance.nextActions[0].authority, "user-choice");
  assert.deepEqual(guidance.nextActions[0].input.brief.deliverables, ["9:16 主片 MP4"]);
});

test("uploaded-video without a bound clip remains blocked instead of rendering", () => {
  const state = fixture();
  const shot = state.projects[0].creations[0].plan.shots[0];
  shot.generationMode = "uploaded-video";

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.deepEqual(guidance.summary.missingUploadedVideos, ["shot-1"]);
  assert.deepEqual(guidance.summary.missingVideos, ["shot-1"]);
  assert.equal(guidance.nextActions[0].tool, "drama_update_plan");
  assert.match(guidance.nextActions[0].reason, /uploaded-video/);
  assert.equal(guidance.graph.nodes.find(node => node.id === "videos").status, "blocked");

  shot.sourceVideoAssetId = "video-1";
  state.projects[0].assets.push({ id: "video-1", kind: "video", stale: false, localPath: "C:\\inputs\\video-1.mp4", sha256: "1".repeat(64), size: 1024 });
  const bound = buildProductionStatus(state, "project-1", "creation-1");
  assert.deepEqual(bound.summary.missingUploadedVideos, []);
  assert.equal(bound.nextActions[0].tool, "drama_render_project");
});

test("the shot duration sum must match the promised brief duration", () => {
  const state = fixture();
  state.projects[0].creations[0].plan.brief.durationSeconds = 15;

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.summary.plannedDurationSeconds, 5);
  assert.equal(guidance.summary.durationMismatch, true);
  assert.equal(guidance.graph.nodes.find(node => node.id === "storyboard").status, "blocked");
  assert.equal(guidance.nextActions[0].tool, "drama_update_plan");
  assert.match(guidance.nextActions[0].reason, /合计 5s/);
});

test("invalid static-shot duration cannot bypass the storyboard gate", () => {
  const state = fixture();
  const shot = state.projects[0].creations[0].plan.shots[0];
  shot.generationMode = "static-motion";
  shot.duration = "not-a-number";
  state.projects[0].assets.push({ id: "image-1", creationId: "creation-1", shotId: "shot-1", kind: "image", stale: false });

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.deepEqual(guidance.summary.invalidShotDurations, ["shot-1"]);
  assert.equal(guidance.graph.nodes.find(node => node.id === "storyboard").status, "blocked");
  assert.equal(guidance.nextActions[0].tool, "drama_update_plan");
});

test("skill routing action includes an executable request", () => {
  const state = fixture();
  state.projects[0].creations[0].plan.selectedSkills = [];
  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.nextActions[0].tool, "drama_route_skills");
  assert.equal(guidance.nextActions[0].input.request, "制作一条 5 秒产品广告");
});

test("audio intent requires a real source or supported generation evidence", () => {
  const state = fixture();
  const project = state.projects[0];
  const shot = project.creations[0].plan.shots[0];
  shot.generationMode = "static-motion";
  shot.audio = "轻柔旁白与环境声";
  project.assets.push({ id: "image-1", creationId: "creation-1", shotId: "shot-1", kind: "image", stale: false });

  let guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.deepEqual(guidance.summary.missingAudio, ["shot-1"]);
  assert.equal(guidance.graph.nodes.find(node => node.id === "audio").status, "blocked");
  assert.equal(guidance.nextActions[0].tool, "drama_update_plan");

  shot.sourceAudioAssetId = "audio-1";
  project.assets.push({ id: "audio-1", kind: "audio", stale: false, localPath: "C:\\inputs\\audio-1.wav", sha256: "2".repeat(64), size: 1024 });
  guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.deepEqual(guidance.summary.missingAudio, []);
  assert.equal(guidance.nextActions[0].tool, "drama_render_project");

  delete shot.sourceAudioAssetId;
  shot.generationMode = "uploaded-video";
  shot.sourceVideoAssetId = "video-with-audio";
  project.assets.push({ id: "video-with-audio", kind: "video", stale: false, localPath: "C:\\inputs\\video-with-audio.mp4", sha256: "3".repeat(64), size: 1024, media: { audio: { codec: "aac", channels: 2 } } });
  guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.deepEqual(guidance.summary.missingAudio, ["shot-1"], "an audio stream alone does not prove audible content");
  project.assets.at(-1).inspection = { audio: "passed" };
  guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.deepEqual(guidance.summary.missingAudio, []);
  assert.deepEqual(guidance.summary.missingUploadedVideos, []);
  assert.equal(guidance.nextActions[0].tool, "drama_render_project");
});

test("audio review requires per-shot source evidence, not only an AAC stream in the final file", () => {
  const state = fixture();
  const project = state.projects[0];
  const shot = project.creations[0].plan.shots[0];
  shot.audio = "旁白";
  shot.clipPath = "C:\\clips\\shot-1.mp4";
  shot.media = { audio: { codec: "aac", channels: 2 } };
  shot.inspection = { audio: "passed" };
  const sha256 = "e".repeat(64);
  const review = passedReview({ sha256 });
  review.checks.audio = "passed";
  project.outputs.push({
    id: "output-audio",
    creationId: "creation-1",
    planRevision: 1,
    localPath: "C:\\outputs\\audio.mp4",
    reviewEvidence: preparedEvidence(sha256),
    inputShots: [{ shotId: "shot-1", sourceHasAudio: false, sourceAudioAsset: null }],
    reviews: [review],
    delivery: null
  });

  let guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.graph.nodes.find(node => node.id === "review").status, "waiting");
  assert.equal(guidance.nextActions[0].tool, "drama_record_quality_review");

  project.outputs[0].inputShots[0].sourceHasAudio = true;
  guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.graph.nodes.find(node => node.id === "review").status, "completed");
  assert.equal(guidance.nextActions[0].tool, "drama_finalize_delivery");
});

test("changes-required returns to plan revision instead of reviewing the same output", () => {
  const state = fixture();
  const project = state.projects[0];
  project.creations[0].plan.shots[0].clipPath = "C:\\clips\\shot-1.mp4";
  project.outputs.push({
    id: "output-1",
    creationId: "creation-1",
    planRevision: 1,
    localPath: "C:\\outputs\\final.mp4",
    reviews: [{ decision: "changes-required", notes: "产品标识变形" }],
    delivery: null,
    createdAt: "2026-01-01T00:00:00.000Z"
  });

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.nextActions[0].tool, "drama_update_plan");
  assert.match(guidance.nextActions[0].reason, /产品标识变形/);
});

test("terminal and recoverable job states always expose one safe next action", () => {
  const cases = [
    { approvalStatus: "stale", job: null, expected: "drama_request_paid_batch" },
    { approvalStatus: "approved", job: { status: "failed", stage: "failed" }, expected: "drama_request_paid_batch" },
    { approvalStatus: "approved", job: { status: "superseded", stage: "superseded" }, expected: "drama_request_paid_batch" },
    { approvalStatus: "approved", job: { status: "queued", stage: "queued" }, expected: "drama_resume_paid_batch" },
    { approvalStatus: "approved", job: { status: "cancelled", stage: "cancelled" }, expected: "drama_request_paid_batch" },
    { approvalStatus: "approved", job: { status: "running", stage: "videos", leaseExpiresAt: "2026-01-01T00:00:00.000Z" }, expected: "drama_resume_paid_batch" },
    { approvalStatus: "approved", job: { status: "running", stage: "videos", leaseExpiresAt: "2026-01-03T00:00:00.000Z" }, expected: "wait" },
    { approvalStatus: "approved", job: { status: "waiting", stage: "provider-status-check" }, providerTaskId: "provider-1", expected: "drama_resume_paid_batch" },
    { approvalStatus: "approved", job: { status: "waiting", stage: "provider-status-check" }, expected: "wait" }
  ];

  for (const [index, item] of cases.entries()) {
    const state = fixture();
    state.projects[0].assets.push({ id: `image-${index}`, creationId: "creation-1", shotId: "shot-1", kind: "image", stale: false });
    const jobId = item.job ? `job-${index}` : null;
    state.approvals.push(trustedApproval({ id: `approval-${index}`, projectId: "project-1", creationId: "creation-1", status: item.approvalStatus, jobId, scopeSnapshot: { planRevision: 1 }, createdAt: "2026-01-01T00:00:00.000Z" }));
    if (item.job) state.jobs.push({ id: jobId, approvalId: `approval-${index}`, projectId: "project-1", creationId: "creation-1", planRevision: 1, type: "real-pipeline", createdAt: "2026-01-01T00:00:00.000Z", ...item.job });
    if (item.providerTaskId) state.providerCalls.push({ id: `call-${index}`, jobId, projectId: "project-1", creationId: "creation-1", planRevision: 1, status: "submitted", providerTaskId: item.providerTaskId });
    const guidance = buildProductionStatus(state, "project-1", "creation-1", { now: "2026-01-02T00:00:00.000Z" });
    assert.equal(guidance.graph.complete, false);
    assert.equal(guidance.nextActions.length, 1);
    assert.equal(guidance.nextActions[0].tool, item.expected, `case ${index}`);
  }
});

test("provider recovery never trusts an older task id when the uncertain call has none", () => {
  const state = fixture();
  state.projects[0].assets.push({ id: "image-1", creationId: "creation-1", shotId: "shot-1", kind: "image", stale: false });
  state.approvals.push(trustedApproval({ id: "approval-1", projectId: "project-1", creationId: "creation-1", status: "approved", jobId: "job-1", scopeSnapshot: { planRevision: 1 }, createdAt: "2026-01-01T00:00:00.000Z" }));
  state.jobs.push({ id: "job-1", approvalId: "approval-1", projectId: "project-1", creationId: "creation-1", planRevision: 1, type: "real-pipeline", status: "waiting", stage: "provider-status-check", createdAt: "2026-01-01T00:00:00.000Z" });
  state.providerCalls.push(
    { id: "old-call", jobId: "job-1", projectId: "project-1", creationId: "creation-1", planRevision: 1, kind: "seedance-video", status: "submitted", providerTaskId: "old-task" },
    { id: "uncertain-call", jobId: "job-1", projectId: "project-1", creationId: "creation-1", planRevision: 1, kind: "seedance-video", status: "uncertain", providerTaskId: null }
  );

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.nextActions[0].tool, "wait");
  assert.equal(guidance.nextActions[0].authority, "user-provider-reconciliation");
});

test("an approved job without trusted user authorization is never resumed", () => {
  const state = fixture();
  state.projects[0].assets.push({ id: "image-1", creationId: "creation-1", shotId: "shot-1", kind: "image", stale: false });
  state.approvals.push({ id: "approval-1", projectId: "project-1", creationId: "creation-1", status: "approved", jobId: "job-1", scopeSnapshot: { planRevision: 1 }, scopeDigest: "d".repeat(64), authorization: null, createdAt: "2026-01-01T00:00:00.000Z" });
  state.jobs.push({ id: "job-1", approvalId: "approval-1", projectId: "project-1", creationId: "creation-1", planRevision: 1, type: "real-pipeline", status: "running", stage: "videos", leaseExpiresAt: "2099-01-01T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z" });

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.graph.nodes.find(node => node.id === "approval").status, "blocked");
  assert.equal(guidance.nextActions[0].tool, "drama_request_paid_batch");
});

test("an approval can only trust a bidirectionally bound real-pipeline job", () => {
  const state = fixture();
  state.approvals.push(trustedApproval({ id: "approval-1", projectId: "project-1", creationId: "creation-1", status: "approved", jobId: "job-1", scopeSnapshot: { planRevision: 1 } }));
  state.jobs.push({ id: "job-1", approvalId: "approval-1", projectId: "project-1", creationId: "creation-1", planRevision: 1, type: "local-render", status: "running", stage: "render" });

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.activeJob, null);
  assert.equal(guidance.graph.nodes.find(node => node.id === "approval").status, "blocked");
  assert.equal(guidance.nextActions[0].tool, "drama_request_paid_batch");
});

test("a failed image task resumes the original capped job", () => {
  const state = fixture();
  state.approvals.push(trustedApproval({ id: "approval-1", projectId: "project-1", creationId: "creation-1", status: "approved", jobId: "job-1", scopeSnapshot: { planRevision: 1 }, createdAt: "2026-01-01T00:00:00.000Z" }));
  state.jobs.push({ id: "job-1", approvalId: "approval-1", projectId: "project-1", creationId: "creation-1", planRevision: 1, type: "real-pipeline", status: "waiting", stage: "codex-images", createdAt: "2026-01-01T00:00:00.000Z" });
  state.tasks.push({ id: "task-failed", approvalId: "approval-1", projectId: "project-1", creationId: "creation-1", planRevision: 1, promptVersion: 1, shotId: "shot-1", kind: "codex-imagegen", status: "failed", createdAt: "2026-01-01T00:00:00.000Z" });

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.summary.failedImageTasks, 1);
  assert.equal(guidance.nextActions.length, 1);
  assert.equal(guidance.nextActions[0].tool, "drama_resume_paid_batch");
});

test("a delivery status without bound manifest evidence is never complete", () => {
  const state = fixture();
  const project = state.projects[0];
  project.creations[0].plan.shots[0].clipPath = "C:\\clips\\shot-1.mp4";
  const sha256 = "b".repeat(64);
  project.outputs.push({
    id: "output-1",
    creationId: "creation-1",
    planRevision: 1,
    localPath: "Z:\\missing\\final.mp4",
    reviewEvidence: preparedEvidence(sha256, 2048),
    reviews: [passedReview({ sha256, bytes: 2048 })],
    delivery: { status: "delivered", deliveredAt: "2026-01-01T00:02:00.000Z" },
    createdAt: "2026-01-01T00:00:00.000Z"
  });

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.graph.complete, false);
  assert.equal(guidance.graph.nodes.find(node => node.id === "delivery").status, "blocked");
  assert.equal(guidance.nextActions[0].tool, "drama_finalize_delivery");
});

test("incomplete review fields cannot be promoted to a complete delivery", () => {
  const state = fixture();
  const project = state.projects[0];
  project.creations[0].plan.shots[0].clipPath = "C:\\clips\\shot-1.mp4";
  const sha256 = "c".repeat(64);
  project.outputs.push({
    id: "output-forged",
    creationId: "creation-1",
    planRevision: 1,
    localPath: "C:\\outputs\\forged.mp4",
    reviewEvidence: preparedEvidence(sha256),
    reviews: [{ id: "review-forged", decision: "passed", checks: { visual: "failed" }, technical: { playable: true }, fileEvidence: { sha256, bytes: 1024, media: { duration: 5, video: { width: 720, height: 1280 } } } }],
    delivery: { status: "delivered", localOnly: true, localPath: "C:\\outputs\\forged.mp4", sha256, bytes: 1024, duration: 5, media: { duration: 5, video: { width: 720, height: 1280 } }, reviewId: "review-forged", planRevision: 1, deliveredAt: "2026-01-01T00:02:00.000Z" }
  });

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.graph.complete, false);
  assert.equal(guidance.nextActions[0].tool, "drama_record_quality_review");
});

test("redundant queued image work cannot coexist with a completed graph", () => {
  const state = fixture();
  addDeliveredOutput(state);
  state.tasks.push({ id: "redundant-task", projectId: "project-1", creationId: "creation-1", planRevision: 1, promptVersion: 1, shotId: "shot-1", kind: "codex-imagegen", status: "queued" });

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.summary.queuedImageTasks, 0);
  assert.equal(guidance.nextActions.length, 0);
  assert.equal(guidance.graph.complete, true);
});

test("a trusted active image task prevents complete even after its media appeared", () => {
  const state = fixture();
  addDeliveredOutput(state);
  state.approvals.push(trustedApproval({ id: "approval-1", projectId: "project-1", creationId: "creation-1", status: "approved", jobId: "job-1", scopeSnapshot: { planRevision: 1 } }));
  state.jobs.push({ id: "job-1", approvalId: "approval-1", projectId: "project-1", creationId: "creation-1", planRevision: 1, type: "real-pipeline", status: "succeeded", stage: "done" });
  state.tasks.push({ id: "active-task", approvalId: "approval-1", projectId: "project-1", creationId: "creation-1", planRevision: 1, promptVersion: 1, shotId: "shot-1", kind: "codex-imagegen", status: "queued" });

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.summary.activeImageTasks, 1);
  assert.equal(guidance.graph.complete, false);
  assert.equal(guidance.nextActions[0].tool, "drama_get_state");
});

test("a non-MP4 output is rendered again before review or delivery", () => {
  const state = fixture();
  const project = state.projects[0];
  project.creations[0].plan.shots[0].clipPath = "C:\\clips\\shot-1.mp4";
  project.outputs.push({ id: "output-webm", creationId: "creation-1", planRevision: 1, localPath: "C:\\outputs\\draft.webm", reviews: [passedReview()], delivery: null });

  const guidance = buildProductionStatus(state, "project-1", "creation-1");
  assert.equal(guidance.graph.nodes.find(node => node.id === "edit").status, "blocked");
  assert.equal(guidance.nextActions[0].tool, "drama_render_project");
});
