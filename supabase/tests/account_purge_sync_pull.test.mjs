// What a phone's pull says about a deleted account's letters after the day-30 purge (BL-494 point 4; claims row E9;
// C-REQ-019). The phone erases a letter the server held only when a pull says the server no longer holds it
// (apps/mobile/src/lib/sync/merge.ts: a book digest that differs, then the id list, then markGone). This file records,
// on the real SQL, what sync_pull answers the deleting parent at each stage:
//   1. after the request: the letters come down tombstoned, and the book that goes with the account is in `gone`;
//   2. day 30, after prepare_account_purge and before the worker deletes the Auth user (one worker run, seconds):
//      the shared book's digest drops to the co-parent's letters only and the id list leaves the parent's out, the
//      only signal that reaches markGone;
//   3. after the Auth user is deleted (profiles cascade): a token that has not expired yet gets SQLSTATE 23503
//      (rate_hit's insert into sync_rate_windows has no profile to point at), never a page; a signed-out call (anon)
//      gets 42501; sync_books fails like sync_pull, and my_sync_gate says nothing is allowed. So no pull after the
//      purge says anything about the letters, and once the token expires the phone cannot pull at all (its refresh
//      token went with the user).
// The phone side (what it does with each answer) is apps/mobile/test/account-purge-phone.test.ts.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users } from './harness.mjs';

const { check, as, asAnon, sys, one, codeOf, done, publishPolicies, consent, newChild, join } = await createDb(process.argv.slice(2));
const { A, B } = users;
await sys(`insert into auth.users values ('${A}'),('${B}')`);
await publishPolicies();
for (const u of [A, B]) await consent(u);

let seq = 0;
const letter = async (author, child, text) => {
  const id = `0192e500-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  await sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
    values ($1, $2, $3, 'letter', '2026-10-01', now(), 'typed', 1, $4, $4, true)`, [id, child, author, text]);
  return id;
};
const pull = async (uid, since) => {
  await sys(`delete from sync_rate_windows`);
  return (await one(uid, `select public.sync_pull($1::jsonb, 200) r`, [JSON.stringify(since)])).r;
};
const bookOf = (r, id) => r.books.find((b) => b.id === id);
const goneOf = (r, id) => (r.gone ?? []).find((g) => g.id === id);
/** The request the phone builds for its listed books (merge.ts buildPullRequest): cursor, access, and its digest as `have`. */
const requestFrom = (r, ids) => ({ epoch: r.epoch,
  books: Object.fromEntries(ids.map((id) => { const b = bookOf(r, id); return [id, { cursor: b.cursor, access: b.access, have: b.visible }]; })) });

// Asha's book SOLE is the deleting parent's alone; SHARED is also the co-parent's, so it stays.
const SOLE = await newChild(A, 'Asha', '2025-04-12');
const SHARED = await newChild(B, 'Asha', '2025-04-12');
await join(A, 'parent', SHARED, B);
const s1 = await letter(A, SOLE, 'You laughed at the rain today.');
const s2 = await letter(A, SOLE, 'You found your feet.');
const h1 = await letter(A, SHARED, 'You waved at the bus.');
const b1 = await letter(B, SHARED, 'Bath time, and you splashed us both.');

const first = await pull(A, { books: {} });
check('before any request: both books and all three of the parent\'s letters come down, with a digest of two letters in SHARED (theirs and the co-parent\'s)',
  bookOf(first, SOLE)?.rows.length === 2 && bookOf(first, SHARED)?.rows.some((x) => x.id === h1) && bookOf(first, SHARED)?.visible.n === 2);

// ── 1. The request (day 0) ──
const req = (await one(A, `select request_id from public.request_account_deletion('ios')`)).request_id;
const afterReq = await pull(A, requestFrom(first, [SOLE, SHARED]));
const goneSole = goneOf(afterReq, SOLE);
check('[C-REQ-019] after the request the book that goes with the account is in gone (reason deleted) with the parent\'s two letters, tombstoned',
  goneSole?.reason === 'deleted' && goneSole.rows.length === 2 && goneSole.rows.every((x) => x.deleted_at !== null && x.own === true)
  && !bookOf(afterReq, SOLE));
