# NS-53 Moments tab: executive review of the hybrid picker design, Design (CDesO)

Reviewer: Chief Design Officer (Claude role). Date: 21 Nov 2026.
Reviewed: `docs/product/moments-tab/HYBRID-PICKER-DELTA.md` on `wip/moments-picker-delta` (head a84f448c7f75480b629000b7997d8c4f18652e2b); the spec `docs/product/prd/28-moments-tab.md` on `wip/moments-prd` (head 1c1e05bc2f1dabc294a4b87aefca9035838f6fe7); the earlier design review `docs/product/moments-tab/exec-review/design.md` on `wip/moments-review-design`; the council protocol `docs/agents/exec/COUNCIL.md` and the role skill `.claude/skills/early-letters-design/SKILL.md`, both read in full from `develop` (8d0be681).
Rulings that stand and are accepted as given: library read ships in the first release; places and occasions in; faces and people out (O-30); the machine never writes the parent's words.

## Verdict: ACCEPT-WITH-CHANGES

The hybrid is the right shape for the customer. It gives the parent proactive cards from our own surfaces and a native, familiar way to browse for anything else, and it turns the no-permission state from a dead end into a working door. I would rather ship this than the album chooser and grid we would otherwise build. It will not yet feel like one product, for four reasons the delta names only partly: the picker's own chrome decides whether Albums, Options and Cancel are even reachable; the first-run order shows a parent two different privacy explanations that disagree in tone; selection looks one way in our day sheet and another way in Apple's grid; and the delta scopes Apple's UI out of the accessibility bar (G5) when a task a parent must finish runs through it.

Counts: 0 BLOCKER, 8 MAJOR, 8 MINOR (16 findings, EXH-DES-1 to EXH-DES-16). No BLOCKER because nothing here makes the tab unshippable; but EXH-DES-1 and EXH-DES-4 are gates: NEW-3 must not merge, and no accessibility label may be declared for this surface, until their device evidence exists.

