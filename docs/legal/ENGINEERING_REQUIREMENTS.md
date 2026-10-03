# Legal Engineering Requirements (`LEGAL-REQ-###`)

Version 1.2.0, 3 Oct 2026 (changelog at the end). Status: draft for counsel.

> **AI-drafted for counsel review. Not legal advice.** Drafted 2 Oct 2026. These requirements translate `compliance-register.md` into testable rules for the technical design and code. Where a requirement rests on an unverified legal reading it says so; build it anyway unless counsel removes it, because each one is cheap now and expensive after launch.

**How to use this file.** Technical design agents and Claude Code sessions MUST satisfy every P0 requirement before public launch (TestFlight beyond the founding family counts as public). P1 requirements must be met before the feature they cover ships. Each requirement has acceptance criteria in Given/When/Then form that should become automated tests where the "Test" line says so. When a requirement conflicts with a PRD, this file wins until counsel or the founder decides otherwise; the conflict is listed in `compliance-register.md` s.4.

**Release tiers (PRD.md 1.3 section 3.0, 3 Oct 2026).** A requirement tied to a feature binds the day that feature ships. The web contribution page moved to v1.1 (founder decision, PRD K-35), so LEGAL-REQ-010 and LEGAL-REQ-035 bind from v1.1, and the web parts of LEGAL-REQ-002, -005 and -014 apply from then; server transcription and the AI gateway are not in v1.0, so LEGAL-REQ-004, -005 and -020 bind when they ship. LEGAL-REQ-030 is met at v1.0 by a static page plus an email route, with the full web flow before Android (D-042). **Counsel to confirm these readings** (BL-104). Nothing here is dropped.

**Second round of founder decisions (3 Oct 2026, D-051 to D-070).** Co-parent only (D-055): LEGAL-REQ-005, -010 and -035 bind when other family members or the web page ship. No audio leaves the phone, no backup, no photos, no cloud transcription in v1.0 (D-059): LEGAL-REQ-004, -005, -013, -020, -022(a) and -023 bind when the feature they cover ships. Apple-only Plus checked on the device with no server (D-053, ADR 0013): LEGAL-REQ-046 to -050 are rewritten below; -049 (per-purchase consent rows) is retired in favour of per-release evidence, pending counsel (Q-003 memo, COUNSEL_PACKET Q8). Sync is the outbox and cursor engine on Supabase (D-023): no PowerSync obligations remain.

