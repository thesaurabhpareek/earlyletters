## What and why
Let it go marks a draft `discarding`, deletes its recording, then removes the row. On develop nothing finished a draft that stopped part way (the app closed between the steps, or the delete failed), so it stayed hidden with its audio still on the phone, although comments in `store.ts`, `let-it-go.logic.ts`, `sync/merge.ts`, `repos/types.ts` and `repos/drafts.ts` said a launch sweep finished it. Listen's Discard also swallowed a failed delete and removed the row, leaving audio with nothing pointing at it.

Now the launch sweep finishes every `discarding` draft: it re-reads the mark, deletes the file where it is now (never one another draft or a kept letter may own), then removes the row; a file that will not delete keeps the row for the next launch. Listen's Discard runs `letItGo` with Review's exact steps. The comments now match the code.

## Rows satisfied
BL-923 and BL-924 (N-07, F04-REQ-009), rank 2 in the 19 Nov stack rank and wave 1 of its engineering plan (rows defined in open PR #829). BL-925 and BL-926 (the words for a recording that could not be let go yet) are separate and wait on the founder's word approval.

## Constitution and sync
The sweep touches only `drafts` rows in state `discarding`; `finishDiscard` deletes `WHERE state = 'discarding'`, and letters live in `entries`. The file guard counts every letter as an owner, including one with the draft's own id (a mutation test shows that dropping this would delete a kept letter's recording). Sync follows what `letItGo` already does in Review: the queued `held.discard` is sent without a draft row; a never-sent `held.upsert` is dropped at the mark; if the server keeps the row, the next pull brings back a draft with the newer words, as Review does today; the re-read means the sweep never removes a draft a pull has returned to `ready`.

## How tested
Disk-layout tests over the expo-fs stand-in and real SQLite (delete works, delete throws, kept letter, stale path after a container move, missing file), a planner test and a Listen source pin. 7 of the 8 new tests are red on develop; the eighth (a recording already gone still lets the draft go) guards a case develop already handled. Full `apps/mobile` suite: failures only in the 8 known sandbox files (73 tests); 4998 pass. `packages/content` 395 pass. `tsc --noEmit`: the 5 known sandbox errors only. 0 non-ASCII bytes added. 13 files, +213/-27 (inside CODE-R02).

## Not visible
No change a person sees, servers on or off, beyond the sweep running at launch. Not verified on a device.

## Harness
Claim row in `docs/agents/BOARD.md` and a check-in in `docs/agents/checkins/mobile.md`. Two counted reviews at the head and green CI; Karma merges under D-132.

---


## Fix round, head 3e3b3eaa

Answers review A (CHANGES) and review B (PASS WITH NOTES) at 8ae9e92c, in one commit.

1. **Review A, must fix: the re-read of the mark is now tested.** `apps/mobile/test/sweep.disk.test.ts:369`, "[BL-923] a pull that returns a let-go draft to ready while the sweep is working keeps the draft and its recording". A real pull (`applyPullPage` with a held row: the server kept the draft) lands while the sweep awaits its probe of a cut-off take. That is after the sweep read the rows (`sweep.ts:88`) and before `finishLetGo`. The draft comes back ready with its recording, and the next launch changes nothing. With the re-read at `sweep.ts:168` replaced by `() => true`, this test fails because the recording is deleted.
2. **Review A, note: another draft counts as an owner of the file.** `sweep.disk.test.ts:353`, "[BL-923] a recording another draft also names stays when one of them is let go; only the let-go row goes". With other drafts dropped from the owner set (`sweep.ts:171`), this test fails.
3. **Review A, note: the comments now list every place that deletes a recording.** `db/repos/drafts.ts:1-7` and the `deleteDraft` comment in `store.ts:1298-1302` now name `eraseBook` (erasing a deleted book) and Erase everything (`eraseEverythingLocal`), both of which also delete draft recordings. "Never here" is still true.
4. **Review B, note 4: corrected requirement id.** `sync/merge.ts:541` (`applyHeldRows`) now cites F04-REQ-009 (Let it go) instead of F04-REQ-004.

Also live now and not covered above: suppose the same author lets go of a held draft, or erases it, on another phone. That draft is then marked `discarding` here (`merge.ts:407, 555, 569`), and this phone deletes its recording at the next launch, as `merge.ts` intends.

No change a person sees or hears, and no new words. The Listen order (mark `discarding` before `await abandonTake`, review B note 3) is left for a follow-up.

Checks at 3e3b3eaa:
- The touched test files plus `sync-held-v8`: 140 of 140 pass.
- Full `apps/mobile` suite: 4999 pass and 74 fail. 73 of the failures are in the 8 known sandbox files. The other is a 5 s timeout in `decode-uri-component-shim` under load, which passes 27 of 27 when run alone.
- `packages/content`: 395 of 395 pass.
- `tsc --noEmit`: only the 5 known errors.
- No non-ASCII characters in the added lines.
- `merge-tree` against `develop` a17254f6 is clean.

Sandbox note: one full-suite run at this head also timed out in `test/decode-uri-component-shim.test.ts` (5 s limit, under load from parallel work); the file passes 27 of 27 alone, and this PR does not touch it. CI at this head is the judge.


---
_Generated by [Claude Code](https://claude.ai/code)_
