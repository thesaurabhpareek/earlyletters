# Area D: Family, sharing and reminders. End-to-end design

Status: DRAFT v1, 20 Nov 2026. Design lead, area D (`design-systems` lens). Docs only. Screen ids are stable: `MOTION.md` and `WORDS.md` in this folder key to them; new screens are appended, never renumbered.

Prototype: `PROTOTYPE.html` in this folder (self-contained; every journey below is a path through it).

## 0. Sources, precedence and conventions

Requirement sources, in the order of brief section 1 (CR-66):
1. Locked cards: NS-05 (`05-share-one-letter.md`), NS-13 and NS-18 (`09-capture.md`), NS-25 (`10-reading-and-family.md`), NS-32 (`11-foundations.md`), NS-07 C5 (`07-remaining-capability-rows.md` section 3), NS-03 (`03-family-hears-it-pilot.md`), under `00-product-frame.md`. Also cited where they bound this area: NS-35-R3 and R4 (a notification tap is a doorway that never starts a letter), NS-06-B4 (no notification when a seal opens), NS-26 (parked: not drawn).
2. `14-test-plan.md` journeys J-N3, J-N4, J-N5, J-N11, J-N17, J-N18, J-N19, J-N22, J-N24, J-N26, J-N27; `16-council-review-round-2.md` rulings T4, T5 and defaults D1, D2, D3, D11, D13.
3. Engineering: `13-engineering-plan.md`; the engineering plan PR #847 (`17-engineering-project-plan.md`, read 20 Nov through `gh api`); backlog rows BL-935, BL-939, BL-943, BL-949, BL-961, BL-963, BL-965, BL-966, BL-967, BL-974, BL-982, BL-983, BL-987; engineering inputs `/home/claude/review/eng/B-mobile-client.md` and `C-platform-quality-delivery.md`.
4. House design: `DESIGN_LANGUAGE.md`, `COMPONENTS.md`, `IA.md`, `NOTIFICATIONS.md`, `MOTION.md`; tokens `packages/design-tokens/src/tokens.ts`; words `packages/content` (`features/reminders.en.ts`, `features/family.en.ts`, `features/billing.en.ts`, `strings.en.ts`).
5. History: `docs/design/specs/03-SHARE-ONE-LETTER-11nov.md` and `07-COPARENT-COMING-SOON-11nov.md`. Where they differ from a card, the card wins (section 9).

Baseline read in code on the lock branch (worktree `/home/claude/wt/E`, head `450bcb4a9`): `app/settings/reminders.tsx`, `components/asks/reminder-prime-ask.tsx`, `components/settings/notification-preview.tsx`, `lib/reminders/scheduler.ts`, `lib/billing/plan-reminders*.ts`, `app/letter/[id].tsx`, `app/family.tsx`, `app/invite/*`, `lib/family/*`, `components/family/*`, `components/tonight/quiet-day-inline.tsx`, `apps/web/src/app/j/page.tsx`.

Conventions:
- Screen ids `D-Snn`; states `D-Snn.<state>`. Shared state suffixes match areas B, C and E: `.default`, `.empty`, `.loading`, `.offline`, `.error-<code>`, `.killswitch`, `.paused-<switch>`, `.lapsed`, `.signedout`, `.second-account`, `.newphone`, `.twobooks`, `.twoparents`, `.ax5`, `.vo`, `.dark`, `.hc` (Increase Contrast).
- Journeys `J-D<nn>`; steps are numbered; a test-plan journey id is named where one exists.
- Words in quotes are intent from the cards or existing keys. `WORDS.md` owns final strings and PROPOSED keys; this file names the slot.
- `{child}`, `{inviter}`, `{signsAs}` are placeholders; the product name is `{app}` (it lives only in `packages/brand`).
- Fictional family only: the Asha book.

## 1. Rules this area applies (from the frame and the brief)

1. Only Home starts a letter. Share is an output on the letter page; a notification tap is a doorway that lands on Home, the Book or Plan and never records (NS-35-R3, R4).
2. Family is never a tab. The other parent lives on pushed pages reached from Me; in a store build before NS-25's gates there is no surface and no "coming soon" line (NS-25-R1, D-161).
3. Nothing in this area counts, celebrates or nags: no share count, no "sent" toast (NS-05-R12, R22), no reminder that says it slowed or stopped (NS-13 section 15), no count of quiet days (NS-07-C5-3).
4. No child name and no letter words on a lock screen by default (frame guardrail; NS-13-R6a, R6b; NS-32-R12). Typed-day words are hidden by default (NS-18-R3).
5. Equal choices where something leaves the phone or a person agrees: Share preview (Continue, Not now), reminder ask (two equal answers), invite and accept sheets (equal stacked buttons at AX5).
6. Undo windows follow T4 (stated seconds, or VoiceOver read plus those seconds, or until the parent moves on under Switch Control). This area has two: the quiet-day line (no timer, C5-6) and the 72-hour join undo (a deadline, not a timer).
7. Accessibility to AX5 on an SE 3 (375 pt): one column, nothing truncated, every control 44 pt or more, primary actions 56 pt in the bottom third, Voice Control names equal visible labels, colour never the only signal.
8. Writing tools off on the typed-day field (D2). Nothing donated to Spotlight or Siri; a notification is not an `NSUserActivity` (D3).
9. Sign-out keeps the book on the phone (D1) and removes every reminder and typed day (NS-13-R14, NS-18-R6).

## 2. Journeys

Each journey lists the screens it walks. Every row of each card's "Unhappy paths" and "Scenario coverage" tables is placed in a journey or in a screen state (section 4); the coverage index in section 2.6 proves it.

### 2.1 Share one letter (NS-05 Level 1)

**J-D01 Share a kept letter, words only (happy path; J-N11).**
1. Book (B-S01), tap the parent's own kept letter: the letter page (B-S08) opens.
2. D-S01: the Share control "Share this letter" sits under the words and Play, above the "This letter" list (B-mobile-client 2.7; NS-21 order: dateline, words, Play, Share, list title, rows, Delete).
3. Tap Share: D-S02 opens within p95 300 ms (R23): title, the exact text that leaves (date line, words, signature line), the static row "The words always go", the version line, the where-it-goes line, then Continue and Not now, equal (R2).
4. Tap Continue (haptic `tap`): D-S03, the iOS share sheet, opens within 1 s (R11) with the text only.
5. The parent picks an app and a person and sends in that app.
6. The share sheet completes. The preview is already gone; the letter page is as it was. No toast, no haptic, no mark (R12, R22). The app never reads the result (R3b).

**J-D02 Share with the picture.** As J-D01; at step 3 the letter has a stored copy on this phone (NS-01), so the "Include the picture" toggle shows, default off (R5b). The parent turns it on: a 64 pt thumbnail with a 1 pt hairline appears in the preview below the words (D-S02.pictureOn). Continue hands over text plus one file `letter-photo.jpg` (R6a, R6b). On completion the temp file is deleted (R10a).

**J-D03 Picture could not be added (`share_temp_write_failed`).** After Continue with the picture on, the temp copy fails (disk full). The share sheet does not open yet; the preview stays and shows the caution line "The picture could not be added this time. The words will go." in place of the thumbnail, the toggle turns off, VoiceOver announces the line, and Continue and Not now stay (D-S02.error-share_temp_write_failed). A second Continue sends words only. Nothing is logged with a path. Card is silent on whether the sheet opens at once with words only; see Card gaps G-D03.

**J-D04 No Share control.** The control is absent, never greyed, on: another parent's letter; a sealed letter before it opens; a quiet-day mark; a letter with no words yet; a draft not kept (R7). Also absent everywhere else: Home, the Book list, the Photos lens, Find results, Me (R1). With `EXPO_PUBLIC_SHARE_LETTER` off: absent and no code path (R26). State D-S01.absent.

**J-D05 The parent's own private letter.** Share present (R7). The preview is the same; no extra line is required by the card (spec 03 Q5 proposed a Private note; not carried, card gap G-D02).

**J-D06 Long letter, right-to-left letter.** A 1,000-word letter: the preview text scrolls inside the sheet; Continue and Not now stay pinned in the sheet footer in the bottom third (section 5 row "Very long letter"; R13b). An Arabic or Hebrew letter: the words render right to left; the date and signature lines stay in order (isolates are in the payload, R20; the preview shows them as the recipient will).

**J-D07 Cancel, fail, kill, interrupt.**
- Not now: the sheet closes; nothing built, sent or left (door line Decline).
- The parent cancels inside the iOS share sheet: back on the letter page, preview closed (same as sent: the app cannot tell; R3b). Temp file deleted.
- The send fails in the other app: that app's own error; back on the letter page.
- App killed after Continue: the next launch sweeps `tmp/share` before the first idle (R10b). No screen.
- A call, Siri or an alarm during the preview or share sheet: both stay open; nothing is sent until the parent acts.
- App lock on and the app goes to the switcher: the snapshot is blank (R14); returning passes App lock first (E-S22) and the preview is still open.

**J-D08 Offline, servers off, lapsed, signed out, second account, new phone.** Works offline and with `serverFeaturesEnabled()` off, with 0 network calls (R9). Works after the allowance and after Plus lapses (R8). Works signed out on letters still on the phone (D1). Account B sees Share only on B's own letters; never A's (R27). On a new phone a letter whose stored copy stayed behind shows no toggle (R5b).

### 2.2 Reminders (NS-13), with the budget (NS-32)

