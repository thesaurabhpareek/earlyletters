// Geometry for the quote-letter mark. SVG coordinates, y down. Pure cubic beziers, filled paths only.
export const P = (x, y) => ({ x, y });
const rad = (d) => (d * Math.PI) / 180;
const add = (a, b) => P(a.x + b.x, a.y + b.y);
const mul = (a, s) => P(a.x * s, a.y * s);
const onC = (c, r, a) => P(c.x + r * Math.cos(rad(a)), c.y + r * Math.sin(rad(a)));

/** Circle arc from a0 to a1 (degrees, 0 = +x, 90 = down on screen) as cubic segments of at most 90 degrees. */
export function arc(c, r, a0, a1) {
  const segs = [];
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 90 - 1e-9));
  const step = (a1 - a0) / n;
  for (let i = 0; i < n; i++) {
    const s = rad(a0 + i * step), e = rad(a0 + (i + 1) * step);
    const k = (4 / 3) * Math.tan((e - s) / 4) * r;
    const p0 = P(c.x + r * Math.cos(s), c.y + r * Math.sin(s));
    const p3 = P(c.x + r * Math.cos(e), c.y + r * Math.sin(e));
    segs.push({ c1: P(p0.x - k * Math.sin(s), p0.y + k * Math.cos(s)), c2: P(p3.x + k * Math.sin(e), p3.y - k * Math.cos(e)), p: p3 });
  }
  return segs;
}

/**
 * One opening quotation mark, the "6" of a "66". Ball of radius 1 centred at the origin.
 * Outline (clockwise on screen): tip outer corner -> outer edge of the tail sweeping down the left of
 * the ball -> round the ball's bottom and right -> inner edge leaving the ball TANGENTIALLY (no notch)
 * through a soft waist -> tip inner corner -> blunt cut back to the start.
 *
 * o.aOut / o.aIn: where the outer and inner tail edges leave the ball (degrees).
 * o.tip: centre of the cut; o.dir: travel direction of the tail at the tip (degrees); o.w: cut width.
 * o.hOut, o.hIn: handle lengths leaving the ball; o.tOut, o.tIn: handle lengths arriving at the tip.
 * o.cap: 0 = dead flat cut, 0.3 = a calm, barely domed cut (corners stay crisp but not sharp).
 */
export function glyph(o) {
  const c = P(0, 0);
  const d = rad(o.dir), dv = P(Math.cos(d), Math.sin(d)), nv = P(-dv.y, dv.x);
  const h = o.w / 2;
  // travelling up-right, nv points down-right, so the outer (upper-left) corner is at -nv
  const tOuter = add(o.tip, mul(nv, -h)), tInner = add(o.tip, mul(nv, h));
  const pOut = onC(c, 1, o.aOut), pIn = onC(c, 1, o.aIn);
  // circle tangent for decreasing angle (anticlockwise on screen) at angle a: (sin a, -cos a)
  const tdec = (a) => P(Math.sin(rad(a)), -Math.cos(rad(a)));
  const segs = [];
  // outer edge: from the tip down to pOut, arriving travelling along the circle with INCREASING angle? We traverse the
  // ball from aOut through the bottom (90) to aIn, i.e. decreasing from aOut (~200) to 90 to 0 to aIn (~-60).
  segs.push({ c1: add(tOuter, mul(dv, -o.tOut)), c2: add(pOut, mul(tdec(o.aOut), -o.hOut)), p: pOut });
  let a1 = o.aIn; while (a1 > o.aOut) a1 -= 360;
  segs.push(...arc(c, 1, o.aOut, a1));
  if (o.K) {
    // a two-part inner edge: leave the ball tangentially, round a soft crotch at K (travelling in direction kd), then rise to the tip
    const kd = rad(o.kd), kv = P(Math.cos(kd), Math.sin(kd));
    segs.push({ c1: add(pIn, mul(tdec(o.aIn), o.hIn)), c2: add(o.K, mul(kv, -o.k1)), p: o.K });
    segs.push({ c1: add(o.K, mul(kv, o.k2)), c2: add(tInner, mul(dv, -o.tIn)), p: tInner });
  } else segs.push({ c1: add(pIn, mul(tdec(o.aIn), o.hIn)), c2: add(tInner, mul(dv, -o.tIn)), p: tInner });
  const k = h * (o.cap ?? 0.25);
  segs.push({ c1: add(tInner, mul(dv, k)), c2: add(tOuter, mul(dv, k)), p: tOuter });
  return { start: tOuter, segs };
}

