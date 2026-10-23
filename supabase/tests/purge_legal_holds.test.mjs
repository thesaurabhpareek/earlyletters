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
const everyone = [A, B, C, N, S, P1, P2, P3, P4, P5, P6, P7, P8];
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
const storeKey = (u, child, b) => as(u, `select public.backup_store_key($1, 1, 1, $2::jsonb)`, [child, boxOf(b)]);
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

done();
