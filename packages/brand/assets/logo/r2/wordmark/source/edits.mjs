// Hand edits to Literata outlines. Each edit names the points it touches by their role in the
// glyph (found by geometry, then asserted), so a silent change in the source font fails loudly.

const near = (a, b, tol = 3) => Math.abs(a - b) <= tol;

/** Find the roles of a Literata lowercase t's points (contour of 25 commands, see README in rationale). */
function tRoles(cmds) {
  // bar right end: the two L points with the largest x
  const Ls = cmds.map((c, i) => ({ c, i })).filter(({ c }) => c.type === 'L' && c.y > 300 && c.y < 560);
  const maxX = Math.max(...Ls.map(({ c }) => c.x));
  const barR = Ls.filter(({ c }) => near(c.x, maxX));
  if (barR.length !== 2) throw new Error('t: bar end not found');
  const [top, bot] = barR.sort((a, b) => b.c.y - a.c.y);
  const iTopR = top.i, iBotR = bot.i; // 13, 14
  const iStemTopR = iTopR - 1; // 12: right stem meets bar top
  const iStemBotR = iBotR + 1; // 15: bar bottom meets right stem
  // left arm: the L points with the smallest x
  const minX = Math.min(...Ls.map(({ c }) => c.x));
  const arm = Ls.filter(({ c }) => near(c.x, minX)).sort((a, b) => a.c.y - b.c.y);
  if (arm.length !== 2) throw new Error('t: arm not found');
  const iArmBot = arm[0].i, iArmTop = arm[1].i; // 5, 6
  const iStemBotL = iArmBot - 1; // 4: left stem meets bar bottom
  const assert = (cond, m) => { if (!cond) throw new Error('t roles: ' + m); };
  assert(iArmTop === iArmBot + 1 && iStemTopR > iArmTop + 2 && iStemBotR === iBotR + 1, 'order');
  return { iStemBotL, iArmBot, iArmTop, iStemTopR, iTopR, iBotR, iStemBotR, barTop: top.c.y, barBot: bot.c.y };
}

/** Raise (or lower) a t's ascender above the bar by delta, tapering to zero at the bar. */
export function tAscender(cmds, delta) {
  if (!delta) return cmds;
  const { barTop } = tRoles(cmds);
  const topY = Math.max(...cmds.filter((c) => 'y' in c).map((c) => c.y));
  const f = (y) => (y <= barTop + 10 ? y : y + (delta * (y - barTop - 10)) / (topY - barTop - 10));
  return cmds.map((c) => {
    const o = { ...c };
    if ('y' in o) o.y = f(o.y);
    if ('y1' in o) o.y1 = f(o.y1);
    if ('y2' in o) o.y2 = f(o.y2);
    return o;
  });
}

/**
 * Join two positioned Literata t's into one contour that shares a single crossbar.
 * The second t loses its own left arm; the bar flows into its ascender through a soft bracket.
 * opts.bracket: how far left of the second stem the bracket starts (font units).
 */
export function joinTT(t1, t2, { bracket = 52, sag = 0 } = {}) {
  const a = tRoles(t1), b = tRoles(t2);
  const out = [];
  // t1 from the start (bottom of bowl) up its left stem, arm, ascender, down to the bar top on the right
  for (let i = 0; i <= a.iStemTopR; i++) out.push({ ...t1[i] });
  const stem2L = t2[b.iStemBotL].x; // left edge of t2 stem
  const armTop2 = t2[b.iArmTop];
  const br = t2[b.iArmTop + 1]; // first bracket Q (ctrl, end)
  const x0 = stem2L - bracket;
  // bar top runs straight to the bracket; an optional sag of a few units keeps a long bar from looking bowed upward
  if (sag) out.push({ type: 'Q', x1: (out[out.length - 1].x + x0) / 2, y1: a.barTop - sag, x: x0, y: a.barTop });
  else out.push({ type: 'L', x: x0, y: a.barTop });
  // soft bracket from the bar into t2's ascender: tangent to the bar, then rejoin the original curve
  out.push({ type: 'Q', x1: x0 + (br.x - x0) * 0.62, y1: a.barTop, x: br.x, y: br.y });
  for (let i = b.iArmTop + 2; i < t2.length; i++) if (t2[i].type !== 'Z') out.push({ ...t2[i] });
  // t2 contour returns to its start point; continue up its left stem to the bar bottom
  for (let i = 1; i <= b.iStemBotL; i++) out.push({ ...t2[i] });
  // bar bottom back to t1's right stem
  out.push({ type: 'L', x: t1[a.iStemBotR].x, y: t1[a.iStemBotR].y });
  for (let i = a.iStemBotR + 1; i < t1.length; i++) out.push({ ...t1[i] });
  if (out[out.length - 1].type !== 'Z') out.push({ type: 'Z' });
  void armTop2;
  return out;
}

/** Move the y's descender (tail and ball) up by d units, blending to zero between y=-20 and y=-70. */
export function yDescender(cmds, d) {
  if (!d) return cmds;
  const f = (y) => (y >= -20 ? y : y <= -70 ? y + d : y + (d * (-20 - y)) / 50);
  return cmds.map((c) => {
    const o = { ...c };
    if ('y' in o) o.y = f(o.y);
    if ('y1' in o) o.y1 = f(o.y1);
    if ('y2' in o) o.y2 = f(o.y2);
    return o;
  });
}
