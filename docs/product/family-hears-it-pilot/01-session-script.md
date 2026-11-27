# Session script: the family-hears-it pilot (NS-03)

Status: DRAFT, 24 Nov 2026, `user-research` (Claude role). Not for use until the gates in `README.md` are on record. Counsel reads every text in `01` to `03` before it is used (NS-03 section 7): the recruiting note, the four eligibility checks and the replies to a no or a not-a-fit (`03`); the consent texts and the decline and withdrawal replies (`02`); and in this file the holding note after a Yes, the instructions, Scripts A, B and C, the day-7 note for a parent who did not send (Script C is passed on to a recipient, who is not a participant), the close, the replies in section 4 and section 10, and the Arm V export steps. The texts that must be read before the first contact are the narrower list in `README.md` gate 1 (NS-03 section 0).

Source: NS-03 sections 4 to 8 (`docs/product/prd/03-family-hears-it-pilot.md`). The question wording in Scripts A, B and C is the card's, kept as written so the answers can be counted against section 8, except Script B Q3 for Arm V, which asks about "the recording" instead of "your child's voice" (listed in the PR body, exec item 3). Elsewhere only the phrasing is lighter (for example "A few words is plenty" in Script A Q2); every answer option is the card's. The instructions and the close are rendered for a parent to read, in the voice of `packages/content/WRITING-GUIDE.md`. Every change from the card's text is listed in the PR body under "Open for the exec team".

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
6. Days follow `README.md`, "Days and clocks, said once". Day 0 is the day the parent gets the instruction. Script A goes on day 3 from day 0, sent or not. Script B and C go on day 7 from the parent's own send date. The send cap is the last day of the 5-working-day send window. Calendar days in Pacific time, wherever the recipient lives. No contact on a US federal public holiday: a check-in that falls on one goes the next working day.
7. A parent who'd rather talk than read gets the same words by voice call. Don't record the call. Type the answers into the sheet straight after, under the same note rules (section 9).
8. A parent who prefers another language may be spoken to in it by the founder. The notes are written in English. Nobody on the team translates a letter.

## 2. Recruit

Send the recruiting note (`03-recruiting-note.md`) only after counsel's read is on record. A parent who wants to hear more gets the eligibility check in that file, then the consent text for their arm.

## 3. Consent and the arm

1. Decide the arm before sending consent, by the card's rule (NS-03 section 5, step 4, PROPOSED for the founder and counsel):
   - Before the `security-architect` read is on record: no arm starts. Both arms can send a picture, because a screenshot of a letter page carries the letter's picture if it has one, so both need that read (erratum E23 in `docs/product/prd/18-errata-after-lock.md`, which corrects NS-03 section 0, Arm W bullet; `README.md` gate 2).
   - After the security read, before the day both voice reads are on record: every parent is Arm W.
   - On or after that day: alternate, starting with V. No later parent is moved to W because of an earlier gap.
   - A parent who has said their recordings aren't on the phone they use now (for example a new phone while backup is off) is Arm W, and the alternation goes on unchanged with the next parent (NS-03 section 9).
2. Send the consent text for that arm (`02-consent-texts-DRAFT-FOR-COUNSEL.md`), exactly as counsel read it. Don't add a line or explain it in other words. If the parent asks a question the text doesn't answer, answer it plainly and note the question by code, so the text can be fixed for the next round.
3. Record in the consent file: code, arm, Yes or No, the hash of the text sent, the date, and message or call. Nothing else.
4. "No thanks", or no reply after one gentle follow-up: send the decline reply in `02-consent-texts-DRAFT-FOR-COUNSEL.md` and stop. No second follow-up.

## 4. The instruction (send on day 0)

**Right after a Yes during recruiting**, send only this, so nobody sends before the window opens:

> Thanks for saying yes. We'll send you the one step on {first day of the send window}.

**On day 0** (the first working day of the send window, or the day of the Yes for a parent who says Yes during the step 4b extension), send the instruction for the parent's arm. {last day} is the send cap, the last day of the send window (`README.md`, "Days and clocks, said once").

