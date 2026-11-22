/**
 * The two in-memory sign-in hand-offs of pending.ts, in a module with no imports so the auth store can end them
 * with the session (cross-account audit F3) without pulling in the Keychain. pending.ts re-exports the functions.
 */
import type { EmailLinkType } from './links.logic';

let pendingLink: { tokenHash: string; type: EmailLinkType } | null = null;
let pendingEmail: string | null = null;
const wrongCodes = new Map<string, number[]>();

/** Wrong-code times per address, for the client pause (errors.logic codeEntryPause). Memory only. */
export function wrongCodeTimes(email: string): number[] {
  return wrongCodes.get(email.trim().toLowerCase()) ?? [];
}

export function noteWrongCode(email: string, at: number): void {
  const k = email.trim().toLowerCase();
  wrongCodes.set(k, [...(wrongCodes.get(k) ?? []), at].slice(-10));
}

export function clearWrongCodes(email: string): void {
  wrongCodes.delete(email.trim().toLowerCase());
}

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
 * request time (the provider paths clear it) and not the saved invite link (it survives sign-out on purpose, A-REQ-028).
 */
export function clearPendingSignInMemory(): void {
  pendingEmail = null;
  pendingLink = null;
  wrongCodes.clear();
}
