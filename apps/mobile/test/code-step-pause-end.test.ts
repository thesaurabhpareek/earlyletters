/**
 * BL-476 point 1, LEGAL-REQ-051 (accessibility): when the wrong-code pause ends on the sign-in code step, the person is told
 * once, calmly and without a count, and focus moves to the code field. Before this, the paused line (the live region) went
 * and nothing was spoken, and focus stayed where it was. Source pins for the screen (React Native is not rendered in Node)
 * and a unit test for the pure rule that decides "this render is the end".
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authCopy } from '@scribe/content';
import { codeEntryPause, shouldAnnouncePauseEnd } from '../src/lib/auth/errors.logic';

const codeStep = readFileSync(join(__dirname, '..', 'src', 'app', '(auth)', 'sign-in', 'code.tsx'), 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

describe('[BL-476 point 1, LEGAL-REQ-051] the end of the code pause is said and the field gets focus', () => {
  it('the rule fires only on the change from paused to not paused, never on arrival', () => {
    expect(shouldAnnouncePauseEnd(true, false)).toBe(true);
    expect(shouldAnnouncePauseEnd(false, false)).toBe(false);
    expect(shouldAnnouncePauseEnd(false, true)).toBe(false);
    expect(shouldAnnouncePauseEnd(true, true)).toBe(false);
  });

  it('the rule agrees with the clock: five wrong codes pause, and the render after the end is the change', () => {
    const t0 = 1_000_000;
    const wrong = [t0, t0 + 1, t0 + 2, t0 + 3, t0 + 4];
    const during = codeEntryPause(wrong, t0 + 10).paused;
    const after = codeEntryPause(wrong, t0 + 4 + 15 * 60_000 + 50).paused;
    expect([during, after]).toEqual([true, false]);
    expect(shouldAnnouncePauseEnd(during, after)).toBe(true);
  });

  it('has a calm line with no count, no clock and no dash', () => {
    const line = (authCopy.code as Record<string, string>).pauseEnded;
    expect(typeof line).toBe('string');
    expect(line).not.toMatch(/\d|minute|second|wait|sorry|too many|locked/i);
    expect(line).not.toMatch(/[–—…‘’“”]/);
  });

  it('the screen announces the line, shows it in a polite live region (Android), and focuses the field', () => {
    expect(codeStep).toMatch(/shouldAnnouncePauseEnd\(wasPaused\.current, paused\)/);
    expect(codeStep).toMatch(/announce\(k\.pauseEnded\)/);
    expect(codeStep).toMatch(/setNote\(k\.pauseEnded\)/);
    expect(codeStep).toMatch(/field\.current\?\.focus\(\)/);
    // The note is drawn in a polite live region (the existing note line), so Android, where announce() does nothing, reads it.
    expect(codeStep).toMatch(/accessibilityLiveRegion="polite"[^>]*>\s*\{note\}/);
    // Focus is requested from the pause-end effect, not only after a wrong code.
    const effect = codeStep.slice(codeStep.indexOf('shouldAnnouncePauseEnd(wasPaused'), codeStep.indexOf('const verify'));
    expect(effect).toMatch(/focus\(\)/);
  });
});
