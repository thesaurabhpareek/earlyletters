// Data governance (20261002020000_data_governance.sql): integrity, tombstones,
// purge, legal holds, book and account deletion, author-only raw transcripts,
// per-child settings, policy acceptances, cross-child isolation.
// Promoted from supabase/tests/drafts/data_governance.test.mjs (TC-01 to TC-13).
// Fictional family "Asha" only (CLAUDE.md). Run all DB tests: npm run test:db
import { createDb, users } from './harness.mjs';

const { check, as, sys, one, fails, done } = await createDb(process.argv.slice(2));
const { A, B, C, N, S } = users;
check(`${process.argv.length - 2} migrations apply cleanly`, true);
await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${S}')`);

const CHILD = (await one(A, `select public.create_child('Asha', '2025-05-20') as id`)).id;
const join = async (uid, role, child = CHILD, inviter = A) => {
  const t = (await one(inviter, `select public.create_child_invite('${child}') as t`)).t;
  if (role === 'contributor') await sys(`update child_invites set role='contributor' where token_hash = sha256(convert_to('${t}','UTF8'))`);
  await as(uid, `select public.accept_child_invite('${t}')`);
};
await join(B, 'parent');
await join(N, 'contributor');
const SOLO = (await one(S, `select public.create_child('Asha', '2025-05-20') as id`)).id;

let seq = 0;
const newEntry = async (author, child = CHILD, inBook = true) => {
  const id = `0192b000-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  await as(author, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book, machine_edits, stt_meta)
    values ('${id}', '${child}', '${author}', 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', 'She walked.', ${inBook}, '[{"type":"filler"}]', '{"engine":"test"}')`);
  return id;
};
const exists = async (table, id) => (await sys(`select 1 from ${table} where id='${id}'`)).rows.length === 1;

// ── TC-01, TC-12, TC-13 Integrity ──────────────────────────────────────────
const e1 = await newEntry(A);
check('raw_sha256 is set by the server', (await sys(`select encode(raw_sha256,'hex') h from entries where id='${e1}'`)).rows[0].h
  === (await sys(`select encode(sha256(convert_to('um she walked','UTF8')),'hex') h`)).rows[0].h);
check('raw_sha256 is immutable', await fails(() => as(A, `update entries set raw_sha256='\\x00' where id='${e1}'`), 'SCIMM'));
check('created_at is immutable', await fails(() => as(A, `update entries set created_at=now()-interval '1 year' where id='${e1}'`), 'SCIMM'));
check('photo path in another family folder is refused', await fails(() => as(A, `update entries set photo_path='${SOLO}/${S}/x.jpg' where id='${e1}'`)));
check('photo path must name its own entry', await fails(() => as(A, `update entries set photo_path='${CHILD}/${A}/other.jpg' where id='${e1}'`)));
await as(A, `update entries set photo_path='${CHILD}/${A}/${e1}.jpg' where id='${e1}'`);
check('photo path {child}/{author}/{entry}.jpg is accepted', (await sys(`select photo_path from entries where id='${e1}'`)).rows[0].photo_path.endsWith(`${e1}.jpg`));
await as(A, `update entries set machine_edits='[]'::jsonb where id='${e1}'`);
check('machine_edits change alone is versioned', (await sys(`select count(*)::int n from entry_versions where entry_id='${e1}' and machine_edits='[{"type":"filler"}]'::jsonb`)).rows[0].n === 1);
check('version records who superseded it', (await sys(`select superseded_by from entry_versions where entry_id='${e1}'`)).rows[0].superseded_by === A);

