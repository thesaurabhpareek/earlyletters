/**
 * New account, or returning with no book, or already has a book (account-first slice 4a; exec council 9 Nov 2026, A and D;
 * NX-31 R12; NX-36 S6, S17). Pure, no React Native, tested in Node (test/first-run-new-account.test.ts). Reads nothing,
 * sends nothing, records nothing; `account-books.ts` makes the one call.
 *
 * The signal is `sync_books()` (supabase/migrations/20261015000000, section 5):
 *   { epoch, first_run_open, books[] }
 *   - `first_run_open` is `profiles.first_run_closed_at is null` (true when there is no profile row yet). The server sets
 *     `first_run_closed_at` when a book is made and never clears it (the `profiles_guard` trigger refuses client writes).
 *   - So `first_run_open` true with no books is a person who never made a book (NEW), and `first_run_open` false with no
 *     books is a person who had one that is gone (RETURNING, no book).
 * The call needs a signed-in, non-anonymous user and a rate-limit slot; it does not check the content gate, so it answers
 * before the consent steps. It is read defensively here (not the strict contract): an answer that cannot be read as
 * `books` plus a true or false `first_run_open` is `unknown`, never `new`.
 *
 * The fail-safe direction (council A): anything but a clear "new" shows today's "No book here yet" screen. Showing it to a
 * new person costs one tap ("Start a book"); treating a returning person as new would make a second, empty account book.
 */

/** How long the screen waits for the answer: the session gate's own timeout (session-provider GATE_TIMEOUT_MS). */
export const ACCOUNT_BOOKS_WAIT_MS = 10_000;

export type AccountKind = 'new' | 'returningNoBook' | 'hasBook' | 'unknown';

/** What a `sync_books` answer says about this account. Anything unreadable is `unknown`. */
export function classifyAccountBooks(data: unknown): AccountKind {
  if (!data || typeof data !== 'object') return 'unknown';
  const r = data as { first_run_open?: unknown; books?: unknown };
  if (!Array.isArray(r.books)) return 'unknown';
  if (r.books.length > 0) return 'hasBook';
  if (r.first_run_open === true) return 'new';
  if (r.first_run_open === false) return 'returningNoBook';
  return 'unknown';
}

export type Settled<T> = { ok: true; value: T } | { ok: false; reason: 'timeout' | 'error' };

export interface Scheduler {
  set: (fn: () => void, ms: number) => unknown;
  clear: (handle: unknown) => void;
}

const REAL_SCHEDULER: Scheduler = { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) };

/**
 * Waits for `work` for at most `ms`. Never rejects: a throw or a rejection is `error`, a late answer is `timeout`, and a
 * late answer after the timeout is ignored. The timer is always cleared, so nothing is left running.
 */
export function settleWithin<T>(work: () => PromiseLike<T> | T, ms: number, scheduler: Scheduler = REAL_SCHEDULER): Promise<Settled<T>> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (r: Settled<T>) => {
      if (done) return;
      done = true;
      scheduler.clear(handle);
      resolve(r);
    };
    const handle = scheduler.set(() => finish({ ok: false, reason: 'timeout' }), ms);
    try {
      Promise.resolve(work()).then(
        (value) => finish({ ok: true, value }),
        () => finish({ ok: false, reason: 'error' }),
      );
    } catch {
      finish({ ok: false, reason: 'error' });
    }
  });
}

/** `{ data, error }` as the Supabase client answers an rpc: an `error` is a failure whatever `data` holds. */
export function kindFromRpc(settled: Settled<{ data?: unknown; error?: unknown } | null | undefined>): AccountKind {
  if (!settled.ok) return 'unknown';
  const r = settled.value;
  if (!r || r.error) return 'unknown';
  return classifyAccountBooks(r.data);
}

export type AfterConsent = 'close' | 'noBook';

/**
 * After sign-in and consent, with no book on the phone. `close` hands over to the first-run route (the promise step, then
 * the child step) or, for an account that has a book, to the app. Only a clear "new" or "has a book" closes; a returning
 * person without a book, and every failure, see "No book here yet".
 */
export function afterConsent(kind: AccountKind): AfterConsent {
  return kind === 'new' || kind === 'hasBook' ? 'close' : 'noBook';
}

export type ClaimWords = 'accountHasBook' | 'plain';

/** The claim screen's first sentence. Only a clear "has a book" says so; an unreadable answer keeps today's words. */
export function claimWords(kind: AccountKind | null): ClaimWords {
  return kind === 'hasBook' ? 'accountHasBook' : 'plain';
}

