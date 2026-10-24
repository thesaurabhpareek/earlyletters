# Legal Engineering Requirements (`LEGAL-REQ-###`)

Version 1.3.0, 16 Oct 2026 (changelog at the end). Status: draft for counsel.

> **AI-drafted for counsel review. Not legal advice.** Drafted 2 Oct 2026. These requirements translate `compliance-register.md` into testable rules for the technical design and code. Where a requirement rests on an unverified legal reading it says so; build it anyway unless counsel removes it, because each one is cheap now and expensive after launch.

**How to use this file.** Technical design agents and Claude Code sessions MUST satisfy every P0 requirement before public launch (TestFlight beyond the founding family counts as public). P1 requirements must be met before the feature they cover ships. Each requirement has acceptance criteria in Given/When/Then form that should become automated tests where the "Test" line says so. When a requirement conflicts with a PRD or a founder decision, this file wins until counsel decides otherwise: only counsel retires or relaxes a LEGAL-REQ, and a founder decision that collides with one becomes an open decision row with the legal default built until counsel answers (R4 PT-06; D-105). The conflict is listed in `compliance-register.md` s.4.

**Release tiers (PRD.md 1.3 section 3.0, 3 Oct 2026).** A requirement tied to a feature binds the day that feature ships. The web contribution page moved to v1.1 (founder decision, PRD K-35), so LEGAL-REQ-010 and LEGAL-REQ-035 bind from v1.1, and the web parts of LEGAL-REQ-002, -005 and -014 apply from then; server transcription and the AI gateway are not in v1.0, so LEGAL-REQ-004, -005 and -020 bind when they ship. LEGAL-REQ-030 is met at v1.0 by a static page plus an email route, with the full web flow before Android (D-042). **Counsel to confirm these readings** (BL-104). Nothing here is dropped.

**Second round of founder decisions (3 Oct 2026, D-051 to D-070).** Co-parent only (D-055): LEGAL-REQ-005, -010 and -035 bind when other family members or the web page ship. No audio leaves the phone, no backup, no photos, no cloud transcription in v1.0 (D-059): LEGAL-REQ-004, -005, -013, -020, -022(a) and -023 bind when the feature they cover ships. Apple-only Plus checked on the device with no server (D-053, ADR 0013): LEGAL-REQ-046 to -050 are rewritten below; -049 (per-purchase consent rows) is retired in favour of per-release evidence, pending counsel (Q-003 memo, COUNSEL_PACKET Q8). Sync is the outbox and cursor engine on Supabase (D-023): no PowerSync obligations remain.

