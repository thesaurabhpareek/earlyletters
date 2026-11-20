/**
 * NS-09 words (BL-925): the card's own bans on the Let it go lines, over the keys and every option offered.
 * Added under the widened claim (Karma, board #855): this one test file, for BL-925.
 */
import { describe, expect, it } from 'vitest';
import { en } from '../src';

const KEYS = {
  'en.review.letGoPending': () => en.review.letGoPending,
  'en.listen.discardBodyNoUndo': () => en.listen.discardBodyNoUndo,
  'en.listen.letGoStuck': () => en.listen.letGoStuck,
  'en.listen.removeNowButton': () => en.listen.removeNowButton,
  'en.listen.removeNowHintA11y': () => en.listen.removeNowHintA11y,
};

/** The options offered beside each key (the comments in strings.en.ts and the founder packet). */
const OPTIONS = [
  'This recording is not removed yet. {app} tries again each time it opens.',
  'This recording is still on this phone. It will be removed the next time {app} opens.',
  'It will be removed, and it cannot be brought back.',
  'It will be removed from the phone, and it cannot be brought back.',
  'One recording is still on this phone.',
];

// NS-09 sections 14 and 16, the "we" rule (principle 2), loss and blame words, and the glossary's internal words.
const BANNED = /\b(?:fail\w*|error\w*|deleted everywhere|instantly|we|our|us|lost|lose|gone forever|forever|sorry|oops|draft|take|entry|discard\w*|delete\w*)\b/i;

describe('[NS-09-R4a] the let-it-go words say what is true, calmly', () => {
  it('has every NS-09 key, non-empty', () => {
    for (const [key, read] of Object.entries(KEYS)) expect(typeof read() === 'string' && read().length > 0, key).toBe(true);
  });

  it('uses none of the card bans, "we", loss or internal words, in the keys or the options', () => {
    const texts = [...Object.entries(KEYS).map(([k, r]) => `${k}: ${r()}`), ...OPTIONS];
    expect(texts.filter((t) => BANNED.test(t.replace(/^[\w.]+: /, '')))).toEqual([]);
  });

  it('keeps Remove now to 22 characters and the lines short enough to read at a glance', () => {
    expect(en.listen.removeNowButton.length).toBeLessThanOrEqual(22);
    for (const t of [en.review.letGoPending, ...OPTIONS]) expect(t.replace('{app}', 'Early Letters').length).toBeLessThanOrEqual(100);
  });

  it('says the recording cannot be brought back in the confirmation (NS-09-R9)', () => {
    expect(en.listen.discardBodyNoUndo).toMatch(/cannot be brought back/);
  });
});
