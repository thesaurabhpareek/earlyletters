# Design B: notification copy inventory and the photo nudge experience

Date: 1 Nov 2026. Lane: copy, photo nudge design, sequencing, benchmark voices. Not covered here: timing, onboarding, planner code.

## Recommendation in six lines

1. Ship an 87-row copy inventory (below), each row with a neutral lock-screen variant (default) and a named variant (only when "Names in notifications" is on). Both fit the test limits (title 40, body 110).
2. Rotate by shape (question, invitation, observation, tiny task, quote-a-line), not by topic. The sequencing rules in section 3 are simple enough to unit test in the pure planner.
3. Festival and milestone rows are opt-in. We never infer a tradition. On the lock screen the neutral variant says only "A celebration today"; a festival name appears only if the parent turns on a separate "Show celebration names" switch (proposed; the existing names switch is about the child).
4. Photo nudges v1 are parent-initiated and date-triggered, not photo-triggered. We only ever say "any photos?" as a question. We never say "your trip" unless the parent typed that label. The system photo picker is used, so we never read the library. This keeps the privacy label at "Data Not Collected" and keeps the constitution check trivial.
5. Do not build photo content recognition. It is the one place we could copy Apple Journal and Day One and lose our edge. Our differentiator is "we only know what you chose".
6. Everything here is unverified on a real phone. I could not run the repo tests; I checked the rules by script on a scratch copy (see "Checks run" at the end).

## 1. The inventory

Reading the table. Shape: Q question, I invitation, O observation, T tiny task, L quote-a-line. Each cell shows `title // body`. N = neutral variant (default, no name). C = named variant ({child}, shown only when names are on). Placeholders used are all in the test allowlist: child, month, weekday, name (a label the parent typed), count. Tone tags: warm, playful, quiet, festive.

Mechanics notes for the planner owner:
- `{month}` in MN rows is the child's month number. In RD03 it is the month of the old letter picked.
- Rows with age bands are filtered by the child's age in months at send time.
- Event rows (MN, MS, BD, SS, FS) win over the rotation on their day (planner already allows at most one a day).
- "Return" rows (RT) count quiet time internally; no copy mentions time away.

### Evening ideas (rotation, any week)

| id | type | shape | trigger | N | C | tone |
|---|---|---|---|---|---|---|
| EV01 | evening idea | Q | rotation | What made you smile? // One small thing from today is plenty. Say it out loud. | What made {child} smile? // One small thing from today is plenty. Say it out loud. | warm |
| EV02 | evening idea | I | rotation | A quiet moment? // The house is settling. A few words to your little one? | A quiet moment? // The house is settling. A few words to {child}? | quiet |
| EV03 | evening idea | T | rotation | One sentence // Tap the red circle and finish this: Today you | One sentence for {child} // Tap the red circle and finish this: Today you | playful |
| EV04 | evening idea | L | rotation, age 10m+ | A line they said // Something your little one said today, exactly as it came out. Even one word. | A line from {child} // Something {child} said today, exactly as it came out. Even one word. | warm |
| EV05 | evening idea | Q | rotation | How did today feel? // A few words about how the day felt, not what happened. | How was today for {child}? // A few words about how the day felt, not what happened. | quiet |
| EV06 | evening idea | T | rotation | Thirty seconds // Talk for as long as it takes to boil a kettle. | Thirty seconds for {child} // Talk for as long as it takes to boil a kettle. | playful |
| EV07 | evening idea | Q | rotation | Where did today happen? // Tell your little one where it went. A room, a street, a park. | Where did today happen? // Tell {child} where it went. A room, a street, a park. | warm |
| EV08 | evening idea | I | rotation | Not much today? // That is fine. Tap Not much today and call it a good evening. | Not much today? // That is fine. Tap Not much today for {child} and call it a good evening. | quiet |
| EV09 | evening idea | O | rotation | A page for {weekday} // Something from today for the book? | {weekday} in {child}'s book // Something from today for the page? | quiet |
| EV10 | evening idea | Q | rotation | Who came by today? // Who did your little one see? A voice, a face, a name is plenty. | Who did {child} see today? // A voice, a face, a name is plenty. | warm |
| EV11 | evening idea | T | rotation | Describe one thing // Pick one thing in the room and tell your little one about it. | Describe one thing // Pick one thing in the room and tell {child} about it. | playful |
| EV12 | evening idea | I | Sunday only | Sunday, slowly // If there is a calm minute, a few words will fit in it. | Sunday, slowly // If there is a calm minute, a few words for {child} will fit in it. | quiet |

