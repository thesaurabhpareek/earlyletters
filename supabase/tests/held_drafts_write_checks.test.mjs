// Held drafts are checked at write time like letters (20261023030000_held_drafts_write_checks.sql;
// review A on #253, notes N1 and N2). A held.upsert with a value the contract refuses is refused
// with 23514 (as a letter is), so the writing phone keeps its copy; every answer, refusals with a
// `current` from a held row included, parses with the contract itself (packages/api/src/server/sync.ts,
// read here through Node's type stripping); rows stored before the file are never changed, and a
// check one of them fails stays NOT VALID. Fictional family "Asha" only (CLAUDE.md).
import { readFileSync } from 'node:fs';
import { createDb, users, uuid7 } from './harness.mjs';

const files = process.argv.slice(2);
const mine = files.find((f) => f.includes('20261023030000'));
// The files before this one (run.mjs passes them in filename order), never a later one: a later file may refuse a
// run without this one (55000; 20261023050000 does).
const before = files.slice(0, files.indexOf(mine));
const h = await createDb(files);
const { check, as, sys, one, codeOf, done, publishPolicies, consent, newChild } = h;
const { A, B } = users;

// The contract the app parses with. Node 22.18 and later strip the types (CI runs the newest 22).
let contract = null;
try {
  contract = await import(new URL('../../packages/api/src/server/sync.ts', import.meta.url).href);
} catch {
  contract = null;
}
check('the contract (packages/api/src/server/sync.ts) loads, so every answer below is parsed with it (needs Node 22.18 or later)',
  !!contract?.parsePushResponse && !!contract?.parsePullResponse);
if (!contract) done();
const { parsePushResponse, parsePullResponse, CAPTURE_MODES, EDIT_LEVELS } = contract;

const setUp = async (db) => {
  await db.sys(`insert into auth.users values ('${A}'),('${B}')`);
  await db.publishPolicies();
  for (const u of [A, B]) await db.consent(u);
  return db.newChild(A, 'Asha', '2025-04-12');
};
const CHILD = await setUp({ sys, publishPolicies, consent, newChild });

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
// Every HeldDraftData key, as the app sends them (outbox.ts heldFromDraft).
const held = (id, child, extra = {}) => ({
  id, child_id: child, kind: 'held_letter', capture_mode: 'typed', created_at: NOW, occurred_on: '2026-10-02',
  occurred_precision: 'day', language: null, base_direction: 'ltr', prompt_key: null, in_book_choice: true,
  raw_transcript: null, final_text: null, machine_edits: null, edit_level: null, author_edits: null, locked_spans: null,
  typed_text: 'You hummed all the way home.', engine_version: 5, pack_ref: null, audio_kept_on_device: true, ...extra,
});
const letter = (id, child, text) => ({
  id, child_id: child, kind: 'letter', occurred_on: '2026-10-01', captured_at: NOW, capture_mode: 'spoken', edit_level: 'clean',
  prompt_key: null, engine_version: 5, raw_transcript: 'um you laughed at the rain', machine_edits: [], final_text: text,
  in_book: false, sounds_like_me: null, author_signs_as: 'Mama', audio_kept_on_device: true,
});
const rowOf = async (x, id) => (await x.sys(`select capture_mode, edit_level, machine_edits, author_edits, locked_spans, typed_text,
  occurred_on::text d, sync_xid::text v, text_xid::text t, updated_at from held_drafts where id = $1`, [id])).rows[0];
const NAMES = ['held_drafts_capture_mode_check', 'held_drafts_edit_level_check', 'held_drafts_machine_edits_shape',
  'held_drafts_author_edits_shape', 'held_drafts_locked_spans_shape'];
const validated = async (x) => Object.fromEntries((await x.sys(`select conname, convalidated from pg_constraint
  where conrelid = 'public.held_drafts'::regclass and conname = any ($1)`, [NAMES])).rows.map((c) => [c.conname, c.convalidated]));
const pushParses = (r) => parsePushResponse(r).ok;

// --- 0. Shape ----------------------------------------------------------------
let v = await validated(h);
check('the five checks exist on held_drafts and, on a database with no held drafts yet, are validated',
  NAMES.every((c) => v[c] === true));
