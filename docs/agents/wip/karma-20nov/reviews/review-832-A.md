## Review A at 3e3b3eaa9e8b43ea212789d7c79a755ef1c9d9fb: PASS WITH NOTES
Read: CLAUDE.md; reviews A and B at 8ae9e92c; the PR body's fix round; `git diff 8ae9e92c 3e3b3eaa` (1 commit, 4 files, +59/-5: 51 test lines, comment-only hunks in drafts.ts, store.ts, merge.ts); sweep.ts 85-176; merge.ts 501-620; store.ts 1018-1084 and 1266-1312; wipe.ts 95-128; F04-capture.md 312 and 317.
Ran (a worktree at the head, now removed): 5 files (the 4 touched plus sync-held-v8): 140/140. The 3 sweep and listen test files over develop's src: 9 of the 10 new tests red, both new ones included. Full apps/mobile: 5000 pass, 73 fail, all in the 8 baseline files. packages/content: 395/395. tsc (it includes test/): only the 5 known errors (help-fallback 1, controller 4). 0 non-ASCII in 268 added lines. merge-tree against origin/develop a17254f6: clean. CI at the head: 14 success, 2 skipped, 2 in progress (e2e simulator app, store-profile Release launch). All 3 contexts develop requires (required, compliance-fence, applied migrations unchanged) are success.

1. Must fix 1 is done. The test at sweep.disk.test.ts:369 calls runLaunchSweep() without awaiting it. reconcile reads the rows synchronously (sweep.ts:87-88), then awaits probePlayable for the cut-off take (sweep.ts:92; the stand-in recorder wrote 48000 bytes, expo-fs-standin.ts:147). The pull runs in that gap: applyPullPage with a held row and no queued op, so merge.ts:587-591 sets the draft to ready. Line 392 shows the pull landed before finishLetGo. Line 393 ('finish-discard': 1) shows the plan came from the rows read before the pull. M3 (sweep.ts:168 `beginDiscard: () => true`): 1 of 140 red, at :395, where the recording was deleted. Restored.
2. Note M6 is done. M6 (sweep.ts:171, entries are the only owners): 1 of 140 red, at :363, where the other draft's file was deleted. Restored.
3. The comments are true. drafts.ts:3-7 and store.ts:1299-1302: eraseBook (store.ts:1018) erases every row in wipe.bookAudioRows, drafts included (wipe.ts:95-99). eraseEverythingLocal (store.ts:1064) erases every row in wipe.allAudioRows, drafts included (wipe.ts:123-127), and its file pass (erase-everything.ts:59). The other .delete() calls in src are: entry erase (erase.ts:33, entries only), exports, backup temp files, packs, and listening and temp copies. merge.ts:541 now cites F04-REQ-009, which is "Audio is deleted only by a confirmed Let it go" (F04-capture.md:317).
4. Nothing else changed. The only src edits are comments, so my findings at 8ae9e92c stand (data safety, sync, Listen, and mutations M1, M2, M4, M5).
5. decode-uri-component-shim: 27/27 alone (366 ms of tests) and 27/27 in the full suite (596 ms). Its slow test loads metro.config.js. The PR touches no metro, shims or query-string file, so it cannot affect this test. A 5 s timeout under load is the sandbox being busy.

Must fix: none.

Notes
1. When the re-read leaves the draft alone, the report still counts finish-discard (:393). It holds counts only, and launch drops it (_layout.tsx:194). Fine.
2. Docs follow-up, wider than B's note 4: F04-capture.md:312 (F04-REQ-004, "deletes 0 audio files"; for a discarding draft "the sweep removes the row") and :317 still say the sweep removes only the row. It now deletes the file first.
3. The new pull test seeds a draft that was never held, so nothing is queued. That is the state after the server answers kept (the op is gone, so merge.ts:584 lets the row through), which is the path a real phone takes.

Not verified: device or simulator, including the timing of the sweep against a real pull at launch; the 2 simulator jobs still running (not required).
This PASS WITH NOTES holds at this exact head, where required CI is green. Re-read if the head moves.
Reviewer: independent of the author (CR-44).
