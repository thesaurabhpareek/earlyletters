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
import { tokens } from '@scribe/design-tokens';
import { loopReps } from '../src/lib/loop.logic';

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

/**
 * [BL-1753 part c, BL-1988] Every `withRepeat(` whose repeat count is `-1` or `Infinity` (CDESO-4). A loop must
 * end by itself, at rest: a finite even count from `loopReps` (lib/loop.logic.ts).
 */
export function findUnboundedLoops(source: string): string[] {
  const code = stripComments(source);
  const out: string[] = [];
  for (const m of code.matchAll(/\bwithRepeat\s*\(/g)) {
    let depth = 1;
    const args: string[] = [''];
    for (let i = m.index! + m[0].length; i < code.length && depth > 0; i++) {
      const c = code[i];
      if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) depth--;
      if (depth === 0) break;
      if (c === ',' && depth === 1) args.push('');
      else args[args.length - 1] += c;
    }
    const reps = (args[1] ?? '').trim();
    if (/^(?:-\s*1|Infinity|Number\.POSITIVE_INFINITY|-\s*Infinity)$/.test(reps) || /^-/.test(reps))
      out.push(`line ${code.slice(0, m.index).split('\n').length}: withRepeat(..., ${reps})`);
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

describe('[BL-1753 c] no loop runs without end', () => {
  it('fails on a planted offender: withRepeat with -1 or Infinity', () => {
    expect(findUnboundedLoops(`o.value = withRepeat(withTiming(1, { duration: 200 }), -1, true);`)).toHaveLength(1);
    expect(findUnboundedLoops(`x.value = withRepeat(withTiming(1, { duration: tokens.motion.sweepMs }), Infinity, true);`)).toHaveLength(1);
    expect(findUnboundedLoops(`x.value = withRepeat(\n  withTiming(1, { duration: f(1, 2) }),\n  - 1,\n  true,\n);`)).toHaveLength(1);
  });
  it('passes a finite count and ignores a comment', () => {
    expect(findUnboundedLoops(`o.value = withRepeat(withTiming(1), loopReps(8000), true);`)).toEqual([]);
    expect(findUnboundedLoops(`// withRepeat(x, -1)\nconst a = 1;`)).toEqual([]);
  });
  it('finds none under apps/mobile/src, and the tree really has the two loops it guards', () => {
    const all = walk(SRC);
    const bad: string[] = [];
    let loops = 0;
    for (const p of all) {
      const src = readFileSync(p, 'utf8');
      loops += (stripComments(src).match(/\bwithRepeat\s*\(/g) ?? []).length;
      for (const o of findUnboundedLoops(src)) bad.push(`${relative(SRC, p)} ${o}`);
    }
    expect(loops).toBeGreaterThanOrEqual(2);
    expect(bad).toEqual([]);
  });
});

describe('[BL-1988] the two loops end at rest by themselves', () => {
  const read = (f: string) => stripComments(readFileSync(join(SRC, f), 'utf8'));
  it('loopReps is an even count that covers the cap', () => {
    for (const cycle of [2800, 8000, 1000, 29999, 30000, 45000]) {
      const n = loopReps(cycle);
      expect(n % 2).toBe(0);
      expect((n / 2) * cycle).toBeGreaterThanOrEqual(tokens.motion.loopCapMs);
      expect((n / 2 - 1) * cycle).toBeLessThan(tokens.motion.loopCapMs);
    }
    expect(loopReps(8000)).toBe(8);
    expect(loopReps(2800)).toBe(22);
    expect(() => loopReps(0)).toThrow();
  });
  it('Breathe and the waiting bar both take their count from loopReps and the cap token', () => {
    expect(read('components/motion/breathe.tsx')).toMatch(/withRepeat\([\s\S]*loopReps\(tokens\.motion\.emptyBreathMs\)\s*,\s*true\)/);
    expect(read('components/family/join-ask.tsx')).toMatch(/withRepeat\([\s\S]*loopReps\(tokens\.motion\.sweepMs \* 2\)\s*,\s*true\)/);
  });
  it('a reversing loop with an even count ends at its start: the bar rests at the start of its track', () => {
    // withRepeat(anim, n, true) plays n one-way runs, alternating direction; the value after n runs:
    const endsAt = (n: number) => (n % 2 === 0 ? 0 : 1);
    expect(endsAt(loopReps(tokens.motion.sweepMs * 2))).toBe(0);
    expect(endsAt(loopReps(tokens.motion.emptyBreathMs))).toBe(0);
  });
  it('the waiting bar also stops when the app is not active, as Breathe does, and restarts on return', () => {
    const bar = read('components/family/join-ask.tsx');
    expect(bar).toMatch(/AppState\.addEventListener\('change'/);
    expect(bar).toMatch(/if \(reduced \|\| !active \|\| width === 0\)/);
    expect(bar).toMatch(/\[reduced, active, width, x\]/);
  });
  it('has no in-app pause control on either loop', () => {
    for (const f of ['components/motion/breathe.tsx', 'components/family/join-ask.tsx']) expect(read(f)).not.toMatch(/pause button|onPause|PauseButton/i);
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
