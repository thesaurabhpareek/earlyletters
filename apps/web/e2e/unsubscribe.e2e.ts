/**
 * Unsubscribe, from the link in the welcome email to the mocked Resend update.
 * Code: src/app/unsubscribe/page.tsx, src/app/api/unsubscribe/route.ts, src/lib/notify/unsubscribe*.ts.
 */
import type { APIRequestContext } from '@playwright/test';
import { site } from '../src/content/site';
import { expect, notifyApi, test, unsubscribeToken, type MockResend } from './support/fixtures';

const u = site.unsubscribe;

/**
 * A subscribed contact, created directly in the mock, with its genuine unsubscribe token and page link. Most tests
 * here are about unsubscribing, not signing up, and this keeps them off the site's per-instance ceiling on provider
 * calls (60 a minute). The two tests that follow the real email use `viaSite`.
 */
async function subscribed(_request: APIRequestContext, mock: MockResend, email: string, _clientIp: string) {
  const contact = await mock.seed(email);
  const token = unsubscribeToken(contact.id);
  return { path: `/unsubscribe?t=${encodeURIComponent(token)}`, token, contact };
}

/** Signs the address up through the site and returns the token and the page link from the captured welcome email. */
async function viaSite(request: APIRequestContext, mock: MockResend, email: string, clientIp: string) {
  const res = await notifyApi(request, clientIp, email);
  expect(res.status()).toBe(200);
  const [welcome] = await mock.emailsTo(email);
  const link = /https:\/\/earlyletters\.com(\/unsubscribe\?t=[^"&\s<]+)/.exec(welcome.html);
  expect(link, 'the welcome email has the unsubscribe link').not.toBeNull();
  const contact = (await mock.contact(email))!;
  return { path: link![1], token: new URL(`http://x${link![1]}`).searchParams.get('t')!, contact };
}

const oneClick = (request: APIRequestContext, query: string, clientIp: string, extra: Record<string, string> = {}) =>
  request.post(`/api/unsubscribe${query}`, {
    headers: { 'x-forwarded-for': clientIp, 'content-type': 'application/x-www-form-urlencoded', ...extra },
    data: 'List-Unsubscribe=One-Click',
    maxRedirects: 0,
  });

test.describe('unsubscribe page', () => {
  test('confirm first, then done: the link in the email asks, the button acts', async ({ page, request, mock, email, clientIp }) => {
    const { path, contact } = await viaSite(request, mock, email, clientIp);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: u.title })).toBeVisible();
    await expect(page.getByText(u.body)).toBeVisible();
    // Opening the page (what a link scanner does) changed nothing.
    expect(await mock.unsubscribeWrites(contact.id)).toEqual([]);
    expect((await mock.contact(email))?.unsubscribed).toBe(false);
    await page.reload();
    expect((await mock.contact(email))?.unsubscribed).toBe(false);

    await page.getByRole('button', { name: u.button }).click();
    await expect(page).toHaveURL(/\/unsubscribe\?done=1$/);
    await expect(page.getByRole('heading', { level: 1, name: u.doneTitle })).toBeVisible();
    await expect(page.getByText(u.doneBody)).toBeVisible();
    await expect(page.getByRole('button', { name: u.button })).toHaveCount(0);

    // Exactly one update, for this contact, and the token is not in the final address.
    const writes = await mock.unsubscribeWrites(contact.id);
    expect(writes).toHaveLength(1);
    expect(writes[0].body).toEqual({ unsubscribed: true });
    expect((await mock.contact(email))?.unsubscribed).toBe(true);
    expect(page.url()).not.toContain('t=');
    // Back to the site from either state.
    await page.getByRole('link', { name: u.home }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('works with JavaScript off (it is a plain form)', async ({ browser, request, mock, email, clientIp, baseURL }) => {
    const { path } = await subscribed(request, mock, email, clientIp);
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL, extraHTTPHeaders: { 'x-forwarded-for': clientIp } });
    const page = await context.newPage();
    await page.goto(path);
    await page.getByRole('button', { name: u.button }).click();
    await expect(page.getByRole('heading', { level: 1, name: u.doneTitle })).toBeVisible();
    expect((await mock.contact(email))?.unsubscribed).toBe(true);
    await context.close();
  });

  test('the done page is shown to anyone and unsubscribes nobody; it is never indexed', async ({ page, request, mock, email, clientIp }) => {
    const { contact } = await subscribed(request, mock, email, clientIp);
    await page.goto('/unsubscribe?done=1');
    await expect(page.getByRole('heading', { level: 1, name: u.doneTitle })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect(await mock.unsubscribeWrites(contact.id)).toEqual([]);
  });

  test('a tampered token: the calm "did not work" page, no button, nothing changed', async ({ page, request, mock, email, clientIp }) => {
    const { token, contact } = await subscribed(request, mock, email, clientIp);
    const tampered = `${token.slice(0, -2)}${token.endsWith('AA') ? 'BB' : 'AA'}`;
    await page.goto(`/unsubscribe?t=${encodeURIComponent(tampered)}`);
    await expect(page.getByRole('heading', { level: 1, name: u.invalidTitle })).toBeVisible();
    await expect(page.getByText(u.invalidBody)).toBeVisible();
    await expect(page.getByRole('button', { name: u.button })).toHaveCount(0);
    expect(await mock.unsubscribeWrites(contact.id)).toEqual([]);
  });

  test('a token signed with another secret, a truncated token and a huge one are all refused', async ({ page }) => {
    const forged = unsubscribeToken('11111111-2222-3333-4444-555555555555', 'not-the-secret');
    for (const t of [forged, forged.slice(0, 20), 'x'.repeat(500), '.', 'abc']) {
      await page.goto(`/unsubscribe?t=${encodeURIComponent(t)}`);
      await expect(page.getByRole('heading', { level: 1, name: u.invalidTitle }), t.slice(0, 20)).toBeVisible();
      await expect(page.getByRole('button', { name: u.button })).toHaveCount(0);
    }
  });

  test('no token at all: the same "did not work" page, with a way back', async ({ page }) => {
    const response = await page.goto('/unsubscribe');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: u.invalidTitle })).toBeVisible();
    await expect(page.getByRole('link', { name: u.home })).toHaveAttribute('href', '/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test.describe('Resend down', () => {
    test('the page says so calmly, keeps the button, and the person can try again', async ({ page, request, mock, email, clientIp }) => {
      const { path } = await subscribed(request, mock, email, clientIp);
      await mock.setMode(email, { contactsUpdate: 'server_error' });
      await page.goto(path);
      await page.getByRole('button', { name: u.button }).click();
      // Inside main: Next's own (empty) route announcer is also an alert.
      await expect(page.locator('main').getByRole('alert')).toHaveText(u.error);
      await expect(page.getByRole('button', { name: u.button })).toBeVisible();
      expect((await mock.contact(email))?.unsubscribed).toBe(false);

      await mock.setMode(email, { contactsUpdate: 'ok' });
      await page.getByRole('button', { name: u.button }).click();
      await expect(page.getByRole('heading', { level: 1, name: u.doneTitle })).toBeVisible();
      expect((await mock.contact(email))?.unsubscribed).toBe(true);
    });
  });
});

