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
import { makeUnsubscribeToken } from './unsubscribe';
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

export async function subscribe(
  email: string,
  config: { apiKey: string; segmentId: string },
): Promise<{ outcome: SubscribeOutcome; contactId?: string; existing?: boolean }> {
  const resend = clientFor(config.apiKey);
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  // Look first. An address already on the list gets no second welcome email (nobody can use the form to mail
  // someone repeatedly), and an address that has unsubscribed is left alone: it asked to stop, and the visitor
  // still sees the same answer as for anyone else, so the form reveals nothing about who is on the list.
  try {
    const found = await resend.contacts.get(email, { signal });
    if (!found.error && found.data?.id) {
      if (!found.data.unsubscribed) {
        const added = await resend.contacts.segments.add({ email, segmentId: config.segmentId }, { signal });
        if (added.error && !isAlreadyExists(added.error)) return { outcome: outcomeFor(added.error) };
      }
      return { outcome: 'ok', contactId: found.data.id, existing: true };
    }
  } catch {
    // A failed lookup falls through to create, which is idempotent for the list.
  }

  const created = await resend.contacts.create({ email, segments: [{ id: config.segmentId }] }, { signal });
  if (!created.error) return { outcome: 'ok', contactId: created.data?.id };
  if (!isAlreadyExists(created.error)) return { outcome: outcomeFor(created.error) };

  // The contact exists already (signed up before, or created by hand). Make sure it is in our segment.
  // An unsubscribed contact stays unsubscribed: broadcasts skip it, which is what the person asked for.
  const added = await resend.contacts.segments.add({ email, segmentId: config.segmentId }, { signal });
  if (added.error && !isAlreadyExists(added.error)) return { outcome: outcomeFor(added.error) };
  // Needed for the personal unsubscribe link; a failed lookup only means the email gets the mailto fallback.
  let contactId: string | undefined;
  try {
    contactId = (await resend.contacts.get(email, { signal })).data?.id;
  } catch {
    contactId = undefined;
  }
  return { outcome: 'ok', contactId };
}

/**
 * The one short hello after a sign-up. Never throws and never changes the answer the visitor gets: a failed
 * send is logged (error name and status only) and the address stays saved. Sent from the verified domain,
 * replies go to the contact address. Every send carries an unsubscribe link (personal and one-click when
 * UNSUBSCRIBE_SECRET and the contact id are known, otherwise a mailto address) and the matching headers.
 */
export async function sendWelcome(email: string, config: { apiKey: string }, contactId?: string): Promise<void> {
  try {
    const origin = resolveSiteUrl(process.env).origin;
    const contact = site.footer.contact;
    const token = contactId ? makeUnsubscribeToken(contactId, process.env.UNSUBSCRIBE_SECRET) : null;
    const mailto = `mailto:${contact}?subject=Unsubscribe`;
    const headers: Record<string, string> = token
      ? {
          'List-Unsubscribe': `<${origin}/api/unsubscribe?t=${token}>, <${mailto}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }
      : { 'List-Unsubscribe': `<${mailto}>` };
    const { subject, html, text } = renderWelcomeEmail(origin, token ? `${origin}/unsubscribe?t=${token}` : mailto);
    const { data, error } = await clientFor(config.apiKey).emails.send(
      { from: `${site.brand.name} <${contact}>`, to: [email], replyTo: contact, subject, html, text, headers },
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    );
    if (error || !data) logNotify('welcome_error', { name: error?.name, status: error?.statusCode });
  } catch (caught) {
    logNotify('welcome_error', { name: caught instanceof Error ? caught.name : undefined });
  }
}
