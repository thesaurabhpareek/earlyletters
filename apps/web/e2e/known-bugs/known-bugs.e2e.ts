/**
 * Tests of the CORRECT behaviour for bugs that are still open. They fail today, so they are not part of the default
 * run (`npm run e2e`); run them with `npm run e2e:known-bugs -w @scribe/web`. Each one is written up, with file and
 * line, in docs/release/qa/web-e2e-findings.md. When a bug is fixed, move its test into the main suite.
 */
import { site } from '../../src/content/site';
import { expect, notifyApi, signUp, test } from '../support/fixtures';

const n = site.notify;

test.describe('KB-1 (audit A-U2): sign-up without JavaScript', () => {
  test.use({ javaScriptEnabled: false, strictConsole: false });

  test('a native submit saves the address, sends the welcome and lands the person on a readable page, not raw JSON', async ({ page, mock, email }) => {
    await page.goto('/');
    await page.getByLabel(n.label).fill(email);
    const [response] = await Promise.all([page.waitForResponse((r) => r.url().endsWith('/api/notify')), page.getByRole('button', { name: n.button }).click()]);
    await page.waitForLoadState('load');

    // The person sees a page of the site (HTML), never the machine's JSON answer.
    expect(response.headers()['content-type']).toMatch(/text\/html/);
    expect(await page.content()).not.toContain('"ok"');
    // And it worked: the address is saved and the welcome went out.
    expect(await mock.contact(email)).toBeDefined();
    expect(await mock.emailsTo(email)).toHaveLength(1);
  });
});

test.describe('KB-2 (audit A-U8): repeat and unsubscribed addresses', () => {
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
