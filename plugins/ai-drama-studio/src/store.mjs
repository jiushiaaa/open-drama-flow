import fs from "node:fs/promises";
import path from "node:path";
import { dataRoot, defaultSettings, lockedGenerationSettings } from "./config.mjs";
import { normalizeProductionBrief } from "./production-harness.mjs";
import { normalizeMemoryEntry } from "./project-memory.mjs";

const statePath = path.join(dataRoot, "state.json");
const stateLockPath = path.join(dataRoot, "state.lock");
let writeChain = Promise.resolve();

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function acquireStateLock() {
  await fs.mkdir(dataRoot, { recursive: true });
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10_000) {
    try {
      const token = crypto.randomUUID();
      const handle = await fs.open(stateLockPath, "wx");
      await handle.writeFile(JSON.stringify({ pid: process.pid, token, acquiredAt: new Date().toISOString() }), "utf8");
      await handle.close();
      return async () => {
        try {
          const owner = JSON.parse(await fs.readFile(stateLockPath, "utf8"));
          if (owner.token === token) await fs.rm(stateLockPath, { force: true });
        } catch {}
      };
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      try {
        const stat = await fs.stat(stateLockPath);
        let owner = null;
        try { owner = JSON.parse(await fs.readFile(stateLockPath, "utf8")); } catch {}
        let ownerAlive = true;
        if (Number.isInteger(owner?.pid) && owner.pid > 0) {
          try { process.kill(owner.pid, 0); }
          catch (processError) { ownerAlive = processError?.code === "EPERM"; }
        } else if (Date.now() - stat.mtimeMs > 120_000) {
          ownerAlive = false;
        }
        if (!ownerAlive) {
          const stalePath = `${stateLockPath}.stale-${crypto.randomUUID()}`;
          try {
            await fs.rename(stateLockPath, stalePath);
            await fs.rm(stalePath, { force: true });
          } catch (moveError) {
            if (!["ENOENT", "EACCES", "EPERM"].includes(moveError?.code)) throw moveError;
          }
          continue;
        }
      } catch (statError) {
        if (statError?.code !== "ENOENT") throw statError;
      }
      await wait(25 + Math.floor(Math.random() * 50));
    }
  }
  throw new Error("STATE_LOCK_TIMEOUT");
}

function freshState() {
  const now = new Date().toISOString();
  return {
    schemaVersion: 5,
    updatedAt: now,
    settings: { ...defaultSettings },
    projects: [],
    jobs: [],
    approvals: [],
    tasks: [],
    providerCalls: [],
    events: [{ id: "evt-init", at: now, type: "studio.initialized", message: "制作台已初始化" }]
  };
}

async function ensureState() {
  await fs.mkdir(dataRoot, { recursive: true });
  try {
    await fs.access(statePath);
  } catch {
    await atomicWrite(freshState());
  }
}

