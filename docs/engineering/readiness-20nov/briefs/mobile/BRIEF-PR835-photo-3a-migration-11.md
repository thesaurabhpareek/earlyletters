Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549` and the PR head named below, 20 Nov 18:50 UTC).
Pin at develop 4d33978f (errata E1 to E73, CL-001 to CL-147; E74 to E82 and CL-148 to CL-157 NOT yet applied; `docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`): E48 (CL-122): NS-01-R36 holds as written until NS-52 ships; from that build a row whose file is missing is KEPT and shows a plain box (NS-52-R40; R36 reads "unless NS-52-R40"), so write `[NS-01-R36]` for today's rule only. R61 reads "the bucket is closed once BL-870 merges" (E48 b): not true until then. E35 (CR-64): this PR merges as is. E68 corrected cards 01, 11, 19 (B1, no meaning change): not re-read here [U].
Blocked until (the code is done; the merge is not ours): (1) the founder's size exception at the new size, 775 added and 8 removed lines in 15 files [V `gh api pulls/835`]; (2) #854 merged (legal rows for pictures, D-125, founder merges `docs/legal`); (3) nothing from Karma: Q-E12 is answered NO (erratum E35, CR-64): #835 merges as it is, and NS-52 lands in a NEW local migration after it, after 1.0, behind its own flags. NS-01-R15, R21a and R22 are true as written until NS-52 ships (E34: scope, not repeal).

```
BRIEF PR-835 (BL-931 slice 3a)                    Filled by: mobile RD-H1 for Karma, 20 Nov 2026 18:50 UTC
Agent: mobile   Lane: Pack 1 (Photo and media)   Build: 13 dark, 14 on (Q2 default)   Wave: 1

