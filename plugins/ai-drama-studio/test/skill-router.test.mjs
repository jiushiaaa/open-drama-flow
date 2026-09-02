import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { sourceSkillCount, specializedSkills } from "../src/skill-catalog.mjs";
import { routeSkills } from "../src/skill-router.mjs";

test("all 44 enabled MiniMax capabilities have distinct Codex skill entrypoints", async () => {
  assert.equal(sourceSkillCount, 44);
  assert.equal(specializedSkills.length, 44);
  assert.equal(new Set(specializedSkills.map(item => item.name)).size, 44);
  for (const skill of specializedSkills) {
    assert.match(skill.name, /^minimax-[a-z0-9-]+$/);
    const skillPath = path.resolve("skills", skill.name, "SKILL.md");
    const content = await fs.readFile(skillPath, "utf8");
    assert.match(content, new RegExp(`^---\\nname: ${skill.name}\\n`));
    assert.match(content, /drama_route_skills/);
    assert.match(content, /drama_update_plan/);
  }
});

test("each of the 44 specialized capabilities wins for its canonical user intent", async () => {
  for (const skill of specializedSkills) {
    const request = `请帮我制作${skill.keywords[0]}，按这个专业能力完整处理`;
    const result = await routeSkills(request, 5);
    assert.equal(result.fallback, false, request);
    assert.equal(result.selected[0].name, skill.name, request);
  }
});

const routingCases = [
  ["做一条口红唇釉广告，模特与产品质感都要稳定", "minimax-lip-product-ad-generator"],
  ["把这张建筑图做成 FPV 一镜到底穿越", "minimax-fpv-tour-video-generator"],
  ["做一个 SaaS 登录到结果卡片展开的 UI 动效", "minimax-ui-motion"],
  ["逐镜拆解这个参考视频并反推 Seedance 提示词", "minimax-video-deconstruct"],
  ["审查这个 Skill 的触发描述", "minimax-skill-reviewer"],
  ["给产品做一条极简高级广告", "minimax-minimalist-product-ad-generator"],
  ["制作二次元角色觉醒游戏 PV", "minimax-anime-game-pv"],
  ["做一条雨夜悬疑二次元漫剧，重点表现人物惊恐、迟疑和压抑的微表情", "minimax-micro-expression-video-generator"]
];

for (const [request, expected] of routingCases) {
  test(`routes: ${request}`, async () => {
    const result = await routeSkills(request, 3);
    assert.equal(result.fallback, false);
    assert.equal(result.selected[0].name, expected);
    assert.ok(result.selected[0].instructions.length > 200);
  });
}

const naturalLanguageCases = [
  ["把这个小故事做成有连续角色和场景的三维动画短片", "minimax-3d-animation-short-generator"],
  ["想把这张电影剧照的光线、构图和运镜方式整理成可直接出图和出视频的提示词", "minimax-film-reference-prompt-writer"],
  ["这张海报的标题和人物都别重做，只让它们轻微动起来，做成一条视频", "minimax-poster-motion-generator"],
  ["演员不说话，只让眼睛和嘴角有很细微的变化，表现她从怀疑到害怕", "minimax-micro-expression-video-generator"],
  ["这一段口播稿不要改内容，帮我规划什么时候用资料画面、什么时候补生成镜头", "minimax-transcript-broll-planner"],
  ["照着这个参考视频的镜头顺序、节奏和机位做一版新的", "minimax-video-deconstruct"],
  ["把这篇文章做成 Vox 那种拼贴、旁白驱动的解释型短纪录片", "minimax-vox-style-video-generator"],
  ["做一个 SaaS 从登录到结果卡片展开的交互流程动画", "minimax-ui-motion"],
  ["用这张产品照片做留白很多、细节特写、高级感的广告", "minimax-minimalist-product-ad-generator"],
  ["让品牌标志被两种颜色的霓虹线条最后汇聚出来", "minimax-brand-stream-mg"],
  ["做一个两个角色一起出现的游戏菜单开场", "minimax-co-op-game-intro-generator"]
];

for (const [request, expected] of naturalLanguageCases) {
  test(`routes natural language: ${request}`, async () => {
    const result = await routeSkills(request, 3);
    assert.equal(result.fallback, false);
    assert.equal(result.selected[0].name, expected);
    assert.notEqual(result.confidence, "low");
    assert.ok(result.selected[0].matchedSignals.length > 0 || result.selected[0].matchedKeywords.length > 0);
  });
}

const adjacentConflictCases = [
  {
    request: "这个 SaaS 不讲品牌故事，只演示界面状态切换和卡片重组",
    winner: "minimax-ui-motion",
    loser: "minimax-digital-product-promo-generator"
  },
  {
    request: "基于真实网站录屏做功能卖点宣传片，最后加 CTA",
    winner: "minimax-digital-product-promo-generator",
    loser: "minimax-ui-motion"
  },
  {
    request: "不要只借风格，要逐镜拆解参考视频并按镜头顺序复刻",
    winner: "minimax-video-deconstruct",
    loser: "minimax-video-prompting"
  },
  {
    request: "做一条歌词字幕跟着节拍卡点变化的 MV，不以歌手表演为主",
    winner: "minimax-music-video-subtitle-generator",
    loser: "minimax-cool-music-video"
  },
  {
    request: "锁住原海报排版和标题，只做人物微动，不做电影片头",
    winner: "minimax-poster-motion-generator",
    loser: "minimax-cinematic-title-sequence"
  }
];

for (const { request, winner, loser } of adjacentConflictCases) {
  test(`resolves adjacent conflict: ${winner} over ${loser}`, async () => {
    const result = await routeSkills(request, 5);
    assert.equal(result.selected[0].name, winner);
    const winnerScore = result.selected.find(item => item.name === winner)?.score ?? -Infinity;
    const loserScore = result.selected.find(item => item.name === loser)?.score ?? -Infinity;
    assert.ok(winnerScore > loserScore, `${winner} (${winnerScore}) must outrank ${loser} (${loserScore})`);
  });
}

const removedExternalSkills = [
  "minimax-voice-clone",
  "minimax-short-drama-multilingual-dubbing",
  "minimax-3d-director-stage",
  "minimax-clip-export"
];

test("removed external-only skills are absent and no longer auto-route", async () => {
  const names = new Set(specializedSkills.map(skill => skill.name));
  for (const removed of removedExternalSkills) assert.equal(names.has(removed), false, removed);

  for (const request of [
    "克隆这段参考音频的音色并创建 voice ID",
    "把这部短剧翻译成英文配音并保持角色声线",
    "给现有 3D 场景写入角色走位和相机轨迹",
    "导出一个可以继续编辑的剪映草稿工程"
  ]) {
    const result = await routeSkills(request, 5);
    assert.equal(result.fallback, true, request);
    assert.equal(result.selected[0].name, "ai-drama-producer", request);
  }
});

test("generic AI drama work falls back to the producer instead of asking for manual skill selection", async () => {
  const result = await routeSkills("给我做一部 AI 漫剧", 3);
  assert.equal(result.fallback, true);
  assert.equal(result.selected[0].name, "ai-drama-producer");
  assert.match(result.selected[0].instructions, /drama_route_skills/);
});
