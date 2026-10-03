import { quote2, transform } from './geom.mjs';
import { board } from './board.mjs';
import { S } from './render.mjs';
const base = (o = {}) => quote2({ r: 1, aOut: 192, aIn: -62, tip: { x: 0.95, y: -2.0 }, tipDir: -28, tipW: 0.5, notchDir: -118, hOut: 0.95, hIn: 0.55, tOut: 0.75, tIn: 0.45, cap: 'round', ...o });
const big = (o = {}) => base({ tip: { x: 2.0, y: -1.85 }, tipDir: 28, tipW: 0.46, tOut: 1.4, tIn: 1.05, hOut: 1.1, ...o });
const kid = (o = {}) => base({ tip: { x: 0.8, y: -1.85 }, tipDir: -40, tipW: 0.6, tOut: 0.6, tIn: 0.35, ...o });
const cands = [
  { name: 'R4a tapered terminals', shapes: [transform(big({ tipW: 0.16, cap: 0.6, tip: { x: 2.1, y: -1.75 }, tipDir: 34 }), { rot: 2 }), transform(kid({ tipW: 0.22, cap: 0.6, tip:{x:0.75,y:-1.95}, tipDir:-55 }), { s: 0.58, rot: -22, tx: 1.8, ty: 0.42 })] },
  { name: 'R4b cupping deeper, hand over head', shapes: [transform(big({ tipW: 0.2, cap: 0.7, tip: { x: 2.25, y: -1.45 }, tipDir: 55, tOut: 1.6, tIn: 1.2 }), { rot: 0 }), transform(kid({ tipW: 0.26, cap: 0.7 }), { s: 0.56, rot: -22, tx: 1.85, ty: 0.45 })] },
  { name: 'R4c heavier arch, kid .6', shapes: [transform(big({ tipW: 0.3, cap: 0.8, tip: { x: 2.15, y: -1.6 }, tipDir: 42, tOut: 1.5, tIn: 1.1, hOut: 1.2, aIn: -55 }), { rot: 0 }), transform(kid({ tipW: 0.3, cap: 0.8 }), { s: 0.6, rot: -20, tx: 1.95, ty: 0.4 })] },
];
await board(cands, S + '/tv/' + (process.argv[2] || 'r4') + '.png');
