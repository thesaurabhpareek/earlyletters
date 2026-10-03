// Sync v1.0 (20261003041500_sync_cursor_pull.sql): outbox push and cursor
// pull without a sync vendor (founder decision 3 Oct 2026, DECISIONS D-023).
// Push is idempotent and runs every existing rule as the caller; pull follows
// book_entries (B F9, K-09), never skips a committed row, tells the phone what
// to drop, and starts over after a restore. Fictional family "Asha" only.
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, done, publishPolicies, consent, invite, join } = h;
const { A, B, C, N, U } = users;
const V = '99999999-9999-9999-9999-999999999999'; // contributor who later withdraws sensitive-data consent

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${U}'),('${V}')`);
await publishPolicies();
for (const u of [A, B, C, N, V]) await consent(u);

// A starts two books in one first run (twins rule): Asha, and a sibling Nina.
const CHILD = uuid7();
const SIB = uuid7();
await as(A, `select public.create_first_run_children($1::jsonb)`, [JSON.stringify([
  { id: CHILD, name: 'Asha', date_of_birth: '2025-05-20' },
  { id: SIB, name: 'Nina', due_date: null, date_of_birth: '2026-08-01' },
])]);
await join(B, 'parent', CHILD, A);
await as(A, `select public.create_child_invite($1, 'contributor', 'Nani')`, [CHILD]).then(async (r) => {
  await as(N, `select public.accept_child_invite($1)`, [r.rows[0].create_child_invite]);
});
await join(V, 'contributor', CHILD, A);
await as(A, `insert into child_member_prefs (child_id, profile_id, signs_as) values ($1, $2, 'Mama')`, [CHILD, A]);
const openInvite = await invite(A, CHILD, 'parent');

const ZERO = '00000000-0000-0000-0000-000000000000';
let n = 0;
const lid = () => uuid7(Date.now() - 1000 + ++n);
const letter = (id, { child = CHILD, text = 'She walked to me.', raw = 'um she walked to me', inBook = true, extra = {} } = {}) => ({
  id, child_id: child, kind: 'letter', occurred_on: '2026-09-29', captured_at: '2026-09-29T20:00:00Z', capture_mode: 'spoken',
  edit_level: 'clean', prompt_key: null, engine_version: 2, raw_transcript: raw,
  machine_edits: [{ type: 'filler', start: 0, end: 3, original: 'um ', replacement: '' }], final_text: text,
  in_book: inBook, sounds_like_me: null, author_signs_as: 'Mama', audio_kept_on_device: true, ...extra,
});
const push = async (uid, rows) => (await one(uid, `select public.sync_push_entries($1::jsonb) r`, [JSON.stringify(rows)])).r;
const pull = async (uid, child, cursor = null, { limit = 200, digest = false, ids = false } = {}) =>
  (await one(uid, `select public.sync_pull_book($1, $2, $3, $4, $5) r`, [child, cursor, limit, digest, ids])).r;
const pullAll = async (uid, child, cursor = null, limit = 200) => {
  const rows = [];
  let page; let calls = 0;
  do { page = await pull(uid, child, cursor, { limit, digest: calls > 0 }); rows.push(...page.rows); cursor = page.cursor; calls++; } while (page.more);
  return { rows, cursor, last: page, calls };
};
const server = async (id) => (await sys(`select sync_xid::text x, final_text, raw_transcript, approval, in_book, author_id, deleted_at from entries where id=$1`, [id])).rows[0];
const versions = async (id) => Number((await sys(`select count(*) c from entry_versions where entry_id=$1`, [id])).rows[0].c);
const checksum = (ids) => ids.reduce((s, id) => (s + parseInt(id.replace(/-/g, '').slice(-8), 16)) % 4294967296, 0);

// ── Push ──────────────────────────────────────────────────────────────────
const a1 = lid(); const a2 = lid(); const aPriv = lid();
let r = await push(A, [letter(a1), letter(a2, { text: 'Two teeth.' }), letter(aPriv, { inBook: false, text: 'Just for me.' })]);
check('[DATA-REQ-044] push inserts letters under the device ids', r.paused === false && r.results.every((x) => x.ok) && (await server(a1))?.final_text === 'She walked to me.');
check('push returns the server version of each row', r.results.every((x) => /^\d+$/.test(x.sync_xid)));
const x1 = (await server(a1)).x;
r = await push(A, [letter(a1), letter(a2, { text: 'Two teeth.' })]);
check('[DATA-REQ-044] a retried batch writes nothing (same version, no new history row)',
  r.results.every((x) => x.ok) && (await server(a1)).x === x1 && (await versions(a1)) === 0);
