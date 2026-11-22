# Moments usability plan (moderated sessions, privacy primer check, TestFlight diary)

Status: PLAN, not findings. We have no recordings and no participants yet. Nothing here is evidence.
Owner: `user-research`. Reviewer: `product`. Spend, recruiting and incentives: founder decisions (section 9).
Folder note: when the founder approves, this plan is copied into `docs/research/studies/2026-12-moments/PLAN.md` and the guide into `GUIDE.md`.
Date drafted: 21 Nov 2026.

## 0. Read this first (sources and limits)

- Reconciled on 21 Nov 2026 against `docs/product/prd/28-moments-tab.md` (PRD 28, v3, status PROPOSED) and `docs/design/moments-design-closure.md` (rulings DC-1 to DC-8, proposed additions G-01 to G-10). Row ids are PRD 28 rows written `R<n>` (full id `NS-53-R<n>`), open questions `O-<n>`, gates `G<n>`, experiments `E<n>`. `DC-<n>` and `G-<nn>` are the closure file's ids.
- Both files are PROPOSED or RULED on paper. Nothing in them has been built or seen on a phone. Where this plan describes how a screen behaves, it quotes the spec row, not a device.
- One known conflict is carried, not settled here. DC-1 (founder-decided) puts a quiet "Choose pictures" text row below the ask card in the never-asked state (ACC-0). The PRD text of R270 and D2 still says the door never shows beside the ask card in ACC-0. DC-1 says `product` amends R270 and D2. Until that edit lands, A3 below follows DC-1 and the build under test must say which one it implements.
- This plan sits beside existing research, it does not replace it. PRD 28 section 20 already defines experiments E1 to E11, `docs/product/moments-tab/EXPERIENCE-AND-MOTION.md` section 9.1 defines tasks T1 to T12 for the G4 five-parent check, and `docs/product/moments-tab/R1-research-plan.md` is the earlier discovery plan. Where a task here repeats one of those, the table in section 4.3 names it so the same session can serve both and nothing is counted twice. Task ids in this plan are U1 to U6 to avoid clashing with T1 to T12.
- The synthesis in `docs/research/USER_RESEARCH.md` is desk research only, with no primary interviews. All assumptions below are marked assumed.
- All times and costs are ESTIMATE. None is a quote. PRD 28 section 21.2 lists no research spend; section 9 below is a new founder money item that `product` should add there.

## 1. The decision this study changes

Before Moments ships, `product` decides per assumption below: ship as designed, ship with a named change, or hold and redesign. The open items it feeds are O-56 (door placement, DC-1), O-62 (one picture or six in the first door), O-59 (the word on the set-aside button, DC-6), O-17 (where "Choose which pictures" sits, DC-7), the default tab check (R7, DC-4) and the G4 gate. If every result would leave the design as it is, we do not run the study.

## 2. Assumptions to test

Each has a plain statement, why it is risky, and the spec rows it rests on. All are assumed, not evidenced.

