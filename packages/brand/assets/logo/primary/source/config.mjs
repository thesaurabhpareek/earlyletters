// The approved mark (founder, Oct 3 2026): final-a from logo round 3 ("the pair").
// Copied from r3/final/source/config.mjs with final-b removed. Do not edit the numbers without a new version
// in packages/brand/registry.ts (the registry records version and date for every asset built from here).
// Units: bowl radius = 1. Child = the parent's drawing x ratio, rotated `lean` degrees toward the parent.
export const A_MASTER_G = {}; // mark.mjs G defaults
export const A_SMALL_G = { w: 0.76, tipA: 243, rf: 0.3, ballIn: 55, inFrac: 0.45 }; // small cut: tail +23% thicker, 7% shorter sweep, notch 50% wider
export const MARK = {
  title: 'primary (r3 final-a): the pair',
  master: { g: A_MASTER_G, p: { gap: 0.185, lean: -14, drop: -0.08 }, kid: A_MASTER_G, box: 0.56, mx: -4, my: 22 },
  small: { g: A_SMALL_G, p: { gap: 0.34, ratio: 0.64, lean: -12, drop: -0.06 }, kid: A_SMALL_G, box: 0.6, mx: -4, my: 18 },
};
// Brand colours as used by the artwork. Must equal packages/brand/index.ts (the registry test checks this file).
export const C = { ink: '#2B2722', inkMuted: '#6B645B', paper: '#FBF8F3', accent: '#8A5A3B', accentDeep: '#7F4F30', accentSoft: '#F1E6DC', inkDark: '#F2ECE4', paperDark: '#161412', paperRaisedDark: '#201D1A', accentDark: '#D9A47E', line: '#E6DED3' };
