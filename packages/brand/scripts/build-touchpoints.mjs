// Touchpoint files built from the primary mark (packages/brand/assets/logo/primary/).
//
//   node packages/brand/scripts/build-touchpoints.mjs        (repo root, after primary/source/build.mjs)
//
// Writes:
//   assets/email/   logo-light.png (2x) + @1x, logo-dark.png (2x) + @1x, logo-light.svg, logo-dark.svg (halo sources),
//                   avatar-1024.png, avatar.tiny-ps.svg (BIMI template, do not publish yet), manifest.json
//   assets/favicon/ favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png, site.webmanifest
//   assets/og/      og-image.png (1200x630)
// Every file here has an id in packages/brand/registry.ts; the registry test fails if one goes missing.
// Name and tagline are read from packages/brand/index.ts (never typed here).
import sharp from 'sharp';
import { createRequire as _cr } from 'node:module';
// CommonJS build on purpose: the ESM build of opentype.js 2.0.0 returns NaN outlines for composite glyphs here.
const opentype = _cr(import.meta.url)('opentype.js');
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRAND = path.resolve(HERE, '..');
const ROOT = path.resolve(BRAND, '../..');
const PRIMARY = path.join(BRAND, 'assets/logo/primary');
const EMAIL = path.join(BRAND, 'assets/email');
const FAVICON = path.join(BRAND, 'assets/favicon');
const OG = path.join(BRAND, 'assets/og');
const req = createRequire(import.meta.url);

const indexSrc = fs.readFileSync(path.join(BRAND, 'index.ts'), 'utf8');
const pick = (k) => indexSrc.match(new RegExp(`\\b${k}:\\s*'([^']*)'`))[1];
const NAME = pick('name');
const TAGLINE = pick('tagline');
const C = {
  ink: pick('ink'), inkMuted: pick('inkMuted'), paper: pick('paper'), accent: pick('accent'), accentDeep: pick('accentDeep'),
  inkDark: pick('inkDark'), paperDark: pick('paperDark'), accentDark: pick('accentDark'), line: pick('line'),
};

const read = (f) => fs.readFileSync(path.join(PRIMARY, f), 'utf8');
const viewBox = (svg) => svg.match(/viewBox="([^"]+)"/)[1].trim().split(/[\s,]+/).map(Number);
const write = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); console.log('wrote', path.relative(ROOT, file)); };
const sizeOf = async (buf) => { const m = await sharp(buf).metadata(); return `${m.width}x${m.height}`; };

// ---------------------------------------------------------------- email header logos
// Display size (CSS px). Height 32 puts the wordmark at a 24 px em, above the 20 px floor for the master cut
// (BRAND_SYSTEM.md, minimum sizes). The lockup's own clear space (0.25 cap height) holds the halo.
export const EMAIL_LOGO_HEIGHT = 32;
const HALO_PX = 0.7; // CSS px, same edge as the B3 interim (EMAIL_IDENTITY.md 4.4)

