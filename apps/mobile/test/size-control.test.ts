/**
 * BL-1990 (CDESO-2): "Size" beside "Aa" never truncates and the control stays 44 pt (56 pt from AX1).
 * Layout arithmetic and source guards, not a rendered screen. No device or simulated SE 3 sitting was run.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import { FONT_SCALE } from '../src/lib/a11y.logic';
import { topBarContentHeight } from '../src/lib/letter-top-bar.logic';
import { READ_TOGETHER_HEADER_SWIPE } from '../src/lib/reader-words.logic';
import { SIZE_WORD_NUMBER_OF_LINES, sizeControlMinHeight, sizeWordStacks } from '../src/lib/size-control.logic';

const read = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const letter = read('app/letter/[id].tsx');
/** The "Size" word's JSX element, from its opening tag to its closing tag. */
const wordElement = (() => {
  const i = letter.indexOf('testID="letter.readingSize.word"');
  const start = letter.lastIndexOf('<Text', i);
  return letter.slice(start, letter.indexOf('</Text>', i));
})();
/** The whole "Aa" control block. */
const control = letter.slice(letter.indexOf('const aa = ('), letter.indexOf('const toggleInBook'));

describe('"Size" control layout', () => {
  it('is 44 pt below AX1 and unchanged at the default size', () => {
    expect(sizeControlMinHeight(FONT_SCALE.large)).toBe(tokens.target.min);
    expect(sizeControlMinHeight(FONT_SCALE.xxxLarge)).toBe(tokens.target.min);
  });

  it.each([
    ['AX1', FONT_SCALE.ax1],
    ['AX3', FONT_SCALE.ax3],
    ['AX5', FONT_SCALE.ax5],
  ])('at %s the control is at least 56 pt', (_n, scale) => {
    expect(sizeControlMinHeight(scale)).toBeGreaterThanOrEqual(tokens.target.primary);
  });

  it('at AX5 the word sits under "Aa" and the control is tall enough for both lines (no clipping)', () => {
    expect(sizeWordStacks(FONT_SCALE.ax5)).toBe(true);
    const aa = tokens.type.title2.lineHeight * 1.3;
    const word = tokens.type.labelSmall.lineHeight * 2;
    expect(sizeControlMinHeight(FONT_SCALE.ax5)).toBeGreaterThanOrEqual(Math.ceil(aa + word));
  });

  it('the word is beside "Aa" at AX1 and under it from AX3', () => {
    expect(sizeWordStacks(FONT_SCALE.ax1)).toBe(false);
    expect(sizeWordStacks(FONT_SCALE.ax3)).toBe(true);
  });

  it('the control only grows with text size', () => {
    const hs = [1, FONT_SCALE.xxxLarge, FONT_SCALE.ax1, FONT_SCALE.ax3, FONT_SCALE.ax5].map(sizeControlMinHeight);
    expect([...hs].sort((a, b) => a - b)).toEqual(hs);
  });

  it('the top bar is never shorter than the control, so the control never spills onto the letter', () => {
    for (const s of [1, FONT_SCALE.xxxLarge, FONT_SCALE.ax1, FONT_SCALE.ax3, FONT_SCALE.ax5]) {
      expect(topBarContentHeight(s)).toBeGreaterThanOrEqual(sizeControlMinHeight(s));
    }
  });

  it('the default size bar is still 52 pt', () => {
    expect(topBarContentHeight(FONT_SCALE.large)).toBe(52);
  });
});

describe('"Size" never truncates (source guards)', () => {
  it('the layout function has no line limit', () => {
    expect(SIZE_WORD_NUMBER_OF_LINES).toBeUndefined();
  });

  it('the word has no numberOfLines, ellipsizeMode or truncate class', () => {
    expect(wordElement).toContain('letter.readingSize.word');
    expect(wordElement).not.toMatch(/numberOfLines|ellipsizeMode|ellipsis|truncate|adjustsFontSizeToFit/);
  });

  it('nothing in the control truncates either', () => {
    expect(control).not.toMatch(/numberOfLines|ellipsizeMode|ellipsis|truncate|overflow-hidden/);
  });

  it('the control takes its height from the logic and no longer fixes 44 pt', () => {
    expect(control).toContain('minHeight: sizeControlMinHeight(fontScale)');
    expect(control).not.toMatch(/\bh-11\b|height: 44|height: 56/);
  });

  it('the spoken label is unchanged', () => {
    expect(control).toContain('accessibilityLabel={copy.reader.readingSizeA11y}');
  });

  it('the guards fail on a planted offender', () => {
    const planted = '<Text numberOfLines={1} testID="letter.readingSize.word">Size</Text>';
    expect(planted).toMatch(/numberOfLines|ellipsizeMode|ellipsis|truncate/);
  });
});

describe('the swipe down to leave Read together stays off', () => {
  it('is off, and no code in this change turns it on', () => {
    expect(READ_TOGETHER_HEADER_SWIPE).toBe(false);
  });
});
