# Theme 35: Flows, motion and delight (a more material app that never hurries anyone)

Readiness: 18 of 28. Author's score (`design-systems`), `qa` to confirm. Remains: the founder's three answers in section 13 (sound, haptics, how bold the Keep moment is), one on-device look at Build 12 to learn which moments the founder found flat (no screenshot or named screen exists), a `mobile` read of the files marked UNVERIFIED, and the device rows in section 9 numbered at merge time. The audit (section 3), the principles (section 2) and the slices (section 10) need no answer and are finished.

Status: draft, 9 Nov 2026 (UTC). Docs only. Assigns no BL, D or CR id. Written after the founder tested Build 12 and said the app should feel "more material, exhaustive and engaging: better flows, better transitions, better animations, quality that keeps improving." (paraphrase of the brief to this lane; the words reached this file second hand, there is no verbatim quote, screenshot or screen name).

| | |
|---|---|
| Working label | NX-35 (working id, see `_CONVENTIONS.md`); no backlog rank assigned yet |
| Refines | `docs/design/MOTION.md` v0.2 (the whole file; this requirement adds rows, it does not replace it), `docs/design/DESIGN_LANGUAGE.md` section 8, `docs/design/COMPONENTS.md` 2.15 and 2.17, `docs/design/SOUND.md`, `docs/tdd/09-accessibility-design-system.md`, F09 (book), F04 (capture), F03 (first run) |
| Builds on, does not re-specify | NX-30 (Tonight "From the book" row, option L1, rows R2 and R14; the You tab, NX-30a), NX-31 (first run and sign-in order), NX-32 (account management), NX-33 (photos), NX-34 (audio backup, restore states, row R13). NX-33 and NX-34 are on branches `docs/nx-33-photos-8nov` and `docs/nx-34-audio-backup-8nov`, read on 9 Nov; neither was merged when this was written |
| Tag | EVIDENCE for what the code contains (searched on `origin/develop` at `bf5591be`, 9 Nov). HYPOTHESIS for every statement about what the founder felt and for every claim that a change makes the app more engaging. Nothing was run on a device: every "what the user sees" line in section 3 is DERIVED FROM READING and UNVERIFIED on device |
| Size | S0 S, S1 M, S2 L (estimates, nothing measured). See section 10 |
| Gate | Founder answers in section 13. No counsel gate: no new string a person agrees to, no data collected. New words (the few listed in section 8) go through `content` |
| Order | After the Build 12 device run. See section 10 for what, if anything, may ride in Build 12 (recommendation: nothing that changes what a screen does) |

## 1. What the parent should feel, in plain words

They tap Speak and the room goes dim and quiet, and the glow follows their voice, and they know it hears them. They stop, read their words, tap Keep, and the letter settles into the month with a small, warm confirmation, and the next morning Tonight shows one of their own letters back to them. Moving around never feels like a jump: every screen change has a direction that makes sense, and when something takes time (the words coming back after a restore, a picture being added) the app says so calmly and shows it moving. Nothing flashes, nothing counts, nothing asks them to hurry. If they have turned on Reduce Motion, every moment still happens; it fades instead of travelling.

## 2. Principles (they fit the product, and each one is a test)

Eight, in this order. MOTION.md section 2 has six principles already; these keep them and add what Build 12 feedback needs.

1. **Motion carries meaning, never pressure.** A movement says "this was saved", "this is where it went", "this is still working". It never says "hurry", "you are behind" or "come back".
2. **Celebrate what exists, never count gaps.** A good moment is built on a letter that is in the book now. No moment shows a number of letters, days, gaps or time left; no empty state shows what is missing (CLAUDE.md content rules; `NX-30-R4`).
3. **No streaks, points, badges or confetti for engagement.** Delight is a soft wash, a drawn line, a settled card and one sentence. Confetti, particles, bounces, rewards that escalate and sound as a reward loop are out (MOTION 1 "Duolingo: avoid"; SOUND 1).
4. **No fear, guilt or loss language, and no motion that implies it.** A save-failed state does not shake, flash red or pulse. It stays still, says what is true and offers one action.
5. **The machine adds no meaning to words.** Words never animate in a way that suggests they are being written, polished or chosen: no typewriter effect on a kept letter, no "shimmer" over a transcript, no highlight on a word that was not spoken. The live words entering (MOTION 5c) fade whole words in from real speech and stay as they are.
6. **Audio capture is never affected.** Nothing may be added to Listen that costs frames or main-thread time while a take is recording. Recording is the product; polish never outranks it (section 9, the frame test).
7. **Every moment has a Reduce Motion form and a screen-reader form, written first.** A moment without both is not specified (MOTION 4; section 4 below).
8. **Quiet beats busy.** One thing moves at a time. Controls are on screen and tappable from the first frame (MOTION principle 2). A moment is at most `tokens.motion.sequenceMaxMs` (900 ms) unless it is the one save hand-off the Motion file already allows (about 1.1 s, under `hardCeilingMs` 2000 ms).

## 3. Audit: what moves today (from code, `origin/develop` at `bf5591be`, 9 Nov 2026)

**Honest headline.** The app is not unanimated. It already has a written motion system (`docs/design/MOTION.md` v0.2), motion tokens (`packages/design-tokens/src/tokens.ts`, `motion`), a hook (`apps/mobile/src/lib/motion.ts`, `useMotion()` with Reduce Motion handled and a single `routeTransitions` table in `lib/transitions.logic.ts`), a haptic wrapper with five intents (`lib/haptics.ts`), the card-to-page open (`components/motion/card-transition.tsx`), the page turn, the listening aura, the saved moment, the lamp and an empty-state breath. Reanimated 4.5.1, react-native-worklets 0.10.1, react-native-gesture-handler 2.32 and expo-haptics 57 are all in `apps/mobile/package.json`; no animation library needs adding for anything below. So why did the founder find it flat? HYPOTHESES, in order of likelihood, none tested: (a) much of the motion is deliberately subtle (the lamp is "subtle by design", NX-30 H2) and may read as "nothing happens"; (b) the moments are individually designed but the gaps between them (tab switch, Settings, sign-in to book, waiting states) are plain platform defaults; (c) there is no visible "my own book is here" on Tonight (NX-30 L1) so even good motion has little to show; (d) a build that was not the one MOTION.md describes. Only a walkthrough on a device with the founder can tell these apart; section 13 asks for it.

Labels: **Built** = the code for it exists on `develop`. **Gap** = no code found. Every row is DERIVED FROM READING; UNVERIFIED on device.

