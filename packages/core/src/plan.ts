/**
 * Plus entitlements: one pure rules engine decides every Plus gate
 * (TDD 08 section 2, BL-036). No I/O, no clock reads (`now` is an input),
 * no store SDK. The device and the server feed it what they know.
 *
 * Founder decisions (3 Oct 2026) encoded here:
 *  - Subscriptions are Apple only, StoreKit 2 direct. PlanView mirrors what
 *    StoreKit 2 and our server snapshot report; no third-party billing layer.
 *  - Plus is held per account and covers every book where the holder is a
 *    PARENT. Every member of a covered book gets its Plus features there.
 *  - Membership (D-082, D-083, 4 Oct 2026): the first 2 letters kept per
 *    account are free, across every book; after that, keeping another letter
 *    needs Plus. Books are free to start (one pool of letters, not one gate
 *    per book) and Read together has no session limit.
 *  - Reading, playing, exporting, deleting, restoring and family authorship
 *    are never gated: they are not members of GatedFeature, so a gate on them
 *    cannot compile (LEGAL-REQ-050). Nothing becomes unreadable when Plus
 *    lapses.
 *  - The one deliberate exception to the old "writing is free forever" rule:
 *    the Keep step of a letter (`keep_letter`). Capturing, typing and drafts
 *    are never blocked, and a held draft stays on the phone untouched. Only
 *    the act of adding a third letter to the book is Plus. This replaces
 *    'write' in FreeForever; see decideKeepLetter and the tests that pin it.
 */

/** Never gated. Not part of GatedFeature, so a gate on these cannot compile. */
export type FreeForever =
  | 'read'
  | 'play_recording'
  | 'export'
  | 'family_authors'
  | 'invite'
  | 'download_backed_up_audio'
  | 'restore_backup'
  | 'delete';

/** The only things Plus can gate. Adding to this list is a product decision, not a code change. */
export type GatedFeature = 'keep_letter' | 'backup_upload' | 'theme_extra';

/** Compile-time proof that no free-forever feature is gated. Breaks the build if the two ever overlap. */
type Overlap = Extract<GatedFeature, FreeForever>;
const NO_OVERLAP: [Overlap] extends [never] ? true : never = true;
void NO_OVERLAP;

export const GATED_FEATURES: readonly GatedFeature[] = ['keep_letter', 'backup_upload', 'theme_extra'];
export const FREE_FOREVER: readonly FreeForever[] = [
  'read', 'play_recording', 'export', 'family_authors', 'invite', 'download_backed_up_audio', 'restore_backup', 'delete',
];

export type OfferTrigger = 'keep_letter' | 'backup' | 'themes' | 'chapter_complete' | 'settings';

/** Free letters per account, across every book (D-082; remote config `free_letters_allowance`, which may only raise it). */
export const DEFAULT_FREE_LETTERS = 2;
/** Upper bound on the remote value, so a typo in config cannot make Plus meaningless. */
export const MAX_FREE_LETTERS = 100;

/**
 * What the device knows about one account's Plus. Built from the server
 * snapshot and StoreKit 2 `Transaction.currentEntitlements` /
 * `Product.SubscriptionInfo.RenewalState` (TDD 08 2.4).
 */
export interface PlanView {
  /**
   * `billing_retry` is Apple's billing retry period outside a grace period:
   * Plus extras are off (C-REQ-027 keeps them on only during grace).
   */
  state: 'none' | 'trial' | 'active' | 'grace' | 'billing_retry' | 'expired' | 'refunded' | 'revoked';
  /** ISO time: max(expiresDate, grace end). null means no end (lifetime; P2). */
  effectiveUntil: string | null;
  /** Last time the server or StoreKit confirmed it. Staleness never turns Plus off early. */
  verifiedAt: string | null;
  /** StoreKit 2 environment of the transaction. */
  environment: 'production' | 'sandbox' | 'xcode';
  /** Profiles allowed to use sandbox purchases (TestFlight). */
  isTester: boolean;
}

export const NO_PLAN: PlanView = { state: 'none', effectiveUntil: null, verifiedAt: null, environment: 'production', isTester: false };

export interface DecideInput {
  /** ISO time. The engine never reads a clock. */
  now: string;
  /** keep_letter is decided by decideKeepLetter (it needs the letter count); decide() throws for it. */
  feature: GatedFeature;
  /** First run never shows an offer (C-REQ-023, K-12). */
  surface: 'first_run' | 'normal';
  /** Any book's birthday today, local date: no offers that day (C-REQ-023). */
  isBirthday: boolean;
  signedIn: boolean;
  /** Purchases need the network; offline, an offer becomes quiet. Defaults to true. */
  online?: boolean;
  viewer: {
    /** Role in the book this gate is about; null for account-level surfaces. */
    roleInBook: 'parent' | 'contributor' | null;
    own: PlanView;
  };
  /** The book this gate is about; null for account-level surfaces. */
  book: { coveredByOtherParent: boolean } | null;
  /** Who asked for a backup upload: a tap, or the background uploader. Defaults to 'user'. */
  initiatedBy?: 'user' | 'background';
}

export type Decision =
  | { kind: 'allow'; via: 'plus_own' | 'plus_book' }
  | { kind: 'offer'; trigger: OfferTrigger; needsSignIn: boolean }
  | { kind: 'quiet'; reason: 'contributor' | 'first_run' | 'birthday' | 'free_background' | 'offline' };

const OFFER_FOR: Record<Exclude<GatedFeature, 'keep_letter'>, OfferTrigger> = {
  backup_upload: 'backup',
  theme_extra: 'themes',
};

