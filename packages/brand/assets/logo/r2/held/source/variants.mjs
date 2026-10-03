const B = { gap: 3.5, ty: 40, r: 6, c1: [20, 41], c2: [30, 70], gy: 70, page: { cx: 55, w: 15, h: 20, a: 18, r: 2.2 } };
export default {
  'r14a joined notch, card offset': { ...B, joined: 1, notchY: 80, notchW: 2.2 },
  'r14b joined, card further right': { ...B, joined: 1, notchY: 80, notchW: 2.2, page: { cx: 60, a: 28 } },
  'r14c split, card far right on slope': { ...B, page: { cx: 61, w: 15, h: 20, a: 30, r: 2.2 } },
  'r14d joined, wide U, card lying in it': { ...B, joined: 1, notchY: 80, notchW: 2.2, c1: [18, 46], c2: [28, 72], gy: 72, page: { cx: 53, w: 20, h: 15, a: 8, r: 2.2 } },
};
