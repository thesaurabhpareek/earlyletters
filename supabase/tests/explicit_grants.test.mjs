// Every table, view and sequence gets explicit grants (20261023060000_explicit_grants.sql; lens A on #261,
// comment 6378839652). A project created without Supabase's automatic grants (the harness default since
// this file) and one created with them (SCRIBE_DEFAULT_GRANTS=legacy) end with the same privileges, and the
// paths lens A found broken on a new project work: the deploy smoke's anonymous policy_versions read,
// consent, sync_push and sync_pull, letters and family reads. Also the guards: a second run, and a run
// before 20261023050000 (55000, nothing changed). The access matrix holds the full grant list.
// Fictional family "Asha" only (CLAUDE.md).
import { readFileSync } from 'node:fs';
import { createDb, users, uuid7 } from './harness.mjs';
import { grantRows, SERVICE_ROLE_FUNCTIONS } from './grants.mjs';

const all = process.argv.slice(2);
const name = (f) => f.split('/').pop();
const mine = all.find((f) => name(f).startsWith('20261023060000'));
if (!mine) throw new Error('20261023060000_explicit_grants.sql is not in the migration list');
const sql = readFileSync(mine, 'utf8');
const h = await createDb(all);
const { check, as, asAnon, sys, one, codeOf, done, publishPolicies, consent, newChild, join, defaults } = h;
const { A, B, C } = users;

// Every privilege the three API roles (and PUBLIC) hold on public tables, views, columns and sequences, and
// the defaults the migration role leaves for later objects in public.
const snapshot = async (x) => {
  const q = async (s) => (await x(s)).rows.map((r) => r.v);
  return {
    tables: await q(`select r || ' ' || c.relname || ' ' || p v from pg_class c
      cross join unnest(array['public', 'anon', 'authenticated', 'service_role']) r
      cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']) p
      where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p', 'v', 'm')
        and (case when r = 'public' then exists (select 1 from aclexplode(coalesce(c.relacl, '{}')) a where a.grantee = 0 and a.privilege_type = p)
             else has_table_privilege(r, c.oid, p) end) order by 1`),
    columns: await q(`select r || ' ' || c.relname || '.' || a.attname v from pg_class c
      join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
      cross join unnest(array['anon', 'authenticated', 'service_role']) r
      where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p') and has_column_privilege(r, c.oid, a.attnum, 'SELECT')
        and not has_table_privilege(r, c.oid, 'SELECT') order by 1`),
    sequences: await q(`select r || ' ' || c.relname || ' ' || p v from pg_class c
      cross join unnest(array['public', 'anon', 'authenticated', 'service_role']) r cross join unnest(array['USAGE', 'SELECT', 'UPDATE']) p
      where c.relnamespace = 'public'::regnamespace and c.relkind = 'S'
        and (case when r = 'public' then exists (select 1 from aclexplode(coalesce(c.relacl, '{}')) a where a.grantee = 0 and a.privilege_type = p)
             else has_sequence_privilege(r, c.oid, p) end) order by 1`),
    functions: await q(`select r || ' ' || p.oid::regprocedure::text v from pg_proc p
      cross join unnest(array['anon', 'authenticated', 'service_role']) r
      where p.pronamespace = 'public'::regnamespace and has_function_privilege(r, p.oid, 'execute') order by 1`),
    defaults: await q(`select d.defaclobjtype::text || ' ' || a.grantee::regrole::text || ' ' || a.privilege_type v
      from pg_default_acl d cross join lateral aclexplode(d.defaclacl) a
      where d.defaclnamespace = 'public'::regnamespace and d.defaclrole = 'postgres'::regrole
        and a.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole) order by 1`),
  };
};

// ── Both worlds end the same ─────────────────────────────────────────────
const other = await createDb(all, { defaultGrants: defaults.mode === 'legacy' ? 'none' : 'legacy' });
const here = await snapshot(sys);
const there = await snapshot(other.sys);
for (const k of Object.keys(here)) {
  for (const v of here[k].filter((x) => !there[k].includes(x))) console.log(`      ${k}, only in the ${defaults.mode} world: ${v}`);
  for (const v of there[k].filter((x) => !here[k].includes(x))) console.log(`      ${k}, only in the ${other.defaults.mode} world: ${v}`);
}
check('a project made without the automatic grants and one made with them end with the same privileges on every public table, view, column, sequence and function',
  ['tables', 'columns', 'sequences', 'functions'].every((k) => JSON.stringify(here[k]) === JSON.stringify(there[k])));
