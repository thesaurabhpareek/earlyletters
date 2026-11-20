Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (every cite below was re-read by grep at develop `e95733b0`, 20 Nov 21:30 UTC).
Blocked until: #1018 (CR-71) and #1013 (DECISIONS-20nov.md) are merged: the brief rests on CR-71 B5 (branch `docs/cto-rulings-cr71-20nov`, line 769) and DECISIONS-20nov.md B5 and C7 (branch `docs/decisions-closed-20nov`), both OPEN at this commit, and plan 17 rule 6 forbids building on a ruling that sits only on an open branch. It unblocks, for PRs 1 to 3, when both are on develop; re-read B5 then. PR 4 (the preflight gate) is the OPS claim, BL-958 (`apps/mobile/scripts/preflight-*.mjs`): mobile writes the check as a pure function with a test; `ops` wires it, or Karma lets mobile do it. The `/stop` page is G-04-02 (not built: no `stop` route in `apps/web/src/app` [V `ls`]); its owner is not mobile. B5 gates the FIRST OUTSIDE FAMILY and `EXPO_PUBLIC_BACKUP`, not a servers-off Build 13 (DECISIONS-20nov.md question 1, default).

```
BRIEF B5 (backup file: exclusion, erase, Keychain token, gate)   Filled by: mobile for Karma, 20 Nov 2026 21:30 UTC
Agent: mobile   Lane: Pack 3 (Account and consent) with Pack 1 file rules   Build: before `EXPO_PUBLIC_BACKUP` goes on   Wave: 1 gate

1. GOAL: When a phone holds a recording-backup state file, it is excluded from the iPhone backup on every install (new and old) and read back, it is deleted on Erase everything and on sign-out, its upload token lives in the Keychain, and no build can switch `EXPO_PUBLIC_BACKUP` on until all of that, a non-empty escrow key list and a live `/stop` page exist.

2. RULES AND TEST TITLES (no card row: CR-71 B5; 01b B-2 and Q-b1; 02h G-11; X-2 stays BY DESIGN). Titles are PROPOSED; `qa` confirms.
   [B5-1] an existing backup file is excluded from the backup and read back at launch        mutant: skip the read-back
   [B5-2] the exclusion covers -wal, -shm and -journal and NEVER scribe.db                       mutant: exclude the whole SQLite folder (then scribe.db is lost from the backup)
   [B5-3] a file whose exclusion reads false is deleted and the store refuses to open           mutant: keep and open it
   [B5-4] Erase everything deletes every backup-*.db file first, before any await               mutant: skip the delete (today: none)
   [B5-5] sign-out closes the backup handle, then deletes the file; the book stays (D1)         mutant: delete before closing the handle; or delete the book
   [B5-6] an upload token is in the Keychain and the column holds none; Erase and sign-out remove the item   mutant: write the token back to the column
   [B5-7] the backup gate check fails `EXPO_PUBLIC_BACKUP=on` unless B5 exists, escrow keys are non-empty and the `/stop` route exists and answers 200 in its unit test   mutant: drop one of the three. STATIC only: no network call in preflight; the live 200 is an ops release step
   [B5-8] the recovery export still copies scribe.db* only (X-2 unchanged)                      mutant: widen the `DB_FILE` pattern
   Each test arranges a real failing state first (an existing excluded=false file; a Keychain with a seeded token) and is red on develop at e95733b0 (no guard, no delete, token in the column).

3. FILES  Touch: apps/mobile/src/lib/backup/{local-db,runtime}.ts (token only), a new `lib/backup/files.ts` (names, exclusion, delete: imports only expo-file-system, the `ScribeFiles` module and `SQLite.defaultDatabaseDirectory`, nothing from the backup runtime), `lib/erase-everything.ts` (one call inside `eraseDeviceFiles`), the sign-out seam beside `settleReminderSession` (`lib/auth/session-provider.tsx:206`), tests under apps/mobile/test/.
   Never: `lib/resilience/recovery-export*.ts` (unchanged on purpose, B5-8 only reads it), packages/api, supabase/**, app/_layout.tsx, `scripts/preflight-*.mjs` (ops claim BL-958), docs/legal/**.
   Shared file rule: `erase-everything.ts` and `session-provider.tsx` are also touched by reminders and account PRs: whichever lands second merges develop. `test/backup-gate.test.ts` allows only `gate.ts` to reach backup files: the new `files.ts` must be added to its allow-list by name in PR 1 and must work with the flag OFF (a data right, like the photo sweep).

4. READING PACK: CR-71 B5; DECISIONS-20nov.md B5, C7; data-security 01b rows X-2, B-2, Q-b1 and 02h section 2 (PR #1018's branch); 02g checked: it covers scribe.db tables only, B5 is not there; `.claude/skills/expo-native-module/SKILL.md` section 4; CR-69 A4's write order for on-device files (days store and moments index) as the pattern.

5. CODE ENTRY POINTS (develop e95733b0)
   apps/mobile/src/lib/backup/local-db.ts:60-85       SCHEMA_V1: `backup_jobs` has `wrapped_file_key`, `upload_url`, `upload_token`
   apps/mobile/src/lib/backup/account.ts:28-32         `backupDbFileFor(profileId)` gives `backup-<uuid>.db`
   apps/mobile/src/lib/backup/runtime.ts:423           `openBackupDb(openNativeDb(backupDbFileFor(profileId)).db, ...)`; `backupDbs` map caches the handle (:416, `dbFor` at :420): close before delete
   apps/mobile/src/lib/db/repos/open-native.ts:17      `SQLite.openDatabaseSync(name)`: default folder is `SQLite.defaultDatabaseDirectory` (`resilience/recovery-export.ts:33`)
   apps/mobile/src/lib/packs/app-support.ts:38-39      the ONLY use of `setExcludedFromBackup` plus a read-back (`isExcludedFromBackup`); `lib/model-files.ts:43` the other
   apps/mobile/src/lib/erase-everything.ts:57-80       `eraseDeviceFiles()`: recordings, copies, caches; NO backup file, no `backup` word in the file [V grep]
   apps/mobile/src/lib/erase-everything.ts:76,79       `SIGN_IN_LEFTOVERS` and `finish()`, which removes Keychain leftovers: add the token items here
   apps/mobile/src/lib/resilience/recovery-export.logic.ts:34 `DB_FILE = /^scribe\.db(-wal|-shm|-journal)?$/i`; :38-42 `folderFor`: backup-*.db is not copied (X-2)
   apps/mobile/src/lib/supabase/secure-storage.ts:40    `secureStorage` (Keychain)
   apps/mobile/src/lib/backup/escrow-keys.ts:12-14     `BUNDLED_ESCROW_KEYS` is an empty list with a TODO
   apps/mobile/scripts/preflight-production.mjs:180; preflight-testflight.mjs:174; preflight-keepsafe.mjs:38-42  today's backup checks (the flag must be "off" in a store build)
   apps/mobile/test/backup-gate.test.ts:56            no EAS profile writes `EXPO_PUBLIC_BACKUP=on`

6. DATA AND SECURITY
   Data classes: L4 `upload_token` (a resumable-upload capability, a secret until the upload ends), L4 `wrapped_file_key`, L3 the file name (holds the account's profile id). New storage: one Keychain item per token; no new file. Nothing sent, nothing logged: no token, url, path or hash in a log.
   Boundary: B1 file/native layer; T-class "backup of the phone leaks capabilities". Fail closed: if exclusion cannot be set or read back, delete the file and do not open it. Owner of the read: security-architect (lens A); privacy (lens B).
   The exclusion is per FILE: `scribe.db` stays in the backup (where-it-lives says so); never exclude the folder.
   Checklist: PR #915 SECURE-CODING-CHECKLIST sections 2, 10, 11.

7. LIBRARIES: none new. `expo-secure-store` (installed), `expo-file-system`, `ScribeFiles` (modules/scribe-files). LD-32 (PR #920).

8. BUDGETS (PR #928): L-03 and L-01: the launch step runs after the first frame and is never awaited (a directory listing and a few flag reads); Q-02 no migration before the first frame. Checked: unit with a fake clock; SE 3 by the BL-929 sheet.

9. ACCEPTANCE  Experience: none on screen (no words). Test cases above. Security: PR #914 section 5 (every store has exclusion read back, Erase, canary row); AB-22 and AB-44 (PR #915). Done also means: each test red on old code and on its named mutant.

10. PR BREAKDOWN (each at most 400 lines)
    PR 1: `files.ts`, launch exclusion with read-back, gate test allow-list | about 200 lines | base develop | flag-off proof: runs with the flag off (existing installs may hold a file)
    PR 2: delete on Erase and on sign-out | about 200 | base PR 1
    PR 3: upload token to Keychain, existing rows moved once at open | about 250 | base PR 2
    PR 4: the gate check as a NEW pure file `apps/mobile/scripts/lib/backup-gate-check.mjs` plus `apps/mobile/test/backup-gate-check.test.ts` (reads `eas.json`, `escrow-keys.ts` and the `apps/web/src/app/stop` route file; no network) | about 150 | base develop; `ops` wires it into `preflight-*.mjs` (BL-958), mobile does not edit those files

11. LENSES: A security-architect, B privacy. Native: no Swift change planned; if `ScribeFiles` needs one, stop and ask.

12. ORDER: PRs 1 to 3 any time; PR 4 before `EXPO_PUBLIC_BACKUP` can go on. Blocked by: PR 4 on `ops` (BL-958) and the `/stop` route; the escrow key list is the founder's offline ceremony (runbook K1 to K7, S05).

13. DEFINITION OF DONE
    [ ] tests red on old code and mutants; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only the 5 known errors
    [ ] `backup-gate.test.ts` still green (import graph); ASCII only; labels agent:mobile, from:agent; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: install over an older TestFlight build that created `backup-*.db` with the flag on, relaunch, confirm the file is excluded (an encrypted Finder backup does not list it; `scribe.db` is listed); Erase everything then Keychain and folder hold nothing; sign-out then relaunch; kill during the delete. `qa` writes the rows in `docs/qa/DEVICE_TEST_PLAN.md`.

15. STOP AND ASK: exclusion cannot be set per file on a device; the token must stay in the file for resume to work; a Swift change is needed; `ops` will not wire PR 4's check; anyone wants a network call inside preflight (the answer is no: static check plus an ops release step).

16. HARNESS: claim row: NONE yet for `lib/backup/**`; Karma adds it. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-b5 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-b5.md`. Branches `feat/mobile-b5-{1-exclusion,2-erase,3-keychain,4-gate}`. Comments start `<!-- agent:mobile -->`.
```
