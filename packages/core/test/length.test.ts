// BL-957: one length rule for typed words (NS-01-R54, NS-06-A, NS-16-R1 and R6). Graphemes are the limit; the database ceiling stays in code points.
import { describe, expect, it } from 'vitest';
import { CODE_POINTS_PER_GRAPHEME, checkChildName, checkSignsAs, clampGraphemes, clampText, codePointCeiling, SIGNS_AS_MAX, fitsGraphemes, graphemeLength, graphemes, graphemesByRule, textLength } from '../src';

// Each entry is one character a person sees. Devanagari and Arabic ones are several code points; CJK is one.
const FIXTURES: Record<string, string[]> = {
  devanagari: ['क्ष', 'त्रि', 'ज्ञा', 'स्वा', 'ह', 'म', 'न्दी', 'श्री'],
  arabic: ['مُ', 'حَ', 'مَّ', 'د', 'سِ', 'ر', 'ي'],
  cjk: ['明', '日', '本', '語', '子', '愛', 'こ', 'ん'],
};
// The limits the launch scripts name: photo words 140, place 60, Firsts label 40, name 60, From name 30.
const LIMITS = [30, 40, 60, 140];

// A small seeded generator, so a failure repeats.
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const make = (alphabet: string[], n: number, next: () => number) => Array.from({ length: n }, () => alphabet[Math.floor(next() * alphabet.length)]).join('');

describe('one length rule (BL-957)', () => {
  for (const [script, alphabet] of Object.entries(FIXTURES)) {
    for (const max of LIMITS) {
      it(`${script}: ${max} characters fit, one more is cut, on both engines`, () => {
        const next = rng(max * 31 + script.length);
        for (let i = 0; i < 25; i++) {
          const atLimit = make(alphabet, max, next);
          const over = atLimit + alphabet[Math.floor(next() * alphabet.length)];
          expect(graphemeLength(atLimit)).toBe(max);
          expect(graphemesByRule(atLimit).length).toBe(max);
          expect(fitsGraphemes(atLimit, max)).toBe(true);
          expect(clampGraphemes(atLimit, max)).toBe(atLimit);
          expect(fitsGraphemes(over, max)).toBe(false);
          expect(clampGraphemes(over, max)).toBe(atLimit);
          // the database ceiling, in code points, is never the thing that refuses a full field
          expect(Array.from(atLimit).length).toBeLessThanOrEqual(codePointCeiling(max));
          // the cut never splits a character: what is kept is a whole prefix
          expect(over.startsWith(clampGraphemes(over, max))).toBe(true);
        }
      });
    }
  }

  it('a field the server also checks is cut by the smaller of the two limits (children.name 60, signs_as 30, in code points)', () => {
    const name = 'क्षत्रिय'.repeat(10); // 30 characters, 80 code points: the server would refuse it
    const kept = clampText(name, SIGNS_AS_MAX);
    expect(Array.from(kept).length).toBeLessThanOrEqual(30);
    expect(name.startsWith(kept)).toBe(true);
    expect(graphemesByRule(kept).length).toBe(graphemes(kept).length);
    expect(checkSignsAs(name)).toEqual({ ok: false, reason: 'tooLong' });
    expect(checkChildName('क्षत्रिय'.repeat(7))).toMatchObject({ ok: true }); // 56 code points
    expect(checkChildName('क्षत्रिय'.repeat(8))).toEqual({ ok: false, reason: 'tooLong' }); // 64
  });

  it('a ZWJ family that would be split at the limit is dropped whole, never cut', () => {
    const family = '👩‍👧'; // 3 code points, one character
    expect(clampGraphemes('x'.repeat(28) + family, 30, 30)).toBe('x'.repeat(28));
    expect(clampGraphemes('x'.repeat(27) + family, 30, 30)).toBe('x'.repeat(27) + family);
    expect(clampText('x'.repeat(58) + family, 60)).toBe('x'.repeat(58));
  });

  it('a character with a stack of marks past the ceiling stops the cut before the database would refuse it', () => {
    const stack = 'q' +'́'.repeat(CODE_POINTS_PER_GRAPHEME); // 17 code points, one character
    expect(graphemes(stack)).toHaveLength(1);
    expect(clampGraphemes(stack, 1)).toBe('');
    expect(fitsGraphemes(stack, 1)).toBe(false);
  });

  it('keeps emoji, ZWJ families, skin tones and flags whole', () => {
    expect(graphemesByRule('a👩‍👧b👍🏽🇮🇳')).toEqual(['a', '👩‍👧', 'b', '👍🏽', '🇮🇳']);
    expect(clampGraphemes('x'.repeat(58) + '👩‍👧👩‍👧', 60)).toBe('x'.repeat(58) + '👩‍👧' + '👩‍👧');
    expect(clampGraphemes('y'.repeat(59) + '😀😀', 60)).toBe('y'.repeat(59) + '😀');
  });
});
