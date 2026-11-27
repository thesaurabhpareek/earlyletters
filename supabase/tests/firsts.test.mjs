// BL-2143 (from BL-968; NS-06 Part A, the server rows): a parent's own Firsts mark and label on a letter
// (20261127100000_entries_firsts.sql, supabase/APPLY.md File 51).
// Proves: the author marks their own letter and the label is stored exactly as typed (the constitution: the label is the parent's
// own words, never written or changed by the machine); the label ceiling is 200 code points (PRD A10, A23), so 40 Devanagari
// conjunct clusters and 40 Arabic letters pass and a 41st five-code-point cluster is refused, value-free (BL-244); a label needs a
// mark and a quiet day cannot be marked (A6); only the author writes (A13); a write without content consent is refused by the
// content trigger (the row's Done-when), and so is a write on a deleted letter (the trigger's way round); the other parent reads
// both columns through book_entries, and through the pull, only on a letter visible to them (A17); engine_version stays out of
// the view. Each rule has a mutant at the end that makes its check fail. Fictional family "Asha" only.
import { readFileSync } from 'node:fs';
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, join } = h;
const { A, B, C, N } = users;
for (const u of [A, B, C, N]) await sys(`insert into auth.users (id) values ($1) on conflict do nothing`, [u]);
await publishPolicies();
for (const u of [A, B, C, N]) await consent(u);
const CHILD = await newChild(A, 'Asha', '2025-04-12');
await join(B, 'parent', CHILD, A);          // the other parent
await join(N, 'contributor', CHILD, A);     // a relative

const trap = async (fn) => { try { await fn(); return null; } catch (e) { return e; } };
// A refusal that names the rule and nothing of the label: SQLSTATE 23514, the CHECK's name, no DETAIL, no HINT, no value.
const bare = (e, rule, value) => e?.code === '23514' && e.constraint === rule && !e.detail && !e.hint
  && !String(e.message).includes(value.slice(0, 8));
