// Build every deliverable for the quote-letter round (the pure pair won; see presentation.html).
// node packages/brand/assets/logo/r3/quote-letter/source/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pair, G, PAIR } from './quote.mjs';
import { transform, toD, bbox, nodeCount } from './geom.mjs';
import { shoot } from './render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');
const PNG = path.join(OUT, 'png');
fs.mkdirSync(PNG, { recursive: true });
fs.mkdirSync(path.join(OUT, 'wordmark'), { recursive: true });

export const C = { ink: '#2B2722', inkMuted: '#6B645B', paper: '#FBF8F3', accent: '#8A5A3B', accentSoft: '#F1E6DC', inkDark: '#F2ECE4', paperDark: '#161412', paperRaisedDark: '#201D1A', accentDark: '#D9A47E', line: '#E6DED3' };
// Tile: the critics' gradient, tested against flat #8A5A3B and deep #7F4F30 (round 11). Both stops are sepia.
export const TILE = { top: '#94603F', bottom: '#7C4F33', dark: '#1F1B18' };
const r = (n) => Math.round(n * 10) / 10;

// ---------- geometry: master and small cut, normalised to height 1000, top-left at 0,0 ----------
export const SMALL = { g: { w: 0.76, rf: 0.12 }, p: { ratio: 0.66, gap: 0.22 } };
function normalise(shapes, H = 1000) { const b = bbox(shapes); const s = H / b.h; return shapes.map((sh) => transform(sh, { s, tx: -b.x0 * s, ty: -b.y0 * s })); }
const MAIN = normalise(pair());
const SM = normalise(pair(SMALL.g, SMALL.p));
const bM = bbox(MAIN), bS = bbox(SM);
const dMain = toD(MAIN), dSmall = toD(SM);

const svg = (vb, body, label = 'Early Letters symbol') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>\n`;
const pad = (b, p) => { const m = Math.max(b.w, b.h) * p; return `${r(b.x0 - m)} ${r(b.y0 - m)} ${r(b.w + 2 * m)} ${r(b.h + 2 * m)}`; };
const files = {
  'symbol.svg': svg(pad(bM, 0.04), `<path fill="${C.ink}" d="${dMain}"/>`),
  'symbol-reversed.svg': svg(pad(bM, 0.04), `<path fill="${C.inkDark}" d="${dMain}"/>`),
  'symbol-accent.svg': svg(pad(bM, 0.04), `<path fill="${C.accent}" d="${dMain}"/>`),
  'symbol-small.svg': svg(pad(bS, 0.04), `<path fill="${C.ink}" d="${dSmall}"/>`),
};
{
  const sz = Math.max(bS.w, bS.h) * 1.08; const x = bS.x0 + bS.w / 2 - sz / 2, y = bS.y0 + bS.h / 2 - sz / 2;
  files['favicon.svg'] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(x)} ${r(y)} ${r(sz)} ${r(sz)}"><style>path{fill:${C.ink}}@media (prefers-color-scheme:dark){path{fill:${C.inkDark}}}</style><path d="${dSmall}"/></svg>\n`;
}

// ---------- wordmark: W4 (EB Garamond, d-garamond), word space opened ----------
// The critics asked for about 15 percent wider word spacing. The space between "Early" and "Letters" is
// widened by 40 units on the master (15 percent of a Garamond word space of about 260 units) and 45 on the small cut.
const W4 = path.resolve(OUT, '../../r2/wordmark/d-garamond');
function openSpace(file, add) {
  const s = fs.readFileSync(path.join(W4, file), 'utf8');
  const d = s.match(/ d="([^"]+)"/)[1];
  const subs = d.match(/M[^M]*/g);
  const minX = (sp) => Math.min(...sp.match(/-?\d+\.?\d*/g).map(Number).filter((_, i) => i % 2 === 0));
  // "Early" is the first six contours (E, a, a counter, r, l, y); "Letters" starts at the L
  const shift = (sp) => sp.replace(/(-?\d+\.?\d*)([ ,]?)(-?\d+\.?\d*)/g, (m, x, sep, y) => `${r(Number(x) + add)}${sep || ' '}${y}`);
  const out = subs.map((sp, i) => (i >= 6 ? shift(sp) : sp)).join('');
  const vb = s.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number); vb[2] += add;
  return { d: out, vb, x0: minX(subs[0]) };
}
const WM = openSpace('wordmark.svg', 40), WMs = openSpace('wordmark-small.svg', 45);
const CAP = 654; // cap height of E in wordmark units (baseline y = 0)
for (const [n, w, fill] of [['wordmark.svg', WM, C.ink], ['wordmark-reversed.svg', WM, C.inkDark], ['wordmark-accent.svg', WM, C.accent], ['wordmark-small.svg', WMs, C.ink], ['wordmark-small-reversed.svg', WMs, C.inkDark]])
  fs.writeFileSync(path.join(OUT, 'wordmark', n), svg(w.vb.join(' '), `<path fill="${fill}" d="${w.d}"/>`, 'Early Letters'));

