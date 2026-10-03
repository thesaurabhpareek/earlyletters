// Round of first sketches for the kept-note territory. Rendered to sketches/sheet-1.png.
import path from 'node:path';
import { poly, sheetHTML, render, write, OUT } from './lib.mjs';

// Sampled pen stroke along a cubic, width tapering w0 -> wm -> w1, returned as a filled polygon.
export function penStroke(p0, c1, c2, p1, w0, wm, w1, n = 40) {
  const pt = (t) => {
    const u = 1 - t;
    return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * p1[k]);
  };
  const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = pt(Math.max(0, t - 0.001)), b = pt(Math.min(1, t + 0.001)), p = pt(t);
    let dx = b[0] - a[0], dy = b[1] - a[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    const w = (t < 0.5 ? w0 + (wm - w0) * (t / 0.5) : wm + (w1 - wm) * ((t - 0.5) / 0.5)) / 2;
    L.push([p[0] - dy * w, p[1] + dx * w]); R.push([p[0] + dy * w, p[1] - dx * w]);
  }
  return poly([...L, ...R.reverse()]);
}

const G = 22; // crease gap

// S1: card folded once, standing open, crease toward viewer.
const s1 = [
  poly([[170, 270], [500 - G / 2, 190], [500 - G / 2, 810], [170, 730]]),
  poly([[500 + G / 2, 190], [830, 270], [830, 730], [500 + G / 2, 810]]),
].join('');

// S2: dog-eared note with one handwritten line.
const s2 = [
  poly([[230, 160], [600, 160], [770, 330], [770, 840], [230, 840]]),
].join('');
const s2fold = poly([[600 + 14, 160 + 30], [770 - 30, 330 - 14], [614, 316]]);

// S3: a note peeking out of a pocket.
const pocket = 'M190 470L810 470L810 700C810 800 700 870 500 900C300 870 190 800 190 700Z';
const noteUp = poly([[330, 140], [640, 100], [680, 440], [370, 440]]);
const s3 = noteUp + pocket;

// S4: top corners folded to the centre: a shelter.
const s4 = [
  poly([[260 , 470], [500 - 14, 230 + 0], [500 - 14, 470]]),
  poly([[500 + 14, 230], [740, 470], [500 + 14, 470]]),
  poly([[260, 500], [740, 500], [740, 830], [260, 830]]),
].join('');

// S5: folded note, slightly opened, inside shows one line.
const s5 = [
  poly([[260, 170], [760, 210], [760, 850], [260, 830]]), // back leaf
].join('');
const s5front = poly([[260, 170], [600, 260], [600, 880], [260, 830]]);

// S6: paper halves curling into a heart in negative space (front view of a half-open fold).
const s6 =
  'M500 860C430 760 260 650 230 470C210 350 300 260 400 300C330 300 290 380 310 470C340 610 450 720 500 790Z' +
  'M500 860C570 760 740 650 770 470C790 350 700 260 600 300C670 300 710 380 690 470C660 610 550 720 500 790Z';

// S7: the schoolyard tuck-fold note: square with a triangular flap tucked in.
const s7 = [
  poly([[220, 300], [780, 300], [780, 760], [220, 760]]),
];
const s7flap = poly([[260, 300 + 40], [740, 300 + 40], [500, 600]]);

const items = [
  { name: 'S1 standing card', d: s1, note: 'folded once, open, crease toward you' },
  { name: 'S2 dog-ear + line', d: [{ d: s2, fill: 'currentColor' }].map((x) => x.d).join('') + '', note: 'corner turned, one handwritten line' },
  { name: 'S3 note in a pocket', d: s3, note: 'the coat pocket, literally' },
  { name: 'S4 shelter fold', d: s4, note: 'top corners folded to the centre' },
  { name: 'S6 heart in the fold', d: s6, note: 'two curled halves, heart in the space between' },
];
export { s1, s2, s2fold, s3, s4, s5, s5front, s6, s7, s7flap };

if (process.argv[1].endsWith('sketches.mjs')) {
  const f = write('sketches/_sheet1.html', sheetHTML(items, { title: 'kept-note sketches, sheet 1' }));
  await render([{ file: f, out: path.join(OUT, 'sketches/_sheet1.png'), width: 1100, height: 400, fullPage: true, wait: 300 }]);
  console.log('ok');
}
