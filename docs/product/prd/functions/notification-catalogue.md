# Notification catalogue and rotation: function review (wave 3, brief 2)

Status: CURRENT (LOCKED rev 2) (function review) | 20 Nov 2026 | Owner: `content` and `mobile` | Replaces: none | Load when: the notification catalogue and rotation (FR-NTC, NS-48).

FR code: NTC. Proposed card: NS-48 (outline in section 11). Agents: content, mobile. Date: 20 Nov 2026. Branch docs/locked-pack-inputs-20nov, nothing committed.
Status detail: proposal for Karma to rule. It specifies section 4 of `docs/product/prd/20-founder-direction-20nov.md` and changes no locked card until NS-48 is ruled in. I am a Claude role, not counsel; nothing here is legal advice.

## 0. The short version

1. One pure function, `selectNotificationKey`, picks a catalogue key for a notification the planner has already decided to send. It cannot add, remove or move a notification, so volume is unchanged by construction (section 5).
2. Five inputs shape the words: weekday tone, how far the fire date is from the last made letter, the kind of that letter, the child's age band, and a chosen day or season. A sixth, the part of the day of the reminder time, only filters words ("tonight" at 7 AM is wrong today; section 3.4).
3. Resolution is layered with fallbacks: chosen day, then last-letter question, then weekday by recency grid, then the built 8 variants. So an empty cell never means silence and never means a broken key.
4. Size: 256 variants at full size, 120 as a launch floor. That is fewer per cell than the founder's 8 to 12 (6 per grid cell), with the reason shown (section 4.3). Founder or Karma may overrule (Q-NTC-1).
5. Because iOS delivers notifications scheduled up to 35 days ahead (NS-13 section 3a), every input must be computable at plan time for a future fire date. That rules out "hours since the last save" as an axis; the axis is days between the last made letter and the fire date, which the plan knows (section 3.3).
6. Two findings that need a ruling beyond this card: VOICE.md contradicts itself on exclamation marks in notifications (section 12.1), and the built evening copy already says "tonight" and "Before you sleep" even if the parent chose a morning hour (section 3.4).

## 1. What I reviewed, and what I did not

Read this session:
- `docs/product/prd/tools/review/wave3-briefs.md` (brief 2), `gap-agents-common.md`, `docs/product/prd/20-founder-direction-20nov.md` (all), `packages/content/VOICE.md` (all), `docs/product/prd/functions/BRIEF.md` (format).
- `docs/product/prd/09-capture.md` NS-13 (lines 21 to about 120: built list, 3a back-off, happy and unhappy paths, scenarios) and NS-18 (lines 933 to about 990); `docs/product/prd/11-foundations.md` NS-32 (lines 13 to 110: classes, budget, R1 to R16).
- `apps/mobile/src/lib/reminders/planner.ts` (all), `copy.ts`, `index.ts`, `prefs.ts` lines 95 to 131, `scheduler.ts` by search (lines 30, 97 to 98, 124, 159, 257).
- `packages/content/src/strings.en.ts` lines 685 to 740 (`en.notifications`) and `packages/content/src/features/reminders.en.ts` (the first 80 lines: neutral copy, `together`, `priming`, `settings`).
- `packages/content/test/rules.test.ts` lines 266 to 306 (length limits, rhythm and gap patterns).
- `apps/mobile/src/lib/db/repos/types.ts` lines 6 to 60 (`EntryKind`, `CaptureMode`, `Entry`).
- `docs/design/NOTIFICATIONS.md` lines 50 to 59 and the first 30 lines of `docs/design/notifications/COPY_INVENTORY.md` (Design B, 87 rows and 174 variants, 1 Nov).
- `docs/product/prd/functions/messaging-and-entry-points.md` lines 84 and 130 to 135 (to avoid duplicating FR-MSG; none of those rows covers local notification copy).

Not read or run: the rest of `COPY_INVENTORY.md` and `NOTIFICATIONS.md`; the e2e `DESIGN.md` files on branch `docs/e2e-ux-20nov` (so no e2e screen id is cited; I name screens by words); the `days-library.md` output of brief 1 (it was not on disk when I wrote this; the day-class names used here, public, family and faith, are my proposal for it to adopt or replace); `packages/core` age math (`ageOn`) beyond the planner's comment that it matches; `scheduler.ts` in full; whether `Entry` carries a picture flag or a "first" flag (not in lines 20 to 60; NS-01 and NS-06 are not built). I ran no app and no repo test suite. I linted my 40 samples with a scratch script that copies the patterns in `rules.test.ts` lines 288 to 300 (rhythm, gap, day-count, plus length and banned words); it is not the repo suite, and every sample must pass `npm test` in `packages/content` before it ships.

## 2. Coverage check: what the repo and cards already say

| Fact | Where read | Consequence for the catalogue |
|---|---|---|
| Evening copy is 8 variants, rotated by `slotOrdinal(date, weekdays) % 8`; no variant repeats within 8 nudges, no title twice in a row | `planner.ts:139, 212, 353 to 356`; NS-13 built list | Rotation exists and is pure; the catalogue keeps the idea and widens the pool |
| Named and neutral are two parallel sets, same order | `reminders.en.ts` header; `planner.ts:243 to 247`; `strings.en.ts:690 to 699` | Doubles writing; section 3.5 proposes one text with a `{child}` slot and a default neutral rendering |
| Child names rotate in turn over name-bearing variants only | `planner.ts:222 to 236` | `namedSlotIndex` is tied to the 8 variants; it must move to the key (section 8) |
| Weekday only appears as the `{weekday}` slot in one variant | `strings.en.ts:698`; `reminders.en.ts` neutral list | Weekday as tone is new |
| Nothing in the planner reads the kind of the last letter; the planner gets only `lastSaveAt` | `planner.ts:66 to 67`; `prefs.ts:120 to 131` (`lastOwnSaveAt` returns a time) | New input needed (section 8) |
| `EntryKind` is `note`, `letter`, `not_much`; `CaptureMode` is `spoken`, `typed`, `mixed` | `repos/types.ts:12 to 13` | Spoke, typed and "not much today" are derivable now. "Picture" and "a first" are not found in the lines read |
| Back-off, one-per-day across classes, anchor counting drafts, sign-out cancel are required but not built | NS-13 section 3 "Not built today"; section 3a | The catalogue's recency axis depends on the anchor of NS-13 3a, so NS-13-R18 and R19 come first |
| Typed days: fixed line by default, typed words only if the parent switches that day's "show my words" on | NS-18 section 3; `GAP-LOG.md` D G-D14 | A day from the library reuses this: fixed line by default (section 6) |
| Budget: one budgeted notification a day; priority typedDay, birthday, monthAge, evening; plan notices outside; never time-sensitive; every body a content key; neutral hidden-preview placeholder | NS-32 section 3, R1 to R13 | Catalogue sits inside these; adds no class |
| Content limits: title 40, body 110; rhythm, gap and day-count patterns; none of "daily", "every day" | `rules.test.ts:269, 288 to 300` | Hard limits on every variant |
| Design B already wrote 87 rows and 174 variants, said to be a v1.1 content drop, with rotation by shape and ten sequencing rules | `NOTIFICATIONS.md:55 to 59`; `COPY_INVENTORY.md` head | Content must mine this first, not start blank (Q-NTC-6) |