| ID | Assumption (assumed, not evidenced) | Why it is risky | Spec ref |
|---|---|---|---|
| A1 | One picture first: a parent can choose one picture in the picker sheet, press Start, and reach an empty capture screen without feeling something is missing or being unsure what happens next. | Capture opens with the words field empty and no text about the pictures (PRD 9.1 step 4, R269). A parent who expects to add words first, or who expects the picture to be the whole letter, may read this as unfinished. The first door ships one picture while the founder decides one or six (O-62, BL-1472; the code holds `selectionLimit = 1`). | PRD 9.1 steps 1 to 4; R269; R272; O-62 |
| A2 | The ask card and Not now: the ask card (the library-read ask in ACC-0, "Show days" and "Not now" of equal weight, below the real cards) reads as an offer a parent can leave, not a task they owe. The same holds for "Not now" on a day card, which sets it aside until the next local day. | Voice rules ban guilt and gap counting (VOICE.md; R11). A card that lands as homework is the failure Qeepsake reviewers describe (USER_RESEARCH.md section 3). A parent may also expect "Not now" to mean never (DC-6 risk line). | PRD 8.2; R71; R73; R28; DC-6; G-04 (button names) |
| A3 | The door: a parent finds "Choose pictures" without help and can say what will happen when they use it. In ACC-0 the door is a quiet text row below the ask card (DC-1). After a No, Denied, Restricted, Limited or flag off, it is the first row of the tab. In ACC-2 it is the last row of Recent (DC-1), the day sheet's "Choose other pictures" row and capture Add. The tab itself is found in the bar (Home, Moments, Book, Me; R1). | If the door is missed or confused with the Limited-library control ("Choose which pictures", O-17), nothing downstream matters. DC-1 says the door may take some yes answers and cannot be measured by telemetry (O-38 stays No), so these sessions are the only measure. | R1; R270 (amended by DC-1); R75; DC-1; DC-7 (O-17); EXP 2.2 |
| A4 | The day card: a parent reads what one day card holds (lead picture, reason line, weekday and date, optional place or occasion line, optional own label, optional "A letter is here" row, Continue and Not now) and finds a given day by its date in Recent. | The card date is the weekday and date of the pictures (R16). The letter date is today unless the parent picks another, and the pictures' date is an optional chip, never preselected (PRD 9.1 step 4). A parent who thinks "the day I added it" may look under the wrong day. | R16; R186; R210 ("Earlier" list, G-07); PRD 9.1 step 4 |
| A5 | Name this day: when a parent types their own words for a day (up to 60 characters, stored on the phone with the day key), they expect the words to be kept exactly as typed, and they do not expect the app to suggest, complete or tidy them. They can tell their own words from the app's reason and place lines. | Constitution: the app never writes or rewrites a person's words. The card model keeps the parent's label and the machine lines as two disjoint fields shown in different type (R201). A parent who assumes autocomplete or a "smart" label, or who reads the reason or place line as written by them or by the app as a story, has the wrong model. Not the same as a typed-day card (K-DAY), which is a day the parent marked. | R55; R201; R17; R11; PRD 7.4 |

Two further checks run in the same sessions because they gate everything else:
- P1: first-run primer comprehension (section 6). Rows R72, R218, PRD 8.5.
- P2: parents can tell what stays on the phone and what, if anything, leaves it, in their own words. Same rows.

Out of scope, and never tested: any feature that writes, rewrites or summarises a person's words. The test build or prototype must not generate any text for the parent. Name this day is the parent's own text only.

## 3. Method

- Moderated, think-aloud usability test, remote (video call) or in person, 45 minutes. The Moments flow runs on a TestFlight build or a clickable prototype using the fictional family "Asha". The skill table suggests about 5 per round, then iterate (Nielsen, 2000). Plan: Round 1 with 5 parents, fix, Round 2 with 5 more. Round 2 happens only if Round 1 changes the design.
- The build under test must state, in its release note, which of these it contains: the modal picker in our sheet (R269, PR 18b-1a) or the inline host (18b-2), the host layout (DC-2: Layout B is the default), the door placement (DC-1 or the text of R270), and the O-62 picture limit. The Moments flow is not testable on a device until the picker rows run (G1a-P, DM rows in the closure file); a prototype is used until then, and the plan says so in findings.
- The founder or a human researcher runs sessions. The `user-research` agent does not talk to participants. This plan and the guide in section 4 are for them.
- Parents use a test account with the fictional baby "Asha" (fixture `asha-lib-v1`, synthetic dates and places, no real family) and pictures supplied by us (no pictures of real children, ours or theirs). Participants never use their own child's photos or details in a session.
- After tasks: System Usability Scale (10 items) and three open reflection questions.
- Reporting follows PRD 28 section 20: x of n, no percentage under 20.

## 4. Session script and tasks

