# Area D: Family, sharing and reminders. Words

Status: draft for reconciliation (content lead, area D, 20 Nov 2026). Every new or changed string is PROPOSED; the founder approves words before any build outside his family shows them (BRIEF section 2).

Keyed to the screen ids in `DESIGN.md` (skeleton of 20 Nov: D-S01 to D-S24). The design lead had not yet written state names when this file was written, so the state suffixes below are mine (`D-Snn.<state>`), built from each card's states and the built strings. The reconciliation pass renames them to match `DESIGN.md`; the keys do not move.

Sources read: BRIEF.md; cards NS-05, NS-13, NS-18, NS-25 (10-reading-and-family), NS-32 (11-foundations), NS-07 C5, NS-03; 14-test-plan journeys J-N3, J-N4, J-N11, J-N19, J-N22, J-N24, J-N26, J-N27; `packages/content/VOICE.md`, `BRAND.md`, `test/rules.test.ts`; `docs/design/NOTIFICATIONS.md`, `docs/design/notifications/COPY_INVENTORY.md`; `docs/design/specs/03-SHARE-ONE-LETTER-11nov.md`; `docs/legal/in-app-disclosures.md`; built strings in `packages/content/src/strings.en.ts` and `src/features/{reminders,family,billing}.en.ts`; screens `components/asks/reminder-prime-ask.tsx`, `app/settings/reminders.tsx`, `lib/reminders/planner.ts`. Backlog rows: BL-939 (share), BL-943 (reminders), BL-966 (budget), BL-967 (sign-out cancels reminders), BL-974 (quiet days), BL-982 (typed days), BL-983 (other parent), BL-981 (studies).

## 0. How to read this file

Status column:
- **EXISTING**: a built key, reused as it is. Text quoted from `packages/content` today.
- **CHANGE**: a built key whose text this file proposes to replace (old text in section 11). PROPOSED.
- **PROPOSED**: a new key. Namespaces: `shareCopy.*` (new file `packages/content/src/features/share.en.ts`, the slot names of spec 03 section 7), `reminderCopy.*` and `familyCopy.*` (existing files), `pilot.*` (not app copy: lives in `docs/research/studies/`, see section 9).
- **NONE**: the card says no words appear here; listed so nobody adds one.

Columns: Key, Status, Text, Where (state id), VoiceOver (label; hint after a slash), Voice Control name, Card row. Voice Control name equals the visible label everywhere (NS-33); "same" means exactly the visible text.

Placeholders used: `{child}`, `{coParent}`, `{inviter}`, `{signsAs}`, `{date}`, `{time}`, `{month}`, `{weekday}`, `{app}`. All are in the rules test allowlist; no new placeholder is needed. Where a line joins the parent's own words with ours (a typed day, the share preview), the screen shows two separate text elements and VoiceOver reads them in order; no template assembles them (no `{words}` placeholder, CR-25 and the "no assembled sentences" line of NS-05 section 8).

Lint run on this file: section 13 says what was checked and how.

## 1. Share one letter, Level 1 (NS-05; BL-939; flag `EXPO_PUBLIC_SHARE_LETTER`)

Verb decision (NS-05 OQ-6, `content` with `legal`): **Share**. Reasons: it is the word on the iOS sheet that opens next, so the label tells the truth about what happens; "Send" suggests the app sends something, and it does not (R3a, R9); "Give" reads as a gift, which section 16 bans. `legal` co-signs (OQ-6); until then the label stays PROPOSED.

### D-S01 Letter page action row

