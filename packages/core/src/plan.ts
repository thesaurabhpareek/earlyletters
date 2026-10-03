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
 *  - The first book is free. Children added together at first run are all
 *    free. Books joined as a co-parent never count as started.
 *  - Read together is free for N sessions per book (remote config, default
 *    3), then Plus.
 *  - Writing, reading, playing, exporting and family authorship are never
 *    gated: they are not members of GatedFeature, so a gate on them cannot
 *    compile (LEGAL-REQ-050). Nothing becomes unreadable when Plus lapses.
 */

/** Never gated. Not part of GatedFeature, so a gate on these cannot compile. */
export type FreeForever =
  | 'write'
  | 'read'
  | 'play_recording'
  | 'export'
  | 'family_authors'
  | 'invite'
  | 'download_backed_up_audio'
  | 'restore_backup'
  | 'delete';

/** The only things Plus can gate. Adding to this list is a product decision, not a code change. */
export type GatedFeature = 'start_book' | 'read_together' | 'backup_upload' | 'theme_extra';

/** Compile-time proof that no free-forever feature is gated. Breaks the build if the two ever overlap. */
type Overlap = Extract<GatedFeature, FreeForever>;
const NO_OVERLAP: [Overlap] extends [never] ? true : never = true;
void NO_OVERLAP;

export const GATED_FEATURES: readonly GatedFeature[] = ['start_book', 'read_together', 'backup_upload', 'theme_extra'];
export const FREE_FOREVER: readonly FreeForever[] = [
  'write', 'read', 'play_recording', 'export', 'family_authors', 'invite', 'download_backed_up_audio', 'restore_backup', 'delete',
];

export type OfferTrigger = 'second_child' | 'read_together' | 'backup' | 'themes' | 'chapter_complete' | 'settings';

/** Default number of free Read together sessions per Free book (remote config `read_together_free_tries`). */
export const DEFAULT_READ_TOGETHER_FREE_TRIES = 3;
/** Upper bound on the remote value, so a typo in config cannot make Plus meaningless or the check slow. */
export const MAX_READ_TOGETHER_FREE_TRIES = 100;

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
  feature: GatedFeature;
  /** First run never shows an offer (C-REQ-023, K-12). */
  surface: 'first_run' | 'normal';
  /** Any book's birthday today, local date: no offers that day (C-REQ-023). */
  isBirthday: boolean;
  signedIn: boolean;
  /** Purchases need the network; offline, an offer becomes quiet. Defaults to true. */
  online?: boolean;
  viewer: {
    /** Role in the book this gate is about; null for start_book and account-level surfaces. */
    roleInBook: 'parent' | 'contributor' | null;
    own: PlanView;
  };
  /** The book this gate is about; null for start_book. */
  book: { coveredByOtherParent: boolean } | null;
  /** Books this account started (created_by me), not deleted, hidden included. Joined books never count. See countStartedBooks. */
  startedBooks: number;
  /** This call adds children as part of the first-run batch: all free, whatever their dates. */
  inFirstRunBatch: boolean;
  readTogether?: {
    /** Read together sessions started in try mode in this book. */
    triesUsedInBook: number;
    /** From remote config; anything invalid falls back to the default. */
    freeTries?: number;
  };
  /** Who asked for a backup upload: a tap, or the background uploader. Defaults to 'user'. */
  initiatedBy?: 'user' | 'background';
}

export type Decision =
  | { kind: 'allow'; via: 'plus_own' | 'plus_book' | 'free_book' | 'first_run' | 'try'; triesLeft?: number }
  | { kind: 'offer'; trigger: OfferTrigger; needsSignIn: boolean }
  | { kind: 'quiet'; reason: 'contributor' | 'first_run' | 'birthday' | 'free_background' | 'offline' };

const OFFER_FOR: Record<GatedFeature, OfferTrigger> = {
  start_book: 'second_child',
  read_together: 'read_together',
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

/** Books that count as started: mine, not deleted; hidden ones count; joined books never do. */
export function countStartedBooks(books: ReadonlyArray<{ createdByMe: boolean; deleted: boolean }>): number {
  return books.filter((b) => b.createdByMe && !b.deleted).length;
}

/** The remote-config value for free Read together sessions, made safe. */
export function freeTriesFrom(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return DEFAULT_READ_TOGETHER_FREE_TRIES;
  return Math.min(value, MAX_READ_TOGETHER_FREE_TRIES);
}

export function isGatedFeature(f: string): f is GatedFeature {
  return (GATED_FEATURES as readonly string[]).includes(f);
}

/**
 * Decide one Plus gate. The first matching rule wins (TDD 08 2.2):
 *  1. start_book: first-run batch, else no started book, else own Plus.
 *  2. Other features: the book has Plus (own Plus while a parent of it,
 *     or covered by the other parent).
 *  3. read_together in a Free book: tries left.
 *  4. backup_upload in a Free book from the background uploader: quiet.
 *  5. Suppressions: first run, birthday, contributor, offline.
 *  6. Otherwise offer, asking to sign in first when signed out.
 * Throws only on a programmer error (a feature that is not gated); callers
 * treat a throw as quiet.
 */
export function decide(input: DecideInput): Decision {
  const { feature, viewer, book } = input;
  if (!isGatedFeature(feature)) throw new Error('decide: not a gated feature');
  const ownPlus = planActive(viewer.own, input.now);

  if (feature === 'start_book') {
    if (input.inFirstRunBatch) return { kind: 'allow', via: 'first_run' };
    if (input.startedBooks <= 0) return { kind: 'allow', via: 'free_book' };
    if (ownPlus) return { kind: 'allow', via: 'plus_own' };
  } else {
    // Plus is per account and covers books where the holder is a parent.
    if (ownPlus && viewer.roleInBook === 'parent') return { kind: 'allow', via: 'plus_own' };
    if (book?.coveredByOtherParent) return { kind: 'allow', via: 'plus_book' };

    if (feature === 'read_together') {
      const free = freeTriesFrom(input.readTogether?.freeTries ?? DEFAULT_READ_TOGETHER_FREE_TRIES);
      const used = Math.max(0, Math.floor(input.readTogether?.triesUsedInBook ?? 0));
      if (used < free) return { kind: 'allow', via: 'try', triesLeft: free - used };
    }
    if (feature === 'backup_upload' && (input.initiatedBy ?? 'user') === 'background') {
      return { kind: 'quiet', reason: 'free_background' };
    }
  }

  if (input.surface === 'first_run') return { kind: 'quiet', reason: 'first_run' };
  if (input.isBirthday) return { kind: 'quiet', reason: 'birthday' };
  // A contributor's own Plus covers only books they parent: never sell it here (R-2).
  if (feature !== 'start_book' && viewer.roleInBook === 'contributor') return { kind: 'quiet', reason: 'contributor' };
  if (input.online === false) return { kind: 'quiet', reason: 'offline' };
  return { kind: 'offer', trigger: OFFER_FOR[feature], needsSignIn: !input.signedIn };
}

/** Convenience for callers that only need yes or no (themes render the default when not allowed). */
export function isAllowed(d: Decision): boolean {
  return d.kind === 'allow';
}
