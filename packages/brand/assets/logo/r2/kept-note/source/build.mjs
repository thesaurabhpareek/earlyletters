// Builds every kept-note deliverable from source. Run: node source/build.mjs
// Outputs filled paths only (no strokes, no live text) into the kept-note folder.
import fs from 'node:fs';
import path from 'node:path';
import { C, OUT, ROOT, r, render, write } from './lib.mjs';
import { mark, mapPath, bbox } from './mark.mjs';

// ---- the three cuts -------------------------------------------------------
// Main: a note folded once, opened a little; the left leaf faces you, the right turns away.
export const MAIN = { slot: 'both', gap: 20, W: 330, wL: 330, dyL: 0, wR: 240, dyR: 70, top: 140, bot: 860, hw: 150, hh: 270, ht: 190, notch: 0.24, shoulder: 0.36, pull: 0.42, rad: 24 };
// Small (29 to 40 px): wider crease, bigger heart, a little less turn, softer corners.
export const SMALL = { ...MAIN, gap: 44, hw: 195, hh: 345, ht: 150, wR: 270, dyR: 56, rad: 40 };
// Favicon (16 px): the crease is carried by the silhouette alone, so the heart stays whole.
export const FAV = { ...MAIN, slot: 'none', hw: 200, hh: 350, ht: 150, wR: 270, dyR: 70, rad: 40 };

