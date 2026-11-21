/// <reference types="node" />
/**
 * The saved moment's lock chip (S21). The lock icon sits beside text that already says what it means ("Kept private."),
 * so it is decorative: hidden from VoiceOver and TalkBack, and the chip is announced once, by its words (WRITING-GUIDE
 * section 8, "Decorative icons say nothing to a screen reader"). Read as source text; nothing here loads React Native.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { momentAnnouncement, savedMoment } from '../src/components/capture/review-view.logic';

const source = readFileSync(join(__dirname, '..', 'src/components/capture/saved-moment.tsx'), 'utf8');

describe('[S21] the lock on the saved chip is decorative', () => {
  it('the lock icon is wrapped in a view hidden from screen readers on both platforms', () => {
    expect(source).toMatch(
      /\{lock && \(\s*<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">\s*<LockSimpleIcon size=\{14\} color=\{c\.textMuted\} \/>\s*<\/View>\s*\)\}/,
    );
  });

  it('the icon is not rendered anywhere else in the file, so no second announcement can come from it', () => {
    expect(source.match(/<LockSimpleIcon/g)).toHaveLength(1);
  });

  it('the announcement for a lock chip is its words alone', () => {
    const m = savedMoment({ kind: 'private', childName: 'Asha', month: 7 });
    expect(m.lock).toBe(true);
    expect(momentAnnouncement(m.chip, m.line)).toBe(m.chip);
  });
});
