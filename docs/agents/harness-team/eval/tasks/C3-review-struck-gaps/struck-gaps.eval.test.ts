/**
 * Eval check for task C3 (replays PR #298). Behaviour only: the two behavioural cases of the real PR's
 * review-critics.test.ts, without its source-text regexes, so any correct implementation passes.
 * Fictional family only ("Asha").
 */
import { faithfulClean, segments as toSegments } from '@scribe/core';
import { describe, expect, it } from 'vitest';
import { rowShows } from '../src/components/capture/review-view.logic';
import { struckGaps } from '../src/components/capture/transcript.logic';

describe('eval C3: struckGaps', () => {
  it('no space goes in front of a closing mark', () => {
    const shown = (raw: string) => {
      const r = faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en' } as never);
      const segs = toSegments(raw, r.applied);
      return segs
        .map((seg, i) => {
          if (seg.edit === null) return seg.text;
          const shows = rowShows(r.applied[seg.edit]);
          if (seg.text || shows.kind !== 'struck') return seg.text;
          const [before, after] = struckGaps(segs[i - 1]?.text, shows.text, segs[i + 1]?.text);
          return `${before}[${shows.text}]${after}`;
        })
        .join('');
    };
    expect(shown('Today you held the spoon, um.')).toBe('Today you held the spoon[, um].');
    expect(shown('You laughed, uh, and then um.')).toBe('You laughed, [uh,] and then [um].');
    expect(shown('Asha, um, today you held the spoon.')).toBe('Asha, [um,] today you held the spoon.');
    expect(shown('Um, you slept.')).toBe('[Um,] you slept.');
  });

  it('a space only between two words, never before a closing mark, never doubled', () => {
    expect(struckGaps('spoon', ', um', '.')).toEqual(['', '']);
    expect(struckGaps('and then', 'um', '.')).toEqual([' ', '']);
    expect(struckGaps('Asha, ', 'um,', 'today')).toEqual(['', ' ']);
    expect(struckGaps('you', 'you', 'held')).toEqual([' ', ' ']);
    expect(struckGaps(undefined, 'Um,', 'you')).toEqual(['', ' ']);
    expect(struckGaps('slept', 'um', undefined)).toEqual([' ', '']);
    for (const mark of [',', '.', ';', ':', '!', '?', ')', ']']) expect(struckGaps('spoon', 'um', `${mark} then`)[1], mark).toBe('');
    expect(struckGaps('spoon', 'um', '"Mama," you said')[1]).toBe(' ');
  });
});