// ── TC-02 to TC-04 Tombstones ──────────────────────────────────────────────
await as(A, `update entries set deleted_at='2000-01-01' where id='${e1}'`);
const t = (await sys(`select deleted_at > now() - interval '1 minute' as fresh, deleted_reason r from entries where id='${e1}'`)).rows[0];
check('client cannot back-date a tombstone', t.fresh && t.r === 'user');
check('delete is audited without content', (await sys(`select count(*)::int n from audit_events where action='entry_deleted' and subject_id='${e1}'`)).rows[0].n === 1);
check('deleted entry cannot be edited', await fails(() => as(A, `update entries set final_text='x' where id='${e1}'`), 'SCTMB'));
check('client cannot clear deleted_at directly', await fails(() => as(A, `update entries set deleted_at=null where id='${e1}'`), 'SCTMB'));
check('co-parent cannot restore', await fails(() => as(B, `select public.restore_entry('${e1}')`)));
check('co-parent cannot delete another author\'s letter', await fails(() => as(B, `select public.delete_entry('${e1}')`), 'P0002'));
check('author restores via restore_entry', (await one(A, `select public.restore_entry('${e1}') as ok`)).ok === true);
check('restore is idempotent', (await one(A, `select public.restore_entry('${e1}') as ok`)).ok === true);

