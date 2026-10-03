// Builds every deliverable for the wildcard mark ("The mobile") from source.
// Usage: node build.mjs   (writes into the folder above; renders PNGs with Playwright Chromium)
import fs from 'node:fs';
import path from 'node:path';
import { C, OUT, REPO, write, render } from './lib.mjs';
import { geometry } from './mobile.mjs';

const f = (n) => Math.round(n * 10) / 10;

// Final parameters, chosen in refinement round r7 (H3 with the shorter hanger of H2).
export const BASE = { R: 130, dropR: 110, drop2: 70, m: 82, dropM: 40, s: 52, dropS: 10, w0: 40, w1: 18, v0: 30, v1: 16, top: 130, lift1: 150, lift2: 95 };
// Optical small cut for 40px and under: heavier wires and threads, shorter drops, larger small disc.
export const SMALL = { ...BASE, w0: 66, w1: 42, v0: 56, v1: 38, threadW: 42, top: 160, dropR: 60, drop2: 60, dropM: 10, dropS: 0, R: 140, m: 94, s: 68, lift1: 110, lift2: 60 };

function tight(o, padFrac = 0.04) {
  const { parts, box } = geometry(o);
  // measure the real extent of the wires too (the arcs rise above their anchors)
  const w = box.maxX - box.minX, h = box.maxY - box.minY, p = Math.max(w, h) * padFrac;
  return { parts, x: box.minX - p, y: box.minY - p, w: w + 2 * p, h: h + 2 * p };
}
const svgDoc = (vb, body, title = 'Early Letters symbol', extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${title}"><title>${title}</title>${extra}${body}</svg>\n`;
const paths = (parts, fill) => parts.map((d) => `<path fill="${fill}" d="${d}"/>`).join('');
const vbOf = (t) => `${f(t.x)} ${f(t.y)} ${f(t.w)} ${f(t.h)}`;

const main = tight(BASE), small = tight(SMALL);
const MAIN_L = small; // the heavier cut matches Literata 500 stems in lockups
write('symbol.svg', svgDoc(vbOf(main), paths(main.parts, C.ink)));
write('symbol-reversed.svg', svgDoc(vbOf(main), paths(main.parts, C.paper)));
write('symbol-accent.svg', svgDoc(vbOf(main), paths(main.parts, C.accent)));
write('symbol-small.svg', svgDoc(vbOf(small), paths(small.parts, C.ink)));
// Favicon: square, small cut, follows the browser colour scheme.
const sq = (t) => { const s = Math.max(t.w, t.h); return `${f(t.x + t.w / 2 - s / 2)} ${f(t.y + t.h / 2 - s / 2)} ${f(s)} ${f(s)}`; };
write('favicon.svg', svgDoc(sq(small), paths(small.parts, 'currentColor').replaceAll('fill="currentColor"', 'class="m"'), 'Early Letters',
  `<style>.m{fill:${C.ink}}@media (prefers-color-scheme:dark){.m{fill:${C.inkDark}}}</style>`));

// Wordmark: reuse round 1 A (outlined Literata 500, joined tt).
const wm = fs.readFileSync(path.join(OUT, '../../a/wordmark.svg'), 'utf8');
const wmD = wm.match(/ d="([^"]+)"/)[1];
const WM = { x: 50, y: -774, w: 6048, h: 1012, cap: 701 };

function lockupH(fill, main = MAIN_L) {
  // symbol height 1.3x cap height; its optical centre (the disc row) sits on the cap middle.
  // the mobile hangs so that its large disc rests on the baseline, like a letter
  const H = WM.cap * 1.62, s = H / main.h, symW = main.w * s, gap = WM.cap * 0.55;
  const sx = WM.x - symW - gap, sy = 12 - H;
  const g = `<g transform="translate(${f(sx)} ${f(sy)}) scale(${(s).toFixed(5)}) translate(${f(-main.x)} ${f(-main.y)})">${paths(main.parts, fill)}</g>`;
  const minX = sx - 20, minY = Math.min(sy, WM.y) - 20, maxX = WM.x + WM.w + 20, maxY = Math.max(sy + H, WM.y + WM.h) + 20;
  return svgDoc(`${f(minX)} ${f(minY)} ${f(maxX - minX)} ${f(maxY - minY)}`, g + `<path fill="${fill}" d="${wmD}"/>`, 'Early Letters');
}
function lockupS(fill, main = MAIN_L) {
  const symW = WM.w * 0.5, s = symW / main.w, H = main.h * s, gap = WM.cap * 0.75;
  const sx = WM.x + WM.w / 2 - symW / 2, sy = WM.y - gap - H;
  const g = `<g transform="translate(${f(sx)} ${f(sy)}) scale(${(s).toFixed(5)}) translate(${f(-main.x)} ${f(-main.y)})">${paths(main.parts, fill)}</g>`;
  return svgDoc(`${f(WM.x - 20)} ${f(sy - 20)} ${f(WM.w + 40)} ${f(WM.y + WM.h - sy + 40)}`, g + `<path fill="${fill}" d="${wmD}"/>`, 'Early Letters');
}
write('lockup-horizontal.svg', lockupH(C.ink));
write('lockup-stacked.svg', lockupS(C.ink));
write('source/out/lockup-horizontal-reversed.svg', lockupH(C.paper));
write('source/out/lockup-horizontal-accent.svg', lockupH(C.accent));
write('source/out/lockup-horizontal-small.svg', lockupH(C.ink, small));

// App icon 1024: accent field, paper mark at 70% width, optically raised a touch.
function iconSvg(bg, fg, o = BASE, wFrac = 0.70, size = 1024) {
  const t = tight(o, 0); const s = (size * wFrac) / t.w; const H = t.h * s;
  const tx = (size - t.w * s) / 2, ty = (size - H) / 2 - size * 0.01;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bg}"/><g transform="translate(${f(tx)} ${f(ty)}) scale(${s.toFixed(5)}) translate(${f(-t.x)} ${f(-t.y)})">${paths(t.parts, fg)}</g></svg>`;
}
write('source/out/app-icon-1024.svg', iconSvg(C.accent, C.paper, BASE, 0.74));
write('source/out/app-icon-dark-1024.svg', iconSvg(C.paperDark, C.accentDark));
write('source/out/app-icon-small-1024.svg', iconSvg(C.accent, C.paper, SMALL, 0.74));
const page = (svg, size) => `<!doctype html><html><body style="margin:0">${svg.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`)}</body></html>`;
const jobs = [
  { html: page(iconSvg(C.accent, C.paper, BASE, 0.74), 1024), out: path.join(OUT, 'app-icon-1024.png'), width: 1024, height: 1024 },
  { html: page(iconSvg(C.paperDark, C.accentDark), 1024), out: path.join(OUT, 'png/app-icon-dark-1024.png'), width: 1024, height: 1024 },
];
fs.mkdirSync(path.join(OUT, 'png'), { recursive: true });
await render(jobs);
// Flatten to opaque RGB (App Store rejects alpha).
const { execFileSync } = await import('node:child_process');
execFileSync('python3', ['-c', `from PIL import Image\nfor p in ${JSON.stringify(jobs.map((j) => j.out))}:\n  Image.open(p).convert('RGB').save(p)`]);
console.log('built', { main: vbOf(main), small: vbOf(small), repo: REPO });
