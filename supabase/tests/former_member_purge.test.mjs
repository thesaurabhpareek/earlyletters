// A former member's letters stay theirs (20261023010000; review A N1 on #151; DATA-REQ-012,
// DATA-REQ-015, F11-REQ-008; D-113, BL-444). Someone whose join was undone, or who left, keeps
// their letters, held drafts, recording backups, book key and Storage objects when the remaining
// parent deletes the book (purge_due on day 30) or their own account (prepare_account_purge); the
// book row stays, tombstoned, until nothing of theirs is left. Undo keeps the removed parent's held
// drafts on the server. Current members are purged with the book as before.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const { db, check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, join } = await createDb(process.argv.slice(2));
const { A, B, C, N, S } = users;
const hex = (byte, n) => Buffer.from(byte.repeat(n), 'hex');
const boxOf = (b) => JSON.stringify({ suite: 'hpke-x25519-sha256-aes256gcm', enc: Buffer.from(b.repeat(32), 'hex').toString('base64'),
  ct: Buffer.from(b.repeat(48), 'hex').toString('base64') });
// Supabase's storage.objects has owner and metadata columns; the harness stub does not (as in audio_backup_purge).
await sys(`alter table storage.objects add column owner uuid, add column owner_id text, add column created_at timestamptz not null default now(),
  add column metadata jsonb`);
await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${S}')`);
await publishPolicies();
await sys(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at,
             content_sha256, url, summary)
           values ('backup', '1.0.0', 'initial', false, now() - interval '2 days', now() - interval '2 days', now() - interval '2 days',
             sha256('backup'::bytea), 'https://example.invalid/backup/1.0.0', 'First version')`);
for (const u of [A, B, C, N, S]) {
  await consent(u);
  await as(u, `select public.record_policy_act('backup', '1.0.0', 'accept', 'consent_sheet', 'backup.sheet', '1.0.0', 'ios')`);
}
await sys(`set app.backup_enabled = 'on'`);

let seq = 0;
// A letter with a photo (row and object, as the app uploads it).
const letter = async (author, child, text = 'Asha laughed.') => {
  const id = `0192e400-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  const photo = `${child}/${author}/${id}.jpg`;
  await sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book, photo_path)
    values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um ' || $4, $4, true, $5)`, [id, child, author, text, photo]);
  await sys(`insert into storage.objects (bucket_id, name, owner, owner_id) values ('entry-photos', $1, $2::uuid, $2)`, [photo, author]);
  return { id, photo };
};
// A recording backed up end to end (reservation, upload, confirmation), as in audio_backup_purge.
const backedUp = async (author, child) => {
  const l = await letter(author, child);
  const path = (await as(author, `select public.backup_begin($1, $2, 1000, 1, $3::bytea) r`, [l.id, child, hex('dd', 60)])).rows[0].r.object_path;
  await as(author, `insert into storage.objects (bucket_id, name) values ('entry-audio', $1)`, [path]);
  await sys(`update storage.objects set owner = $2::uuid, owner_id = $2, metadata = '{"size": 1000}' where name = $1`, [path, author]);
  await as(author, `select public.backup_confirm($1, $2::bytea)`, [l.id, hex('ee', 32)]);
  return { ...l, path };
};
const heldDraft = async (author, child, words = 'You smiled at the rain.') => {
  const id = uuid7();
  await as(author, `insert into held_drafts (id, author_id, child_id, kind, capture_mode, created_at, occurred_on, typed_text)
    values ($1, $2, $3, 'held_letter', 'typed', now(), '2026-09-29', $4)`, [id, author, child, words]);
  return id;
};
const n = async (sql, params) => (await sys(`select count(*)::int n from ${sql}`, params)).rows[0].n;
const queued = async (bucket, path, prefix) => (await sys(`select 1 from storage_purge_queue where bucket_id = $1 and object_path = $2
  and is_prefix = $3 and done_at is null`, [bucket, path, prefix])).rows.length === 1;
