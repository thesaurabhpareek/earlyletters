# Early Letters v1.0: design critique (Design Lead)

Scope: all 116 captured steps (iPhone 17 Pro web render, 402 x 874, English, default text size) plus the full-length captures I opened (J06-01, J09-03, J10-05, J13-03, J16-01, J17-01, J17-03). Judged against `packages/design-tokens`, `docs/design/*` (origin/develop), `docs/brand/BRAND_SYSTEM.md`, `VOICE.md`, and the website atmosphere components on origin/main. Contrast ratios were computed from token hex values. Detail per step is in `design.json`.

Totals: 1 blocker, 47 major, 90 minor. Step verdicts: 37 ok, 76 fix, 4 gap, plus the system-level `_journey` entry (many findings repeat across steps; the real count of distinct issues is about 40).

What is good and should be kept: the voice and copy ("Exactly as you said it", "Kept. Rest well."), equal Speak and Type doors, pinned primary buttons with the bottom thumb zone on Review, Write and onboarding, serif letter text at 20/32 with the right-aligned italic signature, the in-place "why was this changed" panel, no streaks or counts anywhere, equal-weight consent buttons, and the Reading size sheet that previews each size.

## Top 10 issues

1. **J20-01 blocker: a crash is a blank white page.** No message, no way back, white flash in a warm or dark app. Add an ErrorBoundary and set the native root background to `bg`.
2. **Dark mode leaks light-mode values (J18-02 to J18-06).** Tab bar stays cream (17:1 bright strip), Settings gear 1.24:1, lock icon 1.13:1, back arrow 3.16:1, scrubber track cream, recording disc uses light `recording` (3.29:1). J18-01 also shows a half-themed screen on the Dark selector (may be a transition frame).
3. **The website's principles are absent from the app.** No LampLight, grain, paper texture or vignette; atmosphere tokens unused; the opening-quote pair is on none of the 116 screens. Warm paper without light.
4. **Review (J06) is the product's trust screen and its hierarchy is the weakest.** Tidy-up marks are about 10 pt dotted tokens, the first-time trust note is 13 pt, nine controls over two screens sit under a 130 pt footer, and edit mode (J06-08) drops Literata and the focus ring while the only exit is a 14 pt link.
5. **Machine-written sentences appear as the parent's words** (J08-03 "Just Asha, and us, and an ordinary day." signed From Mama; J10-10; "Dear Asha," ghost). Conflicts with the constitution; needs a distinct app-voice style or removal.
6. **Navigation chrome has five idioms** (`< Back`, arrow + inline title, Close text, X circle, bottom Close) and no large titles on pushed screens. Tonight has no Settings or child switcher; the Book's switcher is a 12 pt caps label above a duplicate title (J01-14, J03-04).
7. **Selection and affordance drift:** Yes/No fill only, chips with check, day pills with no edge (1.06:1), "Not quite" solid accent competing with the primary, and value rows with no chevron (Spoken language, child fields, model state in J14-01, Restore purchases).
8. **Empty, error and loading states have six treatments**, and loading ("Writing down what you said", J05-03) is a still card with no sense of working. Unmatched route (J19-01) is Expo's black default with the raw URL.
9. **Tap targets and reach:** many controls render under 44 pt (marks, Got it, text links, 36 pt X, Aa, gear); primaries on Book empty, Export, gates and Family sit mid-screen or below the fold (J17-01 CTA is under the tab bar).
10. **Coverage and accessibility gaps:** nothing captured in hi, es, zh, fr, ar (RTL), pt or AX text sizes; roles and labels are not in the step data; Spoken language, Storage and add-child were not captured. Also US-only helplines in a seven-language app (J16-05), and the first-run language pick starts a 575 MB download with no size or Wi-Fi cue (J01-12, J14-01).

## System-level recommendations

- **One theme binding.** Navigation container, tab bar, headers and every icon colour resolve through `useTheme`; lint against hex and `tokens.light` outside the provider; extend the J18 dark pass to every route.
- **Atmosphere and brand device.** A single `Atmosphere` wrapper (static grain, radial lamp pool from `atmosphere.lamp`, tone paper|night, off under Reduce Motion and Reduce Transparency) and a `QuotePair` from the brand registry, used on five screens only: Welcome, Tonight, Listening, Letter, End of book. No continuous loops except the voice-driven glow (MOTION principle 1).
- **One ScreenHeader and one Sheet.** Root large title; pushed with chevron back and collapsing large title; modal with Close. Retire the arrow-only, bottom Close and text-only Back variants.
- **One selection pattern.** accentSoft fill + accent edge + check for ChoiceGroup and Chip; solid accent only for the single primary; ListRow always shows a chevron, a value or a switch.
- **One StateScreen** (art, title, body, full-width bottom action) plus a Breathe loading variant, a root ErrorBoundary and `+not-found`.
- **Type discipline.** One Dateline component (`letterDateline` x `readingScale`), trust copy never below `subhead` 16, one display size for finales; Large print scales metadata too.
- **Targets and reach.** Quiet and link buttons min-height 44 with hitSlop; bottom-action rule for primaries; add bounding-box assertions to the web journey run and an Accessibility Inspector pass on device.
- **App-voice style** for every system note (no signature, never first person), decided with product and content.
- **Verification plan (qa).** Device pass for what the web render cannot show: teal switch thumbs, edit-field outline, scrim, pickers, keyboard avoidance, Dynamic Island, haptics, motion and Reduce Motion (layout shifts: prompt swap about 32 pt, Listening to Paused 13 pt, Private chip 20 pt, note dismissal about 135 pt), VoiceOver names for icon-only controls, seven locales including forced RTL, and Dynamic Type to AX5.

## Limits of this review

Stills cannot show motion, haptics or sound, so calm motion is unverified. Web artifacts (0 safe-area insets, teal RN-web switch thumbs, default input outlines, native pickers) are called out where they could mask or imitate defects; none is claimed as an app defect without that caveat. I did not reach the live website; website tone is taken from `apps/web` on origin/main. Accessibility labels could not be inferred from the step data.
