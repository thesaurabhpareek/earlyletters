// node --test docs/ops/proposed/stack-status/stack-status.test.mjs. Fixtures are the 20 Nov 2026 stacks (public PR numbers and branches).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertReadOnly, buildStacks, ghApi, render, summary } from './stack-status.mjs';

const R = 'o/r';
const pr = (number, head, base, created = '2026-11-20T10:00:00Z') => ({ number, head: { ref: head, repo: { full_name: R } }, base: { ref: base }, created_at: created, draft: false });
// photo stack #835..#840 (develop <- 835 <- 836 <- ... <- 840) and BL-952 #894 <- #895
const OPEN = [
  pr(835, 'feat/p3', 'develop', '2026-11-18T10:00:00Z'), pr(836, 'feat/p3b', 'feat/p3', '2026-11-18T11:00:00Z'), pr(837, 'feat/p4a', 'feat/p3b'),
  pr(838, 'feat/p4', 'feat/p4a'), pr(839, 'feat/p4c', 'feat/p4'), pr(840, 'feat/p5', 'feat/p4c'),
  pr(894, 'feat/bl952-5', 'develop'), pr(895, 'feat/bl952-6', 'feat/bl952-5'),
];
// one real compare response, read 21 Nov 2026 (compare/develop...feat/mobile-photo-3-store), trimmed to the fields used
const COMPARE = { ahead_by: 32, behind_by: 219, status: 'diverged' };
const fakeApi = ({ open = OPEN, closed = [], calls = [] } = {}) => async (path, opts = {}) => {
  if (opts.method && opts.method !== 'GET') throw new Error('write attempted');
  calls.push(path);
  if (path.includes('/pulls?state=open')) return path.includes('page=1') ? open : [];
  if (path.includes('/pulls?state=closed')) return closed;
  if (/\/pulls\/\d+$/.test(path)) return { mergeable_state: 'clean' };
  if (path.includes('/compare/')) return COMPARE;
  throw new Error(`unexpected ${path}`);
};

test('[H3] #836 on #835\'s branch shows "waits for #835"', async () => {
  const rows = await buildStacks({ api: fakeApi(), repo: R });
  const r = rows.find((x) => x.pr === 836);
  assert.equal(r.basePr, 835); assert.equal(r.baseState, 'open'); assert.equal(r.next, 'waits for #835');
  assert.equal(r.ahead_by, 32); assert.equal(r.behind_by, 219); assert.equal(r.mergeable_state, 'clean');
});
test('[H3] a slice whose base merged shows "retarget to develop, then rebuild"', async () => {
  const open = OPEN.filter((p) => p.number !== 835);
  const closed = [{ number: 835, head: { ref: 'feat/p3' }, merged_at: '2026-11-20T12:00:00Z' }];
  const rows = await buildStacks({ api: fakeApi({ open, closed }), repo: R });
  assert.equal(rows.find((x) => x.pr === 836).next, 'retarget to develop, then rebuild');
});
test('[H3] a PR into develop is not listed', async () => {
  const rows = await buildStacks({ api: fakeApi(), repo: R });
  assert.deepEqual(rows.map((x) => x.pr), [836, 837, 838, 839, 840, 895]);
  assert.equal(summary(rows), '2 stacks, 6 stacked PRs; oldest unmerged base: #835');
  assert.match(render(rows), /#895 +feat\/bl952-5 +#894 +open/);
});
test('[H3] a PR into main is not a stack', async () => {
  const open = [...OPEN, pr(830, 'chore/sync', 'main')];
  const rows = await buildStacks({ api: fakeApi({ open }), repo: R });
  assert.equal(rows.find((x) => x.pr === 830).next, 'base main is a long-lived branch: not a stack');
  assert.equal(summary(rows), '2 stacks, 6 stacked PRs; oldest unmerged base: #835');
});
test('[H3] an unreadable PR prints unknown, never ok', async () => {
  const api = async (p, o) => { if (p.includes('/compare/') || /\/pulls\/\d+$/.test(p)) throw new Error('x'); return fakeApi()(p, o); };
  const r = (await buildStacks({ api, repo: R })).find((x) => x.pr === 836);
  assert.deepEqual([r.ahead_by, r.behind_by, r.mergeable_state], ['unknown', 'unknown', 'unknown']);
});
test('[H3] no call is anything but GET (the injected api throws on any other method)', async () => {
  const calls = [];
  await buildStacks({ api: fakeApi({ calls }), repo: R });
  assert.ok(calls.length > 0);
  await assert.rejects(fakeApi()('repos/o/r/pulls', { method: 'POST' }), /write attempted/);
});
test('[H3] the real wrapper refuses every write flag before it spawns anything', async () => {
  for (const extra of [['-f', 'a=b'], ['-F', 'a=b'], ['--field', 'a=b'], ['--raw-field', 'a=b'], ['--input', 'x.json'], ['--method', 'POST'], ['-X', 'DELETE'], ['--method=PATCH'], ['--field=a=b']]) {
    await assert.rejects(ghApi('repos/o/r/pulls', { extra }), /read-only/, extra.join(' '));
  }
  assert.doesNotThrow(() => assertReadOnly(['-X', 'GET', 'repos/o/r']));
});
