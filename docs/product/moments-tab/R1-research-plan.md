# R1: Moments tab, five to eight parent study (plan)

Status: PROPOSED. Draft by the user-research agent, 21 Nov 2026.
Branch intended: `wip/moments-r1`. No PR. No edits to CLAIMS.md or BACKLOG.md.

DRAFT-STATE NOTICE (read first). This draft was written without shell access. I could not clone the repo, read the branches or PR named below, or push. It is built only from `/home/claude/moments-brief.md`. Every place that should cite another lead's work is marked UNREAD and must be reconciled before this is filed. See section 10.

## 1. Purpose and scope

Decision this study changes: what the Moments tab leads with, where it sits in the tab bar, how it asks for the photo library, which words it uses, and what nudge wording we allow into push and email. If no answer could change one of those, the question is not in this plan.

Six questions:

1. Which draws a parent to speak: the day, the occasion, the prompt or the photo?
2. Which tab position and name feel right: Moments second with Home default, or another position?
3. Does showing the value before the photo ask make a parent more willing to say yes, comparing two scripted versions with an equal-weight Not now?
4. Which words feel warm without sounding like a machine curated them?
5. Which lock screen nudge wording feels welcome (fixed neutral text, no counts) and which feels creepy?
6. What does a parent expect Moments to do when it is empty?

In scope: a paper and slide test, text only, with the fictional Asha family. Five to eight parents. One week to two weeks of field time.

Out of scope: proving daily return, testing the photo picker itself, testing any feature that writes or rewrites words, anything with a real photo, anything with a child.

## 2. Inputs read

Read this session: `/home/claude/moments-brief.md` (brief of record, 20 to 21 Nov 2026).

UNREAD, not available to me this session (no shell, no clone). The plan must be checked against each before filing:

- The `user-research` skill, `.claude/skills/user-research/**`.
- `wip/moments-b1`, benchmark open question 7 (five-parent card sort). I do not know its exact wording. This plan assumes it asks for a card sort with five parents and extends it.
- `wip/moments-p1`, `p2`, `p3`, `d3`, `d5`.
- PR #1270.
- `docs/agents/COORDINATION.md` section 10, `packages/content/VOICE.md`, `docs/research/USER_RESEARCH.md`, PRIV-R21 text.

Rule of reconciliation: where any of those disagree with this plan, they win and this plan changes.

## 3. Principles for this study

- Fictional only. Every card, mockup and prompt uses the fictional family Asha. No real photo, no real child, no real name, no audio of any child.
- Parents are tired. Sessions are 30 minutes, with a stop at any time and no penalty.
- We ask about the product, not about the person's family. A parent is never asked to describe their child, their home or their feelings about loss.
- No recording of any kind. The moderator takes notes by hand under a participant code. Notes never enter the repo.
- We test our own fixed words only. Nothing in the study writes, rewrites or summarises a parent's words.
- No streaks, counts, gaps, points or badges appear in any stimulus.

## 4. Recruitment, consent and incentives

Founder decisions, not mine: who is recruited, any incentive, any paid tool. This plan proposes defaults only.

### 4.1 Who

- Five to eight parents of a child under three. Mix: at least two who use their phone camera daily, at least one who rarely looks at their photos, at least one who has tried a baby book or journal app, at least one who says they do not like being nudged.
- Adults only. No child present on screen or in audio during the session. If a child is in the room, the session pauses.
- Not the founder's close family. Known friends are allowed only if they will say "no" to us; note the relationship in the code book, not by name.

### 4.2 Participant codes

Codes are `P01` to `P08`. A key linking code to person is kept by the founder outside the repo and deleted when the study ends. Findings carry the code and a one-word role such as "daily-camera" only if it cannot identify anyone.

### 4.3 Consent (shown before anything starts)

Per PRIV-R21, anything a person agrees to carries four lines. Proposed wording, to be checked by counsel and by `content`:

- Shown: "You will look at made-up pictures and words about a made-up family called Asha, and tell us what you think."
- Records: "I take handwritten notes under a code, not your name. I do not record audio or video, and I do not take screenshots."
- Never: "We never ask for your child's name, your photos, or anything about your family. Nothing you say is used to write or change anything for you."
- Decline: "You can skip any question, stop at any time, and ask me to delete my notes about you. Saying no costs you nothing."

