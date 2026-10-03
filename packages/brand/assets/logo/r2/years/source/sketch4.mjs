import { shoot, done } from './render.mjs';
import { circle, band } from './geom.mjs';
const OUT = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/years';
const ink = '#2B2722', paper = '#FBF8F3', accent = '#8A5A3B';
const PI = Math.PI;
// angles: SVG coords, PI/2 = bottom. a0..a1 path; width profile fn of angle
const arc = (cx, cy, rx, ry, a0, a1, wf, n = 40) => band(
  (t) => { const a = a0 + (a1 - a0) * t; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; },
  (t) => wf(a0 + (a1 - a0) * t, t), { n, capStart: 'butt', capEnd: 'butt' });
const calli = (wt, wb) => (a) => wb + (wt - wb) * (1 - Math.sin(a)) / 2;
const taper = (wt, gap) => (a, t) => { const e = Math.min(t, 1 - t) / 0.18; return wt * Math.min(1, Math.max(0.05, e)) ** 0.8 * (0.55 + 0.45 * (1 - Math.sin(a)) / 2); };
const S = {
  calliGap: (c) => { const g = 3; let d = '';
    // seed r9 at bottom 88; ring1 r(centre)=22 bottom inner edge at 88-18-g...
    d += circle(50, 79, 9);
    d += arc(50, 88 - 22 - 1.2 - 0, 22, 22, 0, 2 * PI, calli(9, 2.4), 48).replace(/^/, '');
    d += arc(50, 88 - 40 - 1.2, 40, 40, 0, 2 * PI, calli(10, 2.4), 64);
    return `<path d="${d}" fill="${c}"/>`; },
  horseshoe: (c) => { let d = circle(50, 76, 9);
    d += arc(50, 62, 22, 22, PI / 2 + 0.75, PI / 2 + 2 * PI - 0.75, taper(9), 40);
    d += arc(50, 52, 38, 38, PI / 2 + 0.55, PI / 2 + 2 * PI - 0.55, taper(10), 56);
    return `<path d="${d}" fill="${c}"/>`; },
  turning: (c) => { let d = circle(50, 72, 8.5);
    d += arc(50, 60, 20, 20, PI / 2 + 0.5, PI / 2 + 2 * PI - 0.9, taper(9), 40);
    d += arc(50, 52, 36, 36, PI / 2 + 0.2, PI / 2 + 2 * PI - 1.1, taper(10), 56);
    return `<path d="${d}" fill="${c}"/>`; },
  egg: (c) => { let d = circle(50, 79, 9);
    d += arc(50, 88 - 26 - 1.2, 20, 26, 0, 2 * PI, calli(8.5, 2.2), 48);
    d += arc(50, 88 - 44 - 1.2, 33, 44, 0, 2 * PI, calli(10, 2.2), 64);
    return `<path d="${d}" fill="${c}"/>`; },
  oneRing: (c) => { let d = circle(50, 76, 12);
    d += arc(50, 88 - 38 - 1.5, 38, 38, 0, 2 * PI, calli(13, 3), 64);
    return `<path d="${d}" fill="${c}"/>`; },
  threeCalli: (c) => { let d = circle(50, 81, 7);
    d += arc(50, 88 - 16.5 - 1, 16, 16, 0, 2 * PI, calli(7, 2), 40);
    d += arc(50, 88 - 28.5 - 1, 28, 28, 0, 2 * PI, calli(8, 2), 48);
    d += arc(50, 88 - 41 - 1, 41, 41, 0, 2 * PI, calli(9, 2), 64);
    return `<path d="${d}" fill="${c}"/>`; },
};
const cell = (name, f) => `<div class=c><div class=big><svg viewBox="0 0 100 100" width=220>${f(ink)}</svg></div>
 <div class=row><div class=ic><svg viewBox="0 0 100 100" width=46>${f(paper)}</svg></div>
 <div class=ic style="width:29px;height:29px;border-radius:7px"><svg viewBox="0 0 100 100" width=22>${f(paper)}</svg></div>
 <svg viewBox="0 0 100 100" width=16>${f(ink)}</svg><div class=ic style="background:#161412"><svg viewBox="0 0 100 100" width=46>${f('#D9A47E')}</svg></div></div><p>${name}</p></div>`;
const html = `<style>body{margin:0;background:${paper};font:14px sans-serif;display:flex;flex-wrap:wrap;gap:20px;padding:20px}
.c{width:300px;background:#fff;padding:12px;border-radius:12px}.big{display:flex;justify-content:center}.row{display:flex;gap:16px;align-items:center}
.ic{width:60px;height:60px;border-radius:14px;background:${accent};display:flex;align-items:center;justify-content:center}</style>
${Object.entries(S).map(([k, f]) => cell(k, f)).join('')}`;
await shoot([{ html, out: OUT + '/sketch-sheet4.png', width: 1000, height: 900, full: true }]);
for (const [k, f] of Object.entries(S)) await shoot([{ html: `<body style="margin:0;background:${paper}"><svg viewBox="0 0 100 100" width=400>${f(ink)}</svg>`, out: `${OUT}/sk4-${k}.png`, width: 400, height: 400 }]);
await done();
