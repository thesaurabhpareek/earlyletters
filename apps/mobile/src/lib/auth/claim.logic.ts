/**
 * When may the letters on this phone move into the signed-in account
 * (BL-347, security review H1 step 4, F02-REQ-019, F02 6.2 step 6)?
 *
 * Never on SIGNED_IN by itself. A sign-in link someone else requested would
 * otherwise move a family's letters into a stranger's account with one tap.
 * The person sees "Your letters on this phone will be kept in the account
 * a***@example.com" and taps Keep them here; only then does the sync layer
 * see the account (auth-store.ts) and run re-ownership (lib/sync/ownership.ts).
 *
 * Pure: no React Native, no Supabase; tested in test/auth-claim.test.ts.
 */

export interface ClaimInput {
  /** The signed-in account. */
  userId: string;
  /** `sync.ownerId`: the account that already owns this phone's letters, if any (written by takeOwnership). */
  owner: string | null;
  /** The account the person confirmed on the claim screen on this install, if any. */
  confirmedFor: string | null;
  /** This phone has books or letters no account owns yet (what takeOwnership would move). */
  hasUnclaimedData: boolean;
}

/**
 * - 'settled': the sync layer may see this account now.
 * - 'ask': show the claim screen; nothing moves until the tap.
 */
export type ClaimDecision = 'settled' | 'ask';

export function claimDecision(i: ClaimInput): ClaimDecision {
  if (i.owner === i.userId || i.confirmedFor === i.userId) return 'settled';
  // Owned by another account: takeOwnership refuses (AccountMismatchError) and nothing moves,
  // so the sync layer may see the account and report the mismatch as it does today.
  if (i.owner && i.owner !== i.userId) return 'settled';
  // Nothing on this phone belongs to nobody: there is nothing to move.
  if (!i.hasUnclaimedData) return 'settled';
  return 'ask';
}

/**
 * "asha.parent@example.com" -> "a***@example.com". Enough for the person to
 * recognise their own account, little for a shoulder-reader. Apple relay
 * addresses mask the same way. Null when there is no usable address.
 */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const e = email.trim();
  const at = e.lastIndexOf('@');
  if (at < 1 || at === e.length - 1) return null;
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  return `${Array.from(local)[0]}***@${domain}`;
}