// ── TC-05, TC-06 Purge after 30 days, legal holds ─────────────────────────
await as(A, `select public.delete_entry('${e1}')`);
await sys(`select public.purge_due(now() + interval '29 days')`);
check('not purged before 30 days', await exists('entries', e1));
await sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by) values ('entry', '${e1}', 'litigation', 'T-1', 'ops', '2027-01-01')`);
await sys(`select public.purge_due(now() + interval '31 days')`);
check('legal hold blocks purge', await exists('entries', e1));
await sys(`update legal_holds set released_at=now(), released_by='ops'`);
const res = (await sys(`select public.purge_due(now() + interval '31 days') r`)).rows[0].r;
check('purged after 30 days', res.entries === 1 && !(await exists('entries', e1)));
check('versions purged with the entry', (await sys(`select 1 from entry_versions where entry_id='${e1}'`)).rows.length === 0);
check('photo queued for Storage API deletion', (await sys(`select 1 from storage_purge_queue where object_path='${CHILD}/${A}/${e1}.jpg'`)).rows.length === 1);
check('purge ledger keeps the id only', (await sys(`select 1 from purge_ledger where entity_type='entry' and entity_id='${e1}'`)).rows.length === 1);
check('users cannot call purge_due', await fails(() => as(A, `select public.purge_due()`)));
check('users cannot read legal holds', (await as(A, 'select * from legal_holds')).rows.length === 0);
check('users cannot read the purge queue or ledger', (await as(A, 'select 1 from storage_purge_queue union all select 1 from purge_ledger')).rows.length === 0);

// ── TC-09, TC-10 Children guard and last parent ───────────────────────────
check('member cannot tombstone the book directly', await fails(() => as(N, `update children set deleted_at=now() where id='${CHILD}'`), 'SCDEL'));
check('contributor cannot delete the book', await fails(() => as(N, `select public.request_book_deletion('${CHILD}', 'ios')`), 'SCDEL'));
check('sole parent cannot simply leave', await fails(() => as(S, `delete from child_members where profile_id='${S}'`), 'SCLPG'));

// ── K-09 Raw transcripts are author-only ──────────────────────────────────
const aBook = await newEntry(A);
const bBook = await newEntry(B);
const nBook = await newEntry(N);
check('author reads own raw transcript, edits and STT metadata',
  (await one(A, `select raw_transcript, machine_edits, stt_meta, raw_sha256 from entries where id='${aBook}'`))?.raw_transcript === 'um she walked');
check('co-parent reads the letter text through book_entries',
  (await one(B, `select final_text from book_entries where id='${aBook}'`))?.final_text === 'She walked.');
check('co-parent gets no row from the entries table', (await as(B, `select 1 from entries where id='${aBook}'`)).rows.length === 0);
for (const col of ['raw_transcript', 'machine_edits', 'stt_meta', 'raw_sha256', 'deleted_reason']) {
  check(`book_entries does not expose ${col}`, await fails(() => as(B, `select ${col} from book_entries`)));
}
check('contributor sees the book through the view only', (await as(N, `select id from book_entries where child_id='${CHILD}'`)).rows.length === 3
  && (await as(N, `select id from entries`)).rows.length === 1);
check('author still sees own private letter in the view', (await as(A, `select 1 from book_entries where id='${await newEntry(A, CHILD, false)}'`)).rows.length === 1);
check('book view search works for co-parents', (await as(B, `select id from book_entries where child_id='${CHILD}' and search @@ plainto_tsquery('simple', 'walked')`)).rows.length === 3);
check('co-parent can read the in-book photo of another author', await (async () => {
  await as(A, `update entries set photo_path='${CHILD}/${A}/${aBook}.jpg' where id='${aBook}'`);
  await as(A, `insert into storage.objects (bucket_id, name) values ('entry-photos', '${CHILD}/${A}/${aBook}.jpg')`);
  return (await as(B, `select name from storage.objects`)).rows.length === 1;
})());

// ── PRD-REQ-014 Cross-child isolation ─────────────────────────────────────
const sBook = await newEntry(S, SOLO);
await as(S, `update entries set photo_path='${SOLO}/${S}/${sBook}.jpg' where id='${sBook}'`);
await as(S, `insert into storage.objects (bucket_id, name) values ('entry-photos', '${SOLO}/${S}/${sBook}.jpg')`);
const leak = async (uid) => (await as(uid, `
  select 'entry' from book_entries where child_id='${SOLO}'
  union all select 'raw' from entries where child_id='${SOLO}'
  union all select 'child' from children where id='${SOLO}'
  union all select 'member' from child_members where child_id='${SOLO}'
  union all select 'prefs' from child_member_prefs where child_id='${SOLO}'
  union all select 'photo' from storage.objects where name like '${SOLO}/%'`)).rows.length;
check('no member of Asha\'s first book can see anything of another book', (await leak(A)) + (await leak(B)) + (await leak(N)) + (await leak(C)) === 0);
check('cannot write a letter into a book you do not belong to', await fails(() => newEntry(B, SOLO)));

// ── K-12 Per-child settings ───────────────────────────────────────────────
await as(B, `insert into child_member_prefs (child_id, profile_id, signs_as, celebrations_paused) values ('${CHILD}', '${B}', 'Mumma', true)`);
check('member sets own per-child prefs', (await one(B, `select signs_as from child_member_prefs where child_id='${CHILD}'`)).signs_as === 'Mumma');
check('other members cannot read someone\'s prefs', (await as(A, `select 1 from child_member_prefs where profile_id='${B}'`)).rows.length === 0);
check('cannot write prefs for someone else', await fails(() => as(A, `insert into child_member_prefs (child_id, profile_id) values ('${CHILD}', '${N}')`)));
check('cannot write prefs for a book you do not belong to', await fails(() => as(B, `insert into child_member_prefs (child_id, profile_id) values ('${SOLO}', '${B}')`)));
await as(B, `update children set family_can_read=true, nickname='Ashu', due_date=null where id='${CHILD}'`);
check('parent changes shared book settings', (await sys(`select family_can_read from children where id='${CHILD}'`)).rows[0].family_can_read === true);
check('contributor cannot change book settings', await fails(() => as(N, `update children set name='X' where id='${CHILD}'`), 'SCPAR'));
check('parent sets auto-add for a family member', (await one(A, `select public.set_member_auto_add('${CHILD}', '${N}', true) as ok`)).ok === true
  && (await sys(`select auto_add_letters from child_members where profile_id='${N}'`)).rows[0].auto_add_letters === true);
check('contributor cannot set auto-add', await fails(() => as(N, `select public.set_member_auto_add('${CHILD}', '${N}', false)`), 'SCPAR'));
check('child photo path must sit in the child folder', await fails(() => as(A, `update children set photo_path='${SOLO}/0192b000-0000-7000-8000-000000000999.jpg' where id='${CHILD}'`)));

// ── Policy acceptances (POLICY_VERSIONING.md 7.2) ─────────────────────────
await sys(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at, content_sha256, url, summary)
  values ('terms', '1.0.0', 'initial', false, now() - interval '1 day', now() - interval '1 day', now() - interval '1 day', sha256('t'::bytea), 'https://example.invalid/terms/1.0.0', 'First version')`);
