// Sketch round S2: each integration given its best honest drawing.
import { pair, fit, toD } from './quote.mjs';
import { roundPoly, P } from './geom.mjs';
import { rect } from './concepts.mjs';
import { sheet, SCR, C, LIGHT, DARK } from './sheet.mjs';
const T = (t) => `<rect width="1024" height="1024" fill="${t.bg}"/>`;
const ev = (fill, d) => `<path fill="${fill}" fill-rule="evenodd" d="${d}"/>`;
let mid = 0; const M = () => 'm' + (++mid);

// 1c: sheet, bottom-right corner softly lifting (a curl, not a file dog-ear)
function curlSheet(t, { W = 600, H = 720, cl = 190, qh = 330, qdy = -30 } = {}) {
  const x0 = 512 - W / 2, y0 = 512 - H / 2, x1 = x0 + W, y1 = y0 + H;
  // body with the bottom-right corner replaced by a concave sweep (the page lifts away)
  const d = `M${x0 + 40} ${y0}H${x1 - 40}Q${x1} ${y0} ${x1} ${y0 + 40}V${y1 - cl}C${x1 - cl * 0.35} ${y1 - cl * 0.55} ${x1 - cl * 0.55} ${y1 - cl * 0.35} ${x1 - cl} ${y1}H${x0 + 40}Q${x0} ${y1} ${x0} ${y1 - 40}V${y0 + 40}Q${x0} ${y0} ${x0 + 40} ${y0}Z`;
  // the lifted flap: a leaf between the sweep and a straight-ish crease, offset by a gap
  const g = 24;
  const f = `M${x1 - cl + g * 1.4} ${y1 + 2}C${x1 - cl * 0.55 + g} ${y1 - cl * 0.35 + g * 0.4} ${x1 - cl * 0.35 + g * 0.4} ${y1 - cl * 0.55 + g} ${x1 + 2} ${y1 - cl + g * 1.4}C${x1 - cl * 0.1} ${y1 - cl * 0.3} ${x1 - cl * 0.3} ${y1 - cl * 0.1} ${x1 - cl + g * 1.4} ${y1 + 2}Z`;
  const q = fit(pair(), { cx: 512 - 10, cy: 512 + qdy, h: qh });
  return T(t) + ev(t.fg, d + toD(q)) + `<path fill="${t.fg}" d="${f}"/>`;
}
// 2b: envelope pocket with a straight top edge (no V, no flap), sheet rising
function pocket(t, { arcTop = 0 } = {}) {
  const ex0 = 170, ex1 = 854, eTop = 560, ey1 = 820, g = 26;
  const sh = rect(250, 190, 774, eTop + 80, 34);
  const q = fit(pair(), { cx: 512, cy: 372, h: 250 });
  const top = arcTop ? `Q512 ${eTop + arcTop} ${ex1} ${eTop}` : `L${ex1} ${eTop}`;
  const pk = `M${ex0 + 36} ${eTop}${top.replace(/^L/, 'L')}`;
  const pocketD = `M${ex0} ${eTop + 36}Q${ex0} ${eTop} ${ex0 + 36} ${eTop}${arcTop ? `Q512 ${eTop + arcTop} ${ex1 - 36} ${eTop}` : `H${ex1 - 36}`}Q${ex1} ${eTop} ${ex1} ${eTop + 36}V${ey1 - 40}Q${ex1} ${ey1} ${ex1 - 40} ${ey1}H${ex0 + 40}Q${ex0} ${ey1} ${ex0} ${ey1 - 40}Z`;
  const gapD = `M0 ${eTop - g}${arcTop ? `L${ex0 + 36} ${eTop - g}Q512 ${eTop + arcTop - g} ${ex1 - 36} ${eTop - g}` : ''}L1024 ${eTop - g}V1024H0Z`;
  const id = M();
  return T(t) + `<mask id="${id}"><rect width="1024" height="1024" fill="#fff"/><path d="${gapD}" fill="#000"/></mask><g mask="url(#${id})">${ev(t.fg, toD([sh]) + toD(q))}</g><path fill="${t.fg}" d="${pocketD}"/>`;
}
// 3b: the tile is the page, the bottom-right corner turned up, sepia showing beneath (page over a leather cover)
function page(t, { f = 300, qh = 470 } = {}) {
  const q = fit(pair(), { cx: 500, cy: 470, h: qh });
  const cut = `M1024 ${1024 - f}L${1024 - f} 1024H1024Z`;
  const flap = `M1024 ${1024 - f}L${1024 - f} 1024L${1024 - f * 0.92} ${1024 - f * 0.92}Z`;
  return `<rect width="1024" height="1024" fill="${t.pg}"/>` + `<path fill="${t.mk}" d="${toD(q)}"/>` + `<path fill="${t.under}" d="${cut}"/><path fill="${t.flap}" d="${flap}"/>`;
}
// 4b: bigger cutout, landscape card (a note card)
function cut(t, { W = 680, H = 760, qh = 440, r = 44 } = {}) {
  const x0 = 512 - W / 2, y0 = 512 - H / 2;
  const q = fit(pair(), { cx: 512, cy: 512, h: qh });
  return T(t) + ev(t.fg, toD([rect(x0, y0, x0 + W, y0 + H, r)]) + toD(q));
}
// 5b: the small mark IS the turned corner: the sheet's top-right corner rolls into the small "6"
function folded(t, { c = 260 } = {}) {
  const W = 640, H = 740, x0 = 512 - W / 2, y0 = 512 - H / 2, x1 = x0 + W, y1 = y0 + H;
  const [big, kid] = pair();
  const B = fit([big], { cx: 430, cy: 560, h: 360 });
  const K = fit([kid], { cx: x1 - c * 0.38, cy: y0 + c * 0.36, h: c * 0.8 });
  const id = M();
  const body = `M${x0 + 44} ${y0}H${x1 - c}L${x1} ${y0 + c}V${y1 - 44}Q${x1} ${y1} ${x1 - 44} ${y1}H${x0 + 44}Q${x0} ${y1} ${x0} ${y1 - 44}V${y0 + 44}Q${x0} ${y0} ${x0 + 44} ${y0}Z`;
  return T(t) + `<mask id="${id}"><rect width="1024" height="1024" fill="#fff"/><path d="${toD(K)}" fill="#000" stroke="#000" stroke-width="48" stroke-linejoin="round"/></mask>` +
    `<g mask="url(#${id})">${ev(t.fg, body + toD(B))}</g><path fill="${t.fg}" d="${toD(K)}"/>`;
}
const PL = { pg: C.paper, mk: C.accent, under: C.accent, flap: '#EADFD2' };
const PD = { pg: '#1E1A17', mk: C.accentDark, under: '#0D0B0A', flap: '#2E2722' };
const cands = [
  { name: '1c sheet, lifting corner', icon: (t) => curlSheet(t) },
  { name: '2b envelope pocket, straight top', icon: (t) => pocket(t) },
  { name: '2c envelope pocket, soft arc top', icon: (t) => pocket(t, { arcTop: 70 }) },
  { name: '3b tile is the page, corner turned', icon: (t) => page(t), light: PL, dark: PD },
  { name: '4b pair cut out of a big card', icon: (t) => cut(t) },
  { name: '5b corner rolls into the small mark', icon: (t) => folded(t) },
];
await sheet(cands, SCR + '/s2.png', { cols: 2 });
