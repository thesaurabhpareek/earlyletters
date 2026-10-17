// Sync protocol v1, the server half (20261016000000_sync_v1_server.sql; ADR 0025 on
// the sync stack; handoffs #154, #187, #196, #197, #198): the words compare and set
// and the receipt outcome (WP-F16-14), held drafts (WP-F16-17), Erase now
// (WP-F16-13), the erasure record that keeps an erased letter erased (B6), the
// review mark (M17), and what goes with a held draft on every delete path.
// The phone side runs against this SQL in apps/mobile/test/sync-two-phone.test.ts.
// Fictional family "Asha" only (CLAUDE.md).
import { readFileSync } from 'node:fs';
import { createDb, users, uuid7 } from './harness.mjs';

const files = process.argv.slice(2);
const h = await createDb(files);
const { check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, join } = h;
const { A, B, C, N, S } = users;

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${S}')`);
await publishPolicies();
for (const u of [A, B, C, N, S]) await consent(u);
const CHILD = await newChild(A, 'Asha', '2025-04-12');
await join(B, 'parent', CHILD, A);
await join(N, 'contributor', CHILD, A);

let n = 0;
const id7 = () => uuid7(Date.now() - 5000 + ++n);
const op = (type, id, data = {}, extra = {}) => ({ op: id7(), type, id, data, ...extra });
const push = async (uid, ops) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await one(uid, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).r;
};
const pull = async (uid, since = {}, limit = 200) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await one(uid, `select public.sync_pull($1::jsonb, $2) r`, [JSON.stringify(since), limit])).r;
};
// Capture and creation times are immutable (SCIMM), so every snapshot of one letter carries the same ones.
const NOW = new Date().toISOString();
const letter = (id, { text = 'You laughed at the rain.', raw = 'um you laughed at the rain', inBook = true, extra = {} } = {}) => ({
  id, child_id: CHILD, kind: 'letter', occurred_on: '2026-10-01', captured_at: NOW, capture_mode: 'spoken',
  edit_level: 'clean', prompt_key: null, engine_version: 5, raw_transcript: raw, machine_edits: [], final_text: text,
  in_book: inBook, sounds_like_me: null, author_signs_as: 'Mama', audio_kept_on_device: true, ...extra,
});
const held = (id, { kind = 'held_letter', typed = 'You hummed all the way home.', occurred = '2026-10-02', extra = {} } = {}) => ({
  id, child_id: CHILD, kind, capture_mode: kind === 'waiting_letter' ? 'spoken' : 'typed', created_at: NOW,
  occurred_on: occurred, occurred_precision: 'day', base_direction: 'ltr', in_book_choice: true,
  typed_text: kind === 'waiting_letter' ? null : typed, final_text: null, machine_edits: null, edit_level: null,
  engine_version: 5, audio_kept_on_device: true, ...extra,
});
const entry = async (id) => (await sys(`select sync_xid::text v, text_xid::text t, final_text, in_book, deleted_at, words_reviewed_at
  from entries where id = $1`, [id])).rows[0];
const heldRow = async (id) => (await sys(`select sync_xid::text v, text_xid::text t, typed_text, occurred_on::text d, kind
  from held_drafts where id = $1`, [id])).rows[0];
const marker = async (id) => (await sys(`select gone from held_drafts_gone where id = $1`, [id])).rows[0]?.gone;
const ledger = async (kind, id) => (await sys(`select 1 from purge_ledger where entity_type = $1 and entity_id = $2`, [kind, id])).rows.length === 1;
const erasure = async (id) => (await sys(`select child_id, author_id from sync_private.entry_erasures where entry_id = $1`, [id])).rows[0];
const receipt = async (opId) => (await sys(`select applied_v::text a, words_conflict c, words_refused r from sync_op_receipts where op_id = $1`, [opId])).rows[0];
const book = (r) => r.books.find((b) => b.id === CHILD);
// jsonb keeps its own key order, so compare JSON values with sorted keys.
const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v);
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const big = (x) => BigInt(x);

// ── 0. Shape ─────────────────────────────────────────────────────────────
check('the stand-in detection finds the real thing: sync_push names conflict_groups and entry.erase, held_drafts exists',
  (await sys(`select exists (select 1 from pg_proc where proname = 'sync_push' and prosrc like '%conflict_groups%' and prosrc like '%entry.erase%')
                and to_regclass('public.held_drafts') is not null as ok`)).rows[0].ok);
const last = files.find((f) => f.includes('20261016000000'));
check('a second run is refused (55000, already applied)', (await codeOf(() => h.db.exec(readFileSync(last, 'utf8')))) === '55000');
check('[F16 6.2 I] purge_ledger takes held_draft',
  /'held_draft'/.test((await sys(`select pg_get_constraintdef(oid) d from pg_constraint where conname = 'purge_ledger_entity_type_check'`)).rows[0].d));
for (const k of ['entry', 'child', 'profile', 'storage_object', 'held_draft']) {
  check(`purge_ledger accepts '${k}'`, (await codeOf(() => sys(`insert into purge_ledger (entity_type, entity_id) values ($1, 'probe-${k}')`, [k]))) === 'ok');
}

// ── 1. Helper reachability (review B2-3) ─────────────────────────────────
const helperNames = ['note_applied', 'dup_outcome', 'held_upsert', 'held_discard', 'held_state', 'held_dup', 'note_held',
  'held_id_taken', 'held_on_hold', 'erase_held', 'erase_entry', 'erasure_recorded', 'letter_id_taken', 'lock_letter_id'];
check('the receipt, held and erase helpers are not client RPCs: none is in public',
  (await sys(`select count(*)::int c from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public' and p.proname = any ($1)`, [helperNames])).rows[0].c === 0);
check('anon has no usage on sync_private and no execute on any of its functions',
  (await sys(`select not has_schema_privilege('anon', 'sync_private', 'usage')
                 and not exists (select 1 from pg_proc p where p.pronamespace = 'sync_private'::regnamespace
                                  and has_function_privilege('anon', p.oid, 'execute')) as ok`)).rows[0].ok);
check('signed-in people cannot call erasure_recorded or letter_id_taken, nor read the erasure record or the held markers',
  !(await sys(`select has_function_privilege('authenticated', 'sync_private.erasure_recorded(uuid, uuid)', 'execute')
                 or has_function_privilege('authenticated', 'sync_private.letter_id_taken(uuid, uuid)', 'execute') x`)).rows[0].x
  && (await codeOf(() => as(A, `select 1 from sync_private.entry_erasures`))) === '42501'
  && (await codeOf(() => as(A, `select 1 from held_drafts_gone`))) === '42501');
check('every sync_private function pins search_path to pg_catalog first and pg_temp last',
  (await sys(`select count(*)::int c from pg_proc p where p.pronamespace = 'sync_private'::regnamespace
               and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c ~ '^search_path=pg_catalog(, [a-z_]+)*, pg_temp$')`)).rows[0].c === 0);
check('the trigger functions are not callable by anyone',
  (await sys(`select count(*)::int c from pg_proc p where p.pronamespace = 'public'::regnamespace
               and p.proname in ('entries_set_sync_xid', 'entries_not_purged', 'entries_note_erasure', 'entries_drop_held',
                                 'child_members_drop_held', 'held_drafts_guard', 'held_drafts_stamp', 'held_drafts_note_gone')
               and (has_function_privilege('authenticated', p.oid, 'execute') or has_function_privilege('anon', p.oid, 'execute'))`)).rows[0].c === 0);

