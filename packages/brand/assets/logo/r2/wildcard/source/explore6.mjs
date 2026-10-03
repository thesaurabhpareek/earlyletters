// Exploration 6: the cot mobile, made Calder-correct (off-centre pivot, curved arm), several piece pairs.
import { C, render, sheetHtml, write } from './lib.mjs';
const SP = process.argv[2];
const wrap = (b, fg, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${b.replaceAll('FG', fg).replaceAll('BG', bg)}</svg>`;
const st = (d, w) => `<path d="${d}" fill="none" stroke="FG" stroke-width="${w}" stroke-linecap="round"/>`;
// Lever: big mass M at distance a, small mass m at distance b with M*a = m*b. Pivot off-centre, near the big piece.
function mob({ big, small, arm = 34, thread = 18, hook = true, tilt = 0 }) {
  const A = { x: 210, y: 420 }, B = { x: 850, y: 330 }, P = { x: 400, y: 330 };
  const armD = `M${A.x} ${A.y} Q${P.x - 40} ${P.y - 60} ${P.x + 120} ${P.y - 40} T${B.x} ${B.y}`;
  return `<g transform="rotate(${tilt} 500 500)">${hook ? st(`M${P.x + 60} 90 L${P.x + 60} ${P.y - 50}`, thread) : ''}${st(armD, arm)}${big(A)}${small(B)}</g>`;
}
const disc = (r, drop = 0, th = 18) => (p) => `${drop ? st(`M${p.x} ${p.y} L${p.x} ${p.y + drop}`, th) : ''}<circle cx="${p.x}" cy="${p.y + drop + r}" r="${r}" fill="FG"/>`;
const page = (w, h, drop = 0) => (p) => `${drop ? st(`M${p.x} ${p.y} L${p.x} ${p.y + drop}`, 18) : ''}<rect x="${p.x - w / 2}" y="${p.y + drop}" width="${w}" height="${h}" rx="${w * 0.12}" fill="FG"/>`;
const leaf = (s, drop = 0) => (p) => `${drop ? st(`M${p.x} ${p.y} L${p.x} ${p.y + drop}`, 18) : ''}<path fill="FG" d="M${p.x} ${p.y + drop} C${p.x + s} ${p.y + drop + s * 0.5} ${p.x + s * 0.7} ${p.y + drop + s * 1.6} ${p.x} ${p.y + drop + s * 1.9} C${p.x - s * 0.7} ${p.y + drop + s * 1.6} ${p.x - s} ${p.y + drop + s * 0.5} ${p.x} ${p.y + drop}Z"/>`;
const list = [
  ['Mobile: discs', 'big and small disc, threads', mob({ big: disc(170, 80), small: disc(75, 170) })],
  ['Mobile: discs fixed', 'no threads, pieces on the wire', mob({ big: disc(170, -30), small: disc(80, -20), hook: true })],
  ['Mobile: page and disc', 'a letter and a small one', mob({ big: page(250, 330, 60), small: disc(75, 170) })],
  ['Mobile: leaf and disc', 'softer, Calder petal', mob({ big: leaf(170, 40), small: disc(75, 170) })],
  ['Mobile: tilt', 'tilted, discs', mob({ big: disc(170, 60), small: disc(75, 150), tilt: -6 })],
];
const marks = list.map(([name, note, b]) => ({ name, note, ink: wrap(b, C.ink, C.paper), rev: wrap(b, C.paper, C.accent) }));
write(SP + '/e6.html', sheetHtml(marks, 'Exploration 6: mobile'));
await render([{ file: SP + '/e6.html', out: SP + '/e6.png', width: 1200, height: 900, fullPage: true, wait: 500 }]);
console.log('ok');
