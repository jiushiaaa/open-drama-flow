import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { guideSections } from "../public/beginner-guide.js";

test("guide has unique deep-link targets and complete operation instructions", () => {
  const all = guideSections.flatMap(section => [section, ...section.topics]);
  assert.equal(new Set(all.map(item => item.id)).size, all.length);
  for (const item of all) {
    assert.match(item.id, /^[a-z]+(?:-[a-z]+)*$/);
    assert.ok(item.title);
    assert.ok(item.intro || item.paragraphs?.length || item.steps?.length);
  }
  for (const id of ["first-video", "api-keys", "default-models", "project-structure", "asset-management", "canvas", "skills", "usage", "upscale", "depth", "loading-errors"]) assert.ok(all.some(item => item.id === id));
});

test("local task empty state is distinct from costs and depth help is accessible", async () => {
  const source = await fs.readFile(new URL("../public/production-console.js", import.meta.url), "utf8");
  assert.match(source, /暂无超分任务/);
  assert.match(source, /"aria-describedby": "video-depth-help"/);
  assert.match(source, /role: "tooltip"/);
  assert.doesNotMatch(source.slice(source.indexOf("function upscalePanel"), source.indexOf("function depthPanel")), /暂无消费记录/);
});
