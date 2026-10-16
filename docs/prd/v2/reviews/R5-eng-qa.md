# R5 Engineering manager and QA lead review of PRD V2

Reviewer: independent engineering manager and QA lead (did not write the PRD; has run many parallel coding agents with one human merging). Date: 13 Oct 2026. Branch read: `docs/prd-v2` at d921356, with `origin/develop` at ed16ca3 for the backlog, CI and test tree.

Scope: `README.md`, `08-delivery.md`, `07-quality-bar.md`, `06-nfr.md`, sections 7 and 12 of `features/F01` to `F21`; compared with `CLAUDE.md`, `docs/agents/COORDINATION.md`, `docs/agents/BOARD.md`, `docs/BACKLOG.md` (this branch and `origin/develop`), `.github/workflows/*.yml`, `.github/pull_request_template.md`, `.github/CODEOWNERS`, `apps/mobile/test/`, `apps/mobile/package.json`, `apps/mobile/eas.json`, `packages/api/src/remote-config.ts`, `packages/analytics/src/catalog.ts`.

Method: I parsed every section 7 and section 12 table with a script (707 requirement rows, 643 unique IDs, 599 of them P0; 250 WP rows), mapped each WP to a stream from the "Takes" lines in `08-delivery.md` section 3.3, and checked each WP's "Owns" paths against the stream globs. Counts below come from that script and are exact for the tables as written; where a spec uses a wildcard such as "the `[F09-REQ-*]` tests", I counted the ID as not named. Open PRs: `gh pr list` fails here (GraphQL returns 403 in this session), so I used the REST API (`gh api repos/thesaurabhpareek/earlyletters/pulls?state=open`): **34 open PRs**, oldest #2 (3 Oct), matching 08 section 1.

## Verdict

**Not ready to dispatch 20 streams. Ready to dispatch about 8, against a cut scope.**

The specs are better than most I have seen: three quarters of the sampled acceptance criteria have numbers and a Given/When/Then an agent can turn into a test. The delivery plan is honest about its own confidence. The problem is not the writing. It is the arithmetic and the tooling:

1. **The merge budget cannot carry the plan.** About 100 founder merges to the release candidate against 250 WPs, 65 M-JR tasks and 34 open PRs. Worse, the fenced cap (4 a week) is about 15 slots before freeze, against at least 32 fenced items the streams are told to take, and the R-17 security gate alone needs 6 fenced merges in 8 working days.
2. **The quality bar cannot pass on the dates in 08.** G3 (first external build, Thu 29 Oct) requires a C0 period, kill runs on the SE 3, a server restore drill and VoiceOver scripts that 08 schedules after C1 starts or not at all.
3. **The device work is two to three times the founder's hours,** on hardware the team does not own (one SE 3 cannot be both iOS 17 and latest), with no named operator.
4. **The test harnesses that the Definition of Done assumes do not exist:** no component render harness for the AX5 tests 11 WPs require, no Maestro or mitmproxy in CI for the 175 `[auto]` checklist lines that lean on them, no trace script, no `perf` build profile.
5. **Traceability is one-way.** 49 requirement IDs mean different things in different specs, 180 P0 IDs appear in no WP row, and `docs/BACKLOG.md` (which unattended runs read) contains zero WP ids.

Fix EQ-01 to EQ-05 before wave 1 dispatch on Wed 14 Oct; they are a day of PM and delivery-lead work plus two founder decisions (scope cut and C1 date). Fix the P1 rows before each stream's first PR. At the end of this file is a 60-PR v1.0 list that fits the budget.

## 1. Can an agent finish a WP without asking? A scored sample

40 requirements drawn by a fixed-seed random sample (seed 20261013), two per spec (one for F14 and F17), P0 and P1 only. "Testable" means a test with a pass or fail bar can be written from the acceptance criteria alone. "WP" is whether a section 12 row names the ID in its Done when. "File" is whether the spec names the test file.

