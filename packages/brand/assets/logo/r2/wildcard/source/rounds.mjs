// Parameter sets tried in each refinement round (kept as a record).
export const rounds = {
  r4: [
    ['base', 'cubic wire', {}],
    ['flatter sweep', '', { c1: { x: 260, y: 360 }, c2: { x: 600, y: 200 } }],
    ['higher apex', '', { c1: { x: 230, y: 220 }, c2: { x: 620, y: 90 } }],
    ['small lower', 'small at mid height', { small: { y: 470 }, c2: { x: 640, y: 170 } }],
    ['bigger small', 'r 78', { small: { r: 78 } }],
  ],
};
rounds.r5 = [
  ['F1 family', 'two levels', { family: 1 }],
  ['F2 tighter', 'shorter drops', { family: 1, drop2: 110, dropS: 100, dropR: 30 }],
  ['F3 big lower', 'big hangs lowest', { family: 1, dropR: 120, drop2: 100, dropS: 80, dropM: 20 }],
  ['F4 heavier', 'wires 48/34, threads 24', { family: 1, w0: 48, w1: 36, v0: 36, v1: 28, threadW: 24 }],
  ['F5 flatter', 'less arc lift', { family: 1, lift1: 60, lift2: 40 }],
];
rounds.r6 = [
  ['G1 cascade up', 'small rides highest', { family: 1, R: 130, dropR: 110, drop2: 70, m: 82, dropM: 40, s: 52, dropS: 10, lift1: 110, lift2: 70 }],
  ['G2 cascade down', 'small hangs lowest', { family: 1, R: 130, dropR: 20, drop2: 90, m: 82, dropM: 40, s: 52, dropS: 120, lift1: 110, lift2: 70 }],
  ['G3 even line', 'discs share a baseline', { family: 1, R: 130, dropR: 60, drop2: 60, m: 82, dropM: 50 + 0, s: 52, dropS: 60 + 30 + 30, lift1: 100, lift2: 60 }],
  ['G4 wide', 'longer top wire', { family: 1, a: { x: 160, y: 330 }, b: { x: 720, y: 300 }, a2: { x: 590 }, b2: { x: 900 }, R: 130, dropR: 80, drop2: 80, m: 80, dropM: 30, s: 50, dropS: 70, lift1: 120, lift2: 60 }],
  ['G5 lighter', 'thinner wire, finer threads', { family: 1, w0: 32, w1: 24, v0: 24, v1: 18, threadW: 14, R: 130, dropR: 80, drop2: 80, m: 80, dropM: 30, s: 50, dropS: 70 }],
];
const G1 = { family: 1, R: 130, dropR: 110, drop2: 70, m: 82, dropM: 40, s: 52, dropS: 10, lift1: 110, lift2: 70 };
rounds.r7 = [
  ['H1 G1 tapered tips', 'wire 40 mid, 22 tips', { ...G1, w0: 40, w1: 22, v0: 30, v1: 18 }],
  ['H2 shorter hanger', 'top thread shorter', { ...G1, w0: 40, w1: 22, v0: 30, v1: 18, top: 130 }],
  ['H3 more lift', 'arcs rounder', { ...G1, w0: 40, w1: 22, v0: 30, v1: 18, top: 110, lift1: 150, lift2: 95 }],
  ['H4 small cut', 'for 16 to 40px', { ...G1, w0: 64, w1: 50, v0: 54, v1: 44, threadW: 40, top: 150, dropR: 60, drop2: 60, dropM: 10, dropS: 0, R: 140, m: 92, s: 66, lift1: 90, lift2: 50 }],
  ['H5 small cut 2', 'fewer, bolder parts', { ...G1, w0: 72, w1: 60, v0: 62, v1: 52, threadW: 50, top: 170, dropR: 30, drop2: 50, dropM: 0, dropS: 0, R: 150, m: 100, s: 74, lift1: 70, lift2: 40, a2: { x: 580 }, b2: { x: 880 } }],
];
