// Reference answer for eval task C6 (used only by --mode reference).
import { describe, expect, it } from 'vitest';
import { spokenSeparator } from '../src/components/capture/review-view.logic';

describe('spokenSeparator', () => {
  it('reads a spaced middle dot as a pause', () => {
    expect(spokenSeparator('To Asha · Month 7')).toBe('To Asha, Month 7');
  });
  it('handles more than one separator', () => {
    expect(spokenSeparator('To Asha · Month 7 · Week 2')).toBe('To Asha, Month 7, Week 2');
  });
  it('leaves a middle dot inside a name alone', () => {
    expect(spokenSeparator('To Marcel·la · Month 3')).toBe('To Marcel·la, Month 3');
  });
});
