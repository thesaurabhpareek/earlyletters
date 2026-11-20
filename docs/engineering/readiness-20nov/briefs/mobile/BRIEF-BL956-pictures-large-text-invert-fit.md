Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549` and head `03704c71`, 20 Nov 19:04 UTC).
Pin at develop 4d33978f (errata E1 to E73, CL-001 to CL-147; `docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`): E69 P27 (CL-143): the border is the token `mediaFrame` (dark #716A62), named in NS-01-R41 (a token addition with a pair test, `design-systems`). E69 P36: no reserved height for the slip; an SE 3 device row decides. E69 P31/P35: `expo-battery` and `expo-symbols` are the founder's (E67).
Blocked until: BL-931 and BL-932 (PR b needs the list copy). `design-systems` confirms the large-text thumbnail (88 pt from AX3, backlog default) before PR a. The lens radio group (R48) is already built in #840; do not rebuild it. Catalogue B has no title for R42 (fit, never crop): the title below is PROPOSED and product or qa confirms it.

```
BRIEF BL-956 (pictures at large text, Smart Invert, fit, light lens)   Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 1 (Photo and media)   Build: 14 on   Wave: 2

1. GOAL: When text is at AX3 or larger, Speak, Type and Change stay on screen with the thumbnail at most 88 pt; every picture ignores Smart Invert; a panorama
   shrinks inside its box instead of losing its edges; and the Photos lens scrolls from list copies only.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R39, R40, R42, R48, R53; NS-37-R3 to R8; NS-33-R11. Cards 01 and 11 at 450bcb4a.
   Titles (catalogue B and C, PRs #926; exact):
     [NS-01-R39] large text keeps Speak on screen (device)
     [NS-01-R40] pictures ignore Smart Invert
     [NS-01-R53] the lens reads list copies
     [NS-01-R42] pictures are fitted, never cropped          (PROPOSED title)
     [NS-37-R3] missing copy regenerates   [NS-37-R8] the right copy for each place
   Red on develop: zero hits for `accessibilityIgnoresInvertColors` in `apps/mobile/src` (EX-11 says N; checked with grep at 16e61549); `PhotoFrame` uses `resizeMode="cover"` (#838 head,
   `photo-frame.tsx:35`). Mutants (catalogue B): thumbnail grows to screen width (R39); remove the prop (R40); draw the stored copy in the lens (R53); crop with `cover` (R42, PROPOSED).

3. FILES  Touch: components/photos/{photo-frame,pending-photo-thumb,photos-lens,letter-photo}.tsx, lib/photos/lens.ts, tests photos-surfaces, a new layout test at AX5 (see NS-33 spec),
   `docs/qa/DEVICE_TEST_PLAN.md` row only through `qa` (BL-929), packages/content only through `content`.
   Never: components/ui/** (design-systems), lib/find/**, modules/scribe-photo. Shared file rule: `book.tsx` and `photo-frame.tsx` with #838 to #840; this lands after them.

4. READING PACK: Pack 1 items 1, 3; Pack 8 (NS-33); 11-foundations section 8.5 O-4 and O-5 (the 88 pt rule, the fit rule) and section 7; docs/design/e2e area B DESIGN B-S04 (PR #921).

5. CODE ENTRY POINTS (stack heads; develop has none of these files)
   #838 head: src/components/photos/photo-frame.tsx:35   resizeMode="cover" (change to contain within a max box: Ready 160 pt high, 88 pt from AX3; lens 72 pt on the long side)
   #840 head: src/components/photos/photos-lens.tsx; src/lib/photos/lens.ts   (reads the stored copy at 72 pt today)
   #840 note N5: `photoUri` should live in `files.ts` so the Book does not load the store and picker wiring

6. DATA AND SECURITY
   Data classes: L4, local only. New storage, send, log: none. Boundary: none new. Owner of the read: none. Privacy line: pictures never leave the phone; no decode while recording (C-09).

7. LIBRARIES: none new (LD-04 SectionList stays; FlashList only on a measured miss; `expo-image` not adopted, LD-06; PR #919). `useIsAccessibilitySize` / `useIsLargeText` as built.

8. BUDGETS (PR #928): A-04 AX5 plus Bold Text on SE 3, Speak on screen at AX3 with a picture, thumbnail 88 pt (unit scan, device HOLD); S-01 no frame over 16.7 ms (device);
   S-05 list reads only list copies (unit, BLOCK); M-05 40-row window about 32 MB (WATCH). Checked: A-04 by truncation scan; S-01 and M-05 not measured.

9. ACCEPTANCE  Experience: EX-02 (AX5 on 375 pt, no cut text), EX-11 (Smart Invert), EX-08; B-S04, A-S01; motion MA rows for the lens (PR #922). Test cases above.
   Done also means: each test red on old code and on its mutant; BL-929's sheet gains the Photos lens scroll row (backlog done-line).

10. PR BREAKDOWN (design: 2 PRs)
    PR a: R39, R40, R42 (frame and large-text form) | about 250 lines, 6 files | base develop | flag-off proof: photos off draws nothing
    PR b: R53 and NS-37 readers use list copies in a virtualised list | about 250, 6 | base PR a, after BL-932 (c)

11. LENSES: A design-systems, B principal-architect (plan 2.4).

12. ORDER: after BL-931, BL-932; before the production flag. Blocked by: design-systems (88 pt confirm), product (R42 title).

13. DEFINITION OF DONE
    [ ] tests red on old code and on mutants; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only 5 known errors
    [ ] ASCII only; labels agent:mobile, from:agent; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: SE 3 at AX3 and AX5 with a picture (JOURNEYS row 4.5, PR #925); Smart Invert on a device; Book scroll with Instruments (J-N13, row 4.8).

15. STOP AND ASK: the 88 pt rule is changed by design-systems; `components/ui/**` must change; a decode miss tempts `expo-image`.

16. HARNESS: claim row: NONE yet for this brief; Karma adds it before the agent starts. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl956 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl956.md`. Branches `feat/mobile-bl-956-{a-frame,b-lens}`. Comments start `<!-- agent:mobile -->`.
```
