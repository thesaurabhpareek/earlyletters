# Scope control and review drift

Owner: `chief-of-staff`. Code: `scripts/agents/pause.mjs`, tests in `scripts/agents/pause.test.mjs`.

Ownership (28 Oct 2026): `scripts/agents/**` is owned by the founder (`.github/CODEOWNERS:31`); any role named in this note is the role it was written as, which has not run on its own (`docs/agents/HARNESS.md`, "What actually runs").

## Gap 1: the scope was too wide

Writing agents produced launch plans, metric trees and help articles that nobody merged. They went stale while `develop` moved, and each one used a run and a review. The repo is in alpha stabilisation: the build 2 freeze planned for Tue 27 Oct was not applied, and on 30 Oct the founder confirmed a freeze on Tue 3 Nov and a go/no-go on Mon 9 Nov (D-130; the go/no-go had been proposed as Thu 5 Nov, `docs/release/AUTOMATION.md` section 6). New writing work has no reader before the go/no-go.

**Rule.** An agent entry in `agents/roster.json` may carry `paused_until: "YYYY-MM-DD"` and a short `paused_reason`. While the current time is before 00:00 UTC on that date, the dispatcher gives the agent no `task` and no `standing` work. It still gets `maintain`, `review`, `handoff`, `steward-review` and `digest` work, so a paused agent fixes its open PRs and answers other agents. The board row says `idle: paused until <date> (<reason>)`.

**Paused now, until 2026-10-30:** `marketing`, `decision-science`, `support`, `legal`. The pause lapses on its own at 00:00 UTC on 30 Oct (Thu 29 Oct, 5:00 PM PT); nobody has to remember to lift it. To end it early, delete the two fields. To extend it, change the date. The date was set on 18 Oct against the 27 Oct freeze, so the writers resume before the 3 Nov freeze. If the intent is no new writing until the alpha is decided, the roster edit is `2026-11-10` (the day after the go/no-go on Mon 9 Nov, D-130; it was `2026-11-06` against the proposed Thu 5 Nov); that edit is the founder's to make and this note does not make it.

**Dates, for the record.** Two different things carry dates here. This module's pause is the planned writer pause: `paused_until` in the roster, 2026-10-30 today, a calendar date the founder can move. The session halt of Sat 24 Oct, 5:10 AM PT to Tue 27 Oct, 1:00 PM PT is not recorded by this module and nothing here depends on it. A halt of that length is the case the lane flag is for: a lane that stops writing the board reads "quiet since" after 8 hours (`scripts/agents/lane.mjs`, `lanes-and-review-churn.md`).

**Exceptions.** A founder-forced run (`FORCE_TASK` with `ONLY_AGENT` naming the agent) is not blocked: the founder asking for it directly is the override. A malformed date (anything but `YYYY-MM-DD`) means no pause, so a typo never silently idles an agent; `check.mjs` rejects such a date (the "agent team consistent" check on every PR), and `pause.test.mjs` checks the live roster's dates as well.

**The trade-off, stated plainly.** The founder asked earlier for "no agent idle". This pause idles four writers on purpose from 18 Oct to 30 Oct. The cost is real: no new marketing, metric, help or legal drafts until then, and their daily runs go unused unless they have a PR to fix or a handoff to answer. The bet is that drafts written during a freeze would be stale by launch and would spend review attention the alpha needs. If the founder wants a specific draft sooner, a forced run still works. Legal is paused for new drafts only; open handoffs such as #216 still reach it.

## Gap 2: labels drift after fixes

PR #41 still carries `review:changes-needed` after its author fixed every finding, because the red team had not yet reviewed the new head. The label describes an older commit, and nothing on the board said so.

**Rule.** The board gets an "Awaiting re-review" section. It lists open agent PRs (`agentOfPR` truthy) that have no red-team review of the current head (`prFacts(pr).redTeam` is false) but do have a trusted red-team review of an older head. Each row shows the older head, its verdict, the current head and the `review:*` labels the PR carries right now.

**Same changes as a reviewed head.** A PR whose current head is recorded in `state.reviewfp[<pr>].carried` (`scripts/agents/reviewfp.mjs`: a develop merge kept the PR's own diff, so the red team is not re-assigned) is left out of this section; otherwise it would wait for a re-review the dispatcher never assigns. That holds only while the review it inherits still counts (a trusted red-team review of the recorded head); if that review is removed or stops being trusted, the head is listed here again. The board's "Same changes as a reviewed head" section lists it instead, with both heads and the review it inherits. That line is a fingerprint match, not a review of the new head: the merge rule reads two independent passing reviews on the current head and green CI (D-117, COORDINATION.md section 6, which is also the practice under D-107). `dispatch.mjs` runs the fingerprint section before this one, so the record exists when this module reads it.

**Labels are information, not actions.** This module never changes labels. A stale label is shown as it stands until the red team reviews the new head. Agents never relabel other agents' PRs.

**API budget.** One `GET /pulls/<n>/reviews` call per PR per head, cached in board state as `state.drift[<pr>] = { head, prior }`, including negative results. A head that has not moved costs nothing on later ticks. At most 8 uncached lookups per tick; the rest are named as deferred and checked next tick. Entries for closed PRs are pruned each tick. A carried head costs no reviews call.

## What was verified and what was assumed

- Verified with `gh api` on 18 Oct: red-team verdicts on #41 are PR reviews (not issue comments) whose body starts with `<!-- red-team:<sha> -->`, posted by the owner account, on heads c5cfa0c and d51815f; the current head is a83634c. So one reviews call finds them.
- Verified: `loadRoster` keeps unknown agent fields, and `check.mjs` passes with them.
- Assumed: red-team reviews from the agents app are recognised once `AGENTS_BOT_LOGINS` is set (the same trust rule `prFacts` uses).
- Known gap, outside this module: when an agent has no free slot, `dispatch.mjs` prints `ready: <next work>` without asking the pause hook, so a paused agent can show `ready: task X` on the board. It is never assigned that task. Fixing the label needs a one-line change in `dispatch.mjs`.
