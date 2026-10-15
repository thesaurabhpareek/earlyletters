/**
 * The co-parent invite link page (PRD V2 F11 6.3 step 1, F11-U01; F21-REQ-024). Code: src/app/i/*, the /i/:token
 * rewrite in next.config.ts.
 *
 * [F11-REQ-005] the page loads nothing off this site, sends the token nowhere (no request, header or body carries
 * it, the Referer included), and copies the link only on a tap. [F21-REQ-024] the page exists for every invite path
 * the AASA file lists under /i.
 */
import type { Request } from '@playwright/test';
import { site } from '../src/content/site';
import { expect, test } from './support/fixtures';

const copy = site.invite;
/** Shaped like the app's invite tokens (apps/mobile src/lib/family/invite-link.logic.ts). */
const TOKEN = 'e2eInviteTok_7a1c9e3b5d2f4a6c8e0b1d3f5a7c9e2b';
const PATH = `/i/${TOKEN}`;

function carriesToken(r: Request): boolean {
  // The page's own request carries the token in its path by the app's link format; every other request must not.
  if (new URL(r.url()).pathname === PATH && r.resourceType() === 'document') return false;
  const headers = JSON.stringify(r.headers());
  return r.url().includes(TOKEN) || headers.includes(TOKEN) || (r.postData() ?? '').includes(TOKEN);
}

test.describe('/i/<token> (an invite opened outside the app)', () => {
  test('shows the copy-and-paste instruction, and no name of a child or a parent', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(copy.line);
    await expect(page.getByText(copy.body)).toBeVisible();
    await expect(page.getByRole('button', { name: copy.copy })).toBeVisible();
    await expect(page.getByText(copy.notYou)).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(copy.title));
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(new URL(page.url()).pathname, 'the address bar keeps the invite link').toBe(PATH);
    for (const href of await page.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))) {
      expect(href, 'no link on the page carries the token').not.toContain(TOKEN);
    }
  });

  test('copies the link on a tap, and makes no request off this site or with the token', async ({ page, context, baseURL }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(baseURL!).origin });
    const requests: Request[] = [];
    page.on('request', (r) => requests.push(r));
    await page.goto(PATH, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: copy.copy }).click();
    await expect(page.getByRole('status')).toHaveText(copy.copied);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${new URL(baseURL!).origin}${PATH}`);
    await page.waitForLoadState('networkidle');
    const origin = new URL(baseURL!).origin;
    for (const r of requests) {
      expect(new URL(r.url()).origin, r.url()).toBe(origin);
      expect(carriesToken(r), `request carries the token: ${r.method()} ${r.url()}`).toBe(false);
    }
  });

  test('is one static page for every token: not indexed, no redirect, no Referer', async ({ request }) => {
    for (const path of [PATH, '/i/another-token-0123456789']) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(200);
      expect(res.headers()['referrer-policy'], path).toBe('no-referrer');
      const html = await res.text();
      expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/);
      expect(html, 'the token is never rendered into the page').not.toContain(path.slice(3));
      expect(html).not.toMatch(/supabase|posthog|vercel-insights|_vercel\/insights|googletagmanager/i);
    }
  });
});
