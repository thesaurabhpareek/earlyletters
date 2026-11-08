/**
 * Display figures against the bundled face itself (TestFlight build 1: "18 is merging"). Reads the TrueType file
 * (head, hhea, maxp, hmtx, loca, glyf, cmap 4, GSUB feature tags), so a re-cut font or a new tracking value is
 * checked against the ink it actually draws, not against a number copied into the tokens.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens } from '../src/tokens';

function face(file: string) {
  const b = readFileSync(join(__dirname, '..', 'fonts', `${file}.ttf`));
  const tables: Record<string, number> = {};
  for (let i = 0; i < b.readUInt16BE(4); i++) {
    const r = 12 + i * 16;
    tables[b.toString('latin1', r, r + 4)] = b.readUInt32BE(r + 8);
  }
  const upem = b.readUInt16BE(tables.head + 18);
  const longLoca = b.readInt16BE(tables.head + 50) === 1;
  const ascent = b.readInt16BE(tables.hhea + 4);
  const descent = -b.readInt16BE(tables.hhea + 6);
  const lineGap = b.readInt16BE(tables.hhea + 8);
  const hMetrics = b.readUInt16BE(tables.hhea + 34);

  let sub = 0;
  for (let i = 0; i < b.readUInt16BE(tables.cmap + 2); i++) {
    const r = tables.cmap + 4 + i * 8;
    const off = tables.cmap + b.readUInt32BE(r + 4);
    if (b.readUInt16BE(off) === 4 && (b.readUInt16BE(r) === 0 || (b.readUInt16BE(r) === 3 && b.readUInt16BE(r + 2) === 1))) sub = off;
  }
  const seg = b.readUInt16BE(sub + 6);
  const [ends, starts] = [sub + 14, sub + 16 + seg];
  const [deltas, ranges] = [starts + seg, starts + seg * 2];
  const glyphOf = (cp: number) => {
    for (let s = 0; s < seg / 2; s++) {
      if (cp > b.readUInt16BE(ends + s * 2)) continue;
      const start = b.readUInt16BE(starts + s * 2);
      if (cp < start) return 0;
      const delta = b.readInt16BE(deltas + s * 2);
      const ro = b.readUInt16BE(ranges + s * 2);
      if (ro === 0) return (cp + delta) & 0xffff;
      const g = b.readUInt16BE(ranges + s * 2 + ro + (cp - start) * 2);
      return g === 0 ? 0 : (g + delta) & 0xffff;
    }
    return 0;
  };
  const loca = (g: number) => (longLoca ? b.readUInt32BE(tables.loca + g * 4) : b.readUInt16BE(tables.loca + g * 2) * 2);
  /** Advance, ink box and side bearings of a character, in em. */
  const glyph = (ch: string) => {
    const g = glyphOf(ch.codePointAt(0)!);
    const advance = b.readUInt16BE(tables.hmtx + Math.min(g, hMetrics - 1) * 4);
    const at = tables.glyf + loca(g);
    const [xMin, , xMax, yMax] = [0, 2, 4, 6].map((o) => b.readInt16BE(at + 2 + o));
    return { advance: advance / upem, lsb: xMin / upem, rsb: (advance - xMax) / upem, top: yMax / upem };
  };
  const gsubFeatures = new Set<string>();
  if (tables.GSUB) {
    const list = tables.GSUB + b.readUInt16BE(tables.GSUB + 6);
    for (let i = 0; i < b.readUInt16BE(list); i++) gsubFeatures.add(b.toString('latin1', list + 2 + i * 6, list + 6 + i * 6));
  }
  return { upem, ascent: ascent / upem, descent: descent / upem, lineGap: lineGap / upem, glyph, gsubFeatures };
}

const DIGITS = '0123456789'.split('');
const numeral = tokens.type.numeral;
const literata = face(numeral.fontFamily);

describe('the numeral face metrics are the bundled file\'s own', () => {
  const m = tokens.fontMetrics[numeral.fontFamily]!;
  it('ascent and descent (hhea), to the thousandth of an em', () => {
    expect(m.ascent).toBeCloseTo(literata.ascent, 3);
    expect(m.descent).toBeCloseTo(literata.descent, 3);
    expect(literata.lineGap).toBe(0);
  });
  it('figure height is the tallest figure, figure bearing their mean left side bearing', () => {
    expect(m.figureHeight).toBeCloseTo(Math.max(...DIGITS.map((d) => literata.glyph(d).top)), 3);
    const mean = DIGITS.reduce((s, d) => s + literata.glyph(d).lsb, 0) / DIGITS.length;
    expect(Math.abs(m.figureBearing - mean)).toBeLessThan(0.001);
  });
});

describe('display figures do not close up (TestFlight build 1)', () => {
  it('the numeral asks for lining, proportional figures, and the face carries both features', () => {
    expect(numeral.fontVariant).toEqual(['lining-nums', 'proportional-nums']);
    for (const f of ['lnum', 'pnum']) expect(literata.gsubFeatures.has(f), f).toBe(true);
    // The defaults already are lining: every figure stands at least cap height, none drops like an oldstyle 3.
    for (const d of DIGITS) expect(literata.glyph(d).top, d).toBeGreaterThan(0.7);
  });
  it('figures are never tracked tighter than the face draws them', () => {
    expect(numeral.letterSpacing).toBeGreaterThanOrEqual(0);
  });
  // At +1 tracking the gap is 4.1 pt against a 4.0 pt floor: tracking below about +0.95 fails this on purpose.
  it('the 1 and 8 of "18" keep at least 1/16 em of white between their ink', () => {
    const gap = (literata.glyph('1').rsb + literata.glyph('8').lsb) * numeral.fontSize + numeral.letterSpacing;
    expect(gap).toBeGreaterThanOrEqual(numeral.fontSize / 16);
  });
  it('the line is at least as tall as the face, so iOS centres the face in it as the web does', () => {
    // React Native on iOS only centres when lineHeight is at least UIFont.lineHeight; below it, the figures sit on
    // the line's floor and their tops leave the box (RCTAttributedTextUtils, RCTApplyBaselineOffset).
    expect(numeral.lineHeight / numeral.fontSize).toBeGreaterThanOrEqual(literata.ascent + literata.descent + literata.lineGap);
  });
});
