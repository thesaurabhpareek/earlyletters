/**
 * Logo direction B, "The voice, kept": build every SVG from source.
 *
 *   npx tsx packages/brand/assets/logo/b/src/build.ts
 *   python3 packages/brand/assets/logo/b/src/render.py   (PNGs + screenshots)
 *
 * The name and colours come from @scribe/brand (packages/brand/index.ts);
 * nothing here hardcodes them. Type is outlined from the OFL Literata files
 * shipped in @fontsource (see ../LICENSE-NOTES.md).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { brand } from '../../../../index.ts';
import { parseCentreline, strokeOutline, toD, bbox } from './geometry.mjs';

const require = createRequire(import.meta.url);
const opentype = require('opentype.js');
const wawoff = require('wawoff2');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');
const ROOT = path.resolve(HERE, '../../../../../..');
const FONT = path.join(ROOT, 'node_modules/@fontsource/literata/files/literata-latin-500-normal.woff2');

const C = brand.colors;
export const VARIANTS = {
  ink: { fg: C.ink, bg: C.paper, label: 'Ink on paper' },
  reversed: { fg: C.inkDark, bg: C.paperDark, label: 'Reversed' },
  accent: { fg: C.accent, bg: C.paper, label: 'Accent on paper' },
  'accent-reversed': { fg: C.accentDark, bg: C.paperDark, label: 'Accent, reversed' },
} as const;
type Variant = keyof typeof VARIANTS;

// ---------------------------------------------------------------------------
// 1. The symbol: one pen stroke. A voice runs along the line, rises into a
//    handwritten "e", and leaves as an underline on the same line.
// ---------------------------------------------------------------------------
const B = 72; // the line everything sits on (centreline units, 100-unit design box)

type SymbolSpec = { sx: number; sy: number; weight: number; contrast: number; ramp: number; tailX: number; tailRise: number };

/** Master: for 48px and up. */
const MASTER: SymbolSpec = { sx: 1, sy: 1, weight: 6.9, contrast: 0.24, ramp: 0.7, tailX: 97, tailRise: 3 };
/** Small: optical size for 40px and below (favicon, tab bar, spine). Wider wave, heavier and more even pen. */
const SMALL: SymbolSpec = { sx: 1.22, sy: 1.08, weight: 9.4, contrast: 0.1, ramp: 0.86, tailX: 94, tailRise: 2.5 };

/** Micro: the favicon cut for 16 to 24px. Shorter tail, heaviest pen; drawn 12 percent taller (see favicon). */
const MICRO: SymbolSpec = { sx: 1.25, sy: 1.15, weight: 12.6, contrast: 0.06, ramp: 0.92, tailX: 89, tailRise: 2 };

/**
 * The centreline, as six hand-placed cubics. Every join is G1 (handles
 * collinear) and every turn's radius is checked against the pen's half-width
 * (crest ~6.5, zero crossing ~4.3, trough-to-upstroke ~6 units) so inner
 * curves never pinch.
 */
function centreline(s: SymbolSpec) {
  const x0 = 2;
  const X = (dx: number) => x0 + dx * s.sx;
  const Y = (dy: number) => B + dy * s.sy;
  // Voice: a crest, a softer trough, then up. Decays as it goes.
  const S = [X(0), Y(0.5)];
  const C1 = [X(8.5), Y(-3.6)];
  const T = [X(23), Y(2.6)];
  // Join where the upstroke becomes the eye's lower edge, and its direction.
  const J = [48, B - 17], dir = [14.5, -6.5], dl = Math.hypot(dir[0], dir[1]);
  const u = [dir[0] / dl, dir[1] / dl];
  const r2 = (p: number[]) => `${Number(p[0].toFixed(3))} ${Number(p[1].toFixed(3))}`;
  const d =
    `M ${r2(S)}` +
    ` C ${r2([S[0] + 2.46 * s.sx, S[1] - 1.72 * s.sy])}, ${r2([C1[0] - 3.2 * s.sx, C1[1]])}, ${r2(C1)}` + // voice rises
    ` C ${r2([C1[0] + 4.2 * s.sx, C1[1]])}, ${r2([T[0] - 4.2 * s.sx, T[1]])}, ${r2(T)}` + // and settles
    ` C ${r2([T[0] + 8 * s.sx, T[1]])}, ${r2([J[0] - u[0] * 9, J[1] - u[1] * 9])}, ${r2(J)}` + // upstroke: the voice becoming a letter
    ` C ${J[0] + dir[0]} ${J[1] + dir[1]}, 84 ${B - 25}, 84 ${B - 37}` + // the eye's lower edge, one long turn
    ` C 84 ${B - 46.5}, 76 ${B - 51.5}, 64 ${B - 51.5}` + // shoulder
    ` C 47 ${B - 51.5}, 34 ${B - 39}, 34 ${B - 21}` + // back of the bowl
    ` C 34 ${B - 7}, 46 ${B}, 62 ${B}` + // returns to the line
    ` C 75 ${B}, 84 ${B - 1.5}, ${s.tailX} ${B - s.tailRise}`; // and stays: the underline
  return { d, waveEnd: T[0] };
}

