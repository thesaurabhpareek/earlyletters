/**
 * Text-size thresholds for layout decisions (TDD 09 2.3). Pure and tested
 * (a11y.logic.test.ts); a11y.ts re-exports these and adds the live hooks.
 */

/** React Native's iOS font-scale multipliers (RCTAccessibilityManager.mm, RN 0.86). */
export const FONT_SCALE = {
  large: 1, // default
  xxxLarge: 1.353,
  ax1: 1.786,
  ax3: 2.643,
  ax5: 3.571,
} as const;

/** True at AX1 and above, Apple's definition of an accessibility text size. */
export function isAccessibilitySize(fontScale: number): boolean {
  return fontScale >= FONT_SCALE.ax1 - 0.001;
}

/** True at xxxLarge and above: where two labelled buttons no longer fit side by side on an SE. */
export function isLargeText(fontScale: number): boolean {
  return fontScale >= FONT_SCALE.xxxLarge - 0.001;
}
