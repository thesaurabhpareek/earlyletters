Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549` and head `03704c71`, 20 Nov 19:04 UTC).
Blocked until: #837 merged (its base is `feat/mobile-photo-4a-pending`; its head branch is `feat/mobile-photo-4-capture`); the founder's size exception at the new size (617 added, 12 removed, 25 files; reviewers counted 629, 56 over the 573 covered); the five PROPOSED photo keys read by the founder (`packages/content/src/features/photos.en.ts`, +28 lines; `needs:founder`); #854 merged. Conflict sent to product, not decided here: card R20b wants Change last in VoiceOver order, the slice keeps Change under the picture (plan M30; React Native's reading-order override is experimental).

```
BRIEF PR-838 (BL-931 slice 4b)                    Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 1 (Photo and media)   Build: 13 dark, 14 on (Q2)   Wave: 1

1. GOAL: When photos are switched on, Home offers "Start from a photo" once, through `startCapture({source:'photo'})`,
   the prompt does not depend on the picture, and backing out by any path leaves 0 files and 0 rows.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R1, R2, R3, R4, R9a, R13a, R13b, R18, R19, R20a to R20e, R22, R24, R59. NS-35 closed start list (`source: 'photo'`). Card 01 at 450bcb4a.
   Titles (catalogue B, PR #926, exact):
     [NS-01-R1] only Home registers a photo start
     [NS-01-R3] the prompt does not depend on the picture
     [NS-01-R4][NX-39-R14] backing out writes nothing
     [NS-01-R13a][NX-39-R36] the switcher snapshot shows no picture
     [NS-01-R13b] no picture before unlock
     [NS-01-R20b] VoiceOver order on Ready   (OPEN: conflict above)
     [NS-01-R24] photo strings match no forbidden pattern
     [NS-01-R59] no picker, no photo controls
   Red on develop: no `PhotoStartButton`, no `source: 'photo'` in `start-capture.logic.ts`. Mutants: R1 add a PhotoStartButton to Book; R3 make
   `selectPrompt` read the picture's id; R4 delete `discardPendingPhoto` at Close (`listen.tsx:448` area), Let it go, or Home focus
   (`use-photo-start.ts:19-23`); R13a `usePictureCovered` always active (`hooks.ts:26`).
   Review A note N3: the old R3 test never passed the session to the prompt code; pin that the photo start passes Speak's prompt
   (`(tabs)/index.tsx:206` and `:247`). Note N4: pin the phase mapping (`hooks.ts:26`) and pass `lockOn` and `unlocked` to `pictureCovered`.

3. FILES  Touch: app/(tabs)/index.tsx, app/{listen,review,write}.tsx, components/photos/{pending-photo-thumb,photo-frame,photo-start}.tsx,
   lib/capture/start-capture{,.logic}.ts, lib/photos/{copy,hooks,surface,text,use-photo-pick,use-photo-start}.ts, tests navigation-one-entry,
   photos-{capture,device,surfaces}, start-capture; packages/content/src/features/{index,photos.en}.ts, test/photos-copy.test.ts, test/support/copy-surfaces.ts.
   Never: lib/find/**, app/(tabs)/book.tsx (photo lens is #840, Find is #894/#895), boot wiring in app/_layout.tsx.
   Shared file rule: `packages/content/src/features/index.ts` and `copy-surfaces.ts` have ONE owner in wave 1 (this stack); Find's registration line
   waits for #840 (BRIEF-BL952-8).

4. READING PACK: Pack 1 items 1 to 3; docs/design/e2e area A DESIGN A-S01 and A-S03 (branch docs/e2e-ux-20nov at 9e78eecd); PR #923 DESIGN-DELTA C-08.

5. CODE ENTRY POINTS (head 03704c71, branch feat/mobile-photo-4-capture)
   src/components/photos/photo-start.tsx:8    imports ErrorLine from '@/lib/auth/ui' (loads expo-apple-authentication; N2, belongs in components/ui)
   src/lib/photos/hooks.ts:26                 phase mapping for the cover
   src/lib/photos/use-photo-start.ts:19       useFocusEffect discards a pending picture on Home focus
   src/app/(tabs)/index.tsx:206               usePhotoStart(() => startCapture({source:'photo', prompt...}))
   src/lib/photos/text.ts:2 (N5)              imports the UI copy layer for photoA11yLabel on the data path
   `registerPhotoDevice()` runs in the render body of two hooks (N6)

6. DATA AND SECURITY
   Data classes: L4 picture in memory and Caches; none sent. New storage: none beyond 4a's pending copy.
   Boundary: B1; switcher snapshot NSC (R13a); AB-13, AB-15 (PR #915). Owner of the read: design-systems posted B; add security-architect on R13.
   Privacy line: nothing of a picture leaves the phone; no PhotoKit; no permission string.

7. LIBRARIES: none new. Use existing `Button`, `ChoiceGroup`, `Sheet` (components/ui, owned by design-systems; do not edit). LD-14 haptics as installed.

8. BUDGETS (PR #928): L-06 screen change starts within 100 ms; L-07 Home to Listen within 900 ms (device, HOLD the motion change); A-04 AX5 + Bold Text,
   Speak on screen at AX3 with a picture, thumbnail 88 pt (R39, not met in this slice per N7). Not measured here.

9. ACCEPTANCE  Experience: A-S01 Home (Start from a photo quiet, third; C-08 conflict open), A-S03, A-S11 (EX-01 44 pt, EX-04 order, EX-08 Reduce Motion, EX-11 Smart Invert);
   motion MA-01 and MA-12 (PR #922). Test cases above; rows R39, R40, R42 stay open for BL-956. Done also means: red on old code and on each named mutant.

10. PR BREAKDOWN: exists (#838, 25 files, over the 20-file limit by the founder's exception). Fallback split if the exception is withdrawn: 4b-1 lib/photos, lib/capture and the content keys with their tests (about 14 files); 4b-2 screens and components (index, listen, review, write, photo-start, thumb, frame) (about 11 files), 4b-2 based on 4b-1. Existing PR #838, base feat/mobile-photo-4a-pending. Rebuild and retarget when #837 merges. Flag-off proof: `photos-surfaces.test.ts` (off: no registration, no controls).

11. LENSES: A principal-architect, B design-systems. Both PASS WITH NOTES at 03704c71 (14:55 and 15:50 UTC).

12. ORDER: after #837; before #839. Blocked by: founder (size, keys, #854), product (R20b).
    CI at head: `mergeable_state` unstable; dl01 "1 of 1 (5 runs)" cancelled [V check-runs]: re-run.

13. DEFINITION OF DONE
    [ ] focused photos-surfaces, start-capture, navigation-one-entry; `npm test -w apps/mobile`: only the 8 baseline files red; `npm test -w packages/content` (strings)
    [ ] `npx tsc --noEmit` in apps/mobile: only the 5 known errors; ASCII only; keys marked PROPOSED; labels agent:mobile, from:agent, needs:founder
    [ ] size named (629 against 573); journal PATCHed; check-in line

14. ONLY A PHONE CAN PROVE: VoiceOver reading order on Ready; AX5 (R20c) and AX3 thumbnail; Reduce Motion; switcher snapshot timing; Undo toast (JOURNEYS rows 4.4, 4.5, PR #925).

15. STOP AND ASK: product has not ruled R20b; a word is needed; `ErrorLine` must move to `components/ui` (design-systems); the base moves; two failed attempts.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-pr838 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-pr838.md`. Branch feat/mobile-photo-4-capture (exists, no force). Comments start `<!-- agent:mobile -->`.
```
