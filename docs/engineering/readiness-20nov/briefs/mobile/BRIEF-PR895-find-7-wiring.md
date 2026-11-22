Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549` and head `92e37929`, 20 Nov 19:04 UTC).
Blocked until: #894 merged (this PR's base is `feat/mobile-bl-952-6-words`); for the account guard, #879 merged (BL-961 3 of 3), because `bookVisibleNow` does not exist on develop; S1-205 device row owner (`qa`, the founder's phone). Size: GitHub shows +338/-10 in 12 files; the honest merge delta is about that [V `git diff --shortstat origin/feat/mobile-bl-952-6-words origin/feat/mobile-bl-952-7-wiring`]. The boot-wiring line in `app/_layout.tsx` is in this PR by Karma's ruling (a test pins it); the `mobile` charter normally forbids it.

```
BRIEF PR-895 (BL-952 slice 7 of 8)                Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 2 (Find and search)   Build: 13 dark, 14 on (Q2)   Wave: 1

1. GOAL: When a letter changes, is hidden, restored, purged or arrives by sync, the Find index changes in the same transaction; with Find off the index and its view are dropped;
   and under a second account Find returns nothing.

2. CARD ROWS and TEST TITLES
   Rows: NS-02-R16a to R16d, R18, R33, R35, R43, R24 (store side, after #879); S1-205. Card 02 at 450bcb4a.
   Titles (catalogue C, PR #926, exact):
     [NS-02-R16a] the index moves with the letter in one transaction
     [NS-02-R16b] a hidden letter is not found at once
     [NS-02-R16c] a restored letter is found again
     [NS-02-R16d] a purged letter never returns
     [NS-02-R18] erase drops the index
     [NS-02-R33] a draft is not found
     [NS-02-R35] the index rebuilds in small batches (device)
     [NS-02-R43] Find off drops the index
     [NS-02-R24][X4-R1] a second account finds none of the first account's letters
   In the PR: `test/find-wiring.test.ts` (8 tests, 215 lines) through the real repos, sync engine and store. Mutants run by the author, each red: no reconcile in the sync transaction;
   no reconcile on book hide; Find-off path keeping the view; `markWordsReviewed` without the hook. Add (catalogue C): R16a reindex after commit outside the transaction; R18 `DELETE FROM` instead of `DROP`.

3. FILES  Touch: lib/db/repos/{children,entries,wipe}.ts (Find calls only), lib/sync/engine.ts (the reconcile call only), lib/store.ts (Find functions and the erase line only),
   lib/find/sources.ts, app/_layout.tsx (the `startFindCatchUp` line and import only), lib/README.md, docs/qa/DEVICE_TEST_PLAN.md (row S1-205 only; the file is `qa`'s: the row is #798's own and #895 already carries it; Karma accepts that, or `qa` takes the row text), test/find-fixture.ts, test/find-wiring.test.ts.
   Never: any other store.ts function; `_layout.tsx` beyond the one line; lib/reminders/**; photos functions in store.ts.
   Shared file rule: `store.ts` is also edited by #835, #839, #879; `_layout.tsx` also by #871 (mount and import only): whichever lands second merges develop.

4. READING PACK: Pack 2 items 1 to 7; `docs/tdd/new-scope/architecture.md` AP-6 and AP-7 (erase hooks and sweep); ADR 0028 D4, D5.

5. CODE ENTRY POINTS (head 92e37929, branch feat/mobile-bl-952-7-wiring)
   src/lib/store.ts:204   `ensureFindIndex()` async, returns 'off' when Find is off (drops index, map, settings, view; `dropSearchView` in sources.ts)
   src/lib/store.ts:225   `startFindCatchUp()` once per open store, after the first frame; :238 `findLetters()`
   src/app/_layout.tsx:110   `safely(startFindCatchUp)` right after `startPacks` (:109)
   develop: apps/mobile/src/lib/find/lifecycle.ts:29 `setIndexableBooks` (where BL-961's `bookVisibleTo` can also plug in); lib/find/rebuild.ts:16 `REBUILD_BATCH = 200`
   After #879 merges, add (Karma's ruling): `if (!bookVisibleNow()) return 'off';` first line of `ensureFindIndex()` and the same empty result in `findLetters()`, with a test red without it.

6. DATA AND SECURITY
   Data classes: L3/L4 derived index (words of kept letters), on the phone only, never exported or synced (R31), dropped on Erase (R18) and on Find off (R43). New storage: FTS5 tables and view in `scribe.db`.
   Boundary: NSC-03 (second account), NSC-04 (no donation to the system), AP-6 (FTS5 shadow rows: never delete by hand). Owner of the read: compliance-engineer (B posted; add security-architect for the account guard).
   Privacy line: no network, no log of a query or result.

7. LIBRARIES: expo-sqlite FTS5 as installed (LD-16 USE; AVOID stemming), no new dependency (PR #920).

8. BUDGETS (PR #928): S-08 rebuild 1,000 letters in 3 s, batches of 200, no JS frame over 50 ms, index write under 20 ms p95 (device; node tripwire for shape); L-04 catch-up off the first frame, never while recording;
   Q-03 index at most 10 MB at 1,200 letters; M-03 at most 50 MB over baseline. Checked: shape by test; numbers by S1-205 on SE 3.

9. ACCEPTANCE  Experience: B-S06 Find states (PR #921). Test cases above. Security: SPA 3.1 (Find is in the X4-R1 enumeration), AB-03. Done also means: red on old code and on the four author mutants plus the two above.

10. PR BREAKDOWN: exists (#895). After #894 merges: retarget to develop, rebuild per `stacked-prs` section 5, request reviews at the final head. Add the guard commit after #879. Flag-off proof: `find-wiring.test.ts` Find-off case.

11. LENSES: A principal-architect, B compliance-engineer; both PASS WITH NOTES at 92e37929.

12. ORDER: after #894; (guard) after #879; before BRIEF-BL952-8. Blocked by: #894, #879 for the guard, device row S1-205.

13. DEFINITION OF DONE
    [ ] all `find-*.test.ts` (73 Find tests) pass; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` in apps/mobile: only the 5 known errors
    [ ] ASCII only (fixtures `\u`); labels agent:mobile, from:agent; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: all of S1-205: R2 (300 ms p95, 20 runs of 20 queries), R12 Back keeps query, R20 memory, R21 a11y, R35 frame budget, R36 save cost, FTS5 in a real build (JOURNEYS row 4.6, J-N10, PR #925).

15. STOP AND ASK: a change to `_layout.tsx` beyond the one line; the guard needs a function other than `bookVisibleNow`; a shadow-table delete outside the lifecycle module; the base moves.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-pr895 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl-952.md`. Branch feat/mobile-bl-952-7-wiring (exists, no force). Comments start `<!-- agent:mobile -->`.
```
