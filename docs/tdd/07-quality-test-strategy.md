# TDD 07: Quality and test strategy

Owner: head of quality engineering. Version 0.1, 3 Oct 2026. Status: draft for founder and engineering review.
Inputs read: `CLAUDE.md`, `docs/prd/PRD.md` 1.2 (section 6 checklist, section 7 budgets), PRD appendices A, B, C, `docs/legal/ENGINEERING_REQUIREMENTS.md`, `DATA_CLASSIFICATION.md`, `DELETION_AND_EXPORT_SPEC.md` (TC-01 to TC-20), `docs/analytics/TRACKING_PLAN.md`, `docs/BACKLOG.md`, TDDs 01 to 06, every test file in `packages/*/test`, `supabase/tests`, `experiments`, and `apps/mobile/src`.

Labels used throughout: **F** fact (observed in the repo or by running it on 3 Oct 2026), **A** assumption, **R** recommendation, **K** risk, **Q** open question. All fixtures and examples use the fictional family "Asha" (Asha, Mama, Papa, Nani, Dadi); no real data appears here or may appear in any test (CLAUDE.md, DATA-REQ-004).

---

## 0. Summary for the founder

1. **F** The repo has 165 unit tests (vitest) and 154 database checks (PGlite), all passing in about 62 s locally (unit 9 s, database 41 s, typecheck 12 s). They are strong where the constitution lives (verifier, immutability, deletion state machine, analytics allowlist).
2. **F** The mobile app has **zero** tests, there is **no CI** (`.github/` absent), no `scripts/trace.mjs`, and **no test title carries a requirement ID** although the Definition of Done requires it. So nothing today proves a single PRD section 6 checklist line on a phone.
3. **F** Of the 76 lines in the PRD section 6 launch checklist, 4 are fully covered by an existing automated test, 15 partly, 51 have no test, and 6 are manual checks with no script written yet (traceability in section 2).
4. **R** Test pyramid: push logic into pure TypeScript (`packages/core`, `*.logic.ts`), prove access rules in PGlite, and keep 15 Maestro end-to-end flows as the only phone automation. Manual testing is limited to what cannot be automated honestly (VoiceOver, StoreKit sandbox restore, real mail clients, device budgets).
5. **R** PR CI runs in under 8 minutes on Ubuntu (parallel jobs, npm and PGlite caches). Maestro on macOS runs nightly and per release candidate, not per PR, because macOS minutes cost 10 times as much and simulator boots alone take 2 to 4 minutes (**A**).
6. **K** The highest-severity test gaps are: the contributor-reads-whole-book behaviour is asserted as correct by an existing test (B-REQ-011 conflict), the verifier accepts negation and tense changes (TDD 03 7.1), and no test runs the content rules against reminder words ("daily", "missed"), "kids", print or beta placement although the checklist says one does.
7. **R** TestFlight in three cohorts (founding family, 15 to 25 friendly families, 100 to 300 public-link testers), with a 24-hour triage SLA for anything touching data loss, privacy or a minor.

---

## 1. Test pyramid and current coverage inventory

### 1.1 Target pyramid

| Layer | Tool | Share of tests (target) | Runs | Owns |
|---|---|---|---|---|
| L0 static | node scripts, tsc, ESLint (new), gitleaks | n/a | every PR | traceability, data map completeness, SDK denylist, manifest lint, secrets, bundle size |
| L1 unit | vitest | about 70% | every PR | `packages/core` (engine, verifier, age math, prompts, safety tiers, gate and ask logic, notice windows, Plus rules), `packages/analytics`, `packages/content`, `packages/design-tokens`, `apps/mobile/src/lib/*.logic.ts` |
| L2 component | vitest plus `@testing-library/react-native` under jest-expo (**R**, new) | about 10% | every PR touching `apps/mobile` | AX5 rendering without truncation, accessibility labels, 44 pt targets, sheet focus order, string keys only from `packages/content` |
| L3 database | PGlite harness (exists) | about 15% | every PR | RLS matrix, triggers, functions, purge with clock control, classification, plan-shape perf |
| L4 service | Deno tests with fake vendors; Supabase CLI plus PowerSync Open Edition in Docker | about 3% | PRs touching `supabase/functions`; nightly integration | Edge Functions (gateway, purge worker, RevenueCat webhooks, notice scheduler), sync parity TC-15 |
| L5 end to end | Maestro on iOS simulator, mitmproxy for network assertions; Playwright for the web contribution page once `apps/web` exists | about 2% (15 flows) | nightly and release candidate; device runs for gates | the 15 flows in section 3 |
| L6 manual and evidence | scripted checklists in `docs/qa/` (**R**) | n/a | binary release | VoiceOver and AX5 pass, device budgets, mail-client links, StoreKit sandbox, App Store Connect settings |

**R** The rule for where a test goes: if a behaviour can be decided by a pure function, the test is L1 and the screen merely calls the function; a Maestro flow only proves that the wiring exists. This keeps the 15 E2E flows stable and the PR loop fast.

### 1.2 What exists (F, counted by running the suites on 3 Oct 2026)

| Suite | File | Tests or checks | What it proves well |
|---|---|---|---|
| Core engine | `packages/core/test/core.test.ts` | 40 | normalisation, dictionary fixes, filler and repeat rules, verifier accept and adversarial reject cases, reversibility, calendar-month age, dateline without time-zone drift, prompt selection determinism, safety tier 1 versus 2, follow-up limits |
| Core providers | `packages/core/test/providers.test.ts` | 15 | rule punctuation, JSON model edits only through the verifier, adversarial model output, fallback without leaking text |
| Core repeats | `packages/core/test/repeats.test.ts` | 40 | automatic versus suggested repeats, quoted and dictionary protection, verbatim mode |
| Analytics runtime | `packages/analytics/test/analytics.test.ts` | 26 | nothing sent or queued before consent, no backfill, decline equals no answer, allowlist stripping, 40-character limit, canary family "Asha" never reaches the provider, revoke within session, queue byte cap, deterministic sampling |
| Analytics catalogue | `packages/analytics/test/catalog.test.ts` | 13 | event naming, requirement citation per event, L1 or L2 only, children as ordinals, nothing keyed to birthdays or due dates, docs parity with TRACKING_PLAN, PostHog replay and autocapture off |
| Content rules | `packages/content/test/rules.test.ts` | 16 | dashes, curly quotes, ellipsis, emoji, fear and loss words, AI-writing claims, prompt coverage, prompt gendering, placeholders, store field lengths, lock-screen length, button length |
| Design tokens | `packages/design-tokens/test/tokens.test.ts` | 4 | CSS in sync, light and dark parity, WCAG AA text contrast in both modes |
| Experiments | `experiments/*.test.ts` | 11 | WER scoring, edit-pass comparison harness |
| **Unit total** | | **165** | |
| Access rules | `supabase/tests/rls.test.mjs` | 40 | migrations apply, internal functions hidden, invites hashed and single use, author-only rows, immutability, versions, photos, dictionary owner-only, no `safety_events`, leaver loses access |
| Data governance | `supabase/tests/data_governance.test.mjs` | 93 | TC-01 to TC-14, tombstones and 30-day purge, legal hold, restore idempotence, author-only working material via `book_entries`, cross-child leak (one fixture), `child_member_prefs`, policy acceptances append-only, account and book deletion state machine, pseudonymisation, retention of acceptances |
| Classification | `supabase/tests/classification.test.mjs` | 6 | content and child columns L4, identifiers L3 or higher, RLS on every public table, reviewed view set, security-barrier view |
| Query performance | `supabase/tests/perf.test.mjs` | 15 | p95 budgets and plan shape for book page, full book, search, single letter at 1k families x 400 letters |
| **Database total** | | **154** | |
| Mobile app | `apps/mobile` | **0** | nothing; `typecheck` passes |
| Web contribution page | `apps/web` | n/a | does not exist yet |
| Edge Functions | `supabase/functions` | n/a | none written yet |
| CI | `.github/workflows` | **none** | BL-004 is "ready", not started |

### 1.3 Coverage by risk area

| Risk area (PRD, legal) | Coverage today | Gap |
|---|---|---|
| Constitution (never add meaning) | Strong at L1 | Verifier holes in TDD 03 7.1 (negation, tense, `stt_fix` to any dictionary term, `were`/`we're`, `.` to `?`, out-of-order false start); no property-based fuzzing |
| Durability (zero lost letters) | Server side strong; device side none | No atomic save test, no kill-during-save, no queue persistence, no re-ownership fault injection |
| Access control and child scope | Good single-fixture RLS | No generated role x object x verb matrix; no anonymous web role; no parity test against sync streams (TC-15); one cross-child leak fixture |
| Consent and minors | Analytics consent strong in L1; age gate none | No 18+ gate test at any layer; no network-level proof that nothing leaves before consent; no server consent gate (TDD 02 C5) |
| Deletion and export | Server state machine strong | No purge worker (TC-19), no export tests (TC-17), no cross-system verification, no launch sweep (TC-20) |
| Money | None | No Plus rule, notice scheduler, webhook idempotency, fail-open or lapse tests |
| Copy and claims | Partial | Reminder-word ban, "kids", print, beta placement, claims registry, child gendering outside prompts are not tested |
| Accessibility | Contrast only | No AX5, label, target-size or VoiceOver automation; 24 `maxFontSizeMultiplier` caps in `apps/mobile/src` (F) conflict with AX5 (TDD 01 7.6) |
| Performance | Server read path only | No device budgets, no write path, no concurrency, no bundle size |

---
## 2. Requirement-to-test traceability

### 2.1 Conventions (R)
- Every test that proves a requirement starts its title with the ID in brackets: `it('[PRD-REQ-019] No keeps the stop screen for 24 hours')`, `check('[DATA-REQ-012] book survives creator deletion', ...)`. **F** Today 0 of 319 test titles do this, so BL-002's `scripts/trace.mjs` would report every requirement as untested. Retitling the existing tests is task BL-Q01.
- `scripts/trace.mjs` (BL-002) builds the matrix below from test titles and Maestro flow tags (`tags: [PRD-REQ-019]`), fails on unknown IDs, and prints P0 IDs with no test. It becomes a release gate (section 9) once the backlog for a launch scope is complete; before that it is a report.
- Manual checks live in `docs/qa/manual/*.md` with the same bracketed IDs, and each run's evidence (date, build, device, tester, pass or fail) is saved in `docs/qa/evidence/` (no screenshots containing anything but Asha fixtures).
- Status: **E** an existing automated test covers the line; **P** partly covered; **N** no test; **M** manual by design, no script written yet. Layers as in 1.1. "E2E-nn" are the flows in section 3. BL-Q## are new tasks proposed in section 13 (this TDD does not edit `docs/BACKLOG.md`).

### 2.2 PRD section 6 launch checklist (every line)

