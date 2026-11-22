/**
 * The days store's public surface (NS-47-R11; ADR 0032 items 3, 7 and 9). Ticking goes through one queue; the file goes
 * FIRST and synchronously on sign-out and Erase, before `forgetReminders` and any await (item 3). A write queued or
 * running when a clear or an owner change lands is dropped (generation check; the owner is captured when the write is
 * queued). A file of another owner is never read, adopted or overwritten: a writer writes nothing and reports
 * unavailable (DAYS-4, REFUSE). A `local` file (made before any sign-in) is adopted only by `adoptLocal`, which the
 * claim screen's "Keep in this account" calls (NS-47-R7, E73; CPO-30); a first sign-in that is not a claim deletes it,
 * and sign-out keeps it ("Not my account" leaves the phone as it was). Owner key: lib/auth/local-claim.ts.
 */
import { type DaysPort, type DaysRead, expoDaysPort, readDays, removeDays, sweepDaysTemp, writeDays } from './store-file';
import { type DaysFile, LOCAL_OWNER, tickDay as tick, untickDay as untick } from './store.logic';

/** `days_write_dropped`: a clear or owner change landed first, so the write was never made (not a failure to show). */
export type DaysResult = { ok: true } | { ok: false; code: 'days_store_unavailable' | 'days_write_dropped' };
const UNAVAILABLE: DaysResult = { ok: false, code: 'days_store_unavailable' };
const DROPPED: DaysResult = { ok: false, code: 'days_write_dropped' };

export function createDaysStore(getPort: () => DaysPort | null, initialOwner = LOCAL_OWNER) {
  let owner = initialOwner,
    generation = 0,
    swept = false,
    keptLocal = false, // the last sign-out kept a `local` file: a local write still running must not delete it
    queue: Promise<unknown> = Promise.resolve();
  const listeners = new Set<() => void>();
  const tell = () => listeners.forEach((l) => l());

  function port(): DaysPort | null {
    try {
      const p = getPort();
      if (p && !swept) sweepDaysTemp(p), (swept = true);
      return p;
    } catch {
      return null;
    }
  }

  function change(fn: (file: DaysFile) => DaysFile | null): Promise<DaysResult> {
    const started = generation,
      who = owner; // the owner this write was made for, not whoever is current when it runs
    const run = queue.then(async (): Promise<DaysResult> => {
      if (started !== generation) return DROPPED;
      const p = port();
      if (!p) return UNAVAILABLE;
      const r = readDays(p, who);
      if (r.state !== 'ok' && r.state !== 'empty') return UNAVAILABLE; // foreign, unreadable, newer or unavailable: nothing is written
      const next = fn(r.state === 'ok' ? r.file : { v: 1, owner: who, ticked: {} });
      if (!next || (await writeDays(p, next)) !== 'ok') return UNAVAILABLE;
      if (started !== generation) {
        if (!(keptLocal && who === LOCAL_OWNER)) removeDays(p); // a clear landed during the write: nothing of it may stay
        return DROPPED;
      }
      tell();
      return { ok: true };
    });
    queue = run.catch(() => {});
    return run;
  }

  return {
    /**
     * Sign-in (or any owner change). Queued writes of the old owner are dropped. A stale file left by an earlier
     * account whose clear failed is removed again, so the next account is not blocked, and so is a 'local' file nobody
     * adopted (the claim step calls `adoptLocal` BEFORE this, on an explicit confirm). The new owner's own file is never
     * touched. Signing out calls this with 'local', which keeps a kept 'local' file.
     */
    setOwner(key: string): void {
      if (key === owner) return;
      owner = key;
      generation += 1;
      keptLocal = false;
      try {
        const p = getPort();
        const r = p ? readDays(p, key) : null;
        if (p && r?.state === 'foreign') removeDays(p);
      } catch {
        // still blocked: the next sign-in, sign-out or Erase tries again
      }
    },
    load(forOwner = owner): DaysRead {
      const p = port();
      const r = p ? readDays(p, forOwner) : ({ state: 'unavailable' } as const);
      return r.state === 'foreign' ? { state: 'empty' } : r; // a caller never learns another owner's file existed
    },
    tickDay: (id: string) => change((f) => tick(f, id)),
    untickDay: (id: string) => change((f) => untick(f, id)),
    clearAllDays: () => change((f) => ({ ...f, ticked: {} })),
    subscribeDays(listener: () => void): () => void {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    /**
     * The claim step, on an explicit "Keep in this account": a `local` file becomes the new owner's, ticks unchanged.
     * Runs on the write queue. 'none' when there is no local file (or the file is another owner's); 'failed' when it
     * could not be rewritten (the file is left as it was).
     */
    adoptLocal(key: string): Promise<'adopted' | 'none' | 'failed'> {
      const started = generation;
      const run = queue.then(async (): Promise<'adopted' | 'none' | 'failed'> => {
        if (started !== generation) return 'failed';
        const p = port();
        if (!p) return 'failed';
        const r = readDays(p, LOCAL_OWNER);
        if (r.state === 'empty' || r.state === 'foreign') return 'none';
        if (r.state !== 'ok') return 'failed';
        return (await writeDays(p, { ...r.file, owner: key })) === 'ok' ? 'adopted' : 'failed';
      });
      queue = run.catch(() => {});
      return run;
    },
    /**
     * Deletes the file and temp now, drops queued writes, tells listeners. False when a file would not go.
     * `keepLocal` (sign-out only): a `local` file stays, because "Not my account" leaves the phone as it was.
     */
    clearNow(keepLocal = false): boolean {
      generation += 1;
      keptLocal = false;
      let gone = false;
      try {
        const p = getPort();
        if (p && keepLocal && ['ok', 'newer'].includes(readDays(p, LOCAL_OWNER).state)) {
          keptLocal = true;
          gone = true; // nothing of a signed-in person is left
        } else gone = p ? removeDays(p) : true;
      } catch {
        // gone stays false
      }
      tell();
      return gone;
    },
  };
}

let real: DaysPort | null = null;
export const daysStore = createDaysStore(() => (real ??= expoDaysPort()));
export const { setOwner: setDaysOwner, load: loadDays, tickDay, untickDay, clearAllDays, subscribeDays } = daysStore;

/** Sign-out on any path, or another account signing in (NS-47-R15). Synchronous, never throws. A `local` file stays. */
export const endDaysSession = (): boolean => daysStore.clearNow(true);

/** CODE-R15: callers branch on `code`, never on the message. */
export class DaysStoreError extends Error {
  readonly code = 'days_file_not_removed';
  constructor() {
    super('days_file_not_removed');
    this.name = 'DaysStoreError';
  }
}

/** Erase everything (NS-47-R16). Throws a DaysStoreError when the file stays, so the erase mark stays and the next launch retries. */
export function eraseDaysFile(): void {
  if (!daysStore.clearNow()) throw new DaysStoreError();
}
