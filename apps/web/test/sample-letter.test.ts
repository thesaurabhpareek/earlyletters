/** The film's letter must be honest: the review scene may only remove and repair (CLAUDE.md constitution). */
import { describe, expect, it } from 'vitest';
import { sampleLetter, type HeardSegment } from '../src/content/site';

const segments = sampleLetter.heard as readonly HeardSegment[];

describe('sample letter', () => {
  it('becomes exactly the final text when every edit is applied', () => {
    expect(segments.map((s) => s.becomes ?? s.text).join('')).toBe(sampleLetter.text);
  });

  it('only uses edits the constitution allows, and adds nothing', () => {
    for (const s of segments.filter((x) => x.becomes !== undefined)) {
      expect(['name', 'filler', 'false_start']).toContain(s.kind);
      if (s.kind === 'name') expect(s.becomes).toBe(sampleLetter.to);
      else expect(s.becomes).toBe('');
    }
  });
});
