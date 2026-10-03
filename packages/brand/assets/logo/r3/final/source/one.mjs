// node one.mjs name '<variant json>' [mode] : one 1024 tile render for close inspection
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pair } from './mark.mjs';
import { place, tileSvg } from './layout.mjs';
import { minGap } from './g2.mjs';
import { shoot } from './render.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const v = JSON.parse(process.argv[3] || '{}');
const P = pair(v.g || {}, v.p || {}, v.kid || null);
const pl = place(P.shapes, v);
console.log('gap', minGap(pl.shapes[0], pl.shapes[1]).toFixed(1), 'box', pl.box.x0.toFixed(0), pl.box.y0.toFixed(0), pl.box.x1.toFixed(0), pl.box.y1.toFixed(0), 'mass', pl.mass.cx.toFixed(0), pl.mass.cy.toFixed(0));
await shoot([{ html: `<style>body{margin:0}</style>${tileSvg(pl, 1024, { mode: process.argv[4] || 'default' })}`, out: join(HERE, '..', 'sketches', process.argv[2] + '.png'), width: 1024, height: 1024 }]);
