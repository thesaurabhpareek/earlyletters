/**
 * [BL-467 point 4] A line that a live region already carries is not also spoken by a direct announce on Android: the
 * two direct calls left in the app (the allow-list in speech-gate.test.ts) are skipped there. The planted case proves the
 * check fails on the unguarded form.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = (f: string) => readFileSync(join(__dirname, '..', 'src', f), 'utf8');
/** Every direct call is on a line that also says it is not Android. */
export function unguardedDirectCalls(text: string): string[] {
  return text.split('\n').filter((l) => /AccessibilityInfo\.announceForAccessibility\(/.test(l) && !/Platform\.OS !== 'android'/.test(l));
}

describe('[BL-467] no double announce on Android', () => {
  it('flags a planted direct call with no Android guard', () => {
    expect(unguardedDirectCalls("AccessibilityInfo.announceForAccessibility(note);")).toHaveLength(1);
    expect(unguardedDirectCalls("if (Platform.OS !== 'android') AccessibilityInfo.announceForAccessibility(note);")).toHaveLength(0);
  });

  it('plain-screen.tsx skips its direct announce on Android', () => {
    const text = src('components/resilience/plain-screen.tsx');
    expect(text).toMatch(/accessibilityLiveRegion="polite"/);
    expect(text).toMatch(/AccessibilityInfo\.announceForAccessibility\(/);
    expect(unguardedDirectCalls(text)).toEqual([]);
  });
});
