// W4 (EB Garamond route, round 2 wordmark) with the word space opened. The outlines are untouched;
// only the subpaths of "Letters" move right. Also exposes W1 (Literata route) unchanged.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const R2W = path.resolve(HERE, '../../../r2/wordmark');
// round 2 W4 word space is 120 units (routes.mjs); split x = first ink of "L" in each cut
const W4 = { master: { file: 'd-garamond/wordmark.svg', splitX: 2100, wordSpace: 120 }, small: { file: 'd-garamond/wordmark-small.svg', splitX: 2250, wordSpace: 120 } };
export const W1 = { master: 'a-signature/wordmark.svg', small: 'a-signature/wordmark-small.svg' };

const num = (s) => s.match(/-?\d*\.?\d+(?:e-?\d+)?/g).map(Number);
export function readW(file) {
  const s = fs.readFileSync(path.join(R2W, file), 'utf8');
  const vb = num(s.match(/viewBox="([^"]+)"/)[1]);
  const d = s.match(/ d="([^"]+)"/)[1];
  return { vb, d };
}
/** shift every subpath whose ink starts right of splitX by dx (absolute commands M L Q C Z only) */
export function openSpace(d, splitX, dx) {
  const subs = d.match(/M[^M]*/g);
  return subs.map((sp) => {
    const xs = num(sp).filter((_, i) => i % 2 === 0);
    if (Math.min(...xs) < splitX) return sp;
    return sp.replace(/([MLQC])([^MLQCZ]*)/g, (_, c, a) => c + num(a).map((v, i) => (i % 2 === 0 ? +(v + dx).toFixed(1) : v)).join(' '));
  }).join('');
}
/** W4 with the word space multiplied by `factor` (1.15 = the brief's 15 percent) */
export function w4(cut = 'master', factor = 1.15) {
  const w = W4[cut], { vb, d } = readW(w.file);
  const dx = w.wordSpace * (factor - 1);
  return { d: openSpace(d, w.splitX, dx), vb: [vb[0], vb[1], vb[2] + dx, vb[3]], dx };
}
export function w1(cut = 'master') { return readW(W1[cut]); }
