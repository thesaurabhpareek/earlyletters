---
title: Privacy and trust claims register (promise versus implementation)
version: 1.0.0
status: draft-for-counsel
as_of: 2026-10-03
owner: founder (data governance lead role)
companion: data-map.yaml (where each kind of data lives), DATA_CLASSIFICATION.md (levels), compliance-register.md (laws), in-app-disclosures.md (store and paywall strings)
---

# Privacy and trust claims register

> **AI-drafted engineering register for counsel review. Not legal advice.** It records what the product says about privacy and trust, where it says it, and what in the repo makes it true on the date above. It draws no legal conclusions and does not change any published or draft wording; wording changes go to the copy owner (`packages/content`) and to counsel.

> **Freshness warning (4 Oct 2026).** Every row describes the repo as it stood on 3 Oct 2026. Develop has since gained the Supabase client, the sync engine, export, account deletion, the purge worker and `analytics-forget`, and it removed the server purchase tables (`20261004000000_plus_on_device_only.sql`). Statuses for CL-12 to CL-19, CL-22, CL-23 and CL-26, and the sentence below that the app has no Supabase client, are out of date and probably understate what is built; the other rows were not re-verified. Re-check them against the code and re-date the file before it goes to counsel or is cited as evidence of status.

Founder decision 11 (docs/agents/BRIEF-2026-10-03.md): parents must never doubt that their letters are private, never sold, never used for ads and never used to train models, and every such promise is backed by real controls. This register is how we check that.

## How to read it

- **Status**
  - **Implemented**: the repo makes the claim true today for what is built.
  - **Partial**: part of the mechanism is built; the rest is planned work, named in the row.
  - **Not yet**: the claim describes something not built yet, or a feature deferred past v1.0.
- **Verified**: **code** means checked against this repo on 3 Oct 2026; **decision** means a founder decision of 3 Oct not yet visible in code; **doc** means taken from a repo document and not checked against a running system or a contract; **assumed** means the author's assumption.
- Schema items in pending migrations (files 3 to 7, `supabase/APPLY.md`) are built and tested in embedded Postgres but not applied to the live project. The app in this repo does not sync yet: it has no Supabase client, so on 3 Oct 2026 nothing a person writes leaves the phone.
- Copy locations: `strings` is `packages/content/src/strings.en.ts`, `store` is `store.en.ts`, `site` is `site.en.ts` in the same folder.

## Register

