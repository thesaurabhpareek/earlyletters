// Refinement rounds. Usage: node iter.mjs <round>
import path from 'node:path';
import { sheetHTML, render, write, OUT } from './lib.mjs';
import { mark as raw, fit } from './mark.mjs';
const mark = (p) => fit(raw(p), p.fitH ?? 760, p.odx ?? 0);

const R = process.argv[2] || '1';
const H = { hw: 150, hh: 270, ht: 175, notch: 0.21, shoulder: 0.35, pull: 0.4 };
const M = { slot: 'both', gap: 20, W: 330, wL: 330, dyL: 0, wR: 240, dyR: 70, top: 140, bot: 860, hw: 150, hh: 270, ht: 190, notch: 0.24, shoulder: 0.36, pull: 0.42 };
const rounds = {
  8: [
    { name: 'r8a small cut: gap 36, heart 1.2x, less turn', p: M, small: { gap: 36, hw: 180, hh: 320, ht: 165, wR: 260, dyR: 60, rad: 34 } },
    { name: 'r8b small cut: gap 44, heart 1.3x', p: M, small: { gap: 44, hw: 195, hh: 345, ht: 150, wR: 270, dyR: 56, rad: 40 } },
    { name: 'r8c small cut: slot below only', p: M, small: { slot: 'below', gap: 44, hw: 195, hh: 345, ht: 150, wR: 270, dyR: 56, rad: 40 } },
    { name: 'r8d small cut: no slot, fold by silhouette', p: M, small: { slot: 'none', hw: 200, hh: 350, ht: 150, wR: 270, dyR: 70, rad: 40 } },
  ],
};
const items = rounds[R].map((v) => ({ name: v.name, d: mark(v.p), small: v.small ? mark({ ...v.p, ...v.small }) : undefined, note: JSON.stringify(v.p) }));
const f = write(`sketches/_iter${R}.html`, sheetHTML(items, { title: `kept-note refinement round ${R}` }));
await render([{ file: f, out: path.join(OUT, `sketches/_iter${R}.png`), width: 1100, height: 400, fullPage: true, wait: 300 }]);
console.log('ok');
