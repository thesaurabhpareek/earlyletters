/**
 * The co-parent invite link page (PRD V2 F11 6.3 step 1, F11-U01, F11-U02; WP-F11-11; F21-REQ-024). Code:
 * src/app/j/*. The app writes invites as https://earlyletters.com/j#t=<token> (apps/mobile
 * src/lib/family/invite-link.logic.ts).
 *
 * [B-NFR-002] the token lives only in the fragment: no request the browser makes, the page's own included, carries
 * it. [F11-REQ-005] the page loads nothing off this site, sends the token nowhere, and copies the link only on a
 * tap. [F11-U02] a link whose fragment was dropped says so instead of offering a copy.
 */
import type { Request } from '@playwright/test';
import { site } from '../src/content/site';
import { expect, test } from './support/fixtures';

const copy = site.invite;
/** Shaped like the app's invite tokens (apps/mobile src/lib/family/invite-link.logic.ts). */
const TOKEN = 'e2eInviteTok_7a1c9e3b5d2f4a6c8e0b1d3f5a7c9e2b';
const LINK = `/j#t=${TOKEN}`;

function carriesToken(r: Request): boolean {
  const headers = JSON.stringify(r.headers());
  return r.url().includes(TOKEN) || headers.includes(TOKEN) || (r.postData() ?? '').includes(TOKEN);
}

test.describe('/j#t=<token> (an invite opened outside the app)', () => {
  test('shows the copy-and-paste instruction, and no name of a child or a parent', async ({ page }) => {
    await page.goto(LINK);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(copy.line);
    await expect(page.getByText(copy.body)).toBeVisible();
    await expect(page.getByRole('listitem')).toHaveText([...copy.steps]);
    await expect(page.getByRole('button', { name: copy.copy })).toBeVisible();
    await expect(page.getByText(copy.onComputer)).toBeVisible();
    await expect(page.getByText(copy.notYou)).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(copy.title));
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(new URL(page.url()).hash, 'the address bar keeps the invite').toBe(`#t=${TOKEN}`);
    for (const href of await page.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))) {
      expect(href, 'no link on the page carries the token').not.toContain(TOKEN);
    }
  });

  test('copies the whole link on a tap, and no request at all carries the token', async ({ page, context, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
    const requests: Request[] = [];
    page.on('request', (r) => requests.push(r));
    await page.goto(LINK, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: copy.copy }).click();
    await expect(page.getByRole('status')).toHaveText(copy.copied);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${origin}${LINK}`);
    await page.waitForLoadState('networkidle');
    expect(requests.length).toBeGreaterThan(0);
    for (const r of requests) {
      expect(new URL(r.url()).origin, r.url()).toBe(origin);
      expect(carriesToken(r), `request carries the token: ${r.method()} ${r.url()}`).toBe(false);
    }
  });

  test('copies the link the way the app reads it, without a query a chat app added on the way', async ({ page, context, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
    await page.goto(`/j?fbclid=e2e_click_id#t=${TOKEN}`);
    await page.getByRole('button', { name: copy.copy }).click();
    await expect(page.getByRole('status')).toHaveText(copy.copied);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${origin}${LINK}`);
  });

  test('takes a query a chat app added out of the address bar, so copying the address by hand works too', async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    await page.goto(`/j?fbclid=e2e_click_id#t=${TOKEN}`);
    await expect(page).toHaveURL(`${origin}${LINK}`);
    await expect(page.getByRole('button', { name: copy.copy })).toBeVisible();
  });

  for (const fragment of [`#t=${TOKEN}&utm_source=chat`, `#x=1&t=${TOKEN}`]) {
    test(`copies only /j#t=<token> from /j${fragment.replace(TOKEN, '<token>')}`, async ({ page, context, baseURL }) => {
      const origin = new URL(baseURL!).origin;
      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
      await page.goto(`/j${fragment}`);
      await page.getByRole('button', { name: copy.copy }).click();
      await expect(page.getByRole('status')).toHaveText(copy.copied);
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${origin}${LINK}`);
    });
  }

  test('a link whose fragment was dropped asks for the link again instead of copying', async ({ page }) => {
    await page.goto('/j');
    await expect(page.getByRole('status')).toHaveText(copy.missing);
    await expect(page.getByRole('button', { name: copy.copy })).toHaveCount(0);
  });

  test('a fragment whose t is not shaped like an invite token gets the same line, not a copy', async ({ page }) => {
    await page.goto('/j#t=too-short');
    await expect(page.getByRole('status')).toHaveText(copy.missing);
    await expect(page.getByRole('button', { name: copy.copy })).toHaveCount(0);
  });

  test('is one static page: not indexed, no redirect, no Referer, no token path', async ({ request }) => {
    const res = await request.get('/j', { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    expect(res.headers()['referrer-policy']).toBe('no-referrer');
    const html = await res.text();
    expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/);
    expect(html).not.toMatch(/supabase|posthog|vercel-insights|_vercel\/insights|googletagmanager/i);
    // The old /i/<token> form is gone: no page answers it, so nothing invites a token into a path.
    expect((await request.get(`/i/${TOKEN}`, { maxRedirects: 0 })).status()).toBe(404);
  });
});
