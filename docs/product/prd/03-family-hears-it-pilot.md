# NS-03: The family-hears-it pilot (concierge test, 8 to 10 parents, no build)

Status: Draft v1, 11 Nov 2026 (UTC). Docs only. Author: `product`. Rank 3 of 7 (closed X1, X2). Index: `README.md`.
Nothing in this PRD is built. The pilot runs on the parents' own phones and messages. No code, no server, no account, no upload to our systems.

Tags: EVIDENCE = repo file or page read this session. HYPOTHESIS = about parents or grandparents. UNVERIFIED = not read or not run. The law and Apple facts below are quoted from the exec council record of 10 Nov 2026 (`exec-rulings-2026-11-10-expansion.md`), which says it read the FTC COPPA FAQ and Apple's App Privacy and App Review pages that day. I did not re-open them: UNVERIFIED by me, and counsel confirms.

## 0. Gate: a copy of a child's voice leaving the phone

Any copy of a child's voice leaving the phone needs a `security-architect` read and a counsel read first (closed X2; exec Q1). That holds for this pilot, for share-one-letter with sound (NS-05 Level 2) and for any hosted link (NS-05 Level 3).

Counsel read before ANY arm (Karma, red team 11 Nov): counsel reads the consent text (section 6) and the recruit and instruction scripts (section 7) before any parent is contacted, in either arm. No parent is recruited, consented or sent an instruction until that read is on record in the pilot file. The rest of this section is about the voice.

How this pilot respects it:

- Arm W (words and picture): the parent sends the PDF of one letter. No recording. Carries no voice. Starts on the dates in section 5 once the counsel read of the consent and scripts is on record (the security read is not needed for Arm W, because the file is the Export output the app already makes and carries no voice). UNVERIFIED that a one-letter PDF can be cut from the current export; section 4 gives the fallback (send the whole-book PDF, or a screenshot).
- Arm V (words plus the recording): the parent also sends the audio file. Arm V starts only after both reads are on record in the pilot file: `security-architect` on sections 3, 4 and 6, and counsel on the voice-specific lines of sections 6 and 7. Arm V parents are told in the consent, in plain words, that they will send a recording of their child's voice to a relative (section 6). If either read is missing on the start date, every parent runs Arm W and the voice questions are marked "not tested".
- The reads are asked for this plan now: one page each, not a build review. Default if counsel has not answered by Fri 27 Nov 2026: the pilot does not start (no arm). If counsel has read the consent and scripts but not the voice lines: Arm W only.

## 1. Job to be done

I go to my own phone and my own messages to send one letter, with the voice if I want, to a grandparent, so that they can read it and hear it without an app, and the founder learns whether that is worth building.

(The test's job, for the team: find out whether a family member will open, listen to and ask for more of a parent's letter, before any hosted audio, link or Share screen is built.)

## 2. Who and when

- Parents: 8 to 10 adults aged 18 or over, each with a child under 5 and at least 3 kept letters in Early Letters (TestFlight or alpha). Recruited by the founder from his invited friends and family list. HYPOTHESIS: this group is warm toward the product, so results will lean positive; the success lines in section 8 are set with that in mind.
- Recipients: one relative per parent whom the parent picks (a grandparent, aunt, uncle or close friend), an adult. At least 2 of the 10 live in another country, if the founder's list allows (open item from PRD Q3). At least 2 parents with a non-English letter if any exist on the list; Build 12 is English only, so this may be 0 (UNVERIFIED).
- Not recruited: anyone under 18, anyone the founder pays, any app-store reviewer, any competitor staff.
- When: proposed dates, Pacific time. Founder confirms the Q1 principle by Fri 20 Nov. Consent and instructions final Mon 23 Nov. Recruit Mon 23 to Fri 4 Dec. Send window Mon 30 Nov to Sun 6 Dec; one week per parent from the day they send. Read-out Fri 11 Dec. Thanksgiving is Thu 26 Nov, so no contact that day. Parents who start later run their own week and the read-out waits for the last.

