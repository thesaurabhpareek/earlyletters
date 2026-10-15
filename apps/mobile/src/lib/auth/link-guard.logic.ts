/**
 * When an opened email sign-in link may be used on this phone (BL-347,
 * security review H1 step 3, F02-REQ-018, F02-REQ-020, F02 6.3 step 3a).
 *
 * A link is accepted only while this install holds a pending request: the one
 * made when the person tapped Send on this phone, recorded before the email
 * left (pending.ts, kept in the Keychain so it survives the app being closed
 * while the person reads their mail). The request id travels in the link
 * (`?rid=` on the redirect, docs/ops/AUTH_SETUP.md section 4), so a link
 * someone else requested, or a link from an older email, does not match and
 * the person is sent to "type the code" instead. The code from the email
 * still works on any phone.
 *
 * A link is refused while any account is signed in on this phone: the app
 * never offers to send one then, so a link arriving in that state came from
 * somewhere else, and using it would replace the person's session.
 *
 * Pure; tested in test/auth-email-link.test.ts and test/auth-h1-link-hijack.test.ts.
 */

/** A request this phone made with Send. Holds no email address and no token. */
export interface LinkRequest {
  /** 32 hex characters, random per Send. */
  id: string;
  /** Device time of the Send, ms. */
  at: number;
}

/**
 * How long a request stays pending. Matches the project's email OTP lifetime
 * today (1 hour, AUTH_SETUP section 4); the server's expiry is the real limit.
 * When the founder lowers the OTP life to 15 minutes (review M4, FT-04) this
 * may follow; a longer window here never extends a link.
 */
export const LINK_REQUEST_TTL_MS = 60 * 60_000;

export const LINK_REQUEST_ID = /^[0-9a-f]{32}$/;

export type LinkRefusal =
  /** No Send on this phone, or the Send is older than the TTL: "type the code from the email on this phone". */
  | 'not_requested'
  /** A Send exists but the link belongs to another request (someone else's, or an older email). */
  | 'other_request'
  /** An account is signed in on this phone. */
  | 'signed_in';

export type LinkDecision = { ok: true } | { ok: false; reason: LinkRefusal };

export function decideEmailLink(input: {
  /** `rid` from the opened link, if any. */
  linkRequestId: string | null | undefined;
  pending: LinkRequest | null;
  /** The account signed in on this phone now, including one only in the Keychain at launch. */
  signedInUserId: string | null;
  now: number;
}): LinkDecision {
  if (input.signedInUserId) return { ok: false, reason: 'signed_in' };
  const p = input.pending;
  if (!p || !LINK_REQUEST_ID.test(p.id) || input.now - p.at > LINK_REQUEST_TTL_MS || input.now < p.at - 5 * 60_000) {
    return { ok: false, reason: 'not_requested' };
  }
  if (!input.linkRequestId || input.linkRequestId !== p.id) return { ok: false, reason: 'other_request' };
  return { ok: true };
}

/** 16 random bytes as 32 lowercase hex characters. */
export function linkRequestIdFrom(bytes: Uint8Array): string {
  if (bytes.length < 16) throw new Error('link_request_entropy');
  return Array.from(bytes.subarray(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Parses the stored request; anything malformed counts as no request. */
export function parseLinkRequest(raw: string | null): LinkRequest | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { id?: unknown; at?: unknown };
    if (typeof v.id === 'string' && LINK_REQUEST_ID.test(v.id) && typeof v.at === 'number' && Number.isFinite(v.at)) return { id: v.id, at: v.at };
  } catch {
    // fall through
  }
  return null;
}

/** The error the email functions throw for a refused link; the verify screen maps it to words. */
export class LinkRefusedError extends Error {
  readonly reason: LinkRefusal;
  constructor(reason: LinkRefusal) {
    super(`email_link_refused_${reason}`);
    this.name = 'LinkRefusedError';
    this.reason = reason;
  }
}
