import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import test, { after } from "node:test";

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ai-drama-harness-regressions-"));
process.env.AI_DRAMA_DATA_DIR = tempRoot;

const { mutateState, readState } = await import("../src/store.mjs");
const {
  createCreation,
  createProject,
  finalizeDelivery,
  prepareQualityEvidence,
  recordQualityReview,
  startLocalRender,
  updateCreation,
  updateProjectPlan
} = await import("../src/workflow.mjs");
const { probeMedia } = await import("../src/ffmpeg.mjs");

after(async () => {
  await fs.rm(tempRoot, { recursive: true, force: true });
});

function planInput(creationId, { aspectRatio = "9:16", shots, acceptanceCriteria = ["产品外观准确"] } = {}) {
  return {
    creationId,
    brief: {
      objective: "制作无线耳机广告",
      contentType: "电商广告",
      audience: "通勤用户",
      platform: "抖音",
      durationSeconds: 1,
      aspectRatio,
      deliverables: [`${aspectRatio} MP4`],
      acceptanceCriteria
    },
    selectedSkills: ["minimax-minimalist-product-ad-generator"],
    premise: "用产品特写表现轻便和降噪",
    shots: shots || [{
      id: "shot-1",
      duration: 1,
      scene: "地铁",
      framing: "特写",
      action: "耳机旋转",
      prompt: "银色无线耳机在冷色灯光中旋转",
      subtitle: "安静，由你掌控",
      generationMode: "static-motion",
      acceptanceCriteria
    }]
  };
}

function reviewInput(criteria = ["产品外观准确"]) {
  return {
    decision: "passed",
    checks: {
      visual: "passed",
      continuity: "passed",
      subtitles: "passed",
      audio: "not-applicable",
      brandAccuracy: "passed"
    },
    criteriaResults: criteria.map(criterion => ({ criterion, status: "passed", evidence: `已逐项检查：${criterion}` })),
    notes: "已实际播放并完成逐项质量检查。"
  };
}

async function prepareAndReview(projectId, creationId, outputId, criteria) {
  const evidence = await prepareQualityEvidence(projectId, creationId, outputId);
  return recordQualityReview(projectId, creationId, outputId, {
    ...reviewInput(criteria),
    inspectedFrameSha256s: evidence.frames.map(frame => frame.sha256)
  });
}

function run(command, args, cwd = tempRoot) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", chunk => { stderr = `${stderr}${chunk}`.slice(-4000); });
    child.once("error", reject);
    child.once("close", code => code === 0 ? resolve() : reject(new Error(`${command} failed (${code}): ${stderr}`)));
  });
}

async function makeVideo(filePath, { color = "#315ce8", size = "72x128", duration = 0.6 } = {}) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await run("ffmpeg", [
    "-y",
    "-f", "lavfi", "-i", `color=c=${color}:s=${size}:r=24:d=${duration}`,
    "-f", "lavfi", "-i", `anullsrc=r=48000:cl=stereo:d=${duration}`,
    "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-movflags", "+faststart", filePath
  ]);
  return filePath;
}

async function waitForJob(jobId, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await readState();
    const job = state.jobs.find(item => item.id === jobId);
    if (job && ["succeeded", "failed", "superseded"].includes(job.status)) return job;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`JOB_TIMEOUT: ${jobId}`);
}

async function insertOutput(projectId, creationId, planRevision, localPath) {
  const outputId = `output-${crypto.randomUUID()}`;
  await mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    project.outputs.unshift({
      id: outputId,
      creationId,
      planRevision,
      kind: "video",
      localPath,
      reviews: [],
      delivery: null,
      stale: false,
      createdAt: new Date().toISOString()
    });
  });
  return outputId;
}

