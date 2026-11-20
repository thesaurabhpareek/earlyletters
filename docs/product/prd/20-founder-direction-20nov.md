# Founder direction, 20 Nov: days we mark, notification catalogue, one Home, photos first

Status: proposal for the founder, from Karma (product). Not locked. It reopens three parked items, so the founder's decision is needed (section 7). The locked cards 00 to 16 and the errata (18) stay as they are until a card below is ruled in. Date facts here are marked VERIFIED (read this session), REPO (read in the repo) or UNVERIFIED.

## 1. What the founder asked

1. Mark US and world days that are not tied to a religion (Mother's Day, Father's Day, Memorial Day, 4 July, start of summer and so on) with a personal notification.
2. Optionally ask a parent for religion and native country, optional, with a clear call-out that it is only used to choose which days we mark, and an "Eastern" (written "East East") option. If a religion is chosen, a library of the major days and festivals of the world's largest religions.
3. A catalogue of notifications rotated by day of week, by time since the last letter and by the kind of last conversation, so each day reads personal, fun and engaging.
4. Check that Tonight (Home) and Book do not hold duplicated information, that Me is not overloaded, and that Home is not too thin to be the default tab. Check the architecture, and the design agents' work, for duplication.
5. Find the features we are not thinking about, so the app is not one job only. Pictures matter most: use the Photos library to see what the parent has been doing and nudge from it, in the way Apple's Journal works (pick a picture, then tell the story).

"East East" is not clear to me. My reading: "Prefer not to say" or "Another tradition / none". Founder to confirm (Q-FD-1).

## 2. Where the repo stands (REPO)

