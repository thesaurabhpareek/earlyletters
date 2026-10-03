// Geometry for the Early Letters quotation mark. SVG coordinates (y down). Cubic beziers only.
//
// A contour is a closed list of on-curve nodes. Each node has a position, a tangent direction
// for the incoming and outgoing curve (equal at a smooth node, different at a corner), and handle
// lengths. Positions and tangents are drawn by hand (that is the type design). Handle lengths are
// then solved so the curvature is equal on both sides of every smooth node (G2), with a gentle
// pull toward the drawn lengths so the solver never invents a new shape.

const rad = (d) => (d * Math.PI) / 180;
export const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  mul: (a, s) => [a[0] * s, a[1] * s],
  dir: (deg) => [Math.cos(rad(deg)), Math.sin(rad(deg))],
  cross: (a, b) => a[0] * b[1] - a[1] * b[0],
  len: (a) => Math.hypot(a[0], a[1]),
};

/** node: { p:[x,y], t:deg | tin/tout:deg, a:len | ain/aout:len, corner?:bool } */
export function norm(nodes) {
  return nodes.map((n) => ({
    p: n.p,
    tin: n.tin ?? n.t, tout: n.tout ?? n.t,
    ain: n.ain ?? n.a ?? 100, aout: n.aout ?? n.a ?? 100,
    corner: !!n.corner || (n.tin !== undefined && n.tin !== n.tout),
  }));
}

/** cubic segments [P0,P1,P2,P3] for a normalised contour */
export function segments(c) {
  const out = [];
  for (let i = 0; i < c.length; i++) {
    const n0 = c[i], n1 = c[(i + 1) % c.length];
    const P0 = n0.p, P3 = n1.p;
    const P1 = V.add(P0, V.mul(V.dir(n0.tout), n0.aout));
    const P2 = V.sub(P3, V.mul(V.dir(n1.tin), n1.ain));
    out.push([P0, P1, P2, P3]);
  }
  return out;
}

export function bez(s, t) {
  const m = 1 - t, [P0, P1, P2, P3] = s;
  return [0, 1].map((k) => m * m * m * P0[k] + 3 * m * m * t * P1[k] + 3 * m * t * t * P2[k] + t * t * t * P3[k]);
}
export function d1(s, t) {
  const m = 1 - t, [P0, P1, P2, P3] = s;
  return [0, 1].map((k) => 3 * m * m * (P1[k] - P0[k]) + 6 * m * t * (P2[k] - P1[k]) + 3 * t * t * (P3[k] - P2[k]));
}
export function d2(s, t) {
  const [P0, P1, P2, P3] = s;
  return [0, 1].map((k) => 6 * (1 - t) * (P2[k] - 2 * P1[k] + P0[k]) + 6 * t * (P3[k] - 2 * P2[k] + P1[k]));
}
/** signed curvature (positive = turning clockwise on screen, y down) */
export function curv(s, t) {
  const a = d1(s, t), b = d2(s, t);
  return V.cross(a, b) / Math.pow(V.len(a), 3);
}

/**
 * Solve handle lengths for G2 continuity at every smooth node (Levenberg-Marquardt, numeric Jacobian).
 * L: length scale used to make curvature dimensionless. lambda: pull toward drawn lengths.
 */
export function solveG2(contour, { L = 1000, lambda = 0.02, iters = 200, fixed = [] } = {}) {
  const c = contour.map((n) => ({ ...n }));
  const idx = []; // [nodeIndex, 'ain'|'aout']
  c.forEach((n, i) => { for (const k of ['ain', 'aout']) if (!fixed.includes(i) && !fixed.includes(`${i}.${k}`)) idx.push([i, k]); });
  const x0 = idx.map(([i, k]) => Math.log(c[i][k]));
  const set = (x) => idx.forEach(([i, k], j) => { c[i][k] = Math.exp(x[j]); });
  const resid = (x) => {
    set(x);
    const segs = segments(c), r = [];
    c.forEach((n, i) => {
      if (n.corner) return;
      const kin = curv(segs[(i - 1 + c.length) % c.length], 1), kout = curv(segs[i], 0);
      // relative mismatch: a 1 percent curvature jump costs the same on a tight terminal and a flat edge
      r.push((20 * (kin - kout) * L) / (Math.abs(kin * L) + Math.abs(kout * L) + 2));
    });
    x.forEach((v, j) => r.push(Math.sqrt(lambda) * (v - x0[j])));
    // keep handles from overshooting the chord (no loops)
    segs.forEach((s, i) => {
      const ch = V.len(V.sub(s[3], s[0])), n0 = c[i], n1 = c[(i + 1) % c.length];
      const over = Math.max(0, (n0.aout + n1.ain) / ch - 1.05);
      r.push(over * 10);
    });
    return r;
  };
  let x = x0.slice(), mu = 1e-2;
  let r = resid(x), f = r.reduce((s, v) => s + v * v, 0);
  for (let it = 0; it < iters; it++) {
    const J = [], h = 1e-6;
    for (let j = 0; j < x.length; j++) {
      const xp = x.slice(); xp[j] += h; const rp = resid(xp);
      J.push(rp.map((v, k) => (v - r[k]) / h));
    }
    // normal equations (J^T J + mu I) dx = -J^T r ; J stored column-wise
    const n = x.length, A = Array.from({ length: n }, () => new Array(n).fill(0)), g = new Array(n).fill(0);
    for (let a = 0; a < n; a++) {
      for (let b = a; b < n; b++) { let s = 0; for (let k = 0; k < r.length; k++) s += J[a][k] * J[b][k]; A[a][b] = A[b][a] = s; }
      let s = 0; for (let k = 0; k < r.length; k++) s += J[a][k] * r[k]; g[a] = -s;
    }
    for (let a = 0; a < n; a++) A[a][a] += mu * (1 + A[a][a]);
    const dx = gauss(A, g);
    const xn = x.map((v, j) => v + Math.max(-0.5, Math.min(0.5, dx[j])));
    const rn = resid(xn), fn = rn.reduce((s, v) => s + v * v, 0);
    if (fn < f) { x = xn; r = rn; const df = f - fn; f = fn; mu *= 0.3; if (df < 1e-12) break; } else mu *= 4;
  }
  set(x);
  return c;
}
function gauss(A, b) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
    [M[i], M[p]] = [M[p], M[i]];
    const d = M[i][i] || 1e-12;
    for (let k = i + 1; k < n; k++) { const f = M[k][i] / d; for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / (M[i][i] || 1e-12); }
  return x;
}

