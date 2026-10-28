# F13 Prompts, reminders and notifications

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 15 (`05-feature-map.md` section 2) |
| Personas | P1 Evening parent, P2 Co-parent, P3 Expecting parent, P4 Multilingual family |
| Existing IDs | C-REQ-001 to C-REQ-009, C-REQ-011, C-REQ-012 (notification half), C-NFR-001, C-NFR-005, C-NFR-006, C-NFR-009, B-REQ-014, B-REQ-015, PRD-REQ-001, PRD-REQ-005, PRD-REQ-013, LEGAL-REQ-014, LEGAL-REQ-054, D-025, D-035, DR-12, K-02, K-03, K-12; BL-022, BL-023, BL-151, BL-157, BL-196 |
| Depends on | F02 (ask sequencer, `nextAsk`), F03 (birthday or due date), F09 (month chapters, celebrations in the book), F11 (co-parent letter push, `notify_letters`), F12 (hide, include in reminders), F14 (plan reminder dates for the day rule, 4 reserved slots and the "Your plan" row; F14 owns the plan reminders themselves: local notices on the phone (BL-342) and server emails from the status-only report (D-080)), F17 (Settings shell), F19 (content blocks, remote config) |
| Status | Draft V2, 3 Oct 2026; plan-reminder rows revised 13 Oct 2026 for M6 (D-080, D-081, BL-342): plan reminders come from on-device notices plus server emails, both owned by F14; letter reminders stay local only. Revised again 13 Oct after critique round 1: M14 makes co-parent letter pushes v1.0 (R1 PL-04); DR-12 default is now B, the reminder prime right after the first letter (R1 PL-19; the Calm evidence relabelled [S], R3 DX-32); "Quiet this book" (R3 DX-05) and the early-birth reminder question (DX-18) feed the planner; Apple's rating request (R1 PL-29); proposed copy for new keys (DX-25); one home per requirement id (R5 EQ-05, EQ-19); local schema numbering (EQ-23); WP status (EQ-25). Dates are milestone ids in `08-delivery.md` section 2.1 |

## 1. Why

- [S] Prompts and reminders are the most praised feature of prompted baby books: 27 reviews praise them. The top prompt complaint is repetition or prompts that do not fit the child's age: 4 reviews, all at Qeepsake, one saying they may cancel over it [S] R2 section 0 item 4, theme T5.
- [S] Too many messages across text, email and push draws 5 more complaints, including marketing texts during postpartum and a pregnancy notification that felt wrong [S] R2 theme T6, R2-S14; R1-S56.
- [S] The strongest published habit pattern is Calm's: a reminder ask right after the first completed session; 40% of those shown set a reminder and they retained 3x better. The source is an analytics vendor's case study, and the claim that it is causal is the vendor's [S] R1-S57.
- [F] Headspace's precommitment (the user picks days and triggers) raised app opens 7.5% with no gain in active days [F] R1-S58. Picking the evening helps a little; it is not the habit.
- [S] A no-pressure tone and short entries reduce journaling guilt; tracking can make parents stress about consistency [S] R2 theme T27.
- [F] The shipped selector avoids only the last 10 prompt keys (`AVOID_RECENT = 10` in `packages/core/src/prompts.ts`), so a parent who opens Tonight most evenings sees repeats within weeks. The library has 103 prompts; the 0-3 month opening pool is 18 (10 any-age plus 8) [F] `packages/content/src/prompts.ts`, counted 3 Oct.
- [F] An expecting parent with no birthday gets newborn prompts: Tonight passes `ageMonths: 0` when there is no birthday (`apps/mobile/src/app/(tabs)/index.tsx`, `selectPrompt` call), so "Describe {child}'s hands" can show during pregnancy. No pregnancy prompt exists in the library (searched 3 Oct).
- [D] Prompts are server-delivered content blocks with an offline last good copy (B14). Lock-screen names are off by default (D-025). Reminders are a few evenings a week plus the month-age note (K-03). Co-parent letter pushes ship in v1.0 with sign-in (M14; F11 owns them; this planner gives them its budget and quiet rules).
- [R] The reminder prime comes right after the first letter, and the account ask comes in session 2 or after letter 2 (DR-12 B, spec default since 13 Oct; R1 PL-19). Habit fade (U7) is a likelier loss than a phone lost in the first days. The C1 cohort test of A against B decides at T34 if cohort sizes allow; F02 owns the ask order and adopts it.

## 2. Who

| Person | Moment | Holding, feeling, short of |
|---|---|---|
| P1 Evening parent | 20:00 to 21:30, baby just down, phone in one hand | Minutes, sleep. Wants one idea to start with and a nudge that never scolds. Fears a count of what they missed (02 section 6 item 4) |
| P2 Co-parent | Own cadence, often less frequent (UR S25, S30) | Wants to know when the other parent added a letter, without the letter showing on a lock screen at work |
| P3 Expecting parent | Third trimester, then a birth that may come early, late or not as planned | Must never get a due-date countdown or a nudge during labour, a NICU stay or a loss (B-REQ-015; R2-S14). Setting a birth date well before the due date must not switch reminders on by itself (R3 DX-18) |
| P4 Multilingual family | Writes in Hindi, Spanish or another launch language | Prompts and notifications are English at v1.0 (B4 keeps the UI in English); the letter is in their language |
| Anyone in a hard season | Separation, illness, loss | Needs one tap to make every nudge stop (C-REQ-007, C-REQ-012; UR section 1.1), and for one child, Quiet this book from a notification's long-press (F12-REQ-011) |

## 3. What we are solving

**Outcome.** A parent gets a fresh, age-right idea to start each letter and a nudge at a time they chose, never more often than they asked, never late at night, and never anything that counts, pressures or exposes their child.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Notification permission granted after the prime | 60% or more [A] (C section 9) | `os_permission_result{granted}` over `reminder_prime_result{choice: yes}` | Opt-in analytics only |
| Letters saved within 2 h of a delivered reminder | 12% or more of delivered [A] (03 section 4.2) | `letter_saved{from_notification_2h}` over `reminder_sent` | Opt-in analytics only |
| Reminders muted or turned off per month | 10% or less [A] (03 section 4.3 guardrail) | `settings_changed{key: reminders}` plus `reminder_schedule_set{cadence: off}` | Opt-in analytics only |
| A prompt shown twice to one author for one child within 365 days | Zero (gate) | Property test over a simulated 2-year history (F13-REQ-004) | n/a |
| Notifications between 21:30 and 07:00 local | Zero (gate, C-NFR-001) | Planner property test across time zones and DST | n/a |
| Evenings where Tonight has no unseen prompt to offer | Under 10% in the first year of a child [A] | New `prompt_shown{kind, exhausted}` | Opt-in analytics only |

## 4. Scope

**In v1.0**
- Prompt library delivered as a typed, versioned, hashed content block through F19, cached, with the bundled English library as the floor (B14).
- Age-aware selection by the child's month of age, a new `before` band for a book that is not born yet (no birthday, or one after today), no prompt repeated for the same author and child within 12 months, skip with "Another thought", no prompt rather than a repeat when the pool runs out.
- `together` prompts never served while the `child-input` flag is off (PRD-REQ-005).
- Local reminders only, scheduled on the phone with `expo-notifications`: default "A few times a week" (Tuesday and Saturday, 20:30) plus the month-age note per included child; Off, Weekly, Every evening; a time picker from 07:00 to 21:30.
- Smart quiet, back-off, copy rotation, birthday note replacing that day's reminder, nothing on a plan-notice day.
- Lock-screen names off by default with a Settings toggle (D-025, C-REQ-009 at v1.0).
- Primed permission right after the first letter, in the F02 ask order (DR-12 B spec default).
- Co-parent letter pushes (F11, M14) inside this planner's budget and quiet window.
- Quiet this book per person (F12-REQ-011); one neutral question when a birth date is entered more than 3 weeks before the due date (F13-REQ-021).
- Apple's App Store rating request after a good moment (F13-REQ-020, P1): specified now, built first in 1.0.x (`08-delivery.md` section 6.4).
- Separate switches for Reminders, Letters from your co-parent and Your plan; one tap pauses all reminders.
- Hidden and quieted books (per person) and due-date books silence every child-anchored notification.
- The shared device planner that F14 plan reminders on the phone and F11 co-parent pushes respect (one budget, one quiet window, one day rule). F14's emails (D-080) are outside this planner.

