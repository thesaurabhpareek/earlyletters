# Harness backlog: the requirements feedback loop, HV2-B61 onward (first pass)

Status: DRAFT, first pass before the Karma review | Owner: `product` for Karma | Replaces: none | Written 20 Nov 2026 (UTC) by a Claude session in the product seat. Load when: you own a harness row, or you review one. Nothing here changes a script, a workflow, a roster entry, a charter or a ruling. Every row is a proposal until the founder merges the PR that builds it.

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

Row fields: What, Why, Size (S under a day, M one to three days; one PR), Owner (handle in `agents/roster.json`), Depends, Done when (with the test), Way back.

### Group A: intake and triage

- **HV2-B61 Label `req-question` and the comment marker.** Tier T2.
  - What: `lib.mjs` reads a first-line marker `<!-- req-question:<row id> -->` from a trusted comment; `bootstrap.mjs` lists a label `req-question`.
  - Why: FL section 2 and P2. Today a review comment is read only if the author also opens a handoff. The founder wants product reactive to engineering.
  - Size S. Owner `ops`. Depends none.
  - Done when: `lib.test.mjs` shows the marker counts only as first text of a trusted comment, never when quoted or posted by an untrusted author (AGENT-COMMS section 5); `bootstrap` dry run lists the label.
  - Way back: delete the parse function and the label entry.
- **HV2-B62 Dispatcher: product triage mode.** Tier T2.
  - What: a trusted `req-question` comment gives `product` a `triage` assignment ahead of backlog tasks and after `maintain` and `handoff`. Questions raised by engineering lenses sort first.
  - Why: FL section 4 and P2; AGENT-COMMS section 7 already puts handoffs before tasks.
  - Size M. Owner `principal-architect`. Depends B61, X2, B78.
  - Done when: `dispatch` test with a fixture: the comment schedules `triage`; an untrusted marker does nothing; a closed or answered question does not schedule it again; triage runs while the team limit is reached.
  - Way back: delete the rule; comments are read at the next `product` run as before.
- **HV2-B63 Handoff intake check.** Tier T1.
  - What: `handoff.mjs open --kind question --req-row <id>` refuses a body missing any of the five FL fields (row id, what is unclear, evidence, what it blocks, proposed answer) or over 30 lines, and scans the body with the same hashed real-family check the content test uses.
  - Why: FL section 2; P1. Questions arrive complete.
  - Size S. Owner `ops`. Depends none.
  - Done when: `handoff` test: five-field body passes; each missing field fails by name; a body with a planted canary token fails.
  - Way back: remove the flag; `question` still works.
- **HV2-B64 Triage checker `triage-lint.mjs`.** Tier T1.
  - What: reads a triage record in a reply (`Class: A|B1|B2|C|D|E|F`, `Cites:`, `Plan:`) and checks it against FL section 3: class A cites an id that resolves in the card, errata, closures, D, ADR or CR files; B2 comes with a new E row; E carries a default, a deadline and a `Checked:` line; C names its lenses; D names the owner by the COUNCIL section 4 table; F names a check. It flags a reply whose class skips an earlier class that matches (a founder-only keyword and a class other than E or a split).
  - Why: founder goal of a deterministic, replayable triage; FL section 3 says the rule is "a decision rule an agent can run".
  - Size M. Owner `qa`. Depends X1, B78.
  - Done when: a test replays E1 to E32 and the closures CL-001 to CL-113 and fixes the class each lands in (FL section 9 asked for this replay); planted wrong records fail with the rule number.
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
  - What: `ledger.mjs` emits both kinds with row id, class, asker, lens, opened and closed times. No question text.
  - Why: FL section 6 and P5: the retro counts from the ledger, not from memory.
  - Size S. Owner `ops`. Depends B61, B64.
  - Done when: ledger test with fixture comments; output has no body text field.
  - Way back: remove the kinds.
- **HV2-B67 Metrics script `req-metrics.mjs`.** Tier T1.
  - What: read-only. Prints FL section 6 metrics (closure time by class, repeat rate, errata rate per card, share closed by A or B, founder asks per week, rework, lens lateness) and a `--digest-line`.
  - Why: founder goal of a measured feedback loop. FL says take a four-week baseline before targets.
  - Size M. Owner `decision-science`. Depends B66.
  - Done when: fixture ledger gives known numbers; empty ledger prints zeros and no crash; the output contains ids and counts only.
  - Way back: delete the script.
- **HV2-B68 Weekly retro skeleton `req-retro.mjs`.** Tier T1.
  - What: writes a dated `LESSONS-<date>.md` skeleton with the metrics, the repeats, and one blank "proposed rule" block per repeat. Each block must say `Founder-only check: none` or `E`.
  - Why: FL section 6: repeats become a rule in the card, a default or the do-not-ask list, and Karma reviews before it is a rule.
  - Size S. Owner `product`. Depends B67.
  - Done when: test: fixture ledger produces the skeleton; a block with no founder-only line fails the check.
  - Way back: delete the script; write the retro by hand.