| # | Screen or flow | What animates today (file) | Label |
|---|---|---|---|
| A1 | Tonight, cold launch | Dateline, greeting, prompt and cards `enter` once per cold launch, 280 ms, 30 ms stagger, `useMotion().enter(i)` (`(tabs)/index.tsx` lines 214 to 316); lamp `tonight` by daypart, `persistKey="tabs"`; prompt swap on "Another thought" fades (lines 217 to 223) | Built |
| A2 | Tonight, a kept letter shown back | None. `resurfaced-card.tsx` shows only when no draft waits and a letter is 28 to 35 days old (NX-30 evidence); the NX-30 L1 row does not exist | Gap (specified in NX-30, not built) |
| A3 | Tab switch | Native swap, no animation by design (MOTION 5i, 5.8 row 6); the lamps share `persistKey="tabs"` and settle over `lamp.returnMs` (280 ms). Tab labels do not scale (`_layout.tsx` `tabBarAllowFontScaling: false`) | Built (deliberately plain) |
| A4 | Tap Speak to Listen | `fullScreenModal`, `animation: 'fade'`, `route.dissolveMs` 280 ms; `useUnlitRoom()` fades the lamp (`listen.tsx` line 146); `haptic('press')` on start (start tick, `start-tick.logic.ts`) and on stop (`listen.tsx` line 251) | Built |
| A5 | Recording feedback | `ListeningAura`: radial glow driven by metering dBFS in `useFrameCallback`, attack 80 ms, release 400 ms, idle breath 7500 ms after 600 ms of quiet; Reduce Motion gives a static ring with stepped opacity (`listening-aura.tsx`, `tokens.motion.breath`); live words fade in (`transcript.tsx`); minute announcements to VoiceOver (`listen.tsx` line 221) | Built |
| A6 | Stop to Review | `review`: `fullScreenModal`, fade, `route.dissolveMs`; Review content `enter`s; words swap fades `swapMs` 150 ms; Put it back washes `newMarkMs` 1600 ms (`review.tsx` lines 927 to 993) | Built |
| A7 | Keep, the letter joins the book | `SavedMoment`: card scales 1 to 0.9 on `gentle`, chip at 250 ms, card moves down 24 pt and fades at 550 ms, `onDone` at 900 ms; `haptic('success')` first (`review.tsx` line 495); the Book lands on the new card (`arrived` param) with a 1.6 s accent wash; reminder ask or sign-in card follows after `signInAfterLandingMs` | Built |
| A8 | Book to a letter | `CardSource` and `CardToPage`: a measured-rect grow of the card to the full page, words carried, `transparentModal`, `animation: 'none'`; close reverses; Reduce Motion is a 200 ms hand-off. The native shared-element API is not used (`sharedTransitionTag` is not in `src`; searched) | Built |
| A9 | Read together | Page turn 24 pt over `exitMs`, swipe follows the finger, soft edge; word wash tracks audio; dusk lamp at night | Built |
| A10 | Onboarding | Lamp scenes cross-fade between steps (`persistKey="firstRun"`); step words leave up 8 pt over `exitMs` and the next rise in (`onboarding.tsx` lines 203 and following); the book cover takes the typed name after a pause; `haptic('success')` on "The book is open." (line 180); any tap completes the cover. No dedicated "first letter kept" animation beyond A7 | Built (A7 is the first-letter moment) |
| A11 | Milestone note card (MOTION 5h, first letter, 100 letters) | `DrawOn` and `Breathe` exist in `components/motion/`; no screen renders a milestone note (searched `DrawOn`, `milestone` under `app` and `components`, 9 Nov) | Gap (specified in MOTION 5h, not found built) |
| A12 | Settings and sub-screens | Native push, no custom motion (5.8 row 9). Some screens use `Animated` for row enters (`settings/reminders.tsx`, `recently-deleted.tsx`, `account.tsx`) | Built (plain) |
| A13 | Sign-in to book | `/sign-in` is a `modal` (native rise); `verify.tsx` shows an `ActivityIndicator`; after sign-in the sheet dismisses and the Book lamp `arrive`s only for a second parent joining (5.8 row 12). No first-account arrival | Partly built; gap for the NX-31 moment |
| A14 | Photo add | No code: no image picker in `apps/mobile/package.json` (NX-33) | Gap (feature does not exist) |
| A15 | Empty states | `EmptyState`: line art draws once, then breathes opacity 0.85 to 1 over 8 s while focused (`empty-state.tsx`, `Breathe`); Reduce Motion draws it complete and still | Built |
| A16 | Loading and waiting | No skeleton component found. Waiting is an `ActivityIndicator` (`verify.tsx`, `settings/account.tsx`, `open-deletion.tsx`, `button.tsx`) or a `progressbar` role bar (`settings/storage.tsx`, `export.tsx`, `speech-consent-card.tsx`). `settings/backup.tsx` shows the line `restoreLooking` | Gap for sync and restore |
| A17 | Save failed, offline | Static: `review.tsx` line 670 announces `r.saveFailed`; the global fault screen is static (`resilience/global-fault-screen.tsx`). No motion, which matches principle 4. No offline banner motion found (UNVERIFIED) | Built (static, deliberate) |
| A18 | Sheets and toasts | `Sheet` rises on `standard`, fades under Reduce Motion; toast enters, a new toast cross-fades over the old (`swapMs`) | Built |
| A19 | Haptics | `tap` selection, `press` light, `soft`, `success`, `warning`; throttled to one per 100 ms; policy "a haptic marks an outcome, never a navigation" (`haptics.shared.ts`). About 60 call sites, including many `tap`s on choices and chips | Built |
| A20 | Sound | `docs/design/SOUND.md` specifies an opt-in "Paper sounds" setting, off by default. No setting or player found in `apps` or `packages` (searched "paper sounds", 9 Nov) | Specified, not built |
| A21 | Reduce Motion and contrast | `useReducedMotion()` subscribes to `reduceMotionChanged`; `useTheme()` carries `highContrast` and `reduceTransparency`; the lamp and saved moment honour both. Low Power Mode is not read (needs `expo-battery`, a new dependency, MOTION 5k) | Built; Low Power is a Gap |
| A22 | Literal durations in screens | Two numbers outside the tokens: `FadeIn.duration(150)` in `letter/[id].tsx` line 223 and `duration: 90` in `components/motion/press.ts` line 46 (both Reduce Motion paths) | Defect against "never hard-code a duration" |
| A23 | Tests that guard motion today | `apps/mobile/test/transitions.test.ts` (route table is tokens, Reduce Motion rule), `design-system-gaps.test.ts`, `listen-meter.test.ts`, `recording-haptics.test.ts`, `saved-moment-playback.test.ts`, token tests in `packages/design-tokens/test/tokens.test.ts` (2 s ceiling, springs damping at least 0.9). No test scans for literal durations, none measures frames, none takes a picture of a moment | Partial |

**What the audit says in one line (HYPOTHESIS).** The big signature moments are built. What is missing is (1) things to see on Tonight (A2), (2) the in-between moments (A13, A16), (3) the milestone note (A11), (4) a way to keep the whole thing from sliding back (A22, A23). That is also the honest scope of this requirement: it is more about connective tissue and a quality ratchet than about new spectacle.

## 4. Rules that apply to every moment below (so each spec lists only what is different)

