// Review hardening (WS-01, 3 Oct 2026): DB-01, DB-02, DB-05, DB-06, DB-07, DB-09,
// DB-11, DB-12, DB-14, DB-15, DB-16, PDB-02, PSEC-04. Fictional family "Asha" only.
//
// This file mirrors Supabase's default privileges for functions and sequences
// itself (a one-statement prelude applied before the migrations), so the function
// and sequence checks below see what a real project sees. WS-03 moves that mirror
// into harness.mjs; until then only this file has it.
import { createDb, users, uuid7 } from './harness.mjs';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const migrations = process.argv.slice(2);
const prelude = join(mkdtempSync(join(tmpdir(), 'scribe-ws01-')), 'supabase_defaults.sql');
writeFileSync(prelude, `
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
`);
const { db, check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, join: joinAs } = await createDb([prelude, ...migrations]);
const { A, B, C, N } = users;
await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}')`);
await publishPolicies();
for (const u of [A, B, C, N]) await consent(u);
const CHILD = await newChild(A, 'Asha', '2025-05-20', null);
await sys(`update children set due_date = '2025-05-25', nickname = 'Ashu' where id=$1`, [CHILD]);
await joinAs(B, 'parent', CHILD, A);
await joinAs(N, 'contributor', CHILD, A);

const insertSql = `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
  values ($1, $2, $3, 'letter', '2026-09-29', $4, 'spoken', 1, 'um she walked', 'She walked.', true)`;
const letter = (uid, id = uuid7(), capturedAt = new Date().toISOString()) => as(uid, insertSql, [id, CHILD, uid, capturedAt]).then(() => id);

// ── DB-01: views are read-only for every API role ─────────────────────────
const aLetter = await letter(A);
for (const view of ['book_entries', 'book_children', 'my_policy_state']) {
  const held = (await sys(`select r.rolname, p.priv from (values ('anon'), ('authenticated'), ('public')) r(rolname)
      cross join unnest(array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) p(priv)
     where case when r.rolname = 'public' then false else has_table_privilege(r.rolname, 'public.${view}', p.priv) end`)).rows;
  check(`[DB-01] ${view}: no write privilege for anon or authenticated`, held.length === 0 || console.log('      held', held));
}
check('[DB-01] a co-parent cannot edit the other parent\'s letter through book_entries (42501)',
  (await codeOf(() => as(B, `update book_entries set final_text = 'x' where id=$1`, [aLetter]))) === '42501');
check('[DB-01] a co-parent cannot delete the other parent\'s letter through book_entries (42501)',
  (await codeOf(() => as(B, `delete from book_entries where id=$1`, [aLetter]))) === '42501');
check('[DB-01] even the author cannot write through book_entries (42501)',
  (await codeOf(() => as(A, `update book_entries set final_text = 'x' where id=$1`, [aLetter]))) === '42501');
check('[DB-01] the letter is untouched', (await sys(`select final_text, deleted_at from entries where id=$1`, [aLetter])).rows[0].final_text === 'She walked.');

// ── DB-05 / D-039: what contributors see about the child ──────────────────
check('[DB-05] a contributor reads no children row (no birth year, no due date)',
  (await as(N, `select date_of_birth, due_date from children where id=$1`, [CHILD])).rows.length === 0);
const seen = (await one(N, `select * from book_children where id=$1`, [CHILD]));
check('[D-039] a contributor reads name, nickname, birthday month and day',
  seen?.name === 'Asha' && seen.nickname === 'Ashu' && seen.birth_month === 5 && seen.birth_day === 20);
check('[D-039] book_children has no year, birthday or due date column',
  Object.keys(seen ?? {}).sort().join() === 'birth_day,birth_month,id,name,nickname');
check('[DB-05] a parent still reads the full children row',
  (await one(B, `select due_date is not null and date_of_birth is not null ok from children where id=$1`, [CHILD]))?.ok === true);
check('[DB-05] a stranger reads nothing from book_children', (await as(C, `select 1 from book_children`)).rows.length === 0);
check('[DB-05] select * on children still works for parents (no column grants)',
  (await codeOf(() => as(A, `select * from children where id=$1`, [CHILD]))) === 'ok');

// ── DB-15: device UUIDv7 letter ids and a sane captured_at ───────────────
check('[DB-15] a v4 letter id is refused (SCCID)', (await codeOf(() => letter(A, '0b2f9e3c-5a7d-4c1e-9f00-123456789abc'))) === 'SCCID');
check('[DB-15] a v7 id from the future is refused (SCCID)', (await codeOf(() => letter(A, uuid7(Date.now() + 3 * 86400e3)))) === 'SCCID');
check('[DB-15] captured_at two days ahead is refused (22023)',
  (await codeOf(() => letter(A, uuid7(), new Date(Date.now() + 2 * 86400e3).toISOString()))) === '22023');