test("subtitle edits and shot reordering stale final edits without discarding paid shot clips", async () => {
  const project = await createProject({ title: "镜头合同修订回归" });
  const creation = await createCreation(project.id, { title: "广告创作页" });
  const firstShots = [
    { id: "shot-a", duration: 1, scene: "站台", framing: "特写", prompt: "耳机特写", subtitle: "旧字幕", generationMode: "static-motion" },
    { id: "shot-b", duration: 1, scene: "车厢", framing: "中景", prompt: "通勤者佩戴耳机", subtitle: "第二镜", generationMode: "static-motion" }
  ];
  await updateProjectPlan(project.id, planInput(creation.id, { shots: firstShots }));

  await mutateState(state => {
    const target = state.projects.find(item => item.id === project.id);
    target.outputs.push({ id: "output-before-subtitle", creationId: creation.id, planRevision: 1, localPath: "C:\\fixtures\\before-subtitle.mp4", reviews: [], delivery: null, stale: false });
    const shot = target.creations.find(item => item.id === creation.id).plan.shots[0];
    shot.clipPath = "C:\\fixtures\\shot-a.mp4";
  });

  await updateProjectPlan(project.id, planInput(creation.id, {
    shots: [{ ...firstShots[0], subtitle: "修改后的字幕" }, firstShots[1]]
  }));
  let state = await readState();
  let target = state.projects.find(item => item.id === project.id);
  let production = target.creations.find(item => item.id === creation.id).plan;
  assert.equal(production.planRevision, 2);
  assert.equal(production.shots.find(item => item.id === "shot-a").promptVersion, 1);
  assert.equal(production.shots.find(item => item.id === "shot-a").clipPath, "C:\\fixtures\\shot-a.mp4");
  assert.equal(target.outputs.find(item => item.id === "output-before-subtitle").stale, true);

  await mutateState(next => {
    const nextProject = next.projects.find(item => item.id === project.id);
    nextProject.outputs.push({ id: "output-before-reorder", creationId: creation.id, planRevision: 2, localPath: "C:\\fixtures\\before-reorder.mp4", reviews: [], delivery: null, stale: false });
  });
  const revisedShots = production.shots.map(shot => ({
    id: shot.id,
    duration: shot.duration,
    scene: shot.scene,
    framing: shot.framing,
    prompt: shot.prompt,
    action: shot.action,
    subtitle: shot.subtitle,
    audio: shot.audio,
    generationMode: shot.generationMode,
    referenceAssetIds: shot.referenceAssetIds,
    acceptanceCriteria: shot.acceptanceCriteria
  }));
  await updateProjectPlan(project.id, planInput(creation.id, { shots: revisedShots.reverse() }));

  state = await readState();
  target = state.projects.find(item => item.id === project.id);
  production = target.creations.find(item => item.id === creation.id).plan;
  assert.equal(production.planRevision, 3);
  assert.deepEqual(production.shots.map(item => item.id), ["shot-b", "shot-a"]);
  assert.deepEqual(production.shots.map(item => item.order), [1, 2]);
  assert.equal(production.shots.find(item => item.id === "shot-a").clipPath, "C:\\fixtures\\shot-a.mp4");
  assert.equal(production.shots.find(item => item.id === "shot-a").promptVersion, 1);
  assert.equal(target.outputs.find(item => item.id === "output-before-reorder").stale, true);
});

test("acceptance-only revisions preserve rendered media and require fresh review evidence", async () => {
  const project = await createProject({ title: "验收标准修订" });
  const creation = await createCreation(project.id, { title: "广告验收页" });
  await updateProjectPlan(project.id, planInput(creation.id));
  await mutateState(state => {
    const target = state.projects.find(item => item.id === project.id);
    const shot = target.creations.find(item => item.id === creation.id).plan.shots[0];
    shot.clipPath = "C:\\fixtures\\paid-shot.mp4";
    target.outputs.push({
      id: "output-before-review-rule",
      creationId: creation.id,
      planRevision: 1,
      localPath: "C:\\fixtures\\final.mp4",
      reviews: [{ id: "review-old", decision: "passed" }],
      delivery: { status: "delivered" },
      stale: false
    });
  });

  await updateProjectPlan(project.id, planInput(creation.id, { acceptanceCriteria: ["产品外观准确", "字幕无错字"] }));
  const state = await readState();
  const target = state.projects.find(item => item.id === project.id);
  const production = target.creations.find(item => item.id === creation.id).plan;
  const output = target.outputs.find(item => item.id === "output-before-review-rule");
  assert.equal(production.planRevision, 2);
  assert.equal(production.shots[0].clipPath, "C:\\fixtures\\paid-shot.mp4");
  assert.equal(production.shots[0].promptVersion, 1);
  assert.equal(output.stale, false);
  assert.equal(output.planRevision, 2);
  assert.deepEqual(output.reviews, []);
  assert.equal(output.delivery, null);
  assert.equal(target.creations.find(item => item.id === creation.id).status, "awaiting-review");
});