## 3. The pure function

### 3.1 Where it lives and what it returns

`selectNotificationKey(input): NotificationKey` in `packages/core` (new file, for example `packages/core/src/notification-key.ts`), next to prompt selection, with age math from `ageOn`. Pure TypeScript, no React Native, no clock, no storage, no copy. It returns a key such as `ntc.kind.typed.toddler.02`. All words live in `packages/content` (a new `notifications.catalogue.en.ts`), looked up by key. The planner composes: it decides whether and when a notification exists (budget, back-off, quiet hours, smart quiet), then asks the function which words.

Why in core and not in `apps/mobile`: CLAUDE.md puts prompt selection in core, and the same reasoning applies (testable without a phone, no UI dependency, reusable by Android later). The mobile planner stays thin (BRIEF of the mobile role: keep logic in `packages/*`).

### 3.2 Input and output

```
type LastLetterKind = 'spoke' | 'typed' | 'picture' | 'first' | 'small' | 'none';
type AgeBand = 'newborn' | 'baby' | 'toddler' | 'child' | 'unknown';
type Recency = 'r1' | 'r2' | 'r3' | 'r4';
type WeekdayTone = 'mon' | 'mid' | 'fri' | 'sat' | 'sun';
type DayPart = 'morning' | 'afternoon' | 'evening';

interface SelectInput {
  fireDate: string;            // local YYYY-MM-DD the notification fires on
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  dayPart: DayPart;            // from the reminder time
  daysFromAnchor: number;      // fireDate minus the local date of the newest made letter (NS-13 3a anchor), >= 1
  lastLetterKind: LastLetterKind;
  ageBand: AgeBand;            // of the subject child on fireDate; 'unknown' when names are off and 2 or more books are included
  occasion: null | { id: string; sensitivity: 'public' | 'family' | 'faith'; displayName: string };
  namesShown: boolean;         // "Names in notifications" on and App lock off
  ordinal: number;             // slotOrdinal, as built: stable per slot, independent of the plan start
  previousKey: string | null;  // the key chosen for the previous planned notification
}
type NotificationKey = string;  // always a key that exists in content
```

Everything else the planner knows (hidden books, plan notices, the budget) is decided before the call and is not an input.

### 3.3 Why `daysFromAnchor`, not "hours since last save"

NS-13 section 3a schedules the whole back-off in advance so a parent who never opens the app still gets exactly the right nudges. A notification for 20 days ahead is created today, so the function cannot read a clock at delivery. It reads `fireDate - anchorDate`, which the plan can compute for any future date. Smart quiet (20 hours after a save, `planner.ts:135`) stays a planner rule that removes a slot; the catalogue never sees a removed slot. The recency bands below use that difference.

If the parent makes a letter, the next re-plan (a store write fires it) recomputes every future key from the new anchor, so a stale band cannot survive a letter.

### 3.4 Resolution order

1. **Occasion layer.** If `occasion` is set (a parent-chosen day from NS-46 that won the day, class typedDay, or a ticked season), choose from that day's pool. If `occasion.sensitivity` is `family` or `faith`, or `namesShown` is false and the pool has no neutral title, use the neutral-title pool: the title is "Something for the book today" and the day's name shows only after unlock (direction 3.4). A `public` day (4 July, a solstice) may put its name in the title.
2. **Last-letter layer.** Else if `daysFromAnchor` is in r1 or r2 and `lastLetterKind` is not `none`, choose from the pool for `lastLetterKind` and `ageBand`. If `ageBand` is `unknown`, skip this layer.
3. **Grid layer.** Else choose from the pool for `WeekdayTone` and `Recency`.
4. **Floor.** If the chosen pool is empty after filters, fall back to the built 8 evening variants by `ordinal % 8`. The function never throws and never returns a key that is not in content.

Filters applied inside each pool, in this order: `dayPart` (a variant tagged `evening` is dropped when the reminder time is before 17:00; today the built "A letter tonight?" and "Before you sleep" ignore this, `reminders.en.ts` neutral list, so a parent who picks 7 AM gets "tonight"; NS-48 fixes it for the new copy and for the 8 built variants), then `namesShown` (a variant with no neutral rendering is dropped when names are off).

Selection inside the pool: `pool[(ordinal + salt(cell)) mod n]`, then if the chosen title equals `previousKey`'s title, take the next one. `ordinal` is the same slot counter as today, stable across re-plans, so re-planning a plan that changed nothing changes no key (the plan signature, `planner.ts:373`, depends on that).

### 3.5 Names and neutral rendering

One text per variant with a `{child}` slot, not two parallel sets. Neutral rendering is a fixed rule applied by the renderer: `{child}'s` becomes "the", `{child}` becomes "your little one" (the wording the built neutral set already uses). An author may add an explicit neutral override on a variant when the rule reads badly. A test renders every variant both ways and lints both (section 9). A title never needs a name: the lock-screen title shows even when previews are hidden (NS-32 R13 sets only the body placeholder; this is how I read NS-32, see section 14), so the rule is a title with no `{child}` slot at all. All 40 samples below follow it; the only slots in titles are `{day}` and `{weekday}`.

## 4. Axes and the cell table

### 4.1 Axes

| Axis | Values | Source at plan time | Effect |
|---|---|---|---|
| Weekday tone | mon; mid (Tue, Wed, Thu); fri; sat; sun | fire date | Tone only: Monday small and fresh, Friday lighter, Saturday open, Sunday slow |
| Recency | r1: the day after the last letter; r2: 2 to 6 days; r3: 7 to 14; r4: 15 to 35 | `daysFromAnchor` (nothing is scheduled after day 35, NS-13 R18) | Invitation size: shorter and more open as it grows. Never refers to absence |
| Last letter | spoke, typed, picture, first, small ("not much today") | newest own made letter on this phone, across included books | A question that follows from it, never a summary of it. Used in r1 and r2 only; older than a week, the kind is no longer a useful hook |
| Age band | newborn (0 to 2 months), baby (3 to 11), toddler (12 to 35), child (36 months and over) | subject child on the fire date | The subject of the question. Bands are PROPOSED; they must use the same age the Book shows (`ageOn`) |
| Chosen day or season | a chosen day, a ticked season, none | the parent's ticks (NS-46) | The occasion line. A season is offered only if the parent ticked it; the app never infers one |
| Day part (filter) | morning, afternoon, evening | reminder time | Drops wording that names the evening when the hour is earlier |

Recency r1 starts the day after the anchor because smart quiet removes a nudge within 20 hours of a save (`planner.ts:135`, NS-13 3a rule 1), so a nudge the same day cannot exist.

### 4.2 Cell table (full size)

