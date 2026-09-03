import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import test, { after } from "node:test";

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ai-drama-asset-contract-"));
process.env.AI_DRAMA_DATA_DIR = tempRoot;

const { mutateState, readState } = await import("../src/store.mjs");
const {
  authorizeAndStartPipeline,
  createApproval,
  createCreation,
  createProject,
  createWorld,
  startLocalRender,
  updateProjectPlan
} = await import("../src/workflow.mjs");
const { probeMedia } = await import("../src/ffmpeg.mjs");

after(async () => {
  await (await import("../src/background-jobs.mjs")).drainBackgroundJobs();
  await fs.rm(tempRoot, { recursive: true, force: true });
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function completePlan(creationId, shots, overrides = {}) {
  const durationSeconds = shots.reduce((sum, shot) => sum + Number(shot.duration || 0), 0);
  return {
    creationId,
    brief: {
      objective: "制作可交付的视频",
      contentType: "品牌视频",
      audience: "目标消费者",
      platform: "抖音",
      durationSeconds,
      aspectRatio: "9:16",
      deliverables: ["竖屏 MP4"],
      acceptanceCriteria: ["素材版本准确"],
      ...(overrides.brief || {})
    },
    selectedSkills: ["brand-promo-video-generator"],
    premise: "使用已审核素材完成视频",
    characters: overrides.characters || [],
    shots
  };
}

async function addAssets(projectId, assets) {
  await mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    project.assets.push(...assets.map(asset => ({
      familyId: asset.id,
      version: 1,
      projectId,
      folderId: null,
      scope: "project",
      worldId: null,
      creationId: null,
      stale: false,
      createdAt: new Date().toISOString(),
      ...asset
    })));
  });
}

async function waitForJob(jobId, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await readState();
    const job = state.jobs.find(item => item.id === jobId);
    if (job && ["succeeded", "failed", "waiting", "superseded"].includes(job.status)) return { job, state };
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error(`JOB_TIMEOUT:${jobId}`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: tempRoot, windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", chunk => { stderr = `${stderr}${chunk}`.slice(-4000); });
    child.once("error", reject);
    child.once("close", code => code === 0 ? resolve() : reject(new Error(`${command} failed (${code}): ${stderr}`)));
  });
}

test("approval snapshot locks every explicit and inherited asset while excluding unrelated worlds", async () => {
  const project = await createProject({ title: "引用闭环" });
  const world = await createWorld(project.id, { title: "第一卷" });
  const otherWorld = await createWorld(project.id, { title: "第二卷" });
  const creation = await createCreation(project.id, { title: "EP01", worldId: world.id });
  const ids = ["brief-doc", "character-image", "shot-image", "source-video", "source-audio", "series-public", "world-public"];
  await addAssets(project.id, [
    { id: "brief-doc", kind: "document", sha256: sha256("brief") },
    { id: "character-image", kind: "image", sha256: sha256("character") },
    { id: "shot-image", kind: "image", sha256: sha256("shot") },
    { id: "source-video", kind: "video", sha256: sha256("video") },
    { id: "source-audio", kind: "audio", sha256: sha256("audio") },
    { id: "series-public", kind: "document", scope: "series", sha256: sha256("series") },
    { id: "world-public", kind: "document", scope: "world", worldId: world.id, sha256: sha256("world") },
    { id: "other-world", kind: "document", scope: "world", worldId: otherWorld.id, sha256: sha256("other") },
    { id: "stale-series", kind: "document", scope: "series", stale: true, sha256: sha256("stale") }
  ]);

  await updateProjectPlan(project.id, completePlan(creation.id, [
    { id: "shot-1", duration: 4, scene: "产品台", framing: "特写", prompt: "产品慢速旋转", generationMode: "seedance", referenceAssetIds: ["shot-image"], sourceAudioAssetId: "source-audio" },
    { id: "shot-2", duration: 4, scene: "街道", framing: "中景", prompt: "真实上传镜头", generationMode: "uploaded-video", sourceVideoAssetId: "source-video" }
  ], {
    brief: { sourceAssetIds: ["brief-doc"] },
    characters: [{ id: "lead", name: "主角", referenceAssetIds: ["character-image"] }]
  }));

  const approval = await createApproval(project.id, { creationId: creation.id, maxVideoCalls: 1 });
  assert.equal(approval.maxImageCalls, 0);
  assert.deepEqual(approval.scopeSnapshot.referenceAssets.map(item => item.assetId).sort(), ids.sort());
  assert.equal(approval.scopeSnapshot.inputAssetBindings[0].assetId, "shot-image");
  assert.equal(approval.scopeSnapshot.inputAssetBindings[0].kind, "image");
  assert.equal(approval.scopeSnapshot.shots[0].sourceAudioAssetId, "source-audio");
  assert.equal(approval.scopeSnapshot.shots[1].sourceVideoAssetId, "source-video");
  assert.equal(JSON.stringify(approval.scopeSnapshot).includes("localPath"), false);
});

