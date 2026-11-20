# NS-46 to NS-50: design systems and accessibility review

Reviewer: `design-systems` lens (a Claude role, not a licensed accessibility auditor). Date: 20 Nov 2026 (UTC). Branch read: `docs/locked-pack-inputs-20nov`. Writes only this file; nothing committed.

## 0. What I read, and what I did not

Read: `CLAUDE.md`; the five cards in `21-days-cultural-photos-home.md` (lines 99 to 1050); `20-founder-direction-20nov.md`; `GAP-LOG.md` (K1 to K10, R-IA-1 to R-IA-6, N-1 to N-8, CB-1 to CB-6, DL-1 to DL-10); `18-errata-after-lock.md` (E17, E18); `functions/BRIEF.md`; `functions/feature-opportunities.md` (sections 6.1, 8, 10); `functions/quality.md` (Annex C and the NS-33 rows); NS-33 rows in `11-foundations.md:262-277`.
Read with `git show origin/docs/e2e-ux-20nov:<path>`: `docs/design/system/BRIEF.md` (the Liquid Glass policy, section 3), `COMPONENTS.md` (N7, A2, A4, C7, C8, C9, I1 to I7, F1, F2, F6, sections 9 to 12), `MOTION.md` (m.* table, sections 8 and 9), `FOUNDATIONS.md` (type ramp, colour tables, size tokens), `docs/design/e2e/IA-AUDIT.md` (all), and the area A, C, D, E `DESIGN.md` files for A-S01, C-S06, D-S04, D-S06, D-S11, E-S08.
Outside facts read this session: Apple `JournalingSuggestionsPicker` page (https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker.md, read 20 Nov 2026) and WCAG 2.2 SC 2.5.8 (https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html, read 20 Nov 2026).
Not read: the five `WORDS.md`, `AUDIT.md`, `tokens.v2.json`, the prototypes, any code. Nothing was run on a device. Contrast figures are quoted from FOUNDATIONS tables, not recomputed.

## 1. Summary

No P0 from this lens: nothing here forces a build to stop. There are 22 P1 findings (fix before build) and 8 P2 notes. The five that matter most:
1. NS-49-R11 and A-S03 `suggestions.empty` look unbuildable as written. Apple's picker page documents only a label and an `onCompletion` that fires when a suggestion is chosen. The app is likely never told about cancel or an empty list, and "Pick a photo instead in the same sheet" cannot be put inside Apple's sheet (UNVERIFIED that no callback exists; see F49-2).
2. The clear call-out the founder asked for has no component, no placement and no type size anywhere in the design system (F47-1).
3. Home day slip: three different placements are written down (above the prompt in COMPONENTS C9, below "Another thought" in A-S01, above the prompt as a line in NS-50-R4) and the same word "Not now" means "until tomorrow" on one slip and "never again on Home" on the other (F50-1, F50-3).
4. A quiet day (Memorial Day) is described two ways: NS-46-R13 says an ordinary prompt shows below; NS-50 says no prompt line (F50-5).
5. None of the new screens is in the accessibility screen set (NS-33-R4, R7, R16; quality Annex C), so the AX5, VoiceOver and audit rows would not cover them (F-X1).

Verdicts: NS-46 CHANGES, NS-47 CHANGES, NS-48 PASS (one P2 row), NS-49 CHANGES, NS-50 CHANGES. Details in section 8.

## 2. NS-50 Home today against the IA audit

| IA-AUDIT item | What NS-50 does | Result |
|---|---|---|
| 5.2 Home is not thin; the weakness is a stale second visit | Section 2 repeats it | Agrees |
| 5.3 and R-IA-3: slip, not strip; order 1, 2, 2b, 3, 4 | R1, R5, R11 | Agrees; adds 2c |
| 5.3 "use the same component as D-S11's typed-day line so a day shows one way whether the parent arrives by notification or by opening the app" | R4 draws two ways: a line above the prompt after a tap, a slip otherwise | Departs. NS-50 conflict 5 says Karma to confirm. See F50-1 |
| 5.3 "a day we mark is one line of the parent's own words" | The slip carries the NS-46 landing words | Agrees |
| 5.3 picture suggestion is not a slip, lives in the capture cluster | R10, NS-49-R1 | Agrees. But NS-49 now puts a choice inside Start from a photo, which IA 6 says must stay "the same control" (F49-1) |
| 3 D-10 one Days page, "one row in Me and one row on Reminders" | NS-46-R3 one page, row in Me only | Small gap: no row on Reminders (F46-6, P2) |
| 4.3 and R-IA-4 Me regroup only after tree test T1 | NS-46 section 3 says "built only after T1" | Gap: no fallback location for the Days row if T1 has not run (F46-6) |
| 8 C8 owners "design systems (C9), mobile" | NS-50 section 10 names the same | Agrees; COMPONENTS C9 still lists four slip kinds and needs 2b and 2c (section 7) |
| 7 X6 quiet enforcement has no reader in the planner (INFERENCE) | R8 relies on "quiet book shows no day slip" | Gap: NS-50 section 22 does not list BL-985 or `bookIsQuiet` (F50-7, P2) |
| 3 D-06 past-letter switch moves to the "Home" group | NS-50 does not say | No conflict |
| 5.1 AX5 Home: cluster inline, slip after it | R12 and section 6 AX5 line | Agrees in intent; the slip's reading order at AX5 is not stated (F50-2) |

