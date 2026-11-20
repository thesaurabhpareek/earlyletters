# Feature opportunities: what the app is not yet doing (OPP)

Owners: `product` and `user-research` (wave 3, brief 6). Written 20 Nov 2026 (UTC) on branch `docs/locked-pack-inputs-20nov`. Docs only: nothing here is built, no recruiting has started, no decision is recorded. Karma rules every proposal through `GAP-LOG.md`; the founder decides section 9.

I am a Claude role, not a licensed researcher, lawyer or engineer. I did not talk to any parent. Nothing here is observed data from our own families (`docs/research/USER_RESEARCH.md` line 3; `functions/research-validation.md` line 5). Every score below is a judgement and is labelled so. Example family: the fictional Asha.

Tags: REPO (read in the repo this session), VERIFIED (read on a page this session, URL given), UNVERIFIED (not read, or only seen second-hand), PROPOSED (mine).

---

## 1. What I read, and what I did not

Read this session:
- `tools/review/wave3-briefs.md` (brief 6), `tools/review/gap-agents-common.md`, `20-founder-direction-20nov.md` (in full), `functions/BRIEF.md`, `functions/research-validation.md` (in full).
- `12-parked-and-not-built.md` (in full), `00-product-frame.md` master index (lines 150 to 186), `07-remaining-capability-rows.md` section 6 (lines 565 to 589), `10-reading-and-family.md` NS-23 (lines 354 to 372) and NS-30, NS-31 (lines 943 to 969), `06-firsts-sealed-letter-quick-capture.md` lines 1 to 60.
- Design prototypes: `/home/claude/wt/E/docs/design/e2e/A-capture/DESIGN.md` A-S01 (lines 213 to 262), A-S13 (line 469), section 6 card gaps (lines 551 to 576). I looked at E-foundations lines for first run only by grep.
- `docs/research/COMPETITIVE_RESEARCH.md` lines 1 to 80 (1 Oct) and `docs/research/competitors/adjacent-and-ux-benchmarks.md` lines 1 to 60 (3 Oct): repo documents, dated; their facts are as good as their own tags, not re-verified by me.
- Web, this session: Apple Journal App Store page (https://apps.apple.com/app/journal/id6447391597); 9to5Mac on iOS 26 Journal (https://9to5mac.com/2025/06/17/apples-journal-app-is-coming-to-ipad-and-mac-with-big-upgrades/); Apple, "Creating controls to perform actions across the system" (https://developer.apple.com/documentation/widgetkit/creating-controls-to-perform-actions-across-the-system.md); Remento Baby Book page (https://landing.remento.co/babybook/).

Not read or not reachable:
- `functions/photos-and-suggestions.md` (agent 5), `days-library.md`, `notification-catalogue.md`, `cultural-background-data.md` (agents 1 to 3): not on disk when I wrote this. I do not duplicate them; section 6 item 1 points to agent 5.
- Cards 01 to 05, 08, 09, 11 in full; only the lines named above. NS-04 (hands-free spike) and NS-35 (one start) were read only through citations in cards 06, 07 and 12.
- `docs/BACKLOG.md`, `COORDINATION.md`, `VOICE.md`. Backlog ids below are ones other files cite; every other link says "new row needed".
- Tinybeans' site (fetch blocked), Dearest (a web search returned only unrelated apps; I rely on the repo's 1 Oct research for it), Storyworth, Qeepsake and Day One first-hand. Competitor facts from the repo files carry their dates.
- No app was run, no phone used, no store listing screenshots inspected.

---

## 2. Coverage check: what is already carded, so it is not "found" twice

The founder's list (direction section 6.4) mixes things that exist as cards with things that do not. Honest position:

