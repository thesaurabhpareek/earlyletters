// BL-110: the database test harness (supabase/tests/run.mjs) groups files into named sections and
// writes an opt-in JUnit report, while keeping the lines scripts/ci/skip-guard.mjs and CI logs read.
// No database: copies run.mjs into a temp tree with fake child scripts and fake migrations, runs it
// and reads its console output and XML. Runs under `npm run test:db` (the runner passes the migration
// list, which this file ignores), or directly: node supabase/tests/db_harness_run.test.mjs
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDb } from '../../scripts/ci/skip-guard.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let failures = 0;
let passes = 0;
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (ok) passes++; else failures++; };

const MIGRATION_MARKER = 'harness_test_migration_body_marker';
const ENV_MARKER = 'harness_test_env_value_marker';

const pass = (n) => `console.log('PASS  [BL-110] check one');\nconsole.log('\\nALL PASSED (${n} checks)');\n`;
// A failing child: requirement id in the title, XML specials, a control character and an ANSI colour.
const fail = [
  "console.log('PASS  [SEC-R03] fine');",
  "console.log('FAIL  [SEC-R03] owner <b> & \"c\" \\'d\\' bell\\u0007 \\u001b[31mred\\u001b[0m');",
  "console.error('stderr line from the child');",
  "console.log('\\n1 FAILED (1 passed)');",
  'process.exit(1);',
  '',
].join('\n');

function makeTree(files) {
  const root = mkdtempSync(join(tmpdir(), 'db-harness-'));
  mkdirSync(join(root, 'supabase', 'tests'), { recursive: true });
  mkdirSync(join(root, 'supabase', 'migrations'), { recursive: true });
  copyFileSync(join(here, 'run.mjs'), join(root, 'supabase', 'tests', 'run.mjs'));
  writeFileSync(join(root, 'supabase', 'migrations', '20260101000000_a.sql'), `-- ${MIGRATION_MARKER}\nselect 1;\n`);
  writeFileSync(join(root, 'supabase', 'migrations', '20260102000000_b.sql'), `-- ${MIGRATION_MARKER}\nselect 2;\n`);
  for (const [name, body] of Object.entries(files)) writeFileSync(join(root, 'supabase', 'tests', name), body);
  return root;
}

function run(root, args = [], env = {}) {
  const base = { ...process.env };
  // The outer harness may itself have been asked for JUnit; the inner runs must not write there.
  delete base.DB_TEST_JUNIT;
  const r = spawnSync(process.execPath, [join(root, 'supabase', 'tests', 'run.mjs'), ...args],
    { encoding: 'utf8', env: { ...base, HARNESS_TEST_ENV: ENV_MARKER, ...env }, cwd: root });
  return { status: r.status, out: r.stdout, err: r.stderr, lines: r.stdout.trimEnd().split('\n') };
}

