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
 * v1.0 is on-device and single-author, so every row is this person's. When
 * family letters can reach this phone (v1.1), restrict this to the account's
 * own letters.
 */
export function countPresent({ db }: RepoContext): number {
  return db.get<{ n: number }>("SELECT COUNT(*) AS n FROM entries WHERE kind = 'letter'")?.n ?? 0;
}

/**
 * Counts one kept letter, inside the caller's transaction (the letter is
 * already written, so `present` includes it). Idempotent per id.
 */
export function recordKept(ctx: RepoContext, id: string, floor: number): LedgerState {
  const before = readState(ctx);
  const after = applyKept(before, id, { floor, present: countPresent(ctx) });
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
