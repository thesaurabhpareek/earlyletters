# Memory Library parent study plan (BL-857): the extension of PARENT_STUDY_PLAN Q5

Date 10 Nov 2026 (UTC). Author: User Researcher (Claude role), for `product` and the founder. Status: DRAFT plan. Docs only. Nothing here has been run, and no parent has been asked anything yet.

This is not a second plan. It extends `docs/design/notifications/PARENT_STUDY_PLAN.md` Q5 (photo permission levels L0, L1, L2) and keeps that plan's care protocol, consent rules and "the study can only loosen a default" rule. Where this file and that one differ on Memory Library questions, this file wins, and a short pointer was added to that plan.

Tags: [PR 747], [PR 752], [PR 751], [PR 748] mean "read at the head named in section 17, 10 Nov". [REPO] means a file on `develop` at 16df0f5f2. [UNVERIFIED] means I could not confirm it. All "x of N" numbers are proposals from the research lens, not standards, until the founder signs section 9.

## 0. Answer first

1. Run one sessions-only study before any P2a promise copy ships or P2b is built: 8 to 10 adults, about 50 minutes each, about 5 days of sessions, static screens only, no real library, no child named or photographed, no recording by default.
2. The study answers four decisions: D9 (amend M13 rule 4 and Tier C so a library read for dates is allowed), F3 (approve and fund the study), F4 (which promise wording), F7 (the P2b pass line and stop-rule threshold). It cannot answer cadence; that needs the optional diary (section 14).
3. The success measure for every permission screen is comprehension and a comfortable No, not the yes-rate ([PR 747] R48).
4. The pass and stop bars are in section 9. They must be signed by the founder before the first session. After that they change only by a logged amendment.
5. What the founder must do before day 1 is in section 4.3. The incentive amount is a founder money decision; this plan contains no figure.

## 1. Decisions this study changes, and the questions that serve them

If none of these decisions would change, do not run the study. Each would.

| Decision | What it is ([PR 747] sections 2, 10, 12) | What stays shut until the study reports |
|---|---|---|
| D9 | Amend `docs/BACKLOG.md` M13 rule 4 and mark Tier C of `docs/design/NOTIFICATIONS.md` reopened, so the library may be read on the phone for dates. Needed for P2a | The P2a chooser, the P2a promise copy, P2b |
| F3 | Approve the study: recruiting route, incentive, second runner, verified support-line numbers, signed bars | Everything in the row above ("P2 is not started" if silent) |
| F4 | Choose the promise wording after counsel (PW-A to PW-D) | All store, website and in-app promise text. NX-33's words stay until then |
| F7 | The P2b pass line and the stop-rule threshold (R59, R60) | P2b |

| RQ | Question | Decision it serves | Bar |
|---|---|---|---|
| RQ1 | After the sheet, can a parent say what the app can see, and what is sent to us? | D9, F7 | B1, B2 |
| RQ2 | How comfortable are parents with picker only (L0), chosen photos (L1) and a full read (L2) when alone? | D9, F7 | B1 |
| RQ3 | Does a polished sheet raise "I would say yes" without raising understanding? | D9, F7 (R48) | B3 |
| RQ4 | Is saying No easy and free of felt penalty? | F7 (R48), F3 | B4 |
| RQ5 | What does each promise line make a parent believe, and does the rewrite cost trust against today's words? | F4, D9 | B2, B5 |
| RQ6 | Does a date-only card land as welcome? How does a card that names a place land (learn only)? | F7 | B6, B7 |
| RQ7 | Does the typed-days flow (P4a) read as "the app assumes nothing", and would parents use it? | F7 side-condition; P4a; Q4 bar kept | B8 |
| RQ8 | Do parents want to hide days, stretches or everything, and does anything land as painful? | F7 (R60) | B9 |

What this study does not decide: counsel's answers (CB-1 to CB-28), the device spikes (BL-843, BL-871, BL-872), P2c (background top-up), video, the shared notification cap number. A pass here is necessary, never sufficient.

## 2. Limits, said before the data

- N is 8 to 10. The study is directional. Bars are guard rails for a founder decision, not significance tests.
- There is no real library, so we learn how people react to words and screens, not how a real library of other people's photos, screenshots and hard weeks behaves (risk R-A8 in my 10 Nov council critique: unknown).
- Parents who agree to talk about photo permissions are probably more comfortable than average. A "pass" is therefore an upper bound.
- Network recruiting biases toward the founder's circle. The founder is a new parent and proposes the change, so his sessions would lean toward the design. See the second-runner rule in section 4.2.
- Stimuli are English only and iPhone only. Other languages are not covered (`docs/research/LANGUAGES.md`).
- A comprehension score for a sheet read after other sheets is partly taught by the earlier ones. Order is rotated, not removed (section 6). Read comprehension as an upper bound.
- The place-naming card uses a made-up town, so it cannot tell us how a real nearby place or a hospital would land. That is deliberate (section 5, ST-12).
- Desk evidence only exists so far: `USER_RESEARCH.md` says "No primary interviews yet", and `PARENT_STUDY_PLAN.md` has no FINDINGS. Nothing in this plan is backed by a parent study.
- Directional desk anchors, not proof: 63% of parents of 0 to 4 year olds worry about sharing that could identify a child's location, and 30% avoid posting their child's photos [REPO: `USER_RESEARCH.md` S9]. That is about public sharing, not on-device reading. It is a warning, not a result.

## 3. Method

Sessions first, diary second and optional. Moderated remote sessions, one parent at a time, 50 minutes, audio only from the participant (camera off), the runner shares static slides. No click-through prototype: the runner shows a screen, the participant says what they would do, the runner shows the next static screen. No app, no build, no photo access, no analytics.

Why not a diary-first or build-first study: a build that really reads participants' libraries would itself be a library-read feature with its own label and consent burden. Words and screens are the cheapest evidence that can move the four decisions.

## 4. Sample, recruiting, money and people

### 4.1 Who (8 to 10; target 10)

Adults 18 and over only. Targets, not quotas. If a target is missed, the findings say so.

| Group | Target of 10 | Note |
|---|---|---|
| Expecting, or child under 6 months | at least 3 | Tests the "tired and new" case |
| Child 6 to 18 months | at least 3 | |
| Second or later child | at least 2 | |
| Partner who is not the birthing parent | at least 2 | Fathers write letters and record videos to the future child [REPO: `USER_RESEARCH.md` S25, S30] |
| Self-described tradition other than Christian or none | at least 4 | By their own words from an optional open question; we never choose a label. Counts only, never against a code |
| From the founder's close circle | at most 5 | Friends, family, colleagues. Say so in the findings |

