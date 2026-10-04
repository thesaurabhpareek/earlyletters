# @scribe/analytics

Opt-in, content-free product analytics, plus the insights engine. Pure TypeScript, no React Native.
Tracking plan, metrics and rules: [`docs/analytics/TRACKING_PLAN.md`](../../docs/analytics/TRACKING_PLAN.md). Insights loop: [`docs/analytics/INSIGHTS_LOOP.md`](../../docs/analytics/INSIGHTS_LOOP.md). Decision: ADR 0008, founder decision 12.

| File | What |
|---|---|
| `src/catalog.ts` | The event allowlist: the only events that may leave the device. TRACKING_PLAN 3.1 is generated from it |
| `src/validate.ts` | `sanitizeEvent` and the SDK-level `sanitizeOutgoing` (`before_send`) |
| `src/consent.ts`, `src/consent-timing.ts` | Consent state, random analytics id, when the consent sheet may appear |
| `src/client.ts` | `createAnalytics()`: the one `track()` the app calls |
| `src/posthog.ts` | Lazy PostHog adapter and the SDK options, verified against posthog-react-native 4.78.4 |
| `src/buckets.ts`, `src/trackers.ts`, `src/packs.ts` | Raw numbers and ids to catalogue values; typed helpers (`trackLetterSaved` and the rest) |
| `src/observe.ts` | Observers that turn other modules' state changes into events |
| `src/routes.ts`, `src/lifecycle.ts` | Route templates for `screen_view`; sessions and app lifecycle events |
| `src/plan-doc.ts` | Renders TRACKING_PLAN 3.1 |
| `src/insights/` | Insights engine for `scripts/insights/run.ts` (not exported from the index, never in the app) |

```bash
npm test -w @scribe/analytics
npm run typecheck -w @scribe/analytics
npm run plan -w @scribe/analytics                   # after editing catalog.ts
npm run insights -w @scribe/analytics -- --dry-run  # synthetic report to stdout
```

The app side lives in `apps/mobile/src/lib/analytics` (the only importer of `posthog-react-native`), `src/components/consent` and `src/app/settings/privacy.tsx`. Call sites still to wire: TRACKING_PLAN section 9.
