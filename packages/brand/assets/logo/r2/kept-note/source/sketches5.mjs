// Sheet 5: tented note in 3/4 with a light inside; corner folded to the centre (fixed).
import path from 'node:path';
import { poly, sheetHTML, render, write, OUT } from './lib.mjs';

// TC: tented card, 3/4. Front leaf + back leaf edge, opening at the right end holds a light.
const R1 = [250, 300], R2 = [640, 230], B1 = [130, 790], B2 = [520, 760], B3 = [860, 760];
const front = poly([R1, R2, B2, B1]);
const back = poly([[R2[0] + 30, R2[1] + 4], [B3[0], B3[1] - 0], [B3[0] - 60, B3[1]], [R2[0] + 30 - 8, R2[1] + 40]]);
const light = 'M690 670m-52 0a52 52 0 1 0 104 0a52 52 0 1 0 -104 0Z';
const TC = front + back + light;
const TCn = front + back;

// CC: square note, bottom-right corner folded to the centre, gap g around the flap.
const g = 26, s2 = Math.SQRT2;
const A = 220, Bz = 780, M = 500;
const CC = poly([[A, A], [Bz, A], [Bz, M - g], [M - g, M - g], [M - g, Bz], [A, Bz]]) + poly([[Bz, M + 0], [M, Bz], [M, M]].map(([x, y]) => [x, y]));
// flap: right triangle with right angle at centre (500,500), legs to (780,500) and (500,780)
const CCb = poly([[A, A], [Bz, A], [Bz, M - g], [M - g, M - g], [M - g, Bz], [A, Bz]]) + poly([[M, M], [Bz, M], [M, Bz]]);

const items = [
  { name: 'TC tented note, a small light inside', d: TC },
  { name: 'TCn tented note alone', d: TCn },
  { name: 'CC corner folded to the centre', d: CCb },
];
const f = write('sketches/_sheet5.html', sheetHTML(items, { title: 'kept-note sketches, sheet 5' }));
await render([{ file: f, out: path.join(OUT, 'sketches/_sheet5.png'), width: 1100, height: 400, fullPage: true, wait: 300 }]);
console.log('ok');
