# Brief (g): record coordinator task #53 as a D-id

Status: open, not decided. Needed by Thu 5 Nov (proposed go/no-go), because go/no-go row B2-7 rests on this rule.
Default if unanswered: the rule lives only in the F14 spec, the delivery plan, the board and the go/no-go. `docs/DECISIONS.md` does not mention it.
Note: "task #53" is a coordinator task number. It is not GitHub #53, which is the counsel question pack PR.

## Question
The free-letter counting rule (M17) has changed three times: D-083, D-103, then task #53. Should task #53 get its own D-id, a note under D-103, or stay where it is?

## Evidence
- The rule, decided by the coordinator on Tue 27 Oct: on the letter page, Save words and Read it back count nothing and show no Plus sheet; they open Review for that letter, whose Keep step asks the gate and counts ([F14-plus.md:557](../../prd/v2/features/F14-plus.md#L557)). Typed words are stored at once as the letter's words, so past the free allowance they show whether or not the person keeps the letter (same line).
- Built and merged: [#296](https://github.com/thesaurabhpareek/earlyletters/pull/296), merged 28 Oct 01:54 UTC (Tue 27 Oct 6:54 PM PT), commit `c4b762a4`.
- Recorded in [F14-plus.md:424](../../prd/v2/features/F14-plus.md#L424), [08-delivery.md:1072](../../prd/v2/08-delivery.md#L1072) and [BOARD.md:81](../../agents/BOARD.md#L81). Go/no-go B2-7 says it is "not yet in DECISIONS.md or F14-plus.md" ([ALPHA_GO_NO_GO.md:49](../../qa/ALPHA_GO_NO_GO.md#L49)); F14 now has it, `DECISIONS.md` still does not (grep, 28 Oct).
- D-103 ([DECISIONS.md:663](../../DECISIONS.md#L663), founder, 13 Oct): a letter counts only when you keep it from Review with its words on screen. Task #53 routes the later-words path through Review, so it applies D-103 rather than reversing it.

## Options
| Option | What it changes | Cost or risk |
|---|---|---|
| 1. New coordinator D-id, citing #296 and D-103 | One entry through the merge train | About 10 minutes. None |
| 2. A dated note under D-103 | One note line | About 5 minutes. Slightly harder to find than its own id |
| 3. Leave it (the default) | Nothing | A billing rule is not traceable from the decision log; go/no-go B2-7 keeps citing an unrecorded decision |

## Recommendation (a recommendation, not a decision)
Option 1. The founder's part is to say whether the coordinator may record it, and to flag it if the "words show past the allowance" behaviour is not wanted.
