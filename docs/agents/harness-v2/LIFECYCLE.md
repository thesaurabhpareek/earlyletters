# The harness across the whole product life cycle

Status: draft for the founder, written on 11 Nov 2026 (UTC) by a Claude session in the product seat. Facts were read from `origin/develop` at `18ff6374668f64d4ac89d64a49f96584ff6ccd0c` and from GitHub REST on 11 Nov. Anything I could not read is marked unverified. Nothing here changes a workflow, a ruling or an existing doc. It is a proposal until the founder says otherwise.

The founder said on 10 Nov that the harness is not only about coding. It covers the whole life of a product: the idea, the research, the requirement, the advice from every function, the build, the quality check, the release, the running service, the monitoring, and what we learn afterwards. `docs/agents/HARNESS.md` section 1 still describes a dispatcher that works on this repository, and the harness backlog (HV2-B01 to B37) is mostly merge, CI and release plumbing. This file maps what exists for each stage, names the gaps, and proposes the next backlog items for the stages that are not code.

I did not repeat `docs/agents/harness-v2/BACKLOG.md` (open draft #551, head `611f1ec9`, items B01 to B31) or the merged `LESSONS-2026-11-08.md` (B32 to B37). Where an item here touches one of those, it says so.

## 1. How I audited

For each stage I looked for six things: the owner (an agent charter in `.claude/agents`, a roster entry in `agents/roster.json`, a council skill in `.claude/skills`, or a person), what comes in, what goes out, the gate, whether a machine enforces it, and the gap. "Machine" means a script, test or workflow on `develop` fails when the rule is broken. "Convention" means a doc says so and a reviewer has to notice.

Four limits apply to the whole audit.
- Project docs (the `infra/` and `claude/` pages in the claude.ai Project) are not readable from the repo. I name some of them because other repo files cite them, and I did not read them.
- No autonomous agent lane is running. `HARNESS.md` says so in its 28 Oct box, and the roster has `agents.yml` gated on `AGENTS_ENABLED`. Every agent role below is therefore played by an interactive Claude session on the founder's account. I did not re-check the live value of `AGENTS_ENABLED` (unverified).
- The roster has 26 agents and `.claude/agents` has 26 charters. `HARNESS.md` still says 24.
- `regulatory-affairs` and `user-research` have `daily_runs` 0 in the roster, so neither runs on a schedule.

## 2. The map

Stage numbers are used in the rest of the file. "Owner" is who the repo names, not who has done the work.

| # | Stage | Owner today | In | Out | Gate | Enforced today | Gap |
|---|---|---|---|---|---|---|---|
| 1 | Ideation and founder asks | Karma (CTO) is the front door (`COUNCIL.md` s3); `product` alone reorders the backlog (`HARNESS.md` s4) | The founder's words in chat; journal issues; Project docs (unreadable here) | A BL row in `docs/BACKLOG.md` or `docs/backlog/FUTURE.md`; a D entry if he decides; a dated step in `docs/release/FOUNDER_QUEUE.md` if it needs his hours | The founder-only list (CTO skill s3) and the founder gate (s10a) apply to questions going to him. Nothing screens an idea coming in | Convention. `id-collisions.mjs` checks ids only | No intake form, no early screen against the constitution and privacy rules, no repo record of the ask in his words |
| 2 | Discovery and user research | `user-research` agent and skill (roster `daily_runs` 0) | A decision the study will change | `docs/research/studies/<study>/PLAN.md`, `GUIDE.md`, `FINDINGS.md`; `docs/research/USER_RESEARCH.md` | "If no decision changes, do not run it" (skill s2); `product` reviews the plan before recruiting; incentives are the founder's | Convention. `no-real-family-data.test.ts` keeps real family details out | `USER_RESEARCH.md` says "No primary interviews yet" (1 Oct). The only study folder holds one plan, no findings |
| 3 | Requirements and PRD | `product` writes; `qa` owns traceability; `design-systems` and `content` write the Shown line (`COORDINATION.md` s10) | An idea or decision | `docs/prd/v2/features/F*.md` with ids and work packages; `docs/TRACE.md`; BL rows with Acceptance and "Who must rule" | Requirement rules RR-1 to RR-13 (`docs/prd/v2/11-...` s1); the door lines in `COORDINATION.md` s10 | Machine for ids: `scripts/trace.mjs --no-write` runs inside `npm test` and fails on duplicate or undefined ids. Convention for the rest | `TRACE.md` reports 571 of 768 P0 ids with no test title citing them and reports it without failing. Nothing checks that a requirement says what evidence it rests on |
| 4 | Cross-functional consult and sign-off | Karma routes; 12 executive roles (`COUNCIL.md` s1); working agents under them | A change or a question | A numbered entry in `docs/agents/exec/RULINGS.md` (for example `CLO-3`) or `docs/agents/cto/RULINGS.md` (`CR-n`); for fenced compliance paths, two approval comments at the head sha | Routing table (`COUNCIL.md` s4); founder gate; the compliance fence (CR-27) | Machine for one case: `compliance-fence.yml`, required on `develop` (CR-32). Convention for every other function | The PR template has no consult line. Nothing records which functions were asked about a store listing, a price, a vendor or a data flow |
| 5 | Design | `design-systems` agent; CDesO skill; `content` for words | A requirement | `docs/design/specs/`, `packages/design-tokens`, `packages/content` | Design language docs; content rules; tokens tests | Machine for words and tokens: `packages/content/test/rules.test.ts` and `packages/design-tokens/test`. Convention for the review itself | No record that a screen was checked at the largest Dynamic Type or with VoiceOver before build (a few VoiceOver tests exist under `apps/mobile/test`) |
| 6 | Build | `mobile`, `sync`, `payments`, `data-architect`, `security`, `privacy` and others; five standards stewards | A BL row | A pull request into `develop` | Three required contexts on `develop`; two counted reviews at the full head sha (D-107); Karma's tiers (CTO skill s4) | Machine: `ci.yml` (unit, db, functions, typecheck, seam-guard, required), `migration-guard.yml`, `compliance-fence.yml`, `merge-queue.mjs` | None that this file adds. Stage 4 is the missing input to this one |
| 7 | Quality | `qa` agent | A build or a PR | `docs/qa/evidence/<date>-<build>-<device>.md`, run sheets, `ALPHA_GO_NO_GO.md`, `release-test-catalog.csv` | Go/no-go on the dates in D-130; device sittings by the founder | Machine for simulator work: `nightly.yml` (opens one `nightly` issue on red), `kill-harness.yml`. `scripts/qa/skip-guard.mjs` exists and no workflow calls it. Device checks are by hand | `docs/qa/evidence/` holds only `README.md` and `TEMPLATE.md` on `develop`: no device evidence file is committed |
| 8 | Release | `ops` agent; Karma's release-manager skill; the founder holds the Apple, Expo and Vercel accounts | A tag or a dispatch | A TestFlight build; the site; `docs/release/*` records | Preflight scripts in `apps/mobile/scripts`; `scripts/release/doctor.ts`; D-107 reserves store and external-group steps to the founder; `docs/agents/WALLS.md` | Machine for build checks (`testflight.yml`, `release-ios.yml`). Convention for the decision to ship | Legal, compliance, claims, support and cost are checked in separate docs (`docs/store/readiness.md` is dated 28 Oct). No one page shows every function's status for one build |
| 9 | Production operation | `ops`, `security`, `privacy`; `support`; the founder for accounts | Deploys, requests, incidents | `deploy-db.yml`, `deploy-functions.yml`; 13 runbooks in `docs/ops/runbooks`; `BACKUP_RUNBOOK.md` | The founder applies live migrations (`COORDINATION.md` s6); counsel approves incident notices (`incident-notification.md`) | Machine for deploy plumbing and restore scripts under `scripts/ops`. Convention for runbooks | No drill record on `develop`. `docs/support/` does not exist, so the `support` charter has produced nothing there |
| 10 | Monitoring and observability | `principal-architect` owns chapter 10; `ops`; `analytics`; `data-architect` | Signals: CI, nightly, server health views, store crash rates | A `nightly` issue; `ops_health` views and alerts (planned) | OBS-R09 to R12 in `docs/engineering/10-logging-and-observability.md` | Machine only for the nightly issue and the kill harness. Chapter 10 marks R09, R10, R12 and R14 "not yet" (3 Oct; I did not re-check live) | Nobody is named as the reader of each signal. In-app analytics is off for the whole 1.0 line (D-124), so there is no product data |
| 11 | Learning and feedback | `product`, `chief-of-staff`, `decision-science`, `analytics` | Feedback issues, support themes, build reviews, lessons | Lessons docs, `MEMORY.md` carry (`scripts/agents/memory.mjs`), backlog proposals | `PRINCIPLES.md` rule 20: a rule broken twice becomes a check | Convention. `INSIGHTS_LOOP.md` is marked superseded for v1.0 | Lessons are written by hand after a bad day. No step turns a build or an alpha week into backlog rows |
| 12 | Retirement or change of a feature | No named owner | A decision to remove, pause or change | A kill switch in signed remote config; a BL row marked `superseded` with the D id | Anything users are promised goes to the founder (CTO skill s3) | Machine for the switch itself (`docs/ops/RELEASE.md` s9 lists `sync`, `invites`, `photos`, `packDownloads`, `serverContent`). Convention for the rest | No checklist for the data, store label, Terms, support article, claims and tests that a change touches |

## 3. Stages with a real gap

### Stages 1 to 3: ideas, research and requirements

An idea reaches the repo only after the founder or a session has already decided it deserves a BL row. Nothing in the repo screens it first. The cheapest wrong decision is an idea that breaks the constitution or a privacy rule and gets two weeks of PRD work before anyone says so. `CLAUDE.md` already has the screen (no writing or shaping of a person's words, no fear or guilt language, no gap counting, no content in analytics), so the check is a short form at the top of the idea, answered before any requirement exists.

Research has the right rules and little output. The `user-research` skill is careful about consent and about sizes. `USER_RESEARCH.md` is desk research from 1 Oct. The Memory Library study plan (10 Nov) says plainly that nothing in it has been run. The risk is that a requirement reads as if parents asked for it when only we did. A one-word evidence tag on each requirement (evidenced with a study id, assumed, contradicted) would make that visible, and the skill already asks the researcher to keep that tag in `USER_RESEARCH.md`.

Requirements are in better shape than the other early stages. The id checks run in `npm test`. What no machine reads is whether a requirement carries a Given/When/Then, the device it is checked on, and who rules.

### Stage 4: consult and sign-off

This is the largest gap and the one the founder named. The routing table in `COUNCIL.md` section 4 says who must be consulted for a kind of change. The only place a machine checks that anyone was consulted is the compliance fence. For everything else a session has to remember.

What counts as a recorded sign-off today, by what I can read:
- A numbered entry in `docs/agents/exec/RULINGS.md` or `docs/agents/cto/RULINGS.md`, signed with the role and "Claude role" so it is not read as a real officer (`COUNCIL.md` s5). The exec log has 12 headed entries on `develop`.
- For fenced compliance paths, two comments from the owner's login, each as a heading line naming the full 40-character head sha (`compliance/README.md`).
- A counted review comment, `## Review A at <sha>: PASS`, which `merge-queue.mjs` reads on the first line only.
- The founder's own words in `docs/DECISIONS.md`.

A chat "approved" is not a record. The rule that a review binds to the full sha is CR-44, which lives in open PR #555 and is not yet in `docs/agents/cto/RULINGS.md` on `develop`.

When two functions disagree, `COUNCIL.md` s3 step 4 says both positions are written down with evidence. Karma decides if no founder-only matter is touched. Otherwise the founder gets one question with both positions and a recommendation. Where the PRD and a legal requirement disagree, `docs/BACKLOG.md` says LEGAL-REQ wins until the founder decides. Counsel holds the veto on legal matters (CTO skill s4). I found no standard place to write the two positions down, so today they are in a PR body or a chat.

Legal, compliance, privacy and security advice stays advice for four reasons that are already written down. Each executive signs as a Claude role and not as a lawyer (`COUNCIL.md` s5). A legal conclusion that matters goes to counsel through `docs/legal/COUNSEL_PACKET.md`. Every fact about a law needs a source read in the session or is marked unverified. The founder-only list in the CTO skill s3 keeps promises to users, retention promises and anything about children's data with the founder. What is missing is a check on the wording. A ruling can be filed as "approved" with no sign that it was advice.

The table below is my reading of `COUNCIL.md` section 4, extended with the sign-off types the repo already uses. It is the draft input to HV2-B38 and the founder has not agreed it.

| Kind of change | Must be consulted | The record that counts |
|---|---|---|
| A public claim: store listing, site, screenshots, email | CMO owns; CLO and CCO check the claim; CPrivO for privacy claims; CAIO for AI and transcription claims | Exec ruling ids; a row in the claims registry once it exists (`docs/legal/CLAIMS.md` is proposed in PR #37 and not on `develop`) |
| Pricing, Plus, a partner, print | CBO; CFO; CLO for contracts | Exec ruling ids; founder decision |
| Any new personal data, SDK, vendor or data flow | CPrivO, CDO, CISO; CFO for cost; CCO for rules | Data classification row, `docs/legal/subprocessors.md`, exec ruling ids |
| Sign-up, age, consent, countries, Terms acceptance | CCO, CPrivO, CLO | Fence approvals at the head sha; counsel packet entry |
| A new language or pack | `content`, `speech`, a native reviewer | The native reviewer and the founder say so (`COORDINATION.md` s6) |
| A new AI feature or model | CAIO; CPrivO for any data the model sees | Exec ruling ids; the constitution check |
| A screen or flow | CDesO; CPO | Design spec in `docs/design/specs`; evidence at the largest Dynamic Type |
| A release | CTO; CCO; CLO; CMO; CPrivO; support | Today: separate docs. Proposed: one page (HV2-B43) |

### Stages 5, 7 and 8: design, quality and release

Design has machine checks for words and tokens and none for accessibility on a device. Quality has the best written plans in the repo (`DEVICE_TEST_PLAN.md`, run sheets, the evidence template) and no committed evidence file. I cannot tell from the repo whether sittings happened and the evidence lives elsewhere, or whether they have not happened (unverified). `HV2-B02` in #551 builds the evidence kit, so I add no item for it.

Release is checked well for the build and badly for the decision to ship. A release needs the CCO, CLO, CMO, CPrivO, support and the CFO to have no open objection. Today the founder gets that by asking, one function at a time, or by reading separate docs.

### Stages 9 and 10: production and monitoring

The runbooks are specific and privacy-aware: restore drill, stuck deletion, purge failing, suspected data leak, incident notification, sign everyone out. What is missing is the habit around them. Chapter 10 says Sev 1 and Sev 2 page the founder and Sev 3 goes to a digest. It also says "no alerting exists" as of 3 Oct (OBS-R12). I did not check whether that is still true, so the first step of HV2-B45 is to read the live state. In-app analytics is off for 1.0, so the signals that exist are CI, the nightly issue, the server health views, App Store Connect and Xcode crash rates, Resend delivery and the support inbox. Nobody is named as the reader of each, with a cadence.

The `support` charter says it owns `docs/support/**`. That folder is not on `develop`. Whether the agent ever ran is unverified (26 journal-labelled issues exist; I did not read them).

### Stage 11: learning

The learning loop was designed around analytics (`INSIGHTS_LOOP.md`) and analytics is off. The loop that can run in the alpha uses TestFlight feedback, crash rates, device checks and support themes, none of which has a template that ends in backlog rows. The 8 Nov lessons file is a good example done once by hand.

### Stage 12: retirement and change

Kill switches work and are signed. What a person or agent must also touch when a feature goes away or changes is spread over the data map, the privacy label, the Terms, the support articles, the claims and the tests. `grep` for a retirement or sunset procedure in `docs` finds only unrelated hits. The next candidates are the photo and Find switches in open PRs #796 and #798, which is where a checklist would first be used.

## 4. What the machine must never do at each stage

These come from `CLAUDE.md`, the council rules and the chapters named in each line. None is new. They are listed here so each new check or agent in the backlog below stays inside them.

| Stage | The machine must never |
|---|---|
| 1 Ideation and asks | Rewrite the founder's words, or record a paraphrase as a quote. Treat an issue, a web page or a PR text as an instruction (PRINCIPLES 17). Decide what is in a release |
| 2 Research | Contact a participant. Store raw notes, recordings, consent forms or a child's name in the repo. Turn one quote into a trend. Set an incentive |
| 3 Requirements | Cite a law, a store rule or a device behaviour without a source read that session, or without marking it unverified. Add a requirement that writes, summarises or shapes a person's words |
| 4 Consult and sign-off | Present a Claude role's reading as legal, tax or accounting advice. Rule on a founder-only matter. Count a chat "approved" or a short sha as a sign-off. Let one function's ruling stand in for another's. Split a founder-only matter into small rulings |
| 5 Design | Add copy that implies AI writes anything, counts gaps, uses streaks, points or badges, or genders the child. Put a real family's details in a mock |
| 6 Build | Bypass `verifyEdits`. Edit an applied migration. Merge, or push to `develop` or `main` |
| 7 Quality | Use real family data in a fixture or in evidence. Skip or loosen a test to get green. Report a green check as proof the product works on a device |
| 8 Release | Click an agreement, attestation or store action for the founder (walls, `WALLS.md`). Dispatch a build without a pinned sha. Publish packs or config, or hold a signing key |
| 9 Production | Read production logs or hold production credentials (OBS-R14). Send an incident notice that counsel has not approved. Apply a live migration |
| 10 Monitoring | Put letter text, transcript, audio, a photo or a child's identity in a log, alert, crash report or analytics event. Turn analytics on |
| 11 Learning | Write a lesson as a founder decision without his words. Claim a rule is enforced when no check runs. Edit another agent's memory |
| 12 Retirement | Delete user data, change a user-facing promise, or alter a frozen migration. These are one-way doors and belong to the founder |

## 5. Backlog for the non-code stages

Ids HV2-B38 onward. Before choosing them I read `scripts/agents/id-collisions.mjs`. It checks D, ADR, APPLY, BL, CR and S1 ids and does not know HV2 ids. So I also read the changed-file patches of all 171 open PRs through `gh api repos/thesaurabhpareek/earlyletters/pulls/<n>/files` on 11 Nov and searched for `HV2-B38` to `HV2-B99` and for a `LIFECYCLE.md` path in the harness folder. I found none. The highest id in use is B37 (`LESSONS-2026-11-08.md`); #551 ends at B31. Re-run that search before this PR leaves draft, because open PRs move.

Order: items that save the founder's minutes or prevent a wrong product decision come first. Founder minutes are my estimates for the first step, not measurements. Where an item needs a ruling, I say whose. `COUNCIL.md` s5 says no new registers, so no item below creates one; each uses an existing home or asks Karma to rule that it is not a register.

- **HV2-B38 Consult matrix and a Consulted line.**
  Goal: every non-routine PR and backlog row says which functions were consulted and cites the ruling ids.
  First step: turn the table in section 3 into `docs/agents/consult-matrix.json` after Karma and the founder agree it, then write a read-only script that lists open PRs touching a trigger path (public copy, pricing, vendors, consent, store files) with no `Consulted:` line, and checks that each cited ruling id exists on `develop`. Report only; no workflow change.
  Owner: `chief-of-staff`, with `product`. Karma rules on the matrix.
  Measure: share of non-routine PRs with a valid Consulted line, read from the script each week; founder questions that return as "you did not ask legal, privacy or security first" (target 0).
  Founder minutes: 10 to read and agree the matrix.

- **HV2-B39 Advice lint for exec rulings.**
  Goal: no ruling from the CLO, CCO, CPrivO, CFO or CISO role reads as legal, tax or audit advice.
  First step: `scripts/agents/rulings-lint.mjs` reads `docs/agents/exec/RULINGS.md` and fails an entry whose heading lacks the role code, the date, and one of "not counsel", "not legal advice", "not a lawyer" or "Claude role" for the roles that need it. The existing entries (`CLO-3`, `CPrivO-2`, `CCO-5`, `CCO-6`) already follow this shape, so I expect the first run to pass, but I have not run it.
  Owner: `chief-of-staff`.
  Measure: entries failing the lint (target 0); entries that cite a source read with its date for each legal fact.
  Founder minutes: 0.

- **HV2-B40 Idea brief with an early screen.**
  Goal: an idea is a half page before it is a PRD, and the cheap objections come first.
  First step: a template with eight lines: the problem in the parent's words, who it is for, the decision it changes, the evidence (tagged evidenced, assumed or contradicted), the constitution and privacy screen (the five checks in `CLAUDE.md`), who must be consulted (from B38), a monthly cost with source, and the cheapest test. Use it on the next two ideas from the founder and see whether it saves reading. Karma rules that a template in `docs/backlog/` is not a new register.
  Owner: `product`.
  Measure: ideas stopped or reshaped at the screen before any PRD work; minutes the founder spends reading an idea (his count over the two trials).
  Founder minutes: 10 for the trial.

- **HV2-B41 Evidence tags on requirements.**
  Goal: no requirement reads as demand when only we have asked.
  First step: add an `Evidence:` tag to the P0 rows of the three features with open study plans (Memory Library, Find, Photo with a letter), by hand, then a counter that prints evidenced, assumed and contradicted per feature next to the trace report.
  Owner: `user-research`, with `product`.
  Measure: P0 rows tagged assumed per feature, printed each week; studies run against the riskiest assumptions named in `user-research` standing duty 2.
  Founder minutes: 5 to approve the pass bars in the Memory Library plan. Running the sessions is a separate founder call and the plan estimates 8 to 10 adults at about 50 minutes each.

- **HV2-B42 Regulatory watch that actually runs.**
  Goal: a changed law or store rule reaches the register on a date, with a source.
  First step: the `regulatory-affairs` charter tells it to run `compliance/scripts/regulatory-watch.mjs` weekly. That folder is not on `develop`; the script is in open PR #424. Decide with the CCO whether #424 lands as is, and until then record the watch as off in `checked-facts.md`. Then do one manual pass of the state trackers and write one dated line per finding.
  Owner: `regulatory-affairs`, for the CCO.
  Measure: dated entries in `references/checked-facts.md` per month; days since the last watch run.
  Founder minutes: 5 (the call on #424).

- **HV2-B43 One go/no-go page for a build.**
  Goal: the founder reads one page and sees each function's status for the build he is about to ship.
  First step: a template that extends `ALPHA_GO_NO_GO.md` with one row per function (QA, security, privacy, compliance, legal, marketing claims, support, finance, design), each with the source link, the date read, the status and the ruling id. Fill it by hand for the next TestFlight build.
  Owner: `ops`, with `chief-of-staff`.
  Measure: separate asks the founder makes before a build (today several; target 1); rows with a ruling id and a date.
  Founder minutes: 5 per build. It replaces asks, so it should net out below zero after two builds. That is a hope until measured.

- **HV2-B44 Claims gate for store and site copy.**
  Goal: every public claim has a row with the evidence that it is true of the build.
  First step: list the claim strings in `packages/content/src/store.en.ts`, `site.en.ts` and `pages.en.ts` against `docs/reviews/2026-10-claims-inventory.md`, and report strings with no row. It extends `claims-capabilities.test.ts`, which already scans surfaces for false claims. It does not duplicate BL-637 or BL-781 in open PRs.
  Owner: `marketing`, with `content`. The CMO keeps the registry.
  Measure: claim strings with no registry row (target 0 before a store submission).
  Founder minutes: 0 to start.

- **HV2-B45 Who reads which signal.**
  Goal: every production signal has a named reader and a cadence.
  First step: read the live state first (is any alert wired, what does the `nightly` issue reach), then fill a table: signal, reader, how often, where the result lands, what privacy rule covers it. Signals: CI and the `nightly` issue, kill harness, `keepalive.ts`, `ops_health` views, App Store Connect and Xcode Organizer crash rates, Resend bounces, Vercel errors, the support inbox. Put the table in chapter 10's owner's hands as a proposal; do not edit chapter 10 here.
  Owner: `ops`, with `principal-architect`.
  Measure: signals with a reader and a cadence over signals total (target all); the hours between a nightly red and a human reading it, from issue timestamps.
  Founder minutes: 15 to confirm which signals he wants to be paged on.

- **HV2-B46 A tabletop incident drill.**
  Goal: find out whether the suspected-leak and notification runbooks work before they are needed.
  First step: one 45 minute tabletop on `suspected-data-leak.md` and `incident-notification.md` with a made-up leak affecting the fictional Asha family only. Time the first hour, list every step that needed something the runbook does not say, and open fixes as BL rows.
  Owner: `security`, with the CISO and `privacy`.
  Measure: steps that could not be done from the runbook alone (target 0 after the second drill); minutes to a contained and counsel-ready summary.
  Founder minutes: 45.

- **HV2-B47 Content-free support themes.**
  Goal: what parents ask us turns into backlog rows without anyone reading their words.
  First step: use the request kinds already in `data-requests-by-email.md` (`delete_account`, `withdraw_sync`, `see_export` and the rest) as the only categories, and have `support` write a weekly count and three themes from tickets the founder forwards with content removed. Create `docs/support/` with the first article only when the count shows a need.
  Owner: `support`.
  Measure: backlog rows traced to a support theme; tickets that contained letter text (target 0).
  Founder minutes: 5 a week once users exist.

- **HV2-B48 Alpha learning review after each build.**
  Goal: each TestFlight build ends with a one-page review that feeds the backlog.
  First step: a template for the review: feedback issues (label `beta`), Xcode Organizer crash rate, device-check failures, decisions that need a ruling, and up to five proposed BL rows. Run it for build 12.
  Owner: `product`, with `qa`.
  Measure: days from build available to review filed (target 3); BL rows traced to a review.
  Founder minutes: 10 per build.

- **HV2-B49 Lessons to checks tracker.**
  Goal: `PRINCIPLES.md` rule 20 is followed: a rule broken twice becomes a check.
  First step: list the lessons in `LESSONS-2026-11-08.md` and the setup retro with one status each (check exists, check proposed, convention only), and count how many moved to a check in two weeks. Put the list inside the lessons file's successor, not in a new register.
  Owner: `chief-of-staff`, with `ai-eng-lead`.
  Measure: lessons with a check over lessons total; repeats of a lesson already listed.
  Founder minutes: 0.

- **HV2-B50 Feature change and retirement checklist.**
  Goal: removing or pausing a feature touches everything it should, once.
  First step: a one-page checklist from files that exist: the kill switch (`RELEASE.md` s9), the data map and retention (`DATA_CLASSIFICATION.md`), deletion and export, the privacy label (`app-store-privacy-labels.md`), Terms and Privacy (founder merges), claims, support article, analytics events, tests, and the notice to users. Trial it on the photo switch (#796) and the Find switch (#798).
  Owner: `product`, with `privacy`.
  Measure: items found after the fact on the first two uses (target 0).
  Founder minutes: 5.

- **HV2-B51 Vendor and SDK intake sheet.**
  Goal: nothing that touches data or money is added without finance, privacy, security and legal seeing it first.
  First step: one page filled before any new vendor, SDK or paid plan: what data it sees, classification row, `subprocessors.md` row, contract and terms read (with date), monthly cost, exit plan, privacy label effect. The `infosec` skill and CFO skill supply the questions.
  Owner: `security-architect`, with the CFO and CPrivO roles.
  Measure: new vendors with a complete sheet; sheets filled after the vendor was already in use (target 0).
  Founder minutes: 5 per vendor, and it is a money decision for him in any case.

- **HV2-B52 Design acceptance record.**
  Goal: a screen is checked at the largest Dynamic Type and with VoiceOver before it is built, and the check is written down.
  First step: add one line to each design spec in `docs/design/specs`: checked at largest Dynamic Type on which device, date, and the VoiceOver reading order. Start with the specs already in open PRs (#794 Find).
  Owner: `design-systems`.
  Measure: specs with the line; accessibility defects found after build.
  Founder minutes: 0.

HV2-B04 (CLAIMS.md) and HV2-B05 (pointer pass) in #551 reduce founder reading for code work. These items do the same for the other stages. B38 and B43 are the two I would do first, because each replaces several separate asks with one.

## 6. Conflicts of interest and what I could not verify

I am a Claude session in the product seat. I gain scope from B40, B41, B48 and B50. B38 and B39 put more work on `chief-of-staff`, which I propose and do not own. I could not read Project docs, so every claim about them rests on repo files that cite them.

Unverified, by stage:
- Stage 1: that the Project doc `claude/Karma-founder-asks-routine-2026-11-10.md` holds the founder's asks. I know only its name from the project list.
- Stage 2: whether any primary interview has happened since 1 Oct. `USER_RESEARCH.md` says none; no findings file exists on `develop`.
- Stage 3: the date `TRACE.md` was last generated. I quote its headline counts as printed.
- Stage 4: that no other record of consults exists in the Project docs. The count of 12 exec entries is of headed entries in `RULINGS.md`; I did not check for duplicates.
- Stage 6: branch protection contexts. I rely on `LESSONS-2026-11-08.md` s8, read on 9 Nov, and did not re-read them.
- Stage 7: whether device sittings took place without a committed evidence file. Whether any workflow runs `skip-guard.mjs`: I grepped `.github/workflows` and found no call.
- Stage 8: how many builds were dispatched after 8 Nov. `BUILD_GATE_2026-11-08.md` says none had been; later build records are Project docs I did not read.
- Stage 9: whether a restore drill was run (`docs/qa/BACKUP_RESTORE_DRILL.md` exists; I did not read whether it records a run) and whether the production deploy environments require a reviewer.
- Stage 10: the live state of alerting. Chapter 10 is dated 3 Oct.
- Stage 11: what the 26 journal-labelled issues contain.
- Roster: the live value of the `AGENTS_ENABLED` variable.
- Ids: the open-PR search covers 171 PRs read on 11 Nov and can go stale.