Proposed wording. Both versions lead with the screenshot, because the app's export makes one PDF for the whole book, not one per letter, and the whole-book PDF is never sent (NS-03 section 0). If `mobile` confirms a one-letter PDF can be made, add it back as the first choice.

**Instruction W (Arm W, only after the security read is on record, E23):**

> Thanks again for saying yes. Here's all there is to it.
> Pick one letter in {brand.name} you're happy to share. Take a screenshot of it (more than one if it's long) and send it to one person you choose, in the message app you already use with them.
> Say anything you like to them.
> Please don't send anything to us, and send only the letter.
> Please send it by {last day}, if you'd still like to.
> We'll check in 3 days from today, and again 7 days after you send it.

**Instruction V (Arm V only, and only after both voice reads are on record):**

> Thanks again for saying yes. Here's all there is to it.
> Pick one letter in {brand.name} you're happy to share. Take a screenshot of it (more than one if it's long) and send it to one person you choose, in the message app you already use with them.
> If you'd like them to hear it too, send the recording of that letter as well. The recording is your voice, and it may also have your child's voice or sounds in it. It's your choice whether to send it.
> Send only that one recording, never the whole export file.
> If you use Export to find the recording, keep the export on this phone, never on a shared drive, and delete it from Files as soon as you've sent the recording: the file you saved and the folder it opens into. It holds your whole book, unlocked.
> If they don't use iMessage or WhatsApp, a recording longer than about 2 minutes may not arrive by text message. Email or a messaging app works better.
> Say anything you like to them.
> Please don't send anything to us.
> Please send it by {last day}, if you'd still like to.
> We'll check in 3 days from today, and again 7 days after you send it.

If `qa`'s playback check (NS-03-R9) found a client that can't play the file, add one line naming it before "Say anything you like to them", for example: "Gmail on the web may not play it."

The two lines on the export (send only the recording; keep the export on this phone and delete it once sent) are in Instruction V itself, not only in the steps below, because a parent who works out Export alone makes the same file: the whole book, unlocked, with the child's name on every letter file (security V1, `docs/tdd/new-scope/security.md` section 3.5).

**If an Arm V parent asks how to find the recording.** Read from the export code, not tried on a device (UNVERIFIED; `qa` dry-runs these steps with the Asha fixture before recruiting). The names are the iPhone's; on Android the share and file steps are named differently.

> 1. In {brand.name}, open Settings, then Export your book. Tap Export everything and wait while it gathers every letter. This can take a minute.
> 2. When it says your export is ready, tap Save or share, then Save to Files. Choose On My iPhone, not iCloud Drive or a shared folder.
> 3. In Files, tap the file you saved. It opens into a folder.
> 4. Open the letters folder, then your child's folder, then the folder for the month the letter is from (for example 2026-11). Each letter's file name starts with the letter's date (or only its month, for a letter dated by month), then a long code, not its title. Two letters from the same day differ only by the code, so open each and check the first lines. The line that starts "Recording" gives the recording's file name.
> 5. Open the audio folder and find that file. Its name is a long code that also carries the time it was recorded. If you like, rename it first (press and hold it, then Rename), for example to letter.m4a, keeping the same ending (.m4a or .aac).
> 6. Tap the file, then Share, and send it to your person.
> 7. Once it's sent, delete the export from Files: the file you saved and the folder it opened into.

Where these come from: the Export screen's button is "Export everything", and "Save or share" shows only once the export is ready (`apps/mobile/src/app/settings/export.tsx`; `packages/content/src/strings.en.ts` `settings.export`; `packages/content/src/features/export.en.ts` `screen`). The letter files sit at `letters/<child folder>/<YYYY-MM>/<date>_<id>.txt`, where `<date>` is `YYYY-MM` for a month-only letter and `<id>` is the full entry id, a UUIDv7 (`apps/mobile/src/lib/export/build.logic.ts`, `letterPath`). A recording is `audio/<entry id>.m4a` or `audio/<entry id>.aac` (`audioPath`); the rename line follows the recommendation in security section 3.5. `qa`'s dry-run checks that a parent can find the right file this way.

