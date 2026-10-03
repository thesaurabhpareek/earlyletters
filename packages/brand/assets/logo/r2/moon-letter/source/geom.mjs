// Tiny geometry kit: everything becomes M/L/C/Z commands in absolute coords.
export const r = (n) => Math.round(n * 100) / 100;
export const deg = (a) => (a * Math.PI) / 180;
// Arc from angle a0 to a1 (radians, SVG y-down, positive = clockwise on screen) as cubic segments.
export function arc(cx, cy, rad, a0, a1) {
  const segs = Math.max(1, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 2)));
  const out = []; const da = (a1 - a0) / segs; const k = (4 / 3) * Math.tan(da / 4);
  for (let i = 0; i < segs; i++) {
    const t0 = a0 + i * da, t1 = t0 + da;
    const p0 = [cx + rad * Math.cos(t0), cy + rad * Math.sin(t0)], p3 = [cx + rad * Math.cos(t1), cy + rad * Math.sin(t1)];
    const p1 = [p0[0] - k * rad * Math.sin(t0), p0[1] + k * rad * Math.cos(t0)];
    const p2 = [p3[0] + k * rad * Math.sin(t1), p3[1] - k * rad * Math.cos(t1)];
    out.push(['C', ...p1, ...p2, ...p3]);
  }
  return out;
}
export const ang = (cx, cy, p) => Math.atan2(p[1] - cy, p[0] - cx);
export function circInt(c1, c2) { // returns two intersection points of circles {x,y,r}
  const dx = c2.x - c1.x, dy = c2.y - c1.y, d = Math.hypot(dx, dy);
  const a = (c1.r ** 2 - c2.r ** 2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, c1.r ** 2 - a * a));
  const mx = c1.x + (a * dx) / d, my = c1.y + (a * dy) / d;
  return [[mx + (h * dy) / d, my - (h * dx) / d], [mx - (h * dy) / d, my + (h * dx) / d]];
}
export function toD(cmds) {
  return cmds.map((c) => c[0] + c.slice(1).map(r).join(' ')).join('');
}
// rounded polygon (convex or not) through points with radius per corner
export function roundPoly(pts, rads) {
  const n = pts.length, cmds = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n], rr = Array.isArray(rads) ? rads[i] : rads;
    const v1 = norm([a[0] - p[0], a[1] - p[1]]), v2 = norm([b[0] - p[0], b[1] - p[1]]);
    const th = Math.acos(Math.max(-1, Math.min(1, v1[0] * v2[0] + v1[1] * v2[1])));
    const t = rr / Math.tan(th / 2);
    const s = [p[0] + v1[0] * t, p[1] + v1[1] * t], e = [p[0] + v2[0] * t, p[1] + v2[1] * t];
    const kk = (4 / 3) * Math.tan((Math.PI - th) / 4) * rr; // handle length
    cmds.push([i ? 'L' : 'M', ...s]);
    if (rr > 0) cmds.push(['C', s[0] - v1[0] * kk, s[1] - v1[1] * kk, e[0] - v2[0] * kk, e[1] - v2[1] * kk, ...e]);
  }
  cmds.push(['Z']); return cmds;
}
export const norm = (v) => { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; };
