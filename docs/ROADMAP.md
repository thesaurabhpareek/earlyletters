# Roadmap to App Store submission

Owner: lead PM (architect-integrator). Version 1.0, 3 Oct 2026. Plan of record for v1.0; task detail lives in `docs/BACKLOG.md` (BL-### ids), decisions in `docs/DECISIONS.md` (D-###), requirements in `docs/prd/PRD.md` 1.3.

Adapted from TDD 10 section 6.2 (11 weeks for a co-parent-only, free v1.0) with the founder's 3 Oct decisions: **Plus at launch** through the App Store (D-001), **family contributors in the app at launch** (D-002), full opt-in analytics (D-003), individual publisher (D-004). Those add about four weeks of parallel work.

**Target App Store submission: Monday 11 January 2027 (week 15).** Public release on approval, target the week of 18 January 2027, with weeks 16 and 17 as buffer for one rejection cycle.

How confident: moderate. The date holds if (1) the on-device transcription spike passes on iPhone SE 3 by 30 Oct, (2) the founder answers D-023 (sync engine) by 16 Oct and D-032 (shared voice) by 23 Oct, (3) four to five agent work streams run in parallel and the founder can review and merge 10 to 15 small PRs a week with an independent review agent doing the first pass, and (4) counsel returns the document package in 3 weeks. The most likely slip is 2 to 4 weeks (early February), coming from transcription performance (M3) or family plus shared voice (M6, M7). Section 4 lists the cuts that protect the date.

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
| **M0 Founder long poles** | 1 to 3, then ongoing | none | Domain registered and support mailbox live (wk 1); Apple Developer individual enrollment (wk 1); Paid Applications Agreement, tax and banking accepted (wk 2); bundle ids and App Store Connect app record, subscription group, two products with intro offers, grace period, US-only territory (wk 3); staging and production Supabase projects (wk 2); email provider with SPF, DKIM, DMARC (wk 2); counsel engaged (wk 1); clinician asked (wk 1) | BL-100 to BL-109, BL-053, BL-005, BL-015 |
| **M1 Guardrails and the security migration pack** | 1 to 2 | none | CI and branch protection on; agent fence for `supabase/` and auth (D-041); one fix pack applied to staging by CI: parent-only invites with explicit role, client ids for children, server consent gate, policy-version fix, pepper fail-closed; test retitles; content-rule additions; `child-input` flag in core; verifier hardening | BL-001 to BL-004, BL-110 to BL-122, BL-016 |
| **M2 Capture that cannot lose a word** | 2 to 4 | M1 (CI) | Draft row before the first audio byte; stop-and-save on background; atomic save with SHA-256 and fsync; orphan sweep; 18+ root gate (24 h stop, boolean only); `app.config.ts` from brand; EAS dev and preview builds on a real SE 3; kill-during-save 500x passes | BL-130 to BL-137, BL-031, BL-037, BL-040, BL-111 |
| **M3 Transcription in a release build** | 2 to 6 | M2 dev build | Decoder module; whisper engine v2 (VAD, chunks, word timings); model download manager on a zero-egress host; transcription queue and voice-only save; device numbers recorded in ADR 0001; 14-recording experiment decides model tier and Hindi script (D-031, by 30 Oct) | BL-043, BL-140 to BL-148 |
| **M4 Book, export, reminders, settings** | 4 to 8 | M2 | Month chapters and Read together on local audio with word highlight; offline ZIP and PDF export with schema test; local reminders (a few evenings a week, quiet window, lock-screen names off by default); remote config table and client; Settings IA with privacy and legal rows; welcome screen | BL-022, BL-023, BL-034, BL-035, BL-150 to BL-160 |
| **M5 Account, sync, co-parent** | 4 to 8 | M0 domain (SMTP, Services ID, universal links); M1; **D-023 answer by 16 Oct** | Sign in with Apple and email link plus code; Terms acceptance and sensitive-data consent recorded server-side; re-own local data in one transaction; `book_access` migration; sync client per D-023 with idempotency, rejected-write and restore-epoch tests; co-parent invite; two-phone test | BL-050 to BL-054, BL-170 to BL-178, BL-024 |
| **M6 Family contributors in the app** | 7 to 10 | M5 | Family role invites by link or code (one child each), invite-redeem with rate limits, contributor first run, approvals (add, keep aside, auto-add), leave and remove with letter retention, "Family can read", family-letter push without content; visibility matrix and cross-child leak tests green | BL-190 to BL-196 |
| **M7 Shared voice** (if D-032 approved by 23 Oct) | 8 to 11 | M5, M6 (sharing model), D-032 | Encrypted upload of recordings in shared books (Free) and all recordings (Plus); member playback through an Edge Function; wrap-key custody and unwrap log; bucket registry and purge cover audio; delete propagates to member devices | BL-200 to BL-206, BL-232 |
| **M8 Plus through the App Store** | 3 to 12 | M0 (Paid Apps Agreement, products), M5 (accounts) | expo-iap spike on SDK 57 (wk 3); plan engine and notice windows as pure, table-tested code (wk 4 to 5); billing migration and `create_child` Plus rules (wk 6); App Store notifications endpoint, `sync_plan`, reconcile (wk 7 to 9); purchase, restore, manage, refund, Plus sheet, Settings > Plan (wk 8 to 10); notice scheduler with hard windows and the year-long clock test (wk 9 to 12); sandbox checklist S-1 to S-10 signed (wk 11 to 12) | BL-036, BL-210 to BL-222 Amended 4 Oct 2026 (D-051, D-052): M8 also carries the letter allowance gate, the never-discard rule, paywall at the limit and the Redeem a code row; see section 9. |
| **M9 Privacy, deletion, disclosures, ops** | 7 to 12 | M5 | In-app account deletion with 30-day undo; purge worker and cross-system verification script; `analytics-forget`; ops audit log and runbook wrapper; data map canonical; privacy labels and manifest generated with evidence; log canary; kill switches; WISP; static `/delete-account` page; value-free validation trigger | BL-016, BL-231 to BL-249 |
| **M10 Opt-in analytics** | 7 to 10 | BL-020, BL-021, BL-023; counsel approves `analyticsConsent.*` | PostHog and Sentry initialise only after consent; nothing queued before; withdrawal in Settings; network-capture test proves zero requests before consent | BL-020, BL-021, BL-250 to BL-252 |
| **M11 Accessibility and design system** | 3 to 11 (parallel) | BL-030 spike | Tokens (destructive, type scale, control contrast), standard components, letter text uncapped, AX5 stacking on every P0 screen, persistent toast, locale dates and plurals, VoiceOver script on SE 3 | BL-030, BL-255 to BL-273 |
| **M12 Beta and release engineering** | 6 to 14 | M2 for C0; M4 to M10 for C1 | C0 internal TestFlight from week 6; Maestro E2E flows in CI; external beta C1 build to Beta App Review by Fri 11 Dec; C1 (15 to 25 families) 14 Dec to 8 Jan with exit criteria (zero open S0 or S1, crash-free sessions 99.8% or more, no fidelity complaint traced to an engine edit, co-parent and grandparent flows done without help); founder release checklist | BL-044, BL-135, BL-275 to BL-289 |
| **M13 Store submission** | 14 to 15 | M12 exit; counsel sign-off on Terms, Privacy Policy, CHD policy, Subscription terms and in-app disclosures; D-030 answered | Listing (no beta line if D-030 approved), screenshots, privacy labels in App Store Connect with evidence, review notes with a demo account and the 5.1.1(ix) positioning, territories = United States, products attached to the version; **submit Mon 11 Jan** | BL-286, BL-104 |

**Critical path:** M0 (domain, Paid Apps Agreement) then M5 (accounts and sync) then M6 (family) then M7 (shared voice) then the C1 build on 11 Dec then C1 exit then submission. Two parallel near-critical chains: M3 (transcription on device; nothing ships if spoken letters cannot be saved) and M8 (Plus: store setup in week 3, server in weeks 6 to 9, the notice engine and sandbox checklist by week 12). Everything else is parallel agent work.

```
wk:   1  2  3  4  5  6  7  8  9  10 11 12 13 14 15
M0   [==domain, Apple, Paid Apps, products==]
M1   [=====]
M2      [========]
M3      [==============]                       (spike decides by wk 4)
M4            [==============]
M5            [==============]                 (needs D-023 by 16 Oct)
M6                     [===========]
M7                        [===========]       (needs D-032 by 23 Oct)
M8         [===================================]
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
| 1 (5 Oct) | Choose and register the domain (plus defensive redirects); create the support mailbox (BL-100). Enroll in the Apple Developer Program as an individual (BL-101). Create staging and production Supabase projects; turn on 2FA on every console (BL-107, BL-106). Turn on branch protection; pause unattended agent runs for `supabase/` and auth (BL-005, D-041). Send counsel the v1.0 scope and document list (BL-104). Ask the perinatal clinician for a yes or no by 20 Nov (BL-105). | D-031 experiment: record the 14 recordings |
| 2 (12 Oct) | Accept the Paid Applications Agreement; tax and banking forms (BL-102). Pick the email provider; DNS records (BL-053). Apply the M1 migration pack to staging through CI (BL-015). Run the 14-recording experiment (BL-043). Create the EAS account and Apple credentials (BL-108). | **D-023 sync engine by Fri 16 Oct** |
| 3 (19 Oct) | App Store Connect: bundle id, app record, subscription group, two products, introductory offers, grace period, Family Sharing off, US only (BL-103). Sign in with Apple Services ID and key with a rotation date (BL-053). Install the first dev build on an iPhone SE 3. | **D-032 shared voice by Fri 23 Oct** |
| 4 (26 Oct) | Device spike for on-device transcription on SE 3 and a current iPhone (BL-043). Decide model tier and Hindi script. | **D-031 Hindi script by Fri 30 Oct** |
| 5 (2 Nov) | Counsel receives the full v1.0 document package (Terms, Privacy Policy, CHD policy, Subscription terms, in-app disclosures, claims registry). Vendor evidence: DPAs for Supabase, PostHog, Sentry, email provider; encryption at rest in writing (BL-106). | |
| 6 (9 Nov) | **Go or cut checkpoint** (section 4). Start C0 internal TestFlight on the founding family's phones. Begin recruiting C1 families (BL-109). Override window for ADR 0013 closes as BL-213 starts. | Checkpoint call |
| 7 (16 Nov) | Review the family flows on two phones. Approve `analyticsConsent.*` copy with counsel. | **D-034 clinician answer by Fri 20 Nov** |
| 8 (23 Nov) | Thanksgiving week: light. Sandbox purchase on device (first pass). | **D-004 hedge by Fri 27 Nov** (start an entity in parallel or not) |
| 9 (30 Nov) | Restore drill (iCloud device backup, export, new phone) (BL-284). Review deletion flow end to end in staging. | **D-045 beta cohorts by Fri 4 Dec** |
| 10 (7 Dec) | Feature freeze. Sign the sandbox checklist S-1 to S-10 (BL-222). Send the C1 build to Beta App Review by **Fri 11 Dec**. C1 welcome note and Report a problem path ready (BL-280). | |
| 11 (14 Dec) | C1 starts. Daily 20-minute triage (S0 within 2 hours while waking). | |
| 12 to 13 | Holiday. Triage only S0 and S1. | |
| 14 (4 Jan) | C1 exit review. Counsel sign-off received. Store listing, screenshots, review notes with a demo account (BL-286). Privacy labels entered with evidence. | **D-030 store beta line** (before the listing is final) |
| 15 (11 Jan) | **Submit Monday 11 January.** Answer App Review within a day. | |

---

## 4. Go or cut checkpoint (end of week 6, Friday 13 Nov)

If any of these is red on 13 Nov, apply cuts in this order until the date is safe again. Each cut is reversible in v1.1.

| Red signal | Cut | Saves (E) |
|---|---|---|
| M7 not started or D-032 unanswered | Family letters are text-only in v1.0; voices across phones in v1.1 (D-032 alternative a). The recording still plays on the phone that made it and is in that author's export | 3 weeks |
| M8 server behind (notifications endpoint not in staging) | Annual plan only, no free trial (TDD 10 fallback): removes the trial notice arms; monthly and trials in v1.1 | 1 to 1.5 weeks |
| M3 device spike fails on SE 3 | Ship `small-q5_1` as the default with turbo opt-in on 6 GB devices; Read together word highlight to v1.1 (plain playback stays) | 1 to 2 weeks |
| M6 behind | Approvals only (no auto-add, no thank-you); "Family can read" fixed off for contributors at v1.0 | 1 week |
| M11 behind | Increase Contrast variants and NativeTabs to v1.1; AX5 on P0 screens stays a gate | 1 week |

Not cuttable for v1.0 (they are the constitution or P0 legal duties): the verifier and immutable raw transcript; crash-safe capture; export; in-app account deletion; the 18+ gate; opt-in consent before any analytics; server-side consent and access checks; accurate claims; ARL notice windows if any trial or renewal is sold.

---

## 5. v1.0 scope in one list

In: 18+ gate; welcome screen; first run with any number of children (first-run batch free); speak or type; crash-safe capture; on-device transcription with rules-only fixes through `verifyEdits`; Review with every edit visible and undoable; one-time "can make mistakes" card; book by month; playback; Read together (3 free sessions per Free book, then Plus); export (ZIP and PDF, offline); Sign in with Apple and email link plus code; text sync across devices; co-parent and family contributors in the app with approvals and per-child sharing; shared voice (pending D-032); local reminders; Plus monthly and annual with trials, restore, manage, refund, grace, notices; opt-in PostHog and Sentry; Settings with consents and legal; in-app account deletion; static `/delete-account` page; US App Store only.

Out of v1.0 (see section 6): web contribution page, Google sign-in, 4-story intro, server transcription, LLM edit pass, Vault mode and full key hierarchy, gifts, lifetime, print, Android, Hindi app UI.

---

## 6. v1.1 and later

v1.1 target: 6 to 8 weeks after launch (March 2027), in this order:
1. **Web contribution page** (`apps/web`): anonymous web identity created at Send, contributor gateway and return links, browser audio encryption, 18+ confirmation at Send, Hindi invite messages and Hindi web page (B-REQ-008, -022, PRD-REQ-007, K-08; LEGAL-REQ-005, -010, -035 bind from here) (BL-300, BL-301).
2. **Google sign-in** on iOS, with account linking (A-REQ-017, -019) (BL-302).
3. **4-story intro** behind the remote variant switch (A-REQ-003 to -011) (BL-303).
4. **Server transcription with consent** through the AI gateway (ADR 0002, 0012; LEGAL-REQ-004, -005, -020) and the name check (B-REQ-017) (BL-304, BL-305).
5. **Backup and restore UX** on top of the v1.0 pipeline; Vault mode and the Recovery Kit if families ask (ADR 0006) (BL-306).
6. **Plus extras:** server-side Read together counter (BL-307); gift a year of Plus; dormant-payer email; trial-length experiment once there are about 40 trial starts a day (BL-308).
7. **Reduced server export** for contributors and email access requests (DATA-REQ-054 partial) (BL-309).
8. **Full web deletion flow** and `/privacy-choices` (LEGAL-REQ-030), required before Android (BL-310).
9. **External penetration test** before the public TestFlight link, paid marketing or 1,000 families, whichever is first (BL-313).

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
- **Transfer later is possible with conditions** (Apple's app-transfer criteria, opened 3 Oct 2026): at least one released version; both accounts on current agreements; no version in review; In-App Purchase product ids unique in the recipient account; for auto-renewable subscriptions an app-specific shared secret handed over and regenerated; Sign in with Apple transfer identifiers generated for every user before the transfer (we keep each user's Apple subject id for this); TestFlight switched off and testers removed; Keychain sharing groups change with the team, so users sign in once more after the next update; APNs keys and our App Store Server API key and notification URLs re-created in the new team (details U). The plan for this lives in BL-100's notes and is a runbook item when the founder decides.

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

---

## 9. Membership change (D-051) and early-tester offer codes (D-052), 4 Oct 2026

No dates are set for this work. It is added to M8 and shares its critical path; the effect on the 11 Jan 2027 target has not been estimated (unverified, the payments and mobile leads must size it).

**Engineering work (not started)**
1. Entitlement gate on letter creation: `add_letter` in the plan engine, server enforcement beside `create_child`, remote config `free_letters_allowance` (default 2) (TDD 08 section 14).
2. Never discard an in-progress letter at the limit: keep on the phone, offer Plus, sync when Plus starts (PRD-REQ-025).
3. Paywall at the limit, reworked Plus sheet and Settings > Plan; lapse behaviour changed (existing letters stay open, new letters need Plus).
4. Supabase entitlement and free-tier test changes (owners: data architect, payments engineer; `supabase/**` is untouched by the docs change).
5. Content-free analytics events for the limit moment (analytics engineer).
6. **Redeem a code** row in Settings > Plan (PRD-REQ-027), and `OFFER_REDEEMED` mapping, built next to the BL-213 server work (D-052, `docs/ops/OFFER_CODES.md` on branch `docs/offer-codes-runbook`).
7. Decide the open edges before the paywall is built (D-051: family letters, second child's book, offline counting, Read together interplay, first-run children).

**Dependencies (no dates)**
- **Counsel review** of the new subscription and "what stays free" wording, the changed promise line, and offer-code wording in the Subscription terms, before any release. It joins the counsel package in section 8 (turnaround risk already listed).
- **App Store disclosures and review notes:** paywall and subscription disclosures for a freemium model, review notes describing 2 free letters then Plus, and the privacy and subscription metadata in App Store Connect. Apple's current guideline text must be re-read at the time (unverified here).
- **Content and legal copy** are owned by other agents; engineering cannot ship the paywall until the promise line and `plus.*` strings change.
- **Offer codes** need the subscription in App Store Connect and the app installable; whether the free period can be exactly 6 months, and whether TestFlight testers need codes, are unverified.
