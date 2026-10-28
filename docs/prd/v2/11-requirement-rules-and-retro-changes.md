# 11. Requirement rules and retro changes

| | |
|---|---|
| Status | Decided with changes, 28 Oct 2026, by the coordinator on the founder's delegation (D-123 and D-125, recorded in PR #340; the founder may reverse). Section 8 holds the verdict for each rule and the ruling for each open decision. Nothing here reopens a founder decision. |
| Why it exists | The build outran the spec. Retro pass 1 (28 Oct) read the PRs, reviews, decisions and code. Market research refreshed on 28 Oct (R6, R7). |
| Scope | Rules for how every requirement is written and checked (section 1), the changes the retro proposes (section 2), spec-code drift to fix (section 3), scope pressure for the founder (section 4), requirements the market evidence adds (section 5), open decisions that block clarity (section 6). |
| Evidence labels | Per `_AUTHORING.md` section 6. **[Repo]** means a file, PR or commit read in the repo. **[Retro]** means a count or finding from the 28 Oct retro that was not re-checked line by line. Items the retro could not verify say so. |
| Second pass | The retro reads build evidence up to 27 Oct. A second pass is planned after the TestFlight alpha (starts Thu 29 Oct 2026) and will add tester feedback. |

## 0. What the retro found, in numbers

