/**
 * [BL-467 point 4] The age gate's stop line sits in a live region, which Android reads, so its direct announce is
 * skipped there. The planted case proves the check fails on the unguarded form.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const unguarded = (text: string) => text.split('\n').filter((l) => /AccessibilityInfo\.announceForAccessibility\(/.test(l) && !/Platform\.OS !== 'android'/.test(l));

describe('[BL-467] the age gate does not announce twice on Android', () => {
  it('flags a planted direct call with no Android guard', () => {
    expect(unguarded('AccessibilityInfo.announceForAccessibility(x);')).toHaveLength(1);
  });

  it('skips its direct announce on Android', () => {
    const text = readFileSync(join(__dirname, '..', 'src', 'components/gate/age-gate-screen.tsx'), 'utf8');
    expect(text).toMatch(/accessibilityLiveRegion="polite"/);
    expect(text).toMatch(/AccessibilityInfo\.announceForAccessibility\(/);
    expect(unguarded(text)).toEqual([]);
  });
});
