// Sketch boards for relationships and tail treatments. Each config renders the pair large on paper,
// then as an app icon tile at 60, 29 and 16 px (real pixels, then magnified 6x so the eye sees the pixels).
// node sketch.mjs <boardName> [--save]   (configs below; --save writes each cell into ../sketches/)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pair } from './pair.mjs';
import { glyph } from './glyph.mjs';
import { toD, bbox, xform } from './geom.mjs';
import { shoot, S } from './render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const C = { ink: '#2B2722', paper: '#FBF8F3', accent: '#8A5A3B' };

export function tile(contours, px, { bg = C.accent, fg = C.paper, fill = 0.58 } = {}) { return tileK(contours, px, null, { bg, fg, fill }); }
function tileK(contours, px, inner, { bg = C.accent, fg = C.paper, fill = 0.58 } = {}) {
  const b = bbox(contours), gm = Math.sqrt(b.w * b.h), sz = gm / fill;
  const x = b.x0 + b.w / 2 - sz / 2, y = b.y0 + b.h / 2 - sz / 2;
  return `<svg width="${px}" height="${px}" viewBox="${x} ${y} ${sz} ${sz}"><rect x="${x}" y="${y}" width="${sz}" height="${sz}" rx="${sz * 0.2237}" fill="${bg}"/>${inner ?? `<path fill="${fg}" d="${toD(contours)}"/>`}</svg>`;
}

export async function sketchBoard(name, configs, { save = false } = {}) {
  const cellHtml = (cfg) => {
    const c = cfg.contours ?? pair(cfg.pair);
    const b = bbox(c), m = Math.max(b.w, b.h) * 0.1;
    const body = (fg, bg) => cfg.knock ? `<path fill="${fg}" d="${toD([c[0]])}"/><path fill="${fg}" stroke="${bg}" stroke-width="${cfg.knock === true ? 60 : cfg.knock}" paint-order="stroke" d="${toD([c[1]])}"/>` : `<path fill="${fg}" d="${toD(c)}"/>`;
    const big = `<svg viewBox="${b.x0 - m} ${b.y0 - m} ${b.w + 2 * m} ${b.h + 2 * m}" width="380" height="300"><rect x="${b.x0 - m}" y="${b.y0 - m}" width="${b.w + 2 * m}" height="${b.h + 2 * m}" fill="#fff"/>${body(C.ink, '#fff')}</svg>`;
    const tile = (cc, px) => tileK(cc, px, cfg.knock ? body(C.paper, C.accent) : null);
    const tiles = [60, 29, 16].map((px) => `<div class=t><div style="width:${px}px;height:${px}px">${tile(c, px)}</div></div>`).join('');
    const mag = [29, 16].map((px) => `<canvas data-px="${px}" data-src="${encodeURIComponent(tile(c, px).replace("<svg ", "<svg xmlns=\x27http://www.w3.org/2000/svg\x27 "))}" width="${px * 6}" height="${px * 6}"></canvas>`).join('');
    return `<div class="c"><div class=big>${big}</div><div class=row>${tiles}${mag}</div><p><b>${cfg.id}</b> ${cfg.note ?? ''}</p></div>`;
  };
  const script = `<script>for (const cv of document.querySelectorAll('canvas')) { const px=+cv.dataset.px; const img=new Image(); img.onload=()=>{ const o=document.createElement('canvas'); o.width=o.height=px; o.getContext('2d').drawImage(img,0,0,px,px); const g=cv.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(o,0,0,px*6,px*6); }; img.src='data:image/svg+xml,'+cv.dataset.src; }</script>`;
  const css = `<style>body{margin:0;background:#FBF8F3;font:14px/1.35 system-ui;color:#333}.wrap{display:flex;flex-wrap:wrap}.c{width:460px;padding:14px 16px;box-sizing:border-box}.big{background:#fff;border:1px solid #eee}.row{display:flex;gap:12px;align-items:flex-end;margin-top:8px}p{margin:6px 0}</style>`;
  const html = `${css}<div class=wrap>${configs.map(cellHtml).join('')}</div>${script}`;
  fs.writeFileSync(S + `/q/${name}.html`, html);
  const jobs = [{ file: S + `/q/${name}.html`, out: S + `/q/${name}.png`, width: 1400, height: 400, fullPage: true, wait: 300 }];
  if (save) for (const cfg of configs) {
    const f = S + `/q/sk-${cfg.id}.html`;
    fs.writeFileSync(f, `${css}<div class=wrap>${cellHtml(cfg)}</div>${script}`);
    jobs.push({ file: f, out: path.join(HERE, '../sketches', `${cfg.id}.png`), width: 460, height: 300, fullPage: true, wait: 300 });
  }
  await shoot(jobs);
  return S + `/q/${name}.png`;
}