### Curiosity (what are they into now)

| id | type | shape | trigger | N | C | tone |
|---|---|---|---|---|---|---|
| CU01 | curiosity | Q | rotation | What are they into? // What does your little one keep going back to lately? | What is {child} into? // What does {child} keep going back to lately? | playful |
| CU02 | curiosity | Q | rotation, age 12m+ | Asked for again // Is there something your little one asks for again and again? | Asked for again // Is there something {child} asks for again and again? | playful |
| CU03 | curiosity | Q | age 0-12m | New sounds? // Anything new in how your little one coos, babbles or laughs? | New sounds? // Anything new in how {child} coos, babbles or laughs? | warm |
| CU04 | curiosity | T | age 24m+ | Ask a question // Ask your little one something, then record the answer, whatever it is. | Ask {child} something // Ask a question, then record the answer, whatever it is. | playful |
| CU05 | curiosity | O | rotation | Right now // Describe your little one as they are this week. It will be good to hear later. | {child}, this week // Describe {child} as they are right now. It will be good to hear later. | warm |
| CU06 | curiosity | Q | rotation | What surprised you? // Anything about your little one that surprised you lately? | What did {child} surprise you with? // Anything lately? Big or tiny. | playful |
| CU07 | curiosity | Q | age 12m+ | The game you play // What is the silly game you two play? Describe the rules. | {child}'s favorite game // What is the game you two play? Tell {child} the rules. | playful |
| CU08 | curiosity | I | rotation | At this age // Is there something you remember about yourself at this age? Tell your little one. | At this age // Is there something you remember about yourself at {child}'s age? | quiet |

### Gratitude

| id | type | shape | trigger | N | C | tone |
|---|---|---|---|---|---|---|
| GR01 | gratitude | I | rotation | Something good // Name one good thing from today for your little one to hear one day. | One good thing // Name one good thing from today for {child} to hear one day. | warm |
| GR02 | gratitude | Q | rotation | Who helped today? // Who made today a little easier? Say thank you out loud. | Who helped today? // Who made today easier for you and {child}? Say thank you out loud. | warm |
| GR03 | gratitude | I | rotation | Thank you, today // Thank someone, or something, in the book. A sentence is plenty. | Thank you, today // Thank someone, or something, in {child}'s book. A sentence is plenty. | quiet |
| GR04 | gratitude | Q | rotation | What are you glad of? // What are you glad of this evening? Tell your little one. | What are you glad of? // What are you glad of this evening? Tell {child}. | quiet |
| GR05 | gratitude | O | rotation | Ordinary days // Ordinary days are the ones your little one will want to hear about. | Ordinary days // Ordinary days are the ones {child} will want to hear about. | warm |
| GR06 | gratitude | T | rotation | One thing you love // Tell your little one one thing you love about this stage. | One thing you love // Tell {child} one thing you love about this stage. | warm |

### Sensory

| id | type | shape | trigger | N | C | tone |
|---|---|---|---|---|---|---|
| SE01 | sensory | T | rotation | Listen for a moment // What can you hear around your little one right now? Record it. | Listen for a moment // What can you hear around {child} right now? Record it. | quiet |
| SE02 | sensory | Q | rotation | What does home sound like? // The kettle, the street, the song on repeat. Say what you hear. | What does home sound like? // The kettle, the street, the song on repeat. Tell {child}. | playful |
| SE03 | sensory | T | rotation | The laugh // If your little one laughs tonight, record it, then say what caused it. | {child}'s laugh // If {child} laughs tonight, record it, then say what caused it. | playful |
| SE04 | sensory | O | rotation | Small hands // Describe your little one's hands today: the size, the grip, what they hold. | {child}'s hands // Describe the size, the grip, what {child} holds on to. | quiet |
| SE05 | sensory | Q | rotation | What did today look like? // Colors, light, the view from a window. Tell your little one. | What did today look like? // Colors, light, the view from a window. Tell {child}. | quiet |
| SE06 | sensory | Q | age 6m+ | Tastes and textures // What did your little one taste, grab or refuse today? | Tastes and textures // What did {child} taste, grab or refuse today? | playful |

