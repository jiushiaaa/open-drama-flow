import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { specializedSkills } from "../src/skill-catalog.mjs";

const skillsRoot = path.resolve("skills");

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function walkFiles(root) {
  const files = [];
  async function visit(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) files.push(absolute);
    }
  }
  await visit(root);
  return files;
}

test("manifest accounts for every current skill file including producer and references", async () => {
  const {buildSkillManifest} = await import("../scripts/skill-manifest.mjs");
  const manifest = JSON.parse(await fs.readFile(path.join(skillsRoot, "SKILL_MANIFEST.json"), "utf8"));
  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.skillCount, 46);
  assert.deepEqual(manifest, await buildSkillManifest());
  const directories = (await fs.readdir(skillsRoot, {withFileTypes: true})).filter(e => e.isDirectory()).map(e => e.name).sort();
  assert.deepEqual(directories, manifest.skills.map(s => s.name).sort());
  for (const skill of manifest.skills) {
    assert.ok(skill.files.some(f => f.path === "SKILL.md"));
    for (const file of skill.files) {
      assert.match(file.sha256, /^[a-f0-9]{64}$/);
      assert.equal(sha256(await fs.readFile(path.join(skillsRoot, skill.name, file.path))), file.sha256);
    }
  }
});

test("all specialist skills disclose their full workflow and real runtime contract", async () => {
  for (const skill of specializedSkills) {
    const skillRoot = path.join(skillsRoot, skill.name);
    const entrypoint = await fs.readFile(path.join(skillRoot, "SKILL.md"), "utf8");
    const workflow = await fs.readFile(path.join(skillRoot, "WORKFLOW.md"), "utf8");
    assert.match(entrypoint, /必须完整阅读 \[WORKFLOW\.md\]/);
    assert.match(entrypoint, /drama_get_state/);
    assert.match(entrypoint, /drama_update_plan/);
    assert.match(entrypoint, /drama_request_paid_batch/);
    assert.match(entrypoint, /drama_resume_paid_batch/);
    assert.match(workflow, /完整制作工作流/);
    assert.match(workflow, /drama_authorize_and_start_paid_batch/);
    assert.match(workflow, /automatic/);
    assert.match(workflow, /execution-contract\.md/);
    assert.doesNotMatch(workflow, /hub_[A-Za-z0-9_]+/);
    assert.doesNotMatch(workflow, /视频生成默认使用\s*(?:MiniMax[- ]?)?H3/i);
  }
});

test("every local Markdown link in all bundled skills resolves", async () => {
  const broken = [];
  for (const skill of [{name: "ai-drama-producer"}, ...specializedSkills]) {
    const skillRoot = path.join(skillsRoot, skill.name);
    const markdownFiles = (await walkFiles(skillRoot)).filter(file => file.endsWith(".md"));
    for (const file of markdownFiles) {
      const content = await fs.readFile(file, "utf8");
      for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const rawLink = match[1].trim().replace(/^<|>$/g, "");
        const link = rawLink.split("#")[0];
        if (!link || /^(?:https?:|mailto:|data:)/i.test(link) || /[<{]/.test(link)) continue;
        const target = path.resolve(path.dirname(file), decodeURIComponent(link));
        try {
          await fs.access(target);
        } catch {
          broken.push(`${path.relative(skillsRoot, file)} -> ${rawLink}`);
        }
      }
    }
  }
  assert.deepEqual(broken, []);
});

test("active skill paths and text contain no retired platform or model identities", async () => {
  const stale = [];
  for (const file of await walkFiles(skillsRoot)) {
    const relative = path.relative(skillsRoot, file);
    if (/minimax|hilo|(?:^|[\\/._-])h3(?:[\\/._-]|$)/i.test(relative)) stale.push(relative);
    if (/\.(?:md|yaml|json|mjs|js|py|txt|csv)$/i.test(file)) {
      const content = await fs.readFile(file, "utf8");
      if (/minimax|\bh3\b|hilo/i.test(content)) stale.push(`${relative}: content`);
    }
  }
  assert.deepEqual(stale, []);
});

test("remaining local editing adapter keeps its verification reference", async () => {
  await fs.access(path.join(skillsRoot, "clip-studio-craft", "references", "verification.md"));
});
