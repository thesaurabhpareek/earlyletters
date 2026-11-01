// Tests for scripts/qa/evidence-check.mjs (HV2-014, EG-8 and EG-9: planted failures).
// Run: node --test scripts/qa/evidence-check.test.mjs
// Fixtures use the fictional family only (Asha, Avi, Mama, Papa).
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkEvidence, REQUIRED_ROWS, parseRows } from './evidence-check.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SCRIPT = join(ROOT, 'scripts/qa/evidence-check.mjs');

// A filled, valid, passing file. `edit` can change any row or add text.
function build({ rows = {}, extra = '', verdict = 'pass', tally = 'Kill tally: runs 10, lost 0, doubled 0', issues = '', tester = 'SP', drop = [] } = {}) {
  const lines = REQUIRED_ROWS.filter((id) => !drop.includes(id)).map((id) => {
    const r = { result: 'pass', numbers: 'yes', captured: 'about.png', issue: '', ...(rows[id] ?? {}) };
    return `| ${id} | ${r.result} | ${r.numbers} | ${r.captured} | ${r.issue} | no |`;
  });
  return `# Device session 2026-11-05, build 1.0.0 (1), se3

## Session

| Field | Value |
|---|---|
| Tester | ${tester} |

## Results

| ID | Result | Numbers (with units) | Captured | Issue | Owner doc updated? |
|---|---|---|---|---|---|
${lines.join('\n')}

${tally}

${extra}

## Issues filed

| Issue | Severity (S0 to S3) | Row | One line, no letter text |
|---|---|---|---|
${issues}

## Sign-off

| Who | What | Date |
|---|---|---|
| Tester | Every row above has a result | 2026-11-05 |

Verdict: ${verdict}
`;
}

const errs = (text) => checkEvidence(text).errors;
const has = (text, part) => errs(text).some((e) => e.includes(part));

test('[HV2-014] a complete passing file is valid and its verdict is pass', () => {
  const r = checkEvidence(build());
  assert.deepEqual(r.errors, []);
  assert.equal(r.verdict, 'pass');
});

