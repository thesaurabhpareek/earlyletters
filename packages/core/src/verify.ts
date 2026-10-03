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
 *    anything that is not a filler, an accidental repeat or a real restart.
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
import { lettersOnly, type Token } from './text';
import { overlaps } from './protect';
import { MOOD_CANON } from './meaning';
import { ENGLISH_RULES, type LanguageRules } from './lang/engine';

/** Starting values. Tune on real recordings (PRD v2 section 24, experiment 2). */
export const CEILING_RATIO = 0.15;
export const CEILING_MIN_WORDS = 3;

const LEVEL_TYPES: Record<EditLevel, ReadonlySet<EditType>> = {
  clean: new Set(['filler', 'false_start', 'repeat', 'stt_fix', 'punctuation', 'agreement', 'paragraph']),
  verbatim: new Set(['stt_fix', 'punctuation']),
};

const REMOVAL_TYPES: ReadonlySet<EditType> = new Set(['filler', 'repeat', 'false_start']);

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

const WORD_CHAR = /[\p{L}\p{M}\p{N}'’]/u;

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
 * the filler is removed, the capital is positional). Sentence marks come
 * from the language rules (danda, full-width, Arabic marks).
 */
export function startsSentence(prefix: string, level: EditLevel, rules: LanguageRules = ENGLISH_RULES): boolean {
  return rules.startsSentence(prefix, level);
}

interface CaseChange {
  /** Offset in e.replacement of the letter whose case changed. */
  at: number;
  /** Offset of the same letter in e.original. */
  from: number;
  raised: boolean;
}

/**
 * Letter-by-letter case changes in a punctuation edit, or null if the
 * letters do not line up. A character converted to the author's script
 * (發 -> 发) is not a case change.
 */
function caseChanges(e: Edit, R: LanguageRules): CaseChange[] | null {
  const LETTER = /[\p{L}\p{N}]/u;
  const out: CaseChange[] = [];
  let i = 0;
  let j = 0;
  for (;;) {
    while (i < e.original.length && !LETTER.test(e.original[i])) i++;
    while (j < e.replacement.length && !LETTER.test(e.replacement[j])) j++;
    if (i >= e.original.length || j >= e.replacement.length) break;
    const o = e.original[i];
    const r = e.replacement[j];
    if (o !== r && R.variantOf(o) !== r) {
      if (o.toLowerCase() !== r.toLowerCase()) return null;
      out.push({ at: j, from: i, raised: r === r.toUpperCase() && o !== o.toUpperCase() });
    }
    i++;
    j++;
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
  // Dictionary-backed: a learned mishearing the parent taught, or the term in another case.
  if (o === R.norm(entry.term) || entry.heardAs.some((h) => R.norm(h) === o)) return null;
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
  if (R.startsSentence(ctx.raw.slice(0, e.start + lead), ctx.level)) return 'stt_fix_not_heard_as';
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
  if (!R.isAgreementPair(a, b)) return R.classifyWordSwap(a, b);
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

  // Dictionary corrections from our own rules are allowed to land on a
  // mis-cased name; everything else must stay clear of protected spans.
  if (ctx.protectedSpans.some((p) => overlaps(p, e))) return 'overlaps_protected';

  // Only punctuation may work inside a word (sentence case is one letter);
  // its own check compares whole words. Nothing may glue two words together.
  if (e.type !== 'punctuation') {
    const toks = R.tokens(raw);
    if (insideWord(toks, e.start) || insideWord(toks, e.end)) return 'splits_word';
    if (joinsWords(raw, e, R)) return 'changes_word';
  }

  let reason: RejectReason | null = null;
  switch (e.type) {
    case 'filler': {
      reason = checkRemovalShape(e, R);
      // Only words on the filler list may be removed under this label.
      // A filler said as its own sentence ("Hmm.") goes with its end mark.
      // Offered-only fillers ("mm" that may mean yes) come back only as
      // rule edits the parent accepted, never from a model.
      const removed = R.tokens(e.original);
      const withSuggest = e.source === 'rule';
      if (
        !reason &&
        (removed.length === 0 ||
          !removed.every((t) => R.isFiller(t.word.toLowerCase(), withSuggest) && R.standsAlone(raw, e.start + t.start, e.start + t.end)))
      ) {
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
    if (R.isPronounI(wordAt(edited, e.start + c.at).word)) return false;
    return !R.startsSentence(finalPrefix(raw, accepted, e, c.at), level);
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

  // Capitals must sit on sentence starts of the final text. Dropping one
  // edit can move a sentence start, so repeat until nothing changes.
  for (let changed = true; changed; ) {
    changed = false;
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
