Both counted reviews on this head are CHANGES (Review A: a missing or damaged launch stamp lets a clock 30 or more days ahead erase a shelf letter at one launch; Review B: nothing pins the purge-then-record order, and DL-03 / DL-04 (c) in the device plan cannot be run as written). I made the fixes in a scratch worktree so the author does not have to guess. I have not pushed them to this branch (it is not mine). To apply, take the hunks below, or ask me to push after the founder says so.

What changed and what I ran, on top of 5309d0b3:
- `purgeExpired` returns 0 when there is no readable earlier launch stamp (or the clock is earlier than it), and counts time by that stamp: `cutoff = last - SHELF_MS`. `Math.min(nowMs, last)` was dead code after the guard.
- New `purgeThenRecordLaunch(nowMs, eraseAudio, alsoErase)` in `store.ts` holds the order (purge reads the previous stamp, then record). `purgeShelfAtLaunch` in `erase.ts` calls it; the shelf tests' `launch` helper calls it too, so swapping the order now fails 7 tests (I tried it).
- Tests: the unreadable-stamp test now expects 0 then 1 at the next launch; new tests for no stamp at all and for record-after-purge; older tests that call `purgeExpired` with no stamp use a `purgeSeen` helper (stamp = the time itself, so the old 30-day cutoff is unchanged); `sweep.disk` and `transcribe-adts.disk` record a launch that has seen the time before the launch sweep.
- Device plan: DL-03 says erased at the first or second launch; DL-04 (c) gains the steps that create the second letter.
- Ran: store.*, sweep*, transcribe-adts.disk, qa-kill-harness, launch-retry, sync-erase, book-shelf, shelf-strings: 20 files, 357 passed. `tsc --noEmit`: only the known `expo-clipboard` environment error.

<details><summary>store.ts and erase.ts hunks</summary>

```diff
diff --git a/apps/mobile/src/lib/capture/erase.ts b/apps/mobile/src/lib/capture/erase.ts
index b342e373..8981c811 100644
--- a/apps/mobile/src/lib/capture/erase.ts
+++ b/apps/mobile/src/lib/capture/erase.ts
@@ -23,7 +23,7 @@
  */
 import { Platform } from 'react-native';
 import { removeListeningCopy } from '../audio-enhance';
-import { audioRows, eraseEntry, finishServerErased, purgeExpired, recordLaunch, type AudioEraser } from '../store';
+import { audioRows, eraseEntry, finishServerErased, purgeThenRecordLaunch, type AudioEraser } from '../store';
 import { removeWholeFrameCopiesOf } from './adts-file';
 import { erasableFiles } from './recordings';
 
@@ -54,7 +54,5 @@ export function finishErasedLetters(): number {
 
 /** Launch purge, then record this launch for the clock guard. Returns how many letters were erased. */
 export function purgeShelfAtLaunch(nowMs = Date.now()): number {
-  const n = purgeExpired(nowMs, eraseAudioFile) + finishServerErased(eraseAudioFile);
-  recordLaunch(nowMs);
-  return n;
+  return purgeThenRecordLaunch(nowMs, eraseAudioFile, () => finishServerErased(eraseAudioFile));
 }
diff --git a/apps/mobile/src/lib/store.ts b/apps/mobile/src/lib/store.ts
index 43ad937f..9978f9ed 100644
--- a/apps/mobile/src/lib/store.ts
+++ b/apps/mobile/src/lib/store.ts
@@ -825,12 +825,16 @@ export function finishServerErased(eraseAudio: AudioEraser): number {
  * is a promise ("Kept here until <day>"), so the phone clock is never trusted
  * further than it has been seen before (QE-05):
  *
- * - The purge counts time by the earlier of the clock now and the latest
- *   recorded launch. A clock that jumped ahead (a wrong date, a manual change,
- *   a restore onto another phone) erases nothing more at that launch than the
- *   previous launch would have; a letter is erased only once two launches
- *   agree it has waited its 30 days. Failing toward keeping costs at most one
- *   launch of delay.
+ * - The purge counts time by the latest recorded launch, not by the clock now.
+ *   A clock that jumped ahead (a wrong date, a manual change, a restore onto
+ *   another phone) erases nothing more at that launch than the previous
+ *   launch would have; a letter is erased only once two launches agree it has
+ *   waited its 30 days. Failing toward keeping costs at most one launch of
+ *   delay.
+ * - With no readable record of an earlier launch (a first launch, or a damaged
+ *   setting) nothing is erased at that launch, because the clock has not been
+ *   seen before. The launch is recorded after the purge, so the next launch
+ *   purges as usual.
  * - A clock earlier than the latest recorded launch (moved back) purges
  *   nothing at that launch (DL-04). `recordLaunch` then stores that earlier
  *   time, so a clock corrected after running ahead resumes purging at the next
@@ -843,10 +847,9 @@ export function finishServerErased(eraseAudio: AudioEraser): number {
  */
 export function purgeExpired(nowMs: number, eraseAudio: AudioEraser): number {
   const last = Date.parse(getSetting(LAST_LAUNCH_SETTING) ?? '');
-  if (Number.isFinite(last) && nowMs < last) return 0;
-  const seenMs = Number.isFinite(last) ? Math.min(nowMs, last) : nowMs;
+  if (!Number.isFinite(last) || nowMs < last) return 0;
   const c = ctx();
-  const cutoff = new Date(seenMs - SHELF_MS).toISOString();
+  const cutoff = new Date(last - SHELF_MS).toISOString();
   let erased = 0;
   for (const id of capabilities.sync ? entries.expiredLocalOnlyIds(c, cutoff) : entries.expiredIds(c, cutoff)) {
     if (eraseEntry(id, eraseAudio)) erased += 1;
@@ -865,6 +868,19 @@ export function recordLaunch(nowMs: number): void {
   setSetting(LAST_LAUNCH_SETTING, new Date(nowMs).toISOString());
 }
 
+/**
+ * The launch purge, then this launch's record, in that order. The purge reads
+ * the previous launch's stamp, so recording first would make every purge count
+ * time by the clock now and disable the QE-05 guard. `alsoErase` runs between
+ * the two (letters the server erased); its count is added. Returns how many
+ * letters were erased.
+ */
+export function purgeThenRecordLaunch(nowMs: number, eraseAudio: AudioEraser, alsoErase: () => number = () => 0): number {
+  const n = purgeExpired(nowMs, eraseAudio) + alsoErase();
+  recordLaunch(nowMs);
+  return n;
+}
+
 // ── Drafts (capture in progress) ─────────────────────────────────────────
 export function createDraft(input: NewDraft): Draft {
   const c = ctx();
```

</details>

---
_Generated by [Claude Code](https://claude.ai/code)_