- **HV2-B69 Digest field.** Tier T1.
  - What: the digest brief in `brief.mjs` tells `chief-of-staff` to print `Requirements feedback: <n> opened, <n> closed (A, B, C, D), <n> waiting on you; oldest <id> default <x> on <date>` from `req-metrics --digest-line`.
  - Why: FL section 7, P6. The founder reads one line a day, class E only.
  - Size S. Owner `chief-of-staff`. Depends B67.
  - Done when: `brief` test for digest mode contains the line template; a fixture with no questions prints "0 opened".
  - Way back: remove the field.
- **HV2-B77 Founder-queue batching check.** Tier T1.
  - What: a lint over class E items before they enter `docs/release/FOUNDER_QUEUE.md` or the digest: a `Checked:` line (RS-04), a default, a deadline, at most 4 per batch.
  - Why: FL section 7, P9.
  - Size S. Owner `chief-of-staff`. Depends B64.
  - Done when: test: an ask without `Checked:` fails; a fifth item in a batch fails.
  - Way back: delete the lint.

### Group C: self-healing (detect, flag, route; nothing edits another owner's file)

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
  - Why: X3. With 82 agent-labelled PRs against a cap of 10 the lane could never take a new task. Karma may close stale or superseded PRs with the reason posted and the branch kept (CTO skill section 2); this gives the list.
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
  - What: a doctor check over `agents/<handle>/MEMORY.md`: backticked paths that do not exist on `develop`, cited ids now marked SUPERSEDED, length over 120 lines (`check.mjs` already warns on length), a missing FL pointer once B79 or its replacement lands. It sends one `fyi` handoff to the owning agent; no agent edits another's memory.
  - Why: OPERATING_MODEL section 3 and 8; HARNESS section 8 says the red team reports drifted memory by hand.
  - Size M. Owner `ai-eng-lead`. Depends B70, X1.
  - Done when: test on a fixture memory with one dead path and one superseded id.
  - Way back: delete the check.

### Group D: fan-out, pointers and charters

- **HV2-B76 Lens fan-out helper.** Tier T1.
  - What: `req-fanout.mjs --issue <n> --lenses design,policy,security,qa,engineering` opens one handoff per lens and marks a lens late after its target.
  - Why: FL section 4 and P4; parallel by default.
  - Size M. Owner `ops`. Depends B63.
  - Done when: test with a dry run printing five handoff bodies.
  - Way back: delete the script.
- **HV2-B79 Pointer pass over every charter and memory file.** Tier T2.
  - What: add one line to each of the 26 `.claude/agents/<handle>.md` "You read first" and each of the 26 `agents/<handle>/MEMORY.md`: load the FL quick reference and your `LOAD-ORDER.md` role row.
  - Why: the founder asked that every agent loads them.
  - Size M. Owner `ai-eng-lead`. Depends X1.
  - Done when: `check.mjs` test fails any charter or memory without the line.
  - Way back: revert the PR.
- **HV2-B80 Charters for the two roles that change.** Tier T2.
  - What: `product` gets triage mode and the weekly retro as standing duties; `chief-of-staff` gets the digest field.
  - Why: FL sections 6 and 7; P8.
  - Size S. Owner `ai-eng-lead`. Depends B62, B68, B69.
  - Done when: `check.mjs` and `prompt-lint` tests pass; each duty names its script.
  - Way back: revert the PR.
- **HV2-B82 Requirements lint workflow proposal.** Tier T2.
  - What: `docs/ops/proposed/req-lint.yml` runs B73 and B74 on a PR that touches `docs/product/prd/**`. Advisory first. No required-check change.
  - Why: founder goal that requirements work like CI/CD.
  - Size S. Owner `ops`. Depends B73, B74.
  - Done when: the file passes the repo's workflow lint (`HV2-B11` if landed; otherwise a read-through) and pins every action to a sha.
  - Way back: the founder does not apply it.
- **HV2-B83 CTO skill section 10b.** Tier T1.
  - What: Karma adds three lines to `.claude/skills/early-letters-cto/SKILL.md` pointing at FL section 3 (triage order and worth-asking tests).
  - Why: P10; one rule, one home.
  - Size S. Owner `ai-eng-lead` drafts, Karma decides. Depends X1.
  - Done when: a test or a grep check shows FL section 3 is cited, not copied.
  - Way back: remove the section.

## 6. Counts, first pass

22 rows (B61 to B80, B82, B83; B81 is not used). T1: 17 (B63 to B78 except none of T2, plus B83). T2: 5 (B61, B62, B79, B80, B82). Needing the founder beyond a merge: none named yet.

## 7. Founder words (placeholder)

His own words for the 20 Nov harness directive, to be pasted by him: _pending_.

## 8. What I did not verify

- The founder's wording above is a relay. `AGENTS_ENABLED` and the live state of branch protection were not read. I ran none of the scripts named here. Sizes are guesses.
