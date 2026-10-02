---
title: Early Letters service providers and subprocessors
version: 1.0.0
status: draft-for-counsel
effective_date: TBD
owner: founder
reviewers: outside privacy counsel (TBD)
---

> **Drafting notice.** Drafted by an AI (Claude) acting as privacy counsel and privacy engineer, for review by a licensed attorney. Not legal advice. Vendor terms were read on 2 October 2026 and change often; re-check each link before signing, and keep a dated PDF copy of every DPA we accept. "Unverified" means the page was not opened or did not answer the question.

## 1. Summary

Every provider below processes personal data on our behalf (a "service provider" or "processor"). None may sell it, use it for their own purposes beyond running and securing their service, or train AI models on our users' content. Section 4 lists where a vendor's published terms do not yet support that promise, and what we must do before launch.

The public version of this list (section 2 only, without notes) is published at {SUBPROCESSORS_URL} and linked from the privacy policy, section 8.

## 2. Providers in use at launch

| Vendor | Purpose | Data | Region | DPA | Retention by vendor | No training on our content? |
|---|---|---|---|---|---|---|
| **Supabase** (DPA names Supabase Pte. Ltd. as processor) | Postgres database, auth (magic link, Apple, Google), Storage (photos, encrypted audio, web contributions), Edge Functions (AI gateway, key escrow, invites) | Account, profiles, child profiles, letter text and transcripts, dictionary, family membership, invite hashes, photos, audio ciphertext, wrapped keys (escrow secret held in an Edge Function secret) | us-west-1 (AWS, N. California; region code per our project setting). DPA: data stored and primarily processed in the region we choose | https://supabase.com/legal/dpa (accepted with the Agreement; SCCs incorporated). Subprocessors: https://supabase.com/legal/customer-resources/subprocessor-list | Until we delete. 30 days after termination, then deleted. Pro plan daily backups kept 7 days; Storage objects are not in database backups. | **Yes.** Terms: Supabase "will not use, nor allow any third-party to use, Customer Data ... to train, fine-tune, or otherwise improve any artificial intelligence or machine learning model, without Customer's prior written consent." [V1][V2][V3] |
| **PowerSync** (Journey Mobile, Inc., JourneyApps) | Sync between op-sqlite on the phone and Postgres; attachment queue | Replicated copies of rows each user may see (includes letter text) held in PowerSync's bucket storage; sync metadata | Choose a **US** deployment. Core subprocessors AWS and MongoDB; region depends on deployment (US, EU, AU, JP, BR) | JourneyApps DPA (PDF, dated 2026-01-28): https://platform.journeyapps.com/public/documents/JourneyApps-GDPR-DPA-Data-Processing-Addendum-2026-01-28.pdf . Confirm it attaches to our PowerSync Cloud plan. Subprocessors: https://powersync.com/legal/subprocessors | On termination, return or delete at our instruction (no timeframe stated). Breach notice within 72 hours. | **Not stated.** DPA limits processing to performing the Agreement and "improvement of the Service"; no AI clause found. Action required (section 4). [V4][V5][V6] |
| **Groq** | Server speech-to-text fallback (whisper-large-v3-turbo), only after consent | Audio of the entry being transcribed, dictionary prompt; returns text and word timestamps. Account ID stripped by our gateway. | US. Any retained data in GCP buckets in the United States | Services Agreement (effective 22 June 2026): https://console.groq.com/docs/legal/services-agreement . Separate DPA: Unverified | By default not retained; may keep up to 30 days for reliability or abuse review. **Zero Data Retention must be enabled** (available to all customers). Deleted within 30 days of termination. | **Yes.** "Groq is not permitted to use Inputs or Outputs for training or fine-tuning any AI Model Services or other models, unless explicitly granted permission or instructed by Customer." [V7][V8] |
| **DeepInfra** | Backup server speech-to-text; future optional edit pass (Qwen, text only) | Same as Groq; text only for edit pass | US (Unverified) | DPA: Unverified (not found). Data privacy page: https://docs.deepinfra.com/account/data-privacy | Inputs held in memory only during inference, not written to disk; outputs not stored; request content not logged (metadata only) | **Yes, for the models we use.** "We do not use data you submit to our APIs for training models, except when using Google or Anthropic models." Engineering guard: our `AI_ROUTES` must never point at Google or Anthropic models on DeepInfra. [V9] |
| **RevenueCat, Inc.** | Subscription receipts, entitlements, webhooks to Supabase | Random `appUserID`, store receipts, product, trial and renewal dates, refunds; device and app metadata the SDK sends | US | https://www.revenuecat.com/dpa/ (effective August 2026; part of the Customer Agreement) | Destroy or return within 30 days of termination on request, subject to backup practices. We call RevenueCat's delete API on account deletion. | **No explicit AI clause.** DPA allows processing "necessary for internal use by RevenueCat to build or improve the quality of its services." Data is minimal and contains no content; acceptable with disclosure. [V10][V11] |
| **PostHog, Inc.** | Product analytics, allowlisted events only, no session replay, no autocapture | Random analytics ID, enum and count event properties, app version, device model and OS. IP capture off. | **US Cloud** (recommended for a US-only launch; ADR 0008 left US or EU open) | https://posthog.com/dpa (self-serve, signed via PandaDoc in app.posthog.com/legal). Subprocessors: https://posthog.com/subprocessors (14 days' notice of changes) | Until deleted by us; on termination, return or delete. Event retention: set to 12 months (plan default Unverified). | **Yes.** PostHog "does not permit any third parties (including its Subprocessors) to use any Company Personal Data to fine tune, train or develop their AI functionality or models." [V12][V13] |
| **Sentry** (Functional Software, Inc.) | Crash and error reporting, source maps | Stack traces, device and OS, breadcrumbs with content stripped (`beforeSend`, `beforeBreadcrumb`), no user ID, IP storage off | US | https://sentry.io/legal/dpa/ (accepted electronically). Subprocessors: https://sentry.io/legal/subprocessors/ (30 days' notice) | Destroyed when the term ends. Event retention per plan (Unverified; proposed 90 days). | **Partly.** Terms let Sentry use "Non-Identifying Data" (which excludes personal data, source code and content) for "Additional Uses" such as "developing new products and services"; other Service Data only if we authorize it in settings. Keep any AI or data-sharing toggles off. [V14][V15] |
| **Vercel Inc.** | Hosts `apps/web`: landing page, waitlist, family contribution page, magic-link landing page, AASA and assetlinks files | Web request logs (IP, user agent, path; invite tokens travel in the URL fragment so they are not logged), encrypted audio uploads in transit, waitlist emails | Primary processing in the US; DPA allows transfer worldwide | https://vercel.com/legal/dpa (Pro and Enterprise). Subprocessors: https://security.vercel.com (5-day objection window) | Deleted within "a commercially reasonable timeframe" after termination | **Only on a paid plan with the opt-out confirmed.** March 2026 terms: Hobby and trial Pro are opted in to AI training by default (code, agent chats, build telemetry, aggregate traffic stats, with personal data stated as redacted); paid Pro is opted out by default; Enterprise excluded. Use paid Pro and confirm Team Settings, Data Preferences shows opted out. [V16][V17] |
| **{EMAIL_PROVIDER}** (to choose) | Custom SMTP for magic links and codes (A-REQ-026), trial, renewal and price-change notices | Email address, message content we send (sign-in codes, dates, prices) | {REGION} | {DPA_URL} | {RETENTION} | Must be confirmed before signing. Selection criteria: DPA with purpose limitation and no-training clause, US region, link tracking and open tracking turned off for auth mail. |

