import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ai-drama-workflow-harness-"));
process.env.AI_DRAMA_DATA_DIR = tempRoot;

const { mutateState, readState } = await import("../src/store.mjs");
const { authorizeAndStartPipeline, createApproval, createCreation, createProject, getProductionStatus, updateProjectPlan } = await import("../src/workflow.mjs");

after(async () => {
  await fs.rm(tempRoot, { recursive: true, force: true });
});

function planInput(creationId, overrides = {}) {
  return {
    creationId,
    brief: { objective: "制作无线耳机竖屏广告", contentType: "电商广告", audience: "通勤用户", platform: "抖音", durationSeconds: 5, deliverables: ["竖屏 MP4"], acceptanceCriteria: ["产品外观准确"] },
    selectedSkills: ["minimax-minimalist-product-ad-generator"],
    premise: "用产品特写表现轻便和降噪",
    shots: [{ id: "shot-1", duration: 5, scene: "地铁", framing: "特写", action: "耳机旋转", prompt: "银色无线耳机在冷色灯光中旋转", subtitle: "安静，由你掌控", generationMode: "seedance" }],
    ...overrides
  };
}

test("a newly created page has an independent empty production plan", async () => {
  const project = await createProject({ title: "独立创作页验证", logline: "项目级旧目标" });
  await updateProjectPlan(project.id, { logline: "项目级旧目标", shots: [{ id: "legacy-shot", duration: 5, scene: "旧场景", framing: "中景", prompt: "旧项目镜头" }] });
  const creation = await createCreation(project.id, { title: "新的广告创作页", type: "episode" });
  const guidance = await getProductionStatus(project.id, creation.id);
  assert.equal(guidance.summary.shots, 0);
  assert.equal(guidance.brief.objective, "");
  assert.equal(guidance.nextActions[0].tool, "drama_update_plan");
});

test("changing a shot contract preserves history but invalidates downstream evidence", async () => {
  const project = await createProject({ title: "修订失效验证" });
  const creation = await createCreation(project.id, { title: "广告 A" });
  await updateProjectPlan(project.id, planInput(creation.id));
  await mutateState(state => {
    const target = state.projects.find(item => item.id === project.id);
    const shot = target.creations.find(item => item.id === creation.id).plan.shots[0];
    shot.clipPath = "C:\\fixtures\\old-clip.mp4";
    shot.providerTaskId = "provider-old";
    target.assets.push({ id: "asset-old", familyId: "asset-old", version: 1, projectId: project.id, creationId: creation.id, shotId: shot.id, kind: "image", provider: "codex-imagegen", planRevision: 1, promptVersion: 1, localPath: "C:\\fixtures\\old.png" });
    target.outputs.push({ id: "output-old", creationId: creation.id, planRevision: 1, localPath: "C:\\fixtures\\old-final.mp4", reviews: [], delivery: null });
  });

  await updateProjectPlan(project.id, planInput(creation.id, { shots: [{ id: "shot-1", duration: 5, scene: "地铁", framing: "特写", action: "手指触碰耳罩", prompt: "修改后的无线耳机微距镜头", subtitle: "安静，由你掌控", generationMode: "seedance" }] }));
  const state = await readState();
  const target = state.projects.find(item => item.id === project.id);
  const shot = target.creations.find(item => item.id === creation.id).plan.shots[0];
  assert.equal(shot.promptVersion, 2);
  assert.equal("clipPath" in shot, false);
  assert.equal("providerTaskId" in shot, false);
  assert.equal(shot.revisions.at(-1).clipPath, "C:\\fixtures\\old-clip.mp4");
  assert.equal(target.assets.find(item => item.id === "asset-old").stale, true);
  assert.equal(target.outputs.find(item => item.id === "output-old").stale, true);
});

test("an approval is bound to an immutable plan snapshot", async () => {
  const project = await createProject({ title: "审批快照验证" });
  const creation = await createCreation(project.id, { title: "广告 B" });
  await updateProjectPlan(project.id, planInput(creation.id));
  const approval = await createApproval(project.id, { creationId: creation.id, maxImageCalls: 1, maxVideoCalls: 1 });
  assert.equal(approval.scopeSnapshot.planRevision, 1);
  assert.equal(approval.scopeSnapshot.shots[0].id, "shot-1");
  assert.equal(approval.scopeDigest.length, 64);

  await updateProjectPlan(project.id, planInput(creation.id, { shots: [{ id: "shot-1", duration: 5, scene: "地铁", framing: "特写", action: "改动作", prompt: "新 Prompt", generationMode: "seedance" }] }));
  await assert.rejects(authorizeAndStartPipeline(approval.id, { method: "mcp-elicitation", action: "accept" }), /APPROVAL_SCOPE_STALE/);
});

test("concurrent trusted authorization creates exactly one job", async () => {
  const project = await createProject({ title: "审批并发验证" });
  const creation = await createCreation(project.id, { title: "静态镜头任务" });
  await updateProjectPlan(project.id, planInput(creation.id, { shots: [{ id: "shot-1", duration: 5, scene: "静态素材", framing: "中景", prompt: "生成一张静态产品图", generationMode: "static-motion" }] }));
  const approval = await createApproval(project.id, { creationId: creation.id, maxImageCalls: 1, maxVideoCalls: 0 });
  const [first, second] = await Promise.all([
    authorizeAndStartPipeline(approval.id, { method: "mcp-elicitation", action: "accept" }),
    authorizeAndStartPipeline(approval.id, { method: "mcp-elicitation", action: "accept" })
  ]);
  assert.equal(first.id, second.id);
  await new Promise(resolve => setTimeout(resolve, 50));
  const state = await readState();
  assert.equal(state.jobs.filter(item => item.approvalId === approval.id).length, 1);
});