1. GOAL: When a phone at schema v10 updates, migration 11 adds `entry_media` with every old row byte-identical,
   and a kill between the picture file and its row leaves no orphan after the next launch sweep.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R16 (R16a to R16c), R19, R34, R35, R36; ADR 0028 D1, D5. Card 01 at 450bcb4a.
   Titles (catalogue B, PR #926, exact):
     [NS-01-R16c] purge and let-go remove the picture file
     [NS-01-R34] pictures live in Application Support
     [NS-01-R35] migration 10 to 11 keeps every letter
     [NS-01-R36] a kill leaves no orphan after the sweep
   R35 and R36 show "none" in the catalogue: add them if `node scripts/trace.mjs` finds no test citing them.
   Red on the old code: no `entry_media` table on develop (migrations stop at version 10, `migrations.ts:393`).
   Mutants (catalogue B): R35 add an `UPDATE entries` to migration 11; R16c swap file-then-row delete order
   (`photos/device.ts:66-67` at the head) or skip the file delete; R36 skip the sweep of orphan files.

3. FILES  Touch: the 15 files of the PR (lib/photos/{device,entry-media,files,housekeeping,types}.ts, lib/db/migrations.ts,
   lib/capture/{erase,sweep}.ts, lib/erase-everything.ts, store.ts (2 lines), tests erase-all, photos-device, photos-phone, photos-helpers).
   Never: lib/find/**, lib/reminders/**, packages/content, the later slices' files, charters, memory, workflows, BACKLOG, BOARD.
   Shared file rule: `store.ts` is also edited by #839, #879 and #895; whichever lands second merges develop.
   `docs/agents/BOARD.md` carries +1 line in this PR: Karma's claim line. Leave it.

4. READING PACK: Pack 1 items 1 to 4 and 7 (KNOWLEDGE-PACKS.md, PR #917), plus `docs/adr/0028-photo-seal-find-on-device-data.md` D1, D5.
   Stale-fact check: re-open every file:line; `git grep` the symbol.

5. CODE ENTRY POINTS (verified at head 39cf30d3, branch feat/mobile-photo-3-store)
   src/lib/db/migrations.ts:462-463   caption CHECK 2240 and place CHECK 960 code points (16 per character)
   test/erase-all.test.ts:1117        the five picture tests (NS-01-R16, ADR 0028 D5)
   src/lib/photos/device.ts:66        file delete before the row delete
   develop: src/lib/db/migrations.ts:393 (version 10), :430 LATEST_VERSION

6. DATA AND SECURITY
   Data classes: L3/L4 picture rows, local only. New storage: table `entry_media` (local SQLite); nothing sent, nothing logged.
   Boundary: B1 native/file layer, NSC-08 (temp copies), erase order file then row then letter (ADR 0028 D5).
   Owner of the read: security-architect (plan names it lens B; the posted lens B was principal-architect, so ask for the security read in the PR body).
   Privacy line: nothing of a child's voice or picture leaves the phone; the sync mapper sends `photo_path` null.
   Checklist: SECURE-CODING-CHECKLIST sections 2, 10, 11 (PR #915); abuse case AB-51 (hostile file) is #836's.

7. LIBRARIES: none new. Use expo-sqlite, expo-file-system as installed. LD-06 and LD-07: no expo-image, no expo-image-picker (PR #919).

8. BUDGETS (PR #928): Q-01 migration 10 to 11 on the 1,000-letter Asha book, rows byte-identical (unit, BLOCK);
   Q-02 migration at most 500 ms on SE 3 and never before the first frame (Rec; node tripwire for shape, device marker);
   L-04 photo sweep adds under 5 ms with 0 discarding drafts (PROPOSED). Checked: Q-01 by test; Q-02 and L-04 not measured here.

9. ACCEPTANCE  Experience: none on screen. Test cases: catalogue B rows above. Security: AB-51 not here; X4-R1 enumeration (SPA 3.1, PR #914)
   gains `entry_media` as a store. Done also means: red on old code and on the R35 and R16c mutants above.

10. PR BREAKDOWN: the PR exists (#835, base develop). 783 lines, 15 files, over CODE-R02 by the founder's exception.
    If a reviewer posts CHANGES at the final head: fix on the branch, never rebase. Flag-off proof: nothing imports these files
    from a live surface until 4b (`EXPO_PUBLIC_PHOTOS` off in every profile, guarded by #896).

11. LENSES: plan: A data-steward, B security-architect. Posted at 39cf30d3: A data-steward 14:49, B principal-architect 15:03 UTC, both PASS WITH NOTES. Native/lockfile: none.

12. ORDER: after #842 (merged); before #836. Blocked by: founder (size exception, #854 merge), founder only (size, #854).
    Not mine: dl01 and dl02 "1 of 1 (5 runs)" show failure on this head [V check-runs]; re-run once and read the log before claiming flake [U cause].

13. DEFINITION OF DONE
    [ ] re-read the head from the API after any push; two counted reviews at the final head; CI green incl. macOS store-profile Release launch (~75 min)
    [ ] focused: erase-all, photos-device, photos-phone, migrations tests; then `npm test -w apps/mobile`: only the 8 baseline files red (73 tests)
    [ ] `cd apps/mobile && npx tsc --noEmit`: only the 5 known errors; ASCII only; no path or hash in a log
    [ ] PR body per HARNESS-RUN.md with the DEFINITION-OF-DONE evidence block (PR #924); labels agent:mobile, from:agent, needs:founder
    [ ] journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: upgrade from a real v10 database; kill during the sweep (J-N9 row 4.1, JOURNEYS-AND-DEVICE-SHEETS, PR #925);
    folder protection class and backup flag (#841 rows). Name each as "Not verified" in the PR body.

15. STOP AND ASK: a ceiling other than 2240 and 960 is wanted;
    a file outside the globs must change; the base moves under you; two failed attempts at the same fix.

16. HARNESS: claim row held by Karma on BOARD. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-pr835 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-pr835.md`. Branch feat/mobile-photo-3-store (exists; push to it, no force). Every comment `<!-- agent:mobile -->`.
```
