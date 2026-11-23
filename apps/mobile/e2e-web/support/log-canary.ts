/**
 * BL-415. Client log canary: no entry text, transcript or child name reaches a log.
 *
 * The web journey run captures everything the page writes to the console (every level) and every uncaught page
 * error. After each journey the capture is searched for the fictional family's words ("Asha": CLAUDE.md privacy
 * rules). Any hit fails the journey. There is no allow-list: a log line that holds a person's words is a leak
 * (LEGAL-REQ-014, DATA-REQ-004), never an expected error state.
 *
 * BL-1901 (NS-54-R26, NS-41-R16): a phone number, a partial number or a registered one is a leak too, before the
 * first line of phone code exists. Fictional numbers only (US 555-01XX, UK 07700 900XXX).
 *
 * Pure (no Playwright, no browser): unit-tested in test/log-canary.test.ts.
 */

/** The child's name in every journey. A whole word, any case. */
export const CHILD_NAME = 'Asha';

/**
 * Distinctive phrases from the seeded letters (src/dev/asha-seed.ts). A phrase is at least 12 characters, so it
 * cannot appear by chance. test/log-canary.test.ts proves each one is still in the seed.
 */
export const SEED_TEXT_FRAGMENTS: readonly string[] = [
  'the whole house is quiet',
  'Nani made dal',
  'surprised you as much as it surprised me',
  'lavender soap Papa insists on',
  'tried to catch the drops on the glass',
  'looked at me like you had always known how',
  'You splash with your whole body',
  'painted your face with it',
  'an ordinary day',
];

/**
 * Phone shapes. Tight on purpose: this canary has no allow-list, so one ordinary console line that looks like a
 * number would fail a whole journey. Flagged: a plus and 6 to 15 digits (+12025550147); a plus, country code and
 * grouped digits (+1 202 555 0147, +44 7700 900123, with or without brackets); a bracketed US number
 * ((202) 555-0147); the reserved fictional US exchange (555-01XX); a UK national number starting 01, 02, 03
 * or 07 (07700 900123); and a partial, a real-looking country code plus a first group that starts 1 to 9, at
 * the end of the line or before punctuation, never before a word, digit group, date, time or unit (+44 7700,
 * +1 202; "+44 7700 failed" is a known miss, the full-number shapes and the fixture check cover it).
 * Not flagged: dates, times, offsets, semver, IPs, epoch times, UUIDs, durations, sizes, counters, serials.
 * Known gaps, on purpose: a bare run of digits with no plus and no grouping, and a dashed 3-3-4 number outside
 * the 555-01XX exchange (a serial looks the same). Register such a number as a phone fixture instead: that
 * check (below) fails closed. journey.ts passes no phones list until BL-1902 registers a fixture.
 */
const PHONE_SHAPES: readonly RegExp[] = [
  /(?<![\w+])\+\d{6,15}(?![\w])/, // +12025550147
  /(?<![\w+])\+\d{1,3}[ .-]\(?\d{2,4}\)?[ .-]\d{3}[ .-]?\d{3,4}(?![\w-]|\.\w)/, // +1 202 555 0147, +44 7700 900123
  /(?<![\w+])\+(?:1|7|[2-9]\d{1,2})[ ]\(?[1-9]\d{2,3}\)?(?![\w:/-]|\.\w|[ ]\w)/, // partial: +44 7700, +1 202
  /(?<![\w.-])\(\d{3}\)[ ]?\d{3}[ -]\d{4}(?![\w-]|\.\w)/, // (202) 555-0147
  /(?<![\w.-])\d{3}[ .-]555[ .-]01\d{2}(?![\w-]|\.\w)/, // 202-555-0147 (reserved fictional exchange)
  /(?<![\w.-])0[1237]\d{2,3}[ ]\d{3}[ ]?\d{3,4}(?![\w-]|\.\w)/, // 07700 900123
];

/** A fixture's own digits, so a registered number is found whole or by its last four (the part a mask shows). */
const digitsOf = (s: string) => s.replace(/\D/g, '');

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * A finding names WHAT was found and WHERE, never the text: a failed run prints this value into the Playwright
 * message, the report and the CI log, so it must not carry the line or the fixture (LEGAL-REQ-014).
 * `label` is `child-name`, `seed:<index>`, `typed:<index>`, `phone-shape` or `phone:<index>` (a registered phone fixture); `line` is the 0-based index of the captured line.
 */
export interface Leak {
  label: string;
  line: number;
}

/** Fixtures a journey registers at run time (a letter it typed), at least 8 characters so a stray word cannot trip it. */
export function runtimeFixture(text: string): string | null {
  const t = norm(text);
  return t.length >= 8 ? t : null;
}

/**
 * Every captured line that holds the child name or any fixture text. `typed` are the letters this journey typed.
 * Known gap: Playwright's `m.text()` shows an object argument as `JSHandle@object`, so a letter logged inside an
 * object is not seen.
 */
export function findLeaks(lines: readonly string[], typed: readonly string[] = [], phones: readonly string[] = []): Leak[] {
  const phrases = [
    ...SEED_TEXT_FRAGMENTS.map((p, i) => ({ label: `seed:${i}`, p: norm(p) })),
    ...typed.map((p, i) => ({ label: `typed:${i}`, p: norm(p) })),
  ].filter((x) => x.p.length >= 8);
  const name = new RegExp(`(^|[^\\p{L}\\p{N}])${CHILD_NAME}([^\\p{L}\\p{N}]|$)`, 'iu');
  const tails = phones.map((p, i) => ({ label: `phone:${i}`, d: digitsOf(p), re: new RegExp(`(?<!\\d)${digitsOf(p).slice(-4)}(?!\\d)`) })).filter((x) => x.d.length >= 4);
  const leaks: Leak[] = [];
  lines.forEach((line, at) => {
    const n = norm(line);
    const label =
      (name.test(line) ? 'child-name' : phrases.find((x) => n.includes(x.p))?.label) ??
      (PHONE_SHAPES.some((re) => re.test(line)) ? 'phone-shape' : undefined) ??
      tails.find((x) => digitsOf(line).includes(x.d) || x.re.test(line))?.label;
    if (label) leaks.push({ label, line: at });
  });
  return leaks;
}
