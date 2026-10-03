/**
 * The verifier: code that decides which proposed edits are allowed.
 *
 * Every edit, from a rule or a model, passes through here. A model can
 * propose anything; only edits that provably remove or repair (never add
 * meaning) are applied. See PRD v2 section 16.3 and TDD 03 section 7.1.
 *
 * An edit is refused when it would change:
 *  - negation (not, n't, never, no, cannot),
 *  - tense or aspect (is -> was, loves -> loved) or a modal (can -> could),
 *  - a word through a contraction or a joined/split word (were -> we're),
 *  - a name or pronoun, except a dictionary-backed stt_fix,
 *  - sentence type (. -> ?, ! removed), quotation marks, or any number,
 *  - or when a removal labelled filler, repeat or false start deletes
 *    anything that is not a filler, an accidental repeat or a real restart,
 *  - or any letter, combining mark (vowel sign, virama, nukta, accent) or
 *    digit, or a boundary that cuts a letter from its marks (CORE-01).
 * Fillers, accidental repeats, dictionary name fixes, sentence case and a
 * final period where none was are still accepted.
 */
import type { DictionaryTerm, Edit, EditLevel, EditType, RejectReason, RejectedEdit, Span } from './types';
import { FILLERS, FUNCTION_WORDS, frozenSet, lettersOnly, nfc, splitsCluster, tokens, WORD_CHAR_CLASS, words, type Token } from './text';
import { isDictionaryTerm, overlaps } from './protect';
import { REPEAT_ALWAYS, REPEAT_SUGGEST_ONLY } from './repeats';
import {
  classifyWordSwap,
  isAgreementPair,
  isNegation,
  isPronounI,
  isProtectedWord,
  moodMarks,
  negationCount,
  norm,
  numbersOf,
  quoteMarkCount,
  soundsLike,
} from './meaning';

/** Starting values. Tune on real recordings (PRD v2 section 24, experiment 2). */
export const CEILING_RATIO = 0.15;
export const CEILING_MIN_WORDS = 3;

const LEVEL_TYPES: Readonly<Record<EditLevel, ReadonlySet<EditType>>> = Object.freeze({
  clean: frozenSet<EditType>(['filler', 'false_start', 'repeat', 'stt_fix', 'punctuation', 'agreement', 'paragraph']),
  verbatim: frozenSet<EditType>(['stt_fix', 'punctuation']),
});

const REMOVAL_TYPES: ReadonlySet<EditType> = frozenSet<EditType>(['filler', 'repeat', 'false_start']);

/**
 * Single words whose immediate double is an accidental repeat, not emphasis.
 * The same lists the deterministic repeat rules use, plus "was" ("she was was").
 * "very very", "bye bye", "no no" are how people talk and are kept.
 */
const REPEATABLE_WORDS: ReadonlySet<string> = frozenSet([...REPEAT_ALWAYS, ...REPEAT_SUGGEST_ONLY, 'was']);

/** A phrase ending in one of these is unfinished, so saying it again is a restart. */
const DANGLING: ReadonlySet<string> = frozenSet([
  'a', 'an', 'the', 'my', 'your', 'our', 'their', 'his', 'its', 'to', 'of', 'with', 'for', 'from', 'at', 'and', 'but',
  'or', 'because', 'into', 'onto',
]);

function sentenceIndex(raw: string, pos: number): number {
  return (raw.slice(0, pos).match(/[.!?](\s|$)/g) ?? []).length;
}

function count(text: string, ch: string): number {
  return text.split(ch).length - 1;
}

export interface VerifyContext {
  raw: string;
  level: EditLevel;
  dictionary: DictionaryTerm[];
  protectedSpans: Span[];
}

/* ---------- small helpers ---------- */

/** True when position `i` falls strictly inside one word of `toks`. */
function insideWord(toks: Token[], i: number): boolean {
  return toks.some((t) => t.start < i && i < t.end);
}

/** Inside a word: letters, marks, digits, apostrophes and the zero-width joiners. */
const WORD_CHAR = new RegExp(`[${WORD_CHAR_CLASS}'’\\u200C\\u200D]`, 'u');
const LETTER_OR_DIGIT = new RegExp(`[${WORD_CHAR_CLASS}]`, 'u');

