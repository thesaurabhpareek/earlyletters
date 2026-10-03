// Review hardening (WS-01, 3 Oct 2026): DB-01, DB-02, DB-05, DB-06, DB-07, DB-09,
// DB-11, DB-12, DB-14, DB-15, DB-16, PDB-02, PSEC-04. Fictional family "Asha" only.
//
// This file mirrors Supabase's default privileges for functions and sequences
// itself (a one-statement prelude applied before the migrations), so the function
// and sequence checks below see what a real project sees. WS-03 moves that mirror
// into harness.mjs; until then only this file has it.
import { createDb, users, uuid7 } from './harness.mjs';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
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
const CHILD = await newChild(A, 'Asha', '2025-04-12', null);
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
  seen?.name === 'Asha' && seen.nickname === 'Ashu' && seen.birth_month === 4 && seen.birth_day === 12);
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
const SECOND = await newChild(A, 'Ravi', '2025-04-12', null);
const term = (child, t) => as(A, `insert into dictionary_terms (owner_id, child_id, term, kind) values ($1, $2, $3, 'family')`, [A, child, t]);
await term(CHILD, 'Nani');
check('[DB-12] the same name can be saved for a second book', SECOND !== null && (await codeOf(() => term(SECOND, 'Nani'))) === 'ok');
check('[DB-12] a case variant in the same book is refused (23505)', (await codeOf(() => term(CHILD, 'nani'))) === '23505');
await term(null, 'Dadi');
check('[DB-12] "all books" (null child) counts as one value (23505)', (await codeOf(() => term(null, 'DADI'))) === '23505');

// ── DB-09: specific codes ────────────────────────────────────────────────
check('[DB-09] only a parent deletes a book (SCPAR)', (await codeOf(() => as(C, `select public.request_book_deletion($1, 'ios')`, [CHILD]))) === 'SCPAR');
check('[DB-09] an unknown policy version is P0002', (await codeOf(() => as(A, `select public.record_policy_act('${uuid7()}', 'terms', '9.9.9', 'accept', 'signin_sheet', 'auth.sheet', '1', 'ios')`))) === 'P0002');
check('[DB-09] support-assisted acts from a client are 22023', (await codeOf(() => as(A, `select public.record_policy_act('${uuid7()}', 'terms', '1.0.0', 'accept', 'support_assisted', 'auth.sheet', '1', 'ios')`))) === '22023');
const bLetter = await letter(B);
await as(B, `select * from public.request_account_deletion('ios')`);
check('[DB-09] restoring letters during a pending account deletion is SCACD', (await codeOf(() => as(B, `select public.restore_entry($1)`, [bLetter]))) === 'SCACD');
await as(B, `select public.cancel_account_deletion()`);
check('[DB-09] a parent tombstoning the book directly is SCTMB', (await codeOf(() => as(B, `update children set deleted_at = now() where id=$1`, [CHILD]))) === 'SCTMB');

