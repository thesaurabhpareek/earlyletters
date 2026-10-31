// WCAG 2.x contrast for every mark/ground pairing in options A to D. Run: node source/contrast.mjs
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const L = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const cr = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const gray = (h) => { const l = L(h); const g = Math.round(255 * (l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055)); return g; };
const rows = [
  // [label, mark, ground]
  ['A icon light: paper mark on sepia tile (top)', '#FBF8F3', '#9A613C'],
  ['A icon light: paper mark on sepia tile (bottom)', '#FBF8F3', '#7F4F30'],
  ['A icon dark: accentDark mark on dark tile (top)', '#D9A47E', '#2C2926'],
  ['B icon: paper big mark on dark tile (top)', '#FBF8F3', '#2C2926'],
  ['B icon: accentDark small mark on dark tile (top)', '#D9A47E', '#2C2926'],
  ['B icon: accentDark small mark on dark tile (bottom)', '#D9A47E', '#1F1B18'],
  ['B lockup light: ink big mark on paper', '#2B2722', '#FBF8F3'],
  ['B lockup light: accent small mark on paper', '#8A5A3B', '#FBF8F3'],
  ['B lockup dark: inkDark big mark on night', '#F2ECE4', '#161412'],
  ['B lockup dark: accentDark small mark on night', '#D9A47E', '#161412'],
  ['A/C lockup light: ink on paper', '#2B2722', '#FBF8F3'],
  ['A/C lockup dark: inkDark on night', '#F2ECE4', '#161412'],
  ['D icon: accentDeep mark on paper tile (top)', '#7F4F30', '#FBF8F3'],
  ['D icon: accentDeep mark on paper tile (bottom)', '#7F4F30', '#EADCCB'],
  ['D tile edge vs white page', '#EADCCB', '#FFFFFF'],
  ['D tile edge vs paper page', '#FBF8F3', '#FBF8F3'],
  ['A tile edge vs paper page (bottom of tile)', '#7F4F30', '#FBF8F3'],
  ['B tile edge vs paper page (dark tile)', '#1F1B18', '#FBF8F3'],
  ['B tile edge vs night page', '#2C2926', '#161412'],
  ['A tile edge vs night page', '#7F4F30', '#161412'],
];
console.log('| Pairing | Contrast | Grayscale values (mark / ground) | 3:1 graphic floor |\n|---|---|---|---|');
for (const [t, a, b] of rows) { const r = cr(a, b); console.log(`| ${t} | ${r.toFixed(2)}:1 | ${gray(a)} / ${gray(b)} | ${r >= 3 ? 'pass' : 'FAIL'} |`); }
