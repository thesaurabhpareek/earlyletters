# ADR 0008: Analytics and crash reporting — PostHog (allowlisted events, no replay) + Sentry (scrubbed)

Status: Accepted. Date: 2026-10-01.

## Context
We need funnels and retention without ever sending entry content, names, or audio. Crashes must be visible.

## Facts
- PostHog: 1M analytics events and 5K session replays free per month [S35]; RN SDK supports Expo; `captureScreens` on by default, `captureTouches` off by default; `enableSessionReplay: false`; `before_send` hook; `defaultOptIn: false` and `optOut()` [S35].
- Sentry: Developer free (1 user, 5,000 errors/month), Team $26/month (annual) with 50,000 errors [S36]; recommends scrubbing with `beforeSend` / `beforeBreadcrumb`; `sendDefaultPii` controls user context [S36].

## Decision
**PostHog** (EU or US cloud; region choice Unverified pricing parity):
- `enableSessionReplay: false`, `captureTouches: false`, `captureScreens: false` (screen names can include child names in params; we send our own `screen_view` with route templates only).
- Typed event catalogue in `packages/analytics`: `track<E extends EventName>(name, props: EventProps[E])` where props are enums, counts and durations only (e.g. `entry_saved {kind, capture_mode, duration_bucket, edit_count, engine}`). `before_send` drops any property not on the allowlist and any string longer than 40 chars.
- Identify with a random analytics id, not email or Supabase user id. `defaultOptIn` follows the consent sheet.

**Sentry**:
- `sendDefaultPii: false`; `beforeSend` and `beforeBreadcrumb` strip `console` breadcrumbs, HTTP bodies and query strings, and any field named like `text|transcript|name|note|letter`; no Sentry session replay.
- Upload source maps via the Expo integration.

Both are swappable behind `packages/analytics` (alternatives: Aptabase, TelemetryDeck, GlitchTip — not researched, Unverified).

## Consequences
Free at 1k families. At 100k, keep events to ~50/family/month to stay near the free tier. Lint rule bans importing PostHog or Sentry outside `packages/analytics`.

## Alternatives rejected
Autocapture and session replay (would capture letter text on screen). Firebase Analytics (Google SDK weight, less control; not researched).
