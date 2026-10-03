// Exploration 4: pinky promise drawn properly interlocked, plus lamp and door rethinks.
import { C, render, sheetHtml, write } from './lib.mjs';
const SP = process.argv[2];
const wrap = (b, fg, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${b.replaceAll('FG', fg).replaceAll('BG', bg)}</svg>`;
const st = (d, w, col = 'FG') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
const over = (d, w, g) => st(d, w + 2 * g, 'BG') + st(d, w);
// Interlocked hooks. A (big) from upper left, curls down on the right. B (small) from lower right, curls up on the left.
function pinky(rot = 0, gap = 26) {
  const A = 'M70 360 L520 360 A115 115 0 0 1 520 590 L470 590';
  const Aback = 'M520 360 A115 115 0 0 1 635 475';
  const B = 'M930 670 L505 670 A92 92 0 0 1 505 486 L560 486';
  const Bfront = 'M413 578 A92 92 0 0 1 505 486 L560 486';
  // order: A full, B full over A, then A's right arc back over B (true interlock)
  return `<g transform="rotate(${rot} 500 515)">${st(A, 120)}${over(B, 86, gap)}${over('M635 475 A115 115 0 0 1 520 590 L470 590', 120, gap)}</g>`;
}
// Lamp: a classic table lamp, shade and a pool of light shaped like a page.
const lamp = `<path fill="FG" d="M360 170 L640 170 L740 430 L260 430 Z"/><rect x="475" y="430" width="50" height="300" fill="FG"/><path fill="FG" d="M330 790 Q330 730 400 730 L600 730 Q670 730 670 790 Z"/>`;
// Door ajar from the hall: a tall dark doorway on paper; the door open a crack shows the nightlight.
const door = `<path fill="FG" d="M300 120 H700 V880 H300 Z M560 200 L620 170 L620 830 L560 800 Z" fill-rule="evenodd"/><circle cx="420" cy="760" r="40" fill="BG"/>`;
const list = [
  ['Pinky promise, level', 'big hook over small hook', pinky(0)],
  ['Pinky promise, tilted', 'rotated -20', pinky(-20)],
  ['Pinky promise, no gap', '16px cut', pinky(-20, 0)],
  ['Table lamp', 'the light on at bedtime', lamp],
  ['Door from the hall', 'the room, the door ajar', door],
];
const marks = list.map(([name, note, b]) => ({ name, note, ink: wrap(b, C.ink, C.paper), rev: wrap(b, C.paper, C.accent) }));
write(SP + '/e4.html', sheetHtml(marks, 'Exploration 4'));
await render([{ file: SP + '/e4.html', out: SP + '/e4.png', width: 1200, height: 900, fullPage: true, wait: 500 }]);
console.log('ok');