const letter = async (uid, { inBook = true, kind = 'letter', text = 'Asha took three steps to the sofa.' } = {}) => {
  const id = uuid7();
  await as(uid, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version,
      raw_transcript, final_text, in_book)
    values ($1, $2, $3, $4, '2026-10-01', now(), 'spoken', 7, $5, $5, $6)`, [id, CHILD, uid, kind, text, inBook]);
  return id;
};
const mark = (uid, id, label, first = true) =>
  as(uid, `update entries set first_mark = $2, first_label = $3 where id = $1 returning id`, [id, first, label]);
const stored = async (id) => (await sys(`select first_mark, first_label from entries where id = $1`, [id])).rows[0];
const pull = async (uid) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await one(uid, `select public.sync_pull('{}'::jsonb, 200) r`)).r;
};
const rowOf = (r, id) => (r.books ?? []).flatMap((b) => b.rows ?? []).find((x) => x.id === id);
const graphemes = (s) => [...new Intl.Segmenter('hi', { granularity: 'grapheme' }).segment(s)].length;
const codePoints = (s) => [...s].length;

// --- A relative's label is new words: an added letter goes back for a parent's yes (review of #2135) ------------------------
const apr = async (id) => (await sys(`select approval, in_book from entries where id = $1`, [id])).rows[0];
const LRel = await letter(N);                         // the relative's own letter, sent to the book
await as(A, `select public.review_family_letter($1, 'added')`, [LRel]);
const nAddedOk = (await apr(LRel)).approval === 'added';
await mark(N, LRel, null);                             // a mark alone, no words
const afterMark = await apr(LRel);
await mark(N, LRel, 'Asha said ball');                 // new words in the book
const afterLabel = await apr(LRel);
check('[BL-2143] fixture: a parent added the relative\'s letter', nAddedOk);
check('[BL-2143] a relative\'s mark alone keeps the parent\'s yes (as a new date does)', afterMark.approval === 'added' && afterMark.in_book === true);
check('[BL-2143] a relative\'s new label sends the added letter back for a parent\'s yes (pending, out of the book)',
  afterLabel.approval === 'pending' && afterLabel.in_book === false);

// --- The columns, and nothing filled by the machine -------------------------------------------------------------------------
const LB = await letter(A);                          // in the book: the other parent may read it
check('[NS-06-A1] a new letter is not a first and has no label (nothing is set for the parent)',
  JSON.stringify(await stored(LB)) === JSON.stringify({ first_mark: false, first_label: null }));
const LABEL = 'Asha\u2019s first steps, to the sofa ';  // a trailing space and a typographic apostrophe, kept as typed
check('[NS-06-A1] the author marks their own letter with a label', (await mark(A, LB, LABEL)).rows.length === 1);
check('[NS-06-A1] the label is stored exactly as typed (no trim, no change)', (await stored(LB)).first_label === LABEL);
const NFD = 'Asha\u0301 e\u0301te\u0301';           // combining accents (decomposed): never normalised
const LN = await letter(A);
await mark(A, LN, NFD);
check('[NS-06-A1] a decomposed label keeps its code points (the server never normalises the parent\'s words)',
  (await stored(LN)).first_label === NFD && (await stored(LN)).first_label !== NFD.normalize('NFC'));
const LM = await letter(A);
await mark(A, LM, null);
check('[NS-06-A1] a mark with no label stays without one (the label is optional and never filled in)',
  JSON.stringify(await stored(LM)) === JSON.stringify({ first_mark: true, first_label: null }));
const fill = (await sys(`select count(*)::int n from pg_proc p where p.pronamespace = 'public'::regnamespace
  and p.prosrc ~ 'new\\.first_label\\s*:='`)).rows[0].n;
check('[NS-06-A5] no function in public assigns first_label (no machine writes the label)', fill === 0);

// --- The ceiling: 200 code points; the 40 grapheme rule is the phone's (PRD A23) ---------------------------------------------
const CLUSTER = '\u0938\u094d\u0924\u094d\u0930';    // a Devanagari conjunct: 5 code points, one grapheme cluster
const ARABIC = '\u0628';                             // one Arabic letter
const dev40 = CLUSTER.repeat(40), dev41 = CLUSTER.repeat(41), ar40 = ARABIC.repeat(40);
check('[NS-06-A23] the fixtures are what they say (Intl.Segmenter): 40 and 41 clusters, 200 and 205 code points',
  graphemes(dev40) === 40 && codePoints(dev40) === 200 && graphemes(dev41) === 41 && codePoints(dev41) === 205
  && graphemes(ar40) === 40);
const LL = await letter(A);
check('[NS-06-A23] a label of 40 Devanagari conjunct clusters (200 code points) is accepted', (await trap(() => mark(A, LL, dev40))) === null);
check('[NS-06-A23] a label of 40 Arabic letters is accepted', (await trap(() => mark(A, LL, ar40))) === null);
const e41 = await trap(() => mark(A, LL, dev41));
check('[BL-2143] a 41-grapheme label of five-code-point clusters (205 code points) is refused, 23514, value-free',
  bare(e41, 'entries_first_label_length', dev41));
const e201 = await trap(() => mark(A, LL, 'a'.repeat(201)));
check('[BL-2143] a label of 201 code points is refused, value-free', bare(e201, 'entries_first_label_length', 'a'.repeat(201)));
check('[BL-2143] a label of 200 code points is accepted (the edge)', (await trap(() => mark(A, LL, 'a'.repeat(200)))) === null);
check('[BL-2143] an empty label is refused (no label is null, not an empty string)',
  (await trap(() => mark(A, LL, '')))?.constraint === 'entries_first_label_length');
// Karma's call (PR body): Postgres cannot count grapheme clusters, so a 41-letter ASCII label is the phone's to refuse
// (BL-968, Intl.Segmenter). The server holds the code point backstop only; a server grapheme count that differed from the
// phone's would refuse words the parent was allowed to type.
check('[NS-06-A23] the server counts code points, not graphemes: 41 ASCII letters pass the server (the phone refuses them)',
  (await trap(() => mark(A, LL, 'a'.repeat(41)))) === null);
check('[BL-2143] the refused writes changed nothing (the last accepted label stands)', (await stored(LL)).first_label === 'a'.repeat(41));

// --- A label needs a mark; a quiet day is never marked (A6) ---------------------------------------------------------------
const eNoMark = await trap(() => mark(A, LL, 'Asha laughed', false));
check('[BL-2143] a label without a mark is refused, value-free', bare(eNoMark, 'entries_first_label_needs_mark', 'Asha laughed'));
check('[BL-2143] unmarking with the label cleared is accepted', (await trap(() => mark(A, LL, null, false))) === null
  && JSON.stringify(await stored(LL)) === JSON.stringify({ first_mark: false, first_label: null }));
const LQ = await letter(A, { kind: 'not_much', text: 'A quiet day.' });
check('[NS-06-A6] a quiet day cannot be marked (23514, the rule named)',
  (await trap(() => mark(A, LQ, null)))?.constraint === 'entries_first_not_quiet');
check('[NS-06-A6] a marked letter cannot become a quiet day',
  (await trap(() => as(A, `update entries set kind = 'not_much' where id = $1`, [LB])))?.constraint === 'entries_first_not_quiet');
check('[NS-06-A6] the table CHECKs are the last line, by definition',
  (await sys(`select count(*)::int n from pg_constraint where conrelid = 'public.entries'::regclass and contype = 'c'
    and conname in ('entries_first_label_length', 'entries_first_label_needs_mark', 'entries_first_not_quiet')`)).rows[0].n === 3);

// --- Only the author marks (A13) -----------------------------------------------------------------------------------------
for (const [who, uid] of [['the other parent', B], ['a contributor', N], ['a stranger', C]]) {
  // Row security hides the row from the update (no row, no error); a write that errors is refused too.
  const r = await mark(uid, LB, 'Not theirs').catch((e) => e);
  check(`[NS-06-A13] ${who} cannot mark or label the author's letter (no row changes)`,
    (r instanceof Error || r.rows.length === 0) && (await stored(LB)).first_label === LABEL);
}

