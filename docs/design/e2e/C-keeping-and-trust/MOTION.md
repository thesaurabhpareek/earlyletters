# Area C. Keeping and trust: motion

Status: v1.1, 20 Nov 2026, reconciled. Motion lead, area C. Docs only; nothing here was run on a phone. Timings are tokens; feel is (opinion) until a device walk (BL-948).

Keyed to:
- **Screens and states**: `DESIGN.md` in this folder (C-S01 to C-S22 and the state names of its section 11 reconciliation). Every state below is DESIGN's name; where this file once used another name, DESIGN's table maps it.
- **Motion vocabulary**: the design system v2 draft, `docs/design/system/MOTION.md` (primitives `m.*`, transitions `T-*`, haptic ids `H-*`), and `docs/design/system/COMPONENTS.md` (F1 Undo toast, F3 Progress, F6 Confirmation, C8 State screen, N7 Sheet, I5 Toggle). Where v2 and the built app differ, this file follows v2 and names the built behaviour, because v2 is what Karma's pass will commit. Where v2 is silent or allows more than this area wants, the row says "area C choice".
- **Tokens**: `packages/design-tokens/src/tokens.ts` `motion` (values in section 2).

Prototype: `MOTION-PROTOTYPE.html` plays every item below on demand, with Reduce Motion, dark, a simulated VoiceOver, a simulated Switch Control and slow motion. All 76 items (M-C01 to M-C72 and four T4 scenarios, UNDO-A to UNDO-D) were run headless in Chrome with Reduce Motion off and on: no script error, every item ends. Native pushes, action sheets and the share sheet are approximations, marked "system"; the toast is the solid fallback (on iOS 26 it is glass, shown by style, never opacity).

Sources read (brief section 1, in order): cards `08-keeping-and-trust.md` (NS-08 to NS-12), `07-remaining-capability-rows.md` (C28), `11-foundations.md` (NS-33, NS-36), `10-reading-and-family.md` (NS-21, NS-22), `06-firsts-sealed-letter-quick-capture.md` (B25, D6 rows), `01-photo-with-a-letter.md` (R38a to R38c), `00-product-frame.md`; `14-test-plan.md` (J-N8, J-N15, J-N19, J-N20); `16-council-review-round-2.md` (T4, D1, D6, D7, D8, D12); backlog BL-942, BL-954, BL-973, BL-978, BL-984, BL-985; `/home/claude/review/eng/C-platform-quality-delivery.md` (ADR 0035 undo helper); `docs/design/MOTION.md` v0.2; `docs/design/SOUND.md`; the v2 drafts above; `apps/mobile/src/components/motion/*`, `components/ui/{toast,sheet,state-screen}.tsx`, `lib/haptics.shared.ts`; the built screens `app/settings/{account,export,erase,delete-account,recently-deleted,storage,backup}.tsx`, `app/settings/children/{[id],hidden,delete-book}.tsx`, `components/onboarding/new-phone-screens.tsx`, `app/(tabs)/book.tsx`.

## 1. The register for this area

Keeping is where a parent trusts us with the only copy of a voice. The motion here is a quiet clerk, not a performer.

1. **A receipt, never a show.** Every motion confirms something that already happened (commit first, then move). Nothing celebrates a copy, a restore or an arrival.
2. **Serious things are still.** Erase, delete account, delete a book, remove a version, Erase now: a native action sheet or our confirmation sheet, the platform's own entrance, nothing of ours. No shake, red flash, pulse, glow, hold-to-confirm ring, crumple, shred, bin or fade-to-black.
3. **No countdown pressure.** No time remaining, no ticking, no shrinking bar on an Undo, no rolling percentage, no "x of y letters". Progress is a quiet bar and a sentence.
4. **Calm and quick.** Every move we draw here is at or under 300 ms (v2 `motion.capMs`). The only longer things in the area are the system's own (push, sheet, action sheet, share sheet) and, on the Book's first view of a session, `m.enter.group` (430 ms, a v2 named exception).
5. **Still, not looping.** Area C has no loop at all, with or without Reduce Motion: no breathing drawing (v2 retires `Breathe`, MP-17), no sweep, no spinner in a block. The only activity indicator v2 allows here is the system one inside a busy button, and area C uses a static busy label instead (DESIGN C-S20.sending).
6. **Controls never animate in.** Stop, Share, Try again, Undo, Remove now and every confirmation choice are hittable from their first frame, even inside a block that fades.
7. **The platform's chrome is the platform's.** Area C is mostly pushed pages in Me: `m.push`, native action sheets (F6 `simple`), system sheets (F6 `explained` and `typed`, N7), the share sheet. We add opacity where a block of ours is replaced, and one list collapse.

## 2. Tokens and vocabulary used

