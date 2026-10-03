// Exploration 7: Calder-correct mobiles without right angles; two-level (family) version.
import { C, render, sheetHtml, write } from './lib.mjs';
import { taper } from './stroke.mjs';
const SP = process.argv[2];
const wrap = (b, fg, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${b.replaceAll('FG', fg).replaceAll('BG', bg)}</svg>`;
const quad = (p0, c, p1) => (t) => { const u = 1 - t; return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y }; };
const wire = (a, c, b, w0, w1) => `<path fill="FG" d="${taper(quad(a, c, b), (t) => w0 + (w1 - w0) * t, { knots: 10 })}"/>`;
const line = (x, y0, y1, w) => `<rect x="${x - w / 2}" y="${y0}" width="${w}" height="${y1 - y0}" rx="${w / 2}" fill="FG"/>`;
const disc = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="FG"/>`;

// 1 Two-level family mobile.
const fam = line(420, 60, 250, 18) + wire({ x: 170, y: 330 }, { x: 330, y: 160 }, { x: 640, y: 250 }, 34, 26) + wire({ x: 640, y: 250 }, { x: 700, y: 280 }, { x: 760, y: 300 }, 26, 24)
  + line(170, 320, 420, 18) + disc(170, 520, 130)
  + line(700, 250, 470, 16) + wire({ x: 560, y: 520 }, { x: 680, y: 430 }, { x: 900, y: 500 }, 26, 20) + line(560, 510, 600, 14) + disc(560, 670, 80) + line(900, 490, 680, 14) + disc(900, 730, 52);
// 2 Two-piece, wire as a deep arc whose tips point down into the pieces (no right angles), short suspension.
const arc = line(470, 150, 300, 18) + `<path fill="FG" d="${taper(quad({ x: 200, y: 520 }, { x: 420, y: 80 }, { x: 830, y: 470 }), (t) => 24 + 14 * Math.sin(Math.PI * Math.min(1, t * 1.4)), { knots: 14 })}"/>` + disc(200, 640, 140) + disc(830, 540, 72);
// 3 Same, asymmetric: the small rides higher, the big lower.
const arc2 = line(440, 120, 270, 18) + `<path fill="FG" d="${taper(quad({ x: 200, y: 540 }, { x: 400, y: 70 }, { x: 840, y: 330 }), (t) => 24 + 14 * Math.sin(Math.PI * Math.min(1, t * 1.4)), { knots: 14 })}"/>` + disc(200, 670, 145) + disc(840, 395, 68);
const list = [
  ['Family mobile', 'two levels: big, medium, small', fam],
  ['Arc, tips into pieces', 'no right angles', arc],
  ['Arc, small rides high', 'no right angles', arc2],
];
const marks = list.map(([name, note, b]) => ({ name, note, ink: wrap(b, C.ink, C.paper), rev: wrap(b, C.paper, C.accent) }));
write(SP + '/e7.html', sheetHtml(marks, 'Exploration 7'));
await render([{ file: SP + '/e7.html', out: SP + '/e7.png', width: 1200, height: 900, fullPage: true, wait: 500 }]);
console.log('ok');