| Layer | Cells | Variants per cell | Variants | Notes |
|---|---|---|---|---|
| Grid | 5 weekday tones x 4 recencies = 20 | 6 | 120 | Age-neutral, so it can run with names off and several books |
| Last letter | 5 kinds x 4 age bands = 20 | 3 | 60 | Used in r1 and r2 only; `unknown` age falls to the grid |
| Chosen day, core days | 12 core days (NS-46 picks them; for example New Year's Day, Mother's Day, Father's Day, Memorial Day, 4 July, Labor Day, Thanksgiving, Halloween, winter solstice, Valentine's Day, Grandparents' Day, Siblings Day) | 4 | 48 | The founder asked for 4 per day |
| Chosen day, rest of the library | 3 sensitivity classes (public, family, faith) | 4 shared templates with a `{day}` slot | 12 | Only for days without bespoke copy |
| Chosen day, neutral title | 1 pool | 4 | 4 | Used for family and faith days and whenever names are off |
| Season | 4 seasons | 3 | 12 | Only when ticked |
| Floor | built evening set | 8 | 8 | Already written; kept as the fallback and migrated to the key scheme |
| Total | | | 264 (256 new plus the 8 built) | |

### 4.3 Why 6 per grid cell and not 8 to 12

The founder's range was "about 8 to 12 variants per cell for weekday evening by recency" (direction 4.3). At 20 cells that is 160 to 240 for the grid alone. The need is smaller than it looks: with back-off, one plan holds at most 11 evening nudges (7 in days 1 to 7 on everyEvening, then one per week; NS-13 worked bound), spread over up to 20 cells, so a single plan visits each cell about once. What repeats is the same cell across successive plans (a parent who writes weekly sees r2 on the same weekday again and again). With 6 variants and `ordinal` rotation, that is a repeat after 6 visits of that cell, which for a weekly parent is about six weeks. Going to 8 to 12 buys fewer repeats for a weekly parent at a writing cost of 40 to 120 more lines. This is a ruling, not a fact: Q-NTC-1, default 6.

Launch floor, if the full set is not ready for the freeze (Design B already planned a v1.1 content drop, `NOTIFICATIONS.md:59`): 3 per grid cell (60), 1 per last-letter cell (20), 2 per core day (24), 4 shared plus 4 neutral-title (8), 1 per season (4), 4 spare in the grid for the weakest cells, plus the 8 built = about 128. The floor ships because the fallback chain (3.4) makes thin cells safe.

## 5. How it fits NS-13 and NS-32 without raising volume

The claim: with the catalogue on, the set of planned notifications (ids, dates, times, classes) is identical to the set without it. Only `title`, `body` and the key differ.

Why that holds by construction:
- The selection function runs after the planner has made every decision about existence: reminders enabled and not paused, cadence weekdays, quiet window 07:00 to 21:30, smart quiet, the anchor and the 35-day back-off, the one-per-day budget by class priority, the 60 ceiling, plan notices first (NS-13 3a rules 1 to 9; NS-32 section 3). It receives one slot and returns one key.
- It adds no class to the NS-32 registry. The evening class keeps the same group, priority and pending ceiling. A chosen day is a typedDay (the class NS-18 and NS-32 already list), so it uses the existing top-priority slot. NS-32 R5 (registry rows, no `occasion` class) stays true: NS-46 reopens the word `occasion` only as a source of typedDay, not as a new class (this is the direction's Q-FD-6 first half, to be ruled).
- It has no way to schedule: it returns a string.
- "Fun and engaging" is voice, not volume (direction 4.1). The back-off ends all evening variety after day 35 exactly as today.

What the catalogue must not do, as testable rules:
- No catalogue key makes a notification time-sensitive (NS-32 R10) or changes its category's neutral hidden-preview placeholder (R13).
- A chosen day never makes a second notification on its date; it takes the one budgeted slot (NS-32 R1, R3).
- A chosen day is not removed by back-off (NS-32 R9) and its words are chosen from the occasion layer, which ignores recency, so a parent who has been quiet for a month never gets a day line that mentions the gap.
- With reminders off, typed days still come if notifications are allowed (NS-18 section 5, PROPOSED there); library days follow the same rule and the same Me, Reminders row. NS-48 does not change it.

Month and birthday notifications (`monthAge`, `birthday`) keep their own copy (`en.notifications.monthOpen`, `birthday`, and the `together` set). The catalogue covers the evening class and the occasion layer only. A month note on a day with a chosen day: the priority rule already picks the chosen day (typedDay outranks monthAge).

## 6. Forty sample variants

Written to VOICE.md and checked against the rules in `rules.test.ts` by my scratch lint (title at most 40 characters, body at most 110, no dashes or curly quotes or emoji or exclamation marks, no day counts, no gap words, no "daily" forms, no "story", no gendered words, no "note" for what the app sends, none of the banned machine words). Each reads as a question or an invitation. None counts, compares or judges. None implies anything wrote the letter. The key shows the cell. The last column is the neutral rendering when it differs from the named one (rule in 3.5). `{day}` is a new slot (the day's display name, at most 40 characters); `{weekday}` and `{child}` already exist in the allowlist.

| Key | Cell | Title | Body (names on) | Body (neutral rendering) |
|---|---|---|---|---|
| ntc.grid.mid.r1.01 | Tue-Thu, next day | A minute for today? | One small thing about {child} is plenty. | One small thing about your little one is plenty. |
| ntc.grid.mid.r1.02 | Tue-Thu, next day | One thing today? | Something {child} did, said or tried. A sentence will do. | Something your little one did, said or tried. A sentence will do. |
| ntc.grid.mon.r1.01 | Mon, next day | Start of the week | A small thing about {child} from today. Or tap Not much today. | A small thing about your little one from today. Or tap Not much today. |
| ntc.grid.mon.r2.01 | Mon, 2 to 6 | Monday, gently | One line for {child}'s book is plenty. | One line for the book is plenty. |
| ntc.grid.fri.r1.01 | Fri, next day | Friday, and a minute | What was the best small part of the week with {child}? | What was the best small part of the week with your little one? |
| ntc.grid.fri.r2.01 | Fri, 2 to 6 | A light one for Friday | Say one thing from this week that made you smile. | same rule |
| ntc.grid.sat.r3.01 | Sat, 7 to 14 | Saturday evening | Anything from the weekend with {child}? Talk or type, as you like. | Anything from the weekend with your little one? Talk or type, as you like. |
| ntc.grid.sat.r4.01 | Sat, 15 to 35 | A Saturday thought | What is {child} into right now? Say it while you remember. | What is your little one into right now? Say it while you remember. |
| ntc.grid.sun.r1.01 | Sun, next day | A slow Sunday page | Anything from the weekend you want {child} to hear one day? | Anything from the weekend you want your little one to hear one day? |
| ntc.grid.sun.r2.01 | Sun, 2 to 6 | Sunday evening | A quiet minute for {child}? Talk or type, whichever is easier. | A quiet minute for your little one? Talk or type, whichever is easier. |
| ntc.grid.sun.r4.01 | Sun, 15 to 35 | Sunday, quietly | A few words for {child}, or just tap Not much today. | A few words for your little one, or just tap Not much today. |
| ntc.grid.mid.r3.01 | Tue-Thu, 7 to 14 | The book is open | A page for today, whenever you like. Just talk. | same rule |
| ntc.grid.fri.r3.01 | Fri, 7 to 14 | Friday evening | If there is a minute, a page for {child} is open. | If there is a minute, a page for your little one is open. |
| ntc.grid.mid.r3.02 | Tue-Thu, 7 to 14 | Something small | A funny word, a new sound. Anything from {child} counts. | A funny word, a new sound. Anything from your little one counts. |
| ntc.grid.mid.r4.01 | Tue-Thu, 15 to 35 | Whenever you like | The book is here. One sentence, or just tap Not much today. | same rule |
| ntc.grid.mon.r4.01 | Mon, 15 to 35 | A fresh week | Tell {child} one thing about today. A minute is plenty. | Tell your little one one thing about today. A minute is plenty. |
| ntc.kind.spoke.newborn.01 | last: spoke, newborn | A small update? | What did {child} do today, even if it was sleep? Say a line. | What did your little one do today, even if it was sleep? Say a line. |
| ntc.kind.spoke.baby.01 | last: spoke, baby | A minute more? | What is {child} doing now that is new this month? | What is your little one doing now that is new this month? |
| ntc.kind.spoke.toddler.01 | last: spoke, toddler | New words lately? | Any new word or funny sentence? Say it as {child} said it. | Any new word or funny sentence? Say it as your little one said it. |
| ntc.kind.typed.baby.01 | last: typed, baby | Say it out loud? | Your voice is part of the book. A minute out loud for {child}, when it suits. | Your voice is part of the book. A minute out loud for your little one, when it suits. |
| ntc.kind.typed.toddler.01 | last: typed, toddler | Typed or spoken | Either way it stays in your words. One thing about {child} today? | Either way it stays in your words. One thing about your little one today? |
| ntc.kind.typed.child.01 | last: typed, child | Your own words again | What did {child} tell you about today? Type it or say it. | What did your little one tell you about today? Type it or say it. |
| ntc.kind.picture.baby.01 | last: picture, baby | A picture with it? | Is there a photo of {child} with something to say? Pick it, then talk. | Is there a photo of your little one with something to say? Pick it, then talk. |
| ntc.kind.picture.toddler.01 | last: picture, toddler | Any picture today? | Pick a photo of {child} and say what was going on. | Pick a photo of your little one and say what was going on. |
| ntc.kind.first.newborn.01 | last: a first, newborn | Another first? | A first look, a first sound. Anything new with {child} counts. | A first look, a first sound. Anything new with your little one counts. |
| ntc.kind.first.child.01 | last: a first, child | Something new? | Was there another first lately? A tooth, a word, a step. | same rule |
| ntc.kind.small.baby.01 | last: not much, baby | Not much is a fine answer | So is one small thing about {child}, if there is one. | So is one small thing about your little one, if there is one. |
| ntc.kind.small.toddler.01 | last: not much, toddler | One small thing | What did {child} point at, say or carry around? Or tap Not much today. | What did your little one point at, say or carry around? Or tap Not much today. |
| ntc.occ.public.01 | chosen day, public (named) | {day} | What was the day like for {child}? A few words will keep it. | What was the day like for your little one? A few words will keep it. |
| ntc.occ.family.01 | chosen day, family (named) | {day} | A few words to {child} about the people around you today. | A few words to your little one about the people around you today. |
| ntc.occ.neutral.01 | chosen day, any (neutral title) | Something for the book today | A day you chose to mark. A few words for {child}, if you like. | A day you chose to mark. A few words for your little one, if you like. |
| ntc.occ.newyear.01 | New Year's Day | A new year begins | Say a hope for {child} out loud. One day {child} can hear it. | Say a hope for your little one out loud. One day your little one can hear it. |
| ntc.occ.thanksgiving.01 | Thanksgiving | Thanksgiving | Who was around {child} today? Say it while the day is fresh. | Who was around your little one today? Say it while the day is fresh. |
| ntc.occ.fourthjuly.01 | 4 July | Fourth of July | What was today like for {child}? A line or two is plenty. | What was today like for your little one? A line or two is plenty. |
| ntc.season.spring.01 | first day of spring | First day of spring | What is {child} noticing outside right now? | What is your little one noticing outside right now? |
| ntc.season.summer.01 | start of summer | Summer begins | A few words for {child} about the light today. | A few words for your little one about the light today. |
| ntc.season.fall.01 | first day of fall | The season turns | What is different outside today? Tell {child} a little of it. | What is different outside today? Tell your little one a little of it. |
| ntc.season.winter.01 | winter solstice | The shortest day | A few words for {child} about how today felt. | A few words for your little one about how today felt. |
| ntc.grid.sat.r2.01 | Sat, 2 to 6 | Saturday | Where did the day go with {child}? Say a little of it. | Where did the day go with your little one? Say a little of it. |
| ntc.grid.mid.r2.01 | Tue-Thu, 2 to 6 | A page for {weekday} | Something from today for {child}'s book? | Something from today for the book? |

Notes on the samples:
- Evening-only (dropped when the reminder time is before 17:00): `ntc.grid.sat.r3.01`, `ntc.grid.fri.r3.01`, `ntc.grid.sun.r2.01`. The rest read at any hour.
- `ntc.occ.public.01` and `ntc.occ.family.01` put the day's name in the title; the family one is shown only when names are on (Q-NTC-2). Otherwise `ntc.occ.neutral.01` runs and the lock screen reveals nothing about the family.
- `ntc.kind.small.*` answers a "not much today" mark by saying that mark was a fine answer; it never mentions the quiet day as a fact about the parent.
- `ntc.kind.typed.toddler.01` uses the promise wording ("it stays in your words"); it does not suggest speaking is better than typing, and `ntc.kind.typed.baby.01` offers voice as an addition.
- `ntc.kind.picture.*` says "pick" because the picker returns only what the parent chooses (NS-01); it never says the app saw a photo. That wording must be rechecked if NS-49 adds suggestions.
- Words I avoided on purpose and why: "missed", "waiting", "still" (a gap), "again" after a long pause (a gap), "keep your streak" and any count, "the app will help you write", "story" (a person makes letters), any exclamation mark (section 12.1), "tonight" outside evening-only variants.

## 7. Rotation rules, retirement and tone

- Rotation is by slot ordinal inside a pool (3.4), so no variant repeats within its pool's length, and the previous title is never repeated (`previousKey` is the previous planned notification in the same plan; for the first one in a plan the planner passes the last key it scheduled, stored on the phone only under a new settings key).
- Rotation is by shape as well as by topic, following Design B (question, invitation, observation, tiny task, quote-a-line; `NOTIFICATIONS.md:55`): authors tag each variant with a shape, and the test forbids the same shape three times in a row.
- A variant is retired if testers turn reminders off within a day of seeing it. While analytics is off this is measured by the tester sheet (direction 4.2), not by any event. Retiring means removing the key from content; the fallback chain (3.4) covers a thinned pool.
- Tone words (VOICE.md): warm, calm, literary lightly. Friday may smile, Sunday goes slower, Monday stays small. Never hype.
- The 8 built variants are migrated into the key scheme as the floor, with their existing evening wording kept (their tests pass today).

## 8. What the planner and its neighbours must change

All of this is for the NS-48 build; nothing is changed now. File and line references are to the code read this session.

| Change | Where | Detail |
|---|---|---|
| Replace the numeric variant with a key | `planner.ts:139` (`VARIANTS`), `:353 to 356` (variant, named), `PlannedNotification.variant` (`:107`) | `PlannedNotification` gains `key: string`; `variant` stays only until the migration test passes, then goes. `planSignature` (`:373`) already includes title and body, so key changes re-plan cleanly |
| Break the tie between name rotation and the 8 variants | `planner.ts:222 to 236` (`NAMES_CHILD`, `NAMED_PER_CYCLE`, `namedSlotIndex`) | Name rotation counts name-bearing keys in the chosen pool; or rotate subject children by ordinal modulo included children, independent of copy, which also fixes the known skew when pools differ in name-bearing share |
| New planner inputs | `PlanInput` (`planner.ts:66 to 90`) | `lastLetter: { localDate, kind }`, an anchor (NS-13 3a), `chosenDays` (when NS-46 lands), the reminder `dayPart` derived from `prefs.time` |
| A reader for the last letter's kind | `prefs.ts:120 to 131` `lastOwnSaveAt` | Add `lastMadeLetter()` returning date and kind: `note` and `letter` with `captureMode` spoken or typed or mixed give spoke or typed (mixed: treat as spoke), `not_much` gives small. Picture and first need flags that I did not find (`repos/types.ts` lines 20 to 60); until NS-01 and NS-06 provide them, those kinds read as `none` and the layer falls back to the grid. Drafts waiting at Keep or held count for the anchor (NS-13 R-anchor) but not for the kind |
| Age band per fire date | planner, with `ageOn` from core | Computed for the subject child on the fire date, not today |
| Day part filter | planner | `dayPart` from the clamped reminder time |
| Tap payload | `scheduler.ts:159` | `data` carries `{ source, kind }` only. Add `key` so a later card can land on a prompt (NS-13 R9 is out of scope today); not needed for NS-48 beyond debugging |
| Copy home | `packages/content` | New `notifications.catalogue.en.ts`; `reminders.en.ts` `neutral.evening` and `en.notifications.evening` become the floor entries; the `{day}` slot is added to the placeholder allowlist in `rules.test.ts` |
| Core function | `packages/core` | New pure module plus its tests (section 9) |
| Out of scope for NS-48, but a prerequisite | NS-13 R18, R19, anchor counts drafts, sign-out cancels reminders | The recency axis is meaningless until the anchor and back-off exist (BL-537 is the existing row for back-off, NS-13 section 2) |

## 9. Test list

All tests are pure, in `packages/core` unless marked. Ids are `NTC-Tnn`. Titles follow the repo habit `[NS-48-Rn] ...`.

| Id | Given, When, Then |
|---|---|
| NTC-T01 | Same input twice, Then the same key (determinism) |
| NTC-T02 | Over 365 consecutive slots for each cadence, Then no key equals its predecessor and no title repeats twice in a row |
| NTC-T03 | For every non-empty pool of size n, Then n consecutive ordinals in that pool yield n distinct keys |
| NTC-T04 | Every key the function can return exists in `packages/content` (and the reverse: no orphan keys) |
| NTC-T05 | Every variant, rendered named and neutral, passes `rules.test.ts` limits and bans: title at most 40, body at most 110, no dash, curly quote, ellipsis character or emoji, no exclamation mark, no day count, no gap words, no "daily" forms, no machine-writing words, no "story" or "note" for app messages, no gendered words |
| NTC-T06 | Every variant, rendered with names off, contains no name and reads without a dangling slot (`{child}'s` becomes "the", `{child}` becomes "your little one"); no title carries a `{child}` slot at all |
| NTC-T07 | Names off by default: with `namesShown` false and any input, no returned title or body contains a child name (J-N24 in `14-test-plan.md`) |
| NTC-T08 | Plan-level: for generated `PlanInput`s across cadences, books and time zones, the set of (id, date, time, kind) is identical with and without the catalogue (volume unchanged) |
| NTC-T09 | Plan-level: no local date holds two budgeted notifications (NS-32 R1) and no key is chosen for a date the budget already gave to a higher class |
| NTC-T10 | Plan-level: nothing from the evening class after day 35 from the anchor (NS-32 R8), and r4 keys appear only on days 15 to 35 |
| NTC-T11 | A chosen day on a date takes the slot; its key comes from the occasion layer whatever `daysFromAnchor` is, and it survives back-off (NS-32 R9) |
| NTC-T12 | A `family` or `faith` day with `namesShown` false returns the neutral-title pool; its title and body contain neither the day name nor a faith word |
| NTC-T13 | Reminders off or paused: the function is not called and nothing is scheduled (NS-13) |
| NTC-T14 | Reduce notifications: a parent whose cadence is `weekly` or whose reminders are paused gets no extra key per week; "Reduce Notifications" settings the parent has set (cadence, paused, the Include in my reminders switch of each book) are all respected by the planner before the function runs (planner tests) |
| NTC-T15 | `dayPart` morning with an evening-only variant: the variant is never returned; with a reminder time of 07:00, no title or body contains "tonight", "evening" or "before you sleep" (applies to the migrated 8 as well) |
| NTC-T16 | `ageBand` `unknown` (names off, two or more books): the last-letter layer is skipped and the grid is used |
| NTC-T17 | Empty or thinned pool: the floor returns a built variant; the function never throws and never returns an empty key |
| NTC-T18 | A letter made today moves the anchor; every future key is recomputed from the new anchor on the next re-plan; a key for a date within the new r1 band never comes from the old r4 pool |
| NTC-T19 | A hidden or "Include in my reminders" off book contributes no age band, name or kind (NS-32 R14) |
| NTC-T20 | Every notification built from a key keeps interruption level `active`, never `time-sensitive`, and its category's neutral hidden-preview placeholder (NS-32 R10, R13) |
| NTC-T21 | Copy review gate: a variant containing a phrase longer than five words copied from another variant in the same pool fails (variety, not duplicates) |
| NTC-T22 | Shape rule: the same shape (question, invitation, observation, tiny task, quote-a-line) is never chosen three times in a row in a plan |
| NTC-T23 | A migration test: the first plan after an update re-plans every pending notification (NS-32 R16) and the migrated 8 floor variants still produce their built titles and bodies |
| NTC-T24 | Device check (founder, not CI): one week on a real phone with default settings; the lock screen shows no name; Sunday reads slower than Friday; an r3 nudge mentions no absence. J-N4 and J-N24 are the existing rows to extend |
| NTC-T25 | Tester sheet: for each retired variant, record the reminders-off-within-a-day case. No analytics event (analytics is off; `CLAUDE.md` privacy rules) |

## 10. Function requirements

Format per `BRIEF.md` section 3. Card rows are `NS-nn-Rn` where the row exists in a card I read, "new card row needed" otherwise. Screens: I did not read the e2e `DESIGN.md` files, so screens are named in words and marked "id not read"; Karma's trace should add the id. Backlog: "new row needed" (no BL id above 999 is invented); BL-537 (back-off) and BL-869 (#758) are existing rows named in the cards.

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-NTC-01 | Given any planned evening or day notification, When the planner asks for its words, Then a pure function in `packages/core` returns a catalogue key from the inputs in 3.2, the same inputs always give the same key, and every key exists in `packages/content` | NS-48 (new), NS-32-R11; Me > Reminders (id not read); new row needed | P0 (a) the machine never adds words: NS-32 R11 | mobile, content | Planner `planner.ts:243 to 247` today; section 3 |
| FR-NTC-02 | Given the catalogue is on or off, When a plan is built from the same inputs, Then the set of (id, date, time, class) is identical, so the catalogue never raises volume | NS-32-R1, NS-32-R7, NS-13-R19; new row needed | P0 (a) no nagging | mobile | Section 5; NTC-T08 |
| FR-NTC-03 | Given a plan for any future date, Then every input is computable at plan time: recency is `fireDate - anchorDate` and never a clock read at delivery | NS-13 3a, NS-13-R18; new row needed | P0 (a) no nagging | mobile | Section 3.3; NS-13 section 2 (r3 F14) |
| FR-NTC-04 | Given recency r1 to r4, Then copy is a question or an invitation that gets shorter and more open as the gap grows and never mentions the gap, a count, a comparison or a judgement | NS-13-R14 (never a count of a gap), NS-32; VOICE.md no-guilt rule; new row needed | P0 (a) no guilt, no counts | content | `VOICE.md` lines 54 to 56, 64 to 74; `rules.test.ts:297` |
| FR-NTC-05 | Given the last letter's kind (spoke, typed, picture, first, small), When it is within 6 days, Then the question follows from it and never summarises it or repeats the parent's words; the app does not read the letter's text for this | NS-48, constitution; new row needed | P0 (a) the machine never adds words | content, mobile | Direction 4.2; `repos/types.ts:12 to 13` Superseded in part by NS-48-R5 (picture is not a kind) and FR-NTC-29 on 20 Nov. |
| FR-NTC-06 | Given the weekday, Then it changes tone only (lighter Friday, slower Sunday, small Monday) and never the number or timing of notifications | NS-13, NS-32-R1; new row needed | P1 | content | Direction 4.2 |
| FR-NTC-07 | Given a child's age band on the fire date, Then it changes only the subject of the question; with names off and two or more included books, age bands are not used (the grid runs) | NS-48; NS-32 scenario "Two books"; new row needed | P1 | core, content | Section 3.4 layer 2; Q-NTC-4 |
| FR-NTC-08 | Given a parent-chosen day or ticked season, Then it takes the one budgeted slot as a typedDay, ignores recency, survives back-off, and the app never infers a day or season the parent did not tick | NS-18-R3, NS-32-R3, NS-32-R9; NS-46 (proposed) | P0 (c) core loop, and promise | mobile, content | Direction 3.1; NS-32 section 3 |
| FR-NTC-09 | Given a family or faith day, or names off, Then the lock-screen title is neutral ("Something for the book today") and the day shows when unlocked; a faith or family day's name appears in a title only with names on | NS-32-R12, NS-32-R13, NS-46, cultural-background card NS-47 (proposed); new row needed | P0 (b) privacy of religion on the lock screen (counsel must confirm the legal weight, see `cultural-background-data.md`) | content, mobile, privacy | Direction 3.4 |
| FR-NTC-10 | Given any variant, Then title is at most 40 characters and body at most 110, and no emoji, dash, curly quote, ellipsis character, exclamation mark, day count, gap word, "daily" form or machine-writing word appears, in either rendering | NS-32-R11; new row needed | P0 (a) | content | `rules.test.ts:269, 288 to 300`; `CLAUDE.md` content rules |
| FR-NTC-11 | Given names off (the default) or App lock on, Then no title or body contains a child name; names show only when "Names in notifications" is on and App lock is off | NS-32-R12; NS-13 built list; J-N24 | P0 (a) zero child names on a lock screen by default | content, mobile | `prefs.ts:109 to 112` per NS-13; `lockScreenNamesOn()` `prefs.ts` |
| FR-NTC-12 | Given a reminder time before 17:00, Then no variant that names the evening or "tonight" is chosen, including the 8 built variants | NS-13; Me > Reminders time picker (id not read); new row needed | P1 | content, mobile | `reminders.en.ts` neutral list ("A letter tonight?", "Before you sleep"); section 3.4 |
| FR-NTC-13 | Given a variant authored once with a `{child}` slot, Then the renderer produces a named and a neutral version by one fixed rule, and a test renders both and lints both | NS-48; new row needed | P1 | content, mobile | Section 3.5; today two parallel sets, `planner.ts:243 to 247` |
| FR-NTC-14 | Given a pool, Then no key repeats within the pool's length, no title repeats back to back, and the same shape is never used three times in a row | NS-13-R6a, R6b; new row needed | P1 | core | Built behaviour `planner.ts:21 to 22`; Design B `NOTIFICATIONS.md:55` |
| FR-NTC-15 | Given a thin or empty pool, Then the function falls back through the layers to the built 8 and never fails | new card row needed; new row needed | P1 | core | Section 3.4 step 4 |
| FR-NTC-16 | Given the notification is delivered, Then the interruption level is `active` and the category keeps its neutral hidden-preview placeholder | NS-32-R10, NS-32-R13 | P1 | mobile | NS-32 section 3 |
| FR-NTC-17 | Given a variant that testers turn reminders off after within a day, Then it is retired from content; the measure is the tester sheet, not analytics | NS-48; research test row (new row needed in `research-validation`) | P1 | content, research | Direction 4.2; `CLAUDE.md` privacy rules |
| FR-NTC-18 | Given the launch floor (about 128 variants) or the full set (264), Then the fallback chain keeps every cell safe, and the Design B inventory is mined first and reconciled with the rules before new lines are written | NS-48; new row needed | P1 | content | `NOTIFICATIONS.md:55 to 59`; section 4.3 |
| FR-NTC-19 | Given a month or birthday notification, Then it keeps its own copy and is outside the catalogue; on a day that is also a chosen day, the chosen day wins by priority | NS-32-R3, NS-13 3a rule 4 | P1 | mobile | Section 5 |
| FR-NTC-20 | Given a plan with several included books, Then name rotation uses the subject child chosen by ordinal and not the count of name-bearing variants in the pool | NS-13 "named in turn" (built), NS-32 scenario "Two books" | P1 | mobile | `planner.ts:222 to 236` |
| FR-NTC-21 | Given translation (later), Then variants are keys with slots, not sentences built in code, so a language pack can supply them; weekday and day names come from the platform's localisation | NS-17 languages (card), languages review `functions/languages-and-localisation.md` (not read) | P2 | content | Direction 4.3 last sentence |

## 11. Proposed card NS-48: Notification catalogue

Outline for Karma to rule. Follows the card format of `docs/agents/COORDINATION.md` section 10 (human voice, Given/When/Then); I have not read that file this session, so the card needs a format pass.

- **Label effect.** None. All local; no new data leaves the phone. The last letter's kind and the age band are read on the phone only, to choose a sentence; they are not stored anywhere new except the last chosen key.
- **Who and when.** A parent three weeks in, who has seen the same eight lines and has begun to ignore them, and a parent who has not opened the app for ten days and must not be made to feel it.
- **Why.** The only repeatable problem that variety solves is notification blindness (NS-13 section 2: "a reminder that repeats itself ... teaches the parent to turn notifications off for good"). Evidence is a hypothesis: no parent evidence yet that more variants reduce turn-off (`NOTIFICATIONS.md:55` says the same); the research test is Q-NTC-5.
- **What.** The pure function, the layers, the fallback, the cell table at launch-floor size, the planner changes of section 8, the day-part filter.
- **Not in scope.** More notifications; push; the photo suggestion nudge (NS-49); the days library data (NS-46); the religion and country fields (NS-47); month and birthday copy; translation.
- **Happy path.** Default settings, Tuesday and Saturday at 8:30 PM. Tuesday after a spoken letter on Monday: a question about the child's age, a day later. Saturday: a Saturday tone. A week later, different words, none repeated. After day 35, silence.
- **Unhappy paths.** Reminder time 07:00 (no "tonight"); two books with names off (no age questions); a chosen faith day with names off (neutral title); a parent who turns reminders off (nothing); a parent who never opens the app (the plan holds, day 35 ends it).
- **Acceptance.** NTC-T01 to T23 as `[NS-48-Rn]`; T24 a founder device check; T25 the tester sheet.
- **Function requirements line.** FR-NTC-01 to FR-NTC-21.
- **Depends on.** NS-32 (registry and budget), NS-13 R18, R19 and the anchor (the recency axis needs them), NS-46 (days) for the occasion layer; the kind-aware layer degrades gracefully without NS-01 and NS-06 flags.
- **Size.** M for the function, planner change and tests; the copy is a separate content task (L if full size).

## 12. Findings that need a ruling, and design needs

### 12.1 VOICE.md conflicts with the checker on exclamation marks

`VOICE.md:70` says "At most one exclamation mark per month across all notifications." `VOICE.md:160` says exclamation marks are budgeted per surface, three in all, "none in notifications". The checker enforces the second. A pure function cannot count "per month". Default: zero in notifications, and `VOICE.md:70` is corrected by the content owner (this file edits nothing outside itself). Q-NTC-7.

### 12.2 Design needs

- Me > Reminders (screen id not read): a way to see, without changing volume, what the next notification will read like. `reminders.en.ts` has a "How it will look" preview and a "Next:" line already; they must call the same selection so the preview matches what arrives.
- Me > Reminders: no new switch for the catalogue. Variety is not a setting.
- No new screen for NS-48. NS-46 owns the days picker and "Days we mark".
- Lock-screen neutral title and neutral placeholder strings for NS-46 and NS-47 days: "Something for the book today" is mine (sample `ntc.occ.neutral.01`); the direction's own wording is the same line.

### 12.3 Engineering needs (rows to add)

New rows needed (no BL ids invented): core function and tests; content catalogue file and rules test additions (`{day}` slot, shape tag, both renderings); planner change of section 8; `lastMadeLetter()` reader; day-part filter and migration of the 8 built variants; tester-sheet row for retirement. Existing rows: BL-537 back-off, BL-869 (#758), BL-982 typed-day key shape.

## 13. Founder or counsel questions, each with a default

No counsel question is raised by this file on its own; the religion on the lock screen question belongs to `cultural-background-data.md` (counsel must confirm), and FR-NTC-09 depends on it. Counsel numbers from `docs/legal/COUNSEL_PACKET.md` were not read; "needs a number from legal" for FR-NTC-09.

| Id | Question | Default |
|---|---|---|
| Q-NTC-1 | Variants per grid cell: the founder's 8 to 12, or 6 | 6; revisit after the first tester sheet CLOSED 20 Nov, see GAP-LOG Closures CL-040 |
| Q-NTC-2 | Which days may name themselves in a lock-screen title: public only, or family days too (Mother's Day on a lock screen reveals little but may hurt in some homes) | Public only; family and faith need names on CLOSED 20 Nov, see GAP-LOG Closures CL-040 |
| Q-NTC-3 | May a visible body mention the kind of the last letter ("a picture with it?") | Yes in the body, never in the title; kind is not a name or a faith. Karma may rule it off when names are off, in which case the last-letter layer runs only with names on Superseded by NS-48-R5 on 20 Nov: no "a picture with it?" body. CLOSED 20 Nov, see GAP-LOG Closures CL-040 |
| Q-NTC-4 | Mixed-age siblings with names off | No age questions; the grid runs CLOSED 20 Nov, see GAP-LOG Closures CL-040 |
| Q-NTC-5 | Do more variants reduce turn-off? | Hypothesis, test with the tester sheet; ship the floor, measure, then fill CLOSED 20 Nov, see GAP-LOG Closures CL-041 |
| Q-NTC-6 | Reuse Design B's 87 rows and the "Show celebration names" separate switch (`COPY_INVENTORY.md` recommendation 3) or the direction's single names switch | One names switch (fewer settings); mine the 87 rows for wording CLOSED 20 Nov, see GAP-LOG Closures CL-040 |
| Q-NTC-7 | Exclamation marks in notifications | Zero; correct `VOICE.md:70` CLOSED 20 Nov, see GAP-LOG Closures CL-040 |
| Q-NTC-8 | Ship the full set at freeze, or the floor at freeze and the rest in a content drop | Floor at freeze, rest as a content drop (Design B already planned this, `NOTIFICATIONS.md:59`) CLOSED 20 Nov, see GAP-LOG Closures CL-041 |
| Q-NTC-9 | Age band edges for preterm and corrected age (`NOTIFICATIONS.md` line 57 says a preterm switch is needed for month messages) | Use the age the Book shows; a corrected-age family is a separate ruling CLOSED 20 Nov, see GAP-LOG Closures CL-041 |

## 14. What I did not verify

No Apple documentation was read for this brief; nothing here depends on an Apple rule except one point I did not check: that the title of a local notification still shows when the body is hidden by "Show Previews" (this is how NS-32 R13 and research note 3 describe it; I did not read research note 3). No law is cited. Every claim about the repo is from the files and lines in section 1. The sample variants have not been read by a native editor of the VOICE.md voice or by counsel; they pass my scratch lint only. I am a Claude role, not counsel.

---

## Addendum 20 Nov 2026: photo moments and pictures and videos

Source: `../26-founder-direction-photos-library-and-media.md` section 2 (a nudge is "one of the existing budgeted classes (NS-32), not a new class"; lock screen never describes pictures). Cards NS-51 Photo moments and NS-52 Pictures and videos with a letter (by name; `../27-photo-moments-and-media.md` absent when written). Registry facts from `../11-foundations.md` NS-32-R1 to R5, R14, R15 and `../21-days-cultural-photos-home.md` NS-48-R5 and NS-49-R3, R25, R26. No Apple documentation read for this addendum.

### New requirements

| Id | Requirement | Links | Priority | Owner | Source |
|---|---|---|---|---|---|
| FR-NTC-22 | Given a photo-moment nudge, Then it is not a new class: it is a variant pool inside the existing `evening` class (lowest priority) and takes that class's slot on a day a moment exists; `typedDay`, `birthday`, `monthAge` still win the day by NS-32-R3; the registry test (NS-32-R2, R5, R15) stays green with no `photo` class. Default needs Karma's ruling (Q-NTC-10) | NS-32-R1, R2, R3, R5, R15; NS-51 | P0 (a) no nagging | mobile, content | `../11-foundations.md` |
| FR-NTC-23 | Given a day with any two of: a ticked day, a birthday or month note, an evening reminder, a photo-moment nudge, Then exactly one budgeted notification is delivered (the highest priority) and a moment shows only inside the app; given the pending ceiling of 60 and the plan group of 4, adding moment nudges raises neither | NS-32-R1, R7, R15; NS-13 3a | P0 (a) | mobile | Section 5 of this file |
| FR-NTC-24 | Given recency and back-off, Then a photo-moment nudge does not reset or extend the anchor, is not a made letter, is silenced by day 35 like every evening nudge, and is not revived by new pictures while the parent has not opened the app; default cap of one moment nudge in any 7 days even when moments exist (Q-NTC-11) | NS-13-R18, R19; FR-NTC-03, 04 | P0 (a) | mobile | Section 4.1 recency axis |
| FR-NTC-25 | Given any moment variant, Then title is at most 40 and body at most 110 characters, no exclamation mark, no count of pictures, videos or days, no description of what a picture shows (no place, person, event, scene, season word that is derived from the image), no judgement of importance ("best", "special", "favourite", "highlights", "memories", "found", "noticed", "we saw"), no "your", no emoji, dash, curly quote or ellipsis character, and no machine-writing word. A day-of-week or "the weekend" may appear because it comes from the date alone | FR-NTC-10; NS-51; `rules.test.ts` as cited in FR-NTC-10 | P0 (a) | content | FR-NTC-10 |
| FR-NTC-26 | Given names off (default) or App lock on, Then the lock-screen title is neutral ("Something for the book today" family) and no child name, place, album name or media type appears in title or body; with names on, only the child name may appear, never a place, album, person or count. The category keeps its neutral hidden-preview placeholder and the level stays `active` | FR-NTC-09, 11, 16; NS-32-R10, R12, R13 | P0 (a) | content, mobile | FR-NTC-11 |
| FR-NTC-27 | Given a moment nudge is tapped, Then it opens the capture area's moments view, never a prompt or a letter; the tap payload carries only `{ source, kind }` with no asset id, date list, count or album; nothing about the library is logged (breadcrumb, error text, notification identifier) | NS-51; NS-13 R9; `scheduler.ts` payload as cited in section 8 | P0 (a)(b) | mobile, privacy | Section 8 of this file |
| FR-NTC-28 | Given a book that is quieted, a hard-day tier, Reminders off, Photo moments off, or the library permission revoked or narrowed, Then no moment nudge is planned and pending ones are cancelled at the next re-plan; a quieted book adds nothing (NS-32-R14); turning Photo moments off cancels them at once | NS-32-R14; NS-51; FR-NTC-08 | P0 (a) | mobile | NS-32-R14 |
| FR-NTC-29 | Given the last-letter layer (section 4.2), Then a letter that has pictures or videos is not a kind and shapes no later word; the grid and kinds spoke, typed, first, small are unchanged (confirms NS-48-R5 and NS-49-R3) | NS-48-R5; NS-49-R3 | P0 (a) | content, mobile | `../21-days-cultural-photos-home.md` |
| FR-NTC-30 | Given the iOS scheduling reality (local notifications are scheduled ahead; NS-49-R25 forbids background modes in 1.x), Then moment nudges are planned only at a re-plan from what the app knew at its last open; a nudge may therefore arrive after the parent has already written that day, and the planner cancels it at the next re-plan, not at delivery. The card must say so plainly and no copy may promise "new pictures" or timeliness | NS-13 3a; NS-49-R25; NS-51 | P1 (a) | mobile, product | Section 3.3 of this file; background behaviour UNVERIFIED |
| FR-NTC-31 | Given the tester sheet (analytics off), Then a moment variant is retired when testers turn reminders or Photo moments off within a day of seeing it; no event, log or aggregate counts library items, moments or nudges shown | FR-NTC-17; `CLAUDE.md` privacy rules | P1 | content, research | FR-NTC-17 |

### Sample variant intents (not live; `content` writes final words; a native editor has not read them)
Keys `ntc.pm.01` to `05`, title "Something for the book" or the neutral title:
1. "Some pictures are here if you want them."
2. "A few pictures from the weekend are here."
3. "Pictures from a day this week are here. Say a few words if you like."
4. "A day with pictures is here whenever you want it."
5. "Pick a picture and say what it was."
Check: no count, no description, no exclamation mark, no importance. Variant 2 and 3 use a date word only.

### Changes to existing rows
FR-NTC-05 and Q-NTC-3: Superseded in part by NS-48-R5 and FR-NTC-29. Section 11 "Not in scope: the photo suggestion nudge (NS-49)" now reads NS-51 owns the nudge; this file owns only its words and budget (FR-NTC-22 to 31).

### Links
NS-32, NS-13, NS-48, NS-49, NS-51, NS-52; FR-NTC-01, 02, 03, 08, 09, 10, 11, 16, 17.

### Design needs
- Me, Reminders: no new switch here; the Photo moments switch lives with NS-51's settings, and Me, Reminders "Next:" preview must show a moment nudge's neutral wording through the same selection.
- Capture area: a moments view that a tap lands on, with an empty state that never says "nothing found" or counts.

### Engineering needs (new rows needed)
- `selectNotificationKey` pool for `ntc.pm.*` under `evening`; planner input `momentsKnown` as a boolean per date with no asset data; planner tests for FR-NTC-23, 24, 28.
- Rules-test forbidden-word list additions for FR-NTC-25.
- Cancel-on-switch-off and on-permission-change hooks (extends sign-out `forgetReminders`).

### Questions (default, who)
| Id | Question | Default | Who |
|---|---|---|---|
| Q-NTC-10 | Which existing class carries the moment nudge? | `evening` variant pool, lowest priority | Karma CLOSED 20 Nov, see GAP-LOG Closures CL-040 |
| Q-NTC-11 | Cap on moment nudges | One in 7 days | Founder, Karma CLOSED 20 Nov, see GAP-LOG Closures CL-040 |
| Q-NTC-12 | May a body say "pictures" at all on a lock screen with names off? | Yes, generic only; if privacy objects, use the neutral title with a body that does not say it | Privacy, counsel (needs a number from legal) FOUNDER-ANSWERED 20 Nov, default accepted (CL-054, default as stated in the row and in GAP-LOG Closures) |
| Q-NTC-13 | May a moment nudge be allowed after day 35? | No | Karma CLOSED 20 Nov, see GAP-LOG Closures CL-040 |

### Cannot assess yet
- Whether any background mechanism is allowed (changes FR-NTC-30 entirely); not read.
- Whether moment nudges reduce or raise turn-off; hypothesis, tester sheet only.
- Whether "pictures" in a title is a privacy issue for shared devices.
- Message wording quality; no native editor has read the samples.