## 3. NS-50 Home today (rows R1 to R12)

**F50-1 (P1). One day, three placements, two renderings.**
Evidence: COMPONENTS C9 "a slot above the prompt" with AX5 "never between the prompt and the capture cluster"; A-S01 layout item 6 and its VoiceOver order put the slip after "Another thought" and before the cluster (A-S01 `DESIGN.md:221, 226`); NS-50-R4 (line 955) puts the day as a line above the prompt after a notification tap and a slip otherwise; conflict 5 (line 74).
Why it matters: a parent who sees "Thanksgiving" above the prompt after a tap and below it on the next open meets two layouts for one fact, and the prompt moves. IA-AUDIT asked for one.
Change: one component, one place. NS-50-R4 reads: "Given a ticked day today, When Home opens by any route, Then the same day slip shows in the slip slot, in the position A-S01 draws; a notification tap does not change what Home shows." D-S11 `libraryDay` becomes "Home with the day slip". C9 and A-S01 agree on one position (my recommendation: directly above the prompt block, as the typed-day line sits, so the day reads as context for the prompt; at AX5 it scrolls with content above the prompt). If Karma keeps R4 as drawn, the row must state the exact position of each version and a test that Speak and Type never move between them.

**F50-2 (P1). The slip's anatomy and VoiceOver contract are not specified; section 6 and R12 contradict themselves.**
Evidence: section 6 "one element, name then line, with a 'Not now' button"; R12 "one element read as the name then the line, then the button". The shipped slip pattern is C-S06 (`C-keeping DESIGN.md:380-383`): one VoiceOver element whose label is the line, a custom action "Not now", and a visible "Not now" button for Voice Control and Switch Control; the whole card is the tap. A day slip has no destination, so the whole card must not be a button.
Change (new row NS-50-R13, P1): "Given the day slip, Then it is one non-interactive element with the label '{name}. {line}', a custom action for the dismissal, and a separate visible dismiss button of 44 pt or more that Voice Control and Switch Control can reach; no nested interactive child inside an accessible group; at AX3 and above the button takes its own row, full width; the card is `surfaceRaised`, `radius.md`, 16 pt padding, `callout` in `text`." Add the variant to C9 (section 7 below). Test title `[NS-50-R13] day slip anatomy and labels`.

**F50-3 (P1). "Not now" means two different things.**
Evidence: NS-50-R7 (line 958): leaves until tomorrow and "is not an answer to anything". NS-47-R19 (line 396) and CB-6: "Not now" on the ask is final for Home. Same words, same component, different consequence.
Change: NS-50-R7 gains: "the VoiceOver hint states the consequence: day slip 'Hides this until tomorrow'; ask slip 'Closes this question. You can still choose days in Me.'" `content` to decide whether the day slip uses a different word, since a day the parent chose themselves has nothing to defer (open question for `content`; default: keep "Not now" for the ask, use `en.common.notNowButton` for the day slip only if no better key exists).

**F50-4 (P1). Ask slip: equal weight and height budget.**
Evidence: NS-47-R25 (line 402) needs "Not now" at the same visible label and touch size as the primary. C9 defines a slip with at most one `bordered` button and a quiet text dismissal. The closest precedent for equal answers is the reminder ask D-S04 (`D DESIGN.md:353`: two `secondary lg` buttons stacked at every size, "one sentence, two equal choices"). A two-line question plus two stacked 56 pt buttons is about 190 pt of slip. On an SE 3 (375 by 667) with the 64 pt cluster pinned at the bottom, that can push the prompt under the glass at default size (my arithmetic, not measured).
Change (new row NS-47-R31, P1): "Given the Days ask slip, Then 'Choose days' and 'Not now' are two `bordered` buttons of the same style and size (`size.control.md` 48, pending `target.md`), stacked at every size, in that order; neither is `filled`; and on an SE 3 at the default text size with the ask showing, the prompt's full text is visible above the capture cluster without scrolling, or the ask is placed below the prompt (device check)." Add the SE 3 default-size check to NS-50's risk checks (currently AX5 only).

