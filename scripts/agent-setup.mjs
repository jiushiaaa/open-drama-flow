#!/usr/bin/env node
// Read-only onboarding: never modifies host configuration or starts production.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

export function mcpConfig(root = repoRoot, executable = process.execPath, host = "generic", env = process.env, platform = process.platform) {
  if (!["codex", "generic"].includes(host)) throw new Error("AGENT_HOST_INVALID");
  const runtimeEnv = { AI_DRAMA_AGENT_HOST: host };
  if (platform === "darwin") runtimeEnv.PATH = [...new Set([path.dirname(executable), "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin", ...(env.PATH || "").split(":")].filter(Boolean))].join(":");
  return { mcpServers: { "ai-drama-studio": {
    command: executable,
    args: [path.resolve(root, "plugins/ai-drama-studio/src/mcp-server.mjs")],
    env: runtimeEnv
  } } };
}

export function checkEnvironment({ root = repoRoot, platform = process.platform, nodeVersion = process.versions.node, run = spawnSync } = {}) {
  const plugin = path.resolve(root, "plugins/ai-drama-studio");
  const checks = [
    { name: "Windows / macOS", ok: ["win32", "darwin"].includes(platform), remedy: "Use Windows or macOS. Linux/WSL secret storage is not implemented." },
    { name: "Node.js 20+", ok: Number(nodeVersion.split(".")[0]) >= 20, remedy: "Install Node.js 20 or newer, then restart your Agent to refresh PATH." },
    ...["src/mcp-server.mjs", "public/index.html", "skills/ai-drama-producer/SKILL.md"].map(file => ({ name: file, ok: existsSync(path.join(plugin, file)), remedy: "Use a complete repository checkout." }))
  ];
  let dependencies = true;
  try {
    const require = createRequire(path.join(plugin, "package.json"));
    for (const module of ["@modelcontextprotocol/sdk/client/index.js", "zod", "adm-zip", "lucide-static/package.json"]) require.resolve(module);
  } catch { dependencies = false; }
  checks.push({ name: "Node dependencies", ok: dependencies, remedy: "Run npm --prefix plugins/ai-drama-studio ci in an inactive checkout." });
  for (const command of ["ffmpeg", "ffprobe", ...(platform === "win32" ? ["powershell.exe"] : platform === "darwin" ? ["/usr/bin/security"] : [])]) {
    const args = command === "powershell.exe" ? ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"] : command === "/usr/bin/security" ? ["help"] : ["-version"];
    const result = run(command, args, { windowsHide: true, timeout: 10000, stdio: "ignore", shell: false });
    checks.push({ name: command, ok: !result.error && result.status === 0, remedy: "Install the executable and make it available in the Agent's PATH." });
  }
  return { ok: checks.every(check => check.ok), checks, scope: "Local prerequisites only; not host integration, credentials, GPU or paid generation verification." };
}

export function main(args = process.argv.slice(2)) {
  if (args[0] === "--print-config" && (args.length === 1 || (args.length === 3 && args[1] === "--host" && ["codex", "generic"].includes(args[2])))) {
    console.log(JSON.stringify(mcpConfig(repoRoot, process.execPath, args[2] || "generic"), null, 2));
    return 0;
  }
  if (args.length === 1 && args[0] === "--check") {
    const report = checkEnvironment();
    console.log(JSON.stringify(report, null, 2));
    return report.ok ? 0 : 1;
  }
  console.log("Usage: node scripts/agent-setup.mjs --check | --print-config [--host generic|codex]\nRead AGENT_GUIDE.md before configuring a host. No files or credentials are written. Generic hosts require an image-provider API key; Codex defaults to its built-in image tool.");
  return args.length === 0 || (args.length === 1 && args[0] === "--help") ? 0 : 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
