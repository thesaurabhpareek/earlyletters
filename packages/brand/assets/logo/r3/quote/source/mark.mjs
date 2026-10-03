// The mark: parent and child are ONE drawing (glyph.mjs). The child is the parent scaled by RATIO,
// leaned in by LEAN degrees about its own origin, standing on the parent's baseline, GAP units away
// at the closest point (units: the parent is 1000 tall).
import { pair, measure } from './pair.mjs';
export const RATIO = 0.618; // golden section: clearly smaller, still a voice of its own
export const LEAN = -6; // degrees; the child's top leans toward the parent
export const MARK = { s: RATIO, rot: LEAN, gap: 44, glyphOpts: {} };
// Optical small cut (16 to 40 px). Still one drawing for both marks, same ratio and lean:
// a fuller terminal, a slightly heavier tail, the crook opened a touch, and the gap more than doubled.
export const SMALL_GLYPH = { E: [615, 95], Tp: [470, 0], I2: [455, 225], tI2: -25, K: [350, 330] };
export const SMALL = { s: RATIO, rot: LEAN, gap: 100, glyphOpts: SMALL_GLYPH };
export const build = (o = MARK) => pair(o);
export { measure };