A letter whose Recording line says "Not on this phone" has no recording to send. The parent may pick another letter that has one. If none of their letters has a recording on this phone (for example a new phone while backup is off), the parent takes part in Arm W only (NS-03 section 9): send Instruction W, log "moved to W, no recording on this phone" by code, and count them in Arm W. The alternation goes on unchanged with the next parent.

**If an Arm W parent asks whether they can send the recording:** "This group sends the letter only. Thanks for asking."

## 5. Day 3: Script A

On day 3 counted from day 0, to every parent, whether they have sent or not. By message, or the same words on a call.

> Hi, it's day 3. Three quick questions, and you can skip any of them.
> 1. Did you send it? Yes, or not yet.
> 2. Did anything get in the way? A few words is plenty.
> 3. Is there anything you'd rather we didn't ask? If so, we'll drop that question.

Code Q1 as Sent or Not yet, and note the send date if the parent gives it. SC-1 counts Sent from this answer: it means sent by day 3 counted from day 0. No answer by the end of day 3 is coded Not yet. A send on day 4 or later, up to the cap, is still a send for S and gets Script B and C on its own day 7, but it stays Not yet for SC-1. For Not yet, code Q2 as "did not get to it" or "did not want to", from the parent's own words; if it's unclear, code "did not get to it" and mark it unclear.

## 6. Day 7: Script B to the parent

On day 7 counted from the parent's own send date.

> Hi, it's day 7, the last check-in. Six short questions. Skip anything you like.
> 1. What did they do with it? Read it, replied, asked for another, or nothing that you know of. [Arm V adds: listened.]
> 2. Did they manage on their own, or did they need help? If they needed help, what kind?
> 3. [Arm V] How did you feel about the recording going to them this way? [Arm W] How did you feel about sending it this way?
> 4. If you did it again, how would you want to send it?
> 5. Would you send another one next week? Yes, no, or not sure.
> 6. Did it reach only the person you meant? And did they pass it on to anyone else, that you know of?

**A parent who has not sent by the cap** gets no Script B or C. On day 7 counted from day 0, or the first working day after the cap if that is later, send only this, then nothing more until the thank-you note after the read-out:

> Hi, it's day 7. The test week is over, so there's nothing more to do or send. Thank you for taking part. We'll delete your notes if you ask, any time.

Code them Not yet for SC-1 and Send date "none by the cap". They count in N, not in S. A send after the cap is not counted in S and gets no Script B or C; log it by code as "sent after the cap".

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
| A participant turns out to be under 18 | Stop contact. The same day, delete their notes, their key row and their contact details (the pilot thread). Keep their consent row, which then holds a code only, and log by code: "under 18; notes, key row and contact details deleted" | Stop rule 4: the pilot ends for everyone |
| A parent wants to stop | "Of course. We'll delete your notes." Within 2 working days, delete their notes, their key row and their contact details (the card deletes the key "with the raw notes", NS-03 section 14). Keep only the consent record, which shows the withdrawal (NS-03 section 6) | None |
| A parent asks for a reward or a code | "There's no reward for this one, only our thanks." | None |
| A recording didn't arrive | Code "file did not arrive". The parent may resend by email | None. Reported beside SC-2 as a transport failure; it does not change the SC-2 count (the recipient still counts by their Script C answer) |
| The recipient couldn't play the file | Code "could not play". The Script C answer is No for SC-2 (NS-03 section 6) | None |
| A parent can't make a screenshot | That parent doesn't take part. Code the reason | None |
| A parent picks a letter about a hard time | Their choice. Don't ask why and don't note it | None |

When a stop rule fires: no more questions to anyone, the same day. The founder decides what comes next, and the read-out records STOP.
