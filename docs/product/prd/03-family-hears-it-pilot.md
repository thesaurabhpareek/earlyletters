# NS-03: The family-hears-it pilot (concierge test, 8 to 10 parents, no build)

Status: Draft v1, 11 Nov 2026 (UTC). Docs only. Author: `product`. Rank 3 of 7 (closed X1, X2). Index: `README.md`.
Nothing in this PRD is built. The pilot runs on the parents' own phones and messages. No code, no server, no account, no upload to our systems.

Tags: EVIDENCE = repo file or page read this session. HYPOTHESIS = about parents or grandparents. UNVERIFIED = not read or not run. The law and Apple facts below are quoted from the exec council record of 10 Nov 2026 (`exec-rulings-2026-11-10-expansion.md`), which says it read the FTC COPPA FAQ and Apple's App Privacy and App Review pages that day. I did not re-open them: UNVERIFIED by me, and counsel confirms.

## 0. Gate: a copy of a child's voice leaving the phone

Any copy of a child's voice leaving the phone needs a `security-architect` read and a counsel read first (closed X2; exec Q1). That holds for this pilot, for share-one-letter with sound (NS-05 Level 2) and for any hosted link (NS-05 Level 3).

Counsel read before ANY arm (Karma, red team 11 Nov): counsel reads the consent text (section 6) and the recruit and instruction scripts (section 7) before any parent is contacted, in either arm. No parent is recruited, consented or sent an instruction until that read is on record in the pilot file. The rest of this section is about the voice.

How this pilot respects it:

- Arm W (words and picture): the parent sends the PDF of one letter. No recording. Carries no voice. Starts on the dates in section 5 once the counsel read of the consent and scripts is on record (the security read is not needed for Arm W, because the file is the Export output the app already makes and carries no voice). UNVERIFIED that a one-letter PDF can be cut from the current export; section 4 gives the fallback (a screenshot of the one letter page; the whole-book PDF is not allowed, see section 4).
- Arm V (words plus the recording): the parent also sends the audio file. Arm V starts only after both reads are on record in the pilot file: `security-architect` on sections 3, 4 and 6, and counsel on the voice-specific lines of sections 6 and 7. Arm V parents are told in the consent, in plain words, that they will send a recording of their child's voice to a relative (section 6). PROPOSED for the founder and counsel (not decided): a parent who consents on or after the day both voice reads are on record is assigned by alternation, starting with V; every parent who consents before that day is assigned W; no later parent is moved to W because of an earlier gap. Both voice reads must be on record by Fri 4 Dec for any parent to be assigned V (section 2); if they are not, all parents are W and the voice questions are marked "not tested".
- The reads are asked for this plan now: one page each, not a build review. Default if counsel has not answered by Fri 27 Nov 2026: the pilot does not start (no arm). If counsel has read the consent and scripts but not the voice lines: Arm W only.

## 1. Job to be done

I go to my own phone and my own messages to send one letter, with the voice if I want, to a grandparent, so that they can read it and hear it without an app, and the founder learns whether that is worth building.

(The test's job, for the team: find out whether a family member will open, listen to and ask for more of a parent's letter, before any hosted audio, link or Share screen is built.)

## 2. Who and when

- Arms and sizes: the researcher assigns each parent at the moment of consent, not the parent. PROPOSED for the founder and counsel (not decided): a parent who consents on or after the day both voice reads are on record is assigned by alternation, starting with V; every parent who consents before that day is assigned W; no later parent is moved to W because of an earlier gap. Both voice reads must be on record by Fri 4 Dec for any parent to be assigned V. Among the parents who consent on or after that day, the order of consent alternates V, W, V, W, so those arms differ by at most one parent; across the whole group they can differ by more, and Arm V may end with fewer than 4 parents (outcome rule 2b then applies; the researcher does not reassign anyone). Arm V earliest start: Mon 7 Dec 2026 (the first send day); if the reads are not on record by Fri 4 Dec there is no Arm V and the voice question is "not tested". The security read of sections 3, 4 and 6 is due Fri 27 Nov 2026, owner `security-architect`, the same day as counsel's read.
- Parents: 8 to 10 adults aged 18 or over, each with a child under 5 and at least 3 kept letters in {brand.name} (TestFlight or alpha). Recruited by the founder from his invited friends and family list. HYPOTHESIS: this group is warm toward the product, so results will lean positive; the success lines in section 8 are set with that in mind.
- Recipients: one relative per parent whom the parent picks (a grandparent, aunt, uncle or close friend), an adult. At least 2 of the 10 live in another country, if the founder's list allows (open item from PRD Q3). At least 2 parents with a non-English letter if any exist on the list; Build 12 is English only, so this may be 0 (UNVERIFIED).
- Not recruited: anyone under 18, anyone the founder pays, any app-store reviewer, any competitor staff.
- When: proposed dates, Pacific time, in the table in section 5. Order: founder confirms the principle, counsel reads the consent and scripts, only then does recruiting start, then a capped send window, then one week per parent, then the read-out after the last day 7. Thanksgiving is Thu 26 Nov, so no contact that day.

