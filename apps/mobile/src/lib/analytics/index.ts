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
 *   1. `startAnalytics({ ttfiMs })` once, after the first frame, never
 *      awaited by UI; then `startAnalyticsObservers()` (./observers).
 *   2. `useScreenViews()` once in the root layout (./use-screen-views).
 *   3. The ask sequencer shows `<AnalyticsConsentSheet>` when
 *      `analyticsAskDue(...)` says so (./ask).
 *   4. Sentry, when added, initialises only while `analyticsConsent()` is
 *      'granted' (one switch, LEGAL-REQ-003).
 * Screens: `@/lib/analytics/track` (call sites in TRACKING_PLAN section 9).
 */
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { AppState } from 'react-native';
import {
  createAnalytics,
  createLazyPostHogAdapter,
  createLifecycle,
  buildPostHogOptions,
  createBasics,
  createTrackers,
  keepAllowedAppProperties,
  noopProvider,
  posthogHostFor,
  type ConsentStatus,
  type KeyValueStorage,
  type PostHogLike,
  type Violation,
} from '@scribe/analytics';
import { currentAuthUserId } from '@/lib/auth/auth-store';
import { analyticsEnabled, capabilities, postHogKeyForBuild } from '@/lib/capabilities';
import { deleteSetting, getSetting, listChildren, listEntriesForChild, setSetting, subscribe } from '@/lib/store';

// EXPO_PUBLIC_ANALYTICS off (every profile but production, lib/capabilities.ts): no key, so the provider is the no-op and PostHog is never loaded.
const KEY = postHogKeyForBuild(analyticsEnabled(), process.env.EXPO_PUBLIC_POSTHOG_KEY);
/**
 * PostHog Cloud ingestion host from `EXPO_PUBLIC_POSTHOG_REGION` (`us` or `eu`; US when unset). The project key and
 * the region come from the EAS environment, never from a committed file; anything but `eu` is US, so the environment
 * can never point the app at an arbitrary host.
 */
const HOST = posthogHostFor(process.env.EXPO_PUBLIC_POSTHOG_REGION);

/** Device settings table as the analytics key-value store (synchronous SQLite). */
export const settingsStorage: KeyValueStorage = {
  get: (k) => getSetting(k),
  set: (k, v) => setSetting(k, v),
  remove: (k) => deleteSetting(k),
};

/**
 * An event or property that is not in the registry (packages/analytics registry.ts) is dropped by the validator and
 * counted (`analytics.violationCounts()`); in a development build the kind is also logged, never a value, so the
 * stray call site is found. Nothing throws: a held event still called by a screen must not break the app.
 */
function onViolation(v: Violation): void {
  if (__DEV__ && v.kind !== 'queue_overflow') console.warn(`analytics_dropped:${v.kind}:${v.event}:${v.property ?? ''}`);
}

/**
 * The PostHog client factory: builds the SDK only after a yes (createLazyPostHogAdapter), with the options pinned in
 * packages/analytics `buildPostHogOptions` (opt-in default off, file persistence, no lifecycle events, no flags, no
 * geoip, no replay, no autocapture, `before_send` as the last allowlist gate, crash capture off until crash.ts is
 * flipped). `posthog-react-native` is imported here and nowhere else.
 */
type PostHogClientFactory = (distinctId: string) => Promise<PostHogLike>;
const createClient: PostHogClientFactory | null = async (distinctId) => {
  const PostHog = (await import('posthog-react-native')).default;
  const options = {
    ...buildPostHogOptions({ host: HOST, distinctId, onViolation }),
    // The app version and build come from expo-constants (already a dependency), so no extra package is needed; the
    // device name, locale and time zone the SDK reads are dropped here and again by `before_send`.
    customAppProperties: (props: Parameters<typeof keepAllowedAppProperties>[0]) =>
      keepAllowedAppProperties({ ...props, $app_version: Constants.nativeAppVersion ?? props.$app_version, $app_build: Constants.nativeBuildVersion ?? props.$app_build }),
  };
  // The adapter's `before_send` is typed on the minimal event shape; the SDK's CaptureEvent is a superset.
  return new PostHog(KEY, options as unknown as ConstructorParameters<typeof PostHog>[1]) as unknown as PostHogLike;
};

const provider = KEY && createClient ? createLazyPostHogAdapter({ create: createClient }) : noopProvider;

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
/** Key taps, surface impressions and timed steps (registered ids only). */
export const basics = createBasics(analytics);

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
    signedIn: currentAuthUserId() !== null,
    // Contributors join through the web page, which is v1.1; in the app everyone is a parent at v1.0.
    role: 'parent' as const,
    // TODO(invites owner): read the "joined from an invite" app state once invites set it.
    cameFromInvite: false,
  };
}

/** Yes on the consent sheet or the Settings toggle. */
export async function grantAnalytics(surface: 'consent_sheet' | 'settings'): Promise<void> {
  // No yes can be recorded in a build without analytics (v1.0): there is nothing to say yes to.
  if (!capabilities.analytics) return;
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

/**
 * An under-18 answer at sign-in (LEGAL-REQ-002): stop collecting at once,
 * quietly. Nothing about the answer is sent; the 18+ gate closes the app.
 */
export async function stopAnalyticsForUnder18(): Promise<void> {
  if (analytics.consent() !== 'granted') return;
  await analytics.revoke();
  notify();
}

/**
 * Erase everything on this phone (BL-387, DATA-REQ-024): stop collecting at once and forget every id, quietly.
 * Nothing is sent about it: no consent event, no last flush (revoke clears the queue). The settings rows that held
 * the choice and the ids are wiped with the rest.
 */
export async function stopAnalyticsForErase(): Promise<void> {
  if (analytics.consent() === 'granted') await analytics.revoke();
  await analytics.forgetIds();
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
  // v1.0: no analytics at all, not even `app_opened` to a no-op (lib/capabilities.ts).
  if (!capabilities.analytics) return;
  try {
    await analytics.init();
    analytics.setChildCount(listChildren().length);
    await lifecycle.launch({ ttfiMs: opts.ttfiMs });
    AppState.addEventListener('change', (state) => {
      if (state === 'background') void lifecycle.background();
      else if (state === 'active') {
        void lifecycle.foreground().then((fresh) => {
          if (fresh) basics.newSession(); // one impression per surface per foreground session
        });
      }
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
