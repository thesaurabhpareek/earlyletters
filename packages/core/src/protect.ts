/**
 * Protected spans and dictionary corrections.
 *
 * Protected spans are never touched by any edit:
 *  - anything inside double quotes (the child's own words: "bau" stays "bau")
 *  - every dictionary term as written
 *  - phrases the parent locked in review
 */
import type { DictionaryTerm, Edit, Span } from './types';
import { nfc, WORD_CHAR_CLASS } from './text';
import { isWordApostrophe } from './meaning';

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Word-boundary matcher that works for non-ASCII terms (Unicode-aware).
 * Combining marks count as word characters (CORE-01): the term "आश" must
 * not match the start of "आशा", whose next character is a vowel sign.
 */
function termRegex(term: string): RegExp {
  return new RegExp(`(?<![${WORD_CHAR_CLASS}\\u200C\\u200D])${escapeRe(term)}(?![${WORD_CHAR_CLASS}\\u200C\\u200D])`, 'giu');
}

/**
 * Quotation styles beyond straight and curly double quotes (F06-REQ-006,
 * R-01 D7): opening mark -> the marks that may close it. Every character
 * here is `\p{Quotation_Mark}`. Covers English and Spanish single quotes,
 * German and Polish low-high quotes, French and Swiss single guillemets,
 * Danish and German reversed guillemets, Swedish and Finnish same-mark
 * quotes, CJK corner brackets and their vertical and half-width forms.
 */
const PAIRS: Readonly<Record<string, string>> = Object.freeze({
  '‘': '’',
  '‛': '’',
  '‚': '‘’',
  '„': '“”',
  '⹂': '“”',
  '‟': '”',
  '«': '»',
  '»': '«',
  '‹': '›',
  '›': '‹',
  '「': '」',
  '『': '』',
  '〝': '〞〟',
  '﹁': '﹂',
  '﹃': '﹄',
  '｢': '｣',
  '＂': '＂',
  '＇': '＇',
  "'": "'",
  '’': '’',
  '”': '”',
});

/** Marks that also close (or are apostrophes): they open only at the start of a word, after a space or bracket. */
const AMBIGUOUS_OPENERS = new Set(["'", '’', '”', '»', '›', '＂', '＇']);
const SPACE_SENSITIVE_CLOSERS = new Set(["'", '’', '”', '＂', '＇']);
const BEFORE_OPENER = /[\s([{\-–—"“‘«‹「『〝｢]/u;
/**
 * A space for quote pairing. JavaScript's \s also matches U+FEFF, an
 * invisible character: "up﻿’" must still close its quote, or the words
 * inside lose their protection (found by the F06-REQ-021 property test, 15 Oct).
 */
const SPACE = /[^\S﻿]/u;

function opensAt(text: string, i: number): boolean {
  const ch = text[i];
  if (!(ch in PAIRS)) return false;
  const next = text[i + 1] ?? '';
  if (next === '' || SPACE.test(next)) return false;
  if (!AMBIGUOUS_OPENERS.has(ch)) return true;
  const prev = text[i - 1] ?? '';
  return prev === '' || BEFORE_OPENER.test(prev);
}

/**
 * Quoted speech, which no removal, dictionary fix or agreement edit may
 * touch (the child's own words: "bau" stays "bau"). Straight and curly
 * double quotes pair as they always have; every other Unicode quotation
 * style pairs an opening mark with the next mark that may close it. An
 * apostrophe inside a word ("don’t", "Asha's") never opens or closes a
 * quote. Unpaired marks protect nothing (and still count as quotation
 * marks, so no edit may add, remove or move them).
 */
export function quotedSpans(text: string): Span[] {
  const spans: Span[] = [];
  for (const m of text.matchAll(/["“]([^"“”]*)["”]/g)) spans.push({ start: m.index!, end: m.index! + m[0].length });
  const inDouble = (i: number) => spans.some((s) => s.start <= i && i < s.end);
  for (let i = 0; i < text.length; i++) {
    if (inDouble(i) || !opensAt(text, i)) continue;
    const closers = PAIRS[text[i]];
    for (let j = i + 1; j < text.length; j++) {
      if (!closers.includes(text[j]) || isWordApostrophe(text, j)) continue;
      // A mark that doubles as an apostrophe closes only right after a word ("dogs' toys" pairs nothing across a space).
      if (SPACE_SENSITIVE_CLOSERS.has(text[j]) && SPACE.test(text[j - 1])) continue;
      spans.push({ start: i, end: j + 1 });
      i = j;
      break;
    }
  }
  return spans.sort((a, b) => a.start - b.start);
}

export function termSpans(text: string, terms: string[]): Span[] {
  const spans: Span[] = [];
  for (const t of terms) {
    if (!t.trim()) continue;
    for (const m of text.matchAll(termRegex(t))) {
      // Only exact-case matches are protected; a lowercase mishearing of a
      // name (e.g. "asha") is still correctable to "Asha".
      if (m[0] === t) spans.push({ start: m.index!, end: m.index! + m[0].length });
    }
  }
  return spans;
}

export function protectedSpans(text: string, dictionary: DictionaryTerm[], locked: string[] = []): Span[] {
  return [
    ...quotedSpans(text),
    ...termSpans(text, dictionary.map((d) => d.term)),
    ...termSpans(text, locked),
  ];
}

export function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Deterministic name/word corrections from the dictionary: every learned
 * mishearing, and case-only variants of a term, become the canonical term.
 * Quoted spans are skipped.
 */
export function dictionaryEdits(raw: string, dictionary: DictionaryTerm[]): Edit[] {
  const quotes = quotedSpans(raw);
  const edits: Edit[] = [];
  const taken: Span[] = [];
  // Longer variants first so "Asha ji" wins over "Asha".
  const variants = dictionary
    .flatMap((d) => [d.term, ...d.heardAs].map((v) => ({ v, term: d.term })))
    .filter((x) => x.v.trim())
    .sort((a, b) => b.v.length - a.v.length);

  for (const { v, term } of variants) {
    for (const m of raw.matchAll(termRegex(v))) {
      const span = { start: m.index!, end: m.index! + m[0].length };
      if (m[0] === term) continue; // already correct
      if (quotes.some((q) => overlaps(q, span)) || taken.some((t) => overlaps(t, span))) continue;
      taken.push(span);
      edits.push({ type: 'stt_fix', ...span, original: m[0], replacement: term, source: 'rule' });
    }
  }
  return edits.sort((a, b) => a.start - b.start);
}

/** True if `word` is a dictionary term (case-insensitive). */
export function isDictionaryTerm(word: string, dictionary: DictionaryTerm[]): boolean {
  const w = nfc(word).toLowerCase();
  return dictionary.some((d) => {
    const t = nfc(d.term).toLowerCase();
    return t === w || t.split(/\s+/).includes(w);
  });
}