## 3. Who runs it and what is collected

| Role | Who | Mode |
|---|---|---|
| Runs conversations, keeps the log | `user-research` with the founder (a person talks to parents; an agent cannot) | human |
| Plan, scripts, read-out | `product`, `user-research` | agent |
| Reads | `security-architect`, counsel (through the founder) | human and agent |

What the team collects, in full: a participant code (P01 to P10), consent yes or no with the consent text version and date, the answers to the questions in section 7 as short notes, and the counts in section 8. Nothing else.

What the team never receives: a letter, a recording, a picture, a child's name, a screenshot of a letter, the recipient's name or contact. If a parent sends one by mistake, it is deleted unread beyond what is needed to see what it is, the mistake is logged by participant code, and that parent's remaining questions continue without it.

Where the notes live: a private location the founder controls, not the repository. Follow-up contact details (the phone number or message thread used for the day 3 and day 7 check-ins) are the ones the founder already holds for each person. They are kept in that private location only, used only for the check-ins, never copied into the repository or a shared document, and deleted at the same time as the raw notes (30 days after the read-out, or within 2 working days of a withdrawal). The repo is public (D-122): no participant notes, names or quotes that identify a person go into it. The read-out file may hold the counts and anonymised, short answers.
Retention: raw notes are deleted 30 days after the read-out, Wed 20 Jan 2027 (PROPOSED default). Counts stay.

## 4. How a parent sends (no build)

