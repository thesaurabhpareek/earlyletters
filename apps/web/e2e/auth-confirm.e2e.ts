/**
 * The sign-in link page and the apple-app-site-association file (PRD V2 F02 6.3 step 3b, F02-U09; WP-F02-10).
 * Code: src/app/auth/confirm/*, src/app/auth/callback/page.tsx, src/app/.well-known/apple-app-site-association/route.ts.
 *
 * [A-REQ-023] the page verifies nothing: no request leaves this site, no request carries the token, and the token is
 * only ever in the fragment. [F02-REQ-011] Open the app carries no token. [A-REQ-022] [F21-REQ-024] the AASA file is
 * JSON with no redirect, for the production and .preview ids, listing only the sign-in and invite paths.
 * The ids in the file are the fictional ones from support/env.ts.
 */
import type { Request } from '@playwright/test';
import { brand } from '@scribe/brand';
import { site } from '../src/content/site';
import { TEST_ENV } from './support/env';
import { expect, test } from './support/fixtures';

const copy = site.authConfirm;
/** A token hash shaped like Supabase's (the app accepts 16 to 256 url-safe characters). */
const TOKEN = 'e2eTokenHash_9f3c1a7b5d2e4f60a8b7c6d5e4f3a2b1';

function carriesToken(r: Request): boolean {
  const headers = JSON.stringify(r.headers());
  return r.url().includes(TOKEN) || headers.includes(TOKEN) || (r.postData() ?? '').includes(TOKEN);
}

for (const path of ['/auth/confirm', '/auth/callback']) {
  test.describe(`${path} (a sign-in link opened outside the app)`, () => {
    test('shows the code instruction and an Open button that carries no token', async ({ page }) => {
      await page.goto(`${path}#token_hash=${TOKEN}&type=email`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(copy.line);
      await expect(page.getByText(copy.body)).toBeVisible();
      await expect(page.getByText(copy.expired)).toBeVisible();
      await expect(page.getByText(copy.notYou)).toBeVisible();
      const open = page.getByRole('link', { name: copy.open });
      await expect(open).toHaveAttribute('href', `${brand.scheme}://auth/callback`);
      expect(await open.getAttribute('href')).not.toContain(TOKEN);
      await expect(page).toHaveTitle(new RegExp(copy.title));
      // Nothing to submit and nothing that could post the fragment anywhere.
      await expect(page.locator('form')).toHaveCount(0);
      await expect(page.locator('iframe')).toHaveCount(0);
      for (const href of await page.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))) {
        expect(href, 'no link on the page carries the token').not.toContain(TOKEN);
      }
    });

    test('makes no request off this site and none that carries the token, with or without a tap', async ({ page, baseURL }) => {
      const requests: Request[] = [];
      page.on('request', (r) => requests.push(r));
      await page.goto(`${path}#token_hash=${TOKEN}&type=email`, { waitUntil: 'networkidle' });
      // Let any late script run, then use the page the way a person would.
      await page.mouse.move(10, 10);
      await page.getByRole('heading', { level: 1 }).click();
      await page.waitForLoadState('networkidle');
      expect(requests.length).toBeGreaterThan(0);
      const origin = new URL(baseURL!).origin;
      for (const r of requests) {
        expect(new URL(r.url()).origin, r.url()).toBe(origin);
        expect(r.url(), 'no Supabase call').not.toMatch(/supabase/i);
        expect(carriesToken(r), `request carries the token: ${r.method()} ${r.url()}`).toBe(false);
      }
      // The token stayed where the email put it: in the fragment, in this browser only.
      expect(new URL(page.url()).hash).toContain(TOKEN);
    });

    test('is not indexed, is static, and sends no Referer from the page', async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), 'no redirect: the page answers itself').toBe(200);
      expect(res.headers()['referrer-policy']).toBe('no-referrer');
      const html = await res.text();
      expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/);
      expect(html).toContain('<link rel="canonical" href="https://earlyletters.com/auth/confirm"');
      expect(html).not.toMatch(/supabase|posthog|vercel-insights|_vercel\/insights|googletagmanager/i);
    });
  });
}

test.describe('apple-app-site-association', () => {
  test('is JSON at the well-known path with no redirect, for the production and .preview ids only', async ({ request }) => {
    const res = await request.get('/.well-known/apple-app-site-association', { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/^application\/json/);
    const body = await res.json();
    const [detail] = body.applinks.details;
    const id = `${TEST_ENV.APPLE_TEAM_ID}.${TEST_ENV.IOS_BUNDLE_ID}`;
    expect(detail.appIDs).toEqual([id, `${id}.preview`]);
    expect(detail.components.map((c: Record<string, string>) => c['/'])).toEqual([
      '/auth/confirm',
      '/auth/confirm/',
      '/auth/callback',
      '/auth/callback/',
      '/i/*',
      '/j',
      '/j/',
    ]);
  });
});
