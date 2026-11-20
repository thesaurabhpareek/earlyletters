## Review A at 8ae9e92c7ac87b93561c964ada2c028b43d402b6: CHANGES

Read: CLAUDE.md; PR body; BL-923 and BL-924 rows (origin/docs/new-scope-final-rank-and-tasks-19nov); the full diff (13 files, +213/-27); at head: sweep.ts, sweep.logic.ts, recordings.ts, erase.ts, let-it-go.logic.ts, listen.tsx, listen.logic.ts, review.tsx, recorder.ts, store.ts 1012-1324, repos/drafts.ts, repos/types.ts, sync/outbox.ts (enqueueHeldDiscard, takeBatch), sync/merge.ts (held.discard answer, adoptHeldDraft, applyHeldRows), audio-enhance (sweepListeningCopies).
Ran (a worktree at the head, now removed): 4 touched test files, 109/109 pass. Develop src with the new tests: 7 of 8 red (the "already gone" test is green, as the PR says). 7 mutations (item 4). Full apps/mobile: 4998 pass, 73 fail, all in the 8 baseline files. packages/content: 395/395. tsc: the 5 known errors only (help-fallback 1, controller 4). 0 non-ASCII bytes in 213 added lines. merge-tree clean against 5f5dfaf4 and against current develop a17254f6 (only docs changed since). CI at the head: `required` success; 2 simulator jobs still running.

1. Data safety: holds.
- The sweep removes only `drafts` rows in `discarding`: the plan step at sweep.logic.ts:152-155, and finishDiscard's SQL at drafts.ts:193 (`WHERE id = ? AND state = 'discarding'`). No letter row is ever removed.
- The owner guard (sweep.ts:170-172) counts every other draft and every letter as an owner, a letter with the same id included. erase.ts:46 drops the same id, so this guard is stricter. The chain is erasableFiles (recordings.ts:81-90), then belongsToAnotherRow (sweep.logic.ts:131-134). The same-id letter test passes, and the mutation that drops the guard goes red.
- The re-read is at sweep.ts:168 (getDraft also returns discarding rows: drafts.ts:84-87). finishLetGo runs synchronously, so no pull can run inside it. But the row snapshot (sweep.ts:88) is taken before the probe and action awaits (92, 107, 135), so the plan can be stale by the time finishLetGo runs. That is why the re-read is needed.
- When a delete throws: it runs inside letItGo's try (let-it-go.logic.ts:32-36), so the row stays and the sweep goes on (the test checks reattach:1 afterwards). A database throw ends reconcile. sweep().catch then gives null (sweep.ts:58), and the purge still runs in finally (65-72). Launch never awaits the sweep.
- Stale path: filesForRecording (recordings.ts:64-73) also looks for the same file name in both folders. The container-move test passes. The file name stays claimed (sweep.logic.ts:153), so a file that will not delete is never re-attached.
2. Sync: holds.
- finishLetGo never calls store.beginDiscard, so it queues no second op. held.discard was queued when the draft was marked (store.ts:1281-1282), with payload {} and base held_v (outbox.ts:558). It goes out from the outbox row, without the draft row. A never-sent held.upsert is dropped when the draft is marked (outbox.ts:552).
- Server answers `kept`: merge.ts:358-362 resets the held cursor. On the next pull, a row that is still here goes back to ready (merge.ts:585-595), and the re-read then leaves it alone. A row the sweep already removed comes back as a new draft with its words and audio_uri NULL (608-616). Either way the end state is the same as a finished Review let-go today.
- gone=kept: adoptHeldDraft returns early for a discarding draft (merge.ts:509-510).
- No double finish: the second caller finds no row (the re-read is false, or the UPDATE changes 0 rows), and no op is left orphaned.
3. Listen: holds. listen.tsx:435 passes the same steps as review.tsx:415. No other .delete() or deleteDraft remains in listen.tsx (the source pin is green at head and red on develop). A missing file still lets the draft go: deleteIfPresent (let-it-go.logic.ts:20-22) and the "already gone" test.
4. Tests: all 8 titles start [BL-923] or [BL-924]; 7 of 8 red on develop, as claimed. Mutations:
- M1, skip the file delete: 4 red.
- M2, same-id letter not an owner: 1 red. M2b, no letter is an owner: 1 red.
- M4, a delete throw stops the sweep: 1 red.
- M5, the plan does not claim the file name: 5 red.
- M3, remove the re-read (`beginDiscard: () => true`): 0 red. It SURVIVES.
- M6, other drafts are not owners: 0 red.
5. Comments match the code: store.ts:1266-1273 and 1298-1302; types.ts:116-119; drafts.ts:1-5; let-it-go.logic.ts:1-11 and 24-28; the sweep.ts header and 160-165. The comments at merge.ts:509, 540 and 585 are now true.
6. Runs: as listed above; all at the expected baselines.

Must fix
1. apps/mobile/test/sweep.disk.test.ts: no test covers the re-read at sweep.ts:168, so M3 passes the whole suite. Failing scenario without the re-read: a draft is left discarding. At launch a cut-off take is probed (sweep.ts:92 awaits, after the snapshot at 88). Meanwhile a pull's applyHeldRows (merge.ts:591) returns the draft to ready. finishLetGo then deletes its recording, finishDiscard refuses the row, and the draft is back on Tonight without its recording. My throwaway test showed this: seed a discarding draft and a beginTake, launch, call runLaunchSweep(), set the state to ready with SQL before awaiting. It passes at head and fails under M3. Add one like it, titled [BL-923].

Notes
- M6: nothing tests other drafts as owners. Two drafts rarely name one file, and one more case in the same test would cover it.
- The [BL-924] disk test calls letItGo directly. On develop it fails only in its sweep half (sweep.disk.test.ts:375). Only the exact-string source pin proves the Listen change; that is acceptable.
- On develop, Listen deleted the file even when id was null; now it does not. This cannot happen: Discard shows only while recording or paused (listen.logic.ts:238), and takeId is set first (listen.tsx:296).
- Now live and not in the PR body: a draft that merge marks discarding (let go or erased on another phone: merge.ts:407, 555, 569) loses its recording on this phone at the next launch. merge.ts:540 intends this.
- The report counts finish-discard when it is planned, even if the file then would not delete. It holds counts only, so this is fine.
- drafts.ts:3-5 and store.ts:1298-1301 list what deletes audio but leave out eraseBook (store.ts:1018, which erases a deleted book's draft recordings). "never here" is still true.
- A transcribed draft's listening copy is not removed by the sweep or by Review. sweepListeningCopies (audio-enhance/index.ts:100) removes it at a later launch, once the row is gone. This was already so on develop.

Not verified: behaviour on a device (real iOS delete failures, a container move, the timing of the sweep against a pull at launch); the 2 simulator jobs still running.
A PASS can hold only after Must fix 1 lands, the new head is re-reviewed, and required CI is green at that exact head.
Reviewer: independent of the author (CR-44).
