/// <reference types="node" />
/**
 * [BL-1753] A component that animates must state its Reduce Motion position. Nothing failed before when a
 * file animated without the shared hook (DSR-013, DSR-014, CDO-A-027). Screens load React Native, so this
 * reads the source (the same method as layout-shifts.guard.test.ts).
 *
 * The rule (MOTION.md 4): a file that starts an animation either
 *   1. uses the shared Reduce Motion hook from lib/motion (useMotion, useReducedMotion, isReducedMotion,
 *      useSheetMotion, useRouteTransitions), or
 *   2. says in every animation call what Reduce Motion does to it: `reduceMotion(ReduceMotion.Never)` for the
 *      fade that is itself the Reduce Motion form, or `ReduceMotion.System` for movement that stops.
 * A raw `withTiming(...)` or `FadeIn.duration(...)` with neither fails here.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
/** The shared hook lives here; it is the one file that may build animations from the tokens by itself. */
const HOOK_FILE = 'lib/motion.ts';

/**
 * Files that animate without the hook today and are being changed by another lane. Shrink-only: delete the
 * row when its owner lands. Each entry names the row that removes it. Nothing is listed yet.
 */
const ALLOWLIST: Record<string, string> = {};

const HOOKS = ['useMotion', 'useReducedMotion', 'isReducedMotion', 'useSheetMotion', 'useRouteTransitions'];

const ANIMATION_CALL = new RegExp(
  [
    String.raw`\bwith(?:Timing|Spring|Repeat|Sequence|Delay|Decay)\s*\(`,
    String.raw`\b(?:Fade|Slide|Zoom|Bounce|Flip|Stretch|Rotate|Pinwheel|LightSpeed|Roll)(?:In|Out)\w*\s*\.`,
    String.raw`\b(?:LinearTransition|FadingTransition|SequencedTransition|JumpingTransition|CurvedTransition|EntryExitTransition)\b`,
    String.raw`\bnew\s+Keyframe\s*\(`,
    String.raw`\bLayoutAnimation\s*\.`,
    String.raw`\bAnimated\s*\.\s*(?:timing|spring|loop|decay|sequence|parallel|stagger)\s*\(`,
  ].join('|'),
  'g',
);

/** Comments and string-free code only, so a sentence in a doc block never counts as a call. */
export function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** The statement that starts at `from`: to a `;` or `,` at depth 0, a closing bracket, or a line end not followed by `.`. */
function statementAt(code: string, from: number): string {
  let depth = 0;
  for (let i = from; i < code.length; i++) {
    const c = code[i];
    if (c === '(' || c === '{' || c === '[') depth++;
    else if (c === ')' || c === '}' || c === ']') {
      if (--depth < 0) return code.slice(from, i);
    } else if (depth === 0 && (c === ';' || c === ',')) return code.slice(from, i);
    else if (depth === 0 && c === '\n' && !/^\s*\./.test(code.slice(i + 1, i + 200))) return code.slice(from, i);
  }
  return code.slice(from);
}

function usesHook(code: string): boolean {
  const imports = code.match(/import\s*\{[^}]*\}\s*from\s*'[^']*\/motion'/g) ?? [];
  return imports.some((i) => HOOKS.some((h) => new RegExp(`\\b${h}\\b`).test(i)));
}

/** Every animation call in `source` that neither follows the shared hook nor states its Reduce Motion position. */
export function findOffenders(source: string): string[] {
  const code = stripComments(source);
  if (usesHook(code)) return [];
  const out: string[] = [];
  for (const m of code.matchAll(ANIMATION_CALL)) {
    const stmt = statementAt(code, m.index!);
    if (!/\breduceMotion\b/.test(stmt)) out.push(`line ${code.slice(0, m.index).split('\n').length}: ${stmt.trim().slice(0, 70)}`);
  }
  return out;
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) acc.push(p);
  }
  return acc;
}

describe('[BL-1753] the guard itself', () => {
  it('fails on a planted offender: a raw timing with no Reduce Motion position and no hook', () => {
    expect(findOffenders(`const o = useSharedValue(0);\no.value = withTiming(1, { duration: 200 });`)).toHaveLength(1);
    expect(findOffenders(`<Animated.View entering={FadeIn.duration(tokens.motion.fadeMs)} />`)).toHaveLength(1);
    expect(findOffenders(`const L = new Keyframe({ 0: { opacity: 1 } }).duration(200);`)).toHaveLength(1);
    expect(findOffenders(`LayoutAnimation.configureNext(x);`)).toHaveLength(1);
  });
  it('passes the two stated forms', () => {
    expect(findOffenders(`const F = FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never);`)).toEqual([]);
    expect(findOffenders(`o.value = withTiming(0, { duration: 200, reduceMotion: ReduceMotion.Never });`)).toEqual([]);
    expect(findOffenders(`import { useMotion } from '@/lib/motion';\nconst x = withTiming(1);`)).toEqual([]);
  });
  it('does not count a hook that is only mentioned, or an animation named in a comment', () => {
    expect(findOffenders(`// useMotion is the hook\nconst x = withTiming(1);`)).toHaveLength(1);
    expect(findOffenders(`/** withTiming(1) fades */\nconst x = 1;`)).toEqual([]);
  });
});

describe('[BL-1753] every component and screen that animates states its Reduce Motion position', () => {
  const files = walk(SRC)
    .map((p) => relative(SRC, p).split('\\').join('/'))
    .filter((f) => f !== HOOK_FILE);

  it('scans the tree (a path change cannot make this vacuous)', () => {
    expect(files.length).toBeGreaterThan(100);
    expect(files.some((f) => f.startsWith('components/ui/'))).toBe(true);
  });

  it('has no offender outside the allowlist', () => {
    const bad: string[] = [];
    for (const f of files) {
      if (f in ALLOWLIST) continue;
      for (const o of findOffenders(readFileSync(join(SRC, f), 'utf8'))) bad.push(`${f} ${o}`);
    }
    expect(bad).toEqual([]);
  });

  it('keeps the allowlist honest: every row names a backlog id and still has an offender', () => {
    for (const [f, row] of Object.entries(ALLOWLIST)) {
      expect(row).toMatch(/^BL-\d+/);
      expect(findOffenders(readFileSync(join(SRC, f), 'utf8')).length).toBeGreaterThan(0);
    }
  });
});
