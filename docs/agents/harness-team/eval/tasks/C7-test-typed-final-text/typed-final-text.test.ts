// Reference answer for eval task C7 (used only by --mode reference).
import { describe, expect, it } from 'vitest';
import { typedFinalText } from '../src/components/capture/review-view.logic';

describe('typedFinalText keeps typed words exactly as typed', () => {
  it('trims the ends only', () => {
    expect(typedFinalText('  Asha slept.  ')).toBe('Asha slept.');
  });
  it('never swaps punctuation or spacing', () => {
    const typed = 'Asha’s first word — “mama”…  then a nap.';
    expect(typedFinalText(typed)).toBe(typed);
  });
});
