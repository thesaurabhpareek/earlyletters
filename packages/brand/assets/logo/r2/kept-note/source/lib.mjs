// Shared helpers for the kept-note symbol: colours, rendering, sheets.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const OUT = path.resolve(HERE, '..');
export const ROOT = path.resolve(HERE, '../../../../../../..');
const PW = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules/playwright/index.mjs';

// Colours: only from packages/brand/index.ts
export const C = {
  ink: '#2B2722', inkMuted: '#6B645B', paper: '#FBF8F3', paperRaised: '#FFFFFF',
  accent: '#8A5A3B', accentSoft: '#F1E6DC', line: '#E6DED3',
  inkDark: '#F2ECE4', inkMutedDark: '#B3AA9E', paperDark: '#161412',
  paperRaisedDark: '#201D1A', accentDark: '#D9A47E', lineDark: '#33302C',
};

export const r = (n) => Math.round(n * 100) / 100;

/** Polygon to path d. */
export const poly = (pts) => 'M' + pts.map((p) => `${r(p[0])} ${r(p[1])}`).join('L') + 'Z';

export function svg(d, { vb = '0 0 1000 1000', fill = C.ink, bg = null, title = 'Early Letters symbol', extra = '' } = {}) {
  const [x, y, w, h] = vb.split(' ').map(Number);
  const back = bg ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}"/>` : '';
  const paths = (Array.isArray(d) ? d : [d]).map((p) => typeof p === 'string' ? `<path fill="${fill}" d="${p}"/>` : `<path fill="${p.fill}" d="${p.d}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${title}"><title>${title}</title>${back}${paths}${extra}</svg>`;
}

export async function render(jobs) {
  const { chromium } = await import(PW);
  const browser = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') && fs.statSync('/opt/pw-browsers/chromium').isFile() ? '/opt/pw-browsers/chromium' : undefined });
  try {
    for (const j of jobs) {
      const page = await browser.newPage({ viewport: { width: j.width, height: j.height }, deviceScaleFactor: j.scale ?? 1, colorScheme: j.colorScheme ?? 'light' });
      if (j.file) await page.goto('file://' + j.file);
      else await page.setContent(j.html, { waitUntil: 'load' });
      await page.waitForTimeout(j.wait ?? 60);
      await page.screenshot({ path: j.out, fullPage: !!j.fullPage, omitBackground: !!j.transparent });
      await page.close();
    }
  } finally { await browser.close(); }
}

/**
 * A review sheet: each mark big on paper, on accent (icon), on night, and a size row
 * 16/29/60 at 1x plus 16 and 29 magnified 8x with pixelation (true small-size read).
 */
export function sheetHTML(items, { title = '' } = {}) {
  const cell = (it) => {
    const sm = it.small ?? it.d;
    const big = svg(it.d, { fill: C.ink });
    const icon = (d, s, rad = 0.2237) => `<div style="width:${s}px;height:${s}px;border-radius:${s * rad}px;background:${C.accent};display:flex;align-items:center;justify-content:center;overflow:hidden"><div style="width:${s * (it.iconScale ?? 0.62)}px;height:${s * (it.iconScale ?? 0.62)}px">${svg(d, { fill: C.paper })}</div></div>`;
    const night = svg(it.d, { fill: C.inkDark });
    return `<div class="c"><div class="lbl">${it.name}</div>
      <div class="row"><div class="big">${big}</div><div class="big icon">${icon(it.d, 220)}</div><div class="big night">${night}</div></div>
      <div class="row sizes">
        <div style="width:16px;height:16px">${svg(sm, { fill: C.ink })}</div>
        <div style="width:29px;height:29px">${svg(sm, { fill: C.ink })}</div>
        ${icon(sm, 29)}${icon(sm, 40)}${icon(it.d, 60)}
        <canvas data-s="16" data-src="${encodeURIComponent(svg(sm, { fill: C.ink, bg: C.paper }))}" width="128" height="128"></canvas>
        <canvas data-s="29" data-src="${encodeURIComponent(svg(sm, { fill: C.paper, bg: C.accent }))}" width="232" height="232"></canvas>
      </div>
      <div class="note">${it.note ?? ''}</div></div>`;
  };
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:${C.paper};font:14px/1.4 -apple-system,Helvetica,Arial;color:${C.ink};padding:24px}
  h1{font-size:18px;margin:0 0 16px}
  .c{border-top:1px solid ${C.line};padding:14px 0}
  .lbl{font-weight:600;margin-bottom:8px}
  .row{display:flex;gap:20px;align-items:center}
  .big{width:220px;height:220px}
  .big svg{width:100%;height:100%}
  .night{background:${C.paperDark};border-radius:12px}
  .sizes{margin-top:12px;gap:18px}
  .sizes svg{width:100%;height:100%;display:block}
  canvas{image-rendering:pixelated;border:1px solid ${C.line}}
  .note{color:${C.inkMuted};margin-top:6px;max-width:900px}
  </style></head><body><h1>${title}</h1>${items.map(cell).join('')}
  <script>
  for (const cv of document.querySelectorAll('canvas')) {
    const s = +cv.dataset.s; const img = new Image();
    img.onload = () => { const t = document.createElement('canvas'); t.width = s; t.height = s; const x = t.getContext('2d'); x.drawImage(img, 0, 0, s, s);
      const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(t, 0, 0, cv.width, cv.height); };
    img.src = 'data:image/svg+xml,' + cv.dataset.src;
  }
  </script></body></html>`;
}

export function write(rel, content) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
  return f;
}
