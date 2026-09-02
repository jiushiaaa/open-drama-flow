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
  return creation.plan || project;
}

function assetBelongsToCreation(asset, creationId, referencedIds = new Set()) {
  return !creationId || asset.creationId === creationId || referencedIds.has(asset.id);
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
    status: "draft", currentStage: "story", pinned: false, createdAt: now, updatedAt: now,
    script: { premise: "", scenes: [] }, characters: [], shots: [], assets: [], assetFolders: baseProjectFolders(now), worlds: [], outputs: [], creations: []
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
    const creation = { id: safeId("creation"), title: normalized, status: "draft", pinned: false, worldId: world?.id || null, type, assetRefs: [], messages: [], canvas: canvasDefaults(), createdAt: now, updatedAt: now };
    project.creations.unshift(creation);
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
    if (patch.title !== undefined) {
      const title = String(patch.title || "").trim().slice(0, 80);
      if (!title) throw new Error("CREATION_TITLE_REQUIRED");
      creation.title = title;
    }
    if (patch.pinned !== undefined) creation.pinned = Boolean(patch.pinned);
    if (patch.worldId !== undefined) creation.worldId = requireWorld(project, patch.worldId || null)?.id || null;
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
      creation.assetRefs = patch.assetRefs.slice(0, 1000).map(ref => {
        const asset = project.assets?.find(item => item.id === String(ref.assetId || ""));
        if (!asset) throw new Error("ASSET_NOT_FOUND");
        return { assetId: asset.id, version: asset.version || 1, locked: Boolean(ref.locked), addedAt: ref.addedAt || new Date().toISOString() };
      });
    }
    creation.updatedAt = new Date().toISOString();
    project.updatedAt = creation.updatedAt;
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

