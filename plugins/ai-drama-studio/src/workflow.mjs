import fs from "node:fs/promises";
import path from "node:path";
import { dataRoot, safeId } from "./config.mjs";
import { appendEvent, mutateState, readState } from "./store.mjs";
import { readArkKey } from "./secrets.mjs";
import { createShotVideo, normalizeVideoClip, probeDuration, renderFinal, srtTimestamp } from "./ffmpeg.mjs";
import { createSeedanceTask, downloadSeedanceVideo, generateSeedreamImage, waitForSeedanceTask } from "./ark.mjs";
import { ensureAssetRemoteUrl } from "./asset-bridge.mjs";

function projectDir(projectId) {
  return path.join(dataRoot, "projects", projectId);
}

function safeJobFailure(error) {
  const raw = String(error?.message || error || "UNKNOWN_ERROR");
  const code = raw.match(/^[A-Z0-9_]+/)?.[0] || "JOB_FAILED";
  if (code.startsWith("ASSET_BRIDGE")) return { code, message: "参考图 HTTPS 桥暂时不可用。素材与原审批均已保留，恢复桥接后可继续，不会重复提交已创建的视频任务。" };
  if (code === "SEEDANCE_REQUIRES_REMOTE_IMAGE_URL") return { code, message: "Codex 图片目前只有本地副本。请为对应图片任务补充可访问的 HTTPS 地址后续跑；不会重复已成功步骤或产生额外调用。" };
  if (code.startsWith("FFMPEG")) return { code, message: "本地 FFmpeg 渲染失败。请检查素材格式和 FFmpeg 后重试。" };
  if (code.startsWith("SEEDREAM")) return { code, message: "Seedream 图片步骤未完成。已成功产物会保留，请检查模型 ID、权限或提示词后新建审批重试。" };
  if (code.startsWith("SEEDANCE")) return { code, message: "Seedance 视频步骤未完成。请先查询已有任务状态，避免重复付费提交。" };
  if (code.startsWith("ARK_KEY")) return { code, message: "尚未配置可用的火山方舟 API Key。请在“API Key”中保存后重试。" };
  return { code, message: "任务未完成。已成功产物已保留，请根据失败阶段重试。" };
}

