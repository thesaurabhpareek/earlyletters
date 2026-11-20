## Review B at d0a04fe15629ddb339a445eafeae703d7ed14831: CHANGES
<!-- agent:security-architect -->

Lens B (identity and security; chapters 05 and 06). Scope: the slice's own diff, `git diff origin/feat/mobile-photo-3b-stored-copy...d0a04fe1` (base 68d82717), 15 files, +686/-13.

Head movement: I first reviewed at 7122da97. The two new commits, 7ace6aea and d0a04fe1, are both merges of `feat/mobile-photo-3b-stored-copy`. The slice's own diff at d0a04fe1 matches the one at 7122da97 line for line, apart from hunk offsets and one context import line that comes from 3b's `text.ts`. Everything below was re-run at d0a04fe1.

Must fix:
1. **The flag-off proof passes even when the switch check is removed** (NS-01-R19, chapter 06 "a control without a test is a hope").
   - Where: `apps/mobile/test/photos-phone.test.ts:130` and `:137`, testing `apps/mobile/src/lib/photos/device.ts:59`.
   - Mutation: change `if (registered || !photosBuildEnabled()) return;` to `if (registered) return;`. All 61 tests in photos-device, photos-phone and photos-surfaces stay green, and so do all 81 tests in the `test/photos-` files.
   - Why: in Node, `nativePhoto()` (`device.ts:30-34`) always answers null. So nothing registers whatever the switch says, and both tests hold however the gate is written.
   - Why it matters: the registration gate is a real control. It is the only thing that decides whether a picker and a pending store exist. In 4c, `pending-photo-thumb.tsx` draws its change action from the registered pending picture alone.
   - Fix: let the test pass the native module in, for example `registerPhotoDevice({ native })`, or add a test-only setter, plus a reset for the `registered` latch. Then assert:
     - with the switch off and a fake `pickOne`, `getPhotoPicker()` and `getPending()` are both null;
     - with the switch on and the same fake, both are set (the positive control).
2. **The read-error removal proof is vacuous** (NS-01-R52, NX-39-R53, C7: "the original is removed on every path including errors").
   - Where: `apps/mobile/test/photos-device.test.ts:223-229` runs over `pickedMemory({})`. The original never exists there, so `files.left()` is `[]` whatever `commit` does.
   - Mutation: in `pending.ts:119`, make the catch `return { status: 'failed' }` without reaching `discard()`. All 61 tests stay green, yet on a phone the location-bearing original would then stay in Caches/ImagePicker until the next launch sweep, and the pending picture would keep its source.
   - Fix: give `pickedMemory` a read that throws while the file is present, for example `pickedMemory({ [URI]: bytes }, { failRead: true })`. Then assert status `failed`, `files.left()` equal to `[]` and `p.source` null.

Checks that hold (verified at d0a04fe1):
- **No photo-library permission anywhere.**
  - Not in `app.config.ts` (infoPlist at :243 holds only `CADisableMinimumFrameDurationOnPhone` and `LSApplicationQueriesSchemes`; the plugins add microphone and Face ID only).
  - Not in `package.json` or `package-lock.json`. A grep for NSPhotoLibrary, NSCamera, image-picker, media-library, expo-camera, vision-camera and PHPhotoLibrary under apps/mobile and the lockfile finds nothing outside the tests.
  - Existing guards keep it that way: `photos-device.test.ts:981` (the lockfile scan) and `plistUsageProblems` (`app-lock-wiring.test.ts:257`, which flags any extra usage key).
  - The diff adds no dependency, plugin or Swift change.
- **Only Caches/ImagePicker files reach native code.**
  - `pickerDestination` (`files.ts:79`) is built from `pickerDir()` plus a `PLAIN_NAME`-checked uuidv7 name, and `pickerDestination('../x')` throws (test).
  - The native `fileIn` checks it again: it resolves the parent through symlinks, uses the `\z` name rule, and `clear` refuses a link at the destination.
  - `picker.ts:52` keeps only an answer equal to the destination it built.
  - The later uses of the uri are all guarded by `withinFolder`: `files.read` and `files.remove` (`files.ts`), and the baker's `isPicked` check before `reencodeUpright`.
  - `PendingPhoto.set` accepts any uri, but every consumer re-checks it.
- **The original is removed on each path.**
  - Cancel and app dismissal: native answers null, and nothing is copied.
  - Native failure: Swift `removeIfFile`.
  - JS cancel followed by a copy that lands later, and a pick that lands under the lock: `picker.ts:53-55` removes the copy through the picker folder's remover.
  - Commit: stored, unreadable or failed, then `discard()` at `pending.ts:122`.
  - Back out or Let it go: `discard()`.
  - Replace or take-off: `settle()`.
  - App kill: `sweepPhotosAtLaunch` runs from `capture/sweep.ts:69`, and it does not read the switch.
- **App lock.**
  - `lockedNow` treats a throw as locked (`picker.ts:62-67`).
  - `appLocked` reads `getAppLockState().locked` (`device.ts:69-71`), which is true from cold start or after the grace passes until unlock (`machine.ts:97,105,116`).
  - Mutants M2 (a throw counts as unlocked) and M3 (no lock check) both go red.
- **Logs, analytics and crash reports.**
  - No console, analytics or tracking calls in `lib/photos`.
  - Native error text is dropped: the CANARY test, which also spies on console.
  - `failures.ts` holds letter ids in memory only.
  - The global handler records class codes only (`global-errors.logic.ts`), and there is no crash SDK yet.
  - Nothing in the late-copy IIFE can reject with a path, because `picked.remove` catches everything.
