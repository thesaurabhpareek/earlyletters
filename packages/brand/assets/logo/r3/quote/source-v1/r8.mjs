import { build, P } from './mark.mjs';
import { board } from './board.mjs';
import { S } from './render.mjs';
const v = (patch) => { const q = structuredClone(P); for (const [k, o] of Object.entries(patch)) Object.assign(q[k], o); return q; };
const vs = [
  ['current small', P],
  ['S1 arch less descending', v({ bigS: { tip: { x: 2.25, y: -1.62 }, tipDir: 40 }, kidS: { tip: { x: 0.5, y: -1.6 }, tOut: 0.45 }, kidTS: { tx: 2.12 } })],
  ['S2 S1 + thicker arm', v({ bigS: { tip: { x: 2.25, y: -1.62 }, tipDir: 40, tipW: 0.5, hOut: 1.2 }, kidS: { tip: { x: 0.45, y: -1.55 }, tOut: 0.45, tipW: 0.5 }, kidTS: { tx: 2.15, s: 0.64 } })],
];
await board(vs.map(([n, p]) => ({ name: n, shapes: build(p, true), small: build(p, true) })), S + '/tv/r8.png');
