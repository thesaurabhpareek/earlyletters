/**
 * Dictionary matching and protected spans, script-aware.
 *
 * Same behaviour as protect.ts for English, with three differences that
 * matter in other scripts:
 *  - a word boundary counts combining marks as part of the word, so the
 *    term "मीर" never matches inside "मीरा" (the ा is a mark, not a letter);
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

/** Exact-case occurrences of each term: protected. A mis-cased name ("meera") stays correctable. */
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

/**
 * Dictionary corrections: every learned mishearing, and case-only variants
 * of a term, become the canonical term. Quoted spans are skipped. Longer
 * variants first, so "Meera ji" wins over "Meera".
 */
export function dictionaryEditsFor(raw: string, dictionary: DictionaryTerm[], R: LanguageRules): Edit[] {
  const quotes = quotedSpansFor(raw);
  const edits: Edit[] = [];
  const taken: Span[] = [];
  const variants = dictionary
    .flatMap((d) => [d.term, ...d.heardAs].map((v) => ({ v, term: d.term })))
    .filter((x) => x.v.trim())
    .sort((a, b) => b.v.length - a.v.length);
  for (const { v, term } of variants) {
    for (const m of termMatches(raw, v, R)) {
      const span = { start: m.start, end: m.end };
      if (m.text === term || m.text.normalize('NFC') === term.normalize('NFC')) continue; // already correct
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
