## Review B at 33924a1633f986498a364dba4b48687363234a01: PASS WITH NOTES

Lens B. PR #793, docs only, head 33924a16 read from gh api (one commit on 865581c1, which I reviewed as CHANGES). Base develop is still 8ae0c03c. The PR changes one file, docs/qa/DEVICE_TEST_PLAN.md, inside S1-191 only (6 insertions, 6 deletions against develop).

**My two must-fix, ruled**
1. (h) Expected now reads "None of the forty draws (twenty on each screen) asks about the name". Fixed: the (h) step is twenty on Tonight plus twenty on Write, and (e) already said "forty".
2. (a) Expected now reads "2 MONTHS" only, with "the date in step (a) makes it exactly this". Fixed, and the claim is true: at 865581c1 I ran every day of 2026 and 2027 through `ageOn`/`ageLabel` with the birth set to the same date two months back (or the month's last day when that date does not exist) and every one reads exactly "2 months". The "2 MONTHS AND 1 WEEK" alternative is gone.

**My two notes taken up, ruled**
- Record now says "the prompt texts seen in (e) (they never carry a child's name)". Correct and doable on a phone: the book has no name, so the fallback "your child" is not a name; keys are not visible and are no longer asked for.
- (h) now says "a second fresh install (delete the app and install the same build again on the same phone)". One person, one phone, no second device. Nothing in it conflicts with (g): the first book is named Asha and is deleted with the app.

**Whole-block sweep of S1-191 at this head** (every count and age token listed with context): (e) step twenty plus twenty on the two-month-old book, Expected (e) "forty"; (h) step twenty plus twenty, Expected (h) "forty (twenty on each screen)"; no "twenty" left standing alone; no "1 WEEK" or "weeks" anywhere; "2 MONTHS" in (a) and "Asha, 2 months" in (g) agree; the only "seven" is the explanation of why not to use an older book; "dot 2 months" in (a). Heading, Needs, the other Expected lines and Update are unchanged and agree with the step text and with S1-190 beside it. S1-191 is the only heading with that id.

**Mechanics at this head.** `node scripts/qa/release-catalog.mjs --check`: OK. `apps/mobile/test/qa-release-catalog.test.ts`: 8 pass. `git merge-tree` against current develop: clean. Added lines: 0 non-ASCII bytes. CI when read: just started (applied migrations and compliance-fence success, install in progress, the rest not yet reported); a PASS holds only once every required check is green at this exact head. A docs-only change cannot move the code suites.

**Notes that remain (none blocks, all unchanged since my last review)**
- Needs says "a build of this branch" and the heading keeps `branch feat/mobile-nameless-surfaces` although #716 is merged; S1-190 keeps its branch name too and the Record asks for the build number, which is the check.
- Step (a) does not mention the 18+ question that opens first run; "servers off is enough" is true today.

**Not verified.** Nothing here was run on a phone.

Reviewer: independent of the author (CR-44).
