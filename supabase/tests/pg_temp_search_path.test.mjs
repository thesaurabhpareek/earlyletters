// pg_temp named last (PR #51 finding 1, re-checked on develop 28 Oct 2026) and a purged letter's photo stays
// purged (PR #51 finding 2; 20261028000000). Fictional family "Asha" only (CLAUDE.md).
//   1. Reads pg_proc.proconfig: every SECURITY DEFINER function, and every function an RLS policy calls
//      (found from pg_depend on pg_policy, not by name), in every schema the migrations create, has
//      search_path with pg_catalog first and pg_temp last, or empty. The same check runs on role defaults.
//   2. The shadowing probe itself lives in v1_gate_search_path.test.mjs (a temp table shadows child_members).
//   3. After Erase now, the photo cannot be put back under the erased letter's path.
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { db, check, as, sys, codeOf, done, publishPolicies, consent, newChild, join } = h;
const { A, B, C } = users;
await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}')`);
await publishPolicies();
for (const u of [A, B, C]) await consent(u);
const CHILD = await newChild(A, 'Asha', '2025-04-12');
await join(B, 'parent', CHILD, A);

// ── 1. proconfig sweep ───────────────────────────────────────────────────
// Every schema except the system ones and those owned by Supabase extensions/services.
const SQL_SCHEMAS = `(select nspname::text from pg_namespace where nspname not in ('pg_catalog', 'information_schema', 'pg_toast', 'auth', 'storage', 'vault', 'extensions') and nspname not like 'pg_temp%' and nspname not like 'pg_toast_temp%')`;
const pinned = (cfgs) => {
  const sp = (cfgs ?? []).find((c) => c.startsWith('search_path='));
  if (!sp) return false;
  const v = sp.slice('search_path='.length);
  return v === '' || v === '""' || /^pg_catalog(, [a-z_]+)*, pg_temp$/.test(v);
};
const definers = (await sys(`
  select n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as sig, p.proconfig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where p.prosecdef and n.nspname::text in ${SQL_SCHEMAS}`)).rows;
const badDefiners = definers.filter((f) => !pinned(f.proconfig));
for (const f of badDefiners) console.log(`      definer without pg_temp last: ${f.sig} ${JSON.stringify(f.proconfig)}`);
check(`every security definer function pins search_path with pg_catalog first and pg_temp last (${definers.length} functions)`,
  definers.length > 100 && badDefiners.length === 0);

// RLS helpers: functions referenced by any policy expression (pg_depend from pg_policy), definer or not.
const helpers = (await sys(`
  select distinct n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as sig, p.proconfig, p.prosecdef
    from pg_policy pol join pg_depend d on d.classid = 'pg_policy'::regclass and d.objid = pol.oid and d.refclassid = 'pg_proc'::regclass
    join pg_proc p on p.oid = d.refobjid join pg_namespace n on n.oid = p.pronamespace
   where n.nspname::text in ${SQL_SCHEMAS}`)).rows;
const badHelpers = helpers.filter((f) => !pinned(f.proconfig));
for (const f of badHelpers) console.log(`      RLS helper without pg_temp last: ${f.sig} ${JSON.stringify(f.proconfig)}`);
check(`every function an RLS policy calls pins search_path with pg_temp last (${helpers.length} functions)`, helpers.length > 5 && badHelpers.length === 0);
check('the RLS helper set includes is_child_member, is_child_parent, child_is_live, can_read_entry_photo and photo_entry_is_purged',
  ['is_child_member', 'is_child_parent', 'child_is_live', 'can_read_entry_photo', 'photo_entry_is_purged']
    .every((n) => helpers.some((f) => f.sig.startsWith(`public.${n}(`))));

// Role defaults (alter role ... set search_path) follow the same rule.
const roleSettings = (await sys(`
  select r.rolname, s.setconfig from pg_db_role_setting s join pg_roles r on r.oid = s.setrole
   where exists (select 1 from unnest(s.setconfig) c where c like 'search_path=%')`)).rows;
const badRoles = roleSettings.filter((r) => !pinned(r.setconfig));
for (const r of badRoles) console.log(`      role default without pg_temp last: ${r.rolname} ${JSON.stringify(r.setconfig)}`);
check(`every role-level search_path ends with pg_temp (${roleSettings.map((r) => r.rolname).join(', ') || 'none'})`,
  roleSettings.some((r) => r.rolname === 'escrow_svc') && badRoles.length === 0);

// Negative control: the checker really fails on a definer without pg_temp.
await sys(`create function public.zz_probe_unpinned() returns int language sql security definer set search_path = public, pg_catalog as $$ select 1 $$`);
check('(negative control: a definer function with search_path = public, pg_catalog is flagged)',
  !pinned((await sys(`select proconfig from pg_proc where proname = 'zz_probe_unpinned'`)).rows[0].proconfig));
await sys(`drop function public.zz_probe_unpinned()`);

