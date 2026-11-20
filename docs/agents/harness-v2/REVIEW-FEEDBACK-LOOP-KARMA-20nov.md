# Karma review of the feedback-loop backlog rows (HV2-B61 to B83, first pass)

Status: REVIEW RECORD | 20 Nov 2026 (UTC) | Karma (CTO, Claude role) | Reviewed file: `docs/agents/harness-v2/BACKLOG-FEEDBACK-LOOP-20nov.md` at first-pass commit `955131739daf39582b02f6ad4637407ab2b38033`.

I want to be plain about the setup. I am a Claude session playing Karma, in the same session lineage that drafted the rows. This is a review of method, not an independent one: one account, one model family (CR-32). The founder's merge is the only thing that makes any row real. Nothing here is a founder approval.

Read before ruling: the CTO skill (tiers, loop, pre-mortem, founder gate), the harness rules skill, `COUNCIL.md`, `OPERATING_MODEL.md`, `AGENT-COMMS.md`, `COORDINATION.md`, `HARNESS.md`, `LIFECYCLE.md` (PR #815), `FEEDBACK-LOOP.md`, `requirements-feedback-loop.md`, `LOAD-ORDER.md`, `REGISTRY.md`, and the dispatcher and merge-queue sources on `develop` (`16e61549`).

## 1. Framing

The underlying problem is not "automate the loop". FL already works by hand. The problem is that questions cost agent runs and founder minutes when the answer is on record, and nothing tells us when that happens. So the rows that pay first are the ones that make the record easy to search (B65), shrink the open list (B72), and measure the loop (B66, B67). The dispatcher rows come last, because the agent lane is not running (`HARNESS.md` 28 Oct box; `AGENTS_ENABLED` unread) and a dispatcher change is the one place a mistake touches every agent. Cynefin: complicated for the scripts, complex for the cadence and targets (no data exists; FL says take a four-week baseline).

"Self-healing" needs a plain definition. Nothing here repairs anything by itself. The harness detects, flags and routes, and a person or the owning agent fixes. I rename the group accordingly and I would refuse a row that edits another owner's file automatically (fail closed, skill section 12.3).

## 2. Findings

Must-fix means the row cannot go to the founder as written. Should-fix means improve it in this pass.

| Id | Row | Level | Finding |
|---|---|---|---|
| MF-1 | B79 | must | Editing 26 charters and 26 memory files is 52 files in founder-owned paths. It conflicts with open PRs, breaks "no agent edits another agent's charter or memory" (OPERATING_MODEL section 8), and makes 52 copies of one pointer: a second source of truth (skill section 12.2). |
| MF-2 | B64 | must | "Deterministic classifier" overclaims. Class A and F need judgement. A checker that picks a class would be wrong in ways nobody sees. It may only check that a human triage record is consistent with FL section 3. |
| MF-3 | B63 | must | The family-data scan in the intake check would need the hashed names, which live in a test file. Copying them makes a second hash list; not scanning leaves handoff bodies unguarded. Handoff bodies are issues, not tracked files, so the repo test never sees them. |
| MF-4 | B62 | must | Three traps. (a) Asker lens sorting trusts a `from:` field that GitHub does not prove (AGENT-COMMS section 5, PINF-02): it can only be a hint. (b) Product's own reply may quote a marker: the marker must count only as first text, and every agent comment starts `<!-- agent:<handle> -->`, so it is safe only if the test says so. (c) A triage run must not count as a "task" against the team limit, or the 82 agent PRs against a cap of 10 block it. |
| MF-5 | B61 | must | Creating the label is a repository write when `bootstrap.mjs` runs. I was told not to create labels, and a session cannot be the one that does. The marker alone makes the loop work. The label must be optional so nothing waits on it. |
| MF-6 | B82 | must | A workflow proposal must say `pull_request`, never `pull_request_target`, minimal permissions (`contents: read`), no secrets, actions pinned by sha. Making it a required check is a branch-protection setting and is the founder's (skill section 3). |
| MF-7 | B66, B67, B69 | must | `ledger.mjs` already copies a handoff `title` into its event (`ledger.mjs` line 41). A requirements handoff title is "<row id>: <what is unclear>", which could carry content. The new kinds, the metrics and the digest line carry ids, classes, handles and times only. |
| MF-8 | B68 | must | The retro row says "weekly job". A scheduled unattended run is the first switch-on of an unattended lane, which is the founder's (skill section 2). The script is T1; the schedule is T3. Split them. Until the founder decides, the retro runs when an interactive session is asked to. |
| MF-9 | section 5 heading | must | Group C calls itself self-healing. Rename to detect, flag and route, with the plain statement above. |
| SF-1 | B76 | should | `handoff.mjs` already takes `--to a,b,c` and each recipient replies once (AGENT-COMMS section 2). The fan-out helper is one command already. Lateness is a metric in B67. Cut B76. |
| SF-2 | B77 | should | The founder queue is hand-checked by Karma today and class E volume is unmeasured. Building a lint before there is volume is gold-plating (skill section 13). Defer B77 with a trigger: eight class E items in one week. |
| SF-3 | B72 | should | Overlaps `HV2-B08` (stale sweep printer, in #551, not on develop). B72 extends `merge-queue.mjs`, which is on `develop`, and does not wait on #551. State that it only prints; closing a PR is a decision with a reason posted and the branch kept (CR-33). Read cost: 185 PRs, so cache and page. |
| SF-4 | owners | should | `ops` carries six serial rows with a `wip_limit` of 1; `chief-of-staff` has `wip_limit` 0. Spread owners and say that until the lane is on, interactive sessions play these seats. |
| SF-5 | all rows | should | T2 needs "tests that fail on the old code". Add it to each T2 done-when. Add an order, with value first. |
| SF-6 | B85 (new) | should | `LOAD-ORDER.md` has role rows for 16 of the 26 roster handles (read at `40c6eb4a`); `red-team`, `payments`, `principal-architect`, `data-steward`, `security-architect`, `compliance-engineer`, `ai-eng-lead`, `decision-science`, `chief-of-staff` and `regulatory-affairs` have none. A pointer to "your row" would point at nothing for 10 agents. |
| SF-7 | B83 | should | The CTO skill has a synced copy outside the repo. A repo edit does not change that copy. Say it, and keep the edit to a pointer. |

## 3. Pre-mortems for the T2 rows (skill section 6)

Each is "two weeks on, this went badly: what happened".

**B61 label and marker.** (1) A quoted marker in a human reply schedules triage again and again: prevented by the first-text rule and a test with a quoted marker. (2) The label does not exist when the founder expects it: prevented by MF-5, the marker works alone. (3) A spoofed marker from a stranger on a public repo: prevented by the trust test (AGENT-COMMS section 5); detected by an ignored-marker count in the board line.

**B62 dispatcher triage mode.** (1) Triage starves backlog tasks for `product` (3 daily runs): one run takes every open question, and tests show a run budget. (2) The team-limit deadlock blocks triage: triage is a reply, not a task, and a test runs it at the cap. (3) A bug in the new branch wrongly assigns every agent: the rule only adds work to `product`, and `dispatch` tests for the other 25 handles must show no change. Way back is deleting one rule.

**B80 two charters.** (1) `product` treats the retro as permission to change cards: the charter text says retro output is a proposal and Karma reviews it. (2) The pointer drifts from FL: pointer only, no restatement. (3) Prompt-lint fails in CI: `prompt-lint` runs in the row's tests.

**B82 workflow proposal.** (1) The lint runs on a fork PR with write power: `pull_request`, read-only token. (2) It becomes required and blocks every docs PR on a lint bug: advisory first; required is the founder's later call. (3) It runs long on 185 PRs: scope by `paths:` filter.

**B84 OPERATING_MODEL section.** (1) Every agent reads another 6 lines each run and the token cost rises: the section stays under 8 lines and points. (2) It contradicts FL: it cites FL section names, no copy. (3) It lands before FL is on `develop` and points at nothing: depends on X1.

**B85 brief pointer.** (1) The brief grows for every agent: one line, and a line cap test. (2) A handle without a LOAD-ORDER row gets a broken pointer: default to FL quick reference plus a test over the roster. (3) It changes the brief in a way `prompt-lint` rejects: tests run it.

**B86 shared family canary module.** (1) The hashes get copied twice and drift: one module, both users import it. (2) A real name leaks in the move: the move changes digests only, tests plant no real value; reviewed by `privacy`. (3) The content test breaks: it keeps its own suite and an equal-output check.

## 4. Risk and return, door, challengers

| Rows | Return | Risk (L x I, adjusted) | Door | Challenger and what they would say |
|---|---|---|---|---|
| B65, B72, B78 | high: fewer questions, a shorter PR list, correct routing | 1 x 2, read-only | two-way | `qa`: replay on real E and CL rows, not made-up ones. Accepted: B64 and B65 tests use E1 to E32. |
| B61, B62 | medium: parallel intake | 2 x 4 for B62 (all assignments), cut to 2 x 2 by "adds work to one agent only" | two-way, one rule | `ciso`: no new write rights, trust test, no `pull_request_target`. Accepted: MF-4, MF-6. |
| B63, B86 | medium | 2 x 3 (a second hash list) | two-way with cost for B86 | `cco` and privacy: counts and ids only; one hash list. Accepted: MF-3, MF-7. |
| B66, B67, B68, B69 | high: the loop learns | 2 x 3, no data stored outside GitHub | two-way | `cco` and privacy: no title, no text in ledger, metrics or digest. Accepted: MF-7. `ai-eng-lead`: retro cannot widen what agents decide. Accepted: founder-only line per block. |
| B70 to B75 | medium: flags only | 1 x 2 | two-way | `qa`: every detector has a planted failure. Accepted in done-when. |
| B80, B84, B85 | medium: every agent loads the loop | 3 x 3 (all agents read it) | two-way with cost | `ai-eng-lead`: pointer only, one home (MF-1). Accepted. |
| B82 | medium | 2 x 3 | two-way | `ciso`: MF-6. |
| B87 | low until the lane is on | n/a | founder | n/a |

## 5. What I changed (second pass)

- Cut B79 and replaced it with B84 and B85 (MF-1, SF-6). Memory files get no pointer pass; B75 flags drift and the owning agent fixes its own.
- B64 renamed a triage record lint, no class picking (MF-2). B63 narrowed, B86 added (MF-3). B62 rewritten (MF-4). B61 makes the label optional (MF-5). B82 gets its limits (MF-6). B66, B67, B69 carry ids only (MF-7). B68 split, B87 added (MF-8). Group C renamed (MF-9).
- Cut B76 (SF-1). Deferred B77 with a trigger (SF-2). B72 scoped (SF-3). Owners spread (SF-4). Order and the fails-on-old-code test added (SF-5). B83 notes the synced copy (SF-7).
- Counts after: ids B61 to B87. Cut or deferred: B76, B77, B79. B81 unused. Active rows 23: T1 15, T2 7, T3 1.

## 6. Second pass

I re-read each changed row against its finding. Closed: MF-1 to MF-9 and SF-1 to SF-7. Open and left open on purpose: the thresholds (stale days, run budgets) are guesses until a four-week baseline exists, and the owner capacity is a plan, not a measurement. Nobody has run any script in this file. A fresh round with another reviewer is the right next step before the founder merges; I did not run one.

## 7. Verdict

I approve rows B61 to B75, B78, B80 and B82 to B86 for the harness lane as T1 or T2, each built as its own draft PR the founder merges. Row B87 needs the founder. B76, B77 and B79 are cut or deferred. This is a role approval. It merges nothing and it does not replace the founder's merge.

Karma (CTO, Claude role)
