// BL-566 review fix: the nightly backup role reads what the dump needs and nothing that signs a person in.
// Runs docs/ops/backup/backup-role.sql (the file the founder runs, unchanged) on a copy of the schema with
// stand-ins for the Auth and Vault tables that hold live credentials, then reads as `scribe_backup`.
// Fictional family "Asha" only (CLAUDE.md). Hosted Supabase may differ in who owns the Auth tables; the
// same checks run on the live project in backup-role.sql block 3 and in the workflow every night.
import { readFileSync } from 'node:fs';
import { createDb, users } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { db, check, sys, codeOf, done } = h;
const run = (sql) => db.exec(sql);

await run(`
  create table auth.users_extra_probe (id uuid);  -- an Auth table nobody listed: must stay unreadable
  create table auth.identities (id uuid primary key, user_id uuid not null);
  create table auth.refresh_tokens (id bigserial primary key, token text, user_id uuid);
  create table auth.one_time_tokens (id uuid primary key, token_hash text);
  create table auth.mfa_factors (id uuid primary key, secret text);
  create table auth.flow_state (id uuid primary key, auth_code text);
  create table auth.audit_log_entries (id uuid primary key, payload json);
  create schema vault;
  create table vault.secrets (id uuid primary key, secret text);
  create view vault.decrypted_secrets as select id, secret as decrypted_secret from vault.secrets;
  insert into auth.users (id) values ('${users.A}');
  insert into auth.identities (id, user_id) values (gen_random_uuid(), '${users.A}');
  insert into auth.refresh_tokens (token, user_id) values ('live-refresh-token-asha', '${users.A}');
  insert into vault.secrets (id, secret) values (gen_random_uuid(), 'vault-secret-asha');
`);

const file = new URL('../../docs/ops/backup/backup-role.sql', import.meta.url);
let ranFile = true;
try { await run(readFileSync(file, 'utf8')); } catch (e) { ranFile = false; console.log(e.message); }
check('backup-role.sql runs end to end as the owner', ranFile);

const asBackup = async (fn) => {
  await run('reset role; set role scribe_backup');
  try { return await fn(); } finally { await run('reset role'); }
};
const denied = (sql) => asBackup(() => codeOf(() => sys(sql))).then((c) => c === '42501');
const reads = (sql) => asBackup(() => codeOf(() => sys(sql))).then((c) => c === 'ok');

// What the dump needs.
for (const t of ['public.entries', 'public.policy_acceptances', 'public.deletion_requests', 'public.purge_ledger', 'ops.apple_tokens', 'auth.users', 'auth.identities']) {
  check(`reads ${t}`, await reads(`select count(*) from ${t}`));
}
const unreadable = await asBackup(async () => (await sys(`
  select c.oid::regclass::text t from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname in ('public', 'ops', 'insights', 'sync_private') and c.relkind in ('r', 'p', 'm', 'S')
     and not has_table_privilege(c.oid, 'select') order by 1`)).rows.map((r) => r.t));
check('reads every table and sequence in public, ops, insights and sync_private', unreadable.length === 0);
if (unreadable.length) console.log('  not readable:', unreadable.join(', '));

// What would sign a person in, or open a secret.
for (const t of ['auth.refresh_tokens', 'auth.one_time_tokens', 'auth.sessions', 'auth.mfa_factors', 'auth.flow_state',
                 'auth.audit_log_entries', 'auth.users_extra_probe', 'vault.secrets', 'vault.decrypted_secrets']) {
  check(`cannot select ${t}`, await denied(`select * from ${t}`));
}
const privs = await asBackup(async () => (await sys(`select
  has_schema_privilege('scribe_backup', 'vault', 'usage') as vault_use,
  pg_has_role('scribe_backup', 'pg_read_all_data', 'member') as read_all,
  pg_has_role('scribe_backup', 'pg_write_all_data', 'member') as write_all,
  (select count(*) from pg_auth_members where member = 'scribe_backup'::regrole) as memberships`)).rows[0]);
check('no usage on vault, no blanket read or write role, no role memberships', !privs.vault_use && !privs.read_all && !privs.write_all && Number(privs.memberships) === 0);

// Cannot write or create.
check('cannot insert into public.entries', await denied(`insert into public.entries default values`));
check('cannot update auth.users', await denied(`update auth.users set id = id`));
check('cannot create a table in public', await denied(`create table public.bk_probe (x int)`));
check('cannot truncate', await denied(`truncate public.entries`));

// Later migrations: a new public table is readable (default privileges), a new Auth table is not.
await run(`create table public.bk_later_table (x int); create table auth.bk_later_auth_table (x int)`);
check('a table a later migration adds to public is readable the next night', await reads('select count(*) from public.bk_later_table'));
check('a new Auth table stays unreadable', await denied('select count(*) from auth.bk_later_auth_table'));

// The one thing a grant cannot hide: the consent pepper is a database-level setting (APPLY.md step 6).
// Here it is the harness's session setting; on PostgreSQL 16 a database-level setting reached a role with no
// grants at all (rehearsed 8 Nov 2026). This line records the known limit so a later fix has to change it.
const pepper = await asBackup(async () => (await sys(`select char_length(current_setting('app.consent_pepper', true)) as n`)).rows[0].n);
check('KNOWN LIMIT: the consent pepper is readable by the role (stated in backup-role.sql header)', Number(pepper) >= 32);

done();
