import { shoot, done } from './render.mjs';
import { years2 } from './mark2.mjs'; import { years3 } from './mark3.mjs';
import fs from 'node:fs';
const OUT = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/years';
const tag = process.argv[2]; const V = (await import('./variants-' + tag + '.mjs')).default;
const ink = '#2B2722', paper = '#FBF8F3', accent = '#8A5A3B';
const svg = (d, c, w, vb = '0 0 100 100') => `<svg viewBox="${vb}" width=${w} style="display:block"><path fill-rule="nonzero" d="${d}" fill="${c}"/></svg>`;
const jobs = []; let cells = '';
for (const [k, p] of Object.entries(V)) {
  const { d } = (p.holeN ? years3 : years2)(p);
  jobs.push({ html: `<body style="margin:0;background:${paper}">${svg(d, ink, 16)}`, out: `${OUT}/q-${tag}-${k}-16.png`, width: 16, height: 16 });
  jobs.push({ html: `<body style="margin:0;background:${accent}">${svg(d, paper, 29, '-14 -14 128 128')}`, out: `${OUT}/q-${tag}-${k}-29.png`, width: 29, height: 29 });
  cells += `<div class=c>${svg(d, ink, 300)}<div class=row><div class=ic>${svg(d, paper, 42)}</div><div class=ic style="background:#161412">${svg(d, '#D9A47E', 42)}</div>
  <img src="q-${tag}-${k}-16.png" width=128 style="image-rendering:pixelated"><img src="q-${tag}-${k}-29.png" width=116 style="image-rendering:pixelated"></div><p>${k}</p></div>`;
}
await shoot(jobs);
fs.writeFileSync(`${OUT}/refine2-${tag}.html`, `<style>body{margin:0;background:${paper};font:14px sans-serif;display:flex;flex-wrap:wrap;gap:20px;padding:20px}
.c{width:420px;background:#fff;padding:12px;border-radius:12px;display:flex;flex-direction:column;align-items:center}.row{display:flex;gap:12px;align-items:center}
.ic{width:60px;height:60px;border-radius:14px;background:${accent};display:flex;align-items:center;justify-content:center}</style>${cells}`);
await shoot([{ file: `${OUT}/refine2-${tag}.html`, out: `${OUT}/refine2-${tag}.png`, width: 1400, height: 900, full: true }]);
await done();
