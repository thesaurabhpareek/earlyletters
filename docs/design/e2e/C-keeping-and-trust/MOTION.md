# Area C. Keeping and trust: motion

Status: v1, 20 Nov 2026. Motion lead, area C. Keyed to the screen ids in `DESIGN.md` (C-S01 to C-S22, fixed in its skeleton of 20 Nov). Where `DESIGN.md` has not yet named a screen-specific state, this file proposes one in the form `C-Snn.<state>` and marks it PROPOSED STATE; the reconciliation pass renames to the design lead's names.
Prototype: `MOTION-PROTOTYPE.html` in this folder plays every item below on demand, with Reduce Motion, dark, a simulated VoiceOver, a simulated Switch Control and a slow-motion switch.

Sources read for this file (brief section 1, in order): cards `08-keeping-and-trust.md` (NS-08 to NS-12), `07-remaining-capability-rows.md` (C28), `11-foundations.md` (NS-33, NS-36), `10-reading-and-family.md` (NS-21, NS-22), `06-firsts-sealed-letter-quick-capture.md` (B25, D6 rows), `01-photo-with-a-letter.md` (R38a to R38c), `00-product-frame.md`; `14-test-plan.md` (J-N8, J-N15, J-N19, J-N20); `16-council-review-round-2.md` (T4, D1, D6, D7, D8, D12); backlog BL-942, BL-954, BL-973, BL-978, BL-984, BL-985; `/home/claude/review/eng/C-platform-quality-delivery.md` (ADR 0035 undo helper); `docs/design/MOTION.md` v0.2; `docs/design/SOUND.md`; `packages/design-tokens/src/tokens.ts` (`motion`); `apps/mobile/src/components/motion/*`, `components/ui/{toast,sheet,state-screen}.tsx`, `lib/haptics.shared.ts`; the built screens `app/settings/{account,export,erase,delete-account,recently-deleted,storage,backup}.tsx`, `app/settings/children/{[id],hidden,delete-book}.tsx`, `components/onboarding/new-phone-screens.tsx`, `app/(tabs)/book.tsx`.

Nothing here was run on a phone. Timings are the tokens'; feel is (opinion) until a device walk (BL-948).

## 1. The register for this area

Keeping is where a parent trusts us with the only copy of a voice. The motion here is a quiet clerk, not a performer.

