/**
 * The letter ledger, pure part (D-082, D-083; debate Q-013 section 3, option B).
 *
 * One never-decreasing whole number: how many letters this account has ever
 * kept. It is the only thing the free-letter limit looks at, so deleting a
 * letter, undoing a delete, restoring from Recently deleted, editing or moving
 * a letter between the Book and private never change it. No identifier, no
 * timestamp, no content, no device id (that would edge toward fingerprinting).
 *
 * Three places hold it, and the gate uses the LARGEST of them:
 *   1. the Keychain (survives deleting and reinstalling the app on one phone;
 *      this-device-only, never in a backup);
 *   2. the database mirror, settings key `letters.keptEver` (comes back with an
 *      iCloud or device backup restore);
 *   3. the letters present in the database (a restored database still shows its
 *      letters even if both counters are gone).
 * Every way a source can be lost errs on the safe side: the person gets a
 * gift, never a lock-out. Apple does not guarantee Keychain items survive app
 * deletion; that is accepted (Q-013 section 3).
 *
 * No React Native here: unit-tested in test/billing-ledger.test.ts.
 */

/** Device settings key for the database mirror. */
export const LEDGER_SETTING_KEY = 'letters.keptEver';
/** Keychain item name (expo-secure-store keys allow letters, digits, '.', '-', '_'). */
export const LEDGER_KEYCHAIN_KEY = 'earlyletters.letters.keptEver';

/** How many of the most recent letter ids the mirror remembers, so recording one id twice counts once. */
export const RECENT_IDS_KEPT = 25;

export interface LedgerState {
  /** Letters ever kept. Never goes down. */
  n: number;
  /** The most recent counted letter ids, oldest first, at most RECENT_IDS_KEPT. */
  recent: string[];
}

export const EMPTY_LEDGER: LedgerState = { n: 0, recent: [] };

const VERSION = 1;

/** A count made safe: whole, finite, not negative. Anything else is 0. */
export function safeCount(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

/** Reads a stored ledger (either source). Junk, an unknown version or null all read as empty. Never throws. */
export function parseLedger(raw: string | null | undefined): LedgerState {
  if (!raw) return EMPTY_LEDGER;
  try {
    const o = JSON.parse(raw) as { v?: unknown; n?: unknown; recent?: unknown };
    if (!o || typeof o !== 'object' || o.v !== VERSION) return EMPTY_LEDGER;
    const recent = Array.isArray(o.recent) ? o.recent.filter((x): x is string => typeof x === 'string').slice(-RECENT_IDS_KEPT) : [];
    return { n: safeCount(o.n), recent };
  } catch {
    return EMPTY_LEDGER;
  }
}

export function serializeLedger(s: LedgerState): string {
  return JSON.stringify({ v: VERSION, n: safeCount(s.n), recent: s.recent.slice(-RECENT_IDS_KEPT) });
}

/** The Keychain holds only the number. */
export function serializeKeychain(n: number): string {
  return JSON.stringify({ v: VERSION, n: safeCount(n) });
}

/** What the gate counts: the largest of the three sources. */
export function lettersKeptFrom(sources: { keychain: number; database: number; present: number }): number {
  return Math.max(safeCount(sources.keychain), safeCount(sources.database), safeCount(sources.present));
}

/**
 * Counts one kept letter. Idempotent per letter id: an id already in the
 * recent list changes nothing. The new count is never below what any source
 * already knew, so a restored database or a surviving Keychain can only raise it:
 *   n' = max(n + 1, floor + 1, present)
 * where `present` already includes this letter (it is saved first) and `floor`
 * is the largest count known outside this database (the Keychain).
 */
export function applyKept(state: LedgerState, id: string, ctx: { floor: number; present: number }): LedgerState {
  if (state.recent.includes(id)) return state;
  const n = Math.max(state.n + 1, safeCount(ctx.floor) + 1, safeCount(ctx.present));
  return { n, recent: [...state.recent, id].slice(-RECENT_IDS_KEPT) };
}

/** Raises a count to at least `n`, never lowers it. */
export function raised(state: LedgerState, n: number): LedgerState {
  return safeCount(n) > state.n ? { ...state, n: safeCount(n) } : state;
}
