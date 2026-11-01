# Reminders, push and photo nudges: what works, what we build, what you decide

1 Nov 2026. Six agents (two product, two research, two design) reviewed the code, the specs and the market. I re-opened the sources they could not reach and linted every line of copy. Nothing here has run on a real phone.

## 1. Will push notifications work?

Two different things hide behind the word.

- **Local reminders (what v1.0 has).** Scheduled on the phone with expo-notifications. They need no server, so they work with servers off. The planner is pure and tested; it keeps 60 of iOS's 64 pending slots, plans 21 days ahead, and re-plans on every save, foreground and permission change. Nothing in the code has been run on a device yet.
- **Remote push (what v1.0 does not have).** No push token is requested and `app.config.ts` strips the `aps-environment` entitlement on purpose. Co-parent letter pushes (F11) and anything sent from a server need entitlement, token, a sender and consent. That is v1.1 at the earliest. F13 still says co-parent push is in v1.0; that line is wrong against D-121 and I am ruling it a doc fix.

**Correction, 1 Nov 2026.** An earlier draft of this note said no v1.0 parent would ever be asked for reminders. That was wrong. The ask card after the first letter is built and wired: Review calls `requestReminderPrime()` after the first save, the tabs layout mounts `ReminderPrimeAsk`, and a cap of two showings ever applies. `reminderPrimePending` is false in the analytics sequencer on purpose, because this card is sequenced by `lib/asks`. The card has three answers today: "Yes, evenings" (A few times a week, 8:30 PM, then the iOS alert), "Pick a time", and "No reminders". An earlier draft also called evening reminders for an undated book a bug. They are not per book, and the spec wants gentle prompts for expecting parents, so nothing changes there.

What is true, and checked in the code:

1. **Weekly fires on Sunday in code, Saturday in the spec** (`DEFAULT_WEEKLY_DAY = 0` against F13 section 6 and K-03). BL-530.
2. **Quiet hours are written in two places by hand.** `quietHelp` says "7 AM and 9:30 PM", and the card's time picker is capped at 9:30 PM in code. Both go wrong the day the window moves. BL-531.
3. **The card asks no personal question.** It does not use the child's name and offers no cadence choice. BL-532 (name, copy only) and BL-536 (cadence choice).
4. **Prompts repeat too soon.** The selector avoids the last 10 prompts (`AVOID_RECENT = 10`); the spec wants 365 days (F13-REQ-004, WP-F13-07 not built). The `before` band has 8 prompts; F13-REQ-008 wants 12. BL-534, BL-535.
5. **Back-off (C-REQ-008) is in the spec but not in the planner.** BL-537.
6. **Nothing has run on a phone.** WP-F13-08 / device row S2-15 is the first real check. BL-533.

### Journeys, as they stand in the code (none verified on a device)

| Journey | What happens today |
|---|---|
| First letter saved | Review asks for the card after the Book shows; one ask per session and per day; cap of 2 showings ever |
| Parent says "No reminders" | No iOS alert; a line says they can write whenever they like; the card can return once more |
| Parent says yes | Card is the pre-alert screen, then the iOS alert; reminders switch on whatever iOS answers |
| iOS says no | Settings shows "Notifications are off" and Open Settings; reminders start by themselves once allowed |
| Reminders on from Settings | Priming sheet first, then the iOS alert; no card later (reminders already on) |
| Expecting parent (due date only) | Evening reminders yes; month and birthday messages wait for a birth date |
| Several children | Each book has its own "Include in my reminders"; a hidden book is never reminded |
| Phone changes time zone | Wall-clock triggers keep 8:30 PM; unverified on a device |
| Plan notices (trial, renewal) | On-device notices (BL-342), one message a day |
| Co-parent letter push | Not in v1.0: needs remote push (BL-546) |

## 2. The journey I recommend

**When we ask.** Right after the first letter is saved, as the card that rises over the Book (built today). You asked for first setup. I am keeping K-02 and I will say why plainly: iOS shows its permission alert once, and a "no" is permanent for us. The only evidence for asking early is Calm's own case study (see section 6), which is a vendor claim. Asking after a first letter means the parent has just felt the product work, and we can use the name they typed. Research B has a test that can overturn this (H13: after the first letter against inside setup). If parents prefer setup, we move it in v1.1.