**F50-5 (P1). Quiet days: the prompt is both shown and hidden.**
Evidence: NS-46-R13 (line 186): "the prompt below is an ordinary prompt" and quiet days show "no question". NS-50 section 5 (line 916): quiet-tone day shows the name and "The book is open if you want it." "and no prompt line".
Why: "Memorial Day. The book is open if you want it." directly above an ordinary prompt such as a question about this week is a tonal clash, and R16 forbids a question on a quiet day.
Change: one ruling, then both cards say it. My default: on a quiet day Home's prompt block is replaced by the quiet line (Speak and Type unchanged), and NS-46-R13 drops "the prompt below is an ordinary prompt" for quiet days. UNVERIFIED whether a gentle prompt subset exists to use instead (FR-OPP-04 mentions "hard-day prompts" excluded); if it does, that is the alternative.

**F50-6 (P1). Motion for the slip is half specified.**
Evidence: R12 is P2 and gives only the Reduce Motion half ("at most a 200 ms fade"). MOTION: `m.enter.group` is for cold launch or first show only and Reduce Motion makes it one `m.fade` of 200 ms; a slip that appears later is already in place (T-RESUME); a dismissed slip is `m.list.remove` (row fades, neighbours `m.move`; Reduce Motion: fade, gap closes next frame). MOTION section 9 has no haptic for a dismissal, so "no haptic" in R7 is correct.
Change: R12 becomes P1 and reads: "Given the slip, Then on cold launch it arrives with `m.enter.group`, on any later visit it is already in place, a dismissal is `m.list.remove`, a day change removes it with no animation, and under Reduce Motion each becomes the `m.fade` or jump in MOTION section 8; no haptic plays." Reason for P1: NS-33-R5 and A-NFR-006 treat Reduce Motion as a store duty (NS-33 is P0 (b)).

**F50-7 (P2). Dependencies.** Section 22 lacks BL-985 and the proposed `bookIsQuiet` helper that R8 needs (IA-AUDIT X6, X8); add them. Also the day slip at rank 2b suppresses Save a copy (rank 3) for the whole day in the birthday week; say so in the card so it is a known cost, not a surprise.

## 4. NS-47 Cultural background (rows R1 to R27)

**F47-1 (P1). The call-out has no home.**
Evidence: the founder asked for "a clear call-out" (direction 1.2 and 3.4). NS-47 section 12 holds the sentence and R22 holds its truth rule, but no row says where it shows, in what component, at what size. COMPONENTS has: F2 SystemLine (system conditions only, "never status", one per screen, announced politely once: wrong job), `AppNote` (`footnote` in `textMuted`: too quiet for the one sentence a parent must read before choosing), an InlineNote with a close button proposed in area C (`C DESIGN.md:529`, dismissible: wrong for a promise).
Change (new row NS-47-R28, P1, reason (a) a promise): "Given the ask slip, C-S25 and C-S24, Then the call-out is a static content-layer block ('DoorNote', new shared component) in `callout` type, colour `text` (not `textMuted`), on `surface` with `radius.md`, with a decorative lock glyph hidden from VoiceOver; it is never collapsed, never behind an info glyph, never dismissible, never glass; it is in reading order before the first control that records a choice; it wraps at AX5 and never truncates; on the ask slip a short form (one sentence, content's) shows under the question and the full form shows at the top of C-S25." Justification for a new component: three surfaces here, and C-S21 (backup consent door lines) and NS-10's sheets need the same block. Test: `[NS-47-R28] call-out is visible, static and first`. Contrast: `text` on `surface` is above 4.5:1 in every scheme per FOUNDATIONS tables (not recomputed).

