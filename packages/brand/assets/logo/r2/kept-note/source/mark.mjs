// The kept-note symbol: a note folded once, standing, still holding its fold.
// Half a heart was cut at the crease, so when the note is opened a whole heart shows through.
//
// Each leaf is drawn in "flat" leaf space (u from the crease outward, v from the top down)
// and mapped onto its perspective quad with a bilinear map. The crease can be shown as a
// slot (gap) above the heart, below it, both, or not at all.
import { r } from './lib.mjs';

export const DEFAULTS = {
  cx: 500,
  top: 140, bot: 860,   // crease top and bottom (the crease is the nearest edge)
  W: 300,               // flat leaf width (heart is measured in these units)
  wL: 270, wR: 230,     // on-screen leaf widths
  dyL: 34, dyR: 48,     // perspective inset of each outer edge, top and bottom
  gap: 24,              // crease slot width
  slot: 'both',         // 'both' | 'above' | 'below' | 'none'
  ht: 170, hh: 300, hw: 150, // heart half: top (from crease top), height, half-width (flat units)
  notch: 0.22, shoulder: 0.32, pull: 0.5,
  rad: 24,              // outer corner radius
  radIn: 0,             // crease-end corner radius (top and bottom of crease)
};

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const f = (q) => `${r(q[0])} ${r(q[1])}`;
const bez = (s, t) => { // point on cubic
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * s[0][k] + 3 * u * u * t * s[1][k] + 3 * u * t * t * s[2][k] + t * t * t * s[3][k]);
};
function split(s, t) { // de Casteljau
  const a = lerp(s[0], s[1], t), b = lerp(s[1], s[2], t), c = lerp(s[2], s[3], t);
  const d = lerp(a, b, t), e = lerp(b, c, t), m = lerp(d, e, t);
  return [[s[0], a, d, m], [m, e, c, s[3]]];
}
/** t where |x - cx| first reaches w (searching from the end nearest the crease). */
function tAtOffset(s, cx, w, fromStart) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2, dx = Math.abs(bez(s, mid)[0] - cx);
    if (fromStart ? dx < w : dx > w) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
const rev = (s) => [s[3], s[2], s[1], s[0]];
const C = (s) => `C${f(s[1])} ${f(s[2])} ${f(s[3])}`;

export function geometry(over = {}) {
  const p = { ...DEFAULTS, ...over };
  const H = p.bot - p.top;
  const quad = (side) => {
    const w = side > 0 ? p.wR : p.wL, dy = side > 0 ? p.dyR : p.dyL;
    const St = [p.cx, p.top], Sb = [p.cx, p.bot], Ot = [p.cx + side * w, p.top + dy], Ob = [p.cx + side * w, p.bot - dy];
    const map = (u, v) => lerp(lerp(St, Ot, u / p.W), lerp(Sb, Ob, u / p.W), v / H);
    return { St, Sb, Ot, Ob, map };
  };
  const heart = (side) => { // three cubics from the point (on the crease) to the notch (on the crease)
    const { map } = quad(side);
    const { ht, hh, hw } = p;
    // normalised half heart (x in hw, y in hh from the heart top), point -> widest -> lobe top -> notch
    const n = p.notch, w = p.shoulder, k = p.pull;
    const Hn = [
      [[0, 1], [k, 0.8], [0.98, w + 0.2], [1, w]],
      [[1, w], [1.02, w - 0.2], [0.82, 0], [0.52, 0]],
      [[0.52, 0], [0.24, 0], [0.02, n - 0.13], [0, n]],
    ];
    const raw = Hn.map((s) => s.map(([x, y]) => [x * hw, ht + y * hh]));
    return raw.map((s) => s.map(([u, v]) => map(u, v)));
  };
  return { p, quad, heart };
}

function corner(a, P, b, rr) { // rounded corner at P coming from a going to b
  if (!rr) return `L${f(P)}`;
  const toward = (x, y, d) => lerp(x, y, d / Math.hypot(y[0] - x[0], y[1] - x[1]));
  return `L${f(toward(P, a, rr))}Q${f(P)} ${f(toward(P, b, rr))}`;
}

