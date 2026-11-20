import { PHOTO_PLACE_MAX, PHOTO_TEXT_MAX } from './types';
import { photos } from './copy';

// Hermes has no Intl.Segmenter (ADR 0014). There a cluster is a base character with its marks (accents, vowel signs,
// variation selectors) and skin tones, joined across a ZWJ or an Indic virama, or a pair of regional indicators (a flag).
const VIRAMA = '[\\u094D\\u09CD\\u0A4D\\u0ACD\\u0B4D\\u0BCD\\u0C4D\\u0CCD\\u0D4D\\u0DCA]';
const EXTEND = `(?:(?!${VIRAMA})[\\p{M}\\u{1F3FB}-\\u{1F3FF}])`;
const BASE = '[^\\p{M}\\u200D]';
const CLUSTER = new RegExp(`[\\u{1F1E6}-\\u{1F1FF}]{2}|${BASE}${EXTEND}*(?:(?:${VIRAMA}${EXTEND}*|\\u200D)${BASE}${EXTEND}*)*(?:${VIRAMA}${EXTEND}*)?|[\\s\\S]`, 'gu');

/** The characters a person sees: Intl.Segmenter where the engine has one, the rule above where it does not. */
const graphemes = (s: string): string[] => {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: 'grapheme' }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  return Seg ? Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(s), (x) => x.segment) : (s.match(CLUSTER) ?? []);
};

/**
 * The parent's words about a picture (NS-01-R21): optional, trimmed at the ends, null when empty. The cap counts code
 * points, as migration 11's CHECK does, and keeps whole characters only, so the cut never splits a code point or a
 * character a person sees, and what is kept always fits the column. The app never fills it in or suggests it, and never
 * edits what is typed beyond the ends and the length.
 */
function capTyped(typed: string | null | undefined, max: number): string | null {
  const t = (typed ?? '').trim();
  if (!t) return null;
  let kept = '';
  let points = 0;
  for (const g of graphemes(t)) {
    const n = Array.from(g).length;
    if (points + n > max) break;
    kept += g;
    points += n;
  }
  return kept.trimEnd() || null;
}
export const normalizePhotoText = (typed: string | null | undefined): string | null => capTyped(typed, PHOTO_TEXT_MAX);

/** The typed place (NS-01-R21): optional, at most 60 code points of whole characters, only what the parent typed. */
export const normalizePhotoPlace = (typed: string | null | undefined): string | null => capTyped(typed, PHOTO_PLACE_MAX);

/**
 * The picture's one text alternative for VoiceOver (NS-01-R9, R21): the parent's words when they typed any, else the
 * fixed phrase. Never generated.
 */
export const photoA11yLabel = (text: string | null | undefined): string => normalizePhotoText(text) ?? photos.book.photos.a11yCard;
