// Exercise a fresh source or installed MCP process using disposable local data.
// No generation or authorization tools are called.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import {fileURLToPath} from "node:url";
import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {StdioClientTransport} from "@modelcontextprotocol/sdk/client/stdio.js";
import {specializedSkills} from "../src/skill-catalog.mjs";
import {legacySkillIdentifiers} from "../src/skill-identifiers.mjs";
import {PROFILES, VENDORS} from "../src/provider-presets.mjs";

const pluginRoot = path.resolve(process.argv[2] || fileURLToPath(new URL("../", import.meta.url)));
const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), "odf-skill-mcp-"));
const port = await new Promise((resolve,reject) => {
  const server = net.createServer();
  server.once("error", reject);
  server.listen(0,"127.0.0.1",()=>{const port=server.address().port;server.close(()=>resolve(port));});
});
const legacyDisabled = Object.keys(legacySkillIdentifiers)[0];
await fs.writeFile(path.join(dataRoot,"skill-registry.json"),JSON.stringify({enabled:{[legacyDisabled]:false}}));
const transport = new StdioClientTransport({
  command:process.execPath, args:[path.join(pluginRoot,"src/mcp-server.mjs")], cwd:pluginRoot,
  env:{...process.env,AI_DRAMA_DATA_DIR:dataRoot,AI_DRAMA_MEDIA_DIR:dataRoot,AI_DRAMA_PORT:String(port),AI_DRAMA_BRIDGE_PORT:"0",AI_DRAMA_BRIDGE_CONTROL_PORT:"0"},
  stderr:"pipe"
});
transport.stderr?.on("data",()=>{});
const client = new Client({name:"odf-skill-migration-check",version:"1.0.0"},{capabilities:{}});
async function call(name,args={}) {
  const response = await client.callTool({name,arguments:args});
  assert.notEqual(response.isError,true,JSON.stringify(response.content));
  return response.structuredContent || JSON.parse(response.content.find(item=>item.type==="text").text);
}
try {
  await client.connect(transport);
  const exposed = new Set((await client.listTools()).tools.map(tool => tool.name));
  for (const name of ["drama_edit_local_media", "drama_process_local_audio", "drama_compare_local_edits", "drama_prepare_audio_event_evidence", "drama_list_tool_capabilities", "drama_get_cost_report", "drama_set_cost_price", "drama_record_cost_settlement"]) assert.ok(exposed.has(name), name);
  assert.equal((await call("drama_get_capabilities")).deterministicEdit.localManifestEdit, true);
  const catalog = await call("drama_list_tool_capabilities");
  assert.equal(catalog.entries.find(item => item.id === "codex-imagegen").readiness, process.env.AI_DRAMA_AGENT_HOST === "generic" ? "unavailable-in-this-host" : "host-session-dependent");
  const hostCapabilities = await call("drama_get_capabilities");
  assert.equal(hostCapabilities.image.codexImageGen, process.env.AI_DRAMA_AGENT_HOST !== "generic");
  assert.equal(hostCapabilities.image.requiresImageApiKey, process.env.AI_DRAMA_AGENT_HOST === "generic");
  for (const entry of catalog.entries.filter(item => item.tool?.startsWith("drama_"))) assert.ok(exposed.has(entry.tool), entry.tool);
  assert.equal((await call("drama_get_cost_report")).calls, 0);
  for (const name of ["drama_configure_upscale", "drama_create_upscale_job", "drama_start_upscale_job", "drama_get_upscale_job", "drama_pause_upscale_job", "drama_list_providers", "drama_prepare_provider_job", "drama_start_provider_job", "drama_get_provider_job", "drama_download_provider_output", "drama_search_shot_assets", "drama_select_production_workflow", "drama_sync_account_bill"]) assert.ok(exposed.has(name), name);
  assert.equal((await call("drama_get_upscale_job")).jobs.length, 0);
  const providers = await call("drama_list_providers");
  assert.equal(providers.selection.video, "ark");
  assert.deepEqual(providers.providers.map(p => p.id).sort(), PROFILES.map(p => p.id).sort());
  assert.deepEqual(providers.vendors.map(v => v.id).sort(), VENDORS.map(v => v.id).sort());
  for (const vendor of providers.vendors) assert.ok(Object.values(vendor.credentialStatus).every(value => typeof value === "boolean"));
  assert.equal((await call("drama_select_production_workflow", { type: "drama" })).id, "drama");
  for (const name of ["drama_get_production_progress", "drama_record_stage_checkpoint", "drama_record_production_decision", "drama_read_production_knowledge"]) assert.ok(exposed.has(name), name);
  const knowledge = await call("drama_read_production_knowledge");
  assert.equal(knowledge.layers.length, 3);
  for (const reference of knowledge.references) {
    const loaded = await call("drama_read_production_knowledge", { id: reference.id });
    assert.equal(loaded.sha256, createHash("sha256").update(loaded.content).digest("hex"));
  }
  for (const type of ["drama", "advertising", "explainer", "music-video", "motion"]) {
    const contract = await call("drama_select_production_workflow", { type });
    assert.equal(contract.stageContracts.length, 7);
    for (const stage of contract.stageContracts) for (const tool of stage.tools) assert.ok(exposed.has(tool), tool);
  }
  const price = { kind: "tts", model: "fixture-only", currency: "CNY", unit: "character", rate: 0.001, source: "isolated test price, not account pricing" };
  assert.equal((await call("drama_set_cost_price", { rule: price })).rule.model, "fixture-only");
  const listing = await call("drama_list_skills");
  assert.equal(listing.count,specializedSkills.length + 1);
  assert.deepEqual(new Set(listing.skills.map(s=>s.name)),new Set(["ai-drama-producer",...specializedSkills.map(s=>s.name)]));
  assert.equal(listing.skills.find(s=>s.name===legacySkillIdentifiers[legacyDisabled]).enabled,false);
  await call("drama_set_skill_enabled",{name:legacyDisabled,enabled:true});
  let routed=0;
  for(const skill of specializedSkills) {
    const legacy = Object.entries(legacySkillIdentifiers).find(([,name])=>name===skill.name)?.[0];
    const requests = [`$${skill.name}`,`$ai-drama-studio:${skill.name}`,skill.label];
    if (legacy) requests.splice(2,0,`$${legacy}`);
    for(const request of requests) {
      const route = await call("drama_route_skills",{request,maxResults:5});
      assert.equal(route.selected[0]?.name,skill.name,request);
      assert.equal(route.confidence,"high",request);
      assert.match(route.selected[0].instructions,/WORKFLOW\.md/);
      assert.doesNotMatch(route.selected[0].instructions,/minimax|\bh3\b|hilo/i);
      assert.equal(route.persisted,false);
      routed++;
    }
  }
  await call("drama_set_skill_enabled",{name:"ui-motion",enabled:false});
  assert.ok((await call("drama_route_skills",{request:"$minimax-ui-motion"})).selected.every(s=>s.name!=="ui-motion"));
  const state=await call("drama_get_state");
  for(const key of ["projects","jobs","approvals","providerCalls"]) assert.equal(state[key].length,0,key);
  assert.equal(state.settings.costPrices[0].model, "fixture-only");
  // Disposable project only: test journal writes over the actual MCP transport.
  const { project } = await call("drama_create_project", { title: "Isolated stage contract test" });
  const scope = { projectId: project.id, type: "drama" };
  const initial = await call("drama_get_production_progress", scope);
  const stage = initial.nextStage;
  const reportPath = path.join(dataRoot, "stage-fixture.md"), content = "Isolated fixture, not production evidence.";
  await fs.writeFile(reportPath, content);
  const name = stage.produces[0].name;
  const checkpoint = { ...scope, stageId: stage.id, planRevision: initial.planRevision, requestKey: "fixture-checkpoint", outcome: "complete",
    artifacts: [{ name, path: reportPath, sha256: createHash("sha256").update(content).digest("hex") }],
    checks: stage.acceptance.map(c => ({ id: c.id, passed: true, observation: "Transport fixture only", evidenceNames: [name] })), resumeNote: "No model call required" };
  const recorded = await call("drama_record_stage_checkpoint", checkpoint);
  assert.equal((await call("drama_record_stage_checkpoint", checkpoint)).id, recorded.id);
  assert.equal((await call("drama_get_production_progress", scope)).recordedStageCount, 1);
  const choice = await call("drama_record_production_decision", { ...scope, stageId: stage.id, planRevision: initial.planRevision, requestKey: "fixture-decision", category: "creative", subject: "Reuse fixture", options: [{ id: "reuse", description: "Existing report", reason: "No generation needed" }], selected: "reuse", reason: "Transport test", costImpact: { status: "no-additional-provider-call", basis: "Only local fixture" } });
  assert.equal(choice.authority, "agent-decision-not-user-approval");
  const finalState = await call("drama_get_state");
  assert.equal(finalState.providerCalls.length, 0); assert.equal(finalState.approvals.length, 0);
  assert.equal(finalState.projects[0].memories.length, 0);
  console.log(JSON.stringify({pluginRoot,skills:listing.count,routeChecks:routed,toolCapabilities:catalog.entries.length,costTools:true,stageContracts:5,journalTransport:true,knowledgeReferences:knowledge.references.length,disabledAliasCheck:true,providerCalls:0}));
} finally {
  await client.close().catch(()=>{});
  await transport.close().catch(()=>{});
  const resolved=await fs.realpath(dataRoot);
  assert.equal(path.dirname(resolved).toLowerCase(),(await fs.realpath(os.tmpdir())).toLowerCase());
  assert.ok(path.basename(resolved).startsWith("odf-skill-mcp-"));
  await fs.rm(resolved,{recursive:true,force:true});
}
