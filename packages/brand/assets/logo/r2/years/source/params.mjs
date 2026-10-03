// Locked parameters for the "years" mark (v1). Units: a 100 x 100 drawing box, ground at y = 90.
// Wall thickness of a ring: wb (hairline, near the ground) to wt (heaviest), heaviest point turned by ph degrees.
// Outer ring: polar profile, m blends a cosine (0) with its square (1), a trig polynomial so no kinks.
// Inner ring: hole is a true circle shifted toward its thin side (ecc), the cleanest possible curve.
export const MAIN = { seed: 10, holeN: 16, rings: [
  { R: 41, wt: 15.5, wb: 3, ph: 35, m: 0.45 },  // the years around
  { R: 22.5, wt: 12, wb: 3, ph: -35, ecc: 1 },  // the first year
] };
// optical cut for 40px and below: heavier hairlines, slightly larger seed
export const SMALL = { seed: 11, holeN: 16, rings: [
  { R: 41, wt: 17, wb: 4.6, ph: 35, m: 0.35 },
  { R: 22, wt: 13, wb: 4.6, ph: -35, ecc: 1 },
] };
