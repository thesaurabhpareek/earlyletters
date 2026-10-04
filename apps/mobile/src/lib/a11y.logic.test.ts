/**
 * Text-size thresholds that drive stacking (TDD 09 2.3): isAccessibilitySize at AX1 and
 * above (Apple's UIContentSizeCategory.isAccessibilityCategory), isLargeText at xxxLarge.
 */
import { describe, expect, it } from 'vitest';
import { FONT_SCALE, isAccessibilitySize, isLargeText } from './a11y.logic';

describe('isAccessibilitySize', () => {
  it('is false at every standard size, xxxLarge included', () => {
    for (const s of [0.823, 0.882, 0.941, FONT_SCALE.large, 1.118, 1.235, FONT_SCALE.xxxLarge]) {
      expect(isAccessibilitySize(s)).toBe(false);
    }
  });

  it('is true from AX1 through AX5', () => {
    for (const s of [FONT_SCALE.ax1, 2.143, FONT_SCALE.ax3, 3.143, FONT_SCALE.ax5]) {
      expect(isAccessibilitySize(s)).toBe(true);
    }
  });

  it('tolerates the float noise React Native reports at AX1', () => {
    expect(isAccessibilitySize(1.7855)).toBe(true);
    expect(isAccessibilitySize(1.7845)).toBe(false);
  });

  it('treats an unknown or zero scale as standard', () => {
    expect(isAccessibilitySize(0)).toBe(false);
    expect(isAccessibilitySize(Number.NaN)).toBe(false);
  });
});

describe('isLargeText', () => {
  it('starts at xxxLarge, before the accessibility sizes', () => {
    expect(isLargeText(1.235)).toBe(false);
    expect(isLargeText(FONT_SCALE.xxxLarge)).toBe(true);
    expect(isLargeText(1.3525)).toBe(true);
    expect(isLargeText(FONT_SCALE.ax1)).toBe(true);
  });

  it('every accessibility size is also large text', () => {
    for (const s of [FONT_SCALE.ax1, FONT_SCALE.ax3, FONT_SCALE.ax5]) {
      expect(isAccessibilitySize(s) && isLargeText(s)).toBe(true);
    }
  });
});