Consent is verbal plus a one-line written tick on paper or a form the founder controls. Consent forms never enter the repo.

### 4.4 Incentive

PROPOSED guess: a small thank-you of the founder's choosing. Whether to pay, and how much, is a founder decision. Do not tie any payment to completing the permission ask or to a "yes" answer, or the permission test is spoiled.

### 4.5 Run by

The founder or a human researcher runs the sessions. The user-research agent does not speak to participants.

## 5. Method in one page

Each session, 30 minutes, six parts, same order except where counterbalanced:

| Part | Minutes | Question | Method |
|---|---|---|---|
| A | 4 | Warm-up and consent | Read consent, ask phone habits |
| B | 8 | Q1 | Card sort of the Asha deck, then pick-one |
| C | 4 | Q2 | Tab bar strips, ranking |
| D | 5 | Q3 | Two scripted ask screens, order swapped by participant |
| E | 4 | Q4 | Word pairs |
| F | 3 | Q5 | Lock screen and email text, welcome to creepy scale |
| G | 2 | Q6 | Empty tab sketch and expectation |

Total 30. Part G and the close can run over by five minutes if the parent wants.

Counterbalance: odd codes see Version 1 first in part D, even codes see Version 2 first. Odd codes see tab strip order X first in part C, even see order Y first. Rotate the card deck start point by participant so the first card is not always the same.

## 6. Stimulus: the Asha card deck (Q1)

Ten cards, fictional. Each is a printed or slide card with a paper look. Each shows one starting point for a letter. No place, no thumbnail of a real photo, no machine-made title. A "photo" card uses a plain drawn placeholder tile labelled only with a date and a parent-typed label.

Axis tested: day, occasion, prompt, photo. Cards are tagged on the moderator copy only. The participant sees no tag.

| Card | Axis (hidden) | Text the parent sees |
|---|---|---|
| C1 | Day | "Tuesday" with a small date |
| C2 | Day | "Last Saturday" |
| C3 | Occasion | "Asha's first birthday" (typed by the parent in the story) |
| C4 | Occasion | "Asha's first day at nursery" (typed by the parent in the story) |
| C5 | Prompt | One of our written prompts, shown as a plain question about a small thing |
| C6 | Prompt | A second written prompt, about a sound or a smell |
| C7 | Photo | A drawn tile with the label "Park, picked by you" |
| C8 | Photo | A drawn tile with the label "Three you picked", no counts of what is left |
| C9 | Age day | "Asha is 14 months today" |
| C10 | A year ago | "A year ago you wrote this letter" with a made-up letter title |

Rules for the deck:

- No card says how many pictures exist, how many days are missing or how long since the last letter.
- Prompts come from the repo's 111 written prompts. UNREAD: the content lead picks C5 and C6 so no prompt is invented here.
- C7 and C8 are labelled only as the parent would have typed or chosen them. No machine title appears on any card.
- If a card needs a place name, drop the card. The safe default in the brief is no place.

## 7. Stimulus: the two ask screens (Q3)

Two scripted versions, one slide each plus a short spoken script. The point is the order of value and ask, with the same ask and the same equal-weight Not now.

Version 1, value first: three illustrated Asha examples on paper, then a plain ask for photo access.

Version 2, ask first: the plain ask on the first screen, the three illustrated examples shown only after the parent answers.

Shared in both: the two buttons are the same size, same weight, same tone. "Not now" is not grey, not smaller, not below a fold. Nothing says what happens to anyone "missing out". The ask says that pictures stay on the phone. UNREAD: `design` and `content` own the exact string; this plan uses a placeholder line that must be replaced before any session:

- Ask line (placeholder, content to replace): "Moments can show your pictures by day so you can pick one to talk about. They stay on your phone."
- Buttons: "Allow" and "Not now".

Both versions are shown on a plain printout. No real system dialog is shown. The participant says aloud what they would tap and why. No tap is stored.

## 8. Stimulus: tab position and name (Q2)

Three strips, each a row of tab labels drawn on paper:

- Strip 1: Home, Moments, Letters, Settings (Moments second, Home default).
- Strip 2: Home, Letters, Moments, Settings, with Moments in the centre of five.
- Strip 3: Moments, Home, Letters, Settings (Moments default).

