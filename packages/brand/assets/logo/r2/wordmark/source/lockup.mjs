// Lockups of the final wordmark with each kept symbol (phase 4).
// Symbols are COPIED from the designers' folders into lockups/<slug>/ and used unedited:
// their paths are placed inside a <g transform>, nothing in them is redrawn.
// Run from the repo root: node packages/brand/assets/logo/r2/wordmark/source/lockup.mjs <slug>[:opts] ...
import fs from 'node:fs';
import path from 'node:path';
import { C, toD, write, render, OUT, setPrecision } from './lib.mjs';
import { FINAL } from './final.mjs';
import { buildCut } from './routes.mjs';

setPrecision(1);
const R2 = path.resolve(OUT, '..');
const CAP = 710; // Literata cap height, font units

function parseSvg(src) {
  const vb = src.match(/viewBox="([^"]+)"/)[1].split(/[\s,]+/).map(Number);
  const inner = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[\s\S]*?<\/title>/, '').replace(/<desc>[\s\S]*?<\/desc>/, '').trim();
  return { vb, inner };
}

/** Ink bounding boxes of SVG files, measured in their own user units by Chromium. */
async function inkBoxes(files) {
  const PW = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules/playwright/index.mjs';
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || PW);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage();
  const out = {};
  for (const f of files) {
    const { inner } = parseSvg(fs.readFileSync(f, 'utf8'));
    await p.setContent(`<svg xmlns="http://www.w3.org/2000/svg" id="s">${inner}</svg>`);
    out[f] = await p.evaluate(() => { const r = document.getElementById('s').getBBox(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  }
  await b.close();
  return out;
}

/** Place a symbol (its ink box) into font-unit space (y down, baseline at 0). */
function place(sym, ink, { cx, cy, size, fill }) {
  // optical size: the geometric mean of width and height, so a wide mark and a tall mark carry equal weight
  const s = size / Math.sqrt(ink.w * ink.h);
  const tx = cx - (ink.x + ink.w / 2) * s, ty = cy - (ink.y + ink.h / 2) * s;
  let inner = sym.inner;
  if (fill) inner = inner.replace(/fill="#[0-9A-Fa-f]{3,6}"/g, `fill="${fill}"`);
  return { g: `<g transform="matrix(${+s.toFixed(5)} 0 0 ${+s.toFixed(5)} ${+tx.toFixed(1)} ${+ty.toFixed(1)})">${inner}</g>`, box: { x: tx + ink.x * s, y: ty + ink.y * s, w: ink.w * s, h: ink.h * s } };
}

function doc(parts, box, pad, title) {
  const vb = [box.x - pad, box.y - pad, box.w + 2 * pad, box.h + 2 * pad].map((v) => Math.round(v));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" role="img" aria-label="${title}"><title>${title}</title>${parts.join('')}</svg>\n`;
}
const union = (a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }; };

export async function buildLockups(specs) {
  const master = buildCut(FINAL.master), small = buildCut(FINAL.small);
  const results = [];
  const files = [];
  for (const sp of specs) {
    const dir = path.join(OUT, 'lockups', sp.slug);
    fs.mkdirSync(dir, { recursive: true });
    for (const v of ['symbol', 'symbol-reversed', 'symbol-small']) {
      const src = path.join(R2, sp.slug, `${v}.svg`);
      if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(dir, `${v}.svg`)); files.push(path.join(dir, `${v}.svg`)); }
    }
  }
  const inks = await inkBoxes(files);
  for (const sp of specs) {
    const dir = path.join(OUT, 'lockups', sp.slug);
    const o = { hSize: 1.32, hGap: 0.5, hCy: 0.5, sSize: 2.5, sGap: 0.62, ...sp.opts };
    for (const [suffix, symFile, wmFill, symFill, cut] of [
      ['', 'symbol', C.ink, null, master], ['-reversed', 'symbol-reversed', C.inkDark, null, master],
      ['-small', 'symbol-small', C.ink, null, small],
    ]) {
      const f = path.join(dir, `${symFile}.svg`);
      if (!fs.existsSync(f)) continue;
      const sym = parseSvg(fs.readFileSync(f, 'utf8'));
      const ink = inks[f];
      const wb = cut.bb; // font units, y up
      const wmBox = { x: wb.x0, y: -wb.y1, w: wb.w, h: wb.h };
      const wm = `<path fill="${wmFill}" d="${toD(cut.cmds)}"/>`;
      // horizontal: symbol centred on the cap-height middle (hCy of cap height above baseline)
      const hs = place(sym, ink, { cx: 0, cy: -CAP * o.hCy, size: CAP * o.hSize, fill: symFill });
      const dx = wb.x0 - (hs.box.x + hs.box.w) - CAP * o.hGap;
      const hsMoved = { ...hs, g: `<g transform="translate(${dx.toFixed(1)} 0)">${hs.g}</g>`, box: { ...hs.box, x: hs.box.x + dx } };
      const hBox = union(hsMoved.box, wmBox);
      write(`lockups/${sp.slug}/lockup-horizontal${suffix}.svg`, doc([hsMoved.g, wm], hBox, CAP * 0.12, 'Early Letters'));
      if (suffix === '-small') continue;
      // stacked: symbol above, centred on the wordmark's ink centre
      const cx = wb.x0 + wb.w / 2;
      const ss = place(sym, ink, { cx, cy: 0, size: CAP * o.sSize, fill: symFill });
      const dy = -wb.y1 - CAP * o.sGap - (ss.box.y + ss.box.h);
      const ssMoved = { g: `<g transform="translate(0 ${dy.toFixed(1)})">${ss.g}</g>`, box: { ...ss.box, y: ss.box.y + dy } };
      write(`lockups/${sp.slug}/lockup-stacked${suffix}.svg`, doc([ssMoved.g, wm], union(ssMoved.box, wmBox), CAP * 0.12, 'Early Letters'));
    }
    results.push(sp.slug);
  }
  return results;
}

if (process.argv[1] && process.argv[1].endsWith('lockup.mjs')) {
  const specs = process.argv.slice(2).map((a) => { const [slug, json] = a.split('='); return { slug, opts: json ? JSON.parse(json) : {} }; });
  console.log(await buildLockups(specs));
}
