# Area D: Family, sharing and reminders. Motion

Status: v1.1, 20 Nov 2026, reconciled. Motion lead, area D. Keyed to the screen ids and state names in `DESIGN.md` section 3 (D-S01 to D-S24, for example `D-S02.pictureOn`). Section 12 lists the reconciliation with `DESIGN.md` and the one difference left open. Motion ids (D-Mnn) are stable; new ones are appended.

Companion: `MOTION-PROTOTYPE.html` in this folder plays every item below on demand, with a Reduce Motion toggle, light and dark, and a slow-motion switch.

## 0. Sources read, and what wins

| Source | Used for |
|---|---|
| Cards NS-05 (sections 4 to 6, 7 R2, R10a, R13a, R22, 15), NS-25 (4 to 6, 15), NS-13 (3, 4, 5, 7 R9, 15), NS-18 (3 to 6), NS-32 (4, 5, 15), NS-07 C5 (3.4 to 3.7, 3.15) | Requirements. The only source of what must happen |
| `14-test-plan.md` J-N3, J-N4, J-N11, J-N15, J-N19, J-N24, J-N27 | The journeys this motion must survive on a device |
| `docs/design/MOTION.md` v0.2 (principles 1 to 6, 4, 5a, 5e, 5i, 5k, 5l rows 6, 9, 10, 11, 12, 6 haptics) | The house rules. Nothing here adds a new kind of move |
| `docs/design/SOUND.md` | `invite_accepted`, `gentle_error`; Paper sounds are off by default |
| `docs/design/NOTIFICATIONS.md` | The ask card as built, the landing rules |
| `packages/design-tokens/src/tokens.ts` `motion` | Every number below. No number in this file is new except where section 7 proposes a token |
| Built code: `components/asks/reminder-prime-ask.tsx`, `components/ui/sheet.tsx`, `components/ui/toast.tsx`, `lib/transitions.logic.ts`, `lib/motion.ts`, `lib/haptics.shared.ts`, `app/(tabs)/index.tsx` (quiet day), `app/invite/index.tsx`, `app/invite/new.tsx`, `components/family/join-ask.tsx`, `app/family.tsx`, `app/settings/reminders.tsx`, `lib/reminders/scheduler.ts`, `lib/billing/plan-reminders.ts` | The baseline. Where this file asks for a change to built motion it says so and names the reason |
| `docs/design/specs/03-SHARE-ONE-LETTER-11nov.md` section 5 | History. Superseded in two places (section 9) |

Where the house `MOTION.md` still says "Tonight" or "the Family tab", read Home and the family page: three tabs (Home, Book, Me), and family is never a tab (brief section 2). The lamp scene names (`tonight`, `family`) are code names and stay.

## 1. The area in one paragraph

Area D is mostly outputs and quiet signals: a letter leaves through the parent's own share sheet, another parent joins, a notification arrives and is tapped, a quiet day is kept. None of it is a celebration. The motion here does three jobs only: say where you are after a hand-off to the system and back (share sheet, iOS alert, notification tap), let a change of state read as one calm act (a sheet step, a row arriving, a line replacing a link), and keep the lamp from cutting. Everything else is still.

## 2. Tokens used (values copied from `tokens.motion`)

| Token | Value | Used here for |
|---|---|---|
| `standard` spring | stiffness 260, damping 30, mass 1 (ratio 0.93; settles to 1 percent in about 290 ms, computed in the prototype) | Our sheets rising, rows collapsing (layout) |
| `snappy` spring | 520, 46, 1 (ratio 1.0; about 190 ms) | Press feedback |
| `gentle` spring | 90, 18, 1 (ratio 0.95; about 560 ms) | Not used in area D (named so nobody reaches for it) |
| `press` | scale 0.97 controls, 0.98 cards, on `snappy` | Share control, invite row, reminder rows |
| `fadeMs` | 200 | Reduce Motion cross-fade; a sheet step replacing the last; our sheet under Reduce Motion |
| `exitMs` | 160 | Transient UI leaving: a toast, a row, the quiet link |
| `enter` | opacity 0 to 1, y 8 to 0, 280 ms, easing (0.2, 0, 0, 1) | Content arriving: a row, a toast, the typed-day line |
| `staggerMs` / `staggerMax` | 30 / 6 | Home's cold-launch entrance only |
| `swapMs` | 150 | Words replaced in place: toast over toast, the "Next" line, the picker swap |
| `newMarkMs` | 1600 | The accentSoft wash on the other parent's first row |
| `lamp.leaveMs` / `returnMs` / `arriveMs` / `dimTo` | 160 / 280 / 1200 / 0.7 | Lamp under covers, tab settles, first lit room, the quiet-day dim |
| `cover.holdMs` / `cover.dx` | 300 / 8 | The joined book cover opening (as built from S08) |
| `sequenceMaxMs` / `hardCeilingMs` | 900 / 2000 | Ceilings for any sequence |
| easing | cubic-bezier(0.2, 0, 0, 1) | Every timed move |

## 3. Rules for this area

1. **System moments are the system's.** The iOS share sheet, the iOS notification permission alert, the lock screen, opening the app from a notification and the date and time wheels move as iOS moves them. We add nothing on top and remove nothing. Reduce Motion there is Apple's.
2. **A hand-off to the system and back lands where it left.** After the share sheet, the alert or Settings, the screen underneath is unchanged and still. Content never re-enters on a return (house 5l rule 2), and focus goes back to the control that started it.
3. **No receipt for what we cannot know.** A share or an invite link handed to the share sheet shows no tick, toast, haptic or sound for "sent" (NS-05-R22). The app does not know it was sent.
4. **Steps in one sheet are one act.** A new step fades in over the last over `fadeMs`; the sheet itself does not move again.
5. **Rows arrive and leave; the list closes up.** A new row enters with `enter`; a removed row leaves over `exitMs` and the rows under it close up on the `standard` layout spring. Under Reduce Motion the row fades and the list jumps.
6. **Controls never animate in** (house principle 2). The Share control, Continue, Not now, the ask's answers, Undo and every button are opaque and hittable from the first frame the screen or step is.
7. **Under 300 ms unless named.** Every move in this area is at or under 300 ms except the six named in section 6, each of which is existing house motion, and each is listed for a ruling.
8. **Reduce Motion: nothing we control travels.** Every custom move becomes one `fadeMs` cross-fade or an instant change; the lamp jumps to its level; loops stop and rest still. One mechanism: `useMotion()` (house section 4).

