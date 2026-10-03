import { quote2, transform } from './geom.mjs';
import { board } from './board.mjs';
import { S } from './render.mjs';
const base = (o = {}) => quote2({ r: 1, aOut: 192, aIn: -62, tip: { x: 0.95, y: -2.0 }, tipDir: -28, tipW: 0.5, notchDir: -118, hOut: 0.95, hIn: 0.55, tOut: 0.75, tIn: 0.45, cap: 'round', ...o });
const big = (o = {}) => base({ tip: { x: 2.28, y: -1.38 }, tipDir: 62, tipW: 0.27, cap: 0.75, tOut: 1.65, tIn: 1.25, hOut: 1.15, aIn: -58, ...o });
const kid = (o = {}) => base({ tip: { x: 0.65, y: -1.95 }, tipDir: -55, tipW: 0.3, cap: 0.75, tOut: 0.65, tIn: 0.38, ...o });
const cands = [
  { name: 'R6a', shapes: [transform(big(), {}), transform(kid(), { s: 0.6, rot: -20, tx: 1.92, ty: 0.4 })] },
  { name: 'R6b kid .64, wider gap', shapes: [transform(big({ tip: { x: 2.42, y: -1.42 }, tOut: 1.75, tIn: 1.35 }), {}), transform(kid(), { s: 0.64, rot: -20, tx: 2.08, ty: 0.36 })] },
  { name: 'R6c whole mark tilted -6 (more upright parent)', shapes: [transform(big(), { rot: -6 }), transform(kid(), { s: 0.6, rot: -26, tx: 1.98, ty: 0.18 })] },
];
await board(cands, S + '/tv/' + (process.argv[2] || 'r6') + '.png');