Moderator rules: never pitch, never correct, never promise features, never explain a screen before the parent has tried it. Open questions first. Silence is fine. If the parent is stuck for more than 90 seconds, note it, then offer a neutral nudge ("What would you try next?"). Count a hint as a failure for that task.

### 4.1 Before (5 minutes)
Read aloud: who we are, that we are testing the app and not them, that nothing they do is wrong, that they can stop or skip any task, that recording is optional and off unless they said yes in writing, and that we will not record or ask about their child. Confirm consent was signed (section 5.3).

### 4.2 Warm-up, their own story (5 minutes)
- "Tell me about the last time you wanted to hold on to something your child did."
- "What did you do with it afterwards? Where did it end up?"
Take notes in codes only (P01). Do not ask for the child's name or age beyond a range. If they share something painful, do not probe (section 5.4).

### 4.3 Tasks (25 minutes)
Each task has a scenario, the observation, and what to ask afterwards. Scenario wording uses "Asha" and never real details. The last column says which existing task or experiment the same observation can serve.

| Task | Tests | Scenario (read aloud) | Observe | Ask after | Also serves |
|---|---|---|---|---|---|
| U1 Find the way in | A3 | "You have a few quiet minutes. You want to look at or add to a day for Asha. Show me where you would start." Run once in the never-asked state (ACC-0) and, for a second scenario, after a prior No (ACC-1). | First tap, wrong turns, whether they find the tab, then the door row, whether they name the door's purpose before opening it | "What did you expect to find behind that?" and "What is this tab for?" (asked again after U2) | EXP T1, T3, T4; R7 |
| U2 Start from one picture | A1 | "You have one picture from the park. Choose it and start a letter." (Stop at the first capture screen.) | Whether they pause, look for more fields, say "is that it?" or ask what Start does | "Is this finished or not? What makes you say so?" then "What do you think happens to the picture now?" | EXP T2, T9 |
| U3 The ask card and Not now | A2, P1 | Show the ask card in ACC-0, unprompted. "Tell me what you see and what you would do." Then a day card: "Say what you would do if you did not want to see this one today." | Read time, leaving without anxiety, answer attempts, any language like "I should" or "I have to"; what they expect Not now to do | "How did that card feel?" then "What would happen if you ignored it?" and "If you tapped Not now, when would you expect to see it again?" | EXP T10; E5; G4 |
| U4 Read a day card | A4 | "Find what you added on the day of the park picture." Then: "What is on this card?" | Whether they match the card to the day they expect, whether they explain each line correctly | "If you chose a picture on Tuesday that was taken on Sunday, which day would you look under?" | G4 |
| U5 Name this day | A5 | "Give this day a short name that would mean something to you later." | What they type, whether they look for suggestions, whether they pause waiting for the app to complete or fix their words | "What do you think the app does with what you typed?" and "Would you expect it to change anything?" and "Which words on this card are yours?" | R55; R201 |
| U6 Return later | A3, A4 | "It is two weeks later. Show me how you would find that day again." | Path used, whether the label or the picture helps, whether they use Recent or "Earlier" | "How did you know it was the right one?" | G4 |

Counterbalance: rotate U2, U3 and U5 order across participants so the order does not drive the result. Always do U1 first (unprimed) and U6 last. The order test of EXP T5 (picker first then ask card, then the reverse) is a separate G4 item and is not run here unless `product` asks.

### 4.4 Reflection (5 minutes)
- "What was the easiest part? What was the most confusing part?"
- "If you used this for a month, what would you probably do, and what would you probably skip?"
- SUS questionnaire.
- Close: thank them, confirm incentive and deletion date, remind how to withdraw.

## 5. Recruiting and consent (parents only)