function symbolOutline(s: SymbolSpec) {
  const { d, waveEnd } = centreline(s);
  const nib = (-35 * Math.PI) / 180; // a gentle broad-nib angle: thick on the down-strokes
  const o = strokeOutline(parseCentreline(d), ({ s: u, L, tan }: { s: number; L: number; tan: number[] }) => {
    const th = Math.atan2(tan[1], tan[0]);
    const w = s.weight * (1 - s.contrast / 2 + s.contrast * Math.abs(Math.sin(th - nib)));
    // The voice is fine and grows into ink as it becomes the letter.
    const r = Math.min(1, L / Math.max(1, waveEnd + 6));
    const ramp = s.ramp + (1 - s.ramp) * (r * r * (3 - 2 * r));
    // The pen lifts slightly at the end of the underline.
    const lift = u > 0.92 ? 1 - (0.1 * (u - 0.92)) / 0.08 : 1;
    return w * ramp * lift;
  }, { step: 0.05, tol: 0.045 });
  return o;
}

// ---------------------------------------------------------------------------
// 2. The wordmark: Literata 500, outlined, optically kerned, shared "tt" bar.
// ---------------------------------------------------------------------------
type Cmd = { type: string; x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number };

async function loadFont() {
  const ttf: Uint8Array = await wawoff.decompress(fs.readFileSync(FONT));
  return opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength));
}

/** Pair adjustments in font units (1000/em), tuned by eye at 48 to 120px. */
const KERN: Record<string, number> = {
  Ea: -14, ar: -4, rl: -6, ly: -16, 'y ': -24, ' L': 0, Le: -34, et: -6, tt: -10, te: -2, er: -6, rs: -10,
};
const TRACK = -4;

function cmdsToD(cmds: Cmd[], dx: number, dy: number, sc: number) {
  const f = (v: number) => String(Number(v.toFixed(2)));
  const X = (v: number) => f(v * sc + dx);
  const Y = (v: number) => f(-v * sc + dy);
  let d = '';
  for (const c of cmds) {
    if (c.type === 'M') d += `M${X(c.x!)} ${Y(c.y!)}`;
    else if (c.type === 'L') d += `L${X(c.x!)} ${Y(c.y!)}`;
    else if (c.type === 'Q') d += `Q${X(c.x1!)} ${Y(c.y1!)} ${X(c.x!)} ${Y(c.y!)}`;
    else if (c.type === 'C') d += `C${X(c.x1!)} ${Y(c.y1!)} ${X(c.x2!)} ${Y(c.y2!)} ${X(c.x!)} ${Y(c.y!)}`;
    else if (c.type === 'Z') d += 'Z';
  }
  return d;
}

/**
 * Literata's "t" (font units): stem x 110..224, bar y 439..509, left spur to x 33,
 * right arm to x 376, shoulder curve from (33,497) to the stem top (150,675).
 * For the ligature the first t's arm runs on into the second t's stem, and the
 * second t loses its spur: one bar, written in one movement.
 */
