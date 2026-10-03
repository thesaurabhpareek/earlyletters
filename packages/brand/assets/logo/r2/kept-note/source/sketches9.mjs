// Sheet 9: the paper-cut heart, made by a fold. Fold, cut half a heart at the crease, open.
import path from 'node:path';
import { poly, sheetHTML, render, write, OUT } from './lib.mjs';

// half heart profile on the right of x=cx (y from top to bottom), returned as path points for a cut
function halfHeart(cx, top, h, w) {
  // starts at the notch (cx, top + h*0.22), lobe out to (cx+w, ...), down to point (cx, top+h)
  const n = top + h * 0.24;
  return { n, d: `C${cx + w * 0.05} ${top - h * 0.02} ${cx + w} ${top - h * 0.06} ${cx + w} ${top + h * 0.36}C${cx + w} ${top + h * 0.62} ${cx + w * 0.4} ${top + h * 0.8} ${cx} ${top + h}` };
}
const g = 26;
// H1: open note, flat, crease gap, heart cut across the crease.
function H(cx, x0, x1, y0, y1, ht, hh, hw, gap) {
  const L = cx - gap / 2, R = cx + gap / 2;
  // right leaf: from crease top, down to heart notch, around lobe, to point, down crease, around.
  const n = ht + hh * 0.24;
  const right = `M${R} ${y0}L${x1} ${y0}L${x1} ${y1}L${R} ${y1}L${R} ${ht + hh}`
    + `C${R + hw * 0.4} ${ht + hh * 0.8} ${R + hw} ${ht + hh * 0.62} ${R + hw} ${ht + hh * 0.36}`
    + `C${R + hw} ${ht - hh * 0.06} ${R + hw * 0.05} ${ht - hh * 0.02} ${R} ${n}Z`;
  const left = `M${L} ${y0}L${x0} ${y0}L${x0} ${y1}L${L} ${y1}L${L} ${ht + hh}`
    + `C${L - hw * 0.4} ${ht + hh * 0.8} ${L - hw} ${ht + hh * 0.62} ${L - hw} ${ht + hh * 0.36}`
    + `C${L - hw} ${ht - hh * 0.06} ${L - hw * 0.05} ${ht - hh * 0.02} ${L} ${n}Z`;
  return left + right;
}
const H1 = H(500, 210, 790, 170, 830, 330, 300, 170, g);
// H3: closed note: crease on the left, half a heart bitten out of the fold edge.
const H3 = (() => {
  const L = 340, x1 = 700, y0 = 170, y1 = 830, ht = 330, hh = 300, hw = 170, n = ht + hh * 0.24;
  return `M${L} ${y0}L${x1} ${y0}L${x1} ${y1}L${L} ${y1}L${L} ${ht + hh}`
    + `C${L + hw * 0.4} ${ht + hh * 0.8} ${L + hw} ${ht + hh * 0.62} ${L + hw} ${ht + hh * 0.36}`
    + `C${L + hw} ${ht - hh * 0.06} ${L + hw * 0.05} ${ht - hh * 0.02} ${L} ${n}Z`;
})();
// H2: note open ~140 deg, leaves in perspective (shorter at the outer edges)
const H2 = (() => {
  const cx = 500, gap = g, L = cx - gap / 2, R = cx + gap / 2, ht = 320, hh = 290, hw = 150, n = ht + hh * 0.24;
  const right = `M${R} 150L790 200L790 800L${R} 850L${R} ${ht + hh}`
    + `C${R + hw * 0.4} ${ht + hh * 0.8} ${R + hw} ${ht + hh * 0.62} ${R + hw} ${ht + hh * 0.36}`
    + `C${R + hw} ${ht - hh * 0.06} ${R + hw * 0.05} ${ht - hh * 0.02} ${R} ${n}Z`;
  const left = `M${L} 150L210 200L210 800L${L} 850L${L} ${ht + hh}`
    + `C${L - hw * 0.4} ${ht + hh * 0.8} ${L - hw} ${ht + hh * 0.62} ${L - hw} ${ht + hh * 0.36}`
    + `C${L - hw} ${ht - hh * 0.06} ${L - hw * 0.05} ${ht - hh * 0.02} ${L} ${n}Z`;
  return left + right;
})();
const items = [
  { name: 'H1 open note, heart cut through the fold', d: H1 },
  { name: 'H2 note still holding its fold, heart across the crease', d: H2 },
  { name: 'H3 closed note: half a heart at the fold', d: H3 },
];
const f = write('sketches/_sheet9.html', sheetHTML(items, { title: 'kept-note sketches, sheet 9' }));
await render([{ file: f, out: path.join(OUT, 'sketches/_sheet9.png'), width: 1100, height: 400, fullPage: true, wait: 300 }]);
console.log('ok');