check('a second run is refused (55000), and changes nothing', (await codeOf(() => h.db.exec(readFileSync(mine, 'utf8')))) === '55000'
  && Object.keys(await validated(h)).length === 5);
const defs = Object.fromEntries((await sys(`select conname, pg_get_constraintdef(oid) d from pg_constraint
  where conrelid = 'public.held_drafts'::regclass and conname = any ($1)`, [NAMES])).rows.map((c) => [c.conname, c.d]));
const listed = (d) => [...d.matchAll(/'([a-z_]+)'::text/g)].map((m) => m[1]).sort();
check('[contract] capture_mode takes exactly CAPTURE_MODES, as entries do (no stricter, no looser)',
  JSON.stringify(listed(defs.held_drafts_capture_mode_check)) === JSON.stringify([...CAPTURE_MODES].sort()));
check('[contract] edit_level takes exactly EDIT_LEVELS, or null while a held draft has no words',
  JSON.stringify(listed(defs.held_drafts_edit_level_check)) === JSON.stringify([...EDIT_LEVELS].sort())
  && /edit_level IS NULL/.test(defs.held_drafts_edit_level_check));
check('[contract] machine_edits, author_edits and locked_spans are null or a JSON array, with no size cap of their own',
  ['machine_edits', 'author_edits', 'locked_spans'].every((c) => {
    const d = defs[NAMES.find((x) => x.includes(c))];
    return new RegExp(`${c} IS NULL\\) OR \\(jsonb_typeof\\(${c}\\) = 'array'::text\\)`).test(d) && !/octet_length/.test(d);
  }));
check('the same checks exist on entries for capture_mode and edit_level (the lists the held checks mirror)',
  (await sys(`select count(*)::int c from pg_constraint where conrelid = 'public.entries'::regclass
               and pg_get_constraintdef(oid) in ($1, $2)`,
    [defs.held_drafts_capture_mode_check.replace(' NOT VALID', ''),
     `CHECK ((edit_level = ANY (ARRAY['clean'::text, 'verbatim'::text])))`])).rows[0].c === 2);

// --- 1. A bad held.upsert is refused 23514; the rest of the batch goes on ----------
const BAD = [
  ['capture_mode', 'voice'], ['capture_mode', 'Spoken'], ['capture_mode', ''],
  ['edit_level', 'fancy'], ['edit_level', 'none'], ['edit_level', ''],
  ['machine_edits', {}], ['machine_edits', 'removed um'], ['machine_edits', 3], ['machine_edits', true],
  ['author_edits', {}], ['author_edits', 'you'], ['author_edits', 0],
  ['locked_spans', {}], ['locked_spans', 'as said'], ['locked_spans', false],
];
const words = { final_text: 'You laughed at the rain.', edit_level: 'clean', machine_edits: [] };
for (const [col, bad] of BAD) {
  const id = id7();
  const ok = id7();
  // A held draft with words, so edit_level and machine_edits are the ones the app would send then.
  const r = await push(A, [op('held.upsert', id, held(id, CHILD, { ...words, [col]: bad })), op('held.upsert', ok, held(ok, CHILD))]);
  const [x, y] = r.results;
  check(`[N1] a new held draft with ${col} = ${JSON.stringify(bad)} is refused 23514 and nothing is stored; the next op in the batch applies; the answer parses`,
    x.ok === false && x.code === '23514' && Object.keys(x).sort().join() === 'code,ok,op' && !(await rowOf(h, id))
    && y.ok === true && !!y.held?.v && !!(await rowOf(h, ok)) && r.paused === false && r.stopped === false && pushParses(r));
}
check('a missing capture_mode is refused as before (23502, not null)',
  await (async () => { const id = id7(); const held1 = held(id, CHILD); delete held1.capture_mode;
    const r = await push(A, [op('held.upsert', id, held1)]); return r.results[0].code === '23502' && pushParses(r); })());

