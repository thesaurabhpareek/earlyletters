# NS-13 to NS-20: Capture (more letters kept, in the few minutes a parent has)

Status: Draft v1, 19 Nov 2026. Author: Karma with the Chief Product Officer role (one Claude session). Docs only. Shape of a card: `README.md`. Sizes, skills and order: `13-engineering-plan.md`. Test cases: `14-test-plan.md`.
Words in quotes that are not an existing content key are intent for `content`, never final copy. PROPOSED marks a proposal. Nothing was run on a phone.
Job served: "Let me capture it in the few minutes I have" (rank 2) and "Tell me what to write about, without nagging" (rank 5).

Rule for every card here: only Home starts a letter. Capture is never blocked by payment. Nothing counts what a parent did not do.

---

## NS-13. Reminders that help and then step back (candidate C-05, rank 5)

**Who and when.** P1 at the hour they chose, usually after bedtime, phone face down beside them. And P1 three weeks later, who has not opened the app and must not be made to feel behind.

**Why.** A parent who means to keep letters forgets. A reminder at the right hour is the difference between twelve letters a year and sixty (HYPOTHESIS). Reminders are built; they have never been proven on a real phone across a time-zone change, a season change, or a week of silence. A reminder that repeats itself, fires at 3 a.m. after a flight, or keeps knocking is worse than none: it teaches the parent to turn notifications off for good.

**What.** Prove on a phone what is built, and hold four behaviours as requirements: the parent chooses the hour and days; a reminder never shows the same words twice in a row; reminders back off when unanswered and never mention the gap; a reminder never shows {child}'s name or any letter words unless the parent chose that.

**Happy path.**
1. After keeping a first letter, the parent is offered reminders once, with the system permission asked only if they say yes.
2. They pick an hour and days. The default is evenings (existing design).
3. At that hour a quiet notification arrives with a prompt. Tapping it opens Home with that prompt ready; one more tap starts speaking.
4. They keep a letter. Tomorrow's reminder has different words.

**Unhappy paths.**

| Case | What happens |
|---|---|
| Permission declined | No reminders, no second ask from us. Me shows how to turn them on in one sentence |
| The parent ignores reminders for 7 days (PROPOSED) | Reminders drop to once a week; after 4 more unanswered weeks they stop. No "we miss you", no count, no last-chance line |
| Travel across time zones | The reminder follows local time at the next scheduling; never fires between 21:30 and 07:00 local unless the parent chose that hour |
| Clock change in spring or autumn | The chosen hour holds |
| Two books | One reminder, not one per child |
| A child with only a due date (P3) | Prompts never mention a due date or count days to it |
| A letter was already kept today | No reminder today |
| Notification arrives on a lock screen | No child name, no letter words by default |
| Reminders off, then on again | Back-off state resets |

**Acceptance.**

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-13-R1 | Given reminders on at a chosen hour, When that hour comes on a chosen day and no letter was kept today, Then exactly 1 notification is delivered within 5 minutes of the hour (device) | `[NS-13-R1] one reminder at the chosen hour` |
| NS-13-R2 | Given two consecutive reminders, Then their body text differs | `[NS-13-R2] never the same words twice running` |
| NS-13-R3 | Given 7 days of reminders with no letter kept (PROPOSED), Then the next reminders are at most 1 per 7 days | `[NS-13-R3] unanswered reminders back off` |
| NS-13-R4 | Given 4 further unanswered weekly reminders (PROPOSED), Then no reminder is scheduled until the parent keeps a letter or turns reminders on again | `[NS-13-R4] reminders stop on their own` |
| NS-13-R5 | Given any reminder string, Then it contains no number of days, no count, and none of: miss, behind, forgot, streak, last chance | content rules test |
| NS-13-R6 | Given the default settings, Then no reminder contains the child's name or letter text | `[NS-13-R6] lock screen shows no name by default` |
| NS-13-R7 | Given the phone's time zone changes, Then the next reminder fires at the chosen hour in the new zone and none fires in the hours it skipped (device) | `[NS-13-R7] the hour follows the parent` |
| NS-13-R8 | Given a letter kept today, Then today's pending reminder is cancelled | `[NS-13-R8] no reminder after a kept letter` |
| NS-13-R9 | Given a tap on a reminder, Then Home opens with that prompt shown within 2 seconds on an iPhone SE 3 (device) | `[NS-13-R9] the reminder lands on its prompt` |
| NS-13-R10 | Given a child with a due date only, Then no reminder string refers to the due date | `[NS-13-R10] nothing about a due date` |

