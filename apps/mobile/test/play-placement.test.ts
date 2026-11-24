/**
 * BL-1789 (PER3-008, CDESO-1): from AX1 up, Play sits directly under the dateline, above any picture; the card-to-page
 * word travel falls back to the plain 200 ms hand-off; Read together puts Play, then its chip, under the dateline with
 * the page buttons still at the end of the scroll. Layout logic over font scale, not a rendered screen: no device claim
 * is made (D-172); the real screen is seen in BL-1786.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import { pageRestPlan } from '../src/components/book/book.logic';
import { FONT_SCALE } from '../src/lib/a11y.logic';
import { carriesWords, letterPageOrder, playUnderDateline, readTogetherOrder } from '../src/lib/play-placement.logic';

const AX = [
  ['AX1', FONT_SCALE.ax1],
  ['AX5', FONT_SCALE.ax5],
] as const;
const USUAL = [
  ['default', FONT_SCALE.large],
  ['xxxLarge', FONT_SCALE.xxxLarge],
] as const;

/** The plan the letter page asks for when the card's words could be carried (a card was measured, no Reduce Motion). */
const plan = (carried: boolean) =>
  pageRestPlan({ carried, holdMs: tokens.motion.cardToPage.holdMs, measureMs: 64, spring: tokens.motion.standard, travelPt: 120, withinPt: 4, fadeMs: tokens.motion.fadeMs });

describe('Play under the dateline', () => {
  it.each(USUAL)('is not used at %s', (_n, scale) => expect(playUnderDateline(scale)).toBe(false));
  it.each(AX)('is used at %s', (_n, scale) => expect(playUnderDateline(scale)).toBe(true));
});

describe('letter page order', () => {
  it.each(USUAL)('at %s is unchanged: dateline, picture, words, signature, Play', (_n, scale) => {
    const playFirst = playUnderDateline(scale);
    expect(letterPageOrder({ playFirst, hasPicture: true, spoken: true })).toEqual(['dateline', 'picture', 'words', 'signature', 'play']);
    expect(letterPageOrder({ playFirst, hasPicture: false, spoken: true })).toEqual(['dateline', 'words', 'signature', 'play']);
  });

  it.each(AX)('at %s with a picture: dateline, Play, picture, words', (_n, scale) => {
    expect(letterPageOrder({ playFirst: playUnderDateline(scale), hasPicture: true, spoken: true })).toEqual(['dateline', 'play', 'picture', 'words', 'signature']);
  });

  it.each(AX)('at %s without a picture: dateline, Play, words', (_n, scale) => {
    expect(letterPageOrder({ playFirst: playUnderDateline(scale), hasPicture: false, spoken: true })).toEqual(['dateline', 'play', 'words', 'signature']);
  });

  it.each(AX)('at %s a typed letter has no Play to move', (_n, scale) => {
    expect(letterPageOrder({ playFirst: playUnderDateline(scale), hasPicture: true, spoken: false })).toEqual(['dateline', 'picture', 'words', 'signature']);
  });

  it('the dateline is always first and Play is always before the words from AX1 up', () => {
    for (const [, scale] of AX) for (const hasPicture of [true, false]) {
      const o = letterPageOrder({ playFirst: playUnderDateline(scale), hasPicture, spoken: true });
      expect(o[0]).toBe('dateline');
      expect(o[1]).toBe('play');
      expect(o.indexOf('play')).toBeLessThan(o.indexOf('words'));
    }
  });
});

describe('card to page hand-off (CDESO-1)', () => {
  it.each(USUAL)('at %s without a picture the words still travel', (_n, scale) => {
    expect(carriesWords({ hasPicture: false, fontScale: scale })).toBe(true);
    expect(plan(carriesWords({ hasPicture: false, fontScale: scale })).showAtMs).toBeGreaterThan(0);
  });

  it.each(USUAL)('at %s with a picture it is the plain hand-off, as before', (_n, scale) => {
    expect(carriesWords({ hasPicture: true, fontScale: scale })).toBe(false);
  });

  it.each(AX)('at %s, with or without a picture, it is the plain hand-off', (_n, scale) => {
    for (const hasPicture of [true, false]) {
      const carry = carriesWords({ hasPicture, fontScale: scale });
      expect(carry).toBe(false);
      // The page's rest is not held for words that are not travelling: it is part of the page the 200 ms fade brings.
      expect(plan(carry)).toEqual(plan(false));
      expect(plan(carry).showAtMs).toBe(0);
    }
  });

  it('the plain hand-off uses the same fade as Reduce Motion', () => {
    expect(tokens.motion.fadeMs).toBe(200);
  });
});

describe('Read together order', () => {
  it.each(USUAL)('at %s is unchanged: dateline, words, signature, Play, Keep playing; buttons pinned, not in the scroll', (_n, scale) => {
    const o = readTogetherOrder({ playFirst: playUnderDateline(scale), spoken: true });
    expect(o).toEqual(['dateline', 'words', 'signature', 'play', 'keepPlaying']);
    expect(o).not.toContain('pageButtons');
  });

  it.each(AX)('at %s: dateline, Play, Keep playing, words, signature, then the page buttons at the end', (_n, scale) => {
    const o = readTogetherOrder({ playFirst: playUnderDateline(scale), spoken: true });
    expect(o).toEqual(['dateline', 'play', 'keepPlaying', 'words', 'signature', 'pageButtons']);
    expect(o[o.length - 1]).toBe('pageButtons');
    // The chip governs Play, so it stays directly under it.
    expect(o.indexOf('keepPlaying')).toBe(o.indexOf('play') + 1);
  });

  it.each(AX)('at %s a letter with no recording shows its note where Play would be', (_n, scale) => {
    expect(readTogetherOrder({ playFirst: playUnderDateline(scale), spoken: false })).toEqual(['dateline', 'noRecording', 'keepPlaying', 'words', 'signature', 'pageButtons']);
  });
});

describe('the screens apply the tables', () => {
  const read = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf8');
  it('the letter page uses carriesWords for both the plan and the opening, and draws Play once', () => {
    const src = read('app', 'letter', '[id].tsx');
    expect(src).toContain('carried: carriesWords({ hasPicture, fontScale })');
    expect(src).toContain('carry={carriesWords({ hasPicture, fontScale })}');
    expect(src).not.toMatch(/carry=\{!hasPicture\}/);
    expect(src).toContain('{spoken && !playFirst && <AudioPlayer');
  });
  it('Read together reads its order from the table', () => {
    expect(read('app', 'read-together.tsx')).toContain('readTogetherOrder(');
  });
});
