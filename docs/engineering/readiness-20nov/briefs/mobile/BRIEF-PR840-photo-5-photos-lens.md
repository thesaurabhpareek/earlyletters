Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549` and head `91eef422`, 20 Nov 19:04 UTC).
Pin at develop 4d33978f (errata E1 to E73, CL-001 to CL-147; `docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`): E65 (CL-141, NS-52-R41): one lens card per letter, from the poster of its first picture, when NS-52 ships; today one picture, so one card per letter holds already. E52 (CL-126): NS-37 stays as locked until NS-52 ships; any poster or several-picture budget is marked "if NS-52 ships".
Blocked until: #839 merged (base `feat/mobile-photo-4c-letter-page`); the word `book.lens.monthsButton` (PROPOSED) read by the founder; #854 merged. The slice is inside CODE-R02 (326 added, 16 removed, 12 files, counted 342) so it needs no size exception [V]. NS-37 (BL-932) must merge before the flag turns on in `production`, not before this merge. C-09 is ruled (CL-116): the Book bar button is "Go to a month" (card NS-22 s3, area B words), so "Months" is not twice in one bar; the lens keeps its Months and Photos choice. The rename of the bar button belongs to BL-938, not here.

```
BRIEF PR-840 (BL-931 slice 5)                     Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 1 (Photo and media)   Build: 13 dark, 14 on (Q2)   Wave: 1

1. GOAL: When a book has a kept, open letter with a picture, the Book offers one radio choice "Months or Photos" and the Photos lens lists
   letter cards newest first with a thumbnail, no count and no add control; with no picture there is no control at all.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R10a, R10b (seal option not passed yet, N6), R10c, R11, R12, R19, R23a, R23b, R48; NS-33-R3. Card 01 at 450bcb4a.
   Titles (catalogue B, PR #926, exact):
     [NS-01-R10a] the Photos lens appears with the first picture
     [NS-01-R10c] no lens without a picture
     [NS-01-R11] the lens shows no count and no add control
     [NS-01-R12] the lens disappears quietly
     [NS-01-R23b] the lens cannot start a letter
     [NS-01-R48] the lens choice is a radio group
     [NS-33-R3] (already titled so: `photos-surfaces.test.ts:317-318`, closes M3)
   Red on develop: no `lib/photos/lens.ts`, no `photos-lens.tsx`. Mutants (catalogue B): R10a count deleted letters; R10c render the choice always;
   R11 add a count to the header; R48 revert to `tablist` (#840 caught this); review note N4: `sections[0]` back to `chapters[0]` stays GREEN, add an assertion or say it is cosmetic.

3. FILES  Touch: app/(tabs)/book.tsx (39 lines), components/book/letter-card.tsx, components/photos/photos-lens.tsx, lib/photos/{hooks,lens}.ts,
   tests book-page, photos-capture, photos-device, photos-surfaces, packages/content photos.en.ts and photos-copy.test.ts.
   Never: lib/find/** and the Find mode on `book.tsx` (BRIEF-BL952-8 waits for this PR), components/ui/** (ChoiceGroup is design-systems').
   Shared file rule: `book.tsx` is changed by BL-952 slice 8, BL-938, BL-937; whichever lands second merges develop. `book.tsx` is 522 lines on develop, 556 here (N3, CODE-R06).

4. READING PACK: Pack 1 items 1, 3, 7; 11-foundations section 8.2 (the lens control) and section 7 (NS-37); docs/design/e2e area B DESIGN B-S01, B-S03, B-S04.

5. CODE ENTRY POINTS (head 91eef422, branch feat/mobile-photo-5-lens; develop at 16e61549)
   src/components/photos/photos-lens.tsx:10   imports ChoiceGroup (radio group, layout segmented)
   src/app/(tabs)/book.tsx:342                `usePhotosLens(active?.id ?? null)`; the rule is assembled in three places (N2)
   src/lib/photos/hooks.ts                     `usePhotosLens` reads all `entry_media` rows even with the switch off (N1: return the empty lens before `photoDeps()`)
   develop: apps/mobile/src/app/(tabs)/book.tsx:23, :433 the Months `AnimatedSectionList` (NS-37 virtualised list)

6. DATA AND SECURITY
   Data classes: L4 thumbnails (reads the STORED copy at 72 pt until BL-932; NS-01-R53 wants the list copy), L3 letter text; local only.
   Boundary: X4-R1: the lens lists nothing for a second account (`[NS-01-R29]`); sealed unopened letters are absent (R10b).
   Owner of the read: security-architect only if N1 changes the reads; otherwise none beyond lenses.

7. LIBRARIES: none new. `ChoiceGroup` (not `ChipGroup`, no native SegmentedControl). LD-04: keep SectionList; FlashList only on a measured miss (PR #919).
   `expo-image` is NOT adopted (LD-06): the NS-37 fallback needs its own ruling (K2).

8. BUDGETS (PR #928): S-01 no frame over 16.7 ms with 1,000 letters and 300 pictures (device, HOLD); S-05 the list reads only list copies
   (unit, BLOCK; BL-932); M-02 under 150 MB with 300 pictures (device, WATCH). This slice draws the stored copy: say so in the PR body.
   Checked: none of the three here.

9. ACCEPTANCE  Experience: B-S01, B-S03, B-S04 (EXPERIENCE-ACCEPTANCE, PR #921); EX-07 selected = fill + edge + check; EX-11 Smart Invert is BL-956.
   Test cases: above. Done also means: red on old code and the R48 mutant.

10. PR BREAKDOWN: exists (#840, base feat/mobile-photo-4c-letter-page). Retarget and rebuild when #839 merges. Flag-off proof: N1 fix plus `photos-surfaces.test.ts`.

11. LENSES: A design-systems, B principal-architect. Both PASS WITH NOTES at 91eef422 (14:55 and 15:50 UTC).

12. ORDER: after #839; before BL-932, BL-956 and the Find mode on `book.tsx`. Blocked by: founder (word, #854).

13. DEFINITION OF DONE
    [ ] focused photos-surfaces, book-page; `npm test -w apps/mobile`: only the 8 baseline files red; `npm test -w packages/content`
    [ ] `npx tsc --noEmit` in apps/mobile: only the 5 known errors; ASCII only; key PROPOSED; labels agent:mobile, from:agent, needs:founder
    [ ] N1 (empty lens before `photoDeps()` when off) done or named as a follow-up; journal PATCHed; check-in line

14. ONLY A PHONE CAN PROVE: AX5 and dark mode on the lens (JOURNEYS row 4.8, J-N13, PR #925); VoiceOver reads one radio group.

15. STOP AND ASK: a stored-copy read is to be replaced by a list copy here (it is BL-932); the base moves.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-pr840 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-pr840.md`. Branch feat/mobile-photo-5-lens (exists, no force). Comments start `<!-- agent:mobile -->`.
```
