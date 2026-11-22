/**
 * What the Keychain said about the stored session at launch, and what that allows the backup-file sweep to do (B5-5).
 * BL-1198 (CISO ruling, 21 Nov): a Keychain that has not unlocked yet may answer null instead of throwing, and a null
 * cannot be told from a session that is really gone. So a null, an empty value and a throw are all `unavailable`
 * (unknown, not signed out), as is a build with no Supabase client: they must never delete a signed-in account's file.
 * The next settled run asks again (`backupSweepFor` returns `run: false` until then). The only positive signed-out
 * signals are a sign-out seen live (`before` was a user) and, for now, a stored blob that parses with no string user id
 * (`none`, which BL-1199 makes unknown too).
 */
export type StoredSessionRead = { kind: 'found'; userId: string } | { kind: 'none' } | { kind: 'unavailable' };

export async function readStoredSession(getItem: () => Promise<string | null>): Promise<StoredSessionRead> {
  try {
    const raw = await getItem();
    if (!raw) return { kind: 'unavailable' }; // null: locked or absent, unknown (BL-1198)
    const id = (JSON.parse(raw) as { user?: { id?: unknown } }).user?.id;
    return typeof id === 'string' ? { kind: 'found', userId: id } : { kind: 'none' };
  } catch {
    return { kind: 'unavailable' };
  }
}

/**
 * Whether a settled run may sweep backup files, and for whom. A known signed-in user: keep only theirs. Signed out:
 * sweep everything only when the sign-out was seen live (`before` was a user) or the launch read succeeded and found
 * no session; otherwise do nothing and let the next settled run try again.
 */
export function backupSweepFor(
  sessionUser: string | null,
  before: string | null,
  read: StoredSessionRead,
): { run: true; keep: string | null } | { run: false } {
  if (sessionUser) return { run: true, keep: sessionUser };
  if (before !== null || read.kind === 'none') return { run: true, keep: null };
  return { run: false };
}
