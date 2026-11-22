// BL-244 (API-R10, TDD 06 conflict C-2): a content table refuses a bad write without echoing the row.
// Postgres adds "Failing row contains (...)" to the DETAIL of a CHECK or NOT NULL violation, which on a letter is L4 text
// in the log and in the PostgREST body. The rule is checked here by structure, never by value: every message in this
// file names a table and a rule, and no row value or product word is printed or asserted.
//   VF-1 every public table with an L4 text or jsonb column and a value-bearing CHECK has a BEFORE INSERT OR UPDATE
//        validation trigger (the guard that raises first with a fixed message), or is on KNOWN_GAPS below.
//   VF-2 no function in public/ops raises with a column of NEW or OLD in its message, detail or hint.
//   VF-3 behaviour: an over-length write to a content table fails with an error whose message and detail carry no
//        value; a table that still echoes is on KNOWN_GAPS (a ratchet: fixing one forces its removal from the list).
// RAISE_OK names functions whose raise reads a public policy document key, never a person's words.
// KNOWN_GAPS is the work still owed (hosted apply is the founder's step); it may only shrink. It is empty: 20261121040000 added
// entries_validate_limits, held_drafts_validate_limits, children_validate_limits and dictionary_terms_validate_limits.
import { readFileSync } from 'node:fs';
import { createDb, users } from './harness.mjs';

const { db, check, sys, done, newChild, publishPolicies, consent } = await createDb(process.argv.slice(2));

const RAISE_OK = new Set(['public.policy_versions_guard']);
const KNOWN_GAPS = new Set([]);   // empty since 20261121040000 (BL-244); a new content table must ship its trigger

// Content tables by structure: an L4 text/jsonb column and at least one CHECK that reads a length or a size.
const content = (await sys(`
  select c.relname as rel,
         exists (select 1 from pg_trigger t join pg_proc p on p.oid = t.tgfoid
                  where t.tgrelid = c.oid and not t.tgisinternal
                    and (t.tgtype & 2) = 2 and (t.tgtype & 4) = 4 and (t.tgtype & 16) = 16 and (t.tgtype & 1) = 1
                    and p.proname like '%validate%') as guarded
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and exists (select 1 from pg_attribute a join pg_type ty on ty.oid = a.atttypid
                  where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
                    and ty.typname in ('text', 'varchar', 'jsonb')
                    and col_description(c.oid, a.attnum) like 'L4%')
     and exists (select 1 from pg_constraint k where k.conrelid = c.oid and k.contype = 'c'
                  and pg_get_constraintdef(k.oid) ~ '(char_length|octet_length|length)\\(')
   order by 1`)).rows;
check('VF-0 the structural scan finds content tables (entries among them)', content.some((r) => r.rel === 'entries'));

for (const r of content) {
  const ok = r.guarded || KNOWN_GAPS.has(r.rel);
  check(`VF-1 ${r.rel}: a value-free validation trigger runs before its length CHECKs${KNOWN_GAPS.has(r.rel) ? ' (known gap)' : ''}`, ok);
  if (r.guarded && KNOWN_GAPS.has(r.rel)) check(`VF-1 ${r.rel}: now guarded, remove it from KNOWN_GAPS`, false);
}

// VF-2 raises that carry a row value.
const raises = (await sys(`
  select n.nspname || '.' || p.proname as fn from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname in ('public', 'ops') and p.prokind = 'f'
     and p.prosrc ~* '(raise\\s+(exception|warning|notice)[^;]*\\m(new|old)\\.[a-z_]+|using\\s+(detail|hint)\\s*=\\s*[^;]*\\m(new|old)\\.[a-z_]+)'
   order by 1`)).rows.filter((r) => !RAISE_OK.has(r.fn));
for (const r of raises) console.log(`      ${r.fn}: a raise names a row column`);
check('VF-2 no function in public or ops raises with a NEW or OLD column in its message, detail or hint', raises.length === 0);

