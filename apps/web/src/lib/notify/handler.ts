/**
 * Owner: E2 (back-end). Request handling for POST /api/notify (the route file only forwards here).
 *
 * Order of work, cheapest and most abuse-relevant first:
 *  1. per-client rate limit (counts every request, so bots that trip a later check still burn quota);
 *  2. shape checks: JSON content type (forces a CORS preflight for cross-site pages), same-origin
 *     Origin header when present, small body;
 *  3. honeypot `company`: filled means bot, answered with a normal-looking success and nothing stored;
 *  4. time on page `t` (milliseconds, sent by the client helper): too fast means bot or autofill glitch,
 *     answered with 'rate_limited' so a real person can simply try again. Optional, so other callers still work;
 *  5. email validation and normalisation;
 *  6. configuration, then a small per-instance ceiling on provider calls, then the Resend call.
 *
 * Same answer for a new and an existing address, so the endpoint cannot be used to find out who signed up.
 */
import type { NotifyResult } from './client';
import { normalizeEmail } from './email';
import { logNotify } from './log';
import { sendWelcome, subscribe } from './provider';
import { clientKey, createRateLimiter } from './rate-limit';

type ErrorCode = Extract<NotifyResult, { ok: false }>['error'];

const MAX_BODY_CHARS = 2048;
/** A person cannot reach, fill and send the form this quickly after the page loads. */
export const MIN_TIME_ON_PAGE_MS = 1500;

// Per client: 5 requests per 10 minutes. Per instance, provider calls only: 60 per minute (Resend allows 10 requests per second per team).
const perClient = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });
const providerCeiling = createRateLimiter({ limit: 60, windowMs: 60 * 1000 });

/** Test hook: clears in-memory counters. */
export function resetNotifyLimits(): void {
  perClient.reset();
  providerCeiling.reset();
}

const STATUS: Record<ErrorCode, number> = { invalid: 400, rate_limited: 429, server: 500 };

function ok(): Response {
  return Response.json({ ok: true } satisfies NotifyResult, { headers: { 'Cache-Control': 'no-store' } });
}

function fail(error: ErrorCode, retryAfterSeconds?: number): Response {
  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  if (error === 'rate_limited' && retryAfterSeconds) headers['Retry-After'] = String(retryAfterSeconds);
  return Response.json({ ok: false, error } satisfies NotifyResult, { status: STATUS[error], headers });
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // not a browser cross-site request (curl, server to server); the other checks still apply
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return host !== null && new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** A Resend key is `re_` plus letters, digits and underscores. */
const KEY_SHAPE = /^re_[A-Za-z0-9_]+$/;

/** Pasted values often carry quotes, spaces or line breaks (also inside the value). Remove them; they are never part of a key or an id. */
function cleanEnv(value: string | undefined): string {
  return (value ?? '').replace(/["'\s]/g, '');
}

function readConfig(): { apiKey: string; segmentId: string } | null | 'bad_key' {
  const apiKey = cleanEnv(process.env.RESEND_API_KEY);
  const segmentId = cleanEnv(process.env.RESEND_SEGMENT_ID);
  if (!apiKey || !segmentId) return null;
  // A key with a stray character makes the HTTP layer throw a bare TypeError. Say so plainly instead.
  return KEY_SHAPE.test(apiKey) ? { apiKey, segmentId } : 'bad_key';
}

/** A browser submitting the form natively (script off, or not loaded yet) sends it form-encoded, not as JSON. */
function isNativeForm(request: Request): boolean {
  return (request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/x-www-form-urlencoded');
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const native = isNativeForm(request);
  if (!native && !request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null;
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_CHARS * 4) return null;
  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) return null;
  if (native) {
    const form = new URLSearchParams(text);
    return { email: form.get('email') ?? undefined, company: form.get('company') ?? '' };
  }
  try {
    const value: unknown = JSON.parse(text);
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * The JSON endpoint behind the form. A native form post gets the same work done and then a redirect to a page of the
 * site (thanks, or sorry with a short reason), never the machine's JSON.
 */
export async function handleNotify(request: Request): Promise<Response> {
  const native = isNativeForm(request);
  const response = await handleNotifyJson(request);
  if (!native) return response;
  const where = response.status === 200 ? '/signup/thanks' : `/signup/sorry?e=${response.status === 400 ? 'invalid' : response.status === 429 ? 'slow' : 'server'}`;
  return new Response(null, { status: 303, headers: { 'Cache-Control': 'no-store', Location: where } });
}

async function handleNotifyJson(request: Request): Promise<Response> {
  try {
    const limited = perClient.hit(clientKey(request.headers));
    if (!limited.allowed) return fail('rate_limited', limited.retryAfterSeconds);

    if (!isSameOrigin(request)) return fail('invalid');
    const body = await readBody(request);
    if (!body) return fail('invalid');

    // Honeypot: anything other than an empty value means a bot filled the hidden field.
    if (body.company !== undefined && body.company !== null && body.company !== '') return ok();

    if (typeof body.t === 'number' && body.t < MIN_TIME_ON_PAGE_MS) return fail('rate_limited', 5);

    const email = normalizeEmail(body.email);
    if (!email) return fail('invalid');

    const config = readConfig();
    if (config === 'bad_key') {
      logNotify('config_key_format');
      return fail('server');
    }
    if (!config) {
      if (process.env.NODE_ENV === 'production') {
        logNotify('config_error');
        return fail('server');
      }
      logNotify('config_missing_dev');
      return ok();
    }

    const ceiling = providerCeiling.hit('provider');
    if (!ceiling.allowed) return fail('rate_limited', ceiling.retryAfterSeconds);

    const { outcome, contactId, existing } = await subscribe(email, config);
    if (outcome === 'ok' && !existing) await sendWelcome(email, config, contactId);
    return outcome === 'ok' ? ok() : fail(outcome, outcome === 'rate_limited' ? 30 : undefined);
  } catch (error) {
    // The error code of the underlying cause (for example ERR_INVALID_CHAR): a fixed vocabulary, never message text.
    const cause = error instanceof Error ? (error.cause as { code?: unknown } | undefined) : undefined;
    logNotify('unexpected_error', { name: error instanceof Error ? error.name : undefined, code: cause?.code });
    return fail('server');
  }
}
