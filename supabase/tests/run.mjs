// Runs every supabase/tests/*.test.mjs against all applied-or-pending migrations
// in supabase/migrations (filename order; drafts/ excluded).
// Usage: node supabase/tests/run.mjs [filter] [--junit <path>]   e.g. `npm run test:db -- perf`
//   filter            run only files whose name contains it
//   --junit <path>    also write a JUnit XML report there (or set DB_TEST_JUNIT=<path>)
//
// Named sections (BL-110): files run grouped by SECTIONS below, sections in that order and files
// by name inside each. A file no rule matches runs in "other", so a new test file is never dropped.
// Each file is a separate process with its own database, so grouping does not change any result.
//
// Output contract, read by scripts/ci/skip-guard.mjs and by people reading CI logs:
//   "=== <file> (N migrations) ===" before each file's own output, and the last line
//   "All N database test files passed." or "FAILED: a, b", exit 0 or 1. Keep both exact.
//   Section lines start with "--- section" and the overview with "Sections:" and two spaces, so
//   none of them reads as a file summary (ALL PASSED, N FAILED, ok, SKIP) to skip-guard.
//
// JUnit: one testsuite per section, one testcase per file, time in seconds. A failure holds the
// exit code, the file's FAIL lines and the tail of its output; nothing else of the run (no
// migration text, no environment) goes in the file. Without --junit the children inherit stdio
// exactly as before; with it their output is piped, streamed to the console as it comes, and a
// bounded tail is kept for the report.
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const migDir = join(here, '..', 'migrations');

// First match wins. Rules are on the file name; keep them broad so new files land somewhere sensible.
const SECTIONS = [
  ['performance', /(^|_)perf\.test\.mjs$|^no_btree_/],
  ['access', /^(access_matrix|rls|explicit_grants|security_family|coparent_no_raw|photo_bucket_closed|backup_role|pg_temp_search_path|function_rpc_contract|v1_gate_)/],
  ['consent', /^(consent_|compliance_gates)/],
  ['sync', /^(sync_|v1_wire_|keeping_server|account_purge_sync_pull)/],
  ['governance', /^(audit_|data_governance|deletion_|former_member_|purge|account_purge|audio_backup|export_)/],
  ['classification', /^classification/],
  ['insights', /^insights_/],
  ['entries', /^(entries_|entry_|book_entries_|held_drafts_|child_name_|children_|free_limits_|subscription_|value_free_)/],
  ['ops', /^(ops_|db_followup_|db_harness_|new_device_|invite_redeem_|auth_config|migration_)/],
];
const OTHER = 'other';
const sectionOf = (file) => (SECTIONS.find(([, re]) => re.test(file)) || [OTHER])[0];

function parseArgs(argv, env) {
  const o = { filter: undefined, junit: env.DB_TEST_JUNIT || undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--junit') {
      o.junit = argv[++i];
      if (!o.junit) throw new Error('--junit needs a path');
    } else if (a.startsWith('--junit=')) {
      o.junit = a.slice('--junit='.length);
      if (!o.junit) throw new Error('--junit needs a path');
    } else if (o.filter === undefined) o.filter = a;
    else throw new Error(`unexpected argument ${a}`);
  }
  return o;
}

