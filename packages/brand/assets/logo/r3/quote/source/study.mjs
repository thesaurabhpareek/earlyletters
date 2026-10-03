// Study boards: large drawing with curvature combs, plus real-pixel small renders magnified.
// node study.mjs <name> '<json overrides array>'   (writes scratchpad/q/<name>.png)
import fs from 'node:fs';
import { glyph } from './glyph.mjs';
import { toD, comb, bbox, g2Report } from './geom.mjs';
import { shoot, S } from './render.mjs';

export async function board(name, variants, { combs = true, ref = false } = {}) {
  const refs = ref ? JSON.parse(fs.readFileSync(S + '/q/ref.json')).filter((r) => r.name === 'EB Garamond 800' && r.cp === '0x2018')[0] : null;
  const cells = variants.map((v) => {
    const c = v.contours ?? [glyph(v.o)];
    const b = bbox(c), m = Math.max(b.w, b.h) * 0.08;
    const vb = `${b.x0 - m} ${b.y0 - m} ${b.w + 2 * m} ${b.h + 2 * m}`;
    let refSvg = '';
    if (refs) { const [x0, y0, x1, y1] = refs.b; const s = 1000 / (y1 - y0); refSvg = `<path transform="translate(${-x0 * s},${y1 * s}) scale(${s},${-s})" d="${refs.d}" fill="none" stroke="#1F6FEB" stroke-width="3" stroke-dasharray="10 8"/>`; }
    const big = `<svg viewBox="${vb}" width="420" height="${(420 * (b.h + 2 * m)) / (b.w + 2 * m)}"><path d="${toD(c)}" fill="#2B2722" opacity="${combs ? 0.82 : 1}"/>${refSvg}${combs ? comb(c) : ''}</svg>`;
    const smalls = [16, 29, 60].map((px) => `<div class="sm"><svg viewBox="${vb}" width="${px}" height="${px}" style="image-rendering:pixelated"><path d="${toD(c)}" fill="#2B2722"/></svg></div>`).join('');
    const rep = c.length === 1 ? g2Report(c[0]).filter((r) => !r.corner).map((r) => r.jump).reduce((a, b) => Math.max(a, b), 0) : '';
    return `<div class="c">${big}<div class="row">${smalls}</div><p>${v.label ?? ''} ${rep !== '' ? 'max G2 jump ' + rep : ''}</p></div>`;
  }).join('');
  const html = `<style>body{margin:0;background:#FBF8F3;font:15px system-ui;display:flex;flex-wrap:wrap}.c{padding:18px;width:440px}.row{display:flex;gap:18px;align-items:flex-end;margin-top:10px}p{margin:6px 0;color:#444}</style>${cells}`;
  fs.writeFileSync(S + `/q/${name}.html`, html);
  await shoot([{ file: S + `/q/${name}.html`, out: S + `/q/${name}.png`, width: 1440, height: 600, fullPage: true }]);
  return S + `/q/${name}.png`;
}

if (process.argv[1].endsWith('study.mjs')) {
  const vs = JSON.parse(process.argv[3] ?? '[{"label":"default"}]');
  console.log(await board(process.argv[2] ?? 'study', vs, { ref: true }));
}
