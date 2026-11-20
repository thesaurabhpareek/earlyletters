# Harness backlog: the requirements feedback loop, HV2-B61 to B87

Status: DRAFT, second pass after the Karma review in `REVIEW-FEEDBACK-LOOP-KARMA-20nov.md` (first pass was commit `955131739daf`) | Owner: `product` for Karma | Replaces: none | Written 20 Nov 2026 (UTC) by a Claude session in the product seat. Load when: you own a harness row, or you review one. Nothing here changes a script, a workflow, a roster entry, a charter or a ruling. Every row is a proposal until the founder merges the PR that builds it.

## 1. What this is and why

On 20 Nov 2026 the founder directed, as relayed to this session by the calling session (his words are not in `docs/product/prd/FOUNDER-MESSAGES-VERBATIM.md` as read at `40c6eb4a`, so this is a relay and not a verbatim quote; a placeholder for his own words is in section 7): update the harness for the requirements feedback loop, align the harness backlog, get a CTO review, take the feedback, improve, and post the CTO verdict. His goals, as relayed: a smart self-healing harness with a strong feedback and self-improvement loop; requirements that work like CI/CD; a product that reacts to engineering questions; parallel lens reviews (design, policy, security, QA, engineering).

The process is written in `docs/product/prd/FEEDBACK-LOOP.md` (FL below) and the proposals in `docs/ops/proposed/requirements-feedback-loop.md` (P1 to P10). Both are on branch `docs/locked-pack-inputs-20nov` (head `40c6eb4a`) and not on `develop` (`16e61549`) as read today. This file turns those proposals and the founder's goals into backlog rows in the HV2 format of `LESSONS-2026-11-08.md` (B32 to B37) and `LIFECYCLE.md` in PR #815 (B38 to B60), with the fields the founder's request adds: why, tier, done-when with a test, and the way back.

## 2. Ids and the collision check

