// Composes the six App Store screenshot frames from raw web-preview captures.
//
//   1. cd apps/mobile && EXPO_PUBLIC_WEB_PREVIEW=1 npx expo export --platform web --output-dir <web>
//   2. Serve <web> and capture each screen with `?seed=asha` (the fictional family) at 440x956 and
//      414x896 points, 3x, Reduce Motion on, into <raw>/6.9/<id>.png and <raw>/6.5/<id>.png.
//      Screen ids are `storeListing.screenshots[].id` (talk, exact, voice, book, together, private).
//   3. npx tsx scripts/brand/screenshots.mts --raw <raw> [--out docs/store/screenshots] [--preview <dir>]
//
// Frames: caption in Literata Medium, subline in Mukta (packages/design-tokens/fonts, SIL OFL),
// on paper (dark frames on dark paper), the screen inside a plain rounded phone outline we draw
// ourselves. No device art, logos or assets from anyone else. Output has no alpha (App Store rule).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brand } from '../../packages/brand/index';
import { storeListing } from '../../packages/content/src/store.en';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(join(ROOT, 'packages', 'brand', 'package.json'));
const sharp = require('sharp') as typeof import('sharp');

const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const RAW = arg('raw');
if (!RAW) throw new Error('Pass --raw <dir> with 6.9/ and 6.5/ captures (see the header of this file).');
const OUT = resolve(arg('out', join(ROOT, 'docs', 'store', 'screenshots'))!);
const PREVIEW = arg('preview');
const FONTS = join(ROOT, 'packages', 'design-tokens', 'fonts');
const SERIF = join(FONTS, 'Literata-Medium.ttf');
const SANS = join(FONTS, 'Mukta-Regular.ttf');

const SIZES = [
  { id: '6.9', w: 1320, h: 2868 },
  { id: '6.5', w: 1242, h: 2688 },
] as const;

const c = brand.colors;
const THEMES = {
  light: { bg: c.paper, caption: c.ink, subline: c.inkMuted, bezel: '#2B2722', edge: c.line, shadow: 'rgba(43,39,34,0.22)' },
  dark: { bg: c.paperDark, caption: c.inkDark, subline: c.inkMutedDark, bezel: '#2E2A26', edge: '#46413B', shadow: 'rgba(0,0,0,0.6)' },
} as const;

/** Splits a caption into two lines of similar length, so no line ends with a lone word. */
function balance(text: string): string {
  const words = text.split(' ');
  if (words.length < 4) return text;
  let best = text;
  let bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const score = Math.max(a.length, b.length);
    if (score < bestScore) [best, bestScore] = [`${a}\n${b}`, score];
  }
  return best;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function text(s: string, opts: { font: string; file: string; size: number; color: string; width: number; spacing?: number }) {
  const markup = `<span foreground="${opts.color}">${esc(s)}</span>`;
  return sharp({
    text: { text: markup, font: `${opts.font} ${opts.size}`, fontfile: opts.file, width: opts.width, align: 'centre', rgba: true, dpi: 72, spacing: opts.spacing ?? 0 },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
}

async function frame(size: (typeof SIZES)[number], shot: (typeof storeListing.screenshots)[number]) {
  const { w, h } = size;
  const k = w / 1320;
  const t = THEMES[shot.scheme];
  const px = (n: number) => Math.round(n * k);

  const cap = await text(balance(shot.caption), { font: 'Literata Medium', file: SERIF, size: px(86), color: t.caption, width: px(1120), spacing: px(10) });
  const sub = await text(shot.subline, { font: 'Mukta', file: SANS, size: px(46), color: t.subline, width: px(1120) });
  const capTop = px(170);
  const subTop = capTop + cap.info.height + px(52);

  // Phone outline, sized to leave a calm margin at the bottom.
  const raw = sharp(readFileSync(join(RAW!, size.id, `${shot.id}.png`)));
  const meta = await raw.metadata();
  const bezel = px(22);
  const phoneTop = subTop + sub.info.height + px(96);
  const outerH = h - phoneTop - px(120);
  const screenH = outerH - bezel * 2;
  const screenW = Math.round((screenH * meta.width!) / meta.height!);
  const outerW = screenW + bezel * 2;
  const left = Math.round((w - outerW) / 2);
  const rScreen = Math.round(screenW * 0.125);
  const rOuter = rScreen + bezel;

  const screen = await raw
    .resize(screenW, screenH)
    .composite([{ input: Buffer.from(`<svg width="${screenW}" height="${screenH}"><rect width="${screenW}" height="${screenH}" rx="${rScreen}"/></svg>`), blend: 'dest-in' }])
    .png()
    .toBuffer();
  const body = Buffer.from(
    `<svg width="${outerW}" height="${outerH}"><rect x="1" y="1" width="${outerW - 2}" height="${outerH - 2}" rx="${rOuter}" fill="${t.bezel}" stroke="${t.edge}" stroke-width="2"/></svg>`,
  );
  const pad = px(90);
  const shadow = await sharp(
    Buffer.from(`<svg width="${outerW + pad * 2}" height="${outerH + pad * 2}"><rect x="${pad}" y="${pad + px(26)}" width="${outerW}" height="${outerH}" rx="${rOuter}" fill="${t.shadow}"/></svg>`),
  )
    .blur(px(34))
    .png()
    .toBuffer();

  return sharp({ create: { width: w, height: h, channels: 4, background: t.bg } })
    .composite([
      { input: cap.data, top: capTop, left: Math.round((w - cap.info.width) / 2) },
      { input: sub.data, top: subTop, left: Math.round((w - sub.info.width) / 2) },
      { input: shadow, top: phoneTop - pad, left: left - pad },
      { input: body, top: phoneTop, left },
      { input: screen, top: phoneTop + bezel, left: left + bezel },
    ])
    .flatten({ background: t.bg })
    .removeAlpha()
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
}

const sheets: Record<string, Buffer[]> = {};
for (const size of SIZES) {
  const dir = join(OUT, `${size.w}x${size.h}`);
  mkdirSync(dir, { recursive: true });
  sheets[size.id] = [];
  for (const [i, shot] of storeListing.screenshots.entries()) {
    const png = await frame(size, shot);
    const file = join(dir, `${String(i + 1).padStart(2, '0')}-${shot.id}.png`);
    writeFileSync(file, png);
    const m = await sharp(png).metadata();
    console.log(`${file.replace(`${ROOT}/`, '')}  ${m.width}x${m.height} alpha=${m.hasAlpha} ${(png.length / 1024).toFixed(0)} KB`);
    sheets[size.id].push(png);
  }
}

if (PREVIEW) {
  mkdirSync(PREVIEW, { recursive: true });
  for (const size of SIZES) {
    const tw = 440;
    const th = Math.round((tw * size.h) / size.w);
    const tiles = await Promise.all(sheets[size.id].map((b) => sharp(b).resize(tw, th).png().toBuffer()));
    await sharp({ create: { width: tiles.length * (tw + 24) + 24, height: th + 48, channels: 3, background: '#9A948C' } })
      .composite(tiles.map((input, i) => ({ input, left: 24 + i * (tw + 24), top: 24 })))
      .png()
      .toFile(join(PREVIEW, `store-frames-${size.id}.png`));
  }
  console.log(`contact sheets in ${PREVIEW}`);
}