| v2 name | Token today (`tokens.ts`) | Value | Reduce Motion (v2 section 8) |
|---|---|---|---|
| `m.tap` | `press` on `snappy` | scale 0.97 controls, 0.98 cards; snappy = stiffness 520, damping 46, mass 1 | opacity dip to 0.9 over 90 ms |
| `m.enter` | `enter` | opacity 0 to 1, y +8 to 0, 280 ms, `cubic-bezier(0.2, 0, 0, 1)` | opacity over 200 ms |
| `m.enter.group` | `staggerMs`, `staggerMax` | `m.enter` 30 ms apart, first 6 only | one 200 ms fade, no stagger |
| `m.exit` | `exitMs` | 160 ms (opacity only in lists) | opacity over 160 ms |
| `m.fade` | `fadeMs`, `CARD_TO_PAGE.handOff` | 200 ms: the leaving block gone by 35 percent (70 ms in v2; 140 ms in the built hand-off), the arriving block from half of that; linear for screens of words | it is the substitute |
| `m.swap` | `swapMs` | 150 ms cross-fade in the same box | same |
| `m.step` (T-STEP) | `exitMs`, `enter` | words `m.exit` 160 then next words `m.enter` 280; controls stay | fade out 200, fade in 200 |
| `m.move` | `standard` spring | stiffness 260, damping 30, mass 1 (v2 proposes response 0.30 s) | no travel: final layout next frame |
| `m.list.remove` | `exitMs` + `standard` | row `m.exit` (opacity only), then rows below `m.move` up | row fades 160 ms; gap closes next frame |
| `m.progress` | v2 `progress.settleMs` (new) | fill by `scaleX` from the left, 200 ms linear per reading, never backwards | jumps to each value |
| `m.toast` (F1) | `swapMs`, v2 `toast.*`, `glass.styleS` | glass style none to regular (0.25 s) while rising 8 pt on snappy; words `m.enter`; out: words `m.exit`, glass to none, unmount | no rise; glass style change and word fades only; under Reduce Transparency a solid toast fades 200 ms |
| `m.sheet`, `m.push`, T-ALERT | system | system | system reduced transition |
| `m.sheet.own` | `standard`, `exitMs`, `fadeMs` | while `ui/sheet.tsx` remains: rise on standard, leave 160 ms, scrim 200 ms | no travel; fade 200 ms |
| `m.instant` | none | next frame | same |

Haptics (v2 section 9; intents in `lib/haptics.shared.ts`):

| Id | Intent | iOS / Android | In this area |
|---|---|---|---|
| H-select | `tap` | `selectionAsync()` / `Segment_Tick` | Undo; Restore (Recently deleted, an earlier version); Remove now; Stop |
| H-success | `success` | `notificationAsync(Success)` / `Confirm` | The copy is ready; the printable book is ready (an export finished). Nothing else in this area |
| H-warning | `warning` | `notificationAsync(Warning)` / `Reject` | After a destructive choice is confirmed: Erase everything, Delete account, Delete this book, Erase now, Remove an earlier version, Stop backup (flip) |
| H-press, H-soft | `press`, `soft` | | none in this area (v2 ENG-M10: `press` on starting an export becomes none) |

Never a haptic here for: opening a sheet or action sheet, Continue, Back, Close, Not now, sign-out, Hide, Show again, Quiet (the system switch plays its own), cancel deletion, a failure, progress updates, an arrival. Sound: none (the Paper sounds palette has no keeping sound; `gentle_error` is never for background or storage failures).

## 3. Undo windows (ruling T4), one pattern for the whole area

The ruling: every undo window stays open for its stated seconds, or until VoiceOver has finished reading the undo line plus that many seconds, whichever is later; with Switch Control on, until the parent moves on. NS-01-R38b: no Undo control ever outlives its window. Engineering: the shared helper of BL-954 (ADR 0035), built into F1 (`windowSeconds`).

**Where area C shows Undo.** By DESIGN, nowhere new: Restore (C-S17) carries "Open", Restore of an earlier version (C-S14) has no Undo (DESIGN G11), Quiet is a switch, Hide and Delete confirm first. The toasts this area shows carry an action with no timer, or no action at all. The Book's "Letter deleted." Undo (B-S15, area B) leads into C-S17 and follows the same pattern. So T4 is met here by having no timer, and no dead Undo can appear. If any timed window is added, the timeline below is the law.

| Moment | What moves | Duration and easing | Reduce Motion | Haptic | Spoken |
|---|---|---|---|---|---|
| t0, show (F1) | `m.toast`: glass materialises by style, the capsule rises 8 pt on snappy, the words `m.enter` | glass 0.25 s; rise snappy; words 280 ms | no rise; glass style and word fade only | none on show | `announce("<line> Undo available.")` once (F1); focus does not move |
| t0 | Undo is hittable and in the accessibility tree from the first frame, not after the entrance | none | same | none | none |
| t0 to close | Nothing. No bar, ring, shrinking width, dimming or tick (F1: "never a progress ring or countdown") | none | same | none | none |
| VoiceOver running | `closesAt = max(t0 + N, readDoneAt + N)`; `readDoneAt` from the iOS `announcementFinished` event (UNVERIFIED on React Native 0.86 New Architecture, F1); if it reports `success: false`, the event's time. Area C proposal (card gap 1): the window does not close while VoiceOver focus rests on Undo | none | same | none | none |
| Switch Control running | No clock: closes only when the parent moves on (another act, leaving the screen, a swipe down) | none | same | none | none |
| Close | In the same frame the Undo is disabled and leaves the accessibility tree (R38b); then words `m.exit`, glass to none, unmount | 160 ms; 0.25 s | words fade 160 ms; glass style | none | none; if focus was inside, it returns to the screen without an announcement |
| Undo tapped | The outcome reverses first; the words `m.swap` to the result line (F1, "Put back."); the toast then leaves like a toast with no action | `swapMs` 150 ms | same | H-select | the result line |
| A toast over a toast | Words `m.swap`; the glass stays; the replaced toast's `onDismiss` runs, so its Undo closes with it | 150 ms | same | none | the new line |
| Leaving the screen | The toast and its Undo go with the screen | the push | system | none | none |

