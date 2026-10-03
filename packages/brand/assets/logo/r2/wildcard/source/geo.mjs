// Tiny geometry kit: points, quadratic/cubic beziers, splits, line intersections.
export const P = (x, y) => ({ x, y });
export const lerp = (a, b, t) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
export const qAt = (p0, c, p1, t) => lerp(lerp(p0, c, t), lerp(c, p1, t), t);
/** Sub-curve of a quadratic between t0 and t1. Returns [p0, c, p1]. */
export function qSub(p0, c, p1, t0, t1) {
  const a = qAt(p0, c, p1, t0), b = qAt(p0, c, p1, t1);
  // control: tangent intersection
  const d0 = lerp(lerp(p0, c, t0), lerp(c, p1, t0), 0); // start of tangent at t0
  const ta = P(2 * (1 - t0) * (c.x - p0.x) + 2 * t0 * (p1.x - c.x), 2 * (1 - t0) * (c.y - p0.y) + 2 * t0 * (p1.y - c.y));
  const cc = P(a.x + ta.x * (t1 - t0) / 2, a.y + ta.y * (t1 - t0) / 2);
  return [a, cc, b];
}
/** Parameter t where quadratic crosses the line through l0,l1 (bisection on signed side). */
export function qCrossLine(p0, c, p1, l0, l1, lo = 0, hi = 1) {
  const side = (p) => (l1.x - l0.x) * (p.y - l0.y) - (l1.y - l0.y) * (p.x - l0.x);
  let a = lo, b = hi, sa = side(qAt(p0, c, p1, a));
  for (let i = 0; i < 60; i++) { const m = (a + b) / 2, sm = side(qAt(p0, c, p1, m)); if (Math.sign(sm) === Math.sign(sa)) { a = m; sa = sm; } else b = m; }
  return (a + b) / 2;
}
export function lineX(a, b, c, d) { // intersection of AB and CD
  const den = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
  const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / den;
  return lerp(a, b, t);
}
const f = (n) => Math.round(n * 10) / 10;
export const pt = (p) => `${f(p.x)} ${f(p.y)}`;
/** Polygon with rounded corners (quadratic fillets). pts: [P], rad: number or array. */
export function roundPoly(pts, rad) {
  const n = pts.length; let d = '';
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n], cur = pts[i], next = pts[(i + 1) % n];
    const R = Array.isArray(rad) ? rad[i] : rad;
    const l1 = Math.hypot(cur.x - prev.x, cur.y - prev.y), l2 = Math.hypot(next.x - cur.x, next.y - cur.y);
    const a = lerp(cur, prev, Math.min(R / l1, 0.5)), b = lerp(cur, next, Math.min(R / l2, 0.5));
    d += (i === 0 ? `M${pt(a)}` : `L${pt(a)}`) + `Q${pt(cur)} ${pt(b)}`;
  }
  return d + 'Z';
}
