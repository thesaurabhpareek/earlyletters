/**
 * What is kept when a phone that holds a local-start book later signs in (NX-36 4.2; F02-REQ-019; NX-31 R18, R27).
 * PROPOSED rule (`product` and counsel to confirm): a data model and nothing else. No screen, no storage, no network.
 *
 *  1. Nothing moves at sign-in. The sensitive-data consent comes first; declining keeps the local book as it is, signed
 *     in, with sync off.
 *  2. After consent, the claim screen shows the masked address. Nothing is uploaded before "Keep in this account".
 *     "Not my account" ends the session and leaves the phone as it was.
 *  3. The account has no book: the local book becomes the account's book.
 *  4. The account has a book and the local book has no kept letters: the account's book opens; the empty local book is
 *     removed, and the claim screen says so in one sentence.
 *  5. The account has a book and the local book has kept letters: the person chooses "In the existing book"
 *     (`existing`) or "As a second book" (`new`). Neither deletes anything; a letter already in the account is not
 *     added twice.
 *  6. Recordings stay on this phone (backup is off); the words travel.
 */
export type MergeConsent = 'pending' | 'declined' | 'accepted';
export type MergeClaim = 'pending' | 'notMine' | 'keep';
export type MergeDestination = 'existing' | 'new';

export interface MergeBackInput {
  consent: MergeConsent;
  claim: MergeClaim;
  accountHasBook: boolean;
  /** Kept letters in the local book. */
  localKeptLetters: number;
  /** The person's choice in step 5; null until made. */
  destination: MergeDestination | null;
}

export type MergePhase =
  | 'askConsent'
  | 'keepOnPhone'
  | 'askClaim'
  | 'endSession'
  | 'becomeAccountBook'
  | 'openAccountBook'
  | 'askDestination'
  | 'moveLetters';

export interface MergeBackResult {
  phase: MergePhase;
  /** Letters' words may be sent to the account. True only after consent accepted and "Keep in this account". */
  uploads: boolean;
  syncOn: boolean;
  endsSession: boolean;
  /** Only the empty local book, only beside an account book (step 4). */
  removesLocalBook: boolean;
  saysEmptyBookRemoved: boolean;
  /** No outcome deletes a letter. */
  deletesLetters: false;
  /** Recordings stay on the phone while backup is off. */
  recordingsLeavePhone: false;
  destination: MergeDestination | null;
  /** A letter already in the account's book is not added twice (the sync layer's job, UNVERIFIED). */
  dedupeByLetterId: boolean;
}

const out = (phase: MergePhase, over: Partial<MergeBackResult> = {}): MergeBackResult => ({
  phase, uploads: false, syncOn: false, endsSession: false, removesLocalBook: false, saysEmptyBookRemoved: false,
  deletesLetters: false, recordingsLeavePhone: false, destination: null, dedupeByLetterId: false, ...over,
});

export function mergeBack(i: MergeBackInput): MergeBackResult {
  if (i.consent === 'pending') return out('askConsent');
  if (i.consent === 'declined') return out('keepOnPhone');
  if (i.claim === 'pending') return out('askClaim');
  if (i.claim === 'notMine') return out('endSession', { endsSession: true });
  if (!i.accountHasBook) return out('becomeAccountBook', { uploads: true, syncOn: true });
  if (i.localKeptLetters <= 0) return out('openAccountBook', { removesLocalBook: true, saysEmptyBookRemoved: true, syncOn: true });
  if (i.destination === null) return out('askDestination');
  return out('moveLetters', { uploads: true, syncOn: true, destination: i.destination, dedupeByLetterId: true });
}
