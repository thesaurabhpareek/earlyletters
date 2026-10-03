// The mark, v1 geometry: a two-level cot mobile. A top wire hung from one thread carries the large
// disc on its left and, on its right, a second smaller wire carrying a medium and a small disc.
// Every part is a filled path (no strokes). Wires are arcs that taper toward their light ends.
import { taper } from './stroke.mjs';
const f = (n) => Math.round(n * 10) / 10;
export const circle = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
const quad = (p0, c, p1) => (t) => { const u = 1 - t; return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y }; };
/** Thread: slim capsule from y0 to y1 (both ends rounded). */
export const thread = (x, y0, y1, w) => { const h = w / 2; return `M${f(x - h)} ${f(y0 + h)}a${f(h)} ${f(h)} 0 0 1 ${f(w)} 0L${f(x + h)} ${f(y1 - h)}a${f(h)} ${f(h)} 0 0 1 ${f(-w)} 0Z`; };
/** Arc wire between a and b, rising by `lift` at its middle; width w0 at a to w1 at b. */
const arcWire = (a, b, lift, wMid, wEnd, knots = 10, peak = 0.45) => {
  const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - lift };
  const fn = quad(a, c, b);
  // thickest where it hangs, thinning toward both tips (as a hand-bent wire reads)
  const w = (t) => { const d = t < peak ? t / peak : (1 - t) / (1 - peak); return wEnd + (wMid - wEnd) * Math.sin(Math.PI / 2 * d) ** 0.8; };
  return { d: taper(fn, w, { knots }), fn };
};

export const defaults = {
  top: 60, pivot1: 0.42, // where the top thread meets the top wire (t)
  // top wire
  a: { x: 190, y: 330 }, b: { x: 700, y: 300 }, lift1: 120, w0: 40, w1: 30,
  // big disc hangs from a
  R: 135, dropR: 50,
  // lower wire hangs from b
  drop2: 140, a2: { x: 560 }, b2: { x: 890 }, lift2: 80, v0: 30, v1: 22, pivot2: 0.42,
  // medium and small discs
  m: 80, dropM: 50, s: 52, dropS: 140,
  threadW: 18,
};

export function geometry(o = {}) {
  const g = { ...defaults, ...o };
  const parts = [];
  const top = arcWire(g.a, g.b, g.lift1, g.w0, g.w1);
  const P = top.fn(g.pivot1);
  parts.push(top.d, thread(P.x, g.top, P.y + 10, g.threadW));
  // big disc
  const by = g.a.y + g.dropR + g.R;
  parts.push(thread(g.a.x, g.a.y - g.threadW / 2, g.a.y + g.dropR + 20, g.threadW), circle(g.a.x, by, g.R));
  // lower wire: its pivot sits directly under b
  const y2 = g.b.y + g.drop2;
  const A2 = { x: g.a2.x, y: y2 + 30 }, B2 = { x: g.b2.x, y: y2 + 20 };
  const low = arcWire(A2, B2, g.lift2, g.v0, g.v1);
  // find t where low wire is under b.x
  let tq = 0.5; for (let i = 0; i < 40; i++) { const q = low.fn(tq); tq += (g.b.x - q.x) / (B2.x - A2.x) * 0.9; }
  const Q = low.fn(tq);
  parts.push(thread(g.b.x, g.b.y - g.threadW * 0.45, Q.y + 10, g.threadW * 0.9), low.d);
  const my = A2.y + g.dropM + g.m, sy = B2.y + g.dropS + g.s;
  parts.push(thread(A2.x, A2.y - 10, A2.y + g.dropM + 20, g.threadW * 0.85), circle(A2.x, my, g.m));
  parts.push(thread(B2.x, B2.y - 10, B2.y + g.dropS + 20, g.threadW * 0.8), circle(B2.x, sy, g.s));
  const box = { minX: g.a.x - g.R, maxX: Math.max(B2.x + g.s, B2.x + g.v1), minY: g.top, maxY: Math.max(by + g.R, my + g.m, sy + g.s) };
  return { parts, d: parts.join(''), box };
}

export function framed(o = {}, pad = 0.07) {
  const { parts, d, box } = geometry(o);
  const w = box.maxX - box.minX, h = box.maxY - box.minY, s = Math.max(w, h) * (1 + 2 * pad);
  const cx = (box.minX + box.maxX) / 2 + (o.opticalX || 0), cy = (box.minY + box.maxY) / 2 + (o.opticalY || 0);
  return { parts, d, vb: `${f(cx - s / 2)} ${f(cy - s / 2)} ${f(s)} ${f(s)}`, box, size: s, cx, cy };
}
