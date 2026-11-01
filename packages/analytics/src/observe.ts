/**
 * Observers: turn other modules' public state changes into catalogue events,
 * so most events need no call in another owner's screen. Pure and tested
 * (test/observe.test.ts); the app connects them in
 * apps/mobile/src/lib/analytics/observers.ts.
 *
 * Each observer keeps only the previous value it needs to see a change, in
 * memory. Shapes are structural copies of the app types (the package cannot
 * import the app); the app's wiring file type-checks against the real ones.
 */
import { hourBucket } from './buckets';
import type { Catalog } from './catalog';
import type { Analytics, EventProps, TrackResult } from './client';
import { createTrackers } from './trackers';

type V<E extends keyof Catalog, P extends keyof Catalog[E]['props']> = Catalog[E]['props'][P] extends { values: readonly (infer X)[] } ? X : never;
type Track = Pick<Analytics, 'track'>;

// ---------------------------------------------------------------------------
// Auth (apps/mobile src/lib/auth machine.logic.ts AuthState)
// ---------------------------------------------------------------------------

export type AuthMethodValue = V<'auth_method_selected', 'method'>;

export type AuthLike =
  | { status: 'restoring' }
  | { status: 'signedOut'; error?: string }
  | { status: 'signingIn'; method: AuthMethodValue }
  | { status: 'awaitingCode'; sentAt: number; error?: string }
  | { status: 'checkingConsent'; method: AuthMethodValue | null }
  | { status: 'needsConsent'; method: AuthMethodValue | null; error?: string }
  | { status: 'ready' }
  | { status: 'signingOut'; reason: 'user' | 'apple_revoked' | 'switch_account' };

const AUTH_REASONS = new Set<string>([
  'cancelled', 'network', 'expired', 'wrong_code', 'code_paused', 'rate_limited', 'invalid_email',
  'not_available', 'provider', 'session_expired', 'consent_unavailable', 'unknown',
]);
const authReason = (e: string | undefined): V<'auth_failed', 'reason'> =>
  (e && AUTH_REASONS.has(e) ? e : 'unknown') as V<'auth_failed', 'reason'>;

const SIGNED_IN = new Set(['checkingConsent', 'needsConsent', 'ready', 'signingOut']);

export interface AuthObserverOptions {
  /** Letters on this phone at the moment of sign-in (for `had_local_data`). */
  hasLocalLetters: () => boolean;
  /**
   * An under-18 answer: nothing is sent, and the app should stop analytics
   * (the 18+ gate closes too). The analytics agent's wiring revokes consent.
   */
  onUnder18?: () => void;
}

export function createAuthObserver(a: Track, opts: AuthObserverOptions): (next: AuthLike) => void {
  let prev: AuthLike = { status: 'restoring' };
  let method: AuthMethodValue | null = null;
  let attempts = 0;

  return (next) => {
    const p = prev;
    prev = next;
    if (next.status === 'signedOut' && next.error === 'under_18') {
      opts.onUnder18?.();
      return;
    }
    if (next.status === 'signingIn' && (p.status !== 'signingIn' || p.method !== next.method)) {
      method = next.method;
      attempts = 0;
      a.track('auth_method_selected', { method: next.method });
      return;
    }
    if (next.status === 'awaitingCode') {
      if (p.status !== 'awaitingCode' || p.sentAt !== next.sentAt) {
        attempts = Math.min(10, attempts + 1);
        a.track('auth_email_sent', { attempt: attempts });
      } else if (next.error && next.error !== p.error) {
        a.track('auth_failed', { method: 'email', reason: authReason(next.error) });
      }
      return;
    }
    if (next.status === 'signedOut' && (p.status === 'signingIn' || p.status === 'awaitingCode')) {
      a.track('auth_failed', { method: method ?? (p.status === 'awaitingCode' ? 'email' : 'apple'), reason: next.error ? authReason(next.error) : 'cancelled' });
      return;
    }
    if (next.status === 'checkingConsent' && next.method && !SIGNED_IN.has(p.status)) {
      a.track('auth_succeeded', { method: next.method, had_local_data: opts.hasLocalLetters() });
      return;
    }
    if (next.status === 'signedOut' && SIGNED_IN.has(p.status)) {
      const reason = p.status === 'signingOut' ? p.reason : 'session_lost';
      a.track('signed_out', { reason });
    }
  };
}

// ---------------------------------------------------------------------------
// Spoken languages (src/lib/language getSpokenLanguages)
// ---------------------------------------------------------------------------

/**
 * Codes in order, primary first. The first observation only records the
 * starting point (no events), so launch never reports the languages a person
 * already had.
 */
export function createLanguageObserver(a: Track): (codes: readonly string[]) => void {
  const t = createTrackers(a);
  let prev: readonly string[] | null = null;
  return (codes) => {
    if (prev === null) {
      prev = [...codes];
      return;
    }
    const before = new Set(prev);
    const after = new Set(codes);
    for (const c of codes) if (!before.has(c)) t.trackLanguageSet({ lang: c, action: 'added' });
    for (const c of prev) if (!after.has(c)) t.trackLanguageSet({ lang: c, action: 'removed' });
    if (codes[0] && prev[0] && codes[0] !== prev[0] && before.has(codes[0])) t.trackLanguageSet({ lang: codes[0], action: 'made_primary' });
    prev = [...codes];
  };
}