export async function updateProjectPlan(projectId, plan) {
  return mutateState(state => {
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    project.creations ||= [];
    if (!project.creations.length) {
      const now = new Date().toISOString();
      project.creations.push({ id: safeId("creation"), title: "主创作页", status: "draft", pinned: false, worldId: null, type: "episode", assetRefs: [], messages: [], canvas: canvasDefaults(), createdAt: now, updatedAt: now });
    }
    const creation = plan.creationId ? project.creations.find(item => item.id === plan.creationId) : project.creations[0];
    if (plan.creationId && !creation) throw new Error("CREATION_NOT_FOUND");
    const target = plan.creationId ? (creation.plan ||= { logline: "", script: { premise: "", scenes: [] }, characters: [], shots: [] }) : project;
    target.script ||= { premise: "", scenes: [] };
    target.characters ||= [];
    target.shots ||= [];
    if (plan.title !== undefined) {
      const title = String(plan.title).trim().slice(0, 80);
      if (title) { if (plan.creationId) creation.title = title; else project.title = title; }
    }
    if (plan.logline !== undefined) target.logline = String(plan.logline).trim().slice(0, 500);
    if (plan.premise !== undefined) target.script.premise = String(plan.premise).trim().slice(0, 1200);
    if (Array.isArray(plan.scenes)) {
      target.script.scenes = plan.scenes.slice(0, 100).map((scene, index) => ({
        id: String(scene.id || `scene-${index + 1}`).slice(0, 80),
        heading: String(scene.heading || `场景 ${index + 1}`).slice(0, 160),
        summary: String(scene.summary || "").slice(0, 1200)
      }));
    }
    if (Array.isArray(plan.characters)) {
      target.characters = plan.characters.slice(0, 50).map((character, index) => ({
        id: String(character.id || `character-${index + 1}`).slice(0, 80),
        name: String(character.name || `角色 ${index + 1}`).slice(0, 80),
        visual: String(character.visual || "").slice(0, 1200)
      }));
    }
    if (Array.isArray(plan.shots)) {
      const previous = new Map(target.shots.map(shot => [shot.id, shot]));
      target.shots = plan.shots.slice(0, 300).map((shot, index) => {
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
    target.currentStage = target.shots.length ? "storyboard" : target.characters.length ? "characters" : "story";
    target.status = target.shots.length ? "ready" : "draft";
    if (!plan.creationId) { project.currentStage = target.currentStage; project.status = target.status; }
    project.updatedAt = new Date().toISOString();
    creation.updatedAt = project.updatedAt;
    creation.status = target.status;
    appendEvent(state, "project.plan_updated", `《${project.title}》${plan.creationId ? `的创作页“${creation.title}”` : ""}正式制作方案已更新`, { projectId, creationId: plan.creationId || null, scenes: target.script.scenes.length, characters: target.characters.length, shots: target.shots.length });
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

export async function startLocalRender(projectId, creationId = null) {
  const state = await readState();
  const project = state.projects.find(item => item.id === projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const creation = creationId ? project.creations?.find(item => item.id === creationId) : null;
  if (creationId && !creation) throw new Error("CREATION_NOT_FOUND");
  const production = creation?.plan || project;
  if (!production.shots.length) throw new Error("PROJECT_HAS_NO_SHOTS");
  const existing = state.jobs.find(item => item.projectId === projectId && item.creationId === creationId && item.type === "local-render" && ["queued", "running"].includes(item.status));
  if (existing) return existing;
  const job = { id: safeId("job"), projectId, creationId, type: "local-render", status: "queued", stage: "queued", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), error: null };
  await mutateState(next => {
    next.jobs.unshift(job);
    appendEvent(next, "job.queued", `《${project.title}》本地剪辑已排队`, { jobId: job.id, projectId });
  });
  void runLocalRender(job.id, projectId, creationId);
  return job;
}

async function runLocalRender(jobId, projectId, creationId = null) {
  try {
    await updateJob(jobId, { status: "running", stage: "clips" }, "正在准备 Seedance 与静态漫画混合镜头");
    const state = await readState();
    const project = state.projects.find(item => item.id === projectId);
    const creation = creationId ? project.creations?.find(item => item.id === creationId) : null;
    const production = creation?.plan || project;
    const clipsDir = path.join(projectDir(projectId), "clips");
    const renderDir = path.join(projectDir(projectId), "renders", jobId);
    const clips = [];
    const clipDurations = [];
    for (let index = 0; index < production.shots.length; index += 1) {
      const shot = production.shots[index];
      let sourceClip;
      if (shot.clipPath) {
        await fs.access(shot.clipPath);
        sourceClip = shot.clipPath;
      } else {
        const referencedIds = new Set((creation?.assetRefs || []).map(ref => ref.assetId));
        const asset = [...project.assets].reverse().find(item => item.shotId === shot.id && item.kind === "image" && (!creationId || item.creationId === creationId || referencedIds.has(item.id)));
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
      target.outputs.unshift({ id: safeId("output"), creationId, kind: "video", localPath: outputPath, duration: cursor, createdAt: new Date().toISOString(), jobId });
      target.currentStage = "final";
      target.status = "rendered";
      const creation = creationId ? target.creations?.find(item => item.id === creationId) : null;
      if (creation) {
        creation.status = "rendered";
        creation.assetRefs = (creation.assetRefs || []).map(ref => ({ ...ref, locked: true, lockedAt: new Date().toISOString() }));
        creation.updatedAt = new Date().toISOString();
      }
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
  const creationId = requested.creationId || null;
  const production = productionUnit(project, creationId);
  if (!production.shots.length) throw new Error("PROJECT_HAS_NO_SHOTS");
  const references = new Set((creationId ? project.creations.find(item => item.id === creationId)?.assetRefs : []).map(ref => ref.assetId));
  const scoped = { shots: production.shots, assets: project.assets.filter(asset => assetBelongsToCreation(asset, creationId, references)) };
  const { maxImageCalls, maxVideoCalls } = resolveApprovalLimits(scoped, state.settings, requested);
  const approval = {
    id: safeId("approval"), projectId, creationId, status: "pending", purpose: "生成当前创作页尚缺的付费图片与视频镜头",
    maxImageCalls, maxVideoCalls, usedImageCalls: 0, usedVideoCalls: 0,
    createdAt: new Date().toISOString(), decidedAt: null
  };
  await mutateState(next => {
    next.approvals.unshift(approval);
    appendEvent(next, "approval.requested", `《${project.title}》真实模型批次等待审批`, { approvalId: approval.id, projectId, creationId, maxImageCalls, maxVideoCalls });
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
  const job = { id: safeId("job"), projectId: approval.projectId, creationId: approval.creationId || null, approvalId, type: "real-pipeline", status: "queued", stage: "queued", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), error: null };
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
    const creationId = approval.creationId || null;
    const production = productionUnit(project, creationId);
    const creation = creationId ? project.creations.find(item => item.id === creationId) : null;
    const referencedIds = new Set((creation?.assetRefs || []).map(ref => ref.assetId));
    const settings = state.settings;
    await updateJob(jobId, { status: "running", stage: "images" }, "真实批次正在准备图片素材");

    for (const shot of production.shots) {
      state = await readState();
      const currentApproval = state.approvals.find(item => item.id === approvalId);
      const currentProject = state.projects.find(item => item.id === project.id);
      if (currentProject.assets.some(asset => asset.shotId === shot.id && asset.kind === "image" && assetBelongsToCreation(asset, creationId, referencedIds))) continue;
      if (settings.imageProvider === "codex-imagegen") {
        const existingTask = state.tasks.find(task => task.projectId === project.id && task.creationId === creationId && task.shotId === shot.id && task.kind === "codex-imagegen" && ["queued", "claimed"].includes(task.status));
        if (existingTask) continue;
        const task = { id: safeId("task"), projectId: project.id, creationId, worldId: creation?.worldId || null, shotId: shot.id, kind: "codex-imagegen", status: "queued", prompt: shot.prompt, createdAt: new Date().toISOString(), claimedAt: null, completedAt: null };
        await mutateState(next => {
          next.tasks.push(task);
          appendEvent(next, "task.created", `镜头 ${shot.order} 等待 Codex Image Gen`, { taskId: task.id, projectId: project.id, creationId });
        });
        continue;
      }
      if (currentApproval.usedImageCalls >= currentApproval.maxImageCalls) break;
      const outputPath = path.join(projectDir(project.id), "assets", `${shot.id}-seedream.png`);
      const result = await generateSeedreamImage({ apiKey, baseUrl: settings.arkBaseUrl, model: settings.seedreamModel, prompt: shot.prompt, outputPath, watermark: settings.watermark });
      await mutateState(next => {
        const targetProject = next.projects.find(item => item.id === project.id);
        const assetId = safeId("asset");
        targetProject.assets.push({ id: assetId, familyId: assetId, version: 1, tags: [], scope: creationId ? "creation" : "project", worldId: creation?.worldId || null, creationId, folderId: null, projectId: project.id, shotId: shot.id, kind: "image", provider: "ark-seedream", localPath: result.outputPath, remoteUrl: result.remoteUrl, createdAt: new Date().toISOString() });
        const targetApproval = next.approvals.find(item => item.id === approvalId);
        targetApproval.usedImageCalls += 1;
      });
    }

    if (settings.imageProvider === "codex-imagegen") {
      const afterTasks = await readState();
      const afterProject = afterTasks.projects.find(item => item.id === project.id);
      const afterProduction = productionUnit(afterProject, creationId);
      const afterCreation = creationId ? afterProject.creations.find(item => item.id === creationId) : null;
      const afterRefs = new Set((afterCreation?.assetRefs || []).map(ref => ref.assetId));
      const missingImages = afterProduction.shots.filter(shot => !afterProject.assets.some(asset => asset.shotId === shot.id && asset.kind === "image" && asset.provider === "codex-imagegen" && assetBelongsToCreation(asset, creationId, afterRefs)));
      if (missingImages.length) {
        await updateJob(jobId, { status: "waiting", stage: "codex-images" }, `还有 ${missingImages.length} 个镜头等待 Codex Image Gen 回填`);
        return;
      }
      const missingRemoteSources = afterProduction.shots.map(shot => afterProject.assets.find(asset => asset.shotId === shot.id && asset.kind === "image" && asset.provider === "codex-imagegen" && assetBelongsToCreation(asset, creationId, afterRefs))).filter(asset => asset && (!asset.remoteUrl || asset.remoteSource === "local-bridge"));
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
    const latestProduction = productionUnit(latestProject, creationId);
    const latestCreation = creationId ? latestProject.creations.find(item => item.id === creationId) : null;
    const latestRefs = new Set((latestCreation?.assetRefs || []).map(ref => ref.assetId));
    for (const shot of latestProduction.shots) {
      if (shot.clipPath) continue;
      const latest = await readState();
      const currentApproval = latest.approvals.find(item => item.id === approvalId);
      const asset = latest.projects.find(item => item.id === project.id).assets.find(item => item.shotId === shot.id && item.kind === "image" && item.remoteUrl && assetBelongsToCreation(item, creationId, latestRefs));
      if (!asset) throw new Error("SEEDANCE_REQUIRES_REMOTE_IMAGE_URL");
      let taskId = shot.providerTaskId;
      if (!taskId) {
        if (currentApproval.usedVideoCalls >= currentApproval.maxVideoCalls) break;
        taskId = await createSeedanceTask({ apiKey, baseUrl: settings.arkBaseUrl, model: settings.seedanceModel, prompt: shot.prompt, imageUrl: asset.remoteUrl, ratio: settings.ratio, resolution: settings.resolution, generateAudio: settings.generateAudio, watermark: settings.watermark, duration: Math.max(4, Math.round(shot.duration)) });
        await mutateState(next => {
          const targetApproval = next.approvals.find(item => item.id === approvalId);
          targetApproval.usedVideoCalls += 1;
          const targetShot = productionUnit(next.projects.find(item => item.id === project.id), creationId).shots.find(item => item.id === shot.id);
          targetShot.providerTaskId = taskId;
          targetShot.status = "video-running";
        });
      }
      const result = await waitForSeedanceTask({ apiKey, baseUrl: settings.arkBaseUrl, taskId, onStatus: async status => updateJob(jobId, { stage: `video-${shot.order}-${status}` }) });
      const outputPath = path.join(projectDir(project.id), "clips", `${shot.id}-seedance.mp4`);
      await downloadSeedanceVideo(result, outputPath);
      await mutateState(next => {
        const targetShot = productionUnit(next.projects.find(item => item.id === project.id), creationId).shots.find(item => item.id === shot.id);
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
    const assetId = safeId("asset");
    project.assets.push({ id: assetId, familyId: assetId, version: 1, tags: [], scope: task.creationId ? "creation" : "project", worldId: task.worldId || null, creationId: task.creationId || null, folderId: null, projectId: task.projectId, shotId: task.shotId, kind: "image", provider: "codex-imagegen", localPath: normalized, remoteUrl, remoteSource: remoteUrl ? "external" : "", createdAt: new Date().toISOString() });
    if (task.creationId) {
      const creation = project.creations?.find(item => item.id === task.creationId);
      if (creation && !(creation.assetRefs || []).some(ref => ref.assetId === assetId)) {
        creation.assetRefs ||= [];
        creation.assetRefs.push({ assetId, version: 1, locked: false, addedAt: new Date().toISOString() });
      }
    }
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
    const asset = project.assets.find(item => item.shotId === task.shotId && item.kind === "image" && item.provider === "codex-imagegen" && item.creationId === (task.creationId || null));
    if (!asset) throw new Error("TASK_ASSET_NOT_FOUND");
    task.remoteUrl = normalized.toString();
    asset.remoteUrl = normalized.toString();
    asset.remoteSource = "external";
    appendEvent(state, "task.remote_source_attached", "Codex 图片的远程素材地址已补充", { taskId, projectId: task.projectId, shotId: task.shotId });
    return task;
  });
}
