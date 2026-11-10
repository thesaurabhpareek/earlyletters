/**
 * A signed-in phone with no book, on an account that has one: "Opening your book" (NX-36-S17 Tier 0; spec
 * docs/design/specs/S17-NEW-PHONE-SPEC-10nov.md sections 2.1 to 2.3 and gap G1; Karma's ruling on D5: the screen ends when
 * the book is on the phone AND the first pull cycle is done, or at 10 seconds). Pure, no React Native, tested in Node
 * (test/new-phone-route.test.ts). Reads nothing, sends nothing, records nothing; `use-new-phone.ts` holds the clock and
 * the one `readAccountBooks` call, and `onboarding.tsx` draws the screens.
 *
 * Why it exists (F7): the only thing that creates the local book on a second phone is the first pull. Until it lands,
 * `firstRunGate` used to answer `childStep`, so "Who is this book for?" could be shown to a parent whose account already
 * has a book, and a second book could be made. A phone with a session and no book now never reaches the child step
 * until the account has said it has no book.
 *
 * Nothing here counts, names a child or carries a letter's words. The result is a view name, never stored.
 */
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
 */
export type OpeningView = 'opening' | 'slow' | 'offline' | 'arrived' | 'new' | 'noBook';

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
  if (i.kind === 'unknown') return i.online ? 'noBook' : 'offline';

  // Still asking, or the account has a book.
  if (i.kind === 'hasBook' && i.hasLocalBook) {
    return firstCycleDone(i) || i.elapsedMs >= OPENING_WAIT_MS ? 'arrived' : 'opening';
  }
  if (!i.online) return 'offline';
  if (i.kind === 'hasBook' && (STALLED_PHASES.has(i.syncPhase) || i.elapsedMs >= OPENING_WAIT_MS)) return 'slow';
  return 'opening';
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
