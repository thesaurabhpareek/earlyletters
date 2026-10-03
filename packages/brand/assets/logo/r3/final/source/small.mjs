// Small-size study: node small.mjs name '<variants json>' -> each variant at 16/29/40/60 px, real pixels and 8x magnified
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { pair } from './mark.mjs';
import { place, tileSvg } from './layout.mjs';
import { minGap } from './g2.mjs';
import { shoot } from './render.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const T = join(HERE, '..', 'sketches', '_tmp'); mkdirSync(T, { recursive: true });
const name = process.argv[2]; const vs = JSON.parse(process.argv[3]);
const sizes = [16, 29, 40, 60];
const jobs = [];
vs.forEach((v, i) => { const P = pair(v.g || {}, v.p || {}, v.kid || null); const pl = place(P.shapes, v); console.log(v.label, 'gap@1024', minGap(pl.shapes[0], pl.shapes[1]).toFixed(1));
  for (const px of sizes) for (const mode of ['default', 'dark']) jobs.push({ html: `<style>body{margin:0;background:${mode === 'dark' ? '#000' : '#f2f2f7'}}</style>${tileSvg(pl, px, { mode, radius: 0.2237 })}`, out: join(T, `${i}-${px}-${mode}.png`), width: px, height: px }); });
await shoot(jobs);
const rows = [];
vs.forEach((v, i) => {
  const args = [];
  for (const mode of ['default', 'dark']) for (const px of sizes) { const f = join(T, `${i}-${px}-${mode}.png`); const m = join(T, `${i}-${px}-${mode}-m.png`); execFileSync('convert', [f, '-filter', 'point', '-resize', `${Math.round(px * (px <= 29 ? 8 : px === 40 ? 5 : 4))}x`, '-bordercolor', '#e9e4dc', '-border', '6', m]); args.push(m); }
  const r = join(T, `row-${i}.png`); execFileSync('convert', [...args, '+append', '-gravity', 'NorthWest', '-background', '#e9e4dc', '-splice', '0x22', '-pointsize', '16', '-annotate', '+6+2', v.label, r]); rows.push(r);
});
execFileSync('convert', [...rows, '-append', join(HERE, '..', 'sketches', name + '.png')]);
console.log(join(HERE, '..', 'sketches', name + '.png'));
