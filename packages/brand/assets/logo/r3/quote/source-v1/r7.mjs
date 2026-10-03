import { build, P } from './mark.mjs';
import { board } from './board.mjs';
import { S } from './render.mjs';
const v = (patch) => { const q = structuredClone(P); for (const [k, o] of Object.entries(patch)) Object.assign(q[k], o); return q; };
const A = P, B = v({ big: { tipW: 0.3 }, kidT: { s: 0.62, rot: -22 } }), C = v({ big: { tip: { x: 2.2, y: -1.5 }, tipDir: 58 }, kidT: { s: 0.58, rot: -16, tx: 1.9 } });
await board([
  { name: 'R7a final candidate + small cut', shapes: build(A), small: build(A, true) },
  { name: 'R7b heavier tip, kid .62', shapes: build(B), small: build(B, true) },
  { name: 'R7c tighter arch, kid .58 upright', shapes: build(C), small: build(C, true) },
], S + '/tv/' + (process.argv[2] || 'r7') + '.png');
