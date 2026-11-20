# NS-03: The family-hears-it pilot (concierge test, 8 to 10 parents, no build)

Status: Locked v1.0, 20 Nov 2026 (council round 2). Changes after lock need a PR that lists every changed id.

Author: `product` (CPO lens). Rank 3 of 7 (closed X1, X2). Index: `README.md`. Earlier: Draft v1, 11 Nov 2026. Ruled 20 Nov (Karma, council round 2): T5 (no dates or build numbers in cards), D4 (consent-record retention), D5 (hand-sent measures), D13 (device evidence).

Nothing in this card is built. The pilot runs on the parents' own phones and their own messages. No code, no server, no account, no upload to our systems. A research card still carries the full card shape so nobody has to guess what happens in an edge case; sections that cannot apply say why.

Tags: EVIDENCE = repo file or page read in the session that wrote the line. HYPOTHESIS = about parents or grandparents. UNVERIFIED = not read or not run. PROPOSED = a number `product` proposes. The law and Apple facts below come from the exec council record of 10 Nov 2026 (`exec-rulings-2026-11-10-expansion.md`), which says it read the FTC COPPA FAQ and Apple's App Privacy and App Review pages that day. Not re-opened since: UNVERIFIED, and counsel must confirm.

## 0. Gate: a copy of a child's voice leaving the phone

Any copy of a child's voice leaving the phone needs a `security-architect` read and a counsel read first (closed X2; exec Q1). That holds for this pilot, for share-one-letter with sound (NS-05 Level 2) and for any hosted link (NS-05 Level 3).

Counsel read before ANY arm (Karma, red team 11 Nov): counsel reads the consent text (section 15) and the recruit and instruction scripts (section 7) before any parent is contacted, in either arm. No parent is recruited, consented or sent an instruction until that read is on record in the pilot file.

- Arm W (words and picture): the parent sends the PDF of one letter. No recording. Starts once the counsel read of the consent and scripts is on record. The security read is not needed for Arm W, because the file is the Export output the app already makes and carries no voice. Whether a one-letter PDF can be cut from the current export is UNVERIFIED (owner `mobile`, before recruiting); section 4 gives the fallback (a screenshot of the one letter page). The whole-book PDF is never a fallback.
- Arm V (words plus the recording): the parent also sends the audio file. Arm V starts only after both reads are on record in the pilot file: `security-architect` on sections 3, 4 and 15, and counsel on the voice-specific lines of sections 7 and 15. Arm V parents are told in the consent, in plain words, that they will send a recording of their child's voice to a relative.
- Default if counsel has not read the consent and scripts by the step 3 gate in section 5: the pilot does not start (no arm), and every later step moves by the same number of days. If counsel has read the consent and scripts but not the voice lines: Arm W only.

## 1. Who and when

- Parents: 8 to 10 adults aged 18 or over, each with a child under 5 and at least 3 kept letters in {brand.name} (TestFlight or alpha), recruited by the founder from his invited friends and family list. HYPOTHESIS: this group is warm toward the product, so results lean positive; the success lines in section 8 are set with that in mind.
- The moment: a parent has kept a letter a grandparent would love, and today they would screenshot it or forward a voice memo. We hand them nothing new and watch what happens when they send it with what they already have.
- Recipients: one relative per parent, an adult the parent picks (a grandparent, aunt, uncle or close friend). At least 2 of the 10 live in another country, if the founder's list allows. At least 2 parents with a non-English letter if any exist on the list; the current store build transcribes English only (D-121), so this may be 0 (UNVERIFIED, owner `user-research`, at recruiting).
- Not recruited: anyone under 18, anyone the founder pays, any App Store reviewer, any competitor's staff, anyone outside the US storefront's launch geography without counsel's Q22 answer covering them as a recipient (recipients abroad receive a message; they are not participants).

## 2. Why

