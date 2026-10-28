# Stale PR classifier (RB-18)

Gap: open PRs go quiet and nobody decides. This adds a classifier that only reads and reports.

What it does (scripts/agents/stale.mjs, tests in stale.test.mjs):
- Input: the open-PR list from the REST API (`created_at`, `updated_at`, `draft`, `labels`, `user`, `base`, `head`).
- Output: a plan (one row per PR) and a markdown table. It never calls GitHub and never labels, comments, closes or deletes anything. Every action reads "would ...". A close candidate keeps its branch.
- Run: `gh api "repos/OWNER/REPO/pulls?state=open&per_page=100" --paginate > prs.json`, then `node scripts/agents/stale.mjs prs.json --held 109,110,112`.

Proposed thresholds (days since `updated_at`, whole days):

| Days quiet | State | Dry-run action |
|---|---|---|
| 14 | stale | would add label `stale` |
| 21 | decision-needed | would ask for a keep-or-close decision |
| 30 | close-candidate | would propose closing, branch kept |

**These 14/21/30 thresholds are a proposal for the founder to confirm. They are not a decided policy.** Nothing should act on the plan until the founder decides.

Exempt, in this order: the held list passed in (#109, #110, #112 today); labels `needs:founder` or `hold`; stacked PRs (base branch is the head branch of another open PR) until that PR leaves the open list. Drafts are classified by age like any other PR and flagged in the table; whether drafts should get longer is a founder question.

## Measured on 28 Oct 2026 (12:00 UTC, read-only, 36 open PRs)

Result: ok 27, exempt 9, stale 0, decision-needed 0, close-candidate 0.
Exempt: #109, #110, #112 (held list); #40, #41, #53 (needs:founder); #51 (stacked on #32); #167, #168 (stacked on #164).

Finding: this result says little. Every open PR has `updated_at` on 28 Oct (04:03 to 05:39 UTC), including PRs created on 3 Oct. Something touched all of them in one sweep at about 05:32 UTC. Any update, including a bot comment, label or base move, resets the clock, so `updated_at` cannot show real quiet time here. If the sweep repeats, the classifier will never fire.

For reference only (not the classifier's output), age since `created_at` on the same date:
- under 14 days: 19 PRs (#136, #161, #163, #164, #167, #168, #239 and 12 opened on 28 Oct)
- 14 to 20 days: #105, #109, #110, #112
- 21 to 29 days: #26, #30, #32, #35, #37, #40, #41, #51, #53, #87, #88, #89, #90
- 30 days or more: none

Founder decision needed: should quiet time be measured from the last human or agent commit or review, instead of `updated_at`? Switching needs a second API call per PR (commits or reviews), which the current pure classifier does not do.
