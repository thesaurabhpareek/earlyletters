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

## Decisions that still need the founder (in priority order)

1. **D-023** Sync engine: outbox plus cursor on expo-sqlite (reverses ADR 0004). Needed by 16 Oct.
2. **D-032** Shared voice in v1.0 (family hear each other's recordings, free; full backup stays Plus). Needed by 23 Oct.
3. **D-001 tooling** StoreKit 2 direct versus RevenueCat (ADR 0013). Override window closes when BL-213 starts (about 9 Nov).
4. **D-030** Beta on TestFlight; no beta line in the store listing. Needed before the store listing is written (week 13).
5. **D-004 hedge** Accept the guideline 5.1.1(ix) risk as an individual, or start an entity in parallel. Needed by 27 Nov.
6. **D-045** C1 friendly-family beta only before submission (public link after). Needed by 4 Dec.
7. **D-034** Safety classifier only with a clinician's sign-off by 20 Nov, else a static resources row.
8. **D-033** Free durability through the user's own device backup, and the copy fix.

Also open but not founder-only: D-031 Hindi script (founder, from data, 30 Oct), D-050 second consent (counsel).
