/**
 * The letter page's "Aa" control with its "Size" word, as arithmetic over tokens and font scale (BL-1990, CDESO-2).
 * Pure and tested (test/size-control.test.ts); the screen only applies the numbers.
 *
 * Rules (ruling CDESO-2): the word never truncates, so it has no line limit and wraps under "Aa" before it can clip;
 * the whole control is at least 44 pt, and at least 56 pt from AX1 as the bar is sized (BL-1790). The word's 2x cap is
 * accepted (app text on a control, not letter text, D-027). The spoken label stays `readingSizeA11y`.
 */
import { tokens } from '@scribe/design-tokens';
import { FONT_SCALE, isAccessibilitySize } from './a11y.logic';
import { SIZE_WORD_MAX_SCALE } from './reader-words.logic';

/** "Aa" stops growing at 1.3x (the screen's `maxFontSizeMultiplier`). */
export const AA_MAX_SCALE = 1.3;
/** Vertical padding of the control, top plus bottom, and the gap between "Aa" and a stacked word. */
const PAD_PT = 8;
const STACK_GAP_PT = 2;
/** From AX3 the word sits under "Aa": beside it, Back plus "Aa" plus "Size" is about 335 pt at AX5, over a narrow bar. */
export const SIZE_STACKS_FROM = FONT_SCALE.ax3;

export function sizeWordStacks(fontScale: number): boolean {
  return fontScale >= SIZE_STACKS_FROM - 0.001;
}

/** Smallest height of the control: 44 pt below AX1, 56 pt from AX1, and never less than its own content. */
export function sizeControlMinHeight(fontScale: number): number {
  const floor = isAccessibilitySize(fontScale) ? tokens.target.primary : tokens.target.min;
  const aa = tokens.type.title2.lineHeight * Math.min(Math.max(1, fontScale), AA_MAX_SCALE);
  if (!isAccessibilitySize(fontScale)) return floor;
  const word = tokens.type.labelSmall.lineHeight * Math.min(Math.max(1, fontScale), SIZE_WORD_MAX_SCALE);
  const content = sizeWordStacks(fontScale) ? aa + STACK_GAP_PT + word + PAD_PT : Math.max(aa, word) + PAD_PT;
  return Math.max(floor, Math.ceil(content));
}

/** What the screen applies to the word: no line limit, ever. `undefined` is "no limit" to React Native. */
export const SIZE_WORD_NUMBER_OF_LINES: number | undefined = undefined;