## 4. Every transition and feedback moment

Columns: Id; Screen and state (DESIGN ids); Trigger; What moves (in order); Duration and easing; Reduce Motion; Haptic and sound. "None" means none, on purpose.

### 4.1 Share one letter (NS-05; D-S01 to D-S03)

| Id | Screen, state | Trigger | What moves | Duration, easing | Reduce Motion | Haptic, sound |
|---|---|---|---|---|---|---|
| D-M01 | D-S01 (letter page action row, Share present) | Touch down on "Share this letter" | The control scales to `press.scale` 0.97 and back on release | `snappy` both ways | Opacity to `press.opacity` 0.9 instead of scale, same timing | None (opening a sheet is navigation, house 6) |
| D-M02 | D-S01.default -> D-S02.pictureOff (or `.wordsOnly`) | Tap on Share | The preview sheet rises from the bottom; the scrim (`scrim` token) fades in with it; the letter page keeps its place and its light (a sheet is not an unlit room, house 5k). Sheet content is in place on the first frame: title, the words, the words row, the picture toggle, the version line, the where-it-goes line, Continue and Not now. No entrance inside the sheet. On screen within p95 300 ms of the tap (NS-05-R23): the sheet mounts at once and the spring carries it | `standard` spring rise (about 290 ms); scrim opacity 0 to 1 over `fadeMs` | Sheet and scrim fade in over `fadeMs`, no travel (`ui/sheet.tsx` as built) | None on open |
| D-M03 | D-S02.pictureOff -> D-S02.pictureOn | The parent turns on "Include the picture" | The native switch moves as iOS moves it. The 64 x 64 thumbnail (1 pt hairline frame) appears at once inside the preview card under the signature; the card reflows at once. Nothing of ours animates (card 15: "system sheet only") | Instant; the switch is the system's | Same | The native switch's own; we add none |
| D-M04 | D-S02.pictureOn -> D-S02.pictureOff | Toggle off | The thumbnail is removed at once; the card closes up at once | Instant | Same | The native switch's own |
| D-M05 | D-S02.pictureOn -> D-S02.error-share_temp_write_failed | Continue, and the temporary picture copy fails | The share sheet does not open. The caution line (with its `WarningCircle` icon; `shareCopy.letter.pictureFailed`) replaces the thumbnail in place: words replaced in place, so a cross-fade, no travel. The toggle returns to off (the native switch moves as iOS moves it). VoiceOver announces the line. Continue and Not now stay where they are; the next Continue sends words only | `swapMs` 150 cross-fade | Instant swap | None and no sound: it is information, the words still go (`gentle_error` is for a failure the parent fixes, SOUND 4; nothing to fix here) |
| D-M06 | D-S02 -> D-S03 (iOS share sheet) | Continue | The iOS share sheet rises as iOS presents it. In the same moment our preview and its scrim fade out in place over `exitMs` (opacity only, no travel), so only one thing moves: iOS's sheet. The share sheet is presented from the letter page, never over our sheet (DESIGN G-D01; this also removes the E8 risk). We add no dim of our own: iOS draws its own | iOS's own (opens within 1 s of Continue, NS-05-R11); our fade 160 ms | iOS's own reduced presentation; our fade the same (already opacity only) | None (see section 12: `DESIGN.md` D-S02 still says `tap` on Continue) |
| D-M07 | D-S03.completed -> D-S01.default (return) | The share sheet completes: sent, cancelled or failed, all identical to us (R3b: the result is not read) | iOS lowers its sheet onto the letter page, which has not moved. Focus returns to the Share control. No toast, no banner, no line, no wash | iOS's own | iOS's own | None and no sound (NS-05-R22). The temp file is deleted in the completion handler (R10a), never visibly |
| D-M08 | D-S02 -> D-S01 (decline) | Not now, swipe down, scrim tap, escape gesture | The sheet exits; the letter page is unchanged; focus returns to Share | `standard` exit, scrim over `exitMs` | Fade out over `fadeMs` | None |
| D-M09 | D-S02.long | Very long letter | The words scroll inside the preview; Continue and Not now stay pinned (card 5). The scroll is the platform's; no follow, no auto-scroll | Platform | Platform | None |
| D-M10 | D-S02 interrupted (call, the baby, app to background) | App leaves the foreground with the preview or the share sheet up | Nothing. On return everything is where it was (card 6, Interrupted). With App lock on, the switcher snapshot is blank (R14): that blank is a still layer, not a transition | None | None | None |

### 4.2 The other parent: invite, join, undo (NS-25; D-S12 to D-S20)

All of this exists only where the door rule shows it (alpha and servers on, D-162 draft; NS-25-R1, R12). In a store build there is nothing here to animate, and no "coming soon" frame.

