// Shared helpers for the wildcard round 2 mark. Pure geometry plus a Playwright renderer.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const OUT = path.resolve(HERE, '..');
export const REPO = path.resolve(HERE, '../../../../../../..');
const PW = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules/playwright/index.mjs';

// Colours mirror packages/brand/index.ts (the only allowed palette).
export const C = {
  ink: '#2B2722', inkMuted: '#6B645B', paper: '#FBF8F3', paperRaised: '#FFFFFF',
  accent: '#8A5A3B', accentSoft: '#F1E6DC', line: '#E6DED3',
  inkDark: '#F2ECE4', inkMutedDark: '#B3AA9E', paperDark: '#161412', paperRaisedDark: '#201D1A',
  accentDark: '#D9A47E', lineDark: '#33302C',
};

export const r = (n) => Math.round(n * 10) / 10;

export function write(rel, content) {
  const p = path.isAbsolute(rel) ? rel : path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}

/** Wrap filled paths in an SVG. paths: [{d, fill?}] */
export function svg(paths, { vb = '0 0 1000 1000', fill = C.ink, title = 'Early Letters symbol', bg = null } = {}) {
  const [x, y, w, h] = vb.split(' ').map(Number);
  const b = bg ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}"/>` : '';
  const body = paths.map((p) => `<path fill="${p.fill || fill}"${p.rule ? ` fill-rule="${p.rule}"` : ''} d="${p.d}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${title}"><title>${title}</title>${b}${body}</svg>`;
}

export const dataUri = (s) => 'data:image/svg+xml;base64,' + Buffer.from(s).toString('base64');

export async function render(jobs) {
  const { chromium } = await import(PW);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  try {
    for (const j of jobs) {
      const page = await browser.newPage({ viewport: { width: j.width, height: j.height }, deviceScaleFactor: j.scale ?? 1, colorScheme: j.colorScheme ?? 'light' });
      if (j.file) await page.goto('file://' + j.file); else await page.setContent(j.html, { waitUntil: 'load' });
      await page.waitForTimeout(j.wait ?? 150);
      await page.screenshot({ path: j.out, fullPage: !!j.fullPage, omitBackground: !!j.transparent });
      await page.close();
    }
  } finally { await browser.close(); }
}

/**
 * Contact sheet: each mark large on paper and accent, then 60/29/16 actual and 16/29 at 8x nearest-neighbour.
 * marks: [{name, note, ink: svgString, rev: svgString (paper colour mark)}]
 */
export function sheetHtml(marks, title = '') {
  const rows = marks.map((m, i) => `
  <div class="row">
    <div class="lab"><b>${m.name}</b><br>${m.note || ''}</div>
    <img class="big" src="${dataUri(m.ink)}" style="background:${C.paper}">
    <div class="tile" style="background:${C.accent}"><img src="${dataUri(m.rev)}"></div>
    <div class="sizes">
      ${[60, 29, 16].map((s) => `<div class="ic" style="width:${s}px;height:${s}px;border-radius:${s * 0.225}px;background:${C.accent}"><img src="${dataUri(m.rev)}" style="width:${s * 0.62}px"></div>`).join('')}
      ${[60, 29, 16].map((s) => `<img src="${dataUri(m.ink)}" style="width:${s}px;height:${s}px">`).join('')}
    </div>
    <canvas id="z16-${i}" width="128" height="128"></canvas>
    <canvas id="z29-${i}" width="232" height="232"></canvas>
  </div>`).join('');
  const js = marks.map((m, i) => `zoom(${JSON.stringify(dataUri(m.ink))}, 16, 'z16-${i}'); zoom(${JSON.stringify(dataUri(m.ink))}, 29, 'z29-${i}');`).join('\n');
  return `<!doctype html><html><head><style>
  body{margin:0;padding:20px;background:${C.paper};font:13px/1.35 -apple-system,Helvetica,sans-serif;color:${C.ink}}
  h1{font-size:16px;margin:0 0 10px}
  .row{display:flex;gap:16px;align-items:center;padding:12px 0;border-bottom:1px solid ${C.line}}
  .lab{width:170px}
  .big{width:220px;height:220px;border:1px solid ${C.line}}
  .tile{width:220px;height:220px;display:flex;align-items:center;justify-content:center;border-radius:48px}
  .tile img{width:150px}
  .sizes{display:flex;gap:10px;align-items:center;width:230px;flex-wrap:wrap}
  .ic{display:flex;align-items:center;justify-content:center}
  canvas{image-rendering:pixelated;border:1px solid ${C.line};background:#fff}
  </style></head><body><h1>${title}</h1>${rows}
  <script>
  function zoom(src, s, id){const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=s;c.height=s;const x=c.getContext('2d');x.fillStyle='${C.paper}';x.fillRect(0,0,s,s);x.drawImage(im,0,0,s,s);const z=document.getElementById(id).getContext('2d');z.imageSmoothingEnabled=false;z.drawImage(c,0,0,s,s,0,0,s*8,s*8);};im.src=src;}
  ${js}
  </script></body></html>`;
}
