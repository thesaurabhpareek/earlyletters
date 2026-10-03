import { shoot, done } from './render.mjs';
import { circle, band } from './geom.mjs';
const OUT = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/years';
const ink = '#2B2722', paper = '#FBF8F3', accent = '#8A5A3B';
const PI = Math.PI;
const arc = (cx, cy, rx, ry, a0, a1, wf, n = 40) => band(
  (t) => { const a = a0 + (a1 - a0) * t; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; },
  (t) => wf(a0 + (a1 - a0) * t, t), { n, capStart: 'butt', capEnd: 'butt' });
const calli = (wt, wb) => (a) => wb + (wt - wb) * (1 - Math.sin(a)) / 2;
// solid disc with cut rings (negative). bg = background colour to cut with (preview only; final uses evenodd geometry)
const S = {
  slice2: (c, bg) => `<path d="${circle(50, 50, 40)}" fill="${c}"/><path d="${arc(50, 88 - 3 - 24, 24, 24, 0, 2 * PI, calli(4.5, 1.6), 48)}" fill="${bg}"/><path d="${arc(50, 88 - 3 - 11.5 - 11, 11, 11, 0, 2*PI, calli(4, 1.4), 40)}" fill="${bg}"/>`,
  slice1: (c, bg) => `<path d="${circle(50, 50, 40)}" fill="${c}"/><path d="${arc(50, 88 - 5 - 22, 22, 22, 0, 2 * PI, calli(6, 2), 48)}" fill="${bg}"/>`,
  sliceSeed: (c, bg) => `<path d="${circle(50, 50, 40)}" fill="${c}"/><path d="${circle(50, 64, 20)}" fill="${bg}"/><path d="${circle(50, 74, 9)}" fill="${c}"/>`,
  shelf: (c) => `<rect x="18" y="34" width="14" height="52" rx="2.5" fill="${c}"/><rect x="36" y="24" width="15" height="62" rx="2.5" fill="${c}"/><rect x="58" y="16" width="16" height="70" rx="2.5" fill="${c}" transform="rotate(14 74 86)"/>`,
  marks: (c) => `${band(t=>[28,84-t*62],t=>2.2+0*t,{n:4})}`.replace(/^/, `<path fill="${c}" d="`) + `"/>` +
     [[70,30],[58,46],[50,64]].map(([y,len],i)=>`<path fill="${c}" d="${band(t=>[33+t*len*0.6, 0]).replace?'':''}"/>`).join(''),
};
// simpler marks drawn separately
S.marks = (c) => { let d = '';
  [[78, 22], [60, 30], [40, 38], [22, 44]].forEach(([y, L], i) => { d += band((t) => [26 + t * L, y + 1.5 * Math.sin(t * PI) - t * 1.5], (t) => 6.5 * (1 - 0.65 * t), { n: 10, capEnd: 'round' }); });
  return `<path d="${d}" fill="${c}"/>`; };
const cell = (name, f) => `<div class=c><div class=big><svg viewBox="0 0 100 100" width=220>${f(ink, '#fff')}</svg></div>
 <div class=row><div class=ic><svg viewBox="0 0 100 100" width=46>${f(paper, accent)}</svg></div>
 <div class=ic style="width:29px;height:29px;border-radius:7px"><svg viewBox="0 0 100 100" width=22>${f(paper, accent)}</svg></div>
 <svg viewBox="0 0 100 100" width=16>${f(ink, '#fff')}</svg><div class=ic style="background:#161412"><svg viewBox="0 0 100 100" width=46>${f('#D9A47E', '#161412')}</svg></div></div><p>${name}</p></div>`;
const html = `<style>body{margin:0;background:${paper};font:14px sans-serif;display:flex;flex-wrap:wrap;gap:20px;padding:20px}
.c{width:300px;background:#fff;padding:12px;border-radius:12px}.big{display:flex;justify-content:center}.row{display:flex;gap:16px;align-items:center}
.ic{width:60px;height:60px;border-radius:14px;background:${accent};display:flex;align-items:center;justify-content:center}</style>
${Object.entries(S).map(([k, f]) => cell(k, f)).join('')}`;
await shoot([{ html, out: OUT + '/sketch-sheet5.png', width: 1000, height: 900, full: true }]);
for (const [k, f] of Object.entries(S)) await shoot([{ html: `<body style="margin:0;background:${paper}"><svg viewBox="0 0 100 100" width=400>${f(ink, paper)}</svg>`, out: `${OUT}/sk5-${k}.png`, width: 400, height: 400 }]);
await done();
