// Builds every deliverable for the moon-letter direction from mark.mjs.
// Run: node packages/brand/assets/logo/r2/moon-letter/source/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './mark.mjs';
import { toD, bbox, transform } from './bool.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');
const WORDMARK = path.resolve(HERE, '../../../a/wordmark.svg');
export const C = { ink: '#2B2722', paper: '#FBF8F3', accent: '#8A5A3B', inkDark: '#F2ECE4', paperDark: '#161412', accentDark: '#D9A47E', accentSoft: '#F1E6DC' };

// Master (any size above 40px) and the optical cut for 40px and below.
// The moon rests in the envelope's V: its outer circle sits on the axis, tangent to both arms
// at a distance of `gap`, so nothing of the moon is ever clipped.
const TH = Math.atan2(740 - 465, 500 - 90);
const rest = (R, gap) => 740 - (R + gap + 1) / Math.cos(TH);
const POCKET = { x0: 90, x1: 910, vx: 500, ty: 465, vy: 740, by: 900 };
export const MASTER = { ...POCKET, rTop: 26, rV: 50, rBot: 66, gap: 40, mx: 500, my: rest(260, 40), R: 260, bx: -140, by_: -105, br: 215 };
export const SMALL = { ...POCKET, rTop: 50, rV: 90, rBot: 85, gap: 80, mx: 500, my: rest(280, 80), R: 280, bx: -140, by_: -100, br: 215 };
export const ICON = { dx: 0, dy: 0.002, scale: 0.6 }; // optical placement inside the app-icon square

// Normalise a mark to a box: origin top-left, height H.
export function normalised(params, H = 1000) {
  const m = build(params), all = [...m.pocket, ...m.moon], b = bbox(all), k = H / b.h;
  const f = ([x, y]) => [(x - b.x0) * k, (y - b.y0) * k];
  return { d: toD(transform(m.pocket, f)) + toD(transform(m.moon, f)), w: b.w * k, h: H };
}
const svg = (vb, body, label = 'Early Letters') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>\n`;
const round = (n) => Math.round(n * 10) / 10;
function symbolSvg(params, fill) {
  const s = normalised(params), pad = 40, side = Math.max(s.w, s.h) + 2 * pad;
  const ox = (side - s.w) / 2, oy = (side - s.h) / 2;
  return svg(`${round(-ox)} ${round(-oy)} ${round(side)} ${round(side)}`, `<path fill="${fill}" d="${s.d}"/>`);
}
export function wordmark() {
  const src = fs.readFileSync(WORDMARK, 'utf8');
  return { d: src.match(/ d="([^"]+)"/)[1], x0: 50, y0: -774, w: 6048, h: 1012 };
}
// Horizontal: envelope bottom on the baseline, moon rising just above cap height.
function lockupH(fill) {
  const wm = wordmark(), H = 820, s = normalised(MASTER, H), gap = 330;
  const sx = 0, wx = s.w + gap - 58; // wordmark glyphs start at x=58
  const body = `<path fill="${fill}" transform="translate(${sx} ${-H})" d="${s.d}"/><path fill="${fill}" transform="translate(${round(wx)} 0)" d="${wm.d}"/>`;
  return svg(`-20 ${-H - 20} ${round(wx + 58 + 6048 - 50 + 40)} ${H + 20 + 260}`, body);
}
function lockupS(fill) {
  const wm = wordmark(), H = 1700, s = normalised(MASTER, H), gap = 520;
  const cx = 50 + 6048 / 2, sx = cx - s.w / 2, sy = -774 - gap - H;
  const body = `<path fill="${fill}" transform="translate(${round(sx)} ${round(sy)})" d="${s.d}"/><path fill="${fill}" d="${wm.d}"/>`;
  return svg(`10 ${round(sy - 40)} 6128 ${round(-sy + 40 + 280)}`, body);
}
export function iconSvg(size = 1024, bg = C.accent, fg = C.paper, params = MASTER, ic = ICON) {
  const s = normalised(params), k = (size * ic.scale) / Math.max(s.w, s.h);
  const x = size / 2 - (s.w * k) / 2 + ic.dx * size, y = size / 2 - (s.h * k) / 2 + ic.dy * size;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bg}"/><path fill="${fg}" transform="translate(${round(x)} ${round(y)}) scale(${k.toFixed(5)})" d="${s.d}"/></svg>\n`;
}
function favicon() {
  const s = normalised(SMALL), pad = 20, side = Math.max(s.w, s.h) + 2 * pad, ox = (side - s.w) / 2, oy = (side - s.h) / 2;
  return svg(`${round(-ox)} ${round(-oy)} ${round(side)} ${round(side)}`, `<style>path{fill:${C.ink}}@media (prefers-color-scheme:dark){path{fill:${C.inkDark}}}</style><path d="${s.d}"/>`);
}
export function writeAll() {
  const w = (f, s) => fs.writeFileSync(path.join(OUT, f), s);
  w('symbol.svg', symbolSvg(MASTER, C.ink));
  w('symbol-reversed.svg', symbolSvg(MASTER, C.inkDark));
  w('symbol-accent.svg', symbolSvg(MASTER, C.accent));
  w('symbol-small.svg', symbolSvg(SMALL, C.ink));
  w('favicon.svg', favicon());
  w('lockup-horizontal.svg', lockupH(C.ink));
  w('lockup-stacked.svg', lockupS(C.ink));
  w('source/app-icon-1024.svg', iconSvg());
  w('source/app-icon-dark-1024.svg', iconSvg(1024, C.paperDark, C.accentDark));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeAll();
  const { shoot } = await import('./render.mjs');
  const icon = iconSvg();
  await shoot([{ html: `<body style="margin:0">${icon}</body>`, out: path.join(OUT, 'png/app-icon-1024-rgba.png'), width: 1024, height: 1024 }]);
  console.log('built');
}