**J-D10 The ask after the first kept letter.**
1. Review, Keep (A-S07, A-S13): the first letter is kept; the Book shows (as built, Review asks for the card after the Book is on screen).
2. D-S04 rises: one sentence, the planned rhythm line ("A few times a week, Tuesday and Saturday, 8:30 PM" read from prefs), and two equal answers: "Yes, evenings" and "No reminders". A "Change the time" text button (44 pt) under the rhythm line opens the system time picker in place (D-S04.picking).
3a. Yes: the card closes; D-S05 (iOS permission) appears once. Allow: a toast "Reminders are on. Next: Tuesday at 8:30 PM." with Change (to D-S06). Don't Allow: a toast "Notifications are off" with Open Settings; no second ask from us (door line Never).
3b. No reminders: no iOS prompt; the toast "You can write whenever you like." The card may show once more later (cap of 2 ever; R31).
4. The card has no Close and no swipe: one of the answers ends it (as built). It is not a Home slip (frame section 4).

**J-D11 A reminder at the chosen hour (J-N3).**
1. 8:30 PM on Tuesday: one notification of class `evening` arrives, silent banner, neutral words (D-S10.evening).
2. Tap: the app opens to Home within 2 s with Home's current prompt (D-S11.home; NS-13-R9). With App lock on, the lock cover first (E-S22).
3. One more tap on Speak starts a letter (A-S04). The tap on the notification never started recording (NS-35-R3).
4. A letter made today (kept, waiting at Keep or held) removes today's pending nudge at the next re-plan (R8). Tomorrow's nudge has different words (R2).

**J-D12 A week of silence: the plan steps back (J-N4).** No screen. The plan already on the phone holds days 1 to 7 on the cadence, then at most one nudge per 7-day block for days 8 to 35, then nothing (section 3a; R3, R4, R18). Nothing on any screen says reminders slowed or stopped; D-S06's "Next:" line simply shows the next planned date, or, after day 35, the line "Next: after your next letter." is NOT shown (it would describe the absence); the row shows no Next line at all (D-S06.backedOff). See Card gaps G-D06 for the Next line after day 35.

**J-D13 Change reminders in Me.**
1. Me (C-S01), Reminders row: D-S06.
2. With reminders on: How it will look (the real first planned notification, neutral unless names on), Next line, How often (Weekly, A few times a week, Every evening), Which evenings (chips; hidden for Every evening), Time (system compact picker, 07:00 to 21:30 in 15-minute steps; D-S07), Month and birthday messages, Names in notifications, then Days to remember (NS-18, behind its flag).
3. Each change saves at once; the Next line cross-fades (none under Reduce Motion); VoiceOver hears "Saved. Next: ..." 600 ms after the last change (as built).
4. A time outside the window cannot be picked; a stored late time is clamped and the line "Late nights stay quiet." appears once (as built; R30).
5. App lock on: Names in notifications is off and disabled, with "Names stay hidden while App lock is on." (as built; NS-13 section 5).

**J-D14 Notifications not allowed, or revoked.** iOS says no (at the ask, or later in iOS Settings): D-S06.denied shows the card "Notifications are off" with one sentence and Open Settings, under the switch; nothing is scheduled (R16). No in-app nag anywhere else. Returning from iOS Settings with permission granted: the card collapses, the Next line appears, one toast says both (as built). Plan notices: Settings, Plan shows the plan date (D-S24; NS-32-R4).

**J-D15 iOS refuses the schedule.** D-S06.error-schedule_failed: "Could not set reminders just now." with Try again (as built). Try again re-plans; success announces the Next line.

**J-D16 Travel and clock changes (J-N5).** No screen. Floating calendar triggers fire at the chosen wall-clock hour in the new zone; never between 21:30 and 07:00 local; never two budgeted notifications on one local date (R7; NS-32-R6). A date skipped by crossing the date line: delivered once late or not at all (device row decides); never two. Daylight saving: the hour holds.

**J-D17 Two books, a quiet book, a due date (J-N19, J-N26).**
- Two books: at most one budgeted notification per local day across books (R19; NS-32-R1). Priority: typed day, birthday, month note, evening. A birthday for one child and a month note for another on one date: one notification, the birthday copy (R28, NS-32-R1b).
- Two children's month notes on one date: one grouped note (as built, `together` copy).
- A quieted or hidden book, or "Include {child} in my reminders" off: no month or birthday note and no name for it (R12; NS-32-R14). Unquiet brings them back at the next re-plan. Engineering gap E-D01: the planner never reads `Child.quiet` today.
- A child with only a due date: evening nudges only; no due-date wording (R10).

**J-D18 Sign-out, deletion, second account, new phone.**
- Sign-out (C-S03): every scheduled and presented reminder and typed day is removed; `reminders.*`, `notifications.lockScreenNames` and `typedDay.*` are cleared (R14; NS-18-R6). The book stays (D1). C-S03's sheet carries no reminder line; the card does not ask for one (gap G-D07 proposes none).
- Account deletion and Erase everything: the same removal (R15).
- Account B signs in on A's phone: B starts with reminders off and no typed days; none of A's notifications is pending or shown (R13). The ask card follows its cap on this phone for B (gap G-D08).
- New phone: settings never sync; the ask follows the two-showing cap there (R22).

**J-D19 Past the free allowance (J-N22).** Same rules; no reminder names Plus, a price or the Keep step (R11). No screen change.

### 2.3 Typed days (NS-18)

**J-D20 Add a day.**
1. Me, Reminders (D-S06), section "Days to remember", row "Add a day".
2. D-S08 opens: Date (system inline date picker, tomorrow onward), "Your words" field (1 to 80 graphemes, any script, writing tools off), the switch "Show my words in the notification" (off by default), a live preview (D-S08 uses NotificationPreview) showing the fixed line, or the words when the switch is on, then Save and Cancel.
3. Save (under 300 ms): the sheet closes; the day appears in the list as a row: the date, then the words under it (D-S06.typedDays-list). VoiceOver reads "Saturday 14 March. Nursery starts."
4. On that day, at the reminder time (or 20:30 when reminders are off; gap G-D09), one notification of class `typedDay` arrives: by default the fixed line (D-S10.typedDay); with the switch on, the parent's words unchanged.
5. Tap: Home (D-S11.typedDay) shows the parent's words above the prompt ("Nursery starts"); one more tap starts speaking.
6. The day after delivery, the words are deleted and the row leaves the list (NS-18-R7). Nothing says so.

**J-D21 Typed-day edge cases.**
- A past date: the picker offers no date before tomorrow; today is not offered (gap G-D10).
- That day already has a reminder or month note: only the typed day is delivered (NS-18-R2).
- Reminders backed off or stopped: the typed day is still delivered (R4).
- Reminders switched off: typed days still delivered if notifications are allowed (NS-18 PROPOSED). D-S06 keeps the "Days to remember" section visible when the switch is off (D-S06.typedDays-remindersOff).
- Notifications not allowed: the section shows the denied card's sentence once; Add a day still works and saves (the parent may allow later). Gap G-D11.
- Delete: tap the row, D-S09 opens with the date and words and "Delete this day" (destructive) and "Keep it"; delete cancels its notification.
- More typed days than free slots: the nearest are scheduled first; others at a later re-plan (PROPOSED). No screen says so.
- Interrupted while typing: words kept in the field until Save. App killed: unsaved words lost; saved days scheduled.
- Words about a due date, or a name: allowed; hidden from the lock screen by default.
- Flag `EXPO_PUBLIC_TYPED_DAYS` off: the section is absent and typed-day notifications are cancelled.

### 2.4 One notification budget and every class on the lock screen (NS-32)

**J-D22 The lock screen walk (J-N24, J-N27).** For each class in section 5, with iOS Show Previews set to Always, When Unlocked (phone locked) and Never, with Names in notifications off and on, with App lock on, and with the typed-day words switch off and on: what the lock screen and Notification Centre show is exactly the matrix in section 5.2. A trial ending and a reminder on the same day: both arrive, the plan notice inside its window at 10:00, the reminder at the chosen hour (NS-32-R4; at most 2 on that day).

**J-D23 Focus, Scheduled Summary, quiet delivery.** No class is time-sensitive (R20; NS-32-R10): a Focus holds them; Scheduled Summary collects them. Deliver Quietly or Provisional: D-S06 shows "iPhone delivers these quietly, to Notification Center only." (as built).

### 2.5 The other parent (NS-25), only when its gates are met

Every screen in this section is absent in a store build until NS-25's gates clear (R1), absent when `serverFeaturesEnabled()` is off (R12), and absent outside the D-162 door rule (`visibleCoParentDoors`, alpha only today). There is no "coming soon" state anywhere.

**J-D30 Invite the other parent (P1).**
1. Me, the book's page (C-S15), row "Write this book together" (D-S12). One parent and no open invite: it opens D-S13.
2. D-S13, the invite sheet: title, one body line, the shared-scope line before sending ("They will be able to read every letter in this book that is not private, including the ones already there."; R16), the optional field "What does {child} call them?", the link line ("The link works once, for 7 days. You can cancel it any time."), then "Share invite link" and "Not now", equal and stacked.
3. Share invite link: "Getting the link ready" (D-S13.working), then the iOS share sheet with the parent's own message; the parent sends it themselves.
4. Back in the app: the toast "The invite waits until they join." The book's family page (D-S18) lists "Invited, open until {date}" with Share again and Cancel invite.

**J-D31 Join (P2) from the link.**
1. P2 opens the link. On an iPhone with the app, it opens the app; without it, the web page (D-S14) says the invite opens in the app on an iPhone and gives the App Store link plus copy steps; it names no child and no inviter (R6).
2. P2 installs, signs in (E-S04 to E-S07).
3. D-S15, peek: "Opening the invite" then "Join this book as a parent?", "Invited by {inviter}" (the sign-off only) and the role; no child name, no letter (R2).
4. Join the book: D-S16, the agreement with versioned links and Agree and join, and Not now, equal. Agree records one PRIV-R21 row (`invite_accept`, R17).
5. D-S17: "Joining the book" (progress, never a count), then "You're in {child}'s book", the flyleaf line, the field "What does {child} call you?" and Open the book. The first page of letters within 10 s p95 on LTE.
6. P2 speaks a letter from Home; it is signed with P2's sign-off; P1 sees it at the next sync unless P2 kept it private.

