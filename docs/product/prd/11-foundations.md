# NS-32 to NS-37: Foundations a parent feels without seeing

Status: Draft v1, 19 Nov 2026. Author: Karma with the Chief Product Officer role. Docs only. These are not features. Each one protects a promise a parent relies on: it starts fast, it works with large text and VoiceOver, it never nags, and nothing they made is lost or shown where it should not be.

---

## NS-32. One notification budget (candidate N-09, rank 23)

**Who.** P1, whose phone already buzzes too often.
**Why.** Reminders, typed days, a future co-parent push, a Save a copy moment: each feature on its own seems reasonable, and together they become nagging. One budget, enforced in one place, makes the total a product decision instead of an accident.
**Rule.** At most 1 notification from the app per day, of any kind (PROPOSED). Classes are registered in one list. A new class cannot ship without a row there and a priority. A day's notification is chosen by priority: a typed day, then a reminder. The back-off in NS-13 applies to the whole budget.

| Id | Given, When, Then |
|---|---|
| NS-32-R1 | Given every scheduled class, Then at most 1 notification is delivered per local day |
| NS-32-R2 | Given a class not in the registry, Then the build fails its test |
| NS-32-R3 | Given two classes due the same day, Then only the higher priority is delivered |

**Legal, privacy inputs.** All local. No push service until NS-26.

## NS-33. Everyone can use it (candidate N-02, rank 4)

**Who.** A VoiceOver user recording at 2 a.m.; a grandparent at the largest text size; a parent with Reduce Motion on.
**Why.** The standard on record is WCAG 2.2 AA, Dynamic Type to the largest accessibility size, and every gesture with a button (LEGAL-REQ-051; design language section 11). Several screens miss it today: the letter page has no top heading, the Me heading does not match its tab, the Book's lens control announces itself as tabs, and the Book header breaks at the largest size.

| Id | Given, When, Then |
|---|---|
| NS-33-R1 | Given the letter page, Then its dateline is a level 1 heading |
| NS-33-R2 | Given Me, Then the screen heading equals the tab label |
| NS-33-R3 | Given the lens control, Then VoiceOver announces a single choice among options, with the selected one stated |
| NS-33-R4 | Given the Book, letter page, Home and Review at the largest text size on an iPhone SE 3, Then no control is under 44 pt and no text is truncated (device) |
| NS-33-R5 | Given Reduce Motion, Then no screen runs a moving loop (device) |

**What a public claim needs.** Apple's accessibility labels may be declared only for features a parent can use for every common task. None is declared until the device walk passes (design role ruling; founder decides).

## NS-34. It feels quick on the smallest phone (candidate N-01, rank 3)

**Who.** A parent with an older, smaller iPhone and the baby already stirring.
**Why.** Every speed and motion number in the requirements is unmeasured. A tap that answers late in the dark reads as "did it start recording?", the most anxious question in the product.
**Targets (on an iPhone SE 3rd generation).** A screen change starts within 100 ms of the tap. Controls are usable by 350 ms. No frame over 16.7 ms while scrolling the Book or the letter page. The named hand-offs finish within 900 ms; the save hand-off within 2,000 ms. Loops change opacity only, run only on the screen in front, and stop under Reduce Motion.

| Id | Given, When, Then |
|---|---|
| NS-34-R1 | Given the run sheet, When the founder runs it on an SE 3, Then each number above is recorded as met or missed, with the build |
| NS-34-R2 | Given a miss, Then the feature behind it is held from a store build until fixed or the target is changed by the founder |

## NS-35. Only Home starts a letter, and a test proves it (candidate N-05, rank 11)

**Why a parent cares.** One place to start means a parent never wonders where a letter went or which button records. The rule is the founder's (only Home captures). A test that fails when anyone breaks it is what keeps it true as features are added.

| Id | Given, When, Then |
|---|---|
| NS-35-R1 | Given every screen outside Home, Then none starts a new letter or take |
| NS-35-R2 | Given moves inside a capture already begun (Listen to Review, change of mode), Then they are allowed and are not starts |
| NS-35-R3 | Given a doorway from outside the app (a reminder tap, later a widget or shortcut), Then it lands on Home and the parent's tap starts the letter |

## NS-36. New kinds of data follow the letter (candidates N-08 and N-10, ranks 7 and 8)

**Why a parent cares.** A picture, a first, a seal: each is a new thing stored about a letter. If any of them outlives the letter after a delete, shows up in a search after it was hidden, or is missing from an export, the promise "yours always" and "private" breaks quietly.
**Rule for every new field or file.** It is deleted, hidden, sealed and restored in the same step as its letter; it appears in the export; it is found by Find only when the letter is; it has a row in the data inventory; it is never in a log.
**The seal clock.** A sealed letter opens at an instant, stored as one moment in time; the date shown is for display. The same rule on every phone.

| Id | Given, When, Then |
|---|---|
| NS-36-R1 | Given a letter with a picture, a first and a seal, When it is deleted, Then all three are gone in the same step, and come back with a restore |
| NS-36-R2 | Given the export of such a letter, Then every part is in it |
| NS-36-R3 | Given a sealed letter, Then it opens at the same instant on two phones in different time zones (device) |

## NS-37. The Book stays fast as it grows (candidate N-06, rank 10)

**Why a parent cares.** A book of 1,000 letters and 300 pictures should scroll as easily as a book of 10. Pictures are the usual cause of a slow list.
**Rule.** The Book list reads a small copy of each picture (about 512 px on the long side); the letter page a larger copy (about 1,280 px); the original only for export. Nothing is decoded while a take is recording.

| Id | Given, When, Then |
|---|---|
| NS-37-R1 | Given 1,000 letters with 300 pictures, Then the Book scrolls with no frame over 16.7 ms on an SE 3 (device) |
| NS-37-R2 | Given a recording in progress, Then no picture is decoded |
