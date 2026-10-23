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
 *  - how a sentence ends, by putting an end mark next to one already said,
 *    alone or together with the other accepted edits ("more?.", "no..",
 *    in any script; engine 7),
 *  - or when a removal labelled filler, repeat or false start deletes
 *    anything that is not a filler, an accidental repeat or a real restart,
 *  - or any letter, combining mark (vowel sign, virama, nukta, accent) or
 *    digit, or a boundary that cuts a letter from its marks (CORE-01).
 * Fillers, accidental repeats, dictionary name fixes, sentence case and a
 * final period where none was are still accepted.
 *
 * Language (ADR 0014): every word table, sentence mark and tokenizer comes
 * from `ctx.rules` (default: the bundled English rules, so English is
 * unchanged). A language whose pack has not had a table signed off runs in
 * punctuation-safe mode: punctuation, paragraph and dictionary fixes only,
 * plus filler removal once the filler list is vetted. Every other kind of
 * edit is refused as `not_vetted_for_language`.
 */
import type { DictionaryTerm, Edit, EditLevel, EditType, RejectReason, RejectedEdit, Span } from './types';
import { frozenSet, hyphenCompounds, hyphenJoined, lettersOnly, nfc, splitsCluster, WORD_CHAR_CLASS, type Token } from './text';
import { overlaps, quotedSpans } from './protect';
import { invisibleSignature, invisiblesOf, isClosedAgreementPair, isInvisible, MOOD_CANON, quotationMarks } from './meaning';
import { ENGLISH_RULES, type LanguageRules } from './lang/engine';
import { heardAsCarriesMeaning, isEverydayTerm, targetsOtherTerm } from './lang/dictionary';

/** Starting values. Tune on real recordings (PRD v2 section 24, experiment 2). */
export const CEILING_RATIO = 0.15;
export const CEILING_MIN_WORDS = 3;
/**
 * End marks in every script the engine knows: ASCII, full-width, the Arabic
 * question mark, the Devanagari danda, the combined marks ("‽", "‼") and the
 * ellipsis character. With the language's own sentence ends (R.isSentenceEnd),
 * two of them touching are a doubled end mark, whichever marks they are:
 * "?.", "!.", "।.", "？." as much as ".." (#179 re-check Note E, 23 Oct 2026).
 */
const END_MARK = /^[.!?。！？؟।॥‽⁇⁈⁉‼⸮\u2026]$/u;
/**
 * What may sit between two end marks that still touch: spaces, closing quotes
 * and invisible characters. Not a closing bracket: a mark inside brackets ends
 * the bracketed words only, and the sentence around them still takes its own
 * ("We went home (it rained!)."; #249 review F1 and N1).
 */