- **Single flight, Cancel and dismissal.** Mutants M4 to M7b go red: no late discard, any uri accepted, busy never reset, no single flight, and cancel doing nothing.
- **The round-4 tests fail on the old code.** With `picker.ts` and `device.ts` from 4dc135be, three tests fail: Cancel, one pick at a time, and the lock.
- **Other mutants caught.** 18 of the 20 mutants I ran go red; the two survivors are must-fixes 1 and 2. The red ones also include:
  - a commit with no discard;
  - a discard or undo that keeps a file;
  - a settle that keeps the set-aside original;
  - needs_words dropping the pending picture;
  - adopt not marking or not clearing;
  - any flag value counting as on;
  - a pause that can turn photos on;
  - an unreadable pause counting as paused;
  - a destination outside the folder;
  - a device discard that does nothing.
- **Tests and types at d0a04fe1.**
  - apps/mobile: 8 files failed, 270 passed (278); 73 tests failed, 5088 passed (5161). This matches the baseline exactly: config, privacy-manifest, store-sign-in-capabilities, licences, app-lock-wiring, capabilities, hosting-ios17, preflight-production.
  - tsc: the 5 known errors (expo-clipboard, expo-local-authentication).
  - The photos-device, photos-phone and photos-surfaces files: 61 of 61 pass.

Notes (not blocking this slice; most are for 4b, 4c or before EXPO_PUBLIC_PHOTOS turns on anywhere):
- **N1. The single flight can wedge the picker until relaunch** (availability; my design's open row N-P3).
  - `picker.ts:29` answers `cancelled` without calling native while `busy` is set, and `busy` clears only when `pickOne` settles or JS `cancel()` runs.
  - Scribe-photo frees a stale session only when the next `pickOne` call arrives. So if a session never answers (a covered sheet dismissed by code), JS never makes that call, and every later tap silently does nothing until relaunch. The same happens for the whole of a stalled iCloud download.
  - #838's `use-photo-start.ts` and `use-photo-pick.ts` never call `cancel()`.
  - Fix in scribe-photo: a `PickerHost` deinit that cancels the session. Fix in the screens: call `cancel()` on blur.
  - It also needs NS-01-R17b's Cancel affordance.
- **N2. "Nothing chosen above the lock reaches the book" is slightly overstated.**
  - The lock is read when the copy lands, not when the pick is made, so a pick made while locked whose iCloud copy lands after unlock is taken.
  - NS-01-R47 as written is met. The parent sees the picture before Keep, so the impact is low.
  - To close it, compare a lock epoch taken at `open()` with the one at landing.
  - Unverified: whether the FullWindowOverlay cover (added to the window when it mounts) actually leaves the picker usable.
- **N3. The pending picture is bound to neither a capture nor an account.**
  - `PendingPhoto` and `failures.ts` are process-global, and `adoptPending(pending, deps, ownerId, ...)` accepts any owner.
  - Protection from the wrong letter and from a sign-out or account switch rests on #838's screens: the Home focus discard, Listen close and Let it go.
  - Rec: give `set()` a capture token and match it at adoption, and discard on an auth change (signed out or a different user), with a `[NS-01-R29]` test. This can land in 4b, or before flag-on, together with NSC-03.
- **N4. A set-aside original lingers.**
  - After `remove()` or a replace, the original stays until something calls `settle()`; there is no timer when the Undo window ends.
  - `adoptPending` returns early when `source` is null (`adopt.ts:13`), so a picture taken off and then a Keep leaves the original until the next Home focus or launch.
  - Low: it stays inside the sandbox and is swept. Rec: call `settle()` in that early return once the window has passed.
- **N5. `commit` reads the whole original into JS with no size bound** (`pending.ts:116`). A ProRAW or large PNG costs tens of MB of heap before it is refused. Rec: check the size before reading. Low: it affects this device only.
- **N6. Native residuals my design asked for "when #837 wires the door" are still open** (N-B1r 1 to 3):
  - `.typeDirectory` for the Caches folders;
  - `fileIn` again inside `copyPicked`;
  - `.typeRegular` for the re-encode source.
  - Each needs code already inside the sandbox, and they are Swift, so they belong in a scribe-photo PR under NSC-01 before flag-on, not here.
- **N7. The `scanPickerUse` call count misses some calls.** It counts only `x.pickOne(...)`, so `const { pickOne } = native` or `native['pickOne']` in another file passes. It is a tripwire, and NSC-01 is the gate.
- **N8. Two small defensive gaps in `picker.ts`.**
  - The `uri !== out` path and the catch path (`picker.ts:52`, `:46-48`) do not discard `out`. A native partial or a stray copy then waits for the launch sweep.
  - Adding `void hooks.discard(out)` on those paths is cheap.
- **N9. Test titles cite review ids rather than the card's test names.** The locked card (450bcb4a) names `[NS-01-R47]`, `[NS-01-R52]` and `[NS-01-R17a]`, while the tests here cite `[C6]`, `[C7]` and `[NS-01-R17]`. Retitle them so the trace finds them.

Not verified:
- On a device:
  - no prompt;
  - Cancel;
  - a Cancel during an iCloud download, and the late copy being removed;
  - the lock over an open picker;
  - whether the cover leaves the picker usable;
  - the N-P3 hang;
  - the data-protection class of the `copyItem` copy (N-B2).
- Lens A matters: NS-01-R17b progress (stated as not met), the Undo semantics and the UI wiring in #838 and #839.
- CI at d0a04fe1:
  - `required`, `tests and content rules`, `typecheck` and `database rules` are success.
  - The store-profile Release launch was queued at 12:56 UTC; its state when this file was finalised is in the reply to Karma.
  - At 7122da97 that job passed.

Reviewer: independent of the author (CR-44).
