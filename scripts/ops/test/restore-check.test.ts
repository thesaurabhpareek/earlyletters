// BL-566: the restore drill compares a restored copy with the dump's own manifest, table by table.
// psql is stubbed, as in smoke.test.ts. Run: npx -y deno@2.9.6 test --no-prompt --allow-read --sloppy-imports scripts/ops
import assert from 'node:assert/strict';
import { countOf, countSql, POLICIES_SQL, runRestoreCheck, verdict, type RestoreCheckDeps } from '../lib/restore-check.ts';
import { CopyCounter, formatManifest, manifestGaps, parseManifest, policiesFromToc, REQUIRED_TABLES, tablesFromCopyText, type Manifest } from '../lib/dump-manifest.ts';
import type { SqlOutcome } from '../lib/smoke.ts';
import { dbTargetOf, type DbTarget } from '../lib/target.ts';

const PW = 'pw-restore-fixture-7c1d';
const LOCAL = `postgres://postgres:${PW}@localhost:55432/postgres?sslmode=disable`;

/** A dump of the fictional family Asha: every required table, some others, 3 of them empty. */
function dumpManifest(): Manifest {
  const tables: Record<string, number> = {};
  for (const t of REQUIRED_TABLES) tables[t] = 3;
  tables['public.entries'] = 12;
  tables['public.purge_ledger'] = 0;
  tables['auth.identities'] = 2;
  tables['ops.apple_tokens'] = 1;
  tables['public.held_drafts'] = 0;
  return { policies: 55, tables };
}
const MANIFEST = dumpManifest();
const MANIFEST_TEXT = formatManifest(MANIFEST);

/** A stand-in restored database that holds exactly `restored` (table to rows) and `policies`. */
function restoredDb(restored: Record<string, number>, policies: number, overrides: Record<string, SqlOutcome> = {}) {
  const asked: string[] = [];
  const targets: DbTarget[] = [];
  const deps: RestoreCheckDeps = {
    sql: (t) => {
      targets.push(t);
      return (sql) => {
        asked.push(sql);
        if (sql === POLICIES_SQL) return Promise.resolve({ ok: true, text: String(policies) });
        for (const name of Object.keys(MANIFEST.tables)) {
          if (sql === countSql(name)) {
            if (overrides[name]) return Promise.resolve(overrides[name]);
            return Promise.resolve(name in restored ? { ok: true as const, text: String(restored[name]) } : { ok: false as const, kind: 'sql' as const, sqlstate: '42P01' });
          }
        }
        return Promise.resolve({ ok: false, kind: 'sql', sqlstate: '42601' });
      };
    },
    readFile: (path) => (path === 'manifest.txt' ? MANIFEST_TEXT : null),
  };
  return { deps, asked, targets };
}
const FULL = { ...MANIFEST.tables };

async function run(args: string[], vars: Record<string, string>, deps: RestoreCheckDeps) {
  const out: string[] = [];
  const code = await runRestoreCheck(args, (k) => vars[k] ?? '', deps, { print: (l) => out.push(l), printError: (l) => out.push(`stderr:${l}`) });
  return { code, out: out.join('\n') };
}
const ARGS = ['--manifest', 'manifest.txt'];

Deno.test('[BL-566] a restore that matches the dump table for table passes, counts only', async () => {
  const w = restoredDb(FULL, 55);
  const r = await run(ARGS, { RESTORED_DB_URL: LOCAL }, w.deps);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /Compared 13 tables and the policy count/);
  assert.match(r.out, /\nPASS$/);
  assert.equal(w.asked.length, Object.keys(MANIFEST.tables).length + 1, 'every manifest table and the policy count, nothing else');
  assert.ok(!r.out.includes(PW) && !r.out.includes('localhost'), 'never the URL or password');
  assert.equal(w.targets[0].env.PGPASSWORD, PW, 'the password travels as PGPASSWORD, not argv');
});

Deno.test('[BL-566] a restore that lost ANY table, any rows or any policy cannot pass (mutation-proof: every table is judged)', async () => {
  // One table at a time, lost entirely: not only entries, policy_acceptances and deletion_requests.
  for (const lost of Object.keys(MANIFEST.tables)) {
    const { [lost]: _gone, ...rest } = FULL;
    const r = await run(ARGS, { RESTORED_DB_URL: LOCAL }, restoredDb(rest, 55).deps);
    assert.equal(r.code, 1, `losing ${lost} must fail`);
    assert.match(r.out, new RegExp(`FINDING {2}${lost.replace('.', '\\.')} is missing from the restored copy`));
  }
  // One table at a time, restored with one row too few (or, for an empty table, one too many).
  for (const [t, n] of Object.entries(MANIFEST.tables)) {
    const r = await run(ARGS, { RESTORED_DB_URL: LOCAL }, restoredDb({ ...FULL, [t]: n === 0 ? 1 : n - 1 }, 55).deps);
    assert.equal(r.code, 1, `a different count in ${t} must fail`);
    assert.match(r.out, new RegExp(`FINDING {2}${t.replace('.', '\\.')}: restored`));
  }
  // The policies (the access rules) lost or doubled.
  assert.equal((await run(ARGS, { RESTORED_DB_URL: LOCAL }, restoredDb(FULL, 0).deps)).code, 1);
  assert.match((await run(ARGS, { RESTORED_DB_URL: LOCAL }, restoredDb(FULL, 54).deps)).out, /policies: restored 54, the dump holds 55/);
  // A table that exists but cannot be read.
  const denied = await run(ARGS, { RESTORED_DB_URL: LOCAL }, restoredDb(FULL, 55, { 'auth.users': { ok: false, kind: 'sql', sqlstate: '42501' } }).deps);
  assert.equal(denied.code, 1);
  assert.match(denied.out, /auth\.users could not be counted \(SQLSTATE 42501\)/);
});

