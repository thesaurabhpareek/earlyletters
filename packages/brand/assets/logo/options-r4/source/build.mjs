// Logo options R4: builds B, C, D and the profile images from the approved primary drawings.
// Run: node packages/brand/assets/logo/options-r4/source/build.mjs
// Needs sharp (devDependency of @scribe/brand). Every shape comes from packages/brand/assets/logo/primary
// (the custom drawing behind D-071) and the outlined EB Garamond wordmark (SIL OFL 1.1). No font glyph is used
// as a mark, no third-party artwork is traced, no stock icon is used.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');
const PRIM = path.resolve(ROOT, '../primary');
const require = createRequire(path.resolve(ROOT, '../../../package.json'));
let sharp;
try { sharp = require('sharp'); } catch { sharp = createRequire(process.env.SHARP_FROM || path.resolve(ROOT, '../../../package.json'))('sharp'); }

// Brand colours (packages/brand/index.ts). Nothing else is used.
const C = {
  ink: '#2B2722', inkDark: '#F2ECE4', paper: '#FBF8F3', paperDark: '#161412',
  accent: '#8A5A3B', accentDeep: '#7F4F30', accentSoft: '#F1E6DC', accentDark: '#D9A47E',
  sepiaTop: '#9A613C', sepiaBottom: '#7F4F30', darkTop: '#2C2926', darkBottom: '#1F1B18',
  inkMuted: '#6B645B',
};

const read = (f) => fs.readFileSync(path.join(PRIM, f), 'utf8');
function loadSymbol(f) {
  const s = read(f);
  const vb = s.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const d = s.match(/ d="([^"]+)"/)[1];
  const [a, b] = d.split('ZM');
  const m = -vb[0];
  return { big: `${a}Z`, small: `M${b}`, bw: vb[2] - 2 * m, bh: vb[3] - 2 * m };
}
const SYM = loadSymbol('symbol.svg');
const SYM_SMALL = loadSymbol('symbol-small.svg');

// Lockup parts (symbol path, wordmark path with its translate).
const lock = read('lockup-horizontal.svg');
const lockPaths = [...lock.matchAll(/<path ([^>]*?) d="([^"]+)"\/>/g)];
const lockSym = lockPaths[0][2];
const lockWordAttrs = lockPaths[1][1];
const lockWordD = lockPaths[1][2];
const lockWordTx = Number(lockWordAttrs.match(/translate\(([-\d.]+)/)[1]);
const [lockBig, lockSmallRaw] = lockSym.split('ZM');
const lockSmall = `M${lockSmallRaw}`;
const LOCK_VB = [-163.5, -868.5, 6394.95, 1332];

// ---------------------------------------------------------------- icon tiles
const grad = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

function markGroup(sym, cx, cy, targetW, cols) {
  const s = targetW / sym.bw;
  const tx = cx - (sym.bw / 2) * s, ty = cy - (sym.bh / 2) * s;
  const big = cols.big, small = cols.small ?? cols.big;
  return `<g transform="translate(${tx} ${ty}) scale(${s})"><path fill="${big}" d="${sym.big}"/><path fill="${small}" d="${sym.small}"/></g>`;
}

function tileSvg(px, { tile, cols, box = 0.56, maskable = false }) {
  const small = px <= 40;
  const sym = small ? SYM_SMALL : SYM;
  const w = px * (small ? Math.max(box, 0.6) : box) * (maskable ? 0.8 : 1);
  const mx = (-4 / 1024) * px, my = (22 / 1024) * px;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}"><defs>${grad('t', tile[0], tile[1])}</defs><rect width="${px}" height="${px}" fill="url(#t)"/>${markGroup(sym, px / 2 + mx, px / 2 + my, w, cols)}</svg>`;
}

async function png(svg, file, opaque = true) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let s = sharp(Buffer.from(svg), { density: 144 });
  if (opaque) s = s.removeAlpha();
  await s.png({ compressionLevel: 9 }).toFile(file);
}
const write = (file, text) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };

