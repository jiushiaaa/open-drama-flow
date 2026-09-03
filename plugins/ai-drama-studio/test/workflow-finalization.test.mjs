import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ai-drama-finalization-"));
process.env.AI_DRAMA_DATA_DIR = tempRoot;

const { readState } = await import("../src/store.mjs");
const {
  authorizeAndStartPipeline,
  claimTask,
  completeTask,
  createApproval,
  createCreation,
  createProject,
  failTask,
  resumeRealPipeline,
  updateProjectPlan
} = await import("../src/workflow.mjs");

after(async () => {
  await fs.rm(tempRoot, { recursive: true, force: true });
});

function planInput(creationId, shotCount) {
  return {
    creationId,
    brief: {
      objective: "生成静态产品广告镜头",
      contentType: "电商广告",
      audience: "通勤用户",
      platform: "抖音",
      durationSeconds: shotCount,
      aspectRatio: "9:16",
      deliverables: ["竖屏 MP4"],
      acceptanceCriteria: ["产品外观准确"]
    },
    selectedSkills: ["minimalist-product-ad-generator"],
    premise: "使用静态画面验证审批终态",
    shots: Array.from({ length: shotCount }, (_, index) => ({
      id: `shot-${index + 1}`,
      duration: 1,
      scene: "产品台",
      framing: "特写",
      prompt: `生成产品图 ${index + 1}`,
      generationMode: "static-motion"
    }))
  };
}

async function waitForJob(jobId, predicate, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let lastJob = null;
  while (Date.now() < deadline) {
    const state = await readState();
    const job = state.jobs.find(item => item.id === jobId);
    lastJob = job || lastJob;
    if (job && predicate(job, state)) return { job, state };
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error(`JOB_TIMEOUT:${jobId}:${JSON.stringify(lastJob)}`);
}

async function createApprovedStaticBatch(title, shotCount, maxImageCalls) {
  const project = await createProject({ title });
  const creation = await createCreation(project.id, { title: "静态创作页" });
  await updateProjectPlan(project.id, planInput(creation.id, shotCount));
  const approval = await createApproval(project.id, { creationId: creation.id, maxImageCalls, maxVideoCalls: 0 });
  const job = await authorizeAndStartPipeline(approval.id, { method: "mcp-elicitation", action: "accept" });
  return { project, creation, approval, job };
}

test("image cap exhaustion atomically consumes approval and releases the real-job lease", async () => {
  const { approval, job } = await createApprovedStaticBatch("图片额度终态", 2, 1);
  const waiting = await waitForJob(job.id, current => current.status === "waiting" && current.stage === "codex-images");
  const task = waiting.state.tasks.find(item => item.approvalId === approval.id && item.status === "queued");
  assert.ok(task);

  await claimTask(task.id, "codex-test");
  await failTask(task.id, "故意消耗此次已批准的图片尝试");
  await resumeRealPipeline(job.id);

  const terminal = await waitForJob(job.id, current => current.status === "waiting" && current.stage === "approval-cap");
  const savedApproval = terminal.state.approvals.find(item => item.id === approval.id);
  assert.equal(savedApproval.status, "consumed");
  assert.equal(savedApproval.consumedAt, terminal.job.updatedAt);
  assert.equal(terminal.job.runToken, null);
  assert.equal(terminal.job.leaseExpiresAt, null);
});

test("successful real-pipeline completion consumes approval in the same terminal-state write", async () => {
  const { approval, job } = await createApprovedStaticBatch("成功终态", 1, 1);
  const waiting = await waitForJob(job.id, current => current.status === "waiting" && current.stage === "codex-images");
  const task = waiting.state.tasks.find(item => item.approvalId === approval.id && item.status === "queued");
  assert.ok(task);

  const imagePath = path.join(tempRoot, "fixtures", "approved.png");
  await fs.mkdir(path.dirname(imagePath), { recursive: true });
  await fs.writeFile(imagePath, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
  await claimTask(task.id, "codex-test");
  await completeTask(task.id, imagePath, "https://example.com/approved.png", {
    accepted: true,
    composition: "passed",
    identity: "passed",
    artifacts: "passed",
    cropSafety: "passed",
    notes: "已检查测试图片"
  });
  await resumeRealPipeline(job.id);

  const terminal = await waitForJob(job.id, current => current.status === "succeeded" && current.stage === "videos-ready");
  const savedApproval = terminal.state.approvals.find(item => item.id === approval.id);
  assert.equal(savedApproval.status, "consumed");
  assert.equal(savedApproval.consumedAt, terminal.job.updatedAt);
  assert.equal(terminal.job.runToken, null);
  assert.equal(terminal.job.leaseExpiresAt, null);
});
