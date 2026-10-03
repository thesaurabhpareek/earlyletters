import { shoot, done } from './render.mjs';
import { circle, band } from './geom.mjs';
const OUT = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/years';
const ink = '#2B2722', paper = '#FBF8F3', accent = '#8A5A3B';
const PI = Math.PI;
const semi = (x0, x1, y, h, w0, w1) => band((t) => { const a = PI - PI * t; const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2; return [cx + rx * Math.cos(a), y - h * Math.sin(a)]; }, (t) => w0 + (w1 - w0) * Math.sin(PI * t) , { n: 30, capStart: 'round', capEnd: 'round' });
const S = {
  hops: (c) => `<path fill="${c}" d="${semi(14, 34, 78, 14, 4, 7)}${semi(14, 58, 78, 30, 4, 8)}${semi(14, 86, 78, 50, 4, 9)}"/>`,
  hook: (c) => `<path fill="${c}" d="${band((t) => { // rises from ground and bows over
      const x = 40 + 22 * Math.sin(t * PI * 0.95) * t, y = 88 - 70 * Math.sin(t * PI * 0.62); return [x, y]; }, (t) => 9 - 3 * t, { n: 24, capStart: 'butt', capEnd: 'round' })}${circle(66, 52, 7)}"/>`,
  sideRings: (c) => { let d = circle(19, 50, 7); return `<path fill="${c}" d="${d}${band(t => { const a = PI + 2 * PI * t; return [12 + 22 + 22 * Math.cos(a), 50 + 22 * Math.sin(a)]; }, t => 3 + 6 * (1 - Math.cos(2 * PI * t)) / 2, { n: 40, capStart: 'butt', capEnd: 'butt' })}${band(t => { const a = PI + 2 * PI * t; return [10 + 40 + 40 * Math.cos(a), 50 + 40 * Math.sin(a)]; }, t => 3 + 7 * (1 - Math.cos(2 * PI * t)) / 2, { n: 56, capStart: 'butt', capEnd: 'butt' })}"/>`; },
};
const cell = (name, f) => `<div class=c><div class=big><svg viewBox="0 0 100 100" width=220>${f(ink)}</svg></div>
 <div class=row><div class=ic><svg viewBox="0 0 100 100" width=46>${f(paper)}</svg></div>
 <div class=ic style="width:29px;height:29px;border-radius:7px"><svg viewBox="0 0 100 100" width=22>${f(paper)}</svg></div>
 <svg viewBox="0 0 100 100" width=16>${f(ink)}</svg><div class=ic style="background:#161412"><svg viewBox="0 0 100 100" width=46>${f('#D9A47E')}</svg></div></div><p>${name}</p></div>`;
const html = `<style>body{margin:0;background:${paper};font:14px sans-serif;display:flex;flex-wrap:wrap;gap:20px;padding:20px}
.c{width:300px;background:#fff;padding:12px;border-radius:12px}.big{display:flex;justify-content:center}.row{display:flex;gap:16px;align-items:center}
.ic{width:60px;height:60px;border-radius:14px;background:${accent};display:flex;align-items:center;justify-content:center}</style>
${Object.entries(S).map(([k, f]) => cell(k, f)).join('')}`;
await shoot([{ html, out: OUT + '/sketch-sheet6.png', width: 1000, height: 400, full: true }]);
for (const [k, f] of Object.entries(S)) await shoot([{ html: `<body style="margin:0;background:${paper}"><svg viewBox="0 0 100 100" width=400>${f(ink)}</svg>`, out: `${OUT}/sk6-${k}.png`, width: 400, height: 400 }]);
await done();
