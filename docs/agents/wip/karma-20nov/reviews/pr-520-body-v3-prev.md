## What and why

**Data classes touched:** device settings only, four new keys in the local `settings` table (DATA_CLASSIFICATION 1.1: the highest level wins, rule 1, and every book id is L3, rule 5): two **L3** and two **L2**, **none L4**.
- `book.deletedAt.<child id>` and `book.erasing.<child id>`: **L3**. The value is an L2 time (or '1'), but the key holds a book id, so each row is handled as L3, as `activeChildId` and `readTogether.sessions.<book id>` are (DATA_CLASSIFICATION 4.5).
- `erase.everything.pending` and `db.secureDeleteVacuumAt`: **L2**. An ISO time under a fixed key.
- No name, text, birth date or language is in any key or value, and nothing is logged or sent. Treating the two book keys as L3 changes no behaviour: `removeBook` and `removeEverything` already delete them.

**Classification row:** DATA_CLASSIFICATION has no row yet for these four keys (Review B at 79bc4456 searched the docs: none; the `ageGate.*` rows are at DATA_CLASSIFICATION.md:719). The CCO ruling on this PR will record the classes above (two L3, two L2, none L4) until the data-classification document gets the rows in a docs PR (4.5; not in this PR). The code labels now match: `db/repos/wipe.ts` and `lib/README.md` say L3 for the two book keys and L2 for the other (comments only, changed at the push after 8a8db627; they said L2 for all three before). Handoff to `legal` for DATA_CLASSIFICATION 4.5 and the privacy-policy corrections: #654. `docs/legal/**` is not edited by this PR.

Catalog row **RT-BK-12** (now `partial`: built and unit-tested here, device row **S1-133**), requirement **SR-C-07** (DATA-REQ-014, DATA-REQ-024, F17-REQ-026, F17-REQ-080; BL-387; D-083, D-103).

`store.en.ts:60` and the staged proposal both promise that you can "delete everything, any time, from Settings". Neither screen existed on `develop`. On `develop` there was no Erase everything anywhere: `eraseLetterLedger()` / `clearLedger()` existed with no caller (F17 WP-F17-15: "Not built"), and `capture/recordings.ts` listed the wipe as "still to be built".

**Risk tier: T2 (data deletion).** This needs **two independent reviews and the Chief Privacy Officer's view** before merge.

**Freeze (D-130):** this changes app behaviour. It merges after the 9 Nov go/no-go and before the 1 Dec submission, unless Karma takes it in as an S1 fix: a published store claim with no matching feature.

### Changed after the council (8 Nov)
**Founder decision, 8 Nov:** ship #520 (Erase everything and Delete this book) with the four lines the council reviewed (`body`, `onThisPhone`, `freeLetters`, `backups`) plus three wording edits, and keep "Your free letters start again." in the store build only, in the quiet text style. The reset itself is unchanged (D-083, D-103). This is the push that follows it; it is on a new head, so reviews reset, and the CCO line for `age-gate.ts` goes on this head only.

The three edits (`packages/content/src/strings.en.ts`, `settings.erase`):
1. `backups`: "Exports you already saved, and backups of this phone such as iCloud Backup, are not changed." (it now names saved exports, as the deletion page does).
2. `failed`: "Erasing did not finish. Try again now. If you wait, the app finishes it the next time it opens, and that erases anything you add before then." This matches the code: a failed erase keeps `erase.everything.pending`, the page keeps its Erase everything button, and pressing it again finishes the erase on the spot; at the next launch `resumeEraseAtLaunch` runs `eraseEverythingLocal` over every row then present, so a letter added in between goes too (`store.ts` `eraseEverythingLocal`, `erase-everything.ts`). The page has no button labelled "Try again"; the retry is the Erase everything button below the line and its confirm. `bookEraseFailedToast` is unchanged.
3. New `plusStays`: "Erasing does not cancel Plus. Billing continues through Apple until you cancel." (the account-deletion screen's Plus line, `features/account-deletion.en.ts` `subscription.body`, with this screen's own first word). It shows only in the store build (`PLUS_ALPHA` false) and only while Plus will renew: the page uses the same signal as Settings > Delete account's Plus card, `showSubscriptionNotice(usePlan().details)`. Never in the alpha, whatever the plan reads.

**Screen order:** body, backups, this phone only, speech stays, Plus line (when shown), free letters (store build only), then the Export card and the Erase everything button. The notes are one list, `eraseNoteKeys` in `components/settings/wipe.logic.ts`, drawn by one `.map` in the muted note style, so the order on screen is the order VoiceOver reads, and "Your free letters start again." is no longer in body weight. Unchanged: `body`, `onThisPhone`, `freeLetters` text, `bookBodyThisPhone`, `bookEraseNowBody`, `bookEraseFailedToast`; every button label is 16 characters or fewer (limit 22).

