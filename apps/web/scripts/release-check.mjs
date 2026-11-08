#!/usr/bin/env node
/**
 * Pre-release smoke test. Builds the site the way production does, starts it, and checks the things a release must
 * not break: every public page answers, unknown pages 404, the sign-up endpoint answers well and refuses badly formed
 * requests, security headers are present, and in a real browser (phone and desktop) the page loads with no errors,
 * no sideways scroll, and a move between pages completes and clears its transition.
 *
 *   node scripts/release-check.mjs [coming-soon|film]     (from apps/web; default checks both)
 *
 * It never calls a real email service: the placeholder RESEND values below only make the form render. Exits 1 on failure.
 */
import { spawn, execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';

const modes = process.argv[2] ? [process.argv[2]] : ['coming-soon', 'film'];
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

for (const [i, mode] of modes.entries()) {
  const port = 3300 + i;
  const dist = `.next-release-${mode}`;
  const env = { ...process.env, SITE_MODE: mode, NEXT_DIST_DIR: dist, RESEND_API_KEY: 're_release_check_placeholder', RESEND_SEGMENT_ID: 'seg_release_check' };
  console.log(`\n== ${mode} ==`);
  execFileSync('npx', ['next', 'build'], { env, stdio: 'ignore' });
  const server = spawn('npx', ['next', 'start', '-p', String(port)], { env, stdio: 'ignore', detached: true });
  const base = `http://localhost:${port}`;
  try {
    check(`${mode}: server starts`, await waitFor(`${base}/`));
    check(`${mode}: this run's own server answers (no leftover on the port)`, (await fetch(`${base}/`).then((r) => r.text())).includes('_next/static'));

    for (const path of ['/', '/privacy', '/terms', '/signup/thanks', '/signup/already', '/robots.txt', '/sitemap.xml']) {
      const r = await fetch(base + path);
      check(`${mode}: GET ${path} is 200`, r.status === 200, String(r.status));
    }
    check(`${mode}: unknown page is 404`, (await fetch(`${base}/no-such-page`)).status === 404);

    const home = await fetch(base + '/');
    check(`${mode}: has a content security policy`, Boolean(home.headers.get('content-security-policy')));
    check(`${mode}: sends nosniff`, home.headers.get('x-content-type-options') === 'nosniff');

    const bad = await fetch(`${base}/api/notify`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.1.${i}.1` }, body: JSON.stringify({ email: 'nope', company: '' }) });
    check(`${mode}: sign-up rejects a bad address`, bad.status === 400 && (await bad.json()).error === 'invalid');
    check(`${mode}: sign-up rejects a non-JSON body`, (await fetch(`${base}/api/notify`, { method: 'POST', body: 'x', headers: { 'x-forwarded-for': `10.2.${i}.1` } })).status === 400);
    check(`${mode}: sign-up refuses GET`, (await fetch(`${base}/api/notify`)).status === 405);

    const cssLinks = [...(await (await fetch(`${base}/`)).text()).matchAll(/href="([^"]+\.css[^"]*)"/g)].map((m) => m[1]);
    let hasViewTransition = false;
    for (const href of cssLinks) if ((await (await fetch(new URL(href, base))).text()).includes('@view-transition')) hasViewTransition = true;
    check(`${mode}: the page-to-page view transition is shipped`, hasViewTransition);

    const browser = await chromium.launch();
    for (const [w, h, label] of [[390, 844, 'phone'], [1440, 900, 'desktop']]) {
      const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
      const problems = [];
      page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
      page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
      await page.goto(base + '/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      check(`${mode} ${label}: loads with no console or page errors`, problems.length === 0, problems[0]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`${mode} ${label}: no sideways scroll`, overflow <= 0, `${overflow}px`);
      check(`${mode} ${label}: has one main landmark`, (await page.locator('main').count()) === 1);

      const legal = page.getByRole('link', { name: 'Privacy' }).first();
      if (await legal.count()) {
        await legal.scrollIntoViewIfNeeded();
        // A click before the page has hydrated is an ordinary page load (it works, it just has no transition), so wait for React.
        await page.waitForFunction(() => {
          const a = document.querySelector('a[href="/privacy"]');
          return Boolean(a) && Object.keys(a).some((k) => k.startsWith('__reactProps'));
        }, null, { timeout: 15000 }).catch(() => {});
        // Record whether the transition veil ever appears, so a quick click and a slow check cannot disagree.
        await page.evaluate(() => {
          window.__veilSeen = false;
          new MutationObserver(() => {
            if (document.querySelector('[aria-hidden="true"][class*="veil"]')) window.__veilSeen = true;
          }).observe(document.body, { childList: true, subtree: true });
        });
        await legal.click();
        await page.waitForURL('**/privacy', { timeout: 8000 }).catch(() => {});
        check(`${mode} ${label}: moving to another page works`, page.url().endsWith('/privacy'), page.url());
        await page.waitForTimeout(1300);
        // Two paths, both must be covered: an in-app move shows the veil (the marker survives), a full page load
        // (the marker is gone) is covered by the browser-level view transition in globals.css.
        const inApp = await page.evaluate(() => typeof window.__veilSeen === 'boolean');
        check(`${mode} ${label}: the page transition plays (${inApp ? 'in-app veil' : 'full load, view transition'})`, inApp ? await page.evaluate(() => window.__veilSeen === true) : hasViewTransition);
        check(`${mode} ${label}: the page transition clears`, (await page.locator('[aria-hidden="true"][class*="veil"]').count()) === 0);
        check(`${mode} ${label}: no errors after the move`, problems.length === 0, problems[0]);
      }
      await page.context().close();
    }
    await browser.close();
  } finally {
    // The whole process group: npx starts next as a child, and a leftover server would answer the next run with an old build.
    try { process.kill(-server.pid, 'SIGTERM'); } catch { /* already gone */ }
    try { execFileSync('rm', ['-rf', dist]); } catch { /* ignore */ }
  }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
