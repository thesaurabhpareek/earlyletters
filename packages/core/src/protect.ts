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

export function quotedSpans(text: string): Span[] {
  const spans: Span[] = [];
  const re = /["“]([^"“”]*)["”]/g;
  for (const m of text.matchAll(re)) spans.push({ start: m.index!, end: m.index! + m[0].length });
  return spans;
}

export function termSpans(text: string, terms: string[]): Span[] {
  const spans: Span[] = [];
  for (const t of terms) {
    if (!t.trim()) continue;
    for (const m of text.matchAll(termRegex(t))) {
      // Only exact-case matches are protected; a lowercase mishearing of a
      // name (e.g. "meera") is still correctable to "Meera".
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
  // Longer variants first so "Meera ji" wins over "Meera".
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
