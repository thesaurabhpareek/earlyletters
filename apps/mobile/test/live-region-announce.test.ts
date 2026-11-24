/**
 * [PER4-018] A file that adds a live region must also call announce().
 *
 * iOS VoiceOver does not speak a change that only has accessibilityLiveRegion on it
 * (that prop is Android only), so every file that sets one also calls `announce()`
 * (or AccessibilityInfo.announceForAccessibility) from `@/lib/a11y`.
 *
 * Today's offenders are listed in BASELINE. The baseline only shrinks: a file that
 * starts announcing must be removed from the list (the test says so), and a new file
 * can never be added to it. The sweep that adds announce() is BL-1703.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');

/** Today's offenders at the time of BL-1828. Remove entries; never add. */
export const BASELINE: readonly string[] = [
  'src/app/family.tsx',
  'src/app/letter/[id].tsx',
  'src/components/child/child-editors.tsx',
  'src/components/tonight/quiet-day-inline.tsx',
  'src/components/ui/state-screen.logic.ts',
  'src/lib/auth/revocation-wait-line.tsx',
];

const LIVE = /\baccessibilityLiveRegion\b/;
const ANNOUNCES = /\b(announce|announceForAccessibility)\(/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

/** Files (repo-relative to apps/mobile, forward slashes) with a live region and no announce call. */
export function findOffenders(files: Record<string, string>): string[] {
  return Object.keys(files)
    .filter((f) => LIVE.test(files[f]) && !ANNOUNCES.test(files[f]))
    .sort();
}

function readTree(): Record<string, string> {
  const root = join(__dirname, '..');
  const files: Record<string, string> = {};
  for (const p of walk(SRC)) files[relative(root, p).split(sep).join('/')] = readFileSync(p, 'utf8');
  return files;
}

describe('[PER4-018] a live region comes with announce()', () => {
  it('fails on a planted screen with a live region and no announce()', () => {
    const planted = {
      'src/app/planted.tsx': '<View accessibilityLiveRegion="polite"><Text>Saved</Text></View>',
      'src/app/fine.tsx': 'announce("Saved"); <View accessibilityLiveRegion="polite" />',
    };
    expect(findOffenders(planted)).toEqual(['src/app/planted.tsx']);
  });

  it('has no offender outside the baseline', () => {
    const fresh = findOffenders(readTree()).filter((f) => !BASELINE.includes(f));
    expect(fresh, `add announce() from @/lib/a11y to: ${fresh.join(', ')}`).toEqual([]);
  });

  it('baseline only shrinks: every entry is still an offender', () => {
    const offenders = findOffenders(readTree());
    const stale = BASELINE.filter((f) => !offenders.includes(f));
    expect(stale, `now announcing or gone, remove from BASELINE: ${stale.join(', ')}`).toEqual([]);
  });
});

/**
 * BL-1953 slice 1: the four settings screens speak their live regions. Each entry is the text the live region
 * shows; the announce call must sit in a useEffect that is keyed on it, so a change is spoken once and a re-render
 * is not. A bare announce() somewhere in the file (or an import alone) does not satisfy this.
 */
const SPOKEN: Record<string, RegExp[]> = {
  'src/app/settings/app-lock.tsx': [/useEffect\(\(\) => \{\s*if \(unavailable\) announce\(appLockCopy\.noPasscode\);\s*\}, \[unavailable\]\)/],
  'src/app/settings/backup.tsx': [
    /useEffect\(\(\) => \{\s*if \(restore\) announce\(restore\);\s*\}, \[restore\]\)/,
    /useEffect\(\(\) => \{\s*if \(failed\) announce\(t\.turnOnFailed\);\s*\}, \[failed\]\)/,
  ],
  'src/app/settings/plus.tsx': [
    /useEffect\(\(\) => \{\s*if \(notice\) announce\(notice\);\s*\}, \[notice\]\)/,
    /useEffect\(\(\) => \{\s*if \(restored\) announce\(restored\.text\);\s*\}, \[restored\]\)/,
  ],
  'src/app/settings/storage.tsx': [
    /for \(const p of inFlight\) announce\(`\$\{nameFor\(p\.id\)\}\. \$\{progressLine\(/,
    /\}, \[phases\]\)/,
  ],
};

describe('[PER4-018] BL-1953 settings screens announce what their live region shows', () => {
  const tree = readTree();
  for (const [file, patterns] of Object.entries(SPOKEN)) {
    it(`${file} imports announce from @/lib/a11y and calls it from an effect on the live text`, () => {
      expect(tree[file]).toMatch(/import \{[^}]*\bannounce\b[^}]*\} from '@\/lib\/a11y'/);
      for (const re of patterns) expect(tree[file]).toMatch(re);
    });
    it(`${file} is off the baseline and not an offender`, () => {
      expect(BASELINE).not.toContain(file);
      expect(findOffenders({ [file]: tree[file] })).toEqual([]);
    });
  }

  it('storage speaks on a phase change only, never on a byte tick', () => {
    const src = tree['src/app/settings/storage.tsx'];
    expect(src).toMatch(/const phases = inFlight\.map\(\(p\) => `\$\{p\.id\}:\$\{p\.phase\}`\)/);
    expect(src).toMatch(/progressLine\(\{ \.\.\.p, bytesDone: 0, bytesTotal: 0 \}\)/);
  });
});
