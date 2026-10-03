/**
 * PostHog adapter and the SDK options we require. No import of
 * `posthog-react-native` here: the app constructs the SDK client and passes a
 * factory in, so this package stays pure TS and the only PostHog import in the
 * repo lives in `apps/mobile/src/lib/analytics/posthog-sdk.ts` (ADR 0008 lint
 * rule).
 *
 * Verified 3 Oct 2026 against the installed source of `posthog-react-native`
 * 4.78.4 (MIT) and `@posthog/core` 1.55.3: option names, defaults, the
 * `before_send` event shape (`{uuid, event, properties, $set, $set_once,
 * timestamp}`), that `optOut()` does not clear the queue, and that `reset()`
 * keeps it. Re-verify when the SDK version changes (POSTHOG_SDK below).
 *
 * Lazy by design (TDD 01 3.11.1, A-NFR-002): the SDK is constructed only when
 * consent is granted, so before a yes no PostHog code runs and nothing can be
 * sent, queued or written to disk.
 */
import type { AnalyticsProvider } from './provider';
import { sanitizeOutgoing, type OutgoingEvent, type Violation } from './validate';

/** The SDK version the options below were checked against. */
export const POSTHOG_SDK = {
  package: 'posthog-react-native',
  verifiedVersion: '4.78.4',
  core: '@posthog/core 1.55.3',
  verifiedOn: '2026-10-03',
} as const;

/** The subset of the PostHog React Native client this adapter uses. */
export interface PostHogLike {
  capture(event: string, properties?: Record<string, unknown>): unknown;
  identify(distinctId?: string, properties?: Record<string, unknown>): unknown;
  optIn(): unknown;
  optOut(): unknown;
  reset(): unknown;
  flush(): unknown;
  /** Public on PostHog RN 4.x; used only to empty the SDK's own queue on withdrawal. */
  setPersistedProperty?(key: string, value: null): void;
}

/** PostHog's persisted-property key for its event queue (`PostHogPersistedProperty.Queue`). */
const POSTHOG_QUEUE_KEY = 'queue';

/** Eager adapter around an already constructed client (tests, Storybook). */
export function createPostHogAdapter(ph: PostHogLike): AnalyticsProvider {
  return {
    optIn: async () => void (await ph.optIn()),
    optOut: async () => {
      await ph.optOut();
      ph.setPersistedProperty?.(POSTHOG_QUEUE_KEY, null);
    },
    // No person properties, ever (LEGAL-REQ-017).
    identify: async (id) => void (await ph.identify(id)),
    capture: async (event, properties) => void (await ph.capture(event, properties)),
    flush: async () => void (await ph.flush()),
    reset: async () => {
      await ph.reset();
      ph.setPersistedProperty?.(POSTHOG_QUEUE_KEY, null);
    },
  };
}

export interface LazyPostHogAdapterOptions {
  /**
   * Builds the SDK client for this consent period's random id. The app passes
   * a function that dynamic-imports the SDK, so its code is not evaluated
   * until the first grant. Called at most once per process.
   */
  create: (distinctId: string) => PostHogLike | Promise<PostHogLike>;
  /** Called (without any value or message) if loading or a call fails. */
  onError?: (stage: 'load' | 'call') => void;
}

export interface LazyPostHogAdapter extends AnalyticsProvider {
  /** True once the SDK has been constructed (only ever after a grant). */
  loaded(): boolean;
}

/**
 * Provider that constructs PostHog on the first `identify` after `optIn`
 * (the client calls them in that order only when consent is granted). Before
 * that every method is a no-op, so `init()` with no consent touches nothing.
 */
export function createLazyPostHogAdapter(opts: LazyPostHogAdapterOptions): LazyPostHogAdapter {
  let ph: PostHogLike | null = null;
  let loading: Promise<PostHogLike | null> | null = null;
  let wanted = false;

  const guard = async (fn: () => unknown) => {
    try {
      await fn();
    } catch {
      opts.onError?.('call');
    }
  };

  const clearSdkQueue = () => {
    try {
      ph?.setPersistedProperty?.(POSTHOG_QUEUE_KEY, null);
    } catch {
      opts.onError?.('call');
    }
  };

  async function load(id: string): Promise<PostHogLike | null> {
    loading ??= (async () => {
      try {
        return await opts.create(id);
      } catch {
        opts.onError?.('load');
        loading = null; // allow a later grant to retry
        return null;
      }
    })();
    return loading;
  }

  return {
    loaded: () => ph !== null,
    optIn: async () => {
      wanted = true;
      if (ph) await guard(() => ph!.optIn());
    },
    optOut: async () => {
      wanted = false;
      if (!ph) return;
      await guard(() => ph!.optOut());
      clearSdkQueue();
    },
    identify: async (id) => {
      if (!wanted) return;
      if (!ph) {
        // The id is bootstrapped at construction, so no $identify event is sent.
        ph = await load(id);
        if (!ph) return;
        await guard(() => ph!.optIn());
        return;
      }
      await guard(() => ph!.optIn());
      await guard(() => ph!.identify(id));
    },
    capture: async (event, properties) => {
      if (!ph || !wanted) return;
      await guard(() => ph!.capture(event, properties));
    },
    flush: async () => {
      if (!ph || !wanted) return;
      await guard(() => ph!.flush());
    },
    reset: async () => {
      if (!ph) return;
      await guard(() => ph!.reset());
      clearSdkQueue();
    },
  };
}

/**
 * Required constructor options, checked against posthog-react-native 4.78.4.
 * CI (LEGAL-REQ-017) asserts these values. `buildPostHogOptions` spreads them
 * LAST so nothing can override them.
 */
