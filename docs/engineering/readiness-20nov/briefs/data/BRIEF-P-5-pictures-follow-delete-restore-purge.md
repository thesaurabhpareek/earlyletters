BRIEF P-5: Pictures follow delete, restore and purge and never reach the server (NS-36-R1a to R1c, R2)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: mobile   Lane: Pack 1 (photo) with Pack 8 (data rules)   Build: 14 on (before the photo flag is on)   Wave: 2   Size: S: design 36-3 one PR about 250 lines, plus two test files
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: #835 (entry_media store, head 39cf30d3) merged, which waits on the founder's size exceptions and #854. No row at the lock cites these ids (plan M6): Product numbers P-5.

1. GOAL: When a letter with a picture is deleted, restored or purged, then its picture and the smaller copies are hidden, returned or removed in the same step as the letter, files before the row, and no picture row ever leaves the phone.

2. CARD ROWS and TEST TITLES
   Rows: NS-36-R1a, R1b, R1c, R2 (R1d is BRIEF-BL-870).
   Tests (exact; PR #925 catalogue A):
     [NS-36-R1a] delete hides everything     mutant: hide the picture in a second transaction
     [NS-36-R1b] restore returns everything  mutant: restore the letter row only
     [NS-36-R1c] purge removes picture files  mutant: purge the row and leave files
     [NS-36-R2] export holds every part      (the writer is BL-933; assert the manifest here once it lands)
   Fixture: Asha letter with the stored copy, two smaller copies, a first and a seal (when they exist), clock advanced 31 days.

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  apps/mobile/src/lib/store.ts (deleteEntry :755, undeleteEntry :772, purgeExpired :920 only if a hide, return or file step is missing), lib/photos/** eraser calls, apps/mobile/test/photos-lifecycle.test.ts (new), docs/agents/checkins/mobile-p-5.md
   Never:  lib/export/** (BL-933), supabase/**, migrations.ts, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: store.ts is also edited by BL-931 and BL-952 slices; whichever lands second merges develop.

4. READING PACK
PR #917 KNOWLEDGE-PACKS.md Pack 1 and KNOWLEDGE-PACKS-2.md Pack 8; data-and-sync.md section 3.1 and PR table (develop); ADR 0028 D1, D5; PR #926 catalogue B.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   apps/mobile/src/lib/store.ts:755     deleteEntry; :772 undeleteEntry; :920 purgeExpired(nowMs, eraseAudio); :1101 purgeThenRecordLaunch
   apps/mobile/src/lib/erase-everything.ts:89   eraseEverything order (ADR 0028 D5)
   #835 (open) entry_media store and photo sweep; #836 (open) stored copy
   Also extend, per data-and-sync section 1: the L11 upgrade test must hold letters, drafts, agreements, entry_media and outbox rows byte-identical after (today #836 checks one letter and the outbox count at photos-device.test.ts:179-188 [U: re-open on the PR head])

6. DATA AND SECURITY
   Data classes: picture L4 (stored copy), ids L3, kind/ext/bytes per OQ-P2; phone only. Nothing leaves the phone. Hidden by join on entries.deleted_at (no deleted_at on entry_media).
   Boundary: delete, restore, purge. Owner of the read: data-steward.

7. LIBRARIES ALLOWED
none new.

8. BUDGETS
Delete and restore stay one transaction inside the 200 ms save commit p95 (DATA-REQ-048). Checked by: existing timing tripwire; SE 3 not measured.

9. ACCEPTANCE
   Experience: none new. Test cases: PR #926 catalogue B and PR #925 catalogue A NS-36. Security: PR #915 FL-04 (kill during Erase everything resumes).
   Done also means: each test red on old code and on its mutant; the L11 upgrade test extended.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: [R1a][R1b][R1c] tests + any missing hide, return or file step | about 250 lines, 4 files | base develop (after #835) | photos flag off proves no change

11. REVIEW LENSES
Lens A: data-steward. Lens B: compliance-engineer.

12. ORDER AND DEPENDENCIES
After: #835, #836. Before: BL-933's [R2] assertion; the photo flag turning on. Blocked by: #835 merge.

13. DEFINITION OF DONE
   [ ] focused tests (red on old code, red on the named mutant), then `npm test -w apps/mobile` (baseline: 8 files, 73 tests fail for missing expo-local-authentication, expo-clipboard; nothing else)
   [ ] `cd apps/mobile && npx tsc --noEmit`: only the 5 known errors
   [ ] `npm test -w packages/content` if any string or content key changed (new keys are PROPOSED)
   [ ] ASCII only in added lines; no content in logs; fictional family Asha only
   [ ] PR body per HARNESS-RUN.md (Agent, Mode, Satisfies, Data classes touched); labels agent:mobile, from:agent (+ needs:founder)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
J-N9 on a phone: add a picture, delete, restore, delete, wait past the window with the e2e clock seam; the picture follows each step; no file left after purge.

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - a hide step needs a column on entry_media (no: hide by join); - the sweep and the purge disagree on the file name rule.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #8 first; marker `<!-- journal run:sess-20261120-mobile-p-5 agent:mobile -->`.
   Check-in: docs/agents/checkins/mobile-p-5.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: test/mobile-p5-pictures-follow-the-letter in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:mobile -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