Exclude: anyone who works in design, product, privacy, law or software for a consumer app (expertise bias); anyone who works for or with Early Letters; anyone currently in acute crisis (we do not ask; the invitation handles it, section 10).

### 4.2 Runners

- Two runners. A second runner (not the founder) runs at least 3 sessions, and every participant from the founder's close circle ([PR 747] section 12 asks for at least 3 permission sessions; the close-circle rule is added by me). If the second runner can only do 3, those 3 are drawn from the close circle first.
- The founder should not run the permission blocks (section 6, blocks 3 to 6) himself if a second runner is available for the other sessions. His direction is what is being tested.
- The runner follows the fixed script word for word. Neutral probes only: "What are you thinking?", "What did you expect?", "Say more about that." Never "Would you use this?" Never correct an answer. Never pitch.
- Dry run: 20 minutes with a non-participant, both runners, before day 1.
- Runner effect check: after the study, compare comprehension and comfort by runner. If one runner's participants differ from the other's by 3 or more participants on the same bar, report both sets side by side and do not pool silently.
- A runner is a human. I (the agent) write the plan, key and coding sheet, and later help synthesise de-identified notes. I do not talk to participants.

### 4.3 Recruiting screener

Sent as a short form or read on a call. No names of children, no birth dates, no photos. Contact details go on a separate sheet (section 12).

Invitation text (to be reviewed by `content`): "We are talking with parents and parents-to-be about how a family memory app should ask about photos. About 50 minutes by video, audio only, no preparation. You will not be asked to show any photos or say anything about your child. Some questions touch days that can be tender, like due dates or hospital stays. You can skip anything, stop any time, and still be thanked in full."

| # | Question | Answer type | Used for |
|---|---|---|---|
| S1 | Are you 18 or older? | Yes / No | Must be yes |
| S2 | Which fits? Expecting / I have a child under 6 months / I have a child aged 6 to 18 months / I have a child older than 18 months only / None of these | Single choice | Group; the last two out |
| S3 | Is this your first child? | Yes / No / Prefer not to say | Second-time target |
| S4 | How do you describe your role? | Open text, optional | Non-birthing target. Recorded as given |
| S5 | Is an iPhone your main phone? | Yes / No | Must be yes |
| S6 | Do you work in design, product, privacy, law or software? | Yes / No | Yes is out |
| S7 | How do you know the founder? Close friend or family / Colleague or acquaintance / Not at all | Single choice | At most 5 close |
| S8 | Optional: which traditions or celebrations matter at home? | Open text, optional, skip allowed | Counts only, in the participant's words |
| S9 | Any access needs for the call (captions, more time, a different time of day)? | Open text, optional | Logistics |
| S10 | Are you comfortable talking about phones and privacy in general terms? Nothing about your child is needed. | Yes / No | Must be yes |

Never ask at screening: why they might want extra care, health, loss, relationship status, the child's name or age beyond the S2 band.

Channels: the founder's network (cap 5), plus up to two community routes the founder chooses (founder decision, section 4.4). Never recruit through a hospital, NICU or loss group unless that group's leader agrees first (founder decision), as in `PARENT_STUDY_PLAN.md` section 1.

### 4.4 Money and founder decisions

Incentives cost money and are the founder's decision. No figure appears in this plan.

| Line | Who decides | Figure |
|---|---|---|
| Incentive per participant (paid whether or not they finish or skip) and the form it takes | Founder (F3) | FOUNDER TO SET |
| Number of participants paid | Founder (8 to 10) | FOUNDER TO SET |
| Recruiting costs, if a paid route is used | Founder | FOUNDER TO SET, or none |
| Counsel review of the consent page and the stimuli (counsel hours are money; F2 pays for tier A, this may be separate) | Founder | FOUNDER TO SET, or ask counsel to fold it into tier A |
| Diary tool, if the optional diary runs and the tool is paid | Founder | FOUNDER TO SET, or none |
| Study build for the optional diary (engineering time, not dollars) | Founder | Estimate is UNVERIFIED (about a day of `mobile` in `PARENT_STUDY_PLAN.md`) |
| Second runner's time, if paid | Founder | FOUNDER TO SET, or none |

Payment records are personal data. Keep them apart from the notes. Retention is counsel's call.

## 5. Stimuli, mapped to the drafts

All stimuli are static images or slides made by `design-systems` from the strings in [PR 752] (keys listed). Stimuli use `{app}` filled with the product name from `packages/brand` at render time, never typed by hand. No photo of a child, no face, no real library. Photo slots hold stock or synthetic landscapes, food, hands and toys with no faces. Every stimulus is marked in the corner "Draft, for a study. Not final words." Every string is COUNSEL-READ in [PR 752] and none is production copy.

