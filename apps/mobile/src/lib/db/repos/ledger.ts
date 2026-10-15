/**
 * The database side of the letter ledger (D-082, D-083): the mirror in
 * settings key `letters.keptEver`, and the count of letters present. Pure
 * functions over a SqlDb like every repository; the Keychain side and the max
 * rule live in lib/billing/letter-ledger.ts. Rules and the three sources are
 * described in lib/billing/letter-ledger.logic.ts.
 */
import {
  applyKept,
  LEDGER_SETTING_KEY,
  parseLedger,
  raised,
  serializeLedger,
  type LedgerState,
} from '../../billing/letter-ledger.logic';
import { syncOwner } from '../../sync/outbox';
import type { RepoContext } from './context';
import * as settings from './settings';

export function readState(ctx: RepoContext): LedgerState {
  return parseLedger(settings.getSetting(ctx, LEDGER_SETTING_KEY));
}

/**
 * Letters present in the database: every kept letter, spoken or typed, in the
 * Book or private, including ones in the delete window. A quiet-day mark
 * (`not_much`) and drafts are not letters.
 *
 * Counts every author and letters without words. Kept for the existing
 * callers' tests; the ledger floor is countOwnKeptWithWords (M17).
 */
export function countPresent({ db }: RepoContext): number {
  return db.get<{ n: number }>("SELECT COUNT(*) AS n FROM entries WHERE kind = 'letter'")?.n ?? 0;
}

/**
 * M17 (founder, 13 Oct; F14-REQ-036): letters this person has kept, the floor
 * the ledger heals to. Counts a row only when all hold:
 * - it is a letter (`kind = 'letter'`; notes, quiet-day marks and drafts never count);
 * - this person is its author: `author_id` equals `personId`, or is null (made on
 *   this phone before any sign-in; the first sign-in stamps them, sync/ownership.ts).
 *   With `personId` null (local-only install) only rows with no author count.
 *   Another author's synced letters never count, whatever this phone holds;
 * - its words exist: not waiting for its words, and `final_text` is not blank.
 * Letters in the delete window still count (deleting never gives a letter back, D-083).
 *
 * "Kept from Review" (the words were on screen at the Save) is decided at the
 * call that counts a Keep, not here: this is the count of letters present that
 * could have been, used as a floor so a restore or reinstall never lowers the ledger.
 */
export function countOwnKeptWithWords({ db }: RepoContext, personId: string | null): number {
  return (
    db.get<{ n: number }>(
      `SELECT COUNT(*) AS n FROM entries
        WHERE kind = 'letter'
          AND (author_id IS NULL OR author_id = ?)
          AND transcript_status IS NULL
          AND TRIM(final_text) <> ''`,
      personId ?? null,
    )?.n ?? 0
  );
}

/** M17 count for this phone's owner (sync.ownerId, set at the first sign-in; null before it). */
export function countOwnPresent(ctx: RepoContext): number {
  return countOwnKeptWithWords(ctx, syncOwner(ctx.db));
}

/**
 * Counts one kept letter, inside the caller's transaction (the letter is
 * already written, so `present` includes it when its words exist). Idempotent
 * per id. The floor is this person's own letters with words (M17), never
 * another author's rows.
 */
export function recordKept(ctx: RepoContext, id: string, floor: number): LedgerState {
  const before = readState(ctx);
  const after = applyKept(before, id, { floor, present: countOwnPresent(ctx) });
  if (after !== before) settings.setSetting(ctx, LEDGER_SETTING_KEY, serializeLedger(after));
  return after;
}

/** Raises the mirror to at least `n` (after a reinstall found a higher Keychain count, or letters were restored). */
export function raiseTo(ctx: RepoContext, n: number): LedgerState {
  const before = readState(ctx);
  const after = raised(before, n);
  if (after !== before) settings.setSetting(ctx, LEDGER_SETTING_KEY, serializeLedger(after));
  return after;
}

/** Erase everything: removes the mirror. */
export function clear(ctx: RepoContext): void {
  settings.deleteSetting(ctx, LEDGER_SETTING_KEY);
}
