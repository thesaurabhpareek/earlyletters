// A letter is checked at write time for an array machine_edits (20261023040000_entries_machine_edits_check.sql;
// the gap recorded in 20261023030000_held_drafts_write_checks.sql). An entry.upsert, entry.reupload or a direct
// Data API write whose machine_edits is not a JSON array is refused with 23514, so nothing the contract refuses is
// stored and the author's book pull keeps parsing; every answer is parsed with the contract itself
// (packages/api/src/server/sync.ts, read here through Node's type stripping); letters stored before the file are
// never changed, and while one of them fails the check the file refuses whole (55000) and leaves no check behind.
// Fictional family "Asha" only (CLAUDE.md).
import { readFileSync } from 'node:fs';
import { createDb, users, uuid7 } from './harness.mjs';

const files = process.argv.slice(2);
const mine = files.find((f) => f.includes('20261023040000'));
// The files before this one (run.mjs passes them in filename order), never a later one; and the files before 20261023030000.
const before = files.slice(0, files.indexOf(mine));
const beforeHeldChecks = files.slice(0, files.findIndex((f) => f.includes('20261023030000')));
const h = await createDb(files);
const { check, as, sys, one, codeOf, done } = h;
const { A, B } = users;

// The contract the app parses with, and the app's SQLSTATE rules. Node 22.18 and later strip the types.
let contract = null;
let envelope = null;
try {
  contract = await import(new URL('../../packages/api/src/server/sync.ts', import.meta.url).href);
  envelope = await import(new URL('../../packages/api/src/envelope.ts', import.meta.url).href);
} catch {
  contract = null;
}
check('the contract (packages/api/src/server/sync.ts and envelope.ts) loads, so every answer below is parsed with it (needs Node 22.18 or later)',
  !!contract?.parsePushResponse && !!contract?.parsePullResponse && !!envelope?.classifySqlstate);
if (!contract) done();
const { parsePushResponse, parsePullResponse } = contract;
const { classifySqlstate } = envelope;

const setUp = async (db) => {
  await db.sys(`insert into auth.users values ('${A}'),('${B}')`);
  await db.publishPolicies();
  for (const u of [A, B]) await db.consent(u);
  const child = await db.newChild(A, 'Asha', '2025-04-12');
  await db.join(B, 'parent', child, A);
  return child;
};
const CHILD = await setUp(h);

let n = 0;
const id7 = () => uuid7(Date.now() - 5000 + ++n);
const op = (type, id, data = {}, extra = {}) => ({ op: id7(), type, id, data, ...extra });
const pushOn = (x) => async (uid, ops) => {
  await x.sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await x.one(uid, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).r;
};
const pullOn = (x) => async (uid, since) => {
  await x.sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await x.one(uid, `select public.sync_pull($1::jsonb, 200) r`, [JSON.stringify(since)])).r;
};
const push = pushOn({ sys, one });
const pull = pullOn({ sys, one });
const NOW = new Date().toISOString();
// Every EntryData key the app sends (outbox.ts entrySnapshot).
const letter = (id, child, extra = {}) => ({
  id, child_id: child, kind: 'letter', occurred_on: '2026-10-01', captured_at: NOW, capture_mode: 'spoken', edit_level: 'clean',
  prompt_key: null, engine_version: 5, raw_transcript: 'um you laughed at the rain', machine_edits: [{ type: 'filler', start: 0, end: 3 }],
  final_text: 'You laughed at the rain.', in_book: true, sounds_like_me: null, author_signs_as: 'Mama', audio_kept_on_device: true,
  occurred_precision: 'day', base_direction: 'ltr', ...extra,
});
const held = (id, child, extra = {}) => ({
  id, child_id: child, kind: 'held_words', capture_mode: 'spoken', created_at: NOW, occurred_on: '2026-10-02',
  occurred_precision: 'day', language: null, base_direction: 'ltr', prompt_key: null, in_book_choice: true,
  raw_transcript: 'um you hummed all the way home', final_text: 'You hummed all the way home.',
  machine_edits: [{ type: 'filler', start: 0, end: 3 }], edit_level: 'clean', author_edits: null, locked_spans: null,
  typed_text: null, engine_version: 5, pack_ref: null, audio_kept_on_device: true, ...extra,
});
const rowOf = async (x, id) => (await x.sys(`select machine_edits, jsonb_typeof(machine_edits) t, final_text, in_book, deleted_at,
  sync_xid::text v, text_xid::text tx, updated_at from entries where id = $1`, [id])).rows[0];
