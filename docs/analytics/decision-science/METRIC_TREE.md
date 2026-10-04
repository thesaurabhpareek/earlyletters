# Metric tree and North Star

Owner: decision scientist (`decision-science`). Status: Draft 3, 4 Oct 2026 (Draft 2 of 3 Oct plus the v1.0 on-device-only update in 3.0), for founder, PM and analytics engineer review.
Inputs: `docs/prd/PRD.md` 1.3 (sections 1, 3.0, 7.8), PRD A, B and C section 1 goals, C sections 8 and 9, `docs/analytics/TRACKING_PLAN.md` Draft 1, `docs/research/USER_RESEARCH.md`, `docs/agents/BRIEF-2026-10-03.md` (decisions 3, 5, 9, 10, 11, 12), `docs/DECISIONS.md` (D-003, D-030, D-036, D-045), `docs/ROADMAP.md` (M12), `docs/tdd/06-performance-reliability.md` 2.1, migrations in `supabase/migrations/`.

Labels: **Fact** (from a repo document, the schema or a cited Apple page), **A** (assumption, to be replaced by observed cohorts), **Decision** (proposed here, reviewable), **Open** (needs an owner), **R-n** (a request in section 7).

There is no user data yet. Every number in this file is a target, an assumption or arithmetic, never an observation.

---

## 0. Summary

1. **North Star: Weekly keeping families (WKF)**, the tracking plan's metric with exact counting rules added (section 2). It counts families, not letters, and it counts private letters too, so it never rewards pushing words into the shared book.
2. **Seven input metrics** map to the goals in PRD A, B and C section 1 (section 3). A parallel **business branch** covers Plus and is never an input to WKF.
3. **v1.0 scope.** Family at launch is the co-parent only, and a recording plays only on the phone that made it (brief decisions 5 and 9). WKF and every input read at v1.0 use only that behaviour. Contributor, family-letter and hearing-others metrics are kept in a separate v1.1 section (3.5) and are not read until those features ship.
4. **Guardrails** cover privacy, trust and fidelity, calm (no streaks, no gap counts), free-forever and paywall respect, and reliability (section 4).
5. **Consent bias** is structural, not only statistical: the analytics sheet is the third ask, so device data never contains people who stopped after one or two sessions. Every device number carries a fixed bias statement (section 5).
6. **Before launch nothing about people is measurable.** The C1 beta (15 to 25 families, A) supports counts with wide intervals and no rate targets. TestFlight purchases run in Apple's sandbox, so no price or conversion data exists until launch (section 6).
7. **v1.0 is on-device only (founder decision, 3 Oct, brief decision 5 as amended).** There is no sign-in, no sync and no server copy of letters, and co-parent sharing is v1.1. So the server aggregates behind WKF and most inputs (section 1) have no data at v1.0. WKF and the server-read inputs are v1.1 metrics; at v1.0 only ASC and opt-in device numbers exist, always labelled as such (3.0, update of 4 Oct).
8. **Founder decision 3 (3 Oct) removes every server purchase source.** The tracking plan and PRD-REQ-017 still name RevenueCat and a server purchase ledger. Plus totals must come from App Store Connect reports (R-3, R-9).

---

## 1. Sources and who each one sees

