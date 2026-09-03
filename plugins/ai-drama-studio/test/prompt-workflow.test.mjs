import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ai-drama-prompt-workflow-"));
process.env.AI_DRAMA_DATA_DIR = tempRoot;

const { readState } = await import("../src/store.mjs");
const { PROMPT_COMPILER_VERSION, promptDigest } = await import("../src/prompt-compiler.mjs");
const {
  authorizeAndStartPipeline,
  createApproval,
  createCreation,
  createProject,
  updateProjectPlan
} = await import("../src/workflow.mjs");

after(async () => {
  await fs.rm(tempRoot, { recursive: true, force: true });
});

function completeV2Shot(suffix, generationMode = "seedance") {
  return {
    id: `shot-${suffix}`,
    duration: 5,
    scene: "雨夜废弃车站",
    framing: "中近景",
    prompt: `LEGACY_PROMPT_MUST_NOT_DRIVE_REQUEST_${suffix}`,
    promptContractVersion: 2,
    sceneId: `scene-${suffix}`,
    purpose: "建立悬疑并让观众看清角色手中的旧相机",
    subjectIds: [`character-${suffix}`],
    startState: "角色低头站在积水月台，旧相机垂在右手",
    endState: "角色抬起旧相机并看向镜头外的列车灯光",
    camera: {
      shotSize: "中近景",
      angle: "平视",
      movement: "缓慢推进",
      speed: "慢速",
      relation: "始终保持角色与相机同时清晰"
    },
    motion: {
      subject: "角色先抬眼，再平稳抬起旧相机",
      environment: "雨丝斜落，远处列车灯光扫过积水",
      timing: ["0-2 秒抬眼", "2-5 秒抬起相机"]
    },
    style: "电影感二维动漫，冷蓝雨夜与暖色车灯对比",
    transition: "末帧停留半秒",
    soundPlan: {
      dialogue: "未来在等我。",
      ambience: "持续雨声与远处列车低鸣",
      soundEffects: "相机金属环轻响",
      music: "低频悬疑铺底",
      notes: "对白在第 3 秒进入"
    },
    audioMode: "post",
    continuityFromShotId: null,
    continuityConstraints: ["角色黑色短发和红色发卡不变", "旧相机外观不变"],
    negativeConstraints: ["不要新增人物", "不要出现文字或水印"],
    qualityRisks: ["手指结构", "相机外观漂移"],
    imagePrompt: `FROZEN_IMAGE_PROMPT_${suffix}：雨夜月台上的角色与旧相机定帧`,
    videoPrompt: `FROZEN_VIDEO_PROMPT_${suffix}：角色抬眼并举起相机，镜头缓慢推进`,
    videoInputMode: "image-to-video",
    action: "抬眼并举起旧相机",
    subtitle: "未来在等我。",
    audio: "后期加入雨声、对白和相机金属音效",
    generationMode,
    referenceAssetIds: [],
    sourceVideoAssetId: null,
    sourceAudioAssetId: null,
    acceptanceCriteria: ["角色与旧相机外观稳定", "运镜只有一次缓慢推进"]
  };
}

function completePlan(creationId, suffix, generationMode = "seedance") {
  return {
    creationId,
    logline: "雨夜里的旧相机预告了五秒后的未来",
    premise: "角色在废弃车站发现能显示未来的相机",
    brief: {
      objective: "制作一条可交付的五秒悬疑短片",
      contentType: "二维动漫短片",
      audience: "悬疑动漫观众",
      platform: "抖音",
      durationSeconds: 5,
      aspectRatio: "9:16",
      deliverables: ["5 秒竖屏 MP4"],
      acceptanceCriteria: ["角色与旧相机外观稳定", "运镜只有一次缓慢推进"]
    },
    selectedSkills: ["character-scene-storyboard"],
    scenes: [{ id: `scene-${suffix}`, heading: "雨夜废弃车站", summary: "角色在月台发现未来相机" }],
    characters: [{ id: `character-${suffix}`, name: "林夏", role: "主角", visual: "黑色短发、红色发卡、深色雨衣", referenceAssetIds: [] }],
    shots: [completeV2Shot(suffix, generationMode)]
  };
}

async function prepareCreation(suffix, generationMode = "seedance") {
  const project = await createProject({ title: `提示词工作流-${suffix}` });
  const creation = await createCreation(project.id, { title: `创作页-${suffix}` });
  const plan = completePlan(creation.id, suffix, generationMode);
  await updateProjectPlan(project.id, plan);
  return { project, creation, plan };
}

async function persistedShot(projectId, creationId) {
  const state = await readState();
  return state.projects
    .find(item => item.id === projectId)
    .creations.find(item => item.id === creationId)
    .plan.shots[0];
}

