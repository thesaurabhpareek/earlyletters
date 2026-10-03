// The one drawing: an opening quotation mark ("6" form), drawn on a 1000-unit-tall body, y down.
// Nodes sit at extrema and inflections only. Traversal: ball left, bottom, right, shoulder
// inflection, tail underside inflection, terminal, top, outer edge, back to ball left.
import { norm, solveG2 } from './geom.mjs';

/**
 * Terminal treatments:
 *  'drop'  calm teardrop: the tail ends in a rounded swelling, one smooth node at its extreme (default)
 *  'flat'  flat cut square to the tail, corners softened by a tiny radius
 *  'oblique' flat cut on the pen angle (Literata, Source Serif)
 *  'taper' pointed tip (round 2 failure, shown only as a rejected sketch)
 */
export const DRAW = {
  // ball: a true circle, r = 315, centre (315, 685); its arcs keep the circle's own handles
  L: [0, 685], B: [315, 1000], R: [630, 685], circle: true,
  // the circle runs up the right side to -66 deg, where the crook begins
  I1a: -66,
  // the crook: leftmost point of the inner edge, travelling straight up
  K: [340, 315], tK: -90,
  // underside inflection (the crook turns into the swell of the terminal)
  I2: [455, 195], tI2: -25,
  // terminal extreme and top
  E: [605, 82], Tp: [475, 0],
  // no extra node on the outer edge: one cubic from the top of the tail to the ball
  O: null,
  terminal: 'drop',
};

export function glyph(o = {}) {
  const d = { ...DRAW, ...o };
  // I1a: the shoulder node sits ON the ball circle at this angle (deg, screen), so the ball stays a
  // true circle from its left extreme, under the bottom and up the right side to the crook.
  if (d.I1a !== undefined && d.I1a !== null) {
    const r = (d.R[0] - d.L[0]) / 2, cx = d.L[0] + r, cy = d.L[1], a = (d.I1a * Math.PI) / 180;
    d.I1 = [cx + r * Math.cos(a), cy + r * Math.sin(a)]; d.tI1 = d.I1a - 90 + 360;
  }
  const ch = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const k = 0.42; // starting handle ratio of chord; the G2 solver refines it
  let nodes;
  const ball = [
    { p: d.L, t: 90 },
    { p: d.B, t: 0 },
    { p: d.R, t: -90 },
    { p: d.I1, t: d.tI1 },
    ...(d.K ? [{ p: d.K, t: d.tK ?? -90 }] : []),
    { p: d.I2, t: d.tI2 },
  ];
  const outer = d.O ? [{ p: d.Tp, t: 180 }, { p: d.O, t: d.tO }] : [{ p: d.Tp, t: 180 }];
  if (d.terminal === 'drop') {
    nodes = [...ball, { p: d.E, t: -90 }, ...outer];
  } else if (d.terminal === 'flat' || d.terminal === 'oblique' || d.terminal === 'taper') {
    // a straight cut from the underside end U to the top end T
    const tailDir = d.tailDir ?? -18;
    const cutAng = d.terminal === 'oblique' ? (d.cutAng ?? -112) : tailDir - 90;
    const w = d.terminal === 'taper' ? 4 : (d.cutW ?? 125);
    const c = d.cutC ?? [575, 72];
    const dv = [Math.cos((cutAng * Math.PI) / 180), Math.sin((cutAng * Math.PI) / 180)];
    const u = [c[0] - dv[0] * w / 2, c[1] - dv[1] * w / 2], t = [c[0] + dv[0] * w / 2, c[1] + dv[1] * w / 2];
    const fl = d.flare ?? 4;
    nodes = [...ball.slice(0, d.K ? 5 : 4),
      { p: u, tin: tailDir + fl, tout: cutAng, aout: w / 3 },
      { p: t, tin: cutAng, tout: tailDir + 180 - fl, ain: w / 3 },
      ...(d.O ? [{ p: d.O, t: d.tO }] : [])];
  }
  // starting handles: the circular-arc ratio for the turn between the two node tangents
  const turn = (a, b) => { let t = Math.abs((((b - a) % 360) + 540) % 360 - 180); return Math.max(t, 20); };
  const arcK = (phi) => { const f = (phi * Math.PI) / 180; return ((2 / 3) * Math.tan(f / 4)) / Math.sin(f / 2); };
  const tOut = (n) => n.tout ?? n.t, tIn = (n) => n.tin ?? n.t;
  nodes = nodes.map((n, i) => {
    const prev = nodes[(i - 1 + nodes.length) % nodes.length], next = nodes[(i + 1) % nodes.length];
    return { ain: n.ain ?? ch(n.p, prev.p) * arcK(turn(tOut(prev), tIn(n))) * (d.kScale ?? 1), aout: n.aout ?? ch(n.p, next.p) * arcK(turn(tOut(n), tIn(next))) * (d.kScale ?? 1), ...n };
  });
  const c = norm(nodes);
  // straight cut: handles on the chord, held fixed
  const fixed = [];
  // a true circular ball: the two lower quarter arcs keep the circle's own handles (0.5523 r)
  if (d.circle) {
    const r = (d.R[0] - d.L[0]) / 2, hk = 0.5522847 * r * (d.circle === true ? 1 : d.circle);
    c[0].aout = hk; c[1].ain = hk; c[1].aout = hk; c[2].ain = hk;
    fixed.push('0.aout', '1.ain', '1.aout', '2.ain');
    if (d.I1a !== undefined && d.I1a !== null) {
      const span = Math.abs(d.I1a) * Math.PI / 180, h = (4 / 3) * Math.tan(span / 4) * r;
      c[2].aout = h; c[3].ain = h; fixed.push('3.ain'); // R.aout stays free so R is exactly G2
    }
  }
  c.forEach((n, i) => { const j = (i + 1) % c.length; if (n.corner && c[j].corner) { fixed.push(`${i}.aout`, `${j}.ain`); } });
  return solveG2(c, { lambda: d.lambda ?? 0.05, fixed });
}