/** Lockup with every glyph outlined underneath in the opposite surface colour (the Gmail forced-dark halo). */
function haloLockup(src, halo, W, H) {
  const [, , , vh] = viewBox(src);
  const unitsPerPx = vh / H;
  const sw = 2 * HALO_PX * unitsPerPx;
  const body = src
    .replace(/<\/?svg[^>]*>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/, '');
  const under = body.replace(/<path fill="[^"]+"/g, `<path fill="${halo}" fill-opacity="0.92" stroke="${halo}" stroke-opacity="0.92" stroke-width="${Math.round(sw * 100) / 100}" stroke-linejoin="round"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${viewBox(src).join(' ')}" preserveAspectRatio="xMinYMid meet" role="img" aria-label="${NAME}"><title>${NAME}</title>${under}${body}</svg>\n`;
}

async function emailLogos() {
  const light = read('lockup-horizontal.svg');
  const dark = read('lockup-horizontal-reversed.svg');
  const [, , vw, vh] = viewBox(light);
  const H = EMAIL_LOGO_HEIGHT;
  const W = Math.round((H * vw) / vh);
  const files = {};
  for (const [kind, src, halo] of [['light', light, C.paper], ['dark', dark, C.paperDark]]) {
    const svg = haloLockup(src, halo, W, H);
    write(path.join(EMAIL, `logo-${kind}.svg`), svg);
    for (const [suffix, scale] of [['', 2], ['@1x', 1]]) {
      const buf = await sharp(Buffer.from(svg), { density: 72 * scale }).png({ compressionLevel: 9 }).toBuffer();
      write(path.join(EMAIL, `logo-${kind}${suffix}.png`), buf);
      files[`logo-${kind}${suffix}.png`] = await sizeOf(buf);
    }
  }
  // Avatar for Apple Branded Mail / inbox: the default app icon (opaque, 1024, no alpha).
  fs.copyFileSync(path.join(PRIMARY, 'app-icon-1024.png'), path.join(EMAIL, 'avatar-1024.png'));
  console.log('wrote', path.relative(ROOT, path.join(EMAIL, 'avatar-1024.png')));
  files['avatar-1024.png'] = '1024x1024';
  // BIMI SVG Tiny PS template: square, solid accentDeep, paper symbol at the app icon's optical size. Not published.
  const sym = read('symbol.svg');
  const [sx, sy, sw, sh] = viewBox(sym);
  const d = sym.match(/ d="([^"]+)"/)[1];
  const s = (0.6 * 1024) / sh;
  const tx = 512 - (sx + sw / 2) * s, ty = 512 - (sy + sh / 2) * s + 14;
  const bimi = `<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" viewBox="0 0 1024 1024"><title>${NAME}</title><rect width="1024" height="1024" fill="${C.accentDeep}"/><path fill="${C.paper}" transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})" d="${d}"/></svg>\n`;
  write(path.join(EMAIL, 'avatar.tiny-ps.svg'), bimi);
  write(
    path.join(EMAIL, 'manifest.json'),
    JSON.stringify(
      {
        note: 'Built from the primary mark by packages/brand/scripts/build-touchpoints.mjs. Registry ids: email.logo.*, email.avatar, email.bimi.template.',
        source: { light: 'packages/brand/assets/logo/primary/lockup-horizontal.svg', dark: 'packages/brand/assets/logo/primary/lockup-horizontal-reversed.svg' },
        displayWidthPx: W,
        displayHeightPx: H,
        haloPx: HALO_PX,
        alt: NAME,
        files,
        hostedAt: 'https://earlyletters.com/email/',
      },
      null,
      2,
    ) + '\n',
  );
  return { W, H };
}

// ---------------------------------------------------------------- favicon set
async function favicons() {
  fs.mkdirSync(FAVICON, { recursive: true });
  fs.copyFileSync(path.join(PRIMARY, 'favicon.svg'), path.join(FAVICON, 'favicon.svg'));
  for (const [from, to] of [['png/icon-32.png', 'favicon-32.png'], ['png/icon-180.png', 'apple-touch-icon.png'], ['png/icon-192.png', 'icon-192.png'], ['png/icon-512.png', 'icon-512.png']]) {
    fs.copyFileSync(path.join(PRIMARY, from), path.join(FAVICON, to));
    console.log('wrote', path.relative(ROOT, path.join(FAVICON, to)));
  }
  const manifest = {
    name: NAME,
    short_name: NAME,
    icons: [
      { src: '/favicon/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: C.paper,
    background_color: C.paper,
    display: 'browser',
  };
  write(path.join(FAVICON, 'site.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
}

// ---------------------------------------------------------------- OG image
function outlineText(fontFile, text, size) {
  const buf = fs.readFileSync(fontFile);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
  // Laid out glyph by glyph: opentype.js 2.0's string layout returns NaN coordinates for this woff (checked
  // Oct 3 2026). Pair kerning from the font, guarded.
  const k = size / font.unitsPerEm;
  const glyphs = text.split('').map((ch) => font.charToGlyph(ch));
  // Outlines from each glyph's font-unit path, scaled and placed here (getPath() gave NaN in this context).
  const f2 = (n) => (Math.round(n * 100) / 100).toString();
  const parts = [];
  let x = 0, minX = Infinity, maxX = -Infinity;
  glyphs.forEach((g, i) => {
    const X = (v) => { const r = x + v * k; minX = Math.min(minX, r); maxX = Math.max(maxX, r); return f2(r); };
    const Y = (v) => f2(-v * k);
    for (const c of g.path.commands) {
      if (c.type === 'M' || c.type === 'L') parts.push(`${c.type}${X(c.x)} ${Y(c.y)}`);
      else if (c.type === 'Q') parts.push(`Q${X(c.x1)} ${Y(c.y1)} ${X(c.x)} ${Y(c.y)}`);
      else if (c.type === 'C') parts.push(`C${X(c.x1)} ${Y(c.y1)} ${X(c.x2)} ${Y(c.y2)} ${X(c.x)} ${Y(c.y)}`);
      else if (c.type === 'Z') parts.push('Z');
    }
    const kern = i < glyphs.length - 1 ? font.getKerningValue(g, glyphs[i + 1]) : 0;
    x += (g.advanceWidth + (Number.isFinite(kern) ? kern : 0)) * k;
  });
  const d = parts.join('');
  if (/NaN/.test(d)) throw new Error('outlineText: NaN in path');
  return { d, x0: minX, x1: maxX, w: maxX - minX };
}

async function ogImage() {
  const W = 1200, H = 630;
  const lock = read('lockup-stacked.svg');
  const [lx, ly, lw, lh] = viewBox(lock);
  const lockBody = lock.replace(/<\/?svg[^>]*>/g, '').replace(/<title>[\s\S]*?<\/title>/, '');
  const LH = 270; // lockup display height
  const LW = (LH * lw) / lh;
  const fontFile = req.resolve('@fontsource/literata/files/literata-latin-400-italic.woff');
  const t = outlineText(fontFile, TAGLINE, 42);
  const top = (H - (LH + 26 + 40)) / 2;
  const tagY = top + LH + 26 + 30; // baseline
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.paper}"/>
<rect x="0" y="${H - 10}" width="${W}" height="10" fill="${C.accentDeep}"/>
<svg x="${((W - LW) / 2).toFixed(2)}" y="${top.toFixed(2)}" width="${LW.toFixed(2)}" height="${LH}" viewBox="${lx} ${ly} ${lw} ${lh}">${lockBody}</svg>
<path fill="${C.inkMuted}" transform="translate(${((W - t.w) / 2 - t.x0).toFixed(2)} ${tagY.toFixed(2)})" d="${t.d}"/>
</svg>`;
  const buf = await sharp(Buffer.from(svg)).flatten({ background: C.paper }).png({ compressionLevel: 9 }).toBuffer();
  write(path.join(OG, 'og-image.png'), buf);
  return sizeOf(buf);
}

const email = await emailLogos();
await favicons();
const og = await ogImage();
console.log(JSON.stringify({ emailLogo: email, og }));