| # | Requirement | Testable | WP | File | Why |
|---|---|---|---|---|---|
| 1 | F01-REQ-006 Returning launches skip entry | Yes | WP-F01-03 | No | Clear route rule; unit test on the route resolver |
| 2 | F01-REQ-005 Welcome with three actions | Yes, but not today | WP-F01-04 | No | 44 pt, 56 pt and AX5 are numbers, but no render harness exists to measure them (EQ-04) |
| 3 | A-REQ-025 Resend limits | Partly | WP-F02-06 | No | 60 s client side is testable; "5 per address per hour" is a hosted Supabase Auth setting PGlite cannot test; no owner of that config |
| 4 | PRD-REQ-001 (F02) One ask per session | No | none | No | "Session" is undefined; four specs define the rule four ways (EQ-19) |
| 5 | B-REQ-013 Goals (F03) | n/a | none | No | A v1.1 row inside the v1.0 table; AC is "Not in v1.0" |
| 6 | B-REQ-005 Due-date mode creates the book | Yes | none | No | Testable against F09's Before You chapter, but no WP names it |
| 7 | F04-REQ-017 Language chip on Listen | Yes | WP-F04-06 | No | Crisp; depends on F03 languages API that has no contract |
| 8 | PRD-REQ-001 (F04) Capture never stacks asks | Yes | none | No | Testable through the ask sequencer; no WP owns it |
| 9 | F05-REQ-040 Speed on SE 3 | Partly | WP-F05-12 | No | p90 30 s is clear; "2% battery per letter" names no method (Instruments Energy Log or battery level) and is below what one run can read |
| 10 | PRD-REQ-004 (F05) Author-only working material | Partly | none | No | Names `transcript_versions`, a table deferred to v1.1 (WP-F05-09) |
| 11 | F06-REQ-039 No control makes words nicer | Partly | WP-F06-14 | Yes | Content rule is testable; "no flag can add one" is a universal negative with no stated check |
| 12 | F06-REQ-004 Sentence type in every script | Yes | none | No | Exact characters and refusals; no WP row names it |
| 13 | F07-REQ-007 Names and words per child | Yes | WP-F07-06 | No | Offline add, edit, delete is checkable |
| 14 | F07-REQ-018 Term deletion | Yes | WP-F07-04 | Yes | Byte-identical letters; but WP-F07-04 has no stream (EQ-07) |
| 15 | F08-REQ-005 Transcription reads the original | Yes | WP-F08-04 | No | One assertion on the input URI |
| 16 | F08-REQ-002 Original never altered | Partly | WP-F08-04, -07 | Folder only | Hash bar is clear; "no code path opens an original for writing" needs a static check nobody owns; "app updated" needs a device; WP-F08-07 has no stream |
| 17 | C-REQ-012 Pause celebrations per person | Yes | WP-F09-08 | No | Two-person fixture |
| 18 | F09-REQ-012 Recently deleted shelf | Yes | WP-F09-07 | No | Order, fields and erase order are explicit |
| 19 | C-REQ-010 First Read together milestone | Yes | none | No | "Once per reader" storage is unstated |
| 20 | F10-REQ-005 Nothing plays before Play | Yes | WP-F10-04 | No | Clear |
| 21 | LEGAL-REQ-032 (F11) Removal reaches every device | Yes | none | No | p95 60 s needs the two-client probe that does not exist |
| 22 | F11-REQ-022 Take all my letters out (P1) | Yes | none | No | Clear numbers |
| 23 | PRD-REQ-015 Every book is free | Yes | none | No | 0 Plus sheets, 0 StoreKit calls |
| 24 | B-REQ-014 Hide stops notifications for every member | Yes | WP-F12-07 | No | Needs a two-device or simulated-sync test; not said which |
| 25 | F13-REQ-012 Payload carries a route id only | Yes | WP-F13-04 | No | Exact shape |
| 26 | F13-REQ-015 No reminder on a plan-notice day | Yes | WP-F13-02 | "its test" | Exact |
| 27 | F14-REQ-028 Keep sheet says the letter is safe first | Yes | none | No | Order and banned strings are checkable |
| 28 | DATA-REQ-052 Export always available | Yes | WP-F15-05 | No | Device timing on SE 3 |
| 29 | LEGAL-REQ-034 Complete export | Yes | none | No | Schema check named; WP not |
| 30 | B-NFR-003 (F16) Access and parity tests | Yes | none | No | "As F16-REQ-008" pointer works |
| 31 | F16-REQ-003 Idempotency ledger | Yes | none | No | Clear; R2 AR-01 says the built ledger differs |
| 32 | DATA-REQ-013 No direct un-delete | Yes | WP-F17-04 | No | Clear |
| 33 | F18-REQ-024 Insights agent never commits | No | WP-F18-10 | No | A process and token-scope rule; no test can live in the repo |
| 34 | F18-REQ-025 Money numbers only from ASC | No | WP-F18-12 | No | A report-writing rule, human-checked |
| 35 | F19-REQ-024 Every flag listed in review notes | No | WP-F19-14 | No | Review notes have no file path to diff against |
| 36 | F19-REQ-011 Each kill switch has a consumer | Yes | WP-F19-12 | No | Three named consumers |
| 37 | F20-REQ-012 No fear language in support copy | Yes | WP-F20-04, -05 | Yes | Needs the content rules extended to `docs/support/**` |
| 38 | F20-REQ-013 First reply targets | No | WP-F20-07 | No | An operations SLA measured in C1, not a build test |
| 39 | F21-REQ-023 `security.txt` served | Yes | WP-F21-10 | No | Clear |
| 40 | F21-REQ-020 Prelaunch form | No | none | No | "Given the Playwright suite, Then each passes": no suite exists, "rate-limited" has no number |

**Score (39 scored, item 5 excluded):** testable 28 (72%), partly 5 (13%), no 6 (15%). A WP names the ID for 25 of 39 (64%). A test file is named for 4 of 39 (10%). Dependencies are explicit in the WP row for about half the sampled WPs; the rest say "none" while depending on an unbuilt contract (items 7, 14, 21).

Read: the acceptance criteria are good. What an agent cannot get from the spec is where the test goes, which harness runs it, and which WP and stream own it. Those are cheap to add and expensive to guess, because 20 agents will guess 20 ways.

## 2. Numbers from the full tables

| Measure | Count | Source |
|---|---|---|
| WPs in sections 12 | 250 | script |
| WPs with no stream in 08 section 3.3 | 38 (about 12 matter for v1.0) | script, EQ-07 |
| WPs taken by two or three streams | 15 | script, EQ-27 |
| WP "Owns" paths that 08 gives to a different stream | 57; about 45 after removing evidence files and spike folders 08 allows | script, EQ-08 |
| WPs whose Done when has no bracketed requirement ID | 37 (two are empty) | script, EQ-26 |
| WPs that name a BL id anywhere in the row | 116 of 250 | script, EQ-06 |
| WPs with no Status column at all | 121 (11 of 21 specs) | script, EQ-25 |
| WP ids in `docs/BACKLOG.md` on `develop` | 0 | grep, EQ-06 |
| P0 IDs named in no WP row | 180 of 599 | script, EQ-06 |
| Requirement IDs defined in two or more specs with different text | 49 | script, EQ-05 |
| `[auto]` lines in 07 section 3 | 175 (36 `[manual]`) | grep |
| WPs whose Done when needs an AX5 or component test | 11 | script, EQ-04 |
| Fenced items named in 08 "Takes" for v1.0 | at least 32 | count from 08 section 3.3, EQ-01 |
| Open PRs on 13 Oct | 34 | REST API |

