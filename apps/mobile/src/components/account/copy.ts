/**
 * Words for the screen another signed-in account sees on a phone that holds this owner's book (BL-961, NS-10-R3,
 * `[X4-R1]`; 08-keeping.md K8 and OQ-5, the founder's default: hide the book, offer sign-out).
 *
 * PROPOSED: every sentence here waits for the founder's approval (the PR carries needs:founder), and `content` moves
 * the approved words into packages/content. The button reuses `authCopy.account.signOut`, already approved.
 * What they must never do: name the other account, the child or any letter; promise the book is anywhere else; say
 * anything was lost or removed (nothing is: the book stays on the phone as it was).
 */
export const accountScopeCopy = {
  /** PROPOSED. The heading. */
  title: 'This phone has a book from another account',
  /** PROPOSED. The one sentence under it. */
  body: 'It stays closed while you are signed in with this account. Sign out to open it, or to sign in another way.',
} as const;
