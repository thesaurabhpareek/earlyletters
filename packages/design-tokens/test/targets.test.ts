/**
 * Touch-target and sheet-title rulings (BL-1751, CDESO-7). Each assertion fails if the number or the rule moves.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FONT_SCALE, isAccessibilitySize } from '../../../apps/mobile/src/lib/a11y.logic';
import { tokens } from '../src/tokens';

describe('target.action (CDESO-7)', () => {
  it('is 48: above the 44 floor, below the 56 primary, and the floor does not move', () => {
    expect(tokens.target.action).toBe(48);
    expect(tokens.target.min).toBe(44);
    expect(tokens.target.action).toBeGreaterThan(tokens.target.min);
    expect(tokens.target.action).toBeLessThan(tokens.target.primary);
  });
  it('is 48 at default and large sizes, 56 (target.primary) and stacked from AX1', () => {
    for (const scale of [1, 1.1, FONT_SCALE.xxxLarge]) {
      expect(tokens.actionTargetMin(scale)).toBe(48);
      expect(tokens.actionsStack(scale)).toBe(false);
    }
    for (const scale of [FONT_SCALE.ax1, FONT_SCALE.ax3, FONT_SCALE.ax5]) {
      expect(tokens.actionTargetMin(scale)).toBe(tokens.target.primary);
      expect(tokens.actionsStack(scale)).toBe(true);
    }
  });
  it('never goes under the 44 pt floor at any size', () => {
    for (const scale of [0.8, 1, 1.353, 1.786, 3.571]) expect(tokens.actionTargetMin(scale)).toBeGreaterThanOrEqual(tokens.target.min);
  });
});

describe('the AX1 threshold matches the app', () => {
  it('uses the same number and the same answer as isAccessibilitySize', () => {
    expect(tokens.accessibilityFromScale).toBe(FONT_SCALE.ax1);
    for (const scale of [0.9, 1, 1.353, 1.78, 1.785, 1.786, 2.643, 3.571]) {
      expect(tokens.isAccessibilityScale(scale), `scale ${scale}`).toBe(isAccessibilitySize(scale));
    }
  });
});

describe('listRowMin (CDESO-7)', () => {
  it('is 52 at default and 56 from AX1, for month rows and Me rows alike (one function)', () => {
    expect(tokens.layout.listRowMin).toBe(52);
    expect(tokens.listRowMinFor(FONT_SCALE.large)).toBe(52);
    expect(tokens.listRowMinFor(FONT_SCALE.ax1)).toBe(56);
    expect(tokens.listRowMinFor(FONT_SCALE.ax5)).toBe(56);
  });
});

describe('sheetTitle (CDESO-7)', () => {
  it('has no line limit and is not capped below 2.0 anywhere it is declared', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'tokens.ts'), 'utf8');
    const line = src.split('\n').find((l) => l.trimStart().startsWith('sheetTitle:')) ?? '';
    expect(line).toContain("'title2', 2.0)");
    expect(Object.keys(tokens.type.sheetTitle)).not.toContain('numberOfLines');
    expect(tokens.type.sheetTitle.maxScale).toBeGreaterThanOrEqual(tokens.type.title2.maxScale as number);
  });
  it('at AX5 the title is scaled to its cap (2.0) and not clipped; at AX1 it stays above the body line it sits over, both scaled', () => {
    const t = tokens.type.sheetTitle;
    const body = tokens.type.body;
    const at = (s: { fontSize: number; maxScale: number | null }, scale: number) => s.fontSize * Math.min(scale, s.maxScale ?? scale);
    expect(at(t, FONT_SCALE.ax5)).toBe(44);
    expect(at(t, FONT_SCALE.ax1)).toBeGreaterThan(at(body, FONT_SCALE.ax1));
  });
  it('where the capped title meets the uncapped body: body overtakes it above 2.44x (a finding, not a pass)', () => {
    const t = tokens.type.sheetTitle;
    const body = tokens.type.body;
    expect(body.maxScale).toBeNull();
    const crossover = (t.fontSize * (t.maxScale as number)) / body.fontSize;
    expect(crossover).toBeCloseTo(2.44, 2);
    expect(crossover).toBeLessThan(FONT_SCALE.ax3);
  });
});
