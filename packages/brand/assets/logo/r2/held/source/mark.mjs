// Geometry for the `held` mark: an open book whose two pages rise like arms and hold a small page.
// 100 x 100 design box. The left page is drawn by hand, the right page is its exact mirror.
const f = (n) => +(+n).toFixed(2);
const fmt = (d) => d.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (_, x, y) => `${f(x)},${f(y)}`);
export const mirrorD = (d) => d.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (_, x, y) => `${f(100 - +x)},${y}`);

export const P = {
  sg: 1.4,          // half-width of the gutter split between the two pages
  spineY: 86,       // bottom of the spine
  ox: 6, oy: 80,    // outer bottom corner
  ty: 30, r: 4,     // top of the page and its corner radius
  gy: 66,           // where the page top meets the gutter
  a: 12, b: 16, c: 6, // top-edge S curve: shoulder pull, gutter pull, gutter drop
  bot: [11, 6, 16, 2], // bottom edge handles
  page: { cx: 50, cy: 49, w: 13, h: 18, r: 1.6, a: -8 },
};

export function leftPage(p = P) {
  const g = 50 - p.sg, { ox, oy, ty, r, gy, a, b, c } = p, [b1, b2, b3, b4] = p.bot;
  return fmt(`M${g},${p.spineY} C${g - b1},${p.spineY - b2} ${ox + b3},${oy - b4} ${ox},${oy} L${ox},${ty + r} C${ox},${ty + r * 0.45} ${ox + r * 0.45},${ty} ${ox + r},${ty} C${p.c1 ? p.c1[0] : ox + r + a},${p.c1 ? p.c1[1] : ty} ${p.c2 ? p.c2[0] : g - b},${p.c2 ? p.c2[1] : gy - 22 + c} ${g},${gy} Z`);
}

export function pagePath({ cx, cy, w, h, r, a }) {
  const t = (a * Math.PI) / 180, co = Math.cos(t), si = Math.sin(t);
  const R = (x, y) => `${f(cx + x * co - y * si)},${f(cy + x * si + y * co)}`;
  const hw = w / 2, hh = h / 2, k = r * 0.4477; // circular-arc cubic handle
  // rounded rectangle as lines + cubic corners (no arcs, so every consumer reads it)
  return `M${R(-hw + r, -hh)} L${R(hw - r, -hh)} C${R(hw - r + k, -hh)} ${R(hw, -hh + r - k)} ${R(hw, -hh + r)} L${R(hw, hh - r)} C${R(hw, hh - r + k)} ${R(hw - r + k, hh)} ${R(hw - r, hh)} L${R(-hw + r, hh)} C${R(-hw + r - k, hh)} ${R(-hw, hh - r + k)} ${R(-hw, hh - r)} L${R(-hw, -hh + r)} C${R(-hw, -hh + r - k)} ${R(-hw + r - k, -hh)} ${R(-hw + r, -hh)} Z`;
}

export function joinedBook(p) {
  // one shape: the page tops meet in one smooth hollow; a V notch rises from the spine
  const { ox, oy, ty, r, gy, spineY } = p, [b1, b2, b3, b4] = p.bot, n = p.notchW ?? 1.6, ny = p.notchY ?? 78;
  const c1 = p.c1, c2 = p.c2;
  const m = ([x, y]) => [100 - x, y];
  const pt = ([x, y]) => `${f(x)},${f(y)}`;
  return `M${pt([50, ny])} L${pt([50 - n, spineY])} C${pt([50 - n - b1, spineY - b2])} ${pt([ox + b3, oy - b4])} ${pt([ox, oy])} L${pt([ox, ty + r])} C${pt([ox, ty + r * 0.45])} ${pt([ox + r * 0.45, ty])} ${pt([ox + r, ty])} C${pt(c1)} ${pt(c2)} ${pt([50, gy])} C${pt(m(c2))} ${pt(m(c1))} ${pt([100 - ox - r, ty])} C${pt([100 - ox - r * 0.45, ty])} ${pt([100 - ox, ty + r * 0.45])} ${pt([100 - ox, ty + r])} L${pt([100 - ox, oy])} C${pt([100 - ox - b3, oy - b4])} ${pt([50 + n + b1, spineY - b2])} ${pt([50 + n, spineY])} Z`;
}
export function mark(p = P) {
  if (p.joined) { const b = joinedBook(p); return { book: b, page: pagePath(p.page), d: `${b} ${pagePath(p.page)}` }; }
  const L = leftPage(p);
  return { book: `${L} ${mirrorD(L)}`, page: pagePath(p.page), d: `${L} ${mirrorD(L)} ${pagePath(p.page)}` };
}

export const deep = (a, b = {}) => { const o = structuredClone(a); for (const k in b) o[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? { ...o[k], ...b[k] } : b[k]; return o; };

// clearance: smallest distance between the held page outline and the book outline (design units)
export function clearance(p = P) {
  const cub = (p0, p1, p2, p3, t) => { const m = 1 - t; return [0, 1].map((i) => m * m * m * p0[i] + 3 * m * m * t * p1[i] + 3 * m * t * t * p2[i] + t * t * t * p3[i]); };
  const g = 50 - p.sg, { ox, ty, r, gy, a, b, c } = p;
  const P0 = [ox + r, ty], P1 = p.c1 || [ox + r + a, ty], P2 = p.c2 || [g - b, gy - 22 + c], P3 = [g, gy];
  const curve = []; for (let i = 0; i <= 200; i++) curve.push(cub(P0, P1, P2, P3, i / 200));
  curve.push(...Array.from({ length: 40 }, (_, i) => [g, gy + (i * (p.spineY - gy)) / 40]));
  const { cx, cy, w, h, a: an } = p.page; const t = (an * Math.PI) / 180;
  const pts = []; for (let i = 0; i <= 40; i++) { const u = -w / 2 + (w * i) / 40; pts.push([u, -h / 2], [u, h / 2]); }
  for (let i = 0; i <= 40; i++) { const v = -h / 2 + (h * i) / 40; pts.push([-w / 2, v], [w / 2, v]); }
  const pp = pts.map(([x, y]) => [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)]);
  let best = 1e9; for (const q of pp) for (const s of curve) for (const S of [s, [100 - s[0], s[1]]]) best = Math.min(best, Math.hypot(q[0] - S[0], q[1] - S[1]));
  return +best.toFixed(2);
}

export const svgMark = (p, fill, bg, pad = 0) => {
  const m = mark(p);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${100 + 2 * pad} ${100 + 2 * pad}">${bg ? `<rect x="${-pad}" y="${-pad}" width="${100 + 2 * pad}" height="${100 + 2 * pad}" fill="${bg}"/>` : ''}<path fill="${fill}" d="${m.d}"/></svg>`;
};

// drop the held page into the V until it sits `gap` units clear of both pages
export function seat(p, gap) {
  let lo = 20, hi = 80;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; const q = deep(p, { page: { cy: m } }); clearance(q) > gap ? (lo = m) : (hi = m); }
  return deep(p, { page: { cy: +lo.toFixed(2) } });
}

// tight bounds of the whole mark, including the rotated card
export function bounds(p) {
  const { cx, cy, w, h, a } = p.page, t = (a * Math.PI) / 180;
  const ys = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => cy + x * Math.sin(t) + y * Math.cos(t));
  const top = Math.min(p.ty, ...ys);
  return { x: p.ox, y: +top.toFixed(2), w: 100 - 2 * p.ox, h: +(p.spineY - top).toFixed(2) };
}
