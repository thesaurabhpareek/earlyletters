/**
 * The moments store's public surface (NS-53-R221, R246, R249, R250; ADR 0032 amendment; CDO-23, CPrivO-16). One queue
 * for writes. The file goes FIRST and synchronously on sign-out and Erase everything. A write queued or running when a
 * clear lands is dropped. A file of another owner is never read or overwritten. Kept until the parent removes it, Turn
 * off, Erase everything or sign-out: there is no timer (CDO-23 item 2). No export (route A). Labels are L4: nothing
 * here logs, counts or reports a label, a key or that a clear happened, and there is no analytics event.
 * UNVERIFIED (CDO-23 item 4): moments.json is not synced, so a book deleted on another device may leave rows here;
 * `cleanupMomentsAtLaunch` removes rows for a book this phone no longer lists, but whether the sync pull reliably
 * shows a deleted book is not proven. Nothing may claim more than that.
 */
import { type MomentsPort, type MomentsRead, expoMomentsPort, readMoments, removeMoments, sweepMomentsTemp, writeMoments } from './store-file';
import * as L from './store.logic';

export type MomentsResult = { ok: true } | { ok: false; code: 'moments_store_unavailable' | 'moments_write_dropped' };
const UNAVAILABLE: MomentsResult = { ok: false, code: 'moments_store_unavailable' };
const DROPPED: MomentsResult = { ok: false, code: 'moments_write_dropped' };

