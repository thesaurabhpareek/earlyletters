// Runs the r2 icon bench once per tile candidate for one symbol, then builds comparison sheets.
// Usage (repo root): node packages/brand/assets/logo/r3/color-type/source/tiles.mjs <symbol.svg> <tag> [--small symbol-small.svg] [--scale 0.56]
// Raw bench output goes to the scratch dir (large); curated sheets go to ../png/<tag>/.
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { bench } from './bench-fixed.mjs';
import { TILES, contrast, mix } from './colors.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRATCH = process.env.SCRATCH || '/tmp/claude-0/-home-claude-earlyletters/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/bench';
const [symbol, tag, ...rest] = process.argv.slice(2);
const opt = {}; for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, '')] = rest[i + 1];
const PNG = join(HERE, '..', 'png', tag);
mkdirSync(PNG, { recursive: true });

const bgCss = (t) => (t.top === t.bot ? t.top : `linear-gradient(180deg, ${t.top}, ${t.bot})`);
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
for (const t of TILES) {
  if (only && !only.includes(t.id)) continue;
  const out = join(SCRATCH, tag, t.id);
  await bench(resolve(symbol), { out, bg: bgCss(t), fg: t.fg, small: opt.small, scale: opt.scale });
  console.log('benched', t.id);
}
// tinted with two user tints (the tile colour does not reach tinted/clear; only the mark's alpha does)
for (const [name, tint] of [['amber', '#E3A35A'], ['blue', '#5E8FE0']]) {
  if (only) break;
  await bench(resolve(symbol), { out: join(SCRATCH, tag, `tint-${name}`), bg: TILES[0].top, fg: TILES[0].fg, tint, scale: opt.scale });
}

// ---- comparison sheets ----
const req = createRequire(import.meta.url);
const { chromium } = req('/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules/playwright');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
const url = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64');
const cell = (t, f, w) => `<figure><img src="${url(f)}" style="width:${w}px"><figcaption><b>${t.label}</b><br>${t.top === t.bot ? t.top : t.top + ' to ' + t.bot} / mark ${t.fg}<br>contrast ${contrast(t.fg, mix(t.top, t.bot, .5)).toFixed(2)}:1 (min ${Math.min(contrast(t.fg, t.top), contrast(t.fg, t.bot)).toFixed(2)})</figcaption></figure>`;
const css = `body{margin:0;padding:20px;font:13px/1.35 Inter,system-ui,sans-serif;background:#ececec;color:#222;display:flex;flex-wrap:wrap;gap:18px}
figure{margin:0;display:flex;flex-direction:column;gap:6px} img{display:block;border-radius:10px} h1{width:100%;font-size:16px;margin:0}`;
async function sheet(file, title, pick, w) {
  const items = TILES.filter((t) => existsSync(join(SCRATCH, tag, t.id, pick)));
  await page.setContent(`<!doctype html><style>${css}</style><h1>${title}</h1>${items.map((t) => cell(t, join(SCRATCH, tag, t.id, pick), w)).join('')}`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(PNG, file), fullPage: true });
}
await sheet('compare-home-light-crop.png', `${tag}: home screen crop, light (native 3x pixels, real neighbours)`, 'home-light-crop.png', 260);
await sheet('compare-home-dark-crop.png', `${tag}: home screen crop, dark appearance (same for every light tile)`, 'home-dark-crop.png', 260);
// full home screens, scaled to 1x
await page.setViewportSize({ width: 1700, height: 900 });
await sheet('compare-home-light-full.png', `${tag}: full home screens, light wallpaper (scaled to 1x)`, 'home-light.png', 300);
await sheet('compare-1024.png', `${tag}: 1024 masters (unmasked, what ships)`, 'icon-default-1024.png', 200);
// sizes at 29 and 16 px, magnified 6x
const sz = TILES.filter((t) => existsSync(join(SCRATCH, tag, t.id, 'px-29.png')));
await page.setContent(`<!doctype html><style>${css} .px{image-rendering:pixelated}</style><h1>${tag}: 29 px and 16 px from the 1024 master, magnified 6x</h1>${sz.map((t) => `<figure><div style="display:flex;gap:10px;align-items:flex-end"><img class="px" src="${url(join(SCRATCH, tag, t.id, 'px-29.png'))}" width="174"><img class="px" src="${url(join(SCRATCH, tag, t.id, 'px-16.png'))}" width="96"><img src="${url(join(SCRATCH, tag, t.id, 'px-29.png'))}" width="29"><img src="${url(join(SCRATCH, tag, t.id, 'px-16.png'))}" width="16"></div><figcaption><b>${t.label}</b></figcaption></figure>`).join('')}`);
await page.waitForTimeout(150);
await page.screenshot({ path: join(PNG, 'compare-small-sizes.png'), fullPage: true });
if (!only) {
  const ap = (n) => join(SCRATCH, tag, n, 'appearances.png');
  await page.setContent(`<!doctype html><style>${css}</style><h1>${tag}: six appearances. Top: user tint amber. Bottom: user tint blue. Tinted and clear use only the mark's shape.</h1><img src="${url(ap('tint-amber'))}" style="width:1320px"><img src="${url(ap('tint-blue'))}" style="width:1320px">`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(PNG, 'appearances-tints.png'), fullPage: true });
}
await browser.close();
console.log('sheets ->', PNG);