| # | Checklist line (short) | IDs | Layer | Test (existing or to write) | St | Task |
|---|---|---|---|---|---|---|
| 1 | Cold start never waits on network | A-REQ-002 | L1, E2E | `[A-REQ-002] boot route resolves with network and model stubs that never resolve`; E2E-01 step 1 with proxy blocking all hosts | N | BL-040 |
| 2 | First letter with no sign-in, no prompt but microphone, no PostHog or Sentry request | A-REQ-012, LEGAL-REQ-003, -007 | L1, E2E | analytics `sends and queues nothing before consent` (exists); E2E-03 with mitmproxy host log | P | BL-042, BL-023 |
| 3 | Story intro with VoiceOver: no auto-advance, one element, Next and Previous actions | A-REQ-007 | L2, manual | `[A-REQ-007] screen reader on disables timer`; component test asserts `accessibilityActions`; VoiceOver script V-02 | N | BL-041 |
| 4 | Keep the book sheet after first save; Later keeps everything working | A-REQ-013, -014 | E2E | E2E-03 | N | BL-050 |
| 5 | 18+ question before any first-run screen, story 4 action or invite flow; nothing preselected | PRD-REQ-019, LEGAL-REQ-002 | L1, E2E | `[PRD-REQ-019] boot route is gate until answered` (every combination incl. invite link); E2E-01, E2E-13 | N | BL-037 |
| 6 | No or under-18 signal: stop screen, nothing created, no network, 24 hours | PRD-REQ-019 | L1, E2E | `[PRD-REQ-019] No closes for 24 h; clock set back keeps it closed`; E2E-01 with DB and file inspection | N | BL-037 |
| 7 | Yes stores only a boolean | PRD-REQ-019 | L1, E2E | `[PRD-REQ-019] persisted gate state has exactly {answered, passed, stoppedAt?}`; E2E-01 dumps app container | N | BL-037 |
| 8 | Sign-in sheet Terms line; `terms` row carries `age_attested: true` | K-07, LEGAL-REQ-001 | L3, E2E | acceptance tests exist (`acceptance records policy, version...`); add `[LEGAL-REQ-001] terms context carries age_attested` | P | BL-050 |
| 9 | Terms row before any other row syncs; sensitive consent; decline uploads nothing | LEGAL-REQ-001, -006 | L3, E2E | add `consent.test.mjs`: `[LEGAL-REQ-006] entry insert refused before sensitive consent` (TDD 02 C5); E2E-11 proxy | P | BL-054, BL-Q10 |
| 10 | Re-ownership in one transaction; forced failure changes nothing | A-REQ-015 | L1 integration | `[A-REQ-015] throw after each statement leaves local rows unchanged` (Node SQLite, TDD 01 7.2) | N | BL-052 |
| 11 | Email link and code, 1 hour, page does not verify on load | A-REQ-018, -023 | L4, Playwright | Supabase local stack plus Mailpit; `[A-REQ-023] GET of link page performs no verify call` | N | BL-051 |
| 12 | Links open the app from Mail, Gmail, Outlook, Messages | A-REQ-022 | manual | script M-01 on two devices | M | BL-053 |
| 13 | Sign out or Apple revocation never discards an unsynced letter | A-REQ-033 | L1, E2E | `[A-REQ-033] signOut waits for empty upload queue`; E2E-12 variant | N | BL-Q11 |
| 14 | Only name and birthday or due date required | B-REQ-001 | L2, E2E | `[B-REQ-001] Continue disabled without date`; E2E-02 asserts no gender, surname, photo, contacts fields | N | BL-033 |
| 15 | Hindi plus Devanagari transcribes, untranslated | B-REQ-003 | L1, corpus | `asr-plan` options test; golden corpus Hindi clips (TDD 03 7.3) | P | BL-043 |
| 16 | Contributor cannot create invites; parent invite carries explicit role | B-REQ-007, LEGAL-REQ-024 | L3 | `[LEGAL-REQ-024] contributor cannot create any invite` (today only "stranger cannot create" exists; any member can mint a parent invite, TDD 02 C1) | N | BL-Q12 |
| 17 | Grandparent records, plays, sends in 4 taps; 18+ at Send | B-REQ-008, LEGAL-REQ-010 | Playwright, manual | Playwright tap counter in WebKit and Chromium with fake media; manual M-02 on iOS Safari and Android Chrome | N | BL-Q13 |
| 18 | Web page load sends nothing but the token check until Send | K-08 | Playwright | request log allowlist assertion | N | BL-Q13 |
| 19 | Contributor letter pending for both parents, invisible to other contributors, uneditable | B-REQ-009 | L3 | `[B-REQ-009] contributor cannot set in_book`; **existing check at data_governance line 92 asserts the opposite model and must be replaced** (section 12, Q-01) | N | BL-Q12 |
| 20 | Parent `delete_entry()` on another author's letter fails | DATA-REQ-015 | L3 | `co-parent cannot delete another author's letter` (exists) | E | BL-Q01 retitle |
| 21 | Creator's account deletion keeps co-parent and contributor letters | DATA-REQ-012 | L3 | `book survives creator deletion`, `co-parent letters untouched` (exist) | E | BL-Q01 |
| 22 | Non-author gets no `raw_transcript`, `machine_edits`, `stt_meta` via API or sync | PRD-REQ-004 | L3, L4 | API: `book view has no raw transcript column` (exists); sync: TC-15 parity | P | BL-Q14 |
| 23 | Hiding a book clears every notification for that child within one sync | B-REQ-014 | L1, L4 | `[B-REQ-014] planner schedules nothing for hidden child`; integration two clients | N | BL-Q15 |
| 24 | Due date passes without birth date: no notification or card mentions it | B-REQ-015 | L1 | `[B-REQ-015] planner and Tonight cards ignore past due date` | N | BL-Q15 |
| 25 | Every machine edit passes `verifyEdits`; `raw_transcript` update fails in DB | DATA-REQ-040 | L1, L3 | verifier suites and `raw transcript is immutable` exist; verifier accepts negation and tense changes (TDD 03 7.1) | P | BL-Q02 (TDD 03 BL-064) |
| 26 | "Please have a read" card once, after first spoken transcript, never for typed | K-14 | L1, E2E | `[K-14] firstNote shown iff spoken and never shown before on install`; E2E-03 and E2E-04 | N | BL-042 |
| 27 | Backgrounding saves the recording | LEGAL-REQ-011 | E2E, manual | E2E-03 step 6 (`pressKey: home`); 500-iteration kill test is manual-scripted (TDD 01 7.8) | N | BL-042 |
| 28 | Tier-2 phrase creates no server row, request or event with a tier | LEGAL-REQ-015 | L1, L3, E2E | `no server table for safety tiers` (exists); catalogue test that no property is named tier; E2E-03 proxy body scan | P | BL-Q03 |
| 29 | `child-input` off: no `together` prompt or "Write one together" | PRD-REQ-005 | L1, E2E | `[PRD-REQ-005] selector never returns kind together when flag off`. **F** the existing test `picks the right kind: hard > together > ...` asserts the selector serves `together` with no flag | N | BL-Q04 |
| 30 | No OS notification prompt before first letter; prime on a later session | C-REQ-001, PRD-REQ-001 | L1, E2E | ask sequencer unit tests; E2E-03 asserts no system alert before the save and the prime only after relaunch | N | BL-023 |
| 31 | Default week: at most 2 reminders plus 1 month note; none 21:30 to 07:00 | C-REQ-002, C-NFR-001 | L1 | `[C-REQ-002] planner over a fixed week with fake clock` incl. DST weeks | N | BL-Q15 |
| 32 | Save at 19:00 suppresses 20:30 | C-REQ-004 | L1 | `[C-REQ-004] recent save suppresses slot` | N | BL-Q15 |
| 33 | Content test fails on "daily", "every day", "in a row", "missed", "streak", day counts in reminders | C-REQ-005, K-03 | L1 | new rule in `rules.test.ts` over `notifications.*`, `settings.reminders.*`, `onboarding.reminder.*`. **F** current rules only ban "streak" via the fear list | N | BL-Q05 |
| 34 | Muting Reminders still delivers family-letter notifications | C-REQ-007 | L1, manual | category mapping unit test; device check M-05 | N | BL-Q15 |
| 35 | Milestones inline once per reader; no modal, push or confetti | C-REQ-010 | L1, L2 | `[C-REQ-010] moment shown once` | N | BL-Q16 |
| 36 | Plus sheet never at launch, recording, export, Book list, birthday, first run | C-REQ-023, K-12 | L1, E2E | `[C-REQ-023] offerAllowed(context)` truth table; every E2E flow asserts `plus-sheet` not visible outside its trigger | N | BL-Q17 |
| 37 | Neither plan preselected; price, period, renewal, trial date, cancel at default size and AX5 | C-REQ-022, LEGAL-REQ-046 | L2, manual | component render at default and AX5 with fixture prices; manual V-05 | N | BL-Q17 |
| 38 | Trial-ineligible user sees no "free" wording | C-REQ-022 | L1 | `[C-REQ-022] sheet model for ineligible has no string containing free` | N | BL-Q17 |
| 39 | Notice scheduler sends exactly the K-04 schedule | PRD-REQ-003, LEGAL-REQ-047 | L1, L4 | pure `noticeDates(sub)` table test incl. birthday shift; Deno test with fake clock and idempotency | N | BL-Q18 |
| 40 | Each purchase writes one `auto-renewal-terms` acceptance | LEGAL-REQ-049 | L3, L4 | webhook test asserts one row per transaction, duplicates ignored | N | BL-Q18 |
| 41 | Entitlement service unreachable, lapsed: write, read, play, export, download all work | C-NFR-004, LEGAL-REQ-050 | L1, L3, E2E | static test: core paths import no entitlement module; E2E-14 with RevenueCat host blocked | N | BL-Q17 |
| 42 | Lapsed with two books keeps both writable; third shows Plus | C-REQ-028 | L3, L1 | `[C-REQ-028] create_child refused for lapsed third book; inserts into both allowed` | N | BL-Q19 |
| 43 | Restore on a new iPhone within 10 s | C-REQ-020 | manual | M-06 sandbox account | M | BL-Q18 |
| 44 | Refund webhook removes only the entitlement | C-REQ-029 | L4 | Deno fixture `REFUND` event; row counts of entries, storage unchanged | N | BL-Q18 |
| 45 | Free book allows exactly N Read together sessions; remote change applies; single playback unlimited | PRD-REQ-020 | L1, E2E | `canStartReadTogether` unit; E2E-05 with config override | N | BL-Q20 |
| 46 | Every Settings row within 2 taps | C-REQ-016, LEGAL-REQ-008 | L1, E2E | static route-graph test (depth from `settings/index` at most 2 for every row key); E2E-11 samples consent rows | N | BL-035 |
| 47 | Lapsed offline export: own entries with raw, edits, final; audio, photos, PDF, `account.json`; family letters without raw | C-REQ-017, LEGAL-REQ-034, DATA-REQ-050 | L1, E2E | export builder unit tests against fixture library; TC-17 hash check; E2E-10 offline | N | BL-Q21 |
| 48 | Account deletion: export first, subscription notice, 30-day undo, cross-system verification | C-REQ-019, LEGAL-REQ-029 | L3, E2E, staging | DB state machine exists; E2E-09; `ops/verify-deletion.mjs` in staging | P | BL-Q22 |
| 49 | Web delete-account page works without the app | LEGAL-REQ-030 | manual, Playwright | M-07 | M | BL-Q22 |
| 50 | Purge after 30 days; backups bound to 7 days | LEGAL-REQ-031, DATA-REQ-030 | L3, evidence | `purged after 30 days` (exists); console evidence for backups | P | BL-015 |
| 51 | Beta label only in About | K-13 | L1 | `[K-13] about.beta.* keys referenced only by the About screen` (source scan) | N | BL-Q05 |
| 52 | Content tests: characters, no "kids" or child-directed phrases, claims registry | LEGAL-REQ-044, -045 | L1 | characters exist; add `[LEGAL-REQ-045]` keyword and phrase rule and `[LEGAL-REQ-044]` claims registry match | P | BL-Q05 |
| 53 | App Store Connect territories US only, age rating, not Kids | LEGAL-REQ-058 | manual | M-08 with screenshot evidence | M | BL-Q23 |
| 54 | Privacy labels and `PrivacyInfo.xcprivacy` match the data map | LEGAL-REQ-042, -043 | L0 | `scripts/data-map.mjs` generates and diffs | N | BL-016 |
| 55 | No ad, attribution or tracking SDK; no AdSupport or ATT import | LEGAL-REQ-016 | L0 | `scripts/sdk-denylist.mjs` over lockfile and native sources | N | BL-Q06 |
| 56 | Log canary finds no fixture names, text or tokens | LEGAL-REQ-014 | E2E, L4 | run E2E and integration with Asha fixtures; grep device logs, function logs, push payloads, analytics bodies | N | BL-021, BL-Q07 |
| 57 | AI gateway 403 without consent and for web entries | LEGAL-REQ-004, -005 | L4 | Deno gateway tests (TDD 03 7.2) | N | BL-Q24 |
| 58 | Legal documents published at versioned URLs and linked | various | manual | M-09 | M | BL-053 |
| 59 | Real legal name and domain; no `example.com` | gate 4 | L0, manual | `scripts/no-placeholder.mjs` greps the built bundle | M | BL-053 |
| 60 | No product, store or site string mentions print | K-32 | L1 | `[K-32] no string matches /\bprint(ed|ing)?\b/` except `largePrint` key value allowlist | N | BL-Q05 |
| 61 | Two children: "To {child}" visible; change in Review saves to that child only | PRD-REQ-012 | E2E, L1 | E2E-06 | N | BL-034 |
| 62 | Free user: Add a child reaches Plus in 3 taps; server rejects `create_child` | PRD-REQ-015 | L1, L3, E2E | `canCreateBook` unit (BL-036); `[PRD-REQ-015] create_child without Plus refused`; E2E-07 | N | BL-036, BL-Q19 |
| 63 | First-run batch: one book each, no Plus sheet, server accepts | PRD-REQ-015 | L3, E2E | `[PRD-REQ-015] first-run batch accepted once only`; E2E-02 | N | BL-Q19 |
| 64 | Joined co-parent can start one book; second needs Plus | PRD-REQ-015 | L3 | `[PRD-REQ-015] joined books do not count` | N | BL-Q19 |
| 65 | Co-parent gets Plus via other parent | K-28 | L3 | `[K-28] book_has_plus true for every parent member` | N | BL-Q19 |
| 66 | Nani in Asha's book gets nothing from the sibling's book via API or sync | PRD-REQ-014 | L3, L4 | `no member of Asha's first book can see anything of another book` (exists, API only); TC-15 parity for sync; generated matrix | P | BL-Q14 |
| 67 | "Include {child} in my reminders" off affects only that person | PRD-REQ-013 | L1, L3 | prefs isolation exists (`other members cannot read someone's prefs`); planner test missing | P | BL-Q15 |
| 68 | Pause celebrations per person per child | PRD-REQ-013 | L1, L3 | prefs isolation exists; behaviour test missing | P | BL-Q16 |
| 69 | Every per-child setting within 2 taps | PRD-REQ-013 | L1 | route-graph test as line 46 | N | BL-035 |
| 70 | Fresh install to reminder prime: zero PostHog or Sentry requests, nothing queued on disk | PRD-REQ-016, LEGAL-REQ-003 | L1, E2E | L1 exists; E2E-03 proxy plus container file scan | P | BL-023 |
| 71 | Consent sheet is the third ask, never with another, nothing preselected | PRD-REQ-001 | L1, E2E | ask sequencer property test (random session sequences); E2E-11 | N | BL-023 |
| 72 | Every event validates; `before_send` drops unknown and long strings; canary never appears | PRD-REQ-016, LEGAL-REQ-017 | L1 | analytics and catalogue suites (exist) | E | BL-Q01 |
| 73 | Withdrawal stops sending within the session | PRD-REQ-018 | L1, E2E | `clears the queue, opts out...` (exists); Settings wiring in E2E-11 | P | BL-023 |
| 74 | Server aggregates report totals with no device analytics | PRD-REQ-017 | L3 | `[PRD-REQ-017] aggregate view returns counts only, no ids` | N | BL-024 |
| 75 | Every "gate" budget in PRD 7 met in the RC performance run | PRD 7 | L3, device | DB read budgets exist (`perf.test.mjs`); device harness (TDD 06 BL-R13) | P | BL-044 |
| 76 | `npm test`, `npm run test:db`, `npm run typecheck` pass | 6.10 | CI | pass locally (F); no CI enforces it | E | BL-004 |

