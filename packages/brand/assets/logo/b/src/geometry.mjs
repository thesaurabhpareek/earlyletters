// Pen-stroke geometry for logo direction B ("The voice, kept").
//
// A centreline of cubic beziers is expanded into a filled outline with a
// gently varying pen width, then curve-fitted back to a small number of
// cubic nodes (Schneider, Graphics Gems 1990). Output is a single filled
// path: no strokes, so it scales identically in every renderer.

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, s) => [a[0] * s, a[1] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const len = (a) => Math.hypot(a[0], a[1]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const dist = (a, b) => len(sub(a, b));

export function bez(c, t) {
  const u = 1 - t;
  return [
    u * u * u * c[0][0] + 3 * u * u * t * c[1][0] + 3 * u * t * t * c[2][0] + t * t * t * c[3][0],
    u * u * u * c[0][1] + 3 * u * u * t * c[1][1] + 3 * u * t * t * c[2][1] + t * t * t * c[3][1],
  ];
}
function bezD(c, t) {
  const u = 1 - t;
  return [
    3 * u * u * (c[1][0] - c[0][0]) + 6 * u * t * (c[2][0] - c[1][0]) + 3 * t * t * (c[3][0] - c[2][0]),
    3 * u * u * (c[1][1] - c[0][1]) + 6 * u * t * (c[2][1] - c[1][1]) + 3 * t * t * (c[3][1] - c[2][1]),
  ];
}
function bezDD(c, t) {
  const u = 1 - t;
  return [
    6 * u * (c[2][0] - 2 * c[1][0] + c[0][0]) + 6 * t * (c[3][0] - 2 * c[2][0] + c[1][0]),
    6 * u * (c[2][1] - 2 * c[1][1] + c[0][1]) + 6 * t * (c[3][1] - 2 * c[2][1] + c[1][1]),
  ];
}

/** Parse "M x y C x y, x y, x y ..." (absolute M/C/L only) into cubic segments. */
export function parseCentreline(d) {
  const tok = d.replace(/,/g, ' ').trim().split(/\s+/);
  const segs = [];
  let i = 0, cur = null, cmd = null;
  while (i < tok.length) {
    if (/^[MCL]$/.test(tok[i])) cmd = tok[i++];
    const n = () => parseFloat(tok[i++]);
    if (cmd === 'M') { cur = [n(), n()]; cmd = 'C'; continue; }
    if (cmd === 'C') { const p1 = [n(), n()], p2 = [n(), n()], p3 = [n(), n()]; segs.push([cur, p1, p2, p3]); cur = p3; }
    if (cmd === 'L') { const p3 = [n(), n()]; segs.push([cur, add(cur, mul(sub(p3, cur), 1 / 3)), add(cur, mul(sub(p3, cur), 2 / 3)), p3]); cur = p3; }
  }
  return segs;
}

/** Sample the centreline evenly by arc length. Returns [{p, tan, s}] with s in 0..1. */
export function sample(segs, step = 0.08) {
  const raw = [];
  for (const c of segs) for (let k = 0; k < 400; k++) {
    const t = k / 400;
    raw.push({ p: bez(c, t), tan: norm(bezD(c, t)) });
  }
  raw.push({ p: bez(segs.at(-1), 1), tan: norm(bezD(segs.at(-1), 1)) });
  let acc = 0; raw[0].L = 0;
  for (let k = 1; k < raw.length; k++) { acc += dist(raw[k].p, raw[k - 1].p); raw[k].L = acc; }
  const total = acc, out = [];
  const n = Math.max(2, Math.round(total / step));
  let j = 0;
  for (let k = 0; k <= n; k++) {
    const L = (k / n) * total;
    while (j < raw.length - 2 && raw[j + 1].L < L) j++;
    const a = raw[j], b = raw[j + 1];
    const f = b.L > a.L ? (L - a.L) / (b.L - a.L) : 0;
    out.push({ p: add(a.p, mul(sub(b.p, a.p), f)), tan: norm(add(mul(a.tan, 1 - f), mul(b.tan, f))), s: L / total, L });
  }
  out.total = total;
  return out;
}

function segIntersect(p1, p2, p3, p4) {
  const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
  if (Math.abs(d) < 1e-12) return null;
  const ua = ((p4[0] - p3[0]) * (p1[1] - p3[1]) - (p4[1] - p3[1]) * (p1[0] - p3[0])) / d;
  const ub = ((p2[0] - p1[0]) * (p1[1] - p3[1]) - (p2[1] - p1[1]) * (p1[0] - p3[0])) / d;
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;
  return [p1[0] + ua * (p2[0] - p1[0]), p1[1] + ua * (p2[1] - p1[1])];
}

/** Remove small local loops (swallowtails) from an offset polyline. */
export function untangle(pts, window = 120) {
  const out = [];
  let i = 0;
  while (i < pts.length) {
    out.push(pts[i]);
    let jumped = false;
    for (let j = Math.min(pts.length - 2, i + window); j > i + 1; j--) {
      const x = i + 1 < pts.length ? segIntersect(pts[i], pts[i + 1], pts[j], pts[j + 1]) : null;
      if (x) { out.push(x); i = j + 1; jumped = true; break; }
    }
    if (!jumped) i++;
  }
  return out;
}

// ---------- Schneider curve fitting ----------
function chordParams(pts) {
  const u = [0];
  for (let i = 1; i < pts.length; i++) u.push(u[i - 1] + dist(pts[i], pts[i - 1]));
  const T = u.at(-1);
  return u.map((x) => x / T);
}
function generateBezier(pts, u, t1, t2) {
  const p0 = pts[0], p3 = pts.at(-1);
  let C00 = 0, C01 = 0, C11 = 0, X0 = 0, X1 = 0;
  for (let i = 0; i < pts.length; i++) {
    const t = u[i], b0 = (1 - t) ** 3, b1 = 3 * t * (1 - t) ** 2, b2 = 3 * t * t * (1 - t), b3 = t ** 3;
    const A1 = mul(t1, b1), A2 = mul(t2, b2);
    C00 += dot(A1, A1); C01 += dot(A1, A2); C11 += dot(A2, A2);
    const tmp = sub(pts[i], add(add(mul(p0, b0 + b1), mul(p3, b2 + b3)), [0, 0]));
    X0 += dot(A1, tmp); X1 += dot(A2, tmp);
  }
  const det = C00 * C11 - C01 * C01;
  let a1 = det ? (X0 * C11 - X1 * C01) / det : 0;
  let a2 = det ? (C00 * X1 - C01 * X0) / det : 0;
  const seg = dist(p0, p3), eps = 1e-6 * seg;
  if (a1 < eps || a2 < eps) { a1 = a2 = seg / 3; }
  return [p0, add(p0, mul(t1, a1)), add(p3, mul(t2, a2)), p3];
}
function reparam(c, pts, u) {
  return u.map((t, i) => {
    const d = sub(bez(c, t), pts[i]), d1 = bezD(c, t), d2 = bezDD(c, t);
    const den = dot(d1, d1) + dot(d, d2);
    const nt = den ? t - dot(d, d1) / den : t;
    return Math.min(1, Math.max(0, nt));
  });
}
function maxErr(c, pts, u) {
  let m = 0, idx = Math.floor(pts.length / 2);
  for (let i = 1; i < pts.length - 1; i++) { const e = dist(bez(c, u[i]), pts[i]); if (e > m) { m = e; idx = i; } }
  return [m, idx];
}
function fitCubic(pts, t1, t2, err, out) {
  if (pts.length === 2) {
    const d = dist(pts[0], pts[1]) / 3;
    out.push([pts[0], add(pts[0], mul(t1, d)), add(pts[1], mul(t2, d)), pts[1]]);
    return;
  }
  let u = chordParams(pts);
  let c = generateBezier(pts, u, t1, t2);
  let [e, split] = maxErr(c, pts, u);
  if (e < err) { out.push(c); return; }
  if (e < err * 6) {
    for (let k = 0; k < 20; k++) {
      u = reparam(c, pts, u);
      c = generateBezier(pts, u, t1, t2);
      [e, split] = maxErr(c, pts, u);
      if (e < err) { out.push(c); return; }
    }
  }
  split = Math.max(1, Math.min(pts.length - 2, split));
  const tc = norm(sub(pts[split - 1], pts[split + 1]));
  fitCubic(pts.slice(0, split + 1), t1, tc, err, out);
  fitCubic(pts.slice(split), mul(tc, -1), t2, err, out);
}
/** Fit a smooth polyline with as few cubics as the tolerance allows. */
export function fitCurve(pts, err) {
  const clean = pts.filter((p, i) => i === 0 || dist(p, pts[i - 1]) > 1e-4);
  const k = Math.min(4, clean.length - 1);
  const t1 = norm(sub(clean[k], clean[0]));
  const t2 = norm(sub(clean.at(-1 - k), clean.at(-1)));
  const out = [];
  fitCubic(clean, t1, t2, err, out);
  return out;
}

/** Quarter-circle arcs as cubics, from point a around centre c by +-90 degrees. */
function capArc(centre, from, to, dir) {
  // Semicircle from `from` to `to` around `centre`, bulging towards `dir`.
  const r = (dist(from, centre) + dist(to, centre)) / 2;
  const a0 = Math.atan2(from[1] - centre[1], from[0] - centre[0]);
  const a1 = Math.atan2(to[1] - centre[1], to[0] - centre[0]);
  let sweep = a1 - a0;
  while (sweep <= -Math.PI) sweep += 2 * Math.PI;
  while (sweep > Math.PI) sweep -= 2 * Math.PI;
  const mid = a0 + sweep / 2;
  if (Math.cos(mid) * dir[0] + Math.sin(mid) * dir[1] < 0) sweep = sweep > 0 ? sweep - 2 * Math.PI : sweep + 2 * Math.PI;
  const out = [];
  const n = 2, da = sweep / n, k = (4 / 3) * Math.tan(da / 4) * r;
  for (let i = 0; i < n; i++) {
    const s = a0 + da * i, e = s + da;
    const p0 = i === 0 ? from : [centre[0] + r * Math.cos(s), centre[1] + r * Math.sin(s)];
    const p3 = i === n - 1 ? to : [centre[0] + r * Math.cos(e), centre[1] + r * Math.sin(e)];
    out.push([p0, [p0[0] - k * Math.sin(s), p0[1] + k * Math.cos(s)], [p3[0] + k * Math.sin(e), p3[1] - k * Math.cos(e)], p3]);
  }
  return out;
}

/**
 * Expand a centreline into a filled pen-stroke outline.
 * widthFn({s, L, total, tan}) returns the full stroke width at that point.
 */
export function strokeOutline(segs, widthFn, { step = 0.06, tol = 0.06, startCap = 'round', endCap = 'round' } = {}) {
  const S = sample(segs, step);
  const left = [], right = [], W = [];
  for (const q of S) {
    const w = widthFn({ s: q.s, L: q.L, total: S.total, tan: q.tan }) / 2;
    W.push(w);
    const nrm = [-q.tan[1], q.tan[0]];
    left.push(add(q.p, mul(nrm, w)));
    right.push(sub(q.p, mul(nrm, w)));
  }
  const L = fitCurve(untangle(left), tol);
  const R = fitCurve(untangle(right).reverse(), tol);
  const endC = S.at(-1).p, startC = S[0].p;
  const capE = endCap === 'round' ? capArc(endC, L.at(-1)[3], R[0][0], S.at(-1).tan) : [[L.at(-1)[3], L.at(-1)[3], R[0][0], R[0][0]]];
  const capS = startCap === 'round' ? capArc(startC, R.at(-1)[3], L[0][0], mul(S[0].tan, -1)) : [[R.at(-1)[3], R.at(-1)[3], L[0][0], L[0][0]]];
  const all = [...L, ...capE, ...R, ...capS];
  return { segs: all, nodes: L.length + R.length + capE.length + capS.length };
}

export function toD(segs, { dx = 0, dy = 0, scale = 1, dp = 2 } = {}) {
  const f = (v) => {
    const r = Number(v.toFixed(dp));
    return Object.is(r, -0) ? '0' : String(r);
  };
  const P = (p) => `${f(p[0] * scale + dx)} ${f(p[1] * scale + dy)}`;
  let d = `M${P(segs[0][0])}`;
  for (const c of segs) d += `C${P(c[1])} ${P(c[2])} ${P(c[3])}`;
  return d + 'Z';
}

export function bbox(segs) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of segs) for (let k = 0; k <= 40; k++) {
    const p = bez(c, k / 40);
    x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
