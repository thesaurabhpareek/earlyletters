// The "years" mark: rings that stand on one ground. Parametric, returns a filled path d.
import { circle, band } from './geom.mjs';
const PI = Math.PI;
/**
 * p.rings: centreline radii of rings (inner to outer)
 * p.wt / p.wb: ring width at top / at ground (array or number)
 * p.seed: seed radius; p.lift: gap between ground and each ring's lowest edge
 * p.tilt: degrees (negative leans left); p.ground: y of ground; p.cx
 */
export function years(p) {
  const { rings, seed, ground = 90, cx = 50, gap = 2.2, tilt = 0, squash = 1 } = p;
  const wt = [].concat(p.wt), wb = [].concat(p.wb);
  let d = '';
  // seed sits on ground
  const parts = [];
  parts.push({ type: 'c', cx, cy: ground - seed, r: seed });
  let floor = ground; // each ring's outer bottom edge sits on the ground
  rings.forEach((R, i) => {
    const t = wt[Math.min(i, wt.length - 1)], b = wb[Math.min(i, wb.length - 1)];
    const cy = ground - b / 2 - R * squash;
    parts.push({ type: 'r', cx, cy, R, t, b, ph: [].concat(p.phase || 0)[Math.min(i, [].concat(p.phase || 0).length - 1)] });
  });
  const rot = (x, y) => { const a = tilt * PI / 180, ox = cx, oy = ground; const dx = x - ox, dy = y - oy; return [ox + dx * Math.cos(a) - dy * Math.sin(a), oy + dx * Math.sin(a) + dy * Math.cos(a)]; };
  for (const q of parts) {
    if (q.type === 'c') { const [x, y] = rot(q.cx, q.cy); d += circle(x, y, q.r); continue; }
    d += band((t) => { const a = PI / 2 + 2 * PI * t; return rot(q.cx + q.R * Math.cos(a), q.cy + q.R * squash * Math.sin(a)); },
      (t) => { const a = PI / 2 + 2 * PI * t; const ph = q.ph * PI / 180; const s = (1 - Math.sin(a + ph)) / 2; return q.b + (q.t - q.b) * Math.pow(s, p.ease || 1); },
      { n: p.n || 32, capStart: 'butt', capEnd: 'butt' });
  }
  return d;
}
export function bbox(d) { const nums = d.match(/-?\d+(\.\d+)?/g).map(Number); let xs = [], ys = []; for (let i = 0; i + 1 < nums.length; i += 2) { xs.push(nums[i]); ys.push(nums[i + 1]); } return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
