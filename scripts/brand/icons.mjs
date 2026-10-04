#!/usr/bin/env node
// Generates every app icon, the splash mark and the SVG masters from scripts/brand/mark.mjs.
//
//   node scripts/brand/icons.mjs                 # masters + previews in scripts/brand/dist (git-ignored)
//   node scripts/brand/icons.mjs --out <dir>     # previews and the full size set somewhere else
//
// Committed outputs (small on purpose; the app download budget is under 40 MB, D-065):
//   apps/mobile/assets/brand/icon.png             1024, iOS light, opaque (no alpha), App Store master
//   apps/mobile/assets/brand/icon-dark.png        1024, iOS 18+ dark, transparent background
//   apps/mobile/assets/brand/icon-tinted.png      1024, iOS 18+ tinted, grayscale on black
//   apps/mobile/assets/brand/android-foreground.png, android-monochrome.png   432, adaptive layers
//   apps/mobile/assets/brand/splash.png, splash-dark.png                     480, splash mark
//   apps/mobile/assets/brand/favicon.png                                      48, web preview
//   packages/brand/logo/mark.svg, app-icon.svg                               vector masters
// Preview outputs (not committed): every legacy iOS size with Contents.json, Play 512 icon,
// favicon sizes and contact sheets.
//
// Uses sharp (Apache-2.0), a dev dependency of @scribe/brand. Nothing here ships in the app.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markSvg, PALETTE, VARIANTS } from './mark.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(join(ROOT, 'packages', 'brand', 'package.json'));
const sharp = require('sharp');

const args = process.argv.slice(2);
const outArg = args.indexOf('--out');
const OUT = resolve(outArg >= 0 ? args[outArg + 1] : join(ROOT, 'scripts', 'brand', 'dist'));
const ASSETS = join(ROOT, 'apps', 'mobile', 'assets', 'brand');
const LOGO = join(ROOT, 'packages', 'brand', 'logo');
for (const d of [OUT, ASSETS, LOGO, join(OUT, 'ios', 'AppIcon.appiconset')]) mkdirSync(d, { recursive: true });

/** Rasterise an SVG string to a PNG buffer at `size`. */
async function raster(svg, size, { opaque = null, gray = false } = {}) {
  let img = sharp(Buffer.from(svg), { density: Math.max(72, (72 * size) / 1024) * 2 }).resize(size, size);
  if (opaque) img = img.flatten({ background: opaque }).removeAlpha();
  if (gray) img = img.grayscale();
  // Flat artwork: an indexed palette keeps files a few KB without visible banding.
  return img.png({ palette: true, quality: 100, compressionLevel: 9, effort: 10 }).toBuffer();
}

async function write(path, buf) {
  writeFileSync(path, buf);
  const meta = await sharp(buf).metadata();
  console.log(`${path.replace(ROOT + '/', '')}  ${meta.width}x${meta.height}  alpha=${meta.hasAlpha}  ${(buf.length / 1024).toFixed(1)} KB`);
}

const svg = Object.fromEntries(Object.entries(VARIANTS).map(([k, v]) => [k, markSvg(v)]));

// 1. Committed masters.
await write(join(ASSETS, 'icon.png'), await raster(svg.iosLight, 1024, { opaque: PALETTE.accent }));
await write(join(ASSETS, 'icon-dark.png'), await raster(svg.iosDark, 1024));
await write(join(ASSETS, 'icon-tinted.png'), await raster(svg.iosTinted, 1024, { opaque: PALETTE.black, gray: true }));
await write(join(ASSETS, 'android-foreground.png'), await raster(svg.androidForeground, 432));
await write(join(ASSETS, 'android-monochrome.png'), await raster(svg.androidMonochrome, 432));
await write(join(ASSETS, 'splash.png'), await raster(svg.splashLight, 480));
await write(join(ASSETS, 'splash-dark.png'), await raster(svg.splashDark, 480));
// Web preview favicon (app.config.ts `web.favicon`).
await write(join(ASSETS, 'favicon.png'), await raster(svg.iosLight, 48, { opaque: PALETTE.accent }));
writeFileSync(join(LOGO, 'mark.svg'), svg.markAccent);
writeFileSync(join(LOGO, 'app-icon.svg'), svg.iosLight);
console.log('packages/brand/logo/mark.svg, app-icon.svg');

