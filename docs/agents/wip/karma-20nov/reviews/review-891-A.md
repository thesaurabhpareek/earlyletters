## Review A at b00c9e80b4601e0e0766147e1db0fe6ca998b491: CHANGES
<!-- agent:principal-architect -->

Lens A (accuracy). Task P-8: card ids added to test titles on develop. Rule: a test cites a row only if it proves the whole row; a set that proves a row together each cite it, the first with a one-line comment naming the others (ruling T1); a partial test cites nothing.

Must fix:
1. NS-35-R7 on `apps/mobile/test/resilience.test.ts:101` is a wrong citation. The row (`11-foundations.md:542`): given any arrival from outside the app, the microphone is not turned on. The test is one line: with nothing armed, `consumeListenStart()` returns false. It does not show that Listen keeps the microphone off when that flag is false: the PR body's own proof rests on `listen.tsx:130-134` (`tapped.current ? 'asking' : 'ready'`), and no test pins that line (I found none that reads `tapped` into the phase; `recording-haptics.test.ts:89` pins only `createStartTick(tapped.current)`). It also does not cover the other ways in that the card names (`11-foundations.md:487`): notification taps, and the widget, Control Center, Action button and Siri doorways. Parts exist elsewhere: only Speak arms (`start-capture.test.ts:19-20`, `:48`), the four doorways are reserved and start nothing (`start-capture.test.ts:29-30`), capture links go to Tonight (`resilience.test.ts:89`). Even all of these together leave the Listen phase wiring untested. Fix: drop `[NS-35-R7]` and list the row as partial (the missing piece is a test that Listen mounted without an armed tap starts in `ready` and never calls the recorder).

## What I checked
- Diff from merge base `bc425d2f` to head: 1 title line gains only the NS id plus a space (script check); no body, assertion, skip or timeout changed. Added line is ASCII.
- The id against the locked card (`11-foundations.md` at `450bcb4a`, row `:542`, context `:484-487`), the test body, `src/lib/resilience/start-intent.ts`, `src/app/listen.tsx:128-134`, `src/lib/capture/start-capture.logic.ts:55-69` and the tests that touch `armListenStart` or `consumeListenStart` (grep over `apps/mobile/test` on develop).
- Open PRs into develop: none touches `resilience.test.ts` except #891.
- Tests: `npx vitest run test/resilience.test.ts` in a worktree at the head: 19 passed.
- CI at the head (12:25 UTC): required FAILED because "tests and content rules" was cancelled at the 5-minute job limit while running the engine and analytics step (annotation: "exceeded the maximum execution time of 5m0s"); content rules passed. Not caused by a one-title change, but the PR is red until that job is re-run. Typecheck, database rules, Deno, compliance-fence success; store-profile Release launch still queued.

## Notes
- The bodies say "All four P-8 PRs together: 8 tested"; #890 now says 10.

## Not verified
- The trace counts in the body.
- The body's partial and blocked list (not re-read row by row).

Reviewer: independent of the author (CR-44).
