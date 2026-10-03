// The mark: a cot mobile in the Calder manner. One sweeping wire hung from a single thread,
// a large disc at the low end and a small disc lifted high at the far end, in balance.
// Geometry only; every part is a filled path (no strokes) so it embosses and scales cleanly.
import { taper, cubic } from './stroke.mjs';

const f = (n) => Math.round(n * 10) / 10;
export const circle = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
/** Thread: a slim capsule, rounded top, square bottom hidden inside the wire. */
const thread = (x, y0, y1, w) => { const h = w / 2; return `M${f(x - h)} ${f(y1)}L${f(x - h)} ${f(y0 + h)}a${f(h)} ${f(h)} 0 0 1 ${f(w)} 0L${f(x + h)} ${f(y1)}Z`; };

export const defaults = {
  big: { x: 250, y: 690, R: 150 },     // the large disc
  small: { x: 820, y: 360, r: 66 },     // the small disc, lifted
  // wire: cubic from the top of the big disc to the top of the small disc
  c1: { x: 250, y: 300 }, c2: { x: 640, y: 150 },
  pivotT: 0.42,                         // where the thread meets the wire
  top: 110,                             // top of the suspension thread
  w0: 44, wMid: 38, w1: 24,             // wire width at big end, pivot, small end
  threadW: 18,
  sink: 0.35,                           // how deep the wire end sinks into each disc (fraction of radius)
};

export function geometry(o = {}) {
  const g = { ...defaults, ...o, big: { ...defaults.big, ...(o.big || {}) }, small: { ...defaults.small, ...(o.small || {}) } };
  const p0 = { x: g.big.x, y: g.big.y - g.big.R * (1 - g.sink) };
  const p3 = { x: g.small.x, y: g.small.y - g.small.r * (1 - g.sink) };
  const wire = cubic(p0, g.c1, g.c2, p3);
  const P = wire(g.pivotT);
  const w = (t) => t < g.pivotT ? g.w0 + (g.wMid - g.w0) * (t / g.pivotT) : g.wMid + (g.w1 - g.wMid) * ((t - g.pivotT) / (1 - g.pivotT));
  const parts = [
    taper(wire, w, { knots: g.knots || 12 }),
    thread(P.x, g.top, P.y, g.threadW),
    circle(g.big.x, g.big.y, g.big.R),
    circle(g.small.x, g.small.y, g.small.r),
  ];
  // bounds (sampled wire)
  let minX = Math.min(g.big.x - g.big.R, P.x - g.threadW), maxX = g.small.x + g.small.r, minY = g.top, maxY = Math.max(g.big.y + g.big.R, g.small.y + g.small.r);
  for (let i = 0; i <= 40; i++) { const q = wire(i / 40); minX = Math.min(minX, q.x - 25); maxX = Math.max(maxX, q.x + 25); minY = Math.min(minY, q.y - 25); }
  return { parts, d: parts.join(''), P, box: { minX, maxX, minY, maxY } };
}

/** Centred in a square viewBox with padding. Optical centre: shift toward the heavy disc slightly. */
export function framed(o = {}, pad = 0.08) {
  const { parts, d, box } = geometry(o);
  const w = box.maxX - box.minX, h = box.maxY - box.minY, s = Math.max(w, h) * (1 + 2 * pad);
  const cx = (box.minX + box.maxX) / 2 + (o.opticalX || 0), cy = (box.minY + box.maxY) / 2 + (o.opticalY || 0);
  return { parts, d, vb: `${f(cx - s / 2)} ${f(cy - s / 2)} ${f(s)} ${f(s)}`, box, size: s, cx, cy };
}
