// Build every "years" deliverable from source. Run: node build.mjs
// Filled paths only; every curve is a cubic bezier; no strokes, no live text in the logo files.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { years3 } from './mark3.mjs';
import { MAIN, SMALL } from './params.mjs';
import { shoot, done } from './render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');
const PNG = path.join(OUT, 'png');
const REPO = path.resolve(OUT, '../../../../../..');
const C = { ink: '#2B2722', inkMuted: '#6B645B', paper: '#FBF8F3', accent: '#8A5A3B', accentSoft: '#F1E6DC', line: '#E6DED3',
  inkDark: '#F2ECE4', paperDark: '#161412', paperRaisedDark: '#201D1A', accentDark: '#D9A47E', lineDark: '#33302C' };
const VB = [9, 8, 82, 82]; // tight box around the outer ring (ground at y = 90)
const main = years3(MAIN).d, small = years3(SMALL).d;
const write = (f, s) => fs.writeFileSync(path.join(OUT, f), s.trim() + '\n');
const svgSym = (d, fill, label = 'Early Letters') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB.join(' ')}" role="img" aria-label="${label}"><title>${label}</title><path fill="${fill}" d="${d}"/></svg>`;

// ---------- symbols
write('symbol.svg', svgSym(main, C.ink));
write('symbol-reversed.svg', svgSym(main, C.paper));
write('symbol-accent.svg', svgSym(main, C.accent));
write('symbol-small.svg', svgSym(small, C.ink));
write('symbol-small-reversed.svg', svgSym(small, C.paper));
write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB.join(' ')}"><style>path{fill:${C.ink}}@media (prefers-color-scheme:dark){path{fill:${C.inkDark}}}</style><path d="${small}"/></svg>`);

// ---------- wordmark (reused from direction A, unchanged)
const wm = fs.readFileSync(path.join(REPO, 'packages/brand/assets/logo/a/wordmark.svg'), 'utf8');
const wmD = wm.match(/ d="([^"]+)"/)[1];
const WM = { x: 50, y: -774, w: 6048, h: 1012, cap: 701 }; // font units, baseline y = 0
// symbol stands on the wordmark's baseline: the rings and the words share one ground
const lockupH = (ink) => {
  const s = WM.cap * 1.26 / VB[3]; // symbol height = 1.34 cap heights
  const symW = VB[2] * s, gap = symW * 0.36;
  const tx = WM.x - symW - gap - VB[0] * s, ty = -VB[3] * s - VB[1] * s; // ground (y=90) maps to baseline 0
  const minX = WM.x - symW - gap, minY = Math.min(WM.y, -VB[3] * s) - 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${Math.round(minX - 40)} ${Math.round(minY)} ${Math.round(WM.w + symW + gap + 80)} ${Math.round(WM.h - (minY - WM.y) + 20)}" role="img" aria-label="Early Letters"><title>Early Letters</title><path fill="${ink}" transform="translate(${tx.toFixed(2)} ${(ty + (90 - 90) ).toFixed(2)}) scale(${s.toFixed(4)})" d="${main}"/><path fill="${ink}" d="${wmD}"/></svg>`;
};
const lockupS = (ink) => {
  const symH = WM.w * 0.24; const s = symH / VB[3];
  const top = WM.y - symH - 300; const cx = WM.x + WM.w / 2;
  const tx = cx - (VB[0] + VB[2] / 2) * s, ty = top - VB[1] * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WM.x - 120} ${Math.round(top - 120)} ${WM.w + 240} ${Math.round(WM.h + symH + 300 + 240)}" role="img" aria-label="Early Letters"><title>Early Letters</title><path fill="${ink}" transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})" d="${main}"/><path fill="${ink}" d="${wmD}"/></svg>`;
};
write('lockup-horizontal.svg', lockupH(C.ink));
write('lockup-horizontal-reversed.svg', lockupH(C.paper));
write('lockup-stacked.svg', lockupS(C.ink));
write('lockup-stacked-reversed.svg', lockupS(C.paper));

// ---------- app icon (1024, opaque). The mark sits 1.2% below centre: its weight is at the top.
const icon = (bg, fg, d = main, scale = 0.56) => {
  const w = 1024 * scale, s = w / VB[2]; const x = (1024 - w) / 2, y = (1024 - w) / 2 + 1024 * 0.012;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="${bg}"/><path fill="${fg}" transform="translate(${(x - VB[0] * s).toFixed(2)} ${(y - VB[1] * s).toFixed(2)}) scale(${s.toFixed(4)})" d="${d}"/></svg>`;
};
fs.writeFileSync(path.join(HERE, 'app-icon-1024.svg'), icon(C.accent, C.paper));
fs.writeFileSync(path.join(HERE, 'app-icon-dark-1024.svg'), icon(C.paperDark, C.accentDark));
fs.writeFileSync(path.join(HERE, 'app-icon-paper-1024.svg'), icon(C.paper, C.accent));

// ---------- renders
const page = (svg, bg = 'transparent') => `<body style="margin:0;background:${bg}">${svg.replace('<svg ', '<svg style="display:block;width:100vw;height:100vh" ')}`;
const jobs = [];
for (const [n, bg] of [['app-icon-1024', null], ['app-icon-dark-1024', null], ['app-icon-paper-1024', null]])
  jobs.push({ html: page(fs.readFileSync(path.join(HERE, n + '.svg'), 'utf8')), out: path.join(PNG, n + '.png'), width: 1024, height: 1024 });
for (const s of [16, 29, 32, 40, 60, 180]) {
  const useSmall = s <= 40;
  jobs.push({ html: page(icon(C.accent, C.paper, useSmall ? small : main, useSmall ? 0.62 : 0.56)), out: path.join(PNG, `icon-${s}.png`), width: s, height: s });
}
for (const s of [16, 32, 48]) jobs.push({ html: page(svgSym(small, C.ink), C.paper), out: path.join(PNG, `favicon-${s}.png`), width: s, height: s });
for (const s of [16, 32]) jobs.push({ html: page(svgSym(small, C.inkDark), C.paperDark), out: path.join(PNG, `favicon-dark-${s}.png`), width: s, height: s });
jobs.push({ html: page(svgSym(main, C.ink)), out: path.join(PNG, 'symbol-1024.png'), width: 1024, height: 1024, transparent: true });
jobs.push({ html: page(svgSym(main, C.paper)), out: path.join(PNG, 'symbol-reversed-1024.png'), width: 1024, height: 1024, transparent: true });
await shoot(jobs);
await done();
// opaque RGB app icons (App Store rejects alpha)
const { execFileSync } = await import('node:child_process');
execFileSync('python3', ['-c', `
from PIL import Image
import sys
for n in ['app-icon-1024','app-icon-dark-1024','app-icon-paper-1024']:
    im = Image.open('${PNG}/' + n + '.png').convert('RGB'); im.save('${PNG}/' + n + '.png')
Image.open('${PNG}/app-icon-1024.png').save('${OUT}/app-icon-1024.png')
`]);
const nodes = (d) => (d.match(/[MC]/g) || []).length;
console.log('nodes main', nodes(main), 'small', nodes(small));
