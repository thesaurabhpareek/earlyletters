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

export interface Leak {
  /** The captured line, cut to 120 characters. */
  line: string;
  /** Which fixture it held. */
  fixture: string;
}

/** Fixtures a journey registers at run time (a letter it typed), at least 8 characters so a stray word cannot trip it. */
export function runtimeFixture(text: string): string | null {
  const t = norm(text);
  return t.length >= 8 ? t : null;
}

/** Every captured line that holds the child name or any fixture text. `typed` are the letters this journey typed. */
export function findLeaks(lines: readonly string[], typed: readonly string[] = []): Leak[] {
  const phrases = [...SEED_TEXT_FRAGMENTS, ...typed].map(norm).filter((p) => p.length >= 8);
  const name = new RegExp(`(^|[^\\p{L}\\p{N}])${CHILD_NAME}([^\\p{L}\\p{N}]|$)`, 'iu');
  const leaks: Leak[] = [];
  for (const line of lines) {
    const n = norm(line);
    const hit = name.test(line) ? CHILD_NAME : phrases.find((p) => n.includes(p));
    if (hit) leaks.push({ line: line.slice(0, 120), fixture: hit });
  }
  return leaks;
}
