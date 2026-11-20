## Review A at 9d575bde7d4782fed5148372f7102756e79a72ca: PASS WITH NOTES

Lens A (accuracy: every claim true against its source; nothing breaks the harness). PR #852, round 2: two CTO rulings, CR-64 and CR-65, added to `docs/agents/cto/RULINGS.md:610-630`, one file, now +22. Judged against `develop` 8343d119baa09ad08aeae3c87eb3724e72a4e363 (merge base 1513b265; RULINGS.md is unchanged since #845). Reviewer: `principal-architect` steward session. I wrote none of it. I read the two earlier reviews at b9364f5f: Review A (data-steward, 7031305435, PASS WITH NOTES, N1 to N7) and Review B (red-team, 7031399865, CHANGES).

### Read

- `git diff b9364f5f 9d575bde` and the whole entries at the head; the PR body, including "Round 2".
- CR-64 sources:
  - #835 at f55be7b8: `apps/mobile/src/lib/db/migrations.ts:428-470` (the table, `photo_text` L4 at :444, `place` L4 at :445, three indexes at :465-467), and every `entry_media` reader under `apps/mobile/src`: `photos/device.ts:63-67`, `photos/entry-media.ts:25-61`, `photos/housekeeping.ts:23-52`, `store.ts:512`.
  - The same `git grep` at #840 (the top of the stack): no new reader file.
  - #835 Review A (7030299792) note N6, all three bullets.
  - `launch.logic.ts:9-18` and `store.ts:951-965` (`compactAfterErase`: `PRAGMA wal_checkpoint(TRUNCATE)`, VACUUM when `full`) on `develop`.
  - ADR 0028 D1 (:27-63) and D3/D3a; CR-62 (`RULINGS.md:570-592`).
  - `docs/product/prd/01-photo-with-a-letter.md` NS-01-R14, R19, and :166 (switch on in `testflight` and `preview` first).
  - `EXPO_PUBLIC_PHOTOS` across `eas.json`, `app.config.ts` and `src` on `develop`, #835, #840 and #842: no profile sets it.
- CR-65 sources:
  - `apps/mobile/modules/scribe-photo/ios/ScribePhotoModule.swift:135-139, 149-152, 239, 280, 305-306` on `develop`, the same at #834's merge 76a4a5d7.
  - `apps/mobile/test/photos-device.test.ts:232-268, 435-452, 497-504` on `develop` (blame: 76a4a5d7).
  - `scripts/licences/components.mjs` (`NOT_SHIPPED`).
  - NS-01-R22 on `develop` (:69) and on #846 (open, :148).
  - #834 Review B at 1356cb8a (7027747183), lines 33-38.
  - Apple developer forum thread 744965, fetched this run: "I have an app that is getting rejected from TestFlight because of this error: ITMS-90683 ... NSCameraUsageDescription".
  - Apple's "Delivering an Enhanced Privacy Experience in Your Photos App", documentation JSON fetched this run: "Because the system manages its life cycle in a separate process, it's private by default. The user doesn't need to explicitly authorize your app to select photos".

### Ran (scratch worktree, removed after)

- At the head: `node scripts/agents/check.mjs` exit 0; `node --test scripts/agents/*.test.mjs` 149 pass, 0 fail.
- Head plus `develop` 8343d119 (scratch merge): check.mjs exit 0; 149 pass. `git merge-tree` against `develop`: clean.
- `node scripts/agents/id-collisions.mjs --pr 852`: "PR #852 adds no id that develop or another open PR already has", exit 0.
- Real-family-data scan: 11 pass. Added lines are ASCII only. 20 Nov 2026 is a Friday.
- Required CI at the head: `applied migrations unchanged`, `required` and `compliance-fence` success, and every other check-run success.

### Review B's must-fix: closed

The way back (`:618`) and the Door (`:617`) now hold only "while no build a family uses has had the switch on". The entry says that after such a build the table holds `photo_text` and `place` (L4, `migrations.ts:444-445`) and the folder holds the pictures, so going back deletes user data. Removing photos then becomes a founder decision with the export first (NS-01-R14), which matches the CTO skill section 3 ("deleting user data"). The folder step now gives #835 Review A N6's third-bullet reason, which is true: once the table is gone, nothing else sweeps the folder.

### Claims checked, CR-64

