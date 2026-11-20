// Composes the App Store frames from the real-app captures in ../raw (made by capture.mjs).
//   node compose.mjs <repo-worktree> <captions.json>
// Writes ../iphone-medium-1206x2622 (required) and ../ios-6.9in (optional large). Fonts come from the repo's fontsource packages
// (Literata for the headline, Mukta for the support line), colours from packages/design-tokens and docs/store/art/README.md.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [, , repo, captionsPath] = process.argv;
if (!repo || !captionsPath) throw new Error('usage: node compose.mjs <repo-worktree> <captions.json>');
const require = createRequire(path.join(repo, 'package.json'));
const { chromium } = require('playwright-core');
const RAW = path.join(here, '..', 'raw');
const OUT = path.join(here, '..');
const font = (p) => pathToFileURL(path.join(repo, 'node_modules', p)).href;

// Which real capture each caption's screen uses (see REPORT.md for why).
const SCREEN = {
  tonight: { file: 'tonight-dark', dark: true },
  listening: { file: 'listening-dark', dark: true },
  review: { file: 'review-why-light', dark: false },
  letter: { file: 'letter-light', dark: false },
  book: { file: 'saved-book-light', dark: false },
  letternight: { file: 'together-dark', dark: true },
  privacy: { file: 'privacy-light', dark: false },
  quietday: { file: 'quietday-dark', dark: true },
};
// Lines the screens lane does not render as written because the app does not do what they say (REPORT.md, open question 2).
// Read together opens from the top of the Book and pages through the whole book, oldest first; there is no "open a month".
const OVERRIDE = {
  '05-letter-night': { sub: 'One letter at a time, oldest first.' },
};
// Palette: night #161412, paper #FBF8F3, dusk #3B302A, ink #2B2722, lamp #F3C98B (atmosphere only), accentSoft #F1E6DC.
const BG = {
  dusk: 'radial-gradient(120% 60% at 50% 100%, #5a4636 0%, #3B302A 45%, #161412 100%)',
  night: 'radial-gradient(110% 55% at 50% 102%, #3a2c22 0%, #1d1a17 55%, #161412 100%)',
  paper: 'linear-gradient(180deg, #FBF8F3 0%, #F1E6DC 100%)',
  paperwarm: 'linear-gradient(180deg, #F1E6DC 0%, #F5EFE7 100%)',
  dawn: 'linear-gradient(180deg, #FBF8F3 0%, #f8e7cf 100%)',
};
// Apple, Screenshot specifications (read 1 Nov 2026): the required iPhone size is "iPhone with Dynamic Island (medium
// display)", 1206 x 2622 or 1179 x 2556; "iPhone with Dynamic Island (large display)", 1320 x 2868, is optional.
const SETS = [
  { dir: 'iphone-medium-1206x2622', w: 1206, h: 2622 },
  { dir: 'ios-6.9in', w: 1320, h: 2868 },
];
const captions = JSON.parse(fs.readFileSync(captionsPath, 'utf8')).map((c) => ({ ...c, ...(OVERRIDE[c.id] ?? {}) }));

const faces = `
@font-face{font-family:'Literata';font-weight:200 900;src:url(${font('@fontsource-variable/literata/files/literata-latin-wght-normal.woff2')})}
${[400, 500, 600].map((w) => `@font-face{font-family:'Mukta';font-weight:${w};src:url(${font(`@fontsource/mukta/files/mukta-latin-${w}-normal.woff2`)})}`).join('\n')}`;

// Status bar at 9:41, full signal, wifi and a full battery (iOS layout, drawn in points; the screen is 402 pt wide).
const statusBar = (ink) => `
<div class="sb" style="color:${ink}">
  <span class="time">9:41</span>
  <span class="icons">
    <svg width="19" height="12" viewBox="0 0 19 12"><g fill="${ink}"><rect x="0" y="7.5" width="3.2" height="4.5" rx="1"/><rect x="5" y="5" width="3.2" height="7" rx="1"/><rect x="10" y="2.5" width="3.2" height="9.5" rx="1"/><rect x="15" y="0" width="3.2" height="12" rx="1"/></g></svg>
    <svg width="17" height="12" viewBox="0 0 17 12"><g fill="${ink}"><path d="M8.5 2.3c2.4 0 4.6.9 6.2 2.5l1.2-1.2C13.9 1.6 11.3.5 8.5.5S3.1 1.6 1.1 3.6l1.2 1.2C3.9 3.2 6.1 2.3 8.5 2.3z"/><path d="M8.5 5.8c1.4 0 2.8.6 3.8 1.5l1.2-1.2C12.2 4.8 10.4 4 8.5 4S4.8 4.8 3.5 6.1l1.2 1.2c1-.9 2.4-1.5 3.8-1.5z"/><path d="M8.5 9.2c.6 0 1.1.2 1.5.6L8.5 11.5 7 9.8c.4-.4.9-.6 1.5-.6z"/></g></svg>
    <svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.6" fill="none" stroke="${ink}" stroke-opacity="0.4"/><rect x="2" y="2" width="20" height="9" rx="2.3" fill="${ink}"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="${ink}" fill-opacity="0.45"/></svg>
  </span>
</div>`;

