/**
 * The analytics client. The only `track()` the app may call.
 *
 * Guarantees (each has a test in test/analytics.test.ts):
 * 1. Before consent is granted, `track()` is a no-op: nothing is queued,
 *    nothing reaches the provider (LEGAL-REQ-003, PRD 6.9).
 * 2. Unknown events are dropped; unknown properties are stripped; enum,
 *    bool and int properties are checked against the catalogue
 *    (LEGAL-REQ-017).
 * 3. Free text, PII-like strings and strings over 40 characters drop the
 *    whole event.
 * 4. `revoke()` clears the queue, opts the provider out, resets its
 *    identity and retires the random id, within the session (PRD-REQ-018).
 * 5. Violations are reported without values.
 */
import { EVENTS, SCHEMA_VERSION, type Catalog, type EventName } from './catalog';
import { ConsentStore, defaultRandomId, memoryStorage, type ConsentStatus, type KeyValueStorage } from './consent';
import type { AnalyticsProvider } from './provider';
import type { PropsOf } from './schema';
import { sanitizeEvent, type Props, type Violation } from './validate';

export type EventProps<E extends EventName> = PropsOf<Catalog[E]['props']>;

export type TrackResult =
  | 'queued'
  | 'dropped_no_consent'
  | 'dropped_invalid'
  | 'dropped_sampled';

export interface QueuedEvent {
  name: EventName;
  props: Props;
}

export interface AnalyticsOptions {
  provider: AnalyticsProvider;
  /** Where consent and the random id persist. Defaults to memory (tests). */
  storage?: KeyValueStorage;
  randomId?: () => string;
  /** Called for every allowlist violation. Throw here in dev builds. */
  onViolation?: (v: Violation) => void;
  /**
   * Per-event keep rate, 0 to 1, from remote config (TRACKING_PLAN 5).
   * Sampling is deterministic per analytics id, so a person either sends
   * every instance of a sampled event or none.
   */
  sampleRates?: Partial<Record<EventName, number>>;
  /** Queue cap in bytes of JSON (PRD 7.7: 1 MB). Oldest dropped first. */
  maxQueueBytes?: number;
  /** Auto-flush interval (PRD 7.7: at most every 60 s). 0 disables. */
  flushIntervalMs?: number;
  timers?: {
    setInterval: (fn: () => void, ms: number) => unknown;
    clearInterval: (handle: unknown) => void;
  };
}

export interface Analytics {
  /** Load persisted consent. Call once at startup; never awaits network. */
  init(): Promise<ConsentStatus>;
  consent(): ConsentStatus;
  /** The user said yes. Opts the provider in and identifies with a random id. */
  grant(): Promise<void>;
  /** The user said no, or withdrew in Settings > Privacy. */
  revoke(): Promise<void>;
  track<E extends EventName>(name: E, props: EventProps<E>): TrackResult;
  /** Sets `child_count_bucket`, sent on every event (never a person property). */
  setChildCount(count: number): void;
  flush(): Promise<void>;
  queueLength(): number;
  /** Current and retired ids, for the account-deletion request (PRD-REQ-018). */
  analyticsIds(): string[];
  /** After deletion is requested upstream: forget all ids locally. */
  forgetIds(): Promise<void>;
}

export const DEFAULT_MAX_QUEUE_BYTES = 1024 * 1024;
export const DEFAULT_FLUSH_INTERVAL_MS = 60_000;

export function childCountBucket(count: number): 'none' | 'one' | 'two' | 'three_plus' {
  if (!Number.isFinite(count) || count <= 0) return 'none';
  if (count === 1) return 'one';
  if (count === 2) return 'two';
  return 'three_plus';
}

