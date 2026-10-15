/**
 * "Keep the letters on this phone in this account?" before any of them move
 * (BL-347, security review H1; F02-REQ-019; F02 6.2 step 6, 6.6 U34). Pure,
 * tested in test/auth-email-link.test.ts.
 *
 * The first account that claims a phone takes its local letters and books
 * (lib/sync/ownership.ts, takeOwnership, through lib/sync `onSignedIn`). That
 * must happen only after consent, and after the person has seen which account
 * it is (masked email) and tapped. The auth store therefore hides a session
 * from the sync contract (no `onSignedIn`, `currentAuthUserId()` null,
 * `syncAllowed()` false) while a claim is pending (auth-store.ts).
 *
 * A session needs no claim screen when:
 *  - this account already owns the phone's letters (signed in here before), or
 *  - another account owns them: nothing can move (sync stops with an account
 *    mismatch and the letters stay), so there is nothing to ask, or
 *  - the phone holds no books and no letters: there is nothing to claim.
 * Otherwise the person confirms once per session. "Unknown" (the store could
 * not be read) counts as "letters present": asking once more is always safe,
 * claiming without asking is not.
 *
 * "Holds a book or a letter" means any row at all in `children` or `entries`,
 * hidden, refused or deleted ones included (`phoneHoldsAnyRow`). That is a
 * superset of what takeOwnership claims, so the answer can only err towards
 * asking (review 2 of PR #139: a hidden-only book must still ask).
 */
import type { SqlDb } from '../db/sql';

export interface ClaimInput {
  /** The signed-in user, or null. */
  userId: string | null;
  /** Who owns this phone's letters (sync.owner setting); null before the first claim. */
  owner: string | null;
  /** Whether this phone holds any book or letter; null when the store could not be read. */
  hasLocalData: boolean | null;
  /** Users the person confirmed in this process. */
  confirmed: ReadonlySet<string>;
}

/** Any book or letter row on this phone, in any state. */
export function phoneHoldsAnyRow(db: Pick<SqlDb, 'get'>): boolean {
  const r = db.get<{ any_rows: number }>('SELECT (EXISTS (SELECT 1 FROM children) OR EXISTS (SELECT 1 FROM entries)) AS any_rows');
  return !!r && Number(r.any_rows) === 1;
}

export function needsAccountClaim(input: ClaimInput): boolean {
  if (!input.userId) return false;
  if (input.owner) return false;
  if (input.hasLocalData === false) return false;
  return !input.confirmed.has(input.userId);
}

/**
 * The account email as the claim screen shows it: the first character of the
 * local part, three stars, the domain ("a***@example.com"; F02 6.2 step 6).
 * Enough to recognise an address, not enough to leak it to a bystander.
 */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const s = email.trim();
  const at = s.lastIndexOf('@');
  if (at <= 0 || at === s.length - 1) return null;
  const first = Array.from(s.slice(0, at))[0] ?? '';
  return `${first}***@${s.slice(at + 1)}`;
}
