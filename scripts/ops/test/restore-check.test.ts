// BL-566: the restore drill's row count for the free nightly staging backup.
// psql is stubbed, as in smoke.test.ts. Run: npx -y deno@2.9.6 test --no-prompt --allow-read --sloppy-imports scripts/ops
import assert from 'node:assert/strict';
import { COUNT_SQL, countOf, parseExpect, RESTORE_TABLES, runRestoreCheck, verdict, type RestoreCheckDeps } from '../lib/restore-check.ts';
import type { SqlOutcome } from '../lib/smoke.ts';
import { dbTargetOf, type DbTarget } from '../lib/target.ts';

const PW = 'pw-restore-fixture-7c1d';
const LOCAL = `postgres://postgres:${PW}@localhost:55432/postgres?sslmode=disable`;
const EXPECT = 'entries=12,policy_acceptances=4,deletion_requests=1';

/** A stand-in restored database: answers per table, and records what was asked and with which settings. */
function db(answers: Partial<Record<string, SqlOutcome>>) {
  const asked: string[] = [];
  const targets: DbTarget[] = [];
  const deps: RestoreCheckDeps = {
    sql: (t) => {
      targets.push(t);
      return (sql) => {
        asked.push(sql);
        const table = RESTORE_TABLES.find((n) => COUNT_SQL[n] === sql);
        return Promise.resolve(table && answers[table] ? answers[table]! : { ok: false, kind: 'sql', sqlstate: '42601' });
      };
    },
  };
  return { deps, asked, targets };
}
const counted = (n: number): SqlOutcome => ({ ok: true, text: String(n) });
const GOOD = { entries: counted(12), policy_acceptances: counted(4), deletion_requests: counted(1) };

async function run(args: string[], vars: Record<string, string>, deps: RestoreCheckDeps) {
  const out: string[] = [];
  const code = await runRestoreCheck(args, (k) => vars[k] ?? '', deps, { print: (l) => out.push(l), printError: (l) => out.push(`stderr:${l}`) });
  return { code, out: out.join('\n') };
}

Deno.test('[BL-566] a restore that matches the backup job counts passes, counts only', async () => {
  const w = db(GOOD);
  const r = await run(['--expect', EXPECT], { RESTORED_DB_URL: LOCAL }, w.deps);
  assert.equal(r.code, 0);
  assert.match(r.out, /entries: 12 {2}\(backup job: 12\)/);
  assert.match(r.out, /policy_acceptances: 4/);
  assert.match(r.out, /deletion_requests: 1/);
  assert.match(r.out, /\nPASS$/);
  assert.deepEqual(w.asked, RESTORE_TABLES.map((t) => COUNT_SQL[t]));
  assert.ok(!r.out.includes(PW) && !r.out.includes('localhost'), 'never the URL or password');
  assert.equal(w.targets[0].env.PGPASSWORD, PW, 'the password travels as PGPASSWORD, not argv');
  assert.equal(w.targets[0].env.PGSSLMODE, 'disable');
});

Deno.test('[BL-566] tables restored without their rows, a missing table or a wrong count fail', async () => {
  const empty = await run(['--expect', EXPECT], { RESTORED_DB_URL: LOCAL }, db({ ...GOOD, entries: counted(0) }).deps);
  assert.equal(empty.code, 1);
  assert.match(empty.out, /FINDING {2}entries: restored 0, the backup job counted 12/);
  assert.match(empty.out, /\nFAIL: /);

  const missing = await run([], { RESTORED_DB_URL: LOCAL }, db({ ...GOOD, deletion_requests: { ok: false, kind: 'sql', sqlstate: '42P01' } }).deps);
  assert.equal(missing.code, 1);
  assert.match(missing.out, /deletion_requests: MISSING/);
  assert.match(missing.out, /deletion_requests is missing from the restored copy/);

  const denied = await run([], { RESTORED_DB_URL: LOCAL }, db({ ...GOOD, policy_acceptances: { ok: false, kind: 'sql', sqlstate: '42501' } }).deps);
  assert.equal(denied.code, 1);
  assert.match(denied.out, /policy_acceptances could not be counted \(SQLSTATE 42501\)/);

  const noExpect = await run([], { RESTORED_DB_URL: LOCAL }, db(GOOD).deps);
  assert.equal(noExpect.code, 0);
  assert.match(noExpect.out, /No --expect given/);
});

Deno.test('[BL-566] usage: no URL, a URL without TLS off this machine, a bad --expect, no connection', async () => {
  const w = db(GOOD);
  assert.equal((await run([], {}, w.deps)).code, 2);
  const remote = await run([], { RESTORED_DB_URL: `postgres://postgres:${PW}@db.abcdefghijklmnopqrst.supabase.co:5432/postgres?sslmode=disable` }, w.deps);
  assert.equal(remote.code, 2);
  assert.match(remote.out, /^RESTORED_DB_URL must use TLS/);
  assert.ok(!remote.out.includes(PW));
  for (const bad of ['entries=12', 'entries=1,policy_acceptances=2,deletion_requests=x', 'children=1,entries=1,policy_acceptances=1,deletion_requests=1', '']) {
    assert.equal((await run(['--expect', bad], { RESTORED_DB_URL: LOCAL }, w.deps)).code, 2, bad);
  }
  assert.equal(w.asked.length, 0, 'nothing is sent before the arguments are right');
  const down = await run([], { RESTORED_DB_URL: LOCAL }, db({ entries: { ok: false, kind: 'connect' } }).deps);
  assert.equal(down.code, 2);
  assert.match(down.out, /^Could not connect/);
});

Deno.test('[BL-566] plain connections are allowed only on this machine; the smoke keeps TLS everywhere', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]']) {
    assert.equal(dbTargetOf(`postgres://postgres:pw@${host}:5432/postgres?sslmode=disable`, { allowPlainLocal: true }).target!.env.PGSSLMODE, 'disable');
    assert.equal(dbTargetOf(`postgres://postgres:pw@${host}:5432/postgres?sslmode=disable`).problem, 'SUPABASE_DB_URL must use TLS: sslmode require, verify-ca or verify-full');
  }
  for (const mode of ['prefer', 'allow']) {
    assert.ok(dbTargetOf(`postgres://postgres:pw@localhost/postgres?sslmode=${mode}`, { allowPlainLocal: true }).problem);
  }
  assert.ok(dbTargetOf('postgres://postgres:pw@localhost.example.com/postgres?sslmode=disable', { allowPlainLocal: true }).problem);
});

Deno.test('[BL-566] the SQL is fixed: count(*) of three public tables, nothing else', () => {
  assert.deepEqual([...RESTORE_TABLES], ['entries', 'policy_acceptances', 'deletion_requests']);
  for (const t of RESTORE_TABLES) assert.equal(COUNT_SQL[t], `select count(*) from public.${t}`);
  assert.deepEqual(parseExpect(' entries=3, policy_acceptances=0 ,deletion_requests=2').expect, { entries: 3, policy_acceptances: 0, deletion_requests: 2 });
  assert.deepEqual(countOf('entries', { ok: true, text: 'not a number' }), { table: 'entries', state: 'unreadable' });
  assert.deepEqual(countOf('entries', { ok: false, kind: 'timeout' }), { table: 'entries', state: 'unreadable', sqlstate: undefined });
  assert.deepEqual(verdict([{ table: 'entries', state: 'counted', rows: 5 }], null), { pass: true, findings: [] });
});
