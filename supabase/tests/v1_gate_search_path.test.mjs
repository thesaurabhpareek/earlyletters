// Definer functions with search_path pinned (20261015000000 section 7; PR #51
// finding 1; security review L8). Two parts:
//   1. A sweep: every function in every schema the migrations create (public,
//      ops, insights) has a search_path that starts with pg_catalog and ends
//      with pg_temp, or is empty. Without pg_temp named last, Postgres searches
//      the session's temp schema first.
//   2. The shadowing regression, in one session: a stranger's temp tables named
//      like ours change nothing. A throwaway function without pg_temp shows the
//      probe is real (it does see the shadow), so the safe answers are not vacuous.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { db, check, as, sys, codeOf, publishPolicies, consent, newChild, join, done } = h;
const { A, B, C } = users;
await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}')`);
await publishPolicies();
for (const u of [A, B, C]) await consent(u);

// ── 1. The sweep ─────────────────────────────────────────────────────────
const fns = (await sys(`
  select n.nspname as schema, p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as sig,
         p.prosecdef as secdef,
         (select substr(c, 13) from unnest(coalesce(p.proconfig, '{}'::text[])) c where c like 'search_path=%' limit 1) as sp
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast', 'auth', 'storage', 'vault', 'extensions')
     and n.nspname not like 'pg_temp%' and n.nspname not like 'pg_toast_temp%'
     and p.prokind = 'f'
     and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')`)).rows;
const ok = (sp) => sp === '' || sp === '""' || (sp != null && /^pg_catalog(, [a-z_]+)*, pg_temp$/.test(sp));
const bad = fns.filter((f) => !ok(f.sp));
for (const f of bad) console.log(`      search_path not pg_catalog first and pg_temp last: ${f.schema}.${f.sig} (${f.sp ?? 'not set'})`);
check(`every function in public, ops, insights and sync_private pins pg_catalog first and pg_temp last (${fns.length} functions)`, fns.length > 100 && bad.length === 0);
const schemas = new Set(fns.map((f) => f.schema));
check('the sweep covers public, ops, insights and sync_private (20261016000000)', ['public', 'ops', 'insights', 'sync_private'].every((s) => schemas.has(s)));
check('the sweep covers every security definer function (none outside it)',
  (await sys(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where p.prosecdef and n.nspname in ('public', 'ops', 'insights', 'sync_private')`)).rows[0].n === fns.filter((f) => f.secdef).length);

// Every function an RLS policy calls is in the swept set and pinned.
const policyFns = (await sys(`
  select distinct (regexp_matches(coalesce(qual, '') || ' ' || coalesce(with_check, ''), '([a-z_][a-z0-9_]*)\\(', 'g'))[1] as fn
    from pg_policies`)).rows.map((r) => r.fn).filter((fn) => fns.some((f) => f.sig.startsWith(`${fn}(`)));
const unpinned = policyFns.filter((fn) => !fns.some((f) => f.sig.startsWith(`${fn}(`) && ok(f.sp)));
check(`every function an RLS policy calls is pinned (${policyFns.join(', ')})`,
  policyFns.includes('is_child_member') && policyFns.includes('is_child_parent') && unpinned.length === 0);
check('the RLS helpers and the new RPCs are named in the sweep',
  ['is_child_member(p_child uuid)', 'is_child_parent(p_child uuid)', 'peek_invite(p_token text)', 'undo_parent_join(p_child uuid, p_member uuid)',
   'leave_child(p_child uuid, p_keep_in_book boolean)', 'sync_pull(p_since jsonb, p_limit integer)']
    .every((s) => fns.some((f) => f.schema === 'public' && f.sig === s && ok(f.sp))));

// ── 2. The shadowing regression (one PGlite session) ─────────────────────
const CHILD = await newChild(A, 'Asha', '2025-04-12');
await join(B, 'parent', CHILD, A);
// The negative control: a definer function with the old, shadowable path.
await sys(`create function public.zz_probe_shadowable() returns int language sql security definer
             set search_path = public, pg_catalog as $$ select count(*)::int from child_members where profile_id = auth.uid() $$`);
await sys(`grant execute on function public.zz_probe_shadowable() to authenticated`);
const tempOk = await codeOf(() => as(C, `create temp table child_members (child_id uuid, profile_id uuid, role text, joined_at timestamptz default now(),
  auto_add_letters boolean default false)`));
check('(the stranger can make a temp table in this harness, so the attack is possible here)', tempOk === 'ok');
await as(C, `insert into pg_temp.child_members (child_id, profile_id, role) values ($1, $2, 'parent')`, [CHILD, C]);
check('(negative control: a function without pg_temp last sees the stranger\'s shadow table)',
  (await as(C, `select public.zz_probe_shadowable() n`)).rows[0].n === 1);
check('the stranger still reads no children row', (await as(C, `select id from public.children where id = $1`, [CHILD])).rows.length === 0);
check('is_child_member and is_child_parent still answer false',
  (await as(C, `select public.is_child_member($1) m, public.is_child_parent($1) p`, [CHILD])).rows[0].m === false
  && (await as(C, `select public.is_child_parent($1) p`, [CHILD])).rows[0].p === false);
check('the stranger reads nothing from book_entries', (await as(C, `select 1 from public.book_entries where child_id = $1`, [CHILD])).rows.length === 0);
check('the stranger cannot delete the book (refused, the book stays live)',
  (await codeOf(() => as(C, `select public.request_book_deletion($1, 'ios')`, [CHILD]))) !== 'ok'
  && (await sys(`select deleted_at is null live from children where id = $1`, [CHILD])).rows[0].live);
check('the stranger cannot peek at, leave or undo anything in the book',
  (await as(C, `select public.leave_child($1) r`, [CHILD])).rows[0].r === 'not_member'
  && (await codeOf(() => as(C, `select public.undo_parent_join($1, $2)`, [CHILD, B]))) === 'SCPAR');
check('sync_pull lists no book for the stranger', (await as(C, `select public.sync_pull('{}'::jsonb, 10) r`)).rows[0].r.books.length === 0);
check('the stranger cannot write a letter into the book',
  (await codeOf(() => as(C, `insert into public.entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version,
     raw_transcript, final_text) values ('0192f000-0000-7000-8000-00000000c0de', $1, $2, 'letter', '2026-01-01', now(), 'typed', 1, 'x', 'x')`, [CHILD, C]))) !== 'ok');
await as(C, `drop table pg_temp.child_members`);
await sys(`drop function public.zz_probe_shadowable()`);

done();