// 2. Every iOS size (Xcode and Expo only need the 1024s; these are for review and native fallback).
const IOS = [
  ['iphone', '20x20', '2x', 40], ['iphone', '20x20', '3x', 60], ['iphone', '29x29', '2x', 58], ['iphone', '29x29', '3x', 87],
  ['iphone', '40x40', '2x', 80], ['iphone', '40x40', '3x', 120], ['iphone', '60x60', '2x', 120], ['iphone', '60x60', '3x', 180],
  ['ipad', '20x20', '1x', 20], ['ipad', '20x20', '2x', 40], ['ipad', '29x29', '1x', 29], ['ipad', '29x29', '2x', 58],
  ['ipad', '40x40', '1x', 40], ['ipad', '40x40', '2x', 80], ['ipad', '76x76', '1x', 76], ['ipad', '76x76', '2x', 152],
  ['ipad', '83.5x83.5', '2x', 167], ['ios-marketing', '1024x1024', '1x', 1024],
];
const set = join(OUT, 'ios', 'AppIcon.appiconset');
const images = [];
for (const px of [...new Set(IOS.map((r) => r[3]))]) {
  await write(join(set, `icon-${px}.png`), await raster(svg.iosLight, px, { opaque: PALETTE.accent }));
}
for (const [idiom, size, scale, px] of IOS) images.push({ idiom, size, scale, filename: `icon-${px}.png` });
// iOS 18+ single-size entries with dark and tinted appearances (what Xcode 16 writes).
await write(join(set, 'icon-1024-dark.png'), await raster(svg.iosDark, 1024));
await write(join(set, 'icon-1024-tinted.png'), await raster(svg.iosTinted, 1024, { opaque: PALETTE.black, gray: true }));
images.push(
  { idiom: 'universal', platform: 'ios', size: '1024x1024', filename: 'icon-1024.png' },
  { idiom: 'universal', platform: 'ios', size: '1024x1024', filename: 'icon-1024-dark.png', appearances: [{ appearance: 'luminosity', value: 'dark' }] },
  { idiom: 'universal', platform: 'ios', size: '1024x1024', filename: 'icon-1024-tinted.png', appearances: [{ appearance: 'luminosity', value: 'tinted' }] },
);
writeFileSync(join(set, 'Contents.json'), JSON.stringify({ images, info: { author: 'scripts/brand/icons.mjs', version: 1 } }, null, 2));

// 3. Other stores and the web (the website thread can take these).
await write(join(OUT, 'play-icon-512.png'), await raster(svg.iosLight, 512, { opaque: PALETTE.accent }));
for (const px of [16, 32, 48, 180, 192, 512]) await write(join(OUT, `favicon-${px}.png`), await raster(svg.iosLight, px, { opaque: PALETTE.accent }));
writeFileSync(join(OUT, 'favicon.svg'), svg.iosLight);

// 4. Contact sheets to look at.
const squircle = (s) => Buffer.from(`<svg width="${s}" height="${s}"><rect width="${s}" height="${s}" rx="${Math.round(s * 0.2237)}"/></svg>`);
const circle = (s) => Buffer.from(`<svg width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}"/></svg>`);
async function masked(buf, s, mask = squircle) {
  return sharp(buf).resize(s, s).composite([{ input: mask(s), blend: 'dest-in' }]).png().toBuffer();
}
async function onBackdrop(buf, s, backdrop) {
  const base = await sharp({ create: { width: s, height: s, channels: 4, background: backdrop } }).png().toBuffer();
  return sharp(base).composite([{ input: await sharp(buf).resize(s, s).png().toBuffer() }]).png().toBuffer();
}
/** iOS draws dark icons over a near-black gradient; this flat stand-in is close enough to judge contrast. */
async function tinted(buf, s, tint) {
  const g = await sharp(buf).resize(s, s).grayscale().raw().toBuffer({ resolveWithObject: true });
  const [r, gg, b] = [1, 3, 5].map((i) => parseInt(tint.slice(i, i + 2), 16));
  const out = Buffer.alloc(s * s * 3);
  for (let i = 0; i < s * s; i++) {
    const l = g.data[i * g.info.channels] / 255;
    out[i * 3] = Math.round(18 + (r - 18) * l);
    out[i * 3 + 1] = Math.round(18 + (gg - 18) * l);
    out[i * 3 + 2] = Math.round(20 + (b - 20) * l);
  }
  return sharp(out, { raw: { width: s, height: s, channels: 3 } }).png().toBuffer();
}

