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
 * The header card at the top of Settings home (settings-ia.md 3, design.md 2.6, SETTINGS_AND_ACCOUNT.md 6; CCO-9).
 * Title: the name the person signs as, when there is one, else "Plan" (or "Account" with sign-in). Second line: "On this phone" in a build
 * without sign-in, else the sign-in line. Value: the plan status ("Plus" or "Free"); none in alpha, where the alpha
 * note sits under the card instead (no Plus to buy in a test build). Where it goes: Plan in a build without sign-in
 * (so the card is the one-tap Plan row CCO-9 asks for), Account with sign-in, where a Plan row sits directly under
 * the card so "Settings, Plan" still reads literally.
 */
export type HeaderCard = {
  title: string;
  subtitle: string;
  value: string | null;
  hint: string;
  route: 'plan' | 'account';
  footer: string | null;
  planRow: boolean;
};

export function headerCard(input: {
  signIn: boolean;
  status: AuthState['status'];
  provider: SignInProvider;
  signsAs: string | null | undefined;
  alpha: boolean;
  plusOn: boolean;
}): HeaderCard {
  const h = copy.settingsHome;
  const name = input.signsAs?.trim();
  const subtitle = !input.signIn
    ? h.cardOnPhone
    : SIGNED_IN.has(input.status)
      ? authCopy.account.signedInWith[input.provider ?? 'other']
      : authCopy.account.signedOutTitle;
  return {
    title: name ? name : input.signIn ? h.accountLabel : h.planLabel,
    subtitle,
    value: input.alpha ? null : input.plusOn ? billingCopy.plan.statusTitle : h.planFree,
    hint: input.signIn ? h.cardHint.account : h.cardHint.plan,
    route: input.signIn ? 'account' : 'plan',
    // With sign-in, the Plan row under the card carries the alpha note as its subtitle, as today.
    footer: input.alpha && !input.signIn ? billingCopy.alpha.note : null,
    planRow: input.signIn,
  };
}
