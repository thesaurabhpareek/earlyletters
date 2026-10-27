# Scope control and review drift

Owner: `chief-of-staff`. Code: `scripts/agents/pause.mjs`, tests in `scripts/agents/pause.test.mjs`.

## Gap 1: the scope was too wide

Writing agents produced launch plans, metric trees and help articles that nobody merged. They went stale while `develop` moved, and each one used a run and a review. The repo is in alpha stabilisation until Fri 30 Oct 2026 (build 2 freezes Tue 27 Oct), so new writing work has no reader before then.

**Rule.** An agent entry in `agents/roster.json` may carry `paused_until: "YYYY-MM-DD"` and a short `paused_reason`. While the current time is before 00:00 UTC on that date, the dispatcher gives the agent no `task` and no `standing` work. It still gets `maintain`, `review`, `handoff`, `steward-review` and `digest` work, so a paused agent fixes its open PRs and answers other agents. The board row says `idle: paused until <date> (<reason>)`.

**Paused now, until 2026-10-30:** `marketing`, `decision-science`, `support`, `legal`. On 30 Oct the pause lapses on its own; nobody has to remember to lift it. To end it early, delete the two fields. To extend it, change the date.

**Exceptions.** A founder-forced run (`FORCE_TASK` with `ONLY_AGENT` naming the agent) is not blocked: the founder asking for it directly is the override. A malformed date (anything but `YYYY-MM-DD`) means no pause, so a typo never silently idles an agent; the tests cover this. `check.mjs` does not validate the fields (it ignores unknown fields), so the date format is checked only by `pause.test.mjs` against the live roster.

**The trade-off, stated plainly.** The founder asked earlier for "no agent idle". This pause idles four writers on purpose for twelve days. The cost is real: no new marketing, metric, help or legal drafts until 30 Oct, and their daily runs go unused unless they have a PR to fix or a handoff to answer. The bet is that drafts written during a freeze would be stale by launch and would spend review attention the alpha needs. If the founder wants a specific draft sooner, a forced run still works. Legal is paused for new drafts only; open handoffs such as #216 still reach it.

## Gap 2: labels drift after fixes

PR #41 still carries `review:changes-needed` after its author fixed every finding, because the red team had not yet reviewed the new head. The label describes an older commit, and nothing on the board said so.

**Rule.** The board gets an "Awaiting re-review" section. It lists open agent PRs (`agentOfPR` truthy) that have no red-team review of the current head (`prFacts(pr).redTeam` is false) but do have a trusted red-team review of an older head. Each row shows the older head, its verdict, the current head and the `review:*` labels the PR carries right now.

**Labels are information, not actions.** This module never changes labels. A stale label is shown as it stands until the red team reviews the new head. Agents never relabel other agents' PRs.

**API budget.** One `GET /pulls/<n>/reviews` call per PR per head, cached in board state as `state.drift[<pr>] = { head, prior }`, including negative results. A head that has not moved costs nothing on later ticks. At most 8 uncached lookups per tick; the rest are named as deferred and checked next tick. Entries for closed PRs are pruned each tick.

## What was verified and what was assumed

- Verified with `gh api` on 18 Oct: red-team verdicts on #41 are PR reviews (not issue comments) whose body starts with `<!-- red-team:<sha> -->`, posted by the owner account, on heads c5cfa0c and d51815f; the current head is a83634c. So one reviews call finds them.
- Verified: `loadRoster` keeps unknown agent fields, and `check.mjs` passes with them.
- Assumed: red-team reviews from the agents app are recognised once `AGENTS_BOT_LOGINS` is set (the same trust rule `prFacts` uses).
- Known gap, outside this module: when an agent has no free slot, `dispatch.mjs` prints `ready: <next work>` without asking the pause hook, so a paused agent can show `ready: task X` on the board. It is never assigned that task. Fixing the label needs a one-line change in `dispatch.mjs`, which this team may not edit.
