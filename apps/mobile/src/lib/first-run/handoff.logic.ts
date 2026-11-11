/**
 * The hand-offs of account-first slice 3 (NX-36 S5, S6, S7; NX-31 R4, R11, R17), pure and tested in Node
 * (test/first-run-code-consent-child.test.ts). Reads nothing, sends nothing, records nothing.
 *
 * - `recoverySet`: the code screen's recovery set (NX-31-R11, NX-36 S5). Before the minute is up there is nothing to
 *   offer but the plain wait line. After it, "Send a new email", "Use a different email" and "Sign in with Apple" show
 *   together, so the screen is never a dead end. No ticking number.
 * - `firstRunStartStep`: which first-run step opens once a person is in (signed in, or on the local start).
 * - `welcomeHandoffStep`, `reportsPastWelcome`: how the signed-in start (the promise step) behaves like the Welcome where
 *   it should: a returning account's book hands over to the Book, and it is not "past the welcome" until it moves on.
 * - `consentHandoff`: what the consent sheet does next (NX-36 4.2): two lines of its own, written out below.
 */
import type { AuthState } from '@/lib/auth/machine.logic';

export type RecoveryOption = 'resend' | 'differentEmail' | 'apple';

export interface RecoverySet {
  /** The minute has passed since the email was sent (or no send time is known, which is the restart case). */
  open: boolean;
  /** The options to show, in order. Empty before the minute is up. */
  options: RecoveryOption[];
  /** The one line before the minute is up (static text, no ticking number). */
  waitLineShown: boolean;
}

/**
 * `signedIn`: a session now exists (the code, the Mail link or Apple has just worked). The screen is still mounted for a
 * few frames while the sheet moves on, and `sentAt` is unknown then too, so without this the set would flip from closed
 * to open at the moment of success and say "You can send another email." to someone who just got in. Signed in, nothing
 * is offered and nothing is announced. An unknown `sentAt` with no session is the restart case: the set is open.
 */
export function recoverySet(input: { sentAt: number | null; now: number; waitMs: number; appleAvailable: boolean; signedIn: boolean }): RecoverySet {
  if (input.signedIn) return { open: false, options: [], waitLineShown: false };
  const open = input.sentAt === null || input.now >= input.sentAt + input.waitMs;
  if (!open) return { open: false, options: [], waitLineShown: true };
  const options: RecoveryOption[] = ['resend', 'differentEmail'];
  if (input.appleAvailable) options.push('apple');
  return { open: true, options, waitLineShown: false };
}

/** The 60-second arrival is announced once, and only as a change (never on arrival at a screen that is already open). */
export function shouldAnnounceRecovery(was: boolean, now: boolean): boolean {
  return !was && now;
}

export type StartStep = 'welcome' | 'promise' | 'child';
/** Every step of first run, in order (app/onboarding.tsx ORDER). */
export type FirstRunStepId = 'welcome' | 'promise' | 'child' | 'signsAs' | 'finish';

/**
 * Account first (NX-31 R17), behind the server switch. With the switch off, or on a phone that is neither signed in nor
 * on the local start, the first step is the Welcome exactly as before. Signed in: the promise step (NX-36 Q1 default,
 * "kept as built"), then the child step. The local start goes straight to the child step (NX-36 S3: "skips straight to
 * S7"); its Back is the promise step.
 */
export function firstRunStartStep(input: { serverFeatures: boolean; hasSession: boolean; localStartChosen: boolean }): StartStep {
  if (!input.serverFeatures) return 'welcome';
  if (input.hasSession) return 'promise';
  if (input.localStartChosen) return 'child';
  return 'welcome';
}

/** A session exists in these statuses (the same set the gate reads). */
export function hasSessionState(s: AuthState): boolean {
  return s.status === 'checkingConsent' || s.status === 'needsConsent' || s.status === 'ready' || s.status === 'signingOut';
}

