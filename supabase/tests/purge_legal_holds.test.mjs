// Legal holds stop the account purge for every row it would touch (20261023020000; review A N5 on
// #248; DATA-REQ-035; data-policy.md section 7). Before this file prepare_account_purge checked holds
// only on the deleting person's own letters and held drafts, so a book deleted with the account was
// purged even under a hold, with a family member's held letter in it: purge_due skipped the book on
// day 30 and the worker's prepare deleted it in the same hour. The rule is the one the existing checks
// use: a row is held when a hold names its own id, its person or its book; a held account request
// changes nothing, is set to 'held' and answers {"held": true}; a held book is skipped by purge_due
// and the rest proceeds. Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const { check, as, sys, one, done, publishPolicies, consent, newChild, join } = await createDb(process.argv.slice(2));
const { A, B, C, N, S } = users;
// More parents, one account request each (fictional).
const P1 = '91111111-1111-4111-8111-111111111111';
const P2 = '92222222-2222-4222-8222-222222222222';
const P3 = '93333333-3333-4333-8333-333333333333';
const P4 = '94444444-4444-4444-8444-444444444444';
const P5 = '95555555-5555-4555-8555-555555555555';
const P6 = '96666666-6666-4666-8666-666666666666';
const P7 = '97777777-7777-4777-8777-777777777777';
const P8 = '98888888-8888-4888-8888-888888888888';
const P9 = '99999999-9999-4999-8999-999999999999';
const Q1 = 'a1111111-1111-4111-8111-111111111111';
const Q2 = 'a2222222-2222-4222-8222-222222222222';
const Q3 = 'a3333333-3333-4333-8333-333333333333';
const Q4 = 'a4444444-4444-4444-8444-444444444444';
const Q5 = 'a5555555-5555-4555-8555-555555555555';
const R1 = 'a6666666-6666-4666-8666-666666666666';
const R2 = 'a7777777-7777-4777-8777-777777777777';
const R3 = 'a8888888-8888-4888-8888-888888888888';
const R4 = 'a9999999-9999-4999-8999-999999999999';
const everyone = [A, B, C, N, S, P1, P2, P3, P4, P5, P6, P7, P8, P9, Q1, Q2, Q3, Q4, Q5, R1, R2, R3, R4];
const hex = (byte, n) => Buffer.from(byte.repeat(n), 'hex');
const boxOf = (b) => JSON.stringify({ suite: 'hpke-x25519-sha256-aes256gcm', enc: Buffer.from(b.repeat(32), 'hex').toString('base64'),
  ct: Buffer.from(b.repeat(48), 'hex').toString('base64') });
// Supabase's storage.objects has owner columns; the harness stub does not (as in former_member_purge).
await sys(`alter table storage.objects add column owner uuid, add column owner_id text, add column created_at timestamptz not null default now(),
  add column metadata jsonb`);
await sys(`insert into auth.users select unnest($1::uuid[])`, [everyone]);
await publishPolicies();
await sys(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at,
             content_sha256, url, summary)
           values ('backup', '1.0.0', 'initial', false, now() - interval '2 days', now() - interval '2 days', now() - interval '2 days',
             sha256('backup'::bytea), 'https://example.invalid/backup/1.0.0', 'First version')`);
for (const u of everyone) {
  await consent(u);
  await as(u, `select public.record_policy_act('backup', '1.0.0', 'accept', 'consent_sheet', 'backup.sheet', '1.0.0', 'ios')`);
}
await sys(`set app.backup_enabled = 'on'`);

let seq = 0;
// A letter with a photo (row and object, as the app uploads it).
const letter = async (author, child, text = 'Asha laughed.') => {
  const id = `0192e500-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  const photo = `${child}/${author}/${id}.jpg`;
  await sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book, photo_path)
    values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um ' || $4, $4, true, $5)`, [id, child, author, text, photo]);
  await sys(`insert into storage.objects (bucket_id, name, owner, owner_id) values ('entry-photos', $1, $2::uuid, $2)`, [photo, author]);
  return { id, photo };
};
// An object with no row (a crash path, or an upload whose letter never synced).
const orphanObject = async (bucket, name, owner) =>
  sys(`insert into storage.objects (bucket_id, name, owner, owner_id) values ($1, $2, $3::uuid, $3)`, [bucket, name, owner]);
