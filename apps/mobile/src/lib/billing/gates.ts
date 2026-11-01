/**
 * Plus gates on this phone, built on packages/core (plan.ts).
 *
 * Membership (D-082, D-083): the Keep step of a letter is the one gate. The
 * first 2 letters kept are free (one pool across every book); after that,
 * keeping another needs Plus. Starting a book and Read together are free.
 * Capturing, typing, drafts, reading, playing, exporting and deleting are never
 * gated: the gate runs at Keep, after the recording is on disk and hashed, so a
 * held letter is never lost.
 */
import { decideKeepLetter, freeLettersFrom, type KeepLetterDecision } from '@scribe/core';
import { ledgerDb, listChildren, listHiddenChildren, type Child } from '../store';
import { clearLedger, lettersKept, mirrorLedger, syncLedger } from './letter-ledger';
import { hasWords } from './letter-ledger.logic';
import { getPlan, planReadiness, type PlanReadiness } from './plan-store';
import { isJoinedBook as joined, plusOn, type BookFacts } from './plan.logic';

/**
 * Sync (sync_books `created_by_me`, `role`) adds where a book came from. Until
 * it does, every book on this phone was started here.
 */
type ChildOrigin = Child & { createdByMe?: boolean; role?: 'parent' | 'contributor' };

export function bookFactsOf(child: Child): BookFacts {
  const c = child as ChildOrigin;
  const facts: BookFacts = { birthday: c.birthday };
  if (typeof c.createdByMe === 'boolean') facts.createdByMe = c.createdByMe;
  if (c.role === 'parent' || c.role === 'contributor') facts.role = c.role;
  return facts;
}

/** Every book on this phone, hidden ones included. */
export function allBookFacts(): BookFacts[] {
  return [...listChildren(), ...listHiddenChildren()].map(bookFactsOf);
}

/** Plus is on right now on this phone. */
export function hasPlus(): boolean {
  return plusOn(getPlan(), new Date().toISOString());
}

/** A book this person joined as co-parent. */
export function isJoinedBook(child: Child): boolean {
  return joined(bookFactsOf(child));
}

/**
 * Where the free-letter allowance comes from. Remote config may only raise the
 * reviewed 2 (packages/api `effectiveFreeLetters`); until the root layout wires
 * it, and whenever it throws, the default applies.
 */
let remoteAllowance: () => unknown = () => undefined;

export function setFreeLettersAllowanceSource(source: () => unknown): void {
  remoteAllowance = source;
}

function allowanceNow(): unknown {
  try {
    return remoteAllowance();
  } catch {
    return undefined;
  }
}

/** Free letters per account right now (default 2; remote config may only raise it). */
export function freeLettersAllowance(): number {
  return freeLettersFrom(allowanceNow());
}

/**
 * How long the Keep gate waits for the first StoreKit read of this process before it decides from the cached
 * snapshot (RT-PAY-17). Short: after launch the read has almost always landed, and the wait only runs until it does.
 */
export const KEEP_PLAN_WAIT_MS = 1000;

/**
 * The Keep step's answer: packages/core's decision, or `hold` when keeping would need Plus but the phone does not
 * know yet whether this person has it (no StoreKit read and no cached snapshot, RT-PAY-17). On `hold` the letter is
 * held exactly as it is and no Plus sheet opens: a payer is never shown "needs Plus" before Apple has answered.
 */
export type KeepGateDecision = KeepLetterDecision | { kind: 'hold'; reason: 'plan_unread' };

export interface KeepGate {
  decision: KeepGateDecision;
  /** Letters ever kept on this account (the largest of Keychain, database and letters present). */
  lettersKept: number;
  allowance: number;
}

async function readiness(): Promise<PlanReadiness> {
  try {
    return await planReadiness(KEEP_PLAN_WAIT_MS);
  } catch {
    return 'none';
  }
}

/**
 * The decision under keepGateFor, which Review calls (M17: only with words on
 * screen). Call it after the recording is hashed and BEFORE saving. It also
 * heals the ledger (a reinstall or a backup restore). It first waits, briefly,
 * for the first StoreKit read (RT-PAY-17); on timeout it decides from the
 * cached snapshot. On `offer`, the caller opens the Keep sheet and returns
 * WITHOUT saving: the draft stays exactly where it is. On `hold` (no read and
 * no snapshot), the caller holds the letter and opens no sheet. Never throws;
 * an unreadable ledger counts as 0, the safe side.
 */
export async function keepLetterGate(now: Date = new Date()): Promise<KeepGate> {
  const allowance = freeLettersAllowance();
  const ready = readiness(); // runs while the ledger heals
  let n = 0;
  try {
    n = await syncLedger(ledgerDb());
  } catch {
    n = 0;
  }
  const read = await ready;
  const decision = decideKeepLetter({ now: now.toISOString(), plan: getPlan().view, lettersKept: n, allowance: allowanceNow() });
  if (decision.kind === 'offer' && read === 'none') return { decision: { kind: 'hold', reason: 'plan_unread' }, lettersKept: n, allowance };
  return { decision, lettersKept: n, allowance };
}

/**
 * The gate for one save from Review under M17 (D-103; F14-REQ-037, F14-REQ-038; WP-F14-20).
 * A letter counts, and the Keep sheet can open, only at a save where the letter's words are
 * on screen. Saving a recording with no words (the speech model is not on the phone yet,
 * nobody spoke, or the words are still coming) or text of marks only ("...") never reads the
 * ledger and never opens the sheet: it answers null, and the caller saves at once. The ledger
 * (db/repos/ledger.ts: COUNTED_LETTERS_SQL, then the same hasWords rule) does not count that
 * save either; the letter counts later, at the save where its words are first on screen.
 *
 * Call it after the recording is hashed and BEFORE saving. `wordsOnScreen` is the text the
 * person sees in Review at that moment (`finalText`, typed or transcribed). No words means no
 * letter or digit in any script (hasWords): empty, blank or marks only.
 */
export async function keepGateFor(save: { wordsOnScreen: string | null | undefined }, now: Date = new Date()): Promise<KeepGate | null> {
  if (!hasWords(save.wordsOnScreen)) return null;
  return keepLetterGate(now);
}

/** Words count as on screen when there is at least one letter or digit in any script (the ledger's rule too). */
export { hasWords };

/** Letters kept so far, for the Plan screen and analytics. 0 when the store cannot be read. */
export async function lettersKeptNow(): Promise<number> {
  try {
    return await lettersKept(ledgerDb());
  } catch {
    return 0;
  }
}

/** After a letter was kept (the transaction committed): copy the count to the Keychain. Never throws. */
export async function afterLetterKept(): Promise<number> {
  try {
    return await mirrorLedger(ledgerDb());
  } catch {
    return 0;
  }
}

/**
 * Erase everything (D-083): the free count starts again, because the person asked for
 * deletion. Removes the Keychain item and the database mirror. Never throws.
 */
export async function eraseLetterLedger(): Promise<void> {
  try {
    await clearLedger(ledgerDb());
  } catch {
    // Nothing to clear.
  }
}

/** At launch: make the Keychain and the database mirror agree (a reinstall or a backup restore). Never throws. */
export async function startLetterLedger(): Promise<void> {
  try {
    await syncLedger(ledgerDb());
  } catch {
    // Store not open yet; the gate heals it before it decides.
  }
}
