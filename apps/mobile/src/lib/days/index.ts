/**
 * The days store's one public surface (NS-47-R11; ADR 0032 items 3, 7, 9). Foundation only: tick, untick, clear,
 * subscribe and the clear order. The Days page, moves, planner slots, the owner key and the claim step are next PRs.
 * Clear order (item 3): `endDaysSession` and `eraseDaysFile` delete the file FIRST and synchronously, before
 * `forgetReminders` and any await. A write queued or running when a clear lands is dropped (generation check).
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

  function port(): DaysPort | null {
    try {
      const p = getPort();
      if (p && !swept) sweepDaysTemp(p), (swept = true);
      return p;
    } catch {
      return null;
    }
  }

  /** Every write starts from what is on disk, on one queue. */
  function change(fn: (file: DaysFile) => DaysFile | null): Promise<DaysResult> {
    const started = generation;
    const run = queue.then(async (): Promise<DaysResult> => {
      const p = port();
      if (!p || started !== generation) return UNAVAILABLE;
      const r = readDays(p, owner);
      if (r.state === 'unavailable' || r.state === 'unreadable' || r.state === 'newer') return UNAVAILABLE;
      const next = fn(r.state === 'ok' ? r.file : emptyDays(owner));
      if (!next || (await writeDays(p, next)) !== 'ok') return UNAVAILABLE;
      if (started !== generation) {
        removeDays(p); // a clear landed during the write: nothing of it may stay
        return UNAVAILABLE;
      }
      listeners.forEach((l) => l());
      return { ok: true };
    });
    queue = run.catch(() => {});
    return run;
  }

  return {
    setOwner: (key: string): void => void (owner = key),
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
      let gone = false;
      try {
        const p = getPort();
        gone = p ? removeDays(p) : true;
      } catch {
        // gone stays false
      }
      listeners.forEach((l) => l());
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
