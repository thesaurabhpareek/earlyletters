# Memory Library: the words (permission, consent and surfacing)

Status: DRAFT, 10 Nov 2026 (UTC). Docs only. Author: Content lead (Claude role), for `content`. This file writes the parent-facing words for the Memory Library layers in NX-39 v2 and the design spec CS-S1 to CS-S15. It is not a requirement, not legal advice and not a founder decision. Nothing here is live: no key is referenced by any screen, nothing is added under `packages/content`, and no string ships until its phase row in NX-39 v2 section 3 is signed. The engineering agent ports the strings into `packages/content` with the rules test, in a later PR.

Heads read (10 Nov 2026): NX-39 v2 and the council record, PR #747 at d461c76b588ead5a9f35509c95e67182b4345a53; design spec and wireframes, PR #751 at 33912d2260f32d67aeba66bf89a64b8492e8cb2a (wireframes not opened); flows, PR #746 at 00a1082c33396b3021ab1904f4118f626d33786f; privacy analysis, PR #748 at 9bb1696c4f338305df6106108e75a98734c2b5fb (read by grep and in part; it sits at `docs/privacy/MEMORY-LIBRARY-PRIVACY-ANALYSIS-10nov.md` on that branch); the council critiques `cmo.md`, `clo.md`, `privacy-compliance.md`, `research.md`, `design-critique.md`; `VOICE.md`, `BRAND.md`, `test/rules.test.ts`, `COORDINATION.md` section 10, and the shipped `permissions.en.ts` and `strings.en.ts` for style. Apple behaviour is not re-read here; every statement about iOS repeats the design spec or NX-39 and keeps its UNVERIFIED tag.

## 0. How to read this file

### 0.1 The table columns

Every string table has the same seven columns.

| Column | Meaning |
|---|---|
| Key | Proposed string key. All keys start with `memoryLibrary.`, which the tables leave off. The engineering agent lists the subtree in the claims test (NX-39-R55) |
| String | The final proposed words. `{app}`, `{child}`, `{date}`, `{name}`, `{time}`, `{count}` and `{n}` are placeholders from the rules test list; none other is used |
| State | The screen, phase and state where it shows |
| Max | Longest length in characters that the surface can hold, as written, before any placeholder is filled |
| VoiceOver | The spoken label where it differs from the string; "same" when it does not |
| Notes | Why, what it replaces, what it depends on |
| Flag | COUNSEL-READ on every string that makes a promise, a consent statement or a privacy statement. A dash means none |

COUNSEL-READ means counsel and the founder read the exact words before they ship. It does not mean counsel wrote them or approved them. Every promise wording is also gated by the claims ledger in section 12.

### 0.2 Placeholders

The rules test allows a fixed set of placeholders (`rules.test.ts`, "uses only known placeholders"). The Memory Library needs a place name, a day name and a date range. To avoid a test change, the strings use these mappings.

