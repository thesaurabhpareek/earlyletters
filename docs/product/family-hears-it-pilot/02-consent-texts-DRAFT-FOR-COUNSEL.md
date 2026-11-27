# Consent texts: DRAFT FOR COUNSEL

**DRAFT FOR COUNSEL. NOT LIVE.** These texts are not to be sent to anyone until counsel has read them and a dated yes is in the private pilot file (NS-03-R1). Counsel's read is the founder's step, due 27 Nov 2026. Nothing here is legal advice, and nothing here has been cleared by a lawyer. Written 24 Nov 2026 by `user-research` (Claude role).

Source: NS-03 section 15 (Shown, Records, Never, Decline) in `docs/product/prd/03-family-hears-it-pilot.md`. The card's words are the intent. The texts below are the proposed final wording, in plain spelled-out form as the writing guide asks for consent lines (`packages/content/WRITING-GUIDE.md` section 6). Every change from the card is in the table in section 4, with its reason.

How to use: render `{brand.name}` from `packages/brand` before counsel reads. Each version has its own hash: save the rendered text exactly as it will be sent in a plain text file in the founder's private store and take its SHA-256 (for example `shasum -a 256 consent-W.txt`). The consent record stores that hash, never the text.

## 1. Version W (words and picture)

> We are testing one idea: a parent sends one letter from {brand.name} to a relative or close friend, through their own messages, and we ask how it went.
>
> You choose the letter and the person. It goes from your phone, through your own messages. We never receive it, and we do not ask for your child's name or the name of the person you send it to. The service they use for messages or email keeps a copy of what you send, and if they pass it on, that cannot be undone.
>
> We ask you a few short questions twice, 3 days after we send you the one step and 7 days after you send the letter, by message or by phone, and write short notes. The notes use a code, not your name.
>
> Taking part changes nothing about how {brand.name} keeps your letters.
>
> There is no payment, gift or offer for taking part.
>
> You can stop at any time. If you stop, we delete your notes within 2 working days. Otherwise we delete them 30 days after the whole test ends, on the day we count everyone's answers. We keep a short record that you agreed, and that you stopped if you did, for 12 months after that same day, and then we delete it.
>
> Are you 18 or older, and do you agree? Yes, or No thanks.

## 2. Version V (words and picture, plus the recording)

Version V is version W with one paragraph added after the second.

> We are testing one idea: a parent sends one letter from {brand.name} to a relative or close friend, through their own messages, and we ask how it went.
>
> You choose the letter and the person. It goes from your phone, through your own messages. We never receive it, and we do not ask for your child's name or the name of the person you send it to. The service they use for messages or email keeps a copy of what you send, and if they pass it on, that cannot be undone.
>
> You are in the group that may also send the recording of that letter. The recording is your voice, and it may also have your child's voice or sounds in it. You choose whether to send it, and to whom. We never receive it. Like the letter, a copy stays with the service they use, and a recording passed on cannot be taken back.
>
> We ask you a few short questions twice, 3 days after we send you the one step and 7 days after you send the letter, by message or by phone, and write short notes. The notes use a code, not your name.
>
> Taking part changes nothing about how {brand.name} keeps your letters.
>
> There is no payment, gift or offer for taking part.
>
> You can stop at any time. If you stop, we delete your notes within 2 working days. Otherwise we delete them 30 days after the whole test ends, on the day we count everyone's answers. We keep a short record that you agreed, and that you stopped if you did, for 12 months after that same day, and then we delete it.
>
> Are you 18 or older, and do you agree? Yes, or No thanks.

## 3. Replies

**Decline (after No thanks, or no reply after one follow-up):**

> No problem at all, and thank you for reading. Nothing changes in the app.

**Withdrawal (a parent asks to stop at any point):**

> Of course. We will delete your notes within 2 working days. Nothing changes in the app.