**F47-2 (P1). There is no optional-field pattern, so "optional" is whatever each screen draws.**
Evidence: COMPONENTS I1 has no optional variant; E-S08 says the name is "optional on the account-first path" with no marker (K-E12, `E DESIGN.md:565`). NS-47 asks for optional picks and says "Not now" is a full answer but not how a screen shows it.
Change (new row NS-47-R29, P1): "Given any optional question or field in first run or later (E-S08 name, C-S25 pickers, the ask), Then optional is stated in words next to the label ('Optional', never an asterisk, never placeholder-only, never colour alone), VoiceOver reads '{label}, optional', the decline control ('Not now' or 'Skip') has the same style and size as the accept control and sits in the same stack, nothing is preselected, and choosing to skip writes nothing and prompts nothing later." The rule against a stored "Prefer not to say" (R20, section 12) stays. Add an `optional` slot to I1 and a `decline` role to the paired-answers pattern of D-S04. WCAG 3.3.2 (labels or instructions) is the likely criterion; UNVERIFIED, not re-read this session.

**F47-3 (P1). Browse needs multi-select rows and the design system retired multi-select.**
Evidence: COMPONENTS section 10 retires `Chip variant="filter"` ("no multi-select filters in scope"); I4 is single choice with radio semantics. NS-46-R20 and NS-47-R20 need several ticks.
Change (new row NS-46-R30, P1): add I4 variant `multi` (list): row of at least `size.row` 52, leading check shape plus the name, date in `footnote` `textMuted` ("around 27 November"), `accessibilityRole` checkbox with checked state, VoiceOver "Thanksgiving, around 27 November, ticked", tick shown by a check glyph and weight, never colour alone, `m.select` motion and `H-select` haptic only on a tick change, AX5 stacks date under name, no truncation of any day name. No "select all" (as the card says). Dependency: `layout.rowMin` and `target.md` are still open name requests (COMPONENTS section 9).

**F47-4 (P1). "Done the only exit" contradicts the sheet contract.**
Evidence: NS-46 section 15 (line 281). COMPONENTS N7: swipe down and the VoiceOver escape gesture must close a sheet; `dismissible={false}` is only for required choices. Ticks are saved as they are made (NS-46 section 6), so there is no unsaved state to guard.
Change: "Done is the visible button; swipe down, the VoiceOver escape gesture and Back do the same as Done; nothing is lost on any of them." Also: the "Dates differ by country" and "Which calendar" questions are rows inside the sheet (I4 list), never a second sheet, and C-S26 is reached only from C-S24 by push, so no sheet opens over the Browse sheet (the date sheet I3 is then the only sheet on a pushed screen).

**F47-5 (P1). "Flat list" and group headings.**
Evidence: NS-47-R25 and NS-46-R26 want lists that "read flat"; NS-46-R20 orders Browse in four groups.
Change: define flat: group titles exist and are headings (VoiceOver rotor), rows inside are one level, no collapsible sections, no nested tiers, no ordering by size. A long list with no search at AX5 needs the heading rotor; without headings it is not navigable. Also "the small hemisphere control" (NS-46 section 5) must be an I4 segmented row of 44 pt or more that stacks at AX1 and above ("small" is not a size we have; WCAG 2.5.8's 24 px minimum is below our 44 pt floor, so the house floor governs). Its default must not be inferred from the time zone or locale (R20's spirit); default: nothing selected, northern names shown, as the card says.

**F47-6 (P1). Where the day-name switch lives.**
Evidence: conflict 1 and NS-47-R14: Me, Reminders gets two name switches ("Names in notifications" and "Show the day's name in the note"), one forced off by App lock with a reason.
Change: put the day-name switch on the Days page (C-S24) with its own help line, not on Reminders, so the switch sits beside the thing it affects and Reminders keeps one names switch. Default: Days page. The disabled-with-reason state follows the built `.appLock` pattern (D-S06 line 417). That pattern is a third case beside COMPONENTS 1.2's "absent" and "not ready"; I read it as "present and not ready" (it will act once App lock is off) and the reason line is mandatory. Karma to confirm the reading.

**F47-7 (P1). Ask slip lifecycle is ambiguous and can starve other slips.**
Evidence: NS-47-R19 says the ask shows "once" and "Not now ends it", but an ask the parent ignores is neither shown once nor ended. At rank 2c it would sit above Save a copy (rank 3, a "before you lose it" prompt; NS-11) and the past letter every visit.
Change (new row NS-47-R30, P1): "Given the Days ask has been displayed on two separate Home opens without an answer, Then it retires to Me, Days and does not return." Rank (conflict 7 owner is design lead area A; as design-systems lead I recommend): 1, 2, 2b, 3, then 2c, then 4. A time-bound slip outranks an evergreen question; the question outranks the past letter, which can be due on most days. Capped at two showings it cannot starve anything.

