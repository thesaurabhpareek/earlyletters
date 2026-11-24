/**
 * Launch cleanup of the device-only moments file (NS-53 PR 8 follow-up, BL-1541; CPO-30, CDO-23, CDO-24). Pure: every reader is
 * passed in, so nothing here imports React Native, the store or the auth module. The flag off means no call at all.
 *
 * The cleanup runs ONCE per process, and only when the owner is bound. ORDER (auth-store.ts): `publishAuth` calls the
 * `subscribeAuth` listeners BEFORE `announce()`, and the sign-in owner is set from `onSignedIn` (local-claim.ts). So a
 * signed-in person triggers it ONLY from `onSignedIn`, registered after the bind, or at start when a user is already
 * released (the bind ran at mount). The raw subscription triggers it only for a settled SIGNED-OUT phone, where the
 * owner is 'local' and stays so; a signed-in session never starts it from there (its file would read as foreign).
 * `cleanupAtLaunch` itself keeps a 'local' file and deletes a file of any other owner.
 */
import { toNativeErrorCode, type NativeErrorCode } from '../media/native-error';

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
  /** Called with one of the closed NativeErrorCode values when the cleanup could not remove a file it had to. No data. launch.ts holds the code in memory; nothing is logged or sent. */
  failed?(code: NativeErrorCode): void;
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
    if (done) return;
    done = true;
    unbind();
    let books: readonly string[] | null = null;
    try {
      books = d.liveBooks();
    } catch {
      // unreadable: books are left alone
    }
    // never awaited, never throws: the next launch tries again; a file that would not go is reported by code only
    void d.cleanup(books).catch((e: unknown) => d.failed?.(toNativeErrorCode(e)));
  };
  offs.push(
    d.auth.subscribe(() => {
      if (!d.auth.userId() && d.auth.settledSignedOut()) run(); // never for a signed-in session: the owner is bound later
    }),
    d.auth.onSignedIn(run), // registered after the bind, so the owner is the account's
  );
  if (d.auth.userId() || d.auth.settledSignedOut()) run(); // already settled when this starts (the bind ran at mount)
  return unbind;
}
