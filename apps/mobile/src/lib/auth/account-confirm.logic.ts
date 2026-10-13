/**
 * "Sign in as x@y?" before this phone's letters join an account (security
 * review H1, gap G-01). Pure, tested in test/auth-email-link.test.ts.
 *
 * The first account that claims a phone takes its local letters and books
 * (sync/ownership.ts, takeOwnership). That must happen only after the person
 * saw which account it is and tapped. The auth store therefore hides a new
 * session from the sync engine (no `onSignedIn`, `currentAuthUserId()` null,
 * `syncAllowed()` false) until it is confirmed.
 *
 * A session needs no confirmation when:
 *  - this account already owns the phone's letters (signed in before), or
 *  - another account owns them: nothing can move (sync stops with an account
 *    mismatch), so there is nothing to ask.
 * Otherwise (no owner yet) the person confirms once per session.
 */
export function needsAccountConfirm(userId: string | null, owner: string | null, confirmed: ReadonlySet<string>): boolean {
  if (!userId) return false;
  if (owner) return false;
  return !confirmed.has(userId);
}