- Highest HV2-B id found anywhere: **B60** (PR #815). `origin/develop` holds B04, B06 and B32 to B37 only; PR #551 holds B01 to B31 and #815 holds B38 to B60 (its title says B38 to B52; the body and file go to B60).
- Method, run 20 Nov 2026 at about 18:40 UTC: `gh api 'repos/thesaurabhpareek/earlyletters/pulls?state=open&per_page=100&page=<1..2>'` gave 185 open PRs; then `gh api 'repos/thesaurabhpareek/earlyletters/pulls/<n>/files?per_page=100&page=<1..3>'` for each, searching every `patch` for `HV2-B<n>`. Hits above B60: none. Files with no `patch` field (very large diffs) are not covered. `id-collisions.mjs` does not know HV2 ids. This file takes **B61 onward**. Ids are never reused: a cut row keeps its id and says CUT.
- Re-run the search before this PR leaves draft: open PRs move.

## 3. Dependencies named once

- **X1** The requirements pack on `develop`: `FEEDBACK-LOOP.md`, `LOAD-ORDER.md`, `REGISTRY.md`, `18-errata-after-lock.md`. Today they sit on branch `docs/locked-pack-inputs-20nov`; the lock PR is draft #846. Another agent is finishing `LOAD-ORDER.md` and `REGISTRY.md`; this file only reads them.
- **X2** PR #912 (draft, head `61760a69`): the dispatcher parses 3 and 4 digit backlog ids. Without it `BL-1000` is never queued. `lib.mjs` uses `\d{3}` in three places today (`BL_RE` at line 52, the heading match at line 74, `takenIds` at line 141).
- **X3** Open-PR cap. `agents/roster.json` `limits.max_open_agent_prs` is 10 and `dispatch.mjs` line 236 to 271 stops every new task and standing duty at that count. Read live on 20 Nov: 185 open PRs, 102 drafts, 82 carrying an `agent:*` or `from:agent` label (the task brief said 178; the live count is higher). If the agent lane is ever switched on, no row below can start until B72 shrinks that list. Whether `AGENTS_ENABLED` is set is unverified; until it is, interactive sessions play the roles.

## 4. Tiers used (Karma skill section 4)

T0 CI covers it. T1 reversible technical, Karma rules alone. T2 sensitive: `scripts/agents/**` that changes what every agent is assigned, `.github/**`, charters and the rules every agent reads; needs a pre-mortem and two lens reviews. T3 founder. Every path below under `scripts/agents/**`, `.github/**`, `agents/roster.json`, `.claude/**` and `docs/agents/**` is founder-owned (`CODEOWNERS`), so each such row is a draft PR the founder merges, whatever its tier.

## 5. Rows

Order, value first: B65, B72, B78, B63, B66, B67, B64, B84, B85, B61, B69, B68, B70 to B75, B86, B80, B83, B82, then B62 last because it is the one change that touches every assignment while the lane is off. Row fields: What, Why, Size (S under a day, M one to three days; one PR), Owner (handle in `agents/roster.json`), Depends, Done when (with the test; a T2 test must fail on current `develop`), Way back. Until `AGENTS_ENABLED` is read as true, interactive sessions play the owner seats, so owner capacity is a plan only.

### Group A: intake and triage

- **HV2-B61 Label `req-question` and the comment marker.** Tier T2.
  - What: `lib.mjs` reads a first-line marker `<!-- req-question:<row id> -->` from a trusted comment. The marker alone makes the loop work. `bootstrap.mjs` also lists a label `req-question`, which is optional: the label definition is created only when the founder runs `bootstrap` or switches the lane on. This PR and its session create no label (Karma MF-5).
  - Why: FL section 2 and P2. Today a review comment is read only if the author also opens a handoff. The founder wants product reactive to engineering.
  - Size S. Owner `ops`. Depends none.
  - Done when: `lib.test.mjs` shows the marker counts only as first text of a trusted comment, never when quoted, when preceded by `<!-- agent:<handle> -->`, or when posted by an untrusted author (AGENT-COMMS section 5); all fail on current `develop`; `bootstrap` dry run lists the label.
  - Way back: delete the parse function and the label entry.
- **HV2-B62 Dispatcher: product triage mode.** Tier T2.
  - What: a trusted `req-question` marker gives `product` one `triage` assignment per run, ahead of backlog tasks and after `maintain` and `handoff`. One run takes every open question. The asker's declared lens sorts engineering questions first, as a hint only: `from:` is declared, not proven (PINF-02). Triage is a reply, not a task, so the team limit does not block it. The rule adds work to `product` only.
  - Why: FL section 4 and P2; the founder wants product reactive to engineering. AGENT-COMMS section 7 already puts handoffs before tasks.
  - Size M. Owner `principal-architect`. Depends B61, B78, X2.
  - Done when: `dispatch` test with fixtures: the marker schedules `triage`; an untrusted or quoted marker does not; an answered question does not schedule again; triage is assigned at the team cap; the other 25 handles get the same assignment as before the change. Fails on current `develop`.
  - Way back: delete the rule; comments are read at the next `product` run as before.
- **HV2-B63 Handoff intake check.** Tier T1.
  - What: `handoff.mjs open --kind question --req-row <id>` refuses a body missing any of the five FL fields (row id, what is unclear, evidence, what it blocks, proposed answer) or over 30 lines, and refuses obvious personal data (email addresses, phone numbers, street addresses). It does not scan for family names: that needs B86.
  - Why: FL section 2; P1. Questions arrive complete and without content (CLAUDE.md privacy rules).
  - Size S. Owner `product`. Depends none.
  - Done when: `handoff` test: five-field body passes; each missing field fails by name; planted email and phone fail.
  - Way back: remove the flag; `question` still works.
- **HV2-B64 Triage record lint `triage-lint.mjs`.** Tier T1.
  - What: reads the triage record a human or agent writes in a reply (`Class: A|B1|B2|C|D|E|F`, `Cites:`, `Plan:`) and checks it is consistent with FL section 3. It never picks the class. Class A cites an id that resolves in the card, errata, closures, D, ADR or CR files; B2 comes with a new E row; E carries a default, a deadline and a `Checked:` line; C names its lenses; D names the owner from the COUNCIL section 4 table; F names a check. A founder-only keyword with a class other than E, or no split, is flagged for a person.
  - Why: founder goal of a replayable triage; FL section 3 calls the rule one "an agent can run". A lint keeps the human decision and catches the slips.
  - Size M. Owner `qa`. Depends B78, X1.
  - Done when: a test replays E1 to E32 and CL-001 to CL-113 as records and checks they lint clean, as FL section 9 asked for a replay; planted bad records fail with the FL rule number.
  - Way back: delete the script; `product` triages by hand as FL describes.
- **HV2-B65 Search-the-record helper.** Tier T1.
  - What: `req-precheck.mjs --row <id>` prints every hit for a row id in the card, errata, GAP-LOG, DECISIONS, ADRs and rulings, with file and line.
  - Why: FL "Worth asking" test 1. Class A means the record was hard to find.
  - Size S. Owner `product`. Depends X1.
  - Done when: test on fixture files: a known id returns its hits; an unknown id returns none and exit 1.
  - Way back: delete the script.
- **HV2-B78 Path owner classes (CODEOWNERS-aware routing).** Tier T1.
  - What: a pure function `ownerClass(path)` returns `founder-owned`, `fenced-compliance`, `cco-review` or `agent-owned`, from the OPERATING_MODEL section 8 list, `compliance/FENCE.json` and the non-`*` lines of `.github/CODEOWNERS`.
  - Why: `CODEOWNERS` line 3 gives every path to the founder, so it cannot route alone. A question whose blocker path is founder-owned goes to Karma (class D), not to `product` to edit.
  - Size S. Owner `ops`. Depends none.
  - Done when: test table of 25 paths with expected classes, including `scripts/agents/lib.mjs`, `.github/workflows/ci.yml`, `agents/roster.json`, `compliance/FENCE.json`, `docs/product/prd/02-find.md`.
  - Way back: delete the module.

### Group B: learning loop

- **HV2-B66 Ledger kinds `req-question` and `req-closure`.** Tier T1.
  - What: `ledger.mjs` emits both kinds with row id, class, asker handle, lens, opened and closed times. No title and no body: the existing handoff event copies the title (`ledger.mjs` line 41) and a requirements title could hold content (Karma MF-7).
  - Why: FL section 6 and P5: the retro counts from the ledger, not from memory.
  - Size S. Owner `decision-science`. Depends B61, B64.
  - Done when: ledger test with fixture comments; a test asserts the new events have no `title` or `body` key.
  - Way back: remove the kinds.
- **HV2-B67 Metrics script `req-metrics.mjs`.** Tier T1.
  - What: read-only. Prints FL section 6 metrics (closure time by class, repeat rate, errata rate per card, share closed by A or B, founder asks per week, rework, lens lateness) and a `--digest-line`.
  - Why: founder goal of a measured feedback loop. FL says take a four-week baseline before targets.
  - Size M. Owner `decision-science`. Depends B66.
  - Done when: fixture ledger gives known numbers; empty ledger prints zeros and no crash; the output contains ids, handles, classes and counts only (a test fails on any free-text field).
  - Way back: delete the script.
- **HV2-B68 Retro skeleton `req-retro.mjs`.** Tier T1.
  - What: writes a dated `LESSONS-<date>.md` skeleton with the metrics, the repeats, and one blank "proposed rule" block per repeat. Each block must say `Founder-only check: none` or `E`. Retro output is a proposal; Karma reviews before it is a rule (FL section 6). No targets until four weeks of baseline exist.
  - Why: FL section 6: repeats become a card sentence, a default or a do-not-ask line.
  - Size S. Owner `product`. Depends B67.
  - Done when: test: fixture ledger produces the skeleton; a block with no founder-only line fails the check.
  - Way back: delete the script; write the retro by hand.
- **HV2-B69 Digest field.** Tier T1.
  - What: the digest brief in `brief.mjs` tells `chief-of-staff` to print `Requirements feedback: <n> opened, <n> closed (A, B, C, D), <n> waiting on you; oldest <id> default <x> on <date>` from `req-metrics --digest-line`: ids and counts only, no question text.
  - Why: FL section 7, P6. The founder reads one line a day, class E only.
  - Size S. Owner `chief-of-staff`. Depends B67.
  - Done when: `brief` test for digest mode contains the line template; a fixture with no questions prints "0 opened".
  - Way back: remove the field.

### Group C: detect, flag and route (the self-healing set)

Nothing in this group repairs anything on its own. Each check finds a problem, says what and why, and tells the owner by `fyi` handoff or the weekly retro. A person or the owning agent fixes it. No check edits a file another owner holds (Karma MF-9).

- **HV2-B70 Harness doctor skeleton and the stale or blocked row detector.** Tier T1.
  - What: `harness-doctor.mjs` with a plug-in list of checks; first check reads harness backlog rows (this file, #551, #815) and `docs/BACKLOG.md`: rows `blocked` longer than a threshold, rows whose `Depends` names a blocked, cut or missing row.
  - Why: founder goal of a self-healing harness. Flags go to stdout and to the weekly retro; the owner learns by handoff `fyi`.
  - Size M. Owner `qa`. Depends none.
  - Done when: test on a fixture backlog with one stale row, one dependency on a blocked row and one on a missing id; each is named with the reason; a clean fixture prints nothing and exits 0.
  - Way back: delete the script.
- **HV2-B71 Unparseable id detector.** Tier T1.
  - What: a doctor check that lists backlog headings and `Depends` tokens the dispatcher's own parser drops (five digits, lower case, `HV2-B` ids outside the file the dispatcher reads).
  - Why: `BL-1000` was silently never queued until #912.
  - Size S. Owner `qa`. Depends B70, X2.
  - Done when: test: `BL-1000`, `BL-10000` and `bl-12` in a fixture give the right verdicts under the #912 parser.
  - Way back: delete the check.
- **HV2-B72 Cap deadlock and stale-draft triage queue.** Tier T1.
  - What: `merge-queue.mjs --triage` lists every open PR, drafts included, with age, labels, conflict state, counted review at the head, a supersession hint (a newer open or merged PR with the same files) and a suggested class: CLOSE-SUPERSEDED, REBASE, READY-FOR-FOUNDER, WAIT. It prints the team-limit line: "would idle on team limit: <n> agent PRs open, cap <cap>".
  - Why: X3. With 82 agent-labelled PRs against a cap of 10 the lane could never take a new task. It only prints. Karma may close stale or superseded PRs with the reason posted and the branch kept (CTO skill section 2, CR-33); closing is a separate act. It extends `merge-queue.mjs` on `develop` and does not wait on `HV2-B08` in #551 (a different file). It pages and caches: 185 PRs.
  - Size M. Owner `ops`. Depends none.
  - Done when: test on a fixture of 12 PRs covers each suggested class; it makes only GET calls (the existing test style in `merge-queue.test.mjs`).
  - Way back: remove the flag.
- **HV2-B73 Status header and superseded-file lint.** Tier T1.
  - What: every file in `docs/product/prd/` has a `Status:` header; a file marked SUPERSEDED is not named as loadable in `LOAD-ORDER.md`, `OPERATING_MODEL.md`, a charter or a brief.
  - Why: FL "Keeping context small"; P7.
  - Size S. Owner `qa`. Depends X1.
  - Done when: test with a planted headerless file and a planted loadable-but-superseded reference; both fail.
  - Way back: delete the check.
- **HV2-B74 Errata plan-delta lint.** Tier T1.
  - What: every errata row from E33 ends with `Plan delta:`; every id cited in the row exists; a reply to a requirements handoff carries a `plan:` line.
  - Why: FL section 5 rule 1 and 3; the engineering lane is told the day a statement changes.
  - Size S. Owner `qa`. Depends X1.
  - Done when: test: E33 fixture without the line fails; E1 to E32 are not checked.
  - Way back: delete the check.
- **HV2-B75 Agent memory drift detector.** Tier T1.
  - What: a doctor check over `agents/<handle>/MEMORY.md`: backticked paths that do not exist on `develop`, cited ids now marked SUPERSEDED, length over 120 lines (`check.mjs` already warns on length), a missing FL pointer once B84 lands (reported to the owner, not edited). It sends one `fyi` handoff to the owning agent; no agent edits another's memory.
  - Why: OPERATING_MODEL section 3 and 8; HARNESS section 8 says the red team reports drifted memory by hand.
  - Size M. Owner `ai-eng-lead`. Depends B70, X1.
  - Done when: test on a fixture memory with one dead path and one superseded id.
  - Way back: delete the check.

### Group D: fan-out, pointers and charters

- **HV2-B76 Lens fan-out helper. CUT.** `handoff.mjs open --to design-systems,privacy,security,qa,principal-architect --kind request` already opens one handoff each recipient answers once (AGENT-COMMS section 2). Lens lateness is a metric in B67. Karma SF-1.
- **HV2-B77 Founder-queue batching check. DEFERRED.** Karma checks the queue by hand and class E volume is unmeasured (gold-plating, CTO skill section 13). Revisit when eight class E items reach the queue in one week. Karma SF-2.
- **HV2-B79 Pointer pass over every charter and memory file. CUT.** 52 edits in founder-owned paths, 52 copies of one line, and an agent may not edit another's charter or memory. Replaced by B84 and B85. Karma MF-1.
- **HV2-B84 One pointer in the operating model.** Tier T2.
  - What: a new `OPERATING_MODEL.md` section "Requirements questions", under 8 lines: use the FL quick reference, search the record before asking, tag a question with the marker, your `LOAD-ORDER.md` row is your reading cap. It cites FL by section name and copies nothing.
  - Why: the founder wants every agent to load the loop. Every agent already reads `OPERATING_MODEL.md` on every run, so one home reaches all 26 (skill section 12.2).
  - Size S. Owner `ai-eng-lead`. Depends X1.
  - Done when: a test (in `check.mjs` or a new docs test) fails if the section or its FL and LOAD-ORDER references are missing, and fails on current `develop`.
  - Way back: revert the section.
- **HV2-B85 Brief pointer and LOAD-ORDER coverage test.** Tier T2.
  - What: `brief.mjs` adds one line to every brief naming the FL quick reference and the agent's LOAD-ORDER role, with the FL quick reference as the default. A test lists roster handles with no LOAD-ORDER row. At `40c6eb4a` that is 10 of 26: `red-team`, `payments`, `principal-architect`, `data-steward`, `security-architect`, `compliance-engineer`, `ai-eng-lead`, `decision-science`, `chief-of-staff`, `regulatory-affairs`. The fix to `LOAD-ORDER.md` is `product`'s, by handoff; this row does not edit it.
  - Why: a pointer to "your row" must not point at nothing (Karma SF-6).
  - Size S. Owner `ai-eng-lead`. Depends B84, X1.
  - Done when: `brief` test shows the line for all 26 handles and the line cap holds; the coverage test prints the 10 handles and exits 1 until `LOAD-ORDER.md` has rows or a stated default for them. Fails on current `develop`.
  - Way back: remove the line.
- **HV2-B86 Shared family-data canary module.** Tier T2.
  - What: move the hashed-name list out of `packages/content/test/no-real-family-data.test.ts` into one module the test and `handoff.mjs` both import; the handoff intake then scans bodies. The move changes no digest.
  - Why: Karma MF-3. Handoff bodies are issues, not tracked files, so the repo test never sees them. One list, not two.
  - Size S. Owner `privacy`. Depends B63. Needs the CPrivO lens before merge.
  - Done when: the content test passes unchanged; an equal-output test shows both users read the same digests; a planted canary token in a handoff body fails. No real value appears in the diff.
  - Way back: revert; the test keeps its own list.
- **HV2-B87 Weekly retro schedule.** Tier T3 (founder).
  - What: decide whether the weekly retro (B68) runs as an unattended scheduled task. First switch-on of an unattended lane is the founder's (CTO skill section 3). Recommendation: no schedule yet; an interactive session runs `req-retro.mjs` on request until four weeks of baseline exist. Default if no answer: no schedule.
  - Why: Karma MF-8; founder goal of a loop that learns, without spend or accounts moving on silence.
  - Size S. Owner none (founder decision). Depends B68.
  - Done when: a founder answer is recorded in `docs/DECISIONS.md` in his words.
  - Way back: delete the scheduled task.
- **HV2-B80 Charters for the two roles that change.** Tier T2.
  - What: `product` gets triage mode and the weekly retro as standing duties; `chief-of-staff` gets the digest field.
  - Why: FL sections 6 and 7; P8. Retro output is a proposal, and triage adds no write right `product` lacks today.
  - Size S. Owner `ai-eng-lead`. Depends B62, B68, B69.
  - Done when: `check.mjs` and `prompt-lint` tests pass; each duty names its script; a test fails if the charter says the retro may change a card without Karma review.
  - Way back: revert the PR.
- **HV2-B82 Requirements lint workflow proposal.** Tier T2.
  - What: `docs/ops/proposed/req-lint.yml` runs B73 and B74 on a PR that touches `docs/product/prd/**` (`paths:` filter). Trigger `pull_request`, never `pull_request_target`; `permissions: contents: read`; no secrets; every action pinned to a sha. Advisory first. Making it a required check is a branch-protection setting and the founder's (T3 part).
  - Why: founder goal that requirements work like CI/CD.
  - Size S. Owner `ops`. Depends B73, B74.
  - Done when: a grep test over the proposal fails on `pull_request_target`, on a missing `permissions`, and on an unpinned action; fails on a planted bad copy.
  - Way back: the founder does not apply it.
- **HV2-B83 CTO skill section 10b.** Tier T1.
  - What: Karma adds three lines to `.claude/skills/early-letters-cto/SKILL.md` pointing at FL section 3 (triage order and worth-asking tests).
  - Why: P10; one rule, one home. The skill also has a synced copy outside the repo; a repo edit does not change it, so the founder or Karma refreshes that copy (Karma SF-7).
  - Size S. Owner `ai-eng-lead` drafts, Karma decides. Depends X1.
  - Done when: a test or a grep check shows FL section 3 is cited, not copied.
  - Way back: remove the section.

## 6. Counts, second pass

Ids B61 to B87; B81 is unused. Cut or deferred: B76, B77, B79. Active rows 23.
- T1 (15): B63, B64, B65, B66, B67, B68, B69, B70, B71, B72, B73, B74, B75, B78, B83.
- T2 (7): B61, B62, B80, B82, B84, B85, B86.
- T3 (1): B87.
- Needing the founder beyond a merge: B87 (the schedule), the required-check part of B82, and the label definition in B61 (created only when he runs `bootstrap` or switches the lane on).
- Every row that touches `scripts/agents/**`, `.github/**`, `.claude/**`, `agents/**` or `docs/agents/**` is a draft PR the founder merges. No row spends money or touches an account or secret.

## 6a. New operating style, once the rows merge

Until they merge, nothing changes for agents except what FL describes by hand. After: ask in the marker or a handoff with the five fields; search the record first (B65); expect `product` to triage in one run; lenses answer in parallel; only class E reaches the founder, once a day; the harness flags stale rows, dead ids and drifted memory to the owner, and fixes none of them itself.

## 7. Founder words (placeholder)

His own words for the 20 Nov harness directive, to be pasted by him: _pending_.

## 8. What I did not verify

- Review record: `REVIEW-FEEDBACK-LOOP-KARMA-20nov.md`. It is a role review of method (CR-32).
- The founder's wording above is a relay. `AGENTS_ENABLED` and the live state of branch protection were not read. I ran none of the scripts named here. Sizes are guesses.