**F47-8 (P2). C-S24 has no "one tap" untick for typed or library rows.** NS-47-R21 says every ticked day can be unticked in one tap. C-S24 rows open C-S26 (Remove is a second tap) and a swipe is gesture-only. Reword: "untick in one tap on the Browse list; on C-S24 by Remove in C-S26, a swipe action and a VoiceOver custom action." The sheet row toggle satisfies the one-tap case.

## 5. NS-46 Days we mark (rows R1 to R28)

**F46-1 (P1). Store failure must not hide typed days.**
Evidence: `days_store_unavailable` (section 6): "the Days page shows one line and Try again". Typed days (NS-18) live in `scribe.db`; the library store is a separate file (NS-47-R6).
Change (new row NS-46-R29, P1): "Given the library store cannot be read, Then C-S24 still lists the parent's typed days and shows one in-place line with Try again in the library section only (F2 pattern, not the whole-screen C8 state), announced politely once; no icon-only signal, no red." Test `[NS-46-R29] a failed library read leaves typed days visible`.

**F46-2 (P1). C-S24 row semantics.** R26 covers reach and names but not the row contract. Add to R26: each row is one VoiceOver element labelled "{name}, {date or around date}" with the chevron hidden; the "no date for next year" line (R15) is part of the row's label, in `footnote` `textMuted` with no warning glyph; sections are headings ("a day you type", "a day we mark", words by `content`); no count anywhere, including in a VoiceOver label.

**F46-3 (P2). Moved-date choice.** "One year or always" needs a control. Spec: an I4 choice group under the date in C-S26's date sheet, stacked at AX1 and above, default "just this year" (the less lasting choice). Records a parent's own date (R14).

**F46-4 (P2). Notification permission line.** Ticking works with notifications off; "one line says notes need permission" (section 5). Reuse the D-S06 `.denied` card as built so the wording and the Open Settings action match, one per screen (F2 rule).

**F46-5 (P1). Tick receipt.** Saves are instant and motion is the receipt (COMPONENTS 1.4). Say it: a tick shows only the row state change (`m.select`), `H-select`, and a VoiceOver value change ("ticked"); no toast, no success haptic, no count. Add to R2 or a new row so no builder adds a "Added" toast (which would also be glass, a third surface on a sheet screen).

**F46-6 (P2). Where the Days row lives before T1.** R-IA-4 builds the "Notes and days" group only after tree test T1. NS-46 needs a fallback: "until T1 has run, the Days row sits directly under Reminders in its present group; both routes open C-S24." Matches IA-AUDIT D-10 "one row on Reminders".

## 6. NS-48 Notification catalogue (rows R1 to R27)

No screen of its own, no new setting, volume unchanged by construction (R2, R24). From my lens only one gap.
**F48-1 (P2).** New row NS-48-R28: "Given D-S06 'How it will look' at AX5 with Bold Text, Then the example title and body wrap and never truncate, the block is one VoiceOver element labelled 'Example' then title then body, it shows the neutral rendering when names are off or App lock is on, and it never shows a variant that the planner would not send." R22 already makes the preview call the planner's function; this adds the accessibility contract. The lock-screen rendering is the system's and outside our control (D-S10).

## 7. NS-49 Picture-first start and Journaling Suggestions (rows R1 to R27)

**F49-1 (P1). The entry control and the extra tap.**
Evidence: Apple's page (read 20 Nov): `JournalingSuggestionsPicker` is a SwiftUI `View` with initialisers that take a `label` (the button text) and `onCompletion`, available from iOS 17.2; "The first time the picker appears, a modal sheet introduces the concept". So the control that opens it is a SwiftUI view hosted in our React Native screen, drawn by SwiftUI, not by our `Button`. Whether the picker can be presented from our own control without its label button is UNVERIFIED. Consequences: a hosted SwiftUI button cannot join the `GlassContainer` of A2 (UNVERIFIED), and it scales type with the system's fonts, not our Mukta ramp.
Also: NS-49 section 3 puts "Pick from recent days" inside the picture start. On builds where level 2 is on, the one-tap level 1 start becomes two taps. NS-49 "Not in scope" bans a fourth start button, and IA-AUDIT 6 says one control.
Change (new row NS-49-R28, P1): "Given level 2 is available, Then Start from a photo opens an anchored menu (N6) with two items, 'Choose a photo' (PHPicker as built) and 'Pick from recent days'; where level 2 is unavailable (17.0, 17.1, flag off, Android, Expo Go) the button opens the picker directly, as today (absent rule); the VoiceOver hint changes with it ('Opens choices' or 'Opens your photos'). If the spike shows the suggestions picker can only be opened by its own label button, the menu is replaced by an N7 `fit` sheet that holds both choices, the second being the hosted button, and that sheet keeps the 44 pt, AX5 and VoiceOver rules." The extra tap is a cost to the founder's 'first-class picture start'; see question Q-DS-1.