| ID | Stimulus | Source | Used in |
|---|---|---|---|
| ST-01 | Current promise, as the baseline B0: "Only the photos you choose are added, and they are kept with the letter, private like the rest of the book. The rest of your library is not read." | [REPO] `docs/design/notifications/COPY_INVENTORY.md` line 225 ("Consent wording") | Block 5 |
| ST-02 | Promise candidates, three of four: PW-A, PW-B, PW-D, verbatim from [PR 747] section 5.1 and [PR 752] section 11, each shown alone on a card marked "Candidate, for counsel" | [PR 747] 5.1; [PR 752] 11 | Blocks 2 and 5 |
| ST-03 | L0: one add button and Apple's own photo sheet (stand-in drawing, labelled "stand-in for Apple's sheet"), with the P1 date line `chip.taken` | [PR 752] 2.1 (`attach.add.photoOrVideo`, `chip.sourceLabel`, `chip.taken`) | Block 3 |
| ST-04 | L1 pre-sheet, Plain, Warm, Minimal (keys `study.l1.plain.*`, `study.l1.warm.*`, `study.l1.minimal.*`), with shared `ask.continue` and `ask.notNow` | [PR 752] 14.1 | Block 3 |
| ST-05 | L2 full-read sheet, Plain version, using `ask.title.chooser`, `ask.chooser.reads`, `ask.never`, `ask.chooser.when`, `ask.chooser.where`, `ask.next`, `ask.continue`, `ask.notNow` | [PR 752] 2.2 | Block 4 |
| ST-06 | L2 full-read sheet, Polished version: identical words and identical buttons to ST-05, only visual treatment differs (decided by `design-systems`; the buttons stay equal in size and weight in both) | [PR 751] CS-S1; I did not find a polished/plain pair in the #751 wireframes (grep for "polish" found none), so `design-systems` must make it | Block 4 |
| ST-07 | The outcome of Not now: `ask.heldToast` "You can change this any time in Settings." on the screen the parent came from, then the next screen with nothing missing | [PR 752] 2.2 | Block 4 |
| ST-08 | Tonight card, date-only: `card.kicker` (a date) + `card.body.day` "You have pictures from this day." + `card.primary` + `card.notNow` + `card.more`; and the multi-day form `card.body.days` against the study variant `card.days.alt` "Pictures from {date}." | [PR 752] 5.1 | Block 6 |
| ST-09 | Composer shelf (CS-S9): the same date information inside the add-media screen, no card | [PR 752] 5.2, [PR 751] CS-S9 | Block 6 |
| ST-10 | Hide controls: `hide.menu.day`, `hide.menu.stretch`, `hide.menu.stop`, the stretch sheet, `hidden.*` page, and `stop.toast`. Plus the ledger master switch (off in one tap) | [PR 752] 4.2, 6.1, 6.2 | Block 8 |
| ST-11 | Typed-days flow: `occasions.row.title`, `occasions.intro`, `occasions.empty`, the add sheet (`occasions.name.placeholder` offers no example), `occasions.name.help`, `occasions.lock.day.title`/`help`, `occasions.preview.label` with the real body `notif.occasion.body.1` to `body.4`, `inApp.today.generic` | [PR 752] 7.1, 7.2 | Block 7 |
| ST-12 | Place-naming card (to falsify, never to ship): "A day out on {date}, near {place}" with `{place}` filled with a made-up town ("Marlow Harbor"). It is on [PR 752] 5.1's refused list and falls under NX-39 "Place on a card: never ships from this study" | [PR 752] 5.1 refused wordings; [PR 747] section 12 | Block 6 |
| ST-13 | Tender-days block: text labels only, no images: "a hospital visit", "a hard week", "a date that is hard for you" (abstract; nothing the participant has told us) | My design; [PR 748] risk R6 | Block 9 |
| ST-14 | Word swap in the ledger: `ledger.lastChecked.label` "Last checked" versus "Last looked" | [PR 752] 14.4 | Block 8 (one minute) |

Choices I made that you can overrule:
- Three promise candidates, not four. [PR 747] BL-857 lists PW-A to PW-D. PW-C ("stay on this phone, in your book, and in your iPhone's own backup") is dropped because [PR 752] section 11 shows it overlaps PW-A and its first clause is caught by the P0 rule. If counsel or the founder wants PW-C, it replaces PW-A in the rotation. Do not run four: the block would run long.
- A lock-screen notification derived from the library is not tested. [PR 747] R27 sets "Moment nudges: 0" and no library-derived notification ever, so there is nothing to decide. My earlier critique proposed testing the channel; that is withdrawn for notifications. The only notification stimulus is the typed-days reminder (ST-11).
- "Some photos from this weekend" (my earlier neutral example) is on [PR 752]'s refused list, so it is not used.
- The word "festival" and named religious days are absent from every stimulus and from the script (CB-21 is open). The script says "a day that matters to your family".

## 6. Session script (50 minutes)

Fixed script. Notes by participant code (P01 to P10). No audio or video recording by default. If a participant asks to be recorded, ask again at the start and note the yes; default is no. No observer unless the participant agrees at the start.

Rotation, set before day 1 and written on each session sheet:
- Promise line read cold in block 2: PW-A, PW-B, PW-D assigned 3, 3, 4 across the 10 (4 to PW-D, the P2a line). With N=8 or 9, 3, 3, 2 or 3, 3, 3.
- L1 variant read cold in block 3: Plain, Warm, Minimal assigned 4, 3, 3 (4 to Plain).
- Sheet family order: odd participants see block 3 (L1) before block 4 (Full); even participants see block 4 before block 3.
- Polished (ST-06) or Plain (ST-05) first in block 4: alternate.
- Order of the remaining two promise lines in block 5: rotate through the six orders.
- These are crossed by a sheet the runner holds, not chosen live.