check('a new user is asked to accept the Terms', (await as(B, `select document from policy_actions_needed()`)).rows.some((r) => r.document === 'terms'));
const actA = (await one(A, `select public.record_policy_act('terms', '1.0.0', 'accept', 'signin_sheet', 'auth.sheet', '1.0.0', 'ios', 'en-US') as id`)).id;
await as(B, `select public.record_policy_act('terms', '1.0.0', 'accept', 'signin_sheet', 'auth.sheet', '1.0.0', 'ios')`);
const accepted = await one(A, `select document, version, accepted_at, profile_id from policy_acceptances where id='${actA}'`);
check('acceptance records policy, version, accepted_at and user', accepted.document === 'terms' && accepted.version === '1.0.0' && accepted.accepted_at && accepted.profile_id === A);
check('my_policy_state shows the current act', (await one(A, `select action from my_policy_state where document='terms'`)).action === 'accept');
check('users cannot read others\' acceptances', (await as(B, `select 1 from policy_acceptances where profile_id='${A}'`)).rows.length === 0);
check('clients cannot insert acceptances directly', await fails(() => as(A, `insert into policy_acceptances (profile_id, document, version, action, method, surface, app_version, platform) values ('${A}', 'terms', '1.0.0', 'accept', 'signin_sheet', 'x', '1', 'ios')`)));
check('acceptances are append-only, even for the service role', await fails(() => sys(`update policy_acceptances set action='decline' where id='${actA}'`)));
check('unknown versions are refused', await fails(() => as(A, `select public.record_policy_act('terms', '9.9.9', 'accept', 'signin_sheet', 'auth.sheet', '1.0.0', 'ios')`)));
check('anonymous visitors cannot record acts', !(await sys(`select has_function_privilege('anon', 'public.record_policy_act(text,text,text,text,text,text,text,text,timestamptz,bytea,jsonb)', 'execute') ok`)).rows[0].ok);

// ── TC-08 Delete book with a co-parent = remove own letters and leave ─────
const BOOK2 = (await one(B, `select public.create_child('Asha', '2025-05-20') as id`)).id;
await join(A, 'parent', BOOK2, B);
const a2 = await newEntry(A, BOOK2); const b2 = await newEntry(B, BOOK2);
check('with a co-parent, delete = leave and remove own letters',
  (await one(A, `select public.request_book_deletion('${BOOK2}', 'ios') as m`)).m === 'left_and_removed_own_letters');
check('co-parent letters untouched', (await sys(`select deleted_at is null as live from entries where id='${b2}'`)).rows[0].live);
check('leaver letter tombstoned', (await sys(`select deleted_reason r from entries where id='${a2}'`)).rows[0].r === 'book_deletion');
check('leaver can still read own letter', (await as(A, `select id from entries where id='${a2}'`)).rows.length === 1);
check('leaving is audited', (await sys(`select count(*)::int n from audit_events where action='left_book' and child_id='${BOOK2}'`)).rows[0].n === 1);

// ── TC-07, TC-11 Creator account deletion keeps the shared book ───────────
await as(B, `update entries set final_text='She walked to me.' where id='${bBook}'`);
const req = await one(A, `select * from public.request_account_deletion('ios', false)`);
check('account deletion is scheduled 30 days out', (await sys(`select scheduled_for > now() + interval '29 days' as ok from deletion_requests where id='${req.request_id}'`)).rows[0].ok);
check('request is idempotent', (await one(A, `select request_id from public.request_account_deletion('ios', false)`)).request_id === req.request_id);
check('own letters leave the co-parent view during grace', (await as(B, `select 1 from book_entries where id='${aBook}'`)).rows.length === 0);
check('the shared book is not scheduled for deletion', (await sys(`select deleted_at is null as live from children where id='${CHILD}'`)).rows[0].live);
check('cancel restores', (await one(A, `select public.cancel_account_deletion() as ok`)).ok === true
  && (await as(B, `select 1 from book_entries where id='${aBook}'`)).rows.length === 1);
