import path from "node:path";
import { assertInside, dataRoot, mediaRoot, workspaceRoot } from "./config.mjs";

export function registeredMediaPath(state, kind, id) {
  const collection = kind === "assets" ? state.projects.flatMap(project => project.assets)
    : kind === "outputs" ? state.projects.flatMap(project => project.outputs) : [];
  const item = collection.find(entry => entry.id === id);
  if (!item?.localPath) throw new Error("FILE_NOT_FOUND");
  const candidate = path.resolve(item.localPath);
  for (const root of [dataRoot, mediaRoot, workspaceRoot]) {
    try { return assertInside(root, candidate); } catch {}
  }
  throw new Error("PATH_OUTSIDE_WORKSPACE");
}

// Display-only projection. Production snapshots and history remain in the store.
const pick = (value, keys) => Object.fromEntries(keys.filter(key => value[key] !== undefined).map(key => [key, value[key]]));
const planView = plan => ({
  logline: plan.logline, script: { premise: plan.script?.premise },
  characters: (plan.characters || []).map(item => pick(item, ["id", "name", "visual"])),
  shots: (plan.shots || []).map(item => pick(item, ["id", "order", "scene", "prompt", "subtitle", "framing", "duration", "status"]))
});
export function workbenchState(state) {
  return {
    updatedAt: state.updatedAt,
    projects: (state.projects || []).map(project => ({
      ...pick(project, ["id", "title", "status", "currentStage", "pinned", "createdAt", "updatedAt"]), ...planView(project),
      worlds: (project.worlds || []).map(item => pick(item, ["id", "title", "description", "pinned", "createdAt", "updatedAt"])),
      assetFolders: (project.assetFolders || []).map(item => pick(item, ["id", "name", "parentId", "scope", "worldId", "creationId", "createdAt", "updatedAt"])),
      assets: (project.assets || []).map(item => ({ ...pick(item, ["id", "kind", "originalName", "size", "version", "folderId", "scope", "worldId", "creationId", "shotId", "createdAt", "updatedAt"]), mediaUrl: `/media/assets/${encodeURIComponent(item.id)}` })),
      outputs: (project.outputs || []).map(item => ({ ...pick(item, ["id", "creationId", "duration", "createdAt"]), mediaUrl: `/media/outputs/${encodeURIComponent(item.id)}` })),
      creations: (project.creations || []).map(item => ({
        ...pick(item, ["id", "title", "status", "type", "pinned", "worldId", "createdAt", "updatedAt", "canvas"]),
        assetRefs: (item.assetRefs || []).map(ref => pick(ref, ["assetId", "version"])),
        messages: (item.messages || []).filter(message => message.role === "user").slice(-5).map(message => pick(message, ["id", "role", "content"])),
        ...(item.plan ? { plan: planView(item.plan) } : {})
      }))
    })),
    jobs: (state.jobs || []).map(item => pick(item, ["id", "projectId", "type", "status", "stage"])),
    approvals: (state.approvals || []).map(item => pick(item, ["id", "projectId", "status", "jobId", "maxVideoCalls", "usedVideoCalls"])),
    events: (state.events || []).map(item => ({ ...pick(item, ["id", "at", "message"]), detail: { projectId: item.detail?.projectId } }))
  };
}
