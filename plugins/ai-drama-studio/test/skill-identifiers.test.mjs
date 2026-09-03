import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {legacySkillIdentifiers, canonicalSkillName, canonicalSkillNames, migrateSkillSettings} from "../src/skill-identifiers.mjs";
import {specializedSkills} from "../src/skill-catalog.mjs";

const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "odf-skill-identifiers-"));
process.env.AI_DRAMA_DATA_DIR = path.join(temporaryRoot, "data");
const {listManagedSkills, getManagedSkill, setManagedSkillEnabled, createManagedSkill} = await import("../src/skill-registry.mjs");
const {routeSkills} = await import("../src/skill-router.mjs");
const {migrateSkillRegistry} = await import("../scripts/migrate-skill-settings.mjs");
const registryFile = path.join(process.env.AI_DRAMA_DATA_DIR, "skill-registry.json");
await fs.mkdir(path.dirname(registryFile), {recursive: true});
test.after(async () => {
  assert.equal(path.dirname(temporaryRoot), path.resolve(os.tmpdir()));
  await fs.rm(temporaryRoot, {recursive: true, force: true});
});

test("the legacy mapping is bijective across all 44 canonical identifiers", () => {
  assert.equal(Object.keys(legacySkillIdentifiers).length, 44);
  assert.deepEqual(new Set(Object.values(legacySkillIdentifiers)), new Set(specializedSkills.map(s => s.name)));
  assert.equal(canonicalSkillName("minimax-h3-prompt-expert"), "seedance-prompt-expert");
  assert.equal(canonicalSkillName("minimax-h3-visual-design"), "seedance-visual-design");
  assert.equal(canonicalSkillName("minimax-unrelated-import"), "minimax-unrelated-import");
});

test("saved switches migrate without losing false, unknown entries or canonical precedence", async () => {
  const enabled = {"minimax-film-shot": false, "minimax-ui-motion": true, "ui-motion": false, "imported-example": false};
  const expected = {"film-shot": false, "ui-motion": false, "imported-example": false};
  assert.deepEqual(migrateSkillSettings(enabled), expected);
  const before = JSON.stringify({enabled, extra: {keep: true}});
  await fs.writeFile(registryFile, before);
  const skills = await listManagedSkills();
  assert.equal(skills.find(s => s.name === "film-shot").enabled, false);
  assert.equal(await fs.readFile(registryFile, "utf8"), before, "read-only listing does not rewrite data");
  assert.equal((await migrateSkillRegistry(path.dirname(registryFile), {check: true})).changed, true);
  const result = await migrateSkillRegistry(path.dirname(registryFile));
  assert.equal(await fs.readFile(result.backup, "utf8"), before);
  assert.deepEqual(JSON.parse(await fs.readFile(registryFile, "utf8")), {enabled: expected, extra: {keep: true}});
  assert.equal((await migrateSkillRegistry(path.dirname(registryFile))).changed, false);
  for (const name of ["film-shot", "ui-motion"]) await setManagedSkillEnabled(name, true);
});

test("old and new explicit invocations resolve the same real instructions for all skills", async () => {
  for (const [legacy, canonical] of Object.entries(legacySkillIdentifiers)) {
    for (const input of [`$${legacy}`, `$ai-drama-studio:${legacy}`, `$${canonical}`]) {
      const result = await routeSkills(input, 5);
      assert.deepEqual(result.selected.map(s => s.name), [canonical]);
      assert.equal(result.confidence, "high");
      assert.ok(result.selected[0].instructions.includes("WORKFLOW.md"));
    }
    assert.equal((await getManagedSkill(legacy)).skill.name, canonical);
  }
  const reference = await getManagedSkill("minimax-h3-visual-design", "references/h3-execution-grammar.md");
  assert.equal(reference.selectedFile, "references/seedance-execution-grammar.md");
  assert.ok(reference.content.includes("Seedance"));
});

test("legacy invocations cannot bypass disabled skills and aliases cannot be imported", async () => {
  await setManagedSkillEnabled("minimax-ui-motion", false);
  for (const input of ["$minimax-ui-motion", "$ui-motion", "$ai-drama-studio:minimax-ui-motion"]) {
    assert.ok((await routeSkills(input, 5)).selected.every(s => s.name !== "ui-motion"));
  }
  await setManagedSkillEnabled("ui-motion", true);
  await assert.rejects(createManagedSkill({skillMd: "---\nname: minimax-ui-motion\ndescription: imported collision\n---\n# Collision\n"}), /SKILL_BUILT_IN_CONFLICT/);
  const result = await routeSkills("$minimax-brand-ad-extra", 5);
  assert.ok(result.selected.every(s => s.matchedSignals.every(signal => !signal.startsWith("explicit:"))));
});

test("canonical projections preserve input and deduplicate historical references", () => {
  const history = ["minimax-film-shot", {name: "film-shot"}, "custom-skill"];
  const before = JSON.stringify(history);
  assert.deepEqual(canonicalSkillNames(history), ["film-shot", "custom-skill"]);
  assert.equal(JSON.stringify(history), before);
});

test("alias-only plan updates preserve revisions, generated assets and frozen approval evidence", async () => {
  const {createProject, createCreation, updateProjectPlan, getProductionStatus} = await import("../src/workflow.mjs");
  const {readState, mutateState} = await import("../src/store.mjs");
  const project = await createProject({title: "identifier migration fixture"});
  const creation = await createCreation(project.id, {title: "fixture page"});
  await mutateState(state => {
    const p = state.projects.find(p => p.id === project.id);
    const plan = p.creations.find(c => c.id === creation.id).plan;
    plan.selectedSkills = ["minimax-film-shot"];
    plan.planRevision = 4;
    plan.shots = [{id: "shot-1", duration: 5, prompt: "fixture", clipPath: "fixture.mp4", promptVersion: 1}];
    p.outputs = [{id: "fixture-output", creationId: creation.id, planRevision: 4}];
    state.approvals.push({id: "fixture-approval", projectId: project.id, creationId: creation.id, status: "pending", scopeSnapshot: {selectedSkills: ["minimax-film-shot"]}, scopeDigest: "immutable-fixture"});
  });
  const before = (await readState()).approvals.find(a => a.id === "fixture-approval");
  await updateProjectPlan(project.id, {creationId: creation.id, selectedSkills: ["film-shot"]});
  const after = await readState();
  const p = after.projects.find(p => p.id === project.id);
  const plan = p.creations.find(c => c.id === creation.id).plan;
  assert.equal(plan.planRevision, 4);
  assert.equal(plan.shots[0].clipPath, "fixture.mp4");
  assert.deepEqual(plan.selectedSkills, ["minimax-film-shot"]);
  assert.notEqual(p.outputs[0].stale, true);
  assert.deepEqual(after.approvals.find(a => a.id === "fixture-approval"), before);
  assert.deepEqual((await getProductionStatus(project.id, creation.id)).selectedSkills, ["film-shot"]);
});
