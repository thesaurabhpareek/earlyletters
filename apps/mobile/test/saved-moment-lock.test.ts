/// <reference types="node" />
/**
 * The saved moment's lock chip (S21). The lock icon sits beside text that already says what it means ("Kept private."),
 * so it is decorative: hidden from VoiceOver and TalkBack, and the chip is announced once, by its words (WRITING-GUIDE
 * section 10, "Decorative icons say nothing to a screen reader"). Read as source text; nothing here loads React Native.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(__dirname, '..', 'src/components/capture/saved-moment.tsx'), 'utf8');

describe('[S21] the lock on the saved chip is decorative', () => {
  it('the lock icon is wrapped in a view hidden from screen readers on both platforms', () => {
    expect(source).toMatch(
      /\{lock && \(\s*<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">\s*<LockSimpleIcon size=\{14\} color=\{c\.textMuted\} \/>\s*<\/View>\s*\)\}/,
    );
  });

  it('every lock icon in the file sits directly inside a hidden view, so none can be announced', () => {
    const parts = source.split('<LockSimpleIcon');
    expect(parts.length - 1).toBeGreaterThan(0);
    for (const before of parts.slice(0, -1)) {
      const tag = before.slice(before.lastIndexOf('<View'));
      expect(tag).toContain('accessibilityElementsHidden');
      expect(tag).toContain('importantForAccessibility="no-hide-descendants"');
      expect(before.slice(before.lastIndexOf('<View')).includes('</View>')).toBe(false);
    }
  });
});