// ── Retry safety (founder decision 17): client idempotency keys ─────────
{
  const hash = (t) => createHash('sha256').update(t, 'utf8').digest('hex');
  // The code hash defaults to one derived from the token hash, so a replay sends the same pair.
  const mk = (uid, id, child, role, tokenHash, signsAs = null, codeHash = hash(`code:${tokenHash}`)) =>
    as(uid, `select public.create_child_invite($1, $2, $3, decode($4, 'hex'), decode($5, 'hex'), $6) id`, [id, child, role, tokenHash, codeHash, signsAs]).then((r) => r.rows[0].id);
  const invites = async () => (await sys(`select count(*)::int n from child_invites where invited_by=$1`, [A])).rows[0].n;
  const audits = async () => (await sys(`select count(*)::int n from audit_events where action='invite_created' and actor_id=$1`, [A])).rows[0].n;
  const token = randomBytes(32).toString('hex');
  const key = uuid7();
  const before = await invites();
  const auditBefore = await audits();
  check('[retry] create_child_invite returns the client key as the invite id', (await mk(A, key, CHILD, 'contributor', hash(token), 'Nani')) === key);
  check('[retry] a replay with the same key returns the same invite', (await mk(A, key, CHILD, 'contributor', hash(token), 'Nani')) === key);
  check('[retry] the replay made no second row and no second audit event', (await invites()) === before + 1 && (await audits()) === auditBefore + 1);
  check('[retry] the server stores only the hash of the client token',
    (await sys(`select encode(token_hash, 'hex') h from child_invites where id=$1`, [key])).rows[0].h === hash(token));
  check('[retry] same key, different role is refused (SCCID)', (await codeOf(() => mk(A, key, CHILD, 'parent', hash(token), 'Nani'))) === 'SCCID');
  check('[retry] same key, different token hash is refused (SCCID)', (await codeOf(() => mk(A, key, CHILD, 'contributor', hash('other'), 'Nani'))) === 'SCCID');
  check('[retry] someone else\'s key is refused (SCCID)', (await codeOf(() => mk(B, key, CHILD, 'contributor', hash(token), 'Nani'))) === 'SCCID');
  check('[retry] a non-v7 invite key is refused (SCCID)', (await codeOf(() => mk(A, '0b2f9e3c-5a7d-4c1e-9f00-123456789abc', CHILD, 'contributor', hash('x1')))) === 'SCCID');
  check('[retry] a token hash that is not 32 bytes is refused (22023)', (await codeOf(() => mk(A, uuid7(), CHILD, 'contributor', 'abcd'))) === '22023');
  check('[retry] a reused token hash under a new key is refused (SCINV)', (await codeOf(() => mk(A, uuid7(), CHILD, 'contributor', hash(token)))) === 'SCINV');
  check('[BL-112] same key, different code hash is refused (SCCID)', (await codeOf(() => mk(A, key, CHILD, 'contributor', hash(token), 'Nani', hash('other-code')))) === 'SCCID');
  check('[BL-112] a code hash that is not 32 bytes is refused (22023)', (await codeOf(() => mk(A, uuid7(), CHILD, 'contributor', hash('x2'), null, 'abcd'))) === '22023');
  check('[BL-112] a reused code under a new key and token is refused (SCINV)',
    (await codeOf(() => mk(A, uuid7(), CHILD, 'contributor', hash('x3'), null, hash(`code:${hash(token)}`)))) === 'SCINV');
  // Rate limit: fill A's 24-hour allowance, then a replay still succeeds and a new invite does not.
  const used = (await sys(`select count(*)::int n from child_invites where invited_by=$1 and created_at > now() - interval '24 hours'`, [A])).rows[0].n;
  for (let i = used; i < 20; i++) await mk(A, uuid7(), CHILD, 'contributor', hash(`fill-${i}`));
  const atLimit = await invites();
  check('[retry] at the daily limit a new invite is refused (SCRAT)', (await codeOf(() => mk(A, uuid7(), CHILD, 'contributor', hash('one-more')))) === 'SCRAT');
  check('[retry] at the daily limit a replay still returns the original invite', (await mk(A, key, CHILD, 'contributor', hash(token), 'Nani')) === key);
  check('[retry] the replay did not count toward the limit (no new row)', (await invites()) === atLimit);
  check('[retry] the invite still works with the client-held token', (await codeOf(() => as(C, `select public.accept_child_invite($1)`, [token]))) === 'ok');
  await sys(`delete from child_invites where invited_by=$1 and accepted_at is null`, [A]);

  const act = (uid, id, action = 'acknowledge', surface = 'auth.sheet') =>
    as(uid, `select public.record_policy_act($1, 'privacy', '1.0.0', $2, 'signin_sheet', $3, '1', 'ios') id`, [id, action, surface]).then((r) => r.rows[0].id);
  const acts = async () => (await sys(`select count(*)::int n from policy_acceptances where profile_id=$1 and document='privacy'`, [A])).rows[0].n;
  const k2 = uuid7();
  const n0 = await acts();
  check('[retry] record_policy_act returns the client key as the row id', (await act(A, k2)) === k2);
  check('[retry] a replay returns the same row and writes nothing new', (await act(A, k2)) === k2 && (await acts()) === n0 + 1);
  check('[retry] same key, different act is refused (SCCID)', (await codeOf(() => act(A, k2, 'decline'))) === 'SCCID'
    && (await codeOf(() => act(A, k2, 'acknowledge', 'settings.privacy'))) === 'SCCID');
  check('[retry] another person replaying the key is refused (SCCID)', (await codeOf(() => act(B, k2))) === 'SCCID');
  check('[retry] a non-v7 act key is refused (SCCID)', (await codeOf(() => act(A, '0b2f9e3c-5a7d-4c1e-9f00-123456789abc'))) === 'SCCID');
  check('[retry] the old signatures are gone (42883)',
    (await codeOf(() => as(A, `select public.create_child_invite($1::uuid, 'contributor'::text, null::text)`, [CHILD]))) === '42883'
    && (await codeOf(() => as(A, `select public.create_child_invite($1::uuid, $2::uuid, 'contributor'::text, sha256('x'::bytea), null::text)`, [uuid7(), CHILD]))) === '42883'
    && (await codeOf(() => as(A, `select public.record_policy_act('privacy', '1.0.0', 'acknowledge', 'signin_sheet', 'auth.sheet', '1', 'ios')`))) === '42883');
}