export function transform(shape, { s = 1, sx, sy, rot = 0, tx = 0, ty = 0 } = {}) {
  const a = rad(rot), ca = Math.cos(a), sa = Math.sin(a);
  const kx = sx ?? s, ky = sy ?? s;
  const f = (p) => { const x = p.x * kx, y = p.y * ky; return P(x * ca - y * sa + tx, x * sa + y * ca + ty); };
  return { start: f(shape.start), segs: shape.segs.map((g) => ({ c1: f(g.c1), c2: f(g.c2), p: f(g.p) })) };
}
export const tAll = (shapes, t) => shapes.map((s) => transform(s, t));

/** Reverse a closed shape's direction (for nonzero-rule holes). */
export function reverse(sh) {
  const pts = [sh.start, ...sh.segs.map((g) => g.p)];
  const segs = [];
  for (let i = sh.segs.length - 1; i >= 0; i--) segs.push({ c1: sh.segs[i].c2, c2: sh.segs[i].c1, p: pts[i] });
  return { start: pts[pts.length - 1], segs };
}

/** Straight-edged polygon with every corner rounded by radius r (array per corner allowed). Clockwise input. */
export function roundPoly(pts, r) {
  const n = pts.length; const segs = []; let start;
  const corner = (i) => {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const ri = Array.isArray(r) ? r[i] : r;
    const ua = norm(sub(a, p)), ub = norm(sub(b, p));
    const ang = Math.acos(Math.max(-1, Math.min(1, ua.x * ub.x + ua.y * ub.y)));
    const t = ri / Math.tan(ang / 2);
    const p1 = add(p, mul(ua, t)), p2 = add(p, mul(ub, t));
    const kk = (4 / 3) * Math.tan((Math.PI - ang) / 4) * ri;
    return { p1, p2, c1: add(p1, mul(ua, -kk)), c2: add(p2, mul(ub, -kk)) };
  };
  const cs = pts.map((_, i) => corner(i));
  start = cs[0].p2;
  for (let i = 1; i <= n; i++) { const c = cs[i % n]; segs.push(line(segs.length ? segs[segs.length - 1].p : start, c.p1)); segs.push({ c1: c.c1, c2: c.c2, p: c.p2 }); }
  return { start, segs };
}
const sub = (a, b) => P(a.x - b.x, a.y - b.y);
const norm = (a) => { const l = Math.hypot(a.x, a.y) || 1; return P(a.x / l, a.y / l); };
export const line = (a, b) => ({ c1: P(a.x + (b.x - a.x) / 3, a.y + (b.y - a.y) / 3), c2: P(a.x + (2 * (b.x - a.x)) / 3, a.y + (2 * (b.y - a.y)) / 3), p: b, L: true });

const r2 = (n) => (Math.round(n * 100) / 100).toString();
export function toD(shapes) {
  return shapes.map((sh) => `M${r2(sh.start.x)} ${r2(sh.start.y)}` + sh.segs.map((g) => g.L ? `L${r2(g.p.x)} ${r2(g.p.y)}` : `C${r2(g.c1.x)} ${r2(g.c1.y)} ${r2(g.c2.x)} ${r2(g.c2.y)} ${r2(g.p.x)} ${r2(g.p.y)}`).join('') + 'Z').join('');
}
export function bbox(shapes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const sh of shapes) { let p0 = sh.start; for (const g of sh.segs) { for (let t = 0; t <= 1.0001; t += 0.02) { const m = 1 - t; const x = m*m*m*p0.x + 3*m*m*t*g.c1.x + 3*m*t*t*g.c2.x + t*t*t*g.p.x; const y = m*m*m*p0.y + 3*m*m*t*g.c1.y + 3*m*t*t*g.c2.y + t*t*t*g.p.y; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } p0 = g.p; } }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
export const nodeCount = (shapes) => shapes.reduce((n, s) => n + s.segs.length, 0);