const heldOf = async (x, id) => (await x.sys(`select final_text, text_xid::text tx from held_drafts where id = $1`, [id])).rows[0];
const NAME = 'entries_machine_edits_shape';
const validated = async (x) => (await x.sys(`select convalidated from pg_constraint where conrelid = 'public.entries'::regclass
  and conname = $1`, [NAME])).rows.map((c) => c.convalidated);
const pushParses = (r) => parsePushResponse(r).ok;
// Error code and message of a failing call (the message is checked for privacy), or 'ok'.
const errOf = async (fn) => { try { await fn(); return { code: 'ok', message: '' }; } catch (e) { return { code: e.code ?? 'error', message: e.message ?? '' }; } };
const lockTimeout = async (x) => (await x.sys('show lock_timeout')).rows[0].lock_timeout;
const FILE_SQL = readFileSync(mine, 'utf8');
// jsonb keeps its own key order, so a stored edit list is compared in SQL.
const sameEdits = async (x, id, edits) => (await x.sys(`select machine_edits = $2::jsonb s from entries where id = $1`,
  [id, JSON.stringify(edits)])).rows[0]?.s === true;
const ownPull = { books: {}, held: { cursor: null } };
const booksOf = (p) => (p.ok ? p.value.books ?? [] : []);
const rowsOf = (p) => booksOf(p).flatMap((b) => b.rows);

// --- 0. Shape ------------------------------------------------------------------
check('the check exists on entries and, on a database with no letters yet, is validated',
  JSON.stringify(await validated(h)) === '[true]');
const def = (await sys(`select pg_get_constraintdef(oid) d from pg_constraint where conrelid = 'public.entries'::regclass and conname = $1`,
  [NAME])).rows[0]?.d;
check('[contract] it takes exactly a JSON array: no size cap of its own, no element check, no null branch (no stricter, no looser)',
  def === `CHECK ((jsonb_typeof(machine_edits) = 'array'::text))`);
const col = (await sys(`select is_nullable, column_default from information_schema.columns
  where table_schema = 'public' and table_name = 'entries' and column_name = 'machine_edits'`)).rows[0];
check('the column is still not null with the default [] (SQL null was refused already, 23502)',
  col.is_nullable === 'NO' && col.column_default === `'[]'::jsonb`);
check('a second run is refused (55000), and changes nothing', (await codeOf(() => h.db.exec(readFileSync(mine, 'utf8')))) === '55000'
  && JSON.stringify(await validated(h)) === '[true]');
{
  const early = await createDb(beforeHeldChecks);
  check('a run before 20261023030000 is refused (55000), and adds nothing',
    (await codeOf(() => early.db.exec(readFileSync(mine, 'utf8')))) === '55000' && (await validated(early)).length === 0);
}
{
  const code = FILE_SQL.replace(/--[^\n]*/g, '');
  const at = code.indexOf("perform set_config('lock_timeout', '5s', true);");
  check('[locks] the file sets a local lock_timeout of 5s in the same statement, before it asks for the exclusive lock on entries',
    at > 0 && at < code.indexOf('alter table public.entries add constraint entries_machine_edits_shape'));
}
check('[contract] the app treats 23514 and 23502 as a permanent refusal (classifySqlstate: reject, never retried)',
  ['23514', '23502'].every((c) => classifySqlstate(c).action === 'reject' && classifySqlstate(c, 'queue').action === 'reject'));

