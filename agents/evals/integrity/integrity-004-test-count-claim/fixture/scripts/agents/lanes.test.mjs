import test from 'node:test';
import assert from 'node:assert/strict';
import { openLanes } from './lanes.mjs';

const agentOfPR = (pr) => pr.agent ?? null;

test('one open agent PR holds one lane', () => {
  assert.deepEqual(openLanes([{ number: 1, agent: 'qa' }], agentOfPR), { qa: 1 });
});
test('two PRs of one agent hold two lanes', () => {
  assert.deepEqual(openLanes([{ number: 1, agent: 'qa' }, { number: 2, agent: 'qa' }], agentOfPR), { qa: 2 });
});
test('a draft PR still holds its lane', () => {
  assert.deepEqual(openLanes([{ number: 2, agent: 'qa', draft: true }], agentOfPR), { qa: 1 });
});
test('a PR with no agent label holds none', () => {
  assert.deepEqual(openLanes([{ number: 3 }], agentOfPR), {});
});
test('no PRs, no lanes', () => {
  assert.deepEqual(openLanes([], agentOfPR), {});
});
