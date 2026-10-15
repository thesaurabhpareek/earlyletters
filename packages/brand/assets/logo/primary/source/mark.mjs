// The final Early Letters quotation mark: ONE drawing of an opening quote (the "6" of a "66").
// Construction follows Y (r3/quote-letter): a round bowl of radius 1 at the origin and a tail cut from an
// annulus whose outer circle is tangent to the bowl. What changes is HOW the parts meet: every join is a
// G2 (curvature-continuous) cubic solved in g2.mjs, so there is no flat run where the tail meets the bowl,
// no button at the inner join, and the wedge corners are rounded with a curvature ramp, not a tiny arc.
import { P, A, onCircle, shape, transform, rad, deg } from './g2.mjs';

const dir = (d) => P(Math.cos(rad(d)), Math.sin(rad(d)));
const add = (a, b) => P(a.x + b.x, a.y + b.y);
const sub = (a, b) => P(a.x - b.x, a.y - b.y);
const mul = (a, s) => P(a.x * s, a.y * s);
const len = (a) => Math.hypot(a.x, a.y);
const unit = (a) => mul(a, 1 / len(a));
const angOf = (c, p) => deg(Math.atan2(p.y - c.y, p.x - c.x));

/** Master parameters (ball radius = 1). */
export const G = {
  Ro: 3.6,      // outer radius of the tail's annulus
  aT: 201,      // where the tail's outer edge is tangent to the bowl (deg)
  tipA: 246,    // angle (around the tail centre) of the cut
  w: 0.62,      // tail width at the cut
  taper: -0.6,  // inner circle shifted (negative = the tail is wider at the root than at the cut)
  rc: 0.085,    // corner radius of the cut (units); 14 px at 1024 when the bowl radius is ~165 px
  rf: 0.2,      // notch radius (curvature at the bottom of the notch)
  inFrac: 0.35, // where the last inner-edge anchor sits, from the notch (0) to the cut corner (1)
  ballIn: 40,   // degrees around the bowl from the notch to the first bowl anchor
  outBall: 10,  // degrees before the tangent point where the bowl anchor sits
  outTail: 34,  // degrees after the tangent point where the tail anchor sits
  dome: 0.18,   // curvature of the cut (1/units)
  ext: null,    // final-b: { sweep, r, end } extends the tail into a sheltering arch (see arch())
};

/** Returns { anchors, shape, meta } for one "6". */
export function glyph(o = {}) {
  const g = { ...G, ...o };
  const O = P(0, 0), u = dir(g.aT);
  const Ct = mul(u, -(g.Ro - 1));
  const Ri = g.Ro - g.w;
  // inner circle: concentric unless tapered (shift its centre away from the bowl so the root is wider)
  const Ci = add(Ct, mul(dir(g.tipA), -g.taper)); // shifting along the tip radius keeps the cut width = w
  const RiT = Ri + g.taper; // keeps the inner edge at the tip where it was
  // fillet circle (notch): outside the bowl, inside the inner circle
  const cc = (c1, r1, c2, r2) => { const dx = c2.x - c1.x, dy = c2.y - c1.y, d = Math.hypot(dx, dy); const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - a * a)); const mx = c1.x + (a * dx) / d, my = c1.y + (a * dy) / d; return [P(mx + (h * dy) / d, my - (h * dx) / d), P(mx - (h * dy) / d, my + (h * dx) / d)]; };
  const [f1, f2] = cc(O, 1 + g.rf, Ci, RiT - g.rf);
  const F = f1.y < f2.y ? f1 : f2;
  const T1 = mul(unit(F), 1);                     // fillet touches the bowl
  const T2 = add(Ci, mul(unit(sub(F, Ci)), RiT)); // fillet touches the inner edge
  const mid = unit(add(unit(sub(T1, F)), unit(sub(T2, F))));
  const N = add(F, mul(mid, g.rf));
  const nT = angOf(P(0, 0), P(-mid.y, mid.x)); // tangent perpendicular to the radius; pick travel T2 -> T1
  const tv = sub(T1, T2); const nTan = (Math.cos(rad(nT)) * tv.x + Math.sin(rad(nT)) * tv.y) > 0 ? nT : nT + 180;

  const anchors = [];
  const tipO = add(Ct, mul(dir(g.tipA), g.Ro));
  const tipI = add(Ci, mul(dir(g.tipA), RiT));
  const ext = g.ext;
  // ---- outer edge from the bowl up to the tip (clockwise around Ct) ----
  const outerEnd = g.tipA;
  anchors.push({ ...onCircle(O, 1, g.aT - g.outBall), tag: 'bowl-out' });
  anchors.push({ ...onCircle(Ct, g.Ro, g.aT + g.outTail), tag: 'tail-out' });
  let corner;
  if (!ext) {
    corner = cutCorners(Ct, g.Ro, Ci, RiT, g.tipA, g.rc, g.dome);
    anchors.push(...corner);
  } else {
    anchors.push(...arch(g, Ct, Ci, RiT));
  }
  // ---- inner edge down to the notch (anticlockwise around Ci) ----
  const aN = angOf(Ci, T2);
  // the last inner-edge anchor sits a fraction inFrac of the way from the notch to the start of the cut corner
  let aTipIn = (g.ext ? g.tipA : g.tipA - deg((g.rc * 1.6) / RiT));
  while (aTipIn - aN > 180) aTipIn -= 360; while (aTipIn - aN < -180) aTipIn += 360;
  anchors.push({ ...onCircle(Ci, RiT, aN + (aTipIn - aN) * g.inFrac, false), tag: 'tail-in' });
  anchors.push({ p: N, t: nTan, k: -1 / g.rf, tag: 'notch' });
  // ---- bowl ----
  const a1 = angOf(O, T1) + g.ballIn;
  anchors.push({ ...onCircle(O, 1, a1), tag: 'bowl' });
  const span = (g.aT - g.outBall + 360 - a1) % 360; // remaining bowl sweep, split into <= 90 deg pieces
  const n = Math.max(2, Math.ceil(span / 80));
  for (let i = 1; i < n; i++) anchors.push({ ...onCircle(O, 1, a1 + (span * i) / n), tag: 'bowl' });
  // rotate so the list starts at the bowl-out anchor (it is first already)
  if (g.anchorsOnly) return { anchors };
  const sh = shape(anchors);
  return { anchors, shape: sh, meta: { Ct, Ci, Ri: RiT, F, T1, T2, N, tipO, tipI } };
}

