// Optical spacing: every pair gets the same clamped white area between baseline and
// x-height (the HT Letterspacer idea, applied to pairs rather than sidebearings).
// The font's own kerning is ignored on purpose: it is tuned for text, not for a logotype.
import { glyph, translate } from './lib.mjs';

/** Flatten commands into polygons (one per contour). */
export function polygons(cmds, steps = 16) {
  const polys = [];
  let cur = null, p = null;
  for (const c of cmds) {
    if (c.type === 'M') { cur = [[c.x, c.y]]; polys.push(cur); p = c; continue; }
    if (c.type === 'Z') { p = cur ? { x: cur[0][0], y: cur[0][1] } : p; continue; }
    if (c.type === 'L') cur.push([c.x, c.y]);
    else if (c.type === 'Q') for (let i = 1; i <= steps; i++) { const t = i / steps, m = 1 - t; cur.push([m * m * p.x + 2 * m * t * c.x1 + t * t * c.x, m * m * p.y + 2 * m * t * c.y1 + t * t * c.y]); }
    else if (c.type === 'C') for (let i = 1; i <= steps; i++) { const t = i / steps, m = 1 - t; cur.push([m ** 3 * p.x + 3 * m * m * t * c.x1 + 3 * m * t * t * c.x2 + t ** 3 * c.x, m ** 3 * p.y + 3 * m * m * t * c.y1 + 3 * m * t * t * c.y2 + t ** 3 * c.y]); }
    p = c;
  }
  return polys;
}

/** Leftmost and rightmost ink at height y, or null if none. */
export function extentAt(polys, y) {
  let lo = Infinity, hi = -Infinity;
  for (const poly of polys) for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
    if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
      const x = x1 + ((y - y1) / (y2 - y1)) * (x2 - x1);
      lo = Math.min(lo, x); hi = Math.max(hi, x);
    }
  }
  return lo === Infinity ? null : [lo, hi];
}

/** Clamped profiles of a glyph over the band. side 'R' = right edge, 'L' = left edge. */
function profile(cmds, side, band, depth, step = 8) {
  const polys = polygons(cmds);
  const raw = [];
  for (let y = band[0] + step / 2; y < band[1]; y += step) {
    const e = extentAt(polys, y);
    raw.push(e ? (side === 'R' ? e[1] : e[0]) : null);
  }
  const vals = raw.filter((v) => v !== null);
  const ext = side === 'R' ? Math.max(...vals) : Math.min(...vals);
  const lim = side === 'R' ? ext - depth : ext + depth;
  return raw.map((v) => (v === null ? lim : side === 'R' ? Math.max(v, lim) : Math.min(v, lim)));
}

const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

/** Mean clamped gap between two glyph outlines when the right one starts at advance offset 0. */
export function pairGap(leftCmds, rightCmds, { band, depth }) {
  const R = profile(leftCmds, 'R', band, depth);
  const L = profile(rightCmds, 'L', band, depth);
  return mean(L.map((l, i) => l - R[i]));
}

/**
 * Set a word with optical spacing.
 * opts: { band:[y0,y1], depth, gap (target mean white, font units), wordSpace (extra white added at the space, on top of the letter gap),
 *         adjust: { 'ab': units } hand corrections on top, glyphs: { index: {cmds, adv} } substitutions }
 */
export function setWord(f, text, opts) {
  const { band, depth, gap, wordSpace = 200, adjust = {}, subs = {} } = opts;
  const chars = [...text];
  const placed = [];
  let x = 0, prev = null;
  chars.forEach((ch, i) => {
    if (ch === ' ') { placed.push({ ch, space: true }); return; }
    const g = subs[i] ?? glyph(f, ch);
    if (prev) {
      const afterSpace = placed[placed.length - 1].space;
      const pairKey = (afterSpace ? ' ' : prev.ch) + ch;
      if (afterSpace) {
        // word space: measured as mean clamped gap, like letters, but larger
        const gp = pairGap(prev.cmds, g.cmds, { band, depth });
        x = prev.x + (gap - gp) + wordSpace;
      } else {
        const gp = pairGap(prev.cmds, g.cmds, { band, depth });
        x = prev.x + (gap - gp);
      }
      x += adjust[pairKey] ?? 0;
      if (afterSpace) x += adjust[prev.ch + ' '] ?? 0;
    }
    const item = { ch, i, x, cmds: translate(g.cmds, x, 0), base: g.cmds, adv: g.adv };
    placed.push(item);
    // pairGap works in absolute coords, so keep positioned cmds on prev
    prev = { ch, x: 0, cmds: item.cmds };
  });
  return placed.filter((p) => !p.space);
}
