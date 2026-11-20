# Area D: Family, sharing and reminders. Words

Status: draft, reconciled with `DESIGN.md` section 3 state ids (content lead, area D, 20 Nov 2026). Every new or changed string is PROPOSED; the founder approves words before any build outside his family shows them (BRIEF section 2).

Keyed to `DESIGN.md` screen ids D-S01 to D-S24 and its state names (`D-Snn.<state>`). Where `DESIGN.md` wrote an intent line, this file gives the final words and says so in section 14 (what `DESIGN.md` and `MOTION.md` should pick up).

Sources read: BRIEF.md; cards NS-05, NS-13, NS-18, NS-25 (10-reading-and-family), NS-32 (11-foundations), NS-07 C5, NS-03; 14-test-plan journeys J-N3, J-N4, J-N11, J-N19, J-N22, J-N24, J-N26, J-N27; `packages/content/VOICE.md`, `BRAND.md`, `test/rules.test.ts`; `docs/design/NOTIFICATIONS.md`, `docs/design/notifications/COPY_INVENTORY.md`; `docs/design/specs/03-SHARE-ONE-LETTER-11nov.md`; `docs/legal/in-app-disclosures.md`; built strings in `packages/content/src/strings.en.ts`, `src/features/{reminders,family,billing}.en.ts` and `apps/web/src/content/site.ts` (the invite link page); screens `components/asks/reminder-prime-ask.tsx`, `app/settings/reminders.tsx`, `lib/reminders/planner.ts`. Backlog rows: BL-939 (share), BL-943 (reminders), BL-966 (budget), BL-967 (sign-out cancels reminders), BL-974 (quiet days), BL-982 (typed days), BL-983 (other parent), BL-965 (words for these rows, per `DESIGN.md`).

## 0. How to read this file

Status column:
- **EXISTING**: a built key, reused as it is, quoted from the repo today.
- **CHANGE**: a built key whose text this file proposes to replace (old and new in section 11). PROPOSED.
- **PROPOSED**: a new key. Namespaces: `shareCopy.*` (new file `packages/content/src/features/share.en.ts`, slot names from spec 03 section 7); `reminderCopy.*`, `familyCopy.*`, `en.notifications.*` and `en.onboarding.reminder.*` (existing objects); `site.invite.*` (the web content file `apps/web/src/content/site.ts`); `pilot.*` (not app copy: the pilot plan in `docs/research/studies/`, section 9).
- **NONE**: the card says no words appear here; listed so nobody adds one.

Columns: Key, Status, Text, Where (state id), VoiceOver (label, then the hint after a slash), Voice Control name, Card row. The Voice Control name is the visible label everywhere (NS-33).

Placeholders used: `{child}`, `{coParent}`, `{inviter}`, `{signsAs}`, `{date}`, `{time}`, `{month}`, `{weekday}`, `{label}`, `{app}`. All are in the rules test allowlist; no new placeholder is needed. Where the parent's own words sit beside ours (a typed day, the share preview), the screen shows two text elements and VoiceOver reads them in order; no template joins them (no `{words}` placeholder; NS-05 section 8 "no assembled sentences").

Section 13 says how this file was checked against the rules.

## 1. Share one letter, Level 1 (NS-05; BL-939; flag `EXPO_PUBLIC_SHARE_LETTER`)

Verb (NS-05 OQ-6, `content` with `legal`): **Share**. It is the word on the iOS sheet that opens next, so the label says what will happen; "Send" suggests the app sends something, and it does not (R3a, R9); "Give" reads as a gift, which section 16 bans. `legal` co-signs; until then the label stays PROPOSED.

