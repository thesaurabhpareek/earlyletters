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
