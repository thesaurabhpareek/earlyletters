# Session script: the family-hears-it pilot (NS-03)

Status: DRAFT, 24 Nov 2026, `user-research` (Claude role). Not for use until the gates in `README.md` are on record. Counsel reads every text a parent will see (the instructions below, the recruiting note and the consent texts) before the first contact.

Source: NS-03 sections 4 to 8 (`docs/product/prd/03-family-hears-it-pilot.md`). The question wording in Scripts A, B and C is the card's, kept as written so the answers can be counted against section 8. The instructions and the close are rendered for a parent to read, in the voice of `packages/content/WRITING-GUIDE.md`. Every change from the card's text is listed in the PR body under "Open for the exec team".

## 0. Who does what

- The founder talks to parents, by message or by voice call. An agent never contacts a parent.
- `user-research` keeps the blank sheet (`04-answer-sheet.md`) and the read-out plan. Once a parent is contacted, only the founder holds the filled sheet. Agents never read it (NS-03-R8).
- Nobody on the team contacts a recipient, ever.

## 1. Rules for every contact

Say these to yourself before each message or call.

1. You're testing the idea, not the parent. There are no wrong answers. Any question can be skipped, and a skip isn't followed up.
2. Never ask to see the letter, the recording, the picture or the screenshot. Never ask the child's name or the recipient's name. If either comes up in a call, don't write it down.
3. Never name a feature that doesn't exist. No "share button", no "link", no "family listening". Never hint that something is coming.
4. No price, no Plus, no offer, no gift, no code before the read-out (NS-03-R7). A thank-you message only.
5. No "you should", no counts, no pressure. If a parent hasn't sent by day 3, that's an answer, not a problem to fix.
6. Days count from the parent's own send date in Pacific time, wherever the recipient lives. No contact on a US federal public holiday.
7. A parent who'd rather talk than read gets the same words by voice call. Don't record the call. Type the answers into the sheet straight after, under the same note rules (section 9).
8. A parent who prefers another language may be spoken to in it by the founder. The notes are written in English. Nobody on the team translates a letter.

## 2. Recruit

Send the recruiting note (`03-recruiting-note.md`) only after counsel's read is on record. A parent who wants to hear more gets the eligibility check in that file, then the consent text for their arm.

## 3. Consent and the arm

1. Decide the arm before sending consent, by the card's rule (NS-03 section 5, step 4, PROPOSED for the founder and counsel):
   - Before the day both voice reads are on record: every parent is Arm W.
   - On or after that day: alternate, starting with V. No later parent is moved to W because of an earlier gap.
2. Send the consent text for that arm (`02-consent-texts-DRAFT-FOR-COUNSEL.md`), exactly as counsel read it. Don't add a line or explain it in other words. If the parent asks a question the text doesn't answer, answer it plainly and note the question by code, so the text can be fixed for the next round.
3. Record in the consent file: code, arm, Yes or No, the hash of the text sent, the date, and message or call. Nothing else.
4. "No thanks", or no reply after one gentle follow-up: send the decline reply in `02-consent-texts-DRAFT-FOR-COUNSEL.md` and stop. No second follow-up.

## 4. The instruction (send right after a Yes)

Proposed wording. Both versions lead with the screenshot, because the app's export makes one PDF for the whole book, not one per letter, and the whole-book PDF is never sent (NS-03 section 0). If `mobile` confirms a one-letter PDF can be made, add it back as the first choice.

**Instruction W (Arm W):**

> Thanks for saying yes. Here's all there is to it.
> Pick one letter in {brand.name} you're happy to share. Take a screenshot of it (more than one if it's long) and send it to one person you choose, in the message app you already use with them.
> Say anything you like to them.
> Please don't send anything to us, and send only the letter.
> We'll check in on day 3 and day 7.

**Instruction V (Arm V only, and only after both voice reads are on record):**

> Thanks for saying yes. Here's all there is to it.
> Pick one letter in {brand.name} you're happy to share. Take a screenshot of it (more than one if it's long) and send it to one person you choose, in the message app you already use with them.
> If you'd like them to hear it too, send the recording of that letter as well. The recording is your voice, and it may also have your child's voice or sounds in it. It's your choice whether to send it.
> If they don't use iMessage or WhatsApp, a recording longer than about 2 minutes may not arrive by text message. Email or a messaging app works better.
> Say anything you like to them.
> Please don't send anything to us.
> We'll check in on day 3 and day 7.

If `qa`'s playback check (NS-03-R9) found a client that can't play the file, add one line naming it before "Say anything you like to them", for example: "Gmail on the web may not play it."

