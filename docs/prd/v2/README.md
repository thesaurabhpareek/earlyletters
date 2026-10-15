# PRD V2: index

Status: 13 Oct 2026, revised after critique round 1; delivery and traceability revised 15 Oct after critique round 2 (`reviews/DISPOSITION-R2-delivery.md`). Owner: PM lane, with the delivery lead for `08-delivery.md`. This file says what PRD V2 is, how to read it, what each file holds, which source wins, and where each spec stands.

## What V2 is

PRD V2 replaces `docs/prd/PRD.md` 1.3 as the product requirements for Early Letters (codename `scribe`). It covers the whole product: release v1.0 in depth, v1.1 and later as a ranked list with light specs (`_AUTHORING.md` section 1). It keeps every existing requirement ID (A-REQ, B-REQ, C-REQ, PRD-REQ, LEGAL-REQ, DATA-REQ) so `docs/BACKLOG.md` and test titles still trace (ADR 0011). New requirements use `F##-REQ-###`. Each legacy ID has one home spec; other specs cite it and add their own `F##-REQ` for their slice (R5 EQ-05).

V2 carries the founder's 3 Oct brief (B1 to B16) and the decisions since (M1 to M17, `_AUTHORING.md` section 3b). The largest late changes, all 13 Oct: server features are on for v1.0 (M14); the full v1.0 scope stays and the date moves (M15); backup keys are recoverable and the copy says so (M16); free letters count only your own letters once their words exist and you have seen them (M17).

**One source for each of these:**

| What | Where |
|---|---|
| Every date | `08-delivery.md` section 2.1 (milestone ids T01 to T40, weeks W0 to W13). Other files name the id |
| What ships in v1.0 | `05-feature-map.md` section 2, with the P1 extras cut now in its last column; the merge-sized list is `08-delivery.md` section 6.3, and section 13 there says where every work package stands |
| Prices and what Plus contains | `features/F14-plus.md` section 1 (and `packages/content/src/pricing.ts` in code) |
| Decisions waiting for the founder | `09-decisions-and-risks.md` section 1 |

## How to read it

| You are | Read in this order | You need |
|---|---|---|
| Founder | `09` section 1 (decisions waiting for you), `08` sections 2, 6.1, 6.2 and 10 (the date, what it depends on, the merge budget, devices, your hours), `03` (promise and metrics), then `05` | The decisions only you make, with a default and a milestone for each |
| Architect | `_AUTHORING.md`, `06` (budgets), `07` (gates), `08` sections 3 to 8 (streams, waves, the v1.0 list, fences, ADRs), then each spec's sections 8, 9 and 11 | How it is built, what needs an ADR, what a PR must prove |
| Agent engineer | `_AUTHORING.md` sections 3b, 6, 7; your stream row in `08` section 3.3, your items in 6.3 and your brief in section 9; your spec's sections 6, 7 and 12; `07` section 1 | Your files, your WPs, the tests that prove them, what you must not decide alone |

Labels used everywhere: **[F]** fact with a source, **[S]** signal, **[A]** assumption, **[E]** estimate, **[D]** founder decision, **[R]** recommendation (`_AUTHORING.md` section 6).

## Files

| File | What it holds |
|---|---|
| `README.md` | This index |
| `_AUTHORING.md` | The rulebook: source order, the brief (B1 to B16) and later decisions (M1 to M17), the spec template, evidence and voice rules, definition of done |
| `01-problem.md` | The problem parents have, with evidence |
| `02-customers.md` | Personas P1 to P6, jobs ranked by importance and evidence, the three studies with dates |
| `03-goals-and-principles.md` | The promise, problem statements, principles, the two headline numbers, input metrics and guardrails, the business frame, how families find us |
| `04-market.md` | Landscape, prices, white space and threats in one read |
| `05-feature-map.md` | v1.0 features ranked P0 and P1 with the P1 extras cut, v1.1 and later ranked, build layers by wave, what is cut and what never is |
| `06-nfr.md` | Shared budgets: speed, sync, offline, durability, accessibility, size, security, observability |
| `07-quality-bar.md` | Definition of done for a WP, test strategy, launch checklist by feature, beta cohorts, release gates |
| `08-delivery.md` | Every date; the submission week and its confidence; 20 work streams with file fences; waves; the merge budget and how review agents raise it; the v1.0 work-package list sized to it; devices and who keeps each; ADR triggers; the wave 1 dispatch briefs |
| `09-decisions-and-risks.md` | Decisions needed (DR-01 to DR-21) with spec defaults, and the risk register (R-01 to R-20) |
| `10-changes-from-1.3.md` | What V2 changed from PRD 1.3 and why, and requirement IDs added, revised and removed per spec |
| `features/F01-entry.md` to `features/F21-store-web.md` | The 21 v1.0 feature specs, one per feature, each in the template of `_AUTHORING.md` section 5 |
| `features/F30-later.md` | Light specs for F31 to F49 (v1.1 and later) |
| `research/R1` to `R5` | Competitors by feature; customer evidence; market; platform and policy; speech, audio and languages |
| `reviews/R1-product-leader.md` to `R6-fact-check.md` | Critique round 1 (13 Oct): product, architecture, design and research, privacy and trust, engineering and QA, fact-check |
| `reviews/DISPOSITION-*.md` | What each lane did with each finding, with a reason for every rejection. `DISPOSITION-A.md` covers `01` to `05`, `08` to `10`, this README, F10, F12, F13 and F14 |
| `reviews/STALE-OUTSIDE-PRD.md` | Statements outside `docs/prd/v2` that V2 decisions made stale, with the owner lane for each |
| `tools/lint.mjs` | Voice and formatting lint: `node docs/prd/v2/tools/lint.mjs docs/prd/v2` |

