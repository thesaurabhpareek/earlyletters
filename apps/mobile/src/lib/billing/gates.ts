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
import { currentAuthUserId } from '../auth/auth-store';
import { clearLedger, configureOwnLetters, lettersKept, mirrorLedger, syncLedger } from './letter-ledger';
import type { LedgerViewer, OwnLettersQuery } from './own-letters';
import { getPlan } from './plan-store';
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

export interface KeepGate {
  decision: KeepLetterDecision;
  /** Letters ever kept on this account (the largest of Keychain, database and letters present). */
  lettersKept: number;
  allowance: number;
  /**
   * Whether this Save counts toward the free letters (M17): true only with the letter's words on
   * screen. A Save that does not count never reads the ledger and is always allowed, so the Keep
   * sheet cannot open on it (F14-REQ-037).
   */
  counts: boolean;
}

/** The person the ledger counts for: the signed-in profile, or null before sign-in. */
export function ledgerViewer(): LedgerViewer {
  try {
    return { profileId: currentAuthUserId() };
  } catch {
    return { profileId: null };
  }
}

/**
 * Wire the M17 own-letters query from the local database (S03's `countOwnLettersWithWords`, see
 * own-letters.ts for the exact contract). From then on, letters by another author never count and
 * never raise the mirror or the Keychain (F14-REQ-036). Call once when the store opens.
 */
export function configureOwnLettersQuery(query: OwnLettersQuery | null): void {
  configureOwnLetters(query, ledgerViewer);
}

export interface KeepGateOptions {
  /**
   * The letter's words are on screen in Review at this Save (spoken words reviewed, or typed words).
   * false for "Save the recording" of a voice-only letter: it does not count and never gates (M17).
   * Defaults to true, so existing callers keep today's behaviour.
   */
  wordsOnScreen?: boolean;
}

/**
 * The gate for the Keep buttons in Review (spoken, typed, or voice kept without
 * words). Call it after the recording is hashed and BEFORE saving. It also
 * heals the ledger (a reinstall or a backup restore). On `offer`, the caller
 * opens the Keep sheet and returns WITHOUT saving: the draft stays exactly
 * where it is. Never throws; an unreadable ledger counts as 0, the safe side.
 */
export async function keepLetterGate(now: Date = new Date(), options: KeepGateOptions = {}): Promise<KeepGate> {
  const allowance = freeLettersAllowance();
  if (options.wordsOnScreen === false) {
    // M17: a voice-only Save never reads the ledger, never counts and never opens the Keep sheet.
    const plus = plusOn(getPlan(), now.toISOString());
    return { decision: { kind: 'allow', via: plus ? 'plus_own' : 'free_letters' }, lettersKept: 0, allowance, counts: false };
  }
  let n = 0;
  try {
    n = await syncLedger(ledgerDb());
  } catch {
    n = 0;
  }
  const decision = decideKeepLetter({ now: now.toISOString(), plan: getPlan().view, lettersKept: n, allowance: allowanceNow() });
  return { decision, lettersKept: n, allowance, counts: true };
}

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