// --- Content consent (the row's Done-when): the content trigger refuses a write of first_label ------------------------------
const LG = await letter(B);                         // B's own letter
await mark(B, LG, null);                            // marked while B still has consent
await as(B, `select public.record_policy_act('sensitive-data', '1.0.0', 'withdraw', 'settings_toggle', 'settings.privacy', '1.0.0', 'ios')`);
check('[NS-06-A-consent] without content consent a write of first_label is refused by the content trigger (SCCON)',
  (await codeOf(() => mark(B, LG, 'Asha clapped'))) === 'SCCON' && (await stored(LG)).first_label === null);
check('[NS-06-A-consent] without content consent marking and unmarking are refused too (SCCON)',
  (await codeOf(() => mark(B, LG, null, false))) === 'SCCON' && (await stored(LG)).first_mark === true);
check('[LEGAL-REQ-009] without consent the letter can still be deleted (the gate pauses, it does not trap)',
  (await codeOf(() => as(B, `update entries set deleted_at = now() where id = $1`, [LG]))) === 'ok');
const LG2 = (await sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version,
    raw_transcript, final_text, in_book, first_mark)
  values ($1, $2, $3, 'letter', '2026-10-02', now(), 'spoken', 7, 'Asha hummed.', 'Asha hummed.', true, true) returning id`,
  [uuid7(), CHILD, B])).rows[0].id;           // an older row, written while B had consent
await as(B, `select public.record_policy_act('sensitive-data', '1.0.0', 'accept', 'consent_sheet', 'consent.sensitive', '1.0.0', 'ios')`);
check('[NS-06-A-consent] the same write with consent passes', (await codeOf(() => mark(B, LG2, 'Asha clapped'))) === 'ok'
  && (await stored(LG2)).first_label === 'Asha clapped');

// --- A deleted letter keeps its mark and label, unchanged, and gets them back on restore (A8) --------------------------------
const LD = await letter(A);
await mark(A, LD, 'Asha said ball');
await as(A, `update entries set deleted_at = now() where id = $1`, [LD]);
check('[NS-06-A8] a deleted letter\'s label cannot be changed by the author (SCTMB, the content gate cannot be gone round)',
  (await codeOf(() => mark(A, LD, 'changed'))) === 'SCTMB' && (await stored(LD)).first_label === 'Asha said ball');
check('[NS-06-A8] nor can its mark', (await codeOf(() => mark(A, LD, null, false))) === 'SCTMB');
await as(A, `select public.restore_entry($1)`, [LD]);
check('[NS-06-A8] on restore the mark and label return with the letter',
  JSON.stringify(await stored(LD)) === JSON.stringify({ first_mark: true, first_label: 'Asha said ball' }));

// --- The other parent reads both through book_entries, only on a letter visible to them (A17) --------------------------------
const PRIVATE = 'SENTINEL_FIRST Asha said dada';
const LP = await letter(A, { inBook: false });       // the author's private letter
await mark(A, LP, PRIVATE);
const viewCols = (await sys(`select column_name from information_schema.columns where table_schema = 'public'
  and table_name = 'book_entries' order by ordinal_position`)).rows.map((r) => r.column_name);
check('[BL-2143] book_entries has first_mark and first_label, appended last', viewCols.slice(-2).join() === 'first_mark,first_label');
check('[BL-2143] engine_version is still absent from book_entries (20261123200000 kept)', !viewCols.includes('engine_version')
  && viewCols.length === 25);
check('[BL-2143] the author\'s table still has engine_version (the check above is not vacuous)',
  (await sys(`select count(*)::int n from information_schema.columns where table_schema = 'public' and table_name = 'entries'
    and column_name = 'engine_version'`)).rows[0].n === 1);
check('[BL-2143] no client role reads book_entries directly (42501; reads go through the pull)',
  (await codeOf(() => as(B, `select first_label from book_entries`))) === '42501');
const viewAs = async (uid, id) => {
  await sys(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`,
    [uid, JSON.stringify({ sub: uid, role: 'authenticated' })]);
  try { return (await sys(`select first_mark, first_label from book_entries where id = $1`, [id])).rows[0]; }
  finally { await sys(`select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false)`); }
};
check('[NS-06-A17] the other parent sees both columns through book_entries on a letter in the book',
  JSON.stringify(await viewAs(B, LB)) === JSON.stringify({ first_mark: true, first_label: LABEL }));
