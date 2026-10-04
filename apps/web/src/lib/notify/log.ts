/**
 * Owner: E2 (back-end). The only logger the notify code uses.
 *
 * Privacy by construction: a log line is built from a fixed event name plus an optional provider
 * error name and HTTP status. There is no free-text argument, so an email address, an IP address
 * or a provider error message (which could echo the address back) cannot reach the log stream.
 * Email is L3 in docs/legal/DATA_CLASSIFICATION.md and must not appear in Vercel logs.
 */
type NotifyEvent = 'config_error' | 'config_missing_dev' | 'provider_error' | 'unexpected_error';

const SAFE_NAME = /^[A-Za-z0-9_]{1,48}$/;

function safeName(value: unknown): string {
  return typeof value === 'string' && SAFE_NAME.test(value) ? value : 'unknown';
}

function safeStatus(value: unknown): string {
  return typeof value === 'number' && Number.isInteger(value) && value >= 100 && value <= 599 ? String(value) : 'none';
}

export function logNotify(event: NotifyEvent, detail?: { name?: unknown; status?: unknown; code?: unknown }): void {
  switch (event) {
    case 'config_missing_dev':
      console.warn('[notify] RESEND_API_KEY or RESEND_SEGMENT_ID is not set: not saving the address (development only)');
      return;
    case 'config_error':
      console.error('[notify] config error: RESEND_API_KEY and RESEND_SEGMENT_ID must be set in production');
      return;
    case 'provider_error':
      console.error(`[notify] provider error name=${safeName(detail?.name)} status=${safeStatus(detail?.status)}`);
      return;
    case 'unexpected_error':
      console.error(`[notify] unexpected error name=${safeName(detail?.name)} code=${safeName(detail?.code)}`);
      return;
  }
}
