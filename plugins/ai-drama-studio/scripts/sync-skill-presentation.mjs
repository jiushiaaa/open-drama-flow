// Update reviewed skills in place, never overwrite their workflows from another source.
import fs from "node:fs/promises";
import path from "node:path";
import { specializedSkills } from "../src/skill-catalog.mjs";
import { updateEntrypointPresentation, updateOpenaiYaml } from "./skill-presentation.mjs";
import { skillsRoot, syncSkillManifest } from "./skill-manifest.mjs";
const check = process.argv.includes("--check");
const changes = [];
for (const entry of specializedSkills) {
  for (const [relative, transform] of [["SKILL.md", updateEntrypointPresentation], ["agents/openai.yaml", updateOpenaiYaml]]) {
    const file = path.join(skillsRoot, entry.name, relative);
    const before = await fs.readFile(file, "utf8"), after = transform(before, entry);
    if (before !== after) {
      changes.push(`${entry.name}/${relative}`);
      if (!check) await fs.writeFile(file, after);
    }
  }
}
if (await syncSkillManifest({check})) changes.push("SKILL_MANIFEST.json");
console.log(JSON.stringify({check, skills: specializedSkills.length, changedFiles: changes}));
if (check && changes.length) process.exitCode = 1;
