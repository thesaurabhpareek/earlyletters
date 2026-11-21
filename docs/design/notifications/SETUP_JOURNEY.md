> Correction, 1 Nov 2026: this draft says the reminder card is not wired because `reminderPrimePending` is false. That was wrong. The card exists (`components/asks/reminder-prime-ask.tsx`, asked for by Review through `lib/asks`, mounted in the tabs layout) and rises over the Book, not Tonight. Read "Tonight card" below as "the card after the first letter". The cadence choice, the sleep question and the preview are still new work (BL-536). See `docs/design/NOTIFICATIONS.md`.

# Design A: the reminder setup journey

Lane: the flow a parent sees, from the ask to "change it later". Final words are Design B's; every string below is working copy written to the content rules. Marks: [verified: source] or [unverified].

## 1. Recommendation

Keep the ask where the spec put it (a card on Tonight after the first letter is saved, K-02/DR-12 B) and build one short setup sheet behind it: **two screens, then the one-button iOS pre-sheet, then a confirmation**.

1. **Screen A** asks one personal question: "About when does {child} fall asleep?"
2. **Screen B** shows a lock-screen preview that updates live as the parent picks how often, which evenings, and what time. The suggested time comes from screen A.
3. **Pre-sheet** (existing `ReminderPrimingSheet`, unchanged: one Continue button, no close) opens the iOS alert. It now follows real choices, so "why" is already obvious.
4. **Confirmation** lists the next three reminders and what else may arrive.

