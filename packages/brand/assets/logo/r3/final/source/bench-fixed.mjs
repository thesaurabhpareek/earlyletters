// PATCHED COPY of r2/icon-craft/bench.mjs (Oct 3 2026, color-type). Three changes only (third: an export line at the end): escaped the backticks
// around bench/COMPARE_V1.png in writeIndex (the original fails to parse: SyntaxError), and repointed REPO/LOGO/R2
// for this folder depth. Rendering logic is unchanged.
/**
 * icon-craft bench: an honest iOS app icon test bench.
 *
 * Takes any single-colour symbol SVG and renders it the way a parent will meet it:
 * home screen (light, dark, tinted, clear), Settings and Spotlight sizes at 1x/2x/3x,
 * App Store product page and search result, and a notification banner.
 *
 * Usage
 *   node bench.mjs <symbol.svg> [--out dir] [--small symbol-small.svg] [--submitted app-icon-1024.png]
 *                  [--scale 0.56] [--dy 0] [--bg #8A5A3B] [--fg #FBF8F3]
 *                  [--dark-bg #1F1B18] [--dark-fg #D9A47E] [--tint #E3A35A]
 *                  [--bg-svg layer.svg]   (optional full-bleed background art instead of a flat --bg)
 *   node bench.mjs --batch     bench every r2/<slug>/ that has V1_DONE (or V2_DONE) and a symbol.svg
 *   node bench.mjs --calibrate bench round 1 marks a/ and b/
 *
 * How the symbol is used: the SVG is drawn as an ALPHA MASK, so any fill colour in the file is
 * ignored and the bench recolours it per appearance. Its drawn bounds are measured in Chromium
 * (getBBox), so padding baked into the viewBox does not change the size. Size rule: the geometric
 * mean of the bbox (sqrt(w*h)) is `scale` x 1024, capped so the longest side is at most 0.80 x 1024.
 *
 * Honesty notes (see ICON_RULES.md):
 * - Liquid Glass specular, refraction and translucency are APPROXIMATED with a static rim light.
 *   Only Icon Composer, Simulator or a device shows the real thing.
 * - Tinted and clear appearances are simulated from the symbol's alpha, which is also what the
 *   system uses for a layered icon. Real system output differs in exact colour and glass.
 * - Small sizes are downscaled from the 1024 master in Chromium, which is what happens when the
 *   app ships a single-size icon (Icon Composer or "Single Size" asset catalogs).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../../../../..');
const LOGO = resolve(HERE, '../../..');
const R2 = resolve(LOGO, 'r2');

// ---------- playwright (no installs: reuse the shared scratch module or a global one) ----------
async function loadChromium() {
  const tries = [
    process.env.PLAYWRIGHT_MODULE,
    '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules/playwright',
    'playwright',
  ].filter(Boolean);
  for (const t of tries) {
    try {
      const req = createRequire(import.meta.url);
      return req(t).chromium;
    } catch {}
  }
  throw new Error('playwright not found; set PLAYWRIGHT_MODULE to the playwright package path');
}
const CHROMIUM_EXE = existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
  ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;

// ---------- brand (the public name lives only in packages/brand/index.ts) ----------
function readBrand() {
  const src = readFileSync(join(REPO, 'packages/brand/index.ts'), 'utf8');
  const pick = (k) => (src.match(new RegExp(`\\b${k}:\\s*'([^']*)'`)) || [])[1];
  return {
    name: pick('name'), storeName: pick('storeName'), subtitle: pick('subtitle'),
    accent: pick('accent'), paper: pick('paper'), ink: pick('ink'),
    accentDark: pick('accentDark'), paperDark: pick('paperDark'), paperRaisedDark: pick('paperRaisedDark'),
  };
}
const BRAND = readBrand();

// ---------- args ----------
function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--')) {
      const key = k.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) a[key] = true; else { a[key] = next; i++; }
    } else a._.push(k);
  }
  return a;
}

// ---------- geometry ----------
/** iOS icon mask approximated as a superellipse, n = 5 (close to Apple's continuous corner; not Apple's exact curve). */
function squirclePath(size = 1024, n = 5, steps = 240) {
  const r = size / 2;
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    const x = r + r * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
    const y = r + r * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}
const SQ = squirclePath(1024);
const SQ_MASK_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'><path d='${SQ}'/></svg>`)}")`;

const b64 = (s) => Buffer.from(s).toString('base64');
const svgData = (s) => `data:image/svg+xml;base64,${b64(s)}`;

function hexToRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex([r, g, b]) { return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * t)); }
function lum(hex) { const [r, g, b] = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function contrast(a, b) { const L1 = lum(a), L2 = lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); }

// ---------- appearances ----------
/**
 * Each appearance = background paint + foreground colour + glass treatment.
 * default: designer colours. dark: dark ground, accentDark mark (Apple: "use your light icon as the basis").
 * tinted-dark / tinted-light, clear-dark / clear-light: iOS 26+ mono modes, simulated.
 */
function appearances(o) {
  const tint = o.tint;
  return {
    default: { bg: o.bg, bgSvg: o.bgSvg, fg: o.fg, glass: 'solid' },
    dark: { bg: `linear-gradient(180deg, ${mix(o.darkBg, '#ffffff', 0.06)}, ${o.darkBg})`, fg: o.darkFg, glass: 'solid' },
    'tinted-dark': { bg: `linear-gradient(180deg, ${mix('#0c0b0a', tint, 0.22)}, ${mix('#060505', tint, 0.10)})`, fg: mix(tint, '#ffffff', 0.12), glass: 'solid' },
    'tinted-light': { bg: `linear-gradient(180deg, ${mix('#ffffff', tint, 0.20)}, ${mix('#ffffff', tint, 0.34)})`, fg: mix(tint, '#000000', 0.35), glass: 'solid' },
    'clear-dark': { bg: 'rgba(40,40,44,0.38)', fg: 'rgba(255,255,255,0.92)', glass: 'clear' },
    'clear-light': { bg: 'rgba(255,255,255,0.42)', fg: 'rgba(30,30,32,0.78)', glass: 'clear' },
  };
}