Test vectors for BL-954 (N = 10 s): VoiceOver off, closes at 10.0 s. VoiceOver on, line read by 2.4 s, closes at 12.4 s. VoiceOver read done at 0.3 s, closes at 10.0 s. Switch Control on, never on a clock. Undo at 9.9 s works; at 10.0 s it cannot be pressed because it is gone in that frame.

## 4. Every transition and feedback moment, by screen

Columns: **Id** (stable; new items take the next number), **Screen.state** (DESIGN), **Trigger**, **What moves** (and what does not), **Primitive and timing**, **Reduce Motion**, **Haptic**, **Notes** (cards, built code, focus, VoiceOver).

### C-S01 Me (Look after)

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C01 | C-S01.default | Tab change to Me | Nothing of ours (T-TAB). If the lamp is kept (v2 section 10, pending) and Me is unlit (card gap 7), the tabs lamp leaves under it | system; lamp `leaveMs` 160 ms | lamp at 0 at once | none | Content never re-enters on a return (T-RESUME) |
| M-C02 | C-S01 to C-S02, C-S04, C-S08, C-S15 to C-S20, C-S22 | Tap a row | T-PUSH; the row's own highlight | `m.push` (system) | system reduced | none | Arriving page content is in place on its first frame: no entrance, no stagger |
| M-C03 | C-S01.default after a book was hidden or deleted | Return to Me | Nothing: the row is already gone | `m.instant` | same | none | The collapse plays once, where the act ended (M-C40, M-C67) |
| M-C68 | C-S01.local, .killswitch, .second-account, .signedout | Those states | Nothing animates a state of Me; the signed-out card is in place when Me is shown | `m.instant` | same | none | After sign-out the arrival is M-C05 |

### C-S02 Account and C-S03 the sign-out sheet (ruling D1)

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C04 | C-S03.default (F6 `explained`, three choices) | Tap Sign out | The sheet rises; "Stay signed in" is the default | `m.sheet` (system); `m.sheet.own` while `ui/sheet.tsx` remains: standard rise, scrim 200 ms | system reduced; `m.sheet.own` fades 200 ms, no travel | none | Title then the D1 line ("stay on this phone ... can read them") then the safe choice, in VoiceOver order; the D1 line is never revealed late |
| M-C05 | C-S03 to C-S01.signedout | Tap Sign out | The sheet leaves; the parent is on Me, whose signed-out card arrives in place | sheet system; card `m.fade` 200 ms (built `PAGE_IN` on Account; DESIGN moves it to Me) | same | none | Nothing leaves the phone, so nothing "leaves" on screen: no cover closes, no letters fly away |
| M-C06 | C-S02.waiting | Sign out while letters or recordings are still sending (NS-08-R15, NS-09-R12) | The waiting line replaces the Sign out row; nothing else | `m.swap` 150 ms; the line is static | same | none | Area C choice: static line with `accessibilityState.busy`, no indicator (DESIGN: "static indicator"). Built uses an `ActivityIndicator` (`account.tsx:264`), which does not stop under Reduce Motion (NS-33-R5): E2 |
| M-C07 | C-S03 dismissed | "Stay signed in" or a swipe down | The sheet leaves | system | system reduced | none | D1 decline: still signed in |
| M-C69 | C-S03 to C-S19.confirm | "Sign out and erase this phone" (DESIGN section 11, F6 `explained` three) | The sign-out sheet leaves; once it is gone, C-S19's confirmation sheet rises (two sheets never overlap) | system, in sequence | system reduced | none here; H-warning only on C-S19's confirm | Added in reconciliation |

### C-S04 Save a copy and C-S05 the printable book (NS-11, C28)