test("replaying an identical plan is idempotent", async () => {
  const project = await createProject({ title: "幂等计划" });
  const creation = await createCreation(project.id, { title: "同一创作页" });
  const input = planInput(creation.id);
  await updateProjectPlan(project.id, input);
  const before = await readState();
  const beforeProject = before.projects.find(item => item.id === project.id);
  const beforeEvents = before.events.length;
  const beforeUpdatedAt = beforeProject.updatedAt;

  await updateProjectPlan(project.id, input);
  const after = await readState();
  const target = after.projects.find(item => item.id === project.id);
  assert.equal(target.creations.find(item => item.id === creation.id).plan.planRevision, 1);
  assert.equal(target.updatedAt, beforeUpdatedAt);
  assert.equal(after.events.length, beforeEvents);
});

test("changing a creation asset context invalidates generated evidence but preserves the source asset", async () => {
  const project = await createProject({ title: "创作上下文修订" });
  const creation = await createCreation(project.id, { title: "素材引用页" });
  await updateProjectPlan(project.id, planInput(creation.id));
  await mutateState(state => {
    const target = state.projects.find(item => item.id === project.id);
    const shot = target.creations.find(item => item.id === creation.id).plan.shots[0];
    shot.clipPath = "C:\\fixtures\\generated-shot.mp4";
    target.assets.push(
      { id: "source-doc", familyId: "source-doc", version: 1, kind: "document", sha256: "a".repeat(64), stale: false },
      { id: "generated-image", familyId: "generated-image", version: 1, kind: "image", shotId: "shot-1", creationId: creation.id, provider: "codex-imagegen", planRevision: 1, promptVersion: 1, sha256: "b".repeat(64), stale: false }
    );
  });

  await updateCreation(project.id, creation.id, { assetRefs: [{ assetId: "source-doc" }] });
  const state = await readState();
  const target = state.projects.find(item => item.id === project.id);
  const production = target.creations.find(item => item.id === creation.id).plan;
  assert.equal(production.planRevision, 2);
  assert.equal("clipPath" in production.shots[0], false);
  assert.equal(production.shots[0].promptVersion, 2);
  assert.equal(target.assets.find(item => item.id === "source-doc").stale, false);
  assert.equal(target.assets.find(item => item.id === "generated-image").stale, true);
});

test("local render refuses a non-static shot without a real clip and creates no output", async () => {
  const project = await createProject({ title: "禁止伪造视频回归" });
  const creation = await createCreation(project.id, { title: "Seedance 镜头" });
  await updateProjectPlan(project.id, planInput(creation.id, {
    shots: [{ id: "shot-1", duration: 1, scene: "产品台", framing: "特写", prompt: "耳机缓慢旋转", generationMode: "seedance" }]
  }));

  const queued = await startLocalRender(project.id, creation.id);
  const job = await waitForJob(queued.id);
  assert.equal(job.status, "failed");
  assert.equal(job.errorCode, "SHOT_VIDEO_CLIP_REQUIRED");
  const state = await readState();
  const target = state.projects.find(item => item.id === project.id);
  assert.equal(target.outputs.some(item => item.creationId === creation.id && !item.stale), false);
});

test("replacing a reviewed output file invalidates its evidence and blocks delivery", { timeout: 30_000 }, async () => {
  const project = await createProject({ title: "质检证据绑定回归" });
  const creation = await createCreation(project.id, { title: "待交付广告" });
  await updateProjectPlan(project.id, planInput(creation.id));
  const outputPath = path.join(tempRoot, "fixtures", "reviewed-output.mp4");
  await makeVideo(outputPath, { color: "#315ce8" });
  const outputId = await insertOutput(project.id, creation.id, 1, outputPath);

  const review = await prepareAndReview(project.id, creation.id, outputId);
  assert.equal(review.decision, "passed");
  assert.match(review.fileEvidence?.sha256 || "", /^[a-f0-9]{64}$/);

  await makeVideo(outputPath, { color: "#e85c31", duration: 0.8 });
  await assert.rejects(
    finalizeDelivery(project.id, creation.id, outputId, "不应交付被替换的文件"),
    /OUTPUT_CHANGED_AFTER_REVIEW/
  );
  const state = await readState();
  const output = state.projects.find(item => item.id === project.id).outputs.find(item => item.id === outputId);
  assert.equal(output.delivery, null);
});