### Relative-to-read (Read together)

| id | type | shape | trigger | N | C | tone |
|---|---|---|---|---|---|---|
| RD01 | relative-to-read | I | evening, 3+ letters kept | Read one together // Pick a letter and play it at bedtime. Your voice, again. | A letter for bedtime // Pick one for {child} and play it. Your voice, again. | warm |
| RD02 | relative-to-read | I | v1.1 only, needs remote push | A letter in the book // Someone added a letter to your little one's book. | A letter for {child} // A new letter is in {child}'s book. Listen together? | warm |
| RD03 | relative-to-read | I | evening, an older letter picked | Month {month}, again // A letter from then is waiting. Play it together tonight? | Month {month}, again // A letter from then is in {child}'s book. Play it together tonight? | quiet |
| RD04 | relative-to-read | I | Sunday only | Sunday reading // Choose a letter and listen to it with your little one. | Sunday reading // Choose a letter and listen to it with {child}. | quiet |
| RD05 | relative-to-read | Q | evening | Read it, or play it? // Read a letter aloud, or play the recording. Either works. | Read it, or play it? // Read a letter to {child} aloud, or play the recording. Either works. | playful |
| RD06 | relative-to-read | O | evening | It may sound new // A letter from a few months ago may sound new tonight. Play one? | It may sound new // A letter to {child} from a few months ago may sound new tonight. | warm |

### Month notes (the child's month-day; messages, never "notes")

| id | type | shape | trigger | N | C | tone |
|---|---|---|---|---|---|---|
| MN01 | month note | O | month-day, 19:30 | Month {month} begins // A new month in the book is open. | Month {month} begins // A new month is open in {child}'s book. | quiet |
| MN02 | month note | Q | month-day | A new month opens // What does this month feel like so far? | Month {month} for {child} // A new month has begun. What is {child} like right now? | warm |
| MN03 | month note | I | month-day | Same day, new month // A few words about where things are today? | Same day, new month // A few words about where {child} is today? | quiet |
| MN04 | month note | T | month-day | Month {month}: one line // One line about this month is a good start. | Month {month}: one line // One line for {child} about this month is a good start. | playful |
| MN05 | month note | O | month-day | A new page // Month {month} has a blank page. Start anywhere. | A new page for {child} // Month {month} has a blank page. Start anywhere. | quiet |
| MN06 | month note | L | month-day, age 10m+ | Month {month} // Is there a word or phrase from this month to keep exactly as said? | Month {month} // Is there a word or phrase from {child} this month to keep exactly as said? | warm |

### Age milestones (12 rows, first 24 months; observation not achievement)

None of these says what a child "should" be doing. They ask about what the parent sees. Preterm and corrected-age families: see risks.

