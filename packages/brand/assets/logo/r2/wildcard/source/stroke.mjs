// Variable-width stroke to filled outline. Centerline is a function t -> {x,y}; width is t -> w.
// The outline is sampled, then re-fitted as Catmull-Rom cubics through a small number of knots,
// so the final SVG is filled paths only (no strokes) with smooth, few-node curves.
const f = (n) => Math.round(n * 10) / 10;

export function sample(fn, n) { const a = []; for (let i = 0; i <= n; i++) a.push(fn(i / n)); return a; }

/** Catmull-Rom (centripetal-ish, uniform) through points -> cubic path segments. closed: wrap. */
export function crPath(pts, closed = false, tension = 1) {
  const n = pts.length; const get = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6 * tension, y: p1.y + (p2.y - p0.y) / 6 * tension };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6 * tension, y: p2.y - (p3.y - p1.y) / 6 * tension };
    d += `C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return closed ? d + 'Z' : d;
}

/** Tapered stroke: centerline fn(t), width w(t). Rounded or pointed ends. knots: outline nodes per side. */
export function taper(fn, w, { knots = 14, capStart = 'round', capEnd = 'round' } = {}) {
  const eps = 1e-4; const L = [], R = [];
  for (let i = 0; i <= knots; i++) {
    const t = i / knots; const p = fn(t);
    const a = fn(Math.max(0, t - eps)), b = fn(Math.min(1, t + eps));
    let dx = b.x - a.x, dy = b.y - a.y; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    const h = w(t) / 2;
    L.push({ x: p.x - dy * h, y: p.y + dx * h, tx: dx, ty: dy, h });
    R.push({ x: p.x + dy * h, y: p.y - dx * h, tx: dx, ty: dy, h });
  }
  const cap = (pt, side, sign) => { // semicircle-ish cap via 2 extra points
    const c = { x: (side[0].x + side[1].x) / 2, y: (side[0].y + side[1].y) / 2 };
    return [{ x: c.x + sign * pt.tx * pt.h * 0.92, y: c.y + sign * pt.ty * pt.h * 0.92 }];
  };
  const endP = fn(1), startP = fn(0);
  const out = [...L];
  if (capEnd === 'round' && w(1) > 1) out.push(...cap(L[knots], [L[knots], R[knots]], 1));
  out.push(...R.reverse());
  if (capStart === 'round' && w(0) > 1) out.push(...cap(L[0], [R[R.length - 1], L[0]], -1));
  return crPath(out, true);
}

export const cubic = (p0, p1, p2, p3) => (t) => {
  const u = 1 - t;
  return { x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y };
};
