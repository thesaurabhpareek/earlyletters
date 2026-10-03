// The moon-letter symbol: a crescent moon settling into an open envelope.
// 1000-unit grid, y-down. Exact booleans (bool.mjs) on lines and circular arcs; output is filled paths only.
import { circle, subtract, union, intersect, roundPoly, offsetPoly, toCmds } from './bool.mjs';
export const DEFAULT = {
  mouth: 'V',                      // 'V' (pointed envelope mouth) or 'arc' (mouth cut by a circle)
  x0: 90, x1: 910, ty: 455, vy: 720, by: 905, vx: 500,
  rTop: 22, rV: 40, rBot: 70,
  mcx: 500, mcy: 120, mr: 420,     // arc mouth circle
  mx: 470, my: 430, R: 255, bx: 120, by_: -95, br: 215,
  gap: 34,
};
function pocketShape(p, g = 0) {
  if (p.mouth === 'V') {
    const pts = [[p.x0, p.ty], [p.vx, p.vy], [p.x1, p.ty], [p.x1, p.by], [p.x0, p.by]];
    const rads = [p.rTop, p.rV, p.rTop, p.rBot, p.rBot];
    if (!g) return roundPoly(pts, rads);
    return roundPoly(offsetPoly(pts, g), [p.rTop + g, Math.max(0, p.rV - g), p.rTop + g, p.rBot + g, p.rBot + g]);
  }
  const pts = [[p.x0 - g, p.ty - g], [p.x1 + g, p.ty - g], [p.x1 + g, p.by + g], [p.x0 - g, p.by + g]];
  const body = roundPoly(pts, [p.rTop + g, p.rTop + g, p.rBot + g, p.rBot + g]);
  return subtract(body, circle([p.mcx, p.mcy], p.mr - g));
}
export function build(o = {}) {
  const p = { ...DEFAULT, ...o };
  const pocket = pocketShape(p);
  const guard = pocketShape(p, p.gap);
  const crescent = subtract(circle([p.mx, p.my], p.R), circle([p.mx + p.bx, p.my + p.by_], p.br));
  const moon = subtract(crescent, guard);
  return { pocket: toCmds(pocket), moon: toCmds(moon), p };
}