**F49-2 (P1). Cancel and empty are likely invisible to the app; R11 and A-S03 `suggestions.empty` cannot be built as written.**
Evidence: the documented initialisers expose `onCompletion` only, called after a person selects a suggestion. No cancel or empty callback is documented on that page (UNVERIFIED that none exists elsewhere). R11 requires "a 'Pick a photo instead' path to level 1 in the same sheet" and A-S03 draws an `empty` state offering it; neither can happen inside Apple's sheet.
Change: R11 reads: "Given the parent cancels, declines Apple's first-use sheet, has Journaling Suggestions off, or the list is empty, Then the app learns nothing and does nothing: Home as before, no draft, 0 files, no message; level 1 stays one tap away in the menu of NS-49-R28." Remove the `suggestions.empty` state from A-S03; keep `suggestions.noPhoto`, which is observable (a chosen suggestion with no photo item).

**F49-3 (P1). A-S16 one-photo sheet has no spec.**
Change (new row NS-49-R29, P1): "Given a suggestion with several photos, Then A-S16 is an N7 sheet titled by `content`, thumbnails in a grid of `PhotoFrame` (C3), each at least 96 pt square and a button whose tap chooses it and closes the sheet; at AX5 one column; VoiceOver labels are 'Picture 1 of 4' (we never describe a picture, no scene or person words); Voice Control 'Tap Picture 2'; `accessibilityIgnoresInvertColors` on every thumbnail (NS-33-R11); swipe down and the escape gesture close it and choose nothing; nothing is stored until a choice; no glass inside the sheet (N7 rule); placeholder via `m.fade` after `loading.placeholderAfterMs`, never a spinner loop." Test `[NS-49-R29] one-photo sheet works with assistive settings`.

**F49-4 (P1). The phone's label.**
Evidence: R9 and A-S04 `suggestionLabel`: an editable label "marked in the design as from the phone".
Change: "marked" is words and a glyph, not colour: a leading decorative glyph and the content key `label.fromPhone` as a visible prefix or caption; VoiceOver reads "From your phone: {title}"; a Clear button of 44 pt; writing tools off (D2); wraps at AX5. Question for Karma (P2): once kept into `photo_text` the marker disappears and Apple's text reads as the parent's own words; is that acceptable under the constitution reading? Not my lens to rule; flagged.

**F49-5 (P2). Wording of R1.** "One of the equal starts ... no larger than Speak" and FR-OPP-02's "first-class" do not match COMPONENTS A2 and A4, which draw Start from a photo as a quiet `sm` capsule, third, never larger. Reword R1: "a third start in the cluster, smaller than Speak and Type"; otherwise a tester reads "equal" and files a defect against the correct design. NS-49 section 23's default already says this.

**F49-6 (P2). `journalNote` in D-S06.** The one calm line that Apple's journal suggestions are separate is a static footer under the reminders list, not an F2 SystemLine (F2 is system conditions; at most one per screen).

## 8. Cross-card findings

**F-X1 (P1). The new screens are not in the accessibility screen set.**
Evidence: NS-33-R4, R7, R16 name Home, Review, the Book and the letter page; quality Annex C.2 runs "every screen in Annex B.3"; a search of `quality.md` finds no C-S24, C-S25, C-S26 or A-S16. NS-46-R26, NS-47-R25 and NS-49-R17 each write their own row, which is good, but they are not wired to the gates.
Change: add C-S24, C-S25, C-S26, A-S16, A-S01 `dayToday` and `daysAsk`, D-S06 day-name states and the D-S06 preview to Annex B.3, to NS-33-R16's XCUITest set at AX5, and to the P2 device pass (AX5 with Bold Text on an SE 3). New backlog rows needed (no ids invented).

