/**
 * What the Keychain said about the stored session at launch, and what that allows the backup-file sweep to do (B5-5).
 * `none` is only a read that SUCCEEDED and found no session. A throw (a Keychain that is not readable yet, such as
 * before first unlock, or a transient error) and a build with no Supabase client are `unavailable`: they say nothing
 * about whether someone is signed in, so they must never delete a signed-in account's file.
 */
export type StoredSessionRead = { kind: 'found'; userId: string } | { kind: 'none' } | { kind: 'unavailable' };

export async function readStoredSession(getItem: () => Promise<string | null>): Promise<StoredSessionRead> {
  try {
    const raw = await getItem();
    if (!raw) return { kind: 'none' };
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
