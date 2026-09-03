// Migrate only the Skill enable registry, never production assets or frozen history.
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { dataRoot } from "../src/config.mjs";
import { migrateSkillSettings } from "../src/skill-identifiers.mjs";

export async function migrateSkillRegistry(root = dataRoot, {check = false} = {}) {
  const file = path.resolve(root, "skill-registry.json");
  let before;
  try { before = await fs.readFile(file, "utf8"); }
  catch (error) { if (error.code === "ENOENT") return {changed: false}; throw error; }
  const state = JSON.parse(before);
  const enabled = migrateSkillSettings(state.enabled || {});
  if (JSON.stringify(enabled) === JSON.stringify(state.enabled || {})) return {changed: false};
  if (check) return {changed: true};
  // Write a unique recoverable snapshot before replacing this single known file.
  const backup = `${file}.before-identifiers-${crypto.randomUUID()}.bak`;
  await fs.writeFile(backup, before, {flag: "wx"});
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify({...state, enabled}, null, 2)}\n`, {flag: "wx"});
  // Do not overwrite a concurrent toggle made while preparing this migration.
  if (await fs.readFile(file, "utf8") !== before) {
    await fs.unlink(temp);
    throw new Error("SKILL_REGISTRY_CHANGED_DURING_MIGRATION");
  }
  await fs.rename(temp, file);
  return {changed: true, backup};
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const check = process.argv.includes("--check");
  const result = await migrateSkillRegistry(dataRoot, {check});
  console.log(JSON.stringify({check, ...result}));
  if (check && result.changed) process.exitCode = 1;
}