export async function createProject({ title = "未命名漫剧", logline = "" } = {}) {
  const id = safeId("project");
  const now = new Date().toISOString();
  const project = {
    id, title: String(title).slice(0, 80), logline: String(logline).slice(0, 500),
    status: "draft", currentStage: "story", createdAt: now, updatedAt: now,
    script: { premise: "", scenes: [] }, characters: [], shots: [], assets: [], outputs: [], creations: []
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

export async function deleteProject(projectId) {
  const state = await readState();
  const project = state.projects.find(item => item.id === projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const source = projectDir(projectId);
  const trashRoot = path.join(dataRoot, ".trash");
  const trashedPath = path.join(trashRoot, `${projectId}-${Date.now()}`);
  await fs.mkdir(trashRoot, { recursive: true });
  try { await fs.rename(source, trashedPath); }
  catch (error) { if (error?.code !== "ENOENT") throw error; }
  try {
    await mutateState(next => {
      next.projects = next.projects.filter(item => item.id !== projectId);
      next.jobs = next.jobs.filter(item => item.projectId !== projectId);
      next.approvals = next.approvals.filter(item => item.projectId !== projectId);
      next.tasks = next.tasks.filter(item => item.projectId !== projectId);
      appendEvent(next, "project.deleted", `项目《${project.title}》已移入本机回收区`, { projectId });
    });
  } catch (error) {
    try { await fs.rename(trashedPath, source); } catch {}
    throw error;
  }
  return { id: projectId, title: project.title, recoverablePath: trashedPath };
}

export async function createCreation(projectId, title) {
  const normalized = String(title || "").trim().slice(0, 80);
  if (!normalized) throw new Error("CREATION_TITLE_REQUIRED");
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    project.creations ||= [];
    const now = new Date().toISOString();
    const creation = { id: safeId("creation"), title: normalized, status: "draft", createdAt: now, updatedAt: now };
    project.creations.unshift(creation);
    project.updatedAt = now;
    appendEvent(state, "creation.created", `《${project.title}》已新建创作页“${normalized}”`, { projectId, creationId: creation.id });
    return creation;
  });
}

export async function updateProjectPlan(projectId, plan) {
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    project.creations ||= [];
    if (!project.creations.length) {
      const now = new Date().toISOString();
      project.creations.push({ id: safeId("creation"), title: "主创作页", status: "draft", createdAt: now, updatedAt: now });
    }
    if (plan.title !== undefined) project.title = String(plan.title).trim().slice(0, 80) || project.title;
    if (plan.logline !== undefined) project.logline = String(plan.logline).trim().slice(0, 500);
    if (plan.premise !== undefined) project.script.premise = String(plan.premise).trim().slice(0, 1200);
    if (Array.isArray(plan.scenes)) {
      project.script.scenes = plan.scenes.slice(0, 100).map((scene, index) => ({
        id: String(scene.id || `scene-${index + 1}`).slice(0, 80),
        heading: String(scene.heading || `场景 ${index + 1}`).slice(0, 160),
        summary: String(scene.summary || "").slice(0, 1200)
      }));
    }
    if (Array.isArray(plan.characters)) {
      project.characters = plan.characters.slice(0, 50).map((character, index) => ({
        id: String(character.id || `character-${index + 1}`).slice(0, 80),
        name: String(character.name || `角色 ${index + 1}`).slice(0, 80),
        visual: String(character.visual || "").slice(0, 1200)
      }));
    }
    if (Array.isArray(plan.shots)) {
      const previous = new Map(project.shots.map(shot => [shot.id, shot]));
      project.shots = plan.shots.slice(0, 300).map((shot, index) => {
        const id = String(shot.id || `shot-${index + 1}`).slice(0, 80);
        const existing = previous.get(id) || {};
        return {
          ...existing,
          id,
          order: index + 1,
          duration: Math.min(Math.max(Number(shot.duration || existing.duration || 3), 0.5), 30),
          scene: String(shot.scene || existing.scene || "未命名场景").slice(0, 160),
          framing: String(shot.framing || existing.framing || "中景").slice(0, 80),
          prompt: String(shot.prompt || existing.prompt || "").slice(0, 3000),
          subtitle: String(shot.subtitle || existing.subtitle || "").slice(0, 1000),
          status: existing.status || "planned"
        };
      });
    }
    project.currentStage = project.shots.length ? "storyboard" : project.characters.length ? "characters" : "story";
    project.status = project.shots.length ? "ready" : "draft";
    project.updatedAt = new Date().toISOString();
    project.creations[0].updatedAt = project.updatedAt;
    project.creations[0].status = project.shots.length ? "ready" : "draft";
    appendEvent(state, "project.plan_updated", `《${project.title}》的正式制作方案已更新`, { projectId, scenes: project.script.scenes.length, characters: project.characters.length, shots: project.shots.length });
    return project;
  });
}

async function updateJob(jobId, patch, eventMessage) {
  return mutateState(state => {
    const job = state.jobs.find(item => item.id === jobId);
    if (!job) throw new Error("JOB_NOT_FOUND");
    Object.assign(job, patch, { updatedAt: new Date().toISOString() });
    if (eventMessage) appendEvent(state, "job.updated", eventMessage, { jobId, projectId: job.projectId, stage: job.stage });
    return job;
  });
}

export async function startLocalRender(projectId) {
  const state = await readState();
  const project = state.projects.find(item => item.id === projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  if (!project.shots.length) throw new Error("PROJECT_HAS_NO_SHOTS");
  const existing = state.jobs.find(item => item.projectId === projectId && item.type === "local-render" && ["queued", "running"].includes(item.status));
  if (existing) return existing;
  const job = { id: safeId("job"), projectId, type: "local-render", status: "queued", stage: "queued", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), error: null };
  await mutateState(next => {
    next.jobs.unshift(job);
    appendEvent(next, "job.queued", `《${project.title}》本地剪辑已排队`, { jobId: job.id, projectId });
  });
  void runLocalRender(job.id, projectId);
  return job;
}

