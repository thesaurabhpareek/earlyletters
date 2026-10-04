import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';
import { ANCHORS, STOPS, breathKeyframes, lampOpacity, shouldBreathe } from '../src/components/ui/lamp.logic';

describe('Lamp values', () => {
  it('peak opacity comes from tokens: a whisper on light paper, warmer on dark, clamped to 0..1', () => {
    expect(lampOpacity('light')).toBe(tokens.atmosphere.peak.light);
    expect(lampOpacity('dark')).toBe(tokens.atmosphere.peak.dark);
    expect(lampOpacity('dark', 9)).toBe(tokens.atmosphere.peak.dark);
    expect(lampOpacity('dark', -1)).toBe(0);
    expect(lampOpacity('dark', NaN)).toBe(0);
    expect(lampOpacity('light', 0.5)).toBeCloseTo(tokens.atmosphere.peak.light / 2);
  });

  it('draws nothing under Increase Contrast', () => {
    expect(lampOpacity('light', 1, true)).toBe(0);
    expect(lampOpacity('dark', 1, true)).toBe(0);
  });

  it('breathing is opacity only, from rest to a shallow dip, never a flash', () => {
    const k = breathKeyframes();
    expect(Object.keys(k.from)).toEqual(['opacity']);
    expect(Object.keys(k.to)).toEqual(['opacity']);
    expect(k.from.opacity).toBe(1);
    expect(k.to.opacity).toBe(tokens.motion.lamp.breathOpacityMin);
    expect(1 - k.to.opacity).toBeLessThanOrEqual(0.15);
  });

  it('only breathes when visible, the app is active, the screen is focused and Reduce Motion is off', () => {
    const on = { reduced: false, appActive: true, focused: true, visible: true };
    expect(shouldBreathe(on)).toBe(true);
    expect(shouldBreathe({ ...on, reduced: true })).toBe(false);
    expect(shouldBreathe({ ...on, appActive: false })).toBe(false);
    expect(shouldBreathe({ ...on, focused: false })).toBe(false);
    expect(shouldBreathe({ ...on, visible: false })).toBe(false);
  });

  it('the gradient fades to nothing at its edge, so no hard edge ever shows', () => {
    expect(STOPS[0].opacity).toBe(1);
    expect(STOPS[STOPS.length - 1].opacity).toBe(0);
    for (let i = 1; i < STOPS.length; i++) expect(STOPS[i].opacity).toBeLessThan(STOPS[i - 1].opacity);
    expect(ANCHORS.top.cy).toBe(0);
  });
});

/** Walk src/app for the files that mount <Lamp /> or <QuotePair />. */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.tsx$/.test(n) ? [p] : [];
  });
}
const SRC = join(__dirname, '..', 'src');
const uses = (tag: string) =>
  files(join(SRC, 'app'))
    .filter((f) => new RegExp(`<${tag}[\\s/>]`).test(readFileSync(f, 'utf8')))
    .map((f) => relative(join(SRC, 'app'), f).split('\\').join('/'))
    .sort();

describe('where the lamp may shine', () => {
  it('is mounted on welcome (onboarding), Tonight and Book only', () => {
    expect(uses('Lamp')).toEqual(['(tabs)/book.tsx', '(tabs)/index.tsx', 'onboarding.tsx']);
  });

  it('never on a screen that records or plays a voice (MOTION principle 1)', () => {
    for (const f of ['listen.tsx', 'write.tsx', 'review.tsx', 'read-together.tsx', 'letter/[id].tsx']) {
      expect(readFileSync(join(SRC, 'app', f), 'utf8'), f).not.toMatch(/<Lamp[\s/>]/);
    }
  });

  it('the quotation pair leads welcome and the empty Book, and sits on no other screen file', () => {
    expect(uses('QuotePair')).toEqual(['onboarding.tsx']);
    expect(readFileSync(join(SRC, 'app', '(tabs)', 'book.tsx'), 'utf8')).toMatch(/<EmptyState\s+device/);
  });
});