Key moment: progress within 500 ms of the tap (NS-11-R24, C28-9), no countdown pressure. Component F3 `linear`.

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C08 | C-S04.default to C-S04.running | Tap Save a copy (after the App lock check when on; the 500 ms clock starts when the device confirms) | In the same frame the action area becomes the F3 block: its sentence, the empty 4 pt track, Stop. No fade on the block: it is the progress, and Stop is a control | `m.instant`: on screen in the first frame after the tap (target under 100 ms; ceiling 500 ms) | same | none (v2 ENG-M10; built plays `press`) | `announce(<start line>)` once (NS-11 VoiceOver row "announced at start"; built announces only the finish: E3). Screen awake only while running (R19, built) |
| M-C09 | C-S04.running, C-S05.making | Each progress reading | The fill grows from the left; never backwards; at most one reading per 250 ms (area C proposal). No shimmer, stripes, glow, visible percentage, time left or letter count | `m.progress`: `scaleX`, 200 ms linear per reading | jumps to each value (as built) | none | F3 text value (for example "About half") is announced at most every 10 s (DESIGN section 11); before the first reading the track is empty and still: never an indeterminate sweep |
| M-C10 | C-S04.running, C-S05.making | The phase changes (checking, packing; laying out, placing pictures) | The sentence's words | `m.swap` 150 ms | same | none | Android polite live region (built); iOS hears only start, the 10 s text value and finish |
| M-C11 | C-S04.lowPower, C-S05.lowPower | Low Power Mode or battery under 20% | Nothing: the one muted line is on the page from its first frame and stays through running | `m.instant` | same | none | NS-11-R17, C28-14; never blinks, never blocks |
| M-C12 | C-S04.running to C-S04.ready; C-S05.making to C-S05.ready | The file is complete | Whole-state change: the F3 block leaves, the ready block (static check glyph, words, privacy line, Save or share) arrives. The check never draws on; nothing scales or bounces | `m.fade` 200 ms | same | H-success | Focus to the ready heading at its mount; `announce(ready)` (built). No confetti, no sound, no `m.mark` |
| M-C13 | C-S04.ready to share sheet to C-S04.saved or C-S04.cancelled | Save or share; the system sheet completes or is cancelled | The share sheet is the system's; on return the ready block becomes the saved line or the cancelled state | system; then `m.fade` 200 ms | system; fade | none | Cancelled: nothing marked done (R16, R23). A destination's own error is the destination's: our screen does not move |
| M-C14 | C-S04.running to C-S04.stopped | Tap Stop | The stopped line and Save a copy again replace the block | `m.fade` 200 ms | same | H-select | The temporary file goes (R23) with no visible step |
| M-C15 | C-S04.error-lowSpace, .error-tooBig, .error-other; C-S05.error-print | The disk check fails at the tap, or packing fails | The one failure line (FailureCard, built) and its way forward replace the action area or the block. When the check fails at the tap, the F3 block never appears | `m.fade` 200 ms | same | none | No shake, no red, no `gentle_error` (v2 section 11 "errors arrive like any content") |
| M-C16 | C-S04.running after the app was backgrounded; C-S04.stopped-by-close | Return to the app; or open Save a copy after iOS closed the app mid-copy | Nothing re-enters: the block shows its state; `stopped-by-close` is simply the page's state when it opens | `m.instant` | same | none | NS-11 Interrupted row; R9 |
| M-C17 | C-S05.making | Make the printable book | As M-C08 to M-C16, the same F3 component; may run up to 60 s (C28-9) | as above | as above | H-success at ready only | Long runs change nothing: no "still working" nudge, no animation to fill the wait. Cancel stops and keeps no file |
| M-C18 | C-S04.empty, .nothingHere, .newPhone, .lapsed, .signedout, .second-account, .killswitch | Open in those states | Nothing: the page is in place on its first frame | `m.instant` | same | none | The printable option is absent, not disabled, in `.empty` (C28) |

### C-S06 Home slip and C-S07 Which book (NS-11)

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C19 | C-S06.default, .twins | Home on a cold launch in the birthday week | The slip is one item of Home's first content | `m.enter.group` slot (280 ms, 30 ms stagger) | one 200 ms fade | none | On every return to Home the slip is just there (T-RESUME). Speak and Type are static (area A) |
| M-C20 | C-S06.default | Press the slip | Card press | `m.tap` 0.98 on snappy | opacity dip 90 ms | none | Then `m.push` to C-S04 |
| M-C21 | C-S06 to C-S06.dismissed ("Not now", DESIGN U1) | Tap Not now | The slip leaves; Home's content below closes the gap | `m.list.remove`: `m.exit` 160 ms, then `m.move` | slip fades 160 ms; gap closes next frame | none | No toast, no Undo (DESIGN). The next slip in the ruled order shows on the next Home visit, never sliding into the same place now (card gap 3). VoiceOver focus to the next element in Home's order |
| M-C22 | C-S07.default | Tap the twins slip | The chooser sheet | `m.sheet` (system) | system reduced | none on open; none on a choice (navigation) | The sheet leaves before C-S04 is pushed; never both at once |

### C-S08 Where your letters live and C-S09 where the recording is (NS-08, NS-10)

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C23 | C-S08.default | Open | Nothing: a still page | `m.push` then still | system | none | No lock, shield, cloud or "safe" imagery exists, so none moves (NS-08 design inputs) |
| M-C24 | C-S09.onPhone, .notHere, .otherParent, .backedUp (flip), .arriving (flip) | The state changes while the page is open (flip only: a recording arrives or is backed up) | The line's words are replaced. No cross-fade, ring, upload or download animation, no check drawing | `m.instant` (NS-08 design inputs: "Motion: none") | same | none | No announcement: an upload is never news. VoiceOver reads the new phrase on its next visit (NS-08-R20) |

### C-S10 Opening your book, C-S11 returning consent, C-S12 the Book-level line (NS-10)

