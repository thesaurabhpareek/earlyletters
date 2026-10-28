# Brief (b): PR #316, five agents onto Claude Code for the API credit

Status: open, not decided. Needed by Fri 30 Oct, so one working day remains to provision before the credit expires on Tue 3 Nov. Depends on brief (a).
Default if unanswered: #316 stays open. As written it spends nothing, and the credit lapses on 3 Nov.
Conflict of interest: #316 came from the session that built the harness.

## Question
Merge [#316](https://github.com/thesaurabhpareek/earlyletters/pull/316) and provision the lane so the credit is spent, or let the credit go?

## Evidence
- #316 (opened 28 Oct 05:32 UTC, Tue 27 Oct 10:32 PM PT, into `develop`) changes only `agents/roster.json` (22 lines). It moves `data-architect`, `security-architect`, `ops`, `privacy` and `red-team` to the `claude-code` engine.
- Its body: a $200 Claude Console credit expires on 3 Nov; before merging, the founder sets a Console spend limit, adds the `ANTHROPIC_API_KEY` secret and sets `AGENTS_ENABLED=true`; worst case about $88 a day. The amount and expiry come from the PR body and are unverified here.
- The `claude-code` engine runs only inside `agents.yml`, which is not registered because the default branch is `main` (brief (a)). So merging #316 alone starts nothing.
- The body names the work the credit would buy: the `search_path` re-check (#32, #51, #26), reviews of #306 and #110, the #30 rebase and #37.

## Options
| Option | What it changes | Cost or risk |
|---|---|---|
| 1. Close #316 | Nothing runs | Up to $200 of credit unused (amount unverified). No release risk |
| 2. Merge and provision by Mon 2 Nov | Brief (a) option 1 steps plus the three steps in the PR body | About 1 to 2 hours of founder time. An unattended lane runs through the freeze (Tue 3 Nov, 5:00 AM PT) and the go/no-go, posting as the founder. Its reviews come from the same model family as the threads it reviews |
| 3. Spend the credit in supervised sessions | The founder runs and watches named review sessions with the key; no Actions lane | Founder time. Whether the credit applies to that use is unverified |

## Recommendation (a recommendation, not a decision)
Option 1, unless brief (a) chooses to provision. The listed reviews can run in the existing interactive threads; a $200 credit does not justify switching on an unattended lane in freeze week.
