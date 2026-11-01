# Decision log

Owner: lead PM (architect-integrator). Started 3 Oct 2026. This file is the single dated record of product and architecture decisions for Early Letters (codename `scribe`). PRD.md records requirements; ADRs record the technical reasoning; this log records **who decided what, when, and what is still waiting**.

Status values:
- **Decided (founder)**: the founder made the call. Change it only with a new dated entry that supersedes it.
- **Recommended (needs founder OK)**: the PM and architects recommend it. "Proceed?" says whether engineering may build on the recommendation before the founder answers (only for cheap, reversible choices) or must wait.
- **Open**: nobody has decided; the entry says who decides and by when.

Rules: one decision per ID; never reuse an ID; superseding entries name the ID they replace. Requirements that change because of a decision are edited in PRD.md (conflict log K-##) in the same change.

Sources cited by short name: PRD (docs/prd/PRD.md 1.3), TDD 01 to 10 (docs/tdd/), ADR (docs/adr/), LEGAL-REQ (docs/legal/ENGINEERING_REQUIREMENTS.md), Lawyer 1 and 2 (docs/legal/memos/).

---

## Index

| ID | Decision | Status | Proceed? | Date |
|---|---|---|---|---|
| D-001 | Plus ships in v1.0, sold and managed only through the App Store (StoreKit 2 direct, ADR 0013) | Decided (founder); tooling recommended | Yes | 2026-10-03 |
| D-002 | Family at v1.0 = co-parent and family contributors in the app; web contribution page in v1.1 | Decided (founder) | Yes | 2026-10-03 |
| D-003 | Full opt-in product analytics (PostHog) and opt-in crash reports (Sentry) at launch | Decided (founder) | Yes | 2026-10-03 |
| D-004 | Publish as an individual Apple Developer account; no LLC for now | Decided (founder) | Yes | 2026-10-03 |
| D-005 | D-U-N-S and LLC off the critical path; domain and support email stay on it | Decided (founder) | Yes | 2026-10-03 |
| D-006 to D-014 | Earlier founder decisions carried forward (18+ only, first-run children free, joined books, Read together, print, beta, pricing, US-only, multi-child) | Decided (founder) | Yes | 2026-10-01/02 |
| D-020 | Invite and return-link hashes deleted 90 days after use, revocation or expiry | Recommended | Yes | 2026-10-03 |
| D-021 | Two log clocks: `audit_events` 24 months; ops, security and escrow logs 12 months | Recommended | Yes | 2026-10-03 |
| D-022 | Auto-renewal notice windows: strictest-state table (TDD 05 X-06, TDD 08 4.3) | Recommended (counsel confirms) | Yes | 2026-10-03 |
| D-023 | Sync engine v1.0: outbox push plus cursor pull on expo-sqlite (amends ADR 0004) | Recommended (needs founder OK) | **No** (wait) | 2026-10-03 |
| D-024 | One visibility predicate: trigger-maintained `book_access` table; `book_entries` view rebuilt on it | Recommended | Yes | 2026-10-03 |
| D-025 | Lock-screen child names off by default, remote-config flippable | Recommended | Yes | 2026-10-03 |
| D-026 | 18+ gate stores `ageGate.passed` boolean and, after a No only, `ageGate.stoppedAt`; no `ageAttestedAt` | Recommended (implements founder decision D-006) | Yes | 2026-10-03 |
| D-027 | Letter text is never capped for Dynamic Type | Recommended | Yes | 2026-10-03 |
| D-028 | Dates follow the device locale (US: "Tuesday, September 29, 2026") | Recommended | Yes | 2026-10-03 |
| D-029 | Separate `destructive` colour token equal to today's terracotta | Recommended | Yes | 2026-10-03 |
| D-030 | Beta runs on TestFlight; the v1.0 store listing carries no beta label; in-app About label and Terms 16.4 stay | Recommended (needs founder OK; amends K-13) | Yes for TestFlight; store copy waits | 2026-10-03 |
| D-031 | Hindi script default (Devanagari, Roman or automatic) | Open (decide after the 14-recording experiment, by 30 Oct) | n/a | 2026-10-03 |
| D-032 | "Shared voice": in v1.0, recordings of letters in a shared book upload (simple server-wrapped key) so family hear each other; backup of every recording stays Plus | Recommended (needs founder OK) | **No** (wait) | 2026-10-03 |
| D-033 | Free audio durability = the phone plus the user's own iCloud device backup plus export; fix the "only on this phone" copy | Recommended (needs founder OK) | Yes for storage path; copy waits | 2026-10-03 |
| D-034 | Safety classifier ships only with a clinician's written sign-off by 20 Nov; otherwise a static resources row | Recommended (needs founder OK) | Yes | 2026-10-03 |
| D-035 | Remote config and kill switches in a Supabase table with an audit trigger (answers BL-022) | Recommended | Yes | 2026-10-03 |
| D-036 | A purchase needs an account; contributors never see the Plus sheet; no offer where Plus is already on | Recommended | Yes | 2026-10-03 |
| D-037 | Read together free sessions counted per book on the device in v1.0; server counter in v1.1 | Recommended | Yes | 2026-10-03 |
| D-038 | `create_child` accepts client ids, a first-run batch (cap 6) and books made offline under Plus; never deletes a refused book | Recommended | Yes | 2026-10-03 |
| D-039 | Contributors see the child's name, nickname and birthday month and day; never the due date or birth year | Recommended (counsel confirms) | Yes | 2026-10-03 |
| D-040 | Minimum iOS 17 | Recommended | Yes | 2026-10-03 |
| D-041 | Two Supabase projects, migrations only from CI on a tag; unattended agent runs paused for `supabase/` and auth | Recommended | Yes | 2026-10-03 |
| D-042 | `/delete-account` at v1.0 is a static page plus an email route; the full web flow ships before Android | Recommended (counsel confirms) | Yes | 2026-10-03 |
| D-043 | v1.0 entry: one welcome screen then the 18+ gate; 4-story intro in v1.1 | Recommended | Yes | 2026-10-03 |
| D-044 | Sign in with Apple and email link plus code at v1.0; Google sign-in in v1.1 | Recommended | Yes | 2026-10-03 |
| D-045 | Beta cohorts before submission: founding family, then 15 to 25 friendly families for 3 weeks; public TestFlight link optional, after submission | Recommended (needs founder OK) | Yes | 2026-10-03 |
| D-046 | Speech model files on a zero-egress host, never on Supabase egress | Recommended (founder picks the host) | Yes | 2026-10-03 |
| D-047 | Restore never moves an active subscription between two accounts | Recommended | Yes | 2026-10-03 |
| D-048 | Apple Billing Grace Period on, 16 days | Recommended | Yes | 2026-10-03 |
| D-049 | LEGAL-REQ-049 means exactly one `completed` consent row per original transaction (plus a `started` row) | Recommended (counsel confirms) | Yes | 2026-10-03 |
| D-050 | Second consent at first family share (Washington) | Open (counsel) | n/a | 2026-10-03 |

---

## Founder decisions of 3 Oct 2026

### D-001 Plus ships in v1.0, sold and managed only through the App Store
- **Status:** Decided (founder, 3 Oct 2026): Plus in v1.0, "via Apple subscription management to keep it Apple focused". The tooling (StoreKit 2 direct instead of RevenueCat) is recommended in ADR 0013 and follows the founder's direction; the founder may override to RevenueCat until the server billing tasks start (BL-213, week 6).
- **Decision:** Auto-renewable subscriptions in one App Store group, sold, managed, cancelled and refunded only through Apple. Client: `expo-iap` (StoreKit 2). Server: App Store Server Notifications V2 to a Supabase Edge Function, App Store Server API for verification and reconcile. Random `appAccountToken` per account; no third-party billing processor. Prices unchanged: $3.99 a month with a 1-month free trial; $29.99 a year with a 2-month free trial (Apple introductory offers). Lifetime later (P2).
- **Rationale:** the founder's direction; one fewer processor, DPA, SDK and console; $0 vendor cost; every cancel and refund path is Apple's own screen. Cost: about 1.5 to 2.5 extra engineer-weeks over RevenueCat (ADR 0013).
- **Alternatives:** ship 1.0 free and add Plus in 1.1 (TDD 10 Q1; rejected by the founder); annual only with no trial (TDD 10 fallback, kept as a schedule cut, ROADMAP section 4); RevenueCat (ADR 0007; kept as fallback and as the likely Android-time option).
- **Owner:** founder (store setup), payments engineer (build). **Date:** 2026-10-03.
- **Effects:** ADR 0013 added; ADR 0007 digital half superseded; PRD K-34, PRD-REQ-003, -017; LEGAL-REQ-029, -031, -037, -047, -049, -058; subprocessors 1.2.0, privacy-policy 1.3.0, privacy labels 1.2.0, data-policy 1.1.0, DATA_CLASSIFICATION 1.2.0, DELETION_AND_EXPORT_SPEC 1.1.0; BACKLOG M8 tasks; `plus.legal.cancel` names Apple only (App Review 2.3.10 bars other platforms' names in iOS metadata).

### D-002 Family scope at v1.0: co-parent and family contributors in the app; web page in v1.1
- **Status:** Decided (founder, 3 Oct 2026).
- **Decision:** v1.0 ships co-parent and Family (contributor) roles in the iOS app: invites by link or code naming one child, explicit role, approvals by either parent, "Family can read", leave and remove with letter retention, per-child sharing (B-REQ-007, -009, -010, -011, PRD-REQ-014). Family members install the free app and sign in. The web contribution page (B-REQ-008), anonymous web identity (PRD-REQ-007, K-08), browser audio encryption (B-NFR-005 web part) and the Hindi web page (B-REQ-022) move to **v1.1**. Invite links open the app if installed, else the App Store page; nothing in v1.0 copy promises "no app needed".
- **Rationale:** grandparents writing is a core research finding (UR R14), so it cannot wait; the web page is a second product (anonymous auth, browser crypto, `apps/web`; TDD 10 risk 10) and removes the riskiest security surface from v1.0 (TDD 04 finding 2).
- **Alternatives:** co-parent only (TDD 10 Q3 recommendation; rejected by the founder); web page at launch (about 5 more weeks).
- **Consequences:** contributors need an iPhone at v1.0; overseas grandparents without the app wait for v1.1. Grandparents' voices reach parents only if recordings can leave the phone, which forces D-032. LEGAL-REQ-010 and -035 bind when the web page ships (counsel to confirm the re-tier).
- **Owner:** founder. **Date:** 2026-10-03.
- **Effects:** PRD K-35 and scope; BACKLOG M6; invite share messages in `packages/content` say they open the app.

### D-003 Full opt-in analytics at launch
- **Status:** Decided (founder, 3 Oct 2026; restates 2 Oct).
- **Decision:** PostHog with the typed, content-free catalogue in `packages/analytics`, opt-in per Apple 5.1.1(ii), shown as the third ask (PRD-REQ-001, -016, -018). Sentry crash reports ride the same consent switch, as already decided in K-01. Business totals come from server aggregates (PRD-REQ-017). App Store Connect and Xcode Organizer crash rates are the release-gate source because they cover every user (TDD 06 P-7).
- **Rationale:** founder decision; package already built and tested (39 tests).
- **Alternatives:** no third-party SDKs at v1.0 (TDD 10 risk 15; rejected).
- **Open sub-points (engineering, not founder):** analytics-id deletion at request time through a stateless `analytics-forget` function (TDD 05 X-02); counsel approves `analyticsConsent.*`.
- **Owner:** analytics engineer. **Date:** 2026-10-03.

### D-004 Publish as an individual (personal Apple Developer account); no LLC for now
- **Status:** Decided (founder, 3 Oct 2026: "will likely publish with a personal (individual) Apple Developer account").
- **Decision:** The founder enrolls in the Apple Developer Program as an individual. `packages/brand` holds an individual-publisher placeholder with a TODO marker (no real name in code). Terms, Privacy Policy, Subscription terms and the Consumer Health Data policy name the individual as the provider, with a contact address and email. Re-evaluate before scale (trigger list below).
- **Implications, stated plainly:**
  1. **The founder's personal legal name is the seller on the App Store.** Apple: "Your name will be displayed as the seller name of your apps on the App Store" (Apple Developer enrollment page, opened 3 Oct 2026). It also appears in the Terms (Apple's minimum EULA terms require the developer's name and address) and in the privacy notices. Use a mailing address that is not the family home where the law allows (a PO box or mail service); counsel to confirm for each notice (Terms 26.1(h), CAN-SPAM postal address for any commercial email).
  2. **No liability shield.** Claims against the product are claims against the founder personally, including household assets. The Terms' liability cap and the beta and "it can make mistakes" disclaimers reduce exposure but do not replace an entity (Terms counsel note; Lawyer 1 L2 already doubts the $50 floor for lost family recordings). The product holds children's information and consumer health data (Washington MHMDA has a private right of action; Lawyer 2 H2). Insurance (tech E&O plus cyber) is still worth pricing for an individual.
  3. **Recommendation: reconsider before scale.** Form an LLC (or similar) and transfer the app before any of: the public TestFlight link or paid marketing, 1,000 families, $2,000 a month in proceeds, the first hire or contractor with data access, or Android. Earlier is cheaper (see 5).
  4. **Apple guideline 5.1.1(ix) risk.** Current text (opened 3 Oct 2026): "Apps that provide services in highly regulated fields (such as banking and financial services, healthcare, gambling, legal cannabis use, air travel and crypto exchanges) or that require sensitive user information should be submitted by a legal entity that provides the services, and not by an individual developer." **Risk read: medium likelihood, high impact.** Early Letters does not provide a healthcare service, so the first limb should not apply. The exposure is the second limb, "require sensitive user information": the app's subject is a child, our own privacy label declares Sensitive Info (due date, K-25), we publish a Consumer Health Data Privacy Policy, and first run requires a birthday or due date. Apple does not define the phrase; whether a reviewer applies it to a baby memory book is a judgement call we cannot verify in advance. Mitigations: list in Lifestyle (never Health and Fitness or Medical); no health, medical or "development tracking" language in metadata (already true after K-20); App Review notes describe a family memory journal that does not require health information (a due date is optional, a birthday works); answer any 5.1.1(ix) question within a day. **If rejected under 5.1.1(ix)**, the remedy is an organisation account (entity plus D-U-N-S plus enrollment, roughly 2 to 6 weeks, U) and, because Apple transfers only apps that have had a released version, probably a new app record and bundle id in the new account (U; confirm with Apple Developer Support before relying on it). Hedge recommended: the founder decides by 27 Nov (week 8) whether to start an entity in parallel so the fallback costs days, not weeks.
  5. **Later transfer to an organisation account is possible but has conditions.** Apple's app-transfer criteria (opened 3 Oct 2026): both accounts in good standing and on the latest agreements; the app must have at least one version released on the App Store; nothing in review or pending release; In-App Purchase product ids must not collide with the recipient's; for auto-renewable subscriptions, generate an app-specific shared secret and hand it over, then regenerate; for Sign in with Apple, generate a transfer identifier for every user before the transfer (so we must keep each user's Apple subject id, which we already do); TestFlight must be switched off with builds and testers removed; Keychain sharing works only until the next update, after which users sign in once more; APNs keys and Apple Pay merchant ids are re-created. Apple's page does not say what subscribers see during the transfer (U); our App Store Server API key and notification URLs must be re-created in the new team (U on details). Every month of growth adds users to migrate, which is why point 3 recommends doing it early.
  6. **Money and tax:** proceeds, the Paid Applications Agreement, tax forms and banking are in the founder's personal name. The Small Business Program (15%) is open to individuals.
- **Rationale:** founder decision; removes D-U-N-S and LLC lead time from the launch path.
- **Alternatives:** LLC before submission (compliance register line 41, Terms counsel note, TDD 10 M0; deferred by the founder).
- **Owner:** founder. **Date:** 2026-10-03.
- **Effects:** `packages/brand` publisher placeholder; Terms 1.4.0, Privacy Policy 1.3.0, Subscription terms 1.3.0, CHD notice 1.1.0, compliance register 1.2.0 name an individual provider; PRD K-36 and launch gate 4; ROADMAP section 7.

### D-005 D-U-N-S and LLC off the critical path; domain and support email stay on it
- **Status:** Decided (founder, 3 Oct 2026).
- **Decision:** The critical path no longer waits on an entity or D-U-N-S. It still waits on the **domain** (universal links, SMTP, Sign in with Apple Services ID, legal URLs, bundle id) and a **support email** on that domain (App Store support URL, Terms, CAN-SPAM, ARL notices). Domain choice is due in week 1 (BL-053, BL-100).
- **Owner:** founder. **Date:** 2026-10-03.

---

## Earlier founder decisions carried forward (1 and 2 Oct 2026)

| ID | Decision | Source |
|---|---|---|
| D-006 | Adults only. 18+ entry gate before first run, invites and sign-in; No shows a stop screen for 24 hours; no local-only mode; only a boolean is stored | PRD-REQ-019, K-07 |
| D-007 | Every child added together in first run is free (twins or any children added then; reading of PRD 9 Q9 still to be confirmed, see D-038) | PRD-REQ-015 |
| D-008 | A book joined as co-parent does not count as your free book | PRD-REQ-015 |
| D-009 | Read together: 3 free sessions per Free book, then Plus; the number is remote config | PRD-REQ-020 |
| D-010 | Digital only in v1; printed books are a future launch | K-32 |
| D-011 | Beta ends only when the founder says so (placement amended by D-030, pending) | K-13 |
| D-012 | Plus $3.99 a month (1-month trial) or $29.99 a year (2-month trial); lifetime about $99.99 later; Plus per account, books inherit it from any parent | K-28, C-REQ-021 |
| D-013 | US App Store first, iOS only at launch, every pattern Android-portable | PRD 1 |
| D-014 | Multiple children, one book each; additional books are Plus; L1 to L4 data classification; analytics volume accepted | K-12, 7.10, K-01 |

---

## Cross-TDD conflict resolutions (3 Oct 2026)

### D-020 Invite and return-link hash retention: 90 days
- **Status:** Recommended. Proceed: yes.
- **Decision:** Invite token and code hashes, and later web return-link hashes, are deleted 90 days after `coalesce(revoked_at, accepted_at, expires_at)`. Co-parent invites expire in 7 days, Family invites in 14 (K-18).
- **Rationale:** matches K-18, DATA-REQ-060, data-policy, the published draft Privacy Policy and the migration's `purge_due`; keying on use or revocation fixes TDD 02 C16 and TDD 05 X-14. A hash is not content.
- **Alternatives:** 30 days (LEGAL-REQ-033 as first drafted).
- **Owner:** data architect (migration), legal (LEGAL-REQ-033 updated 3 Oct). **Date:** 2026-10-03.

### D-021 Retention of audit and security logs: two clocks
- **Status:** Recommended; counsel confirms (TDD 05 OQ-L9). Proceed: yes.
- **Decision:** `audit_events` (product and dispute evidence, enum-only) keep 24 months (DATA-REQ-066). `ops_audit_log`, `security_events` and escrow-unwrap logs keep 12 months (LEGAL-REQ-033, -037). Both clocks are listed in Privacy Policy section 10.
- **Rationale:** different purposes; TDD 04 X-8 and TDD 05 X-27 agree; TDD 02 OQ-B6 proposed moving deletion evidence into `deletion_requests` (kept 3 years), which is compatible.
- **Alternatives:** one 12-month clock for everything (loses dispute evidence); one 24-month clock (longer than LEGAL-REQ-033 promises).
- **Owner:** data governance lead. **Date:** 2026-10-03.

### D-022 Auto-renewal notice windows
- **Status:** Recommended; counsel confirms the table once (TDD 05 OQ-L7, TDD 08 9.2). Proceed: yes (the windows are data, so a counsel change is one row).
- **Decision:** the server sends notices by this table. `E` = trial end or period end (App Store instant, UTC); `C` = cancel deadline = `E - 24h`. Nothing is ever sent outside its hard window; a missed window pages the founder instead of sending late.

| Notice | Applies when | Target | Hard window | Channels |
|---|---|---|---|---|
| Acknowledgment | purchase or trial start | immediately | within 1 h | email + in-app sheet |
| Trial week | trial of 31 days or less that will renew | `E - 7d` | `[E-8d, E-5d]` | email + card |
| Trial long | trial over 31 days that will renew | `E - 18d` | `[E-21d, E-16d]` | email + card |
| Trial final | every trial that will renew | `E - 4d 12h` | `[E-5d, E-4d]` | email + card + one push |
| Annual renewal, long | annual, will renew, not in trial | `E - 30d 12h` | `[E-31d, E-30d]` | email + card |
| Annual renewal, short | annual, will renew | `E - 7d` | `[E-8d, E-6d]` | email + card |
| Anniversary reminder | monthly plans, each subscription year | anniversary | same day | email |
| Price increase | approved increase (store opt-in consent only) | `effective - 25d` | `[-30d, -7d]` | email + card |

  Birthday rule: emails always go in their window; a push or in-app card avoids the child's birthday only if the window allows. A cancelled renewal (auto-renew off) skips every pending renewal or trial notice for that period.
- **Rationale:** the only schedule inside California, New York, Virginia, Utah and Massachusetts windows at once (Lawyer 1 H1); TDD 05 X-06 and TDD 08 4.3 agree except for the long-trial window, where this table takes the narrower `[E-21d, E-16d]` so the Terms' "16 to 21 days" promise holds. Supersedes K-04's day counts (D-3, birthday shift, "+/- 1 day").
- **Alternatives:** K-04 as written (breaks Virginia and the D-4 Terms promise).
- **Owner:** payments engineer; counsel. **Date:** 2026-10-03.

### D-023 Sync engine for v1.0: outbox push and cursor pull on expo-sqlite
- **Status:** Recommended (needs founder OK, because it reverses ADR 0004). Proceed: **no** for the sync client itself; yes for the `LocalStore` interface and migrator (BL-111), which every option needs.
- **Decision (recommended):** keep expo-sqlite (already shipped). Writes go through an outbox table and one idempotent upsert RPC per batch keyed by client UUIDv7 (RLS and the existing immutability triggers stay the only authority). Reads pull own rows and visible book rows changed since a server cursor (`server_seq` from a sequence set by trigger), through RPCs that use the same `book_access` predicate as RLS (D-024). Any membership or visibility change for a book triggers a full re-pull of that book (about 240 rows a year). A server restore epoch makes clients re-upload their own rows instead of deleting local ones (TDD 06 P-1). Audio uses its own upload queue (D-032). Revisit PowerSync at 10k families, or when photo and audio sync outgrow the simple queue.
- **Rationale:** TDD 10 section 2 (data is tiny; entries are author-owned and `raw_transcript` is immutable, so write conflicts are nearly impossible; about 300 lines); one visibility definition instead of RLS plus Sync Streams (ARCH R4); no op-sqlite engine swap and data migration (TDD 01 R-02); PowerSync cannot replicate `book_entries` (TDD 02 finding 3); PowerSync holds L4 data with no written no-training clause, which TDD 05 OQ-L15 says blocks its use until fixed (vendor gate CN-7); one fewer processor; restore risk (TDD 06 P-1) is simpler to handle when the client never deletes on a missing row.
- **Alternatives:** PowerSync now with an op-sqlite swap before any non-founder data (ADR 0004; TDD 01 and TDD 02 designed it; needs the vendor clause, `book_access` streams and a parity suite); ElectricSQL (rejected in ADR 0004).
- **Cost of waiting:** the sync milestone (M5) starts in week 4. A founder answer by **16 Oct** keeps the schedule; after that each week of delay moves submission by about a week.
- **Owner:** founder decides; sync owner builds. **Date:** 2026-10-03. ADR 0004 carries a status note pointing here.

### D-024 One visibility predicate: `book_access` table
- **Status:** Recommended. Proceed: yes.
- **Decision:** a trigger-maintained `book_access(child_id, profile_id, role, sees_book, sees_pending)` table (TDD 02 3.2) is the one place visibility lives. RLS helpers, the rewritten `book_entries` view (column allowlist, no `raw_transcript`, `machine_edits` or `stt_meta`), the pull RPCs and the cross-child leak test all read it. Contributors' `in_book` is derived from approval (TDD 02 2.3).
- **Rationale:** needed under either sync engine (PowerSync cannot read views; the outbox design wants one indexed predicate); fixes TDD 02 C2 and TDD 07 Q-01 (a test asserting the contributor-reads-everything defect).
- **Alternatives:** keep the `book_entries` view predicate alone (drifts from RLS; fine only for a parent-only v1, which D-002 rules out).
- **Owner:** data architect. **Date:** 2026-10-03.

### D-025 Lock-screen child names off by default
- **Status:** Recommended. Proceed: yes (remote-config default, flippable without a release).
- **Decision:** reminder and family notifications do not show the child's name on the lock screen unless the user turns "Show names on the lock screen" on (C-REQ-009 becomes P0 at v1.0 because the default needs the toggle). Default from remote config `lock_screen_names_default = false`. Neutral notification copy is a content task (BL-157). Server-sent pushes (family letters) never carry the child's name at all, whatever the toggle says (PRD 7.10, DATA_CLASSIFICATION open issue 4); names, when allowed, are rendered on the phone.
- **Rationale:** the child's name is L4 (PRD 7.10); DATA_CLASSIFICATION open issue 4 says the default must be off; TDD 01 X-6 and OQ-10 agree.
- **Alternatives:** names on by default (warmer, but shows L4 data to anyone near the phone).
- **Owner:** product, content. **Date:** 2026-10-03.

### D-026 What the 18+ gate stores
- **Status:** Recommended, implementing founder decision D-006. Proceed: yes.
- **Decision:** device stores `ageGate.passed = 1` after Yes; after No it stores only `ageGate.stoppedAt` (L2) to enforce the 24-hour stop; never an age, birth date or `ageAttestedAt`. The server records `age_attested: true` inside the `terms` acceptance context (server time is on the row). The "I answered by mistake" instant retry is removed (TDD 01 X-3); the gate is a root-level boot gate so links cannot bypass it (TDD 01 summary 2). Declared Age Range results are used in memory only.
- **Rationale:** PRD-REQ-019 says boolean only; DATA_CLASSIFICATION 4.6 allows the stop timestamp; TDD 01 X-4 and TDD 04 task 9 agree.
- **Owner:** mobile engineer; data owner aligns DATA_CLASSIFICATION 4.5 (done in 1.2.0). **Date:** 2026-10-03.

### D-027 Letter text is never capped for Dynamic Type
- **Status:** Recommended. Proceed: yes.
- **Decision:** letter body, transcript, Write and Review fields and signature use no `maxFontSizeMultiplier`; titles use token caps; capped chrome shows the Large Content Viewer.
- **Rationale:** A-NFR-005 and PRD 7.6 require AX5; DESIGN_LANGUAGE 3; grandparents are first-class readers; capping fails the gate as written (TDD 09 Q2, TDD 07 OQ-10).
- **Owner:** design systems. **Date:** 2026-10-03.

### D-028 Dates follow the device locale
- **Status:** Recommended. Proceed: yes.
- **Decision:** `Intl.DateTimeFormat` with the device locale in `packages/core`; the US dateline reads "Tuesday, September 29, 2026". Plurals through `Intl.PluralRules`.
- **Rationale:** B-NFR-007 "locale dates"; US-first launch; TDD 09 Q3 and L1.
- **Owner:** design systems, content. **Date:** 2026-10-03.

### D-029 Destructive colour token
- **Status:** Recommended. Proceed: yes.
- **Decision:** add a `destructive` token equal to today's terracotta (`recording`), separate from amber `caution`; destructive actions keep icon plus words, never colour alone.
- **Rationale:** TDD 09 Q1 default; warnings and destructive actions must not look alike.
- **Owner:** design systems. **Date:** 2026-10-03.

### D-030 Where "beta" lives: TestFlight, plus the in-app About label
- **Status:** Recommended (needs founder OK; amends the store part of K-13). Proceed: yes for the TestFlight programme; the store-copy change waits for the founder (one release, list below).
- **Decision (recommended):** run the beta as TestFlight (internal, then external with Beta App Review). The v1.0 App Store listing has no beta paragraph and no "Now in beta" promotional text. Inside the app, the quiet About label and body stay, and Terms 16.4 stays, until the founder ends the beta (D-011 unchanged).
- **Rationale:** App Review Guideline 2.2 (opened 3 Oct 2026): "Demos, betas, and trial versions of your app don't belong on the App Store - use TestFlight instead." A store description that calls the app a beta invites a 2.2 rejection (TDD 10 risk 4 and contradiction 11). The in-app label is a disclosure about a shipped product, not a beta build.
- **Alternatives:** keep the store beta line (K-13 as written; likely rejection or forced copy change at review).
- **On founder OK, one change set:** remove `storeListing.description` last paragraph and `storeListing.promotionalTextBeta` from `packages/content/src/store.en.ts`; in-app-disclosures section 4 marks the store line not used; Terms 16.4 counsel note updated.
- **Owner:** founder; content. **Date:** 2026-10-03.

### D-031 Hindi script default
- **Status:** Open. Decides: founder, from the 14-recording experiment (BL-043) and the device spike. **Due: 30 Oct (end of week 4).**
- **Question:** default to Devanagari, Roman, or "as spoken" automatic for Hindi and Hinglish letters? Base turbo does not produce Roman Hindi reliably (TDD 03 C-6); fine-tunes change English accuracy (ADR 0012).
- **Default if unanswered:** Devanagari for Hindi with English in Latin; Roman offered only if the experiment shows it works.

### D-032 Shared voice in v1.0
- **Status:** Recommended (needs founder OK). Proceed: **no** for upload code; design and the key scheme spike may start.
- **Problem:** with family in the app (D-002), a grandparent's letter text syncs, but their recording stays on their own phone. Today family hear a recording only once it is backed up (K-33), and backup is Plus (C 4.1). So in a Free family the parents could never hear Nani's voice, and "Read together, in their voices" fails for most families (TDD 10 contradiction 9).
- **Decision (recommended):** v1.0 includes one audio upload pipeline using the simple scheme from TDD 10 (per-file AES-256-GCM key generated on the phone; the file key is wrapped by a server-held key in an Edge Function; members get playback through an Edge Function that checks `book_access` and returns a short-lived URL plus the unwrapped file key over TLS). Policy for what uploads: **Free** = recordings of letters that are in a shared book (a book with two or more members); **Plus** = every recording (private letters included) plus restore on a new phone. Vault mode, per-child keys, X25519 member grants and the synchronizable Keychain module (ADR 0006) move to later.
- **Rationale:** keeps the core promise for every family; one pipeline for both tiers; Storage cost is small at launch (about 19 MB per family per month, ARCH 7); removes the custom native module from v1.0.
- **Costs and changes:** about 3 engineer-weeks (M7); the Privacy Policy short version, section 4 and Terms 12.1 must say recordings of letters in a shared book are uploaded, encrypted, so family can hear them (pre-publication drafts, so a minor change if made before publication); the privacy label already declares audio as User Content; LEGAL-REQ-022(a) reading for a server-wrapped key needs counsel (TDD 10 section 2).
- **Alternatives:** (a) text-only family letters in v1.0, voices in v1.1 (cheapest; the schedule cut in ROADMAP section 4); (b) make backup free for everyone (removes a Plus feature); (c) full ADR 0006 in v1.0 (highest risk; TDD 10 risk 9).
- **Founder answer needed by 23 Oct** to keep M7 in weeks 8 to 11.
- **Owner:** founder decides; security and backend build. **Date:** 2026-10-03.

### D-033 Free audio durability and the "only on this phone" claim
- **Status:** Recommended (needs founder OK). Proceed: yes for the storage path; the copy change waits.
- **Decision (recommended):** keep recordings in a backed-up app directory so the user's own iCloud device backup includes them; keep the speech model in Application Support excluded from backup (ADR 0001, TDD 01 X-2). Rewrite the claim "Without backup, recordings live only on this phone" to "on this phone and in your iPhone's own backup, if you use one". Add a restore drill to QA (TDD 10 section 3).
- **Rationale:** iOS includes app documents in device backups by default, so the current claim is inaccurate either way (TDD 10 risk 8, contradiction 10; Lawyer 2 L1; TDD 05 X-29); excluding audio would make a lost phone lose the child's voice for Free users.
- **Alternatives:** exclude audio from device backup and keep the claim.
- **Owner:** founder; content; mobile. **Date:** 2026-10-03.

### D-034 Safety classifier
- **Status:** Recommended (needs founder OK). Proceed: yes (the code stays behind `safety_card_enabled`, off by default).
- **Decision:** the on-device classifier ships only with a perinatal clinician's written sign-off by **20 Nov (week 7)**; otherwise v1.0 has a static, always-available "If you are struggling" row in Settings > Help with verified resources. Tiers never leave the device (LEGAL-REQ-015).
- **Rationale:** `packages/core/src/safety.ts` says "do not ship outside the founding family" until reviewed; false negatives look negligent, false positives feel surveillant (TDD 10 risk 12).
- **Owner:** founder (clinician), AI engineer. **Date:** 2026-10-03.

### D-035 Remote config and kill switches
- **Status:** Recommended. Proceed: yes (unblocks BL-022).
- **Decision:** one Supabase table (`app_config`, public read of non-secret keys, service-role write, audit trigger into `ops_audit_log`), bundled defaults, cached last-known values, never awaited at launch. Keys at v1.0 include `read_together_free_sessions`, `lock_screen_names_default`, `child_input_enabled` (false), `safety_card_enabled`, `sync_enabled`, `invites_enabled`, `min_supported_build`, `plus_offer_triggers`. Edge Functions read kill switches with a 60 s cache (LEGAL-REQ-040).
- **Rationale:** TDD 01 3.9, TDD 02 2.7 and TDD 10 agree; PostHog flags would depend on analytics consent, which decliners never give.
- **Owner:** data architect, mobile. **Date:** 2026-10-03.

### D-036 Purchase rules: account first, contributors never offered, no double offers
- **Status:** Recommended. Proceed: yes.
- **Decision:** a purchase requires a signed-in account (Keep the book sheet first, then the Plus sheet); contributors never see the Plus sheet (a quiet line instead); nobody is offered Plus in a book already covered by the other parent (TDD 08 R-1 to R-3).
- **Rationale:** Plus is account-scoped (K-28); ARL notices need an email; a contributor's Plus would cover no book.
- **Owner:** payments engineer, PRD C. **Date:** 2026-10-03.

### D-037 Read together counter
- **Status:** Recommended. Proceed: yes.
- **Decision:** count per book, on the device, only when highlighted playback starts in try mode, limit from remote config (PRD-REQ-020). A reinstall resets it (accepted: costs us nothing). Server-side counter in v1.1.
- **Rationale:** TDD 08 2.4 versus TDD 01 OQ-12; the local count is enough for a no-cost feature at launch.
- **Owner:** mobile. **Date:** 2026-10-03.

### D-038 `create_child` rules
- **Status:** Recommended. Proceed: yes.
- **Decision:** `create_child(p_id, p_name, p_date_of_birth, p_due_date)` is idempotent on the client id; `create_first_run_children` accepts at most 6 first-run children once per account (`profiles.first_run_closed_at`); a book created offline while Plus was active is accepted at sync if Plus covered that moment (rule d); a refused book is never deleted or hidden, it stays "On this phone only" until Plus returns. First-run siblings with different dates stay free unless the founder narrows D-007 (PRD 9 Q9).
- **Rationale:** TDD 01 X-7, TDD 02 finding 4 and 2.5, TDD 08 2.5 and OQ-1.
- **Owner:** data architect, payments engineer. **Date:** 2026-10-03.

### D-039 What contributors see about the child
- **Status:** Recommended; counsel confirms (K-25, DATA_CLASSIFICATION open issue 3). Proceed: yes.
- **Decision:** contributors read the child's name, nickname and birthday month and day (for celebrations); never the due date or birth year. Parents see everything.
- **Rationale:** due date is health data (K-25); minimisation; TDD 02 OQ-B3 and TDD 04 OQ-S5.
- **Owner:** data architect. **Date:** 2026-10-03.

### D-040 Minimum iOS 17
- **Status:** Recommended. Proceed: yes.
- **Decision:** iOS 17 minimum (StoreKit 2 needs iOS 15; XCUITest accessibility audits need 17; Declared Age Range is called only where the API exists).
- **Rationale:** TDD 07 OQ-1, TDD 09 Q6, TDD 01 OQ-6.
- **Owner:** mobile. **Date:** 2026-10-03.

### D-041 Environments and the agent fence
- **Status:** Recommended. Proceed: yes.
- **Decision:** `scribe-staging` and `scribe-prod` Supabase projects; migrations applied only by `supabase db push` from CI on a release tag; unattended agent runs paused for `supabase/**` and auth code until CI and branch protection are on; any PR touching them needs an independent review run and the founder's "approve migration" label.
- **Rationale:** TDD 10 risk 6; one project serving as dev and live today (APPLY.md).
- **Owner:** founder (projects), QA (CI). **Date:** 2026-10-03.

### D-042 Web deletion page at v1.0
- **Status:** Recommended; counsel confirms (TDD 10 contradiction 15). Proceed: yes.
- **Decision:** `https://<domain>/delete-account` at v1.0 is a static page explaining in-app deletion and a support-email route handled by a runbook within LEGAL-REQ-031 times; the full magic-link web flow (LEGAL-REQ-030) ships before Android.
- **Rationale:** LEGAL-REQ-030's source is Google Play (CR-091); Apple requires in-app deletion, which ships.
- **Owner:** legal, privacy engineer. **Date:** 2026-10-03.

### D-043 Entry at v1.0: one welcome screen
- **Status:** Recommended. Proceed: yes.
- **Decision:** v1.0 opens on one static welcome screen, then the 18+ gate, then first run. The 4-story intro (A-REQ-003 to -011) moves to v1.1 behind the existing remote variant switch.
- **Rationale:** 11 requirements and an animation budget for a screen most people skip (TDD 10 section 2); frees mobile time for family and Plus.
- **Owner:** PRD A, mobile. **Date:** 2026-10-03.

### D-044 Sign-in methods at v1.0
- **Status:** Recommended. Proceed: yes.
- **Decision:** Sign in with Apple and email link plus 6-digit code at v1.0. Google sign-in moves to v1.1 (it arrives with the web page and Android).
- **Rationale:** Guideline 4.8 (opened 3 Oct 2026) requires an equivalent privacy-preserving option only when a third-party or social login is offered; offering Apple and email is compliant. Saves a provider, a client id and a test matrix.
- **Owner:** PRD A, security. **Date:** 2026-10-03.

### D-045 Beta cohorts before submission
- **Status:** Recommended (needs founder OK). Proceed: yes.
- **Decision:** C0 internal (founding family, from week 6), then C1 external TestFlight with 15 to 25 friendly families for 3 weeks (from about 16 Dec), then App Store submission. The C2 public TestFlight link (100 to 300 testers) is optional and runs after submission, not before.
- **Rationale:** TDD 07 section 11 wants C2 for 3 weeks before the store, which would move submission into February; C1 covers the coverage list (co-parents, grandparents, Hindi speakers, twins, VoiceOver users). Keeping C2 before submission is the founder's call.
- **Owner:** founder, QA. **Date:** 2026-10-03.

### D-046 Speech model hosting
- **Status:** Recommended; the founder picks the host. Proceed: yes.
- **Decision:** host model files on a zero-egress or free-egress object store (for example a pinned Hugging Face revision mirrored to a zero-egress bucket), versioned URLs, SHA-256 in the manifest; never Supabase egress. Add the host to the data map (no personal data flows there except IP addresses in its logs).
- **Rationale:** about $11k to $12k of egress at 220k installs on Supabase (TDD 03 C-8, TDD 06 P-9).
- **Owner:** founder, AI engineer. **Date:** 2026-10-03.

### D-047 Restore never moves an active plan between accounts
- **Status:** Recommended. Proceed: yes.
- **Decision:** if an App Store `originalTransactionId` is already bound to another account with an active plan, restore does not move it; the app explains and points to support. Otherwise restore binds it to the current account.
- **Rationale:** a shared family iPad would otherwise move Book Plus between parents' accounts silently (TDD 08 4.8, F-14).
- **Owner:** payments engineer. **Date:** 2026-10-03.

### D-048 Billing Grace Period 16 days
- **Status:** Recommended. Proceed: yes. Apple's available lengths are U (TDD 08 4.6); pick 16 if offered.
- **Owner:** founder (App Store Connect). **Date:** 2026-10-03.

### D-049 Purchase consent records
- **Status:** Recommended; counsel confirms. Proceed: yes.
- **Decision:** a `started` row at purchase start and exactly one `completed` row per original transaction, reconciled from the App Store notification (TDD 08 4.2, C-4).
- **Owner:** payments engineer. **Date:** 2026-10-03.

### D-050 Second consent at first family share
- **Status:** Open. Decides: counsel (Lawyer 2 HN-4; PRD 9 Q10; TDD 02 OQ-B12). Needed by the end of week 6 so M6 can include it.
- **Default if unanswered:** no second consent; the sensitive-data consent text already names family sharing. The product supports adding one tap the first time a parent invites family.

---

## Decisions of 3 Oct 2026, second round (these supersede the first-round entries above where they conflict)

## Index rows (add after D-050)

| ID | Decision | Status | Proceed? | Date |
|---|---|---|---|---|
| D-023 | Sync engine v1.0: outbox push plus cursor pull on expo-sqlite and Supabase | **Decided (founder)**; supersedes the "needs founder OK" status | Yes | 2026-10-03 |
| D-051 | Standard over custom: Apple and well-known open-source first; our finishing touches on top | Decided (founder) | Yes | 2026-10-03 |
| D-052 | Quality bar: premium and calm, benchmarked on Airbnb, Calm, Headspace, Day One and Apple; motion and components from proven libraries | Decided (founder) | Yes | 2026-10-03 |
| D-053 | Payments: Apple only, on device (StoreKit 2, Apple's subscription screen, restore and manage sheets, `currentEntitlements`); no server sees purchases; Family Sharing on; $3.99/month with 1 month free, $29.99/year with 2 months free. Plus gates only Read together after 3 free sessions per book, and books for more children | Decided (founder); supersedes D-001's server half | Yes | 2026-10-03 |
| D-054 | Sign-in: Apple, Google and email magic link; passkeys can be added after sign-in; no passwords | Decided (founder); supersedes D-044 | Yes | 2026-10-03 |
| D-055 | Family at launch: co-parent only; contributors and the web page later (database keeps contributors) | Decided (founder); supersedes D-002 | Yes | 2026-10-03 |
| D-056 | Spoken languages at v1.0: English, Hindi, Spanish, Mandarin Chinese, French, Arabic, Portuguese; correct script and punctuation per language; phonetics for taught names; UI in English, ready for localisation | Decided (founder) | Yes | 2026-10-03 |
| D-057 | What the machine may do to words: unchanged constitution; typed text keeps the keyboard's own autocorrect and is never rewritten | Decided (founder) | Yes | 2026-10-03 |
| D-058 | Audio: the original recording is never altered; Apple voice processing at record time and/or open-source noise suppression for a separate listening copy; the original is always playable | Decided (founder) | Yes | 2026-10-03 |
| D-059 | Deferred to v1.1: Hindi-English mode, safety classifier (static "If you are struggling" row ships), word highlight in Read together, family hearing each other's recordings (no audio upload in v1.0), Google Play and Android, web contribution page | Decided (founder); answers D-032 (no shared voice in v1.0) and D-034 (static row) | Yes | 2026-10-03 |
| D-060 | Beta on TestFlight; the store listing never says beta; the in-app "early version, can make mistakes" note stays | Decided (founder); answers D-030 | Yes | 2026-10-03 |
| D-061 | Privacy and trust: letters never doubted as private, never sold, never used for ads or to train models, never used to imitate a voice; said calmly in a few set places and backed by real controls (VOICE.md "How we talk about privacy") | Decided (founder) | Yes | 2026-10-03 |
| D-062 | Analytics: opt-in PostHog plus server aggregates, feeding a self-learning loop (agents read data, write findings, propose backlog items) | Decided (founder); extends D-003 | Yes | 2026-10-03 |
| D-063 | Domains: earlyletters.com primary, earlyletters.app redirects (Porkbun); email through Resend, hello@earlyletters.com live; legal pages /terms, /privacy, /health-privacy, /subprocessors; universal links on https://earlyletters.com; website built in a separate thread on Vercel | Decided (founder); closes D-005 | Yes | 2026-10-03 |
| D-064 | Publisher: individual Apple Developer account | Decided (founder); restates D-004 | Yes | 2026-10-03 |
| D-065 | Lean app: download under 40 MB, measured every release; English pack and font subsets ship; speech models and other language packs download on demand as signed data (guideline 2.5.2); packs deletable in Settings | Decided (founder) | Yes | 2026-10-03 |
| D-066 | Server-driven content inside native screens: prompts, tips, story cards, announcements, remote config, flags and pack manifests as signed, schema-validated blocks with an offline last-good copy; never anything that changes data collection or the paywall | Recommended (founder may override) | Yes | 2026-10-03 |
| D-067 | API quality: p95 latency budget, auth check, idempotency keys and rate limits on every endpoint; content-free logs with request ids; user JWTs only; CDN plus ETag for public config; Supabase RLS and RPCs in one US region; typed contracts in `packages/api` | Decided (founder) | Yes | 2026-10-03 |

## Entry bodies (short form; each cites the brief)

### D-023 (update)
- **Status:** Decided (founder, 3 Oct 2026, brief "D-023 decided as outbox+cursor on Supabase"). ADR 0004 status note: "Superseded for v1.0 by D-023 (founder, 3 Oct 2026). Revisit PowerSync at 10k families or when attachment sync outgrows the simple queue."

### D-053 Payments: Apple only
- **Decision:** brief decision 3. Server entitlement tables from 3 Oct removed (migration 20261004000000); server code never enforces Plus. A co-parent gets Plus through Family Sharing.
- **Copy consequence:** Plus copy lists only what v1.0 gates (rules test `promises only what Plus gates in v1.0`). Terms 14.1 and Subscription Terms must drop "encrypted backup" and "extra themes" before publication (legal owner).
- **Effects:** ADR 0007 status note: "Digital half superseded by ADR 0013 and D-053 (no RevenueCat, no App Store Server Notifications endpoint, no server entitlements)." D-022 notice windows and D-049 consent rows no longer apply to a server we do not have; see DEBATES Q-003.

### D-055 Co-parent only
- **Effects:** store listing, website and story cards promise co-parent writing only; grandparents are "coming in a later update" (rules test blocks grandparent claims in the listing and story cards).

### D-056 Seven languages
- **Effects:** store description names all seven; the listing checklist says to remove any language that slips before submission.

### D-059 Deferrals
- **Effects:** D-032 answered: no audio upload in v1.0. D-034 answered: static support row (Settings home, "If you are struggling"). Copy says recordings stay on the phone and in the person's own iPhone backup (D-033 copy fix done).

### D-060 Beta
- **Effects:** no beta wording in the listing (rules test); `promotionalTextBeta` and the beta paragraph removed.

### D-061 Privacy said calmly
- **Effects:** `en.trust` (promise, short form, voice line, sign-in, first recording, Settings) used word for word across app, listing, website and welcome email (rules test). The microphone purpose string no longer mentions backup or cloud transcription (counsel to confirm privacy labels section 4).

### D-063 Domains
- **Effects:** `packages/brand` `web`, `support`, `email`; bundle id `com.earlyletters.scribe`.

### D-066 Server-driven content
- **Effects:** `packages/content/src/stories.en.ts` is the packaged fallback for `story` blocks (`packages/api/src/content.ts`); the rules test checks it against the block limits.

## Founder decisions list, items now closed
Remove from "Decisions that still need the founder": D-023, D-032, D-030, D-034, D-033 (copy), D-001 tooling. Still open: D-004 hedge, D-045 cohorts (roadmap assumes C1 only), D-031 Hindi script, DEBATES Q-001 to Q-003.

### D-068 Remote config has one source (coordinator, 3 Oct 2026)
- **Decision:** remote config comes from ADR 0016's signed config document only. D-035's database table is superseded and not built.
- **Status:** Decided (coordinator), per pm-5's finding of two mechanisms on paper.

### D-069 At most two parents per book (recommended, 3 Oct 2026)
- **Decision:** the server refuses a third parent, and either parent can see and remove family members.
- **Status:** Recommended. It ships as a server check before any non-founder data exists (pm-2 finding). Founder OK needed.

### D-070 Insights loop agents never push (coordinator, 3 Oct 2026)
- **Decision:** the weekly insights agent writes its report and its proposals into the repo working tree only. The coordinator commits them. This resolves DEBATES Q-007 in favour of COORDINATION.md.
- **Status:** Decided (coordinator).

### D-089 Release engineering model
- **Status:** Decided (founder, 13 Oct 2026; recommended 3 Oct). Ids chosen above D-088 (PR #91).
- **Decision:** ADR 0022. Preview lane (`testflight` profile, `.preview` record) for C0, C1 and every build before freeze, per `docs/release/TESTFLIGHT.md`. Store lane: `release/1.0` cut from `main` at freeze (planned Tue 27 Oct 5:00 AM PT; a move to Tue 3 Nov is proposed), fixes cherry-picked from `develop`; `ios-v1.0.0-rc.<n>` tags build the production profile into the production record's internal TestFlight; the RC that passed FT-39 is submitted (FT-45); `ios-v1.0.0` is pushed after release. One version in `apps/mobile/version.json`; build numbers only from EAS. Store text generated from `packages/content` into `apps/mobile/store.config.json`.
- **Gate (amended 15 Oct, founder):** the store-lane jobs run in the GitHub environment `app-store` (founder as required reviewer, only `ios-v*` tags and `release/*` branches, store secrets held there), with tag and branch rulesets that only admins bypass (ADR 0022 decision 8, FT-20). The 3 Oct design assumed a private repository; it is public.
- **Proposed 17 Oct (coordinator, not decided):** the approver account is the only reviewer of `app-store`, with prevent self-review on and admin bypass off; rulesets have no bypass and only keep `ios-v*`, `db-v*` and `release/*` immutable (ADR 0026 decision 1, Proposed; SR-3 on #206). This takes effect when the founder accepts ADR 0026 decision 1. Until then the 15 Oct gate above stands.
- **Effects:** COORDINATION section 6 and FT-44 (tag the RC before submission; the version tag follows release); runbook `docs/ops/RELEASE.md` (qa-e2e's release train, amended for D-089); record `docs/release/1.0.0.md`; BL-436 to BL-439.
- **Note (24 Oct 2026, docs; the decision text above is unchanged):** `apps/mobile/version.json` arrives with #109 (BL-436), ordered after the go/no-go (`docs/release/AUTOMATION.md:532`). Until #109 merges, the version is `apps/mobile/app.config.ts:162` (`version: '1.0.0'`).

### D-090 Release team
- **Status:** Decided (founder, 13 Oct 2026; recommended 3 Oct).
- **Decision:** a `release` agent (Release Engineer: versions, release records, store metadata as code, the runbook) and `ops` re-chartered as Platform and Reliability Engineer (DevOps and SRE). Defined on the harness branch; until the harness runs, used in interactive sessions by handle under COORDINATION.md. A separate SRE agent after launch, once there are real users and a first Sev 1 or 2 drill.

### D-091 No OTA updates in v1.0
- **Status:** Decided (founder, 13 Oct 2026). Changes the 3 Oct recommendation to ship `expo-updates` in v1.0. Matches section 8 of qa-e2e's release train.
- **Decision:** no `expo-updates` in v1.0. Fixes ship as PATCH builds from the release branch, with expedited review for an S0.
- **Rationale:** v1.0 became on-device only (PR #54) and plans "Data Not Collected" (D-088). An update check on every launch is a new network destination for the data map and a privacy-label question for counsel, three weeks before submission. Revisit for v1.1, when sign-in brings a server anyway.

### D-092 EAS plan
- **Status:** Decided (founder, 13 Oct 2026; matches the cost decisions of 3 Oct).
- **Decision:** EAS Free (15 iOS builds a month; expo.dev/pricing, 3 Oct 2026) until builds would exceed it, then Starter ($19 a month plus usage). A second trigger: Free builds queue at low priority with one concurrent build, so if queue time ever holds up a release candidate, move to Starter for that month.

## Decisions that still need the founder (in priority order)

1. **D-023** Sync engine: outbox plus cursor on expo-sqlite (reverses ADR 0004). v1.1, parked (#54, the on-device v1.0; D-085): v1.0 has no sync.
2. **D-032** Shared voice in v1.0 (family hear each other's recordings, free; full backup stays Plus). v1.1, parked (#54, the on-device v1.0; D-085): v1.0 has no sharing.
3. **D-001 tooling** StoreKit 2 direct versus RevenueCat (ADR 0013). Override window closes when BL-213 starts (about 9 Nov).
4. **D-030** Beta on TestFlight; no beta line in the store listing. Needed before the store listing is written (week 13).
5. **D-004 hedge** Accept the guideline 5.1.1(ix) risk as an individual, or start an entity in parallel. Needed by 27 Nov.
6. **D-045** C1 friendly-family beta only before submission (public link after). Needed by 4 Dec.
7. **D-034** Safety classifier only with a clinician's sign-off by 20 Nov, else a static resources row.
8. **D-033** Free durability through the user's own device backup, and the copy fix.

Also open but not founder-only: D-031 Hindi script (founder, from data, 30 Oct), D-050 second consent (counsel).

## Decisions of 3 Oct 2026, third round (email and brand lane)

The email and brand lane first drafted these as D-051 to D-064 on its own branch, before the second-round entries above were merged. They are renumbered here. Old to new: D-051 to D-071, D-052 to D-072, D-053 to D-073, D-054 to D-074, D-055 to D-075, D-056 to D-076, D-058 to D-077, D-059 to D-078, D-060 to D-079, D-061 to D-080, D-064 to D-081. Three drafts duplicated second-round entries and are folded into them: draft D-057 (co-parent only) is D-055; draft D-062 (Google sign-in at v1.0) is D-054; draft D-063 (Plus on the device) is D-053 as amended by D-080.

Two founder answers given on 3 Oct (evening) change second-round entries. Where they conflict, these newer answers win:
- **D-073** (recordings): encrypted backup of the owner's recordings ships in v1.0. This supersedes the "no audio upload in v1.0" part of D-059 and the copy consequence in D-033. Family members hearing each other's recordings stays in v1.1, as D-059 says.
- **D-080** (subscription status): the app reports subscription status only (plan, trial end, renewal date, cancelled flag). The server can then send the reminder emails that California's auto-renewal law requires. This amends D-053's "no server sees purchases". Apple still processes every payment, and the server never enforces Plus.

| ID | Decision | Status | Proceed? | Date |
|---|---|---|---|---|
| D-071 | Primary mark: logo round 3 `final-a` | Decided (founder, 3 Oct 2026) | Yes | 2026-10-03 |
| D-072 | The brand asset registry is the single source | Decided (founder, 3 Oct 2026) | Yes | 2026-10-03 |
| D-073 | Recordings backup in v1.0; sharing in v1.1 | Decided (founder, 3 Oct 2026) | Yes | 2026-10-03 |
| D-074 | Edit feature name: "Word for word" | Decided (founder, 3 Oct 2026) | Yes | 2026-10-03 |
| D-075 | The website shows the price | Decided (founder, 3 Oct 2026) | Yes | 2026-10-03 |
| D-076 | Brand name only from `packages/brand` | Decided (founder, 3 Oct 2026) | Yes | 2026-10-03 |
| D-077 | Plan display names: Plus Monthly and Plus Annual | Decided (founder, 3 Oct 2026) | Yes | 2026-10-03 |
| D-078 | Website footer line | Decided (founder, 3 Oct 2026) | Yes | 2026-10-03 |
| D-079 | Old logo directions archived | Decided (founder, 3 Oct 2026) | Yes | 2026-10-03 |
| D-080 | The app reports subscription status only, so we can send the auto-renewal reminders | Decided (founder, 3 Oct 2026) | Yes | 2026-10-03 |
| D-081 | Purchase consent records (supersedes D-049) | Decided (founder, 3 Oct 2026) | Yes | 2026-10-03 |
| D-089 | Release engineering model (ADR 0022): preview lane for C0 and C1; store lane from `release/<major>.<minor>` cut at freeze; one version in `apps/mobile/version.json` (note, 24 Oct: after #109; until then `apps/mobile/app.config.ts:162`); EAS build numbers; `ios-v<x.y.z>-rc.<n>` tags build candidates; the tested RC is the binary submitted; `ios-v<x.y.z>` on release; store text generated from `packages/content` | Decided (founder) | Yes | 2026-10-13 |
| D-090 | Release team: a `release` agent plus `ops` as Platform and Reliability Engineer (DevOps and SRE); SRE splits out after launch | Decided (founder) | Yes | 2026-10-13 |
| D-091 | No over-the-air updates (`expo-updates`) in v1.0; fixes ship as PATCH builds; revisit for v1.1 | Decided (founder; changes the 3 Oct recommendation) | Yes | 2026-10-13 |
| D-092 | EAS Free plan until builds would exceed 15 iOS a month, then Starter ($19 a month plus usage) | Decided (founder) | Yes | 2026-10-13 |

### D-071 Primary mark: logo round 3 `final-a`
- **Status:** Decided (founder, 3 Oct 2026).
- **Decision:** the brand mark is r3 `final-a`: two opening quotation marks, one large and one small (0.62 of its size, leaning 14 degrees toward it), with an outlined EB Garamond wordmark; sepia "Leather" app icon tile `#9A613C` to `#7F4F30` with a paper mark, dark tile `#2C2926` to `#1F1B18` with an `#D9A47E` mark. `packages/brand/assets/logo/primary/` is its byte-identical packaged rebuild. It retires round 1 directions a ("envelope e") and b (script mark), round 2, the rest of round 3, the interim Literata email lockup, the serif "E" monogram favicon and avatar, and the "envelope line" brand motif (CREATIVE.md 3).
- **Rationale:** quotation marks say "these are your exact words", the product's promise (CLAUDE.md constitution); the pair reads as parent and child (BRAND_SYSTEM.md 1). The neutral reviews of round 2 finalists shaped the round 3 brief; final-a was then chosen by the founder from the r3 presentation.
- **Evidence:** presentation `docs/brand/logo-r3/early-letters-mark.html`; brief `docs/brand/logo-r3/BRIEF.md`; neutral reviews `docs/brand/logo-r2/neutral-review/` (`final-strategy.md`, `final-parents.md`, `final-culture-production.md`, plus `cold-read.md`, `strategy.md`, `parents.md`, `culture-production.md`); colour and type study `packages/brand/assets/logo/r3/color-type/RECOMMENDATION.md` and `PROPOSED_TOKENS.md`.
- **Alternatives:** r3 `final-b`; round 1 directions a and b; the interim Literata lockup.
- **Owner:** founder; design systems. **Date:** 2026-10-03.
- **Effects:** `docs/brand/BRAND_SYSTEM.md` v1.0; DESIGN_LANGUAGE 2a; CREATIVE 3; EMAIL_IDENTITY v0.2; `accentDeep` and `icon` tokens in `packages/brand` and `@scribe/design-tokens` (parity test); splash spec in PRD A and TDD 01 (CA-042); CONSISTENCY_AUDIT CA-001 to CA-013, CA-040 to CA-044. Trademark clearance of the mark is still open.

### D-072 The brand asset registry is the single source
- **Status:** Decided (founder, 3 Oct 2026).
- **Decision:** every brand asset has one permanent id in `packages/brand/registry.ts` (generated `registry.json` for plain Node), and every touchpoint (app icon, splash, headers, paywall, website, favicon, OG image, email, App Store, book, cards, press kit) is a context that lists the ids it uses. Code resolves files through `assetFor(context)` (or `asset(id)` when no context fits) and never hardcodes a brand file path. Contexts reference only `primary` assets; retired files are `deprecated` with `supersededBy`.
- **Rationale:** the audit found rejected directions wired into the website and email because files were picked by path (CA-001, CA-008, CA-010).
- **Owner:** design systems. **Date:** 2026-10-03.
- **Effects:** `packages/brand/test/registry.test.ts`; BRAND_SYSTEM.md 2; `packages/emails` header and layout sizes; `apps/web` asset sync.

### D-073 Recordings backup in v1.0; sharing in v1.1
- **Status:** Decided (founder, evening of 3 Oct 2026). Supersedes D-032; answers CONSISTENCY_AUDIT F-2.
- **Decision:** encrypted backup of recordings ships in v1.0. Family members hearing each other's recordings (sharing) is v1.1, consistent with Brief decision 9.
- **Consequences:** copy must not promise family listening in v1.0 (CA-026: website and microphone purpose string). Plus scope, privacy pages and the mic string follow from this; the content and legal lanes own those edits.
- **Owner:** founder; backend, content, legal. **Date:** 2026-10-03.

### D-074 Edit feature name: "Word for word"
- **Status:** Decided (founder, evening of 3 Oct 2026). Answers CONSISTENCY_AUDIT F-3.
- **Decision:** the feature is named "Word for word". "Lightly tidied", "Tidying" and other words that suggest software tidied a letter leave the product (VOICE.md).
- **Effects:** content lane renames the strings listed in CA-027 and updates the glossary row "What the machine changes".
- **Owner:** founder; content. **Date:** 2026-10-03.

### D-075 The website shows the price
- **Status:** Decided (founder, evening of 3 Oct 2026). Answers CONSISTENCY_AUDIT F-4.
- **Decision:** the website shows the Plus price from Brief decision 3 ($3.99 a month with a 1-month free trial; $29.99 a year with a 2-month free trial) instead of stripping `{price}`.
- **Effects:** CA-029: `apps/web/src/lib/fill.ts` and `packages/content/BRAND.md` (web and content lanes).
- **Owner:** founder; web, content. **Date:** 2026-10-03.

### D-076 Brand name only from `packages/brand`
- **Status:** Decided (founder, evening of 3 Oct 2026). Answers CONSISTENCY_AUDIT F-6.
- **Decision:** CLAUDE.md stands: the public name lives only in `packages/brand/index.ts`. `packages/content` imports `brand` and builds strings with template literals (for example `` `${brand.name}, the baby memory book you fill by talking.` ``); no copy file types the name.
- **Effects:** CA-035 (about 79 literals in `packages/content/src`).
- **Owner:** founder; content. **Date:** 2026-10-03.

### D-077 Plan display names: Plus Monthly and Plus Annual
- **Status:** Recommended (coordinator default; answers CONSISTENCY_AUDIT F-5). Proceed: yes.
- **Decision:** App Store Connect display names are exactly "Plus Monthly" and "Plus Annual", matching the subscription terms; copy says "Plus" (CA-030).
- **Owner:** founder (App Store Connect); content. **Date:** 2026-10-03.

### D-078 Website footer line
- **Status:** Recommended (coordinator default; answers CONSISTENCY_AUDIT F-7). Proceed: yes.
- **Decision:** the website footer reads "(c) 2026 Early Letters", with the name from `brand.name`. ASCII "(c)", not the copyright sign: the content rules test (`packages/content/test/rules.test.ts`) rejects any `\p{Extended_Pictographic}` character, and U+00A9 is one. The individual publisher's legal name appears only inside the legal pages (D-004). Email footers keep no copyright line (EMAIL_IDENTITY 5.2).
- **Owner:** web; content. **Date:** 2026-10-03.

### D-079 Old logo directions archived
- **Status:** Recommended (coordinator default; answers CONSISTENCY_AUDIT F-8). Proceed: yes.
- **Decision:** round 1 directions a and b, round 2, round 3 (except what `primary/` rebuilds), the interim email lockup and the E monogram stay in the repo as history, registered `deprecated.*` in the registry, and are not deleted. Nothing may use, copy or link them (D-072).
- **Owner:** design systems. **Date:** 2026-10-03.

### D-080 The app reports subscription status only, so we can send the auto-renewal reminders
- **Status:** Decided (founder, 3 Oct 2026, 19:30 UTC). Narrows Brief decision 3 (`docs/agents/BRIEF-2026-10-03.md`); amends D-001 (server side), D-022 (data source), D-049 (consent source) and D-012 (co-parent coverage).
- **Decision:** the app reports subscription **status only** to our server: the plan, the trial end date, the renewal date and a cancelled (renewal off) flag. It reports when a purchase or trial completes in the app and on each launch, read on the device from StoreKit 2. It never reports payment or card data and never sends receipts. Purpose: to send the reminder emails California's auto-renewal law (Bus. & Prof. Code 17602) requires and Terms 14.6 promises. Everything else in Brief decision 3 stands: Apple still processes payments, Apple's own subscription UI, restore and manage sheets; no RevenueCat; no App Store Server Notifications endpoint; server code does not enforce Plus. A co-parent gets Plus only through Apple Family Sharing (same Apple family); otherwise each co-parent's Plus is their own (Terms 14.12).
- **Rules that follow (content and legal lanes, 3 Oct 2026):** only a device whose transaction is the person's own purchase reports, so Family Sharing members get no billing email; a cancellation made in iOS Settings is seen on the next app open, so every reminder says "If you have already cancelled, there is nothing to do."; the status is deleted with the account; no purchase records are kept; `{price}` in emails is the published price of the reported plan (US only); a price increase cannot be seen from the status, so the `price-increase` email stays later and Apple's opt-in consent mode is the only one used (LGL-19).
- **Rationale:** without any server signal the D-022 emails had no trigger, and Terms 14.6 and the Subscription Terms promised reminders the system could not send (LGL-01). Status only is the smallest data flow that keeps that promise.
- **Alternatives:** Option B, in-app local notifications only and no billing email (counsel unsure it meets 17602 and other states); App Store Server Notifications (rejected by Brief 3); RevenueCat (rejected by Brief 3).
- **Owner:** founder; payments engineer (status report and scheduler), content and legal (copy). **Date:** 2026-10-03.
- **Effects:** `docs/emails/CATALOG.md` section 7 un-parked with this trigger; `docs/emails/COMPLIANCE.md` 5.2 and 5.5; `packages/content/src/emails/billing.en.ts` header and reminders; Privacy Policy 1.5.0 (sections 3, 5, 10, 15), Terms 1.6.0 (14.3, 14.4, 14.6, 14.12), Subscription Terms 1.4.0, subprocessor page 1.4.0 (Apple row); `docs/legal/COUNSEL_PACKET.md` (counsel questions, including 17602(a)(6) proof of consent). Engineering, outside these lanes: a small status table and an authenticated, idempotent report endpoint in `packages/api`; the D-022 scheduler reads it; D-001 and D-049 text still describe ASSN and need a superseding edit by the PM lane.

### D-081 Purchase consent records (supersedes D-049)
- **Status:** Recommended; counsel confirms (docs/legal/COUNSEL_PACKET.md). Proceed: yes.
- **Decision:** when a purchase or trial completes in the app, the first D-080 status report also carries the consent facts: product, offer type, the Subscription Terms version shown, and the time. One record per original purchase, kept for the life of the account plus 3 years (Privacy Policy section 10), pseudonymised at account deletion. No receipt, payment data or transaction id in clear.
- **Rationale:** D-049 reconciled consent rows from App Store notifications, which D-053 removes; Cal. Bus. & Prof. Code 17602(a)(6) still asks for proof of consent (legal review LGL-04).
- **Owner:** payments engineer; counsel. **Date:** 2026-10-03.
- **Effects:** Terms 14.3 currently says only "the date your plan started"; if this entry is confirmed, the content lane widens it to "what you agreed to and when".

---


## Decisions of 4 Oct 2026 (founder direction and delegated calls)

Two kinds of entry. **Founder** entries record what the founder said in this session. **Delegated** entries were decided by the CTO on the founder's instruction of 4 Oct ("Decide right answer on my behalf that are standard for industry apps"), taking the recommendation of the debate document named in each entry. The founder can reverse any delegated entry; say so and it is reopened. Counsel and Apple sign-off are not delegated and are stated where they apply.

### D-082 Plus membership: first 2 letters free, then Plus (founder)
- **Status:** Decided by the founder, 4 Oct. (Drafted earlier as D-051 and D-052 on `main`; those ids mean other decisions on `develop`, so this is the id that stands.)
- **Decision:** Plus is a membership. The first 2 letters per account are free; after that, adding letters needs Plus. Existing letters always stay readable, playable and exportable. One membership covers the book. Prices as the founder finalised them: **$4.99 a month with a 1 month free trial, or $49.99 a year with a 2 month free trial.** The yearly plan is about ten months' price for twelve months of access (12 x $4.99 = $59.88; $59.88 - $49.99 = $9.89 less than paying monthly for a year). Apple in-app purchase only. Offer codes come from Apple (no code system of our own). Family Sharing on.
- **Supersedes:** the "Read together after 3 free sessions" rule of D-053 and the "free, always" copy and the earlier Plus prices ($3.99 a month, $29.99 a year) in D-012, D-053 and the website price decision, which stay in the record as history. Wherever those older entries disagree with the prices above, D-082 stands.
- **Owner:** payments engineer. **Effects:** plan engine, Plan and gate screens, copy, legal (Terms, Subscription Terms), website.

### D-083 Open edges of the membership model (delegated; debate Q-013 pricing-membership-engine)
- **Decision:** a letter counts when it is kept (spoken or typed, in the Book or private, including a voice letter kept without words). Drafts, abandoned takes, quiet-day marks, edits, undo and restore do not count. A deleted letter still counts. One pool of 2 free letters across all books, so a second child needs no extra gate. Read together is free for letters that exist; membership gates adding. Erase everything resets the free count. After Plus starts, the person taps Keep on each held letter. A birthday letter is not free beyond the allowance. The count is held on the device (Keychain, mirrored in the database) so a reinstall does not reset it; counsel confirms this is acceptable.
- **Equal display** of monthly and annual in Apple's subscription view, neither preselected. US storefront only at launch. No price, "free trial" or "we will email you" in app copy.
- **Needs outside sign-off:** counsel (Keychain count, trial and renewal wording); App Review note for guideline 3.1.2(a).

### D-084 Quiet-day marks carry no sentence (delegated; debate Q-013 quiet-day-machine-words)
- **Decision:** "Not much today" stores a mark with no text. The Book shows "A quiet day" with the date, unsigned. The old sentence is removed and blanked in existing rows. Quiet days never count toward the free letters and never appear in the printed book or Read together. "Nobody spoke" keeps an app note that is small, muted and unsigned: "No words in this one. The recording is kept just as it is." A recording with no words counts as a letter when kept. The "Dear {child}," ghost placeholder is removed. "Add a few words" after the tap waits for v1.1.
- **Why:** the constitution. Every word the Book shows was said by a person.
- **Update 24 Oct 2026:** superseded on this point by D-103: a recording with no words is kept, but it counts only once its words exist and are kept from Review.

### D-085 Delete, recovery and backup in v1.0 (delegated; debate Q-014 data-lifecycle-delete-backup)
- **Decision:** deleting a letter asks first, then moves it to a Recently deleted shelf for 30 days, with Restore and Erase now; the purge removes the file, then the row. Recordings stay in the iPhone backup always. The launch sweep checks that a recovered take plays. Settings shows "Last export" and a plain nudge to save a copy in Files or iCloud Drive.
- **Amends D-073 for v1.0:** backup through our own service needs sign-in and a server, which v1.0 does not have. v1.0 relies on the person's own iPhone or iCloud backup plus Export, and says so honestly. Backup claims come out of the store listing, website and Plus copy until it ships. An in-app scheduled export to Files stays an option for v1.0.x or v1.1.
- **Needs outside sign-off:** counsel on the 30 day shelf wording; the kill and restore drills on a real iPhone (founder holds the phones).

### D-086 Words for the app's edits (delegated; debate Q-013 edit-trust-and-words)
- **Decision:** the feature is called "Word for word". The app takes out stray sounds, repeats and restarts, fixes a misheard name, adds punctuation, and marks every small fix; each can be tapped and put back. Show the count as a plain sentence. "Exactly as said" is one tap and reversible, with a Settings switch for the default. Typed text is never touched (D-057). Words that arrive later arrive "Exactly as said" and are never fixed unread. Remove "Lightly tidied" and "Tidying" everywhere. Remove "Does this sound like you?" from Review for v1.0.
- Other languages: native-speaker translation, never machine rewriting.

### D-087 First run, setup and permissions (delegated; debate Q-015 first-run-setup-defaults)
- **Decision:** the birth date is required with no default, and the app reads the age back. Name, date and signature are editable in Settings; saved letters, their dates and their signatures never change. A due date becomes a birthday through a gentle card shown at most twice. The speech model downloads only after an explicit "Download on Wi-Fi" or "Not now", with the size shown. Deep links are an allowlist and nothing starts recording from a link. The screen stays awake only while recording and while Read together plays. Helplines keep the US list with a clear scope line; the 988 language line is added only after a primary-source check. Hide "I was invited" and the disabled "Family can read" switch in v1.0; keep the Family tab, its Settings row and the link landing. "Tell me when it's here" stays, and says only what is true.

### D-088 In-app feedback (delegated; debate Q-016 in-app-feedback)
- **Decision:** v1.0 submission keeps "Data Not Collected" and uses the Help email row, with a content-free block (version, build, screen) added to the email. The feedback form is built behind a build switch and ships only after counsel signs the text and the founder accepts the label change to Data Collected. Text and screenshots are read by people; agents triage on structure only (screen, category, version, severity, owner) and never contact the reporter. Screenshots are taken at the tap, attached only after a preview with Remove, allowed only on settings and error screens, and travel by email, never into GitHub. The person is identified by a resettable random install id plus an optional email; never IDFA, IDFV or the analytics id. Issues live in a private repo with a machine identity (founder task). Retention: text 90 days after closing, screenshots 30.
- **Needs outside sign-off:** counsel; creation of the private repo and mailbox (founder).

## Decisions of 15 Oct 2026 (delegated by founder)

The founder delegated these calls to the coordinator on 15 Oct. Each is marked "delegated by founder" and can be reversed by the founder; say so and it is reopened. Ids start after D-092, the highest on PR #108. Counsel and Apple sign-off are not delegated and are stated where they apply. Implementation PRs are named in each entry.

### D-093 The 13 Oct integration branch is never merged (delegated by founder)
- **Status:** Decided, 15 Oct 2026 (delegated by founder).
- **Decision:** `auto/2026-10-13-integration` (the Line B fix wave merged onto the 4 Oct `develop`) is never merged. Line B's fixes reach `develop` one concern per PR, as mapped in `docs/agents/PORT_MAP_2026-10-13.md` (PR #117). The release runbook `docs/ops/RELEASE.md` lands through PR #111 (now targeting `develop`, adapted to the on-device v1.0), and the device test plan rows through their own PR (#123). The branch is kept, not deleted, so parked code can be reused.

### D-094 Plan reminders and the purchase confirmation ship in v1.0, as a courtesy (delegated by founder)
- **Status:** Decided, 15 Oct 2026 (delegated by founder). Needs counsel: COUNSEL_PACKET C-1 to C-3 (on `develop`) and Q37 (added by PR #81).
- **Decision:** v1.0 ships on-device plan reminders (local notifications in the Q-003 windows, purchaser's phones only, never through Family Sharing) and, after a new purchase, a confirmation of what was agreed with "Save a copy". They follow D-083: no price, "free trial", "free months" or "we will email you" in app copy; Apple's sheet shows the amount and Apple's receipt holds it. Reminders are a courtesy, not a guaranteed delivery: the app and the Subscription Terms say they can come late or not at all, and that Settings, Plan and Apple's receipts hold every date.
- **Effects:** PR #121 (port of G-15). Subscription Terms must describe reminders as a courtesy: requested on PR #81 (its 3.0.0 text does not say so yet). Device test plan row S2-17 (PR #123).

### D-095 No analytics SDK or consent sheet in v1.0 (delegated by founder)
- **Status:** Decided, 15 Oct 2026 (delegated by founder). Confirms D-088's "Data Not Collected" and changes the v1.0 part of the 3 Oct analytics decision (opt-in PostHog): it returns, with consent, in v1.1.
- **Decision:** a build switch, `EXPO_PUBLIC_ANALYTICS`, off in every v1.0 profile. Off: no consent sheet, no usage switch in Settings, Privacy, no PostHog client even if a key is set, and analytics never starts. `packages/analytics` stays.
- **Effects:** PR #118. The App Store privacy label stays "Data Not Collected".

### D-096 The export carries the consent choices on this phone (delegated by founder)
- **Status:** Decided, 15 Oct 2026 (delegated by founder).
- **Decision:** the export (schema 1.1.0) adds `consent_on_this_phone` to `account.json`: the 18+ answer and the usage-sharing choice. No server consent history in v1.0, because there is no server; a later version adds it as its own field.
- **Effects:** PR #120 (phone part of G-19, LEGAL-REQ-034).

### D-097 Pack and model host: packs.earlyletters.app on Cloudflare R2 (delegated by founder; DEBATES Q-001)
- **Status:** Decided, 15 Oct 2026 (delegated by founder). Takes Q-001 option (b).
- **Decision:** one hostname, `packs.earlyletters.app`, serves both language packs and speech models from Cloudflare R2. DNS for `earlyletters.com` stays where it is, so email DNS does not move.
- **Effects (follow-up, not yet done):** set `EXPO_PUBLIC_DOCS_BASE_URL` for the build profiles; `apps/mobile/src/lib/models/catalog.ts` still names `models.earlyletters.com` (`SELF_HOST_BASE`) and moves to the new host; ADR 0016 and `docs/ops/MODEL_HOSTING.md` (PR #35) name it; the founder creates the R2 bucket and the `.app` DNS record (account steps).

### D-098 Minimum iOS 17 (delegated by founder; DEBATES Q-002)
- **Status:** Decided, 15 Oct 2026 (delegated by founder).
- **Decision:** the lowest supported version is iOS 17, because Apple's subscription store view (the Plus sheet) needs it.
- **Effects (follow-up, not yet done):** set the iOS deployment target to 17.0 in the app config; the store listing and Help say iOS 17 or later; the "needs iOS 17" fallbacks in billing copy stay for safety.

### D-099 Keep the two-parent cap, effective with v1.1 sharing (delegated by founder; confirms D-069)
- **Status:** Decided, 15 Oct 2026 (delegated by founder). Turns D-069 from "Recommended" into decided.
- **Decision:** at most two parents per book, enforced by the server, and either parent can see and remove family members. It takes effect with co-parent sharing in v1.1. v1.0 has no sharing, so nothing changes in v1.0.
- **Effects:** the server check and SCCAP (`parents_full`) are parked for v1.1 with G-02 and G-17 (`docs/backlog/future/06-coparent-sharing-v1-1.md` section 5, PR #117).

## Decisions of 13 and 14 Oct 2026 (founder, in the PRD V2 session)

The founder gave D-100 to D-103 in the PRD V2 session (`docs/prd/v2/_AUTHORING.md` section 3b, M14 to M17). D-104 lists three delivery defaults that are proposed, not decided: they take effect only when the founder confirms them, in this PR or in writing. Counsel and Apple sign-off are never delegated.

Renumbered on 15 Oct 2026 by the merge train: these six entries were drafted as D-089 to D-094 (PR #128), but PR #108 had already recorded the release-engineering decisions as D-089 to D-092 and PR #122 the 15 Oct delegated calls as D-093 to D-099, so they are D-100 to D-105 here (old to new: D-089 to D-100, D-090 to D-101, D-091 to D-102, D-092 to D-103, D-093 to D-104, D-094 to D-105). The text is unchanged; only the ids and their cross-references moved. D-106 to D-108 were added on the same day.

| ID | Decision | Status | Proceed? | Date |
|---|---|---|---|---|
| D-100 | Server features are on in v1.0: sign-in, sync, co-parent sharing, encrypted recording backup, status report and reminder emails | Decided (founder, 13 Oct 2026; confirmed 15 Oct) | Yes, after the security gate | 2026-10-13 |
| D-101 | Keep the full v1.0 scope and move the date; the plan of record is PRD V2 `08-delivery.md` | Decided (founder, 13 Oct 2026) | Yes | 2026-10-13 |
| D-102 | Recording backup keys are recoverable through server escrow, and the copy says so | Decided (founder, 13 Oct 2026) | Yes | 2026-10-13 |
| D-103 | A free letter counts only when it is your own letter, its words exist, and you keep it from Review | Decided (founder, 13 Oct 2026) | Yes | 2026-10-13 |
| D-104 | Three delivery defaults: low-risk merges by the coordinator, free backup, voice-only counting | Item 1 replaced by D-107 (15 Oct 2026); item 2 decided (D-111, 17 Oct 2026); item 3 proposed | Item 2 yes | 2026-10-14 |
| D-105 | PRD V2 is the product spec of record once PR #124 merges | Decided (founder, 3 and 13 Oct 2026) | Yes, on merge | 2026-10-14 |
| D-106 | Alpha in two weeks: option B ships as a TestFlight alpha against staging, target Thu 29 Oct 2026; submission re-planned after the alpha; review delegation widened to app code | Decided (founder, build thread, 15 Oct 2026); the delegation widening is proposed by the coordinator and awaits the founder's confirmation | Yes for the alpha; the delegation waits | 2026-10-15 |
| D-107 | Merge delegation widened: the coordinator merges app code, docs and tests into `develop` after two independent reviews and green CI; database, auth, payments, release configuration, the engine files and production deploys stay founder merges | Decided (founder, 15 Oct 2026); the founder-only merge list is superseded in part by D-117 (23 Oct 2026) | Yes | 2026-10-15 |
| D-108 | Backup recovery: a device enrolled for at least 7 days approves a restore request; F08-REQ-034 amended to the backup server as built (ten functions, nine settings) | Decided (founder, 15 Oct 2026) | Yes | 2026-10-15 |
| D-109 | Experience pass calls F2 to F8 (PR #170 section 7): lamp gradient allowed, app.welcome lockup, welcome-first order held for counsel, Declared Age Range owner, Plus display names, server surfaces in v1.0, typed letters skip Review | Delegated call by the coordinator (founder may reverse) | Yes, except F4 (held) | 2026-10-16 |
| D-110 | Lamp contrast (PR #170 P1, PR #192): the everyday text colours hold 4.5:1 everywhere at every lamp tone's peak; the status colours hold 4.5:1 where text sits and never sit on the gate's or Read together's lit paper; tests over three phone sizes | Delegated call by the coordinator (founder may reverse) | Yes | 2026-10-16 |
| D-111 | Alpha calls resolved, 17 Oct: fictional family only on main, Vercel previews off, D-097 domains, English-only transcription, kill test on the runner with a Mac fallback, D-104 item 2 confirmed, erasure records kept until the book or account is deleted, the R-17 calls on #140, held-draft sync on in build 2, the first keep's transcript stands, promise copy to 71 words with the acceptance line at about 70, the name field stays in view (480 pt) | Decided (founder, 17 Oct 2026); counsel items open; item 1 is superseded in part by D-118 (27/28 Oct 2026), for `apps/web/src/content/site.ts` only | Yes, except items 7 and 13 (counsel) | 2026-10-17 |
| D-112 | Engine 6 open calls (PR #179 review): the D14 character rule stays as built for the alpha (WP-F06-05 after, narrowing `NUMBER_DASH`); `commonWords` kept minus mason, carter, cooper, hunter, rowan; "mm" offered in Review, never removed (F06-REQ-010 one-line amendment pending); kinship rule 4 confirmed as built | Delegated call by the coordinator (founder may reverse) | Yes | 2026-10-23 |
| D-113 | Co-parent build 2 calls (PR #184 review): Leave is hidden in build 2 (no Leave row; `/invite/leave` shows coming soon) because a book a phone leaves is not listed anywhere yet; left books are listed under "Letters to {child}" with read, export and delete before build 3 (BL-444); the invite share text keeps the child's name, because the parent writes and sends it, while the server's peek never reveals the name before joining | Delegated call by the coordinator (founder may reverse) | Yes | 2026-10-23 |
| D-114 | Database budgets (#215): pull requests run the deterministic plan and named-index checks at 250 families x 400 letters; the p95 budgets run on the nightly only, at 1,000 x 400 (`PERF_BUDGETS=1`); a nightly red from a missed budget alone is advisory and does not fail B2-22 until the budgets get their own workflow with one retry; until AF-05 the plan checks on every pull request are the guard | Delegated call by the coordinator (founder may reverse) | Yes | 2026-10-23 |
| D-115 | Pack release (#162): an English-only pack release is a build 1 prerequisite, because the app gets the speech model only from the signed manifest on the D-097 host; the founder runs the key ceremony (`keygen.mjs`, then `--backup`), `release`, `upload` and `verify` on one computer; `release` defaults to `--languages en`; a non-English pack ships only when a native reviewer and the founder say so; the alpha's language picker gate in the app is S12 | Delegated call by the coordinator (founder may reverse) | Yes | 2026-10-23 |
| D-116 | Former members' letters survive the book purge (#248): when the remaining parent deletes the book or their account, the letters, held drafts and recording backups of someone who left or whose join was undone stay theirs; the book row stays tombstoned (`purged_at`) with the name and dates for the kept letters' labels, readable by no app role until BL-444 serves it to kept authors only, and goes once nothing of theirs is left; undo no longer deletes the removed parent's held drafts on the server | Delegated call by the coordinator (founder may reverse) | Yes | 2026-10-23 |
| D-117 | Blanket approval, in the founder's words only: "Everything is approved. Don't keep asking me to approve things. I give you a blanket approval." The coordinator's operating rule under it (merging the founder-only path classes after two independent passing reviews on the current head and green CI) is recorded separately in the entry and is not the founder's words | Decided (founder, 23 Oct 2026); operating rule by the coordinator (founder may reverse) | Yes | 2026-10-23 |
| D-118 | The website names the founder's child by the child's first name for now. Only `apps/web/src/content/site.ts` may carry it, enforced by one narrow exception in both copies of the real-family guard. Tests, fixtures, docs, `packages/content` and the mobile app keep the fictional family "Asha". Supersedes D-111 item 1 for that one file, and reverses F21-REQ-017 for it (the requirement change is proposed, for the founder or its owner to make) | Decided by the founder, 27 Oct 2026 (Pacific; 28 Oct UTC); scope, guard design and wording by the coordinator | Yes | 2026-10-27 |
| D-119 | Logo round 4: the approved mark (D-071) stays the primary and the two-tone version (B) is the alternate. The website header carries the approved lockup (#301, a production deploy the founder merges). Options C and D are rejected. Picked on the founder's delegation | Delegated call by the design lead (founder may reverse) | Yes | 2026-10-27 |
| D-120 | Build 2 invites are link-only: the phone shares and opens invite links and makes, shows and reads no typed code, because the code's HMAC needs a pepper that only the Edge Functions hold, no client calls `invite-redeem` and no route registers a code. F11-REQ-001 (Show code), F11-REQ-002 (the 8-character code), F11-REQ-007 (redeem by code through `invite-redeem`) and A-REQ-029 (the code field) stay unmet on the phone in build 2. PR #306 (`invite_redeem_by_code`) is held, not merged into the alpha queue, until a code-registration route and an S04 client exist (BL-445). Its two lens reviews, at f54b6f2, are recorded in the coordinator's hold comment (issuecomment-6460527733), not posted as GitHub reviews; its head later moved to fc67104, which is unreviewed | Delegated call by the coordinator (founder may reverse) | Yes | 2026-10-27 |
| D-121 | Release sooner by staging: the first store build ships on-device only (server features, backup, status report and analytics off, English only, Plus on), submission targeted Tue 1 Dec 2026. Every feature in the full scope stays in the plan and ships in later 1.0.x releases behind the existing flags, in a fixed order, each with a gate. Amends D-100, D-101, M14 and M15 for the first binary only | Decided (coordinator on the founder's delegation, 28 Oct 2026; founder may reverse) | Yes for the plan; the `production` flag change waits for the freeze rule | 2026-10-28 |
| D-122 | Repository stance: add an All rights reserved `LICENSE`, no open-source licence, outside pull requests limited to collaborators, new design-level detail goes to a private repository, the repository stays public for now (macOS CI cost and ADR 0022 assume public). Planning documents never ship in the app or the website, and a guard script checks it | Decided (coordinator with the CTO analysis, on the founder's delegation, 28 Oct 2026; founder may reverse) | Yes | 2026-10-28 |
| D-123 | Requirement rules RR-1 to RR-13 adopted with changes: ratchet instead of blocking checks, no mass demotion of P0 before the go/no-go (Mon 9 Nov, D-130), claim registry and per-language device runs deferred, the support-reply promise held as a question | Decided (coordinator with the CTO analysis, on the founder's delegation, 28 Oct 2026) | Yes | 2026-10-28 |
| D-124 | Open-question sweep: alpha freeze Tue 3 Nov and go/no-go Mon 9 Nov (D-130) confirmed; the two-parent cap takes effect when co-parent sharing first ships; in-app analytics stays off for the whole 1.0 line; #127 is superseded by D-100 and D-121; D-111 item 6 (backup is free) stands | Decided (coordinator on the founder's delegation, 28 Oct 2026; founder may reverse) | Yes | 2026-10-28 |
| D-125 | Rulings on the remaining open questions: DR-19 option A; DR-01 unlock order; DR-21 as written with a minimum sample; DR-15 A; the merge-delegation record (DR-20 and 08 section 6.2 superseded); the entity gate for the production App Store record; the counsel questions that gate the first binary; the store listing holds "exactly as you said it" until counsel clears it | Decided (coordinator on the founder's delegation, 28 Oct 2026; founder may reverse). Counsel and Apple sign-off are not delegated | Yes for the plan | 2026-10-28 |
| D-126 | The store build shows no "coming soon" co-parent surface while server features are off: the Family tab, the Settings row and the invite screens are hidden by the existing capability switch. Alpha build 2 (`preview`, servers on) keeps the current screens; build 1 (`testflight`, servers off) would hide them too, once the change lands | Decided (coordinator on the founder's delegation, 28 Oct 2026; founder may reverse) | Yes for the plan; the code change waits for the go/no-go (Mon 9 Nov, D-130) | 2026-10-28 |
| D-127 | The founder's words, the only founder words in this entry: "Use an open source version. Why pay for things that good open source versions exist." The coordinator reads them as: the agent harness gets no paid inference. The coordinator's operating rule under that reading (the GitHub-hosted harness stays off, `AGENTS_ENABLED` unset; agent work continues from the coordinator session; a zero-cost open-weight route is tried only after the go/no-go and only if it needs no payment card) is recorded in the entry and is not the founder's words | Decided (founder, 30 Oct 2026); operating rule by the coordinator (founder may reverse) | Yes | 2026-10-30 |
| D-128 | Build 2: Settings > Privacy's "Sync and family sharing" row shows On or Off for a signed-in person (BL-485 option (b)); the withdrawal control and its server function are built before any friend outside the family signs in. | Decided (founder: the choice); detail by the coordinator (founder may reverse) | Yes | 2026-10-30 |
| D-129 | The Delete account row is hidden in both alpha builds unless the build is explicitly switched on (`EXPO_PUBLIC_ACCOUNT_DELETION`). It is switched on only if the purge worker runs on staging and the sole-parent drill (S1-35, S2-13, AL-07.6a, on a development client or a build with the switch on, against staging) passes by Mon 2 Nov noon PT; otherwise the row stays hidden through the go/no-go | Decided (founder: the choice); detail by the coordinator (founder may reverse) | Yes | 2026-10-30 |
| D-130 | Dates: the build 2 freeze is Tue 3 Nov 2026 and the go/no-go is Mon 9 Nov 2026 (the founder's two dates). The freeze hour, 5:00 AM PT (13:00 UTC), is the coordinator's (`docs/agents/BOARD.md`), not the founder's. Supersedes the Thu 5 Nov go/no-go in D-123 and D-124 (PR #340, merged in 46a75a3) | Decided (founder: the two dates); the hour by the coordinator | Yes | 2026-10-30 |
| D-131 | Countries blocked at sign-up and on the web contribution page: North Korea, Iran, Cuba, Syria, Russia, Belarus, and Crimea, Sevastopol, Donetsk and Luhansk (web page only). Any sanctioned country is blocked totally; other countries are blocked when offering the app there exposes the founder to sanctions or export-control risk | Decided (founder: the rule); the country list by the Chief Compliance Officer (founder may reverse) | Yes | 2026-10-31 |
| D-132 | Merge decisions go to the CTO (Karma), not the founder. Karma merges under the existing gates (two independent counted reviews on the head and green CI, D-107, D-117); `docs/legal/**`, and founder-only matters other than the merge itself (money, accounts, promises, applying migrations), stay his | Decided (founder: the delegation); gates and limits by Karma (founder may reverse) | Yes | 2026-10-31 |
| D-133 | Notes ship in v1.0 and a kept note counts toward the free letters like a letter. The public promise says only what is true ("It stays in your words. Every change is marked, and your original recording is kept unchanged.") on the website, its emails, the store listing and the store build's first run; the alpha keeps its headline | Decided (founder: both answers); the wording and the build effects by Karma (founder may reverse) | Yes | 2026-10-31 |
| D-134 | Early Letters is published by the founder's individual Apple Developer account; no LLC for now. The production App ID `com.earlyletters.scribe` and its app record are created under it. Closes D-125 item 6 and counsel packet Q1's entity question for 1.0 | Decided (founder, 31 Oct 2026) | Yes | 2026-10-31 |
| D-135 | Founder hand-offs that only save, file or forward something go by email to earlyletters@gmail.com, recorded with a UTC timestamp in the Project doc `infra/founder-handoffs.md`, instead of a question to him. Karma and the harness are kept informed through this entry and Karma's skill | Decided (founder: the rule); limits by Karma (founder may reverse) | Yes | 2026-11-01 |
| D-136 | The Privacy Policy says that sign-up uses the request's IP address to work out the country, refuses sign-up from the D-131 places, and does not store the IP for this (only daily counts by result, with the country code for refusals only). Takes effect when the check ships. The Chief Legal Officer drafts; Karma updates the docs | Decided (founder: the disclosure); text by the Chief Legal Officer, counsel must confirm | Yes | 2026-11-01 |
| D-137 | No screening of names against OFAC or other restricted-party lists in v1.0 and its 1.0.x releases. The controls are the Terms 2.4 confirmation, the D-131 country block, the US-only storefront and a check on escalation with a match runbook. OFAC liability is strict, so this lowers cost, not exposure. Counsel confirms (COUNSEL_PACKET Q57) | Decided by the Chief Compliance Officer, Chief Legal Officer and Karma under the founder's delegation (founder may reverse); counsel must confirm | Yes | 2026-11-01 |

### D-100 Server features are on in v1.0 (founder)
- **Status:** Decided by the founder, 13 Oct 2026, from options offered (on-device only; server on; on-device plus an anonymous status endpoint). PRD V2 M14.
- **Status, 15 Oct 2026:** Confirmed by the founder in the build thread, 15 Oct 2026 (chose B: server features on, date moves); the on-device-only assumption behind D-085 to D-088, D-095 and #118 is superseded where they conflict; the exact submission date (mid-January or May 2027) is still open.
- **Decision:** the release build profiles set `EXPO_PUBLIC_SERVER_FEATURES=on`. Sign-in, sync, co-parent sharing (at most two parents, D-069), encrypted backup of the owner's recordings (D-073) and the subscription status report with reminder emails (D-080) ship in v1.0. The switch in `apps/mobile/src/lib/capabilities.ts` stays as the kill path.
- **Reverses:** commit c1764f9 ("v1.0 on-device only"). **Amends:** D-085 (its "amends D-073 for v1.0" clause no longer applies; backup ships), D-087 (show "I was invited" again; the Family tab is live), D-088 (the "Data Not Collected" privacy label is no longer true once accounts exist; privacy label 1.4.0 is drafted with counsel).
- **Gate:** nobody outside the family signs in before BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322 and BL-349 merge and pass one shared security review (PRD V2 09 R-17). Migrations are applied to staging, then production, through CI. Legal pages describing a server product are live before sign-in.
- **Owner:** founder; streams S01 to S07, S17 and S20 (PRD V2 `08-delivery.md` section 3).

### D-101 Full v1.0 scope, date moves (founder)
- **Status:** Decided by the founder, 13 Oct 2026, after critique round 1 (options: cut to fit November; keep scope and move the date; raise review capacity). PRD V2 M15.
- **Decision:** v1.0 keeps every P0 work package, including recording backup and co-parent sharing; only the P1 extras listed in PRD V2 `08-delivery.md` section 6.4 are cut. The date follows the merge budget. As planned on 15 Oct: submission in the week of Mon 3 May 2027, about 40% confidence (`08-delivery.md` section 2.2). This replaces ROADMAP 2.1's 2 Nov target.
- **Owner:** founder; delivery lead.

### D-102 Recoverable backup keys, honest copy (founder)
- **Status:** Decided by the founder, 13 Oct 2026, from two options (recoverable through escrow; end to end only). PRD V2 M16.
- **Decision:** keep server escrow so a family can recover recordings after losing every device. Copy says recordings are encrypted, that we hold a recovery key under strict, logged access, and that recordings are never read, sold or used to train models. No copy claims "only your family's keys can open it". The escrow key runs only in a separate project and one function; custody, rotation, the access log and owner emails on each use are specified in PRD V2 F08 section 6.5 and F17.
- **Effects:** microphone purpose string, Terms 6.2 and 12.4, Privacy Policy, Consumer Health Data notice and privacy labels change before release (counsel). ADR 0006 is amended (stream S05).
- **Owner:** founder; S05, S16, S17.

### D-103 Counting the free letters (founder)
- **Status:** Decided by the founder, 13 Oct 2026. PRD V2 M17.
- **Decision:** a letter counts toward the 2 free letters (D-082) only when (a) you are its author, (b) its words exist, and (c) you keep it from Review with the words on screen. The other parent's synced letters never count. A voice-only letter saved before its speech model arrives is kept safely and counts only once its words exist and you keep it from Review. The ledger still never decreases, and Erase everything still resets it.
- **Amends:** D-083 (its rule that "a voice letter kept without words" counts at once, and any counting of letters present on the device regardless of author).
- **Owner:** payments engineer (stream S06), local store (S03).

### D-104 Three delivery defaults (proposed)
- **Status:** Proposed by the coordinator, 14 Oct 2026. Not in force until the founder confirms each item. Until then the founder merges every pull request, and items 2 and 3 are the spec defaults PRD V2 is written against.
- **Update 17 Oct 2026:** item 2 decided (D-111); item 1 replaced by D-107; item 3 still proposed.
- **Proposal:**
  1. The coordinator may merge pull requests that change only docs, evidence or tests, after two independent review agents pass them. Anything touching server code, `supabase/**`, auth, payments, migrations or release configuration is merged only by the founder (D-041).
  2. Encrypted recording backup is free for everyone. Plus remains the membership that lets you keep new letters (D-082); it does not gate backup.
  3. Voice-only letters follow D-103.
- **Owner:** founder (confirmation); coordinator.

### D-105 PRD V2 is the product spec of record
- **Status:** Decided (founder asked for PRD V2 on 3 Oct and chose its source order on 13 Oct). Takes effect when PR #124 merges to `develop`.
- **Decision:** `docs/prd/v2/` replaces `docs/prd/PRD.md` 1.3 as the requirements of record. Existing requirement IDs keep their meaning. Where V2 and a LEGAL-REQ disagree on a legal duty, counsel decides; no founder decision retires a legal duty by itself.
- **Owner:** PM lane.

### D-106 Alpha in two weeks (founder, 15 Oct 2026)
- **Status:** Decided by the founder in the build thread; the delegation widening is proposed by the coordinator and awaits the founder's one-word confirmation.
- **Decision:** Option B ships as an alpha: a TestFlight build with server features on against the staging project, for the founder's family and invited friends, target Thu 29 Oct 2026. App Store submission is re-planned after the alpha. Review delegation: app code may be merged by the coordinator after two independent review agents pass it; database, auth, payments, migrations and release configuration stay founder merges, batched daily.
- **Owner:** founder; coordinator.

### D-107 Merge delegation widened (founder, 15 Oct 2026)
- **Status:** Decided by the founder, 15 Oct 2026, about 17:00 UTC: "Widen." Confirms the delegation part of D-106 and replaces item 1 of D-104.
- **Decision:** the coordinator may merge pull requests into `develop` that change app code (`apps/mobile`, `packages/*`, `apps/web` content and components), docs or tests, once two independent review agents pass the pull request and CI is green on its head.
- **Founder-only merges:**
  - `supabase/**`: database, migrations, access rules.
  - Auth.
  - Payments: billing, StoreKit, `packages/core/src/plan.ts`.
  - Release configuration: `.github/**`, `apps/mobile/eas.json`, `apps/mobile/app.config.ts`.
  - The CODEOWNERS-protected engine files: `EditType` and `packages/core/src/types.ts`, `verify.ts`, `meaning.ts`, `pipeline.ts`.
  - Any production deploy: the website on `main`, the App Store, TestFlight external groups.
- **Effects:** `docs/agents/COORDINATION.md` section 6 states the rule.
- **Update 23 Oct 2026:** the founder-only merge list above is superseded in part by D-117. Under the coordinator's operating rule recorded there (not the founder's words; the founder may reverse it), the coordinator also merges `supabase/**`, auth, payments, `.github/**`, `apps/mobile/eas.json` and `apps/mobile/app.config.ts`, the engine files, and production deploys of the alpha queue, after two independent passing reviews on the current head and green CI. Steps only the founder can perform stay the founder's.
- **Owner:** founder; coordinator.

### D-108 Backup recovery: device age and F08-REQ-034 (founder, 15 Oct 2026)
- **Status:** Decided by the founder, 15 Oct 2026.
- **Decision:** Backup recovery: a device must be enrolled for at least 7 days before it can approve a restore request. F08-REQ-034 is amended to match the backup server as built: ten functions and nine settings, not four functions and three secrets.
- **Effects:** PR #151 (`feat/backup-server`, the S05 backup server). The F08-REQ-034 text in PRD V2 (`docs/prd/v2/features/F08-recordings.md`, PR #124) is updated to match in a follow-up.
- **Owner:** founder; S05.

### D-109 Experience pass calls (coordinator, 16 Oct 2026)
- **Status:** Delegated call by the coordinator under the founder's standing delegation (decide what is industry standard; the founder's instruction of 4 Oct, "Decide right answer on my behalf that are standard for industry apps", as for D-083 to D-088), 16 Oct 2026. The founder may reverse any item. Counsel sign-off is not delegated.
- **Source:** the experience pass spec, PR #170 (`docs/experience-pass-oct`), section 7.
- **Decision:**
  1. F2 approved: in BRAND_SYSTEM section 4, the gradient item of the "Never" line becomes "Never: a gradient anywhere except the app icon tile and the atmosphere lamp (tokens.atmosphere, Lamp), which is decorative, capped for contrast, and never sits inside, behind or around the mark." The line's other "Never" items (the two contrast bans and pure black behind the mark) stay. Reason: the founder asked for the website's light and gradients in the app.
  2. F3 approved: new brand registry context `app.welcome`, the stacked lockup at 96 pt on the welcome screen.
  3. F4 held: the welcome-first order waits for counsel's answer to C1.
  4. F5: the Declared Age Range call is owned by S14 with S17, due before App Store submission, not needed for TestFlight; subject to counsel's answer to COUNSEL_PACKET Q5. Note (merge train): in PRD V2 `08-delivery.md` section 3 the age gate (F01) sits with stream S12; the coordinator confirms which stream owns the call.
  5. F6: the App Store Connect display names are Plus Monthly and Plus Annual; S06 corrects `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`.
  6. F7 answered by the founder's option B (D-100): sign-in, sync, co-parent and backup surfaces are in v1.0 and get their own experience package.
  7. F8 approved: typed letters skip Review, because typed words are never machine-edited.
- **Effects:** for a typed letter, D-103's condition (c) is met when the author keeps it on Write with the words on screen; the Keep gate and the counting in D-082, D-083 and D-103 are unchanged. Follow-ups, not in this entry: the BRAND_SYSTEM section 4 edit; the `app.welcome` registry context (and the `app.header` title, which names the welcome today); `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` (still "Plus Yearly"); PR #170 (S20 for F8).
- **Owner:** coordinator; founder for reversal.

### D-110 Lamp contrast: reading colours everywhere, status colours where text sits (coordinator, 16 Oct 2026)
- **Status:** Delegated call by the coordinator (founder may reverse), 16 Oct 2026, under the same standing delegation as D-109. Counsel sign-off is not involved: this is an accessibility and design rule.
- **Source:** the experience pass spec, PR #170 (`docs/experience-pass-oct`), P1's acceptance line 2; PR #192 (P1, `feat/experience-p1-visual-system`, 3d7c7fd), revision 2, after the coordinator's review of its screenshots. Capping every lamp tone so that even the status colours kept 4.5:1 at the pool's core left light mode reading as plain paper.
- **Decision:**
  1. The everyday text colours (`text`, `textMuted`, `accent`, `focus`) hold 4.5:1 everywhere on screen at every lamp tone's peak, in both schemes.
  2. The status colours (`success`, `caution`, `recording`, `destructive`) hold 4.5:1 where text actually sits, because WCAG 1.4.3 measures text against the background behind it. They never sit on the lit paper of the age gate or of Read together.
  3. Tests enforce both rules over three phone sizes (iPhone 17 Pro, iPhone SE and the Pro Max size): the everyday colours over the whole screen for every scene and daypart, and the status colours over the areas where status text is placed.
- **Effects:** P1's acceptance line 2 in the spec (PR #170) reads this way. `tokens.atmosphere.onLitPaper` (PR #192) records which colours may sit where, and the light-mode peaks rise (PR #192: amber 0.35, gold 0.78, rose 0.17, dusk 0.12). Dark mode is unchanged and keeps every text colour at 4.5:1 everywhere. Increase Contrast and Reduce Transparency still show no lamp.
- **Owner:** coordinator; founder for reversal; P1 (stream S15) for the tests.

### D-111 Alpha calls resolved (founder, 17 Oct 2026)
- **Status:** Decided by the founder, Sat 17 Oct 2026, 11:00 PM PT, by accepting the coordinator's recommendations as they stood that evening. Items that need counsel stay open and are marked.
- **Source:** the founder's alpha readiness plan (a Claude Doc of 16 to 17 Oct, not in the repo; `docs/release/ALPHA_PLAN.md` on PR #152 and `docs/release/AUTOMATION.md` on `develop` are its repo counterparts), the founder questions on #140 and #208, and #220's visual review (issuecomment-6246112253).
- **Decision:**
  1. The website copy on `main` uses the fictional family only. The real-family-name guard runs in `main`'s CI. The fix deploys with its merge. A history purge is not requested.
  2. Vercel preview deployments are off for this project: only `main` builds. This stops pull requests into `develop` from hitting the free plan's daily deploy cap. Vercel Pro before commercial use stays a founder purchase.
  3. Domains: D-097 for `earlyletters.app` (a Cloudflare zone for the pack host, `packs.earlyletters.app`); D-063 stands for everything else (`earlyletters.com`, email, legal pages).
  4. The alpha transcribes English only. Another language needs a native reviewer first.
  5. The 500-kill test runs on the hosted macOS runner, with the founder's Mac and a silent virtual microphone as the fallback if the runner cannot record (AF-14, `docs/release/AUTOMATION.md`). The example workflow sends only DL-01 (kills while recording) to the Mac; DL-02 stays on the runner.
  6. D-104 item 2 confirmed: backup is free for everyone in v1.0 and does not gate on Plus, so the backup screen may say so. D-104 item 1 stays replaced by D-107; item 3 is not changed here.
  7. The server keeps the record that a letter was erased, and the held-draft markers (ids and times, never words), until the book or the author's account is deleted (#208 question 1), so an offline phone cannot bring an erased letter back after the 60-day forget. This is separate from `purge_ledger`, whose ids still go at 60 days (#140 question 7, DATA-REQ-066). The privacy policy's retention section gets one line saying so; counsel reviews that wording (open).
  8. The R-17 database gate (#140): the limits stay as built (20 new books per person per day, 300 letter deletes or restores an hour, 120 membership calls an hour) and are measured during the alpha (question 3). Before the invitee consents, `peek_invite` returns only the inviter's sign-off and the role, never the child's name or ids; the invite sheet reads "Invited by {inviter}" and the BL-322 copy that names the child changes (question 5; #184 implements this). The pull-timing residual is accepted for C1, the external friendly families (question 6); closing it changes the pull protocol and belongs to the sync ADR (S03 with S02). Question 1 takes S02's option: write RPCs keep develop's idempotency header (`record_policy_act` has no `p_id`), device-made invite ids arrive as a new 6-argument `create_child_invite` overload next to develop's 3-argument one (PRD V2 F11 D5), and #32 is re-cut without `p_id`, the hash parameters and Vault. Question 4: `pack_ref` classed L4. Question 7: purged ids dropped at 60 days as built (`purge_ledger`, DATA-REQ-066). The founder's acceptance gets recorded on #140.
  9. Held-draft sync between two phones of one author ships on in build 2 (#208 question 6), unless the held-draft table is not green in `sync-two-phone` by Fri 23 Oct 2026, in which case build 2 ships with it off. `app.held_sync = 'off'` stays as the switch that turns it off with no new build.
  10. When a typed letter is kept on both phones, the first keep's raw transcript, engine version and capture time stand, because the raw transcript is immutable (DATA-REQ-040). The second phone's words become a conflict copy the author can pick, so no words are lost (#208 question 7).
  11. The first-run promise screen is shortened (#220 R5 counted 74 words against the spec's "about 60"). The content owner's measurement (PR #238): the recording and privacy rows (27 words) are at their floor, and the sample, label and button are fixed by the S04 acceptance and the engine test, so about 60 is out of reach without rewording a row counsel would need to see. The coordinator's call under the founder's acceptance: the body line goes to 11 words (71 on screen) with the meaning of the recording and privacy lines unchanged, and S04's acceptance line moves from "about 60" to "about 70". The one cut that needs no counsel diff (a hint without the feature name "Word for word", saving 2 words) is not taken, because D-074 and D-086 chose that name.
  12. The name step hides the book cover when the keyboard leaves less than 480 pt of free height (was 640 pt), and the reason changes from "so the form never scrolls" to "the name field stays in view" (#220 R6). Measured with the keyboard up (#220 visual review): iPhone SE 407 pt, 17 Pro 538 pt, 17 Pro Max 610 pt, so only the SE hides the cover and the name field stays in view on all three. `COVER_MIN_FREE_HEIGHT` in `apps/mobile/src/app/onboarding.tsx` and S05 in the spec change in a follow-up PR.
  13. Legal pages for Friends on build 2: which server-on pages are needed is counsel's call (open). Holding pages otherwise.
- **Effects:** pull requests follow for item 1 (into `main`), item 11 (content), item 12 (`COVER_MIN_FREE_HEIGHT` and S05) and the BL-322 copy in item 8. Item 2 is a Vercel project setting, applied Sat 17 Oct. D-104 item 2 is now decided and its index row says so. Items 3, 5, 6 and 8 get recorded on their pull requests. Items 9 and 10 are built on #182 and #208.
- **Update 27/28 Oct 2026:** item 1 is superseded in part by D-118, for `apps/web/src/content/site.ts` only.
- **Owner:** founder; coordinator; counsel for items 7 and 13.

### D-112 Engine 6 open calls: D14, commonWords, "mm", kinship rule 4 (coordinator, 23 Oct 2026)
- **Status:** Delegated call by the coordinator (founder may reverse), 23 Oct 2026, under the same standing delegation as D-109 and D-110. D-111 item 4 (English only in the alpha) had already settled the es, fr and pt reviewer question for the alpha.
- **Source:** the engine-lens review of PR #179 at df2991c (issuecomment-6367532549), section 6; its recommendations are taken as they stand.
- **Decision:**
  1. D14 (founder Q1, WP-F06-05): the character rule stays as built for the alpha. Em and en dashes, curly quotes and ellipses change in the final text with no stored edit; no word, number, negation, mood mark, quotation count or invisible character changes (the F06-REQ-021 property test). WP-F06-05 follows the alpha, makes each change a stored, undoable punctuation edit, and narrows `NUMBER_DASH` (`packages/core/src/text.ts`), which today turns an em dash between two numbers into a range.
  2. `meaning.commonWords` (F06-REQ-008, R-01 D10): the English seed stays, minus the names rarely meant as the everyday word: mason, carter, cooper, hunter, rowan. A child with one of these names keeps the recogniser's capital; a lowercase one is a cosmetic fix in Review.
  3. "Mm." as a spoken yes (F06-REQ-010): "mm" moves from the English pack's automatic removals (`fillers.auto`) to the offered list (`fillers.suggest`), so the engine never removes it and Review offers it. A removed answer is lost meaning. F06-REQ-010's line "Given English, Then `fillers.auto` equals today's `FILLERS`" needs the matching one-line amendment (PRD lane).
  4. Kinship case fixes (F07 Q3, rule 4): confirmed as built. The machine never changes the case of a kinship word ("mama held her" stays); the parent can in Review. Kinship heard-as only for self or family terms.
- **Effects:** PR #179 (`feat/engine-gates-alpha`) carries items 2 and 3 before merge: `packages/core/src/lang/english-tables.ts`, `english.ts`, the regenerated `packs/text-rules/en.json`, tests in `packages/core/test/engine6.test.ts`; the engine 6 changelog in `pipeline.ts` records them under its 23 Oct amendments. Items 1 and 4 change no code. The same review's notes N1 to N3 (comment, a soft hyphen kept, the name-signal test after a kept filler pair) are fixes on #179, not decisions.
- **Owner:** coordinator; founder for reversal; S09 for the code; the PRD lane for F06-REQ-010.

### D-113 Co-parent build 2: Leave hidden until left books are listed; the share text keeps the name (coordinator, 23 Oct 2026)
- **Status:** Delegated call by the coordinator (founder may reverse), 23 Oct 2026, under the same standing delegation as D-109, D-110 and D-112.
- **Source:** the review of PR #165 and PR #184 (issuecomment-6368263832 on #184, the same text on #165), blocking item 4 and its note on the share text.
- **Decision:**
  1. Leave is hidden in build 2. The Family tab shows no Leave row, a child's settings screen offers none (F11 6.2 D step 1 is not built), and `/invite/leave` answers coming soon, as every co-parent route does when its feature is off (`LEAVE_BOOK_OFFERED` in `apps/mobile/src/lib/family/entry.logic.ts`); with sharing on it says only "Leaving a shared book is coming in a later update.", because the co-parent teaser's "every letter you write stays on this phone" is not true once a book is shared. Reason: after leaving, sync marks the book left (`apps/mobile/src/lib/sync/merge.ts`) and the book list hides it (`apps/mobile/src/lib/db/repos/children.ts`), so the leaver's own letters stay on the phone, but no screen lists, exports or deletes them. The server side is right as built: `leave_child` sets `in_book = false` and never deletes. The leave plan (`canLeave`, `leaveBook`, the leave sheet) and its tests stay.
  2. Before build 3, books this phone has left are listed under "Letters to {child}" with read, export and delete (PRD V2 F11 6.2 D step 4, F11-REQ-011, DATA-REQ-016), and Leave comes back with that: BL-444 in `docs/BACKLOG.md`.
  3. The invite share text (`shareTitle`, `shareMessage` and `shareMessageNamed` in `packages/content/src/features/family.en.ts`) keeps the child's name. The parent writes it on their own device and sends it themselves, to someone they chose, like any message they write; if it is forwarded, the name goes with it. The server's peek still never reveals the name before joining: `peek_invite` returns only the inviter's sign-off and the role (D-111 item 8), the app asks "Join this book as a parent?" with "Invited by {inviter}", and the child's name appears only after joining.
- **Effects:** PR #184 (`feat/coparent-alpha`) carries item 1 and a code comment citing D-113; item 3 changes no copy. Three docs that still showed the child's name before joining now say what the app shows: `docs/BACKLOG.md` (BL-322), `docs/prd/v2/features/F11-co-parent.md` (6.2 B step 6) and `docs/security/REVIEW_R17_CHECKLIST.md` (6.1). With no Leave row, the Family tab no longer uses the destructive variant the lamp rule (#221) forbids there. Item 2 is BL-444.
- **Owner:** coordinator; founder for reversal; S04 for the code.

### D-114 Database budgets on the nightly; plan checks on every pull request (coordinator, 23 Oct 2026)
- **Status:** Delegated call by the coordinator (founder may reverse), Fri 23 Oct 2026, under the founder's standing approval of the alpha queue.
- **Source:** PR #215 (`chore/db-perf-budgets-nightly`, af53d7c), which split `supabase/tests/perf.test.mjs` and `sync_perf.test.mjs` into a pull-request mode and a nightly mode, and its note to the stewards that DB-R21 and `docs/engineering/ENFORCEMENT.md` still said the budgets were enforced on `develop`.
- **Decision:**
  1. Pull requests run the deterministic plan and named-index checks at 250 families x 400 letters (`npm run test:db`). The p95 budgets run on the nightly only, at 1,000 x 400 with `PERF_BUDGETS=1` (the `perf` job in `.github/workflows/nightly.yml`), per #215.
  2. A nightly red from a missed budget alone is advisory: it does not fail go/no-go row B2-22 (`docs/qa/ALPHA_GO_NO_GO.md`), which needs the nightly's fuzz and plan jobs green. This holds until the budgets get their own workflow with one retry on a quieter runner (a follow-up).
  3. The nightly cannot fire until the default branch is `develop` (AF-05, a founder step before build 2). Until then the plan checks on every pull request are the guard.
- **Rationale:** shared runners make timing budgets flaky. On 23 Oct the same SQL missed 5 of 6 read budgets at a load average of 10 and passed them at a load average of 3.
- **Effects:** no workflow, test or SQL change here; #215 made them, and no budget value changed. The policy lines now say where the budgets run: DB-R21 in `docs/engineering/03-database-and-schema.md`, API-R17 in `docs/engineering/02-api-and-contracts.md` and the DB-R21 row in `docs/engineering/ENFORCEMENT.md`. The `perf` job in `.github/README.md`'s nightly line is left to `chore/release-follow-ups-before-build-2`. The budgets' own workflow with one retry (item 2) is a follow-up in the `.github/workflows` lane.
- **Owner:** coordinator; founder for reversal.

### D-115 English-only pack release before build 1; non-English packs wait for a native reviewer (coordinator, 23 Oct 2026)
- **Status:** Delegated call by the coordinator (founder may reverse), Fri 23 Oct 2026, under the founder's standing approval of the alpha queue and D-111 item 4 (the alpha's speech is English only).
- **Source:** PR #162 (`feat/packs-hosting-pipeline`, 7e5cd38), the one-command pack release: `keygen.mjs` (primary key, and `--backup` for the cold backup), `release` (signs the three documents, the pack manifest, the remote config and the content bundle, with a key read at run time from outside the repo), `upload` (R2 on the D-097 host, sends only what the signed manifest lists, packs first and the manifest last) and `verify` (unauthenticated reads of the public URLs). Runbook: `docs/ops/PACKS_HOSTING.md`; TESTFLIGHT step 4; FT-16.
- **Decision:**
  1. An English-only pack release is a build 1 prerequisite. The app loads a speech model only from the signed manifest, so without a published release build 1 cannot transcribe. It is on the build 1 critical path next to the Apple and Expo accounts.
  2. The founder runs it: the key ceremony (`keygen.mjs`, then `keygen.mjs --backup`; distinct key ids, a repeated id is refused), then `release`, `upload` and `verify` on one computer with the private key outside the repo. No CI job uploads a release or reads the signing or upload secrets, and the coordinator never holds a key.
  3. `release` defaults to `--languages en`: a release lists only the multilingual speech models and carries no draft non-English text pack (English is bundled in the app and has no text pack). Another language needs an explicit `--languages` flag, and the choice is printed and recorded in the release index.
  4. A non-English pack ships only when a native reviewer and the founder say so. Hindi (FT-16) needs its catalog change and an app release first.
  5. Keeping the alpha's speech English only also needs the app-side gate on the language picker (S12, D-111 item 4), a follow-up PR; the pack release alone does not stop a tester choosing another language in the app.
- **Rationale:** D-111 item 4 set the alpha to English only. The manifest is the app's only source of models, so the release decides what build 1 can do, and a release that ships a draft text pack in another language would put unreviewed words in front of a family. The signing key stays with the founder (security rules), so the release is a founder step, not a coordinator step.
- **Effects:** #162 carries the tooling, the runbook and the English-only default; no SQL or app change. Three docs still say the coordinator signs or publishes and need the founder named instead: `docs/ops/RELEASE.md` section 9, `docs/BACKLOG.md` BL-335 and `docs/COORDINATION.md` section 6 (follow-up in the docs lane). The server kill-switch commands `release` prints are skipped for the alpha (TESTFLIGHT step 4). Unverified from the sandbox: the real R2 upload, the live host and the Hugging Face download; the founder's first run is the check.
- **Owner:** coordinator for the tooling; founder for the ceremony, the release and any reversal.

### D-116 A former member's letters survive the remaining parent's book deletion and purge (coordinator, 23 Oct 2026)
- **Status:** Delegated call by the coordinator (founder may reverse), Fri 23 Oct 2026, under the founder's standing approval of the alpha queue.
- **Source:** PR #248 (`fix/db-s02-purge-and-consent-guards`, migration `20261023010000_s02_purge_and_consent_guards.sql`) and review A note N1 on #151 (issuecomment-6371752917); reviews A and B on #248 (issuecomment-6374328519, issuecomment-6374282549).
- **Decision:**
  1. A former member's letters, held drafts and recording backups survive the remaining parent's book deletion and purge. A kept author is anyone with a letter, held draft or recording backup in the book who is no longer a member at purge time (they left, their join was undone, or they were removed). The purge (`purge_due` on day 30, or `prepare_account_purge`) removes everyone else's rows and Storage folders, person by person; the `children` row stays tombstoned with `purged_at` set and is removed once nothing of the kept author's is left. No `child` ledger row is written while the book is kept, so a restore replay never cascades over the kept letters. A book with no kept author is purged as before, and current members (the deleting parent, and family members, who were offered export) are purged with the book as before.
  2. The kept row keeps the child's name, birth date and due date for the kept letters' labels, and is cleared of the nickname, photo, creator, "family can read" and the hidden mark. No app role can read it until the left-book listing (BL-444) serves it to kept authors only.
  3. `undo_parent_join` no longer deletes the removed parent's held drafts on the server. The phone's discard of its copies is a follow-up (`apps/mobile/src/lib/sync/merge.ts:544-552`).
- **Rationale:** the constitution (the machine never destroys a person's words without their own ask) and DATA-REQ-014, the equals rule: one parent's delete is never the end of another person's words. D-113 already lists left books under "Letters to {child}" before build 3.
- **Effects:** the migration above; `docs/legal/DATA_CLASSIFICATION.md` (the L4 retention row) and `docs/legal/DELETION_AND_EXPORT_SPEC.md` section 2.3 updated in #248. For counsel: `docs/legal/privacy-policy.md` lines 179 and 235 still say the sole parent's deletion removes everything in the book, and line 159 promises erasure from the live database within 31 days, which the kept name and dates go past; all three need counsel's wording. Follow-ups as listed in #248: the harness granting functions to `service_role`, the wider legal-hold gap in `prepare_account_purge`, anon and authenticated grants on `policy_acceptances`, MAINTAIN on the consent tables, and serving the kept held draft through `sync_pull`.
- **Owner:** coordinator; founder for reversal; counsel for the policy text.

### D-117 Blanket approval (founder, 23 Oct 2026), and the coordinator's operating rule under it
- **Decided (founder):** 23 Oct 2026: "Everything is approved. Don't keep asking me to approve things. I give you a blanket approval." This was the founder's reply when asked to approve the alpha queue item by item.
- **Coordinator's operating rule under D-117 (not the founder's words; the founder may reverse any of it):**
  - The coordinator merges the founder-only path classes of D-107: `supabase/**`, auth, payments, `.github/**`, `apps/mobile/eas.json` and `apps/mobile/app.config.ts`, the engine files, and production deploys of the alpha queue. A merge needs two independent passing reviews on the current head and green CI (`npm run test:db` green for database pull requests).
  - Steps that only the founder can perform stay the founder's, as a matter of fact, not of decision: applying migrations to the hosted projects; the Apple, Expo, Supabase and Vercel accounts and their secrets; the signing and escrow keys.
  - Legal text is counsel's to sign, as before.
- **Supersedes in part:** D-107's founder-only merge list; D-107's update names the same classes.
- **Effects:** `supabase/APPLY.md` (files 18, 20, 24 and the backup server file), `docs/ops/DEPLOY.md`, `docs/ops/BACKUP_RUNBOOK.md`, `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` and the comment on the `workflow_dispatch` trigger in `.github/workflows/deploy-db.yml` name the process: after two independent passing reviews on the current head, with green CI, the coordinator merges into `develop`, and the founder applies through `deploy-db.yml` (PR #261). The `approve-migration` label (D-041) is no longer used; no workflow reads it. `docs/agents/COORDINATION.md` section 6 still states D-107's rule (follow-up for its owner).
- **Owner:** founder (the approval); coordinator (the operating rule).

### D-118 The website names the founder's child: founder, 27 Oct 2026 (Pacific; 28 Oct UTC)
- **Status:** Decided by the founder, 27 Oct 2026 (Pacific; 28 Oct UTC), for now; scope, guard design and wording by the coordinator. The founder's words: "Yes [name] is fine for now. Change to that." Earlier the same day (as relayed by the coordinator; not in any PR body or comment): "is ok fine for [name] used on website. I don't see a harm."
- **Source:** the founder's chat of 27/28 Oct 2026, where the founder's words were given; PR #302 (`feat/web-fictional-name-lina`: the website copy and the guard copy on `main`), whose body carries the first quote; PR #307 (`docs/decisions-d118-d119`: this entry and the guard copy on `develop`).
- **Context:** the change that replaced the real name with the fictional family (Asha, Neela) was PR #3 (`858841f6`, closed unmerged on 3 Oct 2026); it landed on `develop` by #52 (4 Oct) and on `main` by #237 (23 Oct), under the `CLAUDE.md` rule that real family details never go in code, tests or fixtures. D-111 item 1 (17 Oct) put the same rule on the website copy, and F21-REQ-017 (`docs/prd/v2/features/F21-store-web.md` line 259, "No real family details on the website": the guard finds nothing in `apps/web/**` and the sample letter uses the fictional family) requires it. The repository is public, and history was not purged (D-111). An earlier fictional rename on the website PR (`7c5e76a`) was replaced by this decision.
- **Decision:**
  1. The website copy uses the child's first name, one spelling, in `apps/web/src/content/site.ts` only. Comments and every other file say `[child]` or use the fictional family.
  2. The real-family guard gets one exception in both of its copies (`packages/content/test/no-real-family-data.test.ts` on develop, `apps/web/test/no-real-family-data.test.ts` on main): that spelling's hash, that one file by its exact path, contents only. Paths, other spellings, the nickname, the other family member's name and the birth date stay blocked everywhere. A test pins the allowed list to that one entry, so widening it means editing the guard on purpose.
  3. Tests, fixtures, docs, `packages/content` and the mobile app keep the fictional family "Asha". The misheard-name demo on the site uses the same name.
- **Supersedes in part:** D-111 item 1, for `site.ts` only; D-111's update says so.
- **Reverses in part (proposed, not made here):** F21-REQ-017, for `site.ts` only. Agents do not edit requirement documents (`docs/agents/OPERATING_MODEL.md` section 8), so the change to F21-REQ-017 is proposed here and in #307's PR body, for the founder or the requirement's owner to make.
- **Risks the founder accepted:** the repository is public and the live site deploys from `main`, so the name is effectively permanent once deployed and appears next to the product in search. The sample letter is invented text and, with a real name, reads as a real family moment.
- **Effects:** the website PR #302 (to `main`, deploys to production, the founder merges). #307 must be on `develop` before any merge between `develop` and `main`, in either direction: any release PR from `develop` into `main` must not merge before it, and neither may a merge of `main` back into `develop`; otherwise one branch holds the name in `site.ts` next to a guard copy without the exception, and its CI fails. Not edited here; the founder decides: `CLAUDE.md` line 54 (the privacy rule), `.github/pull_request_template.md` line 19 (the checklist item) and `docs/agents/OPERATING_MODEL.md` section 8 (the hard limit on real family details) state the rule without this exception.
- **Review point (coordinator proposal, not the founder's):** look at this again before the site is promoted or the alpha link goes public.
- **Owner:** founder; web lane for the copy; coordinator for the guard; the founder or the requirement's owner for F21-REQ-017.

### D-119 Logo round 4: ship the approved mark, keep the two-tone as the alternate (design lead, 27 Oct 2026)
- **Status:** Delegated call by the design lead (founder may reverse), 27 Oct 2026 (Pacific; 27 Oct UTC). The founder asked for two options that work in dark mode, light mode and grayscale, and said "Pick for me as my design head" (as relayed; not found in any PR text); the pick below was made on that delegation. The founder then said to go ahead with the website header.
- **Source:** the founder's chat of 27/28 Oct 2026, where the founder's words were given; PR #299 (`feat/brand-logo-options-r4`: the candidates and `docs/brand/logo-r4/RECOMMENDATION.md`); PR #301 (`feat/web-header-lockup`: the header, to `main`); PR #307 (this entry).
- **Decision:**
  1. The primary mark stays D-071 (`primary/`). Nothing changes in the registry.
  2. The alternate is B, the two-tone version (parent blob in ink or paper, child blob in the sepia accent, dark tile): highest contrast of the set, and every mark pairing passes the 3:1 graphic floor; its dark tile edge on the night page is 1.27:1, a weakness the approved mark shares (its sepia tile 2.68:1, its dark tile 1.27:1).
  3. Rejected: C (the name in quotation marks) because it breaks the opening-quotes-only rule in `BRAND_SYSTEM.md` section 1 and adds a second quote shape; D (paper tile) because its edge is 1.00 to 1.35:1 against light pages.
  4. The website header carries the approved lockup (#301).
- **Evidence:** `docs/brand/logo-r4/RECOMMENDATION.md` (measured contrast, grayscale proof, what was and was not checked).
- **Not done:** colour-blindness simulation with a validated tool, testing with people, and trademark clearance (BL-366 stays open for every option; `RECOMMENDATION.md` and the options-r4 README cited it as BL-355, which is brand fonts, until PR #333 corrected both).
- **Effects:** #299 (candidate assets under `packages/brand/assets/logo/options-r4`, not registered), #301 (header, to `main`).
- **Owner:** design lead; founder for reversal.

### D-120 Build 2 invites are link-only; typed codes wait for a code-registration route (coordinator, 27 Oct 2026)
- **Status:** Delegated call by the coordinator (founder may reverse), 27 Oct 2026 (Pacific; 28 Oct UTC), under the same standing delegation as D-109, D-110, D-112 and D-113.
- **Source:**
  - The P8b owner's finding in PR #314 (`feat/mobile-p8b-family`, S57 to S60), section "Typed code: server side only": the experience pass gives the phone a link to share and a field to paste it into, while four P0 lines of the PRD ask for a typed code.
  - PR #306 (`fix/invite-redeem-by-code`, the server RPC `invite_redeem_by_code`): two independent reviews at f54b6f2, lens A (security and access) and lens B (contract and correctness), both PASS WITH NOTES. They are recorded in the coordinator's hold comment with the fix list (issuecomment-6460527733), not posted as GitHub reviews. #306's head later moved to fc67104 ("review fixes", 28 Oct 2026, 06:20 UTC, after the CTO ruling D1 in #325), and no review covers that head. The hold stands.
- **Context (checked on `develop` at 6bfb94a):**
  1. `CreateInviteArgs` in `packages/api/src/server/family.ts` takes `p_code_hash: string | null`. The code's HMAC needs the pepper, which lives only in Edge Function secrets (`INVITE_CODE_PEPPER`, read by `supabase/functions/invite-redeem`), so the phone cannot make `p_code_hash` itself. `createCoParentInvite` in `apps/mobile/src/lib/family/invites.ts` sends `p_code_hash: null`, and the phone's invite draft (`invite-draft.logic.ts`) makes an id and a token, no code.
  2. No client calls `invite-redeem`: `INVITE_REDEEM_PATH` is used only by the contract test (`packages/api/test/server-contracts.test.ts`), and nothing under `apps/mobile` calls the function (its one mention there is the comment on `p_code_hash: null`).
  3. No route registers a code: `create_child_invite` takes the code's HMAC, which the phone cannot make, and no Edge Function takes a code from the phone and stores its HMAC (`invite-redeem` has only the `peek` and `accept` modes).
  4. So these PRD V2 P0 lines are not met on the phone in build 2: F11-REQ-001 ("Share invite and Show code are reachable in 2 taps"), F11-REQ-002 (the device makes an 8-character Crockford base32 code), F11-REQ-007 (codes are redeemed only through `invite-redeem`), all in `docs/prd/v2/features/F11-co-parent.md`, and A-REQ-029 ("a pasted link or a typed code is accepted").
  5. The experience pass (`docs/design/EXPERIENCE_PASS_2026-10.md`) specifies link-only: S58's "Share invite link" opens the iOS share sheet and S58 has no code key; S59 keeps the paste field and its words as today ("Invite link", "Paste the link here"). Go/no-go row B2-5 (`docs/qa/ALPHA_GO_NO_GO.md`) does not require a typed code, and its AL-05 run sheet lists joining by code as not built.
- **Decision:**
  1. Build 2 invites are link-only. The phone shares an invite link and accepts an opened or pasted link. It makes no code, shows none and sends none; on #314 a pasted 8-character code is not recognised and nothing is sent.
  2. PR #306 is held, not merged into the alpha queue. It was reviewed at f54b6f2, not rejected, and its later head fc67104 is unreviewed: whoever resumes it works through the fix list on the PR before any merge.
  3. Typed codes reopen when a code-registration route (the device makes the code, the server stores its HMAC) and an S04 client (Show code, the code field) exist: BL-445, after the alpha.
- **Rationale:** with no registered code and no client, a typed code would still find nothing after #306 merged. Merging a rate-limited endpoint and table that nobody can call would widen the R-17 review surface for no build 2 value (#306's hold comment).
- **Effects:** no code field and no code key in build 2: `familyCopy` in `packages/content/src/features/family.en.ts` has words for a link only, and #314 keeps it that way. The F11 and A-REQ-029 lines are not edited: agents do not edit requirement documents (`docs/agents/OPERATING_MODEL.md` section 8), so the F11 note is proposed in the body of the PR that adds this entry, for the founder or the requirement's owner to make. BL-445 in `docs/BACKLOG.md` carries the route, the client and #306's fix list.
- **Reverses:** nothing. The four requirement lines stand; this call defers them past build 2 on the phone.
- **Owner:** coordinator; founder for reversal; S02 and S04 for BL-445.

### D-121 Release sooner by staging: on-device first store build (coordinator on the founder's delegation, 28 Oct 2026)
- **Status:** Decided on the founder's delegation. The founder's words on 28 Oct: "We need to release much sooner. We can do other launch events later too." and, about scope, "implement all diligently ... We don't want to bloat app." The founder may reverse this entry.
- **Context:** The 3 May 2027 submission in `docs/prd/v2/08-delivery.md` rests on a merge budget of 12 founder merges a week. D-107 and D-117 overtook it: `develop` took 60 merges in the week of 12 Oct and 74 in the week of 19 Oct. What sets the date for the full scope is calendar time: a 14-day soak of the servers-on build, a 21-day first-families run (C1), 4 weeks of backup in families' hands, counsel review (3 weeks to comments, up to 6 more to sign-off, both assumptions), and a device operator that does not exist yet. The CTO analysis of 28 Oct puts the full scope at about Mon 4 Jan 2027 at best (10 to 15%) and more likely mid-February to March 2027. As of 27 Oct no alpha build exists; the blockers are founder-only steps (`docs/release/1.0.0.md`).
- **Decision:**
  1. The first store build uses the existing `production` profile: server features, backup, status report and analytics off, English only (`EXPO_PUBLIC_ENGLISH_ONLY=on`), Plus on. Target submission Tue 1 Dec 2026 (55% by Fri 11 Dec, CTO analysis, assumption). A faster path to about Mon 16 Nov (30%) exists only if the founder signs, in writing, a counsel deferral of named questions and a shorter first-families run with the dated exception `docs/prd/v2/07-quality-bar.md` section 4.4 item 1 requires. That is a legal-risk choice and stays the founder's.
  2. The full scope is not cut. The server features ship in later 1.0.x releases, in this order, each behind its existing flag and its gate: (a) sign-in, sync and co-parent sharing; (b) status report and reminder emails; (c) owner backup; (d) the other six spoken languages, each when its reviewers sign.
  3. Amends D-100, D-101, M14 and M15 for the first binary only. D-099 (two-parent cap with v1.1 sharing), D-088 ("Data Not Collected" label, subject to counsel Q12) and D-106 (submission re-planned after the alpha) fit it.
  4. The alpha lane continues for the family and testers on the `.preview` record.
- **Risks the founder accepted:**
  - Apple guideline 2.5.19 says no hidden, dormant or undocumented features (read on Apple's page, 28 Oct). The first build carries unreachable server code. Mitigation: say so in the Notes for Review (2.3.1(a); F19-REQ-024 lists every flag there). The existing "coming soon" co-parent screens are handled by D-126. No Apple text found that settles it.
  - Two App Review cycles for features the full scope would ship together; a reduced first store listing; the listing and screenshots must stop promising seven languages and co-parent sharing.
  - The dormant server code is about 0.25 MB of the download (JS only; native size unmeasured until the first IPA). The 40 MB budget stays unverified until then.
  - The name is not trademark-cleared and the bundle id is permanent from the first upload: FT-28 (the name screen) is done before the production record is created.
  - AB 1043 starts 1 Jan 2027; the counsel packet default is a 1.0.x that requests the age signal.
- **Effects (follow-ups, not done in this entry):** `EXPO_PUBLIC_ENGLISH_ONLY=on` in `production` with its three tests, a founder call per `capabilities.ts`, landed before the alpha freeze or after the go/no-go (Mon 9 Nov, D-130); store listing and screenshot rewrite; Notes for Review sentence on dormant code; `08-delivery.md` and `FUTURE.md` dates re-based (`docs/backlog/FUTURE-REBASELINE-2026-10-28.md`). The founder-only steps in order, about 11 hours in the first four days: Apple and Paid Apps, counsel, Cloudflare and keys, Expo and App Store Connect, build 1.
- **Owner:** founder for the steps and the sign-offs; mobile and release agents for the code; counsel for the packet.

### D-122 Repository stance (coordinator with the CTO analysis, on the founder's delegation, 28 Oct 2026)
- **Status:** The founder asked on 28 Oct to evaluate and decide with the CTO, and that planning documents never ship with the app. The founder may reverse this entry.
- **Decision:**
  1. Add a root `LICENSE`: All rights reserved, no licence granted, third-party components keep their own. It names no person (the `packages/brand` rule that real names stay out of code). No open-source licence is added.
  2. Limit outside pull requests to collaborators (repository Settings, Features, Pull requests). Founder step. Test it with one agent PR afterwards, since agents open PRs as collaborators.
  3. New design-level write-ups (evidence, thresholds, failure analysis of the ADR 0027 kind, threat-model detail) go to a second private repository. The public repository keeps requirement rows and shipped code. Founder creates the repository; the agents' token step gains it.
  4. The repository stays public for now. The measured cost of going private is mainly macOS runners: about 3,250 macOS minutes in 8 days, roughly $750 a month at GitHub's listed rate; branch protection and environment reviewers are not listed for private repositories on GitHub Free; ADR 0022 decision 8 assumes public. Revisit after the go/no-go (Mon 9 Nov, D-130) and once the account plan is known.
  5. Planning documents (`docs/prd`, `docs/backlog`, `docs/research`, `docs/legal/memos`, any `.md` under `docs/`) never ship in the app or the website. A measured iOS export and web build contain none today. `scripts/guards/docs-leak-guard.mjs` (tested) checks it; it joins the seam-guard CI job by a founder-path change to `.github`. A root `.easignore` is added only after a dry run on the first build, because EAS then ignores `.gitignore`.
- **Not decided here:** anything legal. Counsel questions are in the private project. Nothing in this entry grants or waives a right.
- **Owner:** founder for settings and the private repository; ops for CI wiring.

### D-123 Requirement rules adopted, with changes (coordinator with the CTO analysis, on the founder's delegation, 28 Oct 2026)
- **Status:** Decided. Source: `docs/prd/v2/11-requirement-rules-and-retro-changes.md` and the CTO analysis of 28 Oct.
- **Decision:**
  1. Adopted as written: RR-6 entry paths, RR-8 stand-ins, RR-9 no collisions, RR-11 freshness (no gate), RR-12 security by construction, RR-13 unknowns.
  2. Adopted with changes: RR-1 and RR-4 for new or changed rows only (no mass demotion of P0 before the go/no-go (Mon 9 Nov, D-130); the 50% target stays a founder call); RR-2 after the trace parser reads sub-IDs such as 029a (`scripts/trace.mjs` line 33 reads only three digits today, 4 to 6 hours); RR-3 as a ratchet (fails only on P0 rows added or changed after a committed baseline of today's 572 and 14); RR-5 for F14, F16 and F08 rows; RR-7 as a warning; RR-10 limited to prices from `pricing.ts` (already tested) with the claim registry deferred.
  3. Row groups: accepted, with F16-REQ-029a to c waiting on the parser, F14-REQ-037 cells waiting on D-104 item 3, F05-REQ-NEW-D done per language at unlock and not per build in CI, F14-REQ-NEW-A given a real number. Rejected for now: the support-reply promise F20-REQ-NEW-C (kept as a question under RR-13) and the "pause over 24 hours" plan rule.
  4. Sequence: this week only docs, the parser fix as a branch and the C-NFR-005 duplicate-ID fix; no new blocking check before the go/no-go (Mon 9 Nov, D-130).
- **Owner:** qa and docs agents; founder for the P0 budget.

### D-124 Open-question sweep (coordinator on the founder's delegation, 28 Oct 2026)
- **Status:** Decided on the founder's "Sure. Decide." and the follow-up asking which open items the coordinator can decide. The founder may reverse any item. Counsel and Apple sign-off are not delegated and nothing here touches them. Sources: `docs/prd/v2/11-requirement-rules-and-retro-changes.md` section 6 and the founder decision briefs (PR #332, briefs d, f and i).
- **Decision:**
  1. Freeze Tue 3 Nov and go/no-go Mon 9 Nov (D-130) are confirmed for the alpha builds. `eas.json` is not edited between them. The `EXPO_PUBLIC_ENGLISH_ONLY=on` line in `production` (PR #413) may land before the freeze, because it touches no alpha profile; any other `production` change waits until after the go/no-go (Mon 9 Nov, D-130). The freeze is fixed at Tue 3 Nov (D-130); the earlier rule here, that it moves day for day if build 1 is not uploaded by Mon 2 Nov, no longer applies.
  2. D-099 stands. Its "effective with v1.1 sharing" means: the two-parent cap takes effect in the first release that turns co-parent sharing on. Under D-121 that is a 1.0.x release, not v1.1.
  3. D-095 stands for the whole 1.0 line, staged 1.0.x releases included: `EXPO_PUBLIC_ANALYTICS` stays off, no consent sheet, no analytics host, privacy label unchanged. Analytics returns with consent in v1.1 or later. F18 rows move to that release in a docs PR (not done here). Website analytics: none (CTO ruling D4). Brief (d), option 1.
  4. Issue #127 ("v1.0 is on-device") is superseded by D-100 as staged by D-121: full scope is the plan, and the first binary is on-device. Brief (i), option A in effect. The scheduled lane prompt still cites #127 and is blocked from editing, so it stays stale until the founder changes it.
  5. D-111 item 6 stands: backup is free and never a Plus feature. `packages/core/src/plan.ts` lists `backup_upload` as gated; the fix and its test change go in one billing-path PR after the go/no-go (Mon 9 Nov, D-130) and before any build profile sets `EXPO_PUBLIC_BACKUP` to `on`. Brief (f), option 1.
- **Not decided here (left to the founder or counsel):** D-104 item 3 and DR-19 (recommendation in the private project), DR-01 order, DR-21 numbers, the promise wording, the delegation scope, DR-10/11/15, the D-111 and F14 counsel questions, the load and security test spend, founder hours and the device operator. F08-REQ-034: D-108 says it was amended to "ten functions and nine settings", but the spec now describes the escrow isolation check and `supabase/functions` on `develop` lists eight function folders. Whether the amendment landed or is stale needs a check against PR #151 before anyone edits it.
- **Owner:** coordinator; founder for reversal.

### D-125 Rulings on the remaining open questions (coordinator on the founder's delegation, 28 Oct 2026)
- **Status:** Decided on the founder's instruction of 28 Oct to review, debate and decide all open items. The founder may reverse any item. Counsel and Apple sign-off are not delegated: where an item needs counsel, this entry sets the working default the build follows and who must confirm it. Sources: `docs/prd/v2/09-decisions-and-risks.md` (DR-01, DR-10, DR-11, DR-15, DR-19, DR-20, DR-21), `08-delivery.md` section 6, `docs/legal/COUNSEL_PACKET.md`, F14 section on counsel questions, D-103, D-104, D-107, D-109, D-111, D-116, D-117, D-121, D-124. The debate was one author arguing both sides in a note, not independent agents.
- **Decision:**
  1. **DR-19, D-104 item 3: option A.** A voice-only letter stays in the book, uncounted, and counts toward the free letters only once its words exist and the author keeps it from Review. This is D-103 restated; D-104 item 3 is closed on that basis. F14-REQ-037 can be finished. Analytics are off for the 1.0 line (D-124), so the free voice-only path is watched through tester feedback and consent-free App Store Connect numbers only.
  2. **DR-01: A, with an unlock order.** The first binary is English only (D-121). After it, a language appears in the picker only after its own gate passes: a native reviewer's sign-off and a recorded per-language test on the minimum device. Order: Spanish, French, Portuguese and Mandarin in the order their reviewers sign (the spec calls these four realistic on one shared model), then Hindi, then Arabic last with the recording kept and the author typing. Hindi is gated twice: counsel packet Q9 (training-data terms of the Hindi fine-tune) must clear before that model ships, and until then Hindi would run on the shared model, which a third-party run scored at 29.64 WER on Hindi (F05, R5), so it is unlikely to pass its own gate. Hindi is scheduled only after Q9 clears.
  3. **DR-21: confirmed as written, with one amendment [A].** The 4% start rate (raise the free allowance to 5, then 10) and the 30% trial-to-paid rate (test $39.99 or a 1-month annual trial) stay. No rule fires on fewer than 500 first-time downloads (first rule) or fewer than 100 trial starts (second rule) in the window, because at those volumes one standard error is about 20% and 15% of the threshold; below them the number is noise. Both minimums are assumptions the founder may change. T39 and T40 are re-dated when the release dates move.
  4. **DR-15: option A at v1.0.** Show every reader the letter's language name and one line asking the author to read it with them; no second-language version before Study 3. It ships with co-parent sharing, which is a later 1.0.x release (D-121), not the first binary.
  5. **DR-20 and `08-delivery.md` section 6.2 are superseded** by D-107 and D-117 (the founder's words of 15 and 23 Oct). The coordinator's own rule keeps one limit: `docs/DECISIONS.md` and `docs/legal/**` are merged by the founder, so the coordinator does not merge its own decision records or legal text. The founder-only steps stay the founder's.
  6. **DR-11 and counsel Q1: the production record waits for a dated gate.** The alpha (`.preview` record, TestFlight) may run under an individual developer account. The production App Store Connect record, whose bundle id and seller name are permanent, is created only after the founder decides individual or entity with counsel, by Fri 13 Nov 2026 so that a 1 Dec submission holds. If no decision is made by then, the Q1 default applies (publish as an individual) and the founder signs that deferral in writing. Apple's enrolment page (read 28 Oct) says an organization needs a legal entity, a D-U-N-S number, a public website on the organization's domain and a work email on it, and gives no review time; it says only "contact us" to convert an individual account and does not say whether apps carry over. Ask Apple Developer Support in writing before choosing. Entity formation is the founder's and an attorney's call.
  7. **Counsel sequencing for the first binary [I: from titles and defaults, not a full read of each question].** Ask these first because the first binary touches them: Q1, Q15, Q5 (and the AB 1043 release plan), Q10, Q12 (the "Data Not Collected" label depends on it, D-088), Q14 to Q18, Q8 with F14 Q-C2, Q-C4, Q-C5, Q-C6, Q-C8 and Q-C10, Q23, and Q3 if the consumer health data notice applies on device. Q-C1 becomes the central billing question, since in the first binary nobody has an email. These can wait for the sync and status-report releases: Q2, Q11 (except the pack host), Q13, Q21, Q22, Q-C9, Q-C11, Q-C12, Q9 (until a non-English language is scheduled), and D-111 item 7, D-111 item 13 beyond holding pages, and the D-116 policy lines. Until counsel answers, each question's "default if unanswered" in the packet is the working position; for the store binary, each must-answer item needs counsel's written answer or a founder-signed deferral (07 section 4.4 item 1).
  8. **D-109 item 4 (welcome-first order) stays held** for counsel; the current order ships in the first binary. Build 1 needs only the no-account notice among the legal pages (CTO ruling D5).
  9. **Promise wording.** The in-app headline "Exactly as you said it." stays in the alpha, where content tests and the Word for word explanation sit beside it. The App Store subtitle and listing do not use "exactly as you said it" until counsel clears it at T30. They use the other two distinct claims in `04-market.md` ("in your own voice", "see every change"). Reason: the product removes stray ums and fixes misheard words, marks each change, and the original transcript is itself machine output, so "exactly" is stronger than what App Review's accurate-metadata rule (2.3.1) and a later complaint would test.
  10. **Tests and spend.** Q8: the 1-hour 1x smoke (WP-F16-12) is the gate for the sync release; the full 2x load test is not required (no P0 requirement). Q10: an external security test is required before server features open to anyone outside the first families, not for the first binary, which has no server. Its cost is unknown and the spend is the founder's. Q2 is moot for merges (D-107, D-117); founder time is now the founder-only steps. Q9 (a named device operator) is a fact only the founder holds and was due Fri 30 Oct (T12).
  11. **F08-REQ-034 and D-108: resolved by reading the code.** PR #151 is merged. The backup migration grants `escrow_svc` exactly ten `escrow_*` entry points (`supabase/tests/audio_backup_escrow.test.mjs` asserts ten) and `docs/ops/BACKUP_RUNBOOK.md` lists nine settings, so D-108 is right and the spec text (four functions, three secrets) was stale. The requirement is amended in PR #318.
- **Not decided here, and why:** whether to form an entity (item 6), legal answers to any counsel question (item 7), the promise wording itself (item 9), the cost of the external security test (item 10), founder hours and the device operator.
- **Owner:** coordinator; founder for reversal and the facts above; counsel for items 6 to 9.

### D-126 No "coming soon" co-parent surface in the store build (coordinator on the founder's delegation, 28 Oct 2026)
- **Status:** Decided on the founder's "Decide and move forward". Corrects a line in D-121, which cited F19-REQ-024 for a rule that row does not contain. The founder may reverse.
- **Context:** With server features off, `apps/mobile/src/components/family/coparent-soon.tsx` shows a "coming soon" presentation on the Family tab, in the child settings row "Write this book together" and on the invite screens (read on `develop`, 28 Oct). That was designed on 3 Oct for a v1.0 on this phone only, and D-087 had the review notes say so. Apple guideline 2.1(a) says "placeholder text, empty websites, and other temporary content should be scrubbed before submission" (Apple's page, read 28 Oct, first 100,000 of 121,490 characters). The part read does not mention "coming soon". Whether App Review treats such a screen as temporary content is not settled by the text.
- **Decision:** In the store build, while server features are off, the Family tab, the Settings row and the invite entry points are not shown, through the existing capability switch (`lib/capabilities.ts`) and not a new flag. Alpha build 2 (`preview`, servers on) keeps the current screens. Build 1 (`testflight`, servers off) shows them today and would hide them after the change, so the change lands after build 1 is out and the go/no-go (Mon 9 Nov, D-130). The change is a mobile PR with its tests, after the go/no-go (Mon 9 Nov, D-130) and in the same window as `EXPO_PUBLIC_ENGLISH_ONLY=on` in `production`.
- **Fallback:** if the change is not ready when the submission checklist closes, keep the existing screens and describe them in the Notes for Review.
- **Effects:** `docs/store/app-store-staged-1.0-proposal.md` (PR for counsel) carries the matching Notes for Review line. The Family tab returns with co-parent sharing in a later 1.0.x release (D-121).
- **Owner:** mobile agent; store agent for the notes; founder for reversal.
### D-127 Use an open source version: read as no paid inference for the agent harness (the founder's words, 30 Oct 2026; the reading and the operating rule are the coordinator's)
- **Status:** Decided by the founder, 30 Oct 2026, in these words only: "Use an open source version. Why pay for things that good open source versions exist." The coordinator's account of the chat (not in the repo): the founder had earlier that day asked for the harness to be started, and was told that the setup doc's own assumptions are about $2.40 a day typical, $17 heavy and $64 at the cap. Item 1 below reads the founder's words as a rule; items 2 to 4 are the coordinator's operating rule under them, not the founder's words.
- **Source:** the founder's chat of 30 Oct 2026 (the four answers to the CTO's questions); `docs/release/HARNESS_SETUP.md` lines 62 to 64 (the per-day figures: about $2.40 typical, $17 heavy, $64 at the cap; the harness author's assumptions, not measurements); `docs/agents/HARNESS.md` sections 3 and 10 (the licences: OpenCode MIT, DeepSeek and GLM weights MIT; and the $70 to $510 a month range at line 182); `docs/release/decision-briefs/a-harness-actions-lane.md`.
- **Context:** the harness already is open source software on open-weight models (OpenCode, MIT; DeepSeek and GLM, MIT, through one OpenRouter key). What costs money is the model API, which `HARNESS.md` puts at about $70 to $510 a month at the full cap (the author's assumptions, unverified). The coordinator session cannot set repository variables or secrets, and nothing protects `main` or `develop` with a pull request requirement or required checks.
- **Decision:** item 1 reads the founder's words; items 2 to 4 are the coordinator's operating rule under the founder's words (not the founder's words; the founder may reverse any of it).
  1. No money is spent on inference for the agent harness.
  2. The GitHub-hosted harness stays off: `AGENTS_ENABLED` is not set; the held PR #398 (the pinned `agents.yml` for `main`) is not merged.
  3. Agent work continues from the coordinator session (how that session is billed is not recorded in the repo: unverified).
  4. After the go/no-go (Mon 9 Nov, D-130) the coordinator tries a zero-cost route (free hosted open-weight models, or a local one on the founder's Mac) only if it needs no payment card; until one is proven nothing is bought. Any harness that is ever switched on needs branch protection on `main` and `develop` first.
- **Not decided here:** decision brief (b) in `docs/release/decision-briefs/` (the $200 Claude Console credit expiring 3 Nov, PR #316) is a separate question and stays open for the founder.
- **Rationale:** the founder's words. The rest is the coordinator's: fail closed, and the release path needs the review capacity more than a second lane.
- **Effects:** brief (a) of `docs/release/decision-briefs/` is answered for the spend (off); `docs/agents/cto/RULINGS.md` CR-5 (PR #405, merging with this one).
- **Reverses:** nothing. The harness stays built, not run.
- **Owner:** founder (the words); coordinator (the operating rule).

### D-128 Build 2 shows the Privacy row's On or Off; withdrawal comes before any friend (founder, 30 Oct 2026)
- **Status:** Decided by the founder, 30 Oct 2026, by choosing "Show On or Off now; withdrawal before any friend (Recommended)" from the CTO's three options for BL-485. The coordinator's additions: the "Waiting for a connection" fallback, the migration route, counsel reading the withdrawal mode first, and the pre-freeze sequencing.
- **Source:** `docs/BACKLOG.md` BL-485; LEGAL-REQ-006 and LEGAL-REQ-008 (P0); F17 section 6.2 B.
- **Context:** from reading the code (as BL-485 says; not run on a phone: unverified), in a sign-in build the row reads "Not signed in" for a signed-in person because nothing registers a source (`apps/mobile/src/lib/analytics/privacy-sources.ts`), and nothing can withdraw the sensitive-data consent. Build 2 is family-only until the R-17 gate passes (D-100).
- **Decision:** (1) before the freeze the row tells the truth: On or Off for a signed-in person, and "Waiting for a connection" (the Account row's existing string, `account.sync.unknown` in `packages/content/src/features/auth.en.ts:181`) when the state cannot be read, with no withdrawal control; (2) the withdrawal sheet and the server function `withdraw_sensitive_data` are built before any friend outside the family signs in; the function is a migration, which the founder applies through `deploy-db.yml` after two independent reviews and green CI (D-117; the `approve-migration` label is no longer used), and counsel reads the withdrawal mode first (F17 Q4); (3) nothing in build 2 offers withdrawal.
- **Pairs with a counsel note:** BL-485 option (b) comes with a counsel note that says no withdrawal control exists in build 2. The Privacy footer (`settings.privacy.sensitiveHelp`, `packages/content/src/strings.en.ts:848`) says "Turn this off to stop syncing, and we will offer to delete what already synced", which promises a control that does not exist in build 2. The note and the footer wording are follow-ups for the BL-485 owners (legal for the note; the owner of `packages/content` for the footer); this entry changes neither.
- **Rationale:** the smallest change that stops the row stating something untrue, while the P0 requirement stays open for the family-only alpha.
- **Effects:** BL-485 in `docs/BACKLOG.md` (this PR does not edit it; PR #408 does, with option (b)) becomes the work for option (b): the auth owner registers the source with `read` and `subscribe` only, before the Tue 3 Nov freeze. Its done-when is a test that a signed-in account reads On or Off and a signed-out phone reads Not signed in. Until that work merges, the row on `develop` is as BL-485 describes it (code reading, unverified).
- **Reverses:** nothing.
- **Owner:** founder; mobile and auth owners; privacy engineer and data architect for the follow-up; legal for the withdrawal mode and the counsel note.

### D-129 The Delete account row is hidden in the alpha builds unless switched on (founder, 30 Oct 2026)
- **Status:** Decided by the founder, 30 Oct 2026, by choosing "Hide unless the worker and drill pass by Mon noon (Recommended)". The coordinator's additions: that it covers both alpha builds, the EAS-environment route, "Mon noon" read as Mon 2 Nov noon PT, "otherwise hidden through the go/no-go", point (3) and the paragraph on which run gates the switch.
- **Source:** the second review of #393 and the critics' pass of 30 Oct; `docs/release/FOUNDER_QUEUE.md` Q2-07; `docs/qa/DEVICE_TEST_PLAN.md` S1-35 and S2-13; `docs/qa/run-sheets/AL-07-account-deletion.md` AL-07.6a (the sole-parent drill).
- **Context:** the purge worker that performs the deletion on day 30 is not confirmed running on staging, counsel has not yet cleared the deletion lines (they are on the counsel relay list), and nobody has run the sole-parent drill on a phone. Whether Apple's in-app deletion rule applies to a TestFlight build is unverified.
- **Decision:** (1) both alpha builds (`testflight`, `preview`) hide the Delete account row and keep its route unreachable (build 1, `testflight`, has no servers, so it never shows the row; the variable matters in build 2) unless the build variable `EXPO_PUBLIC_ACCOUNT_DELETION` is `on`, which is set in the EAS `preview` environment (not in `eas.json`, so the freeze rule is not touched); (2) it is set to `on` only if, by Mon 2 Nov noon PT, the purge worker runs on staging (Q2-07) and the sole-parent drill passes; otherwise the row stays hidden through the go/no-go; (3) the open-request screen with Cancel deletion is not behind the switch (the Effects line says which phones still have it).
- **Which run gates the switch:** the sole-parent drill (S1-35, S2-13, AL-07.6a) run on a development client with the switch on against staging or on a build with the switch on against staging, and done by Mon 2 Nov noon PT. It does not wait for build 2. Device checks that run between build 2 and the go/no-go (D-130) do not gate the switch.
- **Rationale:** a deletion promise the server may not keep (30 days) must not be offered to testers; reversible.
- **Effects:** `EXPO_PUBLIC_ACCOUNT_DELETION` does not exist in the tree until the switch PR (#409, branch `feat/mobile-account-deletion-switch`) merges; until then the Delete account row is visible in any build that has sign-in on and a signed-in person (server features on). The variable is set in the EAS `preview` environment, and both alpha profiles use `"environment": "preview"` (`apps/mobile/eas.json` lines 43 and 71), so those two profiles need no change after the freeze; #409 itself edits `eas.json` (the `development`, `e2e` and `production` profiles write `on`), so it must merge before the freeze (Tue 3 Nov 13:00 UTC). Point (3) holds only for a phone that lists no book: a phone with an open request and no book gets the open-request screen with Cancel deletion, and a phone that still lists a book (a co-parent, a sole parent who also co-parents another book, or a sole parent before the closing pull arrives) has its Cancel button on the hidden Delete account page (#409 says so too). Go/no-go row B2-13 (account deletion works on staging end to end; never waived) is not changed by this decision, and a hidden row does not satisfy it. `docs/qa/DEVICE_TEST_PLAN.md` lists S1-35 for Build 2 (B2-10); the drill that gates the switch is earlier, on a development client (QA updates that row; not edited here).
- **Reverses:** nothing.
- **Owner:** founder; mobile engineer for the switch; QA for the drill.

### D-130 Dates: freeze Tue 3 Nov, go/no-go Mon 9 Nov (founder, 30 Oct 2026)
- **Status:** Decided by the founder, 30 Oct 2026, by choosing "Freeze Tue 3 Nov, go/no-go Mon 9 Nov (Recommended)". The hour of the freeze, 5:00 AM PT (13:00 UTC), is not part of that choice: it is the coordinator's (`docs/agents/BOARD.md` line 117).
- **Source:** the founder's chat of 30 Oct 2026; `docs/release/AUTOMATION.md` section 6 (the earlier proposals); `docs/agents/BOARD.md` line 117 (the hour).
- **Context:** build 2 needs about 6 hours of the founder's setup on Mon 2 Nov (`docs/release/FOUNDER_QUEUE.md` section 0, PR #405), no build exists yet and nothing has run on a phone. The coordinator had proposed the go/no-go for Thu 5 Nov.
- **Decision:** the build 2 code freeze is Tue 3 Nov 2026 and the go/no-go is Mon 9 Nov 2026. The coordinator's hour for the freeze is 5:00 AM PT (13:00 UTC; DST ends Sun 1 Nov). The device checks marked Build 2 (B2-10) in `docs/qa/DEVICE_TEST_PLAN.md` run between build 2 and the go/no-go. The one check that is needed earlier is the sole-parent deletion drill (S1-35, S2-13, AL-07.6a): D-129 needs it by Mon 2 Nov noon PT, on a development client or a build with the switch on against staging, so it does not wait for build 2.
- **Rationale:** the Recommended option, as the Context frames it: about 6 hours of setup remain, no build exists and nothing has run on a phone, and Thu 5 Nov was two days after the freeze where Mon 9 Nov is six. The founder's own reasons are not recorded here.
- **Supersedes:** the "proposed" status of the Tue 3 Nov freeze in D-089 (it is confirmed here); the go/no-go date, and one sentence about the freeze, in PR #340 (merged in 46a75a3; D-123 and D-124 are on `develop`), so this took effect when #340 merged. In D-124: the go/no-go date Thu 5 Nov (the index row; item 1, including its "waits until after 5 Nov" for the `production` change named in D-121; item 5, "after the 5 Nov go/no-go"), and the sentence in item 1 that the freeze "moves day for day" if build 1 is not uploaded by Mon 2 Nov (the freeze is now fixed at Tue 3 Nov). In D-123: the index row and items 2 and 4 ("before the 5 Nov go/no-go", "before 5 Nov"). Also in #340: D-121's Effects line, D-122 item 4 ("Revisit after the 5 Nov go/no-go") and the D-126 index row and Decision ("the code change waits for the 5 Nov go/no-go"). Each now reads Mon 9 Nov: when #340 merged, D-121's Effects line, D-122 item 4, the D-126 index row and Decision, the D-123 index row and item 2, and D-124 item 5 already did, and the sweep after the merge changed the rest (the D-124 index row and item 1, where the "moves day for day" sentence is replaced by a line saying the freeze is fixed, and D-123 item 4). Other proposed Thu 5 Nov statements in `docs/` were swept in that same change, except the 2025 New York law dates in `docs/legal` and the question as asked in `docs/agents/BOARD.md` line 86.
- **Effects:** the freeze rule (`docs/release/AUTOMATION.md` 0.2 item 17: no workflow, `eas.json` or `app.config.ts` change between the freeze and the go/no-go, except an S0 or S1 fix) now covers Tue 3 Nov 13:00 UTC to Mon 9 Nov, six days instead of two. Swept: `docs/release/`, `docs/qa/`, `docs/ops/RELEASE.md`, `docs/agents/BOARD.md` and `docs/agents/hardening/scope-and-drift.md`; after #340 merged, also `docs/backlog/FUTURE-REBASELINE-2026-10-28.md`, `docs/store/app-store-staged-1.0-proposal.md` and `docs/release/decision-briefs/README.md`.
- **Reverses:** nothing.
- **Owner:** founder; coordinator.

### D-131 Blocked countries (founder, 31 Oct 2026)
- **Founder's words:** "all santcioned countries can be totally blocked" and "block any other sensitive country like russia, syria, etc too if that exposes me to risk."
- **Decision:** sign-up (the `before user created` auth hook) and the web contribution page refuse people located in North Korea (KP), Iran (IR), Cuba (CU), Syria (SY), Russia (RU) and Belarus (BY). The web page also refuses Crimea (UA-43), Sevastopol (UA-40), Donetsk (UA-14) and Luhansk (UA-09); the auth hook cannot resolve regions from country data, so there they are covered by the Terms 2.4 confirmation.
- **Why each (Chief Compliance Officer, Claude role, not counsel; sources read 31 Oct 2026, eCFR current to 29 Oct):** KP, IR and CU are under comprehensive US embargoes (OFAC 31 CFR 510, 560, 515; EAR Country Groups E:1 and E:2). Syria's OFAC countrywide program ended in 2025, but EAR 15 CFR 746.9 still needs a licence for our encrypted software and Syria is still in E:1. Russia and Belarus: EAR 15 CFR 746.8 needs a licence for items with an ECCN; License Exception CCD (740.19) may cover consumer software but excludes named officials we cannot screen for, so they are blocked on a lean-to-block basis. Not blocked: Venezuela, Burma, Afghanistan, Sudan, where sanctions name people and entities, not the country.
- **This settles:** the Iran and Cuba question in CR-26 (blocked regardless of OFAC GL D-2 and 31 CFR 515.578), so Terms 2.4 needs no change.
- **Counsel to confirm (COUNSEL_PACKET, with the CLO):** whether the app is subject to the EAR at all (734.7 "published"); CCD for Russia and Belarus; the 5D992.c self-classification and any 740.17 reporting; whether sign-up blocking is enough when US-storefront downloads are not gated; Kherson and Zaporizhzhia; residual risk from listed persons in non-blocked countries.
- **Revisit:** before each store submission (the CCO re-reads the sources); Syria only after BIS removes it from E:1 and amends 746.9.
- **Implemented by:** `ops.restricted_jurisdictions` seed in `supabase/migrations/20261031000000_compliance_gates.sql` (PR #424, held until after the 9 Nov go/no-go).
- **Owner:** founder; Chief Compliance Officer.
### D-132 Merge decisions go to Karma (founder, 31 Oct 2026)
- **Founder's words:** "merge. dont ask me for merge decisions. ask cto."
- **Decision (the founder's):** merge decisions go to Karma, the CTO role, not to him.
- **Gates and limits (Karma's reading; the founder may reverse it):** Karma decides and performs merges, including the classes D-107 kept for the founder (database, auth, `.github/**`, release configuration) and merging `docs/DECISIONS.md` entries that record his own words. The gates stay: two independent counted reviews on the current head, green CI, and for fenced compliance paths the CCO and Karma approvals (CR-27).
- **Not delegated:** `docs/legal/**` (counsel-facing text stays a founder merge), applying a migration to a hosted project, any external account, secret or money step, and changing what users are promised. Those stay founder steps.
- **Amends:** D-107's founder-only merge list; D-117's operating rule (the merge now needs no separate founder action); D-125 item 5 for `docs/DECISIONS.md` only (Karma merges entries that record the founder's own words; `docs/legal/**` stays his).
- **Follow-up:** Karma's skill, section 3, still lists "merging `docs/DECISIONS.md` and legal text" as founder-only; update it to point here.
- **Owner:** founder; Karma.

### D-133 Notes ship in v1.0, and the public promise says only what is true (founder, 31 Oct 2026)
- **Founder's words:** his answers to Karma's questions on 31 Oct. On notes: "Build it for v1.0", then "Count them like letters". On the promise: "think more", and after the second round, "Use the true line now" and "Same true line in the store build".
- **Decision 1, notes:** v1.0 makes notes. F04-REQ-014 stays P0. The note-or-letter control is built in Review, using F06 Q10's default: inside the dateline sheet, collapsed by default. Drafts start as `letter`. A kept note counts toward the free letters exactly like a letter, so `COUNTED_LETTERS_SQL` (`apps/mobile/src/lib/db/repos/ledger.ts:49`, today `kind = 'letter'`) counts `kind IN ('letter', 'note')` in the same pull request that makes notes. Otherwise filing everything as a note would bypass the Plus gate.
- **Decision 2, the promise:** "every word exactly as you said it" is not true of the words: the default view removes ums and repeats, and the speech model can mishear. Public surfaces (the website, its emails and the store listing) say what is true instead: "It stays in your words. Every change is marked, and your original recording is kept unchanged." The store build's first-run headline uses the same true wording. The alpha keeps "Exactly as you said it." as D-125 item 9 left it. "Word for word" stays the in-app name of the feature. Waiting for counsel was considered and rejected, because counsel cannot make the old sentence true.
- **Why (Karma, debated):** an independent challenger read the code and found three problems:
  - the default Review view is the one with fixes (`review-view.logic.test.ts:31`);
  - the "Exactly as said" view is raw machine output;
  - the player plays a cleaned listening copy by default (`apps/mobile/src/lib/player/index.ts:4-5`), so even "your voice kept exactly" would overclaim. Only the original file is unchanged.
  Apple 2.3.1(a), read 31 Oct, targets advertising features an app doesn't offer and false prices, so the App Review risk is lower than first argued. The real risks are consumer-protection rules on deception (UNVERIFIED for this case; counsel's call) and parents' reviews.
- **Amends:** D-125 item 9 (the listing now uses the true line, and the store build's first run uses it too); the nomenclature audit's R-D (#422: the listing adds notes back in the same pull request that ships them).
- **Effects:**
  - The website PR #437 applies decision 2 on `main` and adds a copy-rules test.
  - The brand tagline in `packages/brand/index.ts` ("Exactly as you said it.") is drawn into the share image and the video end card (registry ids for `og.image` and the end card). The brand lane picks a short true tagline and redraws those pictures. Until then the tagline is the one exception the website rule allows.
  - The notes work package lands after the 9 Nov go/no-go (D-130), because the freeze starts 3 Nov and other branches touch `strings.en.ts`. It covers the control, the ledger, the Book's note label and month lines, the export readme, and the store listing's notes line.
- **Owner:** founder; Karma for the build; the CMO and the brand lane for the tagline.
### D-134 Individual publisher, no LLC for now (founder, 31 Oct 2026)
- **Founder's words:** "We are not doing Llc. We just did personal account setup right so let's go with that. I am not yet ready to take llc tax obligations"
- **Decision (the founder's):** 1.0 ships from the individual Apple Developer account (Team VX2Z7FGV23, enrolled as Individual), with his legal name as seller. No entity is formed now.
- **What this closes:** D-125 item 6 (the production record waited for this call by 13 Nov; this is the recorded deferral it asked for) and the entity part of COUNSEL_PACKET Q1 for 1.0. Karma's CR-36 recommendation was individual first with an LLC in parallel; the founder declined the parallel LLC.
- **Facts behind it (read 31 Oct 2026):** Apple says a sole proprietor enrolls as an individual and the legal name shows as seller (developer.apple.com/support/enrollment). An app can move to another developer account once it has one released version, and the bundle id moves with it (App Store Connect help, "App transfer criteria" and "Overview of app transfer"), so an entity later stays possible. California's LLC tax is $800 a year, and the first-year exemption covered only tax years that began from 2021 to 2023 (FTB page read 1 Nov 2026; an accountant or counsel confirms).
- **Risks that follow:** claims about the app are claims against him personally; Apple guideline 5.1.1(ix) (entity for apps that "require sensitive user information") remains a review risk (D-004). Counsel must confirm both; Q1 stays open for liability and insurance (Q1(d)).
- **Name gate (D-121, FT-28):** knockout search run 31 Oct 2026 on USPTO Trademark Search: no live or dead mark "EARLY LETTERS" or "EARLYLETTERS"; nearest is "EARLY" (Acorns Grow Incorporated, serial 90023397, classes 9 and 42, live, financial software). App Store US search for "early letters": no app with that name (phonics and letter apps only). Not a clearance opinion; the "EARLY" mark goes to counsel under Q10.
- **Effects:** Karma creates the App ID `com.earlyletters.scribe` and the app record "Early Letters: Memory Book" (Lifestyle) when Apple's sign-in allows; `submit.production` in `apps/mobile/eas.json` then gets its `ascAppId`.
- **Owner:** founder; Karma for the App Store Connect steps.

### D-135 Basic hand-offs go by email, with a timestamp (founder, 1 Nov 2026, 05:19 UTC)
- **Founder's words:** "just save to earlyletters@gmail.com and send an email there. automate such basic things, keep cto and harness informed, do in documentation with timestamp".
- **Decision (the founder's):** when a step for him is only saving, filing or forwarding something (a skill proposal to save, the exact approval lines for a fenced PR, a status pack), the session emails it to earlyletters@gmail.com instead of asking him, and records what it sent, with a UTC timestamp, in the Project doc `infra/founder-handoffs.md` (CR-41).
- **Limits (Karma's reading; the founder may reverse it):**
  - Only that address, only from an interactive session. Unattended harness runs have no write connectors (CTO skill section 9), so they record the hand-off for the next interactive session to send.
  - Never in an email: letter text, transcripts, audio, a child's name, real family details, secrets, keys or tokens.
  - An email is a record, not an approval. Money, accounts, applying migrations, merging `docs/legal/**` and the approval comments a fenced PR needs stay his (D-132, CR-27). The email carries them ready to paste.
- **Kept informed:** Karma's skill, section 3, points here; the harness reads this file from `develop` at run time; CR-41 records the procedure.
- **Owner:** founder; Karma.
### D-136 The Privacy Policy discloses the sign-up country check (founder, 1 Nov 2026, 05:19 UTC)
- **Founder's words:** "add in privacy policy, assign chief legal officer to work and update docs with cto".
- **Decision (the founder's):** the Privacy Policy says that when someone creates an account, our server uses the IP address of that request to work out which country it comes from, and refuses sign-up from the places D-131 lists. The IP address is not stored for this check. Only daily counts of checks by result are kept, with the country code for refused sign-ups only, for two years.
- **How:** the Chief Legal Officer drafts the text into the next policy version (3.0.0, PR #163), under that version's rule that a part takes effect only when the feature ships (CLO-3). Karma updates the other docs. The privacy label is unchanged (CPrivO-2).
- **Still the founder's:** merging `docs/legal/**` (D-125, D-132). Counsel must confirm the wording (COUNSEL_PACKET Q57).
- **Owner:** founder; Chief Legal Officer; Karma.
### D-137 No name screening against restricted-party lists for now (delegated, 1 Nov 2026, 05:19 UTC)
- **Founder's words:** "decide on name screening against restricted-party lists, with counsel (the default is none); Decide with compliance, legal, cto and finish".
- **Decision (Chief Compliance Officer, Chief Legal Officer and Karma, under that delegation; Claude roles, not counsel):** v1.0 and its 1.0.x releases do not screen names against the OFAC SDN List or any other restricted-party list. The controls are the Terms 2.4 confirmation, the D-131 country block at sign-up, the US-only App Store storefront, and taking no payments ourselves (Apple sells Plus).
- **Why:** OFAC recommends "a risk-based approach" fitted to the business, with "the company's size and sophistication" as a factor (A Framework for OFAC Compliance Commitments), and its Enforcement Guidelines (31 CFR 501 Appendix A) weigh a risk-based programme and small-business status when deciding a penalty. Screening would make us collect full legal names, and in practice dates of birth to clear false matches, that the product otherwise never needs; that works against data minimisation and our privacy promises. Sources read 1 Nov 2026. Full reasoning and the challenge: CCO-5.
- **The risk we accept, stated plainly:** OFAC civil liability is generally strict, and the program rules bar providing services to a blocked person with no payment threshold (for example 31 CFR 510.201). So one listed person on a free account would still be a violation; Apple selling Plus does not remove it, and a US-only storefront does not rule out a listed person with a US Apple ID. Not screening lowers our cost and data, not that exposure. A risk-based programme counts in mitigation.
- **What we do instead:** support checks a name against OFAC's Sanctions List Search when a report or an escalation gives a reason to (`docs/ops/runbooks/sanctions-match.md`), and a possible match follows that runbook: suspend, never delete, counsel the same day, and a blocked-property report within 10 business days if counsel says one is due (31 CFR 501.603, read 1 Nov 2026).
- **Revisit when:** we take a payment ourselves; the app opens outside the US storefront; the web contribution page lets people in without an account or from outside the US; any feature moves value between people (a gift, a printed book shipped abroad); OFAC issues guidance or an enforcement action about consumer apps; counsel says otherwise; or we learn a listed person uses the service.
- **Counsel must confirm:** COUNSEL_PACKET Q57, with the D-131 counsel list.
- **Owner:** founder; Chief Compliance Officer.
