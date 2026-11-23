/**
 * The letter page's own top bar (Back and "Aa"), as arithmetic over tokens and font scale (BL-1790, PER3-009).
 * Pure and tested (test/letter-top-bar.test.ts); the screen only applies the numbers.
 *
 * Back is a quiet small Button: a 44 pt minimum, its label (labelSmall, uncapped) plus 8 pt of padding above and below.
 * At accessibility sizes the label's line outgrows 44 pt, so a bar fixed at 52 pt let Back spill over the first lines
 * of the letter. The bar now takes the height of its tallest button, and the letter starts the same gap below it.
 * At the default size every number here equals the old one (bar 52 pt, letter 60 pt below the safe area).
 */
import { tokens } from '@scribe/design-tokens';

/** The bar's height at the default size, below the safe area. */
export const TOP_BAR_MIN_PT = 52;
/** Space between the bottom of the bar and the first line of the letter. */
export const TOP_BAR_GAP_PT = 8;
/** Back's vertical padding, top plus bottom (py-2 on a `sm` Button). */
const BACK_PAD_PT = 16;

/** Height of the Back button at a font scale: its label line grows with text, never below the 44 pt target. */
export function backButtonHeight(fontScale: number): number {
  const label = tokens.type.labelSmall.lineHeight * Math.max(1, fontScale);
  return Math.max(tokens.target.min, Math.ceil(label + BACK_PAD_PT));
}

/** Bar height below the safe area: follows the largest Back button, never under 52 pt. */
export function topBarContentHeight(fontScale: number): number {
  return Math.max(TOP_BAR_MIN_PT, backButtonHeight(fontScale));
}

/** Whole bar, safe area included. */
export function topBarHeight(inset: number, fontScale: number): number {
  return inset + topBarContentHeight(fontScale);
}

/** Where the letter starts: the bar's height plus the gap (inset + 60 at the default size). */
export function letterStartY(inset: number, fontScale: number): number {
  return topBarHeight(inset, fontScale) + TOP_BAR_GAP_PT;
}
