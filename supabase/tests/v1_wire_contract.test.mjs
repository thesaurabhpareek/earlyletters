// The v1.0 wire-contract columns (20261015030000; F16-REQ-028, R2 AR-31, AR-32;
// WP-F04-14; WP-F06-07 and WP-F07-04 server columns). The op parser and the pull
// row carry every column; an older app that never sends a field never clears it;
// the author layer stays author-only; pack_ref is set once, then immutable.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, publishPolicies, consent, newChild, join, done } = h;
const { A, B, C } = users;
await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}')`);
await publishPolicies();
for (const u of [A, B, C]) await consent(u);
const CHILD = await newChild(A, 'Asha', '2025-04-12');
await join(B, 'parent', CHILD, A);

const push = async (u, ops) => (await one(u, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).r;
const pull = async (u) => (await one(u, `select public.sync_pull('{}'::jsonb, 200) r`)).r;
const op = (type, id, data = {}, extra = {}) => ({ op: uuid7(), type, id, data, ...extra });
const base = (text, extra = {}) => ({
  child_id: CHILD, kind: 'letter', occurred_on: '2026-02-01', captured_at: '2026-02-01T10:00:00.000Z', capture_mode: 'spoken',
  engine_version: 5, raw_transcript: 'um the words as spoken', final_text: text, in_book: true, language: 'ar', ...extra,
});
const row = async (id) => (await sys(`select occurred_precision, base_direction, author_edits, locked_spans, pack_ref, language, final_text
                                        from entries where id = $1`, [id])).rows[0];
// jsonb keeps its own key order, so compare JSON values with sorted keys.
const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v);
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const NEW_KEYS = ['occurred_precision', 'base_direction', 'author_edits', 'locked_spans', 'pack_ref'];

// ── A new app sends every field ──────────────────────────────────────────
const full = uuid7();
const AE = [{ start: 0, end: 4, replacement: 'Habibti' }];
const LS = [{ start: 6, end: 12 }];
let r = await push(A, [op('entry.upsert', full, base('Habibi, you laughed.', {
  occurred_on: '2026-01-20', occurred_precision: 'month', base_direction: 'rtl', author_edits: AE, locked_spans: LS, pack_ref: 'ar@1.2.0' }))]);
let x = await row(full);
check('[F16-REQ-028] sync_push stores the five v1.0 fields', r.results[0].ok && x.occurred_precision === 'month' && x.base_direction === 'rtl'
  && same(x.author_edits, AE) && same(x.locked_spans, LS) && x.pack_ref === 'ar@1.2.0');
const mine = (await pull(A)).books[0].rows.find((y) => y.id === full);
check('[F16-REQ-028] the author\'s pull row carries them, field for field',
  NEW_KEYS.every((k) => k in mine) && mine.occurred_precision === 'month' && mine.pack_ref === 'ar@1.2.0' && mine.author_edits.length === 1);
const theirs = (await pull(B)).books[0].rows.find((y) => y.id === full);
check('[F04-REQ-015] the other parent reads the date precision and the direction',
  theirs.occurred_precision === 'month' && theirs.base_direction === 'rtl');
check('[F06-REQ-033] the other parent never receives the author layer, the pack or the language',
  !('author_edits' in theirs) && !('locked_spans' in theirs) && !('pack_ref' in theirs) && !('language' in theirs) && !('raw_transcript' in theirs));
for (const col of ['author_edits', 'locked_spans', 'pack_ref', 'language']) {
  check(`[PRD-REQ-004 Rev] book_entries has no ${col}`, (await codeOf(() => as(B, `select ${col} from book_entries`))) === '42703');
}
check('the other parent cannot read the row from entries', (await as(B, `select 1 from entries where id = $1`, [full])).rows.length === 0);

// ── An older app sends none of them ──────────────────────────────────────
const old = uuid7();
await push(A, [op('entry.upsert', old, base('From an older build.', { language: undefined }))]);
x = await row(old);
check('[F16-REQ-028] an older app\'s letter gets the defaults (day, ltr, nulls)',
  x.occurred_precision === 'day' && x.base_direction === 'ltr' && x.author_edits === null && x.locked_spans === null && x.pack_ref === null);
