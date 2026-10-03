/**
 * Owner: E2 (back-end). Client helper for the "tell me when it's ready" form.
 * Contract used by components/cta/NotifyForm.tsx (owned by SC6). Keep this signature.
 *
 * Posts to /api/notify (src/app/api/notify/route.ts). Never throws: every failure becomes a NotifyResult.
 * Sends `company` (the hidden honeypot field, empty for people) and `t`, the milliseconds since the page
 * loaded, which the server uses to ignore submissions no person could have made. Neither changes the signature.
 */
export type NotifyResult = { ok: true } | { ok: false; error: 'invalid' | 'rate_limited' | 'server' };

const REQUEST_TIMEOUT_MS = 15000;

function isNotifyResult(value: unknown): value is NotifyResult {
  if (typeof value !== 'object' || value === null) return false;
  const body = value as { ok?: unknown; error?: unknown };
  if (body.ok === true) return true;
  return body.ok === false && (body.error === 'invalid' || body.error === 'rate_limited' || body.error === 'server');
}

export async function submitNotify(email: string, extra?: { company?: string }): Promise<NotifyResult> {
  const address = email.trim();
  // Cheap local check so an obvious typo does not cost a round trip. The server is the authority.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return { ok: false, error: 'invalid' };

  const timeOnPage =
    typeof performance !== 'undefined' && typeof performance.now === 'function' ? Math.round(performance.now()) : undefined;

  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: address, company: extra?.company ?? '', t: timeOnPage }),
      cache: 'no-store',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (isNotifyResult(body)) return body;

    // No usable JSON, for example the platform rate limiter answering before our code runs.
    if (response.status === 429) return { ok: false, error: 'rate_limited' };
    return { ok: false, error: 'server' };
  } catch {
    return { ok: false, error: 'server' };
  }
}
