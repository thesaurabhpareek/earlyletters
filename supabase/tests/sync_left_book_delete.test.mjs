// BL-1960 (F11-REQ-011, DATA-REQ-016): a parent who left a book and kept their in-book letters there can still delete
// and erase those letters through sync_push, and the remaining parent's book loses them within one sync. The phone
// queues entry.delete and entry.erase for a left book's letter on this reading: delete_entry and
// sync_private.erase_entry check only author_id, never current membership. If a later migration starts refusing a
// left member, this file fails first and the phone must stop queueing (apps/mobile/src/lib/store.ts).
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const files = process.argv.slice(2);
const h = await createDb(files);
const { check, as, sys, one, done, publishPolicies, consent, newChild, join } = h;
const { A, B } = users;

await sys(`insert into auth.users values ('${A}'),('${B}')`);
await publishPolicies();
for (const u of [A, B]) await consent(u);
const CHILD = await newChild(A, 'Asha', '2025-04-12');
await join(B, 'parent', CHILD, A);

let n = 0;
const id7 = () => uuid7(Date.now() - 5000 + ++n);
const op = (type, id, data = {}, extra = {}) => ({ op: id7(), type, id, data, ...extra });
const push = async (uid, ops) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await one(uid, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).r;
};
const pull = async (uid, since = {}) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await one(uid, `select public.sync_pull($1::jsonb, 200) r`, [JSON.stringify(since)])).r;
};
const NOW = new Date().toISOString();
const letter = (id, text) => ({
  id, child_id: CHILD, kind: 'letter', occurred_on: '2026-10-01', captured_at: NOW, capture_mode: 'typed',
  edit_level: 'verbatim', prompt_key: null, engine_version: 5, raw_transcript: text, machine_edits: [], final_text: text,
  in_book: true, sounds_like_me: null, author_signs_as: 'Papa', audio_kept_on_device: true,
});
const entry = async (id) => (await sys(`select deleted_at from entries where id = $1`, [id])).rows[0];
const erasure = async (id) => (await sys(`select child_id, author_id from sync_private.entry_erasures where entry_id = $1`, [id])).rows[0];
const book = (r) => r.books.find((b) => b.id === CHILD);
const WRONG = { n: 9999, sum: 1 };
const lbCursor = async (u) => book(await pull(u, { books: { [CHILD]: {} } })).cursor;
const visibleAfter = async (u, cursor) => book(await pull(u, { books: { [CHILD]: { cursor, have: WRONG } } })).visible;
const echoed = (v) => v.n === WRONG.n && v.sum === WRONG.sum;

const D1 = id7();
const E1 = id7();
const H1 = id7();
for (const [id, text] of [[D1, 'You clapped for the rain.'], [E1, 'You hummed in the car.'], [H1, 'You named the dog.']]) {
  const r = await push(B, [op('entry.upsert', id, letter(id, text))]);
  check(`B writes the in-book letter ${text}`, r.results[0].ok === true);
}
check('A reads B\'s in-book letters before B leaves', book(await pull(A, {})).rows.some((y) => y.id === D1));
check('B leaves and keeps the letters in the book', (await one(B, `select public.leave_child($1, true) r`, [CHILD])).r === 'left');

let r = await push(B, [op('entry.delete', D1)]);
check('[BL-1960] a delete from the member who left is accepted', r.results[0].ok === true && !r.results[0].code);
check('[BL-1960] the letter is tombstoned on the server', (await entry(D1))?.deleted_at !== null);
const aAfter = book(await pull(A, {}));
check('[DATA-REQ-016] A\'s next sync no longer carries the deleted letter; the other two are still there',
  !aAfter.rows.some((y) => y.id === D1) && aAfter.rows.some((y) => y.id === E1) && aAfter.rows.some((y) => y.id === H1));

const cA = await lbCursor(A);
r = await push(B, [op('entry.erase', E1)]);
check('[BL-1960] an erase from the member who left erases the letter', r.results[0].ok === true && r.results[0].erased === true && !(await entry(E1)));
check('[BL-1960] the erasure record names the book and the author, ids only', (await erasure(E1))?.child_id === CHILD && (await erasure(E1))?.author_id === B);
check('[ADR 0025 s12] A recomputes the book digest at the next pull', !echoed(await visibleAfter(A, cA)));

await sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by) values ('entry', $1, 'other', 'T-19', 'ops', '2027-01-01')`, [H1]);
r = await push(B, [op('entry.erase', H1)]);
const held = await entry(H1);
check('[BL-1960] under a legal hold the erase from the member who left is deferred: kept and tombstoned',
  r.results[0].ok === true && r.results[0].deferred === true && held && held.deleted_at !== null);

done();