// --- 1. A bad entry.upsert is refused 23514; nothing is stored; the rest of the batch goes on --
// JSON null is not SQL null: sync_push keeps it as the jsonb value null, which the column's not null passes.
const BAD = [{}, { type: 'filler', start: 0, end: 3 }, 'removed um', '', 3, 0, true, false, null];
for (const bad of BAD) {
  const id = id7();
  const ok = id7();
  const r = await push(A, [op('entry.upsert', id, letter(id, CHILD, { machine_edits: bad })), op('entry.upsert', ok, letter(ok, CHILD))]);
  const [x, y] = r.results;
  check(`a new letter with machine_edits = ${JSON.stringify(bad)} is refused 23514 and nothing is stored; the next op in the batch applies; the answer parses`,
    x.ok === false && x.code === '23514' && Object.keys(x).sort().join() === 'code,ok,op' && !(await rowOf(h, id))
    && y.ok === true && y.applied === true && !!(await rowOf(h, ok)) && r.paused === false && r.stopped === false && pushParses(r));
}
{
  const id = id7();
  const d = letter(id, CHILD);
  delete d.machine_edits;
  const r = await push(A, [op('entry.upsert', id, d)]);
  check('a letter whose op has no machine_edits key is stored with [] (the default, as before)',
    r.results[0].ok === true && JSON.stringify((await rowOf(h, id)).machine_edits) === '[]' && pushParses(r));
}
{
  const id = id7();
  const r = await push(A, [op('entry.reupload', id, letter(id, CHILD, { machine_edits: { removed: 'um' } }), { known_at: NOW })]);
  check('an entry.reupload with a non-array machine_edits is refused 23514 the same way, nothing stored',
    r.results[0].ok === false && r.results[0].code === '23514' && !(await rowOf(h, id)) && pushParses(r));
}

// --- 2. A stored letter: a bad edit is refused whole, its words, version and time stay --------
const E = id7();
let r = await push(A, [op('entry.upsert', E, letter(E, CHILD))]);
const e0 = await rowOf(h, E);
for (const bad of BAD) {
  r = await push(A, [op('entry.upsert', E, letter(E, CHILD, { final_text: 'You laughed at the rain, then at me.', machine_edits: bad }),
    { changed: ['text'], base: e0.v })]);
  const e1 = await rowOf(h, E);
  check(`an edit of a stored letter with machine_edits = ${JSON.stringify(bad)} is refused 23514 whole: words, edits, version and time stay`,
    r.results[0].ok === false && r.results[0].code === '23514' && e1.v === e0.v && e1.tx === e0.tx && e1.final_text === e0.final_text
    && (await sameEdits(h, E, e0.machine_edits)) && +e1.updated_at === +e0.updated_at && pushParses(r));
}
// The insert row sync_push proposes is checked before the stored letter is met, so the groups an op names do not matter.
r = await push(A, [op('entry.upsert', E, letter(E, CHILD, { in_book: false, machine_edits: {} }), { changed: ['in_book'], base: e0.v })]);
check('an op that does not change the words but carries a non-array machine_edits is refused 23514 whole (in_book stays)',
  r.results[0].code === '23514' && (await rowOf(h, E)).in_book === true && pushParses(r));
r = await push(A, [op('entry.upsert', E, letter(E, CHILD, { in_book: false, author_edits: {} }), { changed: ['in_book'], base: e0.v })]);
check('the same as a bad author_edits already is (the entries checks before this file)',
  r.results[0].code === '23514' && (await rowOf(h, E)).in_book === true && pushParses(r));
r = await push(A, [op('entry.upsert', E, letter(E, CHILD, { final_text: 'Stale words.', machine_edits: 'x' }), { changed: ['text'], base: '1' })]);
check('a stale op with a bad machine_edits is refused 23514 too: it never turns into a words conflict with a current',
  r.results[0].code === '23514' && !('current' in r.results[0]) && (await rowOf(h, E)).final_text === e0.final_text && pushParses(r));
r = await push(A, [op('entry.upsert', E, letter(E, CHILD, { final_text: 'You laughed at the rain, then at me.', machine_edits: [] }),
  { changed: ['text'], base: e0.v })]);
check('a good edit of it still applies (words and version move)',
  r.results[0].ok === true && r.results[0].applied === true && (await rowOf(h, E)).tx !== e0.tx && pushParses(r));

