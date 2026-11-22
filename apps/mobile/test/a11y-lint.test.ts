/// <reference types="node" />
/**
 * BL-268 (TDD 09 section 8.3 L1, LEGAL-REQ-051): accessibility lint rules, run as a test. This repo has no ESLint
 * config and `expo lint` would add a toolchain, so, like a11y-ax5.test.ts, the rules read source text and load nothing
 * from React Native. Each rule has a self-check that it catches a bad line, so a rule cannot go quiet by accident.
 *
 * Rules (all on `apps/mobile/src`, comments stripped):
 *   R1 no `allowFontScaling={false}` anywhere (people who set a larger size get it).
 *   R2 `maxFontSizeMultiplier` only in `components/ui/text.tsx`, plus the allowlist below. The allowlist is today's
 *      uses and only shrinks: a new file is a failure until design systems signs it off by adding it here.
 *   R3 `expo-haptics`, `expo-blur` and `@expo/ui/*` are imported only under `components/platform/` and `lib/`.
 *   R4 Reduce Motion is read only in `lib/motion.ts` (no `AccessibilityInfo` reduce-motion calls, no Reanimated
 *      `useReducedMotion`); screens call `useReducedMotion` or `useMotion` from `@/lib/motion`.
 *   R5 no `text-xs` and no `text-[Npx]` under 13 (the type floor is 13 pt).
 *   R6 no hex or `rgba(` colour literals in `src/app` (colours come from tokens).
 * Not here: role and label on every touchable, `numberOfLines` on letter text, layout-animation imports (M2). They need
 * a syntax-aware rule and are listed in docs/BACKLOG.md under BL-268.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const strip = (t: string) => t.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n)) out.push(p);
  }
  return out;
}
const FILES = walk(SRC).map((p) => ({ rel: relative(SRC, p).split('\\').join('/'), text: strip(readFileSync(p, 'utf8')) }));

/** Files with a hit for `re`, skipping any path `skip` accepts. */
const hits = (re: RegExp, skip: (rel: string) => boolean = () => false) =>
  FILES.filter((f) => !skip(f.rel) && re.test(f.text)).map((f) => f.rel).sort();

const R1 = /allowFontScaling=\{\s*false\s*\}/;
const R2 = /maxFontSizeMultiplier/;
const R3 = /from\s+'(expo-haptics|expo-blur|@expo\/ui(\/[^']*)?)'/;
const R4 = /AccessibilityInfo\s*\.\s*(isReduceMotionEnabled|addEventListener\(\s*'reduceMotionChanged')|import\s*\{[^}]*\buseReducedMotion\b[^}]*\}\s*from\s*'react-native-reanimated'/;
const R5 = /(?<![\w-])text-xs\b|text-\[(?:[0-9]|1[0-2])(?:\.\d+)?px\]/;
const R6 = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])|rgba?\(/;

/** Today's `maxFontSizeMultiplier` uses outside `ui/text.tsx`. Shrink only. */
const R2_ALLOW = [
  'app/(auth)/sign-in/code.tsx',
  'app/(tabs)/book.tsx',
  'app/letter/[id].tsx',
  'components/book/book-cover.tsx',
  'components/player/audio-player.tsx',
  'components/resilience/plain-screen.tsx',
  'components/ui/text-field.tsx',
];

describe('BL-268 accessibility lint rules (self-checks)', () => {
  it('each rule catches a bad line and passes a good one', () => {
    expect(R1.test('<Text allowFontScaling={false}>')).toBe(true);
    expect(R1.test('<Text allowFontScaling>')).toBe(false);
    expect(R2.test('<Text maxFontSizeMultiplier={1}>')).toBe(true);
    expect(R3.test("import * as Haptics from 'expo-haptics';")).toBe(true);
    expect(R3.test("import { Host } from '@expo/ui/swift-ui';")).toBe(true);
    expect(R3.test("import { haptic } from '@/lib/haptics';")).toBe(false);
    expect(R4.test('AccessibilityInfo.isReduceMotionEnabled()')).toBe(true);
    expect(R4.test("import { useReducedMotion } from 'react-native-reanimated';")).toBe(true);
    expect(R4.test("import { useReducedMotion } from '@/lib/motion';")).toBe(false);
    expect(R5.test('className="text-xs"')).toBe(true);
    expect(R5.test('className="text-[12px]"')).toBe(true);
    expect(R5.test('className="text-[13px] text-base"')).toBe(false);
    expect(R6.test("color: '#1a2b3c'")).toBe(true);
    expect(R6.test('rgba(0,0,0,0.5)')).toBe(true);
    expect(R6.test('className="bg-surface"')).toBe(false);
  });
  it('scans the source tree', () => {
    expect(FILES.length).toBeGreaterThan(100);
  });
});

describe('BL-268 accessibility lint rules (src)', () => {
  it('R1: no allowFontScaling={false}', () => {
    expect(hits(R1)).toEqual([]);
  });
  it('R2: maxFontSizeMultiplier only in ui/text.tsx and the allowlist', () => {
    const found = hits(R2, (r) => r === 'components/ui/text.tsx');
    expect(found.filter((f) => !R2_ALLOW.includes(f))).toEqual([]);
    // The allowlist must not keep entries that no longer need it.
    expect(R2_ALLOW.filter((f) => !found.includes(f))).toEqual([]);
  });
  it('R3: haptics, blur and @expo/ui only under platform/ and lib/', () => {
    expect(hits(R3, (r) => r.startsWith('components/platform/') || r.startsWith('lib/'))).toEqual([]);
  });
  it('R4: Reduce Motion is read only in lib/motion.ts', () => {
    expect(hits(R4, (r) => r === 'lib/motion.ts')).toEqual([]);
  });
  it('R5: nothing under the 13 pt floor', () => {
    expect(hits(R5)).toEqual([]);
  });
  it('R6: no colour literals in src/app', () => {
    expect(hits(R6, (r) => !r.startsWith('app/'))).toEqual([]);
  });
});
