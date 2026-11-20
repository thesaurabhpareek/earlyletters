## Review A at 0f253840029aa8562a1f22c0a3ad194932b33b30: CHANGES
<!-- agent:principal-architect -->

Lens A (correctness, tests that fail on the old code, code shape, module boundaries). PR #838, photo slice 4b (BL-931): photo-first on Home through startCapture, the Ready thumbnail, and Keep storing the pending picture. Base feat/mobile-photo-4a-pending at d0a04fe1. Diff reviewed: `git diff origin/feat/mobile-photo-4a-pending...origin/feat/mobile-photo-4-capture`.

Head history. I started at 190d0f66. The head moved to 0f253840 (12:27 UTC), a merge of 4a only (e67fba42, 0f253840). I compared the slice's own diff at both heads: it is unchanged apart from context lines that come from the base (a text.ts comment, and the imports in photos-capture.test.ts). Everything below holds at 0f253840.

Must fix:
1. The slice's leave-and-keep wiring has no test that fails without it (CODE-R04). These are behaviour changes this PR makes and states in its body ("Let it go and Close drop the pending picture. Keep stores it with the letter"). They carry NS-01-R4 and R52 (P0 (a): the picker's temporary copy, which still has its location, is deleted on back-out and on Let it go) and the slice's core Keep path. Each mutation below, applied alone at 0f253840 against start-capture, navigation-one-entry, erase-all and the four photo test files (178 tests), stays GREEN. Each also stays GREEN at the top of the stack (#840, 9a57d613, 199 tests), so no later slice closes it:
   - N1: `discardPendingPhoto()` removed from Listen's Close, `src/app/listen.tsx:448`.
   - N2: the same call removed from Listen's Let it go, `listen.tsx:438`.
   - N3: Home's focus discard removed, `src/lib/photos/use-photo-start.ts:19-23`. This is the path a swipe back from Ready takes.
   - N4: `await commitPendingPhoto(draft.id, finalText)` removed from Review's Keep, `src/app/review.tsx:638`. At #839 and later, Review adopts the picture to the draft when it opens, which covers most of this. But the Keep call is still the one path for a picture still pending at Keep (an adoption still running, or one that failed).
   - Fix: pin each call the way this PR already pins the R19 guards, with source tests that fail when the call is removed or moved. Better still, move the leave steps into one tested function, for example `leaveCapture()` in lib/photos, so a screen calls one thing.

Notes (most serious first):
N1. The R1 AST test can time out. `test/photos-surfaces.test.ts:39` parses every file under src with the TypeScript compiler. Here it took 10 to 19 s against vitest's 5 s default when other work ran beside it, and failed as "Test timed out in 5000ms". CI passed it, but a loaded runner can turn develop red. Give it an explicit timeout, or filter by a plain text match for `PhotoStartButton` before parsing.
N2. The R3 test cannot fail. In `photos-surfaces.test.ts:69-80` the loop makes a PhotoSession per picture but never passes it to `selectPrompt`, so the test only shows that `selectPrompt` is deterministic. The real guarantee is structural: Home builds the same prompt object for Speak, Type and photo (`(tabs)/index.tsx:206` and `:247`). Pin that instead (the photo start's prompt argument equals `promptParam`).
N3. The pause on the Home start is not pinned in this slice. Mutation N8 (`photoStartShows(paused = false)`, use-photo-start.ts:10) is GREEN at 0f253840. #840 adds `[NS-01-R19] every surface asks for the pause`, which turns it RED, so the stack closes it.
N4. The snapshot cover's phase mapping is unpinned. Mutation N5 (`usePictureCovered` always passes 'active', hooks.ts:26) is GREEN; only `pictureCovered` and the PhotoFrame regex are tested. The phase mapping is one line: worth a pure helper and a test. Also, `pictureCovered`'s `lockOn` and `unlocked` parameters (surface.ts:23) are never passed by any caller (CODE-R09). NS-01-R13b ("no picture before unlock") therefore rests entirely on the App lock cover.
N5. Module boundary. `src/lib/photos/text.ts:2` now imports `./copy`, which pulls in @scribe/content and lib/copy, only for `photoA11yLabel`. text.ts is on the data path (session.ts uses it to cap the stored words), and it was pure before this PR. Move `photoA11yLabel` into copy.ts or a small label.ts.
N6. `registerPhotoDevice()` runs in the render body of two hooks (use-photo-start.ts:16, use-photo-pick.ts:13). It is idempotent, but a side effect in render. Call it once from the root layout or a module-level init.
N7. Keep now waits for the whole commit (read, strip, signature scan, hash, write, and a re-encode of up to 20 s) before `countAfterSave` and `finishSave` (review.tsx:638-641). That work runs on the JS thread, so the saved moment comes later. From #839 on, the draft already holds the picture, so this mostly does nothing. Until then, a draft held at the Plus gate (`:586`) keeps its picture only in memory, and Home's focus discard drops it. Both are acceptable for a flag-off slice that merges with 4c; worth a line in the body.
N8. Card rows that the locked card marks "not met in #838", for the record, not for this slice: R39 (the thumbnail grows to the screen width at accessibility sizes, pending-photo-thumb.tsx), R40 (no `accessibilityIgnoresInvertColors` in PhotoFrame), R42 (`resizeMode="cover"`, photo-frame.tsx:35).
N9. Size (CODE-R02): 573 changed lines in 25 files without the lockfile and licences (343 code, 229 tests, 1 board line). The founder's exception covers it, and it has not grown.

What I checked:
- NS-35, one start. Home calls `startCapture({ source: 'photo', ... })` only after a pick (index.tsx:206). The `photo` plan pushes /listen with the same prompt params and no event or arming (start-capture.ts and start-capture.logic.ts). Mutation N7 (arm Listen) is RED. navigation-one-entry fails N3(d) on a direct push from Home or from a photo file. No other file pushes a capture route.
- NS-01-R1: one PhotoStartButton, in Home's cluster beside ButtonRow (the AST test). No other route imports the photo start.
- R13a: every component that draws an Image goes through PhotoFrame, which blanks while not active (mutation N6 RED).
- R18: no billing, plan or core import in the photo code.
- R19: the Home start is drawn only with the switch on, no pause, and a registered picker (source-pinned).
- No log, analytics or network call is added. The new strings come from packages/content, each marked TODO(founder).
- Full apps/mobile suite at 0f253840, in a scratch worktree: 278 files, 8 fail, 73 tests fail, 5106 pass. That is exactly the sandbox baseline (app-lock-wiring, capabilities, config, hosting-ios17, licences, preflight-production, privacy-manifest, store-sign-in-capabilities). tsc --noEmit: the 5 known errors only. packages/content: 19 files, 401 tests, all pass.
- CI at 0f253840 (REST, about 12:56 UTC): required, compliance-fence, applied migrations unchanged, tests and content rules, typecheck, web and web e2e are success. The iOS simulator build and one store-profile run were skipped. The other store-profile Release launch and the e2e simulator app were queued.

Not verified:
- On a device: the switcher snapshot timing (AppState 'inactive' re-renders before iOS takes the snapshot), VoiceOver order, AX5, Reduce Motion, and the picker flow.
- The queued store-profile Release launch and e2e simulator app.

Reviewer: independent of the author (CR-44).
