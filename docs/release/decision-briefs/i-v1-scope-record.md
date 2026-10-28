# Brief (i): which record states v1.0 scope

Status: open, not decided. Needed by Thu 5 Nov (proposed go/no-go), because build 2 is the servers-on build and the tester notice and legal pages depend on the answer.
Default if unanswered: D-100 governs on paper. #127 stays open, and any lane that reads it acts on the reversed scope. The production profile stays off.
Conflict of interest: #127 was written by the session that commissioned this brief.

## The four records
| Record | Date | What it says | Where it still acts |
|---|---|---|---|
| Issue [#127](https://github.com/thesaurabhpareek/earlyletters/issues/127) item 1 | 14 Oct | "v1.0 is the on-device release that is already built"; the server scope becomes the next release | Open, 0 comments. The live 4-hourly lane prompt cites it as "Decisions in force" (scheduled-task record, retro spot-check 7; not in the repo) |
| D-100 ([DECISIONS.md:644](../../DECISIONS.md#L644)) | 13 Oct, confirmed 15 Oct | Server features on in v1.0; "the release build profiles set `EXPO_PUBLIC_SERVER_FEATURES=on`"; supersedes the on-device assumption where they conflict. D-101 moves the date (week of 3 May 2027, about 40% confidence) | The decision log of record |
| Alpha go/no-go ([ALPHA_GO_NO_GO.md:1](../../qa/ALPHA_GO_NO_GO.md#L1), [:14](../../qa/ALPHA_GO_NO_GO.md#L14)) | current | Build 1 servers off; build 2 servers on against staging, backup and status report off. Build 2 is no-go today (B2-12) | `preview` profile: server on, backup off ([eas.json:47 to 49](../../../apps/mobile/eas.json#L47)) |
| `production` profile ([eas.json:61](../../../apps/mobile/eas.json#L61)) | last set 14 Oct (`4183844c`) | `EXPO_PUBLIC_SERVER_FEATURES` is `off` | Contradicts D-100's "release build profiles". The store lane has not started ([1.0.0.md:9](../1.0.0.md#L9)) |

Public copy shows the same split: [site.en.ts:83](../../../packages/content/src/site.en.ts#L83) "Your recordings stay on your phone" sits next to [:93](../../../packages/content/src/site.en.ts#L93) "your letters sync to our servers".

## Options
| Option | What it changes | Cost or risk |
|---|---|---|
| A. Confirm D-100 | The coordinator closes #127 pointing at D-100; the lane prompt is replaced (retro R1-04); the build thread sets the `production` profile to `on` when the store lane starts (after the go/no-go, since `eas.json` is frozen); copy is reconciled after counsel (retro IMP-66) | No new cost beyond D-101's plan. Copy stays contradictory until reconciled |
| B. Return to #127: on-device v1.0 | Build 1 becomes the v1.0 basis; build 2 becomes a preview of the next release; D-100 and D-101 are reversed | Reverses the founder's 15 Oct confirmation; legal text written a fourth time; sync and sharing ship later. Whether the store date moves earlier is unverified |
| C. Keep D-100, settle the store scope after the alpha | Alpha runs as the go/no-go says; #127 is closed as superseded anyway; `production` profile and copy wait for a dated decision after the go/no-go | Copy contradictions last through the alpha; the tester notice must say which build a tester has |

## Recommendation (a recommendation, not a decision)
Option A, and close #127 now: it is the only record that contradicts the decision log, and an unattended lane still reads it. The `production` profile and copy changes follow the go/no-go, not before.