// ---------- lockups ----------
// Horizontal: the pair stands where an opening quotation mark would stand before the name. Its balls sit
// on the baseline; its height is 1.22 x cap height, so the parent's tail rises just above the capitals.
function lockupH(fill, w = WM) {
  const H = CAP * 1.22, s = H / 1000;
  const sym = MAIN.map((sh) => transform(sh, { s, tx: 0, ty: -H + H * 0.012 }));
  const gap = CAP * 0.42, wx = bM.w * s + gap - w.x0;
  const wmW = w.vb[0] + w.vb[2] - w.x0;
  const total = bM.w * s + gap + wmW, m = CAP * 0.1;
  return svg(`${r(-m)} ${r(-H - m)} ${r(total + 2 * m)} ${r(H + 2 * m + 240)}`, `<path fill="${fill}" d="${toD(sym)}"/><path fill="${fill}" transform="translate(${r(wx)} 0)" d="${w.d}"/>`, 'Early Letters');
}
function lockupS(fill, w = WM) {
  const H = CAP * 2.3, s = H / 1000, symW = bM.w * s;
  const wmW = w.vb[0] + w.vb[2] - w.x0, cx = wmW / 2;
  const sym = MAIN.map((sh) => transform(sh, { s, tx: cx - symW / 2 - symW * 0.02, ty: 0 }));
  const base = H + CAP * 0.7 + CAP, m = CAP * 0.2;
  return svg(`${r(-m)} ${r(-m)} ${r(wmW + 2 * m)} ${r(base + 240 + 2 * m)}`, `<path fill="${fill}" d="${toD(sym)}"/><path fill="${fill}" transform="translate(${r(-w.x0)} ${r(base)})" d="${w.d}"/>`, 'Early Letters');
}
files['lockup-horizontal.svg'] = lockupH(C.ink);
files['lockup-stacked.svg'] = lockupS(C.ink);
files['lockup-horizontal-small.svg'] = lockupH(C.ink, WMs);
const extra = { lockupHRev: lockupH(C.inkDark), lockupHAcc: lockupH(C.accent), lockupSRev: lockupS(C.inkDark), lockupHSmallRev: lockupH(C.inkDark, WMs) };
for (const [f, s] of Object.entries(files)) fs.writeFileSync(path.join(OUT, f), s);