const BETWEEN_MARKS = /^[\s"'\u201D\u2019»›」』]$/u;

const LEVEL_TYPES: Readonly<Record<EditLevel, ReadonlySet<EditType>>> = Object.freeze({
  clean: frozenSet<EditType>(['filler', 'false_start', 'repeat', 'stt_fix', 'punctuation', 'agreement', 'paragraph']),
  verbatim: frozenSet<EditType>(['stt_fix', 'punctuation']),
});

const REMOVAL_TYPES: ReadonlySet<EditType> = frozenSet<EditType>(['filler', 'repeat', 'false_start']);

/**
 * Edit types that may add, remove or move an invisible character (direction
 * mark, joiner, zero-width space). None at v1.0 (F06-REQ-003): a type that
 * needs to (a future script conversion, say) must be listed here on purpose,
 * with its own test.
 */
const INVISIBLE_EDIT_TYPES: ReadonlySet<EditType> = frozenSet<EditType>([]);

/**
 * Edit types that may never land inside quoted speech in any quotation style
 * (F06-REQ-006). Checked against the raw text itself, so it holds whatever
 * spans the caller passed. Punctuation and paragraph edits are held by the
 * letter, word and quotation-mark guards instead (French spacing inside « »).
 */
const QUOTE_GUARDED_TYPES: ReadonlySet<EditType> = frozenSet<EditType>(['filler', 'repeat', 'false_start', 'stt_fix', 'agreement']);

/** quotedSpans and the quotation-mark count of the last raw text seen; verifyEdits checks many edits against one raw. */
// quoteMarks is the sequence of marks, not the count: a swap of one mark for another is a change too (tests-lens review Note A, 23 Oct 2026).
let rawMemo: { raw: string; quotes: Span[]; quoteMarks: string } | null = null;
function rawFacts(raw: string): { quotes: Span[]; quoteMarks: string } {
  if (rawMemo?.raw !== raw) rawMemo = { raw, quotes: quotedSpans(raw), quoteMarks: quotationMarks(raw) };
  return rawMemo;
}

/**
 * No invisible character added, removed or swapped; and in a punctuation or
 * paragraph edit, none moved relative to the visible characters around it.
 */
function changesInvisible(e: Edit): boolean {
  if (INVISIBLE_EDIT_TYPES.has(e.type)) return false;
  if (invisiblesOf(e.original) !== invisiblesOf(e.replacement)) return true;
  if (e.type !== 'punctuation' && e.type !== 'paragraph') return false;
  return invisibleSignature(e.original) !== invisibleSignature(e.replacement);
}

/*
 * Single words whose immediate double is an accidental repeat (not emphasis)
 * are rules.repeat.verifierRepeatable: the repeat rules' lists plus English
 * "was" ("she was was"). "very very", "bye bye", "no no" are how people talk
 * and are kept. A phrase ending in rules.repeat.dangling is unfinished, so
 * saying it again is a restart.
 */

/** Is this edit type allowed for this language's vetted tables? */
function enabledForLanguage(type: EditType, R: LanguageRules): boolean {
  switch (type) {
    case 'filler':
      return R.can.fillers;
    case 'repeat':
    case 'false_start':
      return R.can.removals;
    case 'agreement':
      return R.can.agreement;
    default:
      return true; // stt_fix (dictionary-backed), punctuation, paragraph
  }
}

function count(text: string, ch: string): number {
  return text.split(ch).length - 1;
}

export interface VerifyContext {
  raw: string;
  level: EditLevel;
  dictionary: DictionaryTerm[];
  protectedSpans: Span[];
  /** The language's compiled rules (lang/engine.ts). Default: bundled English. */
  rules?: LanguageRules;
}

const rulesOf = (ctx: VerifyContext): LanguageRules => ctx.rules ?? ENGLISH_RULES;

/* ---------- small helpers ---------- */

/** True when position `i` falls strictly inside one word of `toks`. */
function insideWord(toks: Token[], i: number): boolean {
  return toks.some((t) => t.start < i && i < t.end);
}

/** Inside a word: letters, marks, digits, apostrophes and the zero-width joiners. */
const WORD_CHAR = new RegExp(`[${WORD_CHAR_CLASS}'’\\u200C\\u200D]`, 'u');

/**
 * Would applying `e` leave two words touching ("Today you you" minus " you "
 * -> "Todayyou")? Between Chinese characters nothing glues: each is a word.
 */
function joinsWords(raw: string, e: Edit, R: LanguageRules): boolean {
  const left = raw[e.start - 1] ?? '';
  const right = raw[e.end] ?? '';
  const rep = e.replacement;
  if (rep === '') return R.joins(left, right);
  return R.joins(left, rep[0]) || R.joins(rep[rep.length - 1], right);
}

/**
 * Does `e` change the hyphenated words around it? Compared in a window of 64
 * characters either side, so the check stays cheap on a long letter; the
 * window edges cut both texts the same way.
 */
function splitsHyphenated(raw: string, e: Edit): boolean {
  const a = Math.max(0, e.start - 64);
  const b = Math.min(raw.length, e.end + 64);
  const before = raw.slice(a, b);
  if (!/[-\u2010\u2011]/.test(before) && !/[-\u2010\u2011]/.test(e.replacement)) return false;
  const after = raw.slice(a, e.start) + e.replacement + raw.slice(e.end, b);
  return hyphenCompounds(before).join('|') !== hyphenCompounds(after).join('|');
}

/** The code point that ends just before index `i`, or ''. */
function codePointBefore(text: string, i: number): string {
  if (i <= 0) return '';
  const lo = text.charCodeAt(i - 1);
  const hi = i >= 2 ? text.charCodeAt(i - 2) : 0;
  return lo >= 0xdc00 && lo <= 0xdfff && hi >= 0xd800 && hi <= 0xdbff ? text.slice(i - 2, i) : text[i - 1];
}

/** The code point that starts at index `i`, or ''. */
function codePointAt(text: string, i: number): string {
  return i < text.length ? String.fromCodePoint(text.codePointAt(i)!) : '';
}

/**
 * [start, end) of `text` widened to whole words. It steps a code point at a
 * time, so a letter outside the Basic Multilingual Plane (Adlam, a Han
 * extension) is one character, not two halves that stop the window inside
 * the word (#179 follow-up: "wordWindow grows over word characters only").
 * At the start or end of the text it stops at the edge.
 */
function wordBounds(text: string, start: number, end: number): { s: number; t: number } {
  let s = start;
  let t = end;
  for (let ch = codePointBefore(text, s); ch && WORD_CHAR.test(ch); ch = codePointBefore(text, s)) s -= ch.length;
  for (let ch = codePointAt(text, t); ch && WORD_CHAR.test(ch); ch = codePointAt(text, t)) t += ch.length;
  return { s, t };
}

/** The edit's span widened to whole words, before and after the edit. */
function wordWindow(raw: string, e: Edit): { before: string; after: string } {
  const { s, t } = wordBounds(raw, e.start, e.end);
  return { before: raw.slice(s, t), after: raw.slice(s, e.start) + e.replacement + raw.slice(e.end, t) };
}

/**
 * Does a sentence start right after `prefix`? Opening quotes and brackets are
 * skipped, and at the clean level so are trailing fillers ("um So we went":
 * the filler is removed, the capital is positional). Sentence marks come
 * from the language rules (danda, full-width, Arabic marks).
 */
export function startsSentence(prefix: string, level: EditLevel, rules: LanguageRules = ENGLISH_RULES): boolean {
  return rules.startsSentence(prefix, level);
}

/**
 * The name-signal test of checkSttFix: a capital counts as a name signal only
 * when it is not positional. Engine 5 skipped every trailing filler here. Engine
 * 6 keeps "uh uh" as a word (R-01 D6), which on its own would make a capital
 * after it read as a signal and accept a fix engine 5 refused ("uh uh Asho came"
 * to Asha; found by the #179 review's differential, 23 Oct 2026). The recogniser
 * capitalises after a kept pair just as after a removed filler, so this test
 * keeps skipping: engine 6 accepts no edit that engine 5 refused.
 */
function startsSentenceSkippingFillers(prefix: string, level: EditLevel, R: LanguageRules): boolean {
  let p = prefix;
  for (;;) {
    if (R.startsSentence(p, level)) return true;
    if (level !== 'clean') return false;
    const toks = R.tokens(p);
    const last = toks[toks.length - 1];
    // Offered fillers too ("mm", D-112): the recogniser's capital after one is as positional as after "um" (#179 re-check N5).
    if (!last || !R.isFiller(last.word, true) || !/^[\s,]*$/.test(p.slice(last.end))) return false;
    p = p.slice(0, last.start);
  }
}

/* ---------- end marks next to each other (#179 follow-up, 23 Oct 2026) ---------- */

function isEndMark(ch: string, R: LanguageRules): boolean {
  return ch !== '' && (END_MARK.test(ch) || R.isSentenceEnd(ch));
}

/** An end mark, or a character that may sit between two end marks that touch. */
function nearMark(ch: string, R: LanguageRules): boolean {
  return ch !== '' && (isEndMark(ch, R) || BETWEEN_MARKS.test(ch) || isInvisible(ch) || R.quoteMarkCount(ch) > 0);
}

/**
 * How many end marks in `text` touch the end mark before them: "?." and ".."
 * are 1, "..." is 2, "no. Yes." is 0. Counted twice: `loose` lets spaces sit
 * between ("no. ." is 1), `tight` does not ("no. ." is 0, "no.." is 1), so an
 * edit that only deletes the space between two marks still makes a new pair
 * (#249 review N3).
 */
interface MarkPairs {
  loose: number;
  tight: number;
}
function endMarkPairs(text: string, R: LanguageRules): MarkPairs {
  const pairs: MarkPairs = { loose: 0, tight: 0 };
  let loose = false;
  let tight = false;
  for (const ch of text) {
    if (isEndMark(ch, R)) {
      if (loose) pairs.loose++;
      if (tight) pairs.tight++;
      loose = true;
      tight = true;
    } else if (!nearMark(ch, R)) {
      loose = false;
      tight = false;
    } else if (/\s/u.test(ch)) {
      tight = false;
    }
  }
  return pairs;
}

/** Does `a` have a pair of touching end marks that `b` lacks, counted either way? */
function morePairs(a: MarkPairs, b: MarkPairs): boolean {
  return a.loose > b.loose || a.tight > b.tight;
}

function endMarkCount(text: string, R: LanguageRules): number {
  let n = 0;
  for (const ch of text) if (isEndMark(ch, R)) n++;
  return n;
}

/**
 * End mark pairs around [start, end) of `text`, as it stands and with `other`
 * in place of that span. The window is the run of end marks, spaces, closers
 * and invisible characters on each side of the span, so every mark the span
 * could touch is in it and nothing beyond the first letter is: a run said
 * elsewhere in the sentence ("Yes..no.") never excuses a new one, and at the
 * start or end of the text the window stops at the edge. This replaces the
 * fixed two-character mark window of #179, which missed a mark behind two
 * closers ("no.")" plus ".") and saw an unrelated run (engine-lens re-check).
 */
function markRunPairs(text: string, start: number, end: number, other: string, R: LanguageRules): { asIs: MarkPairs; swapped: MarkPairs } {
  let s = start;
  let t = end;
  while (s > 0 && nearMark(text[s - 1], R)) s--;
  while (t < text.length && nearMark(text[t], R)) t++;
  return { asIs: endMarkPairs(text.slice(s, t), R), swapped: endMarkPairs(text.slice(s, start) + other + text.slice(end, t), R) };
}

/**
 * A removal labelled filler, repeat or false start never changes how a
 * sentence ends (#249 review F1). It takes no "?" or "!", in any script. It
 * takes an end mark only with a sentence of its own that follows a finished
 * one or opens the letter: "door. Hmm." loses " Hmm." (F06 section 4.1), but
 * 'Did she say "no." um?' keeps its "?" and "We went home (it rained!) um."
 * keeps the "." that ends the sentence around the bracket.
 */
function removalChangesSentenceEnd(raw: string, e: Edit, R: LanguageRules): boolean {
  if (R.moodMarks(e.original) !== R.moodMarks(e.replacement)) return true;
  if (endMarkCount(e.replacement, R) >= endMarkCount(e.original, R)) return false;
  let i = e.start;
  while (i > 0 && (/\s/u.test(raw[i - 1]) || isInvisible(raw[i - 1]))) i--;
  return i > 0 && !isEndMark(raw[i - 1], R);
}

/**
 * In a run of touching end marks the mark said first stands (#249 review N2):
 * an edit may remove or change only the later marks of the run. "हँसी।." may
 * lose its ".", never its danda; U+3002 and the ellipsis character the same.
 * The first mark stands when the replacement keeps the original as it was up
 * to and including it (letters compared without case, so "more?." to "More?"
 * keeps it; a "?" or "!" in its author's script, "？" for "?", counts as kept).
 */
function movesFirstMark(raw: string, e: Edit, R: LanguageRules): boolean {
  const o = e.original;
  const r = e.replacement;
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase() || (MOOD_CANON[a] !== undefined && MOOD_CANON[a] === MOOD_CANON[b]);
  let kept = 0;
  while (kept < o.length && kept < r.length && same(o[kept], r[kept])) kept++;
  let s = e.start;
  let t = e.end;
  while (s > 0 && nearMark(raw[s - 1], R)) s--;
  while (t < raw.length && nearMark(raw[t], R)) t++;
  let first = -1;
  let marks = 0;
  const moved = () => marks >= 2 && first >= e.start && first < e.end && first - e.start >= kept;
  for (let i = s; i < t; i++) {
    if (isEndMark(raw[i], R)) {
      if (first < 0) first = i;
      marks++;
    } else if (!nearMark(raw[i], R)) {
      if (moved()) return true;
      first = -1;
      marks = 0;
    }
  }
  return moved();
}

/** Would `e`, alone on the raw text, put an end mark next to another (a new pair of touching marks)? */
function addsEndMarkPair(raw: string, e: Edit, R: LanguageRules): boolean {
  const p = markRunPairs(raw, e.start, e.end, e.replacement, R);
  return morePairs(p.swapped, p.asIs);
}

/**
 * Two fair edits can double an end mark together: a trailing filler removed
 * and a final "." put after the word before it ("She said no. um" became
 * "She said no.." through the rules-only clean, #179 follow-up). Each accepted
 * edit is checked in the text all accepted edits make, against the same text
 * without it. Returns the edit to refuse: one that adds an end mark before
 * one that only removes, so the removal stands and the speaker's mark is the
 * one left. Null when no accepted edit makes a new pair.
 */
function doublesEndMarkInContext(raw: string, accepted: Edit[], R: LanguageRules): Edit | null {
  const sorted = [...accepted].sort(byStart);
  const at = new Map<Edit, number>();
  let text = '';
  let pos = 0;
  for (const e of sorted) {
    text += raw.slice(pos, e.start);
    at.set(e, text.length);
    text += e.replacement;
    pos = e.end;
  }
  text += raw.slice(pos);
  let blamed: Edit | null = null;
  for (const e of sorted) {
    const f = at.get(e)!;
    const p = markRunPairs(text, f, f + e.replacement.length, e.original, R);
    if (!morePairs(p.asIs, p.swapped)) continue;
    if (endMarkCount(e.replacement, R) > endMarkCount(e.original, R)) return e;
    blamed ??= e;
  }
  return blamed;
}

interface CaseChange {
  /** Offset in e.replacement of the letter whose case changed. */
  at: number;
  /** Offset of the same letter in e.original. */
  from: number;
  raised: boolean;
}

/**
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

/**
 * Letter-by-letter case changes in a punctuation edit, or null if the
 * letters do not line up. A character converted to the author's script
 * (發 -> 发) is not a case change.
 */
function caseChanges(e: Edit, R: LanguageRules): CaseChange[] | null {
  const a = letterClusters(e.original);
  const b = letterClusters(e.replacement);
  const out: CaseChange[] = [];
  for (let k = 0; k < Math.min(a.length, b.length); k++) {
    const o = a[k].ch;
    const r = b[k].ch;
    if (o === r || R.variantOf(o) === r) continue;
    if (o.toLowerCase() !== r.toLowerCase()) return null;
    out.push({ at: b[k].at, from: a[k].at, raised: r === r.toUpperCase() && o !== o.toUpperCase() });
  }
  return out;
}

/** The whole word around offset `pos` in `text`. */
function wordAt(text: string, pos: number): { start: number; word: string } {
  const { s, t } = wordBounds(text, pos, pos);
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
  const R = rulesOf(ctx);
  const changes = caseChanges(e, R);
  if (changes === null) return 'case_change_not_allowed';
  const edited = ctx.raw.slice(0, e.start) + e.replacement + ctx.raw.slice(e.end);
  for (const c of changes) {
    const pos = e.start + c.at;
    const w = wordAt(edited, pos);
    if (w.start !== pos) return 'case_change_not_allowed';
    if (/\p{Lu}/u.test(w.word.slice(1))) return 'case_change_not_allowed';
    if (!c.raised) {
      if (R.isPronounI(w.word)) return 'case_change_not_allowed';
      const rawWord = wordAt(ctx.raw, e.start + c.from);
      if (rawWord.start !== e.start + c.from) return 'case_change_not_allowed';
      if (!R.startsSentence(ctx.raw.slice(0, rawWord.start), ctx.level)) return 'case_change_not_allowed';
    }
  }
  return null;
}

/** Shape rules shared by every removal: no words in, no new punctuation in, no quotation mark out. */
function checkRemovalShape(e: Edit, R: LanguageRules): RejectReason | null {
  if (!/^[\s,.]*$/.test(e.replacement)) return 'removal_only';
  if (R.quoteMarkCount(e.original) > 0) return 'changes_quotes';
  for (const ch of [',', '.']) if (count(e.replacement, ch) > count(e.original, ch)) return 'removal_adds_punctuation';
  return null;
}

/** After a repeated sequence ending at `copyEnd`, does the same sentence carry on? */
function continuesAfter(raw: string, copyEnd: number, R: LanguageRules): boolean {
  const next = R.tokens(raw.slice(copyEnd))[0];
  return next !== undefined && R.softGap.test(raw.slice(copyEnd, copyEnd + next.start));
}

/** End offset in raw of the n-th word (1-based) after `from`, skipping fillers if asked. */
function nthWordEnd(raw: string, from: number, n: number, skipFillers: boolean, R: LanguageRules): { words: string[]; end: number } {
  const toks = R.tokens(raw.slice(from)).filter((t) => !skipFillers || !R.isFiller(t.word));
  const taken = toks.slice(0, n);
  return { words: taken.map((t) => R.norm(t.word)), end: from + (taken.length ? taken[taken.length - 1].end : 0) };
}

/* ---------- per-type rules ---------- */

function checkRepeat(e: Edit, raw: string, R: LanguageRules): RejectReason | null {
  // The removed words must duplicate the words immediately before or after.
  const removed = R.words(e.original).map((w) => R.norm(w));
  const before = R.words(raw.slice(0, e.start)).map((w) => R.norm(w)).slice(-removed.length);
  const after = nthWordEnd(raw, e.end, removed.length, false, R);
  const same = (a: string[]) => a.length === removed.length && a.every((w, i) => w === removed[i]);
  const dupBefore = same(before);
  if (removed.length === 0 || !(dupBefore || same(after.words))) return 'not_a_repeat';

  if (removed.every((w) => R.isNegation(w))) return 'removes_negation';
  if (R.moodMarks(e.original) || /[¿¡]/.test(e.original)) return 'changes_sentence_type';
  if (removed.length === 1) return R.repeat.verifierRepeatable.has(removed[0]) ? null : 'repeat_is_emphasis';

  // A phrase said twice: a restart ("like a like a little") or function-word
  // stumble ("she is she is"), never a complete phrase said twice on purpose
  // ("come on, come on", "I love you, I love you").
  if (new Set(removed).size < 2) return 'repeat_is_emphasis';
  if (removed.every((w) => R.isFunctionWord(w))) return null;
  const copyEnd = dupBefore ? e.end : after.end;
  return R.repeat.dangling.has(removed[removed.length - 1]) && continuesAfter(raw, copyEnd, R) ? null : 'repeat_is_emphasis';
}

function checkFalseStart(e: Edit, raw: string, R: LanguageRules): RejectReason | null {
  // The removed words must be said again, in order, immediately after
  // (fillers and punctuation in between are fine): "she was, um, she was so".
  const removed = R.words(e.original).map((w) => R.norm(w)).filter((w) => !R.isFiller(w));
  if (removed.length === 0) return 'false_start_not_repeated';
  const again = nthWordEnd(raw, e.end, removed.length, true, R);
  if (again.words.length !== removed.length || !again.words.every((w, i) => w === removed[i])) {
    return 'false_start_not_repeated';
  }
  if (removed.every((w) => R.isNegation(w))) return 'removes_negation';
  if (R.moodMarks(e.original) || /[¿¡]/.test(e.original)) return 'changes_sentence_type';
  // A restart leads somewhere: "she was, she was so happy". A complete phrase
  // said twice and then ended is meant: "I love you, I love you."
  return continuesAfter(raw, again.end, R) ? null : 'false_start_complete_phrase';
}

/** True if `word` is (part of) a dictionary term, compared the language's strict way. */
function isTermWord(word: string, dictionary: DictionaryTerm[], R: LanguageRules): boolean {
  const w = R.norm(word);
  return dictionary.some((d) => R.norm(d.term) === w || R.norm(d.term).split(/\s+/).includes(w));
}

function checkSttFix(e: Edit, ctx: VerifyContext): RejectReason | null {
  const R = rulesOf(ctx);
  const rep = e.replacement.trim();
  const entry = ctx.dictionary.find((d) => d.term === rep || d.term.normalize('NFC') === rep.normalize('NFC'));
  if (!entry) return 'stt_fix_not_dictionary';
  const original = e.original.trim();
  const o = R.norm(original);
  // A name fix never changes a sentence's type, whatever its path (quotation marks are counted for every edit in checkEdit).
  if (R.moodMarks(e.original) !== R.moodMarks(e.replacement)) return 'changes_sentence_type';
  // One family name never becomes another (F06-REQ-014, R-01 D13), whatever the
  // source, and before any dictionary-backed shortcut (F07 7.2 rule 2).
  if (targetsOtherTerm(e.original, rep, ctx.dictionary, R)) return 'stt_fix_protected_word';
  // The term in another case. Not for a term spelled like an everyday word:
  // "I hope" stays as said for a child named Hope, "we will" for Will (F06-REQ-008, R-01 D10).
  if (o === R.norm(entry.term)) return isEverydayTerm(entry.term, R) ? 'stt_fix_protected_word' : null;
  // A learned mishearing the parent taught, unless it carries meaning on its own:
  // a taught "no" must never erase a negation (F07 7.2 rule 5).
  if (entry.heardAs.some((h) => R.norm(h) === o)) return heardAsCarriesMeaning(original, entry.kind, R) ? 'stt_fix_protected_word' : null;
  // Otherwise only a near-sounding word that is not itself meaningful on its
  // own, and only one the recogniser took for a name: capitalised, and not
  // merely because it starts a sentence. A lowercase word ("moon", "mirror")
  // was probably said as heard; the parent can teach it through heardAs.
  // Scripts without case give no such signal, so there it is heardAs only.
  if (!R.can.nameSimilarity) return 'stt_fix_not_heard_as';
  const ws = R.tokens(original);
  if (ws.length === 0 || ws.length > 3) return 'stt_fix_not_heard_as';
  for (const t of ws) {
    if (R.isProtectedWord(t.word)) return 'stt_fix_protected_word';
    if (ctx.dictionary.some((d) => d !== entry && (R.norm(d.term) === R.norm(t.word) || d.heardAs.some((h) => R.norm(h) === R.norm(t.word))))) {
      return 'stt_fix_protected_word';
    }
  }
  if (isTermWord(original, ctx.dictionary, R)) return 'stt_fix_protected_word';
  if (/[?!"“”]/.test(e.original) || R.moodMarks(e.original) || R.quoteMarkCount(e.original) > 0) return 'changes_sentence_type';
  const lead = e.original.length - e.original.trimStart().length;
  if (!ws.every((t) => /^\p{Lu}/u.test(t.word))) return 'stt_fix_not_heard_as';
  if (startsSentenceSkippingFillers(ctx.raw.slice(0, e.start + lead), ctx.level, R)) return 'stt_fix_not_heard_as';
  return R.soundsLike(original, entry.term) ? null : 'stt_fix_not_heard_as';
}

function checkAgreement(e: Edit, R: LanguageRules): RejectReason | null {
  const o = R.tokens(e.original);
  const r = R.tokens(e.replacement);
  if (o.length !== 1 || r.length !== 1) return 'agreement_not_single_word';
  // Nothing but the word itself may change: no punctuation rides along.
  if (e.original.slice(0, o[0].start) + e.original.slice(o[0].end) !== e.replacement.slice(0, r[0].start) + e.replacement.slice(r[0].end)) {
    return 'agreement_not_single_word';
  }
  const a = o[0].word;
  const b = r[0].word;
  // A closed table only (F06-REQ-007): the pack's listed verb and article
  // groups. The pack's generic -s, -es, -ies inflections are never used, so
  // a noun's number ("daughters" -> "daughter") cannot change.
  if (!isClosedAgreementPair(a, b, R.pack?.meaning.agreementGroups ?? [], (w) => R.isKinship(w))) {
    return R.isAgreementPair(a, b) ? 'agreement_stem_mismatch' : R.classifyWordSwap(a, b);
  }
  if ((a[0] === a[0].toUpperCase()) !== (b[0] === b[0].toUpperCase())) return 'agreement_stem_mismatch';
  return null;
}

/**
 * Spanish opening marks (RAE): an added ¿ or ¡ must sit where a clause
 * starts and pair with the ? or ! that ends that clause. Removing one is
 * never allowed. Only reached when the pack's punctuation table is vetted
 * (pairOpeners); otherwise ¿ and ¡ count as mood marks and cannot be added.
 */
function checkOpeners(e: Edit, ctx: VerifyContext, R: LanguageRules): RejectReason | null {
  const edited = ctx.raw.slice(0, e.start) + e.replacement + ctx.raw.slice(e.end);
  for (const [opener, close] of [['¿', '?'], ['¡', '!']] as const) {
    const was = count(e.original, opener);
    const now = count(e.replacement, opener);
    if (now < was) return 'changes_sentence_type';
    if (now === was) continue;
    for (let i = e.start; i < e.start + e.replacement.length; i++) {
      if (edited[i] !== opener) continue;
      const before = edited.slice(0, i).replace(/[\s"'“‘(«¿¡]+$/u, '');
      // At the clean level a filler the rules remove does not hold the question back ("em ¿quieres?").
      const clauseStart = before === '' || R.startsSentence(edited.slice(0, i), ctx.level) || /[,;:]$/.test(before);
      if (!clauseStart) return 'changes_sentence_type';
      let paired = false;
      for (let j = i + 1; j < edited.length; j++) {
        const ch = edited[j];
        if (ch === '¿' || ch === '¡') continue;
        const canon = MOOD_CANON[ch];
        if (canon !== undefined) {
          paired = canon.includes(close);
          break;
        }
        if (R.isSentenceEnd(ch)) break;
      }
      if (!paired) return 'changes_sentence_type';
    }
  }
  return null;
}

function checkPunctuation(e: Edit, ctx: VerifyContext): RejectReason | null {
  const R = rulesOf(ctx);
  // A character converted to the author's chosen script (發 -> 发) keeps the letter, like a case change.
  if (lettersOnly(e.original) !== lettersOnly(e.replacement) && !R.sameLettersAcrossScripts(e.original, e.replacement)) {
    return 'punctuation_changed_letters';
  }
  // Same letters is not enough: "were" -> "we're" and "some one" -> "someone"
  // keep the letters and change the words. Compare whole words around the edit.
  const { before, after } = wordWindow(ctx.raw, e);
  const tb = R.tokens(before).map((t) => R.scriptNorm(t.word));
  const ta = R.tokens(after).map((t) => R.scriptNorm(t.word));
  if (tb.length !== ta.length || tb.some((w, i) => w !== ta[i])) return 'changes_word';
  // Sentence type is the speaker's: a period may be added where there was no
  // end mark, but ? and ! are never added, removed or swapped (in any script: ？ ؟ count as ?).
  if (R.moodMarks(e.original) !== R.moodMarks(e.replacement)) return 'changes_sentence_type';
  // Nor may a repair put an end mark next to one already said, the same mark or another ("She
  // said no." to "no..", "more?" to "more?.", "हँसी।" to "हँसी।.", "她睡了？" to "她睡了？."; #179
  // tests-lens review and its re-check Note E, 23 Oct 2026). A run of touching marks may lose a
  // later mark, never gain one, and its first mark is never removed or changed (movesFirstMark).
  if (addsEndMarkPair(ctx.raw, e, R) || movesFirstMark(ctx.raw, e, R)) return 'changes_sentence_type';
  if (R.pairOpeners) {
    const opener = checkOpeners(e, ctx, R);
    if (opener) return opener;
  }
  if (R.quoteMarkCount(e.original) !== R.quoteMarkCount(e.replacement)) return 'changes_quotes';
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
  const R = rulesOf(ctx);
  if (e.start < 0 || e.end > raw.length || e.start > e.end) return 'out_of_bounds';
  if (raw.slice(e.start, e.end) !== e.original) return 'original_mismatch';
  if (!LEVEL_TYPES[ctx.level].has(e.type)) return 'type_not_allowed_at_level';
  if (!enabledForLanguage(e.type, R)) return 'not_vetted_for_language';

  // Direction marks and joiners change how a word reads without being seen (F06-REQ-003).
  if (changesInvisible(e)) return 'changes_invisible';

  // No edit may start or end inside one written character: between a letter
  // and its vowel sign, after a virama, or inside a surrogate pair (CORE-01).
  if (splitsCluster(raw, e.start) || splitsCluster(raw, e.end)) return 'splits_word';

  // Dictionary corrections from our own rules are allowed to land on a
  // mis-cased name; everything else must stay clear of protected spans.
  if (ctx.protectedSpans.some((p) => overlaps(p, e))) return 'overlaps_protected';
  const facts = rawFacts(raw);
  if (QUOTE_GUARDED_TYPES.has(e.type) && facts.quotes.some((q) => overlaps(q, e))) return 'overlaps_protected';

  // Only punctuation may work inside a word (sentence case is one letter);
  // its own check compares whole words. Nothing may glue two words together.
  if (e.type !== 'punctuation') {
    const toks = R.tokens(raw);
    if (insideWord(toks, e.start) || insideWord(toks, e.end)) return 'splits_word';
    if (joinsWords(raw, e, R)) return 'changes_word';
  }

  // A hyphenated word is one word: no removal takes part or all of "uh-uh"
  // (no), "mm-hmm" (yes), "uh-oh", "so-so" or "bye-bye" (F06-REQ-005, R-01 D6).
  if (REMOVAL_TYPES.has(e.type)) {
    const removed = R.tokens(e.original);
    for (const t of removed) {
      if (hyphenJoined(raw, e.start + t.start, e.start + t.end)) return e.type === 'filler' ? 'not_a_filler' : 'splits_word';
    }
    // Filler sounds are the filler label's business, where the offered-only and spoken-pair rules
    // apply. A repeat or false start made only of them ("mm " out of "mm mm Asho said no.", which
    // would leave a lone "mm", a no that reads as yes) is refused; a real restart that carries a
    // filler inside it ("she was, um, she was") is still a false start (#179 re-check N6, 23 Oct 2026).
    if (e.type !== 'filler' && e.replacement === '' && removed.length > 0 && removed.every((t) => R.isFiller(t.word, true))) {
      return e.type === 'repeat' ? 'repeat_is_emphasis' : 'false_start_complete_phrase';
    }
  } else if ((e.type === 'punctuation' || e.type === 'paragraph') && splitsHyphenated(raw, e)) {
    // Nor may punctuation or whitespace split one ("uh-oh" -> "uh -oh", "so-so" -> "so so"): found by the F06-REQ-021 property test.
    return 'changes_word';
  }

  let reason: RejectReason | null = null;
  switch (e.type) {
    case 'filler': {
      reason = checkRemovalShape(e, R);
      // Only words on the filler list may be removed under this label.
      // A filler said as its own sentence ("Hmm.") goes with its end mark.
      // Offered-only fillers ("mm" that may mean yes) come back only as
      // rule edits the parent accepted, never from a model. Two fillers with
      // only a space between them are a spoken yes or no ("uh uh", "mm hmm"):
      // not fillers (F06-REQ-005, R-01 D6).
      const removed = R.tokens(e.original);
      const withSuggest = e.source === 'rule';
      const isRemovableFiller = (t: Token) =>
        R.isFiller(t.word.toLowerCase(), withSuggest) &&
        R.standsAlone(raw, e.start + t.start, e.start + t.end) &&
        !R.fillerIsPartOfWord(raw, e.start + t.start, e.start + t.end);
      if (!reason && (removed.length === 0 || !removed.every(isRemovableFiller))) {
        reason = 'not_a_filler';
      }
      // Spanish: a filler question "¿eh?" goes with both of its marks, never half.
      if (!reason && count(e.original, '¿') + count(e.original, '¡') > 0 && !/[?!]/.test(e.original)) reason = 'changes_sentence_type';
      break;
    }
    case 'repeat':
      reason = checkRemovalShape(e, R) ?? checkRepeat(e, raw, R);
      break;
    case 'false_start':
      reason = checkRemovalShape(e, R) ?? checkFalseStart(e, raw, R);
      break;
    case 'stt_fix':
      reason = checkSttFix(e, ctx);
      break;
    case 'punctuation':
      reason = checkPunctuation(e, ctx);
      break;
    case 'agreement':
      reason = checkAgreement(e, R);
      break;
    case 'paragraph':
      if (e.original.trim() !== '' || e.replacement.trim() !== '') reason = 'paragraph_not_whitespace';
      break;
  }
  if (reason) return reason;
  if (REMOVAL_TYPES.has(e.type) && removalChangesSentenceEnd(raw, e, R)) return 'changes_sentence_type';
  if (e.type !== 'punctuation' && movesFirstMark(raw, e, R)) return 'changes_sentence_type';
  // Whatever its label, no edit leaves two end marks touching that the raw kept apart: a filler
  // removal of " um" alone out of "She said no. um." would ("no.."); the rules take " um." with its
  // own mark. Punctuation is checked in checkPunctuation, where the reason is the same.
  if (e.type !== 'punctuation' && addsEndMarkPair(raw, e, R)) return 'changes_sentence_type';

  // Every Unicode quotation style, counted on the whole text so an apostrophe
  // inside a word is told apart from a closing quote (F06-REQ-006).
  // The marks in order, not their count: U+201C to U+00AB is a restyling no edit may do (tests-lens review Note A).
  if (quotationMarks(raw.slice(0, e.start) + e.replacement + raw.slice(e.end)) !== facts.quoteMarks) return 'changes_quotes';

  // Belt and braces for every substitution, whatever its label: the words
  // around the edit keep their negations, numbers, end marks and quotes.
  if (!REMOVAL_TYPES.has(e.type) && e.type !== 'stt_fix') {
    // Whole-text comparison: a mark next to a number ("3:30" -> "3':30") changes it
    // without touching a word, so a word-sized window is not enough here.
    const edited = raw.slice(0, e.start) + e.replacement + raw.slice(e.end);
    if (R.negationCount(raw) !== R.negationCount(edited)) return 'changes_negation';
    const nb = R.numbersOf(raw).map((n) => R.scriptNorm(n));
    const na = R.numbersOf(edited).map((n) => R.scriptNorm(n));
    if (nb.length !== na.length || nb.some((n, i) => n !== na[i])) return 'changes_number';
    if (R.moodMarks(e.original) !== R.moodMarks(e.replacement)) return 'changes_sentence_type';
    if (R.quoteMarkCount(e.original) !== R.quoteMarkCount(e.replacement)) return 'changes_quotes';
  }

  // No edit may introduce a word that was not already in the span it
  // replaces (agreement and stt_fix are governed by their own rules above).
  if (e.type !== 'agreement' && e.type !== 'stt_fix') {
    const pool = R.words(e.original).map((w) => R.scriptNorm(w));
    for (const w of R.words(e.replacement).map((x) => R.scriptNorm(x))) {
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
function raisedOffSentenceStart(raw: string, accepted: Edit[], e: Edit, level: EditLevel, R: LanguageRules): boolean {
  if (e.type !== 'punctuation') return false;
  const changes = caseChanges(e, R) ?? [];
  const edited = raw.slice(0, e.start) + e.replacement + raw.slice(e.end);
  return changes.some((c) => {
    if (!c.raised) return false;
    const word = wordAt(edited, e.start + c.at).word;
    if (R.isPronounI(word)) return false;
    // A capital on a filler means the rules keep that filler (the second "uh"
    // of "Uh uh"), so the fillers before it are kept too: check the prefix as
    // said, with no filler skipping (engine 6, found by the F06-REQ-021 property test).
    return !R.startsSentence(finalPrefix(raw, accepted, e, c.at), R.isFiller(word) ? 'verbatim' : level);
  });
}

/**
 * Verify a list of edits. Rule edits should be passed first: on overlap,
 * the earlier accepted edit wins.
 */
export function verifyEdits(edits: Edit[], ctx: VerifyContext): VerifyResult {
  const R = rulesOf(ctx);
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
      const s = R.sentenceIndex(ctx.raw, e.start);
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
  const totalWords = Math.max(1, R.words(ctx.raw).length);
  const modelWords = accepted
    .filter((e) => e.source === 'model')
    .reduce((n, e) => n + Math.max(R.words(e.original).length, R.words(e.replacement).length, 1), 0);
  const allowed = Math.max(Math.ceil(CEILING_RATIO * totalWords), CEILING_MIN_WORDS);
  let ratio = modelWords / totalWords;
  if (modelWords > allowed) {
    for (const e of accepted) if (e.source === 'model') rejected.push({ edit: e, reason: 'change_ceiling_exceeded' });
    accepted = accepted.filter((e) => e.source !== 'model');
    ratio = 0;
  }

  // No two edits together may put an end mark next to one already said
  // (doublesEndMarkInContext), and capitals must sit on sentence starts of the
  // final text. Dropping one edit can move a sentence start, so repeat until
  // nothing changes.
  for (let changed = true; changed; ) {
    changed = false;
    const doubled = doublesEndMarkInContext(ctx.raw, accepted, R);
    if (doubled) {
      rejected.push({ edit: doubled, reason: 'changes_sentence_type' });
      accepted = accepted.filter((a) => a !== doubled);
      changed = true;
      continue;
    }
    for (const e of accepted) {
      if (raisedOffSentenceStart(ctx.raw, accepted, e, ctx.level, R)) {
        rejected.push({ edit: e, reason: 'case_change_not_sentence_start' });
        accepted = accepted.filter((a) => a !== e);
        changed = true;
        break;
      }
    }
  }
  if (ratio > 0) {
    const kept = accepted.filter((e) => e.source === 'model');
    ratio = kept.reduce((n, e) => n + Math.max(R.words(e.original).length, R.words(e.replacement).length, 1), 0) / totalWords;
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