- **Tokens only.** Durations, distances, springs and easings come from `tokens.motion` (`fadeMs` 200, `exitMs` 160, `enter` {dy 8, 280 ms}, `easing` [0.2, 0, 0, 1], `staggerMs` 30, `staggerMax` 6, `sequenceMaxMs` 900, `hardCeilingMs` 2000, `newMarkMs` 1600, `file`, `cardToPage`, `route.dissolveMs` 280, `swapMs` 150, `lamp`, `breath`, `emptyBreathMs` 8000, `drawMs` 1200, `press`). A value marked "proposed" is a token to add in `tokens.ts` with its test before any screen reads it (S0). Springs are `snappy`, `standard`, `gentle` (all damping ratio at least 0.9, tested).
- **Reduce Motion form.** One of: the final state at once, or one `fadeMs` (200 ms) cross-fade. Nothing travels, scales, breathes or draws. Reanimated's `ReduceMotion.System` jumps, so each moment uses `useMotion()` (`reduced`, paired fade), not the raw setting (MOTION 4).
- **Haptics.** Light only, and only where MOTION 6 allows (an outcome). iOS honours the person's System Haptics switch for UIKit generators (UNVERIFIED: not tested on a device; Apple documents the setting but I did not open the page today). Android uses `performAndroidHapticsAsync`. The app has no in-app haptics switch today; section 13 asks whether to add one.
- **VoiceOver.** An announcement is made through `announce()` in `lib/a11y.ts` (it queues behind other speech and the speech gate in `lib/speech-gate.ts` holds it while a take is recording). Motion is decorative: the moving element is hidden from VoiceOver and the outcome is announced once.
- **Dynamic Type through AX5.** Letter text is never truncated (D-027), never scaled by the motion, and its size never animates. At accessibility sizes a moment shows fewer excerpt lines (existing `SAVED_CARD_LINES_LARGE` 2) and the outcome line wraps whole. Tab labels stay at the 13 pt floor (chrome, not letters).
- **Dark mode.** The same tokens. Washes use `accentSoft` per theme; a glow that is visible on paper must be checked on the dark paper (the lamp has per-theme `peak`). Increase Contrast and Reduce Transparency give plain paper and a `line` edge, no lit edge.
- **Low-end device budget (iPhone SE 3rd generation, the lowest target; Android mid-tier 60 Hz later).** Proposed budget for every moment: 60 fps, no frame longer than 16.7 ms (the existing MOTION 7 rule 6 target), only `transform` and `opacity`, no shadow, blur, font-size, elevation or per-frame gradient animation, one continuous loop on screen at most. These are targets, not data: no frame time has been measured by this lane. How they are tested is section 9.
- **Interruptible.** Any tap lands on the end state (MOTION principle 4).
- **Test titles** start with `[NX-35-Rn]`. A "Fails on old code" line says what the tree does today.

## 5. The moments, one spec each

Ids are working labels. Where a moment is already built, the row says "refine" and what changes; where nothing exists it says "new".

### M1 Tab switch (NX-35-R1) refine, S1

- Purpose: moving between Tonight, Book and You (NX-30a) feels like walking between rooms, not a hard cut.
- Trigger: a tab press.
- Today: native swap, deliberately (A3). **Recommendation: keep the native swap.** The custom transition MOTION rejected still stands; a cross-fade of two text-heavy screens "reads as a mess" (MOTION 5.8 hand-off). What to add: the incoming tab's first content fades in over `exitMs` (160 ms, existing token) only when it was not shown yet this session; a return shows no re-entry (5.8 rule 2). A new "You" tab (NX-30a) uses the same rule and the lamp `persistKey="tabs"`.
- Duration and easing: lamp `returnMs` 280 ms (existing); content fade `exitMs` 160 ms, `easing` token.
- Moves: lamp and the tab's first content opacity only.
- Reduce Motion: no fade, final state.
- Haptic: none (MOTION 6: tabs are silent).
- VoiceOver: the system announces the selected tab; add nothing.
- AX5: tab bar height grows with the label rule already in `_layout.tsx`; unchanged.
- Dark: unchanged.
- Budget: opacity only.
- Test: `[NX-35-R1] a tab switch plays no transform and no haptic, and a returning tab does not re-enter its content`; `apps/mobile/test/motion-tab-switch.test.ts` (proposed). Fails on old code: partial; the first half passes today (tabs add no transition, `transitions.test.ts`), the second half asserts a new session-scoped "seen" flag for the You tab that does not exist.

### M2 Opening Tonight, with a kept letter from the book (NX-35-R2) new, S1 (rides NX-30 L1)

- Purpose: when the person opens the app they see their own words back, arriving gently; this is what makes the app feel like theirs (NX-30 L1, row `NX-30-R2`).
- Trigger: cold launch, or return to Tonight, with at least one kept, non-private letter.
- Duration and easing: on a cold launch the "From the book" row enters last in the Tonight stagger (index after the actions, 280 ms, `easing`, 30 ms stagger, within `sequenceMaxMs`); on a return, no motion (it was already there). The row's thumbnail (if NX-30-R14 builds a cover thumbnail) fades in at `fadeMs`. Tap on the row: the existing card-to-page open (M8).
- Moves: opacity and an 8 pt rise of the row only. The kept words are never animated (principle 5): the row appears whole, with the existing `ExcerptFade` static fade-out at the end of the excerpt.
- "Tap to hear" (NX-30 option): pressing play uses the press feedback only, no motion on the row, and no autoplay (NX-30).
- Reduce Motion: appears with the screen (final state) or `fadeMs`.
- Haptic: none on arrival; `tap` on play (existing `tap` vocabulary).
- VoiceOver: the row reads "From the book", the date, and the first words; its order is after Speak and Type and before the waiting drafts' folded row, as NX-30-R2 says. No announcement on arrival.
- AX5: the excerpt shows whole lines then a fade; the row grows; the Speak and Type buttons stay above it.
- Dark: excerpt colour from `text`; no wash.
- Budget: part of the existing Tonight stagger; no new loop.
- Test: `[NX-35-R2] the From the book row enters once on a cold launch and not on a return`; `apps/mobile/test/tonight-from-the-book-motion.test.ts` (proposed). Fails on old code: the row does not exist (A2).

### M3 Record button and waveform or level feedback (NX-35-R3) refine, S1

- Purpose: the person sees that the phone hears them, without a meter that measures them.
- Today: the aura (A5). MOTION deliberately avoids a scrolling waveform (founder rule recorded in MOTION 1, "Voice Memos: avoid"). **Recommendation: keep the aura, no waveform.** This lane did not find the rule's origin, so the "founder rule" wording is MOTION's, not verified.
- States and what changes (all existing, listed so a test can pin them): Ready (red circle, no aura), Starting (the circle presses to 0.98 on `snappy`, `press` haptic once), Recording (aura scale 1 to 1.18 and opacity 0.18 to 0.40 follow the voice; idle breath after 600 ms of quiet), Paused (aura still, label "Paused" announced, no haptic), Stopping (`press` haptic after the session ends, then the dissolve to Review).
- Proposed refinement (S1, optional): a visible, still elapsed-time line that does not move per second (it updates once a second as text, existing `use-recorder-clock.ts`). No new animation.
- Reduce Motion: static ring, stepped opacity, at most one change per 400 ms (existing).
- Haptic: `press` at start and stop only; iOS mutes haptics while recording, so the stop tick plays after the session ends (existing, `recording-haptics.test.ts`).
- VoiceOver: "Listening", then a spoken elapsed minute (existing). The aura is hidden from VoiceOver.
- AX5: the circle is at least 44 pt (`tokens.target.min`) and stays above the live words; the words area scrolls.
- Dark: aura uses the `recording` colour; check the idle glow on dark paper (Gap: no photograph of it in the repo).
- Budget: the aura runs in `useFrameCallback` on the UI thread with `dt`, writing `transform` and `opacity`. It is the one loop allowed on the screen. **Recording is not affected**: the test is section 9, test T4.
- Test: `[NX-35-R3] the aura animates only transform and opacity from a shared value and no state is set per frame`; `apps/mobile/test/listen-aura-budget.test.ts` (proposed, a source-level check on `listening-aura.tsx`). Fails on old code: probably passes (UNVERIFIED: `listening-aura.tsx` was read to its header only). If it passes it is a guard, not a fix, and the row is marked "guard".

