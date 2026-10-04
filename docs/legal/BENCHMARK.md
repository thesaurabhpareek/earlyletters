---
title: Legal benchmark, v1.0 texts
version: 1.0.0
last_updated: 2026-10-04
owner: founder
---

# Benchmark: claims of law and platform fact, checked against sources

Read on 4 Oct 2026. "Yes" means the page was opened and the quoted words are there. "Unverified" means the primary source could not be opened (the network proxy for this session blocks ftc.gov, oag.ca.gov, atg.wa.gov, app.leg.wa.gov, ecfr.gov, cornell.edu, cppa.ca.gov, gdpr-info.eu, eur-lex, ico.org.uk, support.apple.com and resend.com) or its body did not load. Search-result snippets from law firm or aggregator sites are not primary sources and are marked as such. Nothing here is legal advice, and counsel decides what each fact means for us (COUNSEL_PACKET.md, section A0).

## 1. Platform facts and law

| # | Claim in our texts | Source | Verified |
|---|---|---|---|
| 1 | Data processed only on the device is not "collected" and need not be disclosed; "collect" means transmitting off the device so we or partners can access it longer than needed to service the request in real time. Basis for "Data Not Collected" | https://developer.apple.com/app-store/app-privacy-details/ (read 2026-10-04) | **Yes** |
| 2 | A privacy policy must say what data is collected and how it is used, that third parties give equal protection, and explain retention, deletion and how to revoke consent (5.1.1(i)) | https://developer.apple.com/app-store/review/guidelines/ (read 2026-10-04) | **Yes** |
| 3 | Apps that collect usage data need consent, even if anonymous; paid features must not depend on it; withdrawal must be easy (5.1.1(ii)). Basis for opt-in usage reports | same | **Yes** |
| 4 | Account deletion is required only if the app supports account creation (5.1.1(v)); v1.0 has no account | same | **Yes** |
| 5 | Permission is needed before sharing personal data with third parties, including third-party AI (5.1.2(i)); v1.0 sends no content to any third party | same | **Yes** |
| 6 | Describe what a subscriber gets before asking them to subscribe (3.1.2(a)) | same | **Yes** (Schedule 2 content itself not read, see row 12) |
| 7 | Apps may not use their own license keys or codes to unlock features; subscriptions use in-app purchase (3.1.1). Basis for Apple offer codes instead of our own code system | same | **Yes** |
| 8 | Betas and demos belong on TestFlight, not the store (2.2); no hidden or dormant features, and new features must be described to review (2.3.1(a)). Dormant sign-in and sync code stays in the build, so review notes must describe it | same | **Yes** |
| 9 | The Kids Category and 5.1.4 rules do not apply to an adults-only app outside the Kids Category | same | **Yes** (that we are outside the category is our own fact) |
| 10 | One introductory offer per subscription group; the purchase flow must show trial length and the price after it | https://developer.apple.com/app-store/subscriptions/ (read 2026-10-04) | **Yes** |
| 11 | Apple offers offer codes, Family Sharing (up to five family members), subscription management in Apple's account settings, price-increase notifications and a billing grace period of 3, 16 or 28 days | same | **Yes** |
| 12 | Developer Program License Agreement Schedule 2 section 3.8(b) disclosures and the minimum custom licence terms listed in Terms section 11 | https://developer.apple.com/support/terms/apple-developer-program-license-agreement/ (page loaded without Schedule 2) | **Unverified** |
| 13 | A privacy manifest is required, with required-reason API declarations and no tracking declared | https://developer.apple.com/documentation/bundleresources/privacy-manifest-files and `describing-use-of-required-reason-api` (page bodies did not load) | **Unverified** |
| 14 | iPhone backup (iCloud or computer) can include app data such as recordings | Apple Support, "What does iCloud back up" (blocked) | **Unverified** |
| 15 | COPPA covers collection of personal information from children under 13 online, or services directed to them; an adults-only app about a child, collecting nothing from the child, is outside it | FTC COPPA FAQ and 16 CFR 312.2 (blocked) | **Unverified** |
| 16 | CCPA applies only above thresholds (revenue about $26.6 million, 100,000 consumers or households, or 50 percent of revenue from selling or sharing); we give the rights to everyone anyway | Snippet from a search result that cited the CPPA threshold page; the CPPA and California Attorney General pages were blocked | **Unverified** (secondary only) |
| 17 | California and other state rights (access, correct, delete, opt out, appeal) and a 45-day response period | California Attorney General and state statutes (blocked) | **Unverified**. The texts promise a faster aim ("10 business days") and "within the time the law sets" so no figure of law is stated |
| 18 | Washington's My Health My Data Act needs a separate consumer health data privacy policy linked from the homepage | Snippet from a search result citing RCW 19.373.020 and the Washington Attorney General FAQ; RCW and attorney general pages blocked | **Unverified** (secondary only) |
| 19 | MHMDA reaches an app that only processes data on the user's device and never receives it | RCW 19.373.010 (blocked) | **Unverified**. Asked as a question (Q32) |
| 20 | GDPR and UK GDPR do not apply because we do not offer the app outside the United States | GDPR Article 3, ICO guidance (blocked) | **Unverified**. Asked as a question (Q34) |
| 21 | CAN-SPAM needs a postal address and a working opt-out in commercial email | FTC CAN-SPAM guide (blocked) | **Unverified**. Asked as a question (Q34); unsubscribe link is built, postal address is not |
| 22 | California automatic renewal law and ROSCA obligations when Apple is the merchant and billing agent | California Business and Professions Code 17602, FTC (blocked) | **Unverified**. Asked as a question (Q37) |
| 23 | Resend keeps sent emails for a fixed period and supports unsubscribe and a verified domain | Resend docs (blocked); earlier drafts relied on 30 days from an internal runbook | **Unverified**. The new texts state no period |
| 24 | Texas SB 2420 and California AB 1043 age-signal duties | Not opened this session | **Unverified**. Unchanged from COUNSEL_PACKET Q5 |

