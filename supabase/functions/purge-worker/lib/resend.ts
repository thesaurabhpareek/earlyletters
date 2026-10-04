/**
 * Resend (email processor) calls used by the deletion pipeline.
 *
 * Verified against resend.com docs on 3 Oct 2026:
 *  - Send: POST https://api.resend.com/emails with {from, to, subject, text};
 *    `Idempotency-Key` header (at most 256 characters, kept 24 hours; the same
 *    key with the same payload returns the first response, a different
 *    payload is a validation error).
 *  - Contacts: DELETE https://api.resend.com/contacts/{id|email} (no audience
 *    id needed). The response for a contact that does not exist is not
 *    documented; 404 is treated as already deleted (Unverified).
 *  - Retention: "Resend retains email data for 30 days across all plans".
 *
 * Nothing here logs or returns a recipient address or a body.
 */
import { drain, fetchWithTimeout, httpCode, ServiceError, type FetchFn } from './http.ts';

export const RESEND_API = 'https://api.resend.com';

export interface OutgoingEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  /** Stable per logical email (for example `receipt:<request id>`), so a retried run never sends twice. */
  idempotencyKey: string;
  replyTo?: string;
}

export async function sendEmail(fetchFn: FetchFn, apiKey: string, mail: OutgoingEmail, timeoutMs = 15_000): Promise<void> {
  if (!apiKey) throw new ServiceError('resend', 0, 'config');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.to)) throw new ServiceError('resend', 0, 'no_address');
  const res = await fetchWithTimeout(fetchFn, 'resend', `${RESEND_API}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': mail.idempotencyKey.slice(0, 256),
    },
    body: JSON.stringify({
      from: mail.from,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
    }),
  }, timeoutMs);
  await drain(res);
  if (res.ok) return;
  throw new ServiceError('resend', res.status, res.status === 429 ? 'rate_limited' : httpCode(res.status));
}

/** Deletes a Resend contact by email. `not_found` when there was none (we create no contacts in v1.0). */
export async function deleteContact(fetchFn: FetchFn, apiKey: string, email: string, timeoutMs = 15_000): Promise<'deleted' | 'not_found'> {
  if (!apiKey) throw new ServiceError('resend', 0, 'config');
  const res = await fetchWithTimeout(fetchFn, 'resend', `${RESEND_API}/contacts/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey}` },
  }, timeoutMs);
  await drain(res);
  if (res.ok) return 'deleted';
  if (res.status === 404) return 'not_found';
  throw new ServiceError('resend', res.status, res.status === 429 ? 'rate_limited' : httpCode(res.status));
}
