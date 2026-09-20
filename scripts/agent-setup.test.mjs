import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { mcpConfig, checkEnvironment } from "./agent-setup.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
test("stdio configuration uses absolute paths with spaces and Unicode, without shell quoting or credentials", () => {
  const directory = path.resolve(root, "fictional checkout 中文");
  const executable = path.resolve(root, "Node runtime/node.exe");
  const config = JSON.parse(JSON.stringify(mcpConfig(directory, executable))).mcpServers["ai-drama-studio"];
  assert.equal(config.command, executable);
  assert.deepEqual(config.args, [path.join(directory, "plugins/ai-drama-studio/src/mcp-server.mjs")]);
  assert.equal(config.env.AI_DRAMA_AGENT_HOST, "generic");
  assert.deepEqual(Object.keys(config).sort(), ["args", "command", "env"]);
});
test("doctor rejects unsupported platforms and old Node without claiming account verification", () => {
  const report = checkEnvironment({ platform: "linux", nodeVersion: "18.0.0", run: () => ({ status: 0 }) });
  assert.equal(report.ok, false);
  assert.equal(report.checks.find(c => c.name === "Windows / macOS").ok, false);
  assert.equal(report.checks.find(c => c.name === "Node.js 20+").ok, false);
  assert.match(report.scope, /not host integration/);
});
test("macOS doctor uses Keychain not PowerShell and configuration supplies desktop executable PATH", () => {
  const commands = [];
  const report = checkEnvironment({ platform: "darwin", nodeVersion: "22.0.0", run: (command, args) => { commands.push([command, args]); return { status: 0 }; } });
  assert.equal(report.checks.find(c => c.name === "Windows / macOS").ok, true);
  assert.ok(commands.some(([c]) => c === "/usr/bin/security"));
  assert.ok(!commands.some(([c]) => c.includes("powershell")));
  const config = mcpConfig(root, "/opt/homebrew/bin/node", "generic", { PATH: "/usr/bin:/bin" }, "darwin").mcpServers["ai-drama-studio"];
  assert.ok(config.env.PATH.includes("/opt/homebrew/bin"));
  assert.equal(mcpConfig(root, process.execPath, "codex").mcpServers["ai-drama-studio"].env.AI_DRAMA_AGENT_HOST, "codex");
  assert.throws(() => mcpConfig(root, process.execPath, "unknown"), /AGENT_HOST_INVALID/);
});
test("doctor reports absent checkout and failed or timed-out executables", () => {
  const report = checkEnvironment({ root: path.join(root, "nonexistent-checkout-for-test"), platform: "win32", nodeVersion: "20.0.0", run: () => ({ status: null, error: new Error("ENOENT") }) });
  assert.equal(report.ok, false);
  for (const name of ["src/mcp-server.mjs", "Node dependencies", "ffmpeg", "ffprobe", "powershell.exe"]) assert.equal(report.checks.find(c => c.name === name).ok, false);
});
test("CLI produces clean JSON from a different cwd and rejects unknown options", () => {
  const script = path.join(root, "scripts/agent-setup.mjs");
  const result = spawnSync(process.execPath, [script, "--print-config"], { cwd: path.dirname(root), encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), mcpConfig());
  const invalid = spawnSync(process.execPath, [script, "--install"], { encoding: "utf8", windowsHide: true });
  assert.equal(invalid.status, 2);
});
