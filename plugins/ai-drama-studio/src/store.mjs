import fs from "node:fs/promises";
import path from "node:path";
import { dataRoot, defaultSettings, lockedGenerationSettings } from "./config.mjs";

const statePath = path.join(dataRoot, "state.json");
let writeChain = Promise.resolve();

function freshState() {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
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
