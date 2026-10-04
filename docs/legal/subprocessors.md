---
title: Early Letters service providers and subprocessors
version: 1.3.0
status: draft-for-counsel
last_updated: 2026-10-03
effective_date: TBD
owner: founder
reviewers: outside privacy counsel (TBD)
published_at_url: https://earlyletters.com/subprocessors (D-063)
---

> **Drafting notice.** Drafted by an AI (Claude) acting as privacy counsel and privacy engineer, for review by a licensed attorney. Not legal advice. Vendor terms were read on 2 and 3 October 2026 and change often; re-check each link before signing, and keep a dated PDF copy of every DPA we accept. "Unverified" means the page was not opened or did not answer the question. Open questions are numbered in `COUNSEL_PACKET.md` (Q11, Q12).

## 1. Summary

Every provider in section 2 processes personal data on our behalf (a "service provider" or "processor"). None may sell it, use it for their own purposes beyond running and securing their service, or train AI models on our users' content. Section 4 lists where a vendor's published terms do not yet support that promise, and what we must do before launch.

The public version of this list (section 2 only, without notes, plus each vendor's privacy contact address or web form) is published at https://earlyletters.com/subprocessors and linked from the Privacy Policy (section 8) and the Consumer Health Data Privacy Policy (section 5). Washington's My Health My Data Act gives consumers the right to a list of every third party and affiliate that received their consumer health data, with an active email address or online contact for each (RCW 19.373.040), so the contact column is required, not optional.

What v1.0 changes (founder decisions of 3 Oct 2026, second round): no audio leaves the phone and there is no cloud transcription (D-059), so no AI provider receives anything; Plus is Apple's alone and checked on the device (D-053, ADR 0013), so no billing service exists; sync is our own outbox and cursor on Supabase (D-023), so PowerSync is not used; email runs through Resend (D-063); the website runs on Vercel (D-063); language packs and speech models download on demand (D-065) from a host the founder is choosing (DEBATES Q-001).

## 2. Providers in use at launch

| Vendor | Purpose | Data | Region | DPA | Retention by vendor | No training on our content? |
|---|---|---|---|---|---|---|
| **Supabase** (DPA names Supabase Pte. Ltd. as processor) | Postgres database, auth (Sign in with Apple, Google, email link), Edge Functions (`purge-worker` for deletions and retention, `analytics-forget`), cron | Account, profile, child profiles, letter text and transcripts, dictionary, co-parent membership, invite hashes, consent records, deletion records, ops audit log, the Apple refresh token wrapped under our key. No audio, no photos, no purchases in v1.0 | us-west-1 (AWS, N. California). DPA: data stored and primarily processed in the region we choose | https://supabase.com/legal/dpa (accepted with the Agreement; SCCs incorporated). Subprocessors: https://supabase.com/legal/customer-resources/subprocessor-list | Until we delete. 30 days after termination, then deleted. Pro plan daily backups kept 7 days; PITR off at launch (SECURITY.md 4) | **Yes.** Terms: Supabase "will not use, nor allow any third-party to use, Customer Data ... to train, fine-tune, or otherwise improve any artificial intelligence or machine learning model, without Customer's prior written consent." [V1][V2][V3] |
| **PostHog, Inc.** | Product analytics, allowlisted events only, no session replay, no autocapture, only after opt-in | Random analytics ID, enum and count event properties (including plan-state changes and one of seven language codes, TRACKING_PLAN 6.2), app version, device type and OS. IP discarded, GeoIP off | **US Cloud** (`us.posthog.com`, SECURITY.md 1.1) | https://posthog.com/dpa (self-serve, signed via PandaDoc in app.posthog.com/legal). Subprocessors: https://posthog.com/subprocessors (14 days' notice of changes) | Until deleted by us; on termination, return or delete. Event retention: set to 12 months (plan default Unverified). Account deletion deletes events through `analytics-forget` with the IDs the phone kept (TRACKING_PLAN 7) | **Yes.** PostHog "does not permit any third parties (including its Subprocessors) to use any Company Personal Data to fine tune, train or develop their AI functionality or models." [V12][V13] |
| **Resend** (Plus Five Five, Inc., San Francisco) | Transactional email: magic links (as Supabase Auth's custom SMTP), deletion request, cancellation and completion notices, incident notices | Email address, the emails we send (sign-in links, dates, request references). Never letters, child names or audio. Open and click tracking off | United States (AWS SES us-east-1 per the DNS records, DOMAINS.md 3) | DPA dated 31 Dec 2025, incorporated into the Terms of Service on signing up: https://resend.com/legal/dpa ; signed copy: https://resend.com/static/documents/resend-dpa-signed.pdf [V19] | Sent-message data kept **30 days** (Verified per `docs/ops/runbooks/incident-notification.md`; the deletion worker relies on it, `purge-worker/account.ts`). No contacts kept in v1.0 (`RESEND_CONTACTS` off). Personal data returned or deleted within 90 days of account termination [V19] | **Not stated.** The DPA limits processing to the Agreement and says Resend will not "retain, use or disclose any personal information ... except as necessary" to provide the service, and will not sell it; no AI clause found in the DPA or Terms [V19][V20]. Our emails carry no letter content, so the content promise is not at stake; still ask for a written clause (section 4 item 4) |
| **Vercel Inc.** | Hosts earlyletters.com: the website, published legal pages, `/delete-account`, the `/auth/callback` and `/i/*` fallback pages, `.well-known` files; the `earlyletters.app` redirect | Web request logs (IP, user agent, path). Invite tokens are in the URL path today (security review M2), so `/i/*` must not be logged | Primary processing in the US; DPA allows transfer worldwide | https://vercel.com/legal/dpa (Pro and Enterprise). Subprocessors: https://security.vercel.com (5-day objection window) | Deleted within "a commercially reasonable timeframe" after termination | **Only on a paid plan with the opt-out confirmed.** March 2026 terms: Hobby and trial Pro are opted in to AI training by default; paid Pro is opted out by default; Enterprise excluded. Use paid Pro and confirm Team Settings, Data Preferences shows opted out. [V16][V17] |
| **Cloudflare, Inc.: R2** (**candidate**, pending DEBATES Q-001 and the founder's host choice, D-046) | Object storage and delivery for language packs, pack manifests and the speech models we build ourselves (the Hindi model, ADR 0015) | IP address, user agent and the file requested, in Cloudflare's request logs. The file name reveals which language was picked. No account ID, no content | Cloudflare's global network | Cloudflare Customer DPA v6.4, effective 3 Apr 2026, part of the self-serve or enterprise agreement: https://www.cloudflare.com/cloudflare-customer-dpa/ [V21] | Per Cloudflare's log settings (Unverified; set the shortest available and no Logpush) | **Yes, by the DPA's purpose limits:** Cloudflare processes "only ... for the limited and specified business purpose of providing the Services", acts as a CCPA service provider and does not use personal data for marketing or advertising [V21]. Packs hold no personal data |

### Not processors (independent parties)

| Party | Role | Data | Note |
|---|---|---|---|
| Apple | App Store and StoreKit: Plus is sold, renewed, cancelled and refunded only by Apple as merchant of record (ADR 0013); Sign in with Apple; Declared Age Range on iOS; iCloud device backups under the user's own Apple Account | Apple's own terms | No server of ours receives purchase data: no App Store Server Notifications endpoint, no App Store Server API, no `appAccountToken`. The age range is used in memory and never stored (register CR-004). The app sends no push notifications from our servers in v1.0 (reminders are local) |
| Google | Sign in with Google (v1.0, D-054) | Google's own terms | Google returns a name and email to the app at sign-in; Google Play and Android are later |
| Hugging Face | Public host of the upstream speech models the app downloads directly at pinned revisions (whisper turbo, whisper small, Silero VAD; `apps/mobile/src/lib/models/catalog.ts`, ADR 0015) | IP address, user agent and the file requested | Not acting on our instructions: these are public files anyone can download. Listed for transparency because the model file can reveal the language picked. If we mirror these files to our own host (D-046), Hugging Face drops out of the data flow |

## 3. Planned, not yet in use (add before the feature ships)

| Vendor | Purpose | Data | Trigger |
|---|---|---|---|
| Groq; DeepInfra | Server speech-to-text fallback, only after explicit consent (Apple 5.1.2(i)) | Audio of the entry being transcribed, dictionary prompt | Cloud transcription (v1.1, BL-304). Before then: Groq Zero Data Retention on; DeepInfra DPA found or signed; both in section 2 with a 30-day in-app notice (Privacy Policy section 8). Terms read 2 Oct 2026: Groq forbids training on inputs and outputs [V7][V8]; DeepInfra does not train on submitted data except for Google or Anthropic models [V9] |
| Cloudflare Workers AI | Fallback for an optional edit pass (text only) | Letter text for one request | Only if the edit pass is turned on (ADR 0003). "does not use your Customer Content to (1) train any AI models made available on Workers AI or (2) improve any Cloudflare or third-party services" [V18] |
| Sentry (Functional Software, Inc.) | Crash reporting on the analytics consent switch (D-003) | Scrubbed stack traces, device and OS, no user ID, IP storage off | When a crash SDK is added (TRACKING_PLAN 7: "Sentry, when added"). Terms let Sentry use "Non-Identifying Data" for "Additional Uses"; keep AI and data-sharing toggles off [V14][V15] |
| Lulu (Lulu Press, Inc.), and Stripe or Apple Pay | Print and ship physical books; card payment | Book PDF, name, shipping address; card data held by the payment provider | Printed books (ADR 0007 print half, later). Terms not reviewed |
| CAPTCHA provider (Cloudflare Turnstile or hCaptcha) | Abuse protection on email sign-in | IP address, browser signals; no letter content | Only when Supabase Attack Protection CAPTCHA is turned on (SECURITY.md 4). Add here and to the data map first |

**Removed in 1.3.0:** RevenueCat (not used, ADR 0013, D-053; no fallback planned for v1.0) and PowerSync (not used, D-023).

## 4. Gaps to close before launch

1. **Choose the download host (DEBATES Q-001, D-046).** If Cloudflare R2: accept the Cloudflare DPA on the account, set log retention to the shortest option, no Logpush, and move this row from "candidate" to "in use" with a minor version. If another CDN: same checks (DPA, US or global, no own use, log retention), and add it here before any app build points at it.
2. **Vercel: paid Pro plan** and Data Preferences opted out of training before the website goes live (19 Oct, ROADMAP 2.0). No access logs or analytics for `/i/*` and `/auth/*` (security review M2; DOMAINS.md 5).
3. **PostHog: confirm settings.** US Cloud; "Discard client IP data" on; GeoIP off; event retention 12 months or less; DPA signed in app.posthog.com/legal.
4. **Resend: written no-training and no-own-use clause,** or accept the DPA's CCPA service-provider language as enough (our emails carry no letter content). Keep open and click tracking off (AUTH_SETUP 4.1). Record that sent-message data is kept 30 days; the Privacy Policy section 10 states this as the one exception to the 45-day processor clock (CN-12).
5. **Supabase DPA entity.** The DPA names Supabase Pte. Ltd. (Singapore). Confirm which Supabase entity contracts with a US customer and whether that affects our "data lives in the United States" statement.
6. **Keep evidence.** Save a dated PDF of each DPA and data-use page, and the Vercel opt-out and PostHog settings screenshots, in the founder's records (not in this repository).
7. **Health-data terms.** Confirm the Supabase DPA covers consumer health data: processing only on our instructions, deletion when we pass on a request, and help with access requests. It is GDPR-style and likely sufficient. Supabase is the only processor that holds letter text in v1.0.

Closed in 1.3.0: the PowerSync no-training gap (not used, D-023); Groq ZDR and the DeepInfra DPA (not used in v1.0; they move to section 3 triggers); Sentry settings (no Sentry in v1.0); choosing an email provider (Resend).

## 5. How we add or change a provider

1. Engineering proposes the vendor with purpose, data, region and links, and adds it to the data map (LEGAL-REQ-041) before any build points at it.
2. Check: DPA available; purpose limitation; no sale; no training on our content; deletion on termination; US region; security attestation (SOC 2 or similar).
3. Update this file (version bump), the public list, and the Privacy Policy section 8 if the provider handles personal data.
4. For providers that handle letters or recordings, give users 30 days' notice in the app before the provider starts receiving data (Privacy Policy section 8).
5. Re-run the App Privacy answers (`app-store-privacy-labels.md`) if the provider has an SDK in the app.

## Appendix. Sources

Opened 2 October 2026 unless marked:
- [V1] Supabase Data Processing Addendum: https://supabase.com/legal/dpa
- [V2] Supabase Terms of Service (AI training clause): https://supabase.com/terms
- [V3] Supabase Backups docs: https://supabase.com/docs/guides/platform/backups
- [V7] Groq Services Agreement (effective 22 June 2026): https://console.groq.com/docs/legal/services-agreement
- [V8] Groq, Your Data in GroqCloud: https://console.groq.com/docs/your-data
- [V9] DeepInfra, Data privacy: https://docs.deepinfra.com/account/data-privacy
- [V12] PostHog DPA: https://posthog.com/dpa
- [V13] PostHog, Data collection and IP capture: https://posthog.com/docs/privacy/data-collection
- [V14] Sentry DPA: https://sentry.io/legal/dpa/
- [V15] Sentry Terms of Service: https://sentry.io/legal/terms/
- [V16] Vercel DPA: https://vercel.com/legal/dpa
- [V17] Vercel, Updates to Terms of Service, March 2026: https://vercel.com/changelog/updates-to-terms-of-service-march-2026
- [V18] Cloudflare Workers AI, Data usage: https://developers.cloudflare.com/workers-ai/platform/data-usage/
- [V19] Resend, Data Processing Addendum (updated 31 Dec 2025), opened 3 October 2026: https://resend.com/legal/dpa
- [V20] Resend, Terms of Service (licence to Message Content limited to providing the Service; silent on AI training), opened 3 October 2026: https://resend.com/legal/terms-of-service
- [V21] Cloudflare Customer DPA v6.4 (effective 3 April 2026), opened 3 October 2026: https://www.cloudflare.com/cloudflare-customer-dpa/
- Repository (3 Oct 2026): `docs/ops/SECURITY.md`, `DOMAINS.md`, `runbooks/incident-notification.md`; `supabase/functions/purge-worker/account.ts`; `apps/mobile/src/lib/models/catalog.ts`; ADR 0013, 0015; DECISIONS D-023, D-046, D-053, D-054, D-059, D-063, D-065; DEBATES Q-001; `docs/reviews/2026-10-04-security-privacy.md` (M2).

Unverified: Resend's 30-day retention on its own pages (relied on from the incident runbook, marked Verified there); Cloudflare R2 log retention defaults; Supabase entity for US customers; PostHog default event retention.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.3.0 | 2026-10-03 | Alignment with the founder decisions of 3 Oct 2026, second round. Added: Resend (email, 30-day message retention, DPA of 31 Dec 2025), Cloudflare R2 (candidate pack and model host, pending Q-001; DPA v6.4), Hugging Face (direct public model downloads, not a processor), Google as sign-in party in v1.0. Removed: RevenueCat (D-053) and PowerSync (D-023). Moved to "planned": Groq, DeepInfra (cloud transcription v1.1) and Sentry (no crash SDK in v1.0). Supabase row: no audio, photos, purchases or escrow keys in v1.0; Apple refresh token added. Apple row: no server sees purchases (ADR 0013). Vercel row: website only; `/i/*` logging gap from the security review. Gaps rewritten. Published URL fixed (D-063). Pre-publication draft; minor (adds and removes vendors in the same categories, no new category of content recipient). |
| 1.2.0 | 2026-10-03 | Alignment with PRD.md 1.3 (founder decisions of 3 Oct): RevenueCat removed from section 2 and listed in section 3 as not used (ADR 0013); Apple's role as merchant of record and App Store Server API described; Groq and DeepInfra marked from v1.1; Vercel hosts the contribution page from v1.1; Google sign-in from v1.1; PowerSync marked pending D-023; model host recommendation changed to a zero-egress host (D-046); gaps 6 and 12 closed, gap 13 added. Pre-publication draft; minor (removes a vendor, adds none). |
| 1.1.0 | 2026-10-02 | Privacy review (`memos/lawyer-2.md`): public list must carry vendor contact details (MHMDA access right) and is linked from the CHD policy; processor health-data terms; RevenueCat random id per PRD K-28; PostHog deletion dependency; Apple Declared Age Range and conditional CAPTCHA provider listed; gaps 10 to 12. |
| 1.0.0 | 2026-10-02 | First draft for counsel review. |