**Checked:**
- New tests in `erase-all.test.ts` and `billing-alpha.test.ts` pin the three strings and the unchanged ones, the order, the gating (hidden in alpha with Plus on or off, hidden in the store build when Plus is off or not renewing, shown in the store build when Plus is on), the muted style, and the page's use of the Plus signal. Two more run both halves of the new `failed` sentence: Erase everything again after a failed erase finishes it, and a letter written after a failed erase is erased by the next launch.
- Against the old source (`strings.en.ts`, `erase.tsx` and `wipe.logic.ts` as at ae39522a, tests kept): 6 of the 65 tests in `erase-all` and `billing-alpha` fail. Eight single mutations of the new source (Plus line in alpha, Plus line with Plus off, free letters before the Plus line, free letters in alpha, backups not first, page ignoring the Plus signal, page passing `alpha: false`, notes in body weight) are each caught. The two behaviour tests above pass on the old source on purpose (they pin what the new sentence relies on); each fails if the retry or the launch resume is removed.
- Run on the merged head: `erase-all` 49, `age-gate-erase` 3, `reminders-erase` 2, `billing-alpha` 16 and the settings tests (`settings-p6b`, `settings-home`, `settings-back`, `settings-help`, `settings-plan-rows`, `children-settings`, `sync-erase`, `download-wait-line`, `plain-screen`): 188 passed in 13 files; `packages/content`: 12 files, 281 passed; whole `apps/mobile` suite: 4,111 passed and 61 failed in 7 files (`config`, `privacy-manifest`, `capabilities`, `licences`, `app-lock-wiring`, `hosting-ios17`, `preflight-production`), the same 61 that fail on ae39522a in this checkout (the Expo config cannot load the `expo-local-authentication` plugin here, and `packages/api/src/keys.ts` lists key id `asha-2026-10` twice); CI is the check that counts. `npx tsc --noEmit` in `apps/mobile`: only the known missing-module errors (`expo-clipboard`, `expo-local-authentication` and the three errors that follow from the second).
- `origin/develop` (caba0215) merged into the branch with a merge commit: clean, no conflicts.
- **Device:** `docs/qa/DEVICE_TEST_PLAN.md` S1-133: (d) and (h) carry the new order and wording; new step (l) is **store build only** (the Plus products load only on the `production` profile, so it cannot run on the `.preview` alpha or a development build); the failed line is listed under Not covered because a phone cannot be made to show it. Nothing was run on a device.
- **Not verified:** how the Plus line reads for Plus through Family Sharing. The signal is the account-deletion screen's, which does not look at ownership, so a Family Sharing member whose shared Plus will renew sees "Billing continues through Apple until you cancel", though they are not the one billed (the F17 account-deletion spec says the subscription step is skipped for them). Same behaviour as Settings > Delete account today; a one-line `ownership` guard on both is a follow-up if the founder wants it.

### (a) Delete this book (child settings, then the book's page)
- The row appears below Hide this book (F17 6.2 D step 7: hiding is offered first). It shows only on a phone that has never signed in (`localDeletionAllowed()`).
- Step 1 says what happens, using the new `bookBodyThisPhone` line plus the existing `bookUndo`. Export everything is the primary action (spec 4.3, DATA-REQ-053), and Continue is secondary.
- Step 2 is a typed confirm with the word "delete" (`bookTypeToConfirmLabel` Rev, per F17 6.2 D step 4 and section 13 Q8), then **Delete the book**. **Keep the book** backs out.
- After confirming, the book leaves every list, Tonight, reminders and Export at once. It waits in **Recently deleted** as one card with **Restore the book** and **Erase now**. After 30 days the launch purge erases it for good.
- Erasing removes every recording file of the book first: letters, deleted letters, drafts, listening copies and temporary whole-frame copies. Then all its rows go in one transaction: letters, drafts, prefs, queued and refused ops, its settings and the book row.