// ── 2. The words version (WP-F16-14) ─────────────────────────────────────
const L1 = id7();
let r = await push(A, [op('entry.upsert', L1, letter(L1))]);
let e = await entry(L1);
check('[ADR 0025 s5] an insert stamps the words version with its own transaction', e.t !== null && e.t === e.v);
const v1 = e.v;
await push(A, [op('entry.upsert', L1, letter(L1, { inBook: false }), { changed: ['in_book'], base: v1 })]);
e = await entry(L1);
check('[F16 C2] a change that is not the words moves the row version, never the words version', big(e.v) > big(v1) && e.t === v1);
await as(A, `update entries set text_xid = '1' where id = $1`, [L1]);
check('only the trigger writes text_xid (a direct update is ignored)', (await entry(L1)).t === v1);
r = await push(A, [op('entry.upsert', L1, letter(L1, { text: 'You laughed at the rain, then at me.', inBook: false }), { changed: ['text'], base: e.v })]);
const e2 = await entry(L1);
check('a words edit on the current base applies and stamps the words version', r.results[0].ok && !r.results[0].conflict_groups
  && e2.final_text === 'You laughed at the rain, then at me.' && big(e2.t) > big(v1) && e2.t === e2.v);
// Never behind a version already handed out: an older writer committing words later stamps past it.
await sys(`alter table entries disable trigger entries_sync_xid`);
await sys(`update entries set sync_xid = '999999999'::xid8 where id = $1`, [L1]);
await sys(`alter table entries enable trigger entries_sync_xid`);
await sys(`update entries set final_text = final_text || ' ' where id = $1`, [L1]);
check('[ADR 0025 s5] the words version never falls behind a version already handed out (xid order is not commit order)',
  big((await entry(L1)).t) > 999999999n);
await sys(`update entries set final_text = rtrim(final_text) where id = $1`, [L1]);

// ── 3. Compare and set, and the receipt outcome ──────────────────────────
const L2 = id7();
await push(A, [op('entry.upsert', L2, letter(L2, { text: 'One.' }))]);
const b0 = (await entry(L2)).v;
const first = op('entry.upsert', L2, letter(L2, { text: 'One, from the first phone.' }), { changed: ['text'], base: b0 });
r = await push(A, [first]);
const afterFirst = await entry(L2);
check('[F16-REQ-010] the first phone\'s words apply', r.results[0].ok && afterFirst.final_text === 'One, from the first phone.');
check('[#154] the receipt notes the version the op wrote (applied_v), no conflict', (await receipt(first.op)).a === afterFirst.v
  && (await receipt(first.op)).c === false);
const second = op('entry.upsert', L2, letter(L2, { text: 'One, from the second phone.', inBook: false }), { changed: ['text', 'in_book'], base: b0 });
r = await push(A, [second]);
let x = r.results[0];
e = await entry(L2);
check('[F16-REQ-010] words based on an older version are not applied; the other groups are',
  x.ok && e.final_text === 'One, from the first phone.' && e.in_book === false);
check('[ADR 0025 s2] the answer carries conflict_groups [text] and current (the words now, with their version)',
  JSON.stringify(x.conflict_groups) === '["text"]' && x.current.final_text === 'One, from the first phone.' && x.current.v === e.t
  && Array.isArray(x.current.machine_edits) && x.current.edit_level === 'clean');
check('[#154] a refused op\'s receipt says refused and has no applied_v',
  (await receipt(second.op)).a === null && (await receipt(second.op)).c === true && (await receipt(second.op)).r === true);
r = await push(A, [second]);
x = r.results[0];
check('[ADR 0025 s2] its duplicate (a lost answer) repeats the refusal with the words now, never an applied_v',
  x.dup === true && JSON.stringify(x.conflict_groups) === '["text"]' && x.current.final_text === 'One, from the first phone.' && !('applied_v' in x));
// Words moved on since: the duplicate of the first op still answers the version IT wrote.
const third = op('entry.upsert', L2, letter(L2, { text: 'One, a third time.', inBook: false }), { changed: ['text'], base: e.v });
await push(A, [third]);
r = await push(A, [first]);
check('[ADR 0025 s2] a duplicate answers applied_v (the version the op wrote), never the row as it is now',
  r.results[0].dup === true && r.results[0].applied_v === afterFirst.v && r.results[0].entry.v !== afterFirst.v && !r.results[0].current);
const datesOnly = op('entry.upsert', L2, letter(L2, { text: 'stale', inBook: true, extra: { occurred_on: '2026-09-30' } }), { changed: ['occurred_on'], base: b0 });
r = await push(A, [datesOnly]);
x = r.results[0];
e = await entry(L2);
check('[ADR 0025 s5] an op without text applies whatever its base, and gets current when the words moved on',
  x.ok && !x.conflict_groups && x.current?.final_text === 'One, a third time.' && e.final_text === 'One, a third time.'
  && (await sys(`select occurred_on::text d from entries where id = $1`, [L2])).rows[0].d === '2026-09-30');
check('its receipt says the answer carried current, so its duplicate repeats current and no applied_v',
  (await receipt(datesOnly.op)).c === true && (await receipt(datesOnly.op)).r === false
  && (await push(A, [datesOnly])).results[0].current?.final_text === 'One, a third time.');
r = await push(A, [op('entry.upsert', L2, letter(L2, { text: 'From an older app.' }), { changed: ['text'] })]);
check('[D-023] no base (an older app): later arrival still wins', (await entry(L2)).final_text === 'From an older app.');
// A letter written before this file has no words version: its row version stands in.
const L3 = id7();
await push(A, [op('entry.upsert', L3, letter(L3, { text: 'Before v1.' }))]);
await sys(`alter table entries disable trigger entries_sync_xid`);
await sys(`update entries set text_xid = null where id = $1`, [L3]);
await sys(`alter table entries enable trigger entries_sync_xid`);
const l3 = await entry(L3);
r = await push(A, [op('entry.upsert', L3, letter(L3, { text: 'Stale.' }), { changed: ['text'], base: String(big(l3.v) - 1n) })]);
check('a letter with no words version compares on its row version (never lower than the words)',
  JSON.stringify(r.results[0].conflict_groups) === '["text"]' && r.results[0].current.v === l3.v && (await entry(L3)).final_text === 'Before v1.');
r = await push(A, [op('entry.upsert', L3, letter(L3, { text: 'Fresh.' }), { changed: ['text'], base: l3.v })]);
check('and applies on its current version', !r.results[0].conflict_groups && (await entry(L3)).final_text === 'Fresh.');
// A restore re-upload the server did not take wrote nothing: no applied_v.
const reup = op('entry.reupload', L3, letter(L3, { text: 'Old copy.' }), { known_at: '2020-01-01T00:00:00Z' });
r = await push(A, [reup]);
check('[ADR 0025 s4] a re-upload the server did not take leaves no applied_v, so its duplicate moves no base',
  r.results[0].applied === false && (await receipt(reup.op)).a === null && !('applied_v' in (await push(A, [reup])).results[0]));
check('the co-parent never receives current or conflict_groups for a letter that is not theirs (RLS)',
  (await push(B, [op('entry.upsert', L2, letter(L2, { text: 'Not mine.' }), { changed: ['text'], base: '1' })])).results[0].code === '42501');

