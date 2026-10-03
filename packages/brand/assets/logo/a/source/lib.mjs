// Shared helpers for building logo direction A.
// Type is outlined with opentype.js from the OFL fonts in @fontsource (see ../LICENSE-NOTES.md).
import opentype from 'opentype.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const OUT = path.resolve(HERE, '..');
const ROOT = path.resolve(HERE, '../../../../../..');
const FS = path.join(ROOT, 'node_modules/@fontsource');

const cache = new Map();
export function font(family, weight, style = 'normal') {
  const key = `${family}-${weight}-${style}`;
  if (!cache.has(key)) {
    const file = path.join(FS, family, 'files', `${family}-latin-${weight}-${style}.woff`);
    cache.set(key, opentype.parse(fs.readFileSync(file).buffer.slice(0)));
  }
  return cache.get(key);
}

export const C = {
  ink: '#2B2722',
  inkMuted: '#6B645B',
  paper: '#FBF8F3',
  accent: '#8A5A3B',
  accentSoft: '#F1E6DC',
  line: '#E6DED3',
  inkDark: '#F2ECE4',
  paperDark: '#161412',
  paperRaisedDark: '#201D1A',
  accentDark: '#D9A47E',
};

const r = (n) => Math.round(n * 100) / 100;

/** Glyph commands in font units, y up. Returns a deep copy. */
export function glyphCommands(f, ch) {
  return f.charToGlyph(ch).path.commands.map((c) => ({ ...c }));
}

/** Convert font-unit commands (y up) to an SVG d string at (x, baseline) and scale s (y flipped). */
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

/** Drop zero-length L segments that opentype emits, keeps edits readable. */
export function clean(cmds) {
  const out = [];
  let px, py;
  for (const c of cmds) {
    if (c.type === 'L' && c.x === px && c.y === py) continue;
    out.push(c);
    if ('x' in c) { px = c.x; py = c.y; }
  }
  return out;
}

/** Bounding box of commands (control points included, fine for layout). */
export function bbox(cmds) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of cmds) for (const k of ['x', 'x1', 'x2']) if (k in c) { x0 = Math.min(x0, c[k]); x1 = Math.max(x1, c[k]); }
  for (const c of cmds) for (const k of ['y', 'y1', 'y2']) if (k in c) { y0 = Math.min(y0, c[k]); y1 = Math.max(y1, c[k]); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

export function translate(cmds, dx, dy) {
  return cmds.map((c) => {
    const o = { ...c };
    for (const k of ['x', 'x1', 'x2']) if (k in o) o[k] += dx;
    for (const k of ['y', 'y1', 'y2']) if (k in o) o[k] += dy;
    return o;
  });
}

export function scaleCmds(cmds, sx, sy = sx) {
  return cmds.map((c) => {
    const o = { ...c };
    for (const k of ['x', 'x1', 'x2']) if (k in o) o[k] *= sx;
    for (const k of ['y', 'y1', 'y2']) if (k in o) o[k] *= sy;
    return o;
  });
}

export function write(rel, content) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}

/** Render HTML or SVG files to PNG with Playwright Chromium. jobs: [{ html|file, out, width, height, scale }] */
export async function render(jobs) {
  const { chromium } = await import('/opt/npm-tools/node_modules/playwright/index.mjs');
  const browser = await chromium.launch();
  try {
    for (const j of jobs) {
      const page = await browser.newPage({
        viewport: { width: j.width, height: j.height },
        deviceScaleFactor: j.scale ?? 1,
        colorScheme: j.colorScheme ?? 'light',
      });
      if (j.file) await page.goto('file://' + j.file);
      else await page.setContent(j.html, { waitUntil: 'load' });
      await page.waitForTimeout(j.wait ?? 50);
      await page.screenshot({ path: j.out, fullPage: !!j.fullPage, omitBackground: !!j.transparent });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

/** Lay out a string with kerning; returns per-glyph commands in font units (y up), positioned. */
export function layout(f, text, { tracking = 0, kern = {} } = {}) {
  const glyphs = f.stringToGlyphs(text);
  const out = [];
  let x = 0;
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    const ch = text[i];
    out.push({ ch, x, cmds: translate(clean(g.path.commands.map((c) => ({ ...c }))), x, 0), adv: g.advanceWidth });
    let k = 0;
    if (i < glyphs.length - 1) {
      k = f.getKerningValue(g, glyphs[i + 1]);
      const pair = ch + text[i + 1];
      if (pair in kern) k += kern[pair];
    }
    x += g.advanceWidth + k + tracking;
  }
  return { glyphs: out, width: x };
}

/** Exact bounding box of the drawn outline (L and Q segments; C uses control hull). */
export function exactBbox(cmds) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
  let p = null;
  for (const c of cmds) {
    if (c.type === 'Z') continue;
    if (c.type === 'Q' && p) {
      for (const k of ['x', 'y']) {
        const den = p[k] - 2 * c[k + '1'] + c[k];
        if (Math.abs(den) > 1e-9) {
          const t = (p[k] - c[k + '1']) / den;
          if (t > 0 && t < 1) {
            const mt = 1 - t;
            add(mt * mt * p.x + 2 * mt * t * c.x1 + t * t * c.x, mt * mt * p.y + 2 * mt * t * c.y1 + t * t * c.y);
          }
        }
      }
    }
    if (c.type === 'C') { add(c.x1, c.y1); add(c.x2, c.y2); }
    add(c.x, c.y);
    p = { x: c.x, y: c.y };
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
