// Parent and child: the small mark is the same drawing, scaled by RATIO, placed by a relationship.
import { glyph } from './glyph.mjs';
import { xform, bbox, sample, minDist, areaCentroid } from './geom.mjs';

/** place the child: s = ratio, rot = lean (deg, negative leans its top toward the parent),
 *  gap = closest distance between the two marks (units of the 1000-unit parent), dy = vertical offset of the child's bottom vs the parent's bottom */
export function pair({ glyphOpts = {}, s = 0.6, rot = 0, gap = 70, dy = 0, mode = 'side', x = null } = {}) {
  const big = glyph(glyphOpts);
  const one = xform(big, { s, rot });
  const bb = bbox([big]), bo = bbox([one]);
  // bottom alignment: child's lowest point at parent's bottom + dy
  const ty = bb.y1 + dy - bo.y1;
  let tx;
  if (x !== null) tx = x;
  else {
    // slide the child left from far right until the closest distance equals gap
    const A = sample(big, 40);
    let lo = bb.x0 - bo.x0, hi = bb.x1 - bo.x0 + 400;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      const B = sample(xform(big, { s, rot, tx: mid, ty }), 40);
      const d = minDist(A, B), inter = overlaps(A, B);
      if (inter || d < gap) lo = mid; else hi = mid;
    }
    tx = hi;
  }
  const kid = xform(big, { s, rot, tx, ty });
  return [big, kid];
}
function pip(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function overlaps(A, B) { return B.some((p) => pip(p, A)) || A.some((p) => pip(p, B)); }
export function measure(contours) {
  const [a, b] = contours.map((c) => sample(c, 50));
  const ca = areaCentroid(a), cb = areaCentroid(b);
  const A = ca.A + cb.A;
  return { gap: minDist(a, b), cx: (ca.cx * ca.A + cb.cx * cb.A) / A, cy: (ca.cy * ca.A + cb.cy * cb.A) / A, area: A };
}
