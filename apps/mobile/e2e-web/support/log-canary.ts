/**
 * BL-415. Client log canary: no entry text, transcript or child name reaches a log.
 *
 * The web journey run captures everything the page writes to the console (every level) and every uncaught page
 * error. After each journey the capture is searched for the fictional family's words ("Asha": CLAUDE.md privacy
 * rules). Any hit fails the journey. There is no allow-list: a log line that holds a person's words is a leak
 * (LEGAL-REQ-014, DATA-REQ-004), never an expected error state.
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

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * A finding names WHAT was found and WHERE, never the text: a failed run prints this value into the Playwright
 * message, the report and the CI log, so it must not carry the line or the fixture (LEGAL-REQ-014).
 * `label` is `child-name`, `seed:<index>` or `typed:<index>`; `line` is the 0-based index of the captured line.
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
export function findLeaks(lines: readonly string[], typed: readonly string[] = []): Leak[] {
  const phrases = [
    ...SEED_TEXT_FRAGMENTS.map((p, i) => ({ label: `seed:${i}`, p: norm(p) })),
    ...typed.map((p, i) => ({ label: `typed:${i}`, p: norm(p) })),
  ].filter((x) => x.p.length >= 8);
  const name = new RegExp(`(^|[^\\p{L}\\p{N}])${CHILD_NAME}([^\\p{L}\\p{N}]|$)`, 'iu');
  const leaks: Leak[] = [];
  lines.forEach((line, at) => {
    const n = norm(line);
    const label = name.test(line) ? 'child-name' : phrases.find((x) => n.includes(x.p))?.label;
    if (label) leaks.push({ label, line: at });
  });
  return leaks;
}
