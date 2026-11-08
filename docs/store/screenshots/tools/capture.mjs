// Captures the REAL Early Letters app (apps/mobile, Expo web export with the Asha seed switch) in Chromium at
// iPhone 17 Pro size (402 pt wide, 3x). The app area is 402 x 778 pt: 874 pt screen minus the 62 pt status-bar inset
// and the 34 pt home-indicator inset that iOS applies natively (on web both insets are 0, so we leave them out of the
// capture and compose.mjs paints them back as the app's own edge colour).
//
//   node capture.mjs <repo-worktree> <out-dir>
// The worktree must already hold the web export at apps/mobile/e2e-web/.web-dist-seed (see REPORT.md).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const [, , repo, out] = process.argv;
if (!repo || !out) throw new Error('usage: node capture.mjs <repo-worktree> <out-dir>');
const require = createRequire(path.join(repo, 'package.json'));
const { chromium } = require('playwright-core');
const DIST = path.join(repo, 'apps/mobile/e2e-web/.web-dist-seed');
if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error(`no web export at ${DIST}`);
fs.mkdirSync(out, { recursive: true });

// Static server with the cross-origin isolation headers the on-device database (expo-sqlite wasm) needs.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf', '.png': 'image/png', '.wasm': 'application/wasm', '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  let f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] ?? 'application/octet-stream', 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });

const W = 402, H = 874 - 62 - 34;
// A fixed evening (Tue 3 Nov 2026, 9:10 pm Pacific) so the greeting and the lamp are the bedtime ones on every rebuild.
// Only Date is fixed; timers run. The Listening frame runs on the real clock so its timer moves.
const EVENING = new Date('2026-11-03T21:10:00-08:00');
async function open(scheme, seed = 'asha-plus', fixed = true) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H }, screen: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    colorScheme: scheme, reducedMotion: 'reduce', permissions: ['microphone'], timezoneId: 'America/Los_Angeles', locale: 'en-US',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  if (fixed) await page.clock.setFixedTime(EVENING);
  page.on('pageerror', (e) => console.warn('pageerror', e.message));
  await page.addInitScript(() => {
    const add = () => { const st = document.createElement('style'); st.textContent = '*::-webkit-scrollbar{display:none!important}*{scrollbar-width:none!important}'; document.documentElement.appendChild(st); };
    if (document.documentElement) add(); else document.addEventListener('DOMContentLoaded', add);
  });
  await page.goto(`${BASE}/?seed=${seed}`);
  await page.getByRole('button', { name: 'Speak' }).waitFor({ timeout: 30000 });
  await page.waitForTimeout(1200);
  return { ctx, page };
}
const btn = (page, name) => page.getByRole('button', { name });
const shot = async (page, name, settle = 1500) => {
  await page.waitForTimeout(settle);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log('captured', name);
};
const bookTab = (page) => page.getByText('Book', { exact: true }).last();

const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const want = (n) => !only || only.includes(n);

for (const scheme of ['light', 'dark']) {
  if (want('tonight')) {
    const { ctx, page } = await open(scheme);
    await shot(page, `tonight-${scheme}`);
    await ctx.close();
  }
  if (want('listening')) {
    const { ctx, page } = await open(scheme, 'asha-plus', false);
    await btn(page, /^Speak/).click();
    await page.getByText('Listening.').waitFor();
    await shot(page, `listening-${scheme}`, 7400); // a little time on the clock
    await ctx.close();
  }
  if (want('review')) {
    const { ctx, page } = await open(scheme);
    await page.getByText('Read it back').first().click();
    await page.getByRole('heading', { name: 'Read it back' }).waitFor();
    await page.waitForTimeout(800);
    const got = btn(page, 'Got it');
    if (await got.count()) await got.click();
    await shot(page, `review-${scheme}`);
    // The fix rows start open on web (it always reports a screen reader); capture the mark-explained card as well.
    const fix = page.getByRole('button', { name: /Took out a sound/ }).first();
    if (await fix.count()) { await fix.click(); await shot(page, `review-why-${scheme}`); }
    await ctx.close();
  }
  if (want('saved')) {
    // The real save: Read it back, Add to Asha's book, and the app lands on the Book on the new letter (J06).
    const { ctx, page } = await open(scheme);
    await page.getByText('Read it back').first().click();
    await page.getByRole('heading', { name: 'Read it back' }).waitFor();
    await page.waitForTimeout(800);
    const got = btn(page, 'Got it');
    if (await got.count()) await got.click();
    await btn(page, /^Add to .*book/).click();
    await page.waitForTimeout(6000); // let the arrival wash fade
    await shot(page, `saved-book-${scheme}`);
    await ctx.close();
  }
  if (want('privacy')) {
    const { ctx, page } = await open(scheme);
    await page.goto(`${BASE}/settings/privacy?seed=asha-plus`);
    await page.waitForTimeout(2500);
    await shot(page, `privacy-${scheme}`);
    await ctx.close();
  }
  if (want('quietday')) {
    const { ctx, page } = await open(scheme);
    await btn(page, 'Not much today').click();
    await page.getByText('A quiet day, kept.').waitFor();
    await shot(page, `quietday-${scheme}`, 2500);
    await ctx.close();
  }
  if (want('book')) {
    const { ctx, page } = await open(scheme);
    await bookTab(page).click();
    await shot(page, `book-${scheme}`);
    await ctx.close();
  }
  if (want('letter')) {
    const { ctx, page } = await open(scheme);
    await bookTab(page).click();
    await page.getByText(/rained all morning/).first().click();
    await page.getByText('Spoken', { exact: false }).first().waitFor();
    await shot(page, `letter-${scheme}`);
    await ctx.close();
  }
  if (want('together')) {
    const { ctx, page } = await open(scheme);
    await bookTab(page).click();
    await page.getByText('Read together', { exact: true }).first().click();
    await page.waitForTimeout(1500);
    await shot(page, `together-${scheme}`);
    await btn(page, 'Next letter').click();
    await shot(page, `together2-${scheme}`);
    await ctx.close();
  }
}
await browser.close();
server.close();