**Design inputs.** The one ask after the first kept letter: a sheet, one sentence, two equal choices; never a full-screen takeover. The settings screen exists. Back-off is invisible: no screen says reminders slowed down. At the largest text size the hour picker and day chips stack.
**Content inputs.** A pool of prompts large enough that R2 holds for a year at the lowest frequency. Tone: an invitation, never a duty. Uses the 111 prompts where they fit a notification length. The founder approves any new line.
**Legal, privacy, compliance inputs.** Local notifications only; nothing is sent to a server to deliver them. Apple's rule that notifications must not be required to use the app and must not carry marketing without consent applies (guideline 4.5.4; re-read before submission). The default of no name on the lock screen is a privacy promise and belongs in the claims registry.
**Free or Plus.** Free.
**Measure (by hand).** Testers report: reminders on or off after two weeks, and whether any felt like too much (yes or no). No content.
**Open question.** The back-off numbers 7 days and 4 weeks are proposals. Owner: CPO role with `user-research`, after the first tester notes.

---

## NS-14. Whose book this letter goes to (candidate C-14, rank 19)

**Who and when.** A parent of two, holding the baby, about to speak a letter for the older child.

**Why.** With two books, a new letter goes to whichever child was last open. Home shows that only in the dateline. A letter said to the wrong child is a small heartbreak the parent finds weeks later, and moving it is not offered. Preventing it costs one existing control.

**What.** When the account has two or more books, Home shows the existing child switcher above the dateline. With one book, nothing changes.

**Happy path.** The parent glances at Home, sees the name, taps the other child, and speaks. The letter files into that child's book.

**Unhappy paths.**

| Case | What happens |
|---|---|
| One book | No switcher; no empty space where it would be |
| A nameless book | The existing "Your child" label; never "Child 2" |
| Switch during a waiting draft | The draft stays with the child it was made for; the switcher changes only new letters |
| A third book | The same control; it scrolls if needed |
| VoiceOver | Reads "Letters go to {child}'s book" (intent) and the action to change it |

**Acceptance.**

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-14-R1 | Given 2 or more books, Then Home shows the switcher above the dateline | `[NS-14-R1] two books show the switcher` |
| NS-14-R2 | Given 1 book, Then Home renders no switcher and no gap | `[NS-14-R2] one book shows none` |
| NS-14-R3 | Given a switch, When a letter is then kept, Then it belongs to the chosen book | `[NS-14-R3] the letter files where the parent chose` |
| NS-14-R4 | Given a waiting draft for child A and a switch to child B, Then the draft still belongs to A | `[NS-14-R4] a draft keeps its child` |
| NS-14-R5 | Given the largest text size on an iPhone SE 3, Then the switcher, the dateline and the three capture controls are reachable without overlapping (device) | `[NS-14-R5] Home holds at AX5 with a switcher` |

**Design inputs.** Reuse the Book's switcher exactly. It sits above the dateline, never between the prompt and the capture controls. Capture controls stay in the bottom third.
**Content inputs.** One VoiceOver label. `{child}` only; never gendered.
**Legal, privacy inputs.** None new. A child's name is already on this screen.
**Free or Plus.** Free.

---

## NS-15. A letter for another day (candidate C-07, rank 22)

**Who and when.** P1 on a Sunday, remembering what happened on Thursday. And a parent who installs when the baby is four months old and wants to tell the birth story where it belongs.

**Why.** The book is filed by {child}'s age. A letter about the first week, told in month four, sits in the wrong chapter and the book reads out of order. Parents arriving late are the common case, not the edge (HYPOTHESIS).

**What.** After a letter is made, on Review and on the letter page, the parent can set the day it is about. The book files it by that day. The day it was said is kept and shown.

**The rule that protects the constitution.** The app never reads a date out of the words. "Last Thursday" in a letter changes nothing. Only a date the parent picks moves a letter.