// ── 4. The review mark (M17, ADR 0025 s11) ───────────────────────────────
const L4 = id7();
const T = '2026-10-16T09:00:00.000Z';
await push(A, [op('entry.upsert', L4, letter(L4, { extra: { words_reviewed_at: T } }))]);
check('[M17] the review mark is stored with the letter', new Date((await entry(L4)).words_reviewed_at).toISOString() === T);
let mine = book(await pull(A)).rows.find((y) => y.id === L4);
let theirs = book(await pull(B)).rows.find((y) => y.id === L4);
check('[M17] the author\'s pull row carries it; the other parent\'s never does',
  new Date(mine.words_reviewed_at).toISOString() === T && theirs && !('words_reviewed_at' in theirs));
const v4 = (await entry(L4)).v;
await push(A, [op('entry.upsert', L4, letter(L4, { text: 'Edited by an older build.' }), { changed: ['text'], base: v4 })]);
check('[M17] an op that does not carry the mark keeps it', new Date((await entry(L4)).words_reviewed_at).toISOString() === T);
await push(A, [op('entry.upsert', L4, letter(L4, { text: 'Edited again.', extra: { words_reviewed_at: null } }), { changed: ['text'], base: '1' })]);
check('[M17] refused words never move the mark', new Date((await entry(L4)).words_reviewed_at).toISOString() === T);
await push(A, [op('entry.upsert', L4, letter(L4, { inBook: false, extra: { words_reviewed_at: null } }), { changed: ['in_book'] })]);
check('[M17] the mark travels with the text group only', new Date((await entry(L4)).words_reviewed_at).toISOString() === T);

// ── 5. Erase now (WP-F16-13, F16-REQ-024) ────────────────────────────────
const E1 = id7();
await push(A, [op('entry.upsert', E1, letter(E1, { text: 'The day you threw the spoon.' }))]);
const photo = `${CHILD}/${A}/${E1}.jpg`;
await as(A, `update entries set photo_path = $1 where id = $2`, [photo, E1]);
await push(A, [op('entry.upsert', E1, letter(E1, { text: 'The day you threw the spoon, twice.' }), { changed: ['text'] })]);
const before = book(await pull(B));
const haveB = before.visible;
const curB = before.cursor;
check('the co-parent holds the in-book letter before the erase', before.rows.some((y) => y.id === E1));
await push(A, [op('entry.delete', E1)]);
const eraseOp = op('entry.erase', E1);
r = await push(A, [eraseOp]);
check('[F16-REQ-024] entry.erase purges the author\'s own letter now: row and history go', r.results[0].ok && r.results[0].erased === true
  && !(await entry(E1)) && (await sys(`select count(*)::int c from entry_versions where entry_id = $1`, [E1])).rows[0].c === 0);
check('[F16-REQ-024] purge_ledger has the letter; the erasure record has its book and author (ids only)',
  (await ledger('entry', E1)) && (await erasure(E1))?.child_id === CHILD && (await erasure(E1))?.author_id === A);
check('[F16-REQ-024] the photo is queued for the storage purge by its exact path',
  (await sys(`select 1 from storage_purge_queue where bucket_id = 'entry-photos' and object_path = $1 and not is_prefix`, [photo])).rows.length === 1);
r = await push(A, [eraseOp]);
check('[review K N6] a retry of the erase is a no-op duplicate that says what the first answer said', r.results[0].dup === true && r.results[0].erased === true);
const afterB = book(await pull(B, { books: { [CHILD]: { cursor: curB, have: haveB } } }));
check('[ADR 0025 s12] the next pull of that book recomputes its removal digest (the erasure is after the cursor), not the echo',
  afterB.visible.n === haveB.n - 1 && afterB.rows.every((y) => y.id !== E1));
const E2 = id7();
await push(A, [op('entry.upsert', E2, letter(E2, { text: 'Your first time on the swing.' }))]);
r = await push(A, [op('entry.erase', E2)]);
check('[F16-REQ-024] Erase now works on a live letter too (its delete was still queued)', r.results[0].erased === true && !(await entry(E2)));
const E3 = id7();
await push(A, [op('entry.upsert', E3, letter(E3, { text: 'Mama\'s letter.' }))]);
const other = (await push(B, [op('entry.erase', E3)])).results[0];
const none = (await push(B, [op('entry.erase', id7())])).results[0];
check('[F16-REQ-024] another person\'s letter answers missing, exactly as no letter at all, and nothing changes',
  other.ok && other.missing === true && JSON.stringify(Object.keys(other).sort()) === JSON.stringify(Object.keys(none).sort())
  && none.missing === true && (await entry(E3))?.deleted_at === null);
await sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by) values ('entry', $1, 'other', 'T-17', 'ops', '2027-01-01')`, [E3]);
r = await push(A, [op('entry.erase', E3)]);
e = await entry(E3);
check('[F16-REQ-024] under a legal hold the letter is kept, tombstoned (deferred)', r.results[0].deferred === true && e && e.deleted_at !== null);
await sys(`update legal_holds set released_at = now() where scope_id = $1`, [E3]);

// ── 6. B6: an erased letter never comes back (#198 as corrected) ─────────
await sys(`delete from purge_ledger where entity_type = 'entry' and entity_id = $1`, [E1]);   // the 60 day trim
r = await push(A, [op('entry.upsert', E1, letter(E1, { text: 'The day you threw the spoon, three times.' }), { changed: ['text'], base: '5' })]);
check('[#198] an upload of an erased letter is refused as gone (SCDEL purged), also after the ledger forgot it',
  r.results[0].ok === false && r.results[0].code === 'SCDEL' && r.results[0].gone === true && !(await entry(E1)));
r = await push(A, [op('entry.upsert', E1, letter(E1, { text: 'No base at all.' }))]);
check('[#198] with no base too: the erasure record decides, never the base', r.results[0].code === 'SCDEL' && r.results[0].gone === true);
r = await push(A, [op('entry.reupload', E1, letter(E1), { known_at: new Date().toISOString() })]);
check('[#198] a restore re-upload of an erased letter is refused the same way', r.results[0].code === 'SCDEL' && r.results[0].gone === true);
// The 30 day purge writes the record too (ADR 0025 s12: "written by purge_due too").
const P1 = id7();
await push(A, [op('entry.upsert', P1, letter(P1, { text: 'You ate a whole pear.' }))]);
await push(A, [op('entry.delete', P1)]);
await sys(`select public.purge_due(now() + interval '31 days')`);   // 31 days later
check('[B6] purge_due\'s 30 day purge records the erasure', !(await entry(P1)) && (await erasure(P1))?.author_id === A);
await sys(`delete from purge_ledger where entity_type = 'entry' and entity_id = $1`, [P1]);
r = await push(A, [op('entry.upsert', P1, letter(P1, { text: 'You ate a whole pear, and the core.' }), { changed: ['text'], base: '7' })]);
check('[B6] a phone away past the 60 day forget cannot bring a purged letter back', r.results[0].code === 'SCDEL' && !(await entry(P1)));
// A server restore leaves "a base and no row" with no erasure: the letter goes back up.
const R1 = id7();
await push(A, [op('entry.upsert', R1, letter(R1, { text: 'Your first word, and it was ball.' }))]);
const r1v = (await entry(R1)).v;
await sys(`set session_replication_role = replica`);
await sys(`delete from entries where id = $1`, [R1]);
await sys(`set session_replication_role = origin`);
r = await push(A, [op('entry.upsert', R1, letter(R1, { text: 'Your first word, and it was ball, twice.' }), { changed: ['text'], base: r1v })]);
check('[#198, review B-R1] after a restore, an upload with a base for a missing id and no erasure is stored, never refused',
  r.results[0].ok && (await entry(R1))?.final_text === 'Your first word, and it was ball, twice.');
check('a new letter with no base is unaffected', (await push(A, [op('entry.upsert', id7(), letter(id7()))])).results[0].code !== 'SCDEL');

// ── 7. Held drafts (WP-F16-17) ───────────────────────────────────────────
const H1 = id7();
const up1 = op('held.upsert', H1, held(H1));
r = await push(A, [up1]);
x = r.results[0];
let hr = await heldRow(H1);
check('[F16-REQ-029] held.upsert stores an author-only row and answers its version', x.ok && x.held.id === H1 && x.held.v === hr.v
  && hr.typed_text === 'You hummed all the way home.');
check('[#196] the held receipt records the version the op wrote', (await receipt(up1.op)).a === hr.v && (await receipt(up1.op)).r === false);
check('[F16-REQ-029] the co-parent never sees it: no row, nothing in their pull',
  (await as(B, `select 1 from held_drafts where id = $1`, [H1])).rows.length === 0
  && !JSON.stringify(await pull(B, { held: { cursor: null } })).includes(H1));
const fresh = await pull(A, { held: { cursor: null } });
const pulled = fresh.held.rows.find((y) => y.id === H1);
check('[ADR 0025 s9] the author\'s pull carries a held section with the row, its v and no author or versions',
  pulled && pulled.v === hr.v && !('author_id' in pulled) && !('sync_xid' in pulled) && !('text_xid' in pulled)
  && pulled.typed_text === 'You hummed all the way home.' && fresh.held.more === false && /^\d+:0{8}-/.test(fresh.held.cursor));
const noHeld = await pull(A);
check('[ADR 0025 s9] a pull that does not ask gets no held section (an older app sees what it saw before)', !('held' in noHeld));
const pB1 = await pull(B, { books: { [CHILD]: {} } });
await push(A, [op('held.upsert', H1, held(H1, { typed: 'You hummed all the way home, then slept.' }), { changed: ['text'], base: hr.v })]);
const pB2 = await pull(B, { books: { [CHILD]: {} } });
check('[F16-REQ-029] a held write never changes the other parent\'s digest or rows',
  JSON.stringify(book(pB1).visible) === JSON.stringify(book(pB2).visible) && book(pB2).rows.length === book(pB1).rows.length);
hr = await heldRow(H1);
// Words compare and set over the words group plus typed_text.
const staleBase = (await sys(`select (text_xid::text::numeric - 1)::text b from held_drafts where id = $1`, [H1])).rows[0].b;
const refusedHeld = op('held.upsert', H1, held(H1, { typed: 'From the second phone.', occurred: '2026-10-03' }), { changed: ['text', 'occurred_on'], base: staleBase });
r = await push(A, [refusedHeld]);
x = r.results[0];
hr = await heldRow(H1);
check('[F16-REQ-029] held words changed since base are not applied; the other fields are',
  hr.typed_text === 'You hummed all the way home, then slept.' && hr.d === '2026-10-03');
check('[F16-REQ-029] the answer carries conflict_groups and current with typed_text', JSON.stringify(x.conflict_groups) === '["text"]'
  && x.current.typed_text === 'You hummed all the way home, then slept.' && x.current.v === hr.t);
r = await push(A, [refusedHeld]);
check('[#196] a duplicate of a refused held op repeats the refusal and has no applied_v',
  r.results[0].dup === true && JSON.stringify(r.results[0].conflict_groups) === '["text"]' && !('applied_v' in r.results[0]));
r = await push(A, [up1]);
check('[#196] a duplicate of an applied held op answers applied_v, the version it wrote', r.results[0].dup === true
  && r.results[0].applied_v === (await receipt(up1.op)).a && r.results[0].applied_v !== hr.v);
r = await push(A, [op('held.upsert', H1, held(H1, { typed: 'stale words', occurred: '2026-10-04' }), { changed: ['occurred_on'], base: staleBase })]);
hr = await heldRow(H1);
check('[#196, final review B-3] a date-only change after words changed elsewhere is no conflict; only the date applies',
  !r.results[0].conflict_groups && hr.typed_text === 'You hummed all the way home, then slept.' && hr.d === '2026-10-04');
check('[F16-REQ-029] a second raw transcript once one is set is refused (SCIMM)',
  (await codeOf(async () => { await sys(`update held_drafts set raw_transcript = 'you hummed' where id = $1`, [H1]);
    await as(A, `update held_drafts set raw_transcript = 'you sang' where id = $1`, [H1]); })) === 'SCIMM');
check('[F16-REQ-029] author and book are fixed (SCIMM)', (await codeOf(() => as(A, `update held_drafts set created_at = now() - interval '1 day' where id = $1`, [H1]))) === 'SCIMM');
r = await push(B, [op('held.upsert', H1, held(H1, { typed: 'Papa tries the same id.' }))]);
check('[#196] another author\'s held id gets one plain refusal (22023), never a key violation', r.results[0].code === '22023');
check('a direct delete of a held draft is refused (held.discard is the path)', (await codeOf(() => as(A, `delete from held_drafts where id = $1`, [H1]))) === '42501');
const V = '99999999-9999-9999-9999-999999999999';
await sys(`insert into auth.users values ('${V}')`);
await consent(V);
await join(V, 'contributor', CHILD, A);
r = await push(V, [op('held.upsert', id7(), held(id7()))]);
check('a contributor cannot hold a draft in the book (author while a parent)', r.results[0].ok === false);
await as(A, `select public.record_policy_act('sensitive-data', '1.0.0', 'withdraw', 'settings_toggle', 'settings.privacy', '1', 'ios')`);
r = await push(A, [op('held.upsert', H1, held(H1, { typed: 'During the pause.' }), { changed: ['text'], base: hr.t })]);
check('[LEGAL-REQ-009] without consent a held upload pauses the batch (SCCON)', r.paused === true && (await heldRow(H1)).typed_text !== 'During the pause.');
await as(A, `select public.record_policy_act('sensitive-data', '1.0.0', 'accept', 'consent_sheet', 'consent.sensitive', '1', 'ios')`);

// held.discard with a base (#197).
const cursorBefore = (await pull(A, { held: { cursor: null } })).held.cursor;
r = await push(A, [op('held.discard', H1, {}, { base: staleBase })]);
check('[#197, final review B-2] a let-go older than the newest words keeps the row ({ kept: true })', r.results[0].kept === true && (await heldRow(H1)));
hr = await heldRow(H1);
r = await push(A, [op('held.discard', H1, {}, { base: hr.t })]);
check('[#197] a let-go on the newest words removes the row and leaves a discarded marker', r.results[0].ok && !(await heldRow(H1))
  && (await marker(H1)) === 'discarded');
check('[F16 6.2 I] the let-go is ledgered as held_draft', await ledger('held_draft', H1));
const afterGo = await pull(A, { held: { cursor: cursorBefore } });
check('[ADR 0025 s9] a phone that pulled before gets the marker (ids and times only)',
  afterGo.held.rows.some((y) => y.id === H1 && y.gone === 'discarded' && Object.keys(y).sort().join(',') === 'gone,id,updated_at,v'));
check('[ADR 0025 s9] a fresh pull gets no markers', !(await pull(A, { held: { cursor: null } })).held.rows.some((y) => y.id === H1));
r = await push(A, [op('held.discard', H1, {}, { base: hr.t })]);
check('a let-go of a row already gone answers missing', r.results[0].missing === true);
r = await push(A, [op('held.upsert', H1, held(H1, { typed: 'Back from the other phone.' }))]);
check('[#187] a discarded marker does not refuse a later edit from another phone: the edit wins, the marker goes',
  r.results[0].ok && (await heldRow(H1))?.typed_text === 'Back from the other phone.' && (await marker(H1)) === undefined);

// Keep: the letter takes the held id in the same transaction.
r = await push(A, [op('entry.upsert', H1, letter(H1, { text: 'Back from the other phone.' }))]);
check('[F16-REQ-029] Keep: entry.upsert for a held id removes the held row in the same transaction and leaves a kept marker',
  r.results[0].ok && !(await heldRow(H1)) && (await entry(H1)) && (await marker(H1)) === 'kept');
r = await push(A, [op('held.upsert', H1, held(H1, { typed: 'A late upload of the draft.' }))]);
check('[ADR 0025 s9] a late held.upsert for a kept id is a no-op (held: null)', r.results[0].held === null && !(await heldRow(H1)));

// Erase now on a waiting letter (final review B4, #197).
const W1 = id7();
await push(A, [op('held.upsert', W1, held(W1, { kind: 'waiting_letter' }))]);
r = await push(A, [op('entry.erase', W1)]);
check('[ADR 0025 s12] Erase now on a waiting letter removes its held row and marks it erased', r.results[0].erased === true
  && !(await heldRow(W1)) && (await marker(W1)) === 'erased');
check('[#197] the erase ledgers the held draft and records the author\'s erasure; no global letter ledger row (review L 2)',
  !(await ledger('entry', W1)) && (await ledger('held_draft', W1)) && (await erasure(W1))?.author_id === A);
r = await push(A, [op('held.upsert', W1, held(W1, { kind: 'waiting_letter' }))]);
check('[#197, review B-R2] a held upload of an erased id is refused as gone (a Restore made offline never undoes Erase now)',
  r.results[0].code === 'SCDEL' && r.results[0].gone === true && !(await heldRow(W1)) && (await marker(W1)) === 'erased');
r = await push(A, [op('entry.upsert', W1, letter(W1, { text: 'Its words arrived on the other phone.' }))]);
check('[#197] a letter upload of that id is refused the same way', r.results[0].code === 'SCDEL' && !(await entry(W1)));
const W2 = id7();
await push(A, [op('held.upsert', W2, held(W2, { kind: 'waiting_letter' }))]);
await push(A, [op('held.discard', W2, {}, { base: (await heldRow(W2)).t })]);
r = await push(A, [op('entry.erase', W2)]);
check('[ADR 0025 s12] Erase now on a waiting letter let go earlier flips its marker to erased', r.results[0].erased === true
  && (await marker(W2)) === 'erased');
check('nothing of the author\'s: missing', (await push(A, [op('entry.erase', id7())])).results[0].missing === true);
const W3 = id7();
await push(B, [op('held.upsert', W3, held(W3, { kind: 'waiting_letter' }))]);
r = await push(A, [op('entry.erase', W3)]);
check('another author\'s held id answers missing and stays', r.results[0].missing === true && (await heldRow(W3)));

// Legal holds keep a held draft.
const LH = id7();
await push(A, [op('held.upsert', LH, held(LH))]);
await sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by) values ('profile', $1, 'other', 'T-18', 'ops', '2027-01-01')`, [A]);
r = await push(A, [op('held.discard', LH, {}, { base: (await heldRow(LH)).t })]);
check('under a legal hold a let-go keeps the row ({ kept: true })', r.results[0].kept === true && (await heldRow(LH)));
r = await push(A, [op('entry.erase', LH)]);
check('under a legal hold Erase now on a held draft is deferred and keeps it', r.results[0].deferred === true && (await heldRow(LH)));
await sys(`update legal_holds set released_at = now() where scope_id = $1`, [A]);

