/**
 * BL-1823 (PER3-014, PER3-015, PER3-017): "Size" beside "Aa" at accessibility sizes, "Done reading" at the end of Read
 * together, "Earlier letter" beside "Next letter", and a swipe down to leave Read together. The words come from the
 * content keys, never literals in the screens. Source and logic only; the real screens are seen at the BL-1786 sitting.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '@scribe/content';
import { describe, expect, it } from 'vitest';
import { FONT_SCALE } from '../src/lib/a11y.logic';
import { LEAVE_SWIPE_PT, READ_TOGETHER_HEADER_SWIPE, SIZE_WORD_MAX_SCALE, showsSizeWord, swipeLeaves } from '../src/lib/reader-words.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const letter = src('app/letter/[id].tsx');
const code = (t: string) => t.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const together = code(src('app/read-together.tsx'));

describe('the three small words', () => {
  it('the words are these, in content', () => {
    expect(en.reader.readingSizeButton).toBe('Aa');
    expect(en.reader.readingSizeWord).toBe('Size');
    expect(en.readTogether.finishButton).toBe('Done reading');
    expect(en.readTogether.previousButton).toBe('Earlier letter');
    expect(en.readTogether.nextButton).toBe('Next letter');
  });

  it('"Size" shows beside "Aa" from AX1 up and not below', () => {
    expect(showsSizeWord(FONT_SCALE.large)).toBe(false);
    expect(showsSizeWord(FONT_SCALE.xxxLarge)).toBe(false);
    expect(showsSizeWord(FONT_SCALE.ax1)).toBe(true);
    expect(showsSizeWord(FONT_SCALE.ax5)).toBe(true);
  });

  it('the letter page draws "Aa" and then "Size" from the content keys, in one button', () => {
    const aa = letter.indexOf('{copy.reader.readingSizeButton}');
    const size = letter.indexOf('{copy.reader.readingSizeWord}');
    expect(aa).toBeGreaterThan(0);
    expect(size).toBeGreaterThan(aa);
    expect(letter).toContain('showsSizeWord(fontScale)');
    expect(letter).not.toMatch(/>\s*Size\s*</);
  });

  it('Read together uses the content keys for "Earlier letter", "Next letter" and "Done reading", never literals', () => {
    expect(together).toContain('label={rt.previousButton}');
    expect(together).toContain('label={rt.nextButton}');
    expect(together).toContain('label={rt.finishButton}');
    for (const w of ['Earlier letter', 'Next letter', 'Done reading', 'Close the book', 'Back one']) expect(together).not.toContain(`"${w}"`);
  });

  it('"Size" is capped so it fits a 320 pt bar at AX5', () => {
    expect(SIZE_WORD_MAX_SCALE).toBeLessThanOrEqual(2);
    expect(letter).toContain('maxFontSizeMultiplier={SIZE_WORD_MAX_SCALE}');
  });

  it('the header swipe is off until a device shows it cannot pop twice on the native modal, and leaves only once', () => {
    expect(READ_TOGETHER_HEADER_SWIPE).toBe(false);
    expect(together).toContain('.enabled(READ_TOGETHER_HEADER_SWIPE)');
    expect(together).toContain('if (left.current) return;');
  });

  it('the swipe rule, for when it is on: a swipe down on the top bar leaves Read together; a small or sideways drag does not', () => {
    expect(swipeLeaves(LEAVE_SWIPE_PT + 1, 0)).toBe(true);
    expect(swipeLeaves(10, 900)).toBe(true);
    expect(swipeLeaves(LEAVE_SWIPE_PT, 100)).toBe(false);
    expect(together).toMatch(/<SwipeDownToLeave onLeave=\{close\}>[\s\S]*<ModalHeader onClose=\{close\} \/>/);
  });
});