// The old build edits the words of the new letter: none of the new fields change.
r = await push(A, [op('entry.upsert', full, base('Habibi, you laughed so much.', { occurred_on: '2026-01-20' }), { changed: ['text', 'occurred_on'] })]);
x = await row(full);
check('[F16-REQ-028] an older app that never sends the fields never clears them',
  r.results[0].ok && x.final_text === 'Habibi, you laughed so much.' && x.occurred_precision === 'month' && x.base_direction === 'rtl'
  && same(x.author_edits, AE) && x.pack_ref === 'ar@1.2.0');
// A whole-letter upload (no "changed") from a phone that does not know them: still kept.
await push(A, [op('entry.upsert', full, base('Habibi, you laughed so much.', { occurred_on: '2026-01-20' }))]);
x = await row(full);
check('a whole-letter upload without the fields keeps them too', x.occurred_precision === 'month' && x.locked_spans !== null);

// ── Field groups ─────────────────────────────────────────────────────────
r = await push(A, [op('entry.upsert', full, base('Habibi, you laughed so much.', { occurred_on: '2026-01-20', author_edits: [], occurred_precision: 'day' }),
  { changed: ['in_book'] })]);
x = await row(full);
check('[F16-REQ-011] the words-group fields change only with the text group, precision only with occurred_on',
  same(x.author_edits, AE) && x.occurred_precision === 'month');
await push(A, [op('entry.upsert', full, base('Habibi.', { occurred_on: '2026-01-20', author_edits: [], locked_spans: null, base_direction: 'rtl' }),
  { changed: ['text'] })]);
x = await row(full);
check('with the text group they change together with the words', x.final_text === 'Habibi.' && JSON.stringify(x.author_edits) === '[]' && x.locked_spans === null);
await push(A, [op('entry.upsert', full, base('Habibi.', { occurred_on: '2026-02-01', occurred_precision: 'day' }), { changed: ['occurred_on'] })]);
check('precision changes with occurred_on', (await row(full)).occurred_precision === 'day');

// ── pack_ref is set once, then immutable (DATA-REQ-040 Rev) ──────────────
r = await push(A, [op('entry.upsert', full, base('Habibi.', { pack_ref: 'ar@1.3.0' }), { changed: ['text'] })]);
check('[F06-REQ-024] a different pack_ref is SCIMM (the op is rejected, the value stays)',
  r.results[0].ok === false && r.results[0].code === 'SCIMM' && (await row(full)).pack_ref === 'ar@1.2.0');
check('nor directly', (await codeOf(() => as(A, `update entries set pack_ref = 'ar@9' where id = $1`, [full]))) === 'SCIMM');
check('clearing a pack_ref is SCIMM too', (await codeOf(() => as(A, `update entries set pack_ref = null where id = $1`, [full]))) === 'SCIMM');
// A letter uploaded without a pack (an older build) records one once, with its words in the same op.
r = await push(A, [op('entry.upsert', old, base('From an older build, cleaned again.', { language: undefined, pack_ref: 'en@1.0.0' }), { changed: ['text'] })]);
x = await row(old);
check(`a letter without a pack records one once, words included (${JSON.stringify(r.results[0].code ?? 'ok')})`,
  r.results[0].ok && x.pack_ref === 'en@1.0.0' && x.final_text === 'From an older build, cleaned again.');
r = await push(A, [op('entry.upsert', old, base('From an older build, cleaned again.', { language: undefined, pack_ref: 'en@1.1.0' }), { changed: ['text'] })]);
check('after that it is immutable (SCIMM)', r.results[0].ok === false && r.results[0].code === 'SCIMM' && (await row(old)).pack_ref === 'en@1.0.0');
r = await push(A, [op('entry.upsert', full, base('Habibi.', { pack_ref: 'ar@1.2.0' }), { changed: ['text'] })]);
check(`the same pack_ref again is fine (${JSON.stringify(r.results[0].code ?? 'ok')})`, r.results[0].ok);

// ── Shapes ───────────────────────────────────────────────────────────────
const bad = async (extra) => (await push(A, [op('entry.upsert', uuid7(), base('x', extra))])).results[0].code;
check('occurred_precision outside day and month is refused (23514)', (await bad({ occurred_precision: 'year' })) === '23514');
check('base_direction outside ltr and rtl is refused', (await bad({ base_direction: 'up' })) === '23514');
check('author_edits must be an array', (await bad({ author_edits: { start: 0 } })) === '23514');
check('locked_spans must be an array', (await bad({ locked_spans: 'all' })) === '23514');
check('pack_ref must look like lang@version', (await bad({ pack_ref: 'arabic pack' })) === '23514' && (await bad({ pack_ref: 'hi@2.0.1' })) === undefined);

