# NS-21 to NS-31: Reading the book, and the people around the child

Status: Draft v1, 19 Nov 2026. Author: Karma with the Chief Product Officer role (one Claude session). Docs only. Shape of a card: `README.md`. Sizes, skills, order: `13-engineering-plan.md`. Tests: `14-test-plan.md`.
Words in quotes that are not an existing content key are intent for `content`. PROPOSED marks a proposal. Nothing was run on a phone.
Jobs served: "Leave my words and voice for my child's future" (rank 3), "Keep my child's memories private" (rank 4), "Let family see the baby grow" (rank 6), "Give me a finished book I can hold" (rank 7).

Photo with a letter, Find, Share one letter, the pilot, Firsts and sealed letters already have full requirements: NS-01, NS-02, NS-05, NS-03 and NS-06. This file covers what reading needs around them, and the family items after them.

---

## NS-21. The letter page reads as one place (candidate N-03, rank 16)

**Who and when.** Every parent, every time they open a letter. And the grandparent at the largest text size, with VoiceOver, years later.

**Why.** The letter page is where every new feature lands: a photo, a first, a seal, privacy, the date, Share. If each adds its own control wherever there is room, the page becomes a settings screen around a letter. One plain list, built once, keeps the letter first and gives every later feature a fixed place.

**What.** Under the letter: one list titled for the letter (intent: "This letter"), whose rows are the facts and choices about it, in a fixed order; Share as a button on its own, apart from the list; Delete last, apart from everything.

**Order of rows (fixed; a row is absent when it does not apply, never disabled):**
1. The day it is about, and the day it was said (NS-15)
2. A first (NS-06 Part A)
3. A picture (NS-01). The picture itself shows in the body of the letter, above the words; this row only adds, changes or removes it. This order supersedes NS-06 OQ-A2's "the letter's action row" for a first
4. Sealed until (NS-06 Part B)
5. Who can read it (private or in the book). Absent while the book has one adult, because there is nobody to keep it from
6. Earlier versions (NS-12)
7. Where the recording is (the provenance line; NS-08)

**Happy path.** The parent reads the letter, plays it, scrolls down, sees what is true of it, and changes one thing in one tap and one sheet.

**Unhappy paths.**

| Case | What happens |
|---|---|
| A typed letter | No recording row |
| The other parent's letter | Rows are read-only facts; no control that only the author may use |
| Nothing applies but the date | The list shows one row; it is still a list |
| The largest text size | One column, rows grow, nothing truncates |

**Acceptance.**

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-21-R1 | Given any letter, Then the rows that apply appear in the fixed order above | `[NS-21-R1] rows in the fixed order` |
| NS-21-R2 | Given a row that does not apply, Then it is absent, not disabled | `[NS-21-R2] absent, never greyed` |
| NS-21-R3a | Given the page, Then Share is a separate button above the list | `[NS-21-R3a] Share apart` |
| NS-21-R3b | Given the page, Then Delete is the last control on the page | `[NS-21-R3b] Delete last` |
| NS-21-R4 | Given VoiceOver, Then the dateline is a level 1 heading and the list title a level 2 heading | `[NS-21-R4] headings for the rotor` |
| NS-21-R5 | Given the largest text size on an iPhone SE 3, Then every row is at least 56 pt tall and no text is truncated (device) | device row |

**Design inputs.** Existing list components; no new component. Spacing between Share and the list is a design call. The letter's own text keeps the serif; every row uses the app's small voice.
**Content inputs.** One list title and one label per row, written once for all features.
**Legal, privacy inputs.** None new.

---

## NS-22. The Book header stays calm (candidate N-04, rank 17)

**Who and when.** A parent opening the Book to read, who sees the title, the age and then, today, a stack of controls before the first letter. At the largest text size the first letter can fall below the fold.

**Why.** The Book is for reading. Find, the lens choice, Read together and Go to a month are all useful and all compete for the same top inch.

**What.** One bar in a fixed order: title, age, child switcher (two books only), Read together, the lens choice, Find, Go to a month. The gear leaves the Book. Its destinations move: book settings (name, dates, languages) to Me, then the child; Quiet this book and Hide this book (F12-REQ-011, F09-REQ-016) stay on the Book, in one menu at the end of the bar, within 2 taps (the F12 measure). Nothing is added.

**Unhappy paths.**

| Case | What happens |
|---|---|
| An empty book | Find and the lens choice are absent; Read together is absent; title and age remain |
| One book | No switcher |
| The largest text size | Controls wrap to a second line in the same order; Go to a month may fold into the end menu |
| A quieted book | The bar is the same; the menu offers Unquiet |

**Acceptance.**

