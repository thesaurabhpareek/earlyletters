// Tests for scripts/ci/pipeline-ledger.mjs, fixtures only, no network. Run: node --test scripts/ci/pipeline-ledger.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { classifyRun, ledgerFor, main, parseArgs, renderMarkdown, spliceBlock, RELEASE_WORKFLOWS } from './pipeline-ledger.mjs';

const WF = { file: 'testflight.yml', steps: ['Build on EAS'] };
const run = (id, conclusion, extra = {}) => ({ id, conclusion, head_sha: `${String(id).padStart(7, '0')}abcdef0123456789abcdef0123456789abc`.slice(0, 40), html_url: `https://example.test/runs/${id}`, updated_at: '2026-11-01T00:00:00Z', ...extra });
const jobsWith = (conclusion) => [{ steps: [{ name: 'Set up job', conclusion: 'success' }, { name: 'Build on EAS', conclusion }] }];

// EG-4: only skipped runs prints never.
test('only skipped runs: never', () => {
  const runs = [run(3, 'skipped'), run(2, 'skipped'), run(1, 'skipped')];
  const l = ledgerFor(WF, (p) => (p === 1 ? runs : []), () => assert.fail('no jobs for skipped runs'));
  assert.equal(l.last, null);
  assert.deepEqual(l.counts, { real_success: 0, skipped: 3, failed: 0, in_progress: 0, unchecked: 0 });
});

// EG-4: success conclusion with a skipped Build on EAS is still never.
test('success run with a skipped Build on EAS: never', () => {
  const l = ledgerFor(WF, (p) => (p === 1 ? [run(1, 'success')] : []), () => jobsWith('skipped'));
  assert.equal(l.last, null);
  assert.equal(l.counts.skipped, 1);
  assert.equal(l.counts.real_success, 0);
});

test('a success run without the step at all is not real', () => {
  assert.equal(classifyRun(run(1, 'success'), [{ steps: [{ name: 'Other', conclusion: 'success' }] }], ['Build on EAS']), 'skipped');
  assert.equal(classifyRun(run(1, 'success'), null, ['Build on EAS']), 'skipped');
});

test('newest real success is reported; older and failed runs are counted', () => {
  const runs = [run(5, 'failure'), run(4, 'success'), run(3, 'skipped'), run(2, 'success')];
  const jobs = { 4: jobsWith('success'), 2: jobsWith('skipped') };
  const l = ledgerFor(WF, (p) => (p === 1 ? runs : []), (id) => jobs[id]);
  assert.equal(l.last.id, 4);
  assert.equal(l.last.url, 'https://example.test/runs/4');
  assert.equal(l.counts.failed, 1);
  assert.equal(l.counts.real_success, 1);
  assert.equal(l.counts.skipped, 2);
});

test('cancelled, timed out and in progress runs', () => {
  assert.equal(classifyRun(run(1, 'cancelled'), null, []), 'failed');
  assert.equal(classifyRun(run(1, 'timed_out'), null, []), 'failed');
  assert.equal(classifyRun(run(1, null), null, []), 'in_progress');
});

test('paging stops at a short page and flags truncation when pages run out', () => {
  const full = Array.from({ length: 100 }, (_, i) => run(1000 - i, 'skipped'));
  let calls = 0;
  const l = ledgerFor(WF, () => { calls++; return full; }, () => null, { maxPages: 2 });
  assert.equal(calls, 2);
  assert.equal(l.truncated, true);
  assert.equal(l.seen, 200);
  const short = ledgerFor(WF, (p) => (p === 1 ? [run(1, 'skipped')] : assert.fail('read a second page')), () => null);
  assert.equal(short.truncated, false);
});

test('job lookups are capped and the cap is reported', () => {
  const runs = Array.from({ length: 5 }, (_, i) => run(10 - i, 'success'));
  const l = ledgerFor(WF, (p) => (p === 1 ? runs : []), () => jobsWith('skipped'), { maxJobLookups: 2 });
  assert.equal(l.lookupsCapped, true);
  assert.equal(l.counts.skipped, 2);
  assert.equal(l.counts.unchecked, 3);
});

