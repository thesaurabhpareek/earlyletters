// Build every deliverable for the round 3 quotation mark from source.
// node packages/brand/assets/logo/r3/quote/source/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build, MARK, SMALL, RATIO, LEAN, measure } from './mark.mjs';
import { xform, toD, bbox, g2Report, segments } from './geom.mjs';
import { glyph } from './glyph.mjs';
import { w4, w1 } from './wordmark.mjs';
import { shoot } from './render.mjs';
import { presentation } from './presentation.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');
const PNG = path.join(OUT, 'png');
const WM = path.join(OUT, 'wordmark');
fs.mkdirSync(PNG, { recursive: true });
fs.mkdirSync(WM, { recursive: true });

// brand family only (packages/brand/index.ts) plus the two tile refinements the brief asked to test
export const C = { ink: '#2B2722', inkMuted: '#6B645B', paper: '#FBF8F3', accent: '#8A5A3B', accentSoft: '#F1E6DC', line: '#E6DED3', inkDark: '#F2ECE4', paperDark: '#161412', paperRaisedDark: '#201D1A', accentDark: '#D9A47E' };
export const TILE = { flat: C.accent, deep: '#7F4F30', gradTop: '#94603F', gradBottom: '#7C4F33', night: '#1F1B18' };

const r = (n) => Math.round(n * 10) / 10;
// ---------- geometry: mark height 1000 units, top-left at 0,0 ----------
function normalise(shapes, H = 1000) {
  const b = bbox(shapes), s = H / b.h;
  return shapes.map((sh) => xform(sh, { s, tx: -b.x0 * s, ty: -b.y0 * s }));
}
const MAIN = normalise(build(MARK));
const SM = normalise(build(SMALL));
const bM = bbox(MAIN), bS = bbox(SM);
const dMain = toD(MAIN), dSmall = toD(SM);
const nodes = { main: MAIN.reduce((n, c) => n + c.length, 0), small: SM.reduce((n, c) => n + c.length, 0) };
const g2 = Math.max(...g2Report(glyph()).filter((x) => !x.corner).map((x) => x.jump), ...g2Report(glyph(SMALL.glyphOpts)).filter((x) => !x.corner).map((x) => x.jump));
const mM = measure(MAIN), mS = measure(SM);

const svg = (vb, body, label = 'Early Letters symbol') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>\n`;
const pad = (b, p) => { const m = Math.max(b.w, b.h) * p; return `${r(b.x0 - m)} ${r(b.y0 - m)} ${r(b.w + 2 * m)} ${r(b.h + 2 * m)}`; };
const vbMain = pad(bM, 0.04), vbSmall = pad(bS, 0.04);
const files = {
  'symbol.svg': svg(vbMain, `<path fill="${C.ink}" d="${dMain}"/>`),
  'symbol-reversed.svg': svg(vbMain, `<path fill="${C.inkDark}" d="${dMain}"/>`),
  'symbol-accent.svg': svg(vbMain, `<path fill="${C.accent}" d="${dMain}"/>`),
  'symbol-small.svg': svg(vbSmall, `<path fill="${C.ink}" d="${dSmall}"/>`),
};
{ // favicon: square, small cut, follows the browser theme
  const sz = Math.max(bS.w, bS.h) * 1.04, x = bS.w / 2 - sz / 2, y = bS.h / 2 - sz / 2 + bS.h * 0.01;
  files['favicon.svg'] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(x)} ${r(y)} ${r(sz)} ${r(sz)}"><style>path{fill:${C.ink}}@media (prefers-color-scheme:dark){path{fill:${C.inkDark}}}</style><path d="${dSmall}"/></svg>\n`;
}