function html(c, s) {
  const scr = SCREEN[c.screen];
  if (!scr) throw new Error(`no capture for screen ${c.screen}`);
  const dark = c.bg === 'dusk' || c.bg === 'night';
  const ink = dark ? '#F2ECE4' : '#2B2722';
  const muted = dark ? '#C9BFB2' : '#6B645B';
  const sbInk = scr.dark ? '#F2ECE4' : '#1A1715';
  const W = s.w, H = s.h;
  const head = Math.round(W * 0.074), sub = Math.round(W * 0.037);
  // The device is sized first (76% of the width, whole phone visible); the caption is centred in the space above it.
  const bottom = Math.round(H * 0.025);
  const bezel = Math.round(W * 0.016);
  const devW = Math.round(W * 0.76);
  const k = devW / 402; // CSS px per iOS point
  const devH = Math.round(874 * k);
  const devTop = H - bottom - devH - 2 * bezel;
  const top = Math.round(H * 0.012), capH = devTop - top - Math.round(H * 0.01);
  const img = pathToFileURL(path.join(RAW, `${scr.file}.png`)).href;
  return `<!doctype html><meta charset="utf-8"><style>${faces}
  html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
  body{background:${BG[c.bg]};font-family:Mukta,sans-serif;-webkit-font-smoothing:antialiased}
  .cap{position:absolute;left:0;right:0;top:${top}px;height:${capH}px;display:flex;flex-direction:column;justify-content:center;text-align:center;padding:0 ${Math.round(W * 0.07)}px;box-sizing:border-box}
  h1{margin:0;font-family:Literata,serif;font-weight:500;font-size:${head}px;line-height:1.1;letter-spacing:-0.015em;color:${ink};text-wrap:balance}
  p{margin:${Math.round(head * 0.32)}px auto 0;max-width:92%;font-size:${sub}px;line-height:1.3;color:${muted};text-wrap:balance}
  .dev{position:absolute;left:${Math.round((W - devW) / 2) - bezel}px;top:${devTop}px;width:${devW}px;height:${devH}px;padding:${bezel}px;border-radius:${Math.round(62 * k) + bezel}px;
    background:#0f0e0d;box-shadow:0 0 0 ${Math.max(2, Math.round(k * 1.2))}px ${dark ? '#4a4038' : '#c9bcae'}, 0 ${Math.round(W * 0.02)}px ${Math.round(W * 0.06)}px rgba(43,39,34,${dark ? 0.55 : 0.22})}
  .scr{position:relative;width:${devW}px;height:${devH}px;border-radius:${Math.round(62 * k)}px;overflow:hidden}
  canvas{display:block;width:${devW}px;height:${devH}px}
  .sb{position:absolute;top:0;left:0;right:0;height:${Math.round(62 * k)}px;display:flex;align-items:center;justify-content:space-between;padding:${Math.round(6 * k)}px ${Math.round(34 * k)}px 0 ${Math.round(48 * k)}px;box-sizing:border-box}
  .sb .time{font-weight:600;font-size:${Math.round(17.5 * k)}px;letter-spacing:0.01em}
  .sb .icons{display:flex;gap:${Math.round(6 * k)}px;align-items:center}
  .sb svg{height:${Math.round(12 * k)}px;width:auto}
  .sb svg:last-child{height:${Math.round(13 * k)}px}
  .island{position:absolute;top:${Math.round(11 * k)}px;left:50%;transform:translateX(-50%);width:${Math.round(124 * k)}px;height:${Math.round(37 * k)}px;border-radius:${Math.round(19 * k)}px;background:#000}
  .home{position:absolute;bottom:${Math.round(8 * k)}px;left:50%;transform:translateX(-50%);width:${Math.round(140 * k)}px;height:${Math.round(5 * k)}px;border-radius:9px;background:${sbInk};opacity:.9}
  </style>
  <div class="cap"><h1>${c.headline}</h1><p>${c.sub}</p></div>
  <div class="dev"><div class="scr"><canvas id="cv" width="1206" height="2622"></canvas>${statusBar(sbInk)}<div class="island"></div><div class="home"></div></div></div>
  <script>
  // The capture is the app area only (the web build applies no safe-area insets). The 62 pt status-bar band and the
  // 34 pt home-indicator band are filled by stretching the capture's own top and bottom pixel rows, as iOS shows the app's background there.
  const im = new Image();
  im.onload = async () => {
    const c = document.getElementById('cv').getContext('2d');
    const top = 186, bot = 102;
    c.drawImage(im, 0, 0, im.width, 1, 0, 0, 1206, top);
    c.drawImage(im, 0, 0, im.width, im.height, 0, top, 1206, im.height);
    c.drawImage(im, 0, im.height - 1, im.width, 1, 0, top + im.height, 1206, bot);
    await document.fonts.ready;
    window.__ready = true;
  };
  im.src = ${JSON.stringify(img)};
  </script>`;
}

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
const tmp = path.join(here, '.tmp');
fs.mkdirSync(tmp, { recursive: true });
for (const s of SETS) {
  fs.mkdirSync(path.join(OUT, s.dir), { recursive: true });
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
  for (const c of captions) {
    const f = path.join(tmp, `${s.dir}-${c.id}.html`);
    fs.writeFileSync(f, html(c, s));
    await page.goto(pathToFileURL(f).href);
    await page.waitForFunction('window.__ready === true');
    await page.screenshot({ path: path.join(OUT, s.dir, `${c.id}.png`) });
    console.log(s.dir, c.id);
  }
  await page.close();
}
await browser.close();
