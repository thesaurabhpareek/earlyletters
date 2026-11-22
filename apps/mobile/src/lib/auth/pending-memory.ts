/**
 * The two in-memory sign-in hand-offs of pending.ts, in a module with no imports so the auth store can end them
 * with the session (cross-account audit F3) without pulling in the Keychain. pending.ts re-exports the functions.
 */
import type { EmailLinkType } from './links.logic';

let pendingLink: { tokenHash: string; type: EmailLinkType } | null = null;
let pendingEmail: string | null = null;

/** Called by +native-intent for an https sign-in link. */
export function setPendingAuthLink(link: { tokenHash: string; type: EmailLinkType }): void {
  pendingLink = link;
}

/** Read once by /verify; a second read gets null. */
export function takePendingAuthLink(): { tokenHash: string; type: EmailLinkType } | null {
  const l = pendingLink;
  pendingLink = null;
  return l;
}

export function setPendingEmail(email: string | null): void {
  pendingEmail = email;
}

export function getPendingEmail(): string | null {
  return pendingEmail;
}

/**
 * Cross-account audit F3: both end with the session that was running and with a change of account. Not the Keychain
 * request time (the provider paths clear it), not the wrong-code pause (a rate limit keeps the safe side), and not the
 * saved invite link (it survives sign-out on purpose, A-REQ-028).
 */
export function clearPendingSignInMemory(): void {
  pendingEmail = null;
  pendingLink = null;
}
