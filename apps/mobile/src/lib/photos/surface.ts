/** Sizes and the snapshot rule for the new controls (NS-01-R3, R13). Every size is read from tokens.picture (conformance F-19). */
import { tokens } from '@scribe/design-tokens';

/** The thumbnail above the capture buttons is never taller than this on Ready (design spec 3.2). R3 sets no minimum. */
export const THUMB_MAX_HEIGHT_PT: number = tokens.picture.thumbMaxPt;

/** From AX3 up the Ready thumbnail is at most this tall (NS-01-R39, PROPOSED) so Speak, Type and Change stay on screen. */
export const THUMB_AX_MAX_HEIGHT_PT: number = tokens.picture.thumbAxMaxPt;

/**
 * The picture's size on the letter page (CL-116 C-01, ruling NS-01-C01-order). PROPOSED numbers, to become a design
 * token with a pair test (design-systems): below AX3 no taller than the text column times 0.75 and no taller than 40
 * percent of the window; from AX3 up no taller than LETTER_PICTURE_AX_MAX_PT so the dateline and the first line of
 * words are on the first screen on an SE 3 at AX5. The picture keeps its own proportions (never cropped or stretched:
 * R42); the size comes from the stored width and height, so nothing below it moves after the page opens.
 */
export const LETTER_PICTURE_COLUMN_RATIO: number = tokens.picture.letterColumnRatio;
export const LETTER_PICTURE_WINDOW_RATIO: number = tokens.picture.letterWindowRatio;
/** From AX3 up: the token's 88 pt (design-systems, F-19), not the 120 pt mobile first drew. */
export const LETTER_PICTURE_AX_MAX_PT: number = tokens.picture.letterAxMaxPt;

/**
 * The Photos lens thumbnail (B-S04, NS-01-R42): the whole picture, uncropped, with `lensThumbPt` on its long side. At
 * accessibility sizes the card stacks and the thumbnail takes the card's width up to `thumbMaxPt` tall (the caller
 * draws it full width with that cap, so no pixel size is returned for that form).
 */
export function lensThumbSize(a: { aspect: number; largeText: boolean }): { width: number; height: number } | { stacked: true; maxHeight: number; aspect: number } {
  const aspect = a.aspect > 0 ? a.aspect : 1;
  if (a.largeText) return { stacked: true, maxHeight: tokens.picture.thumbMaxPt, aspect };
  const long = tokens.picture.lensThumbPt;
  return aspect >= 1 ? { width: long, height: long / aspect } : { width: long * aspect, height: long };
}

export function letterPictureSize(a: { columnWidth: number; windowHeight: number; aspect: number; largeText: boolean }): { width: number; height: number } {
  const aspect = a.aspect > 0 ? a.aspect : 4 / 3;
  const cap = a.largeText ? LETTER_PICTURE_AX_MAX_PT : Math.min(a.columnWidth * LETTER_PICTURE_COLUMN_RATIO, a.windowHeight * LETTER_PICTURE_WINDOW_RATIO);
  const height = Math.min(a.columnWidth / aspect, cap);
  return { width: Math.min(a.columnWidth, height * aspect), height };
}

/**
 * Screens that show a picture draw nothing while App lock is on and the app is not in front, or before it is unlocked
 * (NS-01-R13, NX-39-R36), so the switcher snapshot and a cold open show no picture.
 */
export function pictureHidden(input: { lockOn: boolean; unlocked: boolean; phase: 'active' | 'inactive' | 'background' }): boolean {
  if (!input.lockOn) return false;
  return !input.unlocked || input.phase !== 'active';
}

/**
 * Karma's ruling (11 Nov 2026, reversible default): a screen that shows a picture is blank in the app switcher
 * snapshot whether or not App lock is on. NX-39-R36 asked for it only with App lock on; flip this constant to follow
 * R36 as written. The App lock cover itself (PrivacyCover) still covers a locked app as before.
 */
export const PHOTO_BLANK_WITHOUT_APP_LOCK = true;

/** True when a picture must not be drawn right now: the app is not in front (inactive covers the snapshot moment). */
/** The hook's phase mapping, pure so it can be pinned: only a phone in front ('active') shows a picture; 'inactive' (the switcher
 * snapshot is taken), 'background', 'unknown' and any other state cover it (NS-01-R13a). */
export function coveredForAppState(phase: string): boolean {
  return pictureCovered(phase === 'active' || phase === 'inactive' ? phase : 'background');
}

/**
 * Which controls the letter page and Review draw for a picture (NS-01-R9c): only the letter's author adds, changes, takes
 * off or edits the words; another parent only sees the picture. A picture needs words on the letter to be added (R5).
 */
export function letterPhotoControls(a: { own: boolean; hasPhoto: boolean; hasWords: boolean }): { add: boolean; change: boolean; remove: boolean; editWords: boolean } {
  const author = a.own === true;
  return { add: author && !a.hasPhoto && a.hasWords, change: author && a.hasPhoto, remove: author && a.hasPhoto, editWords: author && a.hasPhoto };
}

export function pictureCovered(phase: 'active' | 'inactive' | 'background', lockOn = false, unlocked = true): boolean {
  return pictureHidden({ lockOn: lockOn || PHOTO_BLANK_WITHOUT_APP_LOCK, unlocked, phase });
}
