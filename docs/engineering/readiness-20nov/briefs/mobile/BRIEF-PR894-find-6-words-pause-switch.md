Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549` and head `1fb48f4e`, 20 Nov 19:04 UTC).
Blocked until: the founder reads the twelve PROPOSED Find lines in `packages/content/src/features/find.en.ts` (`needs:founder`; the choice for `fieldHint` sits beside them as a comment). Size is NOT a blocker: GitHub shows +2,077/-4 in 27 files because #881 to #885 were squash-merged under this branch; the merge result against develop is 12 files, +228/-4 [V: `git merge-tree --write-tree origin/develop origin/feat/mobile-bl-952-6-words`, then `git diff --shortstat` against develop], inside CODE-R02. GitHub says `dirty`; the same local merge-tree is clean, so merge develop into the branch (no rebase) and re-read the head. A head that moved needs a review at the new head (D-132): post the one-line delta.

```
BRIEF PR-894 (BL-952 slice 6 of 8)                Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 2 (Find and search)   Build: 13 dark, 14 on (Q2)   Wave: 1

1. GOAL: When Find is built, its words exist as PROPOSED keys, a signed remote switch `bookSearch` can only hide Find, and no Find file can reach the network.

2. CARD ROWS and TEST TITLES
   Rows: NS-02-R1 (switch and pause), R3, R11, R13, R22, R23, R39, R41. Card 02 at 450bcb4a.
   Titles (catalogue C, PR #926, exact):
     [NS-02-R3] short queries do nothing; CJK queries use substring   (the "find.en.ts has no hint key" check is an assertion inside this one test, not a second title)
     [NS-02-R22] Find makes 0 network calls
     [NS-02-R23][FD-R13] the short-query hint is VoiceOver-only and never drawn
     [NS-02-R39] the no-match line holds no gap word (content test)
   Tests in the PR: `packages/content/test/find-copy.test.ts` (12), `apps/mobile/test/find-flag.test.ts` (4: R1 switch and pause, R22 scan: no Find file names the remote module),
   `packages/api/test/remote-config.test.ts` (the `[NS-02]` pause case). Each red on develop (the modules do not exist). Mutants run by the author: `notReady` with "still" put back (R39) red.
   Add: remove the reader argument from `findPausedNow` (the R22 scan must go red).

3. FILES  Touch (12 files): packages/content/src/features/find.en.ts, test/find-copy.test.ts; packages/api/src/{kill-switches,remote-config,envelope,standards}.ts and test;
   scripts/packs/remote-config.json; apps/mobile/src/lib/find/{flag,pause}.ts, test/find-flag.test.ts; one check-in line.
   Never: lines 1 to 5 of `packages/api/src/kill-switches.ts` (the header; AX-4 is a separate PR: add only the `bookSearch` key), `packages/content/src/features/index.ts` and `test/support/copy-surfaces.ts` (the photo stack owns them until #840: the registration line is BRIEF-BL952-8), app/(tabs)/book.tsx.
   Shared file rule: none open.

4. READING PACK: Pack 2 items 1 to 3; ADR 0028 D4; `docs/engineering/readiness-20nov/` PR #917 Pack 9 (contracts: additive keys, API-R11).

5. CODE ENTRY POINTS (head 1fb48f4e, branch feat/mobile-bl-952-6-words)
   packages/api/src/remote-config.ts:65 and :78   `bookSearch` default false in the schema (`v.object` strips unknown keys: an older app ignores it, a newer app reading an older config gets false)
   packages/api/src/kill-switches.ts:35-39        KILL_SWITCH_KEYS gains bookSearch (hides, never enables)
   packages/api/test/contract-drift.test.ts:114   every kill-switch key must be in ERROR_DETAILS
   apps/mobile/src/lib/find/pause.ts:13           `findPausedNow(read)`: the caller passes the reader; unreadable counts as not paused
   apps/mobile/src/lib/find/flag.ts:7             `EXPO_PUBLIC_BOOK_SEARCH` on only for `on`; no profile sets it (#896 guards that)

6. DATA AND SECURITY
   Data classes: none (one boolean in the signed config, nothing about a person, a book or a query). New storage, send, log: none.
   Boundary: contract change (API-R11, additive); NSC-04 (no system donation) is #883's. Owner of the read: compliance-engineer posted B (PASS WITH NOTES at 1fb48f4e).
   Privacy line: Find makes 0 network calls (R22); the query never leaves the screen.

7. LIBRARIES: none. valibot as installed for the schema (LD-21 USE, PR #920).

8. BUDGETS (PR #928): L-03 no network work before first frame (the pause reads the cached signed config; no fetch); N-01 Find makes 0 requests. Checked by the R22 scan.

9. ACCEPTANCE  Experience: B-S06 Find mode states killSwitch and offline (PR #921). Words: twelve PROPOSED keys, none final. Test cases above. Done also means:
   red on old code and on the `findPausedNow` reader mutant.

10. PR BREAKDOWN: exists (#894, base develop). After the founder reads the words: merge develop into the branch, re-run, request the reviews at the new head. Flag-off proof: `EXPO_PUBLIC_BOOK_SEARCH` set by no profile; nothing imports the files until slice 8.

11. LENSES: A principal-architect, B compliance-engineer; both PASS WITH NOTES at 1fb48f4e (12:47 and 12:48 UTC).

12. ORDER: after #885 (merged); before #895 (its base) and BRIEF-BL952-8. Blocked by: founder (words). Note: `book.empty.searchTitle` at `packages/content/src/strings.en.ts:567` ends "yet": R39 bans it; `content` rewords it, not this PR.

13. DEFINITION OF DONE
    [ ] `npm test -w packages/content`, `npm test -w packages/api`, `npm test -w scripts/packs` pass; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` in apps/mobile: only the 5 known errors
    [ ] ASCII only; labels agent:mobile, from:agent, needs:founder; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: nothing (words and a switch). The founder reads the twelve lines.

15. STOP AND ASK: the founder changes a word; the signed config schema needs more than one key; a file outside the globs must change.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-pr894 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl-952.md` (exists on the branch; add a line). Branch feat/mobile-bl-952-6-words (exists, no force). Comments start `<!-- agent:mobile -->`.
```