States: `D-S01.present` (own, open, kept letter with words, flag on), `D-S01.absent` (another parent's letter, sealed, quiet day, no words yet, waiting to be kept, flag off: the control is not drawn and no line explains why, R1, R7, R26).

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `shareCopy.letter.action` | PROPOSED | Share this letter | D-S01.present | "Share this letter" / "Shows what will be sent first." | Share this letter | NS-05 section 16, R1, R13a |
| `book.entryMenu.shareButton` | EXISTING, not drawn | Share | none today (spec 03 section 2: no screen reads it) | n/a | n/a | Keep unused; the letter page uses `shareCopy.letter.action`. Remove in the dead-copy sweep |
| (none) | NONE | | D-S01.absent | No hint, no dimmed control | n/a | R7 |

17 characters, under the 22 cap.

### D-S02 Share preview sheet

States: `D-S02.wordsOnly` (no picture on this phone: no toggle, R5b), `D-S02.pictureOff` (default), `D-S02.pictureOn`, `D-S02.error-share_temp_write_failed`, `D-S02.versionFixes`, `D-S02.versionExact`, `D-S02.long`, `D-S02.rtl`, `D-S02.ax5`, `D-S02.dark`, `D-S02.offline` (identical to default, R9), `D-S02.lapsed` and `D-S02.signedOut` (identical, R8, D1), `D-S02.second-account` (only B's own letters reach this sheet, R27).

VoiceOver order (R13a, section 6): title, the text that leaves, the words row, the picture toggle, the version line, the where-it-goes line, Continue, Not now.

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `shareCopy.letter.title` | PROPOSED | This will be sent | every D-S02 state | heading "This will be sent" | n/a | section 16, R2 |
| `shareCopy.letter.previewA11y` | PROPOSED | What will be sent | container label of the text block; the date line, the words and the signature line are read as they are, in order | "What will be sent" then the text | n/a | R2, R13a |
| (date line) | EXISTING format | the letter's about-day from `Intl.DateTimeFormat`, or month and year | inside the preview | read as shown | n/a | R18 |
| `common.signature` | EXISTING | From {signsAs} | inside the preview, last line | read as shown | n/a | R18 (the signature the letter page shows) |
| `shareCopy.letter.wordsAlways` | PROPOSED | The words always go | static row, every state | read as text, never as a switch or dimmed (R4b) | n/a (not a control) | section 16, R4b |
| `shareCopy.letter.picture` | PROPOSED | Include the picture | D-S02.pictureOff, D-S02.pictureOn | switch "Include the picture, off" or "on" (state from the system) / "Adds the letter's picture to what is sent." | Include the picture | section 16, R5b |
| `shareCopy.letter.pictureA11y` | PROPOSED | The letter's picture | the thumbnail (no machine description, ever) | "The letter's picture" | n/a | R5b; constitution (no machine caption or alt text) |
| `shareCopy.letter.versionFixes` | PROPOSED | Sent as it reads in the book, with small fixes. | D-S02.versionFixes: the Book shows "With small fixes" and at least one fix exists | read as text | n/a | section 16, R19 |
| `shareCopy.letter.versionExact` | PROPOSED | Sent exactly as said. | D-S02.versionExact: the text sent equals the untouched words (the Book shows "Exactly as said", or the letter has no fix at all) | read as text | n/a | section 16, R19; VOICE.md "Exactly as said" only when true |
| `shareCopy.letter.whereItGoes` | PROPOSED | It goes only where you send it. Once sent, it cannot be taken back. | every D-S02 state, above Continue | read as text | n/a | section 16, R24; SH-R8 (says nothing about the recipient's copy) |
| `shareCopy.letter.pictureFailed` | PROPOSED | The picture could not be added. The words will still go. | D-S02.error-share_temp_write_failed, in place of the toggle | read as text; announced once when it appears | n/a | section 5, section 16 |
| `common.continueButton` | EXISTING | Continue | every state | "Continue" / "Opens your phone's share sheet." | Continue | section 4 step 3, R2 |
| `common.notNowButton` | EXISTING | Not now | every state | "Not now" / "Closes this. Nothing is sent." | Not now | section 12 Decline, R2 |

Notes:
- The two hints are the same length class, so neither button is read as the expected choice (spec 03 section 6).
- `versionExact` is chosen by comparing the text sent with the untouched words, never by the view name alone, so "exactly as said" is only ever true (VOICE.md, Word for word).
- No line says "private", "safe" or "secure" about what the recipient gets (SH-R8, section 18).
- Banned and absent: gift, share your voice, private link, family can listen, any count, "every change shown", any brand line (section 16, R16b).

### D-S03 iOS share sheet and return

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| (payload) | NONE beyond the wrapper | Date line, blank line, the words, blank line, signature line. No subject, no title, no footer, no brand name, no link, no "sent from" | the text handed to iOS | n/a | n/a | R16b, R18, R21 |
| (after the sheet closes) | NONE | No toast, banner, haptic or "shared" line, in every outcome (sent, cancelled, failed) | D-S03.completed | nothing announced | n/a | R12, R22 |

## 2. Reminders, typed days and the one budget (NS-13, NS-18, NS-32; BL-966, BL-943, BL-967, BL-982)

### D-S04 The reminder ask (sheet on Home after the first kept letter; at most 2 showings)

States: `D-S04.default`, `D-S04.pickTime` (only if design keeps the third button, card gap G2), `D-S04.after-yes`, `D-S04.after-yes-denied`, `D-S04.after-no`, `D-S04.after-yes-failed`.

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `onboarding.reminder.title` | EXISTING | A gentle nudge, now and then? | D-S04.default | heading | n/a | NS-13 section 12 Shown |
| `onboarding.reminder.body` | EXISTING | A couple of evenings a week, at a time you pick, to add to {child}'s book. Never late at night. | D-S04.default (in-app, so the name is fine; never on a lock screen) | read as text | n/a | NS-13 happy path 1; BL-532 |
| `onboarding.reminder.yesEveningsButton` | EXISTING | Yes, evenings | D-S04.default | "Yes, evenings" / "Turns on reminders. Your iPhone asks next." | Yes, evenings | NS-13 R31 |
| `onboarding.reminder.noneOption` | EXISTING | No reminders | D-S04.default, same size as Yes (card: two equal choices) | "No reminders" / "Nothing is set. You can turn them on in Me." | No reminders | NS-13 R31, section 12 Decline |
| `onboarding.reminder.pickTimeButton` | EXISTING, see G2 | Pick a time | D-S04.default only if kept | "Pick a time" | Pick a time | built; card says two choices |
| `onboarding.reminder.timeLabel` | EXISTING | Remind me at | D-S04.pickTime | "Remind me at, {time}" | Remind me at | built |
| `onboarding.reminder.cta` | EXISTING | Set reminder | D-S04.pickTime | "Set reminder" | Set reminder | built |
| `reminderCopy.settings.onToast` | EXISTING | Reminders are on. | D-S04.after-yes (toast) | announced | n/a | built |
| `reminderCopy.settings.nextLine` | EXISTING | Next: {weekday} at {time}. | D-S04.after-yes, after onToast | announced | n/a | built |
| `reminderCopy.settings.changeButton` | EXISTING | Change | toast action, D-S04.after-yes | "Change" / "Opens Reminders in Me." | Change | built |
| `reminderCopy.settings.notSendingYet` | EXISTING | Not sending yet. | D-S04.after-yes-denied (toast) | announced | n/a | NS-13 R16 |
| `reminderCopy.settings.openSettingsButton` | EXISTING | Open Settings | toast action, D-S04.after-yes-denied | "Open Settings" / "Opens the iPhone's Settings for this app." | Open Settings | NS-13 section 5 |
| `reminderCopy.settings.scheduleFailed` | EXISTING | Could not set reminders just now. | D-S04.after-yes-failed (toast) | announced | n/a | NS-13 section 5 (as built) |
| `common.tryAgainButton` | EXISTING | Try again | toast action, D-S04.after-yes-failed | "Try again" | Try again | built |
| `onboarding.reminder.noneHelp` | CHANGE | You can turn reminders on in Me whenever you like. | D-S04.after-no (toast) | announced | n/a | NS-13 section 12 Decline ("Me explains in one sentence") |

### D-S05 iOS permission prompt

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| (system) | NONE | iOS draws this alert and takes no purpose string for notifications. Nothing of ours shows on it | D-S05 | system | system | NS-13 section 12 |

### D-S06 Me, Reminders

States: `D-S06.off`, `D-S06.on`, `D-S06.denied`, `D-S06.quietDelivery`, `D-S06.error-schedule_failed`, `D-S06.appLock`, `D-S06.noBirthDate`, `D-S06.typedDays-empty`, `D-S06.typedDays-list`, `D-S06.typedDays-remindersOff`, `D-S06.typedDays-flagOff` (section hidden), `D-S06.ax5`, `D-S06.dark`, `D-S06.second-account` (starts off, R13), `D-S06.signedOut-after` (settings cleared, R14).

Back-off: **no string on this screen says reminders slowed or stopped** (NS-13 section 15, J-N4). See section 4 and card gap G9.

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `reminderCopy.settings.enabledLabel` | EXISTING | Reminders | the main switch, every state | "Reminders, on" or "off" | Reminders | built |
| `settings.reminders.help` | EXISTING | A nudge in the evening, as often as you choose. Never late at night. | D-S06.off footer, then the two priming lines | read as text | n/a | built (LEGAL-REQ-007 explanation first) |
| `reminderCopy.priming.quietLine` | CHANGE | Never late at night, and you can change them any time. | D-S06.off footer | read as text | n/a | NS-13 R30 (see section 11: "only in the evenings you pick" is not true of birthday and typed-day messages) |
| `reminderCopy.priming.privacyLine` | CHANGE | Notifications never show the words of a letter. Names stay off the lock screen unless you turn them on. | D-S06.off footer | read as text | n/a | NS-13 R6a, R6b; NS-18 R3 (typed words can show, by choice, so "never show what you write" stops being true) |
| `reminderCopy.settings.savesAsYouGo` | EXISTING | Changes save as you go. | D-S06.on footer | read as text | n/a | built |
| `reminderCopy.settings.previewTitle` | EXISTING | How it will look | D-S06.on, the live preview | "How it will look" then the preview title and body | n/a | NS-13 section 15 (live preview, neutral body) |
| `reminderCopy.settings.nextLine` | EXISTING | Next: {weekday} at {time}. | D-S06.on | read as text; `saved` first | n/a | built |
| `reminderCopy.settings.saved` | EXISTING | Saved. | VoiceOver only, 600 ms after a change | announced | n/a | built |
| `reminderCopy.settings.howOftenTitle` | EXISTING | How often | D-S06.on | heading | n/a | NS-13 happy path 2 |
| `settings.reminders.weeklyLabel` | EXISTING | Weekly | choice | "Weekly, not selected" | Weekly | built |
| `settings.reminders.fewTimesLabel` | EXISTING | A few times a week | choice (default) | "A few times a week, selected" | A few times a week | built |
| `settings.reminders.everyEveningLabel` | EXISTING | Every evening | choice | as above | Every evening | built (LNG-06) |
| `reminderCopy.settings.eveningsTitle` | EXISTING | Which evenings | D-S06.on (few times) | heading | n/a | built |
| `reminderCopy.weekdaysShort[n]` | EXISTING | Sun to Sat | day chips | full name from `reminderCopy.weekdays[n]`, then "selected" or "not selected" | "Tue" (the visible text; the input label lists both "Tue" and "Tuesday" so either spoken name works) | NS-13 section 8 |
| `reminderCopy.settings.timeTitle` | EXISTING | Time | D-S06.on | heading | n/a | built |
| `settings.reminders.timeLabel` | EXISTING | Reminder time | row | "Reminder time, {time}" / "Opens the time picker." | Reminder time | built |
| `reminderCopy.settings.quietHelp` | CHANGE | Reminders come between 7 AM and 9:30 PM, and not on a day you have already said or typed a letter. | time section footer | read as text | n/a | NS-13 R8, R27 (a letter waiting to be kept counts too, so "written" was too narrow) |
| `reminderCopy.settings.lateNightClamp` | EXISTING | Late nights stay quiet. | under the picker when a chosen time is clamped | announced | n/a | R30 |
| `reminderCopy.settings.monthNotesLabel` | EXISTING | Month and birthday messages | switch | "Month and birthday messages, on" | Month and birthday messages | built |
| `reminderCopy.settings.monthNotesHelp` | EXISTING | A short message on the day a new month begins in each book, and on birthdays. | switch help | read as text | n/a | built |
| `reminderCopy.settings.birthDateNote` | EXISTING | Starts once a birth date is added. | D-S06.noBirthDate | read as text | n/a | NS-13 R10 (no due-date wording) |
| `settings.privacy.lockScreenLabel` | EXISTING | Names in notifications | switch | "Names in notifications, off" | Names in notifications | NS-13 section 12 (name opt-in) |
| `reminderCopy.settings.namesHelpOff` | CHANGE | No names on the lock screen, except in your own words if you choose to show them. | switch help when off | read as text | n/a | NS-13 R6a; NS-18 R3; claims section 12 |
| `reminderCopy.settings.namesHelpOn` | EXISTING | Notifications can show names on the lock screen. | switch help when on | read as text | n/a | built |
| `reminderCopy.settings.lockNames` | EXISTING | Names stay hidden while App lock is on. | D-S06.appLock (switch disabled) | read as text; switch read as "dimmed" by the system, which is true here | n/a | NS-13 section 5 (App lock) |
| `reminderCopy.settings.quietDelivery` | EXISTING | iPhone delivers these quietly, to Notification Center only. | D-S06.quietDelivery | read as text | n/a | built |
| `reminderCopy.settings.deniedTitle` | EXISTING | Notifications are off | D-S06.denied | heading | n/a | NS-13 R16 |
| `reminderCopy.settings.deniedBody` | EXISTING | Turn them on in Settings to get these reminders. | D-S06.denied | read as text | n/a | NS-13 R16 ("one sentence and Open Settings", no nag) |
| `reminderCopy.settings.openSettingsButton` | EXISTING | Open Settings | D-S06.denied | "Open Settings" / "Opens the iPhone's Settings for this app." | Open Settings | NS-13 R16 |
| `reminderCopy.settings.scheduleFailed` | EXISTING | Could not set reminders just now. | D-S06.error-schedule_failed | read as text | n/a | NS-13 section 5 |
| `common.tryAgainButton` | EXISTING | Try again | D-S06.error-schedule_failed | "Try again" | Try again | built |
| `reminderCopy.settings.offSummary` | EXISTING | Off | the Me row value when off | "Reminders, Off" | Reminders | built |
| `reminderCopy.typedDay.sectionTitle` | PROPOSED | Days to remember | D-S06.typedDays-* | heading | n/a | NS-18 section 15 |
| `reminderCopy.typedDay.sectionHelp` | PROPOSED | Add a day that is coming, in your own words. On that day, one reminder comes at your reminder time. | D-S06.typedDays-empty, section footer | read as text | n/a | NS-18 section 3, happy path 2 |
| `reminderCopy.typedDay.addButton` | PROPOSED | Add a day | D-S06.typedDays-* | "Add a day" | Add a day | NS-18 happy path 1 |
| (each day row) | EXISTING format plus the parent's words | The date in the device locale, then the words exactly as typed, as two text elements | D-S06.typedDays-list | "{date}." then the words (two elements, read in order) / "Opens this day." | the date as shown | NS-18 section 6 VoiceOver |
| `reminderCopy.typedDay.showWordsLabel` | PROPOSED | Show my words in the notification | D-S06.typedDays-list (one switch for all days, `typedDay.showWords`) | "Show my words in the notification, off" | Show my words in the notification | NS-18 section 3, section 12 Shown |
| `reminderCopy.typedDay.showWordsHelpOff` | PROPOSED | The notification says only: A day you wanted to remember. | switch help when off | read as text | n/a | NS-18 R3, section 12 Decline |
| `reminderCopy.typedDay.showWordsHelpOn` | PROPOSED | Your words show on the lock screen as you typed them, names included. | switch help when on | read as text | n/a | NS-18 R3; section 13 threat |
| `reminderCopy.typedDay.remindersOffNote` | PROPOSED | Days you add still come when reminders are off. | D-S06.typedDays-remindersOff | read as text | n/a | NS-18 section 5 (PROPOSED behaviour; card gap G7) |

### D-S07 Hour picker sheet

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `settings.reminders.timeLabel` | EXISTING | Reminder time | sheet title or row label | "Reminder time, {time}" | Reminder time | NS-13 R30 |
| (picker) | NONE | System time wheel, 07:00 to 21:30 in 15-minute steps; no hour outside is offered, so no error string exists | D-S07.default | system | system | R30 |
| `common.doneButton` | EXISTING | Done | sheet | "Done" | Done | built |

### D-S08 Add a day sheet

States: `D-S08.default`, `D-S08.error-typed_day_past`, `D-S08.error-typed_day_empty`, `D-S08.error-typed_day_too_long`, `D-S08.ax5` (date and field stack), `D-S08.interrupted` (words kept in the field until Save).

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `reminderCopy.typedDay.sheetTitle` | PROPOSED | A day to remember | D-S08 | heading | n/a | NS-18 section 15 |
| `reminderCopy.typedDay.dateLabel` | PROPOSED | Day | date row | "Day, {date}" / "Opens the calendar." | Day | NS-18 happy path 1 |
| `reminderCopy.typedDay.wordsLabel` | PROPOSED | What is it? | text field label | "What is it?, text field" | What is it | NS-18 happy path 1 |
| `reminderCopy.typedDay.wordsPlaceholder` | PROPOSED | Nursery starts | field placeholder (an example, not a suggestion: it is never filled in for the parent) | not read once the field has text | n/a | NS-18 section 4; section 14 (the app never suggests the words) |
| `reminderCopy.typedDay.wordsHelp` | PROPOSED | Your words show in the app on that day. | under the field | read as text | n/a | NS-18 happy path 3 |
| `common.saveButton` | EXISTING | Save | D-S08 | "Save" | Save | NS-18 R1 |
| `common.cancelButton` | EXISTING | Cancel | D-S08 | "Cancel" / "Nothing is added." | Cancel | built |
| `reminderCopy.typedDay.errorPast` | PROPOSED | Choose a day that is still to come. | D-S08.error-typed_day_past | announced | n/a | NS-18 section 5 (a day in the past), card gap G6 for today |
| `reminderCopy.typedDay.errorEmpty` | PROPOSED | Add a few words about the day. | D-S08.error-typed_day_empty | announced | n/a | NS-18 R5 (1 character or more) |
| `reminderCopy.typedDay.errorTooLong` | PROPOSED | That is longer than fits here. A short line works best. | D-S08.error-typed_day_too_long (a paste over 80 characters; the field keeps every character and Save waits) | announced | n/a | NS-18 R5 (80, PROPOSED); no counter shown |

Writing tools are off on the field (D2, NS-18 section 14). No autocomplete, no suggestion.

### D-S09 Typed day detail and Delete

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `reminderCopy.typedDay.deleteButton` | PROPOSED | Delete this day | D-S09.default | "Delete this day" | Delete this day | NS-18 section 5 (deleting cancels it) |
| `reminderCopy.typedDay.deleteTitle` | PROPOSED | Delete this day? | D-S09.confirm | heading | n/a | NS-18 section 5 |
| `reminderCopy.typedDay.deleteBody` | PROPOSED | Its reminder will not come, and your words for it are removed from this phone. | D-S09.confirm | read as text | n/a | NS-18 section 5, R6 |
| `reminderCopy.typedDay.deleteConfirm` | PROPOSED | Delete | D-S09.confirm | "Delete" | Delete | NS-18 |
| `family.pending.keep` (shared word) | EXISTING | Keep it | D-S09.confirm | "Keep it" | Keep it | built word, reused |

### D-S10 Lock screen and Notification Center: every class

Rules every row passes (NS-13 R5, R6a, R6b, R10, R11, R24; NS-32 R11, R12, R13): no child name unless Names in notifications is on (and never with App lock on); no letter words, ever; no count of days, no "since", no run; no Plus, price, allowance or Keep step in any budgeted class; no due-date wording; no exclamation mark (notification budget 0); title at most 40 characters and body at most 110 (rules test); every line a `packages/content` key, filled only with a weekday, a month number, a time or a child name. iOS "Show Previews" is the parent's setting, not ours: when it hides previews, iOS shows only the app name and our category placeholder. No class is time-sensitive (R20).

#### D-S10.evening (class `evening`; tap lands on Home, D-S11.home)

The built pool is 8 variants in a fixed order; the neutral variant is the default and the named one is used only with names on. The two lists keep the same order, so variant n means the same idea in both.

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

PROPOSED extension for NS-13-R2b (no body twice in 30 days needs at least 31 neutral lines; P2; a content drop after the freeze, K5). Rows 8 to 30, taken from the vetted inventory (`docs/design/notifications/COPY_INVENTORY.md`, ids in brackets) and re-checked here. "Before birth" says whether the line fits a book whose child is not born yet (card gap G5): a `no` line is never planned for a phone whose only included books are expecting.

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

Changes from the inventory: CU06 named title changed to "What surprised you?" and its named body given the name (the inventory's named body "Anything lately? Big or tiny." dropped the child); EV04 ("exactly as it came out") left out because it sits too close to the Word for word promise; EV09 is today's `[7]`; EV01 duplicates `[1]`; EV12 and the RD, RT, MS, SS, FS and PH rows are not evening rotation lines (RT is superseded: section 4).

#### D-S10.monthAge (class `monthAge`; tap lands on the Book)

| Key | Status | Title | Body | Shown when |
|---|---|---|---|---|
| `reminderCopy.neutral.monthOpen` | EXISTING | Month {month} begins | A new month in the book is open. | names off (default), one child |
| `notifications.monthOpen` | EXISTING | Month {month} begins | A new month in {child}'s book is open. | names on, one child |
| `reminderCopy.together.monthTitle` | EXISTING | A new month begins | (body below) | two or more books, different month numbers |
| `notifications.monthOpen.title` | EXISTING | Month {month} begins | (body below) | two or more books, same month number |
| `reminderCopy.together.monthBodyNeutral` | EXISTING | | A new month is open in each book. | two or more books, names off |
| `reminderCopy.together.monthBodyNames` | EXISTING | | A new month is open for {child}. ({child} is the joined names, "Asha and Dev") | two or more books, names on |

"Month 3" names an age, not a gap (NS-13 R5).

#### D-S10.birthday (class `birthday`, 09:00; wins over a month note the same day, NS-13 R28; tap lands on the Book)

| Key | Status | Title | Body | Shown when |
|---|---|---|---|---|
| `reminderCopy.neutral.birthday` | EXISTING title, CHANGE body | A birthday today | The book is here whenever you want to read it together. | names off, one child |
| `reminderCopy.neutral.birthdays` | EXISTING title, CHANGE body | Birthdays today | The books are here whenever you want to read them together. | names off, two or more children |
| `notifications.birthday` | EXISTING title, CHANGE body | Happy birthday to {child} | The book is here whenever you want to read it together. | names on (`{child}` may be joined names; then the body reads "The book is here" for each, see note) |

Note: with names on and two children, the named title joins the names ("Happy birthday to Asha and Dev"); the body is the single-book line today (`planner.ts:259`). PROPOSED: use `birthdays.body` there. Why the body changes: "A year of letters" says a year of letters exists. A parent who started last month has a handful; on a second birthday it is two years; and "a year of" is a count frame. The new line celebrates what is there without measuring it. Card gap G3 covers the title on a lock screen.

#### D-S10.typedDay (class `typedDay`; outranks every budgeted class that day; never removed by the back-off; tap lands on Home with the words, D-S11.typedDay)

| Key | Status | Title | Body | Shown when |
|---|---|---|---|---|
| `reminderCopy.neutral.typedDay` | PROPOSED | A day you wanted to remember | Tap to see the words you added for today. | default (`typedDay.showWords` off) |
| (the parent's words) | PROPOSED rule | A day you wanted to remember | the parent's words, exactly as typed, nothing added (no quotes, no prefix) | `typedDay.showWords` on |

Kept under `reminderCopy.neutral` so the rules test's notification length check and rhythm check read it (rules.test.ts lines 266 and 296). The typed words themselves are not copy and are never checked or changed.

#### D-S10.plan (class `plan`; outside the budget; tap lands on Me, Plan, D-S24)

Plan notices are a legal courtesy about the subscription (Q-003 memo; in-app-disclosures row 35), so they are the one class that names Plus. They name no price, no child, no letter, no allowance and no Keep step, and they never share a notification with a reminder.

| Key | Status | Title | Body |
|---|---|---|---|
| `billing.reminders.title` | EXISTING | Plus | (one of the bodies below) |
| `billing.reminders.trialOneMonth`, `trialMonths` | EXISTING | | Plus is free until {date}, then it renews unless you cancel. You can change this in Settings, Plan. |
| `billing.reminders.renews` | EXISTING | | If Plus is still set to renew, it renews on {date}. You can change this in Settings, Plan. |
| `billing.reminders.yearly` | EXISTING | | A yearly reminder: Plus renews until you cancel. You can change this in Settings, Plan. |

Note for E and legal: the plan bodies say "Settings, Plan", while the IA calls the tab Me. Not changed here (the in-app-disclosures row and counsel wording cite it); flagged in section 14.

#### D-S10.hidden (hidden-preview placeholders, one per category; NS-32 R13, NS-13 R33)

| Key | Status | Category | Placeholder text |
|---|---|---|---|
| `reminderCopy.placeholders.evening` | PROPOSED | `evening` | Something for the book, whenever you have a minute. |
| `reminderCopy.placeholders.monthAge` | PROPOSED | `monthAge` | Something for the book, whenever you have a minute. |
| `reminderCopy.placeholders.birthday` | PROPOSED | `birthday` | Something for the book, whenever you have a minute. |
| `reminderCopy.placeholders.typedDay` | PROPOSED | `typedDay` | Something for the book, whenever you have a minute. |
| `billing.reminders.placeholder` | PROPOSED | `plan` | A reminder about your plan. |

One line for every budgeted category on purpose: a hidden preview that said "birthday" would tell anyone holding the phone the child's birthday (L4, NS-05 R6a reasoning), and one that said "a day you wanted to remember" would mark a private day. No brand name (it lives only in `packages/brand`, and iOS already shows the app name). Not the card's intent line "A note for tonight": "note" is only something a person makes (BRAND.md glossary), and birthday and typed-day messages do not come at night (card gap G1).

#### D-S10 classes that must not be scheduled in v1.0

| Key | Status | Why |
|---|---|---|
| `notifications.gentleReturn` | EXISTING, never scheduled | A return line after a quiet stretch speaks to the gap. NS-13 replaces it with the silent back-off (section 4). Remove in the dead-copy sweep |
| `notifications.familyLetter`, `notifications.familyAdded` | EXISTING, v1.1 | Need remote push (NS-26, parked) and family beyond the co-parent |
| `quickNote.lockScreenLabel` "Note for {child}" | EXISTING, not a notification | A widget label, not a notification; listed so it is not mistaken for one |
| Inventory rows RT01 to RT04, RD02, PH02, FS, MS, SS | not keys | RT superseded by NS-13; RD02 needs push; PH02 needs a library read (never); the rest are v1.1 proposals outside the five registered classes (NS-32 R5) |

### D-S11 Notification landing

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| (Home, evening tap) | NONE new | Home as it is, with its current prompt; nothing says "you came from a reminder" | D-S11.home | Home's own order | Home's own | NS-13 R9 |
| `reminderCopy.typedDay.homeLabel` | PROPOSED | A day you wanted to remember | D-S11.typedDay: small muted label above the prompt, then the parent's words as typed (a separate text element, never in the letter serif and never signed) | "A day you wanted to remember." then the words | n/a | NS-18 happy path 3, R1 |
| (Book, month or birthday tap) | NONE new | The Book opens at today's month | D-S11.book | the Book's own | n/a | NS-13 R9 |
| (Me, Plan) | see D-S24 | | D-S11.plan | | | NS-32 R4 |

The typed-day line shows only on its day, then the words are deleted the next day (NS-18 R7); no line says so.

### D-S24 Me, Plan: the date when notifications are not allowed (drawn with area E)

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `billing.plan.notificationsOff` | EXISTING | Notifications are off for {app}, so this iPhone cannot send its reminders before Plus renews. The dates are always here in Settings, Plan. | D-S24.denied | read as text | n/a | NS-32 R4, F14-REQ-NEW-A |
| `billing.plan.turnOnNotifications` | EXISTING | Allow notifications | D-S24.denied | "Allow notifications" / "Opens the iPhone's Settings for this app." | Allow notifications | built |

(Key path: these sit in the `billing` block shown at `billing.en.ts:166-167`; E confirms the parent object name.)

## 3. The other parent (NS-25; BL-983; alpha and servers on only, D-162)

Store builds: **no string of this section renders** (R1, R12; D-161). No "coming soon" in any build: see section 10 for the built keys that must stay dark.

### D-S12 Me, the other parent row

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.bookRow.label` | EXISTING | Write this book together | D-S12.one-parent | "Write this book together" / "Invite {child}'s other parent." | Write this book together | NS-25 happy path 1 |
| `family.card.title` | EXISTING | Write this book together | D-S12 card form (if design uses the card) | heading | n/a | built |
| `family.card.body` | CHANGE | Invite {child}'s other parent. They write from their own phone, and you both read every letter in the book that is not private. | D-S12 card form | read as text | n/a | NS-25 R3, R16 ("the whole book" is not true: private letters stay private) |
| `family.card.button` | EXISTING | Invite a co-parent | D-S12 card form | "Invite a co-parent" | Invite a co-parent | built |
| `family.card.finishSetup` | EXISTING | Finish setting up your account to invite someone. | D-S12.consent-needed | read as text | n/a | built |
| (two parents) | EXISTING format | the row value is the co-parent's signature, opening the Family screen | D-S12.two-parents | "Write this book together, {coParent}" | Write this book together | built (S46) |
| (servers off, store build, kill switch) | NONE | row absent | D-S12.killswitch, D-S12.store | n/a | n/a | R1, R12 |

### D-S13 Invite sheet

States: `D-S13.default`, `D-S13.working`, `D-S13.full`, `D-S13.paused`, `D-S13.offline`, `D-S13.error-<code>`, `D-S13.ax5`.

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.create.title` | EXISTING | Invite {child}'s co-parent | D-S13.default | heading | n/a | built |
| `family.create.body` | CHANGE | They can write to {child} from their own phone. | D-S13.default | read as text | n/a | NS-25 R16 (the reading line below now says what is shared, so this line no longer says "read the whole book") |
| `family.create.whatTheyRead` | PROPOSED | They will be able to read every letter in this book that is not private, including the ones already there. | D-S13.default, before the Share button, never below it | read as text | n/a | NS-25 R16, section 12 Invite Shown |
| `family.create.planLine` | PROPOSED | Their letters count toward their own plan. Plus reaches them only through Apple Family Sharing. | D-S13.default | read as text | n/a | NS-25 R7, OQ default ("say it plainly in the invite"), D-053, D-103 |
| `family.create.signsAsLabel` | EXISTING | What does {child} call them? | D-S13.default | "What does {child} call them?, text field" | What does {child} call them | F11-REQ-024 |
| `family.create.signsAsPlaceholder` | EXISTING | Mama, Papa, Amma, Baba | field | not read once filled | n/a | built |
| `family.create.signsAsHelp` | EXISTING | Optional. It signs their letters. | field help | read as text | n/a | built |
| `family.create.oneBook` | EXISTING | This invite is for {child}'s book only. | D-S13.default | read as text | n/a | built |
| `family.create.linkNote` | EXISTING | The link works once, for 7 days. You can cancel it any time. | D-S13.default | read as text | n/a | NS-25 R18 |
| `family.create.share` | EXISTING | Share invite link | D-S13.default | "Share invite link" / "Opens your phone's share sheet." | Share invite link | happy path 2 |
| `common.notNowButton` | EXISTING | Not now | D-S13.default | "Not now" / "Closes this. Nothing is sent." | Not now | section 12 Decline |
| `family.create.working` | EXISTING | Getting the link ready | D-S13.working | announced | n/a | built |
| `family.create.done` | EXISTING | The invite waits until they join. | after the share sheet | announced | n/a | built |
| `family.create.full` | EXISTING | {child}'s book has two parents. | D-S13.full (in place of Share) | read as text | n/a | NS-25 R5, `SCCAP` inviter side |
| `family.create.shareTitle`, `shareMessage`, `shareMessageNamed`, and the `NoName` forms | EXISTING | (the invite message the parent sends, for example "I started a book of letters for {child}. Join me, so we can both write to {child}:") | the text handed to the share sheet | n/a | n/a | built. Note: the message names the child; it is the parent's own message, but the link page never does (R6) |

### D-S14 Invite link page (web; names no child and no letter, R6)

States: `D-S14.iphone`, `D-S14.other-device`, `D-S14.expired`.

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `site.invite.title` | PROPOSED | You were invited to a book of letters | D-S14.iphone, D-S14.other-device | heading | n/a | NS-25 happy path 3, R6 |
| `site.invite.iphoneBody` | PROPOSED | Open this link on your iPhone to join in {app}. | D-S14.iphone | read as text | n/a | happy path 3 |
| `site.invite.storeButton` | PROPOSED | Open the App Store | D-S14.iphone (Apple's badge where the rules allow; this is its label; 18 characters, under the 22 button cap) | "Open the App Store" | same | happy path 3 |
| `site.invite.otherDevice` | PROPOSED | {app} works on iPhone. Open this link on an iPhone to join. | D-S14.other-device | read as text | n/a | section 5 row 1 (not "for now": it would hint at a later version, D-161) |
| `onboarding.inviteExpired.title` | EXISTING (reused on the page) | This invite has expired | D-S14.expired | heading | n/a | section 5 (expired) |
| `site.invite.expiredBody` | PROPOSED | Ask the person who sent it for a new one. | D-S14.expired (the page cannot name the inviter: it has no account to peek with) | read as text | n/a | R6, R18 |

Rules for this page: no child name, no letter, no inviter name, nothing that needs an account, no tracking (R6; NS-25 section 12 Never). The website build uses `{app}` from `packages/brand` like the rest of `site.en.ts`.

### D-S15 Join ask: peek (after sign-in; sign-off and role only)

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.accept.invitedTitle` | EXISTING | You were invited to a book | D-S15.signed-out (before sign-in nothing is known) | heading | n/a | BL-322 |
| `family.accept.signInBody` | EXISTING | You each write from your own phone, in the same book. | D-S15.signed-out | read as text | n/a | built |
| `family.accept.signIn` | EXISTING | Sign in | D-S15.signed-out | "Sign in" | Sign in | built |
| `family.accept.peeking` | EXISTING | Opening the invite | D-S15.loading | announced | n/a | built |
| `family.accept.askTitle` | EXISTING | Join this book as a parent? | D-S15.default | heading | n/a | R2 (the role) |
| `family.accept.invitedBy` | EXISTING | Invited by {inviter} | D-S15.default | read as text | n/a | R2 (the sign-off) |
| `family.accept.invitedByUnknown` | EXISTING | You were invited to write a book together. | D-S15.no-signoff | read as text | n/a | R2 |

### D-S16 Accept: the agreement

States: `D-S16.default`, `D-S16.joining`, `D-S16.offline`, `D-S16.error-<code>`, `D-S16.paused`, `D-S16.needs-sync`.

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.accept.askBody` | CHANGE | You will both read every letter in the book that is not private. Join only if you know who sent you this link. | D-S16.default | read as text | n/a | NS-25 R3, section 12 Accept Shown |
| (agreement links) | EXISTING keys in area E | Terms of Service, Privacy Policy, with their versions | D-S16.default | link labels as shown | same | R17 (versioned links); E owns the link keys |
| `family.accept.signsAsLabel` | EXISTING | What does {child} call you? | D-S16.default | "What does {child} call you?, text field" | What does {child} call you | F11-REQ-024 |
| `family.accept.signsAsHelp` | EXISTING | It signs your letters in this book. | field help | read as text | n/a | built |
| `family.accept.signsAsNeeded` | EXISTING | Add what {child} calls you to open the book. | under an empty field | read as text | n/a | built |
| `family.accept.join` | EXISTING | Join the book | D-S16.default | "Join the book" / "Records that you agree, then the book comes to this phone." | Join the book | R17 |
| `family.accept.notNow` | EXISTING | Not now | D-S16.default, same size | "Not now" / "Nothing joins. The person who invited you is not told." | Not now | section 12 Accept Decline |
| `family.accept.joining` | EXISTING | Joining the book | D-S16.joining | announced | n/a | section 6 Slow |
| `family.accept.needsSync` | EXISTING | To join, choose Agree and sync in Settings, Account. | D-S16.needs-sync | read as text | n/a | F11-U11 |

The child's name appears on this screen only in the sign-off field label ("What does {child} call you?"). PROPOSED check for `legal`: R2 says no child name until they agree. If that field shows before Join, its label must not name the child: **"What will you sign your letters as?"** (PROPOSED key `family.accept.signsAsLabelBeforeJoin`). Card gap G13.

### D-S17 Joining and arrival

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.accept.joinedTitle` | EXISTING | You're in {child}'s book | D-S17.joined | heading | n/a | happy path 5 |
| `family.accept.joinedBody` | EXISTING | Your letters and {inviter}'s sit side by side, each signed. | D-S17.joined | read as text | n/a | happy path 6 |
| `family.accept.joinedBodyUnknown` | EXISTING | Your letters and theirs sit side by side, each signed. | D-S17.joined, no sign-off | read as text | n/a | built |
| `family.accept.joinedWaiting` | EXISTING | {child}'s book is on its way to this phone. | D-S17.arriving | announced | n/a | section 8 (first page within 10 s p95) |
| `family.accept.joinedNotYet` | EXISTING | {child}'s book has not reached this phone yet. | D-S17.slow | read as text | n/a | built |
| `family.accept.joinedWaitingUnknown`, `joinedNotYetUnknown` | EXISTING | The book is on its way to this phone. / The book has not reached this phone yet. | no-name forms | read as text | n/a | built |
| `family.accept.open` | EXISTING | Open the book | D-S17.joined | "Open the book" | Open the book | built |
| `family.accept.tryAgain` | EXISTING | Try again | D-S17.slow | "Try again" | Try again | built |

### D-S18 Family screen (members, pending invite, undo within 72 hours)

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.members.you` | EXISTING | You | member row | read as text | n/a | built |
| `family.members.coParent` | EXISTING | Co-parent | member row role | read as text | n/a | built |
| `family.members.openUntil` | EXISTING | Invited, open until {date} | D-S18.pending | read as text | n/a | F11-REQ-019 |
| `family.members.expired` | EXISTING | Invite expired | D-S18.expired | read as text | n/a | R18 |
| `family.pending.shareAgain` | EXISTING | Share again | D-S18.pending, D-S18.expired | "Share again" | Share again | built |
| `family.pending.cancel` | EXISTING | Cancel invite | D-S18.pending | "Cancel invite" | Cancel invite | R11 (works when paused) |
| `family.pending.cancelTitle` | EXISTING | Cancel this invite? | confirm | heading | n/a | built |
| `family.pending.cancelBody` | EXISTING | The link will stop working. | confirm | read as text | n/a | built |
| `family.pending.keep` | EXISTING | Keep it | confirm | "Keep it" | Keep it | built |
| `family.pending.cancelled` | EXISTING | Invite cancelled. | announced | announced | n/a | built |
| `family.pending.oldStillOpen` | EXISTING | The new link is shared, but the earlier link still works. You can cancel it in the list. | after Share again, partial | read as text | n/a | F11-REQ-019 |
| `family.pending.notSent` | EXISTING | The share sheet didn't open, so nothing was sent. Both invites stay open, and you can cancel either in the list. | after Share again, failed | read as text | n/a | built |
| `family.undoJoin.row` | PROPOSED | Undo {coParent}'s join | D-S18.undo-open (inviter only, within 72 hours) | "Undo {coParent}'s join" / "Open until {date} at {time}." | Undo {coParent}'s join | NS-25 R4 |
| `family.undoJoin.rowHelp` | PROPOSED | You can undo this until {date} at {time}. | D-S18.undo-open | read as text | n/a | R4, R13 |
| (after 72 hours) | NONE | No undo row and no line about removal | D-S18.undo-closed | n/a | n/a | R13 (card gap G11) |

### D-S19 Undo join confirm sheet

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.undoJoin.title` | PROPOSED | Undo {coParent}'s join? | D-S19.default | heading | n/a | section 12 Undo Shown |
| `family.undoJoin.body` | PROPOSED | {coParent} will stop receiving {child}'s book. Their letters leave the book and stay theirs. | D-S19.default | read as text | n/a | R4; D-116; section 12 Never (never delete the other parent's letters) |
| `family.leave.cantTakeBack` | EXISTING, reused | Letters already on {coParent}'s phone or in an export can't be taken back. | D-S19.default | read as text | n/a | honesty about copies already made (card gap G10: engineering confirms what stays on their phone) |
| `family.undoJoin.confirm` | PROPOSED | Undo the join | D-S19.default | "Undo the join" | Undo the join | R4 |
| `family.leave.cancel` (word "Stay") | not used | | | | | "Stay" reads wrongly here |
| `common.notNowButton` | EXISTING | Not now | D-S19.default, same size | "Not now" / "Nothing changes." | Not now | section 12 Decline |
| `family.undoJoin.done` | PROPOSED | {coParent} is no longer in {child}'s book. | D-S19.done (announced; row goes) | announced | n/a | R4 |
| `family.undoJoin.failed` | PROPOSED | The undo did not finish. Nothing has changed. Try again. | D-S19.error-network, D-S19.error-unknown | read as text | n/a | section 6 Failed |

### D-S20 The other parent's phone after an undo

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `family.undone.note` | PROPOSED | You are no longer in {child}'s book. Your letters stay yours, to read, export or delete. | D-S20.default, one plain line on their next open after the sync | read as text | n/a | R4; section 12 Accept Decline logic (never say why) |
| `family.undone.noteUnknown` | PROPOSED | You are no longer in this book. Your letters stay yours, to read, export or delete. | the same when the name cannot be read | read as text | n/a | R4 |
| `coParentLeft.dismissButton` (word "Okay") | EXISTING, reused | Okay | D-S20.default | "Okay" | Okay | built word |

No line says who did it or why; no line says "removed".

## 4. Back-off and stop: what never exists (NS-13 section 3a; NS-32 R8; J-N4)

The back-off is silent by design. These strings must not exist anywhere, and a reviewer rejects any PR that adds one:
- a notification that says reminders are slowing, pausing or stopping (the inventory's RT04 "Reminders go quiet" is withdrawn);
- a "we miss you", "it has been a while", "come back", "your book is waiting for you" or any return line (RT01 to RT03, `notifications.gentleReturn`);
- a last-chance line, a farewell, a count of days or weeks, a "since your last letter";
- a line in Me, Reminders that reports the back-off state ("Reminders paused", "Slowed down").

Days 8 to 35 use the same evening pool as days 1 to 7, so a parent cannot tell from the words that time has passed. When reminders are turned on again or a letter is made, nothing says "welcome back".

## 5. Quiet days (NS-07 C5; BL-974)

All built strings stand (C5 section 3.16).

| Key | Status | Text | Where | VoiceOver | Voice Control | Card row |
|---|---|---|---|---|---|---|
| `tonight.notMuchButton` / `notMuch.button` | EXISTING | Not much today | D-S21.default | "Not much today" / "Marks today without writing anything." (`notMuch.confirmBody`) | Not much today | C5-1, section 3.4 |
| `notMuch.savedToast` | EXISTING | A quiet day, kept. | D-S21.kept (in place; no timer, T4 met) | announced | n/a | C5-5, C5-6 |
| `notMuch.undo` | EXISTING | Undo | D-S21.kept | "Undo" / "Removes today's mark." | Undo | C5-6 |
| `errors.saveFailed.title` | EXISTING | Not saved to the book yet | D-S21.error-save_failed | heading | n/a | section 3.5 (standard save error) |
| `errors.saveFailed.body` | EXISTING | Your words are safe on this phone. We will try again on our own. | D-S21.error-save_failed | read as text | n/a | see note |
| `book.quietDay.label` | EXISTING | A quiet day | D-S22.default (small muted note, unsigned, with the date) | `book.quietDay.a11y` | n/a | C5-1 |
| `book.quietDay.a11y` | EXISTING | {date}. A quiet day, kept. | D-S22.default | (this is the label) | n/a | section 3.6 VoiceOver |
| `book.quietDay.remove` | EXISTING | Remove this mark | D-S22.menu | "Remove this mark" | Remove this mark | built |
| `book.quietDay.removedToast` | EXISTING | Mark removed. | D-S22.removed | announced | n/a | built |

Note on `errors.saveFailed.body` for a quiet day: a quiet-day mark has no words, so "Your words are safe on this phone" is not about anything. PROPOSED key `notMuch.saveFailed`: "Today's mark did not save. Try again." with `common.tryAgainButton`. C5 says "the standard save error"; card gap G14.

Consecutive quiet days are separate rows with no run visual and no grouping line (C5-9); no string counts them (C5-3).

## 6. Error messages per code

What happened, what the parent can do; no blame, no fear.

| Code | Key | Status | Text | Screen |
|---|---|---|---|---|
| `share_temp_write_failed` | `shareCopy.letter.pictureFailed` | PROPOSED | The picture could not be added. The words will still go. | D-S02 |
| ScheduleResult failure | `reminderCopy.settings.scheduleFailed` + Try again | EXISTING | Could not set reminders just now. | D-S04, D-S06 |
| permission denied | `reminderCopy.settings.deniedTitle` / `deniedBody` + Open Settings | EXISTING | Notifications are off / Turn them on in Settings to get these reminders. | D-S06 |
| `typed_day_past` (local, PROPOSED) | `reminderCopy.typedDay.errorPast` | PROPOSED | Choose a day that is still to come. | D-S08 |
| `typed_day_empty` (local, PROPOSED) | `reminderCopy.typedDay.errorEmpty` | PROPOSED | Add a few words about the day. | D-S08 |
| `typed_day_too_long` (local, PROPOSED) | `reminderCopy.typedDay.errorTooLong` | PROPOSED | That is longer than fits here. A short line works best. | D-S08 |
| `SCINV` expired | `family.errors.expired` | EXISTING | This invite has expired. Ask for a new one. | D-S15, D-S16 |
| `SCINV` used | `family.errors.used` | EXISTING | This invite has already been used. Ask for a new one if that wasn't you. | D-S15, D-S16 |
| `SCINV` revoked | `family.errors.revoked` | EXISTING | This invite was cancelled. Ask for a new one. | D-S15, D-S16 |
| `SCINV` already a member | `family.errors.already_member` | EXISTING | You're already part of this book. | D-S16, then the book opens (R9) |
| `SCINV` not found | `family.errors.not_found` | EXISTING | That link does not open an invite. Check it and try again. | D-S15 |
| `SCCAP` (invitee) | `family.errors.book_full` | EXISTING | This book already has two parents. Ask the person who invited you. | D-S16 (R5) |
| `SCCAP` (inviter) | `family.create.full` | EXISTING | {child}'s book has two parents. | D-S13 |
| `SCPAR` / 42501 | `family.errors.not_allowed` | EXISTING | That isn't possible from here. | any deep link to a removal after 72 hours (R13) |
| `SCKIL` (`killSwitches.invites`) | `family.errors.paused` | EXISTING | Invites are paused for now. Please try again a little later. | D-S13, D-S15, D-S16 (R11; cancel still works) |
| rate limited | `family.errors.rate_limited` | CHANGE | No more invites can go out today. You can send one tomorrow. | D-S13 |
| consent needed | `family.errors.consent_needed` | EXISTING | Finish setting up your account first. | D-S13, D-S16 |
| signed out | `family.errors.signed_out` | EXISTING | Sign in again to continue. | D-S15, D-S16 |
| book deleted | `family.errors.book_deleted` | EXISTING | This book isn't available. | D-S16 |
| offline | `family.errors.network` | EXISTING | This phone is offline. Try again once it is back online. | D-S13, D-S16 (section 6 Offline: one line, nothing half-joins) |
| accept failed or answer lost | `family.errors.joinFailed` | PROPOSED | Joining did not finish. Nothing has changed. Try again. | D-S16 (R10: no membership was made, so "nothing has changed" is true; a retry that finds the membership opens the book instead) |
| unknown | `family.errors.unknown` | EXISTING | That did not go through. Try again. | any D-S13 to D-S19 |
| family-share consent (`SCCON`) | `family.errors.family_share_consent` | EXISTING | Sharing a book now asks for one more agreement. Update the app to see it, then try again. | D-S16 |
| undo failed | `family.undoJoin.failed` | PROPOSED | The undo did not finish. Nothing has changed. Try again. | D-S19 |
| quiet-day save failed | `notMuch.saveFailed` | PROPOSED | Today's mark did not save. Try again. | D-S21 |

`rate_limited` change: "That's a lot of invites for one day" reads as a comment on the parent; the new line says only what is true and what they can do.

## 7. Empty states

| Screen | State | Words |
|---|---|---|
| D-S01 | No kept letter of one's own | No letter page, no control, nothing invites sharing (NS-05 section 6 Empty). NONE |
| D-S06 | Reminders off, first visit | `settings.reminders.help` plus the two priming lines (section 2) |
| D-S06 | No typed days | `reminderCopy.typedDay.sectionHelp` and Add a day; no "nothing yet" line |
| D-S06 | No book with a birth date | `reminderCopy.settings.birthDateNote` |
| D-S12 / D-S13 | Empty book, inviting | No change; the invite works with an empty book (NS-25 section 6) |
| D-S17 | The other parent joins an empty book | The Book's own empty state (area B: `book.empty.bookTitle` "The first page is waiting.") |
| D-S18 | No pending invite | No row |
| D-S22 | A book with only quiet days | Rows by date, unsigned; no summary line |

## 8. Notification matrix (D-S10, one view)

| Class | Title, default | Body, default | Names on | Hidden preview | Lands on | Never |
|---|---|---|---|---|---|---|
| evening | rotation `reminderCopy.neutral.evening[n]` | same | `notifications.evening[n]` | `reminderCopy.placeholders.evening` | Home | name by default, letter words, count, Plus, Keep, due date |
| monthAge | Month {month} begins | A new month in the book is open. | `notifications.monthOpen` | `reminderCopy.placeholders.monthAge` | Book | as above |
| birthday | A birthday today | The book is here whenever you want to read it together. | Happy birthday to {child} | `reminderCopy.placeholders.birthday` | Book | as above; "a year of" |
| typedDay | A day you wanted to remember | Tap to see the words you added for today. | names switch does not apply; `typedDay.showWords` puts the words in the body | `reminderCopy.placeholders.typedDay` | Home, words above the prompt | our words added to theirs; countdowns, "days until" |
| plan | Plus | `billing.reminders.*` with {date} | n/a: never a name | `billing.reminders.placeholder` | Me, Plan | price, child, letter, allowance, Keep |

## 9. The pilot artefacts the parent sees (NS-03; not app screens; D-S23)

These go to counsel first (NS-03-R1) and live in the pilot plan in `docs/research/studies/`, never in `packages/content`. `{app}` is the public name from `packages/brand`, rendered before counsel reads (the card writes `{brand.name}`; same value). Each text below is the card's intent tightened to VOICE.md; changes are listed after each. Every line is said the same way on a call.

| Key | Status | Text | Card row |
|---|---|---|---|
| `pilot.recruit` | PROPOSED (final) | Hi. We are trying out a small idea and would value your help. If you are willing, you would send one of your letters to a grandparent or another relative, in your own messages, and tell us a week later how it went. We would not see the letter. It takes about ten minutes in all. Would you like to hear more? | NS-03 section 7 Recruit |
| `pilot.consent.lead` | PROPOSED (final) | We are testing one idea: you send one letter from {app} to a relative, using your own messages, and we ask how it went. | section 15 Shown (the card's "a parent sends ... using your own messages" mixed persons) |
| `pilot.consent.what` | PROPOSED (final) | You choose the letter and the person. We do not see the letter, the recording, the picture or your child's name. We only ask you a few questions, one week apart, and write short notes. | section 15 Shown |
| `pilot.consent.voice` | PROPOSED (final, version V only) | If you are in the group that sends a recording: you will send a recording of your child's voice to a relative, through your own messages. You choose whether to send it and to whom. We never receive it. | section 15 Shown (V) |
| `pilot.consent.stop` | PROPOSED (final) | You can stop at any time. If you stop, we delete your notes. Your book and your letters are not affected either way. | section 15 Shown, R5 |
| `pilot.consent.ask` | PROPOSED (final) | Do you agree? Yes, or No thanks. | section 15 Shown, Decline |
| `pilot.instructionW` | PROPOSED (final) | Pick one letter you are happy to share. Send it to one person you choose, in the message app you already use, as the PDF of that one letter (or, if the app cannot make that, a screenshot of that one page). Say anything you like to them. Please do not send anything to us, and please send only the letter. We will check in on day 3 and day 7. | section 7 Instruction W |
| `pilot.instructionV` | PROPOSED (final) | Pick one letter you are happy to share. Send it to one person you choose, in the message app you already use, as the PDF of that one letter (or, if the app cannot make that, a screenshot of that one page). If you want them to hear your voice, also send the recording. You will be sending a recording of your child's voice to that person, and you choose whether to. If they do not use iMessage or WhatsApp, a recording longer than about two minutes may not arrive by text message, so send it by email or a messaging app instead. Say anything you like to them. Please do not send anything to us. We will check in on day 3 and day 7. | section 7 Instruction V |
| `pilot.scriptA` | PROPOSED (final) | 1. Did you send it? Yes, or not yet. 2. Did anything get in the way? A few words is plenty. 3. Is there anything you would rather we did not ask? If so, we will drop it. | section 7 Script A |
| `pilot.scriptB` | PROPOSED (final) | 1. What did the person do with it? Read it, replied, asked for another, or nothing that you know of. (V: also "listened".) 2. Did they manage on their own, or did they need help? What kind? 3. (V) How did you feel about your child's voice going to them this way? (W) How did you feel about sending it this way? 4. If you could do it again, how would you want to send it? 5. Would you send another one next week? Yes, no or not sure. 6. Did it reach only the person you meant, and did they pass it on to anyone else that you know of? | section 7 Script B (wording of the coded answers unchanged, so the codes still map) |
| `pilot.scriptC` | PROPOSED (final) | Could you read it (V: read it or listen to it) without help from anyone? Yes, or what got in the way? | section 7 Script C |
| `pilot.close` | PROPOSED (final) | Thank you. We will delete your notes whenever you ask. We will let you know what we decide. | section 7 Close |

Changes: "by the message app" became "in the message app"; the semicolons in Instruction V became a comma and "so" (plainer read-aloud); Script A Q3 says what happens to the answer; the close says "whenever you ask" (the card's "if you ask, any time" says it twice). Nothing names a feature, a price, a reward or a gift; nothing asks the parent to forward anything to us; no count. The in-app part of the pilot is Export of one letter (area C); this area adds no app string for it.

## 10. Built keys that must not render (no "coming soon" in any build; v1.1 family)

| Key | Text today | Rule | Proposal |
|---|---|---|---|
| `family.soon.*` (status, title, lead, notify, quiet, settingsRow, settingsRowHelp) | "Coming soon", "For now, this book is yours.", "In a later update ..." | D-161 draft; founder 11 and 19 Nov; NS-05 section 3.1; NS-25 R1 | Already not drawn (comment in `family.en.ts`). Delete in the dead-copy sweep so no future screen can reach them |
| `family.leave.later` | Leaving a shared book is coming in a later update. | Reachable at `/invite/leave` in a build with sharing on (comment in `family.en.ts`): a coming-soon line in a live build | CHANGE PROPOSED: hide the route while D-113 holds Leave (BL-444), and delete the line. If a line is needed for a stale deep link: `family.errors.not_allowed` "That isn't possible from here." |
| `settingsMore.remindersNotYet` | Reminders are not on in this version. | Unread today (`strings.en.ts:1554` note) | Delete |
| `book.empty.familyTitle`, `familyBody`, `familyCta`; `invite.*` (family beyond the co-parent); `notifications.familyLetter`, `familyAdded`; `children.settings.familyCanReadLabel` | grandparents, aunts, uncles | v1.1; VOICE.md; NS-25 section 16 bans "invite grandparents" | Keep dark; never drawn by any D screen |

## 11. Changes to built strings (old to new)

| Key | Old | New (PROPOSED) | Why |
|---|---|---|---|
| `reminderCopy.priming.privacyLine` | Notifications never show what you write. Names stay off the lock screen unless you turn them on. | Notifications never show the words of a letter. Names stay off the lock screen unless you turn them on. | With NS-18, a parent can choose to show their typed words; "never show what you write" would be false. Same wording as `settings.privacy.notificationsLine` |
| `reminderCopy.priming.quietLine` | Only in the evenings you pick, and never late at night. | Never late at night, and you can change them any time. | Birthday messages come at 09:00, month messages on the month-day and typed days on their day: not only "evenings you pick" |
| `reminderCopy.settings.quietHelp` | Reminders come between 7 AM and 9:30 PM, and stay quiet on a day you have already written. | Reminders come between 7 AM and 9:30 PM, and not on a day you have already said or typed a letter. | NS-13 R8, R27: a spoken letter, or one waiting to be kept, also counts |
| `reminderCopy.settings.namesHelpOff` | Notifications say "your little one" and show no names on the lock screen. | No names on the lock screen, except in your own words if you choose to show them. | Not every neutral line says "your little one"; and typed words may hold a name (NS-18 section 5) |
| `onboarding.reminder.noneHelp` | You can write whenever you like. | You can turn reminders on in Me whenever you like. | NS-13 section 12 Decline: "Me explains in one sentence"; the old line did not say where |
| `reminderCopy.neutral.birthday.body`, `birthdays.body`, `notifications.birthday.body` | A year of letters. Want to read them together today? | The book is here whenever you want to read it together. (plural form for `birthdays`) | "A year of letters" claims a year of letters exists and frames a count |
| `family.card.body` | ... and you both read the whole book. | ... and you both read every letter in the book that is not private. | NS-25 R3: private letters are not shared |
| `family.create.body` | They can write to {child} and read the whole book, from their own phone. | They can write to {child} from their own phone. | The new `whatTheyRead` line says exactly what is shared (R16) |
| `family.accept.askBody` | You will both read every letter in the book. Join only if you know who sent you this link. | You will both read every letter in the book that is not private. Join only if you know who sent you this link. | R3 |
| `family.errors.rate_limited` | That's a lot of invites for one day. You can send more tomorrow. | No more invites can go out today. You can send one tomorrow. | No comment on the parent |

## 12. Claims check

Every line in this area that makes a promise, and the card Claims section it stays inside. "Public" means store, website or email; everything else is in-app. No public line in this file makes a new claim.

| Line | Promise | Card Claims section | Inside? |
|---|---|---|---|
| `shareCopy.letter.whereItGoes` "It goes only where you send it. Once sent, it cannot be taken back." | Our app sends nothing elsewhere; the parent cannot recall a sent message | NS-05 section 18 (enables "Send one letter ... from your own messages"); section 17 Q43 claims row; SH-R8 | Yes. True by R3a, R9 (no network call, no record). It says nothing about what the recipient's app does (threat table residual). Q43 reads it |
| `shareCopy.letter.versionFixes` / `versionExact` | The text sent is the version the Book shows | NS-05 R19; forbids "the recipient sees every change" | Yes; neither line promises marks travel. `versionExact` only when the words are untouched |
| `shareCopy.letter.wordsAlways`, `picture` | Words always go; the picture only if turned on | R4b, R5b | Yes |
| `reminderCopy.priming.privacyLine` (new) | No letter words in notifications; names only by choice | NS-13 section 19 enables "Reminders don't show your child's name unless you choose"; NS-32 section 19 forbids promising the lock screen shows nothing | Yes. It speaks only of what we send, not of "Show Previews" |
| `reminderCopy.settings.namesHelpOff` (new) | No names on the lock screen except words you chose to show | NS-13 section 19; NS-18 R3 | Yes |
| `reminderCopy.priming.quietLine` (new), `quietHelp` (new) | Never late at night; 7 AM to 9:30 PM; quiet on a day you made a letter | NS-13 R30, R8 (P0 and P1 rows) | Yes once BL-943 lands R8 with drafts counted (R27). Until then the build counts only kept letters: ship the `quietHelp` change in the same PR as R27 |
| `reminderCopy.typedDay.sectionHelp` "On that day, one reminder comes at your reminder time." | Delivery on the day | NS-18 section 19 "None public"; R1 is a device row | In-app only. "Comes" is as firm as the built reminder lines; plan reminders carry a "can come late" caveat because they are a legal courtesy. CPO decides whether typed days need one (G8) |
| `reminderCopy.typedDay.remindersOffNote` | Typed days arrive with reminders off | NS-18 section 5 (PROPOSED behaviour) | Only if the CPO keeps that behaviour (G7); otherwise the key is dropped |
| `reminderCopy.typedDay.showWordsHelpOn` | Words show as typed, names included | NS-18 R3 | Yes; it warns rather than promises |
| `family.create.whatTheyRead` | The other parent reads every non-private letter, earlier ones too | NS-25 R16, section 12; counsel Q48 | Yes; this is the consent line Q48 reads |
| `family.create.planLine` | Allowance per author; Plus only through Apple Family Sharing | NS-25 section 20; D-053, D-103 | Yes, pending the founder's D-053 call (NS-25 OQ). Not public |
| `family.card.body`, `family.accept.askBody` (new) | Both read every non-private letter | NS-25 section 19 enables "Both parents in one book, each letter signed" only after the gates | In-app, alpha only (D-162). No public copy until the gates; BRAND.md line 40 still needs its rewrite (NS-25 section 22) |
| `family.undoJoin.body` "Their letters leave the book and stay theirs." | Undo never deletes the other parent's letters | NS-25 R4, section 12 Never | Yes (`undo_parent_join` sets them private) |
| `family.undone.note` "Your letters stay yours, to read, export or delete." | The removed parent keeps their letters | NS-25 R4 | Yes |
| `site.invite.otherDevice` "{app} works on iPhone." | Platform | NS-25 section 5; CR-131 | Yes; no "for now", no other platform named |
| `pilot.consent.what` "We do not see the letter, the recording, the picture or your child's name." | The team receives nothing | NS-03 section 3, section 15 Never; section 21 forbids any public line | Yes; not public; counsel reads (R1) |
| `pilot.consent.stop` "If you stop, we delete your notes." | Deletion on withdrawal | NS-03 R5 (2 working days) | Yes |
| `notMuch.*`, `book.quietDay.*` (built) | One tap keeps the day without words | NS-07 C5 section 3.18 | Yes |
| Plan notices (built) | Dates; how to change | in-app-disclosures row 35; D-094 "a courtesy that can come late or not at all" | Yes; the courtesy caveat lives in `billing.confirmation.reminders`, untouched here |

Claims this area must never make (cards' Forbids): "share your voice", "private link", "family can listen", "share with grandparents", "never miss a day", "stay on track", "smart reminders", any streak word, "at most one a day" (NS-32 allows it only after R1 passes on a device, and plan notices can make two), any promise about what the lock screen shows beyond what we send, "coming soon", "invite grandparents".

## 13. Rules check run on this file

Checked by a script over every string in the Text, Title, Body and Placeholder columns of this file (not the "Never" and "Banned" lists, which quote banned words on purpose), using the patterns copied from `packages/content/test/rules.test.ts`: no non-ASCII character (so no em or en dash, curly quote, ellipsis character or emoji); FEAR; AI-writing (including "smart", "generate", "polish", "perfect", "enhance"); GAP ("missed", "in a row", "since your last", "streak"); DAY_COUNT and DAILY (so no "one a day", "every day"); gendered pronouns and child nouns; CR-25 internal terms (entry, draft, take as a noun, pack); "note" for anything we send; exclamation marks (0); notification titles at most 40 and bodies at most 110 characters as templates; buttons at most 22. Result is in the report to Karma. It is a copy of the patterns, not the repo suite: every key must pass `npm test` in `packages/content` when it lands.

## 14. Card gaps

| Id | Card row | What is missing or wrong | Proposed default |
|---|---|---|---|
| G1 | NS-32 section 16 | The placeholder intent "A note for tonight" uses "note" for something we send (BRAND.md glossary bans it) and "tonight" for classes that come at 09:00 or on any day | One neutral line for every budgeted class: "Something for the book, whenever you have a minute."; plan: "A reminder about your plan." |
| G2 | NS-13 section 12, section 15 | "Two equal choices" against the built card's three buttons ("Yes, evenings", "Pick a time", "No reminders") | Two equal choices, "Yes, evenings" and "No reminders"; the time is set from the "Change" action on the toast or in Me. Design lead decides; the keys exist either way |
| G3 | NS-13 R6a, NS-32 R12; NS-05 R6a reasoning | The neutral birthday title "A birthday today" tells anyone who sees the lock screen that today is the child's birthday, which NS-05 treats as an L4 fact. No card says whether the default title may carry it | Keep the built title for v1.0 (founder-approved, names no child). CPrivO decides; the fallback title is "Something for the book today" |
| G4 | NS-13 section 16 | The birthday body "A year of letters" claims a year of letters | Changed (section 11) |
| G5 | NS-13 R10 (due-date only) | Several evening lines assume a born child ("Something your little one did, said or tried"). R10 bans due-date wording but not lines that do not fit before birth | Mark each line "before birth: yes or no" (section 2) and plan only "yes" lines for a phone whose included books are all expecting. Built `[6]` and named `[4]` are "no" |
| G6 | NS-18 section 5 | "A day in the past: not accepted" leaves today open. If today's reminder time has passed, nothing would be delivered | Today is accepted only while today's reminder time is still ahead; otherwise `errorPast` |
| G7 | NS-18 section 5 (PROPOSED) | Typed days still come with Reminders off. The main switch is labelled "Reminders", so a parent turning it off may expect silence | Keep the card's proposal and show `remindersOffNote`; CPO confirms |
| G8 | NS-18 section 19 | Whether typed-day help needs a "can come late" caveat like plan notices | No caveat: same footing as the built reminder lines |
| G9 | NS-13 section 4 step 5, section 15 | "Nothing on screen says so" about the back-off. Honest, but a parent whose reminders stopped may think the app broke | Keep silent (card). If testers report confusion (NS-13 section 21 question 2), consider one static help line in Me, Reminders: "Reminders ease off on their own when the book has been quiet, and start again when you make a letter." Not shipped by default |
| G10 | NS-25 R4 | After an undo, what happens on the other parent's phone to letters the inviter wrote, already synced there, is not stated | The confirm sheet reuses `family.leave.cantTakeBack` (copies already on their phone or in an export stay). Engineering confirms against `undo_parent_join` and the pull path; if the pull removes them, the line is dropped |
| G11 | NS-25 R13, Q50 | After 72 hours there is no removal and no words. A parent in a hard situation finds nothing | No line in the app (card). Support runbook owns it (Q50). If counsel asks for a pointer: "For help with who is in this book, write to us." in Help, never on the Family screen |
| G12 | NS-05 OQ-6 | The verb | "Share this letter", with `legal` |
| G13 | NS-25 R2 | The accept screen's sign-off field label names the child ("What does {child} call you?"). If it shows before Join, the child's name appears before agreement | Before Join, use "What will you sign your letters as?" (`family.accept.signsAsLabelBeforeJoin`, PROPOSED); after Join, the built label. Or move the field after Join. Design lead and `privacy` decide |
| G14 | NS-07 C5 section 3.5 | "The standard save error" says "Your words are safe on this phone" about a mark with no words | `notMuch.saveFailed` "Today's mark did not save. Try again." |
| G15 | Brief section 4 ("no Plus ... in any reminder") against NS-32 | Plan notices must name Plus (a legal courtesy) | Scoped: the rule covers the budgeted classes; plan notices name Plus and nothing else of the plan (no price, no allowance, no Keep), never merged with a reminder |
| G16 | NS-03 section 7 | Scripts write `{brand.name}`; content uses `{app}` | Either renders from `packages/brand`; `{app}` here |
| G17 | NS-25 section 5 row 1 | "iPhone only for now" hints at a later version | "{app} works on iPhone." |

## 15. Engineering gaps

| Gap | Backlog row |
|---|---|
| A new file `packages/content/src/features/share.en.ts` exporting `shareCopy`, registered in `features/index.ts` so the rules test scans it | BL-939 |
| `reminderCopy.neutral.typedDay` and `reminderCopy.placeholders.*` must sit under paths the rules test reads for notification length and rhythm (`features.reminders.neutral`; the RHYTHM_SCOPE regex matches `remind`). `billing.reminders.placeholder` is outside the length check: add it to the length list, or keep it short (it is 27 characters) | BL-966, BL-982 |
| `hiddenPreviewsBodyPlaceholder` per category through expo-notifications (support UNVERIFIED, NS-13 R33) | BL-966 |
| Growing the evening pool to 31 keeps the named pool in the same order (`planner.ts` picks by index); a `beforeBirth` flag per variant for G5 | BL-943 |
| `planner.ts:259` uses the single-book birthday body with joined names; use the plural body | BL-943 |
| Typed-day validation codes `typed_day_past`, `typed_day_empty`, `typed_day_too_long` (local only, never logged with the words, J-N18) | BL-982 |
| `family.errors.joinFailed` mapped from a failed or lost accept answer (today it falls to `unknown`) | BL-983 |
| `undo_parent_join` client path, its row (`family.undoJoin.*`) with the 72-hour end time as `{date}` and `{time}`, and the other parent's one-time note (`family.undone.*`) | BL-983 |
| Hide `/invite/leave` while D-113 holds Leave, so `family.leave.later` can be deleted | BL-983 (or BL-444) |
| `quietHelp` change ships with NS-13 R27 (drafts count) | BL-943 |
| `onboarding.reminder` ask with two choices (if the design lead takes G2) | BL-943 |
| The invite link page strings `site.invite.*` in `site.en.ts`, and the page itself, are not in any row I found | BL-983 |

## 16. Hand-offs to other areas

- Area C (sign-out sheet, D1): NS-13 R14 removes reminders and typed days at sign-out. PROPOSED line for C's sign-out sheet: "Reminders on this phone stop until you sign in and turn them on again." (`account.signOut.remindersLine`). Same for Erase everything and account deletion (NS-18 R6).
- Area E (Me, Plan; second account): D-S24 strings are E's screen; the plan bodies say "Settings, Plan" while the tab is Me. Rename only with `legal` (in-app-disclosures rows 34 and 35 cite it).
- Area B (letter page): D-S01 sits in B's action row; B places it in the letter's own action group, not the add group (spec 03 section 2).
- Area A (Home): the typed-day line (D-S11) sits above Home's prompt on its day only; "Not much today" and its kept line are A's layout with these words.
- `legal`: Q43 on `whereItGoes`, `privacyLine`, `namesHelpOff`; Q48 on `whatTheyRead`; OQ-6 on the verb; Q45 is not a words question.
- Founder: approve every PROPOSED and CHANGE line before any build outside his family shows it.
