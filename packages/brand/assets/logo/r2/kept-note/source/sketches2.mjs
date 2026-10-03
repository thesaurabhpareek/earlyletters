// Sheet 2: one-fold variants, a lying half-open note, pocket v2, tri-fold letter.
import path from 'node:path';
import { poly, sheetHTML, render, write, OUT } from './lib.mjs';
import { penStroke } from './sketches.mjs';

const G = 24;

// A: tall sheet, top folded over at an angle; flap sits on the front, separated by a crease gap.
// Sheet: x 260..740, y 140..860. Crease from (260,420) to (740,300). Flap = reflection of the part above crease.
function reflect(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], m = dx * dx + dy * dy;
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / m;
  const f = [a[0] + t * dx, a[1] + t * dy];
  return [2 * f[0] - p[0], 2 * f[1] - p[1]];
}
const ca = [260, 400], cb = [740, 300];
const flapA = [ca, cb, reflect([740, 140], ca, cb), reflect([260, 140], ca, cb)];
const bodyA = poly([[260, 400 + G], [740, 300 + G], [740, 860], [260, 860]]);
const A = bodyA + poly(flapA);
// flap overlaps body: show the flap as paper-coloured hole? Use evenodd-free approach: body minus flap outline gap.

// B: lying note, half open, seen from the front-left: base leaf flat, top leaf raised.
const B = poly([[150, 640], [700, 560], [860, 700], [310, 790]]) + poly([[150 + 10, 610], [700 + 10, 530], [560, 210], [80, 300]]);

// C: pocket v2, a crescent-mouthed pocket holding a folded note.
const C = 'M210 520Q500 600 790 520L790 760Q790 860 500 880Q210 860 210 760Z' + poly([[360, 210], [620, 180], [660, 540], [400, 570]]);

// F: note with top-right corner folded down showing the back, one handwritten loop.
const F = poly([[250, 150], [540, 150], [750, 360], [750, 850], [250, 850]]);

// G: letter in thirds, opened, perspective zig-zag.
const G3 = poly([[150, 300], [380, 220], [380, 760], [150, 840]]) + poly([[400, 220], [610, 300], [610, 840], [400, 760]]) + poly([[630, 300], [850, 220], [850, 760], [630, 840]]);

// H: tent note seen from the end (a folded note standing, the crease at the top), with handwriting inside.
const H = 'M500 170L860 800L790 800L500 290L210 800L140 800Z';

// I: a small folded note whose fold gap is a soft arc (the crease relaxes after years).
const I = 'M230 300L770 300L770 470Q500 520 230 470Z' + 'M230 505Q500 555 770 505L770 760L230 760Z';

const items = [
  { name: 'A one oblique fold', d: A, note: 'flap overlapped: needs a gap pass' },
  { name: 'B half-open note lying', d: B },
  { name: 'C pocket v2', d: C },
  { name: 'G tri-fold letter', d: G3 },
  { name: 'H tent from the end', d: H },
];
const f = write('sketches/_sheet2.html', sheetHTML(items, { title: 'kept-note sketches, sheet 2' }));
await render([{ file: f, out: path.join(OUT, 'sketches/_sheet2.png'), width: 1100, height: 400, fullPage: true, wait: 300 }]);
console.log('ok');
