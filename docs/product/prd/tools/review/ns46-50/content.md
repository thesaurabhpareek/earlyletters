# Review of NS-46 to NS-50: voice and content rules (lens: `content`)

Status: WORKING-INPUT (record; findings applied in the cards; do not load) | 20 Nov 2026 | Owner: the review role named in the file | Replaces: none | Load when: auditing where a finding came from; otherwise do not load.

Reviewer: `content` role (Claude), 20 Nov 2026. Branch docs/locked-pack-inputs-20nov, nothing committed. ASCII only.
Nothing here is legal advice. Rulings in GAP-LOG are not reopened; conflicts are flagged.

## 0. What I read, what I ran

Read this session: `ns46-50/BRIEF.md`; `docs/product/prd/21-days-cultural-photos-home.md` (all of NS-46, NS-47, NS-48, NS-50 and the strings of NS-49); `packages/content/VOICE.md` (all); `packages/content/BRAND.md` glossary (lines 80 to 123); `packages/content/test/rules.test.ts` (lines 255 to 320); `packages/content/src/features/reminders.en.ts` (lines 1 to 24, the built neutral set); `functions/notification-catalogue.md` (sections 4 and 6 in full); `functions/days-library.md` (section 5 in full, 4.8 by search); `functions/languages-and-localisation.md` (4.3 and the coverage table); GAP-LOG lines 430 to 431 (N-5, N-6) and the card's own copy of N-, CB-, DL- rulings; `docs/design/NOTIFICATIONS.md` lines 50 to 59.

Ran: my own scratch script over the 40 samples in NTC section 6 (title at most 40, body at most 110, both renderings, plus a word scan). All 40 pass the length limits in both renderings. It is not the repo suite: I did not run `npm test`, and the new `{day}` slot and `days.*`/`ntc.*` families do not exist in the repo yet, so nothing below has been through `rules.test.ts`. I did not open `packages/content/src` beyond `reminders.en.ts`, so whether the checker's banned-word list catches the words I flag is UNVERIFIED (the file says the full list lives in the copy checker).

Two housekeeping points:
- The brief says "zero exclamation marks ruling N-6". In GAP-LOG the zero-exclamation ruling is N-5 (line 430); N-6 (line 431) is the days-from-anchor axis. The cards cite N-5 correctly. No change to the cards.
- `VOICE.md` line 70 still says "At most one exclamation mark per month across all notifications", which contradicts its own line 160 ("none in notifications") and N-5. NS-48-R10 already schedules the fix. It is mine to make; I have not made it because this task writes one file. Proposed line: "No exclamation marks in notifications."

## 1. Findings, in severity order

Format: card and row; what is wrong; evidence; severity; fix.

### F1. Kind-based titles put the last letter's kind on the lock screen (NS-48-R5, N-4)
- Card/row: NS-48-R5 and section 16; samples in NTC section 6.
- Wrong: R5 and N-4 say a title never mentions the kind of the last letter, only a body may. Nine sample titles do:
  - `ntc.kind.typed.baby.01` "Say it out loud?" (says the last one was typed)
  - `ntc.kind.typed.toddler.01` "Typed or spoken"
  - `ntc.kind.typed.child.01` "Your own words again"
  - `ntc.kind.picture.baby.01` "A picture with it?"
  - `ntc.kind.picture.toddler.01` "Any picture today?"
  - `ntc.kind.first.newborn.01` "Another first?"
  - `ntc.kind.first.child.01` "Something new?"
  - `ntc.kind.small.baby.01` "Not much is a fine answer" (tells a passer-by the parent last tapped Not much today)
  - `ntc.kind.spoke.toddler.01` "New words lately?" also reveals an age band by implication.
  So the card's own samples fail the card's own R5. Evidence: NS-48-R5 text; NTC section 6 rows named.