**Sources** are register rows (`CR-###`, which carry the citations [L#]) and repo documents. "Policy" means `POLICY_VERSIONING.md`.

Priorities: **P0** launch blocker; **P1** before the related feature ships; **P2** later.

---

## 1. Consent and notice

### LEGAL-REQ-001 (P0) Terms and Privacy acceptance at account creation
The sign-in sheet shows, directly above the sign-in buttons, the child-data notice and "By continuing, you agree to the Terms and Privacy Policy" with both links visually distinct and opening the versioned URL in-app. A successful sign-in that creates an account records `terms` accept and `privacy` acknowledge via `record_policy_act` (Policy s.7). No account exists server-side without a `terms` acceptance row.
- Given a new user on the sign-in sheet, When they complete Apple, Google or email sign-in, Then exactly one `policy_acceptances` row with `document='terms'`, the version offered, `method='signin_sheet'`, `app_version` and `platform` exists for their profile before any other row they own is synced.
- Given the notice text, When rendered at the largest Dynamic Type size, Then it is fully visible without scrolling past the buttons, and links are distinguishable without colour alone.
- Given an existing account with no `terms` row (legacy dogfood), When the app next opens online, Then the re-consent sheet appears before sync resumes.
- Test: automated (UI + DB).
Source: CR-019, CR-081; PRD A-REQ-034 (replace "stored on the profile" with `policy_acceptances`).

### LEGAL-REQ-002 (P0) 18+ age gate, store age signals, and minors' handling
*Revised 2 Oct 2026 per PRD.md 1.2 K-07 and PRD-REQ-019 (founder decision: under 18 is not allowed at all; no local-only mode).* The app asks before first use (an entry gate before first run, invites and sign-in), and account creation and the web contribution page also require age confirmation of 18 or older, presented neutrally (no pre-selected answer, no hint that one answer is "right"). Store only `age_attested=true` plus the signal source in the acceptance `context`; never store a birth date or age range. On iOS, call the Declared Age Range API where required (Texas now; other states as their laws start) and treat any under-18 category as ineligible. Ineligible users see a polite stop screen; there is no local-only mode: they never get first run, recording, a local book, an account, sync, invites or web contribution.
- Given a fresh install, When the user takes any first action (start a book, I was invited, sign in, or an invite link), Then the age question appears first, with nothing preselected.
- Given a user who indicates under 18 or whose store signal is under 18, When they answer, Then a stop screen explains the app is currently for adults 18 and over; no child, letter, recording or auth user is created, nothing is stored on the device except the gate state, and nothing is uploaded.
- Given the under-18 answer, When the user goes back and tries again in the same install, Then the gate stays closed for 24 hours (anti-retry).
- Given a Texas Apple Account, When the app requests the age range, Then the value is used in memory for the decision and is not written to any table, log or analytics event.
- Given the web contribution page, When an invitee taps Send, Then age confirmation is part of the same act and recorded with `contributor-notice` acceptance.
- Given actual knowledge (e.g. support report) that a user or contributor is under 13, When ops runs the under-13 runbook, Then that person's account or contributions are deleted within 10 days and the inviter is told neutrally.
- Test: automated (unit + Apple sandbox for Declared Age Range).
Source: CR-001, CR-004, CR-005, CR-006; conflicts with PRD A s.7(6) "no age gate". Neutral-screen requirement is a counsel question (register s.6 Q6).

### LEGAL-REQ-003 (P0) Analytics and crash reporting are opt-in
No PostHog event and no Sentry event leaves the device until the user has made an explicit choice on a consent sheet (`analytics` document). The sheet appears at a calm moment after the first letter is saved (never before recording, never stacked on the sign-in or notification sheets). Declining has no effect on any feature, including Plus. Withdrawal in Settings > Privacy takes effect immediately and calls PostHog `optOut()` and disables Sentry.
- Given a fresh install, When the user records, saves and reads a first letter without seeing the consent sheet, Then network inspection shows zero requests to PostHog or Sentry hosts.
- Given the user declines, When they use every feature for a week, Then no analytics or crash request is sent, and no Plus feature is unavailable.
- Given consent then withdrawal, When the next event fires, Then it is dropped on device.
- Given consent, When an event is sent, Then it uses the random analytics id (ADR 0008) and passes the allowlist (LEGAL-REQ-017).
- Test: automated (network interception in an E2E run).
Source: CR-082 (Apple 5.1.1(ii): consent "even if such data is considered to be anonymous"); conflicts with PRD A s.7 analytics proposal and A-NFR-002 ("analytics after first frame"). Counsel may allow crash reports under a narrower notice; until then both are opt-in.

### LEGAL-REQ-004 (P0) Explicit, per-feature consent before any content goes to third-party AI
Before server transcription or the LLM edit pass can run for a profile, that profile must have an active `ai-processing` consent (Policy s.7) whose text names: what is sent (audio or text), to whom (provider names from the subprocessor list), why, retention terms (zero retention), no training, and how to withdraw. The AI gateway Edge Function checks `has_active_consent(profile, 'ai-processing')` server-side on every request and refuses otherwise; client-side checks are not sufficient.
- Given no consent, When the client calls the gateway, Then the gateway returns 403 and calls no provider, and the app silently uses the on-device path.
- Given consent withdrawn in Settings, When the next entry is processed, Then it is processed on device only, within one sync of the withdrawal.
- Given a new major version of `ai-processing` (new provider category), When it becomes effective, Then old consent no longer passes the server check until the user re-consents.
- Test: automated (gateway integration test).
Source: CR-085 (Apple 5.1.2(i)); CR-031 (MHMDA sharing consent contents); ARCH s.8; ADR 0002, 0003.

### LEGAL-REQ-005 (P0) Web contributors' content never reaches third-party AI on someone else's consent
Audio and text from the web contribution page (PRD B F6) are transcribed only on a parent's device (B F6.7) unless the contributor personally gave `ai-processing` consent on the web page. The parent's AI consent never covers another person's voice.
- Given a contribution from a web contributor without their own AI consent, When a parent with AI consent opens it, Then transcription runs on device only and the gateway refuses any request tagged with that entry's `source='web'`.
- Test: automated.
Source: CR-085; register s.4 K7.

### LEGAL-REQ-006 (P0) Separate sensitive-data consent
At account creation (after Terms, as a separate act, never pre-checked, never bundled into the Terms checkbox), the app asks for consent to process sensitive information the user may include in letters (health, including mental health, and other sensitive details about the user and their child), stating the only purpose (to keep and show their book), that it is never sold, shared for ads, or used to train models, and how to withdraw. Recorded as `sensitive-data`. If declined, the user can still use the app locally; server features that store their content (sync, backup, family) stay off, and the app says so plainly. Withdrawal follows the same rule and offers export and deletion.
- Given a new account, When the user declines, Then no entry text, audio or photo of theirs is uploaded, and Settings shows how to turn sync on later.
- Given withdrawal, When processed, Then sync of new content stops within one sync cycle and the user is offered export and "delete my synced letters".
- Test: automated.
Source: CR-020 (Connecticut sensitive-data consent; applies to any controller processing sensitive data from 1 Jul 2026), CR-022, CR-031 (MHMDA "separate and distinct" consents; consent cannot be bundled with general terms). Counsel to confirm whether MHMDA's "necessary to provide the requested service" exemption makes this unnecessary for Washington alone; Connecticut still needs it.

### LEGAL-REQ-007 (P0) Permission priming and accurate purpose strings
Microphone and notifications (and photo access, once photos ship) are requested only at the moment of use, after an in-app explanation, with purpose strings approved by counsel and stored in `packages/content`. Photos, when they ship, use the system picker (no full-library permission). Contacts, location, tracking (ATT), Bluetooth and speech-recognition permissions are never requested.
- Given first launch, When the user reaches Tonight, Then no OS permission prompt has appeared.
- Given the Info.plist and Android manifest, When CI inspects them, Then only `NSMicrophoneUsageDescription` (and photo-picker-compatible keys) and notification permission are present; any other permission key fails the build.
- Given microphone denied, When the user taps record, Then a typed-entry path and an Open Settings link are offered, with no repeated OS prompt.
- Test: automated (manifest lint) + manual.
Source: CR-083 (Apple 5.1.1(iii),(iv)); PRD C-REQ-001; PRD B non-goals (no contacts, no location).

### LEGAL-REQ-008 (P0) Every consent is visible and withdrawable in two taps
Settings > Privacy lists each consent (in v1.0: sensitive data and analytics; AI processing and backup mode when those features ship) with its state, the version accepted, a link to the text, and a control to withdraw or grant. Settings > Legal lists Terms, Privacy Policy, Consumer Health Data Privacy Policy, Subprocessors, Accessibility statement, Licences, Legal-process guidelines, Portability pledge.
- Given any consent, When the user opens Settings, Then they can withdraw it in at most 2 taps and the change is recorded with `method='settings_toggle'`.
- Test: automated UI.
Source: CR-081, CR-082 (easy withdrawal), CR-031; PRD C-REQ-016 (add rows).

### LEGAL-REQ-009 (P0) Policy change handling
The app implements the notice and re-consent behaviour in Policy s.5 and s.6: fetch `policy_actions_needed()` on foreground with network; show the change card and, on the effective date, the re-consent sheet; on decline pause only the server features that depend on the changed document; never gate export or deletion.
- Given a major `terms` version effective today, When a user who accepted 1.x opens the app online, Then the re-consent sheet appears before sync resumes, and record/read/export work regardless of the answer.
- Given a minor version, When the user opens the app, Then no sheet appears.
- Test: automated.
Source: Policy s.5 and s.6; CR-011, CR-019.

### LEGAL-REQ-010 (P0) Notice at collection on the web contribution page
The web contribution page shows, before the microphone prompt: who will receive the letter (the inviting parents by relationship name), that it goes into the child's book only if a parent adds it, that the audio is encrypted in the browser, how to see and delete their letters later (return link), links to the contributor notice and privacy policy, and the 18+ confirmation. "Send" records `contributor-notice` acceptance.
- Given a first visit, When the page loads, Then no audio permission is requested and no data other than the invite token check leaves the browser until Send.
- Given Send, When the upload succeeds, Then one `policy_acceptances` row exists for the anonymous session.
- Test: automated (web E2E).
Source: CR-013, CR-101 (minimise for overseas invitees), CR-100; PRD B F6, B-REQ-008.

### LEGAL-REQ-011 (P1) Recording-consent guidance
The recorder's first-use help includes one short line asking users to get permission before recording other people talking. The app never records in the background, never auto-starts recording, and stops recording when the app leaves the foreground unless iOS background audio is explicitly part of a designed feature reviewed by counsel.
- Given recording in progress, When the app is backgrounded, Then recording stops and the audio so far is saved.
- Test: automated.
Source: CR-041 (Cal. Penal Code 632).

---

## 2. Data minimisation and privacy by design

### LEGAL-REQ-012 (P0) Field allowlist
The server stores only fields listed in the data map (`docs/legal/data-map.yaml`, to be created by the technical design agents with this file as input). Never collected: child gender, surname, birth weight, place of birth, precise or coarse location, contacts, user date of birth, phone number, government ids, payment card data.
- Given a migration adding a column, When CI runs, Then a check fails unless the column appears in the data map with purpose, retention and disclosure category.
- Test: automated (schema-to-data-map diff).
Source: CR-083 (5.1.1(iii)), CR-022 (state minimisation), PRD B non-goals.

### LEGAL-REQ-013 (P1, binds when photos ship) Strip location and device metadata from photos
Photos are re-encoded or stripped of EXIF/XMP GPS and device serial metadata on the device before upload or export to the server. The original stays only on the device.
- Given a photo with GPS EXIF, When attached and synced, Then the stored object contains no GPS tags.
- Test: automated (fixture image).
Source: CR-022 (precise geolocation is sensitive data in many states), CR-031 (MHMDA treats location tied to health services as CHD).

### LEGAL-REQ-014 (P0) Content never in URLs, logs, push payloads or support prefill
Entry text, transcripts, audio, child names, signatures, dictionary terms, search queries and tokens never appear in: URL paths or query strings (use POST/RPC bodies), server or Edge Function logs, push payloads (beyond the child-name toggle in C-REQ-009), email subject lines, support prefill, analytics or crash reports.
- Given the full E2E suite with logging at debug level, When logs are scanned for the fixture strings ("Asha", the fixture letter text, the fixture dictionary words), Then there are zero matches outside the database.
- Given a search, When executed, Then the query string is sent in a request body, not a URL.
- Test: automated (log canary scan).
Source: CR-010, CR-110, CR-031 (MHMDA access restriction); CLAUDE.md privacy rules; A-NFR-012.

### LEGAL-REQ-015 (P0) Safety tiers stay on the device
Safety tiering (`packages/core/src/safety.ts`) runs on the device and its results are stored only in the local database. No server table links a person (author id, profile id, analytics id, child id) to a safety tier. If aggregate monitoring is needed, the device may send only a daily count bucket with no identifier, and only with analytics consent. A new migration drops `public.safety_events` or removes `author_id` and stops client inserts.
- Given an entry that triggers tier 2, When the device syncs, Then no row or event containing the tier and any identifier reaches the server or any processor.
- Given C-REQ-014 "On this day", When it excludes entries with safety tiers, Then it does so from local data.
- Test: automated (network + DB inspection).
Source: CR-031 (MHMDA: inferences about mental health are consumer health data), CR-020, CR-014 (sensitive PI), CR-114; register s.4 K3. Copy and patterns also need perinatal clinician review before release (`safety.ts` header).

### LEGAL-REQ-016 (P0) No sale, no sharing for advertising, no tracking
No advertising, attribution, fingerprinting or data-broker SDKs, ever, without a new legal review. No IDFA/GAID access. No ATT prompt (because nothing tracks). Personal data is never sold or "shared" (CCPA cross-context behavioural advertising).
- Given the dependency tree, When CI runs, Then a denylist check fails on known ad/attribution SDKs (e.g. Meta, AppsFlyer, Adjust, Branch, Google Mobile Ads) and on any import of AdSupport or AppTrackingTransparency.
- Test: automated.
Source: CR-014, CR-021, CR-022, CR-010 (claim "no selling your data"); PRD C-NFR-005.

### LEGAL-REQ-017 (P0) Analytics allowlist enforcement
Analytics events and properties come only from the typed catalogue in `packages/analytics`; `before_send` drops unknown properties and strings over 40 characters; no screen autocapture, no touches, no session replay, no person properties beyond the random id.
- Given an event with an unknown property, When sent, Then the property is dropped and a dev-mode error fires.
- Given PostHog config, When CI inspects it, Then `enableSessionReplay`, `captureScreens`, `captureTouches` are false and `defaultOptIn` is false.
- Test: automated.
Source: ADR 0008; CR-082, CR-088, CR-090.

### LEGAL-REQ-018 (P0) Ephemeral clips are ephemeral
"Say the name three times" clips (PRD B F4.3) and any temporary 16 kHz decode buffers are never written to persistent storage or uploaded, and are deleted when the task ends.
- Given the name check completes or is cancelled, When the sandbox is inspected, Then no clip files remain.
- Test: automated.
Source: CR-040; PRD B-REQ-017.

### LEGAL-REQ-019 (P0) No voiceprints, diarization or voice synthesis
No code path may compute speaker embeddings, perform speaker identification or diarization, clone or synthesise a voice, or enable such options at a provider, without a new legal review and BIPA-grade written consent. Authorship is derived from the account, never from the voice.
- Given provider configuration for server ASR, When CI inspects request builders, Then no diarization/speaker parameters are set.
- Given a pull request adding an ML model, When reviewed, Then the checklist asks "does it analyse voice characteristics to identify or distinguish speakers?" and a yes blocks merge pending counsel.
- Test: automated (config lint) + review checklist.
Source: CR-040 (BIPA; transcription alone is not voiceprint collection, speaker recognition is [L22]).

### LEGAL-REQ-020 (P0) AI providers: zero retention, no training, identifiers stripped
The AI gateway sends only the minimum content for the task, strips user, child and device identifiers, sets provider-side zero-retention options (Groq Zero Data Retention enabled before launch), and uses only providers under a signed data processing agreement that prohibits training. Gateway logs record token counts, latency, provider and model only.
- Given a gateway request, When captured at the provider boundary, Then it contains no profile id, child id, email, or name fields other than words inside the user's own text or dictionary prompt.
- Given the provider list in config, When CI runs, Then each provider has a DPA reference and a retention setting in the data map.
- Test: automated + contract checklist.
Source: CR-085, CR-124, CR-090 (server audio not ephemeral without ZDR); ARCH s.8 (Groq may log 30 days unless ZDR).

---

## 3. Security

### LEGAL-REQ-021 (P0) Encryption in transit
All network traffic uses TLS 1.2 or later; iOS App Transport Security has no exceptions; Android cleartext traffic is disabled; the website and web contribution page send HSTS.
- Given a build, When Info.plist and network security config are inspected, Then no ATS exception and no cleartext permission exist.
- Test: automated.
Source: CR-110, CR-090 (Data safety "encrypted in transit").

### LEGAL-REQ-022 (P0) Encryption at rest
(a) When audio upload ships (not v1.0, D-059): audio uploaded to Storage is always client-encrypted (AES-256-GCM, per-file key, ADR 0006), including web contributor uploads (B-NFR-005). (b) On the device, the local database and audio files use iOS Data Protection at least "complete until first user authentication"; recordings and the database are included in the user's own device backup and speech models and packs are excluded (D-033). (c) Supabase Postgres and Storage encryption at rest is confirmed in writing from Supabase documentation (Unverified today) and recorded in the data map. (d) The local expo-sqlite database is not separately encrypted (no SQLCipher; security review 2026-10-04); privacy claims must not say the local database is encrypted beyond iOS Data Protection.
- Given an uploaded audio object, When downloaded with service credentials, Then its bytes are not a valid M4A file without the key.
- Test: automated.
Source: CR-110, CR-017 (encryption relevant to breach liability), CR-010 (claims).

### LEGAL-REQ-023 (P0 when backup ships; not in v1.0) Escrow key controls
The server escrow key that can unwrap Standard-mode child content keys is held only as an Edge Function secret, never in the database or its backups; every unwrap is logged (profile id, child id, reason code, time; no content); unwraps are rate-limited per child; the key can be rotated without user action; Vault-mode children are never escrowed.
- Given a database dump, When searched, Then no escrow key material is present.
- Given 100 unwraps for one child in an hour, When the next is requested, Then it is refused and an alert fires.
- Test: automated.
Source: CR-110, CR-017, CR-010 (escrow disclosure); ADR 0006.

### LEGAL-REQ-024 (P0) Access control is tested
Every table has RLS enabled; every policy and security-definer function has an access test in `supabase/tests`; the sync pull RPCs use the same `book_access` predicate as RLS and have access tests (D-023, D-024). The P0 security fix to `create_child_invite` (any member can mint a parent invite) and the other RLS deltas in PRD B s.5 land before any non-founder family data exists.
- Given CI, When `npm run test:db` runs, Then all access tests and parity tests pass, and a table without RLS fails the build.
- Test: automated.
Source: CR-110; PRD B s.5 RLS mapping; ARCH s.8.

### LEGAL-REQ-025 (P0) Staff and service-role access is break-glass and logged
No staff tool shows entry text, audio or photos. Service-role access to user content happens only through named runbooks (deletion, legal process, verified safety removal per PRD B F8.3), each run writes an audit row (operator, runbook, target ids, reason, time) to an append-only `ops_audit_log`, and access is limited to people who need it.
- Given a runbook execution, When it touches a user's rows, Then exactly one audit row exists and it contains no content.
- Test: automated for the runbook scripts; quarterly manual review of the log.
Source: CR-031 (MHMDA access restricted to those who need it), CR-110, CR-112.

### LEGAL-REQ-026 (P0) Secrets and credentials
All secrets live in the platform secret stores (Supabase, Vercel, EAS), never in the repo or the app bundle; the Apple Sign in with Apple key has a named owner and rotation reminder (A-NFR-009); session and invite tokens are stored in Keychain/Keystore (A-NFR-008); invite tokens travel in URL fragments and only hashes are stored (B-NFR-002).
- Given the repo and the built app bundle, When scanned with a secret scanner, Then no secrets are found.
- Test: automated.
Source: CR-110.

### LEGAL-REQ-027 (P1) Dependency and SDK inventory
A machine-readable inventory of third-party SDKs and services (SBOM plus the data map) is generated each release; known-vulnerability scanning runs in CI; any new SDK requires a data-map entry.
- Given a new dependency that transmits data off the device, When CI runs, Then the build fails unless the data map lists it.
- Test: automated.
Source: CR-090 ("collection by third-party code" must be declared [L18]), CR-110.

### LEGAL-REQ-028 (P0) Written information security programme
Engineering maintains `docs/security/WISP.md` (short): asset and data inventory (links the data map), roles, access control, key management, vendor review, secure development checklist, incident response (LEGAL-REQ-037 to -040), annual review date.
- Given launch readiness review, When checked, Then the WISP exists, has an owner and was reviewed within 12 months.
- Test: manual.
Source: CR-110 (reasonable security; amended COPPA rule's written-programme model [L2] as a benchmark even though COPPA does not apply).

---

## 4. Deletion, retention and export

### LEGAL-REQ-029 (P0) In-app account deletion, end to end
Settings > Your data > Delete account follows PRD C-REQ-019 (export offered first, subscription-billing notice with Apple's manage link, 30-day undo, type to confirm) and, when it completes, deletes or de-identifies the account everywhere: Postgres rows (profiles cascade; entries, versions, dictionary, memberships), Storage objects if any, the stored Apple refresh token after revoking it with Apple (A-NFR-011; capture not built yet, security review H3), PostHog events under every analytics id the phone kept (deleted at request time through the stateless `analytics-forget`, TRACKING_PLAN 7), any Resend contact (none kept in v1.0). Plus is not touched: Apple holds it and we hold no purchase record (ADR 0013). Consent records are pseudonymised, not deleted (Policy s.7.1). The user receives a confirmation email when deletion completes, and the app wipes local data after offering one more export (DATA-REQ-023).
- Given a fixture account with entries, a co-parent book and analytics, When deletion completes, Then a verification script finds no row or object referencing the profile id in any system, except pseudonymised `policy_acceptances`, deletion records and the hashed suppression entry if any.
- Given a co-parent on the book, When one parent deletes, Then the book stays for the other parent with their letters (DATA-REQ-012).
- Test: automated (deletion verification script across systems, run in staging); `supabase/functions/purge-worker` tests.
Source: CR-084 (Apple 5.1.1(v)), CR-091 (Play), CR-031 (MHMDA deletion flowed down to processors), CR-014.

### LEGAL-REQ-030 (P0) Web deletion request page
`https://<domain>/delete-account` names the app, explains what is deleted and what is retained (and why), and lets a user request deletion without the app: they enter their email, receive a magic link and code (same mechanism as PRD A F4), and confirm. Contributors without accounts delete via their return link. The page also links to `/privacy-choices` for other rights requests.
- Given a user without the app installed, When they complete the web flow, Then the same deletion job as LEGAL-REQ-029 runs, with the same 30-day undo.
- Test: automated (web E2E).
Source: CR-091 (Google Play web link requirement [L16]).

### LEGAL-REQ-031 (P0) Deletion service levels
| Event | SLA |
|---|---|
| Letter or recording deleted by the author | Hidden from all members within one sync; hard-deleted from Postgres and Storage 30 days after deletion (undo window) |
| Account or book deletion confirmed | Undo for 30 days; then hard delete from primary systems within 24 hours of the window ending |
| Database and storage backups | Deleted data ages out of all backups within 35 days of the hard delete (backup retention must be configured to 30 days or less; Supabase backup retention Unverified) |
| Processors (PostHog, Resend) | PostHog deleted at request time (`analytics-forget`); Resend keeps no contacts in v1.0 and ages out sent-message data after 30 days, so the completion email remains until about day 60 (the stated exception, Privacy Policy section 10); failures retried and alerted. Apple is not our processor for purchases and we hold no purchase record |
| Rights request by email or web (access, deletion, correction) | Acknowledged within 10 days; completed within 45 days (CCPA response window, Unverified statute text) |
- Given the scheduled purge job, When it runs daily, Then it deletes every tombstone older than 30 days and logs counts only.
- Given a processor deletion failure, When retries exhaust, Then an alert fires within 24 hours.
- Test: automated (purge job tests with clock control).
Source: CR-014, CR-031, CR-084, CR-091; ARCH s.8 (30-day purge); register s.4 K12.

### LEGAL-REQ-032 (P0) Honest deletion across devices
Deleting a letter or recording removes it from the server and instructs every member device to remove its local copy on next sync. The UI states plainly that copies already exported or saved outside the app, and recordings already played on a removed member's phone (PRD B F7), may remain.
- Given two member devices with a cached recording, When the author deletes it, Then both devices remove the file after their next sync.
- Test: automated.
Source: CR-010 (deletion claims), PRD B F7.

### LEGAL-REQ-033 (P0) Retention schedule enforced by code
Each data category in the data map has a retention rule and a job or trigger that enforces it. Minimum set:

| Data | Retention |
|---|---|
| Account, entries, audio, photos | Until the user deletes them or the account (no automatic deletion of keepsake content, including after a Plus lapse; PRD C-NFR-008) |
| Tombstones | 30 days |
| Invite tokens and codes (hashes), web return links once they exist | 90 days after use, revocation or expiry, whichever is first to end the link (`coalesce(revoked_at, accepted_at, expires_at)`; PRD K-18, K-41; D-020) |
| Web contributor return links | Until revoked, or 24 months of inactivity with notice to the inviting parent (proposed) |
| Ops audit log (`ops_audit_log`), security logs (`security_events`), key-unwrap logs | 12 months |
| Product and dispute audit events (`audit_events`, enum-only) | 24 months (DATA-REQ-066; D-021; both clocks listed in the Privacy Policy) |
| Analytics events (PostHog) | Provider retention set to 12 months or less (setting Unverified) |
| Crash reports (Sentry, when added; not in v1.0) | 90 days |
| Emails sent through Resend | 30 days after sending (provider retention) |
| Apple refresh token (`ops.apple_tokens`) | Until revoked at account deletion |
| Policy acceptances | Account life + 3 years (pseudonymised after deletion) |
| Email suppression hashes | Indefinitely (to honour opt-outs) |
| Purchase disclosure records (ARL) | Not kept by us: Apple holds the transaction; we keep per-release evidence of the purchase screen (POLICY_VERSIONING 8; Q-003 memo C-5) |
- Given each rule, When its job runs in staging with time travel, Then data past retention is gone and data within retention is untouched.
- Test: automated.
Source: CR-084 (5.1.1(i) retention disclosure), CR-091, CR-050 (ARL records [L7]), CR-031.

### LEGAL-REQ-034 (P0) Export is complete, free and works offline
Export everything (ARCH s.8; PRD C-REQ-017) produces a ZIP with every entry the user authored (raw transcript, edits, final text, timestamps), their audio and photos, the PDF book, and an `account.json` with their profile fields, memberships, dictionary terms, consent history (`my_policy_state` and full acceptance rows) and plan status. Works offline from local data and in every plan state. A web-initiated access request produces the same ZIP by secure download link.
- Given a lapsed Free user offline, When they export, Then the ZIP contains all categories above and no Plus UI appears.
- Test: automated (ZIP schema check).
Source: CR-014, CR-022 (access and portability rights), CR-010 (claim "export everything any time").

### LEGAL-REQ-035 (P1) Contributor rights without an account
The return-link page lets a web contributor view their letters and status, download them, and delete them (with the same tombstone and purge rules), and shows how to contact support for other requests.
- Given a contributor's return link, When they delete a letter, Then it disappears from the parents' pending list and the book on next sync.
- Test: automated.
Source: CR-014, CR-022, CR-031, CR-101; PRD B F6.

### LEGAL-REQ-036 (P1) Verified rights requests by email
Support can process access, deletion, correction and consent-withdrawal requests received by email after verifying control of the account email (magic link). Each request and its completion are logged (no content) with timestamps to prove SLA compliance.
- Given a request, When logged, Then the log shows receipt, verification, completion dates and the outcome.
- Test: manual + log review.
Source: CR-014, CR-022, CR-031.

---

## 5. Breach response hooks

### LEGAL-REQ-037 (P0) Security event logging
Log, without content: auth events (sign-in, failures, method linking), service-role and runbook use (LEGAL-REQ-025, `ops.audit_log`), escrow unwraps once backup exists (LEGAL-REQ-023), Storage bulk reads and signed-URL creation counts per account, admin console logins (Supabase, Vercel, App Store Connect, PostHog, Resend, Porkbun, the download host, Google Cloud), RLS-denied spikes. Retained 12 months (D-021).
- Given each event type, When triggered in staging, Then a log entry with actor, action, target ids and time exists.
- Test: automated.
Source: CR-110, CR-111.

### LEGAL-REQ-038 (P1) Alerting
Alerts (to the founder's phone) for: escrow unwrap rate anomalies, mass Storage downloads, repeated RLS denials from one account, new admin login from a new device, disabled RLS on any table, secret-scanner hits, processor deletion failures.
- Given a simulated mass download in staging, When it exceeds the threshold, Then an alert arrives within 15 minutes.
- Test: automated drill.
Source: CR-110, CR-111.

### LEGAL-REQ-039 (P0) Affected-user enumeration and notification
A runbook script, given an incident scope (tables, buckets, time window, child or profile ids), returns within one hour the list of affected profiles with their email and the data categories involved, flags whether audio was Standard (escrowed) or Vault mode and whether the escrow key was exposed, and produces counts for regulator notices. Notification email templates (transactional) exist for: individuals, and a holding statement. The incident plan uses the shortest applicable clock (DPDP 72 hours if it applies; HBNR 60 days if it applies; state laws "most expedient time").
- Given a tabletop scenario, When the script runs on staging, Then the affected list is correct against fixtures.
- Test: automated script test + annual tabletop.
Source: CR-017, CR-030, CR-101, CR-111.

### LEGAL-REQ-040 (P0) Kill switches
Remote, audited switches to: revoke all sessions (force re-auth; the `forceReauthEpoch` remote-config field is parsed but not yet acted on, security review L3), pause sync, and pause pack downloads. When their features ship: disable the AI gateway, disable the web contribution page and return links, pause Storage signed-URL issuance, and rotate the escrow key. Local recording, reading and export keep working when any switch is on.
- Given each switch, When flipped in staging, Then the effect occurs within 5 minutes and local features still work offline.
- Test: automated.
Source: CR-110, CR-111.

---

## 6. Store disclosures and claims accuracy

### LEGAL-REQ-041 (P0) One data map drives every disclosure
`docs/legal/data-map.yaml` is the single source of truth: for each data element, where it is collected, purpose, whether it leaves the device, recipients (processor names), linkage to identity, retention, encryption, and the Apple privacy-label and Play Data-safety categories. Privacy Policy sections, store disclosures and the subprocessor page are reviewed against it.
- Given a code change that adds a network destination (new host in the network allowlist) or SDK, When CI runs, Then it fails unless the data map lists it.
- Test: automated (host allowlist and dependency diff against data map).
Source: CR-088, CR-090, CR-081.

### LEGAL-REQ-042 (P0) Store disclosures generated and gated per release
A script renders Apple App Privacy answers and Google Play Data safety answers from the data map. The release checklist requires the founder to confirm that App Store Connect and Play Console match the rendered output for the build being submitted, and stores the export in `docs/legal/evidence/store/<version>/`.
- Given a release build, When the checklist runs, Then the evidence folder for that version exists and its content hash matches the rendered output.
- Test: automated (checklist script) + manual console update.
Source: CR-088, CR-090 (inaccurate declarations lead to enforcement [L18]); Policy s.5.

### LEGAL-REQ-043 (P0) Apple privacy manifest
The app ships a `PrivacyInfo.xcprivacy` covering collected data types and required-reason API use, and every bundled SDK that needs one includes its own. Contents are generated from or checked against the data map.
- Given the built `.ipa`, When inspected, Then the manifest exists and its data types equal the data map's iOS-collected set.
- Test: automated.
Source: CR-088 (Apple privacy manifest rules Unverified, not opened this session).

### LEGAL-REQ-044 (P0) Claims registry and content test
Every privacy, security, AI or "free" claim in `packages/content` (app, website, store listing, emails) is registered in `docs/legal/claims-registry.yaml` with the data-map facts it relies on and counsel approval. `packages/content/test/rules.test.ts` gains a rule: strings containing privacy or security absolutes (for example "never leaves", "only on this phone", "only you", "encrypted", "end-to-end", "HIPAA", "free forever", "anonymous", "we never") fail unless the string key is in the registry. The claims in register s.3 are rewritten before launch.
- Given `settings.backup.honestNote` as written today, When the content test runs, Then it fails until rewritten and registered.
- Given a registered claim whose underlying data-map fact changes (e.g. server ASR added to a default path), When CI runs, Then the claim is flagged for review.
- Test: automated.
Source: CR-010, CR-012, CR-033; register s.3.

### LEGAL-REQ-045 (P0) Adult audience everywhere
Store metadata, website and screenshots never present the app as for children: no "kids", "for kids", "for children" keywords or phrases; no copy suggesting children use the app on their own; age rating questionnaires answered accurately; Google Play target audience 18+.
- Given `store.en.ts`, When the content test runs, Then the keywords and description contain none of the banned child-directed terms (today: "kids", "let them listen on their own" must be removed).
- Test: automated.
Source: CR-001, CR-002, CR-003 (COPPA directed-to-children factors [L1]; Apple 2.3.8 [L13]; Play reclassification [L17]).

---

## 7. Subscriptions

### LEGAL-REQ-046 (P0) Paywall disclosures next to the button
The purchase screen is Apple's `SubscriptionStoreView` (ADR 0013): Apple shows each plan's price, period and any free trial for eligible people, one subscribe button per plan (no plan preselected, PRD C-REQ-022), Restore, and the Terms and Privacy links (to https://earlyletters.com/terms and /privacy). Our marketing content above the plans states what Plus adds, that writing, reading, playing recordings, export and writing with a co-parent stay free, that plans renew automatically until cancelled at least 24 hours before the end, how to cancel, and Family Sharing (`billingCopy.store`). Nothing we add may make the free period more prominent than Apple's price, or state a trial length that Apple's offer does not.
- Given the store view on a release build, When rendered at the default and the largest Dynamic Type size, Then Apple's plans and all of our marketing content are visible and wrap without truncation, and VoiceOver reads them.
- Given a non-eligible account (sandbox), Then nothing we show mentions a free trial.
- Test: on-device check per release (screenshots into the evidence pack, POLICY_VERSIONING 8) plus a content test on `billingCopy.store`.
Source: CR-050, CR-051 (ROSCA), CR-087 (Apple 3.1.2(c)); ADR 0013.

### LEGAL-REQ-047 (P0) Notice timing engine (on the device)
*Rewritten 3 Oct 2026 for D-053 and ADR 0013 (no server sees purchases); position and law in `memos/q-003-subscription-notices.md`, counsel to confirm (COUNSEL_PACKET Q8).* The app schedules plan reminders as local notifications plus an in-app note (in Settings, Plan and on the next open inside the window), from StoreKit data on the phone: the entitlement's expiration date, `RenewalInfo.willAutoRenew` and the introductory-offer type. Only on phones where the transaction's ownership is `purchased` (family members through Family Sharing are not billed and get none). Recomputed on every launch and on every `Transaction.updates` event; all pending reminders are cancelled when auto-renew is off. Nothing leaves the phone. `E` = trial end or period end (UTC); `C` = cancel deadline = `E - 24h`. Windows are data; a missed window is skipped, never sent late.

| Reminder | Applies when | Target | Hard window | Required by |
|---|---|---|---|---|
| Purchase or trial confirmation (in app, with "Save a copy" through the share sheet) | Purchase or trial start | When Apple's sheet closes with `purchased` | Same session | CA 17602(a)(3) retained acknowledgment; MA calendar date to cancel by |
| Trial ending, over 31 days | Annual plan's 2-month trial that will convert | `E - 18d` | `[E-21d, E-16d]` | CA (b)(1); NY 3 to 21 days before `C`; VA within 30 days of the end; UT at least 3 days; MA 5 to 30 before `C`; NYC |
| Trial ending, 31 days or less | Monthly plan's 1-month trial that will convert | `E - 7d` | `[E-8d, E-5d]` | VA if over 30 days; UT; courtesy |
| Trial ending, final | Every trial that will convert | `E - 4d 12h` | `[E-5d, E-4d]` | UT at least 3 days before expiry; courtesy |
| Annual renewal, long | Annual plan, will renew, not in a trial | `E - 30d 12h` | `[E-31d, E-30d]` | UT 30 to 60 before renewal and MA at most 30 before `C` meet only here; CA 15 to 45; NY 15 to 45 before `C` |
| Annual renewal, short | Annual plan, will renew | `E - 7d` | `[E-8d, E-6d]` | Courtesy |
| Yearly reminder for every subscription, monthly included | Each subscription anniversary | Anniversary | Same day | CA 17602(h), read broadly |
| Price increase | Never for existing subscribers ("keep current price" in App Store Connect) | n/a | n/a | CA (g); NY (c); NYC |

- Given an annual subscription renewing on 1 March 00:00 UTC, When the app runs at any time before 29 January, Then a local notification is scheduled inside 29 January 00:00 to 30 January 00:00 UTC, and a short one inside 21 to 23 February; none outside its window.
- Given a 2-month trial ending at `E`, Then reminders are scheduled inside `[E-21d, E-16d]` and `[E-5d, E-4d]`.
- Given auto-renew turned off in Apple's settings, When the app next launches or receives `Transaction.updates`, Then every pending plan reminder is cancelled.
- Given a family member (`familyShared`), Then no plan reminder is scheduled.
- Given notifications are not allowed, Then the in-app note still appears in Settings, Plan and on the next open inside each window.
- Given the child's birthday falls inside a window, Then the reminder still goes inside its window (no birthday shifting outside a window).
- Test: automated (scheduler with clock control over a synthetic year, DST, leap day, trials of 28 to 31 and 59 to 62 days).
Source: CR-050, CR-051, CR-052; Q-003 memo sections 4 and 5; ADR 0013.

### LEGAL-REQ-048 (P0) Cancellation is easy
Settings > Plan shows the trial end or renewal date and a "Manage subscription" button that opens Apple's subscription management (`AppStore.showManageSubscriptions`). Every plan reminder and the purchase confirmation include the same instructions. No retention offer is shown before Apple's screen.
- Given a subscriber, When they tap Manage or cancel, Then the system subscription sheet opens in one tap.
- Test: automated UI.
Source: CR-050 (online cancellation by a prominent direct link [L7]), CR-051.

### LEGAL-REQ-049 (Retired 3 Oct 2026, pending counsel) Purchase consent records
*Retired by D-053 and ADR 0013: no server of ours sees a purchase, so there is no per-purchase `auto-renewal-terms` row and D-049 no longer applies.* Replacement, until counsel answers COUNSEL_PACKET Q8 (memo C-5): Apple's transaction record is the per-person proof; for each release the evidence pack (POLICY_VERSIONING 8) keeps screenshots of Apple's store view with our marketing content at default and largest text size, the Subscription Terms version and the `billingCopy.store` strings, so the exact disclosure shown to any purchaser can be reconstructed from the app version.
- Given a release candidate, When the release checklist runs, Then `docs/legal/evidence/store/<version>/` holds the purchase-screen screenshots and the content hash of `billingCopy.store`.
- Test: release checklist (manual).
Source: CR-050 (consent records 3 years or 1 year after termination [L7]); Q-003 memo.

### LEGAL-REQ-050 (P0) Keep-and-leave promise enforced in code
Writing, reading, playback of recordings, export and writing with a co-parent never consult the StoreKit entitlement and never show a paywall (PRD C-NFR-004, C-REQ-017, C-REQ-028). A lapse, refund or billing failure removes only Plus extras (new books beyond the free ones, Read together after the free sessions); existing books stay fully usable.
- Given StoreKit unavailable and a lapsed plan, When the user writes, reads, plays and exports, Then all succeed with no Plus UI.
- Test: automated.
Source: CR-012 (honouring "free" promises), CR-010.

---

## 8. Accessibility

### LEGAL-REQ-051 (P0) WCAG 2.2 AA across app, web, legal pages, paywall and emails
Meet WCAG 2.2 AA (contrast, target size, focus, labels, Dynamic Type to AX5, Reduce Motion, no time limits without control) on: every app screen, the website, the web contribution page, the deletion and privacy-choices pages, legal documents, the paywall, and HTML emails. Consent and legal texts must be readable with screen readers and at large text sizes without truncation.
- Given CI, When automated accessibility checks (axe for web, React Native accessibility lint and snapshot tests at AX5) run, Then there are zero critical violations.
- Given a release, When the manual VoiceOver/TalkBack script for sign-in, consent sheets, paywall, deletion and web contribution is run, Then every step is completable.
- Test: automated + manual script per release; external audit annually.
Source: CR-070; PRD A-NFR-005, B-NFR-006, C-NFR-006.

### LEGAL-REQ-052 (P1) Accessibility statement and feedback route
Publish an accessibility statement (`accessibility` document) with the conformance target, known gaps and a contact route; Settings > Help links to it.
- Given the website, When a user opens `/legal/accessibility`, Then the statement and a working contact route appear.
- Test: manual.
Source: CR-070.

---

## 9. Messaging

### LEGAL-REQ-053 (P0) Email classification and CAN-SPAM controls
Every email template in `packages/content` declares `class: transactional | commercial`. Commercial templates include a one-click unsubscribe, the company postal address and clear identification; unsubscribes are honoured immediately and kept as hashed suppression entries even after account deletion. Transactional templates (magic link, receipts, trial and renewal notices, policy-change notices, deletion confirmations) contain no promotional content beyond incidental branding. Subjects never include child names or letter text.
- Given a commercial template without an unsubscribe link or postal address, When the content test runs, Then it fails.
- Test: automated.
Source: CR-060; CR-061.

### LEGAL-REQ-054 (P0) Push notifications carry no content and no promotions
Push payloads contain no letter text, transcripts or audio references; child names only when the user setting allows (C-REQ-009); no promotional pushes in v1. Plan notices are transactional.
- Given every push type, When payloads are generated in tests, Then none contains fixture letter text, and the name appears only when the setting is on.
- Test: automated.
Source: CR-061 (Apple 4.5.4), LEGAL-REQ-014.

---

## 10. Platform, content and legal process

### LEGAL-REQ-055 (P0) Sign-in and account features per Apple and Google rules
Keep PRD A requirements A-REQ-012 to A-REQ-021 and A-NFR-011 as legal requirements: local use without account, Sign in with Apple wherever Google sign-in is offered on iOS, account deletion in-app, Apple token revocation on deletion.
- Covered by PRD A acceptance criteria.
Source: CR-080, CR-084.

### LEGAL-REQ-056 (P1) Report a concern and member removal
Settings > Help has "Report a concern" (family member behaviour, a safety worry, something illegal) that opens a support form without content prefill; parents can remove family members (B-REQ-010); support has a runbook for verified safety removals (PRD B F8.3) and for apparent child sexual abuse material reports (counsel-led, preservation then report; no browsing beyond what the runbook requires).
- Given a report, When submitted, Then a ticket with category and account ids (no letter content unless the reporter pastes it) is created and acknowledged by email.
- Test: manual.
Source: CR-086, CR-113.

### LEGAL-REQ-057 (P1) Legal process and preservation
Engineering provides a service-role script that can preserve a specific account's data (snapshot to a restricted bucket, 90-day expiry, audit-logged) on counsel's instruction, without anyone reading content. No other access path for legal requests exists.
- Given a preservation run, When complete, Then the snapshot exists, is access-restricted and an audit row records it.
- Test: automated.
Source: CR-112, CR-113.

### LEGAL-REQ-058 (P0) Launch geography controls
iOS availability is set to the United States storefront only (Android likewise later). The website and app contain no EU/UK/India-targeted pricing, language or marketing. The web contribution page is reachable from any country but collects only what LEGAL-REQ-010 allows, sets no non-essential cookies, and stores no IP-derived location. No code stores a user's country or state. The storefront Apple reports stays on the phone (ADR 0013).
- Given App Store Connect, When the release checklist runs, Then territory availability equals {United States} and the evidence is saved.
- Given the web contribution page, When loaded, Then only strictly necessary cookies or storage are set.
- Test: manual checklist + automated cookie check.
Source: CR-100, CR-101, CR-102; register s.5.

### LEGAL-REQ-059 (P1) Child-collection features need legal sign-off
Features that could capture a child's own voice or input with our knowledge (sibling letters B-REQ-020, any "let your child record" prompt, any child-facing mode) are behind a feature flag that cannot be enabled in production until counsel's written opinion on COPPA is linked in the flag's description.
- Given the flag registry, When CI runs, Then flags tagged `child-input` are off in production config unless an `approved_by_counsel` link is present.
- Test: automated.
Source: CR-001; register s.4 K6.

### LEGAL-REQ-060 (P1) No health-feature drift
No integration with HealthKit, Health Connect, wearables, or structured health logs (growth, feeding, sleep, medication, symptoms) without re-running register rows CR-016, CR-030 and CR-031.
- Given the dependency tree and entitlements, When CI runs, Then HealthKit / Health Connect entitlements are absent.
- Test: automated.
Source: CR-016, CR-030, CR-031.

---

## Traceability summary

| Register area | Requirements |
|---|---|
| Children and age (CR-001 to -006) | 002, 045, 059 |
| FTC s.5 and claims (CR-010 to -012) | 009, 014, 016, 032, 034, 044, 050 |
| California and state privacy (CR-013 to -023) | 001, 003, 006, 008, 012, 013, 016, 029 to 036 |
| Health data (CR-030 to -033) | 006, 015, 060 |
| Voice and recording (CR-040 to -042) | 011, 018, 019 |
| Subscriptions (CR-050 to -054) | 046 to 050 |
| Messaging (CR-060 to -062) | 053, 054 |
| Accessibility (CR-070, -071) | 051, 052 |
| Apple (CR-080 to -089) | 001, 003, 004, 007, 008, 029, 042, 043, 055, 056 |
| Google Play (CR-090 to -094) | 029, 030, 041, 042, 045 |
| International (CR-100 to -102) | 010, 058 |
| Security and legal process (CR-110 to -114) | 014, 015, 021 to 028, 037 to 040, 056, 057 |

## Sources

Citations [L#] are listed with URLs in `compliance-register.md` (all opened 2 Oct 2026). Repo inputs: PRD A, B, C; ARCHITECTURE.md; ADR 0001 to 0010; `supabase/migrations/*`; `packages/core/src/safety.ts`; `packages/content/src/{strings,site,store}.en.ts`; `POLICY_VERSIONING.md` (SQL smoke-tested in PGlite). Unverified items are marked inline (Supabase encryption-at-rest and backup retention, PostHog retention setting, Apple privacy-manifest rules, CCPA response window statute text, Declared Age Range API details beyond Apple's news post).

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.2.0 | 2026-10-03 | Alignment with the founder decisions of 3 Oct 2026, second round (D-051 to D-070). Release-tier paragraph for D-055 and D-059 (013, 022(a), 023 and the web and AI requirements bind when their features ship). 007 and 008 scoped to v1.0 permissions and consents. 022: device backup decided (D-033), no SQLCipher. 024: sync access tests replace PowerSync parity (D-023). 029 rewritten to the built purge worker (Apple token revocation, PostHog at request, Resend, no purchase mapping). 031 and 033: Resend 30-day exception; purchase ledger and ARL record rows removed. 037 consoles updated. 040: v1.0 switches, `forceReauthEpoch` gap (security review L3). 046 to 050 rewritten for Apple-only Plus on the device: Apple's store view (046), on-device reminder engine (047, Q-003), Apple's manage sheet (048), 049 retired for per-release evidence, 050 keep-and-leave without an entitlement service. 058: no storefront stored. Not a published document; no notice. |
| 1.1.0 | 2026-10-03 | Alignment with PRD.md 1.3 (founder decisions of 3 Oct; `docs/DECISIONS.md`). Release-tier note: web-page requirements (010, 035 and web parts of 002, 005, 014) bind from v1.1; AI requirements (004, 005, 020) bind when the gateway ships; 030 reduced at v1.0 (D-042); counsel to confirm. RevenueCat removed (ADR 0013): 029 deletion steps, 031 processors, 037 consoles, 049 reconciliation, 058 storefront source. 033: invite hashes 90 days keyed on use, revocation or expiry (K-18, D-020); `audit_events` 24 months beside 12-month ops and security logs (D-021); purchase ledger 7 years. 047 rewritten to the K-38 hard windows (final trial notice at E-4d12h; annual renewal inside [E-31d, E-30d]; long trial inside [E-21d, E-16d]). Not a published document; no notice. |
| 1.0.0 | 2026-10-02 | First version; 2 Oct revision of 002 for the 18+ entry gate. |
