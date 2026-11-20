Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549` and head `e27d104e`, 20 Nov 20:03 UTC).
Blocked until: #871 merged (base is `fix/mobile-bl-961-account-cover`; retarget to develop and rebuild per `stacked-prs` section 5 when it does). No founder item of its own; the held-screen words are #871's. Everything here is code, 341 added, 24 removed, 9 files [V].

```
BRIEF PR-879 (BL-961 part 3 of 3: store reads)    Filled by: mobile RD-H1 for Karma, 20 Nov 2026 20:03 UTC
Agent: mobile   Lane: Pack 3 (Account and consent)   Build: 13, holds the cut (Q1 recommendation)   Wave: 1

1. GOAL: When account B signs in on a phone that holds account A's book, every list the app reads (books, letters, drafts, deleted, hidden) is empty for B, and nothing is deleted, moved or uploaded.

2. CARD ROWS and TEST TITLES
   Rows: [X4-R1] (data half), NS-10-R3, NS-10-R5, NS-01-R29, NS-02-R24 (store side). Card 08 at 450bcb4a.
   Titles (catalogue A and C, PRs #925 and #926, exact):
     [NS-10-R3] a second account never sees the first
     [NS-10-R5] a second account never claims the first's letters
     [NS-01-R29][X4-R1] a second account sees no picture
     [NS-02-R24][X4-R1] a second account finds none of the first account's letters
   In the PR: `test/account-store.test.ts` (157 lines), `account-note.test.ts` (94), `account-deletion-gate.test.ts`. Red on develop: "B signed in: every list is empty" fails because B's `listChildren()` returns A's book.
   Mutant: remove the `shown()` wrapper from `listDrafts` (the drafts test must go red) [SPA 3.1, PR #914].
   Add the exact catalogue titles; the PR's cite of the row in parentheses makes `scripts/trace.mjs` miss it (catalogue A, NS-10-R3 row).

3. FILES  Touch (9): lib/store.ts (book reads only), lib/auth/account-scope.ts, lib/account-deletion/use-first-run-gate.ts, components/account/account-layer.tsx (4 lines), tests account-store, account-note,
   account-deletion-gate, export-device-cleanup (one line, outside the globs: a test that mocks auth-store needs `getAuthSnapshot`; the PR says so), docs/agents/checkins/mobile-bl-961.md.
   Never: lib/find/** (BRIEF-PR895 owns `ensureFindIndex` and `findLetters`: give it the one-line guard in its brief, not an edit), lib/reminders/** (BRIEF-HO908 owns `currentPlan()`), app/_layout.tsx, photos functions in store.ts.
   Shared file rule: `store.ts` is also edited by #835, #839, #895: whichever lands second merges develop.

4. READING PACK: Pack 3 items 1 to 9; Pack 2 pitfalls (the Find guard); `08-keeping.md` section 3.6 row 3.

5. CODE ENTRY POINTS (head e27d104e, branch fix/mobile-bl-961-store-reads)
   src/lib/store.ts:446   `bookVisibleNow()`: true with no session; else `bookVisibleTo({owner: currentUserId(), sessionUser})`; false on an unreadable owner (fail closed)
   src/lib/store.ts:463-465   `shown(rows)`: empty while another account is signed in; reads by id (getEntry, getDraft, getChild) stay open ON PURPOSE (the listening-copy sweep and the launch sweep must find the owner's rows)
   src/lib/store.ts:833   `listDeleted()`: `if (!bookVisibleNow()) return [];`
   Unlisted reads (review B note 2): app/settings/children/[id].tsx:36 (`getChild`, `listMembers` from a route id), app/settings/where-letters-live.tsx:36 (`listOrphanAudio` count): behind the iOS cover today; list them for the Android cover.
   Writes are guarded only by the cover: `saveFamily` with no active child creates a book (`store.ts:414-419`); the `otherAccount` gate step makes it unreachable. Say so in the `shown()` comment.

6. DATA AND SECURITY
   Data classes: L4; reads only. New storage, send, log: none. One `settings` read per wrapped list call (review A note 5): measure against cold start p50.
   Boundary: NSC-03 data half; AB-01 to AB-04. Owner of the read: security-architect (lens B posted PASS WITH NOTES).
   Still open and tracked outside this PR: planner guard (#908), Delete account under B (#911), analytics counts read 0 under B (name it in the tracking plan).

7. LIBRARIES: none.

8. BUDGETS (PR #928): L-01 cold start (WATCH the added settings read), L-03 nothing awaited before first frame. Checked: CI none; SE 3 by BL-929.

9. ACCEPTANCE  Experience: E-S18 (PR #921). Test cases above; AB-01 to AB-04 (PR #915). Done also means: red on old code and on the `shown()` mutant, and the full mobile suite shows only the 8 baseline files.

10. PR BREAKDOWN: exists (#879, base fix/mobile-bl-961-account-cover). Flag-off proof: with one account the lists are unchanged (test). After #871 merges: retarget, rebuild, request reviews at the final head.

11. LENSES: A principal-architect, B security-architect; both PASS WITH NOTES at e27d104e (13:00 and 12:48 UTC).

12. ORDER: after #871; before BRIEF-PR895's guard, BRIEF-HO908, BRIEF-HO910, BRIEF-HO911, BL-922a. Blocked by: #871.

13. DEFINITION OF DONE
    [ ] tests red on old code; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only the 5 known errors
    [ ] ASCII only; labels agent:mobile, from:agent; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: S1-204 on two phones (JOURNEYS row 3.4 and the second-account rows, PR #925): B's lists empty on a real device; `settings` read cost on SE 3.

15. STOP AND ASK: a list function used by Find, photos or the planner must change; `getEntry` by id must be hidden; #871's base moves.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-pr879 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl-961.md`. Branch fix/mobile-bl-961-store-reads (exists, no force). Comments start `<!-- agent:mobile -->`.
```
