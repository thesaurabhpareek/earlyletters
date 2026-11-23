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
import { createDb, users, uuid7 } from './harness.mjs';

const { db, check, sys, as, one, done, newChild, publishPolicies, consent } = await createDb(process.argv.slice(2));

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
  P('children.name', 'children', `insert into children (id, name, date_of_birth, created_by) values (gen_random_uuid(), $1, '2025-04-12', gen_random_uuid())`, dev(961)),
  P('children.nickname', 'children', `insert into children (id, nickname, date_of_birth, created_by) values (gen_random_uuid(), $1, '2025-04-12', gen_random_uuid())`, lat(31)),
  P('entries.final_text', 'entries', `insert into entries (id, final_text) values (gen_random_uuid(), $1)`, lat(20001)),
  P('entries.raw_transcript', 'entries', `insert into entries (id, raw_transcript) values (gen_random_uuid(), $1)`, dev(40001)),
  P('entries.author_signs_as', 'entries', `insert into entries (id, author_signs_as) values (gen_random_uuid(), $1)`, dev(481)),
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
  P('children.name', 'children', probes[0].sql, dev(960)),
  P('children.nickname', 'children', probes[1].sql, lat(30)),
  P('entries.final_text', 'entries', probes[2].sql, lat(20000)),
  P('entries.raw_transcript', 'entries', probes[3].sql, dev(40000)),
  P('entries.author_signs_as', 'entries', probes[4].sql, dev(480)),
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
const eUp = await upd(dev(961));
check('VF-6 children: an over-limit UPDATE is refused by the validate trigger, value-free', isTrigger(eUp, 'children') && !eUp.detail && !eUp.hint && !leaks(eUp, dev(961)));
check('VF-6 children: an at-limit UPDATE is accepted', (await upd(dev(960))) === null);
await sys('rollback');

// VF-7 the four trigger functions, from the catalog: SECURITY INVOKER, search_path pinned (pg_catalog first, pg_temp last), and
// EXECUTE held by none of public, anon, authenticated, service_role.
const fns4 = ['entries', 'held_drafts', 'children', 'dictionary_terms'].map((t) => `${t}_validate_limits`);
const fns = [...fns4, 'children_validate_shape'];   // 20261122000000 (BL-1499) adds the fifth
const cat = (await sys(`
  select p.proname, p.prosecdef,
         (select substr(c, 13) from unnest(coalesce(p.proconfig, '{}'::text[])) c where c like 'search_path=%' limit 1) as sp,
         p.proacl::text as acl,
         exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.privilege_type = 'EXECUTE' and a.grantee = 0) as pub,
         has_function_privilege('anon', p.oid, 'execute') as anon,
         has_function_privilege('authenticated', p.oid, 'execute') as auth,
         coalesce(has_function_privilege('service_role', p.oid, 'execute'), false) as svc
    from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = any($1)`, [fns])).rows;
