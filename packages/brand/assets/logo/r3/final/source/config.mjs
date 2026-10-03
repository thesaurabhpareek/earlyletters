// The two finals. Same drawing system (mark.mjs), same tile, same wordmark; they differ only in the parent's tail.
// Units: bowl radius = 1. Child = the parent's drawing x ratio, rotated `lean` degrees toward the parent.
export const A_MASTER_G = {};                                                      // mark.mjs G defaults
export const A_SMALL_G = { w: 0.76, tipA: 243, rf: 0.3, ballIn: 55, inFrac: 0.45 };                          // small cut: tail +23% thicker, 7% shorter sweep, notch 50% wider
export const VARIANTS = {
  'final-a': {
    title: 'final-a: the pair',
    master: { g: A_MASTER_G, p: { gap: 0.185, lean: -14, drop: -0.08 }, kid: A_MASTER_G, box: 0.56, mx: -4, my: 22 },
    small: { g: A_SMALL_G, p: { gap: 0.34, ratio: 0.64, lean: -12, drop: -0.06 }, kid: A_SMALL_G, box: 0.6, mx: -4, my: 18 },
  },
  'final-b': {
    title: 'final-b: the pair, sheltered',
    master: { g: { tipA: 252, inFrac: 0.3, ext: { sweep: 34, r: 1.9, shrink: 0.86, back: 10 } }, p: { gap: 0.2, lean: -14, drop: -0.12 }, kid: A_MASTER_G, box: 0.56, mx: -4, my: 22 },
    small: { g: { ...A_SMALL_G, tipA: 246, inFrac: 0.3, ext: { sweep: 24, r: 1.9, shrink: 0.94, back: 8 } }, p: { gap: 0.4, ratio: 0.64, lean: -10, drop: 0.02 }, kid: A_SMALL_G, box: 0.6, mx: -4, my: 18 },
  },
};
export const C = { ink: '#2B2722', inkMuted: '#6B645B', paper: '#FBF8F3', accent: '#8A5A3B', accentDeep: '#7F4F30', accentSoft: '#F1E6DC', inkDark: '#F2ECE4', paperDark: '#161412', paperRaisedDark: '#201D1A', accentDark: '#D9A47E', line: '#E6DED3' };