// ---------- neighbour icons (generic tiles echoing common App Store colour patterns; no real marks) ----------
// Each glyph is drawn in a 100x100 box. `w` = white glyph on brand tile (in dark mode white glyphs take the brand colour).
const G = {
  bubble: '<path d="M50 22c-19 0-34 12-34 27 0 8 4 15 11 20l-3 11 13-6c4 1 8 2 13 2 19 0 34-12 34-27S69 22 50 22z"/>',
  ring: '<path fill-rule="evenodd" d="M50 20a30 30 0 1 1 0 60a30 30 0 1 1 0-60zm0 14a16 16 0 1 0 0 32a16 16 0 1 0 0-32z"/>',
  dot: '<circle cx="50" cy="50" r="24"/>',
  play: '<path d="M38 28l36 22-36 22z"/>',
  note: '<path d="M62 22v38a11 11 0 1 1-6-10V32l-18 4v30a11 11 0 1 1-6-10V30z"/>',
  book: '<path d="M22 28c10-3 20-2 26 4v44c-6-5-16-6-26-3zM78 28c-10-3-20-2-26 4v44c6-5 16-6 26-3z"/>',
  bookmark: '<path d="M34 20h32v62L50 70 34 82z"/>',
  leaf: '<path d="M26 74C26 40 48 24 78 22c-2 30-18 52-52 52z"/>',
  sun: '<circle cx="50" cy="50" r="15"/><path d="M48 18h4v12h-4zM48 70h4v12h-4zM18 48h12v4H18zM70 48h12v4H70z"/>',
  bars: '<path d="M26 60h8v16h-8zM40 46h8v30h-8zM54 34h8v42h-8zM68 24h8v52h-8z"/>',
  cam: '<path fill-rule="evenodd" d="M30 32h40a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10H30a10 10 0 0 1-10-10V42a10 10 0 0 1 10-10zm20 10a12 12 0 1 0 0 24a12 12 0 1 0 0-24z"/>',
  gear: '<path fill-rule="evenodd" d="M45 18h10l2 9 7 3 8-5 7 7-5 8 3 7 9 2v10l-9 2-3 7 5 8-7 7-8-5-7 3-2 9H45l-2-9-7-3-8 5-7-7 5-8-3-7-9-2V45l9-2 3-7-5-8 7-7 8 5 7-3zM50 38a12 12 0 1 0 0 24a12 12 0 1 0 0-24z"/>',
  pin: '<path d="M50 18c-14 0-24 10-24 23 0 17 24 41 24 41s24-24 24-41c0-13-10-23-24-23zm0 14a9 9 0 1 1 0 18 9 9 0 0 1 0-18z"/>',
  heart: '<path d="M50 78S20 60 20 40c0-10 8-17 16-17 6 0 11 3 14 8 3-5 8-8 14-8 8 0 16 7 16 17 0 20-30 38-30 38z"/>',
  moonish: '<path d="M60 20a32 32 0 1 0 22 46A26 26 0 0 1 60 20z"/>',
  square: '<rect x="26" y="26" width="48" height="48" rx="14" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="50" cy="50" r="11" fill="none" stroke="currentColor" stroke-width="8"/>',
  wave: '<path d="M18 56c8-12 14-12 22 0s14 12 22 0 14-12 22 0v8c-8-12-14-12-22 0s-14 12-22 0-14-12-22 0z"/>',
  cal: '',
  clock: '',
  petals: '',
};
// tile: [label, lightBg, glyphKey, glyphColour, brandColour]
const NEIGHBOURS = [
  ['Messages', 'linear-gradient(180deg,#5BF675,#16C93B)', 'bubble', '#fff', '#34C759'],
  ['Calendar', '#ffffff', 'cal', '#E53B30', '#E53B30'],
  ['Photos', '#ffffff', 'petals', null, '#F7B500'],
  ['Camera', 'linear-gradient(180deg,#e6e6e8,#a9a9ad)', 'cam', '#1d1d1f', '#8e8e93'],
  ['Clock', '#0b0b0c', 'clock', '#fff', '#ff9f0a'],
  ['Weather', 'linear-gradient(180deg,#3d8ef0,#1d63c9)', 'sun', '#ffd75e', '#2f7fe8'],
  ['Notes', 'linear-gradient(180deg,#fff 0 72%,#fff 72%)', 'bars', '#F5C400', '#F5C400'],
  ['Books', 'linear-gradient(180deg,#ffa53a,#ff7a00)', 'book', '#fff', '#ff8a00'],
  ['Journal', 'linear-gradient(160deg,#ffd0f0,#8b6cff)', 'bookmark', '#fff', '#9d7bff'],
  ['Baby Log', 'linear-gradient(180deg,#bfe8e1,#7cc9bd)', 'moonish', '#fff', '#5fbfb0'],
  ['Day Diary', 'linear-gradient(180deg,#4aa7ee,#1f7fd6)', 'bookmark', '#fff', '#3995e6'],
  ['Calm', 'linear-gradient(180deg,#5aa2e8,#2c5fb8)', 'wave', '#fff', '#4b8be0'],
  ['Mindful', '#ff8a3d', 'dot', '#ffd23f', '#ff8a3d'],
  ['Grams', 'linear-gradient(45deg,#f9c847,#f0443a 45%,#c2329b 75%,#7044d6)', 'square', '#fff', '#e1306c'],
  ['Chat', 'linear-gradient(180deg,#5ff07d,#25c043)', 'bubble', '#fff', '#25D366'],
  ['Music', 'linear-gradient(180deg,#ff6f86,#fa233b)', 'note', '#fff', '#fa2d48'],
  ['Maps', 'linear-gradient(135deg,#a5e39a,#f4f1e8 55%,#9ccff5)', 'pin', '#ef4b3c', '#ef4b3c'],
  ['Health', '#ffffff', 'heart', '#ff375f', '#ff375f'],
  ['Podcasts', 'linear-gradient(180deg,#d68cff,#8a2be2)', 'ring', '#fff', '#a45cf0'],
  ['Settings', 'linear-gradient(180deg,#d8d8dc,#8e8e93)', 'gear', '#4a4a4e', '#8e8e93'],
  ['Wallet', '#0b0b0c', 'bars', '#fff', '#ffcc00'],
  ['Translate', 'linear-gradient(180deg,#3a3a3c,#1c1c1e)', 'bubble', '#fff', '#0a84ff'],
  ['Fitness', '#0b0b0c', 'ring', '#a6ff00', '#a6ff00'],
  ['Shop', 'linear-gradient(180deg,#ffffff,#f1f1f1)', 'bars', '#ff9900', '#ff9900'],
  ['Stream', '#e50914', 'play', '#fff', '#e50914'],
  ['Mail', 'linear-gradient(180deg,#58b8ff,#1c7cf2)', 'bubble', '#fff', '#1c7cf2'],
  ['Phone', 'linear-gradient(180deg,#5ff07d,#25c043)', 'dot', '#fff', '#34C759'],
  ['Safari', 'linear-gradient(180deg,#fff,#e9eef5)', 'ring', '#1a8cff', '#1a8cff'],
];