1. Ruling (`:614`): one empty table with its three indexes and `user_version` 11; no row, file, folder or sync item. True (`migrations.ts:428-470`: `IF NOT EXISTS`, no row change, no enqueue).
2. Why (1) (`:615`):
   - Gating only the CREATE leaves a phone whose first version-11 build had the switch off without the table. True: the version is spent and never re-run.
   - Gating the whole list leaves a switched-off build serving version 10 and version 11 phones. True.
   - The erasers and Keep run with the switch off: `device.ts:63`, `store.ts:512`.
   - The seal's local migration would be numbered around a switch-dependent 11. The phone schema change is inferred: D3a puts the seal columns on `entries` and says they reach the author's own phones.
   - The retraction: true (`launch.logic.ts:12-18`; #835 Review A N6, first bullet).
3. Pre-mortem (`:616`):
   - (1) The inventory rows are due with #835: matches #852 Review A N6.
   - (2) Every phone has the table: follows from the ruling.
   - (3) A v10 downgrade leaves pictures until a newer build's sweep: matches #835 Review A N6, second bullet.
4. Way back (`:618`):
   - (a) A local migration drops the table: sound.
   - (b) The readers it names do touch the table: Keep (`store.ts:512`), `erasePictureOf` (`device.ts:63-67`), the sweep (`housekeeping.ts:23-52`).
   - (c) The folder path is ADR 0028 D1's; "both picture caches" are `ImagePicker` and `ScribePhoto`, which Erase everything removes at #835 (`erase-everything.ts:51`). Repeat-until-empty is sound.
   - (d) `compactAfterErase` does checkpoint and truncate the WAL (`store.ts:958-965`), so the old page images leave `scribe.db-wal`.

### Claims checked, CR-65

5. Why (`:626`):
   - Thread 744965 reports a TestFlight rejection: true (fetched).
   - PHPicker runs out of process and needs no authorization: true (Apple, fetched; quoted in #834 Review B :38).
   - `expo-image-loader` is Android-only: true per #833 Review A, as before.
6. Pre-mortem (`:628`):
   - (1) Single-flight (`PickerSession.current`, Swift:239), the 2 s watchdog (`presentTimeout`, :58, used at :155) and `viewDidDisappear` (:305-306) are all in #834's merge. Their scan and mutation tests are at `photos-device.test.ts:232-268, 435-452`.
   - (2) The lockfile scan is `photos-device.test.ts:497-504`.
7. Way back (`:629`): `photos-device.test.ts:500` is that test's package list on `develop`; `NOT_SHIPPED` exists in `scripts/licences/components.mjs`; the R22 change follows.

### Findings

Must fix: none.

Notes (do not block):

1. CR-65 Why: "needs no permission and no purpose string (Apple's PHPicker documentation, as quoted in #834's Review B)". The Apple page says no authorization; it says nothing about Info.plist keys. "No purpose string" is the inference, and #834 Review B (:195) leaves App Store processing's view of the Photos references unverified. Say "needs no authorization (Apple), so the picker itself needs no purpose string", or cite NS-01-R22 alone for that half.
2. CR-65 way back: "the locked card forbids the package in the lockfile" is the locked R22 on #846 (open, :148). R22 on `develop` (:69) does not mention the lockfile. Name #846 until it merges. `photos-device.test.ts:500` moves to :544 if #842 merges first.
3. CR-64 pre-mortem (3): "which today means a TestFlight phone". Today no build has had the switch on (no profile sets `EXPO_PUBLIC_PHOTOS` on `develop` or in the stack), and PRD 01:166 plans `testflight` and `preview` first. Say "a TestFlight or preview phone, once one has the switch on".
4. CR-64 way back (b) names three readers. The photo store in `photos/entry-media.ts:25-61` also reads the table once later slices wire it in (Review, the letter page, the lens). "Every reader" covers it, but listing it closes the set.
5. Not taken from round 1:
   - #852 Review A N3's last point, a line for `privacy` that pictures already in an iPhone backup stay there until the next backup (CR-62 D1).
   - #852 Review B note 6's framework name for Why. CR-62 and CR-63 do not name one either.

Not verified:

- That no TestFlight or preview phone has ever run #796's switched-on build. That decides whether the way back's condition already fails on some phone, a gap both earlier reviews also list.
- The Project docs `infra/cto-rulings-*` for ruling numbers. They are not reachable from here, but `id-collisions.mjs` covers `develop` and open PRs.

This PASS WITH NOTES holds at this exact head. Re-read if the head moves.

Reviewer: independent of the author (CR-44).