check('VF-7 all five validate functions exist', cat.length === 5);
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
     where p.pronamespace = 'public'::regnamespace and p.proname = any($1)`, [fns4])).rows;
  check('VF-8 under legacy default privileges the migration leaves anon, authenticated and service_role without EXECUTE', held.length === 12 && held.every((x) => !x.ok));
  await sys('rollback');
}
// VF-8b the same legacy-default-privileges rebuild for the function 20261122000000 adds.
const file2 = process.argv.slice(2).find((f) => f.includes('_value_free_children_shape.sql'));
check('VF-8b the children shape migration file is in the list', Boolean(file2));
if (file2) {
  await sys('begin');
  await db.exec(`drop function public.children_validate_shape() cascade`);
  await db.exec(`alter default privileges in schema public grant execute on functions to anon, authenticated, service_role`);
  await db.exec(readFileSync(file2, 'utf8'));
  const held2 = (await sys(`select r, has_function_privilege(r, p.oid, 'execute') as ok
      from pg_proc p cross join unnest(array['anon', 'authenticated', 'service_role']) r
     where p.pronamespace = 'public'::regnamespace and p.proname = 'children_validate_shape'`)).rows;
  check('VF-8b under legacy default privileges the children shape migration leaves anon, authenticated and service_role without EXECUTE',
    held2.length === 3 && held2.every((x) => !x.ok));
  await sys('rollback');
}

// ---- BL-1499 (BL-244b): NOT NULL, foreign key and shape CHECK errors. Which paths can echo a row, by test. ------------------------
// Postgres prints the row (or the key) of a failed NOT NULL, CHECK or foreign key only to a role that is not subject to row level
// security on the table, that is the owner: SECURITY DEFINER code. A caller under RLS gets the bare message. The reachable echoes
// (children, written by definer RPCs) are closed by children_validate_shape (VF-12); the rest are shown unreachable (VF-9 to VF-11).
// Values are Devanagari so a leak is found by the value itself.
const WORD = 'आशा-शब्द';
const trap = async (fn) => { try { await fn(); return null; } catch (e) { return e; } };
const bare = (e, ...vals) => e !== null && e.detail === undefined && e.hint === undefined
  && !/Failing row|Key \(/.test(String(e.message)) && vals.every((v) => !String(e.message).includes(v));

// VF-9 every function in any schema that writes one of the four tables is on a list. A new writer fails here until it is read for
// NOT NULL, foreign key and shape CHECK echoes and added to the right list.
const GUARDED_WRITERS = new Set(['public.book_update', 'public.ops_set_child_photo_path']);   // children_validate_shape closes them
const FIXED_VALUE_WRITERS = new Set([   // set constants, or values they validate first
  'public.cancel_account_deletion', 'public.cancel_book_deletion', 'public.create_child_row', 'public.delete_entry',
  'public.finalize_account_deletion', 'public.leave_child', 'public.ops_replay_ledger', 'public.prepare_account_purge',
  'public.purge_book_keep_authors', 'public.remove_child_member', 'public.request_account_deletion', 'public.request_book_deletion',
  'public.restore_entry', 'public.review_family_letter', 'public.undo_parent_join', 'public.withdraw_family_letter',
  'sync_private.erase_entry']);
const INVOKER_WRITERS = new Set(['public.sync_push', 'sync_private.held_upsert']);   // run as the caller: RLS on, no row printed (VF-11)
const writers = (await sys(`
  select n.nspname || '.' || p.proname as fn, p.prosecdef as def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname not in ('pg_catalog', 'information_schema', 'auth', 'storage', 'extensions', 'realtime', 'vault')
     and p.prokind = 'f'
     and p.prosrc ~* '(insert\\s+into|update)\\s+(public\\.)?(entries|held_drafts|children|dictionary_terms)\\M'
   order by 1`)).rows;
const known = new Set([...GUARDED_WRITERS, ...FIXED_VALUE_WRITERS, ...INVOKER_WRITERS]);
for (const w of writers.filter((x) => !known.has(x.fn))) console.log(`      ${w.fn}: writes a content table and is not classified in VF-9`);
check('VF-9 every function that writes entries, held_drafts, children or dictionary_terms is classified', writers.every((x) => known.has(x.fn)));
check('VF-9 the classified list has no stale name', [...known].every((k) => writers.some((x) => x.fn === k)));
check('VF-9 the invoker writers are SECURITY INVOKER (they run under RLS)',
  writers.filter((x) => INVOKER_WRITERS.has(x.fn)).length === INVOKER_WRITERS.size && writers.filter((x) => INVOKER_WRITERS.has(x.fn)).every((x) => x.def === false));
check('VF-9 no function writes dictionary_terms',
  (await sys(`select count(*)::int c from pg_proc p where p.prosrc ~* '(insert\\s+into|update)\\s+(public\\.)?dictionary_terms\\M'`)).rows[0].c === 0);

// VF-10 who may write. anon and service_role hold no write on any of the four; authenticated none on children or dictionary_terms.
const priv = (await sys(`
  select t.t, r.r, p.p, has_table_privilege(r.r, 'public.' || t.t, p.p) as ok
    from unnest(array['entries', 'held_drafts', 'children', 'dictionary_terms']) t(t)
    cross join unnest(array['anon', 'authenticated', 'service_role']) r(r)
    cross join unnest(array['INSERT', 'UPDATE']) p(p)`)).rows;
const mayWrite = (t, r) => priv.some((x) => x.t === t && x.r === r && x.ok);
check('VF-10 anon and service_role hold no INSERT or UPDATE on any of the four tables',
  ['entries', 'held_drafts', 'children', 'dictionary_terms'].every((t) => !mayWrite(t, 'anon') && !mayWrite(t, 'service_role')));
check('VF-10 authenticated holds no INSERT or UPDATE on children or dictionary_terms', !mayWrite('children', 'authenticated') && !mayWrite('dictionary_terms', 'authenticated'));
const eDict = await trap(() => as(users.A, `insert into dictionary_terms (owner_id, term, kind) values (auth.uid(), $1, 'nope')`, [WORD]));
check('VF-10 dictionary_terms: an authenticated write with a bad kind stops at 42501 (privilege first), no row, no value', eDict?.code === '42501' && bare(eDict, WORD));
const eKids = await trap(() => as(users.A, `update children set name = null where id = $1`, [kid]));
check('VF-10 children: an authenticated direct update stops at 42501, no row', eKids?.code === '42501' && bare(eKids));
const rls = (await sys(`select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relname = any(array['entries', 'held_drafts', 'children', 'dictionary_terms'])`)).rows;
check('VF-10 row level security is on for all four tables (it is what keeps the row out of an authenticated caller\'s error)', rls.length === 4 && rls.every((x) => x.relrowsecurity));

// VF-11 entries and held_drafts, written by authenticated: direct writes and sync_push. NOT NULL, enum CHECK and foreign key
// violations carry no DETAIL and no value; a made-up book or author is refused by RLS (42501), never by the foreign key (23503).
let n = 0;
const id7 = () => uuid7(Date.now() - 5000 + ++n);
const book = await newChild(users.A, 'Asha', '2025-04-12');
const ENT = `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text)`;
const entVals = (over = {}) => {
  const v = { id: id7(), child: book, author: users.A, kind: 'letter', capture: 'spoken', text: WORD, ...over };
  return [v.id, v.child, v.author, v.kind, v.capture, v.text];
};
const ghost = '99999999-9999-4999-8999-999999999991';
const entIns = (over) => as(users.A, `${ENT} values ($1, $2, $3, $4, '2026-09-29', now(), $5, 2, $6, $6)`, entVals(over));
const expect = async (name, fn, code) => {
  const e = await trap(fn);
  check(`VF-11 ${name}: ${code}, no DETAIL, no HINT, no row, no key, no value`, e?.code === code && bare(e, WORD));
};
await expect('entries insert, kind outside the enum (23514)', () => entIns({ kind: WORD }), '23514');
await expect('entries insert, capture_mode outside the enum (23514)', () => entIns({ capture: WORD }), '23514');
await expect('entries insert, final_text null (23502)', () => as(users.A,
  `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript) values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 2, $4)`,
  [id7(), book, users.A, WORD]), '23502');
await expect('entries insert, captured_at missing (23502)', () => as(users.A,
  `insert into entries (id, child_id, author_id, kind, occurred_on, capture_mode, engine_version, raw_transcript, final_text) values ($1, $2, $3, 'letter', '2026-09-29', 'spoken', 2, $4, $4)`,
  [id7(), book, users.A, WORD]), '23502');
await expect('entries insert, a book that does not exist (foreign key unreachable: RLS first, 42501)', () => entIns({ child: ghost }), '42501');
await expect('entries insert, an author that is not the caller (42501)', () => entIns({ author: ghost }), '42501');
await expect('entries insert, author null (42501)', () => as(users.A,
  `insert into entries (id, child_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text) values ($1, $2, 'letter', '2026-09-29', now(), 'spoken', 2, $3, $3)`,
  [id7(), book, WORD]), '42501');
const kept = id7();
await entIns({ id: kept });
await expect('entries update, kind outside the enum (23514)', () => as(users.A, `update entries set kind = $2 where id = $1`, [kept, WORD]), '23514');
await expect('entries update, machine_edits null (23502)', () => as(users.A, `update entries set machine_edits = null where id = $1`, [kept]), '23502');
await expect('entries update, author_edits not an array (23514)', () => as(users.A, `update entries set author_edits = $2::jsonb where id = $1`, [kept, JSON.stringify({ a: WORD })]), '23514');
const HELD = `insert into held_drafts (id, child_id, author_id, kind, capture_mode, created_at, occurred_on, typed_text)`;
await expect('held_drafts insert, kind outside the enum (23514)', () => as(users.A, `${HELD} values ($1, $2, $3, $5, 'typed', now(), '2026-10-02', $4)`, [id7(), book, users.A, WORD, WORD]), '23514');
await expect('held_drafts insert, capture_mode missing (23502)', () => as(users.A,
  `insert into held_drafts (id, child_id, author_id, kind, created_at, occurred_on, typed_text) values ($1, $2, $3, 'held_letter', now(), '2026-10-02', $4)`, [id7(), book, users.A, WORD]), '23502');
await expect('held_drafts insert, a book that does not exist (42501)', () => as(users.A, `${HELD} values ($1, $2, $3, 'held_letter', 'typed', now(), '2026-10-02', $4)`, [id7(), ghost, users.A, WORD]), '42501');
await expect('held_drafts insert, an author that is not the caller (42501)', () => as(users.A, `${HELD} values ($1, $2, $3, 'held_letter', 'typed', now(), '2026-10-02', $4)`, [id7(), book, ghost, WORD]), '42501');

// sync_push answers a refused op with its SQLSTATE only: the whole answer carries neither the value nor a row.
const NOW = new Date().toISOString();
const push = async (ops) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [users.A]);
  return (await one(users.A, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).r;
};
const letterOp = (over) => { const id = id7(); return { op: id7(), type: 'entry.upsert', id, data: { id, child_id: book, kind: 'letter', occurred_on: '2026-09-29',
  captured_at: '2026-09-29T20:00:00Z', capture_mode: 'spoken', edit_level: 'clean', prompt_key: null, engine_version: 2, raw_transcript: WORD,
  machine_edits: [], final_text: WORD, in_book: true, sounds_like_me: null, author_signs_as: 'Mama', audio_kept_on_device: true, ...over } }; };
const heldOp = (over) => { const id = id7(); return { op: id7(), type: 'held.upsert', id, data: { id, child_id: book, kind: 'held_letter', capture_mode: 'typed',
  created_at: NOW, occurred_on: '2026-10-02', occurred_precision: 'day', language: null, base_direction: 'ltr', prompt_key: null, in_book_choice: true,
  raw_transcript: null, final_text: null, machine_edits: null, edit_level: null, author_edits: null, locked_spans: null, typed_text: WORD,
  engine_version: 5, pack_ref: null, audio_kept_on_device: true, ...over } }; };
const pushCases = [
  ['entry.upsert, kind outside the enum', letterOp({ kind: WORD }), '23514'],
  ['entry.upsert, captured_at null', letterOp({ captured_at: null }), '23502'],
  ['entry.upsert, final_text null', letterOp({ final_text: null }), '23502'],
  ['entry.upsert, a book that does not exist', letterOp({ child_id: ghost }), '42501'],
  ['held.upsert, kind outside the enum', heldOp({ kind: WORD }), '23514'],
  ['held.upsert, created_at null', heldOp({ created_at: null }), '23502'],
  ['held.upsert, a book that does not exist', heldOp({ child_id: ghost }), '42501'],
];
for (const [name, o, code] of pushCases) {
  const r = await push([o]);
  const text = JSON.stringify(r);
  check(`VF-11 sync_push ${name}: refused with ${code}, the answer has no row, key or value`,
    r.results[0].ok === false && r.results[0].code === code && !text.includes(WORD) && !/Failing row|Key \(/.test(text));
}

// VF-12 children: the writers that run as the owner. The printed row would carry the name and the nickname.
const kid3 = await newChild(users.A, WORD, '2025-04-12');                  // a birthday, no due date
const kid4 = await newChild(users.A, WORD, '2025-04-12', new Date().toISOString().slice(0, 10));   // both
const bu = (id, data) => as(users.A, `select public.book_update($1, $2::jsonb)`, [id, JSON.stringify(data)]);
const e1 = await trap(() => bu(kid3, { date_of_birth: null }));
check('VF-12 book_update: removing the only date is refused 23514 children_has_date, fixed message, no row, no name',
  e1?.code === '23514' && e1.constraint === 'children_has_date' && String(e1.message).startsWith('children:') && bare(e1, WORD));
const e2 = await trap(() => bu(kid3, { family_can_read: null }));
check('VF-12 book_update: family_can_read null is refused 23502 on that column, fixed message, no row, no name',
  e2?.code === '23502' && e2.column === 'family_can_read' && e2.table === 'children' && String(e2.message).startsWith('children:') && bare(e2, WORD));
check('VF-12 book_update: removing a date while the other stays is accepted', (await trap(() => bu(kid4, { date_of_birth: null }))) === null);
check('VF-12 book_update: a normal change is accepted', (await trap(() => bu(kid3, { family_can_read: true, nickname: 'Ashu' }))) === null);
await sys('begin');
const old = `${kid3}/${uuid7()}.jpg`;
await sys(`update children set photo_path = $2 where id = $1`, [kid3, old]);
const setPhoto = (p) => refusal(`select public.ops_set_child_photo_path($1, $2, $3)`, [kid3, old, p]);
const e3 = await setPhoto(WORD);
check('VF-12 ops_set_child_photo_path (purge worker): a path outside the book is refused 23514 children_photo_path_scoped, no row, no name',
  e3?.code === '23514' && e3.constraint === 'children_photo_path_scoped' && String(e3.message).startsWith('children:') && bare(e3, WORD));
check('VF-12 ops_set_child_photo_path: a path of the book is accepted', (await setPhoto(`${kid3}/${uuid7()}.png`)) === null);
const e4 = await refusal(`insert into children (id, name, date_of_birth, created_by, photo_path) values (gen_random_uuid(), $1, '2025-04-12', $2, $1)`, [WORD, users.A]);
check('VF-12 insert path: a photo_path outside the book is refused the same way', e4?.code === '23514' && e4.constraint === 'children_photo_path_scoped' && bare(e4, WORD));
const e5 = await refusal(`insert into children (id, name, created_by) values (gen_random_uuid(), $1, $2)`, [WORD, users.A]);
check('VF-12 insert path: no birthday and no due date is refused the same way', e5?.code === '23514' && e5.constraint === 'children_has_date' && bare(e5, WORD));
await sys('rollback');
// ---- BL-1537 (BL-244c): a date or boolean that does not parse. The cast printed the client's own text ("invalid input syntax for
// type date: ...") in the message of book_update and create_first_run_children (and, through them, of sync_push's book.update and
// book.first_run). 20261122100000 parses with sync_private.safe_date and safe_bool: the same SQLSTATE, a fixed message.
// sync_push's own book.create cast is caught by its per-op handler, which answers the SQLSTATE only (VF-15).
const BAD = 'आशा-१९/१३/४५';   // not a date, not a boolean; Devanagari so a leak is found by the value
const sqlstateOf = async (sql) => (await trap(() => sys(sql)))?.code;
// VF-13 the helpers keep the cast's SQLSTATE, whatever the input, and answer a fixed message.
const CASES = [['date', BAD], ['date', ''], ['date', '2025-02-30'], ['date', '2025-13-01'], ['date', '2025-04-12'], ['date', null],
  ['boolean', BAD], ['boolean', ''], ['boolean', 'true'], ['boolean', 't'], ['boolean', null]];
for (const [ty, v] of CASES) {
  const lit = v === null ? 'null' : `'${v}'`;
  const raw = await trap(() => sys(`select ${lit}::${ty}`));
  const safe = await trap(() => sys(`select sync_private.safe_${ty === 'date' ? 'date' : 'bool'}(${lit}) x`));
  const same = raw === null ? safe === null : safe?.code === raw.code && safe.detail === undefined && safe.hint === undefined
    && (!v || !String(safe.message).includes(String(v).slice(0, 5))) && /^[a-z ]+$/.test(String(safe.message));
  check(`VF-13 safe_${ty === 'date' ? 'date' : 'bool'}(${JSON.stringify(v)}): ${raw === null ? 'parses like the cast' : `same SQLSTATE ${raw.code}, fixed message, no value`}`, same);
}
check('VF-13 safe_date and safe_bool return what the cast returns',
  (await sys(`select sync_private.safe_date('2025-04-12') = '2025-04-12'::date a, sync_private.safe_bool('yes') b, sync_private.safe_bool('f') = false c, sync_private.safe_date(null) is null d`)).rows
    .every((r) => r.a && r.b && r.c && r.d));
// VF-14 who may run them, from the catalog (invoker callers need EXECUTE; anon and PUBLIC never; pinned search_path; not definer).
const hp = (await sys(`select p.proname, p.prosecdef, p.provolatile,
    (select substr(c, 13) from unnest(coalesce(p.proconfig, '{}'::text[])) c where c like 'search_path=%' limit 1) sp,
    has_function_privilege('authenticated', p.oid, 'execute') auth, has_function_privilege('anon', p.oid, 'execute') anon,
    exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.privilege_type = 'EXECUTE' and a.grantee = 0) pub
  from pg_proc p where p.pronamespace = 'sync_private'::regnamespace and p.proname in ('safe_date', 'safe_bool')`)).rows;
check('VF-14 both helpers exist', hp.length === 2);
for (const f of hp) {
  check(`VF-14 ${f.proname}: SECURITY INVOKER, stable, search_path pinned pg_catalog first and pg_temp last`, f.prosecdef === false && f.provolatile === 's' && /^pg_catalog\b.*pg_temp$/.test(f.sp ?? ''));
  check(`VF-14 ${f.proname}: executable by authenticated (sync_push and held writers are invokers), not by anon or PUBLIC`, f.auth && !f.anon && !f.pub);
}
// VF-15 the callers. The same bad text in each date field and the boolean, direct and through sync_push.
const kid5 = await newChild(users.A, WORD, '2025-04-12');
const noValue = (e) => e !== null && bare(e, BAD, BAD.slice(0, 5)) && !/invalid input syntax/.test(String(e.message));
for (const [field, ty] of [['date_of_birth', '22007'], ['due_date', '22007'], ['family_can_read', '22P02']]) {
  const e = await trap(() => bu(kid5, { [field]: BAD }));
  check(`VF-15 book_update ${field}: refused ${ty} as before, fixed message, no value`, e?.code === ty && noValue(e));
}
const eFr = await trap(() => as(users.A, `select public.create_first_run_children($1::jsonb)`,
  [JSON.stringify([{ id: uuid7(), name: WORD, date_of_birth: BAD }])]));
check('VF-15 create_first_run_children date_of_birth: refused 22007 as before, fixed message, no value', eFr?.code === '22007' && noValue(eFr));
const eFr2 = await trap(() => as(users.A, `select public.create_first_run_children($1::jsonb)`,
  [JSON.stringify([{ id: uuid7(), name: WORD, due_date: BAD }])]));
check('VF-15 create_first_run_children due_date: refused 22007 as before, fixed message, no value', eFr2?.code === '22007' && noValue(eFr2));
for (const [name, o, code] of [
  ['book.update date_of_birth', { op: id7(), type: 'book.update', id: kid5, data: { date_of_birth: BAD } }, '22007'],
  ['book.update family_can_read', { op: id7(), type: 'book.update', id: kid5, data: { family_can_read: BAD } }, '22P02'],
  ['book.first_run due_date', { op: id7(), type: 'book.first_run', id: id7(), data: { children: [{ id: id7(), name: WORD, due_date: BAD }] } }, '22007'],
  ['book.create date_of_birth', { op: id7(), type: 'book.create', id: id7(), data: { name: WORD, date_of_birth: BAD } }, '22007'],
]) {
  const r = await push([o]);
  const text = JSON.stringify(r);
  check(`VF-15 sync_push ${name}: refused ${code} as before, the answer has no value`,
    r.results[0].ok === false && r.results[0].code === code && !text.includes(BAD.slice(0, 5)) && !/invalid input/.test(text));
}
// VF-16 good values still go through, on every caller.
check('VF-16 book_update: a date, a due date and a boolean written as text are accepted',
  (await trap(() => bu(kid5, { date_of_birth: '2025-05-01', due_date: '2025-04-20', family_can_read: 'true' }))) === null);
const okFr = await trap(() => as(users.A, `select public.create_first_run_children($1::jsonb)`,
  [JSON.stringify([{ id: uuid7(), name: 'Asha', date_of_birth: '2025-06-01' }, { id: uuid7(), name: 'Ashu', due_date: '2027-01-01' }])]));
check('VF-16 create_first_run_children: two books with a date each are accepted', okFr === null);
check('VF-16 the birthday written by book_update is the one stored',
  (await sys(`select date_of_birth::text d from children where id = $1`, [kid5])).rows[0].d === '2025-05-01');
// VF-17 the callers use the helpers, from source: no raw date or boolean cast of a jsonb field is left in the two bodies.
const src = (await sys(`select p.proname, p.prosrc from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('book_update', 'create_first_run_children')`)).rows;
check('VF-17 book_update and create_first_run_children hold no raw ::date or ::boolean cast', src.length === 2 && src.every((f) => !/::\s*(date|boolean)\b|\sdate_of_birth date|\sdue_date date/.test(f.prosrc)));
done();