test("plan updates reject missing, stale, and wrong-kind explicit references", async () => {
  const project = await createProject({ title: "引用校验" });
  const creation = await createCreation(project.id, { title: "EP01" });
  const baseShot = { id: "shot-1", duration: 4, scene: "产品台", framing: "特写", prompt: "产品镜头", generationMode: "seedance" };

  await assert.rejects(
    updateProjectPlan(project.id, completePlan(creation.id, [baseShot], { brief: { sourceAssetIds: ["missing"] } })),
    /ASSET_REFERENCE_NOT_FOUND:missing/
  );
  await addAssets(project.id, [
    { id: "stale-doc", kind: "document", stale: true, sha256: sha256("stale") },
    { id: "audio-only", kind: "audio", sha256: sha256("audio") }
  ]);
  await assert.rejects(
    updateProjectPlan(project.id, completePlan(creation.id, [{ ...baseShot, referenceAssetIds: ["stale-doc"] }])),
    /ASSET_REFERENCE_STALE:stale-doc/
  );
  await assert.rejects(
    updateProjectPlan(project.id, completePlan(creation.id, [{ ...baseShot, generationMode: "uploaded-video", sourceVideoAssetId: "audio-only" }])),
    /ASSET_REFERENCE_KIND_INVALID:audio-only:video/
  );
});

test("paid approval requires the complete brief and matching total shot duration", async () => {
  const project = await createProject({ title: "简报门槛" });
  const creation = await createCreation(project.id, { title: "EP01" });
  const shot = { id: "shot-1", duration: 4, scene: "产品台", framing: "特写", prompt: "产品镜头", generationMode: "seedance" };
  await updateProjectPlan(project.id, completePlan(creation.id, [shot], { brief: { audience: "", deliverables: [] } }));
  await assert.rejects(
    createApproval(project.id, { creationId: creation.id, maxImageCalls: 1, maxVideoCalls: 1 }),
    /PRODUCTION_BRIEF_INCOMPLETE:.*audience.*deliverables/
  );

  await updateProjectPlan(project.id, completePlan(creation.id, [shot], { brief: { durationSeconds: 5 } }));
  await assert.rejects(
    createApproval(project.id, { creationId: creation.id, maxImageCalls: 1, maxVideoCalls: 1 }),
    /PRODUCTION_DURATION_MISMATCH:4:5/
  );

  await updateProjectPlan(project.id, completePlan(creation.id, [shot], { brief: { deliverables: ["9:16 MP4", "16:9 MP4"] } }));
  await assert.rejects(
    createApproval(project.id, { creationId: creation.id, maxImageCalls: 1, maxVideoCalls: 1 }),
    /DELIVERY_SCOPE_REQUIRES_ONE_VIDEO_PER_CREATION/
  );
});

test("real pipeline verifies locked local hashes before reserving a provider call", async () => {
  const project = await createProject({ title: "审批哈希" });
  const creation = await createCreation(project.id, { title: "EP01" });
  const imagePath = path.join(tempRoot, "fixtures", "reference.png");
  await fs.mkdir(path.dirname(imagePath), { recursive: true });
  await fs.writeFile(imagePath, "approved-content", "utf8");
  await addAssets(project.id, [{ id: "locked-image", kind: "image", localPath: imagePath, sha256: sha256("approved-content") }]);
  await updateProjectPlan(project.id, completePlan(creation.id, [
    { id: "shot-1", duration: 4, scene: "产品台", framing: "特写", prompt: "产品缓慢旋转", generationMode: "seedance", referenceAssetIds: ["locked-image"] }
  ]));
  const approval = await createApproval(project.id, { creationId: creation.id, maxVideoCalls: 1 });
  await fs.writeFile(imagePath, "tampered-content", "utf8");

  const launched = await authorizeAndStartPipeline(approval.id, { method: "mcp-elicitation", action: "accept" });
  const { job, state } = await waitForJob(launched.id);
  assert.equal(job.status, "failed");
  assert.equal(job.errorCode, "ASSET_VERSION_CONTENT_CHANGED");
  assert.equal(state.providerCalls.filter(item => item.approvalId === approval.id).length, 0);
});