const roots = [];
try {
  // 1. All pass, no JUnit: sections in order, the file header and the final line exactly as before.
  const a = makeTree({ 'rls.test.mjs': pass(1), 'sync_engine.test.mjs': pass(2), 'perf.test.mjs': pass(3), 'zz_new_thing.test.mjs': pass(1) });
  roots.push(a);
  const r1 = run(a);
  check('[BL-110] an all-green run exits 0', r1.status === 0);
  check('[BL-110] the last line is still "All N database test files passed."', r1.lines.at(-1) === 'All 4 database test files passed.');
  check('[BL-110] each file keeps its "=== file (N migrations) ===" header', ['rls', 'sync_engine', 'perf', 'zz_new_thing'].every((f) => r1.lines.includes(`=== ${f}.test.mjs (2 migrations) ===`)));
  const order = r1.lines.filter((l) => l.startsWith('--- section ') && l.endsWith('---') && !l.includes(':'));
  check('[BL-110] sections run in their fixed order, an unmatched file in "other"', JSON.stringify(order) === JSON.stringify([
    '--- section performance (1 file) ---', '--- section access (1 file) ---', '--- section sync (1 file) ---', '--- section other (1 file) ---']));
  check('[BL-110] each section prints its own summary', r1.lines.includes('--- section access: 1 passed, 0 failed ---'));
  check('[BL-110] the overview lists every section', r1.lines.includes('Sections:') && /^ {2}other +1 passed {2}0 failed$/.test(r1.lines.find((l) => l.trim().startsWith('other')) || ''));
  const rows = parseDb(r1.out);
  check('[BL-110] skip-guard still reads one summary per file with its own count', JSON.stringify(rows.map((x) => [x.suite, x.pass, x.found])) === JSON.stringify([
    ['db:perf.test.mjs', 3, true], ['db:rls.test.mjs', 1, true], ['db:sync_engine.test.mjs', 2, true], ['db:zz_new_thing.test.mjs', 1, true]]));
  check('[BL-110] no JUnit file is written unless asked', !existsSync(join(a, 'report.xml')) && !r1.out.includes('JUnit report'));

  // 2. Filter still narrows the run.
  const r2 = run(a, ['sync']);
  check('[BL-110] the filter argument still selects files by name', r2.status === 0 && r2.lines.at(-1) === 'All 1 database test files passed.' && !r2.out.includes('=== rls.test.mjs'));

  // 3. A failure with --junit: console streaming, final line, exit code and the XML.
  const b = makeTree({ 'rls.test.mjs': fail, 'access_matrix.test.mjs': pass(4), 'sync_engine.test.mjs': pass(2) });
  roots.push(b);
  const r3 = run(b, ['--junit', 'out/report.xml']);
  check('[BL-110] a failing file still makes the run exit 1', r3.status === 1);
  check('[BL-110] the last line is still "FAILED: <files>"', r3.lines.at(-1) === 'FAILED: rls.test.mjs');
  check('[BL-110] with JUnit on, child output is still streamed to the console', r3.out.includes('PASS  [SEC-R03] fine') && r3.err.includes('stderr line from the child'));
  check('[BL-110] the section summary names the failed file', r3.lines.includes('--- section access: 1 passed, 1 failed (rls.test.mjs) ---'));
  const xmlPath = join(b, 'out', 'report.xml');
  const x = existsSync(xmlPath) ? readFileSync(xmlPath, 'utf8') : '';
  check('[BL-110] --junit <path> writes the report, making its folder', x.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  check('[BL-110] one testsuite per section with its counts', /<testsuite name="access" tests="2" failures="1" errors="0" skipped="0" time="\d+\.\d{3}">/.test(x)
    && /<testsuite name="sync" tests="1" failures="0" errors="0" skipped="0" time="\d+\.\d{3}">/.test(x)
    && (x.match(/<testsuite /g) || []).length === 2 && (x.match(/<\/testsuite>/g) || []).length === 2);
  check('[BL-110] one testcase per file, with time in seconds', (x.match(/<testcase /g) || []).length === 3
    && /<testcase classname="db\.access" name="access_matrix\.test\.mjs" time="\d+\.\d{3}"\/>/.test(x));
  check('[BL-110] a failure carries the exit code', /<failure message="exit code 1" type="exit">exit code 1\n/.test(x));
  check('[BL-110] a failure lists the FAIL line with its requirement id, escaped', x.includes('FAIL  [SEC-R03] owner &lt;b&gt; &amp; &quot;c&quot; &apos;d&apos; bell red'));
  check('[BL-110] the failure holds the tail of the output, stderr included', x.includes('last lines of output:') && x.includes('stderr line from the child') && x.includes('1 FAILED (1 passed)'));
  check('[BL-110] no control character or ANSI code reaches the XML', !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(x));
  check('[BL-110] every & in the XML starts an entity', !/&(?!(amp|lt|gt|quot|apos);)/.test(x));
  check('[BL-110] the XML holds no migration text and no environment value', !x.includes(MIGRATION_MARKER) && !x.includes(ENV_MARKER) && !x.includes('select 1'));

  // 4. DB_TEST_JUNIT and --junit=path do the same; a passing report has no failure element.
  const c = makeTree({ 'rls.test.mjs': pass(1) });
  roots.push(c);
  const r4 = run(c, [], { DB_TEST_JUNIT: 'env.xml' });
  const r5 = run(c, ['rls', '--junit=eq.xml']);
  const ex = existsSync(join(c, 'env.xml')) ? readFileSync(join(c, 'env.xml'), 'utf8') : '';
  check('[BL-110] DB_TEST_JUNIT=<path> turns the report on', r4.status === 0 && ex.includes('<testsuites name="database" tests="1" failures="0"') && !ex.includes('<failure'));
  check('[BL-110] --junit=<path> with a filter works too', r5.status === 0 && existsSync(join(c, 'eq.xml')) && r5.lines.at(-1) === 'All 1 database test files passed.');

  // 5. Bad arguments are a usage error, not a silent pass.
  const r6 = run(c, ['--junit']);
  check('[BL-110] --junit with no path exits 2', r6.status === 2);
} finally {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} FAILED (${passes} passed)` : `\nALL PASSED (${passes} checks)`);
process.exit(failures ? 1 : 0);