**Tally (F, from this table):** 76 lines; 4 covered (E), 15 partly covered (P), 51 with no test (N), 6 manual with no script yet (M).

### 2.3 P0 acceptance criteria in appendices A, B, C and PRD-REQs not already covered above

Rows list the criterion that needs its own test beyond section 2.2. Layer and planned title only; all are status N unless marked.

| ID | Criterion (short) | Layer | Planned test | Task |
|---|---|---|---|---|
| A-REQ-001 | Splash matches first frame in both appearances | manual | V-01 screenshot diff on SE 3 | BL-040 |
| A-REQ-004 | Tap left or right, swipe, hold behave per F2.3 | L2 | gesture handler unit with fake timers | BL-041 |
| A-REQ-005 | Skip and Sign in visible at AX5, 44 pt | L2 | render at `accessibilityExtraExtraExtraLarge` and assert layout bounds | BL-041 |
| A-REQ-006 | 6 s advance, pause on hold, story 4 never advances | L1 | `storyTimer` reducer with fake clock | BL-041 |
| A-REQ-008 | Reduce Motion: no auto-advance, 200 ms fades | L1, L2 | motion token selection test | BL-041 |
| A-REQ-016, -017 | Apple and Google native sign-in | manual, L4 | provider token exchange against local Supabase with test keys; device M-03 | BL-053 |
| A-REQ-024, -025, -027 | Expired link resend; 60 s and 5 per hour; 5 wrong codes pause 15 min | L1, L4 | rate limiter unit with clock; Supabase local | BL-051 |
| A-REQ-026 | Custom SMTP with SPF, DKIM, DMARC | evidence | DNS check script `ops/check-mail-dns.mjs` | BL-053 |
| A-REQ-028 | Invite token stored before UI, survives kill and sign-in | L1, E2E | E2E-13 kill between link and gate | BL-Q13 |
| A-REQ-029 | Clipboard read only on tap | L2 | spy on `Clipboard.getStringAsync` | BL-Q13 |
| A-REQ-030 | Offline entry: F1, F2, profile, first letter | E2E | E2E-03 entire flow offline | BL-042 |
| A-REQ-031 | Specific auth error copy; cancel shows nothing | L1 | error mapper table test | BL-051 |
| A-REQ-034, -035 | Terms line and notice before data; no contacts permission | L0, E2E | manifest lint (no `NSContactsUsageDescription`); E2E-03 | BL-050 |
| A-NFR-001, -003 | Cold, warm start; intro images 250 KB each, 1.5 MB total | L0, device | bundle size check in CI; device harness | BL-044 |
| A-NFR-005 to -007 | WCAG 2.2 AA, AX5, labels and focus | L2, manual | section 5 | BL-Q08 |
| A-NFR-008 | Tokens only in Keychain | L0 | lint bans `AsyncStorage` imports in auth and invite modules | BL-Q06 |
| A-NFR-010 | Redirect allowlist; scaffold scheme replaced | L0 | `scripts/manifest-lint.mjs` checks scheme from `packages/brand` | BL-031 |
| A-NFR-011 | Apple token revoked on deletion | L4 | purge worker step test with fake Apple | BL-Q22 |
| A-NFR-012 | No content or tokens in analytics or Sentry | L1, E2E | analytics canary exists; Sentry scrubber test (BL-021) | BL-021 |
| A-NFR-013 | Auth success 97% weekly | ops | server aggregate, not a test | BL-024 |
| B-REQ-002 | Signature per book ("Nani" in one, "Dadi" in another) | L3 | `[B-REQ-002] signs_as per child` | BL-035 |
| B-REQ-004 | Twins in first run, switcher, reminder rotation | L1, E2E | E2E-02, E2E-06; rotation unit `[K-12] each included child named in turn` | BL-034 |
| B-REQ-005 | Due-date letters in Before You; birth date keeps them there | L1 | chapter assignment unit with Asha dates | BL-033 |
| B-REQ-006 | Dictionary terms from names and signatures; child terms readable by members | L1, L3 | **F** current test says "dictionary is private to its owner"; child-level terms need a new table or policy | BL-Q12 |
| B-REQ-007 | 14-day family, 7-day co-parent; 10 wrong codes per hour | L3 | invite expiry and rate-limit checks | BL-Q12 |
| B-REQ-010 | Remove keeps letters; removed member reads own only | L3 | `remove_child_member()` checks | BL-Q12 |
| B-REQ-011 | Private by default; `family_can_read` off gives contributor own entries only | L3 | replaces existing line 92 check | BL-Q12 |
| B-REQ-012 | Large Print at AX5 never truncates | L2 | section 5 | BL-Q08 |
| B-REQ-013 | "Bring family in" puts Invite first; family prompt in first 7 | L1 | prompt selector with goals | BL-Q04 |
| B-REQ-016 | Only sole parent deletes a book; contributors get export link | L3 | exists in part (`sole parent schedules book deletion`); contributor notice N | BL-Q22 |
| B-NFR-002 | Tokens in URL fragment; hashes only | L3, Playwright | `only a hash of the token is stored` (exists); web page asserts fragment never sent | BL-Q13 |
| B-NFR-004 | Invite 20 per parent per day | L3 | rate limit check | BL-Q12 |
| B-NFR-005 | Web audio encrypted in browser | Playwright | upload body is not valid AAC and decrypts with test key | BL-Q13 |
| B-NFR-007 | Names in any script; birthdays without time-zone shift | L1 | dateline test exists for time zones (E); add Devanagari and Tamil names through every formatter | BL-Q01 |
| B-NFR-009 | First run offline; queued invites visible | E2E | E2E-02 offline; E2E-12 | BL-033 |
| C-REQ-003 | 07:00 to 21:30 in 15-minute steps; clamp with message; travel keeps local time | L1 | picker model and planner time-zone test | BL-Q15 |
| C-REQ-006 | 4 consecutive reminders use 4 variants | L1 | rotation property test | BL-Q15 |
| C-REQ-011 | Birthday at 09:00; 31st falls on 30th | L1 | `[C-REQ-011] month-age note on short months` | BL-Q15 |
| C-REQ-012 | Pause celebrations sends nothing on birthday | L1 | planner test | BL-Q16 |
| C-REQ-015 | No comparatives or per-author counts in moment strings | L1 | content rule | BL-Q05 |
| C-REQ-018 | Keep-safe card offers Export first | L2 | component order test | BL-Q21 |
| C-REQ-021 | Mama's Plus works for Papa in that book | L3 | same as line 65 | BL-Q19 |
| C-REQ-024 to -027 | Trial start notice; trial ending; renewal; grace | L1, L4 | `noticeDates` table; webhook fixtures for `BILLING_ISSUE`, `EXPIRATION` | BL-Q18 |
| C-REQ-034 | Funnel events content-free, consent-gated | L1 | exists (E) | BL-Q01 |
| C-NFR-002 | Entitlement within 5 s; zero double grants | L4 | duplicate webhook delivery test | BL-Q18 |
| C-NFR-005 | No content in push payloads | L1 | push payload builder test with Asha canary | BL-Q15 |
| C-NFR-008 | Lapsed backups never deleted | L3 | `purge_due` never touches a lapsed user's objects | BL-Q22 |
| C-NFR-009 | Remote config changes audit-logged | L3, L1 | config parser defaults and fail-safe; audit row on change | BL-022 |
| PRD-REQ-002 | Terms, then sensitive consent, then sync; one row each | L3, E2E | `consent.test.mjs`; E2E-11 | BL-054 |
| PRD-REQ-006 | `safety_events` dropped | L3 | exists (E) | BL-Q01 |
| PRD-REQ-007 | Anonymous web session only at Send; cannot call app RPCs | L3, Playwright | `[K-08] anonymous session cannot call create_child, create_child_invite, request_account_deletion` | BL-Q13 |
| PRD-REQ-008 | Claims registered and match copy | L1 | claims registry test | BL-Q05 |
| PRD-REQ-009 | 90 days everywhere | L1 | `[PRD-REQ-009] every string and legal doc that states a shutdown notice says 90` (scan `packages/content` and `docs/legal/*.md`) | BL-Q05 |
| PRD-REQ-010 | Every column, bucket, store, SDK, event has a level | L0, L3 | `classification.test.mjs` (P, columns only); `data-map.yaml` diff | BL-016 |
| PRD-REQ-011 | Every local query scoped by child | L1 | static SQL scan plus two-child behavioural test (TDD 01 7.2) | BL-034 |
| LEGAL-REQ-013 | Photo EXIF and location stripped | L1 | fixture JPEG with GPS EXIF in, none out | BL-Q21 |
| LEGAL-REQ-018, -019 | Ephemeral clips deleted; no diarization | L1, L0 | config lint (TDD 03 7.2) | BL-Q24 |
| LEGAL-REQ-021 | No ATS exceptions | L0 | manifest lint | BL-Q06 |
| LEGAL-REQ-026 | No secrets in repo or bundle | L0 | gitleaks on PR; bundle scan on RC | BL-Q06 |
| LEGAL-REQ-033 | Retention schedule in code | L3 | `retention.test.mjs` just-inside and just-past pairs (TDD 05 9.3) | BL-Q22 |
| LEGAL-REQ-040 | Kill switches within 5 minutes | L1, staging | config polling interval and fail-safe default | BL-022 |
| LEGAL-REQ-054 | Push carries no content or promotions | L1 | as C-NFR-005 | BL-Q15 |
| DATA-REQ-043 | Rejected write to `rejected_writes`, queue continues | L1 | TC-16 fake connector | BL-Q11 |
| DATA-REQ-048 | Atomic local save, fsynced audio | L1 integration | fault injection per statement (TDD 01 7.2) | BL-032 |

