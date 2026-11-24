# SE3 small phone: largest text, Smart Invert and Reduce Motion in one sitting

> **Drill identities first.** Follow `README.md` "Drill identities": drill child Asha, no real letter on the phone, and do the drill-phone check (`README.md` rule 3) before step SP.0. This sheet only taps, scrolls and looks. It keeps no letter and deletes nothing, with one exception: the SP.4 brand-mark reinstall removes the three Asha letters from the phone, so do SP.0a again after it (or run SP.4 after SP.6, before SP.7).

| | |
|---|---|
| Proves | NS-33-R4 (nothing cut at the largest text size), NS-33-R11 (pictures and the brand mark are not inverted), NS-33 Reduce Motion rows (J-N15). It is the one-page walk that the settings line of `docs/qa/DEVICE_TEST_PLAN.md` Part 5 asks for on the smallest phone. Speed is not here: that is `NS-34-SE3-SPEED.md` (BL-929, BL-1862) |
| Status | Written, not run. No result on this page is a claim about a phone. This is the on-device form. `docs/qa/SE3-SIMULATED-SITTING.md` is the labelled simulation (D-172): a simulated pass there is not a pass here, and nothing here may be filled in from it |
| Phone | iPhone SE (3rd generation), the small-screen phone in the matrix of `docs/product/prd/14-test-plan.md`. Which phones the founder holds is not in the repo [unverified] |
| iOS | Two passes, same sheet: iOS 17 first, then iOS 26 on the same phone after updating, or on a second SE 3. A phone cannot be put back to iOS 17 once updated, so run iOS 17 first. Whether an SE 3 takes iOS 26 is Apple's list and is not checked in this repo [unverified]; if it does not, write "iOS 26: not run, phone cannot take it" |
| Build | The preview build from the EAS link (`docs/qa/DEVICE_TEST_PLAN.md` P-03), or TestFlight. It is an alpha build, so the Keep sheet does not open for the three scripted letters (see the Plan row of `NS-34-SE3-SPEED.md`). Do not use a production-profile build: it holds 2 letters |
| Time | About 45 minutes per iOS version [E], not measured |
| Plan | Free, no Plus. Three scripted Asha letters (`docs/qa/DEVICE_TEST_PLAN.md` P-08), read by a consenting adult. A letter with a picture is needed for SP.4 (the Photos lens is behind `EXPO_PUBLIC_PHOTOS`; if the build has no picture on a letter, write "SP.4 not run, no picture in this build") |
| Evidence | One file per iOS version, copied from `docs/qa/evidence/TEMPLATE.md`: `docs/qa/evidence/<YYYY-MM-DD>-<x.y.z(n)>-se3-ios17.md` and `docs/qa/evidence/<YYYY-MM-DD>-<x.y.z(n)>-se3-ios26.md` (device tag `se3`, then the iOS version). One row per step id below, result words from `docs/qa/evidence/README.md` (pass, fail, blocked, n/a, not run) |
| Screenshots | Kept in your own storage, never committed. Name each `se3-ios<17 or 26>-<step>-<n>.png` (for example `se3-ios17-sp4-1.png`) and write only the name in the evidence row. Asha screens only: no real letter, name, email or sign-in code in any frame |

## Before the first step

| # | Do | Expected | Write down |
|---|---|---|---|
| SP.0a | Drill-phone check (`README.md` rule 3). Install the build, answer the 18+ question, make the child `Asha`, signature `Mama`, keep the three scripted letters. | Book holds only Asha and scripted letters | pass or stop |
| SP.0b | Fill the evidence header: model, iOS version, marketing version and build (Settings > General > About), commit from the EAS build page, battery percent. | Header complete | the header |
| SP.0c | Note the starting settings so you can put them back: Larger Text (and whether Larger Accessibility Sizes is on), Bold Text, Smart Invert, Reduce Motion, Dark or Light. Menu paths: Settings > Accessibility > Display & Text Size (Larger Text, Bold Text, Smart Invert) and Settings > Accessibility > Motion (Reduce Motion). Paths are not checked in this repo and iOS moves them; if one is missing, search Settings for the name and write where it was. | Starting settings in the header | the settings line |

## Steps

Do SP.1 to SP.3 in order, then SP.4 to SP.6. At the start of each step the setting named in it is the only change from the step before; turn off what the step does not name.

