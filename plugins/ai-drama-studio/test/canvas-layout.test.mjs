import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCanvasLayout } from '../src/canvas-layout.mjs';
import { createCanvasPersistence } from '../public/canvas-persistence.js';

test('legacy positions survive; native zoom and node dimensions round-trip', () => {
  const old = { viewport: { x: -1700, y: 450, zoom: .78 }, positions: { 'asset-v3': { x: -200, y: 5000 } } };
  assert.deepEqual(normalizeCanvasLayout({}, old), old);
  const next = { viewport: { x: -3500, y: 2000, zoom: .05 }, positions: { 'asset-v3': { x: -200, y: 5000, width: 620, height: 360 } } };
  assert.deepEqual(normalizeCanvasLayout(next, old), next);
  assert.equal(normalizeCanvasLayout({ viewport: { zoom: 5 } }).viewport.zoom, 5);
  assert.equal(normalizeCanvasLayout({ viewport: { zoom: 10 } }).viewport.zoom, 5);
});

test('invalid numbers fail instead of corrupting serialized canvas state', () => {
  for (const patch of [{viewport:{x:NaN}}, {viewport:{zoom:Infinity}}, {positions:{asset:{x:'bad'}}}, {positions:{asset:{width:Infinity}}}]) {
    assert.throws(() => normalizeCanvasLayout(patch), /CANVAS_LAYOUT_INVALID/);
  }
});

test('position-only updates preserve existing dimensions and identity', () => {
  const actual = normalizeCanvasLayout({ positions: { 'asset-locked-v2': {x:100,y:200} } }, { positions: { 'asset-locked-v2': {x:0,y:0,width:400,height:700} } });
  assert.deepEqual(actual.positions, {'asset-locked-v2':{x:100,y:200,width:400,height:700}});
});

test('large creations are not silently truncated at the previous 800-node limit', () => {
  const positions = Object.fromEntries(Array.from({length:1500},(_,i)=>[`asset-${i}`,{x:i*300,y:-500}]));
  assert.equal(Object.keys(normalizeCanvasLayout({positions}).positions).length,1500);
});

test('delayed saves retain the original creation and snapshot', async () => {
  const writes = [], errors = [];
  const queue = createCanvasPersistence(async (...args) => writes.push(args), error => errors.push(error), 5);
  const layout = { viewport: {x:10} };
  queue.schedule('project-A','creation-A',layout);
  layout.viewport.x = 900;
  queue.schedule('project-B','creation-B',{viewport:{x:20}});
  await new Promise(resolve=>setTimeout(resolve,30));
  assert.deepEqual(writes,[['project-A','creation-A',{viewport:{x:10}}],['project-B','creation-B',{viewport:{x:20}}]]);
  assert.equal(errors.length,0);
});

test('writes for the same creation are serialized, debounced and recover after failure', async () => {
  const calls=[], errors=[]; let release;
  const blocker = new Promise(resolve=>release=resolve);
  const queue = createCanvasPersistence(async (_p,_c,layout)=>{ calls.push(layout); if(layout===2) { await blocker; throw new Error('offline'); } }, error=>errors.push(error.message),5);
  queue.schedule('p','c',1); queue.schedule('p','c',2);
  await new Promise(resolve=>setTimeout(resolve,20));
  queue.schedule('p','c',3); await new Promise(resolve=>setTimeout(resolve,20));
  assert.deepEqual(calls,[2]); release(); await new Promise(resolve=>setTimeout(resolve,20));
  assert.deepEqual(calls,[2,3]); assert.deepEqual(errors,['offline']);
});
