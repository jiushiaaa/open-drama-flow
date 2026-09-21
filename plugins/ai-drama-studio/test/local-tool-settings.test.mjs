import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { validateVideoDepthSettings } from "../src/local-tool-settings.mjs";

test("depth configuration validates paths without executing files", async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "drama-depth-settings-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const config = { python: path.join(root, "python"), repository: root, checkpoint: path.join(root, "weights.pth") };
  for (const file of [config.python, config.checkpoint, path.join(root, "run.py")]) await fs.writeFile(file, "not executable");
  assert.deepEqual(await validateVideoDepthSettings(config), config);
  await assert.rejects(validateVideoDepthSettings({ ...config, python: "relative/python" }), { name: "ZodError" });
  await assert.rejects(validateVideoDepthSettings({ ...config, extra: true }), { name: "ZodError" });
  await assert.rejects(validateVideoDepthSettings({ ...config, checkpoint: root }), /LOCAL_TOOL_PATH_INVALID/);
  await fs.unlink(path.join(root, "run.py"));
  await assert.rejects(validateVideoDepthSettings(config), /LOCAL_TOOL_ENTRY_MISSING/);
});

test("navigation groups providers and tools before the beginner guide", async () => {
  const html = await fs.readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const nav = html.split('<nav class="primary-nav">')[1].split("</nav>")[0];
  assert.ok(nav.indexOf('#production-console') < nav.indexOf('#providers'));
  assert.ok(nav.indexOf('#providers') < nav.indexOf('#tools'));
  assert.ok(nav.indexOf('#tools') < nav.indexOf('#project-guide'));
  assert.match(nav, /新手指南/);
  const settings = await fs.readFile(new URL("../public/provider-settings.js", import.meta.url), "utf8");
  assert.match(settings, /默认生成模型/);
  assert.match(settings, /供应商与密钥配置/);
  assert.doesNotMatch(settings, /查看用量与模型定价|本地超分与账单同步/);
  const tools = await fs.readFile(new URL("../public/production-console.js", import.meta.url), "utf8");
  assert.doesNotMatch(tools, /\/api\/billing/);
});