check('the author is always the caller, whatever the payload says',
  (await push(B, [letter(lid(), { extra: { author_id: A } })])).results[0].ok && Number((await sys(`select count(*) c from entries where author_id=$1`, [B])).rows[0].c) === 1);

r = await push(A, [letter(a1, { text: 'She walked to me, all the way.' })]);
const s1 = await server(a1);
check('[DATA-REQ-043] last writer wins on the words; the earlier words are kept in history',
  s1.final_text === 'She walked to me, all the way.' && BigInt(s1.x) > BigInt(x1) && (await versions(a1)) === 1);
r = await push(A, [letter(a1, { text: 'She walked to me, all the way.', raw: 'a different raw' })]);
check('[DATA-REQ-040] the raw transcript is written once; a later push never changes it', (await server(a1)).raw_transcript === 'um she walked to me');

const notMine = lid();
r = await push(A, [letter(lid(), { child: '0192f000-0000-7000-8000-00000000abcd' }), letter(notMine)]);
check('one bad row does not stop the batch (per-row code, the rest is stored)',
  r.results[0].ok === false && r.results[0].code === '42501' && r.results[1].ok === true);
check('a row that belongs to someone else is refused, not taken over',
  (await push(B, [letter(a1, { text: 'Not mine.' })])).results[0].code === '42501' && (await server(a1)).final_text.startsWith('She walked'));

await as(A, `select public.delete_entry($1)`, [a2]);
r = await push(A, [letter(a2, { text: 'Edited offline after the delete.' })]);
check('[DATA-REQ-043] deletion wins over an offline edit (SCTMB for that row)', r.results[0].code === 'SCTMB');
r = await push(A, [letter(a2, { text: 'Two teeth.' })]);
check('re-sending the unchanged state of a deleted letter is accepted and reports the tombstone', r.results[0].ok && r.results[0].deleted_at !== null);

const n1 = lid();
r = await push(N, [letter(n1, { text: 'From Nani.' })]);
check('[B-REQ-009] a family letter sent with in_book goes to the parents, not into the book',
  r.results[0].approval === 'pending' && r.results[0].in_book === false);
r = await push(N, [letter(n1, { text: 'From Nani.' })]);
check('re-sending a pending family letter keeps it pending', r.results[0].approval === 'pending');

// Consent pause: V withdraws sensitive-data consent, then pushes.
const v0 = lid(); const v1 = lid();
await as(V, `select public.record_policy_act('sensitive-data', '1.0.0', 'withdraw', 'settings_toggle', 'settings.privacy', '1', 'ios')`);
r = await push(V, [letter(v0), letter(v1)]);
check('[LEGAL-REQ-006] without consent the batch pauses (SCCON), nothing is stored, the detail names the missing consent',
  r.paused === true && r.results.length === 0 && /sensitive-data/.test(r.detail ?? '') && !(await server(v0)));
await as(V, `select public.record_policy_act('sensitive-data', '1.0.0', 'accept', 'consent_sheet', 'consent.sensitive', '1', 'ios')`);
check('after consent the same batch goes through', (await push(V, [letter(v0), letter(v1)])).results.every((x) => x.ok));
check('push takes at most 50 rows', (await codeOf(() => push(A, Array.from({ length: 51 }, () => letter(lid()))))) === '22023');
check('an empty push is a no-op', (await push(A, [])).results.length === 0);

// ── Pull: visibility ─────────────────────────────────────────────────────
const b1 = lid(); const bPriv = lid();
await push(B, [letter(b1, { text: 'Papa here.' }), letter(bPriv, { inBook: false, text: 'Papa private.' })]);
let pa = await pullAll(A, CHILD);
const byId = (rows) => new Map(rows.map((x) => [x.id, x]));
let m = byId(pa.rows);
check('[K-09] own letters come whole: raw transcript and machine edits included', m.get(a1)?.own === true && m.get(a1)?.raw_transcript === 'um she walked to me' && Array.isArray(m.get(a1)?.machine_edits));
check('[K-09] other people\'s letters never carry raw transcript, machine edits or STT metadata',
  m.get(b1) && !('raw_transcript' in m.get(b1)) && !('machine_edits' in m.get(b1)) && !('stt_meta' in m.get(b1)) && !('raw_sha256' in m.get(b1)) && !('search' in m.get(b1)));
