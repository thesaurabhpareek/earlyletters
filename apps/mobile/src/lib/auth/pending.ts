/**
 * Short-lived hand-offs between the link handler and the sign-in screens.
 * An email address is never stored on the phone (PRD A F6.2), and a sign-in
 * token hash or PKCE code lives only in memory until /verify reads it once.
 * Route params never carry either (TDD 01 3.1).
 *
 * One thing is persisted: the pending email link request (BL-347,
 * link-guard.logic.ts), a random id and a time, kept in the Keychain so a
 * link still works after the app was closed while the person read their mail.
 * It holds no address and no token.
 */
import type { LinkRequest } from './link-guard.logic';
import { parseLinkRequest } from './link-guard.logic';
import type { AuthLink } from './links.logic';

export type SignInTrigger = 'first_letter' | 'invite' | 'invite_create' | 'sign_in' | 'settings';

const TRIGGERS: readonly SignInTrigger[] = ['first_letter', 'invite', 'invite_create', 'sign_in', 'settings'];

export function asSignInTrigger(v: unknown): SignInTrigger {
  return typeof v === 'string' && (TRIGGERS as readonly string[]).includes(v) ? (v as SignInTrigger) : 'settings';
}

let pendingLink: AuthLink | null = null;
let pendingEmail: string | null = null;
let trigger: SignInTrigger = 'settings';
const wrongCodes = new Map<string, number[]>();

/** Called by +native-intent for an https sign-in link. */
export function setPendingAuthLink(link: AuthLink): void {
  pendingLink = link;
}

/** Read once by /verify; a second read gets null. */
export function takePendingAuthLink(): AuthLink | null {
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

// ── Pending email link request (BL-347) ──────────────────────────────────

/** The Keychain item (secure-storage.ts); the session provider registers the store at import. */
export const LINK_REQUEST_KEY = 'scribe.auth.linkRequest';

export interface LinkRequestStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

let linkStorage: LinkRequestStorage | null = null;
/** undefined: not read from storage yet. */
let linkRequest: LinkRequest | null | undefined;

export function setLinkRequestStorage(storage: LinkRequestStorage | null): void {
  linkStorage = storage;
  linkRequest = undefined;
}

/** Records a Send on this phone, before the email leaves, so a fast tap on the link still matches. */
export async function beginLinkRequest(req: LinkRequest): Promise<void> {
  linkRequest = req;
  await linkStorage?.setItem(LINK_REQUEST_KEY, JSON.stringify(req)).catch(() => {});
}

export async function getLinkRequest(): Promise<LinkRequest | null> {
  if (linkRequest !== undefined) return linkRequest;
  const raw = linkStorage ? await linkStorage.getItem(LINK_REQUEST_KEY).catch(() => null) : null;
  linkRequest = parseLinkRequest(raw);
  return linkRequest;
}

/** After a sign-in by link or code, after a failed Send, and at sign-out. */
export async function clearLinkRequest(): Promise<void> {
  linkRequest = null;
  await linkStorage?.removeItem(LINK_REQUEST_KEY).catch(() => {});
}

/** Tests only: forget the in-memory request without touching storage. */
export function clearLinkRequestForTests(): void {
  linkRequest = undefined;
  pendingLink = null;
}