const sharedAfterReq = bookOf(afterReq, SHARED);
check('[C-REQ-019] and SHARED stays listed; the parent\'s letter there comes down tombstoned (it moves to Recently deleted on the phone)',
  sharedAfterReq?.rows.length === 1 && sharedAfterReq.rows[0].id === h1 && sharedAfterReq.rows[0].deleted_at !== null);
check('the tombstoned letter still counts in the digest the server holds for this parent (own rows, any state): two',
  sharedAfterReq?.visible.n === 2);
// The phone then drops its sync row for the closed book (closeBook), so from here it asks for SHARED only.
const phoneSince = requestFrom(afterReq, [SHARED]);
const quiet = await pull(A, phoneSince);
check('a pull with nothing new echoes the phone\'s own digest: no change, no erase (the 30 days)',
  bookOf(quiet, SHARED)?.rows.length === 0 && bookOf(quiet, SHARED)?.visible.n === 2 && (quiet.gone ?? []).length === 0);

// ── 2. Day 30: the worker's prepare, before its auth_user step ──
await sys(`update deletion_requests set status = 'executing', executing_at = now() where id = $1`, [req]);
const prep = (await sys(`select public.prepare_account_purge($1) r`, [req])).rows[0].r;
check('day 30: prepare_account_purge deletes the parent\'s three letters and the book that went with the account',
  prep.entries === 3 && prep.books === 1);
check('the deletes are erasures the pull can see (sync_private.entry_erasures, author = the parent) while the profile still exists',
  (await sys(`select count(*)::int n from sync_private.entry_erasures where author_id = $1 and entry_id = any($2::uuid[])`, [A, [h1]])).rows[0].n === 1);
const window = await pull(A, phoneSince);
const wb = bookOf(window, SHARED);
check('[BL-494 4] in the window before the Auth user goes, the pull says SHARED\'s digest is one letter (the co-parent\'s), not the two the phone holds: the phone asks for ids',
  wb?.rows.length === 0 && wb.visible.n === 1 && wb.visible.n !== phoneSince.books[SHARED].have.n);
const ids = bookOf(await pull(A, { ...phoneSince, books: { [SHARED]: { ...phoneSince.books[SHARED], ids: true } } }), SHARED)?.ids;
check('[BL-494 4] and the id list leaves the parent\'s letter out (the signal markGone acts on); the co-parent\'s stays',
  Array.isArray(ids) && !ids.includes(h1) && ids.includes(b1));

// ── 3. The worker deletes the Auth user (cascade), then finalizes ──
await sys(`delete from auth.users where id = $1`, [A]);
check('after the auth_user step the profile is gone (cascade)', (await sys(`select 1 from profiles where id = $1`, [A])).rows.length === 0);
const withToken = await codeOf(() => pull(A, phoneSince));
check('[BL-494 4] a pull with a token that has not expired yet fails with 23503 (rate_hit has no profile to count against): no page, no digest, no ids',
  withToken === '23503');
check('[BL-494 4] the same for a pull asking for ids, and for a fresh pull with no books',
  await codeOf(() => pull(A, { ...phoneSince, books: { [SHARED]: { ...phoneSince.books[SHARED], ids: true } } })) === '23503'
  && await codeOf(() => pull(A, { books: {} })) === '23503');
check('sync_books fails the same way (23503)', await codeOf(async () => { await sys(`delete from sync_rate_windows`); await as(A, `select public.sync_books()`); }) === '23503');
const gate = (await as(A, `select * from public.my_sync_gate()`)).rows[0];
check('my_sync_gate answers that nothing is allowed (no consent rows are left): a closed gate, not a "gone"',
  gate && gate.content_allowed === false && gate.terms_current === false);
await sys(`select public.finalize_account_deletion($1, '{"verified": true}')`, [req]);
check('[BL-494 4] after finalize, still 23503: nothing the server answers names the letters',
  await codeOf(() => pull(A, phoneSince)) === '23503');
const signedOut = await codeOf(() => asAnon(`select public.sync_pull('{}'::jsonb, 200)`));
check('[BL-494 4] a signed-out phone (its refresh token went with the user, so supabase-js drops the session and calls as anon) is refused before the function runs (42501)',
  signedOut === '42501');
check('the co-parent\'s book and letter are untouched, and the parent\'s letter is no longer theirs to read',
  bookOf(await pull(B, { books: {} }), SHARED)?.rows.map((x) => x.id).join() === b1);

done();
