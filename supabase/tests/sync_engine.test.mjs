// Sync engine v1.0 (20261004100000_sync_engine.sql): batched push with op ids,
// multi-book cursor pull, digest-based removal, restore epochs and re-upload,
// rate limits. The phone side is apps/mobile/src/lib/sync (tested end to end
// against this SQL in apps/mobile/test/sync-e2e.test.ts).
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, done, publishPolicies, consent, invite, join } = h;
const { A, B, C, N, U, W } = users;
const V = '99999999-9999-9999-9999-999999999999'; // co-parent who withdraws sensitive-data consent

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${U}'),('${V}'),('${W}')`);
await publishPolicies();
for (const u of [A, B, C, N, V]) await consent(u);

const ZERO = '00000000-0000-0000-0000-000000000000';
let n = 0;
const id7 = () => uuid7(Date.now() - 5000 + ++n);
const op = (type, id, data = {}, extra = {}) => ({ op: id7(), type, id, data, ...extra });
const resetRate = (uid) => sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
const push = async (uid, ops, { keepRate = false } = {}) => {
  if (!keepRate) await resetRate(uid);
  return (await one(uid, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).r;
};
const pull = async (uid, since = {}, limit = 200, { keepRate = false } = {}) => {
  if (!keepRate) await resetRate(uid);
  return (await one(uid, `select public.sync_pull($1::jsonb, $2) r`, [JSON.stringify(since), limit])).r;
};
const server = async (id) => (await sys(`select sync_xid::text v, final_text, raw_transcript, in_book, approval, deleted_at,
  updated_at, sounds_like_me, occurred_on::text, sync_restored_from from entries where id=$1`, [id])).rows[0];
const versions = async (id) => Number((await sys(`select count(*) c from entry_versions where entry_id=$1`, [id])).rows[0].c);
const h48 = (id) => parseInt(id.replace(/-/g, '').slice(-12), 16);
const digest = (ids) => ({ n: ids.length, sum: ids.reduce((s, x) => (s + h48(x)) % 2 ** 48, 0) });
const book = (r, child) => r.books.find((b) => b.id === child);

// ── Books through push (first run, then a later book) ────────────────────
const CHILD = uuid7(Date.now() - 60000);
const SIB = uuid7(Date.now() - 59000);
const firstRun = op('book.first_run', id7(), { children: [
  { id: CHILD, name: 'Asha', date_of_birth: '2025-05-20' },
  { id: SIB, name: 'Nina', date_of_birth: '2026-08-01' },
] });
let r = await push(A, [firstRun]);
check('[A-REQ-015] book.first_run creates every first-run book under the device ids',
  r.results[0].ok && r.results[0].books.length === 2 && (await sys(`select count(*)::int c from children where created_by=$1`, [A])).rows[0].c === 2);
r = await push(A, [firstRun]);
check('a retried op is reported as a duplicate and changes nothing', r.results[0].ok && r.results[0].dup === true);
await join(B, 'parent', CHILD, A);
await join(N, 'contributor', CHILD, A);
// A third parent: allowed here only by raising the D-069 setting (20261005000000, default 2).
await sys(`select set_config('app.max_parents_per_book', '3', false)`);
await join(V, 'parent', CHILD, A);
await sys(`select set_config('app.max_parents_per_book', '', false)`);

const letter = (id, { child = CHILD, text = 'She walked to me.', raw = 'um she walked to me', inBook = true, extra = {} } = {}) => ({
  id, child_id: child, kind: 'letter', occurred_on: '2026-09-29', captured_at: '2026-09-29T20:00:00Z', capture_mode: 'spoken',
  edit_level: 'clean', prompt_key: null, engine_version: 2, raw_transcript: raw,
  machine_edits: [{ type: 'filler', start: 0, end: 3, original: 'um ', replacement: '', source: 'rules' }], final_text: text,
  in_book: inBook, sounds_like_me: null, author_signs_as: 'Mama', audio_kept_on_device: true, ...extra,
});
const upsert = (data, extra = {}) => op('entry.upsert', data.id, data, extra);

// ── Push: idempotency and field groups ───────────────────────────────────
const a1 = id7(); const a2 = id7(); const aPriv = id7();
const ins = upsert(letter(a1));
r = await push(A, [ins, upsert(letter(a2, { text: 'Two teeth.' })), upsert(letter(aPriv, { inBook: false, text: 'Just for me.' }))]);
check('[DATA-REQ-044] entry.upsert inserts letters under the device ids',
  r.paused === false && r.stopped === false && r.results.every((x) => x.ok && x.applied) && (await server(a1)).final_text === 'She walked to me.');
check('each result carries the server version and time', r.results.every((x) => /^\d+$/.test(x.entry.v) && x.entry.updated_at));
const v1 = (await server(a1)).v;
r = await push(A, [ins]);
check('[DATA-REQ-044] the same op id again is a duplicate: no write, same version', r.results[0].dup === true && r.results[0].entry.v === v1);
r = await push(A, [upsert(letter(a1))]);
check('a new op with the same state writes nothing (no version bump, no history row)',
  r.results[0].ok && (await server(a1)).v === v1 && (await versions(a1)) === 0);

const edit1 = upsert(letter(a1, { text: 'She walked to me, all the way.' }), { changed: ['text'], base: v1 });
r = await push(A, [edit1]);
const s1 = await server(a1);
check('an edit changes the words and moves the version', s1.final_text === 'She walked to me, all the way.' && BigInt(s1.v) > BigInt(v1) && (await versions(a1)) === 1);
r = await push(A, [upsert(letter(a1, { text: 'stale words from a phone that only changed in_book', inBook: false }), { changed: ['in_book'] })]);
check('[TDD 02 3.6] an in_book change never carries stale words with it (field groups)',
  (await server(a1)).final_text === 'She walked to me, all the way.' && (await server(a1)).in_book === false);
await push(A, [upsert(letter(a1, { text: 'x' }), { changed: ['in_book'] })]);
const edit2 = upsert(letter(a1, { text: 'Newest words.' }), { changed: ['text', 'in_book'] });
await push(A, [edit2]);
r = await push(A, [edit1]);
check('a late retry of an older op never overwrites newer words (receipt)', r.results[0].dup === true && (await server(a1)).final_text === 'Newest words.');
r = await push(A, [upsert(letter(a1, { text: 'Second phone words.' }), { changed: ['text'], base: v1 })]);
check('[D-023] two phones: the later arrival wins and is flagged as a conflict; the earlier words stay in history',
  r.results[0].applied && r.results[0].conflict === true && (await server(a1)).final_text === 'Second phone words.'
  && (await sys(`select 1 from entry_versions where entry_id=$1 and final_text='Newest words.'`, [a1])).rows.length === 1);

r = await push(A, [upsert(letter(a1, { text: 'Second phone words.', raw: 'a different raw' })), upsert(letter(id7(), { text: 'After the bad one.' }))]);
check('[DATA-REQ-040] a different raw transcript is refused (SCIMM) and the rest of the batch goes on',
  r.results[0].ok === false && r.results[0].code === 'SCIMM' && r.results[1].ok === true && (await server(a1)).raw_transcript === 'um she walked to me');
check('a per-op error carries only the op id and a SQLSTATE, never a message or row text',
  Object.keys(r.results[0]).sort().join(',') === 'code,ok,op');
r = await push(B, [upsert(letter(a1, { text: 'Not mine.' }))]);
check('a letter that belongs to someone else is refused, not taken over', r.results[0].code === '42501' && (await server(a1)).final_text === 'Second phone words.');
r = await push(A, [upsert(letter(id7(), { child: '0192f000-0000-7000-8000-00000000abcd' }))]);
check('a letter for a book the caller is not in is refused', r.results[0].ok === false && r.results[0].code === '42501');

// ── Push: deletes and restores ───────────────────────────────────────────
r = await push(A, [op('entry.delete', a2)]);
check('entry.delete tombstones with the server clock', r.results[0].ok && r.results[0].entry.deleted_at !== null && (await server(a2)).deleted_at !== null);
r = await push(A, [op('entry.delete', a2), op('entry.delete', id7())]);
check('deleting twice is fine, and deleting a letter the server never had is not an error',
  r.results[0].ok && r.results[1].ok && r.results[1].missing === true);
r = await push(A, [upsert(letter(a2, { text: 'Edited offline after the delete.' }), { changed: ['text'] })]);
check('[DATA-REQ-043] the delete wins over an offline edit (SCTMB)', r.results[0].code === 'SCTMB');
r = await push(A, [op('entry.restore', a2), op('entry.restore', id7())]);
check('entry.restore brings it back; restoring an unknown letter reports missing',
  r.results[0].ok && r.results[0].entry.deleted_at === null && r.results[1].missing === true);

// ── Push: books and preferences ──────────────────────────────────────────
r = await push(A, [op('book.update', CHILD, { name: 'Asha Rose' })]);
r = await push(B, [op('book.update', CHILD, { family_can_read: false, nickname: 'Ashu' })]);
const ch = (await sys(`select name, nickname, family_can_read from children where id=$1`, [CHILD])).rows[0];
check('[D-023] book settings merge per field: one parent renames, the other changes another field', ch.name === 'Asha Rose' && ch.nickname === 'Ashu');
r = await push(N, [op('book.update', CHILD, { name: 'Nani says' })]);
check('a family member cannot change book settings (SCPAR)', r.results[0].code === 'SCPAR');
r = await push(C, [op('book.update', CHILD, { name: 'x' })]);
check('a stranger gets not found', r.results[0].code === 'P0002');
r = await push(A, [op('book.update', CHILD, { colour: 'red' })]);
check('unknown book fields are refused', r.results[0].code === '22023');
await push(A, [op('prefs.upsert', CHILD, { signs_as: 'Mama' })]);
await push(A, [op('prefs.upsert', CHILD, { include_in_reminders: false })]);
const pref = (await sys(`select signs_as, include_in_reminders from child_member_prefs where child_id=$1 and profile_id=$2`, [CHILD, A])).rows[0];
check('prefs.upsert merges per field', pref.signs_as === 'Mama' && pref.include_in_reminders === false);
const LATER = uuid7(Date.now() - 1000);
r = await push(A, [op('book.create', LATER, { name: 'Leo', date_of_birth: '2026-09-01' }), op('book.create', LATER, { name: 'Leo', date_of_birth: '2026-09-01' })]);
check('book.create is idempotent on the device id', r.results.every((x) => x.ok) && (await sys(`select count(*)::int c from children where id=$1`, [LATER])).rows[0].c === 1);

// ── Push: consent, deleted books, purged letters ─────────────────────────
const vOld = id7();
await push(V, [upsert(letter(vOld, { text: 'Papa V here.' }))]);
await as(V, `select public.record_policy_act('sensitive-data', '1.0.0', 'withdraw', 'settings_toggle', 'settings.privacy', '1', 'ios')`);
const vNew = id7();
r = await push(V, [op('entry.delete', vOld), upsert(letter(vNew)), upsert(letter(id7()))]);
check('[LEGAL-REQ-006] without consent the batch pauses at the first content write; the op before it is kept',
  r.paused === true && r.results.length === 1 && r.results[0].ok && /sensitive-data/.test(r.consent ?? '') && !(await server(vNew)));
check('[LEGAL-REQ-009] the delete before it went through (deletions are never gated)', (await server(vOld)).deleted_at !== null);
r = await push(V, [upsert(letter(vNew))]);
check('the paused op left no receipt, so it is applied once consent is back', r.paused === true);
await as(V, `select public.record_policy_act('sensitive-data', '1.0.0', 'accept', 'consent_sheet', 'consent.sensitive', '1', 'ios')`);
r = await push(V, [upsert(letter(vNew))]);
check('after consent the same op goes through', r.results[0].ok && r.results[0].applied && (await server(vNew)));

const sibLetter = id7();
await push(A, [upsert(letter(sibLetter, { child: SIB, text: 'For Nina.' }))]);
await as(A, `select public.request_book_deletion($1, 'ios')`, [SIB]);
r = await push(A, [upsert(letter(id7(), { child: SIB }))]);
check('[TDD 02 C10] no new letter in a deleted book (SCDEL)', r.results[0].code === 'SCDEL');
const purged = id7();
await sys(`insert into purge_ledger (entity_type, entity_id) values ('entry', $1)`, [purged]);
r = await push(A, [upsert(letter(purged))]);
check('[TDD 06 FM-R1] a purged letter is never inserted again (SCDEL, gone)', r.results[0].code === 'SCDEL' && r.results[0].gone === true && !(await server(purged)));

// ── Push: limits and bad input ───────────────────────────────────────────
check('push takes at most 50 ops', (await codeOf(() => push(A, Array.from({ length: 51 }, () => upsert(letter(id7())))))) === '22023');
check('push refuses a batch over 256 KB', (await codeOf(() => push(A, [upsert(letter(id7(), { text: 'a'.repeat(19000), raw: 'b'.repeat(39000) })),
  ...Array.from({ length: 4 }, () => upsert(letter(id7(), { text: 'a'.repeat(19000), raw: 'b'.repeat(39000) })))]))) === '22023');
check('push needs an array', (await codeOf(() => push(A, { not: 'an array' }))) === '22023');
r = await push(A, [{ op: id7(), type: 'entry.rewrite', id: a1, data: {} }, upsert(letter(id7()), { changed: ['raw'] }), { type: 'entry.upsert' }, 'nonsense']);
check('unknown op types, unknown field groups and malformed ops fail one by one (22023)', r.results.length === 4 && r.results.every((x) => x.ok === false && x.code === '22023'));
check('an empty push is a no-op', (await push(A, [])).results.length === 0);
await resetRate(A);
let codes = [];
for (let i = 0; i < 61; i++) codes.push(await codeOf(() => push(A, [], { keepRate: true })));
check('[decision 17] push is rate limited per person (60 per minute, SCRAT)', codes.slice(0, 60).every((c) => c === 'ok') && codes[60] === 'SCRAT');
await resetRate(A);
codes = [];
for (let i = 0; i < 121; i++) codes.push(await codeOf(() => pull(A, {}, 1, { keepRate: true })));
check('[decision 17] pull is rate limited per person (120 per minute, SCRAT)', codes.slice(0, 120).every((c) => c === 'ok') && codes[120] === 'SCRAT');
await resetRate(A);
check('[K-08] anonymous sessions are refused', (await codeOf(() => as(W, `select public.sync_pull('{}'::jsonb, 10)`, [], { anonymous: true }))) === 'SCANO'
  && (await codeOf(() => as(W, `select public.sync_push('[]'::jsonb)`, [], { anonymous: true }))) === 'SCANO');
check('the anon role cannot call either RPC', (await codeOf(() => h.asAnon(`select public.sync_pull('{}'::jsonb, 10)`))) === '42501'
  && (await codeOf(() => h.asAnon(`select public.sync_push('[]'::jsonb)`))) === '42501');

// ── Pull: visibility and rows ────────────────────────────────────────────
const b1 = id7(); const bPriv = id7(); const n1 = id7();
await push(B, [upsert(letter(b1, { text: 'Papa here.' })), upsert(letter(bPriv, { inBook: false, text: 'Papa private.' }))]);
await push(N, [upsert(letter(n1, { text: 'From Nani.' }))]);
const pullAll = async (uid, since = {}, limit = 200) => {
  const rows = new Map(); let res; let calls = 0; const books = { ...(since.books ?? {}) };
  do {
    res = await pull(uid, { ...since, books }, limit); calls++;
    for (const bk of res.books) { for (const x of bk.rows) rows.set(x.id, x); books[bk.id] = { ...(books[bk.id] ?? {}), cursor: bk.cursor, access: bk.access, meta: bk.meta_hash }; }
  } while (res.more);
  return { rows, res, calls, books };
};
let pa = await pullAll(A);
let m = pa.rows;
check('[K-09] own letters come whole: raw transcript and edit list included', m.get(a1)?.own === true && m.get(a1)?.raw_transcript === 'um she walked to me' && Array.isArray(m.get(a1)?.machine_edits));
const bRow = m.get(b1);
check('[K-09] other people\'s letters never carry raw transcript, edit list, STT metadata, raw hash, search or delete reason',
  bRow && bRow.own === false && ['raw_transcript', 'machine_edits', 'stt_meta', 'raw_sha256', 'search', 'deleted_reason'].every((c) => !(c in bRow)));
check('[B F9] a parent receives the co-parent\'s in-book letter but never a private one', m.has(b1) && !m.has(bPriv));
check('[B F9] parents receive family letters waiting for review', m.get(n1)?.approval === 'pending');
check('own tombstones come down so the other phones learn of the delete', m.get(vOld) === undefined && [...m.values()].every((x) => x.own || x.deleted_at === null));
check('every row carries its version, rows come in version order', [...m.values()].every((x) => /^\d+$/.test(x.v)));
const asha = book(pa.res, CHILD);
check('[D-039] book settings and members come with the book; parents see the full birthday',
  asha.meta?.name === 'Asha Rose' && asha.meta?.date_of_birth === '2025-05-20' && asha.meta?.my_signs_as === 'Mama'
  && asha.meta?.members.length === 4 && asha.meta?.members.some((x) => x.profile_id === B && x.role === 'parent') && asha.access === 'parent');
check('a deleted book is not listed as a live book', !pa.res.books.some((x) => x.id === SIB) && pa.res.books.some((x) => x.id === LATER));
let pn = await pullAll(N);
check('[B-REQ-011] with "Family can read" off a family member receives only their own letters',
  [...pn.rows.keys()].join() === n1 && book(pn.res, CHILD).access === 'contributor:own');
const nMeta = book(pn.res, CHILD).meta;
check('[D-039] family members get the birthday month and day only, never the year or the due date',
  nMeta.date_of_birth === null && nMeta.birthday_md === '05-20' && nMeta.due_date === null);
check('a stranger has no books', (await pull(C)).books.length === 0);

// ── Pull: cursors and paging ─────────────────────────────────────────────
const paged = await pullAll(A, {}, 2);
check('paging with a small limit returns every row exactly once across books', paged.rows.size === pa.rows.size && paged.calls > 2);
const head = { epoch: pa.res.epoch, books: pa.books };
r = await pull(A, head);
check('a pull from the latest cursors returns nothing', r.books.every((x) => x.rows.length === 0) && r.more === false);
check('settings that did not change are not sent again (meta hash)', r.books.every((x) => !('meta' in x)));
await push(B, [upsert(letter(b1, { text: 'Papa here, edited.' }), { changed: ['text'] })]);
r = await pull(A, head);
check('an edit arrives exactly once on the next pull', book(r, CHILD).rows.length === 1 && book(r, CHILD).rows[0].final_text === 'Papa here, edited.');
const head2 = { epoch: r.epoch, books: Object.fromEntries(r.books.map((x) => [x.id, { cursor: x.cursor, access: x.access, meta: x.meta_hash }])) };
check('and not again after the cursor moved', book(await pull(A, head2), CHILD).rows.length === 0);
await push(B, [op('book.update', CHILD, { name: 'Asha' })]);
r = await pull(A, head2);
check('changed book settings come with the next pull', book(r, CHILD).meta?.name === 'Asha');

// Stable prefix: a row from a transaction newer than the snapshot horizon is held back, never skipped.
const slow = id7();
await push(A, [upsert(letter(slow, { text: 'Slow write.' }))]);
const before = await pull(A, head2);
const hb = { epoch: before.epoch, books: Object.fromEntries(before.books.map((x) => [x.id, { cursor: x.cursor, access: x.access, meta: x.meta_hash }])) };
const ahead = BigInt((await sys(`select pg_snapshot_xmax(pg_current_snapshot())::text x`)).rows[0].x) + 3n;
await sys(`set session_replication_role = replica`);
await sys(`update entries set sync_xid = $1::xid8 where id=$2`, [ahead.toString(), slow]);
await sys(`set session_replication_role = origin`);
const held = await pull(A, hb);
check('a row whose transaction may not have finished is held back', !book(held, CHILD).rows.some((x) => x.id === slow)
  && BigInt(book(held, CHILD).cursor.split(':')[0]) <= ahead);
for (let i = 0; i < 6; i++) await sys(`select pg_current_xact_id()`);
const released = await pull(A, { epoch: held.epoch, books: { ...hb.books, [CHILD]: { ...hb.books[CHILD], cursor: book(held, CHILD).cursor } } });
check('and delivered once every older transaction is done', book(released, CHILD).rows.some((x) => x.id === slow));

// ── Pull: digest, ids and removals ───────────────────────────────────────
const fresh = await pullAll(A);
const mine = [...fresh.rows.values()].filter((x) => x.child_id === CHILD).map((x) => x.id);
const vis = book(fresh.res, CHILD).visible;
check('the digest covers own letters and the letters by others the caller may read', vis.n === mine.length && vis.sum === digest(mine).sum);
const have = digest(mine);
const headF = () => ({ epoch: fresh.res.epoch, books: Object.fromEntries(Object.entries(fresh.books).map(([k, v]) => [k, { ...v, have: k === CHILD ? have : undefined }])) });
r = await pull(A, headF());
check('nothing changed: the phone\'s own digest is echoed back', JSON.stringify(book(r, CHILD).visible) === JSON.stringify(have));
await push(B, [upsert(letter(bPriv, { text: 'Papa private, edited again.', inBook: false }), { changed: ['text'] })]);
r = await pull(A, headF());
check('[privacy] an edit to a letter the caller cannot see changes nothing in the answer',
  book(r, CHILD).rows.length === 0 && JSON.stringify(book(r, CHILD).visible) === JSON.stringify(have));
await push(B, [upsert(letter(b1, { text: 'Papa here, edited.', inBook: false }), { changed: ['in_book'] })]);
r = await pull(A, headF());
check('a letter made private is never sent as a row', book(r, CHILD).rows.length === 0);
check('but the digest changes', book(r, CHILD).visible.n === have.n - 1);
const withIds = await pull(A, { ...headF(), books: { ...headF().books, [CHILD]: { ...headF().books[CHILD], ids: true } } });
const ids = book(withIds, CHILD).ids;
check('the id list holds only letters the caller may hold, and drops the private one', !ids.includes(b1) && ids.includes(n1) && ids.includes(a1) && !ids.includes(bPriv));
check('the digest matches what a phone computes from the id list', JSON.stringify(digest(ids)) === JSON.stringify(book(withIds, CHILD).visible));
const headG = (extra) => ({ epoch: withIds.epoch, books: Object.fromEntries(withIds.books.map((x) => [x.id,
  { cursor: x.cursor, access: x.access, meta: x.meta_hash, ...(x.id === CHILD ? extra : {}) }])) });
r = await pull(A, headG({ have: { n: 1, sum: 1 } }));
check('nothing changed and a wrong digest: echoed, not recomputed (verify asks for a real one)', book(r, CHILD).visible.n === 1);
r = await pull(A, headG({ have: { n: 1, sum: 1 }, verify: true }));
check('verify always recomputes', book(r, CHILD).visible.n === ids.length);

// ── Pull: access changes and books that are gone ─────────────────────────
pn = await pullAll(N);
const nHead = { epoch: pn.res.epoch, books: pn.books };
await push(A, [op('book.update', CHILD, { family_can_read: true })]);
r = await pull(N, nHead);
const nb = book(r, CHILD);
check('[D-023] a change of access pulls the book again from the start', nb.repull === true && nb.access === 'contributor:reads'
  && nb.rows.some((x) => x.id === a1 && !('raw_transcript' in x)) && !nb.rows.some((x) => x.id === aPriv || x.id === bPriv));
check('[B-REQ-009] a family member never receives a letter waiting for review', !nb.rows.some((x) => x.approval === 'pending' && !x.own));
await push(A, [op('book.update', CHILD, { family_can_read: false })]);

const bPull = await pullAll(B);
const bHead = { epoch: bPull.res.epoch, books: bPull.books };
check('[B-REQ-016] B leaves the book: own letters removed, membership gone',
  (await one(B, `select public.request_book_deletion($1, 'ios') r`, [CHILD])).r === 'left_and_removed_own_letters');
r = await pull(B, bHead);
const g = r.gone.find((x) => x.id === CHILD);
check('a book the caller left is reported gone, with the caller\'s own tombstones', g?.reason === 'not_member'
  && g.rows.some((x) => x.id === b1 && x.deleted_at !== null && x.own === true) && g.rows.every((x) => x.own === true) && !r.books.some((x) => x.id === CHILD));
r = await pull(A, { epoch: 1, books: { [SIB]: { cursor: null } } });
check('a deleted book is reported gone as deleted', r.gone.find((x) => x.id === SIB)?.reason === 'deleted');
r = await pull(C, { books: { [CHILD]: { cursor: null } } });
check('asking about a book the caller was never in returns nothing but "not_member"', r.gone[0].reason === 'not_member' && r.gone[0].rows.length === 0);

// ── Pull: bad input, resets ──────────────────────────────────────────────
check('a malformed cursor is a client bug (22023)', (await codeOf(() => pull(A, { books: { [CHILD]: { cursor: 'nonsense' } } }))) === '22023'
  && (await codeOf(() => pull(A, { books: { [CHILD]: { cursor: '1:2:3' } } }))) === '22023'
  && (await codeOf(() => pull(A, { books: { 'not-a-uuid': {} } }))) === '22023');
check('limits are bounded', (await codeOf(() => pull(A, {}, 0))) === '22023' && (await codeOf(() => pull(A, {}, 501))) === '22023');
r = await pull(A, { books: { [CHILD]: { cursor: `999999999:${ZERO}` } } });
check('[TDD 06 P-1] a cursor ahead of the server (restored database) asks the phone to start over', r.reset === true && r.reason === 'cursor_ahead');

// ── Plan: the changed-rows scan is an index range scan ───────────────────
await sys(`set enable_seqscan = off`);
const plan = (await as(A, `explain select 1 from entries e where e.child_id = $1 and (e.sync_xid, e.id) > ('5'::xid8, '${ZERO}'::uuid) and e.sync_xid < '9'::xid8 order by e.sync_xid, e.id limit 200`, [CHILD]))
  .rows.map((x) => x['QUERY PLAN']).join('\n');
await sys(`set enable_seqscan = on`);
check('the pull scan uses the (child_id, sync_xid, id) index', /entries_sync_cursor_idx/.test(plan) || console.log(plan));

// ── Restore epoch and re-upload (TDD 06 P-1) ─────────────────────────────
// Simulate a restore to time T: L1 goes back to an older state, L2 (written after
// T) is gone, L4 is live again although the phone deleted it, L5 is deleted
// again although the phone restored it. Then the operator records epoch 2.
const L1 = id7(); const L2 = id7(); const L3 = id7(); const L4 = id7(); const L5 = id7();
await push(A, [upsert(letter(L1, { text: 'L1 newest.' })), upsert(letter(L2, { text: 'L2 after T.' })), upsert(letter(L3, { text: 'L3.' })),
  upsert(letter(L4, { text: 'L4.' })), upsert(letter(L5, { text: 'L5.' }))]);
await push(A, [op('entry.delete', L4)]);
const known = Object.fromEntries(await Promise.all([L1, L2, L3, L4, L5].map(async (x) => [x, (await server(x)).updated_at])));
const restorePoint = new Date(Date.now() - 3600_000).toISOString();
await sys(`set session_replication_role = replica`);
await sys(`update entries set final_text = 'L1 at backup time.', updated_at = $2 where id = $1`, [L1, restorePoint]);
await sys(`update entries set deleted_at = null, deleted_reason = null, updated_at = $2 where id = $1`, [L4, restorePoint]);
await sys(`update entries set deleted_at = $2, deleted_reason = 'user', updated_at = $2 where id = $1`, [L5, restorePoint]);
await sys(`delete from entries where id = $1`, [L2]);
await sys(`set session_replication_role = origin`);
const epoch2 = (await sys(`select public.sync_begin_epoch('drill', $1) e`, [restorePoint])).rows[0].e;
check('the operator records a new epoch (service role only)', epoch2 === 2 && (await codeOf(() => as(A, `select public.sync_begin_epoch('drill')`))) === '42501');
r = await pull(A, { epoch: 1, books: {} });
check('[TDD 06 P-1] a phone on the old epoch is told to start over, with when the epoch began',
  r.reset === true && r.reason === 'epoch' && r.epoch === 2 && r.epoch_started_at);
// After the restore, L3 is edited normally on another phone.
await push(A, [upsert(letter(L3, { text: 'L3 edited after the restore.' }), { changed: ['text'] })]);
const reup = (id, data, knownAt) => op('entry.reupload', id, data, { known_at: knownAt });
const older = new Date(Date.parse(known[L1]) - 1000).toISOString();
r = await push(A, [
  reup(L1, letter(L1, { text: 'Phone two, older.' }), older),
  reup(L2, letter(L2, { text: 'L2 after T.' }), known[L2]),
  reup(L3, letter(L3, { text: 'L3 stale copy.' }), known[L3]),
  reup(L4, { ...letter(L4, { text: 'L4.' }), deleted: true }, known[L4]),
  reup(L5, letter(L5, { text: 'L5.' }), known[L5]),
]);
check('re-uploads run as ordinary ops (all ok)', r.results.every((x) => x.ok) || console.log(r.results));
check('a letter the restored server lacks is put back', (await server(L2))?.final_text === 'L2 after T.' && r.results[1].applied);
check('a letter the restored server holds older is brought forward', (await server(L1)).final_text === 'Phone two, older.' && r.results[0].applied);
check('a letter edited since the restore is never overwritten by a re-upload', (await server(L3)).final_text === 'L3 edited after the restore.' && r.results[2].applied === false);
check('a letter the phone had deleted is deleted again', (await server(L4)).deleted_at !== null);
check('a letter the phone had restored is live again', (await server(L5)).deleted_at === null);
r = await push(A, [reup(L1, letter(L1, { text: 'L1 newest.' }), known[L1])]);
check('between two phones the newer knowledge wins, whatever the arrival order', (await server(L1)).final_text === 'L1 newest.' && r.results[0].applied);
r = await push(A, [reup(L1, letter(L1, { text: 'Phone two, older.' }), older)]);
check('and the older one arriving last changes nothing', (await server(L1)).final_text === 'L1 newest.' && r.results[0].applied === false);
await push(A, [upsert(letter(L1, { text: 'L1 edited normally.' }), { changed: ['text'] })]);
check('an ordinary write clears the re-upload mark', (await server(L1)).sync_restored_from === null);
r = await push(A, [reup(purged, letter(purged), known[L1])]);
check('a purged letter is not brought back by a re-upload either', r.results[0].code === 'SCDEL' && r.results[0].gone === true);
check('a re-upload needs known_at', (await push(A, [op('entry.reupload', id7(), letter(id7()))])).results[0].code === '22023');

// ── Housekeeping and privileges ──────────────────────────────────────────
await sys(`update sync_op_receipts set applied_at = now() - interval '31 days' where profile_id = $1`, [N]);
const before30 = Number((await sys(`select count(*) c from sync_op_receipts where profile_id=$1`, [N])).rows[0].c);
const hk = (await sys(`select public.sync_housekeeping() r`)).rows[0].r;
check('receipts are kept 30 days (service housekeeping)', before30 > 0 && hk.receipts >= before30
  && Number((await sys(`select count(*) c from sync_op_receipts where profile_id=$1`, [N])).rows[0].c) === 0);
check('people cannot run housekeeping', (await codeOf(() => as(A, `select public.sync_housekeeping()`))) === '42501');
check('people read only their own receipts', (await as(B, `select 1 from sync_op_receipts where profile_id <> $1`, [B])).rows.length === 0
  && (await as(A, `select 1 from sync_op_receipts`)).rows.length > 0);
check('people cannot write epochs', (await codeOf(() => as(A, `insert into sync_epochs (epoch, reason) values (9, 'drill')`))) === '42501');
check('everyone signed in reads the current epoch', Number((await one(B, `select max(epoch) e from sync_epochs`)).e) === 2);

done();