## 2. Facts about the app and website, checked in the code (4 Oct 2026, origin/develop and origin/main)

| Claim | Where checked | Verified |
|---|---|---|
| Server features are off in every build profile; no Supabase client is built; no sign-in, sync or co-parent | `apps/mobile/eas.json`, `src/lib/capabilities.ts`, `app.config.ts` | Yes |
| Remote documents are fetched only if `EXPO_PUBLIC_DOCS_BASE_URL` is set; with it unset the app makes no remote document call | `src/lib/remote/base.logic.ts`, `src/lib/remote/index.ts` | Yes |
| Speech model files download from Hugging Face (pinned revisions) or `models.earlyletters.com`, through the pack manager, which needs a manifest | `src/lib/models/catalog.ts`, `src/lib/packs/engine.ts` | Yes. With no docs base URL the manifest is null and a download fails with `no_manifest`: engineering to confirm how v1.0 gets models |
| PostHog is linked, loaded only after consent, and a no-op unless `EXPO_PUBLIC_POSTHOG_KEY` is set; no profile in `eas.json` sets it | `src/lib/analytics/index.ts`, `posthog-sdk.ts`, `eas.json` | Yes for the code; the EAS environment itself was not inspected |
| Sentry, PowerSync, RevenueCat and op-sqlite are not linked | `apps/mobile/package.json` and imports | Yes |
| Google Sign-In and Sign in with Apple are linked (config plugin and entitlement) but hidden by the switch | `app.config.ts`, `package.json` | Yes |
| The only permission string is the microphone one; notifications are local; no speech recognition or photo permission | `app.config.ts`, `src/lib/permission-copy.ts`, `src/lib/reminders/scheduler.ts` | Yes |
| The privacy manifest declares no tracking and no collected data types | `app.config.ts` `PRIVACY_MANIFESTS` | Yes |
| Settings, Plan shows trial and renewal dates; Manage subscription, Restore and Request a refund exist. App reminders before renewal, a purchase confirmation sheet and a Redeem a code row do not | `src/app/settings/plus.tsx`, `src/lib/billing/*` | Yes |
| The app plan engine and the Plus strings still encode the old plan (3 Read together sessions, books for more children), not the 2-letter gate | `packages/content/src/features/billing.en.ts`, `store.en.ts`, `packages/content/test/rules.test.ts` | Yes |
| The website stores only an email as a Resend contact in one segment, sends a welcome email with an unsubscribe link, logs no email or IP, and Vercel Web Analytics is off unless `NEXT_PUBLIC_ANALYTICS=vercel` | `apps/web/src/lib/notify/*`, `src/lib/analytics/index.ts` (origin/main) | Yes |
