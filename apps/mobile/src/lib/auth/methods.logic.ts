/**
 * Settings > Account, "Ways to sign in" (YOU-TAB-STATES-9nov 5 item 3; NX-36 S15, NX-32-R4 read only). Pure, so
 * test/account-sections.test.ts runs it in Node.
 *
 * The rows come from the identities the session already carries on this phone (Supabase `user.identities`, read from the
 * stored session: no request is made). One row per method, with the date it was added when the identity has one, and a
 * mark on the method used to sign in here. There is no Add and no Remove row in Build 12, and passkeys are not listed
 * (they stay hidden: `passkeysAvailable()` is off in every build profile).
 */
export type MethodKind = 'apple' | 'google' | 'email' | 'other';

export interface IdentityLike {
  provider?: unknown;
  created_at?: unknown;
}

export interface SignInMethodRow {
  kind: MethodKind;
  /** "YYYY-MM-DD" (the day the method was added), or null when the identity carries no date. */
  addedOn: string | null;
  /** The method used to sign in on this phone. */
  current: boolean;
}

const kindOf = (p: unknown): MethodKind => (p === 'apple' || p === 'google' || p === 'email' ? p : 'other');

/** "2026-11-09T10:00:00Z" to "2026-11-09"; anything else is no date (never a guessed one). */
function dayOf(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const m = /^(\d{4}-\d{2}-\d{2})(?:$|T)/.exec(v);
  return m ? m[1]! : null;
}

/**
 * `identities`: the session's identities, or nothing. `signedInWith`: the method used here (the last method, else the
 * account's provider). With no identities the one known method still gets its row, without a date.
 */
export function signInMethods(identities: readonly IdentityLike[] | null | undefined, signedInWith: MethodKind | null): SignInMethodRow[] {
  const rows: SignInMethodRow[] = [];
  for (const i of identities ?? []) {
    const kind = kindOf(i.provider);
    if (rows.some((r) => r.kind === kind && kind !== 'other')) continue;
    rows.push({ kind, addedOn: dayOf(i.created_at), current: false });
  }
  if (rows.length === 0 && signedInWith) rows.push({ kind: signedInWith, addedOn: null, current: false });
  // Mark exactly one row: the method used here, else (it is not listed) the first.
  const at = rows.findIndex((r) => r.kind === signedInWith);
  const mark = at >= 0 ? at : 0;
  return rows.map((r, n) => ({ ...r, current: n === mark }));
}

/** The method used to sign in here: the last method the person used (apple, google, email), else the account's provider. A passkey sign-in reads as the account's provider. */
export function signedInWithKind(lastMethod: string | null, provider: MethodKind | null): MethodKind | null {
  if (lastMethod === 'apple' || lastMethod === 'google' || lastMethod === 'email') return lastMethod;
  return provider;
}

/** The second line of a method's row: "Added {date}" when the day is known, then "This is how you signed in" on the current one. Nothing at all when neither applies. */
export function methodSubtitle(row: SignInMethodRow, words: { thisOne: string; addedOn: (day: string) => string }): string | undefined {
  const lines = [row.addedOn ? words.addedOn(row.addedOn) : null, row.current ? words.thisOne : null].filter((l): l is string => l !== null);
  return lines.length ? lines.join('\n') : undefined;
}