## 3. Findings

Severity: **P0** blocks dispatch or makes a gate unpassable as written; **P1** fix before the stream that owns it opens its first PR; **P2** improve.

| ID | Sev | File and section | Problem | Evidence | Specific fix |
|---|---|---|---|---|---|
| EQ-01 | P0 | 08 sections 5.2, 6.1, 7 | The fenced merge cap cannot carry the R-17 gate or the fenced v1.0 work. Wave 1 P1 needs BL-347, BL-330, BL-331 rest, `peek_invite`, BL-334 and PR #30 (`.github/**` is fenced) merged by Fri 23 Oct: 6 fenced merges, each with two review verdicts and the label, against "at most 4 fenced" in the week of 19 Oct. None of the six exists as a PR on 13 Oct, and Tue 13 to Wed 14 is wave 0 with no feature PRs. Across waves 1 and 2, the "Takes" lines name at least 32 fenced items (S02 alone 16; S01 6; S05 2 to 5; S06 3; S07 3; S20 2) against about 15 fenced slots before freeze | 08 6.1 table; 08 3.3 S01, S02, S05, S06, S07, S20 Takes; 08 7 fenced paths; open PR list has no BL-347, BL-330, BL-331 or BL-334 branch | Publish a fenced queue with exactly 14 slots to freeze (list at the end of this file). Raise the cap to 6 in the week of 19 Oct only, and merge the six R-17 items as a batch with one shared security review. Fold BL-334 and `peek_invite` into one migration file. Everything else fenced either joins the queue by displacing an item or waits for 1.0.1 |
| EQ-02 | P0 | 07 sections 4.4, 5.1 (G3), 2.10; 08 sections 2.1, 5.3, 10 | G3 cannot pass for the first external build on Thu 29 Oct or C1 on Mon 2 Nov. G3 requires: C0 exit (14 days of C0 with zero S0; 08 starts C0 on Wed 21 Oct with the switch off and the switch-on build from Fri 30 Oct, so 12 days and 3 days); kill during save on SE 3 (08 schedules DL-01 on 9 to 13 Nov); the server restore drill "before the first non-founder family" (BL-247, WP-F16-08: scheduled nowhere in 08); VoiceOver V1 and V4; deletion verification in staging; kill switch drill; privacy labels diffed | 07 4.4 C0-to-C1 items 1 to 6; 07 5.1 G3 row; 08 2.1 C0 and C1 rows; 08 10 "Mon 9 to Fri 13 Nov ... DL-01 and DL-02"; grep of 08 for BL-247 and "server restore": no hits | The founder picks one, by Fri 16 Oct: (a) write a dated "G3 for C1 on 2 Nov" in 07 that lists which G3 items are deferred to G4 and why (my recommendation: keep R-01 Node and Hermes, kill during save on SE 3, deletion in staging, kill switch drill; move restore drill and V4 to before G4), and pull DL-01 forward to 19 to 23 Oct; or (b) move C1 to Mon 9 Nov and submission a week. Schedule BL-247 by name |
| EQ-03 | P0 | 07 sections 2.7, 2.9, 2.11, 3, 4.4 item 10, 5.1 G4; 06 section 0; 08 sections 2.5, 10, Q9 | Device work per release candidate is about 35 to 45 hours on one phone (my estimate: kill during save 50, kill while recording 50 at up to 120 s each, typed kills 100, Review kills 100, Speak latency 200 taps, transcription 30 runs per passed language with cool-down, listening copy 30 runs, export, settings sweep, VoiceOver V1 to V7, sandbox S-1 to S-10, two-phone sync, B6 drill with and without iCloud Keychain, DL-03 to DL-05, the 06 Gate rows at 200 samples each). G4 then says every 07 section 3 line passes on SE 3 **and** a current iPhone, and 07 2.7 says SE 3 **on iOS 17 and the latest iOS**. The founder has about 16 hours that week for everything. Hardware gaps: one owned SE 3 cannot run both iOS 17 and latest (iOS does not downgrade); S08 needs an iPhone 12 and an iPhone 15; B1 needs two phones on one Apple Account, S1-22 two phones on two accounts, S-7 a second Apple Account in a Family. Who runs the scripts is open (07 Q5, 08 Q9) | 07 2.7 "Owned devices: one iPhone SE (3rd gen) and one current iPhone"; 07 2.7 run table; 08 2.5 week of 16 Nov "about 16"; 08 3.3 S08 Done when; 06 0 "200 samples per metric" | Write a device budget table in 07 (run, device, minutes, who, which RC). Cut repetition: full suite once on the release-candidate build on SE 3 iOS 17, a 2-hour smoke on the current iPhone on latest iOS; drop "and a current iPhone" for `[auto]` lines. Buy or borrow a second SE 3 kept on iOS 17 [A: cost]. Name a paid device operator by Fri 16 Oct, or cut transcription languages to those that pass by 30 Oct and drop per-language device runs for the rest |
| EQ-04 | P0 | 07 sections 1.4, 2.1 (L2), 3; WP-F01-04, F02-05, F03-02, F04-06, F04-08, F05-08, F06-09, F07-06, F10-07, F11-05, F13-06; 08 S15 Done when | The Definition of Done requires "a component test at default and AX5" for every new or changed screen, and 11 WPs name AX5 or component tests in Done when. No such harness exists: `apps/mobile` runs `vitest` only, with no React Native render library, and 07 says the harness is "new, BL-Q08", an id that does not exist in `docs/BACKLOG.md` on `develop`. Adding it is a new package, which 08 section 4 makes pair mode with the founder. Left alone, S12, S15 and S11 will each add a different harness or skip the test | `apps/mobile/package.json` on `develop` (only `vitest`); `apps/mobile/test/` file list (logic tests only); grep of BACKLOG for BL-Q08: 0 | Add WP-F00-01 "component render harness" to S15, pair mode, first in wave 1 P2, with one decided library and one example AX5 test. Until it merges, every UI WP's Done when reads "AX5 by the VoiceOver and AX5 device script" and is marked as device evidence, not CI |
| EQ-05 | P0 | Sections 7 of F01 to F21; README "keeps every existing requirement ID ... so test titles still trace" | 49 requirement IDs are defined in two or more specs with different requirement text. A test titled with one of these IDs cannot be traced to one acceptance criterion, and two streams will write two tests that both claim it. Worst cases: DATA-REQ-046 is "Audio hashed when recording stops" (F04), "Integrity scrub" (F08) and "Corruption detection on text" (F16); C-REQ-016 is "Settings IA" (F17) and "Help opens an email" (F20); LEGAL-REQ-007 is the microphone primer (F04) and permission keys plus Face ID (F17); PRD-REQ-001 has four texts (F02, F04, F13, F18) | Script over section 7 tables; F04, F08, F16 rows for DATA-REQ-046 | One home spec per legacy ID; other specs cite it as "see F04" and add a new `F##-REQ-###` for their slice. Make `scripts/trace.mjs` (BL-002) fail on an ID defined in two section 7 tables |
| EQ-06 | P1 | README "How V2 relates to the backlog"; all sections 12; `docs/BACKLOG.md`; ADR 0011 | Requirement to WP to BL to test is not traceable. `docs/BACKLOG.md` on `develop` has 0 WP ids, yet ADR 0011 makes it the only queue unattended runs read, so WPs are invisible to them. 116 of 250 WPs name a BL anywhere; only F06 has a BL column. 180 of 599 P0 IDs appear in no WP row (F14 19, F18 18, F11 15, F17 15, F05 14, F16 13). `scripts/trace.mjs` is not built | Script counts; BACKLOG grep; `git ls-tree origin/develop scripts/` | Before dispatch, the PM lane adds one BL line per v1.0 WP in the cut list (60, not 250), each with `Satisfies:` and the WP id. Add a BL column to every section 12. S19 lands BL-002 in report mode in week 1, reporting P0 IDs with no WP and no test |
| EQ-07 | P1 | 08 section 3.3 Takes; F02, F03, F07, F08, F14, F15, F16, F19 sections 12 | 38 WPs are taken by no stream. Most are built, removed or human, but these are agent work v1.0 needs: WP-F07-04 (server dictionary migration; needed now that sync ships), WP-F08-07 (original-unaltered integrity test, a 07 section 3 line), WP-F14-18 (CI grep for purchase data, proves F14-REQ-014), WP-F03-04 (dictionary seeding), WP-F02-11 (email-code abuse job), WP-F15-09 (90-day pledge copy, a checklist line), WP-F16-12 (load test, a G4 item), WP-F16-00 (sync watermark spike, partly built); and the human or pair rows WP-F19-01, -03, -04 (key ceremony, pack host, first signed publish: kill switches and every non-English pack depend on them) | Script orphan list | Assign each in 08 3.3 or mark it cut with a reason: WP-F07-04 to S02, WP-F08-07 to S13, WP-F14-18 to S20, WP-F03-04 to S08, WP-F15-09 to S16, WP-F19-01/03/04 to the founder in 08 section 10 with dates |
| EQ-08 | P1 | Sections 12 "Owns" versus 08 section 3.3 | About 45 WP "Owns" cells give files to a stream that 08 does not let edit them. Examples: WP-F04-03 owns `docs/legal/DATA_CLASSIFICATION.md` (S17's); WP-F04-07 owns `write.tsx` (S10's) but S11 takes it; WP-F06-11 and WP-F09-04 own `lib/store.ts` (S03's); WP-F07-03 owns `packages/core/src/types.ts` (S09, CODEOWNERS founder); WP-F08-B3 owns `purge-worker/lib/buckets.ts` (S07's); WP-F14-15 and WP-F14-17 own `packages/api` (S07's); WP-F16-09 owns `lib/auth/session.ts` (S01's, fenced); WP-F19-12 owns `lib/sync` (S03's); WP-F18-01 owns `settings/privacy.tsx` (S14's) | Script over every WP row; 08 3.3 Owns lines | State in each spec's section 12 header: "08 section 3.3 governs file ownership; a path here owned by another stream is a request". Better: regenerate the Owns column from 08 by script and list the cross-stream requests per WP |
| EQ-09 | P1 | 07 sections 1.1, 1.2, 5.1 G0; `.github/workflows/ci.yml`, `migration-guard.yml`; 08 FT-20 | CI does not run what G0 says it runs. Missing from `ci.yml`: `expo lint` (07 1.2 item 2), docs lint (1.2 item 1), IPA size (G0), the trace check, the SDK denylist and analytics guard, the fence label check (PR #30, unmerged), a data-map diff, secret scan. And branch protection is to require only the `required` job, whose `needs` are install, unit, db, functions and typecheck: the migration guard is a separate workflow and is **not** required, so an edit to an applied migration can merge | `ci.yml` jobs; `migration-guard.yml`; 08 5.1 wave 0 "branch protection ... requiring `required`" | S20's first PR (with PR #30): add `migration-guard` and `expo lint` and docs lint to `required`; mark IPA size, Maestro and data-map diff as "release workflow only" in G0 so G0 is true. Until then 07 G0 lists only what runs |
| EQ-10 | P1 | 07 sections 2.1 (L5), 2.6, 5.1 G2, Q6; `.github/workflows/nightly.yml` | G2 (any internal TestFlight, planned Wed 21 Oct) needs "a green nightly in the last 24 h (Maestro flows, random-seed property tests, log canary)". The nightly runs only the verifier fuzz and the DB stack. Maestro CI exists only as `e2e/ci/ios-e2e.yml.example`; where it runs is open until "week 3" (07 Q6); mitmproxy capture is not built. Many `[auto]` lines depend on it ("0 requests in the proxy log", "full E2E run"); my regex finds at least 24 of 175, and every line that asserts what a screen shows needs either it or EQ-04's harness | `nightly.yml` jobs; `git ls-tree origin/develop apps/mobile/e2e/ci`; 07 section 3 | Decide 07 Q6 by Fri 16 Oct (a GitHub macOS runner for 5 P0 flows nightly is the cheapest start [A]). Until it runs, relabel proxy-based lines `[manual]` and drop "Maestro" from G2 for C0 |
| EQ-11 | P1 | 08 section 9 common header; 08 Q3; COORDINATION section 6 | The dispatch header tells agents to "Push only your own branch and open a PR". COORDINATION section 6 says "Agents never commit, push, deploy". Q3 is answered Wed 14 Oct, the same day wave 1 dispatches. Agents read COORDINATION first (CLAUDE.md says so) and will either stop or break a rule | 08 9 header; COORDINATION 6 first bullet; CLAUDE.md "Read COORDINATION.md before working" | Founder answers Q3 today; the coordinator edits COORDINATION 6 before the first dispatch, not after |
| EQ-12 | P1 | `docs/agents/BOARD.md` Active claims; COORDINATION section 2 item 3 | Live claims from 3 Oct still read `active`: `mobile-polish` on `apps/mobile/src/**` and `qa-e2e` on `apps/mobile/e2e/**`, `docs/qa/**`. COORDINATION 2.3 says an agent must not edit files overlapping a live claim. Read literally, S03, S04, S10 to S15 and S19 cannot start | BOARD claims table | Wave 0: the coordinator closes every 3 Oct claim with a pointer, then writes the 20 stream claims. Add a rule: a claim older than 48 hours with no check-in lapses |
| EQ-13 | P1 | 08 sections 1, 2.5, 5.1 | 34 open PRs include four competing agent operating systems (#4 "19 agents, dispatcher", #39 handoffs and activity ledger, #42 five steward agents, #76 release roster on `release/ios-v1.0`) and documents written for an on-device v1.0 that M14 makes false (#81 legal, #82 web legal pages, #87 data lifecycle, #90 feedback for an on-device v1.0). 08 budgets 2 hours to triage with no close rule. An agent told to "verify first" will read these branches | REST PR list; titles quoted | Close rule for wave 0: close every PR whose base is not `develop` or `main`, every docs PR that says "on-device v1.0", and every agent-operating-system PR, with one comment pointing to 08. Keep #30, #2 and the web PRs on `main` the website thread owns |
| EQ-14 | P1 | 08 sections 3.3 (S02, S05, S06), 4, 7; `.github/scripts/migration-guard.mjs`; `deploy-db.yml` | Three streams get separate migration timestamp ranges, but the guard fails "a new migration that sorts before the newest one listed" as applied, and `supabase db push` refuses out-of-order files on a project that has newer ones applied. If S02's later-range file reaches staging before S06's earlier-range file merges, staging deploys fail from then on | `migrations-applied.txt` header comment; `deploy-db.yml` push step; 08 7 "a new file in the stream's timestamp range" | Assign timestamps at merge, not at dispatch: the coordinator renames the file to the next free timestamp in the merge commit, or ranges are strictly increasing in planned merge order and a stream that merges late re-stamps |
| EQ-15 | P1 | 08 sections 2.3, 5.2 exit, 10; CLAUDE.md "main is always releasable"; COORDINATION 6 | The R-17 gate needs `npm run test:db` green against staging by Fri 23 Oct, and staging deploys only on a push to `main`. Getting there means merging `develop` to `main` mid-wave (PR #2, blocked by the migration guard since 3 Oct, Q6) while `develop` holds half-built features, which breaks "main is always releasable" | `deploy-db.yml` triggers; 08 Q6; PR #2 | Add `workflow_dispatch` for staging from `develop` (staging is not a release), or a `staging` branch that S20 fast-forwards; keep `main` for releases |
| EQ-16 | P1 | 07 sections 4.1, 4.4, 5.2; 08 header | 07 still carries the old calendar and exit criteria (C0 from 9 Nov, C1 14 Dec to 8 Jan, C1 exit needs 21 days; 5.2 cites "week of Mon 2 Nov"). 08 says "08 governs the dates and 07 governs the gates", but the 21-day C1 is a gate, not a date, and 08 plans 16 days (Q5 open). A QA agent reading 07 will block C1 exit | 07 4.1 table, 4.4 item 1; 08 2.1 C1 row | Edit 07 4 and 5.2 to the 08 dates now, and write the 16-day C1 exit as a founder exception line until Q5 is answered |
| EQ-17 | P1 | 06 sections 4, 12; 07 section 3 F16; F04 section 11, F04-REQ-006; `packages/api/src/remote-config.ts` | Config keys disagree with each other and with the code. The sync kill switch is `sync_enabled` in 06 and `killSwitches.sync` in 07 and in the code (opposite polarity in the name). F04-REQ-006 depends on remote config `capture_max_minutes`, which is not in the closed remote-config schema; adding it is an ADR 0016 decision S07 must not take alone, yet WP-F04-02 and -04 belong to S10 with "Depends on: none" | `remote-config.ts` schema (`sync`, `invites`, `photos`, `packDownloads`, `serverContent`; no capture key) | One key table in F19 section 6.5 that every spec cites by exact name; fix 06 to `killSwitches.sync`. Either ship a constant 30-minute cap (no remote key in v1.0) or add WP-F19-xx for the key to S07 and make WP-F04-04 depend on it |
| EQ-18 | P1 | 07 section 3 F10, F14, F17 lines and header | The launch checklist cites requirements that M2 removed or redefined. F10 line "A session counts once ... only in try mode" cites F10-REQ-002 and F10-REQ-004, both "Removed (M2)". F14 line "Remote config can raise but never lower Read together tries below 3" cites F14-REQ-018, which F14 defines as the free-letters allowance. The F17 line waits for "F17 section 7" (it has 67 IDs); the section 3 header says F18 to F21 are not written (they are) | F10 section 7 rows 002, 004; F14-REQ-018 row | Regenerate section 3 from section 7 tables now; do not wait for BL-002. Delete the F10 try-mode line; rewrite the F14 line to the free-letters allowance |
| EQ-19 | P1 | F02, F04, F13, F18 PRD-REQ-001; 07 F02 and F18 lines | "One ask per session" never defines a session (cold start, foreground after N minutes, calendar day). Four specs state the order four ways ("in that order across sessions", "in the F02 order", "analytics is the third ask, after the first letter"). The ask sequencer exists (`lib/analytics/ask-sequencer.logic.ts`), so the definition is in code and nowhere in the PRD | Section 7 rows quoted in EQ-05 | Put one definition in F02 (for example: a session starts at a cold start or a foreground after 30 minutes away [R]) with the full order table; other specs cite it |
| EQ-20 | P1 | 06 section 3 (Sync pull row), 07 section 2.4, 08 S02 Takes | 06 says `sync_pull` authorizes through `book_access`; 07's parity suite checks against `book_entries`; 08 says WP-F16-02 (`book_access`) is not in v1.0. An agent writing the parity or perf test gets two targets. Same root as R2 AR-03 | 06 3 table; 07 2.4 bullet 2; 08 S02 last sentence | Resolve with R2 AR-03, then make 06, 07 and F16 name the same access path |
| EQ-21 | P1 | WP-F08-B5, WP-F14-15, WP-F06-08; `_AUTHORING.md` section 5 "under 30 minutes" | Several WPs are too big for one 30-minute review or span streams. WP-F08-B5 is queue, Settings row, on and off, and restore on a new phone (the bulk of a 3 to 4 person-week feature) and is the freeze exception with 2 working days before B6. WP-F14-15 is contract, endpoint, migration and client across S07, S02 and S06 in one fenced PR. WP-F06-08 splits `review.tsx` | Rows quoted; 08 2.1 freeze row | Split B5 into B5a (queue and upload), B5b (Settings row and off), B5c (restore). Split WP-F14-15 into contract (S07), migration (S02 range, S06 author), client (S06). Rule in `_AUTHORING.md`: a WP touching two streams' files is two WPs |
| EQ-22 | P1 | `.github/pull_request_template.md`; 07 section 1 "The PR template repeats the checklist"; 08 section 8.3 | The template does not carry the fields the DoD and dispatch header require: `Satisfies:`, WP id, `Data classes touched:`, "Requests to other owners", budget statement (07 1.1 item 6), switch off and on (08 8.3 item 1), kill switch consumer, fence verdicts. Review agents and the founder check against the template | Template on `develop` (no such headings) | S20 adds these headings in its first PR; a CI step fails a PR body missing `Satisfies:` and a WP or BL id |
| EQ-23 | P1 | F12-REQ-004, WP-F12-02; WP-F13-07; F04 section 11; F06 section 11; F07 section 11; 08 section 4 | Local schema versions are already at 5 (4 sync, 5 quiet-day), F04 claims 6, F06 claims 7, F07, F12 and F13 say "next version", and F12 and F13 still test "v1 to v3 fixtures". Every one goes through S03 with a one-working-day turnaround and one version per PR, so about 7 local migrations serialize through one stream and each rebases the fixture tests | F12-REQ-004 AC "Given a v3 database"; WP-F13-07 Done when "migrator test on v1 to v3 fixtures" | Number them now in 08 section 4 (v6 F04, v7 F12, v8 F13, v9 F07, v10 F06 if kept) and make every migrator test run from v0 to head. Cut the ones not in the v1.0 list |
| EQ-24 | P1 | 08 sections 2.5, 6.1 | The budget assumes the full 6 merge hours, while 2.5 asks the founder for about 28 and 30 hours in the first two weeks against 15 to 20 available, merges included. It also costs every PR as one pass; with independent review agents asking for changes, assume 1.5 passes [A], and rebase churn on shared files (EQ-23, EQ-33). Realistic slots before freeze are about 58, not 72 | 08 2.5 hours column; 08 6.1 table | Plan 58 slots to freeze, publish them per stream on Friday, and treat anything over as cut. Track merges per week on BOARD so the Friday review sees the real rate |
| EQ-25 | P2 | `_AUTHORING.md` section 5 item 12; all sections 12 | WP tables use five column layouts: Owner present or not, "Owns files" versus "Owns files or folders", Status and Device columns in 10 specs only, BL column only in F06. 121 WPs have no status, and the README says specs dated 3 Oct were never re-checked against code merged after 4 Oct | Header rows of every section 12 | One schema: WP, Scope, Stream, BL, Owns, Depends on, Done when (tests with file paths), Mode, Status 13 Oct, Device. Fill status for F01 to F03, F10, F12 to F14, F18 to F21 before their streams start |
| EQ-26 | P2 | Sections 12 | 37 WPs have a Done when with no requirement-tagged test, so the PR cannot show traceability; WP-F10-06 and WP-F12-03 are empty rows; others read "Catalogue tests", "Numbers recorded in PR", "Record with 5 rows" | Script list (for example WP-F04-14, WP-F06-15, WP-F09-01, WP-F11-03, WP-F16-01, WP-F17-10) | Each gets at least one `[ID]` test or is marked spike, evidence or removed |
| EQ-27 | P2 | 08 section 3.3 | 15 WPs are taken by two or three streams ("with S19", "server part", "app part"): WP-F11-09 (S02, S04, S07), WP-F12-07 (S13, S14), WP-F19-11 (S07, S16), WP-F01-06 (S12, S20) and others. A WP is one PR, so one stream must author it | Script list | Split into suffixed WPs (WP-F11-09s, -09c) or name the author stream and make the other a reviewer |
| EQ-28 | P2 | 07 section 2.1 last paragraph | Test counts are stale: "engine 237, mobile 31 ... `npm run test:db` runs 8 files" against CLAUDE.md's "about 1,150 tests" and "15 files" | CLAUDE.md Commands | Delete the counts; cite `npm test` output in each PR instead |
| EQ-29 | P2 | F04 section 10, WP-F04-05, WP-F04-13; `packages/analytics/src/catalog.ts`; CLAUDE.md content rule | F04 asks for `mic_permission_result` while the catalogue already has `os_permission_result`; WP-F04-05 and WP-F10-08 create `components/*/copy.ts` files while CLAUDE.md and COORDINATION 5 say every word lives in `packages/content` (copy.ts "temporary") | Catalog keys; WP rows | Reuse `os_permission_result` with `permission = microphone`; strings go to the stream's `packages/content/src/features/*.en.ts` file |
| EQ-30 | P2 | 06 section 0 ("Perf build"), sections 2 to 4 | 85 rows are marked Gate; the device ones are measured with a `perf` build profile and "scripted relaunch loop" that do not exist (`eas.json` has development, preview, production, testflight) | `apps/mobile/eas.json` on `develop` | Add the `perf` profile and the marker harness as a S20 plus S19 WP, or mark device rows "No" until the harness lands and gate only the 10 rows the never-cut list needs |
| EQ-31 | P2 | 07 sections 3 intro, 4.4 item 10, 5.1 G4 | "Every line ... must pass on an iPhone SE (3rd gen) and a current iPhone" includes 175 `[auto]` lines, many of them vitest or PGlite tests that never touch a phone. Reviewers will argue about what passing on a phone means | 07 3 intro sentence | Scope the phone rule to `[manual]` lines and to `[auto]` lines tagged E2E |
| EQ-32 | P2 | 08 section 6.2; 07 section 1.5 | Review agent verdicts are prose in a PR comment. Nothing machine-checks that two independent verdicts exist on a fenced PR, or that the reviewer was not the author's stream | 08 6.2 items 1 and 2 | Review agents post a commit status (`review/ready`, `review/security`); branch protection requires both on fenced paths alongside the label |
| EQ-33 | P2 | 08 section 4 | Cross-stream requests cost about a day each [A], and the hot files sit with three streams: S03 (store and local schema), S16 (`strings.en.ts`, rules test), S20 (`_layout.tsx`, `app.config.ts`, `package.json`). With about 45 WP paths owned elsewhere (EQ-08), those three streams become the queue | 08 4 table; EQ-08 list | Give S03, S16 and S20 a standing daily "requests" PR that batches every request received by 15:00 UTC, merged in the next session |

## 4. What cannot be automated, and whether it is scheduled

| Item | Needs | Scheduled in 08? | Gap |
|---|---|---|---|
| Kill during save 50 on SE 3, kill while recording 50, typed kills 100, Review kills 100 | A person and an SE 3 (Maestro cannot drive a physical iPhone, F04 WP-F04-11) | DL-01, DL-02 on 9 to 13 Nov | G3 needs them before C1 (EQ-02); typed and Review kills not named in 08 10 |
| Transcription speed and battery per language | SE 3, iPhone 12, iPhone 15 | 19 to 23 Oct | iPhone 12 and 15 not owned (EQ-03) |
| VoiceOver V1 and V4 | A person on SE 3 | Not by name | G3 needs both |
| V2, V3, V5, V6, V7 | A person | FT-39, 16 to 19 Nov | About 2 hours, inside an over-full week |
| Server restore drill (BL-247, WP-F16-08) | Founder, scratch project | No | Required before the first non-founder family |
| Backup B1 and B6 | Two iPhones, one Apple Account | Yes | B6 has 2 working days before tag |
| StoreKit sandbox S-1 to S-10, S-7 Family Sharing | Second Apple Account in a Family | 19 to 23 Oct (S2-01 to S2-12) | Second account not listed as owned |
| 198 of 200 reminders within 15 minutes over 14 days | A phone left running 14 days | No | Must start by 2 Nov to finish before 19 Nov |
| Mail clients for auth and `/j` links (Mail, Gmail, Outlook, Messages) | Real accounts, AASA on Apple's CDN | Not by name | AASA needs about a day on Apple's CDN after 28 Oct |
| Counsel sign-off, privacy labels in App Store Connect, crash-free from App Store Connect | Humans and Apple | Yes (FT-41, FT-43) | Crash-free 99.8% from 15 to 25 families is a few hundred sessions: one crash moves it 0.3 points; treat as a signal, not a gate [A] |
| Native-speaker sign-off per language | Reviewers (FT-27) | 30 Oct | Fine if DR-01 cuts languages |
| Load test at 2x 1k and 4-hour soak | k6 in staging, WP-F16-12 (no stream) | No (08 Q8 open) | G4 item with no owner |

## 5. The minimum v1.0 work-package list that fits the budget

Budget used: 58 slots to the freeze on Mon 9 Nov (EQ-24), of which 14 fenced (EQ-01), plus about 6 docs-only PRs at about 5 minutes each. Freeze weeks (30 slots) stay for C1 S0 and S1 fixes and gate failures only. Order inside each stream is the merge order.

**Fenced (14).**

| # | Item | Stream | Why it cannot wait |
|---|---|---|---|
| F1 | PR #30 CI hardening and fence, plus `migration-guard` and `expo lint` in `required` | S20 | Every other fenced merge relies on it |
| F2 | BL-347 email links (PKCE, H1) | S01 | R-17 |
| F3 | BL-330 Apple token capture and `apple-token` | S01 | R-17; account deletion revokes Apple |
| F4 | BL-331 rest with review M1, M5, L1 | S02 | R-17 |
| F5 | `peek_invite` plus BL-334 pepper fails closed, one migration file | S02 | R-17 (BL-322 needs it) |
| F6 | WP-F11-01 invite cap, leave, 72-hour undo, device invite ids | S02 | Co-parent in C1 |
| F7 | One migration for sync-required columns: WP-F04-14 `occurred_precision`, WP-F07-04 dictionary forms | S02 | Sync ships in v1.0 (M14) |
| F8 | WP-F17-10 server deletion functions, with WP-F16-13 server erase op | S02 | Deletion is never-cut |
| F9 | WP-F11-02 `invite-redeem` (only if DR-13 keeps codes on 16 Oct; else slot returns) | S07 | Join by code |
| F10 | Reserve: server fixes from the S1-22 two-phone run | S02 | Sync will need one |
| F11 | WP-F08-B3 backup bucket and tables | S05 author, S02 review | Backup (first to cut, see below) |
| F12 | WP-F08-B4 escrow function | S05 | Backup |
| F13 | WP-F14-15 server part: status table and endpoint (split per EQ-21) | S06 | D-080 (second to cut) |
| F14 | WP-F14-16 reminder email function | S06 | D-080 |

**Unfenced (46, about 6 docs-only).**

| Stream | Items |
|---|---|
| S20 (3) | BL-349 privacy manifest; M14 switch PR (`preview`, then `testflight` after R-17); WP-F02-10 `/auth/confirm` and AASA paths on `main` |
| S19 (3) | BL-002 trace in report mode, failing on IDs defined twice (EQ-05); a Maestro nightly with 5 P0 flows (E2E-01b, -03, -12, -13, -17) (new WP); evidence template and the Mon 19 Oct run sheet (docs) |
| S15 (2) | Component render harness (new WP, pair; EQ-04); BL-398 StateScreen |
| S03 (3) | WP-F04-03 local v6 with G-26 `entries.language`; WP-F12-02 per-person child prefs (needed with two parents); client fixes from S1-22 |
| S04 (5) | BL-322 app part; WP-F11-03 invite rules; WP-F11-05 inviter UI; WP-F11-06 invitee flow; WP-F11-07 leave sheet |
| S05 (5) | WP-F08-B1 evidence and the ADR 0006 amendment (docs); WP-F08-B2 keys; B5a queue and upload; B5c restore; B6 evidence (docs) |
| S06 (3) | BL-342 as WP-F14-02, WP-F14-06, WP-F14-07 |
| S07 (3) | WP-F19-05 stale config; WP-F11-04 family contracts; D-080 and escrow contracts (types only) |
| S08 (2) | WP-F05-02 gate tooling; WP-F05-01 clamp |
| S09 (3) | WP-F06-02, WP-F06-03, WP-F06-05 (the open R-01 items; never-cut) |
| S10 (3) | WP-F04-02 capture reducer; WP-F04-04 recorder hardening with a constant 30-minute cap (EQ-17); BL-370 crash screen |
| S11 (2) | WP-F04-07 typed text exact; BL-433 with BL-406 |
| S12 (1) | WP-F01-01 gate deletes pending invite on No |
| S13 (2) | BL-323 export carries consent history and dictionary; WP-F08-07 original-unaltered test (EQ-07) |
| S14 (2) | WP-F17-05 deletion flow reducer and wiring; WP-F20-03 one crisis list |
| S16 (2) | M14 copy delta with build-state variants; WP-F21-01 claims set |
| S17 (1) | M14 counsel delta package (docs) |
| S18 (1) | WP-F18-01 no provider key means no consent sheet and no SDK, and ship analytics off at v1.0 (ROADMAP 2.1 cut 4) |

That is 60 PRs: 14 fenced, about 40 code, about 6 docs-only.

**Cut from v1.0 to make this fit, in the order I would cut further if a chain slips:**

1. Already marked for cutting in 08 6.1: WP-F04-12 widget, WP-F09-11 search, WP-F06-13, WP-F07-07, WP-F11-13 QR, WP-F17-08 app lock.
2. Co-parent push (WP-F11-09a, WP-F11-09, `push-send`): the other parent sees new letters on next open. Saves a fenced slot, an APNs key and an ADR.
3. Google sign-in (WP-F02-04), as ROADMAP 2.1 cut 2 already allows.
4. Analytics beyond WP-F18-01 (all of F18 except the guard), and the load test as a G4 gate (replace with a 1-hour 1x smoke; 08 Q8).
5. The F06 author layer (WP-F06-06, -07, -10, -12): the built Change words stays; no local v10 and no server migration.
6. **First real cut if the budget slips:** D-080 status report and emails (fenced rows F13 and F14 above), if counsel says phone reminders alone meet the notice law (F14 Q-C1). Saves 2 fenced and 2 unfenced slots.
7. **Second real cut:** the encrypted backup (WP-F08-B1 to B6; fenced rows F11 and F12 above) under 08 2.4 option B if B1 fails or R2 AR-05 is not settled by Fri 23 Oct. Saves 2 fenced and 5 unfenced slots and the riskiest device drill.

Everything else in sections 12 that is not in this list is either built (verify inside a fix slot only if a gate fails), human or device work (scheduled in 08 section 10), or 1.0.1.
