/**
 * Owner: E2 (back-end). Tests for POST /api/notify, the Resend wrapper, the limiter and the client helper.
 * The Resend client is mocked: nothing here touches a real account. Fixtures use the fictional family
 * "Asha" and documentation-only IP ranges (RFC 5737, RFC 3849).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const resend = vi.hoisted(() => ({
  create: vi.fn(),
  send: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  segmentsAdd: vi.fn(),
  constructed: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: class {
    constructor(key: string) {
      resend.constructed(key);
    }
    contacts = { create: resend.create, get: resend.get, update: resend.update, segments: { add: resend.segmentsAdd } };
    emails = { send: resend.send };
  },
}));

const EMAIL = 'Asha.Family@Example.com';
const NORMALISED = 'asha.family@example.com';
const IP = '203.0.113.7';
const SEGMENT = 'seg_test_0001';

type Json = Record<string, unknown>;

async function loadRoute() {
  vi.resetModules();
  return import('../src/app/api/notify/route');
}

function post(body: unknown, headers: Record<string, string> = {}, raw?: string): Request {
  return new Request('http://localhost:3112/api/notify', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': IP, host: 'localhost:3112', ...headers },
    body: raw ?? JSON.stringify(body),
  });
}

async function call(request: Request) {
  const { POST } = await loadRoute();
  return POST(request);
}

async function json(response: Response): Promise<Json> {
  return (await response.json()) as Json;
}

function consoleSpies() {
  return (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) => vi.spyOn(console, method).mockImplementation(() => {}));
}

function loggedText(spies: ReturnType<typeof consoleSpies>): string {
  return spies.map((spy) => JSON.stringify(spy.mock.calls)).join('\n');
}

beforeEach(() => {
  resend.create.mockReset().mockResolvedValue({ data: { id: 'contact-0001-created', object: 'contact' }, error: null, headers: null });
  resend.send.mockReset().mockResolvedValue({ data: { id: 'e_1' }, error: null, headers: null });
  resend.get.mockReset().mockResolvedValue({ data: null, error: { name: 'not_found', statusCode: 404, message: 'not found' }, headers: null });
  resend.update.mockReset().mockResolvedValue({ data: { id: 'c_1' }, error: null, headers: null });
  resend.segmentsAdd.mockReset().mockResolvedValue({ data: { id: 'c_1' }, error: null, headers: null });
  resend.constructed.mockReset();
  vi.stubEnv('RESEND_API_KEY', 're_test_key');
  vi.stubEnv('RESEND_SEGMENT_ID', SEGMENT);
  vi.stubEnv('UNSUBSCRIBE_SECRET', 'test-secret-for-unsubscribe-links');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('valid signup', () => {
  it('stores the normalised address in the segment and answers ok', async () => {
    const response = await call(post({ email: `  ${EMAIL}  `, company: '' }));
    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ ok: true });
    expect(response.headers.get('cache-control')).toBe('no-store');

    expect(resend.constructed).toHaveBeenCalledWith('re_test_key');
    expect(resend.create).toHaveBeenCalledTimes(1);
    const [payload, options] = resend.create.mock.calls[0];
    // Only the address and the segment: no name, no IP, no properties.
    expect(payload).toEqual({ email: NORMALISED, segments: [{ id: SEGMENT }] });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('accepts a Unicode domain and stores it as punycode', async () => {
    const response = await call(post({ email: 'asha@münchen.example' }));
    expect(response.status).toBe(200);
    expect(resend.create.mock.calls[0][0].email).toBe('asha@xn--mnchen-3ya.example');
  });

  it('accepts a request with no company field and no timing field (other callers)', async () => {
    const response = await call(post({ email: EMAIL }));
    expect(await json(response)).toEqual({ ok: true });
  });

  it('accepts a same-origin Origin header and refuses a foreign one', async () => {
    expect((await call(post({ email: EMAIL }, { origin: 'http://localhost:3112' }))).status).toBe(200);
    const foreign = await call(post({ email: EMAIL }, { origin: 'https://elsewhere.example' }));
    expect(foreign.status).toBe(400);
    expect(await json(foreign)).toEqual({ ok: false, error: 'invalid' });
    expect(resend.create).toHaveBeenCalledTimes(1);
  });
});

describe('invalid input', () => {
  const cases: [string, unknown][] = [
    ['missing email', {}],
    ['not a string', { email: 42 }],
    ['empty', { email: '' }],
    ['no at sign', { email: 'asha.example.com' }],
    ['two at signs', { email: 'asha@@example.com' }],
    ['no dot in domain', { email: 'asha@localhost' }],
    ['numeric top-level label', { email: 'asha@10.0.0.1' }],
    ['space inside', { email: 'as ha@example.com' }],
    ['header injection', { email: 'asha@example.com\nBcc: someone@example.org' }],
    ['path characters', { email: 'asha/../../api-keys@example.com' }],
    ['query character', { email: 'asha?x=1@example.com' }],
    ['percent encoding', { email: 'asha%2f@example.com' }],
    ['consecutive dots', { email: 'as..ha@example.com' }],
    ['trailing dot in domain', { email: 'asha@example.com.' }],
    ['non-ASCII local part', { email: 'ashà@example.com' }],
    ['too long', { email: `${'a'.repeat(250)}@example.com` }],
    ['array body', ['asha@example.com']],
  ];

  it.each(cases)('rejects %s', async (_name, body) => {
    const response = await call(post(body));
    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ ok: false, error: 'invalid' });
    expect(resend.create).not.toHaveBeenCalled();
  });

  it('rejects a body that is not JSON, a wrong content type and an oversized body', async () => {
    expect(await json(await call(post(undefined, {}, '{not json')))).toEqual({ ok: false, error: 'invalid' });
    expect(await json(await call(post({ email: EMAIL }, { 'content-type': 'text/plain' })))).toEqual({ ok: false, error: 'invalid' });
    expect(await json(await call(post({ email: EMAIL, pad: 'x'.repeat(5000) })))).toEqual({ ok: false, error: 'invalid' });
    expect(resend.create).not.toHaveBeenCalled();
  });
});

describe('bots', () => {
  it('answers a filled honeypot with success and stores nothing', async () => {
    for (const company of ['Acme', ' ', 0, false, { a: 1 }]) {
      const response = await call(post({ email: EMAIL, company }));
      expect(response.status).toBe(200);
      expect(await json(response)).toEqual({ ok: true });
    }
    expect(resend.create).not.toHaveBeenCalled();
  });

  it('turns away a submission faster than a person could make it, and lets a slow one through', async () => {
    const fast = await call(post({ email: EMAIL, company: '', t: 300 }));
    expect(fast.status).toBe(429);
    expect(await json(fast)).toEqual({ ok: false, error: 'rate_limited' });
    expect(resend.create).not.toHaveBeenCalled();

    const slow = await call(post({ email: EMAIL, company: '', t: 9000 }));
    expect(await json(slow)).toEqual({ ok: true });
    expect(resend.create).toHaveBeenCalledTimes(1);
  });
});

describe('rate limiting', () => {
  it('allows 5 requests per client per window, then answers rate_limited with Retry-After', async () => {
    const { POST } = await loadRoute();
    for (let i = 0; i < 5; i += 1) expect((await POST(post({ email: EMAIL }))).status).toBe(200);

    const blocked = await POST(post({ email: EMAIL }));
    expect(blocked.status).toBe(429);
    expect(await json(blocked)).toEqual({ ok: false, error: 'rate_limited' });
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(resend.create).toHaveBeenCalledTimes(5);

    // Another client is unaffected.
    expect((await POST(post({ email: EMAIL }, { 'x-forwarded-for': '203.0.113.99' }))).status).toBe(200);
  });

  it('counts invalid requests and honeypot hits too, so bots cannot probe for free', async () => {
    const { POST } = await loadRoute();
    for (let i = 0; i < 5; i += 1) await POST(post({ email: 'nope', company: i % 2 ? 'x' : '' }));
    expect((await POST(post({ email: EMAIL }))).status).toBe(429);
  });

  it('uses the first x-forwarded-for entry and shares one bucket across an IPv6 /64', async () => {
    const { POST } = await loadRoute();
    for (let i = 0; i < 5; i += 1) {
      await POST(post({ email: EMAIL }, { 'x-forwarded-for': `2001:db8:1:2:${i}::${i + 1}, 198.51.100.1` }));
    }
    expect((await POST(post({ email: EMAIL }, { 'x-forwarded-for': '2001:db8:1:2:ffff::1' }))).status).toBe(429);
    expect((await POST(post({ email: EMAIL }, { 'x-forwarded-for': '2001:db8:1:3::1' }))).status).toBe(200);
  });

  it('opens a fresh window after 10 minutes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-03T12:00:00Z'));
    const { POST } = await loadRoute();
    for (let i = 0; i < 6; i += 1) await POST(post({ email: EMAIL }));
    expect((await POST(post({ email: EMAIL }))).status).toBe(429);

    vi.setSystemTime(new Date('2026-10-03T12:10:01Z'));
    expect((await POST(post({ email: EMAIL }))).status).toBe(200);
  });

  it('puts a ceiling on provider calls per instance', async () => {
    const { POST } = await loadRoute();
    let blocked = 0;
    for (let i = 0; i < 70; i += 1) {
      const response = await POST(post({ email: `asha${i}@example.com` }, { 'x-forwarded-for': `198.51.100.${i + 1}` }));
      if (response.status === 429) blocked += 1;
    }
    expect(resend.create).toHaveBeenCalledTimes(60);
    expect(blocked).toBe(10);
  });
});

describe('already subscribed', () => {
  it('treats a 409 conflict as success and makes sure the contact is in the segment', async () => {
    resend.create.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'conflict', statusCode: 409 }, headers: null });
    const response = await call(post({ email: EMAIL }));
    expect(await json(response)).toEqual({ ok: true });
    expect(resend.segmentsAdd).toHaveBeenCalledWith({ email: NORMALISED, segmentId: SEGMENT }, expect.anything());
  });

  it('treats an "already exists" message as success whatever the status code', async () => {
    resend.create.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'Contact already exists.', statusCode: 422 }, headers: null });
    expect(await json(await call(post({ email: EMAIL })))).toEqual({ ok: true });
  });

  it('also succeeds when the contact is already in the segment', async () => {
    resend.create.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'exists', statusCode: 409 }, headers: null });
    resend.segmentsAdd.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'Contact is already in segment', statusCode: 409 }, headers: null });
    expect(await json(await call(post({ email: EMAIL })))).toEqual({ ok: true });
  });

  it('succeeds when the API quietly returns the existing contact', async () => {
    // create resolves with data and no error: already covered by the default mock; no segment call is needed.
    expect(await json(await call(post({ email: EMAIL })))).toEqual({ ok: true });
    expect(resend.segmentsAdd).not.toHaveBeenCalled();
  });

  it('reports server when the segment cannot be joined for another reason', async () => {
    resend.create.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'exists', statusCode: 409 }, headers: null });
    resend.segmentsAdd.mockResolvedValue({ data: null, error: { name: 'not_found', message: 'Segment not found', statusCode: 404 }, headers: null });
    consoleSpies();
    expect(await json(await call(post({ email: EMAIL })))).toEqual({ ok: false, error: 'server' });
  });
});

describe('provider errors', () => {
  it.each([
    ['application_error', 500],
    ['internal_server_error', 500],
    ['invalid_api_key', 401],
    ['restricted_api_key', 401],
    ['not_found', 404],
    ['daily_quota_exceeded', 429],
    ['application_error', null],
  ])('maps %s (%s) to server', async (name, statusCode) => {
    resend.create.mockResolvedValue({ data: null, error: { name, message: 'boom', statusCode }, headers: null });
    consoleSpies();
    const response = await call(post({ email: EMAIL }));
    expect(response.status).toBe(500);
    expect(await json(response)).toEqual({ ok: false, error: 'server' });
  });

  it('maps Resend rate limiting to rate_limited', async () => {
    resend.create.mockResolvedValue({ data: null, error: { name: 'rate_limit_exceeded', message: 'Too many requests', statusCode: 429 }, headers: null });
    const response = await call(post({ email: EMAIL }));
    expect(response.status).toBe(429);
    expect(await json(response)).toEqual({ ok: false, error: 'rate_limited' });
  });

  it('maps a thrown exception to server', async () => {
    resend.create.mockRejectedValue(new TypeError('socket hang up'));
    consoleSpies();
    const response = await call(post({ email: EMAIL }));
    expect(response.status).toBe(500);
    expect(await json(response)).toEqual({ ok: false, error: 'server' });
  });
});

describe('missing configuration', () => {
  it('in development answers ok with a one-line warning that has no address, and stores nothing', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RESEND_API_KEY', '');
    const spies = consoleSpies();
    const response = await call(post({ email: EMAIL }));
    expect(await json(response)).toEqual({ ok: true });
    expect(resend.create).not.toHaveBeenCalled();

    const warn = spies[2];
    expect(warn).toHaveBeenCalledTimes(1);
    const line = String(warn.mock.calls[0][0]);
    expect(line.split('\n')).toHaveLength(1);
    expect(line).toContain('RESEND_API_KEY');
    expect(line.toLowerCase()).not.toContain('asha');
  });

  it('in production answers server with a one-line config error', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_SEGMENT_ID', '');
    const spies = consoleSpies();
    const response = await call(post({ email: EMAIL }));
    expect(response.status).toBe(500);
    expect(await json(response)).toEqual({ ok: false, error: 'server' });
    expect(resend.create).not.toHaveBeenCalled();

    const error = spies[3];
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0]).split('\n')).toHaveLength(1);
    expect(loggedText(spies).toLowerCase()).not.toContain('asha');
  });

  it('still reports invalid input first when configuration is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', '');
    expect(await json(await call(post({ email: 'nope' })))).toEqual({ ok: false, error: 'invalid' });
  });
});

describe('logs carry no personal data', () => {
  it('never contains the address, its parts, the client IP or a provider message', async () => {
    const spies = consoleSpies();
    const { POST } = await loadRoute();
    const headers = { 'x-forwarded-for': IP };

    // Provider error whose message echoes the address back.
    resend.create.mockResolvedValueOnce({
      data: null,
      error: { name: 'validation_error', message: `Invalid email ${NORMALISED} from ${IP}`, statusCode: 422 },
      headers: null,
    });
    await POST(post({ email: EMAIL }, headers));

    // Thrown exception that echoes the address back.
    resend.create.mockRejectedValueOnce(new Error(`failed for ${NORMALISED} at ${IP}`));
    await POST(post({ email: EMAIL }, headers));

    // Segment-join failure that echoes the address back.
    resend.create.mockResolvedValueOnce({ data: null, error: { name: 'validation_error', message: 'exists', statusCode: 409 }, headers: null });
    resend.segmentsAdd.mockResolvedValueOnce({ data: null, error: { name: 'application_error', message: `no ${NORMALISED}`, statusCode: 500 }, headers: null });
    await POST(post({ email: EMAIL }, headers));

    // Rate limited, invalid, honeypot, and a success.
    for (let i = 0; i < 4; i += 1) await POST(post({ email: EMAIL }, headers));
    await POST(post({ email: 'bad address' }, headers));
    await POST(post({ email: EMAIL, company: 'x' }, headers));

    const text = loggedText(spies);
    expect(text).toContain('[notify] provider error'); // the lines exist, so this test is not vacuous
    expect(text).toContain('[notify] unexpected error');
    for (const secret of [EMAIL, NORMALISED, 'asha.family', 'example.com', IP, '203.0.113']) {
      expect(text.toLowerCase()).not.toContain(secret.toLowerCase());
    }
    expect(text).not.toContain('Invalid email');
  });

  it('never logs the address in development when the key is missing', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RESEND_API_KEY', '');
    const spies = consoleSpies();
    await call(post({ email: EMAIL }));
    expect(loggedText(spies).toLowerCase()).not.toContain('asha');
    expect(loggedText(spies)).not.toContain(IP);
  });
});

describe('email normalisation', () => {
  it('keeps plus tags and dots, lower-cases, trims', async () => {
    const { normalizeEmail } = await import('../src/lib/notify/email');
    expect(normalizeEmail('  Asha.Family+Baby@Example.COM ')).toBe('asha.family+baby@example.com');
    expect(normalizeEmail("o'asha@example.co.uk")).toBe("o'asha@example.co.uk");
    expect(normalizeEmail('asha@sub.example.com')).toBe('asha@sub.example.com');
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail('a@b')).toBeNull();
  });
});

describe('client helper', () => {
  function stubFetch(impl: () => Promise<Response>) {
    const fetchMock = vi.fn(impl);
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts email, company and time on page to /api/notify and returns the server result', async () => {
    const fetchMock = stubFetch(async () => Response.json({ ok: true }));
    const { submitNotify } = await import('../src/lib/notify/client');
    expect(await submitNotify(` ${EMAIL} `, { company: '' })).toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/notify');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    const sent = JSON.parse(String(init.body)) as Json;
    expect(sent.email).toBe(EMAIL);
    expect(sent.company).toBe('');
    expect(typeof sent.t).toBe('number');
  });

  it('forwards the honeypot value so the server can see it', async () => {
    const fetchMock = stubFetch(async () => Response.json({ ok: true }));
    const { submitNotify } = await import('../src/lib/notify/client');
    await submitNotify(EMAIL, { company: 'Acme' });
    expect((JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as Json).company).toBe('Acme');
  });

  it('returns invalid without a request for an obvious typo', async () => {
    const fetchMock = stubFetch(async () => Response.json({ ok: true }));
    const { submitNotify } = await import('../src/lib/notify/client');
    expect(await submitNotify('not an email')).toEqual({ ok: false, error: 'invalid' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passes through each documented error', async () => {
    const { submitNotify } = await import('../src/lib/notify/client');
    for (const error of ['invalid', 'rate_limited', 'server'] as const) {
      stubFetch(async () => Response.json({ ok: false, error }, { status: 400 }));
      expect(await submitNotify(EMAIL)).toEqual({ ok: false, error });
    }
  });

  it('maps a 429 without JSON (platform rate limiter) to rate_limited, other failures to server', async () => {
    const { submitNotify } = await import('../src/lib/notify/client');
    stubFetch(async () => new Response('Too Many Requests', { status: 429 }));
    expect(await submitNotify(EMAIL)).toEqual({ ok: false, error: 'rate_limited' });

    stubFetch(async () => new Response('<html>bad gateway</html>', { status: 502 }));
    expect(await submitNotify(EMAIL)).toEqual({ ok: false, error: 'server' });

    stubFetch(async () => Response.json({ surprise: true }));
    expect(await submitNotify(EMAIL)).toEqual({ ok: false, error: 'server' });

    stubFetch(async () => {
      throw new TypeError('network down');
    });
    expect(await submitNotify(EMAIL)).toEqual({ ok: false, error: 'server' });
  });
});

describe('API key repair and format check', () => {
  it('repairs a key pasted with spaces, quotes or a line break inside', async () => {
    vi.stubEnv('RESEND_API_KEY', ' "re_abc\n_def" ');
    vi.stubEnv('RESEND_SEGMENT_ID', ` ${SEGMENT}\n`);
    const response = await call(post({ email: EMAIL, company: '', t: 5000 }));
    expect(response.status).toBe(200);
    expect(resend.constructed).toHaveBeenCalledWith('re_abc_def');
    expect(resend.create).toHaveBeenCalledWith({ email: NORMALISED, segments: [{ id: SEGMENT }] }, expect.anything());
  });

  it('names a key with a character that cannot be repaired, without printing it', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_abc\u2026def');
    const spies = consoleSpies();
    const response = await call(post({ email: EMAIL, company: '', t: 5000 }));
    expect(response.status).toBe(500);
    expect(resend.create).not.toHaveBeenCalled();
    const text = loggedText(spies);
    expect(text).toContain('not in the expected format');
    expect(text).not.toContain('re_abc');
  });
});

describe('welcome email', () => {
  it('sends one short hello from the verified domain after a sign-up', async () => {
    const response = await call(post({ email: EMAIL, company: '', t: 5000 }));
    expect(response.status).toBe(200);
    expect(resend.send).toHaveBeenCalledTimes(1);
    const [payload] = resend.send.mock.calls[0] as [Record<string, unknown>];
    expect(payload.to).toEqual([NORMALISED]);
    expect(payload.from).toBe('Early Letters <hello@earlyletters.com>');
    expect(payload.replyTo).toBe('hello@earlyletters.com');
    expect(String(payload.subject)).toContain('You are on the list');
    expect(String(payload.html)).toContain('<h1');
    expect(String(payload.text)).toContain('You are on the list.');
  });

  it('does not send for a bot (honeypot) or an invalid address', async () => {
    await call(post({ email: EMAIL, company: 'Acme', t: 5000 }));
    await call(post({ email: 'not-an-address', company: '', t: 5000 }));
    expect(resend.send).not.toHaveBeenCalled();
  });

  it('keeps the sign-up when the send fails, and logs no address', async () => {
    resend.send.mockResolvedValue({ data: null, error: { name: 'validation_error', statusCode: 422, message: `bad ${NORMALISED}` }, headers: null });
    const spies = consoleSpies();
    const response = await call(post({ email: EMAIL, company: '', t: 5000 }));
    expect(response.status).toBe(200);
    expect(resend.create).toHaveBeenCalledTimes(1);
    const text = loggedText(spies);
    expect(text).toContain('welcome email not sent');
    expect(text).not.toContain(NORMALISED);
  });

  it('keeps the sign-up when the send throws', async () => {
    resend.send.mockRejectedValue(new TypeError('boom'));
    consoleSpies();
    const response = await call(post({ email: EMAIL, company: '', t: 5000 }));
    expect(response.status).toBe(200);
  });
});

describe('welcome email unsubscribe link', () => {
  it('carries a personal link and the one-click headers, with no address in the link', async () => {
    await call(post({ email: EMAIL, company: '', t: 5000 }));
    const [payload] = resend.send.mock.calls[0] as [{ html: string; text: string; headers: Record<string, string> }];
    const link = /https:\/\/earlyletters\.com\/unsubscribe\?t=([A-Za-z0-9._-]+)/.exec(payload.html);
    expect(link).not.toBeNull();
    expect(link?.[1]).toMatch(/^contact-0001-created\./);
    expect(payload.html + payload.text).not.toContain(NORMALISED);
    expect(payload.headers['List-Unsubscribe']).toContain('https://earlyletters.com/api/unsubscribe?t=');
    expect(payload.headers['List-Unsubscribe']).toContain('mailto:hello@earlyletters.com');
    expect(payload.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(payload.text).toContain('Unsubscribe: https://earlyletters.com/unsubscribe?t=');
  });

  it('gives an address that is already on the list no second welcome email', async () => {
    resend.get.mockResolvedValue({ data: { id: 'contact-0001-existing', unsubscribed: false }, error: null, headers: null });
    const response = await call(post({ email: EMAIL, company: '', t: 5000 }));
    expect(response.status).toBe(200);
    expect(resend.create).not.toHaveBeenCalled();
    expect(resend.segmentsAdd).toHaveBeenCalledTimes(1);
    expect(resend.send).not.toHaveBeenCalled();
  });

  it('leaves an address that has unsubscribed alone, with the same answer as anyone else', async () => {
    resend.get.mockResolvedValue({ data: { id: 'contact-0001-existing', unsubscribed: true }, error: null, headers: null });
    const response = await call(post({ email: EMAIL, company: '', t: 5000 }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(resend.create).not.toHaveBeenCalled();
    expect(resend.segmentsAdd).not.toHaveBeenCalled();
    expect(resend.send).not.toHaveBeenCalled();
  });

  it('still saves and welcomes when the lookup fails', async () => {
    resend.get.mockRejectedValue(new Error('network'));
    const response = await call(post({ email: EMAIL, company: '', t: 5000 }));
    expect(response.status).toBe(200);
    expect(resend.create).toHaveBeenCalledTimes(1);
    expect(resend.send).toHaveBeenCalledTimes(1);
  });

  it('falls back to a mailto link when no secret is set, and still sends', async () => {
    vi.stubEnv('UNSUBSCRIBE_SECRET', '');
    await call(post({ email: EMAIL, company: '', t: 5000 }));
    const [payload] = resend.send.mock.calls[0] as [{ html: string; headers: Record<string, string> }];
    expect(payload.html).toContain('href="mailto:hello@earlyletters.com?subject=Unsubscribe"');
    expect(payload.headers['List-Unsubscribe']).toBe('<mailto:hello@earlyletters.com?subject=Unsubscribe>');
    expect(payload.headers['List-Unsubscribe-Post']).toBeUndefined();
  });
});

describe('native form post (script off or not loaded yet)', () => {
  const nativePost = (fields: Record<string, string>, headers: Record<string, string> = {}) =>
    new Request('http://localhost:3112/api/notify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': IP, host: 'localhost:3112', ...headers },
      body: new URLSearchParams(fields).toString(),
    });

  it('saves the address, sends the welcome and redirects to the thanks page, never JSON', async () => {
    const response = await call(nativePost({ email: EMAIL, company: '' }));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/signup/thanks');
    expect(response.headers.get('content-type') ?? '').not.toMatch(/json/);
    expect(resend.create).toHaveBeenCalledWith({ email: NORMALISED, segments: [{ id: SEGMENT }] }, expect.anything());
    expect(resend.send).toHaveBeenCalledTimes(1);
  });

  it('a bad address lands on the sorry page with the reason, and saves nothing', async () => {
    const response = await call(nativePost({ email: 'not-an-address', company: '' }));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/signup/sorry?e=invalid');
    expect(resend.create).not.toHaveBeenCalled();
  });

  it('a bot (honeypot filled) gets the thanks page and nothing is saved or sent', async () => {
    const response = await call(nativePost({ email: EMAIL, company: 'Acme' }));
    expect(response.headers.get('location')).toBe('/signup/thanks');
    expect(resend.create).not.toHaveBeenCalled();
    expect(resend.send).not.toHaveBeenCalled();
  });

  it('a foreign Origin is refused like any other cross-site post', async () => {
    const response = await call(nativePost({ email: EMAIL, company: '' }, { origin: 'https://evil.example' }));
    expect(response.headers.get('location')).toBe('/signup/sorry?e=invalid');
    expect(resend.create).not.toHaveBeenCalled();
  });

  it('the server failing lands on the sorry page, and the address is not reported saved', async () => {
    resend.create.mockResolvedValue({ data: null, error: { name: 'application_error', statusCode: 500, message: 'x' }, headers: null });
    consoleSpies();
    const response = await call(nativePost({ email: EMAIL, company: '' }));
    expect(response.headers.get('location')).toBe('/signup/sorry?e=server');
  });
});
