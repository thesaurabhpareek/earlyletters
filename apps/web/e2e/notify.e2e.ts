/**
 * The "Keep me informed" sign-up, through the real page and the real server, with Resend mocked.
 * Rules under test: src/lib/notify/handler.ts (order of checks), client.ts, components/cta/NotifyForm.tsx.
 */
import { TEST_ENV } from './support/env';
import { site } from '../src/content/site';
import { expect, serverLog, signUp, test, waitLikeAPerson } from './support/fixtures';

const n = site.notify;
const status = (page: import('@playwright/test').Page) => page.locator('form [role="status"]').first();

test.describe('sign-up form', () => {
  test('happy path: success message, contact saved in the segment, one welcome sent', async ({ page, mock, email }) => {
    await page.goto('/');
    await signUp(page, email.toUpperCase().replace('@EXAMPLE.COM', '@example.com'));

    await expect(page.getByText(n.success)).toBeVisible();
    // The form is replaced by the message (nothing left to submit twice).
    await expect(page.getByLabel(n.label)).toHaveCount(0);

    const contact = await mock.contact(email);
    expect(contact, 'a contact was created, lower-cased').toBeDefined();
    expect(contact?.segments).toEqual([TEST_ENV.RESEND_SEGMENT_ID]);
    expect(await mock.emailsTo(email)).toHaveLength(1);

    // Only the address is sent to Resend: no name, IP or custom property.
    const create = (await mock.callsFor(email)).find((c) => c.method === 'POST' && c.path === '/contacts');
    expect(create?.authorization).toBe(`Bearer ${TEST_ENV.RESEND_API_KEY}`);
    expect(Object.keys(create?.body as object).sort()).toEqual(['email', 'segments']);
  });

  test('the success message is announced politely and the form is labelled', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel(n.label);
    await expect(input).toHaveAttribute('type', 'email');
    await expect(input).toHaveAttribute('autocomplete', 'email');
    await expect(input).toHaveAttribute('required', '');
    await expect(page.getByText(n.note)).toBeVisible();
    await expect(page.locator('form [role="status"][aria-live="polite"]')).toHaveCount(1);
  });

  test('invalid email caught by the page: calm message, no request, nothing stored', async ({ page, mock }) => {
    await page.goto('/');
    let posted = 0;
    page.on('request', (r) => r.url().endsWith('/api/notify') && posted++);
    await signUp(page, 'asha-at-example.com');
    await expect(status(page)).toHaveText(n.error);
    await expect(page.getByLabel(n.label)).toHaveAttribute('aria-invalid', 'true');
    expect(posted).toBe(0);
    expect((await mock.state()).calls.filter((c) => JSON.stringify(c.body).includes('asha-at-example'))).toHaveLength(0);
  });

  test.describe('server says invalid', () => {
    test.use({ strictConsole: false }); // the 400 is logged by the browser as a failed resource

    test('an address the server rejects shows the same calm message', async ({ page, mock }) => {
      await page.goto('/');
      // Passes the page's quick shape check, fails the server's stricter one (no real top-level name).
      await signUp(page, 'asha@example.c');
      await expect(status(page)).toHaveText(n.error);
      expect((await mock.state()).calls.filter((c) => JSON.stringify(c.body).includes('asha@example.c"'))).toHaveLength(0);
    });
  });

  test('honeypot: a filled hidden field looks like success but stores nothing and sends nothing', async ({ page, mock, email }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    // The trap is hidden from people and from screen readers.
    const trap = page.locator('#notify-company');
    await expect(trap).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('#notify-company').locator('xpath=ancestor::div[@aria-hidden="true"]')).toHaveCount(1);
    await trap.fill('Acme Bots', { force: true });
    await page.getByLabel(n.label).fill(email);
    await page.getByRole('button', { name: n.button }).click();
    await expect(page.getByText(n.success)).toBeVisible();
    expect(await mock.callsFor(email)).toEqual([]);
  });

  test.describe('too fast', () => {
    test.use({ strictConsole: false }); // the 429 is logged by the browser as a failed resource

    test('a submit no person could make (under 1.5 s) gets the try-again message and stores nothing', async ({ page, mock, email }) => {
      // Make "time on page" 100 ms, deterministically.
      await page.addInitScript(() => {
        performance.now = () => 100;
      });
      await page.goto('/');
      await page.getByLabel(n.label).fill(email);
      await page.getByRole('button', { name: n.button }).click();
      await expect(status(page)).toHaveText(n.rateLimited);
      expect(await mock.callsFor(email)).toEqual([]);
      // The person can simply try again: the form is still there.
      await expect(page.getByLabel(n.label)).toBeVisible();
    });
  });

  test.describe('rate limit', () => {
    test.use({ strictConsole: false });

    test('the sixth post in ten minutes from one client is refused with Retry-After', async ({ request, clientIp }) => {
      const post = () =>
        request.post('/api/notify', { headers: { 'x-forwarded-for': clientIp }, data: { email: 'not-an-address', company: '' } });
      for (let i = 0; i < 5; i++) {
        const res = await post();
        expect(res.status(), `request ${i + 1}`).toBe(400);
        expect(await res.json()).toEqual({ ok: false, error: 'invalid' });
      }
      const limited = await post();
      expect(limited.status()).toBe(429);
      expect(await limited.json()).toEqual({ ok: false, error: 'rate_limited' });
      const retry = Number(limited.headers()['retry-after']);
      expect(retry).toBeGreaterThan(0);
      expect(retry).toBeLessThanOrEqual(600);
      expect(limited.headers()['cache-control']).toBe('no-store');
    });

    test('the form shows the calm wait message once the client is over the limit; another client is unaffected', async ({ page, request, clientIp, mock, email }) => {
      for (let i = 0; i < 5; i++) {
        await request.post('/api/notify', { headers: { 'x-forwarded-for': clientIp }, data: { email: 'x', company: '' } });
      }
      await page.goto('/');
      await signUp(page, email);
      await expect(status(page)).toHaveText(n.rateLimited);
      expect(await mock.callsFor(email)).toEqual([]);

      // A different client address still gets through.
      const other = await request.post('/api/notify', {
        headers: { 'x-forwarded-for': clientIp.replace(/^2001:db8:(\w+):(\w+)/, '2001:db8:$2:$1') }, // another /64: the limiter counts one client per /64
        data: { email: 'asha.other@example.com', company: '', t: 5000 },
      });
      expect(other.status()).toBe(200);
    });
  });

  test.describe('Resend failure', () => {
    test.use({ strictConsole: false });

    test('shows the calm "on our side" message, sends no welcome and logs no address', async ({ page, mock, email }) => {
      await mock.setMode(email, { contactsCreate: 'server_error' });
      await page.goto('/');
      await signUp(page, email);
      await expect(status(page)).toHaveText(n.server);
      expect(await mock.emailsTo(email)).toEqual([]);
      expect(await mock.contact(email)).toBeUndefined();
      // The server logs the error name and status only: never the address (docs/legal/DATA_CLASSIFICATION.md, L3).
      await expect.poll(serverLog).toContain('[notify] provider error name=application_error status=500');
      expect(serverLog()).not.toContain(email);
      expect(serverLog()).not.toContain('@example.com');
      // The person can try again; the form stays.
      await expect(page.getByLabel(n.label)).toBeVisible();
    });

    test('Resend rate limiting asks the person to wait a little', async ({ page, mock, email }) => {
      await mock.setMode(email, { contactsCreate: 'rate_limited' });
      await page.goto('/');
      await signUp(page, email);
      await expect(status(page)).toHaveText(n.rateLimited);
    });

    test('a failed welcome email never changes the answer: the address is saved and the person sees success', async ({ page, mock, email }) => {
      await mock.setMode(email, { emailsSend: 'error' });
      await page.goto('/');
      await signUp(page, email);
      await expect(page.getByText(n.success)).toBeVisible();
      expect(await mock.contact(email)).toBeDefined();
    });
  });

  test.describe('API shape', () => {
    test.use({ strictConsole: false });

    test('only POST with JSON from the same origin is accepted', async ({ request, clientIp }) => {
      const headers = { 'x-forwarded-for': clientIp };
      expect((await request.get('/api/notify', { headers })).status()).toBe(405);
      // Cross-site page: the Origin differs from the Host.
      const cross = await request.post('/api/notify', { headers: { ...headers, origin: 'https://example.org' }, data: { email: 'asha@example.com', company: '' } });
      expect(cross.status()).toBe(400);
      // A plain-text body is refused (forces a CORS preflight for other sites).
      const text = await request.post('/api/notify', { headers: { ...headers, 'content-type': 'text/plain' }, data: '{"email":"asha@example.com"}' });
      expect(text.status()).toBe(400);
      // No permissive CORS headers are ever sent.
      expect(cross.headers()['access-control-allow-origin']).toBeUndefined();
    });
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, strictConsole: false });

  test('the page still reads in full and the form is a plain POST to the endpoint', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(site.brand.name);
    await expect(page.getByText(site.scenes.s02.headline)).toBeVisible();
    const form = page.locator('form[action="/api/notify"]');
    await expect(form).toHaveAttribute('method', 'post');
    await expect(form.locator('input[name="email"]')).toBeVisible();
    await expect(form.locator('input[name="company"]')).toHaveValue('');
  });

  test('a native submit never puts the address in the page address (history, logs, Referer)', async ({ page, email }) => {
    await page.goto('/');
    await page.getByLabel(n.label).fill(email);
    await page.getByRole('button', { name: n.button }).click();
    await page.waitForLoadState('load');
    expect(page.url()).not.toContain(encodeURIComponent(email));
    expect(page.url()).not.toContain(email);
  });
});