---
## 3. End-to-end plan

### 3.1 Tool choice
**R: Maestro** for the iOS app, **Playwright** for the web contribution page and the web delete-account page, **mitmproxy** as the network witness for every E2E run.

| Option | For | Against | Verdict |
|---|---|---|---|
| Maestro | YAML a non-engineer can read and review; works on release builds without test code in the app; tolerant of animation timing; `launchApp: clearState`, `permissions`, `pressKey: home`, `stopApp` cover our lifecycle cases; Maestro Cloud exists if we outgrow self-hosting | iOS simulator only for local runs (real-device iOS needs Maestro Cloud or a device farm, **A**); no airplane-mode command on iOS (**A**: Android only); limited system-sheet control (StoreKit, Sign in with Apple) | **Chosen** |
| Detox | gray-box sync with the RN bridge; mature with Expo dev clients | needs native build config and test code; flakier with Reanimated loops (the listening aura); harder for the founder to read | Fallback if Maestro cannot drive RN 0.86 builds (TDD 01 assumption) |
| XCUITest | full system UI control, `performAccessibilityAudit()` (iOS 17+), StoreKit testing in Xcode | Swift, a second toolchain, iOS only | Used only for two narrow jobs: the automated accessibility audit (section 5) and StoreKit transaction manipulation in E2E-14 |
| Appium | cross-platform | slow, flaky, heavy | Rejected |

### 3.2 Harness rules (R)
- **Build.** An `e2e` EAS build profile (simulator, release JS, `EXPO_PUBLIC_E2E=1`). In that profile only: a dev deep link `scribe-e2e://seed?fixture=<name>` loads Asha fixtures from `apps/mobile/src/dev/asha-seed.ts`; `scribe-e2e://clock?offset=<hours>` shifts the app clock used by `packages/core` time functions; `scribe-e2e://config?<key>=<value>` overrides remote config; spoken input uses the existing sample transcriber (`apps/mobile/src/lib/transcribe-sample.ts`) fed by a fixture M4A of a scripted Asha letter, so no microphone or real voice is needed. A CI check fails the release build if any `scribe-e2e` handler is reachable when `EXPO_PUBLIC_E2E` is unset.
- **Selectors.** `testID` on every interactive element, named `<screen>.<element>` (for example `gate.yes`, `review.save`). Never select by visible text, so copy changes in `packages/content` do not break flows; assert copy by string key through a hidden `accessibilityHint` only in the e2e build (**R**, avoids hardcoding words in YAML).
- **Network.** The simulator routes through mitmproxy with a script that records every host and body and can block hosts. "Offline" on iOS simulator means the proxy refuses every connection (**A**: equivalent for our code paths; true radio-off behaviour is checked manually on device, M-04). Every flow ends with `assert_hosts.py` comparing the host log with an allowlist for that flow and scanning bodies for the Asha canary strings (LEGAL-REQ-014).
- **Backend.** Supabase CLI local stack plus PowerSync Open Edition in Docker on the macOS runner (nightly), seeded per flow by SQL; RevenueCat sandbox webhooks are replayed from recorded fixtures into the local `revenuecat-webhook` function.
- **Data.** Only Asha fixtures. Child names used: Asha, and for twins Asha and Avi. Adults: Mama, Papa, Nani.
- **Flake policy.** A flow may retry once in nightly; a retry that passes files a flake ticket. No retries on release-candidate runs.

### 3.3 The 15 critical flows

Each flow lists preconditions, steps (user action, then assertion), and the requirements it proves. Maestro files: `apps/mobile/e2e/flows/E2E-nn-<name>.yaml`, tagged with the IDs.

**E2E-01 18+ entry gate (Yes and No)** (PRD-REQ-019, LEGAL-REQ-002, A-REQ-002)
Pre: fresh install (`clearState`), proxy blocking every host.
1. Launch. Assert the splash hides and the first route renders within 3 s with no network (A-REQ-002).
2. Assert `gate.question` visible; `gate.yes` and `gate.no` both unselected; no story, no first-run field, no Sign in visible.
3. Tap `gate.no`. Assert `gate.stop` visible; no back, record or write control on screen.
4. `stopApp`, relaunch. Assert `gate.stop` still visible.
5. Clock offset +23 h, relaunch. Assert stop screen. Clock offset +25 h, relaunch. Assert `gate.question` again with nothing preselected.
6. Dump the app container (`xcrun simctl get_app_container ... data`) and run `inspect_container.py`: SQLite has zero rows in children, entries, drafts, dictionary; no audio files; gate state file holds only the boolean and stop time, no age or date of birth. Proxy log: zero requests.
7. Tap `gate.yes`. Assert the story intro shows. Relaunch. Assert the gate never shows again. Container: gate state is `{passed: true}` only.

**E2E-02 Twins onboarding** (B-REQ-001, B-REQ-004, PRD-REQ-015, B-NFR-009)
Pre: gate passed, proxy offline.
1. Story 4: tap `stories.start`. Assert `profile.name` and `profile.date` are the only required fields; no surname, gender, photo or contacts fields.
2. Enter "Asha" and a birthday. Assert `profile.continue` enabled only after the date is set.
3. Tap `profile.addAnother`; enter "Avi" with the same birthday. Assert no `plus-sheet` at any point (C-REQ-023).
4. Choose signature "Mama"; skip languages and goals. Assert no OS notification alert appears (C-REQ-001).
5. Assert Tonight shows "For Asha" with a chevron; open the switcher; assert both books listed, plus Add a child and Hidden books.
6. Go online; sign in with a seeded test email account (magic link fetched from local Mailpit). Assert in the database that both `create_child` calls succeeded in the first-run batch and the account has no entitlement (server enforcement, PRD-REQ-015).

**E2E-03 Speak, review, save (first letter)** (A-REQ-012, -013, -014, -030, K-14, LEGAL-REQ-011, LEGAL-REQ-015, PRD-REQ-001, LEGAL-REQ-003)
Pre: one child Asha, no account, proxy offline, sample transcriber with fixture "asha-first-steps.m4a" containing a tier-2 phrase in a second fixture variant.
1. Tap `tonight.record`. Assert the microphone permission alert is the only system alert; allow.
2. Assert `listening.to` shows "To Asha". Wait 5 s; tap `listening.done`.
3. Assert Review shows the transcript and `review.firstNote` (mistakes card) before Save.
4. Open the edits list; undo one filler edit; assert the word returns.
5. Tap `review.save`. Assert `keep.sheet` opens with Apple, Google, Email, Later. Tap Later.
6. Record again; after 3 s `pressKey: home`; wait 5 s; relaunch. Assert Review opens with the partial recording saved (LEGAL-REQ-011). Save. Assert `review.firstNote` does not show again.
7. Repeat with the tier-2 fixture. Proxy body scan: no request and no stored analytics event contains a tier field.
8. Relaunch (new session). Assert the reminder priming card shows on Tonight, and only then the OS alert after tapping it. Assert no prime appeared in the session that showed `keep.sheet` (PRD-REQ-001).
9. Proxy log for the whole flow: zero requests to PostHog and Sentry; container has no analytics queue file.

**E2E-04 Type a letter** (K-14, A-REQ-030, DATA-REQ-048)
Pre: Asha seeded, offline.
1. Tap `tonight.write`. Type a fixture sentence with Devanagari words.
2. Tap `write.save`. Assert no `review.firstNote` (typed letters never get it).
3. Open Book; assert the letter is in the current month chapter with "From Mama" and Devanagari rendered unchanged.
4. `stopApp` immediately after a second save tap (kill-after-save sample); relaunch; assert the letter exists exactly once.

**E2E-05 Read together gate** (PRD-REQ-020, LEGAL-REQ-050, C-REQ-023)
Pre: Asha with 5 seeded letters with word alignment and local audio; Free account; config `read_together_free_sessions=3`.
1. Open Book, tap `book.readTogether`; assert highlight playback starts. Stop. Repeat twice (3 sessions).
2. Tap a fourth time. Assert `plus-sheet` opens with trigger Read together; tap Not now.
3. Open a single letter; tap Play; assert playback works, no Plus UI (single recordings are never limited).
4. Set config to 5 via deep link; relaunch; assert two more sessions are allowed without a new build.

