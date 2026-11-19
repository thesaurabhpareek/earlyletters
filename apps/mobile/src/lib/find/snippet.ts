/**
 * The excerpt a result shows (NS-02-R9, FD-R4). It is always a contiguous slice of the text the parent kept: cut on
 * whole words, never rewritten, summarised or joined, and never ended with an ellipsis character (the card's fade does
 * that visually). The match is reported as ranges inside the slice so the screen can mark it with an underline and a
 * medium weight (not colour alone).
 */
import { foldText, tokenize, type PreparedQuery } from './query';

export interface Excerpt {
  /** A contiguous slice of the source text. */
  text: string;
  /** Where `text` starts in the source (UTF-16 units). */
  offset: number;
  /** Matched ranges inside `text`. */
  marks: { start: number; end: number }[];
  /** The slice starts or ends inside the text, so the screen fades that edge. */
  cutStart: boolean;
  cutEnd: boolean;
}

/** Sentence ends, in Latin, Devanagari (danda), Arabic and CJK script. */
const SENTENCE_END = /[.!?।॥؟۔。！？]+["')\]»]*(?:\s+|$)|\n+/gu;
/** The longest slice shown, in UTF-16 units. A sentence longer than this is cut on whole words around the match. */
export const EXCERPT_MAX = 180;

/** Offsets of every match in `text` for this query. */
export function matchRanges(q: PreparedQuery, text: string): { start: number; end: number }[] {
  if (q.kind === 'none') return [];
  const out: { start: number; end: number }[] = [];
  if (q.kind === 'substring') {
    const low = text.toLowerCase();
    if (low.length !== text.length) return out; // case mapping changed the length; leave this one unmarked rather than mark wrong
    for (const t of q.terms) {
      for (let at = low.indexOf(t); at >= 0; at = low.indexOf(t, at + Math.max(t.length, 1))) out.push({ start: at, end: at + t.length });
    }
    return out.sort((a, b) => a.start - b.start);
  }
  const last = q.terms.length - 1;
  for (const tok of tokenize(text)) {
    const f = foldText(tok.text);
    if (q.terms.some((t, i) => (i === last ? f.startsWith(t) : f === t))) {
      // A prefix match marks the whole word, as the parent will read it.
      out.push({ start: tok.start, end: tok.end });
    }
  }
  return out;
}

/** The slice of `text` that holds the first match. With no match (should not happen) the start of the text. */
export function excerpt(q: PreparedQuery, text: string, max: number = EXCERPT_MAX): Excerpt {
  const ranges = matchRanges(q, text);
  const first = ranges[0]?.start ?? 0;
  // The sentence that holds the match.
  let s = 0;
  let e = text.length;
  SENTENCE_END.lastIndex = 0;
  for (let m = SENTENCE_END.exec(text); m; m = SENTENCE_END.exec(text)) {
    const end = m.index + m[0].length;
    if (end <= first) s = end;
    else {
      e = end;
      break;
    }
  }
  // A sentence that is too long is cut on whole words around the match.
  const sentenceStart = s;
  const sentenceEnd = e;
  if (e - s > max) {
    const ws = (i: number) => /\s/u.test(text[i] ?? '');
    let a = Math.max(s, first - Math.floor(max / 3));
    let b = Math.min(e, a + max);
    if (a > s) while (a < first && !ws(a - 1)) a++; // start at a word start
    if (b < e) while (b > first && !ws(b)) b--; // end at a word end
    if (b <= first) b = Math.min(e, first + max); // one very long word (CJK has no breaks): cut where the budget ends
    // never split a surrogate pair
    if (a > 0 && /[\uDC00-\uDFFF]/.test(text[a] ?? '')) a--;
    if (b < text.length && /[\uDC00-\uDFFF]/.test(text[b] ?? '')) b++;
    s = a;
    e = b;
  }
  const raw = text.slice(s, e);
  const lead = raw.length - raw.trimStart().length;
  const sliced = raw.trim();
  const offset = s + lead;
  const marks = ranges.filter((r) => r.start >= offset && r.end <= offset + sliced.length).map((r) => ({ start: r.start - offset, end: r.end - offset }));
  return { text: sliced, offset, marks, cutStart: s > sentenceStart, cutEnd: e < sentenceEnd };
}