| Direction 6.4 item | Already a card or row? | Where (REPO) | Consequence |
|---|---|---|---|
| 1 Picture-first and Journaling Suggestions | Picture start built (NS-01); suggestions are new | frame index rank list; direction section 6 | Agent 5 and proposed NS-49 own the detail |
| 2 Quick capture outside the app | Yes, parked behind a spike | NS-04, NS-06 C, parked rows C-09, C-10, C-30 (`12-parked...` lines 13, 14, 20) | A decision is needed on the spike's order, not a new card |
| 3 The child's own words and voice | Partly: NS-16 "Someone else speaks" signs a letter as another person | frame index rank 29 | Possibly already possible; needs a read of NS-16 (not read) |
| 4 Relatives add | Parked | NS-03 pilot, NS-26, NS-28 | Stays parked; the pilot is the test |
| 5 On this day, yearly look back | "On this day" is NS-23 (rank 21, locked); year look back is NS-24 (rank 26) | `10-reading...` line 354 onward | Not an opportunity: it is carded. Only "the same question again" is new |
| 6 Share a letter | NS-05, locked | frame index | Carded |
| 7 Printed book | NS-30 parked; the file is NS-07 C28 | `10-reading...` lines 943 to 956 | Carded; waits on entity and partner |
| 8 Letters to open later | NS-06 B, rank 31 | frame index | Carded; study S5 |
| 9 Share sheet into the book | Parked as G9 "Bring in letters from another app"; voice-memo import is NX-27, UNVERIFIED on `develop` | `07-remaining...` line 576 | Parked with "a parent study showing arrivals with history" as the reopen test |
| 10 Apple Watch | Parked, rank 49 | `12-parked...` line 20 | Parked |

So of ten items, one is genuinely new (suggestions), five are carded or locked, four are parked with a stated reopen test. The useful work is therefore ranking the parked ones by their reopen tests and finding what none of the files name.

---

## 3. Long list

Source column says where the candidate came from: F = founder (direction 6.4), K = the cards, C = competitors read this session, P = friction in the prototypes.