const deg = (r) => (r * 180) / Math.PI;
const ang = (c, p) => deg(Math.atan2(p.y - c.y, p.x - c.x));
/** Intersections of two circles. */
function cc(c1, r1, c2, r2) {
  const dx = c2.x - c1.x, dy = c2.y - c1.y, d = Math.hypot(dx, dy);
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const mx = c1.x + (a * dx) / d, my = c1.y + (a * dy) / d;
  return [P(mx + (h * dy) / d, my - (h * dx) / d), P(mx - (h * dy) / d, my + (h * dx) / d)];
}
/** Bring angle b to the nearest equivalent that is < a (dir -1) or > a (dir +1). */
function towards(a, b, dir) { let x = b; if (dir < 0) { while (x > a) x -= 360; while (x < a - 360) x += 360; } else { while (x < a) x += 360; while (x > a + 360) x -= 360; } return x; }

/**
 * quoteArc: the "6" built like a type designer would: a round ball (radius 1, origin) and a tail of
 * constant width cut from an annulus whose outer circle is tangent to the ball (G1, no seam).
 * Ro: outer radius of the tail; aT: where the tail's outer edge meets the ball (deg, ~200 = left, a bit up);
 * tipA: angle (around the tail centre) of the cut; w: tail width; rf: radius of the fillet in the counter
 * (no notch); cap: 0 = flat cut, ~0.3 = calm dome.
 */
export function quoteArc(o) {
  const O = P(0, 0), u = P(Math.cos(rad(o.aT)), Math.sin(rad(o.aT)));
  const Ct = mul(u, -(o.Ro - 1)), Ri = o.Ro - o.w;
  // fillet circle: outside the ball, inside the inner circle; pick the solution on the counter side (upper)
  const [f1, f2] = cc(O, 1 + o.rf, Ct, Ri - o.rf);
  const F = f1.y < f2.y ? f1 : f2;
  const T1 = mul(F, 1 / (1 + o.rf));
  const T2 = add(Ct, mul(sub(F, Ct), Ri / (Ri - o.rf)));
  const tipO = add(Ct, mul(P(Math.cos(rad(o.tipA)), Math.sin(rad(o.tipA))), o.Ro));
  const tipI = add(Ct, mul(P(Math.cos(rad(o.tipA)), Math.sin(rad(o.tipA))), Ri));
  const segs = [];
  // outer edge: from the tip back down to the tangent point (decreasing angle around Ct)
  segs.push(...arc(Ct, o.Ro, o.tipA, towards(o.tipA, o.aT, -1)));
  // ball: decreasing from aT round the bottom to T1
  segs.push(...arc(O, 1, o.aT, towards(o.aT, ang(O, T1), -1)));
  // fillet: concave, around F the other way
  const a1 = ang(F, T1), a2 = ang(F, T2);
  segs.push(...arc(F, o.rf, a1, towards(a1, a2, +1)));
  // inner edge: from the fillet up to the tip (increasing angle around Ct)
  const ai = ang(Ct, T2);
  segs.push(...arc(Ct, Ri, ai, towards(ai, o.tipA, +1)));
  // cut: inner corner to outer corner, calm dome along the travel direction
  const tv = P(-Math.sin(rad(o.tipA)), Math.cos(rad(o.tipA))); // tangent of increasing angle
  const k = o.w * (o.cap ?? 0.2) * 0.5;
  segs.push({ c1: add(tipI, mul(tv, k)), c2: add(tipO, mul(tv, k)), p: tipO });
  return { start: tipO, segs, meta: { Ct, Ri, F, T1, T2 } };
}
