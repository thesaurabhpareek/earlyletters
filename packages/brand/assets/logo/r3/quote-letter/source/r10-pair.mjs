// Round 10: the parent and child relationship with the constructed glyph.
import { pair, fit, toD } from './quote.mjs';
import { pageIcon, PL, PD } from './s3.mjs';
import { sheet, SCR } from './sheet.mjs';
const V = {
  'r62 baseline gap.20': {},
  'r55 baseline gap.18': { ratio: 0.55, gap: 0.18 },
  'r62 baseline gap.10 (closer)': { gap: 0.1 },
  'r62 lean -8 (toward parent)': { gap: 0.12, lean: -8 },
  'r70 baseline gap.16': { ratio: 0.7, gap: 0.16 },
  'r50 baseline gap.16': { ratio: 0.5, gap: 0.16 },
};
const cands = Object.entries(V).map(([name, p]) => ({ name, icon: (t) => `<rect width="1024" height="1024" fill="${t.bg}"/><path fill="${t.fg}" d="${toD(fit(pair({}, p), { cx: 512, cy: 520, h: 500 }))}"/>` }));
await sheet(cands, SCR + '/r10.png', { cols: 2 });