- Severity: P1 (the samples are intent, but the 40 are what content will mine; R10's test checks only characters and word lists, so nothing would catch a kind in a title).
- Fix: kind cells carry a generic title and put the kind in the body only. Add row NS-48-R28 below (a test that titles are drawn from a small generic pool for kind cells). Replacement wording is in section 3.

### F2. "Another first?", "again", "lately" break the card's own never-list (NS-48-R4, section 14)
- Wrong: R4 forbids "a count, a comparison or a judgement". Section 14 forbids "again" after a long pause. NS-46-R17 bans "another year" and "a count or comparison". Sample titles and bodies use "Another first?", "Was there another first lately?", "Your own words again", "A minute more?". "Another" and "again" compare with a past letter and so show the app has looked at it. "A minute more?" asks for more than last time.
- Severity: P1.
- Fix: section 3 rows for `ntc.kind.first.*`, `ntc.kind.typed.child.01`, `ntc.kind.spoke.baby.01`.

### F3. "While you remember" and "while the day is fresh" are a forgetting warning (VOICE no-guilt rule)
- Evidence: VOICE.md line 56 "no warnings about what might slip away"; `ntc.grid.sat.r4.01` "Say it while you remember." and `ntc.occ.thanksgiving.01` "Say it while the day is fresh." Both imply a closing window, in r4 (15 to 35 days quiet), the band where tone matters most.
- Severity: P1 for the r4 line, P2 for the Thanksgiving line.
- Fix: section 3.

### F4. Family and tradition days: three different neutral titles and bodies (NS-47-R12, NS-46 section 16, DAY 5.1)
- Wrong: three sources disagree.
  - NS-47-R12 and the card's own key list say the neutral body is "one neutral string, the same for every layer", and that `days.lock.*` is the same words as `ntc.occ.neutral.01`: title "Something for the book today", body "A day you chose to mark. A few words for {child}, if you like."
  - DAY 5.1 and 5.4 still show the title "A day you wanted to remember" and bodies "Tap to see the day you chose." / "Tap to see the days you chose." / "A few words about today, for the book?" (different by layer).
  - NS-48-R9 says family, tradition and national days use "the neutral ones of NS-47-R12 and R13", while NTC sample `ntc.occ.family.01` puts the day name in the title (shown "only when names are on"). N-3 allows a title name only for public days, and NS-47-R13 allows a family or tradition title name only with the day-name switch on and App lock off. A names-on family title in the NTC sample therefore needs the day-name switch, not the child-name switch. Different switch, so the sample is wrong as written.
- Severity: P1.
- Fix: the card text already wins (it is later and cites CB-5). State in NS-46 section 16 that the days-library samples in 5.1 and 5.4 are superseded for neutral title and body, and strike `ntc.occ.family.01` as a names-on title: a family day with the switch off uses `ntc.occ.neutral.01`; with the day-name switch on and App lock off it shows the day name and the neutral body.

### F5. The neutral body is a question on a quiet day (NS-46-R16, NS-47-R12)
- Wrong: R16 says a `quiet` day (Good Friday, Yom Kippur) has "its name only, no prompt, no question mark". Good Friday and Yom Kippur are tradition days, so their lock screen uses the neutral title and the one neutral body "A day you chose to mark. A few words for {child}, if you like." That body is an invitation to write, which is the prompt R16 forbids. It also says the quiet day on the lock screen needs a different body than every other layer, which breaks "one neutral string".
- Severity: P1.
- Fix: add NS-46-R29 below: one second neutral body used only for `quiet` tone, "The book is open if you want it." (already the quiet landing line, so no new words). The "one string" rule in R12 becomes "one string per tone".

### F6. "Note" is a glossary breach for what the app sends (BRAND.md glossary row "What we send")
- Evidence: glossary: short piece someone makes = note; what we send = "reminder; message"; "note" banned for what we send. NS-48-R10 and NS-48 section 14 already ban "note for an app message", yet user-facing intent strings in NS-46 and NS-47 use it:
  - `culture.ask.question`: "Would you like a note on days that matter to your family?"
  - `notifications.dayNames.switch`: "Show the day's name in the note"
  - NS-46 section 19 enabled claim: "Pick the days you want a note on."
  - NS-46 Me group "Notes and days" (also reads as the short pieces a person writes).
  The prose of the cards says "note" for notifications throughout; that is internal and fine. Only the strings a parent reads matter.
- Severity: P1 (a store claim and a Home slip are on this list).
- Fix: "Would you like a reminder on the days that matter to your family?"; switch label "Show the day's name in notifications" (matches the built "Names in notifications"); enabled claim "Pick the days you want a reminder on."; Me group "Days and reminders" or leave it to tree test T1 (R-IA-4) with the two candidates. NS-48-R10's "note" ban should be a test over the real keys, not prose.

### F7. "A day we mark" implies the app does the marking (NS-46 section 15; NS-46-R17 and DAY 5.2 rule 5)
- Wrong: section 15 labels the two list sections "a day you type" and "a day we mark" (CUL section 4). DAY 5.2 rule 5 says "the verb in the picker is mark" and "a parent may only mark it". "A day we mark" has us marking a day, and a family may take "we" to mean the app decides which days matter. It also reads against "Nothing is ticked for them".
- Severity: P1.
- Fix: section headings "Days you added" (typed, NS-18) and "Days you chose" (ticked from the library). The card name "Days we mark" and R-IA wording stay internal only.

### F8. "Which calendar does your family follow?" is about belief and reads wrong (NS-46-R14, section 16 `days.picker.whichCalendar`)
- Wrong: the cases the question serves are authority differences (Eid al-Fitr 2026, 20 or 21 Mar; Diwali 2027, 28 or 29 Oct). That is a date source, not a "calendar" in the sense FR-LOC-12 uses (the book counts only in the Gregorian calendar). "Your family follow" also asks a faith question at the one moment the card promises it never does (NS-46-R20 bans "your tradition"; NS-47 never-list). A Hijri or Hebrew calendar reading of the word would make a parent expect the date shown in that calendar, which the app does not do (FR-LOC-11).
- Severity: P1 (promise the code does not keep).
- Fix: "Dates differ by country. Which date should we use?" with option labels that name the source plainly, for example "Announced in Saudi Arabia" (the label is the authority's name from the data, `authority` field), plus "I will pick my own date" which opens the move-a-date control. Say "around {date}" for any option still `about`.

### F9. Weekday and day names from the platform's localisation, in an English sentence (NS-48-R25, NS-46 section 8)
- Evidence: NS-48-R25 "weekday and day names come from the platform's localisation"; FR-LOC-10 says the interface is English through 1.0.x and a spoken language never changes the interface; FR-LOC-11 pins dates to `gregory` and Latin digits.
- Wrong: on a phone set to Hindi or Arabic, "A page for {weekday}" would read "A page for <Devanagari weekday>" inside an English sentence, and "around {date}" would carry Arabic-Indic digits unless pinned. This is the mixing the VOICE multilingual rule says the app does not promise.
- Severity: P1.
- Fix: new row NS-48-R30 below: while the interface is English, `{weekday}`, `{day}` and `{date}` render with locale `en`, `calendar: 'gregory'` and Latin digits, reusing the `dates.ts` pin (FR-LOC-11). Day names that belong to another language keep the family's spelling (FR-DAY-19) and are data, not formatted.

### F10. "your little one" as the fixed neutral rendering is assembled in code (NS-48-R13 against R25, FR-LOC)
- Evidence: NS-48-R13: "`{child}'s` becomes 'the', `{child}` becomes 'your little one'". "Your little one" is already the shipped neutral wording (`reminders.en.ts` lines 16 to 20) so the English is fine. The mechanism is a string replace in code: `{child}'s` to "the" needs the author to check every sentence, and several sample bodies read badly once replaced: `ntc.grid.mon.r4.01` neutral is "Tell your little one one thing about today." (two "one"s); `ntc.kind.spoke.toddler.01` neutral "Say it as your little one said it." (repeats the phrase); `ntc.occ.newyear.01` neutral "Say a hope for your little one out loud. One day your little one can hear it." (two in two sentences). FR-LOC section on "no sentence assembled in code" asks for locale-ready strings; NS-48-R25 says the same.
- Severity: P2 (English works; the cost is a poor neutral line in a few cells and a harder later language).
- Fix: keep R13 as the default but let R13's "explicit override" be required wherever the rendered neutral line repeats "your little one" in one body (a lint, not a rewrite by hand). I give overrides in section 3.

### F11. "Another tradition", "A tradition your family keeps", "Choose days" (NS-47 section 16)
- "A tradition your family keeps" asserts the family keeps one. A family with none has no honest answer except "Not now". NS-46-R20 bans "your tradition" for the same reason. Fix: "Traditions" as the header, with "A tradition" as the one-line help ("Pick any that fit. You can pick more than one."). Keep "A country that matters to your family" (it asserts a country matters, but "Not now" and a list that includes every country make that mild; P2, no change required).
- "Another tradition" is the card's name for adding a day of one's own. It now sits next to a page that says "Add a day" (NS-18's flow). Two doors for the same act. Fix: one label, "Add a day". Severity P2.

### F12. Photo and picture are mixed (NS-49 section 16)
- "Start from a photo" and "Pick a photo instead" against "Choose one picture" and the claim "Pick a picture from your recent days". The glossary has no row for it. A parent should meet one word in one flow. Fix: "photo" (it is what NS-01 uses and what the built button says). Severity P2.
- "Pick from recent days" is calm and honest and avoids "moments" and "memories", both banned. Keep.
- The phone's label: `label.fromPhone` should read "From your phone" (short, true, not a claim that the app understood the picture). Severity P2.

### F13. The next-year line promises an update (NS-46-R15, `days.nextYear.line`)
- Card text: "{day}: the date for next year arrives with the next update." The code cannot promise an update will carry it (VOICE "Never write copy that promises something the code does not do"; DAY 3.6 leaves bundle or pack to engineering).
- Severity: P2.
- Fix: "{day}: no date for next year yet." No promise, no gap language, no countdown. The Days page note about delivery belongs in the help article if the date refresh route (NR-DAY-07) ships.

### F14. Call-out wording depends on a default that is not locked (NS-47 section 12, R6 and R22)
- Wrong: "Only on this phone." is true only if the store is out of the iPhone backup (CUL-Q4, default Exclude, no GAP-LOG ruling). R22 already says each sentence needs a claims row true of that build, which is right. Add: the string is not final until `mobile` confirms the exclusion in a build, and if CUL-Q4 is overruled the string must say "and in your own iPhone backup" (R6 already says so).
- "Used for one thing: suggesting days to mark." keeps the app as the one suggesting. Fine for the days, but the NS-49 keys ban "we suggest". Two different registers for one verb. Fix: "Only used to find days for you to pick. Change or clear any time in Me." (the CUL shorter draft). Severity P2.
- The delete line "We keep nothing about the days you chose; it was only ever on your phones" (NS-47-R17) reads as a sentence about loss ("it was only ever") and says "phones" where an offline other phone has not cleared yet, which the same R17 says the line must not claim. Fix: "Days you chose stay on your phones and are cleared with your account." Severity P2.

### F15. Three ticked days on one date; "joined by 'and'" (NS-46-R8)
- R8 tests two days. Easter, Passover and Ramadan can overlap in some years. "Both names" is wrong for three. Fix in R8: the names are joined with a list format in English ("A, B and C"), and the lock title for any number of days is the one neutral title. Severity P2.

### F16. Home slip: the landing question on a day slip (NS-50-R3)
- "{day}. Anything you would like {child} to hear about today?" is good and universal (DAY 5.2 rule 3). The slip puts a question and a "Not now" button side by side. "Not now" next to a question reads as a pressured answer, the same pattern NS-47 solved by equal weight. NS-50-R7 says "Not now" is "not an answer to anything", which is the right line. Make the label for the day slip "Close" or "Not today". Severity P2. `en.common.notNowButton` is correct for the Days ask slip (it is an answer) and wrong for the day slip (it is not). Suggest a separate key.

## 2. The catalogue grid: fun, within the rules?

Verdict: within the rules in spirit, but flat. It passes length and character rules, and the weekday and recency design is right. "Fun and engaging" (direction 4.1) is not yet in the words. Of the 40 samples, about a third are the same shape ("Anything from X with {child}? Talk or type."), several share the same closer ("or just tap Not much today", "Just talk."), and the humour the direction asked for appears almost nowhere. VOICE says "sometimes a smile"; Friday and Saturday are where it can live.

What the grid does well (leave alone):
- The recency axis shortens and opens as the gap grows, and no sample counts or names the gap. Good.
- `ntc.kind.small.*` answers a "not much today" mark by saying it was fine, without describing the parent. Good, once the title is generic (F1).
- The weekday tones: Monday small, Friday light, Sunday slow.
- The evening-only tag and the 17:00 filter (N-8).
- "Something for the book today" as the neutral title. It is calm, true, and reveals nothing.

Where it stretches the rules (beyond F1 to F3):
- "Just talk." (`ntc.grid.mid.r3.01`) and "or just tap Not much today" (3 samples): VOICE "Words we lean on" bans "Just X" closers. "Just tap Not much today" is in the shipped floor (`reminders.en.ts` line 20), so this is a P2 style point, not a rule failure; fresh lines should not copy it.
- "page" in "A slow Sunday page", "A page for today": the glossary bans "page" for a month section of the book, not for this use, and the shipped floor has "A page for {weekday}". P2, no change required; I would not add more.
- "A small update?" (`ntc.kind.spoke.newborn.01`): "update" is a status word, and the newborn case is the most tired parent. Use "A small thing?" P2.
- "Where did the day go with {child}?" has a faint sense of time lost. P2; replacement below.

A few more fun lines, to show the register (every one checked by eye against the VOICE mechanics; none runs through `rules.test.ts` yet; length counted: titles under 40, bodies under 110; every one has a neutral rendering that reads without repeating "your little one"):

| Cell | Title | Body (names on) | Body (neutral) |
|---|---|---|---|
| fri.r1 | Friday, nearly there | What made you smile this week? Say it for {child}. | What made you smile this week? Say it for your little one. |
| fri.r2 | Friday question | If this week had a headline for {child}, what would it be? | If this week had a headline, what would it be? |
| sat.r2 | Saturday, no plans needed | Something small from today is plenty. | same rule |
| sat.r4 | Saturday | What is {child} into this week? Say it your way. | What is the little one in your life into this week? Say it your way. |
| sun.r1 | A slow Sunday | One thing from the weekend you want {child} to hear one day. | One thing from the weekend, for the book. |
| mon.r2 | A small start | One line about {child} is a good Monday. | One line is a good Monday. |
| mid.r3 | A good moment | A funny word or a new sound counts. | same rule |
| mid.r4 | The book is here | Say a sentence, or tap Not much today. Both are fine. | same rule |

Note: "headline" is a playful word and not a machine-writing word; "Say it your way" is the brand idea (in your own words). I avoided "Just", "again", "more", "lately", "while", counts, and any word naming the last letter's kind.

## 3. Proposed fixed wording, string by string

Samples from NTC section 6 or card intent strings that fail or are weak, with a proposed replacement. All pass my length scan; none has been through the repo suite.

| Key or string | Now | Proposed | Why |
|---|---|---|---|
| `ntc.grid.sat.r4.01` | "What is {child} into right now? Say it while you remember." | "What is {child} into right now? Say it your way." | F3 |
| `ntc.occ.thanksgiving.01` body | "Who was around {child} today? Say it while the day is fresh." | "What was today like for {child}? A few words will do." (title stays "Thanksgiving") | F3; DAY 5.2 rule 4 bans presence words ("who was there", "around") and NS-46-R17 bans "around the table" |
| `ntc.occ.family.01` body | "A few words to {child} about the people around you today." | Delete as a names-on title (F4). If kept as a body: "A few words for {child} about today." | assumes presence and people; DAY 5.2 rules 2 and 4 |
| `ntc.kind.typed.baby.01` | "Say it out loud?" / "Your voice is part of the book. A minute out loud for {child}, when it suits." | Title "A minute for today?" Body: "Your voice is part of the book. A minute out loud for {child} is welcome, any time." | F1; the original sounds like a correction of typing |
| `ntc.kind.typed.toddler.01` | "Typed or spoken" | Title "A minute for today?" Body unchanged ("Either way it stays in your words. One thing about {child} today?") | F1 |
| `ntc.kind.typed.child.01` | "Your own words again" | Title "One thing today?" Body: "What did {child} tell you about today? Type it or say it." | F1, F2 |
| `ntc.kind.picture.baby.01` | "A picture with it?" | Title "Something to say?" Body unchanged ("Is there a photo of {child} with something to say? Pick it, then talk.") | F1; body may name the kind (R5) |
| `ntc.kind.picture.toddler.01` | "Any picture today?" | Title "Something to say?" Body unchanged | F1 |
| `ntc.kind.first.newborn.01` | "Another first?" / "A first look, a first sound. Anything new with {child} counts." | Title "Something new?" Body: "A first look, a first sound. Anything new with {child} counts." | F1, F2 |
| `ntc.kind.first.child.01` | "Something new?" / "Was there another first lately? A tooth, a word, a step." | Title "Something new?" Body: "A tooth, a word, a step. Anything new about {child} counts." Neutral: "A tooth, a word, a step. Anything new counts." | F2 |
| `ntc.kind.small.baby.01` | "Not much is a fine answer" | Title "A small thing?" Body: "One small thing about {child} is plenty, if there is one. Not much is fine too." | F1 |
| `ntc.kind.spoke.newborn.01` | "A small update?" | "A small thing?" | tone (F-grid) |
| `ntc.kind.spoke.baby.01` | "A minute more?" | "A minute for today?" | F2 (asks for "more") |
| `ntc.kind.spoke.toddler.01` | "New words lately?" / "Say it as {child} said it." | Title "A minute for today?" Body: "Any new word or funny sentence? Say it the way {child} said it." Neutral override: "Any new word or funny sentence? Say it the way it was said." | F1, F10 |
| `ntc.grid.mon.r4.01` | "Tell {child} one thing about today. A minute is plenty." | Names on: "Tell {child} about one small thing today. A minute is plenty." Neutral override: "Tell your little one about one small thing today. A minute is plenty." | F10 (two "one") |
| `ntc.occ.newyear.01` | Neutral: "Say a hope for your little one out loud. One day your little one can hear it." | Neutral override: "Say a hope out loud for your little one. One day it can be heard." | F10 |
| `ntc.grid.mid.r3.01` | "A page for today, whenever you like. Just talk." | "A page for today, whenever you like. Talk or type." | "Just X" closer |
| `ntc.grid.sat.r2.01` | "Where did the day go with {child}? Say a little of it." | "What was the day like with {child}? Say a little of it." | faint loss tone |
| `ntc.occ.fourthjuly.01` title | "Fourth of July" | "Independence Day" | DAY uses this name; use the family's most common name consistently, and keep one |
| `culture.ask.question` | "Would you like a note on days that matter to your family?" | "Would you like a reminder on the days that matter to your family?" | F6 |
| `notifications.dayNames.switch` | "Show the day's name in the note" | "Show the day's name in notifications" | F6 |
| `culture.picker.tradition.header` | "A tradition your family keeps" | "Traditions" with help "Pick any that fit." | F11 |
| `culture.another` | "Another tradition" | "Add a day" (one door) | F11 |
| `days.picker.whichCalendar` | "Which calendar does your family follow?" | "Dates differ by country. Which date should we use?" | F8 |
| `days.nextYear.line` | "{day}: the date for next year arrives with the next update." | "{day}: no date for next year yet." | F13 |
| List headings in C-S24 | "a day you type" / "a day we mark" | "Days you added" / "Days you chose" | F7 |
| `culture.signOut` and delete lines | "We keep nothing about the days you chose; it was only ever on your phones" | "Days you chose stay on your phones and are cleared with your account." | F14 |
| Slip close on a day slip | "Not now" (`en.common.notNowButton`) | "Not today" on the day slip; keep "Not now" on the Days ask | F16 |
| Enabled claim, NS-46 section 19 | "Pick the days you want a note on." | "Pick the days you want a reminder on." | F6 |

Strings that pass and should stay: "Choose days"; "Not now" on the ask; "Pick from recent days"; "Choose one picture"; "Pick a photo instead"; "{day}. Anything you would like {child} to hear about today?"; "{season}. What does today look like?"; "{day}. The book is open if you want it."; "Something for the book today"; "around {date}"; the door line (once F14 is applied); "Start from a photo".

## 4. New rows proposed

All new row ids are card-local; no backlog id is invented.

| Id | Card | Row (Given, When, Then) | Priority | Test title |
|---|---|---|---|---|
| NS-48-R28 | NS-48 | Given any `ntc.kind.*` key, When the rules test runs, Then its title is drawn from the generic title pool (at most 6 titles shared across all kind cells: "A minute for today?", "One thing today?", "Something to say?", "Something new?", "A small thing?", "The book is open") and no title contains the words typed, spoken, voice, picture, photo, first, again, another, lately or more; only the body may name a kind (R5) | P1 | `[NS-48-R28] kind never reaches a title` |
| NS-48-R29 | NS-48 | Given the catalogue and `days.*` files, When the rules test runs, Then no key whose title or body a parent can read contains "note" as the app's own message, "story", "memory", "moment", "tonight" outside evening-tagged keys, "while you remember", "before it", "gone", "last chance" or a word from the existing fear pattern at `rules.test.ts:182`, and the test is over the real keys (not over prose in this card) | P1 | `[NS-48-R29] catalogue and days keys pass the vocabulary scan` |
| NS-48-R30 | NS-48, NS-46 | Given the interface is English (FR-LOC-10), When `{weekday}`, `{day}` or `{date}` render, Then they use locale `en`, `calendar: 'gregory'` and Latin digits whatever the phone's language or calendar (FR-LOC-11), and a test runs the catalogue under `hi`, `ar` and `en-u-ca-islamic` tags and finds no non-Latin digit or weekday name | P1 | `[NS-48-R30] names and dates render in English` |
| NS-48-R31 | NS-48 | Given a rendered neutral variant, When it contains "your little one" more than once or "one" twice in a row, Then the build fails until the author supplies an explicit neutral override (R13) | P2 | `[NS-48-R31] neutral renderings read cleanly` |
| NS-46-R29 | NS-46, NS-47 | Given a `quiet` tone day on a lock screen with the neutral title, Then the body is the quiet line ("The book is open if you want it.") with no question mark and no invitation to write; the neutral body for every other tone is the one string of NS-47-R12 | P1 | `[NS-46-R29] quiet days have a quiet neutral body` |
| NS-46-R30 | NS-46 | Given any list heading, button, claim or help line on C-S24, C-S25, C-S26 or the Home ask slip, When the rules test runs, Then none says "your religion", "your tradition", "a day we mark", "note" for a reminder, or any claim that the library is complete; the headings are "Days you added" and "Days you chose" | P1 | `[NS-46-R30] days surfaces use the parent's verbs` |
| NS-46-R31 | NS-46 | Given three or more ticked days on one date, Then the names are joined with an English list format ("A, B and C"), the lock title is the one neutral title, and no string is built by joining in code | P2 | `[NS-46-R31] many days on one date read cleanly` |
| NS-50-R10 | NS-50 | Given the day slip, Then its close button is a separate key from the Days ask's `notNowButton` and is labelled "Not today"; Given the Days ask slip, Then "Not now" is an answer of equal weight (NS-47-R25) | P2 | `[NS-50-R10] two slips, two close labels` |

## 5. Conflicts to flag (not ruled here)

1. N-5 zero exclamation marks against `VOICE.md` line 70 (one a month): the card already schedules the fix; I confirm line 70 is still the old text.
2. NS-47-R12 "one neutral body for every layer" against DAY 5.1/5.4 (different bodies per layer) and against R16 (a quiet day needs no prompt). My resolution is "one neutral body per tone" (NS-46-R29). Karma to confirm.
3. NS-48-R9 and `ntc.occ.family.01`: a family day's title with names on. Under N-3, N-7, CB-5 and DL-10 a family day's name needs the separate day-name switch. The sample uses the child-name switch. Karma to confirm which switch.
4. The card-wide use of "note" for a notification is internal prose and not a failure; the glossary only binds strings a parent reads (F6).
5. NS-48-R25 (platform localisation for weekday and day names) against FR-LOC-10 and FR-LOC-11 (interface English, dates pinned). See F9; needs `mobile` agreement.

## 6. What is good enough to leave alone

- NS-46: nothing pre-ticked (R2), one list not two, no counts, no "complete your list" (R3, R19); "around" for moving days (R14); no greetings, no "celebrate", no relationship words (R17); `quiet` tone for Memorial Day and Veterans Day (R16); no look-back (R22); "Add a day" with parent words and writing tools off (D2).
- NS-47: "Not now" as a full answer with equal weight (R25); no "Eastern" option; no "your religion" key; alphabetical lists; claims need a claims row (R22).
- NS-48: the pure-function design; the 17:00 day-part filter; "your little one" as the neutral rendering (it is already shipped); the floor of the built 8; zero exclamation marks; max 40 and 110 characters (all 40 samples pass in both renderings).
- NS-49: "Pick from recent days"; no "moments", "memories", "smart", "suggested for you"; the absent-not-greyed rule; the label as the phone's text.
- NS-50: only today, never a list or a count (R2); one slip slot; the quiet-day slip is a name and one line, no question.

## 7. Verdicts

- NS-46: CHANGES. (a) F7 headings; (b) F8 "Which date should we use?"; (c) F13 next-year line; (d) F6 reminder wording in section 19; (e) F4 supersede DAY 5.1/5.4 neutral wording; (f) add NS-46-R29 to R31. No P0.
- NS-47: CHANGES. (a) F6 ask question and day-names switch label; (b) F11 headers and one "Add a day" door; (c) F14 call-out and delete wording; (d) F5 quiet neutral body in R12; (e) wait for the backup-exclusion confirmation before the call-out is final. No P0.
- NS-48: CHANGES. (a) F1 and F2: nine kind-cell titles and "another/again/lately/more" rewritten (section 3); (b) F3 two forgetting lines; (c) F9 pin English formatting (NS-48-R30); (d) F10 neutral overrides; (e) add NS-48-R28, R29, R31; (f) make the VOICE.md line 70 fix in the same PR (I will do it when asked). The grid design itself is sound; the words need a fun pass (section 2).
- NS-49: PASS with two P2 notes: one word for a picture (F12), "From your phone" label. The banned list in section 16 is right.
- NS-50: PASS with one P2: a separate "Not today" close for the day slip (F16, NS-50-R10).

## 8. Questions for the founder (each with a default)

1. Is the catalogue grid allowed to have a small amount of playfulness (for example "If this week had a headline for {child}, what would it be?") on Friday and Saturday? Default: yes, as in section 2; Monday and Sunday stay small and slow.
2. The ask slip and the day-name switch say "reminder" (the glossary word) instead of "note". Default: yes, change them; "note" stays internal.
3. The question for authorities that differ: "Dates differ by country. Which date should we use?" instead of "Which calendar does your family follow?". Default: yes (F8).
4. Family and tradition days' day-name switch (CB-5) is separate from the child-name switch. Is a family day (Mother's Day) allowed a day-name title when the parent turns on the child-name switch only? Default: no, the day-name switch decides.
5. One name for the 4th of July in all copy: "Independence Day" (days library) or "Fourth of July" (a catalogue sample). Default: "Independence Day".
6. Keep "Not now" on the day slip, or use "Not today"? Default: "Not today".