Key moment: letters arriving on a new phone.

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C25 | C-S10.opening | Sign-in on a new phone while the book is on its way | The C8 `loading` block arrives; the moon drawing is complete and still. No spinner, bar or count | `m.fade` 200 ms; then nothing | same | none | v2 retires `Breathe` (MP-17): the built moon breathes (`new-phone-screens.tsx` through `StateScreen`); follow v2 (E7). At most 10 s (NS-10 step 3) |
| M-C26 | C-S10.opening to the Book (B-S01) with C-S12 | The first letters arrived, or 10 s passed (R2) | The held screen hands off to the Book's first view of the session: the first 6 cards `m.enter.group`; the header band does not move (v2 retires the Book `Settle`). The C-S12 line is in place with the header on the first frame | `m.fade` 200 ms; `m.enter.group` 430 ms to the last card | one 200 ms fade, no stagger | none | If the lamp is kept, it arrives here as the first lit room of the session (v2 section 10) |
| M-C27 | Book (B-S01) with C-S12.arriving | More letters arrive by sync while the parent reads | New cards are in place at full opacity: no entrance, no stagger, no `m.list.insert`, no `m.mark`. The scroll stays anchored to the card being read, so nothing moves under the parent's eyes. No count anywhere | `m.instant` | same | none | Card gap 6. Arrival is not "new": a tint on hundreds of letters would be a ceremony. Area B owns the list; this is a requirement on it (E5). S17's worry (newest letters sliding in at the top, its line 121) is answered by the anchor |
| M-C28 | C-S12.arriving to C-S12.default | The pull completes | The line's words | `m.swap` 150 ms | same | none | Nothing announces "all arrived"; VoiceOver hears nothing (the parent is reading) |
| M-C29 | C-S12.default to C-S12.dismissed | Tap Close | The line leaves; the list closes the gap | `m.list.remove` | line fades 160 ms; gap closes next frame | none | Never returns (R13) |
| M-C30 | C-S10.held, .offline, .noBook, .wrongAccount, .deletedElsewhere | The pull cannot go on, needs a choice, or ends | The C8 block is replaced by the new state's (drawing complete and still, line, actions) | `m.fade` 200 ms | same | none | `.deletedElsewhere` (R9): a plain line, nothing dramatic. Finish setup, Try another way, Try again are navigation: no haptic |
| M-C31 | C-S10.offline to C-S10.opening | Try again | Back to the opening block | `m.fade` 200 ms | same | none | The wait never visibly restarts from zero (R11): there is no reset to show |
| M-C72 | C-S10.killswitch | `serverFeaturesEnabled()` off at sign-in | The held screen never shows (R8): the local book opens as in M-C26 | as M-C26 | as M-C26 | none | |
| M-C32 | C-S11.default | A Terms version is outstanding | The consent sheet; not dismissible by swipe | `m.sheet` (system) | system reduced | none on open; none on Agree (an agreement is recorded, not celebrated) | Never the child step (R0). After Agree the sheet leaves and C-S10.opening carries on under it: no second entrance |
| M-C33 | C-S11 to C-S11.declined | Not now | The sheet leaves; the declined screen replaces the opening screen | system; `m.fade` 200 ms | system; fade | none | Save a copy and Delete account are plain buttons (R4a, R4b): no emphasis motion |

### C-S13 Earlier versions and C-S14 an earlier version (NS-12, ruling D8)

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C34 | C-S13.loading to C-S13.default | Open the list when the fetch takes over 1 s (DESIGN U2) | Nothing for the first second; then the one quiet line ("Getting earlier versions.") arrives; the list replaces it when it comes. Rows never stagger | line `m.fade` after 1 s (v2 MP-19 placeholder); list `m.fade` 200 ms | same | none | Versions already on the phone render on the first frame. No indicator |
| M-C70 | C-S13.error-fetch, .offline, .offlineNone | The fetch fails or the phone is offline | The plain line replaces the loading line or the list | `m.fade` 200 ms | same | none | The current words are unchanged (NS-12 Failed row) |
| M-C35 | C-S13.default | Show all | Older rows appear below at full opacity; VoiceOver focus to the first newly shown row | `m.instant` | same | none | No count of versions anywhere |
| M-C36 | C-S14.default | Tap a version | `m.push`; the page is still | system | system | none | Words in the letter's serif and `base_direction`; nothing marks differences |
| M-C37 | C-S14 to the letter page (B-S08) | Restore (no confirm, DESIGN) | The new version is committed first; `m.push` back to the letter; its words cross-fade in place once the page is visible; a toast with the result line and no action | pop system; words `m.swap` 150 ms (a whole-block swap, never per word: v2 section 11); toast `m.toast` | pop reduced; same fades | H-select | No `m.mark`, no badge. No Undo (DESIGN G11): the list is the undo |
| M-C38 | C-S14.confirmRemove to C-S13 | Remove, then the destructive choice | F6 `simple`: native action sheet from Remove, "Keep it" the default; then pop to the list, where the removed row leaves | T-ALERT (system); row `m.list.remove` | system; row fades 160 ms, gap next frame | H-warning after the choice | If no earlier version is left, pop on to the letter page (the row there is absent, NS-12-R1) |

### C-S15 a book in Me, C-S16 Hidden books (NS-22, BL-985, J-N19)

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C39 | C-S15.default, quiet on or off | Quiet this book (I5 Toggle) | The system switch; the explaining line's words | switch: system (`m.select`); line `m.swap` 150 ms | switch: system; line same | the system switch's own, none of ours | No toast (DESIGN: the switch position is the state). Nothing dims or greys the book name: quiet is a choice, not a loss |
| M-C40 | C-S15 to C-S01 | Hide this book, then confirm (F6 `simple`) | Native action sheet; pop to Me; the book's row leaves | T-ALERT; `m.push` back; `m.list.remove` | system; row fades 160 ms, gap next frame | none (not destructive; nothing is deleted) | The row leaves once, on Me, right after the pop |
| M-C41 | C-S16.default | Show again | The row leaves this list; the book's row is in Me's list on return (no entrance there) | `m.list.remove` | row fades 160 ms | none (v2 ENG-M10 removes the built `success`, `hidden.tsx:37`) | When the last hidden book leaves: M-C47's empty hand-off |
| M-C71 | C-S15.error | A setting could not be saved | The one line arrives beside the control | `m.enter` 280 ms | fade 200 ms | none | |

