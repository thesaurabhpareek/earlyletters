# D5: Content and microcopy for the new tab (PROPOSED)

Status: PROPOSED words, for docs only. Nothing here is an edit to `packages/content`. Engineers build behind a flag and the founder approves the words before the flag turns on (`docs/product/prd/13-engineering-plan.md` section 4). Owner of the words once approved: the `content` agent. Lead: D5 of 5 design leads. Branch `wip/moments-d5`.

## 1. Purpose and scope

The founder wants a new tab that shows the value of the app before a parent gives photo access, asks plainly for that access, and still shows real things if the answer is Not now, limited or no. The 20 Nov update relaxes "default tab": position is open, and the same signal may drive local push and email.

This doc writes every word for that tab: the tab name, value lines, the permission primer, the Not now, declined and limited states, card text, empty and error states, VoiceOver labels, the illustrated examples (Asha only), and (new, section 12) proposed push, email and in-app card wording for the shared moment signal.

Out of scope: layout (design-systems), claims (legal), animation, the feasibility choice of Route A or Route B, and tab position. Where wording depends on those, it says so.

## 2. Inputs read

| Input | Used for |
|---|---|
| `/home/claude/moments-brief.md` incl. the 20 Nov UPDATE | Brief of record |
| `packages/content/VOICE.md`, `BRAND.md` (glossary, internal terms) | Voice, banned words |
| `packages/content/test/rules.test.ts` (read this session) | The checks in section 13 |
| `packages/content/src/permissions.en.ts` | Shape of an OS purpose string (`{app}`, one sentence, no brand typed) |
| `packages/content/src/strings.en.ts` (tabs, `moments`) | Existing tab words and the existing `en.moments` namespace |
| `docs/product/prd/00-product-frame.md`, `10-reading-and-family.md` | NS-32 budget, no server push at 1.0 (E79), NS-51 |
| Not found on this run | Branch `wip/moments-b1` (benchmark B1): not on origin, so not cited. PR #1264 and #1267 exist but were not read for this doc; reconcile when they merge. |

## 3. Findings that change the words

MT-D5-F1. **"Moment" is a glossary trap.** BRAND.md bans "moment" for a short piece a person makes (that is a "note"), and `en.moments.*` already means celebrations, which the rules test scans for comparisons and plan words. A tab called Moments collides with both. Recommend: keep "Moments" as the working name in docs only; ship a one-verb parent word (section 4); name the new string namespace `en.gather` (or the chosen verb), never `en.moments`.

MT-D5-F2. **Existing tab labels are single words** (Tonight, You; NX-30a-R9). One verb fits that pattern.

MT-D5-F3. **"we" and "our" are barred** in touched in-app copy except inside the sanctioned promises. Every string below says `{app}` or says the thing with no subject.

MT-D5-F4. **Words that say "stays on this phone", "never leaves", "no one else"** are barred in touched copy (option B, D-100, `ON_DEVICE_ONLY`). Privacy lines here say what the app does ("reads pictures on this phone only to show them here") not what it never does. Counsel decides whether a stronger line may be added (hand-off to `legal`).

MT-D5-F5. **No machine titles.** Apple's picker would supply a title and names; we never show or store them. All card text below is a date plus the parent's own label.

## 4. Tab name options (one verb each)

| Option | Fit | Risk |
|---|---|---|
| **Gather** (recommended) | Pictures, days and prompts gathered in one place to start a letter. Warm, active, no pressure. | None found. |
| **Notice** | Gentle; says "look at what is here". | Reads slightly abstract; VoiceOver "Notice, tab" is odd. |
| **Revisit** | Fits "a year ago". | Looks backward only; weak for typed occasions. |
| **Begin** | Clear action. | Competes with the red circle on Home. |
| **Remember** | Natural to parents. | Can imply forgetting, which brushes the no-guilt rule. |
| Moments (working) | Founder's word. | See MT-D5-F1. |

Tab label: `tabs.gather` = "Gather" (6 characters). Spoken hint: "Pictures, days and ideas for a letter." The founder owns the final word.

## 5. Value-prop lines (before permission, shown with our own illustrated examples)

