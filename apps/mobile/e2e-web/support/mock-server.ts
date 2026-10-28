/**
 * A mocked Supabase for the server-on web build (global-setup.ts, `.results/web-dist-server-on`):
 * Playwright answers every request the app sends to MOCK_SUPABASE_URL, so the co-parent screens
 * run for real in the browser while the server is a script. What it is not: the server. The real
 * SQL is proven by test/family-e2e.test.ts (PGlite) and supabase/tests; this proves the screens.
 *
 * - Auth (GoTrue): an email code signs the person in with a session for `user`. A flow can answer an auth
 *   endpoint itself (`auth('otp', ...)`: a rate limit, a wrong code, or `abort` for a phone that is offline).
 * - The consent gate says everything is agreed, so sign-in ends on the sheet that asked for it.
 * - Sync is told to wait (stopped), so nothing else happens in the background.
 * - Each flow adds the RPCs and tables it needs. Anything else is a 404 that the flow's
 *   console-error check fails on, and `calls` records every request so a flow can assert what
 *   was, and was not, asked (for example: nothing before sign-in, no accept before Join).
 */
import type { Page, Route } from '@playwright/test';

export const MOCK_SUPABASE_URL = 'http://127.0.0.1:54321';

export const MAMA = '11111111-1111-4111-8111-111111111111';
export const PAPA = '22222222-2222-4222-8222-222222222222';
export const ASHA_BOOK = '0199e4a2-7b3c-7d10-8a1b-2c3d4e5f6a7b';

export interface MockCall {
  method: string;
  /** Path after the host, without the query: /rest/v1/rpc/peek_invite, /auth/v1/verify. */
  path: string;
  query: string;
  body: unknown;
}

/** `abort`: no answer at all, as when the phone is offline (the request fails before any response). */
export type Answer = { status?: number; body: unknown; headers?: Record<string, string>; abort?: boolean };
type Handler = (call: MockCall) => Answer;

export interface MockServer {
  calls: MockCall[];
  /** Answer `POST /rest/v1/rpc/<name>`. */
  rpc(name: string, handler: Handler): void;
  /** Answer `GET /rest/v1/<table>`. */
  table(name: string, handler: Handler): void;
  rpcCalls(name: string): MockCall[];
  /** Answer `/auth/v1/<name>` (otp, verify, token, user, logout) instead of the default; a handler returning null falls back to it. */
  auth(name: string, handler: (call: MockCall) => Answer | null): void;
  /** Every request to the auth and data APIs (not remote config): what "nothing was asked" is checked against. */
  serverCalls(): MockCall[];
}

const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');

function session(user: string, email: string) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: user, aud: 'authenticated', role: 'authenticated', email, is_anonymous: false, iat: now, exp: now + 3600, session_id: 'e2e' };
  const accessToken = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(claims)}.e2e`;
  const u = {
    id: user,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  };
  return { session: { access_token: accessToken, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'e2e-refresh', user: u }, user: u };
}

/** PostgREST's error body for a raised SQLSTATE (supabase-js reads code, message, details, hint). */
export function pgError(code: string, message: string, details: string | null = null): Answer {
  return { status: 400, body: { code, message, details, hint: null } };
}

export async function mockServer(page: Page, opts: { user: string; email?: string }): Promise<MockServer> {
  const email = opts.email ?? 'papa@example.invalid';
  const s = session(opts.user, email);
  const rpcs = new Map<string, Handler>();
  const tables = new Map<string, Handler>();
  const auths = new Map<string, (call: MockCall) => Answer | null>();
  const calls: MockCall[] = [];

  rpcs.set('my_sync_gate', () => ({ body: [{ terms_current: true, age_attested: true, sensitive_data: true, content_allowed: true }] }));
  rpcs.set('policy_actions_needed', () => ({ body: [] }));
  rpcs.set('sync_push', () => ({ body: { results: [], paused: false, stopped: true } }));
  rpcs.set('sync_pull', () => ({ body: { epoch: 1, books: [], gone: [] } }));

  const reply = (route: Route, a: Answer) =>
    a.abort
      ? route.abort('internetdisconnected')
      : route.fulfill({
          status: a.status ?? 200,
          contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', ...a.headers },
          body: a.body === undefined ? '' : JSON.stringify(a.body),
        });

  await page.route(`${MOCK_SUPABASE_URL}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === 'OPTIONS') return reply(route, { status: 204, body: undefined });
    let body: unknown = null;
    try {
      body = req.postDataJSON();
    } catch {
      body = req.postData();
    }
    const call: MockCall = { method: req.method(), path: url.pathname, query: url.search, body };
    calls.push(call);
    const p = url.pathname;
    const own = /^\/auth\/v1\/([a-z_]+)$/.exec(p);
    const mine = own && auths.has(own[1]) ? auths.get(own[1])!(call) : null;
    if (mine) return reply(route, mine);
    if (p === '/auth/v1/otp') return reply(route, { body: {} });
    if (p === '/auth/v1/verify' || p === '/auth/v1/token') return reply(route, { body: { ...s.session } });
    if (p === '/auth/v1/user') return reply(route, { body: s.user });
    if (p === '/auth/v1/logout') return reply(route, { status: 204, body: undefined });
    // Remote config, packs and content (lib/remote): the app keeps its bundled documents on any non-200.
    if (p.startsWith('/functions/v1/')) return reply(route, { status: 204, body: undefined });
    const rpc = /^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(p);
    if (rpc && rpcs.has(rpc[1])) return reply(route, rpcs.get(rpc[1])!(call));
    const table = /^\/rest\/v1\/([a-z_]+)$/.exec(p);
    if (table && tables.has(table[1])) return reply(route, tables.get(table[1])!(call));
    // Unanswered: the browser logs a 404, which the flow's console-error check fails on. Say which.
    console.log(`[e2e mock] nothing answers ${req.method()} ${p}${url.search}`);
    return reply(route, { status: 404, body: { code: 'PGRST202', message: `e2e mock: nothing answers ${req.method()} ${p}`, details: null, hint: null } });
  });

  return {
    calls,
    rpc: (name, h) => void rpcs.set(name, h),
    table: (name, h) => void tables.set(name, h),
    rpcCalls: (name) => calls.filter((c) => c.path === `/rest/v1/rpc/${name}`),
    auth: (name, h) => void auths.set(name, h),
    serverCalls: () => calls.filter((c) => c.path.startsWith('/auth/') || c.path.startsWith('/rest/')),
  };
}

/** The web has no system share sheet in headless Chromium: record what would be shared instead. */
export async function stubShareSheet(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const shared: unknown[] = [];
    (window as unknown as { __shared: unknown[] }).__shared = shared;
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: unknown) => {
        shared.push(data);
      },
    });
  });
}