### D-S01 Letter page: the Share control

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `shareCopy.letter.action` | PROPOSED | Share this letter | D-S01.default (own, open, kept letter with words, flag on) | "Share this letter" / "Shows what will be sent first." | Share this letter | NS-05 section 16, R1, R13a |
| (absent) | NONE | | D-S01.absent (other parent's letter, sealed, quiet day, no words, not kept, flag off) | no hint, no dimmed control, no line saying why | n/a | R1, R7, R26 |
| `book.entryMenu.shareButton` | EXISTING, not drawn | Share | no screen reads it (spec 03 section 2) | n/a | n/a | Remove in the dead-copy sweep; the letter page uses `shareCopy.letter.action` |

17 characters, under the 22 cap.

### D-S02 Share preview sheet

VoiceOver order (R13a; section 6): title, the text that leaves, the words row, the picture toggle, the version line, the where-it-goes line, Continue, Not now.

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `shareCopy.letter.title` | PROPOSED | This will be sent | every D-S02 state | heading | n/a | section 16, R2 |
| `shareCopy.letter.previewA11y` | PROPOSED | What will be sent | label of the text block; the date line, the words and the signature line follow, read as they are | "What will be sent" then the text | n/a | R2, R13a |
| (date line) | EXISTING format | the letter's about-day from `Intl.DateTimeFormat` in the device locale, or month and year | first line of the text | read as shown | n/a | R18 |
| `common.signature` | EXISTING | From {signsAs} | last line of the text | read as shown | n/a | R18 |
| `shareCopy.letter.wordsAlways` | PROPOSED | The words always go | static row, every state | read as text; never a switch, never "dimmed" (R4b) | n/a (not a control) | section 16, R4b |
| `shareCopy.letter.picture` | PROPOSED | Include the picture | D-S02.pictureOff, D-S02.pictureOn (absent in D-S02.noPicture) | switch "Include the picture, off" / "Adds the letter's picture to what is sent." | Include the picture | section 16, R5b |
| `shareCopy.letter.pictureA11y` | PROPOSED | The letter's picture | the thumbnail; never a machine description | "The letter's picture" | n/a | R5b; constitution |
| `shareCopy.letter.versionFixes` | PROPOSED | Sent as it reads in the book, with small fixes. | D-S02.default and every state where the text sent differs from the untouched words | read as text | n/a | section 16, R19 |
| `shareCopy.letter.versionExact` | PROPOSED | Sent exactly as said. | D-S02.exact: the text sent equals the untouched words (the Book shows "Exactly as said", or the letter has no fix) | read as text | n/a | section 16, R19; VOICE.md (only when true) |
| `shareCopy.letter.whereItGoes` | PROPOSED | It goes only where you send it. Once sent, it cannot be taken back. | every state, above Continue | read as text | n/a | section 16, R24; SH-R8 |
| `shareCopy.letter.pictureFailed` | PROPOSED | The picture could not be added. The words will still go. | D-S02.error-share_temp_write_failed: in place of the toggle; the toggle turns off and the next Continue sends words only (`DESIGN.md` G-D03) | announced once when it appears, then read as text | n/a | section 5 |
| `common.continueButton` | EXISTING | Continue | every state | "Continue" / "Opens your phone's share sheet." | Continue | section 4 step 3, R2 |
| `common.notNowButton` | EXISTING | Not now | every state | "Not now" / "Closes this. Nothing is sent." | Not now | section 12 Decline, R2 |

Notes:
- The two hints are the same length class, so neither button sounds like the expected choice (spec 03 section 6).
- `versionExact` is chosen by comparing the text sent with the untouched words, never by the view name alone.
- `D-S02.offline`, `.lapsed`, `.signedout`, `.long`, `.rtl`, `.ax5`, `.dark`, `.hc` use the same words. `.switcher` is a blank snapshot (R14): no words.
- No line says "private", "safe" or "secure" about the recipient's copy (SH-R8). No gift, "share your voice", "private link", "family can listen", count, "every change shown" or brand line (section 16, R16b). No extra line for a private letter (`DESIGN.md` G-D02).

### D-S03 iOS share sheet

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| (payload) | NONE beyond the wrapper | date line, blank line, the words, blank line, signature line. No subject, title, footer, brand name, link or "sent from" | D-S03.text, D-S03.textAndPicture | n/a | n/a | R16b, R18, R21 |
| (after it closes) | NONE | no toast, banner, haptic or "shared" line | D-S03.cancelled, D-S03.completed | nothing announced | n/a | R12, R22 |

## 2. Reminders, typed days and the one budget (NS-13, NS-18, NS-32; BL-966, BL-943, BL-967, BL-982)

### D-S04 Reminder ask (sheet over the Book after the first kept letter; at most 2 showings)

`DESIGN.md` takes two equal answers plus a quiet "Change the time" control (G-D04). The words follow it.

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `onboarding.reminder.title` | EXISTING | A gentle nudge, now and then? | D-S04.default | heading | n/a | NS-13 section 12 Shown |
| `onboarding.reminder.body` | EXISTING | A couple of evenings a week, at a time you pick, to add to {child}'s book. Never late at night. | D-S04.default, D-S04.namedBody (in the app only; never on a lock screen) | read as text | n/a | happy path 1; BL-532 |
| `onboarding.reminder.rhythmLine` | PROPOSED | {label} at {time} | D-S04.default; `{label}` is the cadence label (`settings.reminders.fewTimesLabel` "A few times a week" by default), so it reads "A few times a week at 8:30 PM" | read as text | n/a | happy path 2 (default cadence and hour) |
| `onboarding.reminder.changeTimeButton` | PROPOSED | Change the time | D-S04.default | "Change the time" / "Opens a time picker. This does not turn reminders on." | Change the time | G-D04 (a control, not an answer) |
| `onboarding.reminder.timeLabel` | EXISTING | Remind me at | D-S04.picking (replaces the rhythm line) | "Remind me at, {time}" | Remind me at | built |
| `onboarding.reminder.yesEveningsButton` | EXISTING | Yes, evenings | every D-S04 state | "Yes, evenings" / "Turns on reminders. Your iPhone asks next." | Yes, evenings | R31 |
| `onboarding.reminder.noneOption` | EXISTING | No reminders | every D-S04 state, equal to Yes | "No reminders" / "Nothing is set. You can turn them on in Me." | No reminders | R31, section 12 Decline |
| `reminderCopy.settings.onToast` + `nextLine` | EXISTING | Reminders are on. Next: {weekday} at {time}. | D-S04.yes-allowed (toast) | announced | n/a | built |
| `reminderCopy.settings.changeButton` | EXISTING | Change | D-S04.yes-allowed (toast action) | "Change" / "Opens Reminders in Me." | Change | built |
| `reminderCopy.settings.notSendingYet` | EXISTING | Not sending yet. | D-S04.yes-denied (toast; `DESIGN.md` intent "Notifications are off": the built toast says this line) | announced | n/a | R16 |
| `reminderCopy.settings.openSettingsButton` | EXISTING | Open Settings | D-S04.yes-denied (toast action) | "Open Settings" / "Opens the iPhone's Settings for this app." | Open Settings | section 5 |
| `onboarding.reminder.noneHelp` | CHANGE | You can turn reminders on in Me whenever you like. | D-S04.no (toast) | announced | n/a | section 12 Decline ("Me explains in one sentence") |
| `reminderCopy.settings.scheduleFailed` + `common.tryAgainButton` | EXISTING | Could not set reminders just now. / Try again | D-S04.yes-failed (built toast; state missing from `DESIGN.md`, section 14) | announced | Try again | section 5 |
| `onboarding.reminder.pickTimeButton`, `cta` | EXISTING, retired | Pick a time / Set reminder | none after G-D04 | n/a | n/a | delete when the card changes (BL-943) |

`D-S04.secondShowing` uses the same words: nothing says "again".

### D-S05 iOS permission alert

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| (system) | NONE | iOS draws it and takes no purpose string for notifications | D-S05.shown | system | system | section 12 |

### D-S06 Me, Reminders

Nothing on this page says reminders slowed or stopped. In `D-S06.backedOff` the Next line is simply not shown (`DESIGN.md` G-D06); no line replaces it (NS-13 section 15; J-N4).

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `reminderCopy.settings.enabledLabel` | EXISTING | Reminders | the switch, every state | "Reminders, on" | Reminders | built |
| `settings.reminders.help` | EXISTING | A nudge in the evening, as often as you choose. Never late at night. | D-S06.off footer, first | read as text | n/a | built (LEGAL-REQ-007) |
| `reminderCopy.priming.quietLine` | CHANGE | Never late at night, and you can change them any time. | D-S06.off footer | read as text | n/a | R30 (section 11: the old line was not true of birthday and typed-day messages) |
| `reminderCopy.priming.privacyLine` | CHANGE | Notifications never show the words of a letter. Names stay off the lock screen unless you turn them on. | D-S06.off footer | read as text | n/a | R6a, R6b; NS-18 R3 |
| `reminderCopy.settings.savesAsYouGo` | EXISTING | Changes save as you go. | D-S06.on footer | read as text | n/a | built |
| `reminderCopy.settings.previewTitle` | EXISTING | How it will look | D-S06.on (preview) | one element: "How it will look. {title}. {body}" | n/a | section 15 |
| `reminderCopy.settings.nextLine` | EXISTING | Next: {weekday} at {time}. | D-S06.on; hidden in D-S06.backedOff | read as text | n/a | built; G-D06 |
| `reminderCopy.settings.saved` | EXISTING | Saved. | VoiceOver only, before the Next line | announced | n/a | built |
| `reminderCopy.settings.howOftenTitle` | EXISTING | How often | D-S06.on | heading | n/a | happy path 2 |
| `settings.reminders.weeklyLabel` | EXISTING | Weekly | choice | "Weekly, not selected" | Weekly | built |
| `settings.reminders.fewTimesLabel` | EXISTING | A few times a week | choice (default) | "A few times a week, selected" | A few times a week | built |
| `settings.reminders.everyEveningLabel` | EXISTING | Every evening | choice | as above | Every evening | built (LNG-06) |
| `reminderCopy.settings.eveningsTitle` | EXISTING | Which evenings | D-S06.on | heading | n/a | built |
| `reminderCopy.weekdaysShort[n]` | EXISTING | Sun, Mon, Tue, Wed, Thu, Fri, Sat | day chips | the full name from `reminderCopy.weekdays[n]`, then "selected" or "not selected" | the visible text ("Tue"); the input labels also list the full name | section 8 |
| `reminderCopy.settings.timeTitle` | EXISTING | Time | D-S06.on | heading | n/a | built |
| `settings.reminders.timeLabel` | EXISTING | Reminder time | row | "Reminder time, {time}" | Reminder time | built |
| `reminderCopy.settings.quietHelp` | CHANGE | Reminders come between 7 AM and 9:30 PM, and not on a day you have already said or typed a letter. | time section footer | read as text | n/a | R8, R27 |
| `reminderCopy.settings.lateNightClamp` | EXISTING | Late nights stay quiet. | D-S06.lateClamp | announced | n/a | R30 |
| `reminderCopy.settings.monthNotesLabel` | EXISTING | Month and birthday messages | switch | "Month and birthday messages, on" | Month and birthday messages | built |
| `reminderCopy.settings.monthNotesHelp` | EXISTING | A short message on the day a new month begins in each book, and on birthdays. | switch help | read as text | n/a | built |
| `reminderCopy.settings.birthDateNote` | EXISTING | Starts once a birth date is added. | D-S06.monthNoBirthDate | read as text | n/a | R10 |
| `settings.privacy.lockScreenLabel` | EXISTING | Names in notifications | switch | "Names in notifications, off" | Names in notifications | section 12 (name opt-in) |
| `reminderCopy.settings.namesHelpOff` | CHANGE | No names on the lock screen, except in your own words if you choose to show them. | switch help, off | read as text | n/a | R6a; NS-18 R3 |
| `reminderCopy.settings.namesHelpOn` | EXISTING | Notifications can show names on the lock screen. | D-S06.on-named | read as text | n/a | built |
| `reminderCopy.settings.lockNames` | EXISTING | Names stay hidden while App lock is on. | D-S06.on-appLock (switch disabled) | read as text | n/a | section 5 |
| `reminderCopy.settings.quietDelivery` | EXISTING | iPhone delivers these quietly, to Notification Center only. | D-S06.quietDelivery | read as text | n/a | built |
| `reminderCopy.settings.deniedTitle` | EXISTING | Notifications are off | D-S06.denied | heading | n/a | R16 |
| `reminderCopy.settings.deniedBody` | EXISTING | Turn them on in Settings to get these reminders. | D-S06.denied | read as text | n/a | R16 |
| `reminderCopy.settings.openSettingsButton` | EXISTING | Open Settings | D-S06.denied | "Open Settings" / "Opens the iPhone's Settings for this app." | Open Settings | R16 |
| `reminderCopy.settings.scheduleFailed` | EXISTING | Could not set reminders just now. | D-S06.scheduleFailed | read as text | n/a | section 5 |
| `common.tryAgainButton` | EXISTING | Try again | D-S06.scheduleFailed | "Try again" | Try again | built |
| `reminderCopy.settings.offSummary` | EXISTING | Off | the Reminders row value in Me | "Reminders, Off" | Reminders | built |
| `reminderCopy.typedDay.sectionTitle` | PROPOSED | Days to remember | D-S06.typedDays, D-S06.typedDaysEmpty, D-S06.off-withDays (absent in D-S06.typedDaysFlagOff) | heading | n/a | NS-18 section 15 |
| (each day row) | EXISTING format plus the parent's words | title: the date in the device locale; subtitle: the words exactly as typed | D-S06.typedDays | "{date}." then the words (two elements) / "Opens this day." | the date as shown | NS-18 section 6 |
| `reminderCopy.typedDay.addButton` | PROPOSED | Add a day | D-S06.typedDays, D-S06.typedDaysEmpty | "Add a day" | Add a day | NS-18 happy path 1 |
| `reminderCopy.typedDay.sectionHelp` | PROPOSED | A day you add gets one message on that day, at your reminder time. Your words stay on this phone. | section footer | read as text | n/a | NS-18 section 3, happy path 2; section 11 (not synced) |
| `reminderCopy.typedDay.remindersOffNote` | PROPOSED | Days you add still come when reminders are off. | D-S06.off-withDays | read as text | n/a | NS-18 section 5 (PROPOSED behaviour; G7) |

`D-S06.twobooks`, `.signedout` (all defaults), `.second-account` (starts off, R13), `.ax5`, `.dark`, `.hc` use the same words.

### D-S07 Time picker

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `settings.reminders.timeLabel` | EXISTING | Reminder time | D-S07.default (label above the value at AX5) | "Reminder time, {time}" | Reminder time | R30 |
| (picker) | NONE | system picker, 07:00 to 21:30 in 15-minute steps; no other hour is offered, so there is no error line | D-S07.default | system | system | R30 |

### D-S08 Add a day sheet

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `reminderCopy.typedDay.sheetTitle` | PROPOSED | Add a day | every D-S08 state | heading | n/a | NS-18 section 15 |
| `common.cancelButton` | EXISTING | Cancel | every state | "Cancel" / "Nothing is added." | Cancel | built |
| `reminderCopy.typedDay.dateLabel` | PROPOSED | Date | date row (system picker, tomorrow onward, G-D10) | "Date, {date}" | Date | happy path 1 |
| `reminderCopy.typedDay.wordsLabel` | PROPOSED | Your words | the field | "Your words, text field" / "Shows in the app on that day." | Your words | happy path 1 |
| `reminderCopy.typedDay.wordsPlaceholder` | PROPOSED | Nursery starts | D-S08.empty (an example, never filled in for the parent) | not read once the field has text | n/a | section 4; section 14 (the app never suggests words) |
| `reminderCopy.typedDay.showWordsLabel` | PROPOSED | Show my words in the notification | D-S08.filled, D-S08.showWords | "Show my words in the notification, off" | Show my words in the notification | NS-18 section 3, section 12 Shown |
| `reminderCopy.typedDay.showWordsHelpOff` | PROPOSED | The notification says only: A day you wanted to remember. | switch help, off | read as text | n/a | R3; section 12 Decline |
| `reminderCopy.typedDay.showWordsHelpOn` | PROPOSED | The notification shows your words as you typed them, names included. | D-S08.showWords | read as text | n/a | R3; section 13 threat; G-D18 (says what we send, nothing about iOS summaries) |
| `reminderCopy.settings.previewTitle` | EXISTING | How it will look | the preview (the fixed line, or the words when the switch is on) | one element: "How it will look. {title}. {body}" | n/a | R3 |
| `reminderCopy.typedDay.saveReason` | PROPOSED | Add a few words to save. | D-S08.empty (Save disabled) | read as text; Save reads "dimmed" | n/a | R5 (1 character or more) |
| `reminderCopy.typedDay.tooLong` | PROPOSED | That is as much as fits here. | D-S08.tooLong (the field stops taking input at 80; no counter, G-D13) | announced politely | n/a | R5 (80, PROPOSED) |
| `reminderCopy.typedDay.notAllowed` | PROPOSED | Notifications are off, so this day can only arrive once they are allowed. | D-S08.notAllowed, above Save (Save still works) | read as text | n/a | G-D11 |
| `reminderCopy.typedDay.errorPast` | PROPOSED | Choose a day after today. | a sheet left open past midnight, or a stale date on Save (the picker offers tomorrow onward, so this is a guard) | announced | n/a | section 5 (a day in the past) |
| `common.saveButton` | EXISTING | Save | every state | "Save" | Save | R1 |
| `reminderCopy.settings.scheduleFailed` | EXISTING | Could not set reminders just now. | D-S08.error-scheduleFailed (the day is saved; Try again re-plans) | read as text | n/a | section 6 Failed |
| (saving) | NONE | the button keeps its label; no progress words (save is under 300 ms) | D-S08.saving | n/a | n/a | section 8 |

Writing tools are off on the field (D2; `DESIGN.md` E-D06). No autocomplete and no suggestion.

### D-S09 A typed day: detail and Delete

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| (date and words) | EXISTING format | the date as headline, the words as typed below | D-S09.default | "{date}." then the words | n/a | NS-18 section 6 |
| `reminderCopy.typedDay.detailWordsOn` | PROPOSED | The notification shows your words. | D-S09.default, switch was on | read as text | n/a | R3 |
| `reminderCopy.typedDay.detailWordsOff` | PROPOSED | The notification says: A day you wanted to remember. | D-S09.default, switch was off | read as text | n/a | R3 |
| `reminderCopy.typedDay.deleteBody` | PROPOSED | Deleting it stops its message and removes your words from this phone. | D-S09.default, above the buttons | read as text | n/a | section 5, R6 |
| `reminderCopy.typedDay.deleteButton` | PROPOSED | Delete this day | D-S09.default (destructive, quiet) | "Delete this day" | Delete this day | section 5 |
| `family.pending.keep` | EXISTING word | Keep it | D-S09.default (primary) | "Keep it" | Keep it | built word |

### D-S10 Lock screen and Notification Centre: every class

Every row passes (NS-13 R5, R6a, R6b, R10, R11, R24; NS-32 R11, R12, R13): no child name unless Names in notifications is on, and never with App lock on; no letter words, ever; no count of days, no "since", no run; no Plus, price, allowance or Keep step in any budgeted class; no due-date wording; no exclamation mark (notification budget 0); title at most 40 characters and body at most 110 as templates; every line a `packages/content` key, filled only with a weekday, a month number or a child name. iOS "Show Previews" is the parent's setting: when previews are hidden, iOS shows the app name and our category placeholder (the `.hidden-locked` and `.hidden-never` states). With Deliver Quietly, a Focus or Scheduled Summary (`.quiet`, `.focus`, `.summary`) the words are the same; iOS decides where they appear.

#### D-S10.evening (tap: D-S11.evening, Home)

The neutral variant is the default (`.shown`); the named one is used only with names on (`.named`); App lock forces neutral (`.appLock`). Both lists keep the same order.

| Key | Status | Title (neutral, default) | Body (neutral, default) | Named title | Named body |
|---|---|---|---|---|---|
| `reminderCopy.neutral.evening[0]` / `notifications.evening[0]` | EXISTING | A minute to write? | One thing about today is plenty. A sentence will do. | A minute for {child}? | Tell {child} one thing about today. A sentence is plenty. |
| `[1]` | EXISTING | A letter tonight? | What made you smile today? Say it out loud and keep it. | A letter tonight? | What made you smile today? Say it out loud and keep it. |
| `[2]` | EXISTING | Dear little one, | Anything to tell your little one today? A line or two is enough. | Dear {child}, | Anything to tell {child} today? A line or two is enough. |
| `[3]` | EXISTING | The house is quiet | A good moment for a few words to your little one. | The house is quiet | A good moment for a few words to {child}. |
| `[4]` | EXISTING | One small thing | What happened today that you want to remember? | One small thing | What did {child} do today that you want to remember? |
| `[5]` | EXISTING | Your voice, kept | Talk for a minute. One day it can be heard, just as you sounded. | Your voice, kept | Talk for a minute. One day {child} can hear how you sounded. |
| `[6]` | EXISTING | Before you sleep | Something your little one did, said or tried. Or just tap Not much today. | Before you sleep | Something {child} did, said or tried. Or just tap Not much today. |
| `[7]` | EXISTING | A page for {weekday} | Something from today for the book? | A page for {weekday} | Something from today for {child}'s book? |

PROPOSED extension for NS-13-R2b (no body twice in 30 days needs 31 neutral lines; P2; a content drop after the freeze, K5). Rows 8 to 30 come from the vetted inventory (`docs/design/notifications/COPY_INVENTORY.md`, ids in brackets), re-checked here. "Before birth" says whether the line fits a book whose child is not born yet (G5): a "no" line is never planned for a phone whose included books are all expecting.

| Key | Title (neutral) | Body (neutral) | Named title | Named body | Before birth |
|---|---|---|---|---|---|
| `[8]` (EV03) | One sentence | Tap the red circle and finish this: Today you | One sentence for {child} | Tap the red circle and finish this: Today you | yes |
| `[9]` (EV05) | How did today feel? | A few words about how the day felt, not what happened. | How was today for {child}? | A few words about how the day felt, not what happened. | yes |
| `[10]` (EV06) | Thirty seconds | Talk for as long as it takes to boil a kettle. | Thirty seconds for {child} | Talk for as long as it takes to boil a kettle. | yes |
| `[11]` (EV07) | Where did today happen? | Tell your little one where it went. A room, a street, a park. | Where did today happen? | Tell {child} where it went. A room, a street, a park. | yes |
| `[12]` (EV08) | Not much today? | That is fine. Tap Not much today and call it a good evening. | Not much today? | That is fine. Tap Not much today and call it a good evening. | yes |
| `[13]` (EV10) | Who came by today? | Who did your little one see? A voice, a face, a name is plenty. | Who did {child} see today? | A voice, a face, a name is plenty. | no |
| `[14]` (EV11) | Describe one thing | Pick one thing in the room and tell your little one about it. | Describe one thing | Pick one thing in the room and tell {child} about it. | yes |
| `[15]` (EV02) | A quiet moment? | The house is settling. A few words to your little one? | A quiet moment? | The house is settling. A few words to {child}? | yes |
| `[16]` (CU01) | What are they into? | What does your little one keep going back to lately? | What is {child} into? | What does {child} keep going back to lately? | no |
| `[17]` (CU05) | Right now | Describe your little one as they are this week. It will be good to hear later. | {child}, this week | Describe {child} as they are right now. It will be good to hear later. | no |
| `[18]` (CU06) | What surprised you? | Anything about your little one that surprised you lately? | What surprised you? | Anything about {child} that surprised you lately? | no |
| `[19]` (CU08) | At this age | Is there something you remember about yourself at this age? Tell your little one. | At this age | Is there something you remember about yourself at {child}'s age? | no |
| `[20]` (GR01) | Something good | Name one good thing from today for your little one to hear one day. | One good thing | Name one good thing from today for {child} to hear one day. | yes |
| `[21]` (GR02) | Who helped today? | Who made today a little easier? Say thank you out loud. | Who helped today? | Who made today easier for you and {child}? Say thank you out loud. | yes |
| `[22]` (GR03) | Thank you, today | Thank someone, or something, in the book. A sentence is plenty. | Thank you, today | Thank someone, or something, in {child}'s book. A sentence is plenty. | yes |
| `[23]` (GR04) | What are you glad of? | What are you glad of this evening? Tell your little one. | What are you glad of? | What are you glad of this evening? Tell {child}. | yes |
| `[24]` (GR05) | Ordinary days | Ordinary days are the ones your little one will want to hear about. | Ordinary days | Ordinary days are the ones {child} will want to hear about. | yes |
| `[25]` (GR06) | One thing you love | Tell your little one one thing you love about this stage. | One thing you love | Tell {child} one thing you love about this stage. | yes |
| `[26]` (SE01) | Listen for a moment | What can you hear around your little one right now? Record it. | Listen for a moment | What can you hear around {child} right now? Record it. | no |
| `[27]` (SE02) | What does home sound like? | The kettle, the street, the song on repeat. Say what you hear. | What does home sound like? | The kettle, the street, the song on repeat. Tell {child}. | yes |
| `[28]` (SE03) | The laugh | If your little one laughs tonight, record it, then say what caused it. | {child}'s laugh | If {child} laughs tonight, record it, then say what caused it. | no |
| `[29]` (SE04) | Small hands | Describe your little one's hands today: the size, the grip, what they hold. | {child}'s hands | Describe the size, the grip, what {child} holds on to. | no |
| `[30]` (SE05) | What did today look like? | Colors, light, the view from a window. Tell your little one. | What did today look like? | Colors, light, the view from a window. Tell {child}. | yes |

Changes from the inventory: CU06's named title and body rewritten (the inventory's named body dropped the child); EV04 ("exactly as it came out") left out, too close to the Word for word promise; EV09 is `[7]` already; EV01 repeats `[1]`; EV12 and the RD, RT, MS, SS, FS and PH rows are not evening rotation lines (RT is withdrawn: section 4).

