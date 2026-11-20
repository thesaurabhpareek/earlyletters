## Review B at 5721fb6de6af79c2115f930dbdb1c4594cbd2784: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B (independent method, coverage and correctness of row citations). Rule applied: ruling T1 on P-8. A test cites a row only if it proves the whole row; a set that proves a row together each cite it, the first with a one-line comment naming the others; a partial test cites nothing.

Must fix: none.

## What I checked
The cited id against the locked card (`09-capture.md:848` at `450bcb4a`). I read the test body, its stand-ins and the queue code it drives.

- NS-17-R10, whole: `apps/mobile/test/english-only-language-hold.test.ts:162`. Row: a recording in a held language is never handed to the recogniser and asks for no download. The real queue (`src/lib/transcription-queue/index.ts`, `machine.ts`) runs with the English-only switch on and a Spanish draft. The fake recogniser is never handed it (`heard` empty, `:168`) and never asked (`asked` empty, `:169`). `ensureSpeechFor` is never called, with downloads allowed (`:170`). The job waits as `waiting_for_language` with 0 attempts and no failure. That is the whole row.

Review A's must-fix at `f75d31f1` (NS-13-R31 cited by a partial test) is fixed: `next-ask.test.ts` is back to develop's text and the row is listed as partial in the body.

Other checks:
- Diff from merge base `bc425d2f`: 1 file, +1 -1. The title gains only `[NS-17-R10] `. No body or assertion changed.
- Added line is ASCII.
- Titles are unique in the file. No test on develop cited this id before.
- Tests at the head, in a worktree: `npx vitest run test/english-only-language-hold.test.ts`: 18 passed. `packages/content` `no-real-family-data.test.ts`: 11 passed. Fixtures use Asha only.
- No check-in file in this PR (the P-8 check-in is in #888).
- CI at the head (committed 12:28 UTC, checked 12:51 UTC, 23 minutes old): finished and green for required, tests and content rules, typecheck, database rules, Deno, compliance-fence, applied migrations unchanged. Superseded compliance-fence runs were cancelled. Store-profile Release launch is still queued; it does not gate a title change.

## Findings (notes, not blocking)
1. The hold has two sources: the English-only switch and the spoken-language list. The test drives only the switch. Both reach the same queue gate through `languagesOnHold(heardLanguagesForBuild())` (`transcription-queue/index.ts:169`), so the citation stands. A list-driven case would close the row for both builds.
2. The PR body's "Globs touched" still lists `apps/mobile/test/next-ask.test.ts`, which this PR no longer changes.

## Not verified
- The trace counts in the body.
- The body's partial and blocked list, row by row, including the NS-17-R6 auto-detect finding.

Reviewer: independent of the author (CR-44).
