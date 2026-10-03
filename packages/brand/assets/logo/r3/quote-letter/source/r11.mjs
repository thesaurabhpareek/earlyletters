// Round 11: page tile vs pure pair with the final glyph and pair; tile colour options.
import { pair, fit, toD, bbox } from './quote.mjs';
import { pageIcon } from './s3.mjs';
import { sheet, SCR, C } from './sheet.mjs';
const PL = { pg: C.paper, mk: C.accent, under: C.accent, flap: C.accentSoft };
const PD = { pg: C.paperRaisedDark, mk: C.accentDark, under: C.accent, flap: C.ink };
const pure = (fill) => (t) => `${t.g ? `<defs><linearGradient id="gg" x2="0" y2="1"><stop offset="0" stop-color="${t.g[0]}"/><stop offset="1" stop-color="${t.g[1]}"/></linearGradient></defs>` : ''}<rect width="1024" height="1024" fill="${t.g ? 'url(#gg)' : t.bg}"/><path fill="${t.fg}" d="${toD(fit(pair(), { cx: 512 - 6, cy: 512, h: 500 }))}"/>`;
const DK = { bg: '#1F1B18', fg: C.accentDark };
const cands = [
  { name: 'pure, flat #8A5A3B', icon: pure(), light: { bg: C.accent, fg: C.paper }, dark: DK },
  { name: 'pure, deep #7F4F30', icon: pure(), light: { bg: '#7F4F30', fg: C.paper }, dark: DK },
  { name: 'pure, gradient #94603F to #7C4F33', icon: pure(), light: { g: ['#94603F', '#7C4F33'], fg: C.paper }, dark: DK },
  { name: 'page f300', icon: (t) => pageIcon(t, { f: 300, qh: 480, cx: 500, cy: 490 }), light: PL, dark: PD },
  { name: 'page f340', icon: (t) => pageIcon(t, { f: 340, qh: 470, cx: 496, cy: 484 }), light: PL, dark: PD },
  { name: 'page f380 smaller pair', icon: (t) => pageIcon(t, { f: 380, qh: 440, cx: 488, cy: 476 }), light: PL, dark: PD },
];
await sheet(cands, SCR + '/r11.png', { cols: 2 });
