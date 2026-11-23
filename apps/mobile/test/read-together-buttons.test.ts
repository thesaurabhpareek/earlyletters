/**
 * BL-1791 (PER3-006): from AX1 up, Read together's page buttons are the end of the letter's scroll and nothing is pinned.
 * Layout arithmetic over tokens and font scale, not a rendered screen; the real screen is seen in BL-1786 (device sitting).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokens } from '@scribe/design-tokens';
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

  it('at AX5 the letter area is the viewport less the header: nothing is pinned under it', () => {
    expect(letterAreaHeight(VIEWPORT, HEADER, isAccessibilitySize(FONT_SCALE.ax5))).toBe(VIEWPORT - HEADER);
    // The screen draws no pinned bar at accessibility sizes: the pinned render is guarded by placement === 'pinned'.
    expect(SRC).toContain("!done && placement === 'pinned' ? <PageButtons");
    expect(SRC).not.toMatch(/\{!done \? <PageButtons/);
  });

  it('a pinned stack of two lg buttons takes over a quarter of the viewport from AX3 (audit rule 3), so from AX1 they are in the scroll', () => {
    // lg button: 56 pt minimum, label line (token line height times font scale) plus 12 pt padding top and bottom; gap 12, bar padding 12 and 8.
    const pinnedShare = (scale: number) => (12 + 2 * Math.max(tokens.target.primary, tokens.type.label.lineHeight * scale + 24) + 12 + 8) / VIEWPORT;
    expect(pinnedShare(FONT_SCALE.large)).toBeLessThan(0.25);
    expect(pinnedShare(FONT_SCALE.ax1)).toBeGreaterThan(0.2); // about 0.24: just under, and the letter is left one or two lines
    expect(pinnedShare(FONT_SCALE.ax3)).toBeGreaterThan(0.25);
    expect(pinnedShare(FONT_SCALE.ax5)).toBeGreaterThan(0.3);
    // The buttons are rendered by the LetterPage's ScrollView, after its last element, only on the page showing.
    const scroll = SRC.slice(SRC.indexOf('<ScrollView className="flex-1"'), SRC.indexOf('</ScrollView>'));
    expect(scroll).toContain('{current ? buttons : null}');
    expect(scroll.indexOf('<KeepPlayingChip')).toBeLessThan(scroll.indexOf('{current ? buttons : null}'));
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
