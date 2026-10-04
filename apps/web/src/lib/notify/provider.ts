/**
 * Owner: E2 (back-end). Stores a "tell me when it's ready" address as a Resend contact in one segment.
 *
 * Resend v6 (6.32.0, read from node_modules/resend types): contacts are created with
 * `contacts.create({ email, segments: [{ id }] })`. `audienceId` still exists but is marked
 * deprecated in favour of segments, so we use segments. Only the address is sent: no name, no IP,
 * no custom properties.
 *
 * Unverified (Resend docs and types do not say): what POST /contacts returns for an address that
 * already exists. We therefore accept every plausible shape as "already exists" (HTTP 409, or an
 * error message that says so) and then make sure the contact is in our segment. A silent upsert
 * (no error) is also treated as success.
 *
 * Provider error messages are never logged: they may echo the address back.
 */
import { Resend } from 'resend';
import { site } from '../../content/site';
import { resolveSiteUrl } from '../site-url';
import { logNotify } from './log';
import { renderWelcomeEmail } from './welcome-email';

export type SubscribeOutcome = 'ok' | 'rate_limited' | 'server';

type ProviderError = { name?: string; message?: string; statusCode?: number | null };

const REQUEST_TIMEOUT_MS = 8000;

let cached: { apiKey: string; client: Resend } | undefined;

function clientFor(apiKey: string): Resend {
  if (!cached || cached.apiKey !== apiKey) cached = { apiKey, client: new Resend(apiKey) };
  return cached.client;
}

function isAlreadyExists(error: ProviderError): boolean {
  // 409 is Resend's conflict status. The two idempotency codes also use 409 but can only occur if we
  // sent an idempotency key, which we do not; they are excluded so they are never mistaken for a duplicate.
  if (error.statusCode === 409 && error.name !== 'invalid_idempotent_request' && error.name !== 'concurrent_idempotent_requests') {
    return true;
  }
  return typeof error.message === 'string' && /already\s+(exists?|been|added|registered|in)|duplicate/i.test(error.message);
}

function outcomeFor(error: ProviderError): SubscribeOutcome {
  if (error.statusCode === 429 && error.name === 'rate_limit_exceeded') return 'rate_limited';
  logNotify('provider_error', { name: error.name, status: error.statusCode });
  return 'server';
}

export async function subscribe(email: string, config: { apiKey: string; segmentId: string }): Promise<SubscribeOutcome> {
  const resend = clientFor(config.apiKey);
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  const created = await resend.contacts.create({ email, segments: [{ id: config.segmentId }] }, { signal });
  if (!created.error) return 'ok';
  if (!isAlreadyExists(created.error)) return outcomeFor(created.error);

  // The contact exists already (signed up before, or created by hand). Make sure it is in our segment.
  // An unsubscribed contact stays unsubscribed: broadcasts skip it, which is what the person asked for.
  const added = await resend.contacts.segments.add({ email, segmentId: config.segmentId }, { signal });
  if (!added.error || isAlreadyExists(added.error)) return 'ok';
  return outcomeFor(added.error);
}

/**
 * The one short hello after a sign-up. Never throws and never changes the answer the visitor gets: a failed
 * send is logged (error name and status only) and the address stays saved. Sent from the verified domain,
 * replies go to the contact address.
 */
export async function sendWelcome(email: string, config: { apiKey: string }): Promise<void> {
  try {
    const { subject, html, text } = renderWelcomeEmail(resolveSiteUrl(process.env).origin);
    const { data, error } = await clientFor(config.apiKey).emails.send(
      { from: `${site.brand.name} <${site.footer.contact}>`, to: [email], replyTo: site.footer.contact, subject, html, text },
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    );
    if (error || !data) logNotify('welcome_error', { name: error?.name, status: error?.statusCode });
  } catch (caught) {
    logNotify('welcome_error', { name: caught instanceof Error ? caught.name : undefined });
  }
}
