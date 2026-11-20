#!/usr/bin/env node
/**
 * Launch rehearsal: builds the site the way the flip will, with a made-up store link, and checks the result.
 *
 *   node scripts/release-check.mjs launch      (from apps/web)
 *
 * What it proves (docs/web/launch-flip.md, step 6):
 *   1. The build REFUSES to run with the flip on and no badge file (skipped if the real file is already in place),
 *      and with the badge but no committed QR for the link.
 *   2. With the flip on, the film builds, and in a real browser:
 *        - a fine-pointer desktop shows the QR (alt text, text link to the store with ct=web-qr) and hides the badge;
 *        - a touch phone shows the badge and hides the QR, on a 390 and a 320 wide screen;
 *        - no page error, no sideways scroll, and every request goes to this machine (no third party, no QR service).
 *
 * The link is obviously fake (id1000000000). The committed QR file is generated for that link and put back at the end.
 * A stand-in badge file is written only if the real one is absent, carries a marker the real build refuses, and is
 * removed at the end. Nothing here calls Apple, Resend or anyone else.
 */
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BADGE_FILE = 'public/brand/app-store-badge.svg';
const QR_FILE = 'src/lib/qr/qr.generated.ts';
const MARKER = 'EARLY-LETTERS-REHEARSAL-STAND-IN';
const STORE = 'https://apps.apple.com/us/app/early-letters-rehearsal/id1000000000';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : detail ? `  (${detail})` : ''}`);
};

async function waitFor(url, ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).status) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function tryBuild(env) {
  try {
    return { ok: true, output: execFileSync('npx', ['next', 'build'], { env, stdio: 'pipe' }).toString() };
  } catch (e) {
    return { ok: false, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

export async function launchRehearsal() {
  const dist = '.next-release-launch';
  const base = {
    ...process.env,
    SITE_MODE: 'film',
    NEXT_DIST_DIR: dist,
    RESEND_API_KEY: 're_release_check_placeholder',
    RESEND_SEGMENT_ID: 'seg_release_check',
    NEXT_PUBLIC_APP_STORE_URL: STORE,
    NEXT_PUBLIC_APPLE_PROVIDER_TOKEN: '100000',
    NEXT_PUBLIC_APP_STORE_BADGE: '1',
    LAUNCH_STRICT: '1',
  };
  delete base.LAUNCH_REHEARSAL;
  delete base.VERCEL_ENV;
  console.log('\n== launch rehearsal (made-up store link) ==');

  const realBadge = existsSync(BADGE_FILE) && !readFileSync(BADGE_FILE, 'utf8').includes(MARKER);
  const originalQr = readFileSync(QR_FILE, 'utf8');
  let wroteStandIn = false;
  try {
    // 1. The build must refuse without the artwork.
    if (!realBadge) {
      const r = tryBuild(base);
      check('flip on without the badge file: the build fails', !r.ok);
      check('...and says what is missing', r.output.includes('[launch]') && r.output.includes('app-store-badge.svg'), r.output.slice(0, 300));
      mkdirSync('public/brand', { recursive: true });
      writeFileSync(BADGE_FILE, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><!-- ${MARKER} --><rect width="120" height="40" rx="6" fill="#000"/></svg>`);
      wroteStandIn = true;
    } else {
      console.log('SKIP  the real badge file is in place, so the "build refuses without it" check cannot run');
    }
    const env = { ...base, ...(realBadge ? {} : { LAUNCH_REHEARSAL: '1' }) };

    // 2. With the artwork in place but the committed QR not made for this link, the build must still refuse.
    execFileSync('node', ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', 'scripts/gen-store-qr.mjs', '--clear'], { stdio: 'pipe' });
    const noQr = tryBuild(env);
    check('flip on with the QR not generated for this link: the build fails', !noQr.ok);
    check('...and says to run npm run qr:generate', noQr.output.includes('npm run qr:generate'), noQr.output.slice(0, 300));

    // 3. Generate the QR for the made-up link, as the founder will for the real one, and build.
    execFileSync('node', ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', 'scripts/gen-store-qr.mjs', STORE, '100000'], { stdio: 'pipe' });
    const built = tryBuild(env);
    check('flip on with the badge and the QR: the build succeeds', built.ok, built.output.slice(-400));
    if (!built.ok) return results;
    check('no "[launch] ... ignored" line in the build log', !/\[launch\].*ignored/.test(built.output));

    const port = 3390;
    const server = spawn('npx', ['next', 'start', '-p', String(port)], { env, stdio: 'ignore', detached: true });
    const origin = `http://localhost:${port}`;
    try {
      check('server starts', await waitFor(`${origin}/`));
      const browser = await chromium.launch();
      const contexts = [
        { label: 'desktop 1440 (fine pointer)', viewport: { width: 1440, height: 900 }, qr: true },
        { label: 'phone 390 (touch)', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, qr: false },
        { label: 'phone 320 (touch)', viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true, qr: false },
      ];
      for (const c of contexts) {
        const context = await browser.newContext({ viewport: c.viewport, hasTouch: c.hasTouch, isMobile: c.isMobile });
        const page = await context.newPage();
        const problems = [];
        const foreign = [];
        page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
        page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
        page.on('request', (r) => {
          const u = new URL(r.url());
          if (u.hostname !== 'localhost' && u.protocol.startsWith('http')) foreign.push(r.url());
        });
        await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        const qr = page.locator('[data-store-qr]');
        const badge = page.locator('[data-launch-badge]');
        check(`${c.label}: QR is ${c.qr ? 'shown' : 'hidden'}`, (await qr.first().isVisible()) === c.qr);
        check(`${c.label}: end-card badge is ${c.qr ? 'hidden' : 'shown'}`, (await badge.first().isVisible()) === !c.qr);
        check(`${c.label}: the QR is in the page once, with alt text`, (await qr.count()) === 1 && (await qr.locator('svg[role="img"]').getAttribute('aria-label')) === 'QR code that opens Early Letters in the App Store');
        const href = await qr.locator('a').getAttribute('href');
        check(`${c.label}: the QR text link is the store link with ct=web-qr`, href === `${STORE}?pt=100000&ct=web-qr`, String(href));
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        check(`${c.label}: no sideways scroll`, overflow <= 0, `${overflow}px`);
        check(`${c.label}: no console or page errors`, problems.length === 0, problems[0]);
        check(`${c.label}: every request goes to this machine`, foreign.length === 0, foreign[0]);
        await context.close();
      }
      await browser.close();
    } finally {
      try { process.kill(-server.pid, 'SIGTERM'); } catch { /* already gone */ }
    }
  } finally {
    writeFileSync(QR_FILE, originalQr);
    if (wroteStandIn) rmSync(BADGE_FILE, { force: true });
    try { execFileSync('rm', ['-rf', dist]); } catch { /* ignore */ }
  }
  return results;
}
