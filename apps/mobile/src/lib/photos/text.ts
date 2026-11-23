import { clampGraphemes } from '@scribe/core';
import { PHOTO_PLACE_MAX, PHOTO_TEXT_MAX } from './types';
import { photos } from './copy';

/**
 * The parent's words about a picture (NS-01-R21): optional, trimmed at the ends, null when empty. The limit counts
 * characters a person sees (grapheme clusters, BL-957): 140 for the words and 60 for the place, keeping whole characters
 * only, so the cut never splits one. Migration 11's CHECK is only a ceiling in code points, 16 per grapheme (E84), which fits
 * every RGI emoji: the product cap is graphemes only and the ceiling never cuts them. Only a character longer than 16 code points
 * (a stack of marks) makes the cut stop before the ceiling, so the store never refuses what was kept. The app never fills the words in or suggests them, and never edits what is typed beyond
 * the ends and the length. These two fields are local only, so the local ceiling (16 per character) is the only code point limit.
 */
function capTyped(typed: string | null | undefined, max: number): string | null {
  const t = (typed ?? '').trim();
  return t ? clampGraphemes(t, max).trimEnd() || null : null;
}
export const normalizePhotoText = (typed: string | null | undefined): string | null => capTyped(typed, PHOTO_TEXT_MAX);

/** The typed place (NS-01-R21): optional, at most 60 characters a person sees, only what the parent typed. */
export const normalizePhotoPlace = (typed: string | null | undefined): string | null => capTyped(typed, PHOTO_PLACE_MAX);

/**
 * The picture's one text alternative for VoiceOver (NS-01-R9, R21): the parent's words when they typed any, else the
 * fixed phrase. Never generated.
 */
export const photoA11yLabel = (text: string | null | undefined): string => normalizePhotoText(text) ?? photos.book.photos.a11yCard;
