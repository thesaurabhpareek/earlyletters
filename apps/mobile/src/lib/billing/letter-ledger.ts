/**
 * The letter ledger on this phone (D-082, D-083): Keychain side, the max rule,
 * and the calls the rest of the app uses. The rules and the three sources are in
 * letter-ledger.logic.ts; the database side is db/repos/ledger.ts.
 *
 *   lettersKept(db)        largest of Keychain, database mirror and letters present (the gate's number)
 *   syncLedger(db)         at launch: raise every copy to the largest, so a reinstall or a backup restore heals
 *   mirrorLedger(db)       after a letter is kept: copy the database count to the Keychain
 *   keychainFloor()        the Keychain count last seen, for the in-transaction count (store.ts)
 *   clearLedger(db)        Erase everything: removes the Keychain item and the database mirror
 *
 * Counting itself (`recordLetterKept`) happens inside the save transaction in
 * store.ts `saveLetterFromDraft`, through db/repos/ledger.ts, so a letter and
 * its count are written together or not at all.
 *
 * This file imports no React Native: the Keychain is passed in
 * (`configureLedgerStorage`, wired in letter-ledger.native.ts), so the logic is
 * unit-tested in Node. With no storage configured (web preview, tests) the
 * ledger runs on the database alone, which is the safe side.
 *
 * Never stored: a device id, a hash, a timestamp of installs, anything about a
 * letter. The Keychain item is `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, no iCloud
 * sync (see lib/supabase/secure-storage.ts).
 */
import { LEDGER_KEYCHAIN_KEY, lettersKeptFrom, parseLedger, safeCount, serializeKeychain } from './letter-ledger.logic';

export interface LedgerStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** The database side, supplied by store.ts (so this file never imports the store). */
export interface LedgerDb {
  /** Mirror count and letters present. Throws if the store cannot open (callers treat that as 0). */
  counts(): { recorded: number; present: number };
  /** Raise the mirror to at least n. */
  raiseTo(n: number): void;
  /** Remove the mirror. */
  clear(): void;
}

let storage: LedgerStorage | null = null;
/** The Keychain count last read or written in this process. Lets the save transaction (sync) see it. */
let floor = 0;

export function configureLedgerStorage(s: LedgerStorage | null): void {
  storage = s;
  floor = 0;
}

/** The Keychain count last seen in this process (0 until read). */
export function keychainFloor(): number {
  return floor;
}

/** Reads the Keychain count. A missing item, an unreadable one or no Keychain all read as 0. Never throws. */
export async function readKeychainCount(): Promise<number> {
  if (!storage) return floor;
  try {
    const n = parseLedger(await storage.getItem(LEDGER_KEYCHAIN_KEY)).n;
    floor = Math.max(floor, n);
    return n;
  } catch {
    return floor;
  }
}

/** Raises the Keychain count to at least n. Best effort: a failed write is repaired by the next launch's syncLedger. */
export async function raiseKeychainCount(n: number): Promise<void> {
  const target = safeCount(n);
  floor = Math.max(floor, target);
  if (!storage) return;
  try {
    const current = parseLedger(await storage.getItem(LEDGER_KEYCHAIN_KEY)).n;
    if (target > current) await storage.setItem(LEDGER_KEYCHAIN_KEY, serializeKeychain(target));
  } catch {
    // The database mirror still holds the number.
  }
}

function dbCounts(db: LedgerDb): { recorded: number; present: number } {
  try {
    return db.counts();
  } catch {
    return { recorded: 0, present: 0 };
  }
}

/** Letters this account has ever kept: the largest of the three sources. Never lower than what any one knew. */
export async function lettersKept(db: LedgerDb): Promise<number> {
  const keychain = await readKeychainCount();
  const { recorded, present } = dbCounts(db);
  return lettersKeptFrom({ keychain, database: recorded, present });
}

/**
 * At launch (and before the gate decides): make every copy equal to the
 * largest. A reinstall (Keychain survived, database empty) raises the mirror;
 * a backup restore (database back, Keychain gone) raises the Keychain.
 */
export async function syncLedger(db: LedgerDb): Promise<number> {
  const n = await lettersKept(db);
  try {
    db.raiseTo(n);
  } catch {
    // Store not open: the gate still uses the max of what it can read.
  }
  await raiseKeychainCount(n);
  return n;
}

/** After a letter is kept (the transaction committed): copy the count to the Keychain. */
export async function mirrorLedger(db: LedgerDb): Promise<number> {
  return syncLedger(db);
}

/** Erase everything (D-083): the free count starts again, because the person asked for deletion. */
export async function clearLedger(db: LedgerDb): Promise<void> {
  floor = 0;
  try {
    db.clear();
  } catch {
    // Nothing to clear.
  }
  if (!storage) return;
  try {
    await storage.removeItem(LEDGER_KEYCHAIN_KEY);
  } catch {
    // A Keychain that cannot be cleared cannot be read either.
  }
}
