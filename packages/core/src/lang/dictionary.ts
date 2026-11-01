/**
 * Dictionary matching and protected spans, script-aware.
 *
 * Same behaviour as protect.ts for English, with three differences that
 * matter in other scripts:
 *  - a word boundary counts combining marks as part of the word, so the
 *    term "आश" never matches inside "आशा" (the ा is a mark, not a letter);
 *  - between Chinese characters there are no spaces, so a Han term may sit
 *    right next to other Han characters;
 *  - quotation in « », 「 」 and 『 』 is protected like "...".
 * Terms and text are compared in NFC.
 */
import type { DictionaryTerm, Edit, Span } from '../types';
import { overlaps } from '../protect';
import type { LanguageRules } from './engine';

const WORDISH = /[\p{L}\p{M}\p{N}]/u;
const HAN = /\p{Script=Han}/u;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The code point just before index i, or ''. */
function charBefore(text: string, i: number): string {
  if (i <= 0) return '';
  const lo = text.charCodeAt(i - 1);
  if (lo >= 0xdc00 && lo <= 0xdfff && i >= 2) return text.slice(i - 2, i);
  return text[i - 1];
}

function charAt(text: string, i: number): string {
  if (i >= text.length) return '';
  return String.fromCodePoint(text.codePointAt(i)!);
}

/** Is there a word boundary between `outside` and the term's edge character `edge`? */
function boundary(outside: string, edge: string, R: LanguageRules): boolean {
  if (!outside || !WORDISH.test(outside)) return true;
  if (R.script.segmentation === 'char' && (HAN.test(outside) || HAN.test(edge))) return true;
  return false;
}

/** Every word-bounded occurrence of `term` (case-insensitive in cased scripts). */
export function termMatches(text: string, term: string, R: LanguageRules): Array<{ start: number; end: number; text: string }> {
  const t = term.normalize('NFC');
  if (!t.trim()) return [];
  const re = new RegExp(escapeRe(t), R.script.cased ? 'giu' : 'gu');
  const first = charAt(t, 0);
  const last = [...t].pop() ?? '';
  const out: Array<{ start: number; end: number; text: string }> = [];
  for (const m of text.matchAll(re)) {
    const start = m.index!;
    const end = start + m[0].length;
    if (!boundary(charBefore(text, start), first, R) || !boundary(charAt(text, end), last, R)) continue;
    out.push({ start, end, text: m[0] });
  }
  return out;
}

/**
 * Quoted speech in any of the quotation styles the engine knows. The
 * child's own words are never edited. For « » the protected span is the
 * quoted words themselves, so French spacing just inside the guillemets
 * can still be set; the marks cannot move because no punctuation edit may
 * change the number of quotation marks and no removal may take one.
 */
