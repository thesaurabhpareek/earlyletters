// Sheet 6: the note kept in a shirt pocket, over the heart.
import path from 'node:path';
import { poly, sheetHTML, render, write, OUT } from './lib.mjs';

// shirt pocket: soft pentagon, taller than wide, flat top.
function pocket(x0, x1, top, side, tip, rad = 40) {
  const cx = (x0 + x1) / 2;
  return `M${x0} ${top}L${x1} ${top}L${x1} ${side}Q${x1} ${side + rad} ${x1 - rad * 1.2} ${side + rad * 0.6}L${cx + 40} ${tip - 10}Q${cx} ${tip + 8} ${cx - 40} ${tip - 10}L${x0 + rad * 1.2} ${side + rad * 0.6}Q${x0} ${side + rad} ${x0} ${side}Z`;
}
// rotate points around c
const rot = (pts, a, c) => pts.map(([x, y]) => { const s = Math.sin(a), k = Math.cos(a); x -= c[0]; y -= c[1]; return [c[0] + x * k - y * s, c[1] + x * s + y * k]; });

const g = 28;
const P1 = pocket(250, 750, 430, 760, 880);
const note1 = poly(rot([[330, 110], [600, 110], [600, 430 - g], [330, 430 - g]], -0.12, [460, 400]));
// note clipped flat at the hem: compute polygon with bottom at hem - g
const n2pts = [[340, 150], [610, 120], [640, 430 - g], [370, 430 - g]];
const note2 = poly(n2pts);
// note with folded corner at top-right: shows it is folded paper
const note3 = poly([[350, 160], [540, 140], [612, 200], [640, 430 - g], [380, 430 - g]]) ;
const note3flap = '';

// variant: pocket with rounded bottom (not pointed)
const P2 = 'M260 430L740 430L740 740Q740 880 500 880Q260 880 260 740Z';

// variant: narrow pocket, note tall with crease gap (folded in half, slightly open)
const P3 = pocket(280, 720, 470, 790, 890, 36);
const note4 = poly([[360, 160], [500, 130], [520, 470 - g], [380, 470 - g]]) + poly([[500 + 22, 140], [610, 175], [600, 470 - g], [520 + 20, 470 - g]]);

const items = [
  { name: 'PK1 pointed shirt pocket, slanted note', d: P1 + note2 },
  { name: 'PK2 rounded pocket, note', d: P2 + note2 },
  { name: 'PK3 pocket, note folded once and slightly open', d: P3 + note4 },
];
const f = write('sketches/_sheet6.html', sheetHTML(items, { title: 'kept-note sketches, sheet 6' }));
await render([{ file: f, out: path.join(OUT, 'sketches/_sheet6.png'), width: 1100, height: 400, fullPage: true, wait: 300 }]);
console.log('ok');