test("delivering one creation does not mark a multi-creation parent project completed", { timeout: 30_000 }, async () => {
  const project = await createProject({ title: "多创作页状态回归" });
  const first = await createCreation(project.id, { title: "第一集" });
  const second = await createCreation(project.id, { title: "第二集" });
  await updateProjectPlan(project.id, planInput(first.id));
  await updateProjectPlan(project.id, planInput(second.id));
  const outputPath = path.join(tempRoot, "fixtures", "episode-one.mp4");
  await makeVideo(outputPath, { color: "#5c31e8" });
  const outputId = await insertOutput(project.id, first.id, 1, outputPath);

  await prepareAndReview(project.id, first.id, outputId);
  await finalizeDelivery(project.id, first.id, outputId, "第一集交付");

  const state = await readState();
  const target = state.projects.find(item => item.id === project.id);
  assert.equal(target.creations.find(item => item.id === first.id).status, "completed");
  assert.notEqual(target.creations.find(item => item.id === second.id).status, "completed");
  assert.notEqual(target.status, "completed");
});

test("control pages do not block delivery, while a newly added episode reopens the project", { timeout: 30_000 }, async () => {
  const project = await createProject({ title: "父项目交付聚合" });
  await createCreation(project.id, { title: "系列总览", type: "series-control" });
  const episode = await createCreation(project.id, { title: "EP01", type: "episode" });
  await updateProjectPlan(project.id, planInput(episode.id));
  const outputPath = path.join(tempRoot, "fixtures", "only-episode.mp4");
  await makeVideo(outputPath, { color: "#31a9e8" });
  const outputId = await insertOutput(project.id, episode.id, 1, outputPath);

  await prepareAndReview(project.id, episode.id, outputId);
  await finalizeDelivery(project.id, episode.id, outputId, "唯一交付单元已完成");
  let state = await readState();
  let target = state.projects.find(item => item.id === project.id);
  assert.equal(target.status, "completed");

  await createCreation(project.id, { title: "素材开发", type: "asset-development" });
  state = await readState();
  target = state.projects.find(item => item.id === project.id);
  assert.equal(target.status, "completed");

  await createCreation(project.id, { title: "EP02", type: "episode" });
  state = await readState();
  target = state.projects.find(item => item.id === project.id);
  assert.equal(target.status, "in-progress");
});

test("a 16:9 static local render preserves the requested landscape output dimensions", { timeout: 45_000 }, async t => {
  try {
    await run("ffmpeg", ["-version"]);
    await run("ffprobe", ["-version"]);
  } catch {
    t.skip("ffmpeg/ffprobe is not available in this environment");
    return;
  }

  const project = await createProject({ title: "横屏渲染回归" });
  const creation = await createCreation(project.id, { title: "16:9 静态广告" });
  await updateProjectPlan(project.id, planInput(creation.id, { aspectRatio: "16:9" }));
  const imagePath = path.join(tempRoot, "fixtures", "landscape.ppm");
  await fs.mkdir(path.dirname(imagePath), { recursive: true });
  await fs.writeFile(imagePath, "P3\n4 2\n255\n49 92 232 49 92 232 49 92 232 49 92 232\n232 92 49 232 92 49 232 92 49 232 92 49\n", "utf8");
  await mutateState(state => {
    const target = state.projects.find(item => item.id === project.id);
    target.assets.push({
      id: "asset-landscape",
      familyId: "asset-landscape",
      version: 1,
      projectId: project.id,
      creationId: creation.id,
      shotId: "shot-1",
      kind: "image",
      localPath: imagePath,
      stale: false,
      createdAt: new Date().toISOString()
    });
  });

  const queued = await startLocalRender(project.id, creation.id);
  const job = await waitForJob(queued.id, 40_000);
  assert.equal(job.status, "succeeded", job.error || job.errorCode);
  const state = await readState();
  const output = state.projects.find(item => item.id === project.id).outputs.find(item => item.jobId === job.id);
  assert.ok(output?.localPath);
  const media = await probeMedia(output.localPath);
  assert.deepEqual({ width: media.video.width, height: media.video.height }, { width: 1280, height: 720 });
});