1. **A receipt, never a show.** Every motion in this area confirms that something already happened (commit first, then move: house principle 3). Nothing celebrates a copy, a restore or an arrival.
2. **Serious things are still.** Erase, delete account, delete a book, remove a version, Erase now: the system alert or our confirmation sheet, the platform's own entrance, and nothing of ours. No shake, no red flash, no pulse on a destructive button, no hold-to-confirm ring, no crumple, shred, bin or fade-to-black.
3. **No countdown pressure.** No time remaining, no ticking, no shrinking bar on an Undo, no big percentage rolling up, no "x of y letters". Progress is a quiet bar and a sentence.
4. **Calm and quick.** Every item in this file finishes within 300 ms, except the inherited house motions named in section 3 (a spring's settle tail, the 8 s empty-state breath, the lamp), each of which the cards or the house allow and each of which stops under Reduce Motion.
5. **Controls never animate in** (house principle 2). Stop, Share, Try again, Undo, Remove now and every confirmation button are hittable from their first frame, even inside a block that fades.
6. **Pushes, alerts and the share sheet are the platform's.** Area C is mostly Settings pages: the native push, the system alert (`Alert.alert`), the system share sheet. We add opacity where a block of ours is replaced, and one list collapse.

## 2. Tokens used (copied from `packages/design-tokens/src/tokens.ts`, `motion`)

| Name in this file | Token | Value |
|---|---|---|
| fade | `fadeMs` (= `reduceMotion.durationMs`) | 200 ms, M3 standard easing `cubic-bezier(0.2, 0, 0, 1)` |
| exit | `exitMs` | 160 ms |
| enter | `enter` | opacity 0 to 1, y 8 to 0 pt, 280 ms, M3 standard |
| swap | `swapMs` | 150 ms cross-fade, words replaced in place |
| stagger | `staggerMs`, `staggerMax` | 30 ms, first 6 items only |
| hand-off | `CARD_TO_PAGE.handOff` (MOTION 5f) | 200 ms total: leaving block fades over its first 140 ms; arriving block fades in over the last 120 ms, from 80 ms |
| snappy | `snappy` spring | stiffness 520, damping 46, mass 1 (ratio 1.0, about 280 ms) |
| standard | `standard` spring | stiffness 260, damping 30, mass 1 (ratio 0.92, about 400 ms to settle, reads done by about 250 ms) |
| press | `press` | controls 0.97, cards 0.98, on snappy |
| breath | `emptyBreathMs` | 8000 ms, opacity 0.85 to 1 (`Breathe`) |
| lamp leave / return | `lamp.leaveMs`, `lamp.returnMs` | 160 ms, 280 ms |
| ceiling | `sequenceMaxMs`, `hardCeilingMs` | 900 ms, 2000 ms (no item here comes near them) |

Haptic intents are the five in `lib/haptics.shared.ts`; the platform calls are MOTION section 6's.

| Intent | iOS | Android | In this area |
|---|---|---|---|
| `tap` | `selectionAsync()` | `Segment_Tick` | Undo, Restore, Show again, Quiet on or off, Remove now, Stop |
| `press` | `impactAsync(Light)` | `Context_Click` | Start a copy, Make the printable book |
| `success` | `notificationAsync(Success)` | `Confirm` | The copy is ready (built); a cancelled deletion (built); a book shown again (built) |
| `warning` | `notificationAsync(Warning)` | `Reject` | The confirming tap of every destructive act: Erase everything, Delete account, Delete this book, Erase now, Remove an earlier version |
| `soft` | `impactAsync(Soft)` | `Long_Press` | none in this area |

Sound: none. The Paper sounds palette (`SOUND.md` section 4) has no keeping sound, `gentle_error` is never for background or storage failures, and with the setting off by default the area is silent. No item below plays a sound.

## 3. What is allowed over 300 ms, and why

| Motion | Length | Where | Allowed by | Under Reduce Motion |
|---|---|---|---|---|
| Standard spring settle tail (sheets, the list collapse) | about 400 ms to rest, visually done by about 250 ms | C-S03, C-S07, C-S11, C-S21 sheets; list collapses | house `standard` token, MOTION 5i | no travel; 200 ms fade |
| Loading drawing breath | 8 s loop | C-S10.loading, C-S19.erasing (`StateScreen` loading) | MOTION 5j, `Breathe`; NS-10 "static indicator with Reduce Motion" | still (built) |
| Lamp leaving as an unlit room is entered | 160 ms (under the line) | Home or Book to Me (C-S01) | MOTION 5k, 5l rule 1 | jumps to its level |

No `newMarkMs` wash (1.6 s) is used anywhere in area C: a restored letter, an arrived letter and a restored version are not "new", and a wash on hundreds of arriving letters would be a ceremony.

## 4. Undo windows (ruling T4), one pattern for the whole area

The ruling: every undo window stays open for its stated seconds, or until VoiceOver has finished reading the undo line plus that many seconds, whichever is later; with Switch Control on, until the parent moves on. NS-01-R38b adds: no Undo control ever outlives its window. The engineering form is the shared helper of BL-954 (ADR 0035 in the engineering plan).

**Area C default: no timer.** Every Undo this area shows is the toast with an action, which already never times out (`toast.tsx`: an action keeps it until Undo, Close, a swipe down or the screen changes). T4 is met because there is no stated second to run out, and the parent can never meet a dead Undo. Area C offers a timed window only if the design lead names one; the timeline below is then the law.

**Timeline of a timed window (N stated seconds).** Times are from the moment the toast mounts (t0).

| Moment | What moves | Duration and easing | Reduce Motion | Haptic | Spoken |
|---|---|---|---|---|---|
| t0, show | Toast box: opacity 0 to 1 and y 8 to 0 | `enter`, 280 ms, M3 standard | opacity only, 200 ms | none on show (MOTION 6) | `announce("<line> <Undo>.")` once (built) |
| t0 | The Undo button is hittable and in the accessibility tree from the first frame, not after the entrance | none | same | none | none |
| t0 to close | Nothing. No countdown bar, ring, shrinking width, dimming or ticking. The window is invisible by design | none | same | none | none |
| VoiceOver running | `closesAt = max(t0 + N, readDoneAt + N)`, where `readDoneAt` is the iOS `announcementFinished` event (React Native `AccessibilityInfo`, iOS only). If the event reports `success: false` (interrupted), `readDoneAt` is the time of the event. PROPOSED (card gap 1): while VoiceOver focus rests on the Undo button the window does not close | none | same | none | none |
| Switch Control running | No timer: the window closes only when the parent moves on (leaves the screen, starts another act, or Close) | none | same | none | none |
| Close | In the same frame: the Undo action is disabled and removed from the accessibility tree (R38b). Then the box leaves: opacity 1 to 0 and y 0 to 8 | `exitMs` 160 ms, M3 standard | opacity only, 200 ms | none | none (focus does not move; if focus was inside the toast it returns to the screen's first element without an announcement) |
| Undo tapped | The toast leaves as above; the undone thing returns in place (each row says how) | `exitMs` | 200 ms fade | `tap` (built) | the result line, if the item has one (WORDS.md) |
| A second toast while one is up | Words cross-fade in place, never stacked; the replaced toast's `onDismiss` runs, so its Undo closes with it | `swapMs` 150 ms | same (already a fade) | none | the new line |
| Leaving the screen | The toast and its Undo go with the screen at once (an undo window never follows the parent to another screen) | the push or tab change | same | none | none |

Test vectors for the BL-954 helper (N = 10 s): VoiceOver off, closes at 10.0 s. VoiceOver on, line read in 2.4 s, closes at 12.4 s. VoiceOver on, read finishes at 0.3 s, closes at 10.0 s (the later wins). Switch Control on, never closes on a clock. Undo at 9.9 s works; Undo at 10.0 s is impossible because the control is gone in that frame.

## 5. Every transition and feedback moment, by screen

Columns: **Id**, **Screen.state** (DESIGN ids), **Trigger**, **What moves** (and what does not), **Duration and easing**, **Reduce Motion**, **Haptic**, **Notes** (card rows, built code, focus and VoiceOver).

### C-S01 Me (Look after)

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C01 | C-S01.default | Tab change to Me | Nothing of ours: the native tab swap. If Me is unlit (default, card gap 7), the shared `tabs` lamp leaves under it | lamp `leaveMs` 160 ms, straight line | lamp jumps to 0 | none (tab changes are silent, MOTION 6) | Content never re-enters on a return (MOTION 5l rule 2). No row enters, no count animates |
| M-C02 | C-S01 to any Me page (C-S02, C-S04, C-S08, C-S15 to C-S20, C-S22) | Tap a row | Native push; the row's pressed state (iOS list highlight) | platform | platform's reduced transition | none (navigation) | Content of the arriving page is in place on its first frame: no entrance, no stagger |
| M-C03 | C-S01.default after a book is hidden or deleted | Return to Me with one book row fewer | The row is already gone; nothing slides on return | none | none | none | The collapse plays where the act happened (M-C24, M-C36), never again on return |

### C-S02 Account and C-S03 Sign-out sheet (ruling D1)

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C04 | C-S03.default | Tap Sign out | Our `Sheet` rises; scrim fades to `scrim` | `standard` spring; scrim on the same progress | sheet and scrim fade, no travel, 200 ms (built in `sheet.tsx`) | none (sheets opening are silent) | Title takes VoiceOver focus; the D1 line ("stay on this phone ... can read them") is static text, never revealed late |
| M-C05 | C-S03 to C-S02.signedout | Confirm Sign out | Sheet falls on `standard`; the page's signed-out block fades in in place | 200 ms (`PAGE_IN`, built) | same fade (already a fade) | none: sign-out is an act, not an outcome to mark (PROPOSED; built plays none) | Nothing leaves the phone, so nothing "leaves" on screen: no book cover closes, no letters fly away |
| M-C06 | C-S02.waiting (PROPOSED STATE) | Sign out while letters or recordings are still sending (`signOutWouldWait`, NS-08-R15, NS-09-R12) | The waiting row's words; nothing else | static | static | none | Built uses an `ActivityIndicator` in the row (`account.tsx:264`): a moving loop that Reduce Motion does not stop (NS-33-R5). Replace with a static line and `accessibilityState.busy`; engineering gap E2 |
| M-C07 | C-S03 cancel | Cancel or swipe down | Sheet falls | `standard` | 200 ms fade | none | Decline line of D1: Cancel keeps the parent signed in; nothing else moves |

### C-S04 Save a copy, and C-S05 the printable book (NS-11, C28)

The key moment: progress within 500 ms of the tap (NS-11-R24, C28-9), with no countdown pressure.

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C08 | C-S04.default to C-S04.running (PROPOSED STATE; `.preparing` while the fraction is 0) | Tap Save a copy (after the app-lock check when App lock is on; the 500 ms clock starts when the device has confirmed) | The action area is replaced, in the same frame, by the progress block: the phase line ("Getting your copy ready", WORDS), the empty bar track, Stop. No fade on the block: it is the progress, and Stop is a control | 0 ms: on screen in the first frame after the tap (target under 100 ms, ceiling 500 ms) | same | `press` (built) | `announce(<start line>)` once at start (NS-11 VoiceOver row "announced at start and finish"; built announces only the finish, engineering gap E3). Screen kept awake only now (R19, built) |
| M-C09 | C-S04.running | Each progress update | The bar's fill: `scaleX` from the left edge to the new fraction. Never backwards; at most one update per 250 ms. No shimmer, no stripes, no glow, no visible percentage, no time remaining, no letter count | 200 ms, M3 standard, transform only (MOTION 7 rule 2) | steps to the new value with no easing (as built today) | none | The bar is `progressbar` with `accessibilityValue` (built). Built steps `width` with no easing; the eased `scaleX` is a PROPOSED refinement (E3). Before the first fraction the track is empty and still: no indeterminate sweep |
| M-C10 | C-S04.running | Phase changes (checking, preparing, packing) | The phase line's words cross-fade in place | `swapMs` 150 ms | same | none | `accessibilityLiveRegion="polite"` on Android (built); iOS does not read each phase (only start and finish) |
| M-C11 | C-S04.running, Low Power Mode or battery under 20% | Enters running with Low Power on | The low-power line is part of the block from its first frame | static | static | none | NS-11-R17, C28-14: one calm line, never blocking, never blinking |
| M-C12 | C-S04.running to C-S04.ready (PROPOSED STATE) | The file is complete | Hand-off: the progress block fades out, the ready block (static check glyph, heading, Share) fades in. The check glyph never draws on; nothing scales or bounces | hand-off, 200 ms | same (already a fade) | `success` (built) | Focus to the ready heading; `announce(e.ready)` (built). No confetti, no sound, no `newMarkMs` wash |
| M-C13 | C-S04.ready to share sheet to C-S04.shared | Tap Share; the system sheet completes or is cancelled | The system share sheet's own motion; on return, the ready block hands off to the shared line | system; then hand-off 200 ms | system; fade | none | Cancelled share: back on Save a copy, nothing marked done (R16, R23); the same hand-off. A destination's own error is the destination's; our screen stays still |
| M-C14 | C-S04.running to C-S04.stopped | Tap Stop | Hand-off to the stopped line and Start again | 200 ms | same | `tap` (built) | Stop is honoured at once; the temporary ZIP is removed (R23) without any visible step |
| M-C15 | C-S04.error-lowSpace, .error-tooBig, .error-other (PROPOSED STATES; built `failed.reason`) | The disk check or the packing fails | Hand-off to the one failure line with its way forward | 200 ms | same | none (a failure is not an outcome the parent made) | No shake, no red, no `gentle_error`. The phone-is-full line (R20) shows before anything starts when the check fails at the tap: then the block never appears and the line takes its place |
| M-C16 | C-S04.running, app backgrounded and back | Return to the app | Nothing re-enters: the block shows its current state (still running, or stopped with its line) | none | none | none | NS-11 Interrupted row: resumes or says it stopped |
| M-C17 | C-S05.running (Making the printable book) | Tap Printable book (PDF) and choose a book | Same as M-C08 to M-C16, same component; may run up to 60 s for 240 letters with 50 pictures (C28-9) | same | same | `press` at start, `success` when ready | Long runs change nothing in motion: no "still working" nudge, no animation to fill the wait. Cancel stops generation and keeps no file (C28 Cancel row) |
| M-C18 | C-S04.empty | Open with no kept letters | Nothing: the existing `exportEmpty` state is in place on the first frame (pushed page) | none | none | none | The printable option is absent, not disabled, in this state (C28 Empty row) |

### C-S06 Home slip, and C-S07 Which book (NS-11)

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C19 | C-S06.default | Home on a cold launch in the birthday week | The slip enters as one of Home's content items in Tonight's stagger (MOTION 5a): opacity 0 to 1, y 8 to 0 | `enter` 280 ms, 30 ms stagger slot | one 200 ms fade with the rest of Home | none | On any return to Home (tab, back from Listen, Review or a page) the slip is simply there: no re-entry (MOTION 5l rule 2) |
| M-C20 | C-S06.default | Press the slip | Press scale | `press.cardScale` 0.98 on `snappy` | opacity 0.9 instead of scale | none | Then native push to C-S04 (M-C02) |
| M-C21 | C-S06 to C-S06.dismissed | Tap the slip's dismiss | The slip fades and the space it held closes; Home's content below moves up | slip `exitMs` 160 ms; then the gap closes on `standard` | slip fades 200 ms; the gap closes at once when the fade ends | none | No next slip slides into the same place on the same visit (card gap 3); the next slip in the ruled order shows on the next Home visit. VoiceOver focus moves to the next element in Home's order |
| M-C22 | C-S07.default (twins, one slip naming both) | Tap the twins slip | Our `Sheet` rises with the two book choices | `standard` | 200 ms fade | none on open; `tap` on a choice (ChoiceGroup) | Choosing pushes C-S04 for that book after the sheet falls; never both at once |

### C-S08 Where your letters live, and C-S09 the provenance row (NS-08, NS-10)

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C23 | C-S08.default | Open | Nothing: a static page (native push) | none | none | none | No lock, shield, cloud or "safe" imagery moves or exists (NS-08 design inputs) |
| M-C24 | C-S09.onPhone, .backedUp, .onItsWay, .notOnPhone (PROPOSED STATE names for the four NS-08 states) | The state changes while the page is open (flip only: a recording finishes arriving or backing up) | The line's words are replaced. No cross-fade, no progress ring, no upload or download animation, no check drawing | 0 ms (card: "Motion: none") | same | none | NS-08 design inputs "Motion: none"; NS-08 Reduce Motion row "no upload animation; a static line". If VoiceOver focus is on the row, it reads the new phrase on its next visit; no announcement (an upload is never news) |

### C-S10 Opening your book, C-S11 the returning consent sheet, C-S12 the Book-level line (NS-10)

The key moment: letters arriving on a new phone.

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C25 | C-S10.loading | Sign-in on a new phone while the book is on its way | The `StateScreen` block arrives; the moon drawing breathes (opacity 0.85 to 1). No spinner, no bar, no count | block 200 ms fade; breath 8 s loop while focused and active | block fade; the moon is still (built `Breathe`) | none | Built: `new-phone-screens.tsx` (no motion of its own). At most 10 s (NS-10 happy path step 3) |
| M-C26 | C-S10.loading to the Book (C-S12 present) | The books list and the first letters have arrived, or 10 s pass (R2) | Hand-off: the held screen fades out; the Book arrives as its first view of the session (MOTION 5a): header settles (`gentle`), the first 6 cards enter with the 30 ms stagger. The tabs' lamp `arrive`s as the first lit room of the session | hand-off 200 ms; `enter` 280 ms plus 5 x 30 ms; lamp per MOTION 5k | one 200 ms fade; lamp at its level at once | none | The Book-level line (C-S12) is in place in the header slip area on the first frame, with the header, never sliding in after |
| M-C27 | Book (area B) while C-S12 says more are on their way (PROPOSED STATE `C-S12.arriving`) | More letters arrive by sync while the parent reads | New cards appear in their place at full opacity with no entrance, no stagger and no wash. The scroll position is anchored to the card the parent is reading (`maintainVisibleContentPosition`), so nothing moves under their eyes. No count rises anywhere | 0 ms | same | none | A wash on every arriving letter would make an arrival a ceremony and would read as "new", which they are not. Area B owns the Book list; this row is a requirement on it (engineering gap E5) |
| M-C28 | C-S12.arriving to C-S12.default | The last letter has arrived | The "more on their way" words leave the line; if the line then holds only the recordings sentence, its words cross-fade in place | `swapMs` 150 ms | same | none | Nothing announces "all arrived" with motion; VoiceOver hears nothing (the parent is reading) |
| M-C29 | C-S12.default to C-S12.dismissed | Tap the line's dismiss | The line fades; the Book's list moves up into its space | `exitMs` 160 ms; gap closes on `standard` | 200 ms fade; gap closes at once | none | Never returns (R13, `newPhoneLine.dismissed`) |
| M-C30 | C-S10.offline, .failed, .noBook, .wrongAccount, .deletedElsewhere, .killswitch (PROPOSED STATES from the NS-10 tables) | The pull cannot go on, or ends | The `StateScreen` block is replaced: hand-off to the new state's drawing (complete, still), line and actions | 200 ms (StateScreen's own arrival fade) | same | none (Try again, Finish setup and Try another way are navigation) | `.deletedElsewhere` (R9): a plain line, never dramatic. `.killswitch` never shows the held screen (R8): the local book opens with M-C26 |
| M-C31 | C-S10 any state, Try again | Tap Try again | Hand-off back to `.loading`; the moon breathes again | 200 ms | fade; still moon | none | The wait does not restart from zero visually (R11): no reset animation exists to show |
| M-C32 | C-S11.default | A Terms version is outstanding at sign-in | Our `Sheet` rises, not dismissible by swipe (its buttons only) | `standard` | 200 ms fade | none on open; none on Agree (an agreement is recorded, not celebrated) | Never the child step (R0). After Agree the sheet falls and C-S10.loading continues under it (no second entrance) |
| M-C33 | C-S11 to C-S11.declined | Tap Not now (decline) | Sheet falls; hand-off to the declined screen | `standard`; 200 ms | fades | none | Delete account and Export stay reachable from here (R4a, R4b): plain rows, no emphasis motion |

### C-S13 Earlier versions, C-S14 an earlier version (NS-12, ruling D8)

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C34 | C-S13.loading to C-S13.default | Open the list (native push from the letter's "This letter" list, NS-21) | A quiet `InlineState` loading line (its drawing still: no spinner) is replaced by the list in one hand-off. Rows do not stagger | hand-off 200 ms | same | none | Only if the fetch takes longer than one frame; versions already on the phone render on the first frame with no loading line |
| M-C35 | C-S13.default | Show all | Older rows appear below at full opacity, no entrance; VoiceOver focus moves to the first newly shown row | 0 ms | same | none | No count of versions anywhere |
| M-C36 | C-S14.default | Tap a version (native push) | Nothing: a read-only page | none | none | none | The words render in the letter's serif with its `base_direction`; nothing marks differences (word compare is out of scope) |
| M-C37 | C-S14 to the letter page | Tap Restore | Commit the new version, then pop back twice to the letter page (native pops); the letter's words cross-fade in place once the page is visible | words `swapMs` 150 ms | same (already a fade) | `tap` (like Put it back, MOTION 6) | No wash, no "restored" badge. A toast with the result line and no action (WORDS), 4 s, never while VoiceOver runs (built toast rule). No Undo (card gap 4): restoring another version reverses it, and nothing was deleted |
| M-C38 | C-S14 to C-S13 | Tap Remove; confirm in our `ConfirmSheet` (default Cancel) | Sheet rises and falls (`standard`); pop to the list; the removed row fades and the rows below close up | sheet `standard`; row `exitMs` 160 ms; close-up `standard` (the built Recently deleted pattern) | sheet and row fade 200 ms; rows close at once | `warning` on the confirming tap | If no earlier version is left, pop on to the letter page instead (the row there is absent, NS-12-R1) |

### C-S15 A book in Me, C-S16 Hidden books (NS-22, BL-985, J-N19)

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C39 | C-S15.default to C-S15.quiet (PROPOSED STATE) | Turn Quiet this book on (or off) | The system switch's thumb; the row's explaining line swaps in place | switch: system; line `swapMs` 150 ms | switch: system; line same | `tap` | Quiet is reversible in place, so no Undo toast is needed. Nothing dims or greys the book name: quiet is a choice, not a state of loss |
| M-C40 | C-S15 to C-S01 | Hide this book, confirm in the system alert (plain choice, not destructive, built) | System alert; native pop to Me; the hidden book's row fades and the rows close up | alert: system; row `exitMs` 160 ms, close-up `standard` | row fades 200 ms; close at once | none (built) | The collapse plays once, on Me, right after the pop. No folding book, no fade-to-grey |
| M-C41 | C-S16.default | Show again | The row fades and closes up; the book's row returns to Me's list (seen on return, no entrance there) | `exitMs` 160 ms, `standard` | fade 200 ms | `success` (built `hidden.tsx`) | When the last hidden book leaves, M-C47's empty hand-off |

### C-S17 Recently deleted (NS-21-R7b, NS-36-R1a to R1c, NS-06-B25)

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C42 | C-S17.default | Tap Restore on a letter or book | The row fades; the rows below close up on the spring; toast with the result line and "Open" | row `exitMs` 160 ms (built `FadeOut`); `LinearTransition` on `standard` (built); toast `enter` | row fades 200 ms; no layout spring (built: `layout` undefined when reduced) | `tap` (built) | The toast carries an action, so it never times out (T4 met). The letter is back in the Book with no wash (section 3) |
| M-C43 | C-S17 Erase now | Tap Erase now; confirm in `ConfirmSheet` (default Keep) | Sheet rises and falls; the row fades and closes up; toast without action | as M-C42; sheet `standard` | as M-C42 | `warning` on the confirming tap (built plays it at the tap that opens the sheet, `recently-deleted.tsx:82`; move to the confirm, E6) | The toast leaves after 4 s, never while a screen reader runs (built) |
| M-C44 | C-S17.error-eraseKept (PROPOSED STATE; built `eraseFailedToast`) | Erase now could not remove the recording file | Nothing leaves: the row stays exactly where it was; the toast says so | toast `enter` | toast fade | none | A row that leaves and comes back would read as a glitch; it never moves |
| M-C45 | C-S17 sealed row | Restore or Erase now on a sealed letter (no words shown, B25) | Same as M-C42 and M-C43 | same | same | same | No envelope or seal imagery animates |
| M-C46 | C-S17 window ends (30 days) | Purge while the page is open (rare) | The row is gone the next time the list renders; nothing animates a purge | 0 ms | same | none | A purge is never a moment on screen |
| M-C47 | C-S17.default to C-S17.empty | The last row leaves | The empty state arrives by hand-off as the last row finishes fading: line art complete and still, one line | starts at 80 ms of the row's exit, 120 ms in; done by 280 ms | 200 ms fade after the row's fade | none | The empty drawing does not breathe here (it is not a loading state and the page is about deletion: stillness) |

### C-S18 Storage (NS-09-R6)

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C48 | C-S18.stuck (PROPOSED STATE) to C-S18.default | Tap Remove now; removal succeeds | The stuck-recording row fades; rows close up | `exitMs` 160 ms; `standard` | fade 200 ms; close at once | `tap` | Remove now finishes a let-go the parent already confirmed, so there is no second confirmation and no `warning` |
| M-C49 | C-S18.stuck | Remove now fails again | Nothing moves; the line stays as it was (card: "the same line; no error word") | none | none | none | Card gap 5: the parent sees no change. PROPOSED: VoiceOver re-reads the line (`announce`) so a VoiceOver user knows the tap landed; sighted feedback is the button's own press state |

### C-S19 Erase everything on this phone (D1, NS-36, NS-01-R52)

Key moment: quiet and serious, never dramatic.

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C50 | C-S19.default | Open (native push) | Nothing: what is erased and what stays, Export first, the destructive button; all static | none | none | none | The destructive button never pulses, glows or shakes |
| M-C51 | C-S19.confirm (system alert, `eraseConfirmDialog`) | Tap Erase everything | The system alert | system | system | none at the ask; `warning` on the confirming "Erase" (PROPOSED; built plays it when the alert opens, `erase.tsx:78`, E6) | Keep everything is the cancel and first; Erase is never the default (built) |
| M-C52 | C-S19.erasing | Confirm | Hand-off to the Erasing `StateScreen`: line and drawing; the drawing breathes. No bar, no percentage, no count of what is going, no items disappearing one by one | 200 ms; breath 8 s | fade; still drawing | none (the confirm already played `warning`) | Back, swipe and Android back are held (built). VoiceOver focus to the Erasing line |
| M-C53 | C-S19.erasing to the age question | The erase ends | Hand-off from the Erasing screen to the age question (which replaces every screen by itself, built). The `firstRun` lamp comes up as a return, not an arrival | 200 ms; lamp `returnMs` 280 ms (PROPOSED, house proposal H1) | one 200 ms fade; lamp at its level at once | none | `announce(e.doneA11y)` (built). No dawn, no "fresh start" moment: the 1.2 s `arriveMs` would read as a ceremony after an erase. If the erase finishes in under 200 ms, the Erasing screen still completes its arrival fade before the hand-off (no flash) |
| M-C54 | C-S19.error-failed, .error-signedIn (built `failed`) | The erase did not finish | The page comes back at its top with the one failure line first (built); hand-off | 200 ms | same | none | No shake, no red flash; the line is first in VoiceOver order (built) |

### C-S20 Delete account (ruling D6, NS-10-R4a, NS-08-R16)

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C55 | C-S20.loading | Open while the page loads its per-book lines | The `InlineState` loading line (still drawing), then hand-off to step 1 | 200 ms | same | none | Built shows an `ActivityIndicator` (`delete-account.tsx:115`): a loop Reduce Motion does not stop (E2) |
| M-C56 | C-S20.whatHappens to C-S20.confirm (PROPOSED STATE names for built steps 1 and 2) | Continue | Hand-off in place; the new step's ScrollView starts at its top; VoiceOver focus to step 2's heading (built) | 200 ms | same | none | Steps swap in place as built; no slide that would suggest a wizard racing ahead |
| M-C57 | C-S20.confirm | Typing the word that enables the button | The button changes from outline to filled `destructive` at once when the word matches. No glow, pulse or colour tween | 0 ms | same | none while typing | The text field is not a letter field (D2 n/a) |
| M-C58 | C-S20.confirm to C-S20.sending (PROPOSED STATE) | Tap Delete account | The button holds its place and its label; it becomes busy | none | none | `warning` (built, on the press) | Built shows a spinner inside the button (`loading`): replace with a static busy label and `accessibilityState.busy` (E2). Keep my account stays visible, disabled while sending |
| M-C59 | C-S20.sending to C-S20.scheduled | The request is accepted | Hand-off to the scheduled page: the date in title2, the D6 line that sealed letters are deleted with the account, Cancel deletion, Sign out of this phone | 200 ms | same | none (deletion is not an outcome to mark twice; the `warning` already played) | Nothing closes, fades to black or empties: the book is still here until the date |
| M-C60 | C-S20.scheduled to C-S20.default | Cancel deletion | Hand-off back to the page's default; toast with the result line | 200 ms; toast `enter` | fades | `success` (built) | |
| M-C61 | C-S20.error-* (built `ErrorLine`) | The request fails | The one failure line appears beside the button that can try again, by a 200 ms fade; nothing else moves | 200 ms | same | none | Says nothing has changed (built). No shake |
| M-C62 | C-S20.executing, .signedout, .killswitch | Those states | `StateScreen` or plain page, arriving by the 200 ms fade | 200 ms | same | none | |

### C-S21 Recording backup (flip only; absent today, NS-08)

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C63 | C-S21.consent (flip) | After the first kept spoken letter (PROPOSED in NS-08) | Our `Sheet` rises | `standard` | 200 ms fade | none | Never during first run. Today: absent, no motion exists |
| M-C64 | C-S21 uploads (flip) | Any upload | Nothing on screen. No background indicator, no badge, no progress | none | none | none | NS-08 Reduce Motion row: "No upload animation; a static line". The provenance row (M-C24) is the only signal |
| M-C65 | C-S21 Stop backup (flip) | Confirm Stop backup | Confirmation sheet; then the row's words swap | `standard`; `swapMs` | fades | `warning` on the confirm (server copies are deleted on the clock, D12) | |

### C-S22 Delete this book

| Id | Screen.state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C66 | C-S22.confirm (typed word, built) | Typing the word | As M-C57 | 0 ms | same | none | |
| M-C67 | C-S22 to C-S01 | Confirm | `dismissTo('/settings')` (native); the book's row is already gone from Me on arrival; toast with the result line, no action (built) | native; toast `enter` | native reduced; toast fade | `warning` (built, on the confirm) | The book is in Recently deleted; the toast says where (WORDS). No closing-cover animation (`BookCover animate={false}`, as built on these pages) |

## 6. What never animates in this area

- No celebration: no confetti, burst, draw-on check, bounce, sparkle, sound or `newMarkMs` wash on a copy made, a book arrived, a letter restored, a version restored or a book shown again.
- No counters: no rolling percentage, no "x of y letters", no letters-arriving tally, no version count, no days-left countdown in Recently deleted or on the scheduled deletion page.
- No countdown on any Undo: no bar, ring, dimming or tick.
- No drama on deletion: no shake, red flash, pulse, glow, hold-to-confirm ring, crumple, shred, bin, fly-away, fade-to-black, closing book cover or dimming of the lamp as mood.
- No upload or download motion: no cloud, arrow, spinner, badge or progress for backup or for letters arriving.
- No spinner anywhere in the area (house: loading never spins). Built exceptions to remove: E2.
- No moving loop under Reduce Motion (NS-33-R5): the only loops in the area are the `Breathe` drawings, which stop.
- No motion on the provenance row (NS-08 design inputs).
- No entrance on any return: Me, the Book and Home never replay content on a tab change or a pop (MOTION 5l rule 2).

## 7. Reduce Motion summary

Every item has its alternative in its row. The rule in one line: nothing we control travels; every move becomes a 200 ms opacity change (`fadeMs`, with `ReduceMotion.Never` so Reanimated does not jump, MOTION 4); springs that collapse lists are replaced by a fade followed by an instant close; breathing drawings are still; the lamp is at its level at once; native pushes, alerts and the share sheet follow the system's own reduced transition. Under Reduce Motion with "Prefer Cross-Fade Transitions" on, the system pushes cross-fade; ours already do.

## 8. VoiceOver and focus with motion

- Focus never waits for an animation: on a hand-off it moves to the arriving block's heading when the block mounts (at 80 ms), not at the end.
- Announcements in the area (built or PROPOSED): copy started (PROPOSED, E3), copy ready (built), erase done (built), toast lines (built, once each). A progress bar never announces each step on iOS.
- A leaving row or block is hidden from the accessibility tree from its first frame of exit.

## 9. Card gaps (cards are not changed; proposed defaults)

| # | Card row | What is missing | Proposed default |
|---|---|---|---|
| 1 | Ruling T4 (frame line 73; NS-33-R15) | Whether a window may close while VoiceOver focus rests on the Undo button | It does not close while focused there; it closes N seconds after focus leaves, or by the ruling's clock, whichever is later |
| 2 | NS-11 section 15, C28 4.6 | Whether progress may ease between values | Eased `scaleX` over 200 ms when Reduce Motion is off; steps when on; never backwards; no indeterminate animation |
| 3 | NS-11 section 3 (Home slip order) | After the parent dismisses the Save a copy slip, does the next slip in the order appear in the same visit | No: the next slip shows on the next Home visit, so dismissing never makes something new slide in |
| 4 | NS-12 section 4 | Whether Restore offers Undo | No Undo: Restore adds a version and deletes nothing; restoring another version reverses it |
| 5 | NS-09 table, "Remove now fails again" | The parent gets no feedback that the tap landed | VoiceOver re-reads the line; `content` may propose a short in-place "We will try again" line (WORDS) |
| 6 | NS-10 sections 4 and 6 | How letters that arrive while the parent reads appear | In place, no entrance, no wash, scroll anchored, no count |
| 7 | Frame section 4 (Me, Look after) and MOTION 5k scenes | Whether Me is a lit room | Unlit (Settings on paper): the tabs lamp leaves under it over 160 ms; the design lead may choose the `family` scene's 0.4 still light instead |
| 8 | NS-11 VoiceOver row | "Progress announced at start" has no line | A start line from `content`, announced once |

## 10. Engineering gaps (the engineering plan is not changed)

| # | What the motion needs | Backlog row |
|---|---|---|
| E1 | The undo helper needs to know Switch Control is running and when VoiceOver finished reading a line. React Native `AccessibilityInfo` gives `announcementFinished` on iOS; it has no Switch Control query (UNVERIFIED against React Native 0.86 this session), so a small native read of `UIAccessibility.isSwitchControlRunning` and its change notification is needed. The toast and its action expire in the same frame | BL-954 |
| E2 | Remove the moving spinners Reduce Motion does not stop: `account.tsx:264` (sign-out waiting row), `delete-account.tsx:115` (page load), `Button` `loading` on Delete account. Static line or label plus `accessibilityState.busy` | BL-984 (NS-33-R5); BL-927 for the audit note |
| E3 | Save a copy: announce at start; optional eased `scaleX` fill with a 250 ms update throttle; the same progress component for the printable book | BL-942; BL-973 |
| E4 | Me as a tab root: the lamp leave when Me is unlit (the `tabs` persist key with an unlit room) | BL-928 (Me) or a new row if the IA work owns it |
| E5 | The Book keeps the reader's place while letters arrive (`maintainVisibleContentPosition` or equivalent on the section list) and skips the arrival wash for synced-in letters on a new phone (today the other parent's first-seen letters wash once, `book.tsx:157`; a new phone's own letters must not) | BL-978 |
| E6 | `warning` plays on the confirming tap, not when a confirmation opens: `erase.tsx:78`, `recently-deleted.tsx:82` and `:104` | no row; proposed under BL-984 (haptic policy, MOTION 6) |

## 11. House motion proposals (for `docs/design/MOTION.md`, owner design systems)

- H1. After Erase everything, the `firstRun` lamp returns over `returnMs` instead of arriving over `arriveMs` (M-C53).
- H2. A determinate progress bar eases by `scaleX` over `fadeMs`, never backwards, with a 250 ms update throttle, and steps under Reduce Motion (M-C09). Today MOTION has no progress rule.
- H3. A `Button` in its `loading` state shows a static busy label, never a spinner (E2).

## 12. Superseded

- `docs/design/specs/S17-NEW-PHONE-SPEC-10nov.md` (read for motion only): kept where the card agrees: "Nothing here adds motion", the moon that breathes and is still under Reduce Motion, no count, no percentage, a spinner never appears (its lines 61, 67, 84). Superseded where NS-10 differs: S17 lands on Tonight with no "still arriving" line (its line 120); NS-10 happy path step 3 and R2 land on the Book with one line that more are on their way, so M-C26 hands off to the Book and M-C27 and M-C28 carry that line. S17's own worry (its line 121: newest letters may "slide in at the top" as later pages land) is answered by M-C27: no slide, the scroll anchored to what the parent reads.
