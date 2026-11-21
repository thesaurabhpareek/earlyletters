Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549` and head `f3b21698`, 20 Nov 19:04 UTC). One already moved: review notes cite `photos/device.ts:95` for the eraser; at this head it is `erasePictureOf` at `device.ts:102`, the `COALESCE(entry_id, draft_id)` query at `:104`.
Pin at develop 4d33978f (errata E1 to E73, CL-001 to CL-147; E74 to E82 and CL-148 to CL-157 NOT yet applied; `docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`): E65 (CL-139): one lens card per letter, drawn from the poster of its first picture; other items open in the Review strip (applies when NS-52 ships; one picture today). E69 P27 (CL-143): the picture border is the token `mediaFrame` (dark #716A62), named in NS-01-R41; token addition with a pair test, `design-systems`.
Blocked until: #838 merged (base `feat/mobile-photo-4-capture`); the founder's size exception (592 added, 11 removed, 17 files; reviewers counted 603, 85 over the 523 (plan M29 gives 523) covered); the 13 PROPOSED keys plus `text.*` (among them `features.photos.review.notStored`) read by the founder; #854 merged. REWORK (CL-116 C-01, ruled 20 Nov): the picture sits ABOVE the words, as cards 01 and 10 say; #839 places it after the words and changes, the card does not. This adds lines to a PR already over its exception: tell the founder. C-02 (ruled): timed Undo windows with ONE clock owned by the toast (`createUndo`, row 33-3, design-systems); see BRIEF-BL954. E41: the photo words and place fields turn writing tools off, or are hidden in `production` until the native setting exists (titles `[NS-01-R50]` and `[NS-01-R50b]`).

```
BRIEF PR-839 (BL-931 slice 4c)                    Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 1 (Photo and media)   Build: 13 dark, 14 on (Q2)   Wave: 1