**A question the text does not answer:** answer it plainly in a sentence or two, and note the question by participant code (not the answer's words) in the Answers file (`04-answer-sheet.md` section 3, Consent questions), where the Answers clocks apply. Only the question's wording, with no code, goes on to the list for counsel and the next round.

## 4. Changes from the card's text (NS-03 section 15), and why

| # | Card says | Draft says | Why |
|---|---|---|---|
| 1 | "to a relative, using your own messages" | "to a relative or close friend, through their own messages" | NS-03 section 1 lets the parent pick a close friend as the recipient. "their" fixes the person: the opening sentence is about "a parent" |
| 2 | "We do not see the letter, the recording, the picture or your child's name." | "It goes from your phone, through your own messages. We never receive it, and we do not ask for your child's name or the name of the person you send it to." | On builds with servers on (preview and production), a signed-in parent's letter words are also kept on our servers (`packages/content/src/strings.en.ts`, `whereLive.onPhoneSynced`); the testflight profile has servers off. "We do not see the letter" could be read as a claim about those servers. The founder recruits from a list of people already known, who may have shared the child's name before. The draft says only what the test does |
| 3 | "We only ask you a few questions, one week apart" | "a few short questions twice, 3 days after we send you the one step and 7 days after you send the letter, by message or by phone" | The check-ins are day 3 and day 7 (NS-03 section 4), not one week apart. Day 3 counts from the day the parent gets the instruction (day 0) and day 7 from their own send date (`README.md`, "Days and clocks, said once"), so the text says which day each counts from rather than "day 3 and day 7", which a parent reads as both from today. Phone is offered for accessibility (NS-03 section 11) |
| 4 | (not in the card) | "The notes use a code, not your name." | True to NS-03 section 3 (participant codes P01 to P10). A code-to-person key exists in the founder's private store, so the line does not say the notes are anonymous |
| 5 | (not in the card) | "Taking part changes nothing about how {brand.name} keeps your letters." | The pilot changes no app behaviour (NS-03 sections 3 and 20). Replaces "Your book and your letters are not affected either way" with the same meaning, said once |
| 6 | (not in the card) | "There is no payment, gift or offer for taking part." | OQ-3 and NS-03-R7: no reward before the read-out. Saying so up front supports the endorsement position in NS-03 section 20 |
| 7 | "If you stop, we delete your notes." | Adds the 2 working day clock, the 30 day clock, and that the consent record is kept 12 months, both clocks from "the day we count everyone's answers" | The card keeps the consent record for 12 months even after a withdrawal (ruling D4, NS-03 section 6). Saying only "we delete your notes" would leave that out. "The whole test ends, on the day we count everyone's answers" is the read-out, the one start point every clock in this kit uses (NS-03 section 5 steps 9 and 10, section 14; `04-answer-sheet.md` section 1; counsel question 5). "After the test ends" alone could be read as the parent's own week, which for an early parent ends weeks before the read-out |
| 8 | "If you are in the group that sends a recording: you will send a recording of your child's voice" | "You are in the group that may also send the recording of that letter. The recording is your voice, and it may also have your child's voice or sounds in it." | A letter's recording is the parent talking. It may hold the child's voice, which is why the gate exists (NS-03 section 0), but saying it is the child's voice is not accurate for most letters. Version V is only sent to Arm V, so "If you are in the group" is dropped |
| 9 | "Do you agree? Yes, or No thanks." | "Are you 18 or older, and do you agree? Yes, or No thanks." | Stop rule 4 and NS-03 section 1 need every participant to be 18 or over. This asks once, in the consent itself |
| 10 | "Your book and your letters are not affected either way." | Folded into change 5 | One line instead of two saying the same thing |
| 11 | (not in the card) | Both versions: "The service they use for messages or email keeps a copy of what you send, and if they pass it on, that cannot be undone." Version V adds, for the recording: "Like the letter, a copy stays with the service they use, and a recording passed on cannot be taken back." | Security condition V4 (`docs/tdd/new-scope/security.md` section 3.5): the consent states the residuals, that the relative's messaging provider keeps a copy and a forward cannot be undone. Counsel Q45(d) asks whether these lines are enough. The same residuals hold for Arm W's screenshot, so version W states them too, and version V stays version W plus one paragraph |

## 5. What is recorded, and what never is

Unchanged from NS-03 section 15, except the third line, which says what else the Consent file holds.

- **Records:** participant code, arm, Yes or No, the consent text hash, the date, and the method (message or call). In the founder's private pilot store only. Never in the app, the repo, a Claude session or a Project doc. Deleted 12 months after the read-out (ruling D4).
- **Never:** a letter, recording, picture, child's name, recipient's name or contact, a screenshot, a location, a device identifier, or anything said by a child; any payment or reward tied to the answers; any request to forward anything to the team.
- **Also in the Consent file, by code and date only:** the line that shows a withdrawal or an under-18 finding, and the dated deletion notes (`04-answer-sheet.md` section 5a). Every other event line is kept in the Answers file, on the notes' clocks.
- **Decline and withdraw:** No thanks ends contact with no follow-up. Withdrawal any time by message; notes deleted within 2 working days. Neither changes anything in the app, the book or the allowance.

## 6. Questions for counsel

From NS-03 section 20, plus three this draft raises. Counsel must confirm each.

1. New question (number to be assigned by `legal` through `next-id`): concierge research with tester families, run by the founder by message and call.
2. Q44 (merged, section 7.6 of the packet): these texts for tester families; part (c) is taken with question 3.
3. Q45 (merged), "A child's voice or picture" (`docs/legal/COUNSEL_PACKET.md` section 7.7), parts (c) and (d), with Q44(c) (section 7.6). The old heading "COPPA revisited for backup" is superseded by the merged Q45, which already holds both pilot questions:
   - Q45(c), both arms' pictures: a picture of the child may leave through the parent's own act, which the packet names as "NS-03 Arm W once its file shows a picture". A screenshot of a letter page carries the letter's picture if it has one, and erratum E23 (`docs/product/prd/18-errata-after-lock.md`) gates any picture in Arm W by Q45 and the `security-architect` read. Is "the same as Export: the parent's own act, and nothing reaches our servers" right for the screenshot?
   - Q45(d), Arm V: the team instructs parents that they may send a recording that may hold a child's voice to a relative. Are the voice lines of consent version V and Instruction V enough, including the residuals (the relative's messaging provider keeps a copy, and a forward cannot be undone; change 11)?
   - Q44(c), the pilot consent in both versions, each with its own hash: does it say what a study run by message needs, when nothing from the study reaches the app or our servers?
