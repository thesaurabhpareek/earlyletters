# Part II. What we will build

## 7. The shape of the app

Three tabs, one verb each. **Only Home starts a letter.** Elsewhere you can only add to an existing letter, and adding never edits what was said.

| Tab | Verb | What lives there |
|---|---|---|
| Home | Say | The prompt for tonight; Speak, Type, Not much today; whose book (two books only); one slip at a time; a picture to start from |
| Book | Read | Month chapters and Before You; a calm header with Read together, the lens choice, Find and Go to a month; each letter page as one list with Share, a first, a picture, a seal, the day it is about, earlier versions; read the year back |
| Me | Look after | Account, plan, reminders, past-letters switch, Save a copy, storage, privacy, deletion; later, the other parent |

Never a tab: Family, Library, Share. No build shows a co-parent "coming soon" surface (founder, 19 Nov).

**Home slips, one at a time, in a fixed order:** the existing waiting cards; the seal-opened line on its day; Save a copy in the birthday week; one past letter. The photo start is part of the capture controls, never a slip.

## 8. The stack rank

The order of commitment for the next six months, after two council rounds and the founder's approval (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`). Value is a judgment (1 to 5) with no parent evidence behind it yet. Size is in review load: S is one reviewable change, M two to four, L five or more or a native module, server schema change or counsel gate.

The logic of the order, in three movements:
1. **Keep what exists safe and true.** Recording backup readiness, Let it go always finishes, a speed baseline on the smallest phone, the accessibility floor, reminders proven on a phone, the new-phone close-out, and the data rules every new feature must follow.
2. **Help families come back to what they kept**, in the founder's order: a picture with a letter, then Find, then the family pilot, Save a copy, the calmer letter page and Book header, Share one letter, whose book on Home, one past letter, a letter for another day.
3. **The people around the child and something to hold**, each behind its gate: read the year back, a print-ready file, Firsts, someone else speaks, a second language, sealed letters, the other parent in the store app.

Always out: trackers, health or feeding logs, recaps written by a machine, moods, streaks, counts, seen-by receipts, translation, a Share tab, milestone counts.

{{RANK_TABLE}}

## 9. Design focus

What design must get right, from the design language and the council's design pass:

- **Dark first, one hand, half asleep.** Primary actions in the bottom third, at least 56 pt; targets at least 44 pt; capture controls 64 pt. Nothing important hides behind a gesture: every gesture has a button.
- **The letter is the hero.** The parent's words in the serif; the app's own words small, quiet and unsigned. A letter page reads as one place: the letter, then one list of facts about it in a fixed order, Share apart, Delete last.
- **Calm, never ceremony.** No confetti, badges, rings, streaks or celebration. Motion does less: transitions start within 100 ms, finish by 350 ms, loops change opacity only, run only on the screen in front, and stop under Reduce Motion and Low Power Mode.
- **Everyone can use it.** Every screen works at the largest text size with Bold Text on an iPhone SE 3, with VoiceOver, Voice Control and Switch Control; contrast holds at 4.5:1 for body text in light, dark and Increase Contrast; recording state is never shown by colour alone; undo windows never close while VoiceOver is reading.
- **Every state drawn before it is built.** First use and empty; many (1,000 letters, 300 pictures); offline; slow; failed; interrupted by a call or the baby; app killed or updated mid-flow; low storage; plan lapsed; signed out; a second account on the same phone; new phone with words but no recordings; two books; two parents; the expecting parent; Devanagari and right-to-left letters.
- **Truth on screen.** The app never says a recording is on a phone that does not hold it, never says a picture is backed up when it is not, and never shows a count of what a parent missed.

## 10. Content principles

Every word a parent reads lives in `packages/content` and passes the content rules test: no em or en dashes, curly quotes, ellipsis characters or emoji; no fear, guilt or loss language; never implies the app writes anything; never genders the child; never counts a gap. Words in the requirement cards are intent: the content lead writes them, the founder approves them, and anything that is a promise goes in the claims inventory and, where it touches privacy, money or safety, to counsel.

## 11. Legal, privacy and compliance stance

These are the council roles' standing positions; they are not legal advice, and counsel must confirm each legal reading.
- Nothing new leaves the phone without a privacy read. A child's voice or picture leaving it needs a security read and a counsel read first.
- Every surface that touches sign-in, agreement, consent, age, deletion or sharing states what is shown, what is recorded, what never happens, and what happens if the parent declines.
- Every public sentence is true of the build that ships, with a row in the claims inventory. The App Store privacy label changes in the same build as the behaviour that changes it.
- The parent is the user and the child is the subject; no feature asks a child to use the app.
- No letter text, child name, picture or prompt is donated to system search, Siri suggestions or App Intents. System writing tools are off on any field whose text becomes a letter's words.
- Signing out keeps the book on the phone, because deleting it would remove the only copy of the voice while backup is off; the sign-out sheet says so plainly.

**Apple rules read for this document (20 Nov 2026):** guideline 4.5.4 covers push notifications (not required to use the app; no sensitive information; no marketing without opt-in); 5.1.1 requires a privacy policy in the app and the store, in-app account deletion where accounts exist, and respect for declined permissions; 2.1(a) asks that placeholder and temporary content be scrubbed before submission; 2.5.19 forbids hidden or undocumented features. Apple's photo picker (PHPickerViewController) needs no photo-library permission. Lock-screen previews are a user setting the app cannot change; the app can set the placeholder text shown when previews are hidden.