**E2E-06 Child switch** (PRD-REQ-012, PRD-REQ-011, PRD 7.1 switch budget)
Pre: Asha and Avi books, letters in each.
1. On Tonight tap `child.switcher`; choose Avi. Assert "For Avi" and Avi's Book only shows Avi's letters (no Asha letter id present).
2. Record a letter; in Review change `review.to` from Avi to Asha; save.
3. Assert the letter appears in Asha's book only. Relaunch: assert the last opened child (Asha) is remembered.
4. Single-child variant (Asha only): assert no chevron on the switcher.

**E2E-07 Add a child, Plus gate** (PRD-REQ-015, C-REQ-023, PRD 7.1)
Pre: signed-in Free parent who started Asha's book.
1. Switcher, then `switcher.addChild` (tap 2), then `addChild.continue` after name and date (tap 3). Assert `plus-sheet` opens at the third tap with neither plan preselected.
2. Tap Not now; assert no book was created locally.
3. Test-only bypass: call `create_child` directly with the session token via the e2e seed tool. Assert the server returns the Plus-required error code.
4. Variant: the same user is also co-parent of a joined book and started none: assert the first Add a child succeeds with no sheet.

**E2E-08 Delete a letter and undo** (DATA-REQ-010, DATA-REQ-015, B-REQ-009)
Pre: Asha's book with a Mama letter and a Papa letter; signed in as Mama; online.
1. Open Mama's letter, `letter.more`, Delete. Assert the undo toast; tap Undo; assert the letter is back.
2. Delete again; let the toast expire. Assert it appears in Settings, Your data, Recently deleted with the restore date 30 days out.
3. Restore from Recently deleted; assert it returns to the same chapter with the same text.
4. Open Papa's letter; assert no Delete or Edit action exists.
5. Clock +31 days with a seeded deleted letter; run `purge_due` in the local stack and sync; assert the letter and its local audio are gone (TC-20).

**E2E-09 Account deletion** (C-REQ-019, LEGAL-REQ-029, DATA-REQ-012, K-22)
Pre: Mama is creator of Asha's book with co-parent Papa and contributor Nani; Mama holds a sandbox subscription.
1. Settings, Your data, Delete account. Assert Export is offered first.
2. Continue; assert the subscription notice with a manage link appears before the final confirm.
3. Assert the co-parent line says Mama's letters leave the shared book.
4. Type to confirm. Assert the signed-out state and the 30-day undo message.
5. Sign in again within the window; tap Cancel deletion; assert letters are back.
6. Repeat to completion with clock +31 days and the purge worker run; then run `ops/verify-deletion.mjs` against the local stack: no rows or objects for Mama except pseudonymised acceptances and the suppression hash; Papa still reads the book and Nani's letters remain.

**E2E-10 Export** (C-REQ-017, LEGAL-REQ-034, DATA-REQ-050 to -053, TC-17)
Pre: lapsed account, year-1 fixture (about 240 letters, audio, 5 photos, 3 family letters), proxy offline.
1. Settings, Your data, Export everything. Assert no Plus UI; assert the plaintext notice.
2. Wait for completion (budget 2 minutes is checked on device, not in the simulator); share sheet appears; save to Files.
3. `inspect_export.py`: ZIP contains every own entry with raw transcript, edits and final text; audio; photos without EXIF location; PDF; `account.json`; README; family letters have no raw transcript; manifest hashes verify; flipping one byte is reported as a mismatch.

**E2E-11 Consent on and off** (PRD-REQ-001, PRD-REQ-002, PRD-REQ-016, PRD-REQ-018, LEGAL-REQ-001, -003, -006, -008)
Pre: E2E-03 completed state, online.
1. Sign in from `keep.sheet`. Assert the Terms line with the 18+ confirmation. Database: one `terms` acceptance with `age_attested: true`.
2. Assert the sensitive-data consent screen. Tap Not now. Proxy: zero entry uploads; Settings shows letters kept on this phone.
3. Turn sensitive-data consent on in Settings, Privacy (2 taps). Assert upload begins and the acceptance row exists.
4. New session: assert the analytics consent sheet appears, nothing preselected, and no other ask in that session.
5. Tap Yes. Proxy: PostHog requests begin; bodies contain only catalogue events with a random id; canary scan clean.
6. Settings, Privacy, Share usage and crash reports off. Proxy: zero PostHog or Sentry requests for the rest of the session and after relaunch.
7. Assert every consent row in Settings, Privacy is reachable in 2 taps (LEGAL-REQ-008).

**E2E-12 Offline capture, then sync** (PRD 7.3, 7.4, DATA-REQ-043, A-REQ-033)
Pre: Mama and Papa signed in on two simulators sharing Asha's book; Mama's proxy offline.
1. Mama records and saves two letters. Assert "Not sent yet" state on each.
2. `stopApp`, relaunch Mama offline: assert both letters still there and still queued.
3. Bring Mama online. Assert "Not sent yet" clears; Papa's simulator shows both letters within 30 s (p95 budget measured in the integration suite, not here).
4. Inject a server rejection for one op (seeded constraint); assert it lands in `rejected_writes` with a visible state and the other op still syncs.
5. Mama taps Sign out with one letter unsynced and the proxy offline: assert sign-out waits and explains; no letter is lost.

**E2E-13 Co-parent invite** (B-REQ-007, A-REQ-028, PRD-REQ-014, PRD-REQ-019, B-REQ-011)
Pre: Mama with Asha and Avi books; Papa on a fresh second simulator.
1. Mama: Family, Invite to Asha's book, role Co-parent. Assert the invite names one child only.
2. Papa: open the invite link (`xcrun simctl openurl`) on a fresh install. Assert the 18+ gate comes first; answer Yes; assert the invite flow resumes.
3. `stopApp` Papa before sign-in; relaunch; assert the invite token survived.
4. Papa signs in and accepts. Assert Papa sees Asha's book and no trace of Avi's (no row, member, photo).
5. Mama creates a Family invite for Nani; assert expiry 14 days; Papa (co-parent) creating a Co-parent invite is allowed, a contributor fixture is refused by the server.

**E2E-14 Trial and cancel** (C-REQ-021 to -029, LEGAL-REQ-046 to -050, C-NFR-004)
Tooling: StoreKit Configuration file (`apps/mobile/ios/Plus.storekit`) for the simulator; XCUITest helper drives `SKTestSession` for expiry, refund and billing retry; RevenueCat events replayed into the local webhook function (**A**: RevenueCat accepts StoreKit test transactions in its sandbox; confirm in BL-Q18).
1. Free user taps Encrypted backup. Assert `plus-sheet`: neither plan selected; price, period, auto-renewal, trial end date and cancel route visible.
2. Choose annual; confirm the StoreKit test purchase. Assert the trial start sheet with end date and cancel route; database `auto-renewal-terms` acceptance row; entitlement active within 5 s.
3. Clock: assert notice records at 18 days and 3 days before trial end, one push only at 3 days.
4. Cancel through the StoreKit test session; expire. Assert the lapse: both books writable, backup audio playable and downloadable, no Plus UI on write, read, play or export.
5. Block the RevenueCat host in the proxy; relaunch; assert core paths still work (fail-open).
6. Refund variant: replay a `REFUND` event; assert only the entitlement changes.

**E2E-15 VoiceOver pass** (A-NFR-005 to -007, B-NFR-006, C-NFR-006, LEGAL-REQ-051)
Automated part (XCUITest, simulator): run `performAccessibilityAudit()` on every screen reached by E2E-01 to E2E-14 at default size and at AX5; fail on missing labels, contrast, hit region, clipped text. Manual part (device, scripted in `docs/qa/manual/V-voiceover.md`):
1. VoiceOver on, Reduce Motion on, AX5. Gate: focus lands on the question; Yes and No announce as buttons, not selected.
2. Stories: no auto-advance; one element per story; Next and Previous actions work.
3. First run: each field labelled; errors announced.
4. Record: Record button announces state; "To Asha" is reachable; Done is reachable without hunting.
5. Review: transcript reads in order; each machine edit is reachable with an undo action.
6. Keep the book, prime and consent sheets: focus moves to the sheet title; dismiss works with the escape gesture.
7. Plus sheet: price, trial and renewal read together; nothing truncated at AX5.
8. Settings: each row reads label and value ("Reminders, a few times a week, 8:30 PM").
9. Book and Read together: highlight playback is announced; playback controls reachable.

**Mapping to TDD 01 E-01 to E-11:** E-01 to E2E-01 and E2E-03; E-02 to E2E-01; E-03 to E2E-13; E-04 to E2E-03 (transcription unavailable variant); E-05 to E2E-03 step 6; E-06 to E2E-06; E-07 is folded into a unit test plus an assertion in E2E-03 (no `together` prompt card); E-08 to E2E-05; E-09 to E2E-11 step 7 plus the static route-graph test; E-10 to E2E-11; E-11 to E2E-10.

**Not automated end to end (premature for v1, R):** Sign in with Apple and Google UI (system sheets; covered by token-exchange tests plus manual M-03), real email clients (M-01), App Store purchase on device (M-06), Android (no build ships at launch; one parity smoke flow is written but not gated until Android is in scope).

---

## 4. Device and OS matrix

**F** The PRD names iPhone SE (3rd gen) and a current iPhone as checklist devices. **Q** The minimum iOS version is not decided (TDD 01 OQ-6); this matrix assumes iOS 17 as the floor (**A**), which also gives XCUITest's accessibility audit.

| Tier | Device | iOS | Runs | Gates |
|---|---|---|---|---|
| D1 reference | iPhone SE (3rd gen), 4 GB, A15, small screen | floor (17.x) and latest | every RC: device budgets (PRD 7.1, 7.7), kill-during-save 500x, AX5 visual pass, export 2 minutes, transcription time and battery | Binary release |
| D2 current | current-generation iPhone (Pro, ProMotion 120 Hz) | latest | every RC: smoke of all 15 flows by hand or Maestro Cloud, Declared Age Range sandbox, StoreKit sandbox restore | Binary release |
| D3 memory tier | iPhone 11 or 12 (4 GB) | 17.x | per model change and per RC for transcription (whisper tier choice, ADR 0001) | Model change |
| D4 large text and size | iPhone Pro Max class | latest | AX5 layouts, landscape off check | Release (visual) |
| D5 iPad | any iPad in iPhone compatibility mode | latest | layout sanity: App Review uses iPads | Release (smoke) |
| D6 beta OS | D2 on the iOS developer beta | next major | from WWDC to release each year; no gate, files issues | none |
| Simulators (CI) | iPhone SE (3rd gen) and iPhone 16 simulators | pinned Xcode version | Maestro nightly and RC | RC |
| Android (later) | Pixel 6a class 60 Hz; 4 GB low-end | 14, 13 | parity pass before any Android release | Android release only |
| Web page browsers | iOS Safari (latest two), Android Chrome (latest), desktop Chrome and Safari | n/a | Playwright WebKit and Chromium per PR touching `apps/web`; real iOS Safari and Android Chrome manual M-02 per release of the page | Web release |

