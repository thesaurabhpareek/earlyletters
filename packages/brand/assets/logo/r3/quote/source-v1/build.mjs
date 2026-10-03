// Build every deliverable for the "two voices" mark from source.
// node packages/brand/assets/logo/r2/two-voices/source/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from './mark.mjs';
import { transform, toD, bbox, nodeCount } from './geom.mjs';
import { shoot } from './render.mjs';
import { presentation } from './presentation.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');
const ROOT = path.resolve(OUT, '../../../../../..');
const PNG = path.join(OUT, 'png');
fs.mkdirSync(PNG, { recursive: true });

export const C = { ink: '#2B2722', inkMuted: '#6B645B', paper: '#FBF8F3', accent: '#8A5A3B', accentSoft: '#F1E6DC', inkDark: '#F2ECE4', paperDark: '#161412', paperRaisedDark: '#201D1A', accentDark: '#D9A47E', line: '#E6DED3' };

// ---------- geometry, normalised: mark height = 1000 units, top-left at 0,0 ----------
function normalise(shapes, H = 1000) {
  const b = bbox(shapes); const s = H / b.h;
  return shapes.map((sh) => transform(sh, { s, tx: -b.x0 * s, ty: -b.y0 * s }));
}
const MAIN = normalise(build());
const SMALL = normalise(build(undefined, true));
const bM = bbox(MAIN), bS = bbox(SMALL);
const dMain = toD(MAIN), dSmall = toD(SMALL);

const svg = (vb, body, label = 'Early Letters symbol') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>\n`;
const pad = (b, p) => { const m = Math.max(b.w, b.h) * p; return `${r(-m)} ${r(-m)} ${r(b.w + 2 * m)} ${r(b.h + 2 * m)}`; };
const r = (n) => Math.round(n * 10) / 10;

const vbMain = pad(bM, 0.04), vbSmall = pad(bS, 0.04);
const files = {
  'symbol.svg': svg(vbMain, `<path fill="${C.ink}" d="${dMain}"/>`),
  'symbol-reversed.svg': svg(vbMain, `<path fill="${C.inkDark}" d="${dMain}"/>`),
  'symbol-accent.svg': svg(vbMain, `<path fill="${C.accent}" d="${dMain}"/>`),
  'symbol-small.svg': svg(vbSmall, `<path fill="${C.ink}" d="${dSmall}"/>`),
};
// favicon: square, small cut, follows the browser theme
{
  const sz = Math.max(bS.w, bS.h) * 1.06; const x = bS.w / 2 - sz / 2, y = bS.h / 2 - sz / 2;
  files['favicon.svg'] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(x)} ${r(y)} ${r(sz)} ${r(sz)}"><style>path{fill:${C.ink}}@media (prefers-color-scheme:dark){path{fill:${C.inkDark}}}</style><path d="${dSmall}"/></svg>\n`;
}

// ---------- wordmark (round 1 A, outlined Literata 500, joined tt) ----------
const wm = fs.readFileSync(path.join(OUT, '../../a/wordmark.svg'), 'utf8');
const wmD = wm.match(/ d="([^"]+)"/)[1];
// wordmark units: baseline y=0, cap height 701 (E), x from 58 to ~6090
function tPath(d, s, tx, ty) {
  return d.replace(/([MLQ])([^MLQZ]*)/g, (_, cmd, args) => {
    const n = args.trim().split(/[\s,]+|(?=-)/).filter(Boolean).map(Number);
    const o = []; for (let i = 0; i < n.length; i += 2) o.push(r(n[i] * s + tx), r(n[i + 1] * s + ty));
    return cmd + o.join(' ');
  });
}
const WM = { x0: 58, x1: 6098, cap: 701 };

