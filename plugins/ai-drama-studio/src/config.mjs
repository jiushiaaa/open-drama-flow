import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

export const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const workspaceRoot = path.resolve(pluginRoot, "..", "..");
const localAppDataRoot = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
export const runtimeRoot = path.join(localAppDataRoot, "OpenDramaFlow");
export const dataRoot = path.resolve(process.env.AI_DRAMA_DATA_DIR || path.join(runtimeRoot, "data"));
export const runtimeBinRoot = path.join(runtimeRoot, "bin");
export const userSkillsRoot = path.join(dataRoot, "skills");
export const publicRoot = path.join(pluginRoot, "public");
export const host = "127.0.0.1";
export const port = Number.parseInt(process.env.AI_DRAMA_PORT || "4317", 10);
export const assetBridgePort = Number.parseInt(process.env.AI_DRAMA_BRIDGE_PORT || String(port + 1), 10);
export const assetBridgeControlPort = Number.parseInt(process.env.AI_DRAMA_BRIDGE_CONTROL_PORT || "4040", 10);

export const lockedGenerationSettings = {
  arkBaseUrl: "https://ark.cn-beijing.volces.com/api/v3",
  imageProvider: "codex-imagegen",
  seedreamModel: "doubao-seedream-5-0-260128",
  seedanceModel: "doubao-seedance-2-5-260628",
  ratio: "9:16",
  resolution: "720p",
  generateAudio: false,
  watermark: false
};

export const defaultSettings = {
  ...lockedGenerationSettings,
  publicAssetBaseUrl: ""
};

export const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
export const allowedVideoExtensions = new Set([".mp4", ".mov"]);
export const allowedAudioExtensions = new Set([".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"]);
export const allowedDocumentExtensions = new Set([".docx", ".doc", ".md", ".txt", ".pdf", ".json"]);
export const allowedSpreadsheetExtensions = new Set([".xlsx", ".xls", ".csv"]);

export function safeId(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}

export function assertInside(parent, candidate) {
  const parentPath = path.resolve(parent);
  const candidatePath = path.resolve(candidate);
  const relative = path.relative(parentPath, candidatePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("PATH_OUTSIDE_WORKSPACE");
  }
  return candidatePath;
}