| Id | Candidate | Source | State today |
|---|---|---|---|
| OPP-01 | Picture-first start, plus Apple's Journaling Suggestions picker | F, C | New (suggestions); NS-01 built |
| OPP-02 | Lock Screen and Control Center control, Action button, Home Screen prompt widget (opens Ready, never records) | F, C, K | Parked behind NS-04 |
| OPP-03 | The same question again, a year on (a prompt the parent answered earlier is offered again on the same day later; no words from the old answer are used) | K | New |
| OPP-04 | The child's own words: a prompt set that asks the child, answered in the child's voice, signed as the child | F, K | Partly possible through NS-16 (UNVERIFIED) |
| OPP-05 | Bring in what the parent already has: a voice memo, a voicemail, a photo of a drawing | F, C | Parked (G9, NX-27) |
| OPP-06 | A relative adds an answer to a question the parent chose | F | Parked (NS-26, NS-28, pilot NS-03) |
| OPP-07 | "Who was there": a typed list of people on a letter, for Find | P | New |
| OPP-08 | A calmer Review: the same Keep path with fewer controls on first view | P | New (design, not a feature) |
| OPP-09 | After Keep, one quiet next step the parent chose in advance (for example, add a picture) | P | New; high nag risk |
| OPP-10 | Read the year back | F | Carded NS-24 |
| OPP-11 | On this day | F | Carded NS-23 |
| OPP-12 | Share one letter | F | Carded NS-05 |
| OPP-13 | Letters to open later, Firsts | F | Carded NS-06 |
| OPP-14 | A printed book | F | Parked NS-30 |
| OPP-15 | Apple Watch quick capture | F | Parked |
| OPP-16 | Video clips beside voice (Remento records voice or video) | C | New; not recommended |
| OPP-17 | A past-letter Home Screen widget | K | Parked C-30 |
| OPP-18 | Streaks, insights, goals (Apple Journal's insights view and streak widget) | C | Refused |
| OPP-19 | Machine-written entries, captions, summaries (Remento Speech-to-Story, Day One Gold, FirstChapter) | C | Refused |

What the competitors show, from pages read this session:
- Apple Journal lists suggested moments (outings, photos, workouts, media), a Home or Lock Screen widget showing a streak or changing prompts, audio with automatic transcription, reminders for writing time or "when new suggestions are ready", a passcode or Face ID lock, and an Insights view of streaks (App Store page, VERIFIED). iOS 26 added multiple journals, inline images, drawings and handwriting, a map view, better search, and recovery of deleted entries (9to5Mac, VERIFIED). Their reminders when suggestions are ready is the nudge the founder liked; the streak and insights parts are what we refuse.
- Remento's baby book: parent uploads a photo, then records by voice or video answering guided questions; pages link by QR to each recording; unlimited collaborators; a gift option (Remento page, VERIFIED, no price listed on that page). The repo's 3 Oct research adds that its Speech-to-Story "writes the story" (REPO, V-tagged there). It confirms that pictures plus voice plus relatives is where the category is heading; our difference is that we never write.
- Dearest (REPO, 1 Oct, not re-read): imports voicemails, sealed letters, Home Screen widgets, legacy contact on its paid tier.
- Apple controls (VERIFIED): a control can run an action or open the app to a specific view, from Control Center, the Lock Screen or the Action button, and can require device authentication and redact text while locked. Minimum iOS is not stated on that page; UNVERIFIED here.

Friction in the prototypes (A-capture DESIGN.md, read this session):
- Home (A-S01) stacks a switcher, dateline, greeting, typed-day line, prompt, "Another thought", at most one slip, the Plus line, Speak and Type, "Start from a photo" and "Not much today" (lines 213 to 223). At AX5 on a 375 pt phone these stack full width. Picture start is a quiet 44 pt link under the twins, which the founder now wants as a first-class start (direction 6.4 item 1).
- Review's scroll carries at least ten numbered items before "Let it go" at the end (A-S07 lines 355 to 357; card gap G-09). For a one-handed tired parent that is the longest screen on the path to Keep.
- After Keep (A-S13) is a single moment; nothing else is offered and nothing should be, but the parent is left at the point of most feeling with only Home behind it. I treat it as a friction to look at in the study, not a place to add a prompt (OPP-09).
- Picture handling has many open edges (card gaps G-08, G-14, G-15, G-19: a picture draft's waiting card, picture on the recording screen, the primer with a picture pending). Picture-first makes these first-run problems, not edge cases.

---

## 4. Filter by the constitution and the content rules

Rules applied (CLAUDE.md; direction section 2): the machine may remove and repair, never add meaning; no feature writes, rewrites, summarises or shapes a person's words; no streaks, points, badges or counts of gaps; no fear, guilt or loss language; never imply AI writes; local notifications only, one budgeted a day (NS-32); no read of the photo library or of any picture the parent did not pick (NS-01); nothing donated to Spotlight or Siri (ruling D3, `12-parked...` line 9); nothing says "coming soon".

| Id | Verdict | Condition or reason |
|---|---|---|
| OPP-01 | Pass with conditions | Level 2 only; the label is the parent's to edit; anything else Apple passes is shown, kept only if kept, never used for a nudge (direction 6.3). Suggestion notifications raised by Apple are Apple's, not ours: UNVERIFIED whether they can open our app |
| OPP-02 | Pass with conditions | Opens Ready only; never records or keeps (NS-35-R4); counts as a doorway on the closed source list (NS-35-R3); lock-screen text neutral; "unlock first" default (NS-04 Q2 as cited) |
| OPP-03 | Pass with conditions | Selects by date and prompt id, never reads or quotes the old answer in the offer; hard-day prompts excluded as NS-23 does; one slip only (frame slip rule); never worded as "you missed" |
| OPP-04 | Pass with conditions | A prompt set is content, not writing; the child's words are cleaned only by the existing edit types and verified; a child's voice raises counsel Q45 (a baby's voice is cited there); signed as the child via the existing From control, so no new author concept |
| OPP-05 | Pass with conditions | The parent's own recording; no machine caption; third-party voices (a relative's voicemail) need counsel (Q48 as cited for another adult); a share-sheet receiver is a new door that must follow NS-35 |
| OPP-06 | Pass with conditions | Parked on counsel and security; no change here |
| OPP-07 | Pass with conditions | Typed by the parent, like a Firsts label; names of other people are L4 data; no machine detection of faces or people |
| OPP-08 | Pass | A design change only; no new feature |
| OPP-09 | Fails the spirit of the rules unless the parent chose it | A prompt after Keep is a second ask in the most emotional moment; do not draw it before the study says parents want it |
| OPP-10, 11, 12, 13 | Pass | Already carded and locked |
| OPP-14, 15, 17 | Pass, parked | As in `12-parked...` |
| OPP-16 | Not recommended | Video of a child is the heaviest data we could hold; storage, label and counsel all change; no evidence parents ask |
| OPP-18 | Refused | Streaks and goals are banned; Apple Journal's insights view is exactly what we do not copy |
| OPP-19 | Refused | Writes a person's words |

---

## 5. Ranking

Method (PROPOSED, a judgement, not data): value 1 to 5 (how often a tired parent would feel the difference, and how close to the job in the frame), effort 1 to 5 (1 is a small PR or two; 5 is a quarter; my estimates [E], the backlog sizes rule), risk 1 to 5 (privacy, store review, constitution, new native target). Score is twice value minus effort minus risk; ties go to lower risk. Items that are already carded are shown for completeness and are not re-ranked against the new ones.

| Rank | Id | Value | Effort | Risk | Score | Why this value | Main risk |
|---|---|---|---|---|---|---|---|
| 1 | OPP-01 | 5 | 3 | 3 | 4 | The founder's first ask; pictures are the thing parents already take; Apple's flow needs no library permission (direction 6.1, VERIFIED there from Apple pages) | Entitlement and iOS floor unknown; picture edges (G-08, G-14, G-15, G-19) |
| 2 | OPP-03 | 4 | 2 | 2 | 4 | Cheap, content and one selection rule; turns a habit into a comparison the parent makes in their own head; no permission, no native work | A bad-moment guardrail as in NS-23; must not read as counting |
| 3 | OPP-02 | 5 | 3 | 3 | 4 | The hardest moment is starting with a baby in one arm and a locked phone; every competitor's widgets target this | NS-04 spike must pass first (0 unmeant recordings in 200 fires); new widget extension |
| 4 | OPP-04 | 4 | 2 | 3 | 3 | A child's own sentence is the thing parents say they lose (HYPOTHESIS, no evidence yet); mostly content plus the existing From control | Counsel on a child's voice (Q45); transcription of a small child's speech is poor, so the recording may carry the letter alone |
| 5 | OPP-05 | 4 | 3 | 3 | 2 | Parents already hold recordings and messages in other places; closes the "history" gap that stops a new book feeling like the whole book | A share-sheet receiver is a new door; third-party voices; format variety UNVERIFIED |
| - | OPP-06 | 5 | 5 | 5 | 0 | Grandparents are the strongest hope (frame persona P5) | Audio leaves the phone; counsel and security; the pilot is the test |
| - | OPP-07 | 3 | 3 | 3 | 0 | Helps Find for a name that is not in the words | Third-party names are data; may duplicate Find |
| - | OPP-08 | 4 | 2 | 1 | 5 | Shorter Review is a design lead task; not a feature; I list it because it scores best and costs least | None beyond design time |
| - | OPP-15, OPP-14 | 3 / 4 | 5 / 5 | 4 / 4 | -3 / -1 | Parked | As parked |

OPP-08 scores highest but is design work, so it goes to `design-systems` as a design need (section 8), not a card. Excluding it, the top five new opportunities are OPP-01, 03, 02, 04, 05.

Sensitivity: if the NS-04 spike fails, OPP-02 drops to a plain Home Screen widget that only opens the app (no capture), value 3. If Apple's entitlement needs approval that we cannot get, OPP-01 falls back to level 1 (picture-first start) and stays value 4. Neither change moves OPP-03 up past them; it stays the cheapest.

---

## 6. The top five: one-page outlines and the cheapest research test

Each outline is a proposed card shape (README "How to read a card"): who and when, what, not in scope, happy path, label effect, Free or Plus, and four door lines where a person agrees to something (PRIV-R21; `COORDINATION.md` section 10, cited via the BRIEF, not read in full). Free or Plus: every one is free, as ruling T2 says nothing shipped free moves behind Plus. None is a requirement until Karma rules it in and the founder approves it.

Research rules that apply to all five tests (from `research-validation.md`): adults only; no real letter, voice, picture or child name in the room; the Asha book only; notes by code; results "x of n", no percentages under 20; a plan PR first; counsel's read of scripts before any contact; a parent who raises distress stops the session (FR-RSH-21).

### 6.1 OPP-01 Picture-first start and suggestions (proposed card NS-49, owned in detail by agent 5)

- Who and when. A parent who has just taken a picture of Asha and wants to say what it was.
- What. Level 1: "Start from a photo" becomes a first-class start on Home (today a quiet 44 pt link, A-S01). Level 2: Apple's suggestions picker; the parent picks one, the app receives only that. One picture per letter stays for 1.0 (NS-01).
- Not in scope. Reading the library, scenes, faces, any machine caption or title, a nudge made from a picture, several pictures per letter, anything from level 3.
- Happy path. Home, Start from a photo, Apple's picker or the suggestions list, the parent chooses, Ready appears with the thumbnail, the parent speaks, Review, Keep.
- Label effect. None for level 1; level 2 to be confirmed by agent 5 and compliance (Apple says no permission is needed, direction 6.1).
- Door lines. Shown: that the picture stays on the phone and Apple's picker sees the library, not us. Records: the chosen picture and its label. Never: any picture the parent did not pick. Decline: closing the picker writes nothing.
- Cheapest test (S-B1 already exists, README line 153): add two questions to the planned five-parent photo study. Past behaviour only: "The last time you took a picture of {child} that you wanted to remember, what did you do with it?" and "Did you ever want to say something about it and not?" Pass: 4 of 5 name a picture they wanted to say something about and did not. Hold: 2 or 3 of 5. Stop: any parent shown a suggestion list who reads it as the app watching. Cost: 15 minutes added per session, no build.

### 6.2 OPP-03 The same question again (PROPOSED new card, S size)

- Who and when. A parent opening Home on a day when, a year or six months earlier, they answered a prompt.
- What. Home's prompt line offers the same prompt again on that day, chosen by prompt id and date. It never shows, quotes or paraphrases the earlier answer (NS-23 already offers the earlier letter itself as a slip; this is the prompt, not the letter).
- Not in scope. Comparing the two answers, counting, "you said" lines, notifications about it, any machine summary, hard-day prompts.
- Happy path. Home shows the usual prompt; today it is the one asked on this day last year; the parent speaks as usual.
- Label effect. None.
- Door lines. None needed: nothing is agreed to and nothing new is stored (it reads prompt id and date from existing letters).
- Cheapest test. Paper, 5 parents, 10 minutes, Asha fixture: show the Home with the repeated prompt and ask "What do you think this is, and would you answer it?" then "Does anything on this screen make you feel you owe the app something?" Pass: 4 of 5 understand it unaided and none say they owe anything. Stop: any one reads it as a test of how the child has changed or as a count. It can ride inside study S1 task set A (research-validation section 4) at no extra session.

### 6.3 OPP-02 A doorway on the lock screen (reopens NS-06 C and C-10; depends on NS-04)

- Who and when. A parent with a baby in one arm, who wants Ready in one touch from a locked phone, a Lock Screen control, Control Center, or the Action button.
- What. A control that opens the app to Ready (not recording) after device authentication, with redacted text while locked. Apple's documentation confirms controls can open the app to a specific view and can require authentication (VERIFIED, URL in section 1). A Home Screen widget that shows only the day's prompt and opens Ready is the same door, drawn larger.
- Not in scope. Recording from the lock screen, any letter text on a widget (C-30 stays parked), Siri phrases, donations to the system (D3), Apple Watch.
- Happy path. Lock Screen, tap the control, Face ID, Ready with the usual primer rules, the parent taps to start.
- Label effect. Needs the security architect's read of plist and entitlement changes (`12-parked...` line 14); likely none for privacy, to be confirmed.
- Door lines. Shown: that the control opens Ready and records nothing. Records: nothing. Never: a recording started by the control; letter words on the lock screen. Decline: not adding the control.
- Cheapest test. Two parts. (a) The spike NS-04 as written; do not re-plan it. (b) A demand check that needs no build: in each S1 or S2 session ask "In the last week, was there a moment you wanted to start a letter and your hands were full or the phone was locked?" and note the answer as yes or no. Pass: 3 of 5 say yes. If fewer, the door stays parked even if the spike passes.

### 6.4 OPP-04 The child's own words (PROPOSED new card, S to M)

- Who and when. A parent of a toddler or older child, at the moment a child says or answers something worth keeping.
- What. A prompt set written for the child to answer ("What was the best part of today?") in `packages/content`, and a clear path to sign the letter as the child through the existing From control (NS-16, whose built behaviour I did not read; UNVERIFIED that it can name the child). The parent holds the phone; the app does not interview the child.
- Not in scope. A child-facing screen, a child account, a game, a voice-only mode that plays to the child, any editing of the child's words beyond the existing edit types.
- Happy path. Home shows an "ask {child}" prompt in the toddler or child age band; the parent speaks the question and holds the phone; the child answers; Review; Keep, signed as {child}.
- Label effect. Counsel on a child's voice (Q45, as cited by research-validation; counsel must confirm).
- Door lines. Not a new agreement if the From control is reused; otherwise Shown, Records, Never, Decline to be drafted with NS-16's.
- Cheapest test. A 15 minute interview, 5 parents of children aged 2 to 5, about past behaviour only: "In the last month, did {child} say something you wanted to keep? What did you do?" Count "wrote it down, texted it, recorded it, did nothing, forgot". Pass: 3 of 5 had a moment and kept it nowhere or in a place they cannot find. No child is present or recorded (FR-RSH-14).

### 6.5 OPP-05 Bring in what you already have (reopens G9 and NX-27; parked row 6.6)

- Who and when. A parent who has voice memos, voicemails or a photographed drawing about the child sitting in other apps, usually in the first month of using ours.
- What. A way to add one existing recording or picture as a letter's source, through the system's own file or share picker. The words are cleaned only by the existing edit types.
- Not in scope. Reading another app's library, bulk import, other apps' export formats (UNVERIFIED, `07-remaining...` line 576), a share-sheet extension in the first cut (I could not read Apple's share-extension documentation this session, so its limits are UNVERIFIED), any recording of a third party without counsel.
- Happy path. Home, a quiet "Bring in" start, Apple's picker, the parent picks a voice memo, Review shows it with its words, Keep.
- Label effect. None if the picker is Apple's and only the chosen file arrives; to be confirmed with compliance.
- Door lines. Shown: that only the chosen file comes in. Records: the file as the letter's recording. Never: anything not chosen. Decline: closing the picker.
- Cheapest test. The reopen test already written is "a parent study showing arrivals with history". One question in S1: "Where do you keep recordings or messages about {child} today?" Count places, not content. Pass: 3 of 5 name two or more places outside any journal. Do not show or ask for a recording.

Common to all five: no prototype work beyond what S1 and S2 already plan; no spend; about 15 minutes added per session; founder or human researcher runs it (RQ-11 in research-validation).

---

## 7. Not recommended, and why

- Video (OPP-16): heaviest data on the phone, changes the label, no evidence anyone asks.
- Streaks, goals, insights (OPP-18): banned, and the one thing in Apple Journal we copy none of.
- Anything that writes, titles, captions or summarises (OPP-19): the constitution.
- Growth and health tracking: out of the job (direction 6.4).
- A prompt after Keep (OPP-09): hold until a study shows parents want a next step; otherwise it is a nag in the best moment.

---

## 8. Function requirements

Priority: P0 with RR-4 reason (a) a promise, (b) a legal or store duty, (c) the core loop; else P1, P2. Links: card rows, e2e screen ids, backlog rows (existing ones that other files cite, else "new row needed"; none above BL-999).

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-OPP-01 | Given an opportunity is proposed, When it is written up, Then it passes the constitution filter in section 4 first, names the card or parked row it reopens, the reopen test already written there, and the cheapest test; an item that fails the filter is recorded as refused, not scored | `12-parked...`; NS-35-R3; new card row needed | P1 | `product` | Section 4; `12-parked...` standing lines |
| FR-OPP-02 | Given OPP-01 is ruled in, Then picture-first start is a first-class start on Home with Speak and Type kept as equal twins, and no more than one slip shows (frame slip rule) | NS-01-R1, R19, R20a; A-S01, A-S03; BL-931 | P1 | `mobile`, `design-systems` | A-S01 lines 213 to 223; direction 6.1 |
| FR-OPP-03 | Given a suggestion or picture is chosen, Then only the chosen item reaches the app, anything beyond the picture is shown to the parent, kept only if kept, and never used to choose a nudge | NS-01; NS-32; A-S03; new row needed | P0 (a) | `mobile`, `privacy` | Direction 6.3; NS-01 "never" line |
| FR-OPP-04 | Given OPP-03 is ruled in, When Home chooses a prompt, Then it picks by prompt id and date only, never reads, quotes or paraphrases an earlier answer, never shows two slips, excludes hard-day prompts, and has no count or comparison wording | NS-23 (rules block); A-S01 states; new row needed | P1 | `content`, `mobile` | NS-23 lines 354 to 372 |
| FR-OPP-05 | Given a doorway is added after the spike (OPP-02), When the control is used on a locked phone, Then it authenticates first, opens Ready only, starts and keeps nothing, and shows no letter words or child name while locked | NS-35-R3, R4, R7; NS-04 exit; NS-06 C; A-S14; new row needed | P0 (a) | `mobile`, `security-architect` | `12-parked...` line 14; Apple controls doc, VERIFIED |
| FR-OPP-06 | Given a doorway control exists, When the NS-04 exit has not passed on that phone and iOS version, Then no control is offered | NS-04; A-S14; new row needed | P0 (a) | `mobile` | `12-parked...` line 14 |
| FR-OPP-07 | Given OPP-04 is ruled in, When a letter is signed as the child, Then it uses the existing From control and the same edit-and-verify path; no new author type is created; and the prompt set passes the content rules (no gendered child, no guilt) | NS-16; A-S09; BL-980; new row needed | P1 | `content`, `mobile` | NS-16 (not read; UNVERIFIED) |
| FR-OPP-08 | Given a file is brought in (OPP-05), Then only the file the parent chose arrives through a system picker, no other app's library is read, and the recording is cleaned only by existing edit types | NS-06; A-S03 pattern; new row needed (NX-27 status UNVERIFIED) | P1 | `mobile`, `privacy` | `07-remaining...` line 576 |
| FR-OPP-09 | Given any opportunity touches a child's voice or another adult's voice, Then counsel reads before build; counsel must confirm | Q45, Q48 as cited in research-validation | P0 (b) | counsel, founder | `functions/research-validation.md` section 13 |
| FR-OPP-10 | Given an opportunity test is planned, Then it uses past-behaviour questions, the Asha fixture only, adults only, "x of n", and a stop rule for any "this felt like the app watching or counting me" | `functions/research-validation.md` FR-RSH-01 to 03, 14, 15, 21, 24 | P1 | `user-research` | Section 6 here |
| FR-OPP-11 | Given the Review screen (A-S07) is reviewed for length, Then the controls before Keep are counted and the count is a design target, not a copy line | NS-09 (G-09); A-S07; new row needed | P2 | `design-systems` | A-S07 lines 355 to 357 |
| FR-OPP-12 | Given any opportunity adds a screen, state or string, Then design needs are keyed to e2e ids or "new screen needed" and no string says "coming soon" | All A to E areas; G-05 | P1 | `design-systems`, `content` | A-capture card gap G-05 |

---

## 9. Card changes I propose (for Karma to rule)

| # | Card row | Change | Why |
|---|---|---|---|
| C-1 | NS-49 (proposed, direction section 8) | Keep picture-first start and suggestions in one card; include the picture-edge gaps G-08, G-14, G-15, G-19 as acceptance rows | Picture-first makes them first-run |
| C-2 | `12-parked...` row C-10 | State the reopen test as two steps: the NS-04 exit, then the demand check "wanted to start and could not" (3 of 5) | The existing reopen test is only technical |
| C-3 | NS-23 | Add one sentence: the offered prompt on the same day later (OPP-03) is a separate rule from the past-letter slip and never shows the old answer | Avoids two cards both claiming the Home slot |
| C-4 | `12-parked...` or a new row | Add "Ask {child}" as a prompt-set candidate (OPP-04) with Q45 as the gate | No row names it |
| C-5 | `07-remaining...` row 6.6 | Name the reopen question: "Where do you keep recordings or messages about {child} today?" | Makes the "arrivals with history" test runnable |
| C-6 | NS-09 / A-S07 | Add a design target on the number of controls on Review before Keep | Friction found in the prototype |

---

## 10. Design needs

| Where | Need | For |
|---|---|---|
| A-S01 | A version of Home with picture-first as an equal start, tested against the SE 3 at AX5 | FR-OPP-02 |
| A-S01 | A prompt-offer state for "the same question again" (no old words shown) | FR-OPP-04 |
| A-S14 | Lock Screen control and Home Screen prompt widget, one state set, redacted text while locked | FR-OPP-05 |
| A-S07 | A first view of Review with fewer controls before Keep | FR-OPP-11 |
| A-S09 | A "from {child}" path in plain words | FR-OPP-07 |
| New screen needed | A "Bring in" start and its picker states | FR-OPP-08 |

---

## 11. Engineering needs

All "new row needed", in the style of `docs/BACKLOG.md` (Status, Mode, Owner, Milestone, Size, Satisfies, Scope, Done-when; Karma and the product agent assign ids):
- `content`, S: a prompt set for the child to answer, and the same-question rule's wording (OPP-03, OPP-04).
- `mobile`, S: the prompt-by-date selection rule, pure function, with tests (OPP-03).
- `mobile`, M: Lock Screen control behind a flag, after the NS-04 exit (OPP-02).
- `mobile`, M: bring-in start through the system picker (OPP-05).
- `qa`, S: tests that no offered surface carries a count or an earlier answer's words.

---

## 12. Founder and counsel questions, with defaults

| # | Question | Recommended default |
|---|---|---|
| OQ-1 | Founder: which two of the five go to a card first? | OPP-01 (already NS-49) and OPP-03 (cheapest); decide OPP-02 after the NS-04 result |
| OQ-2 | Founder: may the lock-screen doorway study run before the spike? | Yes, the demand question only (section 6.3 b); no build |
| OQ-3 | Founder: is OPP-04 wanted, given the parent holds the phone and the child is not a user? | Yes, as a prompt set only; no child screen |
| OQ-4 | Counsel: a child's voice and a third party's voice in a letter | Needs a number from legal (Q45, Q48); default: parked until read |
| OQ-5 | Founder: is OPP-09 (a next step after Keep) wanted at all? | No, hold |
| OQ-6 | Karma: does OPP-03 reopen NS-23's slot rule? | No; separate rule, same one-slip limit |

---

## 13. Summary and what I did not verify

- 19 candidates listed: 9 new or reopened (OPP-01 to 09, of which OPP-09 is held and OPP-08 is design work), 4 carded and locked (OPP-10 to 13), 3 parked (OPP-14, 15, 17), 3 refused or not recommended (OPP-16, 18, 19). Top five new opportunities by score: OPP-01, 03, 02, 04, 05 (OPP-06 and 07 are parked or low-scoring).
- One finding that changes the plan: "On this day" and "read the year back" are already cards (NS-23, NS-24), so the founder's list has less that is new than it appears; the real additions are suggestions (OPP-01), the same question again (OPP-03), and a design target for Review (OPP-08).
- Not verified: iOS minimum for controls and for Journaling Suggestions; whether Apple's suggestion notifications open third-party apps; any limit of a share-sheet receiver; whether NS-16's From control can name the child; NX-27's state on `develop`; every competitor fact except those on the four pages read this session. Dearest and Tinybeans were not read first-hand. All ranks are my judgement and must be tested.

Signed: `product` and `user-research` (Claude roles, not licensed researchers, lawyers or engineers).