test('[HV2-014] the required rows are the ones the run sheets and device plan really define', () => {
  const sheets = {
    'AL-01': 'AL-01-first-run.md',
    'AL-02': 'AL-02-record-offline.md',
    'AL-03': 'AL-03-kill-during-save.md',
    'AL-07': 'AL-07-account-deletion.md',
    'AL-08': 'AL-08-server-kill-switch.md',
  };
  const plan = readFileSync(join(ROOT, 'docs/qa/DEVICE_TEST_PLAN.md'), 'utf8');
  for (const id of REQUIRED_ROWS) {
    if (id.startsWith('AL-')) {
      const sheet = readFileSync(join(ROOT, 'docs/qa/run-sheets', sheets[id.slice(0, 5)]), 'utf8');
      assert.ok(sheet.includes(`| ${id} |`), `${id} has no row in ${sheets[id.slice(0, 5)]}`);
    } else if (id === 'TF-04') {
      assert.match(plan, /### TF-04 Smoke list/);
    } else {
      assert.ok(plan.includes(`### ${id} `), `${id} is not a heading in DEVICE_TEST_PLAN.md`);
    }
  }
});

test('[HV2-014] the kit names every required row range and the checker command', () => {
  const kit = readFileSync(join(ROOT, 'docs/qa/evidence/KIT-B1.md'), 'utf8');
  for (const id of ['TF-04', 'AL-01.0', 'AL-01.12', 'AL-02.0', 'AL-02.12', 'AL-03.0', 'AL-03.4', 'AL-08.0', 'AL-08.3', 'AL-07.1', 'AL-07.3', 'S1-23', 'S1-24']) {
    assert.ok(kit.includes(id), `KIT-B1.md does not mention ${id}`);
  }
  assert.ok(kit.includes('node scripts/qa/evidence-check.mjs'));
});

test('[HV2-014] the untouched template is refused (planted: nothing filled in)', () => {
  const tpl = readFileSync(join(ROOT, 'docs/qa/evidence/TEMPLATE.md'), 'utf8');
  assert.ok(errs(tpl).length > 0);
  assert.ok(has(tpl, 'required row is missing'));
});

test('[HV2-014] an empty Result is refused (planted: empty row)', () => {
  const t = build({ rows: { 'AL-02.4': { result: '' } } });
  assert.ok(has(t, 'AL-02.4: empty Result'));
});

test('[HV2-014] a Result left as template words is refused (planted: "pass or stop")', () => {
  assert.ok(has(build({ rows: { 'AL-01.0': { result: 'pass or stop' } } }), 'AL-01.0'));
});

test('[HV2-014] pass with no numbers is refused', () => {
  assert.ok(has(build({ rows: { 'AL-01.5': { numbers: '' } } }), 'AL-01.5: pass with no Numbers'));
});

test('[HV2-014] n/a and blocked need a reason, in the Result or the Numbers cell', () => {
  assert.ok(has(build({ rows: { 'AL-07.1': { result: 'n/a', numbers: '' } } }), 'AL-07.1: n/a needs a reason'));
  assert.ok(has(build({ rows: { 'AL-07.2': { result: 'blocked', numbers: '' } } }), 'AL-07.2: blocked needs a reason'));
  assert.deepEqual(errs(build({ rows: { 'AL-07.1': { result: 'n/a (build 1, no Delete account row)', numbers: '' } } })), []);
  assert.deepEqual(errs(build({ rows: { 'AL-07.2': { result: 'n/a', numbers: 'flag off' } } })), []);
});

test('[HV2-014] a missing required row is refused', () => {
  assert.ok(has(build({ drop: ['AL-03.2'] }), 'AL-03.2: required row is missing'));
});

test('[HV2-014] a duplicated row is refused', () => {
  const t = build();
  const dup = t.replace('## Issues filed', '| AL-01.1 | pass | yes | a.png | | no |\n\n## Issues filed');
  assert.ok(has(dup, 'AL-01.1: appears twice'));
});

test('[HV2-014] "not run" is refused unless the verdict is stop', () => {
  assert.ok(has(build({ rows: { 'AL-02.9': { result: 'not run' } } }), '"not run"'));
  const stopped = build({
    rows: { 'AL-03.1': { result: 'stop', numbers: 'letter missing after kill 4', issue: '#901' }, 'AL-03.2': { result: 'not run' } },
    verdict: 'stop',
    tally: 'Kill tally: runs 4, lost 1, doubled 0',
    issues: '| #901 | S0 | AL-03.1 | letter missing after kill |',
  });
  assert.deepEqual(errs(stopped), []);
  assert.equal(checkEvidence(stopped).verdict, 'stop');
});

test('[HV2-014] a failed row gives verdict fail, needs an issue, and a pass verdict is refused', () => {
  const row = { 'AL-01.9': { result: 'fail', numbers: '4 s, expected 1 s', issue: '#902' } };
  const ok = build({ rows: row, verdict: 'fail', issues: '| #902 | S2 | AL-01.9 | permission card slow |' });
  assert.deepEqual(errs(ok), []);
  assert.equal(checkEvidence(ok).verdict, 'fail');
  assert.ok(has(build({ rows: row, verdict: 'pass' }), 'Verdict says pass but the rows say fail'));
  assert.ok(has(build({ rows: { 'AL-01.9': { result: 'fail', numbers: '4 s' } }, verdict: 'fail' }), 'fail with no Issue'));
});

test('[HV2-014] an S0 in Issues filed forces stop; a lost or doubled letter in the tally forces stop', () => {
  const s0 = build({ issues: '| #903 | S0 | AL-02.6 | words missing |', verdict: 'pass' });
  assert.ok(has(s0, 'Verdict says pass but the rows say stop'));
  const lost = build({ tally: 'Kill tally: runs 10, lost 1, doubled 0', verdict: 'pass' });
  assert.ok(has(lost, 'kill tally shows lost 1'));
  assert.equal(checkEvidence(lost).verdict, 'stop');
});

test('[HV2-014] a pass needs the kill tally line', () => {
  assert.ok(has(build({ tally: '' }), 'Kill tally'));
});

test('[HV2-014] a missing, repeated or odd Verdict line is refused', () => {
  assert.ok(has(build().replace('Verdict: pass', ''), 'no "Verdict'));
  assert.ok(has(build() + '\nVerdict: pass\n', 'more than one Verdict'));
  assert.ok(has(build({ verdict: 'mostly' }), 'must be pass, fail or stop'));
});

test('[HV2-014] name-like and secret-like strings are refused (planted)', () => {
  const planted = [
    ['an email address', 'Mama signed in as someone@example.com today'],
    ['a link', 'invite https://example.com/join/abc was opened'],
    ['a user or session id', 'user 123e4567-e89b-12d3-a456-426614174000'],
    ['a token', 'token eyJhbGciOiJIUzI1NiJ9.payload'],
    ['a key or token prefix', 'key sb_secret_abc'],
    ['a long hex string', 'receipt 0123456789abcdef0123456789abcdef'],
    ['a long token-like string', 'device Zk3Qw9Lm2Xp7Rt5Vb8Nc4Hj6Fd1Gs0Aq'],
    ['a six digit sign-in code', 'the sign-in code was 482913'],
    ['looks like a real name', 'The child named Priya spoke first'],
    ['looks like a real name', 'baby: Rohan laughed'],
  ];
  for (const [what, line] of planted) {
    assert.ok(has(build({ extra: line }), what), `not caught (${what}): ${line}`);
  }
});

test('[HV2-014] the fictional family and ordinary words are not flagged', () => {
  const t = build({ extra: 'The child named Asha read a letter for Avi. Mama and Papa listened. Baby Settings row opened. Device packs.earlyletters.app and huggingface.co shown.' });
  assert.deepEqual(errs(t), []);
});

test('[HV2-014] the tester is initials only', () => {
  assert.ok(has(build({ tester: 'Saurabh' }), 'Tester must be initials'));
});

test('[HV2-014] text inside the template HTML comment is ignored', () => {
  const t = build({ extra: '<!-- never write a real email like a@b.com or a child named Priya here -->' });
  assert.deepEqual(errs(t), []);
});

test('[HV2-014] parseRows reads ids and cells', () => {
  const rows = parseRows(build());
  assert.equal(rows.length, REQUIRED_ROWS.length);
  assert.deepEqual(rows[0], { id: 'TF-04', result: 'pass', numbers: 'yes', captured: 'about.png', issue: '' });
});

test('[HV2-014] CLI: exit 0 on a valid file, 1 on a bad one, 2 on usage', () => {
  const dir = mkdtempSync(join(tmpdir(), 'evidence-'));
  const good = join(dir, 'good.md');
  const bad = join(dir, 'bad.md');
  writeFileSync(good, build());
  writeFileSync(bad, build({ rows: { 'AL-01.1': { result: '' } } }));
  const g = spawnSync(process.execPath, [SCRIPT, good], { encoding: 'utf8' });
  assert.equal(g.status, 0);
  assert.match(g.stdout, /valid, verdict pass/);
  const b = spawnSync(process.execPath, [SCRIPT, bad], { encoding: 'utf8' });
  assert.equal(b.status, 1);
  assert.match(b.stderr, /AL-01\.1: empty Result/);
  assert.equal(spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' }).status, 2);
  assert.equal(spawnSync(process.execPath, [SCRIPT, join(dir, 'nope.md')], { encoding: 'utf8' }).status, 2);
});
