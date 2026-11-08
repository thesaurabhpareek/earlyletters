-- BL-566 (D-138 item 2): the login role the free nightly staging backup uses.
-- Runbook: docs/ops/runbooks/staging-backup-free.md (founder steps 3 and 4).
--
-- Who runs it: the founder, once, in the Supabase dashboard of `scribe-staging`,
-- SQL Editor, as `postgres`. Agents never run it (COORDINATION section 6).
-- Run one numbered block at a time and compare each answer with the comment
-- under it. Stop at the first answer that differs and ask `ops`.
--
-- What the role can do: log in (after you give it a password, step 4), read
-- every table, and nothing else. It cannot insert, update, delete, truncate,
-- create objects, create roles or replicate. Every session it opens starts
-- read only.
--
-- Why it bypasses row-level security (BYPASSRLS), and why that is needed:
-- pg_dump turns row security off for its session and stops with an error on
-- the first table with RLS that the role does not bypass. The only other
-- choice, `pg_dump --enable-row-security`, dumps just the rows the policies
-- let this role see; the policies key on auth.uid() and a backup role is in
-- no family, so that is zero letters: a backup that looks fine and holds
-- nothing. Reading everything is what a full backup is, so the role gets
-- BYPASSRLS and nothing that writes. `postgres` itself has BYPASSRLS on
-- Supabase (supabase/APPLY.md section b expects `postgres | false | true`);
-- since Postgres 16 only a role with BYPASSRLS may give it, so block 1 works
-- only if that answer holds.
--
-- No password is in this file. You set it in step 4, and it goes only into
-- the private repository's BACKUP_DB_URL secret.

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
comment on role scribe_backup is 'BL-566 nightly staging backup (pg_dump). Read only. Password only in the private backup repository.';

-- 2A. Read access, preferred: the predefined role pg_read_all_data (SELECT on
--     every table, view and sequence, and USAGE on every schema, now and for
--     tables added later). It does not bypass RLS; BYPASSRLS above does that.
grant pg_read_all_data to scribe_backup;
-- If this answers "permission denied to grant role" (or anything else), do
-- not retry it a different way: run 2B instead and tell `ops` it was refused.

-- 2B. FALLBACK, only if 2A failed: read access schema by schema, for every
--     schema postgres may grant on. It prints one NOTICE per schema: copy the
--     "NOT granted" lines into the BL-566 PR. Each of those schemas goes into
--     the private repository's DUMP_EXCLUDE_SCHEMAS variable (runbook step 4).
--     Unlike 2A, this covers tables that exist now only. A table added by a
--     later migration makes the nightly job fail with "permission denied for
--     table ..." (a red run, no artifact, never a silent gap); run this block
--     again after that migration.
-- do $$
-- declare s text;
-- begin
--   for s in
--     select nspname from pg_namespace
--      where nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
--        and nspname not like 'pg\_temp\_%' and nspname not like 'pg\_toast\_temp\_%'
--      order by 1
--   loop
--     begin
--       execute format('grant usage on schema %I to scribe_backup', s);
--       execute format('grant select on all tables in schema %I to scribe_backup', s);
--       execute format('grant select on all sequences in schema %I to scribe_backup', s);
--       raise notice 'granted: %', s;
--     exception when insufficient_privilege then
--       raise notice 'NOT granted (add to DUMP_EXCLUDE_SCHEMAS): %', s;
--     end;
--   end loop;
-- end $$;
-- A table postgres has no grant option on gives a WARNING "no privileges were
-- granted for ..." instead of an error; note those too.

-- 3. Check, before it can log in. Expect each comment exactly.
select rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolreplication, rolcanlogin, rolconnlimit
  from pg_roles where rolname = 'scribe_backup';
-- false | true | false | false | false | false | 2
select r.rolname from pg_auth_members m join pg_roles r on r.oid = m.roleid
 where m.member = 'scribe_backup'::regrole order by 1;
-- 2A: one row, pg_read_all_data. 2B: no rows. Never postgres, service_role,
-- authenticated, supabase_admin or pg_write_all_data.
select has_table_privilege('scribe_backup', 'public.entries', 'select') as reads,
       has_table_privilege('scribe_backup', 'public.entries', 'insert, update, delete, truncate, references, trigger') as writes,
       has_schema_privilege('scribe_backup', 'public', 'create') as creates;
-- true | false | false
select count(*) as write_grants from information_schema.role_table_grants
 where grantee = 'scribe_backup' and privilege_type <> 'SELECT';
-- 0
select setconfig from pg_db_role_setting where setrole = 'scribe_backup'::regrole;
-- {default_transaction_read_only=on}

-- 4. The password, then login. Prefer psql on your Mac, which hashes the
--    password before it leaves the machine, so it never sits in a query:
--      psql "<staging session pooler URL as postgres>" -c '\password scribe_backup'
--    then, here or in that psql:
--      alter role scribe_backup login;
--    If you must use the SQL Editor alone: generate one with
--    `openssl rand -hex 32` on the Mac, run
--      alter role scribe_backup with login password '<paste>';
--    and do not save that query as a snippet. Hex needs no percent-encoding
--    in the connection string.
--    The connection string for the secret (session pooler, port 5432; the
--    user is the role name, a dot, and the project ref):
--      postgresql://scribe_backup.<project-ref>:<password>@<pooler host from Connect > Session pooler>:5432/postgres?sslmode=require

-- To take it all back (the nightly job then fails red the next night):
--   alter role scribe_backup nologin;   -- stops it at once
--   drop owned by scribe_backup;        -- removes every grant from 2A or 2B (it owns nothing)
--   drop role scribe_backup;
