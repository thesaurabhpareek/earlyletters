Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 19:04 UTC).
Pin at develop 4d33978f (errata E1 to E73, CL-001 to CL-147; `docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`): E52 (CL-126): the 150 MB (Book with 300 pictures) and 120 MB (Book without) figures are two named numbers; no budget loosened; video poster rows are marked "if NS-52 ships", not added. E65: one lens card per letter. E67: `expo-battery` and `expo-image` are the founder's; not added until he approves.
Blocked until: BL-931 is done (all of #835 to #840 merged); BL-953 merged (same Swift file); `expo-image` is NOT adopted (LD-06, PR #919), so a decode miss on a device needs its own ruling. E34, E35 and E38 apply: NS-01-R15, R21a, R22 hold as written until NS-52 ships; Q-E12 is answered no, so NS-52 arrives in a NEW local migration after 1.0 behind `EXPO_PUBLIC_VIDEO` and `killSwitches.videos` (card 27's names). Still open: NS-52 (several pictures, video, unlocked, PACK-DELTA-3 in PR #932) multiplies copies and posters; FR-REL-66 asks memory under 150 MB with 1,000 letters, 300 pictures, 100 videos. Do not build for media; build for one picture and leave the rows open. Open owner: the Low Power Mode read has NO owner: the design names `scribe-system`, which does not exist, and `expo-battery` is not installed [V]; Karma decides (one native read, or the D-065 dependency); until then regeneration waits on `captureBusy()` only and the Low Power rule stays an open row. The design is Conflict E3: SectionList (design) against FlatList (eval B).

```
BRIEF BL-932 (NS-37, three PRs)                   Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 1 (Photo and media)   Build: gates 14 on (J-N13)   Wave: 2

1. GOAL: When the Book holds 1,000 letters and 300 pictures, the lens and the letter page read only a 512 px list copy and a 1,280 px page copy,
   nothing decodes while a take records, and a missing copy shows a card without a thumbnail and regenerates at idle.

2. CARD ROWS and TEST TITLES
   Rows: NS-37-R1 to R8 (P0: R2, R4, R5); NS-01-R11, R53. Card 11 NS-37 at 450bcb4a.
   Titles (catalogue C, PR #926, exact):
     [NS-37-R2] no decode while recording          [NS-37-R3] missing copy regenerates
     [NS-37-R4] copies stripped and not backed up  [NS-37-R5] copies erased with the picture
     [NS-37-R8] the right copy for each place      [NS-01-R53] the lens reads list copies   (catalogue B; fails today)
     R1, R6, R7 are device rows (J-N13), named `[NS-37-R1]`, `[NS-37-R6]`, `[NS-37-R7]`.
   Mutants (catalogue C): R2 ignore `captureBusy`; R4 skip the strip on copies; R5 delete the stored copy only; R8 use the stored copy in a card; R53 draw the stored copy.

3. FILES  Touch: modules/scribe-photo (PR a only), lib/photos/{derivatives.logic,regen,export}.ts (new), lib/photos/{files,device,housekeeping}.ts,
   lib/capture/{erase,sweep}.ts, lib/erase-everything.ts, components/photos/photos-lens.tsx, letter-photo.tsx, tests `photos-derivatives.test.ts` (new) and erase-all.
   Never: lib/find/**, lib/reminders/**, components/ui/**, app/_layout.tsx, packages/content.
   Shared file rule: `ScribePhotoModule.swift` with BL-953 and P-1; `book.tsx` with BL-956 and BRIEF-BL952-8.

4. READING PACK: Pack 1 items 2 to 7; 11-foundations section 7 (lines 226 to 252); `expo-native-module` skill; LD-04, LD-06 (PR #919).

5. CODE ENTRY POINTS (develop 16e61549 and stack heads)
   apps/mobile/modules/scribe-photo/ios/ScribePhotoModule.swift:50-51   caps 4096 px and quality 0.9 (BL-953 changes them)
   #840 head: src/app/(tabs)/book.tsx:342  lens; src/components/photos/photos-lens.tsx the card draws the stored copy at 72 pt
   #835 head: src/lib/photos/housekeeping.ts the sweep, which ignores a name of "another shape" until PR b teaches `<id>-512.jpg` and `<id>-1280.jpg`
   src/lib/photos/files.ts:39 PLAIN_NAME rule (stored names); copy names are new (Conflict K6: not in ADR 0028 D1 nor NS-01-R34)
   apps/mobile/src/lib/capture/busy.ts:20   `captureBusy()` [V at 16e61549]; rebuild.ts:53 already takes it as `busy`.

6. DATA AND SECURITY
   Data classes: L4 copies, local only, no metadata, excluded from backup (native `isExcludedFromBackup` on the result, since JavaScript cannot). Nothing sent.
   Boundary: B1 native, NSC-08. Owner of the read: security-architect for (a). Names stay inside `Library/Application Support/photos/` (checked natively).
   Privacy line: copies never leave the phone and are never logged with a path.

7. LIBRARIES: none new: ImageIO in `scribe-photo` (LD-06 OWN). `expo-battery` is not installed: Low Power Mode read is the design's `useLowPowerMode` in `lib/motion.ts`
   with one native read (eval B s7.2 item 9); a new dependency needs the founder (AIE-R21, D-065).

8. BUDGETS (PR #928): S-01 no frame over 16.7 ms, 1,000 letters, 300 pictures (device, HOLD); S-04 first decode p95 50 ms off the UI thread; S-05 list reads only list copies (BLOCK);
   D-02 copy sizes; D-03 byte ceilings list copy 60 KB, page copy 400 KB (WATCH, Rec); D-08 disk full: stored copy kept, no message (BLOCK); C-09 no decode while recording (BLOCK);
   M-02 under 150 MB, M-05 a 40-row window of 512 px copies about 32 MB decoded [E]; B-04 regeneration waits for normal power (BLOCK unit). Checked in CI: S-05, C-09, D-08, B-04.

9. ACCEPTANCE  Experience: B-S04 (thumbMissing, thumbPending), B-S08 (PR #921); EX-08 under Reduce Motion no fade. Test cases above. Security: checklist 2 and 3 (PR #915), abuse AB-51.
   Done also means: each test red on old code and on its mutant; R4 needs a native stand-in asserting the backup call.

10. PR BREAKDOWN (design: 3 PRs)
    PR a: native `makeCopy(source, destination, maxSide)` plus `derivatives.logic.ts` | about 300 lines, 5 files | base develop | lens principal-architect / security-architect
    PR b: writer, eraser, sweep (copy names) | about 300, 8 | base PR a | principal-architect / data-steward
    PR c: readers, `regen.ts` (idle, after restore) | about 300, 8 | base PR b | principal-architect / data-steward
    Flag-off proof for each: `EXPO_PUBLIC_PHOTOS` off registers nothing; `killSwitches.photos` hides, never shows.

11. LENSES: as in the table above. Native: security read in PR a's body.

12. ORDER: after BL-931, BL-953; before BL-956 and the production flag. Blocked by: founder (Q2 order), product (NS-52 shape, ruling RV-18 to RV-20 recorded first).

13. DEFINITION OF DONE
    [ ] each PR: tests red on old code; `npm test -w apps/mobile` only the 8 baseline files red; `npx tsc --noEmit` apps/mobile only 5 known errors
    [ ] ASCII only; no path or hash in a log; labels agent:mobile, from:agent; PR body with the DEFINITION-OF-DONE evidence block (PR #924)
    [ ] BL-929 run sheet gains a Book scroll row with photos; journal PATCHed; check-in line

14. ONLY A PHONE CAN PROVE: J-N13 on SE 3 (JOURNEYS row 4.8): no frame over 16.7 ms; R6 memory; R7 decode p95; the backup exclusion read-back; a restore regenerating copies.

15. STOP AND ASK: a Swift change beyond `makeCopy`; a new dependency (expo-image, expo-battery); copy names the ADR does not know (route to data-architect); product amends NS-37 for media.

16. HARNESS: claim row: NONE yet for this brief; Karma adds it before the agent starts. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl932 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl932.md`. Branches `feat/mobile-bl-932-{a-makecopy,b-writer,c-readers}`. Comments start `<!-- agent:mobile -->`.
```