check('[NS-06-A17] the other parent gets no book_entries row for the author\'s private letter', (await viewAs(B, LP)) === undefined);

const rB = await pull(B);
const rowB = rowOf(rB, LB);
check('[NS-06-A17] the other parent\'s pull carries the letter with its mark and label, as typed',
  rowB?.own === false && rowB.first_mark === true && rowB.first_label === LABEL);
check('[NS-06-A17] a private letter\'s label never reaches the other parent\'s pull', !JSON.stringify(rB).includes('SENTINEL_FIRST'));
check('[BL-2143] the other parent\'s pulled row has no engine_version key', rowB && !('engine_version' in rowB));
await sys(`update children set family_can_read = true where id = $1`, [CHILD]);
const rN = await pull(N);
check('[NS-06-A17] a contributor, while the family can read, gets the label on a letter in the book, and no private one',
  rowOf(rN, LB)?.first_label === LABEL && !JSON.stringify(rN).includes('SENTINEL_FIRST'));
check('[NS-06-A17] a stranger\'s pull carries no label', !JSON.stringify(await pull(C)).includes(LABEL));

// --- Classification (PRINCIPLES 10) --------------------------------------------------------------------------------------------
const levels = Object.fromEntries((await sys(`select c.relname || '.' || a.attname k, col_description(c.oid, a.attnum) d
  from pg_attribute a join pg_class c on c.oid = a.attrelid where c.relnamespace = 'public'::regnamespace
   and c.relname in ('entries', 'book_entries') and a.attname in ('first_mark', 'first_label')`)).rows.map((r) => [r.k, r.d]));
check('[NS-36-R10] first_mark is L3 and first_label is L4, on the table and the view',
  ['entries', 'book_entries'].every((t) => /^L3\b/.test(levels[`${t}.first_mark`] ?? '') && /^L4\b/.test(levels[`${t}.first_label`] ?? '')));