**R** Own D1 and D2 physically (founder and one engineer); rent D3 to D5 only when needed (BrowserStack or AWS Device Farm, **A** costs not checked). Settings to cover on D1 and D2 at least once per RC: Dark mode, Reduce Motion, Bold Text, Increase Contrast, AX5, Low Power Mode, low storage (under 1 GB free), time zone change and DST boundary, 12-hour and 24-hour time, en-US locale with Hindi keyboard.

---

## 5. Accessibility testing

Target: WCAG 2.2 AA on app, web page, legal pages, paywall and emails (LEGAL-REQ-051), AX5 everywhere, VoiceOver complete on every P0 flow (PRD 7.6).

| Layer | What | Tool | Gate |
|---|---|---|---|
| Tokens | text and control contrast 4.5:1 and 3:1 in both themes | `tokens.test.ts` (exists for text pairs; **add** control and focus-ring pairs, 3:1) | PR |
| Lint | `Pressable`, `Button` and custom touchables must have `accessibilityRole` and label; ban `numberOfLines` on body text; ban `maxFontSizeMultiplier` below the AX5 ratio outside an allowlist with a design sign-off comment | ESLint custom rules (`eslint-plugin-react-native-a11y` plus two local rules) | PR |
| Component | render each screen component at default and AX5 content size; assert no truncation markers, hit areas at least 44 pt (56 pt for primary), labels present, focus order of sheets starts at the title | jest-expo plus Testing Library | PR |
| Audit | `performAccessibilityAudit()` over the E2E flow screens at default and AX5 | XCUITest | RC |
| Manual | E2E-15 script on D1 with VoiceOver, Reduce Motion, AX5, Bold Text, Increase Contrast; Switch Control for the stories (A-REQ-007) | person | Binary release |
| Web | axe-core in Playwright for the web contribution page, delete-account page and legal pages; 200% zoom; 48 px targets | Playwright | Web release |
| Emails | HTML notice emails rendered and checked with axe; plain-text part present | Playwright on rendered HTML | Release that changes emails |

**F** `apps/mobile/src` has 24 `maxFontSizeMultiplier` uses; TDD 01 notes caps on letter text in Review, Write and Read together. **K** Until the design lead decides how Large Print compensates, the AX5 gate will fail on those screens; that is the honest result and should not be waived by test changes.
**R** Recruit 2 or 3 beta testers who use VoiceOver or large text daily (section 11); their findings outrank our script.

---

## 6. Content-rule and copy tests

**F** `rules.test.ts` covers characters, emoji, exclamation count, fear and loss words, AI-writing claims, prompt coverage and gendering (prompts only), gap prompts, placeholders, store lengths, lock-screen length and button length. **F** It does not cover several rules the PRD checklist says it does. New rules (BL-Q05), each titled with its ID and run over every string in `packages/content` (strings, store, site, book) unless noted:

| Rule | Scope | Pattern or method | IDs |
|---|---|---|---|
| No daily rhythm, streaks or gap counts | `notifications.*`, `settings.reminders.*`, `onboarding.reminder.*`, `moments.*` | `/\b(daily|every day|each day|in a row|missed|since your last|streaks?)\b/i` and `/\b\d+\s+(days?|nights?)\b/` | C-REQ-005, K-03, C-REQ-015 |
| No comparatives or per-author counts in moments | `moments.*` | `/\b(more than|most|fewer|less than|ahead|behind)\b/` and placeholders other than `{count}` of book totals | C-REQ-015 |
| No child-directed copy | store, site | `kids`, `let them`, `on their own`, `listen alone`, `for children` | LEGAL-REQ-045, K-20 |
| No print promise | all | `/\bprint(ed|ing|s)?\b/i` with an allowlist for the `largePrint` value "Large print" | K-32 |
| Beta strings only in About and store | source scan of `apps/mobile/src` | `about.beta` keys referenced only from the About screen; `store.promotionalTextBeta` only in store | K-13 |
| Shutdown notice says 90 | all copy plus `docs/legal/*.md` | every `\d+ days'? notice` near "shut" equals 90 | PRD-REQ-009, K-05 |
| Promise line wording | all | "listening" never appears in a free-scope promise; "playing your recordings" does | K-11 |
| Claims registry | all | every string tagged as a claim in `packages/content/claims.ts` (new) has a registry entry with counsel status; untagged strings matching `/\b(encrypt|private|never|only you|on your phone|delete everything)\b/i` fail unless tagged | LEGAL-REQ-044, PRD-REQ-008 |
| Never gender the child | all strings, not only prompts | pronoun regex on strings containing `{child}` or addressed to the child | CLAUDE.md |
| "fix", not "tidy" in new strings | strings added after 2 Oct | allowlist of the existing `tidy` keys pending K-26 | K-26 |
| Brand name only from `packages/brand` | `apps/`, `packages/` excluding brand | the public name string must not appear | CLAUDE.md |
| No hardcoded user-facing text | `apps/mobile/src` | ESLint rule: JSX text children and `title=` literals must come from `copy` | DoD 4 |
| Push payload builders carry no content | `packages/core` notification builder | builder output for Asha fixtures contains only key ids and `{child}` when allowed | LEGAL-REQ-054, C-NFR-005 |
| Trial-ineligible sheet has no "free" | sheet model | unit test | C-REQ-022 |

**R** Copy review stays human too: every PR that changes `packages/content` gets a "voice" reviewer (brand owner) in CODEOWNERS; the tests catch rules, not tone.

---

## 7. Data, RLS and performance tests

### 7.1 Database access (extends TDD 02 section 8 and TDD 04 section 8)
- **Generated access matrix (R, BL-Q09).** One table `supabase/tests/matrix.yaml`: roles {author, co-parent, contributor with `family_can_read` on and off, left member, removed member, stranger, anonymous web contributor, service} x objects {entries, book_entries, children, child_members, child_member_prefs, dictionary_terms, child_invites, deletion rows, audit_events, policy_acceptances, entitlements, each Storage bucket} x verbs {select, insert, update, delete, each RPC}. Expected outcome per cell. The runner fails if a new table, role or RPC has no row, so coverage cannot silently drop.
- **Fixtures.** Asha's family: Mama and Papa (parents of Asha and Avi), Nani (contributor on Asha only), Dadi (contributor on Avi, `family_can_read` off), a stranger, an anonymous web contributor. The cross-child leak test runs in both directions.
- **Harness fix (TDD 02 C18).** Apply Supabase's default grants to `anon` and `authenticated` before migrations, so a migration that forgets to revoke is caught.
- **Clock-controlled retention.** `retention.test.mjs` with just-inside and just-past pairs for every LEGAL-REQ-033 and DATA-REQ-066 row (TDD 05 9.3).
- **Migration upgrade test.** For each PR with a migration: apply main's migrations, load fixtures, apply the new one, rerun all suites. **F** Today tests apply all migrations to an empty database only.
- **Sync parity (TC-15).** PowerSync sync rules evaluated in Node against the same fixtures; rows and columns per user must equal RLS results (TDD 02 8.1). **A** feasibility of running sync rules offline (TDD 02 SYNC-1).

### 7.2 Device data integrity
- Atomic save with fault injection after each statement (DATA-REQ-048); upsert never changes `child_id`, `raw_transcript`, `captured_at` after sync (DATA-REQ-040); re-ownership all-or-nothing (A-REQ-015); local schema migration from every past version (TDD 01 7.2). Runner: vitest with Node SQLite.
- Kill-during-save, 500 iterations on D1, zero loss (PRD 7.4 gate). **R** automate with a device script that taps Save and kills the process at a random delay (0 to 400 ms); human starts it and reads the report.

### 7.3 Performance
| Test | Where | Gate |
|---|---|---|
| Read-path query budgets and plan shape (exists) | PGlite, PR | PR |
| Realistic letter sizes and write path with triggers on (TDD 06 BL-R01, R02) | PGlite, PR | PR |
| 10k-family plan check, pgbench concurrency (TDD 06 R03, R04) | nightly | nightly red blocks next RC |
| JS bundle and asset size; intro images 250 KB each, 1.5 MB total; app download 80 MB or less | CI (`expo export` size report), PR | PR |
| Device budgets (cold, warm, transitions, record start, save commit, switch child, export) | D1, 200 samples, RC | Binary release |
| Load at 2x the 1k targets | staging k6 (TDD 06 R11) | Public launch |
| Load at 2x the 100k targets | staging | Passing 25k families |

**R** Re-run a failed PGlite timing once and compare medians before failing the PR (TDD 06 CR-13); plan-shape checks never retry.

---

## 8. Analytics contract tests

**F** The analytics package is the best-tested part of the repo outside the engine: consent gate, allowlist, 40-character limit, canary, revoke, sampling, queue cap, catalogue rules and docs parity (39 tests). **F** It is not yet wired into the app, so nothing proves the app calls it correctly.

| Contract | Test | Layer | Status |
|---|---|---|---|
| Catalogue equals TRACKING_PLAN (names, properties, enums, L-levels) | `catalog.test.ts` docs parity | L1 | E |
| Every event cites a requirement ID that exists | catalogue test plus `scripts/trace.mjs` cross-check against the requirement index | L1, L0 | P (cites, not validated against the index) |
| Every call site in `apps/mobile` uses a typed `track()` with a catalogue event | `tsc` (typed API) plus ESLint ban on the vendor SDK import outside `packages/analytics` | L0 | N |
| No screen-name autocapture or replay | PostHog config test | L1 | E |
| Network: nothing before consent; stop after withdraw | E2E-03, E2E-11 with proxy | E2E | N |
| Bodies on the wire match the schema exactly (no SDK-added fields beyond allowlist) | proxy capture in E2E-11 validated by the same JSON schema the catalogue generates | E2E | N |
| Sentry: no breadcrumbs with paths, no request bodies, SQLSTATE only | scrubber unit tests (BL-021) and a forced test crash in E2E with Asha canary | L1, E2E | N |
| Children only as ordinals and `child_count_bucket` | catalogue test | L1 | E |
| Server aggregates (PRD-REQ-017) return only counts | `aggregates.test.mjs` in PGlite | L3 | N |
| Deletion requests PostHog and Sentry deletion of the analytics id | purge worker test with fake vendors | L4 | N |
| Volume ceiling (about 150 events per active user per month) | simulation: replay a scripted month of an Asha parent through the client and count | L1 | N |

**R** Any change to the catalogue requires the analytics engineer and privacy counsel as reviewers (CODEOWNERS on `packages/analytics/src/catalog*` and `docs/analytics/TRACKING_PLAN.md`).

---
## 9. Regression and release gates

### 9.1 Gate ladder (R)

