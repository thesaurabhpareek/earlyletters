// Fairness search: find blend spans where ONE G2 cubic exists and its curvature runs monotonically
// between the two end curvatures (a clothoid-like ramp). node tune.mjs '<glyph json>'
import { glyph } from './mark.mjs';
import { g2cubic } from './g2.mjs';
const base = JSON.parse(process.argv[2] || '{}');
function kAlong(p0, g, n = 60) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, m = 1 - t;
    const d1 = { x: 3*m*m*(g.c1.x-p0.x)+6*m*t*(g.c2.x-g.c1.x)+3*t*t*(g.p.x-g.c2.x), y: 3*m*m*(g.c1.y-p0.y)+6*m*t*(g.c2.y-g.c1.y)+3*t*t*(g.p.y-g.c2.y) };
    const d2 = { x: 6*m*(g.c2.x-2*g.c1.x+p0.x)+6*t*(g.p.x-2*g.c2.x+g.c1.x), y: 6*m*(g.c2.y-2*g.c1.y+p0.y)+6*t*(g.p.y-2*g.c2.y+g.c1.y) };
    out.push((d1.x*d2.y-d1.y*d2.x)/Math.pow(Math.hypot(d1.x,d1.y),3));
  }
  return out;
}
export function fairness(s, e) {
  const g = g2cubic(s, e);
  const ks = kAlong(s.p, g);
  const lo = Math.min(s.k, e.k), hi = Math.max(s.k, e.k);
  let over = 0, wig = 0;
  for (let i = 0; i < ks.length; i++) { over += Math.max(0, ks[i] - hi) + Math.max(0, lo - ks[i]); if (i > 1) { const a = ks[i]-ks[i-1], b = ks[i-1]-ks[i-2]; if (a*b < 0) wig += Math.abs(a); } }
  return { ok: g.ok, over: over / ks.length, wig, a: g.a, b: g.b };
}
const tagPair = (g, t1, t2) => { const an = g.anchors; const i = an.findIndex((a) => a.tag === t1); return [an[i], an[i + 1]]; };
const res = [];
for (let ob = 8; ob <= 44; ob += 2) for (let ot = 4; ot <= 36; ot += 2) {
  const G = glyph({ ...base, outBall: ob, outTail: ot, anchorsOnly: true });
  const [s, e] = tagPair(G, 'bowl-out');
  const f = fairness(s, e);
  if (f.ok) res.push({ ob, ot, ...f });
}
res.sort((x, y) => (x.over + x.wig) - (y.over + y.wig));
console.log('outer blend (bowl-out -> tail-out):'); console.log(res.slice(0, 8));
const r2 = [];
for (let ip = 0.15; ip <= 0.8; ip += 0.05) for (let rf of [0.12, 0.14, 0.16, 0.18, 0.2, 0.24]) for (let bi = 10; bi <= 60; bi += 5) {
  const G = glyph({ ...base, inFrac: ip, rf, ballIn: bi, anchorsOnly: true });
  const an = G.anchors; const i = an.findIndex((a) => a.tag === 'tail-in');
  const f1 = fairness(an[i], an[i + 1]), f2 = fairness(an[i + 1], an[i + 2]);
  if (f1.ok && f2.ok) r2.push({ ip, rf, bi, s: f1.over + f1.wig + f2.over + f2.wig, f1, f2 });
}
r2.sort((x, y) => x.s - y.s);
console.log('notch (tail-in -> notch -> bowl):'); console.log(r2.slice(0, 8).map((r) => ({ ip: r.ip, rf: r.rf, bi: r.bi, s: +r.s.toFixed(4) })));