| id | type | shape | trigger | N | C | tone |
|---|---|---|---|---|---|---|
| MS01 | milestone | O | 1 month | One month // Tell your little one what this first month has been like. | {child} is one month // Tell {child} what this first month has been like. | warm |
| MS02 | milestone | Q | 2 months | Two months // What do you want your little one to know about these weeks? | {child}, two months // What do you want {child} to know about these weeks? | warm |
| MS03 | milestone | T | 3 months | Three months // Record the sounds your little one makes now. | {child}, three months // Record the sounds {child} makes now. | playful |
| MS04 | milestone | Q | 4 months | Four months // What gets a smile at this age? | {child}, four months // What gets a smile from {child} right now? | playful |
| MS05 | milestone | I | 6 months | Half a year // Tell your little one what the last six months were like. | Half a year of {child} // Tell {child} what the last six months were like. | warm |
| MS06 | milestone | Q | 8 months | Eight months // What is your little one reaching for these days? | {child}, eight months // What is {child} reaching for these days? | playful |
| MS07 | milestone | Q | 10 months | Ten months // What does your little one do when you walk into the room? | {child}, ten months // What does {child} do when you walk into the room? | warm |
| MS08 | milestone | I | 12 months, first slot after birthday | One year // Tell your little one about the year, in whatever order it comes. | One year of {child} // Tell {child} about the year, in whatever order it comes. | warm |
| MS09 | milestone | Q | 15 months | Fifteen months // What words or sounds is your little one trying out? | {child}, fifteen months // What words or sounds is {child} trying out? | playful |
| MS10 | milestone | O | 18 months | A year and a half // Tell your little one what an ordinary day looks like now. | {child} at a year and a half // Tell {child} what an ordinary day looks like now. | quiet |
| MS11 | milestone | Q | 21 months | Twenty-one months // What does your little one find funny these days? | {child}, twenty-one months // What does {child} find funny these days? | playful |
| MS12 | milestone | I | 24 months, first slot after birthday | Two years // Say what you would like your little one to hear about being two. | {child} is two // Say what you would like {child} to hear about being two. | warm |

### Birthdays (09:00 on the day, opt-in "Month and birthday messages")

| id | type | shape | trigger | N | C | tone |
|---|---|---|---|---|---|---|
| BD01 | birthday | I | birthday, 09:00 | A birthday today // A year of letters. Want to read them together today? | A birthday today // The letters so far, in {child}'s book. Read them together today? | warm |
| BD02 | birthday | I | birthday, 09:00 | Happy birthday // Read a letter together, or say a few words today. | Happy birthday, {child} // Read a letter together, or say a few words today. | festive |
| BD03 | birthday | T | birthday, 09:00 | A birthday voice // Say hello to the day. Record it, in whatever voice you have. | A birthday voice for {child} // Say hello to the day. Record it, in whatever voice you have. | playful |
| BD04 | birthday | Q | birthday, 19:30 | After the day // If there is a quiet minute tonight, how did the day go? | After the day // If there is a quiet minute tonight, tell {child} how the day went. | quiet |
| BD05 | birthday | O | birthday, 09:00 | Another year in the book // Say what you notice about your little one at this age. | Another year of {child} // Say what you notice about {child} at this age. | warm |

### Seasons (secular, hemisphere-neutral wording; dates from the device calendar)

| id | type | shape | trigger | N | C | tone |
|---|---|---|---|---|---|---|
| SS01 | season | I | 1 Jan, evening | A new year // Say how this year begins, for your little one to hear one day. | A new year // Say how this year begins, for {child} to hear one day. | quiet |
| SS02 | season | Q | around the March equinox | The season is turning // What is the weather doing outside tonight? | The season is turning // What is the weather doing outside tonight? Tell {child}. | quiet |
| SS03 | season | T | around the June solstice | The sky tonight // Look outside, then tell your little one what you see. | The sky tonight // Look outside, then tell {child} what you see. | quiet |
| SS04 | season | O | around the September equinox | A new season // Something is different outside this week. What is it? | A new season // Something is different outside this week. What does {child} notice? | playful |
| SS05 | season | I | around the December solstice | Long evenings, short evenings // Tell your little one what this time of year feels like. | A time of year // Tell {child} what this time of year feels like where you are. | quiet |
| SS06 | season | T | clock change, only in zones that change | The clocks changed // Tell your little one what the evening light looks like now. | The clocks changed // Tell {child} what the evening light looks like now. | playful |

### Family celebrations and festivals (opt-in)

Rules for this block:
- Off until the parent adds a celebration in Settings. They pick from a list or type their own. We never infer from name, language, location or locale.
- The parent confirms the date when a festival is near. Lunar and lunisolar dates, and Eid in particular (moon sighting), can move by a day, so a confirm step beats a hard-coded date. [unverified: I did not build a date table; the content steward needs a reviewed one.]
- N variant is always the generic frame. The festival name appears only in C, and only when a separate "Show celebration names" switch is on (proposed). A festival name on a lock screen can reveal faith.
- No "you must", no gift, food or ritual assumptions, no countdown, no reminder to buy or prepare.
- Not included on purpose: Mother's Day and Father's Day (family shapes, loss), memorial observances, anything tied to a due date.
- The list of 8 is a start from widely observed days across traditions. A cultural review should add and trim. It is not a ranking.