| Id | Given, When, Then |
|---|---|
| NS-22-R1 | Given the Book at the default text size on an iPhone SE 3, Then the first letter card's top edge is visible without scrolling (device) |
| NS-22-R2 | Given the largest text size, Then every header control is 44 pt or more and stays in the fixed order |
| NS-22-R3 | Given the Book, Then it has no gear, and Quiet this book and Hide this book are reachable in 2 taps from the Book |
| NS-22-R4 | Given a book with no letters, Then Find, the lens choice and Read together are absent, not disabled |

**Design inputs.** This follows Find landing: design once, with Find in place. The month jump may fold into a menu at the largest sizes; design decides.

---

## NS-23. One past letter on Home (candidate C-20, rank 21)

**Who and when.** P1 opening Home to speak tonight, and finding a letter they said a year ago today.

**Why.** Rereading is what turns a habit of writing into a reason to keep going. Home has one slip for this; it must be kind on a hard day and never feel like a report.

**What.** At most one past letter at a time, from the same day in an earlier month or year, as a quiet card under the prompt. Tapping it opens the letter in the Book. It never says how long ago in numbers beyond the date, never says "you have not written since".

**Unhappy paths.**

| Case | What happens |
|---|---|
| No letter on a matching day | Nothing; no placeholder |
| A private letter of the other parent | Never shown |
| A sealed letter | Never shown before its day |
| The parent dismisses it | Gone until tomorrow |
| A letter the parent deleted and restored | Eligible again |
| A hard day (no way to know) | The parent can turn past letters off in Me in one switch |
| A quieted or hidden book | No past letter from it, ever |

**Acceptance.**

| Id | Given, When, Then |
|---|---|
| NS-23-R1a | Given a letter whose day matches today's day in an earlier month or year, and no higher slip is due, Then Home shows a card for exactly one such letter, the most recent |
| NS-23-R1b | Given several matches, Then still only one card is shown |
| NS-23-R2 | Given the card, Then it carries the letter's dateline and an opening fragment cut by the system word segmenter for the letter's language (so Chinese and Devanagari cut correctly), and no count |
| NS-23-R7 | Given VoiceOver, Then the card is one element read as the dateline then the fragment, with the fragment in the letter's language |
| NS-23-R8 | Given a quieted or hidden book, Then no letter from it is chosen |
| NS-23-R3 | Given a tap, Then the letter opens in the Book; Back returns to Home |
| NS-23-R4 | Given the switch in Me is off, Then no past letter appears on Home |
| NS-23-R5 | Given a sealed, hidden or other-parent private letter, Then it is never chosen |
| NS-23-R6 | Given another slip is due (a waiting draft, Save a copy), Then only one slip shows, the waiting draft first |

