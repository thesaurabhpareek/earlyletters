// Builds every file in packages/brand/assets/logo/a/ from Literata outlines.
// Run from the repo root:  node packages/brand/assets/logo/a/source/build.mjs
// Output is pure filled paths: no live text, no fonts, no clip paths, no masks.
import { C, toD, exactBbox, translate, scaleCmds, write, render, OUT } from './lib.mjs';
import { symbolCmds, wordmarkCmds, CUTS } from './marks.mjs';
import path from 'node:path';
import fs from 'node:fs';

/* ---------------- tuned values ---------------- */

export const WM = {
  tracking: -8,
  kern: { Ea: -12, 'y ': -22, ' L': -20, Le: -40, rl: -4, er: -4 },
};

// Horizontal lockup: the e is 1.72x the wordmark size and placed so its crease
// runs exactly through the crossbars of the e's in "Letters" (Literata 500 e
// crossbar y 244..306, centre 275). At this scale the symbol then spans the
// wordmark from descender to cap height, so it reads as a mark, not a letter.
const H = { symScale: 1.72, gapRatio: 0.42, creaseLine: 275 };
// Stacked lockup: the e is 4.2x the wordmark size, centred above it.
const S = { symScale: 4.2, gap: 360 };

const COLORWAYS = {
  // name: [symbol fill, wordmark fill, intended ground]
  ink: [C.ink, C.ink, C.paper],
  reversed: [C.inkDark, C.inkDark, C.paperDark],
  accent: [C.accent, C.ink, C.paper],
  'accent-reversed': [C.accentDark, C.inkDark, C.paperDark],
};

/* ---------------- geometry ---------------- */

const sym = symbolCmds(CUTS.master);
const symIcon = symbolCmds(CUTS.icon);
const wm = wordmarkCmds(WM).cmds;

function svgDoc({ parts, pad = 0, title, square = false }) {
  // parts: [{ cmds, fill }]
  const all = parts.flatMap((p) => p.cmds);
  const b = exactBbox(all);
  let x = b.x0 - pad, y = -b.y1 - pad, w = b.w + 2 * pad, h = b.h + 2 * pad;
  if (square) { const s = Math.max(w, h); x -= (s - w) / 2; y -= (s - h) / 2; w = h = s; }
  const r1 = (n) => Math.round(n * 10) / 10;
  const paths = parts.map((p) => `<path fill="${p.fill}" d="${toD(p.cmds)}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r1(x)} ${r1(y)} ${r1(w)} ${r1(h)}" role="img" aria-label="${title}"><title>${title}</title>${paths}</svg>\n`;
}

function horizontal() {
  const s = scaleCmds(sym, H.symScale);
  const sb = exactBbox(s);
  const wb = exactBbox(wm);
  const symPlaced = translate(s, -sb.x0, H.creaseLine - CUTS.master.crease * H.symScale);
  const wmPlaced = translate(wm, sb.w * (1 + H.gapRatio) - wb.x0, 0);
  return { symPlaced, wmPlaced };
}

function stacked() {
  const s = scaleCmds(sym, S.symScale);
  const sb = exactBbox(s);
  const wb = exactBbox(wm);
  // wordmark baseline at y=0; symbol sits above the wordmark cap height + gap
  const capTop = 701;
  const symPlaced = translate(s, wb.x0 + wb.w / 2 - (sb.x0 + sb.w / 2), capTop + S.gap - sb.y0);
  return { symPlaced, wmPlaced: wm };
}

/* ---------------- files ---------------- */

const files = [];
const NAME = 'Early Letters';
const PAD_SYM = 12;

for (const [cw, [fs1, fw]] of Object.entries(COLORWAYS)) {
  const suf = cw === 'ink' ? '' : `-${cw}`;
  // symbol: only one fill, accent symbol uses the accent colour
  files.push(['symbol' + suf, svgDoc({ parts: [{ cmds: sym, fill: fs1 }], pad: PAD_SYM, square: true, title: `${NAME} symbol` })]);
  if (cw === 'ink' || cw === 'reversed') {
    files.push(['wordmark' + suf, svgDoc({ parts: [{ cmds: wm, fill: fw }], pad: 8, title: NAME })]);
  } else {
    // accent wordmark is the wordmark set entirely in accent
    files.push(['wordmark' + suf, svgDoc({ parts: [{ cmds: wm, fill: fs1 }], pad: 8, title: NAME })]);
  }
  const h = horizontal();
  files.push(['lockup-horizontal' + suf, svgDoc({ parts: [{ cmds: h.symPlaced, fill: fs1 }, { cmds: h.wmPlaced, fill: fw }], pad: 8, title: NAME })]);
  const st = stacked();
  files.push(['lockup-stacked' + suf, svgDoc({ parts: [{ cmds: st.symPlaced, fill: fs1 }, { cmds: st.wmPlaced, fill: fw }], pad: 8, title: NAME })]);
}

for (const [name, svg] of files) write(`${name}.svg`, svg);

// Where the crease sits inside each lockup, as a fraction of the file height
// (presentation.html uses this to continue the fold across the page).
const metrics = {};
for (const [name, svg] of files) {
  const [, y, , h] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  let creaseY = null;
  if (name.startsWith('symbol')) creaseY = -CUTS.master.crease;
  if (name.startsWith('lockup-horizontal')) creaseY = -H.creaseLine;
  if (name.startsWith('lockup-stacked')) {
    const st = stacked();
    const s0 = exactBbox(scaleCmds(sym, S.symScale));
    creaseY = -(CUTS.master.crease * S.symScale + (exactBbox(st.symPlaced).y0 - s0.y0));
  }
  if (creaseY !== null) metrics[name] = Math.round(((creaseY - y) / h) * 10000) / 10000;
}
write('source/metrics.json', JSON.stringify(metrics, null, 2) + '\n');
{
  // keep the presentation's hero fold line in step with the geometry
  const pres = path.join(OUT, 'presentation.html');
  const pct = (metrics['lockup-stacked'] * 100).toFixed(2);
  fs.writeFileSync(pres, fs.readFileSync(pres, 'utf8').replace(/--crease:[0-9.]+%/g, `--crease:${pct}%`));
}

/* ---------------- favicon ---------------- */
// Small-size cut: heavier e (700) and a wider crease so the fold survives 16px.
// Pixel-snapped: the opening is exactly 1 px at 16 px (2 px at 32) and sits on
// pixel row boundaries, so the fold renders as a crisp line, not a grey smear.
{
  const nominal = exactBbox(symbolCmds(CUTS.small));
  const side = Math.ceil((Math.max(nominal.w, nominal.h) + 40) / 16) * 16;
  const u = side / 16; // units per pixel at 16 px
  const fav = symbolCmds({ ...CUTS.small, gap: u });
  const b = exactBbox(fav);
  const x = b.x0 - (side - b.w) / 2;
  // SVG y of the top edge of the opening; choose the origin so it lands on a pixel boundary
  const gapTop = -(CUTS.small.crease + u / 2);
  const yCentred = -b.y1 - (side - b.h) / 2;
  const y = gapTop - Math.round((gapTop - yCentred) / u) * u;
  const r2 = (n) => Math.round(n * 100) / 100;
  write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r2(x)} ${r2(y)} ${side} ${side}"><style>path{fill:${C.ink}}@media (prefers-color-scheme:dark){path{fill:${C.inkDark}}}</style><path d="${toD(fav)}"/></svg>\n`);
}

