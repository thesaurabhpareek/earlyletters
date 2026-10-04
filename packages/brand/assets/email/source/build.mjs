// DEPRECATED (Oct 3 2026): the B3 interim lockup and directions A/B were replaced by the primary mark.
// Email logos, avatar and favicons are now built by packages/brand/scripts/build-touchpoints.mjs from
// packages/brand/assets/logo/primary/. This script would overwrite them with retired art, so it refuses to run.
if (!process.env.ALLOW_DEPRECATED_BRAND_BUILD) {
  console.error('Deprecated: run node packages/brand/scripts/build-touchpoints.mjs instead (see docs/brand/BRAND_SYSTEM.md).');
  process.exit(1);
}
// Builds the email-safe logo assets and the interim favicon set.
//
//   node packages/brand/assets/email/source/build.mjs
//
// Interim lockup: the name set in Literata 500 (SIL OFL 1.1, from @fontsource),
// outlined to paths with opentype.js so no font is needed to display it.
// When logo directions A and B land, build-directions.mjs makes email versions
// of those under ../a and ../b. Owner: B3 (docs/brand/EMAIL_IDENTITY.md).
//
// Halo strategy (see EMAIL_IDENTITY.md section 4.4): each PNG is transparent and
// carries a thin contrasting edge drawn under the glyphs. On its intended
// background the edge matches the page and disappears; when a client forces a
// dark (or light) background behind an image it did not swap, the edge keeps
// every letter readable.
import opentype from 'opentype.js';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EMAIL = path.resolve(HERE, '..');
const FAVICON = path.resolve(HERE, '../../favicon');
const ROOT = path.resolve(HERE, '../../../../..');

// Import the name from the one place it lives.
const brandSrc = fs.readFileSync(path.join(ROOT, 'packages/brand/index.ts'), 'utf8');
const NAME = brandSrc.match(/name:\s*'([^']+)'/)[1];

const C = {
  ink: '#2B2722',
  paper: '#FBF8F3',
  accent: '#8A5A3B',
  inkDark: '#F2ECE4',
  paperDark: '#161412',
  accentDark: '#D9A47E',
  onAccentDark: '#1E1612',
};

const font = (w) =>
  opentype.parse(
    fs.readFileSync(path.join(ROOT, `node_modules/@fontsource/literata/files/literata-latin-${w}-normal.woff`)).buffer,
  );
const LIT500 = font(500);
const LIT600 = font(600);

const r = (n) => Math.round(n * 100) / 100;

// ---------- Wordmark ----------
// Display width 160 CSS px. Everything below is in CSS px; PNGs render at 1x and 2x.
const DISPLAY_W = 160;
const PAD = 2; // room for the halo
const TRACK = 0.01; // em, a breath of tracking at small size

function wordmarkPath(size) {
  // Lay glyphs out by hand so tracking applies, kerning from the font.
  const glyphs = LIT500.stringToGlyphs(NAME);
  let x = 0;
  const parts = [];
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    parts.push(g.getPath(x, 0, size).toPathData(2));
    x += (g.advanceWidth / LIT500.unitsPerEm) * size;
    if (i < glyphs.length - 1) {
      x += (LIT500.getKerningValue(g, glyphs[i + 1]) / LIT500.unitsPerEm) * size;
      x += TRACK * size;
    }
  }
  return { d: parts.join(''), advance: x };
}

function bboxOf(d) {
  // Parse numbers pairwise from path data for a tight-enough box (control points included).
  const nums = d.match(/-?\d*\.?\d+/g).map(Number);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    x0 = Math.min(x0, nums[i]); x1 = Math.max(x1, nums[i]);
    y0 = Math.min(y0, nums[i + 1]); y1 = Math.max(y1, nums[i + 1]);
  }
  return { x0, y0, x1, y1 };
}

// Solve font size so the tracked word fills DISPLAY_W minus padding.
const probe = wordmarkPath(100);
const probeBox = bboxOf(probe.d);
const size = r(((DISPLAY_W - 2 * PAD) / (probeBox.x1 - probeBox.x0)) * 100);
const wm = wordmarkPath(size);
const box = bboxOf(wm.d);
// Fixed vertical frame from font metrics so every lockup shares a baseline:
// top = cap height + overshoot, bottom = descender of "y".
const capTop = -0.73 * size;
const descBottom = Math.max(box.y1, 0.24 * size);
const W = DISPLAY_W;
const H = Math.ceil(descBottom - capTop + 2 * PAD);
const tx = r(PAD - box.x0);
const ty = r(PAD - capTop);

