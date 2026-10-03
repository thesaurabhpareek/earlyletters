// Review board: large on paper, on night, app icon, and true-pixel 16/29/60 renders magnified.
import { toD, bbox } from './geom.mjs';
import { shoot, S } from './render.mjs';
import fs from 'node:fs';
export function square(shapes, padRatio = 0.1) {
  const b = bbox(shapes); const sz = Math.max(b.w, b.h) * (1 + 2 * padRatio);
  return { vb: `${(b.x0 + b.w / 2 - sz / 2).toFixed(3)} ${(b.y0 + b.h / 2 - sz / 2).toFixed(3)} ${sz.toFixed(3)} ${sz.toFixed(3)}`, b, sz };
}
export function iconSvg(shapes, px, { bg = '#8A5A3B', fg = '#FBF8F3', fill = 0.62, radius = 0.2237, dy = 0 } = {}) {
  const b = bbox(shapes); const sz = Math.max(b.w, b.h) / fill;
  const cx = b.x0 + b.w / 2, cy = b.y0 + b.h / 2 + dy * sz;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="${cx - sz / 2} ${cy - sz / 2} ${sz} ${sz}"><rect x="${cx - sz / 2}" y="${cy - sz / 2}" width="${sz}" height="${sz}" rx="${sz * radius}" fill="${bg}"/><path fill="${fg}" d="${toD(shapes)}"/></svg>`;
}
export async function board(cands, out) {
  // first rasterise small sizes
  const jobs = [];
  const tmp = S + '/tv/px'; fs.mkdirSync(tmp, { recursive: true });
  cands.forEach((c, i) => {
    for (const px of [16, 29, 60]) {
      const shapes = (px <= 40 && c.small) ? c.small : c.shapes;
      jobs.push({ html: `<body style="margin:0">${iconSvg(shapes, px, { radius: px === 16 ? 0 : 0.2237, fill: px === 16 ? 0.8 : 0.62 })}</body>`, out: `${tmp}/${i}-${px}.png`, width: px, height: px });
      jobs.push({ html: `<body style="margin:0;background:#FBF8F3">${(() => { const q = square(shapes, 0.04); return `<svg width="${px}" height="${px}" viewBox="${q.vb}"><path fill="#2B2722" d="${toD(shapes)}"/></svg>`; })()}</body>`, out: `${tmp}/${i}-${px}-ink.png`, width: px, height: px });
    }
  });
  await shoot(jobs);
  const img = (p, m) => { const d = fs.readFileSync(p).toString('base64'); return `<img src="data:image/png;base64,${d}" style="width:${m}px;height:${m}px;image-rendering:pixelated;margin-right:10px;vertical-align:top">`; };
  let html = '<body style="margin:0;background:#FBF8F3;font:13px sans-serif;color:#555">';
  cands.forEach((c, i) => {
    const q = square(c.shapes);
    html += `<div style="padding:14px 18px;border-bottom:1px solid #ddd"><div>${c.name}</div>
      <svg width="300" height="300" viewBox="${q.vb}"><path fill="#2B2722" d="${toD(c.shapes)}"/></svg>
      <svg width="300" height="300" viewBox="${q.vb}" style="background:#161412"><path fill="#D9A47E" d="${toD(c.shapes)}"/></svg>
      ${iconSvg(c.shapes, 240)}
      <span style="display:inline-block;vertical-align:top">${img(`${tmp}/${i}-16.png`, 128)}${img(`${tmp}/${i}-29.png`, 145)}${img(`${tmp}/${i}-16-ink.png`, 128)}<br>${img(`${tmp}/${i}-60.png`, 60)}${img(`${tmp}/${i}-29.png`, 29)}${img(`${tmp}/${i}-16.png`, 16)}${img(`${tmp}/${i}-29-ink.png`, 29)}${img(`${tmp}/${i}-16-ink.png`, 16)}</span></div>`;
  });
  await shoot([{ html, out, width: 1500, height: 400, fullPage: true }]);
}