// The held section's cursor rules.
check('a held cursor ahead of the server answers reset (cursor_ahead)',
  (await pull(A, { held: { cursor: `999999999999:00000000-0000-0000-0000-000000000000` } })).reset === true);
check('a malformed held request is 22023', (await codeOf(() => pull(A, { held: { cursor: 'x' } }))) === '22023'
  && (await codeOf(() => pull(A, { held: 'x' }))) === '22023');
for (let i = 0; i < 3; i++) { const id = id7(); await push(A, [op('held.upsert', id, held(id))]); }
const page = await pull(A, { held: { cursor: null } }, 2);
check('held rows page by p_limit with more and a resumable cursor', page.held.rows.length === 2 && page.held.more === true && page.more === true
  && (await pull(A, { held: { cursor: page.held.cursor } }, 200)).held.rows.every((y) => !page.held.rows.some((z) => z.id === y.id)));

// ── 7b. Review L on #208: leaks, id ownership, Erase now, locks, holds ───
// A second book, so B (co-parent) and N (contributor, family can read) are members throughout.
const LB = await newChild(A, 'Asha', '2025-04-12');
await join(B, 'parent', LB, A);
await join(N, 'contributor', LB, A);
await sys(`update children set family_can_read = true where id = $1`, [LB]);
const inLB = (data) => ({ ...data, child_id: LB });
const bookOf = (r, id) => r.books.find((b) => b.id === id);
const WRONG = { n: 9999, sum: 1 };
const lbCursor = async (u) => bookOf(await pull(u, { books: { [LB]: {} } }), LB).cursor;
// A wrong `have` (a broken or lying phone): an echo means the server did not look; a real digest means
// something changed that this reader may know about (G-09).
const lbVisible = async (u, cursor) => bookOf(await pull(u, { books: { [LB]: { cursor, have: WRONG } } }), LB).visible;
const echoed = (v) => v.n === WRONG.n && v.sum === WRONG.sum;
const seenBy = async (step) => {
  const cB = await lbCursor(B);
  const cN = await lbCursor(N);
  await step();
  return { B: !echoed(await lbVisible(B, cB)), N: !echoed(await lbVisible(N, cN)) };
};
let seen;
const LP = id7();
await push(A, [op('entry.upsert', LP, inLB(letter(LP, { text: 'Just for us two.', inBook: false })))]);
seen = await seenBy(() => push(A, [op('entry.erase', LP)]));
check('[review L 1, G-09] Erase now on a private letter: the co-parent and the family member see no change', !seen.B && !seen.N);
const LT = id7();
await push(A, [op('entry.upsert', LT, inLB(letter(LT, { text: 'You held the cup.' })))]);
await push(A, [op('entry.delete', LT)]);
seen = await seenBy(() => sys(`select public.purge_due(now() + interval '31 days')`));
check('[review L 1] the day-30 purge of a letter already tombstoned: no change for the co-parent or the family member',
  !seen.B && !seen.N && !(await entry(LT)) && (await erasure(LT))?.author_id === A);