| Id | Screen, state | Trigger | What moves | Duration, easing | Reduce Motion | Haptic, sound |
|---|---|---|---|---|---|---|
| D-M11 | D-S12.one-parent (Me, the book's page: "Write this book together") | Touch down on the row | The shared `ListRow` press, as the component does it today (no new feedback for this row) | Component's own | Component's own | None |
| D-M12 | D-S12 -> D-S13.default (invite sheet) | Tap the row | The `invite` route presents as a modal sheet: the platform's rise (`routeTransitions`, row 10, `move: 'sheet'`). Me keeps its plain paper (Me has no lamp). The sheet's words, including the R16 line about what the other parent will read, are there on the first frame; nothing inside enters | iOS modal rise | iOS's own reduced presentation | None |
| D-M13 | D-S13.default -> D-S13.loading -> iOS share sheet -> D-S13 | "Share invite link" | The button's label is replaced in place by `family.create.working` (`swapMs` cross-fade; the button keeps its size). Then iOS's share sheet over ours. If dismissed without sending, our sheet stays at Share with the same draft, still (built `afterShare`) | Label `swapMs`; iOS's own | Instant label swap; iOS's own | None. **Change from built:** `app/invite/new.tsx:131` plays `success` when the share sheet reports sent. That is a receipt for something the app cannot verify (rule 3), and `success` is reserved for a letter saved (`haptics.shared.ts`). Drop it |
| D-M14 | D-S13.sent -> D-S18.pending (or the book's page that opened it) | Share sheet reports the link went | Our sheet closes (platform); the page under it shows its toast `family.create.done` (D-M24); the pending invite row enters on the family page (D-M21) | Platform close; toast and row as their own items | Platform; fades | None |
| D-M15 | D-S15.loading -> D-S15.default | Invite link opens the app; the `invite` sheet rises | Sheet: platform rise. The first view adds no entrance. `family.accept.peeking` with the system activity indicator (iOS's own spin; no count, no bar of ours) | Platform | Platform (the system indicator follows iOS) | None |
| D-M16 | Every change inside the one join sheet: D-S15.signed-out, .loading, .default, each `.error-<code>`, .paused, .offline; D-S16.joining, .needs-sync, each `.error-<code>` | A step or state change | The new view fades in over the last, in place; the sheet does not move or resize with a spring (built `JoinStep`: `fadeMs`). "Join the book" becoming `family.accept.joining` is a label swap (`swapMs`) in a button that keeps its size | `fadeMs` 200 linear; label `swapMs` | Same fade (already the reduced form); label instant | None. Errors are lines in the view: no shake, no red flash, no sound |
| D-M17 | D-S16.joining -> D-S17.arriving | Join succeeds (one membership, NS-25-R10) | 1. Haptic and, only if Paper sounds is on, `invite_accepted`, on the commit, before anything moves (house principle 3). 2. The arrival view fades in (`fadeMs`). 3. The book cover (132 x 176) fades in with the child's name (`fadeMs`), holds `cover.holdMs` 300, then the front cross-fades to the flyleaf with an 8 pt (`cover.dx`) shift on `standard` (built `JoinedCover`, as S08). This is the first frame the child's name shows on this phone (R2) | About 800 ms in all, under `sequenceMaxMs` 900. Over 300 ms: section 6 | The cover is shown open at once; the view arrives in one `fadeMs` fade; no hold, no shift | `success` (`notificationAsync(Success)`); sound `invite_accepted` (700 ms) only with Paper sounds on, never on the inviter's phone, never twice per invite (SOUND 4) |
| D-M18 | D-S17.arriving and D-S17.slow (sync brings the book) | Joined, and the book is still arriving | A thin bar (3 pt, `line` track) with an `accent` segment a third of its width sweeps slowly back and forth. No number, no percent, no count (no counters, ever). Hidden from VoiceOver; the waiting line is announced once instead | One sweep 1400 ms, ease in-out, repeating while waiting. Over 300 ms and a loop: listed in section 6 | The segment rests still at the start. Also still under Low Power Mode once the guard exists (section 8, E10) | None |
| D-M19 | D-S17.joined -> Book (first view for this parent) | "Open the book" (after the sign-off field, which is still: no entrance) | The join sheet closes (platform). The Book is the tab under it; its lamp arrives from 0 to 0.6 over `lamp.arriveMs` (house 5l row 12: the second parent's first Book). The Book's cards are in place; nothing enters but the light | Sheet: platform. Lamp: 1200 ms, M3 easing. Over 300 ms: section 6 | The lamp is at 0.6 at once; the sheet follows the system's reduced close | None (the joined moment already had its haptic) |
| D-M20 | D-S18 (family page) open | From the book's page in Me (D-S12, two parents or an open invite) | Native push (house row 9). The family page shares the tabs' light (`persistKey` "tabs"): it never re-arrives; its still `family` scene settles to 0.4 over `returnMs` | Push: iOS. Lamp: 280 ms | Push: iOS reduced. Lamp: at 0.4 at once | None |
| D-M21 | D-S18 pending invite row appears | A link was just shared (D-M14), or the list loads with a new row after it was first shown | The row enters (`enter`: opacity 0 to 1, y 8 to 0). Rows below make room on the `standard` layout spring | 280 ms, M3 easing; layout `standard` | Row fades in over `fadeMs`; the list jumps | None |
| D-M22 | D-S18 the other parent's first row on this phone | First time this phone lists the co-parent | The row enters (`enter`) and carries the `accentSoft` wash, which fades over `newMarkMs`, once ever per co-parent per phone (built, S57) | Enter 280 ms; wash 1600 ms opacity fade. Over 300 ms: section 6 | The row is in place; the wash shows still, then fades (it is already only opacity) | None |
| D-M23 | D-S18 Cancel invite | Cancel invite, confirmed in the system alert | The system alert closes (iOS). The pending row leaves (`exitMs` fade), the rows under it close up (`standard`); the toast `family.pending.cancelled` enters | Exit 160 ms; layout `standard`; toast 280 ms | Row fades out over `fadeMs`; list jumps; toast fades | **Change from built:** `app/family.tsx:237` plays `soft`. A confirmed destructive act is `warning` (house 6). Use `warning`, on the commit |
| D-M24 | Toast on D-S18 (or the page under the invite sheet) | Any closing line (`family.create.done`, `family.pending.cancelled`, `family.undoJoin.done`) | Toast enters with `enter`, leaves with `exitMs`; a new toast cross-fades over one on screen (`swapMs`), never stacked (house row 11). A toast with no action leaves after its time, never while VoiceOver is running; with an action it stays (T4) | 280 / 160 / 150 ms | Fades only | None on show |
| D-M25 | D-S18.undo-open -> D-S19.default | "Undo join" (`family.undoJoin.button`) under the co-parent's row (inviter only, inside 72 hours; `.undo-closed` has no control, R13). The row's `family.undoJoin.window` line is still: a deadline, never a ticking countdown | The confirm sheet rises (`ConfirmSheet`, our sheet: `standard`; scrim `fadeMs`). It says what happens to the other parent's letters before the buttons | `standard` | Fade over `fadeMs` | None on open |
| D-M26 | D-S19.working -> D-S19.done -> D-S18 | "Undo join" | Commit first, then: `warning` haptic; the sheet exits; the co-parent row leaves (`exitMs`) and the list closes up (`standard`); toast `family.undoJoin.done`, announced (D-M24). Their letters leave the book at the next sync, quietly; nothing else animates. Errors (`.error-SCPAR`, `.error-network`, `.error-unknown`) are lines in the sheet (`swapMs`), no shake | Exit 160; layout `standard` | Fades; list jumps | `warning` on the commit only; none on an error |
| D-M27 | D-S20.default (the other parent's phone after an undo) | Next sync after P1 undid the join | One `AppNote` line at the top of the Book for that book fades in once (`fadeMs`) and is not shown again (no exit animation: it is simply absent on the next visit). The book leaves the switcher with no animation. No alert, no sound, no haptic: this phone did not act | `fadeMs` | Same fade | None |

### 4.3 Reminders: the ask, settings, typed days (NS-13, NS-18, NS-32; D-S04 to D-S09)

| Id | Screen, state | Trigger | What moves | Duration, easing | Reduce Motion | Haptic, sound |
|---|---|---|---|---|---|---|
| D-M28 | D-S04 timing (sheet over the Book) | The first kept letter, when `nextAsk` returns the reminder prime | The ask waits for the save to finish arriving: never during the saved moment (house 5e) or over the Book's arrival before it lands, and not before VoiceOver has finished announcing the arrival. It rises once the Book's lamp has returned (`returnMs` after the Book is focused); the 1.6 s wash may still be fading under the scrim. One ask per session (built cap of 2 ever, NS-13-R31) | Wait: arrival end plus `returnMs` (280 ms) | Same wait (the arrival under Reduce Motion is shorter, so the ask comes sooner) | None |
| D-M29 | D-S04.default rise | As above | The ask sheet rises from the bottom with its scrim; no close button and no swipe (only an answer closes it, `dismissible={false}`). The bell circle is still: no ring, no shake, no wiggle. The rhythm line, "Change the time" and the two equal answers are in place from the first frame | `standard` rise; scrim `fadeMs` | Sheet and scrim fade in over `fadeMs`, no travel. **Change from built:** `reminder-prime-ask.tsx` uses React Native `Modal` with `animationType="slide"` and a `bg-black/30` scrim: the scrim slides up with the card, the scrim colour is not the `scrim` token, and our Reduce Motion fade does not apply. Move the card into `ui/sheet.tsx` with `dismissible={false}` (section 8, E1) | None on open |
| D-M30 | D-S04.default -> D-S04.pickTime | "Change the time" (a control, not an answer) | The rhythm line (`onboarding.reminder.rhythmLine`) is replaced in place by `timeLabel` with the system compact picker: a cross-fade, no travel. If the sheet needs more height it grows on the `standard` layout spring, bottom-anchored, so it grows upward and the two answers under the finger do not move. Opening the picker's popover is iOS's own motion (D-S07) | Cross-fade `swapMs` 150; height `standard` | Instant height; cross-fade `swapMs` | None (opening a control is not an outcome) |
| D-M31 | D-S04 -> D-S05 (iOS alert) | "Yes, evenings" (with the chosen time, if changed) | Commit the choice first. The sheet exits (`standard`, scrim `exitMs`). Then iOS presents its own permission alert, only the first time; our sheet never sits under the alert | Sheet exit `standard`; alert: iOS | Sheet fades over `fadeMs`; alert: iOS | `tap`. Equal answers get equal feedback: "No reminders" plays the same `tap` (**change from built**: today it plays none, which makes yes feel heavier than no) |
| D-M32 | D-S05 -> D-S04.after-yes, .after-yes-denied or .after-yes-failed (toasts over the Book) | iOS answers (or did not need to ask) | The alert goes (iOS). The outcome toast enters: `reminderCopy.settings.onToast` with Change, `notSendingYet` with Open Settings, or `scheduleFailed` with Try again (D-M24 rules; with an action it stays, T4) | Toast `enter` | Fade | None (the outcome is words; no `success`: that is for a letter) |
| D-M33 | D-S04 -> D-S04.after-no | "No reminders" | Sheet exits; the help toast `onboarding.reminder.noneHelp` enters (no action) | As D-M31, D-M32 | Fades | `tap` (see D-M31) |
| D-M34 | D-S06 open | Me, Reminders | Native push (row 9). Me has plain paper: no lamp move. The screen's content is in place; nothing staggers | iOS push | iOS reduced | None |
| D-M35 | D-S06.off -> D-S06.on: choices reveal | The Reminders switch turns on | The choices (How it will look, Next, How often, Which evenings, Time, Month and birthday messages, Names) appear under the switch with one opacity fade, no rise and no height spring (card 15: "Motion: none"; read as nothing travels) | `fadeMs` opacity | Instant | The native switch's own |
| D-M36 | D-S06.on -> D-S06.off: choices hide | Switch off | The choices fade out over `exitMs`, then the page closes up at once. "Days to remember" stays if it has days (`.off-withDays`) | `exitMs` | Instant | The native switch's own |
| D-M37 | D-S06 "Next" line and "How it will look" (`NotificationPreview`) | Any change of cadence, day, time, names or month notes | The Next line and the preview's words cross-fade in place. VoiceOver hears "Saved. Next: ..." 600 ms after the last change (built). Never a number counting down, never a calendar animating. In `.backedOff` the Next line is simply not drawn (no exit animation, no line about absence) | `swapMs` 150 | Instant swap (built) | `tap` on a chip or choice (ChoiceGroup) |
| D-M38 | D-S06.denied -> D-S06.on (and `.error-schedule_failed` -> `.on` after Try again) | Permission granted from iOS Settings, back in the app; or Try again succeeds | The card fades out over `exitMs`, the page closes up at once. **Change from built:** today the rows under it move up on `LinearTransition` 280 ms; card 15 says motion none, so they close up at once | `exitMs` | Instant | None |
| D-M39 | D-S06 -> iOS Settings -> D-S06 | "Open Settings" | System leave and return. On return nothing re-enters (rule 2); a changed permission shows by D-M38 | iOS | iOS | None |
| D-M40 | D-S07.default (system compact time picker, in D-S04.pickTime and D-S06) | Tap the time | iOS's compact picker opens its own popover wheel and moves as iOS moves it, 07:00 to 21:30 in 15-minute steps only. We add no sheet and no motion | iOS | iOS | The wheel's own detents; we add none |
| D-M41 | D-S06 -> D-S08.default (Add a day) | "+ Add a day" | Our sheet rises (`standard`); the date picker is the system's compact picker; the words field has writing tools off (D2, engineering gap E-D06). Nothing in the sheet enters | `standard` | Fade `fadeMs` | None |
| D-M42 | D-S08.filled -> D-S06.typedDays-list (saved) | Save | Commit first. The sheet exits; the new row in "Days to remember" enters in date order (`enter`), rows below make room (`standard` layout). With notifications not allowed (`.notAllowed`) the same: Save works and its line was already shown in the sheet | Exit `standard`; row 280 ms; layout `standard` | Fades; list jumps | `tap` |
| D-M43 | D-S08.error-typed_day_empty, `.error-typed_day_past`, `.error-typed_day_too_long`, `.error-schedule_failed` | Save refused | The line appears in place above Save: one `swapMs` fade. No shake, no red flash, no counter appearing. The sheet stays; the words stay | `swapMs` | Instant | None (a validation hint is never `gentle_error`, SOUND 4) |
| D-M44 | D-S09.default -> D-S09.confirm -> D-S06 | Tap a typed day; "Delete this day" | The detail is a `ConfirmSheet`-shaped sheet (rises on `standard`). Delete: commit, `warning`, the sheet exits, the row leaves (`exitMs`), the list closes up (`standard`). "Keep it" closes the sheet with nothing else moving | Sheet `standard`; row 160 ms; layout `standard` | Fades; list jumps | `warning` on Delete; none on Keep it |
| D-M45 | Back-off and stop (NS-13 3a; J-N4); D-S06.backedOff | Days pass | Nothing. No screen, line, dimming, fading bell or animation says reminders slowed or stopped (card 15: "back-off invisible") | None | None | None |
| D-M64 | D-S08.default <-> D-S08.showWords | "Show my words in the notification" | The native switch moves; the `NotificationPreview` words cross-fade in place between the fixed line and the parent's words, unchanged (NS-18-R3) | `swapMs` | Instant swap | The native switch's own |

### 4.4 Notifications and landing from a tap (NS-13-R9, NS-18-R1, NS-32; D-S10, D-S11, D-S24)

| Id | Screen, state | Trigger | What moves | Duration, easing | Reduce Motion | Haptic, sound |
|---|---|---|---|---|---|---|
| D-M46 | D-S10 (lock screen, Notification Centre) | A note is delivered | iOS draws and moves it. Ours: silent (`sound: null`), no badge (`shouldSetBadge: false`, no count ever), interruption level `active`, never time-sensitive (NS-13-R20). No custom sound file, no rich media, no animated attachment | iOS | iOS | None from us. Paper sounds never play for a notification |
| D-M47 | D-S10.evening -> D-S11.home (warm: app was in the background) | Tap an evening nudge | iOS opens the app (its own zoom from the notification). The app comes forward on Home: if another tab was showing, the tab swaps natively (no slide) and the lamp settles from the last tab's light to Home's over `returnMs` (house row 6). Home's content does not re-enter (rule 2): the prompt is simply there. Within 2 s on an SE 3 (NS-13-R9) | iOS; lamp 280 ms | iOS reduced; lamp at its level at once | None |
| D-M48 | D-S10.evening -> D-S11.home (cold start) | Tap an evening nudge, app not running | iOS's launch. Home is the first lit room after a cold launch: the lamp arrives over `arriveMs`; the dateline, greeting and prompt enter once (`enter`, 30 ms stagger, all in under 400 ms; house 5a). Speak and Type are there from the first frame and never animate in | Content 280 ms plus 2 x 30 ms stagger; lamp 1200 ms (section 6) | One `fadeMs` fade of the content; lamp at its level at once | None |
| D-M49 | D-S10.monthAge, .together or .birthday -> D-S11.book (warm) | Tap a month or birthday note | The Book tab comes forward with the native swap; the lamp settles to the Book's still 0.6 over `returnMs`. The Book stays at its current position (DESIGN D-S11: no target letter, no scroll animation, no wash: nothing new was made) | iOS; lamp 280 ms | Lamp at once | None |
| D-M50 | D-S10.monthAge, .together or .birthday -> D-S11.book (cold start) | Tap a month or birthday note, app not running | The Book is the first lit room: its lamp arrives over `arriveMs`; the first Book view of the session lets the cover settle as house 5a says (opacity 0.6 to 1, y 6 to 0, `gentle`). **Engineering gap:** today a cold-start tap on a month or birthday note opens Home, because `scheduler.ts` only listens for responses while running and does not read the last response at launch (section 8, E2) | Lamp 1200 ms; cover `gentle` | One `fadeMs` fade; lamp at once | None |
| D-M51 | D-S10.typedDay -> D-S11.typedDay (warm) | Tap a typed-day note | As D-M47, and the parent's typed words ("Nursery starts", `TypedDayLine`) show above the prompt. The line belongs to that local day, not to the tap: whenever Home opens that day it is already in place with no entrance. It enters only if it appears while Home is on screen (the day's delivery while Home is open, or a warm tap with Home showing): then it fades and rises once (`enter`) and the prompt moves down to make room on the `standard` layout spring. It leaves the next day with no exit animation. The words never animate per word or per letter (the app adds nothing to them; constitution) | 280 ms; layout `standard` | Line fades in over `fadeMs`; prompt jumps | None |
| D-M52 | D-S10.typedDay -> D-S11.typedDay (cold start) | Tap a typed-day note, app not running | The line joins Home's cold-launch entrance as the item before the prompt (still under `staggerMax` 6 and under 400 ms in all) | As D-M48 | As D-M48 | None |
| D-M53 | D-S11 landing while a capture is open (Listen, Review, Write) | Tap any of our notes while a letter is being made | Nothing navigates. The app comes forward on the open capture, unchanged; no sheet closes, no dissolve plays. A typed-day line waits on Home for the rest of that local day (card gap, section 9 G6) | None | None | None |
| D-M54 | D-S10.plan -> D-S11.plan (Settings, Plan, E-S11; D-S24) warm | Tap a plan notice | Tab swap to Me (native, no slide), then the Plan page pushes (row 9) | iOS | iOS reduced | None |
| D-M55 | D-S10.plan -> D-S11.plan cold start | Tap a plan notice, app not running | Settings, Plan is shown directly: no Home frame first and no visible push (the push for this one landing uses `animation: 'none'`). **Engineering gap:** today `plan-reminders.ts` navigates after a 0 ms timeout at launch, so Home can show for a frame and the push slides (section 8, E3) | None of ours | Same | None |
| D-M65 | D-S11.appLock | Any tap while App lock is on | App lock's own screen comes first and moves as area C/E specify it; nothing of the landing shows behind it (no Home or Book frame under a translucent lock). After unlock the landing plays as its warm form (D-M47, D-M49, D-M51 or D-M54), never the cold-launch entrance a second time | App lock's own; then the warm landing | App lock's reduced form; then the warm landing's | None from area D |

### 4.5 Quiet days (NS-07 C5; D-S21, D-S22)

| Id | Screen, state | Trigger | What moves | Duration, easing | Reduce Motion | Haptic, sound |
|---|---|---|---|---|---|---|
| D-M56 | D-S21.default -> D-S21.kept | Tap "Not much today" | Commit first (one write). Then `soft` haptic and the VoiceOver announcement of `notMuch.savedToast`. The link fades out; the kept line with Undo fades in, in the same place, as a hand-off (house: never two lines of words at full strength together). Proposed timing so the line is on screen and readable within 100 ms (NS-07-C5-13): link out over 80 ms (half `exitMs`); line in from 40 ms over `exitMs` 160 ms; done by 200 ms. **Change from built:** today the line starts at 80 ms and fades over 200 ms, so at 100 ms it is at one tenth of its strength (section 9 G3). Speak and Type do not move | Link 80 ms; line 160 ms from 40 ms; M3 easing; under 300 ms | The same opacity hand-off (it is already opacity only, `ReduceMotion.Never`, as built) | `soft` (as built; in the haptics vocabulary for "Not much today"). No sound |
| D-M57 | D-S21 evening light | Same tap, in the evening daypart | Home's lamp dims to `lamp.dimTo` 0.7 of the evening level (S33): the lights go down a little. Opacity only | `lamp.arriveMs` 1200 ms, M3 easing. Over 300 ms: section 6 | The lamp is at its new level at once | None |
| D-M58 | D-S21.kept -> D-S21.default (Undo) | Undo (no timer: it stays while Home stays, T4 met) | Commit the removal first. The kept line fades out, the link fades back in, same hand-off timing as D-M56 reversed; the evening light rises back over `arriveMs` | As D-M56; lamp 1200 ms | Opacity hand-off; lamp at once | `tap` (Undo is in the `tap` vocabulary). **Change from built:** `undoNotMuch` plays none |
| D-M59 | D-S21 second tap same day | n/a: the link is gone while the line shows; on a later visit the same day Home shows the kept line with no entrance | Nothing | None | None | None |
| D-M60 | D-S22.default and D-S22.consecutive (Book row "A quiet day") | The Book shows a quiet day | Nothing beyond the Book's own list behaviour (in place on a return; the chapter's first-6 `enter` only when a chapter is opened, owned by area B). No `newMarkMs` wash (a quiet day is not celebrated), no draw-on mark, no connecting line or run between consecutive quiet days (C5-9), no count | None | None | None |
| D-M61 | D-S22 row removed when words arrive that day | A letter is kept the same day | The quiet row is gone the next time the Book is shown; the letter takes the day with its own arrival (area A's 5e wash). The quiet row never animates out in front of the parent | None | None | None |
| D-M66 | D-S22.default -> D-S22.menu -> D-S22.removed | Long press on the row; "Remove this mark" | The long-press menu is the system's context menu (iOS lifts and blurs as it does). Remove: commit, the row leaves (`exitMs`), the list closes up (`standard`), the built toast enters (D-M24) | System menu; row 160 ms; layout `standard` | System reduced menu; fades; list jumps | `soft` on the long press (house 6); none on Remove (the toast is the receipt; it is not a destructive loss of words: the mark has none) |
| D-M67 | D-S21.default -> D-S21.error-save_failed | The local write fails | `notMuch.saveFailed` replaces the link in place (`swapMs`), with Try again; Home stays; the lamp does not dim (nothing was kept) | `swapMs` | Instant | None (the `soft` haptic plays only after a successful commit, house principle 3); no sound |

### 4.6 The pilot artefacts (NS-03; D-S23)

| Id | Screen, state | What moves |
|---|---|---|
| D-M62 | D-S23 (consent message, instructions, check-ins) | Nothing: these are messages and documents outside the app. No animated GIF, no motion in any artefact |
| D-M63 | D-S23 export of one letter | If the pilot uses the app's Share one letter, D-M01 to D-M10 apply unchanged |

## 5. Never animate in area D

- No celebration: no confetti, burst, sparkle, check-mark draw, bounce, glow pulse or "sent" tick after a share, an invite or a join. The join's cover opening is the one moment, and it is a book opening, not applause.
- No counters: no number ticking up or down anywhere (pending invites, notifications, days until a typed day, back-off weeks, quiet days, letters shared). No badge on the app icon or a tab.
- No ceremony around notifications: no ringing or wiggling bell, no pulsing Share control, no coach mark, no "try sharing" spotlight, no animated hint on the first kept letter.
- No motion that says time has passed or something is missing: no fading reminders as they back off, no dimming of a book that gets no reminders, no run or chain drawn between quiet days.
- No word animates: letter words in the share preview, the typed-day words and notification text are never typed on, revealed word by word, or highlighted (constitution: nothing suggests the machine is writing).
- No loop where nothing is happening: the only loop in the area is the waiting bar while a book really is arriving, and it stops under Reduce Motion.
- No movement of our own over a system surface: share sheet, alerts, lock screen, the date and time wheels.

## 6. Over 300 ms: the named exceptions (for a ruling)

Every other item is at or under 300 ms. These six are existing house motion; none is new in this area. I recommend keeping 1 to 4 and asking for a ruling on 5 and 6.

| # | Item | Length | Why it is longer | Reduce Motion | Recommendation |
|---|---|---|---|---|---|
| 1 | Lamp arrival on a cold-start landing (D-M48, D-M50) and the second parent's first Book (D-M19) | 1200 ms (`lamp.arriveMs`) | Light, not movement; decorative opacity of one layer; house 5k and row 12 | Jumps to level | Keep |
| 2 | Quiet-day dim and its Undo (D-M57, D-M58) | 1200 ms | Lights going down for the evening (S33); a fast dim would read as an alarm | Jumps | Keep |
| 3 | The co-parent's first-row wash (D-M22) | 1600 ms (`newMarkMs`) | A fading highlight, same as a new letter; opacity only; once per co-parent per phone | Shows still, then fades | Keep |
| 4 | Home's cold-launch entrance (D-M48, D-M52) | under 400 ms | House 5a; only on a cold launch | One fade | Keep |
| 5 | The joined cover opening (D-M17) | about 800 ms (200 fade, 300 hold, about 300 spring) | Built from first run's S08; the one moment a book opens for a second parent. Under `sequenceMaxMs` | Open at once | Rule. If the 300 ms ceiling must hold, drop the hold and let the cover arrive open with one `fadeMs` fade |
| 6 | The waiting bar sweep (D-M18) | 1400 ms per sweep, repeating | Waiting is real (sync), so the loop follows a signal (house principle 1); a faster sweep reads as urgency | Still | Rule, and make it a token (section 8, E4) |

System presentations (iOS share sheet, alert, modal rise, push, opening from a notification) are iOS's and are not counted. Our `standard` spring settles to 1 percent in about 290 ms (computed, see the prototype's readout).

## 7. Haptics and sound for area D, in one table

House policy: a haptic marks an outcome, never a navigation. Paper sounds are off by default and never play during capture or playback.

| Moment | Haptic | Sound (only with Paper sounds on) | Id |
|---|---|---|---|
| Share control, Continue, Not now, preview open and close | None | None | D-M01, D-M06, D-M08 |
| Picture toggle | The native switch's own | None | D-M03 |
| Share sheet completes | None (NS-05-R22) | None | D-M07 |
| Picture could not be added | None | None | D-M05 |
| Invite link sent | None (change from built `success`) | None | D-M13 |
| Joined a book | `success` | `invite_accepted` | D-M17 |
| Cancel invite (confirmed) | `warning` (change from built `soft`) | None | D-M23 |
| Undo join (confirmed) | `warning` | None | D-M26 |
| Reminder ask: either answer | `tap`, the same for both (change from built: "No reminders" had none) | None | D-M31, D-M33 |
| Reminder ask: "Change the time" | None (opens a control) | None | D-M30 |
| Reminder settings: chip or choice | `tap` | None | D-M37 |
| Typed day saved | `tap` | None | D-M42 |
| Typed day deleted (confirmed) | `warning` | None | D-M44 |
| Quiet-day row: long press; Remove this mark | `soft`; none | None | D-M66 |
| A failed save of a quiet day | None | None | D-M67 |
| A notification arrives | None (silent, no badge) | None | D-M46 |
| Landing from a tap | None | None | D-M47 to D-M55 |
| Not much today | `soft` | None | D-M56 |
| Undo a quiet day | `tap` (change from built: none) | None | D-M58 |

`success` stays reserved for a saved letter and, by SOUND.md's own row, a join. No new sound is proposed.

## 8. Engineering gaps

| # | Gap | Where | Backlog row it belongs to |
|---|---|---|---|
| E1 | The reminder ask is a React Native `Modal` with `animationType="slide"` and a `bg-black/30` scrim: the scrim slides with the card, the colour is not the `scrim` token, and our Reduce Motion fade cannot apply. Move it into `ui/sheet.tsx` with `dismissible={false}` | `components/asks/reminder-prime-ask.tsx:96-98` | BL-943 (NS-13) |
| E2 | Cold start from a tapped evening, month or birthday note: the scheduler only adds a response listener while running and has no `getLastNotificationResponse()` read at launch, so a cold tap on a month or birthday note lands on Home, not the Book (NS-13-R9). Read and clear the last response at launch, as `plan-reminders.ts` does, and land without a visible push | `lib/reminders/scheduler.ts:253-261` | BL-943 (NS-13-R9) |
| E3 | Cold start from a plan notice navigates after a 0 ms timeout, so Home can show for a frame and the push slides. Land on Me, Plan as the first route, or push with `animation: 'none'` for that one landing | `lib/billing/plan-reminders.ts:134-140` | BL-966 (NS-32; `payments` owns the module) |
| E4 | The waiting bar's sweep is a hard-coded `SWEEP_MS = 1400` in a component. Screens never type a duration (house section 3). Propose `tokens.motion.waitSweepMs: 1400` with its test (design systems owns the token) | `components/family/join-ask.tsx:64` | NS-25 co-parent rows BL-882 to BL-889 (token: design systems) |
| E5 | Invite link sent plays `success` | `app/invite/new.tsx:131` | BL-882 to BL-889 |
| E6 | Cancel invite plays `soft`; a confirmed destructive act is `warning` | `app/family.tsx:237` | BL-882 to BL-889 |
| E7 | Quiet day: the hand-off timing (D-M56) to meet C5-13, and `tap` on Undo (D-M58) | `app/(tabs)/index.tsx:222-238` | BL-974 (NS-07 C5) |
| E8 | Share: on Continue, start the preview's fade-out and present the share sheet from the letter page in the same frame (D-M06), so the system sheet is never presented over our `BottomSheetModal` (whether it can be is UNVERIFIED and no longer needed). The completion handler deletes the temp file and does nothing visible; it never reads the result (R3b) | `lib/share/*`, the letter page | BL-939 (NS-05) |
| E9 | The typed-day line on Home: enters once on a warm landing (D-M51), joins the cold-launch entrance (D-M52), never re-enters on a tab return | `app/(tabs)/index.tsx` | BL-982 (NS-18) |
| E10 | Low Power Mode guard for the one loop in the area (D-M18) | `lib/motion.ts` (`useLowPowerMode`, engineering plan item 9; needs `expo-battery`, UNVERIFIED as installed) | Bucket E (engineering plan item 9) |
| E11 | Reminder settings: replace the `LinearTransition` close-up and the rising reveal with opacity only (D-M35, D-M36, D-M38), per card 15 | `app/settings/reminders.tsx:199-216` | BL-943 |
| E12 | A notification tap during Listen, Review or Write must not navigate (D-M53). Today both listeners call `router.navigate` whatever is open | `lib/reminders/scheduler.ts:257`, `lib/billing/plan-reminders.ts:131-133` | BL-943, BL-966 |

## 9. Card gaps

| # | Card row | What is missing or ambiguous | Proposed default |
|---|---|---|---|
| G1 | NS-05 section 15 ("Motion: system sheet only; Reduce Motion follows the system") and section 10 ("a preview sheet component reusing the existing sheet") | The existing sheet is ours (`ui/sheet.tsx`), not the system's; under Reduce Motion it fades over `fadeMs` by our code, not the system's | Use `ui/sheet.tsx` as built: `standard` rise, `fadeMs` fade under Reduce Motion. Read "system sheet" as "the house sheet, no custom motion inside it" |
| G2 | NS-05 section 4 step 7 | Silent on what the parent sees after the iOS sheet closes: the preview again, or the letter page | Same as `DESIGN.md` G-D01: the preview fades out as the share sheet is presented, so whatever the outcome (the app cannot tell outcomes apart without reading what R3b forbids it to use) the parent returns to the unchanged letter page; focus on Share |
| G3 | NS-07-C5-13 ("the kept line is visible within 100 ms") with the built delayed fade | "Visible" is not defined for a fading line | Visible means mounted, announced and at least a third of its strength by 100 ms; D-M56's timing meets it (line at about 0.4 at 100 ms, full at 200 ms) |
| G4 | NS-13 section 15 ("Motion: none") against built settings motion (rising reveal, `LinearTransition`) | Whether "none" forbids the opacity fades the house uses for every reveal | Nothing travels; opacity only (D-M35 to D-M38) |
| G5 | NS-18 section 4 step 3 ("Home shows Nursery starts above the prompt") | How long the line stays, and whether it moves the prompt | Settled with `DESIGN.md` D-S11.typedDay: for that local day, whenever Home opens; it enters only if it appears while Home is on screen (D-M51), the prompt making room on `standard`; gone the next day with no exit animation |
| G6 | NS-13-R9, NS-18-R1, NS-32 | Silent on a tap while a letter is being made (Listen, Review, Write open) | Do not navigate; land on what is open; a typed-day line waits on Home for that day (D-M53) |
| G7 | NS-25 section 6 ("Reduce Motion: No new motion") | The built join already has a cover opening and a waiting loop | Keep them as built with their reduced forms (D-M17, D-M18); exceptions 5 and 6 for a ruling |
| G8 | NS-13 section 4 step 1 ("After keeping a first letter, the ask card offers reminders") | Where the ask rises and when | Settled with `DESIGN.md` D-S04: a sheet over the Book, rising only once the save's arrival has landed (D-M28) |
| G9 | NS-32 section 15 | Landing from a plan notice is not described in NS-32 | Me, Plan, shown directly on a cold start (D-M55) |

## 10. Superseded

| Older source | Said | Now | Why |
|---|---|---|---|
| `specs/03-SHARE-ONE-LETTER-11nov.md` section 5 | Haptic `tap` on Continue | None | House 6: a haptic marks an outcome; Continue is a step, and NS-05-R22 wants no feedback that suggests "sent" |
| Same, section 5 | Preview updates with a `swapMs` cross-fade when a row is toggled | Instant (D-M03, D-M04) | NS-05 section 15 (card wins): no custom motion in the share flow |
| `docs/design/MOTION.md` 5l table, "the Family tab" | A tab with its own lamp | The family page is a pushed route (D-M20); three tabs only | Brief section 2; built `app/family.tsx` header |
| `docs/design/specs/06-HOME-BOOK-ME-IA-11nov.md` section 7 ("Tab switch motion: `swapMs` 150 cross-fade") | A cross-fade between tabs | The native swap with the lamp settling (house 5l row 6), used by D-M47, D-M49, D-M54 | The house standard and the built code; area E owns tabs, flagged for their reconciliation |

## 11. Accessibility notes that touch motion

- VoiceOver: no landing or step change moves focus while an announcement is speaking. After D-M07 and D-M08 focus returns to Share; after D-M17 to the joined heading; after D-M47 to D-M52 to the screen's first heading (Home's dateline, the Book's header); after D-M56 VoiceOver announces the kept line and focus stays on the place of the link (now Undo).
- Undo windows (T4): the quiet day's Undo has no timer; a toast with an action never times out; a toast without one never leaves while VoiceOver is running.
- AX5 on an SE 3: no motion depends on layout size; the share preview's pinned buttons, the ask's stacked answers and the reminder chips move the same way at every size. Font size never animates (house 7).
- Reduce Transparency and Increase Contrast: the lamp is plain paper, so D-M19, D-M48, D-M50, D-M57 and D-M58's light changes do nothing.
- Smart Invert: the share preview's picture is exempt; nothing in the motion depends on colour.
- Switch Control: every step change leaves the scan on the first control of the new step; nothing moves while the scanner is on a control.

## 12. Reconciliation with DESIGN.md and WORDS.md

Done against `DESIGN.md` section 3 (state names) and sections 4, 9, 10, and `WORDS.md` section 14, as they stood at the end of this run.

| Topic | Settled as | Where |
|---|---|---|
| State names | `DESIGN.md` section 3 is the set this file uses (`D-S02.pictureOff`, `.pictureOn`, `.error-share_temp_write_failed`; `D-S04.default`, `.pickTime`, `.after-yes`, `.after-yes-denied`, `.after-yes-failed`, `.after-no`; `D-S11.home`, `.typedDay`, `.book`, `.plan`, `.appLock`; `D-S17.arriving`, `.slow`, `.joined`; `D-S21.default`, `.kept`, `.error-save_failed`; `D-S22.menu`, `.removed`). My working names from v1 are gone | Section 4 |
| Share hand-off | The preview fades out (opacity, `exitMs`) as iOS presents its share sheet from the letter page; on any completion the parent is back on the unchanged letter page, focus on Share (`DESIGN.md` G-D01, D-S03) | D-M06, D-M07, G2, E8 |
| Picture could not be added | Stays on the preview; the line replaces the thumbnail; the toggle returns to off; the next Continue sends words (`DESIGN.md` G-D03) | D-M05 |
| Reminder ask | Over the Book; two equal answers plus "Change the time" (a control); no "Set reminder"; the picker opens in place (`DESIGN.md` D-S04, G-D04) | D-M28 to D-M33 |
| Time picker | The system compact picker, not a sheet of ours (`DESIGN.md` D-S07) | D-M40 |
| Join | Peek and agreement are one sheet, no Continue step; the sign-off field is in `D-S17.joined` (`DESIGN.md` D-S15, D-S16) | D-M15 to D-M17, D-M19 |
| After an undo, the other parent's phone | One `AppNote` line, once, then absent (`DESIGN.md` D-S20) | D-M27 |
| Typed-day line | Belongs to the local day, shows whenever Home opens that day (`DESIGN.md` D-S11) | D-M51, G5 |
| Words | Every message this file names is a `WORDS.md` key; no announcement here carries its own words | Section 4 |

Open differences (for Karma):

1. **Haptic on Continue in the share preview.** `DESIGN.md` D-S02 says "Haptic: `tap` on Continue only", carried from the 11 Nov spec. This file says none (D-M06): house policy is that a haptic marks an outcome and Continue is a step, and NS-05-R22 asks for nothing that reads as "sent". Haptics are the motion file's to own (brief section 4); I recommend `DESIGN.md` drops the line.
2. **State names differ between the other two files.** `WORDS.md` uses a few names `DESIGN.md` section 3 does not (`D-S04.yes-failed`, `.no`, `.picking`; `D-S18.twoParents-undoable`; `D-S21.error-save`; `D-S11.evening`; `D-S17.ready`), and `DESIGN.md` section 5.1 itself says `D-S11.evening` where its section 3 says `.home`. This file follows `DESIGN.md` section 3 throughout; whichever set Karma fixes, a rename here is mechanical.
3. **Exceptions 5 and 6 (section 6)** need a ruling: the joined cover's 800 ms opening and the 1400 ms waiting sweep.
