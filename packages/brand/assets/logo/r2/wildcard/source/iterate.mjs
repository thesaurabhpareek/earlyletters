// Refinement rounds for the mobile. Usage: node iterate.mjs <scratch> <round>
// (Rounds r1 to r3 used an earlier quadratic-wire geometry with right-angle threads; see sketches/.)
import { C, render, sheetHtml, write } from './lib.mjs';
import { framed as f1 } from './mark.mjs';
import { framed as f2 } from './mobile.mjs';
import { rounds } from './rounds.mjs';
const [SP, ROUND] = process.argv.slice(2);
const mk = (o, fill) => { const { parts, vb } = (o.family ? f2 : f1)(o); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${parts.map((d) => `<path fill="${fill}" d="${d}"/>`).join('')}</svg>`; };
const list = rounds[ROUND];
const marks = list.map(([name, note, o]) => ({ name, note, ink: mk(o, C.ink), rev: mk(o, C.paper) }));
write(`${SP}/${ROUND}.html`, sheetHtml(marks, 'Refinement ' + ROUND));
await render([{ file: `${SP}/${ROUND}.html`, out: `${SP}/${ROUND}.png`, width: 1200, height: 900, fullPage: true, wait: 500 }]);
console.log('ok');