**J-D32 Invite and join, unhappy.** Each is a state of D-S13, D-S14, D-S15 or D-S17 (section 4):
- Opened on Android or a computer: D-S14.other-device.
- Expired (7 days): D-S15.error-expired ("This invite has expired. Ask for a new one."). The web page cannot know expiry (it has no server; gap G-D12).
- Revoked or used: D-S15.error-revoked, .error-used (SCINV).
- P2 already a member: D-S16.error-already_member; the book opens (R9).
- P2 already has a book: joins as a second book; the switcher appears (NS-14; D-S17.twobooks).
- A third adult: D-S16.error-book_full (SCCAP; R5). The inviter's sheet shows "{child}'s book has two parents." in place of Share (D-S13.full).
- Invites paused: D-S13.paused, D-S15.paused, D-S16.paused ("Invites are paused for now. Please try again a little later."); Cancel invite still works (R11).
- Offline: D-S13.offline, D-S15.offline, D-S16.offline: one line, Try again; nothing half-joins.
- A slow or lost accept answer: D-S16.joining holds; a lost or failed answer shows D-S16.error-join_failed ("Joining did not finish. Nothing has changed. Try again."); a retry makes exactly one membership (R10).
- Killed mid-join: the token stays in the Keychain; on relaunch D-S15 resumes.
- Consent or sync missing for P2: D-S16.error-consent_needed, or D-S16.needs-sync with the route to Settings, Account (as built).
- Signed out mid-flow: D-S15.error-signed_out ("Sign in again to continue.").
- Rate limit, not a parent, book deleted, unknown: their built lines.

**J-D33 Undo the join within 72 hours (P1).**
1. D-S18, the co-parent's row shows, under the sign-off, "Joined {date}. You can undo this until {date, time}." and an "Undo join" button (44 pt). Not a countdown, a deadline.
2. Undo join: D-S19, a ConfirmSheet: what happens ("Their letters leave this book and stay theirs. Their phone stops receiving this book."), "Keep them in the book" (default) and "Undo join".
3. Confirm: one call (`undo_parent_join`); the row leaves; a toast "Join undone." Their letters are set private, never deleted (R4).
4. P2's phone, at its next sync: D-S20, one neutral line on the book switcher and the family page: "This book is no longer shared with you. Your own letters stay yours." P2's own letters stay readable and exportable.
5. After 72 hours: no Undo control on either phone (R13); an attempt (stale screen) returns SCPAR and shows D-S19.error-SCPAR with the existing line `family.errors.not_allowed` ("That isn't possible from here."). Removal after that is the support runbook only.

**J-D34 Deletion and separation.**
- P2 deletes their account: P2's letters are purged on the published clock; P1's book stays whole (R14). On P1's phone the co-parent row shows the existing left note (`left.noteUnsigned`), once.
- P1 deletes their account: P2's letters survive with their labels (R15).
- Two parents and private letters: neither reads the other's private letters; only the author edits or deletes (R3).
- Separation: no new screen; private letters stay private; the 72-hour undo is the only in-app removal.

### 2.6 Quiet days (NS-07 C5)

**J-D40 Not much today.**
1. Home (A-S01), the capture cluster's quiet link "Not much today" (D-S21).
2. One tap (VoiceOver hint "Marks today without writing anything."): within 100 ms the link fades and "A quiet day, kept." with Undo appears in place; soft haptic; VoiceOver announces the line (C5-13).
3. The line stays while Home stays: it has no timer, so T4 is met (C5-6).
4. Book (B-S01): "A quiet day" with the date, unsigned, as its own row (D-S22).
5. Later the same day the parent keeps a letter: the quiet row stops showing (C5-11).

**J-D41 Quiet-day edges.** Undo: no row in the Book. A second tap the same day in the same book: no-op (the link is already replaced by the kept line). Two books: the active book only (C5-7). Two phones of one author: one row (C5-10). The other parent never sees it (C5-8). Local save fails: the standard save error in place; Home stays. Consecutive quiet days: separate rows, no run line, no grouping (C5-9). Read together, the PDF, Find, Share, Firsts, seals, pictures, past letters: never (C5-2, C5-4).

### 2.7 The family-hears-it pilot (NS-03): what a parent sees

**J-D50 A pilot parent (no build).** The pilot has no screen (NS-03 section 18). The artefacts a parent sees are message texts in their own messaging app, and the app's existing Export. D-S23 draws them as message bubbles for review only:
1. Recruit message; 2. Consent text (version W or V) with "Yes" or "No thanks"; 3. Instruction W or V; 4. The parent exports the one letter (C-S04, area C; the one-letter PDF if it can be cut, else a screenshot of the letter page B-S08); 5. Script A on day 3; 6. Script B on day 7 and Script C relayed; 7. Close.
Nothing in the app changes; NS-05's Share is not part of the pilot (NS-03 section 3, Not in scope).

### 2.8 Coverage index (every unhappy and scenario row placed)

| Card section | Rows | Where |
|---|---|---|
| NS-05 section 5 (14 rows) | no words, at Keep, own private, other parent, sealed, quiet mark, picture missing, temp write failed, very long, RTL, no apps, cancel, send fails, killed, wrong person, another adult, nicer version | J-D03 to J-D07; D-S01.absent; D-S02 states; "no apps" and "wrong person" are iOS and the preview's where-it-goes line; "nicer version" is refused by construction (no control exists) |
| NS-05 section 6 (24 rows) | all | J-D01 to J-D08; D-S02.ax5, .vo, .dark, .hc |
| NS-13 section 5 (16 rows) | all | J-D10 to J-D19; D-S06 states |
| NS-13 section 6 (24 rows) | all | J-D11 to J-D19; D-S06.ax5, .vo; low storage: tap lands on Home with E-S17's line |
| NS-18 sections 5 and 6 | all | J-D20, J-D21; D-S08 states |
| NS-32 sections 5 and 6 | all | J-D17, J-D22, J-D23; section 5 matrix |
| NS-25 sections 5 and 6 | all | J-D30 to J-D34; D-S13 to D-S20 states |
| NS-07 C5 sections 3.5 and 3.6 | all | J-D40, J-D41; D-S21, D-S22 states |
| NS-03 section 6 | all | J-D50 (process, not screens) |

## 3. Screen and state inventory

State names below are the reconciled set shared with `WORDS.md` and `MOTION.md` (section 12). Every screen also has the shared suffixes where they apply: `.ax5`, `.vo`, `.dark`, `.hc`, `.offline`, `.lapsed`, `.signedout`, `.second-account`.

| Id | Screen or surface | Card | Base screen owner | States |
|---|---|---|---|---|
| D-S01 | Letter page: the Share control | NS-05 | B (B-S08) | `.default` (present), `.absent` (other parent, sealed, quiet, no words, not kept, flag off) |
| D-S02 | Share preview sheet | NS-05 | D | `.pictureOff` (first state when a stored copy exists), `.wordsOnly` (no stored copy: no toggle), `.pictureOn`, `.error-share_temp_write_failed`, `.versionFixes` (default version line), `.versionExact`, `.long`, `.rtl`, `.switcher` (blank snapshot) |
| D-S03 | iOS share sheet | NS-05 | system | `.text`, `.textAndPicture`, `.completed` (sent, cancelled or failed: identical) |
| D-S04 | Reminder ask (sheet over the Book) | NS-13 | D | `.default`, `.pickTime` (picker in place), `.after-yes`, `.after-yes-denied`, `.after-yes-failed`, `.after-no` |
| D-S05 | iOS notification permission alert | NS-13 | system | `.shown` |
| D-S06 | Me, Reminders | NS-13, NS-18, NS-32 | D | `.off`, `.on`, `.named`, `.appLock`, `.denied`, `.quietDelivery`, `.error-schedule_failed`, `.lateClamp`, `.noBirthDate`, `.backedOff` (no Next line), `.typedDays-empty`, `.typedDays-list`, `.typedDays-remindersOff`, `.typedDays-flagOff`, `.signedOut-after` (all defaults, nothing pending) |
| D-S07 | Time picker (system compact, 07:00 to 21:30, 15-minute steps) | NS-13 | system | `.default` |
| D-S08 | Add a day sheet | NS-18 | D | `.default`, `.filled`, `.showWords`, `.error-typed_day_empty`, `.error-typed_day_past`, `.error-typed_day_too_long`, `.error-schedule_failed`, `.notAllowed`, `.interrupted` (words kept until Save) |
| D-S09 | A typed day: detail and Delete | NS-18 | D | `.default`, `.confirm` |
| D-S10 | Lock screen and Notification Centre | NS-32, NS-13, NS-18 | system render | per class `evening`, `monthAge`, `together`, `birthday`, `typedDay`, `plan` (previews shown, defaults); `<class>-hidden` (placeholder; `WORDS.md` groups these as `.hidden`); `evening-named`, `birthday-named`; `typedDay-words`; `oneDay` (plan notice plus one budgeted); `quiet`; `focus` |
| D-S11 | Notification landing | NS-13, NS-18, NS-35 | A, B, E | `.home` (evening), `.typedDay` (Home with the words), `.book` (month, birthday), `.plan` (Settings, Plan), `.appLock` (lock first) |
| D-S12 | Me, the book's page: "Write this book together" | NS-25 | C (C-S15) | `.store` (absent: store build before the gates or outside the D-162 door rule), `.killswitch` (absent: servers off), `.one-parent`, `.consent-needed`, `.invited`, `.two-parents` |
| D-S13 | Invite sheet | NS-25 | D | `.default`, `.working`, `.sent` (toast on D-S18), `.full`, `.paused`, `.offline`, `.error-<code>` (rate_limited, not_parent, consent_needed, family_share_consent, retry_new_invite, unknown) |
| D-S14 | Invite link page (web) | NS-25 | D | `.iphone`, `.other-device`, `.missing-token`, `.copied` (`.expired` is not reachable: section 12) |
| D-S15 | Join ask: peek (top of the one join sheet) | NS-25 | D | `.signed-out`, `.loading`, `.default`, `.no-signoff`, `.paused`, `.offline`, `.error-<code>` (expired, used, revoked, not_found, signed_out) |
| D-S16 | Accept: the agreement (bottom of the same sheet) | NS-25 | D | `.default`, `.joining`, `.paused`, `.offline`, `.needs-sync`, `.error-<code>` (already_member, book_full, book_deleted, consent_needed, family_share_consent, join_failed) |
| D-S17 | Joined: arrival | NS-25 | D | `.arriving`, `.slow`, `.joined` (sign-off field, Open the book), `.twobooks` |
| D-S18 | Family page | NS-25 | D | `.one-parent`, `.pending`, `.expired`, `.undo-open` (inviter, within 72 h), `.undo-closed` (after 72 h: no control), `.left`, `.paused` |
| D-S19 | Undo join confirm | NS-25 | D | `.default`, `.working`, `.done` (toast), `.error-SCPAR`, `.error-network`, `.error-unknown` |
| D-S20 | The other parent's phone after an undo | NS-25 | D | `.default` |
| D-S21 | Home: Not much today | NS-07 C5 | A (A-S01) | `.default`, `.kept`, `.error-save_failed` |
| D-S22 | Book: the quiet-day row | NS-07 C5 | B (B-S01) | `.default`, `.consecutive`, `.menu` (built "Remove this mark"), `.removed` (built toast) |
| D-S23 | Pilot artefacts (messages) | NS-03 | not app screens | `.recruit`, `.consentW`, `.consentV`, `.instructionW`, `.instructionV`, `.scriptA`, `.scriptB`, `.scriptC`, `.close` |
| D-S24 | Me, Plan: plan date when notifications are not allowed | NS-32-R4 | E (E-S11) | `.denied` |

