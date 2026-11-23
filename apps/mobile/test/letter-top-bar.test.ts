/**
 * BL-1790 (PER3-009): the letter page's top bar follows its Back button, and the letter starts below it, at AX1 and AX5.
 * Layout arithmetic over tokens and font scale, not a rendered screen; the real screen is seen in BL-1786 (device sitting).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FONT_SCALE } from '../src/lib/a11y.logic';
import { backButtonHeight, letterStartY, topBarContentHeight, topBarHeight } from '../src/lib/letter-top-bar.logic';

const INSET = 59; // a notch phone's top safe area

describe('letter page top bar', () => {
  it('is unchanged at the default size: 52 pt bar, letter 60 pt below the safe area', () => {
    expect(topBarContentHeight(FONT_SCALE.large)).toBe(52);
    expect(topBarHeight(INSET, FONT_SCALE.large)).toBe(INSET + 52);
    expect(letterStartY(INSET, FONT_SCALE.large)).toBe(INSET + 60);
  });

  it('is unchanged at xxxLarge, where Back is still under the bar', () => {
    expect(backButtonHeight(FONT_SCALE.xxxLarge)).toBeLessThanOrEqual(52);
    expect(letterStartY(INSET, FONT_SCALE.xxxLarge)).toBe(INSET + 60);
  });

  it.each([
    ['AX1', FONT_SCALE.ax1],
    ['AX5', FONT_SCALE.ax5],
  ])('at %s the bar is as tall as the Back button and the letter starts below it', (_n, scale) => {
    const back = backButtonHeight(scale);
    expect(topBarContentHeight(scale)).toBeGreaterThanOrEqual(back);
    expect(letterStartY(INSET, scale)).toBeGreaterThan(INSET + back);
    expect(letterStartY(INSET, scale)).toBe(topBarHeight(INSET, scale) + 8);
  });

  it('matches the audit at AX5: about 87 pt of button, so the old 52 pt bar was short by about 35 pt', () => {
    expect(backButtonHeight(FONT_SCALE.ax5)).toBe(88);
    expect(topBarContentHeight(FONT_SCALE.ax5) - 52).toBeGreaterThan(30);
  });

  it('only grows with text size', () => {
    const scales = [1, FONT_SCALE.xxxLarge, FONT_SCALE.ax1, FONT_SCALE.ax3, FONT_SCALE.ax5];
    const ys = scales.map((s) => letterStartY(INSET, s));
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });

  it('the screen uses these numbers for the bar and for where the letter starts', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'app', 'letter', '[id].tsx'), 'utf8');
    expect(src).toContain("from '@/lib/letter-top-bar.logic'");
    expect(src).toContain('topBarHeight(inset, fontScale)');
    expect(src).not.toMatch(/height: inset \+ 52/);
    expect(src).toContain('CARD_MODE ? letterStartY(insets.top, fontScale)');
    expect(src).toContain('paddingTop: pageTop');
    expect(src).toContain('const pageY = pageTop');
  });
});
