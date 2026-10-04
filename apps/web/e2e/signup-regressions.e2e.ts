/**
 * Regression tests for the two sign-up defects the end-to-end audit found (A-U2 and A-U8), now fixed:
 * a native form post (script off or not loaded yet) saves the address and lands on a page; a repeat or
 * unsubscribed address gets no second email. Written up in docs/release/qa/web-e2e-findings.md.
 */
import { site } from '../src/content/site';
import { expect, notifyApi, signUp, test } from './support/fixtures';

const n = site.notify;

test.describe('A-U2: sign-up without JavaScript', () => {
  test.use({ javaScriptEnabled: false, strictConsole: false });

  test('a native submit saves the address, sends the welcome and lands the person on a readable page, not raw JSON', async ({ page, mock, email }) => {
    await page.goto('/');
    await page.getByLabel(n.label).fill(email);
    const [response] = await Promise.all([page.waitForResponse((r) => r.url().endsWith('/api/notify')), page.getByRole('button', { name: n.button }).click()]);
    await page.waitForLoadState('load');

    // The post is answered with a redirect, and the person ends on a page of the site, never the machine's JSON.
    expect(response.status()).toBe(303);
    await expect(page).toHaveURL(/\/signup\/thanks$/);
    await expect(page.getByRole('heading', { level: 1, name: n.thanksTitle })).toBeVisible();
    await expect(page.getByText(n.success)).toBeVisible();
    expect(await page.content()).not.toContain('"ok"');
    // And it worked: the address is saved and the welcome went out.
    expect(await mock.contact(email)).toBeDefined();
    expect(await mock.emailsTo(email)).toHaveLength(1);
  });
});

test.describe('A-U8: repeat and unsubscribed addresses', () => {
  const post = (request: import('@playwright/test').APIRequestContext, clientIp: string, email: string) =>
    notifyApi(request, clientIp, email);

  test('signing up a second time sends no second welcome email', async ({ request, mock, email, clientIp }) => {
    await post(request, clientIp, email);
    await post(request, clientIp, email);
    expect(await mock.emailsTo(email)).toHaveLength(1);
  });

  test('the form in the browser: the second sign-up of the same address sends no second welcome email', async ({ page, mock, email }) => {
    await page.goto('/');
    await signUp(page, email);
    await expect(page.getByText(n.success)).toBeVisible();
    await page.reload();
    await signUp(page, email);
    await expect(page.getByText(n.success)).toBeVisible();
    expect(await mock.emailsTo(email)).toHaveLength(1);
  });

  test('an unsubscribed address is left alone: it gets the same answer but no email at all', async ({ request, mock, email, clientIp }) => {
    await mock.seed(email, true);
    const res = await post(request, clientIp, email);
    expect(await res.json()).toEqual({ ok: true });
    expect((await mock.contact(email))?.unsubscribed).toBe(true);
    expect(await mock.emailsTo(email)).toEqual([]);
  });
});