const LW = id7();
await push(A, [op('held.upsert', LW, inLB(held(LW, { kind: 'waiting_letter' })))]);
seen = await seenBy(() => push(A, [op('entry.erase', LW)]));
check('[review L 1] Erase now on a waiting letter (author-only): no change for the co-parent or the family member', !seen.B && !seen.N);
const LV = id7();
await push(A, [op('entry.upsert', LV, inLB(letter(LV, { text: 'You waved at the train.' })))]);
seen = await seenBy(() => push(A, [op('entry.erase', LV)]));
check('[ADR 0025 s12] Erase now on an in-book letter: both readers recompute their digest at the next pull', seen.B && seen.N);
const LBP = id7();
await push(A, [op('entry.upsert', LBP, inLB(letter(LBP, { text: 'For the parents.', inBook: false })))]);
await sys(`update entries set approval = 'pending' where id = $1`, [LBP]);
seen = await seenBy(() => push(A, [op('entry.erase', LBP)]));
check('a letter only the parents could read (waiting for review): the co-parent recomputes, the family member does not', seen.B && !seen.N);

// Held ids belong to their author (review L 2).
const LK = id7();
await push(A, [op('held.upsert', LK, inLB(held(LK)))]);
await push(A, [op('entry.upsert', LK, inLB(letter(LK, { text: 'You hummed all the way home.' })))]);
check('Keep left A\'s kept marker', (await marker(LK)) === 'kept');
r = await push(B, [op('held.upsert', LK, inLB(held(LK, { typed: 'Papa takes the id.' })))]);
check('[review L 2] the co-parent cannot hold the id of A\'s letter (one plain 22023), and A\'s kept marker stays',
  r.results[0].code === '22023' && (await marker(LK)) === 'kept' && !(await heldRow(LK)));
check('[review L 2] nor by a direct insert', (await codeOf(() => as(B, `insert into held_drafts (id, author_id, child_id, kind, capture_mode, created_at, occurred_on)
  values ($1, $2, $3, 'held_letter', 'typed', now(), '2026-10-01')`, [LK, B, LB]))) === '22023');
check('nor can A hold a draft with the id of A\'s own letter (it is the letter now)', (await codeOf(() => as(A, `insert into held_drafts
  (id, author_id, child_id, kind, capture_mode, created_at, occurred_on) values ($1, $2, $3, 'held_letter', 'typed', now(), '2026-10-01')`, [LK, A, LB]))) === '22023');
const LE = id7();
await push(A, [op('held.upsert', LE, inLB(held(LE, { kind: 'waiting_letter' })))]);
await push(A, [op('entry.erase', LE)]);
r = await push(B, [op('held.upsert', LE, inLB(held(LE)))]);
check('[review L 2] nor the id of a letter A erased (22023, not "erased": that is A\'s to know)', r.results[0].code === '22023');
// Review L's restore window: a restore drops A's letter Y before A's phone re-uploads it; B holds Y and erases it.
const LY = id7();
await push(A, [op('entry.upsert', LY, inLB(letter(LY, { text: 'Your first word, and it was ball.' })))]);
await sys(`set session_replication_role = replica`);
await sys(`delete from entries where id = $1`, [LY]);
await sys(`set session_replication_role = origin`);
await push(B, [op('held.upsert', LY, inLB(held(LY, { typed: 'Papa holds the id.' })))]);
r = await push(B, [op('entry.erase', LY)]);
check('in the restore window the co-parent can hold and erase the id (nothing on the server says it is A\'s)', r.results[0].erased === true);
check('[review L 2] that erase writes no global letter ledger row', !(await ledger('entry', LY)));
r = await push(A, [op('entry.reupload', LY, inLB(letter(LY, { text: 'Your first word, and it was ball.' })), { known_at: new Date().toISOString() })]);
check('[review L 2] A\'s re-upload of the letter is stored: one person\'s erasure never refuses another person\'s upload',
  r.results[0].ok && r.results[0].code === undefined && (await entry(LY))?.final_text === 'Your first word, and it was ball.');

// Erase now takes a same-id held row with it (review L 3).
const LH3 = id7();
await push(A, [op('entry.upsert', LH3, inLB(letter(LH3, { text: 'You found the moon.' })))]);
await sys(`set session_replication_role = replica`);   // the state a lost Keep race left behind before this fix
await sys(`insert into held_drafts (id, author_id, child_id, kind, capture_mode, created_at, occurred_on, typed_text, sync_xid, text_xid)
  values ($1, $2, $3, 'held_letter', 'typed', now(), '2026-10-01', 'You found the moon, second phone.', pg_current_xact_id(), pg_current_xact_id())`, [LH3, A, LB]);
await sys(`set session_replication_role = origin`);
r = await push(A, [op('entry.erase', LH3)]);
check('[review L 3] Erase now removes a held row with the letter\'s id and marks the id erased', r.results[0].erased === true
  && !(await heldRow(LH3)) && !(await entry(LH3)) && (await marker(LH3)) === 'erased');
check('[review L 3] and the author\'s pull never serves those words back',
  !JSON.stringify((await pull(A, { held: { cursor: null } })).held.rows).includes('You found the moon'));
check('[review L 3] Keep and held.upsert serialise on the id: the lock helper exists and the Keep trigger takes it',
  (await sys(`select prosrc like '%lock_letter_id%' x from pg_proc where proname = 'entries_drop_held'`)).rows[0].x
  && (await sys(`select prosrc like '%lock_letter_id%' x from pg_proc where proname = 'held_upsert'`)).rows[0].x);