## 3. Who runs it and what is collected

| Role | Who | Mode |
|---|---|---|
| Runs conversations, keeps the log | `user-research` with the founder (a person talks to parents; an agent cannot) | human |
| Plan, scripts, read-out | `product`, `user-research` | agent |
| Reads | `security-architect`, counsel (through the founder) | human and agent |

What the team collects, in full: a participant code (P01 to P10), consent yes or no with the consent text version and date, the answers to the questions in section 7 as short notes, and the counts in section 8. Nothing else.

What the team never receives: a letter, a recording, a picture, a child's name, a screenshot of a letter, the recipient's name or contact. If a parent sends one by mistake, it is deleted unread beyond what is needed to see what it is, the mistake is logged by participant code, and that parent's remaining questions continue without it.

Where the notes live: a private location the founder controls, not the repository. Follow-up contact details (the phone number or message thread used for the day 3 and day 7 check-ins) are the ones the founder already holds for each person. They are kept in that private location only, used only for the check-ins, never copied into the repository or a shared document, and deleted at the same time as the raw notes (30 days after the read-out, or within 2 working days of a withdrawal). The repo is public (D-122): no participant notes, names or quotes that identify a person go into it. The read-out file may hold the counts and anonymised, short answers.
Retention: raw notes are deleted 30 days after the read-out (PROPOSED default). Counts stay.

## 4. How a parent sends (no build)