### (b) Erase everything on this phone (Settings, Your data)
- Step 1 says what is erased and what stays, with "Save a copy first?" and **Export your book** first, then **Erase everything** (destructive, not the large button). Step 2 is the system confirm (design 2.12): "Erase everything on this phone?", "This cannot be undone.", **Keep everything** first as cancel and **Erase** second, destructive and never the default, with a `warning` haptic. Then the **Erasing** screen (`StateScreen` loading) with no way out until the erase ends. Changed at 7b40323a, see below. The order of the lines on step 1 and the Plus line were changed after the council, see "Changed after the council (8 Nov)".
- Removes every book, letter, draft and recording, including stray recordings in both recording folders. Also removes listening copies, whole-frame copies, export and recovery ZIPs in Caches, any half-rendered print PDF in `Caches/Print` (the whole-book PDF expo-print writes while an export renders; a kill mid-render leaves it), and every row of every table, with tables read from `sqlite_master` so a future table is never missed. Settings go too, and with them the analytics id.
- In the Keychain it removes the free-letter count, any pending invite, and leftovers of an unfinished sign-in (Apple's pending name and user id, the email-link request time).
- Removes our scheduled and delivered reminders. Analytics is revoked and its ids forgotten without sending anything.
- **Resets the free-letter count (D-083, D-103):** the Keychain item and the database mirror are cleared *after* the rows, so a relaunch cannot raise the count again from letters still present. `startLetterLedger` skips healing while an erase is pending.
- **App lock is read again after the rows go (`reloadAppLock()`).** `erase-everything.ts` calls `reloadAppLock()` (inside a try, not awaited) right after the rows are gone. The app lock's two settings (`appLock.enabled`, `appLock.grace`) went with every other setting, so the lock in memory starts again from the empty settings and a phone erased while locked does not lock the empty book after the age question. This is a behaviour change that came in with the merge of develop (`d26335da`, which has the app lock, #640) at **79bc4456**, so the earlier reviews at 252eadda do not cover it; it was reviewed at 79bc4456 (Review A read it against `app-lock/controller.ts` and `machine.ts`: it resets the in-memory lock to the empty settings and does nothing during a take or a system sheet). At launch no reload is needed: the root layout resumes an unfinished erase before the lock reads its settings. Pinned by the `[F1][CISO-1]` test in `erase-all.test.ts` (the setting reads "off" at the moment of the reload) and by the order test on `_layout.tsx`.
- **Returns to first run, including the age question, but never ends a running 18+ stop (LEGAL-REQ-002, D-026).** `ageGate.passed` is removed, so first run asks the question again. `ageGate.stoppedAt` is **kept while the 24-hour stop is still running** and removed once it has expired. That rule is in **`apps/mobile/src/lib/store.ts:1042-1046`** (`eraseEverythingLocal`: it reads the stored stop, asks `decideGate` whether it still says `stop`, and passes the key to `wipe.removeEverything` as the one setting to keep; line 1038 above it is only `eraseFiles()`). A damaged or future value also reads as `stop` in `decideGate`, so it is kept (reasoned from `decideGate`, no test; the age gate then rewrites it to the time it is read, which only lengthens the stop). The compliance fence does not flag `store.ts` (the repo's own classifier lists only `age-gate.ts` under CCO review), so it is named here for the CCO. Pinned by the three `(b)` age tests in `erase-all.test.ts`: a stop 2 hours old is kept exactly as stored; a stop 1 minute old is kept when a kill cuts the erase short and the next launch finishes it; a stop 25 hours old goes. The stop lives only in `settings`, never in the Keychain (unchanged: a reinstall already resets it). So "the `ageGate.*` settings are gone" is not the whole truth: one of them can stay for up to 24 hours. `useAgeGate` re-reads when settings change, so the question replaces every screen at once (see the `age-gate.ts` section).
- **Signed in:** refused, and the row is hidden. F17-REQ-026 (outbox drain, then sign out, no ledger reset) is a separate flow and is not built here.

### Constraints, and how they are met
- **Files really go from disk, and orphan sweeps resurrect nothing.** Files are always removed before rows, so the launch sweep never sees a recording without its row (it would otherwise re-attach it as a draft). The tests run the real sweep after every erase and expect `{}`.
- **Idempotent after a kill.** Marks in `settings` record that an erase began: `book.erasing.<id>` and `erase.everything.pending`. `purgeExpired` finishes a book whose erase began, whatever the clock says. `resumeEraseAtLaunch()` runs first in the root layout and removes files and rows synchronously, so the first frame already reads an empty store.
- **With servers off, nothing is sent.** Neither path queues an op or touches the network. The tests stub `fetch` to throw and assert `sync_outbox` is empty.
- No local schema change: local schema numbers belong to the coordinator (08-delivery section 4), so the book's deletion mark lives in `settings`.

## Where the deletion spec overrides the brief
The brief asked for the following; the spec says otherwise, and I followed the spec:
1. **Book delete goes to Recently deleted for 30 days**, not straight to erase. Spec 2.3 (sole parent: "Any parent can cancel within 30 days"), F17 6.2 D step 5 ("appears in Recently deleted with 'Restore the book' until day 30"), F17-REQ-080 ("restorable for 30 days") and the existing `bookUndo` copy all say so. Erase now on the book card gives the immediate path.
2. **Book delete uses a typed confirm** ("delete"), not a plain Cancel or Delete dialog (F17 6.2 D step 4).
3. **Erase everything keeps the speech model and language packs** (F17 6.2 F step 3; F17 DATA-REQ-024 row: "an empty local store except speech models and packs"). The screen says so and points to Storage.
4. **Location:** Erase everything sits in Settings, **Your data**, which holds the Privacy row (F17 6.2 F and the IA table), not inside the Privacy page.

## For counsel, legal and the CPO (proposals; no requirement document was edited)
- **Device owner authentication** (F17 6.2 F, design 2.12: Face ID or passcode before erase) is **deferred to the 1 Dec build by the CTO ruling of 8 Nov (Karma)**. It needs the app lock lane's `expo-local-authentication` (#640, not merged). Until then the system confirm is the only check.
- **New parent-facing claims:** "This happens on this phone only. Nothing is sent anywhere.", "Your free letters start again." (D-083, store build only) and, after the council of 8 Nov, "Exports you already saved, and backups of this phone such as iCloud Backup, are not changed." and "Erasing does not cancel Plus. Billing continues through Apple until you cancel." (store build, Plus renewing). Each is proven by `test/erase-all.test.ts`, except that what Apple keeps in iCloud after a later backup is not claimed. Please add them to the claims inventory if you agree.
- The existing `bookBody` says "from this phone and from our servers". It is wrong for a signed-out phone, so this flow uses the new `bookBodyThisPhone`. `bookBody` stays for the signed-in flow.
- **Follow-up for S03 (sync) and the privacy engineer:** `sync/ownership.ts` claims every `server_state = 'local'` book at the first sign-in. A book deleted on the phone and still inside its 30 days would be uploaded then. Sign-in is off in v1.0, so this cannot happen today, but it must be closed before sign-in ships. The fix is to skip books with a `book.deletedAt.` mark, or to erase them at sign-in.
- The transcription queue may still finish a waiting letter inside a deleted book during its 30 days. The text stays on the phone and goes with the book.

## Review fixes at c3e59457 (Review B and privacy Review A)

### The free-letter count never goes down (Review B, D-103)
- `store.eraseBook` now raises the ledger mirror before the rows go: `ledger.raiseTo(c, ledger.countPresent(c))`, then `wipe.removeBook`, in one transaction.
- It counts with `countPresent`, the same rule as the Keep gate. Today that rule counts letters only. Once #510 lands it also counts notes, with no change needed here.
- The day-30 test exposed the same drop one level down. The launch purge erases a book's individually deleted letters (`eraseEntry`) before the book, and `finishServerErased` does the same for letters the server erased. Both now raise the mirror the same way. This also closes D-103 for single-letter Erase now, which is outside this lane but the same bug.
- Erase everything still resets the count to 0.
- New tests start with the count behind the letters present (a backup restore before the launch heal, plus a note). The count is unchanged after Delete, Restore, Delete then Erase now, the day-30 purge at launch, and a kill part way through the book erase. Erase everything still reads 0.
- These fail without the fix: 3 of 4 tests red. The 4th, the reset, was already green.

### Erased words leave the database file (privacy Review A, blocking)
- `PRAGMA secure_delete = ON` is now set at open in `expo-adapter.ts` `OPEN_PRAGMAS`, and in the test helper `test/helpers/node-db.ts`, so tests see what the phone does.
- `store.compactAfterErase` runs `PRAGMA wal_checkpoint(TRUNCATE)` after every hard erase: book erase, single-letter Erase now, the 30-day erase, the server-erased cleanup, and Erase everything. Erase everything runs `VACUUM` first, which also drops free pages written before secure_delete was on. The step never throws: the rows are already gone, and the next erase or launch tries again.
- New tests use a real file database in WAL mode with the phone's pragmas. Each writes a letter with a distinctive word, erases it, then scans the raw bytes of `scribe.db` and `scribe.db-wal` and finds neither the word nor the child's name. They cover Erase now on one letter, the 30-day erase at launch, Erase now on a book, and Erase everything (the word, "Asha" and "Mama"). All 4 fail with the fix removed and pass with it.
- **Cost of secure_delete on a normal write.** Benchmark: node:sqlite, a file database in WAL with synchronous=FULL, 300 inserts and 300 updates of a 1.5 KB letter, 3 runs. Off: 0.76 to 0.98 ms per write. On: 0.71 to 1.13 ms per write. The difference is within noise, because the fsync in synchronous=FULL dominates. The extra work is only zeroing freed pages; VACUUM runs only on Erase everything.
- **Remaining gap:** after a book erase or single-letter Erase now, free pages written *before this build* (secure_delete was off then) can still hold older text until those pages are reused. Only Erase everything vacuums. Running VACUUM on every book erase is possible, but it costs a full file rewrite.

### Erase everything screen
A `settings.erase.backups` line was added here (content rules pass); it states the same fact as the deletion page (`pages.en.ts`, "What stays"). After the council of 8 Nov it reads **"Exports you already saved, and backups of this phone such as iCloud Backup, are not changed."** and sits directly under the body (see "Changed after the council (8 Nov)").

### age-gate.ts, for the CCO and the founder (compliance fence)
`apps/mobile/src/lib/age-gate.ts` has two changes, and the question and its rules are untouched (this section is corrected at 79bc4456; it first described the effect as three lines with `subscribeTo('settings', refresh)`, which it no longer is):
1. Line 10: the import adds `subscribeTo` from `./store`.
2. Lines 47 to 57, inside `useAgeGate()`: three comment lines and one `useEffect` that subscribes to `settings` and calls `setDecision(next)` only when the freshly read decision is **not** `pass` (the move to `pass` stays with the gate screen's `refresh` after its leave; f23fa5ab, see below).

Why: Erase everything deletes `ageGate.passed` with every other setting. Without this, the root layout keeps its in-memory "pass" until the next relaunch or foreground, so the erased phone would stay past the question. This re-reads the stored answer through the existing `readDecision()` whenever settings change. Nothing else in the file changes: `decideGate`, `answerGate`, the keys and the 24-hour stop are as they were.

**Where the 24-hour stop is kept across an erase: `store.ts:1042-1046`, not this file.** See "Returns to first run" above. The CCO should read that block with this one.

**The seam is pinned in `erase-all.test.ts`** (Review B at 79bc4456, must-fix 1). The age question returns at once only because the store emits `settings` when the rows go (`store.ts:1048`, in `eraseEverythingLocal`) and again when the pending mark is removed (`store.ts:1057`, in `finishEraseEverything`), and `useAgeGate` subscribes. The new tests subscribe to the store's `settings` event before `eraseEverything()` and before `resumeEraseAtLaunch()`, and assert two events, both after the stored answer is gone, the first with the mark still set and the second with it removed. With both emits removed, all 42 tests had stayed green; now 2 fail. Removing only the first emit, or only the second, also fails both.

### Blockers for switching sign-in on (not fixed here; backlog row being filed)
- `apps/mobile/src/lib/sync/ownership.ts:54` claims every `server_state = 'local'` book, so a book in Recently deleted would upload. `ownership.ts:78` queues `entry.upsert` for its letters.
- `apps/mobile/src/lib/backup/local-store.ts:54` (`LETTER_WHERE`) does not leave out letters of a deleted book, so encrypted backup would upload their recordings.
- `apps/mobile/src/lib/export/device.ts:130`: `listConflicts()` is not filtered by deleted book.
- F17-REQ-026: the signed-in Erase everything (drain the outbox, then sign out) does not exist. Erase everything and Delete this book are signed-out only until it does.

### For legal (docs/legal not edited; handed off in #654)
- `docs/legal/privacy-policy.md:225` says a book is deleted in "Settings, Your data". The row is in the book's own settings (Settings, the child's name, Delete this book).
- `docs/legal/privacy-policy.md:159` describes the server erase timeline, which does not apply to a phone that never signed in. On such a phone, deletion is local: 30 days in Recently deleted, or at once with Erase now or Erase everything.

### Tests run for this push (targeted, no full suites)
- `apps/mobile`: `erase-all`, `store.shelf`, `sync-erase`, `store.purge-guards`, `billing-ledger`, `store.ledger-m17`, `migrations` and `sweep.disk`: **133 passed**. `erase-all` alone: 19 passed.
- `packages/content` `rules.test.ts`: **118 passed**.

## One-time rebuild at 2fe5c94a (closes the remaining gap named above)
- `openStore` calls `vacuumOnceForSecureDelete` after the migrations, before any screen reads the store. It runs `VACUUM` and `wal_checkpoint(TRUNCATE)`, then writes `db.secureDeleteVacuumAt` (an ISO time, L2).
- The mark is written only after both steps. VACUUM is atomic, so a kill part way reruns it at the next open, and a failure is retried at the next open.
- Erase everything removes the mark with every other setting, so one more rebuild runs on the next open. That is harmless.
- The 30-day erase now also runs `VACUUM`, but only when it erased something.
- **Cost.** Measured on this machine's disk, a file database with WAL, synchronous=FULL and secure_delete, about 1.5 KB of raw text plus 1.5 KB of final text per letter, VACUUM plus the WAL truncate:

  | Letters | File size | Time |
  |---|---|---|
  | 365 | 1.5 MB | 17 ms |
  | 1,000 | 4.1 MB | 37 ms |
  | 3,000 | 12.3 MB | 111 ms |

  iPhone flash may be a few times slower. Even then it stays well under a second for years of letters. It runs once per build, and otherwise only when the 30-day erase actually erased something.
- **Test.** Write a letter, then act as an earlier build: secure_delete off, plain DELETE, WAL folded into the file, no mark. The word is then found in the raw bytes. After this build's first open it is gone, the mark is set, and a later open does not run the rebuild again. The test fails with the rebuild call removed.
- `erase-all` plus the related store, ledger, migration and launch tests: **223 passed**.

## Review B fixes at 7b40323a (Review B comments 6719641362 and 6719654418; CTO ruling 8 Nov)

**New head, so reviews reset.** CR-44 needs two counted reviews on 7b40323a. The branch also now contains `origin/develop` (merge 05ac92f5, which another session pushed; #640 app lock is not in it).

- **Strings are content.md 4.11 word for word at that push** (`packages/content/src/strings.en.ts`, `settings.erase`): `title` "Erase everything on this phone", `body` "This removes every book, letter and recording from this iPhone, and your settings. We hold no copy.", `exportFirst` "Save a copy first?", `exportButton` "Export your book", `button` "Erase everything", `confirmTitle` "Erase everything on this phone?", `confirmBody` "This cannot be undone.", `confirmButton` "Erase", `busy` "Erasing", `doneA11y` "Everything on this phone is erased.", `failed` (replaces `incomplete`; it read "Erasing did not finish. Try again." at that push and is reworded after the council of 8 Nov, see above). The typed-word strings (`typeLabel`, `typeWord`) are gone. Lines kept from earlier reviews that 4.11 has no key for: `heading`, `freeLetters` (hidden in alpha), `speechStays`, `onThisPhone`, `backups`, `back` (now the confirm's cancel), `signedIn`.
- **Confirm flow is design 2.12 (CTO ruling):** `app/settings/erase.tsx` drops the typed word. Step 1's destructive **Erase everything** plays `warning` and opens `Alert.alert` built by `eraseConfirmDialog` (`components/settings/wipe.logic.ts`): Keep everything first (`style: 'cancel'`, no action), Erase second (`style: 'destructive'`). Erase runs `runEraseEverything`: the Erasing screen first (`StateScreen kind="loading"`, `headerBackVisible` and `gestureEnabled` off, Android back held), then the erase. On success the age question replaces every screen and `doneA11y` is announced. On failure or refusal the page comes back with one line.
- **Deferred:** device authentication before erase, to the 1 Dec build (CTO ruling 8 Nov; needs #640).
- **Book delete is unchanged:** it keeps its typed "delete" (F17 6.2 D step 4); `typedWordMatches` stays for it.
- **Tests** (`apps/mobile/test/erase-all.test.ts`, new describe): the 4.11 strings pinned; the dialog's buttons, order and styles, with the screen showing it after the warning haptic and no typed word; cancel has no action and erases nothing; Erasing comes before the erase runs and the done line is announced; a failed, refused or throwing erase returns to the page with one line. The existing guard tests (age stop, backup keys, single caller of `eraseEverything()`, the alpha line) still pass.
- **Device row S1-133** in `docs/qa/DEVICE_TEST_PLAN.md` (renumbered from S1-132 at 7456d3b4, because #517 also took S1-132; S1-133 is on no other open branch or PR). **RT-BK-12** (`scripts/qa/release-catalog.rows.mjs`, CSV regenerated) is now `device` lane, `partial`, citing SR-C-07 and `erase-all.test.ts`. S1-133 is named in its expected text because the catalog resolver accepts only two-digit S1 ids. #517 widens it to three digits; once #517 merges, a follow-up makes RT-BK-12 cite S1-133 directly.
- **Run for this push** (NODE_OPTIONS=--max-old-space-size=3072): `erase-all`, `billing-alpha`, `qa-release-catalog`, `design-system-gaps`, `qa-kill-harness`, `sweep.disk`, `billing-plan-reminders-scheduler`, `plain-screen`, `book-shelf`, `lamp`: all pass (`erase-all` plus `billing-alpha`: 49 tests). `packages/content` full: 280 passed. `npm run typecheck -w @scribe/mobile`: clean.
- **Compliance fence:** this PR still changes `apps/mobile/src/lib/age-gate.ts` (unchanged since 00474364), so it needs the founder's CCO approval line on 7b40323a. The CPO's view also needs to be current on this head (T2).

**Head after renumber: 7456d3b4** (docs only: S1-132 to S1-133 in DEVICE_TEST_PLAN and the RT-BK-12 expected text). Reviews reset again.

## Review A fixes at f23fa5ab (Review A comment 6719835599)

**New head, so reviews reset.** CR-44 needs two counted reviews on f23fa5ab, and the founder's CCO approval for `age-gate.ts` must be on this head.

- **age-gate.ts, blocking finding:** the settings subscription now changes the decision only when the new decision is not `pass`. Before this, writing Yes passed the gate at once and unmounted it before the screen's leave (`age-gate-screen.tsx`). Now Erase everything still brings the question back at once and No still goes to the stop. The move to `pass` stays with the screen's `refresh` after its leave. The change in `useAgeGate()` is still exactly the import of `subscribeTo` plus one effect. `decideGate`, `answerAgeGate`, the keys and the 24-hour stop are unchanged. #635 edits the same area, so whichever PR lands second rebases.
- **Behaviour test:** `apps/mobile/test/age-gate-erase.test.ts` runs the hook on the React stand-in with a store that emits on every write. It checks three things:
  - Yes keeps the gate (`ask`) until `refresh`, then it passes.
  - An erase of every setting brings `ask` back with no refresh.
  - A write of `ageGate.passed` behind the hook's back never passes it.
  - With the old subscription put back, 2 of the 3 fail.
- **PRIV-R01:** the `Data classes touched:` line is at the top, and the legal handoff is #654.
- **Keep test:** Erase everything now also checks that a language pack in `Library/Application Support/packs` stays.
- **Not changed:**
  - The `speechStays` line. content.md 4.11 has no string for it, and no content.md string covers the speech model staying, so it is left as is. A rewording needs a `content` ruling.
  - The reviewer's other nits are not done in this push: the `speech.download` consent key being erased and then re-derived from the kept model, a cap or notice for a pending erase that never finishes, and the backlog row for the sign-in blockers.
- **Run:** `age-gate-erase`, `erase-all`, `billing-alpha`, `age-gate`, `age-gate-screen`, `lamp`, `recording-format` and `server-surfaces-auth-screens` all pass. `npm run typecheck -w @scribe/mobile` is clean.

## Reminders fix at b3319be8 (Reviews A and B at 6887bd63, after #624)

**New head, so reviews reset.** 6887bd63, pushed by the sync agent, merged develop, which includes #624. #624 made the scheduler's `chain` a `Promise<ScheduleResult>`, so `forgetReminders` failed typecheck (TS2322).
- `apps/mobile/src/lib/reminders/scheduler.ts`: `forgetReminders`' `run` returns `OK`, and the function awaits the chain. It also resets `lastResult` to OK and tells the listeners, so a "Could not set reminders just now." from before Erase everything does not show on the fresh first run.
- `apps/mobile/test/reminders-erase.test.ts` (new) runs the real `forgetReminders` against #624's real scheduler and the real store, with no mock of the scheduler module. Only the native notification module is replaced, by a stateful stand-in. After a failed re-plan, the erase removes every scheduled and delivered reminder of ours and keeps another app's. `lastScheduleResult()` is then OK, and listeners are told once. The test fails with the reset removed, and with the cancel removed.
- **Run:** the erase and reminders tests pass (`reminders-erase`, `reminders-inline`, `reminders-switch`, `reminders-planner`, both `billing-plan-reminders` files, `erase-all`, `age-gate-erase` and `billing-alpha`: 190). `npm run typecheck -w @scribe/mobile` ran to completion and is clean.

## Fixes after the reviews at 79bc4456 (Review A PASS WITH NOTES, Review B CHANGES)

**New head, so reviews reset** (CR-44 and CR-52 need two counted reviews on it, and the compliance fence needs the CCO line on it). This push is tests, one folder name and the device plan; no user-facing string changed. A second push (Review B at 8a8db627) is text only: the S1-133 (k) warning, the L3 and L2 labels in two comments, and this body. No behaviour changed.
- **Review B, must-fix 1: the settings emit is pinned.** See the `age-gate.ts` section. Two new tests in `erase-all.test.ts`. Mutations, each in a clean tree: both emits removed fails 2; first only fails 2; second only fails 2.
- **Review B, must-fix 2: S1-133 step (c)** no longer says "Settings > Storage shows less used". That screen lists only language and speech downloads. The step points at iPhone Settings > General > iPhone Storage (the figure updates slowly) or, on a development build, step (i). Step (f)'s "Settings > Storage still lists the English speech download" is right and stays.
- **Review B, must-fix 3 and 4:** the body now says what the code does with the 18+ stop and names `store.ts:1042-1046` for the CCO (see "Returns to first run" and the `age-gate.ts` section), and the classification of the four new keys is recorded at the top (corrected after Review B at 8a8db627: two L3, two L2).
- **Review A, note 1:** `reloadAppLock()` is now in the body (see the Erase everything bullets).
- **Review A, note 3: `Caches/Print` is erased.** `CACHE_COPIES` in `erase-everything.ts` gains `'Print'`. expo-print writes the whole book there while an export renders (`export/device.ts` deletes it in `finally`, but a kill mid-render leaves it, and `cleanupExports` does not look there). Three tests fail without it: the main Erase everything test, the kill-while-files-go test, and a new one with a second PDF in the folder.
- **Review A, note 4: plan reminders stay on purpose.** `forgetReminders` removes the `el.` reminders only. Plan reminders (`plan.` ids, trial and yearly renewal notes) belong to the Apple Account subscription and say nothing about a child. S1-133 step (f) said "no reminder from the app", which is false for a Plus subscriber; it now says none of the app's letter reminders, and that a plan reminder staying is not a fail. No effect in the alpha build.
- **Review A, the upgrade step:** new S1-133 step (k): install this build over build 9 with its letters, open it (the one-time rebuild of the database file runs on that first open), and confirm every letter, book and recording is intact. That first part runs on any phone. Its second part, (d) to (f), is Erase everything and cannot be undone, so it opens with a warning: run it only on a test phone with Asha's book, or on a phone with real letters only after the book was exported (Settings > Your data > Export your book), saved to Files off the phone, and the file opens (Review B at 8a8db627, must-fix 1). Counts only in the record.
- **Not changed, on purpose:**
  - Review B's missing steps (the only book deleted, then a kill and relaunch; answering No after an erase, then a kill and relaunch inside 24 hours) are not added to S1-133 in this push.
  - Review A note 2 and Review B's wording points: the failed line does not say the next launch finishes the erase (done after the council of 8 Nov, see above), and the done line is broader than true (the speech model, language packs and exports already saved stay; still unchanged, it needs a `content` ruling).
  - Review A note 5 (`resumeEraseAtLaunch` and a busy or full-disk error at launch) and note 6.
  - The `store.ts:184-188` doc-comment order, a hook-plus-real-store test of the age question, and the backlog row for the sign-in blockers.
- **Run for this push** (apps/mobile, one fork; `NODE_OPTIONS=--max-old-space-size=3072`): `erase-all` 40, `age-gate-erase` 3, `reminders-erase` 2, `age-gate` 5, `age-gate-screen` 2, `app-lock-behaviour` 13, `billing-alpha` 16: 81 passed. All `store.*` and `sweep*` files: 15 files, 256 passed. `qa-kill-harness` 50, `qa-release-catalog` 8, `billing-plan-reminders-scheduler` 16 and the packs adapter guard 3 pass. `packages/content`: 12 files, 281 passed. `npx tsc --noEmit` in apps/mobile: only the known missing-module errors (`expo-clipboard`, `expo-local-authentication` and the three cascade errors from the second); CI typecheck is the check that counts. Merged `origin/develop` (cda0ba83) into the branch: clean, no conflicts.

## Files touched (globs)
- `apps/mobile/src/lib/db/repos/{wipe,children,index}.ts`, `apps/mobile/src/lib/store.ts`
- `apps/mobile/src/lib/erase-everything.ts` (new; it also calls `reloadAppLock()` from `lib/app-lock/controller.ts`, which this PR does not edit), `apps/mobile/src/lib/capture/{erase,recordings}.ts`
- `apps/mobile/src/app/settings/{erase,index,recently-deleted}.tsx`, `apps/mobile/src/app/settings/children/{delete-book,[id]}.tsx`, `apps/mobile/src/app/_layout.tsx`
- `apps/mobile/src/components/settings/wipe.logic.ts` (new), `apps/mobile/src/components/book/shelf.logic.ts`
- Outside the lane's core files, each change kept minimal:
  - `lib/age-gate.ts`: re-read on settings change.
  - `lib/billing/gates.ts`: skip healing while an erase is pending.
  - `lib/reminders/{scheduler,index}.ts`: `forgetReminders()`.
  - `lib/analytics/index.ts`: `stopAnalyticsForErase()`, which sends nothing.
  - `lib/auth/apple.ts`: two key constants exported.
  - `lib/README.md`: documents the new keys.
- `packages/content/src/strings.en.ts`: new `settings.erase.*` and book delete strings, plus the `bookTypeToConfirmLabel` Rev.
- `apps/mobile/test/erase-all.test.ts` (new), `apps/mobile/test/billing-alpha.test.ts` (the alpha guard for the Erase page)
- `docs/qa/DEVICE_TEST_PLAN.md` (S1-133)

`otherAudioUris` in `capture/erase.ts` now leaves out the row being erased in drafts as well as letters. Without that, a draft erased with its book counted as another owner of its own file, and the file stayed on disk.

## Tests
`apps/mobile/test/erase-all.test.ts` runs on a disk laid out like the phone's (`expo-fs-standin`), a real SQLite store, and the real erase, launch sweep and letter ledger. Each relaunch is `vi.resetModules()` over the same database.

Book delete:
- Hides the book from lists and Export, and Restore brings it all back.
- Erase now removes the book's files and rows, leaves the other book alone, and the sweep re-attaches nothing.
- The 30-day purge leaves the book alone at day 29 and erases it at day 30.
- A kill part way through is finished by the next launch, and Restore is no longer offered.
- A signed-in phone is refused.

Erase everything:
- Every table is empty and every file is gone except the model. The Keychain is empty, `lettersKept` is 0, no age answer remains, and `fetch` is never called.
- A kill while files are going is finished by the next launch.
- A kill after the rows went but before the Keychain was cleared: the next launch clears the count.
- A signed-in phone is refused.

Results (this machine was short of memory, so the suites ran a few files at a time):
- `cd apps/mobile && npx vitest run test/erase-all.test.ts`: **11 passed**. These tests fail on `develop`, where none of these functions exist.
- `apps/mobile`, the whole vitest suite in batches of 6 files, one worker: 3,484 passed across 30 batches, with 3 batches red. All three were checked:
  - `e2e-seams-wiring`: real. Root's first line must be `useE2eSeams()`. Fixed by moving the resume call to the second line; the file then passed 12/12.
  - `account-deletion-switch` (2 preflight cases) and `hosting-ios17` (1 case): timeouts under load on this machine. Re-run alone, both pass (26/26 and 5/5).
- `cd packages/content && npx vitest run`: **236 passed**. `npm run typecheck -w @scribe/content`: clean.
- Typecheck of apps/mobile: the full `tsc --noEmit` was killed by the out-of-memory killer on this machine (three tries). A `tsc` program rooted at every changed screen, `_layout.tsx`, `erase-everything.ts`, `gates.ts` and the new test compiled with **0 errors**. It pulls in `store.ts`, `wipe.ts`, `erase.ts`, the scheduler, analytics and `age-gate.ts` transitively. CI's full typecheck is the check that counts.

**Device check:**
- **DEVICE_TEST_PLAN S1-133** (added at 7b40323a; replaces the earlier wrong citation of DL-01, which is "Kill mid-record, 500 runs"): (a) to (c) Delete this book, Restore, Erase now; (d) to (f) Erase everything with the confirm, Keep everything does nothing, Erasing, then the age question, none of the app's letter reminders in Notification Center (a Plus subscriber's plan reminders stay on purpose), Storage still lists the English speech download; (g) a kill right after confirming; (h) VoiceOver and AX5; (i) optional container check; (j) app lock; (k) install over build 9 with its letters, check them, then (d) to (f); (l) store build only, the Plus line (added after the council of 8 Nov; (d) and (h) carry the new order). RT-BK-12 in the release catalog cites the tests and names S1-133.

No web journey step was added. Journeys J03-07 and J16-01 should gain a step when the web preview runs these flows.

---

Original session: https://claude.ai/code/session_01G82fptTnv2meo7WKb4HBUo

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
