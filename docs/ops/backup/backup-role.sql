-- BL-566 (D-138 item 2): the login role the free nightly backup uses.
-- Runbook: docs/ops/runbooks/staging-backup-free.md (founder steps 3 and 4).
--
-- Who runs it: the founder, once per project, in the Supabase dashboard,
-- SQL Editor, as `postgres`. Agents never run it (COORDINATION section 6).
-- Run one numbered block at a time and compare each answer with the comment
-- under it. Stop at the first answer that differs and ask `ops`.
--
-- What the role can do: log in (after you give it a password, step 4), read
-- the tables the backup needs, and nothing else. It cannot insert, update,
-- delete, truncate, create objects, create roles or replicate. Every session
-- it opens starts read only.
--
-- What it can read, and what it cannot (this is the point of the file):
--   CAN read   every table and sequence in the schemas public, ops, insights
--              and sync_private (letters, families, consent records, the
--              deletion ledger, Apple refresh tokens that are already
--              encrypted under a key the database never holds), and the two
--              Auth tables auth.users and auth.identities (the accounts).
--   CANNOT read (block 3 checks each on the live project)
--              auth.sessions, auth.refresh_tokens, auth.one_time_tokens,
--              auth.flow_state, auth.mfa_factors, auth.mfa_challenges,
--              auth.mfa_amr_claims, auth.saml_relay_states, auth.audit_log_entries
--              and every other Auth table, nor anything in the vault, cron,
--              net, storage or extensions schemas. No blanket role such as
--              pg_read_all_data is granted: that role reads every table in
--              every schema, which would make this URL as good as a sign-in
--              for every user (live refresh tokens and sessions).
--   CAN STILL read, by Postgres design, two things no grant can hide:
--              (a) the consent pepper, because supabase/APPLY.md step 6 stores
--              it as a database-level setting (`alter database ... set
--              app.consent_pepper`), which every role that connects to the
--              database can read with `show app.consent_pepper`. Rehearsed
--              on PostgreSQL 16 on 8 Nov 2026: a role with no grants at all
--              read it. APPLY.md already calls it "acceptable for a
--              pseudonymisation pepper but not for a key". With the pepper,
--              someone holding the URL can recompute the hash that
--              pseudonymises a consent record for a person id they already
--              know. (b) auth.users itself holds one-time-token hash columns
--              (confirmation_token, recovery_token, email_change_token_new,
--              reauthentication_token) and a password hash column. UNVERIFIED
--              (8 Nov 2026): whether hosted Supabase still fills these
--              columns, and how it hashes a one-time code. A reviewer notes
--              that GoTrue hashes a code as SHA-224 of the email plus the
--              code, and the code is 6 digits by default, so an UNEXPIRED
--              hash could be brute-forced offline. Do not rely on them being
--              "short-lived and hashed". Until the token-column check in block 3
--              is done, assume this URL could be used to sign in as a
--              user whose code is still unexpired.
--              Treat the backup URL as sensitive as the database itself:
--              every family's letters, the pepper, and possibly sign-in codes.
--
-- Why it bypasses row-level security (BYPASSRLS), and why that is needed:
-- pg_dump turns row security off for its session and stops with an error on
-- the first table with RLS that the role does not bypass. The only other
-- choice, `pg_dump --enable-row-security`, dumps just the rows the policies
-- let this role see; the policies key on auth.uid() and a backup role is in
-- no family, so that is zero letters: a backup that looks fine and holds
-- nothing. Reading all family data is what a full backup is, so the role gets
-- BYPASSRLS and no write grants. `postgres` itself has BYPASSRLS on
-- Supabase (supabase/APPLY.md section b expects `postgres | false | true`);
-- since Postgres 16 only a role with BYPASSRLS may give it, so block 1 works
-- only if that answer holds.
--
-- Why grants per schema and not per table by name: new tables arrive with
-- every migration. Block 2 also sets default privileges (for objects that
-- `postgres`, the role migrations run as, creates later in those four
-- schemas) so the next night's backup is whole. If a future table must never
-- be in a backup, say so in the migration's review, and revoke it here.
-- The Auth tables are not covered by default privileges: a new Auth table is
-- not readable, and the workflow leaves its data out.
--
-- Proof, in the repository: supabase/tests/backup_role.test.mjs runs this file
-- on a copy of the schema and checks each line above. Proof, on the live
-- project: block 3 below, and the workflow's "Check the connection" step
-- every night.
--
-- No password is in this file. You set it in step 4, and it goes only into
-- the private repository's secret for the database URL.

-- 0. Who you are, and which Postgres this is. Expect: postgres | false | true | 17
select r.rolname, r.rolsuper, r.rolbypassrls, current_setting('server_version_num')::int / 10000 as major
  from pg_roles r where r.rolname = current_user;
-- If major is not 17, write it down: the backup workflow's PG_MAJOR must equal it.

-- 1. The role, without a password and unable to log in yet.
create role scribe_backup with
  nologin nosuperuser nocreatedb nocreaterole noreplication
  bypassrls inherit
  connection limit 2;
-- Every session starts read only, as a second lock behind the missing write grants.
alter role scribe_backup set default_transaction_read_only = on;
comment on role scribe_backup is 'BL-566 nightly backup (pg_dump). Read only, no blanket read role. Password only in the private backup repository.';

-- 2. Read access, table by table, schema by schema. Prints one NOTICE per
--    schema. If a NOTICE says "NOT granted", or a WARNING says "no privileges
--    were granted", copy it into the PR and ask `ops`: do not retry another way.
do $$
declare
  s text;
  t text;
