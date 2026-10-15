// G2 outline toolkit for the final Early Letters mark.
// A glyph is a closed list of ANCHORS: { p:{x,y}, t: tangent angle (deg, direction of travel, screen y-down),
// k: signed curvature (1/units; positive = convex for a clockwise-on-screen outline) }.
// Consecutive anchors are joined by ONE cubic whose handle lengths are solved so that position, tangent AND
// curvature match at both ends (G2 Hermite). So every on-curve node is curvature-continuous by construction,
// unless an anchor is flagged corner:true (none are, in the shipped mark).
export const P = (x, y) => ({ x, y });
export const rad = (d) => (d * Math.PI) / 180;
export const deg = (r) => (r * 180) / Math.PI;
const add = (a, b) => P(a.x + b.x, a.y + b.y);
const sub = (a, b) => P(a.x - b.x, a.y - b.y);
const mul = (a, s) => P(a.x * s, a.y * s);
const cross = (a, b) => a.x * b.y - a.y * b.x;
const dir = (d) => P(Math.cos(rad(d)), Math.sin(rad(d)));
export const A = (x, y, t, k = 0) => ({ p: P(x, y), t, k });

/** Anchor on a circle centre c radius r at angle a (deg), travelling clockwise on screen (cw=true) or anticlockwise. */
export function onCircle(c, r, a, cw = true) {
  const p = add(c, mul(dir(a), r));
  return { p, t: cw ? a + 90 : a - 90, k: cw ? 1 / r : -1 / r };
}

/** Solve handle lengths (a, b) for a G2 cubic between anchors s and e. Falls back to the best least-squares pair. */
export function g2cubic(s, e) {
  const T0 = dir(s.t), T3 = dir(e.t), D = sub(e.p, s.p), L = Math.hypot(D.x, D.y);
  const c03 = cross(T0, T3), c0D = cross(T0, D), c3D = cross(T3, D);
  // k0 = (2/3)(c0D - b c03)/a^2 ; k1 = (2/3)(-c3D + a*(-c03)... ) using cross(T3,T0) = -c03
  const f = (a, b) => [1.5 * s.k * a * a - (c0D - b * c03), 1.5 * e.k * b * b - (-c3D - a * c03)];
  let best = null;
  const consider = (a, b) => {
    if (!(a > 0.04 * L && b > 0.04 * L && a < 0.85 * L && b < 0.85 * L)) return;
    const [r1, r2] = f(a, b);
    const err = Math.hypot(r1, r2) / (L * L) + 0.002 * (Math.abs(a - L / 3) + Math.abs(b - L / 3)) / L;
    if (!best || err < best.err) best = { a, b, err };
  };
  // scan a; for each a, b from eq1 if c03 != 0, else from eq2
  for (let i = 1; i <= 4000; i++) {
    const a = (i / 4000) * 0.85 * L;
    if (Math.abs(c03) > 1e-6) consider(a, (c0D - 1.5 * s.k * a * a) / c03);
    if (Math.abs(e.k) > 1e-9) {
      const v = (-c3D - a * c03) / (1.5 * e.k);
      if (v > 0) consider(a, Math.sqrt(v));
    }
  }
  // refine with Newton from best (or from L/3, L/3)
  let a = best ? best.a : L / 3, b = best ? best.b : L / 3;
  for (let it = 0; it < 60; it++) {
    const [r1, r2] = f(a, b), h = 1e-7 * L;
    const [a1, a2] = f(a + h, b), [b1, b2] = f(a, b + h);
    const J = [[(a1 - r1) / h, (b1 - r1) / h], [(a2 - r2) / h, (b2 - r2) / h]];
    const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
    if (Math.abs(det) < 1e-14) break;
    const da = (r1 * J[1][1] - r2 * J[0][1]) / det, db = (J[0][0] * r2 - J[1][0] * r1) / det;
    const na = a - da, nb = b - db;
    if (!(na > 0.04 * L && nb > 0.04 * L && na < 0.85 * L && nb < 0.85 * L)) break;
    a = na; b = nb;
    if (Math.hypot(da, db) < 1e-10 * L) break;
  }
  const [r1, r2] = f(a, b);
  const ok = Math.hypot(r1, r2) < 1e-6 * L * L;
  return { c1: add(s.p, mul(T0, a)), c2: sub(e.p, mul(T3, b)), p: e.p, ok, a: a / L, b: b / L };
}