**F-X2 (P1). Token and component gaps these cards need (standing duty 2).**
- `layout.rowMin` 52 and `target.md` 48 are still open name requests to FOUNDATIONS (COMPONENTS section 9); Browse rows, the ask buttons and the Days rows depend on them.
- New shared `DoorNote` (F47-1); I4 `multi` variant (F47-3); `optional` slot on I1 (F47-2); C9 variants `daySlip` and `askSlip` (below).
- No new colour, no new type token, no new motion primitive: everything above uses `text`, `textMuted`, `surface`, `surfaceRaised`, `callout`, `footnote`, `m.select`, `m.enter.group`, `m.list.remove`, `m.fade`, `H-select`. `textMuted` is 4.75:1 or better on the surfaces in every scheme per FOUNDATIONS (quoted, not recomputed).

**C9 text to add to COMPONENTS (for design-systems to apply; not edited here):** variants `daySlip` (rank 2b: name and line, one dismiss button, label and action per NS-50-R13) and `askSlip` (rank 2c: question, short call-out, two equal `bordered` buttons stacked, capped at two showings); the order as data: 1 waiting set, 2 seal-opened, 2b day, 3 Save a copy, 2c ask (my rank, see F47-7), 4 past letter; at most one renders; absent means no space kept; the Home glass budget is unchanged (all content layer: tab bar and cluster stay the only glass).

## 9. Liquid Glass and material check (BRIEF section 3)

- C-S24, C-S26, the slips and the call-out are content layer; no glass. Home stays at tab bar plus capture cluster plus one transient.
- C-S25 and A-S16 are N7 sheets: the sheet is the glass; the buttons and rows inside are `plain`, `bordered`, `filled`; "Done" may be the sheet's one tinted element (rule 9). No glass toast over a sheet for a tick (F46-5).
- Reduce Transparency, Increase Contrast, iOS before 26: all new surfaces are solid already; the sheets fall back to the system solid sheet (N7).
- The hosted SwiftUI picker button (F49-1) is outside our material rules; it follows system settings, which is acceptable, but it must be checked under Reduce Transparency and AX5 on a device.

## 10. What is good enough to leave alone

- NS-46-R2, R16, R17, R19: nothing ticked, quiet days quiet, voice rules, never says a day is missing.
- NS-46-R15: "no date means no guess" line with no count, warning style or badge.
- NS-47-R21: "Clear all" as an F6 `explained` sheet (safe choice default, destructive as text with the trash icon).
- NS-47-R12, R13, R15, R16: the lock-screen and clearing rules; not a design-systems matter.
- NS-47-R25's equal-weight "Not now" intent (the wording needs F47-4 and F50-4, not removal).
- NS-48-R2, R10, R11, R24: volume unchanged, string length and rule limits, no class added.
- NS-49-R5: absent, not greyed, where the choice cannot work (matches COMPONENTS 1.2).
- NS-49-R6, R10, R25: no permission, photos only, level 3 closed.
- NS-50-R2, R10, R11: only today, never a count, never a picture slip.
- NS-50-R7 "no haptic" on dismissal (matches MOTION section 9).
- NS-50-R8 and R9: quiet book shows nothing; blank switcher snapshot (E18).
- No-strip ruling R-IA-3 and the single registry (BL-963).
- "Not in scope" lists: they close the feed, count and pre-tick doors.

## 11. Proposed new rows (collected)

| Id | Priority | Given, When, Then | Test title |
|---|---|---|---|
| NS-46-R29 | P1 | Given the library store cannot be read, Then typed days still show and one in-place line with Try again shows in the library section only | `[NS-46-R29] failed read leaves typed days` |
| NS-46-R30 | P1 | Given Browse, Then rows use I4 `multi` (checkbox role, check shape and weight, date line, no select-all, no truncation at AX5), headings are rotor headings, the sheet closes by Done, swipe or escape alike | `[NS-46-R30] browse rows and exits` |
| NS-47-R28 | P0 (a) if counsel treats the call-out as a promise, else P1 | Given the ask, C-S25 and C-S24, Then the call-out is a static `DoorNote` in `callout` `text`, first in reading order, never collapsed or dismissible | `[NS-47-R28] call-out visible and first` |
| NS-47-R29 | P1 | Given any optional question, Then "Optional" is a word beside the label, VoiceOver says "optional", decline matches accept in style and size, nothing preselected | `[NS-47-R29] optional pattern` |
| NS-47-R30 | P1 | Given the ask shown on two opens unanswered, Then it retires to Me | `[NS-47-R30] ask capped at two showings` |
| NS-47-R31 | P1 | Given the ask slip, Then two same-style `bordered` buttons stacked; SE 3 default size keeps the prompt visible or the ask sits below it | `[NS-47-R31] ask slip equal weight and budget` |
| NS-48-R28 | P2 | Given D-S06 preview at AX5 with Bold Text, Then it wraps, one element "Example", neutral when names are off | `[NS-48-R28] preview accessible` |
| NS-49-R28 | P1 | Given level 2 on, Then Start from a photo opens an anchored menu with two items; otherwise the picker directly; hint changes | `[NS-49-R28] entry control by availability` |
| NS-49-R29 | P1 | Given a multi-photo suggestion, Then A-S16 meets the sheet contract above | `[NS-49-R29] one-photo sheet accessible` |
| NS-50-R13 | P1 | Given the day slip, Then one non-interactive element with a custom action and a separate 44 pt dismiss button | `[NS-50-R13] day slip anatomy` |
| NS-50-R14 | P1 | Given a quiet day, Then Home shows the quiet line and no question and no ordinary prompt (pending Q-DS-2) | `[NS-50-R14] quiet day home` |

