import { PHOTO_TEXT_MAX } from './types';
import { photos } from './copy';

const graphemes = (s: string): string[] => {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: 'grapheme' }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  return Seg ? Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(s), (x) => x.segment) : Array.from(s);
};

/**
 * The parent's words about a picture (NS-01-R22): optional, at most 140 characters, trimmed at the ends, null when
 * empty. The app never fills it in or suggests it, and never edits what is typed beyond the ends and the length.
 */
export function normalizePhotoText(typed: string | null | undefined): string | null {
  const t = (typed ?? '').trim();
  if (!t) return null;
  const g = graphemes(t);
  return (g.length > PHOTO_TEXT_MAX ? g.slice(0, PHOTO_TEXT_MAX).join('') : t).trimEnd() || null;
}

export const photoTextLength = (typed: string): number => graphemes(typed).length;

/**
 * The picture's one text alternative for VoiceOver (NS-01-R9, R22): the parent's words when they typed any, else the
 * fixed phrase. Never generated.
 */
export const photoA11yLabel = (text: string | null | undefined): string => normalizePhotoText(text) ?? photos.a11y.photoWithLetter;
