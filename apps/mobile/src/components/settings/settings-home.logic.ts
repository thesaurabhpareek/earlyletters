/**
 * Settings home (EXPERIENCE_PASS_2026-10 S40, package P6; P8a's request on #310): the Account row's subtitle. Signed in,
 * it names the way the person signs in ("Signed in with Apple", from `authCopy.account.signedInWith`); signed out, or
 * while a sign-in is still on its way, it says what the row is for (`settingsHome.accountHelp`). Pure, so
 * test/settings-home.test.ts runs it in Node.
 */
import { authCopy, billingCopy } from '@scribe/content';
import type { AuthState } from '@/lib/auth/machine.logic';
import { copy } from '@/lib/copy';

export type SignInProvider = 'apple' | 'google' | 'email' | 'other' | null;

/** The auth states that have an account on this phone (a user id): from checking consent until signed out. */
const SIGNED_IN: ReadonlySet<AuthState['status']> = new Set(['checkingConsent', 'needsConsent', 'ready', 'signingOut']);

export function accountSubtitle(input: { status: AuthState['status']; provider: SignInProvider }): string {
  if (!SIGNED_IN.has(input.status)) return copy.settingsHome.accountHelp;
  return authCopy.account.signedInWith[input.provider ?? 'other'];
}

/**
 * The Plan row (founder decision F5; PL-3; CDesO-6). Store build: the value says the plan in one word, "Free", "Plus"
 * or "Plus, shared" (Plus through Apple Family Sharing), with no count and no countdown (dates live on Plan); the help
 * line ("Your first two letters are free. Plus lets you keep adding letters.") shows only while Plus is off. Alpha
 * build (billing/alpha.ts PLUS_ALPHA, #552): only the note that Plus is not part of this test, and no value, since no
 * plan can be read or bought there. The row's place and title never change (Settings, Plan is the path the Plus terms name).
 */
export function planRow(input: { alpha: boolean; plusOn: boolean; familyShared: boolean }): { subtitle: string | undefined; value: string | undefined } {
  if (input.alpha) return { subtitle: billingCopy.alpha.note, value: undefined };
  const s = billingCopy.membership.status;
  if (!input.plusOn) return { subtitle: copy.settingsHome.planHelp, value: s.free };
  return { subtitle: undefined, value: input.familyShared ? s.shared : s.plus };
}