- Notifications are all local; nothing leaves the phone (NS-32). One budgeted notification per phone per day; classes by priority: typed day, birthday, month, evening. Plan notices sit outside the budget. Every class sets a neutral lock-screen placeholder. No class may be time-sensitive. Back-off ends evening nudges after day 35 (NS-13).
- `occasion` (days like Mother's Day) was parked with the Memory Library (NS-31). Any class derived from the photo library is out of scope (NS-32 section 3, NX-39 R27). NS-01 says "never: the photo library, faces or scenes, any picture the parent did not pick".
- Typed days exist (NS-18): a parent adds their own date and gets a note. This is the machinery the days library should reuse.
- Content rules: no emoji, no fear, guilt or loss language, no streaks or counts of gaps, never imply AI writes, `{child}` never gendered.
- Tabs: Home (Say), Book (Read), Me (Look after). Only Home starts a letter.
- Photos today: Apple's picker (`PHPickerViewController`), one picture per letter, no library permission.

## 3. Days we mark

### 3.1 Position
Do not build a second notification system. Build a **library of days** (data, with sources) and let the parent **choose** which to mark. A chosen day becomes a typed day, so it uses the existing planner, the existing budget slot (top priority, because the parent asked for it) and the existing lock-screen rules. The library is a list of suggestions; the parent's choice is the only thing that schedules anything.

Why choose, not infer: a parent who says "Hindu" may not keep Diwali; a family may have lost a mother; a father's day can hurt in a house with two mums or no dad. A pre-ticked list that guesses is the wrong default. A short list the parent ticks is personal and safe.

### 3.2 Three layers of the library
| Layer | Examples (names only; dates to be verified by the content agent from authoritative sources) | Default |
|---|---|---|
| Seasonal and shared (religion-agnostic) | New Year's Day, first day of spring, start of summer, first day of fall, winter solstice, New Year's Eve, Thanksgiving (US), Halloween (US), 4 July (US), Labor Day (US), first day of school season (a date the parent sets) | Offered, parent ticks |
| Family and parent days | Mother's Day, Father's Day, Grandparents' Day, Siblings Day (10 Apr), Valentine's Day | Offered, parent ticks; wording never presumes who the grown-ups are |
| Civic and commemorative | MLK Day, Presidents' Day, Memorial Day, Juneteenth, Veterans Day | Offered, parent ticks; Memorial Day and Veterans Day wording kept to "a day to remember", checked against the no-loss-language rule (Karma ruling needed, R-FD-3) |
| Traditions (after a parent names one, or browses) | Christian, Muslim, Hindu, Buddhist, Jewish, Sikh and others by size, plus "Another tradition" and national days for a chosen country | Offered, parent ticks; parent can add or edit any date |

Moving dates (Easter, Eid, Diwali, Lunar New Year, Passover, Hanukkah, Vesak and others) follow lunar or lunisolar calendars. Some depend on a moon sighting and can differ by a day by place. The library ships a dated table per year from a named authority and says "around" in the picker; the parent can move the date. UNVERIFIED until the content agent reads a source for each tradition; no date is written from memory.

### 3.3 Where it is asked
My recommendation, which differs from the founder's first thought: **ask after the first kept letter, not in first run.** First run is tested on strangers with a 90 second target (NS-39 to NS-45), and every field in it must earn its place (App Review 5.1.1 data minimisation, UNVERIFIED for this field, counsel must confirm). One card on Home after the first letter, once, with "Not now" as a full answer: "Would you like a note on days that matter to your family?" Then Me > Days we mark, always reachable. If the founder wants it in onboarding, I will design it as an optional last step with Skip; the cost is first-run length and the risk that a stranger reads a faith question as intrusive. Founder choice, Q-FD-2.

### 3.4 Religion and country: how the data is treated
- Optional. "Prefer not to say" is a first-class answer and is the same as not answering.
- Stored on the phone only, per account, never synced, never uploaded, never in analytics, logs or crash reports, removed by Erase everything and by deleting the account. Nothing leaves the phone, so we do not "collect" it in Apple's privacy-label sense, but this must be confirmed against the current label rules (UNVERIFIED; compliance and counsel).
- Religion is special-category or sensitive data in several laws (for example GDPR Article 9, UNVERIFIED here, counsel must confirm). The on-device rule is what keeps us out of the hard cases. If the founder ever wants it on the server, that is a new decision with counsel first.
- Call-out text (draft for content to finish within the voice rules): "Only on this phone. Used for one thing: suggesting days to mark. Change or clear any time."
- The answer decides only which suggestions are shown first. It never changes what the app says to the parent outside those suggestions, and never appears on a lock screen.
- Lock screen: a note for a faith day names the faith only when the parent has switched on names in notifications; otherwise the lock-screen title is neutral ("Something for the book today") and the day shows when unlocked. A passer-by must not learn a family's religion from a notification.
- Country: "where your family is from" and "where you live" are different. Use the first only for national days the parent picks. Never use location services.

## 4. Notification catalogue and rotation

### 4.1 What stays
The budget (one a day), the back-off at day 35, neutral placeholders, no time-sensitive class, no emoji, no guilt, no streaks. More variety must not mean more notifications. "Fun and engaging" is voice, not volume.

### 4.2 The catalogue
A pure function over inputs the phone already has: weekday, local date, hours since the parent's last own save, the kind of the last letter (spoke, typed, picture, a first, "not much today"), the child's age band, whether the day is a chosen day or a season, whether names are shown. It returns one catalogue key; all words live in `packages/content`. Because it is a pure function it can be pinned by tests (same inputs, same key) and rotated without repeats within a cycle (as built today).

| Axis | Values | How it changes the note |
|---|---|---|
| Weekday | weekday evening, Friday, Saturday, Sunday, Monday | tone only: lighter Friday, slower Sunday |
| Recency | made today or yesterday, 2 to 6 days, 7 to 14, longer | invitation size only: shorter and more open as time passes; never refers to absence |
| Last letter | spoke, typed, picture, a first, small ("not much today") | a question that follows from it, not a summary of it |
| Season or day | chosen day, season change, none | the occasion line |
| Child age band | newborn, baby, toddler, child | the question's subject |

Rules: a note is a question or an invitation, never a count, a comparison or a judgement; it never repeats a phrase from the parent's own words (the app does not read them for this); a variant is retired if a parent turns reminders off within a day of seeing it (measured by a tester sheet, not analytics, while analytics is off).

### 4.3 Size
About 8 to 12 variants per cell for weekday evening by recency, 4 per day in the library, 3 per season, plus the age-band questions. Written by content under VOICE.md and checked by `rules.test.ts`; none implies the app wrote anything. Translation rule per language belongs to the languages review.

### 4.4 Tests
Same input, same key; no variant twice in a row; no note on a day the budget already used; Reduce Notifications settings respected; every key exists in content; no banned words; names off by default.

## 5. One Home: information architecture and duplication

I have not yet audited the inventory screen by screen, and I will not guess at duplicates. What I know from the cards: Home carries the capture buttons, the reminder ask, the Save a copy slip, one past letter, month and birthday lines, the quiet-day line, the Keep gate; Book carries the year, months, lens, Find, Photos lens; Me carries settings, family, backup readiness, export, quiet and hide, recently deleted, plan, help. Candidate overlaps to test: past letter on Home vs Book's "on this day" role; month and birthday lines on Home vs Book's age and month headings; Save a copy in Me and as a Home slip; Plan in Me and plan notices; child details in three places; Me as a long settings list while Home may be too sparse.

Method (assigned, section 8): an object-by-screen matrix of every piece of content and every action, with where it is read, written and owned; then merge, move or delete. Architecture side: one owner per fact (age, plan state, reminder times, quiet state) so no two modules compute the same thing; and each tab one job: Home = start and today; Book = read, find, share; Me = look after (account, family, keeping safe, days we mark, reminders).

Home richness without a second job: Home becomes "today", still one primary action (Say). Candidates in a strip below it, each shown only when it has something real: a day we mark today, a picture suggestion (section 6), one past letter, the reminder ask. No counts, no feed.

## 6. Pictures first

### 6.1 Three levels
| Level | What it is | Library permission | Fit |
|---|---|---|---|
| 1. Pick | Apple's picker, one picture, then speak (built, NS-01) | None | Keep; make picture-first entry a first-class start on Home |
| 2. Journaling Suggestions | Apple's system picker lists recent moments (photos, places, activity) from the phone; the parent picks; the app receives only what was chosen | None (VERIFIED: Apple says the app needs no permission and receives only the chosen suggestion; picker runs in a separate process; iOS 17.2 and later; needs a special entitlement) | Best fit: it is the Apple Journal flow, it needs no library access, and Apple can raise the nudge itself |
| 3. Library read access | The app reads photo metadata or images on the device to decide when to nudge | Full or limited library permission | Not recommended for 1.x |

Sources read this session: Apple developer documentation for JournalingSuggestionsPicker and the Journaling Suggestions tech talk; Apple's Journaling Suggestions privacy page. Not read: whether the entitlement needs Apple approval, whether Apple's suggestion notifications can open our app for third parties (the updates page implies it, UNVERIFIED), the minimum iOS of our build.

### 6.2 Why not level 3 now
Children's photos are the most sensitive thing on the phone. A library permission, even limited, changes the App Review and privacy-label story, the parent's trust, and our "never read a picture the parent did not pick" line. A nudge built from what a machine sees in pictures (scenes, faces, places) adds meaning the parent did not give, which the constitution forbids for words and which I would hold for nudges too. A level 3 nudge would be at most facts ("photos from Saturday") and still needs a permission and background work that iOS limits. If the founder wants to explore it, it goes through an ADR, privacy and security review, counsel and a spike, behind a flag that ships off. Q-FD-4.

### 6.3 The Apple Journal flow, in our rules
Pick a picture, then tell it. We never write, caption or "start the entry" for them. The suggestion's title and date may show as a label the parent can edit; anything else Apple passes (a place name, a workout) is shown to the parent, kept only if they keep it, and never used for a nudge. The words are the parent's own, spoken or typed, cleaned only by the faithful edit types. One picture per letter stays for 1.0 (NS-01); several pictures, an album or a short run of pictures is a later card.

### 6.4 Other things the app is not yet doing (candidates, not commitments)
Each must pass the constitution and the "no coming soon" rule. Ranked by my guess at customer value; the research agent tests the ranking.
1. Picture-first capture and Journaling Suggestions (above).
2. Quick capture outside the app: Lock Screen and Home Screen widget, Action Button, Shortcuts (the hands-free spike, NS-04, is parked pending evidence).
3. The child's own words and voice, recorded as a clip the parent labels (a drawing photographed, a funny sentence). Capture only, no editing.
4. Relatives add: a grandparent records an answer to a question the parent chose (NS-26 and NS-03 family pilot, parked).
5. "On this day" and a yearly look back (NS-31 Memory Library, NS-24 Read the year back).
6. Share a letter or a page (NS-05).
7. Printed book (print review in progress).
8. Letters to open later (sealed, NS-06) with a chosen date.
9. Share sheet into the book: save a photo, a voice note or a message from another app as a letter's picture or a note.
10. Apple Watch quick capture.
Not recommended: growth or health tracking, social feeds, any auto-written summary or caption, a streak or goal of any kind.

## 7. Decisions for the founder (defaults in brackets)
- Q-FD-1: what "East East" means. [Prefer not to say]
- Q-FD-2: ask religion and country after the first letter, not in first run. [After the first letter; skip is a full answer]
- Q-FD-3: Mother's Day, Father's Day, Memorial Day and Veterans Day offered but never pre-ticked. [Yes]
- Q-FD-4: level 2 (Journaling Suggestions) now; level 3 (library access) not in 1.x. [Yes; spike level 3 behind a flag only]
- Q-FD-5: religion and country stay on the phone only. [Yes]
- Q-FD-6: reopen three parked items for these cards: the `occasion` class in NS-32, the Memory Library's "on this day" part, and the NX-39 R27 photo-library line (kept closed for level 3). [Reopen the first two; keep the third closed]

## 8. Work assigned (wave 3, runs when usage resets at 11:00 UTC)
Briefs are in `docs/product/prd/tools/review/wave3-briefs.md`. Each writes its own file and commits nothing.
1. Days library and calendar (content, regulatory): `functions/days-library.md`.
2. Notification catalogue (content, mobile): `functions/notification-catalogue.md`.
3. Religion and country data: privacy, legal, compliance, risk: `functions/cultural-background-data.md`.
4. Information architecture audit and Home/Me/Book consolidation (design systems, product): `docs/design/e2e/IA-AUDIT.md` on the design branch.
5. Photos and Journaling Suggestions (mobile, privacy, security): `functions/photos-and-suggestions.md`.
6. Feature opportunity scan with research test plan (product, user research): `functions/feature-opportunities.md`.
Then new cards NS-46 to NS-50 (days we mark; cultural background; notification catalogue; picture-first start and suggestions; Home today strip), reviewed by the nine experts, designed by the five design leads, and traced.

## 9. What I did not verify
Every holiday date and tradition list (to be read from authorities by the days agent); App Review and privacy-label treatment of on-device religion data; whether Apple's Journaling Suggestions entitlement needs approval and whether its notifications can open third-party apps; the app's minimum iOS; the duplication candidates in section 5 (named from the cards, not audited). I am a Claude role, not counsel.