function wordmarkSvg({ fill, halo, haloWidth, title }) {
  // Halo: same outline stroked underneath, round joins. Width in CSS px.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}">
  <title>${title}</title>
  <g transform="translate(${tx} ${ty})">
    ${halo ? `<path d="${wm.d}" fill="${halo}" stroke="${halo}" stroke-width="${haloWidth * 2}" stroke-linejoin="round" stroke-opacity="0.92"/>` : ''}
    <path d="${wm.d}" fill="${fill}"/>
  </g>
</svg>
`;
}

const variants = {
  // Dark ink letters, paper-coloured edge: for light backgrounds.
  light: { fill: C.ink, halo: C.paper, haloWidth: Number(process.env.HALO ?? 0.7) },
  // Light ink letters, near-black edge: for dark backgrounds.
  dark: { fill: C.inkDark, halo: C.paperDark, haloWidth: Number(process.env.HALO ?? 0.7) },
};

const write = (f, s) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, s);
  console.log('wrote', path.relative(ROOT, f));
};

async function png(svg, file, scale) {
  const buf = await sharp(Buffer.from(svg), { density: 72 * scale })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
  write(file, buf);
  const m = await sharp(buf).metadata();
  return `${m.width}x${m.height}`;
}

const sizes = {};
for (const [k, v] of Object.entries(variants)) {
  const svg = wordmarkSvg({ ...v, title: NAME });
  write(path.join(EMAIL, `logo-${k}.svg`), svg);
  sizes[`logo-${k}.png`] = await png(svg, path.join(EMAIL, `logo-${k}.png`), 2);
  sizes[`logo-${k}@1x.png`] = await png(svg, path.join(EMAIL, `logo-${k}@1x.png`), 1);
}
// Clean source with no halo, for print, web and the website header.
write(path.join(EMAIL, 'source/wordmark-interim.svg'), wordmarkSvg({ fill: C.ink, title: NAME }));

// ---------- Monogram (favicon, inbox avatar) ----------
// A serif "E" on the accent square. Square, solid background, centred: the shape
// BIMI and Apple Branded Mail both expect (they crop to a circle).
function monogramPath(boxSize, fontScale) {
  const g = LIT600.charToGlyph(NAME[0]);
  const s = boxSize * fontScale;
  const p = g.getPath(0, 0, s);
  const b = p.getBoundingBox();
  const dx = (boxSize - (b.x2 - b.x1)) / 2 - b.x1;
  const dy = (boxSize - (b.y2 - b.y1)) / 2 - b.y1;
  return g.getPath(dx, dy, s).toPathData(2);
}

function monogramSvg({ bg, fg, sizePx = 512, radius = 0, fontScale = 0.62, tinyPs = false }) {
  const d = monogramPath(sizePx, fontScale);
  if (tinyPs) {
    // SVG Tiny Portable/Secure profile for BIMI: no x/y on root, title required, no scripts or external refs.
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" viewBox="0 0 ${sizePx} ${sizePx}">
  <title>${NAME}</title>
  <rect width="${sizePx}" height="${sizePx}" fill="${bg}"/>
  <path d="${d}" fill="${fg}"/>
</svg>
`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">
  <rect width="${sizePx}" height="${sizePx}" rx="${radius}" fill="${bg}"/>
  <path d="${d}" fill="${fg}"/>
</svg>
`;
}

// Inbox avatar (interim). Real BIMI needs a certified mark: see EMAIL_IDENTITY.md section 6.
write(path.join(EMAIL, 'avatar-interim.tiny-ps.svg'), monogramSvg({ bg: C.accent, fg: C.paper, tinyPs: true }));
sizes['avatar-1024.png'] = await png(monogramSvg({ bg: C.accent, fg: C.paper }), path.join(EMAIL, 'avatar-1024.png'), 2);

// Favicon: one SVG that follows the system theme.
{
  const d = monogramPath(64, 0.66);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <style>
    .bg { fill: ${C.accent}; }
    .fg { fill: ${C.paper}; }
    @media (prefers-color-scheme: dark) {
      .bg { fill: ${C.accentDark}; }
      .fg { fill: ${C.onAccentDark}; }
    }
  </style>
  <rect class="bg" width="64" height="64" rx="12"/>
  <path class="fg" d="${d}"/>
</svg>
`;
  write(path.join(FAVICON, 'favicon.svg'), svg);
  // PNG fallbacks use the light scheme (they cannot follow the theme).
  sizes['favicon-32.png'] = await png(
    monogramSvg({ bg: C.accent, fg: C.paper, sizePx: 32, radius: 6, fontScale: 0.7 }),
    path.join(FAVICON, 'favicon-32.png'),
    1,
  );
  // Apple adds its own rounded mask; ship a full-bleed square.
  sizes['apple-touch-icon.png'] = await png(
    monogramSvg({ bg: C.accent, fg: C.paper, sizePx: 180, fontScale: 0.58 }),
    path.join(FAVICON, 'apple-touch-icon.png'),
    1,
  );
  sizes['icon-512.png'] = await png(
    monogramSvg({ bg: C.accent, fg: C.paper, sizePx: 512, fontScale: 0.58 }),
    path.join(FAVICON, 'icon-512.png'),
    1,
  );
  sizes['icon-192.png'] = await png(
    monogramSvg({ bg: C.accent, fg: C.paper, sizePx: 192, fontScale: 0.58 }),
    path.join(FAVICON, 'icon-192.png'),
    1,
  );
  write(
    path.join(FAVICON, 'site.webmanifest'),
    JSON.stringify(
      {
        name: NAME,
        short_name: NAME,
        icons: [
          { src: '/favicon/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/favicon/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        theme_color: C.paper,
        background_color: C.paper,
        display: 'browser',
      },
      null,
      2,
    ) + '\n',
  );
}

write(
  path.join(EMAIL, 'manifest.json'),
  JSON.stringify(
    {
      note: 'Interim typographic lockup. Replace with direction A or B when chosen. Built by source/build.mjs.',
      displayWidthPx: W,
      displayHeightPx: H,
      fontSizePx: size,
      files: sizes,
      alt: NAME,
      hostedAt: 'https://earlyletters.com/email/',
    },
    null,
    2,
  ) + '\n',
);
console.log({ W, H, size, sizes });