**Design inputs.** The existing slip on Home. It must not sit between the prompt and the capture controls. The verb on the card is not "Read it" (Home's only verb is speaking); the card itself is the tap.
**Content inputs.** No new sentence is needed beyond the switch label in Me.
**Legal, privacy inputs.** Words of a letter on Home are already on screen in the app; nothing reaches a notification.

---

## NS-24. Read the year back (candidate C-25, rank 26)

**Who and when.** Both parents on {child}'s birthday evening, phone between them, reading the year aloud.

**Why.** Read together is built for bedtime with {child}. The birthday is the other reading moment: the adults, together, once a year.

**What.** From the Book, for a year of {child}'s life: Read together over that year's letters in book order, with the existing page turn. No summary, no highlights, no count of letters. A year runs from a birthday to the day before the next; Before You is its own year. The about-day (NS-15) sets the order.

**Happy path.** On the birthday evening a parent opens the Book, chooses the year just ended, and taps Read the year. Read together opens at its first letter; they turn pages together; the last page is the last letter of the year, then the Book.

**Unhappy paths.**

| Case | What happens |
|---|---|
| A year with no letters | It is not offered |
| Two books | The year is of the active book |
| Sealed, hidden or the other parent's private letters | Skipped |
| A letter whose recording is not on this phone | Its words show; Play is absent |
| Interrupted | Back returns to the Book; starting again opens at the first letter |

**Acceptance (PROPOSED).**

| Id | Given, When, Then |
|---|---|
| NS-24-R1 | Given a year with letters, Then Read together can start at its first letter and ends at its last |
| NS-24-R2 | Given the year view, Then no page contains text the parents did not say or type, except month headings |
| NS-24-R3 | Given private letters of the other parent, sealed letters or hidden letters, Then they are skipped |
| NS-24-R4 | Given a year with no letters, Then it is not offered |
| NS-24-R5 | Given a birth date, Then a year is birthday to the day before the next birthday, and Before You is its own year |

**Free or Plus.** Free. Read together has no session limit and no Plus gate (M2; F10). Never write a line that implies a limit.

---

## NS-25. The other parent, in the store app (candidate C-21, rank 28)

**Who and when.** P2, who has heard about the book and wants to add their own letters, in their own voice.

**Why.** "Both parents in one book" is a gap other products leave open. It is built and runs in test builds only, by the founder's decision (D-162 as drafted: a co-parent surface shows only when server features are on and the build is a test build).

**What must be true before it reaches the store app.** The co-parent work already in the backlog lands; the invite asks before joining; the second adult can be removed by the first; each parent's private letters stay private; a second adult cannot delete the first adult's letters; deletion of either account behaves as the data policy says; counsel has read the shared-book deletion question (packet Q29). Nothing is said in the store app until then, by the founder's answer of 19 Nov.

**Happy path (when it ships).** Parent 1 invites from Me. Parent 2 opens the link, installs, signs in, agrees, and sees the book. Each signs their own letters.

**Unhappy paths the design must cover.** The link is opened on an Android phone (the page says the app is iPhone only for now, and offers nothing that needs an account). The invite has expired. Parent 2 already has their own book. Parent 1 removes Parent 2. Parent 2 deletes their account. Two parents edit the same letter (only the author can). A third adult (refused: two parents only).

**Acceptance (minimum, before any store build).**

| Id | Given, When, Then |
|---|---|
| NS-25-R1 | Given a store build, Then no co-parent surface or "coming soon" line appears until this card's gates are met (D-162 draft) |
| NS-25-R2 | Given an invite, When the second adult opens it, Then they see the inviter's sign-off and role only, and no child name or letter, until they agree |
| NS-25-R3 | Given two parents, Then neither can read the other's private letters or delete the other's letters |
| NS-25-R4 | Given the first parent removes the second, Then the second's phone stops receiving the book at its next sync, and the second keeps their own authored letters as the data policy says |
| NS-25-R5 | Given a third adult opens an invite, Then joining is refused with a plain line |
| NS-25-R6 | Given the invite link page, Then it shows no child name and no letter (D-111 item 8) |

**Door lines.** Shown: invite, accept, remove and leave words, with versioned links. Records: the acceptance per PRIV-R21. Never: a child name before acceptance. Decline: nothing joins; the inviter is not told why.

Full rows are in the co-parent backlog work and F11; this card adds the store-build gate.

**Legal, privacy inputs.** A second adult sees every non-private letter, including health or pregnancy details the first parent spoke. The consent for that sharing is open for counsel (D-050; packet Q2). Counsel must confirm.

---

## NS-26. Hear when the other parent writes (candidate C-29, rank 41)

**Why it waits.** A push notification needs a server sender, an entitlement and a consent, and it puts letter words or a child's name near a lock screen. Value is real for P2 but small next to its cost. Revisit after NS-25 ships, with tester evidence.
**Rule if built.** Never letter words or a child's name in the push by default. One push per day at most.

## NS-27. Who can read each letter (candidate C-31, rank 42)

**Why it waits.** Today a letter is either private to its author or in the book for both parents. Per-person choices only matter once there are more than two readers (close family, NS-28). Building it first would be access-rule work with no reader to serve.

## NS-28. A family link or circle (candidate C-27, rank 40)

**Why it waits.** It means a child's voice and words on our servers for people who are not account holders. Closed question X2: no build before a security read and a counsel read. The pilot (NS-03) tests the need by hand first. What the pilot must show before this is specified: that parents send a recording to someone, how often, and to whom.

---

## NS-29. Words that light up as they are read (candidate C-33, rank 38)

**Who.** A parent reading a letter aloud to {child}, following the words with a finger. Designed for the parent's use, never for a child using the app alone (no feature asks a child to use the app).
**Why it waits.** It needs word timings stored against the raw words, which the engine does not keep yet, and it must never mark a word the parent did not say. Size L. The F30 file already lists the hook v1.0 must keep (word timings with offsets into raw).

---

## NS-30. A book you can hold (candidates C-26 print-ready file, rank 27; C-28 printed Year One, rank 43)

**Print-ready file.** Specified in `07-remaining-capability-rows.md` section 3.2 (rows NS-07-C28-1 to 7). This card adds the customer frame only: P1 at the end of the first year wants to hand a grandparent something made of paper. The file is free. It sells nothing. Layout numbers wait for two proof books, which need the founder's approval to spend.
**Printed Year One with a code that plays the voice.** Waits for three things that are not product work: an entity, a print partner and terms, and hosted audio for the code to point at (which falls under X2). No date. The physical keepsake is rank 2 of the founder's expansion order; this card keeps it visible.

## NS-31. A library of moments (candidate C-16, rank 44)

Specified in full as NX-39 (Memory Library), after Build 13 as a whole by the 10 Nov exec record. It reads the photo library and suggests days, which needs counsel on several questions (the NX-39 counsel brief). Nothing here changes it.