| # | Do | Expected | Write down |
|---|---|---|---|
| SP.1 | **Largest text, the main walk.** Larger Text on with Larger Accessibility Sizes, slider to the largest (AX5). Light mode. Open the app. Visit Home, the Book, a letter page, Review (open a kept letter's edit), Settings and the Keep sheet if it opens. Scroll each to its end. | On every screen: every word shows to its last letter (no three dots, no clipped line); every control can be reached by scrolling; the pinned button, where there is one, stays on screen. The letter's own words are never capped | Per screen: pass or fail, and for a fail the screen and what was cut. Screenshot of the worst screen as `se3-ios17-sp1-1.png` |
| SP.2 | **Largest text with Bold Text.** Keep AX5, turn Bold Text on, reopen the app. Repeat the Book bar check of `DEVICE_TEST_PLAN.md` row DJ-A1 steps 3 and 4 (scroll until the bar holds, read the title to its last letter). Put Bold Text back after. | Title shows in full, wrapping to more lines if it must; none behind the Months button or the gear | pass or fail, line count |
| SP.3 | **Largest text with VoiceOver.** AX5 on. Turn VoiceOver on (Settings > Accessibility > VoiceOver). Open a letter page; with the Headings rotor, move through headings. Then on Me, do the same. Turn VoiceOver off. Then on a letter page, swipe through in DJ-N12's order: the list, Share, Delete. This is the short form of row DJ-N12; run its full steps if you have time. | The letter's dateline and the Me title are read as headings; focus order matches the order on screen; the list, then Share, then Delete, in that order, nothing truncated | pass or fail, what was read first |
| SP.4 | **Smart Invert, light mode.** AX5 off (default size). Smart Invert on. Open the Book, a letter with a picture and the Photos lens. Then the brand mark: the welcome lockup shows only on first run, so it is not reachable after SP.0a and About has none. To see it, delete the app and reinstall with Smart Invert already on (fresh-install pattern of `DEVICE_TEST_PLAN.md`; the Keychain can survive a delete, so see its reinstall caveat, BL-460), look at the first screen, then redo SP.0a. If you do not reinstall, write "brand mark: not reached". | Pictures keep their true colours (not negative). Text and surfaces invert as the phone does for any app. The brand mark is not inverted (NS-33-R11). Any picture that shows as a negative is a fail, S2. A lockup that inverts is a known gap (BL-984, blocked; the lockup has no ignore-invert flag): record fail, S3, and cite BL-984 instead of opening a new issue | Per screen: picture true or negative; brand mark true or inverted. Screenshots |
| SP.5 | **Smart Invert, dark mode.** Smart Invert on, then Dark mode on (Settings > Display & Brightness). Open the Book and a letter. | Nothing becomes unreadable: no text vanishes into its background; pictures stay true. Write down anything that looks doubled (dark app, inverted again) | pass or fail, what looked wrong |
| SP.6 | **Reduce Motion.** Smart Invert off, Dark off. Reduce Motion on. Visit Home, Listen (start a take, stay quiet 10 s, stop it and let it go), the Book, an empty-state screen, an error or state screen, the invite screen (n/a if the build has no invite entry, as a servers-off build may not; that is not a fail). Watch each for 10 s. This is the short form of row DJ-N15; the loop timings are SE3.8 of `NS-34-SE3-SPEED.md`. | Nothing loops: no breathing lamp, no sweeping bar, no spinning wheel. A system spinner may still turn: write it down | Per screen: moving yes or no, and what moved in words (no letter text) |
| SP.7 | **Put it back.** Return every setting noted in SP.0c. If SP.4 reinstalled the app, redo SP.0a first (the Asha letters are gone until then), or run SP.4 after SP.6 so the letters are not needed once it is done. Delete nothing else. | Phone as found | done or not |

## Result words and failures

Pass, fail, blocked, n/a, not run (`docs/qa/evidence/README.md`). A step you could not do says why. A failure gets a GitHub issue labelled `beta` and a severity (a picture inverted or a word cut at AX5 is S2; a screen with an unreachable control is S1), and its number goes in the row. Never average a failed pass away: repeat it and write both.

## Not in this sheet

Speed, frames and memory (`NS-34-SE3-SPEED.md`). The tab bar's own system settings (Liquid Glass tinted, Reduce Transparency) are RT-A11Y-03 in `docs/qa/RELEASE_TEST_PLAN.md`. Grayscale and the colour filters are RT-A11Y-08 and are not walked here. A large phone pass is optional and is not asked for.

## Before this sheet is first run

- The build is one the founder installs. Writing the sheet is not a run, and no code, requirement or CI file changed.
