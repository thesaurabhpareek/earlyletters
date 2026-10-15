// Build the primary mark (approved r3 final-a) and every production file in packages/brand/assets/logo/primary/.
//   node packages/brand/assets/logo/primary/source/build.mjs          (repo root; needs python3 with numpy + Pillow, and playwright)
// Inputs: mark.mjs + g2.mjs (the drawing), config.mjs (final-a numbers), wordmark/*.svg (EB Garamond W4 revised,
// outlined by r3/color-type/source/wordmark.mjs from EB Garamond 1.003, OFL; see packages/brand/assets/fonts/eb-garamond).
// Vectors are pure functions of those inputs. Rasters are rendered in Chromium and composed by compose.py (fixed dither
// seed), so a rebuild reproduces the approved files. Touchpoint files (email, favicon, OG) are built from these outputs
// by packages/brand/scripts/build-touchpoints.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pair } from './mark.mjs';
import { transform, toD, bbox, minGap, areaCentroid } from './g2.mjs';
import { place } from './layout.mjs';
import { MARK, C } from './config.mjs';
import { shoot } from './render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..'); // = primary/
const TMP = path.join(HERE, '.tmp'); fs.mkdirSync(TMP, { recursive: true });
const r = (n) => Math.round(n * 100) / 100;
const svg = (vb, body, label = 'Early Letters symbol') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>\n`;

// ---------- wordmark (W4 revised, color-type) ----------
const WMD = path.join(HERE, 'wordmark');
function wm(file) {
  const s = fs.readFileSync(path.join(WMD, file), 'utf8');
  const d = s.match(/ d="([^"]+)"/)[1];
  const nums = d.match(/-?\d+\.?\d*/g).map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0), ys = nums.filter((_, i) => i % 2 === 1);
  return { d, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}
const WM = wm('wordmark.svg'), WMS = wm('wordmark-small.svg');
const CAP = 654;           // E cap height (font units, baseline y = 0)
const ASC = -WM.y0;        // ascender: top of the "l" (and the tt ligature's tops sit below it)
console.log('wordmark ascender', ASC, 'x0', WM.x0, 'x1', WM.x1);

function normalise(shapes, H = 1000) { const b = bbox(shapes); const s = H / b.h; return shapes.map((sh) => transform(sh, { s, tx: -b.x0 * s, ty: -b.y0 * s })); }
const padVB = (b, p) => { const m = Math.max(b.w, b.h) * p; return `${r(b.x0 - m)} ${r(b.y0 - m)} ${r(b.w + 2 * m)} ${r(b.h + 2 * m)}`; };

// 16/29/40/60/180 as in r3; 32 (favicon PNG), 192 and 512 (web manifest) added in primary; 58, 80, 87, 120 (iOS asset
// catalog: Settings, Spotlight, notifications) added 2026-10-03 for BRD-04. <= 40 px uses the small cut.
const SIZES = [16, 29, 32, 40, 58, 60, 80, 87, 120, 180, 192, 512];
const facts = {};
for (const [slug, V] of Object.entries({ primary: MARK })) {
  const OUT = ROOT; const PNG = path.join(OUT, 'png'); fs.mkdirSync(PNG, { recursive: true });
  const M = pair(V.master.g, V.master.p, V.master.kid), S = pair(V.small.g, V.small.p, V.small.kid);
  const main = normalise(M.shapes), small = normalise(S.shapes);
  const bM = bbox(main), bS = bbox(small);
  const dM = toD(main), dS = toD(small);
  const nodes = (sh) => sh.segs.length;
  const files = {};
  files['symbol.svg'] = svg(padVB(bM, 0.04), `<path fill="${C.ink}" d="${dM}"/>`);
  files['symbol-reversed.svg'] = svg(padVB(bM, 0.04), `<path fill="${C.inkDark}" d="${dM}"/>`);
  files['symbol-accent.svg'] = svg(padVB(bM, 0.04), `<path fill="${C.accent}" d="${dM}"/>`);
  files['symbol-small.svg'] = svg(padVB(bS, 0.04), `<path fill="${C.ink}" d="${dS}"/>`);
  files['symbol-small-reversed.svg'] = svg(padVB(bS, 0.04), `<path fill="${C.inkDark}" d="${dS}"/>`); // added in primary
  { // favicon: small cut, accentDeep on light, accentDark on dark (prefers-color-scheme)
    const sz = Math.max(bS.w, bS.h) * 1.06; const x = bS.x0 + bS.w / 2 - sz / 2, y = bS.y0 + bS.h / 2 - sz / 2;
    files['favicon.svg'] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(x)} ${r(y)} ${r(sz)} ${r(sz)}"><style>path{fill:${C.accentDeep}}@media (prefers-color-scheme:dark){path{fill:${C.accentDark}}}</style><path d="${dS}"/></svg>\n`;
  }
  // ---------- lockups ----------
  // Horizontal: bowls sit on the baseline with a 1.7% round overshoot; the top of the mark meets the ascender of "l".
  // Space between mark and "E" = 0.7 x cap height.
  const lockH = (fill, w = WM, shapes = main, b = bM) => {
    const over = 12, H = ASC + over, s = H / b.h;
    const sym = shapes.map((sh) => transform(sh, { s, tx: -b.x0 * s, ty: -ASC - b.y0 * s }));
    const gap = CAP * 0.7, wx = b.w * s + gap - w.x0;
    const total = b.w * s + gap + (w.x1 - w.x0), m = CAP * 0.25;
    return svg(`${r(-m)} ${r(-ASC - m)} ${r(total + 2 * m)} ${r(ASC + 300 + 2 * m)}`, `<path fill="${fill}" d="${toD(sym)}"/><path fill="${fill}" transform="translate(${r(wx)} 0)" d="${w.d}"/>`, 'Early Letters');
  };
  // Stacked: mark 2.2 x cap height, centred on the wordmark by its mass, 0.7 x cap height above the ascender line.
  const lockS = (fill, w = WM) => {
    const H = CAP * 2.2, s = H / bM.h; const ww = w.x1 - w.x0;
    const sc = main.map((sh) => transform(sh, { s, tx: -bM.x0 * s, ty: -bM.y0 * s }));
    const mc = areaCentroid(sc), bb = bbox(sc);
    const cx = ww / 2; const tx = cx - (mc.cx * 0.5 + (bb.w / 2) * 0.5); // half box centre, half mass centre: optical
    const sym = sc.map((sh) => transform(sh, { tx }));
    const base = H + CAP * 0.7 + ASC, m = CAP * 0.3;
    return svg(`${r(-m)} ${r(-m)} ${r(ww + 2 * m)} ${r(base + 300 + 2 * m)}`, `<path fill="${fill}" d="${toD(sym)}"/><path fill="${fill}" transform="translate(${r(-w.x0)} ${r(base)})" d="${w.d}"/>`, 'Early Letters');
  };
  files['lockup-horizontal.svg'] = lockH(C.ink);
  files['lockup-horizontal-reversed.svg'] = lockH(C.inkDark);
  files['lockup-horizontal-small.svg'] = lockH(C.ink, WMS, small, bS);
  files['lockup-horizontal-small-reversed.svg'] = lockH(C.inkDark, WMS, small, bS);
  files['lockup-stacked.svg'] = lockS(C.ink);
  files['lockup-stacked-reversed.svg'] = lockS(C.inkDark);
  for (const [f, s] of Object.entries(files)) fs.writeFileSync(path.join(OUT, f), s);

  // ---------- app icons ----------
  const plM = place(M.shapes, V.master), plS = place(S.shapes, V.small);
  const maskSvg = (pl, px, dx = 0, dy = 0, k = 1) => `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#000"/><g transform="translate(${512 + dx * 1024 / px} ${512 + dy * 1024 / px}) scale(${k}) translate(-512 -512)"><path fill="#fff" d="${pl.d}"/></g></svg>`;
  const jobs = [{ html: `<style>body{margin:0}</style>${maskSvg(plM, 1024)}`, out: path.join(TMP, `${slug}-mask-1024.png`), width: 1024, height: 1024 }];
  // hand-tuning search for small sizes: sub-pixel offsets in 1/4 px and +-2% scale; pick the crispest (least grey) result
  const tunes = [];
  for (const px of SIZES) {
    const pl = px <= 40 ? plS : plM;
    for (const dx of [-0.25, 0, 0.25]) for (const dy of [-0.25, 0, 0.25]) for (const k of px <= 40 ? [0.98, 1, 1.02] : [1]) {
      const f = path.join(TMP, `${slug}-m${px}-${dx}-${dy}-${k}.png`);
      tunes.push({ px, dx, dy, k, f }); jobs.push({ html: `<style>body{margin:0}</style>${maskSvg(pl, px, dx, dy, k)}`, out: f, width: px, height: px });
    }
  }
  await shoot(jobs);
  const py = (code) => execFileSync('python3', ['-c', code], { encoding: 'utf8' });
  const scores = JSON.parse(py(`import json,numpy as np
from PIL import Image
fs=${JSON.stringify(tunes.map((t) => t.f))}
out=[]
for f in fs:
  a=np.asarray(Image.open(f).convert('L'),dtype=float)/255
  out.append(float((4*a*(1-a)).sum()/max(1e-6,a.sum())))
print(json.dumps(out))`));
  tunes.forEach((t, i) => { t.grey = scores[i]; });
  const chosen = {};
  for (const px of SIZES) {
    const c = tunes.filter((t) => t.px === px).sort((a, b) => a.grey - b.grey + 0.02 * (Math.abs(a.k - 1) - Math.abs(b.k - 1)))[0];
    chosen[px] = c;
  }
  const compose = (mask, out, mode) => py(`import sys; sys.path.insert(0, ${JSON.stringify(HERE)})
from compose import compose, bands
compose(${JSON.stringify(mask)}, ${JSON.stringify(out)}, ${JSON.stringify(mode)})
print(bands(${JSON.stringify(out)}))`).trim();
  const bandsDefault = compose(path.join(TMP, `${slug}-mask-1024.png`), path.join(OUT, 'app-icon-1024.png'), 'default');
  compose(path.join(TMP, `${slug}-mask-1024.png`), path.join(OUT, 'app-icon-dark-1024.png'), 'dark');
  compose(path.join(TMP, `${slug}-mask-1024.png`), path.join(OUT, 'app-icon-tinted-1024.png'), 'tinted');
  for (const px of SIZES) {
    compose(chosen[px].f, path.join(PNG, `icon-${px}.png`), 'default');
    compose(chosen[px].f, path.join(PNG, `icon-${px}-dark.png`), 'dark');
  }
  // bench inputs: the symbol exactly as placed on the 1024 canvas, and the gradient tile
  const plB = plM.box;
  fs.writeFileSync(path.join(TMP, 'bench-symbol.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="#fff" d="${plM.d}"/></svg>`);
  fs.writeFileSync(path.join(TMP, 'bench-tile.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A613C"/><stop offset="1" stop-color="${C.accentDeep}"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#t)"/></svg>`);
  fs.writeFileSync(path.join(TMP, 'bench-small.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="#fff" d="${plS.d}"/></svg>`);
  facts[slug] = {
    nodes: { parent: nodes(M.shapes[0]), child: nodes(M.shapes[1]), smallParent: nodes(S.shapes[0]) },
    g2: { parent: M.big.shape.report.every((x) => x.ok), small: S.big.shape.report.every((x) => x.ok) },
    tile: { boxPct: [r(plM.box.w / 10.24), r(plM.box.h / 10.24)], box: [r(plM.box.x0), r(plM.box.y0), r(plM.box.x1), r(plM.box.y1)], mass: [r(plM.mass.cx), r(plM.mass.cy)], ink: r((plM.mass.area / (1024 * 1024)) * 100) },
    gap1024: r(minGap(plM.shapes[0], plM.shapes[1])), gapSmall1024: r(minGap(plS.shapes[0], plS.shapes[1])),
    gapAt29: r(minGap(plM.shapes[0], plM.shapes[1]) * 29 / 1024), gapSmallAt29: r(minGap(plS.shapes[0], plS.shapes[1]) * 29 / 1024),
    ratio: V.master.p.ratio ?? 0.62, lean: V.master.p.lean, smallRatio: V.small.p.ratio,
    tuned: Object.fromEntries(Object.entries(chosen).map(([k, c]) => [k, { dx: c.dx, dy: c.dy, k: c.k, grey: r(c.grey) }])),
    benchScale: r(Math.sqrt(plB.w * plB.h) / 1024 * 1000) / 1000, benchDx: r(((plB.x0 + plB.x1) / 2 - 512) / 1024 * 1000) / 1000, benchDy: r(((plB.y0 + plB.y1) / 2 - 512) / 1024 * 1000) / 1000,
    bandsDefault,
  };
  // master geometry in units, for the record
  fs.writeFileSync(path.join(OUT, 'geometry.json'), JSON.stringify({ master: V.master, small: V.small, facts: facts[slug] }, null, 2));
}
console.log(JSON.stringify(facts, null, 1));
