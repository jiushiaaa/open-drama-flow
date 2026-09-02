import fs from "node:fs/promises";
import path from "node:path";
import { dataRoot, defaultSettings, lockedGenerationSettings } from "./config.mjs";

const statePath = path.join(dataRoot, "state.json");
let writeChain = Promise.resolve();

function freshState() {
  const now = new Date().toISOString();
  return {
    schemaVersion: 3,
    updatedAt: now,
    settings: { ...defaultSettings },
    projects: [],
    jobs: [],
    approvals: [],
    tasks: [],
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
  const tempPath = `${statePath}.${process.pid}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, statePath);
}

export async function readState() {
  await ensureState();
  const state = JSON.parse(await fs.readFile(statePath, "utf8"));
  state.schemaVersion = 3;
  for (const project of state.projects || []) {
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
    }
    const hasProduction = Boolean(project.shots?.length || project.characters?.length || project.script?.scenes?.length || project.outputs?.length);
    if (hasProduction && !project.creations.length) {
      project.creations.push({
        id: `creation-${project.id}-main`,
        title: "主创作页",
        status: project.shots?.length ? "ready" : "draft",
        pinned: false, worldId: null, type: "episode", assetRefs: [], messages: [], canvas: { viewport: { x: 120, y: 90, zoom: 0.78 }, positions: {} },
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      });
    }
  }
  state.settings = { ...defaultSettings, ...state.settings, ...lockedGenerationSettings };
  return state;
}

export function mutateState(mutator) {
  const operation = writeChain.then(async () => {
    const state = await readState();
    const result = await mutator(state);
    state.updatedAt = new Date().toISOString();
    await atomicWrite(state);
    return result ?? state;
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
