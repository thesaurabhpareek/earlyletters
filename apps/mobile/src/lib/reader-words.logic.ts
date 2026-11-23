/**
 * Three small words for a reader new to apps (BL-1823; PER3-014, PER3-015, PER3-017). Pure and tested
 * (test/reader-words.test.ts). The words live in `packages/content` (`reader.readingSizeWord`,
 * `readTogether.finishButton`, `readTogether.previousButton`); this file only decides when "Size" shows and when a swipe
 * down leaves Read together.
 */
import { isAccessibilitySize } from './a11y.logic';

/** "Size" stands beside "Aa" from AX1 up, where there is room for the word and the reader most needs it. */
export function showsSizeWord(fontScale: number): boolean {
  return isAccessibilitySize(fontScale);
}

/** A swipe down on Read together's top bar leaves it: far enough, or fast enough (the letter page's own numbers). */
export const LEAVE_SWIPE_PT = 64;
export const LEAVE_SWIPE_VELOCITY = 800;
export function swipeLeaves(translationY: number, velocityY: number): boolean {
  return translationY > LEAVE_SWIPE_PT || velocityY > LEAVE_SWIPE_VELOCITY;
}

/**
 * "Size" is a control label, so it stops growing at twice its size (about 32 pt): at AX5 uncapped it is about 57 pt and
 * overflows a 320 pt bar beside Back and "Aa" (design-systems font-metric calculation: 21 pt slack at 375, 6 at 360, over at
 * 320). Letter text is never capped (D-027); this is not letter text.
 */
export const SIZE_WORD_MAX_SCALE = 2;

/**
 * A header swipe down to leave Read together stays off until a device shows it is safe: Read together is a native modal
 * (_layout.tsx) and the native dismiss gesture and this one could both pop, leaving two screens. Close and the end-of-book
 * button are the ways out. The wrapper and `swipeLeaves` are in place for the BL-1786 device check.
 */
export const READ_TOGETHER_HEADER_SWIPE = false;
