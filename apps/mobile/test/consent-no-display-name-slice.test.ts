/**
 * BL-1563: `saveDisplayName` cut the name with `slice(0, 60)`, which counts UTF-16 units and can split an emoji or a
 * Devanagari cluster, while the server CHECK counts code points. Nothing called it, so it was deleted. This keeps it
 * from coming back in the same shape: the consent module exports no display-name writer, and if one is ever added it must
 * cut with `clampText` (whole characters), never `slice`. Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { clampText } from '@scribe/core';

vi.mock('react-native', () => ({ Platform: { OS: 'ios', Version: '17.4' } }));
vi.mock('expo-application', () => ({ nativeBuildVersion: '42' }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
vi.mock('../src/lib/supabase/client', () => ({ idempotencyKey: () => '0199a5b0-0000-7000-8000-00000000c001' }));

const mod = await import('../src/lib/auth/consent');
const source = readFileSync(new URL('../src/lib/auth/consent.ts', import.meta.url), 'utf8');

describe('BL-1563: no UTF-16 cut of the display name in the consent module', () => {
  it('exports no saveDisplayName (it had no caller)', () => {
    expect(Object.keys(mod)).not.toContain('saveDisplayName');
    expect(source).not.toContain('saveDisplayName');
  });

  it('never writes display_name with a slice', () => {
    for (const line of source.split('\n').filter((l) => l.includes('display_name'))) expect(line).not.toMatch(/\.slice\(/);
  });

  it('the helper a future writer must use keeps whole characters: 59 letters then a family emoji, at most 60 code points', () => {
    const family = '\u{1F469}‍\u{1F467}'; // woman, ZWJ, girl: one family emoji, 5 UTF-16 units
    const name = 'a'.repeat(59) + family;
    const cut = clampText(name, 60);
    expect([...cut].length).toBeLessThanOrEqual(60);
    expect(cut).not.toMatch(/[\uD800-\uDBFF]$/); // no lone high surrogate
    expect(cut).not.toMatch(/‍$/); // no dangling joiner
  });
});
