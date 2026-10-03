// Geometry helpers: everything ends as filled paths with cubic beziers.
const r = (n) => Math.round(n * 100) / 100;
export const fmt = r;
/** Full circle as two arcs, converted to 4 cubics (filled-path friendly, no arc commands). */
export function circle(cx, cy, R, ccw = false) {
  const k = 0.5522847498 * R;
  const p = [[cx + R, cy], [cx, cy + R], [cx - R, cy], [cx, cy - R]];
  const t = [[0, 1], [-1, 0], [0, -1], [1, 0]];
  let pts = p, tan = t;
  if (ccw) { pts = [p[0], p[3], p[2], p[1]]; tan = [[0, -1], [-1, 0], [0, 1], [1, 0]]; }
  let d = `M${r(pts[0][0])} ${r(pts[0][1])}`;
  for (let i = 0; i < 4; i++) {
    const a = pts[i], b = pts[(i + 1) % 4], ta = tan[i], tb = tan[(i + 1) % 4];
    d += `C${r(a[0] + ta[0] * k)} ${r(a[1] + ta[1] * k)} ${r(b[0] - tb[0] * k)} ${r(b[1] - tb[1] * k)} ${r(b[0])} ${r(b[1])}`;
  }
  return d + 'Z';
}
/** Smooth cubic through sampled points using Catmull-Rom derived tangents (open or closed). */
export function smooth(pts, closed = false, move = true) {
  const n = pts.length; let d = move ? `M${r(pts[0][0])} ${r(pts[0][1])}` : `L${r(pts[0][0])} ${r(pts[0][1])}`;
  const P = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(p2[0])} ${r(p2[1])}`;
  }
  return d;
}
/** A stroke with variable width along a centreline c(t), t in [0,1], as one filled outline. */
export function band(c, w, { n = 16, capStart = 'round', capEnd = 'round' } = {}) {
  const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, e = 1e-4;
    const p = c(t), q = c(Math.min(1, t + e)), o = c(Math.max(0, t - e));
    let tx = q[0] - o[0], ty = q[1] - o[1]; const m = Math.hypot(tx, ty); tx /= m; ty /= m;
    const h = w(t) / 2;
    L.push([p[0] - ty * h, p[1] + tx * h]); R.push([p[0] + ty * h, p[1] - tx * h]);
  }
  // round cap as two cubic quarter circles bulging along tangent T (no arc commands)
  const cap = (a, b, centre, kind, T) => {
    if (kind !== 'round') return `L${r(b[0])} ${r(b[1])}`;
    const h = Math.hypot(a[0] - centre[0], a[1] - centre[1]);
    if (h < 0.05) return `L${r(b[0])} ${r(b[1])}`;
    const k = 0.5522847498, M = [centre[0] + T[0] * h, centre[1] + T[1] * h];
    return `C${r(a[0] + T[0] * k * h)} ${r(a[1] + T[1] * k * h)} ${r(M[0] + (a[0] - centre[0]) * k)} ${r(M[1] + (a[1] - centre[1]) * k)} ${r(M[0])} ${r(M[1])}` +
      `C${r(M[0] + (b[0] - centre[0]) * k)} ${r(M[1] + (b[1] - centre[1]) * k)} ${r(b[0] + T[0] * k * h)} ${r(b[1] + T[1] * k * h)} ${r(b[0])} ${r(b[1])}`;
  };
  const tan = (t, s) => { const e = 1e-4; const q = c(Math.min(1, t + e)), o = c(Math.max(0, t - e)); const m = Math.hypot(q[0] - o[0], q[1] - o[1]); return [s * (q[0] - o[0]) / m, s * (q[1] - o[1]) / m]; };
  let d = smooth(L);
  d += cap(L[n], R[n], c(1), capEnd, tan(1, 1));
  d += smooth(R.slice().reverse(), false, false).replace(/^L[^C]*/, '');
  d += cap(R[0], L[0], c(0), capStart, tan(0, -1)) + 'Z';
  return d;
}