// ---------------------------------------------------------------- option definitions
const TILES = {
  sepia: [C.sepiaTop, C.sepiaBottom],
  dark: [C.darkTop, C.darkBottom],
  paper: [C.paper, '#EADCCB'],
  black: ['#000000', '#000000'],
};
const OPTIONS = {
  // A is the approved mark (D-071). Rebuilt here only to make its profile image and to compare on one page.
  A: { name: 'A-approved', tiles: { light: TILES.sepia, dark: TILES.dark, tinted: TILES.black },
       cols: { light: { big: C.paper }, dark: { big: C.accentDark }, tinted: { big: '#FFFFFF' } }, icon: false },
  B: { name: 'B-two-tone', tiles: { light: TILES.dark, dark: TILES.dark, tinted: TILES.black },
       cols: { light: { big: C.paper, small: C.accentDark }, dark: { big: C.paper, small: C.accentDark }, tinted: { big: '#FFFFFF' } }, icon: true },
  D: { name: 'D-paper', tiles: { light: TILES.paper, dark: TILES.dark, tinted: TILES.black },
       cols: { light: { big: C.accentDeep }, dark: { big: C.accentDark }, tinted: { big: '#FFFFFF' } }, icon: true },
};
const IOS = [16, 29, 32, 40, 48, 58, 60, 80, 87, 120, 152, 167, 180, 192, 512];

// ---------------------------------------------------------------- lockups
function lockupSvg(kind, mode) {
  // kind: 'A' | 'B' | 'C' | 'D'; mode: 'ink' (on light) | 'reversed' (on dark)
  const dark = mode === 'reversed';
  const word = dark ? C.inkDark : C.ink;
  let bigC, smallC;
  if (kind === 'B') { bigC = dark ? C.inkDark : C.ink; smallC = dark ? C.accentDark : C.accent; }
  else if (kind === 'D') { bigC = smallC = dark ? C.accentDark : C.accentDeep; }
  else { bigC = smallC = word; }
  const markP = (transform = '') => `<g${transform}><path fill="${bigC}" d="${lockBig}Z"/><path fill="${smallC}" d="${lockSmall}"/></g>`;
  let vb = LOCK_VB.slice();
  let body = markP() + `<path fill="${word}" transform="translate(${lockWordTx} 0)" d="${lockWordD}"/>`;
  let label = 'Early Letters';
  if (kind === 'C') {
    // The name itself in quotation marks: opening mark, the wordmark, the same mark turned 180 degrees.
    const cx = 375.5, cy = -337.3, left = 3.95, wordEnd = lockWordTx + 4902.9, gap = 330;
    const tx = wordEnd + gap - left;
    body += markP(` transform="translate(${tx} 0) rotate(180 ${cx} ${cy})"`);
    vb[2] = wordEnd + gap + (747.04 - left) + 163.5 - vb[0];
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>`;
}

async function buildLockups(kind, dir) {
  for (const mode of ['ink', 'reversed']) {
    const svg = lockupSvg(kind, mode);
    const [, , vw, vh] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    write(path.join(dir, `lockup-horizontal${mode === 'reversed' ? '-reversed' : ''}.svg`), svg + '\n');
    for (const h of [32, 48, 64, 96]) {
      const w = Math.round((vw / vh) * h);
      await png(svg.replace('<svg ', `<svg width="${w}" height="${h}" `), path.join(dir, 'web', `header-${mode}-h${h}.png`), false);
    }
    // Email header: 28 px tall at 1x, 56 at 2x, transparent, light and dark.
    for (const [h, tag] of [[28, '@1x'], [56, '']]) {
      const w = Math.round((vw / vh) * h);
      await png(svg.replace('<svg ', `<svg width="${w}" height="${h}" `), path.join(dir, 'email', `logo-${mode === 'ink' ? 'light' : 'dark'}${tag}.png`), false);
    }
  }
}

// ---------------------------------------------------------------- symbol files (vector)
function symbolSvg(sym, cols, label = 'Early Letters symbol') {
  const m = 41.19;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-m} ${-m} ${sym.bw + 2 * m} ${sym.bh + 2 * m}" role="img" aria-label="${label}"><title>${label}</title><path fill="${cols.big}" d="${sym.big}"/><path fill="${cols.small ?? cols.big}" d="${sym.small}"/></svg>\n`;
}
function faviconSvg(cols) {
  const m = 44.65; const s = SYM_SMALL;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-m} ${-m} ${s.bw + 2 * m} ${s.bh + 2 * m}"><style>path{fill:${cols.light}}@media (prefers-color-scheme:dark){path{fill:${cols.dark}}}</style><path d="${s.big}"/><path d="${s.small}"/></svg>\n`;
}

