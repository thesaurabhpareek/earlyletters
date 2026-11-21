// One length rule for words a person types that become part of a letter (BL-957, NS-01-R54, NS-06-A, NS-16-R1 and R6).
// The product limit counts characters a person sees (grapheme clusters). The database keeps only a ceiling in code
// points, set above the product limit, so the field and the store never disagree. UTF-16 units (`maxLength`, `.length`,
// `.slice`) are never the rule.

/** Hermes has no Intl.Segmenter (ADR 0014). There a cluster is a base with its marks, skin tones, ZWJ and Indic virama joins, or a flag. */
const VIRAMA = '[\\u094D\\u09CD\\u0A4D\\u0ACD\\u0B4D\\u0BCD\\u0C4D\\u0CCD\\u0D4D\\u0DCA]';
const EXTEND = `(?:(?!${VIRAMA})[\\p{M}\\u{1F3FB}-\\u{1F3FF}])`;
const BASE = '[^\\p{M}\\u200D]';
const CLUSTER = new RegExp(
  `[\\u{1F1E6}-\\u{1F1FF}]{2}|${BASE}${EXTEND}*(?:(?:${VIRAMA}${EXTEND}*|\\u200D)${BASE}${EXTEND}*)*(?:${VIRAMA}${EXTEND}*)?|[\\s\\S]`,
  'gu',
);

/** Migration 11's CHECK keeps 16 code points for each character a person sees (E84, NS-01-R54): a ceiling, never the limit. */
export const CODE_POINTS_PER_GRAPHEME = 16;

type Segmenter = new (l?: string, o?: { granularity: 'grapheme' }) => { segment(s: string): Iterable<{ segment: string }> };

/** The rule above on its own, for engines without Intl.Segmenter. Exported so tests can run the Hermes path. */
export function graphemesByRule(s: string): string[] {
  return s.match(CLUSTER) ?? [];
}

/** The characters a person sees: Intl.Segmenter where the engine has one, the rule above where it does not. */
export function graphemes(s: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: Segmenter }).Segmenter;
  return Seg ? Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(s), (x) => x.segment) : graphemesByRule(s);
}

/** How many characters a person sees in `s`. Counts what is given; a caller that stores NFC normalises first. */
export function graphemeLength(s: string): number {
  return graphemes(s).length;
}

/** The most code points the database may hold for a field of `max` characters a person sees. */
export function codePointCeiling(max: number): number {
  return max * CODE_POINTS_PER_GRAPHEME;
}

/**
 * Cuts `s` to at most `max` characters a person sees, whole characters only. It also stops before the code point
 * ceiling, so the store never refuses what the field kept (only a stack of more than 16 code points in one character
 * can reach it).
 */
export function clampGraphemes(s: string, max: number): string {
  const ceiling = codePointCeiling(max);
  let kept = '';
  let count = 0;
  let points = 0;
  for (const g of graphemes(s)) {
    const n = Array.from(g).length;
    if (count === max || points + n > ceiling) break;
    kept += g;
    count += 1;
    points += n;
  }
  return kept;
}

/** True when `s` is within `max` characters a person sees and the code point ceiling. */
export function fitsGraphemes(s: string, max: number): boolean {
  return clampGraphemes(s, max) === s;
}
