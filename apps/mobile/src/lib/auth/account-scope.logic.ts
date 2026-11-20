/**
 * Whose book this phone shows (BL-961; `[X4-R1]`, NS-10-R3, NS-10-R5; ruling D1; security.md NSC-03; ADR 0031, the
 * number eval C s1.4 reserves for one phone and two accounts). Pure: no React Native, no store, no network, nothing
 * recorded. Tested in Node (test/account-scope.test.ts).
 *
 * A phone holds one account's book. Its owner is the account that first claimed the phone's letters: `sync.ownerId`,
 * written by `takeOwnership` (lib/sync/ownership.ts) and read as the store's `currentUserId()` or the outbox's
 * `syncOwner(db)`. The session user is whoever is signed in now, at any step: `authUserId(state)` (machine.logic.ts), the
 * raw session from `checkingConsent` to the end of `signingOut`. It is never `currentAuthUserId()`, which stays null
 * until consent and the claim are done, because a second account must not see the first one's book while its own
 * consent is still being read either.
 *
 * The rule, first match wins:
 *  1. no session                 -> visible. D1: signing out keeps the book on the phone for whoever holds it.
 *  2. no owner                   -> visible. Nothing on the phone belongs to another account: it was never claimed, or
 *                                   `releaseEmptyOwner` forgot the owner of a phone that held nothing. The first account
 *                                   to sign in is asked on the claim screen before anything joins it (ADR 0023).
 *  3. the owner is signed in     -> visible.
 *  4. otherwise                  -> hidden. Another account is signed in on a phone that holds the owner's book: sync
 *                                   has already stopped (`AccountMismatchError`), and every read for display and the
 *                                   screen cover go through this answer (BL-961 PRs 2 and 3).
 * Hidden only hides. Nothing is deleted, moved, claimed or sent, and the owner's book opens again as it was once that
 * account signs in again or the other account signs out.
 */

export interface AccountScopeInput {
  /** `sync.ownerId`: the account that owns this phone's letters. Null before the first claim, or after `releaseEmptyOwner`. */
  owner: string | null;
  /** The signed-in account (`authUserId(state)`), or null with no session. */
  sessionUser: string | null;
}

/** May this phone's book be shown to whoever is using the phone now? False only for another signed-in account. */
export function bookVisibleTo(input: AccountScopeInput): boolean {
  if (!input.sessionUser) return true;
  if (!input.owner) return true;
  return input.owner === input.sessionUser;
}
