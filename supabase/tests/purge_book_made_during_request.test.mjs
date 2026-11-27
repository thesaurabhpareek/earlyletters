// BL-486 (council batch 6, CPrivO-19: option (b), accept and say so; the purge test first). What the day-30
// purge does with a book a person makes or joins while their own account-deletion request is open
// (LEGAL-REQ-029, C-REQ-019: in-app deletion with its 30-day undo). Nothing on the server refuses these
// paths during the 30 days (create_child, create_first_run_children and accept_child_invite read no
// deletion_requests row), so this file records the outcome on the real SQL, the same path the purge tests
// drive: request_account_deletion, purge_due on day 30, prepare_account_purge, the worker's Auth delete
// and finalize_account_deletion.
//   1. A book made with create_child after the request, the person its only parent.
//   2. A book made with create_first_run_children after the request, the person its only parent.
//   3. A book joined with accept_child_invite after the request, where the inviting parent stays.
// A control: a book the person was already sole parent of when they asked is tombstoned at request time.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';
import { allowLegacyPhotos } from './legacy_photo.mjs';

const { check, as, sys, one, done, publishPolicies, consent, newChild, join } = await createDb(process.argv.slice(2));
await allowLegacyPhotos(sys); // BL-870: legacy rows carry a path; the guard is proved in photo_bucket_closed.test.mjs
const { A } = users;
const P1 = 'b1111111-1111-4111-8111-111111111111'; // case 1: create_child during the 30 days
const P2 = 'b2222222-2222-4222-8222-222222222222'; // case 2: create_first_run_children during the 30 days
const P3 = 'b3333333-3333-4333-8333-333333333333'; // case 3: joins A's book during the 30 days
const everyone = [A, P1, P2, P3];
await sys(`insert into auth.users select unnest($1::uuid[])`, [everyone]);
await publishPolicies();
for (const u of everyone) await consent(u);

let seq = 0;
// A letter with a photo path, as the purge tests write one.
const letter = async (author, child, text = 'Asha laughed.') => {
  const id = `0192e600-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  await sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book, photo_path)
    values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um ' || $4, $4, true, $5)`,
    [id, child, author, text, `${child}/${author}/${id}.jpg`]);
  return id;
};
const requestFor = async (u) => (await one(u, `select request_id from public.request_account_deletion('ios')`)).request_id;
const openRequest = async (u) => (await sys(`select id from deletion_requests where profile_id = $1 and kind = 'account'
  and status in ('scheduled', 'held', 'executing')`, [u])).rows[0]?.id;
const status = async (req) => (await sys(`select status from deletion_requests where id = $1`, [req])).rows[0]?.status;
const book = async (id) => (await sys(`select deleted_at is not null tombstoned, deletion_request_id from children where id = $1`, [id])).rows[0];
const entryLive = async (id) => (await sys(`select deleted_at is null live from entries where id = $1`, [id])).rows[0]?.live;
const exists = async (table, id) => (await sys(`select 1 from ${table} where id = $1`, [id])).rows.length === 1;
const ledger = async (type, id) => (await sys(`select 1 from purge_ledger where entity_type = $1 and entity_id = $2`, [type, id])).rows.length === 1;
const queued = async (req, path) => (await sys(`select 1 from storage_purge_queue where request_id = $1 and object_path = $2 and is_prefix`,
  [req, path])).rows.length === 1;
const isMember = async (u, child) => (await sys(`select 1 from child_members where profile_id = $1 and child_id = $2`, [u, child])).rows.length === 1;

// ── Control: a book the person already had is tombstoned with the request (the existing rule) ──
const OLD = await newChild(P1, 'Asha', '2025-03-01');
const oldLetter = await letter(P1, OLD, 'Asha waved at the moon.');

// ── The three requests, made before any of the books below ──
const r1 = await requestFor(P1);
const r2 = await requestFor(P2);
const r3 = await requestFor(P3);
check('control: a book the person was sole parent of when they asked is tombstoned with the request',
  (await book(OLD))?.tombstoned === true && (await book(OLD))?.deletion_request_id === r1 && (await entryLive(oldLetter)) === false);

// ── During the 30 days: each path is accepted by the server ──
const NEW1 = uuid7();
const made1 = (await one(P1, `select public.create_child($1, 'Asha', '2026-05-01'::date, null) as id`, [NEW1])).id;
const NEW2 = uuid7();
const made2 = (await one(P2, `select public.create_first_run_children($1::jsonb) as ids`,
  [JSON.stringify([{ id: NEW2, name: 'Asha', date_of_birth: '2026-04-01', due_date: null }])])).ids;
const JOINED = await newChild(A, 'Asha', '2025-08-01');
const aLetter = await letter(A, JOINED, 'Asha stacked three blocks.');
await join(P3, 'parent', JOINED, A);

check('[LEGAL-REQ-029, C-REQ-019] during the 30 days create_child makes a book for a person with an open request (nothing refuses it)',
  made1 === NEW1 && (await openRequest(P1)) === r1);
