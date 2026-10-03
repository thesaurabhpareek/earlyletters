// The quote pair: ONE drawing of an opening quotation mark, used at two scales (parent and child).
import { glyph, quoteArc, transform, bbox, toD } from './y-geom.mjs';

// The master "6", constructed like type: a round ball (radius 1 at the origin) and a constant-width tail cut
// from an annulus whose outer circle is tangent to the ball, so the outer edge flows out of the ball with
// no seam. A fillet of radius rf rounds the counter (no notch, no cusp). The cut is calm and nearly flat,
// perpendicular to the tail, as in Literata and the classic book faces. 10 on-curve nodes.
export const G = { Ro: 3.6, aT: 201, tipA: 246, w: 0.64, rf: 0.14, cap: 0.4 };
export const mark = (o = {}) => quoteArc({ ...G, ...o });

/** Pair geometry. ratio = child / parent. Both balls sit on one baseline (y = 1). gap = clear space between balls. */
export const PAIR = { ratio: 0.62, gap: 0.12, lean: -8 };
export function pair(o = {}, p = {}) {
  const q = { ...PAIR, ...p };
  const big = mark(o);
  const s = q.ratio;
  const kid = transform(mark(o), { s, rot: q.lean, tx: 1 + q.gap + s, ty: 1 - s });
  return [big, kid];
}

/** Fit shapes into a box: returns transformed shapes whose bbox is centred at (cx, cy) with the given height (or width). */
export function fit(shapes, { cx, cy, h, w }) {
  const b = bbox(shapes);
  const s = h ? h / b.h : w / b.w;
  return shapes.map((sh) => transform(sh, { s, tx: cx - (b.x0 + b.w / 2) * s, ty: cy - (b.y0 + b.h / 2) * s }));
}
export { toD, bbox, transform };
