/**
 * Thin PostHog adapter. No import of `posthog-react-native` here: the app
 * constructs the SDK client and passes it in, so this package stays pure TS
 * and the only PostHog import in the repo lives in the mobile analytics
 * bootstrap file (ADR 0008 lint rule).
 *
 * Option names below follow ADR 0008 [S35]. Ones marked "verify" were not
 * checked against a specific SDK version; confirm them in staging with a
 * network inspector before launch.
 */
import type { AnalyticsProvider } from './provider';
import { sanitizeOutgoing, type OutgoingEvent, type Violation } from './validate';

/** The subset of the PostHog React Native client this adapter uses. */
export interface PostHogLike {
  capture(event: string, properties?: Record<string, unknown>): unknown;
  identify(distinctId?: string, properties?: Record<string, unknown>): unknown;
  optIn(): unknown;
  optOut(): unknown;
  reset(): unknown;
  flush(): unknown;
}

export function createPostHogAdapter(ph: PostHogLike): AnalyticsProvider {
  return {
    optIn: async () => void (await ph.optIn()),
    optOut: async () => void (await ph.optOut()),
    // No person properties, ever (LEGAL-REQ-017).
    identify: async (id) => void (await ph.identify(id)),
    capture: async (event, properties) => void (await ph.capture(event, properties)),
    flush: async () => void (await ph.flush()),
    reset: async () => void (await ph.reset()),
  };
}

/**
 * Required constructor options. CI (LEGAL-REQ-017) asserts these values.
 * Spread them LAST so nothing can override them.
 */
export const REQUIRED_POSTHOG_OPTIONS = {
  /** Nothing leaves the device until `optIn()` (LEGAL-REQ-003). */
  defaultOptIn: false,
  /** Replay would capture letter text on screen (ADR 0008). */
  enableSessionReplay: false,
  /** We send our own app_opened / app_backgrounded. */
  captureAppLifecycleEvents: false,
  /** No location from IP (LEGAL-REQ-012). verify option name per SDK version. */
  disableGeoip: true,
} as const;

/**
 * Required `autocapture` settings for `PostHogProvider`. Screen names can
 * carry params (child names); touches can carry labels.
 */
export const REQUIRED_POSTHOG_AUTOCAPTURE = {
  captureScreens: false,
  captureTouches: false,
} as const;

/**
 * `before_send` hook for the SDK (verify hook name and event shape per SDK
 * version). Re-validates every outgoing payload, including SDK-added
 * properties, and drops anything not on the allowlist.
 */
export function posthogBeforeSend(onViolation?: (v: Violation) => void) {
  return (evt: OutgoingEvent | null): OutgoingEvent | null => (evt ? sanitizeOutgoing(evt, onViolation) : null);
}

/**
 * PostHog project settings that cannot be set from the app. Check them in
 * the PostHog UI before launch and after any project change.
 */
export const REQUIRED_PROJECT_SETTINGS = [
  'Discard client IP data: on',
  'Session replay: off',
  'Autocapture (web), heatmaps, surveys, feature-flag person properties: off',
  'Data retention: 12 months or less (LEGAL-REQ data retention table)',
  'Region chosen and recorded in subprocessors.md',
] as const;