## 4. Screens

Measurements are in pt at the default text size on a 375 pt wide screen (SE 3). Gutters `space.4` (16) for settings, `space.5` (20) for reading. Sheets: top radius `radius.xl` (28), `surfaceRaised`, scrim `scrim`. Type styles are token names.

### D-S01 Letter page: the Share control

Purpose: the one place a letter leaves the app.

Default (own, kept, open letter with words):
```
 [dateline                         ]
 [letter words, letterBody serif   ]
 [               From Mama, signature]
 [ Play  (AudioPlayer)             ]
 +-----------------------------------+
 | [^] Share this letter             |   Button secondary md, full width, 56 pt, leading icon
 +-----------------------------------+
 THIS LETTER                            ListSection title (NS-21)
 | Make private                    > |
 | The day it is about             > |
 ...
 | Delete                            |   last, destructive
```
- Component: existing `Button` (`variant="secondary"`, `size="lg"`, 56 pt), Phosphor `Export` icon (the square-and-arrow-up shape), decorative (hidden from VoiceOver). Not a list row: the engineering read places Share above the list as its own button (B-mobile-client 2.7), and a list row would read as a setting of the letter.
- Label "Share this letter" (17 characters; cap 22; verb decided by `content` with `legal`, NS-05 OQ-6).
- AX5: full width; the label wraps to two lines before it truncates; height grows; icon stays leading at 24 pt.
- VoiceOver: "Share this letter, button". Hint (PROPOSED): "Shows what will be sent first." Order: dateline, words, signature, Play, Share, list title, rows, Delete (NS-21; B-mobile-client 4).
- Voice Control: "Share this letter".
- `.absent`: the button is not rendered and leaves no gap; the list title follows Play.
- Integration: NS-05-R1, R7, R25, R26, R27; BL-939 (after BL-937); flag `EXPO_PUBLIC_SHARE_LETTER` (`capabilities.shareLetter`, local flag family; off in testflight and production until words and Q45); kill switch: none by card (section 9 of NS-05; see engineering gap E-D08); reads `entries.author_id`, `kind`, `final_text`, seal state through `isVisibleTo`; writes nothing; module `app/letter/[id].tsx` via `lib/letter/rows.logic.ts`.

### D-S02 Share preview sheet

Purpose: name exactly what leaves before anything leaves.

