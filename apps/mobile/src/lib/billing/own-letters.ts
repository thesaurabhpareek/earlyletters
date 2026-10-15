/**
 * The M17 rule for the letter ledger (founder, 13 Oct 2026; WP-F14-20; F14-REQ-023, -036, -037).
 *
 * Free letters count your OWN letters, once their words exist and you have seen them:
 *  - the other parent's synced letters never count, and never raise the mirror or the Keychain;
 *  - a voice-only letter (no words yet) never counts and never opens the Keep sheet; it counts at
 *    the Save where its words, transcribed or typed, are on screen in Review;
 *  - the ledger stays never-decreasing.
 *
 * The ledger's third source ("letters present", letter-ledger.logic.ts) is where another author's
 * rows could heal the count upward. It comes from this adapter once it is configured, never from
 * the raw count of every letter on the phone. The query itself belongs to the local database
 * (db/repos/ledger.ts, stream S03); this file only names the contract, so the ledger is tested
 * against a fake (own-letters.test.ts).
 *
 * No React Native here.
 */

/** Who is asking: the signed-in profile id, or null on a phone that has not signed in. */
export interface LedgerViewer {
  profileId: string | null;
}

/**
 * The query the ledger needs from the local database (request to S03, R2 AR-04).
 *
 * Returns the number of rows in `entries` that are:
 *  - `kind = 'letter'` (quiet-day marks and drafts are not letters);
 *  - this person's: `author_id = viewer.profileId`, or `author_id IS NULL` (made on this phone
 *    before sign-in and not yet re-owned). With `viewer.profileId === null`, only `author_id IS NULL`;
 *  - with words: `transcript_status` is not `'waiting'` and `final_text` is not empty;
 *  - present or in the delete window (Recently deleted counts; a purged row is gone).
 * Synchronous, like the other repository reads. Throws if the store cannot open (the ledger
 * treats that as 0, the safe side).
 */
export interface OwnLettersQuery {
  countOwnLettersWithWords(viewer: LedgerViewer): number;
}

/** What a Keep is about to save, for the M17 counting rule. */
export interface KeepFacts {
  /** 'letter' or a quiet-day mark ('not_much'). */
  kind: string;
  /** The letter's words are on screen in Review at this Save (spoken words reviewed, or typed words). */
  wordsOnScreen: boolean;
  /** The letter's author: the signed-in profile id, or null for a letter made on this phone before sign-in. */
  authorId: string | null;
  viewer: LedgerViewer;
}

/**
 * Does this Save count toward the free letters (M17)? Only a letter, of this person's own, with its
 * words on screen. The same answer decides whether the Keep gate may open: a Save that does not
 * count never shows the Keep sheet (F14-REQ-037).
 */
export function countsAtKeep(f: KeepFacts): boolean {
  if (f.kind !== 'letter') return false;
  if (!f.wordsOnScreen) return false;
  return isOwn(f.authorId, f.viewer);
}

/** A row is this person's: their profile id, or no author yet (made here before sign-in). */
export function isOwn(authorId: string | null | undefined, viewer: LedgerViewer): boolean {
  if (authorId === null || authorId === undefined) return true;
  return viewer.profileId !== null && authorId === viewer.profileId;
}