/**
 * "Keep in this account" waits until the check has an answer or has timed out (`null` = still asking), so the person never
 * taps before the sentence that tells them the account already has a book. "Not my account" never waits.
 */
export function keepEnabled(kind: AccountKind | null): boolean {
  return kind !== null;
}

/**
 * What "Keep in this account" does, in Build 12 (council D, cases 4 and 5 as ONE behaviour). `takeOwnership` is not changed
 * and has no destination parameter: it claims every local book as its own book. So an account that already has a book gets
 * the phone's book as a second book. `mergeBack()` (merge-back.logic.ts) still describes the earlier proposal for these
 * cases ("In the existing book", an empty book removed); Build 12 does not use those phases, and this function says so.
 *
 * When the claim screen's lines are true (test/first-run-new-account.test.ts runs `takeOwnership` on a real phone database):
 *  - "Nothing is deleted": `takeOwnership` deletes no book, letter, draft or recording and never changes a letter's words;
 *    it sets owner and state columns and queues uploads.
 *  - "added to it as a second book": each local book the server accepts (a device UUIDv7 id, and a birthday or due date) goes up
 *    under its own id as `pending`. A phone with several books adds each one. A book the server would refuse stays on the
 *    phone as `refused`, is not added and is not deleted; the screen cannot know that before the tap.
 *  - "Recordings are kept on the phone that made them": the wire carries only that a recording is kept on the device.
 *  - "This account already has a book" shows only when `sync_books` answered with a book (`claimWords`).
 */
export interface ClaimKeepOutcome {
  addsAsSecondBook: boolean;
  /** No outcome deletes a letter, a book or a recording, or removes an empty local book. */
  deletes: false;
  mergesIntoExistingBook: false;
  asksDestination: false;
  removesEmptyLocalBook: false;
  /** Recordings stay on the phone (backup is off); the words go. */
  recordingsLeavePhone: false;
}

export function claimKeepOutcome(kind: AccountKind | null): ClaimKeepOutcome {
  return {
    addsAsSecondBook: kind === 'hasBook',
    deletes: false,
    mergesIntoExistingBook: false,
    asksDestination: false,
    removesEmptyLocalBook: false,
    recordingsLeavePhone: false,
  };
}

/**
 * The masked address the way a person says it, because a screen reader reads "a***" as punctuation:
 * "a***@example.com" becomes "a, hidden, at example.com". Null when there is no masked address to read.
 */
export function spokenMaskedEmail(masked: string | null | undefined, words: { spokenAddress: string; spokenAddressNoFirst: string }): string | null {
  if (!masked) return null;
  const at = masked.lastIndexOf('@');
  if (at <= 0 || at === masked.length - 1) return null;
  const local = masked.slice(0, at).replace(/\*+/g, '').trim();
  const domain = masked.slice(at + 1);
  return local ? words.spokenAddress.replace('{first}', local).replace('{domain}', domain) : words.spokenAddressNoFirst.replace('{domain}', domain);
}

export interface SignedInLine {
  text: string;
  /** What VoiceOver says; differs from `text` only when an address is read out. */
  label: string;
}

/**
 * The quiet identity line (child step and claim screen). A masked address: "Signed in as {email}." Apple with no address
 * (it shared none): the existing "Signed in with Apple". Anything else with no address: no line (never an empty "as .").
 */
export function signedInLine(
  input: { maskedEmail: string | null; provider: string | null },
  words: { signedInAs: string; signedInAsLabel: string; spokenAddress: string; spokenAddressNoFirst: string; apple: string },
): SignedInLine | null {
  if (input.maskedEmail) {
    const spoken = spokenMaskedEmail(input.maskedEmail, words) ?? input.maskedEmail;
    return { text: words.signedInAs.replace('{email}', input.maskedEmail), label: words.signedInAsLabel.replace('{email}', spoken) };
  }
  if (input.provider === 'apple') return { text: words.apple, label: words.apple };
  return null;
}

/**
 * "Use another account" (child step). `signOut()` answers `done` or `waiting` (it holds while queued letters upload), and can
 * reject. The button is busy while a press is in flight and while the sign-out is waiting, so a second tap does nothing; a
 * rejection or a finished sign-out frees it. Nothing here is said to the person.
 */
export function useAnotherBusy(input: { pressing: boolean; authStatus: string }): boolean {
  return input.pressing || input.authStatus === 'signingOut';
}
