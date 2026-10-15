import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assetFor } from '@scribe/brand/registry';
import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import { SYMBOL_ASPECT, SYMBOL_PATH, SYMBOL_VIEWBOX, deviceAsset, deviceHeight, edgeOffset } from '../src/components/ui/quote-pair.logic';

const ROOT = join(__dirname, '..', '..', '..');
const svg = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const attr = (s: string, a: string) => new RegExp(`\\s${a}="([^"]+)"`).exec(s)?.[1];

describe('QuotePair (registry context app.brand-device)', () => {
  const assets = assetFor('app.brand-device');

  it('the registry names an accent mark for paper and a reversed mark for dark, both primary', () => {
    expect(assets.map((a) => a.id)).toEqual(['logo.symbol.accent', 'logo.symbol.reversed']);
    for (const a of assets) expect(a.status).toBe('primary');
    expect(deviceAsset('light').id).toBe('logo.symbol.accent');
    expect(deviceAsset('dark').id).toBe('logo.symbol.reversed');
  });

  it('the path and box in the app are exactly the registry files (no redrawn mark)', () => {
    for (const a of assets) {
      const file = svg(a.path!);
      expect(attr(file, 'd'), a.id).toBe(SYMBOL_PATH);
      expect(attr(file, 'viewBox'), a.id).toBe(SYMBOL_VIEWBOX);
      expect(attr(file, 'fill'), a.id).toBe(a.fill);
    }
  });

  it('is one drawing of two opening marks (two closed subpaths)', () => {
    expect(SYMBOL_PATH.match(/M/g)?.length).toBe(2);
    expect(SYMBOL_PATH.match(/Z/g)?.length).toBe(2);
  });

  it('colours are the brand accent on paper and the reversed ink on dark, readable as large graphics (3:1)', () => {
    const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const lum = (h: string) => {
      const [r, g, b] = rgb(h).map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a: string, b: string) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    expect(deviceAsset('light').fill).toBe(tokens.light.accent);
    expect(ratio(deviceAsset('light').fill!, tokens.light.bg)).toBeGreaterThanOrEqual(3);
    expect(ratio(deviceAsset('dark').fill!, tokens.dark.bg)).toBeGreaterThanOrEqual(3);
  });

  it('never smaller than the registry minimum, and the box keeps the mark aspect', () => {
    expect(deviceHeight('light', 10)).toBe(deviceAsset('light').minSize!.px);
    expect(deviceHeight('dark', 48)).toBe(48);
    expect(SYMBOL_ASPECT).toBeCloseTo(1112 / 1082.37, 4);
  });

  it('lines the visible mark up with the text edge by pulling the quiet margin left', () => {
    expect(edgeOffset(56)).toBeLessThan(0);
    expect(edgeOffset(56)).toBeGreaterThan(-4);
    expect(edgeOffset(112)).toBeLessThan(edgeOffset(56));
  });
});