1. GOAL: When a letter has a picture, Review and the letter page show it, a second picture replaces the first only after confirm,
   changes never touch the words or recording, and a closed Undo window never leaves a live-looking Undo button.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R7, R8, R9a, R9c, R16, R17, R19, R21, R25, R38b (open), R58. Card 01 at 450bcb4a.
   Titles (catalogue B, PR #926, exact):
     [NS-01-R7] a second picture replaces only after confirm
     [NS-01-R8] picture changes never touch words or recording
     [NS-01-R9a] the picture has a fixed label
     [NS-01-R9c] only the author changes the picture
     [NS-01-R25] a quiet day cannot carry a picture
     [NS-01-R38b] no Undo control outlives its window   (fails today; see N1 below)
   Red on develop: none of `lib/photos/attach.ts`, `letter-photo.tsx` exist. Mutants (catalogue B): R7 replace before the confirm;
   R8 `entryMediaStore.put` also runs `UPDATE entries SET final_text = 'x'` (compare the whole `entries` row byte for byte; the old test froze
   an object never passed to code); R38b leave the toast open (`components/ui/toast.tsx:9-10` says an action toast never times out while
   `attach.ts` expires the ticket at `UNDO_WINDOW_MS`, line 8, 41 and 50).

3. FILES  Touch: app/letter/[id].tsx, app/review.tsx, components/photos/{letter-photo,review-photo}.tsx, lib/capture/erase.ts,
   lib/photos/{attach,device,hooks}.ts, lib/store.ts (23 lines), tests erase-all, photos-{capture,device,phone,surfaces}; content keys in photos.en.ts and photos-copy.test.ts.
   Never: components/ui/** (design-systems; the Undo clock fix is BRIEF-BL954), lib/find/**, lib/reminders/**.
   Shared file rule: `store.ts` is edited by #835, #879, #895; whichever lands second merges develop. Read-only: `toast.tsx`.

4. READING PACK: Pack 1 items 1, 2, 7; docs/design/e2e area B DESIGN B-S08 and B-S11 (branch docs/e2e-ux-20nov at 9e78eecd); PR #923 DESIGN-DELTA C-01, C-02, C-07.

5. CODE ENTRY POINTS (head f3b21698, branch feat/mobile-photo-4c-letter-page)
   src/lib/photos/device.ts:102-104     erasePictureOf deletes by COALESCE(entry_id, draft_id): matches kept letters too (N2: hand the store a draft-only eraser)
   src/lib/photos/attach.ts:8,41,50    UNDO_WINDOW_MS and the ticket's `expiresAt`
   src/lib/store.ts                    +23 lines; eraser arrives through a module-level setter (N3, CODE-R06: file already over the limit)
   words and place fields have no maxLength while `editPhotoWords` keeps 140 and 60 (N4: silent cut)
   `SpokenLine` is a second announce-on-appear line beside ErrorLine (N5); `photoUri` returns '' for a bad id (N6)

6. DATA AND SECURITY
   Data classes: L4 picture, L3 words and place; local only. New storage: none beyond 3a. Nothing sent; nothing logged.
   Boundary: B1 and X4-R1 (a second account sees no picture, `[NS-01-R29]`): the lens and page reads must go through the account seam.
   Owner of the read: design-systems posted B; add security-architect for the eraser path (N2 deletes files).

7. LIBRARIES: none new. Existing `ConfirmSheet`, `Toast`, `PhotoFrame`. Do not hand-roll a sheet (LD-02 gorhom is installed).

8. BUDGETS (PR #928): S-01 no frame over 16.7 ms on the letter page with a picture (device, HOLD); A-01 no time limit on an Undo line (unit, BLOCK):
   the source scan must fail on an `expiresAt` in an undo path, which this slice currently has. Not measured here.

9. ACCEPTANCE  Experience: B-S08 letter page, B-S11 picture on letter page (EXPERIENCE-ACCEPTANCE, PR #921); EX-14 Undo clock, EX-11 Smart Invert; MOTION-ACCEPTANCE PR #922.
   Test cases: above. Security: AB-40 (share bytes are the stored copy) is BL-939's, not here. Done also means: red on old code and on mutants.

10. PR BREAKDOWN: exists (#839, base feat/mobile-photo-4-capture). Retarget and rebuild when #838 merges. Flag-off proof: `photos-surfaces.test.ts`.
    N7 (with the switch off or the pause on, an existing picture is hidden on its page): R19 does not say viewing is hidden; ask product, do not decide.

11. LENSES: A principal-architect, B design-systems. Both PASS WITH NOTES at f3b21698 (14:55 and 15:50 UTC).

12. ORDER: after #838; before #840. N1 (dead Undo, NS-01-R38b P0 (b)) is listed "not met" on the card: the fix is BRIEF-BL954 (CL-116 C-02: one timed clock owned by the toast; row 33-3 `createUndo` first) and is NOT a reason to
    hold this merge unless Karma rules R38b holds the flag. Blocked by: founder (size, keys, #854), product (N7).

13. DEFINITION OF DONE
    [ ] focused photos-capture, photos-surfaces, erase-all; `npm test -w apps/mobile`: only the 8 baseline files red; `npm test -w packages/content`
    [ ] `npx tsc --noEmit` in apps/mobile: only the 5 known errors; ASCII only; keys PROPOSED; labels agent:mobile, from:agent, needs:founder
    [ ] size named (603 against 523 (plan M29 gives 523)); journal PATCHed; check-in line

14. ONLY A PHONE CAN PROVE: Undo toast, VoiceOver, AX5 on the letter page (JOURNEYS row 4.5, 4.1; PR #925).

15. STOP AND ASK: the picture-above-words rework passes the covered size; a word is needed; `store.ts` shape (N3) needs a split; the base moves.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-pr839 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-pr839.md`. Branch feat/mobile-photo-4c-letter-page (exists, no force). Comments start `<!-- agent:mobile -->`.
```
