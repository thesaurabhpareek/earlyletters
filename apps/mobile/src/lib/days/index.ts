/**
 * The days store's one public surface (NS-47-R11; ADR 0032 items 3, 5, 7, 9; BRIEF NS-47). Only lib/days/** reads the
 * file. Foundation only: tick, untick, clear, subscribe and the clear order. The Days page, moves, the planner's
 * opaque slots and the claim-step adoption (NS-47-R7) are the next PRs.
 *
 * Clear order (ADR 0032 item 3): `endDaysSession` and `eraseDaysFile` delete the file FIRST and synchronously, before
 * `forgetReminders` and any await. A write queued or running when a clear lands is dropped (generation check), so a
 * late write cannot bring A's days back. Reads compare the owner key and fail closed on a mismatch.
 * Nothing here logs a day id, a path or file contents (ADR 0032 item 10).
 */
import { type DaysPort, expoDaysPort, readDays, removeDays, sweepDaysTemp, writeDays, type DaysRead } from './store-file';
import { type DaysFile, emptyDays, LOCAL_OWNER, tickDay as tick, untickDay as untick } from './store.logic';

export type DaysResult = { ok: true } | { ok: false; code: 'days_store_unavailable' };
const UNAVAILABLE: DaysResult = { ok: false, code: 'days_store_unavailable' };

export function createDaysStore(getPort: () => DaysPort | null) {
  let owner = LOCAL_OWNER;
  let generation = 0;
  let queue: Promise<unknown> = Promise.resolve();
  let swept = false;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());

  function port(): DaysPort | null {
    try {
      const p = getPort();
      if (p && !swept) {
        swept = true;
        sweepDaysTemp(p);
      }
      return p;
    } catch {
      return null;
    }
  }

  /** One read at a time on the queue's side: every write starts from what is on disk, never from a cache. */
  function change(fn: (file: DaysFile) => DaysFile | null): Promise<DaysResult> {
    const started = generation;
    const run = queue.then(async (): Promise<DaysResult> => {
      const p = port();
      if (!p || started !== generation) return UNAVAILABLE;
      const r = readDays(p, owner);
      if (r.state === 'unavailable' || r.state === 'unreadable' || r.state === 'newer') return UNAVAILABLE;
      const next = fn(r.state === 'ok' ? r.file : emptyDays(owner));
      if (!next) return UNAVAILABLE;
      if ((await writeDays(p, next)) !== 'ok') return UNAVAILABLE;
      if (started !== generation) {
        removeDays(p); // a clear landed during the write: nothing of it may stay
        return UNAVAILABLE;
      }
      notify();
      return { ok: true };
    });
    queue = run.catch(() => {});
    return run;
  }

  return {
    /** The owner key reads compare against. 'local' until a person signs in (the claim step adopts, next PR). */
    setOwner(key: string): void {
      owner = key;
    },
    load(): DaysRead {
      const p = port();
      return p ? readDays(p, owner) : { state: 'unavailable' };
    },
    tickDay: (id: string) => change((f) => tick(f, id)),
    untickDay: (id: string) => change((f) => untick(f, id)),
    clearAllDays: () => change((f) => ({ ...f, ticked: {} })),
    subscribeDays(listener: () => void): () => void {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    /** Deletes the file and temp now, drops queued writes, tells listeners. False when a file would not go. */
    clearNow(): boolean {
      generation += 1;
      let gone = true;
      try {
        const p = getPort();
        gone = p ? removeDays(p) : true;
      } catch {
        gone = false;
      }
      notify();
      return gone;
    },
  };
}

let real: DaysPort | null = null;
export const daysStore = createDaysStore(() => (real ??= expoDaysPort()));

export const { setOwner: setDaysOwner, load: loadDays, tickDay, untickDay, clearAllDays, subscribeDays } = daysStore;

/** Sign-out on any path, or another account signing in (NS-47-R15). Synchronous, first, never throws. */
export function endDaysSession(): boolean {
  try {
    return daysStore.clearNow();
  } catch {
    return false;
  }
}

/** Erase everything (NS-47-R16). Throws when the file stays, so the erase mark stays and the next launch retries. */
export function eraseDaysFile(): void {
  if (!daysStore.clearNow()) throw new Error('days_file_not_removed');
}