**Happy path.** Speak the letter. On Review, tap the date, pick an earlier day, Keep. The Book shows it in that month, with a line that says when it was said (intent: "About 3 March. Said on 9 June.").

**Unhappy paths.**

| Case | What happens |
|---|---|
| A day before birth | Allowed; it files into Before You |
| A day in the future | Not offered here (that is a sealed letter, NS-06) |
| A day before the earliest sensible date (PROPOSED: 2 years before the due or birth date) | The picker does not go further back |
| The parent changes the day again later | Allowed; both changes are the parent's; the said-on day never changes |
| The other parent's letter | Only its author can change its day |
| Reminders and "one past letter" | Use the about-day |
| Export | Carries both dates |

**Acceptance.**

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-15-R1 | Given Review or the author's letter page, Then the date is a control that opens a date picker | `[NS-15-R1] the author can set the day a letter is about` |
| NS-15-R2 | Given a chosen earlier day, Then the Book files the letter in that day's month chapter | `[NS-15-R2] the book files by the about-day` |
| NS-15-R3 | Given a letter with an about-day different from its said-on day, Then the letter page shows both | `[NS-15-R3] both days are shown` |
| NS-15-R4 | Given any letter text containing a date or weekday, Then no date field changes without the parent's pick | `[NS-15-R4] the app never reads a date from the words` |
| NS-15-R5 | Given a future day, Then the picker does not allow it | `[NS-15-R5] no future day here` |
| NS-15-R6 | Given the export, Then each letter carries both dates | `[NS-15-R6] export has both dates` |
| NS-15-R7 | Given the reader is not the author, Then the date is not a control | `[NS-15-R7] only the author moves a letter` |

**Design inputs.** The dateline on Review becomes tappable, with a visible affordance (not a hidden gesture). The system date picker. The two-date line is the app's small voice, not the letter's serif.
**Content inputs.** One two-date line; one VoiceOver hint. No "backdated", no "late".
**Legal, privacy inputs.** A new field syncs with the letter (the about-day). It is the parent's own data, same class as the letter's date. Data inventory row needed. Importing old voice memos is a different feature with another person's voice in play and is not in this card.
**Free or Plus.** Free. It never changes how letters are counted.

---

## NS-16. Someone else speaks (candidate C-08, rank 29)

**Who and when.** A grandmother visiting for a week, handed the parent's phone: "say something for her".

**Why.** "Let family see the baby grow" is job 6, and the cheapest version of family is the person already in the room. Today a letter spoken by Nani on the parent's phone is signed as the parent.

**What.** On Review, the author can sign this one letter as someone else, by a name they type. The letter shows that name. It is still the account holder's letter in every rule: who can edit it, how it is counted, where it is stored.

**Unhappy paths.**

| Case | What happens |
|---|---|
| The name field is left empty | The letter is signed as the parent, as today |
| A name used before | Offered again from this phone's own list; never suggested from contacts |
| The speaker is a child | Not allowed by the product: adults only. The screen does not ask, and the words do not invite a child to speak |
| The allowance | It counts as the account holder's letter (they kept it) |
| The speaker later wants it removed | The account holder deletes it; we hold no relationship with the speaker |

**Acceptance (PROPOSED).**

| Id | Given, When, Then |
|---|---|
| NS-16-R1 | Given Review, Then "From" can be changed for this letter to a typed name of 1 to 40 characters |
| NS-16-R2 | Given a letter signed as another name, Then every surface that shows a signature shows that name, and the export carries both the name and the account holder as keeper |
| NS-16-R3 | Given such a letter, Then edit, delete, privacy and counting rules are those of the account holder |
| NS-16-R4 | Given the name field, Then nothing is read from Contacts and no network call is made |
| NS-16-R5 | Given any string on this path, Then none invites a child to speak |

**Design inputs.** The signature line on Review becomes a control. Typing a name is one field, not a profile.
**Content inputs.** One line that says whose words these are, plainly.
**Legal, privacy, compliance inputs.** This stores another adult's voice and words on the account holder's say-so. Washington's and Connecticut's consent rules for another adult's data in a letter are already an open counsel question (packet Q2). A typed name of a real person is personal data of a non-user. Counsel must confirm before build. This is why the card ranks where it does.
**Free or Plus.** Counts as the keeper's letter.

---

