import { shoot, done } from './render.mjs';
const OUT = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/years';
const ink = '#2B2722', paper = '#FBF8F3', accent = '#8A5A3B';
const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
// rings internally near-tangent at a ground point; gap g at ground, ring width w at top
function grown(c, { base = [50, 88], radii = [8, 22, 38], w = 6, g = 2.5, ang = 90 }) {
  const a = ang * Math.PI / 180; const ux = -Math.cos(a), uy = -Math.sin(a); // direction from base to centres (up)
  let d = '';
  radii.forEach((R, i) => {
    const cx = base[0] + ux * R, cy = base[1] + uy * R;
    if (i === 0) { d += circ(cx, cy, R); return; }
    const rin = R - w; // inner circle: shifted up so gap at ground ~g, top width ~w? we fix ground thickness
    // inner circle: bottom at base + g + groundThickness
    const gt = Math.max(2.2, w * 0.45);
    const ci = [base[0] + ux * (gt + rin), base[1] + uy * (gt + rin)];
    d += circ(cx, cy, R) + circ(ci[0], ci[1], rin);
  });
  return `<path fill-rule="evenodd" d="${d}" fill="${c}"/>`;
}
const S = {
  tangentUp: (c) => grown(c, { radii: [9, 23, 40], w: 7 }),
  tangentLean: (c) => grown(c, { base: [30, 84], radii: [9, 23, 40], w: 7, ang: 60 }),
  twoRings: (c) => grown(c, { radii: [11, 26, 42], w: 8 }),
  thinMany: (c) => grown(c, { radii: [7, 17, 28, 40], w: 5 }),
  // open arches standing on one ground, each taller (doorways)
  doorways: (c) => `<path d="M14 88V52a36 36 0 0 1 72 0V88" fill="none" stroke="${c}" stroke-width="6"/><path d="M30 88V64a20 20 0 0 1 40 0V88" fill="none" stroke="${c}" stroke-width="6"/><circle cx="50" cy="80" r="8" fill="${c}"/>`,
  // seed shapes (egg) tangent at bottom
  eggs: (c) => { const egg = (h, wd) => `M50 88C${50 - wd} 88 ${50 - wd} ${88 - h * .55} ${50 - wd * .55} ${88 - h * .85}C${50 - wd * .3} ${88 - h} ${50 + wd * .3} ${88 - h} ${50 + wd * .55} ${88 - h * .85}C${50 + wd} ${88 - h * .55} ${50 + wd} 88 50 88z`;
    return `<path fill="none" stroke="${c}" stroke-width="6" d="${egg(76, 40)}"/><path fill="none" stroke="${c}" stroke-width="6" d="${egg(48, 26)}"/><circle cx="50" cy="78" r="8" fill="${c}"/>`; },
};
const cell = (name, f) => `<div class=c><div class=big><svg viewBox="0 0 100 100" width=220>${f(ink)}</svg></div>
 <div class=row><div class=ic><svg viewBox="0 0 100 100" width=46>${f(paper)}</svg></div>
 <div class=ic style="width:29px;height:29px;border-radius:7px"><svg viewBox="0 0 100 100" width=22>${f(paper)}</svg></div>
 <svg viewBox="0 0 100 100" width=16>${f(ink)}</svg></div><p>${name}</p></div>`;
const html = `<style>body{margin:0;background:${paper};font:14px sans-serif;display:flex;flex-wrap:wrap;gap:20px;padding:20px}
.c{width:300px;background:#fff;padding:12px;border-radius:12px}.big{display:flex;justify-content:center}.row{display:flex;gap:16px;align-items:center}
.ic{width:60px;height:60px;border-radius:14px;background:${accent};display:flex;align-items:center;justify-content:center}</style>
${Object.entries(S).map(([k, f]) => cell(k, f)).join('')}`;
await shoot([{ html, out: OUT + '/sketch-sheet2.png', width: 1000, height: 900, full: true }]);
for (const [k, f] of Object.entries(S)) await shoot([{ html: `<body style="margin:0;background:${paper}"><svg viewBox="0 0 100 100" width=400>${f(ink)}</svg>`, out: `${OUT}/sk-${k}.png`, width: 400, height: 400 }]);
await done();