Exact icon and the final tab set belong to `design` and the IA lead. UNREAD: the three-tab ruling in `infra/scope-stack-rank-and-ia-redesign-2026-11-19.md` is overturned by this work and is a founder reversal. The strips here only ask what feels natural. The brief says the name is Moments. The study tests the name only as a label on those strips; it does not reopen the name.

Name check: ask what each strip label would open before telling them. Record the expectation word for word as best the moderator can on paper.

## 9. Stimulus: words, notifications and email (Q4, Q5)

### 9.1 Word pairs (Q4)

Pairs of fixed interface lines on cards, parent chooses which feels warmer and which feels like a machine chose it for them. Candidate pairs, all PROPOSED and to be replaced by lines from `content`:

| Pair | Line one | Line two |
|---|---|---|
| W1 | "Some pictures from the weekend" | "Your weekend" |
| W2 | "Pick one to talk about" | "Tell us about this one" |
| W3 | "A year ago" | "On this day" |
| W4 | "Something small from today" | "Today's highlight" |

Rules: one verb per line, no gender for the child, no machine title, nothing implying anything wrote anything. Do not include a line that sounds curated by software as the "right" answer; the aim is to find what feels like a person said it.

### 9.2 Lock screen mockups, text only (Q5)

Shown on a plain drawn phone outline. No thumbnail, no image, no counts, no place, no child name. Fixed text that the app would send on a random id, in line with the brief's constraints ML-3, NS-32 and NS-51.

| Id | Text on lock screen | Intent |
|---|---|---|
| N1 | "Some pictures from the weekend are here" | The NS-51 neutral wording from the brief |
| N2 | "A quiet moment to talk about this week" | Warmer, still fixed |
| N3 | "Your letter book is here when you are" | No reference to pictures |
| N4 | "Open Moments" | Plain, sparse |
| N5 (calibration only) | "Photos of {child} are waiting" | CONTRAST ONLY. Uses a "waiting" cue that the brief bans. Shown last, to anchor the "creepy" end of the scale. Never shipped. |

N5 is included so the scale has a floor. If counsel or product object to showing it at all, drop N5 and replace it with a card of a banned pattern described in words.

Quiet hours: one question asks when a nudge would be welcome at all. No time is suggested to the parent.

### 9.3 Email mockups, text only

Email can use only what the server knows: the child's date of birth, typed days and letters made. Never library signals. Two text-only emails:

- E1 subject: "A small thing from {child}'s week". Body: two plain sentences and one link line. UNREAD: gender and name rules need the content lead.
- E2 subject: "Your letters are all here". Body: one sentence, one link line.

Neither mentions photos, counts, gaps or time since the last letter. Ask the same welcome to creepy scale as for lock screens.

## 10. Moderator script, exact tasks

Say the words in quotes. Notes in brackets are for the moderator. Total 30 minutes.

### A. Open (4 min)

1. "Thank you for helping. This is about 30 minutes. I will show you made-up pictures and words about a made-up family called Asha. Nothing is yours and nothing is recorded."
2. Read the four consent lines (Shown, Records, Never, Decline). Ask: "Are you happy to go on?" [Tick on paper. If no, thank and stop.]
3. "Tell me about the last time you looked at pictures of your child on your phone. Just the habit, not the pictures." [Do not ask what was in them. Move on if the parent offers detail.]

### B. Cards (8 min), Q1

1. Lay out the ten cards in the rotated order. "Each card is a starting point for a short spoken letter. Put them in three piles: I would want to talk about this, maybe, not for me."
2. "Of the 'would want to' pile, pick the one you would talk about first." Note the card id.
3. "What about it made you want to talk?" [One sentence. Do not lead.]
4. "Was there a card that felt like it was checking up on you?" Note the card id.
5. Do not explain the axes. Do not say which are days or prompts.

### C. Tab strips (4 min), Q2

1. Show the strips in the assigned order. "Which of these would you expect to open first?" 
2. "What do you think Moments opens?" [Write the words. Do this before any explanation.]
3. "Which position would you reach for in a hurry?"
4. Rank the three strips 1 to 3.

### D. Ask screens (5 min), Q3

