/**
 * The analytics client. The only `track()` the app may call.
 *
 * Guarantees (each has a test in test/analytics.test.ts):
 * 1. Before consent is granted, `track()` is a no-op: nothing is queued,
 *    nothing reaches the provider (LEGAL-REQ-003, PRD 6.9). That is the
 *    `ask_first` policy, the default. `track()` asks the gate (gate.ts)
 *    instead of reading consent itself; `collect_by_default` is reachable
 *    only when the caller passes it (ER-A03, BL-1238).
 * 2. Unknown events are dropped; unknown properties are stripped; enum,
 *    bool and int properties are checked against the catalogue
 *    (LEGAL-REQ-017). A missing or invalid required property drops the
 *    event and is counted in `violationCounts()` (PDATA-03).
 * 3. Free text, PII-like strings and strings over 40 characters drop the
 *    whole event.
 * 4. `revoke()` clears the queue, opts the provider out, resets its
 *    identity and retires the random id, within the session (PRD-REQ-018).
 * 5. Violations are reported without values.
 */
import { EVENTS, SCHEMA_VERSION, type Catalog, type EventName } from './catalog';
import type { AnalyticsGate, BasicsPolicy, EventTier, GateDropReason } from './contracts';
import { createGate } from './gate';
import { ConsentStore, defaultRandomId, memoryStorage, type ConsentStatus, type ConsentSurface, type KeyValueStorage, type PendingConsentAct } from './consent';
import type { AnalyticsProvider } from './provider';
import type { PropsOf } from './schema';
import { sanitizeEvent, type Props, type Violation, type ViolationKind } from './validate';

export type EventProps<E extends EventName> = PropsOf<Catalog[E]['props']>;

export type TrackResult =
  | 'queued'
  | 'dropped_no_consent'
  | 'dropped_not_basics'
  | 'dropped_user_off'
  | 'dropped_disclosure_pending'
  | 'dropped_invalid'
  | 'dropped_sampled';

export interface QueuedEvent {
  name: EventName;
  props: Props;
}