| id | type | shape | trigger | N | C | tone |
|---|---|---|---|---|---|---|
| FS00 | festival (generic) | Q | parent-added date | A celebration today // If today is special in your family, tell your little one about it. | {name} today // How does it look, sound and taste in your family? Tell {child}. | festive |
| FS01 | festival (generic) | I | evening after the date | A celebration today // A few words about how it went, in your own words? | {name}, tonight // A few words for {child} about how it went? | quiet |
| FS02 | festival: Lunar New Year | Q | opt-in, confirmed date | A celebration today // If today is special in your family, tell your little one about it. | Lunar New Year // Tell {child} how today looks, sounds and tastes in your family. | festive |
| FS03 | festival: Nowruz | Q | opt-in, spring equinox | A celebration today // If today is special in your family, tell your little one about it. | Nowruz // Tell {child} how today looks, sounds and tastes in your family. | festive |
| FS04 | festival: Holi | O | opt-in, confirmed date | A celebration today // If today is special in your family, tell your little one about it. | Holi // Colors, people, music. Tell {child} what today was like. | festive |
| FS05 | festival: Eid al-Fitr | I | opt-in, confirmed date | A celebration today // If today is special in your family, tell your little one about it. | Eid // Tell {child} who you were with and what the day was like. | festive |
| FS06 | festival: Diwali | O | opt-in, confirmed date | A celebration today // If today is special in your family, tell your little one about it. | Diwali // Lights, food, family. Tell {child} what the evening looked like. | festive |
| FS07 | festival: Hanukkah | I | opt-in, confirmed evening | A celebration tonight // If tonight is special in your family, tell your little one about it. | Hanukkah // Tell {child} what tonight looked like in your home. | festive |
| FS08 | festival: Christmas | Q | opt-in, 24 or 25 Dec | A celebration today // If today is special in your family, tell your little one about it. | Christmas // Tell {child} who was there and what the day sounded like. | festive |
| FS09 | festival: Vaisakhi | O | opt-in, 13 or 14 Apr | A celebration today // If today is special in your family, tell your little one about it. | Vaisakhi // Tell {child} what today was like where you are. | festive |

### Photo-based (details in section 2; trigger is a date or a parent choice, never photo content)

| id | type | shape | trigger | N | C | tone |
|---|---|---|---|---|---|---|
| PH01 | photo-based | I | parent picked photos, no recording yet | Ready when you are // Your chosen photos are waiting by the red circle. | Ready when you are // Your photos for {child} are waiting by the red circle. | quiet |
| PH02 | photo-based | Q | opt-in photo moments, library date metadata only | Photos from this week? // Any you would like to say a few words about? | Photos from this week? // Any you would like to tell {child} about? | warm |
| PH03 | photo-based | T | rotation, after the parent has used photos once | Pick up to five // Choose a few photos and say what was going on. | Photos for {child} // Choose up to five and say what was going on. | playful |
| PH04 | photo-based | Q | birthday evening (date, not photo) | Any photos from today? // You can add up to five to the letter. | Any photos from today? // You can add up to five to {child}'s letter. | warm |
| PH05 | photo-based | I | parent-made reminder with their own label | A story to tell // You asked for a nudge. Choose a few photos and tell it. | The story of {name} // You asked for a nudge. Choose a few photos and tell it to {child}. | warm |
| PH06 | photo-based | O | parent finished a recording, none attached | Add a photo? // You can put up to five photos beside this letter. | Add a photo? // You can put up to five photos beside {child}'s letter. | quiet |

### Return after a quiet stretch (at most two, then silence until the app is opened)

