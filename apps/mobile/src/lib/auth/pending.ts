/**
 * Short-lived, in-memory hand-offs between the link handler and the sign-in
 * screens. Nothing here is persisted: an email address is never stored on the
 * phone (PRD A F6.2), and a sign-in token hash lives only until /verify reads
 * it once. Route params never carry either (TDD 01 3.1).
 */
import type { EmailLinkType } from './links.logic';

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
