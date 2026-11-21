// node --test scripts/guards/pr-size.test.mjs (wired into the root `npm test` list). Fixtures are inline numstat text.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EXCLUDE, GOLDEN_DIRS, MAX_EXCLUDED_LINES, MAX_FILES, MAX_LINES, evaluate, main, measure, parseNumstat } from './pr-size.mjs';

const rows = (...r) => r.map(([path, lines]) => ({ path, lines }));
const many = (n, each = 1, dir = 'src') => Array.from({ length: n }, (_, i) => ({ path: `${dir}/f${i}.ts`, lines: each }));
const label = (login, event = 'labeled') => ({ event, label: { name: 'size:accepted' }, actor: { login } });
const OWNER = 'the-owner';

test('[CODE-R02] the limits are 400 lines and 20 files', () => assert.deepEqual([MAX_LINES, MAX_FILES], [400, 20]));
test('[CODE-R02] 400 lines passes and 401 changed lines fails', () => {
  assert.equal(evaluate({ rows: rows(['a.ts', 400]) }).ok, true);
  const r = evaluate({ rows: rows(['a.ts', 401]) });
  assert.equal(r.ok, false);
  assert.match(r.lines[0], /^lines 401 \/ 400, files 1 \/ 20$/);
});
test('[CODE-R02] 21 files fails and 20 passes', () => {
  assert.equal(evaluate({ rows: many(20) }).ok, true);
  assert.equal(evaluate({ rows: many(21) }).ok, false);
});
test('[CODE-R02] a lockfile-only change of 3,000 lines passes', () => {
  const r = evaluate({ rows: rows(['package-lock.json', 3000]) });
  assert.equal(r.ok, true);
  assert.match(r.lines[0], /^lines 0 \/ 400, files 0 \/ 20$/);
});
test('[CODE-R02] a lockfile of 1,500 lines beside 300 code lines passes', () => {
  assert.equal(evaluate({ rows: rows(['package-lock.json', 1500], ['a.ts', 300]) }).ok, true);
});
test('[CODE-R02] an exception line without the founder\'s proof still fails', () => {
  const r = evaluate({ rows: rows(['a.ts', 900]), body: 'Size exception: one concern', events: [], owner: OWNER });
  assert.equal(r.ok, false);
});
test('[CODE-R02] a size label applied by anyone but the owner does not pass', () => {
  const r = evaluate({ rows: rows(['a.ts', 900]), body: 'Size exception: one concern', events: [label('some-agent')], owner: OWNER });
  assert.equal(r.ok, false);
  assert.ok(r.lines.some((l) => /not applied by the repository owner/.test(l)));
});
test('[CODE-R02] the owner label plus the body line passes; the label alone or an unlabeled one does not', () => {
  assert.equal(evaluate({ rows: rows(['a.ts', 900]), body: 'Size exception: one concern', events: [label(OWNER)], owner: OWNER }).ok, true);
  assert.equal(evaluate({ rows: rows(['a.ts', 900]), body: 'no line', events: [label(OWNER)], owner: OWNER }).ok, false);
  assert.equal(evaluate({ rows: rows(['a.ts', 900]), body: 'Size exception: x', events: [label(OWNER), label(OWNER, 'unlabeled')], owner: OWNER }).ok, false);
  assert.equal(evaluate({ rows: rows(['a.ts', 900]), body: 'Size exception: x', events: [label(OWNER), label('some-agent')], owner: OWNER }).ok, false);
});
test('[CODE-R02] 3,000 lines under a fixtures-named folder that is not on the list count', () => {
  assert.equal(evaluate({ rows: rows(['apps/mobile/test/fixtures/big.json', 3000]) }).ok, false);
  assert.equal(measure(rows(['apps/mobile/test/__fixtures__/big.json', 1500])).lines, 0);
  assert.equal(measure(rows(['apps/mobile/test/__fixtures__/big.json', 2500])).lines, 2500);
});
test('[CODE-R02] each exclusion entry excludes its own path and nothing near it', () => {
  const hit = { 'the lockfile': 'apps/web/package-lock.json', 'a __fixtures__ folder': 'x/__fixtures__/a.json', 'a listed golden corpus': `${GOLDEN_DIRS[0]}a.json`, 'a generated folder': 'src/generated/types.ts', 'an image under docs': 'docs/design/shot.png' };
  const miss = { 'the lockfile': 'package-lock.json.md', 'a __fixtures__ folder': 'x/fixtures/a.json', 'a listed golden corpus': 'apps/mobile/test/golden-notes.ts', 'a generated folder': 'src/generate/types.ts', 'an image under docs': 'docs/design/notes.md' };
  assert.equal(EXCLUDE.length, Object.keys(hit).length);
  for (const [name, f] of EXCLUDE) {
    assert.equal(f(hit[name]), true, name);
    assert.equal(f(miss[name]), false, `${name} (near miss)`);
  }
  assert.equal(EXCLUDE.find(([n]) => n === 'an image under docs')[1]('apps/mobile/assets/a.png'), false);
});
test('[CODE-R02] docs text counts and binary files count 0 lines', () => {
  assert.equal(measure(rows(['docs/a.md', 450])).lines, 450);
  const parsed = parseNumstat('-\t-\tapps/mobile/assets/a.png\n12\t3\tsrc/a.ts\n5\t0\tsrc/{old => new}/b.ts\n1\t1\told.ts => new.ts\n');
  assert.deepEqual(parsed, [{ path: 'apps/mobile/assets/a.png', lines: 0 }, { path: 'src/a.ts', lines: 15 }, { path: 'src/new/b.ts', lines: 5 }, { path: 'new.ts', lines: 2 }]);
});
test('[CODE-R02] the excluded cap is 2,000 lines', () => assert.equal(MAX_EXCLUDED_LINES, 2000));
test('[CODE-R02] the run reads git and the events with GET calls only and prints the two numbers', () => {
  const calls = [];
  const exec = (cmd, args) => { calls.push([cmd, ...args]); return cmd === 'git' ? '10\t2\tsrc/a.ts\n' : ''; };
  const out = [];
  const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = (s) => (out.push(String(s)), true);
  let code;
  try { code = main(['--base', 'origin/develop'], { PR_NUMBER: '7', GITHUB_REPOSITORY: 'o/r', GITHUB_REPOSITORY_OWNER: OWNER }, exec); } finally { process.stdout.write = write; }
  assert.equal(code, 0);
  assert.match(out.join(''), /lines 12 \/ 400, files 1 \/ 20/);
  for (const c of calls.filter(([cmd]) => cmd === 'gh')) assert.ok(!c.some((a) => /^(-f|-F|--field|--raw-field|--input|-X|--method)$/.test(a)), 'no write flag');
});
test('[CODE-R02] a git failure exits 2, never a pass', () => {
  assert.equal(main([], {}, () => { throw new Error('no git'); }), 2);
});