4. Q22: a recipient who lives in another country. Recipients receive a message; they are not participants and the team never contacts them.
5. Q51: retention. Every clock runs from the read-out, which the consent calls "the day we count everyone's answers" (change 7). Notes, the code-to-person key and contact details 30 days after the read-out, or that parent's within 2 working days of a withdrawal. Consent records 12 months after the read-out, kept after a withdrawal as proof of consent and withdrawal. Once the key is deleted, a consent record links to a code only: is that still proof of consent for a person, or should a minimal key be kept with the consent record for 12 months? For a participant found to be under 18, the kit deletes notes, key row and contact details the same day and keeps the code-only consent row: is that right? On a withdrawal the kit first adds that parent's lines to the Counts file as numbers only, with no code, so N stays the same (`04-answer-sheet.md` section 4), and deletes the Counts file 90 days after the read-out (ruling D5): is that consistent with "we delete your notes"?
6. The FTC COPPA position in the exec record rests on the parent being the user and every answer coming from an adult (NS-03 section 20, UNVERIFIED there).
7. Endorsement: no code or reward before the read-out; any later code carries the disclosure line.
8. New: is "We never receive it" accurate and enough, given that a signed-in parent's letters are also kept on our servers for sync (change 2)?
9. New: is one "Are you 18 or older" question in the consent enough to meet stop rule 4 (change 9)?
10. New: does "The notes use a code, not your name" need to say that the founder keeps a separate key from code to person (change 4)?