// --- The founder's hosted check in APPLY.md File 51, run as written (extracted from the doc, so the two cannot drift) --------
const apply = readFileSync(new URL('../APPLY.md', import.meta.url), 'utf8');
const from = apply.indexOf('## File 51:');
const end = apply.indexOf('\n## ', from + 1);
const sec = from < 0 ? '' : apply.slice(from, end < 0 ? undefined : end);
const q = /\*\*Check \[U\] \(hosted, founder\):\*\* `([^`]+)`/.exec(sec)?.[1];
check('[BL-2143] APPLY.md File 51 has a check query to run', !!q);
check('[BL-2143] the File 51 check query is true on the migrated schema', q && (await sys(q)).rows[0].ok === true);

// --- Mutants: each rule above taken out, and its check fails -----------------------------------------------------------------
const def = async (fn) => (await sys(`select pg_get_functiondef($1::regprocedure) d`, [fn])).rows[0].d;
const familyRules = await def('public.entries_family_rules()');
const guard = await def('public.entries_guard_immutable()');
const limits = await def('public.entries_validate_limits()');

// Mutant 1: the two columns left out of the content tuple, so a write without consent passes.
const noTuple = familyRules.replace(/,\s*-- BL-2143[^\n]*\n\s*new\.first_mark, new\.first_label\)/, ')')
  .replace(/,\s*old\.first_mark, old\.first_label\)/, ')');
check('[mutant] the content-tuple mutant differs from the trigger (the mutant is real)', noTuple !== familyRules);
await sys(noTuple);
await as(B, `select public.record_policy_act('sensitive-data', '1.0.0', 'withdraw', 'settings_toggle', 'settings.privacy', '1.0.0', 'ios')`);
check('[mutant] without first_label in the tuple, a write without consent passes, so the SCCON check can fail',
  (await codeOf(() => mark(B, LG2, 'Asha waved'))) === 'ok');
await sys(familyRules);
check('[mutant] with the trigger restored the same write is SCCON again', (await codeOf(() => mark(B, LG2, 'Asha ran'))) === 'SCCON');
// B gives consent again, so the pull mutants below have a pull to read (a withdrawn caller pulls an empty page, FR-PRV-20).
await as(B, `select public.record_policy_act('sensitive-data', '1.0.0', 'accept', 'consent_sheet', 'consent.sensitive', '1.0.0', 'ios')`);

// Mutant 1b: first_label left out of the approval reset, so a relative's new label keeps the parent's earlier yes.
const noReset = familyRules.replace('(new.final_text, new.first_label) is distinct from (old.final_text, old.first_label)',
  'new.final_text is distinct from old.final_text');
check('[mutant] the reset mutant differs from the trigger (the mutant is real)', noReset !== familyRules);
const LRel2 = await letter(N);
await as(A, `select public.review_family_letter($1, 'added')`, [LRel2]);
await sys(noReset);
await mark(N, LRel2, 'Asha said dog');
check('[mutant] without first_label in the reset a relative\'s new label stays added, so the pending check can fail',
  (await apr(LRel2)).approval === 'added');
await sys(familyRules);

// Mutant 2: the tombstone guard without the two columns, so a deleted letter's label changes (round the consent gate).
const noTomb = guard.replace(/\n\s*-- BL-2143[^\n]*\n\s*or new\.first_mark is distinct from old\.first_mark\n\s*or new\.first_label is distinct from old\.first_label\)/, ')');
check('[mutant] the tombstone mutant differs from the guard (the mutant is real)', noTomb !== guard);
await sys(noTomb);
await as(A, `update entries set deleted_at = now() where id = $1`, [LD]);
check('[mutant] without the guard lines a deleted letter\'s label can be changed, so the SCTMB check can fail',
  (await codeOf(() => mark(A, LD, 'changed'))) === 'ok');
await sys(guard);

// Mutant 3: the value-free lines and the length CHECK removed, so 205 code points are accepted.
const noLimit = limits.replace(/\n\s*-- BL-2143[\s\S]*?entries_first_label_length';\n\s*end if;/, '');
check('[mutant] the length mutant differs from the trigger (the mutant is real)', noLimit !== limits);
await sys('begin');
await sys(noLimit);
await sys(`alter table public.entries drop constraint entries_first_label_length`);
check('[mutant] without the ceiling a 205 code point label is accepted, so the refusal check can fail',
  (await trap(() => mark(A, LL, dev41))) === null);
await sys('rollback');

// Mutant 4: a broader view (no in_book filter) lets the private label reach the other parent's pull.
await sys(`create or replace view public.book_entries with (security_barrier = true) as
  select e.id, e.child_id, e.author_id, e.author_signs_as, e.kind, e.occurred_on, e.captured_at, e.capture_mode, e.edit_level,
         e.prompt_key, e.prompt_library_version, e.final_text, e.in_book, e.photo_path, e.audio_kept_on_device,
         e.sounds_like_me, e.created_at, e.updated_at, e.deleted_at, e.search, e.approval, e.occurred_precision, e.base_direction,
         e.first_mark, e.first_label
    from public.entries e
   where e.author_id = (select auth.uid())
      or (e.deleted_at is null and e.child_id in (select m.child_id from public.child_members m where m.profile_id = (select auth.uid())))`);
check('[mutant] with a broader view the private label reaches the other parent, so the A17 check can fail',
  JSON.stringify(await pull(B)).includes('SENTINEL_FIRST'));

// Mutant 5: the view without the two columns (20261123200000 as it was): the other parent's pull carries no label.
await sys(`drop view public.book_entries`);
await sys(`create view public.book_entries with (security_barrier = true) as
  select e.id, e.child_id, e.author_id, e.author_signs_as, e.kind, e.occurred_on, e.captured_at, e.capture_mode, e.edit_level,
         e.prompt_key, e.prompt_library_version, e.final_text, e.in_book, e.photo_path, e.audio_kept_on_device,
         e.sounds_like_me, e.created_at, e.updated_at, e.deleted_at, e.search, e.approval, e.occurred_precision, e.base_direction
    from public.entries e
   where e.author_id = (select auth.uid())
      or (e.deleted_at is null and e.in_book and e.child_id in (select m.child_id from public.child_members m where m.profile_id = (select auth.uid())))`);
const rMut = rowOf(await pull(B), LB);
check('[mutant] without the columns on the view the other parent\'s row has no label, so the A17 carry check can fail',
  rMut && !('first_label' in rMut) && !('first_mark' in rMut));
check('[mutant] and the File 51 check query is false on that schema', q && (await sys(q)).rows[0].ok === false);

done();