// ---------- wordmarks ----------
// W4 (EB Garamond) with the word space opened. Brief: about 15 percent. 15 percent of W4's 120-unit
// space is 18 units and invisible at every size (sketches/wm-01-word-space.png), so the shipped file
// opens it 50 percent (120 to 180 units); the literal 1.15 file ships beside it for comparison.
const SPACE = 1.5;
const W4M = w4('master', SPACE), W4S = w4('small', SPACE), W4L = w4('master', 1.15);
const W1M = w1('master'), W1S = w1('small');
const wsvg = (o, fill, label = 'Early Letters') => svg(o.vb.map(r).join(' '), `<path fill="${fill}" d="${o.d}"/>`, label);
const wmFiles = {
  'wordmark.svg': wsvg(W4M, C.ink), 'wordmark-reversed.svg': wsvg(W4M, C.inkDark), 'wordmark-accent.svg': wsvg(W4M, C.accent),
  'wordmark-small.svg': wsvg(W4S, C.ink), 'wordmark-small-reversed.svg': wsvg(W4S, C.inkDark), 'wordmark-small-accent.svg': wsvg(W4S, C.accent),
  'wordmark-space115.svg': wsvg(W4L, C.ink),
};
for (const [f, s] of Object.entries(wmFiles)) fs.writeFileSync(path.join(WM, f), s);

// ---------- lockups ----------
// Horizontal: the mark stands on the baseline like the opening quotation mark of the name,
// 1.25 x cap height tall (cap height 650 in both wordmark files), circles overshoot the baseline 1.2 percent.
const CAP = 650;
function lockupH(fill, W = W4M, d = dMain, b = bM, label = 'Early Letters') {
  const H = CAP * 1.25, s = H / b.h, over = H * 0.012;
  const sym = (d === dMain ? MAIN : SM).map((sh) => xform(sh, { s, tx: 0, ty: -H + over }));
  const gap = CAP * 0.45, wx = b.w * s + gap - W.vb[0];
  const w = b.w * s + gap + W.vb[2], m = CAP * 0.12, top = Math.min(-H + over, W.vb[1]), bottom = W.vb[1] + W.vb[3];
  return svg(`${r(-m)} ${r(top - m)} ${r(w + 2 * m)} ${r(bottom - top + 2 * m)}`, `<path fill="${fill}" d="${toD(sym)}"/><path fill="${fill}" transform="translate(${r(wx)} 0)" d="${W.d}"/>`, label);
}
function lockupS(fill, W = W4M, label = 'Early Letters') {
  const H = CAP * 2.4, s = H / bM.h, symW = bM.w * s, wmW = W.vb[2], cx = W.vb[0] + wmW / 2;
  // optical centre: the pair's mass sits left of its box, so nudge it right by a third of the difference
  const opt = ((bM.w / 2 - mM.cx) / 3) * s;
  const sym = MAIN.map((sh) => xform(sh, { s, tx: cx - symW / 2 + opt, ty: 0 }));
  const gap = CAP * 0.8, base = H + gap + CAP, m = CAP * 0.2;
  return svg(`${r(W.vb[0] - m)} ${r(-m)} ${r(wmW + 2 * m)} ${r(base + (W.vb[1] + W.vb[3]) + 2 * m)}`, `<path fill="${fill}" d="${toD(sym)}"/><path fill="${fill}" transform="translate(0 ${r(base)})" d="${W.d}"/>`, label);
}
Object.assign(files, {
  'lockup-horizontal.svg': lockupH(C.ink), 'lockup-stacked.svg': lockupS(C.ink),
  'lockup-horizontal-reversed.svg': lockupH(C.inkDark), 'lockup-stacked-reversed.svg': lockupS(C.inkDark),
  'lockup-horizontal-small.svg': lockupH(C.ink, W4S, dSmall, bS), // 28 px email header and below
  'lockup-horizontal-w1.svg': lockupH(C.ink, W1M), 'lockup-stacked-w1.svg': lockupS(C.ink, W1M),
});
const extra = { lockupHSmallRev: lockupH(C.inkDark, W4S, dSmall, bS), lockupHW1Rev: lockupH(C.inkDark, W1M), lockupHW1Small: lockupH(C.ink, W1S, dSmall, bS) };
for (const [f, s] of Object.entries(files)) fs.writeFileSync(path.join(OUT, f), s);

