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
| D-M03 | D-S02.picture-off -> D-S02.picture-on | The parent turns on "Include the picture" | The native switch moves as iOS moves it. The picture thumbnail (with its 1 pt hairline frame in dark mode) appears at once in its row; the preview reflows at once. Nothing of ours animates (card 15: "system sheet only") | Instant; the switch is the system's | Same | The native switch's own; we add none |
| D-M04 | D-S02.picture-on -> D-S02.picture-off | Toggle off | The thumbnail is removed at once; the preview closes up at once | Instant | Same | The native switch's own |
| D-M05 | D-S02.picture-failed | Continue, and the temporary picture copy fails (`share_temp_write_failed`) | The line "The picture could not be added this time. The words will go." replaces the picture row in place; the toggle leaves with it. Words replaced in place, so a cross-fade, no travel | `swapMs` 150 cross-fade | Instant swap | None and no sound: it is information, the words still go, and the parent has nothing to fix (`gentle_error` is for failures the parent can fix now, SOUND 4) |
| D-M06 | D-S02 -> D-S03 (iOS share sheet) | Continue | Our preview stays where it is. The iOS share sheet rises over it, as iOS presents it. We start nothing else: no fade of our sheet, no dim of our own (iOS draws its own) | iOS's own (opens within 1 s of Continue, NS-05-R11) | iOS's own reduced presentation | None. (Supersedes the 11 Nov spec's `tap` on Continue: Continue is a step, not an outcome, house 6) |
| D-M07 | D-S03 -> D-S01 (return) | The share sheet completes: sent, cancelled or failed, all the same to us (R3b: the result is not read) | iOS lowers its sheet. Then our preview closes the way a sheet closes, onto the letter page, which has not moved. Focus returns to the Share control. No toast, no banner, no line, no wash | iOS's own; then our sheet exits on `standard` with the scrim fading over `exitMs` | iOS's own; then our sheet and scrim fade out over `fadeMs` | None and no sound (NS-05-R22). The temp file is deleted in the completion handler (R10a), never visibly |
| D-M08 | D-S02 -> D-S01 (decline) | Not now, swipe down, scrim tap, escape gesture | The sheet exits; the letter page is unchanged; focus returns to Share | `standard` exit, scrim over `exitMs` | Fade out over `fadeMs` | None |
| D-M09 | D-S02.long | Very long letter | The words scroll inside the preview; Continue and Not now stay pinned (card 5). The scroll is the platform's; no follow, no auto-scroll | Platform | Platform | None |
| D-M10 | D-S02 interrupted (call, the baby, app to background) | App leaves the foreground with the preview or the share sheet up | Nothing. On return everything is where it was (card 6, Interrupted). With App lock on, the switcher snapshot is blank (R14): that blank is a still layer, not a transition | None | None | None |

### 4.2 The other parent: invite, join, undo (NS-25; D-S12 to D-S20)

All of this exists only where the door rule shows it (alpha and servers on, D-162 draft; NS-25-R1, R12). In a store build there is nothing here to animate, and no "coming soon" frame.

| Id | Screen, state | Trigger | What moves | Duration, easing | Reduce Motion | Haptic, sound |
|---|---|---|---|---|---|---|
| D-M11 | D-S12 (Me, the other parent row) | Touch down on the invite row | Row press: `press.scale` 0.97 on `snappy` (list rows: background tint only if the shared `ListRow` does that today; follow the component) | `snappy` | Opacity 0.9, no scale | None |
| D-M12 | D-S12 -> D-S13 (invite sheet) | Tap the row | The `invite` route presents as a modal sheet: the platform's rise (`routeTransitions`, row 10, `move: 'sheet'`). Me keeps its plain paper (Me has no lamp). The sheet's words, including the line about what the other parent will read (NS-25-R16), are there on the first frame; nothing inside enters | iOS modal rise | iOS's own reduced presentation | None |
| D-M13 | D-S13 -> iOS share sheet -> D-S13 | "Share invite link" | As D-M06 and D-M07: iOS's sheet over ours. If dismissed without sending, our sheet stays at Share with the same draft, still (built `afterShare`) | iOS's own | iOS's own | None. **Change from built:** `app/invite/new.tsx:131` plays `success` when the share sheet reports sent. That is a receipt for something the app cannot verify (rule 3), and `success` is reserved for a letter saved (`haptics.shared.ts`). Drop it |
| D-M14 | D-S13 -> D-S18 (or the screen that opened it) | Share sheet reports the link went | Our sheet closes (platform); the page under it shows its toast "The invite waits until they join." (D-M24); the pending invite row enters on the family page (D-M21) | Platform close; toast and row as their own items | Platform; fades | None |
| D-M15 | D-S15 (peek) loading -> peek | Invite link opens the app; the `invite` sheet rises | Sheet: platform rise. The first step adds no entrance. "Opening the invite" is a line, not a spinner of ours; if it lasts, the line stays still | Platform | Platform | None |
| D-M16 | D-S15 -> D-S16 (accept) and every later step (paste, sign in, consent, error per code, paused) | Each step change inside the one join sheet | The new step fades in over the last, in place; the sheet does not move or resize with a spring (built `JoinStep`: `fadeMs`) | `fadeMs` 200, linear opacity | Same fade (it is already the reduced form) | None. Errors (`SCINV`, `SCCAP`, expired, offline, paused) are lines in the step, no shake, no red flash, no sound |
| D-M17 | D-S16 -> D-S17.joined | Agree succeeds (one membership, NS-25-R10) | 1. Haptic and, only if Paper sounds is on, `invite_accepted`, on the commit, before anything moves (house principle 3). 2. The joined step fades in (`fadeMs`). 3. The book cover (132 x 176) fades in with the child's name (`fadeMs`), holds `cover.holdMs` 300, then the front cross-fades to the flyleaf with an 8 pt (`cover.dx`) shift on `standard` (built `JoinedCover`, as S08) | About 800 ms in all, under `sequenceMaxMs` 900. Over 300 ms: listed in section 6 | The cover is shown open at once; the step arrives in one `fadeMs` fade; no hold, no shift | `success` (`notificationAsync(Success)`); sound `invite_accepted` (700 ms) only with Paper sounds on, never on the inviter's phone, never twice per invite (SOUND 4) |
| D-M18 | D-S17.waiting (sync brings the book) | Joined, and the book is still arriving | A thin bar (3 pt, `line` track) with an `accent` segment a third of its width sweeps slowly back and forth. No number, no percent, no count (no counters, ever). Hidden from VoiceOver; the waiting line is announced once instead | One sweep 1400 ms, ease in-out, repeating while waiting. Over 300 ms and a loop: listed in section 6 | The segment rests still at the start. Also still under Low Power Mode once the guard exists (section 8, E10) | None |
| D-M19 | D-S17 -> Book (first view for this parent) | "Open the book" | The join sheet closes (platform). The Book is the tab under it; its lamp arrives from 0 to 0.6 over `lamp.arriveMs` (house 5l row 12: the second parent's first Book). The Book's cards are in place; nothing enters but the light | Sheet: platform. Lamp: 1200 ms, M3 easing. Over 300 ms: section 6 | The lamp is at 0.6 at once; the sheet follows the system's reduced close | None (the joined moment already had its haptic) |
| D-M20 | D-S18 (family page) open | From a book's settings row | Native push (house row 9). The family page shares the tabs' light (`persistKey` "tabs"): it never re-arrives; its still `family` scene settles to 0.4 over `returnMs` | Push: iOS. Lamp: 280 ms | Push: iOS reduced. Lamp: at 0.4 at once | None |
| D-M21 | D-S18 pending invite row appears | A link was just shared (D-M14), or the list loads with a new row after it was first shown | The row enters (`enter`: opacity 0 to 1, y 8 to 0). Rows below make room on the `standard` layout spring | 280 ms, M3 easing; layout `standard` | Row fades in over `fadeMs`; the list jumps | None |
| D-M22 | D-S18 the other parent's first row on this phone | First time this phone lists the co-parent | The row enters (`enter`) and carries the `accentSoft` wash, which fades over `newMarkMs`, once ever per co-parent per phone (built, S57) | Enter 280 ms; wash 1600 ms opacity fade. Over 300 ms: section 6 | The row is in place; the wash shows still, then fades (it is already only opacity) | None |
| D-M23 | D-S18 Cancel invite | Cancel invite, confirmed in the system alert | The system alert closes (iOS). The pending row leaves (`exitMs` fade), the rows under it close up (`standard`); the toast "Invite cancelled." enters | Exit 160 ms; layout `standard`; toast 280 ms | Row fades out over `fadeMs`; list jumps; toast fades | **Change from built:** `app/family.tsx:237` plays `soft`. A confirmed destructive act is `warning` (house 6). Use `warning`, on the commit |
| D-M24 | Toast on D-S18 (or the page under the invite sheet) | Any closing line ("The invite waits until they join.", "Invite cancelled.") | Toast enters with `enter`, leaves with `exitMs`; a new toast cross-fades over one on screen (`swapMs`), never stacked (house row 11). A toast with no action leaves after its time, never while VoiceOver is running; with an action it stays (T4) | 280 / 160 / 150 ms | Fades only | None on show |
| D-M25 | D-S18 -> D-S19 (undo join, within 72 hours only) | "Undo" on the co-parent row (visible only inside 72 hours; NS-25-R13: no control after) | The confirm sheet rises (`ConfirmSheet`, our sheet: `standard`; scrim `fadeMs`). It says what happens to the other parent's letters before the button (door lines) | `standard` | Fade over `fadeMs` | None on open |
| D-M26 | D-S19 -> D-S18 after undo | Confirm | Commit first, then: `warning` haptic; the sheet exits; the co-parent row leaves (`exitMs`) and the list closes up (`standard`); one line says what changed (toast, D-M24). Nothing about the other parent's letters is animated away from view on this phone beyond the row: their letters leave the book at the next sync, quietly | Exit 160; layout `standard` | Fades; list jumps | `warning` |
| D-M27 | D-S20 (the other parent's phone after an undo) | Next sync after P1 undid the join | One plain line fades in once where the book was, and stays until dismissed (built `NOTE_IN`: `fadeMs`). The book leaves the switcher with no animation. No alert, no sound, no haptic: this phone did not act | `fadeMs` | Same fade | None |

### 4.3 Reminders: the ask, settings, typed days (NS-13, NS-18, NS-32; D-S04 to D-S09)

| Id | Screen, state | Trigger | What moves | Duration, easing | Reduce Motion | Haptic, sound |
|---|---|---|---|---|---|---|
| D-M28 | D-S04 timing | The first kept letter, when `nextAsk` returns the reminder prime | The ask waits for the save to finish arriving: never during the saved moment (house 5e) or the Book's arrival wash, and not before VoiceOver has finished announcing the arrival. It rises once the arrival has landed (the Book's lamp returned, `returnMs` after the Book is focused) or, if `DESIGN.md` puts it on Home, after Home is focused and still. One ask per session (built cap of 2 ever, NS-13-R31) | Wait: arrival end plus `returnMs` (280 ms) | Same wait (the arrival under Reduce Motion is shorter, so the ask comes sooner) | None |
| D-M29 | D-S04.default rise | As above | The ask sheet rises from the bottom with its scrim; no close button and no swipe (only an answer closes it, `dismissible={false}`). The bell mark is still: no ring, no shake, no wiggle. The three answers are in place from the first frame, equal | `standard` rise; scrim `fadeMs` | Sheet and scrim fade in over `fadeMs`, no travel. **Change from built:** `reminder-prime-ask.tsx` uses React Native `Modal` with `animationType="slide"` and a `bg-black/30` scrim: the scrim slides up with the card, the scrim colour is not the `scrim` token, and our Reduce Motion fade does not apply. Move the card into `ui/sheet.tsx` with `dismissible={false}` (section 8, E1) | None on open |
| D-M30 | D-S04.default -> D-S04.pick-time | "Pick a time" | The two upper answers are replaced in place by the time row and "Set reminder": a cross-fade, no travel; the sheet grows to fit on the `standard` layout spring (bottom-anchored, so it grows upward and nothing under the finger moves). "No reminders" stays where it is | Cross-fade `swapMs` 150; height `standard` | Instant height; cross-fade `swapMs` | `tap` (a choice made; ChoiceGroup's tick) |
| D-M31 | D-S04 -> D-S05 (iOS alert) | "Yes, evenings" or "Set reminder" | Commit the choice first. The sheet exits (`standard`, scrim `exitMs`). Then iOS presents its own permission alert (only the first time; house rule: our sheet never sits under the alert). | Sheet exit `standard`; alert: iOS | Sheet fades over `fadeMs`; alert: iOS | `tap` on the answer (as built). Equal choices get equal feedback: "No reminders" plays the same `tap` (**change from built**: today it plays none, which makes yes feel heavier than no) |
| D-M32 | D-S05 -> the screen under it, with the outcome toast | iOS answers (or did not need to ask) | The alert goes (iOS). The outcome toast enters: "Reminders are on. Next: ..." with Change, or "Notifications are off" with Open Settings, or the failure line with Try again (D-M24 rules) | Toast `enter` | Fade | None (the outcome is words; no `success`: that is for a letter) |
| D-M33 | D-S04 -> the screen under it ("No reminders") | "No reminders" | Sheet exits; the help toast enters (`onboarding.reminder.noneHelp`) | As D-M31, D-M32 | Fades | `tap` (see D-M31) |
| D-M34 | D-S06 open | Me, Reminders | Native push (row 9). Me has plain paper: no lamp move. The screen's content is in place; nothing staggers | iOS push | iOS reduced | None |
| D-M35 | D-S06 switch on: choices reveal | The Reminders switch turns on | The choices (How it will look, Next, How often, Which evenings, Time, Month and birthday messages, Names) appear under the switch with one opacity fade, no rise and no height spring (card 15: "Motion: none"; read as nothing travels) | `fadeMs` opacity | Instant | The native switch's own |
| D-M36 | D-S06 switch off: choices hide | Switch off | The choices fade out over `exitMs`, then the page closes up at once | `exitMs` | Instant | The native switch's own |
| D-M37 | D-S06 "Next" line and the live preview | Any change of cadence, day, time, names or month notes | The Next line and the preview's words cross-fade in place. VoiceOver hears "Saved. Next: ..." 600 ms after the last change (built). Never a number counting down, never a calendar animating | `swapMs` 150 | Instant swap (built) | `tap` on a chip or choice (ChoiceGroup) |
| D-M38 | D-S06.denied card leaving | Permission granted from iOS Settings, back in the app | The "Notifications are off" card fades out over `exitMs`, the page closes up at once. **Change from built:** today the rows under it move up on `LinearTransition` 280 ms; card 15 says motion none, so they close up at once | `exitMs` | Instant | None |
| D-M39 | D-S06 -> iOS Settings -> D-S06 | "Open Settings" | System leave and return. On return nothing re-enters (rule 2); a changed permission shows by D-M38 | iOS | iOS | None |
| D-M40 | D-S06 -> D-S07 (hour picker) | Tap Time | Our sheet rises (`standard`); the wheel is the system's and moves as iOS moves it, 07:00 to 21:30 in 15-minute steps only | `standard` | Fade `fadeMs` | The wheel's own detents; we add none |
| D-M41 | D-S06 -> D-S08 (Add a day) | "Add a day" | Our sheet rises (`standard`); the date picker is the system's; the words field is a plain field (no writing tools, D2 applies only to letter fields, but none are offered here either). Nothing in the sheet enters | `standard` | Fade `fadeMs` | None |
| D-M42 | D-S08 -> D-S06 (saved) | Save | Commit first. The sheet exits; the new typed day row enters the list in date order (`enter`), rows below make room (`standard` layout) | Exit `standard`; row 280 ms; layout `standard` | Fades; list jumps | `tap` |
| D-M43 | D-S08.error (a day in the past; iOS refused) | Save refused | The line appears in place under the field: one `swapMs` fade. No shake, no red flash | `swapMs` | Instant | None (a validation hint is never `gentle_error`, SOUND 4) |
| D-M44 | D-S09 delete | Delete, confirmed | Commit, `warning`, the row leaves (`exitMs`), list closes up (`standard`) | 160 ms; `standard` | Fade; jump | `warning` |
| D-M45 | Back-off and stop (NS-13 3a; J-N4) | Days pass | Nothing. No screen, line, dimming, fading bell or animation says reminders slowed or stopped (card 15: "back-off invisible") | None | None | None |

### 4.4 Notifications and landing from a tap (NS-13-R9, NS-18-R1, NS-32; D-S10, D-S11, D-S24)

| Id | Screen, state | Trigger | What moves | Duration, easing | Reduce Motion | Haptic, sound |
|---|---|---|---|---|---|---|
| D-M46 | D-S10 (lock screen, Notification Centre) | A note is delivered | iOS draws and moves it. Ours: silent (`sound: null`), no badge (`shouldSetBadge: false`, no count ever), interruption level `active`, never time-sensitive (NS-13-R20). No custom sound file, no rich media, no animated attachment | iOS | iOS | None from us. Paper sounds never play for a notification |
| D-M47 | D-S10 -> D-S11.home (warm: app was in the background) | Tap an evening nudge | iOS opens the app (its own zoom from the notification). The app comes forward on Home: if another tab was showing, the tab swaps natively (no slide) and the lamp settles from the last tab's light to Home's over `returnMs` (house row 6). Home's content does not re-enter (rule 2): the prompt is simply there. Within 2 s on an SE 3 (NS-13-R9) | iOS; lamp 280 ms | iOS reduced; lamp at its level at once | None |
| D-M48 | D-S10 -> D-S11.home (cold start) | Tap an evening nudge, app not running | iOS's launch. Home is the first lit room after a cold launch: the lamp arrives over `arriveMs`; the dateline, greeting and prompt enter once (`enter`, 30 ms stagger, all in under 400 ms; house 5a). Speak and Type are there from the first frame and never animate in | Content 280 ms plus 2 x 30 ms stagger; lamp 1200 ms (section 6) | One `fadeMs` fade of the content; lamp at its level at once | None |
| D-M49 | D-S10 -> D-S11.book (warm) | Tap a month or birthday note | The Book tab comes forward with the native swap; the lamp settles to the Book's still 0.6 over `returnMs`. The Book opens at its top (no target letter, no scroll animation, no wash: nothing new was made) | iOS; lamp 280 ms | Lamp at once | None |
| D-M50 | D-S10 -> D-S11.book (cold start) | Tap a month or birthday note, app not running | The Book is the first lit room: its lamp arrives over `arriveMs`; the first Book view of the session lets the cover settle as house 5a says (opacity 0.6 to 1, y 6 to 0, `gentle`). **Engineering gap:** today a cold-start tap on a month or birthday note opens Home, because `scheduler.ts` only listens for responses while running and does not read the last response at launch (section 8, E2) | Lamp 1200 ms; cover `gentle` | One `fadeMs` fade; lamp at once | None |
| D-M51 | D-S11.home-typed-day (warm) | Tap a typed-day note | As D-M47, and the parent's typed words ("Nursery starts") show above the prompt. If Home was already on screen, the line enters once (`enter`) and the prompt moves down to make room on the `standard` layout spring; if Home was not on screen, the line is simply there when Home comes forward (no entrance on a tab return). The words never animate per word or per letter (the app adds nothing to them; constitution) | 280 ms; layout `standard` | Line fades in over `fadeMs`; prompt jumps | None |
| D-M52 | D-S11.home-typed-day (cold start) | Tap a typed-day note, app not running | The line joins Home's cold-launch entrance as the item before the prompt (still under `staggerMax` 6 and under 400 ms in all) | As D-M48 | As D-M48 | None |
| D-M53 | D-S11 landing while a capture is open (Listen, Review, Write) | Tap any of our notes while a letter is being made | Nothing navigates. The app comes forward on the open capture, unchanged; no sheet closes, no dissolve plays. A typed-day line waits on Home for the rest of that local day (card gap, section 9 G6) | None | None | None |
| D-M54 | D-S10 -> D-S24 (Me, Plan) warm | Tap a plan notice | Tab swap to Me (native, no slide), then the Plan page pushes (row 9) | iOS | iOS reduced | None |
| D-M55 | D-S10 -> D-S24 cold start | Tap a plan notice, app not running | Me, Plan is shown directly: no Home frame first and no visible push (the push for this one landing uses `animation: 'none'`). **Engineering gap:** today `plan-reminders.ts` navigates after a 0 ms timeout at launch, so Home can show for a frame and the push slides (section 8, E3) | None of ours | Same | None |

### 4.5 Quiet days (NS-07 C5; D-S21, D-S22)

| Id | Screen, state | Trigger | What moves | Duration, easing | Reduce Motion | Haptic, sound |
|---|---|---|---|---|---|---|
| D-M56 | D-S21 link -> kept line | Tap "Not much today" | Commit first (one write). Then `soft` haptic and the VoiceOver announcement "A quiet day, kept.". The link fades out; the kept line with Undo fades in, in the same place, as a hand-off (house: never two lines of words at full strength together). Proposed timing so the line is on screen and readable within 100 ms (NS-07-C5-13): link out over 80 ms (half `exitMs`); line in from 40 ms over `exitMs` 160 ms; done by 200 ms. **Change from built:** today the line starts at 80 ms and fades over 200 ms, so at 100 ms it is at one tenth of its strength (section 9 G3). Speak and Type do not move | Link 80 ms; line 160 ms from 40 ms; M3 easing; under 300 ms | The same opacity hand-off (it is already opacity only, `ReduceMotion.Never`, as built) | `soft` (as built; in the haptics vocabulary for "Not much today"). No sound |
| D-M57 | D-S21 evening light | Same tap, in the evening daypart | Home's lamp dims to `lamp.dimTo` 0.7 of the evening level (S33): the lights go down a little. Opacity only | `lamp.arriveMs` 1200 ms, M3 easing. Over 300 ms: section 6 | The lamp is at its new level at once | None |
| D-M58 | D-S21 kept line -> link (Undo) | Undo (no timer: it stays while Home stays, T4 met) | Commit the removal first. The kept line fades out, the link fades back in, same hand-off timing as D-M56 reversed; the evening light rises back over `arriveMs` | As D-M56; lamp 1200 ms | Opacity hand-off; lamp at once | `tap` (Undo is in the `tap` vocabulary). **Change from built:** `undoNotMuch` plays none |
| D-M59 | D-S21 second tap same day | n/a: the link is gone while the line shows; on a later visit the same day Home shows the kept line with no entrance | Nothing | None | None | None |
| D-M60 | D-S22 Book row "A quiet day" | The Book shows a quiet day | Nothing beyond the Book's own list behaviour (in place on a return; the chapter's first-6 `enter` only when a chapter is opened, owned by area B). No `newMarkMs` wash (a quiet day is not celebrated), no draw-on mark, no connecting line or run between consecutive quiet days (C5-9), no count | None | None | None |
| D-M61 | D-S22 row removed when words arrive that day | A letter is kept the same day | The quiet row is gone the next time the Book is shown; the letter takes the day with its own arrival (area A's 5e wash). The quiet row never animates out in front of the parent | None | None | None |

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
| Reminder ask: any of the three answers | `tap`, the same for each (change from built: "No reminders" had none) | None | D-M31, D-M33 |
| Reminder settings: chip or choice | `tap` | None | D-M37 |
| Typed day saved | `tap` | None | D-M42 |
| Typed day deleted (confirmed) | `warning` | None | D-M44 |
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
| E8 | Share: the preview must stay mounted under the iOS share sheet and close only in the completion handler, and must not read the result to decide anything (R3b). `ui/sheet.tsx` is a `BottomSheetModal`; presenting `UIActivityViewController` over it needs a device check (UNVERIFIED that it presents over a gorhom modal without the sheet dismissing) | `lib/share/*`, the letter page | BL-939 (NS-05) |
| E9 | The typed-day line on Home: enters once on a warm landing (D-M51), joins the cold-launch entrance (D-M52), never re-enters on a tab return | `app/(tabs)/index.tsx` | BL-982 (NS-18) |
| E10 | Low Power Mode guard for the one loop in the area (D-M18) | `lib/motion.ts` (`useLowPowerMode`, engineering plan item 9; needs `expo-battery`, UNVERIFIED as installed) | Bucket E (engineering plan item 9) |
| E11 | Reminder settings: replace the `LinearTransition` close-up and the rising reveal with opacity only (D-M35, D-M36, D-M38), per card 15 | `app/settings/reminders.tsx:199-216` | BL-943 |
| E12 | A notification tap during Listen, Review or Write must not navigate (D-M53). Today both listeners call `router.navigate` whatever is open | `lib/reminders/scheduler.ts:257`, `lib/billing/plan-reminders.ts:131-133` | BL-943, BL-966 |

## 9. Card gaps

| # | Card row | What is missing or ambiguous | Proposed default |
|---|---|---|---|
| G1 | NS-05 section 15 ("Motion: system sheet only; Reduce Motion follows the system") and section 10 ("a preview sheet component reusing the existing sheet") | The existing sheet is ours (`ui/sheet.tsx`), not the system's; under Reduce Motion it fades over `fadeMs` by our code, not the system's | Use `ui/sheet.tsx` as built: `standard` rise, `fadeMs` fade under Reduce Motion. Read "system sheet" as "the house sheet, no custom motion inside it" |
| G2 | NS-05 section 4 step 7 | Silent on what the parent sees after the iOS sheet closes: the preview again, or the letter page | The preview closes after the share sheet completes, whatever the outcome (the app cannot tell outcomes apart without reading what R3b forbids it to use), onto the unchanged letter page; focus on Share |
| G3 | NS-07-C5-13 ("the kept line is visible within 100 ms") with the built delayed fade | "Visible" is not defined for a fading line | Visible means mounted, announced and at least a third of its strength by 100 ms; D-M56's timing meets it (line at about 0.4 at 100 ms, full at 200 ms) |
| G4 | NS-13 section 15 ("Motion: none") against built settings motion (rising reveal, `LinearTransition`) | Whether "none" forbids the opacity fades the house uses for every reveal | Nothing travels; opacity only (D-M35 to D-M38) |
| G5 | NS-18 section 4 step 3 ("Home shows Nursery starts above the prompt") | How long the line stays, and whether it moves the prompt | For the rest of that local day; enters once (D-M51), the prompt makes room on `standard`; gone the next day with no exit animation |
| G6 | NS-13-R9, NS-18-R1, NS-32 | Silent on a tap while a letter is being made (Listen, Review, Write open) | Do not navigate; land on what is open; a typed-day line waits on Home for that day (D-M53) |
| G7 | NS-25 section 6 ("Reduce Motion: No new motion") | The built join already has a cover opening and a waiting loop | Keep them as built with their reduced forms (D-M17, D-M18); exceptions 5 and 6 for a ruling |
| G8 | NS-13 section 4 step 1 with NOTIFICATIONS.md ("the card that rises over the Book") and `DESIGN.md` D-S04 ("sheet on Home") | Where the ask rises: over the Book after the saved moment, or on Home | Whichever the design lead settles; the motion is the same: it waits for the arrival to land (D-M28) |
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