// Horizontal lockup: symbol height = 1.45 x cap height, its ball bottoms sit 2% under the baseline (overshoot).
function lockupH(fill) {
  const H = WM.cap * 1.45; const s = H / 1000;
  const sym = MAIN.map((sh) => transform(sh, { s, tx: 0, ty: -H + H * 0.03 }));
  const gap = WM.cap * 0.62; const wx = bM.w * s + gap - WM.x0;
  const w = bM.w * s + gap + (WM.x1 - WM.x0);
  const m = WM.cap * 0.12;
  return svg(`${r(-m)} ${r(-H - m)} ${r(w + 2 * m)} ${r(H + 2 * m + 230)}`, `<path fill="${fill}" d="${toD(sym)}"/><path fill="${fill}" d="${tPath(wmD, 1, wx, 0)}"/>`, 'Early Letters');
}
function lockupS(fill) {
  const H = WM.cap * 2.5; const s = H / 1000; const symW = bM.w * s;
  const wmW = WM.x1 - WM.x0; const cx = wmW / 2;
  const sym = MAIN.map((sh) => transform(sh, { s, tx: cx - symW / 2 + symW * 0.02, ty: 0 }));
  const gap = WM.cap * 0.75; const base = H + gap + WM.cap;
  const m = WM.cap * 0.2;
  return svg(`${r(-m)} ${r(-m)} ${r(wmW + 2 * m)} ${r(base + 230 + 2 * m)}`, `<path fill="${fill}" d="${toD(sym)}"/><path fill="${fill}" d="${tPath(wmD, 1, -WM.x0, base)}"/>`, 'Early Letters');
}
files['lockup-horizontal.svg'] = lockupH(C.ink);
files['lockup-stacked.svg'] = lockupS(C.ink);
const extra = { lockupHRev: lockupH(C.inkDark), lockupSRev: lockupS(C.inkDark), lockupHAccent: lockupH(C.accent) };
for (const [f, s] of Object.entries(files)) fs.writeFileSync(path.join(OUT, f), s);

// ---------- app icon ----------
// Mark occupies 66% of the icon width; optical shift right and up because the mass sits low left.
export function icon(px, { bg = C.accent, fg = C.paper, d = dMain, b = bM, fill = 0.66, radius = 0, dx = 0.012, dy = -0.02 } = {}) {
  const sz = b.w / fill; const x = b.w / 2 - sz / 2 - dx * sz, y = b.h / 2 - sz / 2 - dy * sz;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="${r(x)} ${r(y)} ${r(sz)} ${r(sz)}"><rect x="${r(x)}" y="${r(y)}" width="${r(sz)}" height="${r(sz)}" rx="${r(sz * radius)}" fill="${bg}"/><path fill="${fg}" d="${d}"/></svg>`;
}
const iconSmall = (px, o = {}) => icon(px, { d: dSmall, b: bS, fill: 0.72, ...o });
fs.writeFileSync(path.join(HERE, 'app-icon-1024.svg'), icon(1024));

const jobs = [];
const one = (name, s, px, bg = 'transparent', h = px) => jobs.push({ html: `<style>html,body{margin:0;background:${bg}}svg{display:block}</style>${s}`, out: path.join(PNG, name), width: px, height: h, transparent: bg === 'transparent' });
one('_app-icon-1024.png', icon(1024), 1024, C.accent);
one('app-icon-dark-1024.png', icon(1024, { bg: '#000000', fg: C.accentDark }), 1024, '#000');
one('app-icon-paper-1024.png', icon(1024, { bg: C.paper, fg: C.accent }), 1024, C.paper);
one('app-icon-tinted-1024.png', icon(1024, { bg: '#000000', fg: '#E8E8E8' }), 1024, '#000');
for (const px of [16, 29, 40, 60, 180]) {
  const ic = px <= 40 ? iconSmall(px, { radius: px === 16 ? 0.18 : 0.2237 }) : icon(px, { radius: 0.2237 });
  one(`icon-${px}.png`, ic, px);
}
for (const px of [16, 29]) {
  const sz = Math.max(bS.w, bS.h) * 1.06; const vb = `${r(bS.w / 2 - sz / 2)} ${r(bS.h / 2 - sz / 2)} ${r(sz)} ${r(sz)}`;
  one(`favicon-${px}-light.png`, `<svg width="${px}" height="${px}" viewBox="${vb}"><path fill="${C.ink}" d="${dSmall}"/></svg>`, px, '#FFFFFF');
  one(`favicon-${px}-dark.png`, `<svg width="${px}" height="${px}" viewBox="${vb}"><path fill="${C.inkDark}" d="${dSmall}"/></svg>`, px, '#202124');
}
await shoot(jobs);
// opaque RGB app icon
execFileSync('python3', ['-c', `from PIL import Image
im=Image.open(r'${path.join(PNG, '_app-icon-1024.png')}').convert('RGB'); im.save(r'${path.join(OUT, 'app-icon-1024.png')}')
print(im.mode, im.size)`], { stdio: 'inherit' });
fs.unlinkSync(path.join(PNG, '_app-icon-1024.png'));

// ---------- presentation ----------
const html = presentation({ C, dMain, dSmall, bM, bS, files, extra, icon, iconSmall, nodes: { main: nodeCount(MAIN), small: nodeCount(SMALL) }, rel: path.relative(OUT, ROOT) });
fs.writeFileSync(path.join(OUT, 'presentation.html'), html);
console.log('nodes', nodeCount(MAIN), nodeCount(SMALL), 'bbox', r(bM.w), r(bM.h));
