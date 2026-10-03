// Shared helpers for the round 2 wordmark. Outlines come from OFL fonts via opentype.js.
// Static cuts of the variable fonts are made by fonts.py (fontTools instancer) into .cache/.
import * as ot from 'opentype.js';
const opentype = ot.parse ? ot : ot.default;
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const OUT = path.resolve(HERE, '..');
export const ROOT = path.resolve(HERE, '../../../../../../..');
const CACHE = path.join(HERE, '.cache');

export const C = {
  ink: '#2B2722', inkMuted: '#6B645B', paper: '#FBF8F3', accent: '#8A5A3B', accentSoft: '#F1E6DC',
  line: '#E6DED3', inkDark: '#F2ECE4', inkMutedDark: '#B3AA9E', paperDark: '#161412',
  paperRaisedDark: '#201D1A', accentDark: '#D9A47E', lineDark: '#33302C',
};

const cache = new Map();
/** A static cut of an OFL variable font: fam in literata|ebgaramond, opsz ('-' if none), wght. */
export function cut(fam, opsz, wght) {
  const key = `${fam}-${opsz}-${wght}`;
  if (!cache.has(key)) {
    const file = path.join(CACHE, `${key}.ttf`);
    if (!fs.existsSync(file)) execFileSync('python3', [path.join(HERE, 'fonts.py'), CACHE, `${fam}:${opsz}:${wght}`], { stdio: 'inherit' });
    const buf = fs.readFileSync(file);
    cache.set(key, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length)));
  }
  return cache.get(key);
}

let PREC = 100;
export function setPrecision(decimals) { PREC = 10 ** decimals; }
const r = (n) => Math.round(n * PREC) / PREC;

/** Commands of a glyph (by char or by glyph name), font units, y up. Deep copy, zero-length lines removed. */
export function glyph(f, chOrName, byName = false) {
  let g;
  if (byName) {
    for (let i = 0; i < f.glyphs.length; i++) if (f.glyphs.get(i).name === chOrName) { g = f.glyphs.get(i); break; }
    if (!g) throw new Error('no glyph ' + chOrName);
  } else g = f.charToGlyph(chOrName);
  // opentype's glyph.path is y-up font units
  const cmds = clean(g.path.commands.map((c) => ({ ...c })));
  return { cmds, adv: g.advanceWidth, g };
}

export function clean(cmds) {
  const out = [];
  let px, py, sx, sy;
  for (const c of cmds) {
    if (c.type === 'M') { sx = c.x; sy = c.y; }
    if (c.type === 'L' && c.x === px && c.y === py) continue;
    out.push(c);
    if ('x' in c) { px = c.x; py = c.y; }
  }
  return out;
}

/** Split commands into closed contours. */
export function contours(cmds) {
  const out = [];
  let cur = [];
  for (const c of cmds) {
    if (c.type === 'M' && cur.length) { out.push(cur); cur = []; }
    cur.push(c);
    if (c.type === 'Z') { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return out;
}

export function mapPts(cmds, fn) {
  return cmds.map((c) => {
    const o = { ...c };
    if ('x' in o) [o.x, o.y] = fn(o.x, o.y, 'p');
    if ('x1' in o) [o.x1, o.y1] = fn(o.x1, o.y1, 'c1');
    if ('x2' in o) [o.x2, o.y2] = fn(o.x2, o.y2, 'c2');
    return o;
  });
}
export const translate = (cmds, dx, dy) => mapPts(cmds, (x, y) => [x + dx, y + dy]);
export const scaleCmds = (cmds, sx, sy = sx) => mapPts(cmds, (x, y) => [x * sx, y * sy]);

/** Commands -> SVG d, y flipped (font y-up to SVG y-down). */
export function toD(cmds, x = 0, baseline = 0, s = 1) {
  const X = (v) => r(x + v * s);
  const Y = (v) => r(baseline - v * s);
  let d = '';
  for (const c of cmds) {
    if (c.type === 'M') d += `M${X(c.x)} ${Y(c.y)}`;
    else if (c.type === 'L') d += `L${X(c.x)} ${Y(c.y)}`;
    else if (c.type === 'Q') d += `Q${X(c.x1)} ${Y(c.y1)} ${X(c.x)} ${Y(c.y)}`;
    else if (c.type === 'C') d += `C${X(c.x1)} ${Y(c.y1)} ${X(c.x2)} ${Y(c.y2)} ${X(c.x)} ${Y(c.y)}`;
    else if (c.type === 'Z') d += 'Z';
  }
  return d;
}

/** Exact bounding box (Q and C extrema solved). */
export function bbox(cmds) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
  let p = null;
  for (const c of cmds) {
    if (c.type === 'Z') continue;
    if (p && (c.type === 'Q' || c.type === 'C')) {
      const N = 24;
      for (let i = 1; i < N; i++) {
        const t = i / N, mt = 1 - t;
        if (c.type === 'Q') add(mt * mt * p.x + 2 * mt * t * c.x1 + t * t * c.x, mt * mt * p.y + 2 * mt * t * c.y1 + t * t * c.y);
        else add(mt ** 3 * p.x + 3 * mt * mt * t * c.x1 + 3 * mt * t * t * c.x2 + t ** 3 * c.x, mt ** 3 * p.y + 3 * mt * mt * t * c.y1 + 3 * mt * t * t * c.y2 + t ** 3 * c.y);
      }
    }
    add(c.x, c.y);
    p = { x: c.x, y: c.y };
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

export function nodeCount(cmds) { return cmds.filter((c) => c.type !== 'Z').length; }

export function write(rel, content) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}

const PW = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules/playwright/index.mjs';
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
/** Render jobs [{ html|file, out, width, height, scale, fullPage, transparent, colorScheme }] with Playwright Chromium. */
export async function render(jobs) {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || PW);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || CHROME });
  try {
    for (const j of jobs) {
      const page = await browser.newPage({ viewport: { width: j.width, height: j.height }, deviceScaleFactor: j.scale ?? 1, colorScheme: j.colorScheme ?? 'light' });
      if (j.file) await page.goto('file://' + j.file); else await page.setContent(j.html, { waitUntil: 'load' });
      await page.waitForTimeout(j.wait ?? 80);
      await page.screenshot({ path: j.out, fullPage: !!j.fullPage, omitBackground: !!j.transparent });
      await page.close();
    }
  } finally { await browser.close(); }
}
