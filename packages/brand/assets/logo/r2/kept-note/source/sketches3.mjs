// Sheet 3: note ajar, tuck-fold note, tent with a small light, little booklet.
import path from 'node:path';
import { poly, sheetHTML, render, write, OUT } from './lib.mjs';
import { penStroke } from './sketches.mjs';

const g = 26;
// AJ1: folded note standing slightly open, cover toward the viewer.
const inner = poly([[540 + g, 205], [760, 240], [760, 760], [540 + g, 795]]);
const cover = poly([[270, 180], [540, 120], [540, 880], [270, 820]]);
const AJ1 = cover + inner;
// AJ2: same, with a small handwritten curl cut into the visible inside.
const curl = penStroke([600, 470], [640, 380], [720, 380], [690, 470], 26, 34, 18) + penStroke([690, 470], [670, 530], [620, 560], [700, 580], 18, 30, 16);

// TUCK: the schoolyard note: square folded, triangle flap tucked.
const TUCK = poly([[230, 270], [770, 270], [770, 780], [230, 780]]);
const tuckFlap = poly([[230 + 40, 270 + 40], [770 - 40, 270 + 40], [500, 600]]);

// TENT+DOT: a note folded in half, standing, keeping a small light.
const TENT = 'M500 150C520 150 535 160 545 177L860 760L770 760L500 262L230 760L140 760L455 177C465 160 480 150 500 150Z' + 'M500 640m-70 0a70 70 0 1 0 140 0a70 70 0 1 0 -140 0Z';

// BOOKLET: note folded twice into a little book, open, from above.
const BOOK = 'M500 330C420 270 290 250 150 270L150 760C290 740 420 760 500 820Z' + 'M520 330C600 270 730 250 870 270L870 760C730 740 600 760 520 820Z';

const items = [
  { name: 'AJ1 note ajar', d: AJ1 },
  { name: 'AJ2 note ajar, one curl inside', d: [cover, inner + curl].join(''), note: 'curl overlaps: see whether evenodd cut works' },
  { name: 'TENT a folded note keeping a small light', d: TENT },
  { name: 'BOOKLET folded twice into a little book', d: BOOK },
];
const f = write('sketches/_sheet3.html', sheetHTML(items, { title: 'kept-note sketches, sheet 3' }).replaceAll('<path ', '<path fill-rule="evenodd" '));
await render([{ file: f, out: path.join(OUT, 'sketches/_sheet3.png'), width: 1100, height: 400, fullPage: true, wait: 300 }]);
console.log('ok');
