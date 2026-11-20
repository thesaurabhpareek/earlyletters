## Review A at 5721fb6de6af79c2115f930dbdb1c4594cbd2784: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A (accuracy). Task P-8: card ids added to test titles on develop. Rule: a test cites a row only if it proves the whole row; a set that proves a row together each cite it, the first with a one-line comment naming the others (ruling T1); a partial test cites nothing. Re-review after the fix for my earlier must-fix (NS-13-R31 at f75d31f1).

Must fix: none.

## What I checked
- Diff from merge base `bc425d2f` to head: one file, `english-only-language-hold.test.ts:162`, whose title gains only `[NS-17-R10] `. `next-ask.test.ts` is back to develop's text (the NS-13-R31 id is gone). No body, assertion, skip or timeout changed. Added line is ASCII.
- NS-17-R10 against the locked card (`09-capture.md:848` at `450bcb4a`): holds. The real transcription queue runs with the English-only switch on and a Spanish draft: the fake recogniser is never handed it and never asked; no speech download is requested; the job waits as `waiting_for_language` with 0 attempts and no failure.
- The body now lists NS-13-R31 as partial with the reason and the missing test (no "No reminders" answer, no test of the count written on show and read by `askAfterSave`).
- Open PRs into develop touching `english-only-language-hold.test.ts`: none but #889.
- Tests: `npx vitest run test/next-ask.test.ts test/english-only-language-hold.test.ts` in a worktree at the head: 2 files, 35 passed.
- CI at the head (12:46 UTC, head 18 minutes old): finished and green: required, tests and content rules, typecheck, database rules, Deno, compliance-fence, applied migrations unchanged (superseded compliance-fence runs cancelled). Store-profile Release launch is still queued; it does not gate a title change.

## Notes
- NS-17-R10: the hold has two sources (the English-only switch and a spoken-language list, `language-hold.ts:31-36`). The test drives the switch; the list reaches the same queue gate through `languagesOnHold`, so the citation stands. A list-driven case would close it fully.

## Not verified
- The trace counts in the body.
- The body's partial and blocked list, row by row, including the NS-17-R6 auto-detect finding.

Reviewer: independent of the author (CR-44).
