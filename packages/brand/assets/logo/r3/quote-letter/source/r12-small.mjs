// Round 12: optical small cut for 16 to 40 px.
import { pair, fit, toD } from './quote.mjs';
import { sheet, SCR, C } from './sheet.mjs';
const L = { bg: '#8A5A3B', fg: C.paper }, D = { bg: '#1F1B18', fg: C.accentDark };
const mk = (name, g, p, h = 500) => ({ name, light: L, dark: D, icon: (t) => `<rect width="1024" height="1024" fill="${t.bg}"/><path fill="${t.fg}" d="${toD(fit(pair(g, p), { cx: 506, cy: 512, h }))}"/>` });
const cands = [
  mk('master', {}, {}),
  mk('small A: tail .74, gap .2', { w: 0.74, rf: 0.12 }, { gap: 0.2 }),
  mk('small B: tail .76, ratio .66, gap .22, bigger', { w: 0.76, rf: 0.12 }, { ratio: 0.66, gap: 0.22 }, 560),
  mk('small C: tail .8, shorter (tipA 250), ratio .66, gap .24', { w: 0.8, rf: 0.12, tipA: 250 }, { ratio: 0.66, gap: 0.24 }, 560),
];
await sheet(cands, SCR + '/r12.png', { cols: 2 });
