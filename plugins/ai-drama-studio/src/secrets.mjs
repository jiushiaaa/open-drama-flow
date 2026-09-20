import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { pluginRoot } from "./config.mjs";
import { platformPaths } from "./platform.mjs";
import { keychain } from "./keychain.mjs";

const secretDir = platformPaths().secretDir;
const secretPath = path.join(secretDir, "ark.key");
const speechSecretPath = path.join(secretDir, "doubao-speech.key");
const scriptPath = path.join(pluginRoot, "scripts", "secrets.ps1");

function runPowerShell(action, stdin = "", targetPath = secretPath) {
  if (process.platform === "darwin") return keychain(action, path.basename(targetPath), stdin);
  if (process.platform !== "win32") throw new Error("SECRET_STORE_PLATFORM_UNSUPPORTED");
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath, action, targetPath], {
      windowsHide: true,
      timeout: 15000,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.resume();
    child.stdin.on("error", () => {});
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`SECRET_STORE_${action.toUpperCase()}_FAILED`));
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
  if (process.platform === "darwin") return keychain("exists", path.basename(secretPath));
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

export async function saveSpeechKey(apiKey) {
  const normalized = String(apiKey || "").trim();
  if (normalized.length < 12 || normalized.length > 512 || /\s/.test(normalized)) throw new Error("SPEECH_KEY_FORMAT_INVALID");
  await fs.mkdir(secretDir, { recursive: true });
  await runPowerShell("protect", normalized, speechSecretPath);
}

export async function hasSpeechKey() {
  if (process.platform === "darwin") return keychain("exists", path.basename(speechSecretPath));
  try { const stat = await fs.stat(speechSecretPath); return stat.isFile() && stat.size > 0; }
  catch { return false; }
}

export async function readSpeechKey() {
  if (!(await hasSpeechKey())) throw new Error("SPEECH_KEY_NOT_CONFIGURED");
  return runPowerShell("unprotect", "", speechSecretPath);
}

export async function clearSpeechKey() { await runPowerShell("clear", "", speechSecretPath); }

const extraProviders = new Set(["fal", "replicate", "volc-billing-ak", "volc-billing-sk"]);
function providerSecretPath(provider) {
  if (!extraProviders.has(provider) && !/^vendor-[a-z0-9][a-z0-9-]{0,60}-(apikey|accesskey|secretkey)$/.test(provider)) throw new Error("SECRET_PROVIDER_INVALID");
  return path.join(secretDir, `${provider}.key`);
}
export async function hasProviderKey(provider) {
  const file = providerSecretPath(provider);
  if (process.platform === "darwin") return keychain("exists", path.basename(file));
  try { const stat = await fs.stat(file); return stat.isFile() && stat.size > 0; } catch { return false; }
}
export async function saveProviderKey(provider, value) {
  const file = providerSecretPath(provider), key = String(value || "").trim();
  if (key.length < 12 || key.length > 512 || /\s/.test(key)) throw new Error("PROVIDER_KEY_FORMAT_INVALID");
  await fs.mkdir(secretDir, { recursive: true }); await runPowerShell("protect", key, file);
}
export async function readProviderKey(provider) {
  if (!await hasProviderKey(provider)) throw new Error("PROVIDER_KEY_NOT_CONFIGURED");
  return runPowerShell("unprotect", "", providerSecretPath(provider));
}
export async function clearProviderKey(provider) { await runPowerShell("clear", "", providerSecretPath(provider)); }
