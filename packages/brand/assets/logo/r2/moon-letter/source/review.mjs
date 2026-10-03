// Review sheet: big mark, icon tiles, and true 16/29px rasters magnified 8x (pixelated) via a two-pass render.
import { build } from './mark.mjs';
import { toD, bbox } from './bool.mjs';
import { shoot } from './render.mjs';
import fs from 'node:fs';
const INK = '#2B2722', PAPER = '#FBF8F3', ACC = '#8A5A3B', NIGHT = '#161412', ACCD = '#D9A47E';
const TMP = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/ml/';
export function svgOf(m, fill, size, pad = 0.06) {
  const b = bbox([...m.pocket, ...m.moon]), s = Math.max(b.w, b.h) * (1 + 2 * pad);
  const vb = `${b.x0 + b.w / 2 - s / 2} ${b.y0 + b.h / 2 - s / 2} ${s} ${s}`;
  return `<svg style="display:block;flex:none" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${vb}"><path fill="${fill}" d="${toD(m.pocket)}${toD(m.moon)}"/></svg>`;
}
const b64 = (s, t = 'image/svg+xml') => `data:${t};base64,` + Buffer.from(s).toString('base64');
const tile = (m, bg, fg, sz, k = 0.62) => `<div style="flex:none;width:${sz}px;height:${sz}px;background:${bg};border-radius:${sz * 0.225}px;display:grid;place-items:center">${svgOf(m, fg, Math.round(sz * k), 0)}</div>`;
export async function sheet(variants, out) {
  const ms = variants.map(([n, o]) => [n, build(o)]);
  // pass 1: raster small sizes
  const small = [];
  ms.forEach(([n, m], i) => {
    small.push({ html: `<body style="margin:0;background:${PAPER}">${svgOf(m, INK, 16, 0.02)}</body>`, out: TMP + `s16-${i}.png`, width: 16, height: 16 });
    small.push({ html: `<body style="margin:0">${tile(m, ACC, PAPER, 29)}</body>`, out: TMP + `s29-${i}.png`, width: 29, height: 29 });
  });
  await shoot(small);
  const px = (f, z) => `<img src="${b64(fs.readFileSync(f), 'image/png')}" style="flex:none;width:${z}px;image-rendering:pixelated">`;
  const html = `<body style="margin:0;background:${PAPER};font:13px system-ui;display:flex;flex-wrap:wrap;gap:22px;padding:16px">
  <style>.c{width:470px}.row{display:flex;align-items:center;gap:10px;margin-top:6px}</style>
  ${ms.map(([n, m], i) => `<div class="c"><div class="row">${svgOf(m, INK, 200)}<div style="background:${NIGHT};padding:10px;border-radius:12px">${svgOf(m, '#F2ECE4', 130)}</div>${tile(m, ACC, PAPER, 120)}</div>
  <div class="row">${tile(m, ACC, PAPER, 60)}${tile(m, NIGHT, ACCD, 60)}${tile(m, ACC, PAPER, 29)}${svgOf(m, INK, 29, 0.02)}${svgOf(m, INK, 16, 0.02)}${px(TMP + `s16-${i}.png`, 128)}${px(TMP + `s29-${i}.png`, 116)}</div><p>${n}</p></div>`).join('')}</body>`;
  await shoot([{ html, out, width: 1010, height: 400, fullPage: true }]);
}
if (process.argv[1].endsWith('review.mjs')) await sheet(JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), process.argv[2]);