### M4 Stop and Review (NX-35-R4) refine, S2

- Purpose: stopping feels like a clean hand from a voice room to a reading room.
- Today: A6. Fade over `route.dissolveMs`, lamp fades out and returns.
- Refine: nothing to add to the move. The gap is the moment the words appear when transcription lags: today the words enter when ready (`words-state.logic.ts`). Specify that while the words are still being made, Review shows one still line "Getting your words ready" (existing or new copy, `content` to confirm) with the `Breathe` glow of the empty state and no spinner; when the words arrive they fade in whole at `swapMs`. No typewriter, no reflow of the person's text after it appears.
- Reduce Motion: the line is still; words appear at `fadeMs`.
- Haptic: none.
- VoiceOver: announce the existing title once when the words are ready (`review.tsx` line 1219); do not announce progress ticks.
- AX5, dark, budget: as shared rules.
- Test: `[NX-35-R4] Review shows a still waiting line, never a spinner, until the words are ready`; `apps/mobile/test/review-waiting.test.ts` (proposed). Fails on old code: UNVERIFIED; `review.tsx` was read for motion lines only, so whether a spinner shows today is not known. `mobile` to read first.

### M5 Keep, the moment a letter joins the book (NX-35-R5) refine, S1; the bold variant waits for decision F-3

- Purpose: the person knows the letter is safe and where it went. This is the single most valuable moment in the product.
- Today: A7, about 900 ms to `onDone`, success haptic before any movement, a chip "Kept in Month N" at 250 ms, the card files down at 550 ms, the Book lands on the new card with a 1.6 s wash. The save never waits for the animation (MOTION principle 3).
- Option A (recommended default, no change): keep as is. The refinement is only to confirm it on a device (it is untested by a human in this lane) and to add the guard tests below.
- Option B (small, recommended for the first letter only): after the first kept letter ever, the Book's new card carries one extra line, drawn once (`DrawOn`, `drawMs` 1200 ms, `strokeDashoffset`, MOTION 5h and `react-native-svg`, already in the app), then the sentence "{child}'s first letter." in the app's small voice (`AppNote`), static. Never repeated, never a modal, no sound. This is MOTION 5h, which exists and A11 says is not built. Copy is `content`'s.
- Option C (rejected unless the founder insists): anything larger (full-screen takeover, particles, a bigger sequence). It breaks principles 3 and 8.
- Duration and easing: as `fileIntoMonthPlan()`; Option B adds 1200 ms drawn in the Book while the person reads, not blocking.
- Reduce Motion: chip and line at `fadeMs`, nothing travels, then `onDone`; the drawing is shown complete.
- Haptic: `success` once (existing). No extra haptic for the milestone.
- VoiceOver: one announcement of "Kept in Month N" (existing `momentAnnouncement`); the milestone line is read as normal text where it sits.
- AX5: excerpt lines drop to 2; chip and line wrap whole; the card never covers the line.
- Dark: the lit edge is `LIT_EDGE`; under Increase Contrast or Reduce Transparency a `line` border (existing).
- Budget: `transform` and `opacity` only; one sequence; the stroke draw uses `strokeDashoffset` (the only non-transform property, already used by `line-art.tsx`).
- Tests: `[NX-35-R5] the Keep animation never delays the commit` (guard; `saved-moment-playback.test.ts` covers part today, UNVERIFIED which assertions); `[NX-35-R5b] the first kept letter shows one drawn line and the sentence once, and a later letter shows neither` (Option B). Fails on old code: R5b, because no milestone note is rendered (A11).

### M6 Opening a letter from a Book card (NX-35-R6) refine (guard), S2

- Purpose: the card becomes the page; the words do not jump.
- Today: A8, the measured-rect transition with the words as the shared element. This is the best-specified transition in the app. The founder asked for "shared-element": it is already one by another route. The native `sharedTransitionTag` API is experimental and cannot cross tabs (MOTION 8); `Link.AppleZoom` is iOS 18+ alpha (MOTION 8). **Recommendation: keep the measured-rect version; do not switch.**
- What to specify: only the guards and the Reduce Motion form (200 ms hand-off).
- Haptic: none (MOTION 5f).
- VoiceOver: the letter is read once (the page is modal, the Book hides itself, `useHiddenBehindCardPage`); VoiceOver's escape closes it like Back (tested, `transitions.test.ts`).
- AX5: the column contract (same width, line height and gaps) decides whether the words stay still; at a larger Reading Size than the card the page cross-fades instead (MOTION 5f). Letter text is never truncated.
- Budget: the grow animates a surface's rect; the words are carried as transforms. UNVERIFIED on an SE 3: this is the heaviest transition; it must be one of the device rows in section 9.
- Test: `[NX-35-R6] a letter opens card to page with no native slide under either Reduce Motion setting`; exists today as the `transitions.test.ts` case "row 7: a letter opens card to page only" (guard; add the bracket).

### M7 First-letter moment in onboarding (NX-35-R7) refine, S1

- Purpose: the very first kept letter is the moment the product is understood.
- Today: the first Keep is A7. After `signInAfterLandingMs` the reminder ask or the Keep-your-book card appears (`review.tsx` lines 488 and 490). NX-31 orders those asks.
- Refine: this is M5 Option B plus an ordering rule: nothing animates over the settling card; the ask card enters only after the Book has landed and the wash has begun (`signInAfterLandingMs`, existing), using `enter` and no haptic.
- Reduce Motion, VoiceOver, AX5, dark: as M5. VoiceOver reads the kept line first, then the ask.
- Test: `[NX-35-R7] the reminder or sign-in ask enters only after the Book has landed on the new letter`; `apps/mobile/test/first-letter-order.test.ts` (proposed). Fails on old code: UNVERIFIED; the delay exists (`signInAfterLandingMs`) but whether it is measured from landing or from the tap is not read.

### M8 Sign-in to book open (NX-35-R8) new, S2 (after NX-31 builds the order)

- Purpose: finishing sign-in feels like arriving at your own book, not a sheet closing on a spinner (NX-31 section 2, rows 10 and 11).
- Trigger: the code is accepted, or Apple sign-in returns.
- What moves: while the code is checked, the verify screen shows a still line and a small `Breathe` mark instead of an `ActivityIndicator` (the empty-state breath, 8 s, existing). On success: the sheet dismisses natively; the screen behind (Tonight or Book) shows a one-line, still "Your book is kept" confirmation card (NX-31 row 11) entering with `enter`; the lamp does not arrive again (arrival is once per session).
- Reduce Motion: no breath; still line; card at `fadeMs`.
- Haptic: `success` once when the account is made (existing `account.tsx` line 151); none on a returning sign-in.
- VoiceOver: announce "Your book is kept" once; no progress announcements.
- AX5: the line wraps; the code field keeps its size.
- Test: `[NX-35-R8] code checking shows no spinner and the confirmation card enters once`; `apps/mobile/test/sign-in-arrival.test.ts` (proposed). Fails on old code: `(auth)/sign-in/verify.tsx` imports `ActivityIndicator` (line 17) and uses it (line 81).

### M9 The You tab and Settings (NX-35-R9) refine, S2

