// Exploration 1: six candidate territories as quick geometry, one contact sheet.
import { C, render, sheetHtml, write } from './lib.mjs';
import { taper, cubic } from './stroke.mjs';
const SP = process.argv[2];
const wrap = (b, fg, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${b.replaceAll('FG', fg).replaceAll('BG', bg)}</svg>`;
const poly = (pts) => 'M' + pts.map((p) => p.join(' ')).join('L') + 'Z';

// 1 Door left ajar: the gap of hallway light, then the spill on the floor.
const door = `<path fill="FG" d="${poly([[470, 120], [540, 120], [560, 600], [330, 880], [140, 880], [455, 600]])}"/>`;
// 2 First curl: tapered spiral, thick at the root, fine at the tip.
const spiral = (t) => { const th = -Math.PI * 0.55 + t * Math.PI * 2.35; const rr = 330 * (1 - 0.62 * t); return { x: 520 + rr * Math.cos(th) * 0.95, y: 520 + rr * Math.sin(th) }; };
const curl = `<path fill="FG" d="${taper(spiral, (t) => 150 * (1 - t) ** 0.9 + 10, { knots: 26, capEnd: 'round' })}"/>`;
// 3 The grasp: a long finger and a small fist curled around its tip.
const grasp = `<rect x="80" y="420" width="640" height="150" rx="75" fill="FG"/><circle cx="700" cy="500" r="190" fill="FG" stroke="BG" stroke-width="36"/>`;
// 4 Crib mobile (Calder): a bent arm, a large and a small disc.
const mob = `<path fill="FG" d="${taper(cubic({ x: 170, y: 420 }, { x: 380, y: 300 }, { x: 640, y: 300 }, { x: 860, y: 380 }), () => 30, { knots: 10 })}"/>
<rect x="485" y="120" width="30" height="230" fill="FG"/><rect x="185" y="420" width="16" height="170" fill="FG"/><rect x="842" y="380" width="16" height="230" fill="FG"/>
<circle cx="193" cy="680" r="140" fill="FG"/><circle cx="850" cy="660" r="70" fill="FG"/>`;
// 5 One lit window at night: a single warm pane, a lamp glow dot.
const win = `<rect x="260" y="200" width="480" height="600" rx="40" fill="FG"/><circle cx="500" cy="560" r="70" fill="BG"/>`;
// 6 The whisper: a large cupped form leaning to a small round listener.
const whisper = `<path fill="FG" d="${taper(cubic({ x: 300, y: 150 }, { x: 760, y: 200 }, { x: 800, y: 700 }, { x: 420, y: 860 }), (t) => 40 + 140 * Math.sin(Math.PI * t), { knots: 20 })}"/><circle cx="430" cy="520" r="120" fill="FG"/>`;
const list = [
  ['1 Door left ajar', 'hallway light through the gap, spilling on the floor', door],
  ['2 First curl', 'the kept lock of hair; also a curl of ink', curl],
  ['3 The grasp', 'a small fist around one finger', grasp],
  ['4 Crib mobile', 'big and small, balanced, turning above the cot', mob],
  ['5 The lit window', 'the one light on at 2am', win],
  ['6 The whisper', 'a big cupped form leaning to a small one', whisper],
];
const marks = list.map(([name, note, b]) => ({ name, note, ink: wrap(b, C.ink, C.paper), rev: wrap(b, C.paper, C.accent) }));
write(SP + '/e1.html', sheetHtml(marks, 'Exploration 1'));
await render([{ file: SP + '/e1.html', out: SP + '/e1.png', width: 1200, height: 900, fullPage: true, wait: 500 }]);
console.log('ok');