// VF-3 to VF-7 behaviour and catalog. Probes run as the system role so RLS is out of the way; the trigger is what fires.
// A jsonb array of one string is the string plus 4 bytes (brackets, quotes), so the byte limit is exact: n chars give n + 4 bytes.
// Probes. Values are distinctive (a Latin family word and a Devanagari one) so a leak into message, detail or hint is found by the
// actual value, not by a filler character. Each row: [name, table, sql, params, written value to look for in any error text].
const lat = (n) => 'Asha-'.repeat(Math.ceil(n / 5)).slice(0, n);
const dev = (n) => 'आशा'.repeat(Math.ceil(n / 3)).slice(0, n);
const arr = (s) => JSON.stringify([s]);
const P = (name, table, sql, value, param = value) => ({ name, table, sql, param, value });
const probes = [
  P('children.name', 'children', `insert into children (id, name, date_of_birth, created_by) values (gen_random_uuid(), $1, '2025-04-12', gen_random_uuid())`, dev(61)),
  P('children.nickname', 'children', `insert into children (id, nickname, date_of_birth, created_by) values (gen_random_uuid(), $1, '2025-04-12', gen_random_uuid())`, lat(31)),
  P('entries.final_text', 'entries', `insert into entries (id, final_text) values (gen_random_uuid(), $1)`, lat(20001)),
  P('entries.raw_transcript', 'entries', `insert into entries (id, raw_transcript) values (gen_random_uuid(), $1)`, dev(40001)),
  P('entries.author_signs_as', 'entries', `insert into entries (id, author_signs_as) values (gen_random_uuid(), $1)`, dev(31)),
  P('entries.author_edits', 'entries', `insert into entries (id, author_edits) values (gen_random_uuid(), $1::jsonb)`, lat(65533), arr(lat(65533))),
  P('entries.locked_spans', 'entries', `insert into entries (id, locked_spans) values (gen_random_uuid(), $1::jsonb)`, lat(16381), arr(lat(16381))),
  P('held_drafts.raw_transcript', 'held_drafts', `insert into held_drafts (id, raw_transcript) values (gen_random_uuid(), $1)`, dev(100001)),
  P('held_drafts.final_text', 'held_drafts', `insert into held_drafts (id, final_text) values (gen_random_uuid(), $1)`, lat(100001)),
  P('held_drafts.typed_text', 'held_drafts', `insert into held_drafts (id, typed_text) values (gen_random_uuid(), $1)`, dev(100001)),
  P('held_drafts.prompt_key', 'held_drafts', `insert into held_drafts (id, prompt_key) values (gen_random_uuid(), $1)`, lat(201)),
  P('held_drafts.machine_edits', 'held_drafts', `insert into held_drafts (id, machine_edits) values (gen_random_uuid(), $1::jsonb)`, lat(199997), arr(lat(199997))),
  P('dictionary_terms.term upper', 'dictionary_terms', `insert into dictionary_terms (owner_id, term, kind) values (gen_random_uuid(), $1, 'word')`, dev(81)),
  P('dictionary_terms.term lower', 'dictionary_terms', `insert into dictionary_terms (owner_id, term, kind) values (gen_random_uuid(), $1, 'word')`, ''),
  P('dictionary_terms.forms', 'dictionary_terms', `insert into dictionary_terms (owner_id, term, kind, forms) values (gen_random_uuid(), 'ok', 'word', $1::jsonb)`, dev(81),
    JSON.stringify([{ script: 'devanagari', text: dev(81) }])),
];
// At the limit the trigger lets the write through: any later failure (NOT NULL, a foreign key) is not the trigger's.
const atLimit = [
  P('children.name', 'children', probes[0].sql, dev(60)),
  P('children.nickname', 'children', probes[1].sql, lat(30)),
  P('entries.final_text', 'entries', probes[2].sql, lat(20000)),
  P('entries.raw_transcript', 'entries', probes[3].sql, dev(40000)),
  P('entries.author_signs_as', 'entries', probes[4].sql, dev(30)),
  P('entries.author_edits', 'entries', probes[5].sql, '', arr(lat(65532))),
  P('entries.locked_spans', 'entries', probes[6].sql, '', arr(lat(16380))),
  P('held_drafts.typed_text', 'held_drafts', probes[9].sql, dev(100000)),
  P('held_drafts.prompt_key', 'held_drafts', probes[10].sql, lat(200)),
  P('held_drafts.machine_edits', 'held_drafts', probes[11].sql, '', arr(lat(199996))),
  P('dictionary_terms.term upper', 'dictionary_terms', probes[12].sql, dev(80)),
  P('dictionary_terms.term lower', 'dictionary_terms', probes[12].sql, 'A'),
];
const refusal = async (sql, params) => {
  await sys('savepoint vf');
  try { await sys(sql, params); await sys('rollback to vf'); return null; }
  catch (e) { await sys('rollback to vf'); return e; }
};
const isTrigger = (e, table) => e !== null && e.code === '23514' && String(e.message).startsWith(`${table}:`);
const leaks = (e, value) => {
  const text = `${e?.message ?? ''} ${e?.detail ?? ''} ${e?.hint ?? ''}`;
  return /Failing row|Key \(/.test(text) || (value !== '' && text.includes(value.slice(0, 5)));
};

await sys('begin');
for (const pr of probes) {
  const e = await refusal(pr.sql, [pr.param]);
  const gap = KNOWN_GAPS.has(pr.table);
  check(`VF-3/4 ${pr.name}: over the limit, refused by the validate trigger (23514), table named, no DETAIL or HINT, no value in the text${gap ? ' (known gap)' : ''}`,
    gap ? true : isTrigger(e, pr.table) && !e.detail && !e.hint && !leaks(e, pr.value));
}
for (const pr of atLimit) {
  const e = await refusal(pr.sql, [pr.param]);
  check(`VF-5 ${pr.name}: at the limit, the validate trigger lets the write through`, !isTrigger(e, pr.table));
}
await sys('rollback');

// VF-6 the UPDATE path: a stored row, then an over-limit change is refused value-free and an at-limit change is not.
await sys(`insert into auth.users values ('${users.A}')`);
await publishPolicies();
await consent(users.A);
const kid = await newChild(users.A);
const upd = (v) => refusal(`update children set name = $1 where id = $2`, [v, kid]);
await sys('begin');
const eUp = await upd(dev(61));
check('VF-6 children: an over-limit UPDATE is refused by the validate trigger, value-free', isTrigger(eUp, 'children') && !eUp.detail && !eUp.hint && !leaks(eUp, dev(61)));
check('VF-6 children: an at-limit UPDATE is accepted', (await upd(dev(60))) === null);
await sys('rollback');

// VF-7 the four trigger functions, from the catalog: SECURITY INVOKER, search_path pinned (pg_catalog first, pg_temp last), and
// EXECUTE held by none of public, anon, authenticated, service_role.
const fns = ['entries', 'held_drafts', 'children', 'dictionary_terms'].map((t) => `${t}_validate_limits`);
const cat = (await sys(`
  select p.proname, p.prosecdef,
         (select substr(c, 13) from unnest(coalesce(p.proconfig, '{}'::text[])) c where c like 'search_path=%' limit 1) as sp,
         p.proacl::text as acl,
         exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.privilege_type = 'EXECUTE' and a.grantee = 0) as pub,
         has_function_privilege('anon', p.oid, 'execute') as anon,
         has_function_privilege('authenticated', p.oid, 'execute') as auth,
         coalesce(has_function_privilege('service_role', p.oid, 'execute'), false) as svc
    from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = any($1)`, [fns])).rows;
check('VF-7 all four validate functions exist', cat.length === 4);
for (const f of cat) {
  check(`VF-7 ${f.proname}: SECURITY INVOKER`, f.prosecdef === false);
  check(`VF-7 ${f.proname}: search_path pinned, pg_catalog first and pg_temp last`, /^pg_catalog\b.*pg_temp$/.test(f.sp ?? ''));
  check(`VF-7 ${f.proname}: EXECUTE held by none of public, anon, authenticated, service_role`, !f.pub && !f.anon && !f.auth && !f.svc);
}

// VF-8 the revoke is what removes access on a project whose new functions come with EXECUTE for the API roles (legacy default
// privileges). Rebuild the four functions from the migration's own text under those defaults, and check the revoke took all of them.
const file = process.argv.slice(2).find((f) => f.includes('_value_free_validation_triggers.sql'));
check('VF-8 the migration file is in the list', Boolean(file));
if (file) {
  await sys('begin');
  await db.exec(`drop function public.entries_validate_limits() cascade; drop function public.held_drafts_validate_limits() cascade;
             drop function public.children_validate_limits() cascade; drop function public.dictionary_terms_validate_limits() cascade`);
  await db.exec(`alter default privileges in schema public grant execute on functions to anon, authenticated, service_role`);
  await db.exec(readFileSync(file, 'utf8'));
  const held = (await sys(`select p.proname, r, has_function_privilege(r, p.oid, 'execute') as ok
      from pg_proc p cross join unnest(array['anon', 'authenticated', 'service_role']) r
     where p.pronamespace = 'public'::regnamespace and p.proname = any($1)`, [fns])).rows;
  check('VF-8 under legacy default privileges the migration leaves anon, authenticated and service_role without EXECUTE', held.length === 12 && held.every((x) => !x.ok));
  await sys('rollback');
}
done();
