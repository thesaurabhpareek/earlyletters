// Sheet 7: better drawings of the three survivors plus the hand-folded note.
import path from 'node:path';
import { poly, sheetHTML, render, write, OUT } from './lib.mjs';

// T3: tent note from the end; soft rounded crease, leaves thin at the feet, slight paper bow; light inside.
const T3 = 'M470 175C485 152 515 152 530 175C640 360 760 590 868 790L800 800C700 600 590 395 500 250C410 395 300 600 200 800L132 790C240 590 360 360 470 175Z'
  + 'M500 700m-62 0a62 62 0 1 0 124 0a62 62 0 1 0 -124 0Z';
// T4: tent with asymmetric leaves (hand-folded), light set low and slightly off-centre toward the longer leaf.
const T4 = 'M440 190C455 166 485 166 500 190C620 390 735 600 840 800L770 808C672 610 566 410 470 262C400 380 330 530 260 680L196 668C268 512 350 340 440 190Z'
  + 'M540 708m-58 0a58 58 0 1 0 116 0a58 58 0 1 0 -116 0Z';
// PK4: minimal soft pocket, folded note leaning in it, leaves apart.
const PK4 = 'M230 470L770 470L770 640C770 790 650 870 500 870C350 870 230 790 230 640Z'
  + poly([[330, 180], [520, 140], [548, 440], [356, 440]]) + poly([[548, 158], [650, 196], [640, 440], [576, 440]]);
// HF: hand-folded note, the front leaf skewed against the back leaf.
const back = poly([[250, 200], [760, 200], [760, 820], [250, 820]]);
const HF = back;

const items = [
  { name: 'T3 tent note, soft crease, a light inside', d: T3 },
  { name: 'T4 asymmetric hand-folded tent', d: T4 },
  { name: 'PK4 soft pocket, note folded once', d: PK4 },
];
const f = write('sketches/_sheet7.html', sheetHTML(items, { title: 'kept-note sketches, sheet 7' }));
await render([{ file: f, out: path.join(OUT, 'sketches/_sheet7.png'), width: 1100, height: 400, fullPage: true, wait: 300 }]);
console.log('ok');
