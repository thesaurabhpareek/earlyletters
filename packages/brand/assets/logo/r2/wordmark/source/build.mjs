// Builds every wordmark file in packages/brand/assets/logo/r2/wordmark/ from OFL outlines.
// Run from the repo root:   node packages/brand/assets/logo/r2/wordmark/source/build.mjs [--no-png]
// Output: filled paths only. No live text, fonts, strokes, clip paths or masks in any SVG.
import fs from 'node:fs';
import path from 'node:path';
import { C, toD, bbox, write, render, OUT, nodeCount, setPrecision } from './lib.mjs';
import { ROUTES, buildCut } from './routes.mjs';
import { presentation } from './presentation.mjs';

setPrecision(1);
const NAME = 'Early Letters';
const PAD = 12; // font units around the ink

export function svgDoc(cmds, fill, { title = NAME, pad = PAD } = {}) {
  const b = bbox(cmds);
  const vb = [b.x0 - pad, -b.y1 - pad, b.w + 2 * pad, b.h + 2 * pad].map((v) => Math.round(v));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" role="img" aria-label="${title}"><title>${title}</title><path fill="${fill}" d="${toD(cmds)}"/></svg>\n`;
}

const RECO = `<div style="background:${C.accentSoft};border-radius:14px;padding:18px 22px;margin-top:20px;max-width:860px">
<p style="margin:0 0 6px;font-weight:600">Recommendation: route A, Signature</p>
<p style="margin:0">Literata at a display optical size, spaced by eye rather than by the font's kerning, with one custom detail: the two t's in "Letters" share a single crossbar, and the first t stands a little taller than the second. A tall letter and a small one holding the same line. At 32 px and below a sturdier small cut takes over. Full reasoning in RATIONALE.md.</p></div>`;
const metrics = {};
const built = {};
for (const [key, route] of Object.entries(ROUTES)) {
  built[key] = {};
  for (const cutName of ['master', 'small']) {
    const r = buildCut(route[cutName]);
    built[key][cutName] = r;
    const base = cutName === 'master' ? 'wordmark' : 'wordmark-small';
    // Light type on a dark ground looks heavier (irradiation). The reversed small cut is drawn
    // 20 weight units lighter so ink and reversed read as the same weight at 14 to 28 px.
    const rev = cutName === 'small' && route.small.wght ? buildCut({ ...route.small, wght: route.small.wght - 20 }) : r;
    built[key][cutName + 'Rev'] = rev;
    write(`${route.slug}/${base}.svg`, svgDoc(r.cmds, C.ink));
    write(`${route.slug}/${base}-reversed.svg`, svgDoc(rev.cmds, C.inkDark));
    write(`${route.slug}/${base}-accent.svg`, svgDoc(r.cmds, C.accent));
    metrics[`${route.slug}/${base}`] = {
      aspect: +(r.bb.w / r.bb.h).toFixed(4),
      nodes: nodeCount(r.cmds),
      // where the baseline and x-height sit inside the drawing, for lockups
      baselineFromTop: +((r.bb.y1 + PAD) / (r.bb.h + 2 * PAD)).toFixed(4),
      bbox: Object.fromEntries(Object.entries(r.bb).map(([k, v]) => [k, Math.round(v)])),
    };
  }
}
write('source/metrics.json', JSON.stringify(metrics, null, 2) + '\n');
write('presentation.html', presentation({ ROUTES, built, metrics, extra: RECO }));

if (!process.argv.includes('--no-png')) {
  const png = path.join(OUT, 'png');
  fs.mkdirSync(png, { recursive: true });
  const jobs = [];
  // pixel-true small renders, used (magnified, pixelated) by the presentation
  for (const [key, route] of Object.entries(ROUTES)) for (const cutName of ['master', 'small']) for (const px of [14, 28]) for (const [ground, fill, bg] of [['paper', C.ink, C.paper], ['night', C.inkDark, C.paperDark]]) {
    const r = built[key][ground === 'night' ? cutName + 'Rev' : cutName];
    const svg = svgDoc(r.cmds, fill).replace('<svg ', `<svg height="${px}" `);
    const w = Math.ceil(px * metrics[`${route.slug}/${cutName === 'master' ? 'wordmark' : 'wordmark-small'}`].aspect) + 8;
    jobs.push({ html: `<!doctype html><style>html,body{margin:0;background:${bg}}svg{display:block;margin:4px}</style>${svg}`, out: path.join(png, `${route.slug}-${cutName}-${px}-${ground}.png`), width: w, height: px + 8 });
  }
  jobs.push({ file: path.join(OUT, 'presentation.html'), out: path.join(png, 'presentation.png'), width: 1280, height: 900, fullPage: true });
  await render(jobs);
}
console.log('built', Object.keys(metrics).length, 'cuts');
