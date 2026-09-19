import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptNodes, captureLayout } from '../public/canvas-ui/canvas.js';

test('shipped React adapter keeps asset identity, full media URLs and old layouts', () => {
  const graph = { edges: [], nodes: ['image','video','audio','document'].map((kind,i)=>({id:`asset-${kind}`,assetId:`v${i}`,kind,mediaKind:kind,mediaUrl:kind==='document'?null:`/media/${kind}`,title:kind,body:'v3',x:0,y:i*400,width:300,height:280})) };
  const layout = {positions:{'asset-video':{x:-200,y:3000,width:660,height:370}}};
  const nodes = adaptNodes(graph,layout);
  assert.deepEqual(nodes.map(n=>n.id),graph.nodes.map(n=>n.id));
  assert.deepEqual(nodes.map(n=>n.type),['image','video','audio','text']);
  assert.equal(nodes[1].metadata.content,'/media/video');
  assert.deepEqual(nodes[1].position,{x:-200,y:3000});
  assert.equal(nodes[1].width,660);
  const captured = captureLayout(nodes,{x:-10,y:20,k:.05},layout);
  assert.equal(captured.viewport.zoom,.05);
  assert.deepEqual(captured.positions['asset-video'],layout.positions['asset-video']);
  assert.equal(graph.nodes[1].assetId,'v1');
});

test('layout capture preserves references not rendered in the current canvas', () => {
  const layout = { positions: { hidden: {x:80,y:90} } };
  const next = captureLayout([], {x:0,y:0,k:5},layout);
  assert.deepEqual(next.positions,layout.positions);
});
