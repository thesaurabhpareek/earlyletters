import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';
import { LAMP_DEFAULTS, WASH_PEAK, blend, contrast, washOpacity, type LampTone } from '../src/components/ui/lamp-wash.logic';

const tones = Object.keys(LAMP_DEFAULTS) as LampTone[];
const L = tokens.light;

describe('LampWash', () => {
  it('light mode is fainter than dark mode, and intensity is clamped to 0..1', () => {
    expect(WASH_PEAK.light).toBeLessThan(WASH_PEAK.dark);
    expect(washOpacity('light', 5)).toBe(WASH_PEAK.light);
    expect(washOpacity('dark', -1)).toBe(0);
    expect(washOpacity('dark', NaN)).toBe(0);
  });

  it.each(tones)('light %s wash at full intensity keeps every text pair at 4.5:1', (tone) => {
    for (const base of [L.bg, L.surface, L.surfaceRaised]) {
      const lit = blend(LAMP_DEFAULTS[tone], base, WASH_PEAK.light);
      for (const fg of [L.text, L.textMuted, L.accent]) {
        expect(contrast(fg, lit)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