// ---------------------------------------------------------------- build one icon option
async function buildIcons(key, dir) {
  const o = OPTIONS[key];
  const sets = [['', 'light'], ['-dark', 'dark']];
  // App Store masters: opaque RGB, no alpha.
  await png(tileSvg(1024, { tile: o.tiles.light, cols: o.cols.light }), path.join(dir, 'app', 'app-icon-1024.png'));
  await png(tileSvg(1024, { tile: o.tiles.dark, cols: o.cols.dark }), path.join(dir, 'app', 'app-icon-dark-1024.png'));
  await png(tileSvg(1024, { tile: o.tiles.tinted, cols: o.cols.tinted }), path.join(dir, 'app', 'app-icon-tinted-1024.png'));
  for (const px of IOS) {
    for (const [suffix, mode] of sets) {
      await png(tileSvg(px, { tile: o.tiles[mode], cols: o.cols[mode] }), path.join(dir, 'app', 'png', `icon-${px}${suffix}.png`));
    }
  }
  // Web: favicon SVG (follows colour scheme), PNG fallbacks, apple touch, manifest, maskable.
  const fav = key === 'B' ? { light: C.accentDeep, dark: C.accentDark } : { light: C.accentDeep, dark: C.accentDark };
  write(path.join(dir, 'web', 'favicon.svg'), faviconSvg(fav));
  for (const px of [16, 32, 48]) await png(tileSvg(px, { tile: o.tiles.light, cols: o.cols.light }), path.join(dir, 'web', `favicon-${px}.png`));
  await png(tileSvg(180, { tile: o.tiles.light, cols: o.cols.light }), path.join(dir, 'web', 'apple-touch-icon.png'));
  await png(tileSvg(192, { tile: o.tiles.light, cols: o.cols.light }), path.join(dir, 'web', 'icon-192.png'));
  await png(tileSvg(512, { tile: o.tiles.light, cols: o.cols.light }), path.join(dir, 'web', 'icon-512.png'));
  await png(tileSvg(512, { tile: o.tiles.light, cols: o.cols.light, maskable: true }), path.join(dir, 'web', 'icon-512-maskable.png'));
  // Vector symbols.
  write(path.join(dir, 'symbol.svg'), symbolSvg(SYM, { big: key === 'B' ? C.ink : C.accentDeep, small: key === 'B' ? C.accent : undefined }));
  write(path.join(dir, 'symbol-reversed.svg'), symbolSvg(SYM, { big: key === 'B' ? C.inkDark : C.accentDark, small: key === 'B' ? C.accentDark : undefined }));
  write(path.join(dir, 'symbol-small.svg'), symbolSvg(SYM_SMALL, { big: key === 'B' ? C.ink : C.accentDeep, small: key === 'B' ? C.accent : undefined }));
}

// ---------------------------------------------------------------- profile images (Google Account, email, social)
// Full-bleed square: the platform crops it to a circle, so the mark sits inside the central 46 percent.
async function buildProfiles() {
  const dir = path.join(ROOT, 'profile');
  for (const key of ['A', 'B', 'D']) {
    const o = OPTIONS[key];
    for (const px of [1024, 512, 250]) {
      const svg = tileSvg(px, { tile: o.tiles.light, cols: o.cols.light, box: 0.46 });
      await png(svg, path.join(dir, `earlyletters-profile-${o.name}-${px}.png`));
    }
  }
}

// ---------------------------------------------------------------- run
const only = process.argv[2];
const jobs = [];
if (!only || only === 'B') jobs.push(buildIcons('B', path.join(ROOT, OPTIONS.B.name)), buildLockups('B', path.join(ROOT, OPTIONS.B.name)));
if (!only || only === 'C') jobs.push(buildLockups('C', path.join(ROOT, 'C-quoted-name')));
if (!only || only === 'D') jobs.push(buildIcons('D', path.join(ROOT, OPTIONS.D.name)), buildLockups('D', path.join(ROOT, OPTIONS.D.name)));
jobs.push(buildProfiles());
await Promise.all(jobs);
console.log('options-r4 built');
