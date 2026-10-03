// One refinement round: node refine.mjs <round> '<json MARK overrides>'
// Writes scratchpad/q/<round>-2000.png (the pair 2000 px wide on paper) and <round>-board.png
import fs from 'node:fs';
import { pair, measure } from './pair.mjs';
import { MARK } from './mark.mjs';
import { toD, bbox, comb, g2Report } from './geom.mjs';
import { tile } from './sketch.mjs';
import { shoot, S } from './render.mjs';
const round = process.argv[2] ?? 'r0';
const o = { ...MARK, ...JSON.parse(process.argv[3] ?? '{}') };
o.glyphOpts = { ...MARK.glyphOpts, ...(o.glyphOpts ?? {}) };
const c = pair(o);
const b = bbox(c), m = b.w * 0.07;
const vb = `${b.x0 - m} ${b.y0 - m} ${b.w + 2 * m} ${b.h + 2 * m}`;
const H2000 = (2000 * (b.h + 2 * m)) / (b.w + 2 * m);
const big = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="2000" height="${H2000}"><rect x="${b.x0 - m}" y="${b.y0 - m}" width="100%" height="100%" fill="#FBF8F3"/><path fill="#2B2722" d="${toD(c)}"/></svg>`;
const combSvg = `<svg viewBox="${vb}" width="900"><path fill="#2B2722" opacity=".8" d="${toD(c)}"/>${comb([c[0]], { scale: 3000 })}</svg>`;
const enc = (s) => encodeURIComponent(s.replace('<svg ', "<svg xmlns='http://www.w3.org/2000/svg' "));
const tiles = [180, 60, 40, 29, 16].map((px) => `<div>${tile(c, px)}<br><small>${px}</small></div>`).join('');
const dark = [180, 60, 29].map((px) => `<div>${tile(c, px, { bg: '#1F1B18', fg: '#D9A47E' })}</div>`).join('');
const mag = [29, 16].map((px) => `<canvas data-px="${px}" data-src="${enc(tile(c, px))}" width="${px * 8}" height="${px * 8}"></canvas>`).join('');
const mm = measure(c), g2 = Math.max(...g2Report(c[0]).filter((r) => !r.corner).map((r) => r.jump));
const script = `<script>for (const cv of document.querySelectorAll('canvas')) { const px=+cv.dataset.px; const img=new Image(); img.onload=()=>{ const o=document.createElement('canvas'); o.width=o.height=px; o.getContext('2d').drawImage(img,0,0,px,px); const g=cv.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(o,0,0,px*8,px*8); }; img.src='data:image/svg+xml,'+cv.dataset.src; }</script>`;
fs.writeFileSync(S + `/q/${round}-board.html`, `<style>body{margin:0;background:#FBF8F3;font:14px system-ui;padding:16px}.r{display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap}</style><div class=r>${combSvg}<div><div class=r>${tiles}</div><div class=r style="margin-top:12px">${dark}</div><div class=r style="margin-top:12px">${mag}</div><p>${round}: gap ${mm.gap.toFixed(1)}, bbox ${b.w.toFixed(0)} x ${b.h.toFixed(0)}, mass centre ${(mm.cx - b.x0).toFixed(0)}, ${(mm.cy - b.y0).toFixed(0)}, max G2 jump ${g2}</p></div></div>${script}`);
fs.writeFileSync(S + `/q/${round}-2000.svg`, big);
await shoot([
  { file: S + `/q/${round}-board.html`, out: S + `/q/${round}-board.png`, width: 1500, height: 700, fullPage: true, wait: 300 },
  { file: S + `/q/${round}-2000.svg`, out: S + `/q/${round}-2000.png`, width: 2000, height: Math.ceil(H2000) },
]);
console.log(S + `/q/${round}-board.png`);
