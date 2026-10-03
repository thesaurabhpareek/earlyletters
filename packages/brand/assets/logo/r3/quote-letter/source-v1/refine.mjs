import { quote2, transform } from './geom.mjs';
import { board } from './board.mjs';
import { S } from './render.mjs';
const base = (o = {}) => quote2({ r: 1, aOut: 192, aIn: -62, tip: { x: 0.95, y: -2.0 }, tipDir: -28, tipW: 0.5, notchDir: -118, hOut: 0.95, hIn: 0.55, tOut: 0.75, tIn: 0.45, cap: 'round', ...o });
const big = (o = {}) => base({ tip: { x: 1.72, y: -2.12 }, tipDir: -2, tOut: 1.2, tIn: 0.9, tipW: 0.4, hOut: 1.1, ...o });
const kid = (o = {}) => base({ tip: { x: 0.8, y: -1.85 }, tipDir: -40, tipW: 0.6, tOut: 0.6, tIn: 0.35, ...o });
const cands = [
  { name: 'R3a tip 12deg, kid .58 rot -24', shapes: [transform(big({ tip: { x: 1.95, y: -2.0 }, tipDir: 12, tipW: 0.46, tOut: 1.3, tIn: 1.0 }), { s: 1, rot: 4 }), transform(kid(), { s: 0.58, rot: -24, tx: 1.78, ty: 0.42 })] },
  { name: 'R3b tip 28deg cupping, kid .58', shapes: [transform(big({ tip: { x: 2.0, y: -1.85 }, tipDir: 28, tipW: 0.46, tOut: 1.4, tIn: 1.05 }), { s: 1, rot: 2 }), transform(kid(), { s: 0.58, rot: -22, tx: 1.8, ty: 0.42 })] },
  { name: 'R3c lower, wider arch, kid .62 upright-ish', shapes: [transform(big({ tip: { x: 2.15, y: -1.7 }, tipDir: 22, tipW: 0.48, tOut: 1.5, tIn: 1.15, hOut: 1.0 }), { s: 1, rot: 0 }), transform(kid(), { s: 0.62, rot: -14, tx: 1.95, ty: 0.38 })] },
];
await board(cands, S + '/tv/' + (process.argv[2] || 'r') + '.png');
