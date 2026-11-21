/**
 * Owner: E2 (back-end). Unsubscribe links: a signed, opaque token, and the one Resend call it allows.
 *
 * The token is `<contact id>.<signature>`. The id is Resend's contact id (no address in the link, so none
 * in URLs, referrers or request logs); the signature is an HMAC-SHA256 of the id under UNSUBSCRIBE_SECRET,
 * so a link cannot be guessed or made for someone else. The secret is separate from the Resend key on
 * purpose: rotating the key must not break links already sitting in people's inboxes. Without the secret
 * no link is made and emails fall back to a mailto address.
 *
 * A token can do one thing: set that contact to unsubscribed. Unsubscribing twice is harmless.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Resend } from 'resend';
import { logNotify } from './log';

const CONTACT_ID = /^[A-Za-z0-9-]{8,64}$/;

function sign(contactId: string, secret: string): string {
  return createHmac('sha256', secret).update(`unsubscribe:${contactId}`).digest('base64url');
}

export function makeUnsubscribeToken(contactId: string, secret: string | undefined): string | null {
  const key = secret?.trim();
  if (!key || !CONTACT_ID.test(contactId)) return null;
  return `${contactId}.${sign(contactId, key)}`;
}

/** The contact id when the token is genuine, otherwise null. */
export function readUnsubscribeToken(token: string | null | undefined, secret: string | undefined): string | null {
  const key = secret?.trim();
  if (!key || !token || token.length > 200) return null;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  const contactId = token.slice(0, dot);
  if (!CONTACT_ID.test(contactId)) return null;
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(contactId, key));
  return given.length === expected.length && timingSafeEqual(given, expected) ? contactId : null;
}

export async function unsubscribeContact(contactId: string, apiKey: string): Promise<'ok' | 'server'> {
  try {
    const { error } = await new Resend(apiKey).contacts.update(
      { id: contactId, unsubscribed: true },
      { signal: AbortSignal.timeout(8000) },
    );
    if (!error) return 'ok';
    logNotify('unsubscribe_error', { name: error.name, status: error.statusCode });
  } catch (caught) {
    logNotify('unsubscribe_error', { name: caught instanceof Error ? caught.name : undefined });
  }
  return 'server';
}
