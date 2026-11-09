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
 * The header card at the top of Settings home (settings-ia.md 3, design.md 2.6, SETTINGS_AND_ACCOUNT.md 6).
 * Title: the name the person signs as, when there is one, else "On this phone" alone (or "Account" with sign-in).
 * Second line: "On this phone" in a build without sign-in, else the sign-in line.
 *
 * The Plan row is drawn directly under the card in every build (CCO-9 and settings-ia.md 3 [F] read literally, CTO
 * ruling 8 Nov 2026): the Terms, the Subscription Terms and the plan reminder send people to "Settings, Plan" to
 * cancel or ask for a refund (California auto-renewal, CR-050 (h)), so a row labelled Plan must be there as written.
 * So the card carries no plan words. With sign-in it opens Account (design.md 2.6). Without sign-in it opens nothing:
 * a second tap target to Plan right above the Plan row would say the same thing twice (design to confirm; design.md
 * 2.6 had the card open Plan only because there was no Plan row then).
 */
export type HeaderCard = {
  title: string;
  subtitle: string | undefined;
  /** Where a tap goes; null: the card is not a button. */
  route: 'account' | null;
  hint: string | undefined;
};

export function headerCard(input: { signIn: boolean; status: AuthState['status']; provider: SignInProvider; signsAs: string | null | undefined }): HeaderCard {
  const h = copy.settingsHome;
  const name = input.signsAs?.trim();
  if (!input.signIn) {
    return name ? { title: name, subtitle: h.cardOnPhone, route: null, hint: undefined } : { title: h.cardOnPhone, subtitle: undefined, route: null, hint: undefined };
  }
  return {
    title: name || h.accountLabel,
    subtitle: SIGNED_IN.has(input.status) ? authCopy.account.signedInWith[input.provider ?? 'other'] : authCopy.account.signedOutTitle,
    route: 'account',
    hint: h.cardHint.account,
  };
}

/**
 * The You tab as named states (YOU-TAB-STATES-9nov, section 2; BL-801). One predicate, so the top card and the Delete
 * account row cannot disagree about whether this phone has an account (GAP 2).
 *
 *   account     A: the phone has a session (a user id): the Account card.
 *   signedOut   B: sign-in is on, no session, and the phone has been claimed by an account before.
 *   localStart  C: sign-in is on, no session, and no account has ever claimed this phone's letters.
 *   noSignIn    0: a build without sign-in: today's card, "On this phone", opens nothing.
 *
 * B versus C reads the sync owner (`syncOwner`, via `currentUserId()` in the store). The owner is written by
 * `takeOwnership`, which runs when the sync engine starts, that is after sign-in, consent and the claim screen's
 * "Keep in this account" (not at the sign-in itself). A phone with a session is A before and after that moment, since
 * A is decided by the session first; the owner only separates the two phones that have no session.
 */
export type YouTabState = 'account' | 'signedOut' | 'localStart' | 'noSignIn';

export interface YouTabView {
  state: YouTabState;
  /** The card is the Sign in card (B or C), not the Account card. */
  signedOutCard: boolean;
  /** C only: the second paragraph. */
  localStartLine: boolean;
  /** Delete account may be drawn (still needs the build's deletion flag): a settled session, not mid-consent or mid-sign-out. */
  accountReady: boolean;
}

/** While consent is being checked or asked, or a sign-out is under way, the person is neither settled in nor out: no deletion entry (Karma ruling on #738). */
const SETTLED: ReadonlySet<AuthState['status']> = new Set(['ready']);

export function youTabView(input: { signIn: boolean; status: AuthState['status']; owner: string | null }): YouTabView {
  if (!input.signIn) return { state: 'noSignIn', signedOutCard: false, localStartLine: false, accountReady: false };
  if (SIGNED_IN.has(input.status)) return { state: 'account', signedOutCard: false, localStartLine: false, accountReady: SETTLED.has(input.status) };
  const claimed = input.owner !== null;
  return { state: claimed ? 'signedOut' : 'localStart', signedOutCard: true, localStartLine: !claimed, accountReady: false };
}

/** A book's name for a list row or a page title: a book with no name reads "Your child's book", never an empty row (GAP 6). */
export function bookTitle(name: string | null | undefined): string {
  return name?.trim() || copy.settingsHome.childFallback;
}

/**
 * Whether this phone may erase its letters locally: the same rule as `localDeletionAllowed()` in the store, which reads the
 * sync owner. A phone an account has claimed has the account's copy too, so local erase is hidden (A and B); a phone that
 * never signed in may (C, and 0). Pure copy of that one-line rule so the states table is testable in Node.
 */
export function localDeletionAllowedFor(owner: string | null): boolean {
  return owner === null;
}
