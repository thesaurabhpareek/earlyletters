// Round of sketches: quick SVG (strokes allowed here, sketches only).
import { shoot, done } from './render.mjs';
const OUT = process.argv[2] || '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/years';
const ink = '#2B2722', paper = '#FBF8F3', accent = '#8A5A3B';
export const S = {
  // 1 tree rings, eccentric, seed low
  rings: (c) => `<circle cx="50" cy="62" r="7" fill="${c}"/>
    <circle cx="50" cy="56" r="20" fill="none" stroke="${c}" stroke-width="5"/>
    <circle cx="50" cy="50" r="34" fill="none" stroke="${c}" stroke-width="5"/>`,
  // 2 growing spiral from a dot
  spiral: (c) => { let d = ''; for (let t = 0; t <= 1; t += 0.01) { const a = t * Math.PI * 3.2 + 1.2; const r = 6 + t * 30; d += (t ? 'L' : 'M') + (50 + r * Math.cos(a)).toFixed(1) + ' ' + (52 + r * Math.sin(a)).toFixed(1); }
    return `<circle cx="50" cy="52" r="5" fill="${c}"/><path d="${d}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`; },
  // 3 doorframe height marks
  door: (c) => `<path d="M30 12V90" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
    <path d="M30 78h16M30 62h22M30 44h28M30 24h34" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
  // 4 letters stacking to a book
  stack: (c) => `<rect x="22" y="62" width="56" height="10" rx="3" fill="${c}"/><rect x="26" y="48" width="48" height="10" rx="3" fill="${c}" opacity=".85"/><rect x="31" y="34" width="38" height="10" rx="3" fill="${c}" opacity=".7"/><rect x="37" y="20" width="26" height="10" rx="3" fill="${c}" opacity=".55"/>`,
  // 5 nested arches toy
  arches: (c) => `<path d="M14 80a36 36 0 0 1 72 0" fill="none" stroke="${c}" stroke-width="7"/><path d="M28 80a22 22 0 0 1 44 0" fill="none" stroke="${c}" stroke-width="7"/><circle cx="50" cy="74" r="7" fill="${c}"/>`,
  // 6 nested crescents growing (small form inside larger repeated, opening right)
  nest: (c) => `<path d="M58 30a22 22 0 1 0 0 44a28 28 0 0 1 0-44z" fill="${c}"/>
     <path d="M70 14a38 38 0 1 0 0 76" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
  // 7 sapling: a seed and one rising line with curl
  sapling: (c) => `<circle cx="50" cy="82" r="7" fill="${c}"/><path d="M50 75C50 55 44 40 56 24" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/><path d="M52 44c8-8 18-8 22-4c-6 8-16 8-22 4z" fill="${c}"/>`,
};
const cell = (name, f) => `<div class=c><div class=big><svg viewBox="0 0 100 100" width=220>${f(ink)}</svg></div>
 <div class=row><div class=ic><svg viewBox="0 0 100 100" width=60>${f(paper)}</svg></div>
 <div class=ic style="width:29px;height:29px;border-radius:7px"><svg viewBox="0 0 100 100" width=22>${f(paper)}</svg></div>
 <svg viewBox="0 0 100 100" width=16>${f(ink)}</svg></div><p>${name}</p></div>`;
const html = `<style>body{margin:0;background:${paper};font:14px sans-serif;display:flex;flex-wrap:wrap;gap:20px;padding:20px}
.c{width:300px;background:#fff;padding:12px;border-radius:12px}.big{display:flex;justify-content:center}.row{display:flex;gap:16px;align-items:center}
.ic{width:60px;height:60px;border-radius:14px;background:${accent};display:flex;align-items:center;justify-content:center}</style>
${Object.entries(S).map(([k, f]) => cell(k, f)).join('')}`;
await shoot([{ html, out: OUT + '/sketch-sheet.png', width: 1320, height: 900, full: true }]);
// individual PNGs
for (const [k, f] of Object.entries(S)) await shoot([{ html: `<body style="margin:0;background:${paper}"><svg viewBox="0 0 100 100" width=400>${f(ink)}</svg>`, out: `${OUT}/sk-${k}.png`, width: 400, height: 400 }]);
await done();
