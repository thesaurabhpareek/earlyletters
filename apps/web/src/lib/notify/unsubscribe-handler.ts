/**
 * Owner: E2 (back-end). POST /api/unsubscribe, the one-click endpoint behind every email's unsubscribe link.
 *
 * Two callers, one rule (a genuine token, then one Resend call):
 *  - a mail app's one-click unsubscribe (RFC 8058): POST with the token in the query, no Origin header, answered 200;
 *  - the confirm page's form: POST with the token in the body, answered with a redirect back to the page.
 * Reads (GET) never change anything: link scanners fetch links, so the page asks first. The token, the contact
 * id and the address are never logged.
 */
import { site } from '../../content/site';
import { isSameOrigin } from './handler';
import { logNotify } from './log';
import { createRateLimiter, clientKey } from './rate-limit';
import { readUnsubscribeToken, unsubscribeContact } from './unsubscribe';

const perClient = createRateLimiter({ limit: 20, windowMs: 10 * 60 * 1000 });

export function resetUnsubscribeLimits(): void {
  perClient.reset();
}

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function handleUnsubscribe(request: Request): Promise<Response> {
  try {
    if (!perClient.hit(clientKey(request.headers)).allowed) return new Response('Too many requests', { status: 429, headers: NO_STORE });
    if (!isSameOrigin(request)) return new Response('Bad request', { status: 400, headers: NO_STORE });

    const url = new URL(request.url);
    const isForm = (request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/x-www-form-urlencoded');
    let token = url.searchParams.get('t');
    if (isForm) {
      const form = new URLSearchParams(await request.text());
      token = form.get('t') ?? token;
    }

    const back = (query: string) => new Response(null, { status: 303, headers: { ...NO_STORE, Location: `/unsubscribe?${query}` } });

    const contactId = readUnsubscribeToken(token, process.env.UNSUBSCRIBE_SECRET);
    if (!contactId) return isForm ? back('invalid=1') : new Response('Invalid link', { status: 400, headers: NO_STORE });

    const apiKey = (process.env.RESEND_API_KEY ?? '').replace(/["'\s]/g, '');
    if (!apiKey) {
      logNotify('config_error');
      return isForm ? back(`t=${encodeURIComponent(token ?? '')}&error=1`) : new Response('Server error', { status: 500, headers: NO_STORE });
    }

    const result = await unsubscribeContact(contactId, apiKey);
    if (result === 'ok') return isForm ? back('done=1') : new Response('Unsubscribed', { status: 200, headers: NO_STORE });
    return isForm ? back(`t=${encodeURIComponent(token ?? '')}&error=1`) : new Response('Server error', { status: 500, headers: NO_STORE });
  } catch {
    logNotify('unsubscribe_error');
    return new Response('Server error', { status: 500, headers: NO_STORE });
  }
}

/** Kept so the page and tests share one source for the mailto fallback. */
export const unsubscribeFallbackMailto = `mailto:${site.footer.contact}?subject=Unsubscribe`;