**What the parent sees.**
1. The card over the Book (today it has three buttons and no name): "A quiet minute for {child}?" with one personal question: "About when does {child} fall asleep?" in rough bands (before 7:30, 7:30 to 8:30, 8:30 to 9:30, later).
2. One setup screen: how often (Once a week, A few evenings a week (recommended), Every evening, No reminders), which evenings, a time with chips seeded from the sleep answer, and the "show {child}'s name on the lock screen" switch, off by default. A live preview shows the next real dates and the real words, in the neutral or named form.
3. The existing iOS priming sheet, with the parent's choice read back inside it.
4. A confirmation that lists the next reminders and what else may arrive (month and birthday messages), and a denied variant with Open Settings.
Only the resulting time is stored, never the sleep answer.

**Late evenings.** The shipped gate says nothing after 9:30 PM, and it is a tested rule. Product A and I agree: keep it for v1.0. We found no public evidence on when new parents write. A reminder at 8:30 sits on the lock screen until the parent sits down, so reminder time is not writing time. Moving it touches three requirements and the time-zone and daylight-saving property tests inside a two-day freeze. A parent-chosen maximum of 10:00 PM is a v1.1 proposal after the diary study. 10:30 PM I would not do.

**The differentiator.** Two ideas survived the benchmark and are worth testing with parents: a suggested time anchored to when {child} falls asleep, with a preview of the real words; and a nudge budget the parent can see, where a special moment (month, birthday, celebration) replaces a slot instead of adding one. Neither is yet backed by parent evidence. They are hypotheses with a test, not claims.

## 3. Variety, and the inventory

Design B wrote 87 rows and 174 variants (a lock-screen-safe neutral version and a named one for each). Types: 12 evening ideas, 8 curiosity, 6 gratitude, 6 sensory, 6 read-together, 6 month, 12 age milestones across the first 24 months, 5 birthday, 6 seasonal, 10 celebration, 6 photo, 4 return. Rotation is by shape (question, invitation, observation, tiny task, quote-a-line), not topic, with ten sequencing rules that can be table-tested in the planner. The neutral variant is the default; names show only with the existing names switch.

I ran my own lint over all 174 variants: titles at most 40 characters, bodies at most 110, no banned characters, no exclamation marks, nothing on the fear, AI, gap, gender or internal-term lists. I confirmed the lint catches deliberately bad lines. It is a copy of the patterns, not the repo suite; every row must pass `npm test` in `packages/content` before it ships. Two points for the content owner: "exactly as it came out" in a few bodies describes speaking, but sits near the Word for word promise and needs a VOICE.md read; and a switch inside "Month and birthday messages" is needed for preterm or corrected-age families.

The inventory is a v1.1 content drop. v1.0 keeps its 8 tested evening variants. Swapping copy during the freeze buys little and risks a rule failure.

## 4. Seasons, festivals, milestones

- **Milestones** come from the birth date and the planner's existing rules (month, half-birthday, birthday, one message a day).
- **Seasons** are secular and hemisphere-neutral, dated from the device calendar.
- **Celebrations are opt-in and never inferred.** The parent picks from a short list or picks none; the default is none. The list in the inventory: a generic family-celebration frame plus Lunar New Year, Nowruz, Holi, Eid al-Fitr, Diwali, Hanukkah, Christmas and Vaisakhi. A festival name can reveal faith on a lock screen, so the lock-screen line is always "A celebration today"; the name appears only behind a separate "Show celebration names" switch. The parent confirms the date, because Eid and lunar dates shift, and we ship no date table of our own claiming to know. Mother's Day, Father's Day and anything tied to a due date are left out.
- Sensitive-season rule: one tap stops everything, and a book with no birth date gets no countdown language.

## 5. The photo idea, decided hard

You want a trip or birthday photo to trigger "tell more about your recent trip", with up to 5 photos linked to the letter.

What the agents found, and where I land:
- **Photo-triggered push is not possible without reading the library.** A new photo can only start a push with full library access plus a background wake-up from iOS (not guaranteed; unverified). Detecting "a trip" means reading dates, places or scenes and guessing. That is the machine adding meaning, and it breaks the constitution, our "Data Not Collected" label and probably App Review.
- **The system picker is the right door.** A parent chooses up to 5 photos; we never see the library. expo-image-picker documents selection limits and ordering on iOS 15 and later [verified from a mirror of the Expo reference, not run on SDK 57]. Apple's PhotoKit privacy article says PHPicker is private by default [verified by fetch]. That it needs no permission prompt is Apple's design, but I have not seen it on our build.
- **The zero-permission substitute for your trip idea:** a "Moments" date the parent sets ("we are away 12 to 20 Dec"). One local nudge follows: "Back home? A few words about it are waiting." We say "trip" only if the parent typed that label. We only know what they chose.
- **Later, with counsel:** Apple's Journaling Suggestions picker (iOS 17.2 or later, Apple entitlement, custom Swift module). Day One uses it and states that apps see nothing until the person picks a suggestion [verified: Day One page]. I found no Apple source that says it can trigger a notification, and App Review may or may not grant the entitlement to a baby-memory app [unverified].
- **Data model at product level:** a letter holds 0 to 5 ordered photos; we keep a private copy with the letter; export includes them; deleting a letter deletes the copies; removing one never touches the parent's Photos app. With servers off in v1.0 we promise no photo sync.

