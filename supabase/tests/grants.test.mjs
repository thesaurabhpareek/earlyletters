// Grants sweep against Supabase-faithful default privileges (PDB-01, DB-01, PDB-02).
// harness.mjs mirrors what Supabase grants to anon/authenticated on every new
// table, view, function and sequence in `public`; these checks read the catalog
// after all migrations and fail when a migration forgot the matching revoke.
//
// Checks marked EXPECTS WS-01 (fix/db-pending-hardening) only pass once WS-01's
// pending-migration fixes land. They run and print what they find, but do not
// fail the suite until enabled: set EXPECT_WS01=1 to enforce them now, and
// remove them from PENDING_WS01 when WS-01 merges.
import { createDb } from './harness.mjs';

const { db, check, sys, done } = await createDb(process.argv.slice(2));

const PENDING_WS01 = new Set(); // WS-01 merged into this branch (stacked on #32): all checks enforced.
const enforce = process.env.EXPECT_WS01 === '1';
const pending = (key, name, ok) => {
  if (enforce || !PENDING_WS01.has(key)) return check(name, ok);
  console.log(`TODO  ${name}  [EXPECTS WS-01 (fix/db-pending-hardening); currently ${ok ? 'passing, enable it' : 'failing'}]`);
};

// 1. The harness really mirrors Supabase defaults. Create throwaway objects as
//    the migration owner and confirm both API roles receive the default grants.
await db.exec(`begin;
           create function public.__harness_probe() returns int language sql as $$ select 1 $$;
           create sequence public.__harness_probe_seq;
           create table public.__harness_probe_t (id int);
           create view public.__harness_probe_v as select 1 as x;`);
const probe = (await sys(`
  select has_function_privilege('anon', 'public.__harness_probe()', 'execute') as fn_anon,
         has_function_privilege('authenticated', 'public.__harness_probe()', 'execute') as fn_auth,
         has_sequence_privilege('anon', 'public.__harness_probe_seq', 'usage') as seq_anon,
         has_sequence_privilege('authenticated', 'public.__harness_probe_seq', 'usage') as seq_auth,
         has_table_privilege('authenticated', 'public.__harness_probe_t', 'insert') as tbl_auth,
         has_table_privilege('authenticated', 'public.__harness_probe_v', 'update') as view_auth`)).rows[0];
await db.exec('rollback');
check('harness grants EXECUTE on new public functions to anon and authenticated', probe.fn_anon && probe.fn_auth);
check('harness grants USAGE on new public sequences to anon and authenticated', probe.seq_anon && probe.seq_auth);
check('harness grants table and view writes to authenticated by default', probe.tbl_auth && probe.view_auth);

// 2. No public function is executable by anon. Every RPC requires a signed-in
//    session; a new function without `revoke ... from public, anon` shows up here.
const anonFns = (await sys(`
  select p.oid::regprocedure::text as fn
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')
   order by 1`)).rows;
for (const r of anonFns) console.log(`      anon can execute: ${r.fn}`);
check('anon-executable public functions are an empty set', anonFns.length === 0);

// 3. No public view (or materialized view) grants INSERT/UPDATE/DELETE/TRUNCATE
//    to anon or authenticated. Simple views are auto-updatable and bypass the
//    base table's RLS as the view owner (DB-01).
const viewWrites = (await sys(`
  select c.relname as rel, r.role, string_agg(x.priv, ',' order by x.priv) as privs
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   cross join (values ('anon'), ('authenticated')) r(role)
   cross join (values ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE')) x(priv)
   where n.nspname = 'public' and c.relkind in ('v', 'm')
     and has_table_privilege(r.role, c.oid, x.priv)
   group by 1, 2 order by 1, 2`)).rows;
for (const r of viewWrites) console.log(`      view writable: public.${r.rel} by ${r.role} (${r.privs})`);
pending('views', 'no public view grants INSERT/UPDATE/DELETE/TRUNCATE to anon or authenticated', viewWrites.length === 0);

// 4. No public sequence is usable by anon or authenticated (PDB-02). Rows that
//    need ids are inserted by definer functions or the service role.
const seqs = (await sys(`
  select c.oid::regclass::text as seq,
         has_sequence_privilege('anon', c.oid, 'usage') as anon_usage,
         has_sequence_privilege('authenticated', c.oid, 'usage') as auth_usage
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'S'
   order by 1`)).rows;
const usable = seqs.filter((s) => s.anon_usage || s.auth_usage);
for (const s of usable) console.log(`      sequence usable: ${s.seq} (anon ${s.anon_usage}, authenticated ${s.auth_usage})`);
pending('sequences', 'no public sequence grants USAGE to anon or authenticated', usable.length === 0);

done();
