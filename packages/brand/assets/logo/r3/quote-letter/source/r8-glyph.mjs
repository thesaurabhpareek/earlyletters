// Round 8: the constructed "6": round ball + constant-width tail cut from an annulus tangent to the ball,
// a real fillet in the counter (no notch, no cusp), a calm cut.
import { quoteArc, toD, transform } from './geom.mjs';
import { shoot } from './render.mjs';
import { SCR } from './sheet.mjs';
export const V = {
  e: { Ro: 3.3, aT: 200, tipA: 248, w: 0.6, rf: 0.14, cap: 0.15 },
  f: { Ro: 3.6, aT: 201, tipA: 246, w: 0.6, rf: 0.14, cap: 0.15 },
  g: { Ro: 4.0, aT: 202, tipA: 243, w: 0.6, rf: 0.15, cap: 0.15 },
  h: { Ro: 3.4, aT: 198, tipA: 252, w: 0.64, rf: 0.13, cap: 0.15 },
};
let cells = '';
for (const [n, o] of Object.entries(V)) {
  const q = quoteArc(o);
  const sh = [transform(q, { s: 140, tx: 220, ty: 520 })];
  const nodes = sh[0].segs.map((g) => `<circle cx="${g.p.x}" cy="${g.p.y}" r="5" fill="#d33"/>`).join('');
  const small = [transform(q, { s: 22, tx: 34, ty: 64 }), transform(q, { s: 22 * 0.62, tx: 34 + 22 * 1.82, ty: 64 + 22 * 0.38 })];
  cells += `<div style="display:inline-block;margin:10px;font:14px sans-serif">${n} ${JSON.stringify(o)}<br><svg width="460" height="700" style="background:#FBF8F3"><path fill="#2B2722" d="${toD(sh)}"/>${nodes}</svg><br><svg width="120" height="90" style="background:#8A5A3B"><path fill="#FBF8F3" d="${toD(small)}"/></svg></div>`;
}
if (process.argv[1].endsWith('r8-glyph.mjs')) await shoot([{ html: `<body style="margin:0;background:#ddd">${cells}</body>`, out: SCR + '/r9.png', width: 1960, height: 860 }]);