- Purpose: personal places feel calm, native and quick.
- Recommendation: native push, no custom transition (as 5.8 row 9). Add nothing but: the rows of a list that loads (for example the children list) do not stagger on a return; a toggle that finishes (app lock, reminder) plays `success` only when the state really changed (existing).
- Reduce Motion, VoiceOver, AX5: native. Rows keep 44 pt and wrap.
- Haptic: the existing map; `tap` only on a choice.
- Test: `[NX-35-R9] no Settings screen types a duration or an entering animation outside the motion hook`; part of the lint (section 9, T1). Fails on old code: probably passes for Settings; fails for the two literals in A22.

### M10 Photo add (NX-35-R10) new, waits for NX-33

- Purpose: a picture joining a letter feels like the same gentle filing, not a gallery popping in.
- Trigger: the person picks one image in the system picker (NX-33-R1); picker Cancel adds nothing and animates nothing.
- What moves: the thumbnail enters beside the words with `enter` (280 ms), the letter layout adjusts with `layout()` on `standard`; the words never move sideways while visible beyond a layout reflow the person expects. Remove: the photo fades over `exitMs` with the toast "Photo taken off. Undo" (NX-33 copy `photos.removedToast`); no shrink.
- Reduce Motion: appears at `fadeMs`; no layout spring.
- Haptic: `tap` when the photo is added; `warning` is not used for a removal with Undo (the destructive haptic is reserved for confirmed deletes).
- VoiceOver: announce "Photo added" once; the photo's label is the date and the letter's words, never generated (NX-33-R11).
- AX5: one column at accessibility sizes (NX-33-R13); the photo scales to width and the words stay whole below.
- Dark: the photo has a `line` border.
- Budget: image decode off the main thread; the thumbnail is a pre-sized file (NX-33 limits). No blur placeholders animating.
- Test: `[NX-35-R10] a photo added to a letter fades in once and the letter's words do not change`; `apps/mobile/test/photos-motion.test.ts` (proposed). Fails on old code: the feature does not exist (A14).

### M11 Save failed and offline (NX-35-R11) refine, S1

- Purpose: when something goes wrong the app stays still and tells the truth.
- Trigger: a save, sync or backup call fails, or the phone is offline.
- What moves: nothing travels, shakes or flashes. The banner or line enters with `fadeMs`, in `caution` (not `destructive`) colour plus an icon (colour never the only signal, A-NFR-005). The words and the recording are shown as kept on the phone, because they are (NX-07, `07-letters-on-every-phone.md`; claim to be confirmed per screen by `mobile`).
- Reduce Motion: appears at once.
- Haptic: `warning` only for a destructive action the person confirmed; none for a failure the person did not cause (a failure is not a verdict on them). This differs from `listen.tsx` line 430, which plays `warning`; UNVERIFIED which case that is.
- VoiceOver: announce once, in the same plain words, with the one action ("Try again").
- AX5: the line wraps; the action stays at least 44 pt.
- Test: `[NX-35-R11] a failed save announces once, plays no warning haptic, and the banner has an icon as well as colour`; `apps/mobile/test/save-failed-calm.test.ts` (proposed). Fails on old code: UNVERIFIED for the haptic (the `listen.tsx` line 430 case was not read in full).

### M12 Empty states (NX-35-R12) guard, S2

- Purpose: warm, never a count of gaps.
- Today: A15 (`EmptyState`). Keep. Add only the guard that no empty state renders a numeral about letters, days or gaps (the same scan as `NX-30-R4`).
- Reduce Motion: drawn complete, still. Off also in Low Power Mode if `expo-battery` is ever added (dependency; not proposed here).
- Haptic: none. VoiceOver: heading plus one action. AX5: the title wraps.
- Test: `[NX-35-R12] no empty state shows a number about letters, days or what is missing`; `apps/mobile/test/empty-state-no-counts.test.ts` (proposed). Fails on old code: probably passes; it is a guard.

### M13 Loading, sync and restore: "recordings coming back" (NX-35-R13) new, S2, waits for NX-34

- Purpose: when letters or recordings return to a new phone, the person sees calm, honest progress and can use the book at once (NX-34-R13: words first, recordings oldest first, one at a time).
- What shows: a line in the Book and in Settings, "Recordings are coming back to this phone" (copy proposed, `content` to write in the parent vocabulary, not "restore", "sync", "upload"). A determinate bar only when the work is determinate (bytes known); otherwise the `Breathe` glow of the empty state. Each recording's row on a letter changes from "On another phone" to a play control with a `fadeMs` cross-fade when its file arrives. No percentage counting down on Tonight, no "37 of 120" (that is a count of what is left; principle 2). A number may appear only on the Settings line that NX-34 specifies, never on Tonight or the Book.
- A skeleton for text is not used: the words arrive first from the sync path, so there is nothing to skeleton. A skeleton is allowed only for the picture area of a letter whose photo is still coming (NX-33), as a still `surfaceAlt` block with no shimmer sweep.
- Reduce Motion: no breath, no bar animation (the bar value jumps, with a `fadeMs` fade on the row).
- Haptic: none, while it runs or when it finishes (the person is probably not holding the phone).
- VoiceOver: the bar has `accessibilityRole="progressbar"` with a value in words ("some recordings are back", never a countdown); announce once at start and once at the end ("All recordings are back").
- AX5: the line wraps; the bar keeps 44 pt around it.
- Budget: the bar animates `transform: scaleX`, not `width` (a proposed change to the bars in `storage.tsx` and `export.tsx`, which are not read for how they animate: UNVERIFIED). Restore work runs off the UI thread; the UI shows state only.
- Proposed token: `motion.progressSettleMs` 400 (the time a progress bar takes to settle to a new value). Label: proposed.
- Test: `[NX-35-R13] while recordings return, no screen shows a remaining count and the bar never animates width`; `apps/mobile/test/restore-calm.test.ts` (proposed). Fails on old code: `settings/storage.tsx` and `export.tsx` use a `ProgressBar`/`progressbar` (A16); the restore surface does not exist yet.

### M14 Page turn in Read together (NX-35-R14) guard, S2

- Purpose: reading together feels like a book.
- Today: A9. Keep. Guard only: Reduce Motion is a 200 ms cross-fade, the leaving page takes no touches and is hidden from VoiceOver (tested in `transitions.test.ts` and page-turn tests, UNVERIFIED exact names).
- Test: `[NX-35-R14] the leaving page is hidden from screen readers and takes no touches` (add the bracket to the existing assertion if there is one; else new). Fails on old code: UNVERIFIED.

## 6. Sound (NX-35-R15)

None by default. `docs/design/SOUND.md` already decides: no UI sound unless the person opts in to "Paper sounds" in Settings, off by default, never in onboarding, never at night without the person's choice, never a reward. It is specified and not built (A20). **This requirement builds none.** If the founder wants it, it is a separate option with its own slice (section 13, F-1): six short sounds, `ambient` audio session (so the silent switch silences it and it mixes with other audio), never during a take, never as a reward. Recommended answer: no, not in the first public build; revisit after the first real parents have used the book (SOUND 2 reasons: a baby asleep nearby, Android has no silent switch, the voice is the product).

## 7. Principles as checks (the table the build rows come from)

