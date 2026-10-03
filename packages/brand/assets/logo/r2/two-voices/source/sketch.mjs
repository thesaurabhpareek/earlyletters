import { quote, quote2, transform, toD, bbox } from './geom.mjs';
import { shoot, S } from './render.mjs';
import fs from 'node:fs';
const OUT = S + '/tv';
const base = (o = {}) => quote2({ r: 1, aOut: 192, aIn: -62, tip: { x: 0.95, y: -2.0 }, tipDir: -28, tipW: 0.5, notchDir: -118, hOut: 0.95, hIn: 0.55, tOut: 0.75, tIn: 0.45, cap: 0.45, ...o });
const sketches = {
  G2_pair_lean: [transform(base(), { s: 1, rot: 8 }), transform(base(), { s: 0.6, rot: -10, tx: 2.25, ty: 0.4 })],
  H2_nestle: [transform(base(), { s: 1, rot: 4 }), transform(base(), { s: 0.56, rot: -8, tx: 1.75, ty: 0.44 })],
  I2_canopy: [transform(base({ tip: { x: 1.7, y: -2.0 }, tipDir: -6, tOut: 1.1, tIn: 0.8, tipW: 0.44 }), { s: 1 }), transform(base(), { s: 0.55, rot: -8, tx: 1.85, ty: 0.45 })],
  M_plain66: [transform(base(), { s: 1 }), transform(base(), { s: 1, tx: 2.6 })],
  N_bigsmall_upright: [transform(base(), { s: 1 }), transform(base(), { s: 0.62, tx: 2.05, ty: 0.38 })],
  O_tuck: [transform(base({ tip: { x: 1.3, y: -2.05 }, tipDir: -15, tOut: 0.95 }), { s: 1, rot: 6 }), transform(base(), { s: 0.5, rot: -14, tx: 1.62, ty: 0.5 })],
};
fs.writeFileSync(OUT + '/sk.json', JSON.stringify(Object.keys(sketches)));
let cells = '';
for (const [name, shapes] of Object.entries(sketches)) {
  const b = bbox(shapes); const pad = Math.max(b.w, b.h) * 0.12; const sz = Math.max(b.w, b.h) + 2 * pad;
  const vb = `${b.x0 + b.w / 2 - sz / 2} ${b.y0 + b.h / 2 - sz / 2} ${sz} ${sz}`;
  const svg = (fill, px) => `<svg width="${px}" height="${px}" viewBox="${vb}"><path fill="${fill}" d="${toD(shapes)}"/></svg>`;
  const pix = (px) => `<div style="width:${px * 6}px;height:${px * 6}px;overflow:hidden;display:inline-block;vertical-align:top;margin-left:12px"><div style="transform:scale(6);transform-origin:0 0;image-rendering:pixelated;width:${px}px">${svg('#FBF8F3', px).replace('<svg', '<svg style="background:#8A5A3B;display:block;border-radius:22%"')}</div></div>`;
  cells += `<div style="display:inline-block;margin:16px;vertical-align:top;font:14px sans-serif;color:#555">${name}<br>${svg('#2B2722', 300)}<div style="display:inline-block;background:#8A5A3B;border-radius:48px;vertical-align:top;margin-left:12px">${svg('#FBF8F3', 220)}</div><br>${pix(29)}${pix(16)}</div>`;
}
const html = `<body style="margin:0;background:#FBF8F3">${cells}</body>`;
await shoot([{ html, out: OUT + '/' + (process.argv[2] || 'sk') + '.png', width: 1700, height: 1300, fullPage: true }]);
