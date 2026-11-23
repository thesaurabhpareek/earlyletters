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
