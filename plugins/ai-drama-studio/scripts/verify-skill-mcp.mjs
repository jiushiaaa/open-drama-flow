// Exercise a fresh source or installed MCP process using disposable local data.
// No generation or authorization tools are called.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {StdioClientTransport} from "@modelcontextprotocol/sdk/client/stdio.js";
import {specializedSkills} from "../src/skill-catalog.mjs";
import {legacySkillIdentifiers} from "../src/skill-identifiers.mjs";

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
  env:{...process.env,AI_DRAMA_DATA_DIR:dataRoot,AI_DRAMA_PORT:String(port),AI_DRAMA_BRIDGE_PORT:"0",AI_DRAMA_BRIDGE_CONTROL_PORT:"0"},
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
  const listing = await call("drama_list_skills");
  assert.equal(listing.count,45);
  assert.deepEqual(new Set(listing.skills.map(s=>s.name)),new Set(["ai-drama-producer",...specializedSkills.map(s=>s.name)]));
  assert.equal(listing.skills.find(s=>s.name===legacySkillIdentifiers[legacyDisabled]).enabled,false);
  await call("drama_set_skill_enabled",{name:legacyDisabled,enabled:true});
  let routed=0;
  for(const skill of specializedSkills) {
    const legacy = Object.entries(legacySkillIdentifiers).find(([,name])=>name===skill.name)[0];
    for(const request of [`$${skill.name}`,`$ai-drama-studio:${skill.name}`,`$${legacy}`,skill.label]) {
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
  console.log(JSON.stringify({pluginRoot,skills:listing.count,routeChecks:routed,disabledAliasCheck:true,providerCalls:0}));
} finally {
  await client.close().catch(()=>{});
  await transport.close().catch(()=>{});
  const resolved=await fs.realpath(dataRoot);
  assert.equal(path.dirname(resolved).toLowerCase(),(await fs.realpath(os.tmpdir())).toLowerCase());
  assert.ok(path.basename(resolved).startsWith("odf-skill-mcp-"));
  await fs.rm(resolved,{recursive:true,force:true});
}