/** Back on the first step of the account-first run would land on the signed-out Welcome: it is not offered (R4). */
export function backShown(input: { accountFirst: boolean; step: FirstRunStepId }): boolean {
  if (input.step === 'welcome') return false;
  return !(input.accountFirst && input.step === 'promise');
}

/**
 * The step the hand-over to the Book is asked about (components/family/welcome-handoff.logic.ts welcomeMayLeave, which
 * allows the welcome step only). A person who opened first run already signed in is on the promise step and has not moved
 * on: if their account's book arrives, it must open on the Book, never offer a second book. So that one step, the start
 * step before the person has moved off it, is asked as the welcome. Every later step (the child step, the signature, the
 * last) is asked as itself and never hands over, and so is every build that opens on the Welcome (the mapping would
 * change nothing there). The fuller answer is S17 in #764.
 */
export function welcomeHandoffStep(input: { start: FirstRunStepId; step: FirstRunStepId }): FirstRunStepId {
  return input.start === 'promise' && input.step === 'promise' ? 'welcome' : input.step;
}

/**
 * Whether the steps tell the route that the person is past the welcome (so a lost session never swaps what they typed for
 * a sign-in screen). From the Welcome start: once it leaves the Welcome, as before. From the local start (no session, on
 * the child step): at once. From the signed-in start: only once they move off the promise step, so a person signed out
 * under it (consent's "Try another way") is back on the Welcome, not left on a promise step with no account.
 */
export function reportsPastWelcome(input: { start: FirstRunStepId; step: FirstRunStepId }): boolean {
  return input.step !== (input.start === 'promise' ? 'promise' : 'welcome');
}

/**
 * The account-first child step's name field says the name is optional (NX-31-R3); other builds keep "Name". Only for
 * one child: with more than one name on the step every name is needed (firstRunChildBlock), so the first row goes back
 * to "Name" the moment "Add another child" is tapped, never "Name, if you like" beside a Continue that waits for it.
 */
export function childNameFieldWords(input: { accountFirst: boolean; index: number; nearLimit: boolean; multiple: boolean }, words: { nameLabel: string; nameOptionalLabel: string; nameOptionalHelp: string }): { label: string; help: string | null } {
  const optional = input.accountFirst && input.index === 0 && !input.multiple;
  if (!optional) return { label: words.nameLabel, help: null };
  return { label: words.nameOptionalLabel, help: input.nearLimit ? null : words.nameOptionalHelp };
}

/**
 * Whether the child step draws the birthday or due-date block (NX-31-R3). Servers-off builds keep the old rule: it arrives
 * with the first letter of the name (`dateShown`). Account first the name is optional and an empty name with a date makes
 * the book, so the block is there from the first paint: with it hidden, Continue would wait for a birthday that has no
 * control (a dead end for anyone who leaves the name empty).
 */
export function dateBlockShown(input: { dateShown: boolean; accountFirst: boolean }): boolean {
  return input.dateShown || input.accountFirst;
}

export type ConsentNext = 'askClaim' | 'keepOnPhone' | 'continue';

/**
 * After the sensitive-data answer, what comes next (NX-36 4.2):
 *  - agreed and this phone's letters belong to no account yet: the claim screen, before anything is uploaded;
 *  - declined: stay signed in with sync off, the book still opens (S7);
 *  - otherwise: carry on (the sheet closes onto the next first-run step).
 * What the claim screen then does with an account that already has a book is not decided here (it adds the phone's book
 * as a second book and deletes nothing: the later claim slice). This does not call the merge-back model, whose cases 4 and 5 are not shipped.
 */
export function consentHandoff(input: { status: AuthState['status']; sync: 'on' | 'off' | 'unknown' | null; claimPending: boolean }): ConsentNext {
  if (input.status !== 'ready') return 'continue';
  if (input.sync === 'off') return 'keepOnPhone';
  if (input.sync === 'on' && input.claimPending) return 'askClaim';
  return 'continue';
}