const TITLE = 'Early Letters symbol';
/** Square, tight viewBox around d with a margin (fraction of height). */
function squareBox(d, m = 0.04) {
  const b = bbox(d), s = b.h * (1 + 2 * m), cx = b.x0 + b.w / 2, cy = b.y0 + b.h / 2;
  return `${r(cx - s / 2)} ${r(cy - s / 2)} ${r(s)} ${r(s)}`;
}
const svgDoc = (vb, body, title = TITLE, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${title}"><title>${title}</title>${extra}${body}</svg>\n`;
const P = (d, fill) => `<path fill="${fill}" d="${d}"/>`;

export const dMain = mark(MAIN), dSmall = mark(SMALL), dFav = mark(FAV);

// ---- wordmark (reused from direction A: outlined Literata 500, joined tt) ----
const wmSrc = fs.readFileSync(path.join(ROOT, 'packages/brand/assets/logo/a/wordmark.svg'), 'utf8');
const wmD = [...wmSrc.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join('');
const wmB = bbox(wmD); // font units, baseline y = 0, cap height ~701
const CAP = 701;

function lockupH(fill) {
  // symbol: 1.3 cap heights tall, centred on the cap height, then a gap of 0.42 symbol widths.
  const b = bbox(dMain), h = CAP * 1.3, s = h / b.h;
  const top = -CAP / 2 - h / 2;
  const sym = mapPath(dMain, ([x, y]) => [(x - b.x0) * s, top + (y - b.y0) * s]);
  const symW = b.w * s, gap = symW * 0.5;
  const wm = mapPath(wmD, ([x, y]) => [x - wmB.x0 + symW + gap, y]);
  const x1 = symW + gap + wmB.w, y0 = Math.min(top, wmB.y0), y1 = Math.max(top + h, wmB.y1);
  const pad = 24;
  return svgDoc(`${-pad} ${r(y0 - pad)} ${r(x1 + 2 * pad)} ${r(y1 - y0 + 2 * pad)}`, P(sym, fill) + P(wm, fill), 'Early Letters');
}
function lockupS(fill) {
  const b = bbox(dMain), h = CAP * 2.3, s = h / b.h, symW = b.w * s;
  const gap = CAP * 0.62;
  const top = wmB.y0 - gap - h; // wmB.y0 is the cap top (negative)
  const cx = wmB.x0 + wmB.w / 2;
  const sym = mapPath(dMain, ([x, y]) => [cx - symW / 2 + (x - b.x0) * s, top + (y - b.y0) * s]);
  const pad = 24;
  return svgDoc(`${r(wmB.x0 - pad)} ${r(top - pad)} ${r(wmB.w + 2 * pad)} ${r(wmB.y1 - top + 2 * pad)}`, P(sym, fill) + P(wmD, fill), 'Early Letters');
}

export function iconSVG({ bg = C.accent, fg = C.paper, d = dMain, size = 1024, markH = 0.6, radius = 0 } = {}) {
  // Mark centred on the iOS grid, optical nudge up 1% (a heavy lower half sits low).
  const b = bbox(d), s = (size * markH) / b.h;
  const md = mapPath(d, ([x, y]) => [size / 2 + (x - (b.x0 + b.w / 2)) * s, size / 2 - size * 0.01 + (y - (b.y0 + b.h / 2)) * s]);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/><path fill="${fg}" d="${md}"/></svg>`;
}

if (process.argv[1].endsWith('build.mjs')) {
  const vb = squareBox(dMain), vbS = squareBox(dSmall), vbF = squareBox(dFav, 0.02);
  write('symbol.svg', svgDoc(vb, P(dMain, C.ink)));
  write('symbol-reversed.svg', svgDoc(vb, P(dMain, C.inkDark)));
  write('symbol-accent.svg', svgDoc(vb, P(dMain, C.accent)));
  write('symbol-small.svg', svgDoc(vbS, P(dSmall, C.ink), 'Early Letters symbol, small'));
  write('favicon.svg', svgDoc(vbF, `<path d="${dFav}"/>`, 'Early Letters',
    `<style>path{fill:${C.accent}}@media (prefers-color-scheme:dark){path{fill:${C.accentDark}}}</style>`));
  write('lockup-horizontal.svg', lockupH(C.ink));
  write('lockup-stacked.svg', lockupS(C.ink));
  // extra colourways used by the presentation
  write('png/lockup-horizontal-reversed.svg', lockupH(C.inkDark));
  write('source/app-icon-1024.svg', iconSVG());
  write('source/app-icon-dark-1024.svg', iconSVG({ bg: C.paperDark, fg: C.accentDark }));
  write('source/app-icon-paper-1024.svg', iconSVG({ bg: C.paper, fg: C.accent }));
  write('source/app-icon-small-180.svg', iconSVG({ d: dSmall, size: 180, markH: 0.62 }));

  // PNGs: render then strip alpha for the App Store icon (opaque RGB).
  const sharp = (await import(path.join(ROOT, 'node_modules/sharp/dist/index.cjs'))).default;
  const jobs = [
    ['source/app-icon-1024.svg', 'png/_app-icon-1024-rgba.png', 1024],
    ['source/app-icon-dark-1024.svg', 'png/app-icon-dark-1024.png', 1024],
    ['source/app-icon-paper-1024.svg', 'png/app-icon-paper-1024.png', 1024],
  ];
  await render(jobs.map(([src, out, s]) => ({ html: `<body style="margin:0">${fs.readFileSync(path.join(OUT, src), 'utf8')}</body>`, out: path.join(OUT, out), width: s, height: s })));
  await sharp(path.join(OUT, 'png/_app-icon-1024-rgba.png')).removeAlpha().toColourspace('srgb').png().toFile(path.join(OUT, 'app-icon-1024.png'));
  fs.unlinkSync(path.join(OUT, 'png/_app-icon-1024-rgba.png'));
  for (const f of ['png/app-icon-dark-1024.png', 'png/app-icon-paper-1024.png']) {
    const buf = await sharp(path.join(OUT, f)).removeAlpha().png().toBuffer(); fs.writeFileSync(path.join(OUT, f), buf);
  }
  const meta = await sharp(path.join(OUT, 'app-icon-1024.png')).metadata();
  console.log('app icon', meta.width, meta.height, meta.channels, 'channels', meta.hasAlpha ? 'alpha' : 'opaque');
  const nodes = (d) => (d.match(/[MLQCZ]/g) || []).length;
  console.log('nodes main', nodes(dMain), 'small', nodes(dSmall), 'fav', nodes(dFav));
}