// entry.erase locks nothing of anyone else's (review L 4).
const LX = id7();
await push(A, [op('entry.upsert', LX, inLB(letter(LX, { text: 'You climbed the stairs.' })))]);
const lockedInside = async (uid, sqlText, params) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  await h.db.exec('begin');
  try {
    await h.db.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)`,
      [uid, JSON.stringify({ sub: uid, role: 'authenticated', is_anonymous: false })]);
    await h.db.exec('set local role authenticated');
    const res = (await h.db.query(sqlText, params)).rows[0];
    await h.db.exec('reset role');
    const row = (await h.db.query(`select (xmax::text::bigint) >= (pg_current_xact_id()::text::numeric % 4294967296)::bigint as locked
      from entries where id = $1`, [LX])).rows[0];
    // Class 1731 is the per-letter-id lock (1732 is the per-person push lock, which the caller's own push always takes).
    const adv = (await h.db.query(`select count(*)::int c from pg_locks where locktype = 'advisory' and classid = 1731 and pid = pg_backend_pid()`)).rows[0].c;
    return { res, locked: row.locked, advisory: adv };
  } finally {
    await h.db.exec('rollback');
  }
};
const probeSelf = await lockedInside(A, `select 1 as x from entries where id = $1 for update`, [LX]);
check('(the probe sees a row lock when there is one)', probeSelf.locked === true);
const probe = await lockedInside(C, `select public.sync_push($1::jsonb) r`, [JSON.stringify([op('entry.erase', LX)])]);
check('[review L 4] an outsider\'s entry.erase of A\'s letter answers missing and locks neither the row nor the id',
  probe.res.r.results[0].missing === true && probe.locked === false && probe.advisory === 0);
const probeB = await lockedInside(B, `select public.sync_push($1::jsonb) r`, [JSON.stringify([op('entry.erase', LX)])]);
check('[review L 4] nor does the co-parent\'s', probeB.res.r.results[0].missing === true && probeB.locked === false && probeB.advisory === 0);

// One answer for anyone who is not a parent of the book named (review L N1).
const answers = [];
for (const id of [LX, LE, id7()]) answers.push((await push(C, [op('held.upsert', id, inLB(held(id)))])).results[0].code);
answers.push((await push(N, [op('held.upsert', LX, inLB(held(LX)))])).results[0].code);
check('[review L N1] held.upsert by a non-parent answers 42501 whatever the id is (a letter, an erased id, a new one)',
  answers.every((c) => c === '42501'));

// ── 7c. Review K on #208: Keep against a newer held edit, repeats, ids, order ──
// K's plain order: phone 1 holds a draft, phone 2 changes its words, phone 1 (not yet pulled) keeps it.
const KH = id7();
r = await push(A, [op('held.upsert', KH, inLB(held(KH, { typed: 'One.' })))]);
const kv1 = r.results[0].held.v;
await push(A, [op('held.upsert', KH, inLB(held(KH, { typed: 'One, from the second phone.' })), { changed: ['text'], base: kv1 })]);
const keep1 = op('entry.upsert', KH, inLB(letter(KH, { text: 'One.' })), { held_base: kv1 });
r = await push(A, [keep1]);
x = r.results[0];
check('[review K 1] a Keep that names an older held base is refused as a words conflict: no letter, the held row stays',
  x.ok && x.applied === false && x.conflict === true && JSON.stringify(x.conflict_groups) === '["text"]'
  && !(await entry(KH)) && (await heldRow(KH))?.typed_text === 'One, from the second phone.');
check('[review K 1] its answer carries the held words (typed_text) and their version, and the held state',
  x.current?.typed_text === 'One, from the second phone.' && x.current.v === (await heldRow(KH)).t && x.held?.id === KH && x.entry === null);
r = await push(A, [keep1]);
const { dup, op: _op1, ...rest } = r.results[0];
const { op: _op2, ...xRest } = x;
check('[review K 1] a repeat of the refused Keep (a lost answer) says exactly the same', dup === true && same(rest, xRest));
r = await push(A, [op('entry.upsert', KH, inLB(letter(KH, { text: 'One, from the second phone.' })), { held_base: x.current.v })]);
check('[review K 1] the keep sent again on the held words version applies: the letter, the held row gone, marker kept',
  r.results[0].applied === true && (await entry(KH))?.final_text === 'One, from the second phone.' && !(await heldRow(KH)) && (await marker(KH)) === 'kept');
const KN = id7();
r = await push(A, [op('held.upsert', KN, inLB(held(KN, { typed: 'Two.' })))]);
await push(A, [op('held.upsert', KN, inLB(held(KN, { typed: 'Two, changed.' })), { changed: ['text'], base: r.results[0].held.v })]);
r = await push(A, [op('entry.upsert', KN, inLB(letter(KN, { text: 'Two.' })), { held_base: null })]);
check('[review K 1, S03] a held_base key that is null counts as 0: refused when the held words differ',
  r.results[0].applied === false && r.results[0].current?.typed_text === 'Two, changed.' && !!(await heldRow(KN)));
const KO = id7();
r = await push(A, [op('held.upsert', KO, inLB(held(KO, { typed: 'Three.' })))]);
await push(A, [op('held.upsert', KO, inLB(held(KO, { typed: 'Three, changed elsewhere.' })), { changed: ['text'], base: r.results[0].held.v })]);
r = await push(A, [op('entry.upsert', KO, inLB(letter(KO, { text: 'Three.' })))]);
check('[review K 1] an older app\'s Keep (no held_base) applies, and the held words it did not carry stay in the letter\'s history',
  r.results[0].applied === true && !(await heldRow(KO))
  && (await sys(`select 1 from entry_versions where entry_id = $1 and final_text = 'Three, changed elsewhere.'`, [KO])).rows.length === 1);
const KS = id7();
r = await push(A, [op('held.upsert', KS, inLB(held(KS, { typed: 'Four.' })))]);
r = await push(A, [op('entry.upsert', KS, inLB(letter(KS, { text: 'Four.' })), { held_base: r.results[0].held.v })]);
check('a Keep on the held version it knew applies at once', r.results[0].applied === true && !(await heldRow(KS)) && (await marker(KS)) === 'kept');

// A repeated held.discard says what the first answer said (review K 2).
const KD = id7();
r = await push(A, [op('held.upsert', KD, inLB(held(KD, { typed: 'Five.' })))]);
const kdv = r.results[0].held.v;
await push(A, [op('held.upsert', KD, inLB(held(KD, { typed: 'Five, changed elsewhere.' })), { changed: ['text'], base: kdv })]);
const disc = op('held.discard', KD, {}, { base: kdv });
r = await push(A, [disc]);
const firstDiscard = r.results[0];
r = await push(A, [disc]);
check('[review K 2] a let-go that met newer words answers kept, and its repeat (a lost answer) says kept again',
  firstDiscard.kept === true && r.results[0].dup === true && r.results[0].kept === true && !!(await heldRow(KD)));

// A row's id never changes through the Data API (review K N2).
const KI = id7();
await push(A, [op('entry.upsert', KI, inLB(letter(KI, { text: 'Six.' })))]);
check('[review K N2] a direct change of a letter\'s id is refused (SCIMM)',
  (await codeOf(() => as(A, `update entries set id = $1 where id = $2`, [LE, KI]))) === 'SCIMM');
check('[review K N2] and of a held draft\'s id', (await codeOf(() => as(A, `update held_drafts set id = $1 where id = $2`, [LE, KD]))) === 'SCIMM');

// One push per person at a time (review K N1).
await sys(`delete from sync_rate_windows where profile_id = $1`, [A]);
await h.db.exec('begin');
await h.db.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)`,
  [A, JSON.stringify({ sub: A, role: 'authenticated', is_anonymous: false })]);
await h.db.exec('set local role authenticated');
await h.db.query(`select public.sync_push('[]'::jsonb)`);
await h.db.exec('reset role');
const personLock = (await h.db.query(`select count(*)::int c from pg_locks where locktype = 'advisory' and classid = 1732
  and objid = (hashtext($1)::bigint & 4294967295) and pid = pg_backend_pid()`, [A])).rows[0].c;
await h.db.exec('rollback');
check('[review K N1] sync_push holds a per-person lock until it commits, so one person\'s pushes never interleave', personLock === 1);

// An older letter gets its words version on its first non-word write (review K N4).
const KL = id7();
await push(A, [op('entry.upsert', KL, inLB(letter(KL, { text: 'Seven.' })))]);
await sys(`alter table entries disable trigger entries_sync_xid`);
await sys(`update entries set text_xid = null where id = $1`, [KL]);
await sys(`alter table entries enable trigger entries_sync_xid`);
const klv = (await entry(KL)).v;
await push(A, [op('entry.upsert', KL, inLB(letter(KL, { text: 'Seven.', inBook: false })), { changed: ['in_book'] })]);
check('[review K N4] the first non-word write of an older letter freezes its words version at the version handed out',
  (await entry(KL)).t === klv);
r = await push(A, [op('entry.upsert', KL, inLB(letter(KL, { text: 'Seven, edited.' })), { changed: ['text'], base: klv })]);
check('[review K N4] so a words edit on that version is no conflict', !r.results[0].conflict_groups && (await entry(KL)).final_text === 'Seven, edited.');