1. The parent picks one kept letter they would be happy for the recipient to have.
2. Arm W: Export from Settings, take the page for that letter (PDF), send it by the message app the parent already uses with that person. Fallback if a one-letter file cannot be cut: a screenshot of the one letter page the parent chooses. The whole-book PDF is not a fallback, because it would send more than the one letter the consent names; if neither a one-letter file nor a screenshot works for a parent, that parent does not take part. The team records which form was used.
3. Arm V: also send the recording file for that letter (from the export's `audio` folder). Only when section 0 allows.
4. The parent tells the recipient it is a letter to {child}. The words are the parent's own; the team gives no script for that message.
5. Nothing goes through {brand.name} servers or the team's phones.

## 5. Plan in one table

Dates (Pacific time, all PROPOSED; none collides, and the read-out follows the last day 7):

| Date | What | Who |
|---|---|---|
| Fri 20 Nov 2026 | Founder confirms the principle (OQ-1) | Founder |
| Mon 23 Nov | Consent texts and scripts (sections 6 and 7) go to counsel; the security read starts | `product` |
| Fri 27 Nov | Security read due (sections 3, 4 and 6), owner `security-architect`; Arm V cannot start without it | `security-architect` |
| Fri 27 Nov | Counsel read of consent and scripts due. Default if not on record: the pilot does not start and every later date moves by the same number of weeks | counsel |
| Mon 30 Nov to Fri 4 Dec | Recruit and consent (no recruiting before the counsel read is on record) | `user-research`, founder |
| Mon 7 Dec | Earliest Arm V start. PROPOSED rule (section 2): V is assigned only to parents who consent on or after the day both voice reads are on record, and both must be on record by Fri 4 Dec; otherwise no Arm V | `user-research` |
| Mon 7 Dec to Fri 11 Dec | Send window. Last send date is Fri 11 Dec (the cap) | Parents |
| Wed 9 Dec | One extension of recruit and consent if fewer than 8 consented by Fri 4 Dec (stop rule 5); no further extension. A parent who consents that day has only Thu and Fri to send | founder |
| Day 3 after each send | Check-in message, script A. Latest: Mon 14 Dec | `user-research` |
| Day 7 after each send | Script B to the parent and script C relayed. Latest: Fri 18 Dec | `user-research`, parent |
| Mon 21 Dec | Read-out: counts, 5 short answers, an outcome from the section 8 table. The read-out never comes before the last day 7 | `product` |
| Mon 21 to Wed 23 Dec | Thank-you note; offer to delete any answers | `user-research` |
| Wed 20 Jan 2027 | Raw notes and contact details deleted (30 days after the read-out) | `user-research` |

Each parent's own week: day 0 is the day they send; the table's cap guarantees day 7 is no later than Fri 18 Dec.

## 6. Consent (the door lines)

The pilot is research, not an app act, so there is no PRIV-R21 server row. Section 10 of `COORDINATION.md` still asks for Shown, Records, Never and Decline; they are below.

**Shown (the words the parent sees; `content` finalises, counsel reads). Two versions, each with its own hash: version W (Arm W) omits the recording paragraph; version V (Arm V) includes it. The scripts write the product name as `{brand.name}` from `packages/brand`; counsel is given the rendered text, never a hard-coded name.**

> We are testing one idea: a parent sends one letter from {brand.name} to a relative, using your own messages, and we ask how it went.
> You choose the letter and the person. We do not see the letter, the recording, the picture or your child's name. We only ask you a few questions, one week apart, and write short notes.
> (Version V only.) If you are in the group that sends a recording: you will send a recording of your child's voice to a relative, through your own messages. You choose whether to send it and to whom. We never receive it.
> You can stop at any time. If you stop, we delete your notes if you ask. Your book and your letters are not affected either way.
> Do you agree? Yes, or No thanks.

**Records:** participant code, which group (words only, or words and recording), the word Yes or No, the consent text version, the date and the way you said it (message or call). Contact details are held as the section 3 line says. Kept in the private pilot log, not in the app and not in the repository. The text version is a hash of the words above, so a later edit is visible.

**Never:** a letter, recording, picture, child's name, recipient's name or contact, a screenshot, a location, a device identifier, or anything said by a child. Also never: payment or reward conditions on the answers; asking the parent to forward anything to us.

**Decline and withdraw:** No thanks ends the pilot for that person with no follow-up. Withdrawal at any time by message; notes deleted within 2 working days of the request. Declining has no effect on the app, the book or the allowance. Export and deletion in the app work as before (PRIV-R09).

## 7. Scripts

Words are plain and calm. No pressure, no counts, no "you should".

**Recruit (message; same for both arms; sent only after the counsel read is on record):**
> Hi. We are trying out a small idea and would value your help. If you are willing, you would send one of your letters to a grandparent or another relative, in your own message, and tell us a week later how it went. We would not see the letter. It takes about ten minutes in all. Would you like to hear more?

**Instruction W (Arm W, after consent; never says a recording may be sent, only asks that none be):**
> Pick one letter you are happy to share. Send it to one person you choose, by the message app you already use, as the PDF of that one letter (or, if the app cannot make that, a screenshot of that one page). Say anything you like to them. Please do not send anything to us, and please do not send a recording. We will check in on day 3 and day 7.

**Instruction V (Arm V only; sent only after the security and counsel voice reads are on record; counsel reads both instruction texts):**
> Pick one letter you are happy to share. Send it to one person you choose, by the message app you already use, as the PDF of that one letter (or, if the app cannot make that, a screenshot of that one page). If you want them to hear your voice, also send the recording. You will be sending a recording of your child's voice to that person; you choose whether to. Say anything you like to them. Please do not send anything to us. We will check in on day 3 and day 7.

Note on Instruction W: the words "please do not send a recording" name the recording to Arm W, to keep it unsent, and that puts the idea in the parent's head. Counsel should rule on naming the recording in Arm W. Fallback wording slot, PROPOSED, used if counsel objects: "Please send only the letter." (replacing "and please do not send a recording"). Counsel reads both versions.

Arm W parents are never told they may send a recording, and a parent who asks is told that this group sends the words and picture only.

**Script A, day 3 (message, 3 questions):**
1. Did you send it? Yes or not yet.
2. Did anything get in the way? In a few words.
3. Anything you would rather we did not ask? (If yes, the question is dropped.)

**Script B, day 7, parent questions:**
1. What did the person do with it? Read it, replied, asked for another, nothing that you know of. Arm V only: also "listened". (Count each; "listened" is counted for Arm V only.)
2. Did they manage on their own? Yes, or they needed help. What kind?
3. Arm V only: How did you feel about your child's voice going to them this way? (Free words; any worry is noted exactly.) Arm W parents are not asked this question; they are asked instead, "How did you feel about sending it this way?"
4. If you could do it again, how would you want to send it? (Free words. The team does not name a product feature.)
5. Would you send another one next week? Yes, no, not sure.
6. Both arms: Did it reach only the person you meant, and did that person pass it on to anyone else that you know of? Reached only them, reached someone else, not sure. (This is the source of SC-5. "Reached someone else" or "passed on" without the parent's wish also triggers stop rule 1.)

**Script C, relayed by the parent (one question to the recipient):**
> Could you read it (Arm V: read it or listen to it) without help from anyone? Yes, or what got in the way?
The parent relays the answer. The team does not contact recipients. (Second-hand answers are noted as such. This choice keeps adults who did not agree to research out of our notes; the cost is bias, named in section 11.)

**Close:**
> Thank you. We will delete your notes if you ask, any time. We will let you know what we decide.

## 8. Success, hold and stop (set before the pilot; not changed after it starts)

All numbers are PROPOSED by `product`; the founder may set them before Day 0 of the first parent. The thresholds are shares of the actual group, rounded up, so they hold whatever the size (8 to 10 consented): with 8 consented, SC-1 needs 6; with 9, 7; with 10, 8. For S parents who sent: SC-2 needs ceil(0.6 x S), SC-3 ceil(0.5 x S), SC-4 ceil(0.6 x S). "Missed by n" means that count minus the actual count. The read-out states N and S first, so the lines cannot be argued afterwards.

**Success (rows 2 and 2b: a full GO drafts a hosted-link requirement for security and counsel; a LIMITED GO drafts none):**

| Id | Line | Counted from |
|---|---|---|
| SC-1 | At least 75% (rounded up) of the parents who consented send a real letter by day 3 | Script A Q1 (a parent who does not answer counts as not sent; the reason in Script A Q2 is coded "did not get to it" or "did not want to" by the researcher) |
| SC-2 | At least 60% (rounded up) of the recipients whose parents sent could read (Arm V: read or listen) without help | Script C, one Yes or No per recipient; a missing answer counts as No |
| SC-3 | At least 50% (rounded up) of those recipients replied or asked for another letter | Script B Q1, as the parent reports it |
| SC-4 | At least 60% (rounded up) of the parents who sent say yes to sending another next week | Script B Q5 |
| SC-5 | 0 parents report that a letter or recording reached someone they did not intend, or was passed on against their wish | Script B Q6 (both arms), plus any message received during the week |


**Outcomes.** "Missed by n" means the line's threshold minus the count. Apply these rules top to bottom; the first that fits decides:

| Order | Condition | Outcome |
|---|---|---|
| 1 | Any stop rule below has fired (SC-5 missed is stop rule 1) | STOP: the pilot ends, the founder decides, and no go is drawn |
| 2 | All of SC-1 to SC-5 met, and Arm V ran with at least 4 parents | GO: draft a hosted-link requirement and send it to security and counsel. A go needs all five lines. It is not a build |
| 2b | All of SC-1 to SC-5 met, and Arm V did not run or had fewer than 4 parents (including exactly 3 after the section 2 rule; no one is reassigned) | LIMITED GO: words and picture only (NS-05 Level 1); no hosted-voice requirement is drafted and the voice question is "not tested" |
| 3 | SC-1 missed and the researcher coded the main reason "did not get to it" or the cause was recruiting | HOLD: run once more with one change |
| 4 | SC-1 missed for any other reason | NO-GO |
| 5 | SC-1 met and two or more of SC-2, SC-3, SC-4 missed by any amount | NO-GO |
| 6 | SC-1 met and any one of SC-2, SC-3, SC-4 missed by 3 or more | NO-GO |
| 7 | SC-1 met and exactly one of SC-2, SC-3, SC-4 missed by 1 or 2 | HOLD: run once more with one change |

A HOLD may be run once. A second HOLD is read as a NO-GO. On NO-GO, hosted audio is not pursued on this evidence; NS-05 Level 1 still ships on its own merits. Arm V not run (or under 4 parents): SC-2 and SC-3 are read for words and picture only (rule 2b).

**Stop (end the pilot for everyone, same day, tell the founder):**
1. Any report that a recording or letter reached someone the parent did not intend.
2. Any recipient or parent reports distress caused by the test.
3. The team receives a letter, recording, picture or child's name and cannot delete it.
4. A participant under 18 is found.
5. Fewer than 8 parents have consented by Fri 4 Dec: extend once to Wed 9 Dec (the send cap stays Fri 11 Dec so the read-out date holds), then stop and re-plan.

Label effect: none. The pilot changes no app behaviour and sends nothing to our servers.

## 9. Free vs Plus

Nothing is sold or gated in the pilot (and nothing here is promised as forever). The result informs one decision only: whether family listening, if built, belongs inside the existing Keep gate as Plus value (exec E3 and X3: one gate, no second tier; the held price is in the record, D-082, and is not repeated here). The pilot asks no price question and shows no price. Allowance 2 with the planned raise 2, 5, 10 and "what a family kept stays theirs to read, hear and export" are not discussed with participants.

## 10. Privacy and constitution check

- The words are the parent's: the team does not write a caption, summary or script for the letter or for what the parent says to the recipient.
- No seen-by receipts, counts of opens or reaction tallies are built or implied. Counts are the team's hand counts from answers (SC lines), never from the app.
- Child data: the team receives none. The FTC position in the exec record rests on a parent as the user and adult answers (FTC COPPA FAQ A.8, F.4, F.6 as quoted there; counsel confirms; UNVERIFIED by me).
- Apple 1.2 and the privacy label are not touched: no app change. Label effect: none. A hosted copy would flip Audio Data to collected and linked (exec Q1, Apple page read 10 Nov 2026 by the council; UNVERIFIED by me).
- No loss or legacy-death wording in any script (VOICE.md legacy rule).

## 11. Risks

| Risk | Mitigation |
|---|---|
| Positive bias from a friendly group | Success lines are set before Day 0; SC-5 and the stop list are worded to surface harm, not delight. |
| Second-hand recipient answers | Noted as such; the decision does not rest on SC-2 alone (SC-3 and SC-4 carry weight). |
| Parent sends to the wrong person | Parent picks one recipient and sends from their own thread; SC-5 and stop rule 1 handle a report. |
| A one-letter PDF cannot be cut | Fallback in section 4; the pilot records which was used. |
| Counsel not answered in time | No arm starts without the consent and scripts read; every date moves by the same number of weeks; Arm W only without the voice read (section 0). |
| Thanksgiving and December load | Dates in section 5 avoid 26 Nov; parents may start late. |

## 12. Open questions (every one has a default)

| Id | Question | Owner | Default if no answer | By |
|---|---|---|---|---|
| OQ-1 | Does the founder accept the Q1 principle (hosted copy only after pilot, security and counsel reads)? | Founder | Yes, as written in the exec record (default stands). | Fri 20 Nov 2026 |
| OQ-2 | Are the reads in section 0 done before recruiting? | `security-architect`, counsel | The pilot does not start until the consent and scripts are read; Arm W only until the voice read is done. | Fri 27 Nov 2026 |
| OQ-3 | Any thank-you for participants? | Founder | A thank-you message only. No money, no gift (BRAND bans "gift" at v1.0; no spend). | Mon 23 Nov |
| OQ-4 | Retention of raw notes | Founder | 30 days after the read-out. | Mon 23 Nov |

## 13. Rollout

- No flag and no build number. No change to the app.
- A dated pilot file is opened by `user-research` at `docs/research/studies/` (aggregate counts only) after the founder confirms OQ-1.
- Output: a read-out of 1 page with the go, hold or no-go. A go opens a requirement for NS-05 Level 3 and briefs to security and counsel; it does not start a build.

## 14. Not fully testable

- SC-2 depends on a relayed answer. It is a hand count, not an observation.
- The success numbers are proposals; the stop rules and dates are proposals; the HYPOTHESIS that this group predicts the wider market is untested.
- UNVERIFIED, each with a PROPOSED owner and date: whether a one-letter PDF can be cut from the current export (`mobile`, by Mon 23 Nov 2026); the reads' outcomes (`security-architect` and counsel, Fri 27 Nov 2026, OQ-2); the number of non-English letters available (`user-research`, at recruit, Mon 30 Nov 2026).
