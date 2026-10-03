// "Years" mark, final construction: every shape is a true circle (4 cubics each).
// A ring = outer circle (clockwise) + eccentric inner circle (counter-clockwise).
// Rings nest inside one another and all rise from one ground point; the seed rests at the bottom.
import { circle } from './geom.mjs';
const PI = Math.PI;
export function years2(p) {
  const { G = 90, cx = 50, seed, gap = 0 } = p;
  let d = '', floor = G; const geo = [];
  // build from the outside in so each ring rests on the inner edge of the one around it
  const rings = p.rings.slice().reverse(); // [{R, wmin, wmax, thin(deg, 90 = bottom)}]
  let bottom = G, x = cx;
  for (const r of rings) {
    const Ro = r.R, cy = bottom - Ro, cx0 = x;
    const avg = (r.wmin + r.wmax) / 2, e = (r.wmax - r.wmin) / 2;
    const a = r.thin * PI / 180; // direction of the thin side (svg angle)
    const Ri = Ro - avg; const ix = cx0 + e * Math.cos(a), iy = cy + e * Math.sin(a);
    d += circle(cx0, cy, Ro) + circle(ix, iy, Ri, true);
    geo.push({ cx: cx0, cy, Ro, ix, iy, Ri });
    x = ix;
    // lowest point of inner circle = next floor (minus gap)
    bottom = iy + Ri - gap;
  }
  d += circle(x, bottom - seed, seed);
  geo.push({ seed: [x, bottom - seed, seed] });
  return { d, geo };
}
