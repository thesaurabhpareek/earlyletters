// "Years" mark, construction 3.
// Each ring: a true outer circle resting on one ground point, and a hole whose wall is
// heavy above and a hairline at the ground (like a year's growth, laid on from below).
// The next ring sits in that hole, touching it at a single point. The seed sits in the last hole.
import { circle, smooth } from './geom.mjs';
const PI = Math.PI;
export function years3(p) {
  const { G = 90, cx = 50, seed, holeN = 12 } = p;
  let d = '', bottom = G; const geo = { rings: [] };
  for (const r of p.rings) { // outermost first
    const Ro = r.R, cy = bottom - Ro;
    const w = (a) => { const s = (1 - Math.sin(a + r.ph * PI / 180)) / 2; return r.wb + (r.wt - r.wb) * ((1 - r.m) * s + r.m * s * s); };
    // sample the hole, starting at the bottom so a node sits exactly on the touch point
    const pts = [];
    for (let i = 0; i < holeN; i++) { const a = PI / 2 - (2 * PI * i) / holeN; const rr = Ro - w(a); pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
    d += circle(cx, cy, Ro) + smooth(pts, true) + 'Z';
    geo.rings.push({ cx, cy, Ro, pts });
    geo.rings.at(-1).w = w;
    bottom = pts[0][1]; // hole's node under the centre; refined below to an exact single-point touch
  }
  // Rebuild with exact tangency: each inner shape is lifted until it touches its hole at one point only.
  return exact(p);
}
const clearance = (circ, ring) => { let worst = 1e9; for (let k = 0; k < 2880; k++) { const a = k / 2880 * 2 * PI; const x = circ[0] + circ[2] * Math.cos(a), y = circ[1] + circ[2] * Math.sin(a);
  const ang = Math.atan2(y - ring.cy, x - ring.cx), dist = Math.hypot(x - ring.cx, y - ring.cy); worst = Math.min(worst, ring.Ro - ring.w(ang) - dist); } return worst; };
function exact(p) {
  const { G = 90, cx = 50, seed, holeN = 12 } = p;
  let d = '', bottom = G, prev = null; const geo = { rings: [] };
  const fit = (r) => { if (!prev) return bottom; let lo = bottom - 3, hi = bottom + 1; // find cy-bottom where clearance = 0
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; const c = clearance([cx, m - r, r], prev); if (c < 0) hi = m; else lo = m; } return lo; };
  for (const r of p.rings) {
    const Ro = r.R; bottom = fit(Ro); const cy = bottom - Ro;
    let w, holeD, pts = [];
    if (r.ecc) { // hole is a true circle, shifted toward the thin side: thickness wb..wt as a pure cosine
      const e = (r.wt - r.wb) / 2, Ri = Ro - (r.wt + r.wb) / 2, t = PI / 2 - r.ph * PI / 180; // thin direction
      const hx = cx + e * Math.cos(t), hy = cy + e * Math.sin(t);
      w = (a) => { const ux = Math.cos(a), uy = Math.sin(a), ox = cx - hx, oy = cy - hy; const b = ox * ux + oy * uy, c = ox * ox + oy * oy - Ri * Ri; return Ro - (-b + Math.sqrt(b * b - c)); };
      holeD = circle(hx, hy, Ri, true);
    } else {
      w = (a) => { const s = (1 - Math.sin(a + r.ph * PI / 180)) / 2; return r.wb + (r.wt - r.wb) * ((1 - r.m) * s + r.m * s * s); };
      for (let i = 0; i < holeN; i++) { const a = PI / 2 - (2 * PI * i) / holeN; const rr = Ro - w(a); pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
      holeD = smooth(pts, true) + 'Z';
    }
    d += circle(cx, cy, Ro) + holeD;
    prev = { cx, cy, Ro, w }; geo.rings.push({ cx, cy, Ro, pts, w });
    bottom = cy + Ro - w(PI / 2);
  }
  bottom = fit(seed);
  d += circle(cx, bottom - seed, seed);
  geo.seed = [cx, bottom - seed, seed];
  return { d, geo };
}