| id | type | shape | trigger | N | C | tone |
|---|---|---|---|---|---|---|
| RT01 | return | I | quiet 14+ days (internal count) | The book is open // No rush. Whenever a minute turns up, a few words will do. | {child}'s book is open // No rush. Whenever a minute turns up, a few words will do. | quiet |
| RT02 | return | T | quiet 30+ days, second and last | A fresh page // Start anywhere. A sentence about now is enough. | A fresh page for {child} // Start anywhere. A sentence about now is enough. | quiet |
| RT03 | return | I | alternate for RT01 | Listening counts too // Sometimes listening is the easier way back in. Play a letter. | Listening counts too // Sometimes listening is the easier way back in. Play a letter to {child}. | warm |
| RT04 | return | O | after RT02, once | Reminders go quiet // They start again whenever you open the book. | Reminders go quiet // They start again whenever you open the book. | quiet |

Count: 12 evening + 8 curiosity + 6 gratitude + 6 sensory + 6 read + 6 month + 12 milestone + 5 birthday + 6 season + 10 festival + 6 photo + 4 return = 87 rows.

Open copy questions for the founder or content steward:
- A few C bodies contain "exactly as it came out" and "exactly as said". Those are true only for the raw words; the phrases are about speaking, not about what we do to text, so I think they pass VOICE.md. Content should confirm.
- "Happy birthday" (BD02) is the only greeting. No exclamation mark anywhere; the notification budget is zero.
- RD02 needs remote push (v1.1). It should not ship in the v1.0 local set.

## 2. Photo nudge design

### Principle
We know exactly one thing: the parent picked these photos. So:
- Never name what is in a photo, who is in it, where it was taken, or what kind of occasion it was. No "your trip", "your beach day", "birthday photos" in any string we generate.
- A label appears only if the parent typed or chose it. The label sits in `{name}`. Before they label, the card says "photos".
- Date and count are facts we may state ("4 photos"). Library dates are metadata the parent can see anyway.
- No machine-made caption, alt text or title. This follows the constitution: nothing is added to a person's words.
- No thumbnails in notifications. A lock screen image can leak.

### Honest limits on what a "trip" nudge can be
The founder ask is "tell more about your recent trip". Detecting a trip means reading the library or location, and calling a cluster a trip is a guess. The guess is the exact "adds meaning" move our constitution rejects. Three tiers, safest first:

| Tier | Trigger | What we know | Library access | Recommendation |
|---|---|---|---|---|
| A. Parent-initiated | Parent taps "Add photos" | Only the chosen photos | None (system picker) | Ship first |
| B. Date-triggered or parent-labelled | Birthday evening, parent-set "remind me to talk about X" | A date, or the parent's own label | None | Ship with A |
| C. Photo moments (opt-in) | New library items by date or count | Counts and dates only, no scene or place | Limited-library or full read access | Later, after a privacy and constitution check; counts and dates only |

Tier C never uses scene labels, faces, places or "memories" grouping. Apple's own Journal suggestions do use those (photos, people and pet names, scene types, significant locations), on device, with per-category switches [verified: Apple privacy page for Journaling Suggestions]. Our line: "we never read what is in your photos". That is a real, checkable difference and it matches the Data Not Collected label. A new permission or any classifier changes that label story, so it needs the privacy steward and counsel before anything ships. [unverified: whether a limited-library read of dates alone needs an updated privacy label; ask counsel.]

### In-app cards (Tonight)
Max one photo card at a time, never above the main "Tell {child} about today" action, never during first run (K-02 rule). "Not now" snoozes for 14 days (proposed), and a sheet option "Stop photo cards" turns them off.

| Card | Title | Body | Buttons (22 chars max) |
|---|---|---|---|
| Invitation | Photos to talk about? | Choose up to five and say what was going on. | Choose photos / Not now |
| Birthday (date only) | Any photos from today? | Add up to five beside {child}'s letter. | Choose photos / Not now |
| Parent label | The story of {name} | Choose a few photos and tell {child} how it went. | Choose photos / Not now |
| In progress | {count} photos chosen | Tap the red circle and tell {child} about them. | Record / Change photos |
| After saving without photos | Add a photo? | You can put up to five beside this letter. | Choose photos / Not now |