1. Show the assigned version first. "Say out loud what you would tap and what you are thinking. You are not being tested."
2. Rate on the sheet: "How comfortable would you feel tapping Allow?" (1 to 5) and "How comfortable would you feel tapping Not now?" (1 to 5).
3. Show the other version. Repeat the two ratings.
4. "Which one felt more like a request and which more like a demand?"
5. "If you tapped Not now, what would you expect to see next?" [Feeds Q6.]

### E. Words (4 min), Q4

1. Lay the four pairs. "For each pair, which feels warmer?" Then: "Which sounds like a person said it, and which sounds like software chose it?"
2. "Is there a word here you would not use for your child's letters?" Note the word.

### F. Nudges (3 min), Q5

1. Show N1 to N4 in rotated order, then N5 last. For each: "Would it feel welcome, fine or unwelcome on your lock screen at a time you did not expect it?" Mark on the sheet.
2. "Which would make you wonder how the app knew something?"
3. Show E1 and E2. Same two questions.
4. "At what time of day, if any, would a nudge feel welcome?"

### G. Empty and close (2 min), Q6

1. Show a blank Moments tab sketch with only the tab bar. "You open Moments for the first time and there is nothing in it yet. What do you expect it to do or show?"
2. "What would make you close it and not come back?"
3. Close: "Anything you want me to delete from my notes?" Thank them. Confirm the incentive is not tied to any answer.

### Moderator rules

- Never explain a card before the parent reacts.
- Never name a right answer.
- Never use the words "streak", "missed", "behind", "waiting", "gap".
- If a parent starts describing a real child, a real photo or a real event: "Thank you, I will not note that. Let us stay with the made-up family."
- If a parent becomes distressed, stop, thank them, and end the session. Their notes are discarded if they ask.
- Stop a session at once if a child is recorded, shown or named. Discard those notes.

## 11. Rating sheet (one per participant, paper)

Participant code: ____ Date (week only): ____ Order: Part C X or Y, Part D V1 or V2.

| Item | Rating or note |
|---|---|
| B: pile for each card C1 to C10 | W / M / N |
| B: first-choice card | id |
| B: felt like checking up | id or none |
| C: strip ranking | 1, 2, 3 for strips 1, 2, 3 |
| C: what Moments opens (expectation) | free text, short |
| D: comfort tapping Allow, V1 | 1 to 5 |
| D: comfort tapping Not now, V1 | 1 to 5 |
| D: comfort tapping Allow, V2 | 1 to 5 |
| D: comfort tapping Not now, V2 | 1 to 5 |
| D: felt more like a demand | V1 or V2 or neither |
| E: warmer, W1 to W4 | line one or line two |
| E: sounded like software, W1 to W4 | line one or line two |
| F: N1 to N5 | welcome / fine / unwelcome |
| F: wondered how the app knew | id or none |
| F: E1, E2 | welcome / fine / unwelcome |
| F: welcome time of day | free text or none |
| G: expected when empty | free text, short |
| G: would stop coming back if | free text, short |

Scale for 1 to 5: 1 = very uncomfortable, 5 = very comfortable.

## 12. Requirements (MT-R1-Rn)

Each row: Given/When/Then, a test layer, and the Shown, Records, Never and Decline lines where a person agrees to something. Layer "process" means a checkable step in how the study is run, since no code is built.

### MT-R1-R1: Fictional stimuli only
Given the study materials are prepared, when the founder prints or shows any card, mockup or slide, then every item uses only the fictional family Asha, no real photo, name, place or business appears, and no audio of a child is played or captured.
Layer: process (pre-session checklist, second pair of eyes).
Never: a real family detail, a child's name, an identifying quote in the repo.

### MT-R1-R2: Consent first, four lines
Given a parent has agreed to a session, when the moderator begins, then the moderator reads the Shown, Records, Never and Decline lines and the parent says yes before any task begins.
Layer: process. Shown: made-up Asha items. Records: handwritten coded notes only. Never: no audio, video, screenshot, child's name or parent's photos. Decline: skip, stop, or ask for deletion, at no cost.

### MT-R1-R3: Day, occasion, prompt or photo (Q1)
Given the ten-card Asha deck in rotated order, when a parent sorts into three piles and picks one first, then the moderator records the pile and first-choice card for each, and the analysis counts first choices by axis without telling the parent the axes.
Layer: process, then analysis.

### MT-R1-R4: Tab position and name expectation (Q2)
Given three tab strips in assigned order, when a parent says what Moments would open and ranks the strips, then the moderator records the expectation before any explanation and the ranking.
Layer: process.