check('[LEGAL-REQ-029, C-REQ-019] during the 30 days create_first_run_children makes a book for a person with an open request',
  Array.isArray(made2) && made2.length === 1 && made2[0] === NEW2 && (await openRequest(P2)) === r2);
check('[LEGAL-REQ-029, C-REQ-019] during the 30 days accept_child_invite lets a person with an open request join a book as a parent',
  (await isMember(P3, JOINED)) && (await openRequest(P3)) === r3);

const l1 = await letter(P1, NEW1, 'Asha said ball.');
const l2 = await letter(P2, NEW2, 'Asha found a feather.');
const l3 = await letter(P3, JOINED, 'Asha hummed along.');
check('[LEGAL-REQ-029, C-REQ-019] during the 30 days the new and joined books are live and linked to no request, and their new letters are live',
  (await book(NEW1))?.tombstoned === false && (await book(NEW1))?.deletion_request_id === null
  && (await book(NEW2))?.tombstoned === false && (await book(NEW2))?.deletion_request_id === null
  && (await book(JOINED))?.tombstoned === false && (await book(JOINED))?.deletion_request_id === null
  && (await entryLive(l1)) === true && (await entryLive(l2)) === true && (await entryLive(l3)) === true);

// ── Day 30: purge_due hands each request to the worker; it purges the control book, not the new ones ──
const due = (await sys(`select public.purge_due(now() + interval '31 days') r`)).rows[0].r;
check('day 30: purge_due purges the book tombstoned at request time and hands all three requests to the worker',
  due.books === 1 && due.accounts_due === 3 && !(await exists('children', OLD))
  && (await status(r1)) === 'executing' && (await status(r2)) === 'executing' && (await status(r3)) === 'executing');
check('day 30: purge_due leaves the books made or joined during the 30 days (none is tombstoned yet)',
  (await exists('children', NEW1)) && (await exists('children', NEW2)) && (await exists('children', JOINED)));

// ── The worker's prepare_account_purge ──
const prepare = async (req) => (await sys(`select public.prepare_account_purge($1) r`, [req])).rows[0].r;
const p1 = await prepare(r1);
const p2 = await prepare(r2);
const p3 = await prepare(r3);

check('[LEGAL-REQ-029, C-REQ-019] case 1: a book made with create_child during the 30 days, sole parent, is deleted with the account at day 30',
  p1.held !== true && p1.books === 1 && p1.entries === 1 && !(await exists('children', NEW1)) && (await ledger('child', NEW1)));
check('[LEGAL-REQ-029, C-REQ-019] case 1: its letter written during the 30 days goes too, and the whole book folder is queued',
  !(await exists('entries', l1)) && (await ledger('entry', l1)) && (await queued(r1, `${NEW1}/`)));
check('[LEGAL-REQ-029, C-REQ-019] case 2: a book made with create_first_run_children during the 30 days, sole parent, is deleted with the account at day 30',
  p2.held !== true && p2.books === 1 && p2.entries === 1 && !(await exists('children', NEW2)) && (await ledger('child', NEW2))
  && !(await exists('entries', l2)) && (await queued(r2, `${NEW2}/`)));
check('[LEGAL-REQ-029, C-REQ-019, DATA-REQ-012] case 3: a book joined during the 30 days where the inviting parent stays is kept, with that parent\'s letters',
  p3.held !== true && p3.books === 0 && (await exists('children', JOINED)) && (await book(JOINED))?.tombstoned === false
  && !(await ledger('child', JOINED)) && (await exists('entries', aLetter)) && (await entryLive(aLetter)) === true
  && (await isMember(A, JOINED)));
check('[LEGAL-REQ-029, C-REQ-019] case 3: the joining person\'s own letter in it goes, and only their folder is queued, not the book\'s',
  p3.entries === 1 && !(await exists('entries', l3)) && (await ledger('entry', l3))
  && (await queued(r3, `${JOINED}/${P3}/`)) && !(await queued(r3, `${JOINED}/`)));

// ── The worker's Auth delete and finalize ──
for (const [u, req] of [[P1, r1], [P2, r2], [P3, r3]]) {
  await sys(`delete from auth.users where id = $1`, [u]);
  await sys(`select public.finalize_account_deletion($1, '{"verified": true}')`, [req]);
}
check('after Auth delete and finalize, the three requests are completed',
  (await status(r1)) === 'completed' && (await status(r2)) === 'completed' && (await status(r3)) === 'completed');
check('[LEGAL-REQ-029, C-REQ-019, DATA-REQ-012] after finalize, the joined book is still the inviting parent\'s, without the deleted person',
  (await exists('children', JOINED)) && (await isMember(A, JOINED)) && !(await isMember(P3, JOINED))
  && (await exists('entries', aLetter)));
check('after finalize, neither book made during the 30 days came back',
  !(await exists('children', NEW1)) && !(await exists('children', NEW2)));

done();
