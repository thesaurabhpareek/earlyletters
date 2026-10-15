// Security review 2026-10-04 (docs/reviews/2026-10-04-security-privacy.md),
// appendix PoC F1 to F6 rewritten as regression tests that assert the fix
// (BL-331, BL-332). Each block follows the review's steps. F2 and F6 are also
// covered in depth by db_followup_family_cap.test.mjs, F3 by
// db_followup_idempotency_rates.test.mjs; they are repeated here so every PoC
// has one place to read. Also the rest of review M3: limits on direct
// delete_entry and restore_entry, sync_books and new books.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, invite, join } = h;
const { A, B, C, N, S } = users;
const P2 = '88888888-8888-8888-8888-888888888888'; // S's co-parent in PoC F5

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${S}'),('${P2}')`);
await publishPolicies();
for (const u of [A, B, C, N, S, P2]) await consent(u);

let n = 0;
const id7 = () => uuid7(Date.now() - 5000 + ++n);
const resetRate = (uid) => sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
const push = async (uid, ops) => { await resetRate(uid); return (await one(uid, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).r; };
const pull = async (uid, since) => { await resetRate(uid); return (await one(uid, `select public.sync_pull($1::jsonb, 200) r`, [JSON.stringify(since)])).r; };
const letterOp = (child, { inBook = true, op = id7() } = {}) => {
  const id = id7();
  return { op, type: 'entry.upsert', id, data: {
    id, child_id: child, kind: 'letter', occurred_on: '2026-09-29', captured_at: '2026-09-29T20:00:00Z', capture_mode: 'typed',
    edit_level: 'verbatim', prompt_key: null, engine_version: 2, raw_transcript: 'She walked to me.', machine_edits: [],
    final_text: 'She walked to me.', in_book: inBook, sounds_like_me: null, author_signs_as: 'Mama', audio_kept_on_device: false } };
};

// ── F1 (M1): a family member reads the birth year and due date ──────────
const ASHA = await newChild(A, 'Asha', '2026-03-05', '2026-03-01');
await join(N, 'contributor', ASHA, A);
const f1 = await as(N, `select date_of_birth, due_date from children where id = $1`, [ASHA]);
check('[M1][D-039] PoC F1: a family member selecting date_of_birth, due_date from children gets no row', f1.rows.length === 0);
check('[M1] a family member cannot read the book row at all through the table', (await as(N, `select 1 from children`)).rows.length === 0);
const nBooks = (await one(N, `select public.sync_books() r`)).r.books;
check('[D-039] sync_books still gives the family member the name and birthday month and day, never the year or due date',
  nBooks.length === 1 && nBooks[0].name === 'Asha' && nBooks[0].birthday_md === '03-05'
  && nBooks[0].date_of_birth === null && nBooks[0].due_date === null);
const nMeta = (await pull(N, {})).books[0].meta;
check('[D-039] sync_pull meta for the family member carries no birth year or due date',
  nMeta.name === 'Asha' && nMeta.birthday_md === '03-05' && nMeta.date_of_birth === null && nMeta.due_date === null);
const aRow = (await as(A, `select date_of_birth::text dob, due_date::text due from children where id = $1`, [ASHA])).rows[0];
check('parents still read the birth date and due date', aRow?.dob === '2026-03-05' && aRow?.due === '2026-03-01');
check('a family member editing book settings changes nothing',
  (await as(N, `update children set nickname = 'Ashu' where id = $1`, [ASHA])).affectedRows === 0);

// ── F2 (H2): stale invite, third parent, no removal ─────────────────────
await join(B, 'parent', ASHA, A);
check('[H2][D-069] PoC F2a: the co-parent can no longer mint a parent invite in a two-parent book (SCCAP)',
  (await codeOf(() => as(B, `select public.create_child_invite($1, 'parent')`, [ASHA]))) === 'SCCAP');
const tStale = await invite(B, ASHA, 'contributor');
await as(B, `delete from child_members where child_id = $1 and profile_id = auth.uid()`, [ASHA]);
await sys(`update child_invites set revoked_at = null where token_hash = sha256(convert_to($1, 'UTF8'))`, [tStale]);  // as if made before the fix
check('[H2] PoC F2b: a stranger cannot accept an invite made by a parent who has left',
  (await codeOf(() => as(C, `select public.accept_child_invite($1)`, [tStale]))) === 'SCINV'
  && (await sys(`select 1 from child_members where child_id = $1 and profile_id = $2`, [ASHA, C])).rows.length === 0);
await join(B, 'parent', ASHA, A);
check('[H2][D-069] PoC F2c: a third parent invite is refused (SCCAP)',
  (await codeOf(() => as(A, `select public.create_child_invite($1, 'parent')`, [ASHA]))) === 'SCCAP');
check('[H2] PoC F2d: a parent can now remove a family member (remove_child_member)',
  (await one(A, `select public.remove_child_member($1, $2) r`, [ASHA, N])).r === 'removed'
  && (await sys(`select 1 from child_members where child_id = $1 and profile_id = $2`, [ASHA, N])).rows.length === 0);

// ── F3 (M3): the client resets its own sync counter ─────────────────────
await resetRate(A);
for (let i = 0; i < 3; i++) await one(A, `select public.sync_pull('{}'::jsonb, 10) r`);
check('[M3] PoC F3: update sync_rate_windows set hits = 0 is refused',
  (await codeOf(() => as(A, `update sync_rate_windows set hits = 0 where profile_id = auth.uid()`))) === '42501');
check('[M3] PoC F3: delete from sync_rate_windows is refused',
  (await codeOf(() => as(A, `delete from sync_rate_windows where profile_id = auth.uid()`))) === '42501');
check('so the counter still reads 3', (await sys(`select hits from sync_rate_windows where profile_id = $1 and bucket = 'pull'`, [A])).rows[0].hits === 3);

// ── F4 (L1): op-id squatting ────────────────────────────────────────────
const SBOOK = await newChild(S, 'Asha', '2025-04-12');
const X = id7();
check('[L1] PoC F4: C cannot insert a receipt directly',
  (await codeOf(() => as(C, `insert into sync_op_receipts (op_id, profile_id) values ($1, auth.uid())`, [X]))) === '42501');
check('[L1] C claiming the op id X writes only C\'s own receipt', (await one(C, `select public.sync_op_claim($1) r`, [X])).r === true);
const sOp = letterOp(SBOOK, { op: X });
const f4 = await push(S, [sOp]);
check('[L1] PoC F4: S pushes an op with the same id X: applied, not "dup", and the letter is stored',
  f4.results[0].ok && f4.results[0].dup === undefined && f4.results[0].applied === true
  && (await sys(`select 1 from entries where id = $1`, [sOp.id])).rows.length === 1);
check('[L1] receipts are per person: X is on file for both C and S',
  Number((await sys(`select count(*) c from sync_op_receipts where op_id = $1`, [X])).rows[0].c) === 2);
const again = await push(S, [sOp]);
check('a retry of S\'s own op is still a duplicate (idempotency kept)', again.results[0].ok && again.results[0].dup === true);
check('sync_op_claim says false for an op the caller already applied', (await one(S, `select public.sync_op_claim($1) r`, [X])).r === false);

// ── F5 (M5): the pull digest reveals a private write ────────────────────
await join(P2, 'parent', SBOOK, S);
const first = await pull(P2, {});
const cur = first.books[0].cursor;
const real = first.books[0].visible;
const lie = { epoch: first.epoch, books: { [SBOOK]: { cursor: cur, access: 'parent', meta: first.books[0].meta_hash, have: { n: 999, sum: 0 } } } };
const quiet = (await pull(P2, lie)).books[0];
await push(S, [letterOp(SBOOK, { inBook: false })]);   // S writes a private letter
const after = (await pull(P2, lie)).books[0];
check('[M5] PoC F5: with a wrong "have", the pull answers the real digest when nothing changed (no echo of 999)',
  quiet.visible.n === real.n && quiet.visible.sum === real.sum && quiet.visible.n !== 999);
check('[M5] PoC F5: after the other parent writes a private letter the answer is identical, with no rows',
  JSON.stringify(after.visible) === JSON.stringify(quiet.visible) && after.rows.length === 0);
const before2 = (await pull(P2, lie)).books[0];
const inBook = letterOp(SBOOK, { inBook: true });
await push(S, [inBook]);
const after2 = (await pull(P2, { epoch: first.epoch, books: { [SBOOK]: { cursor: before2.cursor, access: 'parent', meta: before2.meta_hash, have: before2.visible } } })).books[0];
check('an in-book letter still arrives as a row and moves the digest by one',
  after2.rows.some((r) => r.id === inBook.id) && after2.visible.n === before2.visible.n + 1);
await push(S, [{ ...inBook, op: id7(), data: { ...inBook.data, in_book: false }, changed: ['in_book'] }]);
const after3 = (await pull(P2, { epoch: first.epoch, books: { [SBOOK]: { cursor: after2.cursor, access: 'parent', meta: after2.meta_hash, have: after2.visible } } })).books[0];
check('a letter taken out of the book still shows as a smaller digest, with no row (removal still works)',
  after3.rows.length === 0 && after3.visible.n === after2.visible.n - 1);

// ── F6 (L2): moving a photo into another family's folder ────────────────
const CBOOK = await newChild(C, 'Asha', '2025-04-12');
const own = `${CBOOK}/${C}/x.jpg`;
await as(C, `insert into storage.objects (bucket_id, name) values ('entry-photos', $1)`, [own]);
const moved = await codeOf(async () => {
  const r = await as(C, `update storage.objects set name = $1 where name = $2`, [`${SBOOK}/${C}/x.jpg`, own]);
  if (r.affectedRows === 0) throw Object.assign(new Error('none'), { code: 'none' });
});
check('[L2] PoC F6: renaming an object into another family\'s book folder is refused', moved === '42501' || moved === 'none');
check('the object stays in its own folder', (await sys(`select 1 from storage.objects where name = $1`, [own])).rows.length === 1);

// ── Rest of M3: direct delete and restore, sync_books, new books ────────
const mine = letterOp(CBOOK);
await push(C, [mine]);
await resetRate(C);
await sys(`insert into sync_rate_windows (profile_id, bucket, window_start, hits) values ($1, 'letter_state', now(), 119)`, [C]);
check('[M3] direct delete_entry counts against 120 per hour', (await codeOf(() => as(C, `select public.delete_entry($1)`, [mine.id]))) === 'ok');
check('[M3] the 121st direct delete or restore in the hour is refused (SCRAT)',
  (await codeOf(() => as(C, `select public.restore_entry($1)`, [mine.id]))) === 'SCRAT');
const viaPush = await one(C, `select public.sync_push($1::jsonb) r`, [JSON.stringify([{ op: id7(), type: 'entry.restore', id: mine.id, data: {} }])]);
check('[M3] an entry.restore op inside sync_push is never refused by that limit (the push limit covers it)',
  viaPush.r.results[0].ok === true && (await sys(`select deleted_at from entries where id = $1`, [mine.id])).rows[0].deleted_at === null);
check('and sync_push did not spend the direct allowance',
  (await sys(`select hits from sync_rate_windows where profile_id = $1 and bucket = 'letter_state'`, [C])).rows[0].hits === 120);

await resetRate(C);
await sys(`insert into sync_rate_windows (profile_id, bucket, window_start, hits) values ($1, 'pull', now(), 120)`, [C]);
check('[M3] sync_books shares sync_pull\'s 120 per minute (SCRAT)', (await codeOf(() => as(C, `select public.sync_books()`))) === 'SCRAT');
await resetRate(C);

const made = Number((await sys(`select count(*) c from children where created_by = $1`, [C])).rows[0].c);
for (let i = made; i < 30; i++) await newChild(C, 'Asha', '2025-04-12');
check('[M3] the 31st new book in 24 hours is refused (SCRAT)',
  (await codeOf(() => as(C, `select public.create_child($1, 'Asha', '2025-04-12')`, [uuid7()]))) === 'SCRAT');
check('[M3] a retry of a book that exists is free', (await codeOf(() => as(C, `select public.create_child($1, 'Asha', '2025-04-12')`, [CBOOK]))) === 'ok');
const blocked = await push(C, [{ op: id7(), type: 'book.create', id: uuid7(), data: { name: 'Asha', date_of_birth: '2025-04-12' } }]);
check('[M3] the same limit applies to book.create in sync_push (op result SCRAT)', blocked.results[0].ok === false && blocked.results[0].code === 'SCRAT');
await sys(`update children set created_at = now() - interval '25 hours' where created_by = $1`, [C]);
check('a day later new books work again', (await codeOf(() => as(C, `select public.create_child($1, 'Asha', '2025-04-12')`, [uuid7()]))) === 'ok');

done();
