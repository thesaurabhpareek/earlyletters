# PRD V2: index

Status: 13 Oct 2026. Owner: PM lane, with the delivery lead for `08-delivery.md`. This file says what PRD V2 is, how to read it, what each file holds, which source wins, and where each spec stands.

## What V2 is

PRD V2 replaces `docs/prd/PRD.md` 1.3 as the product requirements for Early Letters (codename `scribe`). It covers the whole product: release v1.0 in depth, v1.1 and later as a ranked list with light specs (`_AUTHORING.md` section 1). It keeps every existing requirement ID (A-REQ, B-REQ, C-REQ, PRD-REQ, LEGAL-REQ, DATA-REQ) so `docs/BACKLOG.md` and test titles still trace (ADR 0011). New requirements use `F##-REQ-###`. It is written so an agent can build from it without asking; where it cannot, the spec names the open question, who answers it and by when.

V2 carries the founder's 3 Oct brief (B1 to B16) and the decisions since (M1 to M14, `_AUTHORING.md` section 3b). The largest late change is M14 (13 Oct): server features are on for v1.0, so sign-in, sync, co-parent sharing, the owner's encrypted recording backup and the subscription status report with reminder emails all ship in v1.0. `08-delivery.md` re-plans the date for it.

## How to read it

| You are | Read in this order | You need |
|---|---|---|
| Founder | `03` (promise and goals), `09` (decisions waiting for you), `08` sections 1, 2 and 10 (the date, what it depends on, your tasks by week), then `05` | The decisions only you make, with a default and a date for each |
| Architect | `_AUTHORING.md`, `06` (budgets), `07` (gates), `08` sections 3 to 8 (streams, fences, ADR triggers), then each spec's sections 8, 9 and 11 | How it is built, what needs an ADR, what a PR must prove |
| Agent engineer | `_AUTHORING.md` sections 3b, 6, 7; your stream row in `08` section 3.3 and brief in section 9; your spec's sections 6, 7 and 12; `07` section 1 | Your files, your WPs, the tests that prove them, what you must not decide alone |

Labels used everywhere: **[F]** fact with a source, **[S]** signal, **[A]** assumption, **[E]** estimate, **[D]** founder decision, **[R]** recommendation (`_AUTHORING.md` section 6).

## Files

| File | What it holds |
|---|---|
| `README.md` | This index |
| `_AUTHORING.md` | The rulebook: source order, the brief (B1 to B16) and later decisions (M1 to M14), the spec template, evidence and voice rules, definition of done |
| `01-problem.md` | The problem parents have, with evidence |
| `02-customers.md` | Personas P1 to P6, jobs and evidence; desk research only so far |
| `03-goals-and-principles.md` | The promise, problem statements, principles, success metrics and guardrails |
| `04-market.md` | Landscape, prices, white space and threats in one read |
| `05-feature-map.md` | v1.0 features ranked, v1.1 and later ranked, build layers, the cut order |
| `06-nfr.md` | Shared budgets: speed, sync, offline, durability, accessibility, size, security, observability |
| `07-quality-bar.md` | Definition of done for a WP, test strategy, launch checklist by feature, beta cohorts, release gates |
| `08-delivery.md` | The M14 re-plan and new submission week, 20 agent work streams with file fences, waves, merge budget, ADR triggers, the wave 1 dispatch table |
| `09-decisions-and-risks.md` | Decisions needed (DR-01 to DR-17) with spec defaults, and the risk register (R-01 to R-17) |
| `10-changes-from-1.3.md` | What V2 changed from PRD 1.3 and why, and requirement IDs added, revised and removed per spec |
| `features/F01-entry.md` to `features/F21-store-web.md` | The 21 v1.0 feature specs, one per feature, each in the template of `_AUTHORING.md` section 5 |
| `features/F30-later.md` | Light specs for F31 to F49 (v1.1 and later) |
| `research/R1-competitors-by-feature.md` | Competitors by feature, F01 to F21 |
| `research/R2-customer-evidence.md` | Customer evidence (reviews, forums, studies) |
| `research/R3-market.md` | Market size, category revenue, costs |
| `research/R4-platform-and-policy.md` | Apple, App Review, privacy law and platform facts |
| `research/R5-speech-audio-languages.md` | Speech models, audio and the seven languages |
| `reviews/STALE-OUTSIDE-PRD.md` | Statements outside `docs/prd/v2` that V2 decisions made stale, with the owner lane for each |
| `tools/lint.mjs` | Voice and formatting lint: `node docs/prd/v2/tools/lint.mjs docs/prd/v2` |

