// CR-71 C9 (20261111000000): authenticator (the Data API login role) cannot become insights_reader.
// Fictional family "Asha" only (CLAUDE.md). The harness has no authenticator role, so the test builds the
// hosted state itself: it creates authenticator and the old grant, then proves the old path works (the
// control, which is also the mutant: the migration left out) and that after the migration it is closed.
// PGlite cannot return from a `set session authorization` of a non-superuser, so each state gets its own
// database and the session switch is the last step on it.
//   [CR71-C9] authenticator cannot use insights_reader; service_role and a direct reader keep their reads.
import { readFileSync } from 'node:fs';
import { createDb } from './harness.mjs';

const files = process.argv.slice(2);
const mine = files.find((f) => f.split('/').pop().startsWith('20261111000000'));
if (!mine) throw new Error('20261111000000_insights_reader_not_via_api.sql is not in the migration list');
const migration = readFileSync(mine, 'utf8');
let failures = 0;
let passes = 0;
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (ok) passes++; else failures++; };
const HOSTED = 'create role authenticator login noinherit; grant insights_reader to authenticator';
const VIEW = 'select * from insights.weekly_keeping_families';

const members = async (sys) => (await sys(`select count(*)::int n from pg_auth_members m
  join pg_roles r on r.oid = m.roleid join pg_roles g on g.oid = m.member
 where r.rolname = 'insights_reader' and g.rolname = 'authenticator'`)).rows[0].n;
const asRole = (h, role, sql) => h.codeOf(async () => {
  await h.sys(`set role ${role}`);
  try { await h.sys(sql); } finally { await h.sys('reset role'); }
});
// The Data API session: the connection is authenticator, then PostgREST switches to the JWT role.
const viaApi = (h, sql) => h.codeOf(async () => { await h.sys('set session authorization authenticator'); await h.sys('set role insights_reader'); await h.sys(sql); });

// State 1: hosted, migration NOT run (the mutant). The old path must work, so the check below can fail.
const before = await createDb(files);
await before.db.exec(HOSTED);
check('[CR71-C9] mutant: without the migration the membership is held', (await members(before.sys)) === 1);
check('[CR71-C9] mutant: without the migration authenticator becomes insights_reader and reads a view', (await viaApi(before, VIEW)) === 'ok');

// State 2: hosted, migration run.
const after = await createDb(files);
await after.db.exec(HOSTED);
check('[CR71-C9] before the migration the membership is held', (await members(after.sys)) === 1);
await after.db.exec(migration);
check('[CR71-C9] after the migration authenticator is not a member of insights_reader', (await members(after.sys)) === 0);
check('[CR71-C9] service_role still calls insights_aggregates', (await asRole(after, 'service_role', 'select public.insights_aggregates(4)')) === 'ok');
check('[CR71-C9] a direct insights_reader login still reads the published views', (await asRole(after, 'insights_reader', VIEW)) === 'ok');
check('[CR71-C9] insights_reader still cannot read a base table (42501)', (await asRole(after, 'insights_reader', 'select count(*) from public.entries')) === '42501');
check('[CR71-C9] a second run changes nothing', (await after.codeOf(() => after.db.exec(migration))) === 'ok' && (await members(after.sys)) === 0);
check('[CR71-C9] authenticator cannot set role insights_reader (42501)', (await viaApi(after, VIEW)) === '42501');

// State 3: a local database with no authenticator role: the file runs clean.
const local = await createDb(files);
check('[CR71-C9] with no authenticator role the file runs clean', (await local.codeOf(() => local.db.exec(migration))) === 'ok');

console.log(failures ? `\n${failures} FAILED (${passes} passed)` : `\nALL PASSED (${passes} checks)`);
process.exit(failures ? 1 : 0);