Requirement MT-D5-R1. Given a parent opens the tab with no photo access decided, When the tab loads, Then it shows the headline, three value cards (each with an Asha example, section 11) and the primer (section 6), and no card is empty or locked. Test layer: component, plus a content-rules scan.

| Key | String |
|---|---|
| `gather.hero.title` | Start a letter from what you already have |
| `gather.hero.body` | Pictures, days that matter and small ideas, all in one place. You choose what becomes a letter. |
| `gather.value.pictures.title` | A picture can start a letter |
| `gather.value.pictures.body` | Pick one, then say what it meant. The picture goes in the book beside your words. |
| `gather.value.days.title` | Days that matter |
| `gather.value.days.body` | Birthdays, months and the days you mark. A good day to tell {child} something. |
| `gather.value.ideas.title` | Ideas for when you are not sure |
| `gather.value.ideas.body` | Short questions to answer out loud. Skip any that do not fit. |
| `gather.value.yourWords` | It stays in your words. |

Notes: "It stays in your words." is existing brand language. "Pick one" and "You choose" are true under both routes. No count is stated anywhere ("111 prompts" is never said).

## 6. The permission primer

Requirement MT-D5-R2. Given no photo decision exists, When the parent taps the primary button, Then the iOS system prompt (or Apple's picker under Route A) opens, and nothing is requested before the tap. Test layer: component + device. Shown: what the app reads and why. Records: the parent's answer, on the phone, as iOS does. Never: a pre-ticked box, an ask during first run (K-02, reversal below), a request on app open. Decline: Not now, with no penalty and no repeat prompt in the same session.

| Key | String | Chars |
|---|---|---|
| `gather.primer.title` | Show pictures here? | n/a (title) |
| `gather.primer.body` | {app} can look at the pictures on this phone to show you days that might make a letter. You can pick which ones. | |
| `gather.primer.detail` | Pictures are read on this phone only to show them here. Nothing is added to them. | |
| `gather.primer.allow.button` | Choose pictures | 15 |
| `gather.primer.notNow.button` | Not now | 7 |
| `gather.primer.settingsLine` | You can change this any time in Settings. | |

Route variants (the founder and feasibility pick one):
- Route A (Apple's picker): `gather.primer.allow.button` stays "Choose pictures"; the body line becomes "Pick a few pictures and say what they mean. {app} sees only the ones you pick." (true by the brief: the app sees only what is picked.)
- Route B (PhotoKit): body as above; the system string below is needed.

OS purpose string (`NSPhotoLibraryUsageDescription`, Route B only; follows `permissions.en.ts` shape; counsel review pending, BL-1305 reversal): `permissions.photos` = "{app} reads the pictures on this phone to show you days you might write a letter about."

Hard line: `{app}` is filled from `packages/brand`; the brand name is never typed.

## 7. Not now, declined, limited

Requirement MT-D5-R3. Given the parent taps Not now, When the tab next shows, Then it shows real content (section 8) and one quiet line offering to try again; no banner, badge or red dot. Test layer: component.

| State | Key | String |
|---|---|---|
| Not now | `gather.notNow.note` | Pictures are off for now. Days and ideas are still here. |
| Not now, retry | `gather.notNow.retry.button` | Show pictures |
| Declined in the system prompt | `gather.denied.note` | Pictures are off. Days and ideas are still here. |
| Declined, door | `gather.denied.settings.button` | Open Settings |
| Declined, help | `gather.denied.help` | To show pictures later, turn on Photos for {app} in Settings. |
| Limited access | `gather.limited.note` | You chose some pictures. {app} shows only those. |
| Limited, change | `gather.limited.change.button` | Choose more pictures |
| Restricted (device policy) | `gather.restricted.note` | Pictures cannot be used on this phone. Days and ideas are still here. |

Requirement MT-D5-R4. Given Limited access, When pictures show, Then the note says only that these are the ones the parent chose, and no line suggests "more" or "missing" pictures. Test layer: component + content scan. (Reason: "Choose more" is an action label; the note itself never compares.)

Reversals the founder owns (listed so words are not blamed): J4, the K-02 no-ask-during-first-run rule, BL-1305, ML-6, and the three-tab ruling.

## 8. Card text patterns

A card shows a date and the parent's own label, nothing else. No place, no people, no time-of-day title, no thumbnail caption, no machine title (MT-D5-F5).

Requirement MT-D5-R5. Given a picture day, When its card renders, Then the text is the date from `{date}` and, only if the parent typed or chose it, the label. Otherwise there is no second line. Test layer: unit on the text builder; content scan on templates.

| Card | Key | Template |
|---|---|---|
| Picture day, unlabelled | `gather.card.day.title` | {date} |
| Picture day, labelled | `gather.card.day.label` | {label} |
| Action | `gather.card.start.button` | Write about this |
| Secondary | `gather.card.addPicture.button` | Add to a letter |
| Typed day | `gather.card.occasion.title` | {occasionLabel} |
| Month and age | `gather.card.month.title` | {child} is {ageLabel} |
| A year ago | `gather.card.yearAgo.title` | A letter from {date} |
| A year ago, action | `gather.card.yearAgo.button` | Read it |
| Idea card | `gather.card.idea.title` | A question for {child} |
| Idea, action | `gather.card.idea.button` | Answer out loud |
| Skip an idea | `gather.card.idea.another.button` | Another question |
| Label field | `gather.card.label.placeholder` | Add your own words |

Notes: `{ageLabel}` is built from the child's date of birth by `packages/core` age math, in the app's existing format ("Month 4"). "Another question" is a refresh control, never "Refresh for more". `{date}` follows the locale. No "ago" is counted in days (DAY_COUNT guard): "A year ago" is a name for the card, not a count.

## 9. Empty states

Requirement MT-D5-R6. Given a section has nothing to show, When the tab renders, Then it shows a calm line and one action, never an apology, never a count of what is missing. Test layer: component.

| Where | Key | String |
|---|---|---|
| Picture days, none to show | `gather.empty.pictures.title` | Pictures will show up here |
| | `gather.empty.pictures.body` | When there are pictures to show, they appear here, newest first. |
| Recent, none | `gather.empty.recent.title` | Nothing here yet |
| | `gather.empty.recent.body` | You can still tell {child} about today. |
| | `gather.empty.recent.button` | Tell {child} |
| A year ago, none | (section is simply not shown) | n/a |
| Ideas, all seen | `gather.empty.ideas.body` | That is all the questions for now. Tell {child} anything you like. |

"Tell {child}" is 11 characters plus the name; the test fills `{child}` with a fictional name and the result must stay at 22 or fewer. Design confirms the width for longer names.

## 10. Error states

Titles have no full stop. Say what did not finish, not "did not work this time" (VOICE.md). Never say words are lost; nothing here touches a letter.

| Case | Key | String |
|---|---|---|
| Pictures did not load | `gather.error.load.title` | Pictures did not load |
| | `gather.error.load.body` | Your letters are not affected. Try again in a moment. |
| | `gather.error.load.button` | Try again |
| A picture cannot be opened | `gather.error.open.title` | That picture would not open |
| | `gather.error.open.body` | It may have been moved or removed. Pick another, or start without one. |
| Picture is in iCloud, not on the phone | `gather.error.remote.title` | That picture is not on this phone yet |
| | `gather.error.remote.body` | Open it in Photos first, or pick another. |
| Picker closed with nothing picked | (no message; the tab stays as it was) | n/a |
| Offline | no error: the tab works without a connection | n/a |

Flag: "iCloud" as a word is allowed (the glossary bans "iCloud account"). "Open it in Photos" relies on the behaviour of iOS; UNVERIFIED, confirm in feasibility.

## 11. Illustrated examples (Asha only)

These are our own illustrations shown before permission. Fictional family Asha (`no-real-family-data.test.ts`). No real names, places or businesses; no place on any card; no people named by a machine. Dates below are invented and carry no year.

| Example | Card text | Parent's label | Button |
|---|---|---|---|
| E1 picture day | June 3 | A walk with Nani | Write about this |
| E2 picture day, unlabelled | June 9 | (none) | Write about this |
| E3 typed day | Asha's birthday | (typed by the parent) | Tell Asha |
| E4 month and age | Asha is Month 14 | n/a | Tell Asha |
| E5 a year ago | A letter from June 3 | n/a | Read it |
| E6 idea | A question for Asha | "What makes Asha laugh?" | Answer out loud |

Requirement MT-D5-R7. Given the illustrated examples render before permission, Then each carries a small muted caption "An example" (key `gather.example.caption`), is not tappable into a real letter, and the name in it is the fictional Asha, never the parent's child. Test layer: component + `no-real-family-data` scan.

## 12. Push, email and in-app card wording (added 20 Nov update)

Rules these words obey (read from the brief; ML-3, NS-32, NS-51 are not re-verified here): fixed neutral text; no place, count, thumbnail or "waiting"; no push is created from library data (ML-3), so any push is the app's own local, fixed, random-id reminder scheduled from non-library facts; budget one per day maximum inside NS-32; quiet hours; no server push at 1.0 (E79); email only from what the server knows (the child's date of birth, typed days, letters made), never a library signal. Founder owns any reversal of E79.

### 12.1 Local push (title max 40, body max 110)

| Key | Title | Body |
|---|---|---|
| `notifications.gather.day.title` | A day to mark | |
| `notifications.gather.day.body` | | Something to tell {child}, when you have a minute. |
| `notifications.gather.pictures.title` | Pictures to look at | |
| `notifications.gather.pictures.body` | | Some pictures from the weekend are here. |
| `notifications.gather.month.title` | {child} is a month older | |
| `notifications.gather.month.body` | | A good day to say what this month felt like. |
| `notifications.gather.idea.title` | A question for {child} | |
| `notifications.gather.idea.body` | | One to answer out loud, or leave. |

The "pictures" line is the NS-51 wording as the brief quotes it. It names no place, count, thumbnail or "waiting". It does imply there is a library signal, so it is only valid when the schedule is driven by a local, on-device rule that does not store or transmit the library; whether that satisfies ML-3 is a question for privacy and legal (open question Q4). Safest fallback: send only the `day`, `month` and `idea` lines (all from facts the app already holds).

### 12.2 Email (from server knowledge only)

Transactional rule in VOICE.md: emails go only when something happened. A nudge email is a new class and needs counsel and the founder; these are proposed words, not a recommendation to send. No child name, no letter text, no library signal. `EmailCopy` shape applies.

| Part | String |
|---|---|
| Subject | A day worth a few words |
| Preview | Open the book when you like. |
| Body | A date that matters is coming up. If you would like to write to your child about it, the red circle is ready. |
| Button | Open the book |
| Close | Did not ask for this? You can ignore it. |

Note: the email body says "your child", not `{child}`, because VOICE.md bars the child's name in email.

### 12.3 In-app cards that echo the same signal

Same keys as section 8; the push and the card say the same thing in the same words so the parent never meets a surprise. A card the parent has seen and left is not shown again as a nudge; no "you have not opened" text anywhere.

### 12.4 The reason to come back (words, no streaks)

The line a parent sees when a day is marked: "Today is a good day to tell {child} something." (`gather.today.title`). It is one calm invitation, never a counter, run or reward. The tab changes with the calendar and the child's age, which is why there is always something new; the words never say so.

## 13. VoiceOver labels

Requirement MT-D5-R8. Given VoiceOver is on, When any element is focused, Then the label states what it is and what it does in one short phrase, decorative images are hidden, and no label contains a place, a machine guess, or "photo of". Test layer: device + accessibility audit.

| Element | Label | Hint |
|---|---|---|
| Tab | Gather | Pictures, days and ideas for a letter |
| Picture day card | June 3, A walk with Nani | Opens it to write a letter |
| Unlabelled card | June 9 | Opens it to write a letter |
| Write about this | Write about this day | Starts a letter |
| Add to a letter | Add this to a letter | Attaches it to the letter you are writing |
| Not now | Not now | Closes this and shows days and ideas |
| Choose pictures | Choose pictures | Opens the picture chooser |
| Another question | Another question | Shows a different question |
| Example caption | An example | n/a |
| Picture thumbnail | (hidden from VoiceOver; the card label carries the meaning) | n/a |

Dynamic Type to AX5: no label truncates; buttons wrap, and the 22 character cap is a source limit, not a layout promise. Reduce Motion: no copy change.

## 14. Edge and unhappy paths

- No child set up: `{child}` falls back to the existing neutral key used elsewhere; never a blank.
- Two children (twins): use the existing plural pattern ("{child} call"); a card names one child at a time.
- Very long parent label: truncate with the system ellipsis in layout, not the character in source.
- Parent label contains personal words: stays on the phone; never reaches analytics or logs.
- Language: the app is English; the parent's label stays in the language typed.
- Denied then allowed later in Settings: the tab refreshes on return, no banner saying "welcome back".

## 15. Constitution, privacy and accessibility checks

| Check | How it holds |
|---|---|
| No machine writes | Only a date and a parent-typed label appear; no title, caption, place or person guess |
| No AI wording | No "smart", "suggest" in a way that implies authorship; "show" and "pick" are used. Note: "ideas" and "questions" are our written prompts, never generated |
| No counts, gaps, streaks | None in any string; guarded by `DAY_COUNT`, `GAP` |
| No fear, guilt, loss | Declined and limited lines are neutral facts |
| Child not gendered | `{child}` and Asha, no pronouns |
| Content characters | No em or en dash, curly quote, ellipsis character, emoji; straight quotes only |
| Exclamation budget | Zero used |
| Button cap 22 | All button labels are 22 or fewer; fill `{child}` and re-check |
| Daily rhythm | No "daily" or "every day" anywhere; the section 12.4 line is a single-day invitation |
| Privacy | No library fact in analytics or logs; strings never promise "stays on the phone" |

Not yet run: this doc has not been run through `rules.test.ts` (no `npm install` on this run, by the brief). The first engineer PR must add the keys and run `npm test --workspace packages/content`; if a rule fails, change the words.

## 16. Open questions

| # | Question | Recommended default | Deadline |
|---|---|---|---|
| Q1 | Tab name | Gather | Before the design freeze |
| Q2 | Route A or B (changes the primer body) | Route A words first; Route B words ready | Feasibility doc |
| Q3 | May the primer say pictures "are read on this phone only"? | Yes, if legal confirms it is true for the chosen route | Before flag on |
| Q4 | Is the pictures push (NS-51 wording) allowed under ML-3 if scheduled from a local rule? | Ship only the day, month and idea pushes first | Before flag on |
| Q5 | Does the nudge email class exist at all? | No at 1.0; words held | Founder |
| Q6 | Is "iCloud" fine in the remote-picture error? | Yes | legal |
| Q7 | Namespace: avoid `en.moments` | `en.gather` | Engineer PR |

## 17. Dependencies

- Tab position and name (IA lead); layout (design-systems); claims (legal) for Q3, Q4, Q6; store page plans (marketing) if the tab is mentioned in the listing, which these words do not do.
- The permission string needs a counsel pass before any build includes `NSPhotoLibraryUsageDescription` (BL-1305).

## 18. Verified, unverified, guesses

VERIFIED this session (read from the repo): content rules in `packages/content/test/rules.test.ts` (character bans, exclamation budget, 22 character buttons, notification 40 and 110 limits, `ON_DEVICE_ONLY`, we/our rule, daily rhythm, gap and day count, moments-compare); glossary and internal terms in BRAND.md; existing tab labels and `en.moments` namespace; `permissions.en.ts` shape; the 1.0 rule that no row needs a server push (`10-reading-and-family.md`, E79).

UNVERIFIED: ML-3, NS-32 and NS-51 wording (taken from the brief, not re-read in their cards); that iOS lets "Open it in Photos" resolve an iCloud-only picture; whether Route A hides Apple's titles from the app; whether the brand name length makes any button overflow.

GUESS: that "Gather" tests best with parents; that the primer wording lifts allow rates (no number claimed).

Nothing in this doc used the screenshots. No real name, place or business appears.
