/**
 * Settings home (EXPERIENCE_PASS_2026-10 S40, package P6; P8a's request on #310): the Account row's subtitle. Signed in,
 * it names the way the person signs in ("Signed in with Apple", from `authCopy.account.signedInWith`); signed out, or
 * while a sign-in is still on its way, it says what the row is for (`settingsHome.accountHelp`). Pure, so
 * test/settings-home.test.ts runs it in Node.
 */
import { authCopy } from '@scribe/content';
import type { AuthState } from '@/lib/auth/machine.logic';
import { copy } from '@/lib/copy';

export type SignInProvider = 'apple' | 'google' | 'email' | 'other' | null;

/** The auth states that have an account on this phone (a user id): from checking consent until signed out. */
const SIGNED_IN: ReadonlySet<AuthState['status']> = new Set(['checkingConsent', 'needsConsent', 'ready', 'signingOut']);

export function accountSubtitle(input: { status: AuthState['status']; provider: SignInProvider }): string {
  if (!SIGNED_IN.has(input.status)) return copy.settingsHome.accountHelp;
  return authCopy.account.signedInWith[input.provider ?? 'other'];
}