### 5.1 Who
Adults 18 and over who are parents or carers of a child aged 0 to 3. Target mix for 10 participants (5 plus 5): at least 2 second-or-later-child parents, at least 2 fathers or non-birthing parents, at least 2 who speak another language at home. These are targets, not guarantees. Moments has no invitation or relative flow in the PRD, so relatives are not a target. We do not recruit anyone whose child is currently seriously ill, or anyone recently bereaved, to avoid avoidable harm; if a participant discloses such a situation, follow 5.4. Anyone under 18 is out, as Moments does not render for them (PRD 8.3).

### 5.2 Source and bias
Personal networks are fastest and cheapest but biased towards people who like us and who are like the team (the skill file requires this to be stated). Parent communities and a paid panel reduce this bias at a cost. Recruiting route is a founder decision (section 9). Every findings file must name the route and its bias.

### 5.3 Consent (written, plain, before any session)
The wording follows COORDINATION.md section 10 "The door": a Shown, Records, Never, and Decline and withdraw line. Section 10 is written for in-app doors. A research consent is not an in-app door, so the lines below apply its shape and name which parts have no in-app equivalent. Whether PRIV-R21 itself applies to a study consent form outside the product is a question for `privacy` and `legal` and is UNVERIFIED here. These are draft lines for `legal` and `product` to review, not final legal text. The founder merges legal text (D-125).

| Line | What it holds in this study |
|---|---|
| Shown | The exact words the participant reads, as one versioned consent file kept outside the repo (version id and date on the form, a hash of the words recorded with the signature). There is no `packages/content` key and no policy link: the form is not product copy. It says: "You will see a test version of the app with a made-up baby called Asha. You will use pictures we give you. We take written notes under a code like P01, not your name. If you say yes, we also record your screen and your voice. This is optional and off by default." It also names who sees notes (the researcher and the founder only), where they are kept (founder-controlled storage outside the repo) and the deletion date (ESTIMATE: 90 days after the last session, founder to confirm). |
| Records | Held outside the repo, on a sign-in sheet or e-sign record kept by the researcher: participant code, form version, hash of the words shown, the act (agreed, agreed without recording, declined), method (paper, e-sign or spoken with a witness note), surface (in person or video call), date and time, language of the form, and the recording choice. No name goes into any file that enters `docs/research/`. Where the phone fields of PRIV-R21 (app version, build, OS) do not apply, they are left out. No row is written to the product's database or analytics. |
| Never | Follows PRIV-R02 and PRIV-R10, and the PRD 8.5 never-list for Moments: we never record or ask about the participant's child; never ask for the child's name, birth date, gender, place or any picture of them; never collect contacts or government ids; never put a name, recording, quote with identifying detail or any L4 data in the repo, analytics, logs, crash reports or a push; never use anything said in marketing or in the app. |
| Decline and withdraw | No, skip a task, say no to recording, or stop at any time with no reason, and still receive the thank-you. A participant can ask us to delete their notes and recording any time before the deletion date. Withdrawal does not touch their account: export and deletion of any real app data they hold work as before (PRIV-R09). Nothing about declining is noted as a finding about the person. |

### 5.4 Care for tired or struggling parents
- Offer short slots and evening or weekend times. Allow a baby on the lap or a break mid-session.
- If a participant shows distress or discloses risk: pause, be kind, stop the task, share support information prepared in advance by the founder, do not probe, and note only "session ended early" (PRD R174: a distress answer stops the session).
- No child is interviewed, recorded or present on camera. If a child wanders into frame, the moderator asks the parent to move the camera, and nothing is noted about the child.

### 5.5 Notes and data rules
- Notes are taken by participant code, never name. No real family details (child name, birth date, location, workplace) in notes, even outside the repo, where avoidable. If a participant says them aloud, do not write them down.
- Only de-identified findings enter `docs/research/`. Quotes are trimmed of anything identifying and used only if genuinely said (never invented or paraphrased into a quote).
- The study uses the fictional family "Asha" in all prototypes and any repo artefact (CLAUDE.md privacy rules).
- No analytics from the TestFlight build are used by this study (section 8).

