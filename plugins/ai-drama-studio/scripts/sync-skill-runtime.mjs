import fs from "node:fs/promises";
import path from "node:path";
import { specializedSkills } from "../src/skill-catalog.mjs";
import { updateRuntimeContract } from "./skill-runtime-contract.mjs";
import { skillsRoot, syncSkillManifest } from "./skill-manifest.mjs";
const check = process.argv.includes("--check");
const changes = [];
for (const skill of specializedSkills) {
  for (const name of ["SKILL.md", "WORKFLOW.md"]) {
    const file = path.join(skillsRoot, skill.name, name);
    const before = await fs.readFile(file, "utf8"), after = updateRuntimeContract(before);
    if (before !== after) {
      changes.push(`${skill.name}/${name}`);
      if (!check) await fs.writeFile(file, after);
    }
  }
}
if (await syncSkillManifest({check})) changes.push("SKILL_MANIFEST.json");
console.log(JSON.stringify({check, changedFiles: changes}));
if (check && changes.length) process.exitCode = 1;