function neighbourGlyph(key, colour, mode, brandColour, tintFg) {
  // colour: glyph colour already resolved for mode
  if (key === 'cal') {
    return `<text x="50" y="34" font-family="Inter" font-weight="600" font-size="15" text-anchor="middle" fill="${colour}">MON</text>
            <text x="50" y="78" font-family="Inter Display, Inter" font-weight="300" font-size="44" text-anchor="middle" fill="${mode === 'default' ? '#111' : (mode === 'dark' ? '#fff' : colour)}">6</text>`;
  }
  if (key === 'clock') {
    const c = mode === 'default' ? '#fff' : colour;
    return `<circle cx="50" cy="50" r="34" fill="${c}"/><path d="M48 26h4v26h-4z" fill="${mode === 'default' ? '#111' : '#000'}"/><path d="M50 49l18 10-2 3-18-10z" fill="${mode === 'default' ? '#ff9f0a' : '#000'}"/>`;
  }
  if (key === 'petals') {
    const cols = ['#F7B500', '#FF6A3D', '#E5398F', '#8A5CF6', '#2F7FE8', '#2FC1DF', '#34C759', '#B5D334'];
    return cols.map((c, i) => {
      const col = mode === 'default' || mode === 'dark' ? c : (mode.startsWith('tinted') || mode.startsWith('clear') ? colour : c);
      const op = mode.startsWith('tinted') || mode.startsWith('clear') ? (0.45 + 0.07 * i) : 0.9;
      return `<ellipse cx="50" cy="31" rx="10" ry="18" fill="${col}" fill-opacity="${op}" transform="rotate(${i * 45} 50 50)"/>`;
    }).join('');
  }
  if (key === 'square') return `<g style="color:${colour}">${G.square}</g>`;
  return `<g fill="${colour}">${G[key]}</g>`;
}

function neighbourTile(n, mode, app) {
  const [label, bg, key, glyph, brand] = n;
  let tileBg, gcol, glass = 'solid';
  if (mode === 'default') { tileBg = bg; gcol = glyph; }
  else if (mode === 'dark') {
    tileBg = 'linear-gradient(180deg,#2c2c2e,#161618)';
    gcol = (glyph === '#fff' || glyph === null) ? brand : glyph;
    if (lum(gcol) < 0.05) gcol = '#c7c7cc'; // dark glyphs would vanish on a dark tile
    if (key === 'cal') gcol = '#ff453a';
  } else if (mode.startsWith('tinted')) {
    tileBg = app[mode].bg; gcol = app[mode].fg;
  } else { tileBg = app[mode].bg; gcol = app[mode].fg; glass = 'clear'; }
  return { label, html: iconShell(tileBg, `<svg viewBox="0 0 100 100" width="100%" height="100%">${neighbourGlyph(key, gcol, mode, brand)}</svg>`, glass) };
}

// ---------- our icon ----------
/** Inner SVG for the symbol: an alpha mask recoloured to `fg`, placed by the measured bbox. */
function symbolLayer(sym, fg, idSuffix) {
  const { data, box } = sym; // box: {x,y,w,h} in 1024 space
  const id = `m${idSuffix}${Math.random().toString(36).slice(2, 7)}`;
  return `<svg viewBox="0 0 1024 1024" width="100%" height="100%" style="position:absolute;inset:0">
    <defs><mask id="${id}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
      <image href="${data}" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" preserveAspectRatio="none"/>
    </mask></defs>
    <rect width="1024" height="1024" fill="${fg}" mask="url(#${id})"/></svg>`;
}

/** Generic icon container: squircle mask + background + content + approximated Liquid Glass rim. */
function iconShell(bg, inner, glass = 'solid', bgSvgData = null, masked = true) {
  const bgLayer = bgSvgData ? `<img src="${bgSvgData}" style="position:absolute;inset:0;width:100%;height:100%">` : '';
  return `<div class="ic ${glass} ${masked ? '' : 'flat'}" style="background:${bg}">${bgLayer}${inner}${masked ? '<i class="rim"></i>' : ''}</div>`;
}

function ourIcon(sym, app, mode, masked = true) {
  const a = app[mode];
  return iconShell(a.bg, symbolLayer(sym, a.fg, mode), a.glass, mode === 'default' && a.bgSvg ? a.bgSvg : null, masked);
}

// ---------- page chrome ----------
const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,"Inter Display",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.ic{position:relative;width:100%;height:100%;-webkit-mask:${SQ_MASK_URL} center/100% 100% no-repeat;mask:${SQ_MASK_URL} center/100% 100% no-repeat;overflow:hidden}
.ic.flat{-webkit-mask:none;mask:none}
.ic.clear{backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4)}
.ic > svg{display:block}
/* Approximated Liquid Glass: a thin light rim top-left, slight shade bottom-right. Static; the real one moves with the device. */
.rim{position:absolute;inset:0;border-radius:23%;pointer-events:none;
  box-shadow: inset 0.012em 0.016em 0 rgba(255,255,255,.42), inset -0.008em -0.012em 0 rgba(0,0,0,.10);
  font-size:inherit}