export interface AnalyticsOptions {
  provider: AnalyticsProvider;
  /**
   * The resolved policy (`resolveBasicsPolicy`). Default and any unrecognised value: `ask_first`. Nothing in the
   * build passes `collect_by_default` today; the flip is the founder's (D-163, D-170).
   */
  basicsPolicy?: BasicsPolicy;
  /** Tier of each event. Default: every event is `consented`, so under `collect_by_default` none passes until the registry sets `basics`. */
  tierOf?: (name: EventName) => EventTier;
  /** Where consent and the random id persist. Defaults to memory (tests). */
  storage?: KeyValueStorage;
  randomId?: () => string;
  /** Forget one retired id on the server; true only when acknowledged (ER-A04). Unset keeps every retired id. */
  forgetRetiredId?: (id: string) => boolean | Promise<boolean>;
  /** Consent version this build asks for ("major.minor"). A newer major asks again (TDD 05 X-13). */
  consentVersion?: string;
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
  grant(surface?: ConsentSurface): Promise<void>;
  /** The user said no, or withdrew in Settings > Privacy. */
  revoke(surface?: ConsentSurface): Promise<void>;
  /** The in-app disclosure has been shown: record it. Under `collect_by_default` no event passes before this. */
  recordDisclosureShown(): Promise<void>;
  disclosureShown(): boolean;
  /** Events the gate refused this session, by reason code only (never a value). */
  dropCounts(): Readonly<Partial<Record<GateDropReason, number>>>;
  /** Answers not yet uploaded through `record_policy_act`, oldest first (only when a surface was passed). */
  pendingActs(): PendingConsentAct[];
  /** Drop the first `count` pending acts after the server has them. */
  acknowledgeActs(count: number): Promise<void>;
  track<E extends EventName>(name: E, props: EventProps<E>): TrackResult;
  /** Sets `child_count_bucket`, sent on every event (never a person property). */
  setChildCount(count: number): void;
  flush(): Promise<void>;
  queueLength(): number;
  /** Current and retired ids, for the account-deletion request (PRD-REQ-018). */
  analyticsIds(): string[];
  /** After deletion is requested upstream: forget all ids locally. */
  forgetIds(): Promise<void>;
  /**
   * Allowlist violations seen this session, by kind (PDATA-03). Counts only,
   * never values, so a dev screen or health check can show them safely.
   */
  violationCounts(): Readonly<Partial<Record<ViolationKind, number>>>;
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
  const store = new ConsentStore(options.storage ?? memoryStorage(), options.randomId ?? defaultRandomId, { currentVersion: options.consentVersion, forgetRetired: options.forgetRetiredId });
  const policy: BasicsPolicy = options.basicsPolicy === 'collect_by_default' ? 'collect_by_default' : 'ask_first';
  const tierOf = options.tierOf ?? ((): EventTier => 'consented');
  const gate: AnalyticsGate = createGate({ policy, status: () => store.status, disclosureShown: () => store.disclosureShown });
  const drops: Partial<Record<GateDropReason, number>> = {};
  let connected = false;
  const counts: Partial<Record<ViolationKind, number>> = {};
  const onViolation = options.onViolation;
  const report = (v: Violation) => {
    counts[v.kind] = (counts[v.kind] ?? 0) + 1;
    onViolation?.(v);
  };
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
    connected = true;
    startTimer();
  }

  async function init() {
    const snap = await store.load();
    if (snap.status === 'granted' && store.id) await connect(store.id);
    else await provider.optOut();
    return snap.status;
  }

  async function grant(surface?: ConsentSurface) {
    const id = await store.grant(surface);
    await connect(id);
  }

  async function revoke(surface?: ConsentSurface) {
    epoch++;
    clearQueue();
    stopTimer();
    connected = false;
    await store.revoke(surface);
    await provider.optOut();
    await provider.reset();
    // After the person's off is complete: a slow forget call must never delay it.
    await store.settleRetired();
  }

  function track<E extends EventName>(name: E, props: EventProps<E>): TrackResult {
    // Only the exact string 'basics' is basics: an undefined, misspelt or missing tier is consented (ER-B02).
    const decision = gate.decide(name, tierOf(name) === 'basics' ? 'basics' : 'consented');
    if (!decision.allow) {
      drops[decision.reason] = (drops[decision.reason] ?? 0) + 1;
      return decision.reason as Exclude<TrackResult, 'queued' | 'dropped_invalid' | 'dropped_sampled'>;
    }
    // The id is minted here, the first time the gate allows an event, and not before (ER-A04).
    const installId = store.ensureId();

    const rate = options.sampleRates?.[name];
    let samplePct: number | undefined;
    if (rate !== undefined && rate < 1) {
      const keep = rate > 0 && hash(`${installId}:${name}`) % 10_000 < Math.round(rate * 10_000);
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
    startTimer();
    queueBytes += bytes;
    while (queueBytes > maxBytes && queue.length > 0) {
      const dropped = queue.shift()!;
      queueBytes -= dropped.bytes;
      report({ kind: 'queue_overflow', event: dropped.evt.name });
    }
    return 'queued';
  }

  async function flush() {
    // The lowest bar the gate has: closed means the person is off, or no yes under ask_first. Queued events go.
    if (!gate.decide('flush', 'basics').allow) {
      clearQueue();
      return;
    }
    try {
      await store.settled();
    } catch {
      // The id could not be stored, so it could never be forgotten later: send nothing under it.
      clearQueue();
      return;
    }
    const started = epoch;
    if (!connected && store.id && queue.length > 0) await connect(store.id);
    const batch = queue;
    clearQueue();
    for (const { evt } of batch) {
      if (epoch !== started || !gate.decide('flush', 'basics').allow) return;
      await provider.capture(evt.name, evt.props);
    }
    if (epoch === started) await provider.flush();
  }

  return {
    init,
    consent: () => store.status,
    grant,
    revoke,
    recordDisclosureShown: () => store.recordDisclosure(),
    disclosureShown: () => store.disclosureShown,
    dropCounts: () => ({ ...drops }),
    pendingActs: () => store.pendingActs(),
    acknowledgeActs: (count) => store.acknowledgeActs(count),
    track,
    setChildCount: (count) => {
      childBucket = childCountBucket(count);
    },
    flush,
    queueLength: () => queue.length,
    analyticsIds: () => store.allIds(),
    forgetIds: () => store.forgetAllIds(),
    violationCounts: () => ({ ...counts }),
  };
}

/** Exposed for docs tooling and tests. */
export const EVENT_NAMES = Object.keys(EVENTS) as EventName[];
