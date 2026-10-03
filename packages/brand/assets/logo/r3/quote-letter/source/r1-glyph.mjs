// Round 1: the glyph itself, pure pair, a few drawings.
import { pair, fit, toD } from './quote.mjs';
import { sheet, SCR } from './sheet.mjs';
const V = {
  A_base: [{}, {}],
  B_shorter_tail: [{ tip: { x: 0.55, y: -2.05 }, dir: -42, w: 0.62 }, {}],
  C_thicker_cut: [{ w: 0.74, tip: { x: 0.66, y: -2.3 } }, {}],
  D_round_cap: [{ cap: 0.9 }, {}],
  E_ratio_55_gap: [{}, { ratio: 0.55, gap: 0.24 }],
  F_lean: [{}, { ratio: 0.62, gap: 0.12, lean: -8 }],
};
const cands = Object.entries(V).map(([name, [o, p]]) => ({ name, icon: (t) => `<rect width="1024" height="1024" fill="${t.bg}"/><path fill="${t.fg}" d="${toD(fit(pair(o, p), { cx: 512, cy: 512, h: 470 }))}"/>` }));
await sheet(cands, SCR + '/r1.png', { cols: 2 });
