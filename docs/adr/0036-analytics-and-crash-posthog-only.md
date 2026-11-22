# ADR 0036: Analytics and crash reports through PostHog Cloud only (no Sentry)

- **Status:** PROPOSED, 21 Nov 2026. The decision is the founder's of 20 Nov 2026 as recorded in `docs/analytics/instrumentation/posthog-standard.md:3` and the body of #1086; it is not yet a row in `docs/DECISIONS.md` (grep, 21 Nov), so this record stays PROPOSED until `product` and Karma record it there. The founder merges `DECISIONS.md` entries (CLAUDE.md, Approval).
- **Author:** `principal-architect`. Reviewers asked: `analytics`, `privacy`, `security-architect`, `ops`. Docs only.
- **Amends:** ADR 0008 (PostHog plus Sentry); D-003 (crash reports by Sentry); D-124 (in-app analytics off for the whole 1.0 line) only as to what happens when the founder turns analytics on. It does not turn anything on.
- **Number:** next free id from `node scripts/agents/next-id.mjs` on 21 Nov 2026 (0036).

## Context

- ADR 0008 chose PostHog for events and Sentry for crashes, both opt-in, scrubbed, allowlisted (`docs/adr/0008-analytics-and-crash-reporting.md:18-25`). `docs/engineering/10-logging-and-observability.md` OBS-R06 and OBS-R10 name Sentry; `docs/ARCHITECTURE.md` status box did too until the 21 Nov sync.
- The founder decided on 20 Nov: PostHog Cloud free tier is the only vendor, for product analytics and crash reporting (Error Tracking), and Karma ruled no second vendor (`posthog-standard.md:3`).
- #1086 (open) builds the adapter: registry as the only send path, `before_send` as the last gate, no identify with an account id, persistence on a yes only, crash capture built and OFF (`CRASH_REPORTING.enabled = false`), `$exception` reduced to class, frames, app version and OS fields. The production flag flip is a separate founder yes.
- D-124 keeps in-app analytics off for 1.0. Nothing in the repo sets the flag on in `production` (U: the preflight checks named in #1086 were not run here).

## Options

- **A. PostHog Cloud only, events and crashes (the decision).** One vendor, one consent switch, one allowlist, one subprocessor. Crash text is the riskiest content, so the reduced `$exception` and the V-rules (`posthog-standard.md` section 4) are the privacy control, not the vendor.
- **B. PostHog for events, Sentry for crashes (ADR 0008 as written).** Better native-crash tooling [U: not compared here]; two subprocessors and two scrubbers.
- **C. No analytics and no crash vendor in 1.0 (D-124 as written).** Smallest label and no processor; release gates rely on App Store Connect and Xcode Organizer crash rates (OBS-R11).

**Default: A**, because it is the founder's decision. Whether it is built before 1.0 is D-124's question, unchanged.

## Decision

1. PostHog Cloud is the only analytics and crash vendor. No Sentry SDK enters `package.json`; the lint rule of ADR 0008 (no vendor import outside `packages/analytics`) stands with PostHog as the one vendor.
2. Both stay behind the one consent switch. A no sends nothing; withdrawing resets the id and the queue (#1086).
3. The send path is the registry and the validators only. A new event or property enters `packages/analytics/src/registry.ts` with its stage and the decision it informs.
4. Crash capture is built and off. Turning it on needs its own founder yes and a privacy read of what `$exception` still carries.
5. No account id, child name, entry text, transcript, audio or date of birth leaves the phone (CLAUDE.md, Privacy rules).

## Consequences

- OBS-R06 and OBS-R10 (MUST) name Sentry and are not edited here: a MUST changes only with the founder's approval on the PR (RFC to the four stewards). Until then they read as the same rules applied to PostHog `$exception`. Their `Enforced by` lines say "not yet".
- Legal and store text (privacy policy, subprocessor list, App Store label) are not touched; `docs/legal/**` is the founder's.
- `DECISIONS.md` needs one row amending D-003 and D-124. That is Q1 in `docs/tdd/new-scope/architecture.md` section 8.

## Not decided here

The production flip of `EXPO_PUBLIC_ANALYTICS`; EU or US host; PostHog's person-profile and deletion behaviour (F-2, `posthog-standard.md:274`); counsel's questions Q-PH-4 and Q-PH-5.