1. The parent picks one kept letter they would be happy for the recipient to have.
2. Arm W: Export from Settings, take the page for that letter (PDF), send it by the message app the parent already uses with that person. Fallback if a one-letter file cannot be cut: the parent sends the whole-book PDF, or a screenshot of the letter page they choose. The team does not decide this; it records which was used.
3. Arm V: also send the recording file for that letter (from the export's `audio` folder). Only when section 0 allows.
4. The parent tells the recipient it is a letter to {child}. The words are the parent's own; the team gives no script for that message.
5. Nothing goes through Early Letters servers or the team's phones.

## 5. Plan in one table

| Day | What | Who |
|---|---|---|
| Before | Reads on this plan (section 0); consent and instructions final | `product`, `security-architect`, counsel |
| Day 0 | Parent consents (section 6), receives the instruction (section 7), sends the letter | Parent |
| Day 3 | Check-in message, 3 questions (script A) | `user-research` |
| Day 7 | Call or message, parent questions (script B) and the one recipient question relayed by the parent (script C) | `user-research`, parent |
| Day 8 to 10 | Thank-you note; offer to delete any answers | `user-research` |
| Read-out | Counts, 5 short answers, a go, hold or no-go (section 8) | `product` |

## 6. Consent (the door lines)

The pilot is research, not an app act, so there is no PRIV-R21 server row. Section 10 of `COORDINATION.md` still asks for Shown, Records, Never and Decline; they are below.

**Shown (the words the parent sees; `content` finalises, counsel reads):**

> We are testing one idea: a parent sends one letter from Early Letters to a relative, using your own messages, and we ask how it went.
> You choose the letter and the person. We do not see the letter, the recording, the picture or your child's name. We only ask you a few questions, one week apart, and write short notes.
> If you are in the group that sends a recording: you will send a recording of your child's voice to a relative, through your own messages. You choose whether to send it and to whom. We never receive it.
> You can stop at any time. If you stop, we delete your notes if you ask. Your book and your letters are not affected either way.
> Do you agree? Yes, or No thanks.

**Records:** participant code, which group (words only, or words and recording), the word Yes or No, the consent text version, the date and the way you said it (message or call). Contact details are held as the section 3 line says. Kept in the private pilot log, not in the app and not in the repository. The text version is a hash of the words above, so a later edit is visible.

**Never:** a letter, recording, picture, child's name, recipient's name or contact, a screenshot, a location, a device identifier, or anything said by a child. Also never: payment or reward conditions on the answers; asking the parent to forward anything to us.

**Decline and withdraw:** No thanks ends the pilot for that person with no follow-up. Withdrawal at any time by message; notes deleted within 2 working days of the request. Declining has no effect on the app, the book or the allowance. Export and deletion in the app work as before (PRIV-R09).

## 7. Scripts

Words are plain and calm. No pressure, no counts, no "you should".

**Recruit (message):**
> Hi. We are trying out a small idea and would value your help. If you are willing, you would send one of your letters to a grandparent or another relative, in your own message, and tell us a week later how it went. We would not see the letter. It takes about ten minutes in all. Would you like to hear more?

**Instruction (after consent):**
> Pick one letter you are happy to share. Send it to one person you choose, by the message app you already use, as a PDF. If you want them to hear your voice, also send the recording. Say anything you like to them. Please do not send anything to us. We will check in on day 3 and day 7.

**Script A, day 3 (message, 3 questions):**
1. Did you send it? Yes or not yet.
2. Did anything get in the way? In a few words.
3. Anything you would rather we did not ask? (If yes, the question is dropped.)

**Script B, day 7, parent questions:**
1. What did the person do with it? Read it, listened, replied, asked for another, nothing that you know of. (Count each.)
2. Did they manage on their own? Yes, or they needed help. What kind?
3. Arm V only: How did you feel about your child's voice going to them this way? (Free words; any worry is noted exactly.) Arm W parents are not asked this question; they are asked instead, "How did you feel about sending it this way?"
4. If you could do it again, how would you want to send it? (Free words. The team does not name a product feature.)
5. Would you send another one next week? Yes, no, not sure.

**Script C, relayed by the parent (one question to the recipient):**
> Could you read or listen to it without help from anyone? Yes, or what got in the way?
The parent relays the answer. The team does not contact recipients. (Second-hand answers are noted as such. This choice keeps adults who did not agree to research out of our notes; the cost is bias, named in section 11.)

**Close:**
> Thank you. We will delete your notes if you ask, any time. We will let you know what we decide.

## 8. Success, hold and stop (set before the pilot; not changed after it starts)

All numbers are PROPOSED by `product`; the founder may set them before Day 0 of the first parent.

**Success (go to draft a hosted-link requirement and send it to security and counsel):**

| Id | Line | Counted from |
|---|---|---|
| SC-1 | At least 6 of the parents send a real letter by day 3 | Script A, Q1 |
| SC-2 | At least 5 of the recipients could read or listen without help | Script C |
| SC-3 | At least 4 recipients replied or asked for another letter | Script B, Q1 |
| SC-4 | At least 5 parents say yes to sending another next week | Script B, Q5 |
| SC-5 | 0 parents report that a letter or recording reached someone they did not intend | Script B, Q3 and any message |

SC-1 to SC-5 on Arm V only count if Arm V ran. If it did not, the voice-specific half of SC-2 and SC-3 reads "not tested", and the go is limited to words and picture (NS-05 Level 1).

**Hold (run once more with one change, or park):** SC-1 met and any of SC-2 to SC-4 missed by 1 or 2.

**No-go (do not pursue hosted audio on this evidence):** SC-1 missed, or SC-2 and SC-3 both missed by more than 2. NS-05 Level 1 still ships on its own merits.

**Stop (end the pilot for everyone, same day, tell the founder):**
1. Any report that a recording or letter reached someone the parent did not intend.
2. Any recipient or parent reports distress caused by the test.
3. The team receives a letter, recording, picture or child's name and cannot delete it.
4. A participant under 18 is found.
5. Fewer than 8 parents have consented by Fri 4 Dec (extend once to Fri 11 Dec, then stop).

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
| Counsel not answered in time | No arm starts without the consent and scripts read; Arm W only without the voice read (section 0). |
| Thanksgiving and December load | Dates in section 2 avoid 26 Nov; parents may start late. |

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
- UNVERIFIED: the one-letter PDF, the reads' outcomes, the number of non-English letters available.