### MT-R1-R5: Value before ask, two versions (Q3)
Given two scripted ask versions with identical equal-weight Allow and Not now, when each parent rates comfort for both buttons in both versions, with order swapped by code, then the sheet holds four ratings per parent and the analysis compares them within each person.
Layer: process, then analysis.
Never: any payment or praise linked to tapping Allow.

### MT-R1-R6: Warm without a machine feel (Q4)
Given four pairs of fixed interface lines, when a parent picks the warmer line and the one that sounds like software, then the sheet holds both picks and any word they would not use.
Layer: process, then hand-off to `content`.
Never: a line that implies anything wrote or summarised the parent's words.

### MT-R1-R7: Welcome versus creepy nudges (Q5)
Given four neutral lock screen texts, two email texts and one contrast text, when a parent marks each welcome, fine or unwelcome and names any that made them wonder how the app knew, then the sheet records those marks and the analysis reports wording that gets any "wondered" mark first.
Layer: process, then hand-off to `content` and `decision-science`.
Never: a count, a place, a thumbnail, "waiting" or a child's name in any shipped nudge. The contrast text N5 is never shipped.

### MT-R1-R8: Empty expectation (Q6)
Given a blank Moments tab sketch, when a parent says what they expect, then the moderator records the expectation in a short phrase and the reason they would leave.
Layer: process, then hand-off to `design` and `product`.

### MT-R1-R9: No recording, notes outside the repo
Given a session ends, when notes are stored, then raw notes stay on paper or in the founder's private store, only coded findings enter `docs/research/studies/<study>/FINDINGS.md`, and the code key is deleted when the study ends.
Layer: process.

### MT-R1-R10: Stop and distress
Given a parent shows distress, names a real child, or a child is present on screen or in audio, when it happens, then the moderator pauses or stops, does not note the detail, and discards notes if the parent asks.
Layer: process.

### MT-R1-R11: Findings reach the backlog
Given FINDINGS.md is written, when `product` reviews it, then each finding is a backlog proposal with the source code, its evidence level and an owner agent, and `USER_RESEARCH.md` marks each belief evidenced, assumed or contradicted.
Layer: process.

## 13. PROPOSED pass and stop lines (guesses, not facts)

These are PROPOSED guesses chosen to make a decision readable with five to eight people. They are not statistics and no sample this small supports a rate. Product and decision-science own the final lines. Treat each as a trigger to talk, not a result.

Pass (move the idea to design with a flag):

- Q1: one axis is first choice for a clear majority of the participants who completed, and no card is called "checking up" by more than one parent.
- Q2: one strip is ranked first by most parents and its expectation words match what Moments will do.
- Q3: in most parents, Allow comfort is higher or equal in the value-first version, and Not now comfort is not lower. If the two versions look the same, choose the shorter one.
- Q4: one line in each pair is warmer for most and not called "software" by most.
- Q5: the wording that most parents mark welcome or fine and nobody marks "wondered how the app knew".
- Q6: parents name one expectation that Moments can meet without a counted gap or an empty promise.

Stop (pause the idea, bring it to the founder):

- Any parent, on any card or nudge, says it feels like being watched.
- Any parent calls Not now hard to tap in either ask version.
- Any nudge, other than the contrast N5, is marked unwelcome by more than one parent.
- Any parent, for Q6, expects Moments to show them a count of what they missed.
- Any session breaks the no-recording or fictional-only rule. Stop the whole study and report.

Because the sample is small, a single strong objection counts, a single strong liking does not.

## 14. Analysis template

One FINDINGS.md per study, no identifying detail. Proposed layout:

```
# Study: Moments R1
Dates (week of): 
Participants completed: N of planned
Deviations from plan:

## Q1 First choices by axis
| Axis | First choice count | Pile W count | Checking-up marks |

## Q2 Tab position
| Strip | Rank 1 count | Expectation words |

## Q3 Ask comfort
| Code | V1 Allow | V1 Not now | V2 Allow | V2 Not now | Order | Demand pick |

## Q4 Words
| Pair | Warmer | Software feel | Words to avoid |

## Q5 Nudges
| Id | Welcome | Fine | Unwelcome | Wondered |

## Q6 Empty expectation
Themes, with codes only.

## Per-finding rows
| Id | Finding | Evidence (codes) | Strength: signal / weak / one voice | Implication | Owner |
```

