# Roadmap to App Store submission

Owner: lead PM (architect-integrator). Version 1.1, 3 Oct 2026 (1.0 earlier the same day). Plan of record for v1.0; task detail lives in `docs/BACKLOG.md` (BL-### ids), decisions in `docs/DECISIONS.md` (D-###), requirements in `docs/prd/PRD.md` 1.3.

Adapted from TDD 10 section 6.2 (11 weeks for a co-parent-only, free v1.0) with the founder's 3 Oct decisions: **Plus at launch** through the App Store (D-001), **family contributors in the app at launch** (D-002), full opt-in analytics (D-003), individual publisher (D-004). Those added about four weeks of parallel work.

**Changed by the founder brief of 3 Oct** (`docs/agents/BRIEF-2026-10-03.md`, all Decided; the backlog follows it in PRs #45 and #47): family at v1.0 is the **co-parent only** (decision 5, replaces D-002 for v1.0); **no audio upload**, so shared voice, word highlighting and the safety classifier move to v1.1 (decision 9); Plus is **StoreKit 2 on the device, with no purchase server** (decision 3); **Google sign-in and passkeys** join v1.0 (decision 4); letters can be spoken in **seven languages**, with each language pack downloaded only when picked and an app download **under 40 MB** (decisions 6 and 15); a **cleaner listening copy** with the original never altered (decision 8); **server-driven content** inside native screens (decision 16, recommended). **The net effect on the date has not been re-estimated.** The brief removes M7, the M8 server work and most of M6, and adds sign-in, language and content work to M3, M4 and M5. The target below stands until the week 6 checkpoint (section 4), where it is checked against what has merged.

**Target App Store submission: Monday 11 January 2027 (week 15).** Public release on approval, target the week of 18 January 2027, with weeks 16 and 17 as buffer for one rejection cycle.

How confident: moderate. The date holds if (1) the on-device transcription spike passes on iPhone SE 3 by 30 Oct, (2) the founder answers D-023 (sync engine) by 16 Oct (D-032 is answered for v1.0 by brief decision 9), the reminder and Plus questions (BL-223, BL-154) before the counsel package in week 5, and the model and pack host (D-046, BL-125) before the model manager (BL-143) starts, (3) four to five agent work streams run in parallel and the founder can review and merge 10 to 15 small PRs a week with an independent review agent doing the first pass, and (4) counsel returns the document package in 3 weeks. The most likely slip is 2 to 4 weeks (early February), coming from transcription (M3), which now also carries six more letter languages, each with its own model choice, text-rule pack and native-speaker review. Section 4 lists the cuts that protect the date.

**What has merged (checked 3 Oct with `git log origin/develop` and the GitHub pulls API):** week 1 starts 5 Oct. `develop` is at 3688796, the brief commit of 3 Oct (08:11 UTC), committed directly. No pull request has been merged into `develop` yet, so no milestone has started or slipped. This section is updated with merge dates as work lands.

Assumptions [A]: AI agents write most code in single-concern PRs (ADR 0011); the founder gives 15 to 20 hours a week; Apple's year-end break closes submissions for part of late December (exact 2026 dates U; check Apple's holiday notice), so the external beta build goes to Beta App Review by Friday 11 December; Beta App Review takes 1 to 3 days (U).

---

## 1. Calendar

| Week | Dates | Week | Dates |
|---|---|---|---|
| 1 | 5 to 9 Oct | 9 | 30 Nov to 4 Dec |
| 2 | 12 to 16 Oct | 10 | 7 to 11 Dec (feature freeze, external beta build to review) |
| 3 | 19 to 23 Oct | 11 | 14 to 18 Dec (external beta C1 starts) |
| 4 | 26 to 30 Oct | 12 | 21 to 25 Dec (holiday; beta runs; Apple submissions likely closed part of the week) |
| 5 | 2 to 6 Nov | 13 | 28 Dec to 1 Jan (holiday; beta runs) |
| 6 | 9 to 13 Nov (go or cut checkpoint) | 14 | 4 to 8 Jan (beta exit, store assets, counsel sign-off) |
| 7 | 16 to 20 Nov | 15 | 11 to 15 Jan (**submit Mon 11 Jan**) |
| 8 | 23 to 27 Nov (US Thanksgiving 26 Nov) | 16 to 17 | 18 to 29 Jan (buffer; release on approval) |

---

## 2. Milestones (dependency order)

| Milestone | Weeks | Depends on | Exit criteria | Backlog |
|---|---|---|---|---|
| **M0 Founder long poles** | 1 to 3, then ongoing | none | Domain registered and support mailbox live (wk 1); Apple Developer individual enrollment (wk 1); Paid Applications Agreement, tax and banking accepted (wk 2); bundle ids and App Store Connect app record, subscription group, two products with intro offers, grace period, Family Sharing on after confirming it (BL-103), US-only territory (wk 3); staging and production Supabase projects (wk 2); email on the domain with SPF, DKIM, DMARC and Google client ids (wk 2, BL-053); counsel engaged (wk 1); clinician asked (wk 1); trademark questions to counsel (BL-123, BL-124); model and pack host chosen (BL-125, before BL-143) | BL-100 to BL-109, BL-123 to BL-125, BL-053, BL-005, BL-015 |
| **M1 Guardrails and the security migration pack** | 1 to 2 | none | CI and branch protection on; agent fence for `supabase/` and auth (D-041); one fix pack applied to staging by CI: parent-only invites with explicit role, client ids for children, server consent gate, policy-version fix, pepper fail-closed; test retitles; content-rule additions; `child-input` flag in core; verifier hardening | BL-001 to BL-004, BL-110 to BL-122, BL-016 |
| **M2 Capture that cannot lose a word** | 2 to 4 | M1 (CI) | Draft row before the first audio byte; stop-and-save on background; atomic save with SHA-256 and fsync; orphan sweep; 18+ root gate (24 h stop, boolean only); `app.config.ts` from brand; EAS dev and preview builds on a real SE 3; kill-during-save 500x passes; a listening copy made after save with the original never altered (brief decision 8) | BL-130 to BL-137, BL-031, BL-037, BL-040, BL-111 |
| **M3 Transcription in a release build** | 2 to 6 | M2 dev build; host (BL-125) | Decoder module; whisper engine v2 (VAD, chunks, word timings); model download manager on a zero-egress host; transcription queue and voice-only save; device numbers recorded in ADR 0001; 14-recording experiment decides model tier and Hindi script (D-031, by 30 Oct). Seven letter languages (brief decisions 6 and 15): language pack format and interpreter, text-rule packs for six languages reviewed by native speakers, signed manifest, packs downloaded only when picked and deletable in Settings | BL-043, BL-140 to BL-149, BL-161 to BL-165 |
| **M4 Book, export, reminders, settings** | 4 to 8 | M2 | Month chapters and Read together on local audio, without word highlight (v1.1, brief decision 9); listening copy in playback with the original one tap away; offline ZIP and PDF export with schema test, letters in their own script and direction; local reminders (a few evenings a week, quiet window, lock-screen names off by default); remote config table and client; server prompts and notes from the last good copy (brief decision 16); Settings IA with privacy and legal rows; welcome screen | BL-022, BL-023, BL-034, BL-035, BL-150 to BL-160, BL-166 to BL-169 |
| **M5 Account, sync, co-parent** | 4 to 8 | M0 domain (SMTP, Services ID, universal links); M1; **D-023 answer by 16 Oct** | Sign in with Apple, Google and email link plus code, and a passkey added after sign-in (brief decision 4); Terms acceptance and sensitive-data consent recorded server-side; re-own local data in one transaction; `book_access` migration; sync client per D-023 with idempotency, rejected-write and restore-epoch tests; co-parent invite; two-phone test | BL-050 to BL-054, BL-170 to BL-180, BL-024 |
| **M6 Co-parent invites and the shared book** (contributors moved to v1.1) | 7 to 10 (not re-planned after the cut) | M5 | Co-parent invite redemption with rate limits; leave and remove with letter retention; visibility matrix and cross-child leak tests green. Contributor first run, approvals, "Family can read" and family-letter push are v1.1 (BL-316, brief decision 5) | BL-190, BL-193, BL-195 |
| **M7 Shared voice**: moved to v1.1 | none at v1.0 | n/a | Brief decision 9: no audio upload at v1.0. Letters reach the co-parent as text and each recording plays on the phone that made it (D-032 alternative a). The work is kept as BL-315; the bucket registry (BL-232) stays in M9 | BL-200 to BL-206 deferred |
| **M8 Plus through the App Store** | 3 to 12 | M0 (Paid Apps Agreement, products), M5 (accounts) | StoreKit 2 spike on SDK 57 (wk 3) and the design note for Plus on the device (BL-226, wk 3); plan engine as pure, table-tested code (wk 4 to 5); purchase with Apple's subscription screens, restore and manage sheets, on-device entitlement check, Family Sharing, Plus sheet, Settings > Plan (wk 8 to 10); sandbox checklist S-1 to S-10 signed (wk 11 to 12). No server of ours sees purchases (brief decision 3): the billing migration, the App Store notifications endpoint and the reconcile job are gone. Notice windows, purchase consent records and the notice scheduler wait for the founder's answer on reminders (BL-223, before week 5) | BL-036, BL-210, BL-212, BL-215 to BL-226 (BL-211, BL-213, BL-214 superseded) |
| **M9 Privacy, deletion, disclosures, ops** | 7 to 12 | M5 | In-app account deletion with 30-day undo; purge worker, receipts and cross-system verification script; `analytics-forget`; ops audit log and runbook wrapper; data map canonical (founder PR #37 adds the map and its checker); integrity cases mapped to tests; remote values cannot widen collection; licence register; privacy labels and manifest generated with evidence; log canary; kill switches; WISP; static `/delete-account` page; value-free validation trigger | BL-016, BL-227 to BL-249 |
| **M10 Opt-in analytics** | 7 to 10 | BL-020, BL-021, BL-023; counsel approves `analyticsConsent.*` | PostHog and Sentry initialise only after consent; nothing queued before; withdrawal in Settings; network-capture test proves zero requests before consent | BL-020, BL-021, BL-250 to BL-252 |
| **M11 Accessibility and design system** | 3 to 11 (parallel) | BL-030 spike | Tokens (destructive, type scale, control contrast), standard components, letter text uncapped, AX5 stacking on every P0 screen, persistent toast, locale dates and plurals, VoiceOver script on SE 3; letter text in all seven scripts, Arabic right to left, fonts within the size budget | BL-030, BL-255 to BL-274 |
| **M12 Beta and release engineering** | 6 to 14 | M2 for C0; M4 to M10 for C1 | C0 internal TestFlight from week 6; Maestro E2E flows in CI; external beta C1 build to Beta App Review by Fri 11 Dec; C1 (15 to 25 families) 14 Dec to 8 Jan with exit criteria (zero open S0 or S1, crash-free sessions 99.8% or more, no fidelity complaint traced to an engine edit, co-parent flows done without help; grandparents join in v1.1); download size under 40 MB on every release build (BL-285); founder release checklist | BL-044, BL-135, BL-275 to BL-289 |
| **M13 Store submission** | 14 to 15 | M12 exit; counsel sign-off on Terms, Privacy Policy, CHD policy, Subscription terms and in-app disclosures | Listing with no beta line (brief decision 10 settles D-030), screenshots, privacy labels in App Store Connect with evidence, review notes with a demo account, the 5.1.1(ix) positioning and the paragraphs on language packs and server content (BL-281), territories = United States, products attached to the version; **submit Mon 11 Jan** | BL-286, BL-104, BL-281 |

**Critical path:** M0 (domain, Paid Apps Agreement) then M5 (accounts and sync, D-023) then M6 (co-parent invites and the visibility tests) then the C1 build on 11 Dec then C1 exit then submission. M7 has left v1.0 (brief decision 9). Two parallel near-critical chains: M3 (transcription on device, now for seven letter languages; nothing ships if spoken letters cannot be saved) and M8 (Plus on the device: store setup in week 3, the reminder answer BL-223 before week 5, purchase flows by week 10, sandbox checklist by week 12). Everything else is parallel agent work.

```
wk:   1  2  3  4  5  6  7  8  9  10 11 12 13 14 15
M0   [==domain, Apple, Paid Apps, products==]
M1   [=====]
M2      [========]
M3      [==============]                       (spike decides by wk 4; six more languages)
M4            [==============]
M5            [==============]                 (needs D-023 by 16 Oct)
M6                     [===========]           (co-parent only; not re-planned)
M7   moved to v1.1 (brief decision 9)
M8         [===================================] (no server; BL-223 before wk 5)
M9                     [==================]
M10                    [===========]
M11        [==================================]
M12                 C0[========================C1 run=========]
M13                                              [==] submit 11 Jan
```

---

## 3. Founder tasks by week

The founder's hours are the scarcest resource. Each week lists what only the founder can do; everything else is agent work the founder merges.

| Week | Founder tasks | Decisions due |
|---|---|---|
| 1 (5 Oct) | The domain is registered (brief decision 13: earlyletters.com, with earlyletters.app redirecting; hello@ is live); finish the support and privacy mailboxes and the brand values (BL-100). Enroll in the Apple Developer Program as an individual (BL-101). Create staging and production Supabase projects; turn on 2FA on every console (BL-107, BL-106). Turn on branch protection; pause unattended agent runs for `supabase/` and auth (BL-005, D-041). Send counsel the v1.0 scope and document list (BL-104). Ask the perinatal clinician for a yes or no by 20 Nov (BL-105). | D-031 experiment: record the 14 recordings |
| 2 (12 Oct) | Accept the Paid Applications Agreement; tax and banking forms (BL-102). DNS records for the email provider (Resend, brief decision 13) and Google client ids for Sign in with Google (BL-053). Apply the M1 migration pack to staging through CI (BL-015). Run the 14-recording experiment (BL-043). Create the EAS account and Apple credentials (BL-108). | **D-023 sync engine by Fri 16 Oct** |
| 3 (19 Oct) | App Store Connect: bundle id, app record, subscription group, two products, introductory offers, grace period, Family Sharing on after confirming it (Apple says it cannot be turned off; BL-103), US only. Sign in with Apple Services ID and key with a rotation date (BL-053). Install the first dev build on an iPhone SE 3. | D-032 is answered for v1.0 by brief decision 9 |
| 4 (26 Oct) | Device spike for on-device transcription on SE 3 and a current iPhone, with the listening-copy and per-language arms (BL-043). Decide model tier and Hindi script. | **D-031 Hindi script by Fri 30 Oct** (brief decision 6 names Devanagari; confirm whether that closes D-031) |
| 5 (2 Nov) | Counsel receives the full v1.0 document package (Terms, Privacy Policy, CHD policy, Subscription terms, in-app disclosures, claims registry), with the trademark questions (BL-124), the licence register (BL-230) and the App Review questions on packs and server content (BL-281). Vendor evidence: DPAs for Supabase, PostHog, Sentry, email provider; encryption at rest in writing (BL-106). | **BL-223 reminders and BL-154 Plus contents, before the package goes** |
| 6 (9 Nov) | **Go or cut checkpoint** (section 4); re-check the date against what has merged. Start C0 internal TestFlight on the founding family's phones. Begin recruiting C1 families, including speakers of the seven letter languages (BL-109, BL-147). BL-213 is superseded (brief decision 3), so the ADR 0013 override window no longer applies. | Checkpoint call |
| 7 (16 Nov) | Review the co-parent flows on two phones. Approve `analyticsConsent.*` copy with counsel. | **D-034 clinician answer by Fri 20 Nov** |
| 8 (23 Nov) | Thanksgiving week: light. Sandbox purchase on device (first pass). | **D-004 hedge by Fri 27 Nov** (start an entity in parallel or not) |
| 9 (30 Nov) | Restore drill (iCloud device backup, export, new phone) (BL-284). Review deletion flow end to end in staging. | **D-045 beta cohorts by Fri 4 Dec** |
| 10 (7 Dec) | Feature freeze. Sign the sandbox checklist S-1 to S-10 (BL-222). Send the C1 build to Beta App Review by **Fri 11 Dec**. C1 welcome note and Report a problem path ready (BL-280). | |
| 11 (14 Dec) | C1 starts. Daily 20-minute triage (S0 within 2 hours while waking). | |
| 12 to 13 | Holiday. Triage only S0 and S1. | |
| 14 (4 Jan) | C1 exit review. Counsel sign-off received. Store listing, screenshots, review notes with a demo account (BL-286). Privacy labels entered with evidence. | D-030 settled by brief decision 10 (no beta line in the listing) |
| 15 (11 Jan) | **Submit Monday 11 January.** Answer App Review within a day. | |

Founder items with no week set yet: pick the model and pack host (D-046, BL-125) before the model manager (BL-143) starts; answer whether server content also carries the public remote config (D-035 chose a Supabase table; brief decision 17 says public config comes from an edge cache; BL-167).

---

## 4. Go or cut checkpoint (end of week 6, Friday 13 Nov)

If any of these is red on 13 Nov, apply cuts in this order until the date is safe again. Each cut is reversible in v1.1. Brief decisions 3, 5 and 9 (3 Oct) already took or removed several rows; they stay below, marked, so the record is complete. The savings were estimated before those decisions and have not been re-estimated.

| Red signal | Cut | Saves (E) |
|---|---|---|
| M7 not started or D-032 unanswered | **Taken 3 Oct (brief decision 9).** Family letters are text-only in v1.0; voices across phones in v1.1 (BL-315). The recording still plays on the phone that made it and is in that author's export | 3 weeks |
| M8 server behind (notifications endpoint not in staging) | **Signal no longer applies:** there is no purchase server (brief decision 3). Whether trials and their reminders stay depends on the founder's answer to BL-223 | n/a |
| M3 device spike fails on SE 3 | Ship `small-q5_1` as the default with turbo opt-in on 6 GB devices (Read together word highlight already moved to v1.1 by brief decision 9) | 1 to 2 weeks |
| M3 language packs behind (a language's model or text-rule pack not at the bar by week 6) | **No agreed cut:** brief decision 6 names all seven languages. The founder decides then whether a language waits for a later release | U |
| M6 behind | **No longer applies:** contributors and approvals moved to v1.1 (brief decision 5) | n/a |
| M11 behind | Increase Contrast variants and NativeTabs to v1.1; AX5 on P0 screens stays a gate | 1 week |

Not cuttable for v1.0 (they are the constitution or P0 legal duties): the verifier and immutable raw transcript; crash-safe capture; export; in-app account deletion; the 18+ gate; opt-in consent before any analytics; server-side consent and access checks; accurate claims; ARL notice windows if any trial or renewal is sold.

---

## 5. v1.0 scope in one list

In (as of the brief of 3 Oct): 18+ gate; welcome screen; first run with any number of children (first-run batch free); speak or type; letters spoken in English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese, each language's pack downloaded only when picked and deletable in Settings (decisions 6 and 15); crash-safe capture; a cleaner listening copy with the original always kept and playable (decision 8); on-device transcription with rules-only fixes through `verifyEdits`; Review with every edit visible and undoable; one-time "can make mistakes" card; book by month; playback; Read together without word highlight (what Plus includes at v1.0 is BL-154); export (ZIP and PDF, offline); Sign in with Apple, Google and email link plus code, with passkeys added after sign-in (decision 4); text sync across devices; the co-parent in the app with per-child sharing (decision 5); local reminders; Plus monthly and annual with free trials through StoreKit 2 and Apple's own subscription, restore and manage screens, with Family Sharing and no purchase server (decision 3; trial and renewal reminders depend on BL-223); opt-in PostHog and Sentry; prompts, notes, config and pack manifests served from an edge cache with the last good copy on the device (decision 16); a static "If you are struggling" row; Settings with consents and legal; in-app account deletion; static `/delete-account` page; English app interface ready for localisation; an app download under 40 MB; US App Store only.

Out of v1.0 (see section 6): web contribution page, family members other than the co-parent, shared voice and any audio upload, word highlighting, the safety classifier, Hindi-English mixed letters, account linking between sign-in methods, 4-story intro, server transcription, LLM edit pass, Vault mode and full key hierarchy, gifts, lifetime, print, Android, a localised app interface.

---

## 6. v1.1 and later

v1.1 target: 6 to 8 weeks after launch (March 2027), in this order:
1. **Web contribution page** (`apps/web`): anonymous web identity created at Send, contributor gateway and return links, browser audio encryption, 18+ confirmation at Send, Hindi invite messages and Hindi web page (B-REQ-008, -022, PRD-REQ-007, K-08; LEGAL-REQ-005, -010, -035 bind from here) (BL-300, BL-301).
2. **Moved here by the brief of 3 Oct** (order within this item is a proposal for the founder): family contributors in the app, with approvals and family-letter push (BL-316, decision 5); shared voice, the encrypted audio upload behind it (BL-315, decision 9); word highlighting in Read together (BL-318); Hindi-English mixed letters (BL-323, decisions 6 and 9); the on-device safety classifier, only with a clinician's written sign-off (BL-322).
3. **Account linking** between sign-in methods (A-REQ-019) (BL-302); Google sign-in itself is v1.0 (BL-179).
4. **4-story intro** behind the remote variant switch (A-REQ-003 to -011) (BL-303).
5. **Server transcription with consent** through the AI gateway (ADR 0002, 0012; LEGAL-REQ-004, -005, -020) and the name check (B-REQ-017) (BL-304, BL-305).
6. **Backup and restore UX** on top of the v1.0 pipeline; Vault mode and the Recovery Kit if families ask (ADR 0006) (BL-306).
7. **Plus extras:** server-side Read together counter (BL-307); gift a year of Plus; dormant-payer email; trial-length experiment once there are about 40 trial starts a day (BL-308).
8. **Reduced server export** for contributors and email access requests (DATA-REQ-054 partial) (BL-309).
9. **Full web deletion flow** and `/privacy-choices` (LEGAL-REQ-030), required before Android (BL-310).
10. **External penetration test** before the public TestFlight link, paid marketing or 1,000 families, whichever is first (BL-313).

Later (v1.2 and beyond): Android with Google Play Billing (decide then: direct server integration or RevenueCat for both stores; ADR 0013) (BL-311); load test at 2x the 100k targets before 25k families (BL-312); photos under per-book keys and an optional Face ID lock (BL-314); sealed letters, multi-book invite picker, merge books, themes, author and child photos (B-REQ P1s); Hindi app UI (P2); lifetime purchase (P2); printed books (future launch, K-32).

---

## 7. Publishing as an individual: what it means for this plan

Decision D-004 (founder, 3 Oct 2026). Full reasoning and sources in `docs/DECISIONS.md` D-004; the short version for planning:

- **Removed from the critical path:** LLC formation, D-U-N-S number, organisation enrollment. Apple individual enrollment needs an Apple Account with two-factor authentication and takes days, not weeks [A].
- **Still on the critical path:** the domain and a support email on it (D-005).
- **Seller name:** the founder's personal legal name appears as the seller on the App Store (Apple enrollment page, opened 3 Oct 2026), and as the provider in the Terms, Privacy Policy, Subscription terms and the Consumer Health Data policy, with a contact address and email. `packages/brand` holds only a TODO placeholder; the name is entered in the legal documents and in App Store Connect, never in code.
- **No liability shield:** the founder is personally exposed. Terms and the beta and "can make mistakes" disclaimers help but do not replace an entity. Price tech E&O plus cyber insurance anyway.
- **Reconsider before scale.** Recommended trigger: form an entity and transfer the app before the public TestFlight link or paid marketing, 1,000 families, $2,000 a month in proceeds, any hire or contractor with data access, or Android, whichever comes first.
- **Guideline 5.1.1(ix) risk (medium likelihood, high impact).** The current text asks apps in regulated fields "or that require sensitive user information" to be submitted by a legal entity. Mitigations in the plan: Lifestyle category, no health language in metadata, review notes framing the app as a family memory journal that does not require health information, a prepared answer. Decision point: by 27 Nov the founder chooses whether to start an entity in parallel as insurance (week 8 in section 3).
- **Transfer later is possible with conditions** (Apple's app-transfer criteria, opened 3 Oct 2026): at least one released version; both accounts on current agreements; no version in review; In-App Purchase product ids unique in the recipient account; for auto-renewable subscriptions an app-specific shared secret handed over and regenerated; Sign in with Apple transfer identifiers generated for every user before the transfer (we keep each user's Apple subject id for this); TestFlight switched off and testers removed; Keychain sharing groups change with the team, so users sign in once more after the next update; APNs keys re-created in the new team (details U); there is no App Store Server API key or notification URL to move, because no server of ours sees purchases (brief decision 3). The plan for this lives in BL-100's notes and is a runbook item when the founder decides.

---

## 8. Risks to the date

| Risk | Signal | Response |
|---|---|---|
| On-device transcription too slow or hot on SE 3 | BL-043 numbers by 30 Oct | Section 4 cut 3; small model default |
| Founder review capacity | More than 15 open PRs older than 3 days | Pause lower-priority streams (M11 polish first); keep critical path streams |
| Counsel turnaround over 3 weeks | No markup by 27 Nov | Narrow the package to Terms, Privacy, CHD, in-app disclosures; Subscription terms last |
| Beta App Review or holiday closure delays C1 | Build not approved by 16 Dec | C1 starts on approval; submission moves day for day; keep 18 Jan as the buffer week |
| 5.1.1(ix) rejection as an individual | App Review message | Prepared response; if it stands, entity plus organisation account (2 to 6 weeks, U); D-004 hedge reduces this |
| Guideline 2.2 rejection for "beta" in metadata | Store copy still says beta | D-030 |
| ARL notice bug after launch | Any notice outside its window | Hard-window refusal pages the founder instead of sending late; year-long clock test gates every release |
| Shared Apple IDs and restore confusion | Support tickets | D-047 rule; measure |
| A letter language misses the quality bar | Per-language results from BL-161 and BL-147; native-speaker review of the packs (BL-162, BL-163) | Section 4 row: the founder decides per language |
| No host for models and packs | BL-125 still open when BL-143 is unblocked | Founder picks (D-046); PR #35's comparison is the input |
| App Review reads downloaded packs or server content as new functionality (guidelines 2.5.2, 2.3.1) | Rejection message | Packs are data read by an engine App Review has seen (BL-149); nothing that changes collection or the paywall is server-driven (BL-229); review notes and counsel questions (BL-281) |
| App download over 40 MB | First measured size (BL-285) | Font plan (BL-274); anything large moves to on-demand download |