/** Would applying `e` leave two words touching ("Today you you" minus " you " -> "Todayyou")? */
function joinsWords(raw: string, e: Edit): boolean {
  const left = raw[e.start - 1] ?? '';
  const right = raw[e.end] ?? '';
  const rep = e.replacement;
  if (rep === '') return LETTER_OR_DIGIT.test(left) && LETTER_OR_DIGIT.test(right);
  return (LETTER_OR_DIGIT.test(left) && LETTER_OR_DIGIT.test(rep[0])) || (LETTER_OR_DIGIT.test(rep[rep.length - 1]) && LETTER_OR_DIGIT.test(right));
}

/** The edit's span widened to whole words, before and after the edit. */
function wordWindow(raw: string, e: Edit): { before: string; after: string } {
  let s = e.start;
  let t = e.end;
  while (s > 0 && WORD_CHAR.test(raw[s - 1])) s--;
  while (t < raw.length && WORD_CHAR.test(raw[t])) t++;
  return { before: raw.slice(s, t), after: raw.slice(s, e.start) + e.replacement + raw.slice(e.end, t) };
}

/**
 * Does a sentence start right after `prefix`? Opening quotes and brackets are
 * skipped, and at the clean level so are trailing fillers ("um So we went":
 * the filler is removed, the capital is positional).
 */