## NS-17. A second spoken language, when it passes its gate (candidate C-12, rank 30)

**Who and when.** P4: a parent who speaks Spanish to the baby and English at work, or grandparents who speak Hindi.

**Why.** "Keep our languages in the family" is job 8. A letter kept in the language it was spoken is the product's most distinctive promise to these families, and a mangled one is its most damaging failure.

**What.** A language ships only when a native reviewer and the founder say its transcription and its rules are good enough to keep (the gate on record). Until then it is not offered. There is no translation, ever.

**Unhappy paths.** A language that fails its gate is not listed. A recording made in a language that is not yet offered is kept as audio and waits; the app says so and never guesses at words. Mixed-language sentences are kept as spoken; where the model cannot write a stretch, the audio is the truth and the page says the words are not written down there.

**Acceptance (the gate, restated).**

| Id | Given, When, Then |
|---|---|
| NS-17-R1 | Given a language without a signed gate, Then it is absent from every picker in a store build |
| NS-17-R2 | Given a recording in a language not offered, Then the recording is kept, no transcript is invented, and the letter says its words are waiting |
| NS-17-R3 | Given any letter, Then no surface offers or performs translation or transliteration |
| NS-17-R4 | Given a language that ships, Then the store listing names it and no language that has not shipped |

**Design inputs.** Language is chosen per author. Right-to-left and Devanagari layouts need a native-script reviewer before unlock.
**Content inputs.** Interface words in a second language are a separate decision from spoken languages and need their own reviewer.
**Legal, privacy inputs.** Training-data terms behind the Hindi model are an open counsel question (packet Q9). Listing claims must match what ships (guideline 2.3).
**Cost note.** Each language costs a reviewer (the founder's spend) and a model download hosted on our pack host. See the cost section of `00-product-frame.md`.

---

## NS-18. Typed days in reminders (candidate C-15, rank 33)

**Who and when.** A parent who knows a day worth telling is coming: the first day of nursery, a grandparent's visit.

**What.** In reminder settings the parent types a day and a few words of their own. On that day one reminder carries their words back to them. The app adds nothing to the words.

**Unhappy paths.** A day in the past is not accepted. The day shares the single notification budget (NS-32): it replaces that day's ordinary reminder, never adds a second. Deleting the day cancels it. The words are the parent's and may contain a name: they chose it, and the lock-screen default still hides it unless they opted in.

**Acceptance (PROPOSED).**

| Id | Given, When, Then |
|---|---|
| NS-18-R1 | Given a typed day and words, Then exactly 1 notification on that day carries those words unchanged |
| NS-18-R2 | Given that day also has an ordinary reminder, Then only the typed one is delivered |
| NS-18-R3 | Given the lock-screen default, Then the typed words are hidden until the phone is unlocked unless the parent chose to show them |

**Legal, privacy inputs.** The words stay on the phone. No new data leaves it.

---

## NS-19. Add more to this letter (candidate C-11, rank 35)

**Who and when.** A parent interrupted mid-letter by a crying baby, back an hour later.

**Why it is hard.** What was said is never changed (the constitution; the raw transcript is immutable). "Add more" cannot append to it. The honest version is a second take that belongs to the same letter, kept as its own recording with its own words, shown one after the other.

**What (when taken up).** From Home only: a waiting draft can be continued. A kept letter is not reopened for speech; the parent makes a new letter. This card exists to record that decision so design does not draw an "add audio" button on the letter page.

**Acceptance (PROPOSED).**

| Id | Given, When, Then |
|---|---|
| NS-19-R1 | Given a kept letter, Then no control anywhere records new audio into it |
| NS-19-R2 | Given a waiting draft on Home, Then Continue adds a second take whose audio and raw words are stored separately from the first |

---

## NS-20. A letter to two books (candidate C-13, rank 39)

**Who and when.** A parent of twins, or one telling a story about both children.

**Why it waits.** A letter belongs to one book in the data, in sync, in counting and in export. Changing that touches all four. The need is real for a small group (HYPOTHESIS). Until it is built, the honest path is to keep the letter in one book and share its words into the other by hand.

**What must be decided first.** Is it one letter in two books (edits follow) or two copies (edits do not)? How is it counted (once)? Owner: CPO role with `data-architect`. No date.
