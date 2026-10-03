// Round 7: a real fillet in the counter (no cusp), even tail weight, perpendicular calm cut.
import { mark } from './quote.mjs';
import { toD, transform } from './geom.mjs';
import { shoot } from './render.mjs';
import { SCR } from './sheet.mjs';
const base = { aOut: 204, hOut: 1.5, tOut: 1.25, w: 0.66, tip: { x: 0.95, y: -2.12 }, dir: -32, cap: 0.28, tIn: 0.7 };
export const V = {
  a: { ...base, aIn: -62, hIn: 0.32, K: { x: 0.02, y: -1.22 }, kd: -150, k1: 0.25, k2: 0.3 },
  b: { ...base, aIn: -70, hIn: 0.28, K: { x: -0.08, y: -1.2 }, kd: -125, k1: 0.2, k2: 0.35 },
  c: { ...base, aIn: -58, hIn: 0.36, K: { x: -0.02, y: -1.26 }, kd: -135, k1: 0.28, k2: 0.4, tIn: 0.75 },
  d: { ...base, aIn: -66, hIn: 0.3, K: { x: -0.12, y: -1.28 }, kd: -105, k1: 0.18, k2: 0.42, tIn: 0.75, w: 0.62 },
};
let cells = '';
for (const [n, o] of Object.entries(V)) {
  const sh = [transform(mark(o), { s: 150, tx: 260, ty: 520 })];
  const nodes = sh[0].segs.map((g) => `<circle cx="${g.p.x}" cy="${g.p.y}" r="5" fill="#d33"/><line x1="${g.c2.x}" y1="${g.c2.y}" x2="${g.p.x}" y2="${g.p.y}" stroke="#d33" stroke-width="1.5"/><circle cx="${g.c2.x}" cy="${g.c2.y}" r="3" fill="#36c"/><circle cx="${g.c1.x}" cy="${g.c1.y}" r="3" fill="#3a3"/>`).join('');
  const small = [transform(mark(o), { s: 22, tx: 30, ty: 60 }), transform(mark(o), { s: 22 * 0.62, tx: 30 + 22 * 1.82, ty: 60 + 22 * 0.38 })];
  cells += `<div style="display:inline-block;margin:10px;font:14px sans-serif">${n}<br><svg width="460" height="720" style="background:#FBF8F3"><path fill="#2B2722" d="${toD(sh)}"/>${nodes}</svg><br><svg width="120" height="90" style="background:#8A5A3B"><path fill="#FBF8F3" d="${toD(small)}"/></svg></div>`;
}
if (process.argv[1].endsWith('r7-glyph.mjs')) await shoot([{ html: `<body style="margin:0;background:#ddd">${cells}</body>`, out: SCR + '/r7.png', width: 1960, height: 880 }]);