const ON_STATES: ReadonlySet<PlanView['state']> = new Set(['trial', 'active', 'grace']);

/**
 * Is this account's Plus on at `now`? Production entitlements count;
 * sandbox and Xcode ones only for testers. Trial, active and grace count
 * until effectiveUntil (or always when it is null). A stale cache with a
 * future effectiveUntil stays on: the period is paid, and staleness can
 * only hide a cancellation or refund, which remove extras only.
 */
export function planActive(p: PlanView, now: string): boolean {
  if (p.environment !== 'production' && !p.isTester) return false;
  if (!ON_STATES.has(p.state)) return false;
  if (p.effectiveUntil === null) return true;
  return Date.parse(now) < Date.parse(p.effectiveUntil);
}

/**
 * The remote-config value for free letters, made safe. It may only RAISE the
 * reviewed default (2), never lower it: 0, negatives, fractions, text and
 * missing values all fall back to the default; large values stop at the cap.
 */
export function freeLettersFrom(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < DEFAULT_FREE_LETTERS) return DEFAULT_FREE_LETTERS;
  return Math.min(value, MAX_FREE_LETTERS);
}

export function isGatedFeature(f: string): f is GatedFeature {
  return (GATED_FEATURES as readonly string[]).includes(f);
}

export interface KeepLetterInput {
  /** ISO time. The engine never reads a clock. */
  now: string;
  /** This phone's Plus. */
  plan: PlanView;
  /**
   * Letters ever kept on this account (a never-decreasing count; the app takes
   * the largest of its Keychain, database and letters present). Deleting or
   * undoing a letter never lowers it. Junk counts as 0, which is the safe side
   * (a gift, never a lock-out).
   */
  lettersKept: number;
  /** From remote config; may only raise the default. Anything else uses DEFAULT_FREE_LETTERS. */
  allowance?: unknown;
}

export type KeepLetterDecision =
  | { kind: 'allow'; via: 'plus_own' | 'free_letters'; lettersLeft?: number }
  /**
   * The Keep step needs Plus. `lapsed`: Plus was bought and has ended, so the
   * sheet says so instead of selling. This is never quiet: a quiet answer would
   * leave the person's letter neither kept nor explained. Offline and birthdays
   * change the wording only, never the answer, and the caller keeps the draft.
   */
  | { kind: 'offer'; trigger: 'keep_letter'; needsSignIn: false; lapsed: boolean };

/** Plus was bought once and is no longer on (the lapsed sheet wording). */
const LAPSED_STATES: ReadonlySet<PlanView['state']> = new Set(['expired', 'refunded', 'revoked']);

/**
 * Decide the Keep step of one letter (D-082, D-083): allowed while Plus is on
 * or fewer than the allowance of letters have ever been kept; otherwise offer
 * Plus. Pure and total. Only this step is gated: capturing, typing, drafts,
 * reading, playing, exporting and deleting never are (FreeForever).
 */
export function decideKeepLetter(input: KeepLetterInput): KeepLetterDecision {
  if (planActive(input.plan, input.now)) return { kind: 'allow', via: 'plus_own' };
  const allowance = freeLettersFrom(input.allowance);
  const kept = typeof input.lettersKept === 'number' && Number.isFinite(input.lettersKept) ? Math.max(0, Math.floor(input.lettersKept)) : 0;
  if (kept < allowance) return { kind: 'allow', via: 'free_letters', lettersLeft: allowance - kept };
  return { kind: 'offer', trigger: 'keep_letter', needsSignIn: false, lapsed: LAPSED_STATES.has(input.plan.state) };
}

/**
 * Decide the other Plus gates (backup upload, extra themes). The first
 * matching rule wins (TDD 08 2.2):
 *  1. The book has Plus (own Plus while a parent of it, or covered by the
 *     other parent).
 *  2. backup_upload from the background uploader in a Free book: quiet.
 *  3. Suppressions: first run, birthday, contributor, offline.
 *  4. Otherwise offer, asking to sign in first when signed out.
 * Throws only on a programmer error (a feature that is not gated here, or
 * keep_letter, which has decideKeepLetter); callers treat a throw as quiet.
 */
export function decide(input: DecideInput): Decision {
  const { feature, viewer, book } = input;
  if (!isGatedFeature(feature) || feature === 'keep_letter') throw new Error('decide: not a gated feature');
  const ownPlus = planActive(viewer.own, input.now);

  // Plus is per account and covers books where the holder is a parent.
  if (ownPlus && viewer.roleInBook === 'parent') return { kind: 'allow', via: 'plus_own' };
  if (book?.coveredByOtherParent) return { kind: 'allow', via: 'plus_book' };
  if (feature === 'backup_upload' && (input.initiatedBy ?? 'user') === 'background') {
    return { kind: 'quiet', reason: 'free_background' };
  }

  if (input.surface === 'first_run') return { kind: 'quiet', reason: 'first_run' };
  if (input.isBirthday) return { kind: 'quiet', reason: 'birthday' };
  // A contributor's own Plus covers only books they parent: never sell it here (R-2).
  if (viewer.roleInBook === 'contributor') return { kind: 'quiet', reason: 'contributor' };
  if (input.online === false) return { kind: 'quiet', reason: 'offline' };
  return { kind: 'offer', trigger: OFFER_FOR[feature], needsSignIn: !input.signedIn };
}

/** Convenience for callers that only need yes or no (themes render the default when not allowed). */
export function isAllowed(d: Decision | KeepLetterDecision): boolean {
  return d.kind === 'allow';
}
