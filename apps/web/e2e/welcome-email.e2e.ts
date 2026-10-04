/**
 * The welcome email, captured from the mocked POST /emails (nothing is sent anywhere), and what repeat or
 * unsubscribed sign-ups do. Code: src/lib/notify/provider.ts (sendWelcome), welcome-email.ts, lib/email/layout.ts.
 */
import { site } from '../src/content/site';
import { TEST_ENV } from './support/env';
import { expect, notifyApi, test, unsubscribeToken, type SentEmail } from './support/fixtures';

const w = site.welcomeEmail;
const ORIGIN = 'https://earlyletters.com'; // the address in the email's links: the site's canonical origin, not the test server

test.describe('welcome email', () => {
  let sent: SentEmail;
  let contactId: string;
  let address: string;

  test.beforeEach(async ({ request, mock, email, clientIp }) => {
    address = email;
    const res = await notifyApi(request, clientIp, email);
    expect(res.status()).toBe(200);
    const emails = await mock.emailsTo(email);
    expect(emails).toHaveLength(1);
    sent = emails[0];
    contactId = (await mock.contact(email))!.id;
  });

  test('subject, sender, reply-to and recipient', async () => {
    expect(sent.subject).toBe(w.subject);
    expect(sent.subject).toContain(site.brand.name);
    expect(sent.from).toBe(`${site.brand.name} <${site.footer.contact}>`);
    expect(sent.reply_to).toBe(site.footer.contact);
    expect(sent.to).toEqual([address]);
  });

  test('carries the personal unsubscribe link and the one-click headers (RFC 8058)', async () => {
    const token = unsubscribeToken(contactId);
    const mailto = `mailto:${site.footer.contact}?subject=Unsubscribe`;
    expect(sent.headers['List-Unsubscribe']).toBe(`<${ORIGIN}/api/unsubscribe?t=${token}>, <${mailto}>`);
    expect(sent.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    // The link in the body is the confirm page with the same token, in both versions.
    expect(sent.html).toContain(`${ORIGIN}/unsubscribe?t=${token}`);
    expect(sent.text).toContain(`${ORIGIN}/unsubscribe?t=${token}`);
    // The link carries an opaque id, never the address.
    expect(sent.headers['List-Unsubscribe']).not.toContain(address);
    expect(sent.html).not.toContain(encodeURIComponent(address));
    expect(sent.html).not.toContain(`t=${address}`);
  });

  test('the HTML is a complete, accessible document with a plain-text twin', async () => {
    expect(sent.html.trimStart().toLowerCase()).toMatch(/^<!doctype html>/);
    expect(sent.html).toMatch(/<html[^>]*\blang="en"/);
    expect(sent.html).toContain(`<title>`);
    expect(sent.html).toContain(w.headline);
    expect(sent.html).toContain(site.brand.name);
    expect(sent.text.length).toBeGreaterThan(200);
    expect(sent.text).not.toMatch(/<[a-z!/][^>]*>/i);
    expect(sent.text).toContain(w.headline);
    // Every image has alternative text.
    for (const img of sent.html.match(/<img\b[^>]*>/gi) ?? []) expect(img).toMatch(/\balt=/i);
  });

  test('no tracking: no remote images, scripts or tracking parameters', async () => {
    expect(sent.html).not.toMatch(/<script/i);
    const remote = [...sent.html.matchAll(/\b(?:src|href)="(https?:\/\/[^"]+)"/gi)].map((m) => new URL(m[1]));
    for (const url of remote) {
      expect(url.origin, url.href).toBe(ORIGIN);
      expect([...url.searchParams.keys()].filter((k) => /^(utm_|fbclid|gclid|mc_)/.test(k))).toEqual([]);
    }
    expect(sent.html).not.toMatch(/<img[^>]+(width|height)="1"/i);
  });

  test('the words follow the content rules: no dashes, curly quotes, ellipsis characters or emoji', async () => {
    const everything = `${sent.subject}\n${sent.text}\n${sent.html.replace(/<style[\s\S]*?<\/style>/gi, '')}`;
    expect(everything).not.toMatch(/[–—‘’“”…]/);
    expect(everything).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(everything).not.toContain('{child}');
  });
});

test.describe('repeat and unsubscribed addresses', () => {
  const post = (request: import('@playwright/test').APIRequestContext, clientIp: string, email: string) => notifyApi(request, clientIp, email);

  test('signing up twice gives the same answer, one contact, and the segment is ensured', async ({ request, mock, email, clientIp }) => {
    const first = await post(request, clientIp, email);
    const second = await post(request, clientIp, email);
    expect(first.status()).toBe(200);
    expect(second.status()).toBe(200);
    // The answer does not reveal whether the address was already known.
    expect(await second.json()).toEqual(await first.json());
    const { contacts } = await mock.state();
    expect(contacts.filter((c) => c.email === email)).toHaveLength(1);
    const calls = await mock.callsFor(email);
    // The second sign-up looks the address up first, so it creates nothing and sends no second email.
    expect(calls.filter((c) => c.method === 'POST' && c.path === '/contacts')).toHaveLength(1);
    expect(calls.some((c) => c.method === 'GET' && c.path === `/contacts/${email}`)).toBe(true);
    expect(calls.some((c) => c.method === 'POST' && c.path === `/contacts/${email}/segments/${TEST_ENV.RESEND_SEGMENT_ID}`)).toBe(true);
  });

  test('an unsubscribed address stays unsubscribed and gets the same answer', async ({ request, mock, email, clientIp }) => {
    await mock.seed(email, true);
    const res = await post(request, clientIp, email);
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const contact = await mock.contact(email);
    expect(contact?.unsubscribed, 'still unsubscribed').toBe(true);
    // Nothing the site did can have turned it back on.
    const writes = (await mock.state()).calls.filter((c) => c.method === 'PATCH' && JSON.stringify(c.body).includes('false'));
    expect(writes).toEqual([]);
    expect((await mock.state()).contacts.filter((c) => c.email === email)).toHaveLength(1);
  });
});
