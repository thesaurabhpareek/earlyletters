// Geometry for logo direction A ("The letter").
// All coordinates are font units, y up, 1000 units per em (Literata).
import { font, glyphCommands, clean, translate, layout } from './lib.mjs';

/* ------------------------------------------------------------------ */
/* Exact half-plane clipping of TrueType outlines (L and Q segments).  */
/* Sutherland-Hodgman against the line y = c; curves are split exactly */
/* with de Casteljau, so the result is still pure quadratic outlines.  */
/* ------------------------------------------------------------------ */

function contours(cmds) {
  const out = [];
  let cur = null;
  for (const c of cmds) {
    if (c.type === 'M') { cur = { start: { x: c.x, y: c.y }, segs: [] }; out.push(cur); }
    else if (c.type === 'Z') cur = null;
    else cur.segs.push({ ...c });
  }
  // make each contour explicitly closed
  for (const k of out) {
    const last = k.segs[k.segs.length - 1];
    if (!last || last.x !== k.start.x || last.y !== k.start.y) k.segs.push({ type: 'L', x: k.start.x, y: k.start.y });
  }
  return out;
}

const lerp = (a, b, t) => a + (b - a) * t;

function splitQ(p0, s, t) {
  const a = { x: lerp(p0.x, s.x1, t), y: lerp(p0.y, s.y1, t) };
  const b = { x: lerp(s.x1, s.x, t), y: lerp(s.y1, s.y, t) };
  const m = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
  return [
    { type: 'Q', x1: a.x, y1: a.y, x: m.x, y: m.y },
    { type: 'Q', x1: b.x, y1: b.y, x: s.x, y: s.y },
  ];
}

/** Break a segment into pieces that never cross y = c. */
function pieces(p0, s, c) {
  if (s.type === 'L') {
    if ((p0.y - c) * (s.y - c) < 0) {
      const t = (c - p0.y) / (s.y - p0.y);
      const m = { type: 'L', x: lerp(p0.x, s.x, t), y: c };
      return [{ from: p0, seg: m }, { from: { x: m.x, y: m.y }, seg: s }];
    }
    return [{ from: p0, seg: s }];
  }
  // quadratic: solve a t^2 + b t + d = 0
  const a = p0.y - 2 * s.y1 + s.y, b = 2 * (s.y1 - p0.y), d = p0.y - c;
  let ts = [];
  if (Math.abs(a) < 1e-9) { if (Math.abs(b) > 1e-9) ts = [-d / b]; }
  else {
    const disc = b * b - 4 * a * d;
    if (disc >= 0) ts = [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)];
  }
  ts = ts.filter((t) => t > 1e-6 && t < 1 - 1e-6).sort((x, y) => x - y);
  const res = [];
  let from = p0, rest = s, used = 0;
  for (const t of ts) {
    const local = (t - used) / (1 - used);
    const [l, r] = splitQ(from, rest, local);
    l.y = c; // snap onto the cut line
    res.push({ from, seg: l });
    from = { x: l.x, y: c };
    rest = r;
    used = t;
  }
  res.push({ from, seg: rest });
  return res;
}

/** Keep the part of the outline where y >= c (keep='above') or y <= c (keep='below'). */
export function clipY(cmds, c, keep) {
  const inside = (y) => (keep === 'above' ? y >= c - 1e-6 : y <= c + 1e-6);
  const out = [];
  for (const k of contours(cmds)) {
    const ps = [];
    let p = k.start;
    for (const s of k.segs) { ps.push(...pieces(p, s, c)); p = { x: s.x, y: s.y }; }
    // classify each piece by its midpoint height
    const mid = (pc) => (pc.seg.type === 'L' ? (pc.from.y + pc.seg.y) / 2 : 0.25 * pc.from.y + 0.5 * pc.seg.y1 + 0.25 * pc.seg.y);
    const keepers = ps.map((pc) => inside(mid(pc)));
    if (!keepers.some(Boolean)) continue;
    if (keepers.every(Boolean)) { out.push({ type: 'M', ...k.start }, ...k.segs, { type: 'Z' }); continue; }
    // rotate so we start at the first kept piece that follows a dropped one
    let s0 = keepers.findIndex((v, i) => v && !keepers[(i - 1 + keepers.length) % keepers.length]);
    const order = ps.map((_, i) => (s0 + i) % ps.length);
    const first = ps[order[0]];
    out.push({ type: 'M', x: first.from.x, y: first.from.y });
    let pen = { x: first.from.x, y: first.from.y };
    for (const i of order) {
      const pc = ps[i];
      if (!keepers[i]) continue;
      if (Math.abs(pc.from.x - pen.x) > 1e-6 || Math.abs(pc.from.y - pen.y) > 1e-6) out.push({ type: 'L', x: pc.from.x, y: c });
      out.push(pc.seg);
      pen = { x: pc.seg.x, y: pc.seg.y };
    }
    out.push({ type: 'Z' });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* The symbol: Literata e, folded once along its crossbar.             */
/* ------------------------------------------------------------------ */

export const SYMBOL = {
  weight: 600,
  // crossbar of Literata 600 e runs y 240..309; the crease sits on its centre line
  crease: 274.5,
  gap: 22,
};

/** Optical cuts: the crease widens as the mark gets smaller. */
export const CUTS = {
  master: { weight: 600, crease: 274.5, gap: 22 },
  icon: { weight: 600, crease: 274.5, gap: 42 },
  small: { weight: 700, crease: 271, gap: 46 },
};

export function symbolCmds({ weight = SYMBOL.weight, crease = SYMBOL.crease, gap = SYMBOL.gap } = {}) {
  const e = clean(glyphCommands(font('literata', weight), 'e'));
  if (!gap) return e;
  // Open the letter at the crease: the halves move apart by gap/2 each, so the
  // two halves of the crossbar keep their full weight and the crease line
  // stays where it was. The e grows by `gap` in height.
  return [
    ...translate(clipY(e, crease, 'above'), 0, gap / 2),
    ...translate(clipY(e, crease, 'below'), 0, -gap / 2),
  ];
}

/* ------------------------------------------------------------------ */
/* The wordmark: Literata 500, optically spaced, tt joined.            */
/* ------------------------------------------------------------------ */

export const WORDMARK = {
  text: 'Early Letters',
  weight: 500,
  tracking: 0,
  kern: {},
  ligatureTT: true,
};

export function wordmarkCmds(opts = {}) {
  const o = { ...WORDMARK, ...opts };
  const f = font('literata', o.weight);
  const lay = layout(f, o.text, { tracking: o.tracking, kern: o.kern });
  const cmds = lay.glyphs.flatMap((g) => g.cmds);
  if (o.ligatureTT) {
    const ts = lay.glyphs.filter((g) => g.ch === 't');
    if (ts.length === 2) {
      // t crossbar in Literata 500: x 33..376, y 439..509. Bridge first bar to second.
      const x0 = ts[0].x + 360, x1 = ts[1].x + 60;
      cmds.push(
        { type: 'M', x: x0, y: 439 }, { type: 'L', x: x0, y: 509 }, { type: 'L', x: x1, y: 509 },
        { type: 'L', x: x1, y: 439 }, { type: 'Z' },
      );
    }
  }
  return { cmds, width: lay.width, glyphs: lay.glyphs };
}