// A recording backup row whose letter is gone (backup_svc_sweep keeps a held one; audio_backup_purge).
const orphanBackup = async (author, child) => {
  const id = uuid7();
  await sys(`insert into audio_blobs (entry_id, child_id, author_id, object_path, key_version, wrapped_file_key, bytes, created_at)
    values ($1, $2, $3, $4, 1, $5::bytea, 10, now() - interval '2 days')`, [id, child, author, `${child}/${author}/${id}.m4a.enc`, hex('dd', 60)]);
  return id;
};
const heldDraft = async (author, child, words = 'You smiled at the rain.') => {
  const id = uuid7();
  await as(author, `insert into held_drafts (id, author_id, child_id, kind, capture_mode, created_at, occurred_on, typed_text)
    values ($1, $2, $3, 'held_letter', 'typed', now(), '2026-09-29', $4)`, [id, author, child, words]);
  return id;
};
const storeKey = (u, child, b) => as(u, `select public.backup_store_key($1, 1, 1, $2::jsonb)`, [child, boxOf(b)]);
const queuedUnder = async (prefix) => (await sys(`select count(*)::int n from storage_purge_queue where object_path like $1 || '%'`, [prefix])).rows[0].n;
const n = async (sql, params) => (await sys(`select count(*)::int n from ${sql}`, params)).rows[0].n;
const hold = (scope, id, ref) => sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by)
  values ($1, $2, 'litigation', $3, 'ops', '2027-01-01')`, [scope, id, ref]);
const release = (id) => sys(`update legal_holds set released_at = now(), released_by = 'ops' where scope_id = $1 and released_at is null`, [id]);
const status = async (req) => (await sys(`select status from deletion_requests where id = $1`, [req])).rows[0]?.status;
const executing = (req) => sys(`update deletion_requests set status = 'executing', executing_at = now() where id = $1`, [req]);
const prepare = async (req) => (await sys(`select public.prepare_account_purge($1) r`, [req])).rows[0].r;
const purgeDue = async (days) => (await sys(`select public.purge_due(now() + make_interval(days => $1)) r`, [days])).rows[0].r;
const overdue = async () => (await sys(`select public.ops_deletion_sla(now() + interval '40 days') r`)).rows[0].r.tombstones_overdue;
const requestFor = async (u) => (await one(u, `select request_id from public.request_account_deletion('ios')`)).request_id;
const book = async (id) => (await sys(`select deleted_at is not null tombstoned, purged_at is not null kept, deletion_request_id
  from children where id = $1`, [id])).rows[0];
const ledger = async (type, id) => (await sys(`select 1 from purge_ledger where entity_type = $1 and entity_id = $2`, [type, id])).rows.length === 1;
// Every table a purge writes to, counted, so "nothing changed" means nothing anywhere.
const fingerprint = async () => JSON.stringify((await sys(`select
    (select count(*) from children) children, (select count(*) from children where deleted_at is not null) tombstoned,
    (select count(*) from entries) entries, (select count(*) from held_drafts) held, (select count(*) from audio_blobs) blobs,
    (select count(*) from child_keys) keys, (select count(*) from child_members) members, (select count(*) from dictionary_terms) terms,
    (select count(*) from storage_purge_queue) queued, (select count(*) from purge_ledger) ledgered, (select count(*) from storage.objects) objects`)).rows[0]);
const heldPrepare = async (req) => {
  const before = await fingerprint();
  const p = await prepare(req);
  return p.held === true && Object.keys(p).length === 1 && await status(req) === 'held' && await fingerprint() === before;
};

// ── 1. Review A N5 (a): a book under hold, deleted with its sole parent's account ──
// The parent has no letter in it, so the old check (their own rows only) found nothing.
const H1 = await newChild(S, 'Asha', '2025-05-01');
await join(N, 'contributor', H1, S);
const n1 = await letter(N, H1, 'Asha clapped for Nani.');
await hold('child', H1, 'T-H1');
const r1 = await requestFor(S);
check('the sole parent\'s book is tombstoned with their request', (await book(H1))?.deletion_request_id === r1);
let res = await purgeDue(31);
check('day 30: purge_due skips the held book, as before, and hands the request to the worker',
  res.books === 0 && (await book(H1))?.tombstoned === true && await status(r1) === 'executing');
check('[DATA-REQ-035] prepare_account_purge holds the request: it answers held, the request is held, and nothing changes anywhere',
  await heldPrepare(r1));
check('[DATA-REQ-035, DATA-REQ-014] the held book, Nani\'s letter and its photo are still there; no child or entry ledger row',
  !!(await book(H1)) && await n(`entries where id = $1`, [n1.id]) === 1 && await n(`storage.objects where name = $1`, [n1.photo]) === 1
  && !(await ledger('child', H1)) && !(await ledger('entry', n1.id)));
check('nothing is queued for the held request', await n(`storage_purge_queue where request_id = $1`, [r1]) === 0);
check('the held book is not an overdue tombstone', (await sys(`select public.ops_deletion_sla(now() + interval '40 days') r`)).rows[0].r.tombstones_overdue === 0);
res = await purgeDue(32);
check('each run hands a request held by a book back to the worker (no hold on the person), and it is held again',
  res.books === 0 && await status(r1) === 'executing' && await heldPrepare(r1));
await release(H1);
res = await purgeDue(33);
check('[DATA-REQ-035] once the hold is released, the next run purges the book (Nani was offered a copy) and executes the request',
  res.books === 1 && !(await book(H1)) && await n(`entries where id = $1`, [n1.id]) === 0 && await status(r1) === 'executing');
const p1 = await prepare(r1);
check('and prepare runs normally', p1.held !== true && p1.books === 0 && await status(r1) === 'executing');

// ── 2. Review A N5 (b): a family member's held letter in the sole parent's book ──
const H2 = await newChild(A, 'Asha', '2025-07-01');
await join(N, 'contributor', H2, A);
const n2 = await letter(N, H2, 'Asha found a snail.');
const n2b = await letter(N, H2, 'Asha fed the ducks.');
await hold('entry', n2.id, 'T-H2');
const r2 = await requestFor(A);
res = await purgeDue(31);
check('day 30: purge_due skips the book that holds a held letter, as before', res.books === 0 && (await book(H2))?.tombstoned === true
  && await status(r2) === 'executing');
check('[DATA-REQ-035] prepare_account_purge holds the request, and nothing changes anywhere', await heldPrepare(r2));
check('[DATA-REQ-012] the held letter of the family member is still there, and so is their other letter and the book',
  await n(`entries where id = any($1::uuid[])`, [[n2.id, n2b.id]]) === 2 && !!(await book(H2)));
// ops_deletion_sla counts a tombstone purge_due is skipping for a hold as held, not overdue (a held letter
// was already not overdue): the count goes up by one only when the hold lifts.
const withHold = await overdue();
await release(n2.id);
check('[ops_deletion_sla] a book purge_due skips for a held letter in it is not an overdue tombstone; released, it is',
  await overdue() === withHold + 1);
// The same for a hold on the family member's account.
await hold('profile', N, 'T-N');
await executing(r2);
check('a hold on the family member\'s account holds it too', await heldPrepare(r2)
  && await n(`entries where id = any($1::uuid[])`, [[n2.id, n2b.id]]) === 2);
await release(N);
res = await purgeDue(31);
check('released: the book goes with the family member\'s letters, as before', res.books === 1 && !(await book(H2))
  && await n(`entries where id = any($1::uuid[])`, [[n2.id, n2b.id]]) === 0 && await status(r2) === 'executing');
check('and prepare runs normally', (await prepare(r2)).held !== true);

// ── 3. A book that became the person's alone during the grace period ──
// prepare_account_purge tombstones it itself; under a hold it must not even do that.
const H3 = await newChild(C, 'Asha', '2025-08-01');
await join(B, 'parent', H3, C);
await join(N, 'contributor', H3, C);
const n3 = await letter(N, H3, 'Asha said moon.');
const r3 = await requestFor(C);
check('at the request the book has two parents, so it is not deleted with the account', (await book(H3))?.tombstoned === false);
check('the co-parent leaves during the grace period', (await one(B, `select public.leave_child($1, true) r`, [H3])).r === 'left');
await hold('child', H3, 'T-H3');
await executing(r3);
check('[DATA-REQ-035] the request is held and the book is not even tombstoned: it stays live, unlinked',
  await heldPrepare(r3) && (await book(H3))?.tombstoned === false && (await book(H3))?.deletion_request_id === null
  && await n(`entries where id = $1`, [n3.id]) === 1);
await release(H3);
await executing(r3);
const p3 = await prepare(r3);
check('released: the book is deleted with the account, as before', p3.held !== true && p3.books === 1 && !(await book(H3))
  && await n(`entries where id = $1`, [n3.id]) === 0);

// ── 4. A kept book (#248): a held current family member's letter ──
// purge_book_keep_authors deletes the current members' rows and keeps the former member's.
const K = await newChild(P1, 'Asha', '2025-09-01');
await join(P2, 'parent', K, P1);
await join(N, 'contributor', K, P1);
const k2 = await letter(P2, K, 'Asha took three steps.');
const kn = await letter(N, K, 'Asha sang for Nani.');
await storeKey(P2, K, 'ee');
check('the co-parent leaves, keeping their letters in the book', (await one(P2, `select public.leave_child($1, true) r`, [K])).r === 'left');
const r4 = await requestFor(P1);
await hold('entry', kn.id, 'T-K');
res = await purgeDue(31);
check('day 30: purge_due skips the book, as before', res.books === 0 && res.books_kept === 0 && (await book(K))?.kept === false);
check('[DATA-REQ-035] prepare_account_purge holds the request; the held letter and the former member\'s letter stay',
  await heldPrepare(r4) && await n(`entries where id = any($1::uuid[])`, [[k2.id, kn.id]]) === 2 && (await book(K))?.kept === false);
await release(kn.id);
res = await purgeDue(31);
check('released: the book is purged for its members and kept for the former co-parent, exactly as #248 does',
  res.books === 1 && res.books_kept === 1 && (await book(K))?.kept === true
  && await n(`entries where id = $1 and author_id = $2`, [k2.id, P2]) === 1 && await n(`entries where id = $1`, [kn.id]) === 0);
check('and prepare runs normally', (await prepare(r4)).held !== true && (await book(K))?.kept === true);
// Step 2b removes the kept row once nothing of the former co-parent's letters is left; it deletes their
// book key and folder with it, so a hold on them keeps the row until it lifts.
await as(P2, `select sync_private.erase_entry($1)`, [k2.id]);
await hold('profile', P2, 'T-P2');
res = await purgeDue(32);
check('[DATA-REQ-035] step 2b keeps an emptied kept book while its former member is under a hold (their book key is in it)',
  res.kept_removed === 0 && (await book(K))?.kept === true && await n(`child_keys where child_id = $1 and profile_id = $2`, [K, P2]) === 1);
await release(P2);
res = await purgeDue(32);
check('released: the next run removes it, as #248 does', res.kept_removed === 1 && !(await book(K)));

// ── 4b. A kept book: a hold on the former member's rows does not hold the account purge (review A N2 on #251) ──
// purge_book_keep_authors never deletes them, so only a hold on the book or on a current member's row holds it.
const K2 = await newChild(P9, 'Asha', '2025-09-15');
await join(Q1, 'parent', K2, P9);
await join(N, 'contributor', K2, P9);
await storeKey(Q1, K2, 'ff');
const q1 = await letter(Q1, K2, 'Asha counted to five.');
const q1Held = await heldDraft(Q1, K2);
const q1Blob = await orphanBackup(Q1, K2);
const qn = await letter(N, K2, 'Asha hugged Nani.');
// Holds on the former co-parent (their account: letter, draft, backup, key and folder) and on their letter.
await hold('profile', Q1, 'T-Q1');
await hold('entry', q1.id, 'T-Q1L');
check('the co-parent leaves, keeping their letter, held draft and backup', (await one(Q1, `select public.leave_child($1, true) r`, [K2])).r === 'left'
  && await n(`held_drafts where id = $1`, [q1Held]) === 1);
await hold('entry', qn.id, 'T-K2N');
const r7 = await requestFor(P9);
await executing(r7);
check('[DATA-REQ-035] a hold on a current family member\'s letter in a kept book holds the account purge', await heldPrepare(r7));
await release(qn.id);
await executing(r7);
const p7 = await prepare(r7);
check('[review A N2] holds on the former co-parent and their letter alone do not: the purge proceeds and the book is kept for them, as on develop',
  p7.held !== true && p7.books === 1 && p7.books_kept === 1 && (await book(K2))?.kept === true && await n(`entries where id = $1`, [qn.id]) === 0);
check('[DATA-REQ-035] and every held row of theirs stays: letter, photo, held draft, backup and book key',
  await n(`entries where id = $1 and author_id = $2`, [q1.id, Q1]) === 1 && await n(`storage.objects where name = $1`, [q1.photo]) === 1
  && await n(`held_drafts where id = $1`, [q1Held]) === 1 && await n(`audio_blobs where entry_id = $1`, [q1Blob]) === 1
  && await n(`child_keys where child_id = $1 and profile_id = $2`, [K2, Q1]) === 1 && await queuedUnder(`${K2}/${Q1}/`) === 0);
for (const id of [Q1, q1.id]) await release(id);

// ── 4c. The same rule on day 30 (purge_due step 1) ──
// A book the sole parent deleted, with a former co-parent's letter and a current family member's letter.
const K3 = await newChild(R1, 'Asha', '2025-09-20');
await join(R2, 'parent', K3, R1);
await join(N, 'contributor', K3, R1);
const r2l = await letter(R2, K3, 'Asha jumped in a puddle.');
const rnl = await letter(N, K3, 'Asha painted a sun.');
check('the co-parent leaves, keeping their letter', (await one(R2, `select public.leave_child($1, true) r`, [K3])).r === 'left');
check('the remaining parent deletes the book', (await one(R1, `select public.request_book_deletion($1, 'ios') r`, [K3])).r === 'book_scheduled');
await hold('entry', rnl.id, 'T-K3N');
res = await purgeDue(31);
check('[DATA-REQ-035] day 30 skips the book while a current family member\'s letter in it is held', res.books === 0
  && (await book(K3))?.kept === false && await n(`entries where id = any($1::uuid[])`, [[r2l.id, rnl.id]]) === 2);
await release(rnl.id);
const k3Overdue = await overdue();
await hold('entry', r2l.id, 'T-K3R');
check('[ops_deletion_sla] by the same rule, that hold does not make the book a held tombstone', await overdue() === k3Overdue);
res = await purgeDue(31);
check('[review A N2] a hold on the former co-parent\'s letter alone does not: the book is purged for everyone else and kept, and the held letter stays',
  res.books === 1 && res.books_kept === 1 && (await book(K3))?.kept === true
  && await n(`entries where id = $1 and author_id = $2`, [r2l.id, R2]) === 1 && await n(`entries where id = $1`, [rnl.id]) === 0);
await release(r2l.id);

// ── 4d. The book photo a held former co-parent uploaded (review A re-check on #251, probe PF) ──
// A kept book's own photo folder (child-photos/{book}/) is queued whole, so the photo Storage records as
// theirs goes with the book unless the hold on them holds the purge.
const K4 = await newChild(R4, 'Asha', '2025-09-25');
await join(R3, 'parent', K4, R4);
const r3l = await letter(R3, K4, 'Asha blew a kiss.');
const k4Photo = `${K4}/${uuid7()}.jpg`;
await orphanObject('child-photos', k4Photo, R3);
await sys(`update children set photo_path = $2 where id = $1`, [K4, k4Photo]);
check('the co-parent who uploaded the book photo leaves, keeping their letter', (await one(R3, `select public.leave_child($1, true) r`, [K4])).r === 'left');
check('the remaining parent deletes the book', (await one(R4, `select public.request_book_deletion($1, 'ios') r`, [K4])).r === 'book_scheduled');
const photoFolderQueued = async (child) => n(`storage_purge_queue where bucket_id = 'child-photos' and object_path = $1 and is_prefix`, [`${child}/`]);
await hold('profile', R3, 'T-K4');
res = await purgeDue(31);
check('[DATA-REQ-035] day 30 skips a kept book whose photo was uploaded by a former co-parent under a hold, and queues nothing',
  res.books === 0 && (await book(K4))?.kept === false && await photoFolderQueued(K4) === 0
  && await n(`storage.objects where name = $1`, [k4Photo]) === 1);
await release(R3);
res = await purgeDue(31);
check('with no hold it is purged and kept for them as before, its photo folder queued and their letter kept',
  res.books === 1 && res.books_kept === 1 && (await book(K4))?.kept === true && await photoFolderQueued(K4) === 1
  && await n(`entries where id = $1 and author_id = $2`, [r3l.id, R3]) === 1);

// ── 5. The person's own rows in a book that survives them ──
// A co-parent with no letter in a held book: their book key, an object in their folder there, and the
// book photo they uploaded are rows the account purge deletes (the key by cascade, the objects through
// the worker's queue and its ownership sweep), so each one alone holds the request.
const X = await newChild(P3, 'Asha', '2025-10-01');
await join(P4, 'parent', X, P3);
await storeKey(P3, X, 'aa');
await hold('child', X, 'T-X');
const r5 = await requestFor(P3);
await executing(r5);
check('[DATA-REQ-035] their book key in a held book holds the request (as it holds "Delete the backup")', await heldPrepare(r5));
await sys(`delete from child_keys where child_id = $1 and profile_id = $2`, [X, P3]);
// No owner recorded: the worker's queue reaches it by its folder, not by ownership.
const xOrphan = `${X}/${P3}/${uuid7()}.jpg`;
await orphanObject('entry-photos', xOrphan, null);
await executing(r5);
check('[DATA-REQ-035] so does an object in their folder of a held book, with no row', await heldPrepare(r5));
await sys(`delete from storage.objects where name = $1`, [xOrphan]);
const xPhoto = `${X}/${uuid7()}.jpg`;
await orphanObject('child-photos', xPhoto, P3);
await executing(r5);
check('[DATA-REQ-035] and a book photo they uploaded to a held book (the ownership sweep moves or deletes it)', await heldPrepare(r5));
await sys(`delete from storage.objects where name = $1`, [xPhoto]);
await executing(r5);
const p5 = await prepare(r5);
check('with nothing of theirs in the held book, the account purge proceeds and the held book stays with its other parent',
  p5.held !== true && p5.books === 0 && (await book(X))?.tombstoned === false
  && await n(`child_members where child_id = $1 and profile_id = $2`, [X, P4]) === 1);
// A recording backup of theirs under a hold, in a book with no hold (the backup's own rule: backup_row_held).
const Y = await newChild(P5, 'Asha', '2025-10-02');
await join(P4, 'parent', Y, P5);
await storeKey(P5, Y, 'bb');
const yBlob = await orphanBackup(P5, Y);
await hold('entry', yBlob, 'T-Y');
const r6 = await requestFor(P5);
await executing(r6);
check('[DATA-REQ-035] a held recording backup of theirs holds the request', await heldPrepare(r6) && await n(`audio_blobs where entry_id = $1`, [yBlob]) === 1);
await release(yBlob);
await executing(r6);
check('released, prepare runs normally', (await prepare(r6)).held !== true);

// ── 6. purge_due: the same rule for every row of a book purged on day 30 ──
// Rows a held letter or held draft did not already cover: a recording backup with no letter, a book key,
// and an object in a person's folder.
const Z1 = await newChild(P6, 'Asha', '2025-11-01');
await storeKey(P6, Z1, 'cc');
const z1Blob = await orphanBackup(P6, Z1);
await hold('entry', z1Blob, 'T-Z1');
const Z2 = await newChild(P7, 'Asha', '2025-11-02');
await storeKey(P7, Z2, 'dd');
await hold('profile', P7, 'T-Z2');
const Z3 = await newChild(P8, 'Asha', '2025-11-03');
await join(N, 'contributor', Z3, P8);
const z3Orphan = `${Z3}/${N}/${uuid7()}.jpg`;
await orphanObject('entry-photos', z3Orphan, N);
for (const [u, z] of [[P6, Z1], [P7, Z2], [P8, Z3]]) await one(u, `select public.request_book_deletion($1, 'ios') r`, [z]);
await hold('profile', N, 'T-Z3');
const before6 = await overdue();
res = await purgeDue(31);
check('[DATA-REQ-035] day 30 skips a book with a held recording backup, a held person\'s book key, or a held person\'s object',
  res.books === 0 && !!(await book(Z1)) && !!(await book(Z2)) && !!(await book(Z3))
  && await n(`audio_blobs where entry_id = $1`, [z1Blob]) === 1 && await n(`child_keys where child_id = $1`, [Z2]) === 1
  && await n(`storage_purge_queue where object_path = any($1::text[])`, [[`${Z1}/`, `${Z2}/`, `${Z3}/`]]) === 0);
check('[ops_deletion_sla] none of them is an overdue tombstone while held', await overdue() === before6);
for (const id of [z1Blob, P7, N]) await release(id);
check('[ops_deletion_sla] released, all three are', await overdue() === before6 + 3);
res = await purgeDue(31);
check('released: the next run purges all three, as any book', res.books === 3 && !(await book(Z1)) && !(await book(Z2)) && !(await book(Z3))
  && await n(`storage_purge_queue where object_path = any($1::text[]) and is_prefix`, [[`${Z1}/`, `${Z2}/`, `${Z3}/`]]) === 3);

// ── 7. A held draft is the only held row (review A N4 on #251) ──
// purge_due step 1: a book whose only held row is the sole parent's held draft ('entry' hold on its id).
const Z4 = await newChild(Q2, 'Asha', '2025-12-01');
const z4Held = await heldDraft(Q2, Z4, 'You waved at the moon.');
await one(Q2, `select public.request_book_deletion($1, 'ios') r`, [Z4]);
await hold('entry', z4Held, 'T-Z4');
res = await purgeDue(31);
check('[DATA-REQ-035] day 30 skips a book whose only held row is a held draft, and the draft stays', res.books === 0 && !!(await book(Z4))
  && await n(`held_drafts where id = $1`, [z4Held]) === 1);
await release(z4Held);
res = await purgeDue(31);
check('released: the next run purges it with the draft', res.books === 1 && !(await book(Z4)) && await n(`held_drafts where id = $1`, [z4Held]) === 0);
// The account purge: the same in the sole parent's book deleted with their account (no letter anywhere).
const Z5 = await newChild(Q3, 'Asha', '2025-12-02');
const z5Held = await heldDraft(Q3, Z5, 'You laughed at the dog.');
await hold('entry', z5Held, 'T-Z5');
const r8 = await requestFor(Q3);
res = await purgeDue(31);
check('[DATA-REQ-035] day 30 skips the account\'s book whose only held row is a held draft', res.books === 0 && !!(await book(Z5))
  && await status(r8) === 'executing');
check('[DATA-REQ-035] and prepare_account_purge holds the request: nothing changes, the draft stays', await heldPrepare(r8)
  && await n(`held_drafts where id = $1`, [z5Held]) === 1);
await release(z5Held);
res = await purgeDue(31);
check('released: the book goes on the next run and prepare runs normally', res.books === 1 && !(await book(Z5))
  && (await prepare(r8)).held !== true);
// The person's own held draft in a book that survives them (the check from review L N2).
const Z6 = await newChild(Q4, 'Asha', '2025-12-03');
await join(Q5, 'parent', Z6, Q4);
const z6Held = await heldDraft(Q4, Z6, 'You hummed in the bath.');
await hold('entry', z6Held, 'T-Z6');
const r9 = await requestFor(Q4);
await executing(r9);
check('[DATA-REQ-035] a co-parent\'s own held draft under a hold holds their account purge', await heldPrepare(r9));
await release(z6Held);
await executing(r9);
check('released, prepare runs normally and the book stays with the other parent', (await prepare(r9)).held !== true && (await book(Z6))?.tombstoned === false);

done();