### C-S17 Recently deleted (NS-21-R7b, NS-36-R1a to R1c, NS-06-B25)

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C42 | C-S17.default | Restore a letter or a book | The row leaves; rows below close up; toast with the result line and "Open" | `m.list.remove` (built: `FadeOut` `exitMs` and `LinearTransition` on standard); `m.toast` | row fades (built uses 200 ms; v2 160 ms); no spring (built) | H-select (built `tap`) | "Open" is an action, so the toast has no timer (T4 met). In the Book the letter is simply back, with no `m.mark` |
| M-C43 | C-S17.default | Erase now, then the destructive choice | F6 `simple` native action sheet ("Keep it" default); the row leaves; toast without action | T-ALERT; `m.list.remove`; `m.toast` | system; row fade; toast no rise | H-warning after the choice (built plays it at the tap that opens the confirm, `recently-deleted.tsx:82` and `:104`: E6) | The toast leaves after its hold (4 s today, v2 `toast.holdMs`), never while a screen reader runs (built) |
| M-C44 | C-S17.error-erase_failed | Erase now could not remove the recording | Nothing leaves: the row stays exactly where it was; a toast says so | `m.toast` | toast no rise | none | A row that left and came back would read as a glitch |
| M-C47 | C-S17.default to the empty state | The last row leaves | The C8 `empty` state replaces the list as the row fades: drawing complete and still | `m.fade` 200 ms, starting with the row's exit | row fade, then 200 ms fade | as the act that emptied it | |
| M-C45 | C-S17 `.sealed` row (B-S22) | Restore or Erase now on a sealed letter | As M-C42 and M-C43; no envelope or seal imagery moves | as above | as above | as above | Recently deleted shows no words for it (B25) |
| M-C46 | C-S17 at day 30 | A purge while the page is open (rare) | The row is absent at the next render; a purge is never a moment | `m.instant` | same | none | |

### C-S18 Storage (NS-09-R6)

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C48 | C-S18.stuck to C-S18.default | Remove now succeeds | The stuck-recording row leaves | `m.list.remove` | row fades 160 ms | H-select | No second confirmation: the let-go was confirmed before. No toast (DESIGN) |
| M-C49 | C-S18.stuck to C-S18.stuckAgain | Remove now fails again | Nothing moves; the line stays as it was (card: "the same line; no error word") | `m.instant` | same | none | Card gap 5: proposed, VoiceOver re-reads the line so a VoiceOver user knows the tap landed; sighted feedback is the button's own press (`m.tap`) |

### C-S19 Erase everything on this phone (D1, NS-36, NS-01-R52)

Key moment: quiet and serious, never dramatic.

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C50 | C-S19.default, .signedin, .signedoutSynced | Open | Nothing: a still page. The destructive button never pulses, glows or shakes | `m.push` then still | system | none | |
| M-C51 | C-S19.confirm (F6 `explained`) | Tap Erase everything | The confirmation sheet: "Keep everything" first and the default, "Erase" destructive | `m.sheet` (system); `m.sheet.own` while `ui/sheet.tsx` remains | system reduced; fade 200 ms | none at the ask; H-warning after "Erase" | Built uses `Alert.alert` and plays `warning` when it opens (`erase.tsx:78`): E6 |
| M-C52 | C-S19.erasing | Erase confirmed | The sheet leaves; the C8 `loading` block ("Erasing") replaces the page; drawing still. No bar, no count, nothing disappearing item by item | sheet system; `m.fade` 200 ms | same | none (H-warning already played) | Back, swipe and Android back held (built). VoiceOver focus to the Erasing line. Built drawing breathes: E7 |
| M-C53 | C-S19.erasing to the age question (E area) | The erase ends | Whole-screen hand-off to the age question, which replaces every screen by itself (built). If the lamp is kept, it comes up as a return, never the 1.2 s arrival | `m.fade` 200 ms; lamp `returnMs` 280 ms (house proposal H1) | one 200 ms fade; lamp at level | none | `announce(doneA11y)` (built). No dawn, no "fresh start". If the erase ends in under 200 ms, the Erasing block still completes its fade before the hand-off: no flash |
| M-C54 | C-S19.error-failed | The erase did not finish | The page returns at its top with the one failure line first | `m.fade` 200 ms | same | none | No shake, no red flash; the line is first in VoiceOver order (built) |

