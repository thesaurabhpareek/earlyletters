/**
 * Which account backup runs for on this phone, and where its state lives (review B M2 on PR #150).
 *
 * - The service runs only for the account released to sync (lib/auth/auth-store.ts
 *   `currentAuthUserId()`: consent complete and, when this phone's letters belong to no account
 *   yet, "Keep in this account" tapped). A session that is still consenting, or that ends with "Not my
 *   account", gets no service: nothing is listed, uploaded or restored for it, and no escrow
 *   request is opened in its name. The sign-in help promises nothing on this phone changes.
 * - Each account keeps its own backup state, one `backup-<profile id>.db` per account, so another
 *   account signing in never turns this one's backup off or drops its queue.
 *
 * - Every server and escrow call a service makes goes only while the phone's live session is still
 *   that service's account (`sameAccountOnly`), so a pass never calls under the next account's token.
 *
 * Pure: no React Native, so tests drive it with the Node phone.
 */
import { BackupStopped } from './format';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The account to run backup for: the session's, only once that same account is released to sync. */
export function backupAccountFor(sessionUid: string | null | undefined, releasedUid: string | null | undefined): string | null {
  if (!sessionUid || releasedUid !== sessionUid) return null;
  return UUID.test(sessionUid.toLowerCase()) ? sessionUid : null;
}

/** The backup state file of one account on this phone. */
export function backupDbFileFor(profileId: string): string {
  const id = profileId.toLowerCase();
  if (!UUID.test(id)) throw new Error('backup_profile_id');
  return `backup-${id}.db`;
}

/**
 * One service at a time, for the released account. Another account, or none, stops the old
 * service first (its pass ends and its temp files go), then starts the new one on that account's
 * own state.
 */
export function createAccountHost<S extends { stop(): Promise<void> }>(make: (profileId: string) => S) {
  let service: S | null = null;
  let serviceFor: string | null = null;

  async function retire(): Promise<void> {
    const old = service;
    service = null;
    serviceFor = null;
    if (old) await old.stop();
  }

  return {
    async forAccount(sessionUid: string | null | undefined, releasedUid: string | null | undefined): Promise<S | null> {
      const uid = backupAccountFor(sessionUid, releasedUid);
      if (!uid) {
        await retire();
        return null;
      }
      if (service && serviceFor === uid) return service;
      await retire();
      service = make(uid);
      serviceFor = uid;
      return service;
    },
    retire,
    current: (): S | null => service,
  };
}

/**
 * The phone's live session belongs to another account, or to none: the call was not made. A stop, like
 * a recording starting: the pass ends, no attempt is counted and nothing is shown, and the next pass
 * for this account goes on.
 */
export class AccountChanged extends BackupStopped {}

/**
 * `api` with every call made only while `sessionUid()` is `profileId` (follow-up on #150). The app has
 * one Supabase client, and its session is whoever signed in last; in the moment between another
 * account signing in and this account's service retiring (`createAccountHost`, about 500 ms in the
 * app), a running pass would otherwise call the server under that account's token.
 *
 * `recheck`: the session is read again once the call answers, or fails, and a change turns the
 * outcome into `AccountChanged`, so an answer that may have come under another account is never
 * acted on (review A N1 on #252; the main project, whose requests also carry the checked token).
 * Not for escrow: a request or a release is never repeated on its own, and dropping one that was
 * made under this account's own token would ask escrow again (another email, another unwrap).
 */
export function sameAccountOnly<T extends object>(api: T, sessionUid: () => Promise<string | null>, profileId: string, o: { recheck?: boolean } = {}): T {
  const same = async () => (await sessionUid().catch(() => null)) === profileId;
  const out: Record<string, unknown> = {};
  for (const [name, fn] of Object.entries(api)) {
    out[name] =
      typeof fn !== 'function'
        ? fn
        : async (...args: unknown[]) => {
            if (!(await same())) throw new AccountChanged();
            const call = (fn as (...a: unknown[]) => Promise<unknown>).apply(api, args);
            if (!o.recheck) return call;
            let result: unknown;
            try {
              result = await call;
            } catch (e) {
              if (!(await same())) throw new AccountChanged();
              throw e;
            }
            if (!(await same())) throw new AccountChanged();
            return result;
          };
  }
  return out as T;
}
