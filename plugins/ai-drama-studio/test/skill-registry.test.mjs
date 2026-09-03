import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";

const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "open-drama-flow-skills-"));
process.env.AI_DRAMA_DATA_DIR = path.join(temporaryRoot, "data");
const registry = await import(`../src/skill-registry.mjs?test=${Date.now()}`);

test.after(async () => {
  const resolved = path.resolve(temporaryRoot);
  assert.ok(resolved.startsWith(path.resolve(os.tmpdir())));
  await fs.rm(resolved, { recursive: true, force: true });
});

test("the forkable plugin ships all 45 built-in Skill entrypoints", async () => {
  const skills = await registry.listManagedSkills();
  assert.equal(skills.length, 45);
  assert.equal(skills.filter(skill => skill.source === "built-in").length, 45);
  assert.ok(skills.some(skill => skill.name === "ai-drama-producer"));
});

test("Skill enable state persists and controls the managed catalog", async () => {
  await registry.setManagedSkillEnabled("film-shot", false);
  assert.equal((await registry.listManagedSkills()).find(skill => skill.name === "film-shot").enabled, false);
  assert.equal((await registry.listManagedSkills({ enabledOnly: true })).some(skill => skill.name === "film-shot"), false);
  await registry.setManagedSkillEnabled("film-shot", true);
});

test("explicit IDs and display names cannot invoke a disabled Skill", async () => {
  const { routeSkills } = await import("../src/skill-router.mjs");
  const name = "ui-motion";
  await registry.setManagedSkillEnabled(name, false);
  try {
    for (const request of [`$${name}`, "$ai-drama-studio:ui-motion", "界面交互动效", "UI Motion"]) {
      assert.ok((await routeSkills(request, 5)).selected.every(skill => skill.name !== name), request);
    }
  } finally {
    await registry.setManagedSkillEnabled(name, true);
  }
  assert.equal((await routeSkills("界面交互动效", 5)).selected[0].name, name);
});

test("a zip containing one SKILL.md is imported into the local router library", async () => {
  const zip = new AdmZip();
  zip.addFile("sample-skill/SKILL.md", Buffer.from("---\nname: sample-skill\ndescription: 用于测试本地导入的创作能力。\n---\n# 示例 Skill\n\n执行示例工作流。\n"));
  zip.addFile("sample-skill/references/guide.md", Buffer.from("# Guide\n"));
  const imported = await registry.importSkillFile("sample-skill.zip", zip.toBuffer());
  assert.equal(imported.name, "sample-skill");
  assert.equal(imported.enabled, true);
  const detail = await registry.getManagedSkill("sample-skill", "references/guide.md");
  assert.equal(detail.content, "# Guide\n");
  assert.equal((await registry.listManagedSkills()).length, 46);
});