// ---------------------------------------------------------------------------
// Pack downloads (src/lib/packs onProgress PackProgress)
// ---------------------------------------------------------------------------

export interface PackProgressLike {
  id: string;
  version: number | null;
  phase: 'queued' | 'waiting_for_wifi' | 'downloading' | 'verifying' | 'installing' | 'installed' | 'failed' | 'cancelled' | 'removed';
  failure?: V<'pack_download', 'failure'>;
}

/**
 * started: the first `downloading` of a job; completed: `installed`; failed:
 * `failed` or `cancelled`; removed: `removed`. Waiting for Wi-Fi is not a
 * failure. Progress ticks are ignored.
 */
export function createPackObserver(a: Track, network: () => V<'pack_download', 'network'>): (p: PackProgressLike) => void {
  const t = createTrackers(a);
  const active = new Map<string, number | null>();
  return (p) => {
    const stage =
      p.phase === 'downloading' && !active.has(p.id)
        ? 'started'
        : p.phase === 'installed'
          ? 'completed'
          : p.phase === 'failed' || p.phase === 'cancelled'
            ? 'failed'
            : p.phase === 'removed'
              ? 'removed'
              : null;
    if (p.phase === 'downloading') active.set(p.id, p.version);
    if (!stage) return;
    const version = p.version ?? active.get(p.id) ?? null;
    if (stage !== 'started') active.delete(p.id);
    // A failure before any download started (no manifest, paused) is still worth counting.
    t.trackPackDownload({ packId: p.id, version, stage, failure: p.phase === 'cancelled' ? 'cancelled' : p.failure, network: network() });
  };
}

// ---------------------------------------------------------------------------
// Plan (src/lib/billing getPlan: view.state, details.period, details.ownership)
// ---------------------------------------------------------------------------

export type PlanStateValue = V<'plan_changed', 'to_state'>;

export interface PlanLike {
  state: PlanStateValue;
  period: 'month' | 'year' | null;
  ownership: 'purchased' | 'familyShared' | null;
  /** StoreKit environment: only production changes are reported (TestFlight sandbox purchases are not real). */
  environment: 'production' | 'sandbox' | 'xcode';
  /** Never read StoreKit yet: the first real read is a baseline, not a change. */
  checked: boolean;
}

export function createPlanObserver(a: Track): (p: PlanLike) => void {
  let prev: PlanStateValue | null = null;
  return (p) => {
    if (!p.checked) return;
    if (prev === null) {
      prev = p.state;
      return;
    }
    if (p.state === prev) return;
    const from = prev;
    prev = p.state;
    if (p.environment !== 'production') return;
    a.track('plan_changed', {
      from_state: from,
      to_state: p.state,
      period: p.period ?? 'unknown',
      ownership: p.ownership === 'familyShared' ? 'family_shared' : p.ownership ?? 'unknown',
    });
  };
}

// ---------------------------------------------------------------------------
// Reminder preferences (src/lib/reminders readPrefs)
// ---------------------------------------------------------------------------

export interface ReminderPrefsLike {
  enabled: boolean;
  paused: boolean;
  cadence: 'off' | 'weekly' | 'fewTimes' | 'everyEvening';
  time: { hour: number; minute: number };
}

/** One event when the cadence, part of day, pause or on/off changes; the first read is a baseline. */
export function createReminderObserver(a: Track): (p: ReminderPrefsLike) => void {
  const t = createTrackers(a);
  let prev: string | null = null;
  return (p) => {
    const key = `${p.enabled}|${p.paused}|${p.cadence}|${hourBucket(p.time.hour)}`;
    if (prev === null || key === prev) {
      prev = key;
      return;
    }
    prev = key;
    t.trackReminderSchedule({ enabled: p.enabled, cadence: p.cadence, hour: p.time.hour, paused: p.paused });
  };
}

// ---------------------------------------------------------------------------
// Notification opened (expo-notifications response data from src/lib/reminders)
// ---------------------------------------------------------------------------

/**
 * Only evening letter reminders are reported. Month-age and birthday notes
 * (`kind` monthAge or birthday) are never reported: their timing reveals the
 * birth date (TRACKING_PLAN 6.4). Unknown payloads send nothing.
 */
export function notificationOpenedEvent(data: unknown): EventProps<'notification_opened'> | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as { kind?: unknown; variant?: unknown };
  if (d.kind !== 'evening') return null;
  const variant = typeof d.variant === 'number' && Number.isInteger(d.variant) && d.variant >= 0 && d.variant <= 99 ? d.variant : undefined;
  return variant === undefined ? { type: 'letter_reminder' } : { type: 'letter_reminder', variant_id: variant };
}

export function trackNotificationOpened(a: Track, data: unknown): TrackResult | 'not_sent' {
  const props = notificationOpenedEvent(data);
  return props ? a.track('notification_opened', props) : 'not_sent';
}
