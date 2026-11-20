## Photo with a letter, slice 4b: photo-first capture on Home through startCapture (BL-931)

**Base:** `feat/mobile-photo-4a-pending`. **Branch:** `feat/mobile-photo-4-capture`. Split from #796 (8a026397). Built on #828's one capture entry.

### What and why
- **The Home start.** "Start from a photo" is a quiet md button under Speak and Type. It is absent, not greyed, unless the switch is on and the picker is registered. A tap opens Apple's system picker.
- **Through startCapture.** A chosen picture is held in memory, then `startCapture({ source: 'photo', prompt })` opens Listen at Ready with the same route params #796 used (`promptKey`, `promptLibraryVersion`). It is not armed and sends no capture event.
- **One entry.** #796 pushed `/listen` from Home directly, which N3(d) rejects. No direct push of a capture route remains.
- **The thumbnail.** It sits above the prompt on Listen and above the field on Write, at most 160 pt tall, with "Change".
  - Its VoiceOver label is the parent's words or "Photo with this letter" (NS-01-R9, R21; spec 01 section 8). #796 read a date there.
  - PhotoFrame draws a blank box whenever the app is not in front.
- **Leaving and keeping.** Let it go and Close drop the pending picture. Keep stores it with the letter, and a failure never un-keeps the letter.

### Words
`capture.startButton`, `capture.change`, `capture.openFailed`, `book.photos.a11yCard` and `a11y.startHint`, each marked `TODO(founder): PROPOSED, needs word approval`.

### Rows
NS-01-R1, R2, R3, R9, R13, R18, R19, R20, R22, R24; NX-39-R2, R36.

### Tests
- 18 new in mobile:
  - `start-capture` (2): the photo plan, and a push with no event and no arming;
  - `navigation-one-entry` (1): a direct `/listen` push from Home or a photo file fails N3;
  - `photos-surfaces` (12): R1 by an AST scan, R2, R3, R13, R18, R19, R20, R22;
  - `photos-capture` (1) and `photos-device` (2), C10.
- 6 new in `packages/content/test/photos-copy.test.ts`.

### Flag-off proof
- `[NS-01-R19] the Home start is guarded by the switch and a registered picker`.
- `[NS-01-R19] off, Listen, Write and Review gain nothing`.

### Not verified
On a device: VoiceOver, AX5 and Reduce Motion (R20), the switcher snapshot (R13) and the picker flow.

### Stack and merge
Eight stacked PRs from #796, as reworked after Karma's ruling of 20 Nov 2026. Slice 1 (#833) closed with its picker package, and 2b is new:
- 2 (#834, on `develop`), 2b (#841), 2c (#842), 3a (#835, now on 2c), 3b (#836), 4a (#837), 4b (#838), 4c (#839), 5 (#840).
- Each targets the slice below it, so its diff is only its own. Each branch merged the reworked slice below: merge commits, no force push.
- When the slice below merges, this PR is retargeted to `develop` and `develop` is merged in.
- Two counted reviews at that final head and green required CI, plus the macOS store-profile Release launch, then Karma merges under D-132.
- Everything is behind `EXPO_PUBLIC_PHOTOS`, which is off in every profile.

### Size (CODE-R02)
Size exception: 573 changed lines and 25 files against the 400-line, 20-file limit, not counting the lockfile and the generated `licences.json`. 344 lines are code and 229 are tests. The tests are the requirement-row proofs and the flag-off proof, each of which fails on the old code; splitting them from the code would leave the code unproven. Same shape as #828. The founder accepts or refuses this exception; the merge waits for that.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
