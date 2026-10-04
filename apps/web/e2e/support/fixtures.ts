/**
 * Shared fixtures for the specs.
 *
 *  - `mock`: read and steer the mocked Resend API (what the site's server sent, and how it answers next).
 *  - `clientIp`: a per-test address (IPv6 documentation range) sent as X-Forwarded-For, so the sign-up rate limiter
 *    (5 per 10 minutes per client, in memory) never couples one test to another. The site trusts that header
 *    here exactly as it does behind Vercel.
 *  - `email`: a fresh fictional address on example.com for the test.
 *  - `problems` (automatic): fails the test on console errors, uncaught page errors, failed requests, and any
 *    request that would leave the machine (those are blocked and reported). Opt out with
 *    `test.use({ strictConsole: false })` in a test that provokes an error on purpose.
 */
import { createHash, createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test';
import type { Call, Contact, Mode } from './mock-resend';
import { TEST_ENV, baseUrl, mockUrl } from './env';

export { expect };

export type SentEmail = {
  from: string;
  to: string[];
  reply_to?: string | string[];
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
};

export class MockResend {
  constructor(private readonly api: APIRequestContext) {}

  async state(): Promise<{ calls: Call[]; contacts: Contact[] }> {
    const response = await this.api.get(`${mockUrl()}/__mock/state`);
    return response.json();
  }
  /** How the mock answers for one address (the others are unaffected). */
  async setMode(email: string, mode: Partial<Mode>): Promise<void> {
    await this.api.post(`${mockUrl()}/__mock/mode`, { data: { email, ...mode } });
  }
  async seed(email: string, unsubscribed = false): Promise<Contact> {
    const response = await this.api.post(`${mockUrl()}/__mock/seed`, { data: { email, unsubscribed } });
    return response.json();
  }
  /** Every call the site made that mentions this address (in the body or the path). */
  async callsFor(email: string): Promise<Call[]> {
    const { calls } = await this.state();
    const needle = email.toLowerCase();
    return calls.filter((c) => JSON.stringify(c.body).toLowerCase().includes(needle) || c.path.toLowerCase().includes(needle));
  }
  /** The emails the site tried to send to this address. */
  async emailsTo(email: string): Promise<SentEmail[]> {
    const { calls } = await this.state();
    return calls
      .filter((c) => c.method === 'POST' && c.path === '/emails')
      .map((c) => c.body as SentEmail)
      .filter((body) => body.to.map((t) => t.toLowerCase()).includes(email.toLowerCase()));
  }
  async contact(email: string): Promise<Contact | undefined> {
    return (await this.state()).contacts.find((c) => c.email === email.toLowerCase());
  }
  /** Calls that updated this contact (by Resend contact id). */
  async unsubscribeWrites(contactId: string): Promise<Call[]> {
    const { calls } = await this.state();
    return calls.filter((c) => c.method === 'PATCH' && c.path === `/contacts/${contactId}`);
  }
}

/** The signed token the site puts in unsubscribe links, computed independently of the site's code. */
export function unsubscribeToken(contactId: string, secret: string = TEST_ENV.UNSUBSCRIBE_SECRET): string {
  return `${contactId}.${createHmac('sha256', secret).update(`unsubscribe:${contactId}`).digest('base64url')}`;
}

/** Waits until the page has been open long enough that the form's time-on-page check (1500 ms) passes for a person. */
export async function waitLikeAPerson(page: Page): Promise<void> {
  await page.waitForFunction(() => performance.now() > 1800);
}

type Options = { strictConsole: boolean };
type Fixtures = {
  mock: MockResend;
  clientIp: string;
  email: string;
  problems: string[];
};

let counter = 0;

export const test = base.extend<Fixtures & Options>({
  strictConsole: [true, { option: true }],

  // Known only after global setup has picked a free port.
  baseURL: async ({}, use) => {
    await use(baseUrl());
  },

  clientIp: async ({}, use, testInfo) => {
    const h = createHash('sha256').update(`${testInfo.testId}:${testInfo.retry}:${testInfo.repeatEachIndex}`).digest('hex');
    await use(`2001:db8:${h.slice(0, 4)}:${h.slice(4, 8)}::1`);
  },

  email: async ({}, use, testInfo) => {
    counter += 1;
    const slug = testInfo.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 24).replace(/^-|-$/g, '');
    await use(`asha.${slug}.${testInfo.workerIndex}.${counter}@example.com`);
  },

  mock: async ({ playwright }, use) => {
    const api = await playwright.request.newContext();
    await use(new MockResend(api));
    await api.dispose();
  },

  // Each test sends its own client address.
  context: async ({ context, clientIp }, use) => {
    await context.setExtraHTTPHeaders({ 'x-forwarded-for': clientIp });
    await use(context);
  },

  problems: [
    async ({ context, strictConsole }, use) => {
      const problems: string[] = [];
      const origin = new URL(baseUrl()).origin;

      // Nothing may leave the machine. Report it and block it.
      await context.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.origin === origin) return route.continue();
        problems.push(`external request blocked: ${route.request().method()} ${url.origin}${url.pathname}`);
        return route.abort('blockedbyclient');
      });

      const watch = (page: Page) => {
        page.on('console', (msg) => {
          if (msg.type() === 'error') problems.push(`console error: ${msg.text()} (${msg.location().url})`);
        });
        page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
        page.on('requestfailed', (request) => {
          const reason = request.failure()?.errorText ?? '';
          // A navigation (a form post, a click on a link) cancels what the old page still had in flight. Not a failure.
          if (reason === 'net::ERR_ABORTED') return;
          problems.push(`request failed: ${request.method()} ${request.url()} ${reason}`);
        });
      };
      context.on('page', watch);
      context.pages().forEach(watch);

      await use(problems);
      if (strictConsole) expect(problems, 'console errors, page errors, failed or external requests').toEqual([]);
      else expect(problems.filter((p) => p.startsWith('external request')), 'external requests').toEqual([]);
    },
    { auto: true },
  ],
});

/**
 * Posts a sign-up to the API as a person's browser would (time on page 5 s). The site allows itself 60 provider
 * calls a minute per instance (handler.ts providerCeiling); a suite that signs people up quickly can meet that, so a
 * 429 with Retry-After is waited out (at most three times). Use only where a sign-up is expected to succeed.
 */
export async function notifyApi(request: APIRequestContext, clientIp: string, email: string) {
  for (let attempt = 0; ; attempt++) {
    const res = await request.post('/api/notify', { headers: { 'x-forwarded-for': clientIp }, data: { email, company: '', t: 5000 } });
    if (res.status() !== 429 || attempt >= 3) return res;
    const wait = Math.min(Number(res.headers()['retry-after']) || 5, 65);
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
}

/** Fills the sign-up form like a person (after the time-on-page check) and presses the button. */
export async function signUp(page: Page, address: string): Promise<void> {
  await waitLikeAPerson(page);
  await page.getByLabel('Your email').fill(address);
  await page.getByRole('button', { name: 'Keep me informed' }).click();
}

/** Everything the site's server has printed so far (global setup writes it). Used to prove no address is logged. */
export function serverLog(): string {
  const file = join(__dirname, '../.results/server.log');
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}