| Gate | When | Must pass | Who signs |
|---|---|---|---|
| G0 PR | every pull request | PR CI (section 10): static, unit, database, bundle size, affected Edge Function and web tests; trace report attached; no test deleted or skipped without an ID-cited reason in the PR | CI plus one reviewer (CODEOWNERS for content, analytics, migrations) |
| G1 main | merge to `main` | G0 on the merge commit; `main` always releasable (CLAUDE.md) | CI |
| G2 internal TestFlight (founding family) | any binary to internal testers | G1 plus nightly green in the last 24 h (Maestro 15 flows on simulator, fuzz, integration, log canary); manual smoke on D1 | QE lead |
| G3 external TestFlight (cohorts C1, C2) | first external build and every external build | G2 plus every P0 LEGAL-REQ and DATA-REQ test in section 2 for shipped scope green; deletion verification in staging; 1k x2 load test once (PRD 7.8); privacy labels and manifest generated and diffed; VoiceOver script (E2E-15) on D1 | QE lead and founder |
| G4 App Store submission | release candidate tag `ios-v*` | G3 plus all 76 PRD section 6 lines pass on D1 and D2 with evidence; device budgets (200 samples); kill-during-save 500x; manual M-01 to M-09; no open S0 or S1 | Founder |
| G5 post-release | phased release days 1 to 7 | crash-free sessions 99.8% and users 99.5% (App Store Connect and TestFlight metrics, not only consenting Sentry); zero data-loss reports; pause phased release on any S0 | On-call engineer |
| OTA | any JavaScript-only update, if `expo-updates` is used (**Q**) | same as G3 for the changed scope, plus Maestro on the exact update bundle; OTA never changes consent, gate or paywall behaviour without a binary (**R**) | QE lead |

### 9.2 Regression policy
- Every bug fix lands with a test that failed before the fix, titled with the bug id and the requirement id.
- An escaped S0 or S1 gets a short written review: which layer should have caught it, and the test that now does.
- The regression suite is the full automated suite; there is no separate hand-picked regression list to rot.
- Quarantine: a flaky test may be quarantined for at most 7 days with an owner; quarantined tests still run and report; a P0 requirement may never be left with only quarantined coverage at G3 or later.
- Kill switches (LEGAL-REQ-040) are tested at G3: each switch flips in staging and the app reacts within 5 minutes.

---

## 10. CI pipeline design (GitHub Actions)

**F** No CI exists; local timings on 3 Oct 2026 (2-core container): `npm test` 9 s, `npm run test:db` 41 s, `npm run typecheck` 12 s. **A** GitHub-hosted Ubuntu runners are similar or faster; `npm ci` takes 60 to 90 s cold and under 20 s with a restored `node_modules` cache.

### 10.1 Workflows

**`ci.yml`** on pull request and push to `main`. Ubuntu, Node 22 (repo `engines` says 20 or later; pin 22 to match local, **R**), `concurrency: cancel-in-progress`, `timeout-minutes: 10` on every job.

| Job | Steps | Runs when | Est. time |
|---|---|---|---|
| `install` | restore `node_modules` by `package-lock.json` hash, else `npm ci` and save | always | 0.3 to 1.5 min |
| `static` (needs install) | `npm run typecheck`; ESLint (a11y, copy, analytics import bans); `scripts/trace.mjs`; `scripts/data-map.mjs` diff; `scripts/sdk-denylist.mjs`; `scripts/manifest-lint.mjs`; gitleaks on the diff | always | 1.5 min |
| `unit` (needs install) | `npm test -- --reporter=junit`; upload JUnit | always | 1 min |
| `db` (needs install) | `npm run test:db` split into two shards (`perf` alone, others together); JUnit from the harness (BL-Q01) | `supabase/**`, `packages/core/**` or nightly; always on `main` | 1.5 min |
| `mobile` (needs install) | `expo export --platform ios` with Metro cache; bundle and asset size report against budgets; component tests (jest-expo) | `apps/mobile/**`, `packages/**` | 3 to 4 min |
| `functions` | `deno test supabase/functions` with fake vendors | `supabase/functions/**` | 1 min |
| `web` | Playwright WebKit and Chromium, axe | `apps/web/**` (when it exists) | 3 to 4 min |
| `required` | aggregates the above for branch protection | always | seconds |

Critical path: install (1.5) + mobile (4) = about 5.5 minutes worst case; typical PR about 4 minutes. Budget: **under 10 minutes**, alarm at 8.

**`nightly.yml`** at 03:00 Pacific on `main`.
- Ubuntu: integration stack (Supabase CLI and PowerSync Open Edition in Docker), sync parity, chaos subset, purge-worker tests, log canary, verifier fuzz with a random seed (seed printed), 10k-family perf, pgbench concurrency.
- macOS (Xcode pinned): build or reuse the simulator `.app` keyed by `@expo/fingerprint` of native code, so JS-only changes skip the native build; run Maestro E2E-01 to E2E-14 on the SE and current-iPhone simulators; XCUITest accessibility audit; proxy assertions. **F/A** GitHub-hosted macOS runners do not run Docker, so the E2E backend is a dedicated cloud `e2e` Supabase project reset by script plus a PowerSync dev instance (**Q** cost; alternative is a self-hosted Mac mini running both).
- Failures open an issue labelled by severity; a red nightly blocks G2.

**`release.yml`** on `ios-v*` tags and `rc/*` branches: everything in nightly with no retries; EAS production build; privacy label and `PrivacyInfo.xcprivacy` generation and diff; bundle placeholder scan (`example.com`, scaffold scheme); evidence bundle (JUnit, proxy logs with Asha fixtures only, trace matrix) uploaded as an artifact and summarised in `docs/qa/evidence/`.

### 10.2 Caching
| Cache | Key | Saves |
|---|---|---|
| `node_modules` (includes PGlite wasm and vitest) | OS + Node version + `package-lock.json` hash | about 1 min per job |
| Metro and Expo cache (`~/.cache/metro`, `.expo`) | lockfile hash + `apps/mobile/metro.config.*` | 1 to 2 min on `mobile` |
| Simulator app build | `@expo/fingerprint` hash | 10 to 20 min of native build on nightly (**A**) |
| CocoaPods and DerivedData | `Podfile.lock` hash | native builds |
| Playwright browsers | Playwright version | 1 min |
| Maestro CLI | Maestro version | 30 s |
| Golden-audio corpus | manifest checksum (private bucket, fetched with a read-only secret; never in git) | corpus fetch |

### 10.3 Secrets and data in CI
Only Asha fixtures; no production keys in PR jobs; PR jobs from forks get no secrets; nightly and release use an `e2e` environment with sandbox RevenueCat, Supabase test projects and PostHog pointed at a sink (**R**: never the production PostHog project). Proxy logs are artifacts with 14-day retention.

---

## 11. Beta program (TestFlight)

**Q/K** TDD 02 8.4 treats any TestFlight beyond the founding family as public for LEGAL-REQ purposes; this plan assumes so until counsel says otherwise. Everyone in every cohort is 18 or older and passes the in-app 18+ gate like any user.

### 11.1 Cohorts
| Cohort | Who | Size | Entry gate | Length | What we learn |
|---|---|---|---|---|---|
| C0 internal | founders, engineers, the founding family (internal testers, no Beta App Review) | up to 10 | G2 | from the first binary | crashes, durability, daily-use friction |
| C1 friendly families | invited families chosen for coverage: at least 2 co-parent pairs, 3 grandparents using the web page, 2 Hindi or code-switching speakers, 1 twins or multiples family, 2 VoiceOver or large-text users, 1 separated co-parent pair if any volunteer (UR 1.1) | 15 to 25 families | G3 | at least 3 weeks | first run, family loop, transcription fidelity on real accents, accessibility |
| C2 public link | TestFlight public link with a tester cap, US only | 100 to 300 | G3 plus C1 exit criteria | at least 3 weeks | scale of sync and notices, trial flows in sandbox, retention signal |

Trials and purchases in TestFlight use the sandbox and cost nothing (**A**: StoreKit sandbox behaviour in TestFlight with accelerated renewal; verify in BL-Q18), so C2 tests the Plus flow but not real conversion.

### 11.2 Feedback channels and privacy
- **K** TestFlight's screenshot feedback can capture letter text and child names (L4 data) and sends it to App Store Connect. **R** Tell testers in the welcome note not to screenshot letters; prefer an in-app "Report a problem" (Settings, Help and Legal, Support) that sends app version, build, plan state, route enum and recent error codes, never content (C-REQ-016 support prefill rule). **Q** whether TestFlight screenshot feedback can be turned off for a group.
- Crash data comes from TestFlight and App Store Connect for everyone, and Sentry only for consenting testers (K-01).
- A short survey at day 7 and day 21 (no letter content asked for).

### 11.3 Triage and SLAs
| Severity | Definition | Acknowledge | Resolve or mitigate |
|---|---|---|---|
| S0 | letter lost or silently changed; machine added meaning; L3 or L4 data exposed to the wrong person or a vendor; anything created for a minor; consent bypassed | 2 hours (waking), 24/7 during C2 | kill switch or build pulled within 24 hours; fix in the next build; written review |
| S1 | P0 flow blocked (cannot save, sign in, invite, export, delete); crash loop; wrong charge or notice | 1 business day | fix in the next build (target 3 business days) |
| S2 | flow degraded with a workaround; accessibility failure on a P0 screen | 2 business days | scheduled within 2 weeks; accessibility failures on P0 screens block G4 |
| S3 | cosmetic, copy, P1 polish | 5 business days | backlog |

All tester feedback is read and labelled within 1 business day; every tester who reports an S0 or S1 hears back within 2 business days. One triage board (GitHub issues with `beta`, `S0` to `S3`, `area/*` labels); issues may never contain letter text, child names or screenshots of letters; reporters' details are kept outside the issue.

### 11.4 Cohort exit criteria
C0 to C1: 14 days with zero open S0, crash-free sessions 99.5% or more, kill-during-save passed. C1 to C2: 21 days, zero open S0 and S1, crash-free sessions 99.8% or more, no transcription fidelity complaint traced to an engine edit, web page completed by at least 3 grandparents without help. C2 to App Store: G4 plus the founder's decision.

---

## 12. Critique of the current tests

