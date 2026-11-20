Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 19:04 UTC).
Pin at develop 4d33978f (errata E1 to E73, CL-001 to CL-147; E74 to E82 and CL-148 to CL-157 NOT yet applied; `docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`): E58 (CL-132): a required update shows its line in Me; the hiding hook exists and nothing reads it yet, so Find is not hidden by it.
Blocked until: #894 and #895 merged (words, switch, wiring); #840 merged (this slice edits `app/(tabs)/book.tsx` and registers keys in `packages/content/src/features/index.ts`, which the photo stack owns until then: Karma's ruling); #879 merged for R24 (the guard is #895's). Not opened yet: the PR does not exist [V: no open PR titled "BL-952 (8/8)"]. Karma: please accept the 8a/8b split (the plan counts one PR 8 of 8). C-09 is ruled (CL-116): "Go to a month" stands for the Book bar button, so "Months" is not twice in one bar (the rename is BL-938).

```
BRIEF BL-952-8 (Find mode and header)             Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 2 (Find and search)   Build: 13 dark, 14 on (Q2)   Wave: 1

1. GOAL: When Find is on, one "Find" action sits on the Book header; typing three or more characters shows the first row within 300 ms p95, a failed search says so once with Try again,
   Back keeps the query, and nothing about a query is stored, logged or put in a route.

2. CARD ROWS and TEST TITLES
   Rows still open after slices 1 to 7 (from #895's body "Open rows"): NS-02-R1 (header action), R11, R12, R13, R14, R21, R23 (draw), R25, R28, R29, R32, R37, R38, R40, R46, R47; with R39 for `book.empty.searchTitle`.
   Titles (catalogue C, PR #926, exact):
     [NS-02-R37] a failed search says so once and offers Try again   (fails today)
     [NS-02-R1] Find lives on the Book header only
     [NS-02-R11] no count on screen or in the VoiceOver string
     [NS-02-R12] Back keeps the query                [NS-02-R14] queries are not remembered
     [NS-02-R25] the query is never in a URL or route [NS-02-R28] mixed-direction snippets keep order
     [NS-02-R29] index and scan agree on 200 Devanagari and Arabic fixtures
     [NS-02-R32] an interruption keeps the query     [NS-02-R40] the match is marked without colour alone
     [NS-02-R46] Find follows the active book        [NS-02-R47] Find works after a plan lapses
   R38 (getting-ready line shows only while true) has no catalogue title: PROPOSED `[NS-02-R38] the getting-ready line shows only while true`.
   Mutants (catalogue C): show nothing on failure (R37); add a second Find icon on Home (R1); clear the query on blur (R12); persist the last query (R14); put the query in a route param (R25);
   force LTR (R28); tokeniser differs between paths (R29); colour only for the match (R40); gate Find on hasPlus (R47).

3. FILES  Touch: apps/mobile/src/components/find/** (new), app/(tabs)/book.tsx (the header action and mode only; it is 522 lines on develop, CODE-R06: put the mode in a hook), lib/find/* (screen hook,
   Unicode isolates for the row label), packages/content/src/features/index.ts (one registration line), test/support/copy-surfaces.ts (one surface row), tests find-* and `find-screen.test.ts` (new).
   Never: `strings.en.ts` `book.empty.searchTitle` (content rewords it without "yet"; R39), components/ui/**, lib/photos/**, `_layout.tsx` (the catch-up call is #895's).
   Shared file rule: `book.tsx` with #840, BL-938, BL-937; `features/index.ts` with the photo stack.

4. READING PACK: Pack 2 items 1 to 7; docs/design/e2e area B DESIGN, WORDS, MOTION B-S06 (branch docs/e2e-ux-20nov, 9e78eecd); 11-foundations section 9 (Find is "record only").

5. CODE ENTRY POINTS (develop 16e61549)
   apps/mobile/src/lib/find/debounce.ts:9 (`FIND_DEBOUNCE_MS`), :26 `createQueryDebounce(run)`, `FIND_DEBOUNCE_MS = 150`; "held in memory only" (R14)
   apps/mobile/src/lib/find/search.ts:18, :28, :39   FindHit, FindResult, `searchLetters(db, raw, childId)`
   apps/mobile/src/lib/find/rebuild.ts:16            REBUILD_BATCH = 200; sources.ts:75 SEARCH_VIEW
   apps/mobile/src/app/(tabs)/book.tsx:433           the Months `AnimatedSectionList` the Find mode must not break
   #895 head: src/lib/store.ts:238 `findLetters(raw, childId)`; #894 head: lib/find/pause.ts:13 reader argument (pass `getRemoteConfig` from `lib/remote` HERE, the Book, not in lib/find)

6. DATA AND SECURITY
   Data classes: L3 query held in component state only; results are L3/L4 text from the index. New storage: none. Nothing sent. Log canary: query, result tap and a forced failure leave 0 hits in log, breadcrumb, crash, analytics, URL sinks (R15, J-N18).
   Boundary: NSC-03 and NSC-04; field has autocorrect, spellcheck, autocomplete and content type off (R14); Writing Tools off (D2, NSC-05). Owner of the read: compliance-engineer.
   Checklist: PR #915 sections 1, 6, 8 (deep links: the query is never in a route).

7. LIBRARIES: none new. `TextField search` and `ListRow` from components/ui; Reanimated only through `lib/motion.ts`. LD-16: FTS5 plus the CJK scan; LD-24 built-ins for direction (PR #920).

8. BUDGETS (PR #928): S-07 first result row p95 300 ms after the last keystroke, 1,000 letters (device, HOLD `EXPO_PUBLIC_BOOK_SEARCH`); S-08 rebuild shape; M-03; A-04 AX5 with the field and results;
   L-06 100 ms to start a screen change. Checked: by test for shape; S1-205 on SE 3 for the numbers.

9. ACCEPTANCE  Experience: B-S06 Find mode states idle, short, noMatch, failed, offline, planLapsed, killSwitch, cjk, rtlRow (PR #921); EX-02, EX-03 (one h1), EX-04, EX-05, EX-07, EX-08; motion MA rows B (PR #922). Test cases above.
   Done also means: each test red on old code and on its mutant; `[NS-02-R37]` first, because it fails today.

10. PR BREAKDOWN (Karma's design: PR 8 of 8; this brief proposes two to stay under 400 lines)
    PR 8a: Find mode, header action, failed and getting-ready lines, isolates | about 350 lines, 9 files | base develop after #895 | flag-off proof: `EXPO_PUBLIC_BOOK_SEARCH` unset draws no action
    PR 8b: registration line, `[NS-02-R29]` fixtures test, device row text for `qa` (that file is `qa`'s: hand the text over, do not edit it), `content` coordination for R39 | about 200 lines, 5 files | base 8a

11. LENSES: A principal-architect, B compliance-engineer (plan 2.2). `design-systems` reads the screen (it owns `components/ui`).

12. ORDER: after #894, #895, #840, #879; before BL-938 (the Book header, wave 3). Blocked by: founder (words, via #894), content (R39 reword), .

13. DEFINITION OF DONE
    [ ] tests red on old code; `npm test -w apps/mobile`: only the 8 baseline files red; `npm test -w packages/content`; `npx tsc --noEmit` apps/mobile: only the 5 known errors
    [ ] ASCII only; keys PROPOSED; no query in a log; labels agent:mobile, from:agent, needs:founder; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: S1-205 on SE 3 (R2, R12, R20, R21 VoiceOver, AX5 Bold, Reduce Motion, Voice Control, Switch Control; R36), airplane-mode run (R22), Back and tab flows.

15. STOP AND ASK: the Book header needs a layout the design-systems spec does not draw; a suggestion, correction or "did you mean" is wanted (R27 forbids); a store function must change beyond #895's; two failed attempts.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl952-8 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl-952.md`. Branches `feat/mobile-bl-952-8{a-mode,b-register}`. Comments start `<!-- agent:mobile -->`.
```