**If an Arm V parent asks how to find the recording.** Read from the export code, not tried on a device (UNVERIFIED; `qa` dry-runs these steps with the Asha fixture before recruiting):

> 1. In {brand.name}, open Settings, then Export your book, then Save or share. Save it to Files.
> 2. In Files, tap the file you saved. It opens into a folder.
> 3. In the letters folder, open the letter you picked. The line that starts "Recording" gives the recording's file name.
> 4. Open the audio folder, tap that file, then tap Share and send it.

A letter whose Recording line says "Not on this phone" has no recording to send. The parent picks another letter, or sends the screenshot only.

**If an Arm W parent asks whether they can send the recording:** "This group sends the letter only. Thanks for asking."

## 5. Day 3: Script A

By message, or the same words on a call.

> Hi, it's day 3. Three quick questions, and you can skip any of them.
> 1. Did you send it? Yes, or not yet.
> 2. Did anything get in the way? A few words is plenty.
> 3. Is there anything you'd rather we didn't ask? If so, we'll drop that question.

Code Q1 as Sent or Not yet. No answer by the end of day 3 is coded Not yet. For Not yet, code Q2 as "did not get to it" or "did not want to", from the parent's own words; if it's unclear, code "did not get to it" and mark it unclear.

## 6. Day 7: Script B to the parent

> Hi, it's day 7, the last check-in. Six short questions. Skip anything you like.
> 1. What did they do with it? Read it, replied, asked for another, or nothing that you know of. [Arm V adds: listened.]
> 2. Did they manage on their own, or did they need help? If they needed help, what kind?
> 3. [Arm V] How did you feel about the recording going to them this way? [Arm W] How did you feel about sending it this way?
> 4. If you did it again, how would you want to send it?
> 5. Would you send another one next week? Yes, no, or not sure.
> 6. Did it reach only the person you meant? And did they pass it on to anyone else, that you know of?

Coding is in `04-answer-sheet.md`. For Q3 and Q4, write the parent's own words about how it went, with every name taken out. Don't suggest an answer to Q4 and don't name a feature.

## 7. Day 7: Script C, relayed by the parent

Send with Script B:

> One last thing, only if it's easy: could you ask them this, and tell us what they say?
> "Could you read it [Arm V: read it or listen to it] without help from anyone? Yes, or what got in the way?"

Mark the answer as relayed. A parent who'd rather not ask is fine; the answer is coded missing, which counts as No for SC-2.

## 8. Close

After Script B and C, or when a parent stops:

> Thank you. We'll delete your notes if you ask, any time. We'll let you know what we decide.

The thank-you note after the read-out says what was decided in one or two lines, offers again to delete their answers, and has no code, offer or gift in it. Any code given after the read-out carries the endorsement disclosure line (NS-03-R7).

## 9. What goes in the notes, and what never does

- In: the participant code, the arm, coded answers, the parent's own words about how sending went (with names taken out), and whether an answer was relayed.
- Never: the letter's words, a description of what the letter is about, the child's name, the recipient's name, number or address, a screenshot, a recording, a location, or anything said by a child.
- If a parent tells you what the letter said, don't write it down. Note "content mentioned, not kept".

## 10. Off the path

| What happens | What to do now | Stop rule |
|---|---|---|
| A parent sends a letter, recording, picture, screenshot or child's name to the team | Look only far enough to see what it is. Delete it from the thread on every device the founder holds. Log by code: "item received, deleted", with the date. Carry on with the questions | Stop rule 3 if it can't be deleted |
| A parent says it reached someone they didn't mean, or was passed on against their wish | Thank them, ask nothing more about who. Tell the founder the same day | Stop rule 1: the pilot ends for everyone |
| A parent or a recipient (as relayed) is upset by the test | Stop asking. Thank them. Offer to delete their notes. Tell the founder the same day | Stop rule 2: the pilot ends for everyone |
| A participant turns out to be under 18 | Stop contact. Delete their notes the same day | Stop rule 4: the pilot ends for everyone |
| A parent wants to stop | "Of course. We'll delete your notes." Delete notes and contact details within 2 working days. Keep only the consent record, which shows the withdrawal (NS-03 section 6) | None |
| A parent asks for a reward or a code | "There's no reward for this one, only our thanks." | None |
| A recording didn't arrive | Code "file did not arrive". The parent may resend by email | None; reported as a transport failure |
| The recipient couldn't play the file | Code "could not play" | None |
| A parent can't make a screenshot | That parent doesn't take part. Code the reason | None |
| A parent picks a letter about a hard time | Their choice. Don't ask why and don't note it | None |

When a stop rule fires: no more questions to anyone, the same day. The founder decides what comes next, and the read-out records STOP.
