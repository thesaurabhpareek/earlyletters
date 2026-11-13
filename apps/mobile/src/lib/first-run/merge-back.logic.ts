/**
 * BUILD 12 NOTE (red-team 10 Nov, review fixes 10 Nov): no outcome of this rule removes or deletes anything, and the result
 * has no field that could say so. An earlier draft returned "the empty local book is removed" when the phone showed no
 * kept letters; that case is gone. A count of kept letters does not say a book is empty (a draft, a waiting letter or a
 * recording may sit in a book with no kept letter), so a count must never decide to remove a book.
 *
 * The existing-book phases below (`askDestination` / `moveLetters`, "In the existing book") are NOT shipped. Build 12
 * always adds the phone's book to the account as a SECOND book and deletes nothing (the later claim slice's
 * `claimKeepOutcome` is the single rule for an account that already has a book). Only the consent and claim phases
 * (`askConsent`, `keepOnPhone`, `askClaim`, `endSession`, `becomeAccountBook`) are called by the app today.
 * `UNSHIPPED_PHASES` names the rest; nothing may wire them to a screen without a new decision. A letter is never added
 * twice because `takeOwnership` claims only rows whose `server_state` is `local` with UUIDv7 ids, not because of
 * `dedupeByLetterId` (a label here, no dedupe code).
 *
 * What is kept when a phone that holds a local-start book later signs in (NX-36 4.2; F02-REQ-019; NX-31 R18, R27).
 * PROPOSED rule (`product` and counsel to confirm): a data model and nothing else. No screen, no storage, no network.
 *
 *  1. Nothing moves at sign-in. The sensitive-data consent comes first; declining keeps the local book as it is, signed
 *     in, with sync off.
 *  2. After consent, the claim screen shows the masked address. Nothing is uploaded before "Keep in this account".
 *     "Not my account" ends the session and leaves the phone as it was.
 *  3. The account has no book: the local book becomes the account's book.
 *  4. The account has a book: nothing is removed, whatever the local book holds. The person chooses "In the existing
 *     book" (`existing`) or "As a second book" (`new`). Neither deletes anything; a letter already in the account is not
 *     added twice.
 *  5. Recordings stay on this phone (backup is off); the words travel. The result has no field for a recording.
 */
export type MergeConsent = 'pending' | 'declined' | 'accepted';
export type MergeClaim = 'pending' | 'notMine' | 'keep';
export type MergeDestination = 'existing' | 'new';

export interface MergeBackInput {
  consent: MergeConsent;
  claim: MergeClaim;
  accountHasBook: boolean;
  /** The person's choice in step 4; null until made. */
  destination: MergeDestination | null;
}

export type MergePhase =
  | 'askConsent'
  | 'keepOnPhone'
  | 'askClaim'
  | 'endSession'
  | 'becomeAccountBook'
  | 'askDestination'
  | 'moveLetters';

export interface MergeBackResult {
  phase: MergePhase;
  /** Letters' words may be sent to the account. True only after consent accepted and "Keep in this account". */
  uploads: boolean;
  syncOn: boolean;
  endsSession: boolean;
  destination: MergeDestination | null;
  /** Label only, NOT shipped: there is no dedupe code here. Claim safety rests on `takeOwnership` (sync/ownership.ts). */
  dedupeByLetterId: boolean;
}

/** Phases the app does not use in Build 12 (see the note above). A test pins this list. */
export const UNSHIPPED_PHASES: readonly MergePhase[] = ['askDestination', 'moveLetters'];

const out = (phase: MergePhase, over: Partial<MergeBackResult> = {}): MergeBackResult => ({
  phase, uploads: false, syncOn: false, endsSession: false, destination: null, dedupeByLetterId: false, ...over,
});

export function mergeBack(i: MergeBackInput): MergeBackResult {
  if (i.consent === 'pending') return out('askConsent');
  if (i.consent === 'declined') return out('keepOnPhone');
  if (i.claim === 'pending') return out('askClaim');
  if (i.claim === 'notMine') return out('endSession', { endsSession: true });
  if (!i.accountHasBook) return out('becomeAccountBook', { uploads: true, syncOn: true });
  if (i.destination === null) return out('askDestination');
  return out('moveLetters', { uploads: true, syncOn: true, destination: i.destination, dedupeByLetterId: true });
}
