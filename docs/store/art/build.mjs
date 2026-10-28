// Builds the store art from the approved web copies of the brand masters. Run from repo root:
//   node docs/store/art/build.mjs
// Never redraws the mark: every drawing below is a path taken verbatim from
// apps/web/src/components/brand/lockup.generated.ts (registry logo.lockup.horizontal.ink 1.0.0)
// or from apps/web/public/favicon/favicon.svg (approved symbol). Icons are Lanczos downscales of icon-512.png.
import { chromium } from '../../../node_modules/playwright-core/index.mjs';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const lockSrc = readFileSync(join(root, 'apps/web/src/components/brand/lockup.generated.ts'), 'utf8');
const L = (s => { const o = {}; o.viewBox = /viewBox: "([^"]+)"/.exec(s)[1];
  o.paths = [...s.matchAll(/\{ (?:transform: "([^"]+)", )?d: "([^"]+)" \}/g)].map(m => ({ t: m[1], d: m[2] })); return o; })(lockSrc);
if (L.paths.length !== 2) throw new Error('lockup shape changed');
const fav = readFileSync(join(root, 'apps/web/public/favicon/favicon.svg'), 'utf8');
const FAV = { vb: /viewBox="([^"]+)"/.exec(fav)[1], d: /<path d="([^"]+)"/.exec(fav)[1] };

const fontDir = (p) => pathToFileURL(join(root, 'node_modules', p)).href;
const fonts = `
@font-face{font-family:Literata;font-weight:200 900;font-style:normal;src:url(${fontDir('@fontsource-variable/literata/files/literata-latin-opsz-normal.woff2')})}
@font-face{font-family:Literata;font-weight:200 900;font-style:italic;src:url(${fontDir('@fontsource-variable/literata/files/literata-latin-opsz-italic.woff2')})}
@font-face{font-family:Mukta;font-weight:400;src:url(${fontDir('@fontsource/mukta/files/mukta-latin-400-normal.woff2')})}
@font-face{font-family:Mukta;font-weight:600;src:url(${fontDir('@fontsource/mukta/files/mukta-latin-600-normal.woff2')})}`;

const T = {
  paper: { bg: '#FBF8F3', ink: '#2B2722', muted: '#6B645B', accent: '#8A5A3B', glow: 'none' },
  night: { bg: '#161412', ink: '#F2ECE4', muted: '#B3AA9E', accent: '#D9A47E',
           glow: 'radial-gradient(70% 90% at 50% 105%, rgba(243,201,139,.16), rgba(59,48,42,.55) 45%, #161412 80%)' },
};
// symbol = first lockup path (the two opening quotation marks); lockup = symbol + wordmark
const symbol = (c, h) => { const vb = L.viewBox.split(' ').map(Number);
  return `<svg viewBox="-33.49 -91.57 1183.14 1183.14" style="height:${h}px;width:${h}px"><path fill="${c}" d="${FAV.d}"/></svg>`; };
const lockup = (c, h) => `<svg viewBox="${L.viewBox}" style="height:${h}px">${L.paths.map(p => `<path fill="${c}"${p.t ? ` transform="${p.t}"` : ''} d="${p.d}"/>`).join('')}</svg>`;

const page = (w, h, th, body) => `<!doctype html><meta charset=utf-8><style>${fonts}
html,body{margin:0}body{width:${w}px;height:${h}px;background:${th.glow === 'none' ? th.bg : th.glow + ',' + th.bg};
color:${th.ink};font-family:Literata,Georgia,serif;overflow:hidden;position:relative}
.c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.tag{font-style:italic;font-weight:400;color:${th.muted}}</style>${body}`;

const jobs = [];
const add = (file, w, h, th, body) => jobs.push({ file, w, h, html: page(w, h, T[th], body(T[th])) });

// Google Play feature graphic (1024x500). Lockup + tagline. No price, ranking or promo text (Play policy).
add('play/feature-graphic-1024x500.png', 1024, 500, 'paper', t => `<div class=c>${lockup(t.ink, 120)}<div class=tag style="font-size:40px;margin-top:36px">Exactly as you said it.</div></div>`);
add('play/feature-graphic-1024x500-night.png', 1024, 500, 'night', t => `<div class=c>${lockup(t.ink, 120)}<div class=tag style="font-size:40px;margin-top:36px">Exactly as you said it.</div></div>`);
// Link previews (Open Graph / Twitter large card), 1200x630. Safe area: content inside the centre 1000x500.
const og = t => `<div class=c>${symbol(t.ink, 150)}<div style="font-size:84px;font-weight:500;margin-top:28px;letter-spacing:-.5px">Early Letters</div><div class=tag style="font-size:40px;margin-top:20px">Exactly as you said it.</div></div>`;
add('social/link-preview-paper-1200x630.png', 1200, 630, 'paper', og);
add('social/link-preview-night-1200x630.png', 1200, 630, 'night', og);
add('social/link-preview-category-1200x630.png', 1200, 630, 'paper', t => `<div class=c>${lockup(t.ink, 110)}<div style="font-family:Literata;font-size:46px;font-weight:500;margin-top:44px">The baby memory book you fill by talking.</div><div class=tag style="font-size:34px;margin-top:18px">Your words. Your voice. Kept as said.</div></div>`);
// App Store promotional artwork (type only; real-UI screenshots live in docs/store/screenshots)
add('promo/promo-square-1080x1080-paper.png', 1080, 1080, 'paper', t => `<div class=c>${symbol(t.ink, 190)}<div style="font-size:92px;font-weight:500;margin-top:40px;line-height:1.12">Said once.<br>Heard for years.</div><div style="font-family:Mukta;font-size:34px;color:${t.muted};margin-top:36px">Early Letters, the baby memory book you fill by talking.</div></div>`);
add('promo/promo-story-1080x1920-night.png', 1080, 1920, 'night', t => `<div class=c>${symbol(t.ink, 220)}<div style="font-size:104px;font-weight:500;margin-top:56px;line-height:1.12">Exactly as<br>you said it.</div><div style="font-family:Mukta;font-size:38px;color:${t.muted};margin-top:48px;max-width:760px">Early Letters, the baby memory book you fill by talking.</div></div>`);

const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
for (const j of jobs) {
  const p = await b.newPage({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: 1 });
  writeFileSync(join(here, '_src/page.html'), j.html);
  await p.goto(pathToFileURL(join(here, '_src/page.html')).href); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: join(here, j.file) }); await p.close(); console.log('wrote', j.file);
}
await b.close();
execFileSync('python3', ['-I', join(here, 'icons.py'), root, here], { stdio: 'inherit' });