const light = await raster(svg.iosLight, 1024, { opaque: PALETTE.accent });
const dark = await raster(svg.iosDark, 1024);
const tint = await raster(svg.iosTinted, 1024, { opaque: PALETTE.black, gray: true });
const sizes = [240, 180, 120, 87, 60, 40];
const rows = [
  { label: 'light', bg: '#E9E4DC', icon: (s) => masked(light, s) },
  { label: 'dark', bg: '#101012', icon: async (s) => masked(await onBackdrop(dark, s, '#26262A'), s) },
  { label: 'tinted', bg: '#101012', icon: async (s) => masked(await tinted(tint, s, '#E7A35C'), s) },
];
const comps = [];
let y = 40;
for (const row of rows) {
  comps.push({ input: await sharp({ create: { width: 1400, height: 300, channels: 4, background: row.bg } }).png().toBuffer(), left: 0, top: y - 30 });
  let x = 40;
  for (const s of sizes) {
    comps.push({ input: await row.icon(s), left: x, top: y + (240 - s) });
    x += s + 48;
  }
  y += 300;
}
await sharp({ create: { width: 1400, height: y, channels: 4, background: '#FFFFFF' } }).composite(comps).png().toFile(join(OUT, 'preview-ios-icons.png'));

// Android: adaptive (foreground over the accent background) under three launcher masks, plus themed.
const fg = await raster(svg.androidForeground, 432);
const mono = await raster(svg.androidMonochrome, 432);
const adaptive = await onBackdrop(fg, 432, PALETTE.accent);
const rounded = (s) => Buffer.from(`<svg width="${s}" height="${s}"><rect width="${s}" height="${s}" rx="${s * 0.3}"/></svg>`);
const themed = await onBackdrop(await sharp(mono).linear([0.85, 0.85, 0.85, 1], [0, 0, 0, 0]).png().toBuffer(), 432, '#3D4A3A');
// Launchers show the middle 72 of 108 dp: crop to 288 px before masking.
const crop = (b) => sharp(b).extract({ left: 72, top: 72, width: 288, height: 288 }).png().toBuffer();
const andro = [await masked(await crop(adaptive), 192, circle), await masked(await crop(adaptive), 192, squircle), await masked(await crop(adaptive), 192, rounded), await masked(await crop(themed), 192, circle)];
await sharp({ create: { width: 960, height: 280, channels: 4, background: '#E9E4DC' } })
  .composite(andro.map((input, i) => ({ input, left: 40 + i * 230, top: 44 })))
  .png()
  .toFile(join(OUT, 'preview-android-icons.png'));

// Splash: phone-shaped frames at 393x852 pt (3x), mark at the configured imageWidth.
const SPLASH_WIDTH_PT = 120;
async function splashFrame(mark, bg) {
  const w = 393 * 2, h = 852 * 2, m = SPLASH_WIDTH_PT * 2;
  return sharp({ create: { width: w, height: h, channels: 4, background: bg } })
    .composite([{ input: await sharp(mark).resize(m, m).png().toBuffer(), left: Math.round((w - m) / 2), top: Math.round((h - m) / 2) }])
    .png()
    .toBuffer();
}
const sl = await splashFrame(await raster(svg.splashLight, 480), PALETTE.paper);
const sd = await splashFrame(await raster(svg.splashDark, 480), PALETTE.paperDark);
await sharp({ create: { width: 393 * 4 + 120, height: 852 * 2 + 80, channels: 4, background: '#BDB6AC' } })
  .composite([{ input: sl, left: 40, top: 40 }, { input: sd, left: 393 * 2 + 80, top: 40 }])
  .png()
  .toFile(join(OUT, 'preview-splash.png'));

console.log(`previews in ${OUT}`);
export const SPLASH_IMAGE_WIDTH = SPLASH_WIDTH_PT;