// The exact table and view grants (grants.mjs; the migration header names the path behind each).
const PRIV = { SELECT: 'S', INSERT: 'I', UPDATE: 'U', DELETE: 'D' };
const byRel = new Map();
for (const v of here.tables) {
  const [role, rel, priv] = v.split(' ');
  const k = `${role} ${rel}`;
  byRel.set(k, (byRel.get(k) ?? '') + (PRIV[priv] ?? '?'));
}
const heldRows = [...byRel].map(([k, l]) => `${k} ${[...l].sort((a, b) => 'SIUD?'.indexOf(a) - 'SIUD?'.indexOf(b)).join('')}`).sort();
for (const v of heldRows.filter((x) => !grantRows().includes(x))) console.log(`      held, not in grants.mjs: ${v}`);
for (const v of grantRows().filter((x) => !heldRows.includes(x))) console.log(`      in grants.mjs, not held: ${v}`);
check('every public table and view grants exactly the rows in grants.mjs (nothing more, nothing less)', JSON.stringify(heldRows) === JSON.stringify(grantRows()));
check(`service_role executes exactly the ${SERVICE_ROLE_FUNCTIONS.length} functions an earlier file granted it, in both worlds`,
  JSON.stringify(here.functions.filter((v) => v.startsWith('service_role ')).map((v) => v.slice(13)).sort()) === JSON.stringify([...SERVICE_ROLE_FUNCTIONS].sort())
  || console.log(`      got ${here.functions.filter((v) => v.startsWith('service_role ')).length}`));
check('and with the same defaults: later tables, sequences and functions in public give anon, authenticated and service_role nothing',
  here.defaults.length === 0 && there.defaults.length === 0);
check('no role holds TRUNCATE, REFERENCES, TRIGGER or MAINTAIN on any public table or view (lens A F6)',
  !here.tables.some((v) => / (TRUNCATE|REFERENCES|TRIGGER|MAINTAIN)$/.test(v)));
check('PUBLIC holds nothing on any public table, view or sequence, and no API role anything on a sequence (lens B N7)',
  !here.tables.some((v) => v.startsWith('public ')) && here.sequences.length === 0);
await other.db.close();

// ── The guards ───────────────────────────────────────────────────────────
const early = await createDb(all.filter((f) => name(f) < '20261023050000'));
const earlySnap = await snapshot(early.sys);
check('a run before 20261023050000 is refused (55000) and changes nothing', (await codeOf(() => early.db.exec(sql))) === '55000'
  && JSON.stringify(await snapshot(early.sys)) === JSON.stringify(earlySnap));
await early.db.close();
check('a second run is refused (55000) and changes nothing', (await codeOf(() => h.db.exec(sql))) === '55000'
  && JSON.stringify(await snapshot(sys)) === JSON.stringify(here));

// ── The paths that broke on a new project work ───────────────────────────
await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}')`);
await publishPolicies();
check('the deploy smoke: anon reads the published policy versions (document, version, effective_at)',
  (await asAnon(`select document, version, effective_at from policy_versions`)).rows.length >= 4);
check('but nothing else (anon reading entries is refused)', (await codeOf(() => asAnon(`select 1 from entries`))) === '42501');
for (const u of [A, B, C]) await consent(u);
check('consent: a person records an act and reads their state (my_policy_state)',
  (await as(A, `select document from my_policy_state`)).rows.length >= 2
  && (await as(A, `select document, version from policy_versions where document = 'terms'`)).rows.length === 1);
const CHILD = await newChild(A);
await join(B, 'parent', CHILD, A);
let n = 0;
const id7 = () => uuid7(Date.now() - 5000 + ++n);
const push = async (uid, ops) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await one(uid, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).r;
};
const LETTER = id7();
const r = await push(A, [{ op: id7(), type: 'entry.upsert', id: LETTER, data: {
  id: LETTER, child_id: CHILD, kind: 'letter', occurred_on: '2026-10-20', captured_at: '2026-10-20T20:00:00Z', capture_mode: 'spoken',
  edit_level: 'clean', prompt_key: null, engine_version: 2, raw_transcript: 'um you laughed at the rain', machine_edits: [],
  final_text: 'You laughed at the rain.', in_book: true, sounds_like_me: null, author_signs_as: 'Mama', audio_kept_on_device: true } }]);
check('sync_push (runs as the caller) writes a letter', r.results?.[0]?.ok === true && r.results[0].applied === true
  || console.log(`      got ${JSON.stringify(r)}`));
await sys(`delete from sync_rate_windows where profile_id = $1`, [B]);
const pulled = (await one(B, `select public.sync_pull('{}'::jsonb, 50) r`)).r;
check('sync_pull serves it to the co-parent', JSON.stringify(pulled).includes(LETTER));
check('letters: the author reads it from entries; nobody reads book_entries directly (sync_pull serves it)',
  (await as(A, `select 1 from entries where id = $1`, [LETTER])).rows.length === 1
  && (await codeOf(() => as(B, `select 1 from book_entries where id = $1`, [LETTER]))) === '42501');
check('family: members read the book name, its members and their profiles; a stranger reads none of it',
  (await as(B, `select name from children where id = $1`, [CHILD])).rows.length === 1
  && (await as(B, `select 1 from child_members where child_id = $1`, [CHILD])).rows.length === 2
  && (await as(B, `select 1 from profiles`)).rows.length === 2
  && (await as(C, `select 1 from child_members where child_id = $1`, [CHILD])).rows.length === 0);

done();
