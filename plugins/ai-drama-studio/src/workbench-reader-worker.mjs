import { parentPort } from "node:worker_threads";
import fs from "node:fs/promises";
import path from "node:path";
import { dataRoot } from "./config.mjs";
import { readState } from "./store.mjs";
import { workbenchState, registeredMediaPath } from "./workbench-state.mjs";
import { usageDashboard } from "./usage-dashboard.mjs";

const statePath = path.join(dataRoot, "state.json");
let revision, state, view;
async function version() {
  try { const stat = await fs.stat(statePath, { bigint: true }); return `${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`; }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}
async function readView(kind, filters) {
  const before = await version();
  if (!state || revision !== before) {
    state = await readState();
    const after = await version();
    // A concurrent atomic replacement must not label an older read as current.
    revision = before === after ? after : undefined;
    view = null;
  }
  if (kind === "usage") return usageDashboard(state, filters);
  if (kind === "local-tools") return { videoDepth: state.settings.videoDepthRuntime || null };
  if (kind === "workbench") return view ||= { ...workbenchState(state), revision };
  if (kind === "media") return registeredMediaPath(state, filters.kind, filters.id);
  throw new Error("WORKBENCH_READ_KIND_INVALID");
}
let queue = Promise.resolve();
parentPort.on("message", ({ id, kind, filters }) => {
  queue = queue.then(async () => {
    try { parentPort.postMessage({ id, result: await readView(kind, filters) }); }
    catch (error) { parentPort.postMessage({ id, error: error.message }); }
  });
});