### Not processors (independent parties)

| Party | Role | Data | Note |
|---|---|---|---|
| Apple | App Store, StoreKit payments, Sign in with Apple, APNs push, iCloud Keychain (holds the family key in the user's own account) | Apple's own terms | Push payloads carry no letter text (C-REQ-009). |
| Google | Sign in with Google; later Google Play Billing and FCM | Google's own terms | |
| Model host for the first-run Whisper download | Supabase Storage (preferred) or Hugging Face | IP address and request metadata only | Recommend Supabase Storage so no new party is added (ADR 0001 allows either). If Hugging Face is used, list it here. |

## 3. Planned, not yet in use (add before the feature ships)

| Vendor | Purpose | Data | Trigger |
|---|---|---|---|
| Cloudflare Workers AI | Fallback for the optional edit pass (text only) | Letter text for one request | If the edit pass is turned on (ADR 0003). Cloudflare: "does not use your Customer Content to (1) train any AI models made available on Workers AI or (2) improve any Cloudflare or third-party services"; content stored only if we use a Cloudflare storage product [V18]. Region: Cloudflare network (Unverified). DPA: Cloudflare customer DPA (Unverified, not opened). |
| Lulu (Lulu Press, Inc.) | Print and ship physical books | Book PDF (letters, photos), name and shipping address | Printed books (ADR 0007, P2). Terms not reviewed. |
| Stripe or Apple Pay | Card payment for printed books | Name, email, shipping address; card data held by the payment provider | Printed books (P2). Terms not reviewed. |

## 4. Gaps to close before launch

1. **PowerSync: no AI-training clause, and it holds letter text.** PowerSync stores replicated rows (including `final_text` and `raw_transcript`) in its own bucket storage. Ask JourneyApps to (a) confirm the DPA covers PowerSync Cloud, (b) add a written no-training, no-own-use clause, (c) confirm a US-only deployment and deletion timeframe on termination. If refused, consider the self-hosted Open Edition (FSL) noted in ADR 0004, or excluding text columns from sync streams for users who opt out.
2. **Groq: turn on Zero Data Retention** in Data Controls before any production audio is sent (ARCHITECTURE section 8). Record the date and a screenshot.
3. **DeepInfra: find or request a DPA.** Its data page is strong, but we have no contract terms. Until signed, keep DeepInfra out of the production route or accept the risk explicitly.
4. **Sentry: confirm settings.** "Prevent storing of IP addresses" on; data scrubbing on with our extra fields (`text`, `transcript`, `name`, `note`, `letter`); any AI or "Additional Uses" authorization off; no session replay.
5. **Vercel: paid Pro plan** and Data Preferences opted out of training before the web app goes live.
6. **RevenueCat: accept** that its DPA allows internal service improvement. No content goes there, so we can still say "no service provider trains AI models on your letters, recordings or photos". Confirm no IDFA or IDFV collection.
7. **Email provider: choose and sign** before custom SMTP is configured.
8. **Supabase DPA entity.** The DPA names Supabase Pte. Ltd. (Singapore). Confirm which Supabase entity contracts with a US customer and whether that affects our "data lives in the United States" statement (data location is set by region; the contracting entity is not where data is stored).
9. **Keep evidence.** Save a dated PDF of each DPA and data-use page, and the Groq ZDR and Vercel opt-out screenshots, in the company records (not in this repository).

## 5. How we add or change a provider

1. Engineering proposes the vendor with purpose, data, region and links.
2. Check: DPA available; purpose limitation; no sale; no training on our content; deletion on termination; US region; security attestation (SOC 2 or similar).
3. Update this file (version bump), the public list, and the privacy policy table if the provider handles content.
4. For providers that handle letters, recordings or photos, give users 30 days' notice in the app before the provider starts receiving data (privacy policy section 8).
5. Re-run the App Privacy and Data safety answers (`app-store-privacy-labels.md`) if the provider has an SDK in the app.

## Appendix. Sources (opened 2 October 2026)

- [V1] Supabase Data Processing Addendum: https://supabase.com/legal/dpa
- [V2] Supabase Terms of Service (AI training clause; aggregated data): https://supabase.com/terms
- [V3] Supabase Backups docs: https://supabase.com/docs/guides/platform/backups
- [V4] JourneyApps Data Processing Addendum, 2026-01-28: https://platform.journeyapps.com/public/documents/JourneyApps-GDPR-DPA-Data-Processing-Addendum-2026-01-28.pdf
- [V5] PowerSync Sub-Processors: https://powersync.com/legal/subprocessors
- [V6] PowerSync Privacy Policy (last updated 22 January 2025): https://powersync.com/legal/privacy-policy
- [V7] Groq Services Agreement (effective 22 June 2026): https://console.groq.com/docs/legal/services-agreement
- [V8] Groq, Your Data in GroqCloud: https://console.groq.com/docs/your-data
- [V9] DeepInfra, Data privacy: https://docs.deepinfra.com/account/data-privacy
- [V10] RevenueCat DPA: https://www.revenuecat.com/dpa/
- [V11] RevenueCat, Apple App Privacy: https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy
- [V12] PostHog DPA: https://posthog.com/dpa
- [V13] PostHog, Data collection and IP capture: https://posthog.com/docs/privacy/data-collection
- [V14] Sentry DPA: https://sentry.io/legal/dpa/
- [V15] Sentry Terms of Service, section 4.2 and definitions of Additional Uses and Non-Identifying Data: https://sentry.io/legal/terms/
- [V16] Vercel DPA: https://vercel.com/legal/dpa
- [V17] Vercel, Updates to Terms of Service, March 2026: https://vercel.com/changelog/updates-to-terms-of-service-march-2026
- [V18] Cloudflare Workers AI, Data usage: https://developers.cloudflare.com/workers-ai/platform/data-usage/
- Repository: `docs/ARCHITECTURE.md` sections 3, 7, 8; ADR 0001 to 0010; PRD A (A-REQ-026, A-NFR-012), B (B-NFR-002, B-NFR-005), C (C-NFR-005).

Unverified: Groq DPA; DeepInfra DPA and region; Cloudflare DPA and region; Sentry and PostHog default retention; the Supabase entity that contracts with US customers; whether the JourneyApps DPA attaches to PowerSync Cloud.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-10-02 | First draft for counsel review. |