// ── 2. and 3. Purged photos ──────────────────────────────────────────────
let n = 0;
const id7 = () => uuid7(Date.now() - 5000 + ++n);
const NOW = new Date().toISOString();
const push = async (uid, ops) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await as(uid, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).rows[0].r;
};
const op = (type, id, data = {}) => ({ op: id7(), type, id, data });
const letter = (id) => ({
  id, child_id: CHILD, kind: 'letter', occurred_on: '2026-10-01', captured_at: NOW, capture_mode: 'spoken',
  edit_level: 'clean', prompt_key: null, engine_version: 5, raw_transcript: 'um you laughed', machine_edits: [],
  final_text: 'You laughed.', in_book: true, sounds_like_me: null, author_signs_as: 'Mama', audio_kept_on_device: true,
});
const upload = (uid, name) => as(uid, `insert into storage.objects (bucket_id, name) values ('entry-photos', $1)`, [name]);
const purgedFn = async (uid, name) => (await as(uid, `select public.photo_entry_is_purged($1) v`, [name])).rows[0].v;

const L1 = id7(); // erased below
const L2 = id7(); // never erased
const p1 = `${CHILD}/${A}/${L1}.jpg`;
const p2 = `${CHILD}/${A}/${L2}.jpg`;
await push(A, [op('entry.upsert', L1, letter(L1)), op('entry.upsert', L2, letter(L2))]);

check('before any erasure the photo of a letter uploads', (await codeOf(() => upload(A, p1))) === 'ok');
await as(A, `update entries set photo_path = $1 where id = $2`, [p1, L1]);
check('before any erasure the helper says false', (await purgedFn(A, p1)) === false);

await push(A, [op('entry.delete', L1)]);
const er = (await push(A, [op('entry.erase', L1)])).results[0];
check('Erase now erases the letter, queues its photo and records its id',
  er.ok && er.erased === true
  && (await sys(`select 1 from storage_purge_queue where bucket_id = 'entry-photos' and object_path = $1`, [p1])).rows.length === 1
  && (await sys(`select 1 from purge_ledger where entity_type = 'entry' and entity_id = $1`, [L1])).rows.length === 1);
// The purge worker removes the object (the service deletes it from Storage; here the row stands in for it).
await sys(`delete from storage.objects where bucket_id = 'entry-photos' and name = $1`, [p1]);

check('the helper says true for the erased letter\'s path (every extension)',
  (await purgedFn(A, p1)) === true && (await purgedFn(A, `${CHILD}/${A}/${L1}.png`)) === true);
check('the author cannot put the erased letter\'s photo back (42501)', (await codeOf(() => upload(A, p1))) === '42501');
check('nor under another extension (42501)', (await codeOf(() => upload(A, `${CHILD}/${A}/${L1}.heic`))) === '42501');
check('a letter that was never erased still takes its photo', (await codeOf(() => upload(A, p2))) === 'ok');
check('a path without a uuid file name answers false, with no cast error',
  (await purgedFn(A, `${CHILD}/${A}/cover.jpg`)) === false && (await purgedFn(A, 'x')) === false && (await purgedFn(A, '')) === false);
check('the other parent still cannot upload into the author\'s folder (42501)', (await codeOf(() => upload(B, `${CHILD}/${A}/${id7()}.jpg`))) === '42501');
check('a stranger cannot upload into the book (42501)', (await codeOf(() => upload(C, `${CHILD}/${C}/${id7()}.jpg`))) === '42501');

// Rename, odd file names, nesting (red team on #311). Storage upsert and move go through UPDATE.
const tmp = `${CHILD}/${A}/${id7()}.jpg`;
await upload(A, tmp);
const rename = (uid, from, to) => as(uid, `update storage.objects set name = $2 where bucket_id = 'entry-photos' and name = $1`, [from, to]);
check('renaming an object onto an erased letter\'s path is refused (42501)', (await codeOf(() => rename(A, tmp, p1))) === '42501');
check('renaming onto a nested path is refused (42501)', (await codeOf(() => rename(A, tmp, `${CHILD}/${A}/sub/${id7()}.jpg`))) === '42501');
const L3 = id7();
check('renaming onto a fresh letter path works', (await codeOf(() => rename(A, tmp, `${CHILD}/${A}/${L3}.jpg`))) === 'ok');
for (const [label, name] of [
  ['an extra extension', `${CHILD}/${A}/${L1}.x.jpg`],
  ['no extension', `${CHILD}/${A}/${L1}`],
  ['a suffix', `${CHILD}/${A}/${L1}-1.jpg`],
  ['a nested folder', `${CHILD}/${A}/sub/${L1}.jpg`],
  ['an upper-case id', `${CHILD}/${A}/${L1.toUpperCase()}.jpg`],
]) {
  check(`uploading under the erased id with ${label} is refused (42501)`, (await codeOf(() => upload(A, name))) === '42501');
  const t = `${CHILD}/${A}/${id7()}.jpg`;
  await upload(A, t);
  check(`renaming onto the erased id with ${label} is refused (42501)`, (await codeOf(() => rename(A, t, name))) === '42501');
}
check('a nested path for a never-erased id is refused too (42501)', (await codeOf(() => upload(A, `${CHILD}/${A}/sub/${id7()}.jpg`))) === '42501');
check('the policy texts carry the purged check',
  (await sys(`select count(*)::int n from pg_policy where polname in ('entry_photos_author_insert', 'entry_photos_author_update')
               and pg_get_expr(polwithcheck, polrelid) like '%photo_entry_is_purged%'`)).rows[0].n === 2);

// The helper does not tell anyone else whether a letter was erased.
check('the other parent and a stranger get false for the author\'s erased path; the author gets true',
  (await purgedFn(B, p1)) === false && (await purgedFn(C, p1)) === false && (await purgedFn(A, p1)) === true);

done();