/** Rounded cut at angle a of two circles (outer co/ro, inner ci/ri): two G2 corners and a calm dome. */
function cutCorners(co, ro, ci, ri, a, rc, dome) {
  const tipO = add(co, mul(dir(a), ro)), tipI = add(ci, mul(dir(a), ri));
  const tIn = a + 90, tCut = a + 180, tOut = a + 270;
  const d = rc * 1.6;
  const c = len(sub(tipO, tipI));
  const sag = dome * (c / 2) * (c / 2) / 2;
  const midCut = add(mul(add(tipO, tipI), 0.5), mul(dir(a + 90), sag));
  const apexO = add(tipO, mul(unit(sub(dir(tCut), dir(tIn))), rc * 0.45));
  const apexI = add(tipI, mul(unit(sub(dir(tOut), dir(tCut))), rc * 0.45));
  return [
    { ...onCircle(co, ro, a - deg(d / ro)), tag: 'corner-in' },
    { p: apexO, t: (tIn + tCut) / 2, k: 1 / rc, tag: 'corner' },
    { p: midCut, t: tCut, k: dome, tag: 'cut' },
    { p: apexI, t: (tCut + tOut) / 2, k: 1 / rc, tag: 'corner' },
    { ...onCircle(ci, ri, a - deg(d / ri), false), tag: 'corner-out' },
  ];
}

/**
 * final-b: the parent's tail keeps travelling past Y's cut and bends over toward the child, ending in the
 * same rounded cut. ext = { sweep: extra degrees around a tighter centre, r: outer radius of the bend,
 * shrink: width factor at the new cut (>= 0.8 so it never becomes a hairline) }.
 */
function arch(g, Ct, Ci, Ri) {
  const e = g.ext;
  const tipO0 = add(Ct, mul(dir(g.tipA), g.Ro));
  // bend centre: on the tip radius, so the outer edge continues tangentially from the annulus
  const Cb = add(tipO0, mul(dir(g.tipA), -e.r));
  const w2 = g.w * e.shrink;
  const aEnd = g.tipA + e.sweep;
  const tipO = add(Cb, mul(dir(aEnd), e.r));
  const tipI = add(Cb, mul(dir(aEnd), e.r - w2));
  const out = [];
  out.push({ ...onCircle(Ct, g.Ro, g.tipA - 4), tag: 'tail-out' });
  out.push({ ...onCircle(Cb, e.r, g.tipA + e.sweep * 0.5), tag: 'arch-out' });
  out.push(...cutCorners(Cb, e.r, Cb, e.r - w2, aEnd, g.rc, g.dome));
  // inner edge: from the bend's cut back to where Y's cut used to be, on the annulus inner circle (curvature ramps between)
  if (e.back != null) out.push({ ...onCircle(Ci, Ri, g.tipA - e.back, false), tag: 'arch-in' });
  return out;
}

/** The pair: parent + child (child = the parent's exact drawing, scaled and leaning in). */
export const PAIR = { ratio: 0.62, gap: 0.2, lean: -8, drop: 0, tuck: 0 };
export function pair(go = {}, po = {}, kidGo = null) {
  const q = { ...PAIR, ...po };
  const big = glyph(go);
  const kid = glyph(kidGo ?? { ...go, ext: null });
  const s = q.ratio;
  // child: bowl sits on the parent's baseline (bottom y = 1) unless dropped; rotated about its own bowl centre
  const kidT = transform(kid.shape, { s, rot: q.lean, tx: 1 + q.gap + s - q.tuck, ty: 1 - s + q.drop });
  return { big, kid, shapes: [big.shape, kidT], kidT };
}
