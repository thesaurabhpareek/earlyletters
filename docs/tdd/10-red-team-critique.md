# TDD 10: Red-team critique and minimal launch path

Persona: skeptical principal engineer, red team and simplifier. Date: 3 Oct 2026. Branch `develop` at `2ab1de9`.
Scope: cross-cutting issues that can sink a v1 iOS launch. Details belong to TDD 01 to 09; this document ranks their findings, adds what nobody owns, and proposes the smallest launch that still honours the constitution (CLAUDE.md) and the P0 LEGAL-REQ and DATA-REQ set.

Labels: **[F]** fact from the repo (file cited), **[A]** assumption, **[R]** recommendation, **[Risk]**, **[Q]** open question for the founder or counsel. Prices marked **Unverified** were not re-checked today; they come from `docs/ARCHITECTURE.md` section 7 (opened 1 Oct 2026) or are estimates (**E**).

AI-drafted engineering critique. Where it touches legal duties it is not legal advice; every recommendation that would drop or defer a LEGAL-REQ is flagged as needing counsel.

---

## 0. Verdict in one paragraph

The engine (`packages/core`), the content discipline and the governance SQL are better than most funded startups ship. The product around them does not exist yet, and the requirements set is sized for a 10-person team: about 150 PRD requirements, 60 LEGAL-REQ (roughly 50 P0) and about 55 DATA-REQ, almost all marked launch-blocking. The 4-week backlog (`docs/BACKLOG.md`) ends at sign-in; family, export, deletion, reminders, Plus, backup and the web page all sit in "Later". Meanwhile the one thing the product is for, turning a spoken minute into a faithful letter, cannot run in a release build (`transcribe-whisper.ts` always reports `decoder-missing`). **v1 will not ship by being completed; it will ship by being cut.** Section 6 cuts it to about 11 weeks to App Store submission.

---

## 1. The 15 biggest launch risks, ranked

Ranking = probability it happens times how badly it hurts a v1 launch (rejection, data loss, trust-ending incident, or the founder stalling). "Owner TDD" points to where the detail lives; this table does not repeat their fixes beyond one line.

