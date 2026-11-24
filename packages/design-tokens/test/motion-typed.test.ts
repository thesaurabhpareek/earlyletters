/// <reference types="node" />
/**
 * [BL-1754] No duration, delay, curve or translate typed in a component (DSR-003, DSR-004, DSR-005, CDO-A-012,
 * CDO-A-015). Every one of these lives in `tokens.motion`, so one tune moves the whole app and the 2 s ceiling test
 * can see it. This reads the mobile source (the method brand-parity.test.ts uses for the email tokens); screens load
 * React Native, so a render test cannot run here.
 *
 * What counts as typed:
 *   - a duration: `duration: 90`, `.duration(160)`, `withTiming(x, { duration: 200 })`
 *   - a delay: `.delay(80)`, `delay: 80`, `withDelay(80, ...)`
 *   - a curve: any `Easing.` in a component (use `STANDARD_EASING`, `PEN_EASING` or `curve(role)` from lib/motion)
 *   - a translate: `translateX` or `translateY` set to a number other than 0
 * A value read from `tokens.motion` or `M.` is not a number in the source, so it passes.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens } from '../src/tokens';

const SRC = join(__dirname, '..', '..', '..', 'apps', 'mobile', 'src');
/** The shared hook builds animations from the tokens; it is the one place a library curve is named. */
const EXEMPT = new Set(['lib/motion.ts']);

/**
 * Files another lane is changing, so this row does not edit them. Shrink-only: delete a row when its owner lands, and
 * the test below fails if a row has nothing left to allow. Every row names its backlog id.
 */
const ALLOWLIST: Record<string, string> = {
  // BL-1754: the Review mark card's FadeIn.delay(80).duration(160) (CDO-A-015). Review is being changed by another lane.
  'app/review.tsx': 'BL-1754 (Review mark card entry; its 1600 ms wash timer is a setTimeout this scan does not see)',
  // BL-1754: the letter page's FadeIn.duration(150), Easing.linear and REST_OUT_MS = 96 (DSR-004, DSR-005). Letter page lane.
  'app/letter/[id].tsx': 'BL-1754 (letter page rest fade and focus swap)',
};

const TYPED: [string, RegExp][] = [
  ['duration', /\bduration\s*:\s*\d|\.duration\(\s*\d/],
  ['delay', /\.delay\(\s*\d|\bdelay\s*:\s*\d|\bwithDelay\(\s*\d/],
  ['curve', /\bEasing\s*\./],
  ['translate', /\btranslate[XY]\s*:\s*-?[1-9]/],
];

function strip(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Every typed motion value in `source`, as `kind line N`. */
export function typedValues(source: string): string[] {
  const out: string[] = [];
  strip(source).split('\n').forEach((line, i) => {
    for (const [kind, re] of TYPED) if (re.test(line)) out.push(`${kind} line ${i + 1}: ${line.trim().slice(0, 80)}`);
  });
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

describe('[BL-1754] the guard itself', () => {
  it('fails on a planted typed value of each kind', () => {
    expect(typedValues(`o.value = withTiming(1, { duration: 90 });`)).toHaveLength(1);
    expect(typedValues(`const F = FadeIn.delay(80).duration(tokens.motion.fadeMs);`)).toHaveLength(1);
    expect(typedValues(`const F = FadeIn.duration(160);`)).toHaveLength(1);
    expect(typedValues(`x.value = withDelay(120, withTiming(1));`)).toHaveLength(1);
    expect(typedValues(`const E = Easing.bezier(0.45, 0, 0.2, 1);`)).toHaveLength(1);
    expect(typedValues(`style={{ transform: [{ translateY: 120 }] }}`)).toHaveLength(1);
    expect(typedValues(`style={{ transform: [{ translateX: -24 }] }}`)).toHaveLength(1);
  });
  it('passes a value that comes from the tokens, a live value, or zero, and ignores comments', () => {
    expect(typedValues(`withTiming(1, { duration: tokens.motion.fadeMs })`)).toEqual([]);
    expect(typedValues(`FadeIn.delay(i * M.staggerMs).duration(M.enter.durationMs)`)).toEqual([]);
    expect(typedValues(`transform: [{ translateY: dy.value }, { translateX: 0 }]`)).toEqual([]);
    expect(typedValues(`// duration: 90 was the old value\n/** .delay(80) */\nconst x = 1;`)).toEqual([]);
  });
});

describe('[BL-1754] the tree', () => {
  const files = walk(SRC)
    .map((p) => relative(SRC, p).split('\\').join('/'))
    .filter((f) => !EXEMPT.has(f));

  it('scans the tree (a path change cannot make this vacuous)', () => {
    expect(files.length).toBeGreaterThan(100);
    expect(files).toContain('components/motion/press.ts');
  });

  it('has no typed duration, delay, curve or translate outside the allowlist', () => {
    const bad: string[] = [];
    for (const f of files) {
      if (f in ALLOWLIST) continue;
      for (const v of typedValues(readFileSync(join(SRC, f), 'utf8'))) bad.push(`${f} ${v}`);
    }
    expect(bad).toEqual([]);
  });

  it('keeps the allowlist honest: every row names a backlog id and still has a typed value', () => {
    for (const [f, row] of Object.entries(ALLOWLIST)) {
      expect(row).toMatch(/^BL-\d+/);
      expect(typedValues(readFileSync(join(SRC, f), 'utf8')).length).toBeGreaterThan(0);
    }
  });
});

describe('[BL-1754] the tokens the components now read', () => {
  const m = tokens.motion;
  it('hold the values the components used to type (no visible change)', () => {
    expect(m.press.reducedMs).toBe(90);
    expect(m.sweepMs).toBe(1400);
    expect(m.instantMs).toBe(1);
    expect(m.dismissDy).toBe(120);
    expect([...m.penEasing]).toEqual([0.45, 0, 0.2, 1]);
    expect(m.curve).toEqual({ veil: 'linear', sweep: 'quad', breath: 'sine' });
  });
  it('[BL-1988] hold one loop cap: 30 s, longer than any one cycle of the two loops', () => {
    expect(m.loopCapMs).toBe(30000);
    expect(m.loopCapMs).toBeGreaterThan(m.emptyBreathMs);
    expect(m.loopCapMs).toBeGreaterThan(m.sweepMs * 2);
  });
  it('stay under the 2 s ceiling', () => {
    for (const ms of [m.press.reducedMs, m.sweepMs, m.instantMs]) expect(ms).toBeLessThanOrEqual(m.hardCeilingMs);
    expect(m.press.reducedMs).toBeLessThan(m.fadeMs);
  });
});
