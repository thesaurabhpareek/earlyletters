// W4 revised: EB Garamond with its t_t ligature, word space opened 15 percent, plus a tracked small cut for under 20 px.
// Reuses the r2 wordmark pipeline read-only (outlines from the pinned OFL fonts already in r2/wordmark/source/.cache;
// only weights 500/540/560 are used so nothing new is written there).
// Run (repo root): node packages/brand/assets/logo/r3/color-type/source/wordmark.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cut, glyph, translate, bbox, toD, setPrecision, C } from '../../../r2/wordmark/source/lib.mjs';
import { setWord, pairGap } from '../../../r2/wordmark/source/space.mjs';
import { ROUTES, buildCut } from '../../../r2/wordmark/source/routes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const WM = join(HERE, '..', 'wordmark');
setPrecision(1);

/** EB Garamond word. track = extra white per letter pair (font units), wordSpace on top of the letter gap. */
function garamond({ wght, factor, track = 0, wordSpace, adjust = {} }) {
  const f = cut('ebgaramond', '-', wght);
  const band = [0, 400], depth = 80;
  const n = glyph(f, 'n');
  const gap = pairGap(n.cmds, translate(n.cmds, n.adv, 0), { band, depth }) * factor + track;
  const subs = { 8: glyph(f, 't_t', true) };
  const word = setWord(f, 'Early LeTers', { band, depth, gap, wordSpace, adjust, subs });
  const cmds = word.flatMap((g) => g.cmds);
  const iy = word.findIndex((g) => g.ch === 'y');
  return { cmds, bb: bbox(cmds), cap: f.tables.os2.sCapHeight, letterGap: gap,
    wordWhite: pairGap(word[iy].cmds, word[iy + 1].cmds, { band, depth }) };
}

// r2 W4 for reference: master wght 500 factor 0.92 wordSpace 120 (word white 266.9); small wght 560 factor 1.05 wordSpace 140 (304.1).
export const SPECS = {
  'w4r-master': { wght: 500, factor: 0.92, wordSpace: 160, adjust: { Le: -30 } },            // word white +15%: 266.9 -> ~307
  'w4r-small': { wght: 540, factor: 1.05, track: 25, wordSpace: 186, adjust: { Le: -10 } },   // +2.5% tracking, word white ~375
  'w4r-small-560': { wght: 560, factor: 1.05, track: 25, wordSpace: 186, adjust: { Le: -10 } }, // heavier option, compared at 14 px
};

export function svgDoc(cmds, fill, pad = 12) {
  const b = bbox(cmds);
  const vb = [b.x0 - pad, -b.y1 - pad, b.w + 2 * pad, b.h + 2 * pad].map((v) => Math.round(v));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" role="img" aria-label="Early Letters"><title>Early Letters</title><path fill="${fill}" d="${toD(cmds)}"/></svg>\n`;
}

export function buildAll() {
  const out = {};
  for (const [k, s] of Object.entries(SPECS)) out[k] = garamond(s);
  // unchanged r2 cuts, for comparison
  out['w4-master'] = { ...buildCut(ROUTES.d.master), cap: 650 };
  out['w4-small'] = { ...buildCut(ROUTES.d.small), cap: 650 };
  out['w1-master'] = { ...buildCut(ROUTES.a.master), cap: 710 };
  out['w1-small'] = { ...buildCut(ROUTES.a.small), cap: 710 };
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  mkdirSync(WM, { recursive: true });
  const all = buildAll();
  const metrics = {};
  for (const k of ['w4r-master', 'w4r-small']) {
    const r = all[k];
    const base = k === 'w4r-master' ? 'wordmark' : 'wordmark-small';
    writeFileSync(join(WM, `${base}.svg`), svgDoc(r.cmds, C.ink));
    writeFileSync(join(WM, `${base}-reversed.svg`), svgDoc(r.cmds, C.inkDark));
    writeFileSync(join(WM, `${base}-accent.svg`), svgDoc(r.cmds, C.accent));
    metrics[k] = { width: Math.round(r.bb.w), height: Math.round(r.bb.h), aspect: +(r.bb.w / r.bb.h).toFixed(3), letterGap: +r.letterGap.toFixed(1), wordWhite: +r.wordWhite.toFixed(1), ratioWordToLetter: +(r.wordWhite / r.letterGap).toFixed(2) };
  }
  writeFileSync(join(WM, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n');
  console.log(metrics);
}
