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
 * number would fail a whole journey. Each line is also percent-decoded before matching (%2B44%207700%20900123),
 * so URL-encoded spacing is seen; a malformed sequence is left as it is, never thrown on.
 * Flagged: a plus and 6 to 15 digits (+12025550147); a plus, country code and
 * grouped digits (+1 202 555 0147, +44 7700 900123, with or without brackets); a bracketed US number
 * ((202) 555-0147); the reserved fictional US exchange (555-01XX); a UK national number starting 01, 02, 03
 * or 07 (07700 900123); and a partial, a real-looking country code plus a first group that starts 1 to 9, at
 * the end of the line or before punctuation, never before a word, digit group, date, time or unit (+44 7700,
 * +1 202; "+44 7700 failed" is a known miss, the full-number shapes and the fixture check cover it).
 * After +1 or +7 the first group must start 2 to 9 and not be a round hundred, so a retry count or a delta at
 * the end of a line ("retry +1 200", "delta +1 100,") stays quiet; "+1 200" and "+1 800" are misses on purpose.
 * Not flagged: dates, times, offsets, semver, IPs, epoch times, UUIDs, durations, sizes, counters, serials.
 * Known gaps, on purpose, each a line this canary does not match (pinned by name in test/phone-never-logged.test.ts):
 *   a bare run of digits with no plus and no grouping; a dashed 3-3-4 number outside the 555-01XX exchange (a
 *   serial looks the same) and a bare 555-0142; a number cut after two groups (+1 202 555); an Indian or German
 *   grouping (+91 98765 43210, +49 151 12345678); a bracketed country code ((+44) 7700 900123); the UK 3-4-4 form
 *   (020 7946 0123); a partial followed by a word (+44 7700 failed); form-encoded spaces (%2B44+7700+900123) and
 *   a double-encoded line (%252B44).
 * Register such a number as a phone fixture instead. That check (below) does not guess: it flags a line that
 * holds a registered number's digits whole, its last 10 digits (the national form: 2025550147, 07700900123) or
 * its last four as a whole group (the part a mask shows), and a finding never echoes a digit. It sees only the
 * fixtures a journey registers; journey.ts passes no phones list until BL-1902 registers a fixture.
 */
const PHONE_SHAPES: readonly RegExp[] = [
  /(?<![\w+])\+\d{6,15}(?![\w])/, // +12025550147
  /(?<![\w+])\+\d{1,3}[ .-]\(?\d{2,4}\)?[ .-]\d{3}[ .-]?\d{3,4}(?![\w-]|\.\w)/, // +1 202 555 0147, +44 7700 900123
  /(?<![\w+])\+(?:[17][ ]\(?(?!\d00(?!\d))[2-9]\d{2,3}|[2-9]\d{1,2}[ ]\(?[1-9]\d{2,3})\)?(?![\w:/-]|\.\w|[ ]\w)/, // partial: +44 7700, +1 202 (not +1 200)
  /(?<![\w.-])\(\d{3}\)[ ]?\d{3}[ -]\d{4}(?![\w-]|\.\w)/, // (202) 555-0147
  /(?<![\w.-])\d{3}[ .-]555[ .-]01\d{2}(?![\w-]|\.\w)/, // 202-555-0147 (reserved fictional exchange)
  /(?<![\w.-])0[1237]\d{2,3}[ ]\d{3}[ ]?\d{3,4}(?![\w-]|\.\w)/, // 07700 900123
];

/** A fixture's own digits, so a registered number is found whole, by its last 10 (national form) or by its last four. */
const digitsOf = (s: string) => s.replace(/\D/g, '');

/** Percent-decode the ASCII escapes (%2B, %20, %28) of one line. A malformed escape stays as written; never throws. */
export const decodeLine = (line: string) =>
  line.replace(/%([0-7][0-9a-f])/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)));

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
  lines.forEach((raw, at) => {
    const line = decodeLine(raw);
    const n = norm(line);
    const label =
      (name.test(line) ? 'child-name' : phrases.find((x) => n.includes(x.p))?.label) ??
      (PHONE_SHAPES.some((re) => re.test(line)) ? 'phone-shape' : undefined) ??
      tails.find((x) => digitsOf(line).includes(x.d) || (x.d.length >= 10 && digitsOf(line).includes(x.d.slice(-10))) || x.re.test(line))?.label;
    if (label) leaks.push({ label, line: at });
  });
  return leaks;
}