Changed rows: NS-46-R13 (quiet-day prompt), NS-46-R26 (row contract), NS-47-R21 (one tap wording), NS-47-R25 and NS-46-R26 ("flat" defined), NS-49-R1 (third start), NS-49-R11 (no cancel signal), NS-50-R4 (one placement), NS-50-R7 (hints), NS-50-R12 (P1, normal motion), NS-33-R4, R7, R16 and Annex B.3 (screen set).
Engineering: backlog rows needed (no id above BL-999 invented): `DoorNote` component; I4 `multi` and I1 `optional`; C9 `daySlip` and `askSlip` with the order as data (extends BL-963 and COMPONENTS R11); `target.md` and `layout.rowMin` tokens (DS2-02); picker hosting spike (can the suggestions picker be presented without its label; does a hosted SwiftUI view join a glass container); XCUITest screen set update.

## 12. Verdict per card

- **NS-46: CHANGES.** F46-1, F46-2, F46-5, F47-3 (as NS-46-R30), F47-4, F47-5; P2: F46-3, F46-4, F46-6; quiet-day prompt (F50-5) in R13.
- **NS-47: CHANGES.** F47-1 call-out component and placement, F47-2 optional pattern, F47-6 switch location, F47-7 ask lifecycle and rank, F47-4 sheet exit, F50-4 equal weight and height; P2: F47-8.
- **NS-48: PASS.** One P2 row (NS-48-R28).
- **NS-49: CHANGES.** F49-1 entry control and extra tap, F49-2 cancel and empty cannot be observed, F49-3 A-S16 spec, F49-4 label marking; P2: F49-5, F49-6.
- **NS-50: CHANGES.** F50-1 one placement, F50-2 anatomy and VoiceOver, F50-3 "Not now" meaning, F50-5 quiet day, F50-6 motion; P2: F50-7. Cross-card: F-X1 and F-X2.

## 13. Questions for the founder (each with a default)

- **Q-DS-1.** On iOS 17.2 and later, tapping Start from a photo opens a two-item menu (Choose a photo, Pick from recent days), adding one tap to the picture start. Accept? Default: yes, menu only where level 2 exists; otherwise the button opens the picker directly. Alternative: a separate small control, which NS-49 calls a fourth start.
- **Q-DS-2.** On a quiet day (Memorial Day, Veterans Day), does Home show an ordinary prompt under the quiet line? Default: no; the quiet line replaces the prompt block, Speak and Type stay.
- **Q-DS-3.** Ask slip rank and cap. Default: after Save a copy and before the past letter, retired after two unanswered showings.
- **Q-DS-4.** Day-name switch on the Days page rather than Reminders. Default: Days page.
- **Q-DS-5.** The day slip also shows when the parent arrives by tapping the 09:00 note. Default: yes, one slip, one place (NS-50-R4 changed).
- **Q-DS-6.** Is the call-out (NS-47) treated as a promise, which makes NS-47-R28 P0 (a)? Default: yes, because R22 already ties each sentence to a claims row.

## 14. What I did not verify

Contrast ratios are quoted from FOUNDATIONS, not recomputed. Slip heights on an SE 3 are my arithmetic, not a measurement. Whether Apple's suggestions picker has a cancel or empty callback, can be presented without its label button, or can be hosted next to a glass container is UNVERIFIED. WCAG 3.3.2 was not re-read. I did not read the code, `WORDS.md`, `AUDIT.md` or `tokens.v2.json`, and I changed no design-system file.