function tGlyph(font: any, role: 'first' | 'second' | 'plain'): Cmd[] {
  const cmds: Cmd[] = font.charToGlyph('t').path.commands.map((c: Cmd) => ({ ...c }));
  // opentype.js returns y-down commands from glyph.path? No: glyph.path is in font units, y-up.
  if (role === 'first') {
    for (const c of cmds) if (c.x === 376) c.x = 376 + 160; // run the arm on into the next stem
  }
  if (role === 'second') {
    // Replace spur + shoulder (33,439)->(33,497)->Q..->(150,675) with a short bracket
    // from the bar into the stem: the bar arrives from the left already.
    const out: Cmd[] = [];
    let skip = false;
    for (const c of cmds) {
      if (c.type === 'L' && c.x === 33 && c.y === 439) { skip = true; out.push({ type: 'L', x: 110, y: 509 }); continue; }
      if (skip) {
        if (c.type === 'L' && c.x === 150 && c.y === 675) {
          out.push({ type: 'Q', x1: 120, y1: 560, x: 150, y: 675 });
          skip = false;
        }
        continue;
      }
      out.push(c);
    }
    return out;
  }
  return cmds;
}

async function wordmark(font: any) {
  const text = brand.name;
  const pieces: { cmds: Cmd[]; x: number }[] = [];
  let x = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const g = font.charToGlyph(ch);
    let cmds: Cmd[] = g.path.commands;
    if (ch === 't' && text[i + 1] === 't') cmds = tGlyph(font, 'first');
    else if (ch === 't' && text[i - 1] === 't') cmds = tGlyph(font, 'second');
    pieces.push({ cmds, x });
    x += g.advanceWidth + TRACK + (KERN[ch + (text[i + 1] ?? '')] ?? 0);
  }
  // first t's arm must reach the second stem exactly (110 units into the next glyph)
  const tIdx = text.indexOf('tt');
  if (tIdx >= 0) {
    const reach = pieces[tIdx + 1].x - pieces[tIdx].x + 110 + 20; // 20u overlap into the stem
    for (const c of pieces[tIdx].cmds) if (c.x === 376 + 160) c.x = reach;
  }
  return { pieces, width: x };
}

// ---------------------------------------------------------------------------
// 3. Compose files
// ---------------------------------------------------------------------------
const r2 = (v: number) => Number(v.toFixed(2));

function svgDoc(w: number, h: number, body: string, title: string, extra = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(w)} ${r2(h)}" width="${Math.round(w)}" height="${Math.round(h)}" role="img" aria-label="${title}"${extra}>\n<title>${title}</title>\n${body}\n</svg>\n`;
}