/** Residual of the G2 conditions for a solved cubic, normalised (0 = exact). */
function resid(s, e) {
  const g = g2cubic(s, e);
  return { g, r: g.ok ? 0 : g.err ?? 1 };
}
/** Curvature at the ends of a cubic (for residual measurement). */
function endK(p0, g) {
  const k = (d1, d2) => cross(d1, d2) / Math.pow(Math.hypot(d1.x, d1.y), 3);
  const d10 = mul(sub(g.c1, p0), 3), d20 = mul(add(sub(p0, mul(g.c1, 2)), g.c2), 6);
  const d11 = mul(sub(g.p, g.c2), 3), d21 = mul(add(sub(g.c1, mul(g.c2, 2)), g.p), 6);
  return [k(d10, d20), k(d11, d21)];
}
function g2err(s, e, g) {
  const [k0, k1] = endK(s.p, g); const L = Math.hypot(e.p.x - s.p.x, e.p.y - s.p.y);
  return (Math.abs(k0 - s.k) + Math.abs(k1 - e.k)) * L;
}
/**
 * Where a single G2 cubic does not exist, the span is split by one extra on-curve node whose position,
 * tangent and curvature are optimised (Nelder-Mead) so that BOTH halves are G2 and the curvature runs fair.
 */
function splitG2(s, e) {
  const L0 = Math.hypot(e.p.x - s.p.x, e.p.y - s.p.y);
  const g0 = { c1: add(s.p, mul(dir(s.t), L0 / 3)), c2: sub(e.p, mul(dir(e.t), L0 / 3)), p: e.p };
  const m = bez(s.p, g0, 0.5);
  const d1 = sub(bez(s.p, g0, 0.51), bez(s.p, g0, 0.49));
  const t0 = deg(Math.atan2(d1.y, d1.x));
  const L = Math.hypot(e.p.x - s.p.x, e.p.y - s.p.y);
  const f = (v) => {
    const mid = { p: P(m.x + v[0] * L, m.y + v[1] * L), t: t0 + v[2] * 30, k: (s.k + e.k) / 2 + v[3] / L };
    const a = g2cubic(s, mid), b = g2cubic(mid, e);
    const ea = g2err(s, mid, a), eb = g2err(mid, e, b);
    // fairness: curvature should move monotonically-ish; penalise distance from the chord-guess and extreme k
    const fair = 0.02 * Math.hypot(v[0], v[1]) + 0.0005 * Math.abs(v[3]);
    return { val: ea + eb + fair, mid, a, b };
  };
  // Nelder-Mead in 4D
  let simplex = [[0, 0, 0, 0], [0.04, 0, 0, 0], [0, 0.04, 0, 0], [0, 0, 0.1, 0], [0, 0, 0, 0.5]].map((v) => ({ v, f: f(v) }));
  for (let it = 0; it < 900; it++) {
    simplex.sort((x, y) => x.f.val - y.f.val);
    const n = 4, cen = [0, 0, 0, 0];
    for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) cen[j] += simplex[i].v[j] / n;
    const pt = (c, w, coef) => c.map((x, j) => x + coef * (w.v[j] - x));
    const worst = simplex[n];
    const xr = pt(cen, worst, -1), fr = f(xr);
    if (fr.val < simplex[0].f.val) { const xe = pt(cen, worst, -2), fe = f(xe); simplex[n] = fe.val < fr.val ? { v: xe, f: fe } : { v: xr, f: fr }; }
    else if (fr.val < simplex[n - 1].f.val) simplex[n] = { v: xr, f: fr };
    else { const xc = pt(cen, worst, 0.5), fc = f(xc); if (fc.val < worst.f.val) simplex[n] = { v: xc, f: fc }; else { const b0 = simplex[0].v; simplex = simplex.map((s2, i) => i === 0 ? s2 : (() => { const v = s2.v.map((x, j) => b0[j] + 0.5 * (x - b0[j])); return { v, f: f(v) }; })()); } }
  }
  simplex.sort((x, y) => x.f.val - y.f.val);
  return simplex[0].f;
}

/** Build a closed shape from anchors. Returns { start, segs, anchors, report }. */
export function shape(anchors) {
  const segs = [], report = [], all = [];
  for (let i = 0; i < anchors.length; i++) {
    const s = anchors[i], e = anchors[(i + 1) % anchors.length];
    const g = g2cubic(s, e);
    const err = g2err(s, e, g);
    all.push(s);
    if (err < 1e-3) { segs.push(g); report.push({ i, tag: s.tag, ok: true, err: +err.toExponential(1) }); continue; }
    const sp = splitG2(s, e);
    const e1 = g2err(s, sp.mid, sp.a), e2 = g2err(sp.mid, e, sp.b);
    segs.push(sp.a, sp.b); all.push({ ...sp.mid, tag: 'split' });
    report.push({ i, tag: s.tag, ok: e1 < 1e-3 && e2 < 1e-3, split: true, err: +(e1 + e2).toExponential(1), was: +err.toExponential(1) });
  }
  return { start: anchors[0].p, segs, anchors: all, report };
}