export const REQUIRED_POSTHOG_OPTIONS = {
  /** Nothing leaves the device until `optIn()` (LEGAL-REQ-003). Default true. */
  defaultOptIn: false,
  /**
   * Events, ids and flags live in memory only: nothing is written to disk by
   * the SDK, even after consent, and withdrawal leaves no file behind.
   * Default 'file'. Cost: events not yet flushed are lost if the app is
   * killed; our client flushes every 60 s and on background.
   */
  persistence: 'memory',
  /** Replay would capture letter text on screen (ADR 0008). Default false. */
  enableSessionReplay: false,
  /** We send our own app_opened / app_backgrounded. Default true. */
  captureAppLifecycleEvents: false,
  /** No location from IP (LEGAL-REQ-012). Adds `$geoip_disable: true`. Default false. */
  disableGeoip: true,
  /** Profiles only for the random id we pass; no anonymous profiles. Default 'identified_only'. */
  personProfiles: 'identified_only',
  /** Default true would send app and device fields as person properties with flag calls. */
  setDefaultPersonProperties: false,
  /** Feature flags come from our own remote config (TDD 01 3.9), never PostHog. */
  preloadFeatureFlags: false,
  disableRemoteFeatureFlags: true,
  sendFeatureFlagEvent: false,
  /** Default false. Surveys would render PostHog UI in the app. */
  disableSurveys: true,
  /** Exceptions can quote letter text in messages; crash reports are Sentry's job (scrubbed). */
  errorTracking: { autocapture: false, exceptionSteps: { enabled: false } },
  /** Both default true and need the native plugin, which we do not install. Off regardless. */
  capturePushNotificationSubscriptions: false,
  capturePushNotificationOpened: false,
  /** A new `$session_id` every launch. Default false. */
  enablePersistSessionIdAcrossRestart: false,
  /** No SDK timer (PRD 7.7: no wake-ups of its own). Our client flushes. Default 10000 ms. */
  flushInterval: 0,
} as const;

/**
 * Options that must never be set: `addTracingHeaders` patches global fetch and
 * adds the distinct id to requests to our own servers; `logs` ships free-text
 * log records; `customStorage` would put the queue on disk.
 */
export const FORBIDDEN_POSTHOG_OPTIONS = ['addTracingHeaders', 'logs', 'customStorage'] as const;

/**
 * Required `autocapture` settings, only relevant if someone ever mounts
 * `PostHogProvider` (we do not: the client is used directly, so there is no
 * autocapture at all). Screen names can carry params; touches carry labels.
 */
export const REQUIRED_POSTHOG_AUTOCAPTURE = {
  captureScreens: false,
  captureTouches: false,
} as const;

/** App and device fields we let the SDK attach. Everything else is never built. */
export interface KeptAppProperties {
  $app_version?: string | null;
  $app_build?: string | null;
  $os_name?: string | null;
  $os_version?: string | null;
  $device_type?: string | null;
}
const KEPT_APP_PROPERTIES: readonly (keyof KeptAppProperties)[] = ['$app_version', '$app_build', '$os_name', '$os_version', '$device_type'];

/**
 * `customAppProperties` hook: the SDK builds device fields (including
 * `$device_name`, often "Name's iPhone", `$locale` and `$timezone` when
 * expo-localization is present) once at construction; this keeps only the
 * allowlisted ones, so the others are never attached. `before_send` drops
 * them again as a second line.
 */
export function keepAllowedAppProperties(props: KeptAppProperties): KeptAppProperties {
  const out: KeptAppProperties = {};
  for (const k of KEPT_APP_PROPERTIES) if (props[k] !== undefined) out[k] = props[k];
  return out;
}

/**
 * `before_send` hook for the SDK. Re-validates every outgoing payload,
 * including SDK-added properties, drops anything not on the allowlist and
 * removes `$set` / `$set_once` (PostHog re-attaches a top-level `$set` unless
 * the hook removes it).
 */
export function posthogBeforeSend<E extends OutgoingEvent = OutgoingEvent>(onViolation?: (v: Violation) => void) {
  return (evt: E | null): E | null => (evt ? sanitizeOutgoing(evt, onViolation) : null);
}

export interface PostHogConfig {
  host: string;
  /** This consent period's random analytics id (bootstrapped, so no $identify is sent). */
  distinctId: string;
  onViolation?: (v: Violation) => void;
}

/**
 * The full constructor options for `new PostHog(key, options)`. Pure, so the
 * exact object the app passes is tested here (test/posthog.test.ts).
 */
export function buildPostHogOptions(cfg: PostHogConfig) {
  return {
    host: cfg.host,
    bootstrap: { distinctId: cfg.distinctId, isIdentifiedId: true },
    before_send: posthogBeforeSend(cfg.onViolation),
    customAppProperties: keepAllowedAppProperties,
    ...REQUIRED_POSTHOG_OPTIONS,
  };
}

/**
 * PostHog project settings that cannot be set from the app. Check them in
 * the PostHog UI before launch and after any project change.
 */
export const REQUIRED_PROJECT_SETTINGS = [
  'Discard client IP data: on',
  'Session replay: off',
  'Autocapture (web), heatmaps, surveys, error tracking autocapture, feature-flag person properties: off',
  'Data retention: 12 months or less (LEGAL-REQ data retention table)',
  'Region chosen (US recommended: users and Supabase are in the US) and recorded in subprocessors.md',
  'Insights key: a personal or project API key with Query Read only, held by the insights job, never in the app',
] as const;
