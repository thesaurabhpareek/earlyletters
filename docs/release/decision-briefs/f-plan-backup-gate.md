# Brief (f): `plan.ts` gates backup on Plus, against D-111 item 6

Status: open, not decided. Needed by Thu 5 Nov (proposed go/no-go) to place the fix in the post-alpha queue. Hard deadline: before any build profile turns backup on.
Default if unanswered: the gate stays in code. It is not reached in either alpha build, because backup is off, but it would ship the moment backup is turned on.
Owner of the fix: the build thread (billing path; retro section 5.6).

## Question
Confirm that D-111 item 6 still holds (backup is free, never a Plus feature), so the build thread removes the gate? Or change D-111 item 6?

## Evidence
- D-111 item 6 ([DECISIONS.md:742](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/DECISIONS.md#L742), founder, 17 Oct): "backup is free for everyone in v1.0 and does not gate on Plus, so the backup screen may say so".
- [plan.ts:38](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/packages/core/src/plan.ts#L38) and [:45](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/packages/core/src/plan.ts#L45) list `backup_upload` as a gated feature. [plan.test.ts:80](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/packages/core/test/plan.test.ts#L80) expects a parent in a Free book who taps Turn on backup to get the Plus offer.
- No file in `apps/mobile/src` asks `decide()` about `backup_upload` (grep, 28 Oct).
- `EXPO_PUBLIC_BACKUP` is `off` in all five profiles ([eas.json:17, 34, 48, 62, 76](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/apps/mobile/eas.json#L17)).
- Open PR [#340](https://github.com/thesaurabhpareek/earlyletters/pull/340) (not merged, not decided) proposes D-124, which includes "D-111 item 6 (backup free) stands". If recorded, the founder's part of this brief is answered and option 1 remains for the build thread.

## Options
| Option | What it changes | Cost or risk |
|---|---|---|
| 1. Fix code to match D-111 item 6 | Move `backup_upload` from gated to free-forever; update `plan.test.ts` rows 1 to 7, 9 and 10 (`decide()` throws for a feature that is not gated, [plan.ts:199](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/packages/core/src/plan.ts#L199)) and `family-rules.test.ts:143, 149` | One small PR on the billing path with two reviews. Low risk, since no build reaches it today. Best after the go/no-go to keep the freeze clear |
| 2. Change D-111 item 6: backup becomes Plus | Code stays; the record, backup screen copy and legal text change | Reverses a founder decision of 17 Oct; copy and counsel work; pricing story changes |
| 3. Leave it (the default) | Nothing | The gate ships silently whenever backup turns on, contradicting the record |

## Recommendation (a recommendation, not a decision)
Option 1, scheduled right after the go/no-go and before any profile sets `EXPO_PUBLIC_BACKUP` to `on`. The founder's part is one line: D-111 item 6 stands.
