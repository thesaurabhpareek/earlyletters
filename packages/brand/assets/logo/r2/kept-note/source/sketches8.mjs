// Sheet 8: wide paper roof over a light; a kept note that still holds its fold (front, slightly above).
import path from 'node:path';
import { poly, sheetHTML, render, write, OUT } from './lib.mjs';

// R1: wide paper roof (note open to ~110 degrees), soft ridge, tapered leaves, light below.
const R1 = 'M462 248C482 226 518 226 538 248L880 600L842 640L500 300L158 640L120 600Z'
  + 'M500 590m-80 0a80 80 0 1 0 160 0a80 80 0 1 0 -160 0Z';
// R2: roof leaves as paper planes in slight perspective (front leaf wider), light below and slightly forward.
const R2 = 'M500 230L880 610L800 640L500 330Z' + 'M500 230L120 590L170 610L500 300Z' + 'M520 640m-74 0a74 74 0 1 0 148 0a74 74 0 1 0 -148 0Z';
// KF: kept fold, seen from the front-above: two leaves of a note opened to ~150 deg, the crease still there.
const g = 24;
const KF = poly([[200, 240], [500 - g / 2, 200], [500 - g / 2, 800], [200, 760]]) + poly([[500 + g / 2, 200], [800, 250], [800, 770], [500 + g / 2, 800]]);
const items = [
  { name: 'R1 a folded note as a roof, a light kept under it', d: R1 },
  { name: 'R2 roof in slight perspective', d: R2 },
];
const f = write('sketches/_sheet8.html', sheetHTML(items, { title: 'kept-note sketches, sheet 8' }));
await render([{ file: f, out: path.join(OUT, 'sketches/_sheet8.png'), width: 1100, height: 400, fullPage: true, wait: 300 }]);
console.log('ok');
