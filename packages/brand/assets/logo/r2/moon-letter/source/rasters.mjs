// Renders the PNG set used by presentation.html, plus the opaque app icons.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { iconSvg, normalised, MASTER, SMALL, C, writeAll } from './build.mjs';
import { shoot } from './render.mjs';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
writeAll();
const sym = (params, fill, px, bg) => { const s = normalised(params); const k = (px * 0.94) / Math.max(s.w, s.h);
  return `<body style="margin:0;background:${bg || 'transparent'}"><svg width="${px}" height="${px}" style="display:block"><path fill="${fill}" transform="translate(${(px - s.w * k) / 2} ${(px - s.h * k) / 2}) scale(${k})" d="${s.d}"/></svg></body>`; };
const jobs = [
  { html: `<body style="margin:0">${iconSvg()}</body>`, out: 'png/app-icon-1024-rgba.png', width: 1024, height: 1024 },
  { html: `<body style="margin:0">${iconSvg(1024, C.paperDark, C.accentDark)}</body>`, out: 'png/app-icon-dark-1024.png', width: 1024, height: 1024 },
  { html: `<body style="margin:0">${iconSvg(1024, C.accent, C.paper, SMALL, { dx: 0, dy: 0.002, scale: 0.64 })}</body>`, out: 'png/app-icon-small-1024.png', width: 1024, height: 1024 },
  { html: sym(SMALL, C.ink, 16, C.paper), out: 'png/favicon-16.png', width: 16, height: 16 },
  { html: sym(SMALL, C.inkDark, 16, '#202124'), out: 'png/favicon-16-dark.png', width: 16, height: 16 },
  { html: sym(MASTER, C.ink, 512), out: 'png/symbol-512.png', width: 512, height: 512, transparent: true },
];
for (const [n, p, sc] of [[29, SMALL, 0.64], [40, SMALL, 0.64], [60, MASTER, 0.6], [180, MASTER, 0.6]])
  jobs.push({ html: `<body style="margin:0">${iconSvg(n, C.accent, C.paper, p, { dx: 0, dy: 0.002, scale: sc })}</body>`, out: `png/icon-${n}.png`, width: n, height: n });
await shoot(jobs.map((j) => ({ ...j, out: path.join(OUT, j.out) })));
execFileSync('python3', ['-c', `from PIL import Image\nim=Image.open('${OUT}/png/app-icon-1024-rgba.png').convert('RGB'); im.save('${OUT}/app-icon-1024.png')\nimport os; os.remove('${OUT}/png/app-icon-1024-rgba.png')\nfor f in ['app-icon-dark-1024','app-icon-small-1024']:\n  Image.open('${OUT}/png/'+f+'.png').convert('RGB').save('${OUT}/png/'+f+'.png')`]);
console.log('rasters done');