// The same on a row that exists: refused whole, the stored row untouched (words, version, time).
const E = id7();
let r = await push(A, [op('held.upsert', E, held(E, CHILD, { ...words, edit_level: 'verbatim', machine_edits: [{ type: 'filler', start: 0, end: 3 }] }))]);
const e0 = await rowOf(h, E);
for (const [col, bad] of BAD) {
  r = await push(A, [op('held.upsert', E, held(E, CHILD, { ...words, final_text: 'You laughed at the rain, then at me.', occurred_on: '2026-10-03', [col]: bad }),
    { changed: ['text', 'occurred_on'], base: e0.v })]);
  const e1 = await rowOf(h, E);
  check(`[N1] an edit of a stored held draft with ${col} = ${JSON.stringify(bad)} is refused 23514 whole: its words, date and version stay`,
    r.results[0].ok === false && r.results[0].code === '23514' && e1.v === e0.v && e1.t === e0.t && e1.d === e0.d
    && e1.edit_level === 'verbatim' && e1.machine_edits.length === 1 && pushParses(r));
}
r = await push(A, [op('held.upsert', E, held(E, CHILD, { ...words, final_text: 'You laughed at the rain, then at me.', edit_level: 'verbatim', machine_edits: [] }),
  { changed: ['text'], base: e0.v })]);
check('a good edit of it still applies (words and version move)', r.results[0].ok === true && (await rowOf(h, E)).t !== e0.t && pushParses(r));

// Only what the op changes is written (as for a letter): a bad layer outside the groups it names is never stored.
const e2 = await rowOf(h, E);
r = await push(A, [op('held.upsert', E, held(E, CHILD, { ...words, machine_edits: {}, edit_level: 'fancy', occurred_on: '2026-10-04' }),
  { changed: ['occurred_on'], base: e2.v })]);
let e3 = await rowOf(h, E);
check('an op that does not change the words never stores its words layers, bad or not: the date applies, the words stay',
  r.results[0].ok === true && e3.d === '2026-10-04' && e3.t === e2.t && e3.edit_level === 'verbatim' && Array.isArray(e3.machine_edits) && pushParses(r));
// A stale op's words are refused as a words conflict before they are written, so its bad values are never stored either.
r = await push(A, [op('held.upsert', E, held(E, CHILD, { ...words, final_text: 'Stale.', edit_level: 'fancy', machine_edits: 'x', occurred_on: '2026-10-04' }),
  { changed: ['text'], base: '1' })]);
let x = r.results[0];
e3 = await rowOf(h, E);
check('[N2] a stale op with bad words layers is a words refusal: nothing bad stored, current is the stored words, and the answer parses',
  x.ok === true && JSON.stringify(x.conflict_groups) === '["text"]' && x.current?.edit_level === 'verbatim'
  && Array.isArray(x.current.machine_edits) && x.current.v === e3.t && e3.edit_level === 'verbatim' && pushParses(r));

// --- 2. Good values still apply, and the pull drops nothing --------------------
const goods = [
  ...CAPTURE_MODES.map((m) => ({ capture_mode: m })),
  { edit_level: null, final_text: null, machine_edits: null },
  { edit_level: 'clean', final_text: 'You laughed.', machine_edits: [] },
  { edit_level: 'verbatim', final_text: 'Um, you laughed.', machine_edits: [{ type: 'filler', start: 0, end: 3 }] },
  { author_edits: [], locked_spans: [] },
  { author_edits: [{ start: 0, end: 3, replacement: 'You' }], locked_spans: [{ start: 4, end: 11 }] },
  { kind: 'waiting_letter', capture_mode: 'spoken', typed_text: null },
  { kind: 'held_words', capture_mode: 'mixed', raw_transcript: 'um you laughed', final_text: 'You laughed.', edit_level: 'clean', machine_edits: [] },
];
const goodIds = [];
for (const g of goods) {
  const id = id7();
  goodIds.push(id);
  r = await push(A, [op('held.upsert', id, held(id, CHILD, g))]);
  check(`a held draft with ${JSON.stringify(g)} applies`, r.results[0].ok === true && !!(await rowOf(h, id)) && pushParses(r));
}
const p = await pull(A, { books: {}, held: { cursor: null } });
const pp = parsePullResponse(p);
check('[N1] the author\'s held pull parses, drops no row (rejected 0) and serves every good draft',
  pp.ok && pp.value.held?.rejected === 0 && goodIds.every((id) => pp.value.held.rows.some((y) => y.id === id)));