/** FNV-1a, 32 bit. Deterministic, dependency-free, fine for sampling. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function createAnalytics(options: AnalyticsOptions): Analytics {
  const provider = options.provider;
  const store = new ConsentStore(options.storage ?? memoryStorage(), options.randomId ?? defaultRandomId);
  const report = options.onViolation ?? (() => {});
  const maxBytes = options.maxQueueBytes ?? DEFAULT_MAX_QUEUE_BYTES;
  const intervalMs = options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
  const timers = options.timers ?? {
    setInterval: (fn: () => void, ms: number) => globalThis.setInterval(fn, ms),
    clearInterval: (h: unknown) => globalThis.clearInterval(h as ReturnType<typeof setInterval>),
  };

  let queue: { evt: QueuedEvent; bytes: number }[] = [];
  let queueBytes = 0;
  let childBucket: ReturnType<typeof childCountBucket> | undefined;
  let timer: unknown = null;
  // Incremented on every revoke so an in-flight flush can notice.
  let epoch = 0;

  function clearQueue() {
    queue = [];
    queueBytes = 0;
  }

  function startTimer() {
    if (intervalMs > 0 && timer === null) timer = timers.setInterval(() => void flush(), intervalMs);
  }

  function stopTimer() {
    if (timer !== null) timers.clearInterval(timer);
    timer = null;
  }

  async function connect(id: string) {
    await provider.optIn();
    await provider.identify(id);
    startTimer();
  }

  async function init() {
    const snap = await store.load();
    if (snap.status === 'granted' && store.id) await connect(store.id);
    else await provider.optOut();
    return snap.status;
  }

  async function grant() {
    const id = await store.grant();
    await connect(id);
  }

  async function revoke() {
    epoch++;
    clearQueue();
    stopTimer();
    await store.revoke();
    await provider.optOut();
    await provider.reset();
  }

  function track<E extends EventName>(name: E, props: EventProps<E>): TrackResult {
    if (store.status !== 'granted' || !store.id) return 'dropped_no_consent';

    const rate = options.sampleRates?.[name];
    let samplePct: number | undefined;
    if (rate !== undefined && rate < 1) {
      const keep = rate > 0 && hash(`${store.id}:${name}`) % 10_000 < Math.round(rate * 10_000);
      if (!keep) return 'dropped_sampled';
      samplePct = Math.min(99, Math.max(1, Math.round(rate * 100)));
    }

    const withGlobals: Record<string, unknown> = {
      ...(props as Record<string, unknown>),
      schema_version: SCHEMA_VERSION,
      ...(childBucket ? { child_count_bucket: childBucket } : {}),
      ...(samplePct !== undefined ? { sample_pct: samplePct } : {}),
    };
    const { props: clean, violations } = sanitizeEvent(name, withGlobals);
    violations.forEach(report);
    if (!clean) return 'dropped_invalid';

    const evt: QueuedEvent = { name, props: clean };
    const bytes = JSON.stringify(evt).length;
    queue.push({ evt, bytes });
    queueBytes += bytes;
    while (queueBytes > maxBytes && queue.length > 0) {
      const dropped = queue.shift()!;
      queueBytes -= dropped.bytes;
      report({ kind: 'queue_overflow', event: dropped.evt.name });
    }
    return 'queued';
  }

  async function flush() {
    if (store.status !== 'granted') {
      clearQueue();
      return;
    }
    const started = epoch;
    const batch = queue;
    clearQueue();
    for (const { evt } of batch) {
      if (epoch !== started || store.status !== 'granted') return;
      await provider.capture(evt.name, evt.props);
    }
    if (epoch === started) await provider.flush();
  }

  return {
    init,
    consent: () => store.status,
    grant,
    revoke,
    track,
    setChildCount: (count) => {
      childBucket = childCountBucket(count);
    },
    flush,
    queueLength: () => queue.length,
    analyticsIds: () => store.allIds(),
    forgetIds: () => store.forgetAllIds(),
  };
}

/** Exposed for docs tooling and tests. */
export const EVENT_NAMES = Object.keys(EVENTS) as EventName[];
