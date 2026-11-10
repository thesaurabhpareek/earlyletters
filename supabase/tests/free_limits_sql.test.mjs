// The weekly Free plan usage check (scripts/ops/free-limits.ts) runs its fixed SQL as the narrow backup role.
// This test runs those very statements, imported from the script, on a copy of the schema as that role, so a
// statement the role cannot run (or one that returns something other than a number) fails here and not on
// the first Monday after launch. Fictional family "Asha" only (CLAUDE.md).
import { readFileSync } from 'node:fs';
import { createDb, users } from './harness.mjs';
import { METRIC_SQL, SIGNINS_SQL } from '../../scripts/ops/lib/free-limits.ts';

const h = await createDb(process.argv.slice(2));
const { db, check, done } = h;
await db.exec(`
  alter table auth.users add column last_sign_in_at timestamptz;
  create table auth.identities (id uuid primary key, user_id uuid not null);
  create schema vault; create table vault.secrets (id uuid primary key, secret text);
  insert into auth.users (id, last_sign_in_at) values ('${users.A}', now()), ('${users.B}', now() - interval '60 days'), ('${users.C}', null);
`);
await db.exec(readFileSync(new URL('../../docs/ops/backup/backup-role.sql', import.meta.url), 'utf8'));
await db.exec('reset role; set role scribe_backup');
const one = async (sql) => (await db.query(sql)).rows[0];
const val = async (sql) => Object.values(await one(sql))[0];

const size = await val(METRIC_SQL.database);
check('database size: a whole number of bytes above zero, as the backup role', /^\d+$/.test(String(size)) && Number(size) > 0);
check('accounts: every account counted (3)', String(await val(METRIC_SQL.mau)) === '3');
check('sign-ins in the last 30 days: only the recent one (1)', String(await val(SIGNINS_SQL)) === '1');
await db.exec('reset role');
done();
