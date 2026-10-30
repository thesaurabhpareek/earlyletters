# Brief (e): sync conflict note, build it or descope and tell testers

Status: open, not decided. Needed by Fri 30 Oct to build it before the proposed freeze (Tue 3 Nov, 5:00 AM PT); by Thu 5 Nov to descope it, so the tester notice can say so before build 2 goes out.
Default if unanswered: build 2 ships with conflict copies kept on the phone and in the export, never shown on screen, and testers are not told. That falls short of D-111 item 10, which says the author can pick.
Owner of the work either way: the build thread (retro section 5.6).

## Question
When one author's two phones disagree about a letter's words, should build 2 show a note that lets the author choose, or ship without it and tell testers?

## Evidence
- D-111 item 10 ([DECISIONS.md:746](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/DECISIONS.md#L746)): the second phone's words become a conflict copy "the author can pick, so no words are lost".
- The store API exists: `listConflicts` ([store.ts:581](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/apps/mobile/src/lib/store.ts#L581)) and `resolveConflict`. Outside the store and tests, the only caller is the export ([export/device.ts:121](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/apps/mobile/src/lib/export/device.ts#L121)). No screen calls either function (grep of `apps/mobile/src`, 28 Oct).
- Handoffs [#155](https://github.com/thesaurabhpareek/earlyletters/issues/155) (the note on the letter view) and [#156](https://github.com/thesaurabhpareek/earlyletters/issues/156) (its strings) are open since 15 Oct with 0 comments. No open PR touches a conflict screen (open PR file lists, 28 Oct).
- Build 2 uses the `preview` profile with server features on ([eas.json:47](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/apps/mobile/eas.json#L47)), so sync and conflicts are live there.
- How often two phones of one author will conflict in a family alpha is unverified.

## Options
| Option | What it changes | Cost or risk |
|---|---|---|
| 1. Build the note for build 2 | Letter-view note, strings from content, a test; one PR on the release path | Build thread time in the last working days before the freeze; a new screen with little review time |
| 2. Descope for the alpha and tell testers | Tester notice line: the other version is kept on the phone and in Export, not shown yet; suggest one phone per author in the alpha; build the note for the next build | A tester may not see words from the second phone without opening Export. No words are lost |
| 3. Leave as is (the default) | Nothing | Testers meet a gap nobody told them about; the record promises a choice the app does not offer |

## Recommendation (a recommendation, not a decision)
Option 2 for build 2, and option 1 for the build after the alpha. It keeps the release path clear in freeze week and keeps testers told the truth.
