/**
 * Automatic retries of a speech download that failed (F05-U29). Pure: the
 * queue (index.ts) supplies the clock, the timers, the consent and
 * foreground check and the request itself; tested in Node
 * (test/transcription-queue.test.ts) with a fake clock.
 *
 * Rules:
 * - Only failures that can clear without the person retry: a manifest not
 *   published yet, a pack not in it yet, downloads paused, offline, a
 *   download that stopped (it resumes from the bytes it has) or could not be
 *   saved, and a download that did not check out. Waiting for Wi-Fi resumes
 *   in the pack engine; no space waits for the next launch or a tap; an app
 *   that is too old and a download the person stopped never retry by
 *   themselves.
 * - Further apart each time: 1 minute, 5 minutes, 30 minutes, 2 hours, then
 *   every 6 hours.
 * - A download that did not check out (`hash_mismatch`) already cost a full
 *   download from every host, so it retries at most
 *   `MAX_FULL_RETRIES_PER_DAY` times in any 24 hours; the next one waits for
 *   the window to open.
 * - A download that stopped (`download_failed`: its requests kept stalling or breaking) costs data each run, so
 *   after `MAX_STOPPED_RUNS` automatic runs in a row end that way, the retries stop and wait for the person's
 *   Try again (`gaveUp`); the first-run card then says so instead of "it tries again by itself".
 * - Every automatic retry is Wi-Fi only (`wifiOnly`), even with "Use mobile
 *   data" on: mobile data needs a fresh yes (a tap on Use mobile data).
 * - Nothing runs in the background or without the person's yes: a retry
 *   that comes due then waits for the next foreground.
 * - Success, removing the language's files, or stopping the queue clears
 *   the language's retries.
 */

export const DOWNLOAD_RETRY_DELAYS_MS: readonly number[] = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 6 * 60 * 60_000];
export const MAX_FULL_RETRIES_PER_DAY = 3;
export const DAY_MS = 24 * 60 * 60_000;
/** Automatic runs in a row that may end `download_failed` before the retries wait for a tap. */
export const MAX_STOPPED_RUNS = 5;

const RETRYABLE: ReadonlySet<string> = new Set([
  'no_manifest',
  'not_in_manifest',
  'downloads_paused',
  'offline',
  'download_failed',
  'storage_error',
  'hash_mismatch',
]);

/** Failures that cost a whole download again on every retry. */
const FULL_REDOWNLOAD: ReadonlySet<string> = new Set(['hash_mismatch']);

export function isRetryableDownloadFailure(reason: string): boolean {
  return RETRYABLE.has(reason);
}

/** Delay before automatic attempt `attempt` (1 = the first retry); the last delay repeats. */
export function downloadRetryDelayMs(attempt: number): number {
  const i = Math.max(0, Math.min(DOWNLOAD_RETRY_DELAYS_MS.length - 1, Math.floor(attempt) - 1));
  return DOWNLOAD_RETRY_DELAYS_MS[i];
}

export interface RetryPorts<L extends string> {
  now(): number;
  setTimer(fn: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
  /** True when an automatic retry may run now: the person said yes and the app is in the foreground. */
  allowed(): boolean;
  /** Starts the language's download again as an automatic retry (the caller passes `wifiOnly`). */
  request(language: L): void;
}

interface Entry {
  attempt: number;
  /** Runs in a row that ended `download_failed`. */
  stopped: number;
  /** When each automatic full re-download was (or is) due, for the 24-hour cap. */
  full: number[];
  dueAt: number;
  timer: unknown | null;
}

export class DownloadRetries<L extends string> {
  private readonly entries = new Map<L, Entry>();
  private readonly gaveUpOn = new Set<L>();

  constructor(private readonly ports: RetryPorts<L>) {}

  /** A download for this language failed. Schedules the next automatic retry and returns its delay, or null for none. */
  failed(language: L, reason: string): number | null {
    if (!isRetryableDownloadFailure(reason)) {
      this.drop(language);
      return null;
    }
    // Once the cap is hit, nothing schedules a stopped download again, whoever ran it (Review, a waiting letter, a
    // language pick), until the person taps (asked) or a run succeeds.
    if (reason === 'download_failed' && this.gaveUpOn.has(language)) return null;
    const now = this.ports.now();
    const prev = this.entries.get(language);
    const stopped = reason === 'download_failed' ? (prev?.stopped ?? 0) + 1 : 0;
    if (stopped > MAX_STOPPED_RUNS) {
      // The first failure is the person's own run; then MAX_STOPPED_RUNS automatic ones. Now it waits for a tap.
      this.drop(language);
      this.gaveUpOn.add(language);
      return null;
    }
    if (prev?.timer != null) this.ports.clearTimer(prev.timer);
    const attempt = (prev?.attempt ?? 0) + 1;
    let delay = downloadRetryDelayMs(attempt);
    const full = (prev?.full ?? []).filter((t) => t > now - DAY_MS);
    if (FULL_REDOWNLOAD.has(reason)) {
      // At most MAX_FULL_RETRIES_PER_DAY in any 24 hours: wait until the oldest one leaves the window.
      const inWindow = full.filter((t) => t > now + delay - DAY_MS);
      if (inWindow.length >= MAX_FULL_RETRIES_PER_DAY) delay = Math.max(delay, inWindow[inWindow.length - MAX_FULL_RETRIES_PER_DAY] + DAY_MS - now);
      full.push(now + delay);
    }
    const entry: Entry = { attempt, stopped, full, dueAt: now + delay, timer: null };
    entry.timer = this.ports.setTimer(() => this.fire(language), delay);
    this.entries.set(language, entry);
    return delay;
  }

  /** The download finished: nothing more to retry. */
  succeeded(language: L): void {
    this.clear(language);
  }

  /** True when the automatic retries stopped for this language and wait for the person's Try again. */
  gaveUp(language: L): boolean {
    return this.gaveUpOn.has(language);
  }

  /** The person asked again (Try again, Download): the count starts over. */
  asked(language: L): void {
    this.clear(language);
  }

  /** Ends the chain and forgets a give-up (a success, a tap, the files removed, the queue stopped). */
  clear(language: L): void {
    this.gaveUpOn.delete(language);
    this.drop(language);
  }

  /** Ends the scheduled chain only; a give-up stays until a tap or a success. */
  private drop(language: L): void {
    const e = this.entries.get(language);
    if (e?.timer != null) this.ports.clearTimer(e.timer);
    this.entries.delete(language);
  }

  clearAll(): void {
    for (const language of [...this.entries.keys()]) this.clear(language);
  }

  /** The app is back in the foreground: retries that came due while it was away (or before a yes) run now. */
  foreground(): void {
    const now = this.ports.now();
    for (const [language, e] of this.entries) {
      if (e.timer === null && e.dueAt <= now && this.ports.allowed()) this.run(language, e);
    }
  }

  /** For tests and Settings: the next automatic retry, if one is scheduled or due. */
  pending(language: L): { attempt: number; dueAt: number; waiting: boolean } | null {
    const e = this.entries.get(language);
    return e ? { attempt: e.attempt, dueAt: e.dueAt, waiting: e.timer === null } : null;
  }

  private fire(language: L): void {
    const e = this.entries.get(language);
    if (!e) return;
    e.timer = null;
    if (!this.ports.allowed()) return; // waits for foreground()
    this.run(language, e);
  }

  /** One request at a time: until it reports back (failed or succeeded), nothing asks again. */
  private run(language: L, e: Entry): void {
    e.dueAt = Number.POSITIVE_INFINITY;
    this.ports.request(language);
  }
}
