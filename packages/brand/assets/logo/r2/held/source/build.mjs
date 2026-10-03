// Build every deliverable for the `held` mark from geometry. node build.mjs
// Filled paths only. Playwright (not a repo dependency) is used to rasterise PNGs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { P, deep, seat, mark, clearance, bounds } from './mark.mjs';
import { shoot } from './shoot.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');
const PNG = path.join(OUT, 'png');
fs.mkdirSync(PNG, { recursive: true });
const C = { ink: '#2B2722', inkMuted: '#6B645B', paper: '#FBF8F3', accent: '#8A5A3B', accentSoft: '#F1E6DC', line: '#E6DED3', inkDark: '#F2ECE4', paperDark: '#161412', paperRaisedDark: '#201D1A', accentDark: '#D9A47E', lineDark: '#33302C' };

// ---- the two cuts ---------------------------------------------------------
export const MAIN = seat(deep(P, { ty: 40, r: 6, c1: [20, 41], c2: [30, 70], gy: 70, page: { cx: 61, w: 15, h: 20, a: 30, r: 2.2 } }), 3.5);
export const SMALL = seat(deep(P, { sg: 2.8, ox: 4, oy: 81, ty: 38, r: 7, c1: [19, 40], c2: [30, 71], gy: 71, page: { cx: 63, w: 19, h: 24, a: 30, r: 2.8 } }), 5.6);

const bbox = bounds;
const symbolSvg = (p, fill, title = 'Early Letters') => { const b = bbox(p); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x} ${b.y} ${b.w} ${b.h}" role="img" aria-label="${title}"><title>${title}</title><path fill="${fill}" d="${mark(p).d}"/></svg>\n`; };

// ---- wordmark (reused from direction A, outlined Literata 500) --------------
const WM = fs.readFileSync(path.resolve(OUT, '../../a/wordmark.svg'), 'utf8');
const wmPath = WM.match(/ d="([^"]+)"/)[1];
const WMV = { x: 50, y: -774, w: 6048, h: 1012 }; // cap height 701, baseline 0

function lockupH(fill, markFill = fill) {
  // symbol height 1.32 x cap height, optically centred on the caps, gap 0.55 cap
  const cap = 701, b = bbox(MAIN), s = (cap * 1.32) / b.h, mw = b.w * s, gap = cap * 0.55;
  const ty = -cap / 2 - (b.h * s) / 2;
  const tx = WMV.x - gap - mw;
  const vx = tx, vy = Math.min(ty, -774), vw = WMV.x + WMV.w - tx, vh = Math.max(ty + b.h * s, 238) - vy;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx.toFixed(1)} ${vy.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}" role="img" aria-label="Early Letters"><title>Early Letters</title><path fill="${markFill}" transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)}) translate(${-b.x} ${-b.y})" d="${mark(MAIN).d}"/><path fill="${fill}" d="${wmPath}"/></svg>\n`;
}
function lockupS(fill, markFill = fill) {
  const b = bbox(MAIN), mw = 1900, s = mw / b.w, mh = b.h * s, gap = 430;
  const tx = WMV.x + WMV.w / 2 - mw / 2, ty = -774 - gap - mh;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WMV.x} ${ty.toFixed(1)} ${WMV.w} ${(238 - ty).toFixed(1)}" role="img" aria-label="Early Letters"><title>Early Letters</title><path fill="${markFill}" transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)}) translate(${-b.x} ${-b.y})" d="${mark(MAIN).d}"/><path fill="${fill}" d="${wmPath}"/></svg>\n`;
}

// app icon: full-bleed square (iOS applies the mask). Glyph width 60% of the canvas.
function iconSvg(bg, fg, size = 1024, p = MAIN, frac = 0.6) {
  const b = bbox(p), s = (size * frac) / b.w, h = b.h * s;
  const tx = (size - size * frac) / 2, ty = (size - h) / 2 - size * 0.01;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bg}"/><path fill="${fg}" transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)}) translate(${-b.x} ${-b.y})" d="${mark(p).d}"/></svg>\n`;
}
function faviconSvg() {
  const b = bbox(SMALL), side = Math.max(b.w, b.h) + 4, x = b.x - (side - b.w) / 2, y = b.y - (side - b.h) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x.toFixed(2)} ${y.toFixed(2)} ${side.toFixed(2)} ${side.toFixed(2)}"><style>path{fill:${C.ink}}@media (prefers-color-scheme:dark){path{fill:${C.inkDark}}}</style><path d="${mark(SMALL).d}"/></svg>\n`;
}