**Differentiator: "Bedtime anchor + the real preview."** The parent tells us when {child} falls asleep (a rough band, not a clock time). We suggest a time about an hour later, never past the quiet gate. The preview shows the actual next reminders by date, the actual words, and the name-on-lock-screen choice. The promise is visible before iOS ever asks for permission. Why it earns trust: nothing is hidden, the person sets the rhythm in their own routine, and the ask comes after they have already seen exactly what will happen. We keep only the resulting reminder time, never the bedtime band (nothing about {child}'s sleep is stored or sent).

Honest limit: I cannot show this is "backed by users". The anchoring idea rests on habit-formation research I did not search this run [unverified]. Validation plan: five parent sessions on TestFlight, watching whether they change the suggested time, and whether the reminder is still on after two weeks (analytics are off in v1.0, D-124, so by interview, not telemetry).

## 2. Benchmark: what we take

| Product | What I could verify | What we take |
|---|---|---|
| Apple HIG, Privacy | A pre-alert screen has one button, titled like "Continue" or "Next"; no close or cancel; no image or annotation of the alert; ask in context when needed [verified: developer.apple.com/design/human-interface-guidelines/privacy, read today]. | Our existing pre-sheet already follows it. We add context before it, never inside it. |
| Headspace | Onboarding asks when you want to meditate, then offers a reminder, then asks for notifications on the last screen with "Enable Now" / "Not Now" [verified: one reviewer's walkthrough, Medium, date and app version unknown]. Help centre: "Set the time and frequency", a "Remind me" switch [verified: help.headspace.com]. | Order: choose first, permission last. Time tied to a routine moment. We skip "Not Now" on the pre-sheet (HIG) but let the whole sheet be skipped earlier. |
| Calm | Reminders are per type; scroll wheel for hour and minute; tap the days of the week; a toggle per reminder; iOS notifications must be on first [verified: support.calm.com How to Set Reminders]. | Day chips and a wheel for a custom time. We take one reminder, not four types. |
| Duolingo | The page I fetched did not describe its reminder flow [unverified]. | Nothing borrowed. Streaks, loss and guilt framing are banned by house rule. |
| Apple Fitness, Day One | Could not verify a reminder flow from sources this run [unverified]. Apple Journal's single scheduled notification is already in repo BENCHMARK.md S5. | One opt-in evening reminder at the person's chosen time. |

## 3. Flow

```
Tonight card (after 1st letter)
  -> [Set up]  -> Screen A (bedtime band)
                    -> Screen B (how often, evenings, time, live preview)
                         -> [Set reminder]
                              notDetermined -> Pre-sheet (Continue) -> iOS alert
                                                  allowed -> Confirmation
                                                  denied  -> Confirmation (denied variant)
                              granted       -> Confirmation
                              denied before -> Confirmation (denied variant, no pre-sheet)
                         -> "No reminders" -> [Done] (closes; nothing asked of iOS)
  -> [Not now] -> card goes away (see 4)
```

## 4. The moment of the ask: Tonight card

Reuse `Card variant="tinted"` and `onboarding.reminder` strings, made personal. Shown only after the first letter is saved, and never on first run. Known gap to hand to `mobile`: `reminderPrimePending` is hard-coded false at `ask-sequencer.logic.ts:63`, so the card is not wired [verified: BRIEF].

```
+--------------------------------------------+
|  (moon)  A quiet minute for {child}?       |
|                                            |
|  A few evenings a week, after {child} is   |
|  asleep. You pick the time. Never late.    |
|                                            |
|  [ Set up ]                    Not now     |
+--------------------------------------------+
```

- Working copy: title `A quiet minute for {child}?`; body above; buttons `Set up` and `Not now`.
- "Not now" is a text-weight Button `quiet`, still 44 pt. It closes the card with no guilt text. Proposal for product: the card returns once more after a later letter, then lives only in Settings. Never mentioned to the parent as a count.
- Decision for product: reuse existing `yesEveningsButton: "Yes, evenings"` as a fast path? I recommend not; one door ("Set up") avoids a hidden default.

## 5. Screen A: personal first screen

Presented in the existing `Sheet` (`dismissible`, visible Close; this is our screen, so a close is allowed here, unlike the pre-sheet). No lamp (utility sheet, DESIGN_LANGUAGE 2b).

```
+--------------------------------------------+
| Close                                      |
|                                            |
|  (moon line art, 72 pt)                    |
|                                            |
|  A few words for {child},                  |
|  once {child} is asleep                    |
|                                            |
|  About when does {child} fall asleep?      |
|                                            |
|  ( ) Before 7                              |
|  ( ) 7 to 8                                |
|  (x) 8 to 9                                |
|  ( ) After 9                               |
|  ( ) It changes                            |
|                                            |
|  We only keep the reminder time.           |
|                                            |
|  [ Continue ]                              |
|  I will pick a time myself                 |
+--------------------------------------------+
```

- Component: `ChoiceGroup layout="list"` (radiogroup, stacks at large text, `tap` haptic). No preselection on first view; Continue is enabled once one is picked. "It changes" and the skip link both land on screen B with the 8:30 PM default.
- Mapping to a suggested time (opinion, tune in sessions): Before 7 gives 8:00 PM; 7 to 8 gives 8:30 PM; 8 to 9 gives 9:15 PM; After 9 gives the window's latest time. Always clamped by the planner window (section 8).
- "It changes" is the honest option for a baby; do not force a clock time.
- Screen reads {child}'s name from the profile; if no name was entered, fall back to "your little one" (NA-13 notes the drift between "your child", "your little one", "your baby"; Design B to settle one).

## 6. Screen B: choices and live preview

```
+--------------------------------------------+
| Back                       Reminders       |
|                                            |
|  How it will look                          |
|  +--------------------------------------+  |
|  | [icon] Early Letters          8:30 PM|  |
|  | A minute to write?                   |  |
|  | One thing about today is plenty.     |  |
|  +--------------------------------------+  |
|  Next: Tuesday at 8:30 PM                  |
|                                            |
|  How often                                 |
|  (x) A few evenings a week                 |
|  ( ) Every evening                         |
|  ( ) Once a week                           |
|  ( ) No reminders                          |
|                                            |
|  Which evenings                            |
|  [Mon] [Tue*] [Wed] [Thu] [Fri] [Sat*] [Sun]|
|                                            |
|  What time                                 |
|  [8:00 PM] [8:30 PM*] [9:00 PM] [Another]  |
|  Suggested for you: 8:30 PM                |
|                                            |
|  Show {child}'s name on the lock screen    |
|  Off. Notifications say "your little one". |
|                  [ switch off ]            |
|                                            |
|  [ Set reminder ]                          |
+--------------------------------------------+
```

`*` = selected. Selected means fill, edge and a check glyph, never colour alone.

**How often (plain words, no jargon).** Four labels: "A few evenings a week" (planner `fewTimes`, default Tue and Sat), "Every evening" (`everyEvening`), "Once a week" (`weekly`, default Sunday), "No reminders" (`off`). Avoid "daily" and "weekly" as labels; they are the founder's words, but "Every evening" is already a checked user-choice label [verified: experience-pass critique 01]. Component: `ChoiceGroup layout="list"`, each with a one-line `description` only if it adds something (for example "Tuesday and Saturday" appears live under the chosen row).

**Which evenings.** `ChipGroup` of seven weekday chips (existing, `weekdaysShort` for the label, `weekdays` for VoiceOver).
- "A few evenings": multi-select, at least one. Deselecting the last shows inline "Pick at least one evening, or choose No reminders." (icon plus words, announced).
- "Once a week": single-select (radio behaviour).
- "Every evening": the row is replaced by the text "All seven evenings." (no chips to tap).
- "No reminders": the whole area below collapses; CTA becomes "Done".

**What time.** Three suggestion chips around the suggested time (15 minute steps), the suggested one pre-selected and tagged "Suggested", then "Another time" which opens the iOS time wheel (`DateTimePicker`, spinner, `minuteInterval` 15, already used in Settings). Never show a chip outside the window.

**Names on the lock screen.** `Toggle`, off by default (D-025, C-REQ-009). Flipping it changes the preview text between the neutral and the named variant with a 200 ms cross-fade (`fadeMs`). Helper copy uses the existing `namesHelpOff` / `namesHelpOn` strings. The named variant text is Design B's; it never contains letter text.

**Live preview.** One non-interactive `Card variant="flat"` that stands in for a notification. Notes:
- Shows the app icon via a new brand registry context (for example `app.reminder-preview`); never pick a logo file by path (DESIGN_LANGUAGE 2a). If the registry will not add one, show no icon.
- Title and body are the real first neutral variant (`A minute to write?`), not invented text. Label it "How it will look", never "Preview of the alert", and never draw the iOS permission alert (HIG forbids it).
- The "Next:" line is computed by the planner (pure, so it respects the 20 h and 2 h quiet rules, so "Next" may be a later day than the parent expects, which is correct and shown as a date).
- Surface is solid `surfaceRaised`; no blur anywhere, so Reduce Transparency changes nothing.

**CTA.** `Button size="lg"` "Set reminder" (existing `onboarding.reminder.cta`). Sticky footer on normal sizes.

## 7. Pre-sheet, system alert, denied path, confirmation

**Pre-sheet.** Use `ReminderPrimingSheet` as is. It already has one button (Continue), no close, and no alert image [verified: priming-sheet.tsx]. One change to request: replace the two generic lines with their choice read back, so the sheet is specific ("Tuesday and Saturday evenings, around 8:30 PM"). Text only; do not annotate the alert. Shown only while iOS has never asked (`needsPriming()`).

**iOS alert.** The purpose string is set in config, outside this lane. Not verified on a real phone; nothing has run on a device [verified: BRIEF].

**Confirmation (allowed).**

```
+--------------------------------------------+
|  (moon, drawn in, 600 ms)                  |
|  Set for {child}                           |
|                                            |
|  Tuesday and Saturday, around 8:30 PM      |
|  Next: Tuesday                             |
|                                            |
|  What we may send                          |
|   - A reminder on those evenings           |
|   - A short message when a new month       |
|     begins, and on birthdays               |
|  Never what you write. Nothing leaves      |
|  this phone.                               |
|                                            |
|  Change any time: Settings, Reminders      |
|  [ Done ]                                  |
+--------------------------------------------+
```

Open question for product: are month and birthday messages on by default [unverified in the code I read]? If on, this list is the honest disclosure; if off, drop the second line.

**Denied (never allowed, or declined at the alert).** The choices are saved (the existing code keeps them). The confirmation swaps the moon for a `WarningCircle` in `caution`, with icon plus words:

```
|  Saved, but notifications are off          |
|  Turn them on in iPhone Settings and       |
|  these start. Nothing else changes.        |
|  [ Open Settings ]        Not now          |
```

- Reuse `deniedTitle` / `deniedBody` / `openSettingsButton`. NA-12 flags that "Settings" means two things; I suggest "iPhone Settings" in the body and button (Design B to decide).
- If iOS already said no before, skip the pre-sheet (it cannot open an alert), go straight here.
- Coming back from iPhone Settings with permission granted: the card collapses (`LinearTransition` 280 ms) and the toast "Reminders are on." shows once [verified: reminders.tsx].
- No repeat asks. The only later entry point is Settings, Reminders.

## 8. The 21:30 gate, and how it reads if product moves it

Today: no notification before 07:00 or after 21:30 [verified: planner.ts `EARLIEST_MINUTES`, `LATEST_MINUTES`]. The planner accepts a `window`, so the UI must read the latest time from it and never hard-code "9:30".

- Chips and wheel stop at the window's latest time. If the anchor suggests later (After 9 gives 10:15 PM), the suggestion is the latest allowed and a line appears: "Late nights stay quiet." (existing `lateNightClamp`).
- Today (latest 21:30), "After 9" shows `[9:00 PM] [9:15 PM] [9:30 PM*]`, tag "Suggested", clamp line shown.
- If product moves latest to 22:30: "After 9" shows `[9:30 PM] [10:00 PM] [10:15 PM*]`, no clamp line, and the Settings footer reads the new limit.
- Bug to hand over: `quietHelp` hard-codes "7 AM and 9:30 PM" [verified: reminders.en.ts line 52]. It must become a template filled from the window, or it will lie after the change.
- Honest note on the framing: a 21:30 limit means the reminder can land before a late-sleeping child is down. The suggestion helps; the line "Late nights stay quiet." explains why we stop there.

## 9. Changing it later

- **Settings, Reminders** (screen exists, S34): same controls as screen B, plus the same live preview component, so what you see matches setup.
- **Quiet this book:** per-child switch in "{child}'s book" settings (`children.settings.remindersHelp` already exists; "Hide this book" quiets every reminder and message about {child}, nothing deleted) [verified: EXPERIENCE_PASS lines 1162, 1164]. Row label working copy: `Quiet reminders for {child}`.
- **Pause:** the experience pass proposes removing "Pause all reminders" because it duplicates the master switch [verified: S34]. I agree it should not duplicate. I recommend a different row, `Pause for a while`: 1 week, 2 weeks, until I turn it back on, which resumes by itself. It is a different decision (a hard week, a new baby) and needs planner support, which I did not see in the constants I read [unverified]. After choosing, the toast says "Paused until {date}." with Undo. On resume, no "welcome back" message and no mention of what was missed.
- **One tap stops everything:** the master Reminders switch at the top of the screen.

## 10. States checklist

Card: shown, dismissed, hidden-forever. Screen A: nothing selected, selected, skipped. Screen B: each of the four cadences; zero evenings error; clamped time; names off and on; picker open. Permission: never asked (pre-sheet), granted, denied now, denied before, returned from iPhone Settings. Confirmation: allowed, denied, none chosen (no confirmation; sheet just closes). Errors: scheduling failure shows `InlineState` with "We could not set that up. Try again." and a retry button, choices kept.

## 11. Accessibility

**Dynamic Type to AX5.** Nothing truncates (D-027): titles wrap, chips become full-width rows with a check at accessibility sizes (seven weekday rows, each 44 pt min). `ButtonRow` stacks from xxxLarge. The sheet scrolls; from accessibilityLarge up the CTA scrolls with content instead of sticking, so it can never hide a field. The preview body wraps fully, never clipped.

**VoiceOver.**
- Focus lands on the sheet heading on open (Sheet behaviour).
- Order: heading, intro, choices top to bottom, preview, then CTA. The preview reads as one element: "How it will look. Reminder from Early Letters at 8:30 PM. A minute to write? One thing about today is plenty." Decorative moon is hidden.
- Weekday chips read the full name and state: "Tuesday, selected".
- The "Next:" line is a polite live region, debounced to 600 ms, so changing three chips quickly produces one announcement.
- The names toggle announces its helper text as the value.
- Clamp and validation lines use the same icon plus words and are announced.

**Targets and contrast.** 44 pt minimum on every chip and row; tokens only (`accent`, `controlBorder`, `caution`, `success`), contrast already verified in DESIGN_LANGUAGE for both themes; Increase Contrast uses `tokens.highContrast`. Selected = fill plus edge plus check.

## 12. Motion and Reduce Motion

| Moment | Normal | Reduce Motion |
|---|---|---|
| Sheet opens | `standard` spring rise | fade over `fadeMs` (200 ms), no travel |
| Cadence change reveals or hides the evenings row | `LinearTransition` 280 ms | instant swap with a `fadeMs` fade |
| Preview text changes (names toggle, time) | 200 ms cross-fade | same; it is already a fade |
| Moon on confirmation | stroke drawn 600 ms (`LineArt animate`) | complete drawing at once |
| Chip select | `tap` haptic, press scale 0.97 | haptic only |

No confetti, no counts, no streak visuals (DESIGN_LANGUAGE principle 4). Use `useMotion()`; components never read the setting directly.

## 13. Working copy (placeholders; pass the content rules)

| Key (proposed) | Text |
|---|---|
| card title / body | A quiet minute for {child}? / A few evenings a week, after {child} is asleep. You pick the time. Never late. |
| A title / question | A few words for {child}, once {child} is asleep / About when does {child} fall asleep? |
| A privacy line | We only keep the reminder time. |
| B labels | How often / Which evenings / What time / Suggested |
| clamp | Late nights stay quiet. |
| confirm title | Set for {child} |
| denied title | Saved, but notifications are off |

## 14. Hand-offs and open items

- `mobile`: wire the Tonight card (`reminderPrimePending`), build screens A and B and the confirmation from the components named above, template `quietHelp` from the window, add the "Next:" line from the planner.
- Design B: final words, named-variant lock-screen text, one noun for the child when no name.
- Product: month and birthday messages default; card return policy; whether "Pause for a while" is in v1.0; whether the sleep-band question stays after the five parent sessions.
- Engineering: nothing here needs remote push or a server; all of it is local notifications. Photo nudges are not in this lane.
- Everything on-device (alert timing, lock-screen look, time zones) is unverified until it runs on a real phone.

Sources read: docs/design/DESIGN_LANGUAGE.md, COMPONENTS.md, MOTION.md, BENCHMARK.md, EXPERIENCE_PASS_2026-10.md (S34); priming-sheet.tsx; settings/reminders.tsx; planner.ts; reminders.en.ts; strings.en.ts `onboarding.reminder`. External: developer.apple.com HIG Privacy; help.headspace.com reminders; support.calm.com reminders; a Medium Headspace onboarding review.
