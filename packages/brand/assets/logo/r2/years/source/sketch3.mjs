import { shoot, done } from './render.mjs';
import { circle, band } from './geom.mjs';
const OUT = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/years';
const ink = '#2B2722', paper = '#FBF8F3', accent = '#8A5A3B';
// ring: centre (cx, cy), radius R; thickness varies from wb (bottom, angle 90deg) to wt (top)
// centreline circle radius R, offset so that thickness w(theta)=wb+(wt-wb)*(1-sin)/2 (sin=1 at bottom in svg coords)
const ring = (cx, cy, R, wt, wb, a0 = 0, a1 = 2 * Math.PI, caps = {}) => band(
  (t) => { const a = a0 + (a1 - a0) * t; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; },
  (t) => { const a = a0 + (a1 - a0) * t; return wb + (wt - wb) * (1 - Math.sin(a)) / 2; },
  { n: 48, ...caps });
const base = 88;
const stack = (radii, wt, wb, seed, opts = {}) => {
  let d = '';
  const tilt = opts.tilt || 0;
  radii.forEach((R, i) => {
    const cy = base - wb / 2 - R; const cx = 50;
    if (opts.openLast && i === radii.length - 1) {
      d += ring(cx, cy, R, wt, wb, Math.PI / 2 + 0.0, Math.PI / 2 + 2 * Math.PI * opts.openLast, { capEnd: 'round' });
    } else d += ring(cx, cy, R, wt, wb, 0, 2 * Math.PI, { capStart: 'butt', capEnd: 'butt' });
  });
  d += circle(50, base - seed, seed);
  return `<g transform="rotate(${tilt} 50 ${base})"><path d="${d}" fill="${opts.c}"/></g>`;
};
const S = {
  a_closed2: (c) => stack([24, 40], 9, 2.4, 9, { c }),
  b_open: (c) => stack([24, 40], 9, 2.4, 9, { c, openLast: 0.8 }),
  c_open3: (c) => stack([16, 28, 41], 7, 2, 7, { c, openLast: 0.78 }),
  d_tilt: (c) => stack([24, 40], 9, 2.4, 9, { c, tilt: -14 }),
  e_heavy: (c) => stack([22, 40], 12, 3, 10, { c }),
  f_open_heavy: (c) => stack([22, 40], 11, 2.5, 10, { c, openLast: 0.84 }),
};
const cell = (name, f) => `<div class=c><div class=big><svg viewBox="0 0 100 100" width=220>${f(ink)}</svg></div>
 <div class=row><div class=ic><svg viewBox="0 0 100 100" width=46>${f(paper)}</svg></div>
 <div class=ic style="width:29px;height:29px;border-radius:7px"><svg viewBox="0 0 100 100" width=22>${f(paper)}</svg></div>
 <svg viewBox="0 0 100 100" width=16>${f(ink)}</svg><div class=ic style="background:#161412"><svg viewBox="0 0 100 100" width=46>${f('#D9A47E')}</svg></div></div><p>${name}</p></div>`;
const html = `<style>body{margin:0;background:${paper};font:14px sans-serif;display:flex;flex-wrap:wrap;gap:20px;padding:20px}
.c{width:300px;background:#fff;padding:12px;border-radius:12px}.big{display:flex;justify-content:center}.row{display:flex;gap:16px;align-items:center}
.ic{width:60px;height:60px;border-radius:14px;background:${accent};display:flex;align-items:center;justify-content:center}</style>
${Object.entries(S).map(([k, f]) => cell(k, f)).join('')}`;
await shoot([{ html, out: OUT + '/sketch-sheet3.png', width: 1000, height: 900, full: true }]);
for (const [k, f] of Object.entries(S)) await shoot([{ html: `<body style="margin:0;background:${paper}"><svg viewBox="0 0 100 100" width=400>${f(ink)}</svg>`, out: `${OUT}/sk3-${k}.png`, width: 400, height: 400 }]);
await done();
