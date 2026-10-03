// Round 6: glyph detail. Large ink drawings with nodes, to judge the waist, hook fillet and cut.
import { mark, G } from './quote.mjs';
import { toD, bbox, transform } from './geom.mjs';
import { shoot } from './render.mjs';
import { SCR } from './sheet.mjs';
const V = {
  cur: {},
  thick: { aOut: 200, hOut: 1.45, tOut: 1.2, w: 0.66, tip: { x: 0.9, y: -2.15 } },
  thick2: { aOut: 202, hOut: 1.5, tOut: 1.25, w: 0.68, aIn: -100, hIn: 0.3, tIn: 0.8, tip: { x: 0.92, y: -2.12 }, dir: -32 },
  thick3: { aOut: 204, hOut: 1.55, tOut: 1.3, w: 0.7, aIn: -104, hIn: 0.32, tIn: 0.85, tip: { x: 0.95, y: -2.1 }, dir: -30, cap: 0.3 },
};
let cells = '';
for (const [n, o] of Object.entries(V)) {
  const sh = [transform(mark(o), { s: 150, tx: 260, ty: 520 })];
  const nodes = sh[0].segs.map((g) => `<circle cx="${g.p.x}" cy="${g.p.y}" r="5" fill="#d33"/><line x1="${g.c2.x}" y1="${g.c2.y}" x2="${g.p.x}" y2="${g.p.y}" stroke="#d33" stroke-width="1.5"/><circle cx="${g.c2.x}" cy="${g.c2.y}" r="3" fill="#36c"/><circle cx="${g.c1.x}" cy="${g.c1.y}" r="3" fill="#3a3"/>`).join('');
  cells += `<div style="display:inline-block;margin:10px;font:14px sans-serif">${n}<br><svg width="460" height="720" style="background:#FBF8F3"><path fill="#2B2722" d="${toD(sh)}"/>${nodes}</svg></div>`;
}
await shoot([{ html: `<body style="margin:0;background:#ddd">${cells}</body>`, out: SCR + '/r6.png', width: 1960, height: 780 }]);
