// The letter integrations. Every concept is a pure silhouette (one colour on the tile) so it survives
// iOS tinted and clear modes; holes are made with fill-rule evenodd.
import { pair, fit, toD, bbox, transform } from './quote.mjs';
import { roundPoly, P, line, reverse } from './geom.mjs';

const path = (fill, shapes, rule = 'evenodd') => `<path fill="${fill}" fill-rule="${rule}" d="${toD(shapes)}"/>`;
const tile = (t) => (t.grad ? `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.grad[0]}"/><stop offset="1" stop-color="${t.grad[1]}"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/>` : `<rect width="1024" height="1024" fill="${t.bg}"/>`);
export const rect = (x0, y0, x1, y1, r) => roundPoly([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], r);

/** A sheet with its top-right corner turned down toward the reader (dog-ear). f = fold size, g = gap, r = radius. */
export function sheetFold({ x0, y0, x1, y1, f, g, r, rf = r * 0.6 }) {
  // body is an L-notched sheet; the flap (the turned corner, lying on the page) fills the notch's lower-left half
  const body = roundPoly([P(x0, y0), P(x1 - f - g, y0), P(x1 - f - g, y0 + f + g), P(x1, y0 + f + g), P(x1, y1), P(x0, y1)], [r, rf * 0.5, rf * 0.5, rf * 0.5, r, r]);
  const flap = roundPoly([P(x1 - f, y0), P(x1, y0 + f), P(x1 - f, y0 + f)], [rf * 0.5, rf * 0.5, rf * 0.5]);
  return { body, flap };
}

export const CONCEPTS = {
  // 0. control: the pure pair
  pure: (o = {}) => ({
    name: '0 pure pair (control)',
    icon: (t) => tile(t) + path(t.fg, fit(pair(o.g, o.p), { cx: 512 + (o.dx ?? 0), cy: 520, h: o.h ?? 520 })),
  }),

  // 1. quotes printed on a plain sheet with a softly turned corner
  sheet: (o = {}) => ({
    name: '1 sheet, turned corner, quotes printed',
    icon: (t) => {
      const W = o.w ?? 560, H = o.hh ?? 700, x0 = 512 - W / 2, y0 = 512 - H / 2;
      const { body, flap } = sheetFold({ x0, y0, x1: x0 + W, y1: y0 + H, f: o.f ?? 150, g: o.gap ?? 22, r: 34 });
      const q = fit(pair(o.g, o.p), { cx: 512 + (o.qdx ?? -10), cy: 512 + (o.qdy ?? 40), h: o.qh ?? 300 });
      return tile(t) + path(t.fg, [body, ...q].flat()) + path(t.fg, [flap]);
    },
  }),

  // 1b. the opening of a letter: the pair set where the first words of a letter begin (top left)
  opening: (o = {}) => ({
    name: '1b sheet, quotes as the first marks of a letter',
    icon: (t) => {
      const W = 560, H = 700, x0 = 512 - W / 2, y0 = 512 - H / 2;
      const { body, flap } = sheetFold({ x0, y0, x1: x0 + W, y1: y0 + H, f: 150, g: 22, r: 34 });
      const q = fit(pair(o.g, o.p), { cx: x0 + 200, cy: y0 + 210, h: 210 });
      return tile(t) + path(t.fg, [body, ...q].flat()) + path(t.fg, [flap]);
    },
  }),

  // 2. an open envelope whose visible content is the quote pair on a sheet
  envelope: (o = {}) => ({
    name: '2 open envelope, quoted sheet rising out',
    icon: (t) => {
      const ex0 = 192, ex1 = 832, ey1 = 800, eTop = 520;
      // sheet rises out of the pocket
      const sx0 = 262, sx1 = 762, sy0 = 210;
      const sheet = rect(sx0, sy0, sx1, eTop + 60, 30);
      const q = fit(pair(o.g, o.p), { cx: 512, cy: 370, h: 230 });
      // pocket: rectangle whose top edge dips in a shallow soft V (no flap), separated from the sheet by a gap
      const gap = 24;
      const pocket = roundPoly([P(ex0, eTop), P(512, eTop + 120), P(ex1, eTop), P(ex1, ey1), P(ex0, ey1)], [30, 60, 30, 40, 40]);
      const pocketGap = roundPoly([P(ex0 - 40, eTop - gap), P(512, eTop + 120 - gap * 1.15), P(ex1 + 40, eTop - gap), P(ex1 + 40, ey1 + 40), P(ex0 - 40, ey1 + 40)], [10, 60, 10, 10, 10]);
      // knock the gap band out of the sheet using a mask
      return tile(t) + `<mask id="m"><rect width="1024" height="1024" fill="#fff"/><path fill="#000" d="${toD([pocketGap])}"/></mask>` +
        `<g mask="url(#m)">${path(t.fg, [sheet, ...q].flat())}</g>` + path(t.fg, [pocket]);
    },
  }),

  // 3. the whole tile is the page: paper tile, corner turned, sepia quotes
  page: (o = {}) => ({
    name: '3 the tile is the page',
    icon: (t) => {
      const f = o.f ?? 230;
      // turned corner: the tile's top-right is folded down; the underside shows as sepia triangle with the back of the paper
      const flapBack = `<path fill="${t.under}" d="M${1024 - f} 0 L1024 ${f} L1024 0 Z"/>`;
      const flap = `<path fill="${t.flap}" d="M${1024 - f} 0 L${1024 - f} ${f * 0.0 + f} L1024 ${f} Z"/>`;
      const q = fit(pair(o.g, o.p), { cx: 500, cy: 540, h: o.h ?? 470 });
      return `<rect width="1024" height="1024" fill="${t.paperTile}"/>` + path(t.mark, q) + flapBack + flap;
    },
  }),

  // 4. the pair cut out of a sheet as negative space (big, centred)
  cutout: (o = {}) => ({
    name: '4 pair cut out of a sheet',
    icon: (t) => {
      const W = o.w ?? 600, H = o.hh ?? 720, x0 = 512 - W / 2, y0 = 512 - H / 2;
      const body = rect(x0, y0, x0 + W, y0 + H, o.r ?? 40);
      const q = fit(pair(o.g, o.p), { cx: 512, cy: 512 + (o.qdy ?? 0), h: o.qh ?? 400 });
      return tile(t) + path(t.fg, [body, ...q].flat());
    },
  }),

  // 5. a folded letter: the fold's shadow/turn is the small mark
  folded: (o = {}) => ({
    name: '5 folded letter, the turned corner is the small mark',
    icon: (t) => {
      const W = 600, H = 720, x0 = 512 - W / 2, y0 = 512 - H / 2, x1 = x0 + W;
      const [big, kid] = pair(o.g, o.p);
      // big mark cut out of the sheet body, left of centre
      const B = fit([big], { cx: 450, cy: 560, h: 330 });
      // child mark: rotated so its tail runs along the cut corner; it sits in the notch as the turned paper
      const c = o.c ?? 210;
      const body = roundPoly([P(x0, y0), P(x1 - c, y0), P(x1, y0 + c), P(x1, y0 + H), P(x0, y0 + H)], [40, 18, 18, 40, 40]);
      const K = fit([kid], { cx: x1 - c * 0.42, cy: y0 + c * 0.42, h: c * 0.92 }).map((s) => s);
      const notch = `<path fill="${t.bg}" d="${toD([roundPoly([P(x1 - c - 26, y0 - 60), P(x1 + 60, y0 + c + 26), P(x1 + 60, y0 - 60)], 0)])}"/>`;
      return tile(t) + path(t.fg, [body, ...B].flat()) + path(t.fg, K);
    },
  }),
};