async function waitForQueuedImageTask(jobId, approvalId, timeoutMs = 3_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await readState();
    const job = state.jobs.find(item => item.id === jobId);
    const task = state.tasks.find(item => item.approvalId === approvalId && item.kind === "codex-imagegen");
    if (task && job?.status === "waiting") return { task, job };
    if (job?.status === "failed") assert.fail(`Codex Image Gen task was not queued: ${job.errorCode || job.error}`);
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  assert.fail("Timed out waiting for the Codex Image Gen task");
}

test("updateProjectPlan persists every v2 shot contract field without loss", async () => {
  const { project, creation, plan } = await prepareCreation("persist");
  const actual = await persistedShot(project.id, creation.id);
  const expected = plan.shots[0];
  const contractFields = [
    "promptContractVersion", "sceneId", "purpose", "subjectIds", "startState", "endState",
    "camera", "motion", "style", "transition", "soundPlan", "audioMode", "continuityFromShotId",
    "continuityConstraints", "negativeConstraints", "qualityRisks", "imagePrompt", "videoPrompt",
    "videoInputMode", "generationMode", "referenceAssetIds", "sourceVideoAssetId", "sourceAudioAssetId",
    "acceptanceCriteria"
  ];

  for (const field of contractFields) assert.deepEqual(actual[field], expected[field], field);
  assert.equal(actual.prompt, expected.prompt);
  assert.equal(actual.promptVersion, 1);
});

test("createApproval freezes compiler version, image/video requests and their digests", async () => {
  const { project, creation } = await prepareCreation("freeze");
  const approval = await createApproval(project.id, { creationId: creation.id, maxImageCalls: 1, maxVideoCalls: 1 });
  const frozen = approval.scopeSnapshot.shots[0].promptCompilation;

  assert.equal(frozen.compilerVersion, PROMPT_COMPILER_VERSION);
  assert.equal(frozen.contractVersion, 2);
  assert.equal(frozen.requests.image.kind, "codex-imagegen");
  assert.equal(frozen.requests.video.kind, "seedance-video");
  assert.equal(frozen.requestDigests.image, promptDigest(frozen.requests.image));
  assert.equal(frozen.requestDigests.video, promptDigest(frozen.requests.video));
  assert.match(frozen.requestDigests.image, /^[a-f0-9]{64}$/);
  assert.match(frozen.requestDigests.video, /^[a-f0-9]{64}$/);
  assert.match(frozen.digest, /^[a-f0-9]{64}$/);
  assert.equal(frozen.requests.video.inputs[0].upstreamRequestDigest, frozen.requestDigests.image);
});

test("camera, motion, image/video prompts, sound plan and negative constraints stale prior approvals", async t => {
  const mutations = {
    camera: shot => { shot.camera.movement = "快速横移"; },
    motion: shot => { shot.motion.subject = "角色突然转身并举起相机"; },
    imagePrompt: shot => { shot.imagePrompt += "，增加地面积水倒影"; },
    videoPrompt: shot => { shot.videoPrompt += "，末尾快速停住"; },
    soundPlan: shot => { shot.soundPlan.notes = "对白改为第 2 秒进入"; },
    negativeConstraints: shot => { shot.negativeConstraints.push("不要出现镜头眩光"); }
  };

  for (const [field, mutate] of Object.entries(mutations)) {
    await t.test(field, async () => {
      const suffix = `stale-${field}`;
      const { project, creation } = await prepareCreation(suffix);
      const approval = await createApproval(project.id, { creationId: creation.id, maxImageCalls: 1, maxVideoCalls: 1 });
      const revised = completePlan(creation.id, suffix);
      mutate(revised.shots[0]);
      await updateProjectPlan(project.id, revised);

      const state = await readState();
      const current = state.approvals.find(item => item.id === approval.id);
      assert.equal(current.status, "stale");
      assert.match(current.staleReason, /^plan-revision-/);
    });
  }
});

test("Codex Image Gen static task uses the frozen image request instead of legacy shot.prompt", async () => {
  const { project, creation, plan } = await prepareCreation("static", "static-motion");
  const approval = await createApproval(project.id, { creationId: creation.id, maxImageCalls: 1, maxVideoCalls: 0 });
  const frozen = approval.scopeSnapshot.shots[0].promptCompilation;

  assert.ok(frozen.requests.image);
  assert.equal(frozen.requests.video, null);
  assert.notEqual(frozen.requests.image.prompt, plan.shots[0].prompt);

  const job = await authorizeAndStartPipeline(approval.id, { method: "mcp-elicitation", action: "accept" });
  const queued = await waitForQueuedImageTask(job.id, approval.id);

  assert.equal(queued.task.prompt, frozen.requests.image.prompt);
  assert.equal(queued.task.requestDigest, frozen.requestDigests.image);
  assert.deepEqual(queued.task.requestSnapshot, frozen.requests.image);
  assert.equal(queued.task.promptCompilerVersion, frozen.compilerVersion);
  assert.notEqual(queued.task.prompt, plan.shots[0].prompt);
});