const queuedUnder = (prefix) => n(`storage_purge_queue where object_path like $1 || '%'`, [prefix]);
const ledger = async (type, id) => (await sys(`select 1 from purge_ledger where entity_type = $1 and entity_id = $2`, [type, id])).rows.length === 1;
const book = async (id) => (await sys(`select name, date_of_birth::text dob, nickname, photo_path, created_by, family_can_read,
  deleted_at is not null tombstoned, purged_at is not null kept from children where id = $1`, [id])).rows[0];
const pull = async (uid, child) => (await one(uid, `select public.sync_pull($1::jsonb, 100) r`, [JSON.stringify({ books: { [child]: {} } })])).r;
await sys(`delete from sync_rate_windows`);

// ── 1. Undo, then the remaining parent deletes the book (purge_due, day 30) ──
const U = await newChild(A, 'Asha', '2025-04-12');
await sys(`update children set nickname = 'Ashu', photo_path = $2 where id = $1`, [U, `${U}/${uuid7()}.jpg`]);
await join(B, 'parent', U, A);
await join(N, 'contributor', U, A);
for (const [u, b] of [[A, 'aa'], [B, 'bb']]) await as(u, `select public.backup_store_key($1, 1, 1, $2::jsonb)`, [U, boxOf(b)]);
const b1 = await backedUp(B, U);
const b2 = await letter(B, U, 'Asha took three steps.');
const bHeld = await heldDraft(B, U);
await as(B, `insert into dictionary_terms (owner_id, child_id, term, kind) values ($1, $2, 'Ashu', 'nickname')`, [B, U]);
const a1 = await backedUp(A, U);
const aHeld = await heldDraft(A, U);
await as(A, `insert into dictionary_terms (owner_id, child_id, term, kind) values ($1, $2, 'Asha', 'child')`, [A, U]);
const n1 = await letter(N, U, 'Asha sang for Nani.');

check('undo: the inviter removes the co-parent within 72 hours', (await one(A, `select public.undo_parent_join($1, $2) r`, [U, B])).r === 'undone');
check('[F11-REQ-008] undo keeps the removed parent\'s held draft on the server, theirs, with no marker and no ledger row',
  await n(`held_drafts where id = $1 and author_id = $2 and child_id = $3`, [bHeld, B, U]) === 1
  && await n(`held_drafts_gone where id = $1`, [bHeld]) === 0 && !(await ledger('held_draft', bHeld)));
check('[F11-REQ-008] after undo the removed parent still reads their own held draft (held_drafts_author_read)',
  (await as(B, `select 1 from held_drafts where id = $1`, [bHeld])).rows.length === 1);
check('nobody else reads it', (await as(A, `select 1 from held_drafts where id = $1`, [bHeld])).rows.length === 0);
check('undo takes the removed parent\'s letters out of the book and nothing else (as before)',
  await n(`entries where author_id = $1 and child_id = $2 and not in_book and deleted_at is null`, [B, U]) === 2);
check('writing it still needs a parent of the book: the removed parent\'s update changes nothing',
  (await as(B, `update held_drafts set typed_text = 'x' where id = $1 returning 1`, [bHeld])).rows.length === 0
  && (await sys(`select typed_text from held_drafts where id = $1`, [bHeld])).rows[0]?.typed_text === 'You smiled at the rain.');

check('the remaining parent may now delete the book', (await one(A, `select public.request_book_deletion($1, 'ios') r`, [U])).r === 'book_scheduled');

