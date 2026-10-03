// node proof.mjs name '<glyph json>' ['<glyph json>' ...]: large outline proofs (nodes, handles, curvature comb)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glyph } from './mark.mjs';
import { toD, bbox, comb } from './g2.mjs';
import { shoot } from './render.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export function proofSvg(sh, size = 640, { combScale = 0.12, cap = 4, fill = '#ece6dd', bg = '#fff', ink = '#2B2722', combColor = '#3a7bd5' } = {}) {
  const b = bbox([sh]); const m = 0.12 * Math.max(b.w, b.h);
  const W = Math.max(b.w, b.h) + 2 * m;
  const vb = `${b.x0 + b.w / 2 - W / 2} ${b.y0 + b.h / 2 - W / 2} ${W} ${W}`;
  const sw = W / size;
  const c = comb(sh, combScale, 24, cap);
  let nodes = '', handles = '', p0 = sh.start;
  for (const g of sh.segs) { handles += `M${p0.x} ${p0.y}L${g.c1.x} ${g.c1.y}M${g.p.x} ${g.p.y}L${g.c2.x} ${g.c2.y}`; nodes += `<circle cx="${g.p.x}" cy="${g.p.y}" r="${sw * 3.2}" fill="#c0392b"/>`; for (const h of [g.c1, g.c2]) nodes += `<circle cx="${h.x}" cy="${h.y}" r="${sw * 2}" fill="#fff" stroke="#888" stroke-width="${sw}"/>`; p0 = g.p; }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${vb}" style="background:${bg}"><path d="${toD([sh])}" fill="${fill}" stroke="${ink}" stroke-width="${sw * 1.2}"/><path d="${c.teeth}" stroke="${combColor}" stroke-width="${sw * 0.6}" fill="none" opacity=".55"/><path d="${c.spine}" stroke="${combColor}" stroke-width="${sw * 1.2}" fill="none"/><path d="${handles}" stroke="#999" stroke-width="${sw * 0.8}" fill="none"/>${nodes}</svg>`;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const gs = process.argv.slice(3).map((s) => JSON.parse(s));
  const html = `<body style="margin:0;display:flex;gap:8px;background:#ddd">${gs.map((g) => proofSvg(glyph(g).shape, 640)).join('')}</body>`;
  await shoot([{ html, out: join(HERE, '..', 'sketches', process.argv[2] + '.png'), width: gs.length * 648, height: 640 }]);
}