check('[DB-15] captured_at a few hours ahead (device clock skew) is accepted',
  (await codeOf(() => letter(A, uuid7(), new Date(Date.now() + 3 * 3600e3).toISOString()))) === 'ok');

// ── DB-02 / PDB-03: a purged letter id never comes back ──────────────────
const gone = await letter(A);
await as(A, `select public.delete_entry($1)`, [gone]);
const purged = (await sys(`select public.purge_due(now() + interval '31 days') r`)).rows[0].r;
check('the tombstoned letter is purged', purged.entries >= 1 && (await sys(`select 1 from entries where id=$1`, [gone])).rows.length === 0);
check('[DB-02] day 1 after purge: re-inserting the id is refused (SCPRG)', (await codeOf(() => letter(A, gone))) === 'SCPRG');
const upsert = `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
  values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', 'She walked.', true)
  on conflict (id) do update set final_text = excluded.final_text`;
check('[DB-02] a stale device upsert of the purged id is refused (SCPRG)', (await codeOf(() => as(A, upsert, [gone, CHILD, A]))) === 'SCPRG');
check('[DB-02] the service role cannot re-insert it either (SCPRG)',
  (await codeOf(() => sys(insertSql, [gone, CHILD, A, new Date().toISOString()]))) === 'SCPRG');
await sys(`insert into purge_ledger (entity_type, entity_id) values ('profile', $1), ('storage_object', 'x/y.jpg')`, ['99999999-9999-4999-8999-999999999999']);
await sys(`update purge_ledger set purged_at = now() - interval '61 days'`);
await sys(`select public.purge_due(now())`);
check('[DB-02] housekeeping keeps entry and book ids for good', (await sys(`select 1 from purge_ledger where entity_type = 'entry' and entity_id=$1`, [gone])).rows.length === 1);
check('housekeeping still ages out person and object-path rows after 60 days',
  (await sys(`select count(*)::int n from purge_ledger where entity_type in ('profile', 'storage_object')`)).rows[0].n === 0);
check('[DB-02] day 61 after purge: re-inserting the id is still refused (SCPRG)', (await codeOf(() => letter(A, gone))) === 'SCPRG');
check('[DB-02] day 61: the upsert is still refused (SCPRG)', (await codeOf(() => as(A, upsert, [gone, CHILD, A]))) === 'SCPRG');

// ── PSEC-04: photos cannot be overwritten; delete needs live membership ───
const nLetter = await letter(N);
const nPhoto = `${CHILD}/${N}/${nLetter}.jpg`;
await as(N, `insert into storage.objects (bucket_id, name) values ('entry-photos', $1)`, [nPhoto]);
check('[PSEC-04] no member may update a photo object in place',
  (await as(N, `update storage.objects set name = name where name=$1`, [nPhoto])).affectedRows === 0);
await as(N, `delete from child_members where child_id=$1 and profile_id=$2`, [CHILD, N]);
check('[PSEC-04] after leaving, the member\'s photo update is refused',
  (await as(N, `update storage.objects set bucket_id = 'entry-photos', name = $1 where name=$1`, [nPhoto])).affectedRows === 0);
check('[PSEC-04] after leaving, the member\'s photo delete is refused',
  (await as(N, `delete from storage.objects where name=$1`, [nPhoto])).affectedRows === 0
  && (await sys(`select 1 from storage.objects where name=$1`, [nPhoto])).rows.length === 1);
const aPhoto = `${CHILD}/${A}/${aLetter}.jpg`;
await as(A, `insert into storage.objects (bucket_id, name) values ('entry-photos', $1)`, [aPhoto]);
check('[PSEC-04] a current member deletes their own photo', (await as(A, `delete from storage.objects where name=$1`, [aPhoto])).affectedRows === 1);
check('[PSEC-04] a malformed path is refused without a cast error',
  (await codeOf(() => as(A, `delete from storage.objects where bucket_id = 'entry-photos' and name = $1`, [`not-a-uuid/${A}/x.jpg`]))) === 'ok');

// ── DB-12: dictionary terms per owner, per book, ignoring case ───────────
// A second book for A (the server does not enforce Plus, founder decision 3).
const SECOND = await newChild(A, 'Ravi', '2025-05-20', null);
const term = (child, t) => as(A, `insert into dictionary_terms (owner_id, child_id, term, kind) values ($1, $2, $3, 'family')`, [A, child, t]);
await term(CHILD, 'Nani');
check('[DB-12] the same name can be saved for a second book', SECOND !== null && (await codeOf(() => term(SECOND, 'Nani'))) === 'ok');
check('[DB-12] a case variant in the same book is refused (23505)', (await codeOf(() => term(CHILD, 'nani'))) === '23505');
await term(null, 'Dadi');
check('[DB-12] "all books" (null child) counts as one value (23505)', (await codeOf(() => term(null, 'DADI'))) === '23505');