begin
  foreach s in array array['public', 'ops', 'insights', 'sync_private'] loop
    continue when to_regnamespace(s) is null;
    execute format('grant usage on schema %I to scribe_backup', s);
    execute format('grant select on all tables in schema %I to scribe_backup', s);
    execute format('grant select on all sequences in schema %I to scribe_backup', s);
    execute format('alter default privileges for role postgres in schema %I grant select on tables to scribe_backup', s);
    execute format('alter default privileges for role postgres in schema %I grant select on sequences to scribe_backup', s);
    raise notice 'granted: %', s;
  end loop;
  -- Accounts only. Every other Auth table (sessions, refresh tokens, one-time
  -- tokens, flow state, MFA, SAML, audit log) stays unreadable on purpose.
  if to_regnamespace('auth') is not null then
    begin
      grant usage on schema auth to scribe_backup;
      foreach t in array array['users', 'identities'] loop
        continue when to_regclass('auth.' || t) is null;
        execute format('grant select on auth.%I to scribe_backup', t);
      end loop;
      raise notice 'granted: auth.users and auth.identities';
    exception when insufficient_privilege then
      raise notice 'NOT granted: auth.users and auth.identities (the workflow then refuses to run; tell ops)';
    end;
  end if;
end $$;

-- 3. Check, before it can log in. Expect each comment exactly.
select rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolreplication, rolcanlogin, rolconnlimit
  from pg_roles where rolname = 'scribe_backup';
-- false | true | false | false | false | false | 2
select r.rolname from pg_auth_members m join pg_roles r on r.oid = m.roleid
 where m.member = 'scribe_backup'::regrole order by 1;
-- No rows. Never pg_read_all_data, pg_write_all_data, postgres, service_role,
-- authenticated or supabase_admin.
select has_table_privilege('scribe_backup', 'public.entries', 'select') as reads,
       has_table_privilege('scribe_backup', 'public.entries', 'insert, update, delete, truncate, references, trigger') as writes,
       has_schema_privilege('scribe_backup', 'public', 'create') as creates;
-- true | false | false
select count(*) as write_grants from information_schema.role_table_grants
 where grantee = 'scribe_backup' and privilege_type <> 'SELECT';
-- 0
-- The sign-in credentials and secrets the role must NOT read. Expect: false on every row
-- (a table that does not exist in your project shows null, which is fine).
select t as object,
       case when to_regclass(t) is null then null else has_table_privilege('scribe_backup', t, 'select') end as can_select
  from unnest(array['auth.sessions', 'auth.refresh_tokens', 'auth.one_time_tokens', 'auth.flow_state',
                    'auth.mfa_factors', 'auth.mfa_challenges', 'auth.mfa_amr_claims', 'auth.saml_relay_states',
                    'auth.audit_log_entries', 'vault.secrets', 'vault.decrypted_secrets', 'cron.job',
                    'net._http_response', 'storage.objects']) as t order by 1;
select s as schema, has_schema_privilege('scribe_backup', s, 'usage') as can_use
  from unnest(array['vault', 'cron', 'net', 'storage', 'extensions']) as s where to_regnamespace(s) is not null order by 1;
-- false on every row. If any row says true, stop and tell `ops`; do not give the role a password.
-- The two Auth tables it does read (accounts): expect true | true (or true | null).
select has_table_privilege('scribe_backup', 'auth.users', 'select') as users,
       case when to_regclass('auth.identities') is null then null else has_table_privilege('scribe_backup', 'auth.identities', 'select') end as identities;
-- One-time founder check, as `postgres` (not as scribe_backup): how many token columns hold a value right now.
-- It reads names and counts only, never a value, and works whatever columns this Auth version has.
-- Expect: no rows on a quiet project; any row means unexpired codes sit in auth.users, so keep the URL
-- exactly as protected as the database. Write the answer (counts only) in the PR; UNVERIFIED until it is run.
select e.key as token_column, count(*) as rows_with_a_value
  from auth.users u, lateral jsonb_each_text(to_jsonb(u)) e
 where e.key in ('confirmation_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current',
                 'reauthentication_token', 'phone_change_token')
   and coalesce(e.value, '') <> ''
 group by 1 order by 1;
select setconfig from pg_db_role_setting where setrole = 'scribe_backup'::regrole;
-- {default_transaction_read_only=on}

-- 4. The password, then login. Prefer psql on your Mac, which hashes the
--    password before it leaves the machine, so it never sits in a query or in
--    the SQL Editor's history:
--      psql "<session pooler URL as postgres>" -c '\password scribe_backup'
--    then, here or in that psql:
--      alter role scribe_backup login;
--    If you must use the SQL Editor alone: generate one with
--    `openssl rand -hex 32` on the Mac and run
--      alter role scribe_backup with login password '<paste>';
--    CAVEAT: the password is then in the clear in that query. Do not save it
--    as a snippet. The editor also keeps a history of queries you ran, and
--    the history is the dashboard's, not yours to clear (how long it keeps
--    them is unverified, 8 Nov 2026). So treat that password as seen: as
--    soon as the first backup is green, change it from psql with `\password`
--    (the new one never touches the editor), put the new one in the secret,
--    and run the workflow again. Hex needs no percent-encoding in the
--    connection string.
--    The connection string for the secret (session pooler, port 5432; the
--    user is the role name, a dot, and the project ref):
--      postgresql://scribe_backup.<project-ref>:<password>@<pooler host from Connect > Session pooler>:5432/postgres?sslmode=require

-- To take it all back (the nightly job then fails red the next night):
--   alter role scribe_backup nologin;   -- stops it at once
--   drop owned by scribe_backup;        -- removes every grant and default privilege from block 2 (it owns nothing)
--   drop role scribe_backup;
