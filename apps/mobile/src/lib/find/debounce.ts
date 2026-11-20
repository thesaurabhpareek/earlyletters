/**
 * When a typed query runs (NS-02 O-1, card section 8): 150 ms after the last keystroke, counted inside R2's 300 ms to
 * the first row. #798 searched on every keystroke. A query that cannot run yet (empty, under three characters: R3)
 * applies at once and cancels a pending run, so clearing the field never waits. Pure: timers are injected, and the
 * screen holds one per Find session (BL-952 slice 8). The query is held in memory only, never stored (R14).
 */
import { prepareQuery } from './query';

export const FIND_DEBOUNCE_MS = 150;

export interface Timers {
  set(fn: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}
const systemTimers: Timers = { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) };

export interface QueryDebounce {
  /** The field changed. */
  push(raw: string): void;
  /** The return key: run what is typed now. */
  flush(): void;
  /** Find closed: nothing runs after this. */
  dispose(): void;
}

export function createQueryDebounce(run: (raw: string) => void, opts: { delayMs?: number; timers?: Timers } = {}): QueryDebounce {
  const delay = opts.delayMs ?? FIND_DEBOUNCE_MS;
  const timers = opts.timers ?? systemTimers;
  let handle: unknown = null;
  let pending: string | null = null;
  let disposed = false;
  const cancel = () => {
    if (handle !== null) timers.clear(handle);
    handle = null;
  };
  const fire = () => {
    cancel();
    if (disposed || pending === null) return;
    const raw = pending;
    pending = null;
    run(raw);
  };
  return {
    push(raw) {
      if (disposed) return;
      pending = raw;
      if (prepareQuery(raw).kind === 'none') return fire();
      cancel();
      handle = timers.set(fire, delay);
    },
    flush: fire,
    dispose() {
      disposed = true;
      pending = null;
      cancel();
    },
  };
}