export function startsSentence(prefix: string, level: EditLevel): boolean {
  if (/\n\s*$/.test(prefix)) return true;
  let p = prefix.replace(/[\s"'“‘(\[]+$/u, '');
  if (level === 'clean') {
    for (;;) {
      const toks = tokens(p);
      const last = toks[toks.length - 1];
      if (!last || !FILLERS.has(last.word.toLowerCase()) || !/^[\s,]*$/.test(p.slice(last.end))) break;
      p = p.slice(0, last.start).replace(/[\s,"'“‘(\[]+$/u, '');
    }
  }
  return p === '' || /[.!?।॥]["'”’)\]]*$/u.test(p);
}

interface CaseChange {
  /** Offset in e.replacement of the letter whose case changed. */
  at: number;
  /** Offset of the same letter in e.original. */
  from: number;
  raised: boolean;
}

/**
 * The letters of `text` as clusters: a letter or digit plus the marks and
 * joiners that belong to it, with its offset. Compared in NFC, so "e" plus a
 * combining accent and a precomposed "é" are the same letter (CORE-01).
 */
function letterClusters(text: string): Array<{ at: number; ch: string }> {
  const out: Array<{ at: number; ch: string }> = [];
  for (const m of text.matchAll(LETTER_CLUSTER)) out.push({ at: m.index!, ch: nfc(m[0]) });
  return out;
}
const LETTER_CLUSTER = /[\p{L}\p{N}][\p{M}\u200C\u200D]*/gu;

/** Letter-by-letter case changes in a punctuation edit, or null if the letters do not line up. */
function caseChanges(e: Edit): CaseChange[] | null {
  const a = letterClusters(e.original);
  const b = letterClusters(e.replacement);
  const out: CaseChange[] = [];
  for (let k = 0; k < Math.min(a.length, b.length); k++) {
    const o = a[k].ch;
    const r = b[k].ch;
    if (o === r) continue;
    if (o.toLowerCase() !== r.toLowerCase()) return null;
    out.push({ at: b[k].at, from: a[k].at, raised: r === r.toUpperCase() && o !== o.toUpperCase() });
  }
  return out;
}

/** The whole word around offset `pos` in `text`. */
function wordAt(text: string, pos: number): { start: number; word: string } {
  let s = pos;
  let t = pos;
  while (s > 0 && WORD_CHAR.test(text[s - 1])) s--;
  while (t < text.length && WORD_CHAR.test(text[t])) t++;
  return { start: s, word: text.slice(s, t) };
}

/**
 * Case rules for punctuation edits, checkable on the edit alone: only a
 * word's first letter may change case, in a word that is otherwise lower
 * case (so "iPad" and "OK" stay as said), and a capital may only be lowered
 * where it was positional (the word started a sentence in the raw text).
 * Whether a raised capital lands on a sentence start depends on the other
 * accepted edits, so verifyEdits checks that (raisedOffSentenceStart).
 */
function checkCase(e: Edit, ctx: VerifyContext): RejectReason | null {
  const changes = caseChanges(e);
  if (changes === null) return 'case_change_not_allowed';
  const edited = ctx.raw.slice(0, e.start) + e.replacement + ctx.raw.slice(e.end);
  for (const c of changes) {
    const pos = e.start + c.at;
    const w = wordAt(edited, pos);
    if (w.start !== pos) return 'case_change_not_allowed';
    if (/\p{Lu}/u.test(w.word.slice(1))) return 'case_change_not_allowed';
    if (!c.raised) {
      if (isPronounI(w.word)) return 'case_change_not_allowed';
      const rawWord = wordAt(ctx.raw, e.start + c.from);
      if (rawWord.start !== e.start + c.from) return 'case_change_not_allowed';
      if (!startsSentence(ctx.raw.slice(0, rawWord.start), ctx.level)) return 'case_change_not_allowed';
    }
  }
  return null;
}

/** Shape rules shared by every removal: no words in, no new punctuation in. */
function checkRemovalShape(e: Edit): RejectReason | null {
  if (!/^[\s,.]*$/.test(e.replacement)) return 'removal_only';
  for (const ch of [',', '.']) if (count(e.replacement, ch) > count(e.original, ch)) return 'removal_adds_punctuation';
  return null;
}

/** After a repeated sequence ending at `copyEnd`, does the same sentence carry on? */
function continuesAfter(raw: string, copyEnd: number): boolean {
  const next = tokens(raw.slice(copyEnd))[0];
  return next !== undefined && /^[\s,]*$/.test(raw.slice(copyEnd, copyEnd + next.start));
}

/** End offset in raw of the n-th word (1-based) after `from`, skipping fillers if asked. */
function nthWordEnd(raw: string, from: number, n: number, skipFillers: boolean): { words: string[]; end: number } {
  const toks = tokens(raw.slice(from)).filter((t) => !skipFillers || !FILLERS.has(t.word.toLowerCase()));
  const taken = toks.slice(0, n);
  return { words: taken.map((t) => norm(t.word)), end: from + (taken.length ? taken[taken.length - 1].end : 0) };
}

/* ---------- per-type rules ---------- */

function checkRepeat(e: Edit, raw: string): RejectReason | null {
  // The removed words must duplicate the words immediately before or after.
  const removed = words(e.original).map(norm);
  const before = words(raw.slice(0, e.start)).map(norm).slice(-removed.length);
  const after = nthWordEnd(raw, e.end, removed.length, false);
  const same = (a: string[]) => a.length === removed.length && a.every((w, i) => w === removed[i]);
  const dupBefore = same(before);
  if (removed.length === 0 || !(dupBefore || same(after.words))) return 'not_a_repeat';

  if (removed.every((w) => isNegation(w))) return 'removes_negation';
  if (moodMarks(e.original)) return 'changes_sentence_type';
  if (removed.length === 1) return REPEATABLE_WORDS.has(removed[0]) ? null : 'repeat_is_emphasis';

  // A phrase said twice: a restart ("like a like a little") or function-word
  // stumble ("she is she is"), never a complete phrase said twice on purpose
  // ("come on, come on", "I love you, I love you").
  if (new Set(removed).size < 2) return 'repeat_is_emphasis';
  if (removed.every((w) => FUNCTION_WORDS.has(w))) return null;
  const copyEnd = dupBefore ? e.end : after.end;
  return DANGLING.has(removed[removed.length - 1]) && continuesAfter(raw, copyEnd) ? null : 'repeat_is_emphasis';
}

function checkFalseStart(e: Edit, raw: string): RejectReason | null {
  // The removed words must be said again, in order, immediately after
  // (fillers and punctuation in between are fine): "she was, um, she was so".
  const removed = words(e.original).map(norm).filter((w) => !FILLERS.has(w));
  if (removed.length === 0) return 'false_start_not_repeated';
  const again = nthWordEnd(raw, e.end, removed.length, true);
  if (again.words.length !== removed.length || !again.words.every((w, i) => w === removed[i])) {
    return 'false_start_not_repeated';
  }
  if (removed.every((w) => isNegation(w))) return 'removes_negation';
  if (moodMarks(e.original)) return 'changes_sentence_type';
  // A restart leads somewhere: "she was, she was so happy". A complete phrase
  // said twice and then ended is meant: "I love you, I love you."
  return continuesAfter(raw, again.end) ? null : 'false_start_complete_phrase';
}

function checkSttFix(e: Edit, ctx: VerifyContext): RejectReason | null {
  const rep = e.replacement.trim();
  const entry = ctx.dictionary.find((d) => d.term === rep);
  if (!entry) return 'stt_fix_not_dictionary';
  const original = e.original.trim();
  const o = norm(original);
  // Dictionary-backed: a learned mishearing the parent taught, or the term in another case.
  if (o === norm(entry.term) || entry.heardAs.some((h) => norm(h) === o)) return null;
  // Otherwise only a near-sounding word that is not itself meaningful on its
  // own, and only one the recogniser took for a name: capitalised, and not
  // merely because it starts a sentence. A lowercase word ("moon", "mirror")
  // was probably said as heard; the parent can teach it through heardAs.
  const ws = tokens(original);
  if (ws.length === 0 || ws.length > 3) return 'stt_fix_not_heard_as';
  for (const t of ws) {
    if (isProtectedWord(t.word)) return 'stt_fix_protected_word';
    if (ctx.dictionary.some((d) => d !== entry && (norm(d.term) === norm(t.word) || d.heardAs.some((h) => norm(h) === norm(t.word))))) {
      return 'stt_fix_protected_word';
    }
  }
  if (isDictionaryTerm(original, ctx.dictionary)) return 'stt_fix_protected_word';
  if (/[?!"“”]/.test(e.original)) return 'changes_sentence_type';
  const lead = e.original.length - e.original.trimStart().length;
  if (!ws.every((t) => /^\p{Lu}/u.test(t.word))) return 'stt_fix_not_heard_as';
  if (startsSentence(ctx.raw.slice(0, e.start + lead), ctx.level)) return 'stt_fix_not_heard_as';
  return soundsLike(original, entry.term) ? null : 'stt_fix_not_heard_as';
}

function checkAgreement(e: Edit): RejectReason | null {
  const o = tokens(e.original);
  const r = tokens(e.replacement);
  if (o.length !== 1 || r.length !== 1) return 'agreement_not_single_word';
  // Nothing but the word itself may change: no punctuation rides along.
  if (e.original.slice(0, o[0].start) + e.original.slice(o[0].end) !== e.replacement.slice(0, r[0].start) + e.replacement.slice(r[0].end)) {
    return 'agreement_not_single_word';
  }
  const a = o[0].word;
  const b = r[0].word;
  if (!isAgreementPair(a, b)) return classifyWordSwap(a, b);
  if ((a[0] === a[0].toUpperCase()) !== (b[0] === b[0].toUpperCase())) return 'agreement_stem_mismatch';
  return null;
}

function checkPunctuation(e: Edit, ctx: VerifyContext): RejectReason | null {
  if (lettersOnly(e.original) !== lettersOnly(e.replacement)) return 'punctuation_changed_letters';
  // Same letters is not enough: "were" -> "we're" and "some one" -> "someone"
  // keep the letters and change the words. Compare whole words around the edit.
  const { before, after } = wordWindow(ctx.raw, e);
  const tb = tokens(before).map((t) => norm(t.word));
  const ta = tokens(after).map((t) => norm(t.word));
  if (tb.length !== ta.length || tb.some((w, i) => w !== ta[i])) return 'changes_word';
  // Sentence type is the speaker's: a period may be added where there was no
  // end mark, but ? and ! are never added, removed or swapped.
  if (moodMarks(e.original) !== moodMarks(e.replacement)) return 'changes_sentence_type';
  if (quoteMarkCount(e.original) !== quoteMarkCount(e.replacement)) return 'changes_quotes';
  return checkCase(e, ctx);
}

/* ---------- the gate ---------- */

/**
 * Check one edit in isolation. Returns null if it is acceptable on its own.
 * verifyEdits adds the checks that need the other edits (overlap, one
 * agreement per sentence, the change ceiling, capitals on sentence starts).
 */
export function checkEdit(e: Edit, ctx: VerifyContext): RejectReason | null {
  const { raw } = ctx;
  if (e.start < 0 || e.end > raw.length || e.start > e.end) return 'out_of_bounds';
  if (raw.slice(e.start, e.end) !== e.original) return 'original_mismatch';
  if (!LEVEL_TYPES[ctx.level].has(e.type)) return 'type_not_allowed_at_level';

  // No edit may start or end inside one written character: between a letter
  // and its vowel sign, after a virama, or inside a surrogate pair (CORE-01).
  if (splitsCluster(raw, e.start) || splitsCluster(raw, e.end)) return 'splits_word';

  // Dictionary corrections from our own rules are allowed to land on a
  // mis-cased name; everything else must stay clear of protected spans.
  if (ctx.protectedSpans.some((p) => overlaps(p, e))) return 'overlaps_protected';

  // Only punctuation may work inside a word (sentence case is one letter);
  // its own check compares whole words. Nothing may glue two words together.
  if (e.type !== 'punctuation') {
    const toks = tokens(raw);
    if (insideWord(toks, e.start) || insideWord(toks, e.end)) return 'splits_word';
    if (joinsWords(raw, e)) return 'changes_word';
  }

  let reason: RejectReason | null = null;
  switch (e.type) {
    case 'filler': {
      reason = checkRemovalShape(e);
      // Only words on the filler list may be removed under this label.
      // A filler said as its own sentence ("Hmm.") goes with its end mark.
      const removed = words(e.original);
      if (!reason && (removed.length === 0 || !removed.every((w) => FILLERS.has(w)))) reason = 'not_a_filler';
      break;
    }
    case 'repeat':
      reason = checkRemovalShape(e) ?? checkRepeat(e, raw);
      break;
    case 'false_start':
      reason = checkRemovalShape(e) ?? checkFalseStart(e, raw);
      break;
    case 'stt_fix':
      reason = checkSttFix(e, ctx);
      break;
    case 'punctuation':
      reason = checkPunctuation(e, ctx);
      break;
    case 'agreement':
      reason = checkAgreement(e);
      break;
    case 'paragraph':
      if (e.original.trim() !== '' || e.replacement.trim() !== '') reason = 'paragraph_not_whitespace';
      break;
  }
  if (reason) return reason;

  // Belt and braces for every substitution, whatever its label: the words
  // around the edit keep their negations, numbers, end marks and quotes.
  if (!REMOVAL_TYPES.has(e.type) && e.type !== 'stt_fix') {
    // Whole-text comparison: a mark next to a number ("3:30" -> "3':30") changes it
    // without touching a word, so a word-sized window is not enough here.
    const edited = raw.slice(0, e.start) + e.replacement + raw.slice(e.end);
    if (negationCount(raw) !== negationCount(edited)) return 'changes_negation';
    const nb = numbersOf(raw);
    const na = numbersOf(edited);
    if (nb.length !== na.length || nb.some((n, i) => n !== na[i])) return 'changes_number';
    if (moodMarks(e.original) !== moodMarks(e.replacement)) return 'changes_sentence_type';
    if (quoteMarkCount(e.original) !== quoteMarkCount(e.replacement)) return 'changes_quotes';
  }

  // No edit may introduce a word that was not already in the span it
  // replaces (agreement and stt_fix are governed by their own rules above).
  if (e.type !== 'agreement' && e.type !== 'stt_fix') {
    const pool = words(e.original).map(norm);
    for (const w of words(e.replacement).map(norm)) {
      const i = pool.indexOf(w);
      if (i < 0) return 'inserted_content_word';
      pool.splice(i, 1);
    }
  }
  return null;
}

export interface VerifyResult {
  accepted: Edit[];
  rejected: RejectedEdit[];
  modelChangeRatio: number;
}

/** Final text before offset `at` of edit `e`'s replacement, given the other accepted edits. */
function finalPrefix(raw: string, accepted: Edit[], e: Edit, at: number): string {
  const earlier = accepted.filter((a) => a !== e && a.end <= e.start);
  return applyEdits(raw.slice(0, e.start), earlier) + e.replacement.slice(0, at);
}

/**
 * A raised capital must start a sentence in the text the parent will see
 * (or be the pronoun I). Checked against the accepted set, so "um so" and a
 * removed false start still count as sentence starts, and "will" -> "Will"
 * mid-sentence does not.
 */
function raisedOffSentenceStart(raw: string, accepted: Edit[], e: Edit, level: EditLevel): boolean {
  if (e.type !== 'punctuation') return false;
  const changes = caseChanges(e) ?? [];
  const edited = raw.slice(0, e.start) + e.replacement + raw.slice(e.end);
  return changes.some((c) => {
    if (!c.raised) return false;
    if (isPronounI(wordAt(edited, e.start + c.at).word)) return false;
    return !startsSentence(finalPrefix(raw, accepted, e, c.at), level);
  });
}

/**
 * Verify a list of edits. Rule edits should be passed first: on overlap,
 * the earlier accepted edit wins.
 */
export function verifyEdits(edits: Edit[], ctx: VerifyContext): VerifyResult {
  let accepted: Edit[] = [];
  const rejected: RejectedEdit[] = [];
  const agreementPerSentence = new Map<number, number>();

  for (const e of edits) {
    const reason = checkEdit(e, ctx);
    if (reason) {
      rejected.push({ edit: e, reason });
      continue;
    }
    // Two edits at the same start have no defined order (an insertion before
    // a replacement would shift it), so the later one is refused as overlapping.
    if (accepted.some((a) => overlaps(a, e) || a.start === e.start)) {
      rejected.push({ edit: e, reason: 'overlaps_other_edit' });
      continue;
    }
    if (e.type === 'agreement') {
      const s = sentenceIndex(ctx.raw, e.start);
      const n = agreementPerSentence.get(s) ?? 0;
      if (n >= 1) {
        rejected.push({ edit: e, reason: 'agreement_limit_per_sentence' });
        continue;
      }
      agreementPerSentence.set(s, n + 1);
    }
    accepted.push(e);
  }

  // Change ceiling, applied to model edits as a whole: if the model touched
  // too much, discard all of its edits and keep only the deterministic ones.
  const totalWords = Math.max(1, words(ctx.raw).length);
  const modelWords = accepted
    .filter((e) => e.source === 'model')
    .reduce((n, e) => n + Math.max(words(e.original).length, words(e.replacement).length, 1), 0);
  const allowed = Math.max(Math.ceil(CEILING_RATIO * totalWords), CEILING_MIN_WORDS);
  let ratio = modelWords / totalWords;
  if (modelWords > allowed) {
    for (const e of accepted) if (e.source === 'model') rejected.push({ edit: e, reason: 'change_ceiling_exceeded' });
    accepted = accepted.filter((e) => e.source !== 'model');
    ratio = 0;
  }

  // Capitals must sit on sentence starts of the final text. Dropping one
  // edit can move a sentence start, so repeat until nothing changes.
  for (let changed = true; changed; ) {
    changed = false;
    for (const e of accepted) {
      if (raisedOffSentenceStart(ctx.raw, accepted, e, ctx.level)) {
        rejected.push({ edit: e, reason: 'case_change_not_sentence_start' });
        accepted = accepted.filter((a) => a !== e);
        changed = true;
        break;
      }
    }
  }
  if (ratio > 0) {
    const kept = accepted.filter((e) => e.source === 'model');
    ratio = kept.reduce((n, e) => n + Math.max(words(e.original).length, words(e.replacement).length, 1), 0) / totalWords;
  }

  return { accepted: accepted.sort(byStart), rejected, modelChangeRatio: ratio };
}

function byStart(a: Edit, b: Edit): number {
  return a.start - b.start;
}

/** Apply already-verified, non-overlapping edits to the raw text. */
export function applyEdits(raw: string, edits: Edit[]): string {
  let out = raw;
  for (const e of [...edits].sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
  }
  return out;
}