### C-S20 Delete account (ruling D6, NS-10-R4a, NS-08-R16)

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C55 | C-S20.loading to C-S20.what | Open while the per-book lines load | A still line, then step 1 replaces it | `m.fade` 200 ms | same | none | Built shows an `ActivityIndicator` (`delete-account.tsx:115`): E2 |
| M-C56 | C-S20.what to C-S20.confirm | Continue | Step's words leave, the next step's words arrive; the buttons stay; VoiceOver focus to step 2's heading (built) | `m.step` (T-STEP): 160 then 280 | fade out 200, fade in 200 | none | No sideways slide that would suggest a wizard racing ahead |
| M-C57 | C-S20.confirm | Typing the word that enables Delete account | The button becomes filled `destructive` on the frame the word matches. No glow, pulse or colour tween | `m.instant` | same | none while typing | |
| M-C58 | C-S20.confirm to C-S20.sending | Tap Delete account | The button keeps its place; its label swaps to a static busy word; Keep my account is disabled while sending | label `m.swap` 150 ms | same | H-warning (built, on the press) | Area C choice (DESIGN): static busy label with `accessibilityState.busy`, never the system indicator v2 allows in a button (E2) |
| M-C59 | C-S20.sending to C-S20.scheduled | The request is accepted | The scheduled page replaces the step: the date, the D6 line (sealed letters are deleted with the account), Cancel deletion, Sign out of this phone | `m.fade` 200 ms | same | none | Nothing closes, empties or fades to black: the book is here until the date |
| M-C60 | C-S20.scheduled to C-S20.cancelled | Cancel deletion | The page's cancelled state replaces scheduled; a toast with the result line | `m.fade` 200 ms; `m.toast` | fades | none (v2 ENG-M10 removes the built `success`, `delete-account.tsx:155`) | |
| M-C61 | C-S20.error-failed, .error-offline | The request fails or the phone is offline | One failure line arrives beside the button that can try again; nothing else moves | `m.enter` 280 ms | fade 200 ms | none | Says nothing has changed (built) |
| M-C62 | C-S20.executing, .signedout, .notConfigured | Those states | The page's state is in place, or replaces another by a fade | `m.fade` 200 ms | same | none | |

### C-S21 Recording backup (flip only; `.absent` today, NS-08)

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C63 | C-S21.consent (flip) | After the first kept spoken letter (PROPOSED in NS-08) | The consent sheet | `m.sheet` | system reduced | none | Never in first run. Today `.absent`: nothing exists to move |
| M-C64 | C-S21.on (flip), uploads | Any upload | Nothing on screen: no indicator, badge or progress | none | none | none | NS-08 Reduce Motion row: "no upload animation; a static line". C-S09 is the only signal (M-C24) |
| M-C65 | C-S21.on to off (flip) | Stop backup, then the destructive choice | F6 confirmation; then the row's words | system; `m.swap` 150 ms | system; same | H-warning after the choice | Server copies are deleted on the published clock (D12) |

### C-S22 Delete this book

| Id | Screen.state | Trigger | What moves | Primitive and timing | Reduce Motion | Haptic | Notes |
|---|---|---|---|---|---|---|---|
| M-C66 | C-S22.exportFirst, C-S22.confirm (F6 `typed`) | Open; type the word | As M-C57: the button fills on the frame the word matches | `m.instant` | same | none | |
| M-C67 | C-S22 to C-S01 | Confirm | Back to Me (built `dismissTo`); the book's row is already gone on arrival; a toast that the book is in Recently deleted | system; `m.toast` | system reduced; toast no rise | H-warning (built, on the confirm) | No closing-cover animation (`BookCover animate={false}`, as built on these pages) |

Ids are those of this file's v1 (DESIGN.md already keys to some of them) and are never reused; items added in reconciliation take M-C68 to M-C72, so the tables are in screen order, not id order.

## 5. What never animates in this area

- No celebration: no confetti, burst, drawn check, bounce, sparkle, sound or `m.mark` on a copy made, a book arrived, a letter restored, a version restored or a book shown again.
- No counters: no rolling percentage, no "x of y letters", no arriving tally, no version count, no days-left countdown in Recently deleted or on the scheduled deletion page (v2 section 11: numbers change on the next frame).
- No countdown on any Undo.
- No drama on deletion: no shake, red flash, pulse, glow, hold-to-confirm ring, crumple, shred, bin, fly-away, fade-to-black, closing book cover or mood dimming of the lamp.
- No upload or download motion: no cloud, arrow, spinner, badge or progress for backup or for letters arriving.
- No loop: no breathing drawing, no sweep, no spinner in a block; no busy spinner in a button (area C choice).
- No motion on the provenance line (NS-08 design inputs).
- No entrance on a return: Me, the Book and Home never replay content on a tab change or a pop.
- No per-word or per-line motion of a letter's words (v2 section 11): an earlier version's words swap as one block.

## 6. Reduce Motion summary

Every row has its alternative. In one line: nothing we draw travels; entrances and exits become opacity (200 ms in, 160 ms out); `m.move` and `m.list.remove` close the gap on the next frame; progress jumps to each value; the lamp (if kept) is at its level at once; native pushes, sheets, action sheets and the share sheet follow the system's reduced transition. Area C has no loop to stop (NS-33-R5 is met by construction once E2 and E7 land).

## 7. VoiceOver and focus with motion

- Focus never waits for an animation: on a whole-state change it moves to the arriving block's heading at its mount, not at the end.
- Announcements: copy started (PROPOSED, E3), the F3 text value at most every 10 s, copy ready (built), erase done (built), each toast line once (built). Nothing announces an upload or an arrival.
- A leaving row or block leaves the accessibility tree on its first frame of exit.