### Consent wording
First time only, before the system picker (one sheet, one button, per Apple's pre-alert guidance already in `reminders.en.ts`):

- Title: Choose photos for this letter
- Body: Only the photos you choose are added, and they are kept with the letter, private like the rest of the book. The rest of your library is not read.
- Button: Continue
- Link line: Change this any time in Settings.

Wording checks: no claim of where photos are stored (the on-device-only rule bans that), no "we" (the touched-key rule), brand not typed. Whether chosen photos are copied into the app or referenced by library ID is an engineering call. I recommend copying, because a photo deleted from the library would otherwise leave a hole in a letter. That also means photos join export and any future backup. [unverified: no storage design exists; ask `mobile` and the backup owner.]

Tier C consent (later, separate sheet, off by default):
- Title: Photo moments
- Body: Early Letters can look at when new photos were added, and how many, to suggest a time to talk about them. It does not look at what is in them.
- Buttons: Turn on / Not now
- Settings row: Photo moments, with one switch. Off stops everything.

(In copy files the product name is `{app}`; it is written out here only for readability.)

### Picker flow, up to 5 photos
1. Entry points: Tonight card, "Add photos" on the record screen and letter page, notification tap. All open the same sheet.
2. Consent sheet if first time, then the system picker. Use the system photo picker rather than a custom grid. `expo-image-picker` exposes `allowsMultipleSelection`, `selectionLimit` and `orderedSelection` (numbered badges, returned in selection order, iOS 15+) [verified: Expo reference as mirrored on tessl.io; I did not run it]. The system picker running out of process and needing no library permission is from my memory of Apple's PHPicker documentation [unverified: confirm on a device]. Set limit 5, ordered selection on, photos only (no video or Live Photo in v1).
3. Order: the order picked is the order shown. A review screen lists thumbnails with drag handles and, for VoiceOver, "Move earlier" and "Move later" actions. The first photo is the cover. No auto-ordering by date.
4. Limit: the picker stops at five. If a sixth is tried: "Five is the most for one letter. Remove one to add another."
5. Preview: Done goes to the letter. The photos can be changed before or after recording. Recording does not require photos.

### How photos sit on the letter
- Photos form one band above the words, never inside them. The letter's serif text stays the only voice on the page. The app's small muted type is allowed for the optional parent caption label only if the parent wrote it.
- Layout by count: 1 full width; 2 side by side; 3 one wide and two below; 4 a grid of two by two; 5 one wide and a row of four. Corner radius from tokens. Tap opens full screen with pinch zoom and swipe.
- Read together: photos advance gently in order under the player, tied to the play position only by simple equal timing. Reduce Motion means a cross-fade or a plain list, no pan or zoom. No word highlight claims.
- Accessibility: each photo reads "Photo 1 of 3" by default. The parent can add their own description, which then is read aloud. We never write a description. Dynamic Type: the band does not reflow text. Both themes: no overlay text on photos, so contrast is not at stake.
- Sharing with the co-parent works like the letter itself. How photos sync is not designed yet. [unverified, depends on sync]

### Empty and error states

| State | Title | Body | Button |
|---|---|---|---|
| Empty (letter has none) | No photos yet | Choose up to five to sit beside this letter. | Choose photos |
| Cancelled picker | (nothing) | Return quietly to where they were. No toast. | none |
| Over five | Five is the most | Remove one to add another. | Review photos |
| One photo did not come through | One photo did not come through | It may still be loading from your library. Try again, or choose another. | Try again |
| Not enough room | That did not save | Your photos are still in your library. Free some space, then try again. | Try again |
| Unsupported type | Photos only for now | Choose a photo instead. | Choose photos |
| Removed a photo | Photo removed | It is still in your library. | Undo |

Do not say "your original is safe" about library items we do not control. "Still in your library" is a claim about the system library; it is true only because we copy, not move. Confirm with `mobile`.

### Notification wording for photos
See PH01 to PH06. Rules: questions or invitations, a label only from the parent, never "your trip" or "your birthday photos". At most one photo message every two weeks (proposed). Tapping opens the picker sheet directly; the quiet-hours gate and one-a-day cap apply.

## 3. Sequencing rule of thumb

Goal: two consecutive messages never feel like the same message.

1. Never repeat the shape of the last message. Never repeat a title's first word of the last two.
2. In any seven sent, no more than two of one shape, and at least one of Q, one of I or T, and at least one that is quiet in tone.
3. Event rows (month, birthday, milestone, festival, season) beat the rotation on their day. The next evening after an event row must be an invitation or a tiny task, to keep it light.
4. After a question, send an offer (I or T). After a tiny task, send an observation or question. Rule of three: ask, offer, wonder.
5. Type variety: after a gratitude row, send something sensory or curiosity before gratitude again. Photo, return and festival rows are not used back to back with their own type.
6. Use every row once before repeating any in the same set. Prompts have a stricter spec (365 days); for notification copy, a cycle through the eligible set is enough.
7. Age and context filter first (age band, Sunday only, opt-ins), then pick the shape, then pick the row. Fall back to an invitation if nothing is eligible.
8. Tone alternates: do not send two playful or two festive in a row.
9. Return rows ignore the rotation: at most two, then silence until the app is opened.
10. The planner is pure, so this fits as a function `pickNext(lastN, eligible)` with a table-driven test. [unverified: I did not read the planner code, only the brief.]

## 4. Benchmark voices

I searched for each product. For several I only got titles and snippets and did not open the pages. Treat the rest as direction, not as findings.

| Product | What it does well | What we adopt | What we leave | Basis |
|---|---|---|---|---|
| Calm | Soft language, invitation not command, a user-chosen reminder time, small tasks | Invite, never remind. Short, quiet titles. User picks the hour. | A "daily" frame. Our rules ban it. | [unverified: not opened this session] |
| Duolingo | Highly varied, funny notifications; strong brand voice | Variety by shape, and a touch of play | Guilt, streaks, mock threats, the fake "we'll stop sending these" gag. The press describes it as manipulative ("toxic ex" texts) and our rules ban the pressure | [unverified beyond search headlines: Web Designer Depot, The Sun Malaysia, Medium] |
| Day One | Prompts and "on this day" resurfacing | Resurfacing an old letter (RD03, RD06) | Auto-prompt cadence that implies a habit | [unverified: not opened] |
| Apple Journal | Suggestions from photos, places and activity; user picks which go to the app; on device with per-category switches | The principle that the user chooses what is shared | Scene, place and people inference. We state only what the parent chose | [verified: Apple privacy page for Journaling Suggestions]. The `JournalingSuggestions` API detail is [unverified]. |
| Tinybeans | Family sharing of baby photos and milestones | Milestone moments tied to age | A photo-first book. Ours is voice-first, photos support the letter | [unverified: not opened] |

What is ours alone: voice-first plus honest photo prompts ("we only know what you chose"), zero guilt copy, a lock screen that shows nothing by default, and an opt-in festival frame that never infers belief. "Backed by users" is not proven here; no research was run. Suggest testing three things with real parents: neutral versus named lock-screen preference, festival opt-in comprehension, and whether "any photos?" questions feel intrusive.

## Risks and gaps
- Nothing here has been seen on a real phone, and I did not read the planner or F13 spec, only the brief.
- Preterm and corrected-age families: milestone rows keyed to birth date may land awkwardly. Suggest an off switch inside "Month and birthday messages" and age math that honours a corrected-age setting later.
- NICU, loss, or a hard season: the one-tap stop and the no-countdown rule apply; milestone and festival rows are all opt-in anyway.
- Names-on-lock-screen: C variants with the child's name need the existing toggle. The festival-name switch is a new proposal and needs a settings string.
- Shared phones: neutral festival frame still says "special in your family", which reveals only that something is special.
- Regex hazards found while checking: "word for word" is allowed only in named paths; "break", "away" and "miss" are checked in some surfaces; `{count}` is allowed but `{festival}` is not, so festival names are literal strings.

## Checks run
I extracted every title and body in section 1 with a script and tested: title at most 40 characters, body at most 110 characters, no banned characters (dashes, curly quotes, ellipsis, emoji), no exclamation marks, no "we"/"our", no gendered pronouns, no daily-rhythm, gap or day-count patterns from `rules.test.ts`, no AI-word pattern, no "word for word", placeholders only from the allowlist. Result: 87 rows, 174 variants, all within limits and clean after two rewordings (a "clean page" and a verb "takes", both reworded to be safe). This was a scratch copy of the regexes, not the repo test suite.
