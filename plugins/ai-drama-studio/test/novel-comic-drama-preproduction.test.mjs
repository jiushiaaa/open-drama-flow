import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const isWindows = process.platform === "win32";
const fixtureRoot = path.resolve("test/fixtures/novel-preproduction");
const scriptsRoot = path.resolve("skills/novel-comic-drama-preproduction/scripts");

function runPowerShell(script, args) {
  return spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(scriptsRoot, script), ...args], {
    cwd: fixtureRoot,
    encoding: "utf8"
  });
}

test("valid novel preproduction fixture reaches the video approval gate", { skip: !isWindows }, async () => {
  const output = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "odf-novel-ready-")), "readiness.json");
  const result = runPowerShell("build-readiness-manifest.ps1", ["-ManifestPath", path.join(fixtureRoot, "manifest.json"), "-OutputPath", output]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const readiness = JSON.parse(await fs.readFile(output, "utf8"));
  assert.equal(readiness.status, "ready-for-video-approval");
  assert.equal(readiness.ready, true);
  assert.equal(readiness.videoStartApproved, false);
});

test("unapproved creative text blocks preproduction readiness", { skip: !isWindows }, async () => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "odf-novel-blocked-"));
  const manifest = JSON.parse(await fs.readFile(path.join(fixtureRoot, "manifest.json"), "utf8"));
  manifest.episodes[0].script.status = "draft";
  for (const name of ["source.md", "E01.script.md", "E01.overview.md", "E01.prompts.json", "approved-asset.md"]) {
    await fs.copyFile(path.join(fixtureRoot, name), path.join(temporaryRoot, name));
  }
  const manifestPath = path.join(temporaryRoot, "manifest.json");
  const output = path.join(temporaryRoot, "readiness.json");
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const result = runPowerShell("build-readiness-manifest.ps1", ["-ManifestPath", manifestPath, "-OutputPath", output]);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const readiness = JSON.parse(await fs.readFile(output, "utf8"));
  assert.equal(readiness.status, "needs-work");
  assert.ok(readiness.issues.includes("EPISODE_DOCUMENT_NOT_APPROVED:E01:script"));
});
