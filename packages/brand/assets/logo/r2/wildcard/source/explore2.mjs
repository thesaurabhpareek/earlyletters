// Exploration 2: second pass on the territories, plus new ones.
import { C, render, sheetHtml, write } from './lib.mjs';
import { taper, cubic, crPath } from './stroke.mjs';
const SP = process.argv[2];
const wrap = (b, fg, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${b.replaceAll('FG', fg).replaceAll('BG', bg)}</svg>`;
const poly = (pts) => 'M' + pts.map((p) => p.join(' ')).join('L') + 'Z';

// A grasp v2: finger from the left, small fist with three knuckles curled over it.
const graspB = `<rect x="40" y="430" width="700" height="170" rx="85" fill="FG"/>
<path fill="FG" stroke="BG" stroke-width="30" d="M560 470 Q560 330 640 330 Q690 330 700 380 Q720 330 770 340 Q820 350 820 410 Q860 380 890 420 Q920 470 900 560 Q880 700 740 720 Q600 730 560 620 Z"/>`;
// B forehead to forehead: a large and a small round form leaning in until they touch.
const fore = `<ellipse cx="400" cy="520" rx="250" ry="290" transform="rotate(18 400 520)" fill="FG"/><ellipse cx="740" cy="610" rx="150" ry="175" transform="rotate(-22 740 610)" fill="FG"/>`;
// C lit doorway: the light, the door edge, the spill.
const doorway = `<path fill="FG" d="${poly([[380, 110], [470, 110], [470, 640], [600, 900], [330, 900], [380, 640]])}"/><path fill="FG" d="${poly([[520, 110], [700, 60], [700, 760], [520, 640]])}"/>`;
// D memory jar: a jar with three kept lights.
const jar = `<path fill="FG" d="M330 160h340v80h-30v40q140 50 140 200v330q0 70-70 70H290q-70 0-70-70V480q0-150 140-200v-40h-30z"/>
<circle cx="430" cy="610" r="55" fill="BG"/><circle cx="590" cy="520" r="38" fill="BG"/><circle cx="560" cy="720" r="28" fill="BG"/>`;
// E music box key: wind it, the song plays again.
const key = `<circle cx="340" cy="330" r="170" fill="FG"/><circle cx="660" cy="330" r="170" fill="FG"/><circle cx="340" cy="330" r="70" fill="BG"/><circle cx="660" cy="330" r="70" fill="BG"/><rect x="450" y="380" width="100" height="520" rx="30" fill="FG"/>`;
// F lamp over a cot: a lamp leaning over a small round sleeper.
const lamp = `<path fill="FG" d="${taper(cubic({ x: 250, y: 900 }, { x: 250, y: 300 }, { x: 330, y: 160 }, { x: 600, y: 200 }), () => 50, { knots: 12 })}"/>
<path fill="FG" d="M470 250 L760 250 L820 460 L410 460 Z"/><circle cx="615" cy="760" r="120" fill="FG"/>`;
const list = [
  ['A grasp v2', 'three knuckles over one finger', graspB],
  ['B forehead to forehead', 'big and small, touching', fore],
  ['C lit doorway', 'door edge, gap of light, spill', doorway],
  ['D memory jar', 'small lights kept', jar],
  ['E music box key', 'wind it, it plays again', key],
  ['F lamp over a cot', 'light bent over a small one', lamp],
];
const marks = list.map(([name, note, b]) => ({ name, note, ink: wrap(b, C.ink, C.paper), rev: wrap(b, C.paper, C.accent) }));
write(SP + '/e2.html', sheetHtml(marks, 'Exploration 2'));
await render([{ file: SP + '/e2.html', out: SP + '/e2.png', width: 1200, height: 900, fullPage: true, wait: 500 }]);
console.log('ok');
