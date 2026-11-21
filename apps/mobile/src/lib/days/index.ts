/**
 * The days store's public surface (NS-47-R11; ADR 0032 items 3, 7 and 9). Ticking goes through one queue; the file goes
 * FIRST and synchronously on sign-out and Erase, before `forgetReminders` and any await (item 3). A write queued or
 * running when a clear lands is dropped (generation check). A file of another owner is never read or adopted: a writer
 * deletes it and starts empty (E73); the claim step (NS-47-R7, next PR) is the only adoption. Owner key: next PR.
 */
import { type DaysPort, type DaysRead, expoDaysPort, readDays, removeDays, sweepDaysTemp, writeDays } from './store-file';
import { type DaysFile, LOCAL_OWNER, tickDay as tick, untickDay as untick } from './store.logic';

export type DaysResult = { ok: true } | { ok: false; code: 'days_store_unavailable' };
const UNAVAILABLE: DaysResult = { ok: false, code: 'days_store_unavailable' };

export function createDaysStore(getPort: () => DaysPort | null) {
  let owner = LOCAL_OWNER,
    generation = 0,
    swept = false,
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
    const started = generation;
    const run = queue.then(async (): Promise<DaysResult> => {
      const p = port();
      if (!p || started !== generation) return UNAVAILABLE;
      const r = readDays(p, owner);
      if (r.state !== 'ok' && r.state !== 'empty') return UNAVAILABLE; // foreign, unreadable, newer or unavailable: nothing is written
      const next = fn(r.state === 'ok' ? r.file : { v: 1, owner, ticked: {} });
      if (!next || (await writeDays(p, next)) !== 'ok') return UNAVAILABLE;
      if (started !== generation) {
        removeDays(p); // a clear landed during the write: nothing of it may stay
        return UNAVAILABLE;
      }
      tell();
      return { ok: true };
    });
    queue = run.catch(() => {});
    return run;
  }

  return {
    setOwner: (key: string): void => void (owner = key),
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
      tell();
      return gone;
    },
  };
}

let real: DaysPort | null = null;
export const daysStore = createDaysStore(() => (real ??= expoDaysPort()));
export const { setOwner: setDaysOwner, load: loadDays, tickDay, untickDay, clearAllDays, subscribeDays } = daysStore;

/** Sign-out on any path, or another account signing in (NS-47-R15). Synchronous, never throws. */
export const endDaysSession = (): boolean => daysStore.clearNow();

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
