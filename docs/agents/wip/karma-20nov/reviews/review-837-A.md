## Review A at d0a04fe15629ddb339a445eafeae703d7ed14831: CHANGES
<!-- agent:principal-architect -->

Lens A (correctness, tests that fail on the old code, code shape, module boundaries). PR #837, photo slice 4a (BL-931): the picker port, the pending picture, the switch and the remote pause. Base feat/mobile-photo-3b-stored-copy at 68d82717. Diff reviewed: `git diff origin/feat/mobile-photo-3b-stored-copy...origin/feat/mobile-photo-4a-pending`.

Head history. I started at 7122da97. The head moved to d0a04fe1 (12:21 UTC) for the caption-ceiling round. The new commits are merges from #835/#836 only (7ace6aea, d0a04fe1 and the 3a/3b commits under them). I compared the slice's own diff at both heads: it is unchanged apart from two import context lines in photos-device.test.ts that come from the base. Everything below holds at d0a04fe1.

Must fix:
1. The flag-off proof cannot fail (CODE-R04; NS-01-R19). `registerPhotoDevice` checks the switch at `src/lib/photos/device.ts:59` (`if (registered || !photosBuildEnabled()) return;`). The test the body names as the flag-off proof, `test/photos-phone.test.ts:130` ("with EXPO_PUBLIC_PHOTOS unset nothing registers"), passes with that check deleted. In Node the native module is always absent, so `if (!native) return;` at `device.ts:62` keeps the registry empty whatever the switch says.
   - Mutation M1 (`if (registered) return;`), run at both 7122da97 and d0a04fe1 against photos-device, photos-phone, photos-surfaces and photos-capture: GREEN, 78 of 78 pass.
   - No test registers anything either. A regression that never registers would ship a dead feature unseen.
   - Fix: stand in a native module (`vi.mock` of `modules/scribe-photo` with a `pickOne`, or a test-only seam in `nativePhoto`), and reset the module-level `registered` latch between cases (`vi.resetModules()`). Then pin three cases: switch off with the module present registers nothing; switch on with the module present registers both the picker and the pending picture; switch on without the module registers nothing (that last one exists, `:137`).
   - The surfaces also check the switch (use-photo-start.ts, letter-photo.tsx, book.tsx), so nothing is drawn today. But this is one of the two layers, and it is the one the PR cites as its proof.

Notes (most serious first):
N1. Where the switch is read (CODE-R14). `src/lib/photos/flag.ts:6-8` copies `parseServerFeatures` from `src/lib/capabilities.ts:115-117` as `parsePhotosFlag` and reads `process.env.EXPO_PUBLIC_PHOTOS` outside the file whose header says it holds the build's flags. #798 does the same for Find (`lib/find/flag.ts`), so two feature folders now each carry a flag reader.
   - Neither `scripts/preflight-production.mjs` nor `preflight-testflight.mjs` mentions `EXPO_PUBLIC_PHOTOS`. A later eas.json change that switched it on in `production` would pass the preflight, and the card's G6 gate has no check behind it.
   - Suggest: read it in capabilities.ts with `parseServerFeatures` and re-export it from photos/flag.ts. Add a preflight-production row "EXPO_PUBLIC_PHOTOS not on" (owner `mobile`, with `qa` for the preflight). One small follow-up PR before the flag turns on anywhere would do.
N2. `adopt.ts:10-14` keeps a module-level `adopting` latch and drops a second call silently. With one pending picture this works: an in-flight draft adoption (4c) finishes against the same id that Keep uses, and put() writes `entry_id` once the letter exists. But the latch belongs to the PendingPhoto, not the module. A comment saying why a dropped call is safe would stop a later edit from making it unsafe.
N3. NS-01-R17b (iCloud progress and a native Cancel) stays open, as the body and `picker.ts:13` say. The plan carries it as P-1 (17:96). `cancel()` ends the JavaScript wait (`picker.ts:58`, mutation M10 RED), and the late copy is removed (M5 RED).
N4. Size (CODE-R02): 699 changed lines in 15 files without the lockfile and licences (362 code, 336 tests, 1 board line). The founder's exception of 20 Nov covers it, and it has not grown since.

What I checked:
- picker.ts: one pick at a time (`:29`), Cancel settles at once (`:58`), a foreign uri is `failed` and is never removed, a pick under the app lock answers `cancelled` and its copy goes (`:53`), and a lock state that cannot be read counts as up (`:62-68`). device.ts reads the lock lazily (`:75-78`) and wires the remover to the picker folder only.
- pending.ts: the original is removed after every commit result except `needs_words` (`:108-122`), on discard, on settle and on Undo of a replace.
- pause.ts: an unreadable config does not pause (fail-open to hidden-only, as documented). failures.ts holds only ids in memory.
- No log, analytics, network or `console` call in `lib/photos` or `components/photos` (grep). No picker, camera or media-library package (the AST scan, with a positive control).
- Mutations, each alone and restored, against the four photo test files:
  - RED: M2 no single flight; M3 lock not checked; M4 unreadable lock counts as open; M5 late copy kept; M6 missing native module ignored; M7 original kept on a failed commit; M8 failure not marked; M9 unreadable config pauses; M10 cancel only flags; M11 Undo keeps the replacement's original.
  - GREEN: M1 (Must fix 1).
- Full apps/mobile suite at d0a04fe1, in a scratch worktree with node_modules hard-linked: 278 files, 8 fail, 73 tests fail, 5088 pass. That is exactly the sandbox baseline (app-lock-wiring, capabilities, config, hosting-ios17, licences, preflight-production, privacy-manifest, store-sign-in-capabilities; expo-local-authentication and expo-clipboard are missing here).
- tsc --noEmit: the 5 known errors only (help-fallback.tsx and app-lock/controller.ts). packages/content at d0a04fe1: 18 files, 395 tests, all pass.
- CI at d0a04fe1 (REST, 12:56 UTC): required, applied migrations unchanged, compliance-fence, tests and content rules, typecheck and the other checks are success. The iOS simulator build was skipped (no native change). The store-profile Release launch was still queued. The head is more than 10 minutes old.

Not verified:
- Anything on a device: no permission prompt, Cancel during an iCloud download, the lock coming up over an open picker, a Live Photo's still.
- The queued store-profile Release launch.

Reviewer: independent of the author (CR-44).
