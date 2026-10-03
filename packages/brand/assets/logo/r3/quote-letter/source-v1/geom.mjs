// Geometry for the two-voices mark. SVG coordinates, y down. Pure cubic beziers.
export const K = 0.5522847498;
const rad = (d) => (d * Math.PI) / 180;
export const P = (x, y) => ({ x, y });
const add = (a, b) => P(a.x + b.x, a.y + b.y);
const mul = (a, s) => P(a.x * s, a.y * s);
const unit = (a) => { const l = Math.hypot(a.x, a.y); return P(a.x / l, a.y / l); };

/** Circle arc from angle a0 to a1 (degrees, screen: 0 = +x, 90 = down) as cubic segments. */
export function arc(c, r, a0, a1) {
  const segs = [];
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 90));
  const step = (a1 - a0) / n;
  for (let i = 0; i < n; i++) {
    const s = rad(a0 + i * step), e = rad(a0 + (i + 1) * step);
    const k = (4 / 3) * Math.tan((e - s) / 4) * r;
    const p0 = P(c.x + r * Math.cos(s), c.y + r * Math.sin(s));
    const p3 = P(c.x + r * Math.cos(e), c.y + r * Math.sin(e));
    const c1 = P(p0.x - k * Math.sin(s), p0.y + k * Math.cos(s));
    const c2 = P(p3.x + k * Math.sin(e), p3.y - k * Math.cos(e));
    segs.push({ c1, c2, p: p3 });
  }
  return segs;
}
const onC = (c, r, a) => P(c.x + r * Math.cos(rad(a)), c.y + r * Math.sin(rad(a)));
// tangent of a circle traversed with increasing angle
const tan = (a, dir = 1) => P(-Math.sin(rad(a)) * dir, Math.cos(rad(a)) * dir);

/**
 * One opening quotation mark ("6" form): a ball with a tail that rises from it.
 * Ball centre (0,0), radius r. Traversal: tip -> outer tail edge -> ball (counter-clockwise on screen
 * i.e. increasing angle from aOut through bottom to aIn) -> inner tail edge -> tip.
 * o: { r, aOut, aIn, tip:{x,y}, tipDir (deg, direction tail travels at tip), tipW (cap width),
 *      hOut, hIn (handle lengths at the ball end), tOut, tIn (handle lengths at the tip end) }
 */
export function quote(o) {
  const c = P(0, 0), r = o.r ?? 1;
  const td = rad(o.tipDir);
  const dirv = P(Math.cos(td), Math.sin(td)); // direction of travel along tail toward tip
  const nrm = P(-dirv.y, dirv.x); // left of travel on screen
  const half = (o.tipW ?? 0) / 2;
  const tipOuter = add(o.tip, mul(nrm, -half));
  const tipInner = add(o.tip, mul(nrm, half));
  const pOut = onC(c, r, o.aOut), pIn = onC(c, r, o.aIn);
  // outer edge travels from tip back down to the ball, arriving along the circle with increasing angle
  // ball is traversed clockwise on screen (decreasing angle): left side, bottom, right side, top
  const segs = [];
  segs.push({ c1: add(tipOuter, mul(dirv, -o.tOut)), c2: add(pOut, mul(tan(o.aOut), o.hOut)), p: pOut });
  let a1 = o.aIn; while (a1 > o.aOut) a1 -= 360;
  segs.push(...arc(c, r, o.aOut, a1));
  segs.push({ c1: add(pIn, mul(tan(o.aIn), -o.hIn)), c2: add(tipInner, mul(dirv, -o.tIn)), p: tipInner });
  if (half > 0) {
    // round-ish cap from inner to outer across the tip
    const k = half * 1.1;
    segs.push({ c1: add(tipInner, mul(dirv, k)), c2: add(tipOuter, mul(dirv, k)), p: tipOuter });
  }
  return { start: tipOuter, segs };
}

export function transform(shape, { s = 1, rot = 0, tx = 0, ty = 0, flip = false }) {
  const a = rad(rot), ca = Math.cos(a), sa = Math.sin(a);
  const f = (p) => { let x = (flip ? -p.x : p.x) * s, y = p.y * s; return P(x * ca - y * sa + tx, x * sa + y * ca + ty); };
  return { start: f(shape.start), segs: shape.segs.map((g) => ({ c1: f(g.c1), c2: f(g.c2), p: f(g.p) })) };
}

const r2 = (n) => (Math.round(n * 100) / 100).toString();
export function toD(shapes) {
  return shapes.map((sh) => `M${r2(sh.start.x)} ${r2(sh.start.y)}` + sh.segs.map((g) => `C${r2(g.c1.x)} ${r2(g.c1.y)} ${r2(g.c2.x)} ${r2(g.c2.y)} ${r2(g.p.x)} ${r2(g.p.y)}`).join('') + 'Z').join('');
}
export function bbox(shapes) {
  // sample the curves for an exact-enough box
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const sh of shapes) { let p0 = sh.start; for (const g of sh.segs) { for (let t = 0; t <= 1; t += 0.02) { const m = 1 - t; const x = m*m*m*p0.x + 3*m*m*t*g.c1.x + 3*m*t*t*g.c2.x + t*t*t*g.p.x; const y = m*m*m*p0.y + 3*m*m*t*g.c1.y + 3*m*t*t*g.c2.y + t*t*t*g.p.y; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } p0 = g.p; } }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
export function nodeCount(shapes) { return shapes.reduce((n, s) => n + s.segs.length, 0); }

/**
 * quote2: typographic construction. Ball radius r at origin; the tail's outer edge leaves the ball
 * tangentially at aOut; the inner edge meets the ball at a crisp notch at aIn, leaving in direction
 * notchDir. The tail ends in a cut of width tipW perpendicular to tipDir, softened by `cap` (0 = flat).
 */
export function quote2(o) {
  const r = o.r ?? 1, c = P(0, 0);
  const td = rad(o.tipDir), dirv = P(Math.cos(td), Math.sin(td)), nrm = P(-dirv.y, dirv.x);
  const half = o.tipW / 2;
  const tipOuter = add(o.tip, mul(nrm, -half)), tipInner = add(o.tip, mul(nrm, half));
  const pOut = onC(c, r, o.aOut), pIn = onC(c, r, o.aIn);
  const nd = rad(o.notchDir), ndv = P(Math.cos(nd), Math.sin(nd));
  const segs = [];
  segs.push({ c1: add(tipOuter, mul(dirv, -o.tOut)), c2: add(pOut, mul(tan(o.aOut), o.hOut)), p: pOut });
  let a1 = o.aIn; while (a1 > o.aOut) a1 -= 360;
  segs.push(...arc(c, r, o.aOut, a1));
  segs.push({ c1: add(pIn, mul(ndv, o.hIn)), c2: add(tipInner, mul(dirv, -o.tIn)), p: tipInner });
  if (o.cap === 'round') segs.push(...arc(o.tip, half, o.tipDir + 90, o.tipDir - 90));
  else { const k = half * (o.cap ?? 0.5); segs.push({ c1: add(tipInner, mul(dirv, k)), c2: add(tipOuter, mul(dirv, k)), p: tipOuter }); }
  return { start: tipOuter, segs };
}