// ── DB-09: specific codes ────────────────────────────────────────────────
check('[DB-09] only a parent deletes a book (SCPAR)', (await codeOf(() => as(C, `select public.request_book_deletion($1, 'ios')`, [CHILD]))) === 'SCPAR');
check('[DB-09] an unknown policy version is P0002', (await codeOf(() => as(A, `select public.record_policy_act('terms', '9.9.9', 'accept', 'signin_sheet', 'auth.sheet', '1', 'ios')`))) === 'P0002');
check('[DB-09] support-assisted acts from a client are 22023', (await codeOf(() => as(A, `select public.record_policy_act('terms', '1.0.0', 'accept', 'support_assisted', 'auth.sheet', '1', 'ios')`))) === '22023');
const bLetter = await letter(B);
await as(B, `select * from public.request_account_deletion('ios')`);
check('[DB-09] restoring letters during a pending account deletion is SCACD', (await codeOf(() => as(B, `select public.restore_entry($1)`, [bLetter]))) === 'SCACD');
await as(B, `select public.cancel_account_deletion()`);
check('[DB-09] a parent tombstoning the book directly is SCTMB', (await codeOf(() => as(B, `update children set deleted_at = now() where id=$1`, [CHILD]))) === 'SCTMB');

// ── DB-07: the consent pepper fails closed ───────────────────────────────
check('[DB-07] with no pepper set, deleting a profile raises SCCFG',
  (await codeOf(() => sys(`delete from auth.users where id=$1`, [C]))) === 'SCCFG' && (await sys(`select 1 from profiles where id=$1`, [C])).rows.length === 1);
await sys(`select set_config('app.consent_pepper', 'short', false)`);
check('[DB-07] a pepper under 32 characters is refused too', (await codeOf(() => sys(`delete from auth.users where id=$1`, [C]))) === 'SCCFG');
await sys(`select set_config('app.consent_pepper', 'test-pepper-0123456789abcdef0123456789', false)`);
check('[DB-07] with a pepper set, the profile is deleted and acceptances are pseudonymised',
  (await codeOf(() => sys(`delete from auth.users where id=$1`, [C]))) === 'ok'
  && (await sys(`select count(*)::int n from policy_acceptances where profile_id is null and subject_hash is not null`)).rows[0].n >= 2);

// ── DB-06 / DB-14: indexes ───────────────────────────────────────────────
const idx = (await sys(`select indexname, indexdef from pg_indexes where schemaname = 'public' and tablename = 'entries'`)).rows;
check('[DB-06] a full (non-partial) index leads with entries.child_id',
  idx.some((i) => /\(child_id, occurred_on\)$/.test(i.indexdef) && !/ WHERE /.test(i.indexdef)));
check('[DB-14] the redundant entries_book_idx is gone', !idx.some((i) => i.indexname === 'entries_book_idx'));

// ── DB-11: definer functions resolve pg_catalog first ────────────────────
const badPath = (await sys(`select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' sig, array_to_string(p.proconfig, ',') cfg
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef and coalesce(array_to_string(p.proconfig, ','), '') !~ 'search_path=pg_catalog, public'`)).rows;
for (const f of badPath) console.log(`      ${f.sig}: ${f.cfg}`);
check('[DB-11] every security definer function sets search_path = pg_catalog, public', badPath.length === 0);

// ── PDB-02 and function defaults (Supabase-faithful privileges) ──────────
const seqs = (await sys(`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'S'
    and (has_sequence_privilege('anon', c.oid, 'usage') or has_sequence_privilege('authenticated', c.oid, 'usage')
         or has_sequence_privilege('anon', c.oid, 'select') or has_sequence_privilege('authenticated', c.oid, 'select'))`)).rows;
for (const s of seqs) console.log(`      sequence still usable: ${s.relname}`);
check('[PDB-02] no public sequence is usable by anon or authenticated', seqs.length === 0);
check('[PDB-02] authenticated cannot advance the audit sequence', (await codeOf(() => as(A, `select nextval('public.audit_events_id_seq')`))) === '42501');
const anonFns = (await sys(`select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')`)).rows;
for (const f of anonFns) console.log(`      callable by anon under Supabase defaults: ${f.proname}`);
check('no public function is callable by anon, even with Supabase function defaults', anonFns.length === 0);

// ── DB-16: file 3 has no transaction control of its own ──────────────────
const file3 = migrations.find((f) => f.endsWith('20261002010000_entries_select_policy.sql'));
const sql3 = readFileSync(file3, 'utf8').split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
check('[DB-16] 20261002010000 has no begin or commit (the CLI wraps each file)', !/\b(begin|commit)\s*;/i.test(sql3));

await db.close();
done();
