// big render + true-pixel small renders scaled up 8x (nearest neighbour) for honest small-size checks
import { shoot, done } from './render.mjs';
import { years } from './mark.mjs';
const OUT = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/years';
const tag = process.argv[2]; const V = (await import('./variants-' + tag + '.mjs')).default;
const paper = '#FBF8F3', ink = '#2B2722', accent = '#8A5A3B';
const jobs = [];
for (const [k, p] of Object.entries(V)) {
  const d = years(p);
  jobs.push({ html: `<body style="margin:0;background:${paper}"><svg viewBox="0 0 100 100" width=600><path d="${d}" fill="${ink}"/></svg>`, out: `${OUT}/z-${tag}-${k}-big.png`, width: 600, height: 600 });
  for (const s of [16, 29]) jobs.push({ html: `<body style="margin:0;background:${s === 29 ? accent : paper}"><svg viewBox="${s === 29 ? '-12 -12 124 124' : '0 0 100 100'}" width=${s} style="display:block"><path d="${d}" fill="${s === 29 ? paper : ink}"/></svg>`, out: `${OUT}/z-${tag}-${k}-${s}.png`, width: s, height: s });
}
await shoot(jobs);
// sheet with nearest-neighbour zoom
let html = `<body style="margin:0;background:#ddd;display:flex;flex-wrap:wrap;gap:16px;padding:16px;font:12px sans-serif">`;
for (const k of Object.keys(V)) html += `<div><img src="file://${OUT}/z-${tag}-${k}-big.png" width=240><br><img src="file://${OUT}/z-${tag}-${k}-16.png" width=128 style="image-rendering:pixelated"> <img src="file://${OUT}/z-${tag}-${k}-29.png" width=232 style="image-rendering:pixelated"><br>${k}</div>`;
import('node:fs').then(fs=>fs.writeFileSync(`${OUT}/zoom-${tag}.html`, html));
await new Promise(r=>setTimeout(r,100));
await shoot([{ file: `${OUT}/zoom-${tag}.html`, out: `${OUT}/zoom-${tag}.png`, width: 1300, height: 600, full: true }]);
await done();