| Placeholder | What it holds here |
|---|---|
| `{date}` | A date or a date range in the phone's date style, formatted by code ("12 Dec", "12 to 14 Dec", "Today") |
| `{name}` | Text the parent typed (a day's name) or a place name from the bundled table. Never a value from a photo's content |
| `{time}` | A part of the day word from `daypart.*` ("morning") |
| `{child}` | The child, with the app's existing fallback |
| `{app}` | The public name, filled from `packages/brand`. Never typed here |
| `{n}` | A limit the product table owns (NX-39 v2 section 6) |

### 0.3 Rules held on every string (applied by hand)

I cannot run vitest here. The rules from `rules.test.ts` and `CLAUDE.md` were applied by hand, and a separate Node script (section 16) re-checks the characters, the banned lists and the lengths. Rules held: no em dash, en dash, curly quote, ellipsis character or emoji; no fear, guilt or loss word; no AI-writing word; no gendered pronoun and no "son", "daughter", "boy" or "girl"; `{child}` only; no streak, point, badge, count of gaps or "N days ago"; no exclamation mark; buttons 22 characters or fewer; notification titles 40 or fewer and bodies 110 or fewer; no "we" or "our" (the one exception is quoted candidate PW-B, which is not a string); no trip, travel, holiday or festival word; no "waiting", "missed", "still", "forgot", "don't", "you have not" or "only" on the card; none of the internal terms in the BRAND.md table (entry, draft, take as a noun, pack, library, index, metadata, moment, scan, analyse, detect); no "found", "noticed" or "knows"; none of "safe", "secure", "backed up", "automatically", "nothing leaves", "stays on this phone", "only you can read" (the last two are caught by the P0 rule and are untrue with iPhone backup); the US spellings.

### 0.4 Assumptions I made, stated so they can be overruled

1. "L1" in the brief is the limited-photos level in `PARENT_STUDY_PLAN.md` Q5 (L0 picker, L1 limited, L2 full read). The three L1 variants in section 14 are therefore the pre-sheet ahead of a "choose which photos" decision. If the brief meant the first sheet in general, section 2.3 holds the full-read wording and the three variants can be rerun on it.
2. "Plain digits" means any number is written as digits and that the purpose strings carry no number at all. A number in a purpose string would be a frequency claim (NX-39-R44).
3. The parent word for one read of the dates is "check" ("Last checked", "Recent checks"), not "look". The design spec warns that "look" can read as surveillance. "Looks" is still the founder's word; the study (section 14.4) can test both. If the founder prefers "look", the swap is mechanical.
4. The working label for the section is "Photos and days" (section 1.2).
5. The in-app "days-away" card is the multi-day form of the Tonight card (NX-39-R16 and R27), not a second surface. It never uses "away", because R15 says "away" is never defined. The brief's own label for it stays in this file's headings only.
6. The digest, the share-sheet route and the widget are not written. The council refused the digest (T2, T3), deferred the share route and rejected the widget. No key exists for them.

## 1. The words

### 1.1 New parent words, and the ones to avoid

These are not in the BRAND.md glossary. They are proposals for it, to be added in the same PR that ports the strings.

| Word | Use | Avoid | Why |
|---|---|---|---|
| photos and videos | The things the parent has. "pictures" only where either may be meant (the Tonight card) | library, camera roll, gallery | "Library" is Apple's word and internal here |
| day, days | A calendar day that has pictures | moment, memory, event, occasion (for photo days) | "Moment" is an internal term (CR-25) |
| check, checked | One on-phone read of dates | scan, analyse, detect, look for, search | A check reads a date; it does not search inside |
| read | What the app does with a date: "reads the date" | access, collect, process, use | Plain; matches the purpose string |
| the list | What is kept on the phone: "the list of days" | index, cache, database, data | Parent can see it and clear it |
| forget | Clear the list | delete, wipe, purge | Matches the one-tap action. Not red: it removes only the app's own list |
| hide | Keep a day, stretch or photo out of cards | dismiss, snooze, block | The parent's own act, always undoable |
| hidden choices | The page that lists the parent's hides | blocklist, exclusions | Visible, behind App Lock |
| a stretch of days | A parent-set range, from and until | trip, break, season, away | The app never guesses a hard stretch |
| Tonight | The tab, used as a place | feed, home | Existing word |
| reminder days | Days the parent typed for a reminder | occasions (in copy), festivals, holidays, traditions | NX-39-R25: no festival word until counsel answers CB-21 |
| in the background | Used in one row title and one sheet | sync, refresh, fetch, scheduled | Parents know it from iPhone Settings |

Words never used for this feature in any string, by NX-39 and the council: found, noticed, knows, detects, smart, AI, magic, memories (as something the app makes), library, index, metadata, scan, moment, suggestion engine, trip, travel, holiday, festival, waiting, missed, still, forgot.

### 1.2 Section name candidates (the founder picks; NX-39 F14)

"Memory Library" is the founder's name for the feature and is internal (CR-25). The parent never reads it. Candidates for the Settings row and the page header, each 24 characters or fewer:

| Candidate | Length | For | Against | My view |
|---|---|---|---|---|
| Photos and days | 15 | Plain; says both things the page does; already the working label in #746 and #751 | "Days" is a little open | Recommended for now |
| Photos and dates | 16 | The most literal: it reads dates | Cooler; "dates" sounds like a calendar tool | Second choice, if "days" tests as unclear |
| Days with photos | 16 | Names the result | Reads like a list the app made of you | Not recommended |
| From your photos | 16 | Warm; short | Says nothing about days or reminders; hides the reminder-days page | Fine for a row, weak as a header |
| Find days | 9 | Matches the switch | A verb; poor as a section name | Keep as the switch name only |

Key: `section.title`. The same section holds the reminder days page, so the name must not say "photos" alone. That is a reason to avoid "From your photos".

## 2. Layer by layer: the moment before each ask

### 2.0 The layers and what each one shows

Each layer is a separate act the parent agrees to (NX-39-R47). Only the first two ask iOS a question.

| Layer | Phase | What the parent agrees to | iOS question | Act id (NX-39 R47) | Where the words are |
|---|---|---|---|---|---|
| 0. Picker | P0, P1 | Adding a picture from Apple's own sheet | None | none; the first-add notice records version and time only | 2.1 |
| 1. Library chooser on tap | P2a | Letting the app show all photos or chosen ones in a chooser, while the parent chooses | Photos access, asked from the sheet's Continue button only | `media_read` | 2.2, 2.4 |
| 2. Find days | P2b | A switch that reads dates when the app opens and keeps a list of days on the phone | The same question if not yet asked | `media_read` (see open question Q3 in section 18) | 2.3, 2.4, 4 |
| 3. Background top-up | P2c | Also checking while the app is closed, when iOS allows | None new | `media_background` | 2.5 |
| 4. Reminder days | P4a | Reminders on days the parent typed | Notifications, through the existing reminder ask | `occasions` | 7 |

Nothing in layers 1 to 4 appears at launch, in first run, during recording, in Review text entry or Listening, from a notification tap or from a deep link. The only caller of the iOS Photos question is the Continue button of the sheet.

### 2.1 Layer 0: the picker (P0 and P1)

No permission question, so there is no pre-sheet. The moment before the pick is one add button and, in P1, one quiet line under each picture saying what the picture's own data says. A one-line notice appears the first time a parent adds a picture they did not make (NX-39 section 8; counsel CB-6 owns the clause). Keys start with `memoryLibrary.`.

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `attach.add.photo` | Add a photo | Review; P0 | 22 | same | P0 holds one photo per letter | - |
| `attach.add.photoOrVideo` | Add a photo or video | Review; P1 onward, and P3 for video | 22 | same | The phrase NX-39 section 5 uses | - |
| `attach.firstAddNotice` | Add only pictures you have the right to keep in your book. | Once, on the first add of a picture the parent did not make | 80 | same | A placeholder for the Terms right-to-add clause (CB-6). Counsel's clause governs; if it needs a link, the link is a separate key. It records version and time only | COUNSEL-READ |
| `chip.sourceLabel` | From the photo | Review and letter page, label of the date and place line; P1 | 24 | same | NX-39-R10: a separate field, never part of the words | - |
| `chip.taken` | Taken {date} | P1, when the picked file carries a date | 24 | Photo taken {date} | No date shows no line and no error (R5) | - |
| `chip.place` | Near {name} | P1, only if BL-843 and BL-844 pass and the parent kept it | 32 | Near {name} | "Near" because a city is not an address. Never a street, hospital, business or worship place (R6). Drop the key if the table fails | - |
| `chip.editTitle` | Details for this photo | Edit sheet | 32 | same | From #746 ML-S7 | - |
| `chip.day.label` | Day | Edit sheet, date field | 12 | same | - | - |
| `chip.day.remove` | Remove day | Edit sheet | 22 | same | - | - |
| `chip.place.label` | Place | Edit sheet, text field | 12 | same | The parent's own typed words, no autocorrect | - |
| `chip.place.placeholder` | A town or a park | Edit sheet, empty field | 32 | same | "A home" from #746 is dropped: the example would invite a home address | - |
| `chip.place.remove` | Remove place | Edit sheet | 22 | same | - | - |
| `chip.removedToast` | Place removed. | After removal, with Undo | 32 | Place removed. Undo available. | Undo is the existing `photos.undoButton` | - |

The note under the first picture added with the picker (CS-S1b) is the door to layer 1. It shows once, ever, and has no close button.

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `note.line` | Photos are easier to find by their day. You can let {app} read their dates. | Review, once, after the first picked photo, only when P2a is on | 90 | same | It invites; it does not say what the app will do with them beyond reading dates | COUNSEL-READ |
| `note.link` | Tell me more | Same, button beside the line | 22 | Tell me more about finding photos by their day | Opens the sheet in 2.2 | - |

### 2.2 Layer 1: the library chooser on tap (P2a)

Sheet CS-S1, chooser form. The chooser lists photos and videos with their dates so the parent can pick several. It reads while the parent is choosing and at no other time. Buttons are equal in size, weight and type, and there is no Close glyph (NX-39-R48). VoiceOver order: title, reads, never, when, where, next, Continue, Not now.

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `ask.title.chooser` | Choose from all your photos? | Sheet title; P2a | 40 | same, heading | A question the parent can answer No to | - |
| `ask.chooser.reads` | {app} shows your photos and videos with the date each was taken, so you can pick some to go with a letter. | Paragraph 1 | 140 | same | Says what is read: pictures, shown, with dates. Places are not mentioned in P2a copy because the chooser shows a place only if the Places switch is on | COUNSEL-READ |
| `ask.never` | It never looks at what is in a photo or who is in it, and it never writes anything for you. | Paragraph 2, shared by every sheet | 120 | same | "Never looks inside" needs the NX-39-R9 scan proof; the line is held until it runs | COUNSEL-READ |
| `ask.chooser.when` | It reads them while you are choosing. | Paragraph 3 | 60 | same | True of P2a: foreground, parent-initiated. Not used in a build where Find days is on; use `ask.days.when.open` there | COUNSEL-READ |
| `ask.chooser.where` | Photos you pick are copied into your book, on this phone and in your iPhone's own backup if you use one. The rest stay in your Photos app. | Paragraph 4 | 160 | same | The backup clause is required under every candidate (council T7). "Stay in your Photos app" is true until the parent deletes the original. If counsel prefers the "does not receive" form, see PW-B in section 11 | COUNSEL-READ |
| `ask.next` | Next, your iPhone asks you. You can choose all photos or only some. {app} works either way. | "What happens next" line, shared | 110 | same | UNVERIFIED: the exact labels in Apple's alert. The string names the two outcomes by meaning, not by Apple's button names | - |
| `ask.continue` | Continue | Primary button | 22 | same; hint: Your iPhone asks next. | Equal in size and type to Not now | - |
| `ask.notNow` | Not now | Second button | 22 | same | Holds: the sheet never returns from a note. Settings is the only way back | - |
| `ask.heldToast` | You can change this any time in Settings. | Toast after Not now | 60 | same | The one line a No earns | - |

### 2.3 Layer 2: Find days (P2b)

Sheet CS-S1, days form. It appears when the parent turns on "Find days from your photos" and has not yet allowed photo access. If access already exists from layer 1, no sheet opens: the switch turns on and the sentence under it (section 4) is the Shown line. See open question Q3 on whether that is enough of an act.

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `ask.title.days` | Find days from your photos? | Sheet title; P2b | 40 | same, heading | - | - |
| `ask.days.reads` | {app} reads the date each photo and video was taken, so it can show you the days that have pictures. | Paragraph 1 | 140 | same | Dates only. Places have their own switch in the ledger and are not part of this agreement | COUNSEL-READ |
| `ask.never` | (shared, section 2.2) | Paragraph 2 | 120 | same | - | COUNSEL-READ |
| `ask.days.when.open` | It reads when you open {app}. | Paragraph 3, builds where P2c is off | 60 | same | The base of NX-39 R45. No frequency | COUNSEL-READ |
| `ask.days.when.background` | It reads when you open {app}. If you choose, it can also check while {app} is closed, when your iPhone allows. | Paragraph 3, builds where P2c is on | 140 | same | CMO-3: appears only in a P2c build, and then the purpose string says so too. No number | COUNSEL-READ |
| `ask.days.where` | The list of days it makes is kept on this phone. {app} does not receive it. | Paragraph 4, candidate 1 | 120 | same | "Does not receive" is the PW-B family. The verb and the label answer are counsel's. Use only one of this and `where.alt` | COUNSEL-READ |
| `ask.days.where.alt` | The list of days it makes is kept on this phone. You can see it, turn it off and clear it in Settings. | Paragraph 4, candidate 2 | 140 | same | Makes no claim about what the company receives; it describes controls. Safer if counsel rejects "receive" | COUNSEL-READ |
| `ask.next` | (shared) | "What happens next" | 110 | same | - | - |
| `ask.continue`, `ask.notNow`, `ask.heldToast` | (shared) | Buttons and toast | - | same | - | - |

Rows that exist once and are shared by 2.2, 2.3 and the background sheet: `ask.never`, `ask.next`, `ask.continue`, `ask.notNow`, `ask.heldToast`.

### 2.4 Follow-ups to the iOS answer (Allow all, Select Photos, Don't Allow, and later changes)

The iOS alert is the system's. The app does not restyle it, does not add an "are you sure" and does not thank the parent. Apple's own button labels are UNVERIFIED, so this table names the three outcomes by meaning. The state matrix for the same outcomes is in section 8.

| Outcome | What the parent sees | Strings |
|---|---|---|
| Allow all | The chooser or the ledger opens with "All photos" as the access value. One check runs at once, invisibly: no spinner, no thank-you, no toast. The Tonight card can appear the next time Tonight opens, never mid-view | `access.value.all`, `access.all.line` |
| Select Photos (limited) | The chooser or ledger opens over the chosen photos, with one calm line and a "Choose more" button. The app presents its own selection screen, so iOS's own prompt never appears at a cold start (`PHPhotoLibraryPreventAutomaticLimitedAccessAlert`, NX-39-R4) | `access.value.chosen`, `access.chosen.line`, `access.chosen.more` |
| Don't Allow (denied) | The ledger shows the access row as off in iPhone Settings with an Open Settings button. The Find days switch is disabled, with its reason in words. Picking one photo at a time still works. No red, no apology, no "you are missing out" | `access.value.off`, `access.off.line`, `access.off.reason`, `access.off.button` |
| Changed later in iPhone Settings | The next open shows the new level without comment. Narrower or off: the list is cleared and one line says so, announced politely once. Wider: nothing changes until the parent turns Find days on | `access.changed.cleared` |
| iOS returns an error, not an answer | The sheet closes and one error line appears where the parent came from. No retry loop | `access.error` |

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `access.row.title` | Photo access | Ledger row title | 24 | same | - | - |
| `access.value.all` | All photos | Row value | 24 | Photo access, all photos | - | - |
| `access.value.chosen` | Chosen photos | Row value, Select Photos | 24 | Photo access, chosen photos | - | - |
| `access.value.off` | Off in iPhone Settings | Row value, denied | 32 | Photo access, off in iPhone Settings. Opens iPhone Settings. | - | - |
| `access.value.notAsked` | Not asked yet | Row value, before any ask | 24 | same | - | - |
| `access.all.line` | {app} can see all your photos. | Access page, all | 60 | same | A state, not a promise | - |
| `access.chosen.line` | {app} can see only the photos you chose. | Access page and chooser note, Select Photos | 60 | same | True whatever happens to new photos. No sentence about new photos is written until the BL-871 spike answers (NX-39-R11) | - |
| `access.chosen.more` | Choose more | Button, only in the chooser and the ledger | 22 | Choose more photos | Never shown in Review or Tonight | - |
| `access.off.line` | {app} cannot see your photos. You can choose them one at a time. | Access page and chooser, denied | 80 | same | Replaces #746 "Early Letters cannot see your photos. You can still choose..." (the word "still" is dropped) | - |
| `access.off.reason` | Needs photo access. | Under the disabled Find days switch | 32 | same | Reason in words, not colour | - |
| `access.off.button` | Open Settings | Button | 22 | Open Settings. Opens iPhone Settings. | - | - |
| `access.manage` | Manage in Settings | Button on the access page | 22 | Manage in Settings. Opens iPhone Settings. | Not "Manage in iPhone Settings" (25 characters, over the limit) | - |
| `access.notAsked.line` | {app} has not asked for photo access. | Access page, before any ask | 60 | same | - | - |
| `access.changed.cleared` | The list was cleared because photo access changed. | One line on the ledger after a narrower level or off | 60 | same, announced once, politely | R42: the list and its files are removed on the next open | COUNSEL-READ |
| `access.error` | Photo access did not change. You can try again in Settings. | Error line where the parent came from | 80 | same | Names what did not finish (VOICE.md) | - |

### 2.5 Layer 3: the background top-up consent (P2c)

Sheet CS-S4a, the same shape as the first sheet. Shown the first time the parent chooses "Also in the background". Every string in this section exists only in a build where `EXPO_PUBLIC_MOMENTS_BACKGROUND` is on, and that flag stays off in every production and TestFlight profile until the founder's recorded ruling and every gate in NX-39 section 3 for P2c pass. No number appears in any of it.

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `bg.title` | Also check in the background? | Sheet title; P2c only | 40 | same, heading | - | - |
| `bg.reads` | {app} can read the dates of your photos while it is closed. It reads the same thing as before and nothing more. | Paragraph 1 | 140 | same | States that the use does not widen | COUNSEL-READ |
| `bg.when` | Your iPhone decides when, and it may not check at all. Low Power Mode and Background App Refresh can stop it. | Paragraph 2 | 140 | same | No frequency, no "a few times a day" (R44, UR-6). The Apple facts are from the design spec section 11 and keep its UNVERIFIED tags | COUNSEL-READ |
| `bg.shows` | It never sends you a message about what it reads. | Paragraph 3 | 80 | same | True by R27: no notification derives from the library | COUNSEL-READ |
| `bg.off` | You can turn this off in one tap, any time. | Paragraph 4 | 60 | same | Matches the two-tap withdrawal in R46 only if the row is one tap away; engineering to confirm which number is true and change the line, not the control | COUNSEL-READ |
| `bg.turnOn` | Turn on | Primary button | 22 | same | Equal to Not now | - |
| `bg.notNow` | Not now | Second button | 22 | same | The row stays on "Only when I open {app}" | - |

### 2.6 Layer 4: nudges

There is no nudge made from the library (NX-39-R27). The only nudges are reminders on days the parent typed (P4a), covered in section 7, and the in-app Tonight card (section 5). The pre-permission moment for reminder days is the "reminder days" screen itself: the preview line shows exactly what the lock screen will say before anything is switched on, and the notification question is asked by the existing reminder ask, not by new copy.

## 3. iOS purpose string candidates (for counsel)

`NSPhotoLibraryUsageDescription` is one active sentence about purpose, with no promise about where data goes, and no number (NX-39-R56; CMO-4). It is shown to every person whatever a later build does, which is why the promise lives in the sheet and not in the string. The microphone string is the precedent the privacy analysis calls wrong (finding 11): it carries a second sentence, "Your recordings stay on this phone", that a purpose string should not hold. I have not changed it; it is in section 19 for the founder.

None of these is chosen. Each uses `{app}`, filled from `packages/brand`.

| Id | Build it belongs to | Candidate | Length | Notes |
|---|---|---|---|---|
| PS-1 | P2a, chooser only | {app} shows your photos and videos with their dates, so you can choose some to go with a letter. | 98 | Describes the chooser. Does not describe reading for a card, so it is incomplete in a P2b build |
| PS-2 | P2b without background, dates only (the NX-39 section 5 draft, with "find" kept) | {app} uses the dates in your photos and videos to help you find pictures for a letter. | 87 | The draft in NX-39 v2 section 5.1. "Use" is the broadest verb; counsel may want "reads" |
| PS-3 | P2b, dates and places | {app} uses the dates and places in your photos and videos to help you find pictures for a letter. | 98 | Only if the Places switch can be on in that build. If the place row does not exist, PS-2 is the true one |
| PS-4 | P2b alternative verb | {app} reads the dates of your photos and videos so you can find the ones for a letter. | 86 | Uses the same verb as the sheet, so the two read as one |
| PS-5 | P2c, one sentence | {app} uses the dates in your photos and videos to help you find pictures for a letter, including when the app is closed. | 120 | The one-sentence form CMO-4 asks for. Exists only if `UIBackgroundModes` is in that build |
| PS-6 | P2c, two sentences (NX-39 and #748 draft) | {app} uses the dates in your photos and videos to help you find pictures for a letter. It can do this when the app is closed. | 125 | The second sentence goes with the flag. A build with the flag off must use PS-2 |

Hand check against the content rules: none contains a dash, quote, number, "we", a gendered word, an AI word or "library". All are COUNSEL-READ. A string must equal the content string word for word in the built plist (R56), and mention reading while closed if and only if P2c is on.

## 4. The ledger (CS-S3) and When it checks (CS-S4)

The ledger is the page where the feature can be seen and stopped. The answer to the trust cost of an unseen read is being able to look at it, not a promise. Master off is one tap with no dialog.

### 4.1 Truth in the copy: how often it checks

Karma's ruling and NX-39-R44: no frequency or freshness number anywhere in parent copy. So the copy says what is true and nothing else. What is true, in plain words: the app reads the dates when the parent opens it; if the parent chooses, and if iOS allows, it may also check while it is closed. iOS decides when and may not. The page shows the real times of recent checks, without a count. The words "a few times a day", "every day", "up to date", "2 to 3 times" and "up to 3 a day" are not used, and the claims test fails on them in every profile.

### 4.2 Master row, access, switches

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `section.title` | Photos and days | Settings row title and page header | 24 | Photos and days, heading | The working label | - |
| `section.row.value.on` | On | Settings row value | 12 | same | - | - |
| `section.row.value.off` | Off | Settings row value | 12 | same | - | - |
| `section.row.help` | Find photos by their day. | Settings row subtitle | 60 | same | - | - |
| `ledger.master.title` | Find days from your photos | Master switch label | 40 | Find days from your photos, on. Switch. (hint is the sentence below) | The Voice Control name | - |
| `ledger.master.on` | On. {app} reads the dates of your photos when you open it. | Sentence under the master switch, on; builds without P2c | 100 | same | Swaps over `swapMs`, opacity only | COUNSEL-READ |
| `ledger.master.on.bg` | On. {app} reads the dates of your photos when you open it, and may also check while it is closed, if your iPhone allows. | Same, builds with P2c, only when "Also in the background" is chosen | 140 | same | Says what is true, no number | COUNSEL-READ |
| `ledger.master.off` | Off. Nothing is read. | Sentence under the master switch, off | 40 | same | "Nothing is read" is true only if R18 holds (0 reads when off) | COUNSEL-READ |
| `ledger.dates.title` | Dates | Switch label | 24 | same | - | - |
| `ledger.dates.lets` | Lets {app} read the day each photo or video was taken. | Under the Dates switch | 80 | same | - | COUNSEL-READ |
| `ledger.dates.doesNot` | Does not read what is in it. | Under the Dates switch | 60 | same | Needs the R9 scan proof | COUNSEL-READ |
| `ledger.places.title` | Places | Switch label; absent if the offline table fails its test | 24 | same | Default off (council T12). The row does not exist if BL-844 fails | - |
| `ledger.places.lets` | Lets {app} read the town a photo was taken in. The name comes from a list kept in the app. | Under the Places switch | 120 | same | The list is bundled and makes no network call (R7) | COUNSEL-READ |
| `ledger.places.doesNot` | Never a street, and no exact spot is kept. | Under the Places switch | 60 | same | R6: a city key only | COUNSEL-READ |
| `ledger.places.shown` | A place shows only after you tap a day, never on a card. | Under the Places switch | 80 | same | R16 | COUNSEL-READ |

### 4.3 When it checks, the status block and the recent checks

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `ledger.when.title` | When it checks | Ledger row title, and the page header | 24 | same | - | - |
| `ledger.lastChecked.label` | Last checked | Row label | 24 | same | A real timestamp written by the app, not an estimate | - |
| `ledger.lastChecked.value` | {date}, {time} | Row value, for example "Today, morning" | 32 | same | Day word then part of the day. No count, no "N days ago" | - |
| `ledger.lastChecked.never` | Not yet | Row value before any check | 24 | same | Silence is a correct state; no apology | - |
| `daypart.morning` | morning | Part of the day word | 12 | same | - | - |
| `daypart.afternoon` | afternoon | Part of the day word | 12 | same | - | - |
| `daypart.evening` | evening | Part of the day word | 12 | same | - | - |
| `daypart.night` | night | Part of the day word | 12 | same | - | - |
| `day.today` | Today | Date word for `{date}` | 12 | same | - | - |
| `day.yesterday` | Yesterday | Date word for `{date}` | 12 | same | Ledger only. Never on a card (no time-since) | - |
| `cadence.open.title` | Only when I open {app} | Choice row 1, default | 40 | Only when I open {app}, chosen. | Radio-group semantics | - |
| `cadence.open.desc` | {app} reads the dates each time you open it. | Under choice 1 | 80 | same | The only mode whose timing is a fact | COUNSEL-READ |
| `cadence.bg.title` | Also in the background | Choice row 2; only in P2c builds | 40 | Also in the background, not chosen. | Opens the sheet in 2.5 first | - |
| `cadence.bg.desc` | {app} may also check while it is closed, when your iPhone allows. Your iPhone decides when, and it may not. | Under choice 2 | 140 | same | No number | COUNSEL-READ |
| `cadence.status.title` | What your iPhone allows | Status block header | 40 | same | - | - |
| `cadence.status.bar.on` | Background App Refresh is on for {app}. | Status block | 80 | same | Only if the app can read the setting (UNVERIFIED); otherwise use `cadence.status.unknown` | - |
| `cadence.status.bar.off` | Background App Refresh is off for {app}, so it checks only when you open it. | Status block | 100 | same | Choice 2 stays selectable, because iOS may be changed later | COUNSEL-READ |
| `cadence.status.bar.button` | Open Settings | Button with the line above | 22 | Open Settings. Opens iPhone Settings. | - | - |
| `cadence.status.lowPower.on` | Low Power Mode is on, so checks may pause until it ends. | Status block | 80 | same | No red. It resumes with no message | COUNSEL-READ |
| `cadence.status.unknown` | Background App Refresh and Low Power Mode can pause checks while {app} is closed. | Status block, if neither setting can be read from code | 120 | same | A static line that claims no state | - |
| `cadence.limited.caveat` | With chosen photos, it checks only those. | Under the choices when access is limited | 60 | same | True while the OS reports limited access | - |
| `cadence.recent.title` | Recent checks | Header of the short list | 24 | same | Newest first, at most 5 | - |
| `cadence.recent.row` | {date}, {time} | Each row, with the reason beneath | 32 | {date}, {time}, then the reason | Time and reason only (CB-26) | - |
| `cadence.recent.opened` | You opened {app} | Reason | 40 | same | - | - |
| `cadence.recent.background` | In the background | Reason | 32 | same | - | - |
| `cadence.recent.empty` | No checks yet. | Empty list | 32 | same | If background checks have not happened, only "You opened" rows show. The page does not apologise | - |

### 4.4 What is kept, and what is never done

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `ledger.onPhone.title` | On this phone | Section header | 24 | same | - | - |
| `ledger.onPhone.row` | A list of days that have photos, and the days you hid. | Static row | 80 | same | Describes the kept data. The hidden choices store may be in iPhone backup (CB-25 open), so no line says "only" or "never leaves" | COUNSEL-READ |
| `ledger.onPhone.updated` | Updated {date} | Under the row | 32 | same | - | - |
| `ledger.onPhone.empty` | Nothing is kept yet. | Empty state | 40 | same | No call to action and no "go take photos" | - |
| `ledger.never.title` | Never | Header of the block | 12 | same | A plain list in a footnote block, not a link | - |
| `ledger.never.1` | Never reads what is in a photo. | Line | 60 | same | - | COUNSEL-READ |
| `ledger.never.2` | Never reads who is in it. | Line | 60 | same | - | COUNSEL-READ |
| `ledger.never.3` | Never writes anything for you. | Line | 60 | same | The constitution | - |
| `ledger.never.4` | Never puts a photo, place or count in a reminder. | Line | 60 | same | R26, R27 | COUNSEL-READ |
| `ledger.never.5` | {app} does not receive the list. | Line; candidate | 60 | same | The PW-B family. Remove this line if counsel rejects "receive" | COUNSEL-READ |
| `ledger.footnote` | You can change photo access any time in iPhone Settings. | Footnote | 80 | same | - | - |

## 5. Surfaces: Tonight card, the multi-day card, the shelf, where it shows

### 5.1 The Tonight card (CS-S6) and the multi-day card

The card shows a date or a date range only: no place, no thumbnail, no count, no time-since (R16). It never sits above "Tell {child} about today", never shows in first run, and never appears while Tonight is already on screen. It has no numerals about photos, letters or days, and none of: waiting, missed, still, forgot, don't, you have not, only (R17). A date in the kicker is a date, not a count.

Refused wordings, so nobody proposes them again: "A day out on {date}, near {place}" (claims an outing the app cannot know, and puts a place on a card read over shoulders); "Some photos from this weekend" (a name for the days); "A year ago"; "Photos waiting"; any line with a number of pictures.

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `card.kicker` | {date} | Kicker above the body; a day or a range such as 12 to 14 Dec | 24 | same | Phone date style. "to" for a range, never a dash | - |
| `card.body.day` | You have pictures from this day. | One-day card | 60 | {date}. You have pictures from this day. | "Pictures" covers photos and videos. A statement about files, not about the day | - |
| `card.body.days` | You have pictures from these days. | Multi-day card (the P4b form) | 60 | {date}. You have pictures from these days. | Nothing says "away" or "trip" | - |
| `card.primary` | Tell a letter about it | Primary button | 22 | Tell a letter about it. Opens your photos from that day. | 22 characters, at the limit. Nothing is pre-selected on the next screen | - |
| `card.notNow` | Not now | Quiet button | 22 | same | Puts the card away for 14 days (NX-39 section 6) | - |
| `card.more` | More | Text button, opens the hide menu | 22 | More. Opens ways to hide or stop these. | A word, not an icon only | - |
| `card.notNowToast` | Put away for now. | Toast after Not now | 32 | same | - | - |
| `card.days.alt` | Pictures from {date}. | Study variant for the multi-day body (BL-857) | 40 | same | To compare with `card.body.days`. Not for production unless it tests better | - |

Present only when every switch is on: master, Dates and the Tonight card switch. When any is off there is no card and no placeholder. Denied, limited, offline, Low Power Mode and background-off leave the card unchanged (it uses the last list).

### 5.2 The composer shelf (CS-S9)

A row of date chips at the top of the add-photos sheet. It is not on the recording screen, Listening or Review text entry.

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `shelf.heading` | Days with photos | Row heading in the chooser | 24 | same, heading | - | - |
| `shelf.chip` | {date} | Each chip, a date | 24 | The full date, button | No count on a chip, no "suggested" label, no ranking beyond time | - |
| `shelf.scoped` | {date} | Heading of the grid scoped to a day | 32 | same | Nothing pre-selected | - |
| `shelf.scoped.place` | {date}, near {name} | Same heading when the Places switch is on | 48 | same | Place only here, after the tap | - |
| `shelf.showAll` | Show all photos | Quiet button above a scoped grid | 22 | same | - | - |

### 5.3 Where it shows (CS-S8)

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `surfaces.title` | Where it shows | Row title and page header | 24 | same | - | - |
| `surfaces.value.tonight` | Tonight | Row value | 24 | same | - | - |
| `surfaces.value.both` | Tonight and add photos | Row value | 32 | same | - | - |
| `surfaces.value.none` | Nowhere | Row value | 24 | same | - | - |
| `surfaces.tonight.title` | Tonight card | Switch label | 24 | same | - | - |
| `surfaces.tonight.desc` | A date on Tonight, one at a time. No picture, place or count. | Under the switch | 80 | same | R16 | COUNSEL-READ |
| `surfaces.shelf.title` | Days in the add-photos sheet | Switch label | 40 | same | - | - |
| `surfaces.shelf.desc` | Dates that have photos, shown when you add photos. | Under the switch | 80 | same | - | - |
| `surfaces.footer` | Nothing here sends you a message. | Footer | 60 | same | R27: no notification is derived from the library | COUNSEL-READ |

## 6. Hide, hidden choices, Forget, Stop these, Erase everything, Clear hidden choices

What clears what (council T5, NX-39-R41): the parent's hidden choices survive Forget, Stop these, a revoke and a rebuild. Only Erase everything, Delete account and an explicit Clear hidden choices remove them. Every string below must say so where a parent could expect otherwise.

### 6.1 Hide controls (CS-S12)

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `hide.menu.day` | Hide this day | More menu | 22 | same | Hides until the parent undoes it | - |
| `hide.menu.stretch` | Hide a stretch of days | More menu | 22 | same | 22 characters, at the limit | - |
| `hide.menu.stop` | Stop these | More menu | 22 | Stop these. Turns off Find days. | Same effect as the master switch | - |
| `hide.photo` | Hide this photo | Preview in the chooser (long press) and its button | 22 | same | A Select and a Hide button exist for Switch Control | - |
| `hide.dayToast` | This day is hidden. | Toast, with Undo | 40 | This day is hidden. Undo available. | - | - |
| `hide.photoToast` | Photo hidden. | Toast, with Undo | 40 | same | - | - |
| `hide.undo` | Undo | Toast action | 22 | same | Existing word | - |
| `hide.stretch.title` | Hide a stretch of days | Sheet title | 32 | same, heading | The app never guesses a hard season; the parent sets it | - |
| `hide.stretch.from` | From | Date field label | 12 | same | Pre-filled with the card's day | - |
| `hide.stretch.until` | Until | Date field label | 12 | same | - | - |
| `hide.stretch.help` | No card or shortcut will show these days. You can undo this in Hidden choices. | Under the fields | 100 | same | - | COUNSEL-READ |
| `hide.stretch.done` | Done | Primary button | 22 | same | - | - |
| `hide.photo.help` | This photo is left out of cards and shortcuts. You can still pick it yourself. | Under the photo preview | 100 | same | Different from taking a photo out of a letter | - |
| `stop.toast` | Find days is off. | Toast after Stop these, with Undo | 40 | Find days is off. Undo available. | One tap, no dialog | - |

### 6.2 Hidden choices (CS-S12c)

A plain list of the parent's own hides, each with Show again, behind App Lock like the Book. It has no counts.

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `hidden.title` | Hidden choices | Page title and Ledger row title | 24 | same, heading | - | - |
| `hidden.intro` | These are the days and photos you hid. They stay out of cards and shortcuts until you show them again. | Under the title | 120 | same | - | - |
| `hidden.row.day` | {date} | Row for a day or a stretch | 32 | Hidden: {date} | - | - |
| `hidden.row.photo` | Photo, {date} | Row for a hidden photo | 32 | Hidden photo, {date} | - | - |
| `hidden.show` | Show again | Row action | 22 | Show {date} again | - | - |
| `hidden.empty` | Nothing is hidden. | Empty state | 32 | same | - | - |
| `hidden.clear.button` | Clear hidden choices | Button at the foot of the page | 22 | same | 20 characters | - |
| `hidden.clear.title` | Clear hidden choices? | Confirm dialog title | 40 | same | - | - |
| `hidden.clear.body` | Days and photos you hid may show on cards again. Your photos and letters are not touched. | Confirm dialog body | 120 | same | Says the consequence plainly: a hidden hard week can come back | COUNSEL-READ |
| `hidden.clear.confirm` | Clear | Confirm button | 22 | Clear hidden choices | Second in the dialog, never the default | - |
| `hidden.clear.back` | Keep them hidden | Cancel, first in the dialog | 22 | same | Same pattern as the existing "Keep everything" | - |
| `hidden.clear.toast` | Hidden choices cleared. | Toast | 40 | same | - | - |

### 6.3 Forget the list (CS-S13)

One tap. The list is deleted, Find days turns off, and the parent's photos, letters and hidden choices are untouched. No Undo: the list is rebuilt by turning Find days on. No confirm dialog by default (design opinion; NX-39-R49). If privacy wants a confirm, the optional dialog below is one button plus Cancel, never three.

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `forget.row.title` | Forget the list | Ledger row | 24 | Forget the list | Voice Control name. Text colour `text`, not red | - |
| `forget.row.desc` | Removes the list of days {app} made. Your photos, letters and hidden choices are not touched. | Under the row | 120 | same | - | COUNSEL-READ |
| `forget.toast` | Forgotten. Find days is off. | Toast, no Undo | 40 | Forgotten. Find days is off. (announced) | The design spec's "Looking is off" uses "looking"; this uses the switch's own name | - |
| `forget.error` | That did not finish. Try again. | Error line under the row | 60 | same | Nothing half-done is reported as done | - |
| `forget.confirm.title` | Forget the list? | Optional dialog, only if privacy asks | 40 | same | Not in the default flow | - |
| `forget.confirm.body` | {app} will remove its list of days and turn off Find days. Your photos, letters and hidden choices are not touched. | Optional dialog | 140 | same | - | COUNSEL-READ |
| `forget.confirm.button` | Forget | Optional dialog | 22 | same | - | - |
| `forget.confirm.back` | Cancel | Optional dialog | 22 | same | - | - |

### 6.4 Erase everything

The existing Erase everything screen (`strings.en.ts`, `erase`) says "This removes every book, letter and recording from this iPhone, and your settings." The Memory Library adds one line, read after the body. It does not replace any existing line. The existing sentence "Nothing is sent anywhere" stays true; it now has to cover the list, the hidden choices and the pending reminders (privacy analysis row 13), and that is the claims test's job. The same line belongs on the Delete account screen.

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `erase.mediaLine` | This also clears the list of days made from your photos, your hidden choices and the reminder days you added. | Erase everything and Delete account, after the body | 140 | same | R31: the index and its sidecars, the decisions and pending occasion notifications are gone, and an interrupted erase resumes at next launch. Only shown when the build has the feature | COUNSEL-READ |

## 7. Reminder days (P4a): the typed-day flow and the local notification bodies

Rules (NX-39-R25 to R29, R61): the parent types every day, with a name and a date. No list ships, nothing is chosen by default, nothing is inferred from locale, place, language, photo or date of birth. The word "festival" and every named religious day are absent from copy, the store listing and the screens until counsel answers CB-21. The reminder is a local notification with a fixed text key chosen when it is scheduled, carrying nothing from the library. `userInfo` holds only a random per-notification id. No attachment, `subtitle` or `threadIdentifier`. A tap opens Tonight by a fixed route.

### 7.1 The reminder days screen

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `occasions.row.title` | Reminder days | Settings row title and page header | 24 | same, heading | Parent name for what the code calls occasions | - |
| `occasions.value.none` | None added | Settings row value | 24 | Reminder days, none added | A complete, normal state. A count of chosen days is not shown | - |
| `occasions.value.on` | On | Settings row value | 12 | same | - | - |
| `occasions.intro` | Add the days you would like a reminder for, such as a birthday or an anniversary. {app} adds none for you. | Under the header | 140 | same | "Birthday" and "anniversary" are examples of the parent's own days, not a list. Do not add any named religious day | COUNSEL-READ |
| `occasions.empty` | No days added yet. Add one if you like. | Empty state | 60 | same | No call to action beyond the button | - |
| `occasions.add` | Add a day | Button | 22 | same | - | - |
| `occasions.sheet.title` | Add a day | Sheet title | 24 | same, heading | - | - |
| `occasions.name.label` | Name | Text field label | 12 | same | The parent's own words | - |
| `occasions.name.placeholder` | What would you like to call it? | Empty field | 40 | same | Offers no example, so it cannot suggest a festival | - |
| `occasions.name.limit` | Up to 40 characters. | Under the field | 32 | same | The existing `nameLimit` pattern | - |
| `occasions.name.help` | The name stays in the app. The lock screen shows it only if you turn that on. | Under the field | 100 | same | R26. Do not reword to "private" or "only you" | COUNSEL-READ |
| `occasions.date.label` | Date | Date field label | 12 | same | - | - |
| `occasions.repeat` | Every year | Switch, default on | 24 | same | Not a rhythm claim: it is the parent's own date. The rules test's daily-rhythm rule matches "every day" and "every night", not this | - |
| `occasions.save` | Save | Primary button | 22 | same | Waits, with the reason in words, until the name is not empty | - |
| `occasions.cancel` | Cancel | Quiet button | 22 | same | - | - |
| `occasions.need` | Add a name to save. | Reason beside Save | 40 | same | - | - |
| `occasions.remind` | Remind me | Switch per day | 24 | Remind me about {name} | Per-day off, plus the existing master stop | - |
| `occasions.remove` | Remove this day | Row action | 22 | Remove {name} | - | - |
| `occasions.removeToast` | Day removed. | Toast, with Undo | 32 | Day removed. Undo available. | - | - |
| `occasions.lock.day.title` | Show the day's name on the lock screen | Switch, off by default; visible once a day exists | 48 | same | Counsel CB-23 | COUNSEL-READ |
| `occasions.lock.day.help` | Off, the reminder says nothing about the day. | Under the switch | 60 | same | Calm: no mention of who might see a phone | COUNSEL-READ |
| `occasions.preview.label` | On the lock screen it will say | Above the live preview of the real words | 40 | On the lock screen it will say: then the preview | The preview is the Shown line for the `occasions` act. The preview uses the real `notif.occasion.*` key | - |
| `occasions.consent.line` | Days you add are kept on this phone. Reminders say nothing about your photos. | Once, above the first Save | 100 | same | Records the `occasions` act (document, version, action, hash of these words). "Kept on this phone" does not say "only" | COUNSEL-READ |
| `occasions.denied` | Notifications are off for {app}, so the day shows on Tonight instead. | When notifications are denied | 100 | same | With an Open Settings button; the days are still saved | - |
| `occasions.ask.title` | Days you want a reminder for? | Optional one-time ask card | 40 | same | Offered at most once, last in the ask order, never in a session that already showed an ask. No named day | - |
| `occasions.ask.body` | Add a birthday or any day that matters to you, and {app} will send a quiet reminder. Or add none. | Ask card body | 120 | same | - | - |
| `occasions.ask.add` | Add a day | Ask card, primary | 22 | same | - | - |
| `occasions.ask.notNow` | Not now | Ask card, equal button | 22 | same | Holds forever; Settings is the only door | - |

The notification question (iOS) is the existing reminder ask. If notifications are already allowed nothing new is asked. This file writes no new notification-permission copy.

### 7.2 Local notification bodies (fixed keys)

One fixed set, chosen when the reminder is scheduled, by the typed day's own id and nothing else. Nothing is derived from the library, a photo, a place, a count or the number of reads. Inside the 110 and 40 character limits the lint holds. There is no exclamation mark (the notification budget is zero). Invite, never remind: no "don't forget", no "waiting", no "still", no "missed", no "you have not", no number of days.

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `notif.occasion.title` | {app} | Title of every reminder | 40 | same | The existing reminders' pattern; no child name, no day name | COUNSEL-READ |
| `notif.occasion.body.1` | A few words, whenever you like. | Body; default set | 110 | same | From CMO's candidates | COUNSEL-READ |
| `notif.occasion.body.2` | Today is a day you chose. A few words about it? | Body; default set | 110 | same | "A few words" is the parent's, spoken or typed. The app supplies none | COUNSEL-READ |
| `notif.occasion.body.3` | A day you chose is here. Add a letter if you like. | Body; default set | 110 | same | Echoes the privacy analysis example | COUNSEL-READ |
| `notif.occasion.body.4` | A minute for a letter today? | Body; default set | 110 | same | The VOICE.md notification shape | COUNSEL-READ |
| `notif.occasion.withChild` | A few words for {child} today? | Body, only if "Show {child}'s name on the lock screen" is on | 110 | same | The existing names switch, off by default | COUNSEL-READ |
| `notif.occasion.withDay` | {name} today. A few words about it? | Body, only if the day-name switch is on | 110 | same | The typed name, never a list name | COUNSEL-READ |
| `notif.occasion.withBoth` | {name} today. A few words for {child}? | Body, both switches on | 110 | same | - | COUNSEL-READ |
| `inApp.today.named` | Today is {name}. Tell a letter about it? | Line above the prompt on Tonight after a tap, or when notifications are off | 80 | same | In the app the name is fine; the lock screen is the concern | - |
| `inApp.today.generic` | A day you chose. Tell a letter about it? | Same, when the name is not to be shown | 80 | same | - | - |

Scheduling rules the strings depend on (not strings): nothing between 21:30 and 07:00 (the existing quiet window, unchanged; remote config may only narrow it); the parent picks the time, default evening (a hypothesis for the diary study); at most one occasion reminder a day, taking the slot of the evening reminder and counting against the one shared cap (R61); at most 60 of the system's 64 pending; passive interruption level if the SDK supports it, never time-sensitive; the reminders master stop also stops these (R29).

## 8. States: denied, offline, Low Power, background refresh off, empty, error

"Quiet" means no message, no badge, no banner. The words live in the keys named.

| State | Ledger | When it checks | Tonight card | Shelf | Words |
|---|---|---|---|---|---|
| Never asked | Master off; access "Not asked yet" | Not reachable | None | Absent | `access.value.notAsked`, `access.notAsked.line`, `ledger.master.off` |
| Empty (allowed, nothing found) | "Nothing is kept yet." | Normal | None | Absent | `ledger.onPhone.empty` |
| Allowed, all | Normal | Normal | Works | Works | `access.all.line` |
| Limited | "Chosen photos", Choose more, one line | Caveat | Over the chosen set; the card says nothing about what it cannot see | Over the chosen set | `access.chosen.line`, `access.chosen.more`, `cadence.limited.caveat` |
| Denied | Reason and Open Settings | Page replaced by the denied line | None | Absent | `access.off.line`, `access.off.reason`, `access.off.button` |
| Offline | Normal; quiet | Normal; quiet | Normal | Normal | None for the feature. The only offline words are in 10.1 for iCloud originals |
| Low Power Mode | Normal | Status line | Last list | Last list | `cadence.status.lowPower.on` |
| Background App Refresh off | Normal | Status line and Open Settings | Works from the check at open | Works | `cadence.status.bar.off`, `cadence.status.bar.button` |
| App not opened for days | Last checked shows the true time | No new rows | Last list; old days expire after 30 days | Same | `ledger.lastChecked.value`. Never "N days ago" |
| Switch off | "Off. Nothing is read." | Not reachable | None | Absent | `ledger.master.off` |
| Access later revoked | List cleared; one line | Replaced | None | Absent | `access.changed.cleared` |
| Notifications denied (reminder days) | Not affected | Not affected | The day shows on Tonight | Not affected | `occasions.denied` |
| Error: Forget fails | One error line under the row | - | - | - | `forget.error` |
| Error: iOS returns no answer | One error line where the parent came from | - | - | - | `access.error` |
| Error: the chooser cannot open | The chooser shows its own error; the card is removed | - | - | - | `chooser.error` (section 10) |

## 9. How a suggestion becomes a letter with no words supplied by the app

The path, step by step, and the rule on each step (CS-S15; NX-39-R19). No line below is written by the app, and no string below proposes words for the parent.

1. The parent taps "Tell a letter about it" on the card (`card.primary`), or a date chip on the shelf (`shelf.chip`).
2. The chooser opens scoped to that day. Nothing is pre-selected. The heading is the date (`shelf.scoped`), and the place only if the Places switch is on (`shelf.scoped.place`).
3. The parent taps the pictures they want. The capture screen opens, Speak or Type, unchanged. No seeded text. No title. No suggested first line. No date or place inserted. The standard prompt behaviour is untouched and this feature adds no prompt.
4. In Review the pictures sit below the parent's words. The date and place line shows to the parent only, under the label "From the photo". There is no "Use in my letter" button, because it would write for the parent.
5. The letter is kept only with the parent's words. If the parent leaves without words, the pictures are dropped. One line says when the pictures join the book.
6. The letter keeps its own captured date. A separate "this letter is about" date is an open question for `product` (design Q-D2) and would be an editable chip the parent confirms, never text.
7. Test (R19): the letter's words are byte-identical before and after attaching media and before and after a suggestion was tapped. The app never names the event: no "trip", "birthday", "outing", no caption, no emotion word, no title.

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `attach.heading` | Photos and videos | Section heading in Review | 24 | same, heading | - | - |
| `attach.keepNote` | The photos are added to your book when you keep the letter. | Under the strip, only for a letter started from a day | 80 | same | Tells the parent that nothing is saved without words, and writes none | - |

## 10. Lines carried over from #746, passed through the rules

These are the chooser and attach lines that sit beside the permission screens. They are the #746 placeholders, reworded where a rule needed it, and given keys under `memoryLibrary.`. The numbers follow the one table in NX-39 v2 section 6 (5 items per letter, 2 videos at most), not #746's 8.

### 10.1 Chooser, attach, iCloud and video

| Key | String | State | Max | VoiceOver | Notes | Flag |
|---|---|---|---|---|---|---|
| `chooser.title` | Add photos or videos | Chooser header | 32 | same, heading | - | - |
| `chooser.add` | Add | Primary button; the count joins when items are chosen | 22 | Add {count} | "Add 3" counts the parent's own selection, not a gap | - |
| `chooser.clear` | Clear | Quiet button | 22 | same | - | - |
| `chooser.addNeed` | Choose one or more to add. | Reason beside a disabled Add | 40 | same | - | - |
| `chooser.empty` | There are no photos or videos here yet. | Empty chooser | 60 | same | No call to action | - |
| `chooser.empty.videos` | There are no videos here. | Empty, Videos filter | 40 | same | - | - |
| `chooser.error` | Your photos could not be opened. Try again. | Error line | 60 | same | The letter and its words are untouched | - |
| `chooser.tryAgain` | Try again | Button | 22 | same | - | - |
| `cap.near` | A letter holds up to {n}. | Footnote as the limit nears | 40 | same | Not a countdown; nothing turns red | - |
| `cap.reached` | That is the most one letter holds. To add another, take one off. | Footnote at the limit | 80 | same | - | - |
| `attach.failed` | One photo could not be added. Try another. | Under the strip | 60 | same | The rest stay | - |
| `cloud.getting` | Getting {count} from iCloud | Footer during an on-demand download | 40 | same | With a Stop button; never in bulk | - |
| `cloud.stop` | Stop | Button | 22 | Stop getting photos from iCloud | - | - |
| `cloud.offline` | These photos are in iCloud, and this phone is offline. Try again when you are connected. | iCloud-only item, offline | 120 | same | - | - |
| `video.tooLong` | That video is longer than a letter can hold. Choose a shorter one. | After Add | 80 | same | P3 only | - |
| `video.failed` | That video could not be played. | Viewer error | 40 | same | P3 only | - |
| `tile.missing` | This file is not on this phone. | A tile whose kept file is gone | 48 | same | Replaces "Not on this phone any more", which reads as a loss | - |

## 11. The candidate promise wordings, side by side (FOR COUNSEL, none chosen)

Source: NX-39 v2 section 5.1 and council record section 5. The words are verbatim, including "Early Letters", which would be `{app}` in a string. None is live. None has been run through `rules.test.ts`; I applied its rules by hand and show the result. The backup-aware qualifier is required in every candidate (council T7). The reading grade is a Flesch-Kincaid estimate from a heuristic syllable counter in my own script. It ranks the candidates against each other and is not a standard measure; I did not test any of them with a parent.

| | PW-A | PW-B | PW-C | PW-D |
|---|---|---|---|---|
| Wording (verbatim) | "Put the photo beside the words you said. Early Letters shows when it was taken, and the photo stays with your letter, on your phone and in your iPhone's own backup if you use one." | "We do not receive your photos, videos, or when and where they were taken." | "Photos and videos you add stay on this phone, in your book, and in your iPhone's own backup if you use one." | "You choose what Early Letters can see. It reads only the dates of the photos you allow, it never looks inside them, and the words are always yours." |
| Source | CMO A | CLO; CMO C | Privacy analysis 9.1 row 18 | CMO B, "places" removed |
| Where it could appear | P0 and P1 | P1, and P2 beside the sheet | P0 and P1 | P2a and later, as the control line |
| Words, sentences | 35, 2 | 14, 1 | 22, 1 | 28, 2 |
| Reading grade (estimate) | 6.1 | 5.0 | 6.9 | 5.0 |
| Plain-language note | Two clear sentences. The second runs long and holds three ideas (stays with the letter, on the phone, in the backup). "Beside the words you said" is concrete. The iPhone-backup clause is the hardest phrase | The shortest and the plainest. "Receive" is a verb parents may read as "see". It is a claim about the company, so it is the one that most needs a counsel-approved verb | Plain but it is a list of three places in one sentence. "Stay on this phone" followed by "and in your backup" can sound contradictory on a first read | Plain, and the only one that speaks about control. "Never looks inside" is a strong claim and needs the scan proof |
| What it claims | The date shows; the photo stays with the letter; it is in the iPhone's own backup if the parent uses one | The company does not receive the photos, videos or when and where | The photos and videos are in three places, none of them the company | The parent chooses the access; only dates are read; never the content; the words are the parent's |
| Needs before it can be said | BL-843 (the picked file carries the date). Drop "when it was taken" if it does not | Counsel on the verb and the label answer. The edge of print, export and iCloud download beside the claim, not behind a link | The same as PW-B. Also F9 (videos are out of iPhone backup under the recommended stance, so "videos" does not take the backup clause) | R9 scan proof; the place question settled (Places has its own switch); counsel on "never looks inside" |
| Hits in my hand check | None | Contains "We". The rules test allows "we" only in the sanctioned promises, so it would need an explicit allowance in the P0 rule if chosen | The phrase "stay on this phone" is caught by the P0 rule that blocks claims that letters stay on the phone. A chosen PW-C would need an allowance or a rewording. R1 also fails "stay on your phone" on any surface without a registry row | None. "Only" is outside the card rule |
| Mark | FOR COUNSEL | FOR COUNSEL | FOR COUNSEL | FOR COUNSEL |

A finding for the founder and counsel, not a recommendation: PW-B and PW-D can be shown together because they answer different questions (what the company receives, and what the parent controls). PW-A and PW-C say where the photo is, and both carry the backup clause, which is the part most likely to be misread.

## 12. The claims ledger

Each trust sentence, the capability that makes it true, and the earliest phase where it can be said. The website and store copy cannot say a sentence before its row is true. A sentence is true only when its phase switch is on in `production` and its proof is green (NX-39-R1, R55). "Not before" means the sentence is held out of every public surface and every in-app surface until then. All sentences are candidates, not chosen.

| # | Trust sentence (candidate) | Where it appears | Capability that makes it true | Proof | Becomes true | Counsel |
|---|---|---|---|---|---|---|
| 1 | Add a photo from Apple's own sheet. {app} asks for no access to do it | Add button area, store | Picker route, no library authorization call | R2 | P0 | Label answer on NX-33 |
| 2 | The photo is copied into your book | P0 line | Stored copy in the book | NX-33 | P0 | - |
| 3 | ...on this phone and in your iPhone's own backup if you use one | Every where-line | The book folder is in iPhone backup (photos in; videos out by default, F9) | F9 decision; R43 flags | P0 for photos; P3 for video, with different words | COUNSEL-READ |
| 4 | {app} shows the date the photo was taken | PW-A, chip line | The picked file carries the date without a prompt | BL-843 spike, R5 | P1, if BL-843 passes | COUNSEL-READ |
| 5 | A town name from a list kept in the app | Places row | Bundled table, no network call | BL-844, R7 | P1 city; P2b Places | COUNSEL-READ |
| 6 | You choose what {app} can see | Sheet, PW-D | Access level honoured: all, chosen, none | R3, R11 | P2a | COUNSEL-READ |
| 7 | It reads the date each photo was taken | Sheet, ledger | Date-only adapter | R9 | P1 for picked; P2a for chooser | COUNSEL-READ |
| 8 | It never looks at what is in a photo or who is in it | `ask.never`, ledger | No analysis API; AST scan with positive controls | R9 | P2a, only once R9 is running | COUNSEL-READ |
| 9 | It never writes anything for you | Ledger, store | Constitution; words byte-identical | R19 | P0 | - |
| 10 | It reads when you open {app} | `ask.days.when.open` | One catch-up per foreground session | R45 | P2b | COUNSEL-READ |
| 11 | It may also check while {app} is closed, when your iPhone allows | `ask.days.when.background`, `cadence.bg.*` | Background task, flag on, own consent | R46, BL-871, BL-872, counsel ruling on `UIBackgroundModes`, founder ruling on S6 | P2c, possibly never | COUNSEL-READ |
| 12 | Your iPhone decides when, and it may not check at all | `bg.when` | True of iOS | Apple sources, design spec section 11 | With line 11 | COUNSEL-READ |
| 13 | The list of days is kept on this phone | Sheet, ledger | Moments rows only on the phone; backup flag set again | R40, R43 | P2b | COUNSEL-READ |
| 14 | {app} does not receive the list (or your photos, or when and where) | `ask.days.where`, PW-B | No sync field, no upload, no analytics property, no log | R30 canary, R33, R54 | P2b, once the canary runs | COUNSEL-READ |
| 15 | Off in one tap. Nothing is read when it is off | `ledger.master.off` | Switch gates every read | R18, R49 | P2b | COUNSEL-READ |
| 16 | Forget removes the list; your photos, letters and hidden choices are not touched | `forget.row.desc` | Forget deletes the index, keeps decisions | R41, R49 | P2b | COUNSEL-READ |
| 17 | Erase everything also clears the list, hidden choices and reminder days | `erase.mediaLine` | Every erase path includes the new stores and sidecars | R31 | P2b (list); P4a (reminder days) | COUNSEL-READ |
| 18 | A reminder never contains anything from your photos | `surfaces.footer`, `ledger.never.4` | No library-derived notification exists | R26, R27 | P2b and P4a | COUNSEL-READ |
| 19 | Reminders stay quiet from 9:30 PM to 7 AM | Settings | Quiet window rule | Existing tested rule | P4a | - |
| 20 | {app} adds no days for you | `occasions.intro` | No shipped list; typed only | R25 | P4a | COUNSEL-READ |
| 21 | The name stays in the app; the lock screen shows it only if you turn that on | `occasions.name.help` | Fixed body keys; day-name switch off by default | R26 | P4a | COUNSEL-READ |
| 22 | Your photos stay in your Photos app | `ask.chooser.where` | Originals never touched | R14 | P2a | COUNSEL-READ |
| 23 | Photos in your export have no location | Export screen | Export carries the stored stripped copy only | R32, BL-868 | With the export fix | COUNSEL-READ |
| 24 | Extension of the existing promise to photos and videos | `en.trust.promise` (not changed here) | The promise today names "letters and recordings" only | Privacy analysis row 16 | P0 | COUNSEL-READ |

Sentences that must never be said, with the reason: "stays on your phone" or "nothing leaves your phone" (backup, iCloud download and export contradict them); "never read in the background" once P2c exists; "the rest of your library is not read" once P2a exists; any frequency or freshness ("a few times a day", "every day", "up to date", "2 to 3 times"); "found", "noticed", "knows"; "we do not collect your location" until counsel answers CB-10 and CB-11.

## 13. Hold list for the website and the store

From the CMO critique, kept here so the words and the claims stay in step. Until the matching row in section 12 is true, none of this appears in the store listing, What's New, the screenshots, the website or a share preview: photos, videos, dates, places, "on this day", "a year ago", "your library", "suggestions", "travel", "trips", "holidays", "festivals", "occasions"; any reading frequency; "Works with" any Apple feature; "Apple-verified privacy"; any photo count; any named competitor. P0 and P1 are the first release worth one plain line, P2 gets no store copy, and P4a gets one plain line: "Choose the days you want a reminder for." Marketing owns the store plan; this file only fixes what may be said.

## 14. Three pre-sheet variants for the BL-857 comprehension study (L1, limited photos)

The sheet that comes before the parent chooses which photos {app} can see. Each variant has the same facts, so the study measures wording and not content: what it reads (dates), what it never does, when, and where the list lives. Same two buttons in each. All three are COUNSEL-READ and none is a production string: the keys start `study.l1.` and are not ported unless the study picks one.

### 14.1 The three variants

| Key | String | Variant | Max | Notes | Flag |
|---|---|---|---|---|---|
| `study.l1.plain.title` | Choose which photos {app} can see | Plain | 40 | A command, no question | COUNSEL-READ |
| `study.l1.plain.reads` | {app} reads the date of each photo and video you choose, so it can show you the days that have pictures. | Plain | 140 | - | COUNSEL-READ |
| `study.l1.plain.never` | It never looks at what is in a photo or who is in it. It never writes anything for you. | Plain | 120 | - | COUNSEL-READ |
| `study.l1.plain.whenWhere` | It reads when you open {app}. The list of days is kept on this phone, and you can clear it in Settings. | Plain | 140 | Uses the controls form of "where", not "does not receive" | COUNSEL-READ |
| `study.l1.plain.next` | Next, your iPhone asks you. You can choose only some of your photos. | Plain | 110 | - | - |
| `study.l1.warm.title` | Which photos can {app} see? | Warm | 40 | A question in the parent's own voice | COUNSEL-READ |
| `study.l1.warm.reads` | You pick which photos {app} can see, and you can change your mind any time. | Warm | 140 | Leads with control | COUNSEL-READ |
| `study.l1.warm.purpose` | It reads their dates, so a day with pictures is easy to find when you want to write a letter. | Warm | 140 | "Write a letter" is the parent's act | COUNSEL-READ |
| `study.l1.warm.never` | It never looks inside a photo, and the words are always yours. | Warm | 120 | - | COUNSEL-READ |
| `study.l1.warm.next` | Next, your iPhone asks you. Choosing only some photos works too. | Warm | 110 | - | - |
| `study.l1.minimal.title` | Find photos by their day? | Minimal | 40 | - | COUNSEL-READ |
| `study.l1.minimal.reads` | {app} reads the dates of the photos you choose, and nothing inside them. | Minimal | 140 | - | COUNSEL-READ |
| `study.l1.minimal.change` | You can change this in Settings. | Minimal | 60 | Holds no "where" statement; the comprehension question on "what is sent to us" will show whether that is too little | - |
| `study.l1.minimal.next` | Next, your iPhone asks you. | Minimal | 110 | - | - |

Shared buttons: `ask.continue` and `ask.notNow`, equal in size, weight and type, with no Close glyph.

### 14.2 What differs, so the study reads the right thing

| | Plain | Warm | Minimal |
|---|---|---|---|
| Facts stated | What, never, when, where, how to clear | What, never, how to change; no when; no where | What, how to change |
| Words (about) | 82 | 64 | 29 |
| Reading grade (estimate, heuristic) | 2.8 | 3.6 | 1.5 |
| Likely risk | Longest; more to read in the five seconds CMO-5 allows | The "where" and "when" are missing, so a parent may assume more is read | The shortest; may be read as hiding something. It does not say where the list lives |
| What it tests | Whether the full set of facts is understood | Whether warmth lifts comfort without lowering comprehension | Whether less is clearer, or only less |

The grade figures are a heuristic and are low because the titles carry no full stop and the sentences are short; they rank the three and say nothing more. The persuasion check (NX-39 section 12) applies: if the warm variant raises "I would say yes" by 3 or more of 10 without raising comprehension, the plain one ships.

### 14.3 Comprehension questions and the answers fixed in advance

Proposed for `user-research` to confirm, written before any data (BL-857). Proposed correct answers for this sheet:

| Question | Correct answer for all three |
|---|---|
| After you say yes, what can {app} see? | The photos I choose, and their dates |
| What can it not do? | Look inside a photo, or write for me (all but Minimal say both; Minimal says "nothing inside them") |
| What is sent to us? | Nothing about the photos or their dates is sent. (Plain and Warm support this. Minimal does not say it, by design; a wrong answer there is a finding, not a failure) |
| How do you stop it? | In Settings |

"What is sent to us" is the sharp question: the research lens's own bar is that fewer than 6 of 10 correct means the design is not honest enough whatever the comfort score. Note that a correct answer to the third question depends on the "does not receive" form (PW-B) being true; if counsel rejects it, the answer set changes.

### 14.4 One more test the study can run

Whether "check" or "look" reads better in the ledger and the recent-checks list (assumption 3 in section 0). Two versions of `ledger.lastChecked.label` ("Last checked" and "Last looked"). It is a one-line swap and needs no other change.

## 15. The door lines, per layer (COORDINATION section 10, PRIV-R21)

Shown is by key. Records follows the PRIV-R21 function: document, version, action, method, surface, phone time, app version and build, OS major, platform, language, the hash of the words shown, and the access level iOS reports, with no media fact. Never is the PRIV-R21 never-list plus the media items. Decline and withdraw says what No does, and that export and deletion still work (PRIV-R09).

| Layer | Shown | Records | Never | Decline and withdraw |
|---|---|---|---|---|
| 0. Picker, first add of a picture the parent did not make | `attach.firstAddNotice` | Version and time only | Any media fact | Cancel adds nothing |
| 1. Chooser, `media_read` | `ask.title.chooser`, `ask.chooser.reads`, `ask.never`, `ask.chooser.when`, `ask.chooser.where`, `ask.next`, the plist string (section 3) | The act with the hash of those words; the access level; Not now | A date, place, count or id; the library's contents | Not now holds; Off in one tap; Forget; export and erase still work |
| 2. Find days, `media_read` | `ask.title.days`, `ask.days.*`, `ask.never`, `ask.next`, `ledger.master.on` | The same | The same | The same, and Stop these |
| 3. Background, `media_background` | `bg.*`, `cadence.bg.*`, `ledger.master.on.bg` | The same, own act | The same; a check reported to analytics beyond a content-free event; a notification | Row off; cancels requests; clears the cursor and the log; iOS turning Background App Refresh off removes nothing |
| 4. Reminder days, `occasions` | `occasions.consent.line`, `occasions.intro`, `occasions.preview.label` with the real body, `occasions.name.help` | The same, own act | A named festival, a place, a photo, a count in a reminder | Per-day off; master stop; Erase |

## 16. Checks I ran, and what I could not check

I ran a Node script of my own (not vitest). It lives in the session scratchpad and is not committed. It reads this file and (1) scans every character for em and en dashes, curly quotes, the ellipsis character and emoji; (2) pulls every string out of the seven-column tables and applies the content rules to it: the fear and loss list, the AI-writing list, the gendered-word list, the child-gender list, the internal-terms list, the glossary bans, "we" and "our", the exclamation mark, the trip and festival words, the card-only list, the on-device claim list, unknown placeholders, the 22-character button limit, the notification 40 and 110 limits, and each string's own stated Max; (3) confirms every placeholder is on the rules test list; and (4) counts the strings and the COUNSEL-READ rows. The result is in the hand-back and in section 17.

What I could not check, in plain terms:

1. I did not run `rules.test.ts`. I read it and applied its regular expressions by script. A rule I misread, or a path-based rule (for example the "we" rule that depends on which keys a pass touched), would show only when the strings are ported.
2. I did not check the strings against the live `packages/content` tree for key clashes, and I did not check that `{app}` is accepted in a notification title by the existing lint.
3. I did not render any string on a device. Lengths are character counts, not points; Dynamic Type to AX5, wrapping and the VoiceOver phrasing are for `design-systems` and `qa`.
4. No parent has read any of this. The reading grades are a heuristic, not a standard tool. The comprehension claims in section 14 are a plan.
5. Nothing about iOS, the Photos alert, Background App Refresh, Low Power Mode or App Review was re-read. Every such statement repeats the design spec or NX-39 and keeps its UNVERIFIED tag.
6. I did not read the wireframes HTML, the ADR (#745) or the benchmark (#749), and I read #748 by search and in part.
7. I am not a lawyer. Every COUNSEL-READ mark is a request to have the words read, not a legal view.

## 17. Counts and the COUNSEL-READ list

Generated by the script from the tables in this file; see the hand-back for the figures at the head named there. The list below is the same list in plain words, grouped by surface. Every one is a request for counsel and the founder to read the exact words.

Totals: 232 string rows (232 unique keys) in tables with keys; 63 marked COUNSEL-READ. Six purpose-string candidates PS-1 to PS-6 (all COUNSEL-READ) in section 3 and the PW-A to PW-D candidates in section 11 are not counted as strings; the study rows in section 14 are counted above and are not production keys.

- 2.1 Layer 0: the picker (P0 and P1): `attach.firstAddNotice`, `note.line`
- 2.2 Layer 1: the library chooser on tap (P2a): `ask.chooser.reads`, `ask.never`, `ask.chooser.when`, `ask.chooser.where`
- 2.3 Layer 2: Find days (P2b): `ask.days.reads`, `ask.days.when.open`, `ask.days.when.background`, `ask.days.where`, `ask.days.where.alt`
- 2.4 Follow-ups to the iOS answer (Allow all, Select Photos, Don't Allow, and later changes): `access.changed.cleared`
- 2.5 Layer 3: the background top-up consent (P2c): `bg.reads`, `bg.when`, `bg.shows`, `bg.off`
- 4.2 Master row, access, switches: `ledger.master.on`, `ledger.master.on.bg`, `ledger.master.off`, `ledger.dates.lets`, `ledger.dates.doesNot`, `ledger.places.lets`, `ledger.places.doesNot`, `ledger.places.shown`
- 4.3 When it checks, the status block and the recent checks: `cadence.open.desc`, `cadence.bg.desc`, `cadence.status.bar.off`, `cadence.status.lowPower.on`
- 4.4 What is kept, and what is never done: `ledger.onPhone.row`, `ledger.never.1`, `ledger.never.2`, `ledger.never.4`, `ledger.never.5`
- 5.3 Where it shows (CS-S8): `surfaces.tonight.desc`, `surfaces.footer`
- 6.1 Hide controls (CS-S12): `hide.stretch.help`
- 6.2 Hidden choices (CS-S12c): `hidden.clear.body`
- 6.3 Forget the list (CS-S13): `forget.row.desc`, `forget.confirm.body`
- 6.4 Erase everything: `erase.mediaLine`
- 7.1 The reminder days screen: `occasions.intro`, `occasions.name.help`, `occasions.lock.day.title`, `occasions.lock.day.help`, `occasions.consent.line`
- 7.2 Local notification bodies (fixed keys): `notif.occasion.title`, `notif.occasion.body.1`, `notif.occasion.body.2`, `notif.occasion.body.3`, `notif.occasion.body.4`, `notif.occasion.withChild`, `notif.occasion.withDay`, `notif.occasion.withBoth`
- 14.1 The three variants: `study.l1.plain.title`, `study.l1.plain.reads`, `study.l1.plain.never`, `study.l1.plain.whenWhere`, `study.l1.warm.title`, `study.l1.warm.reads`, `study.l1.warm.purpose`, `study.l1.warm.never`, `study.l1.minimal.title`, `study.l1.minimal.reads`

## 18. Open questions for the founder

1. **The section name** (NX-39 F14). "Photos and days" is my recommendation; "Photos and dates" is the second choice. Which?
2. **"Check" or "look".** I used "check" for one read of the dates because the design spec warns "look" may sound like surveillance. You used "look". Which word do parents see? Section 14.4 can test it.
3. **The Find days switch when access already exists.** If a parent allowed access for the chooser (layer 1) and then turns on Find days, no sheet opens in this draft; the sentence under the switch is the Shown line. Does that need its own act and its own sheet (privacy and counsel CB-4), or is the layer 1 act enough?
4. **The "where" line.** Pick one for the days sheet: "does not receive it" (PW-B family; a claim about the company) or the controls-only line (`ask.days.where.alt`). Counsel's answer on the verb comes first.
5. **Which promise candidate** (PW-A to PW-D). None is chosen here. NX-39 F4 recommends PW-A for the first release and PW-D when P2a is on. PW-C's phrase "stay on this phone" is untrue with iPhone backup unless the backup clause sits beside it.
6. **Videos and the backup clause.** Under the recommended stance (F9), photos are in iPhone backup and videos are out. Then the P3 "where" line cannot carry the same clause as the photo line. Do you confirm F9?
7. **Places.** The Places switch exists only if the offline table passes BL-844 and the picked file carries a place (BL-843). Until then every place line is held. Do you want place at all in the first release, given the council's date-only direction for cards?
8. **The multi-day card.** It never says "away", "trip" or "days away", because NX-39 R15 says away is never defined. If you want "days away" as the parent's own phrase, it can only be a switch name the parent reads, not a claim the card makes. Confirm.
9. **Reminder days examples.** The intro offers "a birthday or an anniversary" as examples. They are not a list and name no religious day. Do you want even those examples, given CB-21 is not answered?
10. **A confirm on Forget.** The default is one tap, no dialog. If privacy wants a confirm, `forget.confirm.*` is ready and has one button plus Cancel.
11. **Comfort of the notification set.** Four generic bodies and three named ones are proposed. Are four enough to avoid repeating the same line, given the shared cap is one number you set (F6)?
12. **The study.** Do you approve BL-857 with these three variants (F3)? The council recommends that someone other than the founder runs the permission sessions (F3).

## 19. Changes needed elsewhere (this file edits none of them)

| Where | What | Who |
|---|---|---|
| `packages/content/test/rules.test.ts` placeholder list | None needed: the strings use only allowed placeholders. If engineering prefers `{place}` or `{day}`, that is a test change and is the engineering agent's call, not a way round a rule | engineering |
| `packages/content/test/claims-capabilities.test.ts` | Add the `memoryLibrary` subtree to the read set, and the frequency, "stays on your phone", "never read" and "waiting" patterns (NX-39-R55, CMO-1, CMO-7) | engineering |
| `permissions.en.ts` microphone string | It carries "Your recordings stay on this phone", a promise inside a purpose string, which the privacy analysis (finding 11) calls wrong and the labels doc 1.4.0 section 5 said was dropped. Not changed here; for the founder | founder, `legal` |
| `strings.en.ts` trust promise | Names "letters and recordings"; needs photos and videos once P0 ships (privacy analysis row 16). Not written here: it is the one promise sentence word for word in many places | counsel, founder |
| `BRAND.md` glossary | Add the words in 1.1 in the PR that ports the strings | `content` |
| Erase everything, Delete account | Add `erase.mediaLine` | engineering |
| VOICE.md | The notification section already covers the bodies in 7.2. One addition worth making: a line that library-derived nudges do not exist | `content` |

Signed: Content lead (Claude role).