export function transform(sh, { s = 1, rot = 0, tx = 0, ty = 0, sx, sy } = {}) {
  const a = rad(rot), ca = Math.cos(a), sa = Math.sin(a), kx = sx ?? s, ky = sy ?? s;
  const f = (p) => { const x = p.x * kx, y = p.y * ky; return P(x * ca - y * sa + tx, x * sa + y * ca + ty); };
  return { start: f(sh.start), segs: sh.segs.map((g) => ({ ...g, c1: f(g.c1), c2: f(g.c2), p: f(g.p) })), anchors: sh.anchors?.map((an) => ({ ...an, p: f(an.p), t: an.t + rot, k: an.k / s })) };
}
const r2 = (n) => (Math.round(n * 100) / 100).toString();
export function toD(shapes) {
  return shapes.map((sh) => `M${r2(sh.start.x)} ${r2(sh.start.y)}` + sh.segs.map((g) => `C${r2(g.c1.x)} ${r2(g.c1.y)} ${r2(g.c2.x)} ${r2(g.c2.y)} ${r2(g.p.x)} ${r2(g.p.y)}`).join('') + 'Z').join('');
}
export function bez(p0, g, t) {
  const m = 1 - t;
  return P(m * m * m * p0.x + 3 * m * m * t * g.c1.x + 3 * m * t * t * g.c2.x + t * t * t * g.p.x, m * m * m * p0.y + 3 * m * m * t * g.c1.y + 3 * m * t * t * g.c2.y + t * t * t * g.p.y);
}
export function bbox(shapes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const sh of shapes) { let p0 = sh.start; for (const g of sh.segs) { for (let t = 0; t <= 1.0001; t += 0.01) { const q = bez(p0, g, t); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); } p0 = g.p; } }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
/** Dense polygon of a shape (for area, centroid, distances). */
export function poly(sh, n = 40) {
  const pts = []; let p0 = sh.start;
  for (const g of sh.segs) { for (let i = 0; i < n; i++) pts.push(bez(p0, g, i / n)); p0 = g.p; }
  return pts;
}
export function areaCentroid(shapes) {
  let A = 0, cx = 0, cy = 0;
  for (const sh of shapes) { const p = poly(sh, 60); for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; const c = a.x * b.y - b.x * a.y; A += c; cx += (a.x + b.x) * c; cy += (a.y + b.y) * c; } }
  A /= 2; return { area: Math.abs(A), cx: cx / (6 * A), cy: cy / (6 * A) };
}
/** Minimum distance between two shapes' outlines (sampled). */
export function minGap(a, b) {
  const pa = poly(a, 50), pb = poly(b, 50); let m = Infinity;
  for (const p of pa) for (const q of pb) { const d = Math.hypot(p.x - q.x, p.y - q.y); if (d < m) m = d; }
  return m;
}
/** Curvature comb as SVG path segments (for proofs). */
export function comb(sh, scale, n = 24, cap = Infinity) {
  let out = '', p0 = sh.start; const tips = [];
  for (const g of sh.segs) {
    for (let i = 0; i <= n; i++) {
      const t = i / n, m = 1 - t;
      const d1 = P(3 * m * m * (g.c1.x - p0.x) + 6 * m * t * (g.c2.x - g.c1.x) + 3 * t * t * (g.p.x - g.c2.x), 3 * m * m * (g.c1.y - p0.y) + 6 * m * t * (g.c2.y - g.c1.y) + 3 * t * t * (g.p.y - g.c2.y));
      const d2 = P(6 * m * (g.c2.x - 2 * g.c1.x + p0.x) + 6 * t * (g.p.x - 2 * g.c2.x + g.c1.x), 6 * m * (g.c2.y - 2 * g.c1.y + p0.y) + 6 * t * (g.p.y - 2 * g.c2.y + g.c1.y));
      const sp = Math.hypot(d1.x, d1.y); const k = cross(d1, d2) / (sp * sp * sp);
      const q = bez(p0, g, t), nrm = P(d1.y / sp, -d1.x / sp); // outward normal for a cw-on-screen outline
      const kk = Math.max(-cap, Math.min(cap, k));
      const tip = add(q, mul(nrm, kk * scale));
      out += `M${r2(q.x)} ${r2(q.y)}L${r2(tip.x)} ${r2(tip.y)}`; tips.push(tip);
    }
    p0 = g.p;
  }
  return { teeth: out, spine: 'M' + tips.map((t) => `${r2(t.x)} ${r2(t.y)}`).join('L') };
}
