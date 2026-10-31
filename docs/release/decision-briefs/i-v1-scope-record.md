# Brief (i): which record states v1.0 scope

Status: open, not decided. Needed by Mon 9 Nov (the go/no-go, D-130), because build 2 is the servers-on build and the tester notice and legal pages depend on the answer.
Default if unanswered: D-100 governs on paper. #127 stays open, and any lane re-enabled with a prompt that cites it would act on the reversed scope. The production profile stays off.
Conflict of interest: #127 was written by the session that commissioned this brief.

## The four records
| Record | Date | What it says | Where it still acts |
|---|---|---|---|
| Issue [#127](https://github.com/thesaurabhpareek/earlyletters/issues/127) item 1 | 14 Oct | "v1.0 is the on-device release that is already built"; the server scope becomes the next release | Open, 0 comments. The 4-hourly lane prompt cites it as "Decisions in force" (scheduled-task record, retro spot-check 7; not in the repo). That task was disabled 28 Oct 06:05 UTC (Tue 27 Oct 11:05 PM PT), per the retro reviewer's read of the task list; not rechecked here |
| D-100 ([DECISIONS.md:645](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/DECISIONS.md#L645)) | 13 Oct, confirmed 15 Oct | Server features on in v1.0; "the release build profiles set `EXPO_PUBLIC_SERVER_FEATURES=on`"; supersedes the on-device assumption where they conflict. D-101 moves the date (week of 3 May 2027, about 40% confidence) | The decision log of record |
| Alpha go/no-go ([ALPHA_GO_NO_GO.md:1](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/qa/ALPHA_GO_NO_GO.md#L1), [:14](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/qa/ALPHA_GO_NO_GO.md#L14)) | current | Build 1 servers off; build 2 servers on against staging, backup and status report off. Build 2 is no-go today (B2-12) | `preview` profile: server on, backup off ([eas.json:47 to 49](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/apps/mobile/eas.json#L47)) |
| `production` profile ([eas.json:61](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/apps/mobile/eas.json#L61)) | last set 14 Oct (`4183844c`) | `EXPO_PUBLIC_SERVER_FEATURES` is `off` | Contradicts D-100's "release build profiles". The store lane has not started ([1.0.0.md:9](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/release/1.0.0.md#L9)) |

Public copy is on the on-device side: the live website copy (`apps/web/src/content/site.ts` on `main`, line 73 at `05cf0a37`, checked 28 Oct 13:53 UTC) says "Your letters stay on your phone, in your own words.", which D-100 makes untrue once sign-in and sync ship. The full claim list is in the retro claims inventory (#329).

## Options
| Option | What it changes | Cost or risk |
|---|---|---|
| A. Confirm D-100 | The coordinator closes #127 pointing at D-100; the lane prompt is replaced (retro R1-04); the build thread sets the `production` profile to `on` when the store lane starts (after the go/no-go, since `eas.json` is frozen); copy is reconciled after counsel (retro IMP-66) | No new cost beyond D-101's plan. Copy stays contradictory until reconciled |
| B. Return to #127: on-device v1.0 | Build 1 becomes the v1.0 basis; build 2 becomes a preview of the next release; D-100 and D-101 are reversed | Reverses the founder's 15 Oct confirmation; legal text written a fourth time; sync and sharing ship later. Whether the store date moves earlier is unverified |
| C. Keep D-100, settle the store scope after the alpha | Alpha runs as the go/no-go says; #127 is closed as superseded anyway; `production` profile and copy wait for a dated decision after the go/no-go | Copy contradictions last through the alpha; the tester notice must say which build a tester has |
| D. Staged first store build, as open PR [#340](https://github.com/thesaurabhpareek/earlyletters/pull/340) proposes (D-121; not decided) | The first store binary is on-device only (server, backup, status report and analytics off; Plus on), target submit Tue 1 Dec 2026; full scope ships in later 1.0.x releases behind the existing flags; amends D-100 and D-101 for the first binary only; D-124 would record #127 as superseded | Matches today's `production` profile and live copy for the first binary; the alpha's build 2 still tests servers on. A second scope change in two weeks; legal texts must match each binary |

## Recommendation (a recommendation, not a decision)
Close #127 now under any option: it is the only record that reverses the decision log's scope, and any lane re-enabled with a prompt that cites it would act on it. Between A and D this brief makes no pick: it is a trade between one scope for every binary (A) and an earlier store date with the server scope in later 1.0.x releases (D), and only the founder can weigh that. B and C are not recommended. Under A, the `production` profile and copy changes follow the go/no-go, not before.
