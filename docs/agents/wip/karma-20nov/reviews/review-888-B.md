## Review B at 2c745dde1ded5c97e48e710b1c9d0b29f65cfbfd: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B (independent method, coverage and correctness of row citations). Rule applied: ruling T1 on P-8. A test cites a row only if it proves the whole row; a set that proves a row together each cite it, the first with a one-line comment naming the others; a partial test cites nothing.

Must fix: none.

## What I checked
Each cited id against the locked card (`08-keeping-and-trust.md` at `450bcb4a`, rows `:300` to `:302`). I read each test body and the code it drives.

- NS-09-R1, whole: `apps/mobile/test/sweep.disk.test.ts:288`. A draft marked `discarding` by `beginDiscard` with its file on disk. A new launch runs the real `runLaunchSweep()`. The file is gone (`:296`) and the row is gone (`:295`). That is the whole row.
- NS-09-R2, whole: `sweep.disk.test.ts:302`. The stand-in delete throws `EPERM` (`test/helpers/expo-fs-standin.ts:221`). The sweep resolves with a report, so nothing throws (`:310`). The row stays `discarding` (`:311`) and is off the draft list (`:313`). On "no error reaches the screen": the app calls the sweep fire-and-forget after the first frame (`src/app/_layout.tsx:194`) and `runLaunchSweep` catches to null (`src/lib/capture/sweep.ts:58`). So a resolving sweep is all a unit test can show, and it shows it.
- NS-09-R3, set: `sweep.disk.test.ts:417` and `apps/mobile/test/listen.test.ts:347`. The row's Given is Discard on Listen. `:417` runs the exact `letItGo` steps Listen passes with a delete that throws; `letItGo` returns false before `finishDiscard` (`src/lib/capture/let-it-go.logic.ts`), and the row stays `discarding` (`:422`). `listen.test.ts:347` pins that Listen's confirmed Discard calls exactly those steps, once, and nothing else in Listen deletes. Neither proves the row alone; together they do. The set comment at `sweep.disk.test.ts:416` is one line and names both, with right line numbers.

Review A's must-fix at `1e5b127a` (NS-09-R3 cited by one test) is fixed by the set above.

Other checks:
- Diff from merge base `bc425d2f`: 3 files, +7 -4. Titles gain only the NS id; one `//` set comment; one check-in file. No body, assertion, skip or timeout changed.
- Added lines are ASCII.
- Titles are unique in both test files (no duplicate `it` titles). No test on develop cited these ids before.
- Tests at the head, in a worktree: `npx vitest run test/sweep.disk.test.ts test/listen.test.ts`: 2 files, 85 passed. `packages/content` `no-real-family-data.test.ts`: 11 passed. Fixtures use Asha only.
- Check-in `docs/agents/checkins/qa-p8.md`: 2 lines, each in the `HH:MM (DD Mon) <agent> | done: | next: | blocked/needs:` format.
- CI at the head (committed 12:28 UTC, checked 12:51 UTC, 23 minutes old): finished and green for required, tests and content rules, typecheck, database rules, Deno, compliance-fence, agent team consistent, applied migrations unchanged. One superseded compliance-fence run was cancelled. Store-profile Release launch is still queued; it does not gate a title change.

## Findings (notes, not blocking)
1. NS-09-R3 rests on a source-text pin (`listen.test.ts:347`) for the Listen half. That is allowed under T1, but a render test of Listen's Discard would let one test carry the row.
2. The PR body's "Globs touched" leaves out `apps/mobile/test/listen.test.ts`, which this PR now changes.
3. The PR body's "Rules kept" still says "the single test proves the whole row"; NS-09-R3 is now a set.
4. The check-in file `qa-p8.md` has no matching claim line on develop's `BOARD.md` (the checkins README asks files to be named after a board claim). Low weight for a task run.

## Not verified
- The trace counts in the body (I did not run `scripts/trace.mjs` from #878's branch).
- The body's partial and blocked list, row by row.

Reviewer: independent of the author (CR-44).