| # | Severity | Finding | Evidence (F) | Fix |
|---|---|---|---|---|
| Q-01 | Critical | A test asserts a privacy defect as correct: a contributor reads the whole book through `book_entries` regardless of approval and `family_can_read` | `data_governance.test.mjs` line 92 (`contributor sees the book through the view only` expects 3 rows); TDD 02 C2 | Replace with B-REQ-009 and B-REQ-011 checks when the policy migration lands (BL-Q12); until then mark it `[KNOWN-DEFECT B-REQ-011]` so the trace report shows it red |
| Q-02 | Critical | Nothing enforces the suites: no CI, no branch protection | `.github/` absent; BL-004 not started | BL-Q28 in week 1 |
| Q-03 | High | The app has no tests at all; every P0 phone behaviour in PRD section 6 is unproven | `apps/mobile` has no test files or runner | BL-Q08, BL-Q25 to BL-Q27 |
| Q-04 | High | Verifier tests are hand-picked; property testing is absent and the verifier accepts negation, tense, `stt_fix` to any dictionary term, contraction and mood changes | TDD 03 7.1 reproduced cases; `core.test.ts` has 13 adversarial cases | BL-Q02 with fast-check and the TDD 03 regressions |
| Q-05 | High | No test ties requirements to tests; DoD 1 is not met by any existing title | 0 of 319 titles carry a bracketed ID | BL-Q01, BL-002 |
| Q-06 | High | Content rules the checklist claims are enforced are not: reminder rhythm words, "kids" and child-directed copy, print, beta placement, claims registry, 90-day pledge, gendering outside prompts | `rules.test.ts` has no such cases (only "streak" via the fear list) | BL-Q05 |
| Q-07 | High | `child-input` flag is not represented in core: the selector serves `together` prompts whenever a caller passes `together: true`, and a test asserts that path | `core.test.ts` line 292; no flag in `packages/core/src` | BL-Q04: flag parameter, default off, test that `together` is never returned when off |
| Q-08 | Medium | Database tests are one linear script per file with shared state: an early failure cascades into misleading later failures, and there is no per-check report CI can show | `harness.mjs` `check()` logs PASS or FAIL and counts | JUnit output and named sections with fresh fixtures per section (BL-Q01) |
| Q-09 | Medium | Harness grants privileges after migrations, so missing revokes from Supabase default grants are invisible | TDD 02 C18 | BL-Q09 |
| Q-10 | Medium | `dictionary is private to its owner` will contradict B-REQ-006 (child-level name terms readable by members) | `rls.test.mjs`; B-REQ-006 acceptance | Split owner terms and child terms in BL-Q12 |
| Q-11 | Medium | Analytics tests use a fake provider; the real PostHog React Native SDK's disk persistence and flag fetching before opt-in are untested, which is what checklist line 70 ("nothing queued on disk") depends on | `analytics.test.ts` provider stub | E2E-03 container scan plus a vendor-adapter test with the real SDK in jest-expo (**A** it can run headless) |
| Q-12 | Medium | Perf test data is unrealistic and the write path runs with triggers off | TDD 06 CR-1, CR-2 | TDD 06 BL-R01, R02 |
| Q-13 | Medium | Classification covers database columns only; buckets, device stores, SDKs, log streams and events are not checked against one data map | `classification.test.mjs` 6 checks; PRD-REQ-010 | BL-016 |
| Q-14 | Medium | Migrations are tested on an empty database only; no upgrade path test | `run.mjs` applies all files to a fresh PGlite | BL-Q09 |
| Q-15 | Low | Design-token test checks text contrast only; controls, focus rings and disabled states (3:1) are not checked | `tokens.test.ts` | add pairs in BL-Q08 |
| Q-16 | Low | Experiments tests run in `npm test` but the golden-audio corpus that would gate model changes is not in CI | `experiments/*.test.ts` | TDD 03 7.3; nightly corpus job once the scripted corpus exists |
| Q-17 | Low | Global "at most 3 exclamation marks" is brittle and will fail on unrelated additions | `rules.test.ts` line 41 | scope per surface, keep the spirit |

Strengths worth keeping: the adversarial verifier style, the canary family in analytics tests, clock-controlled purge, append-only acceptance checks, and the "fix the copy, not the test" rule.

---

## 13. Build plan

Sizes: **S** under a day, **M** 1 to 3 days, **L** more than 3 days. BL-Q## are proposed new backlog tasks; "Maps to" names existing BACKLOG IDs or TDD tasks they extend.

| # | Task | Size | Maps to | Satisfies | Depends on | Week |
|---|---|---|---|---|---|---|
| BL-Q01 | Retitle all 319 existing tests with requirement IDs; JUnit output and sections in the DB harness; mark Q-01 as known defect | S | BL-002 | DoD 1 | none | 1 |
| BL-Q28 | `ci.yml` (PR) with caches and `required` job; branch protection; then `nightly.yml` and `release.yml` | M | BL-004 | 6.10, DoD 1 | BL-Q01 | 1 (PR), 3 (nightly, release) |
| BL-Q06 | Static scans: SDK denylist, manifest lint (permissions, ATS, scheme), gitleaks, placeholder scan, AsyncStorage ban in auth | M | BL-004, BL-031 | LEGAL-REQ-016, -021, -026, A-NFR-008, -010 | BL-Q28 | 1 |
| BL-Q05 | Content rule additions (section 6) and `claims.ts` registry | M | DoD 4 | C-REQ-005, -015, K-13, K-32, LEGAL-REQ-044, -045, PRD-REQ-008, -009 | none | 1 |
| BL-Q04 | `child-input` flag in the prompt selector, default off; goals ordering test | S | BL-022 | PRD-REQ-005, B-REQ-013 | none | 1 |
| BL-Q02 | Verifier property tests (fast-check) and TDD 03 regressions | M | TDD 03 BL-064 | constitution, DATA-REQ-040, -041 | none | 1 |
| BL-Q08 | jest-expo plus Testing Library harness; a11y ESLint rules; AX5 render helper; token control-contrast pairs | M | BL-030 | A-NFR-005 to -007, B-NFR-006, LEGAL-REQ-051 | BL-030 | 2 |
| BL-Q25 | Maestro harness: `e2e` build profile, seed, clock and config deep links (blocked in release builds), mitmproxy scripts, container and export inspectors | L | BL-004, BL-030 | all E2E | BL-032 | 2 |
| BL-Q26 | Flows E2E-01 to E2E-04 | M | BL-037, BL-033, BL-042, BL-050 | PRD-REQ-019, B-REQ-001, A-REQ-012 to -014, K-14 | BL-Q25 and the features | 2 to 3 |
| BL-Q09 | Generated RLS matrix, default-grants harness fix, migration upgrade test | L | BL-015, TDD 02 | LEGAL-REQ-024, B-NFR-003, PRD-REQ-014 | none | 2 |
| BL-Q10 | `consent.test.mjs` (server consent gate, terms first, age_attested) | S | BL-054, BL-014 | LEGAL-REQ-001, -006, PRD-REQ-002 | TDD 02 M8 migration | 2 |
| BL-Q03 | Safety tier no-egress: catalogue rule and proxy body scan | S | BL-020 | LEGAL-REQ-015 | BL-Q25 | 2 |
| BL-Q07 | Log canary across device logs, function logs, push payloads, analytics bodies | M | BL-021 | LEGAL-REQ-014, A-NFR-012 | BL-Q25 | 3 |
| BL-Q30 | Device kill-during-save script (500x) and report | S | BL-044 | PRD 7.4, DATA-REQ-048 | BL-042 | 3 |
| BL-Q19 | `create_child` Plus rule, first-run batch, joined books, `book_has_plus` DB tests | M | BL-036 | PRD-REQ-015, K-28, C-REQ-028 | data architect migration | 3 |
| BL-Q11 | Sync client tests: rejected writes (TC-16), sign-out guard | M | Later: sync client | DATA-REQ-043, A-REQ-033 | sync client | 4 |
| BL-Q12 | Invites, approvals, visibility, removal, dictionary child terms; replace Q-01 check | M | Later: invites and family | B-REQ-006 to -011, LEGAL-REQ-024, B-NFR-004 | TDD 02 M5, M6 | 4 |
| BL-Q14 | Sync parity TC-15 | L | ADR 0004 | PRD-REQ-004, -014 | TDD 02 SYNC-1 | 4 |
| BL-Q15 | Notification planner suite (cadence, quiet window, DST, rotation, hidden book, due date, include child, push payload) | M | Later: reminders | C-REQ-001 to -007, -011, B-REQ-014, -015, PRD-REQ-013, LEGAL-REQ-054 | planner in core | 4 |
| BL-Q16 | Moments and pause-celebrations tests | S | Later: reminders | C-REQ-010, -012, -015 | planner | 4 |
| BL-Q20 | Read together allowance unit test and E2E-05 | S | Later: Read together | PRD-REQ-020 | BL-022 | 4 |
| BL-Q27 | Flows E2E-05 to E2E-15 (as features land) | L | features | section 3 | BL-Q25 | 4 to 6 |
| BL-Q21 | Export builder tests, TC-17, EXIF stripping, keep-safe card order | M | Later: export | C-REQ-017, -018, LEGAL-REQ-013, -034, DATA-REQ-050 to -053 | export module | 5 |
| BL-Q22 | Deletion: purge worker TC-19, `verify-deletion.mjs`, `retention.test.mjs`, contributor notice on book delete, lapsed backups never purged | L | Later: deletion | C-REQ-019, LEGAL-REQ-029 to -033, DATA-REQ-019 to -027, C-NFR-008 | purge worker | 5 |
| BL-Q17 | Plus sheet model, offer placement truth table, fail-open static test | M | Later: Plus | C-REQ-022, -023, C-NFR-004, LEGAL-REQ-046, -050 | Plus sheet | 5 |
| BL-Q18 | Notice scheduler table tests, RevenueCat webhook Deno tests, StoreKit configuration file and XCUITest helper | L | Later: Plus | PRD-REQ-003, C-REQ-024 to -029, LEGAL-REQ-047, -049, C-NFR-002 | webhook function | 5 to 6 |
| BL-Q24 | AI gateway Deno tests and config lint | M | TDD 03 | LEGAL-REQ-004, -005, -018 to -020 | gateway | when the gateway is built |
| BL-Q13 | Web contribution page Playwright suite (taps, network, encryption, anonymous role) | L | Later: web page | B-REQ-008, B-NFR-002, -005, K-08, PRD-REQ-007, LEGAL-REQ-010 | `apps/web` | when the page is built |
| BL-Q23 | Manual scripts M-01 to M-09 and V-voiceover; `docs/qa/evidence/` template | S | BL-044 | manual checklist lines | none | 3 |
| BL-Q29 | Beta program setup: TestFlight groups, welcome note, content-free Report a problem, triage board and labels | M | BL-005 | section 11 | G2 build | 5 |

**Premature for v1 (R):** visual snapshot regression services, mutation testing, contract-testing frameworks (Pact), Android E2E gating, real-device iOS farms for every PR, the 100k x2 load test (gate is at 25k families), chaos testing in production, synthetic monitoring of the app. Revisit after public launch.

---

## 14. Open questions

| # | Question | Owner | Why it matters |
|---|---|---|---|
| OQ-1 | Minimum iOS version (17 assumed) | Founder, mobile lead | device matrix, XCUITest accessibility audit availability |
| OQ-2 | Where E2E runs: GitHub macOS minutes, a self-hosted Mac mini, or Maestro Cloud | Founder (cost) | nightly cost and whether Docker backends can run beside the simulator |
| OQ-3 | Does external TestFlight count as public launch for LEGAL-REQ purposes | Counsel | which gates C1 must pass; sequencing of BL-Q22 and BL-Q12 |
| OQ-4 | Can TestFlight screenshot feedback be disabled, and if not, how do we handle letter text in it | Counsel, founder | L4 data leaving through Apple feedback |
| OQ-5 | Who runs device checks (D1, D2) for each release candidate | Founder | G4 capacity; scripted human tasks need a named person |
| OQ-6 | Do RevenueCat sandbox and StoreKit test transactions cover trial notices end to end in the simulator | Payments engineer | whether E2E-14 is automated or partly manual |
| OQ-7 | Should `scripts/trace.mjs` block merges from day one or report only until each scope's backlog is complete | Founder, QE | developer friction versus traceability |
| OQ-8 | Will the app use OTA updates (`expo-updates`) | Mobile lead | adds the OTA gate in 9.1 |
| OQ-9 | PRD section 9 Q9 (first-run siblings with different dates free?) | Founder | E2E-02 and BL-Q19 assertions |
| OQ-10 | Large Print and `maxFontSizeMultiplier` caps | Design lead | AX5 gate on Review, Write, Read together |
| OQ-11 | Recruiting and paying VoiceOver and grandparent testers for C1 | Founder | accessibility and web page evidence quality |
| OQ-12 | Budget for a dedicated `e2e` Supabase project and PowerSync instance | Founder | nightly backend for Maestro |

## Changelog
| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-10-03 | First draft: inventory, traceability for all 76 checklist lines and P0 criteria, 15 E2E flows, matrix, gates, CI, beta, critique, build plan. |