// ── DB-07 / BL-115 X-12: the consent pepper fails closed and lives in Vault ──
{
  const setPepper = (v) => v === null
    ? sys(`delete from vault.decrypted_secrets where name = 'consent_pepper'`)
    : sys(`insert into vault.decrypted_secrets values ('consent_pepper', $1) on conflict (name) do update set decrypted_secret = excluded.decrypted_secret`, [v]);
  const delC = () => codeOf(() => sys(`delete from auth.users where id=$1`, [C]));
  await setPepper(null);
  check('[DB-07] with no pepper in Vault, deleting a profile raises SCCFG',
    (await delC()) === 'SCCFG' && (await sys(`select 1 from profiles where id=$1`, [C])).rows.length === 1);
  await sys(`select set_config('app.consent_pepper', 'a-database-setting-pepper-0123456789abcdef', false)`);
  check('[BL-115 X-12] a database setting is never used as the pepper', (await delC()) === 'SCCFG');
  await sys(`select set_config('app.consent_pepper', '', false)`);
  await setPepper('');
  check('[BL-115 X-12] an empty pepper is refused (SCCFG)', (await delC()) === 'SCCFG');
  await setPepper('x'.repeat(31));
  check('[BL-115 X-12] a pepper of 31 bytes is refused (SCCFG)', (await delC()) === 'SCCFG');
  await sys(`alter table vault.decrypted_secrets rename to decrypted_secrets_off`);
  check('[BL-115 X-12] without the vault view the lookup fails closed (SCCFG)', (await delC()) === 'SCCFG');
  await sys(`alter table vault.decrypted_secrets_off rename to decrypted_secrets`);
  for (const r of ['anon', 'authenticated', 'service_role']) {
    const g = (await sys(`select has_function_privilege($1, 'public.server_secret(text)', 'execute') a,
                                 has_function_privilege($1, 'public.require_server_secret(text, int)', 'execute') b,
                                 has_function_privilege($1, 'public.invite_code_digest(bytea)', 'execute') c`, [r])).rows[0];
    check(`[BL-115 X-12] ${r} cannot call the secret lookups`, !g.a && !g.b && !g.c);
  }
  await setPepper('test-consent-pepper-0123456789abcdef0123');
  check('[DB-07] with a 32+ byte pepper in Vault, the profile is deleted and acceptances are pseudonymised',
    (await delC()) === 'ok'
    && (await sys(`select count(*)::int n from policy_acceptances where profile_id is null and subject_hash is not null`)).rows[0].n >= 2);
  check('[BL-115 X-12] the subject hash uses the Vault pepper',
    (await sys(`select count(*)::int n from policy_acceptances where subject_hash = sha256(convert_to($1 || 'test-consent-pepper-0123456789abcdef0123', 'UTF8'))`, [C])).rows[0].n >= 2);
}

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
