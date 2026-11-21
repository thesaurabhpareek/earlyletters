# R1: Moments tab, five to eight parent study (plan, v2 reconciled)

Status: PROPOSED. Draft by the user-research agent, 21 Nov 2026. This is v2: v1 was written from the brief only and marked every lead UNREAD. v2 is reconciled against the six lead docs and the repo docs named in section 2.
Branch: `wip/moments-r1-v2` (v1 stays on `wip/moments-r1`). No PR. No edits to CLAIMS.md or BACKLOG.md.
When filed, this file is copied to `docs/research/studies/2026-11-moments/PLAN.md` (the skill's study layout); the guide and findings sit beside it.

## 0. Read first

Top five research questions, each with the cheapest method (detail in section 1):

1. On an ordinary day, does a parent have anything real to talk about beyond the written prompt? Cheapest: a seven-evening paper tally, no product shown.
2. What starts a spoken letter: a day of pictures, a typed or marked day, an age day, a year ago, a written prompt, or a picture the parent picked? Cheapest: a ten-card Asha sort, five parents.
3. On a quiet day, does an honest short Moments screen feel calm and finished, or like a broken tab? Cheapest: three paper quiet-screen sketches.
4. Before the photo ask, does a parent understand what they are agreeing to, and does Not now feel free? Cheapest: two paper ask scripts, teach-back, within each person.
5. Which lock screen and email wording feels welcome and which feels watched? Cheapest: text-only mockups on a drawn phone, three-way mark.

Two secondary questions ride in the same session and do not decide anything alone: tab position and label (Q6), and warm words (Q7).

What changed from v1 (full log in section 3):
- Tab strips now use the real tabs (Home, Moments, Book, Me), not "Letters" and "Settings".
- The photo-ask test no longer measures willingness to say yes. P3 says never optimise grants. It measures understanding and the ease of Not now.
- Stimuli are cleaned of counts, relative dates, a place, a child name in email, and the "waiting" contrast line.
- A seven-evening tally is added, because three leads said Moments may be thin on most days and none can measure it.
- Consent gains the skill's two missing items: who sees notes, and how long they are kept.

## 1. Purpose and scope

Decision this study changes: what the Moments tab leads with, where it sits, how it asks for the photo library, which words it uses, which nudge wording enters push (and email, if ever), and whether a quiet day is acceptable. If no answer could change one of those, the question is not in this plan.

Seven questions. Q1 to Q5 are the top five.

| Q | Question | Decision it informs | Cheapest method | Lead assumption it tests |
|---|---|---|---|---|
| Q1 | On an ordinary day, does a real day worth a letter exist (a day of pictures, a marked day, an age day) beyond the written prompt? | Whether Moments earns a tab; whether to drop the daily-return claim | Seven-evening paper tally, collected at the session, 5 to 8 parents | P1 6.1, P2 F6 and 9, P3 10.1: "thin on most days", rate unknown |
| Q2 | Which starting point makes a parent want to speak: day, typed or marked day, age day, year ago, written prompt, picture they picked? | What For you leads with; order of the four slots | Ten-card Asha sort and pick-one | P2 sources S1 to S7 and ordering; B1 open question 7 |
| Q3 | On a quiet day, what do parents expect, and which of three honest quiet screens feels finished rather than broken? | The M3 and M4 states | Three paper sketches, pick and say why | P1 M3 "never say nothing new"; D5 empty strings; P2 four slots |
| Q4 | Before the photo ask, do parents understand what they are agreeing to, and is Not now as easy as the yes? | Ask order, primer words, whether a retry button exists | Two scripted paper asks, order swapped, teach-back | P3 6.3 and 7.2, D5 section 6, B1 principle 5 |
| Q5 | Which lock screen and email wording feels welcome, which feels watched, and does a repeat after writing feel unwelcome? | Nudge strings; whether any library-derived line is worth a founder ruling | Text-only mockups on a drawn phone | P1 R17, P3 Q-P3-3, D5 12.1, B1 principle 4 |
| Q6 | Which tab position feels natural, and what does each candidate label lead a parent to expect it opens? | Input to the founder's position ruling (A, C or D) | Paper tab strips, first-click, expectation words | P1 4, P2 4, P3 5, D5 4 |
| Q7 | Which of two fixed lines feels like a person said it, not software? | `content` word choices | Word pairs | D5 sections 5 to 9 |

In scope: a paper and slide test, text only, with the fictional Asha family. Five to eight parents. Two weeks of field time: week one is the tally, week two the sessions.

Out of scope: proving daily return, testing the photo picker or PhotoKit, testing any feature that writes or rewrites words, any real photo, anything with a child, a clickable prototype.

## 2. Inputs read

Read this session, at the branch heads named in section 22:
- `wip/moments-b1` `B1-market-benchmark.md` (395 lines).
- `wip/moments-p1` `P1-tab-job-and-ia.md`, `wip/moments-p2` `P2-feed-sources-and-ranking.md`, `wip/moments-p3` `P3-value-props-and-permission.md`. Sections on position, sources, first experience, permission, return, success reading, reversals and open questions were read in full; requirement tables were skimmed.
- `wip/moments-d3` `D3-moment-cards-and-states.md` (sections 3, 4, 4a, 14 to 16 in full; card anatomy and state table skimmed).
- `wip/moments-d5` `D5-content-and-microcopy.md` (sections 3 to 9, 12, 16 to 18 in full).
- `docs/research/USER_RESEARCH.md` (top findings, habit and engagement, research questions, interview guide).
- `packages/content/VOICE.md` in full.
- `.claude/skills/user-research/SKILL.md` in full, and `docs/agents/COORDINATION.md` section 10.
- The brief of record, `/home/claude/moments-brief.md`, as read for v1.

Still not read, and any claim about them is marked UNVERIFIED here: PR #1270; the feasibility, privacy-and-constitution and design-concept docs (the leads also report none were on any branch on 21 Nov); the three-tab ruling in the Project doc; ML-1 to ML-14, NS-32 and NS-51 text (quoted second hand through the leads); `docs/engineering/07-privacy-engineering.md` (PRIV-R21 text); the founder's screenshots (not needed and not copied).

Rule of reconciliation, unchanged: where a lead or repo doc disagrees with this plan, it wins and this plan changes. Where the leads disagree with each other, this plan does not pick a winner. It tests the difference where a parent can speak to it, and lists the rest for the founder (section 3.2).

## 3. Reconciliation log

### 3.1 Contradictions between v1 and the leads, and how v2 fixes them

| # | v1 said | Lead or repo doc says | v2 fix |
|---|---|---|---|
| 1 | Tab strips: Home, Moments, Letters, Settings; Moments centre of five | IA is Home, Book, Me. P1, P2, P3 and B1 recommend four tabs: Home, Moments, Book, Me (option A). A centre tab of five is not recommended (P1 4.3, P2 4) | Section 9.2: strips are A (Home, Moments, Book, Me), C (Moments first of the same four) and D (no new tab; Moments as the top group on Home, the B1 fallback). No five-tab strip |
| 2 | "The name is Moments; do not reopen" | D5 F1 and Q1 recommend Gather and warn that Moments is a glossary trap (BRAND.md bans "moment" for a short piece; `en.moments` exists). P2 F7 and D3 Q1 raise the same. P1 proposes the verb "choose", P2 "look back" | The name stays a founder and content decision. The study uses "Moments" as a working label only, shows "Gather" on half the strips, and records what each label leads a parent to expect. It does not ask which name they like |
| 3 | Q3 measured "willingness to say yes" to photo access | P3 11.2: access given is "Not a goal. Never optimise to push it up", and never run an arm with a harder ask. P3 11.1: ask what they did and why, not what they would do | Q4 measures teach-back (can the parent say what is read and what is not) and ease of Not now. Allow comfort is still recorded as information, never a pass line |
| 4 | Ask line: "They stay on your phone." | D5 F4 bars "stays on this phone", "never leaves" and "no one else" in touched copy. P3 7.3 proposes no such claim (backup and export contradict it) | Placeholder replaced by D5's primer: "{app} can look at the pictures on this phone to show you days that might make a letter. You can pick which ones." Buttons "Choose pictures" and "Not now" |
| 5 | Version 1 value first, Version 2 ask first | P3 6.3 and D5 5 to 6 both put value before the ask, with the ask card below the real cards. Ask-first is no lead's design | V1 is the P3 and D5 design. V2 (ask first) stays as the contrast arm, not a recommendation. Both keep Not now equal. Neither is a harder ask |
| 6 | Lock screen N1 "Some pictures from the weekend are here" as the neutral wording; N5 "Photos of {child} are waiting" as a creepy floor | P1 R17, P3 Q-P3-3, B1 Q1: ML-3 wins, no library-derived push by default. D5 Q4: ship day, month and idea pushes first. The word "waiting" is banned (brief; P2 shared never list) | N1 stays as one stimulus, marked "library-derived, valid only if the founder rules it, tested for wording only". N2 to N4 added from D5 12.1 (day, month, idea). N5 dropped as a stimulus. The floor becomes a spoken question (section 10.2) |
| 7 | Email E1 subject "A small thing from {child}'s week" | VOICE.md and CATALOG E-1: no child's name in any email. D5 12.2 proposes one email with "your child". P1, P2, P3 and D5 all say no come-back email at 1.0 | One email stimulus from D5 12.2, tagged "not planned for 1.0, wording only". E2 dropped (its wording was a status line, not a nudge) |
| 8 | Card C8 "Three you picked" | P2 shared never list and D3: no count of pictures. "Three" is a count | Reworded "Some you picked", with a drawn collage and no number |
| 9 | Card C2 "Last Saturday" | D3 Q2 default: plain dates only, never "how long ago". VOICE.md: never count days or runs | C2 is "Saturday 15 November", a plain date |
| 10 | Card C7 "Park, picked by you" | P2, D3 and D5 F5: no place unless the parent typed it | The label "Park" is marked on the moderator copy as parent-typed |
| 11 | Ten cards on four axes (day, occasion, prompt, photo) | P2 has seven sources S1 to S7 (typed day, chosen day, month and age day, year ago, parent-picked picture, written prompt, day of pictures) | Section 8 re-maps the ten cards to S1 to S7, so findings land on the ranking P2 will build |
| 12 | Consent: four lines, "per PRIV-R21" | PRIV-R21 governs in-app records of a person's act; it is not the research consent. The skill (section 3) requires: what we record, who sees it, how long we keep it, how to withdraw | Four lines kept as the shape; "who sees" and "how long kept" added. The PRIV-R21 reference is removed |
| 13 | Sample 5 to 8, with caveats | Skill: usability about 5 per round, preference 15 to 30, diary 8 to 12. P2 and B1 propose 5 parents | Sample stays 5 to 8. Section 18 says plainly: signals and objections, not preferences, and the tally is below the skill's 8 to 12 |
| 14 | Findings path `docs/research/studies/<study>/FINDINGS.md`; file lives in `moments-tab/` | Skill: `docs/research/studies/<yyyy-mm>-<topic>/PLAN.md`, `GUIDE.md`, `FINDINGS.md` | The top of this file says where it is filed. The moderator script becomes GUIDE.md at filing |
| 15 | "J4 (only Home starts a letter)" | P1 7: in the repo table that rule is J3; the brief calls it J4 | Section 16 says "J3 in the repo table, J4 in the brief" |
| 16 | Out of scope: daily return | P1 6.1, P2 9, P3 10.1 all say Moments cannot honestly be a daily reason; P2 Q8 proposes a diary to see whether the tab earns its place | Daily return is still not proven. Q1 (the tally) measures what the leads say decides it: how often a real day exists |
| 17 | Q6: "what does a parent expect when it is empty" | P1 M3 forbids "no moments yet" and "nothing new"; P3 MT-P3-R19 forbids an empty-day line; D5 9 ships "Nothing here yet" | Q3 tests three honest quiet screens, including D5's wording (section 9.3), so the contradiction is tested, not argued |

### 3.2 Contradictions between the leads that this plan cannot settle (for the founder or the integrator)

Each is listed so findings are not blamed for them.

| # | Disagreement | Where | Handling here |
|---|---|---|---|
| L1 | Tab word and verb: Moments (P1, P2, P3, B1, D3) versus Gather (D5); "choose" (P1) versus "look back" (P2) | P1 3.1, P2 4, D5 4 | Tested lightly in Q6, expectation words only |
| L2 | Weekly opt-in email: B1 Q5 default yes; P1, P2, P3 and D5 default no at 1.0 (E75; catalog principles 1 and 5) | B1 11, P1 6.3, P2 F4, D5 Q5 | One email stimulus in Q5, flagged. The plan does not claim any email is allowed |
| L3 | Can the server know typed days? The brief, B1 and D5 say yes; P2 F5 and P3 10.2 read the repo as phone only (NS-46, NS-47) | P2 F5, P3 10.2 | Not a research question. Code and counsel answer it. No stimulus depends on it |
| L4 | Library-derived push: P1 and P3 default no; D5 12.1 includes the "pictures" line as an option; D3 says only the card may use library signals | P1 6.2, P3 Q-P3-3, D5 Q4 | N1 tested for wording only (Q5) |
| L5 | A year-ago letter in email: P1 6.2 allows it from the letter date; P3 Q-P3-5 and P2 say no until counsel | P1, P2, P3 | No year-ago email stimulus |
| L6 | Recent window: 90 days (P2 S7) versus 14 days (P3 R19); D3 gives no figure | P2, P3 | Not a research question. The spike fixes it |
| L7 | Route A (Apple's picker, no list of days) versus Route B (our own read, a list). P3 writes for Route B but ships Route A first; D3 assumes Route B; P2 designs both | P2 5, P3 7.1, D3 15 | Both appear: the ask shows "Choose pictures" (works under either) and Part B shows a drawn D3 day card (Route B only). Findings are tagged by route |
| L8 | After Not now: P1 M4 and P3 7.4 say one calm line and no retry; D5 7 includes a retry button "Show pictures" | P1 9.4, P3 11, D5 7 | Tested in Q4 step 6 (what the parent expects to see) |
| L9 | Where the year-ago letter lives: Home rank 4 or Moments | P1 RV-11, P2 Q2 | Not tested |
| L10 | Daily-return claim: P1 Q-P1-7 asks to drop it; the founder's update asks for a daily-return engine | P1 6.1 | Q1 gives evidence. The founder decides |

## 4. Principles for this study

- Fictional only. Every card, mockup and prompt uses the fictional family Asha. No real photo, no real child, no real name, no place, no audio of any child. Participants are adults. No child is recruited, present on screen, or recorded.
- Parents are tired (skill; USER_RESEARCH). Sessions are 30 minutes, with a stop at any time and no penalty. The week-one tally is about two minutes an evening and optional per evening.
- We ask about the product, not about the person's family. A parent is never asked to describe their child, their home or their feelings about loss. The tally records only a category, never a detail.
- No recording of any kind. The moderator takes notes by hand under a participant code. Notes never enter the repo.
- We test our own fixed words only. Nothing in the study writes, rewrites or summarises a parent's words.
- No streaks, counts, gaps, relative dates, "waiting", points or badges appear in any stimulus. The moderator never says them either.
- Findings are celebration-framed (VOICE.md and the skill): what parents do and like, not gaps or failures.

## 5. Recruitment, consent and incentives

Founder decisions, not mine: who is recruited, any incentive, any paid tool. This plan proposes defaults only.

### 5.1 Who

- Five to eight adult parents of a child under three. Mix: at least two who use their phone camera daily, at least one who rarely looks at their photos, at least one who has tried a baby book or journal app, at least one who says they do not like being nudged, at least one second-time parent (USER_RESEARCH second-child finding).
- Adults only. No child present on screen or in audio during the session. If a child is in the room, the session pauses.
- Not the founder's close family. Known friends are allowed only if they will say "no" to us; note the relationship in the code book, not by name.

### 5.2 Participant codes

Codes are `P01` to `P08`. A key linking code to person is kept by the founder outside the repo and deleted when the study ends. Findings carry the code and a one-word role such as "daily-camera" only if it cannot identify anyone.

### 5.3 Consent (shown and signed on paper before anything starts)

The skill (section 3) asks for written, plain consent covering what we record, who sees it, how long we keep it, and how to withdraw. Six lines; wording to be checked by counsel and by `content`, and never to carry the words "stays on your phone".

- Shown: "You will look at made-up pictures and words about a made-up family called Asha, and tell us what you think. This week you will also tick a short paper card each evening."
- Records: "I take handwritten notes under a code, not your name. I do not record audio or video, and I do not take screenshots. The paper card holds only ticks, no names and no details."
- Who sees it: "Only the person running the session and one note-taker. The write-up uses codes and short paraphrases, with anything identifying removed."
- How long: "Paper notes and your card are destroyed on a date I will tell you (proposed: 30 days after the write-up is filed; founder to confirm). The code key is deleted when the study ends."
- Never: "We never ask for your child's name, your photos, or anything about your family. Nothing you say is used to write or change anything for you."
- Decline and withdraw: "You can skip any question or evening, stop at any time, and ask me to delete my notes and card. Saying no costs you nothing."

Consent is verbal plus a written tick on paper the founder controls. Consent forms never enter the repo. The PRIV-R21 record (document, version, action, method and so on) is for in-app acts. This study does not write one.

### 5.4 Incentive

PROPOSED guess: a small thank-you of the founder's choosing. Whether to pay, and how much, is a founder decision. Do not tie any payment to completing the permission ask, to a "yes" answer, or to completing every evening, or the Q1 tally and the Q4 ask test are spoiled.

### 5.5 Run by

The founder or a human researcher runs the sessions. The user-research agent does not speak to participants. Recruiting through personal networks introduces bias; the write-up says so.

## 6. Method in one page

Week one: each parent gets a paper tally card (section 7) and fills it in each evening for seven evenings. The card says nothing about Moments or any app.

Week two: a 30-minute session per parent, seven parts, same order except where counterbalanced:

| Part | Minutes | Question | Method |
|---|---|---|---|
| A | 4 | Warm-up, consent, collect the tally card | Read consent, take the card, ask phone habits |
| B | 8 | Q2 | Card sort of the Asha deck, then pick-one, then one day card probe |
| C | 3 | Q6 | Tab strips, first-click, expectation words |
| D | 5 | Q4 | Two scripted ask screens, order swapped, teach-back |
| E | 3 | Q7 | Word pairs |
| F | 4 | Q5 | Lock screen and one email text, three-way mark |
| G | 3 | Q3 | Three quiet-state sketches, pick one, say why |

Total 30. Part G and the close can run over by five minutes if the parent wants.

Counterbalance: odd codes see Version 1 first in part D, even codes see Version 2 first. Odd codes see tab strip order X first in part C, even see order Y first. Rotate the card deck start point by participant. Alternate the Moments-labelled and Gather-labelled strips by code.

## 7. Stimulus: the week-one tally card (Q1)

One paper card, seven rows (evening one to seven, no dates), four tick boxes per row. No product name, no app mention, and no photo is taken or shown. The parent ticks, on their own, at the end of each evening:

| Box | Words on the card |
|---|---|
| T1 | "Something happened today that I would have liked to tell my child about" |
| T2 | "I took pictures today that I would want to talk about" |
| T3 | "Today was a special day (a birthday, a month day, a family day)" |
| T4 | "Nothing in particular today" |

Rules:
- Ticks only. No free text. The card has no child name and no detail.
- Tick as many as are true, or none, or skip the evening. A skipped evening is not a gap and is not asked about.
- The founder collects the card at the session. It is paper, kept outside the repo, destroyed on the stated date.
- Mapping for analysis: T2 maps to a day of pictures (S7) and a parent-picked picture (S5), T3 to a marked or age day (S1 to S3), T1 to a written prompt that fits (S6), T4 to "only the prompt exists".
- The card cannot see whether a real Moments screen would have shown a card that day. It tests only how often a parent thinks there is something worth a letter. Said again in section 17.

Why a tally and not P2's two-week prototype diary: P2 R41 has parents use a prototype with Asha content. That shows only the question card, not how often a parent's own real day has a source (P2 F6). The tally measures the base rate with no prototype and no real data leaving the parent's hands.

## 8. Stimulus: the Asha card deck (Q2)

Ten cards, fictional. Each is a printed or slide card with a paper look. Each shows one starting point for a letter. No place, no thumbnail of a real photo, no machine-made title, no count, no relative date. A "photo" card uses a plain drawn placeholder tile labelled only with a date and a parent-typed label. Wording is for `content` to replace; none of it is final copy.

| Card | P2 source (hidden) | What the parent sees |
|---|---|---|
| C1 | S1 or S2 typed or chosen day | "Asha's first day at nursery" (typed by the parent in the story), with the date |
| C2 | S2 chosen day | "Saturday 15 November" as a plain date, a family day the parent ticked in the story |
| C3 | S2 chosen day | "Asha's first birthday" (typed by the parent in the story) |
| C4 | S3 month and age day | "Today Asha is 14 months old" |
| C5 | S4 year ago | "A letter from 21 November last year", with a made-up fragment in made-up words |
| C6 | S6 written prompt | One written prompt from the repo's 111, a plain question about a small thing. `content` picks it |
| C7 | S6 written prompt | A second written prompt, about a sound or a smell. `content` picks it |
| C8 | S7 day of pictures | A drawn four-tile card with a plain date and no label, no count |
| C9 | S7 day of pictures, labelled | A drawn four-tile card with the date and the label "Park" (typed by the parent in the story) |
| C10 | S5 picture the parent picked | A drawn single tile with the label "Some you picked" and the words "beside your letter" |

Rules for the deck:
- No card says how many pictures exist, how many days are missing, how long ago a thing was, or how long since the last letter.
- C6 and C7 come from the repo's 111 written prompts. `content` picks them, so none is invented here. Neither may be a `hard` or `gap` kind (P2 S6).
- If a card needs a place name, drop the card.
- Every P2 source S1 to S7 appears at least once.

Day card probe (Part B, one question): after the first-choice question, show C9 as the D3 day card (drawn tiles, date, label, one button reading "Write about this", from D5 section 8). Ask: "Is there anything you would want to know about this card that it does not say?" Do not suggest "how many" or "is there more". D3 guessed a parent may want to know there is more; this records whether they say it unprompted.

## 9. Stimulus: the ask screens, tab strips, quiet screens (Q4, Q6, Q3)

### 9.1 Two scripted ask versions (Q4)

One slide each plus a short spoken script. Same ask, same equal-weight buttons.

Version 1, the P3 and D5 design: three illustrated Asha value cards (D5 section 5: a picture can start a letter; days that matter; ideas for when you are not sure), then the ask card below them.

Version 2, the contrast arm: the ask card first on the screen, the three value cards only after the parent answers.

Shared in both:
- Ask line, from D5 section 6 (Route B body): "{app} can look at the pictures on this phone to show you days that might make a letter. You can pick which ones." On paper the brand shows as "the app". The brand is never typed (CLAUDE.md).
- Buttons: "Choose pictures" and "Not now", same size, same weight, same tone. "Not now" is not grey, not smaller, not below a fold (P3 MT-P3-R7).
- A quiet "Pick one photo instead" line, from P1 9.1 (Route A, no permission). It appears in both versions.
- Nothing says what a parent would miss. No claim that pictures "stay on the phone".

Both versions are shown on a plain printout. No real system dialog is shown. The parent says aloud what they would tap and why. No tap is stored. Under Route A the primer body changes (D5 section 6); the paper test uses the Route B body and notes that.

### 9.2 Three tab strips (Q6)

Each a row of labels drawn on paper. The strip is shown twice per parent, once with Moments and once with Gather, in the alternating order of section 6.

- Strip A: Home, Moments, Book, Me (option A, Home default, recommended by P1, P2, P3 and B1).
- Strip C: Moments, Home, Book, Me (option C, Moments first, the founder's first wording).
- Strip D: Home, Book, Me, with Moments drawn as the top group on Home's screen (option D, the B1 fallback).

No five-tab strip (no fifth tab exists; P1 4.3). First-click question: "Where would you tap to start a letter from a picture?" Expectation question before any explanation: "What do you think this one opens?"

### 9.3 Three quiet screens (Q3)

Three paper sketches of Moments on a day with nothing real from the parent's pictures or days. All follow the P1 M3 and P3 section 9 rule: real cards plus a calm line, no count, no gap.

- Q-A: the written prompt of the day, the age day, and a quiet line "You can still tell Asha about today." (from D5 section 9, adapted).
- Q-B: D5's string as written: "Nothing here yet", with "You can still tell Asha about today" and a button "Tell Asha".
- Q-C: the prompt of the day only, a short card, and the picture entry "Choose pictures", with no line at all.

D5's "Nothing here yet" contradicts P1 M3 ("never says no moments yet or nothing new"). Q-B is in the test so a parent decides, not us.

## 10. Stimulus: words, notifications, email (Q7, Q5)

### 10.1 Word pairs (Q7)

Fixed interface lines on cards. All PROPOSED, to be replaced by lines from `content`. No gendering, no "AI", no machine title.

| Pair | Line one | Line two |
|---|---|---|
| W1 | "A day worth a few words" | "Your weekend" |
| W2 | "Pick one to talk about" | "Write about this" (D5 button) |
| W3 | "A letter from a year ago" | "On this day" |
| W4 | "A good day to tell Asha something" | "Today's highlight" |

Rules: one verb per line, nothing implying anything wrote anything. Do not include a line that sounds curated by software as the right answer.

### 10.2 Lock screen mockups, text only (Q5)

Shown on a plain drawn phone outline. No thumbnail, no image, no counts, no place. Fixed text. The child is shown as Asha, as the app would fill it in.

| Id | Text | Source in the leads | Status |
|---|---|---|---|
| N1 | "Some pictures from the weekend are here" | NS-51 neutral wording; D5 12.1 pictures line | Library-derived. Valid only if the founder rules it (P1 R17, P3 Q-P3-3). Tested for wording only |
| N2 | Title "A day to mark", body "Something to tell Asha, when you have a minute." | D5 12.1 day | From a typed or marked day. No library fact |
| N3 | Title "Asha is a month older", body "A good day to say what this month felt like." | D5 12.1 month | From date of birth |
| N4 | Title "A question for Asha", body "One to answer out loud, or leave." | D5 12.1 idea | From a written prompt |

Order is rotated. For each: welcome, fine or unwelcome; and "would this make you wonder how the app knew something?" N1 may draw "wondered". That is a result, not a fault.

Probes (spoken, no stimulus):
- "If you had already written something that day, how would a second reminder feel?" (B1 principle 4; Storyworth and Timehop reviewers).
- "What would a reminder have to say for you to feel watched?" This replaces v1's N5. Nothing creepy is shown.
- "At what time of day, if any, would one feel welcome?" The app keeps one budgeted nudge a day and quiet hours of 21:30 to 07:00 (P3 10.2, citing NS-32). No time is suggested to the parent.

### 10.3 Email mockup, text only

One email, from D5 12.2, which uses only what the server knows (date of birth) and says "your child", not a name (VOICE.md, CATALOG E-1):
- Subject "A day worth a few words". Preview "Open the book when you like." Body: "A date that matters is coming up. If you would like to write to your child about it, the red circle is ready." Button "Open the book". Close "Did not ask for this? You can ignore it."

Tag on the moderator copy: "not planned for 1.0 (E75; P1, P2, P3, D5); wording only; the plan does not claim any email is allowed". Ask the same mark and the same "how did it know" question. Also ask: "Would you want an email like this at all?" That is a stated-intent answer and is recorded as one.

## 11. Moderator script, exact tasks

Say the words in quotes. Notes in brackets are for the moderator. Total 30 minutes.

### A. Open (4 min)

1. "Thank you for helping. This is about 30 minutes. I will show you made-up pictures and words about a made-up family called Asha. Nothing is yours and nothing is recorded."
2. Read the six consent lines (Shown, Records, Who sees it, How long, Never, Decline). Ask: "Are you happy to go on?" [Tick on paper. If no, thank and stop.]
3. "May I take your card from this week?" [Take the tally card. Do not read it aloud or comment on blanks. A blank row is normal.]
4. "Tell me about the last time you looked at pictures of your child on your phone. Just the habit, not the pictures." [Do not ask what was in them.]

### B. Cards (8 min), Q2

1. Lay out the ten cards in the rotated order. "Each card is a starting point for a short spoken letter. Put them in three piles: I would want to talk about this, maybe, not for me."
2. "Of the 'would want to' pile, pick the one you would talk about first." Note the card id.
3. "What about it made you want to talk?" [One sentence. Do not lead.]
4. "Was there a card that felt like it was checking up on you?" Note the card id.
5. Day card probe: show C9. "Is there anything you would want to know about this card that it does not say?" [Record as close to verbatim as you can; do not suggest an answer.]
6. Do not explain the sources. Do not say which are days or prompts.

### C. Tab strips (3 min), Q6

1. Show the strips in the assigned order and label. "What do you think this one opens?" [Write the words, before any explanation.]
2. "Where would you tap to start a letter from a picture?" Note the tab.
3. "Which of these would you open first, on a day you have a spare minute?" Rank A, C, D.
4. [Do not say which strip is recommended. Do not pitch the tabs.]

### D. Ask screens (5 min), Q4

1. Show the assigned version first. "Say out loud what you would tap and what you are thinking. You are not being tested."
2. Teach-back: "In your own words, what would the app look at if you tapped Choose pictures, and what would it not?" Note: right, partly, or unsure. [Do not correct. This is the main Q4 reading.]
3. Rate: "How comfortable would you feel tapping Choose pictures?" (1 to 5) and "How comfortable would you feel tapping Not now?" (1 to 5).
4. Show the other version. Repeat the teach-back and the two ratings.
5. "Which one felt more like a request and which more like a demand?"
6. "If you tapped Not now, what would you expect to see next?" [Listen for: nothing, a calm line, a retry button. Feeds L8.]

### E. Words (3 min), Q7

1. Lay the four pairs. "For each pair, which feels warmer?" Then: "Which sounds like a person said it, and which sounds like software chose it?"
2. "Is there a word here you would not use for your child's letters?" Note the word.

### F. Nudges (4 min), Q5

1. Show N1 to N4 in rotated order. "Would it feel welcome, fine or unwelcome on your lock screen at a time you did not expect it?" Mark on the sheet.
2. "Which would make you wonder how the app knew something?"
3. Show the email. Same two questions, then "Would you want an email like this at all?"
4. Probes: the second reminder after writing; "what would a reminder have to say for you to feel watched?"; time of day.

### G. Quiet screens and close (3 min), Q3

1. Show the three quiet screens. "You open this on a day when there is nothing special in it. Which of these feels most finished, and which most like something is broken?" Note both.
2. "What would make you close it and not come back?"
3. Close: "Anything you want me to delete from my notes or your card?" Thank them. Confirm the incentive is not tied to any answer.

### Moderator rules

- Never explain a card before the parent reacts.
- Never name a right answer, a recommended tab or a recommended wording.
- Never use the words "streak", "missed", "behind", "waiting", "gap", "daily" or "every day", and never say "ago" as a count.
- If a parent starts describing a real child, a real photo or a real event: "Thank you, I will not note that. Let us stay with the made-up family."
- If a parent becomes distressed, stop, thank them, give support information if they ask, and end the session. Their notes and card are discarded if they ask. Do not probe.
- Stop a session at once if a child is recorded, shown or named. Discard those notes.

## 12. Rating sheet (one per participant, paper)

Participant code: ____ Date (week only): ____ Order: Part C X or Y and label order; Part D V1 or V2.

| Item | Rating or note |
|---|---|
| Tally card: ticks per box T1 to T4 across seven evenings | counts per box; evenings left blank noted as blank, not as zero |
| B: pile for each card C1 to C10 | W / M / N |
| B: first-choice card | id |
| B: felt like checking up | id or none |
| B: day card probe | short note; mark if "is there more" came unprompted |
| C: what each label opens (expectation) | free text, short |
| C: first-click for "start a letter from a picture" | tab |
| C: ranking | 1, 2, 3 for strips A, C, D |
| D: teach-back V1, V2 | right / partly / unsure |
| D: comfort Choose pictures, V1 and V2 | 1 to 5 |
| D: comfort Not now, V1 and V2 | 1 to 5 |
| D: felt more like a demand | V1 or V2 or neither |
| D: expected after Not now | nothing / calm line / retry button / other |
| E: warmer, W1 to W4 | line one or line two |
| E: sounded like software, W1 to W4 | line one or line two |
| F: N1 to N4 and the email | welcome / fine / unwelcome |
| F: wondered how the app knew | id or none |
| F: second reminder after writing | welcome / fine / unwelcome |
| F: wants an email like this at all | yes / no / unsure (stated intent) |
| F: welcome time of day | free text or none |
| G: most finished, most broken (Q-A, Q-B, Q-C) | ids |
| G: would stop coming back if | free text, short |

Scale for 1 to 5: 1 = very uncomfortable, 5 = very comfortable.

## 13. Requirements (MT-R1-Rn)

Each row: Given/When/Then, a test layer and who checks it (COORDINATION section 10 asks for the check). Layer "process" means a checkable step in how the study is run, since no code is built. Where a person agrees to something, the Shown, Records, Never and Decline lines are given.

### MT-R1-R1: Fictional stimuli only
Given the study materials are prepared, when the founder prints or shows any card, mockup, slide or tally card, then every item uses only the fictional family Asha, no real photo, name, place or business appears, and no audio of a child is played or captured.
Layer: process (pre-session checklist, second pair of eyes; checked by `product` before recruiting).
Never: a real family detail, a child's name, an identifying quote in the repo.

### MT-R1-R2: Consent first, six lines
Given a parent has agreed to a session, when the moderator begins, then the moderator reads the Shown, Records, Who sees it, How long, Never and Decline lines and the parent signs a paper tick before any task or tally card is given.
Layer: process. Shown: made-up Asha items and a paper tally card. Records: handwritten coded notes and the ticks. Never: no audio, video, screenshot, child's name or parent's photos. Decline: skip, stop, or ask for deletion, at no cost.

### MT-R1-R3: Stimulus content rules
Given any stimulus, when the pre-session checklist runs, then it contains no count, no relative date, no place the parent did not type, no "waiting", no child name in the email, no em or en dash, no curly quote, no ellipsis character, no emoji, and no claim that pictures "stay on the phone".
Layer: process, plus a grep of this file and the printed text.

### MT-R1-R4: Tally (Q1)
Given each parent holds the paper tally card for seven evenings, when the card is collected, then ticks per box are recorded as counts out of evenings filled in, a blank evening is recorded as blank, and nothing in the card or the session refers to a gap.
Layer: process, then analysis.

### MT-R1-R5: What starts a letter (Q2)
Given the ten-card deck in rotated order, when a parent sorts into three piles and picks one first, then the moderator records the pile and first-choice card for each, and the analysis counts first choices by P2 source without telling the parent the sources.
Layer: process, then analysis.

### MT-R1-R6: Quiet screens (Q3)
Given three quiet-state sketches, when a parent picks the most finished and the most broken, then both picks and the reason for leaving are recorded.
Layer: process, then hand-off to `design` and `content`.

### MT-R1-R7: Ask order and teach-back (Q4)
Given two scripted ask versions with identical equal-weight buttons, when each parent says what would be read and what would not, rates both buttons and says what they expect after Not now, with order swapped by code, then the sheet holds two teach-backs, four ratings and one expectation per parent, and the analysis compares within each person.
Layer: process, then analysis.
Never: any payment or praise linked to tapping Choose pictures; any analysis that treats a higher Choose pictures comfort as a goal.

### MT-R1-R8: Nudge wording (Q5)
Given four lock screen texts and one email text, when a parent marks each welcome, fine or unwelcome and names any that made them wonder how the app knew, then the sheet records those marks and the analysis reports wording with any "wondered" mark first.
Layer: process, then hand-off to `content` and `decision-science`.
Never: a count, a place, a thumbnail, "waiting" or a child name in any email. N1 is not shipped without a founder ruling.

### MT-R1-R9: Tab position and label expectation (Q6)
Given three tab strips and two labels, when a parent says what a label opens and where they would tap, then the moderator records the expectation words before any explanation. The result is an input to the founder's ruling (P1 Q-P1-1) and is not a vote.
Layer: process.

### MT-R1-R10: Warm words (Q7)
Given four pairs of fixed lines, when a parent picks the warmer line and the one that sounds like software, then the sheet holds both picks and any word they would not use.
Layer: process, then hand-off to `content`.

### MT-R1-R11: No recording, notes outside the repo
Given a session ends, when notes are stored, then raw notes and cards stay on paper or in the founder's private store, only coded findings enter `docs/research/studies/2026-11-moments/FINDINGS.md`, and the code key and paper are destroyed on the stated date.
Layer: process.

### MT-R1-R12: Stop and distress
Given a parent shows distress, names a real child, or a child is present on screen or in audio, when it happens, then the moderator pauses or stops, does not note the detail, and discards notes if the parent asks.
Layer: process.

### MT-R1-R13: Findings reach the backlog
Given FINDINGS.md is written, when `product` reviews it, then each finding is a backlog proposal with the source code, its strength and an owner agent, and `USER_RESEARCH.md` marks each related belief evidenced, assumed or contradicted.
Layer: process.

## 14. PROPOSED pass and stop lines (guesses, not facts)

These are PROPOSED guesses chosen to make a decision readable with five to eight people. They are not statistics and no sample this small supports a rate. Product and decision-science own the final lines. Treat each as a trigger to talk, not a result.

Pass (move the idea to design with a flag):
- Q1: T1, T2 or T3 is ticked on most filled evenings for most parents. If T4 ("nothing in particular") is the usual row for most parents, say plainly that Moments will be thin on most days (P2 stop line) and bring it to the founder. This is a finding, not a failed study.
- Q2: one source is first choice for a clear majority who completed, and no card is called "checking up" by more than one parent.
- Q3: one quiet screen is "most finished" for most parents, and no screen is "most broken" for a majority.
- Q4: most parents can say right or partly what is read and what is not, and Not now comfort is equal to or above Choose pictures comfort for most. If the two versions look the same, choose the shorter one.
- Q5: a wording most parents mark welcome or fine, and that nobody marks "wondered how the app knew".
- Q6: P1's own proposed bar for a default switch: at least 4 of 5 would open Moments first on strip C. Below that, strip A stands. That bar is P1's guess, not data.
- Q7: one line in each pair is warmer for most and not called "software" by most.

Stop (pause the idea, bring it to the founder):
- Any parent, on any card or nudge, says it feels like being watched.
- Any parent calls Not now hard to tap in either ask version.
- Any nudge, other than N1, is marked unwelcome by more than one parent. N1 unwelcome is a finding for L4, not a stop.
- Any parent expects Moments to show a count of what they missed.
- Any session breaks the no-recording or fictional-only rule. Stop the whole study and report.

Because the sample is small, a single strong objection counts, a single strong liking does not.

## 15. Analysis template

One FINDINGS.md per study, no identifying detail. Proposed layout:

```
# Study: Moments R1
Dates (week of): 
Participants completed: N of planned (tally: N of planned)
Deviations from plan:

## Q1 Tally (counts out of evenings filled in)
| Code | Evenings filled | T1 | T2 | T3 | T4 |

## Q2 First choices by source
| Source (S1 to S7) | First choice count | Pile W count | Checking-up marks |

## Q3 Quiet screens
| Sketch | Most finished | Most broken |

## Q4 Ask
| Code | Teach-back V1 | Teach-back V2 | V1 choose | V1 Not now | V2 choose | V2 Not now | Order | Demand pick | After Not now |

## Q5 Nudges
| Id | Welcome | Fine | Unwelcome | Wondered |

## Q6 Tab position and label
| Strip | Rank 1 count | Expectation words (Moments) | Expectation words (Gather) |

## Q7 Words
| Pair | Warmer | Software feel | Words to avoid |

## Per-finding rows
| Id | Finding | Evidence (codes) | Strength: signal / weak / one voice | Implication | Owner |
```

Rules: report counts as counts out of those who completed, never as percentages. Mark each finding "signal" (several parents, same direction), "weak" (two parents) or "one voice". One voice never changes a requirement alone, except for a safety or privacy concern, which is escalated at once. Findings are framed as what parents prefer and do, never as gaps or failures.

Where a result bears on a lead's assumption, name the lead and section (for example "P2 F6", "D3 guess in 16"). Section 19 lists them.

## 16. How findings flow to the backlog

1. Analysis writes FINDINGS.md under `docs/research/studies/2026-11-moments/`.
2. The user-research agent updates `USER_RESEARCH.md` and marks each related belief evidenced (with this study), assumed or contradicted.
3. A backlog proposal goes to `product`, one row per decision, naming the owner:
   - tab position and empty state: `product`, `design-systems`.
   - ask order and layout: `product`, `design-systems`, `legal` and `compliance` for the permission text.
   - words: `content`.
   - nudge wording: `content`, plus `decision-science` for any metric that should exist.
4. This plan edits neither CLAIMS.md nor BACKLOG.md. An integrator or `product` raises those after review.
5. Any finding that touches a founder-owned reversal is listed as a founder decision. The set, from P1 section 11 and P3 section 3: the three-tab ruling, the only-Home-starts-a-letter rule (J3 in the repo table, J4 in the brief), K-02, BL-1305, ML-3, ML-6, NS-51-R1, R8 and R11, and E75.

## 17. What the study cannot tell us

- It cannot prove daily return. People say what they feel in a room; return is behaviour over weeks. The tally shows only how often a parent says a day was worth a letter. Only a live build with opt-in, content-free analytics could start to show the rest (P3 section 11).
- The tally cannot say whether Moments would have shown a card on those days. A day a parent would talk about may have no pictures in a form Moments reads, or a source the app cannot know.
- It cannot tell us whether parents will grant real photo access to a real app. Saying "I would tap Choose pictures" is not tapping it. The teach-back measures understanding, not behaviour.
- It cannot tell us how a real library of messy photos will look. Asha cards are tidy by design, and the drawn day card cannot test a real thumbnail (the ML-6 reversal).
- It cannot test the Apple system picker, or its machine titles. We use none of it. Route A and Route B findings are tagged and not mixed.
- It cannot test voice recording, which is the heart of the product, because no child is recorded and no real memory is used.
- It cannot compare two ask versions across people, only within each person, and with small numbers.
- It cannot test notification behaviour on a real lock screen over days.
- It cannot answer L3 (does the server know typed days) or any legal question. Code and counsel do.

## 18. Honest limits

- Five to eight people is a small sample. The skill suggests 8 to 12 for a diary study and 15 to 30 for a preference test. Counts show signals and objections, not rates. Do not quote a percentage.
- Parents recruited by the founder may be kind. Moderator tone matters; the script asks for dislikes on purpose.
- Order effects remain even with swapping. With few people, the swap may not balance.
- N1 (library-derived wording) is shown in rotation, never first, so it does not colour the rest.
- The ask wording now uses D5's text, which `content` and counsel have not cleared. It may change the result.
- The pass and stop lines are guesses and were chosen before data, so they cannot be called validated.
- Leads cite ML-3, ML-6, NS-32 and NS-51 second hand. If those rules read differently, the stimuli that touch them change. The plan can be wrong by inheritance.
- The founder or another human runs the sessions, so moderator skill varies and cannot be checked by me.
- I read the leads at the shas in section 22. If a lead changes, this plan must be re-checked.

## 19. Lead assumptions this study tests, and those it cannot

| Lead | Assumption the lead makes | Question | How it is tested | Can this study settle it? |
|---|---|---|---|---|
| B1 | A card sort of eight Asha cards shows whether day, prompt or photo is the reason to speak (open question 7) | Q2 | Ten-card sort, mapped to S1 to S7 | Signal only |
| B1 | A second tab beats a Home card group, by a click test (section 13 guess) | Q6 | Strips A and D, first-click | Signal only |
| B1 | A weekly opt-in email is wanted (Q5 default yes) | Q5 | One email text plus "want it at all" | Stated intent only; L2 stands |
| P1 | Moments cannot honestly be a daily reason; Home's prompt is (6.1, Q-P1-7) | Q1 | Tally | Partly. It gives a base rate, not a return rate |
| P1 | If at least 4 of 5 would open Moments first, switch the default (4.3) | Q6 | Strip C ranking | Signal only. P1's bar is a guess |
| P1 | A parent with no access still sees real things, so J5 passes (9.4) | Q3, Q4 | Quiet screens and the Not now expectation | Partly |
| P1 | "Choose" is the verb and one day is the object (J2, J4) | Q6 | Expectation words | Weak |
| P2 | Real sources are rare on most days (F6) | Q1 | Tally | Yes, as a base rate |
| P2 | Four slots and one screen of Recent is not a feed (6.2) | Q2, Q3 | Sort and quiet screens | Weak |
| P2 | A letter from this day earlier is the strongest pull (9) | Q2 | C5 first-choice count | Signal only. The card is made up, not the parent's own letter |
| P2 | Five parents using a prototype with Asha content for two weeks (R41, Q8) | Q1 | Replaced by the tally, section 7 | Replaced: the prototype tests only the question card |
| P3 | Value before the ask lets a parent understand the ask (6.3, 7.2) | Q4 | Teach-back, V1 versus V2 | Signal only |
| P3 | "Not now" as large and calm as the yes (MT-P3-R7) | Q4 | Comfort ratings and the demand pick | Yes, as a signal |
| P3 | A parent who says Not now is not worse off (11.2) | none | Needs server aggregates | No |
| D3 | A parent may want to know there is more (guess in 16) | Q2 | Day card probe, unprompted | Signal only |
| D3 | "A letter is here" reads as celebration, not pressure (guess in 16) | none | Not shown in this version | No. Add a card if D3 supplies a drawn row |
| D5 | "Gather" tests best with parents (guess in 18) | Q6 | Moments versus Gather expectation words | Weak. Not a name vote |
| D5 | The primer wording lifts allow rates (guess in 18) | none | Not tested, by design (P3: never optimise grants) | No, deliberately |
| D5 | Local push day, month and idea lines are welcome | Q5 | N2 to N4 marks | Signal only |
| D5 | "Nothing here yet" is acceptable (section 9) | Q3 | Q-B | Yes, as a signal |

## 20. Open questions, recommended default and deadline

1. Who runs sessions? Default: the founder, with a second person as note-taker if possible. Deadline before recruiting.
2. Incentive. Default: a small thank-you, unrelated to answers. Founder decision, before recruiting.
3. Final ask, label and nudge strings. Default: `content` supplies them; the paper test uses D5's words as written. Before session one.
4. Is N1 acceptable to show at all, given L4? Default: yes, tagged "wording only"; drop it if counsel objects. Before session one.
5. Is a plain printout of the ask screen enough, or does `design` want a click-through? Default: printout. Before session one.
6. Retention date for paper notes and tally cards. Default: 30 days after the write-up is filed. Founder, before recruiting.
7. Does the founder want strip D and the Gather label in the test? Default: yes, both, because P1, P2 and D5 disagree. Before session one.
8. Reconcile with PR #1270 and the feasibility, privacy-and-constitution and design-concept docs when they appear. Default: the user-research agent re-runs section 3 against them. Before filing.

## 21. Dependencies

- Founder: recruitment, incentive, who moderates, consent record store, retention date.
- `content`: strings in sections 9 and 10, and the repo prompts for C6 and C7.
- `design-systems`: tab strip artwork, the drawn card tile and the D3 day card sketch.
- `legal` and `compliance`: consent lines and the ask wording.
- `product`: review of this plan in a PR before any recruiting, per the user-research rules.
- `decision-science`: only if a Q5 result suggests an event, and only the existing opt-in allowlist.

## 22. Verified, unverified, guess

Verified (read this session): the lead docs at the heads below; `docs/research/USER_RESEARCH.md`; `packages/content/VOICE.md`; the user-research skill; `docs/agents/COORDINATION.md` section 10; the brief at `/home/claude/moments-brief.md`.

Heads read: b1 6dbc5b5, p1 b68faf9, p2 0ec8751, p3 d9a8d63, d3 0a3e783, d5 4a88615, and v1 of this plan c94795b.

Unverified: everything in section 2 under "Still not read". ML-3, ML-6, NS-32 and NS-51 as the leads quote them. Whether the server holds typed days (L3). Whether Route A needs any permission.

Guess: all pass and stop lines, all session timings, the card texts, the tally boxes, the word pairs, and the retention date. No number here is a measurement.