## Which source wins

From `_AUTHORING.md` sections 2 and 3b, highest first:

1. Founder decisions after the brief, M1 to M14 (`_AUTHORING.md` section 3b) and any later `docs/DECISIONS.md` entry that records one.
2. The 3 Oct brief, B1 to B16 (`docs/agents/BRIEF-2026-10-03.md`), where 3b does not override it.
3. `docs/DECISIONS.md` (D-###), where the brief does not override it.
4. `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ) and `docs/legal/DELETION_AND_EXPORT_SPEC.md` (DATA-REQ). A legal duty wins over a product wish until counsel or the founder says otherwise; a collision becomes an open question, never a silent choice.
5. PRD V2 (this folder). Within V2, `06-nfr.md` wins over a feature's own budget until the feature is updated (06 section 0), and `07-quality-bar.md` holds the gates.
6. `docs/prd/PRD.md` 1.3 and appendices A, B and C, for anything V2 does not restate.
7. `docs/tdd/01` to `10`, `docs/adr/*`, `docs/ARCHITECTURE.md`.
8. Research: `research/R1` to `R5`, `docs/research/USER_RESEARCH.md`, `docs/research/COMPETITIVE_RESEARCH.md`.

When V2 and the code disagree, the spec says which one is wrong in its section 12 status column; agents build the spec default and raise the gap.

## Status of each spec

Counts are from each spec's section 7 (requirement IDs) and section 12 (work packages), taken by script on 13 Oct; details and method in `10-changes-from-1.3.md`. "M14 carried" means the spec names M14 on 13 Oct; a PM pass is propagating M14 through the specs today, so check the spec's own status line before relying on this column.

| Spec | Status line (13 Oct) | Requirement IDs | WPs | M14 carried |
|---|---|---|---|---|
| F01 Entry, 18+ gate and welcome | Draft V2, 3 Oct | 15 | 6 | No |
| F02 Account and sign-in | Draft V2, 3 Oct | 37 | 11 | No |
| F03 First run | Draft V2, 3 Oct | 21 | 7 | Yes |
| F04 Capture | Reconciled 13 Oct with code, M10, M11, M13 | 42 | 14 | Yes |
| F05 Transcription and language packs | Reconciled 13 Oct with ADR 0014 to 0017 and code | 47 | 13 | No |
| F06 Faithful edit and review | Reconciled 13 Oct with D-074, engine 5, R-01 re-run | 45 | 15 | Yes |
| F07 Names and words dictionary | Reconciled 13 Oct with ADR 0014, engine 5 | 23 | 8 | Yes |
| F08 Recordings and encrypted backup | Rewritten 13 Oct for D-073, D-085; revised for M14 | 34 | 14 | Yes |
| F09 The book | Reconciled 13 Oct with D-084, D-085 | 31 | 11 | No |
| F10 Read together | V2.1, 13 Oct: free with no session limit (M2) | 22 | 9 | No |
| F11 Co-parent sharing | Reconciled 13 Oct with D-069, D-073; revised for M14 | 44 | 14 | Yes |
| F12 Multiple children | V2.1, 13 Oct: every book free (M2) | 21 | 7 | No |
| F13 Prompts, reminders, notifications | Draft V2; plan-reminder rows revised 13 Oct (M6) | 37 | 11 | No |
| F14 Plus: the membership | V2.1, 13 Oct: rewritten for M1 to M6 | 59 | 19 | Yes |
| F15 Export and the PDF book | Reconciled 13 Oct with D-073, D-084, D-085 | 25 | 10 | No |
| F16 Sync, devices and restore | Reconciled 13 Oct with D-023, D-073, D-085 | 38 | 14 | Yes |
| F17 Settings, privacy, consents, deletion | Reconciled 13 Oct with D-073, D-074, D-085, D-068 | 67 | 16 | Yes |
| F18 Analytics and the learning loop | Draft V2, 13 Oct | 42 | 15 | Yes |
| F19 Content, remote config, kill switches, packs | Draft V2, 13 Oct | 24 | 14 | Yes |
| F20 Help, support and safety | Draft V2, 13 Oct | 24 | 9 | Yes |
| F21 Store listing, website, legal pages | Draft V2, 13 Oct | 31 | 13 | Yes |
| F30 Later releases (F31 to F49) | Draft V2; revised 13 Oct for M1, M2, M14 | light specs | none | Yes |

Every spec is a draft: none has the founder's sign-off yet. Specs whose status line still reads 3 Oct have not been re-checked against the code that merged after 4 Oct.

## Open decisions

- **09 section 1:** 17 decision rows. 8 are answered (DR-02 to DR-08, DR-17). **9 are open:** DR-01 (languages at v1.0, 30 Oct), DR-09 (listening copy, 30 Oct), DR-10 (age signal, counsel), DR-11 (individual publisher, 27 Nov), DR-12 (when to ask for reminders), DR-13 (link plus code, 16 Oct), DR-14 (pack hosting, 16 Oct), DR-15 (co-parent reading another language), DR-16 (co-parent letters and the 2 free, 23 Oct). Each has a spec default that agents build until it is answered.
- **Carried from `docs/DECISIONS.md`** (09 section 1 footnote): D-033 free audio durability copy, D-031 Hindi script default, D-045 beta cohorts, D-050 second consent at first share; D-004 is DR-11.
- **Section 13 of the specs:** 146 question rows across F01 to F21 on 13 Oct, 14 of them marked answered; `07-quality-bar.md` section 7 adds 9 and `08-delivery.md` section 11 adds 9. Each names who answers and by when.
- **Not yet logged:** M14 itself needs a `docs/DECISIONS.md` entry (next free id D-089), together with what it reverses in D-085 and D-087 and what it makes untrue in D-088 (`08-delivery.md` section 1).

## How V2 relates to PRD 1.3, the backlog and the roadmap

- **PRD 1.3** (`docs/prd/PRD.md`, 3 Oct) stays as history and as the home of ID text V2 does not restate. V2 wins where they differ; `10-changes-from-1.3.md` lists every change and its decision. A PRD 1.4 exists on `origin/main` for the membership (F14 header cites PRD-REQ-024 to PRD-REQ-027 and K-44, K-45 from it); V2 carries those IDs.
- **`docs/BACKLOG.md`** stays the work queue scheduled runs read (ADR 0011). A V2 work package (WP-F##-##) is one pull request; where a backlog task exists, the WP row names its BL id. WPs without a BL id get one from the PM lane in the next free block (BACKLOG on `develop` ends at BL-434). Backlog statuses are not requirements: when a status and a spec's section 12 disagree, the spec's status column says what the code holds on 13 Oct.
- **`docs/ROADMAP.md` 2.1** set submission in the week of Mon 2 Nov. M14 moved it: `08-delivery.md` section 2 is the v1.0 calendar now (submission in the week of Mon 23 Nov, about 40% confidence [A]). ROADMAP keeps its post-v1.0 plan and its risk and cut tables until the PM lane publishes 2.2.
- **`docs/FOUNDER_TASKS.md`** keeps the steps for each FT id; `08-delivery.md` section 2.5 re-dates them.