// ---------- app icon ----------
// Pair height 500/1024 (49 percent), bbox centred, nudged 6 px left because the parent carries the mass.
export function icon(px, { bg = 'grad', fg = C.paper, d = dMain, b = bM, h = 500, dx = -6, dy = 0, radius = 0 } = {}) {
  const s = h / b.h, W = 1024 / s;
  const x = b.x0 + b.w / 2 - W / 2 - dx / s, y = b.y0 + b.h / 2 - W / 2 - dy / s;
  const fillBg = bg === 'grad' ? 'url(#tg)' : bg;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="${r(x)} ${r(y)} ${r(W)} ${r(W)}"><defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TILE.top}"/><stop offset="1" stop-color="${TILE.bottom}"/></linearGradient></defs><rect x="${r(x)}" y="${r(y)}" width="${r(W)}" height="${r(W)}" rx="${r(W * radius)}" fill="${fillBg}"/><path fill="${fg}" d="${d}"/></svg>`;
}
export const iconSmall = (px, o = {}) => icon(px, { d: dSmall, b: bS, h: 560, ...o });
fs.writeFileSync(path.join(HERE, 'app-icon-1024.svg'), icon(1024));
// bench inputs: symbol as placed on the 1024 canvas, and the gradient background layer
fs.writeFileSync(path.join(HERE, 'bench-symbol.svg'), icon(1024).replace(/<rect[^>]*\/>/, '').replace(/<defs>.*<\/defs>/, ''));
fs.writeFileSync(path.join(HERE, 'bench-tile.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="${TILE.top}"/><stop offset="1" stop-color="${TILE.bottom}"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/></svg>`);

const jobs = [];
const one = (name, s, px, bg = 'transparent') => jobs.push({ html: `<style>html,body{margin:0;background:${bg}}svg{display:block}</style>${s}`, out: path.join(PNG, name), width: px, height: px, transparent: bg === 'transparent' });
one('_app-icon-1024.png', icon(1024), 1024, C.accent);
one('app-icon-dark-1024.png', icon(1024, { bg: TILE.dark, fg: C.accentDark }), 1024, '#000');
one('app-icon-flat-1024.png', icon(1024, { bg: C.accent }), 1024, C.accent);
one('app-icon-tinted-1024.png', icon(1024, { bg: '#000000', fg: '#E8E8E8' }), 1024, '#000');
for (const px of [16, 29, 40, 60, 180]) one(`icon-${px}.png`, px <= 40 ? iconSmall(px, { radius: 0.2237 }) : icon(px, { radius: 0.2237 }), px);
for (const px of [16, 29, 40]) one(`icon-${px}-master.png`, icon(px, { radius: 0.2237 }), px);
for (const px of [16, 32]) {
  const sz = Math.max(bS.w, bS.h) * 1.08; const vb = `${r(bS.x0 + bS.w / 2 - sz / 2)} ${r(bS.y0 + bS.h / 2 - sz / 2)} ${r(sz)} ${r(sz)}`;
  one(`favicon-${px}-light.png`, `<svg width="${px}" height="${px}" viewBox="${vb}"><path fill="${C.ink}" d="${dSmall}"/></svg>`, px, '#FFFFFF');
  one(`favicon-${px}-dark.png`, `<svg width="${px}" height="${px}" viewBox="${vb}"><path fill="${C.inkDark}" d="${dSmall}"/></svg>`, px, '#202124');
}
// email header: horizontal lockup 28 px tall, small wordmark cut (below 20 px cap height)
const hdr = (s, h, bg) => s.replace('<svg ', `<svg height="${h}" `);
jobs.push({ html: `<style>html,body{margin:0;background:#fff}</style><div style="padding:18px 24px">${hdr(files['lockup-horizontal-small.svg'], 28)}</div>`, out: path.join(PNG, 'email-header-28.png'), width: 360, height: 64 });
jobs.push({ html: `<style>html,body{margin:0;background:${C.paperDark}}</style><div style="padding:18px 24px">${hdr(extra.lockupHSmallRev, 28)}</div>`, out: path.join(PNG, 'email-header-28-dark.png'), width: 360, height: 64 });
await shoot(jobs);
execFileSync('python3', ['-c', `from PIL import Image
im=Image.open(r'${path.join(PNG, '_app-icon-1024.png')}').convert('RGB'); im.save(r'${path.join(OUT, 'app-icon-1024.png')}')
print(im.mode, im.size)`], { stdio: 'inherit' });
fs.unlinkSync(path.join(PNG, '_app-icon-1024.png'));

const { presentation } = await import('./presentation.mjs');
fs.writeFileSync(path.join(OUT, 'presentation.html'), presentation({ C, TILE, dMain, dSmall, bM, bS, files, extra, icon, iconSmall, G, PAIR, SMALL, nodes: { main: nodeCount(MAIN), small: nodeCount(SM) }, wmD: WM.d }));
console.log('nodes', nodeCount(MAIN), nodeCount(SM), 'bbox', r(bM.w), r(bM.h));