// ---------- app icon ----------
// Sized like the bench (geometric mean of the drawn box = FILL x canvas) and centred optically:
// a third of the way from the box centre toward the mass centre, and a touch high (the mass sits low).
const FILL = 0.58;
export function icon(px, { bg = 'grad', fg = C.paper, small = false, radius = 0 } = {}) {
  const b = small ? bS : bM, d = small ? dSmall : dMain, mm = small ? mS : mM;
  const sz = Math.sqrt(b.w * b.h) / (small ? FILL + 0.03 : FILL);
  const cx = b.w / 2 + (mm.cx - b.w / 2) / 3, cy = b.h / 2 + (mm.cy - b.h / 2) / 3 - b.h * 0.01;
  const x = cx - sz / 2, y = cy - sz / 2;
  const fillBg = bg === 'grad' ? 'url(#g)' : bg;
  const defs = bg === 'grad' ? `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TILE.gradTop}"/><stop offset="1" stop-color="${TILE.gradBottom}"/></linearGradient></defs>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="${r(x)} ${r(y)} ${r(sz)} ${r(sz)}">${defs}<rect x="${r(x)}" y="${r(y)}" width="${r(sz)}" height="${r(sz)}" rx="${r(sz * radius)}" fill="${fillBg}"/><path fill="${fg}" d="${d}"/></svg>`;
}
const bgLayer = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TILE.gradTop}"/><stop offset="1" stop-color="${TILE.gradBottom}"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/></svg>\n`;
fs.writeFileSync(path.join(HERE, 'icon-background-gradient.svg'), bgLayer);
fs.writeFileSync(path.join(HERE, 'app-icon-1024.svg'), icon(1024));

const jobs = [];
const one = (name, s, px, bg = 'transparent', h = px) => jobs.push({ html: `<style>html,body{margin:0;background:${bg}}svg{display:block}</style>${s}`, out: path.join(PNG, name), width: px, height: h, transparent: bg === 'transparent' });
one('_app-icon-1024.png', icon(1024), 1024, TILE.gradTop);
one('app-icon-flat-1024.png', icon(1024, { bg: TILE.flat }), 1024, TILE.flat);
one('app-icon-deep-1024.png', icon(1024, { bg: TILE.deep }), 1024, TILE.deep);
one('app-icon-paper-1024.png', icon(1024, { bg: C.paper, fg: C.accent }), 1024, C.paper);
one('app-icon-dark-1024.png', icon(1024, { bg: TILE.night, fg: C.accentDark }), 1024, '#000');
one('app-icon-tinted-1024.png', icon(1024, { bg: '#000000', fg: '#E8E8E8' }), 1024, '#000');
for (const px of [16, 29, 40, 60, 180]) {
  const small = px <= 40, rad = px === 16 ? 0.18 : 0.2237;
  one(`icon-${px}.png`, icon(px, { small, radius: rad }), px);
  one(`icon-${px}-master.png`, icon(px, { radius: rad }), px); // the master drawing at the same size, for comparison
  one(`icon-${px}-dark.png`, icon(px, { small, radius: rad, bg: TILE.night, fg: C.accentDark }), px);
  one(`icon-${px}-paper.png`, icon(px, { small, radius: rad, bg: C.paper, fg: C.accent }), px);
}
for (const px of [16, 29]) {
  const sz = Math.max(bS.w, bS.h) * 1.04, vb = `${r(bS.w / 2 - sz / 2)} ${r(bS.h / 2 - sz / 2 + bS.h * 0.01)} ${r(sz)} ${r(sz)}`;
  one(`favicon-${px}-light.png`, `<svg width="${px}" height="${px}" viewBox="${vb}"><path fill="${C.ink}" d="${dSmall}"/></svg>`, px, '#FFFFFF');
  one(`favicon-${px}-dark.png`, `<svg width="${px}" height="${px}" viewBox="${vb}"><path fill="${C.inkDark}" d="${dSmall}"/></svg>`, px, '#202124');
}
// the large drawing at 2000 px wide, paper and night
{
  const m = bM.w * 0.07, vb = `${-m} ${-m} ${bM.w + 2 * m} ${bM.h + 2 * m}`, h = Math.round((2000 * (bM.h + 2 * m)) / (bM.w + 2 * m));
  one('mark-2000-paper.png', `<svg width="2000" height="${h}" viewBox="${vb}"><rect x="${-m}" y="${-m}" width="100%" height="100%" fill="${C.paper}"/><path fill="${C.ink}" d="${dMain}"/></svg>`, 2000, C.paper, h);
  one('mark-2000-night.png', `<svg width="2000" height="${h}" viewBox="${vb}"><rect x="${-m}" y="${-m}" width="100%" height="100%" fill="${C.paperDark}"/><path fill="${C.inkDark}" d="${dMain}"/></svg>`, 2000, C.paperDark, h);
}
await shoot(jobs);
execFileSync('python3', ['-c', `from PIL import Image
im=Image.open(r'${path.join(PNG, '_app-icon-1024.png')}').convert('RGB'); im.save(r'${path.join(OUT, 'app-icon-1024.png')}')
print('app-icon-1024.png', im.mode, im.size)`], { stdio: 'inherit' });
fs.unlinkSync(path.join(PNG, '_app-icon-1024.png'));