test("uploaded video and source audio are resolved by asset id and recorded as render evidence", { timeout: 45_000 }, async t => {
  try {
    await run("ffmpeg", ["-version"]);
    await run("ffprobe", ["-version"]);
  } catch {
    t.skip("ffmpeg/ffprobe is not available in this environment");
    return;
  }
  const project = await createProject({ title: "上传素材渲染" });
  const creation = await createCreation(project.id, { title: "EP01" });
  const videoPath = path.join(tempRoot, "fixtures", `${randomUUID()}.mp4`);
  const audioPath = path.join(tempRoot, "fixtures", `${randomUUID()}.wav`);
  await fs.mkdir(path.dirname(videoPath), { recursive: true });
  await run("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=#315ce8:s=72x128:r=24:d=1", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", videoPath]);
  await run("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=1", "-c:a", "pcm_s16le", audioPath]);
  const videoBytes = await fs.readFile(videoPath);
  const audioBytes = await fs.readFile(audioPath);
  await addAssets(project.id, [
    { id: "uploaded-video", kind: "video", localPath: videoPath, sha256: sha256(videoBytes) },
    { id: "voice-track", kind: "audio", localPath: audioPath, sha256: sha256(audioBytes) }
  ]);
  await updateProjectPlan(project.id, completePlan(creation.id, [{
    id: "shot-1",
    duration: 1,
    scene: "上传镜头",
    framing: "中景",
    prompt: "使用已上传的视频",
    audio: "使用已上传的配音",
    generationMode: "uploaded-video",
    sourceVideoAssetId: "uploaded-video",
    sourceAudioAssetId: "voice-track"
  }]));

  const queued = await startLocalRender(project.id, creation.id);
  const { job, state } = await waitForJob(queued.id, 40_000);
  assert.equal(job.status, "succeeded", job.error || job.errorCode);
  const output = state.projects.find(item => item.id === project.id).outputs.find(item => item.jobId === job.id);
  assert.deepEqual(output.inputAssets.map(item => [item.assetId, item.role]).sort(), [["uploaded-video", "source-video"], ["voice-track", "source-audio"]]);
  assert.equal(output.inputShots[0].sourceVideoAsset.assetId, "uploaded-video");
  assert.equal(output.inputShots[0].sourceAudioAsset.assetId, "voice-track");
  assert.equal(output.inputShots[0].clipPath, null);
  assert.equal(JSON.stringify(output.inputShots[0]).includes(videoPath), false);
  assert.ok((await probeMedia(output.localPath)).audio);
});

test("declared audio cannot silently render without a real source while audio generation is disabled", async () => {
  const project = await createProject({ title: "禁止静音伪装" });
  const creation = await createCreation(project.id, { title: "EP01" });
  const imagePath = path.join(tempRoot, "fixtures", "still.ppm");
  await fs.mkdir(path.dirname(imagePath), { recursive: true });
  await fs.writeFile(imagePath, "P3\n1 1\n255\n49 92 232\n", "utf8");
  await addAssets(project.id, [{ id: "still-image", kind: "image", shotId: "shot-1", creationId: creation.id, localPath: imagePath, sha256: sha256(await fs.readFile(imagePath)) }]);
  await updateProjectPlan(project.id, completePlan(creation.id, [{ id: "shot-1", duration: 1, scene: "静态画面", framing: "特写", prompt: "静态产品", audio: "必须有旁白", generationMode: "static-motion" }]));

  const queued = await startLocalRender(project.id, creation.id);
  const { job, state } = await waitForJob(queued.id);
  assert.equal(job.status, "failed");
  assert.equal(job.errorCode, "SHOT_AUDIO_SOURCE_REQUIRED");
  assert.equal(state.projects.find(item => item.id === project.id).outputs.some(item => item.jobId === job.id), false);
});
