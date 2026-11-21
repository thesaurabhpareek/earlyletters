/**
 * Short-lived hand-offs between the link handler and the sign-in screens. An
 * email address is never stored on the phone (PRD A F6.2), and a sign-in
 * token hash lives in memory only until /verify reads it once. Route params
 * never carry either (TDD 01 3.1).
 *
 * One thing is persisted: the time this phone last asked for a sign-in email
 * (Keychain, this device only, no address), so an opened link is used only on
 * the phone that asked for it (BL-347, security review H1;
 * email-link.logic.ts). With server features off (lib/capabilities.ts) these
 * helpers never touch the Keychain.
 */
import { serverFeaturesEnabled } from '../capabilities';
import { secureStorage } from '../supabase/secure-storage';
import { decodePendingRequest, encodePendingRequest, type PendingEmailRequest } from './email-link.logic';
import type { EmailLinkType } from './links.logic';

export const PENDING_REQUEST_KEY = 'scribe.auth.pendingEmailRequest';

/** Called right after Supabase accepted an email request from this phone. */
export async function notePendingEmailRequest(now = Date.now()): Promise<void> {
  if (!serverFeaturesEnabled()) return;
  await secureStorage.setItem(PENDING_REQUEST_KEY, encodePendingRequest({ at: now })).catch(() => {});
}

/** Null when this phone has no request (or the Keychain cannot be read: refuse, never guess); 'expired' past an hour. */
export async function readPendingEmailRequest(now = Date.now()): Promise<PendingEmailRequest | 'expired' | null> {
  if (!serverFeaturesEnabled()) return null;
  try {
    return decodePendingRequest(await secureStorage.getItem(PENDING_REQUEST_KEY), now);
  } catch {
    return null;
  }
}

/**
 * Whether a session is saved on this phone (the Keychain, not the in-memory auth state, which is
 * still `restoring` when a link opens the app from closed). An unreadable Keychain counts as yes:
 * a link must never replace a session we could not see (F02-REQ-020, F02-U27).
 */
export async function sessionSavedOnPhone(sessionKey: string): Promise<boolean> {
  if (!serverFeaturesEnabled()) return false;
  try {
    return (await secureStorage.getItem(sessionKey)) !== null;
  } catch {
    return true;
  }
}

/**
 * Spent by a sign-in, and dropped by "Not my account" and every sign-out. The address typed for an
 * email sign-in goes with it (memory only, so also with server features off): after a link or code
 * sign-in, or a sign-out, the next sign-in starts with an empty field (S01).
 */
export async function clearPendingEmailRequest(): Promise<void> {
  pendingEmail = null;
  if (!serverFeaturesEnabled()) return;
  await secureStorage.removeItem(PENDING_REQUEST_KEY).catch(() => {});
}

export type SignInTrigger = 'first_letter' | 'invite' | 'invite_create' | 'sign_in' | 'settings';

const TRIGGERS: readonly SignInTrigger[] = ['first_letter', 'invite', 'invite_create', 'sign_in', 'settings'];

export function asSignInTrigger(v: unknown): SignInTrigger {
  return typeof v === 'string' && (TRIGGERS as readonly string[]).includes(v) ? (v as SignInTrigger) : 'settings';
}

let pendingLink: { tokenHash: string; type: EmailLinkType } | null = null;
let pendingEmail: string | null = null;
let trigger: SignInTrigger = 'settings';
const wrongCodes = new Map<string, number[]>();

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

export function setSignInTrigger(t: SignInTrigger): void {
  trigger = t;
}

export function getSignInTrigger(): SignInTrigger {
  return trigger;
}

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
