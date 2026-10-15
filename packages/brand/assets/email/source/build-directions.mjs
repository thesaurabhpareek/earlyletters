// DEPRECATED (Oct 3 2026): the B3 interim lockup and directions A/B were replaced by the primary mark.
// Email logos, avatar and favicons are now built by packages/brand/scripts/build-touchpoints.mjs from
// packages/brand/assets/logo/primary/. This script would overwrite them with retired art, so it refuses to run.
if (!process.env.ALLOW_DEPRECATED_BRAND_BUILD) {
  console.error('Deprecated: run node packages/brand/scripts/build-touchpoints.mjs instead (see docs/brand/BRAND_SYSTEM.md).');
  process.exit(1);
}
// Email versions of logo directions A and B (lanes B1, B2).
//
//   node packages/brand/assets/email/source/build-directions.mjs [a] [b]
//
// Takes each direction's horizontal lockup (light and reversed), fits it to a
// quiet header height, and adds the same halo as the interim lockup
// (EMAIL_IDENTITY.md 4.4): the alpha is dilated with feMorphology and filled
// with the opposite surface colour, then the original is drawn on top.
// Outputs ../<dir>/logo-light.png, logo-dark.png (2x), @1x versions,
// avatar-1024.png when the direction ships a square icon, and manifest.json.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EMAIL = path.resolve(HERE, '..');
const LOGO = path.resolve(HERE, '../../logo');
const ROOT = path.resolve(HERE, '../../../../..');
const NAME = fs.readFileSync(path.join(ROOT, 'packages/brand/index.ts'), 'utf8').match(/name:\s*'([^']+)'/)[1];

const PAPER = '#FBF8F3';
const PAPER_DARK = '#161412';
const HALO_PX = 0.5; // CSS px; feMorphology rounds up, so 0.5 matches the interim 0.7 stroke visually
const TARGET_H = 28; // CSS px display height
const MAX_W = 200; // CSS px

// Which file is the email lockup in each direction. First existing candidate wins.
const DIRECTIONS = {
  a: {
    // A's accent variant is a two-tone: accent symbol, ink wordmark.
    light: ['lockup-horizontal-accent.svg', 'lockup-horizontal.svg'],
    dark: ['lockup-horizontal-accent-reversed.svg', 'lockup-horizontal-reversed.svg'],
    avatar: ['app-icon-1024.png'],
  },
  b: {
    // B's accent variant is accent all over; the ink lockup is quieter in a header.
    light: ['lockup-horizontal.svg'],
    dark: ['lockup-horizontal-reversed.svg'],
    avatar: ['app-icon-1024.png', 'icon-1024.png', 'png/app-icon-1024.png', 'src/icon/app-icon.svg'],
  },
};

const pick = (dir, list) => list.map((f) => path.join(LOGO, dir, f)).find((f) => fs.existsSync(f));

function viewBox(svg) {
  const m = svg.match(/viewBox="([^"]+)"/);
  if (!m) throw new Error('lockup SVG has no viewBox');
  return m[1].trim().split(/[\s,]+/).map(Number);
}

function haloSvg(src, halo, W, H) {
  const [, , vw, vh] = viewBox(src);
  const pad = 2; // CSS px around the art for the halo
  const inner = { w: W - 2 * pad, h: H - 2 * pad };
  const b64 = Buffer.from(src).toString('base64');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="halo" x="-10%" y="-30%" width="120%" height="160%" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="${HALO_PX}" result="grown"/>
      <feFlood flood-color="${halo}" flood-opacity="0.92"/>
      <feComposite in2="grown" operator="in" result="edge"/>
      <feMerge><feMergeNode in="edge"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <image x="${pad}" y="${pad}" width="${inner.w}" height="${inner.h}" preserveAspectRatio="xMinYMid meet" filter="url(#halo)" xlink:href="data:image/svg+xml;base64,${b64}"/>
</svg>`;
}

async function render(svg, file, scale) {
  // Rasterise the wrapper at the requested scale.
  const buf = await sharp(Buffer.from(svg), { density: 72 * scale }).png({ compressionLevel: 9 }).toBuffer();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  const m = await sharp(buf).metadata();
  console.log('wrote', path.relative(ROOT, file), `${m.width}x${m.height}`);
  return `${m.width}x${m.height}`;
}

async function build(dir) {
  const cfg = DIRECTIONS[dir];
  const light = pick(dir, cfg.light);
  const dark = pick(dir, cfg.dark);
  if (!light || !dark) {
    console.log(`direction ${dir}: lockup not found yet, skipped`);
    return;
  }
  const lightSrc = fs.readFileSync(light, 'utf8');
  const [, , vw, vh] = viewBox(lightSrc);
  let H = TARGET_H + 4;
  let W = Math.round(((TARGET_H * vw) / vh) + 4);
  if (W > MAX_W + 4) {
    W = MAX_W + 4;
    H = Math.round((MAX_W * vh) / vw + 4);
  }
  const out = path.join(EMAIL, dir);
  const files = {};
  for (const [kind, srcFile, halo] of [
    ['light', light, PAPER],
    ['dark', dark, PAPER_DARK],
  ]) {
    const svg = haloSvg(fs.readFileSync(srcFile, 'utf8'), halo, W, H);
    files[`logo-${kind}.png`] = await render(svg, path.join(out, `logo-${kind}.png`), 2);
    files[`logo-${kind}@1x.png`] = await render(svg, path.join(out, `logo-${kind}@1x.png`), 1);
  }
  const avatar = pick(dir, cfg.avatar);
  if (avatar) {
    await sharp(avatar, avatar.endsWith('.svg') ? { density: 600 } : {}).resize(1024, 1024).png().toFile(path.join(out, 'avatar-1024.png'));
    files['avatar-1024.png'] = '1024x1024';
    console.log('wrote', path.relative(ROOT, path.join(out, 'avatar-1024.png')));
  }
  fs.writeFileSync(
    path.join(out, 'manifest.json'),
    JSON.stringify(
      {
        direction: dir,
        sources: { light: path.relative(ROOT, light), dark: path.relative(ROOT, dark), avatar: avatar && path.relative(ROOT, avatar) },
        displayWidthPx: W,
        displayHeightPx: H,
        haloPx: HALO_PX,
        alt: NAME,
        files,
        hostedAt: `https://earlyletters.com/email/ (copy the chosen direction's files to the root of /email/)`,
      },
      null,
      2,
    ) + '\n',
  );
}

const which = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(DIRECTIONS);
for (const d of which) await build(d);