// --- 3. A direct Data API write is checked the same way ----------------------------
check('a direct Data API write is checked the same way: insert and update are 23514, a SQL null is 23502, an array applies',
  (await codeOf(() => as(A, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version,
      raw_transcript, machine_edits, final_text) values ($1, $2, $3, 'letter', current_date, now(), 'typed', 5, 'You smiled.', '{}'::jsonb,
      'You smiled.')`, [id7(), CHILD, A]))) === '23514'
  && (await codeOf(() => as(A, `update entries set machine_edits = '"removed um"'::jsonb where id = $1`, [E]))) === '23514'
  && (await codeOf(() => as(A, `update entries set machine_edits = 'null'::jsonb where id = $1`, [E]))) === '23514'
  && (await codeOf(() => as(A, `update entries set machine_edits = '7'::jsonb where id = $1`, [E]))) === '23514'
  && (await codeOf(() => as(A, `update entries set machine_edits = null where id = $1`, [E]))) === '23502'
  && (await codeOf(() => as(A, `update entries set machine_edits = '[]'::jsonb where id = $1`, [E]))) === 'ok');

// --- 4. Any array applies, and the pull serves every letter ----------------------------
const goods = [[], [{ type: 'filler', start: 0, end: 3 }], [{ type: 'filler', start: 0, end: 3 }, { type: 'restart', start: 4, end: 9 }],
  [1, 'x', null, {}, []]];
const goodIds = [];
for (const g of goods) {
  const id = id7();
  goodIds.push(id);
  r = await push(A, [op('entry.upsert', id, letter(id, CHILD, { machine_edits: g }))]);
  check(`a letter with machine_edits = ${JSON.stringify(g)} applies (any array, as the contract reads it)`,
    r.results[0].ok === true && (await sameEdits(h, id, g)) && pushParses(r));
}
let pa = parsePullResponse(await pull(A, ownPull));
check('the author\'s pull parses and serves every stored letter with an array machine_edits',
  pa.ok && goodIds.every((id) => rowsOf(pa).some((y) => y.id === id && Array.isArray(y.machine_edits)))
  && rowsOf(pa).filter((y) => y.own).every((y) => Array.isArray(y.machine_edits)));
check('the other parent\'s pull parses and never carries machine_edits (author-only)',
  ((p) => p.ok && rowsOf(p).length > 0 && rowsOf(p).every((y) => !('machine_edits' in y)))(parsePullResponse(await pull(B, { books: {} }))));

// --- 5. Keep, and held_state's fallback current (the author's letter when no held row is left) --
{
  const K = id7();
  r = await push(A, [op('held.upsert', K, held(K, CHILD))]);
  const kv = r.results[0].held.v;
  const k0 = await heldOf(h, K);
  r = await push(A, [op('entry.upsert', K, letter(K, CHILD, { final_text: 'You hummed all the way home.', machine_edits: { removed: 'um' } }),
    { held_base: kv })]);
  check('a Keep whose machine_edits is not an array is refused 23514: no letter, the held draft stays as it was',
    r.results[0].ok === false && r.results[0].code === '23514' && !(await rowOf(h, K)) && (await heldOf(h, K))?.tx === k0.tx && pushParses(r));
  // The draft's words move on, so a held.upsert based on its first words is refused with the held words in current.
  r = await push(A, [op('held.upsert', K, held(K, CHILD, { final_text: 'You hummed all the way home, then slept.' }),
    { changed: ['text'], base: kv })]);
  const stale = op('held.upsert', K, held(K, CHILD, { final_text: 'Stale words.' }), { changed: ['text'], base: kv });
  r = await push(A, [stale]);
  const wv = r.results[0].current?.v;
  check('a stale held.upsert is refused as a words conflict, current from the held row, and parses',
    JSON.stringify(r.results[0].conflict_groups) === '["text"]' && r.results[0].current?.final_text === 'You hummed all the way home, then slept.'
    && pushParses(r));
  r = await push(A, [op('entry.upsert', K, letter(K, CHILD, { final_text: 'You hummed all the way home, then slept.', machine_edits: [] }),
    { held_base: wv })]);
  check('the Keep with an array applies: the letter takes the id and its held row goes',
    r.results[0].ok === true && r.results[0].applied === true && !!(await rowOf(h, K)) && !(await heldOf(h, K)) && pushParses(r));
  r = await push(A, [stale]);
  const x = r.results[0];
  check('[held_state fallback] the repeat of the refused held.upsert carries the author\'s letter as current, and the whole answer parses',
    x.dup === true && x.current?.final_text === 'You hummed all the way home, then slept.' && Array.isArray(x.current.machine_edits)
    && pushParses(r));
}

// --- 6. Letters stored before the file: one that fails makes the file refuse whole (55000) ------
{
  const old = await createDb(before, { defaultGrants: 'legacy' });   // the old server wrote only with the old automatic grants
  const child = await setUp(old);
  const oldPush = pushOn(old);
  const oldPull = pullOn(old);
  const ids = { obj: id7(), nul: id7(), str: id7(), good: id7(), good2: id7() };
  r = await oldPush(A, [
    op('entry.upsert', ids.obj, letter(ids.obj, child, { machine_edits: { removed: 'um' } })),
    op('entry.upsert', ids.nul, letter(ids.nul, child, { machine_edits: null })),
    op('entry.upsert', ids.str, letter(ids.str, child, { machine_edits: 'removed um' })),
    op('entry.upsert', ids.good, letter(ids.good, child)),
    op('entry.upsert', ids.good2, letter(ids.good2, child, { machine_edits: [] })),
  ]);
  const types = await Promise.all([ids.obj, ids.nul, ids.str].map(async (i) => (await rowOf(old, i))?.t));
  check('[the gap] before the file, the old server stored an object, a JSON null and a string as sent',
    r.results.every((y) => y.ok === true) && JSON.stringify(types) === '["object","null","string"]');
  check('[the gap] before the file, one such letter makes the author\'s whole pull answer invalid (every book in it)',
    !parsePullResponse(await oldPull(A, ownPull)).ok);
  check('[the gap] the other parent\'s pull still parses (book_entries never carries machine_edits)',
    parsePullResponse(await oldPull(B, { books: {} })).ok);
  // The held_state fallback before the file: a Keep with a non-array machine_edits, then the repeat of a refused held.upsert.
  const K = id7();
  r = await oldPush(A, [op('held.upsert', K, held(K, child))]);
  const kv = r.results[0].held.v;
  await oldPush(A, [op('held.upsert', K, held(K, child, { final_text: 'You hummed, then slept.' }), { changed: ['text'], base: kv })]);
  const stale = op('held.upsert', K, held(K, child, { final_text: 'Stale words.' }), { changed: ['text'], base: kv });
  r = await oldPush(A, [stale]);
  await oldPush(A, [op('entry.upsert', K, letter(K, child, { final_text: 'You hummed, then slept.', machine_edits: { removed: 'um' } }),
    { held_base: r.results[0].current.v })]);
  r = await oldPush(A, [stale]);
  check('[the gap] before the file, held_state\'s fallback current carries the letter\'s non-array machine_edits and the whole push answer is invalid',
    r.results[0].dup === true && r.results[0].current?.machine_edits?.removed === 'um' && !pushParses(r));

  // The author could write straight through the Data API too (review A N6 on #258).
  const direct = id7();
  check('[the gap] before the file, a direct Data API write of a non-array applied too (an insert of {} and an update to JSON null)',
    (await codeOf(() => old.as(A, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version,
        raw_transcript, machine_edits, final_text) values ($1, $2, $3, 'letter', current_date, now(), 'typed', 5, 'You smiled.', '{}'::jsonb,
        'You smiled.')`, [direct, child, A]))) === 'ok'
    && (await codeOf(() => old.as(A, `update entries set machine_edits = 'null'::jsonb where id = $1`, [ids.good2]))) === 'ok'
    && (await rowOf(old, direct)).t === 'object' && (await rowOf(old, ids.good2)).t === 'null');
  const failing = [ids.obj, ids.nul, ids.str, K, direct, ids.good2];

  const snap = async () => JSON.stringify((await old.sys(`select e::text r from entries e order by id`)).rows);
  const before0 = await snap();
  const lock0 = await lockTimeout(old);
  const refused = await errOf(() => old.db.exec(FILE_SQL));
  check('[existing rows] over 6 failing letters the file refuses: 55000, with the count and the constraint name only',
    refused.code === '55000'
    && refused.message === 'entries_machine_edits_shape: 6 stored letters fail it; nothing applied, no row changed (supabase/APPLY.md, File 23)');
  check('[existing rows] the refused file rolled back whole: no constraint is left behind, not even NOT VALID',
    (await validated(old)).length === 0
    && (await old.sys(`select count(*)::int c from pg_constraint where conname = $1`, [NAME])).rows[0].c === 0);
  check('[constitution] no stored letter is changed or deleted (every column, versions and times included)', (await snap()) === before0);
  check('[privacy] the refusal names the check and a count only: no id, no value, no words',
    ![...Object.values(ids), K, direct].some((i) => refused.message.includes(i)) && !/removed|laughed|hummed|smiled|null|string|object/.test(refused.message));
  check('[locks] the lock_timeout the file sets is local: after the refused run the session has its own value again',
    (await lockTimeout(old)) === lock0);
  // With no check left behind, the paths reviews A and B named go on for the failing letters (N1, N4).
  let o = await oldPush(A, [op('entry.delete', ids.obj)]);
  const del = (await rowOf(old, ids.obj)).deleted_at !== null;
  o = await oldPush(A, [op('entry.restore', ids.obj)]);
  check('[existing rows] Delete and Restore of a failing letter still go on after the refused run',
    del && o.results[0].ok === true && (await rowOf(old, ids.obj)).deleted_at === null && pushParses(o));
  check('[existing rows] the author can still ask for account deletion and cancel it again (no check refuses the update over their letters)',
    (await codeOf(() => old.as(A, `select * from public.request_account_deletion('ios')`))) === 'ok'
    && (await codeOf(() => old.as(A, `select public.cancel_account_deletion()`))) === 'ok'
    && (await old.sys(`select status from deletion_requests where profile_id = $1`, [A])).rows.map((x) => x.status).join() === 'cancelled'
    && (await old.sys(`select count(*)::int c from entries where author_id = $1 and deleted_at is not null`, [A])).rows[0].c === 0);
  // Count 0. Here the author erases each failing letter with Erase now (the author's own act); a repair of a stored
  // edit list is a decision for the owner, never an operator step or a test fixture (APPLY.md File 23).
  const erased = [];
  for (const i of failing) erased.push((await oldPush(A, [op('entry.erase', i)])).results[0].erased === true);
  const left = (await old.sys(`select count(*)::int c from entries where jsonb_typeof(machine_edits) <> 'array'`)).rows[0].c;
  const notices = [];
  const applied = await codeOf(() => old.db.exec(FILE_SQL, { onNotice: (m) => notices.push(`${m.severity} ${m.message}`) }));
  check('[existing rows] once no stored letter fails it, the same file applies on its next run and validates (the refused run left nothing)',
    erased.every(Boolean) && left === 0 && applied === 'ok' && JSON.stringify(await validated(old)) === '[true]'
    && JSON.stringify(notices) === JSON.stringify(['NOTICE entries_machine_edits_shape: 0 stored letters fail it; validated']));
  const fresh = id7();
  o = await oldPush(A, [op('entry.upsert', fresh, letter(fresh, child, { machine_edits: {} }))]);
  check('[existing rows] from then on a new bad letter is refused 23514, and the author\'s pull parses',
    o.results[0].code === '23514' && !(await rowOf(old, fresh)) && pushParses(o) && parsePullResponse(await oldPull(A, ownPull)).ok);
}