// A legal hold on the former member's letter does not hold the book purge: the purge never deletes that
// letter (20261023020000, review A N2 on #251; before, any hold in the book held it). A hold on the book or
// on a current member's row still does (purge_legal_holds.test.mjs).
await sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by) values ('entry', $1, 'other', 'T-S02', 'ops', '2027-01-01')`, [b2.id]);
let res = (await sys(`select public.purge_due(now() + interval '31 days') r`)).rows[0].r;
check('under a legal hold on a former member\'s letter, day 30 still purges the book for everyone else and the held letter stays',
  res.books === 1 && res.books_kept === 1 && await n(`entries where id = $1 and author_id = $2`, [b2.id, B]) === 1
  && await n(`entries where id = $1`, [a1.id]) === 0);
await sys(`update legal_holds set released_at = now(), released_by = 'ops' where scope_id = $1`, [b2.id]);
check('day 30: the book is purged and kept for its former member (books 1, books_kept 1)', res.books === 1 && res.books_kept === 1);
const kept = await book(U);
check('[DATA-REQ-015] the book row stays, tombstoned and marked kept', kept?.tombstoned === true && kept.kept === true);
check('the kept row keeps only what the letters need: name and birth date stay; nickname, photo, creator and family reading are cleared',
  kept.name === 'Asha' && kept.dob === '2025-04-12' && kept.nickname === null && kept.photo_path === null && kept.created_by === null
  && kept.family_can_read === false);
check('[F11-REQ-008] the former co-parent\'s letters stay, theirs, unchanged',
  (await sys(`select count(*)::int n from entries where author_id = $1 and child_id = $2 and final_text in ('Asha laughed.', 'Asha took three steps.')`, [B, U])).rows[0].n === 2);
check('[F11-REQ-008] and their held draft, recording backup, book key and per-book term',
  await n(`held_drafts where id = $1 and author_id = $2`, [bHeld, B]) === 1 && await n(`audio_blobs where entry_id = $1 and author_id = $2`, [b1.id, B]) === 1
  && await n(`child_keys where child_id = $1 and profile_id = $2`, [U, B]) === 1 && await n(`dictionary_terms where owner_id = $1 and child_id = $2`, [B, U]) === 1);
check('[F08 6.5] none of their Storage objects is queued: no whole-book prefix, no prefix of theirs, no exact path of theirs',
  !(await queued('entry-photos', `${U}/`, true)) && await queuedUnder(`${U}/${B}/`) === 0);
check('no child ledger row, so a restore replay never cascades over their letters', !(await ledger('child', U)));
check('the remaining parent\'s letter, held draft, backup, book key and term go; the letter is ledgered',
  await n(`entries where id = $1`, [a1.id]) === 0 && await ledger('entry', a1.id) && await n(`held_drafts where id = $1`, [aHeld]) === 0
  && await ledger('held_draft', aHeld) && await n(`audio_blobs where author_id = $1`, [A]) === 0
  && await n(`child_keys where child_id = $1 and profile_id = $2`, [U, A]) === 0 && await n(`dictionary_terms where owner_id = $1 and child_id = $2`, [A, U]) === 0);
check('a current family member\'s letter goes with the book, as before (they were offered export)',
  await n(`entries where id = $1`, [n1.id]) === 0 && await ledger('entry', n1.id));
check('their folders are queued person by person, the recording by its exact path, and the book\'s photo folder',
  await queued('entry-photos', `${U}/${A}/`, true) && await queued('entry-photos', `${U}/${N}/`, true)
  && await queued('entry-audio', a1.path, false) && await queued('child-photos', `${U}/`, true));
check('memberships, preferences and invites are gone; no member\'s marker or erasure record is left',
  await n(`child_members where child_id = $1`, [U]) === 0 && await n(`child_member_prefs where child_id = $1`, [U]) === 0
  && await n(`child_invites where child_id = $1`, [U]) === 0
  && await n(`held_drafts_gone where child_id = $1 and author_id <> $2`, [U, B]) === 0
  && await n(`sync_private.entry_erasures where child_id = $1 and author_id <> $2`, [U, B]) === 0);
check('the remaining parent no longer sees the book', !JSON.stringify((await one(A, `select public.sync_books() r`)).r).includes(U));
await sys(`delete from sync_rate_windows`);
const bPull = await pull(B, U);
const gone = bPull.gone.find((g) => g.id === U);
check('[BL-444] the former co-parent\'s phone still pulls their own letters of the left book (not_member)',
  gone?.reason === 'not_member' && gone.rows.length === 2 && gone.rows.every((x) => x.author_id === B));
check('[F08 6.5] they can still read their recording backup', (await one(B, `select public.backup_object_readable($1) v`, [b1.path])).v === true);
check('ops_deletion_sla does not count the kept book as an overdue tombstone',
  (await sys(`select public.ops_deletion_sla(now() + interval '40 days') r`)).rows[0].r.tombstones_overdue === 0);
res = (await sys(`select public.purge_due(now() + interval '32 days') r`)).rows[0].r;
check('a later run leaves the kept book alone while their letters are there', res.books === 0 && res.kept_removed === 0 && (await book(U))?.kept === true);
// The restore replay of every ledger row the purge wrote never reaches the kept letters.
const rows = (await sys(`select entity_type t, entity_id id from purge_ledger where entity_type in ('entry', 'held_draft', 'audio_blob', 'child')`)).rows;
await sys(`select public.ops_replay_ledger($1::jsonb)`, [JSON.stringify(rows)]);
check('[RB-8] a restore replay of the ledger keeps the book row and the former co-parent\'s letters',
  (await book(U))?.kept === true && await n(`entries where author_id = $1 and child_id = $2`, [B, U]) === 2);

// The former co-parent erases their letters and draft (their own ask): then the kept book goes.
for (const id of [b1.id, b2.id, bHeld]) await as(B, `select sync_private.erase_entry($1)`, [id]);
check('Erase now still works for them in the kept book (letters, draft, and the backup with its letter)',
  await n(`entries where child_id = $1`, [U]) === 0 && await n(`held_drafts where child_id = $1`, [U]) === 0 && await n(`audio_blobs where child_id = $1`, [U]) === 0
  && await queued('entry-audio', b1.path, false));
res = (await sys(`select public.purge_due(now() + interval '33 days') r`)).rows[0].r;
check('once nothing of theirs is left, the next run removes the kept book (kept_removed 1)', res.kept_removed === 1 && !(await book(U)));
check('then as any purged book: the child ledger row and the whole-book prefix', await ledger('child', U) && await queued('entry-photos', `${U}/`, true));
check('their book key, term, markers and erasure records went with it',
  await n(`child_keys where child_id = $1`, [U]) === 0 && await n(`dictionary_terms where child_id = $1`, [U]) === 0
  && await n(`held_drafts_gone where child_id = $1`, [U]) === 0 && await n(`sync_private.entry_erasures where child_id = $1`, [U]) === 0);

// ── 2. Leave, then the remaining parent's account deletion (prepare_account_purge) ──
await sys(`delete from sync_rate_windows`);
const L = await newChild(S, 'Asha', '2025-06-01');
await join(C, 'parent', L, S);
for (const [u, b] of [[S, 'cc'], [C, 'dd']]) await as(u, `select public.backup_store_key($1, 1, 1, $2::jsonb)`, [L, boxOf(b)]);
const c1 = await backedUp(C, L);
const s1 = await backedUp(S, L);
check('the co-parent leaves, keeping their letters in the book', (await one(C, `select public.leave_child($1, true) r`, [L])).r === 'left');
const dreq = (await sys(`insert into deletion_requests (kind, profile_id, status, source, scheduled_for) values ('account', $1, 'executing', 'ios', now()) returning id`, [S])).rows[0].id;
const prep = (await sys(`select public.prepare_account_purge($1) r`, [dreq])).rows[0].r;
check('prepare: the sole parent\'s book is deleted with the account and kept for the former co-parent (books 1, books_kept 1)',
  prep.books === 1 && prep.books_kept === 1 && prep.entries === 1);
check('[F11-REQ-008] the former co-parent\'s letter, backup and book key stay; the book row stays, kept',
  await n(`entries where id = $1 and author_id = $2`, [c1.id, C]) === 1 && await n(`audio_blobs where entry_id = $1`, [c1.id]) === 1
  && await n(`child_keys where child_id = $1 and profile_id = $2`, [L, C]) === 1 && (await book(L))?.kept === true);
check('[F08 6.5] their objects are not queued; the account\'s folder is, for this request',
  !(await queued('entry-photos', `${L}/`, true)) && await queuedUnder(`${L}/${C}/`) === 0
  && (await sys(`select 1 from storage_purge_queue where object_path = $1 and request_id = $2`, [`${L}/${S}/`, dreq])).rows.length === 1
  && await queued('entry-audio', s1.path, false));
check('no child ledger row for the kept book', !(await ledger('child', L)));
const prep2 = (await sys(`select public.prepare_account_purge($1) r`, [dreq])).rows[0].r;
check('a retried prepare of the same request changes nothing (the kept book is skipped)',
  prep2.books === 0 && prep2.books_kept === 0 && prep2.entries === 0 && (await book(L))?.kept === true
  && await n(`entries where id = $1`, [c1.id]) === 1);
// The worker's storage step, then Auth deletes the user (cascade), then finalize.
await sys(`delete from storage.objects where owner = $1`, [S]);
await sys(`delete from auth.users where id = $1`, [S]);
const residue = (await sys(`select public.ops_deletion_residue($1, 'before_finalize') v`, [S])).rows[0].v;
check('[LEGAL-REQ-029] the residue scan finds nothing of the deleted parent, the kept book included',
  residue.length === 0 || console.log(`      ${JSON.stringify(residue)}`));
await sys(`select public.finalize_account_deletion($1, '{"verified": true}')`, [dreq]);
check('[LEGAL-REQ-029] after finalize, no residue at all', (await sys(`select public.ops_deletion_residue($1, 'after_finalize') v`, [S])).rows[0].v.length === 0);
check('the former co-parent still reads their letter and their objects are still there',
  (await as(C, `select 1 from entries where id = $1`, [c1.id])).rows.length === 1
  && await n(`storage.objects where name in ($1, $2)`, [c1.photo, c1.path]) === 2);

// ── 3. No former member: the book is purged whole, as before ──
const W1 = await newChild(A, 'Asha', '2025-08-01');
const w1 = await letter(A, W1);
await as(A, `select public.request_book_deletion($1, 'ios')`, [W1]);
res = (await sys(`select public.purge_due(now() + interval '31 days') r`)).rows[0].r;
check('a book whose only author is the deleting parent goes whole: row, letter, child ledger row, whole-book prefix',
  res.books_kept === 0 && !(await book(W1)) && await n(`entries where id = $1`, [w1.id]) === 0 && await ledger('child', W1)
  && await queued('entry-photos', `${W1}/`, true));

// ── 4. A former parent whose only row is a held draft (review A N1 on #248) ──
// Two guards protect this case alone: book_kept_authors's held-draft branch (step 1 keeps the book)
// and step 2b's held-draft check (the kept row is not removed while the draft is there).
await sys(`delete from sync_rate_windows`);
const H = await newChild(A, 'Asha', '2025-09-01');
await join(C, 'parent', H, A);
const cHeld = await heldDraft(C, H, 'Your first word was hello.');
await letter(A, H);
check('undo of a co-parent whose only row in the book is a held draft',
  (await one(A, `select public.undo_parent_join($1, $2) r`, [H, C])).r === 'undone'
  && await n(`entries where author_id = $1 and child_id = $2`, [C, H]) === 0 && await n(`held_drafts where id = $1 and author_id = $2`, [cHeld, C]) === 1);
await as(A, `select public.request_book_deletion($1, 'ios')`, [H]);
res = (await sys(`select public.purge_due(now() + interval '31 days') r`)).rows[0].r;
check('[F11-REQ-008] day 30: a held draft alone makes its author a kept author: the draft stays, theirs, and the book is kept',
  res.books_kept === 1 && await n(`held_drafts where id = $1 and author_id = $2`, [cHeld, C]) === 1 && (await book(H))?.kept === true);
res = (await sys(`select public.purge_due(now() + interval '35 days') r`)).rows[0].r;
check('[F11-REQ-008] step 2b keeps the row while that held draft is all that is left (no letter, no backup)',
  res.kept_removed === 0 && (await book(H))?.kept === true && await n(`held_drafts where id = $1`, [cHeld]) === 1);
await as(C, `select sync_private.erase_entry($1)`, [cHeld]);
res = (await sys(`select public.purge_due(now() + interval '36 days') r`)).rows[0].r;
check('once they erase it (their own ask), the next run removes the row', res.kept_removed === 1 && !(await book(H)));

// ── 5. A restore to a point before the account purge, then the ledger replay (review A N2 on #248; RB-8) ──
// The person became the book's only parent during their grace period, so prepare_account_purge is what
// deletes the book. A savepoint stands in for the restore point: the purge runs to the end, the ledger rows
// it wrote are kept (the daily ledger file), the database goes back to the savepoint, and the rows are replayed.
await sys(`delete from sync_rate_windows`);
const R = await newChild(N, 'Asha', '2025-10-01');
await join(B, 'parent', R, N);
const bR = await letter(B, R, 'Asha waved at the moon.');
const nR = await letter(N, R);
const dreqN = (await one(N, `select request_id from public.request_account_deletion('ios')`)).request_id;
check('at the request the book still has two parents, so it is not deleted with the account', (await book(R))?.tombstoned === false);
await one(B, `select public.leave_child($1, true) r`, [R]);
await sys(`update deletion_requests set status = 'executing', executing_at = now() where id = $1`, [dreqN]);
await db.exec('begin');
await db.exec('savepoint restore_point');
await sys(`select public.prepare_account_purge($1)`, [dreqN]);
await sys(`delete from storage.objects where owner = $1`, [N]);
await sys(`delete from auth.users where id = $1`, [N]);
await sys(`select public.finalize_account_deletion($1, '{}'::jsonb)`, [dreqN]);
const ledgerCopy = (await sys(`select entity_type t, entity_id id from purge_ledger
  where purged_at = now() and entity_type in ('entry', 'child', 'profile', 'held_draft', 'audio_blob')`)).rows;
check('the purge ran to the end: the book was kept, no child ledger row, the person ledgered',
  ledgerCopy.some((x) => x.t === 'profile' && x.id === N) && !ledgerCopy.some((x) => x.t === 'child') && (await book(R))?.kept === true);
await db.exec('rollback to savepoint restore_point');
const replay = (await sys(`select public.ops_replay_ledger($1::jsonb) r`, [JSON.stringify(ledgerCopy)])).rows[0].r;
check('[RB-8] after the replay the person\'s letter is gone again and they are named for deletion again; the book is live and they are still its member',
  replay.profiles_to_delete.includes(N) && await n(`entries where id = $1`, [nR.id]) === 0 && (await book(R))?.tombstoned === false
  && await n(`child_members where child_id = $1 and profile_id = $2`, [R, N]) === 1 && await n(`entries where id = $1 and author_id = $2`, [bR.id, B]) === 1);
await db.exec('savepoint try_delete');
const deleteAgain = await codeOf(() => sys(`delete from auth.users where id = $1`, [N]));
await db.exec('rollback to savepoint try_delete');
check('[RB-8] deleting their Auth user again then fails with SCLPG (the last parent of a live book), and nothing changes',
  deleteAgain === 'SCLPG' && await n(`profiles where id = $1`, [N]) === 1 && await n(`entries where id = $1`, [bR.id]) === 1);
const prepAgain = (await sys(`select public.prepare_account_purge($1) r`, [dreqN])).rows[0].r;
await sys(`delete from auth.users where id = $1`, [N]);
await sys(`select public.finalize_account_deletion($1, '{}'::jsonb)`, [dreqN]);
await db.exec('commit');
check('[RB-8] it heals when the restored request runs again: the book is kept for the former co-parent and the person is deleted',
  prepAgain.books_kept === 1 && (await book(R))?.kept === true && await n(`entries where id = $1 and author_id = $2`, [bR.id, B]) === 1
  && await n(`profiles where id = $1`, [N]) === 0
  && (await sys(`select status from deletion_requests where id = $1`, [dreqN])).rows[0]?.status === 'completed');

done();
