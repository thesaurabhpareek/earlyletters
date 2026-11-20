## Upgrade drill: TestFlight build 9 (schema v8) -> develop tip 374a249e, and -> tip + PR #635 (7566abd0)

VERDICT: PASS for both targets. No letter, draft or setting is lost, rewritten or locked out by the migrations. One intended one-time screen (PR #635) and one intended counting change (develop) are listed below.

### What the upgrade is
- Build 9 (29dcd7d8) ships schema v8. Steps 1 to 8 are byte-identical in all three trees (git diff of migrations.ts only appends).
- Develop tip adds v9 (PR #522): 4 x `ALTER TABLE drafts ADD COLUMN` (review_put_back, review_view, review_text, review_base, all nullable TEXT) + user_version=9. No UPDATE, INSERT, DELETE, backfill, drop, rewrite or index build.
- PR #635 adds v10: `CREATE TABLE IF NOT EXISTS agreements` + `CREATE UNIQUE INDEX agreements_once` + user_version=10. No backfill (build 1 installs get no row on purpose).
- Runner: each step is `db.transaction(() => { m.up(); PRAGMA user_version = n })`, BEGIN/COMMIT/ROLLBACK, same shape as expo-sqlite 57.0.3 `withTransactionSync`. A file with a higher user_version is returned untouched (`newer`). No other open PR touches migrations.ts (scanned all 125).
- `git merge --no-commit --no-ff origin/pr-635` onto tip 374a249e: clean, zero conflicts (DEVICE_TEST_PLAN.md and strings.en.ts auto-merged).

### Harness (scratch, not committed; files in scratchpad/drill/)
- `zz-drill-seed.test.ts` run at 29dcd7d8 through the app's own store API on a real FILE db (app's nodeDb helper + app's OPEN_PRAGMAS WAL/synchronous FULL). Fictional Asha only: child + birthday; typed letter; spoken letter with audio uri + engine edits; letter before birth and one backdated; deleted letter; a note; a quiet-day mark; voice-only letter waiting; held draft; draft in 'recording'; ready spoken draft; unrecoverable take; orphan audio row; 14 settings (ageGate.passed=1, activeChildId, speech.download, analytics consent, etc.). Pristine: 8 entries, 4 drafts, user_version 8, sha256 6c7db002.
- `dump.mjs` (independent of app code): every table, all columns, ordered, plus schema, user_version, integrity_check. `diff.mjs`: row-by-row. `zz-drill-launch.test.ts`: real `openStore` -> `migrate`, then read APIs (listChildren, listEntriesForChild, getEntry each, listDeleted, listDrafts, listHeldDrafts, getDraft each, ledger, Book chapters + openers, shelf rows, Tonight cards, exportSnapshot + planExport + the whole export ZIP via packExport).
- Controls: build 9 code reopening the pristine copy gives an identical dump hash. A deliberately corrupted copy (one raw_transcript + one draft row) is flagged as 3 unintended differences, so the harness can fail.

### Result per target (a) to (g)
| | develop tip (v9) | tip + #635 (v10) |
|---|---|---|
| (a) integrity_check / foreign_key_check | PASS ok / 0 (schema declares no FOREIGN KEY, so the second is vacuous) | PASS ok / 0 |
| (b) user_version | PASS 9 | PASS 10 |
| (c) diff vs pristine | PASS, 0 unintended | PASS, 0 unintended |
| (d) read APIs vs build 9 | PASS, see differences | PASS, see differences |
| (e) second launch no-op | PASS file sha256 identical before/after (93f2ec1c), migration from=to=9 | PASS sha256 identical (0768aef3), from=to=10 |
| (f) SIGKILL mid-migration | PASS K=1..5 | PASS K=1..8 |
| (g) raw_transcript byte-identical | PASS | PASS |

(c) Every pre-existing row byte-identical on every pre-existing column: children 1, child_member_prefs 1, drafts 4, entries 8, orphan_audio 1, settings 14, sync tables 0. Page diff: only sqlite_schema pages 1, 23 (and 24 for v10) changed; no entries, drafts or settings data page was rewritten.
- Intended, v9: drafts gains 4 columns, NULL in all 4 draft rows; drafts DDL text changes; user_version 8->9.
- Intended, v10 (on top): new empty table agreements (10 columns), index agreements_once; user_version 10.
- Unintended: none.

(d) 31 top-level read results (deep-compared, every leaf) against build 9 over the pristine copy: 3 leaves differ on tip, 4 on tip + #635, all listed below. Identical: all 7 live letters, each getEntry, Recently deleted list (1), Tonight cards (3 listed, the 'recording' take hidden as before), held drafts (1), Book chapters (m8 empty current, m7 5, m1 1, Before You 1) and openers, shelf rows, export snapshot, export plan, the 18-file export ZIP (same sha256), entries.json. Differences:
- Schema version 8 -> 9 / 10 (intended).
- `ledger.present` 5 -> 6 on both targets (INTENDED but worth knowing): PR #510 (D-133) makes a kept 'note' count toward the free-letter ledger, so the seeded note now counts. The stored mirror stays 5 until syncLedger runs; counters only rise. Alpha allowance is MAX_FREE_LETTERS=100 (billing/alpha.ts), so no gate at any realistic count tonight.
- v10 only: `entryDecision` = 'agree' (intended, below).

(f) Child process runs the real `migrate()` on a WAL file and SIGKILLs itself right after statement K, inside the open transaction. Right after the kill (hot -wal/-shm present) the file reads user_version 8 with data hash equal to pristine (K<=5), or 9 with v9 complete (merge K=6..8); next real launch (`openStore`) recovers to the same final dump hash as the uninterrupted run in every case, integrity ok. Non-atomic statements: none; all DDL and the user_version bump sit inside one transaction per version. The only statements outside a transaction are the open PRAGMAs (WAL, synchronous FULL), unchanged since build 9. A copy taken with an un-checkpointed 680 KB WAL (crash state) also migrates to identical state and identical reads.

(g) Independent sqlite read of hex(raw_transcript), final_text, machine_edits, audio_uri, audio_sha256 (8 entries) and raw_transcript, typed_text (4 drafts): all 12 rows identical to pristine on both targets, on the crash copy, and on killed-then-recovered files. Export entries.json raw_transcript hashes identical.

### Build-1 path of PR #635 (age gate passed, no agreement row)
- Seeded file has ageGate.passed=1 and no agreements row. Same composition as lib/age-gate.ts readDecision: decideGate -> 'pass', hasAgreement('terms') false -> decideEntry = 'agree' (asked once, no age question).
- Simulated the Continue-with-tick write (recordAgreement(rows, passAge=false)): 2 rows (terms 4.1.0, privacy 3.0.0, accept, surface update.agreement, 64-char sha), decision -> 'pass', settings/entries/drafts/children unchanged; a second accept adds no row and keeps the first; cold relaunch -> 'pass' at user_version 10.
- Consequence for tonight: first launch of a build with #635 shows "Before you continue" in front of the book until the box is ticked. Nothing is lost; the letters are one tick away. Covered by DEVICE_TEST_PLAN S1-112 (f). I did not drive the screen itself.

### Downgrade (build 9 code opening the migrated file)
- Neither refuses nor corrupts. `migrate()` sees user_version 9/10 > 8, returns `newer:true`, error null, writes nothing (file sha256 unchanged). launch.logic launchStatus ignores `newer`, so the app runs (the "update the app" screen, MOB-09, is not built).
- All build 9 read APIs return the same data as before (29 of 31 results identical; only the open result and the schema version differ). Build 9 writes on the migrated files (new letter, in_book toggle, delete + restore, edit of the held draft) succeeded, integrity ok; the only differences were those 5 writes; new columns stay NULL, agreements untouched.
- This is safe because both steps are additive. A future destructive step would not be.

### Large database
- 100,008 entries (153,419,776 bytes) built from the pristine file: v8 -> v10 in 0.30 s wall including process start; 3 existing schema pages changed, 3 new pages; integrity ok; 0 unintended differences. ADD COLUMN and CREATE on an empty table do not touch rows.

### Tests run
- merge worktree: migrations*, agreements, age-gate*, launch-newer-file, launch-retry, review-persist.replay: 9 files, 106 passed. Full apps/mobile vitest there: 3955 passed, 2 failed (test/licences.test.ts: sandbox node_modules lacks expo-clipboard@57.0.2). It fails the same on develop tip alone, passes at 29dcd7d8; unrelated to the database. Typecheck not run.

### Commands (all from scratchpad/wt/drill-{b9,dev,merge}/apps/mobile; out files in scratchpad/drill/out)
- Seed: `DRILL_DB=.../pristine.db DRILL_DB_WALCOPY=.../pristine-crash.db npx vitest run test/zz-drill-seed.test.ts` (b9). Launch + reads: `DRILL_DB=<copy> DRILL_READS=<json> npx vitest run test/zz-drill-launch.test.ts` (each tree). `node dump.mjs`, `node diff.mjs`, `node cmp.mjs`, `node rawcheck.mjs`. Kill matrix: `./killmatrix.sh dev 5`, `./killmatrix.sh merge 8` (tsx kill-child.mts, SIGKILL).

### NOT verified
- A real phone, the native iOS SQLite (expo-sqlite) vs node:sqlite 3.53.4 (v10's ON CONFLICT DO NOTHING needs SQLite 3.24 or newer), file protection with the phone locked, a disk-full migration, and the actual React launch tree (only openStore and the read/logic modules were run).
- iCloud device-backup restore; whether iOS lets a tester install an older build over a newer one at all.
- The founder's real file history: I seeded fresh at v8 with build 9 code; DBs that came up through v1 to v7 are the same code path as build 9's own upgrade, not re-drilled. Databases above 146 MB, and sync/signed-in data (servers are off in this profile; outbox empty).

Reviewer: independent of the author (CR-44).

---

## Re-run at develop tip c964124361b3 (build 9, schema v8 -> v9; #635 stays out)

VERDICT: PASS on all four items. Four commits since 374a249e: #631 (with #639), #640 app lock, #517 billing robustness, #627 held letters in the export (1.6.0). `apps/mobile/src/lib/db/migrations.ts` is unchanged since 374a249e: latest is still v9 (PR #522). No migration, DDL, table or index was added by any of the four (grep of the diff for CREATE, ALTER, INSERT, UPDATE, DELETE, setSetting, SecureStore, Keychain: only the lock's two settings and the Settings > Your words default-view tap).

Same harness, same pristine build 9 file (sha256 6c7db002), real `openStore` -> `migrate`:
- DB (a) to (g): PASS, identical to the previous tip. user_version 9, integrity ok, 0 unintended differences, data hash 957ba295 and schema hash 3c852019 (equal to the 374a249e run). Second launch no-op (file sha 93f2ec1c before and after, from=to=9). SIGKILL K=1..5: each recovers on next launch to the uninterrupted final state. Crash-state copy with hot 680 KB WAL: same state and same reads. 12 text rows (raw_transcript, final_text, machine_edits, typed_text, audio uri/sha) byte-identical.
- Read APIs vs build 9: only schema version, `ledger.present` 5 -> 6 (the intended #510 note) and the export differ. Versus 374a249e only the export differs. `letters.keptEver` row byte-identical (recorded 5). Keep gate for the upgraded counts (alpha allowance 100, no Plus): lettersKept 5 and 6 -> allow via free_letters, which is the path that never waits for StoreKit.

1. App lock on an upgraded install (lock never enabled): PASS.
- Reads at launch (recorded every statement while running the real prefs.ts, machine.ts, reminders/prefs.ts over the migrated file): GET `appLock.enabled`, GET `appLock.grace`, GET `appLock.enabled` again, GET `notifications.lockScreenNames` (existing key, via lockScreenNamesOn). Writes: none (database dump identical before and after). Keychain or SecureStore: none; app-lock/ imports only the store, react-native and expo-local-authentication (grep).
- Defaults for an existing install: neither key exists, so enabled=false, grace=oneMinute (only matters once on). State machine from launch, inactive, background, back after 1 hour: locked=false, cover=false, autoPrompt=false throughout. `coverShown` needs `enabled`; the layer renders null; `checkPasscodeStillSet` returns before any native call when off. No Face ID sheet and no LocalAuthentication call at launch. The offer is inside onboarding (reached only when no book exists) and the App lock settings page reads device ability on mount only when opened.
- startAppLock runs in `<Root>` after launch status is ok (after migration); an unreadable settings table counts as lock off. Reminders: lock off leaves the lock-screen-names answer exactly as before.
- New for the build, not data: expo-local-authentication plugin adds NSFaceIDUsageDescription (string flagged pending counsel) and a native module, so build 10 needs a fresh native build; recorder.ts gains a try/catch-wrapped take listener only.

2. #517 and #627: PASS, no new settings key, ledger row or table.
- #517: in-memory `planReadiness` plus a Keep-gate wait of at most 1 s only when the answer would be "offer"; `hold` only when offer and no StoreKit read and no cached plan; 7-day offline grace is arithmetic over the existing plan snapshot; Swift module walks Transaction.unfinished and finishes verified ones, StoreKit only. No database write.
- #627: `drafts.listForExport` is a SELECT (not recording, not being let go) plus the existing review-column read; the export writes only the temporary ZIP. Ledger counts as above.

3. Export ZIP at format 1.6.0: PASS. 18 files at build 9, 23 now; all 7 seeded letters and both recordings unchanged.
- Identical by content: index.html, all 7 `letters/Asha/*.txt`, both `audio/*.m4a`, `book/Asha.pdf` (stand-in for the print HTML), and the `entries` array of data/entries.json (7 entries, byte-identical JSON).
- Intended differences: `data/entries.json`, `children.json`, `account.json` differ in one line only (`schema_version` 1.5.0 -> 1.6.0); `manifest.json` (format_version 1.6.0, new hashes for README, schema and the three data files, 5 new file entries, every other entry identical); `manifest.sha256`; `README.txt` (+3 lines about waiting/, waiting.json, version); `schema/export-v1.schema.json` (23,491 -> 29,259 bytes).
- Added: `data/waiting.json`, `waiting/<held draft>.txt`, `waiting/<ready spoken draft>.txt` + its `.m4a` (25,000 bytes, sha recorded), `waiting/<unrecoverable take>.txt`. The draft left in `recording` is not exported, by design. Own words only, no summarising.

4. Downgrade (build 9 code on the file migrated by this tip): PASS, unchanged. `newer:true`, error null, file sha256 unchanged on open, app runs, 30 of 32 read results identical (only open/schema fields differ); build 9 writes (new letter, in_book toggle, delete + restore, held draft edit) succeed, integrity ok, only those 5 changes. New note: `appLock.enabled`/`appLock.grace` rows, if a tester turned the lock on, are ignored by build 9, so a downgraded build opens with no lock (the rows stay for the next upgrade).

Tests: targeted 14 files (app-lock-machine, app-lock-behaviour, export-waiting, export-golden, export-schema, privacy-page, where-live, billing-plan, billing-plan-store-launch, billing-keep-gate-plan-read, plus-gate, migrations, migrations.v9, launch-newer-file): 233 passed. Full apps/mobile suite: 4013 passed, 61 failed in 7 files (config, privacy-manifest, capabilities, hosting-ios17, licences, preflight-production, one test in app-lock-wiring). Cause for the ones I opened: this sandbox's node_modules lacks expo-local-authentication@57.0.3 and expo-clipboard@57.0.2, so app.config.ts plugin resolution and the licences check fail. Not database code; not confirmed green with dependencies installed.

Not verified: a real phone; native expo-sqlite (node:sqlite 3.53.4 only); SecureStore/Keychain (the lock uses none, by grep); StoreKit (Transaction.unfinished, entitlement reads, the 1 s wait against a real read); Face ID or passcode prompts and the Info.plist string in a built app; the React tree and screens (only store, prefs, machine and logic modules ran); iCloud backup restore. Harness: scratchpad/drill/ (zz-drill-lock.test.ts, killmatrix2.sh, out2/).