| # | Risk | Kind | Evidence | Mitigation | Owner TDD |
|---|---|---|---|---|---|
| 1 | **The core loop does not work in a release build.** No spoken letter can be transcribed, and a spoken letter with no transcript cannot be saved. On-device speed and memory of a 574 MB turbo model on the reference iPhone SE 3 are unmeasured. | Technical | [F] `apps/mobile/src/lib/transcribe-whisper.ts`: `availability()` returns `'decoder-missing'` unconditionally; `pcmFor()` throws for M4A. [F] TDD 03 X-1, X-2 (`review.tsx` saves only in phase `ready`). [F] PRD 7.7: "30 s or less ... (**Unverified**)". [F] No model download code exists (`MODEL_FILE` is only looked up). | Week 2 to 4: M4A to 16 kHz decoder module, resumable SHA-verified model download, audio-first save with `waiting_for_model`. Run the device spike (BL-043) **before** any more UI work; if turbo misses budget on SE 3, ship `small-q5_1` as default and turbo as opt-in. | 03 |
| 2 | **Recordings lost on backgrounding or kill.** Durability is quality attribute 1 ("nothing a parent records is ever lost"), yet a call, a lock or an OOM kill mid-recording loses the take or orphans an L4 file. | Technical, trust | [F] TDD 01 C-01, C-02: `listen.tsx` has no AppState handling; the draft row is created only after Stop. | Draft row before the first audio byte; stop-and-save on background; orphan sweep on launch that re-attaches files. Kill-during-save test (PRD 7.4, 500 iterations) as a gate. | 01, 06 |
| 3 | **Scope will never converge.** Every requirement is P0; the window plan reaches only sign-in by 30 Oct. A solo non-engineer cannot verify ~250 acceptance criteria. | Founder-operability | [F] PRD section 3 (A 35+14, B 25+10, C 34+9, PRD-REQ 20, all mostly P0); [F] ENGINEERING_REQUIREMENTS: 60 LEGAL-REQ, P0 by default; [F] BACKLOG "Later" holds family, export, deletion, reminders, Plus. [F] TDD 05 estimates 5 to 6 engineer-weeks for privacy G2 alone; TDD 08 4 to 5 for payments. | Adopt the minimal launch path (section 6). Re-tier requirements into **v1.0 gate / v1.1 / later** in PRD 1.3, with counsel agreeing which LEGAL-REQ are feature-scoped (they only bind when the feature ships, which LEGAL-REQ's own text already allows for P1). | 10 |
| 4 | **App Store rejection on avoidable grounds.** | App Store review | [F] PRD K-13 puts "beta" in the store description; App Review Guideline 2.2 says demos, betas and trial versions do not belong on the App Store and should use TestFlight (guideline text as I know it; re-read before submission, **Unverified today**). [F] `app.json` name and scheme are `lumira-letters` / `lumiraletters`; no bundle identifier; no microphone purpose string set by us. [F] Whisper model path is `Paths.document/models` (`transcribe-whisper.ts`), which iOS backs up; ADR 0001 says Application Support, backup-excluded. Apple has historically rejected apps that put large re-downloadable data in backed-up storage (iOS Data Storage Guidelines). Account deletion (5.1.1(v)) is mandatory once accounts exist and is "Later" in the backlog. | Run the "beta" on **TestFlight public link** (external testers, Beta App Review) and submit 1.0 to the store with no beta label (K-13 rewritten, Terms 16.4 kept or reworded by counsel). Fix identity via `app.config.ts` from `packages/brand` (BL-031). Model to Application Support with `NSURLIsExcludedFromBackupKey`. In-app account deletion is in the v1 cut. Pre-submission checklist in section 5. | 01, 05 |
| 5 | **A family member can make themselves a parent, and contributors bypass approval.** For a product about a child's private book this is the incident that ends the company. | Security, trust | [F] `20260930000000_scribe_core.sql` `create_child_invite`: checks only `is_child_member`, inserts with column default `role = 'parent'`; not replaced in `20261002020000_data_governance.sql`; applied live (APPLY.md row 1). [F] TDD 02 C2, TDD 07 Q-01: a test asserts the contributor read defect as correct. [F] TDD 04 S-2: no `is_anonymous` handling anywhere. | One migration before any non-founder data: parents-only invite creation with explicit role, rate limit, audit; fix `book_entries` predicate and `entries_author_update`; replace the wrong test. Defer contributors and anonymous auth from v1 (section 6), which removes most of the surface. | 02, 04, 07 |
| 6 | **No safety net around agent-written code.** Unattended runs every 4 hours open PRs; there is no CI and no branch protection; migrations are pasted into the live project's SQL editor; "dev" and "live" are the same Supabase project. A non-engineer merging SQL security changes cannot catch an RLS hole. | Operational, founder-operability | [F] ADR 0011 context (4-hourly run); [F] TDD 07 Q-02 (`.github/` absent); [F] `supabase/APPLY.md` ("Dashboard > SQL Editor ... Paste"); BL-015 applies to "the dev Supabase project (us-west-1)" while APPLY.md calls `early-letters` "the live project". | Week 1: CI + branch protection (BL-004, BL-005); two Supabase projects (staging, production) with migrations applied only by `supabase db push` from CI on tag; **pause unattended runs** until CI is green and limit them to `packages/*` and docs; any PR touching `supabase/` or auth needs a second independent agent review plus the founder's explicit "approve migration" step. | 07, 02 |
| 7 | **Consent and policy machinery makes published statements false.** Sign-up fails for 30 days after any major policy change; sensitive-data consent is enforced only by the client; purge covers one bucket; none of the governance migration is live. | Legal | [F] TDD 05 X-01 (`policy_actions_needed` vs `record_policy_act`), X-03 (`has_active_consent` revoked from `authenticated`, so RLS cannot use it), X-04 (`purge_due` enqueues only `entry-photos`); [F] APPLY.md: migration 4 pending. | Fix X-01 and X-03 in the same migration as risk 5. X-04 shrinks to nothing in v1 if no audio or photo leaves the phone (section 6). Apply to staging, then production, before TestFlight external. | 05 |
| 8 | **The durability promise is not true for Free users, and the privacy copy is not true either.** Free audio lives in the app's Documents directory; backup is Plus; family can hear recordings only through backup. If iCloud device backup is on, "recordings live only on this phone" is false; if it is off, a lost phone loses the child's voice. | Trust, legal (claims), support | [F] `store.ts` header: audio "kept in the app's document directory"; [F] C section 4.1 row "Encrypted backup ... Plus"; [F] PRD K-33; [F] C OQ5 "Does iOS device backup include our app's audio directory?" still open; [F] `settings.recordings.onPhoneBody` "Without backup, recordings live only on this phone" (PRD section 8). | Decide OQ5 now: **embrace iCloud device backup** as the free durability floor (keep audio in a backed-up directory, model excluded), and rewrite the claim to "on this phone and in your iPhone's own backup if you use one". Add a restore drill to QA. Cloud backup becomes a v1.1 Plus feature with a simple scheme (section 2). | 01, 05 |
| 9 | **Key-management design that a solo founder cannot operate.** Per-child keys, X25519 grants per member device, a custom native module for synchronizable Keychain items, server escrow, Vault mode with a 24-word Recovery Kit, and browser-side encryption to an inbox key. Any bug is permanent voice loss; none of it ports to Android (iCloud Keychain). | Technical, operational | [F] ADR 0006 decision items 1 to 4; [F] B-NFR-005 ("child's inbox public key"); [F] LEGAL-REQ-022(a), -023. | Defer all of it from v1 (no audio upload in v1). For v1.1, one scheme: per-file key, wrapped by a server KMS key, member playback through an Edge Function that checks membership. Vault mode later, if anyone asks. Counsel to confirm the v1.1 claim wording. | 04 |
| 10 | **Web contribution page is a second product.** Anonymous auth, browser recording and encryption, a cross-author write (a parent's phone writes a raw transcript under the contributor's author id), return links, Hindi page, WCAG on web, `apps/web` does not exist. | Technical, security | [F] B F6, PRD K-08, K-09 note; [F] no `apps/web`; [F] TDD 04 S-2. | Move to v1.1 with contributors. v1 family = co-parent in the app. | 02, 04 |
| 11 | **The founder's external long poles gate everything.** No company, no domain, no Apple org account; brand is `example.com`; universal links, SMTP, Sign in with Apple Services ID, legal URLs and App Store Connect products all wait on them. Counsel must review about 10 documents; the safety copy waits on a perinatal clinician. | Operational, legal | [F] README "Founder to-dos"; PRD Q5 open; BL-053 `needs-decision`; [F] `packages/core/src/safety.ts`: "PENDING PERINATAL CLINICIAN REVIEW. Do not ship to anyone outside the founding family". [A] D-U-N-S and Apple organisation enrollment take days to weeks. | Start this week, in parallel with engineering (section 6 M0). Choose the name and register the domain now; the cost of a wrong choice later is a rename, the cost of waiting is the whole schedule. | 10 |
| 12 | **Safety classifier: a regex judging postpartum mental health.** False negatives look negligent, false positives feel surveillant, and it pulls consumer-health-data law into a memory book. | Legal, trust | [F] `safety.ts` regexes and copy, unreviewed; [F] LEGAL-REQ-015, -060; Consumer Health Data notice exists because of it. | [R] v1 ships **without** the classifier unless the clinician signs off by M5; instead a static, always-available "If you are struggling" row in Settings > Help with the same verified resources. Keep the code behind a flag. Founder decision (section 8). | 05 |
| 13 | **Hinglish accuracy disappoints the core segment.** Base large-v3 is about 30% WER on Hinglish; the constitution correctly forbids an LLM from "making it nicer", so the review screen is the only repair. | Product, technical | [F] ADR 0012 table (29.74% CoSHE-500); [F] experiment not yet run on founder recordings. | Run the 14-recording experiment before M2 ends; decide script (Devanagari vs Roman) then. Set expectations in copy ("you can fix any word"); typed and mixed entries stay first-class. Do not add a server model to v1. | 03 |
| 14 | **Payments and California auto-renewal notices are 4 to 5 engineer-weeks plus Apple lead time**, with subtle per-account entitlement rules (twins exemption, joined books, gifts, lapse) and a notice engine that must be exactly right. | Technical, legal, cost | [F] TDD 08 estimate; [F] PRD K-04 schedule, K-28, PRD-REQ-015, PRD-REQ-020; [F] `create_child(p_name, p_date_of_birth)` has no Plus check and no due-date parameter; [F] Read together count is a local setting (`readTogether.sessions`) reset by reinstall. | [R] Ship 1.0 free; add Plus in 1.1 after retention data (section 8 Q1). If the founder insists on revenue at launch: annual only, no trial, one product; this removes the trial notice arm and most of K-04. | 08 |
| 15 | **Analytics breadth costs more than it returns at v1.** 71 events, a consent sheet that becomes the third ask, PostHog deletion plumbing that conflicts with "not linked", and data from the ~40% who consent. | Legal, cost, focus | [F] `packages/analytics/src/catalog.ts` (~71 event keys); [F] TRACKING_PLAN 1.2 assumes 40% consent; [F] TDD 05 X-02 (analytics id deletion contradiction); [F] DATA_CLASSIFICATION 6 items 1 and 2 (goals and languages properties unresolved). | [R] v1: no third-party SDKs. Use server aggregates (PRD-REQ-017, already the source for business totals), App Store Connect analytics and Xcode Organizer crash reports (Apple-side, user-consented, no SDK, no privacy-label line). Keep `packages/analytics` code; wire PostHog in 1.1 when there is a question it must answer. | 05 |

Next tier (watch, not top 15): Expo SDK 57 / RN 0.86 / Reanimated 4.5 / Uniwind compatibility unproven on device (BL-030 not run); expo-sqlite to op-sqlite swap corrupting rows (TDD 01 R-02); verifier holes reachable once a model pass ships (TDD 03 X-3, keep the pass off); LEGAL-REQ-030 web deletion page for a US iOS-only launch.

---

## 2. Over-engineering: cut or defer

Each verdict is **Cut** (remove from the plan), **Defer** (v1.1 or later, keep the design), **Simplify** (ship a smaller version) or **Keep**.

| Item | What the docs say | Verdict | Why |
|---|---|---|---|
| **PowerSync Cloud + op-sqlite** | ADR 0004: managed sync, Sync Streams that must mirror RLS, parity test, attachment queue; replaces expo-sqlite. | **Defer. v1 uses expo-sqlite (already shipped) with an outbox push and a cursor pull.** | [F] The app already runs on expo-sqlite (`store.ts`); the swap is an unplanned data migration (TDD 01 R-02). [F] The data is tiny: about 240 text rows per family per year (PRD 7.3). [F] Entries are author-owned and `raw_transcript` is immutable, so write conflicts are nearly impossible: the only mutable fields are the author's own edits and `in_book`. A pull of `entries` (own) and `book_entries` (others) since a server cursor, plus an idempotent upsert RPC keyed by client UUIDv7, is about 300 lines and keeps **one** visibility definition (RLS) instead of two (RLS plus Sync Streams). ADR 0004's fear of hand-rolled sync is about general CRDT-like problems this schema does not have. Revisit PowerSync when photos and audio sync arrive or at 10k families. Needs an ADR 0004 amendment. |
| **Per-child keys, X25519 grants, synchronizable Keychain module, escrow, Vault mode, Recovery Kit, browser inbox keys** | ADR 0006, B-NFR-005, LEGAL-REQ-022(a), -023 | **Defer all; v1 uploads no audio.** v1.1: per-file AES-GCM key wrapped by a server-held key; Edge Function unwraps for members. | Highest complexity per user benefit in the repo; the only custom native code; not portable to Android; any bug is permanent loss. Client-side encryption with a server-wrapped key still satisfies the letter of LEGAL-REQ-022(a) (counsel to confirm). |
| **104 prompts** | `packages/content/src/prompts.ts`, selection in `packages/core` | **Simplify: ship ~30 vetted prompts for 0 to 12 months, keep the rest in the file behind month ranges.** | Prompts are cheap to keep, but each is a claims and tone review item for counsel and the content test; `together` prompts are already off (PRD-REQ-005). Fewer prompts, better reviewed, ship faster. |
| **Full analytics catalogue (71 events, opt-in sheet, PostHog, Sentry)** | PRD-REQ-016 to 018, ADR 0008, TRACKING_PLAN | **Defer SDKs to 1.1; keep server aggregates.** | See risk 15. Removes an ask from PRD-REQ-001, two subprocessors, two privacy-label lines, the deletion contradiction X-02, and ~2 weeks. |
| **Plus, trials, ARL notice engine, per-account entitlements, Read together counter, additional-child gate** | C-REQ-020 to 029, K-04, K-28, PRD-REQ-015, -020 | **Defer to 1.1** (founder decision Q1). | 4 to 5 engineer-weeks (TDD 08) plus App Store Connect paid-apps agreement. At 1k families the revenue is about $100 a month (E: 4% paying, $29.99 a year, 15% commission). Retention evidence is worth more than that. "Lapse never closes an existing book" already grandfathers free extra books. |
| **Web contribution page and anonymous auth** | B F6, K-08, B-REQ-008 | **Defer to 1.1 with contributors.** | Risk 10. |
| **Contributor role, approvals, visibility model F9, Family can read** | B F5 to F9 | **Defer to 1.1** (v1: co-parent only, both parents see letters marked "in the book"). | Removes the C2 defect class and the approval UI; the research case for grandparents (UR R14) is real, so this is the first 1.1 feature. |
| **Safety tier classifier** | `packages/core/src/safety.ts`, LEGAL-REQ-015 | **Defer unless clinician signs off; static resources row instead.** | Risk 12. |
| **LLM edit pass, server ASR fallback, AI gateway, AI-processing consent** | ADR 0002, 0003, 0012; LEGAL-REQ-004, -005, -020 | **Cut from v1** (already off by default; remove the gateway from the v1 build so no subprocessor, consent or kill switch is needed). | Every AI legal duty disappears when nothing leaves the phone for AI. |
| **Hinglish fine-tunes** | ADR 0012 decision 3 | **Defer**; decide from the experiment. | No hosted offer; on-device decode several times slower (E in ADR 0012). |
| **Story intro with 4 stories, remote variant switch, brand moment** | A-REQ-003 to 011 | **Simplify: one static welcome screen, then the 18+ gate.** | 11 requirements and an animation budget for something users skip. |
| **Data map: three inventories** | data-policy section 4, SQL comments, planned `data-map.yaml` (TDD 05 X-05) | **Simplify: SQL comments for the database (already enforced), one `data-map.yaml` for everything else, generated tables in docs.** | One source; the v1 cut has few non-database stores. |
| **Legal holds, purge ledger, deletion state machine** | governance migration | **Keep** (already written and tested). | Sunk cost, and Apple requires deletion. Only the worker for one bucket is needed in v1. |
| **Faithful-edit engine and verifier** | `packages/core` | **Keep. Do not extend in v1.** | It is the moat. Hardening (TDD 03 X-3) is required only before any model provider. |
| **Load test at 2x the 100k targets** | PRD 7.8 | **Defer**; do the 2x 1k test only. | 100k families is a year-one hope, not a launch gate. |
| **WCAG 2.2 AA on app, web, emails, AX5 everywhere** | LEGAL-REQ-051 | **Keep for the app** (TDD 09); web and email surfaces shrink with the cut. | Accessibility is cheap at build time, expensive later. |

---

## 3. Under-engineering: must add

| Gap | Evidence | Add |
|---|---|---|
| **Two environments** | One Supabase project serves as dev and live (APPLY.md, BL-015). | `scribe-staging` and `scribe-prod`; migrations by `supabase db push` from CI on a release tag; seed staging only with the "Asha" fixtures. |
| **CI, branch protection, agent fences** | No `.github/` (TDD 07 Q-02); 4-hourly unattended runs (ADR 0011). | BL-004 and BL-005 in week 1; path-based rules: `supabase/**`, auth and capture code need a human "approve" label and a second agent review run. |
| **Release engineering** | No `eas.json`, no `expo-updates`, no bundle id, no build profiles. | EAS build profiles (development, preview, production); `expo-updates` with runtime-version policy so JS-only fixes ship without a store review (App Review allows interpreted-code updates that do not change the app's purpose, guideline 3.3.x, **Unverified** exact clause); version and build-number scheme tied to `ios-v*` tags. |
| **Crash and hang visibility without an SDK** | Sentry is opt-in (LEGAL-REQ-003) and deferred here. | Xcode Organizer crash and hang reports, MetricKit-derived App Store Connect metrics, TestFlight feedback. Zero privacy-label impact. |
| **Model delivery** | Only a filename lookup exists. | Download manager: Wi-Fi default, resumable, SHA-256 verified, Application Support, excluded from backup, versioned URL on a CDN we control (Supabase Storage public bucket or object store), storage-pressure check, delete-and-redownload in Settings. |
| **Local schema migrations on the device** | `store.ts` migrates one legacy key ad hoc. | `PRAGMA user_version` migrations with a test that opens every historical schema fixture. A bad device migration is unrecoverable data loss. |
| **Durability drill** | No restore test anywhere. | QA script: iCloud device backup then restore to a second phone; export ZIP then re-read; sign-in on new phone re-downloads text. Run before every release candidate. |
| **Remote config and kill switch (minimal)** | BL-022 `needs-decision`. | One `app_config` table (public read, service-role write, audit trigger) fetched with a cache and a timeout that never blocks launch. Keys: `sync_enabled`, `invites_enabled`, `min_supported_build`. Decide: Supabase table, not PostHog flags. |
| **Server observability** | Nothing. | Supabase log drains or daily log review, an external uptime check on the RPC endpoint, an alert on 5xx rate, a weekly "deletion steps failed" query emailed to the founder. |
| **Support tooling** | Not designed beyond policy text. | Support email on the domain with saved replies (section 5), a content-free "Copy diagnostics" button (app version, build, model, sync cursor age, queued write count), a runbook folder `docs/ops/`. |
| **Abuse and rate limits** | B-NFR-004 named, not built. | Per-user limits in the RPCs that create invites and children (the governance migration's audit table can count). |
| **Founder-readable release checklist** | PRD section 6 is ~80 items, mostly automated-in-theory. | `docs/ops/RELEASE.md`: 20 lines the founder runs by hand per release, each linking the automated evidence. |

---

## 4. Contradictions between docs and code

Not repeated from TDD 01 to 09 unless the cross-cutting consequence matters.

| # | Docs say | Code or another doc says | Consequence | Fix |
|---|---|---|---|---|
| 1 | ADR 0004: op-sqlite (required by PowerSync) | `apps/mobile/package.json`: `expo-sqlite`; `store.ts` "Runs in Expo Go (expo-sqlite)"; BL-032 `needs-decision` | Every screen is built on the engine the ADR rejects | Amend ADR 0004 per section 2 |
| 2 | ADR 0001: model in Application Support, excluded from backup | `transcribe-whisper.ts`: `new File(Paths.document, 'models', name)` | 574 MB in every user's iCloud backup; review risk | Move path; set exclusion attribute |
| 3 | CLAUDE.md: public name only from `packages/brand` | `app.json` name/slug `lumira-letters`, scheme `lumiraletters`, Expo splash colour `#208AEF` | Wrong name on the home screen and in links | BL-031, `app.config.ts` |
| 4 | ARCHITECTURE section 4 step 4: "`safety_events` row (tier + rule id, no text)"; diagram includes Lulu and print payments | PRD K-06 (dropped), K-32 (digital only); migration drops the table | Agents reading ARCH first rebuild what was removed | Mark ARCH superseded where PRD 1.2 decided; ARCH is "Proposed, 1 Oct" |
| 5 | ADR 0008: keep events "~50/family/month to stay near the free tier" | PRD 7.7 and 7.8: ~150 per user per month, 13M a month accepted | Cost and scope disagree | Supersede ADR 0008 with the decision in section 8 Q4 |
| 6 | LEGAL-REQ-033: invite hashes kept "30 days after expiry or acceptance" | `purge_due`: `expires_at < p_now - interval '90 days'`; PRD K-18 decided 90 | The binding legal file still says 30 | Legal owner edits LEGAL-REQ-033 (K-18 owner action still open) |
| 7 | PRD-REQ-015: `create_child` enforces the Plus rule; B-REQ-005 expecting mode | `create_child(p_name text, p_date_of_birth date)`: no due date, no entitlement check | Server cannot create an expecting book or gate a second child | New signature in the v1 migration; Plus check in 1.1 |
| 8 | PRD-REQ-020: free Read together count from remote config, audit-logged | `read-together.ts` constant `FREE_READ_TOGETHER_SESSIONS = 3`; count in a local setting | Reinstall resets the count; no config | Moot if Plus is deferred; otherwise server-side count |
| 9 | C section 4.1: "family letters" free; K-33: family hear recordings only once backed up; backup is Plus | | A Free co-parent can never hear the other parent's voice; the "free family" promise is half true | v1: say so plainly (voice plays on the recording phone and in export); 1.1 decides whether member playback is free |
| 10 | `settings.recordings.onPhoneBody`: "Without backup, recordings live only on this phone" | Audio stored in Documents, which iOS device backup includes by default; C OQ5 open | Inaccurate privacy claim (CR-010 deception risk) | Section 1 risk 8 |
| 11 | PRD K-13 and `store.promotionalTextBeta`: beta in store copy | App Review 2.2 (betas belong in TestFlight) | Likely rejection or forced copy change at review | TestFlight beta, no store beta label |
| 12 | `transcribe-whisper.ts` returns `words` built from `res.segments` | ADR 0009 needs word timings; whisper.rn needs `maxLen: 1` for per-token segments (TDD 03) | Read together would highlight whole segments as one "word" | TDD 03 fix |
| 13 | README "Status (October 1)": engine 38 tests, iOS app "Not started" | CLAUDE.md: 95 engine tests; 19 screens exist | Scheduled agents and the founder read a stale status | Regenerate status from `npm test` output |
| 14 | ARCHITECTURE component diagram: "Auth - magic link" | PRD A: Apple, Google, email link plus code | Minor; ARCH stale | As row 4 |
| 15 | LEGAL-REQ-030 web deletion page is P0 | Its source is CR-091 (Google Play); v1 is iOS US only | Builds a web flow Apple does not require | [Q] counsel: re-tier to "before Android" |
| 16 | `data_governance.test.mjs` asserts contributors read the whole book | B F9, B-REQ-011 | A test protecting a defect (TDD 07 Q-01) | Replace test in the fix migration |

---

## 5. Vendor lock-in and cost

### 5.1 Lock-in

| Vendor | Lock-in | Exit cost | Note |
|---|---|---|---|
| Supabase (Postgres, Auth, Storage, Edge Functions) | Low for data (plain Postgres, RLS in SQL); medium for Auth (Apple and Google identities re-linkable; email users re-verify) | Days to weeks | The governance SQL is portable. Keep Edge Functions thin. |
| PowerSync (if kept) | Medium: Sync Streams definitions, client SDK, op-sqlite | Weeks | Another reason to defer |
| Apple iCloud Keychain (ADR 0006) | **High for Android**: synchronizable keys do not exist there | Redesign | Deferred by section 2 |
| RevenueCat (1.1) | Medium: entitlement history exportable; webhooks are ours | Weeks | Keep `appUserID` random and mapped (K-28) |
| whisper.rn / whisper.cpp | None (MIT, local) | n/a | Model swap is config |
| Expo / EAS | Low to medium: builds and OTA updates; bare workflow is an exit | Days | |
| PostHog, Sentry (1.1) | Low behind `packages/analytics` | Days | |
| Email provider | Low | Hours | Needs SPF, DKIM, DMARC on the domain |

### 5.2 Monthly run-rate, v1 cut versus full plan

Assumptions from ARCHITECTURE section 7 and PRD 7.8: 2.2 MAU per family, 40 audio minutes per family per month. Supabase Pro $25 including 100k MAU, then $0.00325 per MAU (**Unverified**, ARCH [S13]). All totals are **E**.

| Line | 1k families | 10k families | 100k families |
|---|---|---|---|
| Supabase Pro + MAU overage | $25 | $25 | $25 + $390 |
| Supabase compute add-on | $0 to $10 | $50 to $110 (Unverified) | $100 to $400 (Unverified) |
| Text-only DB storage (v1 cut) | $0 | $0 | ~$5 |
| Audio backup storage (full plan, 50% opt-in) | ~$0.30 after 12 months | ~$25 after 12 months | ~$240, growing ~$20 a month (ARCH) |
| PowerSync (full plan only) | $0 to $49 | ~$80 | ~$130 (ARCH) to more at 11k concurrent |
| PostHog (full plan only) | $0 (~130k events) | ~$0 to $20 (~1.3M events) | ~13M events: **Unverified**, plausibly several hundred dollars |
| Sentry (full plan only) | $0 to $26 | $26 | $26+ |
| Server ASR and LLM (cut from v1) | ~$8 | ~$80 | ~$420 to $790 (ARCH) |
| Email (transactional) | ~$0 to $20 | ~$20 to $35 | ~$100 (Unverified) |
| EAS builds and updates | $0 to $99 (Unverified) | same | same |
| Vercel (only once `apps/web` exists) | $0 to $20 | $20 | $20+ |
| **v1 cut total** | **~$25 to $150** | **~$100 to $300** | **~$650 to $1,000** |
| **Full plan total** | ~$85 to $250 | ~$350 to $600 | ~$2.5k to $3.5k |

Costs outside the bill that matter more: Apple Developer Program fee; counsel review of about 10 documents ([A] low five figures, the largest launch cost); cyber-liability insurance ([A], worth pricing because the product holds child and health-adjacent data); Apple 15% and RevenueCat 1% above $2.5k MTR once Plus exists. Infrastructure is not what sinks this product; founder hours are.

---

## 6. Minimal launch path

### 6.1 The smallest v1 that honours the constitution and the P0 legal set

**In v1.0 (App Store, US, iOS):**
1. 18+ entry gate before anything (PRD-REQ-019, LEGAL-REQ-002), fixed per TDD 01 C-03.
2. First run: child name plus birthday or due date, signature, language hint; any number of children, all free.
3. Capture: speak or type; crash-safe recording (risk 2); on-device Whisper (model decided by the device spike); audio-first queue when the model is not ready; rules-only clean through `verifyEdits`; Review with every edit visible and undoable; one-time "can make mistakes" card.
4. Book by month of age; playback; Read together on local audio only if the spike shows usable word timings (else 1.1).
5. Export: ZIP (entries JSON with raw, edits, final; M4A; PDF) offline (LEGAL-REQ-034).
6. Account after the first letter: Sign in with Apple and email link plus code (Google in 1.1; Apple's sign-in rule is about offering Sign in with Apple alongside third-party logins, so Apple plus email is compliant, **verify 4.8 text**). Terms acceptance in `policy_acceptances`; sensitive-data consent enforced **server-side** (TDD 05 X-03).
7. Text sync across the user's devices and with one co-parent (invite by parents only, role `parent`). Letters stay author-owned; `raw_transcript` author-only (already in the governance migration).
8. Local reminders (a few evenings a week, quiet window), month-age notes; no server push.
9. Settings: privacy rows, legal list, delete my letters, delete book (sole parent), **delete account in-app** with 30-day undo and the purge worker for Postgres plus Auth plus Apple token revocation (LEGAL-REQ-029; Storage has nothing to purge in v1).
10. Store: privacy labels from a small `data-map.yaml` (Contact info and User content, linked, not tracking; no analytics SDK lines), privacy manifest, US only, not Kids Category, no beta label.
11. Ops: WISP short form (LEGAL-REQ-028), security event logging from Supabase, kill switches `sync_enabled` and `invites_enabled` (LEGAL-REQ-040 reduced to what exists), affected-user enumeration script (LEGAL-REQ-039).

**Out of v1.0 (with the LEGAL-REQ each removes from the gate, counsel to confirm):** Plus and payments (046 to 050), PostHog and Sentry (003 opt-in sheet, 017), AI gateway and cloud transcription (004, 005, 020), audio and photo upload and encryption keys (022(a), 023, parts of 031), web contribution page and contributors (010, 035), safety classifier (015 trivially met), Google sign-in, printed books (already out), web deletion page (030, if counsel agrees it is Play-driven).

What still holds: the constitution in full; durability (local first, crash-safe, export, iCloud device backup, text sync); every consent that applies to what ships; deletion; accurate claims.

### 6.2 Milestones to App Store submission

Assumptions [A]: AI agents write most code in single-concern PRs; the founder gives about 15 to 20 hours a week (device checks, decisions, vendor setup, merges); counsel turns documents around in 2 to 3 weeks; week 1 starts Monday 5 Oct 2026.

| Milestone | Weeks | Depends on | Exit criteria |
|---|---|---|---|
| **M0 Founder long poles** (parallel, start now) | 1 to 4 | none | Name and domain registered; LLC formed; D-U-N-S and Apple Developer organisation enrolled; counsel engaged with the v1 cut; clinician asked for a yes or no by week 7; support mailbox on the domain |
| **M1 Guardrails and the security migration** | 1 to 2 | none | CI and branch protection on; staging and production projects; one migration fixing invite escalation, `book_entries`, policy-acceptance window (X-01), server consent check (X-03), `create_child` due date; applied to staging by CI; unattended runs re-enabled only for `packages/*` |
| **M2 Capture that cannot lose a word** | 2 to 4 | M1 (CI) | Draft-before-record, background save, orphan sweep, kill test green; EAS dev build on a real SE 3; identity fixed (`app.config.ts`) |
| **M3 Transcription in a release build** | 2 to 5 | M2 dev build | Decoder module, model download manager, audio-first queue, device spike numbers recorded in ADR 0001; 14-recording experiment decides model and script |
| **M4 Book, export, reminders** | 4 to 6 | M2 | Month chapters, PDF and ZIP offline export with schema test, local reminders with quiet window |
| **M5 Account, sync, co-parent** | 5 to 8 | M0 domain (SMTP, Services ID), M1 | Apple and email sign-in; re-own local data in one transaction; outbox and cursor sync with idempotency tests; invite flow; cross-device test on two phones |
| **M6 Deletion and disclosures** | 7 to 9 | M5 | In-app deletion with 30-day undo; purge worker; cross-system verification script; `data-map.yaml`, privacy labels and manifest generated; WISP; kill switches; log canary |
| **M7 TestFlight external beta** | 9 to 10 | M6, Beta App Review | 15 to 30 founding families for two weeks; zero lost letters; crash-free sessions from Organizer; fix list closed |
| **M8 Store submission** | 11 | M7, counsel sign-off on Terms, Privacy, CHD notice and claims | Screenshots, listing, review notes with a demo account, territories = US; submit |
| Buffer | 12 to 13 | | One rejection cycle; Apple's late-December slowdown makes a submission after about 14 Dec risky ([A], check Apple's holiday schedule) |

Critical path: M1, M2, M3, M5, M6, M7, M8. The schedule is set by M3 (native decoder and device performance) and M0 (company, domain, counsel); everything else is parallel agent work.

### 6.3 v1.1 (6 to 8 weeks after launch), in this order
1. Contributors in the app plus the web contribution page (with anonymous-auth predicates, TDD 04 S-2).
2. Simple encrypted audio backup and member playback (one server-wrapped key scheme).
3. Plus (annual and monthly), entitlements, notice engine; additional-child gate for new books only.
4. Opt-in analytics if a concrete question needs it.
5. Google sign-in, Read together if deferred, safety classifier if cleared.

---

## 7. Operational burden for a solo founder, and how to automate it

| Duty | Expected load at 1k families ([A]) | Automate | Founder does |
|---|---|---|---|
| **Support email** | 5 to 15 a week: transcription wrong in Hindi, "where is my recording on my new phone", sign-in link not arriving, how to invite | Saved replies in `docs/ops/support/`; in-app Help articles from `packages/content`; "Copy diagnostics" (content-free); a Claude-drafted reply the founder approves, never auto-sent, never with letter text pasted into a model without the user's ask (support mailbox is L4, DATA_CLASSIFICATION 4.8) | 20 minutes a day, batched |
| **Deletion requests** | A few a month | In-app flow end to end; purge worker on cron; failure alert emailed; monthly verification script | Read the monthly report |
| **Rights requests by email** | Rare | Template plus magic-link verification (LEGAL-REQ-036 is P1; a manual log in a spreadsheet is enough at v1) | Handle within 10 days |
| **Incidents** | Rare but severe | Kill switches in `app_config`; affected-user script; notification templates; uptime alert to phone | Runbook drill once before launch |
| **App Store reviews and ratings** | Weekly | App Store Connect review notifications to email; reply templates in VOICE.md tone | Reply weekly |
| **App Review rejections** | 1 to 2 per year | Pre-submission checklist in `docs/ops/RELEASE.md`; review notes template with demo account | Respond in Resolution Center |
| **Releases** | Every 2 to 4 weeks | EAS build and submit from tag; OTA for JS fixes | Tag, smoke test on two phones |
| **Dependency and vendor changes** | Monthly | Dependabot or Renovate PRs into CI; agents never add SDKs (BACKLOG rule 8) | Merge green ones |
| **Policy changes** | Quarterly at most | `policy_versions` rows, POLICY_VERSIONING flow (after X-01 fix) | Approve text with counsel |
| **Agent PR review** | Today up to 6 a day | Limit unattended runs to 2 a day and to tested packages; require CI; an independent review agent on every PR touching `supabase/` or auth | Merge only green PRs with a review summary; never merge a migration without a staging apply |

---

## 8. Decisions the founder should make now

1. **Monetisation at launch.** Ship 1.0 free and add Plus in 1.1 (recommended), or ship Plus at launch (adds ~5 weeks and the paid-apps agreement as a dependency). If at launch: annual only, no trial?
2. **Where the beta lives.** TestFlight public beta, then a 1.0 store release without a beta label (recommended), or keep "beta" in the store description and accept a likely 2.2 rejection.
3. **Family scope for v1.** Co-parent only, with contributors and the web page as the first 1.1 feature (recommended), or contributors at launch (adds approvals, visibility model, web app, anonymous auth: ~5 weeks).
4. **Analytics at launch.** Server aggregates plus Apple's own crash and usage data (recommended), or the 2 Oct "full product analytics" decision as written.
5. **Sync engine.** Outbox and cursor pull on expo-sqlite for v1 (recommended; amends ADR 0004), or PowerSync now with an engine swap before any non-founder data.
6. **Audio durability for Free.** Rely on iCloud device backup plus export and fix the copy (recommended), or exclude audio from device backup and keep the "only on this phone" claim (then a lost phone loses the voice).
7. **Cloud audio backup design.** Defer, then one server-wrapped key scheme in 1.1 (recommended); Vault mode only on demand.
8. **Safety classifier.** Ship only with a clinician's written sign-off by week 7; otherwise a static resources row (recommended).
9. **Company name and domain.** Decide this week; it blocks M5.
10. **Device floor and model.** Minimum iPhone and iOS version; turbo vs small as default after the spike; Devanagari vs Roman for Hindi.
11. **Agent workflow.** Pause unattended runs until CI and branch protection exist; adopt the path-based review rule for `supabase/` and auth.
12. **Counsel budget and scope.** Which documents counsel signs before TestFlight external (recommended: Terms, Privacy Policy, CHD notice, in-app disclosures for the v1 cut) and whether the deferred LEGAL-REQ re-tiering in 6.1 is acceptable.

---

## 9. Requirements touched by this critique

Recommendations that defer a P0 conflict with the requirement's current priority until the PRD and LEGAL files are re-tiered: PRD-REQ-016 to 018 (analytics), PRD-REQ-015 and -020 and C-REQ-020 to 029 (Plus), B-REQ-008 to 011 (contributors, web page), A-REQ-003 to 011 (story intro), A-REQ-017 (Google), LEGAL-REQ-030 (web deletion page), ADR 0004 and 0006 decisions, PRD K-13 (beta label). None of the recommendations weakens the constitution, LEGAL-REQ-002 (18+), -006 (sensitive-data consent), -014 (no content in logs), -016 (no tracking), -024 (tested access control), -029 (deletion) or -034 (export).