- The job (for the parent): "I go to my own phone and my own messages to send one letter, with the voice if I want, to a grandparent, so that they can read it and hear it without an app."
- The job (for the team): find out whether a family member will open, listen to and ask for more of a parent's letter, before any hosted audio, link or Share screen is built.
- What goes wrong today: hosted family listening (NS-05 Level 3, NS-28) is the only candidate that adds server cost per family and moves the privacy label (Audio Data collected and linked). Building it on a guess is the expensive error. Evidence tag: HYPOTHESIS (no parent evidence that grandparents want to listen; the research file's competitor counts are UNVERIFIED, pages read by another agent).

## 3. What, and Not in scope

What: a concierge test in two arms (W: words and picture; V: words plus recording), one week per parent, three scripted check-ins, a one-page read-out with an outcome from the fixed table in section 8.

Who runs it:

| Role | Who | Mode |
|---|---|---|
| Runs conversations, keeps the log | `user-research` with the founder (a person talks to parents; an agent cannot) | human |
| Plan, scripts, read-out | `product`, `user-research` (an interactive session playing `user-research`; CTO pass) | agent |
| Reads | `security-architect`, counsel (through the founder) | human and agent |

What the team collects, in full: a participant code (P01 to P10), consent yes or no with the consent text version and date and method, the answers to the questions in section 7 as short notes, and the counts in section 8. Nothing else.

What the team never receives: a letter, a recording, a picture, a child's name, a screenshot of a letter, the recipient's name or contact. If a parent sends one by mistake, it is deleted unread beyond what is needed to see what it is: the founder deletes the message from the thread on every device he holds, and Messages in iCloud carries the deletion to his other devices. The mistake is logged by participant code only, and that parent's remaining questions continue without it.

Not in scope: any app change; any share button (that is NS-05); any hosted page, link or upload; any price question; any reward or offer code; any contact with recipients by the team; any analytics.

## 4. Happy path

1. The founder confirms the principle (OQ-1).
2. Counsel reads the consent and scripts; `security-architect` reads sections 3, 4 and 15. Both reads are filed in the private pilot file (a dated yes, not their text).
3. The founder sends the recruit message (section 7). A parent who says yes receives the consent text for their arm and answers Yes.
4. The researcher assigns the arm at the moment of consent (rule in section 5, step 4).
5. The parent receives the instruction for their arm and picks one kept letter they are happy for the recipient to have.
6. Arm W: in the app, Export from Settings; take the one-letter PDF (or, if that cannot be cut, a screenshot of the one letter page) and send it by the message app the parent already uses with that person.
7. Arm V: also send the recording file for that letter, from the export's `audio` folder. If the recipient does not use iMessage or WhatsApp, a recording longer than about 2 minutes may not arrive by SMS or MMS (carrier limits of about 1 MB are common, UNVERIFIED per carrier; originals are about 0.48 MB per minute, 06-nfr 11.3); the instruction tells the parent to send it by email or a messaging app instead.
8. The parent tells the recipient it is a letter to {child}, in their own words. The team gives no script for that message.
9. Day 3: Script A. Day 7: Script B to the parent and Script C relayed by the parent to the recipient.
10. After the last day 7: the read-out with counts and an outcome. A thank-you note follows.

## 5. Plan, in order (gates, not dates)

Ruled 20 Nov (Karma, council round 2, T5): this card states order and gaps only. The calendar for each step lives in the roadmap (`docs/roadmap/`), which `product` keeps. If OQ-1 is answered later than planned, every step moves by the same number of days. No contact on a US federal public holiday.

| Step | What | Who | Gate or gap |
|---|---|---|---|
| 1 | Founder confirms the principle (OQ-1) | Founder | Day P |
| 2 | Consent texts and scripts go to counsel; the security read starts | `product` | P plus 1 working day |
| 3 | Security read due (sections 3, 4 and 15); counsel read of consent and scripts due | `security-architect`, counsel | P plus 5 working days. Without counsel's read: no arm starts and every later step moves. Without the security read: no Arm V |
| 4 | Recruit and consent, 5 working days; never before step 3's counsel read is on record. Arm rule (PROPOSED for the founder and counsel): a parent who consents on or after the day both voice reads are on record is assigned by alternation starting with V; every parent who consents before that day is assigned W; no later parent is moved to W because of an earlier gap. Arm V may therefore end with fewer than 4 parents (outcome rule 2b) | `user-research`, founder | Arm V exists only if both voice reads are on record by the last day of this window |
| 4b | One extension of 3 working days if fewer than 8 consented (stop rule 5); no further extension. The send cap in step 5 does not move | founder | Once only |
| 5 | Send window: 5 working days from the first working day after step 4 closes. The last day is the cap | Parents | Cap |
| 6 | Day 3 after each send: Script A. Day 7: Script B and Script C. Days count from the parent's own send date in Pacific time, wherever the recipient lives | `user-research`, parent | Last day 7 is at most 7 days after the cap |
| 7 | Read-out: counts and an outcome from the section 8 table. Never sooner than 7 days after the last send | `product` | After the last day 7 |
| 8 | Thank-you note; offer to delete any answers | `user-research` | Within 3 working days after the read-out |
| 9 | Raw notes and contact details deleted | `user-research` | 30 days after the read-out |
| 10 | Consent records deleted (ruling D4) | founder | 12 months after the read-out |

Before step 4: `qa` checks that one fixture `.m4a` recording (AAC, the Asha fixture, never a real recording, ruling D13) plays in WhatsApp on Android, in Gmail on the web and in Apple Mail, and files a yes or no per client in the pilot plan. A client that cannot play it is named in Instruction V.

## 6. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| A one-letter PDF cannot be cut | Screenshot of the one letter page. If neither works for a parent, that parent does not take part; the team records which form each parent used |
| The parent sends to the wrong person | Our app cannot know or undo it. SC-5 and stop rule 1 handle a report |
| The recording does not arrive (SMS or MMS limit) | Script B Q2 codes it "file did not arrive"; the parent may resend by email; counted in the read-out as a transport failure, not as recipient disinterest |
| The recipient cannot play `.m4a` | Coded "could not play"; Script C answer is No for SC-2 |
| The parent sends a letter, recording, picture or child name to the team by mistake | Deleted unread beyond identification on every device the founder holds; logged by code; stop rule 3 if it cannot be deleted |
| The recipient forwards it on | Script B Q6; stop rule 1 if against the parent's wish |
| A parent withdraws | Notes and contact details deleted within 2 working days; the consent record is kept for its 12-month clock as proof of consent and withdrawal (D4; counsel must confirm under Q51) |
| A parent asks for a reward or code | No. A thank-you message only (OQ-3) |
| A parent in Arm W asks whether they may send the recording | Told that this group sends the words and picture only |
| Fewer than 8 consent | Step 4b, then stop rule 5 |
| Counsel answers late | Every step moves by the same number of days; nothing starts early |
| A recipient lives in another time zone | Days still count from the parent's send date in Pacific time |
| A letter in Hindi, Spanish or another language | Allowed if it exists; the letter's words are the parent's own; no translation by anyone on the team |
| A child's 18th or other legal threshold | n/a: recipients are adults; children are not contacted |

## 7. Scripts

Words are plain and calm. No pressure, no counts, no "you should". `content` finalises wording; counsel reads every text before use. The scripts write the product name as `{brand.name}` from `packages/brand`; counsel is given the rendered text, never a hard-coded name.

**Recruit (message; same for both arms; sent only after the counsel read is on record):**
> Hi. We are trying out a small idea and would value your help. If you are willing, you would send one of your letters to a grandparent or another relative, in your own message, and tell us a week later how it went. We would not see the letter. It takes about ten minutes in all. Would you like to hear more?

**Instruction W (Arm W, after consent):**
> Pick one letter you are happy to share. Send it to one person you choose, by the message app you already use, as the PDF of that one letter (or, if the app cannot make that, a screenshot of that one page). Say anything you like to them. Please do not send anything to us, and please send only the letter. We will check in on day 3 and day 7.

Changed 20 Nov: the earlier W text named the recording ("please do not send a recording"), which puts the idea in the parent's head. The counsel-fallback wording "please send only the letter" is now the default; counsel may restore the earlier line.

**Instruction V (Arm V only; sent only after the security and counsel voice reads are on record):**
> Pick one letter you are happy to share. Send it to one person you choose, by the message app you already use, as the PDF of that one letter (or, if the app cannot make that, a screenshot of that one page). If you want them to hear your voice, also send the recording. You will be sending a recording of your child's voice to that person; you choose whether to. If they do not use iMessage or WhatsApp, a recording longer than about two minutes may not arrive by text message; send it by email or a messaging app instead. Say anything you like to them. Please do not send anything to us. We will check in on day 3 and day 7.

**Script A, day 3 (message, 3 questions):**
1. Did you send it? Yes, or not yet.
2. Did anything get in the way? In a few words.
3. Anything you would rather we did not ask? (If yes, the question is dropped.)

**Script B, day 7, parent questions:**
1. What did the person do with it? Read it, replied, asked for another, nothing that you know of. Arm V only: also "listened". (Count each; "listened" is counted for Arm V only.) Arm W free text that asks, unprompted, to hear the voice is coded "asked to hear" (SC-6).
2. Did they manage on their own? Yes, or they needed help. What kind? Codes: "needed help", "file did not arrive", "could not play".
3. Arm V only: How did you feel about your child's voice going to them this way? (Free words; any worry is noted exactly.) Arm W: "How did you feel about sending it this way?"
4. If you could do it again, how would you want to send it? (Free words. The team does not name a product feature.)
5. Would you send another one next week? Yes, no, not sure.
6. Did it reach only the person you meant, and did that person pass it on to anyone else that you know of? Reached only them, reached someone else, not sure.

**Script C, relayed by the parent (one question to the recipient):**
> Could you read it (Arm V: read it or listen to it) without help from anyone? Yes, or what got in the way?

The parent relays the answer. The team does not contact recipients. Second-hand answers are noted as such; this keeps adults who did not agree to research out of our notes (the cost is bias, section 21).

**Close:**
> Thank you. We will delete your notes if you ask, any time. We will let you know what we decide.

## 8. Success, hold and stop (set before the pilot; not changed after it starts)

All numbers are PROPOSED by `product`; the founder may set them before the first parent's day 0. Thresholds are shares of the actual group, rounded up: with N consented, SC-1 needs ceil(0.75 x N) (8 gives 6, 9 gives 7, 10 gives 8). For S parents who sent: SC-2 ceil(0.6 x S), SC-3 ceil(0.5 x S), SC-4 ceil(0.6 x S). "Missed by n" means the threshold minus the count. The read-out states N and S first.

| Id | Line | Counted from |
|---|---|---|
| SC-1 | At least 75% (rounded up) of the parents who consented send a real letter by day 3 | Script A Q1 (no answer counts as not sent; the reason in Q2 is coded "did not get to it" or "did not want to") |
| SC-2 | At least 60% (rounded up) of the recipients whose parents sent could read (Arm V: read or listen) without help | Script C, one yes or no per recipient; a missing answer counts as No |
| SC-3 | At least 50% (rounded up) of those recipients replied or asked for another letter | Script B Q1 |
| SC-4 | At least 60% (rounded up) of the parents who sent say yes to sending another next week | Script B Q5 |
| SC-5 | 0 parents report that a letter or recording reached someone they did not intend, or was passed on against their wish | Script B Q6, plus any message received during the week |
| SC-6 | Signal, not a gate: Arm W recipients who asked, unprompted, to hear the voice, reported as x of n | Script B Q1 free text, code "asked to hear" |

**Outcomes.** Apply top to bottom; the first that fits decides:

| Order | Condition | Outcome |
|---|---|---|
| 1 | Any stop rule has fired (SC-5 missed is stop rule 1) | STOP: the pilot ends, the founder decides, and no go is drawn |
| 2 | All of SC-1 to SC-5 met, and Arm V ran with at least 4 parents | GO: draft a hosted-link requirement and send it to security and counsel. Not a build |
| 2b | All of SC-1 to SC-5 met, and Arm V did not run or had fewer than 4 parents | LIMITED GO: words and picture only (NS-05 Level 1); no hosted-voice requirement is drafted; the voice question is "not tested" |
| 3 | SC-1 missed and the main reason was coded "did not get to it", or the cause was recruiting | HOLD: run once more with one change |
| 4 | SC-1 missed for any other reason | NO-GO |
| 5 | SC-1 met and two or more of SC-2, SC-3, SC-4 missed by any amount | NO-GO |
| 6 | SC-1 met and any one of SC-2, SC-3, SC-4 missed by 3 or more | NO-GO |
| 7 | SC-1 met and exactly one of SC-2, SC-3, SC-4 missed by 1 or 2 | HOLD: run once more with one change |

A HOLD may be run once. A second HOLD is read as NO-GO. On NO-GO, hosted audio is not pursued on this evidence; NS-05 Level 1 still ships on its own merits. Arm V not run (or under 4 parents): SC-2 and SC-3 are read for words and picture only. A transport failure ("file did not arrive") is reported beside SC-2 so the read-out can tell a pipe problem from a people problem; it does not change the count.

**Stop (end the pilot for everyone, same day, tell the founder):**
1. Any report that a recording or letter reached someone the parent did not intend.
2. Any recipient or parent reports distress caused by the test.
3. The team receives a letter, recording, picture or child's name and cannot delete it.
4. A participant under 18 is found.
5. Fewer than 8 parents have consented at the end of step 4: extend once (step 4b), then stop and re-plan.

## 9. Scenario coverage

The pilot changes no app behaviour, so most rows describe the participant's situation, not a screen.

| Scenario | Behaviour |
|---|---|
| First use | n/a because participants need at least 3 kept letters; a first-time user is not recruited |
| Empty | n/a because a parent with no kept letter is not recruited |
| Many (1,000 letters, 300 pictures) | No effect: the parent picks one letter; Export's own budgets apply (06-nfr 2.5) |
| Offline | The parent's own messaging app decides; the team only asks on day 3 |
| Slow | A slow network delays the parent's send; days count from the send date |
| Failed | "File did not arrive" or "could not play" codes (section 6) |
| Interrupted (call, Siri, alarm, the baby) | The parent sends when they can; the send window is 5 working days |
| App killed mid-flow | n/a because the only app step is Export, whose kill behaviour is F15's |
| App updated mid-flow | n/a because the pilot depends on no new app behaviour |
| Low storage (under 1 GB, under 50 MB) | Export's own disk check applies (F15-REQ-010); a parent who cannot export takes the screenshot fallback |
| Low Power Mode and low battery | n/a beyond Export's own behaviour |
| Two books | The parent picks one letter from one book |
| Two parents | Each parent may take part separately with their own code; their answers are never joined |
| Expecting parent (due date only) | Allowed only with 3 kept letters; a Before You letter is a letter like any other |
| Multilingual (Devanagari, RTL, CJK) | Allowed; the PDF carries the script (F15-REQ-006); the team never translates |
| AX5 and Bold Text on SE 3 | n/a because no new screen exists |
| VoiceOver | n/a because no new screen exists; a parent using VoiceOver may take part by voice call |
| Voice Control and Switch Control | n/a because no new screen exists |
| Reduce Motion | n/a because no new screen exists |
| Dark mode and Increase Contrast | n/a because no new screen exists |
| Plan lapsed | No effect: export of kept letters is never gated (D-082) |
| Signed out | No effect: letters stay on the phone after sign-out (ruling D1) and export works |
| Second account on the same phone | n/a because the participant uses their own account's book |
| New phone | Recordings are absent on a new phone while backup is off; such a parent can take part only in Arm W |

## 10. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-03-R1 | Given the pilot file, When any parent is contacted, Then a dated counsel read of the consent and scripts is on record in it before that contact (0 contacts before) | P0 (b) | `[NS-03-R1] no contact before the counsel read` (checklist in the pilot file) |
| NS-03-R2 | Given any parent assigned to Arm V, Then both the security read and counsel's voice read are dated on or before that parent's consent date | P0 (b) | `[NS-03-R2] no Arm V without both voice reads` |
| NS-03-R3 | Given the read-out file in the repo, Then it holds counts and the outcome only: 0 quotes, 0 participant codes joined to an answer, 0 names; the no-real-family-data hash test passes on its PR | P0 (a) | `[NS-03-R3] the read-out holds counts only` |
| NS-03-R4 | Given the private pilot log, Then raw notes and contact details are deleted 30 days after the read-out, and consent records 12 months after it (D4), each with a dated deletion note | P0 (b) | `[NS-03-R4] pilot data is deleted on its clocks` (founder's dated note) |
| NS-03-R5 | Given a withdrawal, Then that parent's notes and contact details are deleted within 2 working days of the request | P0 (b) | `[NS-03-R5] a withdrawal deletes notes in 2 working days` |
| NS-03-R6 | Given the outcome table and the success lines, Then their text in the pilot file is identical (hash) on the first parent's day 0 and at the read-out | P1 | `[NS-03-R6] success lines do not move after day 0` |
| NS-03-R7 | Given any participant, Then 0 offer codes, payments or gifts are given before the read-out; any code given after it carries the endorsement disclosure line | P0 (b) | `[NS-03-R7] no code or reward before the read-out` |
| NS-03-R8 | Given any agent session, Then it never reads the private pilot log; only the read-out counts reach the repo | P0 (a) | `[NS-03-R8] agents never read the pilot log` (process check) |
| NS-03-R9 | Given the `.m4a` fixture check, Then a yes or no is filed for WhatsApp on Android, Gmail on the web and Apple Mail before recruiting starts | P1 | `[NS-03-R9] recipient playback checked before recruiting` |

These are process checks, not code tests. `scripts/trace.mjs` does not see NS ids yet (finding F1, PR #819); no row here claims to be traced until it does.

## 11. Non-functional budgets

| Line | Budget |
|---|---|
| Latency | n/a because no app change |
| Memory | n/a because no app change |
| On-device storage | n/a; the export the parent makes uses Export's own budgets |
| Battery | n/a because no app change |
| Offline | n/a; the parent's own messaging app decides |
| Accessibility | Every script works by voice call as well as message, so a parent who cannot read a message takes part by phone |
| Localisation | Scripts are English; a parent who prefers another language is spoken to by the founder in it, and the notes are written in English |
| Privacy (log canary) | n/a because no app log is touched; the pilot log never enters the repo or an agent session |

## 12. State space

n/a because the pilot touches no sync, account or notification. Sign-out, account deletion, kill switch and plan lapse change nothing for a parent who already exported one letter (section 9 rows).

## 13. Data and engineering

No fields, migrations, sync groups, export changes, modules, flags, remote pause keys or error codes. Owner of the plan kit: an interactive session as `user-research` (CTO pass). Size: about 10 parents x 30 minutes plus setup and the read-out, about 8 founder hours [E]. No spend.

## 14. Data inventory (outside the product)

All in the founder's private store, never in the repo, a Claude session or a Project doc. Counsel: Q44 (texts for tester families), Q51 (retention); counsel must confirm.

| Data | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| Code-to-person key | L3 | founder's private store | No | Deleted with the raw notes | Founder, dated note | n/a | Never in any log, repo or session |
| Consent record (code, arm, yes or no, text-version hash, date, method) | L2 and L3 | same | No | 12 months after the read-out (D4) | Founder, dated note | n/a | same |
| Raw notes | L4 (may mention a child) | same | No | 30 days after the read-out, or 2 working days after a withdrawal | Founder, dated note | n/a | same |
| Contact details (the thread the founder already holds) | L3 | the founder's own messages; no copy elsewhere | No | 30 days after the read-out; the founder's ordinary contacts are his own | Founder | n/a | same |
| Counts | L2 | read-out in `docs/research/studies/` | n/a | Kept | n/a | n/a | n/a |

## 15. Door lines (consent)

The pilot is research, not an app act, so there is no PRIV-R21 server row. Section 10 of `COORDINATION.md` still asks for Shown, Records, Never and Decline.

**Shown (the words the parent sees; `content` finalises, counsel reads).** Two versions, each with its own hash: version W omits the recording paragraph; version V includes it.

> We are testing one idea: a parent sends one letter from {brand.name} to a relative, using your own messages, and we ask how it went.
> You choose the letter and the person. We do not see the letter, the recording, the picture or your child's name. We only ask you a few questions, one week apart, and write short notes.
> (Version V only.) If you are in the group that sends a recording: you will send a recording of your child's voice to a relative, through your own messages. You choose whether to send it and to whom. We never receive it.
> You can stop at any time. If you stop, we delete your notes. Your book and your letters are not affected either way.
> Do you agree? Yes, or No thanks.

Changed 20 Nov: "we delete your notes if you ask" became "we delete your notes", because a withdrawal now deletes notes without a second request (NS-03-R5).

**Records:** participant code, arm, the word Yes or No, the consent text version (a hash of the words above), the date, and the method (message or call). Kept in the founder's private pilot store, never in the app, the repo, a Claude session or a Project doc. Retention: 12 months after the read-out as proof of consent, then deleted (ruling D4; counsel must confirm under Q51).

**Never:** a letter, recording, picture, child's name, recipient's name or contact, a screenshot, a location, a device identifier, or anything said by a child; payment or reward conditions on the answers; asking the parent to forward anything to us.

**Decline and withdraw:** No thanks ends the pilot for that person with no follow-up. Withdrawal at any time by message; notes deleted within 2 working days. Declining has no effect on the app, the book or the allowance. Export and deletion in the app work as before (PRIV-R09).

## 16. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| Pilot log (L4) | It lands in the repo or an agent session | Agents never read it; only counts are published | No-real-family-data hash test on the read-out PR (NS-03-R3) |
| Short answers | Re-identification inside a small known group of friends | Counts only in the repo (NS-03-R3) | Review of the read-out PR |
| A child's recording | Reaches an unintended person | Parent picks one person; Arm V only after both reads; stop rule 1 | SC-5 |
| Real data sent to the team by mistake | Kept on the founder's devices | Deleted on every device; Messages in iCloud carries the deletion; stop rule 3 | Logged by code |

## 17. Never (rulings D2 and D3)

n/a because the pilot stores no parent's words in the app and adds no field. The team writes no caption, summary or script for the letter or for what the parent says to the recipient.

## 18. Design inputs

n/a because there is no screen. The only artefacts are message texts (section 7).

## 19. Content inputs

The section 7 and 15 texts are intent; `content` finalises, counsel reads, the founder approves. Banned: gift, reward, "you should", any count, any loss or legacy-death wording (VOICE.md), any line that implies the app wrote the letter.

## 20. Legal, privacy and compliance

Counsel packet 1.5.0; counsel must confirm each:
- New question (number assigned by `legal` through `next-id`): concierge research with tester families.
- Q44: texts for tester families.
- Q45: Arm V, where we instruct parents to send a child's voice.
- Q22: a recipient in another country.
- Q51: retention of notes and consent records (D4 default 12 months).
- The FTC position in the exec record rests on a parent as the user and adult answers (FTC COPPA FAQ A.8, F.4, F.6 as quoted there; UNVERIFIED).
- Endorsement: participants get no code or reward, so a participant's post about the app carries no material connection. A later offer code to a participant is given only after the read-out and with the disclosure line (FTC endorsement guides as summarised in the CMO skill; UNVERIFIED).

**Label effect.** None. The pilot changes no app behaviour and sends nothing to our servers. A hosted copy, if a GO ever leads to one, would move Audio Data to collected and linked (exec Q1, Apple page read by the council 10 Nov 2026; UNVERIFIED).

## 21. Claims

Enables: nothing public. Forbids: any public line that a family can listen through the app, "share your voice", "family can hear", or any quote from a participant.

Risks the read-out names: positive bias from a friendly group (lines set before day 0; SC-5 and stops surface harm); second-hand recipient answers (SC-2 not decisive alone); a one-letter PDF may not cut (fallback); transport failures (coded separately).

## 22. Free or Plus

Nothing is sold or gated. The result informs one decision only: whether family listening, if built, belongs inside the existing Keep gate as Plus value (exec E3 and X3: one gate, no second tier). A GO never implies a second tier; family listening, if built, is described as part of what keeping a letter in Plus brings. Ruled 20 Nov (T2): anything that ships free in the 1.0.x line stays free; public copy says nothing either way. No price question, no price shown.

## 23. Measures with analytics off

Source: the scripts in section 7, answered by message or call. Reporting rule: every number in the read-out is "x of n"; never a percentage when n is under 20. Fixed question wording as in section 7, versioned by hash in the pilot plan in `docs/research/studies/` (aggregate only). Hand-sent numbers follow ruling D5: numbers only, in the founder's private sheet, deleted 90 days after the round; only the counts in the read-out reach the repo.

## 24. Dependencies and gates

- Founder: OQ-1 (the principle), OQ-3 (thank-you), the success lines.
- Counsel: consent and scripts (all arms); voice lines (Arm V).
- `security-architect`: sections 3, 4 and 15 (Arm V).
- `mobile`: whether a one-letter PDF can be cut (before recruiting).
- `qa`: the `.m4a` playback check (NS-03-R9).
- Output: a GO opens a requirement for NS-05 Level 3 and briefs security and counsel; it does not start a build. A LIMITED GO or NO-GO leaves NS-05 Level 1 unchanged.

## 25. Open questions

| Id | Question | Owner | Default if unanswered |
|---|---|---|---|
| OQ-1 | Does the founder accept the principle (hosted copy only after the pilot, security and counsel reads) and the success lines? | Founder | Yes, as written. If unanswered by end of the day it is due (Pacific), the default applies and is recorded in the exec rulings file; a later answer reverses it, and every step in section 5 moves by the same number of days CLOSED 20 Nov, see GAP-LOG Closures CL-008 |
| OQ-2 | Are the reads done before recruiting? | `security-architect`, counsel | The pilot does not start until the consent and scripts are read; Arm W only until the voice reads are done CLOSED 20 Nov, see GAP-LOG Closures CL-008 |
| OQ-3 | Any thank-you for participants? | Founder | A thank-you message only. No money, no gift, no code before the read-out CLOSED 20 Nov, see GAP-LOG Closures CL-008 |
| OQ-4 | Retention of raw notes | Founder | 30 days after the read-out (consent records: 12 months, ruling D4) CLOSED 20 Nov, see GAP-LOG Closures CL-008 |

Not fully testable: SC-2 depends on a relayed answer; the success numbers and stop rules are proposals; the HYPOTHESIS that this group predicts the wider market is untested.
