/** Unsubscribe: the token, the one-click endpoint and the page. Resend is mocked; fixtures use the fictional family "Asha". */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const resend = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('resend', () => ({
  Resend: class {
    contacts = { update: resend.update };
  },
}));

const SECRET = 'test-secret-for-unsubscribe-links';
const ID = 'contact-0001-asha';

async function tokens() {
  return import('../src/lib/notify/unsubscribe');
}

function post(url: string, init: { form?: string; origin?: string; ip?: string } = {}): Request {
  const headers: Record<string, string> = { 'x-forwarded-for': init.ip ?? '203.0.113.21', host: 'earlyletters.com' };
  if (init.form !== undefined) headers['content-type'] = 'application/x-www-form-urlencoded';
  if (init.origin) headers.origin = init.origin;
  return new Request(url, { method: 'POST', headers, body: init.form ?? 'List-Unsubscribe=One-Click' });
}

async function handle(request: Request) {
  vi.resetModules();
  const mod = await import('../src/lib/notify/unsubscribe-handler');
  mod.resetUnsubscribeLimits();
  return mod.handleUnsubscribe(request);
}

beforeEach(() => {
  resend.update.mockReset().mockResolvedValue({ data: { id: ID }, error: null, headers: null });
  vi.stubEnv('UNSUBSCRIBE_SECRET', SECRET);
  vi.stubEnv('RESEND_API_KEY', 're_test_key');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('token', () => {
  it('round-trips, and carries no address', async () => {
    const { makeUnsubscribeToken, readUnsubscribeToken } = await tokens();
    const token = makeUnsubscribeToken(ID, SECRET);
    expect(token).toMatch(/^contact-0001-asha\.[A-Za-z0-9_-]{43}$/);
    expect(readUnsubscribeToken(token, SECRET)).toBe(ID);
  });

  it('rejects a changed id, a changed signature, another secret, junk and no secret', async () => {
    const { makeUnsubscribeToken, readUnsubscribeToken } = await tokens();
    const token = makeUnsubscribeToken(ID, SECRET) as string;
    expect(readUnsubscribeToken(token.replace('asha', 'beth'), SECRET)).toBeNull();
    expect(readUnsubscribeToken(`${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`, SECRET)).toBeNull();
    expect(readUnsubscribeToken(token, 'another-secret')).toBeNull();
    expect(readUnsubscribeToken('nope', SECRET)).toBeNull();
    expect(readUnsubscribeToken('.', SECRET)).toBeNull();
    expect(readUnsubscribeToken(null, SECRET)).toBeNull();
    expect(readUnsubscribeToken(token, undefined)).toBeNull();
    expect(makeUnsubscribeToken(ID, undefined)).toBeNull();
    expect(makeUnsubscribeToken('has space', SECRET)).toBeNull();
  });
});

describe('POST /api/unsubscribe', () => {
  it('one-click: a genuine token in the query unsubscribes the contact and answers 200', async () => {
    const { makeUnsubscribeToken } = await tokens();
    const token = makeUnsubscribeToken(ID, SECRET);
    const res = await handle(post(`https://earlyletters.com/api/unsubscribe?t=${token}`));
    expect(res.status).toBe(200);
    expect(resend.update).toHaveBeenCalledWith({ id: ID, unsubscribed: true }, expect.anything());
  });

  it('the page form: token in the body, redirect back to the done page', async () => {
    const { makeUnsubscribeToken } = await tokens();
    const token = makeUnsubscribeToken(ID, SECRET) as string;
    const res = await handle(post('https://earlyletters.com/api/unsubscribe', { form: `t=${encodeURIComponent(token)}`, origin: 'https://earlyletters.com' }));
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/unsubscribe?done=1');
    expect(resend.update).toHaveBeenCalledTimes(1);
  });

  it('refuses a forged token and does not touch Resend', async () => {
    const res = await handle(post(`https://earlyletters.com/api/unsubscribe?t=${ID}.forged`));
    expect(res.status).toBe(400);
    expect(resend.update).not.toHaveBeenCalled();
    const form = await handle(post('https://earlyletters.com/api/unsubscribe', { form: `t=${ID}.forged` }));
    expect(form.headers.get('location')).toBe('/unsubscribe?invalid=1');
  });

  it('refuses a foreign Origin', async () => {
    const { makeUnsubscribeToken } = await tokens();
    const res = await handle(post(`https://earlyletters.com/api/unsubscribe?t=${makeUnsubscribeToken(ID, SECRET)}`, { origin: 'https://evil.example' }));
    expect(res.status).toBe(400);
    expect(resend.update).not.toHaveBeenCalled();
  });

  it('answers 500 when Resend fails, and logs no token or id', async () => {
    resend.update.mockResolvedValue({ data: null, error: { name: 'application_error', statusCode: 500, message: `bad ${ID}` }, headers: null });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { makeUnsubscribeToken } = await tokens();
    const token = makeUnsubscribeToken(ID, SECRET) as string;
    const res = await handle(post(`https://earlyletters.com/api/unsubscribe?t=${token}`));
    expect(res.status).toBe(500);
    const logged = JSON.stringify(spy.mock.calls);
    expect(logged).toContain('unsubscribe failed');
    expect(logged).not.toContain(ID);
    expect(logged).not.toContain(token);
  });

  it('exports only POST, so fetching the link changes nothing', async () => {
    const route = await import('../src/app/api/unsubscribe/route');
    expect(Object.keys(route).filter((k) => ['GET', 'HEAD', 'PUT', 'DELETE', 'PATCH'].includes(k))).toEqual([]);
    expect(typeof route.POST).toBe('function');
  });
});