Conditions:
1. G1a answers the picker unknowns that decide layout (EXH-DES-1, EXH-DES-12) before the host sheet is built; section 5 gives the two layouts that follow from the answer.
2. One sheet, one tray, one Start for both bodies (our day tiles and Apple's picker), per section 4 (EXH-DES-2, EXH-DES-5).
3. The first-run copy for the picker and the library ask is written together by `content` with the privacy chief before either ships (EXH-DES-3).
4. G5 counts task completion through the picker as a pass bar (EXH-DES-4).

## What I read and what I did not

Read in full: the delta (235 lines), the council protocol, the design skill, the earlier design review, and the PRD sections on states (8.1), layout (14.1), motion (14.2), accessibility (15) and the rows R144 to R158, R208, R212, R217, R218 (round 1 rows folded into the PRD head). Read through a page summary, not a full transcript: Apple's WWDC23 session 10107, "Embed the Photos picker in your app" (https://developer.apple.com/videos/play/wwdc2023/10107/, read 21 Nov 2026). That summary gave me: `.photosPickerStyle(.inline)` and `.compact`; `selectionBehavior .continuous`; `photosPickerAccessoryVisibility` hides "the UI around the picker content" (top is the navigation bar, bottom is the toolbar on iOS); `photosPickerDisabledCapabilities` for search, collection navigation (the Albums tab), the staging area and selection actions; an onboarding UI the first time an embedded picker appears; a privacy badge; an Options menu that can strip location, "not supported ... for apps with full library access"; a fixed height and `.ignoresSafeArea` in the demo; and the line that the app "can't access the picker directly and not even take screenshots of the picker content". The same summary says the session does not mention Dynamic Type or VoiceOver.

NOT read: the PHPickerViewController, PHPickerConfiguration and PhotosPicker reference pages (the SwiftUI reference page would not render for me), the App Review Guidelines, the Human Interface Guidelines on this picker, the Q&A session 111480, `DESIGN_LANGUAGE.md` and `tokens.ts` in full (I checked only that `mediaFrame` and `swapMs` (150) exist). NOT run: nothing was opened on a phone, a simulator or in VoiceOver by me. Every statement below about what Apple's picker does at AX5, under VoiceOver, with Reduce Motion, in dark mode, with App lock, or when a bar is hidden is UNVERIFIED and is marked so. Standards named as Apple's or WCAG's come from the skill's own list, read this session, not re-fetched.

Not found: `docs/product/moments-tab/MARKET-BENCHMARK.md` on `wip/moments-benchmark` and `PICKER-ROUTE-FEASIBILITY.md` on `wip/moments-picker-feasibility`. Neither branch exists on `origin`. I could not read them, and nothing below leans on them. Note that the app is React Native (Expo): "the picker inline" means a native view hosted by a module in `scribe-photo`, and every SwiftUI or UIKit detail above is a statement about that native layer, not about our JavaScript.

The person I design for in every finding: a tired parent at 9:40 at night with one thumb; a grandparent at AX5 with Bold Text on an iPhone SE 3; a VoiceOver parent; a parent who said no to the library and still wants to add a picture.

## Answers to the delta's Q1 to Q5

**Q1. Where does the inline picker live: tab body or a sheet?** In a full-height sheet, in every state. RULED as a layout inside shipped scope (skill section 4); the CPO is consulted and the delta's own recommendation is the same. Reasons, each a customer reason: Apple's first-time onboarding and privacy badge appear inside the picker and cannot take our words or our type, and on the tab they would sit among the cards we want a parent to read; a body-level picker competes with For you for the same thumb; and a sheet gives us a frame (heading, tray, Start, Not now) that makes the Apple view read as a window we opened, not a screen we failed to design. Conditions: the sheet is the existing route `moments/pick` with two bodies, not a second stacked sheet (EXH-DES-2); the compact style is not used on the tab (it would also bring Apple's onboarding into the body); and the sheet's swipe-down dismissal is off while anything is chosen, with a visible Not now always present (rule 3 of `DESIGN_LANGUAGE.md` section 11 and R150: a button for every gesture, and a swipe that can lose a parent's choices is not safe).

**Q2. Drop the album chooser (R57) and "Leave out this picture" (R56) now?** Yes to both, with one condition and one admission. Condition: the album drop is sound only if Albums stays reachable in Apple's picker once we hide its bars (EXH-DES-1); if G1a shows it is not, R57 is not replaced and the delta's closing of O-14 is premature. Admission: in my first review (EX-DES-7) I asked to keep "Leave out this picture" inside the day sheet. I now withdraw that. The delta's reasoning is better than mine: the control stores an identifier class for a picture-level effect, it was already default-off (R247), and the harm case I cared about (a collage lead picture that hurts on a card) is covered by "Not this one", which hides the whole day and must stay one tap in the card menu, including on Recent cards. Keep the AX label for that verb a result ("Never show this day"), not a mechanism.

**Q3. For a picture the parent picks, a date chip only, or also a place?** Date chip only. It is the customer-safe answer: a place derived from a file the parent chose is the app guessing about a picture it was not asked to look at, and the delta correctly notes it re-opens the location questions for a path that needs none. Design conditions: the chip is offered and never preselected (R95); it reads as the picture's date and cannot be mistaken for the memory's date, so its words come from `content` with that distinction; screenshots and edited files with no usable date show no chip and no apology line; and a date read from a picked file never renames or moves anything on the tab.

**Q4. Defer the viewer (PR 20) for 1.0?** Defer, on three conditions. (a) From AX1 the day sheet's tiles go to one column at full width (EX-DES-5 in my first review), which makes each tile large enough to judge by itself; for the grandparent at AX5 that is the viewer. (b) The letter page keeps its own viewing (R101), and capture shows the chosen pictures at size, so no parent is asked to keep a letter around a picture they never saw large. (c) G4 adds one task, "choose the best of several near-identical pictures from one day"; if parents fail it, a no-zoom viewer returns in 1.1, not a pinch and pan one. Opinion, not standard: a viewer is the first thing a parent reaches for when a day has eight pictures of one smile; Apple's picker shows its own previews, which is a second reason the browse path does not need ours. UNVERIFIED how Apple's picker previews a pick in multi-select; G1a records it.

**Q5. The picker door ships under F1 alone, so a failed library gate never removes it?** Yes. It is the one action on the tab that needs no permission, no purpose string and no gate, and a tab that loses its only working action when a legal gate slips is the failure the delta's section 9 describes. Design conditions: one host sheet component serves the tab door, the day sheet's "Choose other pictures" and the capture "Add" so there is one picker presentation in the product (EXH-DES-2); the door is present in every access state and in the flag-off state, with the hierarchy of EXH-DES-6; and the door has its own kill switch only through the existing photos switch (R106, R170), never through `photoMoments`.

## Findings

Format: id, severity, requirement or delta ids, finding, evidence, change. Severity as in the first review: BLOCKER (cannot ship as drawn), MAJOR (fix before G4 and G5 run), MINOR.

### MAJOR

**EXH-DES-1. MAJOR. Delta section 1, NEW-3, R57, R75.**
Finding: The delta wants three things at once from Apple's picker: our own Start and Cancel (so Apple's add bar is hidden), Albums as the replacement for our album chooser, and the Options menu where a parent can strip location. Apple describes `photosPickerAccessoryVisibility` as hiding the UI around the picker content, with the navigation bar on top and the toolbar at the bottom. I do not know which of Albums, Options, Cancel and Add live in which bar, or whether hiding a bar also removes the privacy badge or the onboarding. If hiding the bars removes Albums or Options, the plan to retire the album chooser and the parent's location-strip control both fail silently: nothing crashes, a control is just gone. Albums can be kept with the collection-navigation capability left on, but that is a different switch from the bars.
Evidence: WWDC23 10107 summary (bars, `disabledCapabilities`); the delta's own G1a list (a to g) does not ask which controls survive a hidden bar. UNVERIFIED on device.
Change: add to G1a a matrix, run on iOS 17 and the newest OS available, under None, Limited and Full access, in light and dark: for each of {bars shown, top bar hidden, bottom bar hidden, both hidden}, record whether Albums, search, Options, Cancel, Add, the privacy badge and the onboarding are reachable. Then pick the layout: Layout A (both bars hidden) only if Albums and Options stay reachable; otherwise Layout B (section 5: Apple's top bar shown, bottom hidden, our tray beneath). Never hide the Options menu: it is the parent's own privacy control and it is Apple's.

**EXH-DES-2. MAJOR. R85, R88, R186, NEW-2, NEW-3, NEW-4, R90.**
Finding: Two bodies would show selection in two languages in one flow. Our day sheet uses ring, check and spoken state (R90); Apple's picker draws its own marks, and the delta notes it can draw selection numbers and badges we cannot remove. A parent who picks two on Saturday's tiles, taps "Choose other pictures", and then sees a numbered grid will not know whether the first two still count. A stacked second full-height sheet over the day sheet over the tab, then capture over all of it, is also a deep modal stack for a tired thumb.
Evidence: R90, R186 (new row "Choose other pictures"), NEW-4; the delta's own new-risk list (a style break; selection numbers).
Change: (1) One route, `moments/pick`, with a shared frame: our heading, our tray, our Start, our Not now. The body is either our day tiles or Apple's picker. The body swap is a cross-fade at `swapMs` (150 ms; Reduce Motion plain), never a second sheet. (2) The tray is ours and sits above Start in both bodies. It holds small still thumbnails of what is chosen, decorative to VoiceOver, grouped as one element named for what it holds ("Pictures chosen for this letter", content's words), with no count text, no number and no control over a thumbnail (R208). It is not interactive in v1: a parent puts a picture back in the body where they chose it. If G1a shows thumbnails of picked items cost too much memory or iCloud time on an SE 3 (G1a f, g), the fallback is a tray with no thumbnails, only the Start control and the one calm limit line. (3) Ask for continuous selection without ordering (the ordered variant is the one that numbers picks; UNVERIFIED, not read in the API reference this session); order is by time by our rule R90, not by tap order. (4) Union rule: Start takes everything chosen in both bodies, within the 6 picture and 2 video limits of R90 across both. Whether a picture chosen in both bodies can be told from a duplicate is UNVERIFIED (a picked item has no stable identifier without the library configuration); if it cannot, accept a duplicate and let capture's existing delete handle it, and say so in the spec. (5) When Apple's picker is re-shown after we hid it, its own highlighted picks may reset (UNVERIFIED). The rule that works whatever G1a finds: our tray is the truth; if Apple's grid cannot show prior picks, the tray still does.

**EXH-DES-3. MAJOR. R70, R72, R74, R80, NEW-5; PRIV-R21.**
Finding: A parent can meet two different explanations of what we may see, in the wrong order. Apple's embedded-picker onboarding says, in Apple's words, that the app can only access the photos selected. Later our ask card and primer say this app can read the library to suggest days. Both are true (different features) and Apple's first statement will be the one the parent remembers. A parent who opened "Choose pictures" first, saw "only selected photos", and was then asked for the library will reasonably feel misled by the second ask, and the delta's own principle (the picker is not a permission request, R70) does not repair that feeling. The privacy badge adds a third voice we cannot edit. This is a trust question, not a style question.
Evidence: WWDC23 10107 summary (onboarding at first show; badge); R71 to R74; the first-run table in section 11 of the PRD.
Change: (1) `content` and the privacy chief write the picker host heading, the primer and the ask card as one set in one sitting, so that the picker's door says what choosing does (only the pictures you choose) and the library ask says what reading does (days from this phone, kept on it), each in the other's presence. The structure is mine, the words are content's, and any line that changes what we promise on screen is a founder matter (skill section 5). (2) Never place our own explanatory copy above or beside Apple's onboarding; our frame stays quiet (heading, Not now) so Apple's panel is not buried or contradicted. (3) Order for a first-run parent: opening the picker first is allowed and never triggers our primer; a later ask is never described as more access to "pictures you choose". (4) G4 task: after using the picker once, taps the ask card, and is asked what they expect it to do; a wrong expectation is a content or order fix before ship. (5) Counsel and the privacy chief confirm that our primer plus Apple's onboarding together are not a misleading pair; I did not research that and it is not a design judgement.

**EXH-DES-4. MAJOR. Delta G5, NEW-6, R153, R155, R156, R157.**
Finding: The delta moves Apple's picker "outside G5 and G6", records Apple's behaviour at AX5 and VoiceOver "as an observation, not a pass bar". For Apple's pixels that is right: we cannot change them. For our promise it is not. The task "start a letter from a picture" now runs through Apple's grid for every parent who declined or limited access, which is exactly the parent who most needs it to work. LEGAL-REQ-051 and Apple's own accessibility labels (skill section 8) turn on completing the common tasks with a feature on; a label we declare for Larger Text or VoiceOver is false if a parent at AX5 cannot start a letter from a picture. The WWDC summary I read is silent on both, so I have no evidence either way (UNVERIFIED).
Change: G5 splits into two. (a) Our frame (heading, tray, Start, Not now, door, body swap) is a pass bar like every screen. (b) Task completion through the picker is a pass bar too: on an SE 3 at AX5 with Bold Text, a VoiceOver parent, a Voice Control parent and a Switch Control parent can choose a picture, see that it is chosen, remove it, and press Start, using Apple's controls and ours. The record is a device walk, run by the founder or a device operator, in `DEVICE_TEST_PLAN.md`. If task completion fails through Apple's picker, the recorded outcome is "no Larger Text or VoiceOver claim for starting from a picture until fixed", and the one honest escape is that a letter never needs a picture: Talk and Write stay available from the same sheet. Public accessibility claims stay the founder's (skill section 5); I am not changing one, only refusing to let this release imply one.

**EXH-DES-5. MAJOR. R153, R156, NEW-4; skill sections 1 and 8.**
Finding: At AX5 our frame can eat the screen. The Apple picker has a fixed or constrained height (the demo set a height with a frame modifier), our heading wraps at the largest sizes, the tray adds a row, Start is at least 56 pt, and Not now needs 44 pt. On an SE 3 the picker, which is the one thing the parent came to use, could end up the smallest block on the screen. My first review measured AX5 body at 3.571x, about 10 characters a line at 64 pt on that phone.
Evidence: A11Y audit figures quoted in my first review (EX-DES-5); WWDC23 10107 summary (fixed height, safe-area handling).
Change: Specify the frame at AX1 and above. The heading is one line in the sheet's own title position, capped by the existing `maxScale` token system, never wrapping to two lines of body size. Not now is a text control in the sheet's corner at 44 pt minimum (the existing target rule), so it leaves the foot. The foot is one row: the tray thumbnails (fixed size, not scaled with text) and the Start control only. A PROPOSED bar, to be tuned at G1a and not a measured number: at AX5 on an SE 3 the Apple picker keeps at least as much of the screen as our frame, and the parent can reach Start with one hand without scrolling the frame. If that fails, the tray collapses into the Start control (the no-thumbnail fallback of EXH-DES-2). Interactive dismissal is off while anything is chosen; a close button is always on screen.

**EXH-DES-6. MAJOR. R69, R75, R76, R79, NEW-2, R186; skill section 7 (count the targets).**
Finding: The door adds a second action to states that were deliberately sparse, and its label sits next to near-twins. ACC-1 was "one small row ... nothing else" and is now two rows about pictures. ACC-3 already has "Choose which pictures" (opens Apple's limited-library manager); the delta adds "Choose other pictures" (opens the picker); the capture screen has "Add pictures". Three labels, two different effects, one word apart. A tired parent will tap the wrong one, and the Limited manager is a real system screen that is hard to leave.
Evidence: PRD 8.1 (ACC-1, ACC-3); delta rows R69, R75, R76, R79, R186.
Change: hierarchy and labels as design requirements, wording as content's. (1) The working door is the primary quiet row in ACC-0 (below the ask card, not beside it), ACC-1, ACC-4, ACC-5 and flag-off; in ACC-1 the re-ask row follows it at the same weight and never above it, so the first thing a parent who said no sees is something that works. (2) In ACC-4 the picker door is the first row and "Open Settings" the second; both are text rows, neither is a filled button, and no row is red. (3) In ACC-2 the door sits at the foot of Recent, and its real value is stated honestly in G4: pictures older than the Recent window (such as first-week pictures) that no card will ever surface. (4) In ACC-3 the two foot controls are visibly different kinds: the limited-library control stays as spec; the picker door uses the same label family as every other picker door in the product. No two adjacent labels may differ by a single word; G4 includes a task that tells the two apart on a screenshot. (5) One verb family for the door everywhere (tab, day sheet, capture), so the delta's three variants become one.

**EXH-DES-7. MAJOR. R86, NEW-4, NEW-7, G7 (App lock during a pick).**
Finding: The picker draws the parent's pictures on top of our app from another process. We cannot screenshot it (Apple says so), so we may not be able to cover it with our own snapshot cover either, and the app switcher or a borrowed phone could show a baby's pictures from a locked or backgrounded app. I do not know what the system does with an out-of-process picker in the app-switcher snapshot (UNVERIFIED). The delta says the sheet "cannot be open under App lock or inactive"; dismissing on every inactive event is worse for the parent: a notification pull-down or a phone call would throw away the picks.
Change: two behaviours, tested at G7 before NEW-3 ships. On inactive or background: our own paper cover over the sheet, with picks held in memory (the tray's truth, EXH-DES-2), restored when the app is active again. On App lock engaging or a timeout: the sheet closes, picks are discarded, temp copies removed (NEW-7), and nothing of the picked set is written to disk by the lock path. If G7 shows the cover cannot hide Apple's view in the app switcher, the fallback is to dismiss the sheet on background, accept the lost picks, and say so in the spec; a leaked picture is the worse failure.

**EXH-DES-8. MAJOR. R157, R208, NEW-6, G4, G5.**
Finding: The delta scopes R157 and R208 to our surfaces and lists what we cannot style, and that is honest and right. It under-weights the cost to the customer. The parent sees one app. Apple's grid will carry Apple's typefaces, Apple's blue and checkmarks, video durations drawn over thumbnails, the privacy badge and, if the bars show, Apple's bars, inside our paper-and-glass sheet. "Quiet UI, loud letters" will not hold in that body, and the rule that nothing sits over a photo will be broken by a thing we ship. This is a standard call, not taste: Apple's pattern wins here (skill section 3, D-051); the design problem is the seam, not the pattern.
Change: (1) Treat the seam as the thing to design: the host frame gives the picker a quiet paper surround, the existing page margin on its sides (no invented number), the existing `mediaFrame` hairline where the body meets our frame, and a rounded clip if G1a shows a clip does not crop the badge or onboarding (UNVERIFIED; never crop Apple's badge). (2) Our heading and tray state the sheet is ours; we never imitate Apple's styles inside our parts (no blue, no numbered badges of our own). (3) G4 adds a task and a bar: after the parent has used the picker, ask whether it felt like part of this app or a different one; PROPOSED bar, in the PRD's own x of n form on the five parents' own phones: none says it felt like a different app or hesitates before tapping. If more than that, the fix is the frame, not a restyle of Apple's view, which we cannot do. (4) State in NEW-6 that the exception is one object (Apple's picker view) and not a licence for our own overlays over a photo.

### MINOR

**EXH-DES-9. MINOR. R160, R186, vocabulary (CLAUDE.md two vocabularies).**
Finding: The delta's own confirm control is "Start", and the host sheet also carries our Not now. In the product "Keep" is the save of a letter, and "Not now" is the equal-weight refusal on the primer (R71). Re-using Keep for the picker's confirm would teach a parent that Keep means choose; re-using the primer's Not now with a different effect (it discards picks) is fine only if it is the same word with the same weight.
Change: the picker's confirm is Start, never Keep; Not now is the same control weight as Start in size and reach (target size, not colour: Start filled, Not now text, both 44 pt or larger, Start at least 56 pt). Not now discards the picks without a confirmation dialog: the parent has chosen nothing that is saved, and a dialog would be a nag.

**EXH-DES-10. MINOR. R144, R145, R146; delta NEW-5.**
Finding: The motion between For you cards and the picker is not described. Cards open the day sheet with the platform's modal rise (R85); the picker door must do the same.
Change: all three entries (card, door, capture Add) use the platform's modal rise; while Apple's view starts up, show a still paper placeholder in our frame, no spinner, no shimmer (A1-R12), and never animate or transform Apple's view itself (scaling a remote view may misrender; UNVERIFIED). The body swap is the 150 ms cross-fade of EXH-DES-2. Start closes the sheet and opens capture in sequence, never both at once: the picks live in the tray until capture has them. Reduce Motion gives a plain fade; Apple's own motion, haptics and sounds inside the picker are Apple's and outside our motion budget (R144), named in NEW-6.

**EXH-DES-11. MINOR. R157, R217; skill section 4.**
Finding: Theme. The picker follows the system; the app has its own paper and dark treatment. A parent whose app theme and system theme disagree sees a white Apple grid in our dark sheet or the reverse. Increase Contrast and Reduce Transparency inside Apple's view are Apple's.
Change: the host sets the picker's interface style from our theme on presentation and on change (whether an out-of-process picker honours an override is UNVERIFIED: G1a records it in light, dark and with the app theme differing from the system). If it does not, the fallback is the frame only; do not paint a scrim to hide a mismatch.

**EXH-DES-12. MINOR. R90; WWDC23 10107 (selection limit).**
Finding: R90 says the 7th picture is refused with one calm line and no count. How Apple's picker shows a selection limit (greyed thumbnails, a silent refusal, a count in its bar) is not in what I read, and a visible count in Apple's bar would break our no-count rule without our being able to stop it, short of hiding the bar (EXH-DES-1).
Change: add to G1a: with `selectionLimit` set to the R90 limit, what does the picker show when the limit is reached, and does it show a count anywhere? Our tray says the limit once, in our words, in our frame, and the picker's own behaviour is recorded in NEW-6. If Apple shows a number only in a bar we can hide, hide it; if only in a place we cannot, the founder sees one fact: Apple's picker may show a number, ours never does.

**EXH-DES-13. MINOR. Delta section 1 (Full access, Options), R95, Q3.**
Finding: Under Full library access, Apple does not offer the location-strip option in the picker (the session text), so a picked file may carry location the parent cannot strip there. Our module reads only the date and strips everything else on attach (NS-01-R17), which is right. But the parent who looks for the Options menu under Full access will not find it, and nothing on screen explains why.
Change: no new explanation line on our frame (it would be the app talking about Apple's menu). Instead record in G1a (b) the exact Options behaviour per access state, and let the privacy chief decide whether the primer's Records or Never line needs a clause that the picture a parent attaches never carries location into the letter. The date chip stays the only derived value (NEW-1).

**EXH-DES-14. MINOR. R225, R189, G7; delta NEW-6.**
Finding: Our screenshot tests and Maestro flows cannot see inside Apple's view (the delta's inference; Apple's own line about screenshots supports it). A baseline that includes the picker is either blank or flaky.
Change: the L3 baseline for the host sheet is taken with the body replaced by a flat placeholder at the same size, so our frame (heading, tray, Start, Not now, spacing, AX5 layout) is baselined, and Apple's body is a named device row at G7 with a still photograph taken by the operator, for the record only. Store screenshots never include the picker body (they already hide the tab bar per R194; add this one rule), because Apple's UI in a store frame is a claim about Apple's product we do not control.

**EXH-DES-15. MINOR. R120, R147, section 11 first-run order.**
Finding: The first-run order now has a door that works with no permission. The earlier review (EX-DES-9) asked that the ask card never sit more than one card from the top at AX1 and above; a door row below it adds a second control above the examples.
Change: order the first open as: heading and job line; the real cards (question, age day, typed day); the ask card; the door row; then one example only (EX-DES-2 and EX-DES-9 of my first review stand). The door is the parent's first working action and sits within one screen of the ask at default size; at AX1 and above the ask is first and the door second, both before any example. R120's one-line addition ("the first thing a parent can do with no permission is pick pictures") is accepted.

**EXH-DES-16. MINOR. Delta section 9; R260, E2, E4.**
Finding: The delta is candid that the door is mostly discoverability, since capture already has a system picker. The design agrees, and adds a customer test the delta lacks: it can make the tab feel like a second Photos app. A parent could open Moments, see a picker, and reasonably ask why not use Photos.
Change: do not market the door as a feature in store words or onboarding; it is a safe floor (a working action in every state), which is a design decision, not a claim. The tab's reason to exist stays the cards (a day, a question, a prompt). G4 includes the question "what is this tab for?" before and after the picker task; if the answer shifts from "days to write about" to "choose pictures", the door has taken over the tab and its row weight goes down.

## 5. Recommended layout (text wireframes)

All of this is layout inside shipped scope (RULED, CDesO), subject to the G1a answers named above. Words in quotes are placeholders for `content`'s craft, not copy. No counts anywhere; nothing over a photo that is ours.

### 5.1 The host sheet, one route, two bodies, default text size (Layout A: Apple bars hidden)

Use Layout A only if G1a shows Albums and Options remain reachable with the bars hidden.

```
+------------------------------------------+
|  [Not now]        Choose pictures        |  our sheet title row, paper; Not now 44 pt
+------------------------------------------+
|  (paper surround, page margin on sides)  |
|  +--------------------------------------+|
|  |   APPLE'S INLINE PICKER (body)       ||  hairline = mediaFrame; rounded clip only if
|  |   thumbnails grid                    ||  the badge and onboarding are not cropped
|  |   [privacy badge, Apple's]           ||  Apple's: fonts, marks, search, Albums
|  |   first show: Apple's onboarding     ||
|  +--------------------------------------+|
|  a quiet text row (own body switch):     |
|  "This day's pictures"   <- body swap    |  only when opened from a day; cross-fade 150 ms
+------------------------------------------+
|  tray: [ ][ ][ ]  (still, fixed size)    |  decorative thumbnails; one VoiceOver group
|  one calm limit line, only when needed   |  our words, no number
|  [        Start        ]                 |  filled, at least 56 pt, bottom third
+------------------------------------------+
```

### 5.2 Layout B (Apple's top bar kept, bottom bar hidden)

Use if hiding both bars removes Albums or Options. The title row and Not now are ours as above; Apple's top bar sits inside the body and Apple's own Cancel is hidden or unreachable (as G1a shows); our Start and tray stay. If Apple's top bar carries its own Add that cannot be hidden, hide only the bottom bar and treat our Start as the primary control and Apple's Add as a second route to the same result (both end in one `AttachRequest`).

### 5.3 The same sheet at AX1 and above (SE 3 at AX5 with Bold Text)

```
+------------------------------------------+
|  [Not now]     Choose pictures (1 line)  |  title capped by existing maxScale token
+------------------------------------------+
|  APPLE'S PICKER (keeps most of the       |  PROPOSED: at least as much screen as
|  screen; Apple's type and AX behaviour,  |  our frame; tuned at G1a
|  recorded at G5 as a task walk)          |
+------------------------------------------+
|  [ ][ ][ ]    [   Start   ]              |  one row: fixed-size tray + Start
+------------------------------------------+
```
No gesture is needed to dismiss: Not now is on screen; swipe-down is off while anything is chosen.

### 5.4 The day body of the same sheet (our tiles)

```
+------------------------------------------+
|  [Not now]   Saturday 14 November        |  the day, our heading style
+------------------------------------------+
|  tiles at least 96 pt, ring + check +    |  our selection language; at AX1 and above one
|  spoken state; nothing over a photo      |  column at full width; durations per R208
|  except R208's two marks                 |
|  quiet text row: "Choose other pictures" |  body swap to Apple's picker; selection is kept
+------------------------------------------+
|  tray + one calm limit line + [ Start ]  |  the same tray and Start as 5.1
+------------------------------------------+
```

### 5.5 The tab, by access state (doors only; cards as spec)

```
ACC-0  heading + job line / real cards / [ask card] / door row / one example
ACC-1  real cards / door row (primary quiet) / "Show days from my pictures" (same weight, second)
ACC-2  For you + Recent / foot of Recent: door row (older pictures)
ACC-3  as ACC-2 on the chosen set / foot: limited-library control (Apple's manager) and the door,
       visibly different kinds, no two labels one word apart
ACC-4  real cards / door row first, "Open Settings" second; both text rows; nothing red
ACC-5  real cards / door row first / one plain line that it is off by a setting; no button
Flag off  as ACC-1 without the re-ask row; the door is the existing photos route (R106)
```

### 5.6 Motion map

Card tap, door tap, capture Add: platform modal rise into the one sheet. Apple's view starts up under a still paper placeholder. Day body to picker body and back: 150 ms cross-fade (`swapMs`), plain fade under Reduce Motion. Start: sheet closes, then capture rises; picks stay in the tray until capture holds them. Not now: sheet closes, picks and temp copies are dropped, nothing is announced. Apple's own motion inside its view is outside our budget (R144) and is named as such.

## 6. What we cannot style, in one list (for NEW-6)

UNVERIFIED unless noted. Apple's fonts and sizes; Apple's colours and selection marks; selection numbers (avoidable by not asking for ordered selection, UNVERIFIED); video duration marks drawn over thumbnails; grid column count and thumbnail size; the privacy badge (WWDC23 10107, read); the first-time onboarding words (read); the Options menu and its words (read); Apple's search, Albums and bar controls where they remain; Apple's motion and haptics; Apple's VoiceOver labels and Dynamic Type response (the session is silent on both; UNVERIFIED); Apple's behaviour under Increase Contrast and Reduce Transparency; and the picker's content cannot be read or captured by us (read). What we can style: everything around it (sheet, title row, tray, Start, Not now, surround, hairline, body swap, doors, tab states), and the one thing we must not do is imitate Apple's controls inside our own.

## Not findings (checked, holds)

- Putting the picker in a sheet and not the tab body is right on every ground I can name (Q1).
- Dropping R57 and R56 is right, subject to Albums being reachable (EXH-DES-1) and "Not this one" staying one tap.
- Date chip only, offered, never preselected, is right (Q3).
- Scoping R157 and R208 to our own surfaces is right; the exception must stay one object.
- The delta's own list of new risks is honest and complete enough that I added only the trust seam (EXH-DES-3), the task-completion bar (EXH-DES-4) and the frame (EXH-DES-5, EXH-DES-8).
- Constitution: nothing here writes, summarises or titles a parent's words, and a picked picture produces no card, reason, place or count (NEW-1).

## Device evidence needed (NEEDS EVIDENCE)

1. G1a matrix for EXH-DES-1 and EXH-DES-12: which controls survive each bar setting; what the limit looks like; whether a count shows. Run by the founder or a device operator on an SE 3 and the newest phone, iOS 17 and the newest OS available, under None, Limited and Full access, light and dark.
2. AX5 with Bold Text, VoiceOver, Voice Control and Switch Control: choose, see, remove, Start, through Apple's picker (EXH-DES-4, EXH-DES-5), recorded as a task walk.
3. App-switcher and App lock with the picker open (EXH-DES-7).
4. Theme mismatch (app dark, system light, and the reverse) and whether the picker honours an interface-style override (EXH-DES-11).
5. First-show onboarding and badge with and without our frame, in light, dark and at AX5, and whether a clip or inset crops either (EXH-DES-8).

## Counsel and others to consult

The privacy chief on EXH-DES-3 and EXH-DES-13 (what a parent is told, and in what order, when Apple's words and ours both appear). Counsel through the CLO on whether the pair of explanations misleads (EXH-DES-3 item 5); I did not research it. The CPO on the final shape of the tab doors and the cut list (Q2, Q4, Q5 are scope; my answers are the design view, not the decision). The accessibility audit LEGAL-REQ-051 calls for each year should list the picker host and the task walk in its brief.

Signed: Chief Design Officer (Claude role). Recorded as a review round for the hybrid delta; no ruling is made here, nothing in `DECISIONS.md` changes, and no founder-only matter is decided.
