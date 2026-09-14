import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const app = await fs.readFile(new URL("../public/app.js", import.meta.url), "utf8");
const context = vm.createContext({ assetKindLabel: kind => kind, friendlyStatus: status => status });
vm.runInContext(app.slice(app.indexOf("function creationTypeLabel"), app.indexOf("async function renderWorkspace")), context);
const build = (project, creation) => context.buildCanvasGraph(project, creation);

test("default asset column follows a partially filled shot column without overlap", () => {
  for (const count of [0,1,2,3,7]) {
    const project = {assets:[{id:"image",kind:"image",mediaUrl:"/image.png",creationId:"episode"}], shots:Array.from({length:count},(_,i)=>({id:`s${i}`}))};
    const graph = build(project,{id:"episode"});
    const lastShot = graph.nodes.find(n=>n.id===`shot-s${count-1}`);
    const asset = graph.nodes.find(n=>n.id==="asset-image");
    if (lastShot) assert.ok(asset.x >= lastShot.x + lastShot.width);
    assert.equal(asset.height,280);
  }
});

test("restyling preserves saved asset IDs, positions and preview sources", () => {
  const assets = ["image","video","audio","document"].map(kind=>({id:kind,kind,mediaUrl:`/${kind}`,scope:"series",version:3}));
  const graph = build({assets}, {id:"episode",canvas:{positions:{"asset-video":{x:-500,y:2200}}}});
  const node = graph.nodes.find(n=>n.id==="asset-video");
  assert.equal(node.x,-500); assert.equal(node.y,2200); assert.equal(node.assetId,"video");
  assert.equal(node.mediaUrl,"/video");
  assert.equal(graph.nodes.find(n=>n.id==="asset-document").mediaUrl,null);
});
