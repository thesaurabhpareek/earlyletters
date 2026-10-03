// Colour maths for the r3 tile study: WCAG 2.x contrast and OKLCH (lightness, chroma, hue).
// Run: node packages/brand/assets/logo/r3/color-type/source/colors.mjs  -> prints tables, writes colors.json
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));

export const hexToRgb = (h) => { h = h.replace('#', ''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
export const lum = (hex) => { const [r, g, b] = hexToRgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };
export function oklch(hex) {
  const [r, g, b] = hexToRgb(hex).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}
export const mix = (a, b, t) => '#' + hexToRgb(a).map((v, i) => Math.round(v + (hexToRgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');

// Tile candidates. top/bottom equal = flat.
export const TILES = [
  { id: 't0-flat-current', label: 'Flat sepia (current accent)', top: '#8A5A3B', bot: '#8A5A3B', fg: '#FBF8F3' },
  { id: 't1-flat-deep', label: 'Flat deepened', top: '#7F4F30', bot: '#7F4F30', fg: '#FBF8F3' },
  { id: 't2-grad-critic', label: 'Gradient, critic proposal', top: '#94603F', bot: '#7C4F33', fg: '#FBF8F3' },
  { id: 't3-grad-deep', label: 'Gradient, deepened base', top: '#8D5A39', bot: '#784A2C', fg: '#FBF8F3' },
  { id: 't4-grad-leather', label: 'Gradient, warmer leather', top: '#9A613C', bot: '#7D4A2C', fg: '#FBF8F3' },
  { id: 't5-grad-leather-token', label: 'Leather, base = accentDeep', top: '#9A613C', bot: '#7F4F30', fg: '#FBF8F3' },
  { id: 'p-paper', label: 'Paper tile, sepia mark', top: '#FDFBF7', bot: '#F3ECE3', fg: '#8A5A3B' },
  { id: 'n-ink', label: 'Ink tile, light sepia mark', top: '#332E28', bot: '#231F1B', fg: '#D9A47E' },
];
export const DARK = [
  { id: 'd0-current', label: 'Dark: accentDark on warm near-black', top: mix('#1F1B18', '#ffffff', 0.06), bot: '#1F1B18', fg: '#D9A47E' },
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = [];
  for (const t of [...TILES, ...DARK]) {
    const mid = mix(t.top, t.bot, 0.5);
    const o = oklch(mid), ot = oklch(t.top), ob = oklch(t.bot);
    const r = {
      id: t.id, label: t.label, top: t.top, bot: t.bot, mid, fg: t.fg,
      cTop: +contrast(t.fg, t.top).toFixed(2), cMid: +contrast(t.fg, mid).toFixed(2), cBot: +contrast(t.fg, t.bot).toFixed(2),
      L: +o.L.toFixed(3), C: +o.C.toFixed(3), h: +o.h.toFixed(1), dL: +(ot.L - ob.L).toFixed(3),
      whiteOnMid: +contrast('#FFFFFF', mid).toFixed(2),
    };
    rows.push(r);
    console.log(`${r.id.padEnd(18)} ${t.top}->${t.bot} mark ${t.fg}  contrast top/mid/bot ${r.cTop}/${r.cMid}/${r.cBot}  OKLCH L ${r.L} C ${r.C} h ${r.h}  dL ${r.dL}`);
  }
  // Token candidates
  const pairs = [
    ['accent #8A5A3B on paper', '#8A5A3B', '#FBF8F3'], ['accentDeep #7F4F30 on paper', '#7F4F30', '#FBF8F3'],
    ['paper on accentDeep', '#FBF8F3', '#7F4F30'], ['white on accentDeep', '#FFFFFF', '#7F4F30'],
    ['accentDeep on accentSoft', '#7F4F30', '#F1E6DC'], ['accentDeep on paperRaised', '#7F4F30', '#FFFFFF'],
    ['accentDark on paperDark', '#D9A47E', '#161412'], ['accentDark on dark tile #1F1B18', '#D9A47E', '#1F1B18'],
    ['accent on ink (never)', '#8A5A3B', '#2B2722'], ['accentDark on paper (never)', '#D9A47E', '#FBF8F3'],
    ['ink on paper', '#2B2722', '#FBF8F3'], ['inkDark on paperDark', '#F2ECE4', '#161412'],
  ];
  const tok = pairs.map(([n, a, b]) => ({ pair: n, ratio: +contrast(a, b).toFixed(2) }));
  tok.forEach((t) => console.log(`${t.pair.padEnd(34)} ${t.ratio}:1`));
  writeFileSync(join(HERE, '..', 'colors.json'), JSON.stringify({ tiles: rows, tokens: tok }, null, 2) + '\n');
}
