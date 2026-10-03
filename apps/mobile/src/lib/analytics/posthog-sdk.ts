/**
 * The ONLY file in the repo that imports `posthog-react-native` (ADR 0008
 * lint rule, TDD 01 3.11.1). It is loaded with a dynamic `import()` from
 * ./index.ts, and only after the person says yes, so before consent no
 * PostHog code is evaluated and nothing can be sent, queued or stored.
 *
 * Package: posthog-react-native (MIT), installed 4.78.4. Every option comes
 * from `buildPostHogOptions` in @scribe/analytics, where each one was checked
 * against this version's source and is pinned by tests.
 */
import PostHog from 'posthog-react-native';
import { buildPostHogOptions, type PostHogLike, type Violation } from '@scribe/analytics';

export function createPostHogClient(apiKey: string, host: string, distinctId: string, onViolation?: (v: Violation) => void): PostHogLike {
  const options = buildPostHogOptions({ host, distinctId, onViolation });
  return new PostHog(apiKey, {
    ...options,
    // Same function; typed for the SDK's CaptureEvent (a structural subset of OutgoingEvent).
    before_send: options.before_send as NonNullable<ConstructorParameters<typeof PostHog>[1]>['before_send'],
  });
}
