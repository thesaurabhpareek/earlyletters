// Exploration 3: the pinky promise. Two hooked fingers, one large, one small.
import { C, render, sheetHtml, write } from './lib.mjs';
const SP = process.argv[2];
const wrap = (b, fg, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${b.replaceAll('FG', fg).replaceAll('BG', bg)}</svg>`;
// Hook as a thick stroke path (sketch only; final will be outlined filled paths).
const hook = (d, w, gap = 0) => (gap ? `<path d="${d}" fill="none" stroke="BG" stroke-width="${w + gap * 2}" stroke-linecap="round"/>` : '') + `<path d="${d}" fill="none" stroke="FG" stroke-width="${w}" stroke-linecap="round"/>`;

// V1: big finger from the left, hooking down; small from the right, hooking up. Interlocked.
const bigA = 'M80 380 L470 380 Q600 380 600 500 Q600 600 500 600';
const smallA = 'M920 700 L620 700 Q470 700 470 580 Q470 470 560 460';
const v1 = hook(bigA, 150) + hook(smallA, 104, 22) + `<path d="M600 500 Q600 600 500 600" fill="none" stroke="BG" stroke-width="194" stroke-linecap="round" opacity="0"/>`;
// V1 with proper over-under: draw small, then the lower part of big over it with a gap
const v1b = hook(smallA, 104) + hook(bigA, 150, 22) + `<path d="M470 580 Q470 470 560 460" fill="none" stroke="BG" stroke-width="148" stroke-linecap="round"/><path d="M470 580 Q470 470 560 460" fill="none" stroke="FG" stroke-width="104" stroke-linecap="round"/>`;
// V2: diagonal composition, hooks curled tighter, like two crooked little fingers.
const bigB = 'M110 250 L420 420 Q540 490 500 590 Q470 660 390 640';
const smallB = 'M890 760 L620 610 Q520 555 545 470 Q565 410 625 420';
const v2 = hook(smallB, 100) + hook(bigB, 150, 24) + `<path d="M545 470 Q565 410 625 420" fill="none" stroke="BG" stroke-width="148" stroke-linecap="round"/><path d="M545 470 Q565 410 625 420" fill="none" stroke="FG" stroke-width="100" stroke-linecap="round"/>`;
// V3: no interlock gaps, silhouette only (small-size cut test)
const v3 = hook(smallB, 100) + hook(bigB, 150);
// V4: vertical: big comes down from top, small rises from below.
const bigC = 'M380 60 L380 470 Q380 590 500 590 Q600 590 600 500';
const smallC = 'M640 940 L640 640 Q640 540 545 540 Q470 540 470 610';
const v4 = hook(smallC, 104) + hook(bigC, 150, 22) + `<path d="M545 540 Q470 540 470 610" fill="none" stroke="BG" stroke-width="148" stroke-linecap="round"/><path d="M545 540 Q470 540 470 610" fill="none" stroke="FG" stroke-width="104" stroke-linecap="round"/>`;
const list = [
  ['P1 pinky promise, level', 'big from the left, small from the right', v1b],
  ['P2 pinky promise, diagonal', 'crooked little fingers, linked', v2],
  ['P3 diagonal, no gaps', 'small-size silhouette', v3],
  ['P4 vertical', 'big from above, small from below', v4],
];
const marks = list.map(([name, note, b]) => ({ name, note, ink: wrap(b, C.ink, C.paper), rev: wrap(b, C.paper, C.accent) }));
write(SP + '/e3.html', sheetHtml(marks, 'Exploration 3: pinky promise'));
await render([{ file: SP + '/e3.html', out: SP + '/e3.png', width: 1200, height: 900, fullPage: true, wait: 500 }]);
console.log('ok');