.ic.clear .rim{box-shadow: inset 0.014em 0.018em 0 rgba(255,255,255,.55), inset -0.01em -0.014em 0 rgba(255,255,255,.12)}
`;

function wallpaper(mode) {
  switch (mode) {
    case 'default': return 'linear-gradient(165deg,#5d8fd0 0%,#8f9fd6 40%,#d39aa8 75%,#e8b08a 100%)';
    case 'dark': return 'radial-gradient(120% 80% at 20% 10%,#2b3550 0%,#121520 55%,#07080c 100%)';
    case 'tinted-dark': return 'radial-gradient(120% 80% at 70% 10%,#3a2c22 0%,#16110d 60%,#080605 100%)';
    case 'tinted-light': return 'linear-gradient(165deg,#f3e6d6,#e9d2b9)';
    case 'clear-dark': return 'radial-gradient(70% 50% at 25% 25%,#c9573a 0%,transparent 70%),radial-gradient(60% 50% at 80% 60%,#2f6f8f 0%,transparent 70%),radial-gradient(80% 60% at 30% 90%,#d9a441 0%,transparent 70%),#1a1612';
    case 'clear-light': return 'radial-gradient(70% 50% at 25% 25%,#f3b29c 0%,transparent 70%),radial-gradient(60% 50% at 80% 60%,#9ccbe0 0%,transparent 70%),radial-gradient(80% 60% at 30% 90%,#f2d38c 0%,transparent 70%),#f4efe8';
  }
}

// iPhone 17 Pro class logical size 402 x 874 pt, rendered at 3x. Home icon 60 pt (documented iPhone app icon size, 180 px @3x).
const PHONE = { w: 402, h: 874, dpr: 3, icon: 60, cols: 4, top: 74, rowPitch: 98 };

function homeScreen(sym, app, mode, ourIndex = 5) {
  const darkLabels = mode === 'tinted-light' || mode === 'clear-light';
  const labelCol = darkLabels ? 'rgba(20,20,20,.86)' : '#fff';
  const tiles = NEIGHBOURS.slice(0, 23).map((n) => neighbourTile(n, mode, app));
  tiles.splice(ourIndex, 0, { label: BRAND.name, html: ourIcon(sym, app, mode), ours: true });
  const grid = tiles.slice(0, 24);
  const dock = NEIGHBOURS.slice(24, 28).map((n) => neighbourTile(n, mode, app));
  const gx = (PHONE.w - PHONE.cols * PHONE.icon) / (PHONE.cols + 1) * 0.0; // margins computed below
  const side = 30, gap = (PHONE.w - 2 * side - PHONE.cols * PHONE.icon) / (PHONE.cols - 1);
  const cell = (t, i) => {
    const c = i % PHONE.cols, r = Math.floor(i / PHONE.cols);
    const x = side + c * (PHONE.icon + gap), y = PHONE.top + r * PHONE.rowPitch;
    return `<div class="app" style="left:${x}px;top:${y}px"><div class="iw" ${t.ours ? 'data-ours="1"' : ''}>${t.html}</div><div class="lb">${t.label}</div></div>`;
  };
  const dockY = PHONE.h - 34 - 92;
  const dockHtml = dock.map((t, i) => `<div class="app" style="left:${side - 12 + 12 + i * (PHONE.icon + gap)}px;top:${dockY + 16}px"><div class="iw">${t.html}</div></div>`).join('');
  const glassDock = darkLabels ? 'rgba(255,255,255,.38)' : 'rgba(255,255,255,.16)';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
  html,body{width:${PHONE.w}px;height:${PHONE.h}px;overflow:hidden}
  .scr{position:relative;width:${PHONE.w}px;height:${PHONE.h}px;background:${wallpaper(mode)};overflow:hidden}
  .app{position:absolute;width:${PHONE.icon}px;display:flex;flex-direction:column;align-items:center}
  .iw{width:${PHONE.icon}px;height:${PHONE.icon}px;font-size:${PHONE.icon}px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.18))}
  .lb{margin-top:6px;font-size:11.5px;font-weight:500;color:${labelCol};white-space:nowrap;letter-spacing:.01em;text-shadow:${darkLabels ? 'none' : '0 0 3px rgba(0,0,0,.35)'}}
  .sb{position:absolute;top:0;left:0;right:0;height:54px;color:${labelCol};font-weight:600;font-size:16.5px}
  .sb .t{position:absolute;left:46px;top:19px}
  .sb .r{position:absolute;right:30px;top:21px;display:flex;gap:6px;align-items:center}
  .di{position:absolute;left:50%;top:11px;width:124px;height:36px;margin-left:-62px;background:#000;border-radius:20px}
  .dock{position:absolute;left:10px;right:10px;bottom:34px;height:92px;border-radius:38px;background:${glassDock};backdrop-filter:blur(24px) saturate(1.6);-webkit-backdrop-filter:blur(24px) saturate(1.6);box-shadow:inset 0 0.5px 0 rgba(255,255,255,.5)}
  .srch{position:absolute;left:50%;transform:translateX(-50%);bottom:${34 + 92 + 14}px;padding:6px 14px;border-radius:999px;background:${glassDock};backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);color:${labelCol};font-size:13px;font-weight:600}
  .hb{position:absolute;bottom:8px;left:50%;width:140px;margin-left:-70px;height:5px;border-radius:3px;background:${labelCol};opacity:.9}
  </style></head><body><div class="scr">
  <div class="sb"><span class="t">9:41</span><span class="r"><svg width="18" height="11" viewBox="0 0 18 11"><g fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="6" rx="1"/><rect x="10" y="2.5" width="3" height="8.5" rx="1"/><rect x="15" y="0" width="3" height="11" rx="1"/></g></svg><svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/><rect x="24" y="4" width="1.6" height="4" rx=".8" fill="currentColor" opacity=".45"/></svg></span></div>
  <div class="di"></div>
  ${grid.map(cell).join('')}
  <div class="srch">Search</div>
  <div class="dock"></div>${dockHtml}
  <div class="hb"></div>
  </div></body></html>`;
}

// ---------- sizes sheet ----------
const SIZES = [
  { pt: 29, use: 'Settings' }, { pt: 40, use: 'Spotlight' }, { pt: 60, use: 'Home screen' },
];

// ---------- measure symbol ----------
async function measureSymbol(page, svgText, opts) {
  // Measure drawn bounds (not the viewBox). Strokes are included via getBBox({stroke:true}) where supported.
  const bbox = await page.evaluate((txt) => {
    document.body.innerHTML = txt;
    const svg = document.querySelector('svg');
    svg.setAttribute('width', '1000'); svg.setAttribute('height', '1000');
    const vb = svg.viewBox.baseVal;
    let b;
    try { b = svg.getBBox({ stroke: true }); } catch { b = svg.getBBox(); }
    return { x: b.x, y: b.y, w: b.width, h: b.height, vb: vb ? { x: vb.x, y: vb.y, w: vb.width, h: vb.height } : null };
  }, svgText);
  // Rewrite the symbol with a tight viewBox so <image> maps exactly to the drawn bounds.
  let tight = svgText.replace(/<svg\b([^>]*)>/, (m, attrs) => {
    attrs = attrs.replace(/\s(viewBox|width|height)="[^"]*"/g, '');
    return `<svg${attrs} viewBox="${bbox.x} ${bbox.y} ${bbox.w} ${bbox.h}" width="${bbox.w}" height="${bbox.h}" preserveAspectRatio="none">`;
  });
  const scale = Number(opts.scale ?? 0.56);
  const gm = Math.sqrt(bbox.w * bbox.h);
  let k = (scale * 1024) / gm;
  const maxSide = Math.max(bbox.w, bbox.h) * k;
  if (maxSide > 0.8 * 1024) k *= (0.8 * 1024) / maxSide;
  const w = bbox.w * k, h = bbox.h * k;
  const dy = Number(opts.dy ?? 0) * 1024;
  const dx = Number(opts.dx ?? 0) * 1024;
  return { data: svgData(tight), box: { x: (1024 - w) / 2 + dx, y: (1024 - h) / 2 + dy, w, h }, raw: bbox, frac: { w: w / 1024, h: h / 1024 } };
}