check('a direct Data API write is checked the same way (insert and update, 23514)',
  (await codeOf(() => as(A, `insert into held_drafts (id, author_id, child_id, kind, capture_mode, created_at, occurred_on)
                               values ($1, $2, $3, 'held_letter', 'voice', now(), current_date)`, [id7(), A, CHILD]))) === '23514'
  && (await codeOf(() => as(A, `update held_drafts set machine_edits = '{}'::jsonb where id = $1`, [E]))) === '23514'
  && (await codeOf(() => as(A, `update held_drafts set edit_level = 'fancy' where id = $1`, [E]))) === '23514');

// --- 3. A refusal's current from a held row keeps the whole push answer valid (N2) --
// A Keep that names an older held base, while the held row has words with every layer set.
const K = id7();
r = await push(A, [op('held.upsert', K, held(K, CHILD, { kind: 'held_words', raw_transcript: 'um you laughed', final_text: 'You laughed.',
  edit_level: 'verbatim', machine_edits: [{ type: 'filler', start: 0, end: 3 }], author_edits: [{ start: 0, end: 3, replacement: 'You' }],
  locked_spans: [{ start: 4, end: 11 }] }))]);
const kv = r.results[0].held.v;
await push(A, [op('held.upsert', K, held(K, CHILD, { kind: 'held_words', raw_transcript: 'um you laughed', final_text: 'You laughed, then you slept.',
  edit_level: 'clean', machine_edits: [] }), { changed: ['text'], base: kv })]);
const keep = op('entry.upsert', K, letter(K, CHILD, 'You laughed.'), { held_base: kv });
const L = id7();
const badHeld = id7();
// One batch: the refused Keep, a good letter, a bad held draft.
r = await push(A, [keep, op('entry.upsert', L, letter(L, CHILD, 'You laughed at the rain.')), op('held.upsert', badHeld, held(badHeld, CHILD, { capture_mode: 'voice' }))]);
const parsed = parsePushResponse(r);
x = r.results[0];
check('[N2] a batch with a refused Keep (current from the held row), a good letter and a bad held draft parses as a whole',
  parsed.ok && parsed.value.results.length === 3);
check('[N2] the refused Keep carries conflict_groups [text] and the held words in a current the contract accepts',
  x.ok === true && x.applied === false && JSON.stringify(x.conflict_groups) === '["text"]'
  && x.current?.final_text === 'You laughed, then you slept.' && x.current.edit_level === 'clean' && Array.isArray(x.current.machine_edits)
  && parsed.ok && contract.isWordsConflict(parsed.value.results[0]));
check('the good letter applies and the bad held draft is refused 23514 in the same answer',
  r.results[1].ok === true && r.results[1].applied === true && r.results[2].ok === false && r.results[2].code === '23514' && !(await rowOf(h, badHeld)));
r = await push(A, [keep]);
check('[N2] its repeat (a lost answer) parses too, with the same current', pushParses(r) && r.results[0].dup === true
  && r.results[0].current?.final_text === 'You laughed, then you slept.');
// A refused held.upsert with every layer set, and its repeat.
const stale = op('held.upsert', K, held(K, CHILD, { kind: 'held_words', raw_transcript: 'um you laughed', final_text: 'Stale words.',
  edit_level: 'verbatim', machine_edits: [] }), { changed: ['text'], base: kv });
r = await push(A, [stale]);
check('[N2] a refused held.upsert and its repeat parse, current from the held row',
  pushParses(r) && r.results[0].current?.final_text === 'You laughed, then you slept.' && pushParses(await push(A, [stale])));

