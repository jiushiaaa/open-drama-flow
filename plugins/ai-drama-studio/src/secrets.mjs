import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { pluginRoot } from "./config.mjs";

const secretDir = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "AIDramaStudio");
const secretPath = path.join(secretDir, "ark.key");
const scriptPath = path.join(pluginRoot, "scripts", "secrets.ps1");

function runPowerShell(action, stdin = "") {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath, action, secretPath], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`SECRET_STORE_${action.toUpperCase()}_FAILED: ${stderr.trim()}`));
    });
    child.stdin.end(stdin, "utf8");
  });
}

export async function saveArkKey(apiKey) {
  const normalized = String(apiKey || "").trim();
  if (normalized.length < 12 || normalized.length > 512 || /\s/.test(normalized)) {
    throw new Error("ARK_KEY_FORMAT_INVALID");
  }
  await fs.mkdir(secretDir, { recursive: true });
  await runPowerShell("protect", normalized);
}

export async function readArkKey() {
  if (!(await hasArkKey())) throw new Error("ARK_KEY_NOT_CONFIGURED");
  return runPowerShell("unprotect");
}

export async function clearArkKey() {
  await runPowerShell("clear");
}

export async function hasArkKey() {
  try {
    const stat = await fs.stat(secretPath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

export function credentialStatusPathForDebug() {
  return secretPath;
}