| Source | Covers | Misses | Used for |
|---|---|---|---|
| **ASC Sales** (App Store Connect Sales and Trends, subscription reports) | First-time App Units: the first "Get" per Apple Account; redownloads and extra devices are not counted (Fact: Apple's metric definition). Every purchase. Whether any of it depends on a user's data-sharing choice is not stated by Apple (Unverified) | Anything inside the app. Cannot be joined to our accounts (decision 3: no server of ours sees purchases) | New users, trials, conversions, Plus mix |
| **ASC App Analytics, Xcode Organizer** | People who share analytics with developers in iOS settings (Apple's consent; TDD 06 2.1) | Our events; people who said no to Apple | Crash rate, launch time (release gate source, D-003) |
| **Server aggregates** (BL-024, PRD-REQ-017) | Signed-in accounts that accepted the sensitive-data consent and have synced | Letters kept only on the phone: no account, or sensitive-data consent declined (K-15) | WKF, accounts, books, letters, family, retention, consent split |
| **Device analytics** (PostHog, opt-in) | People who said yes on the analytics sheet, from that moment on | First run (always), everyone who declined or was never asked | How the product is used inside the app |

Rule (from TRACKING_PLAN 0.5, kept): headline numbers come from server aggregates or ASC Sales only. Device numbers explain behaviour; they never set a headline.

---

## 2. North Star: Weekly keeping families (WKF)

### 2.1 Definition

**WKF for week W** is the number of families with at least one kept letter whose capture time falls in week W.

### 2.2 Counting rules

| Rule | Definition |
|---|---|
| Family | The set of `children` rows connected through `child_members` rows with `role = 'parent'` (a co-parent is `parent`). Computed inside Postgres by the aggregate job; family membership is never stored or exported (Decision). |
| Kept letter | A `public.entries` row with `kind in ('letter', 'note')` and `deleted_at is null` when the week is computed, in a child whose `deleted_at is null`. |
| Not counted | `kind = 'not_much'`: the one-tap "Not much today" line is a template (`notMuch.template` in `packages/content`), not the author's words. It is reported as its own weekly count, never added to WKF (Decision). |
| Destination | Both count: `in_book = true` and private (`in_book = false`). Private by default is a product principle (B goal 5, B-REQ-011). A North Star that counted only book letters would reward moving private words into the shared book (Decision; differs from TRACKING_PLAN 1.1, see 2.5). |
| Authors | At v1.0 every author is a parent: the founding parent or the co-parent (`child_members.role = 'parent'`). The app hides the contributor path in v1.0 (brief decision 5). The rule for contributor letters from v1.1 is V11-01 in section 3.5. |
| Time | `entries.captured_at`, bucketed into ISO weeks, Monday 00:00 to Sunday 24:00 UTC (Decision, A-4). If `captured_at` is later than `created_at` (device clock ahead), use `created_at`. Never `occurred_on`: parents backdate memories on purpose ("Before You", hindsight writing, UR 3). |
| Late arrival | Offline letters sync late. A week stays provisional for 14 days after it ends, then is frozen (A-5). Letters whose `created_at` is more than 14 days after `captured_at` do not change frozen weeks. An example is a local-only parent who signs in months later. Those letters go into a **backfilled letters** count for the week they arrived. Deletions after a week is frozen do not change it either. |
| Hidden books | Letters in a hidden book (`children.hidden_at` not null) count like any other. Hiding a book is never treated as churn (4.3 item 7). |
| Exclusions | Internal accounts: the founder, C0 phones and the App Review demo account (R-6). Non-production builds (R-5). |
| Columns read | `entries.id`, `child_id`, `author_id`, `kind`, `captured_at`, `created_at`, `deleted_at`, `in_book`, `approval`, `capture_mode`, `sounds_like_me`; `children.id`, `deleted_at`, `hidden_at`; `child_members.child_id`, `profile_id`, `role`. Never `raw_transcript`, `final_text`, `machine_edits`, `stt_meta`, `search`, names, dates of birth or due dates. |
| Suppression | Any reported cell under 10 families shows as "under 10" (TRACKING_PLAN 1.4). |
| Visibility | Internal only. Never shown to any user in any form: no count, rank or comparison (C-REQ-015). |

### 2.3 Why this metric

- **It measures the job.** The product is "a baby memory book families fill by talking" (PRD 1). A family keeping a letter is the value moment; opens, sessions and notifications are not.
- **It counts families, not letters.** One family writing ten times a week adds one, not ten. That fits C goal 1 (a calm rhythm of 1 to 3 letters a week) and removes any reason to push volume.
- **It rises with family participation.** At v1.0 a co-parent can keep a family in WKF in a week the first parent does not write. PRD 1 adds that "grandparents write too"; that path is v1.1 (brief decision 5), and then the same holds for them (V11-01).
- **It cannot be raised by the paywall.** Writing is free forever, so Plus decisions move WKF only through real value.

Rejected alternatives:

| Alternative | Why not |
|---|---|
| Total letters per week | Rewards volume from a few heavy families; pressures frequency (C goal 1, UR 3 on guilt) |
| Letters added to the book | Rewards moving private words into the shared book (B goal 5) |
| Daily or weekly active users, opens | Measures attention, not letters kept; rises with notifications |
| Books created | A one-time act; says nothing about keeping |
| Paying subscribers | A business number; the free-forever core is the product's promise (C goal 2) |
| Minutes recorded | Rewards length; a short letter is a full letter |

### 2.4 Companion numbers (reported with WKF, never alone)

| Name | Definition | Why |
|---|---|---|
| **MKF**, monthly keeping families | Families with at least one kept letter in the 28 days ending on the last day of week W | Families who write on birthdays or monthly are real keepers |
| **Rhythm ratio** | WKF / MKF for the same week end | Rising means more families write most weeks (C goal 1). Aggregate only; no per-family score |
| **Voices** (FV28) | Families with kept letters from 2 or more distinct `author_id` in the 28-day window / MKF. At v1.0 every author is a parent, so FV28 means two parents wrote | Family participation. A 28-day window because co-parents write on their own cadence (UR 3) (Decision; TRACKING_PLAN uses one week) |
| **Letters per keeping family** | Kept letters in week W / WKF | Context only. No upward target (IN-05) |
| **Growth accounting** | WKF(W) = new (first kept letter ever in W) + continuing (also kept a letter in W-1) + returning (kept letters before, none in W-1) | Shows whether WKF grows from new families or from habit. Computed in Postgres; no family is labelled or contacted |
| **Sync coverage** | New accounts with a first kept letter in month M (server) / App Units in month M (ASC Sales) | Shows how much of the user base the server can see. A period ratio, not a cohort: label it "approximate" |
| **Backfilled letters** | See 2.2 | Shows how much keeping happened off the server's view first |

### 2.5 Differences from TRACKING_PLAN 1.1 (R-2)

| TRACKING_PLAN 1.1 | This file | Reason |
|---|---|---|
| "At least one letter **added to a child's book**" | Any kept letter, book or private | B goal 5; avoids rewarding sharing |
| Kind not stated | `letter` and `note`; `not_much` reported apart | A template line is not the author's words |
| Window "last 7 days" | ISO weeks in UTC on `captured_at`, 14-day restatement, backfill counter | Reproducible weekly series; offline sync |
| "Two or more voices in the week" | Two or more voices in 28 days | Co-parent cadence is uneven (UR 3) |

---

## 3. The tree

```
North Star: WKF, Weekly keeping families (server)
|
+-- IN-01 First letter                       A goal 1, B goal 1
+-- IN-02 Keep the book                      A goal 2
+-- IN-03 Activated writer                   C goal 1
+-- IN-04 Active writers and retention       C goal 1
+-- IN-05 Letters per family, mode, place    C goal 1 (no upward target)
+-- IN-06 Family voices (v1.0: co-parent)   A goal 4
+-- IN-07 Value moments (device only)        PRD 1, C goal 2

Business branch, parallel, never an input to WKF:
    BZ-01 to BZ-06 Plus                      C goal 2

Guardrails, a breach stops a launch decision or an experiment:
    GR-01 to GR-11                           A goal 5, B goals 4 and 5, C goal 4, CLAUDE.md

v1.1, not read at v1.0 (section 3.5):
    V11-01 to V11-06                         B goals 3 and 4, PRD 1 (grandparents)
```

### 3.0 v1.0 scope

Two founder decisions (BRIEF 2026-10-03) set what v1.0 can produce:

- **Decision 5:** family at launch is the co-parent only. The database supports contributors, but the app hides that path in v1.0. The web contribution page is v1.1 (decision 9; PRD K-35).
- **Decision 9:** family members do not hear each other's recordings in v1.0, and audio is not uploaded. A recording plays only on the phone that made it.

So, at v1.0:

- Every author is a parent (founding parent or co-parent). FV28 means two parents wrote.
- IN-06 is co-parent invites and their acceptance only.
- Metrics that need contributors, family letters, approvals or another person's audio would read zero by design. They are moved to section 3.5 under new ids (V11-01 to V11-06), and each row names the Draft 1 id it replaces.
- Under decision 12, agents do not read a section 3.5 metric before its feature ships, and a zero there is never a finding (4.6).

**Update, 4 Oct 2026: v1.0 is on-device only.** After Draft 2 the founder decided that v1.0 ships with no sign-in, no sync and no server copy of letters, and that co-parent sharing, sign-in and sync move together to v1.1 (brief decisions 4 and 5, as amended in PR #33). That is stronger than decision 5 as quoted above, which still allowed a co-parent at v1.0. Consequences for this document:

- **Server aggregates (BL-024, PRD-REQ-017) have no data at v1.0**, because nothing leaves the phone. Every definition in sections 2 and 3 that reads `entries`, `children`, `child_members`, `child_invites` or `profiles` is a **v1.1 definition**, kept as the design for when sync ships. That includes the North Star (WKF, 2.1), its companions, IN-02 (a), IN-03, IN-04, IN-05 (server), IN-06 (a) to (c) and the cohort definitions in 3.2. FV28 and co-parent invites and acceptance (IN-06) need two phones sharing a book, so they are v1.1 as well.
- **What exists at v1.0:** ASC Sales and App Analytics (new users, trials, conversions, crashes; section 1), and opt-in device analytics (PostHog) among people who consented. The only v1.0 reads of the input metrics are the device-side rows: IN-01 (a), IN-02 (b) is not meaningful with no sign-in, IN-05 device detail and IN-07 (a), (b), (d). IN-01 (b) cannot be computed without server counts of founding parents; use ASC App Units and device counts, labelled.
- **No v1.0 North Star.** A device-only proxy (consenting devices with a kept letter in the week, from `letter_saved`) may be reported as "among people who opted in", with the four-part bias statement of 5.4. It is never a headline and never called WKF (the rule in section 1 stands: headlines come from server aggregates or ASC Sales only). Whether to accept a device proxy for v1.0, or to run v1.0 with ASC numbers and interviews alone, is a founder decision (Open-5 in section 8).
- Section 6.1 reads accordingly: in the C0 and C1 columns and "After launch" for v1.0, every cell that depends on a server aggregate reads "v1.1". Plus (BZ) is unchanged, because it already comes from ASC only.
- `docs/DECISIONS.md` (D-002, D-044), the PRD and the ROADMAP on `develop` still describe co-parent and sign-in at v1.0 and have not been reconciled; this document follows the brief.

### 3.1 PRD goals to metrics

PRD.md has no goals section of its own; the goals live in section 1 of each appendix (Fact).

| Goal | Metric | Kind |
|---|---|---|
| PRD 1: families fill the book by talking; co-parents and grandparents write too | WKF, FV28, IN-06. At v1.0 the family is two parents (decision 5); grandparents from v1.1 (V11-01) | North Star |
| A G1: first letter within 90 s median of first launch | IN-01 | Input |
| A G2: 70% of first-letter users create an account within 7 days | IN-02 | Input |
| A G3: back in the book on a new phone in under 2 minutes | Not an analytics metric: QA restore drill (BL-284) | QA |
| A G4: invited family land on the right book | IN-06(c) (`invite_opened` to `invite_accepted`). At v1.0 the invited person is a co-parent; other family from v1.1 (V11-03) | Input |
| A G5: no content, names or audio in entry analytics | GR-01, GR-02 | Guardrail |
| B 1: first letter with only two child facts | IN-01 | Input |
| B 2: authors sign as who they are and speak their own languages | Not measured, by design: signatures and languages are L4 (TRACKING_PLAN 3.4, 6.2) | None |
| B 3: grandparent first letter from a link, no install | **v1.1.** The web page (decision 9, K-35) and the in-app contributor path (decision 5) are both deferred, so there is no v1.0 metric. V11-04 from v1.1 | v1.1 |
| B 4: parents control the book without editing anyone's words | At v1.0: GR-05 (fidelity of machine edits). Approving family letters is v1.1 (V11-05) | Guardrail; input from v1.1 |
| B 5: private by default | Destination has no target (2.2); GR-03 | Guardrail |
| B 6: every personalization question changes something visible | Not an analytics metric (design review) | None |
| C 1: calm rhythm, 1 to 3 letters a week, lasting past month 6 | IN-03, IN-04, IN-05, GR-07 | Input |
| C 2: Plus revenue without making the free book feel smaller | BZ-01 to BZ-06, GR-08 | Business, guardrail |
| C 3: every control within 2 taps | Not an analytics metric (QA) | None |
| C 4: measure the funnel without content | GR-01, GR-02 | Guardrail |

### 3.2 Shared definitions

- **Kept letter (server):** section 2.2. **Kept letter (device):** one `letter_saved` event. Until R-1 lands, device counts may include "Not much today" entries, because `letter_saved` has no `kind`. The rows that read `letter_saved` say so: IN-05 device detail and GR-07 usefulness.
- **First-letter account (server):** a profile with at least one kept letter as author. Its **cohort** is the ISO week of its earliest kept letter's `captured_at`. Cohorts are split by role: **founding parents** created a child (`children.created_by`); **joiners** joined through an invite. At v1.0 every joiner is a co-parent; contributors join from v1.1.
- **Relative windows:** day 0 is the day of the first kept letter. "Week k" is days 7k to 7k+6.
- **Consenting active user (device):** a distinct analytics id with at least one `app_opened` in the window. An id lasts one consent period (TRACKING_PLAN 7), so device retention is never used; retention comes from the server.

### 3.3 Input metrics

| ID | Metric | Exact definition | Source: events and properties, or tables and columns | Target (A unless noted) |
|---|---|---|---|---|
| IN-01 | First letter | (a) Among `analytics_opted_in` events: share with `time_to_first_letter = lt_90s`, excluding `unknown` and events with `first_letter_mode = none`. A median of 90 s or less means this share is 50% or more. (b) Lower bound for all users: new founding parents with a first kept letter in month M / ASC App Units in month M. App Units include invited co-parents and people who never pass the 18+ gate, which also pulls the ratio down | (a) Device: `analytics_opted_in.time_to_first_letter`, `.first_letter_mode`, `.surface`. (b) Server `children.created_by`, `entries`; ASC Sales | Median 90 s or less (A G1) |
| IN-02 | Keep the book | (a) Server: founding parents whose account exists by day 7 of their first kept letter / founding parents in the cohort. This is computable only for people who eventually sync, so it overstates. (b) Device: share of `analytics_opted_in` with `signed_in = true`, by `days_since_install` | (a) `profiles.created_at`, `entries.captured_at`. (b) `analytics_opted_in.signed_in`, `.days_since_install`; `auth_succeeded{new_user}`, `auth_deferred{trigger}` after consent | 70% (A G2). Decision trigger 50% (A Q2), R-8 |
| IN-03 | Activated writer | First-letter accounts with kept letters on 2 or more distinct UTC dates of `captured_at` in days 0 to 13 / first-letter accounts in the cohort | Server `entries.author_id`, `captured_at` | Set after first cohorts |
| IN-04 | Active writers and retention | Active writer: account with 1 or more kept letters in the week. Week-4 retention: cohort accounts with a kept letter in days 28 to 34 / cohort size. Month-6 retention: a kept letter in days 150 to 179 / cohort size. Founding parents and joiners are reported apart | Server `entries` | Week 4: 35% or more. Month 6: 20% or more (C section 9, A) |
| IN-05 | Letters per keeping family, by mode and place | Kept letters / WKF per week. Mode: `entries.capture_mode` (`spoken`, `typed`, `mixed`). Place: `in_book` share. Device detail among consenters: `letter_saved.prompt_kind`, `.words_bucket`, `.audio_bucket`, `.from_notification_2h`. **Device rows may include "Not much today" until R-1** | Server; device `letter_saved` | **No upward target.** The aim is a rhythm (C goal 1), not volume. Book share has no target (B goal 5) |
| IN-06 | Family voices (v1.0: co-parent only) | (a) FV28 (2.4): at v1.0, two parents wrote. (b) Co-parent invites: books with 1 or more invites with `child_invites.role = 'parent'` created within 30 days of `children.created_at`. (c) Co-parent acceptance: those invites with `accepted_at` not null and `revoked_at` null / those invites created; device `invite_opened` to `invite_accepted{role}` (co-parent value) among consenters. At v1.0 every invite is a co-parent invite, so `invite_opened`, which has no `role`, needs none. Contributor invites, acceptance and family letters (Draft 1 IN-06(b) and (c) by contributor role, and IN-06(d)) are v1.1: V11-02, V11-03, V11-05 | Server `child_invites.role`, `created_at`, `accepted_at`, `revoked_at`; `children.created_at`. Device `invite_created{role, channel}`, `invite_opened{via}`, `invite_accepted{role}`. The device co-parent value is `co_parent` on develop (TRACKING_PLAN) and becomes `parent`, the server value, if PR #31 merges (its catalog sets `INVITE_ROLE` to `MEMBER_ROLE`) | Set after first cohorts |
| IN-07 | Value moments (device only) | (a) Read together reach: ids with `read_together_started` / ids with `book_opened{member_role: parent}`, 28 days. (b) Finish rate: `read_together_ended{reason: finished}` / `read_together_ended`. (c) Moved to v1.1 as V11-06 (hearing others): no one hears another person's recording in v1.0 (decision 9). (d) Resurfacing: `resurface_opened` / `resurface_shown`, by `kind` | Device only; no server signal (TRACKING_PLAN 1.2 row 6) | Set after first cohorts |

### 3.4 Business branch: Plus (C goal 2)

Founder decision 3 (BRIEF 2026-10-03): purchases happen only in Apple's own UI. No server of ours sees them, there is no App Store Server Notifications endpoint and there is no RevenueCat. Plus totals therefore come from ASC reports only. Apple's Subscription Event report has the fields `Event`, `Subscription Name`, `Subscription Offer Type`, `Subscription Offer Duration`, `Original Start Date`, `Days Before Canceling`, `Cancellation Reason` and `Quantity`. Its events include "Start Introductory Offer", "Paid Subscription from Introductory Offer" and "Cancel" (Fact: Apple's help pages, opened 3 Oct 2026, links in section 8). Report latency and any minimum-count rules were not stated there (Unverified).

| ID | Metric | Definition and source | Target (C section 9, A) |
|---|---|---|---|
| BZ-01 | Offer reach | Device: consenting active users with `plus_offer_viewed`, by `trigger` / consenting active founding parents, 28 days | Watch |
| BZ-02 | Trial starts | ASC "Start Introductory Offer" (`Quantity`) by `Subscription Name` per month. The ratio to first-letter accounts is a **period ratio** (ASC trial starts in month M / server first-letter founding parents in months M-2 to M). A cohort version needs a per-account join that decision 3 rules out | 15% of first-letter users by day 90 (cohort target; the period ratio approximates it) |
| BZ-03 | Trial to paid | ASC "Paid Subscription from Introductory Offer" / "Start Introductory Offer", by `Subscription Name` and `Subscription Offer Duration`, cohorted by `Original Start Date` month | 40% or more |
| BZ-04 | Annual share | Active paid subscriptions with the annual `Subscription Name` / all active paid subscriptions. Exact ASC report Unverified | 60% or more |
| BZ-05 | Refund rate | Refunded / paid transactions per month. Which ASC report carries refunds is Unverified (Open-3) | Under 3% |
| BZ-06 | Billing tickets | Support emails tagged billing per 100 paying subscriptions per month (manual tag) | 2 or fewer |

The device events `purchase_started{product, trigger}`, `trial_started{product}`, `purchase_succeeded{product}`, `purchase_failed{error_class}` and `restore_result{outcome}` describe the flow among consenters. They never set a Plus total.

### 3.5 v1.1 metrics: not read at v1.0

These need features that brief decisions 5 and 9 moved out of v1.0 (section 3.0). At v1.0 they would read zero by design. They are kept so the definitions exist before the data does. Nobody reads them, and no agent writes a finding from them, until the feature ships (4.6). When it ships, each row moves into section 3 and the targets are set after the first cohorts.

| ID | Replaces (Draft 1) | Metric | Definition and source | Goal | Deferred by |
|---|---|---|---|---|---|
| V11-01 | 2.2 "Authors" row | Contributor letters in WKF | A contributor's kept letter counts toward the family that owns the child's book, whatever the parent's review state (`approval` in `pending`, `added`, `set_aside`). The contributor kept it for the child; the parent's choice is V11-05. Joiners then include contributors (3.2) | PRD 1 | Decision 5 |
| V11-02 | IN-06(b), contributor role | Contributor invites | Books with 1 or more invites with `child_invites.role = 'contributor'` created within 30 days of `children.created_at`. Device `invite_created{role: contributor, channel}` | PRD 1 | Decision 5 |
| V11-03 | IN-06(c), contributor role | Contributor acceptance | Contributor invites with `accepted_at` not null and `revoked_at` null / contributor invites created. Device `invite_accepted{role: contributor}` among consenters; web acceptances come from server aggregates (TRACKING_PLAN section 2) | A goal 4 | Decisions 5 and 9 |
| V11-04 | B 3 proxy (IN-06c) | Contributor first letter | Accepted contributors with at least one kept letter as author / accepted contributors, by month of acceptance. Server `child_members.role = 'contributor'`, `entries.author_id`. Splitting web from app needs a server field: no `entries` column on develop records it (checked 3 Oct; Open) | B goal 3 | Decisions 5 and 9 |
| V11-05 | IN-06(d) | Family letters and approvals | Contributor-authored kept letters per book per month; share decided `added`: `approval = 'added'` / `approval in ('added', 'set_aside')`. Device `family_letter_reviewed{decision}`, whose values are `added` and `kept_aside` against the server's `set_aside` | B goal 4 | Decision 5 |
| V11-06 | IN-07(c) | Hearing others | Share of `playback_started` with `author_relation` in (`other_parent`, `family`). Device only | PRD 1 | Decision 9 (no audio upload) |

GR-08's check that contributors never see an offer (D-036) also starts at v1.1.

---

## 4. Guardrails

A guardrail is not a goal to raise. If one breaches, the decision or experiment that caused it stops until reviewed.

### 4.1 Privacy

| ID | Guardrail | Definition and source | Threshold |
|---|---|---|---|
| GR-01 | Content-free analytics | Validator violations in production builds. After PR #31 merges: `analytics.violationCounts()` (counts per kind, never values). Enforced by catalogue tests (TRACKING_PLAN 6.3) | Zero. Any violation is an incident |
| GR-02 | Nothing before consent | PRD 6.9 checklist: fresh install through first letter sends zero requests to PostHog or Sentry | Zero (QA, every release) |
| GR-03 | Small cells | No reported cell under 10 families or accounts, in server **and** device views. Nobody, human or agent, opens a single analytics id's event stream or session path; only aggregate insights are read (Decision; extends TRACKING_PLAN 1.4 to device views) | Zero exceptions |
| GR-04 | Consent health | (a) Analytics withdrawals: `policy_acceptances` rows with `document = 'analytics'`, `action = 'withdraw'` per month / accounts with a current accept. (b) Sensitive-data declines: `document = 'sensitive-data'`, `action = 'decline'` / new accounts | Watch. A rise is a trust signal. **The consent rate is observed, never a target** (4.4) |

### 4.2 Trust and fidelity (the constitution)

| ID | Guardrail | Definition and source | Threshold |
|---|---|---|---|
| GR-05 | Fidelity | (a) Device: count of `machine_edit_reverted` / sum of `letter_saved.machine_edit_count`, overall and by `edit_type` and `source`. (b) Server: spoken letters marked "Not quite": `sounds_like_me = false` / `sounds_like_me is not null`, where `capture_mode in ('spoken', 'mixed')`. (c) Device: `review_action{action: undo_all_edits}` / spoken `letter_saved`. (d) Beta exit: fidelity complaints traced to an engine edit (ROADMAP M12) | (a) Under 5% overall; any `edit_type` over 10% is reviewed (TRACKING_PLAN 1.3). (b), (c) set after beta. (d) Zero |
| GR-06 | Deletion | Account deletion requests: `deletion_requests` with `kind = 'account'` and `status <> 'cancelled'`, per 1,000 accounts per month; book deletions likewise | Watch. Never reduced by adding friction: deletion stays within 2 taps (C goal 3) |

### 4.3 Calm: what this tree never measures

These rules apply to every metric here and to any metric added later (Decision, from CLAUDE.md content rules, C-REQ-005, C-REQ-015 and UR 3 on guilt).

1. **No streaks.** No count of consecutive days, weeks or months with a letter, at any level: person, family or aggregate.
2. **No gap counts as targets or triggers.** No "days since last letter", "missed weeks" or "lapsed writer" segment is used to target, message or rank anyone. Retention is measured as presence in a window (IN-04). `app_opened.days_since_last_open` is read only as an aggregate distribution.
3. **No comparisons between authors.** Nothing ranks or compares authors within a family; FV28 counts distinct authors only.
4. **No metric reaches a user.** Milestone cards (`moment_shown`, C-REQ-010) are product features defined by book totals, not outputs of this tree.
5. **More is not better beyond the rhythm.** Letters per family has no upward target.
6. **No metric needs content.** A question that needs words, languages, names, goals or dates is out of scope (TRACKING_PLAN 6.2). For example, transcription quality by language is not measured on the device.
7. **Hidden books are never read as loss of a customer.** A hidden book (`children.hidden_at`, B-REQ-014) may mark a hard moment. Hide counts are reported only as totals of 10 or more, and nothing is triggered by them.

### 4.4 Free forever, paywall respect and consent

| ID | Guardrail | Definition and source | Threshold |
|---|---|---|---|
| GR-07 | Reminder fatigue and usefulness | Fatigue: consenting parents with `reminder_schedule_set{cadence: off}` in the month / consenting parents with an earlier `reminder_schedule_set` with cadence not `off` (R-7). Usefulness: `letter_saved{from_notification_2h: true}` / `reminder_sent{type: letter_reminder}`, with the person as the unit. The numerator may include "Not much today" until R-1 | Fatigue 10% or less; usefulness 12% or more (C section 9, A) |
| GR-08 | Paywall respect | `plus_offer_viewed` with a `trigger` outside C-REQ-023's set. QA: no offer during first run. From v1.1, when contributors ship: contributors never see an offer (D-036) | Zero |
| GR-09 | Free forever | No experiment, flag or remote-config change may alter writing, reading, playback, export or family authors (C 4.1; charter). Checked in experiment review, not by an event | Zero |
| GR-10 | Consent is not optimised | The analytics and sensitive-data consent sheets are never an experiment arm. Their copy, timing and order are never tuned to raise acceptance (decision 11; LEGAL-REQ-003: declining changes nothing) | Zero |

### 4.5 Reliability

| ID | Guardrail | Definition and source | Threshold |
|---|---|---|---|
| GR-11 | Letters are never lost | `error_shown{code: save_failed}` (device) and any confirmed loss (TDD 06 2.1: an invariant, Sev 1). Crash-free sessions from ASC App Analytics or Xcode Organizer. `sync_failed{reason}` per 100 sessions | `save_failed`: zero. Crash-free 99.8% or more (ROADMAP M12 beta exit). Sync: watch |

### 4.6 Reading rules for agents (decision 12, self-learning loop)

- Agents read only suppressed aggregates: server aggregate tables and PostHog insights, with GR-03. They never read person-level rows, session paths or anything in section 2.2's "never" list.
- Every finding names the metric id from this file, the window, n, a 95% interval and, for device numbers, the section 5.4 statement.
- A finding with n under the section 6.4 "plus or minus 10 points" row is reported as a count, not a rate.
- Section 3.5 metrics are not read before their feature ships. A zero there at v1.0 is by design and is never a finding or a backlog proposal.
- No finding is written from simulated, synthetic or estimated data. Fixture data (the fictional family "Asha") tests the SQL only.

---

## 5. Consent bias: what it is and how to state it

### 5.1 Why consenters differ

1. **Survivorship (structural, Fact).** The analytics sheet comes after the Keep the book sheet and the reminder prime, one ask per session (PRD-REQ-001). Someone who stops after their first or second session is never asked. Device data starts from people who already came back. The exact session count depends on the mobile build (A).
2. **Self-selection (A).** People who agree to optional data sharing are likely more engaged than people who decline (TRACKING_PLAN 1.4).
3. **First run is invisible (Fact).** First-run events can never be sent (K-01). The only first-run data is the one-time `analytics_opted_in` summary, still pending counsel review (TRACKING_PLAN 2).
4. **Rate unknown.** The 40% consent rate is an assumption (PRD 7.8). Until it is measured, nobody knows what share of users device numbers describe.

**Direction:** device rates for engagement, retention and feature use probably overstate the whole user base. **Size:** unknown until measured (5.2).

The server has its own blind spot: families who keep letters only on the phone. They may be more privacy-cautious, and their engagement is unknown. Report sync coverage (2.4) next to WKF.

### 5.2 Measuring the bias

The method is the one in TRACKING_PLAN 1.4, made exact.

- An account's analytics state is its latest `policy_acceptances` row for `document = 'analytics'`: `accept` means consenting; `decline` or `withdraw` means not consenting; no row means never answered. Whether declines are written to the server is Open-2.
- For each state, the aggregate job computes active writers per week, kept letters per active writer and week-4 retention (IN-04). It outputs counts only, with cells under 10 suppressed. No analytics id is involved.
- The gap between consenting and not-consenting accounts is the measured bias for server-visible behaviour (R-4d).
- For device-only metrics (IN-07, GR-07, BZ-01) the bias cannot be measured. State the direction only.

### 5.3 Rules

1. Never divide a device count by a server or ASC total.
2. Never scale a device rate up to a population (for example "40% consent, so multiply by 2.5").
3. Headline numbers (WKF, accounts, retention, trials, conversions) come from the server or ASC Sales only.
4. An experiment whose outcome is device-only measures an effect among consenters; say that the effect for everyone else is unknown.
5. Withdrawing and opting in again creates a new id (TRACKING_PLAN 7), so `analytics_opted_in` can count one person twice. The share is small (A) and is accepted; it is not corrected.

### 5.4 How to state it

Every device-derived number in a report, finding or backlog proposal carries these four parts:

1. The label "consenting users" and n.
2. Coverage: accounts with a current analytics accept / signed-in accounts, same period.
3. Direction: "likely higher than for all users" for engagement, retention and feature use.
4. The measured gap from 5.2 for the closest server metric, if one exists.

Template:

> Among the [n] people who chose to share usage data ([c]% of signed-in accounts this month), [metric] was [x] (95% interval [a] to [b]). People who share usage data are not a random sample: they are asked only after coming back, and in the same month they kept [r1] letters a week against [r2] for accounts that do not share (server split). Read [x] as likely higher than for all users.

---

## 6. What is measurable when

### 6.1 By phase

The phases come from ROADMAP M12 and D-045. D-045 is recommended and needs founder OK.

| Metric | Now (no users) | C0 internal (founding family, from about 9 Nov) | C1 external TestFlight (15 to 25 families, about 14 Dec to 8 Jan) | After launch |
|---|---|---|---|---|
| WKF and companions | Definitions; SQL tested on "Asha" fixtures (BL-024) | No: instrumentation QA only | Weekly top-line count if 10 or more; no trend claims | Yes; read trends after 8 weeks |
| IN-01 First letter | No | No | Counts of `time_to_first_letter` buckets, likely under 10 (suppressed); moderated sessions instead | Yes, with 5.4 |
| IN-02 Keep the book | No | No | Not meaningful: friendly families all sign in | Yes, as a bound |
| IN-03 Activated writer | No | No | Families starting in the first week: count with an exact interval | Yes |
| IN-04 Week 4 and month 6 | No | No | **No**: the beta lasts 3 weeks, so week 4 never arrives | Week 4 from about day 35; month 6 from about day 180 |
| IN-05 Letters per family | No | No | Median and range, counts | Yes |
| IN-06 Family voices | No | No | Counts of co-parent invites and acceptances. Beta exit needs the co-parent flow done without help. ROADMAP M12 also lists grandparent flows; that criterion predates brief decision 5, which hides the contributor path in v1.0 | Yes (co-parent only until v1.1) |
| V11-01 to V11-06 | No | No | No: the features are not in v1.0 | From v1.1 |
| IN-07 Value moments | No | No | Likely under 10 consenters: suppressed | Yes, with 5.4 |
| BZ-01 to BZ-06 Plus | No | Purchase-flow QA only | **No**: apps from TestFlight run in Apple's sandbox, and each subscription renews daily up to 6 times (Fact, Apple's TestFlight help page). That testers are not charged follows from the sandbox; the page does not say it in those words. No conversion, refund, mix or price data exists | From ASC: trial to paid after the 1-month and 2-month trials end, plus report lag |
| GR-01, GR-02 Privacy | Catalogue and validator tests | Network-inspector check on test phones | Zero violations | Every release |
| GR-05 Fidelity | Engine tests | QA | Counts; beta exit: zero fidelity complaints traced to an engine edit | Yes |
| GR-07 Reminders | No | No | Counts only; rates unreadable | Yes |
| GR-11 Reliability | Tests | TestFlight crash reports | Crash-free 99.8% or more; `save_failed` zero (beta exit) | Yes |

**C0** is one real family. Any number would describe that family, so none is computed. Its accounts are excluded from every aggregate for good (R-6).

**C1** limits:

- The families are friendly and recruited by the founder.
- The beta runs over the winter holidays.
- It lasts three weeks.
- The families are known to the founder, so GR-03 matters more, not less.

Beta decisions use the ROADMAP M12 exit criteria and interviews, not rate targets.

### 6.2 What a beta-sized sample can show (arithmetic, not data)

These are 95% Wilson intervals for an observed share at beta sizes:

| Families (n) | Observed 20% | Observed about 50% | Observed 60% | Observed 80% |
|---|---|---|---|---|
| 15 | 3 of 15: 7% to 45% | 8 of 15: 30% to 75% | 9 of 15: 36% to 80% | 12 of 15: 55% to 93% |
| 20 | 4 of 20: 8% to 42% | 10 of 20: 30% to 70% | 12 of 20: 39% to 78% | 16 of 20: 58% to 92% |
| 25 | 5 of 25: 9% to 39% | 13 of 25: 33% to 70% | 15 of 25: 41% to 77% | 20 of 25: 61% to 91% |

How to read it. A target can be told apart from an observation only when the target falls outside the observation's interval. For the Wilson interval this is the same as a two-sided 5% score test of the target.

- **Intervals are wide:** 36 to 45 points near 50%, about plus or minus 20 points. For a 35% target, every count from 3 to 11 of 20 (15% to 55%) has 35% inside its interval. For example, a 50% observation cannot be told apart from 35% (10 of 20: 30% to 70%).
- **The gap must be large.** A 60% observation does exclude 35% at all three sizes, but only just: 11 of 20 (55%) would not. At 15, 20 and 25 families the smallest counts that exclude 35% from above are 9 of 15, 12 of 20 and 14 of 25 (56% to 60%).
- **A separate reason: the sample is not random.** The intervals assume families drawn at random from future users. C1 families are friendly, recruited by the founder and testing over the holidays (6.1). An interval that excludes a target still describes those families, not launch users.

So C1 can find large problems, such as a flow nobody completes. It cannot confirm or reject a C section 9 target: most cannot be measured in C1 at all (week 4 never arrives and purchases are sandboxed, 6.1), and for the reminder targets (GR-07: 10% and 12%), every observation from 0% to 20% of parents, at all three sizes, has the target inside its interval.

The interval and sample-size figures in 6.2 and 6.4 were recomputed by script on 3 Oct 2026 (Wilson with z = 1.96; n rounded up).

### 6.3 Pre-launch work that is possible now

- Freeze these definitions (this file) and the targets as stated, before any data exists.
- Test the aggregate SQL against fixtures (BL-024; fictional family "Asha" only).
- Confirm ASC report access for the founder's account. This is a founder step: it needs App Store Connect sign-in.
- Synthetic data may test a pipeline. It is labelled synthetic in the pipeline and never quoted as a finding.

### 6.4 After launch: sample needed to read a rate

The formula is n = p(1 - p)(1.96 / h)^2, with a 95% normal approximation and half-width h. The unit is the person or account. Events from one person are not independent: for event ratios (GR-07 usefulness, GR-05a), compute intervals with the person as the unit.

| Metric | Assumed rate (A) | Plus or minus 10 points | Plus or minus 5 points | Plus or minus 3 points | Unit |
|---|---|---|---|---|---|
| IN-04 week-4 retention | 35% | 88 | 350 | 972 | First-letter accounts per cohort |
| IN-04 month-6 retention | 20% | 62 | 246 | 683 | First-letter accounts per cohort |
| BZ-02 trial starts | 15% | 49 | 196 | 545 | First-letter founding parents |
| BZ-03 trial to paid | 40% | 93 | 369 | 1,025 | Trial starters |
| BZ-04 annual share | 60% | 93 | 369 | 1,025 | Paying subscriptions |
| GR-07 usefulness | 12% | 41 | 163 | 451 | Parents with delivered reminders |
| GR-07 fatigue | 10% | 35 | 139 | 385 | Parents with reminders on |
| BZ-05 refunds | 3% | 280 for plus or minus 2 points | 1,118 for plus or minus 1 point | | Paid transactions |

If a weekly cohort is smaller than the plus or minus 10 points row, pool cohorts by month before reading a rate. Comparing two arms needs larger samples; the experiment framework (standing duty 2) will cover that.

---

## 7. Requests

To `analytics` unless another owner is named. Each request is content-free and L2.

| ID | Request | Why |
|---|---|---|
| R-1 | Add `kind` to `letter_saved`, as an enum of `letter`, `note` and `not_much` (core `ENTRY_KINDS` after PR #31). Or document that the one-tap "Not much today" entry never fires `letter_saved` | WKF and IN-05 exclude `not_much`. Device counts cannot today, so IN-05 device detail and GR-07 usefulness are marked. No mobile code on develop fires `letter_saved` yet (checked 3 Oct), so this can be settled before the event is wired |
| R-2 | Update TRACKING_PLAN 1.1 to the counting rules in 2.2 and 2.5, or record why not | One definition of the North Star |
| R-3 | Replace RevenueCat as the Plus source with ASC reports, per founder decision 3 (BRIEF 2026-10-03). Affected places: TRACKING_PLAN 0 items 4 and 5, the 1.2 source codes and row 7, section 2 billing row, section 4 Plus row, 6.2 ("RevenueCat ids") and 8.3 (pricing test arm via RevenueCat) | No server of ours sees purchases. Per-arm conversion can come from ASC by `Subscription Name` if each arm is its own product (C section 8) |
| R-4 | Server aggregates (BL-024; job owned by the data architect) gain: (a) WKF, MKF, growth accounting and backfilled letters per section 2; (b) FV28; (c) weekly counts of `sounds_like_me` true, false and null for spoken and mixed letters; (d) active writers, letters per active writer and week-4 retention split by analytics consent state (5.2); (e) analytics withdrawals and sensitive-data declines per week; (f) cohort tables keyed by the week of the first kept letter, split by founding parent and joiner | Inputs and guardrails in sections 2 to 5 |
| R-5 | Keep non-production data out of production numbers. Prefer a separate PostHog project for development and TestFlight builds (the standard option, decision 1). Otherwise add a global property `build_channel` (enum: `development`, `testflight`, `app_store`) | Beta and QA events must never mix with launch data |
| R-6 | Data architect (platform coordinator): a server-side internal-accounts list (founder, C0 phones, App Review demo account) that the aggregate job excludes. L2 flag only, no names | 2.2 exclusions; C0 must never count |
| R-7 | Confirm that turning reminders off always emits `reminder_schedule_set{cadence: off}`. `settings_changed{key: reminders}` carries no direction, so it cannot count "turned off". Optional: an event when the iOS notification permission differs from the last foreground (for example `os_permission_changed{granted}`), because turning notifications off in iOS Settings is otherwise invisible | GR-07 fatigue numerator |
| R-8 | `analytics` and `product`: TRACKING_PLAN 1.2 stage 2 lists 50% as the target. PRD A G2 says 70% is the target and A Q2 uses 50% as the trigger for requiring sign-in. Record both | IN-02 |
| R-9 | `product`: PRD-REQ-017 says Plus totals come from `store_subscriptions` and `store_notifications` fed by App Store notifications. Founder decision 3 removes the server entitlement tables and the notifications endpoint. Propose naming ASC reports as the Plus source. This agent does not edit `docs/prd/` | PRD consistent with decision 3 |
| R-10 | Restate TRACKING_PLAN 1.2 stage 1 ("share of new installs that save a first letter within 24 hours") as the two bounds in IN-01. As written it cannot be computed: first run is unobservable by design | Honest activation metric |

---

## 8. Assumptions, open questions and sources

**Assumptions**
- A-1: analytics consent rate 40% (PRD 7.8).
- A-2: every target in C section 9 and A G2.
- A-3: beta sizes and dates (D-045, recommended; ROADMAP M12).
- A-4: ISO weeks in UTC. US evening letters near midnight UTC fall into the next UTC day, so trends are unaffected but day-of-week reads are shifted.
- A-5: a 14-day restatement window. Check it against observed sync lag in C1.

**Open**
- Open-1, product: what separates `kind = 'note'` from `kind = 'letter'`. Both are counted here.
- Open-2, analytics: whether a declined analytics consent is written to `policy_acceptances`. Without it, "declined" and "never asked" cannot be told apart in 5.2.
- Open-3, analytics: which ASC report carries refunds, and the report latency.
- Open-4, privacy counsel: confirm that aggregate counts (no ids) may be kept after an account is deleted. This is assumed.
- Open-5, founder: at v1.0 (on-device only) there is no server North Star. Accept a device-only proxy among opted-in people, or run v1.0 on ASC numbers and interviews alone (3.0).

**Sources opened 3 Oct 2026**
- [Apple: Subscription events](https://developer.apple.com/help/app-store-connect/reference/subscription-events/)
- [Apple: Subscription event report](https://developer.apple.com/help/app-store-connect/reference/subscription-event-report/)
- [Apple: Testing subscriptions and in-app purchases in TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testing-subscriptions-and-in-app-purchases-in-testflight)
- [Apple: Sales and Trends metrics and dimensions](https://developer.apple.com/help/app-store-connect/reference/sales-and-trends-metrics-and-dimensions/) (App Units; subscription Units exclude free trials)

---

## Changelog

| Version | Date | Change |
|---|---|---|
| Draft 1 | 2026-10-03 | First metric tree: WKF counting rules, seven inputs, Plus branch from ASC, eleven guardrails, consent-bias method and statement, measurability by phase, readability tables, ten requests. |
| Draft 2 | 2026-10-03 | After red-team review: v1.0 scope note (3.0) citing brief decisions 5 and 9; contributor, family-letter and hearing-others metrics moved to a v1.1 section (3.5, V11-01 to V11-06); IN-06 is co-parent only at v1.0; 6.2 claim corrected to match its own intervals, with a 60% column and the non-random sample stated as a separate reason; device `letter_saved` rows marked "may include Not much today until R-1"; TestFlight "not charged" marked as following from the sandbox. |
| Draft 3 | 2026-10-04 | Landing update: v1.0 on-device-only note in 3.0 and summary item 7 (server aggregates, WKF, IN-02 (a), IN-03, IN-04, IN-06 and FV28 are v1.1 definitions; v1.0 has ASC and opt-in device numbers only). No definition or target was changed. |
