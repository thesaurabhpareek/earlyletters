/**
 * Launch cleanup of the device-only moments file (PRD 28 PR 10, BL-1541; CPO-30, CDO-23, CDO-24). Pure: every reader is
 * passed in, so nothing here imports React Native, the store or the auth module. The flag off means no call at all.
 *
 * The cleanup runs ONCE per process, and only when the owner is settled, never at 'restoring': before then the store's
 * owner is still 'local' and a file of the signed-in person would read as another owner's. The sign-in step has already
 * set the owner (the bind in lib/auth/local-claim.ts runs first), so the store compares the file with the right account.
 * `cleanupAtLaunch` itself keeps a 'local' file and deletes a file of any other owner.
 */
export interface LaunchAuthPort {
  /** The released user id, or null (signed out, still consenting, or waiting on the claim screen). */
  userId(): string | null;
  /** 'restoring' until the Keychain read is done. */
  settledSignedOut(): boolean;
  subscribe(listener: () => void): () => void;
  onSignedIn(listener: () => void): () => void;
}

export interface LaunchDeps {
  on: boolean;
  auth: LaunchAuthPort;
  cleanup(liveBooks: readonly string[] | null): Promise<void>;
  /** The books this phone lists, or null when the list cannot be read (books are then left alone). */
  liveBooks(): readonly string[] | null;
}

/** Returns the unbind. With the flag off nothing is read, subscribed or called. */
export function startMomentsLaunchCleanup(d: LaunchDeps): () => void {
  if (!d.on) return () => {};
  let done = false;
  const offs: (() => void)[] = [];
  const unbind = () => offs.splice(0).forEach((o) => o());
  const run = () => {
    if (done || !(d.auth.userId() || d.auth.settledSignedOut())) return;
    done = true;
    unbind();
    let books: readonly string[] | null = null;
    try {
      books = d.liveBooks();
    } catch {
      // unreadable: books are left alone
    }
    void d.cleanup(books).catch(() => {}); // never awaited, never throws: the next launch tries again
  };
  offs.push(d.auth.subscribe(run), d.auth.onSignedIn(run));
  run(); // already settled when this starts
  return unbind;
}
