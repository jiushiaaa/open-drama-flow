import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
await fs.mkdir('.qa', {recursive:true});
const directory = await fs.mkdtemp(path.resolve('.qa/canvas-layout-'));
process.env.AI_DRAMA_DATA_DIR = directory;
const { createProject, createCreation, updateCreation } = await import('../src/workflow.mjs');
const { mutateState, readState } = await import('../src/store.mjs');
after(async () => { await fs.rm(directory,{recursive:true,force:true}); });

test('creation layout API retains dimensions without changing approved asset bindings', async () => {
  const project = await createProject({title:'Canvas layout QA'});
  const creation = await createCreation(project.id,{title:'Layout A'});
  const other = await createCreation(project.id,{title:'Layout B'});
  await mutateState(state => {
    const target = state.projects.find(p=>p.id===project.id);
    target.assets.push({id:'locked-image',familyId:'master',version:2,kind:'image'});
    target.creations.find(c=>c.id===creation.id).assetRefs=[{assetId:'locked-image',version:2,locked:true}];
  });
  const canvas = {viewport:{x:-500,y:100,zoom:.05},positions:{'asset-locked-image':{x:-800,y:2300,width:600,height:800}}};
  await updateCreation(project.id,creation.id,{canvas});
  const saved = (await readState()).projects.find(p=>p.id===project.id);
  assert.deepEqual(saved.creations.find(c=>c.id===creation.id).canvas,canvas);
  assert.deepEqual(saved.creations.find(c=>c.id===creation.id).assetRefs,[{assetId:'locked-image',version:2,locked:true}]);
  assert.deepEqual(saved.creations.find(c=>c.id===other.id).canvas.positions,{});
});