test('render: never, and a real success with short sha and url', () => {
  const never = ledgerFor(WF, () => [], () => null);
  const real = ledgerFor({ file: 'deploy-db.yml', steps: ['Push'] }, (p) => (p === 1 ? [run(7, 'success')] : []), () => [{ steps: [{ name: 'Push', conclusion: 'success' }] }]);
  const md = renderMarkdown([never, real], { repo: 'o/r', generatedAt: '2026-11-01T00:00:00Z' });
  assert.match(md, /\| testflight\.yml \| never \|/);
  assert.match(md, /\| deploy-db\.yml \| 2026-11-01T00:00:00Z 0000007 https:\/\/example\.test\/runs\/7 \|/);
});

test('spliceBlock replaces only between markers', () => {
  const doc = 'top\n<!-- ledger:begin -->\nold\n<!-- ledger:end -->\nbottom';
  assert.equal(spliceBlock(doc, 'new'), 'top\n<!-- ledger:begin -->\nnew\n<!-- ledger:end -->\nbottom');
  assert.equal(spliceBlock('no markers', 'x'), null);
});

test('parseArgs rejects bad input', () => {
  assert.ok(parseArgs(['--nope']).error);
  assert.ok(parseArgs(['--repo', 'bad repo']).error);
  assert.ok(parseArgs(['--max-pages', '0']).error);
  assert.equal(parseArgs(['--strict']).opts.strict, true);
});

// End to end with a fake API: testflight has only a skipped-step success (like the 5 of 5 skipped retro finding).
function fakeApi(path) {
  if (/workflows\/testflight\.yml\/runs/.test(path)) return { workflow_runs: [run(21, 'success'), run(20, 'skipped')] };
  if (/runs\/21\/jobs/.test(path)) return { jobs: jobsWith('skipped') };
  if (/workflows\/deploy-db\.yml\/runs/.test(path)) return { workflow_runs: [run(31, 'success')] };
  if (/runs\/31\/jobs/.test(path)) return { jobs: [{ steps: [{ name: 'Push', conclusion: 'success' }] }] };
  return { workflow_runs: [] };
}

test('main: testflight never, strict exits 1, non-strict exits 0, json parses, repo is in the path', () => {
  const out = [];
  const seen = [];
  const api = (p) => { seen.push(p); return fakeApi(p); };
  const code = main(['--strict', '--json'], { api, now: () => 'T', log: (s) => out.push(s) });
  assert.equal(code, 1);
  const j = JSON.parse(out[0]);
  assert.equal(j.rows.find((r) => r.file === 'testflight.yml').last, null);
  assert.ok(j.rows.find((r) => r.file === 'deploy-db.yml').last);
  assert.ok(seen.every((p) => p.startsWith('repos/thesaurabhpareek/earlyletters/actions/')));
  assert.equal(main([], { api: fakeApi, now: () => 'T', log: () => {} }), 0);
});

test('main: API failure and bad arguments exit 2', () => {
  assert.equal(main([], { api: () => { throw new Error('gh: HTTP 403'); }, log: () => {} }), 2);
  assert.equal(main(['--bogus'], { log: () => {} }), 2);
});

test('the release workflow list matches step names that exist in the workflow files when they are present', () => {
  for (const w of RELEASE_WORKFLOWS) {
    let text;
    try { text = readFileSync(fileURLToPath(new URL(`../../.github/workflows/${w.file}`, import.meta.url)), 'utf8'); } catch { continue; }
    for (const s of w.steps) assert.ok(text.includes(`- name: ${s}`), `${w.file} has no step named ${s}`);
  }
});

test('the real PIPELINE_LEDGER.md has the markers and no banned characters', () => {
  const doc = readFileSync(fileURLToPath(new URL('../../docs/release/PIPELINE_LEDGER.md', import.meta.url)), 'utf8');
  assert.ok(doc.includes('<!-- ledger:begin -->') && doc.includes('<!-- ledger:end -->'));
  assert.ok(!/[–—‘’“”…]|\p{Extended_Pictographic}/u.test(doc));
});
