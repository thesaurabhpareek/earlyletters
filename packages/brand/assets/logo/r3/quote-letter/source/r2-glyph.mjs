// Round 2: the "6" needs a real counter (hook) instead of a drop. Inner edge leaves near the top of the ball.
import { pair, fit, toD } from './quote.mjs';
import { sheet, SCR } from './sheet.mjs';
const V = {
  A_hook_top: [{ aIn: -95, hIn: 0.35, tip: { x: 0.85, y: -2.2 }, dir: -35, tIn: 0.75, tOut: 1.1, hOut: 1.3 }, {}],
  B_hook_mid: [{ aIn: -82, hIn: 0.45, tip: { x: 0.8, y: -2.25 }, dir: -38, tIn: 0.7, tOut: 1.05, hOut: 1.3 }, {}],
  C_hook_wide: [{ aIn: -100, hIn: 0.3, aOut: 200, tip: { x: 0.95, y: -2.1 }, dir: -30, w: 0.66, tIn: 0.8, tOut: 1.25, hOut: 1.45 }, {}],
  D_hook_short: [{ aIn: -92, hIn: 0.35, tip: { x: 0.7, y: -1.95 }, dir: -40, w: 0.64, tIn: 0.6, tOut: 0.95, hOut: 1.1 }, {}],
};
const cands = Object.entries(V).map(([name, [o, p]]) => ({ name, note: JSON.stringify(o), icon: (t) => `<rect width="1024" height="1024" fill="${t.bg}"/><path fill="${t.fg}" d="${toD(fit(pair(o, p), { cx: 512, cy: 520, h: 520 }))}"/>` }));
await sheet(cands, SCR + '/r2.png', { cols: 2 });
