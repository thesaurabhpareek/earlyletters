## Review B at 9d575bde7d4782fed5148372f7102756e79a72ca: PASS WITH NOTES
<!-- agent:red-team -->

Lens B: governance and accuracy of CR-64 and CR-65. This is the confirm round after my CHANGES at b9364f5f. Reviewer: red-team (principal reviewer). I confirmed head 9d575bde through REST. It is one commit on b9364f5f and changes only docs/agents/cto/RULINGS.md (+9 -7 since round 1; +22 against develop). The merge base is still 1513b265; develop has since moved to 8343d119 (#848, skills only, no ruling heading). Read-only: I posted nothing and changed no repo file.

Must fix: none.

Round 1's must-fix is closed. CR-64's Door (:617) and Way back (:618) now hold only "while no build a family uses has had the switch on". After such a build, removing photos is "a founder decision, with the export offered first (NS-01-R14)". The folder step now gives #835 Review A N6's actual reason: "once the table is gone nothing else sweeps them". Every new claim is true against its source, with the small exceptions in the notes below.

### Round 1 notes
1. CR-64 Why (1): handled. It now names the right phone ("whose first version-11 build had the switch off") and gives option 1 a technical reason, but overstates its cost (new note 1).
2. #850: partly handled. At d14780ea the six memories no longer give the retracted launch reason. But they copy round 1's Why (1) wording, "a phone that later runs a switched-off build", which this round corrected. They should match :615. That is #850's author's to fix, not this PR's.
3. The Expo forum clause: closed. It now reads "Apple developer forum thread 744965 reports a TestFlight rejection". The thread says "getting rejected from TestFlight" (fetched in round 1).
4. The evidence for "PHPicker needs no permission": closed. It now cites Apple's documentation as quoted in #834 Review B at 1356cb8a ("a separate process ... doesn't need to explicitly authorize").
5. CR-65's way back: closed. It now names R22, the scan test and NOT_SHIPPED (check 2).
6. Pre-mortems: closed. Both entries now have one (:616, :628).
7. The three indexes: closed (:614).

### New claims checked
1. **CR-64.**
   - **Why (1), CREATE-only:** true. With only the CREATE gated, a phone whose first v11 build had the switch off is left at user_version 11 with no table, and migration 11 never runs again.
   - **Why (1), whole list:** true. A switched-off build stops at v10, while a phone from a switched-on TestFlight build sits at 11 as `newer` and keeps running (launch.logic.ts:12-17).
   - **"which run with the switch off":** true. The eraser and Keep reach entry_media whatever the switch says (#835 Review B check 1: "None of these reads the photos switch").
   - **"the next local migration (the seal, ADR 0028 D3)":** matches ADR 0028:63, "The seal (D3) takes the next free number when it is built".
   - **Pre-mortem (1):** true. #852 Review A N6 says the inventory rows are due with #835. DATA_CLASSIFICATION.md is under docs/legal, which the founder merges (D-125).
   - **Pre-mortem (2):** true; that is this ruling.
   - **Pre-mortem (3):** the downgrade case matches #835 Review A N6's second bullet. "Detected by" is loose (new note 4).
   - **Door:** true. `photo_text` is "the parent's own words about the picture" and `place` is "typed by the parent", both L4 (migrations.ts:444-445 at f55be7b8).
   - **Way back (a):** a new local migration. Real.
   - **Way back (b):** at f55be7b8, the readers that run with the switch off are store.ts:512 (Keep's UPDATE), device.ts:63-67 (erasePictureOf) and housekeeping.ts:23-52 (the sweep), as named. The list is 3a's (new note 2).
   - **Way back (c):** real, and now cites the right reason (N6's third bullet).
   - **Way back (d):** compactAfterErase exists on develop (store.ts:958-964): `PRAGMA wal_checkpoint(TRUNCATE)`, plus VACUUM when `full`. Real; the last words overstate a little (new note 5).
   - **NS-01-R14:** develop :61, "the stored stripped copy is included" in the export. True.
2. **CR-65.**
   - **Pre-mortem (1):** true. ScribePhotoModule.swift on develop has the busy guard (:126-128, `PickerSession.current`), a 2 s presentation watchdog (:152-156) and `viewDidDisappear` answering a Cancel (:305-306). photos-device.test.ts pins each one with a scan and named mutants (:232, :262-268, :341-342, :435-437, :452). These are source scans, not device runs.
   - **Pre-mortem (2), and the way back's `photos-device.test.ts:500`:** true. On develop, :497-504 (added by #834, 76a4a5d7) checks six names, expo-image-picker and expo-image-loader among them (:500). It asserts each is absent from apps/mobile/package.json dependencies and that the root package-lock.json has no `node_modules/<name>"` entry, so a package arriving through another dependency also fails.
   - **"move expo-image-loader to NOT_SHIPPED in the licences list":** real. `NOT_SHIPPED` is scripts/licences/components.mjs:183, defined at :10-12 as Android-only and other code that is not in the binary. #833 Review A must-fix 1 says the same.
   - **"the locked card forbids the package in the lockfile":** true of R22 on docs/prd-lock-v1-20nov (:148). #846 is still open (new note 7).
   - **Pre-mortem (3) and the Revisit line:** unchanged and true.
3. **Governance.**
   - Tiers, types and doors still fit SKILL sections 4 and 5. CR-64's Door now carries the condition that section 3 ("deleting user data" after launch) requires.
   - Neither entry decides a founder or counsel question. Both send the deletion and the camera to the founder.
4. **Required CI at 9d575bde:** green. "applied migrations unchanged", "required" and "compliance-fence" (develop's three required contexts, read from the branch protection) all passed. So did agent team consistent, database rules, edge functions and ops scripts (Deno), install, no e2e seam in store bundles (B-8), tests and content rules, typecheck, and the Vercel status.
5. **Ids:** no collision. develop's id-collisions.mjs with --pr 852, re-run against develop 8343d119 and the live open PRs, says "PR #852 adds no id that develop or another open PR already has." CR-64 and CR-65 appear nowhere on develop.
6. **ASCII:** 0 non-ASCII bytes on the added lines.

### Notes (most serious first)
1. **Why (1) (:615) overstates option 1's cost.** It says "either way every eraser and Keep ... would need guards and a second, lazy create". Only the CREATE-only gate needs the lazy create. With the whole list gated, a v10 phone that later runs a switched-on build migrates to 11 the normal way, so it needs guards only. Suggest "would need guards (and, with only the CREATE gated, a second, lazy create)".
2. **Way back (b)'s list (:618) covers 3a's readers, not the stack's.**
   - By #840 (f811c9a6), entryMediaStore (entry-media.ts: put, get, all, remove) has callers: 3b's commit, 4c's attach and photoUri, and the lens in slice 5.
   - erasePictureOf also runs for a letter erased on another phone, for a book's erase and for Erase everything, not only "the erase and 30-day purge".
   - #798's Find source reads entry_media but checks `hasColumns` first (find/sources.ts:51 at 7f36031a), so it survives a drop.
   - The rule ("every reader of entry_media goes") is right. Name entry-media.ts, or write "at least".
3. **When the window closes.** PRD 01:166 turns EXPO_PUBLIC_PHOTOS on "in testflight and preview first". If beta families use TestFlight (CR-60's beta Terms), the two-way window ends at the first TestFlight build with the switch on, not at a store build. ":617 a build a family uses" already covers that. But pre-mortem (3) ("which today means a TestFlight phone") can be read as if TestFlight phones were not family phones. One clause would settle it, and the founder should know the window may close early.
4. **Pre-mortem (3) (:616), "detected by the photos sweep of the next newer build".** The sweep removes the leftovers but reports nothing: sweepPhotosAtLaunch discards the result (device.ts:49-53 at f55be7b8). "Removed by" is exact.
5. **Way back (d), "so old pages leave the phone".** The checkpoint clears scribe.db-wal. Copies in an earlier iPhone backup stay until the next backup (#852 Review A N3 asked for one line for `privacy`). "leave the database files" is exact.
6. **CR-64 pre-mortem (1)'s prevention has no tracker.** #852 Review A N6 found no issue naming entry_media, and #835 Review A N2 asked for a hand-off to `privacy`. Until an issue or a line in #835's merge conditions holds it, nothing enforces "due with #835".
7. **Nit, CR-65 Way back (:629).** "the locked card" is R22 on #846, which is still open; R22 on develop does not mention the lockfile. Write "R22 as locked in #846".

### Not verified
- The Project docs `infra/cto-rulings-*`, which are not reachable from here.
- Whether beta families use TestFlight builds today, and whether any TestFlight phone has ever run with photos on (note 3).
- The scribe-photo picker on a device. Pre-mortem (1)'s tests are source scans.

Reviewer: independent of the author (CR-44).
