// Tests for scripts/qa/title-cites.mjs (QA-TITLES: C-01, C-02, C-10). Fixtures are built by
// function so this file's own source holds no test title that cites a row.
// Run: node --test scripts/qa/title-cites.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSource, checkFiles } from './title-cites.mjs';

const SCRIPT = fileURLToPath(new URL('./title-cites.mjs', import.meta.url));
const q = "'";
const ti = (title, call = 'it') => `${call}(${q}${title}${q}, () => {});\n`;
const rules = (src, file) => checkSource(src, file).problems.map((p) => p.rule);

function repoWith(files) {
  const root = mkdtempSync(join(tmpdir(), 'title-cites-'));
  mkdirSync(join(root, 'apps/mobile/test'), { recursive: true });
  for (const [name, src] of Object.entries(files)) writeFileSync(join(root, 'apps/mobile/test', name), src);
  return root;
}

test('[C-02] a parenthesised cite is reported', () => {
  // Arrange: a good title next to a bad one, so a check that flags everything also fails.
  const src = ti('[NS-10-R3] other owner: hidden') + ti('other owner: hidden (NS-10-R3)');
  const p = checkSource(src).problems;
  assert.equal(p.length, 1);
  assert.deepEqual([p[0].rule, p[0].line], ['C-02', 2]);
  assert.match(p[0].message, /in parentheses/);
});

test('[C-02] a comma list in one bracket is reported', () => {
  const p = checkSource(ti('[NS-01-R4, NX-39-R14] two rows')).problems;
  assert.equal(p.length, 1);
  assert.match(p[0].message, /comma list/);
  assert.match(p[0].message, /NS-01-R4 NX-39-R14/);
});

test('[C-02] a bare id without brackets is reported', () => {
  const p = checkSource(ti('NS-33-R4 reads at the largest size')).problems;
  assert.deepEqual(p.map((x) => x.rule), ['C-02']);
  assert.match(p[0].message, /without brackets/);
});

test('[C-02] two bracketed ids in a row are accepted', () => {
  assert.deepEqual(checkSource(ti('[NS-01-R4][NX-39-R14] two rows')).problems, []);
  assert.deepEqual(checkSource(ti('[NS-09-R3][BL-924] a delete that throws', 'test.only')).problems, []);
});

test('[C-02] a skipped test gives no cite but its form is still checked', () => {
  const r = checkSource(ti('[NS-01-R4] later', 'it.skip') + ti('later (NS-01-R4)', 'it.skip'));
  assert.deepEqual(r.cites, []);
  assert.equal(r.problems.length, 1);
});

const setComment = (id) => `// ${id} is proven by this set together, each citing it: a.test.ts:1 (one) and b.test.ts:1 (two)\n`;

test('[C-01] a row cited by two tests needs the set comment on exactly one', () => {
  const two = ti('[NS-09-R3] part one') + ti('[NS-09-R3] part two');
  // Arrange once per case so each has its own directory.
  const none = repoWith({ 'a.test.ts': two });
  const one = repoWith({ 'a.test.ts': setComment('NS-09-R3') + two });
  const both = repoWith({ 'a.test.ts': setComment('NS-09-R3') + ti('[NS-09-R3] x'), 'b.test.ts': setComment('NS-09-R3') + ti('[NS-09-R3] y') });
  const split = repoWith({ 'a.test.ts': setComment('NS-09-R3') + ti('[NS-09-R3] x'), 'b.test.ts': ti('[NS-09-R3] y') });
  const single = repoWith({ 'a.test.ts': ti('[NS-09-R3] only one test') });
  const run = (root, names) => checkFiles(names.map((n) => join(root, 'apps/mobile/test', n)), root).filter((p) => p.rule === 'C-01');
  assert.equal(run(none, ['a.test.ts']).length, 1, 'no comment');
  assert.match(run(none, ['a.test.ts'])[0].message, /2 tests and has 0 set comments/);
  assert.equal(run(one, ['a.test.ts']).length, 0, 'one comment, accepted');
  assert.equal(run(both, ['a.test.ts', 'b.test.ts']).length, 1, 'two comments');
  assert.equal(run(split, ['a.test.ts', 'b.test.ts']).length, 0, 'comment in one file, tests in two');
  assert.equal(run(single, ['a.test.ts']).length, 0, 'a single test needs no comment');
});

test('[C-10] a stand-in test without [stand-in] is reported', () => {
  const src = ti('[NS-10-R6] two phones see one book') + ti('[NS-10-R6][stand-in] two phones see one book');
  assert.deepEqual(checkSource(src, 'family-e2e.test.ts').problems.map((p) => [p.rule, p.line]), [['C-10', 1]]);
  assert.deepEqual(rules(src, 'x-pglite.test.ts'), ['C-10']);
  // The same title in an ordinary file is not a stand-in.
  assert.deepEqual(rules(ti('[NS-10-R6] two phones see one book'), 'account-scope.test.ts'), []);
  // A title with no row cite needs no marker.
  assert.deepEqual(rules(ti('the fake relay keeps order'), 'sync-e2e.test.ts'), []);
});

test('[C-02] report mode exits 0, --check exits 1, and the line is file:line rule id', () => {
  const root = repoWith({ 'bad.test.ts': ti('hidden (NS-10-R3)') });
  const run = (...a) => spawnSync(process.execPath, [SCRIPT, '--root', root, ...a], { encoding: 'utf8' });
  const report = run();
  assert.equal(report.status, 0);
  assert.match(report.stdout, /^apps\/mobile\/test\/bad\.test\.ts:1 C-02 NS-10-R3 in parentheses/m);
  assert.equal(run('--check').status, 1);
  const clean = repoWith({ 'ok.test.ts': ti('[NS-10-R3] hidden') });
  assert.equal(spawnSync(process.execPath, [SCRIPT, '--root', clean, '--check'], { encoding: 'utf8' }).status, 0);
});