test.describe('unsubscribe API', () => {
  test('one-click as a mail app sends it (form-encoded body, token in the query) answers 200 and unsubscribes', async ({ request, mock, email, clientIp }) => {
    const { token, contact } = await subscribed(request, mock, email, clientIp);
    const res = await oneClick(request, `?t=${encodeURIComponent(token)}`, clientIp);
    expect(res.status()).toBe(200);
    expect(res.headers().location).toBeUndefined();
    expect(res.headers()['cache-control']).toBe('no-store');
    expect((await mock.contact(email))?.unsubscribed).toBe(true);
    expect(await mock.unsubscribeWrites(contact.id)).toHaveLength(1);
  });

  test('one-click with no content type answers 200 too, and repeating it is harmless', async ({ request, mock, email, clientIp }) => {
    const { token } = await subscribed(request, mock, email, clientIp);
    for (let i = 0; i < 2; i++) {
      const res = await request.post(`/api/unsubscribe?t=${encodeURIComponent(token)}`, { headers: { 'x-forwarded-for': clientIp }, data: 'List-Unsubscribe=One-Click' });
      expect(res.status()).toBe(200);
    }
    expect((await mock.contact(email))?.unsubscribed).toBe(true);
  });

  test('the link in the List-Unsubscribe header is itself a working one-click endpoint', async ({ request, mock, email, clientIp }) => {
    await viaSite(request, mock, email, clientIp);
    const header = (await mock.emailsTo(email))[0].headers['List-Unsubscribe'];
    const url = /<https:\/\/earlyletters\.com(\/api\/unsubscribe\?t=[^>]+)>/.exec(header);
    expect(url).not.toBeNull();
    const res = await request.post(url![1], { headers: { 'x-forwarded-for': clientIp, 'content-type': 'application/x-www-form-urlencoded' }, data: 'List-Unsubscribe=One-Click' });
    expect(res.status()).toBe(200);
    expect((await mock.contact(email))?.unsubscribed).toBe(true);
  });

  test('GET never changes anything: the endpoint answers 405 and the contact stays subscribed', async ({ request, mock, email, clientIp }) => {
    const { token, contact } = await subscribed(request, mock, email, clientIp);
    const res = await request.get(`/api/unsubscribe?t=${encodeURIComponent(token)}`, { headers: { 'x-forwarded-for': clientIp } });
    expect(res.status()).toBe(405);
    expect(await mock.unsubscribeWrites(contact.id)).toEqual([]);
    expect((await mock.contact(email))?.unsubscribed).toBe(false);
  });

  test('a tampered or missing token is refused (400) and changes nothing', async ({ request, mock, email, clientIp }) => {
    const { token, contact } = await subscribed(request, mock, email, clientIp);
    const bad = `${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`;
    expect((await oneClick(request, `?t=${encodeURIComponent(bad)}`, clientIp)).status()).toBe(400);
    expect((await oneClick(request, '', clientIp)).status()).toBe(400);
    expect((await request.post('/api/unsubscribe', { headers: { 'x-forwarded-for': clientIp }, data: '' })).status()).toBe(400);
    expect(await mock.unsubscribeWrites(contact.id)).toEqual([]);
  });

  test('the page form with a tampered token goes back to the "did not work" page', async ({ request, mock, email, clientIp }) => {
    const { token, contact } = await subscribed(request, mock, email, clientIp);
    const res = await request.post('/api/unsubscribe', {
      headers: { 'x-forwarded-for': clientIp, 'content-type': 'application/x-www-form-urlencoded' },
      data: `t=${encodeURIComponent(token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A'))}`,
      maxRedirects: 0,
    });
    expect(res.status()).toBe(303);
    expect(res.headers().location).toBe('/unsubscribe?invalid=1');
    expect(await mock.unsubscribeWrites(contact.id)).toEqual([]);
  });

  test('a post from another site is refused', async ({ request, mock, email, clientIp }) => {
    const { token, contact } = await subscribed(request, mock, email, clientIp);
    const res = await oneClick(request, `?t=${encodeURIComponent(token)}`, clientIp, { origin: 'https://example.org' });
    expect(res.status()).toBe(400);
    expect(await mock.unsubscribeWrites(contact.id)).toEqual([]);
  });

  test('one client is limited to 20 attempts in ten minutes', async ({ request, clientIp }) => {
    let last = 0;
    for (let i = 0; i < 21; i++) last = (await oneClick(request, '?t=nope', clientIp)).status();
    expect(last).toBe(429);
  });
});
