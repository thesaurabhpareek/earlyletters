/// <reference types="node" />
/**
 * Source guard for BL-420: four things that used to change a screen's height are now reserved or animated, and under
 * Reduce Motion they fade (MOTION 4: one fadeMs cross-fade, never a jump). Screens load React Native, so this reads
 * the source; the real shift is measured in the web run and on a device (J04-02, J06, J10-05, J02-04).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');
const write = src('app/write.tsx');
const letter = src('app/letter/[id].tsx');
const review = src('app/review.tsx');
const gate = src('components/gate/age-gate-screen.tsx');

describe('[BL-420] prompt swap on Write', () => {
  it('fades under Reduce Motion instead of swapping with no animation', () => {
    expect(write).not.toMatch(/const promptOut = motion\.reduced \? undefined/);
    expect(write).not.toMatch(/const promptIn = motion\.reduced \? undefined/);
  });
  it('the page field follows the prompt on a layout transition, so a taller prompt does not push it', () => {
    expect(write).toMatch(/<Animated\.View layout=\{promptLayout\}>\s*<TextField/);
  });
});

describe('[BL-420] Private chip on a letter', () => {
  it('its row is always laid out and only fades, so Make private pushes nothing down', () => {
    expect(letter).not.toMatch(/\{!entry\.inBook && \(\s*<View className="flex-row pt-1">/);
    expect(letter).toMatch(/<PrivateChipSlot shown=\{!entry\.inBook\}/);
    expect(letter).toMatch(/motion\.fade\(shown \? 1 : 0\)/);
    expect(letter).toMatch(/importantForAccessibility=\{shown \? 'auto' : 'no-hide-descendants'\}/);
  });
});

describe('[BL-420] first-time note on Review', () => {
  it('leaves with a fade (200 ms under Reduce Motion) and the sheet below closes up on its layout transition', () => {
    const note = review.slice(review.indexOf('{firstNote && phase'), review.indexOf('testID="review.firstNote"'));
    expect(note).toMatch(/exiting=\{/);
    expect(note).toMatch(/FadeOut\.duration\(motion\.reduced \? tokens\.motion\.fadeMs : tokens\.motion\.exitMs\)/);
  });
});

describe('[BL-420] stop screen way back', () => {
  it('its slot is always laid out and only fades in, so the heading does not move', () => {
    expect(gate).not.toMatch(/\{windowPassed \? \(/);
    expect(gate).toMatch(/pointerEvents=\{windowPassed \? 'auto' : 'none'\}/);
    expect(gate).toMatch(/accessibilityElementsHidden=\{!windowPassed\}/);
    expect(gate).toMatch(/motion\.fade\(windowPassed \? 1 : 0\)/);
  });
});