// XML 1.0 text and attribute escaping. Drops ANSI colour codes and the control characters XML
// cannot hold at all (everything below 0x20 except tab, newline and carriage return).
const ANSI = /\u001b\[[0-9;?]*[ -\/]*[@-~]/g;
function xml(s) {
  return String(s)
    .replace(ANSI, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
    .replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const TAIL_LINES = 40;
const TAIL_CHARS = 8000;
const MAX_FAIL_LINES = 50;

// Keeps the last TAIL_LINES lines of a stream and every FAIL line (up to MAX_FAIL_LINES), in bounded memory.
function makeTail() {
  let partial = '';
  const lines = [];
  const fails = [];
  const take = (line) => {
    lines.push(line);
    if (lines.length > TAIL_LINES) lines.shift();
    if (/^FAIL\b/.test(line.replace(ANSI, '')) && fails.length < MAX_FAIL_LINES) fails.push(line);
  };
  return {
    push(chunk) {
      const parts = (partial + chunk).split(/\r?\n/);
      partial = parts.pop();
      if (partial.length > TAIL_CHARS) partial = partial.slice(-TAIL_CHARS);
      for (const p of parts) take(p);
    },
    end() {
      if (partial) take(partial);
      partial = '';
      const text = lines.join('\n');
      return { tail: text.length > TAIL_CHARS ? text.slice(-TAIL_CHARS) : text, fails };
    },
  };
}

function runFile(t, migrations, capture) {
  const started = process.hrtime.bigint();
  const seconds = () => Number(process.hrtime.bigint() - started) / 1e9;
  return new Promise((done) => {
    const child = spawn(process.execPath, [join(here, t), ...migrations], { stdio: capture ? ['inherit', 'pipe', 'pipe'] : 'inherit' });
    const tail = capture ? makeTail() : null;
    if (capture) {
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (c) => { process.stdout.write(c); tail.push(c); });
      child.stderr.on('data', (c) => { process.stderr.write(c); tail.push(c); });
    }
    child.on('error', (e) => done({ file: t, status: null, signal: null, error: e.message, seconds: seconds(), tail: '', fails: [] }));
    child.on('close', (status, signal) => {
      const kept = tail ? tail.end() : { tail: '', fails: [] };
      done({ file: t, status, signal, seconds: seconds(), ...kept });
    });
  });
}

function junitXml(sections) {
  const all = sections.flatMap((s) => s.results);
  const sum = (rs) => rs.reduce((n, r) => n + r.seconds, 0).toFixed(3);
  const bad = (rs) => rs.filter((r) => r.status !== 0).length;
  const out = ['<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuites name="database" tests="${all.length}" failures="${bad(all)}" errors="0" time="${sum(all)}">`];
  for (const s of sections) {
    out.push(`  <testsuite name="${xml(s.name)}" tests="${s.results.length}" failures="${bad(s.results)}" errors="0" skipped="0" time="${sum(s.results)}">`);
    for (const r of s.results) {
      const open = `    <testcase classname="db.${xml(s.name)}" name="${xml(r.file)}" time="${r.seconds.toFixed(3)}"`;
      if (r.status === 0) { out.push(`${open}/>`); continue; }
      const why = r.error ? `could not start: ${r.error}` : r.signal ? `killed by ${r.signal}` : `exit code ${r.status}`;
      const body = [why];
      if (r.fails.length) body.push('', 'FAIL lines:', ...r.fails);
      if (r.tail) body.push('', `last lines of output:`, r.tail);
      out.push(`${open}>`, `      <failure message="${xml(why)}" type="exit">${xml(body.join('\n'))}</failure>`, '    </testcase>');
    }
    out.push('  </testsuite>');
  }
  out.push('</testsuites>', '');
  return out.join('\n');
}

async function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2), process.env); } catch (e) {
    console.error(`run.mjs: ${e.message}`);
    process.exit(2);
  }
  const migrations = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort().map((f) => join(migDir, f));
  const { filter } = opts;
  const tests = readdirSync(here).filter((f) => f.endsWith('.test.mjs') && (!filter || f.includes(filter))).sort();

  const order = [...SECTIONS.map(([name]) => name), OTHER];
  const sections = order
    .map((name) => ({ name, files: tests.filter((t) => sectionOf(t) === name), results: [] }))
    .filter((s) => s.files.length);

  let failed = [];
  for (const s of sections) {
    console.log(`\n--- section ${s.name} (${s.files.length} file${s.files.length === 1 ? '' : 's'}) ---`);
    for (const t of s.files) {
      console.log(`\n=== ${t} (${migrations.length} migrations) ===`);
      const r = await runFile(t, migrations, !!opts.junit);
      s.results.push(r);
      if (r.status !== 0) failed.push(t);
    }
    const sBad = s.results.filter((r) => r.status !== 0).map((r) => r.file);
    console.log(`\n--- section ${s.name}: ${s.results.length - sBad.length} passed, ${sBad.length} failed${sBad.length ? ` (${sBad.join(', ')})` : ''} ---`);
  }

  if (sections.length) {
    console.log('\nSections:');
    const w = Math.max(...sections.map((s) => s.name.length));
    for (const s of sections) {
      const bad = s.results.filter((r) => r.status !== 0).length;
      console.log(`  ${s.name.padEnd(w)}  ${s.results.length - bad} passed  ${bad} failed`);
    }
  }

  let exit = failed.length ? 1 : 0;
  if (opts.junit) {
    const path = resolve(opts.junit);
    try {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, junitXml(sections));
      console.log(`\nJUnit report: ${path}`);
    } catch (e) {
      console.error(`\nJUnit report: could not write ${path}: ${e.message}`);
      exit = 1;
    }
  }
  console.log(failed.length ? `\nFAILED: ${failed.join(', ')}` : `\nAll ${tests.length} database test files passed.`);
  process.exit(exit);
}

main();