#### D-S10.monthAge and D-S10.monthAge.together (tap: D-S11.monthAge, the Book)

| Key | Status | Title | Body | Shown when |
|---|---|---|---|---|
| `reminderCopy.neutral.monthOpen` | EXISTING | Month {month} begins | A new month in the book is open. | `.shown`, one child |
| `notifications.monthOpen` | EXISTING | Month {month} begins | A new month in {child}'s book is open. | `.named`, one child |
| `reminderCopy.together.monthTitle` | EXISTING | A new month begins | (below) | `.together`, different month numbers |
| `notifications.monthOpen.title` | EXISTING | Month {month} begins | (below) | `.together`, same month number |
| `reminderCopy.together.monthBodyNeutral` | EXISTING | | A new month is open in each book. | `.together`, names off |
| `reminderCopy.together.monthBodyNames` | EXISTING | | A new month is open for {child}. ({child} is the joined names) | `.together`, names on |

"Month 3" names an age, not a gap (NS-13 R5).

#### D-S10.birthday and D-S10.birthdays (09:00; wins over a month note the same day, NS-13 R28; tap: D-S11.birthday, the Book)

| Key | Status | Title | Body | Shown when |
|---|---|---|---|---|
| `reminderCopy.neutral.birthday` | EXISTING title, CHANGE body | A birthday today | The book is here whenever you want to read it together. | `.shown`, one child |
| `reminderCopy.neutral.birthdays` | EXISTING title, CHANGE body | Birthdays today | The books are here whenever you want to read them together. | `.shown`, two or more children |
| `notifications.birthday` | EXISTING title, CHANGE body | Happy birthday to {child} | The book is here whenever you want to read it together. | `.named`, one child |
| `notifications.birthdays` | PROPOSED | Happy birthday to {child} | The books are here whenever you want to read them together. | `.named`, two or more children (`{child}` is the joined names; today `planner.ts:259` uses the single-book body) |

Why the bodies change: "A year of letters" says a year of letters exists. A parent who started last month has a handful; on a second birthday it is two years; and "a year of" frames a count. The new line points to what is there without measuring it. G3 covers the title on a lock screen.

#### D-S10.typedDay and D-S10.typedDay.words (outranks every budgeted class that day; never removed by the back-off; tap: D-S11.typedDay, Home)

