# @scribe/analytics

Opt-in, content-free product analytics. Pure TypeScript, no React Native.
Tracking plan, metrics and rules: [`docs/analytics/TRACKING_PLAN.md`](../../docs/analytics/TRACKING_PLAN.md). Decision: ADR 0008.

- `src/catalog.ts`: the event allowlist (event name to property schema). The only events that may leave the device.
- `src/validate.ts`: `sanitizeEvent` and the SDK-level `sanitizeOutgoing` (`before_send`).
- `src/consent.ts`: consent state and the random analytics id.
- `src/client.ts`: `createAnalytics()`, the one `track()` the app calls.
- `src/posthog.ts`: thin PostHog adapter plus the required SDK options.

```bash
npm test -w @scribe/analytics
npm run typecheck -w @scribe/analytics
```

## Integration note for mobile engineers

Not wired into `apps/mobile` yet. When you do:

1. **One bootstrap file** (for example `apps/mobile/src/lib/analytics.ts`) is the only place that imports `posthog-react-native` (ADR 0008 lint rule). Build the client with the required options spread last:
   ```ts
   import PostHog from 'posthog-react-native';
   import * as Crypto from 'expo-crypto';
   import { createAnalytics, createPostHogAdapter, posthogBeforeSend,
     REQUIRED_POSTHOG_OPTIONS } from '@scribe/analytics';

   const ph = new PostHog(KEY, { host: HOST, before_send: posthogBeforeSend(devThrow),
     ...REQUIRED_POSTHOG_OPTIONS });
   export const analytics = createAnalytics({
     provider: createPostHogAdapter(ph),
     storage: mmkvOrSecureStoreAdapter, // { get, set, remove }; sync or async
     randomId: Crypto.randomUUID,
     onViolation: __DEV__ ? devThrow : undefined,
     sampleRates: remoteConfig.analyticsSampleRates, // empty at launch
   });
   ```
   If you use `PostHogProvider`, pass `autocapture={REQUIRED_POSTHOG_AUTOCAPTURE}`. Verify the option and hook names against the installed SDK version (see TRACKING_PLAN section 8, item 4).
2. **Startup:** `await analytics.init()` after first frame (A-NFR-002). It never touches the network unless consent was already granted.
3. **Consent sheet** (`analyticsConsent.*`, third ask, PRD-REQ-001): Yes calls `analytics.grant()` then `track('analytics_opted_in', ...)`; No calls `analytics.revoke()`. Settings > Privacy toggles the same two calls. Record the legal acceptance separately through `record_policy_act`; this package does not.
4. **Track** with the typed API; wrong names or values fail to compile: `analytics.track('letter_saved', { mode: 'spoken', ... })`. Map the child to `child_ordinal`, never pass ids or names. Call `analytics.setChildCount(n)` when books change.
5. **Screens:** send `screen_view` from a router hook with the route template mapped to the `route` enum (`/letter/[id]` to `letter_detail`). Do not turn on SDK screen capture.
6. **Flush:** call `analytics.flush()` when `AppState` goes to `background`. The 60 s foreground timer is built in.
7. **Account deletion:** send `analytics.analyticsIds()` with the deletion request, then call `analytics.forgetIds()`.
8. **Sentry:** gate its init on `analytics.consent() === 'granted'` so there is one switch (LEGAL-REQ-003).
9. Never fire events whose timing follows a child's birthday or due date (TRACKING_PLAN 6.4).

To add an event, follow TRACKING_PLAN section 6.5. The tests fail if the catalogue and the plan drift apart.
