# PRD Section C: Habit loop and money

Lead C. Draft v2, 2 Oct 2026. This version applies the founder pricing decision of 1 Oct 2026.

Scope: reminders, celebrations, settings, Plus pricing, funnel analytics. **A** owns launch, intro and sign-in; **B** owns first-run, children, family, privacy, themes.

Sources: **U** USER_RESEARCH, **C** COMPETITIVE_RESEARCH, **ARCH** ARCHITECTURE, **ADR6/7/8** backup, payments, analytics; **DL/MO/CR** design docs; **V** VOICE; **S** strings.en.ts; **[P#]** platform rules (list at end); **A:** our assumption.

## 1. Goals and non-goals

**Goals**
1. **Build a calm rhythm.** Move parents from their first letter to 1 to 3 letters a week that lasts past month 6. Evidence: U §1.2 shows drop-off at weeks 2 to 8 and again when parental leave ends.
2. **Earn revenue from Plus without making the free book feel smaller.** Evidence: U §0 finding 4 shows that paywalls on past memories and billing after inactivity drive the anger in this category.
3. **Make every control easy to reach.** Every control, including export and delete, is at most 2 taps from Settings.
4. **Measure the funnel without content.** Analytics never collect any letter content (CLAUDE.md, ADR8).

**Non-goals (v1)**
- No streaks, points, badges, gap counts or leaderboards, ever (CLAUDE.md; V "no-guilt rule"; DL principle 4).
- No paywall on writing, reading, playback, export or family authors.
- No promotions in reminder channels ([P2] 4.5.4; C §7 item 14).
- No lifetime purchase or print checkout at launch. Both are P2.
- No Android at launch. Android rules are specified here so the model ports unchanged.

## 2. User stories

Parents want: a nudge at a chosen time, never late and never right after writing (U R7, §3); quiet notes as the book grows (U R20); "on this day" letters (U §5 delight 3); writing, reading, hearing and export free forever (U R15); a clear notice before any charge (U R16); everything they made, backups included, to stay theirs after a lapse (C §4 complaint 1); one-tap restore (C §7 item 21); a way to pause celebrations in a hard season (U §1.1). Grandparents want to give Plus as a gift (U §4.4).

## 3. Flows

### F1. Reminder permission, after the first letter

1. The first letter is saved and its moment shows (F3).
2. When Tonight next opens, a priming card asks "A gentle nudge, now and then?" with three choices: **Yes, evenings** (8:30 pm), **Pick a time**, or **Not now**.
3. If the parent says yes, the OS prompt follows:
   - On iOS, `requestAuthorization`.
   - On Android 13 and later, `POST_NOTIFICATIONS`, which is off by default for new installs [P11].
   - On Android 12 and earlier, no prompt.

Branches: denied saves the preference and Settings offers **Open Settings** (never re-prompt); Not now allows one more prime after the first chapter (max 2); Android rationale only when `shouldShowRequestPermissionRationale()` is true [P11]. Edge cases: invited family default to weekly (B); due-date mode starts month-age notes at birth; several children share one schedule per person, naming the most recently opened child.

### F2. Send decision

This check runs on the device. It is re-checked on every save, every foreground, and every settings change.

A slot sends only if: local time is 07:00 to 21:30; no save by this user in 20 hours; app not foregrounded in 2 hours; no reminder or plan notice today; celebrations not paused; not the birthday (the birthday note replaces it).

**Back-off:** 4 unopened reminders in a row drop cadence to weekly; 4 more leave only the month-age note, plus one in-app card "Would fewer nudges suit you better?" (no numbers). Any save restores the chosen cadence.

### F3. Celebrate

- Milestones appear as inline Book cards placed at the letter that reached them, once per reader. They never appear as a modal or a push (MO §5(h)).
- "On this day" cards appear on Tonight (DL §12).
- Year One appears on the first birthday.

### F4. Plus: trial, renewal, lapse

```
Free tier forever (write, read, play, export, family authors)
  Value-moment offer (never at launch): first month chapter complete | 2nd child added | "Turn on backup" | after 3rd Read together taste
    -> Plus sheet: Annual $29.99 (2 months free) | Monthly $3.99 (1 month free) | Not now
       Intro-offer eligibility checked per store; ineligible users see the price without trial copy
    -> Trial starts: confirmation sheet + email (end date, price, how to cancel)
    -> Trial-ending notice: D-3 push + email + in-app card (annual trial also D-7)
    -> Converts (store charges) -> renewal notices: annual D-7; monthly none (date in Settings)
    -> Cancel / billing failure -> store grace period -> lapse to Free (see 4.3)
```

Edge cases:
- **Trial on Monthly, then switching to Annual.** Apple allows one introductory offer per subscription group [P1], so there is no second trial. The sheet shows the price only.
- **Two parent-admins on one book.** The book has Plus if either admin holds it (A: per-book entitlement, OQ3).
- **Refund.** The entitlement is removed and the book drops to Free. Letters, audio and existing backups are untouched.
- **Account deletion while subscribed.** Explain that billing continues through Apple and link to manage subscriptions [P4].
- **Gift (F5).** A family member buys "A year of Plus for {child}'s book". This is a non-renewing purchase, granted to that book on the server. Refunds go to the purchaser only [P2 3.1.1].

## 4. Pricing (decided 1 Oct 2026)

### 4.1 Free forever versus Plus

| Capability | Free, forever | Plus | Why |
|---|---|---|---|
| Write notes and letters, spoken or typed, unlimited | Yes | Yes | Writing is the habit. Gating it caps the book (U R15; C §5 item 6). |
| Read, play original audio, export PDF and ZIP | Yes | Yes | "Never held hostage" (C §7 item 5; U R15). |
| Family authors, invites, approvals | Yes | Yes | Gating co-parents gets criticised (C §2 takeaway c; C §7 item 8). |
| Encrypted backup of letters and recordings (ADR6) | Letter text syncs (ARCH §4 step 7). Audio stays on the phone. | **Plus** | The real ongoing cost is cumulative audio storage, about 19 MB per family per month (ARCH §7). Cloud support is a named valid subscription use [P2 3.1.2(a)]. |
| Read together (playback with word highlight) | 3 sessions to try (A) | **Plus** | The most emotional moment in the category is hearing a voice (C §4 praise 4). C §5 item 2 says it is unclaimed in baby books. It is the natural value moment (U R20). |
| More than one child's book | First book | **Plus** for each extra book | Second children get far less (U §1.4). Families with 2 or more children are deeper users (A). |
| Extra themes and book covers | Default theme | **Plus** | Cosmetic and low-risk. Day One and Dearest charge for extras (C §2). B owns themes. |
| Printed-book credit (annual) | None | P2, once confirmed with App Review | Print is the category's profit engine (C §3). See OQ2 for the risk. |
| Lifetime ~$99.99 | None | P2 non-consumable | U §4.3 verdict; C §6 recommendation. |

**The keep-and-leave rule (P0).** Nothing in Plus may be needed to keep or take away what a family has made.
- A free family's text syncs, and their audio lives on the phone.
- Export is free and works offline.
- After a lapse, anything already backed up stays stored, restorable and downloadable forever (§4.3).
- Honest gap: a free user who loses their phone without exporting loses audio that was never backed up. This is mitigated by C-REQ-018 export nudges and by iOS device backup of app data (Unverified for our sandbox paths, OQ5).

### 4.2 Store mechanics (verified)

| Item | Apple (launch) | Google Play (later) |
|---|---|---|
| Monthly $3.99 with a 1-month free trial | Auto-renewable subscription. Free-trial intro offers may be "3 Days. 1 or 2 Weeks. 1, 2, 3, or 6 Months. 1 Year" [P1], so 1 month is allowed. The plan must last at least 7 days and give "ongoing value" [P2 3.1.2(a)]. Describe what Plus gives before asking anyone to subscribe [P2 3.1.2(c)]. | A free-trial phase on the monthly base plan. Trials can be "3 days to 3 years" [P6], so 1 month is allowed. Disclose how and when the trial converts, the price, and how to cancel [P7]. |
| Annual $29.99 with a 2-month free trial | Same subscription group, with its own intro offer. 2 months is allowed [P1]. Each person can redeem "one introductory offer per subscription group" [P1]. | A trial phase on the annual base plan. 2 months is allowed [P6]. Eligibility is set to new customers only [P6]. |
| Lifetime ~$99.99 (P2) | A non-consumable, which may be offered "alongside à la carte offerings" [P2 3.1.2(a)]. It must be restorable [P2 3.1.1]. | A one-time product. Acknowledge it within 3 days or it is auto-refunded [P10]. |
| Grace period | Turn on Billing Grace Period. The duration option is OQ4. | Grace period plus account hold "must total 30 days or more" [P6]. |
| Family Sharing | Available for auto-renewables and non-consumables [P13]. Once turned on, it "can't" be turned off [P3]. **Off at launch.** The per-book entitlement already covers the co-parent. | Family Library "can't share in-app purchases" [P9]. |
| Gift | "Apps may enable gifting of items that are eligible for in-app purchase... refunded to the original purchaser" [P2 3.1.1]. Use a non-renewing purchase type [P13] with a server grant. Offer codes cover every IAP type but are distributed, not sold [P5]. | Not native. Use the P2 web code. |
| Web gift code (P2) | Items bought on the web may be used in the app if they are also sold as IAP [P2 3.1.3(b)]. No external purchase links in v1 (ADR7). | Same. |
| Printed books | Physical goods "must use purchase methods other than in-app purchase" [P2 3.1.3(e)]. Card or Apple Pay, then Lulu (ADR7). | Same. |
| Refunds | Developers cannot issue Apple refunds [P12]. Offer `beginRefundRequest` [P4]. | The developer can refund through Play Console or RevenueCat [P12]. |

Net after 15% (ADR7): about $3.39 a month, $25.49 a year. We send our own trial notices (Apple's are unverified; Google also emails [P8]). Existing payers keep what they bought if the model changes [P2 3.1.2(a)].

### 4.3 Notices, lapse and support

| Event | What happens |
|---|---|
| Trial starts | An in-app sheet and an email. They give the end date, the price after, and how to cancel (manage-subscription link). |
| Trial ending | **3 days before**: a "Your plan" push, an email and an in-app card. For the annual 2-month trial, also 7 days before. Never sent on a birthday; moved a day earlier instead. |
| Renewal | Annual: email and in-app card 7 days before. Monthly: next date shown in Settings, no push. |
| Dormant payer (P1) | Plus with no saves in 60 days: one email on how to pause or cancel, at most every 6 months (U §5 fear 2). |
| Price change | Email and in-app notice 30 days ahead, plus the store consent flow. |
| Lapse to Free | Writing, reading, playback, export and family stay unchanged in **every existing book, including extra children's books**. Only creating a further book needs Plus. Backed-up audio stays stored, restorable and downloadable forever, but new recordings stop uploading. Settings says plainly: "New recordings are kept on this phone." Read together returns to the try state. Themes fall back to default, and no content changes. |

## 5. Requirements

### Reminders

**C-REQ-001 (P0) Primed permission after the first letter** (U R7; C §7 item 10; [P11]).
- Given first-run in A or B, when any screen shows, then no OS notification prompt appears.
- Given the first letter is saved, when Tonight next shows, then the priming card comes before any OS prompt.

**C-REQ-002 (P0) Default cadence: 2 evenings a week plus the month-age note.** Tuesday and Saturday at 20:30, plus `notifications.monthOpen`. Options: Off, Weekly, A few times a week (default), Every evening (U R7: 2 or fewer a week). **S must change:** `onboarding.reminder` ("One gentle nudge a day") and `settings.reminders.timeLabel` ("Daily reminder") contradict this.
- Given the default and a quiet week, then at most 2 reminders plus 1 month-age note are delivered.

**C-REQ-003 (P0) Time choice.** The picker runs from 07:00 to 21:30 in 15-minute steps and follows the device time zone and daylight saving.
- Given a user tries 22:30, then the time clamps to 21:30 and the app says "We keep late nights quiet."
- Given the user travels from LA to New York, then the reminder fires at the chosen local time.

**C-REQ-004 (P0) Smart quiet** (F2).
- Given a save at 19:00, when the 20:30 slot arrives, then nothing sends and `reminder_suppressed{reason:recent_entry}` is logged.
- Given a time zone shift puts a slot at 23:00, then the slot is dropped.

**C-REQ-005 (P0) No streaks or gap counts in any string** (CLAUDE.md; V; U R9).
- Given the content test runs, then any notification, card or setting containing "in a row", "missed", "since your last", "streak" or a day count fails the test.

**C-REQ-006 (P0) Copy rotation.** Rotate through the 8 `notifications.evening` variants. No variant repeats within 4 sends, and no title appears twice in a row. `gentleReturn` is used only during back-off, at most once every 30 days. Evidence: U §3 and C §4 complaint 7 show that repeated prompts get muted.
- Given any 4 consecutive reminders, then all 4 variant ids are different.

**C-REQ-007 (P0) One-tap pause and separate channels.** Settings has "Pause all reminders". On Android, the channels are Reminders, Family letters and Your plan. iOS uses matching categories.
- Given the Reminders channel is muted, when a family letter arrives, then the notification still shows.

**C-REQ-008 (P1) Back-off** (F2).
- Given 4 unopened reminders in a row, then the cadence becomes weekly and the card shows with no numbers.

**C-REQ-009 (P1) Lock-screen privacy.** "Show {child}'s name in notifications" is on by default. Letter text never appears in a push ([P2] 4.5.4).
- Given the setting is off, then notifications say "your little one" and show no names.

### Celebrate

**C-REQ-010 (P0) Quiet milestones** (S `moments`): first letter; 10, 50, 100, 365 letters (book total); first month chapter; first grandparent or family letter; first Read together. Inline Book card, once per reader; no modal, push, sound, extra haptic or confetti (MO §5(h), §6; CR §6; U R20). 100 letters offers "Hear the first one."
- Given the 100th save, when the Book opens, then the card shows once and never repeats.
- Given Reduce Motion is on, then the drawing shows complete and the text fades in over 200 ms.

**C-REQ-011 (P0) Birthdays and month-ages.** `notifications.birthday` sends at 09:00 and replaces that day's reminder. The month-age note sends at the reminder time on the monthly birthday.
- Given a birth date on the 31st, when the month has 30 days, then the note fires on the 30th.

**C-REQ-012 (P0) Pause celebrations, per book.** This covers milestones, birthdays, month-ages and resurfacing. Evidence: U §1.1 (divorced parents); A (loss, estrangement). B places the toggle.
- Given pause is on, when the birthday arrives, then nothing is sent or shown.

**C-REQ-013 (P1) Year One.** On the first birthday, the Book shows a Year One cover (CR §6) with Read together, a free PDF, and "Tell me when printing opens." No Plus offer that day.
- Given the first birthday, then the card shows and the Plus offer is suppressed for 24 hours.

**C-REQ-014 (P1) "On this day."** Show "One month ago" or "One year ago today" on Tonight, at most one card a day. Use only letters that are in the book and visible to the viewer. Exclude sealed letters and any entry with a `safety_events` row.
- Given the only candidate has a safety tier, then no card shows.

**C-REQ-015 (P0) Never celebrated:** streaks, frequency, speed, comparisons between authors, per-author totals, developmental milestones as app events, and plan status.
- Given any moment string, then it has no comparatives and no per-author counts.

### Settings

**C-REQ-016 (P0) Settings information architecture.** Every row is at most 2 taps from Settings.

| Section | Rows | Owner |
|---|---|---|
| Account | Name, sign-in method, sign out | A |
| Children, Family | Child, birthday or due date, members, roles, invites, approvals | B |
| Privacy | Audience, AI consent (ARCH §8), lock-screen names | B, plus a C row |
| Reminders | Cadence, time, pause, channels | C |
| The book | Sign my letters as, pause celebrations | B, C |
| Appearance and reading size | Theme (B; Plus extras marked), Reading Size, Large Print (DL principle 6) | B, C |
| Recordings and backup | Keep recordings, storage used, encrypted backup (Plus), Vault mode (ADR6), download backed-up audio | C |
| Plan | Free or Plus status, trial end or renewal date, see Plus, restore, manage subscription, request a refund | C |
| Your data | Export everything, Recently deleted, delete book, delete account | C |
| Help, Legal | Support (prefilled with app version and plan state, no content), Terms, Privacy, Licences, shutdown and portability pledge (C §7 item 6) | C |

- Given VoiceOver, then each row reads its label and value, for example "Reminders, a few times a week, 8:30 PM".

**C-REQ-017 (P0) Export, free forever.** Export works offline in every plan state (ARCH §8).
- Given a lapsed user with 400 letters, when they tap Export everything, then the ZIP holds all entries, audio, PDF and README, and no Plus UI appears.

**C-REQ-018 (P0) Keep-safe nudge for audio that is not backed up.** For Free users with recordings that are only on the phone, a Settings line shows: "Recordings live on this phone. Export or turn on backup to keep a copy." At each Year One or chapter milestone, show one soft card. This is not a sales screen. Export comes first; backup is second.
- Given a Free user completes a month chapter, then the card offers Export as the primary action.

**C-REQ-019 (P0) Delete account and data.** The flow is: offer export first (S `bookExportFirst`), then a 30-day undo, then type to confirm. Subscribers see that billing continues through Apple, with a manage link, before they confirm [P4].
- Given an active subscriber, then the manage-subscription step comes before the final confirm.

**C-REQ-020 (P0) Restore purchases.** Restore covers subscriptions, gifts and, later, lifetime [P2 3.1.1; C §7 item 21].
- Given an annual subscriber on a new iPhone, when they tap Restore, then Plus shows within 10 seconds.

### Plus, trial and paywall

**C-REQ-021 (P0) Products and entitlement.**
- Products: `el_plus_monthly_399` (1-month trial) and `el_plus_annual_2999` (2-month trial), in one subscription group.
- Both map to the RevenueCat `plus` entitlement (ADR7).
- The entitlement applies to the book, so every member's Plus features work there.

- Given Mama holds Plus, when Papa (co-admin) opens Read together on that book, then it works without a second purchase.

**C-REQ-022 (P0) Plus sheet content and eligibility.**
- The sheet lists what Plus adds (§4.1) and states the promise line.
- Neither plan is preselected (U R16). "Not now" is always visible.
- Trial copy appears only if StoreKit or Play reports the user as eligible [P1, P6].
- The full price, the period, auto-renewal, and how to cancel are visible at the default text size [P2 3.1.2(c); P7].

- Given a user who already used a trial, then the sheet shows "$29.99 a year" with no "free" wording.

**C-REQ-023 (P0) Offer placement.** The offer appears only at the F4 value moments, and only when the user taps a Plus feature (backup, second child, Read together after the free tries, themes).
- It is never shown at launch, during recording or export, in the Book list, or on a birthday.
- After "Not now", it reappears at most once per month-age chapter.
- Evidence: U R17 (offer at a value moment); C §4 complaint 1.

- Given a Free user opens a letter, then Play and the text work with no Plus UI.

**C-REQ-024 (P0) Trial start notice.**
- Given a trial starts, then the in-app sheet and an email state the end date, the price after, and how to cancel (manage link), and `trial_started` is logged.

**C-REQ-025 (P0) Trial-ending notice, at least 3 days before.**
- Given a monthly trial ends in 3 days, then exactly one push, one email and one in-app card go out, and no reminder sends that day.
- Given an annual trial, then notices go out at both 7 and 3 days before.
- Given push is off, then the email and in-app card still go out.

**C-REQ-026 (P0) Renewal notices** (§4.3).
- Given an annual renewal in 7 days, then one email and an in-app card state the date, price and cancel route.

**C-REQ-027 (P0) Grace and billing retry.** Turn on Apple Billing Grace Period and the Google grace period plus account hold [P6]. During grace, Plus keeps working and a card says "There's a problem with your payment. Your letters are fine."
- Given a failed renewal, then Plus continues through grace and lapses only after it ends.

**C-REQ-028 (P0) Lapse behaviour** (§4.3).
- Given a lapsed user with 2 child books, then both stay fully writable and readable, and adding a third book shows the Plus sheet.
- Given a lapsed user with 3 GB of backed-up audio, then all of it stays playable, restorable on a new phone, and included in Export.

**C-REQ-029 (P0) Refunds.** `beginRefundRequest` sits under Plan on iOS 15 and later [P4]. Google refunds go through RevenueCat [P12]. A refund removes only the entitlement. Print refunds, later, are ours (ADR7).
- Given an Apple refund, when the webhook arrives, then the book is Free and no letter, audio or backup changes.

**C-REQ-030 (P1) Gift a year of Plus.** A family member buys `el_gift_plus_year_2999`, a non-renewing purchase [P13], from Family. It grants 12 months of Plus to one book. Parents see "{signsAs} gave {child}'s book a year of Plus." Shortly before the gift ends, the book's admins get one notice; nothing renews automatically.
- Given Nani gifts Asha's book, then both admins have Plus for 12 months and Nani is never charged again.

**C-REQ-031 (P1) Dormant-payer email.**
- Given a subscriber with no saves in 60 days, then one email goes out, with none again for 6 months.

**C-REQ-032 (P2) Lifetime, around $99.99, non-consumable.** Restorable, and it grants `plus` for good.
- Given a lifetime buyer on a new device, when they tap Restore, then Plus is active.

**C-REQ-033 (P2) Web gift code and printed books outside IAP.**
- The web code is redeemed under [P2 3.1.3(b)].
- Printed books are paid by card or Apple Pay through Lulu [P2 3.1.3(e)]. Show a full preview and all costs before checkout (C §7 items 17 and 18).
- An annual print credit ships only after App Review confirms it (OQ2).

### Analytics

**C-REQ-034 (P0) Funnel events.** Properties are enums, counts and durations only (ADR8).

| Area | Events |
|---|---|
| Reminders | `reminder_prime_shown{source}`, `reminder_prime_result{choice}`, `os_permission_result{granted,platform}`, `reminder_schedule_set{cadence,hour_bucket}`, `reminder_sent{type,variant_id}`, `reminder_suppressed{reason}`, `notification_opened{type,variant_id}`, `letter_saved{from_notification_2h}` |
| Celebrate | `moment_shown{type}`, `resurface_shown{kind}`, `resurface_opened{kind}` |
| Data | `settings_changed{key}`, `export_started{format}`, `export_completed{size_bucket}`, `account_deletion{stage}` |
| Plus | `plus_offer_viewed{trigger}`, `plus_offer_dismissed{trigger}`, `purchase_started{product}`, `trial_started{product}`, `trial_notice_sent{days_before,channel}`, `trial_converted{product}`, `trial_cancelled{product}`, `renewal{product}`, `billing_issue`, `plus_lapsed{reason}`, `purchase_failed{error_class}`, `restore_result{outcome}`, `refund_detected{product}`, `gift_purchased`, `read_together_try_used{n}` |

- Given any event, when `before_send` runs, then no string longer than 40 characters, no child name, no email and no letter text gets through.
- RevenueCat's `appUserID` is a random id.

## 6. Non-functional requirements

| ID | Requirement |
|---|---|
| **C-NFR-001 Notification delivery** | Reminders are scheduled locally, so they work offline and carry no content to any server. They are rescheduled on save, foreground, time zone change and settings change. At least 99% fire within 15 minutes of the slot (Android uses inexact alarms). Zero notifications between 21:30 and 07:00. Plan notices are server-driven from RevenueCat webhooks, sent by APNs or FCM with an idempotency key, and also by email. At least 99.5% of trial-ending notices are sent 3 or more days ahead. |
| **C-NFR-002 Purchase reliability** | Entitlement is active within 5 seconds of store success (p95). Webhooks reconcile within 60 seconds. Google purchases are acknowledged within 1 hour [P10]. Zero double grants. Purchase error rate under 1%. |
| **C-NFR-003 Restore** | At least 99% of restores succeed within 10 seconds, after a reinstall or on a new device, including gifts. |
| **C-NFR-004 Fail-open for memories** | Writing, reading, playback, export and downloading backed-up audio never call the entitlement service. The last known entitlement is cached for 7 days. |
| **C-NFR-005 Privacy** | No content in analytics, logs, push payloads or support prefill (CLAUDE.md). No ad or tracking SDKs, so no ATT prompt. |
| **C-NFR-006 Accessibility** | Dynamic Type up to AX5, with no truncated prices or terms. 44 pt targets. VoiceOver reads price, trial and renewal together. Reduce Motion is honoured. No time-boxed UI (DL §11). |
| **C-NFR-007 Performance** | Settings opens in under 300 ms. The Plus sheet shows cached prices in under 1 second. A 1-year export (about 230 MB, ARCH §7) completes offline in under 2 minutes on an iPhone SE (3rd generation). |
| **C-NFR-008 Backup durability after lapse** | Backed-up blobs of lapsed users are never deleted. Only account or book deletion removes them (ARCH §8). |
| **C-NFR-009 Remote config** | Cadences, the quiet window, copy rotation, offer triggers and the number of Read together tries change without a release, and every change is audit-logged. |

## 7. Copy rules (V; CLAUDE.md)

- **Notifications.** One idea, under 60 characters if possible. Invite, never remind. No counts, no days-since, no urgency. At most one exclamation mark a month.
- **Plan copy.** It may state prices and dates. Never write "unlock", "premium", "expire", "lose" or "locked" (V: not "Unlock bedtime mode"). The word "trial" may appear only in store-required disclosure text. Elsewhere, say "free month" or "free months".
- **Promise line.** Every Plus surface includes: "Writing, reading, listening and export are free, always. Plus adds a few extras."
- **Names and prices.** Use `{child}` and never gender the child. Use localized `{monthlyPrice}` and `{annualPrice}` from the store. Never hardcode prices (BRAND "Proof discipline").

Draft new strings:

| Key | Copy |
|---|---|
| `reminder.prime` | "A gentle nudge, now and then?" / "A couple of evenings a week, at a time you pick. Never late at night." |
| `plus.sheet` | "Plus, for {child}'s book" / "Backup for every recording, Read together, more than one book, and new covers. Writing, reading, listening and export are free, always." |
| `plus.trialStart` | "Your free month starts today. Plus renews at {monthlyPrice} on {date} unless you cancel." |
| `plus.trialEnding` | "Plus renews on {date}" / "{price} from then. Change or cancel any time in Settings." |
| `plus.lapsed` | "Plus has ended. Everything you made is still here, and you can keep writing." |
| `backup.keepSafe` | "Recordings live on this phone. Export or turn on backup to keep a copy." |

## 8. Decided Oct 1 2026, and the trial experiment

> **Decided Oct 1 2026 (founder).** Writing, reading, playback, export and family authors are free forever. Plus costs $3.99 a month with a 1-month free trial, or $29.99 a year with a 2-month free trial. Lifetime at about $99.99 is P2. Printed books are paid outside IAP. This replaces the earlier 6-months-free, $1.99, $49.99 baseline. Both research reports supported the change: trials under 6 months, a $3.99 to $29.99 price band, and a higher lifetime price (C §6; U §4.2, §4.3).
>
> **Experiment: tune the trial**
> - **Question:** does trial length change paid conversion, and does it hurt trust?
> - **Arms (annual product):**
>   - A: 2-month trial (baseline)
>   - B: 1-month trial
>   - C: 2 weeks
>
>   Each arm is a separate annual product ID in the same group, assigned through RevenueCat offerings at the first Plus offer view. The unit is the account owner. US storefront only. The monthly product stays at 1 month in all arms.
> - **Primary metric:** paid conversion per Plus offer viewer at day 120. This covers every trial plus the first renewal decision.
> - **Secondary metrics:** trial start rate, and net proceeds per offer viewer.
> - **Guardrails:** refund rate under 3%; 1 to 2 star reviews that mention billing; active writers at day 120 (no arm more than 3 points below A).
> - **Sample:** the median for 17 to 32 day trials is about 42 to 46% trial-to-paid (U §4.2). Detecting a 6-point change in conversion (for example 40% to 46%, alpha 0.05, power 0.8, two-sided) needs about 1,100 trial starters per arm, or 3,300 in total (A: base rates assumed).
> - **Duration:** at an assumed 40 trial starts a day, enrolment takes about 85 days, plus 120 days of observation, so roughly 7 months. An early read on trial-start rate is possible at day 30.
> - **Fairness:** each person gets one introductory offer per group anyway [P1]. People who already pay are never moved.

## 9. Success metrics

These targets are assumptions (A) until the first cohorts.

| Metric | Target |
|---|---|
| iOS opt-in after priming | ≥ 60% (U §3) |
| Reminders muted or turned off, per month | ≤ 10% |
| Letter saved within 2 hours of a reminder | ≥ 12% of delivered |
| Active writers at week 4 / first-letter users | ≥ 35% (category D30 is 3 to 7%, U §1.2) |
| Active writers in month 6 | ≥ 20% |
| Trial starts / first-letter users by day 90 | ≥ 15% |
| Trial to paid | ≥ 40% (U §4.2 median band) |
| Annual share of Plus | ≥ 60% |
| Refund rate | < 3% |
| Billing tickets per 100 payers per month | ≤ 2 |

## 10. Open questions

1. **OQ1. Read together is gated for Free users after 3 tries.** BRAND pillar 2 and U R20 treat it as core. Does gating it weaken the brand promise? An alternative is to keep it free and charge for print and backup instead. This needs founder confirmation.
2. **OQ2. Printed-book credit inside an IAP annual plan.** Is it allowed under 3.1.3(e)? A discount at card checkout may be safer. Ask App Review.
3. **OQ3. Plus scope.** Per book (good for gifts) or per account (simpler)?
4. **OQ4. Apple Billing Grace Period length.** The options are not verified.
5. **OQ5. iOS device backup.** Does iOS device backup include our app's audio directory? This decides how risky Free audio is.
6. **OQ6. Second child behind Plus.** U R3 wants a second child added in 3 taps or fewer. We keep that flow but end it at the Plus sheet. Is that acceptable?
7. **OQ7. Copy and pricing for diaspora families.** Hindi or code-switched notification copy (U §1.4), and India storefront pricing for gifts.
8. **OQ8. Invited family reminders.** Weekly by default, or none until they opt in?

## 11. Dependencies on A and B

**A (sign-in)**
- The account identity drives RevenueCat `appUserID`, restore and deletion.
- Trial and renewal emails need an address. Apple private relay is fine.
- The intro and the App Store may say "free to write, read and export, always". No price is shown before value (U R1).

**B (first-run, children, family, privacy, themes)**
- B does **not** ask for notification permission. `onboarding.reminder` moves to C's card after the first letter and gets rewritten.
- The birth date or due date drives month-ages and birthdays.
- "Add child" ends at the Plus sheet for a second book.
- The parent-admin role defines the Plus scope.
- Themes mark which ones are Plus.
- Privacy hosts the toggles for lock-screen names and pausing celebrations.
- The Family screen hosts the gift entry point.

## Platform sources (opened 1 to 2 Oct 2026)

- [P1] Apple, introductory offers: https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions/
- [P2] Apple, App Review Guidelines 3.1.1, 3.1.2, 3.1.3, 4.5.4: https://developer.apple.com/app-store/review/guidelines/
- [P3] Apple, Family Sharing for IAP: https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/turn-on-family-sharing-for-in-app-purchases
- [P4] Apple, account deletion (billing notice, `showManageSubscription`, `beginRefundRequest`): https://developer.apple.com/support/offering-account-deletion-in-your-app/
- [P5] Apple, offer codes for all IAP types: https://developer.apple.com/news/?id=gf6mgrs6
- [P6] Google Play, Understanding subscriptions (trials 3 days to 3 years; grace and hold): https://support.google.com/googleplay/android-developer/answer/12154973
- [P7] Google Play policy, Subscriptions: https://support.google.com/googleplay/android-developer/answer/9900533
- [P8] Google Play Help, trial-end email: https://support.google.com/googleplay/answer/2476088
- [P9] Google Play, Family Library: https://support.google.com/googleplay/answer/7007852
- [P10] Android, acknowledge purchases within 3 days: https://developer.android.com/google/play/billing/integrate
- [P11] Android, notification runtime permission: https://developer.android.com/develop/ui/views/notifications/notification-permission
- [P12] RevenueCat, refunds: https://www.revenuecat.com/docs/subscription-guidance/refunds
- [P13] Apple, In-App Purchase types and Family Sharing: https://developer.apple.com/in-app-purchase/