export function quotedSpansFor(text: string): Span[] {
  const spans: Span[] = [];
  for (const re of [/["“]([^"“”]*)["”]/g, /「[^「」]*」/g, /『[^『』]*』/g]) {
    for (const m of text.matchAll(re)) spans.push({ start: m.index!, end: m.index! + m[0].length });
  }
  for (const m of text.matchAll(/«([^«»]*)»/g)) {
    const inner = m[1];
    const lead = inner.length - inner.trimStart().length;
    const words = inner.trim();
    const start = m.index! + 1 + lead;
    spans.push(words ? { start, end: start + words.length } : { start: m.index!, end: m.index! + m[0].length });
  }
  return spans.sort((a, b) => a.start - b.start);
}

/** Exact-case occurrences of each term: protected. A mis-cased name ("asha") stays correctable. */
export function termSpansFor(text: string, terms: string[], R: LanguageRules): Span[] {
  const spans: Span[] = [];
  for (const term of terms) {
    const t = term.normalize('NFC');
    for (const m of termMatches(text, t, R)) if (m.text.normalize('NFC') === t) spans.push({ start: m.start, end: m.end });
  }
  return spans;
}

export function protectedSpansFor(text: string, dictionary: DictionaryTerm[], locked: string[], R: LanguageRules): Span[] {
  return [...quotedSpansFor(text), ...termSpansFor(text, dictionary.map((d) => d.term), R), ...termSpansFor(text, locked, R)];
}

/* ---------- guards shared by the rules, the verifier and save-time checks (R-01 D10, D13) ---------- */

/** The same term (compared the language's strict way): two entries for one name in different kinds are one term. */
function sameTerm(a: string, b: string, R: LanguageRules): boolean {
  return R.norm(a) === R.norm(b);
}

/**
 * Every word of `term` is an everyday word: a common word that is also a
 * name (hope, will, grace, bean) or a protected word (function word,
 * pronoun, kinship, negation, modal, number). Such a term gets no automatic
 * case-only fix, because the lowercase word was most likely meant as the
 * word: "I hope you sleep" for a child named Hope (F06-REQ-008, R-01 D10;
 * F07 7.2 rule 4).
 */
export function isEverydayTerm(term: string, R: LanguageRules): boolean {
  const toks = R.tokens(term);
  return toks.length > 0 && toks.every((t) => R.isEverydayWord(t.word));
}

/**
 * Does a fix to `replacement` take another family name, or another name's
 * taught mishearing, as its original? One family name never becomes
 * another (F06-REQ-014, R-01 D13; F07 7.2 rules 2 and 3): "Usha came over"
 * stays as said when Usha is in the dictionary too, and a mishearing taught
 * for two names fixes neither, because the engine cannot know which was meant.
 */
export function targetsOtherTerm(original: string, replacement: string, dictionary: DictionaryTerm[], R: LanguageRules): boolean {
  const o = R.norm(original.trim());
  for (const d of dictionary) {
    if (sameTerm(d.term, replacement.trim(), R)) continue;
    if (R.norm(d.term) === o) return true;
    if (d.heardAs.some((h) => R.norm(h) === o)) return true;
    // The other name inside a longer original ("Usha ji" -> "Asha ji"), unless the fix keeps it.
    if (termMatches(original, d.term, R).length > 0 && termMatches(replacement, d.term, R).length === 0) return true;
  }
  return false;
}

/**
 * Why a taught mishearing may not be applied, or null. A heard-as that is a
 * negation, a modal or a number would erase that meaning in every letter
 * ("no" taught for Noa turns "No, she did not cry" into "Noa, she did not
 * cry"); a lone pronoun or function word would turn "her" into a name; a
 * kinship word may only be taught to a term of kind self or family, as a
 * spelling of what the child calls someone ("mama" -> "Mumma"; F07 7.2 rule 5).
 */
export function heardAsCarriesMeaning(heard: string, kind: DictionaryTerm['kind'], R: LanguageRules): 'carries_meaning' | 'kinship_not_for_this_kind' | null {
  const toks = R.tokens(heard);
  if (toks.length === 0) return null;
  if (toks.some((t) => R.isNegation(t.word) || R.isModal(t.word)) || R.numbersOf(heard).length > 0) return 'carries_meaning';
  if (toks.length === 1 && (R.isFunctionWord(toks[0].word) || R.isPronoun(toks[0].word))) return 'carries_meaning';
  if (toks.some((t) => R.isKinship(t.word)) && kind !== 'self' && kind !== 'family') return 'kinship_not_for_this_kind';
  return null;
}

/** The answer to "may this heard-as be saved for this term?" (F07-REQ-012, F07 7.2 rule 5). */
export type HeardAsCheck =
  /** Save it; the engine applies it as an stt_fix (still through the verifier). */
  | 'ok'
  /** Refuse at save: it is another term, another term's form or another term's heard-as (F07-U04). */
  | 'collides_with_other_term'
  /** Refuse at save: a negation, modal, number, or a lone pronoun or function word. */
  | 'carries_meaning'
  /** Refuse at save: a kinship word taught to a child, nickname, place or word term. */
  | 'kinship_not_for_this_kind'
  /** Save it offer-only: an everyday word, never applied without the author's tap. */
  | 'offer_only';

/**
 * Save-time check for a taught heard-as value (F07 section 7.2 rule 5,
 * F07-REQ-012). Pure; the dictionary store (WP-F07-03) calls it before it
 * writes a heard-as. The engine applies the same guards on every clean, so
 * a value saved before this check existed is still refused there.
 */
export function checkHeardAs(term: DictionaryTerm, heard: string, dictionary: DictionaryTerm[], R: LanguageRules): HeardAsCheck {
  const h = heard.trim();
  if (!h) return 'carries_meaning';
  const others = dictionary.filter((d) => !sameTerm(d.term, term.term, R));
  if (others.some((d) => R.norm(d.term) === R.norm(h) || d.heardAs.some((x) => R.norm(x) === R.norm(h)))) return 'collides_with_other_term';
  if (others.some((d) => termMatches(h, d.term, R).length > 0)) return 'collides_with_other_term';
  const meaning = heardAsCarriesMeaning(h, term.kind, R);
  if (meaning) return meaning;
  const toks = R.tokens(h);
  if (toks.length > 0 && toks.every((t) => R.isCommonWord(t.word))) return 'offer_only';
  return 'ok';
}

/**
 * Dictionary corrections: every learned mishearing, and case-only variants
 * of a term, become the canonical term. Quoted spans are skipped. Longer
 * variants first, so "Asha ji" wins over "Asha".
 *
 * Engine 6 (R-01 D10, D13) proposes nothing for: a case-only variant of a
 * term that is an everyday word ("hope" for Hope, "will" for Will); a
 * heard-as that is another term or another term's heard-as; and a heard-as
 * that carries meaning on its own (heardAsCarriesMeaning). The verifier
 * refuses the same edits from any source (checkSttFix).
 */
export function dictionaryEditsFor(raw: string, dictionary: DictionaryTerm[], R: LanguageRules): Edit[] {
  const quotes = quotedSpansFor(raw);
  const edits: Edit[] = [];
  const taken: Span[] = [];
  const variants = dictionary
    .flatMap((d) => [{ v: d.term, d, heard: false }, ...d.heardAs.map((v) => ({ v, d, heard: true }))])
    .filter((x) => x.v.trim())
    .filter((x) => !x.heard || heardAsCarriesMeaning(x.v, x.d.kind, R) === null)
    .sort((a, b) => b.v.length - a.v.length);
  for (const { v, d, heard } of variants) {
    const term = d.term;
    for (const m of termMatches(raw, v, R)) {
      const span = { start: m.start, end: m.end };
      if (m.text === term || m.text.normalize('NFC') === term.normalize('NFC')) continue; // already correct
      if (!heard && isEverydayTerm(term, R)) continue; // "I hope" stays as said for a child named Hope
      if (targetsOtherTerm(m.text, term, dictionary, R)) continue; // one family name never becomes another
      if (quotes.some((q) => overlaps(q, span)) || taken.some((t) => overlaps(t, span))) continue;
      taken.push(span);
      edits.push({ type: 'stt_fix', ...span, original: m.text, replacement: term, source: 'rule' });
    }
  }
  return edits.sort((a, b) => a.start - b.start);
}

/**
 * Dictionary terms whose sound key matches `word` (name teaching and the
 * review screen's "did you mean"). Never applied: the caller offers them,
 * and an accepted one is taught as heardAs and goes through the verifier.
 */
export function soundAlikeTerms(word: string, dictionary: DictionaryTerm[], R: LanguageRules): DictionaryTerm[] {
  const k = R.phoneticKey(word);
  if (!k) return [];
  return dictionary.filter((d) => R.phoneticKey(d.term) === k && R.norm(d.term) !== R.norm(word));
}
