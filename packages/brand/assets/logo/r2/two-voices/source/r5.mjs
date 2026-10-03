import { quote2, transform } from './geom.mjs';
import { board } from './board.mjs';
import { S } from './render.mjs';
const base = (o = {}) => quote2({ r: 1, aOut: 192, aIn: -62, tip: { x: 0.95, y: -2.0 }, tipDir: -28, tipW: 0.5, notchDir: -118, hOut: 0.95, hIn: 0.55, tOut: 0.75, tIn: 0.45, cap: 'round', ...o });
const big = (o = {}) => base({ tip: { x: 2.25, y: -1.45 }, tipDir: 55, tipW: 0.26, cap: 0.75, tOut: 1.6, tIn: 1.2, hOut: 1.15, aIn: -58, ...o });
const kid = (o = {}) => base({ tip: { x: 0.8, y: -1.85 }, tipDir: -40, tipW: 0.3, cap: 0.75, tOut: 0.6, tIn: 0.35, ...o });
const cands = [
  { name: 'R5a balanced: tip .26, kid .6 tucked', shapes: [transform(big(), {}), transform(kid(), { s: 0.6, rot: -24, tx: 1.85, ty: 0.4 })] },
  { name: 'R5b slimmer ball r.9 feel (big scaled tail)', shapes: [transform(big({ tip: { x: 2.4, y: -1.6 }, tOut: 1.8, tIn: 1.35, hOut: 1.3, tipW: 0.28 }), {}), transform(kid(), { s: 0.62, rot: -26, tx: 2.0, ty: 0.38 })] },
  { name: 'R5c gaze: tips meet', shapes: [transform(big({ tip: { x: 2.3, y: -1.25 }, tipDir: 70, tOut: 1.7, tIn: 1.3 }), {}), transform(kid({ tip: { x: 0.5, y: -2.0 }, tipDir: -75, tOut: 0.7 }), { s: 0.6, rot: -12, tx: 2.0, ty: 0.4 })] },
];
await board(cands, S + '/tv/' + (process.argv[2] || 'r5') + '.png');
