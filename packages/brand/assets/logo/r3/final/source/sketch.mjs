// Iteration sketches: node sketch.mjs <name> '<json variants>'
// Each variant: { label, g: glyph params, p: pair params, kid: kid glyph params, box: fraction of tile, dx, dy }
// Renders: proof (outline + nodes + handles + curvature comb, parent alone), tile 1024 (scaled to 300), 60/29/16 px.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pair, glyph } from './mark.mjs';
import { toD, bbox, comb, minGap, areaCentroid, transform } from './g2.mjs';
import { place, tileSvg } from './layout.mjs';
import { shoot } from './render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'sketches');
mkdirSync(OUT, { recursive: true });
const name = process.argv[2] || 'sk';
const variants = JSON.parse(process.argv[3] || '[{"label":"default"}]');

function proof(sh, size = 360) {
  const b = bbox([sh]); const m = 0.15 * Math.max(b.w, b.h);
  const vb = `${b.x0 - m} ${b.y0 - m} ${b.w + 2 * m} ${b.h + 2 * m}`;
  const sw = (b.h + 2 * m) / size;
  const c = comb(sh, 0.12, 20, 4);
  let nodes = '', handles = '', p0 = sh.start;
  for (const g of sh.segs) { handles += `M${p0.x} ${p0.y}L${g.c1.x} ${g.c1.y}M${g.p.x} ${g.p.y}L${g.c2.x} ${g.c2.y}`; nodes += `<circle cx="${g.p.x}" cy="${g.p.y}" r="${sw * 3}" fill="#c33"/>`; p0 = g.p; }
  return `<svg width="${size}" height="${size}" viewBox="${vb}" style="background:#fff"><path d="${toD([sh])}" fill="#ece6dd" stroke="#2B2722" stroke-width="${sw}"/><path d="${c.teeth}" stroke="#3a7bd5" stroke-width="${sw * 0.5}" fill="none" opacity=".6"/><path d="${c.spine}" stroke="#3a7bd5" stroke-width="${sw}" fill="none"/><path d="${handles}" stroke="#999" stroke-width="${sw * 0.7}" fill="none"/>${nodes}</svg>`;
}

const cols = [];
for (const v of variants) {
  const P = pair(v.g || {}, v.p || {}, v.kid || null);
  const pl = place(P.shapes, v);
  const gap = minGap(pl.shapes[0], pl.shapes[1]);
  const icon = (px, mode = 'default') => tileSvg(pl, px, { mode, radius: 0.2237 });
  const info = `${v.label}<br>box ${(pl.box.w / 10.24).toFixed(1)}% x ${(pl.box.h / 10.24).toFixed(1)}%, gap ${gap.toFixed(1)}px@1024, mass ${pl.mass.cx.toFixed(0)},${pl.mass.cy.toFixed(0)}<br>${P.big.shape.report.filter((r) => !r.ok).length} non-G2 joins`;
  cols.push(`<div class="c"><div class="lab">${info}</div>${proof(P.big.shape)}<div style="width:360px;height:360px">${icon(360)}</div><div class="row">${icon(120)}${icon(60)}<div style="width:120px;height:120px">${icon(120, 'dark')}</div></div><div class="row">${icon(60)}${icon(40)}${icon(29)}${icon(16)}</div><div class="row px"><img src="" data-px="29"><img src="" data-px="16"></div></div>`);
}
const html = `<!doctype html><html><head><style>body{margin:0;padding:16px;background:#e9e4dc;font:12px/1.3 system-ui;display:flex;gap:20px;align-items:flex-start}
.c{display:flex;flex-direction:column;gap:10px;width:360px}.row{display:flex;gap:10px;align-items:flex-end}.lab{height:48px}svg{display:block}</style></head><body>${cols.join('')}</body></html>`;
writeFileSync(join(OUT, `${name}.html`), html);
await shoot([{ html, out: join(OUT, `${name}.png`), width: 16 + variants.length * 380 + 20, height: 1080, fullPage: true }]);
// magnified small sizes
const mag = [];
for (const v of variants) {
  const P = pair(v.g || {}, v.p || {}, v.kid || null);
  const pl = place(P.shapes, v);
  mag.push(pl);
}
console.log(join(OUT, `${name}.png`));
for (const v of variants) { const P = pair(v.g || {}, v.p || {}, v.kid || null); console.log(v.label, JSON.stringify(P.big.shape.report.filter((r) => !r.ok || r.split))); }