## 8. Card gaps (cards are not changed; proposed defaults)

| # | Card row | What is missing | Proposed default |
|---|---|---|---|
| 1 | Ruling T4 (frame line 73; NS-33-R15) | Whether a window may close while VoiceOver focus rests on Undo | It does not close while focused there; it closes N seconds after focus leaves, or on the ruling's clock, whichever is later |
| 2 | NS-11 section 15, C28 4.6 | Whether progress may ease between readings, and how often | `m.progress` (200 ms linear per reading, never backwards), at most one reading per 250 ms; jumps under Reduce Motion; never indeterminate |
| 3 | NS-11 section 3 (Home slip order) | After the parent dismisses the slip, does the next slip appear in the same visit | No: the next slip shows on the next Home visit, so dismissing never makes something new slide in |
| 4 | NS-12 section 4 | Whether Restore offers Undo | No (agrees with DESIGN G11) |
| 5 | NS-09 table, "Remove now fails again" | No feedback that the tap landed | VoiceOver re-reads the line; `content` may propose a short in-place line (WORDS) |
| 6 | NS-10 sections 4 and 6 | How letters that arrive while the parent reads appear | In place, no entrance, no tint, scroll anchored, no count |
| 7 | Frame section 4 (Me, Look after) | Whether Me is a lit room | Unlit (pages on paper): the tabs lamp, if kept, leaves under it over 160 ms |
| 8 | NS-11 VoiceOver row | "Progress announced at start" has no line | A start line from `content`, announced once |
| 9 | NS-10 Reduce Motion row ("the indicator is static") | Implies a moving indicator otherwise | No moving indicator at all on C-S10 (v2 retires `Breathe`); the row is met with or without Reduce Motion |

## 9. Engineering gaps (the engineering plan is not changed)

| # | What the motion needs | Backlog row |
|---|---|---|
| E1 | The undo helper needs the time VoiceOver finished a line (`announcementFinished`, iOS) and whether Switch Control runs (no React Native API; a small native read of `UIAccessibility.isSwitchControlRunning` and its notification; UNVERIFIED on React Native 0.86). The toast and its action expire in the same frame | BL-954 (COMPONENTS F1, its row R2) |
| E2 | Remove loops Reduce Motion does not stop and that area C does not want: `ActivityIndicator` in `account.tsx:264` (sign-out waiting) and `delete-account.tsx:115` (page load), and `Button` `loading` on Delete account. Static line or label with `accessibilityState.busy` | BL-984 (NS-33-R5); BL-927 for the audit note |
| E3 | Save a copy and the printable book: announce at start; F3 `linear` with `m.progress` and a 250 ms reading throttle; one component for both | BL-942, BL-973 (COMPONENTS F3 `components/ui/progress.tsx`) |
| E4 | Me as a tab root: the lamp leaving under an unlit Me, if the lamp is kept | v2 ENG-M rows for the lamp (MOTION v2 section 10); BL-928 for Me |
| E5 | The Book keeps the reader's place while letters arrive (`maintainVisibleContentPosition` or equivalent) and gives synced-in letters on a new phone no tint (today the other parent's first-seen letters wash once, `book.tsx:157`) | BL-978 |
| E6 | H-warning after the destructive choice, never when the confirmation opens: `erase.tsx:78`, `recently-deleted.tsx:82` and `:104` | v2 ENG-M10 (haptic call sites) |
| E7 | `StateScreen` loading drawing still (v2 retires `Breathe`): C-S10.opening and C-S19.erasing | v2 ENG-M rows (MOTION v2 section 13) |
| E8 | Remove `success` on Show again (`hidden.tsx:37`), cancel deletion (`delete-account.tsx:155`) and `press` on export start (`export.tsx:110`) | v2 ENG-M10 |

## 10. House motion proposals (for the design system v2 MOTION.md)

- H1. After Erase everything, the lamp (if kept) returns over `returnMs`, never arrives over `arriveMs` (M-C53).
- H2. `m.progress` gets a reading throttle (250 ms) so a fast export does not ripple (M-C09).
- H3. Area C uses the Reduce Motion form of `m.progress.wait` at all times (static busy words). Proposed for every keeping, deletion and account surface in v2: a busy indicator next to the word "Delete" reads as hurry.

## 11. Superseded

- Built behaviour this file departs from, each listed with its gap: the breathing moon and Erasing drawing (E7); `ActivityIndicator`s (E2); `success` and `press` call sites (E8); `warning` at the ask (E6); `Alert.alert` for Erase everything (now F6 `explained`, DESIGN).
- `docs/design/specs/S17-NEW-PHONE-SPEC-10nov.md` (read for motion only): kept where the card agrees: "Nothing here adds motion", no count, no percentage, a spinner never appears (its lines 61, 84). Superseded where NS-10 differs: S17 lands on Tonight with no "still arriving" line (its line 120); NS-10 step 3 and R2 land on the Book with one line that more are on their way (M-C26 to M-C28). Its moon "breathes, still under Reduce Motion" (line 67) is superseded by v2's retirement of `Breathe`.
- This file's own v1 of earlier today: state names now follow DESIGN section 11; M-C ids are unchanged from v1, and new items are M-C68 to M-C72.
