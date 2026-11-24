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

  it('a changed address is not a pause end: typing a different address must not pull focus into the code field', () => {
    expect(shouldAnnouncePauseEnd(true, false, 'a@example.com', 'b@example.com')).toBe(false);
    expect(shouldAnnouncePauseEnd(true, false, 'a@example.com', 'a@example.com')).toBe(true);
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
    expect(codeStep).toMatch(/shouldAnnouncePauseEnd\(wasPaused\.current, paused, wasAddress\.current, address\)/);
    expect(codeStep).toMatch(/announce\(k\.pauseEnded, \{ queue: true \}\)/);
    expect(codeStep).toMatch(/setNote\(k\.pauseEnded\)/);
    expect(codeStep).toMatch(/field\.current\?\.focus\(\)/);
    // The note is drawn in a polite live region (the existing note line), so Android, where announce() does nothing, reads it.
    expect(codeStep).toMatch(/accessibilityLiveRegion="polite"[^>]*>\s*\{note\}/);
    // Focus is requested from the pause-end effect, not only after a wrong code.
    const effect = codeStep.slice(codeStep.indexOf('shouldAnnouncePauseEnd(wasPaused'), codeStep.indexOf('const verify'));
    expect(effect).toMatch(/focus\(\)/);
  });

  it('[LEGAL-REQ-051] J22j, the clock path, checks the line and the focus after the pause ends', () => {
    const flow = readFileSync(join(__dirname, '..', 'e2e-web', 'j22-sign-in.flow.ts'), 'utf8');
    const j22j = flow.slice(flow.indexOf('[J22j]'), flow.indexOf('[J22k]'));
    expect(j22j).toContain(`getByText(${JSON.stringify(authCopy.code.pauseEnded).replace(/"/g, "'")}`);
    expect(j22j).toMatch(/getByLabel\('Code', \{ exact: true \}\)[^;]*\.toBeFocused\(\)/);
  });
});
