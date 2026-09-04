import test from "node:test";
import assert from "node:assert/strict";
import { buildSkillFileTree, countSkillTreeFiles, skillFileBadge } from "../public/skill-file-tree.js";

test("skill files form nested branches while root files remain at root", () => {
  const tree = buildSkillFileTree([
    { type: "directory", path: "agents/" },
    { type: "file", path: "agents/openai.yaml" },
    { type: "directory", path: "references/" },
    { type: "file", path: "references/shot-language.md" },
    { type: "file", path: "SKILL.md" },
    { type: "file", path: "WORKFLOW.md" }
  ]);
  assert.deepEqual(tree.map(item => item.name), ["agents", "references", "SKILL.md", "WORKFLOW.md"]);
  assert.deepEqual(tree[0].children.map(item => item.path), ["agents/openai.yaml"]);
  assert.deepEqual(tree[1].children.map(item => item.path), ["references/shot-language.md"]);
});

test("empty skill directories remain visible and report zero files", () => {
  const [assets] = buildSkillFileTree([{ type: "directory", path: "assets/" }]);
  assert.equal(assets.name, "assets");
  assert.deepEqual(assets.children, []);
  assert.equal(countSkillTreeFiles(assets), 0);
});

test("file badges reflect the actual extension", () => {
  assert.equal(skillFileBadge("SKILL.md"), "MD");
  assert.equal(skillFileBadge("openai.yaml"), "YAML");
});