async function atomicWrite(state) {
  await fs.mkdir(dataRoot, { recursive: true });
  const tempPath = `${statePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  let lastError = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await fs.rename(tempPath, statePath);
      return;
    } catch (error) {
      lastError = error;
      if (!["EACCES", "EBUSY", "EPERM"].includes(error?.code) || attempt === 7) break;
      await wait(20 * (attempt + 1));
    }
  }
  try { await fs.rm(tempPath, { force: true }); } catch {}
  throw lastError;
}

export async function readState() {
  await ensureState();
  const state = JSON.parse(await fs.readFile(statePath, "utf8"));
  state.schemaVersion = 5;
  for (const project of state.projects || []) {
    project.memories = (Array.isArray(project.memories) ? project.memories : []).map(memory => normalizeMemoryEntry({ ...memory, projectId: project.id }));
    project.brief = normalizeProductionBrief(project.brief, project.brief, { objective: project.logline || project.script?.premise || "", aspectRatio: state.settings?.ratio || defaultSettings.ratio });
    project.selectedSkills = Array.isArray(project.selectedSkills) ? project.selectedSkills.filter(Boolean).slice(0, 5) : [];
    project.planRevision = Math.max(0, Number(project.planRevision || 0));
    project.revisionHistory = Array.isArray(project.revisionHistory) ? project.revisionHistory.slice(-100) : [];
    project.pinned = Boolean(project.pinned);
    if (!Array.isArray(project.worlds)) project.worlds = [];
    for (const world of project.worlds) world.pinned = Boolean(world.pinned);
    if (!Array.isArray(project.assetFolders)) project.assetFolders = [];
    for (const folder of project.assetFolders) {
      folder.parentId ||= null;
      folder.scope ||= folder.creationId ? "creation" : folder.worldId ? "world" : "project";
      folder.worldId ||= null;
      folder.creationId ||= null;
    }
    for (const asset of project.assets || []) {
      asset.folderId ||= null;
      asset.familyId ||= asset.id;
      asset.version = Math.max(1, Number(asset.version || 1));
      asset.tags = Array.isArray(asset.tags) ? asset.tags : [];
      asset.scope ||= asset.creationId ? "creation" : asset.worldId ? "world" : "project";
      asset.worldId ||= null;
      asset.creationId ||= null;
    }
    if (!Array.isArray(project.creations)) project.creations = [];
    for (const creation of project.creations) {
      creation.pinned = Boolean(creation.pinned);
      creation.worldId ||= null;
      creation.type ||= "episode";
      creation.assetRefs = Array.isArray(creation.assetRefs) ? creation.assetRefs : [];
      creation.messages = Array.isArray(creation.messages) ? creation.messages : [];
      creation.canvas ||= {};
      creation.canvas.viewport ||= { x: 120, y: 90, zoom: 0.78 };
      creation.canvas.positions ||= {};
      if (!creation.plan && creation.id === `creation-${project.id}-main`) creation.planSource = "project-legacy";
      if (creation.plan) {
        creation.plan.brief = normalizeProductionBrief(creation.plan.brief, creation.plan.brief, { objective: creation.plan.logline || creation.plan.script?.premise || "", aspectRatio: state.settings?.ratio || defaultSettings.ratio });
        creation.plan.selectedSkills = Array.isArray(creation.plan.selectedSkills) ? creation.plan.selectedSkills.filter(Boolean).slice(0, 5) : [];
        creation.plan.planRevision = Math.max(0, Number(creation.plan.planRevision || 0));
        creation.plan.revisionHistory = Array.isArray(creation.plan.revisionHistory) ? creation.plan.revisionHistory.slice(-100) : [];
      }
    }
    for (const output of project.outputs || []) {
      output.reviews = Array.isArray(output.reviews) ? output.reviews : [];
      output.delivery ||= null;
    }
    const hasProduction = Boolean(project.shots?.length || project.characters?.length || project.script?.scenes?.length || project.outputs?.length);
    if (hasProduction && !project.creations.length) {
      project.creations.push({
        id: `creation-${project.id}-main`,
        title: "主创作页",
        status: project.shots?.length ? "ready" : "draft",
        pinned: false, worldId: null, type: "episode", planSource: "project-legacy", assetRefs: [], messages: [], canvas: { viewport: { x: 120, y: 90, zoom: 0.78 }, positions: {} },
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      });
    }
  }
  for (const task of state.tasks || []) {
    task.approvalId ||= null;
    task.inspection ||= null;
    task.callCharged = Boolean(task.callCharged);
  }
  state.providerCalls = Array.isArray(state.providerCalls) ? state.providerCalls : [];
  state.settings = { ...defaultSettings, ...state.settings, ...lockedGenerationSettings };
  return state;
}

export function mutateState(mutator) {
  const operation = writeChain.then(async () => {
    const release = await acquireStateLock();
    try {
      const state = await readState();
      const result = await mutator(state);
      state.updatedAt = new Date().toISOString();
      await atomicWrite(state);
      return result ?? state;
    } finally {
      await release();
    }
  });
  writeChain = operation.catch(() => undefined);
  return operation;
}

export async function resetStateForTest(targetRoot = dataRoot) {
  if (targetRoot !== dataRoot) throw new Error("TEST_ROOT_MISMATCH");
  await atomicWrite(freshState());
}

export function appendEvent(state, type, message, detail = {}) {
  state.events.unshift({
    id: `evt-${crypto.randomUUID()}`,
    at: new Date().toISOString(),
    type,
    message,
    detail
  });
  state.events = state.events.slice(0, 200);
}