// Leaving a book keeps a held draft under a legal hold (review L N2).
const LHB = id7();
await push(B, [op('held.upsert', LHB, inLB(held(LHB)))]);
await sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by) values ('entry', $1, 'other', 'T-19', 'ops', '2027-01-01')`, [LHB]);
await as(B, `select public.leave_child($1, true)`, [LB]);
check('[review L N2] leaving a book keeps the leaver\'s held draft while a legal hold covers it', !!(await heldRow(LHB)));
await sys(`update legal_holds set released_at = now() where scope_id = $1`, [LHB]);

// ── 8. Every other delete path: leave, book purge, account deletion, replay ──
const BH = id7();
await push(B, [op('held.upsert', BH, held(BH))]);
check('before leaving: the co-parent holds two drafts in the book', (await heldRow(BH)) && (await heldRow(W3)));
await as(B, `select public.leave_child($1, true)`, [CHILD]);
check('leaving a book takes the leaver\'s held drafts of it (they could no longer reach them)', !(await heldRow(BH)) && !(await heldRow(W3))
  && (await ledger('held_draft', BH)));
// Account deletion: the auth user goes, everything keyed to the person cascades; the ledger keeps held_draft.
const SB = await newChild(S, 'Asha', '2025-04-12');
const SH = id7();
await sys(`delete from sync_rate_windows`);
const sHeld = { ...held(SH), child_id: SB };
await push(S, [op('held.upsert', SH, sHeld)]);
const SE = id7();
await push(S, [op('entry.upsert', SE, { ...letter(SE), child_id: SB })]);
await push(S, [op('entry.erase', SE)]);
await push(S, [op('held.upsert', id7(), { ...held(id7()), child_id: SB })]);
const SG = id7();
await push(S, [op('held.upsert', SG, { ...held(SG), child_id: SB })]);
await push(S, [op('held.discard', SG, {}, { base: (await heldRow(SG)).t })]);
check('before the book purge: a held draft, a marker and an erasure record in the book',
  (await heldRow(SH)) && (await marker(SG)) === 'discarded' && (await erasure(SE))?.child_id === SB);
await as(S, `select public.request_book_deletion($1, 'ios')`, [SB]);
await sys(`select public.purge_due(now() + interval '31 days')`);   // the book's 30 days are over
check('[F16 6.2 I] a book purge takes its held drafts, markers and erasure records, and ledgers held_draft',
  !(await heldRow(SH)) && (await marker(SG)) === undefined && !(await erasure(SE)) && (await ledger('held_draft', SH)));
// S is a co-parent of C's book, so the book stays when S's account goes (prepare_account_purge, then the auth user).
const S2 = await newChild(C, 'Asha', '2025-04-12');
await join(S, 'parent', S2, C);
const SH2 = id7();
await push(S, [op('held.upsert', SH2, { ...held(SH2), child_id: S2 })]);
const SE2 = id7();
await push(S, [op('entry.upsert', SE2, { ...letter(SE2), child_id: S2 })]);
await push(S, [op('entry.erase', SE2)]);
check('before the account deletion: the person\'s held draft and erasure record exist', (await heldRow(SH2)) && (await erasure(SE2))?.author_id === S);
const dreq = (await sys(`insert into deletion_requests (kind, profile_id, status, source, scheduled_for) values ('account', $1, 'executing', 'ios', now()) returning id`, [S])).rows[0].id;
await sys(`select public.prepare_account_purge($1)`, [dreq]);
await sys(`delete from auth.users where id = $1`, [S]);
check('[F17 8.4] account deletion takes the person\'s held drafts, markers and erasure records; held_draft is ledgered',
  !(await heldRow(SH2)) && (await sys(`select count(*)::int c from held_drafts_gone where author_id = $1`, [S])).rows[0].c === 0
  && !(await erasure(SE2)) && (await ledger('held_draft', SH2)));
await sys(`select public.finalize_account_deletion($1, '{}'::jsonb)`, [dreq]);
const residue = (await sys(`select public.ops_deletion_residue($1, 'after_finalize') r`, [S])).rows[0].r;
check('[DATA-REQ-034, review L N6] after finalize nothing keyed to the person is left, sync_private included', residue.length === 0);
const residueA = (await sys(`select public.ops_deletion_residue($1, 'after_finalize') r`, [A])).rows[0].r;
check('[review L N6] the residue scan reads sync_private (a living author\'s erasure records show up)',
  residueA.some((x) => x.table_schema === 'sync_private' && x.table_name === 'entry_erasures' && x.column_name === 'author_id'));
// A held draft under a legal hold holds the account deletion (review L N2).
const HU = '88888888-8888-8888-8888-888888888888';
await sys(`insert into auth.users values ('${HU}')`);
await consent(HU);
await join(HU, 'parent', S2, C);
const HH = id7();
await push(HU, [op('held.upsert', HH, { ...held(HH), child_id: S2 })]);
await sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by) values ('entry', $1, 'other', 'T-20', 'ops', '2027-01-01')`, [HH]);
const dreqH = (await sys(`insert into deletion_requests (kind, profile_id, status, source, scheduled_for) values ('account', $1, 'executing', 'ios', now()) returning id`, [HU])).rows[0].id;
const held2 = (await sys(`select public.prepare_account_purge($1) r`, [dreqH])).rows[0].r;
check('[review L N2] a held draft under a legal hold holds the account deletion (status held, the draft kept)',
  held2.held === true && (await sys(`select status from deletion_requests where id = $1`, [dreqH])).rows[0].status === 'held' && !!(await heldRow(HH)));
// The restore replay (RB-8).
const RH = id7();
const RW = id7();
await push(A, [op('held.upsert', RH, held(RH))]);
await push(A, [op('held.upsert', RW, held(RW, { kind: 'waiting_letter' }))]);
const replay = (await sys(`select public.ops_replay_ledger($1::jsonb) r`, [JSON.stringify([
  { t: 'held_draft', id: RH }, { t: 'held_draft', id: RW }, { t: 'entry', id: RW }, { t: 'audio_blob', id: RH }])])).rows[0].r;
check('[RB-8] the restore replay purges held drafts again (discarded), and an erased waiting letter again (erased)',
  replay.held_drafts === 2 && !(await heldRow(RH)) && (await marker(RH)) === 'discarded' && (await marker(RW)) === 'erased'
  && (await ledger('held_draft', RH)) && (await ledger('entry', RW)));
check('[RB-8] audio_blob rows are skipped while #151 is not applied', replay.audio_blobs === 0 && !(await ledger('audio_blob', RH)));

// ── 9. Incident scope (LEGAL-REQ-039) ────────────────────────────────────
const IH = id7();
await push(A, [op('held.upsert', IH, held(IH))]);
const scope = (await sys(`select public.ops_incident_scope($1::jsonb) v`, [JSON.stringify({ tables: ['held_drafts'] })])).rows[0].v;
check('[LEGAL-REQ-039] held drafts are in the incident scope as letter text', scope.profiles.some((p) => p.profile_id === A && p.categories.includes('letter_text')));
check('the backup tables are accepted in scope (counted once #151 is applied)',
  (await codeOf(() => sys(`select public.ops_incident_scope('{"tables": ["audio_blobs", "child_keys"]}')`))) === 'ok');

done();