**Option B (founder, 15 Oct 2026; D-100 to D-108 in PR #128, D-093 to D-099 in PR #122; PRD V2 on branch `docs/prd-v2`).** Server features are on in v1.0: sign-in, sync, co-parent sharing with at most two parents per book, the owner's encrypted recording backup (free, opt-in) with an escrow key under logged access (D-102), and the subscription status report with reminder emails (D-080, D-081). No analytics SDK in v1.0 (D-095). Effects on this file, each marked "(1.3.0)" where it changes a requirement:
- Bind in v1.0 now: LEGAL-REQ-022(a) and -023 (backup and escrow, rewritten for PRD V2 F08 6.5); -049 (restored as the D-081 consent record); -047 (two channels: phone and email).
- Do not bind in v1.0, because the feature is absent: LEGAL-REQ-003 and -017 (analytics, D-095), -004, -005, -013, -020 (AI, photos), -010, -035 (web contributors). Each binds the day its feature ships.
- New: LEGAL-REQ-061 (backup consent act), -062 (status report allowlist), -063 (new-device notice before any recording key is released), -064 (legal documents carry no stale prices or on-device claims).
- Built and not built (checked 16 Oct 2026; COUNSEL_PACKET section 0 has the table). Not built yet: server pushes (-054), the new-device notice (-063), the status report and reminder emails (-047 email channel, -049, -062), and the phone side of backup (-022(a), -061). Each requirement still binds the day its feature ships; until then the published texts leave the feature out or say it is not available yet (-064).
- The gate before any outside family signs in is PRD V2 09 R-17 (BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322, BL-349); it is not repeated here.

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
*(1.3.0) v1.0 ships no analytics SDK and no consent sheet (D-095): `EXPO_PUBLIC_ANALYTICS` is off in every profile and the PostHog client is never constructed. The v1.0 test is that no request to an analytics or crash host leaves the phone at all. The text below binds the day analytics returns (v1.1).*
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
At account creation (after Terms, as a separate act, never pre-checked, never bundled into the Terms checkbox), the app asks for consent to process sensitive information the user may include in letters (health, including mental health, and other sensitive details about the user and their child), stating the only purpose (to keep and show their book), that it is shared with the co-parent they invite (1.3.0: the text names the co-parent, not "the family you choose"), that it is never sold, shared for ads, or used to train models, and how to withdraw. Recorded as `sensitive-data`. Recording backup has its own consent act (LEGAL-REQ-061), unless counsel rules that this one covers it (COUNSEL_PACKET Q42). If declined, the user can still use the app locally; server features that store their content (sync, backup, family) stay off, and the app says so plainly. Withdrawal follows the same rule and offers export and deletion.
- Given a new account, When the user declines, Then no entry text, audio or photo of theirs is uploaded, and Settings shows how to turn sync on later.
- Given withdrawal, When processed, Then sync of new content stops within one sync cycle and the user is offered export and "delete my synced letters".
- Test: automated.
Source: CR-020 (Connecticut sensitive-data consent; applies to any controller processing sensitive data from 1 Jul 2026), CR-022, CR-031 (MHMDA "separate and distinct" consents; consent cannot be bundled with general terms). Counsel to confirm whether MHMDA's "necessary to provide the requested service" exemption makes this unnecessary for Washington alone; Connecticut still needs it.

### LEGAL-REQ-007 (P0) Permission priming and accurate purpose strings
Microphone and notifications (and photo access, once photos ship) are requested only at the moment of use, after an in-app explanation, with purpose strings approved by counsel and stored in `packages/content`. Photos, when they ship, use the system picker (no full-library permission). Contacts, location, tracking (ATT), Bluetooth and speech-recognition permissions are never requested. (1.3.0) The microphone purpose string states only what the microphone is for and says nothing about where recordings are kept, because it is shown to every user whatever their backup setting (F08-REQ-036; labels 1.4.0 section 5). `NSFaceIDUsageDescription` is allowed only if the app lock ships, with a counsel-approved string (F17 Q3).
- Given first launch, When the user reaches Tonight, Then no OS permission prompt has appeared.
- Given the Info.plist and Android manifest, When CI inspects them, Then only `NSMicrophoneUsageDescription` (and photo-picker-compatible keys) and notification permission are present; any other permission key fails the build.
- Given microphone denied, When the user taps record, Then a typed-entry path and an Open Settings link are offered, with no repeated OS prompt.
- Test: automated (manifest lint) + manual.
Source: CR-083 (Apple 5.1.1(iii),(iv)); PRD C-REQ-001; PRD B non-goals (no contacts, no location).

### LEGAL-REQ-008 (P0) Every consent is visible and withdrawable in two taps
Settings > Privacy lists each consent (1.3.0, in v1.0: sensitive data, and recording backup, which Settings > Storage and backup also controls; analytics returns in v1.1; AI processing and the backup mode choice when those features ship) with its state, the version accepted, a link to the text, and a control to withdraw or grant. Settings > Legal lists Terms, Privacy Policy, Subscription Terms, Subprocessors, Accessibility statement, Licences, Legal-process guidelines, Portability pledge; and the Consumer Health Data Privacy Policy only if counsel says a separate notice is required (1.3.0; COUNSEL_PACKET Q32).
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
(a) (1.3.0, binds in v1.0 when backup ships, D-100) Audio uploaded to the backup store (the private Supabase Storage bucket `entry-audio`, as PRD V2 F08 and the migration on `feat/backup-server` build it; the founder's list of 15 Oct named Cloudflare R2, and the founder confirms which) is always encrypted on the phone before upload: AES-256-GCM in 64 KiB segments with a per-file key, wrapped by a book key per (child, author, key version) held in the author's Keychain; the original's SHA-256 sits only inside the encrypted header; the server keeps the ciphertext hash, size and wrapped file key in `audio_blobs` (PRD V2 F08 6.5; ADR 0006 amendment pending). The same rule binds web contributor uploads when they ship (B-NFR-005). (b) On the device, the local database and audio files use iOS Data Protection at least "complete until first user authentication"; recordings and the database are included in the user's own device backup and speech models and packs are excluded (D-033). (c) Supabase Postgres and Storage encryption at rest is confirmed in writing from Supabase documentation (Unverified today) and recorded in the data map. (d) The local expo-sqlite database is not separately encrypted (no SQLCipher; security review 2026-10-04); privacy claims must not say the local database is encrypted beyond iOS Data Protection.
- Given an uploaded audio object, When downloaded with service credentials, Then its bytes are not a valid M4A file without the key.
- Test: automated.
Source: CR-110, CR-017 (encryption relevant to breach liability), CR-010 (claims).

### LEGAL-REQ-023 (P0, v1.0 from the first build with backup) Escrow key controls
*(1.3.0) Rewritten for option B and PRD V2 F08 6.5 C and G, which hold the one custody description; this requirement states what the legal texts rely on (Privacy Policy 2.1.0 section 4; Terms 3.1.0 section 7.2).* The escrow private key runs only as a function secret in the separate escrow project, alone with the `escrow` function, never in the main project, the database, its backups, a password manager or a networked file; two sealed paper copies are kept in two places and their seals checked every quarter. Every key the function opens writes one append-only `escrow_unwraps` row (profile, device, child, key version, reason `restore`, `rotation` or `legal`, outcome, request, time; no content, no key bytes), copied daily outside database backups. The account owner gets an email on every use, except a `legal` use a legal order forbids telling. A restore needs a sign-in within 10 minutes and a registered device, waits 72 hours when another enrolled device exists (24 hours when none) unless a device enrolled at least 7 days before the request approves (D-108), and is stopped by the Stop link or Not me. Limits: 3 new-device restores per account per 30 days, 20 opened keys per account per day. The key can be rotated without user action. The function returns keys only sealed to the requesting device. Vault mode, when it ships, is never escrowed.
- Given the main project, When the release check lists its secrets and functions through the Management API, Then no secret name starts with `ESCROW_` and no function is named `escrow`; and the escrow project holds only the `escrow` function and the nine settings of F08-REQ-034 as amended (D-108).
- Given any opened key, Then exactly one `escrow_unwraps` row exists and an email was queued to the account address, And an `UPDATE` or `DELETE` on that table by any role other than the two named exceptions fails.
- Given a restore request on an account with an enrolled device, When 71 hours pass without approval, Then no key is released; When the Stop link button is posted, Then the request is cancelled and every session signed out, And loading the page alone changes nothing.
- Given the fourth new-device restore in 30 days, Then it is refused with `SCRAT` and the founder is paged.
- Test: automated (F08-REQ-029, -034, -042) plus the quarterly seal check written in `docs/runbooks/`.
Source: CR-110, CR-017, CR-010 (escrow disclosure); ADR 0006; D-102; PRD V2 F08 6.5 C, G; R4 PT-02, PT-19.

### LEGAL-REQ-024 (P0) Access control is tested
Every table has RLS enabled; every policy and security-definer function has an access test in `supabase/tests`; the sync pull RPCs use the same `book_access` predicate as RLS and have access tests (D-023, D-024). The P0 security fix to `create_child_invite` (any member can mint a parent invite) and the other RLS deltas in PRD B s.5 land before any non-founder family data exists.
- Given CI, When `npm run test:db` runs, Then all access tests and parity tests pass, and a table without RLS fails the build.
- Test: automated.
Source: CR-110; PRD B s.5 RLS mapping; ARCH s.8.

### LEGAL-REQ-025 (P0) Staff and service-role access is break-glass and logged
No staff tool shows entry text, audio or photos. Service-role access to user content happens only through named runbooks (deletion, legal process, verified safety removal per PRD B F8.3), each run writes an audit row (operator, runbook, target ids, reason, time) to an append-only `ops_audit_log`, and access is limited to people who need it. (1.3.0) No product or legal text may say that every access is logged until three things hold (PRD V2 F17 8.2 item 6; R4 PT-03): database-level audit of service-role and dashboard sessions is live; the release check in LEGAL-REQ-023 passes; and a quarterly log review is written down. Until then the texts say only when we look at letters and who can (Privacy Policy 2.1.0 section 3), and claim no logging of staff access to letters.
- Given a runbook execution, When it touches a user's rows, Then exactly one audit row exists and it contains no content.
- Given `packages/content` and `docs/legal`, When the claims test runs, Then no string claims every access is logged while the F17 8.2 item 6 flag in the claims registry is false.
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
Settings > Your data > Delete account follows PRD C-REQ-019 (export offered first, subscription-billing notice with Apple's manage link, 30-day undo, type to confirm) and, when it completes, deletes or de-identifies the account everywhere. (1.3.0) The systems are those of PRD V2 F17 8.4 for the option B build: Postgres rows (profiles cascade; entries, versions, dictionary, memberships, `held_drafts`, `account_sessions_seen`, `push_tokens`, `notify_outbox`); backup objects in the backup store, `audio_blobs`, `child_keys`, `backup_devices` and `restore_requests` (after the phone has offered to bring recordings that exist only in backup, F08 6.5 D1); the D-080 status record; the stored Apple refresh token after revoking it with Apple (A-NFR-011, BL-330); any Resend contact. Plus is not touched: Apple holds it. Kept as named exceptions, each listed on the deletion screen, the web page and Privacy Policy 2.1.0 section 7: pseudonymised `policy_acceptances` and the D-081 consent record; pseudonymised `audit_events`, `ops.audit_log` and `escrow_unwraps`; the deletion record; a suppression hash; and, while a purchased subscription is still active, a billing-notice record (email, plan, next date) until it ends (counsel, COUNSEL_PACKET Q41 c). No analytics exist in v1.0 (D-095); when they return, PostHog events go through `analytics-forget` at request time. Consent records are pseudonymised, not deleted (Policy s.7.1). The user receives a confirmation email when deletion completes, and the app wipes local data after offering one more export (DATA-REQ-023).
- Given a fixture account (the fictional Asha family) with entries, a co-parent book, backed-up recordings, a held letter and a status record, When deletion completes, Then a verification script finds no row or object referencing the profile id in any system, except the named exceptions above.
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
| Processors (Supabase recovery project, Resend; PostHog from v1.1) | (1.3.0) The recovery project holds no user data of ours, only the escrow function and its secrets. No analytics in v1.0 (D-095); from v1.1 PostHog is deleted at request time (`analytics-forget`). Resend keeps no contacts in v1.0 and ages out sent-message data after 30 days, so the completion email remains until about day 60 (the stated exception, Privacy Policy section 10); failures retried and alerted. Apple is not our processor for purchases and we hold no purchase record |
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
| Ops audit log (`ops_audit_log`), security logs (`security_events`) | 12 months |
| Recovery-key log (`escrow_unwraps`) and its daily copy | (1.3.0) 24 months, pseudonymised at account deletion; daily copies in `ops-ledger/escrow/` 60 days (PRD V2 F08 section 8). D-021 says 12 months for key-unwrap logs: counsel and the coordinator resolve the conflict (COUNSEL_PACKET Q51); the drafts follow PRD V2 |
| Product and dispute audit events (`audit_events`, enum-only) | 24 months (DATA-REQ-066; D-021; both clocks listed in the Privacy Policy) |
| Backup objects, `audio_blobs`, `child_keys` | (1.3.0) Until the letter is erased, backup is turned off with delete, or the account is deleted; never by inactivity (F08 6.5 F) |
| `backup_devices`; `restore_requests`; Stop-link tokens | (1.3.0) Account deletion; 90 days after a final state; 7 days or first use |
| `account_sessions_seen` | (1.3.0) 90 days after the session ends; deleted at account deletion |
| `push_tokens`; `notify_outbox` | (1.3.0) Sign-out, deletion, an APNs unregistered answer, or 90 days unseen; 7 days after sent |
| Subscription status record (D-080) | (1.3.0) Life of the account; a billing-notice record until a purchased subscription ends, if counsel agrees (Q41) |
| Purchase consent record (D-081) | (1.3.0) Life of the account plus 3 years, pseudonymised at deletion unless counsel requires it linked (Q41 e) |
| Analytics events (PostHog, from v1.1) | Provider retention set to 12 months or less (setting Unverified) |
| Crash reports (Sentry, when added; not in v1.0) | 90 days |
| Emails sent through Resend | 30 days after sending (provider retention) |
| Apple refresh token (`ops.apple_tokens`) | Until revoked at account deletion |
| Policy acceptances | Account life + 3 years (pseudonymised after deletion) |
| Email suppression hashes | Indefinitely (to honour opt-outs) |
| Purchase disclosure records (ARL) | (1.3.0) The D-081 consent record above, plus per-release evidence of the purchase screen (POLICY_VERSIONING 8) |
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
Log, without content: auth events (sign-in, failures, method linking), service-role and runbook use (LEGAL-REQ-025, `ops.audit_log`), escrow unwraps (LEGAL-REQ-023; v1.0 from the first backup build), restore requests and Stop-link uses, new-device sign-ins, Storage bulk reads and signed-URL creation counts per account, admin console logins (Supabase main and escrow projects, Vercel, App Store Connect, Resend, Porkbun, Cloudflare, Google Cloud; PostHog from v1.1), RLS-denied spikes. Retained 12 months (D-021), except `escrow_unwraps` (LEGAL-REQ-033).
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
Remote, audited switches to: revoke all sessions (force re-auth; the `forceReauthEpoch` remote-config field is parsed but not yet acted on, security review L3), pause sync, and pause pack downloads. (1.3.0) In v1.0 also: `backupUploads` (stop new backup uploads), `escrow` (stop every key release; the escrow project's own switch as well) and `statusReport` (stop the status report and the reminder emails it drives), per PRD V2 F19 WP-F19-16; and rotate the escrow key. When their features ship: disable the AI gateway, disable the web contribution page and return links, and pause Storage signed-URL issuance. Local recording, reading and export keep working when any switch is on.
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
Every privacy, security, AI or "free" claim in `packages/content` (app, website, store listing, emails) is registered in `docs/legal/claims-registry.yaml` with the data-map facts it relies on and counsel approval. `packages/content/test/rules.test.ts` gains a rule: strings containing privacy or security absolutes (for example "never leaves", "only on this phone", "only you", "encrypted", "end-to-end", "HIPAA", "free forever", "anonymous", "we never") fail unless the string key is in the registry. The claims in register s.3 are rewritten before launch. (1.3.0) No string anywhere says "only your family's keys", "only you can play", or that we cannot read letters or listen to recordings (D-102); no string a person with backup on can see says recordings stay on the phone; the microphone string says nothing about where recordings are kept (LEGAL-REQ-007). PRD V2 F21 6.5 holds the v1.0 claims list until `claims-registry.yaml` exists (F21-REQ-028). The legal documents themselves are checked by LEGAL-REQ-064.
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
The purchase screen is Apple's `SubscriptionStoreView` (ADR 0013): Apple shows each plan's price, period and any free trial for eligible people, one subscribe button per plan (no plan preselected, PRD C-REQ-022), Restore, and the Terms and Privacy links (to https://earlyletters.com/terms and /privacy). Our marketing content above the plans states what Plus adds (1.3.0: keeping new letters after the first 2, D-082), that every letter a person keeps stays theirs to read, play and export with or without Plus, that plans renew automatically until cancelled at least 24 hours before the end, how to cancel, and Family Sharing (`billingCopy.store`). It never types a price, "free trial", "free months" or "we will email you" (D-083); Apple's view shows the price and any trial to eligible people. Nothing we add may make the free period more prominent than Apple's billed amount.
- Given the store view on a release build, When rendered at the default and the largest Dynamic Type size, Then Apple's plans and all of our marketing content are visible and wrap without truncation, and VoiceOver reads them.
- Given a non-eligible account (sandbox), Then nothing we show mentions a free trial.
- Test: on-device check per release (screenshots into the evidence pack, POLICY_VERSIONING 8) plus a content test on `billingCopy.store`.
Source: CR-050, CR-051 (ROSCA), CR-087 (Apple 3.1.2(c)); ADR 0013.

### LEGAL-REQ-047 (P0) Notice timing engine (on the phone and by email)
*(1.3.0) Option B adds a second channel. With an account, the D-080 status report lets the server email every notice in the table below, from the same windows, to the purchaser's account address (PRD V2 F14 6.6; `docs/emails/CATALOG.md` section 7); the server never sends outside a window, never sends unless the report's `environment` is production, projects the next renewal one period at a time while not cancelled, and every email says "If you have already cancelled, there is nothing to do." Notices key on the actual free period and offer type (introductory, promotional, offer code), not on the product (R4 PT-10). The phone reminders below were built in #121 and are described to people as a courtesy that can come late or not at all (D-094); whether the legally required notices may be described that way is COUNSEL_PACKET Q41 (a), and until counsel answers, the emails are built as the required channel. Phone reminder text carries the date and where to change the plan, never a price (D-083); emails carry the published price.* The original 3 Oct text follows, for the phone channel. The app schedules plan reminders as local notifications plus an in-app note (in Settings, Plan and on the next open inside the window), from StoreKit data on the phone: the entitlement's expiration date, `RenewalInfo.willAutoRenew` and the introductory-offer type. Only on phones where the transaction's ownership is `purchased` (family members through Family Sharing are not billed and get none). Recomputed on every launch and on every `Transaction.updates` event; all pending reminders are cancelled when auto-renew is off. The phone channel sends nothing off the phone; the status report is LEGAL-REQ-062. `E` = trial end or period end (UTC); `C` = cancel deadline = `E - 24h`. Windows are data; a missed window is skipped, never sent late.

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

### LEGAL-REQ-049 (P0, restored in 1.3.0) Purchase consent records
*(1.3.0) Restored for option B (D-081; PRD V2 F14 "LEGAL-REQ-049 Rev"). For a signed-in purchaser, the first status report after a purchase or trial carries the consent facts: product, offer type, the Subscription Terms version shown (`none_outside_app` for an offer code redeemed outside the app), and the time; one record per original purchase, identified by `sub_ref` (a salted hash of the original transaction id, never the id in clear). Kept for the life of the account plus 3 years, pseudonymised at deletion, unless counsel requires it to stay linked for 3 years or 1 year after the contract ends (COUNSEL_PACKET Q41 e). A purchaser who never signs in has no record of ours; Apple's transaction and the evidence pack below are the proof for them.*
- Given a signed-in purchase in the sandbox, When the first report reaches the server, Then exactly one consent record exists for that `sub_ref` with the four facts and no other field.
The 3 Oct evidence pack stays for everyone: Apple's transaction record is the per-person proof; for each release the evidence pack (POLICY_VERSIONING 8) keeps screenshots of Apple's store view with our marketing content at default and largest text size, the Subscription Terms version and the `billingCopy.store` strings, so the exact disclosure shown to any purchaser can be reconstructed from the app version.
- Given a release candidate, When the release checklist runs, Then `docs/legal/evidence/store/<version>/` holds the purchase-screen screenshots and the content hash of `billingCopy.store`.
- Test: release checklist (manual).
Source: CR-050 (consent records 3 years or 1 year after termination [L7]); Q-003 memo.

### LEGAL-REQ-050 (P0) Keep-and-leave promise enforced in code
(1.3.0, D-082, D-083, D-103) Only the Keep step of a new letter after the person's first 2 kept letters consults the entitlement. Capturing, typing, reviewing, reading, playing recordings, Read together, starting a book, writing with a co-parent, recording backup and restore, export, deletion and restoring from Recently deleted never consult it and never show a paywall (`FreeForever` in `packages/core/src/plan.ts`; PRD V2 F14 section 4). A letter waiting at the Keep step is never discarded, hidden or truncated. A lapse, refund or billing failure only stops new keeps; every kept letter stays readable, playable and exportable.
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
Every email template in `packages/content` declares `class: transactional | commercial`. Commercial templates include a one-click unsubscribe, the company postal address and clear identification; unsubscribes are honoured immediately and kept as hashed suppression entries even after account deletion. Transactional templates (sign-in links and codes, new-device notices, backup restore and recovery-key notices, trial and renewal notices, cancelled and ended notices, policy-change notices, deletion confirmations) contain no promotional content beyond incidental branding and no Plus offer. Subjects never include child names or letter text. (1.3.0) Whether the website's "tell me when it is ready" emails are commercial, and so need the postal address, is COUNSEL_PACKET Q34; until then they carry it once the founder supplies one.
- Given a commercial template without an unsubscribe link or postal address, When the content test runs, Then it fails.
- Test: automated.
Source: CR-060; CR-061.

### LEGAL-REQ-054 (P0) Push notifications carry no content and no promotions
Push payloads contain no letter text, transcripts or audio references; child names only when the user setting allows (C-REQ-009); no promotional pushes in v1. Plan notices are transactional. (1.3.0) The server-sent pushes planned for v1.0 are the co-parent letter notice (generic, no ids, F11) and the time-sensitive backup restore request (no ids, F08 6.5 C3); both pass the payload test. (16 Oct) Not built: `packages/api/src/server/push.ts` has payload shapes only, with no sender and no token table, so the published texts mention no push.
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

## 11. Option B additions (1.3.0, 15 Oct 2026)

### LEGAL-REQ-061 (P0, v1.0 from the first backup build) Recording backup has its own consent act
Backup is off until the owner turns it on, from one sheet that says, in words counsel approves: encrypted on this phone first; we keep a recovery key so recordings can come back on a new phone; we use it only through our recovery service, which logs every use and emails the owner each time; never listened to, sold or used to train models; other family members cannot hear these recordings yet (PRD V2 F08 6.5 A, 6.7). The tap records a `backup` accept act through `record_policy_act` (POLICY_VERSIONING 1.2.0). The server refuses `backup_begin` and `backup_store_key` without an active act (`SCCON`). Turning backup off records a withdraw act and offers keep or delete with nothing preselected; nothing that exists only in backup is deleted before the phone has offered to bring it here (F08 6.5 D). Counsel may rule that the sensitive-data consent covers backup instead (COUNSEL_PACKET Q42 d); until then this requirement stands.
- Given a signed-in owner with no `backup` act, When the phone calls `backup_begin`, Then the server returns `SCCON` and stores nothing.
- Given backup on and 3 recordings that exist only in backup, When the owner turns backup off and chooses delete, Then the phone first shows the count and the bring-here action, and no object is deleted until the person confirms that exact count.
- Test: automated (F08-REQ-035, -039).
Source: CR-031 (MHMDA; voice recordings in the biometric examples), CR-020; R4 PT-22; D-102.

### LEGAL-REQ-062 (P0) The status report sends exactly the allowed fields
The subscription status report (D-080) and its first-purchase consent facts (D-081) are an allowlist, typed in `packages/api`, sent to one authenticated, idempotent endpoint: plan, trial end date, renewal date, cancelled flag, `sub_ref`, `environment`; and once, product, offer type, Subscription Terms version, time. Never receipts, signed transactions, transaction ids in clear, prices, card or payment data, or `appAccountToken`. Only a phone whose transaction is `purchased` reports; Family Sharing members never do. The server never enforces Plus and never answers whether a person is a member.
- Given the report schema, When a test adds any field outside the allowlist, Then the schema test fails.
- Given a network capture of a sandbox purchase, Then the only request to our servers about it carries the allowlisted fields.
- Test: automated (schema test; network capture in the release run).
- Status (16 Oct): not built. The `subscription-status` handler is a shell and nothing is written; the published texts say our servers do not receive purchases until it ships.
Source: CR-050, CR-088 (the label's Purchases row); R4 PT-07; PRD V2 F14 6.6.

### LEGAL-REQ-063 (P0) A new device is announced before it can receive any recording key
Every sign-in from a device the account has not used sends the new-device email with a Stop link before any escrow request from that device can be released (PRD V2 F02-REQ-017, F02-REQ-025; F08 6.5 C10). The Stop page is scanner-safe: loading it changes nothing; only its button acts.
- Given a new device, When it signs in and immediately asks for recording keys, Then the email is queued first and the request is held per LEGAL-REQ-023.
- Test: automated (F08-REQ-029, -042).
- Status (16 Oct): not built. There is no `account_sessions_seen` table and no sender; the published texts do not mention the notice until it ships. Backup must not release a key to a new device before this ships, or counsel relaxes it.
Source: CR-110; R4 PT-19.

### LEGAL-REQ-064 (P0) The legal documents describe the build, not an earlier plan
`docs/legal` carries no stale Plus prices and none of the on-device claims of the PR #81 drafts. A test in `packages/content/test/legal-docs.test.ts` fails when: a document outside a changelog section names the Plus prices that D-082 superseded; the no-data label answer appears outside the history sections of `app-store-privacy-labels.md`; a published document (Privacy Policy, Terms, Subscription Terms, service providers, delete-account page) makes one of the on-device claims of the PR #81 drafts (that nothing is collected, that there is no account) or breaks the D-102 wording rules (the exact patterns live in the test, so this file never repeats them); the Terms or Subscription Terms prices differ from `packages/content/src/pricing.ts`; a published document's version line, frontmatter version and newest changelog row differ; or any file in `docs/legal` holds a non-ASCII character. (Founder direction, 15 Oct 2026.) A published document also fails when it carries an internal reference (a decision, ADR, backlog, requirement or pull request id, the PRD, a TODO or a note for counsel), a placeholder other than the founder blanks [legal name], [mailing address], [county], [effective date] and [phone number], or the name of a product the build does not use (an analytics or crash service, a billing SDK, an AI provider, or Google while the build does not offer Sign in with Google). Published texts describe only what the code does, or say plainly that a feature is not available yet; a planned feature is added back, with notice, in the release that builds it (review of PR #163, 16 Oct 2026). Claims that a provider cannot open what it stores fail the test while the provider hosts the keys. The dated memos in `docs/legal/memos/` are records and are not checked for prices or claims.
- Given a document that reintroduces a superseded price outside its changelog, When `npm test` runs, Then the test fails and names the file and line.
- Test: automated.
Source: CR-010 (FTC Act s.5 claims); R4 PT-01, PT-05; PRD V2 F21-REQ-013; D-082, D-102.

---

## Traceability summary

| Register area | Requirements |
|---|---|
| Children and age (CR-001 to -006) | 002, 045, 059 |
| FTC s.5 and claims (CR-010 to -012) | 009, 014, 016, 032, 034, 044, 050, 064 |
| California and state privacy (CR-013 to -023) | 001, 003, 006, 008, 012, 013, 016, 029 to 036 |
| Health data (CR-030 to -033) | 006, 015, 060, 061 |
| Voice and recording (CR-040 to -042) | 011, 018, 019 |
| Subscriptions (CR-050 to -054) | 046 to 050, 062 |
| Messaging (CR-060 to -062) | 053, 054 |
| Accessibility (CR-070, -071) | 051, 052 |
| Apple (CR-080 to -089) | 001, 003, 004, 007, 008, 029, 042, 043, 055, 056 |
| Google Play (CR-090 to -094) | 029, 030, 041, 042, 045 |
| International (CR-100 to -102) | 010, 058 |
| Security and legal process (CR-110 to -114) | 014, 015, 021 to 028, 037 to 040, 056, 057, 063 |

## Sources

Citations [L#] are listed with URLs in `compliance-register.md` (all opened 2 Oct 2026). Repo inputs: PRD A, B, C; ARCHITECTURE.md; ADR 0001 to 0010; `supabase/migrations/*`; `packages/core/src/safety.ts`; `packages/content/src/{strings,site,store}.en.ts`; `POLICY_VERSIONING.md` (SQL smoke-tested in PGlite). Unverified items are marked inline (Supabase encryption-at-rest and backup retention, PostHog retention setting, Apple privacy-manifest rules, CCPA response window statute text, Declared Age Range API details beyond Apple's news post).

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.3.0 | 2026-10-15 | Option B (founder, 15 Oct 2026; D-100 to D-108; D-093 to D-099; PRD V2 F02, F08, F11, F14, F17, F18). Header: option B paragraph; only counsel retires or relaxes a LEGAL-REQ (R4 PT-06). 003: no analytics SDK in v1.0 (D-095). 006: consent names the co-parent; backup has its own act. 007: microphone string says nothing about where recordings are kept; Face ID only with the app lock. 008: v1.0 consents are sensitive data and backup. 022(a) and 023: bind in v1.0, rewritten to F08 6.5 (per-author keys, separate escrow project, append-only log, email per use, holds, Stop link, limits, release check). 025: no "every access is logged" claim until F17 8.2 item 6 holds. 029: deletion across every option B system with named exceptions. 031, 033: recovery project; retention rows for backup, devices, restore requests, sessions, push tokens, status and consent records; `escrow_unwraps` 24 months (conflict with D-021 flagged, COUNSEL_PACKET Q51). 037, 040: escrow, restore and new-device logging; `backupUploads`, `escrow`, `statusReport` kill switches. 044: D-102 wording bans. 046: Plus is keeping letters after 2; no prices typed by us (D-083). 047: second channel, emails from the status report; phone reminders a courtesy (D-094) pending Q41. 049: restored as the D-081 consent record. 050: only the Keep step after 2 letters is gated (D-082, D-103). 053, 054: v1.0 email and push types. New: 061 backup consent act, 062 status report allowlist, 063 new-device notice before key release, 064 legal documents test. Not a published document; no notice. 16 Oct (review of PR #163): build status lines for -047, -049, -054, -061, -062, -063; -023 follows D-108 (7-day approval device, nine settings); -064 adds "describe only what is built" and the provider-cannot-open check. |
| 1.2.0 | 2026-10-03 | Alignment with the founder decisions of 3 Oct 2026, second round (D-051 to D-070). Release-tier paragraph for D-055 and D-059 (013, 022(a), 023 and the web and AI requirements bind when their features ship). 007 and 008 scoped to v1.0 permissions and consents. 022: device backup decided (D-033), no SQLCipher. 024: sync access tests replace PowerSync parity (D-023). 029 rewritten to the built purge worker (Apple token revocation, PostHog at request, Resend, no purchase mapping). 031 and 033: Resend 30-day exception; purchase ledger and ARL record rows removed. 037 consoles updated. 040: v1.0 switches, `forceReauthEpoch` gap (security review L3). 046 to 050 rewritten for Apple-only Plus on the device: Apple's store view (046), on-device reminder engine (047, Q-003), Apple's manage sheet (048), 049 retired for per-release evidence, 050 keep-and-leave without an entitlement service. 058: no storefront stored. Not a published document; no notice. |
| 1.1.0 | 2026-10-03 | Alignment with PRD.md 1.3 (founder decisions of 3 Oct; `docs/DECISIONS.md`). Release-tier note: web-page requirements (010, 035 and web parts of 002, 005, 014) bind from v1.1; AI requirements (004, 005, 020) bind when the gateway ships; 030 reduced at v1.0 (D-042); counsel to confirm. RevenueCat removed (ADR 0013): 029 deletion steps, 031 processors, 037 consoles, 049 reconciliation, 058 storefront source. 033: invite hashes 90 days keyed on use, revocation or expiry (K-18, D-020); `audit_events` 24 months beside 12-month ops and security logs (D-021); purchase ledger 7 years. 047 rewritten to the K-38 hard windows (final trial notice at E-4d12h; annual renewal inside [E-31d, E-30d]; long trial inside [E-21d, E-16d]). Not a published document; no notice. |
| 1.0.0 | 2026-10-02 | First version; 2 Oct revision of 002 for the 18+ entry gate. |
