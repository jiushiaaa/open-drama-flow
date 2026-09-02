import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { sourceSkillCount, specializedSkills } from "../src/skill-catalog.mjs";
import { routeSkills } from "../src/skill-router.mjs";

test("all 48 MiniMax source capabilities have distinct Codex skill entrypoints", async () => {
  assert.equal(sourceSkillCount, 48);
  assert.equal(specializedSkills.length, 48);
  assert.equal(new Set(specializedSkills.map(item => item.name)).size, 48);
  for (const skill of specializedSkills) {
    assert.match(skill.name, /^minimax-[a-z0-9-]+$/);
    const skillPath = path.resolve("skills", skill.name, "SKILL.md");
    const content = await fs.readFile(skillPath, "utf8");
    assert.match(content, new RegExp(`^---\\nname: ${skill.name}\\n`));
    assert.match(content, /drama_route_skills/);
    assert.match(content, /drama_update_plan/);
  }
});

const routingCases = [
  ["做一条口红唇釉广告，模特与产品质感都要稳定", "minimax-lip-product-ad-generator"],
  ["把这张建筑图做成 FPV 一镜到底穿越", "minimax-fpv-tour-video-generator"],
  ["把这部短剧做英文出海配音", "minimax-short-drama-multilingual-dubbing"],
  ["做一个 SaaS 登录到结果卡片展开的 UI 动效", "minimax-ui-motion"],
  ["逐镜拆解这个参考视频并反推 Seedance 提示词", "minimax-video-deconstruct"],
  ["审查这个 Skill 的触发描述", "minimax-skill-reviewer"],
  ["给产品做一条极简高级广告", "minimax-minimalist-product-ad-generator"],
  ["制作二次元角色觉醒游戏 PV", "minimax-anime-game-pv"]
];

for (const [request, expected] of routingCases) {
  test(`routes: ${request}`, async () => {
    const result = await routeSkills(request, 3);
    assert.equal(result.fallback, false);
    assert.equal(result.selected[0].name, expected);
    assert.ok(result.selected[0].instructions.length > 200);
  });
}

test("generic AI drama work falls back to the producer instead of asking for manual skill selection", async () => {
  const result = await routeSkills("给我做一部 AI 漫剧", 3);
  assert.equal(result.fallback, true);
  assert.equal(result.selected[0].name, "ai-drama-producer");
  assert.match(result.selected[0].instructions, /drama_route_skills/);
});
