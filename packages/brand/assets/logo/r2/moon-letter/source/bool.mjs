// Exact boolean ops for regions bounded by line segments and circular arcs.
// A shape is { loops: [[piece, ...], ...] }. Pieces:
//   { k:'L', a:[x,y], b:[x,y] }
//   { k:'A', c:[x,y], r, t0, t1 }   (angles in radians, y-down, swept from t0 to t1 either direction)
// Intersections are solved analytically; inside tests use a fine flattening (classification only).
const EPS = 1e-7, TAU = Math.PI * 2;
export const P = {
  L: (a, b) => ({ k: 'L', a, b }),
  A: (c, r, t0, t1) => ({ k: 'A', c, r, t0, t1 }),
};
export function at(p, u) { // u in [0,1]
  if (p.k === 'L') return [p.a[0] + (p.b[0] - p.a[0]) * u, p.a[1] + (p.b[1] - p.a[1]) * u];
  const t = p.t0 + (p.t1 - p.t0) * u; return [p.c[0] + p.r * Math.cos(t), p.c[1] + p.r * Math.sin(t)];
}
const start = (p) => at(p, 0), end = (p) => at(p, 1);
export function circle(c, r) { return { loops: [[P.A(c, r, -Math.PI, Math.PI)]] }; }
function paramOn(p, q) { // param u of point q known to lie on p's carrier; null if outside [0,1]
  if (p.k === 'L') {
    const dx = p.b[0] - p.a[0], dy = p.b[1] - p.a[1];
    const u = ((q[0] - p.a[0]) * dx + (q[1] - p.a[1]) * dy) / (dx * dx + dy * dy);
    return u > -EPS && u < 1 + EPS ? Math.min(1, Math.max(0, u)) : null;
  }
  let t = Math.atan2(q[1] - p.c[1], q[0] - p.c[0]);
  const lo = Math.min(p.t0, p.t1), hi = Math.max(p.t0, p.t1);
  for (let k = -2; k <= 2; k++) { const tt = t + k * TAU; if (tt > lo - 1e-9 && tt < hi + 1e-9) return (tt - p.t0) / (p.t1 - p.t0); }
  return null;
}
function carrierHits(p, q) { // points on both carriers
  if (p.k === 'L' && q.k === 'L') {
    const d1 = [p.b[0] - p.a[0], p.b[1] - p.a[1]], d2 = [q.b[0] - q.a[0], q.b[1] - q.a[1]];
    const den = d1[0] * d2[1] - d1[1] * d2[0]; if (Math.abs(den) < 1e-12) return [];
    const s = ((q.a[0] - p.a[0]) * d2[1] - (q.a[1] - p.a[1]) * d2[0]) / den;
    return [[p.a[0] + d1[0] * s, p.a[1] + d1[1] * s]];
  }
  if (p.k === 'A' && q.k === 'L') return carrierHits(q, p);
  if (p.k === 'L') { // line-circle
    const d = [p.b[0] - p.a[0], p.b[1] - p.a[1]], f = [p.a[0] - q.c[0], p.a[1] - q.c[1]];
    const A = d[0] * d[0] + d[1] * d[1], B = 2 * (f[0] * d[0] + f[1] * d[1]), C = f[0] * f[0] + f[1] * f[1] - q.r * q.r;
    const disc = B * B - 4 * A * C; if (disc < 0) return [];
    const sq = Math.sqrt(disc); return [(-B - sq) / (2 * A), (-B + sq) / (2 * A)].map((s) => [p.a[0] + d[0] * s, p.a[1] + d[1] * s]);
  }
  const dx = q.c[0] - p.c[0], dy = q.c[1] - p.c[1], d = Math.hypot(dx, dy);
  if (d < 1e-12 || d > p.r + q.r || d < Math.abs(p.r - q.r)) return [];
  const a = (p.r * p.r - q.r * q.r + d * d) / (2 * d), h = Math.sqrt(Math.max(0, p.r * p.r - a * a));
  const mx = p.c[0] + (a * dx) / d, my = p.c[1] + (a * dy) / d;
  return [[mx + (h * dy) / d, my - (h * dx) / d], [mx - (h * dy) / d, my + (h * dx) / d]];
}
function sub(p, u0, u1) {
  if (p.k === 'L') return P.L(at(p, u0), at(p, u1));
  return P.A(p.c, p.r, p.t0 + (p.t1 - p.t0) * u0, p.t0 + (p.t1 - p.t0) * u1);
}
function split(pieces, cutters) {
  const out = [];
  for (const p of pieces) {
    const us = [0, 1];
    for (const q of cutters) for (const h of carrierHits(p, q)) {
      const u = paramOn(p, h), v = paramOn(q, h); if (u !== null && v !== null) us.push(u);
    }
    us.sort((a, b) => a - b);
    for (let i = 0; i < us.length - 1; i++) if (us[i + 1] - us[i] > 1e-9) out.push(sub(p, us[i], us[i + 1]));
  }
  return out;
}
const flat = (s) => s.loops.map((l) => l.flatMap((p) => Array.from({ length: p.k === 'L' ? 1 : 96 }, (_, i) => at(p, i / (p.k === 'L' ? 1 : 96)))));
export function inside(s, pt) {
  let c = false;
  for (const poly of flat(s)) for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const rev = (p) => (p.k === 'L' ? P.L(p.b, p.a) : P.A(p.c, p.r, p.t1, p.t0));
function chain(pieces) {
  const left = pieces.slice(), loops = [];
  const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-4;
  while (left.length) {
    const loop = [left.shift()];
    for (let guard = 0; guard < 1000; guard++) {
      const e = end(loop[loop.length - 1]);
      if (near(e, start(loop[0])) && loop.length > 1 || (loop.length === 1 && loop[0].k === 'A' && near(e, start(loop[0])))) break;
      const i = left.findIndex((p) => near(start(p), e) || near(end(p), e));
      if (i < 0) throw new Error('open chain at ' + e.map((n) => n.toFixed(2)));
      const p = left.splice(i, 1)[0]; loop.push(near(start(p), e) ? p : rev(p));
    }
    loops.push(loop);
  }
  return { loops };
}
function op(A, B, keepAIn, keepBIn) {
  const pa = A.loops.flat(), pb = B.loops.flat();
  const sa = split(pa, pb), sb = split(pb, pa);
  const keep = [];
  for (const p of sa) if (inside(B, at(p, 0.5)) === keepAIn) keep.push(p);
  for (const p of sb) if (inside(A, at(p, 0.5)) === keepBIn) keep.push(p);
  return chain(keep);
}
export const intersect = (A, B) => op(A, B, true, true);
export const subtract = (A, B) => op(A, B, false, true);
export const union = (A, B) => op(A, B, false, false);
// Rounded polygon from vertices (y-down) with per-corner radius; handles concave corners.
export function roundPoly(pts, rads) {
  const n = pts.length, corners = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n], rr = Array.isArray(rads) ? rads[i] : rads;
    const v1 = nrm([a[0] - p[0], a[1] - p[1]]), v2 = nrm([b[0] - p[0], b[1] - p[1]]);
    const th = Math.acos(Math.max(-1, Math.min(1, v1[0] * v2[0] + v1[1] * v2[1])));
    if (!rr) { corners.push({ s: p, e: p }); continue; }
    const t = rr / Math.tan(th / 2), s = [p[0] + v1[0] * t, p[1] + v1[1] * t], e = [p[0] + v2[0] * t, p[1] + v2[1] * t];
    const bis = nrm([v1[0] + v2[0], v1[1] + v2[1]]), dc = rr / Math.sin(th / 2), c = [p[0] + bis[0] * dc, p[1] + bis[1] * dc];
    let t0 = Math.atan2(s[1] - c[1], s[0] - c[0]), t1 = Math.atan2(e[1] - c[1], e[0] - c[0]);
    let dt = t1 - t0; while (dt > Math.PI) dt -= TAU; while (dt < -Math.PI) dt += TAU;
    corners.push({ s, e, arc: P.A(c, rr, t0, t0 + dt) });
  }
  const loop = [];
  for (let i = 0; i < n; i++) {
    const c = corners[i]; if (c.arc) loop.push(c.arc);
    loop.push(P.L(c.e, corners[(i + 1) % n].s));
  }
  return { loops: [loop] };
}
const nrm = (v) => { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; };
// Offset a simple polygon's vertices outward by g (y-down, clockwise winding on screen assumed).
export function offsetPoly(pts, g) {
  const n = pts.length, lines = [];
  let area = 0; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const sgn = area > 0 ? 1 : -1; // screen-clockwise in y-down => area>0
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], d = nrm([b[0] - a[0], b[1] - a[1]]);
    const nn = [d[1] * sgn, -d[0] * sgn]; // outward normal
    lines.push([[a[0] + nn[0] * g, a[1] + nn[1] * g], [b[0] + nn[0] * g, b[1] + nn[1] * g]]);
  }
  return pts.map((_, i) => {
    const L1 = lines[(i - 1 + n) % n], L2 = lines[i];
    return carrierHits(P.L(...L1), P.L(...L2))[0];
  });
}
// Arc -> cubic Béziers
function arcCubics(p) {
  const segs = Math.max(1, Math.ceil(Math.abs(p.t1 - p.t0) / (Math.PI / 2) - 1e-9)), da = (p.t1 - p.t0) / segs, k = (4 / 3) * Math.tan(da / 4), out = [];
  for (let i = 0; i < segs; i++) {
    const a0 = p.t0 + i * da, a1 = a0 + da, R = p.r, [cx, cy] = p.c;
    const p0 = [cx + R * Math.cos(a0), cy + R * Math.sin(a0)], p3 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)];
    out.push(['C', p0[0] - k * R * Math.sin(a0), p0[1] + k * R * Math.cos(a0), p3[0] + k * R * Math.sin(a1), p3[1] - k * R * Math.cos(a1), ...p3]);
  }
  return out;
}
export function toCmds(s) {
  const cmds = [];
  for (const loop of s.loops) {
    cmds.push(['M', ...start(loop[0])]);
    for (const p of loop) {
      if (p.k === 'L') { const e = end(p), s0 = start(p); if (Math.hypot(e[0] - s0[0], e[1] - s0[1]) > 1e-6) cmds.push(['L', ...e]); }
      else cmds.push(...arcCubics(p));
    }
    // drop the final L that returns to start
    const last = cmds[cmds.length - 1], m = start(loop[0]);
    if (last[0] === 'L' && Math.hypot(last[1] - m[0], last[2] - m[1]) < 1e-4) cmds.pop();
    cmds.push(['Z']);
  }
  return cmds;
}
export const fmt = (n) => { const v = Math.round(n * 10) / 10; return Object.is(v, -0) ? '0' : String(v); };
export const toD = (cmds) => cmds.map((c) => c[0] + c.slice(1).map(fmt).join(' ')).join('');
export function transform(cmds, f) { // f([x,y]) -> [x,y]
  return cmds.map((c) => { if (c[0] === 'Z') return c; const o = [c[0]]; for (let i = 1; i < c.length; i += 2) o.push(...f([c[i], c[i + 1]])); return o; });
}
export function bbox(cmds) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of cmds) for (let i = 1; i < c.length; i += 2) { x0 = Math.min(x0, c[i]); x1 = Math.max(x1, c[i]); y0 = Math.min(y0, c[i + 1]); y1 = Math.max(y1, c[i + 1]); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
