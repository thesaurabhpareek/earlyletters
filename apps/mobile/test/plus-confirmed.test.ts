/**
 * [BL-1722] The purchase-confirmed screen: focus on arrival, Done in view at the largest text, one plain line when
 * Save a copy cannot open. The layout test is arithmetic over tokens and font scale (confirmed.logic.ts), not a
 * rendered screen; the on-device check is BL-1786. The screen-wiring checks are source scans, like test/a11y-ax5.test.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { billingCopy } from '@scribe/content';
import { describe, expect, it } from 'vitest';
import { doneBarHeight, doneInView, saveCopyLine } from '../src/lib/billing/confirmed.logic';
import { FONT_SCALE } from '../src/lib/a11y.logic';

const screen = readFileSync(join(__dirname, '..', 'src', 'app', 'plus', 'confirmed.tsx'), 'utf8');
const SE3_HEIGHT = 667; // iPhone SE 3 window height in pt: arithmetic only, not a device run

describe('[BL-1722] arrival', () => {
  it('moves screen-reader focus to the title once, on arrival', () => {
    expect(screen).toMatch(/useFocusOnMount\(heading\)/);
    expect(screen).toMatch(/<Text ref=\{heading\} role="heading" variant="title1">/);
  });
});

describe('[BL-1722] Done stays in view', () => {
  it('Done sits outside the scroll, in its own bar, at every size', () => {
    const scrollEnd = screen.indexOf('</ScrollView>');
    expect(scrollEnd).toBeGreaterThan(0);
    expect(screen.indexOf('plusConfirmed.done"')).toBeGreaterThan(scrollEnd);
  });

  it('the bar leaves the terms three quarters of the window from default to AX5 on an SE-height window', () => {
    for (const fs of [1, FONT_SCALE.xxxLarge, FONT_SCALE.ax1, FONT_SCALE.ax3, FONT_SCALE.ax5]) {
      expect(doneInView(fs, SE3_HEIGHT), `font scale ${fs}`).toBe(true);
    }
    expect(doneBarHeight(FONT_SCALE.ax5)).toBeGreaterThan(doneBarHeight(1));
    // The check can fail: a window too short for the bar at AX5.
    expect(doneInView(FONT_SCALE.ax5, 400)).toBe(false);
  });
});

describe('[BL-1722] Save a copy that cannot open', () => {
  const words = billingCopy.confirmation;
  it('says one plain line, with no fear or loss in it', () => {
    expect(saveCopyLine('failed', words)).toBe(words.saveCopyFailed);
    expect(words.saveCopyFailed).toBe('The copy could not be saved just now. The same terms are in Settings, Plan.');
  });
  it('says nothing when the share sheet opened', () => {
    expect(saveCopyLine('shared', words)).toBeNull();
  });
  it('the screen shows the line in a live region and speaks it, and clears it on the next try', () => {
    expect(screen).toMatch(/saveCopyLine\('failed', c\)/);
    expect(screen).toMatch(/announce\(line\)/);
    expect(screen).toMatch(/setSaveLine\(null\);\n\s+try \{/);
    expect(screen).toMatch(/accessibilityLiveRegion="polite" testID="plusConfirmed\.saveFailed"/);
  });
});