This is a new feature plus a privacy-label and children's-data question. It is not a v1.0 item.

## 6. Evidence, with its grade

| Claim | Status |
|---|---|
| Calm: 40% of users shown a post-first-session prompt set a daily reminder; "almost 3x" retention for reminder-setters | Re-opened. Vendor page (Amplitude). It claims the experiment shows cause; it reports no sample sizes, significance or duration. Direction only. Our R1 doc calls it first-party fact and needs the label fixed |
| Headspace: precommitment raised app opens 7.5%, course starts more than doubled, users did not meditate more | Re-opened (Irrational Labs page). The 7.5% is tied to one plan type. Picking a time raises opens a little, not the habit |
| Duolingo: pool of hand-written templates, a bandit picks, new templates fade (novelty effect), recently seen ones are demoted | Re-opened (Duolingo's own 2020 post). About 200 million reminders over 34 days. The post gives no daily-active or retention numbers, so the +0.5% and +2% figures I saw elsewhere are not backed by the primary source |
| A baby-app trial (TodaysBaby): 18.8% engaged while pushes were on, 3.0% after pushes were removed | Re-opened. Not randomised, different periods, self-selected, English only. Engagement fell through pregnancy and was very low postpartum. Shows push matters; does not show how much |
| Each extra weekly promotional push raised uninstalls about 2.5 points (17,500 users, one retailer) | Research A. Retail promotions; direction transfers, size may not |
| 72% of 166 pregnancy apps do not account for loss | Re-opened (Andalibi, 2021). Supports the sensitive-season rule |
| Day One and Apple Journal use on-device suggestions; apps see data only after the person picks | Re-opened |
| Best notification time for new parents | No evidence found. A registered trial on notification timing (India, health app) has no results. 8:30 PM is a hypothesis |
| iOS permission grant rate for baby or journaling apps | No public figure. The only number is a 2025 industry median near 49%, so our 60% target is unsupported |
| Qeepsake, Tinybeans, Lifecake, Journey notification detail | Thin. Qeepsake help pages would not open for the fetch tool; marked not found, not asserted |
| One PMC parenting-app study | Blocked by a verification page; not used |

## 7. Karma's rulings and what comes to you

**Ruled (I decide, reversible):**
- K1. Keep the ask card as built, after the first letter. Put the child's name in its body (copy only, BL-532) if the content tests pass before the freeze; the cadence choice and the sleep question are BL-536 (1.0.1 or 1.1, your scope call).
- K2. Align the weekly default to the spec (Saturday), BL-530, and template the quiet hours (BL-531).
- K3. No change for expecting books (withdrawn; see the correction above).
- K4. Doc fixes (BL-549): F13's co-parent-push line moves to v1.1, and the Calm label in R1 becomes a vendor claim.
- K5. The inventory lives in `docs/`, not `packages/content`, until each row passes the content tests.
- K6. The diary study (BL-547, BL-548) needs a throwaway TestFlight build (about a day of mobile work, unverified). It waits until after go/no-go on Mon 9 Nov. Fallback: you schedule the messages by hand.

**Yours, with my recommendation and a default:**
1. **Photos.** Nothing photo-related in v1.0. v1.1: system picker plus the Moments date. Later: Journaling Suggestions after counsel. Default if you say nothing: this.
2. **The ask moment.** Keep it after the first letter (I disagree with putting it in first setup, for the reasons above). The test can change my mind. Default: keep.
3. **Late evenings.** Keep 9:30 PM for v1.0; consider a parent-chosen 10:00 PM maximum in v1.1 after the diary. Default: keep.
4. **Celebrations.** Approve the opt-in list and the "A celebration today" lock-screen line for v1.1, default none.

Plus the study logistics: recruiting, incentive, the diary form tool, and counsel review of a one-page parent consent (there is no template in `docs/`). Keep at most 5 of the 10 parents from your close circle and use a second runner for two sessions; you are a new parent and the product owner.

## 8. Risks I would not skip

- Names on the lock screen is the riskiest assumption (stays off by default).
- Tone landing wrong for a parent in a hard season. Every sensitive item in the study has a skip card, and one distressed report halts the notification for everyone.
- Photo features that read the library before there is trust. That is why they wait.
- Everything here is untested on a device. The first real check is WP-F13-08 on a phone, including a time-zone change.

Karma