async function main() {
  const font = await loadFont();
  const UPM = font.unitsPerEm; // 1000
  const CAP = font.tables.os2.sCapHeight; // 701

  // --- symbol (master and small), normalised so the line B sits at a known y
  const sym = symbolOutline(MASTER);
  const symS = symbolOutline(SMALL);
  const bb = bbox(sym.segs);
  const bbS = bbox(symS.segs);

  // Symbol file: 4% clear space inside the viewBox, scaled so the file is 240 units wide.
  const symFile = (o: typeof sym, b: ReturnType<typeof bbox>, fill: string, padFrac = 0.06) => {
    const pad = Math.max(b.w, b.h) * padFrac;
    const size = 240 / (b.w + 2 * pad);
    const W = (b.w + 2 * pad) * size, H = (b.h + 2 * pad) * size;
    const d = toD(o.segs, { scale: size, dx: (pad - b.x0) * size, dy: (pad - b.y0) * size });
    return { W, H, d, fill };
  };

  // --- wordmark
  const wm = await wordmark(font);
  // Wordmark file: cap height = 100 units.
  const S = 100 / CAP;
  const asc = 702, desc = 230; // Literata: highest ascender (l/L) ~ 702, y descender ~ -230
  const wPad = 0.12 * CAP * S; // tight; clear space is specified in the presentation
  const wmBody = (fill: string, ox = 0, oy = 0, sc = S) =>
    `<path fill="${fill}" d="${wm.pieces.map((p) => cmdsToD(p.cmds, ox + p.x * sc, oy, sc)).join('')}"/>`;
  const wmW = wm.width * S + 2 * wPad, wmH = (asc + desc) * S + 2 * wPad;

  // --- lockups. Symbol line B sits on the type baseline; the e's bowl is 1.32x cap height.
  // Centreline units -> font units: the bowl spans B-51..B on the centreline.
  const bowl = 51; // centreline height of the e loop
  const k = (1.32 * CAP) / bowl; // font units per centreline unit
  const baseY = (B + 1.1) ; // stroke bottom sits a hair below the line, like a round letter's overshoot
  const symInFont = (o: typeof sym) => (sc: number, ox: number, oy: number) =>
    toD(o.segs, { scale: sc * k, dx: ox - bb.x0 * sc * k, dy: oy - baseY * sc * k });

  const files: Record<string, string> = {};
  const name = brand.name;
  for (const v of Object.keys(VARIANTS) as Variant[]) {
    const fill = VARIANTS[v].fg;
    const suf = v === 'ink' ? '' : `-${v}`;

    // symbol
    const sf = symFile(sym, bb, fill);
    files[`symbol${suf}.svg`] = svgDoc(sf.W, sf.H, `<path fill="${fill}" d="${sf.d}"/>`, name);
    const ss = symFile(symS, bbS, fill);
    files[`symbol-small${suf}.svg`] = svgDoc(ss.W, ss.H, `<path fill="${fill}" d="${ss.d}"/>`, name);

    // wordmark
    files[`wordmark${suf}.svg`] = svgDoc(wmW, wmH, wmBody(fill, wPad, wPad + asc * S), name);

    // horizontal lockup (units: cap height = 100)
    {
      const sc = S;
      const symW = bb.w * k * sc;
      const gap = 0.42 * CAP * sc;
      const top = Math.max(asc * sc, (baseY - bb.y0) * k * sc);
      const pad = wPad;
      const base = pad + top;
      const sx = pad, tx = pad + symW + gap;
      const body = `<path fill="${fill}" d="${symInFont(sym)(sc, sx, base)}"/>\n` + wmBody(fill, tx, base, sc);
      const W = tx + wm.width * sc + pad, H = base + desc * sc + pad;
      files[`lockup-horizontal${suf}.svg`] = svgDoc(W, H, body, name);
    }
    // stacked lockup
    {
      const sc = S;
      const symScale = 1.55; // symbol is bigger when it stands alone above the name
      const symW = bb.w * k * sc * symScale;
      const wmWidth = wm.width * sc;
      const W0 = Math.max(symW, wmWidth);
      const pad = wPad * 2;
      const symTop = pad;
      const symBase = symTop + (baseY - bb.y0) * k * sc * symScale;
      const gap = 0.62 * CAP * sc;
      const textBase = symBase + gap + asc * sc;
      // Optical centre: the e's bowl (centreline x 34 to 84) sits on the name's centre,
      // nudged a quarter back towards the bbox centre so the wave does not hang out.
      const eC = ((59 - bb.x0) / bb.w) * symW;
      const symX = pad + W0 / 2 - (eC * 0.75 + (symW / 2) * 0.25);
      const body = `<path fill="${fill}" d="${symInFont(sym)(sc * symScale, symX, symBase)}"/>\n` +
        wmBody(fill, pad + (W0 - wmWidth) / 2, textBase, sc);
      files[`lockup-stacked${suf}.svg`] = svgDoc(W0 + 2 * pad, textBase + desc * sc + pad, body, name);
    }
  }

  // --- favicon: the micro cut, authored on a 16px grid. The line's stroke is
  // snapped to whole pixel rows, the mark is stretched 12 percent taller so the
  // e keeps an open eye at 16px, and the fill swaps to paper ink in dark chrome.
  {
    const micro = symbolOutline(MICRO);
    const ey = 1.12;
    const st = micro.segs.map((c: number[][]) => c.map((p) => [p[0], B + (p[1] - B) * ey]));
    const bm = bbox(st);
    const sc = 15.2 / bm.w;
    const lineY = 12; // pen is 2px, so the line fills rows 11 and 12 exactly
    const dx = (16 - bm.w * sc) / 2 - bm.x0 * sc;
    const dy = lineY - B * sc;
    const d = toD(st, { scale: sc, dx, dy, dp: 3 });
    const top = bm.y0 * sc + dy, bottom = bm.y1 * sc + dy;
    console.log(`favicon: pen ${(MICRO.weight * sc).toFixed(2)}px, mark rows ${top.toFixed(2)}..${bottom.toFixed(2)}`);
    files['favicon.svg'] =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">\n` +
      `<style>path{fill:${C.ink}}@media (prefers-color-scheme:dark){path{fill:${C.inkDark}}}</style>\n` +
      `<path d="${d}"/>\n</svg>\n`;
  }

  // --- app icon source (rendered to PNG by render.py; opaque, no rounded corners: iOS masks it)
  const icon = (bg: string, fg: string) => {
    const N = 1024;
    const targetW = N * 0.74; // mark width on the canvas
    const sc = targetW / bb.w;
    const h = bb.h * sc;
    const dx = (N - targetW) / 2 - bb.x0 * sc;
    const dy = (N - h) / 2 - bb.y0 * sc + N * 0.012; // optical: a touch low, the e carries the weight up top
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" width="${N}" height="${N}">\n<rect width="${N}" height="${N}" fill="${bg}"/>\n<path fill="${fg}" d="${toD(sym.segs, { scale: sc, dx, dy })}"/>\n</svg>\n`;
  };
  fs.mkdirSync(path.join(OUT, 'src/icon'), { recursive: true });
  // Primary: paper writing on sepia, like a cloth-bound book. Alternate: ink on paper.
  fs.writeFileSync(path.join(OUT, 'src/icon/app-icon.svg'), icon(C.accent, C.paper));
  fs.writeFileSync(path.join(OUT, 'src/icon/app-icon-paper.svg'), icon(C.paper, C.ink));
  fs.writeFileSync(path.join(OUT, 'src/icon/app-icon-dark.svg'), icon(C.paperDark, C.accentDark));

  for (const [f, s] of Object.entries(files)) fs.writeFileSync(path.join(OUT, f), s);

  // --- construction drawing for the presentation: centreline, pen outline, on-curve nodes
  {
    const pad = 6, sc = 8;
    const W = (bb.w + 2 * pad) * sc, H = (bb.h + 2 * pad) * sc;
    const tf = { scale: sc, dx: (pad - bb.x0) * sc, dy: (pad - bb.y0) * sc };
    const cl = parseCentreline(centreline(MASTER).d);
    const clD = 'M' + cl.map((c: number[][], i: number) => (i === 0 ? `${r2(c[0][0] * sc + tf.dx)} ${r2(c[0][1] * sc + tf.dy)}` : '') +
      `C${c.slice(1).map((p) => `${r2(p[0] * sc + tf.dx)} ${r2(p[1] * sc + tf.dy)}`).join(' ')}`).join('');
    const nodes = sym.segs.map((c: number[][]) => `<circle cx="${r2(c[3][0] * sc + tf.dx)}" cy="${r2(c[3][1] * sc + tf.dy)}" r="3.2"/>`).join('');
    const clNodes = cl.map((c: number[][]) => `<rect x="${r2(c[3][0] * sc + tf.dx - 4)}" y="${r2(c[3][1] * sc + tf.dy - 4)}" width="8" height="8"/>`).join('');
    const lineY = r2(B * sc + tf.dy);
    const body =
      `<line x1="0" x2="${r2(W)}" y1="${lineY}" y2="${lineY}" stroke="${C.line}" stroke-width="2"/>` +
      `<path d="${toD(sym.segs, tf)}" fill="${C.accentSoft}" stroke="${C.ink}" stroke-width="1.5"/>` +
      `<path d="${clD}" fill="none" stroke="${C.accent}" stroke-width="2" stroke-dasharray="6 6"/>` +
      `<g fill="${C.ink}">${nodes}</g><g fill="${C.accent}">${clNodes}</g>`;
    fs.writeFileSync(path.join(OUT, 'src/construction.svg'), svgDoc(W, H, body, 'Construction of the symbol'));
  }

  // manifest for the presentation and the renderer
  fs.writeFileSync(path.join(OUT, 'src/manifest.json'), JSON.stringify({
    variants: VARIANTS,
    files: Object.keys(files),
    nodes: { master: sym.nodes, small: symS.nodes },
  }, null, 2));
  console.log(`symbol nodes: master ${sym.nodes}, small ${symS.nodes}; wrote ${Object.keys(files).length} SVGs`);
}

main();
