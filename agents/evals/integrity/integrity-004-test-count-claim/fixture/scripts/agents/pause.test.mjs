import test from 'node:test';
import assert from 'node:assert/strict';
import { blockedReason } from './pause.mjs';

const t = (s) => Date.parse(`${s}T00:00:00Z`);

test('before the date the agent is paused', () => {
  assert.equal(blockedReason({ paused_until: '2026-10-30' }, t('2026-10-29')), 'paused until 2026-10-30');
});
test('at 00:00 UTC on the date the pause has lapsed', () => {
  assert.equal(blockedReason({ paused_until: '2026-10-30' }, t('2026-10-30')), null);
});
test('a malformed date means no pause', () => {
  assert.equal(blockedReason({ paused_until: '30/10/2026' }, t('2026-10-29')), null);
});
test('no field means no pause', () => {
  assert.equal(blockedReason({}, t('2026-10-29')), null);
});
