import path from "node:path";
import os from "node:os";

export function platformPaths(platform = process.platform, env = process.env, home = os.homedir()) {
  const paths = platform === "win32" ? path.win32 : path.posix;
  const base = platform === "win32" ? env.LOCALAPPDATA || paths.join(home, "AppData", "Local")
    : platform === "darwin" ? paths.join(home, "Library", "Application Support")
      : env.XDG_DATA_HOME || paths.join(home, ".local", "share");
  return { runtimeRoot: paths.join(base, "OpenDramaFlow"), secretDir: paths.join(base, "AIDramaStudio") };
}

export function hostProfile(env = process.env) {
  // Native Codex packages predate this setting; preserve their established default.
  const host = env.AI_DRAMA_AGENT_HOST || "codex";
  if (!["codex", "generic"].includes(host)) throw new Error("AGENT_HOST_INVALID");
  return { host, codexImageGen: host === "codex", imageProvider: host === "codex" ? "codex-imagegen" : "ark-seedream" };
}

export const agentHost = hostProfile();
