import { describe, expect, it } from 'vitest';
import { ERROR_LINE_GLYPH_PT, errorLineA11y, errorLineAnnouncement, errorLineWords } from './error-line.logic';

describe('error line rules (extracted from the sign-in ErrorLine, F-17)', () => {
  it('draws nothing for a null, undefined or empty message', () => {
    for (const m of [null, undefined, '']) expect(errorLineWords(m)).toBeNull();
    expect(errorLineWords('Nothing has changed.')).toBe('Nothing has changed.');
  });
  it('is one element: the words are the label, a polite live region, never assertive', () => {
    const a = errorLineA11y('We could not save that. Nothing was lost.');
    expect(a).toEqual({ accessible: true, accessibilityLabel: 'We could not save that. Nothing was lost.', accessibilityLiveRegion: 'polite' });
    expect(JSON.stringify(a)).not.toContain('assertive');
  });
  it('announces the new words once when they change, and nothing when the line clears', () => {
    expect(errorLineAnnouncement('Try again in a moment.')).toBe('Try again in a moment.');
    expect(errorLineAnnouncement(null)).toBeNull();
    expect(errorLineAnnouncement('')).toBeNull();
  });
  it('the glyph is 20 pt, the size the sign-in line draws', () => {
    expect(ERROR_LINE_GLYPH_PT).toBe(20);
  });
});