// ---------- construction facts for the presentation ----------
const big = glyph(), cBall = { cx: 315, cy: 685, r: 315 };
const facts = {
  ratio: RATIO, lean: LEAN, gap: MARK.gap, gapSmall: SMALL.gap, nodes, g2,
  nodesPerGlyph: big.length, bbox: { w: r(bM.w), h: r(bM.h) }, mass: { x: r(mM.cx / bM.w), y: r(mM.cy / bM.h) },
  ball: cBall, space: SPACE,
};
fs.writeFileSync(path.join(HERE, 'facts.json'), JSON.stringify(facts, null, 2));
const constructionSvg = (() => {
  // nodes, handles and the ball circle on the parent drawing
  const segs = segments(big);
  const hs = segs.map((s) => `<line x1="${r(s[0][0])}" y1="${r(s[0][1])}" x2="${r(s[1][0])}" y2="${r(s[1][1])}"/><line x1="${r(s[3][0])}" y1="${r(s[3][1])}" x2="${r(s[2][0])}" y2="${r(s[2][1])}"/><circle cx="${r(s[1][0])}" cy="${r(s[1][1])}" r="7"/><circle cx="${r(s[2][0])}" cy="${r(s[2][1])}" r="7"/>`).join('');
  const ns = big.map((n) => `<rect x="${r(n.p[0] - 10)}" y="${r(n.p[1] - 10)}" width="20" height="20"/>`).join('');
  return `<svg viewBox="-80 -80 860 1160" style="height:520px;width:auto"><path d="${toD([big])}" fill="${C.ink}" opacity=".12" stroke="${C.ink}" stroke-width="3"/><circle cx="${cBall.cx}" cy="${cBall.cy}" r="${cBall.r}" fill="none" stroke="${C.accent}" stroke-width="2.5" stroke-dasharray="12 10"/><g stroke="${C.accent}" stroke-width="2.5" fill="${C.paper}">${hs}</g><g fill="${C.ink}">${ns}</g></svg>`;
})();

const html = presentation({ C, TILE, dMain, dSmall, bM, bS, files, extra, facts, constructionSvg, rel: path.relative(OUT, path.resolve(OUT, '../../../../../..')) });
fs.writeFileSync(path.join(OUT, 'presentation.html'), html);
console.log(JSON.stringify(facts));
