// The Early Letters "two voices" mark: a large opening quotation mark whose tail arches over
// a small one that leans back toward it. Pure cubic beziers, built from geom.mjs.
import { quote2, transform } from './geom.mjs';
const base = (o = {}) => quote2({ r: 1, aOut: 192, aIn: -62, tip: { x: 0.95, y: -2.0 }, tipDir: -28, tipW: 0.5, notchDir: -118, hOut: 0.95, hIn: 0.55, tOut: 0.75, tIn: 0.45, cap: 0.75, ...o });
export const P = {
  big: { tip: { x: 2.28, y: -1.38 }, tipDir: 62, tipW: 0.3, tOut: 1.65, tIn: 1.25, hOut: 1.15, aIn: -58 },
  kid: { tip: { x: 0.65, y: -1.95 }, tipDir: -55, tipW: 0.3, tOut: 0.65, tIn: 0.38 },
  kidT: { s: 0.62, rot: -22, tx: 1.92, ty: 0.4 },
  // optical cut for <= 40px: thicker arch and tail, shorter reach, wider gaps
  bigS: { tip: { x: 2.25, y: -1.62 }, tipDir: 40, tipW: 0.42, cap: 0.9, tOut: 1.5, tIn: 1.0, hOut: 1.1, aIn: -56 },
  kidS: { tip: { x: 0.5, y: -1.6 }, tipDir: -55, tipW: 0.46, cap: 0.9, tOut: 0.45, tIn: 0.3 },
  kidTS: { s: 0.62, rot: -18, tx: 2.12, ty: 0.38 },
};
export function build(p = P, small = false) {
  const b = base(small ? p.bigS : p.big), k = base(small ? p.kidS : p.kid);
  return [transform(b, {}), transform(k, small ? p.kidTS : p.kidT)];
}
