// BL-873: the fixed reminder lines for a day the parent typed on the occasions screen (NX-39-R25). The general rules
// (dashes, curly quotes, emoji, exclamation budget, lock-screen lengths, gap and day counts, "we" and "our") already
// reach these keys through NOTIFICATION_PATH; this file holds the words NX-39 bans for this one family.
import { describe, expect, it } from 'vitest';
import { features } from '../src';
import { NOTIFICATION_PATH } from './support/notification-scope';

const LINES = features.reminders.neutral.typedDay;
const TEXTS = LINES.flatMap((l, i) => [
  { path: `features.reminders.neutral.typedDay[${i}].title`, text: l.title },
  { path: `features.reminders.neutral.typedDay[${i}].body`, text: l.body },
]);

// NX-39-R17: no "waiting", "missed", "still", "forgot", "don't", "you have not", "only". The other forms of the same
// words are banned with them, because a lock-screen line that chases the parent is the failure either way.
const R17_WORDS = /\b(wait\w*|miss\w*|still|forg[eo]t\w*|don'?t|do not|you have not|you haven'?t|only)\b/i;
// NX-39-R26 and R25: no place, photo, count or occasion name, and no word that names what kind of day it is (the CMO
// ruled out travel, trip, holiday and festival in a public reminder line, council record row 47). R17 and R55: the app
// never says it found, noticed or knows.
const R26_WORDS =
  /\b(places?|where|photos?|pictures?|videos?|camera|library|festivals?|holidays?|trips?|travel\w*|occasions?|birthdays?|anniversar\w*|moments?|found|noticed|knows?)\b/i;
const NUMBER = /\d|\b(two|three|four|five|six|seven|eight|nine|ten|once|twice|times?)\b/i;
const WE = /\b(we|our|us)\b/i;

describe('[NX-39-R26] typed-day reminders are a fixed, small set of lock-screen lines', () => {
  it('has 3 to 5 title and body pairs, none repeated', () => {
    expect(LINES.length).toBeGreaterThanOrEqual(3);
    expect(LINES.length).toBeLessThanOrEqual(5);
    expect(new Set(LINES.map((l) => l.title)).size).toBe(LINES.length);
    expect(new Set(LINES.map((l) => l.body)).size).toBe(LINES.length);
  });

  it('sits under the one lock-screen scope, so every notification rule reads it', () => {
    for (const t of TEXTS) expect(NOTIFICATION_PATH.test(t.path), t.path).toBe(true);
  });

  it('carries no placeholder at all: no {child}, no name, no weekday, nothing filled in from the library', () => {
    for (const t of TEXTS) expect(t.text, t.path).not.toMatch(/[{}]/);
  });

  it('never reuses an evening line, so the two families rotate instead of repeating', () => {
    const evening = new Set<string>(features.reminders.neutral.evening.flatMap((v) => [v.title, v.body]));
    for (const t of TEXTS) expect(evening.has(t.text), t.path).toBe(false);
  });
});

describe('[NX-39-R17][NX-39-R25] typed-day reminders never chase, count or name the day', () => {
  it('has none of the R17 words', () => {
    for (const t of TEXTS) expect(t.text, t.path).not.toMatch(R17_WORDS);
  });

  it('names no place, photo, occasion or kind of day, and never says the app found or knows something', () => {
    for (const t of TEXTS) expect(t.text, t.path).not.toMatch(R26_WORDS);
  });

  it('counts nothing', () => {
    for (const t of TEXTS) expect(t.text, t.path).not.toMatch(NUMBER);
  });

  it('never speaks as a team', () => {
    for (const t of TEXTS) expect(t.text, t.path).not.toMatch(WE);
  });

  it('goes red on the lines these rules exist to stop', () => {
    expect('Your photos are still waiting').toMatch(R17_WORDS);
    expect("Don't forget the day").toMatch(R17_WORDS);
    expect('You missed a day').toMatch(R17_WORDS);
    expect('Only a minute').toMatch(R17_WORDS);
    expect('Photos from the trip').toMatch(R26_WORDS);
    expect('Happy birthday').toMatch(R26_WORDS);
    expect('A festival today').toMatch(R26_WORDS);
    expect('We found a day').toMatch(R26_WORDS);
    expect('3 photos from today').toMatch(NUMBER);
    expect('Two new days').toMatch(NUMBER);
    expect('Tell us about it').toMatch(WE);
  });
});
