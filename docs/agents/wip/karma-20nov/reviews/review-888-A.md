## Review A at 2c745dde1ded5c97e48e710b1c9d0b29f65cfbfd: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A (accuracy). Task P-8: card ids added to test titles on develop. Rule: a test cites a row only if it proves the whole row; a set that proves a row together each cite it, the first with a one-line comment naming the others (ruling T1); a partial test cites nothing. Re-review after the fix for my earlier must-fix (NS-09-R3 at 1e5b127a).

Must fix: none.

## What I checked
- Diff from merge base `bc425d2f` to head, 3 files: `sweep.disk.test.ts` (3 titles gain only the NS id plus a space, and one `//` set comment at `:416`), `listen.test.ts:347` (title gains `[NS-09-R3]` only), and the check-in `docs/agents/checkins/qa-p8.md`. No body, assertion, skip or timeout changed. Added lines are ASCII.
- Each id against the locked card (`08-keeping-and-trust.md` at `450bcb4a`, rows `:300-302`), bodies read in full:
  - NS-09-R1 (`sweep.disk.test.ts:288`): holds. A draft marked `discarding` with its file; the real launch sweep removes the file and the row.
  - NS-09-R2 (`:302`): holds. The stand-in delete throws `EPERM`; the sweep resolves without throwing, the row stays `discarding`, the file stays and is not re-attached.
  - NS-09-R3 (set `sweep.disk.test.ts:417` and `listen.test.ts:347`): holds together. `:417` runs Listen's exact Discard steps with a delete that throws and the row stays `discarding`, off every list; `listen.test.ts:347` pins that Listen's confirmed Discard calls exactly those steps, once, and nothing else in Listen deletes a file or a draft. The set comment at `:416` names both, and both line numbers are right at the head.
- The body's table and trace line match the head (set at `:417` with the comment, `listen.test.ts:347`).
- Open PRs into develop touching `sweep.disk.test.ts` or `listen.test.ts`: none but #888.
- Tests: `npx vitest run test/sweep.disk.test.ts test/listen.test.ts` in a worktree at the head: 2 files, 85 passed.
- CI at the head (12:46 UTC, head 18 minutes old): finished and green: required, tests and content rules, typecheck, database rules, Deno, compliance-fence, agent team consistent, applied migrations unchanged (one superseded compliance-fence run cancelled). Store-profile Release launch is still queued, as on every PR I looked at today; it does not gate a title change.

## Notes
- The store-profile Release launch job had not started when I finished.

## Not verified
- The trace counts in the body (I did not run `scripts/trace.mjs` from #878's branch).
- The body's partial and blocked list, row by row.

Reviewer: independent of the author (CR-44).