async function runLocalRender(jobId, projectId) {
  try {
    await updateJob(jobId, { status: "running", stage: "clips" }, "正在准备 Seedance 与静态漫画混合镜头");
    const state = await readState();
    const project = state.projects.find(item => item.id === projectId);
    const clipsDir = path.join(projectDir(projectId), "clips");
    const renderDir = path.join(projectDir(projectId), "renders", jobId);
    const clips = [];
    const clipDurations = [];
    for (let index = 0; index < project.shots.length; index += 1) {
      const shot = project.shots[index];
      let sourceClip;
      if (shot.clipPath) {
        await fs.access(shot.clipPath);
        sourceClip = shot.clipPath;
      } else {
        const asset = [...project.assets].reverse().find(item => item.shotId === shot.id && item.kind === "image");
        if (!asset?.localPath) throw new Error("SHOT_ASSET_OR_CLIP_REQUIRED");
        sourceClip = path.join(clipsDir, `${shot.id}-static.mp4`);
        await createShotVideo(asset.localPath, sourceClip, shot.duration, index);
      }
      const normalized = path.join(renderDir, `normalized-${String(index + 1).padStart(3, "0")}.mp4`);
      await normalizeVideoClip(sourceClip, normalized);
      clips.push(normalized);
      clipDurations.push(await probeDuration(normalized));
    }

    await updateJob(jobId, { stage: "render" }, "正在合成镜头、音轨和中文字幕");
    let cursor = 0;
    const subtitles = project.shots.map((shot, index) => {
      const start = cursor;
      cursor += clipDurations[index];
      return `${index + 1}\n${srtTimestamp(start)} --> ${srtTimestamp(cursor)}\n${shot.subtitle || " "}\n`;
    }).join("\n");
    const outputPath = path.join(projectDir(projectId), "outputs", `${jobId}.mp4`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await renderFinal({ clips, subtitles, outputPath, workingDir: renderDir });
    await mutateState(next => {
      const target = next.projects.find(item => item.id === projectId);
      target.outputs.unshift({ id: safeId("output"), kind: "video", localPath: outputPath, duration: cursor, createdAt: new Date().toISOString(), jobId });
      target.currentStage = "final";
      target.status = "rendered";
    });
    await updateJob(jobId, { status: "succeeded", stage: "complete", outputPath }, "本地混合剪辑成片已完成");
  } catch (error) {
    const failure = safeJobFailure(error);
    await updateJob(jobId, { status: "failed", stage: "failed", error: failure.message, errorCode: failure.code }, "本地剪辑未完成，素材和镜头均已保留");
  }
}

export async function createApproval(projectId, requested = {}) {
  const state = await readState();
  const project = state.projects.find(item => item.id === projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  if (!project.shots.length) throw new Error("PROJECT_HAS_NO_SHOTS");
  const { maxImageCalls, maxVideoCalls } = resolveApprovalLimits(project, state.settings, requested);
  const approval = {
    id: safeId("approval"), projectId, status: "pending", purpose: "生成当前项目尚缺的付费图片与视频镜头",
    maxImageCalls, maxVideoCalls, usedImageCalls: 0, usedVideoCalls: 0,
    createdAt: new Date().toISOString(), decidedAt: null
  };
  await mutateState(next => {
    next.approvals.unshift(approval);
    appendEvent(next, "approval.requested", `《${project.title}》真实模型批次等待审批`, { approvalId: approval.id, projectId, maxImageCalls, maxVideoCalls });
  });
  return approval;
}

export function resolveApprovalLimits(project, settings, requested = {}) {
  const shotCount = project.shots.length;
  const missingImages = settings.imageProvider === "ark-seedream"
    ? project.shots.filter(shot => !project.assets.some(asset => asset.shotId === shot.id && asset.kind === "image")).length
    : 0;
  const missingVideos = project.shots.filter(shot => !shot.clipPath).length;
  const bounded = (value, fallback) => Math.min(Math.max(Number(value ?? fallback) || 0, 0), shotCount);
  return {
    maxImageCalls: bounded(requested.maxImageCalls, missingImages),
    maxVideoCalls: bounded(requested.maxVideoCalls, missingVideos)
  };
}

export async function decideApproval(approvalId, decision) {
  if (!['approved', 'rejected'].includes(decision)) throw new Error("APPROVAL_DECISION_INVALID");
  return mutateState(state => {
    const approval = state.approvals.find(item => item.id === approvalId);
    if (!approval) throw new Error("APPROVAL_NOT_FOUND");
    if (approval.status !== "pending") throw new Error("APPROVAL_ALREADY_DECIDED");
    approval.status = decision;
    approval.decidedAt = new Date().toISOString();
    appendEvent(state, `approval.${decision}`, decision === "approved" ? "真实模型批次已批准" : "真实模型批次已拒绝", { approvalId, projectId: approval.projectId });
    return approval;
  });
}

export async function startRealPipeline(approvalId) {
  const state = await readState();
  const approval = state.approvals.find(item => item.id === approvalId);
  if (!approval || approval.status !== "approved") throw new Error("APPROVAL_REQUIRED");
  if (approval.jobId) throw new Error("APPROVAL_ALREADY_CONSUMED");
  const job = { id: safeId("job"), projectId: approval.projectId, approvalId, type: "real-pipeline", status: "queued", stage: "queued", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), error: null };
  await mutateState(next => {
    const target = next.approvals.find(item => item.id === approvalId);
    target.jobId = job.id;
    next.jobs.unshift(job);
    appendEvent(next, "job.queued", "真实模型批次已排队", { jobId: job.id, approvalId });
  });
  void runRealPipeline(job.id, approvalId);
  return job;
}

async function runRealPipeline(jobId, approvalId) {
  try {
    const apiKey = await readArkKey();
    let state = await readState();
    const approval = state.approvals.find(item => item.id === approvalId);
    const project = state.projects.find(item => item.id === approval.projectId);
    const settings = state.settings;
    await updateJob(jobId, { status: "running", stage: "images" }, "真实批次正在准备图片素材");

    for (const shot of project.shots) {
      state = await readState();
      const currentApproval = state.approvals.find(item => item.id === approvalId);
      const currentProject = state.projects.find(item => item.id === project.id);
      if (currentProject.assets.some(asset => asset.shotId === shot.id && asset.kind === "image")) continue;
      if (settings.imageProvider === "codex-imagegen") {
        const existingTask = state.tasks.find(task => task.projectId === project.id && task.shotId === shot.id && task.kind === "codex-imagegen" && ["queued", "claimed"].includes(task.status));
        if (existingTask) continue;
        const task = { id: safeId("task"), projectId: project.id, shotId: shot.id, kind: "codex-imagegen", status: "queued", prompt: shot.prompt, createdAt: new Date().toISOString(), claimedAt: null, completedAt: null };
        await mutateState(next => {
          next.tasks.push(task);
          appendEvent(next, "task.created", `镜头 ${shot.order} 等待 Codex Image Gen`, { taskId: task.id, projectId: project.id });
        });
        continue;
      }
      if (currentApproval.usedImageCalls >= currentApproval.maxImageCalls) break;
      const outputPath = path.join(projectDir(project.id), "assets", `${shot.id}-seedream.png`);
      const result = await generateSeedreamImage({ apiKey, baseUrl: settings.arkBaseUrl, model: settings.seedreamModel, prompt: shot.prompt, outputPath, watermark: settings.watermark });
      await mutateState(next => {
        const targetProject = next.projects.find(item => item.id === project.id);
        targetProject.assets.push({ id: safeId("asset"), projectId: project.id, shotId: shot.id, kind: "image", provider: "ark-seedream", localPath: result.outputPath, remoteUrl: result.remoteUrl, createdAt: new Date().toISOString() });
        const targetApproval = next.approvals.find(item => item.id === approvalId);
        targetApproval.usedImageCalls += 1;
      });
    }

    if (settings.imageProvider === "codex-imagegen") {
      const afterTasks = await readState();
      const afterProject = afterTasks.projects.find(item => item.id === project.id);
      const missingImages = afterProject.shots.filter(shot => !afterProject.assets.some(asset => asset.shotId === shot.id && asset.kind === "image" && asset.provider === "codex-imagegen"));
      if (missingImages.length) {
        await updateJob(jobId, { status: "waiting", stage: "codex-images" }, `还有 ${missingImages.length} 个镜头等待 Codex Image Gen 回填`);
        return;
      }
      const missingRemoteSources = afterProject.shots.map(shot => afterProject.assets.find(asset => asset.shotId === shot.id && asset.kind === "image" && asset.provider === "codex-imagegen")).filter(asset => asset && (!asset.remoteUrl || asset.remoteSource === "local-bridge"));
      try {
        for (const asset of missingRemoteSources) await ensureAssetRemoteUrl(project.id, asset.id);
      } catch (error) {
        const failure = safeJobFailure(error);
        await updateJob(jobId, { status: "waiting", stage: "asset-bridge", error: failure.message, errorCode: failure.code }, "参考图片等待受控 HTTPS 桥接");
        return;
      }
    }

    await updateJob(jobId, { stage: "videos" }, "真实批次正在生成视频镜头");
    state = await readState();
    const latestProject = state.projects.find(item => item.id === project.id);
    for (const shot of latestProject.shots) {
      if (shot.clipPath) continue;
      const latest = await readState();
      const currentApproval = latest.approvals.find(item => item.id === approvalId);
      const asset = latest.projects.find(item => item.id === project.id).assets.find(item => item.shotId === shot.id && item.kind === "image" && item.remoteUrl);
      if (!asset) throw new Error("SEEDANCE_REQUIRES_REMOTE_IMAGE_URL");
      let taskId = shot.providerTaskId;
      if (!taskId) {
        if (currentApproval.usedVideoCalls >= currentApproval.maxVideoCalls) break;
        taskId = await createSeedanceTask({ apiKey, baseUrl: settings.arkBaseUrl, model: settings.seedanceModel, prompt: shot.prompt, imageUrl: asset.remoteUrl, ratio: settings.ratio, resolution: settings.resolution, generateAudio: settings.generateAudio, watermark: settings.watermark, duration: Math.max(4, Math.round(shot.duration)) });
        await mutateState(next => {
          const targetApproval = next.approvals.find(item => item.id === approvalId);
          targetApproval.usedVideoCalls += 1;
          const targetShot = next.projects.find(item => item.id === project.id).shots.find(item => item.id === shot.id);
          targetShot.providerTaskId = taskId;
          targetShot.status = "video-running";
        });
      }
      const result = await waitForSeedanceTask({ apiKey, baseUrl: settings.arkBaseUrl, taskId, onStatus: async status => updateJob(jobId, { stage: `video-${shot.order}-${status}` }) });
      const outputPath = path.join(projectDir(project.id), "clips", `${shot.id}-seedance.mp4`);
      await downloadSeedanceVideo(result, outputPath);
      await mutateState(next => {
        const targetShot = next.projects.find(item => item.id === project.id).shots.find(item => item.id === shot.id);
        targetShot.clipPath = outputPath;
        targetShot.status = "video-ready";
      });
    }
    await updateJob(jobId, { status: "succeeded", stage: "videos-ready" }, "真实视频镜头已生成，可进入确定性剪辑");
  } catch (error) {
    const failure = safeJobFailure(error);
    await updateJob(jobId, { status: "failed", stage: "failed", error: failure.message, errorCode: failure.code }, "真实模型批次停止，已成功产物已保留");
  }
}

export async function resumeRealPipeline(jobId) {
  const state = await readState();
  const job = state.jobs.find(item => item.id === jobId);
  if (!job || job.type !== "real-pipeline") throw new Error("REAL_JOB_NOT_FOUND");
  if (job.status !== "waiting") throw new Error("REAL_JOB_NOT_WAITING");
  await updateJob(jobId, { status: "queued", stage: "resume-queued", error: null }, "真实模型批次准备续跑");
  void runRealPipeline(jobId, job.approvalId);
  return (await readState()).jobs.find(item => item.id === jobId);
}

export async function claimTask(taskId, actor = "codex") {
  return mutateState(state => {
    const task = state.tasks.find(item => item.id === taskId);
    if (!task) throw new Error("TASK_NOT_FOUND");
    if (task.status !== "queued") throw new Error("TASK_NOT_CLAIMABLE");
    task.status = "claimed";
    task.claimedBy = actor;
    task.claimedAt = new Date().toISOString();
    return task;
  });
}

export async function completeTask(taskId, localPath, remoteUrl = "") {
  const normalized = path.resolve(localPath);
  await fs.access(normalized);
  if (remoteUrl) {
    const parsed = new URL(String(remoteUrl));
    if (!["https:", "asset:"].includes(parsed.protocol)) throw new Error("REMOTE_IMAGE_URL_MUST_BE_HTTPS_OR_ASSET");
    remoteUrl = parsed.toString();
  }
  return mutateState(state => {
    const task = state.tasks.find(item => item.id === taskId);
    if (!task) throw new Error("TASK_NOT_FOUND");
    if (!['queued', 'claimed'].includes(task.status)) throw new Error("TASK_NOT_COMPLETABLE");
    task.status = "completed";
    task.completedAt = new Date().toISOString();
    task.localPath = normalized;
    task.remoteUrl = remoteUrl;
    const project = state.projects.find(item => item.id === task.projectId);
    project.assets.push({ id: safeId("asset"), projectId: task.projectId, shotId: task.shotId, kind: "image", provider: "codex-imagegen", localPath: normalized, remoteUrl, remoteSource: remoteUrl ? "external" : "", createdAt: new Date().toISOString() });
    appendEvent(state, "task.completed", "Codex Image Gen 素材已回填", { taskId, projectId: task.projectId, shotId: task.shotId });
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
    const asset = project.assets.find(item => item.shotId === task.shotId && item.kind === "image" && item.provider === "codex-imagegen");
    if (!asset) throw new Error("TASK_ASSET_NOT_FOUND");
    task.remoteUrl = normalized.toString();
    asset.remoteUrl = normalized.toString();
    asset.remoteSource = "external";
    appendEvent(state, "task.remote_source_attached", "Codex 图片的远程素材地址已补充", { taskId, projectId: task.projectId, shotId: task.shotId });
    return task;
  });
}