check('[B F9] a parent receives the co-parent\'s in-book letter but never a private one', m.has(b1) && !m.has(bPriv));
check('[B F9] parents receive family letters waiting for review, with their state', m.get(n1)?.approval === 'pending');
check('own tombstones come down so other devices learn of the delete', m.get(a2)?.deleted_at !== null && m.get(a2)?.deleted_at !== undefined);
check('the pull reports the caller\'s access', pa.last.access.role === 'parent' && pa.last.access.family_can_read === false);

let pn = await pullAll(N, CHILD);
check('[B-REQ-011] with "Family can read" off a contributor receives only their own letters', pn.rows.length === 1 && pn.rows[0].id === n1 && pn.rows[0].own === true);
check('[B-REQ-004] nothing from the sibling\'s book (not a member)', (await codeOf(() => pull(N, SIB))) === 'P0002');
check('an outsider cannot pull a book', (await codeOf(() => pull(C, CHILD))) === 'P0002');
check('a person who never consented and is not a member cannot pull', (await codeOf(() => pull(U, CHILD))) === 'P0002');

// ── Pull: cursor ─────────────────────────────────────────────────────────
const again = await pull(A, CHILD, pa.cursor);
check('a pull from the latest cursor returns nothing and does no extra work', again.rows.length === 0 && !('visible_count' in again));
await push(B, [letter(b1, { text: 'Papa here, edited.' })]);
let next = await pull(A, CHILD, again.cursor);
check('an edit arrives exactly once on the next pull', next.rows.length === 1 && next.rows[0].id === b1 && next.rows[0].final_text === 'Papa here, edited.');
check('the cursor moves past it', (await pull(A, CHILD, next.cursor)).rows.length === 0);

const many = Array.from({ length: 5 }, () => lid());
await push(A, many.map((id) => letter(id, { text: 'Page test.' })));
const paged = await pullAll(A, CHILD, next.cursor, 2);
check('paging returns every changed row once, in version order', paged.rows.length === 5 && new Set(paged.rows.map((x) => x.id)).size === 5
  && paged.calls === 3 && paged.rows.every((x, i, a) => i === 0 || BigInt(a[i - 1].sync_xid) <= BigInt(x.sync_xid)));

// ── Pull: removals ───────────────────────────────────────────────────────
const before = await pull(A, CHILD, paged.cursor, { ids: true });
await push(B, [letter(b1, { text: 'Papa here, edited.', inBook: false })]);
const afterPrivate = await pull(A, CHILD, before.cursor);
check('a letter made private is not sent as a row', afterPrivate.rows.length === 0);
check('but the checksum changes, so the phone knows to look', afterPrivate.visible_count === before.visible_count - 1);
const idsNow = await pull(A, CHILD, afterPrivate.cursor, { ids: true });
check('the id list holds only letters the caller may read, and drops the private one',
  !idsNow.visible_ids.includes(b1) && idsNow.visible_ids.includes(n1) && !idsNow.visible_ids.includes(a1));
check('the checksum matches what a phone computes from the id list',
  checksum(idsNow.visible_ids) === Number(idsNow.visible_sum) && idsNow.visible_ids.length === Number(idsNow.visible_count));

// ── Contributors with "Family can read" on ───────────────────────────────
await as(A, `update children set family_can_read = true where id=$1`, [CHILD]);
pn = await pullAll(N, CHILD);
m = byId(pn.rows);
check('[B-REQ-011] with "Family can read" on a contributor receives in-book letters, without working material',
  m.has(a1) && !('raw_transcript' in m.get(a1)) && !m.has(aPriv) && !m.has(b1));
check('[B-REQ-009] a contributor never receives another family member\'s pending letter', !m.has(v0));
check('the access signature changes with the setting', pn.last.access.family_can_read === true);

// ── Stable prefix: a slow write is delayed, never skipped ────────────────
// Simulates a transaction that took its id before others committed: the row
// carries an id at or above the oldest running one. It is held back until no
// older transaction can still commit, then delivered.
const slow = lid();
await push(A, [letter(slow, { text: 'Slow write.' })]);
const head = await pull(A, CHILD, idsNow.cursor);
const ahead = BigInt((await sys(`select pg_snapshot_xmax(pg_current_snapshot())::text x`)).rows[0].x) + 3n;
await sys(`set session_replication_role = replica`);
await sys(`update entries set sync_xid = $1::xid8 where id=$2`, [ahead.toString(), slow]);
await sys(`set session_replication_role = origin`);
const held = await pull(A, CHILD, head.cursor);
check('a row from a transaction newer than the snapshot horizon is not returned yet', !held.rows.some((x) => x.id === slow));
check('and the cursor does not move past it', BigInt(held.cursor.split(':')[1]) <= ahead);
for (let i = 0; i < 6; i++) await sys(`select pg_current_xact_id()`);
const released = await pull(A, CHILD, held.cursor);
check('once older transactions are done it is delivered', released.rows.some((x) => x.id === slow));