const W = (f, s) => fs.writeFileSync(path.join(OUT, f), s);
W('symbol.svg', symbolSvg(MAIN, C.ink));
W('symbol-reversed.svg', symbolSvg(MAIN, C.paper));
W('symbol-accent.svg', symbolSvg(MAIN, C.accent));
W('symbol-small.svg', symbolSvg(SMALL, C.ink));
W('favicon.svg', faviconSvg());
W('lockup-horizontal.svg', lockupH(C.ink));
W('lockup-stacked.svg', lockupS(C.ink));
fs.mkdirSync(path.join(HERE, 'gen'), { recursive: true });
const G = (f, s) => fs.writeFileSync(path.join(HERE, 'gen', f), s);
G('app-icon-1024.svg', iconSvg(C.accent, C.paper));
G('app-icon-dark-1024.svg', iconSvg(C.paperDark, C.accentDark));
G('lockup-horizontal-reversed.svg', lockupH(C.inkDark));
G('lockup-horizontal-accent.svg', lockupH(C.ink, C.accent));
G('lockup-horizontal-accent-reversed.svg', lockupH(C.inkDark, C.accentDark));
fs.writeFileSync(path.join(HERE, 'gen', 'metrics.json'), JSON.stringify({ MAIN, SMALL, clearanceMain: clearance(MAIN), clearanceSmall: clearance(SMALL) }, null, 2));

// ---- rasterise ----------------------------------------------------------------
const page = (svg, w, h, bg = 'transparent') => `<!doctype html><style>html,body{margin:0;background:${bg}}svg{display:block;width:${w}px;height:${h}px}</style>${svg}`;
const TMP = path.join(HERE, 'gen');
const jobs = [];
const job = (name, svg, w, h, bg, out = path.join(PNG, name + '.png')) => { const f = path.join(TMP, name + '.html'); fs.writeFileSync(f, page(svg, w, h, bg)); jobs.push({ file: f, out, width: w, height: h, transparent: bg === 'transparent' }); };
job('app-icon-1024-rgba', iconSvg(C.accent, C.paper), 1024, 1024, C.accent);
job('app-icon-dark-1024', iconSvg(C.paperDark, C.accentDark), 1024, 1024, C.paperDark);
for (const s of [16, 29, 32, 40, 60, 180]) {
  const p = s <= 40 ? SMALL : MAIN;
  job(`icon-${s}`, iconSvg(C.accent, C.paper, 1024, p, s <= 40 ? 0.66 : 0.6), s, s, C.accent);
  job(`icon-dark-${s}`, iconSvg(C.paperDark, C.accentDark, 1024, p, s <= 40 ? 0.66 : 0.6), s, s, C.paperDark);
}
for (const s of [16, 32]) {
  job(`favicon-${s}`, faviconSvg().replace('<svg ', '<svg '), s, s, C.paper);
  job(`favicon-dark-${s}`, faviconSvg().replace(`fill:${C.ink}}@`, `fill:${C.inkDark}}@`), s, s, C.paperDark);
}
job('symbol-1024', symbolSvg(MAIN, C.ink), 1024, Math.round((1024 * bbox(MAIN).h) / bbox(MAIN).w), 'transparent');
await shoot(jobs);
// flatten the App Store icon to opaque RGB
execFileSync('python3', ['-c', `from PIL import Image; im=Image.open('${PNG}/app-icon-1024-rgba.png').convert('RGB'); im.save('${OUT}/app-icon-1024.png'); print(im.mode, im.size)`], { stdio: 'inherit' });
fs.unlinkSync(path.join(PNG, 'app-icon-1024-rgba.png'));
console.log('built; clearance', clearance(MAIN), clearance(SMALL));
