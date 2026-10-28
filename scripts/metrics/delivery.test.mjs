import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDelivery, toMarkdown, quantile } from './delivery.mjs';

const NOW = '2026-10-28T00:00:00Z';
const d = (day, hour = 0) => `2026-10-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00Z`;
const pr = (number, opened, merged, extra = {}) => ({ number, title: `feat: thing ${number}`, body: '', created_at: opened, merged_at: merged, merge_commit_sha: `sha${number}`.padEnd(40, '0'), ...extra });
const run = (o) => computeDelivery({ now: NOW, ...o });

test('lead time is opened-to-merged in hours, nearest-rank median and p90', () => {
  const prs = [pr(1, d(1, 0), d(1, 2)), pr(2, d(2, 0), d(2, 4)), pr(3, d(3, 0), d(3, 10))];
  const r = run({ prs });
  assert.equal(r.leadTimeHours.n, 3);
  assert.equal(r.leadTimeHours.median, 4);
  assert.equal(r.leadTimeHours.p90, 10);
});

test('unmerged (closed) PRs and PRs merged outside the window do not count', () => {
  const prs = [pr(1, d(1), null), pr(2, '2026-08-01T00:00:00Z', '2026-08-02T00:00:00Z'), pr(3, d(5), d(5, 1))];
  assert.equal(run({ prs }).sample.mergedPrs, 1);
});

test('no data gives null, never zero', () => {
  const r = run({ prs: [] });
  assert.equal(r.leadTimeHours.median, null);
  assert.equal(r.changeFailureRate.rate, null);
  assert.equal(r.restoreTimeHours.median, null);
  assert.equal(quantile([], 0.5), null);
});

test('with no ios-v tags, deployment frequency says there is no deployment yet', () => {
  const r = run({ prs: [], tags: [{ name: 'v1', date: d(3) }, { name: 'ios-v1.0', date: d(3) }] });
  assert.equal(r.deploymentFrequency.perWeek, null);
  assert.match(r.deploymentFrequency.note, /No deployment yet/);
  assert.match(toMarkdown(r), /no deployment yet/);
});

test('release and candidate tags are counted separately; malformed names are ignored', () => {
  const tags = [
    { name: 'ios-v0.1.0-rc.1', date: d(2) },
    { name: 'ios-v0.1.0-rc.2', date: d(4) },
    { name: 'ios-v0.1.0', date: d(6) },
    { name: 'ios-v0.1.0-beta', date: d(7) },
    { name: 'ios-v0.0.9', date: '2026-07-01T00:00:00Z' },
  ];
  const r = run({ prs: [], tags });
  assert.equal(r.deploymentFrequency.releases, 1);
  assert.equal(r.deploymentFrequency.candidates, 2);
  assert.equal(r.deploymentFrequency.perWeek, 0.7);
});

test('a fix PR that names the PR within 7 days marks it failed; restore time is the gap', () => {
  const prs = [
    pr(10, d(1), d(2)),
    pr(11, d(3), d(3, 6), { title: 'fix(web): repair thing from #10' }),
    pr(12, d(5), d(5, 1)),
  ];
  const r = run({ prs });
  assert.deepEqual(r.changeFailureRate.failures, [{ pr: 10, repair: '#11' }]);
  assert.equal(r.restoreTimeHours.median, 30);
  assert.equal(r.changeFailureRate.proxy, true);
});

test('a fix PR that does not name the PR is not counted (proxy blind spot)', () => {
  const prs = [pr(10, d(1), d(2)), pr(11, d(3), d(3, 6), { title: 'fix: something unrelated' })];
  assert.equal(run({ prs }).changeFailureRate.failed, 0);
});

test('a non-fix PR that mentions the number is not a failure; #1 does not match #10 or #100', () => {
  const prs = [
    pr(1, d(1), d(2)),
    pr(10, d(1), d(2)),
    pr(20, d(3), d(3, 1), { title: 'feat: builds on #1', body: 'also #100 and #10' }),
    pr(21, d(3), d(3, 2), { title: 'fix: thing', body: 'see #100' }),
  ];
  const r = run({ prs });
  assert.equal(r.changeFailureRate.failed, 0);
});

test('a repair after 7 days is outside the window', () => {
  const prs = [pr(10, d(1), d(2)), pr(11, d(10), d(10), { title: 'fix: for #10' })];
  assert.equal(run({ prs }).changeFailureRate.failed, 0);
});

test('revert commit naming the merge sha counts, and the first repair sets restore time', () => {
  const p = pr(10, d(1), d(2));
  const commits = [
    { sha: 'abcdef1234', message: `Revert "feat: thing 10"\n\nThis reverts commit ${p.merge_commit_sha}.`, date: d(2, 5) },
    { sha: 'bbbbbbb', message: 'chore: unrelated', date: d(2, 1) },
  ];
  const r = run({ prs: [p], commits });
  assert.deepEqual(r.changeFailureRate.failures, [{ pr: 10, repair: 'abcdef1' }]);
  assert.equal(r.restoreTimeHours.median, 5);
});

test('PRs younger than 7 days are not scored, so a quiet week cannot look like zero failures', () => {
  const prs = [pr(10, d(24), d(25)), pr(11, d(1), d(2))];
  const r = run({ prs });
  assert.equal(r.changeFailureRate.scored, 1);
  assert.equal(r.sample.mergedPrs, 2);
});

test('a PR does not repair itself', () => {
  const prs = [pr(10, d(1), d(2), { title: 'fix: follow-up to #10' })];
  assert.equal(run({ prs }).changeFailureRate.failed, 0);
});
