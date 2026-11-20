## Review B at 0f253840029aa8562a1f22c0a3ad194932b33b30: CHANGES
<!-- agent:design-systems -->

Lens B (design systems and accessibility): VoiceOver labels, traits, order and announcements; Dynamic Type to AX5; 44 pt targets; Reduce Motion; dark mode and contrast through tokens; Voice Control names; every word a content key; the picture never leading a person's words.
PR #838, photo slice 4b (BL-931, NS-01). Head 0f253840 confirmed from the API, pushed 12:21 UTC. Base feat/mobile-photo-4a-pending at d0a04fe1.
Diff reviewed: `git diff d0a04fe1...0f253840` (25 files, +561 -12).
Head movement (caption-ceiling round): my first pass was at 190d0f66. The two commits since, e67fba42 and 0f253840, are merges of 4a only (they carry #835's ceilings, #836's grapheme caps and the size-plus-50-MB check up the stack). This slice's own diff is unchanged: every added and removed line of `git diff d0a04fe1 0f253840` equals that of `git diff 7122da97 190d0f66`, outside the board line. The findings below were re-checked at 0f253840; line numbers are unchanged.

### What I read
- The PR body, and the whole diff: app/(tabs)/index.tsx, app/listen.tsx, app/review.tsx, app/write.tsx, components/photos/{photo-start,pending-photo-thumb,photo-frame}.tsx, lib/photos/{copy,hooks,surface,text,use-photo-pick,use-photo-start}.ts, lib/capture/start-capture{,.logic}.ts, features/photos.en.ts, and the five test files.
- Listen's whole Ready room at the head (listen.tsx:478-611) and Write's page (write.tsx:378-440), to place the new parts.
- components/ui/button.tsx (sizes, accessibility contract), lib/a11y.ts (announce, sizes), lib/auth/ui.tsx:143 (ErrorLine), packages/design-tokens/src/tokens.ts (line, controlBorder, radius, stroke, target).
- CLAUDE.md content rules; packages/content VOICE.md and BRAND.md (glossary, internal terms).
- Locked cards at 450bcb4a: 01-photo-with-a-letter.md (sections 4, 5, 6, 7 rows R1, R3, R9a, R13a, R19, R20a to R20e, R24, R39, R40, R41, R42; sections 8, 10, 15, 16) and 11-foundations.md (NS-33 rows R4, R9, R11, R16 and section 6 "Failed: errors are announced"; NS-34 hand-off budgets). Pre-lock ids read through 17-engineering-project-plan.md section 1.1 (R9 is R9a to R9c, R13 is R13a and R13b, R20 is R20a to R20e).
- Design spec 01 (docs/design/specs/01-PHOTO-WITH-A-LETTER-11nov.md) sections 3, 6, 7, 8, 9; DESIGN_LANGUAGE.md section 1 principle 5; COMPONENTS.md 2.23.
- Read-only context: the product thread's drafts on docs/e2e-ux-20nov at 38a614ac (A-capture/DESIGN.md A-J03, A-S04; A-capture/WORDS.md section 7). Not relied on as requirements.

### What I ran
In scratch worktrees with node_modules hard-linked from the main checkout:
- At f811c9a6 (the first pass): apps/mobile photos-surfaces, photos-capture, navigation-one-entry, start-capture: 69 tests; 68 pass, 1 fails on time only (note N9). With `--testTimeout=30000` photos-surfaces passes 19 of 19.
- At the #840 head 9a57d613 (contains this slice at 0f253840), with `--testTimeout=30000`: the same four files, 72 of 72 pass.
- packages/content photos-copy and rules: 140 of 140 at both.
- No device run.

### Findings

Must fix:

1. Ready with a picture offers no Type, and its VoiceOver order is not R20b's.
   - At the head Ready draws the heading, the audience line, `PendingPhotoThumb` (listen.tsx:546), the prompt (listen.tsx:549) and the red circle (listen.tsx:564). "Type instead" exists only in the microphone primer and the three start problems (listen.tsx:446, 458, 463). So after "Start from a photo", a parent whose microphone works can only speak; Close drops the picture (listen.tsx:448), and Home's Type then starts without it.
   - NS-01 section 4 steps 3 and 4 say Ready shows "Speak and Type" and the parent "taps Speak ... or Type and writes"; R20b names Type in the order; DESIGN_LANGUAGE principle 5 ("Equal doors"). A parent who cannot or will not speak aloud (deaf, speech disability, a sleeping baby) cannot start a letter from a picture at all.
   - Write already draws the picture (write.tsx:402) and `typeInstead` (listen.tsx:446) keeps the pending picture, so the fix is one Type control on Ready that uses it.
   - The order the code gives is thumbnail, "Change" (pending-photo-thumb.tsx:31), the failure line, the prompt, the red circle. R20b asks thumbnail, prompt, Speak, Type, Change. Keep Change under the picture on screen (section 4 step 4) and set the reading order with `experimental_accessibilityOrder` on the room (React Native 0.86.3 in this repo has it), or move Change after Type. Correct the comment at pending-photo-thumb.tsx:3, which claims the R20b order, and extend `[NS-01-R20]` in photos-surfaces.test.ts to pin the order and the Type control (today it checks only thumbnail before prompt).

2. "That photo could not be opened" is never spoken.
   - photo-start.tsx:24 and pending-photo-thumb.tsx:32 render a muted footnote with no `announce()` and no live region. After a failed pick, VoiceOver focus is back on "Start from a photo" (or Change) and nothing is said, so the control seems to do nothing.
   - NS-33 section 6 ("Failed: errors are announced"); WCAG 2.2 SC 4.1.3. Spec 01 section 6 names `ErrorLine` for this state.
   - Use the codebase's pattern: `ErrorLine` (lib/auth/ui.tsx:143) announces once and is a polite live region; or call `announce(photos.capture.openFailed)` when `failed` turns true and add `accessibilityLiveRegion="polite"` for Android. A test in the style of leave-sheet.test.ts can pin it.

Notes:
- N1. R39 (not met, BL-956). At accessibility sizes the thumbnail is `width - 48` wide at 4:3 (pending-photo-thumb.tsx:25, 30): about 327 x 245 pt on an SE 3, so the red circle is likely below the fold from AX1 (R39 starts at AX3). The room scrolls (listen.tsx:534), so it is reachable, not lost. The card holds the flag until R39 is met. Also, `48` repeats the `px-6` gutter of both hosts as a bare number; derive it from `tokens.space` or `onLayout` so the two cannot drift.
- N2. R42 and R40 (not met, BL-956): `resizeMode="cover"` crops panoramas (photo-frame.tsx:35), and the Image has no `accessibilityIgnoresInvertColors` (photo-frame.tsx:31-40). The second is one prop on a component this PR adds; cheaper now than later.
- N3. PhotoFrame tokens. `borderWidth: 1` (photo-frame.tsx:29) should be `tokens.stroke.control`. It uses `radius.md` while tokens.ts comments `radius.sm` as "photo thumbnails" (spec 01 says md); I will settle the token comment and COMPONENTS in my own follow-up. The edge is `line`, the decorative hairline (about 1.2:1 light, 1.4:1 dark), so in dark mode it barely shows; R41 (P2) asks for non-text contrast. That is a token gap I own: a media-edge token with its test in packages/design-tokens. Not blocking.
- N4. The thumbnail leaves the moment the take starts (listen.tsx:546, `phase === 'ready'`). Spec 01 section 3.2 keeps it while recording, and the room's own rule is that nothing above the controls moves when a take starts (the slot comments in listen.tsx). Taking 160 pt (245 at AX sizes) out above the aura re-centres the aura under the parent's finger. Check on a phone; if it jumps, hold the slot or keep a small thumbnail.
- N5. "Change" alone (`capture.change`) works for Voice Control on Listen (one Change on screen) but reads bare in the rotor. The product thread's words draft proposes "Change photo". For `content` and the founder.
- N6. Let it go with a picture pending (listen.tsx:438) drops it without the confirm saying so (spec 01 section 3.2 slot `capture.photo.dropNote`). For `content`.
- N7. Between the picker closing and Listen opening, `pending.set(...).then(onPicked)` runs with no busy state on the Home button (use-photo-start.ts:30); budget p95 1,000 ms (NS-01 section 8). VoiceOver hears nothing in that gap. If it is noticeable on an SE 3, the Button's `loading` (announced as busy) covers it.
- N8. Words: the five keys are marked PROPOSED with TODO(founder) and pass rules.test.ts and photos-copy.test.ts. The hint names {child}, which Home already shows (NS-33 section 8 privacy line holds). No "button" in any label.
- N9. Test timing: `[NS-01-R1] exactly 1 photo start exists` parses the whole src tree in one test. In my worktree (4 cores) it took 7.3 to 8.6 s against vitest's 5 s default and failed on time three runs out of three; it is green in CI. Give it an explicit timeout or narrow the walk before it flakes on a slow runner.
- N10. Accessibility-prop tests: `[NS-01-R20]` checks size md and that a hint exists. It does not check the order, the Type control or the announcement; add those with must-fix 1 and 2.
- N11. COMPONENTS.md 2.23 still gives PhotoFrame the label "Photo from {date}", which R9a and R9b forbid, and expo-image. Bringing it in step is my standing duty, not this PR's.
- N12. Good: the start is absent, not greyed, without the switch or a picker (use-photo-start.ts:12); it is a quiet md Button (48 pt) inside the cluster between Speak/Type and "Not much today" (index.tsx:258); the icon sits inside the Button's single element, so VoiceOver reads one name; the picture's label is the parent's words or "Photo with this letter" (text.ts photoA11yLabel); the blank box keeps the same label and role (photo-frame.tsx:30); no colour or size is typed into a screen apart from N1 and N3.

### What only a phone can show (SE 3, Asha test install, D13)
- VoiceOver on Ready with a picture: the real order, where focus lands after the push (spec 01 section 8 wants the thumbnail), and the failure line spoken once.
- AX3 to AX5 with Bold Text: Home's cluster with the start wrapping at 44 pt or more; Ready with the 4:3 thumbnail; whether Speak (and Type, after the fix) are on screen or one scroll away; Write with the keyboard up.
- The take starting: whether the aura moves when the thumbnail leaves (N4).
- Reduce Motion: the thumbnail rides the room's `motion.enter(2)`; confirm a fade only.
- Dark mode and Increase Contrast: the frame edge (N3); Smart Invert on the thumbnail (N2).
- The app switcher: the blank box (R13a).
- Voice Control: "Tap Start from a photo" and "Tap Change".

CI at the head: PENDING_CI_LINE

Reviewer: independent of the author (CR-44).
