/**
 * Settings home (EXPERIENCE_PASS_2026-10 S40, package P6; P8a's request on #310): the Account row's subtitle. Signed in,
 * it names the way the person signs in ("Signed in with Apple", from `authCopy.account.signedInWith`); signed out, or
 * while a sign-in is still on its way, it says what the row is for (`settingsHome.accountHelp`). Pure, so
 * test/settings-home.test.ts runs it in Node.
 */
import { authCopy, billingCopy } from '@scribe/content';
import type { AuthState } from '@/lib/auth/machine.logic';
import { plusOn, type PlanState } from '@/lib/billing/plan.logic';
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

/**
 * The Plan row from the plan itself (PL-3): what Settings home draws. Plus is on by the same rule as the Keep step and
 * Plan (`plusOn`: trial, active and Apple's grace before their end); "shared" is Family Sharing. So off, trial, active,
 * grace, shared and lapsed each read the same here as everywhere else.
 */
export function planRowFor(plan: PlanState, now: string, alpha: boolean): ReturnType<typeof planRow> {
  return planRow({ alpha, plusOn: plusOn(plan, now), familyShared: plan.details.ownership === 'familyShared' });
}

/**
 * The header card at the top of Settings home (settings-ia.md 3, design.md 2.6, SETTINGS_AND_ACCOUNT.md 6; CCO-9).
 * Title: the name the person signs as, when there is one, else "Plan" (or "Account" with sign-in). Second line: "On
 * this phone" in a build without sign-in, else the sign-in line.
 *
 * Without sign-in the card is the Plan row, so Plan stays one tap from home: it opens Plan, its value is the Plan
 * row's (planRowFor: "Free", "Plus" or "Plus, shared"; none in alpha) and the Plan row's line sits under it as the
 * footer (the free-letters line while Plus is off, the alpha note in alpha). With sign-in it opens Account, carries no
 * plan words, and the Plan row is drawn directly under it, unchanged, so "Settings, Plan" still reads literally.
 */
export type HeaderCard = {
  title: string;
  subtitle: string;
  value: string | undefined;
  hint: string;
  route: 'plan' | 'account';
  footer: string | undefined;
  planRow: boolean;
};

export function headerCard(input: {
  signIn: boolean;
  status: AuthState['status'];
  provider: SignInProvider;
  signsAs: string | null | undefined;
  plan: ReturnType<typeof planRow>;
}): HeaderCard {
  const h = copy.settingsHome;
  const name = input.signsAs?.trim();
  if (!input.signIn) {
    return { title: name || h.planLabel, subtitle: h.cardOnPhone, value: input.plan.value, hint: h.cardHint.plan, route: 'plan', footer: input.plan.subtitle, planRow: false };
  }
  return {
    title: name || h.accountLabel,
    subtitle: SIGNED_IN.has(input.status) ? authCopy.account.signedInWith[input.provider ?? 'other'] : authCopy.account.signedOutTitle,
    value: undefined,
    hint: h.cardHint.account,
    route: 'account',
    footer: undefined,
    planRow: true,
  };
}
