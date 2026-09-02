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

test("migration manifest accounts for every MiniMax source and reference file", async () => {
  const manifest = JSON.parse(
    await fs.readFile(path.join(skillsRoot, "MINIMAX_MIGRATION_MANIFEST.json"), "utf8")
  );
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.skillCount, 44);
  assert.equal(manifest.skills.length, 44);
  assert.deepEqual(
    new Set(manifest.skills.map(skill => skill.name)),
    new Set(specializedSkills.map(skill => skill.name))
  );

  const records = manifest.skills.flatMap(skill => skill.files);
  assert.equal(records.length, 206);
  assert.equal(records.filter(file => file.sourcePath.startsWith("references/")).length, 123);

  for (const skill of manifest.skills) {
    const skillRoot = path.join(skillsRoot, skill.name);
    const entrypoint = await fs.readFile(path.join(skillRoot, "SKILL.md"));
    assert.equal(sha256(entrypoint), skill.entrypointSha256);
    for (const record of skill.files) {
      assert.match(record.sourceSha256, /^[a-f0-9]{64}$/);
      const target = await fs.readFile(path.join(skillRoot, ...record.targetPath.split("/")));
      assert.equal(sha256(target), record.targetSha256, `${skill.name}/${record.targetPath}`);
    }
  }
});

test("all migrated skills disclose their full workflow and real runtime contract", async () => {
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
    assert.match(workflow, /Seedance 2\.5 付费审批链/);
    assert.doesNotMatch(workflow, /hub_[A-Za-z0-9_]+/);
    assert.doesNotMatch(workflow, /视频生成默认使用\s*(?:MiniMax[- ]?)?H3/i);
  }
});

test("every local Markdown link in the migrated skills resolves", async () => {
  const broken = [];
  for (const skill of specializedSkills) {
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

test("remaining local editing adapter keeps its verification reference", async () => {
  await fs.access(path.join(skillsRoot, "minimax-clip-studio-craft", "references", "verification.md"));
});
