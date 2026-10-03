# TDD 09: Accessibility and design system

Owner: accessibility and design-systems engineering lead. Version 0.1, 3 Oct 2026. Status: draft for review by the founder, product design (owns token values) and the QE lead (TDD 07).
Scope: the iOS app (`apps/mobile`, Expo SDK 57, RN 0.86.3), `packages/design-tokens`, the parts of `packages/content` that affect accessibility and localisation, and the rules the later Android build and `apps/web` must inherit. The web contribution page is covered only where a token or component rule is shared.

Inputs read: `CLAUDE.md`; `docs/prd/PRD.md` 1.2 (sections 2, 3, 5, 6, 7.1, 7.6); `docs/design/DESIGN_LANGUAGE.md`, `COMPONENT_LIBRARY.md`, `COMPONENTS.md`, `MOTION.md`, `SOUND.md`, `CREATIVE.md`, `PHOTOGRAPHY.md`, `BENCHMARK.md`; `docs/adr/0101-ui-component-library.md`; `packages/design-tokens` (source, generated CSS, test); `packages/content` (`strings.en.ts`, `VOICE.md`, `BRAND.md`); every file in `apps/mobile/src/app` and `apps/mobile/src/components`, plus `lib/motion.ts`, `lib/haptics.ts`, `lib/dates.ts`, `lib/copy.ts`; `packages/core/src/age.ts`; `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ-008, -051, -052); `docs/BACKLOG.md`; `docs/tdd/07-quality-test-strategy.md` (test tools and gate ladder, which this document reuses rather than redefines); 36 screenshots in the session scratchpad `screens-v2/` (named below as `S:<file>`).

Labels: **F** fact (checked in code, docs or a screenshot), **A** assumption, **R** recommendation, **K** risk, **Q** open question. Severity in section 9: **S1** blocks the accessibility launch gate (LEGAL-REQ-051 is P0), **S2** must fix before external TestFlight (G3 in TDD 07), **S3** fix before App Store submission (G4), **S4** polish.

**Evidence limits (F).** The screenshots are web-preview renders (react-native-web): Georgia and system sans instead of Literata and Mukta, a browser focus outline, and no native date picker (`S:07-onboarding-twins` shows the Birthday label with no control). No screen reader, Dynamic Type or Reduce Motion run on a device was available for this review. Every VoiceOver statement below is from code reading and is marked "verify on device" where behaviour depends on the platform.

---

## 0. Summary

1. **F** Tokens are sound for text contrast (every text pair passes 4.5:1 in both themes, and a test enforces it), but the design system stops at colour and radius. The type scale, motion additions, target sizes, Increase Contrast variants and a destructive role are not tokens, so screens hardcode Tailwind defaults (`text-xs` 12 pt, `text-sm`, `h-11`) and literal numbers.
2. **F** The single biggest accessibility gap is text scaling. Letter text, transcripts and the Write field are capped at `maxFontSizeMultiplier={2}`; chrome labels at 1.3 to 1.5. AX5 body is about 3.1x default (53/17 pt, H1). PRD 7.6 and A-NFR-005 require AX5 on every screen; DESIGN_LANGUAGE 3 says letter text is never capped. This fails the gate today (TDD 07 section 5 reached the same finding).
3. **F** Non-text contrast fails in light mode on several controls: input and choice-pill borders at `textMuted`/60% (2.54:1), outline-button and Add-child input borders on `line` (1.33:1), the switch off-track (`line`), and the edit underline at `accent`/60% (2.57:1). WCAG 1.4.11 needs 3:1.
4. **F** iOS screen-reader feedback is mostly missing outside Listening: `accessibilityLiveRegion` is Android-only, so errors, "Added to Asha's book", "Saved on this phone" and the 18+ stop screen are silent on VoiceOver. Radio groups set `selected` instead of `checked`. Sheets do not move focus to their titles.
5. **F** The delete-letter undo disappears after 10 s unless VoiceOver is detected (WCAG 2.2.1; DESIGN_LANGUAGE 11.5 says toasts persist).
6. **R** Fix the system before the screens: add the missing tokens (section 3), standardise 9 components (section 4), add three helpers (`announce`, `useFocusOnMount`, `useMotion` extended), then re-skin screens. About 9 to 12 engineer-days, mostly S and M tasks (section 10), sequenced after BL-030.
7. **R** Release gates reuse TDD 07: lint, contrast and AX5 component tests at G0; XCUITest `performAccessibilityAudit()` at RC; the VoiceOver script (E2E-15) on iPhone SE 3 at G3 and G4. Nothing here adds a new tool beyond what TDD 07 already chose.
8. **Q** Three decisions are needed from design and the founder: the destructive colour (terracotta `recording` versus amber `caution`), whether letter text is uncapped (recommended) or capped with Large Print compensation, and the US date format.

---

## 1. Traceability

| ID | What it requires | Where this TDD answers it | Status today (F) |
|---|---|---|---|
| LEGAL-REQ-051 (P0) | WCAG 2.2 AA on every app screen, paywall, legal text; AX5; Reduce Motion; no time limits; CI with RN a11y lint and AX5 snapshots, zero critical; manual VoiceOver/TalkBack script per release | 2, 8, 9, 10 | Contrast test only; no lint, no AX5 tests, no script |
| LEGAL-REQ-052 (P1) | Accessibility statement and feedback route; Settings > Help links it | 10 (BL-089) | Not started; Settings has no Help and Legal section yet |
| LEGAL-REQ-008 (P0) | Each consent and legal document reachable from Settings | 9 (A11Y-F17) | Terms row is disabled (`S:51-settings-scrolled-dark`) |
| A-NFR-005 | WCAG 2.2 AA, AX5 (entry) | 2.3, 9 | Fails at caps |
| A-NFR-006 | Gesture alternatives, pausable auto-advance | 2.1, 2.5 | Stories not built (BL-041) |
| A-NFR-007 | Screen reader labels and focus | 2.1 | Partial |
| A-REQ-003, A-REQ-008 | Brand moment 900 ms max with Reduce Motion fade; stories honour Reduce Motion | 5 | `useMotion` exists; splash not built |
| A-REQ-005 | Skip and Sign in reachable at any text size | 2.3, 8 | Not built |
| A-REQ-007 | Stories: VoiceOver, one element, Next/Previous actions | 2.1, 8 | Not built |
| B-NFR-006 | AX5, screen readers, web WCAG 2.2 AA | 2, 9 | Partial |
| B-NFR-007 | Any script for names; locale dates | 7 | Names: yes (no script restriction). Dates: hardcoded English, day-month order |
| B-REQ-003 | Hindi and Devanagari render untranslated | 6.3, 7 | Mukta/Literata/Tiro not bundled (`global.css` sets Georgia) |
| B-REQ-012 | Appearance and Reading Size | 2.3, 3 | Built (`settings/appearance.tsx`, `reading-size-sheet.tsx`) |
| C-NFR-006 | AX5 for prices and terms | 2.3, 8 | Plus sheet not built; gate placeholder only |
| C-REQ-016 | Settings IA within 2 taps (Help and Legal, About) | 9 (A11Y-F17) | Beta card sits on Settings home |
| PRD 7.1 | Transitions start within 100 ms, complete within 350 ms, no frame over 16.7 ms | 5, 8 | Not measured |
| PRD 7.6 | 44 pt targets (56 primary), 4.5:1 and 3:1 both themes, focus to sheet titles, errors announced, Reduce Motion 200 ms fades, no time limits | 2, 3, 8 | Partial; see section 9 |
| PRD-REQ-019, K-07 | 18+ gate, stop screen stays 24 h | 9 (A11Y-F18) | Stop screen allows immediate retry (cross-team flag) |
| K-13 | Beta label only in Settings > Help and Legal > About | 9 (A11Y-F17) | Shown on Settings home |
| K-24, A-NFR-014, B-REQ-025 | en-US UI at launch; Hindi UI P2; Hindi speech P0 | 7 | Matches; readiness gaps listed |
| DESIGN_LANGUAGE 11, COMPONENTS 0.1, MOTION 4 and 7, SOUND 3 | House rules for accessibility, motion, haptics and sound | 2 to 6 | Mostly followed in new components; older screens drift |

**Conflicts found (flagged, not resolved here):**

| # | Conflict | Sources | Recommendation |
|---|---|---|---|
| C1 | Letter text cap: "never capped" versus `maxFontSizeMultiplier` 2.0 | DESIGN_LANGUAGE 3 ("body and letter text never are"); `tokens.type.letterBody.maxScale = null`; COMPONENTS 2.3 and 0.1 ("reading text 2.0"); code caps at 2 | **R** Uncap letter, body and callout text (follow DESIGN_LANGUAGE and tokens, which are the value owner's sources). COMPONENTS 2.3 is updated by its owner. |
| C2 | Destructive colour: COMPONENTS 2.1 says destructive is `caution` text; `build-css.ts` maps shadcn `destructive` to `recording`; DESIGN_LANGUAGE 2 says `recording` "means listening, never error"; `letter/[id].tsx` comments "never caution amber" | DESIGN_LANGUAGE 2, COMPONENTS 2.1, `build-css.ts`, `letter/[id].tsx` | **Q** for product design. **R** add a `destructive` token distinct from `recording` (section 3.2). |
| C3 | Toggle: ADR 0101 and COMPONENT_LIBRARY 5 say Expo UI SwiftUI `Toggle` behind `platform/toggle`; code uses RN `Switch` directly with `trackColor.false = line` | ADR 0101, `settings-ui.tsx`, `add-child-form.tsx` | **R** follow the ADR (section 4). |
| C4 | Tabs: ADR 0101 and MOTION 5i say NativeTabs; code uses `expo-router/js-tabs` with a fixed 58 pt bar | ADR 0101, `(tabs)/_layout.tsx` | **R** NativeTabs (gets Dynamic Type, Large Content Viewer and Liquid Glass for free); **Q** confirm the JS-tabs choice was not deliberate. |
| C5 | Sheets: ADR 0101 says Expo Router `formSheet`; code uses RN `Modal` with `animationType="slide"` for Reading Size and Whose book | ADR 0101, `reading-size-sheet.tsx`, `child-switcher.tsx` | **R** formSheet (native focus, detents, Reduce Motion). |
| C6 | 18+ stop screen retry: PRD-REQ-019 requires the stop screen for 24 h; `onboarding.tsx` "I answered by mistake" returns to the question at once | PRD-REQ-019, LEGAL-REQ-002, `S:03-age-stop-18plus` | Not an accessibility issue; flagged for BL-037 owner. LEGAL-REQ wins. |
| C7 | Beta label on Settings home | K-13, in-app-disclosures 1 and 4, `settings/index.tsx`, `S:50-settings` | Move to About (owner of C-REQ-016). |
| C8 | Terms row disabled in Settings | LEGAL-REQ-008, `settings/index.tsx` | Expected before sign-in work; must be enabled before G3. |
| C9 | "tidy" in shipped copy ("We tidy what the microphone got wrong", "Spoken, lightly tidied") | K-26 (VOICE: "fix", not "tidy"), `S:05-onboarding-promise`, `S:40-letter` | Content owner; not accessibility. Noted because it appears on audited screens. |

---

## 2. Audit: WCAG 2.2 AA and Apple HIG accessibility

Screens audited: entry and first run (`onboarding.tsx`, 01 to 09), Tonight (`(tabs)/index.tsx`, 20), Listening (`listen.tsx`), Review (`review.tsx`, 21, 22), Write (`write.tsx`, 25), Book (`(tabs)/book.tsx`, 30, 31), Letter (`letter/[id].tsx`, 40 to 42), Settings and sub-pages (50 to 52, `settings/*`), Family (60), Read together (70, 71), Plus gate (11, 52, 71), child switcher. The capture loop (Tonight, Listening, Review, Book, Letter) is the P0 path and is weighted highest.

### 2.1 VoiceOver labels, roles and reading order

**Done well (F):** Speak and Type are buttons with labels. `LetterCard` is one element with a composed label (signature, spoken dateline, full excerpt, private, recording) and a hint, so truncation to two lines is visual only. Book section headers are `header` elements with the count and authors in the label. `ListeningAura` is hidden from accessibility and the state is spoken ("Listening", "Paused"); elapsed time is announced once a minute, not every second. Review lists every machine edit as a row because nested `Text` spans are not reliably focusable (COMPONENTS 2.19). `MemberRow`, settings `Row` and `ToggleRow` read label and value as one element. Backdrops of the two RN modals have a "Close" label.

**Gaps:**

| Where | Finding | Criterion |
|---|---|---|
| Onboarding Yes/No and Birthday/Not here yet, `Choices` (theme, reading size), Reading Size sheet, Whose book | `accessibilityRole="radio"` with `accessibilityState={{ selected }}`. Radios announce `checked`, not `selected`; VoiceOver may read "radio button" with no state (verify on device) | 4.1.2 |
| `AddChildForm` save button | `accessibilityLabel="Add a child"` while the visible text reads "Start Dev's book" | 2.5.3 Label in Name (Voice Control "tap Start Dev's book" fails) |
| Letter "Hear Mama" button | label "Hear it in Mama's voice", visible "Hear Mama": the visible string is not contained in the name | 2.5.3 |
| Review dateline child picker | `Pressable` role button whose name is "ASHA · 7 MONTHS"; no hint that it changes whose letter this is | 4.1.2, 2.4.6 |
| Read together counter | "1 / 5" text node reads as "1 slash 5" | 1.3.1 (meaning) |
| All-caps eyebrows and datelines | built with `.toUpperCase()` on the string, so VoiceOver receives "FOR ASHA", "THIS MONTH"; short capitalised words can be spelled letter by letter (verify) and the transform breaks for Turkish and has no meaning in Devanagari | 1.3.1, localisation |
| Settings section titles | `role="heading"` on 12 pt caps text: fine as headings, but the rotor shows "ACCOUNT", "CHILDREN" in caps | polish |
| Letter delete | no confirmation; the deleted state's heading is the toast text; Undo is announced (good) | see 2.9 |
| Disabled buttons that explain themselves only through `accessibilityHint` (Plus "See what Plus adds", Invite family) | VoiceOver reads hints on dimmed elements, but users with hints off hear only "dimmed". The visible line below is a separate element, so the reason is reachable by swiping (acceptable) | 3.3.2 (ok) |

**Reading order (F, from layout):** every screen is a single column, so default order matches visual order, except: Write puts Close, "Saved on this phone", Save first (top bar) before the letter field, which is correct; Review puts Close and "Hear it" before the title, correct for iOS conventions. No custom `accessibilityElements` ordering is needed in v1 (**R**). Headings: each screen has one `role="heading"` title, so the rotor works.

### 2.2 Focus and announcements

| Where | Finding (F) | R |
|---|---|---|
| Onboarding step change | content swaps under the persistent Continue button; focus stays on Continue, the new heading is not announced | `useFocusOnMount(headingRef)` on each step |
| Reading Size, Whose book (RN `Modal`) | no initial focus on the title; Whose book sets `accessibilityViewIsModal`, Reading Size does not (RN `Modal` usually handles this on iOS, verify) | formSheet plus focus to title (PRD 7.6) |
| Errors (`add-child-form` "name required") | `accessibilityLiveRegion="polite"` only; iOS ignores it | `announce()` helper that calls `AccessibilityInfo.announceForAccessibility` on iOS and relies on live regions on Android |
| Review after save | "Added to Asha's book" uses a live region and the screen auto-dismisses after 900 ms; VoiceOver users get no confirmation | announce, and hold the dismiss until the announcement ends (`announceForAccessibilityWithOptions({ queue: true })`) when a screen reader is on |
| Write autosave | "Saved on this phone" live region (Android only on RN); COMPONENTS 2.8 asks for a polite announcement at most every 10 s | announce at most every 10 s, iOS too |
| 18+ stop screen | live region only | announce the stop title |
| Listening | announces start, pause, resume and each minute | keep |

### 2.3 Dynamic Type to AX5

**F** `Text` never sets `allowFontScaling={false}` (good). Caps found: letter body, transcript, Write and Review text inputs, signature and reading-size preview at 2.0; datelines 2.4; Book title, eyebrow, switcher, settings section titles, card meta and chips at 1.5; "Aa" and avatar initials at 1.3. TDD 07 counted 24 caps in `apps/mobile/src`.

| Text role | Today | Required (R) | Why |
|---|---|---|---|
| Letter body, transcript, Write and Review fields, signature | capped 2.0 | **uncapped** | DESIGN_LANGUAGE 3 and principle 6; AX5 body is 3.1x; grandparents are first-class readers. Reading Size multiplies on top; at AX5 plus Large Print a 20 pt letter reaches about 90 pt, which wraps at 3 to 4 words a line on an SE. **K** Acceptable for reading; do not cap, add horizontal-scroll-free wrapping (already true). |
| UI body, callout, buttons, rows | uncapped (Tailwind classes, no cap) | uncapped; buttons grow taller | HIG; COMPONENTS 2.1 |
| Titles (display, title1, title2) | 1.5 on some, none on others | caps from tokens (1.6 / 1.8 / 2.0) applied by `Text variant` | Large titles otherwise push content off screen |
| Tab labels, "Aa", icon-only controls | fixed 12 pt tab label, "Aa" capped 1.3 | keep caps; add **Large Content Viewer** (`accessibilityShowsLargeContentViewer`, `accessibilityLargeContentTitle`, iOS; verify prop availability on RN 0.86) | HIG: capped controls must show the large content HUD on long press |

Layout behaviour at AX sizes (F from code, A for rendered result):
- Buttons use fixed `h-11`, `h-12`, `h-14`, `h-16` heights (`button.tsx`). At AX sizes a label wraps or clips inside a fixed height. **R** `min-h-*` plus vertical padding.
- Speak and Type sit side by side (`flex-row`); COMPONENTS 2.18 says they stack at AX sizes. Not implemented. Same for Review's Yes/No, Read together's Back one / Next letter, onboarding segments.
- Settings `Row` puts a `value` at `max-w-[50%]` beside the title; at AX sizes this should stack (title over value).
- Tab bar: fixed `height: 58 + bottom` with a 12 pt label; at AX sizes labels do not grow (12 pt is also under the 13 pt floor in DESIGN_LANGUAGE 3). NativeTabs solves both (C4).
- **R** One hook, `useIsAccessibilitySize()` (fontScale at or above about 1.35, the AX1 threshold, **A** tune on device), drives stacking. Components own the stacking rule; screens do not.

### 2.4 Touch targets (44 pt, 56 pt primary)

**F** Button sizes: `sm` 44, `default` 48, `lg` 56, `capture` 64, `icon` 44. Ad hoc `Pressable`s use `h-11` or `min-h-11` (44). The removed-words mark in `Transcript` uses `hitSlop` to reach 44. The child switcher uses `hitSlop={8}` on a 44 high row. WCAG 2.5.8 (24 by 24 CSS px minimum) passes everywhere seen.
**Gaps:** Review "Close" and "Hear it" are `sm` ghost buttons with negative margins (`-ml-4`, `-mr-4`) that pull the target to the screen edge; fine for size, but the visual looks like a text link (`S:21-review`), so it reads as a link, not a button (S4). Write's Save is a 44 pt pill top-right, the only save on that screen, against DESIGN_LANGUAGE principle 2 ("don't put the only save action top-right"; S3). Primary CTAs in first run, Review and Read together are 56 pt (pass). The "Another thought" and "Show exactly what I said" text buttons are 44 pt high but hug their text width (pass).

### 2.5 Reduce Motion

**F** `lib/motion.ts` `useMotion()` subscribes to `reduceMotionChanged` and swaps springs for 200 ms timing (MOTION 4). `ListeningAura` honours it with a stepped ring. Book and Family use `enter()`. Gaps:
- Tonight uses raw Reanimated `FadeIn`, `FadeInDown.springify()`, `FadeInUp.delay(120)` and `LinearTransition.springify()`, not `useMotion`. Reanimated's default `ReduceMotion.System` makes these jump (no fade), contrary to MOTION 4. Worse, `FadeInUp` animates the Speak and Type buttons in, against MOTION principle 2 ("controls never animate in").
- Review's settle uses `motion.spring` (good) but `LinearTransition.springify()` on the transcript card and first-note card ignores the setting (jump, acceptable but inconsistent).
- RN `Modal animationType="slide"` (Reading Size, Whose book) does not follow Reduce Motion (**A**, verify). formSheet does.
- No screen yet uses the 1.6 s `accentSoft` arrival wash with a static Reduce Motion variant, the milestone drawing, or Read together highlight; their rules are in section 5.
- Story auto-advance (A-REQ-006, -008) does not exist yet; its timer must stop under Reduce Motion, VoiceOver and Switch Control (BL-041).

### 2.6 Reduce Transparency and Increase Contrast

**F** No screen uses blur yet (`expo-blur` is not installed; `BlurSurface` does not exist). Scrims are `bg-black/30`, hardcoded. There are no Increase Contrast tokens and no code reads `AccessibilityInfo.isHighTextContrastEnabled` (Android) or the iOS Increase Contrast setting. **R** Section 3: `highContrast` variants (`textMuted`→`text`, `line`→`textMuted`, as DESIGN_LANGUAGE 2 already specifies), selected by a `useContrastPreference()` hook; Reduce Transparency forces `BlurSurface` to solid `surfaceRaised`. **Q** RN exposes Reduce Transparency (`isReduceTransparencyEnabled`) but no direct iOS Increase Contrast query; Uniwind may expose a `contrast-more` variant on iOS (**A**, check in BL-030). If neither works, read `UIAccessibility.isDarkerSystemColorsEnabled` through a tiny Expo module (M).

### 2.7 Contrast in both themes

Text pairs (F, `tokens.test.ts` passes): every text token on its surfaces meets 4.5:1 in light and dark. Spot checks computed for this review with the same WCAG 2.x formula:

| Pair | Light | Dark | Use | Verdict |
|---|---|---|---|---|
| `textMuted` on `accentSoft` | 4.75 | 5.73 | "This month" card body, voice-check helpers | pass (narrow in light) |
| `onAccent` (white) on `recording` | 5.35 | n/a | RNR destructive button text | pass |
| white on dark `destructive`/60 over `bg` | | 5.24 | RNR destructive button, dark | pass, but dark mode should use `onAccent`-style dark ink for consistency |
| **Input and choice-pill border, `textMuted` at 60%** | **2.54** | 3.52 | onboarding inputs, Yes/No, Birthday/Not here yet, signsAs chips (`S:02`, `S:07`) | **fail 1.4.11 in light** |
| **`line` as control boundary** | **1.33** on card | **1.28** | outline Button (Make private, voice check No/Yes unselected), Add child name field, Choices dividers | **fail** where it is the only boundary (DESIGN_LANGUAGE 2 forbids this) |
| **Switch off-track `line`** | **1.33** | 1.28 | every `ToggleRow`, Expecting switch | **fail** (the native default off track plus thumb shadow is what users recognise; override removed it) |
| **Edit underline, `accent` at 60%** | **2.57** | 3.62 | dotted underline and removed-words mark in Review | **fail in light** (mitigated by the edit rows, but low-vision sighted users rely on the underline) |
| Card on `bg` (`surfaceRaised` vs `bg`) | 1.03 | 1.11 | Letter cards, settings groups | decorative; acceptable because cards are identified by their text, not their edge |
| Disabled button label (`textMuted` on `surface`) | 5.11 | 7.65 | `Button` disabled | pass (exempt anyway; good choice) |
| Web focus outline in preview | browser amber | | `S:07`, `S:25` | not our `focus` token; web must use `focus` ring (2.4.7, 2.4.11 / 2.4.13) |

### 2.8 Colour not alone

**F** Good: Listening paused state changes fill to outline plus the word "Paused"; Private uses a lock icon plus the word; selected choices add a check icon; the voice check selected state changes fill and sets `accessibilityState`; disabled is text plus fill. Gaps: edited words are marked only by a dotted underline (shape, so passes 1.4.1, but see 2.7 contrast); the onboarding segment selected state is fill plus border colour only (no icon; **R** add a check or bold label, S3); "Delete" relies on red plus a trash icon plus the word (passes). Error text (`text-caution`) has words but no icon (DESIGN_LANGUAGE 2: "caution plus an icon plus words"; S4).

### 2.9 Time limits

**F** `letter/[id].tsx` deletes immediately, shows an undo toast and calls `router.back()` after 10 s unless `isScreenReaderEnabled()` is true. Switch Control, Voice Control, Full Keyboard Access and cognitive-load users are not detected, and the undo vanishes (WCAG 2.2.1, DESIGN_LANGUAGE 11.5, COMPONENTS 2.14 "persists until dismissed"). **R** Undo persists until the user leaves the screen or dismisses it; no timed navigation. The Review saved state auto-dismisses after 900 ms; that is a confirmation, not a time limit on input, so it passes, but see 2.2 for announcements.

### 2.10 Haptics and their alternatives

**F** `lib/haptics.ts` wraps five intents (`tap`, `press`, `soft`, `success`, `warning`) with a 100 ms throttle; Android file does not exist yet. Every current haptic accompanies a visible change (good; MOTION 6). Rules (R): a haptic is never the only feedback; respect the iOS System Haptics switch (expo-haptics does, A); the 100 ms throttle must not swallow `success` or `warning` (today a `tap` followed within 100 ms by `success` drops the success; S4, fix by exempting notification intents). Intent names differ from MOTION 6 (`recordStart`, `pause`, `save`, `discard`, `pick`, `size`, `longPress`); **R** rename to MOTION's names so the map is one table.

### 2.11 Captions and transcripts for audio (WCAG 1.2.1)

**F** The product is audio-first, and the transcript is its built-in text alternative: every spoken letter shows `finalText` with the recording. Gaps and rules:
1. A recording saved without words ("Keep the recording only", transcription failed or the model not downloaded) has **no text alternative** for a deaf or hard-of-hearing family member. **R** The letter must say so in text ("No words written for this recording yet") and offer the author Type the words; never present audio-only silently. P0 because playback ships with family sharing.
2. `finalText` removes fillers and false starts. For 1.2.1 an "alternative for time-based media" need not be verbatim, so this passes (**A**, counsel not needed). The author can see the raw words (K-09); others cannot, by policy.
3. Read together's word highlight is a synchronised caption (MOTION 5g). With VoiceOver on, the paragraph is one element and highlight continues; auto-scroll pauses while exploring (COMPONENTS 2.22). **R** Offer "Read with VoiceOver" as a mode that speaks nothing over the recording: VoiceOver speech and the author's voice must not overlap. Simplest rule: while playback runs, the play control is focused and nothing else announces.
4. Paper sounds never carry meaning alone (SOUND rule 6; pass by design). UI sounds are off by default.
5. Marketing video: captions burned in (CREATIVE 4); App Store previews autoplay muted. Out of app scope; noted.
6. Web contribution page: the contributor's own recording shows its transcript after a parent's device transcribes it (K-09 note); until then the page should say so in text.

### 2.12 Other HIG and WCAG 2.2 checks

| Check | Result |
|---|---|
| 2.4.11 Focus not obscured (keyboard, Full Keyboard Access, web) | Review's sticky footer and the undo toast can cover focused content when scrolled (A); add `scrollIntoView`-equivalent padding equal to footer height (S4) |
| 2.5.7 Dragging | No drag-only actions; Reading Size uses taps; future scrubber needs increment and decrement actions (COMPONENTS 2.21 already specifies) |
| 3.3.7 Redundant entry, 3.3.8 accessible authentication | Not reached until sign-in (email code must allow paste and one-time-code autofill: `textContentType="oneTimeCode"`; BL-051) |
| 1.3.4 Orientation | App is portrait only (A, `app.json` not changed here); acceptable for iPhone, review for iPad compatibility mode (TDD 07 D5) |
| Bold Text | Mukta and Literata are not bundled; when they are, Bold Text needs a weight step per family (Mukta-Medium to SemiBold), because custom fonts do not embolden automatically (A, verify) |
| Smart Invert | Photos and the recording-colour glow should set `accessibilityIgnoresInvertColors` (iOS) when photos arrive (B-REQ-024, P1) |
| Voice Control | Depends on label-in-name (2.1) |
| Switch Control | Long-press actions on letters (share, edit, delete) must exist as `accessibilityActions` (COMPONENTS 2.5); long press is not built yet |

---

## 3. Design tokens: gaps and governance

### 3.1 What exists (F)

`packages/design-tokens/src/tokens.ts`: 13 colours per theme, `space` 0 to 12, `radius`, `fontFamily`, `type` (11 styles with `dynamicTypeStyle` and `maxScale`), `readingScale`, `elevation` 0 to 3, `motion` (3 springs, `reduceMotion`, `breathIdleMs`). `build-css.ts` emits `dist/tokens.native.css` with colours under shadcn names plus five of ours, and radii. A test checks the CSS is in sync, both themes have the same keys, and 11 text pairs reach 4.5:1.

Not emitted or not consumed: `type` (no `--text-*` variables; screens use Tailwind `text-xs` 12, `text-sm` 14, `text-base` 16, `text-lg` 18, `text-4xl` 36, so the whole type ramp of DESIGN_LANGUAGE 3 is bypassed), `space` (Tailwind's 4 px default happens to match), `elevation` (screens hardcode `shadow-black/5`), `fontFamily` (`global.css` sets `--font-serif: Georgia`; Mukta, Literata and Tiro are not bundled), `motion` additions from MOTION 3 (screens and `ListeningAura` hardcode `B = {...}`, `280`, `30`, `900`, `1600`). `tokens.web.css` is not generated yet.

### 3.2 Gaps to close

| # | Gap | Proposal (R) | Why | Size |
|---|---|---|---|---|
| T1 | **No destructive role in JS or CSS of our own.** `destructive` CSS = `recording`; `tokens.ts` has no `destructive` | Add `destructive` and `onDestructive` to `light` and `dark`. Value is a design decision (C2). If design keeps terracotta, make it a separate token that today equals `recording`, so the two can diverge; never reuse `recording` by name | DESIGN_LANGUAGE 2 says recording never means error; Android `Alert` ignores destructive styling, so the word carries meaning anyway | S |
| T2 | **No control-boundary colour.** Borders use `line` (1.33:1) or `textMuted`/60% (2.54:1) | Add `controlBorder` = `textMuted` at 100% (5.51 light, 8.01 dark on `bg`) for inputs, outline buttons, unselected pills, switch off-track if custom | WCAG 1.4.11 | S |
| T3 | **Edit underline** drawn at `accent` 60% | Add `editMark` = `accent` at full opacity (5.82 light, 7.64 dark on `surfaceRaised`), 1.5 pt dotted. Keep "quiet" through dot spacing, not alpha | 1.4.11 | S |
| T4 | **Type scale not emitted** | Emit `--text-<style>` and `--text-<style>--line-height` and `--font-<family>`; add a `Text variant` prop typed as `TypeToken` that applies size, line height, family and `maxFontSizeMultiplier = maxScale ?? undefined` | One ramp, one place for caps; removes 12 pt text | M |
| T5 | **Minimum size floor** | `type.caption` is 13; add a lint rule banning `text-xs` and `text-[<13]` in `apps/mobile` | DESIGN_LANGUAGE 3 floor 13 pt | S |
| T6 | **Fonts** | Bundle Mukta (400, 500, 600), Literata (variable or 400 plus italic), Tiro Devanagari Hindi through `expo-font` config plugin (embedded at build, no runtime load on launch) | Parity iOS/Android/web; Devanagari letters (B-REQ-003) | M |
| T7 | **Motion additions** | Move MOTION 3 block into `tokens.motion` (`fadeMs`, `enter`, `staggerMs`, `staggerMax`, `sequenceMaxMs`, `newMarkMs`, `breath`, `highlight`); emit web `--duration-*` and `--ease-standard` | Ends hardcoded `B` in `listening-aura.tsx` and literals in screens | S |
| T8 | **Target sizes** | Add `target = { min: 44, primary: 56, capture: 64, web: 48 }` | Buttons and lint read one source | S |
| T9 | **Increase Contrast** | Add `highContrast.light` and `highContrast.dark` overrides (`textMuted`→`text`, `line`→`textMuted`, `controlBorder`→`text`); emit as a third and fourth CSS variant if Uniwind supports a contrast variant (Q in 2.6) | DESIGN_LANGUAGE 2 already specifies the swap | M |
| T10 | **Scrim and wash** | Add `scrim` (ink at 30% light, black at 50% dark) and `highlightWash` (= `accentSoft`, named for Read together and arrival) | Removes `bg-black/30`; one place to tune dark mode | S |
| T11 | **Focus ring** | `focus` exists but is unused on native; define `focusRing = { color: focus, width: 2, offset: 2 }` for Full Keyboard Access and web | 2.4.7, 2.4.13 | S |
| T12 | **Elevation in dark** | Elevation says "dark: `surfaceRaised` + 1 px `line` border"; screens add `border-border` in both modes. Emit `--shadow-e1..3` and a `dark:border` utility so the rule is applied by the Card, not by each screen | Consistency | S |
| T13 | **Naming collision** | shadcn `accent` (wash) versus our `accent` (brand). Keep the shadcn mapping in CSS (RNR depends on it) but forbid `bg-accent`/`text-accent` in app code via lint; product code uses `primary` for brand and `secondary` for wash, or our own names once RNR copies are edited | Today `bg-secondary` and `text-primary` already carry our meanings; documenting stops mistakes | S |
| T14 | **Test coverage** | Extend `tokens.test.ts`: non-text pairs at 3:1 (`controlBorder`, `editMark`, `focus` on every surface, `destructive` on `bg` and `surfaceRaised`), alpha-composited pairs, high-contrast set, and that every `type.*.fontSize` is at least 13 | Encodes this audit | S |

**Premature for v1 (R):** Style Dictionary or Figma Tokens sync (the TS file is the source and is small); theming beyond light and dark (book themes are B-REQ-019, P1, and only change the book surface, not system colours); per-platform token forks (the tokens are the same on Android by decision).

### 3.3 Governance plan

1. **Ownership (F from ADR 0101):** product design owns values; design systems owns names, structure and the build. **R** `CODEOWNERS`: `packages/design-tokens/src/tokens.ts` requires one design and one design-systems review.
2. **Change process (R):** a token change is its own PR (`chore/tokens-<what>`), runs `npm run build -w @scribe/design-tokens`, commits the generated CSS (the drift test fails otherwise), and states contrast for any colour it touches (the test enforces the listed pairs).
3. **Adding a token:** only when a value is used in two places or carries a rule (accessibility, platform). One-off values stay local with a comment.
4. **Removing or renaming:** deprecate for one release with a TS `@deprecated` tag; a lint rule flags uses; remove in the next minor version of the package (package `version` follows semver; today 0.1.0).
5. **No raw values in app code (R, lint):** ban hex literals, `rgba(`, `shadow-black/*`, `bg-black/*`, `text-xs`, arbitrary `text-[..px]`, `rounded-[..px]` and `tracking-[..]` in `apps/mobile/src` outside `components/ui` and `components/platform`. Today these appear in most screens (`rounded-[14px]`, `rounded-[20px]`, `tracking-[1.5px]`); the lint starts as a warning and becomes an error when BL-076 lands.
6. **JS access:** screens get colours from one hook, `useTheme()` returning `{ c, scheme, highContrast }`, instead of the repeated `tokens[useColorScheme() === 'dark' ? 'dark' : 'light']` (found in 20 files). **K** That expression reads React Native's colour scheme, while the Appearance setting calls `Uniwind.setTheme()`. If Uniwind's override does not update RN `Appearance`, icon colours (JS) and surfaces (CSS) disagree when the user picks Light or Dark against the system. Verify in BL-030; `useTheme()` fixes it in one place either way.
7. **Web parity:** the same `tokens.ts` emits `tokens.web.css`; component and variant names match (ADR 0101). A parity checklist line in each component file header (already the convention: `// web: ... | android: ...`).

---

## 4. Components: inventory and standardisation

### 4.1 Inventory against COMPONENTS.md and RNR

"RNR" column: whether React Native Reusables has a starting component (from COMPONENT_LIBRARY 8 install list and the RNR registry naming; **A** confirm each in the registry at install time).

| COMPONENTS spec | In repo today (F) | RNR start | Accessibility state | Action (R) |
|---|---|---|---|---|
| 2.1 Button | `ui/button.tsx` (RNR copy) with shadcn variants `default/destructive/outline/secondary/ghost/link`; fixed heights | yes | role and disabled state set; fixed `h-*` clips at AX; `outline` uses `line` border; `group-*` classes present though Uniwind free ignores them | **Standardise first**: variants `primary/secondary/quiet/destructive` per spec; `min-h`; `controlBorder`; `loading` with `busy`; AX stacking handled by a `ButtonRow` |
| 2.2 IconButton | missing; ad hoc `Pressable` for gear, "Aa", remove-name X | no (build on Button) | labels present ad hoc | Build; `label` required in the type |
| 2.3 Text | `ui/text.tsx` (RNR copy) with shadcn variants `h1..muted` | yes | heading role by variant | Replace variants with `TypeToken`; apply `maxScale` from tokens; `asHeading`; `caps` prop that uses `textTransform` and keeps the label mixed case |
| 2.4 Card | `ui/card.tsx` (RNR) | yes | none needed | Default padding and radius from spec; screens stop overriding `gap-6 py-6 rounded-xl` every time |
| 2.5 LetterCard | `book/letter-card.tsx` | no | good composite label | Add `accessibilityActions` when long press lands; the "Hear Mama" pill looks like a control but is not (S3, A11Y-F25) |
| 2.6 Chip | ad hoc (signsAs examples, `PrivateChip`) | `badge`, `toggle` | selected state via `selected` | Build `Chip` and `ChoiceGroup` (radio semantics with `checked`) |
| 2.7 TextField | raw `TextInput` with three different border styles | `input` | labels present; errors not announced on iOS | Build: label, help, error with `announce()`, `controlBorder`, focus ring |
| 2.8 TextArea | `ui/textarea.tsx` exists but `write.tsx` and `review.tsx` use raw `TextInput` | `textarea` | label present; no inner padding (`S:25-write-typed`) | Use the component; padding `space.4`; uncapped scaling |
| 2.9 SegmentedControl | ad hoc pills in onboarding | `toggle-group` | radio role, wrong state key | `platform/segmented-control` per ADR; at AX sizes with more than 2 options fall back to `ChoiceGroup` |
| 2.10 Toggle | RN `Switch` direct, custom off track | `switch` | label set; off track fails 3:1 | `platform/toggle` (SwiftUI Toggle, default colours except `tint(accent)`) |
| 2.11 ListRow | `settings/settings-ui.tsx` `Row`, `ToggleRow`, `Choices` | no | good | Move to `ui/list-row.tsx`; stack value under title at AX |
| 2.12 Sheet | RN `Modal` x2 | `dialog` (not a sheet) | no title focus | `sheetScreenOptions()` + `SheetBody` (formSheet) per ADR |
| 2.13 Dialog / confirm | `Alert.alert` in Listening and Review | `alert-dialog` | native | Keep `Alert.alert` for confirms. **K** Review's child picker uses `Alert.alert` with one button per child plus Cancel; Android allows 3 buttons, so 3 or more children break on Android. Use the Whose book sheet instead |
| 2.14 Toast | `book/undo-toast.tsx` | no | announces; timed back-navigation in caller | Persistent until dismissed; focusable; above footer |
| 2.15 EmptyState | ad hoc in Book, Family, Read together | no | headings set | Build (illustration decorative, breathing per MOTION 5j) |
| 2.16 Avatar | inside `family/member-row.tsx` | `avatar` | fine | Extract when photos land (P1) |
| 2.17 ListeningAura | `capture/listening-aura.tsx` | no | decorative, RM path | Keep; read constants from tokens (T7) |
| 2.18 CaptureBar | inline in Tonight | no | buttons fine; animate in | Extract; static (no entrance); stack at AX |
| 2.19 EditUnderline | `capture/transcript.tsx` | no | rows as alternative | `editMark` token; add `accessibilityActions` [`showOriginal`, `revert`] on each row |
| 2.20 MonthChapterHeader | inline `renderSectionHeader` | no | header with full label | Extract |
| 2.21 AudioPlayer | missing (Hear button disabled) | no | n/a | Build with `adjustable` scrubber, 5 s steps, rate label |
| 2.22 ReadTogetherPlayer | missing (text-only slice) | no | counter label wrong | Build per MOTION 5g with VoiceOver rules in 2.11 |
| 2.23 PhotoFrame | missing (P1) | no | n/a | Later; alt text from the author, never generated (constitution) |
| (new) `announce`, `useFocusOnMount`, `useIsAccessibilitySize`, `useTheme`, `useContrastPreference` | missing | no | n/a | Build in `lib/a11y.ts` (S) |
| (ADR) `components/platform/*` | **directory does not exist** | n/a | n/a | Create with `toggle`, `segmented-control`, `action-menu`, `sheet-options`, `blur-surface`, `haptics` (`.ios`, `.android`, fallback) |

### 4.2 What to standardise, in order (R)

1. `Text` with type tokens and caps rules (unblocks AX5 everywhere).
2. `Button` (variants, min heights, destructive token, `ButtonRow` stacking) and `IconButton`.
3. `TextField` / `TextArea` with announced errors.
4. `ChoiceGroup` / `Chip` / `platform/segmented-control` (fixes radio semantics in four places at once).
5. `Sheet` (formSheet) with title focus.
6. `ListRow` and `platform/toggle`.
7. `Toast`.
8. `lib/a11y.ts` helpers.
9. Story screen `src/app/(dev)/components.tsx` (COMPONENTS 3) showing each variant in light, dark, AX5, Reduce Motion and Increase Contrast; it is also the Android QA sheet and the visual-regression target (section 8).

Every standard component carries an accessibility contract in its header comment (role, required label, state keys, minimum target, AX behaviour, motion and haptic intent) and a component test that checks it (section 8).

---

## 5. Motion and sound system rules (Reanimated)

These restate MOTION.md and SOUND.md as enforceable rules; values come from tokens (T7). Nothing here changes the design.

### 5.1 Rules

| # | Rule | Enforced by |
|---|---|---|
| M1 | Components never read Reduce Motion directly; they call `useMotion()` | lint: ban `useReducedMotion` from Reanimated and `AccessibilityInfo.isReduceMotionEnabled` outside `lib/motion.ts` |
| M2 | Every entering, exiting and layout animation comes from `useMotion()` (`enter()`, `exit()`, `layout()`), which returns a 200 ms fade or `undefined` under Reduce Motion | lint: ban `FadeIn*`, `FadeOut*`, `LinearTransition`, `.springify()` imports in screens |
| M3 | Controls never animate in (Save, Play, Speak, Type, Continue, Undo) | code review plus component test that the CaptureBar has no `entering` prop |
| M4 | Continuous motion only from a real signal (aura, highlight); at most one loop on screen; loops stop on blur, background, Reduce Motion, Low Power Mode | `useLoop()` wrapper that checks `AppState`, focus and `expo-battery` low power (dependency to add when MOTION 5j ships) |
| M5 | Animate transform and opacity only (exceptions: highlight width, card radius) | review |
| M6 | Commit first, haptic second, animation third; any tap skips | Review save already does this |
| M7 | Durations: snappy about 250 ms, standard about 400 ms, gentle about 660 ms, fade 200 ms, enter 280 ms, stagger 30 ms (max 6), sequence max 900 ms, arrival wash 1600 ms, 2 s absolute ceiling for any sequence | tokens; `motion.test.ts` asserts no token exceeds 2000 ms |
| M8 | Reduce Motion fallback is a paired 200 ms opacity fade with `ReduceMotion.Never` on the fade, never a jump on content that changes meaning (MOTION 4). Pure decoration may simply not run | `useMotion` |
| M9 | Font size never animates; Reading Size changes cross-fade 150 ms with scroll anchored | Reading Size sheet |
| M10 | Native chrome animates natively (tabs, formSheet, push, predictive back) | ADR 0101 |
| H1 | One `haptic(intent)` API, MOTION 6 names, never the only feedback, none during playback or highlight | lint bans `expo-haptics` outside `lib/haptics*` (ADR already says so) |
| S1 | UI sounds off by default; ambient session; never during capture or letter audio; never sound-only meaning (SOUND 3) | `playSound` guard (SOUND 5) |
| S2 | VoiceOver speech and letter playback do not overlap: no announcements while playback is running, except the user's own control focus | `announce()` checks audio mode `playback` and queues |

### 5.2 Budgets that motion must meet

See section 8.2. **K** Reanimated layout animations in long `SectionList`s (Book) can drop frames on iPhone SE 3; MOTION already limits stagger to the first 6 cards (Book does this). The `LinearTransition` on every `LetterCard` should be disabled when the list has more than about 50 rows (A, measure in BL-044).

---

## 6. iOS and Android parity plan

Android is specified but not shipped at launch (PRD 2.2). Every pattern must port unchanged. The work below is not started until Android is in scope, except the items marked **now**, which cost nothing extra if done during the iOS work.

### 6.1 Platform differences that affect accessibility

| Area | iOS (now) | Android (later) | Rule (R) |
|---|---|---|---|
| Screen reader | VoiceOver; `announceForAccessibility`; `accessibilityViewIsModal`; rotor headings | TalkBack; live regions; pane titles; announcements are discouraged on recent Android versions (A, verify) | `announce()` hides the difference: iOS announces, Android sets a live region on the message element. **Now** |
| Text scaling | Dynamic Type, AX1 to AX5, `maxFontSizeMultiplier` | Font scale up to 200% on Android 14 with non-linear scaling for large text (A, verify on device) | Same props; test at Android max in Step 0b (COMPONENT_LIBRARY 8) |
| Large content viewer | yes | no | capped controls must still be at least 44 pt with a label |
| Reduce Motion | Reduce Motion | animator duration scale 0 ("Remove animations") | `useMotion` covers both (MOTION 4) |
| Reduce Transparency | yes | none (Android never blurs) | `BlurSurface` solid on Android |
| Increase Contrast | Increase Contrast | high-contrast text | `useContrastPreference()` |
| Back | swipe from edge, close buttons | system back and predictive back gesture | every sheet and modal has a visible Close **and** handles `onRequestClose`; Listening and Review block back gestures today (`gestureEnabled: false`), so Android back must route to the same Discard / Keep confirm, never silently drop a recording. **Now** for the confirm logic |
| Switches and segments | SwiftUI Toggle, segmented Picker | Material 3 Switch and SegmentedButton (look differs, accepted in ADR) | colours from tokens; labels identical |
| Confirm dialogs | UIAlertController, destructive red | Material alert, max 3 buttons, destructive style ignored | labels are explicit verbs ("Delete letter"); no confirm with more than 3 options. **Now** (Review child picker, A11Y-F12) |
| Long press menu | ContextMenu | sheet listing actions | `accessibilityActions` identical on both |
| Edge-to-edge | safe areas | edge-to-edge enforced on recent Android; gesture navigation inset | `SafeAreaView` everywhere; the JS tab bar's fixed height must not assume an iOS home indicator (NativeTabs avoids it) |
| Pressed state | opacity or fill change | ripple expected | `Pressable android_ripple` from tokens in `Button` and `ListRow` |
| Haptics | expo-haptics | `performAndroidHapticsAsync` | `haptics.android.ts` per MOTION 6 |

### 6.2 Fonts

**F** None of Mukta, Literata or Tiro is bundled; the preview renders Georgia and system sans. **R (now):** embed fonts with the `expo-font` config plugin so both platforms render identically and nothing loads on launch (A-NFR-001). Register one family name per weight (`Mukta-Medium`, `Mukta-SemiBold`), as `tokens.fontFamily` already does, because Android does not synthesise weights from `fontWeight` with custom families. Set `includeFontPadding: false` only after checking Devanagari matras do not clip on Android (they need the padding; A). Check Literata italic for the signature and Tiro at 1.08x (DESIGN_LANGUAGE 3 open question). Font licence: OFL 1.1 for all three (F, DESIGN_LANGUAGE 3); ship `OFL.txt` in Licences (C-REQ-016).

### 6.3 Parity checks (Step 0b plus story screen)

Before any Android release: TalkBack through E2E-15 script steps, font scale maximum, animator scale 0, high-contrast text, predictive back on every modal, 3-button alert limit, Material switch off-state contrast, Devanagari line height, ripple on all pressables. Owner: mobile engineer; gate: Android release only (TDD 07 matrix).

---

## 7. Localisation readiness

**Scope (F):** en-US UI at launch (K-24); Hindi and en-IN app strings P2; Hindi and code-switched **speech**, and therefore Devanagari **letter text**, are P0 (B-REQ-003); Hindi invite messages and web page P1 (B-REQ-022). RTL is not planned; it becomes relevant only if Urdu or Arabic speakers are targeted (**Q**).

### 7.1 Findings (F)

| # | Finding | Where |
|---|---|---|
| L1 | Dates are built in English with day-month order: "Tuesday, 29 September 2026". US convention is "Tuesday, September 29, 2026" | `packages/core/src/age.ts` (`WEEKDAYS`, `MONTHS`, `dateline`), `lib/dates.ts` (`longDate` strips the weekday with a Latin-only regex) |
| L2 | Sentences assembled in code: "before {child} was born", "{child} is {age} old", "{a} and {b}", `${signsAs}, ${chapterTitle}`, "1 / 5" | `age.ts`, `onboarding.tsx` `joinNames`, `read-together.tsx` |
| L3 | Hardcoded English outside `packages/content`: `'your child'` fallback (onboarding), `WEEKDAYS` in Tonight | `onboarding.tsx`, `(tabs)/index.tsx` |
| L4 | Plurals by `=== 1` or not at all: `review.changesLabel` "{count} small fixes" renders "1 small fixes"; `chapterSubtitle`, `monthSummary` and `storageUsed` have no singular | `strings.en.ts` lines 204, 292, 492, 525; `chapters.ts` |
| L5 | `.toUpperCase()` on translated strings (eyebrows, datelines, section titles) | 9 call sites |
| L6 | Physical directions in layout: `pl-`, `pr-`, `-ml-`, `-mr-`, `text-right`, `self-end` for the signature | most screens |
| L7 | Literata has no Devanagari; no script-run splitting exists, so a Hindi letter will fall back to a system font today | `transcript.tsx`, `letter/[id].tsx`, `read-together.tsx` |
| L8 | `copy` is the `en` object directly; there is no locale selection layer | `lib/copy.ts` |

### 7.2 What to do now versus later (R)

**Now (launch, en-US):**
1. Date formatting through `Intl.DateTimeFormat` with the device locale, in `packages/core` (pure, testable): weekday, month name and order come from the locale. Hermes ships `Intl` on iOS and Android in current RN (A, verify `DateTimeFormat` with `weekday: 'long'` on Hermes in BL-030). **Q** Product decides whether the dateline is locale-driven ("Tuesday, September 29, 2026" in the US) or a fixed house style; this TDD recommends locale-driven because B-NFR-007 says "locale dates".
2. Plurals through `Intl.PluralRules`: string values become `{ one, other }` objects for counted keys, with a `plural(key, count)` helper; the content rules test checks every `{count}` string has the CLDR categories for each shipped locale. Hindi note: CLDR Hindi puts 0 and 1 in `one`, so English-style `count === 1` logic is wrong there.
3. Move L2 and L3 strings into `packages/content` as templates with named placeholders (the "1 / 5" counter becomes `readTogether.position: "Letter {n} of {total}"`, which also fixes the VoiceOver reading).
4. Replace `.toUpperCase()` with a `caps` text style (`textTransform: 'uppercase'`), which leaves the accessibility label in sentence case and is a no-op for Devanagari.
5. Script-aware letter rendering: split runs at U+0900 to U+097F and U+A8E0 to U+A8FF into nested `Text` with Tiro (DESIGN_LANGUAGE 3), in one `LetterText` component used by Transcript, Letter, Read together and Write preview. P0 because Hindi speech is P0.
6. Use logical properties (`ps-`/`pe-`, `ms-`/`me-`, `text-start`, `self-end` reviewed) in new and touched code; lint as a warning. Cheap now, expensive later.

**Later (P2 Hindi UI, then RTL if ever):** a locale layer (`copy = strings[locale]`), `expo-localization` for the device locale (not installed), a pseudo-locale build (accented and 35% longer strings) to find truncation, Hindi UI string review by a native speaker (VOICE rules in Hindi need their own content rules test), `I18nManager.forceRTL` testing. **Premature for v1:** RTL layout, Hindi app UI, translation management tooling.

### 7.3 Text expansion and layout

Hindi UI strings are typically longer and taller (matras above and below). The AX5 work (stacking rows, `min-h` buttons, no fixed heights) is the same work that makes the layout survive translation; doing it now removes most P2 risk.

---

## 8. Interface contracts, budgets and test strategy

### 8.1 Interface contracts (R)

```ts
// lib/a11y.ts
export function announce(message: string, opts?: { queue?: boolean }): void;
//   iOS: AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue });
//   Android: no-op here; the caller renders the message in a live region.
//   Never while audio mode is 'playback' (rule S2): queued until playback pauses.
export function useFocusOnMount(ref: React.RefObject<unknown>, when?: boolean): void;
//   AccessibilityInfo.setAccessibilityFocus(findNodeHandle(ref)) after the first layout.
export function useIsAccessibilitySize(): boolean;   // fontScale >= AX1 threshold (tuned on device)
export function useTheme(): { c: Colors; scheme: 'light' | 'dark'; highContrast: boolean };
export function useContrastPreference(): { highContrast: boolean; reduceTransparency: boolean };

// lib/motion.ts (extends what exists)
export function useMotion(): {
  reduced: boolean;
  spring(to: number, token?: MotionToken): number;        // worklet
  fade(to: number, ms?: number): number;                  // worklet, ReduceMotion.Never
  enter(index?: number): EntryAnimation | undefined;     // content only, never controls
  exit(): ExitAnimation | undefined;
  layout(): LayoutAnimation | undefined;                  // undefined when reduced
};

// lib/haptics.ts (MOTION 6 names)
export type HapticIntent = 'recordStart' | 'recordStop' | 'pause' | 'save' | 'discard' | 'pick' | 'size' | 'longPress';
export function haptic(intent: HapticIntent): void;    // 'save' and 'discard' bypass the 100 ms throttle

// components/ui/text.tsx
type TextProps = RNTextProps & { variant?: TypeToken; tone?: 'default' | 'muted' | 'accent' | 'destructive' | 'success' | 'caution';
  asHeading?: boolean; caps?: boolean };
//   maxFontSizeMultiplier comes from tokens.type[variant].maxScale; callers may not pass it (lint).

// components/ui/button.tsx
type ButtonProps = { variant?: 'primary' | 'secondary' | 'quiet' | 'destructive'; size?: 'md' | 'lg' | 'capture';
  label: string; icon?: IconName; loading?: boolean; disabled?: boolean; onPress(): void; accessibilityHint?: string };
//   accessible name === label (visible text), satisfying 2.5.3 by construction.
```

Each standard component's contract (role, required label, state keys, min target, AX behaviour, motion, haptic) is checked by its component test (8.3, layer L2).

### 8.2 Budgets

| Budget | Value | Source | How checked |
|---|---|---|---|
| Frame time | no UI-thread frame over 16.7 ms (60 Hz) on iPhone SE 3; 120 Hz on ProMotion with `dt`-based smoothing | MOTION 7, PRD 7.1 | Reanimated frame callback logging in a dev build plus Xcode Instruments on D1 (BL-044) |
| Screen transition | starts within 100 ms of tap; completes within 350 ms | PRD 7.1 | device measurement, 200 samples (TDD 07 G4) |
| Press feedback | visual pressed state within one frame; haptic in the same tick | MOTION 2 | component test asserts pressed style; device check |
| Content enter | 280 ms, 30 ms stagger, max 6 items | MOTION 3 | token test |
| Reduce Motion fade | 200 ms | DESIGN_LANGUAGE 8 | token test |
| Any sequence | 900 ms soft ceiling, 2000 ms hard ceiling, always skippable | MOTION 3 | token test plus review |
| Arrival wash | 1600 ms, static under Reduce Motion | MOTION 5e | component test |
| Loops | at most one on screen, stopped on blur and background | MOTION 7 | `useLoop` unit test |
| Targets | 44 pt min, 56 pt primary, 64 pt capture; web 48 px | PRD 7.6, DESIGN_LANGUAGE 4 | component test reads layout |
| Text contrast | 4.5:1 body, 3:1 large text and non-text, both themes and high contrast | PRD 7.6 | `tokens.test.ts` |
| Smallest text | 13 pt at default size | DESIGN_LANGUAGE 3 | token test plus lint |
| Announcement rate | elapsed time once a minute while recording; autosave at most every 10 s | COMPONENTS 2.8, 2.18 | unit test of the throttle |
| Font assets | 3 families, about 6 files embedded; app size impact within the 80 MB budget (A, measure) | PRD 7.7 | bundle size job (TDD 07 G0) |

### 8.3 Test strategy

This uses TDD 07's tools and gates (G0 PR, G2 internal TestFlight, G3 external TestFlight, G4 submission) and adds the accessibility content.

| Layer | What it proves | Tool | Gate | Owner |
|---|---|---|---|---|
| L0 tokens | all text pairs 4.5:1; non-text pairs 3:1 (`controlBorder`, `editMark`, `focus`, `destructive`, switch track); alpha composites; high-contrast set; no type style under 13 pt; motion ceilings; CSS drift | vitest, `packages/design-tokens/test` | G0 (blocks merge) | design systems |
| L0 content | every `{count}` string has plural forms; no `.toUpperCase` in copy helpers; new placeholders (`{n}`, `{total}`) allowed by the content rules test | vitest, `packages/content/test` | G0 | content |
| L0 core | `Intl` dates for en-US; Hindi plural categories; `announce` throttle; AX-size threshold logic | vitest | G0 | mobile |
| L1 lint | role and label on every touchable; `IconButton` label required by type; ban `allowFontScaling={false}`; ban `maxFontSizeMultiplier` outside `ui/text.tsx` (allowlist with design sign-off comment); ban `numberOfLines` on letter text; ban raw colours, `text-xs`, arbitrary sizes; ban Reanimated layout-animation imports and Reduce Motion reads outside `lib/motion.ts`; ban `expo-haptics`, `expo-blur`, `@expo/ui/*` outside `platform/` and `lib/` | ESLint with `eslint-plugin-react-native-a11y` plus local rules | G0 | design systems |
| L2 component | each standard component and each screen renders at default and AX5 font scale in light and dark: labels present, roles and state keys correct (`checked` for radios), targets at least 44/56 pt, no `numberOfLines` truncation on body text, sheets focus their title, `announce` called for errors, controls have no `entering` | jest-expo plus `@testing-library/react-native` (TDD 07 L2) | G0 | mobile |
| L3 visual regression | the dev story screen and the 12 key screens captured on the iPhone SE 3 and iPhone 16 simulators at default, AX3 and AX5, light and dark, Increase Contrast, Reduce Motion; diff against approved baselines with a small pixel tolerance | Maestro screenshots (`takeScreenshot`) with simulator content size set by `xcrun simctl ui <device> content_size` and appearance by `xcrun simctl ui <device> appearance` (A, flags to verify on the pinned Xcode); diff with a pixel-compare script | nightly; RC blocks on unapproved diffs | QE lead |
| L4 audit | `performAccessibilityAudit()` on every screen reached by E2E-01 to E2E-14 at default and AX5: missing labels, contrast, hit region, clipped text, Dynamic Type support | XCUITest target (TDD 07 E2E-15) | RC (G3, G4) | QE lead |
| L5 manual | scripts below on D1 (iPhone SE 3) | person, `docs/qa/manual/V-voiceover.md` | G3 and G4 | QE lead plus one VoiceOver user tester |
| Web | axe-core in Playwright, 200% zoom, 48 px targets, focus visible with the `focus` token | Playwright | web release | web engineer |

**Manual scripts (R).** Each is under 20 minutes and runs on a release candidate. Steps extend TDD 07 E2E-15 and must not duplicate it.

| Script | Settings | Path | Pass when |
|---|---|---|---|
| V1 VoiceOver capture loop | VoiceOver, AX5 | gate, first run, Tonight, Speak, Pause, Done, Review, open one edit row, put it back, Undo, Add to book, Book, open letter, Reading Size, Delete, Undo | every control reachable by swipe in visual order; states announced (Listening, Paused, checked, dimmed); errors and saves announced; no timed loss of Undo |
| V2 Voice Control | Voice Control on | "Tap Speak", "Tap Add to Asha's book", "Tap Hear Mama", "Tap Start Dev's book" | each visible label works (2.5.3) |
| V3 Switch Control | item scanning | stories (when built), Review edit rows, letter actions | everything operable, no auto-advance |
| V4 Large text | AX5, Bold Text | every P0 screen | nothing truncated or clipped; buttons grow; rows stack; letter text scales past 2x |
| V5 Contrast and colour | Increase Contrast, Smart Invert, Grayscale filter, Dark | every P0 screen | controls distinguishable in grayscale; borders visible; photos not inverted |
| V6 Motion | Reduce Motion, Reduce Transparency, Low Power Mode | open app, record, save, open letter, Read together | only fades; no loops in Low Power; solid surfaces |
| V7 Keyboard | Full Keyboard Access with a hardware keyboard | first run and Write | focus ring visible and not obscured; Tab order logical |
| T1 TalkBack (Android release only) | TalkBack, max font scale, animator scale 0, predictive back | V1 path | same as V1; back gesture reaches the Discard confirm |

**Which tests gate release (R):**
- **G0 (every PR):** L0, L1, L2. A failing AX5 component test blocks merge. Known S1 failures are recorded as `test.fails` with a BL link, never deleted (TDD 07 regression policy).
- **G2 internal TestFlight:** L3 nightly green; no new S1.
- **G3 external TestFlight:** L4 audit zero critical (LEGAL-REQ-051 acceptance); V1, V4 on D1; all S1 and S2 in section 9 closed.
- **G4 submission:** G3 plus V2, V3, V5, V6, V7; all S3 closed or accepted in writing by the founder with a dated entry in the accessibility statement's known-gaps list (LEGAL-REQ-052).
- **Annual:** external audit (LEGAL-REQ-051 test line).
- **Not gating in v1 (premature):** automated TalkBack, iPad layouts beyond smoke, pseudo-locale run.

---

## 9. Critique of current screens

Screenshot references are `S:<file>` in `screens-v2/`. Code references are paths under `apps/mobile/src`.

| ID | Sev | Finding | Evidence | Fix (R) | Task |
|---|---|---|---|---|---|
| A11Y-F01 | S1 | Letter text, transcript, Write and Review fields capped at 2.0x; AX5 needs about 3.1x | `letter/[id].tsx`, `capture/transcript.tsx`, `write.tsx`, `review.tsx`, `read-together.tsx` | uncap per C1; `LetterText` component | BL-080 |
| A11Y-F02 | S1 | Type ramp bypassed; 12 pt eyebrows, datelines, chips, tab labels, settings headers (below the 13 pt floor); Georgia and system sans instead of Literata and Mukta | `S:20-tonight` "ASHA · 7 MONTHS", `S:30-book` "FOR ASHA", `S:50-settings` section titles, `PrivateChip`; `global.css` | T4, T5, T6; `Text variant` | BL-072, BL-073 |
| A11Y-F03 | S1 | Delete-letter Undo vanishes after 10 s unless VoiceOver is on; no confirm | `letter/[id].tsx` `UNDO_MS` | persistent Undo; no timed navigation | BL-079 |
| A11Y-F10 | S1 | Fixed-height buttons and side-by-side pairs do not grow or stack at AX sizes (Speak/Type, Yes/No, Back one/Next letter, Review voice check, settings value column) | `button.tsx` `h-*`; `S:20-tonight`, `S:02-age-question`, `S:70-read-together-1` | `min-h`, `ButtonRow`, `useIsAccessibilitySize` | BL-074, BL-081 |
| A11Y-F04 | S2 | Control boundaries fail 3:1: inputs and pills `textMuted`/60% (2.54), outline buttons and Add-child input on `line` (1.33), switch off-track `line` | `S:02-age-question` Yes/No, `S:07-onboarding-twins` fields, `S:40-letter` Make private, `S:21-review` voice check; `settings-ui.tsx` | T2 `controlBorder`; `platform/toggle` with native colours | BL-071, BL-076, BL-078 |
| A11Y-F05 | S2 | Edit underline and removed-words mark at 2.57:1 in light | `S:21-review` dotted marks | T3 `editMark` full opacity | BL-071 |
| A11Y-F06 | S2 | Radios report `selected`, not `checked` | `onboarding.tsx` segments, `Choices`, Reading Size, Whose book | `ChoiceGroup` | BL-076 |
| A11Y-F07 | S2 | Accessible name does not contain visible label | `add-child-form.tsx` ("Add a child" vs "Start Dev's book"); letter "Hear Mama" vs "Hear it in Mama's voice" | `Button label` is the name | BL-074 |
| A11Y-F08 | S2 | iOS gets no announcement for errors, saves, autosave, stop screen (live regions are Android-only) | `add-child-form.tsx`, `review.tsx` saved state, `write.tsx`, `onboarding.tsx` stop | `announce()` | BL-070 |
| A11Y-F09 | S2 | Focus does not move on onboarding step change or to sheet titles | `onboarding.tsx`, `reading-size-sheet.tsx`, `child-switcher.tsx` | `useFocusOnMount`; formSheet | BL-070, BL-077 |
| A11Y-F15 | S2 | Destructive colour undefined; "Delete" reuses `recording` | `S:40-letter`, `S:41-letter-private-dark`; `build-css.ts` | decide C2; T1 | BL-071 |
| A11Y-F17 | S2 | Beta card on Settings home (K-13 says About only); Terms row disabled (LEGAL-REQ-008) | `S:50-settings`, `S:51-settings-scrolled-dark` | move card; enable Terms with sign-in work | owner of C-REQ-016 (not this TDD) |
| A11Y-F18 | S2 | 18+ stop screen offers an immediate retry; PRD-REQ-019 requires 24 h | `S:03-age-stop-18plus`; `onboarding.tsx` `answeredByMistake` | BL-037 implements the window; keep the calm copy | BL-037 |
| A11Y-F19 | S2 | A recording without words would have no text alternative | `pendingCopy.review.voiceOnlyButton`; 2.11 | explicit "no words yet" state with Type the words | BL-090 |
| A11Y-F21 | S2 | Tab bar fixed 58 pt with 12 pt labels; no Large Content Viewer | `(tabs)/_layout.tsx`; `S:20-tonight` | NativeTabs (C4) | BL-083 |
| A11Y-F11 | S3 | Speak and Type animate in; Tonight animations ignore `useMotion` (jump under Reduce Motion) | `(tabs)/index.tsx` `FadeInUp.delay(120)` | M2, M3 | BL-082 |
| A11Y-F12 | S3 (S1 for Android) | Review child picker: unlabelled purpose, 12 pt caps, and uses `Alert.alert` with one button per child (breaks at 3 children on Android) | `review.tsx` `pickChild`; `S:21-review` | use Whose book sheet; label "To Asha. Change" | BL-034 |
| A11Y-F13 | S3 | `.toUpperCase()` on copy | 9 sites | `caps` style | BL-072 |
| A11Y-F14 | S3 | "1 / 5" read as "1 slash 5" | `S:70-read-together-1` | `readTogether.position` string | BL-085 |
| A11Y-F16 | S3 | Write: only Save is top-right 44 pt; field has no inner padding, text touches the focus outline; web focus outline is browser amber, not `focus` | `S:25-write-typed`; `write.tsx` | bottom Save in thumb zone (DESIGN_LANGUAGE 1.2); `TextArea` padding; `focusRing` token on web | BL-075 |
| A11Y-F20 | S3 | US launch shows en-GB dates; "1 small fixes" | `S:40-letter` "Tuesday, 5 May 2026"; `strings.en.ts` `changesLabel` | L1, L4 | BL-085 |
| A11Y-F22 | S3 | JS colours read RN colour scheme while the theme setting drives Uniwind; may disagree when user overrides | 20 files; `_layout.tsx` | `useTheme()`; verify in BL-030 | BL-070 |
| A11Y-F25 | S3 | Letter card "Hear Mama" pill looks like a button but is not a control; disabled "Hear Mama" on the letter page | `S:30-book`, `S:40-letter` | until playback ships, show it as plain text with an icon, no pill | BL-074 |
| A11Y-F23 | S4 | Haptic throttle can drop `success` after a `tap` | `lib/haptics.ts` | exempt notification intents | BL-082 |
| A11Y-F24 | S4 | Error text has no icon | `add-child-form.tsx` | `TextField` error with icon | BL-075 |
| A11Y-F26 | S4 | Sticky Review footer can cover focused content at AX sizes | `review.tsx` | bottom content inset equal to footer height | BL-081 |

**What is working and should be kept (F):** the composite `LetterCard` label; edit rows as the screen-reader path to underlines; the Listening state announcements and once-a-minute timer; disabled buttons that keep AA contrast instead of 40% opacity; `useMotion` and the stepped Reduce Motion ring; calm, specific copy (stop screen, mic denied with Type instead); every text colour pair passing AA in both themes (`S:21-review-dark`, `S:30-book-dark` read well); private state shown with icon plus word.

---

## 10. Build plan

Sizes: **S** up to 1 day, **M** 2 to 3 days, **L** 4 to 5 days (one engineer with Claude Code). New tasks are proposed as BL-070 to BL-090 for the backlog owner to insert; numbers are suggestions and do not edit `docs/BACKLOG.md`. All depend on BL-030 (the Day-1 spike) unless marked.

| Task | Size | Satisfies | Depends on | Notes |
|---|---|---|---|---|
| BL-030 (existing) add checks | S | ADR 0101 gate | none | also verify: Uniwind contrast variant, `Uniwind.setTheme` effect on RN `Appearance`, Hermes `Intl.DateTimeFormat` and `PluralRules`, `accessibilityShowsLargeContentViewer` on RN 0.86, RN `Modal` behaviour under Reduce Motion |
| BL-070 `lib/a11y.ts`: `announce`, `useFocusOnMount`, `useIsAccessibilitySize`, `useTheme`, `useContrastPreference` | S | A-NFR-007, PRD 7.6, LEGAL-REQ-051 | none (pure plus RN APIs) | fixes F08, F09 (with BL-077), F22 |
| BL-071 Token additions T1 to T3, T7, T8, T10, T11, T12 and tests T14 | S | LEGAL-REQ-051, PRD 7.6 | design decision C2 for T1 value | fixes F04, F05, F15 at the source |
| BL-072 Emit type tokens; rebuild `Text` with `TypeToken` variants, `caps`, caps from tokens | M | A-NFR-005, B-NFR-006 | BL-071 | fixes F02, F13 |
| BL-073 Embed Mukta, Literata, Tiro; licences in Licences screen | M | B-REQ-003, A-NFR-001 | BL-030 | measure app size |
| BL-074 `Button` variants, `min-h`, `ButtonRow`, `IconButton` | M | A-NFR-005, A-NFR-007, PRD 7.6 | BL-071, BL-072 | fixes F07, F10 (component part), F25 |
| BL-075 `TextField`, `TextArea` with announced errors | S | B-NFR-006 | BL-070, BL-072 | fixes F16, F24; Write bottom Save |
| BL-076 `ChoiceGroup`, `Chip`, `platform/segmented-control`; raw-value lint as warning | M | A-NFR-007, LEGAL-REQ-051 | BL-071 | fixes F06, F04 (pills) |
| BL-077 `Sheet` via formSheet; migrate Reading Size and Whose book | M | PRD 7.6, B-REQ-012 | BL-030 | title focus, native Reduce Motion |
| BL-078 `platform/toggle` (SwiftUI Toggle), `ListRow` in `ui/` | S | LEGAL-REQ-051 | BL-030 | fixes F04 (switch) |
| BL-079 Persistent `Toast`; letter delete without timed back | S | WCAG 2.2.1, PRD 7.6 | BL-070 | fixes F03 |
| BL-080 Uncap letter text; `LetterText` with script runs | M | A-NFR-005, B-REQ-003 | decision C1, BL-072, BL-073 | fixes F01 |
| BL-081 AX stacking pass over every P0 screen | L | A-NFR-005, C-NFR-006 | BL-074 to BL-078 | fixes F10, F26; done screen by screen, one PR each if needed |
| BL-082 Motion rules: extend `useMotion` (`exit`, `layout`), static CaptureBar, lint M1 and M2, haptic names and throttle | S | A-REQ-008, PRD 7.6, MOTION | none | fixes F11, F23 |
| BL-083 NativeTabs | S | PRD 7.6, A-NFR-005 | decision C4 | fixes F21 |
| BL-084 Increase Contrast and Reduce Transparency variants | M | DESIGN_LANGUAGE 11.4 | BL-071, BL-030 result | |
| BL-085 Locale dates, plurals, assembled strings into content, Read together position | M | B-NFR-007, K-24 | date-format decision | fixes F14, F20; pure work in `packages/core` and `packages/content` |
| BL-086 ESLint accessibility rules (section 8.3 L1) | S | LEGAL-REQ-051 | none | warnings first, errors after BL-081 |
| BL-087 Component tests at default and AX5 plus dev story screen | M | LEGAL-REQ-051 | BL-074 to BL-078; TDD 07 jest-expo setup | |
| BL-088 XCUITest audit target and `docs/qa/manual/V-voiceover.md` (V1 to V7) | M | LEGAL-REQ-051 | TDD 07 E2E harness | shared with TDD 07 E2E-15 |
| BL-089 Accessibility statement and Help link | S | LEGAL-REQ-052 (P1) | Settings Help and Legal section | lists known gaps from section 9 |
| BL-090 Recording-without-words state | S | WCAG 1.2.1 | BL-042 | fixes F19 |
| Existing tasks to amend | | | | BL-034: replace the Review child `Alert` (F12). BL-037: 24 h window (F18) plus `announce` on the stop screen. BL-041: stories use `useMotion`, timer stops under VoiceOver, Switch Control and Reduce Motion. BL-044: add frame-time capture for Book scroll and the aura |

**Order (R):** BL-070, BL-071, BL-082, BL-086 (week 2, no UI dependencies), then BL-072, BL-074, BL-076, BL-079 after BL-030, then BL-075, BL-077, BL-078, BL-080, BL-085, then BL-081 and BL-087, BL-088 before G3. Total about 30 to 35 engineer-days including BL-081; the S1 set alone (F01, F02, F03, F10) is about 12 days.

---

## 11. Open questions

| # | Question | Owner | Default if unanswered |
|---|---|---|---|
| Q1 | Destructive colour: terracotta (today) or amber `caution` (COMPONENTS 2.1)? | product design | separate `destructive` token equal to today's terracotta |
| Q2 | Uncap letter text at AX sizes (recommended), or cap at 2.0 with Large Print as compensation? The second fails A-NFR-005 as written | product design, founder | uncap |
| Q3 | US dateline: locale format ("Tuesday, September 29, 2026") or a fixed house style? | founder, content | locale format |
| Q4 | Were JS tabs and RN `Modal` sheets deliberate departures from ADR 0101? | mobile engineer | follow the ADR |
| Q5 | Increase Contrast detection on iOS: Uniwind variant, or a small native module? | design systems after BL-030 | native module (M) |
| Q6 | Minimum iOS version (TDD 01 OQ-6); iOS 17 gives XCUITest's audit and some accessibility APIs | founder | iOS 17 |
| Q7 | Who are the 2 or 3 daily VoiceOver or large-text users in the beta cohort (TDD 07 R)? | founder | recruit before G3 |
| Q8 | Should "Paper sounds" and haptics be listed in the accessibility statement as optional feedback, and is a "Reduce haptics" in-app switch needed beyond the system setting? | product design | system setting only in v1 |
| Q9 | RTL: is any RTL language (Urdu) in the roadmap? If not, logical properties stay a cheap habit, not a gate | founder | no RTL gate |

## Changelog

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-10-03 | First draft: audit of 36 screenshots and all screens in `apps/mobile/src`, token gaps and governance, component inventory, motion and sound rules, parity, localisation, contracts and budgets, test gates, build plan. |
