// Sheet 4: corner folded to the centre, origata wrapper, photo-corner note, soft asymmetric tent.
import path from 'node:path';
import { poly, sheetHTML, render, write, OUT } from './lib.mjs';

const g = 24, h = g / Math.SQRT2;
// CC: square note, one corner folded all the way to the centre.
const CC = poly([[220, 220], [780, 220], [780, 500 - h * 2], [500 - h * 2, 780], [220, 780]]) + poly([[780, 500 + 0], [500, 780], [500, 500]].map(([x, y]) => [x + 0, y + 0]));
// make the flap sit inside with a gap from the crease
const CCb = poly([[220, 220], [780, 220], [780, 470], [470, 780], [220, 780]]) + poly([[780 - 2, 512], [512, 780 - 2], [512, 512]]);

// ORIGATA: wrapper with a diagonal overlapping front flap and a turned-back tip.
const ORI = poly([[300, 150], [470, 150], [600, 850], [300, 850]]) + poly([[470 + g, 150], [700, 150], [700, 850], [600 + g, 850]]);

// PC: a note held by an album photo corner.
const PCnote = poly([[240, 230], [740, 190], [770, 760], [270, 800]]);
const PC = poly([[240, 230], [740, 190], [770, 760], [270, 800]]);

// T2: soft asymmetric tent, a note standing folded, with a small light underneath.
const T2 = 'M455 200C478 162 522 162 545 200L850 780L760 780L500 300L270 780L180 780Z' + 'M500 655m-58 0a58 58 0 1 0 116 0a58 58 0 1 0 -116 0Z';

// CC3: the folded-to-centre note where the flap tip carries a small round: the light inside.
const items = [
  { name: 'CC a corner folded to the centre', d: CCb },
  { name: 'ORI origata wrapper', d: ORI },
  { name: 'T2 soft tent + light', d: T2 },
];
const f = write('sketches/_sheet4.html', sheetHTML(items, { title: 'kept-note sketches, sheet 4' }));
await render([{ file: f, out: path.join(OUT, 'sketches/_sheet4.png'), width: 1100, height: 400, fullPage: true, wait: 300 }]);
console.log('ok');