| Block | Min | What happens |
|---|---|---|
| 0 Welcome and consent | 4 | Read the consent page aloud (section 11). Ask: "Is it OK to take notes under a code, not your name?" Confirm they know they can skip, stop, and still be thanked. Ask the optional extra-care question if it was not on the pre-session form (section 10). Start of notes |
| 1 Their own story | 4 | "Tell me about the last time you went back to your phone to find a photo to remember something." Probes: "What did you do next?" "What was the hardest part?" Say once: "Please don't name or describe your child. Describe what you did." Never ask them to show a photo |
| 2 Promise line, cold | 4 | Show one assigned candidate (ST-02) alone. "Read this to yourself. In your own words, what is it telling you?" Then the line-specific items in section 7.3 for that line only. Do not say which part is true |
| 3 Photo permission, L0 and L1 | 8 | ST-03 (picker): "Here you add a photo from Apple's own sheet. How comfortable are you with this, 1 to 5?" Then the assigned L1 sheet (ST-04). "Read it. Tell me what you would do." Items S1 to S4 (section 7.1). Comfort 1 to 5. "Which would you tap, Continue or Not now?" Then show the other two L1 variants one at a time, in rotated order, asking only: "Which of the three would you prefer to see, and why?" and "Which felt like it told you the most?" (preference only; comprehension is scored on the first one seen) |
| 4 Full read, plain and polished | 8 | Assigned first sheet (ST-05 or ST-06): items F1 to F4 (section 7.2), comfort 1 to 5, Continue or Not now. Then the other sheet: comfort 1 to 5, Continue or Not now. "What, if anything, is different between the two?" Ask no comprehension items on the second sheet |
| 5 Does the rewrite cost trust | 5 | Show ST-01 (today's words). "This is what the app says today." Then each of the three candidates in rotated order (including the one read in block 2): "This is what it might say if it could do more. Compared with today's words, does this make you trust the app more, about the same, or less?" Then one neutral "Say more about that." Once, after the third: "Which would you want to read in an app store listing, if any?" |
| 6 Card and shelf | 5 | ST-08: "This appears on the app's home screen. What do you think it is telling you?" Welcome / neutral / pressured / odd (open word first, then the fixed list, section 7.4). Comfort 1 to 5 with the phone "on a table with others in the room". Same for the multi-day pair (`card.body.days` versus `card.days.alt`: "Which reads better?"). Then ST-12 (place): same questions, last in the block. Then ST-09 (shelf): "Where would you rather see this, here, or as a card, or not at all?" |
| 7 Typed days | 5 | ST-11. Task, spoken only: "You want a reminder for a day that matters to your family. Tell me what you would do on this screen. You do not need to say the day." Items T1 to T4 (section 7.5). Then: "Would you add a day, add none, or not sure?" |
| 8 Controls and the word swap | 4 | ST-10: "If you wanted this to stop, or to leave out a stretch of days, what would you do?" Record whether they find "Stop these", "Hide a stretch of days" and the ledger switch without prompting; then "Which would you want?" (by day / by stretch / all off / none of these). ST-14: "Last checked" versus "Last looked": "Which one feels more like the app watching?" |
| 9 Tender days (last, optional, with skip) | 3 | Only if not extra-care (section 10). Each label on its own screen with a visible Skip card. The one question: "Are there kinds of photos or dates you would never want an app to bring up? You do not need to say what or why. Yes, No, or Skip." If yes: "Which would you want: switch off a day, a stretch of days, or everything?" Nothing else. No probing |
| 10 Close | 2 | "Anything you want removed from what we noted?" (delete on request, no questions). Thanks. Mention how payment arrives. Support information (section 10), offered to everyone |

Static-only rule: the runner never builds, installs or demos a live app. If a participant asks "what happens if I tap this", the runner shows the next static screen already prepared, or says "That is not in this draft."

Words the runner never says: entry, take, draft, pack (internal terms); streak, missed, behind; "AI"; "festival". Say "letter", "note", "recording", "Tonight". Never imply the app writes anything.

## 7. Questions and fixed correct answers

The key below is fixed before any session and does not change after the first. It answers the true facts in [PR 747] (R54 no upload; section 4 metadata only, on the phone; R9 no content analysis). If counsel changes a fact, the key is changed before the first session and noted in the amendments log (section 9.3). Scoring is by the runner live (as given) and by a second coder from the notes (section 13); disagreements are resolved against the key, and unresolved ones count as incorrect.

Scoring: Correct, Incorrect, Unsure. "Unsure" counts as not correct for every bar. A participant who says "I don't know" on a question that the sheet leaves unstated is recorded Unsure, and the unstated fact is flagged for `content` and counsel.

### 7.1 L1 sheet (Plain, Warm, Minimal)

| Item | Question | Correct | Incorrect examples |
|---|---|---|---|
| S1 | After you say yes, what can the app see? | The photos I choose, and their dates | "All my photos" (L1 is the chosen-photos sheet); "where they were taken"; "what is in them" |
| S2 | What can it not do? | Look inside a photo or at who is in it; write for me (Minimal says only "nothing inside them": correct on that alone) | "It can recognise faces"; "It will write something" |
| S3 | What is sent to us? | Nothing about the photos or their dates | "The dates"; "the photos"; "a list of my days" |
| S4 | How do you stop it? | In Settings | "Delete the app" is Unsure; "I can't" is Incorrect |

Note: Minimal does not state S3 or where the list lives, by design [PR 752] 14.3. A wrong or Unsure S3 on Minimal is a finding about Minimal, not a failure of the question.

### 7.2 Full-read sheet (ST-05 and ST-06)

| Item | Question | Correct | Incorrect examples |
|---|---|---|---|
| F1 | If you say yes to "all photos", what can the app see? | All my photos with their dates, while I am choosing | "Only the ones I pick" (that is the Limited case); "nothing until I pick" |
| F2 | When does it look? | While I am choosing (and not at other times) | "All the time"; "in the background" |
| F3 | What is sent to us? | Nothing | Any of: photos, dates, a list, "it syncs" |
| F4 | What happens to the photos I pick? | They are copied into my book, on my phone and in my iPhone's own backup if I use one; the rest stay in my Photos app | "They go to Early Letters"; "they are moved out of Photos" |
| F5 | After tapping Not now, what happens to the rest of the app? | It works the same | "I lose features"; "it asks again tomorrow" |

F1 and F3 are the two questions in the B1 and B2 bars (the pair named in [PR 747] section 12, "what can the app see; what is sent to us"). The sheet words never state F3 outright; whether a parent can infer it is the test. If a parent cannot, the finding is "add a line", subject to counsel.

### 7.3 Promise lines (cold read, block 2), by line

The same two outcome questions as the sheets, plus line-specific items. Record two codes for each: what the line says (S-code) and what the parent believes happens (B-code).

Outcome questions after the cold line (scored against the true facts, whatever the line says):
- PQ1 "If this is true, what can the app see?" Correct: the photos I choose and their dates (PW-A, PW-D), or: the line does not say what it sees (PW-B).
- PQ2 "What is sent to us?" Correct: nothing about the photos or dates.

Line-specific items:

| Line | Item | Correct (what the line says) |
|---|---|---|
| PW-A | PA-1 Does the app show you the date a photo was taken? | Yes |
| PW-A | PA-2 Does the line say whether the company receives the photo? | It does not say |
| PW-A | PA-3 Who holds the backup copy? | My iPhone's own backup (not Early Letters) |
| PW-B | PB-1 Does the company get your photos? | No |
| PW-B | PB-2 Does the company get the date or place? | No |
| PW-B | PB-3 Does the line say where the photos are kept? | It does not say |
| PW-B | PB-4 Can the app on your phone see the photo? | The line does not say (a "No" is Incorrect: that is the "receive" versus "see" confusion; code it and report it) |
| PW-D | PD-1 Who decides what the app can see? | I do |
| PW-D | PD-2 What does it read? | Only the dates of the photos I allow |
| PW-D | PD-3 Can it look at what is in a photo? | No |
| PW-D | PD-4 Does the line say whether anything is sent to the company? | It does not say |
| PW-D | PD-5 (coded, not scored) When it says "Early Letters can see", who do you picture seeing? | Code: the app on my phone / the company / not sure |

All items are scored. PD-5 is reported as counts.

### 7.4 Card vocabulary (blocks 6 and 8)

For each card or screen: "What word would you use for how this feels?" (open, first), then the fixed list read in this order each time: welcome, fine, odd, pressuring, like being watched, painful, none of these. The participant may choose any. "Painful" or "like being watched" is the flag used in the bars. Comfort is 1 to 5 where 1 is not at all comfortable and 5 is completely comfortable.

### 7.5 Typed days (T items)

| Item | Question | Correct |
|---|---|---|
| T1 | If you add no days, what will the app send about days that matter to your family? | Nothing |
| T2 | Does the app know which days matter to your family? | No, only the ones I type |
| T3 | What would the lock screen show by default? | The app's name and a short invitation; not the day's name (the day-name switch is off by default) |
| T4 | Will a reminder ever mention a photo? | No |

## 8. The comfortable-No measure

Added by me. It is not in the [PR 747] section 12 table, which says only that consent design is judged by "comprehension and a comfortable No". The founder confirms or changes it in section 9.

Measured on ST-04, ST-05/06 and ST-07 (the screen after Not now):
- N1 "How easy would it be to say Not now here, 1 to 5?" (1 not easy, 5 very easy).
- N2 "If you tapped Not now, what would you expect to happen next?" Correct: the app works the same; I can change it in Settings; it does not ask again by itself. Incorrect: it nags; features go away; I would be asked tomorrow.
- N3 "Would you feel you were doing something wrong by tapping Not now?" Yes / No / Not sure.
- N4 (block 4) "Do the two buttons look equally easy to tap?" Yes / No. A participant who says No on either sheet is recorded and the screen is flagged for `design-systems` (R48 requires equal size and weight).

A comfortable No = N1 is 4 or 5, and N2 is correct, and N3 is No. Reported per participant on the L1 sheet and the full-read sheet. Bar B4 below.

## 9. Pass and stop bars (written before data; for the founder to sign)

### 9.1 The bars

Source: B1, B2 (first part), B3, B6, B7 (second line), B8, B9 and the cadence note come from [PR 747] section 12 as written there (proposed by the research lens, founder confirms in F3 and F7). B4, B5 detail, B10 and the scoring rules are additions by me, marked ADDED. Every "of 10" scales to N in 9.2.

| Bar | Feeds | PASS | STOP or fallback |
|---|---|---|---|
| B1 Full-read design work (P2b) | D9, F7 | At least 8 of 10 answer F1 and F3 correctly on the full-read sheet; at least 7 of 10 score the full read 4 or 5 for comfort when alone; no participant calls it "like being watched" or painful (applied to everyone, since we do not identify hard-season participants; stricter than [PR 747], which says "hard-season participant" only) | Otherwise build P0 and P1 first, P2a second, and not P2b |
| B2 Promise rewrite and honesty of the design | F4, D9 | At least 8 of 10 answer correctly what the app can see and what is sent (PQ1 and PQ2 on the cold promise line, and S1 and S3 on the L1 sheet, F1 and F3 on the full sheet, each counted on its own) | Fewer than 6 of 10 correct on "what is sent to us" (S3 or F3 or PQ2) means the design is not honest enough, whatever the comfort score. See 9.4 for how Minimal and PW lines that are silent are read |
| B3 Persuasion check | D9, F7 (R48) | The plain sheet ships unless the polished sheet also raises comprehension. "Would say yes": count participants who would Continue on Polished and Not now on Plain, minus the reverse | A net rise of 3 or more in "would say yes" with no rise in comprehension is a dark pattern: ship Plain. "Raises comprehension" = the Polished-first group has at least 1 more participant correct on both F1 and F3 than the Plain-first group (groups of about 5; crude, stated) |
| B4 Comfortable No (ADDED) | F7, F3 | At least 8 of 10 have a comfortable No (section 8) on the full-read sheet, and N4 is Yes for at least 8 of 10 on both sheets | 3 or more of 10 are not comfortable, or say they would feel they were doing something wrong: rewrite the Not now path and its words, and re-test before P2a copy ships |
| B5 Trust cost of the rewrite | F4, D9 | Fewer than 3 of 10 say "less" for the P2a line (PW-D), and for any candidate carried forward | 3 or more of 10 say the rewrite makes them trust us less (per [PR 747]): stop P2 and keep the NX-33 promise. A candidate with 3 or more "less" is dropped from F4 whatever the others do |
| B6 Date-only card | F7 | At least 6 of 10 call it welcome or fine (counting welcome only is stricter; the founder picks which, default welcome) and at most 1 of 10 calls it pressuring or odd | Any participant reports a card as painful: pause date-triggered cards for everyone, same day to `product` |
| B7 Place on a card | F7 | Never ships from this study, whatever the score ([PR 747] section 12). Written down so a good score cannot be read as a reason to ship | n/a. A place-naming card scoring "welcome" in 8 or more changes nothing in the build; it is recorded as a finding only |
| B8 Typed days | P4a; Q4 bars kept | At least 8 of 10 answer T1 and T2 correctly; at least 5 of 10 say they would add a day | Fewer than 4 of 10 would opt in: demote festival work below age notes and photo notes, as `PARENT_STUDY_PLAN.md` Q4 says. Fewer than 6 of 10 on T1 and T2 together: rewrite `occasions.intro` before P4a copy ships |
| B9 Hard days | F7 (R60) | At least one control (day, stretch, all off) is found without prompting by at least 7 of 10 (ADDED; the numbers are mine) | Any participant, in any group, calls any card, sheet or control painful or intrusive: pause date-triggered cards for everyone and send to `product` the same day ([PR 747] R60; `PARENT_STUDY_PLAN.md` section 1) |
| B10 Cadence (diary only) | Shared cap, R61 | The shared cap stays unless at least 7 of 10 want more and at most 2 of 10 turn reminders off in the diary | More than 3 of 10 turn off: weekly or lower. Not measurable in sessions. If the diary does not run, the cap stays as it is |

Rule that applies to all: an unmet bar means the conservative default stays. The study can only loosen a default, and only when its bar is met. A bar missed by one participant is a miss, not "close enough".

### 9.2 Scaling to N

Fixed when recruiting closes, before session 1, and not changed after. Pass bars use "at least" rounded up; "at most" rounded down; stop bars use "at least" rounded up.

| Bar as written (of 10) | N=8 | N=9 | N=10 |
|---|---|---|---|
| at least 8 | 7 | 8 | 8 |
| at least 7 | 6 | 7 | 7 |
| at least 6 | 5 | 6 | 6 |
| at least 5 | 4 | 5 | 5 |
| fewer than 6 correct (honesty stop) | fewer than 5 | fewer than 6 | fewer than 6 |
| fewer than 4 would opt in | fewer than 4 | fewer than 4 | fewer than 4 |
| 3 or more (stop, "less" trust, net persuasion rise) | 3 | 3 | 3 |
| more than 3 turn off (diary) | 3 or more | 3 or more | 4 or more |
| at most 2 turn off (diary) | 1 | 1 | 2 |
| at most 1 pressuring or odd (B6) | 0 | 0 | 1 |

Note for F7: at N below 10 the card bar "at most 1" becomes "none", which is stricter. The founder may keep "at most 1" at any N; say so when signing.

### 9.3 Signature block and amendments

Nothing in this plan is final until signed. Fill the "Signed value" before session 1. If a number is left blank, it takes the proposed value. Founder initials each decision.

| Item | Proposed value | Signed value | Founder initials | Date |
|---|---|---|---|---|
| F3: approve the study | Yes, sessions first | | | |
| F3: bars B1 to B9 | As in 9.1 | | | |
| F7: B1 comfort and comprehension numbers (P2b pass line) | 8 of 10, 7 of 10, none "watching" | | | |
| F7: stop threshold for the P2b stop rule (R60) | 3 or more of 10 turn off within the diary; any "painful" | | | |
| B3 persuasion check number | net 3 | | | |
| B4 comfortable No numbers (ADDED) | 8 of 10 | | | |
| B6 count welcome only, or welcome plus fine | welcome only | | | |
| B6 at most 1 or none at N below 10 | at most 1 | | | |
| N (final) | | | | |
| Second runner named | | | | |

Amendments log (after session 1, a bar changes only through a row here, signed before the next session; the change and the reason are quoted in FINDINGS):

| # | Date | What changed | Why | Founder initials | Sessions already run |
|---|---|---|---|---|---|
| | | | | | |

### 9.4 Reading rules fixed now

- Cold reads: promise line (block 2), L1 variant (block 3), and first full-read sheet are the first exposures in their family. Per-line and per-variant counts are 3 or 4 participants, too small for a verdict; they are reported beside the pooled count. A line or variant "stands" if all but at most one of its cold-read participants are correct on both outcome questions (all, when the group is 3).
- Pooled counts are over all N, with order effects checked (9.1 note). Report the first-family subset separately.
- Minimal and S3: Minimal does not state "what is sent", by design. If the pooled B2 miss is caused only by Minimal's S3, report "Minimal drops out" and re-score Plain and Warm alone; do not call the pooled miss a pass.
- Promise lines that are silent on "sent" (PW-A, PW-D) leave PQ2 to inference. A wrong or Unsure answer there is a finding about the line, scored in B2 as written.
- Free-text "in your own words" answers are scored against the key by the same two coders; they are not counted as correct for wording alone.
- If someone skips an item, it is neither correct nor incorrect; it is out of that item's N and the N is reported. B-bars that depend on skipped items use the exact N in the denominator, and a bar passes only if the scaled count is reached among those who answered and the answered group is at least 8.

## 10. Emotional-risk protocol

The risk: date-and-place resurfacing can bring back a loss, a hospital stay or a hard week with no warning ([PR 748] risk R6; [PR 747] R-A6). The study asks about this indirectly and never asks anyone to describe an event.

Before the session:
- The invitation tells people it can touch tender days and that they can skip and stop.
- The pre-session form has one optional yes/no: "Would you like us to take extra care? (No reason needed.)" The runner never asks why and never writes a reason. Extra care changes the session only this way: block 9 is not shown, and each stimulus in blocks 6 and 7 is offered with its Skip card up front. The yes is counted in aggregate only and never against a code.
- Do not recruit anyone currently in acute crisis (we do not ask; if a person says so unprompted, thank them, pay them, and end the call kindly). Never recruit through a hospital, NICU or loss group unless that group's leader has agreed in writing (founder decision).

During:
- Abstract stimuli come last: block 9 is the final block before close, and it uses text labels only (ST-13), never an image.
- Every stimulus in blocks 6, 7 and 9 has a visible Skip card. A skip is data and is never probed. Record "S" and move on.
- No probing on tender stimuli. Allowed words only: "Take your time." "You can skip." If the participant volunteers a personal event, say once: "You do not need to tell me that. Would you like to go on, or skip?" Do not write the event down.
- Never ask a participant to describe a photo, a date or a person. Never use words like loss, miscarriage, death, NICU in the script. The labels in ST-13 are the only wording.
- Ask the safe question only, in the words in block 9. Collect only Yes / No / Skip and the control they want (a day, a stretch, all off).
- Stop rule: if a participant becomes distressed, stop the task. Say: "We can stop here. Thank you for what you did. You will still be thanked in full." Offer the support information. Do not ask what happened. Do not ask whether they want to continue more than once. Note only "ended early". Pay in full.
- If any participant reports a card, sheet or control as painful or intrusive: the runner stops the stimulus, notes the stimulus id (not the person), and sends it to `product` the same day. The stimulus is withdrawn from all later sessions until `product` replies (B9, [PR 747] R60).

After:
- Support information is offered to everyone at close, not only to people who seem upset: "If any of today made you think about something hard, here are places that can help." The list is a short sheet of general support lines.
- Support-line numbers: VERIFY BEFORE USE. The founder confirms each name and number on its own primary site before session 1; none is printed in this plan. The repo already carries the `struggling` entries in `packages/content/src/strings.en.ts` and `docs/FOUNDER_TASKS.md` (the item that asks for the 988 Lifeline and Postpartum Support International entries to be verified) [REPO]; use those names as starting points, not as verified. If a line is not verified, the sheet says "a trusted doctor, midwife or health visitor" and the runner does not read out a number.
- Findings never label hard-season status against a code. Extra-care yeses and tender-block yeses are aggregate counts only.

## 11. Consent form outline (research with parents)

One page, plain English, read aloud at the start and signed or checked in a form the founder keeps outside the repo. Counsel reviews it before use [UNVERIFIED: `PARENT_STUDY_PLAN.md` found no research consent template in `docs/` on 1 Nov; I searched `docs/` again on 10 Nov and found none beyond that plan and a deletion screen]. Written in the Shown / Records / Never / Decline shape of COORDINATION section 10 (adapted for research; privacy reviews the shape).

1. Who we are and why: Early Letters is a baby memory book families fill by talking. We are testing how the app should ask about photos. You are testing the idea, not yourself.
2. What you will do: about 50 minutes on a video call. You will see draft screens and words and answer questions. No photos from you, ever.
3. Shown (what you will see): draft screens and draft words, marked as drafts. None is the final app. No photo of a child.
4. Records (what we write down): notes under a participant code (for example P04), your answers to the questions, and a one-word comment if you give one. Your name and contact details are kept on a separate sheet. Payment details are kept apart.
5. Never (what we do not record): anything about your child (name, age beyond a band, photo, place, date), any photo or library, your location, the reason you ticked "extra care", anything about a hard event. No audio or video recording unless you say yes at the start of the call. We do not use analytics or tracking links.
6. Decline and withdraw: you can skip any question, stop at any time, and still be thanked in full. You can ask us to remove your notes afterwards (up to a stated date) and we will, with no questions.
7. Who sees what: the founder, the second runner, and the agents that read de-identified findings. Findings carry codes and groups only, with no identifying quotes. Tradition and extra care appear only as counts for the whole group, never against a code.
8. How long we keep it: contact sheet deleted 30 days after the last session (proposal from `PARENT_STUDY_PLAN.md`); raw notes deleted on a date written on the form (proposal: 90 days after findings are merged); consent forms and payment records kept as counsel directs. Retention is counsel's call.
9. Adults only: you are 18 or over. No child is interviewed, recorded or photographed. If a baby is in view, we will ask you to turn the camera away (camera is off by default).
10. Payment: the thank-you is paid whether or not you finish or skip. The amount and form: FOUNDER TO SET.
11. Support: if anything today brings up something hard, here are places that can help. VERIFY BEFORE USE (section 10).
12. Contact for questions or withdrawal: FOUNDER TO SET (an address that is not a personal inbox).
13. Consent: "I understand and agree." Name or code, date. Separate optional box: "Take extra care (no reason needed)." Separate optional box: "OK to record audio for this session."

## 12. Data handling

- Raw notes, any recordings, consent forms, the contact sheet and the linking sheet live outside the repo, in a founder-controlled encrypted folder with a stated deletion date. Nothing from them enters `docs/`.
- Notes are keyed by P01 to P10. The linking sheet (code to contact) is a separate file from the notes. Delete contact details 30 days after the last session (proposal).
- Only de-identified findings come into `docs/research/studies/`. Quotes are trimmed of anything identifying. Tradition and extra-care status are shown as group counts only.
- No child's name, date of birth or photo is collected. If a participant says one aloud, the runner does not write it.
- No analytics SDK, no tracking links, no form tool that collects email, IP or device ID for answers. If a tool's behaviour is unknown, take the answers on the call and type them into a sheet. Paid or new tools are a founder decision.
- Real family details never go in code, tests, fixtures or this repo (`CLAUDE.md`; `packages/content/test/no-real-family-data.test.ts`). The fictional family in all stimuli is "Asha".
- No feature that writes, rewrites or summarises a person's words is tested. Participants' own words in the notes are stored as given.
- Payment records are personal data and are kept apart from the notes; retention is counsel's call.

## 13. Analysis plan

1. During each session the runner records on a one-page sheet: item, response code (Correct, Incorrect, Unsure, Skip), comfort 1 to 5, Continue or Not now, words used. Notes stay outside the repo.
2. Within 24 hours of each session, a second coder (the other runner) scores the same notes against the key in section 7 without seeing the first score. Agreement is reported as a count of items scored the same out of items scored. Disagreements are resolved against the key; any left unresolved count as incorrect. Participant code, not name, on every sheet.
3. After the last session, the bars in 9.1 are computed mechanically from the sheets with the scaled numbers in 9.2. The result table is filled before any quote is chosen. No bar is re-cut after seeing the data; amendments only through 9.3.
4. Affinity map observations (what people did and said), then themes, then insights, then implications. Evidence is separated from interpretation. Count how many participants showed each pattern; do not turn one quote into a trend.
5. Report counts as "n of N" with the exact N for the item. No percentages with a decimal. Report per runner, per rotation arm (promise line, L1 variant, first family, first sheet) beside the pooled count, as in 9.4.
6. Each finding has evidence (codes), confidence (low, medium, high), and the decision it informs. Directional language only: "in this study of N".
7. FINDINGS.md leads with the decision and the answer in three lines, then findings, then method and limits. Location: `docs/research/studies/2026-11-library-permission/FINDINGS.md`, the path named in BL-857 and R59 [PR 747]. Raw notes never go there.
8. Hand-offs: `product` gets backlog proposals and the evidence line for each decision (D9, F4, F7); `content` gets copy issues (including the "Last checked" versus "Last looked" preference, section 5 ST-14, which changes a word only); `design-systems` gets screen issues (equal buttons, the polished pair); `privacy` gets any "watching" or "painful" report the same day; `decision-science` gets the two post-launch proxies already in `PARENT_STUDY_PLAN.md` section 6.
9. Celebrate what families do. Findings are not framed as gaps, failures or counts of what a parent has not written. We never measure how many photos, days or memories a parent has.

## 14. Timeline

About 5 days of sessions, 2 a day, plus preparation and synthesis. Days are working days from the founder's go (the signed 9.3).

| Day | Step |
|---|---|
| Before go | `product` reviews this plan. Founder: counsel read of the consent page (money), verified support lines, incentive, second runner, recruiting route, signed bars (section 15) |
| Go to go+2 | `content` reviews the invitation and script wording. `design-systems` builds ST-01 to ST-14 as static images (Figma or slides, no build). Recruit and send consent. Dry run with a non-participant |
| Session days 1 to 5 | Two sessions a day at most, spaced so the runner can score each one the same day. Rotation sheet followed exactly |
| Session day 5 to +2 | Second-coder scoring finished. Bars computed. Synthesis. FINDINGS.md |
| +3 | Read-out to founder. Decision lines for D9, F4, F7 written. Delete contact details on the stated date |

Optional wave 2, diary (about 7 days from each participant's session day; run only if the founder asks): 7 local notifications from a throwaway TestFlight build (separate preview bundle id, no real library, no photos) using the fixed `notif.occasion.*` bodies and the 3-tap diary from `PARENT_STUDY_PLAN.md` Q3. It exists only for bar B10 (cadence) and for wear-out of the typed-days reminder. It adds a build (about a day of `mobile`, UNVERIFIED) and needs a participant opt-in. If it does not run, nothing about the shared cap changes. Test notifications never reach the production app.

## 15. Founder actions to start

1. Read and sign section 9.3: the bars (F3, F7), the N-of-M numbers, B3, B4, B6 choices, and N.
2. Set the incentive amount and form, and the number of participants (section 4.4).
3. Choose the recruiting route(s): your network (at most 5 of 10) and up to two community routes. Do not use a hospital, NICU or loss group without that group's leader agreeing.
4. Name the second runner, and agree they run every close-circle participant (minimum 3 sessions).
5. Verify the support lines on their primary sites and give me the names to put on the sheet. Until then the sheet says "a trusted doctor, midwife or health visitor".
6. Ask counsel to read the consent page and the stimuli (money, or fold into tier A), and decide where the consent forms and notes will live outside the repo, with a deletion date.
7. Approve `content` and `design-systems` work on ST-01 to ST-14 as study-only drafts (the strings are COUNSEL-READ; none is production copy).
8. Say whether to run the diary wave, and who pays for the throwaway build and any paid diary tool.
9. Confirm that the words in `COPY_INVENTORY.md` line 225 are the NX-33 promise to use as ST-01.

## 16. What each outcome changes

Applies the bars mechanically. "Today's default" is what ships if nothing passes.

| Outcome | What changes |
|---|---|
| B1 and B2 and B4 pass | The evidence supports D9 for P2a (amend M13 rule 4 and Tier C for a user-initiated read of dates) and supports starting P2b design work. P2b build still needs BL-871, counsel tier B, the log canary and the other gates in [PR 747] section 3. The study does not clear those |
| B1 passes comfort but fails comprehension (F1 or F3) | Rewrite the sheet, subject to counsel, and re-test. P2a promise copy does not ship. Today's default stays |
| B1 fails on comfort or any "watching" or "painful" | Build P0 and P1 first, P2a second, not P2b. L2 stays comfort-only (never built from this study) |
| B2 stop: fewer than 6 of 10 on "what is sent to us" | The design is not honest enough whatever the comfort score. Add or reword a line (counsel), re-test. No P2a promise copy ships |
| B5 stop: 3 or more say "less" trust | Stop P2. Keep the NX-33 promise. F4 falls back to PW-A for P0/P1 only |
| A candidate has 3 or more "less" | That candidate is dropped from F4. The others stand if their counts allow |
| B3 dark-pattern result | Ship the plain sheet. Polish is not used on any permission sheet |
| B4 fails | Rewrite the Not now path and words first. P2a copy waits |
| B6 passes | The date-only card is allowed in P2b (still subject to everything in B1 and the other gates). `card.days.alt` is used only if more participants prefer it than `card.body.days` |
| B6 fails or any "painful" | Pause date-triggered cards for everyone, send to `product` the same day. P2b is not built as a card; the composer shelf may still be tested |
| B7 any result | Place never ships on a card. A welcome result is recorded and does not change the build |
| B8 fails | Demote festival work; rewrite `occasions.intro` |
| B9 stop | Pause date-triggered cards for everyone. Hide controls are tested again after changes |
| B10 | Only answerable if the diary runs. If not, the shared cap stays |
| Mixed (some pass, some fail) | The conservative default for the failed bar applies; the passed bars are recorded but do not combine into a pass of the whole |
| Fewer than 8 usable sessions | No bar is computed. Recruit more; do not decide on this |
| Runner effect (3 or more participants apart on a bar) | Report both sets; the more conservative one decides |

D9 itself is the founder's. This study offers evidence, not the decision.

## 17. Sources, checks run, unverified, open questions

Sources read on 10 Nov: `docs/design/notifications/PARENT_STUDY_PLAN.md` (the whole file); `docs/research/USER_RESEARCH.md`; `docs/research/NOTIFICATION_EVIDENCE_2026-11-01.md`; my earlier critique; `.claude/skills/user-research/SKILL.md`; and, via the GitHub REST API and `git show` after fetching the branches:
- PR 747, NX-39 v2, branch `docs/nx-39-memory-library-10nov`, head 4f5153d5b7b12d362c622b97a9fe2e613723059f: `NX-39-memory-library.md` (sections 2, 3, 5, 6, 8, 10, 12), `BACKLOG.md` row BL-857, and the council record (D9 and T10 lines only).
- PR 752, branch `docs/content-memlib-words-10nov`, head d1ed0eb4ca4bc74c135216f40fc03fe7bc316d73: `docs/design/specs/MEMORY-LIBRARY-WORDS-10nov.md` (sections 2, 5, 6, 7, 11, 14).
- PR 751, branch `docs/design-memlib-consent-batching-10nov`, head 33912d2260f32d67aeba66bf89a64b8492e8cb2a: CS-S1 only.
- PR 748, branch `docs/privacy-memory-library-10nov`, head 9bb1696c4f338305df6106108e75a98734c2b5fb: the hard-season risks (R6 and the loss-language rule) only.

Checks run: head SHAs matched the four PRs by REST; fetched the four branches; the new file was scanned for em dashes, en dashes, curly quotes, ellipsis characters and any non-ASCII character (section 18).

UNVERIFIED:
1. The exact strings were taken from the PR heads on 10 Nov. If #752 changes before the study, the stimuli change with it.
2. NX-39 BL-857's scope says the plan lives under `docs/research/studies/2026-11-library-permission/` and names PW-A to PW-D. This file is at `docs/research/studies/MEMORY-LIBRARY-STUDY-PLAN-10nov.md` because that is where the task put it. FINDINGS.md goes in the folder BL-857 names; `product` may want the plan moved there.
3. Whether a research consent template or verified support-line list exists on a branch I cannot see.
4. That the D9 text in [PR 747] (its v1 row D9, "Amend M13 rule 4 and mark Tier C reopened") is still the decision's meaning in v2; v2 only says "D9 amended". I read v1 from commit 359f4ea.
5. That "the picker returns the date without a prompt" (BL-843), Limited-library behaviour and every Apple API claim in [PR 747] section 14 are true. The study tests words, not Apple behaviour.
6. That the words in `COPY_INVENTORY.md` line 225 are what NX-33 promises today. The founder confirms (section 15, item 9).
7. All "x of N" numbers, the 50-minute length, the group sizes and the 30 and 90 day retention are proposals.

Open questions for the founder or `product`:
- Is three promise lines (PW-A, PW-B, PW-D) acceptable, or should PW-C also run? (Section 5.)
- Does the founder want B6 to count "welcome" only, or "welcome or fine"? Default: welcome only.
- Is a second runner available who is not a friend of the participants? If not, is the founder willing to recruit fewer close-circle participants rather than run them himself?
- Should the diary wave run, and who builds it?
- Does `product` agree that the B4 comfortable-No bar (ADDED) and the "no participant says watching or painful" widening of B1 belong in NX-39 section 12? They are not in the table there.
- Who writes the invitation, and does counsel read it?

## 18. Content scan

A scan for em dashes, en dashes, curly quotes, the ellipsis character, emoji and other non-ASCII was run on this file before commit; the result is in the pull request description.
