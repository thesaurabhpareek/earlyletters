// Wordmark decision renders: W4 revised (EB Garamond) vs W1 (Literata), each locked up with the quote mark.
// Usage (repo root): node .../wordtype.mjs <symbol.svg> <tag> [<symbol-small.svg>]
// Sizes are the wordmark's font size (1 em) in CSS px. Under 20 px the small cuts (and the symbol's small cut) are used.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { toD, C } from '../../../r2/wordmark/source/lib.mjs';
import { buildAll, WM } from './wordmark.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../../../../..');
const [symPath, tag, smallPath] = process.argv.slice(2);
const PNG = join(HERE, '..', 'png', tag); mkdirSync(PNG, { recursive: true });
const LOCK = join(WM, 'lockups', tag); mkdirSync(LOCK, { recursive: true });
const req = createRequire(import.meta.url);
const { chromium } = req('/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules/playwright');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

const parse = (src) => ({ inner: src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[\s\S]*?<\/title>/, '').replace(/<desc>[\s\S]*?<\/desc>/, '').trim() });
async function ink(src) {
  await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" id="s">${parse(src).inner}</svg>`);
  return page.evaluate(() => { const r = document.getElementById('s').getBBox(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
}
const SYM = { src: readFileSync(symPath, 'utf8') }; SYM.ink = await ink(SYM.src);
const SYMS = smallPath && existsSync(smallPath) ? { src: readFileSync(smallPath, 'utf8') } : SYM; if (SYMS !== SYM) SYMS.ink = await ink(SYMS.src);

const W = buildAll();
// Lockup proportions (in cap heights): symbol optical size (sqrt(w*h)) 1.45 cap, centred 0.5 cap above baseline, gap 0.55 cap.
const LK = { size: 1.45, cy: 0.5, gap: 0.55 };
function lockup(cutKey, fill, small = false, stacked = false) {
  const c = W[cutKey]; const cap = c.cap; const s = small ? SYMS : SYM;
  const k = (LK.size * cap) / Math.sqrt(s.ink.w * s.ink.h);
  const sw = s.ink.w * k, sh = s.ink.h * k;
  const inner = parse(s.src).inner.replace(/fill="#[0-9A-Fa-f]{3,6}"/g, `fill="${fill}"`);
  const wb = c.bb; // y up
  let tx, ty, box;
  if (!stacked) {
    tx = -s.ink.x * k; ty = -LK.cy * cap - sh / 2 - s.ink.y * k;
    const wx = sw + LK.gap * cap - wb.x0;
    const g = `<g transform="matrix(${k.toFixed(5)} 0 0 ${k.toFixed(5)} ${tx.toFixed(1)} ${ty.toFixed(1)})">${inner}</g><path fill="${fill}" transform="translate(${wx.toFixed(1)} 0)" d="${toD(c.cmds)}"/>`;
    const top = Math.min(-LK.cy * cap - sh / 2, -wb.y1), bot = Math.max(-LK.cy * cap + sh / 2, -wb.y0);
    box = { x: 0, y: top, w: wx + wb.x1, h: bot - top };
    return { g, box };
  }
  // stacked: symbol 2.6 cap, centred over the word, 0.8 cap gap above the cap line
  const k2 = (2.6 * cap) / Math.sqrt(s.ink.w * s.ink.h); const sw2 = s.ink.w * k2, sh2 = s.ink.h * k2;
  const cx = (wb.x0 + wb.x1) / 2; tx = cx - sw2 / 2 - s.ink.x * k2; ty = -cap - 0.8 * cap - sh2 - s.ink.y * k2;
  const g = `<g transform="matrix(${k2.toFixed(5)} 0 0 ${k2.toFixed(5)} ${tx.toFixed(1)} ${ty.toFixed(1)})">${inner}</g><path fill="${fill}" d="${toD(c.cmds)}"/>`;
  box = { x: Math.min(wb.x0, cx - sw2 / 2), y: -cap - 0.8 * cap - sh2, w: Math.max(wb.w, sw2), h: cap + 0.8 * cap + sh2 - wb.y0 };
  return { g, box };
}
const svg = (l, pad = 20, attrs = '') => `<svg xmlns="http://www.w3.org/2000/svg" ${attrs} viewBox="${[l.box.x - pad, l.box.y - pad, l.box.w + 2 * pad, l.box.h + 2 * pad].map((v) => Math.round(v)).join(' ')}" role="img" aria-label="Early Letters"><title>Early Letters</title>${l.g}</svg>`;
const sized = (l, em, pad = 20) => svg(l, pad, `height="${((l.box.h + 2 * pad) * em / 1000).toFixed(2)}"`);

// files: lockups for both routes (W1 lockups are for comparison only)
for (const [route, m, sm] of [['w4r', 'w4r-master', 'w4r-small'], ['w1', 'w1-master', 'w1-small']]) {
  writeFileSync(join(LOCK, `${route}-horizontal.svg`), svg(lockup(m, C.ink)) + '\n');
  writeFileSync(join(LOCK, `${route}-horizontal-reversed.svg`), svg(lockup(m, C.inkDark)) + '\n');
  writeFileSync(join(LOCK, `${route}-horizontal-small.svg`), svg(lockup(sm, C.ink, true)) + '\n');
  writeFileSync(join(LOCK, `${route}-stacked.svg`), svg(lockup(m, C.ink, false, true)) + '\n');
}

const fontCss = (() => {
  const lit = readFileSync(join(REPO, 'packages/brand/assets/logo/r2/wordmark/source/.cache/literata-VF.ttf')).toString('base64');
  const mk = (w) => readFileSync(join(REPO, `node_modules/@fontsource/mukta/files/mukta-latin-${w}-normal.woff2`)).toString('base64');
  return `@font-face{font-family:Literata;src:url(data:font/ttf;base64,${lit});font-weight:200 900}
  ${[400, 500, 600].map((w) => `@font-face{font-family:Mukta;font-weight:${w};src:url(data:font/woff2;base64,${mk(w)})}`).join('')}`;
})();
const LIGHT = { bg: C.paper, fg: C.ink, mut: C.inkMuted, card: '#FFFFFF', line: C.line, acc: C.accent }, DARK = { bg: C.paperDark, fg: C.inkDark, mut: C.inkMutedDark, card: C.paperRaisedDark, line: C.lineDark, acc: C.accentDark };
const routes = [['W4 revised (EB Garamond)', 'w4r-master', 'w4r-small'], ['W1 (Literata)', 'w1-master', 'w1-small']];

// 1) size matrix
async function matrix(dpr, file) {
  const p = await browser.newPage({ viewport: { width: 1190, height: 400 }, deviceScaleFactor: dpr });
  const blocks = routes.map(([n, m, sm]) => [LIGHT, DARK].map((t) => `<h3>${n}, ${t === LIGHT ? 'paper' : 'night'}</h3><div class="blk" style="background:${t.bg}">${[14, 28, 64, 160].map((em) => `<div class="r"><span style="color:${t.mut}">${em} px${em < 20 ? ' (small cuts)' : ''}</span>${sized(lockup(em < 20 ? sm : m, t === LIGHT ? C.ink : C.inkDark, em < 20), em)}</div>`).join('')}</div>`).join('')).join('');
  await p.setContent(`<!doctype html><style>body{margin:0;padding:16px;background:#ddd;font:13px system-ui;width:1150px} h3{margin:12px 0 4px;font-size:14px} .blk{padding:10px 20px} .r{display:flex;align-items:center;gap:18px;padding:6px 0} .r span{width:110px;flex:none} svg{display:block}</style>${blocks}`);
  await p.waitForTimeout(150);
  await p.screenshot({ path: join(PNG, file), fullPage: true });
  await p.close();
}
await matrix(1, 'wordmark-matrix-1x.png');
await matrix(2, 'wordmark-matrix-2x.png');

// 2) W4 before/after at 14 and 28 px (wordmark only), 1x pixels magnified 4x
{
  const items = [['W4 r2 master', 'w4-master', 28], ['W4 revised master', 'w4r-master', 28], ['W4 r2 small', 'w4-small', 14], ['W4 revised small (540, +2.5% track)', 'w4r-small', 14], ['W4 revised small at 560', 'w4r-small-560', 14], ['W1 small', 'w1-small', 14]];
  const html = [];
  for (const [n, k, em] of items) for (const t of [LIGHT, DARK]) {
    const c = W[k]; const l = { g: `<path fill="${t === LIGHT ? C.ink : C.inkDark}" d="${toD(c.cmds)}"/>`, box: { x: c.bb.x0, y: -c.bb.y1, w: c.bb.w, h: c.bb.h } };
    const s = sized(l, em, 40);
    await page.setViewportSize({ width: 400, height: 80 });
    await page.setContent(`<!doctype html><style>html,body{margin:0;background:${t.bg}} svg{display:block}</style>${s}`);
    const r = await page.evaluate(() => { const b = document.querySelector('svg').getBoundingClientRect(); return { w: Math.ceil(b.width), h: Math.ceil(b.height) }; });
    const buf = await page.screenshot({ clip: { x: 0, y: 0, width: r.w, height: r.h } });
    html.push(`<figure><img style="image-rendering:pixelated;width:${r.w * 4}px" src="data:image/png;base64,${buf.toString('base64')}"><img style="width:${r.w}px" src="data:image/png;base64,${buf.toString('base64')}"><figcaption>${n}, ${em} px, ${t === LIGHT ? 'paper' : 'night'}</figcaption></figure>`);
  }
  await page.setViewportSize({ width: 1400, height: 600 });
  await page.setContent(`<!doctype html><style>body{margin:0;padding:16px;background:#ddd;font:13px system-ui;display:grid;grid-template-columns:1fr 1fr;gap:14px} figure{margin:0;display:flex;flex-direction:column;gap:4px}</style>${html.join('')}`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(PNG, 'wordmark-w4-before-after-14-28.png'), fullPage: true });
}

// 3) email header (600 px, 2x), light and dark, both routes
{
  const p = await browser.newPage({ viewport: { width: 1300, height: 600 }, deviceScaleFactor: 2 });
  const email = (route, t) => {
    const [, m, s] = route; const em = 22;
    return `<div class="em" style="background:${t.bg};color:${t.fg}"><div class="hd" style="border-bottom:1px solid ${t.line}">${sized(lockup(m, t === LIGHT ? C.ink : C.inkDark), em)}</div>
    <div class="bd"><p class="eyebrow" style="color:${t.mut}">Month 4, Week 2</p><h1>A letter is waiting for Asha</h1>
    <p>Papa recorded two minutes this morning. It is saved in the book, exactly as it was said.</p><span class="btn" style="background:${t.acc};color:${t === LIGHT ? '#fff' : '#1E1612'}">Open the book</span></div>
    <div class="ft" style="color:${t.mut};border-top:1px solid ${t.line}">${sized(lockup(s, t === LIGHT ? C.inkMuted : C.inkMutedDark, true), 14)}<span>hello@earlyletters.com</span></div></div>`;
  };
  await p.setContent(`<!doctype html><style>${fontCss} body{margin:0;padding:20px;background:#cfcfcf;display:grid;grid-template-columns:600px 600px;gap:20px;font-family:Mukta}
    .em{width:600px;border-radius:6px;overflow:hidden} .hd{padding:26px 40px 20px} .bd{padding:28px 40px 30px} .ft{padding:18px 40px 22px;display:flex;justify-content:space-between;align-items:center;font-size:13px}
    h1{font:500 28px/1.2 Literata;margin:0 0 12px} p{font-size:16px;line-height:1.5;margin:0 0 18px} .eyebrow{font-size:13px;margin-bottom:8px;letter-spacing:.02em}
    .btn{display:inline-block;padding:10px 22px;border-radius:999px;font-weight:600;font-size:15px} .lab{grid-column:span 2;font:600 13px Mukta;margin:0}</style>
    <p class="lab">Email header, 600 px wide, lockup at 22 px; footer lockup at 14 px with the small cuts. Left: W4 revised. Right: W1.</p>
    ${email(routes[0], LIGHT)}${email(routes[1], LIGHT)}${email(routes[0], DARK)}${email(routes[1], DARK)}`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: join(PNG, 'wordmark-email-header.png'), fullPage: true });
  await p.close();
}

// 4) app splash (iPhone 402 x 874 pt, rendered @2x to keep files small): stacked lockup, light and dark
{
  const p = await browser.newPage({ viewport: { width: 4 * 402 + 5 * 16, height: 874 + 60 }, deviceScaleFactor: 2 });
  const splash = (route, t, n) => `<div><div class="ph" style="background:${t.bg}">${svg(lockup(route[1], t === LIGHT ? C.ink : C.inkDark, false, true), 20, 'width="190"')}</div><p>${n}</p></div>`;
  await p.setContent(`<!doctype html><style>body{margin:0;padding:16px;background:#bbb;display:flex;gap:16px;font:600 13px system-ui}
    .ph{width:402px;height:874px;border-radius:44px;display:flex;align-items:center;justify-content:center;padding-bottom:60px;box-sizing:border-box} p{margin:8px 0 0}</style>
    ${splash(routes[0], LIGHT, 'W4 revised, light')}${splash(routes[1], LIGHT, 'W1, light')}${splash(routes[0], DARK, 'W4 revised, dark')}${splash(routes[1], DARK, 'W1, dark')}`);
  await p.waitForTimeout(200);
  await p.screenshot({ path: join(PNG, 'wordmark-splash.png'), fullPage: true });
  await p.close();
}
await browser.close();
console.log('wordtype ->', PNG, LOCK);