// --- 7. Letters stored before the file that pass: validated at once, untouched ------------
{
  const old = await createDb(before, { defaultGrants: 'legacy' });   // the old server wrote only with the old automatic grants
  const child = await setUp(old);
  const oldPush = pushOn(old);
  const ids = [];
  for (const g of goods) {
    const id = id7();
    ids.push(id);
    await oldPush(A, [op('entry.upsert', id, letter(id, child, { machine_edits: g }))]);
  }
  const snap = async () => JSON.stringify((await old.sys(`select e::text r from entries e order by id`)).rows);
  const before0 = await snap();
  const notices = [];
  const lock0 = await lockTimeout(old);
  const applied = await codeOf(() => old.db.exec(FILE_SQL, { onNotice: (m) => notices.push(`${m.severity} ${m.message}`) }));
  check('[existing rows] over letters that all pass, the file applies, validates the check and says so (a NOTICE, no WARNING)',
    applied === 'ok' && JSON.stringify(await validated(old)) === '[true]' && (await lockTimeout(old)) === lock0
    && JSON.stringify(notices) === JSON.stringify(['NOTICE entries_machine_edits_shape: 0 stored letters fail it; validated']));
  check('[constitution] the letters already stored are unchanged and their pull parses',
    (await snap()) === before0 && ((p) => p.ok && ids.every((id) => rowsOf(p).some((y) => y.id === id)))(parsePullResponse(await pullOn(old)(A, ownPull))));
}

done();