// ── Dictionary forms (WP-F07-04 server column) ──────────────────────────
let terms = 0;
const term = (forms) => codeOf(() => as(A, `insert into dictionary_terms (owner_id, child_id, term, kind, forms) values ($1, $2, $3, 'family', $4::jsonb)`,
  [A, CHILD, `Nani ${++terms}`, forms === null ? null : JSON.stringify(forms)]));
check('[F07-REQ-008] a term with forms per script is stored',
  (await term([{ script: 'latin', text: 'Asha', heardAs: ['Asia'] }, { script: 'devanagari', text: 'आशा', heardAs: [], offerOnly: [] }])) === 'ok');
check('forms stay optional until WP-F07-04 backfills them', (await term(null)) === 'ok');
check('an unknown script is refused', (await term([{ script: 'klingon', text: 'Asha' }])) === '23514');
check('an empty or overlong form is refused', (await term([{ script: 'latin', text: ' ' }])) === '23514' && (await term([{ script: 'latin', text: 'a'.repeat(81) }])) === '23514');
check('two forms in one script are refused', (await term([{ script: 'latin', text: 'Asha' }, { script: 'latin', text: 'Aasha' }])) === '23514');
check('an unknown key is refused', (await term([{ script: 'latin', text: 'Asha', made_by: 'model' }])) === '23514');
check('no forms at all ([]) is refused', (await term([])) === '23514');

// ── Prefs: notify_letters joins prefs.upsert ─────────────────────────────
r = await push(B, [op('prefs.upsert', CHILD, { notify_letters: false })]);
check('[F11-REQ-014] prefs.upsert carries notify_letters', r.results[0].ok
  && (await sys(`select notify_letters from child_member_prefs where child_id = $1 and profile_id = $2`, [CHILD, B])).rows[0].notify_letters === false);
await push(B, [op('prefs.upsert', CHILD, { signs_as: 'Baba' })]);
check('a prefs op without the key keeps it', (await sys(`select notify_letters, signs_as from child_member_prefs where child_id = $1 and profile_id = $2`, [CHILD, B])).rows[0]
  .notify_letters === false);
check('an unknown preference is still 22023', (await push(B, [op('prefs.upsert', CHILD, { colour: 'red' })])).results[0].code === '22023');
check('a person cannot set another person\'s preference', (await as(C, `update child_member_prefs set notify_letters = true where child_id = $1`, [CHILD])).affectedRows === 0);

// ── Consent covers the new columns (review L N9 on #208) ─────────────────
// With sensitive-data consent withdrawn, a direct update of any v1.0 column on one's own letter is SCCON,
// as an edit of the words is; taking the letter out of the book or deleting it never is (LEGAL-REQ-009).
const gated = uuid7();
await push(A, [op('entry.upsert', gated, base('Before the pause.', { language: undefined }))]);
await as(A, `select public.record_policy_act('sensitive-data', '1.0.0', 'withdraw', 'settings_toggle', 'settings.privacy', '1', 'ios')`);
for (const [col, val] of [['author_edits', `'[]'::jsonb`], ['locked_spans', `'[]'::jsonb`], ['pack_ref', `'ar@1.0.0'`],
  ['occurred_precision', `'month'`], ['base_direction', `'rtl'`]]) {
  check(`[LEGAL-REQ-006] without consent a direct update of ${col} is refused (SCCON)`,
    (await codeOf(() => as(A, `update entries set ${col} = ${val} where id = $1`, [gated]))) === 'SCCON');
}
check('[LEGAL-REQ-009] without consent the letter can still leave the book and be deleted',
  (await codeOf(() => as(A, `update entries set in_book = false where id = $1`, [gated]))) === 'ok'
  && (await codeOf(() => as(A, `select public.delete_entry($1)`, [gated]))) === 'ok');
await as(A, `select public.record_policy_act('sensitive-data', '1.0.0', 'accept', 'consent_sheet', 'consent.sensitive', '1', 'ios')`);

// ── R2 AR-32: no audio hash on the wire ─────────────────────────────────
check('[R2 AR-32] entries has no audio_sha256 (restore matches by entry id against audio_blobs, F16 6.2 D)',
  (await sys(`select count(*)::int n from pg_attribute where attrelid = 'public.entries'::regclass and attname = 'audio_sha256'`)).rows[0].n === 0);

done();
