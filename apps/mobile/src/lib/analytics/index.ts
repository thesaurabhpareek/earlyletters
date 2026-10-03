/**
 * Opt-in product analytics for the app (ADR 0008, TRACKING_PLAN.md, TDD 01
 * 3.11). Owner: analytics engineer. Screens import from here (or from
 * ./track), never from `posthog-react-native`.
 *
 * - Nothing is sent, queued or stored by an SDK before the person says yes
 *   (LEGAL-REQ-003). With consent unknown or declined, the PostHog SDK is not
 *   even loaded.
 * - Without `EXPO_PUBLIC_POSTHOG_KEY` (dev, web preview, CI) the provider is
 *   a no-op; the consent UI still works.
 * - Consent status, the random id and two local times live in the device
 *   `settings` table (all L2, DATA_CLASSIFICATION 4.5).
 *
 * Coordinator wiring (this file does not edit the root layout):
 *   1. `startAnalytics()` once, after the first frame, never awaited by UI.
 *   2. `useScreenViews()` once in the root layout (./use-screen-views).
 *   3. The ask sequencer shows `<AnalyticsConsentSheet>` when
 *      `analyticsAskDue(...)` says so (./ask).
 */
import * as Crypto from 'expo-crypto';
import { AppState } from 'react-native';
import {
  createAnalytics,
  createLazyPostHogAdapter,
  createLifecycle,
  createTrackers,
  noopProvider,
  type ConsentStatus,
  type KeyValueStorage,
  type Violation,
} from '@scribe/analytics';
import { currentUserId, deleteSetting, getSetting, listChildren, listEntriesForChild, setSetting, subscribe } from '@/lib/store';

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
/** PostHog US Cloud ingestion host (users and Supabase are in the US). */
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

/** Device settings table as the analytics key-value store (synchronous SQLite). */
export const settingsStorage: KeyValueStorage = {
  get: (k) => getSetting(k),
  set: (k, v) => setSetting(k, v),
  remove: (k) => deleteSetting(k),
};

/** Development builds throw on a catalogue violation so the bug is seen at once. Never a value in the message. */
function onViolation(v: Violation): void {
  if (__DEV__ && v.kind !== 'queue_overflow') throw new Error(`analytics_violation:${v.kind}:${v.event}:${v.property ?? ''}`);
}

const provider = KEY
  ? createLazyPostHogAdapter({
      create: async (id) => (await import('./posthog-sdk')).createPostHogClient(KEY, HOST, id, onViolation),
    })
  : noopProvider;

export const analytics = createAnalytics({
  provider,
  storage: settingsStorage,
  randomId: Crypto.randomUUID,
  onViolation,
  // Sampling rates come from remote config when volume needs it (TRACKING_PLAN 5.3); empty at launch.
  sampleRates: {},
});

export const lifecycle = createLifecycle({ analytics, storage: settingsStorage });
export const trackers = createTrackers(analytics);

// ---------------------------------------------------------------------------
// Consent state for screens
// ---------------------------------------------------------------------------

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Subscribe to consent changes (Settings > Privacy toggle, consent sheet). */
export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function analyticsConsent(): ConsentStatus {
  return analytics.consent();
}

/**
 * Legal record of the choice (`record_policy_act`, TDD 01 3.11.4) belongs to
 * the consent and sign-in owners: they register a recorder here. Analytics
 * behaviour never waits for it.
 */
type ConsentRecorder = (act: 'accept' | 'decline' | 'withdraw', surface: 'consent_sheet' | 'settings') => void;
let recordConsent: ConsentRecorder = () => {};
export function setAnalyticsConsentRecorder(fn: ConsentRecorder): void {
  recordConsent = fn;
}

/** First-run facts the app already keeps, summarised as buckets at opt-in (TRACKING_PLAN section 2). */
function optedInSummary(surface: 'consent_sheet' | 'settings') {
  let letters = 0;
  let first: { at: number; mode: 'spoken' | 'typed' } | null = null;
  for (const child of listChildren()) {
    for (const e of listEntriesForChild(child.id)) {
      if (e.kind === 'not_much') continue;
      letters++;
      const at = Date.parse(e.capturedAt);
      if (Number.isFinite(at) && (!first || at < first.at)) first = { at, mode: e.captureMode === 'spoken' ? 'spoken' : 'typed' };
    }
  }
  return {
    surface,
    now: Date.now(),
    firstLaunchAt: lifecycle.firstLaunchAt(),
    firstLetterAt: first?.at ?? null,
    firstLetterMode: first?.mode ?? null,
    letters,
    signedIn: currentUserId() !== null,
    // Contributors join through the web page, which is v1.1; in the app everyone is a parent at v1.0.
    role: 'parent' as const,
    // TODO(invites owner): read the "joined from an invite" app state once invites set it.
    cameFromInvite: false,
  };
}

/** Yes on the consent sheet or the Settings toggle. */
export async function grantAnalytics(surface: 'consent_sheet' | 'settings'): Promise<void> {
  await analytics.grant();
  trackers.trackAnalyticsOptedIn(optedInSummary(surface));
  analytics.setChildCount(listChildren().length);
  recordConsent('accept', surface);
  notify();
}

/** No on the consent sheet. Same effect as never answering, but remembered. */
export async function declineAnalytics(): Promise<void> {
  await analytics.revoke();
  recordConsent('decline', 'consent_sheet');
  notify();
}

/** Off in Settings > Privacy: stops sending within the session (PRD-REQ-018). */
export async function withdrawAnalytics(): Promise<void> {
  await analytics.revoke();
  recordConsent('withdraw', 'settings');
  notify();
}

/** For the account-deletion request (TDD 05 X-02 `analytics-forget`): current and retired ids. */
export function analyticsIdsForDeletion(): string[] {
  return analytics.analyticsIds();
}

/** After the deletion request is accepted upstream. */
export async function forgetAnalyticsIds(): Promise<void> {
  await analytics.forgetIds();
  notify();
}

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

let started = false;

/**
 * Call once from the root layout after the first frame (A-NFR-002); do not
 * await it in render. Loads the stored choice (no network unless it was a
 * yes), sends `app_opened`, and follows AppState for sessions and flushes.
 */
export async function startAnalytics(opts: { ttfiMs?: number } = {}): Promise<void> {
  if (started) return;
  started = true;
  try {
    await analytics.init();
    analytics.setChildCount(listChildren().length);
    await lifecycle.launch({ ttfiMs: opts.ttfiMs });
    AppState.addEventListener('change', (state) => {
      if (state === 'background') void lifecycle.background();
      else if (state === 'active') void lifecycle.foreground();
    });
    let children = listChildren().length;
    subscribe(() => {
      const n = listChildren().length;
      if (n !== children) analytics.setChildCount((children = n));
    });
    notify();
  } catch {
    // Analytics must never break the app. Nothing to report: there is no consent-free channel.
  }
}
