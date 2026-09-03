import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { specializedSkills } from "../src/skill-catalog.mjs";

export const skillsRoot = fileURLToPath(new URL("../skills/", import.meta.url));
export const manifestPath = path.join(skillsRoot, "SKILL_MANIFEST.json");
export async function listSkillFiles(root, current = root) {
  const files = [];
  for (const entry of (await fs.readdir(current, {withFileTypes: true})).sort((a,b) => a.name.localeCompare(b.name, "en"))) {
    const absolute = path.join(current, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`SKILL_SYMLINK_NOT_ALLOWED: ${absolute}`);
    if (entry.isDirectory()) files.push(...await listSkillFiles(root, absolute));
    else if (entry.isFile()) files.push(path.relative(root, absolute).replace(/\\/g, "/"));
  }
  return files;
}

export async function buildSkillManifest() {
  const skills = [];
  for (const name of ["ai-drama-producer", ...specializedSkills.map(skill => skill.name)]) {
    const root = path.join(skillsRoot, name);
    const files = [];
    for (const relativePath of await listSkillFiles(root)) {
      const bytes = await fs.readFile(path.join(root, relativePath));
      files.push({path: relativePath, sha256: crypto.createHash("sha256").update(bytes).digest("hex")});
    }
    skills.push({name, files});
  }
  return {schemaVersion: 2, runtime: "OpenDramaFlow / Codex / Seedance 2.5", generatedBy: "scripts/sync-skill-manifest.mjs", skillCount: skills.length, skills};
}

export async function syncSkillManifest({check = false} = {}) {
  const expected = `${JSON.stringify(await buildSkillManifest(), null, 2)}\n`;
  const actual = await fs.readFile(manifestPath, "utf8").catch(error => {if (error.code !== "ENOENT") throw error; return "";});
  if (expected === actual) return false;
  if (!check) await fs.writeFile(manifestPath, expected);
  return true;
}