await as(A, `select * from public.request_account_deletion('ios', true)`);
const r2 = (await sys(`select id from deletion_requests where kind='account' and status='scheduled' and profile_id='${A}'`)).rows[0].id;
await sys(`select public.purge_due(now() + interval '31 days')`);
check('due request moves to executing', (await sys(`select status from deletion_requests where id='${r2}'`)).rows[0].status === 'executing');
const prep = (await sys(`select public.prepare_account_purge('${r2}') r`)).rows[0].r;
check('prepare removes only the leaver\'s letters and no shared book', prep.books === 0 && !(await exists('entries', aBook)));
check('the leaver\'s photo folder is queued, not the whole book', (await sys(`select object_path from storage_purge_queue where request_id='${r2}'`)).rows.every((r) => r.object_path.endsWith(`/${A}/`)));
await sys(`delete from auth.users where id='${A}'`);
await sys(`select public.finalize_account_deletion('${r2}', '{"entries":1}'::jsonb)`);
check('book survives creator deletion', (await sys(`select created_by from children where id='${CHILD}'`)).rows[0]?.created_by === null);
check("co-parent's letter survives", await exists('entries', bBook));
check("family member's letter survives", await exists('entries', nBook));
check("co-parent's version history survives", (await sys(`select count(*)::int n from entry_versions where entry_id='${bBook}'`)).rows[0].n === 1);
check('co-parent is still a parent and reads the book', (await sys(`select role from child_members where child_id='${CHILD}' and profile_id='${B}'`)).rows[0]?.role === 'parent'
  && (await as(B, `select id from book_entries where child_id='${CHILD}'`)).rows.length === 2);
check('book created by the leaver with a co-parent also survives', await exists('children', BOOK2) && await exists('entries', b2));
check('audit is pseudonymised', (await sys(`select count(*)::int n from audit_events where actor_id='${A}' or subject_id='${A}'`)).rows[0].n === 0);
check('request completed and unlinked', (await sys(`select status, profile_id from deletion_requests where id='${r2}'`)).rows[0].profile_id === null);
const pa = (await sys(`select profile_id, subject_hash is not null as hashed, pseudonymised_at is not null as dated from policy_acceptances where id='${actA}'`)).rows[0];
check('policy acceptances are pseudonymised, not deleted', pa.profile_id === null && pa.hashed && pa.dated);

// ── Another member's account deletion (contributor) ───────────────────────
const nReq = (await one(N, `select * from public.request_account_deletion('ios', false)`)).request_id;
await sys(`select public.purge_due(now() + interval '31 days')`);
await sys(`select public.prepare_account_purge('${nReq}')`);
await sys(`delete from auth.users where id='${N}'`);
await sys(`select public.finalize_account_deletion('${nReq}', '{}'::jsonb)`);
check("contributor's deletion removes only their letters", !(await exists('entries', nBook)) && await exists('entries', bBook) && await exists('children', CHILD));

// ── Sole parent book deletion ─────────────────────────────────────────────
await join(C, 'contributor', SOLO, S);
check('contributor reads the solo book while live', (await as(C, `select 1 from book_entries where child_id='${SOLO}'`)).rows.length === 1);
check('sole parent schedules book deletion', (await one(S, `select public.request_book_deletion('${SOLO}', 'ios') as m`)).m === 'book_scheduled');
check('a book being deleted leaves members\' view', (await as(C, `select 1 from book_entries where child_id='${SOLO}'`)).rows.length === 0);
check('sole parent can cancel', (await one(S, `select public.cancel_book_deletion('${SOLO}') as ok`)).ok === true);
await as(S, `select public.request_book_deletion('${SOLO}', 'ios')`);
await sys(`select public.purge_due(now() + interval '31 days')`);
check('book purged after 30 days', !(await exists('children', SOLO)) && !(await exists('entries', sBook)));
check('whole book folder queued for Storage deletion', (await sys(`select 1 from storage_purge_queue where object_path='${SOLO}/' and is_prefix`)).rows.length === 1);

// ── Short-lived records ───────────────────────────────────────────────────
check('safety_events no longer exists (PRD K-06)', (await sys(`select to_regclass('public.safety_events') r`)).rows[0].r === null);
await sys(`select public.purge_due(now() + interval '3 years 1 day')`);
check('pseudonymised acceptances are deleted after 3 years', (await sys(`select 1 from policy_acceptances where id='${actA}'`)).rows.length === 0);
check('live acceptances are kept', (await sys(`select count(*)::int n from policy_acceptances where profile_id='${B}'`)).rows[0].n === 1);
check('retention purge does not open the append-only guard afterwards', await fails(() => sys(`delete from policy_acceptances`)));

done();
