# Area D: Family, sharing and reminders. End-to-end design

Status: v2, 20 Nov 2026, reconciled to the final product pack (`22-final-holistic-spec.md`, cards NS-46 to NS-50 in `21-days-cultural-photos-home.md`, `19-from-download-to-first-letter.md`, `GAP-LOG.md` rulings including K1 to K17 and RV-1 to RV-17, `FUNCTION-TRACE.md` section 6.4, the ten NS-46..50 reviews; product head `cfeca754e`). Earlier: v1 reconciled with MOTION.md and WORDS.md, glass per the system v2 brief. Design lead, area D (`design-systems` lens). Docs only. Screen ids are stable: `MOTION.md` and `WORDS.md` in this folder key to them; new screens are appended, never renumbered. New in v2: D-S25 and D-S26, the states and sections marked "(v2)", sections 13 to 16 at the end.

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

### 0.1 Final-pack re-key (v2): what each earlier reference is now

Cards NS-05, NS-13, NS-18, NS-25, NS-32, NS-07 C5 and NS-03 keep their ids and rows. The final pack changes how this area reads them in the places below; everything else in this file stands. Where a ruling and a card differ, the order is the one in card 21: GAP-LOG rulings, then the founder direction, then the function reviews.

| Was keyed to | Now keyed to | What it changes for design |
|---|---|---|
| NS-32 section 3 priority list, NS-32-R3, R5 | typed day (the parent typed), birthday, `libraryDay`, `monthAge`, `evening` (DL-2, NS-46-R7, R29); `libraryDay` is a ranked source inside the `typedDay` group, not a class (N-2) | Section 5.1; D-S10 gains `libraryDay` states, no new registry row |
| NS-32-R4b "up to 64 total" | 60 pending in total, plan notices kept first within it (errata E13; NS-46-R9) | Section 5.3 |
| NS-32-R12, R13 | plus the library-day neutral title and one neutral body per tone, one names rule per layer (NS-47-R12, R13, R36, R38; NS-46-R36, R37) | Sections 5.2, 5.4 |
| NS-18-R3 (each typed day's words on the lock screen) | all day words, typed or ticked, follow one switch `notifications.dayNames` (NS-47-R37, RV-8; the NS-18-R3 errata row waits for Karma) | D-S08, D-S09, section 5.4. Conflicts with the G-D14 per-day switch ruling: flagged in section 15 |
| NS-13-R6a, R33 names switch | `notifications.lockScreenNames` covers the child's name only (NS-47-R14) | D-S06 help line |
| NS-13 section 3a "35 days" | NS-13's own policy, not an iOS rule (RV-4) | Words only |
| NS-13-R18, R19, R27 (anchor, back-off) | hard prerequisites of the catalogue's recency axis (NS-48 section 22) | Section 5.5 recency artefacts are drawn but flagged "after the anchor" |
| D-S06 section "Days to remember" | moves to the one Days page C-S24 (NS-46-R3, NS-47-R14, R-IA-2). Before tree test T1 Reminders carries one row "Days" that opens C-S24; after T1 it sits in the Me group "Days and reminders" (working title, RV-3) | D-S06 |
| D-S08, D-S09 (Add a day, a typed day) | drawn here, reused unchanged by C-S24 as the add and detail flows (NS-46 section 15) | D-S08 |
| D-S11 `libraryDay` (days review, FR-CUL-05) | not used: a day shows one way on Home, the day slip, however the parent arrives (RV-6, NS-50-R4). A typed day keeps its line in the prompt block and is not a slip | D-S11 |
| `NOTIFICATIONS.md`, `COPY_INVENTORY.md` evening list | NS-48 catalogue: `ntc.*` keys, 6 variants per grid cell, the built 8 as the floor (N-1, N-7) | D-S26, WORDS.md section 18 |
| "note" for what the app sends (WORDS G1, plan placeholder intent) | "reminder" in every parent-facing string; "note" is what a person makes (RV-3, BRAND glossary) | Words only; no screen change |
| First-run areas keyed to NS-38 to NS-45 (card 19) | NS-39-R2 (no permission prompt in first run), NS-41-R6 and O-5 (a second account sees no reminder of the first), NS-43 and NS-44 "Not in scope: reminders", NS-45 (sign-out, session ended elsewhere, Delete account) | J-D10 position, J-D18 |

## 1. Rules this area applies (from the frame and the brief)

1. Only Home starts a letter. Share is an output on the letter page; a notification tap is a doorway that lands on Home, the Book or Plan and never records (NS-35-R3, R4).
2. Family is never a tab. The other parent lives on pushed pages reached from Me; in a store build before NS-25's gates there is no surface and no "coming soon" line (NS-25-R1, D-161).
3. Nothing in this area counts, celebrates or nags: no share count, no "sent" toast (NS-05-R12, R22), no reminder that says it slowed or stopped (NS-13 section 15), no count of quiet days (NS-07-C5-3).
4. No child name and no letter words on a lock screen by default (frame guardrail; NS-13-R6a, R6b; NS-32-R12). Typed-day words are hidden by default (NS-18-R3).
5. Equal choices where something leaves the phone or a person agrees: Share preview (Continue, Not now), reminder ask (two equal answers), invite and accept sheets (equal stacked buttons at AX5).
6. Undo windows follow T4 (stated seconds, or VoiceOver read plus those seconds, or until the parent moves on under Switch Control). This area has two: the quiet-day line (no timer, C5-6) and the 72-hour join undo (a deadline, not a timer).
7. Accessibility to AX5 on an SE 3 (375 pt): one column, nothing truncated, every control 44 pt or more, primary actions 56 pt in the bottom third, Voice Control names equal visible labels, colour never the only signal.
8. Writing tools off on the typed-day field (D2). Nothing donated to Spotlight or Siri; a notification is not an `NSUserActivity` (D3).
9. Sign-out keeps the book on the phone (D1) and removes every reminder and typed day (NS-13-R14, NS-18-R6) and every ticked day with its delivered notifications (NS-47-R15). A session ended by the system clears the same way and Me, Days says so once (Q-FD-12).
10. (v2) Words: "reminder", never "note", for what the app sends; no exclamation mark in any notification (N-5, zero); no count, gap, "again", "another" or age norm in a reminder (NS-48-R4, R10, R30); a day reminder never says "last year" (NS-46-R22).
11. (v2) One way for a day on Home: the day slip (rank 2b); a typed day keeps its line in the prompt block (NS-50-R4, A W9). A quiet-tone day (NS-46-R16) replaces the prompt block with its quiet line (RV-7).
12. (v2) Optional means the word "Optional" beside the label, spoken as "{label}, optional"; a decline control has the same style and size as the accept control; nothing is preselected (NS-47-R30). A promise a parent reads before choosing is a static `DoorNote` (NS-47-R29).
13. (v2) Free stays free: no reminder, slip, landing line or plan notice for a day names Plus, a price, an allowance or the Keep step (NS-46-R27; plan notices name Plus and nothing else, NS-32-R12).

## 2. Journeys

Each journey lists the screens it walks. Every row of each card's "Unhappy paths" and "Scenario coverage" tables is placed in a journey or in a screen state (section 4); the coverage index in section 2.6 proves it.

### 2.1 Share one letter (NS-05 Level 1)

**J-D01 Share a kept letter, words only (happy path; J-N11).**
1. Book (B-S01), tap the parent's own kept letter: the letter page (B-S08) opens.
2. D-S01: the Share control "Share this letter" sits under the words and Play, above the "This letter" list (B-mobile-client 2.7; NS-21 order: dateline, words, Play, Share, list title, rows, Delete).
3. Tap Share: D-S02 opens within p95 300 ms (R23): title, the exact text that leaves (date line, words, signature line), the static row "The words always go", the version line, the where-it-goes line, then Continue and Not now, equal (R2).
4. Tap Continue (haptic `tap`): D-S03, the iOS share sheet, opens within 1 s (R11) with the text only.
5. The parent picks an app and a person and sends in that app.
6. The share sheet completes (sent, cancelled or failed alike). The preview closes with it onto the unchanged letter page (reconciled with MOTION.md G2). No toast, no haptic, no mark (R12, R22). The app never reads the result (R3b).

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
3a. Yes: the card closes; D-S05 (iOS permission) appears once. Allow: `.after-yes`, the toast "Reminders are on. Next: Tuesday at 8:30 PM." with Change (to D-S06). Don't Allow: `.after-yes-denied`, "Not sending yet." with Open Settings; no second ask from us (door line Never). iOS refuses the schedule: `.after-yes-failed` with Try again.
3b. No reminders: no iOS prompt; `.after-no`, the toast "You can turn reminders on in Me whenever you like." (Me explains, door line Decline). The card may show once more later (cap of 2 ever; R31).
4. The card has no Close and no swipe: one of the answers ends it (as built). It is not a Home slip (frame section 4).

**J-D11 A reminder at the chosen hour (J-N3).**
1. 8:30 PM on Tuesday: one notification of class `evening` arrives, silent banner, neutral words (D-S10.evening).
2. Tap: the app opens to Home within 2 s with Home's current prompt (D-S11.home; NS-13-R9). With App lock on, the lock cover first (E-S22).
3. One more tap on Speak starts a letter (A-S04). The tap on the notification never started recording (NS-35-R3).
4. A letter made today (kept, waiting at Keep or held) removes today's pending nudge at the next re-plan (R8). Tomorrow's nudge has different words (R2).

**J-D12 A week of silence: the plan steps back (J-N4).** No screen. The plan already on the phone holds days 1 to 7 on the cadence, then at most one nudge per 7-day block for days 8 to 35, then nothing (section 3a; R3, R4, R18). Nothing on any screen says reminders slowed or stopped; D-S06's "Next:" line simply shows the next planned date, or, after day 35, the line "Next: after your next letter." is NOT shown (it would describe the absence); the row shows no Next line at all (D-S06.backedOff). See Card gaps G-D06 for the Next line after day 35.

**J-D13 Change reminders in Me.**
1. Me (C-S01), Reminders row: D-S06.
2. With reminders on: How it will look (the real first planned notification, from the same selection function the planner uses, neutral unless names on; NS-48-R22, R39), Next line, How often (Weekly, A few times a week, Every evening), Which evenings (chips; hidden for Every evening), Time (system compact picker, 07:00 to 21:30 in 15-minute steps; D-S07), Month and birthday messages, Names in notifications (the child's name only, NS-47-R14), then, when level 2 pictures exist, one static line that the phone's own suggestion reminders are separate (D-S06.journalNote), then one row "Days" that opens the Days page C-S24 where typed days and ticked days live as one list (NS-46-R3). (v2: the typed-day list no longer sits on this page.)
3. Each change saves at once; the Next line cross-fades (none under Reduce Motion); VoiceOver hears "Saved. Next: ..." 600 ms after the last change (as built).
4. A time outside the window cannot be picked; a stored late time is clamped and the line "Late nights stay quiet." appears once (as built; R30).
5. App lock on: Names in notifications is off and disabled, with "Names stay hidden while App lock is on." (as built; NS-13 section 5).

**J-D14 Notifications not allowed, or revoked.** iOS says no (at the ask, or later in iOS Settings): D-S06.denied shows the card "Notifications are off" with one sentence and Open Settings, under the switch; nothing is scheduled (R16). No in-app nag anywhere else. Returning from iOS Settings with permission granted: the card collapses, the Next line appears, one toast says both (as built). Plan notices: Settings, Plan shows the plan date (D-S24; NS-32-R4).

**J-D15 iOS refuses the schedule.** D-S06.error-schedule_failed: "Could not set reminders just now." with Try again (as built). Try again re-plans; success announces the Next line.

**J-D16 Travel and clock changes (J-N5).** No screen. Floating calendar triggers fire at the chosen wall-clock hour in the new zone; never between 21:30 and 07:00 local; never two budgeted notifications on one local date (R7; NS-32-R6). A date skipped by crossing the date line: delivered once late or not at all (device row decides); never two. Daylight saving: the hour holds.

**J-D17 Two books, a quiet book, a due date (J-N19, J-N26).**
- Two books: at most one budgeted notification per local day across books (R19; NS-32-R1). Priority (v2): a day the parent typed, birthday, a ticked day (`libraryDay`), month, evening (DL-2, NS-46-R7). Two ticked days on one date: one reminder with the neutral title, both names after the tap (NS-46-R8). A birthday for one child and a month note for another on one date: one notification, the birthday copy (R28, NS-32-R1b).
- Two children's month notes on one date: one grouped note (as built, `together` copy).
- A quieted or hidden book, or "Include {child} in my reminders" off: no month or birthday note and no name for it (R12; NS-32-R14). Unquiet brings them back at the next re-plan. Engineering gap E-D01: the planner never reads `Child.quiet` today.
- A child with only a due date: evening nudges only; no due-date wording (R10).

**J-D18 Sign-out, deletion, second account, new phone.**
- Sign-out (C-S03): every scheduled and delivered reminder, typed day and ticked-day reminder is removed and dismissed at that moment; `reminders.*`, `notifications.lockScreenNames`, `notifications.dayNames`, `typedDay.*` and the days store are cleared (R14; NS-18-R6; NS-47-R15). A session the system ended clears the same way; the next time Me, Days opens, one calm line says the list was cleared when the session ended and they may choose days again (no count, no "you lost"; Q-FD-12, default pending founder). Card 19 NS-45-R3 is the trigger. The book stays (D1). C-S03's sheet carries no reminder line; the card does not ask for one (gap G-D07 proposes none).
- Account deletion and Erase everything: the same removal (R15).
- Account B signs in on A's phone: B starts with reminders off, no typed days and no ticked days, and is asked afresh; none of A's notifications is pending or shown (R13; NS-41-R6; NS-47-R15). The ask card follows its cap on this phone for B (gap G-D08).
- New phone: settings never sync; the ask follows the two-showing cap there (R22).

**J-D19 Past the free allowance (J-N22).** Same rules; no reminder names Plus, a price or the Keep step (R11). No screen change.

### 2.3 Typed days (NS-18)

**J-D20 Add a day.**
1. Me, Days (C-S24, reached from the row "Days" on Reminders or in Me), section "Days you added", row "Add a day" (v2: the flow is drawn here as D-S08 and reused by C-S24).
2. D-S08 opens: Date (system compact date picker; today only while its reminder time is ahead, G-D10), "Your words" field (1 to 80 graphemes, any script, writing tools off), a live preview (NotificationPreview) showing what the lock screen will show under the one day-names switch on C-S24 (the fixed line by default, the words when that switch is on and App lock is off), then Save and Cancel. v2: the per-day "Show my words" switch is replaced by a read-only line pointing at the one switch (RV-8, NS-47-R37); section 15 flags the G-D14 conflict and gives the fallback.
3. Save (under 300 ms): the sheet closes; the day appears in C-S24's "Days you added" as a row: the date, then the words under it (D-S06.typedDays-list is now that list on C-S24). VoiceOver reads "Saturday 14 March. Nursery starts."
4. On that day, at the reminder time (or 20:30 when reminders are off; gap G-D09), one notification of class `typedDay` arrives: by default the fixed line (D-S10.typedDay); with the day-names switch on and App lock off, the parent's words unchanged.
5. Tap: Home (D-S11.typedDay) shows the parent's words above the prompt ("Nursery starts"); one more tap starts speaking.
6. The day after delivery, the words are deleted and the row leaves the list (NS-18-R7). Nothing says so.

**J-D21 Typed-day edge cases.**
- A past date: the picker offers no date before tomorrow; today is not offered (gap G-D10).
- That day already has a reminder or month note: only the typed day is delivered (NS-18-R2).
- Reminders backed off or stopped: the typed day is still delivered (R4).
- Reminders switched off: typed days and ticked days still delivered if notifications are allowed (day-only gate, NS-46-R31; W-G7). With Reminders off, D-S06 keeps the row "Days" and adds one calm line that chosen days still send a reminder and where to stop them (NS-46-R35, compliance C-01; D-S06.daysRemindersOff, D-S25).
- Notifications not allowed: the section shows the denied card's sentence once; Add a day still works and saves (the parent may allow later). Gap G-D11.
- Delete: tap the row, D-S09 opens with the date and words and "Delete this day" (destructive) and "Keep it"; delete cancels its notification.
- More typed days than free slots: the nearest are scheduled first; others at a later re-plan (PROPOSED). No screen says so.
- Interrupted while typing: words kept in the field until Save. App killed: unsaved words lost; saved days scheduled.
- Words about a due date, or a name: allowed; hidden from the lock screen by default.
- Flag `EXPO_PUBLIC_TYPED_DAYS` off: the section is absent and typed-day notifications are cancelled.

### 2.4 One notification budget and every class on the lock screen (NS-32)

**J-D22 The lock screen walk (J-N24, J-N27).** For each class in section 5, with iOS Show Previews set to Always, When Unlocked (phone locked) and Never, with Names in notifications off and on, with App lock on, and with the typed-day words switch off and on: what the lock screen and Notification Centre show is exactly the matrix in section 5.2. A trial ending and a reminder on the same day: both arrive, the plan notice inside its window at 10:00, the reminder at the chosen hour (NS-32-R4; at most 2 on that day).

**J-D23 Focus, Scheduled Summary, quiet delivery.** No class is time-sensitive (R20; NS-32-R10): a Focus holds them; Scheduled Summary collects them. Deliver Quietly or Provisional: D-S06 shows "iPhone delivers these quietly, to Notification Center only." (as built).

### 2.4a Days we mark, the catalogue and the lock screen (NS-46, NS-47, NS-48, NS-50; v2)

The Days page, Browse and Day detail (C-S24, C-S25, C-S26) and Home's day slip (A-S01.dayToday, A-S01.daysAsk) are other areas' screens. This area owns what arrives on the lock screen, what the parent is shown before agreeing to it, where each switch lives, and the one-a-day budget. Each journey below names the screens of the other areas it passes through.

**J-D60 Tick a day and agree to its reminder (NS-46 happy path; R35, R31; compliance C-01; J-CUL-01).**
1. Home's Days ask slip (A-S01.daysAsk, rank 3b, once, capped at two showings) or Me, Days (C-S24) leads to Browse (C-S25).
2. C-S25 opens with nothing ticked. At the top, before any control that records a choice, two static `DoorNote` blocks in reading order (NS-47-R29): the privacy door line, then the reminder consent line (D-S25.beforeFirstTick): what a tick does (one reminder arrives that morning) and how to stop it (untick one, or Clear all). Never collapsed, never behind an info glyph, never glass.
3. First tick, notifications not yet asked (undetermined): the tick is kept and one sentence appears in the sheet naming the next step ("Your iPhone will ask to send reminders", intent; D-S25.firstTickAsk), then iOS asks once through the `next-ask` door (D-S05). Allow: nothing more is said. Don't Allow: the tick stays, one calm line shows (D-S25.denied reuses the D-S06.denied card), no second ask from us, ever (NS-46-R31; Q-FD-20).
4. Done, swipe down or Back: the same result, nothing lost (NS-46-R41). C-S24 lists each ticked day under "Days you chose" with its next date.
5. At 09:00 that day: one reminder, class `typedDay` group, source `libraryDay` (D-S10.libraryDay-neutral, or -public for an allowlisted seasonal day). Tap: Home within 2 s with the day slip in the slip slot (A-S01.dayToday), never from the payload (NS-46-R32).
6. Stop: unticking one day in one tap on Browse (or Remove, swipe action or a VoiceOver custom action on C-S24), or Clear all (an `explained` confirm sheet, F6). Pending reminders are cancelled and delivered ones dismissed at once (NS-47-R21).

**J-D61 Reminders are off, ticked days still come (RV-9; NS-46-R31, R35; Q-FD-21).** Switch "Reminders" off on D-S06: evening, month and birthday reminders stop; ticked days and typed days still send if notifications are allowed (a day-only gate beside `prefs.enabled`). So the opt-out is visible, D-S06.daysRemindersOff shows one calm line under the switch that chosen days still send a reminder and where to stop them, and C-S24 says the same in its own words (D-S25.remindersOffLine). There is no master "reminders and days" switch (compliance C-01 default).

**J-D62 Notifications not allowed, then a tick (NS-46 section 5, NS-46-R31).** Ticking still works. C-S24 and C-S25 show one line that nothing arrives until notifications are allowed in Settings, with no promise of delivery, by reusing the D-S06.denied card (one per screen, F2). The Days ask slip is not shown when permission is denied (NS-47-R19). The day still shows on Home as the day slip when the app is opened that day (NS-50-R2).

**J-D63 One date, several things (NS-46 section 5; NS-46-R7 to R9, R30).** On one local date at most one budgeted reminder is delivered. A day the parent typed beats everything; a birthday beats a ticked day; a ticked day beats a month reminder and an evening reminder; two ticked days make one reminder with the neutral title and both names after the tap (D-S10.twoDays); three or more are joined by the English list format, the lock title unchanged. A plan notice on the same date is also delivered, inside its window, never merged (D-S10.oneDay, section 5.3). Nothing on any screen says a day yielded: the Days list keeps the day, the Next line shows what will arrive, and Home shows no day slip on a birthday date (NS-50 section 5).

**J-D64 A quiet-tone day (Memorial Day, Veterans Day, Good Friday, Yom Kippur; NS-46-R16, R37; NS-50-R15).** Never pre-ticked. Lock screen: the one neutral title and the quiet neutral body ("The book is open if you want it."), no question mark, no invitation to write (D-S10.libraryDay-quiet). Home: the day's name and the same line replace the prompt block; Speak and Type unchanged (A-S01.dayToday, quiet tone). This is separate from the Not much today mark of NS-07 C5 (J-D40), which is a letter-less mark the parent makes.

**J-D65 What a lock screen may say about a day (NS-47-R12, R13, R37, R38; NS-46-R36; RV-1, RV-8, RV-13).** One neutral title and one neutral body per tone for every family, tradition, culture-led and national day. A seasonal day on the hand-listed allowlist (`publicTitleOk`: seasons, New Year's Day, Thanksgiving, Independence Day, Labor Day) may be its own name in the title. The one day-names switch on C-S24 (default off, effective value `stored && !appLockOn`, forced off while App lock is on and not turned back on by itself) lets a family or tradition day, and any typed day's words, show. No lock-screen string in any switch state holds both a day name and a child name (D-S10.libraryDay-named; section 5.4).

**J-D66 A quiet or hidden book, or "Include in my reminders" off (NS-46-R25, NS-32-R14, errata E16).** No library reminder is scheduled for that book and it is never the subject; with every included book quiet or hidden no library reminder is sent; a member with `celebrations_paused` set gets none (R49). A paused family gets no day notes either: no day reminder and no day name on any lock screen (NS-46-R25; ruling 21). Engineering gap E-D01 (`Child.quiet` has no reader) blocks this.

**J-D67 A wrong date: the remote pause (NS-46-R28, R44; RV-10; Q-FD-15).** `killSwitches.libraryDays` true: at the next focus of each screen the Days library, Browse and the ask slip are absent (never under a finger, K-6); pending library reminders are cancelled at the next re-plan; typed days, evening reminders, reading and export are unaffected; the day slip is absent. In a servers-off build the pause is honoured only when remote config could be fetched, so `EXPO_PUBLIC_DAYS` stays off by default there.

**J-D68 The catalogue over a week (NS-48 happy path; R1 to R24).** Default settings, Tuesday and Saturday at 8:30 PM. After a spoken letter on Monday, Tuesday's reminder is a question that follows from the last letter's kind, a day later (a body only, never a title); Saturday has a lighter tone; a week later the words differ and none repeat. A reminder time before 17:00 never picks a line that names the evening, including the built eight (D-S26.dayPart). After day 35 with no letter, silence (NS-13-R4, NS-32-R8) and no line anywhere about it. The preview in Me, Reminders calls the same function, so what it shows is what arrives (NS-48-R22).

**J-D69 The lock-screen walk with previews hidden (J-N24, J-N27, J-CUL-01; NS-32-R13, NS-47-R36).** For each class, with iOS Show Previews on Always, When Unlocked and Never, names off and on, App lock off and on, the day-names switch off and on: the lock screen and Notification Centre show exactly the matrix in section 5.2. With previews hidden, iOS shows the app name and the category's neutral placeholder only, because no category sets `hiddenPreviewsShowTitle`. The device walk records what it observed, including on Apple Watch (UNVERIFIED).

**J-D70 A plan notice and a day reminder on one date (NS-32-R4, R4b; E13; NS-46-R9).** Both arrive: the day reminder at 09:00 and the plan notice inside its own window (10:00 when possible, never in quiet hours). They are never merged and iOS decides how they stack. With notifications not allowed, Settings, Plan shows the plan date (D-S24). The plan notice names Plus and nothing else of the plan: no price, allowance, Keep step or child name; the day reminder never names Plus (NS-46-R27).

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
| NS-46 sections 5 and 6 (v2), the rows that reach a notification | two days one date, birthday same date, typed day same date, plan notice same date, notifications not allowed, reminders off, Reduce Notifications or Focus or previews Never, App lock, time zone, unticking, quiet or hidden book, sign-out and Erase, bad data, no date | J-D60 to J-D67, J-D70; D-S10 `libraryDay-*`, `twoDays`; D-S25 |
| NS-47 sections 5 and 6, the rows that reach a lock screen, a switch or a consent line | day-name switch, App lock, one neutral string per tone, no day beside a child name, delivered notifications dismissed at sign-out, system-ended session, call-out first and static | J-D60, J-D65; D-S25; section 5.4 switch map |
| NS-48 sections 5 and 6 | day-part, two books names off, chosen day, tradition day names off, reminders off, quiet book, thin pool, preview equals planner, expecting-only lock screen, Apple's own journal notification | J-D68, J-D69; D-S26; D-S06.preview, .journalNote |
| NS-50 sections 5 and 6, the rows that reach a notification tap | a tap shows the day slip (one way), higher slip first, birthday yields, quiet-tone day, App lock first | D-S11; hand-off to A-S01.dayToday |

## 3. Screen and state inventory

State names below are the reconciled set shared with `WORDS.md` and `MOTION.md` (section 12). Every screen also has the shared suffixes where they apply: `.ax5`, `.vo`, `.dark`, `.hc`, `.offline`, `.lapsed`, `.signedout`, `.second-account`.

| Id | Screen or surface | Card | Base screen owner | States |
|---|---|---|---|---|
| D-S01 | Letter page: the Share control | NS-05 | B (B-S08) | `.default` (present), `.absent` (other parent, sealed, quiet, no words, not kept, flag off) |
| D-S02 | Share preview sheet | NS-05 | D | `.pictureOff` (first state when a stored copy exists), `.wordsOnly` (no stored copy: no toggle), `.pictureOn`, `.error-share_temp_write_failed`, `.versionFixes` (default version line), `.versionExact`, `.long`, `.rtl`, `.switcher` (blank snapshot) |
| D-S03 | iOS share sheet | NS-05 | system | `.text`, `.textAndPicture`, `.completed` (sent, cancelled or failed: identical) |
| D-S04 | Reminder ask (sheet over the Book) | NS-13 | D | `.default`, `.pickTime` (picker in place), `.after-yes`, `.after-yes-denied`, `.after-yes-failed`, `.after-no` |
| D-S05 | iOS notification permission alert | NS-13 | system | `.shown` |
| D-S06 | Me, Reminders | NS-13, NS-32, NS-46, NS-48, NS-49 | D | `.off`, `.on`, `.named`, `.appLock`, `.denied`, `.quietDelivery`, `.error-schedule_failed`, `.lateClamp`, `.noBirthDate`, `.backedOff` (no Next line), `.signedOut-after` (all defaults, nothing pending). v2 adds `.daysRow` (the one row "Days"), `.daysRemindersOff` (one calm line, Reminders off), `.journalNote` (static line, level 2 only), `.preview` (the Example element). The typed-day states `.typedDays-empty`, `.typedDays-list`, `.typedDays-remindersOff`, `.typedDays-flagOff` now belong to C-S24 and stay here as the list's design |
| D-S07 | Time picker (system compact, 07:00 to 21:30, 15-minute steps) | NS-13 | system | `.default` |
| D-S08 | Add a day sheet (also opened from C-S24) | NS-18, NS-46-R3, NS-47-R37 | D | `.default`, `.filled`, `.showWords` (v2: the preview with the day-names switch on; the sheet has no switch), `.dayNamesOff`, `.appLock` (words stay hidden, with the reason), `.error-typed_day_empty`, `.error-typed_day_past`, `.error-typed_day_too_long`, `.error-schedule_failed`, `.notAllowed`, `.interrupted` (words kept until Save) |
| D-S09 | A typed day: detail and Delete | NS-18 | D | `.default`, `.confirm` |
| D-S10 | Lock screen and Notification Centre | NS-32, NS-13, NS-18, NS-46, NS-47, NS-48 | system render | per class `evening`, `monthAge`, `together`, `birthday`, `typedDay`, `plan` (previews shown, defaults; the motion file writes them as D-S10.plan, D-S10.typedDay and so on); `<class>-hidden` (placeholder; `WORDS.md` groups these as `.hidden`); `evening-named`, `birthday-named`; `typedDay-words`; `oneDay` (plan notice plus one budgeted); `quiet`; `focus`. v2 adds `libraryDay-public`, `libraryDay-neutral`, `libraryDay-named`, `libraryDay-quiet`, `twoDays`, `libraryDay-hidden`, `birthday-neutral` (names off: the neutral title, G-D21 default), `appLock` (every title neutral, App lock on), `summary` |
| D-S11 | Notification landing | NS-13, NS-18, NS-35, NS-46-R32, NS-50 | A, B, E | `.home` (evening), `.typedDay` (Home with the words), `.book` (month, birthday), `.plan` (Settings, Plan), `.appLock` (lock first), `.whileCapturing` (stays put). v2: `.libraryDay` is NOT a state (RV-6): a library-day tap opens plain Home, which shows the day slip A-S01.dayToday; `.libraryDay-cleared` (store cleared or stale token: plain Home, no line, no message) |
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
| D-S25 (v2) | Day reminders: the consent line and the visible opt-out (sentences and rules owned here; drawn on C-S25, C-S24 and D-S06) | NS-46-R31, R35; NS-47-R29, R30; compliance C-01 | D (surfaces on C) | `.beforeFirstTick`, `.firstTickAsk`, `.denied`, `.remindersOffLine`, `.stopOne`, `.clearAll`, `.systemEnded` |
| D-S26 (v2) | Reminder catalogue specimens (design artefact, not an app screen): neutral and named renderings, hidden previews, the five mock reminders for the reading test | NS-48; FR-RSH-08 | D | `.grid`, `.dayPart`, `.recency`, `.kind`, `.named`, `.hidden`, `.mockFive`, `.expecting` |

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
- `.wordsOnly`: the toggle row is absent, not greyed (R5b).
- `.error-share_temp_write_failed`: the thumbnail is replaced by a caution line with a `WarningCircle` icon (shape plus colour; colour is never the only signal): "The picture could not be added this time. The words will go." The toggle returns to off. VoiceOver announces the line. Continue and Not now stay.
- `.versionExact`: the version line reads "Sent exactly as said." when the Book shows that version (R19).
- `.long`: the preview card scrolls inside the sheet body; the footer stays pinned; a 1 pt `line` appears above the footer while the body scrolls under it.
- `.rtl`: the words align to the reading direction; the date and signature lines keep their order.
- Equal buttons: both `Button variant="secondary" size="lg"`, same width, same type; neither filled (NS-05-R2; spec 03 J6 exception carried). Continue on the leading side, Not now on the trailing side at default size.
- AX5 (R13b): one column; the sheet is full height; Continue above Not now, each full width, 56 pt or taller as the label grows; both pinned in the footer so they are visible without scrolling past the text; the preview card scrolls above them; the static row and the toggle stack label over switch (ToggleRow AX5 behaviour).
- VoiceOver: focus lands on the title. The preview card is one element: "What will be sent. Saturday 14 March 2026. We went to the park ... From Mama." Then "The words always go" read as text (no switch role, not dimmed; R4b). Then the toggle. Then the two lines, then Continue and Not now, both with no hint that suggests one is expected.
- Switch Control: the static row is not a stop; the toggle, Continue and Not now are.
- Dark and Increase Contrast: tokens only; the hairline frame on the thumbnail is `mediaFrame` (ruling 27; `highContrast.line` under Increase Contrast).
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
- `.pickTime`: the rhythm line becomes "Remind me at [8:30 PM]" with the system compact picker (07:00 to 21:30, 15 minutes); the two answers stay.
- The body names the child in the app only (built `renderTemplate`); the lock screen stays neutral.
- No Close, no swipe to dismiss: one answer ends it (as built). VoiceOver: modal; the scrim is hidden. Order: title, body, rhythm line, Change the time, Yes, evenings, No reminders.
- AX5: icon hidden at AX3 and above to give the text room (decorative); the rhythm line and Change the time stack; both answers full width, stacked, equal.
- Results are toasts on the undo-toast surface (glass): `.after-yes` "Reminders are on. Next: {weekday} at {time}." with Change; `.after-yes-denied` "Not sending yet." with Open Settings; `.after-yes-failed` "Could not set reminders just now." with Try again; `.after-no` "You can turn reminders on in Me whenever you like." (no action). Toasts with an action follow T4 through BL-954.
- `.pickTime`: the picker opens in place under the rhythm line; the two answers stay and "Yes, evenings" applies the chosen time. No separate "Set reminder" button (the built `cta` key is not drawn). New PROPOSED key for the control: `onboarding.reminder.changeTimeButton` "Change the time" (WORDS.md to add).
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
 | A letter tonight?                     |  NotificationPreview: headline (Example)
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
 +---------------------------------------+  v2: one row, not a list
 | Days                                > |  ListRow, opens C-S24 (before tree test T1;
 +---------------------------------------+  after T1 it lives in "Days and reminders")
 Days you chose and days you added still      D-S06.daysRemindersOff: shown only when
 send a reminder when Reminders is off.       Reminders is off and any day exists (intent)
 Reminders from your iPhone's own suggestions are separate. (D-S06.journalNote, level 2 only, static footnote)
```
- Built as is for NS-13; v2 changes against v1: (a) the typed-day list is not on this page; one row "Days" opens the Days page C-S24 (NS-46-R3, RV-13; days flag `EXPO_PUBLIC_DAYS` or `EXPO_PUBLIC_TYPED_DAYS` off: the row is absent); (b) the preview is the planner's own function (NS-48-R22), so at a reminder time before 17:00 it never shows a line that names the evening, and with names off or App lock on it shows the neutral rendering (NS-48-R39); (c) the child-name switch help says it covers the child only; days have their own switch on C-S24 (NS-47-R14); (d) `.daysRemindersOff` and `.journalNote`. Nothing on the page says reminders slowed or stopped (NS-13 section 15); `.backedOff` still hides the Next line.
- `.off`: only the switch and its footer, then the row "Days" if any day exists or the flag is on, and `.daysRemindersOff` when any day exists (typed and ticked days still deliver when notifications are allowed; there is no master switch for them).
- `.daysRemindersOff`: one calm line in `footnote` `text` under the row "Days" (not `textMuted`: it is the visible opt-out, compliance C-01): chosen days still send a reminder, and where to stop them. It is static, not a SystemLine (F2) and carries no icon. Shown only while Reminders is off and at least one typed or ticked day exists.
- `.journalNote`: a static `footnote` under the list in the group "Reminders", shown only where level 2 pictures are available (iOS 17.2 and later, flag on; absent elsewhere, never greyed): reminders the phone makes by itself are separate and are managed in iPhone Settings. It never uses the word "journal" in prose (BRAND ban, Q-FD-34), makes no claim that our one-a-day rule covers them (NS-32 note), and is not a SystemLine.
- `.preview`: the block is one VoiceOver element read "Example. {title}. {body}", wraps at AX5 with Bold Text and never truncates; it never shows a variant the planner would not send.
- `.denied`: under the switch a card (`surface`, `radius.md`) with `WarningCircle` and "Notifications are off", one sentence, and Open Settings (outline sm). The choices below stay editable so a parent can set up before allowing.
- `.error-schedule_failed`: a card with "Could not set reminders just now." and Try again.
- `.appLock`: Names in notifications off and disabled, help "Names stay hidden while App lock is on."
- `.quietDelivery`: footnote under the Next line.
- `.noBirthDate`: the month row's help "Starts once a birth date is added."
- `.backedOff`: after day 35 with no letter, the plan holds nothing of these classes; the Next line is not shown (no line about absence). The preview still shows the words a reminder would use.
- `.twobooks`: no change on this page; each book's "Include {child} in my reminders" lives on the book's page (C-S15).
- AX5: rows stack title over value; chips wrap to several lines (each 44 pt high); the time label sits above the time (as built `ax`); the row "Days" and both footnotes wrap; nothing truncates.
- VoiceOver: switch reads its state; the preview reads as one element "How it will look. {title}. {body}"; day chips read the full weekday and "selected" (checkbox role, or radio for Weekly); after a change, "Saved. Next: Tuesday at 8:30 PM."; the row reads "Days" with hint "Opens your days."; the typed-day rows read "{date}. {words}" on C-S24. 
- Integration: NS-13-R1 to R33, NS-32-R4 (via D-S24), NS-46-R3, R31, R35, NS-47-R14, NS-48-R22, R39, NS-49 `journalNote`; BL-943, BL-966, BL-967, BL-982, BL-985; flags `EXPO_PUBLIC_TYPED_DAYS` and `EXPO_PUBLIC_DAYS` (local family, E20); the remote pause `killSwitches.libraryDays` hides the row and the days only; failure is `ScheduleResult { ok: false }` (no code); reads prefs, permission detail, `nextReminder()`, `plannerChildren()`, app lock; writes `reminders.*`, `notifications.lockScreenNames`, `typedDay.*`; modules `app/settings/reminders.tsx`, `components/settings/reminders.logic.ts`, `lib/reminders/*`.

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
 | HOW IT WILL LOOK                      |
 | +-----------------------------------+ |  NotificationPreview: the fixed line by
 | | A day you wanted to remember      | |  default; the parent's words only when the
 | +-----------------------------------+ |  day-names switch is on and App lock is off
 | The lock screen shows this unless you |  static footnote (v2); it points at the
 | choose otherwise on the Days page.    |  one switch, which lives on C-S24
 |---------------------------------------|
 | [               Save               ]  |  Button primary lg, 56 pt
 +---------------------------------------+
```
- v2: the sheet carries no switch. One switch, `notifications.dayNames`, decides whether any day's words or name show on a lock screen; it lives once, on the Days page C-S24 under the list, off by default, forced off while App lock is on (RV-8, RV-13, NS-47-R14, R37). The preview is read-only and shows the effective result; `.appLock` adds the reason line "Words stay hidden while App lock is on." (the built `.appLock` pattern, read as "present and not ready"). This replaces v1's per-day switch and the G-D14 ruling; section 15 flags the conflict and gives the fallback if Karma keeps G-D14.
- No character counter (a counter is a count shown while typing). Typing stops at 80 graphemes; a paste over 80 keeps every character, and Save shows `.error-typed_day_too_long` ("That is longer than fits here. A short line works best.") and waits. Nothing is cut silently.
- Save follows the system v2 rule (COMPONENTS 1.2, "present and not ready"): with no words Save shows as an outline with `textMuted` label, VoiceOver reads "dimmed", and its hint is "Add a few words about the day." (`reminderCopy.typedDay.errorEmpty`). `.error-typed_day_empty` is that not-ready state; nothing is announced as an error.
- The date picker starts at today; today is accepted only while today's reminder time is still ahead, else `.error-typed_day_past` ("Choose a day that is still to come."). Reconciled with WORDS.md G6; replaces this file's first default (tomorrow onward).
- `.notAllowed`: the line "Notifications are off. This day is saved and will be sent once they are allowed." (intent) above Save; Save still works.
- AX5: full height; fields stack; the footnote wraps; Save pinned.
- VoiceOver: title, date (picker), words field "Your words", preview as one element ("Example. {title}. {body}"), the footnote, Save. The field's hint: "Shows in the app on that day." Writing Tools: off (D2; FR-PRV-16 asks every field spec to say so: this field, and the C-S26 move-a-date field).
- Integration: NS-18-R1, R3, R5, R8; D2 (writing tools off; engineering gap E-D06); BL-982; flag `EXPO_PUBLIC_TYPED_DAYS`; writes `typedDay.<date>` only (v2: no per-day show-words key; the one switch is `notifications.dayNames`, L3 setting, phone only); module `lib/reminders/typed-days.ts`, settings screen.

### D-S09 A typed day: detail and Delete

A ConfirmSheet-shaped sheet: the date (headline), the words (body, serif not used: these are not a letter), what the lock screen will show today as text (follows the one switch), then "Delete this day" (destructive, quiet) and "Keep it" (primary, default). Editing is Delete then Add (no edit in the card). Integration: NS-18 section 5 "Deleting the day"; `ConfirmSheet`.

### D-S10 Lock screen and Notification Centre

See section 5 for the class registry, the rendering matrix, the one-place switch map and the catalogue specimens. Design reviews only our content: the title, the body and the per-category hidden-preview placeholder (NS-32 section 15). iOS draws the frame.

v1 states (`<class>`, `<class>-hidden`, `evening-named`, `birthday-named`, `typedDay-words`, `oneDay`, `quiet`, `focus`) stand. The v2 states, each drawn in the prototype with the lock-screen frame:

| State | What the lock screen shows | Card rows |
|---|---|---|
| `libraryDay-public` | An allowlisted seasonal day (`publicTitleOk`: seasons, New Year's Day, Thanksgiving, Independence Day, Labor Day) with App lock off and previews Always: the day's own name as the title, the neutral body of its tone. Never a family, tradition, culture-led, commemorative or contested day | NS-46-R36; NS-47-R13 |
| `libraryDay-neutral` | The default for every other day, and for every day while the day-names switch is off or App lock is on: the one neutral title and one neutral body (a string per tone, the same for every layer). No day, tradition, country or child name | NS-47-R12; NS-46-R37 |
| `libraryDay-named` | Day-names switch on, App lock off, a family or tradition day: the day's name in the title. The string never also holds a child name; the body is the one fixed neutral body, which has no `{child}` in any switch state (NS-47-R38; ruling 3) | NS-47-R12, R13, R38 |
| `libraryDay-quiet` | A quiet-tone day: the title as the switch rules say (neutral unless the switch is on, never `publicTitleOk`), the quiet neutral body "The book is open if you want it." No question mark, no invitation to write | NS-46-R16, R37 |
| `twoDays` | Two or more ticked days on one date: the one neutral title and neutral body; both (or all) names appear only after the tap, joined by the English list format | NS-46-R8, R39 |
| `libraryDay-hidden` | Previews hidden: the app name and the category's neutral placeholder only; no title (no category sets `hiddenPreviewsShowTitle`) | NS-47-R36 |
| `birthday-neutral` | Names off (the default): the neutral title "Something for the book today" in place of "A birthday today", which would tell a passer-by it is the child's birthday (G-D21 default; CPrivO reads). The named title shows only with names on | GAP-LOG D G-D21 |
| `appLock` | App lock on: names forced off, every library-day title neutral (public days included, Q-SEC-1 default), typed-day words hidden | NS-47-R12; NS-46-R36 |
| `summary` | Apple Intelligence or Scheduled Summary may restate our title and body in the system's words; outside our control (UNVERIFIED whether an app can opt out); typed words stay hidden by default | G-D18 |

Every class: interruption level `active` (never time-sensitive), no sound set by us, no badge, `data` is `{ source, kind }` only (an opaque slot token for a day; no day id, tradition, catalogue key, variant or layer), identifier `el.day.<isoDate>` for a day, category identifier without `:` or `-` (NS-46-R32, NS-48-R31; E1 in the security review). A library-day or typed-day reminder is never observed by analytics (NS-46-R34).

### D-S11 Notification landing

- `.home` (evening): Home (A-S01) with its current prompt; no extra line; the app does not know which variant was tapped (data is `{ source, kind }` only).
- `.typedDay`: Home with one line above the prompt: the parent's typed words, in `callout` sans, `textMuted`, no quotes added, preceded by nothing (the date is today). It shows on that local day whenever Home opens (not only after the tap), and leaves with the words the day after (NS-18-R7). Component `TypedDayLine` (section 6). It is not a Home slip (NS-50 section 3; A W9). With the day-names switch off (the default) the line still shows in the app: the switch governs only the lock screen.
- A tap on a ticked-day reminder (v2): Home within 2 s on an SE 3, plain, with the day slip in the slip slot when no higher slip is due (A-S01.dayToday). There is no `.libraryDay` state here: one way for a day on Home, however the parent arrives (RV-6, NS-50-R4). A cold-start tap behaves like a warm tap. A tap on a later date, or with the store cleared, unreadable or the token unresolved, opens plain Home with no day line and no message (`.libraryDay-cleared`, NS-46-R32). If a higher slip is due, that slip shows first and the day slip waits for the next Home visit that day (NS-50 happy path 4; the cost is accepted).
- `.monthAge`, `.birthday`: the Book (B-S01) at its current position (as built).
- `.plan`: Settings, Plan (E-S11), where the plan reminder waits (as built `openPlan`).
- `.appLock`: App lock first; then the landing.
- `.whileCapturing`: Listen, Review or Write is open: the app stays where it is; nothing records or stops (MOTION.md G6). A typed-day line and a day slip wait on Home.
- AX5: the typed-day line wraps; it never truncates.
- VoiceOver: on landing, focus goes to the screen's first element as usual; on Home with a typed day, the line is read before the prompt.
- Integration: NS-13-R9, NS-18-R1, NS-35-R3, R4, NS-46-R13, R32, NS-50-R4; built router `scheduler.ts:253-261` (evening to `/`, else `/book`) needs `typedDay` and `libraryDay` to `/` (engineering gap E-D04).

**Home after a day reminder: the day slip and the Days ask slip (v2; drawn by area A, constrained here because a notification lands on them).** Order in the one slip slot, one at a time (NS-50-R5, RV-5): (1) waiting set, (2) seal-opened line, (2b) a day the parent chose, today, (3) Save a copy, (3b) the Days ask, (4) one past letter.

| | Day slip (2b) | Days ask slip (3b) |
|---|---|---|
| What it is | The parent's own tick, today: the day's name and one line. Not a promotion | One family question, once per account, capped at two showings (NS-47-R31) |
| Anatomy | One non-interactive element labelled "{name}. {line}", a custom action for dismissal, and a separate visible dismiss button "Not today" of 44 pt or more; `surfaceRaised`, `radius.md`, 16 pt padding, `callout` in `text` (NS-50-R14) | The question, a short `DoorNote` under it, then "Choose days" and "Not now" as two `bordered` buttons of the same style and size, stacked at every size, neither `filled` (NS-47-R29, R32) |
| Position | Directly above the prompt block, the same place for every route (NS-50-R4) | Below the prompt, or above the cluster only if the prompt's full text stays visible on an SE 3 at the default size (device check) |
| Dismissal | "Not today": hides until the next local date, keyed to the date; no haptic; VoiceOver hint "Hides this until tomorrow" | "Not now": final for Home; Me, Days stays; hint "Closes this question. You can still choose days in Me." |
| AX3 and above | The dismiss button takes its own full-width row | Both buttons full width, stacked |
| Quiet tone | The name and "The book is open if you want it."; the quiet line replaces the prompt block; Speak and Type unchanged (RV-7, default pending founder Q-FD-24) | n/a |
| Never | A count, an upcoming day, a list, "no days today", a strip (NS-50-R2, R11) | A feature name, "new", a count, a price; never in a sitting where the Keep gate, the reminder ask or the rating request showed; never from a notification, email or banner (NS-47-R19, NS-50-R16) |
| Snapshot | Blank in the app switcher with or without App lock (E18; NS-47-R26, NS-50-R9) | Same |

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
 | WHAT DOES ASHA CALL THEM?   Optional |
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
- Optional pattern (v2, NS-47-R30): the word "Optional" sits beside the label in `footnote`, never an asterisk, never placeholder-only, never colour alone; VoiceOver reads "What does Asha call them?, optional"; nothing is preselected; leaving it empty writes nothing and prompts nothing later. The same rule applies to the sign-off field in D-S17.joined.
- Equal buttons (NS-25 section 6 AX5 row: "stack buttons at equal size"), stacked at every size.
- `.working`: "Getting the link ready" replaces the button label; the button keeps its size; VoiceOver announces it.
- `.full`: in place of the buttons, "{child}'s book has two parents." and Close.
- `.paused`, `.offline`, errors: one line above the buttons with `WarningCircle`; Try again where the error is not final.
- `.signed-out`: the first step is sign-in (as built: trigger `invite_create`).
- AX5: full height; all text wraps; buttons full width, stacked, equal.
- VoiceOver: title, body, the scope line, the field, its help, the two footnotes, Share invite link, Not now.
- Integration: NS-25-R16, R18, section 12 Invite door line (Records: invite created); BL-983 (BL-882 to BL-889 first); kill switch `killSwitches.invites`; error codes SCINV (retry_new_invite), SCCAP (book_full), SCCON (consent_needed, family_share_consent), SCKIL (paused), network, rate_limited, not_parent, unknown; writes `child_invites` (hashed token) via `create_child_invite`; module `app/invite/new.tsx`, `lib/family/invites.ts`.

### D-S14 Invite link page (web)

The built static page `/j` (no server, no analytics, the token in the fragment). Design changes: one App Store link line for an iPhone without the app (card section 4 step 3), styled as the page's existing link; no child or inviter name (R6). `.other-device`: "{app} works on iPhone." (WORDS.md G17: no "for now") above the built computer line. `.missing-token`, `.copied`, and the built copy-failed and no-script lines as built. It cannot show "expired" (gap G-D12). Integration: NS-25-R6; `apps/web/src/app/j/page.tsx`, `site.invite`.

### D-S15 Join ask: peek

Reconciled with WORDS.md: D-S15 and D-S16 are the top and bottom of one sheet. The peek (who invited, the role) sits above the agreement (the shared-scope sentence, the versioned links) and one equal pair, "Join the book" and "Not now". There is no separate Continue step. The sketch below is the top half; D-S16 is the bottom half.

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
- `.signed-out`: "You were invited to a book" with Sign in and Not now (built).
- `.loading`: "Opening the invite" with the system activity indicator (no count).
- Peek errors (`.error-expired`, `.error-used`, `.error-revoked`, `.error-not_found`, `.error-signed_out`) replace the sheet body with one line and offer "Paste another link" or Close; final errors drop the token (as built `FINAL_INVITE_ERRORS`). `.paused` and `.offline` keep the token and offer Try again. Join-time errors are D-S16 states.
- Integration: NS-25-R2, R5, R9, R11, R18; BL-983; kill switch `killSwitches.invites`; error codes SCINV (expired, used, revoked, already_member, not_found), SCCAP, SCKIL, SCCON, PGRST301 or 303 (signed_out), network; module `app/invite/index.tsx`, `lib/family/join-flow.logic.ts`.

### D-S16 Accept: the agreement

The bottom of the join sheet (NS-25 section 12 Accept door): the line "You will both read every letter in the book that is not private. Join only if you know who sent you this link." (CHANGE to `family.accept.askBody`, WORDS.md), the agreement as `AgreementRow` lines with versioned links (Terms, Privacy Policy, Consumer Health Data Privacy Policy; E owns the keys), then "Join the book" and "Not now", equal and stacked. Join records one `policy_acceptances` row (`invite_accept`, R17). Not now: nothing joins; the inviter is not told.
- No sign-off field here. The built field label "What does {child} call you?" would name the child before agreement (R2; WORDS.md G13). Design decision: the field moves to D-S17.joined, after agreement, where the child is named anyway. `family.accept.signsAsLabelBeforeJoin` is then not needed.
- `.joining`: "Joining the book"; the button keeps its size.
- `.needs-sync`: "To join, choose Agree and sync in Settings, Account." (built).
- `.error-join_failed` (a failed or lost accept answer): "Joining did not finish. Nothing has changed. Try again." (PROPOSED `family.errors.joinFailed`); a retry makes exactly one membership (R10).
- `.error-already_member`: one line and Open the book (R9). `.error-book_full` (SCCAP, R5) and `.error-book_deleted`: one line and Close. `.error-consent_needed`, `.error-family_share_consent` (SCCON): their built lines.
- Separate agreement step (gap G-D16): only if the server requires the family-share consent and a later build adds that sheet; until then this sheet is the agreement.
- AX5: full height; the peek, the sentence and the links scroll; the pair is pinned. VoiceOver: title, invited by, role, the sentence, each link, Join the book, Not now.
- Integration: NS-25-R2, R5, R9, R10, R11, R17; error codes SCINV, SCCAP, SCKIL, SCCON; `accept_child_invite`; `components/ui/agreement-row.tsx`.

### D-S17 Joined: arrival

As built (states `.arriving`, `.slow`, `.joined`): the book cover appears for the first time with the child's name, the flyleaf line ("Your letters and Mama's sit side by side, each signed."), "{child}'s book is on its way to this phone." with a thin bar and no count; then "What does {child} call you?" (prefilled) and "Open the book". `.notYet` adds Try again. `.twobooks`: the switcher on Home and the Book now lists both (NS-14). Integration: NS-25-R8, section 8 latency; BL-983.

### D-S18 Family page

Built `/family` page ("Who writes to {child}"): member rows as signatures, pending invites with Share again and Cancel invite. Added for NS-25:
- `.undo-open`: under the co-parent's row, "You can undo this until {date} at {time}." (PROPOSED `family.undoJoin.rowHelp`) and the button "Undo {coParent}'s join" (PROPOSED `family.undoJoin.row`; `Button outline sm`, 44 pt, solid). Only for the inviter, only inside 72 hours. A deadline, not a countdown.
- `.undo-closed`: no control and no line (R13).
- `.pending`, `.expired`, `.paused`: the built invite rows.
- `.left`: the built neutral note, once.
- No "Leave" row (D-113).
- Integration: NS-25-R4, R13; `undo_parent_join`; BL-983.

### D-S19 Undo join confirm

`ConfirmSheet`: title "Undo the join?" (intent; `family.undoJoin.*` in WORDS.md), body "Their letters leave the book and stay theirs. Their phone stops receiving this book.", plus `family.leave.cantTakeBack` if engineering confirms copies already on their phone stay (WORDS.md G10); safe default "Keep them in the book" (primary, solid), destructive quiet "Undo join". Records `member_join_undone` and a PRIV-R21 row. `.working`: one call. `.done`: the row leaves; toast "Join undone." `.error-SCPAR`: the existing `family.errors.not_allowed` ("That isn't possible from here.") with Close. `.error-network`, `.error-unknown` ("The undo did not finish. Nothing has changed. Try again."). Integration: NS-25-R4, R13; error SCPAR.

### D-S20 The other parent's phone after an undo

One neutral `AppNote` line at the top of the Book for that book, shown once, then gone: "This book is no longer shared with you. Your letters stay yours, to read, export or delete." (`family.undone.note`, PROPOSED in WORDS.md). No reason, no name of who undid it. P2's own letters stay in their own list as private letters. Gap G-D17: the card states the behaviour but not what P2 reads.

### D-S21 Home: Not much today

Built (`components/tonight/quiet-day-inline.tsx`): the quiet link in the capture cluster (`Button quiet`, 44 pt); on tap, the link fades and the line "A quiet day, kept." with "Undo" (44 pt) takes its place, in `subhead` `textMuted`, status colour rules for lit paper (atmosphere `onLitPaper.status` lower 30 percent). `.error-save_failed`: "Today's mark did not save. Try again." (PROPOSED `notMuch.saveFailed`, WORDS.md G14) with Try again; Home stays. AX5: the line and Undo wrap onto two lines, Undo stays visible and 44 pt. VoiceOver: hint "Marks today without writing anything."; the kept line is announced. Reduce Motion: the fade is Reduce Motion's fade. Integration: NS-07-C5-1, C5-5, C5-6, C5-13; BL-974; no flag; no pause (capture has no switch).

### D-S22 Book: the quiet-day row

Built `QuietDayRow`: "A quiet day" with the date, unsigned, `AppNote` styling. Consecutive days are separate rows with normal spacing, no connector, no group heading (C5-9). Hidden on a day with words (C5-11). Never on the other parent's phone (C5-8). VoiceOver: "{date}. A quiet day, kept." (`book.quietDay.a11y`). Integration: C5-8 to C5-11; BL-974 (display dedupe).

### D-S23 Pilot artefacts

Not app screens. The prototype shows each NS-03 section 7 and 15 text as a message bubble in a neutral messaging frame, labelled "Message (not in the app)". `{app}` stays a placeholder. No letter, picture or name appears in any bubble.

### D-S24 Me, Plan: the plan date when notifications are not allowed

Built line `billing.plan.notificationsOff` with "Allow notifications" on Settings, Plan (E-S11). Area D adds nothing; the line is listed so NS-32-R4's "Settings, Plan shows the date" has a screen.

### D-S25 Day reminders: the consent line and the visible opt-out (v2)

Purpose: a parent who ticks a day knows, before and after, that a reminder will arrive on that day and how to stop it (NS-46-R35; compliance C-01: the licence agreement limits local notifications used to promote an app unless the person opted in through consent language in the app and can opt out; counsel confirms). The surfaces are C-S25, C-S24 and D-S06; this screen owns the sentences, order and rules, and the words are `content`'s (WORDS.md section 18).

- `.beforeFirstTick` (on C-S25, top of the sheet): two static `DoorNote` blocks in reading order before any control that records a choice (NS-47-R29): (1) the privacy door line (Shown: "Only on this phone. Used for one thing: finding days for you to pick. Change or clear any time in Me.", intent, final only once `mobile` confirms the backup exclusion, NS-47-R6); (2) the reminder consent line: a day you tick sends one reminder that morning, and unticking it or Clear all stops it. `callout` type, colour `text` (not `textMuted`), `surface`, `radius.md`, decorative lock glyph hidden from VoiceOver, never collapsed, never behind an info glyph, never dismissible, never glass, wraps at AX5. No sentence says "private", "invisible", "nobody can tell" or "undetectable", and none says the parent picks the time (NS-47-R22, NS-46-R46).
- `.firstTickAsk`: the first tick while permission is undetermined: the tick stays; one line in the sheet names the next step; then iOS asks once through the `next-ask` door (D-S05). The Days ask slip never shows to a phone whose permission is denied.
- `.denied`: the D-S06 `.denied` card reused as built (`WarningCircle`, "Notifications are off", Open Settings); one per screen; no red; no promise of delivery; no repeat ask.
- `.remindersOffLine`: when Reminders is off and a day exists, the same sentence appears on D-S06 (`.daysRemindersOff`) and on C-S24, so the opt-out is visible from both pages.
- `.stopOne`: unticking one day: in one tap on the Browse list; on C-S24 by Remove in C-S26, a swipe action and a VoiceOver custom action (NS-47-R21). A tick or untick shows only the row change, `H-select` and a VoiceOver value change: no toast, no count (NS-46-R41).
- `.clearAll`: an F6 `explained` sheet: safe choice default, "Clear all" destructive as text; it cancels every pending reminder and dismisses every delivered one at once.
- `.systemEnded`: after a session the system ended, the next open of Me, Days shows one calm line that the list was cleared when the session ended and they may choose days again; no count, no "you lost" (NS-47-R15; Q-FD-12).
- No day reminder, slip or landing line advertises a feature, a new day, the Days page or an update (NS-46-R35).
- Shown, Records, Never and Decline (PRIV-R21 form): Shown: the two lines above before the first tick. Records: on the phone only, the day id and optional date override; no server row, no `record_policy_act` row (counsel Q6 may change this). Never: a pre-ticked day; a tradition, day id, country or moved date in analytics, logs, URLs, support links or a notification title (except an allowlisted seasonal day's name). Decline: "Not now" and leaving schedule nothing and are a full answer of equal weight.
- Integration: NS-46-R31, R35, NS-47-R15, R21, R22, R29, R30; compliance C-01; `mobile` `next-ask`; area C owns C-S24 to C-S26.

### D-S26 Reminder catalogue specimens (v2, a design artefact, not an app screen)

The designed lock-screen and in-app artefacts of NS-48, drawn once so `content`, the reading test (FR-RSH-08: five mock reminders as images, Asha, no child name) and the device walk (NTC-T24) read the same pictures. Each is a D-S10 lock-screen frame or a D-S06 preview, never iOS chrome of our own. Section 5.5 holds the table.

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
| D-S25 (v2) | none: the `DoorNote` blocks and the denied card are content layer; C-S25 is a sheet, so buttons inside it are solid | consent line, privacy line, calm lines | A tick shows no glass toast (a third surface on a sheet screen) |
| D-S26 (v2) | none | specimens | design artefact |

Reduce Transparency, or iOS before 26: every glass surface above becomes the solid fallback (`glassFallback`, #282421) with a hairline (`line`), same shape and size. Increase Contrast: hairlines and labels step to the `highContrast` tokens. At most three glass surfaces are visible at once on every screen in this area (the most is D-S02 over the letter page: the sheet, plus the page's header buttons dimmed behind the scrim).

## 5. Notifications: classes and lock-screen rendering

### 5.1 The registry (NS-32), as design sees it

| Class | Group | Priority | Fires | Title and body (default, names off) | Named variant | Tap lands | Category placeholder slot (PROPOSED key) |
|---|---|---|---|---|---|---|---|
| `plan` | plan (4 slots, outside the budget) | first, never dropped | inside its legal window, 10:00 local when possible, never in quiet hours | title "Plus"; body e.g. "Plus is free until {date}, then it renews unless you cancel. You can change this in Settings, Plan." (built) | none: never a child name, a count or a price | Settings, Plan (E-S11) | `billing.reminders.placeholder` |
| `typedDay` (group; sources `typedDay` and, v2, `libraryDay`) | reminders (60 in total with plan, E13) | 1 for a day the parent typed; `libraryDay` ranks after birthday | the typed date at the reminder time; a ticked day at 09:00 clamped to 07:00 to 21:30 (DL-6) | fixed line, intent "A day you wanted to remember" | with "Show my words" on: the body is the words unchanged | Home with the words (D-S11.typedDay) | `reminderCopy.placeholders.typedDay` |
| `birthday` (and `birthdays`) | reminders | 2 (above a ticked day, DL-2) | the birthday at 09:00 | "A birthday today" / "A year of letters. Want to read them together today?" (built) | names the child | Book | `reminderCopy.placeholders.birthday` |
| `monthAge` (and `together`) | reminders | 4 (after `libraryDay`) | the month-day at the reminder time, days 0 to 35 only | "Month {month} begins" / "A new month in the book is open." (built) | names the child | Book | `reminderCopy.placeholders.monthAge` |
| `evening` | reminders | 5 | chosen weekdays at the chosen time; days 1 to 7; then one per block to day 35; then none | the 8 neutral variants (built), rotated | named variants | Home (D-S11.evening) | `reminderCopy.placeholders.evening` |

Not drawn: `occasion` as a class (it returns only as a source, N-2), a `libraryDay` registry row (it is a source inside the `typedDay` group, NS-46-R29), Apple's own journal-suggestion notification (the system's, outside the budget, NS-49-R22), NS-26 co-parent push (parked; no class), any seal-opening notification (NS-06-B4 forbids it), any notification for Share, Save a copy, Find, quiet days or past letters (their cards forbid it).

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
| any | library day, switch off (default) or App lock on | App, the one neutral title, the neutral body of its tone (quiet tone: "The book is open if you want it.") | same |
| Always | allowlisted seasonal day, App lock off | App, the day's own name, the neutral body | same |
| Always | family or tradition day, day-names switch on, App lock off | App, the day's name; never a child name in the same string | same |
| When Unlocked or Never | any library day | App and the placeholder | full text once unlocked (When Unlocked) |
| Always | birthday, names off (G-D21 default) | App, "Something for the book today" | same |
| Deliver Quietly or Provisional | any | nothing on the lock screen | Notification Centre only; D-S06 says so |
| A Focus is on | any | held by the Focus (no class is time-sensitive) | in Notification Centre |
| Scheduled Summary on | any | collected into the summary at its time | in the summary |
| Apple Intelligence notification summaries on | any | iOS may summarise our title and body in its own words; this is outside our control and the per-app toggle is the parent's (UNVERIFIED whether an app can opt out). See Card gaps G-D18 for typed-day words | same |

Placeholder words are `WORDS.md`'s: one line for every budgeted category, "Something for the book, whenever you have a minute.", and for plan "A reminder about your plan." Design rules for them: one short neutral sentence per category, no child name, no brand name (the app name already shows), no count, no "since", no "missed", and the same calm register as the bodies (NS-32 section 16).

The prototype draws each row (lock screen frame, previews shown and hidden, named and neutral, words on and off).

### 5.3 One day, at most two: the one-a-day budget surfaces (v2)

On any local day: at most one budgeted reminder (a day the parent typed, birthday, a ticked day, month, evening, by priority) plus any plan notice due (NS-32 section 3, NS-46-R7). The pending ceiling is 60 in total with plan notices kept first (errata E13; the 64 of NS-32-R4b is superseded). The rule lives in one pure `chooseOnePerDay` in `lib/reminders/budget.ts` (NS-46-R30); before it exists the rule is enforced nowhere except evening yielding to month and birthday, a P0 prerequisite (RV-11). Example drawn: 14 March, a typed day at 20:30 and a trial notice at 10:00.

The budget has no screen of its own and never explains itself: no "limit", no "skipped", no count. Its surfaces are:

| Surface | What the parent sees when the budget decides |
|---|---|
| D-S06 Next line and preview | The one reminder that will actually arrive next; never a reminder that yielded; hidden when nothing of these classes is pending (G-D06) |
| D-S10 `oneDay` | A plan notice plus one budgeted reminder: the only two-in-a-day case |
| Days list (C-S24) | A day that yielded to a birthday stays in the list with its date; no line says it was not sent |
| Home | No day slip on a birthday date (NS-50 section 5); a typed day keeps its line |
| Two books | One reminder across books; two month reminders on one date: one grouped (`together`); a birthday for one child and a month reminder for another: the birthday only (NS-32-R1b) |
| Lock screen | Never two budgeted reminders for one local date, also across a time zone change (NS-32-R6) |
| Over the ceiling | The nearest by fire date stay; later ones return at the next re-plan; no screen says so (Q-QA-4) |

### 5.4 Where each switch lives: one place for each (v2)

| Switch | Covers | Lives in | Default | App lock on | Why one place |
|---|---|---|---|---|---|
| "Names in notifications" (`notifications.lockScreenNames`) | The child's name on a lock screen, for evening, month and birthday reminders | Me, Reminders (D-S06), only | off | off and disabled with "Names stay hidden while App lock is on." | NS-47-R14, N-7: one names switch; its help line says days have their own choice |
| Day-names switch (`notifications.dayNames`) | A ticked family, tradition or culture-led day's name, and any typed day's words, on a lock screen | The Days page C-S24, under the list, only (RV-13); shown whenever any typed or ticked day exists | off | off and disabled with the reason; turning App lock on stores off; turning it off never turns it on (effective value `stored && !appLockOn`) | NS-47-R12, R14, R37; no second switch on D-S06, D-S08 or D-S09 |
| Month and birthday messages | Whether those two classes plan | D-S06 | on | unchanged | built |
| Reminders | Evening reminders, month and birthday; not ticked or typed days | D-S06 | off until the ask is answered | unchanged | a day-only gate (NS-46-R31); no master switch |

The two names switches are separate on purpose and never merge: a day name beside a child name on one lock screen is forbidden in every switch state (NS-47-R38). Neither switch is a setting the catalogue adds (NS-48 adds none).

### 5.5 Catalogue artefacts (NS-48), as designed (v2)

The catalogue chooses the words of a reminder the planner already decided to send; it adds no reminder, class or setting. The pure function `selectNotificationKey` runs on the phone at plan time. Design draws, as D-S26 specimens and D-S10 frames:

| Artefact | What it shows | Rows |
|---|---|---|
| `.grid` | Weekday tone (small Monday, lighter Friday, slower Sunday) by recency band r1 to r4: the same cadence, different words; the question gets shorter and more open as the gap grows and never mentions the gap | NS-48-R4, R6 |
| `.dayPart` | Reminder time 07:00 against 20:30: before 17:00 no line names the evening or "tonight", the built three evening-worded lines included | NS-48-R12, R15 |
| `.recency` | r1 (next day), r2 (2 to 6), r3 (7 to 14), r4 (15 to 35); drawn flagged "after the anchor" because the NS-13 anchor and back-off are unbuilt | NS-48-R3 |
| `.kind` | A last-letter kind shaping a body only (spoke, typed); a title is from the generic pool of six; `first` and `small` only with names on and App lock off; `picture` is not a kind | NS-48-R5, R29; RV-2 |
| `.named` and neutral pair | One authored text rendered twice: neutral by default (`{child}` to "your little one"), named only with names on | NS-48-R11, R13 |
| `.hidden` | Each class with previews hidden: placeholder only | NS-47-R36 |
| `.expecting` | A book with a due date and no birth date: lock screen shows the neutral evening line, no pregnancy, due date or "before birth"; the before-birth lines appear only in the unlocked in-app preview | NS-48-R36 |
| `.mockFive` | Five mock reminders as images for the S6 reading test, Asha, no child name, stop line "made me feel I was failing" | FR-RSH-08, NS-48 section 21 |
| In-app: D-S06 preview and Next | Call the same function as the planner; element "Example"; wrap at AX5 with Bold Text | NS-48-R22, R39 |

Limits every specimen passes: title at most 40 characters and body at most 110; no emoji, dash, curly quote, ellipsis character or exclamation mark (zero, N-5); no count, gap word, "again", "another", "still", "yet", "already", "by now", "should"; no "note" for an app message; no gendered word; no "story", "memory" or "moment" (NS-48-R10, R30, R37).


## 6. Components

Existing, reused: `Sheet` (with `footer`, `hideClose`), `Button` (secondary lg for every equal pair), `ListSection`, `ListRow`, `ToggleRow`, `ChoiceGroup`, `ChipGroup` and `Chip`, `Card`, `AppNote`, `QuietDayRow`, `Toast`, `ConfirmSheet`, `TextField`, `AgreementRow`, `MemberRow`, `InviteCard`, `JoinAsk`, `JoinWait`, `NotificationPreview` (local to Settings today), system time and date pickers, the iOS share sheet.

Proposed:
1. **Promote `NotificationPreview` to `components/ui`** (not new; the code comment already proposes it). Used by D-S06 and D-S08. Spec in `COMPONENTS.md` 2.x: a flat card, headline title and subhead body, both wrap at AX5, one VoiceOver element "{label}. {title}. {body}", never a picture of iOS chrome.
2. **`TypedDayLine`** (new, feature component in `components/tonight`). The parent's typed words above Home's prompt on their day. Why new: no existing component shows the parent's own short note on Home; `AppNote` is for the app's words and `prompt` is the app's question. Spec: `callout` sans, `textMuted`, no quotes or prefix added, wraps without limit, read before the prompt, no motion beyond the prompt's own entrance, not a slip.
3. **`ListRow` static form** (a change in `components/ui`, owned by `design-systems`): when a row has no `onPress`, it has no button role and no chevron, and Switch Control does not stop on it. Needed for "The words always go" (NS-05-R4b). Today `accessibilityRole` defaults to `button`.
4. (v2) **`DoorNote`** (new shared, `components/ui`, owned by `design-systems`; first named by NS-47-R29 for C-S25, C-S24 and the ask slip, used here by D-S25): static, `callout` in `text` on `surface`, `radius.md`, 16 pt padding, optional decorative glyph, never collapsible, dismissible or glass, first in reading order, wraps at AX5.
5. (v2) **`I1` `optional` slot** for the optional-field pattern (D-S13, D-S17) and **`I4` `multi`** (owned by C; not used here).
6. **`StaticCheckRow`** is NOT proposed: the static `ListRow` with a leading check glyph covers it.

No new colour or motion token. Open name requests still owned upstream: `layout.rowMin` 52 and `target.md` 48 (COMPONENTS section 9). Every colour, size and duration is an existing token (section 4).

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
| D-S25 (v2) | NS-46-R31, R35; NS-47-R15, R21, R29, R30 | NR-DAY-10 (Days page), BL-966, BL-982 | `EXPO_PUBLIC_DAYS` | `killSwitches.libraryDays` (PROPOSED, fail-open) | `days_store_unavailable` (local) | permission, days store | days store (phone only), `next-ask` state | days module, `lib/asks` |
| D-S26 (v2) | NS-48-R1 to R39 | new rows (no id invented): core function, catalogue file, planner change | none | none | none | plan inputs | none | `packages/core/src/notification-key.ts` (PROPOSED), `packages/content` |

## 8. Cross-area hand-offs

- A (Home, A-S01): D-S11.typedDay (`TypedDayLine` above the prompt) and D-S21 live on A's screen; A-S13 hands to D-S04 after the first kept letter.
- B (letter page B-S08, Book B-S01): D-S01 sits in B-S08's order (Share between Play and the "This letter" list); D-S22 is a row in B-S01.
- C (Me C-S01, book page C-S15, sign-out C-S03, export C-S04): Reminders row in Me opens D-S06; C-S15 holds D-S12 and "Include {child} in my reminders"; C-S03 sign-out removes reminders (no line); the pilot's export is C-S04.
- C (v2): the Days page C-S24, Browse C-S25 and Day detail C-S26 carry D-S25's blocks, reuse D-S08 and D-S09 and hold the one day-names switch; C-S03, C-S20 gain the days-cleared lines (NS-47-R15, R17).
- A (v2): A-S01.dayToday and A-S01.daysAsk follow the anatomy table in D-S11; D-S11 never draws a library-day state.
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
| G-D01 | NS-05 section 4 step 7 | Does the preview close when Continue hands off, or after the share sheet completes? | After the share sheet completes, whatever the outcome (MOTION.md G2); the preview stays under the system sheet meanwhile |
| G-D02 | NS-05 section 5 "own private letter" | Spec 03 wanted a line saying the letter was private; the card shows the same preview | No extra line; the where-it-goes line is enough |
| G-D03 | NS-05 section 5 `share_temp_write_failed` | Whether the sheet opens at once with words only or waits for a second Continue | Stay on the preview, show the line, turn the toggle off; the next Continue sends words only (the parent sees the change before anything leaves) |
| G-D04 | NS-13 section 12 "two equal choices" vs the built three-answer card | Conflict | Two equal answers; "Change the time" is a control, not an answer |
| G-D05 | NS-13-R31 | Does a second account on the same phone get its own two showings? | Yes: the cap is per account on this phone (settings are cleared at sign-out, R14) |
| G-D06 | NS-13 section 15 "back-off invisible" vs D-S06's Next line | After day 35 there is no next reminder; the built line would say "Next:" with nothing or a far date | Hide the Next line when nothing of these classes is pending |
| G-D07 | NS-13-R14 | Should the sign-out sheet (C-S03) say reminders stop? | WORDS.md proposes `account.signOut.remindersLine` for area C. Design has no objection (it is true and calm); area C decides whether D1's sheet carries it |
| G-D08 | NS-13-R13 | Where B's ask card can appear after B's first letter on A's phone | As G-D05 |
| G-D09 | NS-18 section 4 step 2 "at the reminder time" | The time when reminders are off, or never set | The stored time, default 20:30 |
| G-D10 | NS-18 section 5 "a day in the past" | Is today accepted? | Today only while today's reminder time is still ahead (reconciled with WORDS.md G6) |
| G-D11 | NS-18 section 5 "reminders turned off" | What the parent sees when notifications are not allowed | Save works; one line says it will be sent once allowed |
| G-D12 | NS-25 section 5 "invite expired" | The link page has no server and cannot know expiry | Expiry is shown in the app at peek (D-S15.error-expired) |
| G-D13 | NS-18-R5 | How the 80-character limit is shown without a counter | No counter; a paste over 80 is kept and Save shows one line (D-S08) |
| G-D14 | NS-18 section 10 `typedDay.showWords` | One switch for all days, or per day? The happy path reads per day | Per day (each day's sheet has its own switch); the key becomes `typedDay.<date>.showWords` |
| G-D15 | NS-18 section 4 step 3, frame section 4 | Is the typed-day line on Home a slip? | Not a slip: a line attached to the prompt, registered in `[FRAME-SLIP]` as "not a slip" like the Plus line |
| G-D16 | NS-25 section 4 step 5 | Separate agreement step vs the built peek-then-join | Separate only when the family-share consent is required; else Join is the agreement |
| G-D17 | NS-25-R4 | What P2 reads after an undo | One neutral line once (D-S20) |
| G-D18 | NS-18-R3, D3 | iOS notification summaries may restate typed words in machine words on the lock screen | Keep words hidden by default; the switch's help says the words show as typed in the notification (no claim about summaries); counsel and CAIO to read |
| G-D19 | NS-32 section 16 | The intent "A note for tonight" uses "note", which the glossary reserves | One line for every budgeted category ("Something for the book, whenever you have a minute.") so a hidden preview never reveals a birthday or a private day; plan: "A reminder about your plan." (WORDS.md G1) |
| G-D21 | NS-13-R6a, NS-32-R12 | The neutral birthday title "A birthday today" tells anyone at the lock screen it is the child's birthday (an L4 fact by NS-05-R6a's reasoning) | Raised by WORDS.md G3; CPrivO decides. Design draws the built title and the fallback "Something for the book today" |
| G-D22 | NS-13-R9, NS-18-R1 | A tap while a letter is being made (Listen, Review, Write open) | Do not navigate away; the typed-day line waits on Home (MOTION.md G6); state D-S11.whileCapturing |
| G-D20 | NS-13 section 4 step 3 "quiet, silent notification" | Whether "silent" means no sound | No sound set by us; iOS settings decide |

| G-D23 (v2) | NS-47-R37 vs GAP-LOG D G-D14 | The ruling made the show-words switch per day; RV-8 and NS-47-R37 want one switch for all day words | One switch on C-S24 (RV-8, RV-13); D-S08 has no switch. If Karma keeps G-D14: the sheet keeps its per-day switch, and its effective value is `perDay && dayNames && !appLockOn`, never able to show words the one switch hides |
| G-D24 (v2) | NS-47-R14 | The day-names switch is "shown only when a day is ticked", but typed-day words also follow it | RULED 20 Nov (ruling 13, reading B): shown on the Days page whenever any typed or ticked day exists; default stays off |
| G-D25 (v2) | NS-46-R3 vs GAP-LOG D W-G7 | W-G7 keeps "Days to remember" on Reminders; card 21 moves the list to C-S24 | Card 21 (later): one row "Days" on Reminders; the remindersOffNote becomes `.daysRemindersOff` |
| G-D26 (v2) | NS-47-R12, NS-46-R17, NS-47-R38 | The neutral body in the content review held `{child}`, which NS-46-R17 bans in a names-off lock string | RULED 20 Nov (ruling 3, reading B): the neutral body for a title with a day name is one fixed string with no `{child}` in any switch state; PROPOSED key `days.lock.body.neutral`; the test stays P0. The slot is gone, nothing renders "your little one" there |
| G-D27 (v2) | NS-48 `journalNote`; BRAND | The Reminders line about the phone's own journal suggestions risks the banned word "journal" | Wording avoids it ("suggestions your iPhone makes by itself"); shown only where level 2 exists |
| G-D28 (v2) | NS-46-R35 | Where the first-tick sentence sits when the sheet's call-outs already fill an SE 3 at AX5 | The two DoorNotes scroll with the sheet content, first in order; the sentence follows the tick inline |
| G-D29 (v2) | NS-13 section 4 vs month neutral title | "Month 4 begins" on a lock screen names the child's age in months (NS-48-R7 treats age band as sensitive on a lock screen) | Keep as built (NS-13-R5); CPrivO decides with G-D21 |

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
| E-D14 | Settings, Reminders has no "Days to remember" section, and the D-S06 `.typedDays-remindersOff` rule needs the section visible with the switch off | BL-982 |
| E-D15 | The D-S20 line on P2's phone after an undo has no key or screen | BL-983 with BL-965 |
| E-D16 (v2) | `budget.ts` and the DL-2 order do not exist; the one-a-day rule is enforced nowhere; `plan-reminders.ts` is a second scheduler with its own cap of 4 | NS-46-R30; hard prerequisite |
| E-D17 (v2) | No notification category, `previewPlaceholder`, interruption level or thread exists; category identifier must avoid `:` and `-` | BL-966, BL-987 |
| E-D18 (v2) | The tap router sends non-evening kinds to `/book`; `libraryDay` and `typedDay` go to Home | BL-982, NS-46-R32 |
| E-D19 (v2) | Day-only gate beside `prefs.enabled`; one `next-ask` iOS ask at the first tick | NS-46-R31 |
| E-D20 (v2) | Sign-out must dismiss delivered day reminders; a system-ended session clears the days store with one line | NS-47-R15 |
| E-D21 (v2) | `selectNotificationKey`, `lastMadeLetter()`, day-part filter, the `ntc.*` keys under the rules test (a drift test) | NS-48 section 10 |
| E-D22 (v2) | `ListRow` static form and `DoorNote` in `components/ui`; `NotificationPreview` promotion | `design-systems` |

## 12. Reconciliation with MOTION.md and WORDS.md (done 20 Nov, end of run)

Read `MOTION.md` (v1) and `WORDS.md` in this folder after both were written. Screen ids D-S01 to D-S24 match in all three files; no id was added or renumbered. State names: `WORDS.md` names are taken as canonical because they carry the string keys; this file and `PROTOTYPE.html` were renamed to them. `MOTION.md` keeps its motion ids (D-Mnn) and needs only the state renames below.

### 12.1 State renames (canonical on the right)

| Screen | DESIGN.md first draft | MOTION.md | Canonical |
|---|---|---|---|
| D-S01 | `.default` | | `.default` (WORDS `.present` is the same state) |
| D-S02 | `.default` | `.picture-off` | `.pictureOff` |
| D-S02 | `.noPicture` | | `.wordsOnly` |
| D-S02 | | `.picture-on` | `.pictureOn` |
| D-S02 | `.error-share_temp_write_failed` | `.picture-failed` | `.error-share_temp_write_failed` |
| D-S02 | `.exact` | | `.versionExact` (and `.versionFixes`) |
| D-S04 | `.picking` | `.pick-time` | `.pickTime` |
| D-S04 | `.yes-allowed`, `.yes-denied`, `.no` | | `.after-yes`, `.after-yes-denied`, `.after-no`; new `.after-yes-failed` |
| D-S06 | `.on-named`, `.on-appLock`, `.monthNoBirthDate`, `.scheduleFailed`, `.off-withDays`, `.typedDays`, `.typedDaysEmpty`, `.typedDaysFlagOff` | | `.named`, `.appLock`, `.noBirthDate`, `.error-schedule_failed`, `.typedDays-remindersOff`, `.typedDays-list`, `.typedDays-empty`, `.typedDays-flagOff` |
| D-S08 | `.empty`, `.tooLong`, `.error-scheduleFailed` | `.error` | `.default`, `.error-typed_day_too_long`, `.error-schedule_failed`; new `.error-typed_day_empty`, `.error-typed_day_past` (MOTION `.error` covers all of them) |
| D-S09 | `.default` | | `.default` (detail), `.confirm` |
| D-S10 | `evening.shown`, `<class>.hidden-locked`, `.named`, `typedDay.words` | | `<class>`, `<class>-hidden` (WORDS `.hidden` for the set), `<class>-named`, `typedDay-words` |
| D-S11 | `.evening`, `.monthAge` | `.home`, `.book`, `.home-typed-day` | `.home`, `.book`, `.typedDay` |
| D-S12 | `.absent`, `.oneParent`, `.twoParents` | | `.store`, `.killswitch`, `.one-parent`, `.two-parents`; new `.consent-needed` |
| D-S13 | `.loading`, `.paused-invites` | | `.working`, `.paused` |
| D-S14 | `.otherDevice`, `.missingToken` | | `.other-device`, `.missing-token` |
| D-S15 | `.signedout`, `.unknownInviter`, join-time errors | | `.signed-out`, `.no-signoff`; join-time errors moved to D-S16 |
| D-S16 | `.loading`, `.error-unknown` | | `.joining`, `.error-join_failed`, `.needs-sync`, `.paused` |
| D-S17 | `.waiting`, `.notYet`, `.ready` | `.waiting`, `.joined` | `.arriving`, `.slow`, `.joined` |
| D-S18 | `.oneParent`, `.invited`, `.twoParents-undoable`, `.twoParents`, `.paused-invites` | | `.one-parent`, `.pending`, `.undo-open`, `.undo-closed`, `.paused`; new `.expired` |
| D-S19 | `.loading`, `.offline` | | `.working`, `.error-network`; plus `.error-unknown`, `.error-SCPAR` |
| D-S21 | `.error-save` | | `.error-save_failed` |
| D-S22 | | | new `.menu`, `.removed` (built "Remove this mark") |
| D-S24 | `.notificationsOff` | | `.denied` |

`MOTION.md` to apply: D-S02 `.picture-off` to `.pictureOff`, `.picture-on` to `.pictureOn`, `.picture-failed` to `.error-share_temp_write_failed`; D-S04 `.pick-time` to `.pickTime`; D-S11 `.home-typed-day` to `.typedDay`; D-S17 `.waiting` to `.arriving`.

### 12.2 Decisions taken in reconciliation

1. **Reminder ask (WORDS G2, MOTION D-M30).** Two equal answers, "Yes, evenings" and "No reminders". The time is changed in place by a quiet "Change the time" control on the rhythm line, which opens the system picker; the answers stay; there is no "Set reminder" button. `WORDS.md` to add `onboarding.reminder.changeTimeButton` and mark `pickTimeButton` and `cta` not drawn. `MOTION.md` D-M30 to read: the picker opens in place under the rhythm line (cross-fade `swapMs`), the answers do not move.
2. **Join sheet (WORDS G13).** D-S15 and D-S16 are one sheet. The sign-off field leaves the pre-agreement sheet and lives only in D-S17.joined, so the child is never named before agreement. `family.accept.signsAsLabelBeforeJoin` is not needed.
3. **Link page expiry (WORDS `D-S14.expired`).** The web page is static and never sees the token server-side, so it cannot know an invite expired. `D-S14.expired` is not reachable; the expired line belongs to D-S15.error-expired (existing `family.errors.expired`). `site.invite.expiredBody` and the reuse of `onboarding.inviteExpired.title` on the page should be dropped from WORDS.md.
4. **Share completion (MOTION G2).** The preview closes after the share sheet completes, in every outcome.
5. **Typed day validation (WORDS G6).** Today allowed while its reminder time is ahead; Save "present and not ready" with no words (system COMPONENTS 1.2); three local codes `typed_day_empty`, `typed_day_past`, `typed_day_too_long`.
6. **Placeholders (WORDS G1, section D-S10.hidden).** One neutral line for every budgeted class; a separate line for plan. Keys `reminderCopy.placeholders.<class>` and `billing.reminders.placeholder`.
7. **Brand placeholder.** `{app}` (WORDS.md) in docs and the prototype, rendered from `packages/brand`.
8. **Ask position (MOTION G8).** Over the Book, after the saved moment lands (as built).
9. **Over-300 ms items (MOTION section 6).** No design objection to the lamp, quiet-day dim and first-row wash. For the joined cover (item 5) design prefers keeping the built opening (it happens once per parent per book). The waiting bar (item 6) is the only loop; design accepts it while sync is genuinely running, still under Reduce Motion.
10. **Glass (design system v2 brief, section 3).** Section 4a, keyed to `docs/design/system/COMPONENTS.md` and `FOUNDATIONS.md` (read at the end of this run) in 12.4. Neither MOTION.md nor WORDS.md conflicts with the material policy. MOTION's sheet and toast moments take their curves from `docs/design/system/MOTION.md` (`m.sheet`, `m.toast`, `m.swap`).

### 12.3 Names from `docs/design/system/` (design system v2) used for this area

| This file said | System v2 name | Where in this area |
|---|---|---|
| `Sheet` (ui/sheet.tsx) | N7 Sheet (system, glass regular; `fit`, `half`, `full`) | D-S02 (`fit`, `full` at AX5 and long), D-S04 (`fit`, `dismissible={false}`), D-S08 (`half`), D-S13, D-S15 and D-S16 (one `half` sheet), D-S17 (`full`) |
| `Button variant="secondary" size="lg"` for every equal pair | A1 Button `style="glass"` `size="lg"`, rendered `bordered` inside a sheet (no glass on glass); pairs in `ButtonRow`, stacking from AX1 | D-S02, D-S04, D-S13, D-S15/16 |
| `Button primary` (Save, Keep it) | A1 `style="prominent"`, rendered `filled` in a sheet | D-S08 Save, D-S09 and D-S19 safe choice |
| `Button quiet` | A1 `style="plain"` | Change the time, Not much today, Cancel |
| D-S01 Share button | A1 `style="glass"` in the content layer, so `bordered`, `size="lg"`, leading `square.and.arrow.up` | D-S01 |
| `ToggleRow` | I5 Toggle | D-S02, D-S06, D-S08 |
| `ChoiceGroup`, `ChipGroup` | I4 Choice group | D-S06 |
| system compact pickers | I3 Date sheet only for D-S08's date if a sheet is used; otherwise the system compact picker in the row | D-S07, D-S08 |
| `AgreementRow` | I7 Agreement row | D-S16 |
| `Toast` | F1 Undo toast (glass regular) | D-S04 results, D-S13.sent, D-S19.done |
| thin waiting bar | F3 Progress | D-S15.loading, D-S17.arriving |
| `ConfirmSheet` | F6 Confirmation, `simple` (native, from the control) | D-S09.confirm, D-S19 |
| `NotificationPreview` (promote) | S1 Notification renderings, the preview variant | D-S06, D-S08 |
| lock screen | S1 previews shown, previews hidden, typed day | D-S10 |
| switcher blank snapshot | S2 Lock-screen privacy snapshot | D-S02.switcher |
| `AppNote` | content text (no system component; FOUNDATIONS paper tokens) | D-S02 lines, D-S20, D-S22 |
| solid fallback | `material.solid`: `glassFallback` (light #FFFFFF, dark #282421) with 1 pt `glassBorder` | every glass surface under Reduce Transparency (prototype toggle) |
| dateline | C6 Dateline | D-S02 preview card, D-S18 |

Conflicts with the system files (card wins, CR-66), for Karma:
- **COMPONENTS F1 lists D-S21 (quiet day kept) as an undo toast.** NS-07 C5 section 3.4 puts "A quiet day, kept." with Undo in place of the link, and C5-6 meets T4 because the line has no timer and stays while Home stays. A toast with a 10 s window would end the Undo early. Design keeps the inline line (content layer); F1's "Used by" should drop D-S21.
- **COMPONENTS S1 says hidden previews show "Notification" and our content does not matter.** NS-32-R13 and NS-13-R33 require a neutral `hiddenPreviewsBodyPlaceholder` per category, which iOS shows in place of "Notification". S1 should add the placeholder.
- **COMPONENTS S1 groups by `threadIdentifier` per book.** Accepted (this file had per class); with one budgeted notification a day the grouping rarely shows.
- **AUDIT 4.12** (where the ask shows): settled over the Book, as built; this file's skeleton line "sheet on Home" is corrected.
- **COMPONENTS 1.1 rule 5 (0.5 pt hairline fallback) and FOUNDATIONS 2.3 (1 pt `glassBorder`)** differ; the prototype draws 1 pt.

### 12.4 Open between the three files (for Karma)

- WORDS.md `family.errors.not_allowed` is reused for SCPAR at D-S19; WORDS lists it for "any deep link to a removal after 72 hours". Same line; no conflict.
- WORDS.md proposes `reminderCopy.typedDay.remindersOffNote` (G7) and design shows the section with reminders off (`.typedDays-remindersOff`); both depend on the CPO keeping NS-18's PROPOSED behaviour.
- WORDS.md G15 (plan notices name Plus) is consistent with section 5.1 here.

## 13. Final-pack reconciliation (v2): ids, states and files

Ids added: screens D-S25 (day reminders: consent line and visible opt-out) and D-S26 (catalogue specimens); journeys J-D60 to J-D70; gaps G-D23 to G-D29; engineering gaps E-D16 to E-D22. States added: D-S06 `.daysRow`, `.daysRemindersOff`, `.journalNote`, `.preview`; D-S08 `.dayNamesOff`, `.appLock`; D-S10 `libraryDay-public`, `libraryDay-neutral`, `libraryDay-named`, `libraryDay-quiet`, `twoDays`, `libraryDay-hidden`, `birthday-neutral`, `appLock`, `summary`; D-S11 `.libraryDay-cleared`; D-S25 and D-S26 states. States changed: D-S08 loses `.showWords` as a switch state (kept as the preview with the switch on). Nothing was renumbered or deleted. Re-keyed in `MOTION.md` (section 13: every D-M row mapped to `m.*` and `T-*`, new D-M68 to D-M79) and `WORDS.md` (section 18). `PROTOTYPE.html` changed on D-S06, D-S08, D-S10, D-S11 and gained D-S25, D-S26; `MOTION-PROTOTYPE.html` gained the new D-M plays.

## 14. Function needs accounted for

From `FUNCTION-TRACE.md` section 6.4 (rows the functions filed for area D) and the rows of 6.F that touch reminders, days and notifications. "Designed" names where; "Gap" is an explicit gap.

| FR | Screen and state | What changed or why nothing did |
|---|---|---|
| FR-SUP-POL-04 (POL-04) | D-S19 | No change: nothing in the app points to the support runbook for removal after 72 hours until POL-04 exists (D-S19.error-SCPAR line only). Designed in v1 |
| FR-MKT-14, MKT-19 | D-S01 to D-S03 | No change: any frame comes from D-S02 only, picture toggle off, no third-party app icons, no "tell a friend" after the sheet; focus returns to Share (G2) |
| FR-MKT-20 | D-S06, D-S10, D-S11 | Designed: a reminders frame shows the neutral placeholder and never a child name; no class or body announces a feature, offer or rating (section 5.2; D-S25 "no advertising") |
| FR-FIN-09 | E-S25, D-S10 `plan`, D-S11.plan | Designed: no price, amount, trial length or child name; placeholder "A reminder about your plan." (D-S10, J-D70) |
| FR-DAT-08 | D-S23 | No change: pilot artefacts are messages; the read-out template belongs to research |
| FR-PRV-32 | D-S13 | Gap, after counsel: the health-details line is not drawn; the sheet has a slot above the scope line |
| FR-PRV-16 | A-S06, A-S07, A-S09, B-S08, B-S11, B-S12, D-S08, E-S08 | Designed: "Writing Tools: off" stated in D-S08 (and the C-S26 move-a-date field) |
| privacy (no FR) | D-S10 | Designed as drawn: neutral by default, placeholder when previews are hidden |
| FR-LEG-10 | D-S13, D-S16 | Gap, counsel reads: the 72-hour removal rule line and the "someone feels unsafe" line need words; slot reserved at the foot of each sheet |
| FR-LEG-03 | D-S18 | No change: no Leave row and no "coming soon" (D-161, D-113) |
| FR-LEG-05 | D-S02 | Designed in v1: where-it-goes line kept; with the picture toggle on, one line that the picture goes wherever the letter goes; no "private" or "secure" |
| FR-LEG-11 | D-S23 | No change: consent W and V shown with their version |
| FR-CMP-07 | D-S13, D-S16, D-S02 (and E, C screens) | Designed: AX5 with Bold Text and VoiceOver layouts for the sheets; links announced as links; no truncated agreement text |
| FR-CMP-07, CMP-13 | D-S14 | Gap: path through the age gate before accept on a new install, WCAG AA on the web page, privacy link; D-S14 adds the privacy link, the age-gate path is E's |
| FR-SEC-09 | D-S18.undo-open | Designed in v1: the first line names who joined, with Undo |
| FR-SEC-10 | D-S16 | Designed in v1: the `codes_paused` line suggests asking for the link instead |
| FR-SEC-21 | A-S14, D-S10 | Designed: every placeholder is neutral; no name in any state; section 5.2 |
| FR-BKO-15 | D-S20 | Designed in v1: one neutral line, no reason, no name |
| FR-MSG-27, 28, 29 | D-S14 | Gap: the App Store button in launch mode above the copy steps (E-D11) and a generic link-preview card are not drawn; both states keep "ignore it" and write-to-us lines; no expiry wording |
| FR-MSG-28, 30 | D-S15 | Designed in v1: `.error-expired`, `.error-used`, `.error-revoked` carry the validity language |
| FR-MSG-19, 20 | D-S04, D-S06.denied | No change; rule added: "No" is never asked again (cap of 2 showings, per account) |
| FR-LOC-17 | D-S02.rtl | Partly designed: D-S02 `.rtl`; the full right-to-left list of states is the languages lead's and area B's |
| FR-RSH-10 | D-S02 | Gap: print-ready "read aloud" cards are a research artefact built from the prototype |
| FR-RSH-08 | D-S04, D-S11, neutral set | Designed: D-S26 `.mockFive` |
| FR-RSH-06 | D-S15, D-S20 | Gap: a two-phone prototype path for the join test; the prototype shows both sides as states, not two phones |
| FR-QAL-09 | A-S12, B-S11, B-S15, D-S19, C-S17 | Designed: undo windows in MOTION.md section 7 (the quiet-day Undo has no timer; toasts with an action never time out) |
| FR-DAY-(days) | D-S09 pattern, Day detail | Designed elsewhere: C-S26 reuses D-S09; D-S09 follows the one switch (v2) |
| FR-DAY (days) | D-S10 new states | Designed: `libraryDay-public`, `-neutral`, `-named`, `-quiet`, `twoDays` |
| FR-DAY (days) | D-S11 new state | Changed by ruling: no `.libraryDay` state, one way on Home (RV-6) |
| FR-DAY (days) | D-S06 names help line | Changed by ruling: D-S06's help says the child only; days have their own switch on C-S24 (RV-13) |
| FR-CUL-12 | D-S06, D-S10 | Changed by ruling: the day-name switch is not on D-S06; it is on C-S24 (section 5.4); disabled with a reason under App lock |
| FR-CUL-05 | D-S11 | Designed: no route parameter holds the day; plain Home when unresolved (`.libraryDay-cleared`) |
| FR-CUL-02 | D-S08, D-S09 | Designed: "a day you add" and "a day we mark" are two sections of C-S24 ("Days you added", "Days you chose") |
| FR-PHS-32 | D-S06 `journalNote` | Designed: `.journalNote` static footnote, level 2 only |
| notifications (FR-NTC) | D-S06 preview, no new switch | Designed: preview calls the planner's function; no catalogue switch (section 5.5) |
| notifications (FR-NTC) | lock-screen neutral strings for days | Designed: `libraryDay-neutral` and `-quiet` |
| FR-MKT-25 | D-S23 | No change |
| FR-LEG-08 | D-S08 | No change beyond writing tools off |
| FR-LEG-09 | D-S16 | No change |
| FR-SEC-23 | D-S14 | No change |
| FR-BKO-12, BKO-14, MSG-34, MSG-35, PRT-36, PRT-37 | D-S18, D-S19, D-S20 | No change in v2; designed in v1 (family page states) |
| FR-MSG-14, MSG-23, MSG-24, MSG-36 | D-S13, D-S14, D-S15 | No change in v2 beyond the optional pattern (D-S13) |
| FR-MSG-16, MSG-17, MSG-18 | D-S04, D-S10, D-S11 | No change; D-S25 adds the rule that no reminder advertises anything |
| FR-MSG-21 | D-S06.lateClamp, D-S07 | No change: "Late nights stay quiet." |
| FR-RSH-05 | D-S04, D-S11 | No change |
| FR-DAY-03, 06, 07, 08, 09, 10, 11, 15, 16, 19 | D-S08, D-S09, D-S10, D-S11 | Designed: DAY-07 `oneDay` and `twoDays` (section 5.3); DAY-08 to DAY-10 D-S10 states; DAY-11 and DAY-19 D-S11; DAY-06, 15, 16 D-S08 and D-S09 |
| FR-CUL-19, CUL-25 | D-S04, D-S13, D-S18 | CUL-19: the ask follows NS-47-R33 ordering (reminder prime, then Days ask, then analytics consent, each in a later sitting); CUL-25: no surface of area D shows another parent's days (NS-47-R24) |
| compliance C-01 (NS-46-R35) | D-S25, D-S06.daysRemindersOff | Designed: consent line before the first tick, visible opt-out on Reminders and Days, no advertising |
| FR-REL-45 | letter page (B) | n/a to area D |

## 15. Contradictions with product rulings (flag only, not resolved)

1. **Per-day show-words switch (GAP-LOG D G-D14, DEFAULT) against RV-8 and NS-47-R37**: one switch for every day's words. This file follows the card and RV-8 (later, wider) and shows the fallback in G-D23. Karma rules the NS-18-R3 errata row.
2. **GAP-LOG D W-G7 (typed-day section on Reminders) against NS-46-R3**: the list moves to C-S24. Followed card 21; G-D25.
3. **NS-47-R14 (day-name switch "shown only when a day is ticked") against NS-47-R37 (typed words follow it)**: a parent with only typed days would have no switch. G-D24 default.
4. **NS-46-R17 and NS-47-R38 (no `{child}` in a lock string that names a day) against the content review's neutral body text with `{child}`**: RULED 20 Nov (ruling 3): fixed string, no `{child}`; G-D26 closed.
5. **NS-46-R13 and NS-50-R4 (a day is the slip) against NS-18 (a typed day is a line in the prompt block)**: two renderings of "a day" on Home by source, as NS-50 section 3 says (A W9). It departs from IA-AUDIT 5.3 ("same component as the typed-day line"); Karma confirmed per conflict 5. Flagged only.
6. **NS-32-R4b (up to 64 total) against errata E13 (60 total)**: errata followed.
7. **GAP-LOG D G-D21 default ("Something for the book today" with names off) against WORDS G3 and the built title "A birthday today"**: the ruling is followed in D-S10 `birthday-neutral`; the founder and CPrivO still decide.
8. **NS-48-R39 ("Example") against the built "How it will look" label**: the label stays as the section heading; the element is read "Example. {title}. {body}".
9. **BRAND ban on "journal" in prose against NS-49's `journalNote` (D-S06)**: G-D27.
10. **FUNCTION-TRACE 6.4 cites "FR-CUL-12: one switch under the names switch on D-S06"**, superseded by RV-13 (Days page). Noted.


## 16. Round 2 additions (20 Nov, second founder direction): the photo-moment nudge

Source: `docs/product/prd/26-founder-direction-photos-library-and-media.md` (head `f8eead016`). Cards NS-51 (photo moments, level 3) and NS-52 (pictures and videos with a letter) are being written in file 27, which did not exist when this section was written, so everything below is keyed to the cards by name and every id is PROPOSED and flagged. Re-key to file 27's row ids when it lands. Constitution and privacy rules still bind: the nudge never describes what a picture shows, writes no caption, title or story, counts nothing, uses no exclamation mark, and nothing from the library leaves the phone (direction section 1).

Scope of area D here: only the reminder side of NS-51. The opt-in to library access, the albums, the pause, the on-phone index and its removal belong to Me (proposed C-S27 "Photo moments", flagged); the invitation shown after a tap belongs to Home's capture area (proposed A-S17, flagged); the attach flow and limits are NS-52 and areas A and B.

Ids proposed (flagged, none assigned by area D except D-S27): D-S27 (the nudge's lock-screen and in-app artefacts); D-S06 states `.photoMomentsOn`, `.photoMomentsOff`, `.photoMomentsLimited`; D-S10 states `photoMoment`, `photoMoment-plain`, `photoMoment-hidden`, `photoMoment-appLock`, `photoMoment-oneDay`; D-S11 `.photoMoment` (a plain Home landing); journeys J-D71 and J-D72; proposed ids of other areas: C-S27, A-S17, A-S18 (the opt-in sheet).

### 16.1 What the nudge is, and is not

- Not a new class and not a new notification volume. It is a ranked source of an existing budgeted class (direction section 2: "one of the existing budgeted classes (NS-32), not a new class"), like `libraryDay` (N-2): no registry row, no new pending ceiling, no new group.
- Rank (default pending Karma): a day the parent typed, birthday, a ticked day (`libraryDay`), a photo moment, month, evening. So it yields to everything the parent chose or a birthday, and takes the place of a month or evening reminder on its date. It shares the one chooser `budget.ts` (NS-46-R30): at most one budgeted reminder per local date across days, photo moments and catalogue grid cells; a property test over random plans must find no date with two.
- It adds no reminder by default: it takes the slot of an evening reminder the planner had already planned (the same stance as NS-48-R2: volume unchanged by construction). Whether it may also add a reminder on a day with none is an open question (default no, section 17).
- It needs Reminders on (it is not a date the parent chose, so the day-only gate of NS-46-R31 does not apply), notifications allowed, library access granted and the nudge switch on. A quiet or hidden book, or "Include in my reminders" off, contributes no moment and no nudge (NS-32-R14).
- Cadence cap (default pending Karma): at most one photo-moment nudge in any 7 local days, and the same back-off as evening reminders: none after day 35 with no letter (NS-13 3a), with no line anywhere about it. No streak, no "you have unwritten pictures".
- Detection is on the phone at plan time from dates, counts and clustering only; no place name (Q-PM-5 default off), no classification, no faces (direction section 1). The notification carries no count, no date, no album and no picture. `data` is `{ source, kind }` only, plus the opaque slot token as for a ticked day; no asset id, album, filename or date rides in `data`, `identifier`, `threadIdentifier`, `categoryIdentifier` or a route parameter (NS-46-R32 pattern).
- A day with a letter already made (kept, waiting at Keep, held) removes the nudge at the next re-plan (NS-13-R8).
- Never observed by analytics: no `reminder_sent`, `opened` or count; no event says how many moments or pictures exist (extends NS-46-R34).

### 16.2 Lock screen and Notification Centre (D-S10 states, drawn in D-S27)

| State | What it shows | Notes |
|---|---|---|
| `photoMoment` (default rendering, names off, previews Always, App lock off) | App; the default is the plain wording (title "Something for the book today", neutral body) per card 27 NS-51-R11 and the founder default F3: a lock screen never mentions pictures; no count, no picture described, no child name, no place, no exclamation mark | Intent only: `content` writes the key. The day-part word ("the weekend", "this week") comes from the dates, never from what a picture shows |
| `photoMoment-plain` | The default rendering (same wording as `photoMoment`), with no mention of pictures: the one neutral title ("Something for the book today") and a neutral body | Offered because a lock screen that says "pictures" tells a passer-by something about the phone; open question Q-D-R2 |
| `photoMoment-hidden` | Previews hidden: the app name and the category's neutral placeholder only ("Something for the book, whenever you have a minute."); no category sets `hiddenPreviewsShowTitle` | NS-47-R36 |
| `photoMoment-appLock` | App lock on: the plain rendering, forced, as every other class (names and pictures not mentioned) | Mirrors NS-47-R12 |
| `photoMoment-oneDay` | A photo moment and a plan notice on one date: the only allowed two; a photo moment and a birthday or ticked day on one date: only the higher shows (section 5.3) | NS-32-R4 |

Every state: interruption level `active`, never time-sensitive, no sound set by us, no badge, silent banner. The title is at most 40 characters, the body at most 110. The rules test reads the keys under the notification scope (a drift test for any new key family, NS-48-R28). Forbidden in the words: a count or a number of pictures; "memory", "moment", "story", "album", "best", "we found", "AI", "smart", "suggested for you", "journal"; anything that says the app looked at or understood a picture; "again", "another", "still", "yet", "missed", "waiting"; a gap or a streak; a child's name unless names are on, and then never beside a day name.

### 16.3 In-app artefacts (Reminders page and the tap)

- **D-S06 controls.** One switch on Me, Reminders, in the "Reminders" group under "Month and birthday messages": "Reminders about pictures" (words are `content`'s; one word "photo" through the flow, Q-FD-26), default off, present only when library access has been granted (NS-51 opt-in done). It is separate from library access: access, albums, pause and "remove what the phone has indexed" live once, on Me, Photo moments (C-S27, proposed). Turning the nudge off leaves access as it is; turning access off removes the switch and every pending nudge at once, and nothing on any screen says it was removed.
  - `.photoMomentsOn`: the switch on, one footnote: it uses the same one reminder a day, and lock screens show only neutral words (no count, no picture described). Static `footnote` in `text`; not a SystemLine.
  - `.photoMomentsOff`: switch off; footnote shortened. Nothing changes elsewhere.
  - `.photoMomentsLimited`: library access is limited (the parent chose some pictures): the same switch; no extra line (the app works with limited access, direction section 2); nothing says "fewer pictures".
  - Absent: library access not granted or the flag off (never greyed, COMPONENTS 1.2 absent rule). No "coming soon".
  - App lock on: unchanged by this switch; the lock screen rendering is forced to `photoMoment-plain` and D-S06's `.appLock` reason line is not needed because no names switch is involved. Day-name and child-name switches are not touched by this feature.
  - The preview "How it will look" shows the next planned reminder only; when the next planned reminder is a photo moment it shows its neutral rendering, via the planner's function (NS-48-R22), never a picture and never a count.
  - Opt-out is visible on this page: the same switch (compliance C-01: consent language where the parent opts in, an opt-out in the app). The opt-in itself (A-S18, proposed) carries a static `DoorNote` before any control: what the phone looks at (dates and counts, never what is in a picture, nothing leaves the phone), that a reminder may follow, and how to stop it; "Not now" is a full answer of equal weight (NS-47-R29, R30, R32 pattern).
- **Tap (D-S11 `.photoMoment`).** Plain Home within 2 s. The invitation to write about the pictures is Home's capture area's (A-S17, proposed), shown only if the moment still exists and no higher slip is due; it is never a slip, a tile or a strip (R-IA-3, NS-50-R10) and shows no count. If the pictures are gone, the library access was removed, or the token no longer resolves, plain Home opens with no line and no message. A tap while Listen, Review or Write is open does not navigate (`.whileCapturing`). With App lock on, the lock first.
- **VoiceOver and AX5.** The switch reads its state; the footnote wraps; no truncation at AX5 on an SE 3; Voice Control name equals the visible label.
- **Second account, sign-out, Erase.** Sign-out dismisses every delivered photo-moment reminder, cancels pending ones and clears the nudge setting (as NS-47-R15); account B starts with the nudge off and no access; Erase everything also removes the on-phone moment index (C-S27 owns the deletion; the FR-PRV-34 scan covers it).

### 16.3a Accessibility for every round 2 state (VoiceOver, 44 pt, contrast, AX5)

Rules for all of them: every control is 44 pt or more (the switch row is a 52 pt row, the whole width toggles); Voice Control names equal the visible words; colour is never the only signal (on and off are said in words beside the switch); text uses the existing pairs `text` and `textMuted` on `surface` in light, dark and Increase Contrast, so no new colour needs a pair test; a lock-screen rendering is the system's own and follows the phone's text size and contrast; AX5 wraps every line and stacks buttons, nothing truncates; no state announces a count or describes a picture.

| State | VoiceOver | 44 pt and AX5 | Contrast and signals |
|---|---|---|---|
| D-S06.photoMomentsOn | row reads label, "On"; footnote read after it; hint none | 52 pt row; footnote wraps below | value word "On" plus switch |
| D-S06.photoMomentsOff | label, "Off"; shorter footnote | same | value word "Off" |
| D-S06.photoMomentsLimited | as On; no extra line read | same | as On |
| D-S06 absent (no access, flag off) | nothing is read: the row does not exist | n/a | n/a |
| D-S10 `photoMoment` (plain default) | the system reads title then body; neither names a picture, a count or a place | system sizes | system contrast; the neutral title and body only |
| D-S10 `photoMoment-hidden` | the system reads the app name and the placeholder | system sizes | system |
| D-S10 `photoMoment-appLock` | as the plain rendering | system sizes | system |
| D-S10 `photoMoment-oneDay` | two separate notifications, each read on its own, never merged | system sizes | system |
| D-S11 `.photoMoment` | focus lands on the Home heading; the invitation (A-S17) is read in its place in the order, once | 44 pt controls, 64 pt twins; AX5 as A-S01 | existing Home pairs |
| D-S27 in-app artefacts | footnote and switch read as above; the "How it will look" preview reads as one element ("Example", then the neutral lines) | preview card wraps | `surface` card with `line` edge; "Example" is a word, not only a style |

### 16.4 Journeys

**J-D71 Turn on the picture reminder.** Home or Me offers Photo moments once (A-S18, C-S27 proposed); the parent grants limited or full access and picks albums; Me, Reminders then shows the switch (default off); the parent turns it on; the footnote appears; Next and the preview are unchanged unless a photo moment is the next planned reminder.
**J-D72 A reminder arrives and is tapped.** On a date with no higher-ranked source, at the evening reminder time and in place of that evening reminder, one reminder arrives with the neutral wording; tapped, Home opens plain; the capture area offers the pictures (A-S17); the parent speaks or types; the words are the parent's. Previews hidden, App lock on, or a quiet book: as the states above. Turning the switch off removes every pending nudge within the re-plan (1.5 s, NS-46-R33 pattern).

### 16.5 Gaps and engineering gaps (flagged)

| Id | What | Default |
|---|---|---|
| G-D30 | Whether a lock screen may say "pictures" at all (direction wording) | CLOSED by the locked default (NS-51-R11, Q-PM-9): plain wording is the default; a wording that says "pictures" is not drawn as a default; App lock forces plain as well |
| G-D31 | Where in the NS-32 priority list the source ranks | After a ticked day, before month and evening; Karma |
| G-D32 | Whether the nudge may add a reminder on a day with none | No: it replaces an evening slot only |
| G-D33 | Compliance C-01 applies if a photo reminder reads as promoting use of the app | Consent line at opt-in and the visible switch here; counsel reads |
| G-D34 | The 7-day cap and the day-35 back-off | Both on; Karma and `content` |
| E-D23 | Moments are found on the phone, but local notifications are planned when the app runs; how a moment found later in the background becomes a scheduled reminder (background task limits) is unverified | `mobile`; plan at foreground and re-plan; never a server push |
| E-D24 | The planner's `chooseOnePerDay` and `PlannedKind` must take a `photoMoment` source with no new class | With BL-966, NS-46-R29/R30 |
| E-D25 | Category and placeholder for the source; no key, asset id or date in the payload | BL-966, BL-987 |

## 17. Open design questions (each with a default)

| Id | Question | Default |
|---|---|---|
| Q-D-1 | Is the day-name switch placed under the list on C-S24 or on D-S06? | C-S24 (RV-13); area C draws it CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder) |
| Q-D-2 | One switch for every day's words or per day (G-D14)? | One switch (RV-8); Karma rules the errata row CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder) |
| Q-D-3 | Does D-S06 show the row "Days" before tree test T1? | Yes, under Reminders, opening C-S24 CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder) |
| Q-D-4 | Birthday lock title with names off: "A birthday today" or "Something for the book today"? | "Something for the book today" (G-D21 default); founder and CPrivO decide CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder) |
| Q-D-5 | Does a month reminder's "Month 4" belong on a lock screen? | Keep as built (G-D29) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder) |
| Q-D-6 | `journalNote` wording and whether it shows below level 2 | Shown only where level 2 exists; no "journal" CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder) |
| Q-D-7 | Is the quiet-tone Home line instead of, or under, the prompt? | Instead (RV-7, Q-FD-24) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder) |
| Q-D-8 | Day slip dismissal word | "Not today" (NS-50-R7) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder) |
| Q-D-9 | Does an AX5 Bold Text SE 3 fit both DoorNotes and the first tick sentence without scrolling past the first row? | Allowed to scroll; DoorNotes first (G-D28); device check CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder) |
| Q-D-10 | Does the remote pause also cancel delivered reminders? | No: pending only (NS-46-R28) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder) |
| Q-D-R1 | Photo-moment source rank and cap | After a ticked day; one per 7 days; no back-off exemption (G-D31, G-D34) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder) |
| Q-D-R2 | Default lock-screen wording for the photo-moment nudge | The card's wording with the plain fallback available; CPrivO decides FOUNDER-ANSWERED 20 Nov, default accepted (CL-054): Founder's example vs neutral; default neutral line, revisit with App lock off and names on |
| Q-D-R3 | May the nudge add a reminder on a day with none? | No (G-D32) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder) |
| Q-D-R4 | Does the nudge need Reminders on? | Yes CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder) |