Rules: report counts as counts out of those who completed, never as percentages. Mark each finding "signal" (several parents, same direction), "weak" (two parents) or "one voice". One voice never changes a requirement alone, except for a safety or privacy concern, which is escalated at once.

## 15. How findings flow to the backlog

1. Analysis writes FINDINGS.md under `docs/research/studies/`.
2. The user-research agent updates `USER_RESEARCH.md` and marks each related belief evidenced (with this study), assumed or contradicted.
3. A backlog proposal goes to `product`, one row per decision, naming the owner:
   - tab position and empty state: `product`, `design-systems`.
   - ask order and layout: `product`, `design-systems`, `legal` and `compliance` for the permission text.
   - words: `content`.
   - nudge wording: `content`, plus `decision-science` for any metric that should exist.
4. This plan edits neither CLAIMS.md nor BACKLOG.md. An integrator or `product` raises those after review.
5. Any finding that touches a founder-owned reversal (the default-tab idea, J4, K-02, BL-1305, ML-6, the three-tab ruling) is listed in the proposal as a founder decision.

## 16. What the study cannot tell us

- It cannot prove daily return. People say what they feel in a room; return is behaviour over weeks. Only a live build with opt-in analytics, and no counts shown to parents, could start to show it.
- It cannot tell us whether parents will grant real photo access to a real app. Saying "I would tap Allow" is not tapping Allow.
- It cannot tell us how a real library of messy photos will look. Asha cards are tidy by design.
- It cannot test the Apple system picker, or its machine titles and names. We use none of it.
- It cannot test voice recording, which is the heart of the product, because no child is recorded and no real memory is used.
- It cannot compare two ask versions across people, only within each person, and with small numbers.
- It cannot test notification behaviour on a real lock screen over days.

## 17. Honest limits

- Five to eight people is a small sample. Counts will show signals and objections, not rates. Do not quote a percentage from this study.
- Parents recruited by the founder may be kind. Moderator tone matters; the script asks for dislikes on purpose.
- Order effects remain even with swapping. With few people, the swap may not balance.
- Showing a calibration nudge (N5) may bias later ratings. It is shown last for that reason.
- The ask-screen placeholder wording is mine and not content's. It may change the result, so replace it first.
- The pass and stop lines are guesses and were chosen before data, so they cannot be called validated.
- I could not read other leads' work or the user-research skill this session. This plan may duplicate or contradict them. See section 18.
- The founder or another human runs the sessions, so moderator skill varies and cannot be checked by me.

## 18. Open questions, recommended default and deadline

1. Who runs sessions? Default: the founder, with a second person as note-taker if possible. Deadline before recruiting.
2. Incentive. Default: a small thank-you, unrelated to answers. Founder decision, before recruiting.
3. Final ask and nudge strings. Default: `content` supplies them; replace the placeholders here. Before session one.
4. Reconcile with b1 open question 7, p1 to p3, d3, d5, PR #1270 and the user-research skill. Default: the user-research agent re-runs this plan with a shell and edits it. Before filing.
5. Is showing the contrast nudge N5 acceptable? Default: yes, shown last, never shipped; drop it if counsel objects. Before session one.
6. Is a plain printout of the ask screen enough, or does `design` want a click-through? Default: printout. Before session one.

## 19. Dependencies

- Founder: recruitment, incentive, who moderates, consent record store.
- `content`: strings in sections 7 and 9, the 111 prompts for C5 and C6.
- `design-systems`: tab strip artwork and the drawn card tile.
- `legal` and `compliance`: consent lines and the Allow ask wording.
- `product`: review of this plan in a PR before any recruiting, per the user-research rules.

## 20. Verified, unverified, guess

Verified (read this session): the brief at `/home/claude/moments-brief.md`.

Unverified (not read): every other input named in section 2, including the benchmark open question 7, the six branches, PR #1270, the skill, COORDINATION section 10 and PRIV-R21. The consent wording, the hand-off owners and the file path rules come from the brief and from my role notes, not from reading those files.

Guess: all pass and stop lines, all session timings, the card texts, the word pairs and the nudge texts. No number here is a measurement.

Not done: no clone, no branch, no push, no head sha. See the report.
