/**
 * [BL-390] Where recordings live is said the same way wherever a parent reads it (D-033, D-085, D-100; LEGAL-REQ-044).
 *
 * The three in-app places are the first-run promise screen (onboarding.promise.recordingBody), Settings, Where your
 * letters live (whereLive.onPhone and onPhoneSynced; it replaced the Recordings card) and the letter page
 * (book.recordingOnPhone, appended to the provenance line and the Book card label). Their wording differs today by
 * ruling (lawyer-2 H4 for first run, CCO-8 and the 8 Nov CTO ruling for Where your letters live), so this test pins
 * the one fact they must share, not one sentence: recordings are kept on this phone, never "only", never "stay",
 * and no backup of ours. Whether backup is claimed against the build flag is claims-capabilities.test.ts's job.
 */
import { describe, expect, it } from 'vitest';
import { en, storeListing } from '../src';
import { site as webSite } from '../../../apps/web/src/content/site';
import { leaves } from './support/copy-surfaces';

/** The always-shown lines that say where a recording is kept, by place. */
const PLACES = {
  promiseScreen: [en.onboarding.promise.recordingBody],
  whereYourLettersLive: [en.whereLive.onPhone, en.whereLive.onPhoneSynced],
  letterPage: [en.book.recordingOnPhone],
} as const;

const KEPT_ON_THIS_PHONE = /\bkept on this (?:i)?phone\b/i;
/** "Only on this phone" and "stays on this phone" turn false the day backup is on (in-app-disclosures rule 2). */
const NOT_TRUE_WITH_BACKUP = /\bonly\b|\bstays?\b/i;
/** Our own backup or iCloud. The person's own iPhone backup is theirs and true in every build. */
const OUR_BACKUP = /\bbacked up\b|\bbacks? up\b|\bbackup\b|\bicloud\b/i;

describe('[BL-390] the three in-app places say recordings are kept on this phone, and nothing more', () => {
  it('names a line for each place', () => {
    for (const [place, lines] of Object.entries(PLACES)) {
      expect(lines.length, place).toBeGreaterThan(0);
      for (const line of lines) expect(typeof line, place).toBe('string');
    }
  });

  it('says "kept on this phone" (or iPhone) in every place', () => {
    const missing = Object.entries(PLACES).flatMap(([place, lines]) => lines.filter((l) => !KEPT_ON_THIS_PHONE.test(l)).map((l) => `${place}: ${l}`));
    expect(missing).toEqual([]);
  });

  it('never says "only" or "stay", which a person with backup on could read as false', () => {
    const bad = Object.entries(PLACES).flatMap(([place, lines]) => lines.filter((l) => NOT_TRUE_WITH_BACKUP.test(l)).map((l) => `${place}: ${l}`));
    expect(bad).toEqual([]);
  });

  it('makes no backup claim in an always-shown place (the backed-up variants are separate, switched keys)', () => {
    const bad = Object.entries(PLACES).flatMap(([place, lines]) => lines.filter((l) => OUR_BACKUP.test(l)).map((l) => `${place}: ${l}`));
    expect(bad).toEqual([]);
    // The backed-up wording lives in its own keys, so the always-shown lines never need a backup clause.
    expect(en.book.recordingBackedUp).not.toBe(en.book.recordingOnPhone);
  });

  it('goes red when a place gains a claim the build may not keep', () => {
    const planted = ['Recording kept on this phone and backed up', 'Your recordings stay on this iPhone.', 'Recordings are kept only on this phone.'];
    expect(planted.filter((l) => OUR_BACKUP.test(l) || NOT_TRUE_WITH_BACKUP.test(l))).toEqual(planted);
    expect(KEPT_ON_THIS_PHONE.test('Recording saved somewhere')).toBe(false);
  });
});

describe('[BL-390] the store listing and the website put recordings in the same place', () => {
  const recordingLines = (texts: string[]) => texts.filter((t) => /\brecordings?\b/i.test(t) && /\bphone\b/i.test(t));

  it('says recordings are on the phone in the store listing and on the website', () => {
    expect(recordingLines(leaves(storeListing).map((l) => l.text)).length, 'store listing').toBeGreaterThan(0);
    expect(recordingLines(leaves(webSite).map((l) => l.text)).length, 'website').toBeGreaterThan(0);
  });
});
