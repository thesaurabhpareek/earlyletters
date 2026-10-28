# Brief (d): analytics in v1.0

Status: open, not decided. Needed by Thu 5 Nov (proposed go/no-go), because the privacy label and the counsel packet need one answer.
Default if unanswered: analytics stays off in every build, because the code already says so. The decision record stays ambiguous, and analytics tasks keep being offered to agents.
Scope: the mobile app only. The website analytics PR #309 is covered by another memo.

## Question
Is in-app analytics off for v1.0, or on with consent?

## Evidence
- D-095 ([DECISIONS.md:590](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/DECISIONS.md#L590), 15 Oct, delegated by the founder): no analytics SDK or consent sheet in v1.0; analytics returns with consent in v1.1.
- D-100 ([DECISIONS.md:647](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/DECISIONS.md#L647)) says the on-device assumption behind D-095 is superseded "where they conflict". It does not say whether analytics is one of those places.
- `EXPO_PUBLIC_ANALYTICS` is `off` in all five build profiles ([eas.json:19, 36, 50, 64, 78](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/apps/mobile/eas.json#L19)); the app reads it at [capabilities.ts:92](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/apps/mobile/src/lib/capabilities.ts#L92).
- Go/no-go rows B1-1 and B2-15 require analytics off and no analytics host ([ALPHA_GO_NO_GO.md:22](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/qa/ALPHA_GO_NO_GO.md#L22), [:57](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/qa/ALPHA_GO_NO_GO.md#L57)).
- Open PR [#340](https://github.com/thesaurabhpareek/earlyletters/pull/340) (not merged, not decided) proposes D-124, which includes "analytics off for the whole 1.0 line". If recorded, that is option 1 below and this brief is answered.
- The board still offers BL-326 (insights increments) to the analytics agent (retro panel 02; not rechecked here).

## Options
| Option | What it changes | Cost or risk |
|---|---|---|
| 1. Off in the alpha and v1.0; returns with consent in v1.1 (D-095 stands) | One line in the record; analytics tasks paused | No usage data from the alpha; learning comes from tester feedback only |
| 2. Off in the alpha; on with consent in the v1.0 store release | Consent sheet, a PostHog key, privacy label and policy changes through counsel, a tracking plan update | Counsel time and copy work on the release path; more data collected means more to disclose |
| 3. On with consent in build 2 | A profile change in `eas.json` near the freeze, plus all of option 2 | `eas.json` changes are frozen from the freeze to the go/no-go (`AUTOMATION.md` row 17); breaks B2-15; highest risk |

## Recommendation (a recommendation, not a decision)
Option 1: record that D-095 stands under D-100 for v1.0. It matches the code, the go/no-go and the current privacy story, and costs one line.
