import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every section of the home page carries the scroll effect hooks. A section written as a bare <section> would be a
 * plain scroll between the pinned scenes, which is what the later pages used to be. New sections go through
 * PinScene (or HeroStage, Evening, ProofScene), the one mechanism in components/landing/scrub.tsx.
 */
const dir = join(__dirname, '../src/components/landing');
const landing = readFileSync(join(dir, 'Landing.tsx'), 'utf8');

describe('home page scroll effects', () => {
  it('has no bare <section> in the page: each one is a scene with the effect built in', () => {
    expect(landing.match(/<section\b/g) ?? []).toEqual([]);
  });

  it('opens with the hero and the first scenes, then the pinned scenes for the rest, in order', () => {
    const order = [...landing.matchAll(/<(HeroStage|Evening|ProofScene|PinScene)\b/g)].map((m) => m[1]);
    expect(order).toEqual(['HeroStage', 'Evening', 'PinScene', 'ProofScene', 'PinScene', 'PinScene', 'PinScene', 'PinScene', 'PinScene', 'PinScene']);
  });

  it('lets only the last scene stay on screen, and only it shows on focus', () => {
    expect(landing.match(/exit=\{false\}/g)).toHaveLength(1);
    expect(landing.match(/showOnFocus/g)).toHaveLength(1);
    expect(landing).toMatch(/id="early-access"[^>]*exit=\{false\}/);
  });

  it('builds the scene frame on usePin and the shared Rise and FillText, not a second mechanism', () => {
    const pin = readFileSync(join(dir, 'PinScene.tsx'), 'utf8');
    expect(pin).toMatch(/usePin\(/);
    expect(pin).toMatch(/<Rise\b/);
    expect(pin).toMatch(/<FillText\b/);
    expect(pin).not.toMatch(/useScroll|useSpring|IntersectionObserver/);
  });
});
