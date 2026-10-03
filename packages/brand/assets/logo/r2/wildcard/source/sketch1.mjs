// Round 1 sketches: four candidate territories, quick geometry.
import { C, svg, render, sheetHtml, write } from './lib.mjs';
const SP = process.argv[2];
const raw = (body, fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${body.replaceAll('FG', fill).replaceAll('BG', fill === C.ink ? C.paper : C.accent)}</svg>`;

const cans = `<path fill="FG" d="M90 300L340 380L340 620L90 700Z"/><path fill="FG" d="M690 450L880 395L880 605L690 550Z"/>
<path fill="none" stroke="FG" stroke-width="20" stroke-linecap="round" d="M340 500Q515 640 690 500"/>`;
const grasp = `<path fill="FG" d="M0 0" /><g><line x1="790" y1="140" x2="300" y2="720" stroke="FG" stroke-width="150" stroke-linecap="round"/>
<circle cx="500" cy="520" r="210" fill="FG" stroke="BG" stroke-width="34"/><circle cx="640" cy="430" r="70" fill="FG" stroke="BG" stroke-width="26"/></g>`;
const boat = `<path fill="FG" d="M500 170L690 560L310 560Z"/><path fill="FG" d="M140 590L860 590L720 800L280 800Z"/>`;
const pocket = `<path fill="FG" transform="rotate(-8 520 330)" d="M400 140L660 140L660 520L400 520Z"/>
<path fill="BG" d="M190 375L810 375L810 900L190 900Z"/>
<path fill="FG" d="M215 400L785 400L785 760Q785 800 750 815L500 900L250 815Q215 800 215 760Z"/>`;
const list = [
  ['A. Tin-can telephone', 'big cup speaks, small cup listens', cans],
  ['B. The grasp', 'a small hand around one finger', grasp],
  ['C. Paper boat', 'a letter folded into a boat', boat],
  ['D. Note in a shirt pocket', 'kept close, found years later', pocket],
];
const marks = list.map(([name, note, b]) => ({ name, note, ink: raw(b, C.ink), rev: raw(b, C.paper).replaceAll(`fill="${C.paper}"`, `fill="${C.paper}"`) }));
// reversed: mark paper on accent; gaps must be accent
for (const m of marks) m.rev = m.rev; 
write(SP + '/r1.html', sheetHtml(marks.map((m, i) => ({ ...m, rev: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${list[i][2].replaceAll('FG', C.paper).replaceAll('BG', C.accent)}</svg>` })), 'Round 1: four territories'));
await render([{ file: SP + '/r1.html', out: SP + '/r1.png', width: 1300, height: 1100, fullPage: true, wait: 400 }]);