## Which source wins

From `_AUTHORING.md` sections 2 and 3b, highest first:

1. Founder decisions after the brief, M1 to M17 (`_AUTHORING.md` section 3b) and any later `docs/DECISIONS.md` entry that records one.
2. The 3 Oct brief, B1 to B16 (`docs/agents/BRIEF-2026-10-03.md`), where 3b does not override it.
3. `docs/DECISIONS.md` (D-###), where the brief does not override it.
4. `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ) and `docs/legal/DELETION_AND_EXPORT_SPEC.md` (DATA-REQ). When a founder decision collides with a legal duty, the collision becomes a decision row in `09` and **the legal default is built until counsel answers**; it is never resolved silently. R4 PT-06 asks that only counsel may retire or relax a LEGAL-REQ or DATA-REQ; that change to `_AUTHORING.md` section 2 is the coordinator's and the founder's to make [R].
5. PRD V2 (this folder). Within V2, `06-nfr.md` wins over a feature's own budget until the feature is updated (06 section 0), `07-quality-bar.md` holds the gates, and `08-delivery.md` section 2.1 holds the dates.
6. `docs/prd/PRD.md` 1.3 and appendices A, B and C, for anything V2 does not restate.
7. `docs/tdd/01` to `10`, `docs/adr/*`, `docs/ARCHITECTURE.md`. Where an ADR contradicts V2 (ADR 0004, 0006, 0013; 0016 and 0017 still "Proposed"), the ADRs in `08-delivery.md` section 8.1 supersede or amend it at T15 (R2 AR-25).
8. Research: `research/R1` to `R5`, `docs/research/USER_RESEARCH.md`, `docs/research/COMPETITIVE_RESEARCH.md`.

When V2 and the code disagree, the spec says which one is wrong in its section 12 status column; agents build the spec default and raise the gap.

## Status of each spec

Counts are from each spec's section 7 (requirement IDs defined there, including the round 2 inherited rows) and section 12 (work packages), taken by script on Thu 15 Oct 2026 after the round 2 delivery pass. Another lane was editing F04, F08, F11, F16 and F17 the same day; re-run before quoting a number. Every spec is a draft: none has the founder's sign-off.

| Spec | Revised after critique round 1 | Requirement IDs | WPs |
|---|---|---|---|
| F01 Entry, 18+ gate and welcome | Yes (M14 pass) | 18 | 7 |
| F02 Account and sign-in | Yes (M14 pass, security reconciliation) | 47 | 15 |
| F03 First run | Yes | 17 | 7 |
| F04 Capture | Yes | 50 | 18 |
| F05 Transcription and language packs | Yes | 52 | 14 |
| F06 Faithful edit and review | Yes | 48 | 16 |
| F07 Names and words dictionary | Yes | 23 | 8 |
| F08 Recordings and encrypted backup | Yes (M16) | 51 | 20 |
| F09 The book | Yes | 35 | 13 |
| F10 Read together | Yes (P1; skip, night surface) | 24 | 10 |
| F11 Co-parent sharing | Yes | 45 | 19 |
| F12 Multiple children | Yes (Quiet this book, per-person hide) | 23 | 9 |
| F13 Prompts, reminders, notifications | Yes (DR-12 B, early birth, rating request) | 38 | 13 |
| F14 Plus: the membership | Yes (M17, held letters durable, review rules) | 66 | 24 |
| F15 Export and the PDF book | Yes | 29 | 11 |
| F16 Sync, devices and restore | Yes (rewritten to the built protocol) | 46 | 20 |
| F17 Settings, privacy, consents, deletion | Yes | 76 | 19 |
| F18 Analytics and the learning loop | Yes | 39 | 15 |
| F19 Content, remote config, kill switches, packs | Yes | 28 | 20 |
| F20 Help, support and safety | Yes | 23 | 9 |
| F21 Store listing, website, legal pages | Yes | 39 | 14 |
| F30 Later releases (F31 to F49) | 13 Oct (M1, M2, M14) | light specs | none |

The v1.0 list in `08-delivery.md` section 6.3 now names 268 merges plus 13 reserve slots (281 to the last feature merge): the 115 items of 13 Oct and 153 round 2 slots for every unbuilt or partly built work package that carries a P0 requirement. The other work packages among the 301 are built, human or device work, cut with a stated condition, removed, or 1.0.x; `08-delivery.md` section 13 lists each one.

### Traceability counts (script, Thu 15 Oct 2026, after the round 2 fixes)

| Measure | Count |
|---|---|
| Requirement IDs defined in a spec's section 7 (one row each) | 817 |
| P0 requirement IDs | 752 (65 P1 or lower) |
| Work packages in sections 12 | 301 |
| IDs defined in two or more rows | 0 (22 on 15 Oct before the fixes; each kept its home spec's ID and the other rows were renamed to `F##-REQ-08x` slices with a note in their Source column) |
| P0 IDs with no work package | 0 (191 before) |
| P0 IDs with no named test (a bracketed test id in a work package's Done when, or a test-map row) | 0 (102 before) |
| IDs cited in V2 but defined nowhere and not listed as retired | 0 (66 before: 35 got home rows from their 1.3 or legal source, 31 are listed as not v1.0 in `10-changes-from-1.3.md` section 3) |
| Unbuilt or partly built work packages carrying a P0 requirement | 246: 232 agent work packages (229 with a slot in `08-delivery.md` 6.3, 3 P1 extras cut with a stated condition in 08 6.4) and 14 human or device (08 section 10) |

Method: the script reads every ID in the first cell of a section 7 table whose header starts `ID | P`, the work packages in section 12, and every `[ID]` in a Done when cell. It lives in the session scratchpad for now; S19's BL-002 (`scripts/trace.mjs`) is its durable home. A named test is the bracketed title a work package must make pass; whether a test with that title exists in code today is what BL-002 reports (on `develop`, 36 requirement IDs are tagged in test titles). R9's own script reads only the first ID in a cell, so it still lists four second-in-cell IDs (C-REQ-034, DATA-REQ-031, F16-REQ-086, F17-REQ-080) as undefined; they are defined.

## Open decisions and questions

- **09 section 1:** 21 decision rows. 9 are answered (DR-02 to DR-08, DR-16, DR-17). **12 are open**, each with a spec default and a milestone. The founder said "continue" on 15 Oct without choosing, so three defaults now stand as **defaults awaiting confirmation** at T02 (Mon 19 Oct): DR-20 A (delegated docs, evidence and test-only merges), DR-18 A (backup free) and DR-19 A as refined by M17 (a voice-only letter counts only once its words exist and the author keeps it). Open: DR-20 (delegated merges, T02); DR-18 (backup free or Plus), DR-13, DR-14 (T07); DR-11, DR-19, DR-21, DR-09 (T15); DR-10 (counsel, T17); DR-01 (T18); DR-12 and DR-15 (T34).
- **Carried from `docs/DECISIONS.md`** (09 section 1 footnote): D-033 free audio durability copy, D-031 Hindi script default, D-045 beta cohorts, D-050 second consent at first share; D-004 is DR-11.
- **Section 13 of the specs** holds each spec's questions with who answers and a milestone. Triage rule (R1 PL-21): a question that blocks a wave names that wave's first milestone (T03, T14 or W4) as its due point; one that does not block v1.0 moves to `features/F30-later.md` or 1.0.x. F10, F12, F13, F14 and 08 now give every question a milestone id; the other lanes apply the rule as they revise.
- **Not yet logged in `docs/DECISIONS.md`:** M14 (proposed as D-089, with what it reverses in D-085 and D-087 and makes untrue in D-088), M15, M16 and M17. The coordinator drafts them in wave 0 (`08-delivery.md` section 5.1). Logged by PR #128 as D-100 (M14), D-101 (M15), D-102 (M16) and D-103 (M17): D-089 to D-092 are the release-engineering decisions of PR #108.

## How V2 relates to PRD 1.3, the backlog and the roadmap

- **PRD 1.3** (`docs/prd/PRD.md`, 3 Oct) stays as history and as the home of ID text V2 does not restate. V2 wins where they differ; `10-changes-from-1.3.md` lists every change and its decision. A PRD 1.4 exists on `origin/main` for the membership (F14 cites PRD-REQ-024 to PRD-REQ-027 and K-44, K-45 from it); V2 carries those IDs.
- **`docs/BACKLOG.md`** stays the work queue scheduled runs read (ADR 0011). A V2 work package is one pull request; where a backlog task exists, the WP row names its BL id. Before each wave, the PM lane adds one BL line per WP in `08-delivery.md` section 6.3 for that wave (268 named in all, not 301), each with `Satisfies:` and the WP id (R5 EQ-06); BACKLOG on `develop` ends at BL-434.
- **`docs/ROADMAP.md` 2.1** set submission in the week of Mon 2 Nov. M14 and M15 moved it: `08-delivery.md` section 2 is the v1.0 calendar now (T36, the week of Mon 3 May 2027, about 40% confidence [A]; about 75% by Fri 4 Jun 2027). The move past January comes from the round 2 list, which holds every P0 work package M15 keeps. ROADMAP keeps its post-v1.0 plan until the PM lane publishes 2.2.
- **`docs/FOUNDER_TASKS.md`** keeps the steps for each FT id; `08-delivery.md` sections 2.1 and 2.6 re-date them.