export function createMomentsStore(getPort: () => MomentsPort | null, initialOwner: string = 'local') {
  let owner = initialOwner,
    generation = 0,
    swept = false,
    keptLocal = false, // the last sign-out kept a 'local' file: a local write still running must not delete it
    queue: Promise<unknown> = Promise.resolve();
  const listeners = new Set<() => void>();
  const tell = () => listeners.forEach((l) => l());

  function port(): MomentsPort | null {
    try {
      const p = getPort();
      if (p && !swept) sweepMomentsTemp(p), (swept = true);
      return p;
    } catch {
      return null;
    }
  }

  function change(fn: (file: L.MomentsFile) => L.MomentsFile | null): Promise<MomentsResult> {
    const started = generation,
      who = owner;
    const run = queue.then(async (): Promise<MomentsResult> => {
      if (started !== generation) return DROPPED;
      const p = port();
      if (!p) return UNAVAILABLE;
      const r = readMoments(p, who);
      if (r.state !== 'ok' && r.state !== 'empty') return UNAVAILABLE; // foreign, newer, unreadable: nothing is written
      const next = fn(r.state === 'ok' ? r.file : L.emptyMoments(who));
      if (!next || (await writeMoments(p, next)) !== 'ok') return UNAVAILABLE;
      if (started !== generation) {
        if (!(keptLocal && who === 'local')) removeMoments(p); // a clear landed during the write: nothing of it may stay
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
     * Sign-in or any owner change. Queued writes of the old owner are dropped and a file of another owner is removed,
     * a 'local' file nobody adopted included (the claim step calls `adoptLocal` BEFORE this, on an explicit confirm;
     * ADR 0032 item 4, CDO-24). Signing out calls this with 'local', which keeps a kept 'local' file.
     */
    setOwner(key: string): void {
      if (key === owner) return;
      owner = key;
      generation += 1;
      keptLocal = false;
      try {
        const p = getPort();
        const r = p ? readMoments(p, key) : null;
        if (p && r?.state === 'foreign') removeMoments(p);
      } catch {
        // the next sign-in, sign-out, launch or Erase tries again
      }
    },
    load(): MomentsRead {
      const p = port();
      const r = p ? readMoments(p, owner) : ({ state: 'unavailable' } as const);
      return r.state === 'foreign' || r.state === 'newer' ? { state: 'empty' } : r; // a caller never learns another owner's file, or a newer one, existed
    },
    addDayKey: (d: string) => change((f) => L.addDayKey(f, d)),
    removeDayKey: (d: string) => change((f) => L.removeDayKey(f, d)),
    setLabel: (d: string, text: string) => change((f) => L.setLabel(f, d, text)),
    clearLabel: (d: string) => change((f) => L.clearLabel(f, d)),
    hidePlace: (k: string) => change((f) => L.hidePlace(f, k)),
    unhidePlace: (k: string) => change((f) => L.unhidePlace(f, k)),
    setHomePlace: (book: string, k: string) => change((f) => L.setHomePlace(f, book, k)),
    /** A book was erased for good: its rows go in the same step (CDO-23 item 3). */
    removeBook: (book: string) => change((f) => (f.homePlace[book] === undefined ? null : L.removeBookRows(f, book))),
    /**
     * Launch: a file of another owner is deleted (the account changed while this phone was off), and home-place rows
     * for a book the phone no longer lists are removed. `liveBooks` null means the list could not be read: books are
     * left alone. UNVERIFIED for a book deleted on another device (see the file header).
     */
    async cleanupAtLaunch(liveBooks: readonly string[] | null): Promise<void> {
      const p = port();
      if (!p) return;
      const r = readMoments(p, owner);
      if (r.state === 'foreign' && r.owner !== 'local') {
        removeMoments(p);
        tell();
        return;
      }
      if (r.state !== 'ok' || !liveBooks) return; // a kept 'local' file reads foreign here: left alone
      const live = new Set(liveBooks);
      if (Object.keys(r.file.homePlace).every((b) => live.has(b))) return;
      await change((f) => L.pruneBooks(f, live));
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    /** The claim step, on an explicit "Keep in this account": a 'local' file becomes the new owner's, rows unchanged. 'none' when there is no local file; 'failed' leaves the file as it was. */
    adoptLocal(key: string): Promise<'adopted' | 'none' | 'failed'> {
      const started = generation;
      const run = queue.then(async (): Promise<'adopted' | 'none' | 'failed'> => {
        if (started !== generation) return 'failed';
        const p = port();
        if (!p) return 'none'; // no disk here: nothing to adopt, and a claim must not wait on it forever
        const r = readMoments(p, 'local');
        if (r.state === 'empty' || r.state === 'foreign') return 'none';
        if (r.state !== 'ok') return 'none'; // unreadable, newer or unavailable: nothing this build can adopt, so the claim is not held up
        return (await writeMoments(p, { ...r.file, owner: key })) === 'ok' ? 'adopted' : 'failed';
      });
      queue = run.catch(() => {});
      return run;
    },
    /** Deletes the file and temp now, drops queued writes. False when a file would not go. `keepLocal` (sign-out only): a 'local' file stays. */
    clearNow(keepLocal = false): boolean {
      generation += 1;
      keptLocal = false;
      let gone = false;
      try {
        const p = getPort();
        if (p && keepLocal && ['ok', 'newer'].includes(readMoments(p, 'local').state)) {
          keptLocal = true;
          gone = true;
        } else gone = p ? removeMoments(p) : true;
      } catch {
        // gone stays false
      }
      tell();
      return gone;
    },
  };
}

let real: MomentsPort | null = null;
export const momentsStore = createMomentsStore(() => (real ??= expoMomentsPort()));

/** Sign-out on any path, or another account signing in. Synchronous, never throws. A 'local' file stays. */
export const endMomentsSession = (): boolean => momentsStore.clearNow(true);

/** CODE-R15: callers branch on `code`, never on the message. */
export class MomentsStoreError extends Error {
  readonly code = 'moments_file_not_removed';
  constructor() {
    super('moments_file_not_removed');
    this.name = 'MomentsStoreError';
  }
}

/** Erase everything. Throws when the file stays, so the erase mark stays and the next launch retries. */
export function eraseMomentsFile(): void {
  if (!momentsStore.clearNow()) throw new MomentsStoreError();
}