Deno.test('[BL-566] a manifest that itself lacks a required table or any policies cannot give PASS', async () => {
  const { 'public.children': _c, ...fewer } = MANIFEST.tables;
  const bad: Manifest = { policies: 55, tables: fewer };
  assert.deepEqual(manifestGaps(bad), ['the dump holds no data section for public.children']);
  const w = restoredDb(FULL, 55);
  w.deps.readFile = () => formatManifest(bad);
  const r = await run(ARGS, { RESTORED_DB_URL: LOCAL }, w.deps);
  assert.equal(r.code, 1);
  assert.match(r.out, /manifest: the dump holds no data section for public\.children/);
  assert.equal(manifestGaps({ policies: 0, tables: MANIFEST.tables }).length, 1);
});

Deno.test('[BL-566] usage: no URL, no manifest, a bad manifest, a URL without TLS off this machine, no connection', async () => {
  const w = restoredDb(FULL, 55);
  assert.equal((await run(ARGS, {}, w.deps)).code, 2);
  assert.equal((await run([], { RESTORED_DB_URL: LOCAL }, w.deps)).code, 2);
  assert.equal((await run(['--manifest', 'nope.txt'], { RESTORED_DB_URL: LOCAL }, w.deps)).code, 2);
  const junk = restoredDb(FULL, 55);
  junk.deps.readFile = () => 'entries=12,policy_acceptances=4,deletion_requests=1';
  assert.equal((await run(ARGS, { RESTORED_DB_URL: LOCAL }, junk.deps)).code, 2);
  const remote = await run(ARGS, { RESTORED_DB_URL: `postgres://postgres:${PW}@db.abcdefghijklmnopqrst.supabase.co:5432/postgres?sslmode=disable` }, w.deps);
  assert.equal(remote.code, 2);
  assert.match(remote.out, /^RESTORED_DB_URL must use TLS/);
  assert.ok(!remote.out.includes(PW));
  assert.equal(w.asked.length, 0, 'nothing is sent before the arguments are right');
  const down = await run(ARGS, { RESTORED_DB_URL: LOCAL }, restoredDb(FULL, 55, { 'auth.identities': { ok: false, kind: 'connect' } }).deps);
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

Deno.test('[BL-566] the SQL built from a manifest is fixed in shape and refuses any other name', () => {
  assert.equal(countSql('public.entries'), 'select count(*) from "public"."entries"');
  for (const bad of ['entries', 'public.entries; drop table x', 'public."entries"', 'Public.Entries', 'a.b.c', "public.e'x", '']) {
    assert.throws(() => countSql(bad), /not allowed/, bad);
  }
  assert.deepEqual(countOf('public.entries', { ok: true, text: 'not a number' }), { table: 'public.entries', state: 'unreadable' });
  assert.deepEqual(countOf('public.entries', { ok: false, kind: 'timeout' }), { table: 'public.entries', state: 'unreadable', sqlstate: undefined });
  assert.equal(verdict({ policies: 1, tables: {} }, [], { table: 'policies', state: 'counted', rows: 1 }).pass, false, 'an empty manifest is not a pass');
});

Deno.test('[BL-566] the manifest reader counts every COPY block, empty ones too, and never keeps a row', () => {
  const dump = [
    'COPY public.entries (id, body) FROM stdin;', 'a\tone', 'b\tCOPY public.fake (x) FROM stdin;', '\\.',
    'COPY public.purge_ledger (id) FROM stdin;', '\\.',
    'COPY auth.users (id) FROM stdin;', 'u1', 'u2', 'u3', '\\.',
    '',
  ];
  assert.deepEqual(tablesFromCopyText(dump), { tables: { 'public.entries': 2, 'public.purge_ledger': 0, 'auth.users': 3 }, unparsed: 0 });
  assert.equal(tablesFromCopyText(['COPY public."Odd Name" (x) FROM stdin;', 'r', '\\.', 'COPY public.ok (x) FROM stdin;', 'r', '\\.']).unparsed, 1, 'a name it cannot read is reported, not skipped');
  const c = new CopyCounter();
  c.push('COPY public.t (x) FROM stdin;');
  c.push('\\.');
  c.push('plain line outside a block');
  assert.deepEqual(c.tables, { 'public.t': 0 });
  const toc = ['; Archive created at x', '1; 0 0 TABLE public entries postgres', '2; 3 4 POLICY public entries entries_read postgres', '3; 3 4 POLICY public children c_read postgres', '; 9 POLICY comment line'].join('\n');
  assert.equal(policiesFromToc(toc), 2);
});

Deno.test('[BL-566] a manifest round-trips and a damaged one is refused', () => {
  const back = parseManifest(MANIFEST_TEXT);
  assert.deepEqual(back.manifest, MANIFEST);
  for (const bad of ['', 'policies=1', `${MANIFEST_TEXT}table public.x;drop=1\n`, MANIFEST_TEXT.replace('policies=55\n', '')]) {
    assert.equal(parseManifest(bad).manifest, null, bad.slice(0, 30));
  }
});