- 201 of 278 PRs merged; only 9 commits touched `docs/prd/v2` after #124, while decisions D-106 to D-117 (12 of them) landed [Retro].
- `docs/TRACE.md` counts 833 requirement IDs, 768 of them P0 (92%), 301 work packages, 14 P0 IDs with no work package and 572 P0 IDs with no test title citing them [Repo, `docs/TRACE.md` headline].
- 14 of the 30 most-commented PRs received a FAIL or BLOCKING review verdict [Retro]. The R-17 security gate had not passed on 27 Oct [Retro].
- The free-letter counting rule (M17, D-103) was fixed in three separate PRs (#268, #277, #296), each one fixing one entry path [Retro].
- The real-family-data rule failed three times on merged work (#52, #186, #237) [Retro].
- Eight recurring defect classes. The worst was multi-device, multi-account and kill-switch behaviour in held-draft sync and the status report (#182, #208, #178) [Retro].

## 1. Requirement rules (proposed standard)

These apply to every new or changed requirement. They add to the template in `_AUTHORING.md` section 5 and do not replace it.

| Rule | Statement | Check |
|---|---|---|
| RR-1 Testable | Every requirement has Given, When, Then with a number or an observable state. Words such as fast, easy, simple, calm, reliable need a number or are removed. | A reviewer can write the test from the row alone. |
| RR-2 Atomic | One behaviour per ID. If the Then clause has an "and" joining two behaviours, split into a, b, c (for example F16-REQ-029a, 029b). | Each ID maps to one test title. |
| RR-3 Traceable | A P0 names at least 1 test and 1 work package. | `scripts/trace.mjs --check` lists P0 IDs with 0 tests or 0 work packages (today 572 and 14). Whether the check blocks merges is the founder's call (07 Q8). |
| RR-4 P0 means a promise | A requirement is P0 only if shipping without it breaks (a) a promise in 03 section 1, (b) a legal or store duty, or (c) the core loop (speak, keep, read). Everything else is P1 or lower. | Each P0 row cites which of a, b, c. Target to discuss: P0 at most 50% of IDs (today 92%). The founder picks what to demote. |
| RR-5 State space | A requirement that touches sync, accounts, purchases, notifications or a kill switch lists these cases or says why one does not apply: second device, second account on the same phone, retry after a lost answer, kill switch on and off at the moment of the action, erase or delete. | A case table with 1 test per cell. |
| RR-6 Entry paths | A rule that counts or gates (the free-letter ledger, the Plus gate) is written as a table of entry paths crossed with states, not as one sentence. | 1 named test per cell. A cell with 0 tests fails the trace check. |
| RR-7 Decision sync | When a decision D-### changes a requirement, the affected rows carry "Rev D-###" within 2 working days. | TRACE reports 0 orphan decisions (a decision names an F## but no row cites it). |
| RR-8 Stand-ins | A requirement tested only with a stand-in (fake server, simulator) says so in the test title and stays "Partly built" until a real-device or real-server run passes. | The test title contains "stand-in". |
| RR-9 No collisions | A PR that adds an ADR number, decision id, backlog id or local schema version uses `scripts/agents/next-id.mjs`. | 0 numeric-id collisions with `develop` in CI. |
| RR-10 Claims | Every public claim (web, store, email, in-app) has a row in a claim registry with a source. "Exactly as you said it" stays out of default-letter copy until counsel and the founder approve it. | 0 unregistered claims. Prices come from `packages/content/src/pricing.ts` only. |
| RR-11 Freshness | A competitor price or feature fact older than 30 days is re-checked before it drives a pricing or positioning decision. Research files carry their open date. | Each market claim shows its source id and date. |
| RR-12 Security by construction | Security properties are requirements with counts, not review comments. | See proposed NFR-SEC-A, B, C in section 2. |
| RR-13 Unknowns | If a fact is unknown, the row says who answers and by when, and the row is marked a question, not assumed. | Each question has an owner and a date. |

**Clarity check for every requirement.** Before a row is accepted, the writer can answer six questions in one line each: who is it for and when; what changes for them; how we will know (the number); what we are not doing (a Never line); what it costs if we get it wrong; who decides if it is unclear.

## 2. Changes the retro proposes, by defect class

Status for every row: **Proposed** until its spec edit lands; the verdict per rule and row group is in section 8. Apply to the named spec on acceptance. IDs ending a, b, c are new sub-IDs of an existing ID. All numbers come from the retro's reading of the PRs named [Retro].

### C1. Multi-device, multi-account, kill switch

| Proposed ID | Given, When, Then | Applies to |
|---|---|---|
| F16-REQ-029a | Given phone 1 sends a Keep with `held_base` 926 after phone 2 applied words at version 964, When the server receives it, Then it is refused with the refusal code, 0 words are lost, and phone 1 shows the newer words. | F16 |
| F16-REQ-029b | Given a co-parent sends `held.upsert` with an id equal to another author's letter id, When the server processes it, Then 0 rows change. | F16 |
| F16-REQ-029c | Given the answer to a Keep is lost and the phone retries 3 times, Then the server holds exactly 1 letter. | F16 |
| F16-REQ-026 extension | Given an erase or purge of a private letter and 5 pulls with `have={n:9999,sum:1}`, Then all 5 responses equal the pre-erase response byte for byte. | F16 |
| F14-REQ-043a | Given account Papa signs in on a phone owned by account Mama, When a purchase happens, Then 0 status requests carry Papa's profile id for that purchase. | F14 |
| F14-REQ-043b | Given the `statusReport` kill switch is on at purchase and later turned off, When the next report is sent, Then it carries the consent facts captured at purchase (lost facts: 0). | F14 |
| F16-REQ-027 acceptance | Given any app-role query runs over 5 s, Then it is cancelled and logged; 0 background jobs hold a transaction over 1 s. Today only `escrow_svc` has `statement_timeout = '5s'` (`supabase/migrations/20261023000000_backup_server.sql:152`, [Repo]). | F16, 06 |

### C2. Security and privacy found late

| Proposed ID | Given, When, Then |
|---|---|
| NFR-SEC-A | Given a fresh Supabase project with no default grants, When the 4 core flows run (sign in, save a letter, Keep, restore), Then 0 responses are 42501. |
| NFR-SEC-B | Given the migration set, When a query lists SECURITY DEFINER functions, Then 100% have `pg_temp` last in `search_path` (the retro reports violators today; target 0). |
| NFR-SEC-C | Given a staging smoke run with a secret containing `%00`, Then the log shows 0 characters of the secret and the exit code is 1. |
| R-17 gate | Given the F02-REQ-024 checklist has N items, Then the gate lists all N with pass or fail each. Documents 08 and 09 cite it and do not restate it. |

### C3. Free-letter counting (M17)

| Proposed ID | Given, When, Then |
|---|---|
| F14-REQ-037 table | Given the entry points named in #268, #277, #296 and D-109 item 7, crossed with words shown or not shown (at least 6 cells), When a letter is kept, Then a spoken letter with no words adds +0 to the ledger, one with words shown adds +1, and the same letter kept twice adds +1 once. 1 named test per cell. |

### C4 to C8. Process rules

| Class | Proposed rule |
|---|---|
| C4 Spec and decision drift | RR-7 above. Add a header rule: a spec whose status line is older than the newest decision naming it raises a warning in TRACE. |
| C5 P0 inflation | RR-3 and RR-4 above. |
| C6 Copy, claims, guards | RR-10 above. The real-data guard runs on `develop` and `main` on every wave merge and reports 0 matches. |
| C7 Merge order and ids | RR-8 and RR-9 above. |
| C8 Review and plan drift | Rewrite 08 section 6.2 to match D-107 and D-117 (1 list in 08, none elsewhere). Show 1 row per alpha gate in 08 (build 1, build 2, freeze, go/no-go) with a date and an owner. A usage-limit pause over 24 hours updates the plan date within 1 working day [inference]. |

## 3. Spec-code drift to fix

Both sides were read by the retro. The five rows marked [Repo-checked] were re-read by the coordinator on 28 Oct.

| # | Spec says | Code or decision says | Action |
|---|---|---|---|
| 1 | F06-REQ-016 (P0): `faithfulClean` does not call `normalizeChars`; each replacement is a stored edit | `packages/core/src/pipeline.ts` lines 272, 301 and 334 call `normalizeFinal`; D-112 item 1 keeps this for the alpha [Repo-checked] | Mark "Rev D-112" |
| 2 | F06-REQ-010 uses key `fillers.offer` | Code comment in `pipeline.ts` line 77 names `fillers.suggest` [Repo-checked] | Rename in the spec or the code |
| 3 | F11-REQ-011 (P0): Leave book offered to the co-parent | `LEAVE_BOOK_OFFERED = false` in `apps/mobile/src/lib/family/entry.logic.ts:46` (D-113) [Repo-checked] | Mark "Rev D-113" |
| 4 | F08-REQ-034: four escrow functions and three secrets | Verified 28 Oct [Repo]: the backup migration grants `escrow_svc` exactly ten `escrow_*` entry points and `audio_backup_escrow.test.mjs` asserts ten; `docs/ops/BACKUP_RUNBOOK.md` lists nine settings. D-108 matches the code | Amended in F08 (this PR) |
| 5 | F16-REQ-027 (P0): timeouts | Only `escrow_svc` has a statement timeout [Repo-checked for that file; other migrations not searched] | Mark "Not built" and add C1 acceptance |
| 6 | D-111 item 12: `COVER_MIN_FREE_HEIGHT` 480 | Retro reports 640 at `onboarding.tsx:79`; the coordinator did not find that path | Unverified, check |
| 7 | 06-nfr.md: G4 needs at least 300 sessions | 07-quality-bar.md says 500 | Pick one |
| 8 | 05-feature-map ranks F18 20 and F21 19 | F18 header says 19, F21 header says 21 | Align |
| 9 | 05: F18 is P0 for consent, the guard and two events | D-095 turns analytics off in all v1.0 profiles | Founder to reconcile |
| 10 | D-099: two-parent cap from v1.1 | Code enforces the cap now | Founder to reconcile |
| 11 | 09 DR-18, DR-20: awaiting confirmation | D-111 item 6 and D-107 decided them | Update 09 |
| 12 | 08 section 6.2 founder-only paths | D-107 widened delegation; D-117 gives blanket approval | Rewrite 6.2 |
| 13 | 08: T36 is 3 to 5 May 2027 at about 40% | D-106: alpha 29 Oct, submission re-planned after; 08 has no alpha row | Add alpha rows |
| 14 | 10-changes says 729 IDs; README says 784 and 297 WPs | TRACE says 833 IDs and 301 WPs [Repo-checked] | Use TRACE counts everywhere |
| 15 | PRD says v1.0 includes server features (D-100) | `eas.json`: `preview` has server on; `production`, `testflight`, `development`, `e2e` have it off | Consistent with a staged alpha; say so in 08 |
| 16 | BACKLOG BL-330, BL-347, BL-322 in review | Merged (#139, #184) | Update status |
| 17 | BACKLOG BL-390, BL-440 on-device v1.0 | D-100 | Update status |
| 18 | R8: envelope has no SCCAP mapping | `packages/api/src/envelope.ts` maps it now | Resolved |
| 19 | 04-market.md and F21: "exactly as you said it", "kept exactly" | F06 line 68 bans it for default letters | Apply RR-10 |

Two cross-document items found on 28 Oct: BL-355 in `docs/BACKLOG.md` is about brand fonts, and trademark clearance is BL-366, whose scope still names the rejected quotation-mark logo.

## 4. Scope pressure (for the founder to decide)

The retro lists areas that look heavy for the first release, with evidence. It does not cut anything. D-101 keeps the full scope and moves the date.

| Area | Evidence it is heavy |
|---|---|
| Owner backup with key escrow (F08) | Off in every EAS profile; the retro counts 2 P0 and 17 P1 findings in it; spec and D-108 disagree on function and secret counts |
| Held-draft sync (F16, F14) | #182 (68 commits), #208 (27 commits), 4 FAIL rounds, then 4 follow-ups |
| Status report and reminder emails (F14) | #178 (71 commits), 2 blockers, off in all profiles, counsel items Q-C1 to Q-C12 open |
| Seven languages (DR-01) | The alpha is English only (D-111 item 4, D-115) |
| F18 device analytics | Off in all profiles (D-095) though the spec holds P0 rows |
| Co-parent Leave (F11-REQ-011) | Hidden in build 2 (D-113) |
| Whole scope | 301 work packages, 768 P0 IDs; submission about 40% confidence for 3 May 2027 (R-16) |

The retro's suggestion, marked inference: split 08 into an alpha scope and a v1.0 scope with a rule for what moves between them, instead of deleting requirements.

## 5. Requirements the market evidence adds (R6, R7)

New rows are P1 unless the founder says otherwise, per RR-4. They sit on top of existing decisions (M1 to M17) and do not change any of them.

### MK-1. Billing trust (F14, F17)

Evidence: in the 40 newest Chatbooks reviews, 30 are about price rises, surprise charges, cancelling or expiring credits, and 29 of the 30 are one star; 17 reviews across the sample describe unreachable support or refused refunds [S] R7. Remento, Qeepsake and Tinybeans are named in related complaints.

| ID | P | Given, When, Then | Source |
|---|---|---|---|
| F14-REQ-NEW-A | P1 | Given a person on Plus, When they open Settings, Plan, Then the plan name, price, renewal date and a manage-subscription row show, and the row opens Apple's manage sheet in at most 2 taps. | M6, D-080; R7 |
| F14-REQ-NEW-B | P0 (exists as M1) | Given a plan lapse, Then 100% of existing letters stay readable, playable and exportable. Add a lapse-simulation test per RR-5. | M1; R1 section 0 item 6 |
| F14-NEVER-1 | Never | We do not sell credits, packs or balances that expire. The membership is the only paid state. | R7 (credit complaints) |
| F20-REQ-NEW-C | P1 [A] | Given a support message, Then a person replies within 2 business days. The number is an assumption; validate against support capacity before committing. | R7 (support complaints) |

Unverified: Apple's rules for how a price increase on an existing subscriber is consented. Check R4 before writing a price-change row.

### MK-2. Language support is tested per language (F05)

Evidence: an Apple staff reply (Jan 2026) says SpeechTranscriber was listed for Arabic in error and never supported it; a later poster says `supportedLocales` was unreliable for several languages; the iOS 27 feature page lists dictation for Arabic but Hindi only in the non-on-device dictation row [S, F] R6 section 4. This corrects R1, which read the Arabic gap as a beta download bug.

| ID | P | Given, When, Then |
|---|---|---|
| F05-REQ-NEW-D | P1 | Given a language in the seven, When a build is cut, Then a recorded test transcription in that language passes on the minimum device and the result is stored with the build. A language that fails keeps its DR-01 gate state. `supportedLocales` is never used as the proof. |

### MK-3. Store and platform rules (F19, F21, F35)

| ID | P | Given, When, Then | Source |
|---|---|---|---|
| F21-REQ-NEW-E | P1 | Given the age-rating questionnaire (answers required for new submissions from Sep 2026), Then the answer on social-media capabilities is recorded in the Notes for Review with the reason (co-parent sharing is not a feed). | R6 section 4 |
| F35-REQ-NEW-F | P1 (when F35 is built) | Given server transcription is offered, Then a consent screen naming the third party appears before any audio leaves the phone, per guideline 5.1.2(i), and 0 audio is sent without a recorded yes. | R6; Apple guidelines, opened 28 Oct |
| Citation fix | done | Hidden-features rule is 2.5.19; 2.3.1(a) covers Notes for Review. Corrected in this PR across R1, R4, F11, F13, F19, F21, 06, 09 and `_AUTHORING.md`. | Apple guidelines page |

### MK-4. Evidence to gather, not requirements yet

- Voice for babies: 12 items value a real voice, but almost all concern older relatives; 2 of 3 Tiny Voices reviews are failed co-parent sharing [S] R7. A study with new parents is in the backlog (FB-14).
- Faithful words versus AI polish: FirstChapter now sells polished AI entries at $6.99 a month or $39.99 a year, with 3 voice memories a month free [R6]. One Remento reviewer reports an AI rewrite dropping proper nouns; a Berkeley preprint (24 Apr 2026) reports flattening of personal narrative in LLM rewrites [S] R7. Both support the faithful-words position and neither is a test of our users. Study in FB-14.
- Heritage language: R7 found 0 consumer posts on multilingual use. Study in FB-15.
- Privacy as a reason to buy: 0 of 156 reviews name it; press and vendor surveys do [S] R7. Do not lead pricing or copy with privacy alone until FB-14 tests it.

## 6. Open founder decisions that block clarity

From the retro, section 6. Each is ruled in section 8.

1. Submission date: D-100 leaves mid-January or May 2027 open; 08 says 3 May 2027 at about 40%.
2. Freeze Tue 3 Nov and go/no-go Thu 5 Nov are proposed; the answer was overdue on 27 Oct.
3. D-104 item 3 and DR-19 (voice-only counting) are still proposed; F14-REQ-037 cannot be finished until answered.
4. D-099 versus D-100: when the two-parent cap takes effect.
5. D-095 versus F18 P0: is analytics P0 in v1.0 or not.
6. Delegation: 08 section 6.2 versus D-107, D-117 and DR-20.
7. Counsel items: D-111 items 7 and 13; the D-109 welcome-first order; AB 1043 and `age_signal` (DR-10); F14 Q-C1 to Q-C12; Q4 withdrawal wording; D-116 policy lines.
8. DR-01 language set (T18); DR-11 individual or entity (T15); DR-15 co-parent language reading; DR-21 allowance and price rules.
9. 08 Q8 load test, Q10 external security test, Q2 founder hours, Q9 device operator.
10. Promise wording "exactly as you said it" in 04 and F21, with counsel at T30.
11. F08-REQ-034 amendment for D-108.

## 7. Sources

- `docs/TRACE.md` (headline counts, read 28 Oct 2026).
- `docs/prd/v2/_AUTHORING.md`, `05-feature-map.md`, `08-delivery.md`, `09-decisions-and-risks.md`.
- `docs/DECISIONS.md` (D-095 to D-117; D-121 to D-125 are in PR #340).
- Retro pass 1 (28 Oct 2026): PR history and reviews through 27 Oct; PR numbers above.
- `research/R6-benchmark-delta-2026-10-28.md`, `research/R7-sentiment-refresh-2026-10-28.md`.
- Apple App Store Review Guidelines page, opened 28 Oct 2026 (2.3.1, 2.5.19, 5.1.2(i)).

## 8. Decision record (28 Oct 2026)

Rulings are the coordinator's, on the founder's delegation. The founder may reverse any of them. Counsel and Apple sign-off are not delegated. The CTO analysis (two reports, 28 Oct) supplied the verdicts on rules and scope.

### 8.1 Rules (D-123)

| Rule | Verdict | Change |
|---|---|---|
| RR-6 entry paths, RR-8 stand-ins, RR-9 no collisions, RR-11 freshness (no gate), RR-12 security by construction, RR-13 unknowns | Accepted | None |
| RR-1, RR-4 | Accepted with change | New or changed rows only. No mass demotion of P0 rows before the 5 Nov go/no-go. The 50% P0 target stays a founder call |
| RR-2 | Accepted with change | After `scripts/trace.mjs` reads sub-IDs such as 029a (its ID pattern on line 33 reads three digits only) |
| RR-3 | Accepted with change | A ratchet: fails only on P0 rows added or changed after a committed baseline of today's counts |
| RR-5 | Accepted with change | Rows for F14, F16 and F08 first |
| RR-7 | Accepted with change | Warning only |
| RR-10 | Accepted with change | Prices from `pricing.ts` (already tested); the claim registry is deferred |
| "Pause over 24 hours" plan rule | Rejected | Not adopted |
| F20-REQ-NEW-C (support-reply promise) | Rejected for now | Kept as a question under RR-13 |
| F05-REQ-NEW-D (per-language test transcription) | Accepted with change | Done per language when it unlocks, not per build in CI |
| F16-REQ-029a to c | Accepted, waits | On the trace parser fix |
| F14-REQ-037 table cells | Accepted, waits | On D-104 item 3, now closed (D-125 item 1) |
| F14-REQ-NEW-A | Accepted with change | Needs a real number, not a placeholder |

This week only docs, the parser fix as its own branch, and the C-NFR-005 duplicate-ID fix. No new blocking check before 5 Nov.

### 8.2 Open decisions in section 6

| # | Ruling | Where recorded |
|---|---|---|
| 1 | The first store build is on-device only and staged; submit Tue 1 Dec 2026, release about Tue 8 Dec; full scope later in 1.0.x stages | D-121 |
| 2 | Freeze Tue 3 Nov and go/no-go Thu 5 Nov confirmed | D-124 |
| 3 | DR-19 option A; D-104 item 3 closed | D-125 |
| 4 | D-099 stands; the cap takes effect when co-parent sharing first ships | D-124 |
| 5 | D-095 stands for the whole 1.0 line; F18 moves to v1.1 or later | D-124 |
| 6 | DR-20 and 08 section 6.2 superseded by D-107 and D-117 | D-125 |
| 7 | Counsel items: working defaults stand; the first-binary set is sequenced first; D-109 welcome-first stays held | D-125 |
| 8 | DR-01 A with an unlock order; DR-11 production-record gate Fri 13 Nov; DR-15 A; DR-21 as written with a minimum sample | D-125 |
| 9 | 1x smoke test is the sync gate; external security test before server features open beyond the first families; founder hours and device operator are founder facts | D-125 |
| 10 | The store listing holds "exactly as you said it" until counsel clears it | D-125 |
| 11 | Resolved by reading the merged code: ten `escrow_*` entry points and nine settings, so D-108 is right and the spec was stale; F08-REQ-034 amended in this PR | D-125 item 11 (to be corrected, PR #340) |

### 8.3 Spec edits that follow (not done in this PR)

Requirement rows for the staged release (which flags are on in the first binary), `F18` re-tagged to v1.1 or later, `08-delivery.md` dates re-based on D-121, DR-19 and DR-20 rows closed in `09-decisions-and-risks.md`, F21 listing claims per D-125 item 9. Each is a separate docs PR from the owning agent.