// --- 4. Rows stored before the file: counted, never changed; a failing check stays NOT VALID --
{
  const old = await createDb(before);
  const child = await setUp(old);
  const oldPush = pushOn(old);
  const ids = { mode: id7(), level: id7(), good: id7(), good2: id7() };
  await oldPush(A, [
    op('held.upsert', ids.mode, held(ids.mode, child, { capture_mode: 'voice' })),
    op('held.upsert', ids.level, held(ids.level, child, { ...words, capture_mode: 'voice', edit_level: 'fancy' })),
    op('held.upsert', ids.good, held(ids.good, child, words)),
    op('held.upsert', ids.good2, held(ids.good2, child)),
  ]);
  const snap = async () => JSON.stringify((await old.sys(`select h::text r from held_drafts h order by id`)).rows);
  const before0 = await snap();
  check('before the file, the old server stored the bad values as sent (the gap)', !!(await rowOf(old, ids.mode)) && !!(await rowOf(old, ids.level)));
  const notices = [];
  const applied = await codeOf(() => old.db.exec(readFileSync(mine, 'utf8'), { onNotice: (m) => notices.push(m) }));
  check('[existing rows] the file applies over rows that fail two of its checks (it never fails on them)', applied === 'ok');
  const val = await validated(old);
  check('[existing rows] the two checks a stored row fails stay NOT VALID; the three no row fails are validated',
    val.held_drafts_capture_mode_check === false && val.held_drafts_edit_level_check === false
    && val.held_drafts_machine_edits_shape === true && val.held_drafts_author_edits_shape === true && val.held_drafts_locked_spans_shape === true);
  check('[constitution] no stored row is changed or deleted (every column, versions and times included)', (await snap()) === before0);
  const said = notices.map((m) => `${m.severity} ${m.message}`);
  check('[existing rows] the counts are reported: 2 for capture_mode, 1 for edit_level, 0 for the rest',
    said.some((s) => /^WARNING held_drafts_capture_mode_check: 2 stored held drafts fail it; left NOT VALID/.test(s))
    && said.some((s) => /^WARNING held_drafts_edit_level_check: 1 stored held drafts fail it; left NOT VALID/.test(s))
    && ['machine_edits', 'author_edits', 'locked_spans'].every((c) => said.some((s) => s.startsWith(`NOTICE held_drafts_${c}_shape: 0 stored held drafts fail it; validated`)))
    && said.some((s) => /^WARNING held_drafts checks left NOT VALID: held_drafts_capture_mode_check, held_drafts_edit_level_check$/.test(s)));
  check('[privacy] the report names checks and counts only: no id, no value, no words',
    !said.some((s) => Object.values(ids).some((i) => s.includes(i)) || /voice|fancy|hummed|laughed/.test(s)));
  // A NOT VALID check still refuses every new and changed row.
  const fresh = id7();
  let o = await oldPush(A, [op('held.upsert', fresh, held(fresh, child, { capture_mode: 'voice' }))]);
  check('[existing rows] a NOT VALID check still refuses a new bad row (23514)', o.results[0].code === '23514' && !(await rowOf(old, fresh)));
  const m0 = await rowOf(old, ids.mode);
  o = await oldPush(A, [op('held.upsert', ids.mode, held(ids.mode, child, { capture_mode: 'voice', occurred_on: '2026-10-05' }), { changed: ['occurred_on'], base: m0.v })]);
  check('[existing rows] an edit that keeps a stored bad value is refused 23514 and the row stays as it was',
    o.results[0].code === '23514' && (await rowOf(old, ids.mode)).d === m0.d && pushParses(o));
  o = await oldPush(A, [op('held.upsert', ids.mode, held(ids.mode, child, { capture_mode: 'typed' }), { base: m0.v })]);
  check('[existing rows] the author\'s next upload with valid values heals the row', o.results[0].ok === true
    && (await rowOf(old, ids.mode)).capture_mode === 'typed' && pushParses(o));
  o = await oldPush(A, [op('held.discard', ids.level, {}, { base: (await rowOf(old, ids.level)).t })]);
  check('[existing rows] letting a row with a bad value go still works (deletes are never checked)',
    o.results[0].ok === true && !(await rowOf(old, ids.level)) && pushParses(o));
  const left = (await old.sys(`select count(*)::int c from held_drafts h
    where not (capture_mode in ('spoken', 'typed', 'mixed')) or not (edit_level is null or edit_level in ('clean', 'verbatim'))`)).rows[0].c;
  await old.sys(`alter table held_drafts validate constraint held_drafts_capture_mode_check`);
  await old.sys(`alter table held_drafts validate constraint held_drafts_edit_level_check`);
  check('[APPLY.md File 22] once no stored row fails them, the two checks validate by hand', left === 0
    && Object.values(await validated(old)).every((y) => y === true));
}

done();
