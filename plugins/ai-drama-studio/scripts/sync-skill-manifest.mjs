import { syncSkillManifest } from "./skill-manifest.mjs";
const check = process.argv.includes("--check");
const changed = await syncSkillManifest({check});
console.log(JSON.stringify({check, changed}));
if (check && changed) process.exitCode = 1;
