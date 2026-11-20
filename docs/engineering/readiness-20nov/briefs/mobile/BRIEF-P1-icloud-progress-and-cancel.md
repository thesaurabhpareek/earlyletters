Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 19:04 UTC).
Blocked until: row 33-3 (design-systems) has added `apps/mobile/src/components/ui/progress-bar.tsx`: it does NOT exist on develop [V `ls`], so "use ProgressBar as built" was wrong (11-foundations table row 33-3); the stack #835 to #840 has merged (same Swift file as BL-953: whichever lands second merges develop); the BL-878 native-module manifest (security design S-4) exists; the PROPOSED key `photos.capture.iCloudProgressA11y` is read by the founder (words); the backlog id is cut: the lock reserves BL-950 and BL-951 for "#832 follow-ups and NS-01-R17 iCloud progress" and the preamble calls this BL-951 (plan 2.1 row 10, section 2.9 P-1). Not written anywhere yet.

```
BRIEF P-1 (BL-950 or BL-951)                      Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 1 (Photo and media)   Build: 14 on (Q2)   Wave: 2 (plan 2.4)

1. GOAL: When a parent picks a picture that lives only in iCloud, a row shows real progress and a 44 pt Cancel that stops the download at once,
   offline ends in one calm line, and the capture continues.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R17b, R46, R17c (still of a Live Photo only; the scan allows the new export). Card 01 at 450bcb4a.
   Titles (catalogue B, PR #926):
     [NS-01-R17b] iCloud pictures show progress and can be cancelled   (device; catalogue status GAP: add a unit test of the native cancel port with fakes, PROPOSE)
     [NS-01-R46] an iCloud picture offline fails calmly (device)
     [NS-01-R17c] only the still of a Live Photo
   Unit tests with a fake emitter (11-foundations 8.4): throttle (at most every 250 ms or 2%), the 300 ms floor so a local picture never flashes progress,
   a cancel that settles once and discards a late copy. Red on develop: `copyPicked` discards the Progress (`ScribePhotoModule.swift:167`).
   Mutant (catalogue B): Cancel only sets a JavaScript flag (`picker.ts:58`).

3. FILES  Touch: apps/mobile/modules/scribe-photo/** (index.ts, ios/ScribePhotoModule.swift), lib/photos/{picker,device,types}.ts, components/photos/** (one progress row),
   lib/photos/copy.ts, tests photos-device and a new photos-progress test; scan in `photos-device.test.ts` (`swiftProblems` at `:315`, applied `:405`, mutants `:517`).
   Never: any other Swift file; plist keys, entitlements, background modes; lib/find/**; components/ui/** (use `ProgressBar` from row 33-3 (not on develop yet; a dependency)).
   Shared file rule: `ScribePhotoModule.swift` is also edited by BL-953 and BL-932 (a): whichever lands second merges develop. Swift file order: BL-953, then P-1, then BL-932 (a).

4. READING PACK: Pack 1 items 5, 6; 11-foundations section 8.4; `.claude/skills/expo-native-module/SKILL.md` sections 2 to 5; docs/design/e2e area A A-S03 (iCloudProgress state).

5. CODE ENTRY POINTS (verified on develop 16e61549 unless the head is named)
   apps/mobile/modules/scribe-photo/ios/ScribePhotoModule.swift:167   `loadFileRepresentation`; the Progress it returns is dropped
   apps/mobile/modules/scribe-photo/ios/ScribePhoto.podspec:9           iOS 16.4 (the app targets 17.0, app.config.ts:44): do not assume an API from it
   #837 head 404ca293: src/lib/photos/picker.ts:58  `cancel` settles in JavaScript only; the port has an `onProgress` it never calls
   #837 note N1: `picker.ts:29` single flight can wedge until relaunch: fix with a `PickerHost` deinit that cancels the session, and `cancel()` on blur in the screens

6. DATA AND SECURITY
   Data classes: L4 picture; the progress event carries a number only (fraction), never a name, path or hash. New storage: none; the partial file is removed on cancel.
   Boundary: B1 native; NSC-08; AB-51 and AB-15 (PR #915). Owner of the read: security-architect (native code, required).
   Privacy line: no network call of ours; iCloud download is the system's. No PhotoKit authorisation call (`[NS-01-R2]` scan stays true).

7. LIBRARIES: none (LD-07 OWN the single pick, AVOID expo-image-picker; PR #919). No plist key, entitlement or background mode: `NSItemProvider` progress is foreground.
   Unverified: `fractionCompleted` advancing for iCloud loads, and `cancel()` stopping the download. Prove on a device before claiming it.

8. BUDGETS (PR #928): C-03 thumbnail p95 1,000 ms from picker close for a local picture (progress must not add to it); B-02 no background work: foreground only.
   Checked: unit for throttle; device for the rest.

9. ACCEPTANCE  Experience: A-S03 states downloading and iCloudProgress (PR #921): progress moves only with real bytes; one polite announcement at start, never repeated;
   no spinner (tokens.v2 rule, Karma 20 Nov). Cancel uses the existing cancel key. Test cases above. Security: checklist 3 (PR #915).
   Done also means: red on old code and on the "JavaScript-only cancel" mutant.

10. PR BREAKDOWN: one PR, about 250 lines (S, estimate), base develop after the stack; branch `feat/mobile-photo-r17b-progress-cancel`. Flag-off proof: `[NS-01-R19]` still passes with the switch off.

11. LENSES: A principal-architect, B security-architect. Native: add the security-architect read in the PR body (not routed by roster).

12. ORDER: after #840 and BL-953; before the flag turns on in `production`. Blocked by: BL-878, the founder's word, an id.

13. DEFINITION OF DONE
    [ ] new tests red on old code; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` in apps/mobile: only the 5 known errors
    [ ] `npm test -w packages/content` (key PROPOSED); ASCII only; no content in logs; labels agent:mobile, from:agent, needs:founder
    [ ] journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: an Asha picture kept only in iCloud on a test Apple ID with Optimize Storage, online and in airplane mode (JOURNEYS row 4.3, PR #925); Cancel ends the wait at once.

15. STOP AND ASK: a plist key, entitlement or permission is needed; `cancel()` does not stop the download on a device; the card and the design disagree on the 300 ms floor or 250 ms throttle (both PROPOSED).

16. HARNESS: claim row: NONE yet for this brief; Karma adds it before the agent starts. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-p1 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-p1.md`. Branch feat/mobile-photo-r17b-progress-cancel. Comments start `<!-- agent:mobile -->`.
```