Default (words only, no picture on this phone):
```
 +---------------------------------------+  Sheet, large detent at AX5
 | This will be sent                     |  title2, heading
 |                                       |
 | +-----------------------------------+ |  Card surface, radius.md, 1 pt line
 | | Saturday 14 March 2026            | |  letterDateline
 | |                                   | |
 | | We went to the park and Asha      | |  letterBody serif, scrolls
 | | laughed at the ducks.             | |
 | |                                   | |
 | |                   From Mama       | |  signature
 | +-----------------------------------+ |
 |                                       |
 |  (check) The words always go          |  static row, body, no switch
 |  [Include the picture        ( o)]    |  ToggleRow, only with a stored copy
 |                                       |
 |  Sent as it reads in the book, with   |  footnote textMuted (AppNote)
 |  small fixes.                         |
 |  It goes only where you send it, and  |  footnote textMuted (AppNote)
 |  cannot be taken back once sent.      |
 |---------------------------------------|  footer, pinned
 | [      Continue      ] [   Not now   ]|  two Button secondary lg, equal, 56 pt
 +---------------------------------------+
```
- Order is the card's (section 4 step 3; R13a): title, the text that leaves, the words row, the picture toggle, the version line, the where-it-goes line, Continue, Not now. The preview card holds the exact wrapper text the payload builds (R18): the about-day in the device locale (month and year when the precision is month), a blank line, the words, a blank line, the signature line. Nothing else (R16b).
- `.pictureOn`: a 64 x 64 thumbnail (the list copy, `radius.sm`, 1 pt `line` hairline, ignores Smart Invert) sits inside the preview card under the signature, labelled for VoiceOver "The picture, included". The toggle label stays "Include the picture"; its state is spoken by the system.
- `.noPicture`: the toggle row is absent, not greyed (R5b).
- `.error-share_temp_write_failed`: the thumbnail is replaced by a caution line with a `WarningCircle` icon (shape plus colour; colour is never the only signal): "The picture could not be added this time. The words will go." The toggle returns to off. VoiceOver announces the line. Continue and Not now stay.
- `.exact`: the version line reads "Sent exactly as said." when the Book shows that version (R19).
- `.long`: the preview card scrolls inside the sheet body; the footer stays pinned; a 1 pt `line` appears above the footer while the body scrolls under it.
- `.rtl`: the words align to the reading direction; the date and signature lines keep their order.
- Equal buttons: both `Button variant="secondary" size="lg"`, same width, same type; neither filled (NS-05-R2; spec 03 J6 exception carried). Continue on the leading side, Not now on the trailing side at default size.
- AX5 (R13b): one column; the sheet is full height; Continue above Not now, each full width, 56 pt or taller as the label grows; both pinned in the footer so they are visible without scrolling past the text; the preview card scrolls above them; the static row and the toggle stack label over switch (ToggleRow AX5 behaviour).
- VoiceOver: focus lands on the title. The preview card is one element: "What will be sent. Saturday 14 March 2026. We went to the park ... From Mama." Then "The words always go" read as text (no switch role, not dimmed; R4b). Then the toggle. Then the two lines, then Continue and Not now, both with no hint that suggests one is expected.
- Switch Control: the static row is not a stop; the toggle, Continue and Not now are.
- Dark and Increase Contrast: tokens only; the hairline frame on the thumbnail is `line` (`highContrast.line` under Increase Contrast).
- Switcher (`.switcher`): with App lock on the snapshot is blank (R14; the app's `privacy-cover`).
- Haptic: `tap` on Continue only. No sound. Motion: system sheet only (MOTION.md keys D-S02).
- Components: existing `Sheet` (`footer` prop for the pinned pair, `hideClose`), `Card`, `ListRow` static form (see engineering gap E-D10), `ToggleRow`, `AppNote`, `Button`. No new shared component (NS-05 section 15). A feature composite `components/share/share-preview.tsx` assembles them.
- Integration: NS-05-R2, R4a, R4b, R5a, R5b, R6a, R6b, R10a to R10c, R13a, R13b, R14, R16a, R16b, R17 to R24; BL-939; flag as D-S01; error code `share_temp_write_failed` (falls back to words only; never logged with a path); reads `final_text`, `occurred_on`, `occurred_precision`, `edit_level`, signature via `authorOf`, `entry_media` stored copy; writes only `tmp/share/letter-photo.jpg` (complete protection, backup-excluded); modules `lib/share/payload.logic.ts`, `lib/share/temp.ts`, `lib/share/share.ts`.

### D-S03 iOS share sheet

System UI. We hand it the text and at most one image URL, with no `subject` and no `title` (R21). On completion of any kind the preview is already closed and the letter page is unchanged; the temp file is deleted in the completion handler (R10a). The result is never read (R3b). Spec 03 kept the preview open on cancel; that would require reading the result, so it is superseded.

### D-S04 Reminder ask

Purpose: one in-context ask after the first kept letter; two equal answers.

Default:
```
 (scrim over the Book)
 +---------------------------------------+  sheet, radius.xl top, surfaceRaised
 |  ( bell )                              |  56 pt circle, decorative
 |  A gentle nudge, now and then?         |  title2 serif, heading
 |  A couple of evenings a week, at a     |  body
 |  time you pick, to add to Asha's book. |
 |  Never late at night.                  |
 |                                        |
 |  A few times a week, Tue and Sat,      |  subhead textMuted
 |  8:30 PM          [Change the time]    |  quiet Button sm, 44 pt
 |                                        |
 |  [        Yes, evenings          ]     |  Button secondary lg, 56 pt
 |  [        No reminders           ]     |  Button secondary lg, 56 pt
 +---------------------------------------+
```
- Change against the build: the built card has three answers ("Yes, evenings" filled, "Pick a time" outline, "No reminders" quiet). NS-13's door line asks for "one sentence, two equal choices". So: the two answers are equal (`secondary lg`, same size and type, stacked at every size), and "Pick a time" becomes "Change the time", a quiet control on the rhythm line that opens the system picker in place (`.picking`) and is not an answer. Card gap G-D04 records the conflict.
- `.picking`: the rhythm line becomes "Remind me at [8:30 PM]" with the system compact picker (07:00 to 21:30, 15 minutes); the two answers stay.
- The body names the child in the app only (built `renderTemplate`); the lock screen stays neutral.
- No Close, no swipe to dismiss: one answer ends it (as built). VoiceOver: modal; the scrim is hidden. Order: title, body, rhythm line, Change the time, Yes, evenings, No reminders.
- AX5: icon hidden at AX3 and above to give the text room (decorative); the rhythm line and Change the time stack; both answers full width, stacked, equal.
- Results are toasts (existing `Toast`): "Reminders are on. Next: {weekday} at {time}." with Change; "Notifications are off" with Open Settings; "You can write whenever you like." (no action). Toasts with an action follow T4 through BL-954.
- Integration: NS-13-R31 (cap of 2), section 12 door lines; BL-943 (copy change through BL-965); no flag; no kill switch (none exists; `killSwitches.reminders` not added, NS-13 OQ); reads prefs and the active child's name; writes `reminders.*`, `reminders.onSince` (new) via `turnOnReminders()`; module `components/asks/reminder-prime-ask.tsx`, `lib/asks`.

### D-S05 iOS permission alert

System UI, once per install, only after "Yes, evenings" or the D-S06 switch. The iOS notification alert carries no app-provided sentence, so the D-S04 body and the D-S06 footer lines are the context shown before it (CCO-10).

### D-S06 Me, Reminders

Purpose: every reminder choice on one page, saved as made.

Default, on (names off):
```
 < Me                 Reminders              (large title)
 +---------------------------------------+
 | Reminders                       [ on ]|  ToggleRow
 +---------------------------------------+
 Notifications never show what you write.   footer, footnote
 Names stay off the lock screen unless you
 turn them on. Only in the evenings you
 pick, and never late at night.

 HOW IT WILL LOOK
 +---------------------------------------+
 | A letter tonight?                     |  NotificationPreview: headline
 | What made you smile today? Say it out |  subhead
 | loud and keep it.                     |
 +---------------------------------------+
 Next: Tuesday at 8:30 PM.                  subhead, cross-fades on change

 HOW OFTEN
 | ( ) Weekly                            |  ChoiceGroup list
 | (o) A few times a week                |
 | ( ) Every evening                     |
 WHICH EVENINGS
 | [Sun][Mon][Tue*][Wed][Thu][Fri][Sat*] |  ChipGroup, wraps
 TIME
 | Reminder time              [8:30 PM]  |  system compact picker
 Reminders come between 7 AM and 9:30 PM, and stay quiet on a day you have already written.
 +---------------------------------------+
 | Month and birthday messages     [ on ]|
 | A short message on the day a new month|
 | begins in each book, and on birthdays.|
 | Names in notifications         [off ]|
 | Notifications say "your little one"   |
 | and show no names on the lock screen. |
 +---------------------------------------+
 DAYS TO REMEMBER                           (NS-18, behind its flag)
 | Saturday 14 March                   > |  ListRow: title date, subtitle words
 | Nursery starts                        |
 | + Add a day                         > |
 +---------------------------------------+
 A day you add gets one message on that day. Your words stay on this phone.   footer (intent)
```
- Built as is for NS-13; this design adds only the "Days to remember" section (NS-18), the `.backedOff` rule for the Next line, and the `.off-withDays` state. Nothing on the page says reminders slowed or stopped (NS-13 section 15).
- `.off`: only the switch and its footer, then "Days to remember" if any exist or the flag is on (`.off-withDays`; typed days still deliver when notifications are allowed).
- `.denied`: under the switch a card (`surface`, `radius.md`) with `WarningCircle` and "Notifications are off", one sentence, and Open Settings (outline sm). The choices below stay editable so a parent can set up before allowing.
- `.scheduleFailed`: a card with "Could not set reminders just now." and Try again.
- `.on-appLock`: Names in notifications off and disabled, help "Names stay hidden while App lock is on."
- `.quietDelivery`: footnote under the Next line.
- `.monthNoBirthDate`: the month row's help "Starts once a birth date is added."
- `.backedOff`: after day 35 with no letter, the plan holds nothing of these classes; the Next line is not shown (no line about absence). The preview still shows the words a reminder would use.
- `.twobooks`: no change on this page; each book's "Include {child} in my reminders" lives on the book's page (C-S15).
- AX5: rows stack title over value; chips wrap to several lines (each 44 pt high); the time label sits above the time (as built `ax`); the typed-day rows put the date above the words; nothing truncates; the words wrap.
- VoiceOver: switch reads its state; the preview reads as one element "How it will look. {title}. {body}"; day chips read the full weekday and "selected" (checkbox role, or radio for Weekly); after a change, "Saved. Next: Tuesday at 8:30 PM."; typed-day rows read "{date}. {words}", hint "Opens this day." 
- Integration: NS-13-R1 to R33, NS-18-R1 to R8, NS-32-R4 (via D-S24); BL-943, BL-966, BL-967, BL-982; flag for typed days `EXPO_PUBLIC_TYPED_DAYS` (local family); no remote pause; failure is `ScheduleResult { ok: false }` (no code); reads prefs, permission detail, `nextReminder()`, `plannerChildren()`, app lock; writes `reminders.*`, `notifications.lockScreenNames`, `typedDay.*`; modules `app/settings/reminders.tsx`, `components/settings/reminders.logic.ts`, `lib/reminders/*`.

### D-S07 Time picker

The system compact time picker, as built in D-S04 and D-S06: `minuteInterval` 15, minimum 07:00, maximum 21:30. No custom wheel. AX5: the label stacks above the value. VoiceOver: "Reminder time, 8:30 PM". Integration: NS-13-R30.

### D-S08 Add a day sheet

Purpose: a future day with the parent's own words.

Default:
```
 +---------------------------------------+  Sheet (medium; large at AX5)
 | Add a day                     Cancel  |  title2; quiet Close-equivalent
 |                                       |
 | DATE                                  |
 | [ Sat 14 Mar 2026           v ]       |  system compact date picker, from tomorrow
 | YOUR WORDS                            |
 | [ Nursery starts                    ] |  TextField, 1 to 80, writing tools off
 | 15 of 80                              |  NOT shown (no counters); see below
 |                                       |
 | [Show my words in the notification ( o)]  ToggleRow, off
 | HOW IT WILL LOOK                      |
 | +-----------------------------------+ |  NotificationPreview
 | | A day you wanted to remember      | |  (or the words, when on)
 | +-----------------------------------+ |
 |---------------------------------------|
 | [               Save               ]  |  Button primary lg, 56 pt
 +---------------------------------------+
```
- No character counter: a counter is a count shown while typing. The field accepts up to 80 graphemes and then stops taking input; a single line "80 letters at most" (intent) appears only when the limit is reached (`.tooLong`), announced politely. Card gap G-D13 (the card is silent).
- Save is disabled with a reason line until there are words ("Add a few words to save." intent).
- The date picker offers tomorrow onward (gap G-D10 on today).
- `.notAllowed`: the line "Notifications are off. This day is saved and will be sent once they are allowed." (intent) above Save; Save still works.
- AX5: full height; fields stack; the toggle stacks label over switch; Save pinned.
- VoiceOver: title, date (picker), words field "Your words", toggle, preview as one element, Save. The field's hint: "Shows in the app on that day."
- Integration: NS-18-R1, R3, R5, R8; D2 (writing tools off; engineering gap E-D06); BL-982; flag `EXPO_PUBLIC_TYPED_DAYS`; writes `typedDay.<date>` and `typedDay.showWords` (PROPOSED shape; the switch is per phone in the card, see G-D14); module `lib/reminders/typed-days.ts`, settings screen.

### D-S09 A typed day: detail and Delete

A ConfirmSheet-shaped sheet: the date (headline), the words (body, serif not used: these are not a letter), the show-words state as text, then "Delete this day" (destructive, quiet) and "Keep it" (primary, default). Editing is Delete then Add (no edit in the card). Integration: NS-18 section 5 "Deleting the day"; `ConfirmSheet`.

### D-S10 Lock screen and Notification Centre

See section 5 for the class registry and the rendering matrix. Design reviews only our content: title, body and the per-category hidden-preview placeholder (NS-32 section 15).

### D-S11 Notification landing

- `.evening`: Home (A-S01) with its current prompt; no extra line; the app does not know which variant was tapped (data is `{ source, kind }` only).
- `.typedDay`: Home with one line above the prompt: the parent's typed words, in `callout` sans, `textMuted`, no quotes added, preceded by nothing (the date is today). It shows on that local day whenever Home opens (not only after the tap), and leaves with the words the day after (NS-18-R7). New feature component `TypedDayLine` (section 6). It is not a Home slip and does not take the slip's place (gap G-D15 for the FRAME-SLIP registry).
- `.monthAge`, `.birthday`: the Book (B-S01) at its current position (as built).
- `.plan`: Settings, Plan (E-S11), where the plan note waits (as built `openPlan`).
- `.appLock`: App lock first; then the landing.
- AX5: the typed-day line wraps; it never truncates.
- VoiceOver: on landing, focus goes to the screen's first element as usual; on Home with a typed day, the line is read before the prompt.
- Integration: NS-13-R9, NS-18-R1, NS-35-R3, R4; built router `scheduler.ts:253-261` (evening to `/`, else `/book`) needs `typedDay` to `/` (engineering gap E-D04).

### D-S12 Me, the book's page: "Write this book together"

A `ListRow` on the book's page in Me (C-S15), in its own section after the book's details. Built key `bookRow.label`. Value text: none (one parent), "Invited" (open invite), the co-parent's sign-off (two parents). `.absent` in every store build before NS-25's gates, with servers off, and outside the D-162 door rule: the row is not rendered and the section closes up. Never "coming soon" (the built `soon.*` keys are not drawn; `settingsRowHelp` must not render).
Integration: NS-25-R1, R12; BL-983; door rule `visibleCoParentDoors(coParent, alpha)`; `serverFeaturesEnabled()`; reads `child_members`, invite list; module `app/settings/children/[id].tsx`, `lib/family/surfaces.ts`.

### D-S13 Invite sheet

```
 +---------------------------------------+
 | Invite Asha's co-parent               |  title2
 | They can write to Asha and read the   |  body
 | whole book, from their own phone.     |
 |                                       |
 | They will be able to read every letter|  callout, text (not muted): the R16 line
 | in this book that is not private,     |
 | including the ones already there.     |
 |                                       |
 | WHAT DOES ASHA CALL THEM?  (optional) |
 | [ Mama, Papa, Amma, Baba            ] |  TextField, 30 max
 | It signs their letters.               |
 | This invite is for Asha's book only.  |  footnote
 | The link works once, for 7 days. You  |  footnote
 | can cancel it any time.               |
 |---------------------------------------|
 | [        Share invite link         ]  |  Button secondary lg
 | [             Not now              ]  |  Button secondary lg (equal)
 +---------------------------------------+
```
- The R16 line is new against the build (built `create.body` says "read the whole book" but not private letters or earlier ones). It sits above the field so it is read before the action, at full text contrast.
- Equal buttons (NS-25 section 6 AX5 row: "stack buttons at equal size"), stacked at every size.
- `.loading`: "Getting the link ready" replaces the button label; the button keeps its size; VoiceOver announces it.
- `.full`: in place of the buttons, "{child}'s book has two parents." and Close.
- `.paused-invites`, `.offline`, errors: one line above the buttons with `WarningCircle`; Try again where the error is not final.
- `.signedout`: the first step is sign-in (as built: trigger `invite_create`).
- AX5: full height; all text wraps; buttons full width, stacked, equal.
- VoiceOver: title, body, the scope line, the field, its help, the two footnotes, Share invite link, Not now.
- Integration: NS-25-R16, R18, section 12 Invite door line (Records: invite created); BL-983 (BL-882 to BL-889 first); kill switch `killSwitches.invites`; error codes SCINV (retry_new_invite), SCCAP (book_full), SCCON (consent_needed, family_share_consent), SCKIL (paused), network, rate_limited, not_parent, unknown; writes `child_invites` (hashed token) via `create_child_invite`; module `app/invite/new.tsx`, `lib/family/invites.ts`.

### D-S14 Invite link page (web)

The built static page `/j` (no server, no analytics, the token in the fragment). Design changes: one App Store link line for an iPhone without the app (card section 4 step 3), styled as the page's existing link; no child or inviter name (R6). `.otherDevice`: "On a computer? Open this link on the iPhone that has {app}." (built) plus "The app is for iPhone for now." (intent; card section 5). `.missingToken`, `.copied`, `.copyFailed`, `.noScript` as built. It cannot show "expired" (gap G-D12). Integration: NS-25-R6; `apps/web/src/app/j/page.tsx`, `site.invite`.

### D-S15 Join ask: peek

```
 +---------------------------------------+
 | Join this book as a parent?           |  title2
 | Invited by Mama                       |  headline, the inviter's sign-off only
 | Parent                                |  footnote, the role
 |                                       |
 | You will both read every letter in    |  body
 | the book. Join only if you know who   |
 | sent you this link.                   |
 |---------------------------------------|
 | [         Join the book            ]  |  secondary lg
 | [            Not now               ]  |  secondary lg (equal)
 +---------------------------------------+
```
- No child name, no cover, no letter before agreement (R2; `peek_invite`).
- `.signedout`: "You were invited to a book" with Sign in and Not now (built).
- `.loading`: "Opening the invite" with the system activity indicator (no count).
- Error states replace the body with one line and offer "Paste another link" or Close; final errors drop the token (as built `FINAL_INVITE_ERRORS`). `.error-already_member` offers Open the book.
- Integration: NS-25-R2, R5, R9, R11, R18; BL-983; kill switch `killSwitches.invites`; error codes SCINV (expired, used, revoked, already_member, not_found), SCCAP, SCKIL, SCCON, PGRST301 or 303 (signed_out), network; module `app/invite/index.tsx`, `lib/family/join-flow.logic.ts`.

### D-S16 Accept: the agreement

The PRIV-R21 door (NS-25 section 12 Accept): the shared-book agreement as `AgreementRow` lines with versioned links (Terms, Privacy Policy, Consumer Health Data Privacy Policy), then "Agree and join" and "Not now", equal. Records one `policy_acceptances` row (`invite_accept`). Decline: nothing joins; the inviter is not told. `.loading`: "Joining the book". `.offline`: one line, Try again; nothing half-joins (R10). Whether this is a separate step or folded into D-S15's Join is a card gap (G-D16): the built join goes straight from peek to accept after general consent; the card's happy path step 5 reads the agreement first. Default: a separate D-S16 step when the server sends SCCON `family-share`, else the general consent already holds and D-S15's Join is the agreement (built behaviour). Integration: NS-25-R17; `components/ui/agreement-row.tsx`.

### D-S17 Joined: arrival

As built: the book cover appears for the first time with the child's name, the flyleaf line ("Your letters and Mama's sit side by side, each signed."), "{child}'s book is on its way to this phone." with a thin bar and no count; then "What does {child} call you?" (prefilled) and "Open the book". `.notYet` adds Try again. `.twobooks`: the switcher on Home and the Book now lists both (NS-14). Integration: NS-25-R8, section 8 latency; BL-983.

### D-S18 Family page

Built `/family` page ("Who writes to {child}"): member rows as signatures, pending invites with Share again and Cancel invite. Added for NS-25:
- `.twoParents-undoable`: under the co-parent's row, "Joined {date}. You can undo this until {weekday}, {time}." (footnote) and an "Undo join" button (`Button outline sm`, 44 pt). Only for the inviter, only inside 72 hours.
- `.twoParents`: no control and no line (R13).
- `.left`: the built neutral note, once.
- No "Leave" row (D-113).
- Integration: NS-25-R4, R13; `undo_parent_join`; BL-983.

### D-S19 Undo join confirm

`ConfirmSheet`: title "Undo the join?" (intent), body "Their letters leave this book and stay theirs. Their phone stops receiving this book.", safe default "Keep them in the book" (primary), destructive quiet "Undo join". Records `member_join_undone` and a PRIV-R21 row (card door line). `.error-SCPAR`: "This can no longer be undone here." (intent) with Close. Integration: NS-25-R4, R13; error SCPAR.

### D-S20 The other parent's phone after an undo

One neutral `AppNote` line at the top of the Book for that book, shown once, then gone: "This book is no longer shared with you. Your own letters stay yours." (intent). No reason, no name of who undid it. P2's own letters stay in their own list as private letters. Gap G-D17: the card states the behaviour but not what P2 reads.

### D-S21 Home: Not much today

Built (`components/tonight/quiet-day-inline.tsx`): the quiet link in the capture cluster (`Button quiet`, 44 pt); on tap, the link fades and the line "A quiet day, kept." with "Undo" (44 pt) takes its place, in `subhead` `textMuted`, status colour rules for lit paper (atmosphere `onLitPaper.status` lower 30 percent). `.error-save`: the standard save error line in place; Home stays. AX5: the line and Undo wrap onto two lines, Undo stays visible and 44 pt. VoiceOver: hint "Marks today without writing anything."; the kept line is announced. Reduce Motion: the fade is Reduce Motion's fade. Integration: NS-07-C5-1, C5-5, C5-6, C5-13; BL-974; no flag; no pause (capture has no switch).

### D-S22 Book: the quiet-day row

Built `QuietDayRow`: "A quiet day" with the date, unsigned, `AppNote` styling. Consecutive days are separate rows with normal spacing, no connector, no group heading (C5-9). Hidden on a day with words (C5-11). Never on the other parent's phone (C5-8). VoiceOver: "{date}. A quiet day, kept." (`book.quietDay.a11y`). Integration: C5-8 to C5-11; BL-974 (display dedupe).

### D-S23 Pilot artefacts

Not app screens. The prototype shows each NS-03 section 7 and 15 text as a message bubble in a neutral messaging frame, labelled "Message (not in the app)". `{app}` stays a placeholder. No letter, picture or name appears in any bubble.

### D-S24 Me, Plan: the plan date when notifications are not allowed

Built line `billing.plan.notificationsOff` with "Allow notifications" on Settings, Plan (E-S11). Area D adds nothing; the line is listed so NS-32-R4's "Settings, Plan shows the date" has a screen.

## 4a. Material layer per screen (design system v2, `docs/design/system/BRIEF.md` section 3)

Applied after the coordinator's course correction of 20 Nov. Component and token names follow `docs/design/system/COMPONENTS.md`, `FOUNDATIONS.md`, `tokens.v2.json` and `MOTION.md` once they appear; section 12 records the renames.

| Screen | Glass layer (Liquid Glass, regular) | Content layer (never glass) | Notes |
|---|---|---|---|
| D-S01 | the letter page's header Back and "Aa" buttons (B's) | the Share button: it sits in the letter page body, so it is a solid content button, not glass | Content flow controls stay solid |
| D-S02 | the sheet itself | the preview card (paper `surfaceRaised`, 1 pt `line`), the static row, the lines; Continue and Not now are solid `secondary` buttons | No glass on glass: buttons inside a glass sheet are solid. Full height (AX5, long letter) the sheet turns more opaque, as iOS does |
| D-S03 | system share sheet | none | System hand-off; we draw nothing |
| D-S04 | the sheet | its body; the two answers are solid | Half-height sheet inset from the edges |
| D-S05, D-S07 | system | | |
| D-S06 | the navigation bar and its Back button | the grouped settings list, the preview card, chips, toggles at rest | Toggles take glass only while being dragged (system behaviour) |
| D-S08, D-S09 | the sheet | fields, preview, Save (solid primary) | |
| D-S10 | system rendering | | We never draw iOS chrome in the app |
| D-S11 | Home's capture cluster and tab bar (A's) | `TypedDayLine` and the prompt | |
| D-S12, D-S18 | navigation bar | lists, member rows, Undo join button (solid outline) | |
| D-S13, D-S15, D-S16, D-S17, D-S19 | the sheet | everything inside it, buttons solid | |
| D-S14 | none (web page) | page | |
| D-S20 | none | the line is content (an `AppNote` in the Book) | |
| D-S21 | the capture cluster around it (A's) | the kept line and Undo are inline content on Home, not the undo toast | The quiet-day line has no timer and is not a toast |
| D-S22 | none | Book row | |
| D-S04 results, D-S19 result ("Join undone.") | the undo toast (glass) | | T4 applies to any toast with an action |

Reduce Transparency, or iOS before 26: every glass surface above becomes the solid token surface (`surfaceRaised`) with a hairline (`line`), same shape and size. Increase Contrast: hairlines and labels step to the `highContrast` tokens. At most three glass surfaces are visible at once on every screen in this area (the most is D-S02 over the letter page: the sheet, plus the page's header buttons dimmed behind the scrim).

## 5. Notifications: classes and lock-screen rendering

### 5.1 The registry (NS-32), as design sees it

| Class | Group | Priority | Fires | Title and body (default, names off) | Named variant | Tap lands | Category placeholder slot (PROPOSED key) |
|---|---|---|---|---|---|---|---|
| `plan` | plan (4 slots, outside the budget) | first, never dropped | inside its legal window, 10:00 local when possible, never in quiet hours | title "Plus"; body e.g. "Plus is free until {date}, then it renews unless you cancel. You can change this in Settings, Plan." (built) | none: never a child name, a count or a price | Settings, Plan (E-S11) | `billing.reminders.placeholder` |
| `typedDay` | reminders (60) | 1 | the typed date, at the reminder time | fixed line, intent "A day you wanted to remember" | with "Show my words" on: the body is the words unchanged | Home with the words (D-S11.typedDay) | `reminderCopy.placeholders.typedDay` |
| `birthday` (and `birthdays`) | reminders | 2 | the birthday at 09:00 | "A birthday today" / "A year of letters. Want to read them together today?" (built) | names the child | Book | `reminderCopy.placeholders.birthday` |
| `monthAge` (and `together`) | reminders | 3 | the month-day at the reminder time, days 0 to 35 only | "Month {month} begins" / "A new month in the book is open." (built) | names the child | Book | `reminderCopy.placeholders.monthAge` |
| `evening` | reminders | 4 | chosen weekdays at the chosen time; days 1 to 7; then one per block to day 35; then none | the 8 neutral variants (built), rotated | named variants | Home (D-S11.evening) | `reminderCopy.placeholders.evening` |

Not drawn: `occasion` (removed with NS-31), NS-26 co-parent push (parked; no class), any seal-opening notification (NS-06-B4 forbids it), any notification for Share, Save a copy, Find, quiet days or past letters (their cards forbid it).

Every class: interruption level `active`; no sound beyond the iOS default for a silent banner (the card says "quiet, silent"; the built content sets no sound); thread per class so iOS groups by class; `data` is `{ source, kind }` only.

### 5.2 What the lock screen shows

iOS draws the frame. The rows below are what our content makes it show. "App" is the app's display name from `packages/brand` (drawn as `{app}` in docs).

| Setting on the phone | Our state | Lock screen (phone locked) | Notification Centre (unlocked) |
|---|---|---|---|
| Show Previews: Always | names off (default) | App, title, neutral body | same |
| Show Previews: Always | names on | App, title, body with the child's name | same |
| Show Previews: Always | names on, App lock on | names forced off: neutral title and body | same |
| Show Previews: When Unlocked (default iOS) | any | App, and our category placeholder in place of title and body (R33; NS-32-R13). With no placeholder set (today), iOS shows its generic "Notification" | full title and body once unlocked |
| Show Previews: Never | any | App and the placeholder | App and the placeholder, even unlocked |
| typedDay, Always | words switch off (default) | App, the fixed line | same |
| typedDay, Always | words switch on | App, the parent's words unchanged | same |
| typedDay, When Unlocked or Never | words switch on | App and the placeholder (the words never show while locked) | words once unlocked (When Unlocked) |
| plan, any | n/a | App, "Plus", the plan line with a date and no price; placeholder when previews are hidden | same |
| Deliver Quietly or Provisional | any | nothing on the lock screen | Notification Centre only; D-S06 says so |
| A Focus is on | any | held by the Focus (no class is time-sensitive) | in Notification Centre |
| Scheduled Summary on | any | collected into the summary at its time | in the summary |
| Apple Intelligence notification summaries on | any | iOS may summarise our title and body in its own words; this is outside our control and the per-app toggle is the parent's (UNVERIFIED whether an app can opt out). See Card gaps G-D18 for typed-day words | same |

Placeholder words are `WORDS.md`'s. Design rules for them: one short neutral sentence per category, no child name, no brand name (the app name already shows), no count, no "since", no "missed", and the same calm register as the bodies (NS-32 section 16).

The prototype draws each row (lock screen frame, previews shown and hidden, named and neutral, words on and off).

### 5.3 One day, at most two

On any local day: at most one budgeted notification (typed day, birthday, month note or evening, by priority) plus any plan notice due (NS-32 section 3). Example drawn in the prototype: 14 March, a typed day at 20:30 and a trial notice at 10:00.

## 6. Components

Existing, reused: `Sheet` (with `footer`, `hideClose`), `Button` (secondary lg for every equal pair), `ListSection`, `ListRow`, `ToggleRow`, `ChoiceGroup`, `ChipGroup` and `Chip`, `Card`, `AppNote`, `QuietDayRow`, `Toast`, `ConfirmSheet`, `TextField`, `AgreementRow`, `MemberRow`, `InviteCard`, `JoinAsk`, `JoinWait`, `NotificationPreview` (local to Settings today), system time and date pickers, the iOS share sheet.

Proposed:
1. **Promote `NotificationPreview` to `components/ui`** (not new; the code comment already proposes it). Used by D-S06 and D-S08. Spec in `COMPONENTS.md` 2.x: a flat card, headline title and subhead body, both wrap at AX5, one VoiceOver element "{label}. {title}. {body}", never a picture of iOS chrome.
2. **`TypedDayLine`** (new, feature component in `components/tonight`). The parent's typed words above Home's prompt on their day. Why new: no existing component shows the parent's own short note on Home; `AppNote` is for the app's words and `prompt` is the app's question. Spec: `callout` sans, `textMuted`, no quotes or prefix added, wraps without limit, read before the prompt, no motion beyond the prompt's own entrance, not a slip.
3. **`ListRow` static form** (a change in `components/ui`, owned by `design-systems`): when a row has no `onPress`, it has no button role and no chevron, and Switch Control does not stop on it. Needed for "The words always go" (NS-05-R4b). Today `accessibilityRole` defaults to `button`.
4. **`StaticCheckRow`** is NOT proposed: the static `ListRow` with a leading check glyph covers it.

No new token. Every colour, size and duration is an existing token (section 4).

## 7. Integration map (summary)

| Screen | Card rows | Backlog | Flag | Kill switch or pause | Error codes | Data read | Data written | Module |
|---|---|---|---|---|---|---|---|---|
| D-S01 | NS-05-R1, R7, R25, R26, R27 | BL-939 (after BL-937, BL-961) | `EXPO_PUBLIC_SHARE_LETTER` | none (card section 9) | none | entry author, kind, words, seal via `isVisibleTo` | none | `app/letter/[id].tsx`, `lib/letter/rows.logic.ts` |
| D-S02, D-S03 | NS-05-R2 to R24 | BL-939 | same | none | `share_temp_write_failed` | `final_text`, `occurred_on`, `occurred_precision`, `edit_level`, signature, `entry_media` | `tmp/share/letter-photo.jpg` (deleted at completion or launch) | `lib/share/*`, `components/share/share-preview.tsx` |
| D-S04, D-S05 | NS-13-R31, door lines | BL-943, BL-965 (words) | none | none | none | prefs, active child name | `reminders.*`, `reminders.onSince` | `components/asks/reminder-prime-ask.tsx` |
| D-S06, D-S07 | NS-13-R1 to R33, NS-32-R1 to R16 | BL-966, BL-967, BL-943 | none | none (`killSwitches.reminders` not added) | `ScheduleResult` failure | prefs, permission, plan | prefs | `app/settings/reminders.tsx`, `lib/reminders/*` |
| D-S08, D-S09 | NS-18-R1 to R8 | BL-982 | `EXPO_PUBLIC_TYPED_DAYS` | none | `ScheduleResult` failure | `typedDay.*` | `typedDay.<date>`, `typedDay.showWords` | `lib/reminders/typed-days.ts` |
| D-S10, D-S11 | NS-32, NS-13-R6a, R6b, R9, R20, R33, NS-18-R3, NS-35-R3, R4 | BL-966, BL-943, BL-982 | none | none | none | `{ source, kind }` | none | `lib/reminders/scheduler.ts`, `lib/billing/plan-reminders.ts` |
| D-S12 to D-S20 | NS-25-R1 to R19 | BL-983 (BL-882 to BL-889, PR #767, #827) | D-162 door rule; `serverFeaturesEnabled()` | `killSwitches.invites`, `killSwitches.sync` | SCINV, SCCAP, SCPAR, SCKIL, SCCON, SCCID, SCLPG (Leave hidden), network, signed_out | `peek_invite`, `child_members`, invite list | `child_invites`, `child_members`, `policy_acceptances`, membership audit | `app/invite/*`, `app/family.tsx`, `lib/family/*` |
| D-S21, D-S22 | NS-07-C5-1 to C5-13 | BL-974 | none | none (capture has no switch) | standard save error | entries of kind `not_much` | one `entries` row, `in_book = false` | `components/tonight/quiet-day-inline.tsx`, `components/book/quiet-day.logic.ts` |
| D-S23 | NS-03-R1 to R9 (process) | BL-935 | none | none | none | none | none | none |
| D-S24 | NS-32-R4 | BL-966 | none | none | none | plan state, permission | none | `app/settings/plus.tsx` |

## 8. Cross-area hand-offs

- A (Home, A-S01): D-S11.typedDay (`TypedDayLine` above the prompt) and D-S21 live on A's screen; A-S13 hands to D-S04 after the first kept letter.
- B (letter page B-S08, Book B-S01): D-S01 sits in B-S08's order (Share between Play and the "This letter" list); D-S22 is a row in B-S01.
- C (Me C-S01, book page C-S15, sign-out C-S03, export C-S04): Reminders row in Me opens D-S06; C-S15 holds D-S12 and "Include {child} in my reminders"; C-S03 sign-out removes reminders (no line); the pilot's export is C-S04.
- E (Plan E-S11, App lock E-S22, sign-in E-S04 to E-S07, low storage E-S17): D-S24 is a line on E-S11; notification taps pass E-S22; P2's sign-in is E's.

## 9. Superseded history (card wins)

| Spec | What it said | Card | Now |
|---|---|---|---|
| 03-SHARE section 3.2 | On cancel in the share sheet, the preview stays open | NS-05-R3b (the result is never read) | The preview closes on any completion |
| 03-SHARE section 6 | At AX5 the buttons are inline after the preview, not pinned | NS-05-R13b, section 5 "very long letter" | Pinned in the footer at every size |
| 03-SHARE SH-R11 | The picture's file name is the letter's date | NS-05-R6a | `letter-photo.jpg` |
| 03-SHARE section 4 "Error: file could not be made, Try again" | ErrorLine with Try again | NS-05 section 5 | Falls back to words only; one line; no Try again needed |
| 03-SHARE section 4 "A letter that is Private: Shown line states Private" | an extra line | NS-05 section 4 lists no such line | Not drawn (gap G-D02) |
| 03-SHARE `SharePreview` NEW component | a new component | NS-05 section 15 "no new component" | composite of existing parts |
| 07-COPARENT-COMING-SOON | a "coming soon" screen and row | NS-25-R1, D-161 | No surface at all |
| NOTIFICATIONS.md section 2 (ask with sleep bands, setup screen) | a richer ask | NS-13 section 4 and door lines | The built card with two equal answers |

## 10. Card gaps

| Id | Card row | What is missing or conflicting | Proposed default |
|---|---|---|---|
| G-D01 | NS-05 section 4 step 7 | Does the preview close when Continue hands off, or after the share sheet completes? | Close when the share sheet is presented; the letter page is what remains |
| G-D02 | NS-05 section 5 "own private letter" | Spec 03 wanted a line saying the letter was private; the card shows the same preview | No extra line; the where-it-goes line is enough |
| G-D03 | NS-05 section 5 `share_temp_write_failed` | Whether the sheet opens at once with words only or waits for a second Continue | Stay on the preview, show the line, turn the toggle off; the next Continue sends words only (the parent sees the change before anything leaves) |
| G-D04 | NS-13 section 12 "two equal choices" vs the built three-answer card | Conflict | Two equal answers; "Change the time" is a control, not an answer |
| G-D05 | NS-13-R31 | Does a second account on the same phone get its own two showings? | Yes: the cap is per account on this phone (settings are cleared at sign-out, R14) |
| G-D06 | NS-13 section 15 "back-off invisible" vs D-S06's Next line | After day 35 there is no next reminder; the built line would say "Next:" with nothing or a far date | Hide the Next line when nothing of these classes is pending |
| G-D07 | NS-13-R14 | Should the sign-out sheet (C-S03) say reminders stop? | No line: D1 fixes the sheet's words; reminders are a setting that simply clears |
| G-D08 | NS-13-R13 | Where B's ask card can appear after B's first letter on A's phone | As G-D05 |
| G-D09 | NS-18 section 4 step 2 "at the reminder time" | The time when reminders are off, or never set | The stored time, default 20:30 |
| G-D10 | NS-18 section 5 "a day in the past" | Is today accepted? | No: tomorrow onward, so a day is never added after its delivery time has passed |
| G-D11 | NS-18 section 5 "reminders turned off" | What the parent sees when notifications are not allowed | Save works; one line says it will be sent once allowed |
| G-D12 | NS-25 section 5 "invite expired" | The link page has no server and cannot know expiry | Expiry is shown in the app at peek (D-S15.error-expired) |
| G-D13 | NS-18-R5 | How the 80-character limit is shown without a counter | A line only when the limit is reached |
| G-D14 | NS-18 section 10 `typedDay.showWords` | One switch for all days, or per day? The happy path reads per day | Per day (each day's sheet has its own switch); the key becomes `typedDay.<date>.showWords` |
| G-D15 | NS-18 section 4 step 3, frame section 4 | Is the typed-day line on Home a slip? | Not a slip: a line attached to the prompt, registered in `[FRAME-SLIP]` as "not a slip" like the Plus line |
| G-D16 | NS-25 section 4 step 5 | Separate agreement step vs the built peek-then-join | Separate only when the family-share consent is required; else Join is the agreement |
| G-D17 | NS-25-R4 | What P2 reads after an undo | One neutral line once (D-S20) |
| G-D18 | NS-18-R3, D3 | iOS notification summaries may restate typed words in machine words on the lock screen | Keep words hidden by default; the switch's help says the words show as typed in the notification (no claim about summaries); counsel and CAIO to read |
| G-D19 | NS-32 section 16 | The intent "A note for tonight" uses "note", which the glossary reserves; and one placeholder per category | `WORDS.md` writes one per category without "note" |
| G-D20 | NS-13 section 4 step 3 "quiet, silent notification" | Whether "silent" means no sound | No sound set by us; iOS settings decide |

## 11. Engineering gaps

| Id | Gap | Belongs to |
|---|---|---|
| E-D01 | The planner never reads `Child.quiet` (`plannerChildren()` maps only `remindersOn`), a P0 gap for NS-13-R12, NS-32-R14, J-N19 (B-mobile-client 2.6 item 3) | BL-966 |
| E-D02 | No category sets `hiddenPreviewsBodyPlaceholder` today; whether expo-notifications can set it is unverified (NS-13-R33) | BL-987 (mobile line), then BL-966 |
| E-D03 | Notifications have no per-class thread or category id today | BL-966 |
| E-D04 | The tap router sends every non-evening kind to `/book`; `typedDay` must land on Home with the line | BL-982 |
| E-D05 | The ask card's layout change (two equal answers) and its words | BL-943 with BL-965 |
| E-D06 | React Native `TextInput` has no writing-tools prop; the typed-day field needs the `scribe-system` native switch (D2) | BL-962 |
| E-D07 | The 72-hour undo has a server function (`undo_parent_join`) but no app control | BL-983 |
| E-D08 | The platform plan proposes a kill switch for every surface (ADR 0029); NS-05 section 9 says Share has none (an export path). Card wins; the ADR must list Share as an exception | ADR 0029 (C-platform), BL-939 |
| E-D09 | The invite sheet's R16 scope line does not exist in `familyCopy.create` | BL-983 with BL-965 |
| E-D10 | `ListRow` without `onPress` still has the button role | `design-systems` (components/ui), with BL-939 |
| E-D11 | The web link page has no App Store link and no "iPhone only for now" line | BL-983 (web) |
| E-D12 | Typed days need the `typedDay.<date>.showWords` shape if G-D14's default holds | BL-982 |
| E-D13 | `NotificationPreview` promotion to `components/ui` and its `COMPONENTS.md` spec | `design-systems` |
| E-D14 | Settings, Reminders has no "Days to remember" section, and the D-S06 `.off-withDays` rule needs the section visible with the switch off | BL-982 |
| E-D15 | The D-S20 line on P2's phone after an undo has no key or screen | BL-983 with BL-965 |

## 12. Reconciliation with MOTION.md and WORDS.md

Filled at the end of the run (section 12 below is updated in place).