// preview-only copy in light ink, for showing the dark-mode favicon on a dark tile
write('source/favicon-dark-preview.svg', fs.readFileSync(path.join(OUT, 'favicon.svg'), 'utf8').replace(/<style>.*<\/style>/, `<style>path{fill:${C.inkDark}}</style>`));

/* ---------------- app icon ---------------- */
// 1024 square, no transparency (iOS masks the corners itself).
// The e sits inside the central 62% so it clears the iOS grid's inner circle.
function iconSvg(bg, fg, { size = 1024, frac = 0.5 } = {}) {
  const sym = symIcon;
  const b = exactBbox(sym);
  const k = (size * frac) / b.h;
  const cx = size / 2, cy = size / 2;
  // optical centre: nudge up 1% because the crease makes the lower half read heavier
  const dx = cx - (b.x0 + b.w / 2) * k;
  const base = cy + (b.y0 + b.h / 2) * k - size * 0.01;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bg}"/><path fill="${fg}" d="${toD(sym, dx, base, k)}"/></svg>\n`;
}
const icons = {
  'app-icon': iconSvg(C.accent, C.paper),
  'app-icon-paper': iconSvg(C.paper, C.ink),
  'app-icon-dark': iconSvg(C.paperDark, C.accentDark),
};
for (const [n, s] of Object.entries(icons)) write(`source/${n}-1024.svg`, s);

/* ---------------- PNG renders ---------------- */
if (!process.argv.includes('--no-png')) {
  const jobs = [];
  for (const [n] of Object.entries(icons)) {
    jobs.push({ file: path.join(OUT, `source/${n}-1024.svg`), out: path.join(OUT, `${n}-1024.png`), width: 1024, height: 1024 });
  }
  const pngDir = path.join(OUT, 'png');
  fs.mkdirSync(pngDir, { recursive: true });
  for (const [name, svg] of files) {
    const vb = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    const W = 1600, Hh = Math.round((W * vb[3]) / vb[2]);
    const html = `<!doctype html><style>html,body{margin:0;background:transparent}</style>${svg.replace('<svg ', `<svg width="${W}" height="${Hh}" `)}`;
    jobs.push({ html, out: path.join(pngDir, `${name}.png`), width: W, height: Hh, transparent: true });
  }
  for (const px of [16, 32, 180, 512]) {
    const svg = fs.readFileSync(path.join(OUT, 'favicon.svg'), 'utf8').replace('<svg ', `<svg width="${px}" height="${px}" `);
    jobs.push({ html: `<!doctype html><style>html,body{margin:0;background:transparent}</style>${svg}`, out: path.join(pngDir, `favicon-${px}.png`), width: px, height: px, transparent: true });
  }
  await render(jobs);
}
console.log(`wrote ${files.length} svgs + favicon + icons`);