// ---------- main bench ----------
export async function bench(symbolPath, opts = {}) {
  const out = resolve(opts.out || join(HERE, 'bench', basename(dirname(resolve(symbolPath)))));
  mkdirSync(out, { recursive: true });
  const o = {
    bg: opts.bg || BRAND.accent, fg: opts.fg || BRAND.paper,
    darkBg: opts['dark-bg'] || '#1F1B18', darkFg: opts['dark-fg'] || BRAND.accentDark,
    tint: opts.tint || '#E3A35A',
    bgSvg: opts['bg-svg'] ? svgData(readFileSync(opts['bg-svg'], 'utf8')) : null,
  };
  const app = appearances(o);
  const chromium = await loadChromium();
  const browser = await chromium.launch({ executablePath: CHROMIUM_EXE });
  const log = [];
  try {
    const ctx1 = await browser.newContext({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
    const page = await ctx1.newPage();
    const sym = await measureSymbol(page, readFileSync(symbolPath, 'utf8'), opts);
    const symSmall = opts.small && existsSync(opts.small) ? await measureSymbol(page, readFileSync(opts.small, 'utf8'), opts) : null;
    log.push(`symbol: ${symbolPath}`, `drawn bbox ${sym.raw.w.toFixed(1)} x ${sym.raw.h.toFixed(1)} -> ${(sym.frac.w * 100).toFixed(1)}% x ${(sym.frac.h * 100).toFixed(1)}% of the 1024 canvas (scale ${opts.scale ?? 0.56})`);
    log.push(`contrast default fg/bg ${contrast(o.fg, o.bg).toFixed(2)}:1, dark fg/bg ${contrast(o.darkFg, o.darkBg).toFixed(2)}:1`);

    // 1) 1024 masters: unmasked square (what you ship) and masked previews per appearance.
    const master = async (mode, masked, file, s = sym) => {
      await page.setViewportSize({ width: 1024, height: 1024 });
      const wp = mode.startsWith('clear') ? wallpaper(mode) : (mode === 'default' ? '#ffffff' : '#000');
      await page.setContent(`<!doctype html><html><head><style>${BASE_CSS} body{width:1024px;height:1024px;background:${masked ? wp : 'transparent'}} .w{width:1024px;height:1024px;font-size:1024px}</style></head><body><div class="w">${ourIconFor(s, app, mode, masked)}</div></body></html>`);
      await page.waitForTimeout(60);
      await page.screenshot({ path: join(out, file), omitBackground: false, clip: { x: 0, y: 0, width: 1024, height: 1024 } });
    };
    const ourIconFor = (s, a, mode, masked) => ourIcon(s, a, mode, masked);
    await master('default', false, 'icon-default-1024.png');
    await master('dark', false, 'icon-dark-1024.png');
    for (const m of ['default', 'dark', 'tinted-dark', 'tinted-light', 'clear-dark', 'clear-light']) await master(m, true, `preview-${m}.png`);
    if (symSmall) await master('default', false, 'icon-default-small-cut-1024.png', symSmall);

    // Appearance strip (6 appearances, masked, on their own grounds)
    await page.setViewportSize({ width: 6 * 220, height: 300 });
    const strip = ['default', 'dark', 'tinted-dark', 'tinted-light', 'clear-dark', 'clear-light'];
    await page.setContent(`<!doctype html><html><head><style>${BASE_CSS}
      body{display:flex;gap:0;background:#888;font-size:12px}
      .c{width:220px;height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
      .w{width:150px;height:150px;font-size:150px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.25))}
      .t{font-weight:600;font-size:13px}
    </style></head><body>${strip.map((m) => `<div class="c" style="background:${m === 'default' ? wallpaper('default') : wallpaper(m)}"><div class="w">${ourIcon(sym, app, m)}</div><div class="t" style="color:${m.endsWith('light') || m === 'default' ? '#222' : '#eee'}">${m}${m === 'default' || m === 'dark' ? '' : ' (simulated)'}</div></div>`).join('')}</body></html>`);
    await page.waitForTimeout(80);
    await page.screenshot({ path: join(out, 'appearances.png'), fullPage: true });

    // 2) Home screens at true device scale (402x874 pt @3x)
    const phone = await browser.newContext({ viewport: { width: PHONE.w, height: PHONE.h }, deviceScaleFactor: PHONE.dpr });
    const pp = await phone.newPage();
    for (const m of ['default', 'dark', 'tinted-dark', 'clear-dark']) {
      await pp.setContent(homeScreen(sym, app, m));
      await pp.waitForTimeout(120);
      const name = { default: 'home-light', dark: 'home-dark', 'tinted-dark': 'home-tinted', 'clear-dark': 'home-clear' }[m];
      await pp.screenshot({ path: join(out, `${name}.png`) });
      // native-pixel crop around our icon (3x pixels, no resampling)
      const r = await pp.evaluate(() => { const e = document.querySelector('[data-ours]').getBoundingClientRect(); return { x: e.x, y: e.y, w: e.width, h: e.height }; });
      await pp.screenshot({ path: join(out, `${name}-crop.png`), clip: { x: Math.max(0, r.x - 100), y: Math.max(0, r.y - 40), width: 260, height: 190 } });
    }
    await phone.close();

    // 3) Sizes: 29/40/60 pt at 1x/2x/3x, downscaled from the 1024 master; plus 8x magnified 1x renders.
    const masterUrl = 'data:image/png;base64,' + readFileSync(join(out, 'icon-default-1024.png')).toString('base64');
    const masterDarkUrl = 'data:image/png;base64,' + readFileSync(join(out, 'icon-dark-1024.png')).toString('base64');
    const smallUrl = symSmall ? 'data:image/png;base64,' + readFileSync(join(out, 'icon-default-small-cut-1024.png')).toString('base64') : null;
    const raster = async (url, px, file, bgc) => {
      await page.setViewportSize({ width: px + 8, height: px + 8 });
      await page.setContent(`<!doctype html><html><head><style>${BASE_CSS} body{background:${bgc};padding:4px} .m{width:${px}px;height:${px}px;-webkit-mask:${SQ_MASK_URL} center/100% 100%;mask:${SQ_MASK_URL} center/100% 100%} img{width:${px}px;height:${px}px;display:block}</style></head><body><div class="m"><img src="${url}"></div></body></html>`);
      await page.waitForTimeout(40);
      await page.screenshot({ path: join(out, file), clip: { x: 4, y: 4, width: px, height: px } });
    };
    const sizeFiles = [];
    for (const s of SIZES) for (const k of [1, 2, 3]) {
      const px = s.pt * k;
      await raster(masterUrl, px, `size-${s.pt}@${k}x.png`, '#f2f2f7'); sizeFiles.push({ ...s, k, px, file: `size-${s.pt}@${k}x.png` });
      await raster(masterDarkUrl, px, `size-${s.pt}@${k}x-dark.png`, '#000');
    }
    for (const px of [16, 29, 40]) { await raster(masterUrl, px, `px-${px}.png`, '#f2f2f7'); if (smallUrl) await raster(smallUrl, px, `px-${px}-smallcut.png`, '#f2f2f7'); }
    const b64f = (f) => 'data:image/png;base64,' + readFileSync(join(out, f)).toString('base64');
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.setContent(`<!doctype html><html><head><style>${BASE_CSS}
      body{background:#f2f2f7;padding:24px;color:#111;font-size:13px}
      h2{font-size:15px;margin:0 0 10px} .row{display:flex;gap:28px;align-items:flex-end;margin-bottom:22px;flex-wrap:wrap}
      .c{display:flex;flex-direction:column;align-items:center;gap:6px} .px{image-rendering:pixelated}
      .k{background:#000;color:#ddd;padding:14px 24px;border-radius:12px;margin-bottom:22px} .k h2{color:#fff}
      .note{color:#555;font-size:12px;margin-top:-10px;margin-bottom:18px}
      </style></head><body>
      <h2>Exact device pixels (light Settings ground). Each image is shown at 1 CSS px = 1 device px.</h2>
      <div class="row">${sizeFiles.map((f) => `<div class="c"><img src="${b64f(f.file)}" width="${f.px}" height="${f.px}"><div>${f.pt}pt @${f.k}x = ${f.px}px<br>${f.use}</div></div>`).join('')}</div>
      <div class="k"><h2>Dark appearance, same pixels</h2><div class="row">${sizeFiles.map((f) => `<div class="c"><img src="${b64f(f.file.replace('.png', '-dark.png'))}" width="${f.px}" height="${f.px}"><div>${f.px}px</div></div>`).join('')}</div></div>
      <h2>8x magnified, nearest neighbour (what the pixels really are)</h2>
      <div class="row">${[16, 29, 40].map((px) => `<div class="c"><img class="px" src="${b64f(`px-${px}.png`)}" width="${px * 8}" height="${px * 8}"><div>${px}px from 1024 master</div></div>`).join('')}
      ${smallUrl ? [16, 29, 40].map((px) => `<div class="c"><img class="px" src="${b64f(`px-${px}-smallcut.png`)}" width="${px * 8}" height="${px * 8}"><div>${px}px from symbol-small</div></div>`).join('') : ''}</div>
      ${smallUrl ? '<div class="note">symbol-small rows only reach a device if the app ships an asset catalog with All Sizes. An Icon Composer .icon is one master; the system scales it.</div>' : ''}
      </body></html>`);
    await page.waitForTimeout(100);
    await page.screenshot({ path: join(out, 'sizes.png'), fullPage: true });

    // Settings and Spotlight in context, rendered at 3x
    const ctx3 = await browser.newContext({ viewport: { width: 402, height: 420 }, deviceScaleFactor: 3 });
    const p3 = await ctx3.newPage();
    const row = (iconHtml, label, pt) => `<div class="r"><div class="i" style="width:${pt}px;height:${pt}px;font-size:${pt}px">${iconHtml}</div><div class="l">${label}</div><div class="ch">›</div></div>`;
    for (const dark of [false, true]) {
      const md = dark ? 'dark' : 'default';
      const nb = (i) => neighbourTile(NEIGHBOURS[i], md, app).html;
      await p3.setContent(`<!doctype html><html><head><style>${BASE_CSS}
        body{background:${dark ? '#000' : '#f2f2f7'};color:${dark ? '#fff' : '#000'};padding:14px 16px}
        .h{font-size:13px;color:${dark ? '#8e8e93' : '#6d6d72'};margin:6px 14px 6px;text-transform:uppercase}
        .g{background:${dark ? '#1c1c1e' : '#fff'};border-radius:22px;padding:4px 0;margin-bottom:16px}
        .r{display:flex;align-items:center;gap:14px;padding:8px 16px;min-height:46px}
        .r+.r{border-top:0.5px solid ${dark ? '#38383a' : '#d1d1d6'};margin-left:0}
        .l{flex:1;font-size:17px} .ch{color:#c7c7cc;font-size:22px}
        .sp{display:flex;align-items:center;gap:12px;padding:10px 14px}
        .sp .t{font-size:16px;font-weight:600}.sp .s{font-size:13px;color:#8e8e93}
        </style></head><body>
        <div class="h">Apps (Settings, 29 pt)</div>
        <div class="g">${row(nb(5), 'Weather', 29)}${row(ourIcon(sym, app, md), BRAND.name, 29)}${row(nb(14), 'Chat', 29)}</div>
        <div class="h">Search (Spotlight, 40 pt)</div>
        <div class="g"><div class="sp"><div style="width:40px;height:40px;font-size:40px">${ourIcon(sym, app, md)}</div><div><div class="t">${BRAND.name}</div><div class="s">App</div></div></div>
        <div class="sp"><div style="width:40px;height:40px;font-size:40px">${nb(8)}</div><div><div class="t">Journal</div><div class="s">App</div></div></div></div>
        </body></html>`);
      await p3.waitForTimeout(80);
      await p3.screenshot({ path: join(out, `settings-spotlight${dark ? '-dark' : ''}.png`) });
    }

    // 4) App Store: product page header and search result (@3x)
    await p3.setViewportSize({ width: 402, height: 640 });
    for (const dark of [false, true]) {
      const md = dark ? 'dark' : 'default';
      const fg = dark ? '#fff' : '#000', sub = '#8e8e93', bgc = dark ? '#000' : '#fff';
      const shot = (c) => `<div style="flex:0 0 118px;height:240px;border-radius:16px;background:${c};border:0.5px solid ${dark ? '#333' : '#e5e5ea'}"></div>`;
      await p3.setContent(`<!doctype html><html><head><style>${BASE_CSS}
        body{background:${bgc};color:${fg};padding:16px 18px}
        .pp{display:flex;gap:16px;align-items:flex-start;padding-bottom:16px;border-bottom:0.5px solid ${dark ? '#333' : '#e5e5ea'}}
        .nm{font-size:22px;font-weight:700;line-height:1.15}.st{font-size:15px;color:${sub};margin-top:3px}
        .get{display:inline-block;margin-top:14px;background:#0a84ff;color:#fff;font-weight:700;font-size:15px;padding:6px 22px;border-radius:999px}
        .get2{background:${dark ? '#2c2c2e' : '#f0f0f5'};color:#0a84ff;font-weight:700;font-size:15px;padding:6px 20px;border-radius:999px}
        .lbl{font-size:12px;color:${sub};text-transform:uppercase;margin:18px 0 10px}
        .sr{display:flex;gap:12px;align-items:center}.sr .t{flex:1;min-width:0}.sr .n{font-size:16px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sr .s{font-size:13px;color:${sub}}
        .shots{display:flex;gap:8px;margin-top:12px}
      </style></head><body>
      <div class="lbl" style="margin-top:4px">Product page (icon about 118 pt, unverified)</div>
      <div class="pp"><div style="width:118px;height:118px;font-size:118px;flex:none;box-shadow:0 0 0 0.5px rgba(0,0,0,.08);border-radius:26px">${ourIcon(sym, app, md)}</div>
        <div><div class="nm">${BRAND.storeName}</div><div class="st">${BRAND.subtitle}</div><div class="get">Get</div></div></div>
      <div class="lbl">Search result (icon about 64 pt, unverified)</div>
      <div class="sr"><div style="width:64px;height:64px;font-size:64px;flex:none">${ourIcon(sym, app, md)}</div><div class="t"><div class="n">${BRAND.storeName}</div><div class="s">${BRAND.subtitle}</div></div><div class="get2">Get</div></div>
      <div class="shots">${shot(dark ? BRAND.paperRaisedDark : BRAND.paper)}${shot(dark ? BRAND.paperRaisedDark : BRAND.paper)}${shot(dark ? BRAND.paperRaisedDark : BRAND.paper)}</div>
      <div class="sr" style="margin-top:18px"><div style="width:64px;height:64px;font-size:64px;flex:none">${neighbourTile(NEIGHBOURS[8], md, app).html}</div><div class="t"><div class="n">Journal app (neighbour)</div><div class="s">Category competitor tile</div></div><div class="get2">Get</div></div>
      </body></html>`);
      await p3.waitForTimeout(80);
      await p3.screenshot({ path: join(out, `appstore${dark ? '-dark' : ''}.png`) });
    }

    // 5) Notification banner on lock screen (@3x). Icon about 38 pt in iOS 18+ banners (unverified).
    await p3.setViewportSize({ width: 402, height: 300 });
    for (const dark of [false, true]) {
      const md = dark ? 'dark' : 'default';
      await p3.setContent(`<!doctype html><html><head><style>${BASE_CSS}
        body{background:${wallpaper(dark ? 'dark' : 'default')};padding:16px 10px;height:300px}
        .n{display:flex;gap:12px;align-items:center;padding:14px 14px;border-radius:26px;background:${dark ? 'rgba(40,40,44,.55)' : 'rgba(255,255,255,.55)'};backdrop-filter:blur(30px) saturate(1.8);-webkit-backdrop-filter:blur(30px) saturate(1.8);color:${dark ? '#fff' : '#000'};margin-bottom:10px;box-shadow:inset 0 .5px 0 rgba(255,255,255,.5)}
        .t{flex:1;min-width:0}.a{font-size:15px;font-weight:600;display:flex;justify-content:space-between}.a span{font-weight:400;font-size:13px;opacity:.6}
        .b{font-size:15px;line-height:1.3}
        .tm{color:#fff;text-align:center;font-family:'Inter Display',Inter;font-weight:600;font-size:64px;margin:4px 0 16px;opacity:.95}
      </style></head><body>
      <div class="tm">9:41</div>
      <div class="n"><div style="width:38px;height:38px;font-size:38px;flex:none">${ourIcon(sym, app, md)}</div><div class="t"><div class="a">${BRAND.name}<span>now</span></div><div class="b">A quiet minute for Asha? One small thing from today.</div></div></div>
      <div class="n"><div style="width:38px;height:38px;font-size:38px;flex:none">${neighbourTile(NEIGHBOURS[0], md, app).html}</div><div class="t"><div class="a">Messages<span>2m ago</span></div><div class="b">See you at six.</div></div></div>
      </body></html>`);
      await p3.waitForTimeout(80);
      await p3.screenshot({ path: join(out, `notification${dark ? '-dark' : ''}.png`) });
    }
    await ctx3.close();

    // 6) Submitted icon (if any) vs bench composition, side by side
    if (opts.submitted && existsSync(opts.submitted)) {
      const subUrl = 'data:image/png;base64,' + readFileSync(opts.submitted).toString('base64');
      const { size, mode: pngMode } = await pngInfo(opts.submitted);
      log.push(`submitted icon: ${opts.submitted} (${size}, ${pngMode})`);
      await page.setViewportSize({ width: 760, height: 420 });
      await page.setContent(`<!doctype html><html><head><style>${BASE_CSS} body{background:#f2f2f7;display:flex;gap:40px;padding:30px;font-size:13px}
        .m{width:320px;height:320px;-webkit-mask:${SQ_MASK_URL} center/100% 100%;mask:${SQ_MASK_URL} center/100% 100%} img{width:320px;height:320px}</style></head><body>
        <div><div class="m"><img src="${subUrl}"></div><p>Designer's app-icon-1024.png (${pngMode})</p></div>
        <div><div class="m"><img src="${masterUrl}"></div><p>Bench composition from symbol.svg</p></div></body></html>`);
      await page.waitForTimeout(60);
      await page.screenshot({ path: join(out, 'submitted-vs-bench.png') });
    }

    // 7) Contact sheet + index.html
    const files = ['appearances.png', 'home-light.png', 'home-dark.png', 'home-tinted.png', 'home-clear.png', 'sizes.png',
      'settings-spotlight.png', 'settings-spotlight-dark.png', 'appstore.png', 'appstore-dark.png', 'notification.png', 'notification-dark.png'];
    if (existsSync(join(out, 'submitted-vs-bench.png'))) files.push('submitted-vs-bench.png');
    writeFileSync(join(out, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><title>Icon bench</title><style>body{font-family:Inter,system-ui;background:#eee;margin:24px}img{max-width:100%;display:block;margin:6px 0 28px;box-shadow:0 1px 4px rgba(0,0,0,.2)}.ph{max-width:402px}</style></head><body>
      <h1>Icon bench: ${basename(dirname(resolve(symbolPath)))}</h1><pre>${log.join('\n')}</pre>
      ${files.map((f) => `<h3>${f}</h3><img class="${f.startsWith('home') ? 'ph' : ''}" src="${f}">`).join('')}</body></html>`);
    // contact sheet: home light / dark / tinted side by side at 1x
    await page.setViewportSize({ width: 402 * 4 + 50, height: 874 + 20 });
    await page.setContent(`<!doctype html><html><head><style>body{margin:0;padding:10px;background:#222;display:flex;gap:10px}img{width:402px;height:874px;border-radius:40px}</style></head><body>${['home-light', 'home-dark', 'home-tinted', 'home-clear'].map((f) => `<img src="${b64f(f + '.png')}">`).join('')}</body></html>`);
    await page.waitForTimeout(100);
    await page.screenshot({ path: join(out, 'sheet-home.png') });
    writeFileSync(join(out, 'bench.log'), log.join('\n') + '\n');
    await ctx1.close();
  } finally {
    await browser.close();
  }
  return { out, log };
}

async function pngInfo(p) {
  const buf = readFileSync(p);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20), ct = buf[25];
  const mode = { 0: 'grey', 2: 'RGB opaque (no alpha channel)', 3: 'palette', 4: 'grey+alpha', 6: 'RGBA (has alpha channel: App Store rejects)' }[ct] || `colour type ${ct}`;
  return { size: `${w}x${h}`, mode };
}

// ---------- batch helpers ----------
function benchArgsFor(dir) {
  const a = { submitted: existsSync(join(dir, 'app-icon-1024.png')) ? join(dir, 'app-icon-1024.png') : undefined };
  if (existsSync(join(dir, 'symbol-small.svg'))) a.small = join(dir, 'symbol-small.svg');
  return a;
}

function writeIndex() {
  const dirs = existsSync(join(HERE, 'bench')) ? readdirSync(join(HERE, 'bench')).filter((d) => statSync(join(HERE, 'bench', d)).isDirectory()).sort() : [];
  const rows = dirs.map((d) => {
    const log = existsSync(join(HERE, 'bench', d, 'bench.log')) ? readFileSync(join(HERE, 'bench', d, 'bench.log'), 'utf8').trim().split('\n') : [];
    const when = existsSync(join(HERE, 'bench', d, 'bench.log')) ? statSync(join(HERE, 'bench', d, 'bench.log')).mtime.toISOString().slice(0, 16).replace('T', ' ') : '';
    return `| \`${d}\` | ${when} UTC | ${log.slice(1).join('<br>')} | [index.html](bench/${d}/index.html) |`;
  });
  const notes = existsSync(join(HERE, 'BENCH_NOTES.md')) ? readFileSync(join(HERE, 'BENCH_NOTES.md'), 'utf8') : '';
  writeFileSync(join(HERE, 'BENCH_INDEX.md'), `# Icon bench index

Generated by \`node bench.mjs --batch\` (do not edit by hand; notes live in BENCH_NOTES.md and are appended below).
Rules and what is verified: [ICON_RULES.md](ICON_RULES.md).

Every concept is composed the same way from its own \`symbol.svg\`: paper #FBF8F3 mark on sepia #8A5A3B (default), accentDark #D9A47E on warm near-black (dark), simulated tinted and clear. Mark sized by drawn bounds (geometric mean 56 percent of canvas, longest side capped at 80 percent). If a designer shipped \`app-icon-1024.png\`, \`submitted-vs-bench.png\` shows both.

## Files
- \`bench/COMPARE_V1.png\`: every concept in default, dark, tinted, clear, 29 px and 16 px on one sheet (made with ImageMagick from the folders below).
- \`sheet-home.png\`: four home screens side by side (light, dark, tinted, clear), 1x. Start here.
- \`home-light.png\`, \`home-dark.png\`, \`home-tinted.png\`, \`home-clear.png\`: true device scale, 402x874 pt @3x (1206x2622 px). \`*-crop.png\`: native 3x pixels around the icon.
- \`appearances.png\`: the six iOS appearances.
- \`sizes.png\`: 29/40/60 pt at 1x/2x/3x on light and dark, plus 16/29/40 px magnified 8x (and the designer's small cut if supplied).
- \`settings-spotlight(-dark).png\`, \`appstore(-dark).png\`, \`notification(-dark).png\`: in context at 3x.
- \`icon-default-1024.png\`, \`icon-dark-1024.png\`: unmasked opaque masters as composed by the bench.

## Benched
| Folder | Benched | Measurements | View |
|---|---|---|---|
${rows.join('\n')}

${notes}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.calibrate) {
    for (const s of ['a', 'b']) {
      const dir = join(LOGO, s);
      const r = await bench(join(dir, 'symbol.svg'), { ...benchArgsFor(dir), ...args, out: join(HERE, 'bench', `r1-${s}`) });
      console.log(r.out); console.log(r.log.join('\n'));
    }
    writeIndex();
    return;
  }
  if (args.batch) {
    const skip = new Set(['icon-craft', 'wordmark']);
    for (const slug of readdirSync(R2)) {
      const dir = join(R2, slug);
      if (skip.has(slug) || !existsSync(join(dir, 'symbol.svg'))) continue;
      const done = existsSync(join(dir, 'V2_DONE')) ? 'v2' : existsSync(join(dir, 'V1_DONE')) ? 'v1' : null;
      if (!done && !args.all) continue;
      const out = join(HERE, 'bench', done === 'v2' ? `${slug}-v2` : slug);
      if (args.new && existsSync(join(out, 'bench.log'))) {
        const t = statSync(join(out, 'bench.log')).mtimeMs;
        const src = Math.max(...['symbol.svg', 'app-icon-1024.png', 'symbol-small.svg', done === 'v2' ? 'V2_DONE' : 'V1_DONE'].map((f) => existsSync(join(dir, f)) ? statSync(join(dir, f)).mtimeMs : 0));
        if (t > src) continue;
      }
      const r = await bench(join(dir, 'symbol.svg'), { ...benchArgsFor(dir), ...args, out });
      console.log(`${slug} (${done}) -> ${r.out}`);
    }
    writeIndex();
    return;
  }
  if (!args._[0]) { console.error('usage: node bench.mjs <symbol.svg> [--out dir] | --batch | --calibrate'); process.exit(2); }
  const r = await bench(resolve(args._[0]), args);
  console.log(r.out); console.log(r.log.join('\n'));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });

// color-type addition (third change): expose internals for the lineup study. No behaviour change.
export { homeScreen, appearances, measureSymbol, BASE_CSS, neighbourTile, NEIGHBOURS, ourIcon, wallpaper, iconShell, symbolLayer, PHONE };