**Later**
- Prompts in the author's language (pack prompt text, B13): v1.1 or with UI localisation (F44). The pack format keeps a prompt slot. Until then, language stays out of the lead positioning (04 section 5; R1 PL-31).
- Corrected-age chapter titles for babies born early: v1.1 decision for F09 (R3 DX-18).
- Picking which evenings for "A few times a week" (Headspace pattern, R1-S58): P1 at v1.0 if time allows, else v1.1.
- "On this day" cards (C-REQ-014) and Year One (C-REQ-013): F47, later.
- Home Screen and Lock Screen widgets as quiet reminders (Dearest pattern, R1-S3; `expo-widgets`, R4-S61): F04 owns the lock-screen widget; no reminder widget at v1.0.
- Server-sent letter reminders of any kind. (Plan reminder emails are F14's and ship under M6, D-080.)

**Never**
- Streaks, day counts, "since your last", "missed", "in a row" or any gap count in any notification, card or setting (C-REQ-005, CLAUDE.md content rules).
- Promotions, Plus offers or marketing in any notification channel (App Review 4.5.4, R1-S49; LEGAL-REQ-054).
- A due-date countdown or due-date push (B-REQ-015).
- Letter text, transcript or audio reference in any notification (LEGAL-REQ-054).
- Email or SMS letter reminders. One channel by default (R2 F13 row; R1-S15). The transactional plan reminder emails in `docs/emails/CATALOG.md` section 7 are F14's, carry no letter prompt and are not reminders to write.
- Notifications that change behaviour from the server without a release (B14: never server-driven if it changes data collection; 2.3.1(a) no hidden features, R4-S55).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Qeepsake | 2 questions a day (Essential) or 4 (Premium); 1 a week on free Lite [F] R1-S16, R1-S44 | 4.9 (15K) [F] R1-S1 | Repeated questions within short spans; age-inappropriate questions; marketing texts during postpartum [S] R1-S56, R2-S13, R2-S1 | **Avoid** daily volume, repeats and marketing in the same channel [R] |
| Remento | Weekly prompt by text or email, adjustable [F] R1-S53 | Trustpilot 4.8 (1,738) [F] R1-S15 | Too many reminder emails and texts after sign-up [S] R1-S15 | **Avoid** sign-up bursts and multi-channel nudges [R] |
| Storyworth | Weekly emailed question [F] R1-S14 | Trustpilot 4.7 (65,094) [F] R1-S54 | Prompts help reluctant, busy authors [S] R1-S54 | **Match** a weekly-or-so rhythm; our default is 2 evenings a week (UR R7) [R] |
| Calm (quality bar) | Reminder ask after the first session [S] R1-S57 (vendor case study) | 40% set one; 3x retention, causal per the vendor [S] R1-S57 | n/a | **Match** right after the first letter (DR-12 B), with a C1 cohort test against A [R] |
| Headspace (quality bar) | User picks days and triggers [F] R1-S58 | +7.5% opens, no gain in active days [F] R1-S58 | n/a | **Match lightly**: the parent picks the time; evenings picker P1 [R] |
| Dearest | Home Screen widgets as reminders [F] R1-S3 | n/a | n/a | Later (widgets) [R] |
| Tinybeans | Pregnancy notifications [S] R2-S14 | n/a | One reviewer said they felt wrong [S] R2-S14 | **Avoid**: due-date silence (F13-REQ-013) [R] |
| Apple rule | 4.5.4: marketing pushes need explicit opt-in and an in-app opt-out; push cannot be required [F] R1-S49 | n/a | n/a | **Match**: no marketing pushes at all; reminders off is one tap [R] |

## 6. Experience

### 6.1 Entry points

| Entry | Owner | What happens |
|---|---|---|
| Tonight "A thought to start with" (`tonight.promptLabel`), "Another thought" (`tonight.newPromptButton`), "Just talk" (`tonight.writeFreelyButton`) | F13 (prompt), F04 (capture) | Shows one prompt; skip shows another; Just talk starts without one |
| Reminder priming card (`onboarding.reminder.*`) | F13, sequenced by F02 `nextAsk` | Right after the first letter's saved moment (DR-12 B); the account ask follows in session 2 or after letter 2 |
| Long-press on any F13 notification | F13, F12 | Action "Quiet this book" for the routed child (F12-REQ-011) |
| Settings > Reminders (`settings.reminders.*`) | F13 inside F17 | Cadence, time, pause all, channels, names in notifications |
| Settings > Children > {child}'s book: "Include {child} in my reminders", "Pause celebrations for {child}", "Letters from your co-parent" | F12, F11, F13 rules | Per person, per child (PRD-REQ-013) |
| A reminder tapped | F13 | Opens Tonight for the named child; never opens a live recording (F04-REQ-021) |
| A month-age or birthday note tapped | F13, F09 | Opens the Book at that chapter (F09 6.1) |
| A co-parent letter push tapped | F11 | Opens the Book at the new letter's chapter |
| A plan notice tapped | F14 | Opens Settings > Plan |

### 6.2 Happy path

#### A. A prompt on Tonight

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Opens Tonight for Asha, 5 months old | `tonight.promptLabel` and one prompt, for example `opening.4-6.grab` | `selectPrompt` with the child's month age, the author's 12-month history for Asha, today's seed and the live library (cached block, else bundled) |
| 2 | Reads it, taps Speak | Capture (F04) with the prompt above the record button | The key is written to the new entry (`promptKey`, exists in `store.ts`) and to the local shown history |
| 3 | Reopens Tonight later the same evening | The same prompt | The seed is the local date, so the prompt is stable for the evening; the history records one showing |
| 4 | Taps "Another thought" | A different prompt | The skipped key joins the history for 12 months |
| 5 | Every eligible prompt has been shown in the last 12 months | `tonight.subtitle` ("What do you want {child} to know about today?") and no prompt label | `selectPrompt` returns none; `prompt_shown{exhausted: true}` after consent |

#### B. Reminder set-up after the first letter (DR-12 B, PRD-REQ-001 in F02, K-02)

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Saves the first letter | The first-letter moment (F09) | No OS notification prompt anywhere before this (C-REQ-001) |
| 2 | Closes the first-letter moment | Priming card: `onboarding.reminder.title`, `.body`, `.yesEveningsButton`, `.pickTimeButton`, `.noneOption` | `nextAsk` returns `reminder_prime` as the first ask (DR-12 B); `reminder_prime_shown{source: first_letter}` (new enum value) |
| 3 | (Session 2 or after letter 2) | The account sheet (F02) | `nextAsk` returns the account ask; one ask per session (F02) |
| 4a | Taps "Yes, evenings" | iOS permission sheet | `requestPermissionsAsync` (expo-notifications, verified in WP-F13-08); on grant, schedule the default |
| 4b | Taps "Pick a time" | Time picker 07:00 to 21:30 in 15-minute steps, default 20:30 (`onboarding.reminder.timeLabel`, `.cta`) | Then the iOS sheet |
| 4c | Taps "No reminders" | `onboarding.reminder.noneHelp` | No OS prompt. One more prime is allowed after the first month chapter completes, never more than 2 in total (C F1) |
| 4d | (Birth date entered more than 3 weeks before the due date) | Once, instead of the default schedule: "Would you like reminders now, or later on?" with Later preselected (`reminders.earlyBirth.*`, new) | Later keeps reminders and month notes off for that child until the parent turns them on; no copy names a hospital, NICU or prematurity (F13-REQ-021) |
| 5 | Grants | Card closes; Settings > Reminders now reads "A few times a week, 8:30 PM" | Planner writes the next horizon of local notifications (6.4) |
| 5' | Denies | Card closes | Choice saved; the OS sheet is never shown again; Settings > Reminders shows "Notifications are off for this app" with Open Settings (new `settings.reminders.osOff`, `settings.reminders.openSettings`) |

#### C. A week with the default

1. Tuesday 20:30: one reminder from `notifications.evening` (or the name-free set when names are off), naming the next included child in rotation (K-12).
2. Wednesday: Asha's monthly birthday; the month-age note `notifications.monthOpen` at 20:30 for Asha only if Asha is included and celebrations are not paused.
3. Thursday: the parent saves a letter at 19:10.
4. Saturday 20:30: reminder fires (the Thursday save is more than 20 hours earlier).
5. Total: at most 2 reminders plus 1 month-age note (C-REQ-002, PRD 6.4 checklist).

#### D. Settings > Reminders

| Row | Values | Default | Copy key |
|---|---|---|---|
| Reminders | Off, Weekly, A few times a week, Every evening | A few times a week | `settings.reminders.cadenceLabel`, `.offLabel`, `.weeklyLabel`, `.fewTimesLabel`, `.everyEveningLabel` |
| Reminder time | 07:00 to 21:30, 15-minute steps | 20:30 | `settings.reminders.timeLabel` |
| Pause all reminders | On or off | Off | `settings.reminders.pauseLabel` |
| Letters from your co-parent | Per child switch lives under Children; this row links there | On (F11 Q4) | new `settings.reminders.coParentLink` |
| Your plan reminders | Read-only line; says reminders come on this phone before a free period ends or a plan renews, and by email (F14 6.6). F14 and counsel own the words | n/a | new `settings.reminders.planLine` |
| Names in notifications | On or off | Off (D-025) | `settings.privacy.lockScreenLabel` (exists), help line new `settings.privacy.lockScreenHelp` |
| Reminders on this device | On or off | On for the device that granted first, off on a second device (6.3 U27) | new `settings.reminders.thisDeviceLabel` |

Weekly fires on Saturday at the chosen time [R]. A few times a week fires Tuesday and Saturday (K-03). Every evening fires daily. VoiceOver reads each row with its value, for example "Reminders, a few times a week, 8:30 PM" (C-REQ-016).

#### E. Prompt content delivery (B14)

1. At launch and on foreground (at most once every 6 hours), the F19 content client asks the edge for the `prompts` block with an ETag.
2. A new version arrives: the client checks its SHA-256 against the signed manifest, validates it against the `prompts.v1` schema (6.5), runs the on-device content checks, and only then swaps it in as the live library.
3. Any failure keeps the last good copy; with no good copy, the bundled library from `packages/content/src/prompts.ts` (`PROMPT_LIBRARY_VERSION` 2) is used. Tonight never waits on the network.

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F13-U01 | OS permission denied at the prime | Choice stored; no further OS prompt ever | Settings > Reminders: `settings.reminders.osOff` with Open Settings | iOS Settings | `[C-REQ-001] denied never re-prompts` |
| F13-U02 | "No reminders" twice | No third prime | Nothing | Settings > Reminders | Unit: prime count cap 2 |
| F13-U03 | Permission revoked later in iOS Settings | On foreground, `getPermissionsAsync` reports denied; planner cancels pending reminders | Settings shows `osOff` | iOS Settings | Integration |
| F13-U04 | Offline for weeks | Everything is local; prompts from the cached or bundled library | Normal | n/a | E2E airplane mode |
| F13-U05 | App not opened for longer than the planning horizon | Scheduled notifications run out at the horizon end; nothing new is planned until the next open | Silence after the last planned slot | Opening the app replans | Unit: horizon cap |
| F13-U06 | Travel from Los Angeles to New York | Calendar triggers follow device local time (to verify, WP-F13-08); planner also replans on time zone change | Reminder at 20:30 New York time | n/a | `[C-REQ-003] travel keeps local time` |
| F13-U07 | DST change night | Planner works in local wall-clock time; a slot that would land in the skipped hour moves to the next valid minute inside 07:00 to 21:30 | One reminder, at a sane time | n/a | Property test, March and November |
| F13-U08 | Save at 19:00, slot at 20:30 | On save, the planner removes any slot within 20 h after the save | No reminder | n/a | `[C-REQ-004] save suppresses next slot` |
| F13-U09 | App in use at 19:45, slot at 20:30 | On foreground and on background, the planner removes any slot within 2 h of that moment | No reminder | n/a | Unit |
| F13-U10 | Time picker set to 22:30 | Clamped to 21:30 | "We keep late nights quiet." (new `settings.reminders.lateClamp`) | n/a | `[C-REQ-003] clamp` |
| F13-U11 | Book hidden by one parent | Hide is per person (B-REQ-014 Rev, F12): within one sync, that parent's devices drop reminders naming that child, month-age and birthday notes, and do not show co-parent pushes for that book; the other parent is unchanged | Nothing for that child, for that parent | Show this book again | `[F13-REQ-024]` two-device test |
| F13-U12 | Every book hidden | No reminders, notes or co-parent pushes at all | Settings > Reminders footnote: new `settings.reminders.allHidden` | Show a book | Unit |
| F13-U13 | Due-date book, 21 days before the due date | That child's letter reminders, month notes and birthday notes stop until a birth date is set (F13-REQ-013); no copy mentions the date | Silence for that child | Setting the birth date resumes | Unit with clock |
| F13-U14 | Due date passes with no birth date | Silence continues; no prompt, card or push asks whether the baby is here | Nothing | Parent sets the birth date in Settings (F12-U16) | Unit |
| F13-U15 | Child's birthday | `notifications.birthday` at 09:00; no letter reminder that day for anyone in that book (C-REQ-011) | One note | n/a | Unit |
| F13-U16 | Birth date on the 31st, month of 30 days | Month-age note fires on the 30th | One note | n/a | `[C-REQ-011] 31st` |
| F13-U17 | F14 plan notice scheduled for a day | No letter reminder that day (C-REQ-025) | Only the plan notice | n/a | Planner unit with a plan date input |
| F13-U18 | 4 reminders in a row neither opened nor followed by a save within 2 h | Cadence drops to weekly; after 4 more, only month-age notes remain and one in-app card "Would fewer nudges suit you better?" (new `reminders.backoff.*`) with no numbers | Fewer nudges; one card | Any save restores the chosen cadence | `[C-REQ-008]` |
| F13-U19 | Names off (default) | Name-free variant set; no `{child}` rendered; the tap still routes to the right child | Lock screen without names | Toggle on in Settings | `[C-REQ-009]`, `[LEGAL-REQ-054]` |
| F13-U20 | Reminders paused, co-parent adds a letter | Co-parent push still arrives (F11-REQ-014) | Push | n/a | `[C-REQ-007]` |
| F13-U21 | Two children, only one included | Every reminder names or routes to the included child; month notes only for that child | One child's notes | Include the other | `[F12-REQ-010]` |
| F13-U22 | Prompt pool exhausted for this author and child | No prompt; the subtitle shows | No "A thought to start with" label | New library versions add prompts | `[F13-REQ-005]` |
| F13-U23 | Server block fails hash, signature or schema | Rejected; last good copy stays live; ops event without content | Normal prompts | Next valid version | `[F13-REQ-002]` |
| F13-U24 | First launch offline, never fetched | Bundled library | Normal prompts | n/a | Unit |
| F13-U25 | A key in history is retired upstream | Retired keys are never served; history keeps the key | Normal | n/a | Unit |
| F13-U26 | `child-input` flag off and a `together` prompt in the block | Selector filters kind `together` | Never seen | n/a | `[PRD-REQ-005]` |
| F13-U27 | Same person on iPhone and iPad, both with permission | Letter reminders schedule only where "Reminders on this device" is on; a second device defaults off and offers one line to turn it on | No duplicate nudges by default | Turn on per device | Unit |
| F13-U28 | Pending budget reached (more than 56 planned items) | Planner keeps the earliest items within budget (6.4) | Normal | Replans on open | Unit: never more than 60 pending |
| F13-U29 | Notification tapped for a hidden or deleted book | Opens Tonight for the first visible book; no error | Tonight | n/a | Integration |
| F13-U30 | Signed out, local-only user | Reminders and prompts work; nothing needs an account | Normal | n/a | E2E signed out |
| F13-U31 | Account deleted | All pending notifications cancelled at device wipe; F14 replans plan notices from the Apple entitlement on next launch (F14-REQ-020) | Nothing from us until set up again | n/a | Integration |
| F13-U32 | Reinstall | On first launch, cancel every pending request, then replan from settings | No ghost reminders | n/a | Integration |
| F13-U33 | Double tap on "Yes, evenings" | One permission request, one schedule (idempotent plan) | One sheet | n/a | Unit |
| F13-U34 | VoiceOver and AX5 on the prime card and Settings > Reminders, iPhone SE 3 | Rows wrap, no truncation; time picker labelled | Readable | n/a | AX5 snapshot, VoiceOver script |
| F13-U35 | Hindi or Arabic author | Prompts and notifications in English at v1.0; `{child}` renders in the script the parent typed, right to left where needed | English prompt with the child's name as written | v1.1 language prompts | Render test with Devanagari and Arabic names |
| F13-U36 | Phone in a Focus or silent mode | Nothing special; iOS decides delivery | n/a | n/a | n/a |
| F13-U37 | Celebrations paused for Asha by one parent | That parent gets no month or birthday note for Asha; the other parent still does (PRD-REQ-013) | Silence for that parent | Turn back on | `[PRD-REQ-013]` |
| F13-U38 | One parent quiets Asha's book | That parent's planner drops every request for Asha, Tonight shows no prompt for Asha, no co-parent push for Asha reaches that parent; the other parent is unchanged | Silence for that parent | Turn notes back on | `[F13-REQ-022]` |
| F13-U39 | Birth date entered 5 weeks before the due date | The early-birth question shows once; default Later keeps that child's reminders and month notes off | One neutral question | Settings > Reminders | `[F13-REQ-021]` |
| F13-U40 | Fifth letter saved, no gate, no deletion and no support case in the last 7 days | Apple's rating request may show, at most within Apple's yearly limit; never right after a Keep sheet, a deletion, an export of everything or a support email | Apple's sheet, or nothing | n/a | `[F13-REQ-020]` |

### 6.4 The planner (one set of rules for every notification on the phone)

The planner is a pure function on the device. It runs on every save, foreground, background, settings change, time zone change, child change (hide, include, birth date) and F14 plan state change, and replaces every pending local request it owns.

| Rule | Value | Source |
|---|---|---|
| Quiet window | Nothing between 21:30 and 07:00 local, ever | C-NFR-001 |
| Default slots | Tuesday and Saturday at the chosen time (20:30 default) | K-03 |
| Weekly | Saturday at the chosen time [R] | this spec |
| Every evening | Daily at the chosen time | K-03 |
| Smart quiet | Drop a slot within 20 h after a save by this person, or within 2 h of the app being in the foreground | C F2, C-REQ-004 |
| Birthday | `notifications.birthday` at 09:00; no letter reminder that day | C-REQ-011 |
| Month-age note | On the monthly birthday at the reminder time; per included child, not paused, not hidden, born | C-REQ-011, K-12 |
| Plan notice day | No letter reminder or month note on a day with an F14 plan notice | C-REQ-025 |
| Due-date silence | From 21 days before the due date until a birth date exists, nothing anchored to that child | B-REQ-015, F13-REQ-013 |
| Quiet and hidden books | Nothing anchored to a child this person quieted or hid; co-parent pushes for that book are not shown to this person | F12-REQ-011, B-REQ-014 Rev (F12) |
| Early birth | A child whose birth date is more than 3 weeks before the due date gets no reminders or month notes until the parent says "Now" | F13-REQ-021 |
| Hidden book | Nothing anchored to that child | B-REQ-014 |
| Rotation | Each letter reminder routes to the next included child in turn | K-12, F12-REQ-010 |
| Variant rotation | 8 `notifications.evening` variants; none repeats within 4 sends; no title twice in a row; `gentleReturn` only during back-off, at most once in 30 days | C-REQ-006 |
| Back-off | 4 unanswered in a row: weekly. 4 more: month notes only plus one card. A save restores | C-REQ-008 |
| Budget | At most 56 pending items owned by F13; 4 reserved for F14; never more than 60 in total [A] (R4 section 9: the 64 limit is Unverified) | R4-S70 |
| Horizon | Plan forward until the budget or 8 weeks, whichever comes first | this spec |
| Payload | Title and body rendered on the phone; `{child}` only when names are on; `data` carries a route id only | LEGAL-REQ-054, D-025 |

"Unanswered" means the notification was not opened (no notification response) and no letter was saved within 2 h of its fire time [R].

### 6.5 The `prompts.v1` content block (B14)

| Field | Type | Rule |
|---|---|---|
| `schema` | `"prompts.v1"` | Unknown schema: reject |
| `version` | integer | Must be greater than the live version |
| `language` | `"en"` at v1.0 | Others ignored at v1.0 |
| `prompts[]` | array of `{key, text, band, kind, retired?}` | Same shape as `Prompt` in `packages/core/src/prompts.ts`, with new band `before` |
| `key` | `kind.band.slug` | Unique; once published, a key's text never changes (publish check compares with every earlier version) |
| `text` | 1 to 140 characters | Only `{child}` as a placeholder; no em or en dashes, curly quotes, ellipsis characters or emoji; no she, he, her, him, his, hers; `gap` prompts never mention time away (same rules as `packages/content/test/rules.test.ts`) |
| `kind` | `opening`, `gap`, `hard`, `family`, `together` | `together` served only with `child-input` on |
| `band` | `any`, `before`, `0-3` to `37-60` | `before` only for a book that is not born yet: no birthday, or a birthday after the local day (`isBeforeBirth` in `packages/core/src/age.ts`, #376). `PROMPT_BANDS` in `packages/api/src/content.ts` carries it; `PROMPT_LIBRARY_VERSION` is 3 |

The publish pipeline (F19) runs the full content test suite before signing. The device repeats the cheap checks (length, placeholders, forbidden characters, pronouns) as a second line, because a signed block that slipped a rule should still never reach a parent.

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| C-REQ-001 Rev (DR-12) | P0 | Primed permission right after the first letter, before any OS prompt; at most 2 primes ever | Given first run, Then no OS notification prompt appears on any screen. Given the first letter saved, When its saved moment closes, Then the priming card shows before any OS prompt and before the account sheet. Given "No reminders" twice, Then the card never shows a third time | C, K-02, DR-12 B |
| C-REQ-002 | P0 | Default "A few times a week" (Tuesday and Saturday at 20:30) plus the month-age note; options Off, Weekly, A few times a week, Every evening | Given the default and no saves for 7 days, Then exactly 2 reminders plus at most 1 month-age note per included child are delivered | C, K-03 |
| C-REQ-003 | P0 | Time from 07:00 to 21:30 in 15-minute steps, device time zone and DST | Given 22:30 chosen, Then 21:30 is saved and `settings.reminders.lateClamp` shows. Given travel from LA to New York, Then the next reminder fires at the chosen New York time | C |
| C-REQ-004 | P0 | Smart quiet on the device: no slot within 20 h after a save or 2 h after the app was in the foreground; a slot shifted past 21:30 by a time zone change is dropped | Given a save at 19:00, When 20:30 arrives, Then nothing fires and `reminder_suppressed{reason: wrote_recently}` logs on next foreground (consented only). Given a zone shift that puts a slot at 23:00, Then it is dropped | C, catalogue enum |
| C-REQ-005 | P0 | No streak, gap or day count, and no daily promise, in any notification, card or setting string | Given the content test, Then any reminder or prompt string containing "daily", "every day", "in a row", "missed", "since your last", "streak" or a day count fails | C, PRD 6.4 |
| C-REQ-006 | P0 | Rotate the 8 evening variants: none repeats within 4 sends, no title twice in a row; `gentleReturn` only in back-off, at most once in 30 days | Given any 4 consecutive reminders, Then 4 distinct variant ids. Given 60 days of back-off, Then at most 2 `gentleReturn` sends | C |
| C-REQ-007 Rev (B1) | P0 | Separate in-app switches: Reminders (letter reminders, month-age and birthday notes), Letters from your co-parent (per child, F11), Your plan (F14). Pause all reminders is one tap and leaves the other two alone | Given Pause all reminders on, When the co-parent adds a letter, Then the F11 push arrives. Given Pause on, Then zero F13 local requests are pending within 1 s | C, F11 D6 |
| C-REQ-008 | P1 | Back-off: 4 unanswered reminders in a row drop to weekly; 4 more leave only month-age notes and show one card with no numbers; any save restores | Given 4 unanswered, Then the next planned week has 1 reminder. Given 8 unanswered, Then 0 letter reminders and 1 card `reminders.backoff.*`. Given a save, Then the chosen cadence returns at the next replan | C |
| C-REQ-009 Rev (D-025) | P0 | "Names in notifications" off by default from remote config `lock_screen_names_default` (false); off means no child name, nickname or signature in any title or body | Given a fresh install, Then every scheduled request's title and body contain no child name (Asha fixture). Given the toggle on, Then `{child}` renders from the local book | C, D-025, BL-157 |
| C-REQ-011 | P0 | Birthday note at 09:00 replaces that day's reminder; month-age note on the monthly birthday at the reminder time; day 29 to 31 births fall back to the month's last day | Given a birth date of 31 January, Then the April note fires on 30 April. Given a birthday, Then 0 letter reminders that day in that book for that person | C |
| C-REQ-012 | P0 | Pause celebrations per person per child stops that child's month and birthday notes for that person only | Given parent A pauses Asha, Then A has 0 Asha notes pending and B's are unchanged | C, PRD-REQ-013 |
| B-REQ-015 | P0 | No due-date countdown or due-date notification, ever | Given any book with a due date, Then no string, card or notification references the due date or days remaining (content test plus planner test) | B |
| PRD-REQ-005 | P0 | `together` prompts are never served while `child-input` is off | Given the flag off and a block with 13 `together` prompts, When 1,000 seeded selections run, Then 0 return kind `together` | PRD, K-19 |
| LEGAL-REQ-054 | P0 | No letter text, transcript, audio reference or promotion in any notification; names only when the setting allows | Given every notification type built from Asha fixtures, Then no payload or rendered body contains fixture letter text; names appear only with the toggle on | Legal |
| C-NFR-001 Rev (B2, M6) | P0 | Letter reminders: local scheduling only; 99% fire within 15 minutes of the slot; zero between 21:30 and 07:00. F14 plan reminders are local on the phone too, and also go by server email from the D-080 status report; the emails are not F13 requests | Given a device lab run of 200 slots over 14 days, Then 198 or more fire within 15 minutes (logged by a test build). Given the planner property test across 24 zones and both DST changes, Then 0 slots in the quiet window | C, B2 |
| F13-REQ-001 | P0 | The live prompt library comes from the F19 `prompts` block; fallback is the last good cached block, then the bundled `packages/content` library. Tonight never waits for the network | Given no network on first launch, Then Tonight shows a bundled prompt in under 300 ms (first route budget). Given a cached v3 and a failed fetch, Then v3 serves | B14, D-035 |
| F13-REQ-002 | P0 | A block goes live only after SHA-256 matches the signed manifest, `prompts.v1` schema passes, version is higher than live, and the on-device checks in 6.5 pass | Given 6 corrupt fixtures (bad hash, bad signature, unknown schema, lower version, a curly quote, a gendered pronoun), Then all 6 are rejected and the previous library stays live | B14, CLAUDE.md content rules |
| F13-REQ-003 | P0 | Selection is by the child's month of age (`bandFor`) on the local date, and by the `before` band for a book that is not born yet (no birthday, or one after the local day). Such a book never gets a born-age band | Given a due-date book, When 500 seeded selections run, Then 0 prompts from bands `0-3` to `37-60`. Given Asha turning 4 months today, Then band `4-6` applies today | B14, defect in 1 (Tonight passes 0) |
| F13-REQ-004 | P0 | No prompt key is shown to the same author for the same child twice within 365 days. A prompt counts as shown once per local date when rendered on Tonight, or when skipped | Given a simulated 2-year history with Tonight opened every evening and 3 skips a week, Then no key repeats inside any 365-day window per child | R2 T5, brief |
| F13-REQ-005 | P0 | When no eligible unseen prompt exists, show no prompt rather than repeat; fallback order is kind pool, then `opening` for the band, then `opening` any, each excluding the 365-day history | Given every eligible key in history, Then the selector returns none and Tonight shows `tonight.subtitle` with no prompt label | brief |
| F13-REQ-006 | P0 | "Another thought" shows the next eligible prompt; "Just talk" starts with none; skipping never blocks capture | Given 5 skips, Then 5 distinct prompts, and Speak and Type stay enabled throughout | C 3 |
| F13-REQ-007 | P0 | The selection is deterministic for the same author, child, local date and history, so a reopened Tonight shows the same prompt | Given Tonight closed and reopened 3 times on one date, Then one prompt key and one history entry | `prompts.ts` seed rule |
| F13-REQ-008 | P0 | The library includes at least 12 `before` prompts at launch (8 today, #376); none mentions the due date, a countdown, labour or an assumed outcome | Given the content test, Then `before` count is 12 or more and a banned-term list (due, weeks left, countdown, labour, delivery) has 0 hits | B-REQ-015, R2-S14 |
| F13-REQ-009 | P0 | Every F13 notification is a local notification scheduled on the phone; no server sends reminders, month notes or birthday notes | Given the network monitor during a 7-day run, Then 0 requests carry reminder schedules or fire events | B2, C-NFR-001 |
| F13-REQ-010 | P0 | One pure planner in `packages/core` computes every F13 request and accepts F14 plan dates as input; it runs on save, foreground, background, settings, zone, child and plan changes and replaces all pending F13 requests | Given each of the 7 triggers in a test harness, Then the pending set equals the planner output exactly | BL-151 |
| F13-REQ-011 | P0 | Pending budget: F13 owns at most 56 requests, F14 at most 4, horizon 8 weeks or the budget | Given Every evening with 3 children, Then pending F13 requests are 56 or fewer and the earliest dates are kept | R4 section 9 (Unverified limit) |
| F13-REQ-012 | P0 | Notification payloads carry a route id only in `data`; title and body are rendered on the phone | Given every request built in tests, Then `data` has only `{route, childLocalId?}` and no text fields | LEGAL-REQ-054 |
| F13-REQ-013 | P0 | Due-date silence: from 21 days before a book's due date until a birth date is set, nothing routes to or names that child; no copy asks whether the baby has arrived | Given a due date of 1 March, Then 0 requests for that child from 8 February onwards. Given a birth date set on 25 February, Then month notes start from the next monthly birthday | B-REQ-015, R2-S14 |
| F13-REQ-014 | P0 | Rotation names (or, with names off, routes to) each included child in turn; a child with "Include in my reminders" off is never named | Given 2 included children, Then 4 consecutive reminders route to each twice | K-12, F12-REQ-010 |
| F13-REQ-015 | P0 | No letter reminder or month note on a day with an F14 plan notice | Given a plan notice on a Tuesday, Then that Tuesday has 0 F13 requests | C-REQ-025 |
| F13-REQ-016 | P1 | "Reminders on this device" per device; on by default on the first device that grants permission, off on others | Given an iPhone and iPad signed in to one account, Then only the iPhone schedules letter reminders until the iPad switch is turned on | this spec |
| F13-REQ-017 | P0 | On first launch after install, and at account deletion wipe, cancel every pending local request before planning | Given a reinstall with 30 orphaned requests, Then 0 remain after launch and the new plan matches settings | this spec |
| F13-REQ-018 | P0 | Tapping any F13 notification opens Tonight or the Book for the routed child; a hidden or deleted child routes to the first visible book; no tap starts recording | Given a tap on a reminder for a deleted book, Then Tonight for the first visible book opens with the audio session idle | F04-REQ-021 |
| F13-REQ-019 | P0 | Remote config may change cadence slots, the quiet window inside 07:00 to 21:30, rotation and back-off thresholds; it can never widen the quiet window, add a channel or turn a promotion on | Given a config that sets the window to 06:00, Then the client clamps to 07:00 | C-NFR-009, B14 |
| F13-REQ-020 | P1 | Apple's App Store rating request (`StoreKit` review request) after a good moment: the fifth letter saved or a finished Read together session; never within 7 days of a Keep sheet, a deletion, an "Export everything", a support email or a refund; never more than Apple's yearly limit | Given a fifth letter saved with none of those events in 7 days, Then the request is called once. Given a Keep sheet shown today, Then it is not called | R1 PL-29 |
| F13-REQ-021 | P0 | When a birth date is entered more than 3 weeks before the due date, ask once in neutral words whether to start reminders now or later, Later preselected; Later keeps that child's reminders and month notes off until changed; no copy names a hospital, NICU or prematurity | Given a due date of 1 March and a birth date of 20 January, Then the question shows once; given Later, Then 0 reminders and 0 month notes for that child | R3 DX-18, R2-S14 |
| F13-REQ-022 | P0 | The planner drops every request anchored to a child this person quieted (F12-REQ-011) | Given Asha quieted by A, Then A has 0 pending requests routing to Asha within one replan, and B is unchanged | R3 DX-05 |
| F13-REQ-023 | P0 | The reminder prime takes the first ask slot after the first letter in F02's sequencer; F02 owns the order and the session definition (PRD-REQ-001, home F02) | Given the first letter saved, Then `nextAsk` returns `reminder_prime` before the account ask | DR-12 B, R5 EQ-19 |
| F13-REQ-024 | P0 | Hide reaches the planner: a book hidden by this person (B-REQ-014 Rev, home F12) drops every request anchored to that child on this person's devices within one sync | Given Asha hidden by A on phone 1, When A's phone 2 syncs, Then phone 2 has 0 requests routing to Asha | F12 |

Defined in another spec and checked there (R5 EQ-05, EQ-19): **PRD-REQ-001** one ask per session and the session definition (home F02; F13's slice is F13-REQ-023); **B-REQ-014 Rev** hide (home F12; F13's slice is F13-REQ-024). F13 is the home of B-REQ-015, C-REQ-007 (the in-app switches), C-REQ-011, C-REQ-012 (notification half) and LEGAL-REQ-054; F09 and F11 cite them.

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention |
|---|---|---|---|---|
| Prompt library block | L1 (PRD 7.10: prompts are public) | Edge cache, device cache | Anyone | Until replaced |
| Prompt history (`key`, `child_id`, local date) | L3 (links a child to dates) | Device only, new local table | This device | 400 days rolling, then deleted; dropped with the book |
| `entries.prompt_key` | L2 | Device, Postgres (exists) | Author and book members per F16 | With the letter |
| Reminder settings (cadence, time, pause, device switch, names toggle) | L2 | Device; person-global ones sync with the profile (PRD-REQ-013) | Owner | Life of account |
| Pending local notification requests | L4 when names are on (child name in the body), else L2 | iOS notification store on the device | iOS, this device | Replaced on each plan; cleared on wipe |
| Back-off counters, prime count | L2 | Device only | Device | Install |

- Nothing about reminders or prompts leaves the phone except the anonymous block fetch. The fetch carries no user JWT, id or child data (public config per B15); the edge sees an IP address and an ETag.
- Month-age and birthday timing reveal the birth date, so no analytics event fires on those notes (the `reminder_sent` catalogue entry already excludes them).
- Co-parent letter pushes are F11's server pushes: generic text, no name, signature, text or ids (F11 D6, F11-REQ-014). F13 only guarantees the switch and the pause rules.
- A notification preview on a locked phone is a privacy surface (R2 section 0 item 2). Names default off; letter text never appears.

## 9. Non-functional requirements

| Item | Budget | Gate |
|---|---|---|
| Prompt selection on Tonight with 2 years of history | Under 5 ms on iPhone SE 3 [A] | Yes |
| Planner run (3 children, Every evening, 8 weeks) | Under 50 ms on iPhone SE 3 [A]; schedule calls finish under 1 s | Yes |
| Delivery | 99% within 15 minutes of the slot; 0 in 21:30 to 07:00 (C-NFR-001) | Yes |
| Battery | No background task, no location, no polling; work happens only on the 7 triggers | Yes |
| Block size | Under 100 KB compressed for 1,000 prompts [A] | No |
| Block fetch | At most once per 6 hours; ETag; never on the launch critical path | Yes |
| Accessibility | Priming card and Settings > Reminders at AX5 without truncation; VoiceOver reads row and value; 44 pt targets; Reduce Motion honoured on the card (C-NFR-006) | Yes |
| Shared rules | `06-nfr.md` | |

## 10. Analytics

All events are sent only after analytics opt-in (K-01). Properties are L2 enums.

| Event | Exists? | Properties | Question it answers |
|---|---|---|---|
| `reminder_prime_shown` | Yes | `source` | Does the prime show at the right moment? |
| `reminder_prime_result` | Yes | `choice` | How many say yes? (target 60% grant) |
| `os_permission_result` | Yes | `granted`, `platform` | Does the OS grant follow the prime? |
| `reminder_schedule_set` | Yes, enum change | `cadence`, `hour_bucket` | Which cadences do parents pick? The catalogue's `cadence` values (`two_a_week`, `three_a_week`) do not match the app's (`fewTimes`, `everyEvening`); change to `off`, `weekly`, `few_times`, `every_evening` |
| `reminder_sent` | Yes | `type`, `variant_id` | Which variants lead to letters? Letter reminders only |
| `reminder_suppressed` | Yes, enum change | `reason`: add `foreground_recent`, `birthday`, `plan_notice_day`, `hidden_book`, `due_date_quiet`, `backoff` to the existing four | Is smart quiet doing its job? |
| `notification_opened` | Yes | `type`, `variant_id` | Do reminders bring parents back? Month and birthday notes stay excluded |
| `letter_saved.from_notification_2h` | Yes | bool | The 12% target |
| `prompt_shown` | New | `kind`, `band_fit` (`banded`, `any`, `before`), `exhausted` (bool) | Is the library deep enough for the 12-month rule? |
| `prompt_skipped` | New | `kind` | Which kinds get skipped? |
| `settings_changed` | Yes | `key: reminders`, `lock_screen_names` | Mute rate guardrail |

## 11. How we build it (with the architect)

| Part | Files | Notes |
|---|---|---|
| Prompt selection | `packages/core/src/prompts.ts` (exists) | Add band `before` (built, #376); new `pickPrompt(input): Prompt \| null` with `history: {key, date}[]` (365-day window), `allowKinds` (drops `together` when `child-input` is off), `beforeBirth: boolean` (built on `SelectInput`, #376). Keep `selectPrompt` until Tonight moves, then remove it. `AVOID_RECENT` goes |
| Planner | New `packages/core/src/reminder-plan.ts` | Pure: input is settings, children (birth date, due date, hidden, included, paused), saves, foreground times, plan dates from F14, now, zone; output is a list of `{id, fireAtLocal, kind, routeChildId, variantId}`. No clock reads, no React Native (CLAUDE.md `packages/core` rule) |
| Scheduler adapter | New `apps/mobile/src/lib/notifications/` (`schedule.ts`, `permissions.ts`, `routes.ts`, `copy.ts`) | `expo-notifications` (not installed today: `apps/mobile/package.json`; TDD 01 section 2). Install with `flock /tmp/scribe-npm.lock npx expo install expo-notifications`; check its licence and last release before merge (BRIEF). **Update 13 Oct 2026:** the adapter now exists as `apps/mobile/src/lib/reminders/` (`scheduler.ts`, `planner.ts`) with `expo-notifications` ~57.0.21 installed. It cancels only requests marked `scribe.reminders`, so F14 plan reminders must carry their own marker and pass their dates in for the day rule; plan reminders are not in its planner yet (its header lists them as later) |
| Prompt history | `apps/mobile/src/lib/db/migrations.ts` (exists): new local table `prompt_history(key, child_id, shown_on)` | Append-only migration step |
| Content block client | F19 client (BL-022); contract `prompts.v1` in `packages/api` (new package, B15, F19 owns) | Schema validation library chosen by F19 |
| Copy | `packages/content/src/prompts.ts` (12 or more `before` prompts; 8 today, #376), `packages/content/src/features/reminders.en.ts` (`notifications.*` name-free variants, BL-157; `reminders.backoff.*`; `reminders.earlyBirth.*`; new `settings.reminders.*` keys listed in 6.2 and 6.3) | Strings go straight to the stream's `packages/content` feature file, never a `copy.ts` in a component folder (R5 EQ-29) |
| Ask order | F02 `nextAsk` (BL-023) | F13 provides the prime card only |
| Settings screen | `apps/mobile/src/app/settings/reminders.tsx` (exists; today it saves choices and says scheduling is not built: `settingsMore.remindersNotYet`) | Remove `remindersNotYet` when the planner ships |

**Sequencing (order only; dates in `08-delivery.md` section 2.1).** Planner and selector (pure) first, with the quiet, hidden and early-birth inputs; then the expo-notifications device checks (WP-F13-08, W2); then the existing adapter in `apps/mobile/src/lib/reminders/` and Settings; then the content block switch after F19's client exists. Tonight can ship on the bundled library first.

**Riskiest unknowns and spikes.**
1. `expo-notifications` on SDK 57: calendar triggers in local time across zone and DST changes, the real pending limit (R4 section 9 marks 64 as Unverified), and `getPermissionsAsync` after a revoke. Spike WP-F13-08, two days on an SE 3 and a current iPhone, results written into this spec.
2. Library depth against the 365-day rule. Arithmetic from today's library: a child's first year can draw on 36 openings (10 any-age, 8 for 0-3 months, 6 in each later band) plus 7 gap prompts. A parent who opens Tonight 4 evenings a week runs out in about 11 weeks. B14 lets content add prompts without a release, so the fix is content, not code (Q1).

## 12. Work packages

Stream: S14, with S03 for the local table and S16 for copy (`08-delivery.md` section 3.3 governs file ownership; a path here owned by another stream is a request). Status checked on `origin/develop` on 13 Oct.

| WP | Scope | Owner | Owns files or folders | Depends on | Done when | Mode | Status 13 Oct |
|---|---|---|---|---|---|---|---|
| WP-F13-01 | Prompt selector: `before` band, 365-day history, none on exhaustion, kind filter | S14 | `packages/core/src/prompts.ts`, `packages/core/test/prompts.test.ts` | none | `[F13-REQ-003]`, `[F13-REQ-004]` 2-year property test, `[F13-REQ-005]`, `[F13-REQ-007]`, `[PRD-REQ-005]` | Agent. BL-151 | Partly built: `selectPrompt` exists with `AVOID_RECENT = 10`; the `before` band is built (#376) |
| WP-F13-02 | Pure planner, with quiet, hidden and early-birth inputs | S14 | New `packages/core/src/reminder-plan.ts`, its test | none | `[C-REQ-002]`, `[C-REQ-004]`, `[C-REQ-006]`, `[C-REQ-008]`, `[C-REQ-011]`, `[F13-REQ-011]`, `[F13-REQ-013]`, `[F13-REQ-014]`, `[F13-REQ-015]`, `[F13-REQ-021]`, `[F13-REQ-022]`; quiet-window property test over 24 zones and both DST changes; `[B-REQ-015]`, `[C-REQ-012]`, `[F13-REQ-019]` | Agent. BL-151 | Not built in core; a planner exists in `apps/mobile/src/lib/reminders/planner.ts` and is the starting point |
| WP-F13-03 | Expecting prompts, name-free notification copy, the proposed keys in 6.6 | S16 | `packages/content/src/prompts.ts`, `packages/content/src/features/reminders.en.ts`, `packages/content/test/rules.test.ts` | none | `[F13-REQ-008]`, `[C-REQ-005]` daily and day-count terms, BL-157 variants without `{child}` | Agent. BL-157 | Not built (0 `expecting` prompts) |
| WP-F13-08 | Device checks: expo-notifications on SDK 57 | Device operator with S14 | `docs/qa/evidence/` | none | Written results for local-time triggers across zone and DST, pending limit, revoke detection; 6.4 budget confirmed or changed | Human (W2) | Not run |
| WP-F13-04 | Scheduler adapter, permissions, routing, the long-press Quiet action | S14 | `apps/mobile/src/lib/reminders/` (exists; was `lib/notifications/` in the 3 Oct draft) | WP-F13-02, WP-F13-08 | `[F13-REQ-009]`, `[F13-REQ-010]` 7 triggers, `[F13-REQ-012]`, `[F13-REQ-017]`, `[F13-REQ-018]`, `[C-REQ-009]`; `[LEGAL-REQ-054]` | Agent | Partly built: `scheduler.ts`, `planner.ts`; `expo-notifications` ~57.0.21 installed |
| WP-F13-05 | Priming card first in the ask sequencer | S14 | Prime card component under `apps/mobile/src/components/settings/` (new file) | BL-023, WP-F13-04 | `[C-REQ-001]` 3 cases, `[F13-REQ-023]` | Agent. BL-023 | Not built against DR-12 B |
| WP-F13-06 | Settings > Reminders and names toggle | S14 | `apps/mobile/src/app/settings/reminders.tsx`, `apps/mobile/src/components/settings/labels.ts` | WP-F13-04 | `[C-REQ-003]` clamp, `[C-REQ-007]` pause keeps co-parent push, `[F13-REQ-016]`, AX5 by harness or device script | Agent. BL-159 | Partly built: `reminders.tsx` and `labels.ts` exist |
| WP-F13-07 | Prompt history table (local v9) and Tonight switch to `pickPrompt` | S03 table, S10 Tonight line | `apps/mobile/src/lib/db/migrations.ts`, `apps/mobile/src/app/(tabs)/index.tsx` | WP-F13-01 | `[F13-REQ-006]`, `[F13-REQ-007]`; migrator test from v0 to head | Agent | Not built |
| WP-F13-09 | Prompts from the content block | S14 | New `apps/mobile/src/lib/prompts-source.ts` | F19 client (BL-022), WP-F13-07 | `[F13-REQ-001]`, `[F13-REQ-002]` 6 corrupt fixtures | Agent | Not built; 1.0.x if no slot (`08-delivery.md` section 6.3 does not list it) |
| WP-F13-10 | Hide, quiet and due-date inputs from F12 and F16 | S14 | Planner inputs | WP-F13-04, WP-F12-07, WP-F12-08 | `[F13-REQ-024]` two-device test, `[F13-REQ-013]`, `[F13-REQ-022]` | Agent | Not built |
| WP-F13-11 | Analytics enum changes | S18 | `packages/analytics/src/catalog.ts` | none | Catalogue tests pass with new `cadence`, `reason` and `source` values and `prompt_shown`, `prompt_skipped` | Agent. BL-020 | Not built |
| WP-F13-12 | Early-birth question | S14 | Planner input and one card | WP-F13-02 | `[F13-REQ-021]` | Agent | Not built |
| WP-F13-13 | App Store rating request | S14 | One module under `apps/mobile/src/lib/reminders/` (new file) | none | `[F13-REQ-020]` | Agent; P1, cut from v1.0 now, first in 1.0.x (`08-delivery.md` section 6.4) | Not built |

### 12.1 Proposed copy for the new keys (R3 DX-25; content owns the final words)

| Key | Proposed text |
|---|---|
| `reminders.backoff.title` | Would fewer nudges suit you better? |
| `reminders.backoff.body` | You can keep only the month notes, or turn reminders off. Your letters stay as they are. |
| `reminders.earlyBirth.title` | Would you like reminders now, or later on? |
| `reminders.earlyBirth.later` | Later |
| `reminders.earlyBirth.now` | Now |
| `settings.reminders.planLine` | Before a free period ends or Plus renews, we remind you on this phone and by email. (F14 and counsel own this line) |
| `settings.reminders.lateClamp` | We keep late nights quiet. |
| `settings.reminders.allHidden` | Every book is hidden or quiet, so there are no reminders. |
| `settings.reminders.osOff` | Notifications are off for this app. |
| `settings.reminders.thisDeviceLabel` | Reminders on this device |

## 13. Open questions and assumptions

| Q | Who, by when | What changes |
|---|---|---|
| Q1 The 365-day no-repeat rule empties today's first-year pool in about 11 weeks at 4 evenings a week. Keep the rule and grow the English library to about 200 first-year prompts before C1, or allow repeats after 6 months? Spec default: keep 12 months, show no prompt when exhausted, content writes 120 or more new prompts before T22 | Founder, content owner; T15 | WP-F13-03 scope, `F13-REQ-004` window |
| Q2 Due-date silence starts 21 days before the due date. Right length? | Founder; T15 | One planner constant |
| Q3 Under M6 (DR-02 answered by D-080) plan reminders go by local notification and card on the phone and by email. May a user switch the phone's "Your plan" notifications off in the app, given the card and the email stay? Spec default: read-only row, no switch | Counsel; T17 (FT-33) | Settings row |
| Q4 Weekly fires on Saturday. Keep? | Founder; T15 | Planner constant |
| Q8 Is "more than 3 weeks before the due date" the right trigger for the early-birth question, and is Later the right default? Review with a NICU family organisation before C1 (02 section 7) | Founder; T22 | F13-REQ-021 |
| Q5 DR-12 spec default is now B. Run A against B as C1 cohorts if sizes allow (D-045); decide at C1 exit | Founder; T34 | `nextAsk` order table only (F02) |
| Q6 Does iOS give users one notification switch per app, so our three switches must be in-app? (not verified in R4) | Mobile engineer in WP-F13-08 | Settings copy |
| Q7 Should P4 authors get prompts in their spoken language before UI localisation? Needs translated prompt text, not machine translation of letters | Founder; v1.1 planning | Pack prompt slot |

| A | Assumption | How we validate |
|---|---|---|
| A1 | Keeping 60 or fewer pending requests stays under the iOS limit | WP-F13-08 spike |
| A2 | Calendar triggers fire at local wall-clock time after travel | WP-F13-08 spike plus the travel test |
| A3 | 4 unanswered reminders is the right back-off threshold | `notification_opened` and save rates in beta C1 |
| A4 | Parents read "no prompt tonight" as calm, not broken | Study 1 diary (02 section 7) |
| A5 | 20:30 suits most P1 evenings | `reminder_schedule_set.hour_bucket` in beta |

## 14. Sources

- Brief and rulebook: `docs/agents/BRIEF-2026-10-03.md` (decisions 9, 16); `docs/prd/v2/_AUTHORING.md` B1, B2, B4, B14, B15.
- V2: `01-problem.md` 2.1; `02-customers.md` P1 to P4, section 6, section 7; `03-goals-and-principles.md` principles 4 and 10, metrics 4.2 and 4.3; `05-feature-map.md` ranks 14, 17, 18; `09-decisions-and-risks.md` DR-02 (answered by D-080), DR-12, DR-17.
- Plan reminders (M6): `docs/DECISIONS.md` D-080, D-081; `docs/BACKLOG.md` BL-342; `docs/emails/CATALOG.md` section 7; `features/F14-plus.md` 6.6.
- PRD: `docs/prd/C-habits-pricing-settings.md` F1, F2, C-REQ-001 to -012, C-REQ-016, C-REQ-025, C-REQ-034, C-NFR-001, -005, -006, -009, section 7; `docs/prd/PRD.md` PRD-REQ-001, -005, -013, K-02, K-03, K-12, K-19, 6.4, 7.10; `docs/prd/B-first-run-and-family.md` B-REQ-014, B-REQ-015.
- Decisions: `docs/DECISIONS.md` D-025, D-035, D-045.
- Legal: `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-014, LEGAL-REQ-054.
- Sibling specs: `features/F02-account.md` (`nextAsk`, PRD-REQ-001 Rev), `F04-capture.md` F04-REQ-021, `F09-book.md` 6.1, `F11-co-parent.md` D6, F11-REQ-014, F11-U23, F11-U24, `F12-children.md` F12-REQ-005, F12-REQ-010, WP-F12-07.
- Code read 3 Oct 2026: `packages/core/src/prompts.ts` (`bandFor`, `selectPrompt`, `AVOID_RECENT`); `packages/content/src/prompts.ts` (103 prompts, `PROMPT_LIBRARY_VERSION` 2); `packages/content/src/strings.en.ts` (`onboarding.reminder.*`, `notifications.*`, `settings.reminders.*`, `settings.privacy.lockScreenLabel`, `tonight.*`, `settingsMore.remindersNotYet`, `children.settings.*`); `packages/content/test/rules.test.ts`; `apps/mobile/src/app/(tabs)/index.tsx`; `apps/mobile/src/app/settings/reminders.tsx`; `apps/mobile/src/components/settings/labels.ts`; `apps/mobile/src/components/child/child-store.ts`; `apps/mobile/src/lib/store.ts`; `apps/mobile/package.json`; `packages/analytics/src/catalog.ts`; `docs/tdd/01-mobile-client.md` section 2.
- Backlog: `docs/BACKLOG.md` BL-020, BL-022, BL-023, BL-151, BL-157, BL-159, BL-196.
- Research: R1 F13 and section 4 (R1-S1, R1-S3, R1-S14, R1-S15, R1-S16, R1-S44, R1-S49, R1-S53, R1-S54, R1-S56, R1-S57, R1-S58); R2 section 0 item 4, themes T4, T5, T6, T27 (R2-S1, R2-S13, R2-S14); R4 sections 0 item 8, 5, 9 (R4-S55, R4-S61, R4-S70); `docs/research/USER_RESEARCH.md` R7, section 1.1.