| Id | Given | When | Then | Fails on old code because | Tag |
|---|---|---|---|---|---|
| NX-35-R16 | the source of `apps/mobile/src/app` and `apps/mobile/src/components` (not `logic.ts` or tests) | a scan runs for numeric literals inside `.duration(`, `withTiming(` `duration:` and `withDelay(` | 0 matches outside `packages/design-tokens` and `lib/motion.ts` | `letter/[id].tsx` line 223 types 150 and `components/motion/press.ts` line 46 types 90 | `[NX-35-R16]` |
| NX-35-R17 | any moment in section 5 | Reduce Motion is on | 0 transform animations (translate, scale, rotate) run; opacity changes use `fadeMs`; the outcome still shows | not testable as one test today; per-moment tests in section 5; the audit shows `useMotion` handles the main ones | `[NX-35-R17]` |
| NX-35-R18 | the visible text and accessibility labels of Tonight, Book, Listen, Review and Settings home in 5 states each | scanned | 0 numerals about letters kept, days since, gaps or time left, and no new badge, ring or dot (same method as `NX-30-R4`) | passes today; exists to stop the new moments breaking it | `[NX-35-R18]` |
| NX-35-R19 | `apps/mobile/package.json` | the motion work is built | 0 new dependencies; any needed one is named in the PR title and goes to the dependency review | n/a (a guard) | `[NX-35-R19]` |

## 8. Door lines

No moment here asks a person to agree to, allow or give anything. No Shown, Records, Never and Decline block applies. The only data touched: none new. Motion state is never stored; no moment records that it played. Analytics are off in every 1.0 profile (D-124 item 3); this requirement adds no event. If the founder chooses an in-app haptics switch or "Paper sounds", each is a device-local preference with no data leaving the phone and no registered string.

Copy (parent vocabulary only; `content` writes, nothing is final here): the milestone line for the first letter (M5 B), the waiting line in Review (M4, may reuse an existing key: UNVERIFIED), and the recordings-returning line (M13, may reuse an NX-34 key; NX-34 wrote its states, not read for exact keys).

## 9. The quality ratchet: how quality keeps improving

What exists in the repo today (searched on `origin/develop` at `bf5591be`): unit tests for the route table, tokens and several moments (A23); Maestro flows on the iOS simulator with tags (`apps/mobile/e2e/README.md`), including an `a11y-sizes.sh` helper; a Playwright web journey suite with screenshots (`apps/mobile/e2e-web/`, `npm run e2e:web:journey`, `JOURNEY_SHOTS=1`); a before and after picture set committed by hand (`docs/design/calm-brand/`). No automated visual diff, no motion lint, no frame test was found.