/** G2 report: per smooth node, curvature on each side (x L) and the relative jump */
export function g2Report(c, L = 1000) {
  const segs = segments(c);
  return c.map((n, i) => {
    const kin = curv(segs[(i - 1 + c.length) % c.length], 1) * L, kout = curv(segs[i], 0) * L;
    return { i, corner: n.corner, kin: +kin.toFixed(3), kout: +kout.toFixed(3), jump: n.corner ? null : +Math.abs(kin - kout).toFixed(4) };
  });
}

/** affine transform of a solved contour: scale s, rotate rot (deg) about origin, then translate */
export function xform(c, { s = 1, rot = 0, tx = 0, ty = 0 } = {}) {
  const a = rad(rot), ca = Math.cos(a), sa = Math.sin(a);
  const f = ([x, y]) => [(x * ca - y * sa) * s + tx, (x * sa + y * ca) * s + ty];
  return c.map((n) => ({ ...n, p: f(n.p), tin: n.tin + rot, tout: n.tout + rot, ain: n.ain * s, aout: n.aout * s }));
}

const r2 = (v) => (Math.round(v * 100) / 100).toString();
export function toD(contours) {
  return contours.map((c) => {
    const segs = segments(c);
    return `M${r2(segs[0][0][0])} ${r2(segs[0][0][1])}` + segs.map((s) => {
      // a straight segment (handles on the chord) is written as a line
      const ch = V.sub(s[3], s[0]);
      const straight = Math.abs(V.cross(ch, V.sub(s[1], s[0]))) < 1e-6 * V.len(ch) ** 2 && Math.abs(V.cross(ch, V.sub(s[2], s[0]))) < 1e-6 * V.len(ch) ** 2;
      return straight ? `L${r2(s[3][0])} ${r2(s[3][1])}` : `C${r2(s[1][0])} ${r2(s[1][1])} ${r2(s[2][0])} ${r2(s[2][1])} ${r2(s[3][0])} ${r2(s[3][1])}`;
    }).join('') + 'Z';
  }).join('');
}

export function bbox(contours) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of contours) for (const s of segments(c)) for (let t = 0; t <= 1.0001; t += 0.01) {
    const [x, y] = bez(s, t); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/** polygon samples (for area, centroid, minimum gap and stroke measurements) */
export function sample(c, n = 60) {
  const pts = [];
  for (const s of segments(c)) for (let i = 0; i < n; i++) pts.push(bez(s, i / n));
  return pts;
}
export function areaCentroid(pts) {
  let A = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
    const k = x0 * y1 - x1 * y0; A += k; cx += (x0 + x1) * k; cy += (y0 + y1) * k;
  }
  A /= 2; return { A: Math.abs(A), cx: cx / (6 * A), cy: cy / (6 * A) };
}
export function minDist(ptsA, ptsB) {
  let m = Infinity;
  for (const a of ptsA) for (const b of ptsB) m = Math.min(m, Math.hypot(a[0] - b[0], a[1] - b[1]));
  return m;
}

/** curvature comb overlay (SVG markup) for inspecting smoothness */
export function comb(contours, { scale = 4000, every = 24, stroke = '#C0392B' } = {}) {
  let out = '';
  for (const c of contours) {
    const segs = segments(c);
    for (const s of segs) {
      let tips = [];
      for (let i = 0; i <= every; i++) {
        const t = i / every, p = bez(s, t), d = d1(s, t), L = V.len(d);
        const nrm = [-d[1] / L, d[0] / L]; // left normal of travel
        const k = curv(s, t);
        const q = V.add(p, V.mul(nrm, -k * scale));
        out += `<line x1="${r2(p[0])}" y1="${r2(p[1])}" x2="${r2(q[0])}" y2="${r2(q[1])}" stroke="${stroke}" stroke-width="1.2" opacity=".55"/>`;
        tips.push(q);
      }
      out += `<polyline fill="none" stroke="${stroke}" stroke-width="2" points="${tips.map((q) => q.map(r2).join(',')).join(' ')}"/>`;
    }
    for (const n of c) out += `<circle cx="${r2(n.p[0])}" cy="${r2(n.p[1])}" r="7" fill="${n.corner ? '#1F6FEB' : '#fff'}" stroke="#1F6FEB" stroke-width="3"/>`;
  }
  return out;
}
