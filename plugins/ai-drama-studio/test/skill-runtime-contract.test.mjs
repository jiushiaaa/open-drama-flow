import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { specializedSkills } from '../src/skill-catalog.mjs';
import { runtimeContract, updateRuntimeContract } from '../scripts/skill-runtime-contract.mjs';
import { executionMode, hasExecutionAuthorization } from '../src/execution-policy.mjs';
import { VIDEO_INPUT_MODES, seedanceProfile, validateSeedanceRequest } from '../src/seedance-contract.mjs';

const producer = path.resolve('skills/ai-drama-producer/references');

test('all 44 specialist contracts are current and normalization preserves craft', async () => {
  for (const {name} of specializedSkills) {
    for (const file of ['SKILL.md', 'WORKFLOW.md']) {
      const text = await fs.readFile(path.resolve('skills', name, file), 'utf8');
      assert.ok(text.includes(runtimeContract), `${name}/${file}`);
      assert.equal(updateRuntimeContract(text), text, `${name}/${file} idempotence`);
      assert.doesNotMatch(text, /drama_request_paid_batch → 用户批准 → drama_resume_paid_batch/);
      if (file === 'WORKFLOW.md') assert.match(text, /OpenDramaFlow 总控调度/);
    }
  }
  const source = '# 原名\n\n> 工作流说明。\n\n## 运行时合同\n\n旧规则\n\n---\n\n## 原有镜头设计\n\n保持接触阴影和运镜节奏。\n';
  const updated = updateRuntimeContract(source);
  assert.ok(updated.endsWith('## 原有镜头设计\n\n保持接触阴影和运镜节奏。\n'));
  assert.ok(updated.includes('> 工作流说明。'));
  assert.equal(updateRuntimeContract(updated), updated);
});

test('documented automatic authorization still requires frozen scope, manual is not silently bypassed', async () => {
  const text = await fs.readFile(path.join(producer, 'execution-contract.md'), 'utf8');
  assert.equal(executionMode(), 'automatic');
  assert.equal(executionMode({executionMode: 'manual'}), 'manual');
  const scope = {scopeSnapshot: {executionMode: 'automatic'}, scopeDigest: 'frozen', authorization: {method: 'automatic-policy', action: 'start', scopeDigest: 'frozen'}};
  assert.equal(hasExecutionAuthorization(scope), true);
  assert.equal(hasExecutionAuthorization({...scope, scopeSnapshot: {executionMode: 'manual'}}), false);
  assert.equal(hasExecutionAuthorization({...scope, scopeDigest: 'changed'}), false);
  assert.match(text, /生成图片/);
  assert.match(text, /库之外/);
  assert.match(text, /drama_review_memory/);
  assert.match(text, /只要求分析、方案或提示词/);
  assert.match(text, /ASR 与标准音色 TTS 已接入/);
});

test('Seedance guide mode table covers actual adapter roles and boundary constraints', async () => {
  const guide = await fs.readFile(path.join(producer, 'seedance-prompting.md'), 'utf8');
  const documented = [...guide.matchAll(/^\|.*\| `(text-to-video|image-to-video|first-last-frame|multimodal-reference|video-extend|video-edit)` \|/gm)].map(match => match[1]);
  assert.deepEqual(documented, VIDEO_INPUT_MODES);
  const model = 'doubao-seedance-2-5-260628';
  const profile = seedanceProfile(model);
  assert.ok(guide.includes(`整数 ${profile.minimum}–${profile.maximum} 秒`));
  assert.ok(guide.includes(`最多 ${profile.maxImages} 张图片/${profile.maxVideos} 段视频/${profile.maxAudios} 段音频`));
  for (const resolution of profile.resolutions) assert.ok(guide.includes(resolution));
  for (const ratio of profile.ratios) assert.ok(guide.includes(ratio));
  const examples = [
    ['text-to-video', []],
    ['image-to-video', [{role: 'first_frame', kind: 'image'}]],
    ['first-last-frame', [{role: 'first_frame', kind: 'image'}, {role: 'last_frame', kind: 'image'}]],
    ['multimodal-reference', [{role: 'reference_image', kind: 'image'}, {role: 'reference_video', kind: 'video'}, {role: 'reference_audio', kind: 'audio'}]],
    ['video-extend', [{role: 'reference_video', kind: 'video'}]],
    ['video-edit', [{role: 'reference_video', kind: 'video'}]]
  ];
  const parameters = {duration: 8, ratio: '16:9', resolution: '720p', generate_audio: false};
  for (const [inputMode, inputs] of examples) {
    const edit = inputMode === 'video-edit' ? {startSeconds: 2, endSeconds: 5, instruction: '将桌面杯身改为深蓝色', preserve: ['角色身份']} : null;
    assert.deepEqual(validateSeedanceRequest({model, inputMode, inputs, parameters, edit}), []);
  }
  assert.ok(validateSeedanceRequest({model, inputMode: 'image-to-video', inputs: [{role: 'reference_image'}], parameters}).length);
  assert.ok(validateSeedanceRequest({model, inputMode: 'text-to-video', parameters: {...parameters, generate_audio: undefined}}).length);
  assert.ok(validateSeedanceRequest({model, inputMode: 'text-to-video', parameters: {...parameters, duration: 31}}).length);
});

test('all shared producer Markdown links resolve', async () => {
  for (const name of await fs.readdir(producer)) {
    if (!name.endsWith('.md')) continue;
    const text = await fs.readFile(path.join(producer, name), 'utf8');
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const link = match[1].split('#')[0];
      if (!link || /^https?:/.test(link)) continue;
      await fs.access(path.resolve(producer, link));
    }
  }
});
