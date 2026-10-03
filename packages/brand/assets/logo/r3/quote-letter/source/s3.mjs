// Sketch round S3: the tile IS the page. A physically correct dog-ear: the corner beyond the fold line is
// reflected across it (so the flap keeps the tile's own rounded corner), and the cover shows beneath.
import { pair, fit, toD } from './quote.mjs';
import { sheet, SCR, C, squircle } from './sheet.mjs';
const SQ = squircle();
export function pageIcon(t, { f = 330, corner = 'br', qh = 470, cx = 500, cy = 500, gap = 0, under } = {}) {
  const c = 2048 - f; // fold line x + y = c (bottom-right). For top-right use x - y = 1024 - f.
  let half, refl;
  if (corner === 'br') { half = `M${c - 1024} 1024L1024 ${c - 1024}L1100 1100Z`; refl = `matrix(0 -1 -1 0 ${c} ${c})`; }
  else { const k = 1024 - f; half = `M${k} 0L1024 ${f}L1100 -100Z`.replace(`L1024 ${f}`, `L1024 ${1024 - k}`); refl = `matrix(0 1 1 0 ${-k} ${k})`; }
  const q = fit(pair(), { cx, cy, h: qh });
  return `<rect width="1024" height="1024" fill="${t.pg}"/><path fill="${t.mk}" d="${toD(q)}"/>` +
    `<path fill="${under ?? t.under}" d="${half}"/>` +
    `<clipPath id="h${f}${corner}"><path d="${half}"/></clipPath><g transform="${refl}"><path fill="${t.flap}" d="${SQ}" clip-path="url(#h${f}${corner})"/></g>`;
}
export const PL = { pg: C.paper, mk: C.accent, under: C.accent, flap: '#EDE3D6' };
export const PD = { pg: '#1E1A17', mk: C.accentDark, under: '#8A5A3B', flap: '#2E2722' };
const PD2 = { ...PD, under: '#0B0A09' };
const P0 = { pg: C.paper, mk: C.accent };
const cands = [
  { name: 'P0 paper tile, no corner (control)', icon: (t) => `<rect width="1024" height="1024" fill="${t.pg}"/><path fill="${t.mk}" d="${toD(fit(pair(), { cx: 512, cy: 520, h: 500 }))}"/>`, light: P0, dark: PD },
  { name: 'P1 bottom-right turned, f330', icon: (t) => pageIcon(t, {}), light: PL, dark: PD },
  { name: 'P2 bottom-right turned, f420', icon: (t) => pageIcon(t, { f: 420, qh: 440, cx: 470, cy: 470 }), light: PL, dark: PD2 },
  { name: 'P3 top-right turned, f330', icon: (t) => pageIcon(t, { corner: 'tr', cy: 540 }), light: PL, dark: PD },
  { name: 'P4 sepia page? (inverse: sepia page, paper underside)', icon: (t) => pageIcon(t, {}), light: { pg: C.accent, mk: C.paper, under: '#5E3D28', flap: '#9C6B4B' }, dark: PD2 },
  { name: 'G pure pair, gradient tile (control)', icon: (t) => `<defs><linearGradient id="gg" x2="0" y2="1"><stop offset="0" stop-color="#94603F"/><stop offset="1" stop-color="#7C4F33"/></linearGradient></defs><rect width="1024" height="1024" fill="${t.g ? 'url(#gg)' : t.bg}"/><path fill="${t.fg}" d="${toD(fit(pair(), { cx: 512, cy: 520, h: 500 }))}"/>`, light: { g: 1, fg: C.paper }, dark: { bg: '#1E1A17', fg: C.accentDark } },
];
if (process.argv[1].endsWith('s3.mjs')) await sheet(cands, SCR + '/s3.png', { cols: 2 });
