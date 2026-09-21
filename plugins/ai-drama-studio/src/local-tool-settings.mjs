import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

// Reference configuration for Agent-operated depth processing, not an execution API.
const absolutePath = z.string().trim().min(1).max(2048).refine(value => path.isAbsolute(value), "Absolute path required");
export const videoDepthSettingsSchema = z.object({
  python: absolutePath,
  repository: absolutePath,
  checkpoint: absolutePath
}).strict();

export async function validateVideoDepthSettings(input) {
  const config = videoDepthSettingsSchema.parse(input);
  for (const [name, file] of Object.entries(config)) {
    const stat = await fs.stat(file).catch(() => null);
    if (!stat || !(name === "repository" ? stat.isDirectory() : stat.isFile())) throw new Error(`LOCAL_TOOL_PATH_INVALID: ${name}`);
  }
  const script = await fs.stat(path.join(config.repository, "run.py")).catch(() => null);
  if (!script?.isFile()) throw new Error("LOCAL_TOOL_ENTRY_MISSING: run.py");
  return config;
}
