import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { specializedSkills } from "../src/skill-catalog.mjs";
import { routeSkills } from "../src/skill-router.mjs";
import { getManagedSkill } from "../src/skill-registry.mjs";
import { updateEntrypointPresentation, updateOpenaiYaml } from "../scripts/skill-presentation.mjs";

test("every specialized skill has current Chinese UI metadata and its canonical callable ID", async () => {
  const displayNames = new Set();
  for (const entry of specializedSkills) {
    const dir = path.resolve("skills", entry.name);
    const markdown = await fs.readFile(path.join(dir, "SKILL.md"), "utf8");
    const yaml = await fs.readFile(path.join(dir, "agents/openai.yaml"), "utf8");
    const value = key => JSON.parse(yaml.match(new RegExp(`^  ${key}: (.+)$`, "m"))[1]);
    assert.equal(value("display_name"), entry.label);
    assert.match(entry.label, /\p{Script=Han}/u);
    assert.doesNotMatch(entry.label + entry.description + value("short_description"), /minimax/i);
    assert.ok(value("short_description").length >= 25 && value("short_description").length <= 64);
    assert.ok(value("default_prompt").includes(`$ai-drama-studio:${entry.name}`));
    assert.doesNotMatch(yaml, /allow_implicit_invocation:\s*false/);
    assert.match(markdown, new RegExp(`^name: ${entry.name}$`, "m"));
    assert.equal(markdown.match(/^description: (.+)$/m)[1], entry.description);
    // Check both canonical machine metadata and user-visible instructions.
    const visible = markdown.replace(/^name:.*$/m, "").replace(/\]\([^)]+\)/g, "]");
    assert.doesNotMatch(visible, /minimax/i);
    assert.equal(updateEntrypointPresentation(markdown, entry), markdown);
    assert.equal(updateOpenaiYaml(yaml, entry), yaml);
    const detail = await getManagedSkill(entry.name, "agents/openai.yaml");
    assert.equal(detail.selectedFile, "agents/openai.yaml");
    assert.equal(detail.content, yaml);
    displayNames.add(entry.label);
  }
  assert.equal(displayNames.size, 44);
});

test("updating UI metadata preserves policy, tools and unrelated interface fields", () => {
  const entry = specializedSkills[0];
  const extra = '  icon_small: "./assets/icon.png"\npolicy:\n  allow_implicit_invocation: true\ndependencies:\n  tools: []\n';
  const updated = updateOpenaiYaml(`interface:\n  display_name: "Old"\n${extra}`, entry);
  assert.ok(updated.includes(extra));
  assert.ok(updated.includes(`$ai-drama-studio:${entry.name}`));
});

test("all current display names and canonical IDs select their own skill", async () => {
  for (const entry of specializedSkills) {
    for (const request of [entry.label, `$${entry.name}`, `$ai-drama-studio:${entry.name}`]) {
      const result = await routeSkills(request, 5);
      assert.equal(result.selected[0]?.name, entry.name, request);
      assert.ok(result.selected[0].instructions.includes("WORKFLOW.md"));
    }
  }
});

test("explicit IDs win over neighboring keyword-heavy skills without matching ID prefixes", async () => {
  const request = "使用 $brand-promo-video-generator 做产品宣传视频，不切换到通用产品宣传视频";
  const explicit = await routeSkills(request, 5);
  assert.deepEqual(explicit.selected.map(skill => skill.name), ["brand-promo-video-generator"]);
  assert.equal(explicit.confidence, "high");
  const extended = await routeSkills("$brand-promo-video-generator-extra", 5);
  assert.ok(extended.selected.every(skill => skill.matchedSignals.every(signal => !signal.startsWith("explicit:"))));
});

test("old display aliases retain compatibility after presentation changes", async () => {
  for (const entry of specializedSkills) {
    for (const label of entry.routingLabels || []) {
      assert.equal((await routeSkills(label, 5)).selected[0]?.name, entry.name, label);
    }
  }
});