| ID | Claim | Where it is made | What implements it | Status | Verified |
|---|---|---|---|---|---|
| CL-01 | We never sell your data | privacy-policy.md (short version); store ("PRIVATE BY DEFAULT"); site (privacy points); strings `sensitiveConsent.use`; consumer-health-data-notice.md | No advertising, attribution or data-broker SDK in `apps/mobile/package.json`; the analytics catalogue carries no ids other than a random analytics id; no data export integration exists | Implemented (nothing in the product transfers data for value) | code |
| CL-02 | No ads; never used for ads or shared with advertisers | privacy-policy.md (short version); store; site; strings `sensitiveConsent.use` | No ad SDKs; PostHog is configured without person properties, GeoIP or session replay (`packages/analytics/src/posthog.ts`). App Store privacy manifest with tracking set to false is described in app-store-privacy-labels.md but was not found in `apps/mobile/app.json` | Implemented in code; privacy manifest is planned work | code |
| CL-03 | Letters, recordings and photos are never used to train AI or machine learning models | privacy-policy.md (short version); strings `sensitiveConsent.use`; subprocessors.md (no-training column) | v1.0 transcription runs on the phone (`whisper.rn`); no content is sent to any AI provider in v1.0 (server transcription is v1.1). Written no-training confirmations from processors that would hold content are listed as gaps in subprocessors.md section 4 | Partial: the architecture sends no content to AI services; contract confirmations are planned work | code (architecture), doc (contracts) |
| CL-04 | Recordings stay on your phone ("live only on this phone", "Recording kept on this phone") | privacy-policy.md (table, "Your phone only"); strings `recordings.onPhoneBody`, `backup.honestNote`, `promise.recordingBody`, `recordingOnPhone`; store; site | Recordings are files in the app sandbox; the app has no upload code; decision 9: no audio upload in v1.0 | Implemented for our servers and processors. The user's own OS device backup (for example iCloud Backup) may include the recordings folder; D-033 (recommended, awaiting founder) keeps it that way and asks for the copy to match | code, decision |
| CL-05 | Optional encrypted backup of recordings, encrypted on the phone, with Standard and Vault modes | privacy-policy.md (short version); strings `backup.title`, `backup.body`, `recordings.backedUpBody`; store ("YOUR VOICE, KEPT"); site (privacy points, FAQ); pricing copy for Plus | ADR 0006 design only; no backup bucket or code | Not yet: decision 9 defers all audio upload to v1.1. Copy that offers backup in v1.0 is to be reconciled by the copy owner before submission | code, decision |
| CL-06 | Family can hear a recording once it is backed up | site (privacy points, FAQ) | None in v1.0 | Not yet: family playback is v1.1 (decision 9) | decision |
| CL-07 | Transcription happens on your phone by default; cloud transcription only after you agree, and that service does not keep the audio | privacy-policy.md (short version); store; site | On-device Whisper (`apps/mobile/src/lib/transcribe-whisper.ts`). Cloud transcription is not built | Implemented for v1.0 (on device only); the cloud part applies from v1.1 | code |
| CL-08 | We never rewrite your words; the original transcript is kept unchanged | store; site; in-app-disclosures.md `help.mistakes`; CLAUDE.md | Edits only through `verifyEdits` (`packages/core/src/verify.ts`); database trigger makes `raw_transcript` immutable (`20260930000000_scribe_core.sql`) | Implemented | code |
| CL-09 | Analytics are off until you say yes, and never include letters, recordings, photos, names or birthdays | privacy-policy.md (short version); strings `analyticsConsent`, `analyticsHelp` | `packages/analytics`: `track()` is a no-op before consent; typed allowlist of L2 properties (`catalog.ts`); required PostHog options. `scripts/check-data-map.mjs` keeps the data map and catalogue in step | Partial: the package is built and tested; the PostHog SDK is not installed in the app yet | code |
| CL-10 | Usage and crash reports are shared only with consent and carry no content | strings `analyticsLabel`, `analyticsHelp`, `analyticsConsent.body` | Crash reporting (Sentry) is described in ADR 0008 and subprocessors.md; not installed | Not yet (crash reporting) | code |
| CL-11 | Letters are private by default; you decide what goes into the book | strings `privateNote`, `privacyLine`; store; site | Device `entries.in_book` defaults to 0; server `entries.in_book` defaults to false; book members read only `book_entries`, which shows in-book letters | Implemented (device); schema built (server, pending apply) | code |
| CL-12 | Only the family you invite can read your book; inviting someone to one book does not open the others | store; site (privacy points, FAQ) | Row level security keyed on book membership; parent-only invites; cross-book leak tests in `supabase/tests` | Partial: schema built and tested, pending live apply; app sync and invites planned | code |
| CL-13 | Raw transcripts, machine edits and timing data are visible only to the author | privacy-policy.md ("Your working notes stay yours"); DATA_CLASSIFICATION.md | Author-only row level security on `entries`; members read `book_entries`, which has no raw transcript, edits or STT metadata | Partial: schema built and tested, pending live apply | code |
| CL-14 | Synced letter text is protected by access rules and encryption at rest; it is not end-to-end encrypted | privacy-policy.md (short version) | Row level security (see CL-12). Supabase encryption at rest is not yet recorded in writing (DATA_CLASSIFICATION open issue 5) | Partial: access rules built; the encryption-at-rest record is planned work | code, doc |
| CL-15 | Staff look at letters only in narrow cases, and that access is restricted and logged | site (FAQ "Who can see my letters?"); privacy-policy.md ("Each access is logged and reviewed") | No staff tool exists. `audit_events` records product actions; the operator access log (`ops_audit_log`, LEGAL-REQ-025) is planned | Partial: no staff access path exists; the access log is planned work | code |
| CL-16 | Contributors never see the due date or birth year | DATA_CLASSIFICATION.md open issue 3 (D-039) | `book_children` view (name, nickname, birthday month and day) and parent-only `children` table, added by PR #32 | Partial: pending PR #32 merge and live apply; contributors are hidden in v1.0 (decision 5) | code |
| CL-17 | You can delete your own letters any time, with 30 days to undo ("Recently deleted") | strings `delete.entryBody`; site; privacy-policy.md | Device tombstone and undo (`apps/mobile/src/lib/store.ts`); server tombstone and `purge_due` after 30 days (pending apply) | Partial: `purge_due` is not scheduled and the Storage purge worker is not built; both are planned work | code |
| CL-18 | You can delete your account, and deletion reaches our processors | privacy-policy.md; DELETION_AND_EXPORT_SPEC.md; strings `deleteAccountNotYet` (states that accounts arrive with sign-in) | `deletion_requests` and steps (pending apply). The deletion worker, the analytics-id deletion route and processor steps are planned | Partial (planned work); in-app copy already says it is not available yet | code |
| CL-19 | You can export your book, free, at any time | privacy-policy.md; store; site (privacy points, FAQ); in-app-disclosures.md | No export code in the app yet (DATA-REQ-050 to -056 specified); strings `exportNotYet` already says export arrives in a coming update | Not yet | code |
| CL-20 | We never make a voiceprint and do not use voices or faces to identify anyone | privacy-policy.md (short version); consumer-health-data-notice.md | No speaker, face or biometric library in the app; guardrail LEGAL-REQ-019 | Implemented (no such processing exists) | code |
| CL-21 | Under 18: the app stops and keeps nothing | privacy-policy.md section 2 | `apps/mobile/src/lib/age-gate.ts`: after a No, the phone keeps only the time of that answer (`ageGate.stoppedAt`) to show the 24-hour stop screen; never an age or birth date; nothing is sent | Implemented as described in data-map.yaml; counsel may want to see that the phone keeps the time of the No for 24 hours | code |
| CL-22 | No server of ours sees purchases (Apple only, on the device) | Founder decision 3 | PR #32 removes the server entitlement tables; StoreKit 2 integration is not built. app-store-privacy-labels.md (Purchases "Linked"), subprocessors.md (Apple row), data-policy.md, DELETION_AND_EXPORT_SPEC.md, ENGINEERING_REQUIREMENTS.md and compliance-register.md still describe server purchase records and App Store Server Notifications | Partial: schema change pending PR #32; those documents need an update by their owners, and the privacy label answer is counsel's call | code, decision |
| CL-23 | Before sync, a separate sensitive-data consent; declining keeps everything on the phone | strings `sensitiveConsent`; consumer-health-data-notice.md HN-4 | Server consent gate (Terms, age attestation, sensitive-data consent) in `20261003000000_security_and_family.sql` (pending apply); the app flow is not built | Partial | code |
| CL-24 | Server pushes never carry the child's name; lock-screen names are off by default | DATA_CLASSIFICATION.md open issue 4 (D-025) | No push code yet | Not yet | code |
| CL-25 | Safety signals stay on the phone; there is no server table for them | CLAUDE.md; DATA_CLASSIFICATION.md; privacy-policy.md | `safety_events` dropped in `20261002020000_data_governance.sql`; v1.0 ships a static support row with no classifier (decision 9) | Implemented | code |
| CL-26 | The languages you speak with your child are kept in a table only you can read and never sent to analytics | privacy-policy.md (languages paragraph) | The analytics catalogue has no language property (checked by `scripts/check-data-map.mjs` against the data map). The owner-only `profile_settings` table is planned, not in a migration. On-demand language packs (decision 15) will be fetched from a host whose access logs could show which pack an IP address requested; see data-map.yaml open issues | Partial: analytics part implemented; the table and the pack host choice are planned work | code, decision |

## Gaps in the documents themselves (for their owners)

These are factual mismatches found while building this register. They are listed, not fixed here, because each sits in a document that will be published or that counsel owns.

1. subprocessors.md names the email provider as a placeholder; decision 13 says email runs through Resend.
2. subprocessors.md says Sign in with Google arrives in v1.1; decision 4 lists it among the v1.0 sign-in methods. One of the two needs to change.
3. Copy and the privacy policy describe recording backup and family playback (CL-05, CL-06), which decision 9 defers to v1.1.
4. Documents listed in CL-22 still describe server purchase records.
5. The store description ("EVERY LANGUAGE, AS SPOKEN") and the website FAQ on languages describe Hindi-English mixing in one sentence; decision 9 moves Hindi-English mode to v1.1 and decision 6 lists seven v1.0 languages (copy owner).

## Upkeep

Add a row in the same pull request that adds a privacy or trust claim to copy or a legal document, or that changes what implements one. Re-date the file and change the status when the mechanism ships.