// ── Restores ─────────────────────────────────────────────────────────────
check('a cursor from another epoch asks the phone to start over', (await pull(A, CHILD, `7:1:${ZERO}`)).reset === true);
check('a cursor ahead of the server (restored database) asks the phone to start over', (await pull(A, CHILD, `1:999999999:${ZERO}`)).reset === true);
check('a malformed cursor is a client bug', (await codeOf(() => pull(A, CHILD, 'nonsense'))) === '22023'
  && (await codeOf(() => pull(A, CHILD, '1:abc:def'))) === '22023');
check('limits are bounded', (await codeOf(() => pull(A, CHILD, null, { limit: 0 }))) === '22023' && (await codeOf(() => pull(A, CHILD, null, { limit: 501 }))) === '22023');
await sys(`select set_config('app.sync_epoch', '2', false)`);
const e2 = await pull(A, CHILD, released.cursor);
check('after the founder bumps the epoch every old cursor resets', e2.reset === true && e2.epoch === '2');
await sys(`select set_config('app.sync_epoch', '', false)`);

// ── Books ────────────────────────────────────────────────────────────────
const booksA = (await one(A, `select public.sync_books() r`)).r;
const asha = booksA.books.find((b) => b.id === CHILD);
check('sync_books lists the caller\'s live books', booksA.books.length === 2 && asha?.role === 'parent' && asha?.created_by_me === true);
check('parents see the full birthday and their own signature', asha.date_of_birth === '2025-05-20' && asha.my_signs_as === 'Mama');
check('parents see open invites, never the token', asha.invites.length === 1 && asha.invites[0].role === 'parent' && !JSON.stringify(asha).includes(openInvite));
check('members carry the signature the family uses', asha.members.some((x) => x.profile_id === N && x.signs_as === 'Nani' && x.role === 'contributor'));
check('the first-run batch is closed after it was used', booksA.first_run_open === false);
const booksN = (await one(N, `select public.sync_books() r`)).r;
const ashaN = booksN.books[0];
check('[D-039] contributors get the birthday month and day only, never the year or the due date',
  booksN.books.length === 1 && ashaN.date_of_birth === null && ashaN.birthday_md === '05-20' && ashaN.due_date === null);
check('[S-9] contributors never see invites', ashaN.invites === null && ashaN.my_signs_as === 'Nani');
check('a new account has no books and an open first run', (await one(C, `select public.sync_books() r`)).r.books.length === 0
  && (await one(C, `select public.sync_books() r`)).r.first_run_open === true);
await as(A, `select public.request_book_deletion($1, 'ios')`, [SIB]);
check('a deleted book leaves the list and can no longer be pulled',
  !(await one(A, `select public.sync_books() r`)).r.books.some((b) => b.id === SIB) && (await codeOf(() => pull(A, SIB))) === 'P0002');

// ── Cost: an idle pull is an index probe (scale) ─────────────────────────
await sys(`set enable_seqscan = off`);
const plan = (await as(A, `explain select 1 from entries e where e.child_id = $1 and (e.sync_xid, e.id) > ('5'::xid8, '${ZERO}'::uuid) and e.sync_xid < '9'::xid8 order by e.sync_xid, e.id limit 200`, [CHILD]))
  .rows.map((x) => x['QUERY PLAN']).join('\n');
await sys(`set enable_seqscan = on`);
check('the changed-rows scan uses the (child_id, sync_xid, id) index', /entries_sync_cursor_idx/.test(plan) || console.log(plan));
const t = [];
for (let i = 0; i < 40; i++) { const s = performance.now(); await pull(A, CHILD, released.cursor); t.push(performance.now() - s); }
t.sort((x, y) => x - y);
console.log(`      idle pull p95 ${t[Math.floor(t.length * 0.95)].toFixed(2)} ms (PGlite, includes session switch)`);
check('an idle pull stays cheap (p95 under 25 ms in PGlite)', t[Math.floor(t.length * 0.95)] < 25);

done();