## 6. First-run privacy primer comprehension check

Question this answers: do parents understand what the primer promises, in their own words, and does it make them more or less willing to continue? This matters because a primer is a promise (CR-73: what users are promised is the founder's).

Method: after U3, if the parent taps the yes on the ask card, show the primer sheet as built (R72, R218: one sentence, equal Continue and Not now, the Shown, Records, Never and Decline lines behind one "What this does" disclosure). Use the real copy from `packages/content`, unchanged. The primer words are placeholders until `content` and counsel write them (PRD 8.5, 16.1); if they are not final at session time, record the key version shown and do not report this part as a verdict on final copy. Then ask the five questions without the screen visible, followed by a look-back round.

Recall questions (open, not multiple choice, asked without the screen visible):
1. "In your own words, what did that just say the app does with what you add?"
2. "Who can see what you add?"
3. "What stays on your phone, and what, if anything, leaves it?" (tests P2)
4. "What would you expect to happen if you wanted to remove something?"
5. "Is there anything it did not say that you wanted to know?"

Scoring (two scorers independent, then reconcile): each answer is Correct, Partly correct, Wrong, or No answer, against the true behaviour as stated by the `privacy` and `legal` owners (they supply the answer key before sessions, from PRD 8.5 and the policy of record).

Success reading (PROPOSED): at least 4 of 5 participants answer Q2 and Q3 correctly with no look-back, and no participant holds a wrong belief that makes the product seem safer than it is.
Fail reading (PROPOSED): 2 or more participants hold a wrong belief on Q2 or Q3, or any participant believes something false in the app's favour. A single false-in-our-favour belief is enough to send the copy to `content` and `legal` as a priority issue. The PRD bars for the primer (the three variants of 16.1, T6) win if they differ.
Also record sentiment unprompted ("relieved", "wary", "did not read it") and whether they read it at all.

Never use the primer test to nudge consent upwards. We are testing understanding, not persuasion (and the ask must never be tuned to raise grants, PRD principle P3).

## 7. Success and fail readings per assumption

Thresholds are PROPOSED, for a round of 5 participants. With n=5 these are signals for design decisions, not statistics. Report counts, not percentages. Where PRD 28 or EXPERIENCE-AND-MOTION already sets a bar for the same observation (T2: 5 of 5 complete and none asks what Start does; T4; T10; T11), that bar is used and these readings are the second tier.

| ID | Supported (keep design) | Contradicted (we were wrong) | In between |
|---|---|---|---|
| A1 One picture first | At least 4 of 5 complete U2 and say the letter is not done, or know what happens next, with no hint. | 2 or more say it feels unfinished, hunt for missing fields, or cannot say what happens next. | 3 of 5: ship with a small copy or cue change, retest in Round 2. |
| A2 Ask card and Not now | At least 4 of 5 leave or answer the card calmly, none use obligation language ("I should", "I have to", "I am behind"), and at least 4 of 5 say Not now on a day card returns it later, not never. | 2 or more describe it as a task, a reminder of what they have not done, or feel guilt. Any one participant reporting guilt or pressure is raised to `content` regardless of count (E5 blocks launch until the copy changes). | 1 participant: content review of card copy. If 2 or more expect Not now to mean never, `content` and `product` revisit O-59. |
| A3 The door | At least 4 of 5 find the door in U1 unaided, name its purpose correctly, and none confuses it with the Limited-library control. | 2 or more miss it, or name its purpose wrongly. | 3 of 5: `design-systems` reviews label and placement (DC-1, O-17). |
| A4 Day card | At least 4 of 5 find the right day in U4 and U6 and describe the card correctly. | 2 or more file by a different day than the app does (the added-on versus taken-on mismatch), or mis-describe the card. | 3 of 5: add a cue and retest. |
| A5 Name this day | At least 4 of 5 type a label without looking for suggestions, expect their words to stay as typed, and name their own words on the card correctly. | 2 or more expect suggestions, completion or tidying, are surprised that words are kept as typed, or take the reason or place line for their own words. Any belief that "the app will write it for me" goes to `content` and `product` immediately. | 3 of 5: copy near the field; retest. |
| P1 Primer comprehension | See section 6. | See section 6. | See section 6. |

Overall SUS: report the score and the count of participants below 68 (commonly cited average). The SUS is a secondary signal; the per-task readings decide.

What would prove us wrong, plainly: if most parents do not find the door, think a picture alone is incomplete, read the ask as a duty, expect the app to fix their typed words, or misunderstand what is kept, then the Moments design as it stands should not ship without change.

## 8. TestFlight diary-study variant

Question: does Moments fit into real days over weeks, and do the day card, ask card and Name this day behave as assumed outside a quiet test room? This is the two-week diary of E4 and E5 (PRD section 20), run with the same participants where possible. It tests A2 and A4 over time and catches problems moderated sessions cannot.

- Who and size: 8 to 10 parents (skill table), a mix of the moderated participants plus new ones. Adults only. Requires a TestFlight build with Moments enabled. Release and TestFlight distribution are founder-controlled steps (store builds are in the CR-73 list). E11 (neutral nudge, up to 20 parents) and E8 (picker only versus library read) are separate and are not folded in here.
- Length: 2 weeks (skill table range 2 to 4 weeks; 2 chosen to limit burden on tired parents, ESTIMATE, founder to confirm).
- Use is real: parents use the actual app on their own device. Their pictures stay on their phone. We never ask them to send us a picture, a label, a transcript, a date or their child's name. We collect nothing about content.
- Diary prompts (not daily, to avoid homework): two short check-ins per week, three questions each, answered in a form without a child's name:
  1. "Did you add anything to Moments in the last few days? What made you do it, or not?" (E4, tester question 1)
  2. "Was there a moment when the app asked you for something? What did you do?"
  3. "Did anything in the app make you feel you should do something? If so, what?" (E5, tester question 3)
  Plus one open line: "Was there a moment you could not find something, or were not sure what the app was doing?"
  Responses are free text typed by the parent and are never summarised or rewritten by a tool. Remind parents not to include names or details of their child.
- No analytics. Analytics is off through 1.0 (PRD section 20 note; D-124 is UNVERIFIED here), and the analytics enum for Moments is a founder "no" (DC-8, O-38, O-49). Any counts come from what a parent reads out, as the PRD allows ("x of n"). The consent form says exactly this in its Shown and Never lines (5.3).
- Closing 20-minute call (optional): walk through what they did, under the same rules as section 4.
- No streaks, no nudges to make parents use the app more during the study. The study watches natural use. Do not message people who go quiet beyond one neutral "no pressure" thank-you; a quiet week is data, and is never framed as a gap or failure.

Supported (PROPOSED): at least half of n say they opened Moments unprompted (the E4 bar), and no one reports the ask card or a card as pressure. Contradicted: fewer than half of n opened it unprompted, or any one parent says a card or a push made them feel they should (E5: this blocks launch until the copy changes). The reading depends on novelty effects and a self-selected sample; say so in findings.

## 9. Cost and time (ESTIMATE) and the ask to the founder

Everything here is ESTIMATE with no quote behind it. Unit prices vary by panel and region. Use them to size the ask, not to commit. PRD 28 section 21.2 has no row for this; `product` adds one before the founder decides.

| Item | Moderated (2 rounds, 10 parents) | Diary study (8 to 10 parents) | Notes |
|---|---|---|---|
| Plan, guide, answer key | 1 to 2 days of agent time, no cash | included | Review by `product`, `privacy`, `legal` |
| Recruiting | $0 (personal networks, biased) to about $1,000 to $1,500 (panel or recruiter, ESTIMATE) | $0 to about $1,000 (ESTIMATE) | Route is a founder decision |
| Incentives | about $50 to $75 per 45-minute session, so $500 to $750 for 10 (ESTIMATE) | about $60 to $100 per participant for 2 weeks, so $480 to $1,000 (ESTIMATE) | Gift cards; founder decision |
| Tools | $0 if using existing video calls and a shared doc outside the repo | TestFlight is free; a form tool is $0 on a free tier (ESTIMATE) | No paid tool without approval |
| Researcher time (human) | Founder or hired: about 10 sessions at 1 hour plus notes, so about 20 to 25 hours (ESTIMATE) | About 8 to 12 hours of reading and one call each (ESTIMATE) | Agent does synthesis |
| Elapsed time | Recruit 1 to 2 weeks, Round 1 in 3 to 5 days, fixes 1 week, Round 2 in 3 to 5 days: about 4 to 5 weeks end to end (ESTIMATE) | 1 week setup, 2 weeks of use, 1 week synthesis: about 4 weeks (ESTIMATE) | Can overlap after Round 1 |
| Total cash range | about $500 to $2,250 (ESTIMATE) | about $500 to $2,000 (ESTIMATE) | Both studies: about $1,000 to $4,250 (ESTIMATE) |

The ask, stated plainly. We are not assuming any budget. Please decide each of the following:
1. Do we run the moderated study (yes or no, and when)? Smallest useful version: Round 1 only, 5 parents, personal-network recruiting, no cash except incentives, about $250 to $375 (ESTIMATE), with the bias stated in the findings.
2. Do we run the TestFlight diary study (yes or no, after which build)?
3. Recruiting route: personal networks, parent communities, or a paid panel.
4. Incentive amount and form, or none (volunteers only, with the bias stated).
5. Who runs the sessions: you, or a human researcher you name.
6. Where raw notes and consent forms are stored (outside the repo) and the deletion date.

Until these are answered, no recruiting or contact with participants starts.

## 10. How results feed the backlog

1. After each round, `user-research` writes `FINDINGS.md` in the study folder. It leads with the decision and the answer in three lines, then findings with participant codes, confidence (low, medium, high) and the decision informed. Counts only; no one quote becomes a trend.
2. Each assumption in section 2 gets a status in `docs/research/USER_RESEARCH.md`: evidenced (with study), assumed, or contradicted.
3. Implications go to `product` as backlog proposals, one per finding, in the COORDINATION.md section 10 form (human voice, Given/When/Then). Not edited into `docs/BACKLOG.md` by this agent.
4. Routing:
   - Layout, door, day card, target size or flow issues: `design-systems`.
   - Ask card, primer, field or label wording issues: `content` (copy lives in `packages/content`; if a content rule test fails, fix the copy, not the test).
   - Wrong beliefs about privacy or storage: `privacy` and `legal` (promises are the founder's).
   - Anything that looks like a metric: it stays a question in the next study, not an event. The Moments analytics enum is a founder "no" (DC-8).
5. A contradicted assumption on A5 (parents expect the app to write or fix their words) is a trust issue, escalated the same day to `product`, with no change to the constitution.
6. Findings are framed as what families do and how the design can help them, never as parents falling short.

## 11. Risks and limits

- n=5 per round finds usability problems, not rates. Do not quote percentages.
- Network recruiting skews friendly and similar to us.
- A prototype with a made-up baby lowers emotional stakes, so the ask card (A2) may feel lighter than it will with a real child. The diary study partly corrects this.
- A prototype is not the build: Apple's picker, its first-time panel and the switcher cover (DC-5, G-01) are device behaviour no prototype shows. Say so in findings.
- Remote sessions miss body language and background interruptions; allow for baby noise.
- Test-room behaviour is not habit. Do not claim retention from this study.
- DC-1 and the PRD text of R270 disagree until `product` edits R270 and D2. Findings on A3 name which placement was tested.