| # | What | How | Exists or proposed |
|---|---|---|---|
| T1 | **Motion lint**: no literal durations or easings in screens and components | A node test that scans source for the patterns in NX-35-R16; allow-list is `packages/design-tokens` and `apps/mobile/src/lib/motion.ts` and `lib/transitions.logic.ts`. Runs in `npm test` | Proposed. Fails on old code on two lines (A22), so the PR that adds it also moves those two values to tokens (same numbers, no visible change; Reduce Motion paths only) |
| T2 | **Token tests**: every spring has damping ratio at least 0.9, the 2 s ceiling, the stagger fits under 900 ms | `packages/design-tokens/test/tokens.test.ts` | Exists. Extend with any proposed token (section 11) |
| T3 | **Reduce Motion matrix**: for each moment in section 5, a unit test that calls its plan function with `reduced=true` and asserts no transform step and the final state | Pure functions in `lib/transitions.logic.ts` and `*.logic.ts` files (the repo's pattern: logic in `.logic.ts`, tested without React Native) | Partly exists; extend per moment |
| T4 | **Perf budget, recording is untouched**: on an iPhone SE 3rd generation, record a take of a length the plan fixes (placeholder: 10 minutes) with the aura on, in dark and light, and compare (a) the saved file's duration to wall time and (b) that the file has no gap or dropout (listen back; the existing recording-reliability rows RT-xx in `docs/qa` are the place) and (c) a frame trace shows no frame over 16.7 ms attributable to the app during the take | Instruments (Animation Hitches and Time Profiler) on the device, results attached as evidence per `docs/qa/evidence/TEMPLATE.md` | Proposed, a device row. No tolerance is claimed here. `qa` sets the pass line before the run; this document states no number because none has been measured |
| T5 | **Frame budget for the heavy moments** (card to page, page turn, keep): the same trace on an SE 3 for M5, M6, M14 | Instruments; evidence files | Proposed device rows |
| T6 | **Visual regression**: the Playwright web journey already writes screenshots per journey step. Propose a baseline set of 6 states in light and dark (Tonight with a kept letter, Listen ready, Review, Keep chip frame, Book, letter page) compared on pull requests with a pixel tolerance `qa` sets. The web build does not animate native pushes (MOTION 9b) so it checks layout and colour, not motion | Playwright `toHaveScreenshot` (a Playwright feature, not verified in this repo's config today) | Proposed; needs a baseline commit |
| T7 | **Polish checklist, screen by screen** (the list below), run by `design-systems` at each release freeze and recorded as a dated row in `docs/design/` | Manual, 15 minutes per screen on a device | Proposed |
| T8 | **Quarterly design review**: `design-systems` with `mobile`, `content`, `qa`, the founder: walk the app on one phone with Reduce Motion off, then on, then at AX5, then in dark; list moments that feel flat or busy; decide, record | Calendar; output a dated section appended to `docs/design/EXPERIENCE_PASS_2026-10.md`'s successor (new file, not this one) | Proposed |
| T9 | **A parent look** (HYPOTHESIS check): five parents use Build 12 for a week; one question, "which moment felt best and which felt like nothing?" | `user-research`; no analytics | Proposed; the only evidence that can say whether motion made it feel more engaging |

Polish checklist (T7), per screen: (1) every control tappable from frame 1; (2) one thing moves at a time; (3) the outcome is announced once; (4) Reduce Motion form exists and was seen; (5) AX5 shows letter text whole; (6) dark paper checked; (7) no literal duration (T1 passes); (8) no count of gaps; (9) no haptic on a navigation; (10) an SE 3 trace for any transition longer than 280 ms.

Device rows (placeholders; NX-35 numbers them at merge): a scan on 9 Nov of the open pull request patches (101 open PRs listed by the REST API) found S1-110, -112, -131, -132, -134, -135 and -140 used inside open PR patches, and the branches in this roadmap use S1-150 to S1-152, S1-160 to S1-162 and S1-170 to S1-175 (NX-30 claims S1-170 to S1-175 and NX-33 claims S1-175 to S1-178 on its branch, so S1-175 is already claimed twice; flagged for `qa`). This file proposes **S1-180 to S1-189**, re-scan at merge:

| Row | What | Moment |
|---|---|---|
| S1-180 | Record 10 minutes on an SE 3 with the aura on, Reduce Motion off, then listen back (T4) | M3 |
| S1-181 | Keep, a first letter and a tenth letter, light and dark, Reduce Motion on and off, VoiceOver on | M5, M7 |
| S1-182 | Open a letter from a Book card at default and AX5 text, with a frame trace on an SE 3 | M6 |
| S1-183 | Cold launch to Tonight with a kept letter; return from Listen; tab switch to Book and You | M1, M2 |
| S1-184 | Page turn in Read together with a swipe, and with VoiceOver | M14 |
| S1-185 | Offline then save-failed, then back online | M11 |
| S1-186 | Sign in with a code and with Apple on a first account | M8 |
| S1-187 | Recordings returning to a second phone (waits for NX-34) | M13 |
| S1-188 | Photo add, Cancel, remove with Undo (waits for NX-33) | M10 |
| S1-189 | All of the above with Reduce Motion on, Increase Contrast on, Reduce Transparency on | all |

## 10. Delivery slices and the smallest honest cut

Sizes are estimates, nothing was measured. S is about a day, M a few days, L more than a week of agent-assisted work.

| Slice | What | Size | Notes |
|---|---|---|---|
| S0 | Tokens and the hook. The motion hook and Reduce Motion handling already exist (`lib/motion.ts`), so S0 is smaller than the brief assumed: move the two literals (A22) into `tokens.motion` as named values; add proposed tokens (section 11) with their `tokens.test.ts` cases; add T1 (motion lint) and the moment-by-moment Reduce Motion unit tests (T3); write the polish checklist (T7). **No screen changes behaviour** | S | Pure tests and two token moves. Runtime change: none visible (same values) |
| S1 | High-value moments: M5 Keep (guards, and Option B first-letter line if the founder agrees), M3 record (guards, optional elapsed line), M1 tab (session "seen" rule), M2 Tonight arrival (with NX-30 L1), M11 save failed calm, M7 first-letter ordering | M | Touches `review.tsx`, `listen.tsx`, `(tabs)/index.tsx`, `(tabs)/_layout.tsx`. Touches the recording and save paths the Build 12 device run exercises |
| S2 | The rest: M4 Review waiting, M6/M12/M14 guards, M8 sign-in arrival, M9 Settings, M10 photo add, M13 recordings returning, T6 visual baseline, T8 quarterly review | L | M8, M10, M13 wait on NX-31, NX-33 and NX-34 being built |

**Be honest about Build 12.** It is the first public submission. A ~14 hour device run exercises exactly the screens S1 would change (record, Review, Keep, Tonight, tabs). A motion change is not a safe small change: it can alter timing on the save and record paths, interact with VoiceOver focus order and Reduce Motion, and invalidate device evidence already gathered. Nothing in this file has been tried on a device.

**Smallest honest cut (recommendation):**

1. **Build 12: no motion behaviour change.** Nothing from S1 or S2 ships in it. The only items that may ride, and only if `qa` agrees they do not invalidate the device run, are the test-only parts of S0: the motion lint (T1) and the token tests. Moving the two literals (A22) is a code change to the letter page and the press hook; it is value-neutral (same numbers) but still touches a shipped file, so the safe call is to land it after Build 12 unless `mobile` wants it in and `qa` re-runs the two affected rows.
2. **First update after Build 12 (1.0.1 or the next build): S0 in full, then S1.** The founder gets the Keep guard and first-letter line, the Tonight arrival with NX-30 L1, and calm save-failed. This is where "more material" first shows.
3. **S2 later**, in step with NX-31, NX-33 and NX-34.

If the founder wants something visible in Build 12 anyway, the least risky candidate is the NX-30 L1 "From the book" row alone (a new row that enters with the existing Tonight stagger and touches no capture or save code). That is NX-30's decision, not this file's, and it still needs a device pass. I do not recommend adding any other motion to the first public build.

## 11. Proposed tokens (all labelled proposed; none exists yet)

| Token | Value | Why | Test |
|---|---|---|---|
| `motion.progressSettleMs` | 400 (proposed) | A progress bar settling to a new value (M13) | `tokens.test.ts`: less than `sequenceMaxMs` |
| `motion.pressReducedMs` | 90 (moves the literal in `press.ts` line 46) | A22 | same file: at most `fadeMs` |
| `motion.swapMs` reuse | 150 (exists) | Replaces the literal 150 in `letter/[id].tsx` line 223 | exists |

No others are proposed. All other values in section 5 come from existing tokens.

## 12. Owner lanes and open PRs that touch the same files

| Lane | Does |
|---|---|
| `design-systems` | This file; tokens (`packages/design-tokens/src/tokens.ts`); `docs/design/MOTION.md` and `COMPONENTS.md` updates; T1, T3, T7, T8; the polish checklist |
| `mobile` | All screen changes in S1 and S2; the `lib/motion.ts` and `lib/transitions.logic.ts` edits; reads the files marked UNVERIFIED |
| `content` | The few lines in section 8 |
| `qa` | T4, T5, T6, the device rows and their pass lines; confirms the Build 12 cut |
| `user-research` | T9 |
| `a11y` or `qa` | VoiceOver, AX5 and Reduce Motion rows (the roster has no separate accessibility handle in this file; UNVERIFIED which handle holds it) |

Open pull requests that touch the same paths (REST API `pulls/<n>/files`, scanned 9 Nov across 101 open PRs; filter `apps/mobile/src/app`, `apps/mobile/src/components`, `packages/design-tokens`):

| PR | Files in scope | Conflicts with |
|---|---|---|
| #670 | `app/listen.tsx`, `app/review.tsx`, `components/capture/take-settle.logic.ts`, `words-state.logic.ts` | M3, M4, M5, M7, M11 (S1) directly: the same two screens |
| #615 | `app/listen.tsx`, `components/capture/listen.logic.ts` | M3, M11 |
| #618 | `app/listen.tsx`, `components/capture/listen.logic.ts` | M3, M11 |
| #617 | `app/_layout.tsx`, `components/resilience/global-fault-screen.tsx` | M11 (fault screen); root layout reads the route table |
| #665 | `app/(tabs)/_layout.tsx`, `app/settings/children/[id].tsx` | M1 (tab layout); NX-30a also says #665 merges first |
| #635 | `components/gate/age-gate-screen.tsx`, `components/ui/agreement-row.tsx` | M7 only if first run is touched; low |
| #521 | `components/gate/age-gate-screen.tsx` | low |
| #689 | `app/onboarding.tsx`, `app/settings/language.tsx`, `components/language/*`, `components/onboarding/language-row.logic.ts` | M7 (onboarding) |
| None found | `packages/design-tokens` | No open PR touches the tokens package |

The scan reads file lists, not patches, so it shows the same file, not the same lines. `mobile` re-runs it at merge time.

## 13. Founder decisions, with recommendations

| # | Question | Recommendation |
|---|---|---|
| F-1 | Sound: should the app ever make UI sounds? | No for the first public build. The "Paper sounds" opt-in stays specified (SOUND.md) and unbuilt. Revisit after real parents have used the app |
| F-2 | Haptics: keep the current five-intent policy (outcomes only, light, system switch honoured), and add an in-app "Haptics" switch? | Keep the policy. Do not add an in-app switch in the first public build; the system switch is the right place (UNVERIFIED that the system switch is honoured by `expo-haptics` on the OS version in use; one device row to confirm) |
| F-3 | How bold is the Keep moment? A = as built; B = A plus one drawn line and one sentence on the first letter only; C = bigger | B. Quiet, once, and it is the moment the product is understood. Not C, ever: C breaks the calm and sets up an expectation of escalating rewards |
| F-4 | A device walkthrough: two minutes with the founder naming the three moments that felt flat, before S1 is scoped | Yes. This file's audit says the big moments are built; only the founder's eyes can say which ones did not land |
| F-5 | Build 12 gets no motion change (section 10) | Yes |

## 14. Engineering block

| | |
|---|---|
| API contract | None. No server call |
| Budget | 60 fps, no frame over 16.7 ms on iPhone SE 3rd generation (proposed target, from MOTION 7 rule 6; unmeasured). A moment is at most `sequenceMaxMs` (900 ms), the Keep hand-off at most about 1.1 s, and nothing over `hardCeilingMs` 2000 ms |
| Accessibility | WCAG 2.2 AA; Reduce Motion form for every moment; VoiceOver announcement once; AX5 letter text whole (D-027); targets at least 44 pt; colour never the only signal (A-NFR-005 to A-NFR-007, B-NFR-006, LEGAL-REQ-051) |
| Switch and rollback | S0 is test and token only. S1 and S2 changes are each reverted by reverting their PR; none changes stored data. No remote switch (a kill switch for animation is not proposed: the Reduce Motion form already exists as the fallback) |
| Data class | None. No motion state is stored or sent |
| Schema and grants | None |
| Analytics catalog | No event added. Nothing "in catalog"; analytics are off in every 1.0 profile (D-124 item 3) |
| Dependencies | None to add. Reanimated 4.5.1, worklets 0.10.1, gesture-handler 2.32, expo-haptics 57, `react-native-svg` (already used by `line-art.tsx`). Low Power Mode detection would need `expo-battery`: not proposed |

## 15. Trace and tests

| Id | Refines | Layer | Path | Exact title | Device row |
|---|---|---|---|---|---|
| NX-35-R1 | MOTION 5i, 5.8 row 6 | unit | `apps/mobile/test/motion-tab-switch.test.ts` (proposed) | `[NX-35-R1] a tab switch plays no transform and no haptic, and a returning tab does not re-enter its content` | S1-183 |
| NX-35-R2 | NX-30-R2; F14-REQ-041 | unit | `apps/mobile/test/tonight-from-the-book-motion.test.ts` (proposed) | `[NX-35-R2] the From the book row enters once on a cold launch and not on a return` | S1-183 |
| NX-35-R3 | MOTION 5b, 7 | unit | `apps/mobile/test/listen-aura-budget.test.ts` (proposed) | `[NX-35-R3] the aura animates only transform and opacity from a shared value and no state is set per frame` | S1-180 |
| NX-35-R4 | MOTION 5c, 5.8 row 4 | unit | `apps/mobile/test/review-waiting.test.ts` (proposed) | `[NX-35-R4] Review shows a still waiting line, never a spinner, until the words are ready` | S1-181 |
| NX-35-R5 | MOTION 5e, 5h | unit | `apps/mobile/test/saved-moment-playback.test.ts` (extend) | `[NX-35-R5] the Keep animation never delays the commit` | S1-181 |
| NX-35-R5b | MOTION 5h | unit | `apps/mobile/test/first-letter-note.test.ts` (proposed) | `[NX-35-R5b] the first kept letter shows one drawn line and the sentence once, and a later letter shows neither` | S1-181 |
| NX-35-R6 | MOTION 5f | unit | `apps/mobile/test/transitions.test.ts` (add bracket) | `[NX-35-R6] a letter opens card to page with no native slide under either Reduce Motion setting` | S1-182 |
| NX-35-R7 | NX-31 section 2 | unit | `apps/mobile/test/first-letter-order.test.ts` (proposed) | `[NX-35-R7] the reminder or sign-in ask enters only after the Book has landed on the new letter` | S1-181 |
| NX-35-R8 | NX-31 rows 10, 11 | unit | `apps/mobile/test/sign-in-arrival.test.ts` (proposed) | `[NX-35-R8] code checking shows no spinner and the confirmation card enters once` | S1-186 |
| NX-35-R9 | 5.8 row 9 | unit | the lint (T1) | `[NX-35-R9] no Settings screen types a duration or an entering animation outside the motion hook` | none |
| NX-35-R10 | NX-33-R1 | unit | `apps/mobile/test/photos-motion.test.ts` (proposed) | `[NX-35-R10] a photo added to a letter fades in once and the letter's words do not change` | S1-188 |
| NX-35-R11 | MOTION principle 3; NX-07 | unit | `apps/mobile/test/save-failed-calm.test.ts` (proposed) | `[NX-35-R11] a failed save announces once, plays no warning haptic, and the banner has an icon as well as colour` | S1-185 |
| NX-35-R12 | COMPONENTS 2.15 | unit | `apps/mobile/test/empty-state-no-counts.test.ts` (proposed) | `[NX-35-R12] no empty state shows a number about letters, days or what is missing` | none |
| NX-35-R13 | NX-34-R13 | unit | `apps/mobile/test/restore-calm.test.ts` (proposed) | `[NX-35-R13] while recordings return, no screen shows a remaining count and the bar never animates width` | S1-187 |
| NX-35-R14 | MOTION 5m | unit | `apps/mobile/test/page-turn.test.ts` (add bracket if it exists, else new) | `[NX-35-R14] the leaving page is hidden from screen readers and takes no touches` | S1-184 |
| NX-35-R15 | SOUND 2 | none | none | none (a decision: sound is not built) | none |
| NX-35-R16 | tokens rule | unit | `apps/mobile/test/motion-lint.test.ts` (proposed) | `[NX-35-R16] no screen or component types a literal duration outside the motion tokens` | none |
| NX-35-R17 | MOTION 4 | unit | per moment, section 5 | `[NX-35-R17] with Reduce Motion on, no moment runs a transform animation` | S1-189 |
| NX-35-R18 | NX-30-R4 | unit | `apps/mobile/test/no-gap-counts.test.ts` (proposed) | `[NX-35-R18] five screens in five states show no count of letters, days or gaps and no new badge` | none |
| NX-35-R19 | guard | unit | `apps/mobile/test/no-new-deps.test.ts` (proposed, optional) | `[NX-35-R19] the motion work adds no dependency` | none |

Trace: NX-35-R1..R19 -> F09 (book), F04 (capture), F03 (first run), F13 (reminders ask order), F14-REQ-040 and -041 (via NX-30), F16 (via NX-34), and the design docs `MOTION.md`, `COMPONENTS.md`, `SOUND.md`, `docs/tdd/09-accessibility-design-system.md`. No F##-REQ id is changed here.

## 16. Not verified

- Everything about how a moment looks or feels on a phone: no build was run, no screenshot taken, no frame measured, no haptic felt. All of section 3 is derived from reading source and `MOTION.md`.
- What the founder meant by "more material, exhaustive and engaging": there is no verbatim, no screenshot and no screen name. Section 3's reasons are hypotheses.
- Whether `expo-haptics` follows the iOS System Haptics switch on the OS in use.
- Whether a spinner shows in Review while words are made (M4), whether the `listen.tsx` line 430 `warning` haptic is a user-caused case (M11), whether `signInAfterLandingMs` counts from landing (M7), and how the `ProgressBar` in `settings/storage.tsx` animates (M13). `review.tsx`, `listen.tsx` and `storage.tsx` were read for motion and haptic lines, not end to end.
- Exact names of the existing page-turn and saved-moment test cases (M5, M14).
- Whether the milestone note (A11) truly is absent: searched `DrawOn`, `milestone` and `AppNote` usage under `app` and `components` only.
- Whether Playwright `toHaveScreenshot` is usable in this repo's config (T6).
- NX-33 and NX-34 were read from their branches (not merged), at header and table level; their exact copy keys and S1 ids may change.
- The open-PR scan lists files, not lines. It covered 101 PRs on 9 Nov and will be stale.
- Every performance figure: none given. The only numbers here are tokens already in `tokens.ts` and the proposed 60 fps and 16.7 ms target taken from `MOTION.md` rule 6.
- Which roster handle owns accessibility device rows.
