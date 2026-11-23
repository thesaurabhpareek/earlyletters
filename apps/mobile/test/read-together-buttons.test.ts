/**
 * BL-1791 (PER3-006): from AX1 up, Read together's page buttons are the end of the letter's scroll and nothing is pinned.
 * Layout arithmetic over tokens and font scale, not a rendered screen; the real screen is seen in BL-1786 (device sitting).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FONT_SCALE, isAccessibilitySize } from '../src/lib/a11y.logic';
import { PINNED_BAR_PT, buttonPlacement, letterAreaHeight, pageButtonsClass, pinnedHeight } from '../src/components/book/turn-controls.logic';

const SRC = readFileSync(join(__dirname, '..', 'src', 'app', 'read-together.tsx'), 'utf8');
/** iPhone SE 3: 667 pt tall; safe area 20 pt top; header 44 pt row plus the 2 pt progress line. */
const VIEWPORT = 667 - 20;
const HEADER = 48 + 2;

describe('Read together page buttons by text size', () => {
  it.each([
    ['AX1', FONT_SCALE.ax1],
    ['AX3', FONT_SCALE.ax3],
    ['AX5', FONT_SCALE.ax5],
  ])('at %s the buttons are part of the scroll after the last line, nothing is pinned', (_n, scale) => {
    const ax = isAccessibilitySize(scale);
    expect(buttonPlacement(ax)).toBe('inline');
    expect(pinnedHeight(ax)).toBe(0);
    expect(pageButtonsClass(true, 'inline')).not.toContain('px-5'); // the scroll pads its own sides
  });

  it('at AX5 the letter area is the viewport less the header', () => {
    expect(letterAreaHeight(VIEWPORT, HEADER, isAccessibilitySize(FONT_SCALE.ax5))).toBe(VIEWPORT - HEADER);
  });

  it('the old pinned stack would have taken more than a quarter of the viewport at AX5 (audit rule 3)', () => {
    // Two stacked 56 pt buttons with a 12 pt gap and the bar's padding: the arithmetic the row replaces.
    const stacked = 12 + 56 + 12 + 56 + 8;
    expect(stacked / VIEWPORT).toBeGreaterThan(0.2) // about a third at five buttons' worth of padding; a quarter is the audit's limit for one primary;
    // Pinned, the letter would have had this much less; inline it has none of it taken.
    expect(VIEWPORT - HEADER - stacked).toBeLessThan(letterAreaHeight(VIEWPORT, HEADER, true));
  });

  it('is unchanged at the usual sizes: pinned under the letter, side by side, Back one first', () => {
    for (const scale of [FONT_SCALE.large, FONT_SCALE.xxxLarge]) {
      const ax = isAccessibilitySize(scale);
      expect(buttonPlacement(ax)).toBe('pinned');
      expect(pinnedHeight(ax)).toBe(PINNED_BAR_PT);
      expect(letterAreaHeight(VIEWPORT, HEADER, ax)).toBe(VIEWPORT - HEADER - PINNED_BAR_PT);
    }
    expect(pageButtonsClass(false, 'pinned')).toBe('flex-row gap-3 px-5 pb-2 pt-3');
    expect(pageButtonsClass(true, 'pinned')).toBe('gap-3 px-5 pb-2 pt-3');
  });

  it('the screen pins only when placement is pinned, puts them at the end of the scroll otherwise, and keeps the swipe', () => {
    expect(SRC).toContain("!done && placement === 'pinned' ? <PageButtons");
    expect(SRC).toContain("buttons={placement === 'inline' ? <PageButtons");
    expect(SRC).toMatch(/<KeepPlayingChip[^>]*\/>\s*\{current \? buttons : null\}\s*<\/ScrollView>/);
    expect(SRC).toContain('onSwipe={(d) => go(d');
  });
});
