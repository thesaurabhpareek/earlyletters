/**
 * A signed-in phone with no book, on an account that has one: "Opening your book" (NX-36-S17 Tier 0; spec
 * docs/design/specs/S17-NEW-PHONE-SPEC-10nov.md sections 2.1 to 2.3 and gap G1; D5 as ruled: the screen ends when the
 * book is on the phone AND the first pull cycle is done, or at 10 seconds). Pure, no React Native, tested in Node
 * (test/new-phone-route.test.ts). Reads nothing, sends nothing, records nothing; `use-new-phone.ts` holds the clock and
 * the one `readAccountBooks` call (account-books.ts, the same reader the consent sheet uses), and `onboarding.tsx` draws
 * the screens.
 *
 * Why it exists (F7): the only thing that creates the local book on a second phone is the first pull. Until it lands,
 * `firstRunGate` used to answer `childStep`, so "Who is this book for?" could be shown to a parent whose account already
 * has a book, and a second book could be made. A phone with a session and no book now never reaches the child step
 * until the account has said it has no book.
 *
 * Nothing here counts, names a child or carries a letter's words. The result is a view name, never stored.
 */
import { authCopy } from '@scribe/content';
import type { AuthMethod } from '@/lib/auth/machine.logic';
import type { AccountKind } from './account-books.logic';
import { ACCOUNT_BOOKS_WAIT_MS } from './account-books.logic';
import type { SyncPhase } from '@/lib/sync/types';

/** State A ends at this at the latest: the PRD budget for "book list and child visible after sign-in" and the session gate's own timeout. */
export const OPENING_WAIT_MS = ACCOUNT_BOOKS_WAIT_MS;

/**
 * What the route shows for a signed-in phone with no book (or one that has just got it):
 *  - `opening`  state A, the loading screen
 *  - `slow`     state C, "Your book is taking a while."
 *  - `offline`  state D, "Opening your book needs a connection."
 *  - `arrived`  state B, leave for Tonight
 *  - `new`      the account has never made a book: the child step
 *  - `noBook`   a returning account with no book, or an answer that could not be read: "No book here yet"
 *  - `consent`  consent is still to give (`needsConsent`), so the account cannot be asked and no book can arrive: the held
 *               screen (BL-922a, NS-10-R0). Never produced by `openingView`; only `heldNewPhoneView` answers it.
 */
export type OpeningView = 'opening' | 'slow' | 'offline' | 'arrived' | 'new' | 'noBook' | 'consent';

/** Engine phases that mean the pull cannot run right now, while the phone has a connection: state C at once. */
const STALLED_PHASES: ReadonlySet<SyncPhase> = new Set<SyncPhase>(['auth', 'paused_server', 'offline']);

export interface OpeningInput {
  /** What `sync_books` said; null while the question is still being asked. */
  kind: AccountKind | null;
  /** The phone lists a book now. */
  hasLocalBook: boolean;
  /** The OS's view of the connection. */
  online: boolean;
  /** `SyncStatus.phase` and `.lastSyncedAt` from the sync engine (no engine change is needed). */
  syncPhase: SyncPhase;
  lastSyncedAt: string | null;
  /** `lastSyncedAt` as it was when this wait began, so an old stamp is never read as "the first cycle is done". */
  lastSyncedAtAtStart: string | null;
  /** Milliseconds since this wait began. */
  elapsedMs: number;
}

/** The first pull cycle is done: the engine is not syncing and has finished a cycle since this wait began. */
export function firstCycleDone(i: Pick<OpeningInput, 'syncPhase' | 'lastSyncedAt' | 'lastSyncedAtAtStart'>): boolean {
  return i.syncPhase !== 'syncing' && i.lastSyncedAt !== null && i.lastSyncedAt !== i.lastSyncedAtAtStart;
}

export function openingView(i: OpeningInput): OpeningView {
  if (i.kind === 'new') return 'new';
  if (i.kind === 'returningNoBook') return 'noBook';

  // The book is on the phone. Only the pull could have brought it (the child step is unreachable from here), so it is
  // the account's, whatever the account question is still doing: hold the loading screen until the first cycle is done
  // or 10 seconds have passed, and never show the connection screen or "No book here yet" over a book that is here.
  if (i.hasLocalBook) return firstCycleDone(i) || i.elapsedMs >= OPENING_WAIT_MS ? 'arrived' : 'opening';

  // R11 (BL-978a): a lost answer is not "no book". With a connection it reads as `opening` until the 10 seconds are used up
  // (the hook re-asks once inside the window); only then is it "No book here yet", the fail-safe direction.
  if (i.kind === 'unknown' && i.online) return i.elapsedMs >= OPENING_WAIT_MS ? 'noBook' : 'opening';
  if (!i.online) return 'offline';
  // 10 seconds with no book on the phone, whatever the account has said so far (the account question itself is bounded
  // at the same 10 seconds, so a late answer never leaves the loading screen up).
  if (i.elapsedMs >= OPENING_WAIT_MS) return 'slow';
  if (i.kind === 'hasBook' && STALLED_PHASES.has(i.syncPhase)) return 'slow';
  return 'opening';
}

/**
 * R12 (NS-10, BL-978a): the one line that names HOW this phone is signed in, for a parent who finds the wrong account on a
 * shared screen. The method only, never the address (a shared phone may show it to the other person). Reuses
 * `auth.account.signedInWith.*` (no new words). Null when the method is not known. Pure; reads nothing.
 */
export function methodLine(method: AuthMethod | null): string | null {
  if (method === null) return null;
  const w = authCopy.account.signedInWith;
  return method === 'apple' ? w.apple : method === 'google' ? w.google : method === 'email' ? w.email : w.other;
}

/**
 * Whether the connection returning asks the account again (the S3 rule): only while the answer may still change (none
 * yet, unreadable, or a book that has not arrived). A clear "new" has put the person on the child step, and a returning
 * account with no book is on "No book here yet": neither is swapped for the loading screen by a passing reconnect.
 */
export function retriesOnReconnect(kind: AccountKind | null): boolean {
  return kind === null || kind === 'unknown' || kind === 'hasBook';
}

/** The setting that carries the arrival line between the end of state A and the first Book. Phone-local, holds no name, date or text. */
export const ARRIVAL_SETTING = 'newPhone.arrival';
const PENDING = 'pending';
const SHOWN = 'shown';

/** What to write when state A ends in `arrived`: the line is owed once, and never owed again after it was shown. */
export function arrivalToWrite(current: string | null): typeof PENDING | null {
  return current === null ? PENDING : null;
}

/** The first Book view after arrival shows the line; every other Book view does not. */
export function arrivalLineOwed(current: string | null): boolean {
  return current === PENDING;
}

/** Written when the Book that showed the line is left. */
export const ARRIVAL_SHOWN = SHOWN;

/**
 * NS-10-R13 (BL-1865): a new phone with backup off shows one line at the top of the Book until the person dismisses it,
 * and no per-letter warning. Phone-local like the arrival line; holds no name, date or text.
 */
export const BACKUP_LINE_SETTING = 'newPhone.backupLine';
const BACKUP_LINE_DISMISSED = 'dismissed';

/** What to write when state A ends in `arrived`: owed only while backup is off, and never again once decided. */
export function backupLineToWrite(current: string | null, backupOn: boolean): typeof PENDING | null {
  return current === null && !backupOn ? PENDING : null;
}

/** The line is shown on every Book view until it is dismissed. */
export function backupLineOwed(current: string | null): boolean {
  return current === PENDING;
}

/** Written when the person dismisses the line. */
export const BACKUP_LINE_DONE = BACKUP_LINE_DISMISSED;
