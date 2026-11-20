Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549` and head `404ca293`, 20 Nov 19:00 UTC).
Blocked until: #836 merged (base `feat/mobile-photo-3b-stored-copy`); the founder's size exception at the new size (718 added, 14 removed, 15 files; reviewers counted 732, 33 over the 699 the exception covered) [V]; #854 merged. Open on the card: NS-01-R17b (progress and native Cancel) is NOT in this slice; it is brief P-1 (BL-950 or BL-951).

```
BRIEF PR-837 (BL-931 slice 4a)                    Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:00 UTC
Agent: mobile   Lane: Pack 1 (Photo and media)   Build: 13 dark, 14 on (Q2)   Wave: 1

1. GOAL: When the photo start is built behind its switch, the system picker is the only source, it returns one still,
   asks no library question, and with the switch off or the module missing nothing registers.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R2, R17 (a, c), R19, R22, R47, R52. NX-39-R2. Card 01 at 450bcb4a.
   Titles (catalogue B, PR #926, exact):
     [NS-01-R2][NX-39-R2] the photo start asks no library question
     [NS-01-R19][NX-39-R37] the switch removes the screens, not the data rights
     [NS-01-R22] the system picker is the only source and returns one photo
     [NS-01-R47] a pick under App lock is dropped
     [NS-01-R52] the picker's copy never stays
   Red on develop: `lib/photos/picker.ts`, `flag.ts`, `registry.ts` do not exist. Mutants: add a permission call in the picker adapter (R2);
   `selectionLimit 2` (R22); delete the `!photosBuildEnabled()` check at `device.ts` (R19; M1 is RED in the posted review);
   skip deleting the temp copy after read (R52).

3. FILES  Touch: lib/photos/{adopt,device,failures,files,flag,pause,pending,picker,registry,session,types}.ts, tests photos-device,
   photos-phone, photos-surfaces. Never: modules/scribe-photo Swift (hardening is #842, merged; progress is P-1), lib/find/**,
   app/**, packages/content. Shared file rule: none outside the stack.

4. READING PACK: Pack 1 items 1, 5, 6, 7; `.claude/skills/expo-native-module/SKILL.md` sections 2 to 5; ADR 0028 D1.

5. CODE ENTRY POINTS (head 404ca293, branch feat/mobile-photo-4a-pending)
   src/lib/photos/picker.ts:29   answers `cancelled` without calling native while `busy` (single flight; N1 wedge risk)
   src/lib/photos/picker.ts:58   `cancel` settles only in JavaScript (the download goes on)
   src/lib/photos/device.ts:59   `nativeForTest` seam; `resetPhotoDeviceForTest` ships in the bundle, inert (N4)
   src/lib/photos/flag.ts:6      parsePhotosFlag reads `EXPO_PUBLIC_PHOTOS` outside capabilities.ts (N1, CODE-R14)
   src/lib/photos/adopt.ts:10    module-level `adopting` latch (N2)
   develop: apps/mobile/modules/scribe-photo/ios/ScribePhotoModule.swift:167 loadFileRepresentation discards Progress

6. DATA AND SECURITY
   Data classes: L4 picked still in memory and in Caches only until adopted; none sent. New storage: temp copy in Caches/ImagePicker, deleted on adopt, cancel, kill, next launch.
   Boundary: B1 native module, NSC-08; AB-15 (a pick returns while App lock is up), AB-51 (hostile picture) in PR #915.
   Owner of the read: security-architect (posted lens B). Native code change: none in this PR.
   Privacy line: no PhotoKit call; the picker is PHPicker (no permission).

7. LIBRARIES: none. LD-07 AVOID expo-image-picker (CR-65, ruled), LD-08 OWN extend scribe-photo (PR #919). Podspec says iOS 16.4
   (`ScribePhoto.podspec:9`), the app targets 17.0 (`app.config.ts:44`): do not assume an API from the podspec.

8. BUDGETS (PR #928): C-03 thumbnail p95 1,000 ms from picker close (device, HOLD the flag); L-03 no work added before first frame
   (registration is lazy; check with the static import scan). Not measured here.

9. ACCEPTANCE  Experience: A-S03 picker and states (PR #921 EXPERIENCE-ACCEPTANCE; states downloading, appLockDrop). Test cases: catalogue B rows.
   Security: checklist 3 (native boundary), AB-15. Done also means: red on old code and on the `device.ts` switch-check mutant.

10. PR BREAKDOWN: exists (#837, base feat/mobile-photo-3b-stored-copy). Retarget and rebuild when #836 merges. Flag-off proof:
    `photos-phone.test.ts` three cases (off with native, on with native as positive control, on without native).

11. LENSES: A principal-architect, B security-architect. Both PASS WITH NOTES at 404ca293 (14:39 and 14:55 UTC).

12. ORDER: after #836; before #838. Follow-ups, not in this PR: N1 wedge (needs `PickerHost` deinit cancel and `cancel()` on blur: P-1),
    N2 comment on the latch, N3 R17b (P-1). Blocked by: founder (size, #854).

13. DEFINITION OF DONE
    [ ] focused photos-* tests; `npm test -w apps/mobile`: only the 8 baseline files (73 tests) red
    [ ] `npx tsc --noEmit` in apps/mobile: only the 5 known errors; ASCII only; no content in logs
    [ ] size named (732 against 699); labels agent:mobile, from:agent, needs:founder; journal PATCHed; check-in line

14. ONLY A PHONE CAN PROVE: no prompt, Cancel, iCloud wait, Live Photo, a lock over the picker (plan 2.1 "Gate: D"; JOURNEYS rows 4.2, 4.3, PR #925);
    the module with a real build (the Debug simulator link failure is `ops`'s).

15. STOP AND ASK: a plist key, entitlement or permission is needed; a Swift change is needed (it is P-1, with BL-878 first);
    N1 turns out to hang the picker in a test; the base moves.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-pr837 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-pr837.md`. Branch feat/mobile-photo-4a-pending (exists, no force). Comments start `<!-- agent:mobile -->`.
```