export function mark(over = {}) {
  const { p, quad, heart } = geometry(over);
  const g2 = p.gap / 2;
  const R = quad(1), L = quad(-1);
  const hR = heart(1), hL = heart(-1);
  const above = p.slot === 'both' || p.slot === 'above';
  const below = p.slot === 'both' || p.slot === 'below';
  const edgeAt = (S, O, dx) => lerp(S, O, dx / Math.abs(O[0] - S[0]));

  // heart pieces trimmed to the slot walls where needed
  const trimPoint = (h, side) => { // trim seg1 at its start (point end) to the wall
    if (!below) return h;
    const t = tAtOffset(h[0], p.cx, g2, true);
    return [split(h[0], t)[1], h[1], h[2]];
  };
  const trimNotch = (h) => { // trim seg3 at its end (notch end) to the wall
    if (!above) return h;
    const t = tAtOffset(rev(h[2]), p.cx, g2, true);
    return [h[0], h[1], rev(split(rev(h[2]), t)[1])];
  };
  const hr = trimNotch(trimPoint(hR, 1)), hl = trimNotch(trimPoint(hL, -1));

  const leafOuter = (Q, side, start, end) => // from crease top (start) round the outer corners to crease bottom (end)
    `M${f(start)}` + corner(start, Q.Ot, Q.Ob, p.rad) + corner(Q.Ot, Q.Ob, end, p.rad) + `L${f(end)}`;

  if (p.slot === 'both') {
    const leaf = (Q, h, side) => {
      const a = edgeAt(Q.St, Q.Ot, g2), b = edgeAt(Q.Sb, Q.Ob, g2);
      return leafOuter(Q, side, a, b) + `L${f(h[0][0])}` + h.map(C).join('') + 'Z';
    };
    return leaf(R, hr, 1) + leaf(L, hl, -1);
  }
  if (p.slot === 'none') {
    const outer = `M${f(R.St)}` + corner(R.St, R.Ot, R.Ob, p.rad) + corner(R.Ot, R.Ob, R.Sb, p.rad) + `L${f(R.Sb)}`
      + corner(R.Sb, L.Ob, L.Ot, p.rad) + corner(L.Ob, L.Ot, L.St, p.rad) + 'Z';
    // hole: counter-clockwise: point -> left half up to notch reversed... use right half reversed then left forward
    const hole = `M${f(hL[2][3])}` + [rev(hL[2]), rev(hL[1]), rev(hL[0])].map(C).join('') + hR.map(C).join('') + 'Z';
    return outer + hole;
  }
  if (p.slot === 'below') {
    const a = edgeAt(R.Sb, R.Ob, g2), b = edgeAt(L.Sb, L.Ob, g2);
    let d = `M${f(R.St)}` + corner(R.St, R.Ot, R.Ob, p.rad) + corner(R.Ot, R.Ob, a, p.rad) + `L${f(a)}`;
    d += `L${f(hr[0][0])}` + hr.map(C).join('');           // up the right wall, round the right lobe to the notch
    d += [rev(hl[2]), rev(hl[1]), rev(hl[0])].map(C).join(''); // left lobe back down to the left wall
    d += `L${f(b)}` + corner(b, L.Ob, L.Ot, p.rad) + corner(L.Ob, L.Ot, L.St, p.rad) + 'Z';
    return d;
  }
  // above
  const a = edgeAt(R.St, R.Ot, g2), b = edgeAt(L.St, L.Ot, g2);
  let d = `M${f(a)}` + corner(a, R.Ot, R.Ob, p.rad) + corner(R.Ot, R.Ob, R.Sb, p.rad) + `L${f(R.Sb)}`
    + corner(R.Sb, L.Ob, L.Ot, p.rad) + corner(L.Ob, L.Ot, b, p.rad) + `L${f(b)}`;
  d += `L${f(hl[2][3])}` + [rev(hl[2]), rev(hl[1]), rev(hl[0])].map(C).join('') + hr.map(C).join('') + 'Z';
  return d;
}

/** Apply fn([x,y]) to every coordinate pair of an absolute M/L/Q/C/Z path. */
export function mapPath(d, fn) {
  return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => { const q = fn([+x, +y]); return `${r(q[0])} ${r(q[1])}`; });
}
/** Bounding box from the on-curve and control points (good enough for these shapes). */
export function bbox(d) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => { x = +x; y = +y; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
/** Centre the mark in a 1000 box at height h (optical nudge dx, dy). */
export function fit(d, h = 760, dx = 0, dy = 0) {
  const b = bbox(d), s = h / b.h;
  return mapPath(d, ([x, y]) => [500 + (x - (b.x0 + b.w / 2)) * s + dx, 500 + (y - (b.y0 + b.h / 2)) * s + dy]);
}