| Key | Status | Title | Body | Shown when |
|---|---|---|---|---|
| `reminderCopy.neutral.typedDay` | PROPOSED | A day you wanted to remember | Tap to see the words you added for today. | `.typedDay` (show-words off, the default) |
| (the parent's words) | PROPOSED rule | A day you wanted to remember | the words exactly as typed: no quotes, no prefix, nothing added | `.typedDay.words` (show-words on) |

Kept under `reminderCopy.neutral` so the rules test's length and rhythm checks read it. The typed words are not copy and are never checked or changed.

#### D-S10.plan (outside the budget; tap: D-S11.plan, Me, Plan)

Plan notices are a legal courtesy about the subscription (Q-003 memo; in-app-disclosures row 35), so this is the one class that names Plus. It names no price, child, letter, allowance or Keep step, and it never shares a notification with a reminder (G15).

| Key | Status | Title | Body |
|---|---|---|---|
| `billing.reminders.title` | EXISTING | Plus | (one of the bodies below) |
| `billing.reminders.trialOneMonth`, `trialMonths` | EXISTING | | Plus is free until {date}, then it renews unless you cancel. You can change this in Settings, Plan. |
| `billing.reminders.renews` | EXISTING | | If Plus is still set to renew, it renews on {date}. You can change this in Settings, Plan. |
| `billing.reminders.yearly` | EXISTING | | A yearly reminder: Plus renews until you cancel. You can change this in Settings, Plan. |

#### D-S10.*.hidden-locked and .hidden-never (category placeholders; NS-32 R13, NS-13 R33)

Keys follow `DESIGN.md` section 5.1. Under `en.notifications`, so the rules test reads them for length, exclamation marks and rhythm.

| Key | Status | Category | Placeholder text |
|---|---|---|---|
| `notifications.placeholder.evening` | PROPOSED | `evening` | Something for the book, whenever you have a minute. |
| `notifications.placeholder.month` | PROPOSED | `monthAge` | Something for the book, whenever you have a minute. |
| `notifications.placeholder.birthday` | PROPOSED | `birthday` | Something for the book, whenever you have a minute. |
| `notifications.placeholder.typedDay` | PROPOSED | `typedDay` | Something for the book, whenever you have a minute. |
| `notifications.placeholder.plan` | PROPOSED | `plan` | A reminder about your plan. |

The same line for every budgeted category on purpose: a hidden preview that said "birthday" would tell anyone holding the phone the child's birthday (an L4 fact, NS-05 R6a reasoning), and one that said "a day you wanted to remember" would mark a private day. No brand name (iOS already shows the app name; the name lives only in `packages/brand`). Not the card's "A note for tonight": "note" is only something a person makes (BRAND.md glossary), and birthday and typed-day messages do not come at night (G1, `DESIGN.md` G-D19). Separate keys per category so one can change later without touching the others.

#### Classes and keys that must not be scheduled in v1.0

| Key | Status | Why |
|---|---|---|
| `notifications.gentleReturn` | EXISTING, never scheduled | A return line after a quiet stretch speaks to the gap; NS-13 replaces it with the silent back-off (section 4). Delete in the dead-copy sweep |
| `notifications.familyLetter`, `notifications.familyAdded` | EXISTING, v1.1 | Need remote push (NS-26, parked) and family beyond the co-parent |
| `quickNote.lockScreenLabel` "Note for {child}" | EXISTING, a widget label | Not a notification; listed so nobody schedules it |
| Inventory rows RT01 to RT04, RD02, PH02, FS, MS, SS | not keys | RT withdrawn by NS-13; RD02 needs push; PH02 needs a library read (never); the rest sit outside the five registered classes (NS-32 R5) |

### D-S11 Notification landing

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| (Home) | NONE new | Home as it is, with its current prompt; nothing says "you came from a reminder" | D-S11.evening | Home's own order | Home's own | NS-13 R9 |
| (the typed words) | the parent's words | the words exactly as typed, in `TypedDayLine` above the prompt, no visible label (`DESIGN.md`) | D-S11.typedDay | label from `reminderCopy.typedDay.homeA11y`, then the words | n/a | NS-18 happy path 3, R1 |
| `reminderCopy.typedDay.homeA11y` | PROPOSED | A day you wanted to remember. | VoiceOver only, read before the words so the line has context | (this is the spoken prefix) | n/a | NS-18 R1 |
| (Book) | NONE new | the Book at its current position | D-S11.monthAge, D-S11.birthday | the Book's own | n/a | R9 |
| (Me, Plan) | see D-S24 | | D-S11.plan | | | NS-32 R4 |
| (App lock, low storage) | NONE new | App lock's own screen first; Home with E's storage line | D-S11.appLock, D-S11.lowStorage | E's words | E's | section 6 |

The typed-day line goes the day after; no line says so (NS-18 R7).

### D-S24 Me, Plan: the date when notifications are not allowed (on E-S11)

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `billing.plan.notificationsOff` (the object at `billing.en.ts:166`) | EXISTING | Notifications are off for {app}, so this iPhone cannot send its reminders before Plus renews. The dates are always here in Settings, Plan. | D-S24.notificationsOff | read as text | n/a | NS-32 R4; F14-REQ-NEW-A |
| `billing.plan.turnOnNotifications` | EXISTING | Allow notifications | D-S24.notificationsOff | "Allow notifications" / "Opens the iPhone's Settings for this app." | Allow notifications | built |
| (allowed) | NONE | line absent | D-S24.allowed | n/a | n/a | |

## 3. The other parent (NS-25; BL-983; alpha builds with servers on only, D-162)

Store builds: **no string of this section renders** (R1, R12; D-161). No "coming soon" anywhere: section 10 lists the built keys that must stay dark.

### D-S12 Me, the book's page: "Write this book together"

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.bookRow.label` | EXISTING | Write this book together | D-S12.oneParent, .invited, .twoParents, .full | "Write this book together" plus the value / "Invite {child}'s other parent." (oneParent only) | Write this book together | happy path 1 |
| `family.members.invited` | EXISTING | Invited | D-S12.invited (row value) | read with the row | n/a | built |
| (co-parent's sign-off) | EXISTING format | the sign-off as the row value | D-S12.twoParents, .full | read with the row | n/a | built (S46) |
| (absent) | NONE | row not rendered | D-S12.absent | n/a | n/a | R1, R12 |

### D-S13 Invite sheet

VoiceOver order (`DESIGN.md`): title, body, the scope line, the plan line, the field, its help, the two footnotes, Share invite link, Not now.

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.create.title` | EXISTING | Invite {child}'s co-parent | D-S13.default | heading | n/a | built |
| `family.create.body` | CHANGE | They can write to {child} from their own phone. | D-S13.default | read as text | n/a | R16 (the scope line now says what they read) |
| `family.create.whatTheyRead` | PROPOSED | They will be able to read every letter in this book that is not private, including the ones already there. | D-S13.default, before the field and the buttons | read as text | n/a | R16; section 12 Invite Shown |
| `family.create.planLine` | PROPOSED | Their letters count toward their own plan. Plus reaches them only through Apple Family Sharing. | D-S13.default | read as text | n/a | R7; NS-25 OQ ("say it plainly in the invite"); D-053, D-103 |
| `family.create.signsAsLabel` | EXISTING | What does {child} call them? | field | "What does {child} call them?, text field, optional" | What does {child} call them | F11-REQ-024 |
| `family.create.signsAsPlaceholder` | EXISTING | Mama, Papa, Amma, Baba | field | not read once filled | n/a | built |
| `family.create.signsAsHelp` | EXISTING | Optional. It signs their letters. | field help | read as text | n/a | built |
| `family.create.oneBook` | EXISTING | This invite is for {child}'s book only. | footnote | read as text | n/a | built |
| `family.create.linkNote` | EXISTING | The link works once, for 7 days. You can cancel it any time. | footnote | read as text | n/a | R18 |
| `family.create.share` | EXISTING | Share invite link | D-S13.default | "Share invite link" / "Opens your phone's share sheet." | Share invite link | happy path 2 |
| `common.notNowButton` | EXISTING | Not now | D-S13.default, equal | "Not now" / "Closes this. Nothing is sent." | Not now | section 12 Decline |
| `family.create.working` | EXISTING | Getting the link ready | D-S13.loading (button label) | announced | n/a | built |
| `family.create.done` | EXISTING | The invite waits until they join. | D-S13.sent (toast) | announced | n/a | built |
| `family.create.full` | EXISTING | {child}'s book has two parents. | D-S13.full, in place of the buttons | read as text | n/a | R5; `SCCAP` inviter side |
| `common.closeButton` | EXISTING | Close | D-S13.full | "Close" | Close | built |
| errors | see section 6 | | D-S13.paused-invites, .offline, .error-* | | | R11 |
| `family.create.shareTitle`, `shareMessage`, `shareMessageNamed` and the `NoName` forms | EXISTING | for example "I started a book of letters for {child}. Join me, so we can both write to {child}:" | the text handed to the share sheet | n/a | n/a | built. The parent's own message may name the child; the link page never does (R6) |

`D-S13.signedout` is E's sign-in (trigger `invite_create`); `.emptyBook` uses the same words.

### D-S14 Invite link page (web, `/j`; names no child, no inviter, no letter, R6)

The built page words live in `apps/web/src/content/site.ts` (`invite.*`, `openApp.*`), with `${NAME}` from `packages/brand`. `DESIGN.md` G-D12: the page has no server and cannot show "expired"; expiry is shown in the app at peek.

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `site.invite.title` | EXISTING | An invite to share a book | D-S14.iphone, .otherDevice | heading | n/a | happy path 3 |
| `site.invite.line` | EXISTING | Someone invited you to share a book. | D-S14.iphone | read as text | n/a | R6 |
| `site.invite.body` | EXISTING | This invite opens in {app} on an iPhone. | D-S14.iphone | read as text | n/a | happy path 3 |
| `site.invite.steps` | EXISTING | Tap "Copy the invite". / Open {app} and tap "I was invited". / Paste the invite. | D-S14.iphone | a list of three | n/a | built |
| `site.invite.copy` | EXISTING | Copy the invite | D-S14.iphone | "Copy the invite" | Copy the invite | built |
| `site.invite.getApp` | PROPOSED | Not on this iPhone yet? Get {app} on the App Store. | D-S14.iphone, a link line under the steps (`DESIGN.md`: one App Store link line) | link "Get {app} on the App Store" | Get {app} on the App Store | happy path 3 ("it points to the App Store") |
| `site.invite.copied` | EXISTING | Copied. Now open {app} and tap "I was invited". | D-S14.copied | announced | n/a | built |
| `site.invite.copyFailed` | EXISTING | This browser would not copy it. Go back to the message, press and hold the link and copy it. Then open {app}, tap "I was invited" and paste it. | D-S14.copyFailed | read as text | n/a | built |
| `site.invite.missing` | EXISTING | This page opened without its invite. (then the same steps) | D-S14.missingToken | read as text | n/a | built |
| `site.invite.noScript` | EXISTING | Go back to the message, press and hold the link and copy it. Then open {app}, tap "I was invited" and paste it. | D-S14.noScript | read as text | n/a | built |
| `site.invite.onComputer` | EXISTING | On a computer? Open this link on the iPhone that has {app}. | D-S14.otherDevice | read as text | n/a | section 5 row 1 |
| `site.invite.iphoneOnly` | PROPOSED | {app} works on iPhone. | D-S14.otherDevice, after onComputer | read as text | n/a | section 5 row 1; G17 (not "for now", which hints at a later version) |
| `site.invite.notYou` | EXISTING | If you were not expecting an invite, you can ignore it. Nothing changes. | every state | read as text | n/a | built |
| `site.invite.home` | EXISTING | Back to {app} | every state | link | Back to {app} | built |

### D-S15 Join ask: peek

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.accept.invitedTitle` | EXISTING | You were invited to a book | D-S15.signedout | heading | n/a | BL-322 |
| `family.accept.signInBody` | EXISTING | You each write from your own phone, in the same book. | D-S15.signedout | read as text | n/a | built |
| `family.accept.signIn` | EXISTING | Sign in | D-S15.signedout | "Sign in" | Sign in | built |
| `family.accept.notNow` | EXISTING | Not now | D-S15.signedout, D-S15.default | "Not now" / "Nothing joins. The person who invited you is not told." | Not now | section 12 Accept Decline |
| `family.accept.peeking` | EXISTING | Opening the invite | D-S15.loading | announced | n/a | built |
| `family.accept.askTitle` | EXISTING | Join this book as a parent? | D-S15.default | heading | n/a | R2 |
| `family.accept.invitedBy` | EXISTING | Invited by {inviter} | D-S15.default | read as text | n/a | R2 (sign-off) |
| `family.accept.role` | PROPOSED | Parent | D-S15.default, under the sign-off (`DESIGN.md` layout) | "Role: Parent" | n/a | R2 (role) |
| `family.accept.invitedByUnknown` | EXISTING | You were invited to write a book together. | D-S15.unknownInviter | read as text | n/a | R2 |
| `family.accept.askBody` | CHANGE | You will both read every letter in the book that is not private. Join only if you know who sent you this link. | D-S15.default | read as text | n/a | R3; section 12 Accept Shown |
| `family.accept.join` | EXISTING | Join the book | D-S15.default | "Join the book" / "Records that you agree, then the book comes to this phone." | Join the book | R17 (when Join is the agreement, G-D16 default) |
| `family.accept.needsSync` | EXISTING | To join, choose Agree and sync in Settings, Account. | D-S15.needsSync | read as text | n/a | F11-U11 |
| `family.accept.pasteAnother` | EXISTING | Paste another link | final error states | "Paste another link" | Paste another link | built |
| `family.accept.open` | EXISTING | Open the book | D-S15.error-already_member | "Open the book" | Open the book | R9 |
| errors | see section 6 | | D-S15.error-*, .paused-invites, .offline | | | R5, R9, R11, R18 |

No child name on this screen (R2): the sign-off field moved to D-S17.ready after Join.

### D-S16 Accept: the agreement (only when the server asks for the family-share agreement, `DESIGN.md` G-D16)

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.accept.agreementTitle` | PROPOSED | Before you join | D-S16.default | heading | n/a | section 12 Accept Shown |
| `family.accept.agreementLine` | PROPOSED | Joining shares this book between you and the person who invited you. These say how it works. | D-S16.default, above the agreement rows | read as text | n/a | R17; Q48 |
| (agreement rows) | EXISTING keys (E's) | Terms of Service, Privacy Policy, Consumer Health Data Privacy Policy, each with its version | D-S16.default | link labels as shown | same | R17 |
| `family.accept.agreeAndJoin` | PROPOSED | Agree and join | D-S16.default | "Agree and join" / "Records that you agree, then the book comes to this phone." | Agree and join | R17 |
| `family.accept.notNow` | EXISTING | Not now | D-S16.default, equal | "Not now" / "Nothing joins. The person who invited you is not told." | Not now | section 12 Decline |
| `family.accept.joining` | EXISTING | Joining the book | D-S16.loading | announced | n/a | section 6 Slow |
| `family.errors.network` | EXISTING | This phone is offline. Try again once it is back online. | D-S16.offline | read as text | n/a | section 6 Offline |
| `family.errors.joinFailed` | PROPOSED | Joining did not finish. Nothing has changed. Try again. | D-S16.error-unknown | read as text | n/a | R10 (no membership was made) |
| `family.accept.tryAgain` | EXISTING | Try again | D-S16.offline, .error-unknown | "Try again" | Try again | built |

### D-S17 Joined: arrival

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.accept.joinedTitle` | EXISTING | You're in {child}'s book | D-S17.waiting, .ready | heading | n/a | happy path 5 |
| `family.accept.joinedBody` | EXISTING | Your letters and {inviter}'s sit side by side, each signed. | flyleaf | read as text | n/a | happy path 6 |
| `family.accept.joinedBodyUnknown` | EXISTING | Your letters and theirs sit side by side, each signed. | flyleaf, no sign-off | read as text | n/a | built |
| `family.accept.joinedWaiting` | EXISTING | {child}'s book is on its way to this phone. | D-S17.waiting | announced | n/a | section 8 |
| `family.accept.joinedNotYet` | EXISTING | {child}'s book has not reached this phone yet. | D-S17.notYet | read as text | n/a | built |
| `family.accept.joinedWaitingUnknown`, `joinedNotYetUnknown` | EXISTING | The book is on its way to this phone. / The book has not reached this phone yet. | the same, name unknown | read as text | n/a | built |
| `family.accept.tryAgain` | EXISTING | Try again | D-S17.notYet | "Try again" | Try again | built |
| `family.accept.signsAsLabel` | EXISTING | What does {child} call you? | D-S17.ready (after Join, so the name is fine) | "What does {child} call you?, text field" | What does {child} call you | F11-REQ-024 |
| `family.accept.signsAsHelp` | EXISTING | It signs your letters in this book. | D-S17.ready | read as text | n/a | built |
| `family.accept.signsAsNeeded` | EXISTING | Add what {child} calls you to open the book. | D-S17.ready, empty field | read as text | n/a | built |
| `family.accept.open` | EXISTING | Open the book | D-S17.ready | "Open the book" | Open the book | built |

`D-S17.twobooks`: no new words (the switcher is A and B's, NS-14).

### D-S18 Family page

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.members.you` | EXISTING | You | member row | read as text | n/a | built |
| `family.members.coParent` | EXISTING | Co-parent | member role | read as text | n/a | built |
| `family.members.openUntil` | EXISTING | Invited, open until {date} | D-S18.invited | read as text | n/a | F11-REQ-019 |
| `family.members.expired` | EXISTING | Invite expired | D-S18.expiredInvite | read as text | n/a | R18 |
| `family.pending.shareAgain` | EXISTING | Share again | D-S18.invited, .expiredInvite | "Share again" | Share again | built |
| `family.pending.cancel` | EXISTING | Cancel invite | D-S18.invited (works when paused) | "Cancel invite" | Cancel invite | R11 |
| `family.pending.cancelTitle` / `cancelBody` | EXISTING | Cancel this invite? / The link will stop working. | confirm | heading, text | n/a | built |
| `family.pending.keep` | EXISTING | Keep it | confirm | "Keep it" | Keep it | built |
| `family.pending.cancelled` | EXISTING | Invite cancelled. | announced | announced | n/a | built |
| `family.pending.oldStillOpen` | EXISTING | The new link is shared, but the earlier link still works. You can cancel it in the list. | after Share again, partial | read as text | n/a | F11-REQ-019 |
| `family.pending.notSent` | EXISTING | The share sheet didn't open, so nothing was sent. Both invites stay open, and you can cancel either in the list. | after Share again, failed | read as text | n/a | built |
| `family.undoJoin.window` | PROPOSED | Joined {date}. You can undo this until {weekday} at {time}. | D-S18.twoParents-undoable, under the co-parent's row (inviter only) | read as text | n/a | R4, R13 |
| `family.undoJoin.button` | PROPOSED | Undo join | D-S18.twoParents-undoable | "Undo join" / "Asks first. Their letters stay theirs." | Undo join | R4 |
| (after 72 hours) | NONE | no control, no line | D-S18.twoParents | n/a | n/a | R13 (G11) |
| `family.left.note` / `noteUnsigned` | EXISTING | {signsAs} has left {child}'s book. / Your co-parent has left {child}'s book. | D-S18.left, once | read as text | n/a | built |
| `family.errors.paused` | EXISTING | Invites are paused for now. Please try again a little later. | D-S18.paused-invites | read as text | n/a | R11 |
| (sync paused, offline) | E's system line | | D-S18.paused-sync, .offline | E's | E's | area E `SystemLine` |

### D-S19 Undo join confirm

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.undoJoin.title` | PROPOSED | Undo the join? | D-S19.default | heading | n/a | section 12 Undo Shown |
| `family.undoJoin.body` | PROPOSED | {coParent}'s phone stops receiving this book. Their letters leave the book and stay theirs. | D-S19.default | read as text | n/a | R4; D-116; section 12 Never |
| `family.leave.cantTakeBack` | EXISTING, reused | Letters already on {coParent}'s phone or in an export can't be taken back. | D-S19.default | read as text | n/a | honesty about copies already made (G10) |
| `family.undoJoin.keep` | PROPOSED | Keep them in the book | D-S19.default (primary, the safe default) | "Keep them in the book" / "Nothing changes." | Keep them in the book | section 12 Decline |
| `family.undoJoin.confirm` | PROPOSED | Undo join | D-S19.default (destructive, quiet) | "Undo join" | Undo join | R4 |
| `family.undoJoin.working` | PROPOSED | Undoing the join | D-S19.loading | announced | n/a | section 6 Slow |
| `family.undoJoin.done` | PROPOSED | {coParent} is no longer in {child}'s book. | after success, announced; the row goes | announced | n/a | R4 |
| `family.undoJoin.closed` | PROPOSED | This can no longer be undone in the app. | D-S19.error-SCPAR | read as text | n/a | R13; `SCPAR` |
| `family.undoJoin.failed` | PROPOSED | The undo did not finish. Nothing has changed. Try again. | D-S19.offline, D-S19.error-unknown | read as text | n/a | section 6 Failed |
| `family.errors.paused` | EXISTING | Invites are paused for now. Please try again a little later. | D-S19.paused-invites | read as text | n/a | R11 |

### D-S20 The other parent's phone after an undo

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.undone.note` | PROPOSED | This book is no longer shared with you. Your own letters stay yours, to read, export or delete. | D-S20.default, one `AppNote` line, once | read as text | n/a | R4; G-D17 |

No line says who did it or why, and nothing says "removed".

## 4. Back-off and stop: what never exists (NS-13 section 3a; NS-32 R8; J-N4)

The back-off is silent by design. These must not exist anywhere, and a reviewer rejects any PR that adds one:
- a notification that says reminders are slowing, pausing or stopping (the inventory's RT04 "Reminders go quiet" is withdrawn);
- a "we miss you", "it has been a while", "come back" or "your book is waiting for you" line, or any return line (RT01 to RT03, `notifications.gentleReturn`);
- a last-chance line, a farewell, a count of days or weeks, a "since your last letter";
- a line in Me, Reminders that reports the back-off ("Reminders paused", "Slowed down"); in `D-S06.backedOff` the Next line is only hidden.

Days 8 to 35 use the same evening pool as days 1 to 7, so the words never show that time has passed. When reminders come back on, or a letter is made, nothing says "welcome back".

## 5. Quiet days (NS-07 C5; BL-974)

The built strings stand (C5 section 3.16).

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `tonight.notMuchButton` (same text as `notMuch.button`) | EXISTING | Not much today | D-S21.default | "Not much today" / "Marks today without writing anything." (`notMuch.confirmBody`) | Not much today | C5-1 |
| `notMuch.savedToast` | EXISTING | A quiet day, kept. | D-S21.kept (in place, no timer, T4 met) | announced | n/a | C5-5, C5-6 |
| `notMuch.undo` | EXISTING | Undo | D-S21.kept | "Undo" / "Removes today's mark." | Undo | C5-6 |
| `notMuch.saveFailed` | PROPOSED | Today's mark did not save. Try again. | D-S21.error-save | read as text | n/a | C5 section 3.5 (G14) |
| `common.tryAgainButton` | EXISTING | Try again | D-S21.error-save | "Try again" | Try again | built |
| `book.quietDay.label` | EXISTING | A quiet day | D-S22.default, .consecutive (small muted note, unsigned, with the date) | `book.quietDay.a11y` | n/a | C5-1, C5-9 |
| `book.quietDay.a11y` | EXISTING | {date}. A quiet day, kept. | D-S22.default | (this is the label) | n/a | section 3.6 |
| `book.quietDay.remove` | EXISTING | Remove this mark | D-S22 menu | "Remove this mark" | Remove this mark | built |
| `book.quietDay.removedToast` | EXISTING | Mark removed. | after Remove | announced | n/a | built |

`D-S22.hiddenByLetter`: no row, no words. Consecutive quiet days are separate rows with no run line and no group heading (C5-9); no string counts them (C5-3).

## 6. Error messages per code

What happened, and what the parent can do. No blame, no fear.

| Code | Key | Status | Text | State |
|---|---|---|---|---|
| `share_temp_write_failed` | `shareCopy.letter.pictureFailed` | PROPOSED | The picture could not be added. The words will still go. | D-S02.error-share_temp_write_failed |
| `ScheduleResult { ok: false }` | `reminderCopy.settings.scheduleFailed` + Try again | EXISTING | Could not set reminders just now. | D-S04.yes-failed, D-S06.scheduleFailed, D-S08.error-scheduleFailed |
| permission denied | `reminderCopy.settings.deniedTitle`, `deniedBody` + Open Settings | EXISTING | Notifications are off / Turn them on in Settings to get these reminders. | D-S06.denied |
| typed day: no words | `reminderCopy.typedDay.saveReason` | PROPOSED | Add a few words to save. | D-S08.empty |
| typed day: at the limit | `reminderCopy.typedDay.tooLong` | PROPOSED | That is as much as fits here. | D-S08.tooLong |
| typed day: stale date | `reminderCopy.typedDay.errorPast` | PROPOSED | Choose a day after today. | D-S08 guard |
| typed day: notifications off | `reminderCopy.typedDay.notAllowed` | PROPOSED | Notifications are off, so this day can only arrive once they are allowed. | D-S08.notAllowed |
| `SCINV` expired | `family.errors.expired` | EXISTING | This invite has expired. Ask for a new one. | D-S15.error-expired |
| `SCINV` used | `family.errors.used` | EXISTING | This invite has already been used. Ask for a new one if that wasn't you. | D-S15.error-used |
| `SCINV` revoked | `family.errors.revoked` | EXISTING | This invite was cancelled. Ask for a new one. | D-S15.error-revoked |
| `SCINV` already a member | `family.errors.already_member` | EXISTING | You're already part of this book. | D-S15.error-already_member (with Open the book, R9) |
| `SCINV` not found | `family.errors.not_found` | EXISTING | That link does not open an invite. Check it and try again. | D-S15.error-not_found |
| `SCINV` retry | `family.errors.retry_new_invite` | EXISTING | That did not go through. Try again. | D-S13.error-retry_new_invite |
| `SCCAP` (invitee) | `family.errors.book_full` | EXISTING | This book already has two parents. Ask the person who invited you. | D-S15.error-book_full (R5) |
| `SCCAP` (inviter) | `family.create.full` | EXISTING | {child}'s book has two parents. | D-S13.full |
| `SCPAR` | `family.undoJoin.closed` | PROPOSED | This can no longer be undone in the app. | D-S19.error-SCPAR (R13) |
| 42501 | `family.errors.not_allowed` | EXISTING | That isn't possible from here. | any stale deep link |
| `SCKIL` (`killSwitches.invites`) | `family.errors.paused` | EXISTING | Invites are paused for now. Please try again a little later. | D-S13, D-S15, D-S18, D-S19 `.paused-invites` (cancel still works) |
| `SCCON` consent | `family.errors.consent_needed` | EXISTING | Finish setting up your account first. | D-S13.error-consent_needed, D-S15.error-consent_needed |
| `SCCON` family-share | `family.errors.family_share_consent` | EXISTING | Sharing a book now asks for one more agreement. Update the app to see it, then try again. | D-S13.error-family_share_consent (a build without D-S16) |
| not a parent | `family.errors.not_parent` | EXISTING | Only a parent of {child}'s book can invite. If you just signed in, give it a moment and try again. | D-S13.error-not_parent |
| rate limited | `family.errors.rate_limited` | CHANGE | No more invites can go out today. You can send one tomorrow. | D-S13.error-rate_limited |
| signed out (PGRST301, 303) | `family.errors.signed_out` | EXISTING | Sign in again to continue. | D-S15.error-signed_out |
| book deleted | `family.errors.book_deleted` | EXISTING | This book isn't available. | D-S15.error-book_deleted |
| offline | `family.errors.network` | EXISTING | This phone is offline. Try again once it is back online. | D-S13, D-S15, D-S16 `.offline` (one line, nothing half-joins) |
| accept failed or answer lost | `family.errors.joinFailed` | PROPOSED | Joining did not finish. Nothing has changed. Try again. | D-S16.error-unknown (R10: no membership was made; a retry that finds the membership opens the book) |
| unknown | `family.errors.unknown` | EXISTING | That did not go through. Try again. | D-S13.error-unknown, D-S15.error-unknown |
| undo failed | `family.undoJoin.failed` | PROPOSED | The undo did not finish. Nothing has changed. Try again. | D-S19.offline, .error-unknown |
| quiet day not saved | `notMuch.saveFailed` | PROPOSED | Today's mark did not save. Try again. | D-S21.error-save |

`rate_limited`: "That's a lot of invites for one day" reads as a comment on the parent; the new line says what is true and what they can do.

## 7. Empty states

| Screen | State | Words |
|---|---|---|
| D-S01 | no kept letter of one's own | no letter page, no control; nothing invites sharing (NS-05 section 6). NONE |
| D-S06 | reminders off | `settings.reminders.help` and the two priming lines |
| D-S06 | D-S06.typedDaysEmpty | `reminderCopy.typedDay.sectionHelp` and Add a day; no "nothing yet" line |
| D-S06 | D-S06.monthNoBirthDate | `reminderCopy.settings.birthDateNote` |
| D-S13 | D-S13.emptyBook | the same words; the invite works with an empty book |
| D-S17 | the other parent joins an empty book | the Book's own empty state (area B: `book.empty.bookTitle` "The first page is waiting.") |
| D-S18 | no pending invite | no row |
| D-S22 | a book with only quiet days | rows by date, unsigned; no summary line |

## 8. Notification matrix (D-S10 on one page)

| Class | Title, default | Body, default | Names on | Hidden preview | Lands on | Never |
|---|---|---|---|---|---|---|
| evening | `reminderCopy.neutral.evening[n]`, rotated | the same row | `notifications.evening[n]` | `notifications.placeholder.evening` | Home | name by default, letter words, count, Plus, Keep, due date |
| monthAge | Month {month} begins | A new month in the book is open. | `notifications.monthOpen` | `notifications.placeholder.month` | Book | as above |
| birthday | A birthday today | The book is here whenever you want to read it together. | Happy birthday to {child} | `notifications.placeholder.birthday` | Book | as above; "a year of" |
| typedDay | A day you wanted to remember | Tap to see the words you added for today. | the names switch does not apply; the show-words switch puts the words in the body | `notifications.placeholder.typedDay` | Home, words above the prompt | our words added to theirs; countdowns, "days until" |
| plan | Plus | `billing.reminders.*` with {date} | never a name | `notifications.placeholder.plan` | Me, Plan | price, child, letter, allowance, Keep |

## 9. The pilot artefacts the parent sees (NS-03; not app screens; D-S23)

These go to counsel first (NS-03-R1) and live in the pilot plan in `docs/research/studies/`, never in `packages/content`. `{app}` is the public name from `packages/brand`, rendered before counsel reads (the card writes `{brand.name}`; the same value, G16). Each text is the card's intent, tightened to VOICE.md; the changes follow the table. Each line reads the same on a call.

| Key | Status | Text | State | Card row |
|---|---|---|---|---|
| `pilot.recruit` | PROPOSED | Hi. We are trying out a small idea and would value your help. If you are willing, you would send one of your letters to a grandparent or another relative, in your own messages, and tell us a week later how it went. We would not see the letter. It takes about ten minutes in all. Would you like to hear more? | D-S23.recruit | NS-03 section 7 Recruit |
| `pilot.consent.lead` | PROPOSED | We are testing one idea: you send one letter from {app} to a relative, using your own messages, and we ask how it went. | D-S23.consentW, .consentV | section 15 Shown |
| `pilot.consent.what` | PROPOSED | You choose the letter and the person. We do not see the letter, the recording, the picture or your child's name. We only ask you a few questions, one week apart, and write short notes. | D-S23.consentW, .consentV | section 15 Shown |
| `pilot.consent.voice` | PROPOSED | If you are in the group that sends a recording: you will send a recording of your child's voice to a relative, through your own messages. You choose whether to send it and to whom. We never receive it. | D-S23.consentV only | section 15 Shown (V) |
| `pilot.consent.stop` | PROPOSED | You can stop at any time. If you stop, we delete your notes. Your book and your letters are not affected either way. | D-S23.consentW, .consentV | section 15 Shown; R5 |
| `pilot.consent.ask` | PROPOSED | Do you agree? Yes, or No thanks. | D-S23.consentW, .consentV | section 15 Decline |
| `pilot.instructionW` | PROPOSED | Pick one letter you are happy to share. Send it to one person you choose, in the message app you already use, as the PDF of that one letter (or, if the app cannot make that, a screenshot of that one page). Say anything you like to them. Please do not send anything to us, and please send only the letter. We will check in on day 3 and day 7. | D-S23.instructionW | section 7 Instruction W |
| `pilot.instructionV` | PROPOSED | Pick one letter you are happy to share. Send it to one person you choose, in the message app you already use, as the PDF of that one letter (or, if the app cannot make that, a screenshot of that one page). If you want them to hear your voice, also send the recording. You will be sending a recording of your child's voice to that person, and you choose whether to. If they do not use iMessage or WhatsApp, a recording longer than about two minutes may not arrive by text message, so send it by email or a messaging app instead. Say anything you like to them. Please do not send anything to us. We will check in on day 3 and day 7. | D-S23.instructionV | section 7 Instruction V |
| `pilot.scriptA` | PROPOSED | 1. Did you send it? Yes, or not yet. 2. Did anything get in the way? A few words is plenty. 3. Is there anything you would rather we did not ask? If so, we will drop it. | D-S23.scriptA | section 7 Script A |
| `pilot.scriptB` | PROPOSED | 1. What did the person do with it? Read it, replied, asked for another, or nothing that you know of. (V: also "listened".) 2. Did they manage on their own, or did they need help? What kind? 3. (V) How did you feel about your child's voice going to them this way? (W) How did you feel about sending it this way? 4. If you could do it again, how would you want to send it? 5. Would you send another one next week? Yes, no or not sure. 6. Did it reach only the person you meant, and did they pass it on to anyone else that you know of? | D-S23.scriptB | section 7 Script B (the coded answers keep their words, so the codes still map) |
| `pilot.scriptC` | PROPOSED | Could you read it (V: read it or listen to it) without help from anyone? Yes, or what got in the way? | D-S23.scriptC | section 7 Script C |
| `pilot.close` | PROPOSED | Thank you. We will delete your notes whenever you ask. We will let you know what we decide. | D-S23.close | section 7 Close |

Changes from the card: the consent lead moved to "you send" (the card's "a parent sends ... using your own messages" mixed persons); "by the message app" became "in the message app"; Instruction V's semicolons became a comma and "so" (plainer read aloud); Script A Q3 says what happens to the answer; the close says "whenever you ask" (the card's "if you ask, any time" said it twice). Nothing names a feature, a price, a reward or a gift; nothing asks the parent to forward anything to us; no count. The in-app part of the pilot is Export of one letter (area C); this area adds no app string for it.

## 10. Built keys that must not render (no "coming soon" in any build; v1.1 family)

| Key | Text today | Rule | Proposal |
|---|---|---|---|
| `family.soon.*` | "Coming soon", "For now, this book is yours.", "In a later update ..." | D-161 draft; founder 11 and 19 Nov; NS-05 section 3.1; NS-25 R1 | Not drawn today (comment in `family.en.ts`). Delete in the dead-copy sweep so no screen can reach them |
| `family.leave.later` | Leaving a shared book is coming in a later update. | Reachable at `/invite/leave` in a build with sharing on (comment in `family.en.ts`): a coming-soon line in a live alpha | Hide the route while D-113 holds Leave (BL-444), then delete the line. A stale deep link gets `family.errors.not_allowed` |
| `settingsMore.remindersNotYet` | Reminders are not on in this version. | Unread (`strings.en.ts:1554` note) | Delete |
| `book.empty.familyTitle`, `familyBody`, `familyCta`; `invite.*` (family beyond the co-parent); `notifications.familyLetter`, `familyAdded`; `children.settings.familyCanReadLabel` | grandparents, aunts, uncles | v1.1; VOICE.md; NS-25 section 16 bans "invite grandparents" | Keep dark; no D screen draws them |

## 11. Changes to built strings (old to new)

| Key | Old | New (PROPOSED) | Why |
|---|---|---|---|
| `reminderCopy.priming.privacyLine` | Notifications never show what you write. Names stay off the lock screen unless you turn them on. | Notifications never show the words of a letter. Names stay off the lock screen unless you turn them on. | With NS-18 a parent can choose to show their typed words, so "never show what you write" would be false. Same words as `settings.privacy.notificationsLine` |
| `reminderCopy.priming.quietLine` | Only in the evenings you pick, and never late at night. | Never late at night, and you can change them any time. | Birthday messages come at 09:00, month messages on the month-day and typed days on their day: not only "the evenings you pick" |
| `reminderCopy.settings.quietHelp` | Reminders come between 7 AM and 9:30 PM, and stay quiet on a day you have already written. | Reminders come between 7 AM and 9:30 PM, and not on a day you have already said or typed a letter. | R8, R27: a spoken letter, or one waiting to be kept, counts too. Ship with R27 (section 12) |
| `reminderCopy.settings.namesHelpOff` | Notifications say "your little one" and show no names on the lock screen. | No names on the lock screen, except in your own words if you choose to show them. | Not every neutral line says "your little one"; typed words may hold a name (NS-18 section 5) |
| `onboarding.reminder.noneHelp` | You can write whenever you like. | You can turn reminders on in Me whenever you like. | NS-13 section 12 Decline: "Me explains in one sentence"; the old line did not say where |
| `reminderCopy.neutral.birthday.body`, `birthdays.body`, `notifications.birthday.body` | A year of letters. Want to read them together today? | The book is here whenever you want to read it together. (`birthdays`: "The books are here whenever you want to read them together.") | "A year of letters" claims a year of letters exists and frames a count |
| `family.card.body` (if the card form is drawn) | Invite {child}'s other parent. They write from their own phone, and you both read the whole book. | Invite {child}'s other parent. They write from their own phone, and you both read every letter in the book that is not private. | NS-25 R3 |
| `family.create.body` | They can write to {child} and read the whole book, from their own phone. | They can write to {child} from their own phone. | The new `whatTheyRead` line says exactly what is shared (R16) |
| `family.accept.askBody` | You will both read every letter in the book. Join only if you know who sent you this link. | You will both read every letter in the book that is not private. Join only if you know who sent you this link. | R3 |
| `family.errors.rate_limited` | That's a lot of invites for one day. You can send more tomorrow. | No more invites can go out today. You can send one tomorrow. | No comment on the parent |

## 12. Claims check

Every line in this area that makes a promise, and the card Claims section it stays inside. No public line (store, website, email) in this file makes a new claim; the invite link page states only what the page does.

| Line | Promise | Card Claims section | Inside? |
|---|---|---|---|
| `shareCopy.letter.whereItGoes` "It goes only where you send it. Once sent, it cannot be taken back." | Our app sends the letter nowhere else; a sent message cannot be recalled | NS-05 section 18 (enables "Send one letter ... from your own messages"); section 17 Q43; SH-R8 | Yes: R3a and R9 (no network call, nothing recorded). Silent on what the recipient's app does (threat table residual). Q43 reads it |
| `shareCopy.letter.versionFixes`, `versionExact` | The text sent is the version the Book shows | NS-05 R19; forbids "the recipient sees every change" | Yes; neither says marks travel; `versionExact` only when the words are untouched |
| `shareCopy.letter.wordsAlways`, `picture` | The words always go; the picture only if turned on | R4b, R5b | Yes |
| `reminderCopy.priming.privacyLine` (new) | No letter words in notifications; names only by choice | NS-13 section 19 enables "Reminders don't show your child's name unless you choose"; NS-32 section 19 forbids promising the lock screen shows nothing | Yes: it speaks only of what we send, not of "Show Previews" or iOS summaries (G-D18) |
| `reminderCopy.settings.namesHelpOff` (new) | No names on the lock screen except words the parent chose to show | NS-13 section 19; NS-18 R3 | Yes |
| `reminderCopy.priming.quietLine` (new), `quietHelp` (new) | Never late at night; 7 AM to 9:30 PM; quiet on a day with a letter | NS-13 R30, R8 | Yes once BL-943 lands R8 with drafts counted (R27). The built planner counts only saved letters, so the `quietHelp` change ships in the same PR as R27 |
| `reminderCopy.typedDay.sectionHelp` "A day you add gets one message on that day, at your reminder time. Your words stay on this phone." | Delivery on the day; no sync | NS-18 section 19 "None public"; R1 (device); section 10 (not synced) | In-app only. "Gets one message" is as firm as the built reminder lines; no "can come late" caveat (G8). "Stay on this phone" is true: settings and the iOS pending list are on the phone, never synced |
| `reminderCopy.typedDay.remindersOffNote` | Typed days arrive with reminders off | NS-18 section 5 (PROPOSED behaviour) | Only if the CPO keeps that behaviour (G7); otherwise the key goes |
| `reminderCopy.typedDay.notAllowed` "this day can only arrive once they are allowed" | Nothing arrives while notifications are off | NS-18 section 6 Failed; G-D11 | Yes. It does not promise delivery once allowed (`DESIGN.md`'s intent "will be sent once they are allowed" would, and a day can pass before the parent allows them) |
| `reminderCopy.typedDay.showWordsHelpOn` | The words show as typed, names included | NS-18 R3 | Yes; a warning, not a promise; nothing about iOS summaries (G-D18) |
| `family.create.whatTheyRead` | The other parent reads every letter that is not private, earlier ones too | NS-25 R16, section 12; counsel Q48 | Yes; this is the line Q48 reads |
| `family.create.planLine` | Allowance per author; Plus only through Apple Family Sharing | NS-25 section 20; D-053, D-103 | Yes, pending the founder's D-053 call (NS-25 OQ). In-app, alpha only |
| `family.accept.askBody`, `family.card.body` (new) | Both read every letter that is not private | NS-25 section 19 enables "Both parents in one book, each letter signed" only after the gates | In-app, alpha only (D-162). No public copy until the gates; BRAND.md line 40 still needs its rewrite (NS-25 section 22) |
| `family.accept.agreementLine` | Joining shares the book between two people | NS-25 section 12 Accept; R17; Q48 | Yes; counsel reads with the agreement |
| `family.undoJoin.body` "Their letters leave the book and stay theirs." | Undo never deletes the other parent's letters | NS-25 R4, section 12 Never | Yes (`undo_parent_join` sets them private) |
| `family.undone.note` "Your own letters stay yours, to read, export or delete." | The removed parent keeps their letters | NS-25 R4 | Yes |
| `site.invite.iphoneOnly` "{app} works on iPhone." | Platform | NS-25 section 5; CR-131 | Yes; no "for now", no other platform named |
| `pilot.consent.what` "We do not see the letter, the recording, the picture or your child's name." | The team receives nothing | NS-03 section 3, section 15 Never; section 21 forbids any public line | Yes; not public; counsel reads (R1) |
| `pilot.consent.stop` "If you stop, we delete your notes." | Deletion on withdrawal | NS-03 R5 (2 working days) | Yes |
| `notMuch.*`, `book.quietDay.*` (built) | One tap keeps the day without words | NS-07 C5 section 3.18 | Yes |
| Plan notices (built) | Dates, and where to change them | in-app-disclosures row 35; D-094 ("a courtesy that can come late or not at all") | Yes; the caveat lives in `billing.confirmation.reminders`, untouched here |

Claims this area never makes (the cards' Forbids): "share your voice", "private link", "family can listen", "share with grandparents", "never miss a day", "stay on track", "smart reminders", any streak word, "at most one a day" (NS-32 allows it only after R1 passes on a device, and plan notices can make two on one day), any promise about what the lock screen shows beyond what we send, "coming soon", "invite grandparents".

## 13. Rules check run on this file

A script read every string in the Text, Title, Body, Named title, Named body and Placeholder columns (not the "Never", "Banned" and "Why" text, which quote banned words on purpose) with the patterns copied from `packages/content/test/rules.test.ts`: no non-ASCII character (so no em or en dash, curly quote, ellipsis character or emoji); FEAR; AI-writing (including "smart", "generate", "polish", "perfect", "enhance"); GAP ("missed", "in a row", "since your last", "streak"); DAY_COUNT and DAILY (so no "one a day", "every day"); gendered pronouns and child nouns; CR-25 internal terms (entry, draft, pack); fearful security words and "safe"; exclamation marks (0); notification titles at most 40 and bodies at most 110 characters as templates; buttons at most 22. One hit, a built string outside the scope of the rule it matched: `family.create.linkNote` "for 7 days" (the day-count rule covers reminder, notification and moment strings only, and this is an expiry fact). It is a copy of the patterns, not the repo suite: every key must pass `npm test` in `packages/content` when it lands.

## 14. Reconciliation with DESIGN.md and MOTION.md

State ids above are `DESIGN.md` section 3's. Words in `DESIGN.md` that should change to match this file (the design lead updates the wireframes and section 5.1):

| Where in `DESIGN.md` | Its words | This file |
|---|---|---|
| D-S06 wireframe footer | "Notifications never show what you write ... Only in the evenings you pick, and never late at night." | `privacyLine` and `quietLine` CHANGE (section 11) |
| D-S06 wireframe time footer | "stay quiet on a day you have already written" | `quietHelp` CHANGE |
| D-S06 wireframe names help | "Notifications say "your little one" ..." | `namesHelpOff` CHANGE |
| D-S06 typed-day footer (intent) | "A day you add gets one message on that day. Your words stay on this phone." | `sectionHelp`, adding "at your reminder time" |
| D-S04 toasts | "You can write whenever you like."; "Notifications are off" | `noneHelp` CHANGE; the built denied toast is `notSendingYet` "Not sending yet." with Open Settings |
| D-S04 rhythm line | "A few times a week, Tue and Sat, 8:30 PM" | `rhythmLine` "{label} at {time}" (no day list: it would be a sentence assembled from chips) |
| D-S08 | title "Add a day", "DATE", "YOUR WORDS" | kept: `sheetTitle` "Add a day", `dateLabel` "Date", `wordsLabel` "Your words" |
| D-S08 `.tooLong` (intent) | "80 letters at most" | `tooLong` "That is as much as fits here." ("letters" is the product's word for what a parent makes, and a number reads as a counter) |
| D-S08 `.notAllowed` (intent) | "This day is saved and will be sent once they are allowed." | `notAllowed`: no promise of delivery (section 12) |
| D-S13 wireframe body | "They can write to Asha and read the whole book, from their own phone." | `create.body` CHANGE |
| D-S14 `.otherDevice` (intent) | "The app is for iPhone for now." | `site.invite.iphoneOnly` "{app} works on iPhone." |
| D-S15 wireframe body | "You will both read every letter in the book." | `askBody` CHANGE |
| D-S18 (intent) | "Joined {date}. You can undo this until {weekday}, {time}." | `undoJoin.window` with "at" |
| D-S19 (intent) | "Undo the join?"; "Their letters leave this book and stay theirs. Their phone stops receiving this book."; "Keep them in the book"; "Undo join"; SCPAR "This can no longer be undone here." | kept, with the co-parent's name in the body, `cantTakeBack` added (G10), and "in the app" in `closed` |
| D-S20 (intent) | "This book is no longer shared with you. Your own letters stay yours." | kept, adding "to read, export or delete" (R4) |
| Section 5.1 birthday row | "A year of letters. Want to read them together today?" | CHANGE (section 11) |
| Section 3, D-S04 | no failed state | add `D-S04.yes-failed` (the built toast with Try again) |

`MOTION.md` uses `D-S02.picture-off`, `.picture-on`, `.picture-failed`, `D-S04.pick-time`, `D-S08.error`, `D-S11.home`, `D-S11.home-typed-day`, `D-S17.joined`. `DESIGN.md`'s names are `D-S02.pictureOff`, `.pictureOn`, `.error-share_temp_write_failed`, `D-S04.picking`, `D-S08.tooLong` and `.notAllowed`, `D-S11.evening`, `D-S11.typedDay`, `D-S17.ready`. The motion lead renames to match; no announcement in `MOTION.md` may carry words other than the keys here (the kept line, the toasts, the pictureFailed line).

## 15. Card gaps

`DESIGN.md` section 10 holds the design gaps (G-D01 to G-D20). The rows below are words gaps; where one matches a G-D row it says so.

| Id | Card row | What is missing or wrong | Proposed default |
|---|---|---|---|
| G1 | NS-32 section 16 | The placeholder intent "A note for tonight" uses "note" for something we send (BRAND.md glossary) and "tonight" for classes that come at 09:00 or on any day | One neutral line for every budgeted class, "Something for the book, whenever you have a minute."; plan: "A reminder about your plan." (= G-D19) |
| G2 | NS-13 section 12 | "Two equal choices" against the built three buttons | As G-D04: two equal answers and a "Change the time" control |
| G3 | NS-13 R6a; NS-32 R12; NS-05 R6a reasoning | The neutral birthday title "A birthday today" tells anyone who sees the lock screen that today is a birthday, which NS-05 treats as an L4 fact | Keep the built title for v1.0 (founder-approved, names no child). CPrivO decides; the fallback is "Something for the book today" |
| G4 | NS-13 section 16 | The birthday body "A year of letters" claims a year of letters | Changed (section 11) |
| G5 | NS-13 R10 | Several evening lines assume a born child ("Something your little one did, said or tried"); R10 bans due-date wording only | Tag each line "before birth: yes or no" (section 2) and plan only "yes" lines when every included book is expecting. Built `[6]` and named `[4]` are "no" |
| G6 | NS-18 section 5 | Today as a typed day | As G-D10: tomorrow onward; `errorPast` only guards a stale date |
| G7 | NS-18 section 5 (PROPOSED) | Typed days still come with Reminders off, but the main switch is called "Reminders" | Keep the card's proposal and show `remindersOffNote`; CPO confirms |
| G8 | NS-18 section 19 | Whether typed-day help needs a "can come late" caveat like plan notices | No caveat: the same footing as the built reminder lines |
| G9 | NS-13 section 4 step 5, section 15 | "Nothing on screen says so" about the back-off. Honest about pressure, but a parent whose reminders stopped may think the app broke | Keep silent (card). If testers say so (NS-13 section 21 question 2), consider one static help line in Me, Reminders: "Reminders ease off on their own when the book has been quiet, and start again when you make a letter." Not shipped by default |
| G10 | NS-25 R4 | After an undo, what happens to the inviter's letters already on the other parent's phone is not stated | D-S19 reuses `family.leave.cantTakeBack`. Engineering confirms against `undo_parent_join` and the pull path; if the pull removes them, the line goes |
| G11 | NS-25 R13, Q50 | After 72 hours there is no removal and no words; a parent in a hard situation finds nothing on the Family page | No line there (card). The support runbook owns it (Q50). If counsel asks for a pointer: "For help with who is in this book, write to us." in Help, never on the Family page |
| G12 | NS-05 OQ-6 | The verb | "Share this letter", with `legal` |
| G14 | NS-07 C5 section 3.5 | "The standard save error" says "Your words are safe on this phone" about a mark that has no words | `notMuch.saveFailed` |
| G15 | Brief section 4 ("no Plus ... in any reminder") against NS-32 | Plan notices must name Plus | Scoped: the rule holds for the budgeted classes; plan notices name Plus and nothing else of the plan (no price, allowance or Keep) and never merge with a reminder |
| G16 | NS-03 section 7 | Scripts write `{brand.name}`; content uses `{app}` | Either renders from `packages/brand`; `{app}` here |
| G17 | NS-25 section 5 row 1 | "iPhone only for now" hints at a later version | "{app} works on iPhone." |
| G18 | NS-18 section 10 against G-D14 | The card's data model has one `typedDay.showWords` switch; `DESIGN.md` puts a switch in each day's sheet | The words work either way (the help lines speak of "the notification", not "all days"). CPO decides; G-D14's per-day default needs the key shape `typedDay.<date>.showWords` |

(G13 from the first draft, the child's name in the sign-off label before Join, is closed: `DESIGN.md` moves the field to D-S17.ready, after Join.)

## 16. Engineering gaps

| Gap | Backlog row |
|---|---|
| New file `packages/content/src/features/share.en.ts` exporting `shareCopy`, registered in `features/index.ts` so the rules test scans it | BL-939 |
| `reminderCopy.neutral.typedDay` and `notifications.placeholder.*` sit under paths the rules test reads for notification length and rhythm (`features.reminders.neutral`, `en.notifications`) | BL-966, BL-982 |
| `hiddenPreviewsBodyPlaceholder` per category through expo-notifications (support UNVERIFIED; = E-D02) | BL-966 |
| Growing the evening pool to 31 keeps the named pool in the same order (`planner.ts` picks by index); a `beforeBirth` flag per variant (G5) | BL-943 |
| `planner.ts:259` uses the single-book birthday body with joined names; add `notifications.birthdays` and use it | BL-943 |
| `onboarding.reminder.rhythmLine` and `changeTimeButton` in the ask card; retire `pickTimeButton` and `cta` (= E-D05) | BL-943 |
| `quietHelp` change ships in the same PR as NS-13 R27 (drafts count) | BL-943 |
| Typed-day sheet keys and the VoiceOver-only `homeA11y` prefix on `TypedDayLine` | BL-982 |
| `family.errors.joinFailed` mapped from a failed or lost accept answer (today it falls to `unknown`) | BL-983 |
| The undo-join row, sheet and the other parent's one-time note (`family.undoJoin.*`, `family.undone.note`; = E-D07, E-D15) | BL-983 |
| `family.accept.role`, and the D-S16 agreement keys for the family-share step | BL-983 |
| `site.invite.getApp` and `site.invite.iphoneOnly` in `apps/web/src/content/site.ts` (= E-D11); that file is outside `packages/content`, so the rules test does not read it today | BL-983 |
| Hide `/invite/leave` while D-113 holds Leave, so `family.leave.later` can go | BL-983 or BL-444 |

## 17. Hand-offs to other areas

- Area C (sign-out sheet C-S03; D1): NS-13 R14 and NS-18 R6 remove reminders and typed days at sign-out. `DESIGN.md` G-D07 says no line on the sheet; agreed, because the sheet's words are fixed by D1. Erase everything and account deletion follow the same rule.
- Area E (Me, Plan E-S11): D-S24 strings are on E's screen. The plan notice bodies say "Settings, Plan" while the tab is Me; rename only with `legal` (in-app-disclosures rows 34 and 35 cite the wording).
- Area B (letter page B-S08): `shareCopy.letter.action` sits in B's action row.
- Area A (Home A-S01): the typed-day line (D-S11.typedDay) and the quiet-day words (D-S21) are A's layout with these words.
- `legal`: Q43 on `whereItGoes`, `privacyLine`, `namesHelpOff`; Q48 on `whatTheyRead` and `agreementLine`; OQ-6 on the verb.
- Founder: approve every PROPOSED and CHANGE line before any build outside his family shows it.
