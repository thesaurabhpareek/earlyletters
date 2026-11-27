# Family-hears-it pilot kit (NS-03, BL-935)

Status: DRAFT, 24 Nov 2026. Written by an interactive session playing `user-research` (Claude role, not counsel). Nothing here has been sent to a parent, and nothing here may be sent until the gates below are on record.

Satisfies: BL-935 (C-19). Source of truth: `docs/product/prd/03-family-hears-it-pilot.md` (NS-03, locked rev 2). Where this kit and the card differ, the card wins, and the difference is listed in the PR that added this kit under "Open for the exec team".

## What is in this folder

| File | What it is | Who uses it |
|---|---|---|
| `01-session-script.md` | The words and steps for every contact with a parent: consent, arm, instruction, day 3, day 7, close, and what to do when something goes off the path | The founder, who talks to parents, with `user-research` alongside |
| `02-consent-texts-DRAFT-FOR-COUNSEL.md` | Consent version W and version V, the decline and withdrawal replies, and the questions for counsel. DRAFT FOR COUNSEL: not live | Counsel reads; the founder sends only after that read is on record |
| `03-recruiting-note.md` | The first message to 8 to 10 parents, the eligibility check and the reply to a no | The founder |
| `04-answer-sheet.md` | The blank sheet the answers go on: consent record, coded answers, counts, outcome, and the log of mistakes, withdrawals and deletions | The founder and `user-research`, in the founder's private store only |

## The rules this kit keeps

- No build. No app change, no flag, no server, no link, no upload to our systems (NS-03 section 3).
- Nothing leaves a phone except what a parent chooses to send, through their own messages, to one person they choose. The team never receives a letter, a recording, a picture, a child's name, a screenshot of a letter, or the recipient's name or contact.
- No entry text or child name is kept in notes. Notes carry a participant code (P01 to P10), short coded answers and the parent's own words about how it went, with every name taken out.
- The filled answer sheet, the code-to-person key and the consent records live only in the founder's private store. Never in this repo, a Claude session or a Project doc (NS-03-R8). This folder holds blank templates only.
- Examples use the fictional Asha family only, and only where an example helps.
- Product name: every text writes `{brand.name}` from `packages/brand`. The founder renders it before counsel reads, and the version hash is taken over the rendered text (NS-03 section 7).

## Days and clocks, said once

Every file in this kit uses these words the same way. Where the card is silent, the default here is listed in the PR body under "Open for the exec team".

- **Send window and cap (NS-03 section 5, step 5).** 5 working days from the first working day after recruiting closes (step 4). The last day of the window is the cap. The cap does not move, even if recruiting is extended once (step 4b).
- **Day 0 (default; the card does not define it).** The day a parent receives the instruction. Every parent who said Yes during recruiting gets the instruction on the first working day of the send window, so they share one day 0. A parent who says Yes during the step 4b extension, inside the window, gets the instruction that day, and that day is their day 0.
- **Day 3 and SC-1 (default).** Script A goes on day 3 counted from day 0, to every parent, whether they have sent or not. SC-1's "by day 3" counts from day 0 too, so it measures whether a parent sent within three days of getting the step.
- **Day 7 (NS-03 section 5, step 6).** Script B and Script C go 7 days after the parent's own send date. Since every send is on or before the cap, the last day 7 is at most 7 days after the cap.
- **A parent who has not sent by the cap (default).** Gets no Script B or C. On day 7 counted from day 0, or the first working day after the cap if that is later, they get the short day-7 note for a parent who did not send (`01-session-script.md` section 6). They count in N, not in S, and as not sent for SC-1.
- **Pacific time and holidays.** Days are calendar days in Pacific time, wherever the recipient lives. No contact on a US federal public holiday: a check-in that falls on one goes the next working day, and SC-1 still counts from day 0.
- **The read-out.** The day the counts and the outcome are written (BL-1325), never sooner than 7 days after the last send. Every retention clock in this kit runs from the read-out: notes, the key and contact details 30 days after it, the consent record 12 months after it. The consent texts call this day "the day we count everyone's answers" (`02-consent-texts-DRAFT-FOR-COUNSEL.md`).

## Gates before any parent is contacted

These come from NS-03 sections 0, 5 and 10. The full checklist is BL-127's work (NS-03-R1 to R8); this list is here so the script is never used without it.

1. Counsel has read the consent texts, the recruiting note and the instructions, and a dated yes is in the private pilot file (NS-03-R1). Due 27 Nov, the founder's step. Without it, no arm starts and every step moves by the same number of days. This is the before-any-contact list (NS-03 section 0). Counsel also reads every other text in `01` to `03` before it is used (NS-03 section 7; the list is in `01-session-script.md`, first lines).
2. For any arm that can send a picture: the `security-architect` read of NS-03 sections 3, 4 and 15 is dated on or before that parent's consent date. Both arms can send a picture, because a screenshot of a letter page carries the letter's picture if it has one. Erratum E23 (`docs/product/prd/18-errata-after-lock.md`) corrects NS-03 section 0, Arm W bullet (E23 cites it as "NS-03 line 15"), which exempted Arm W: Arm W (any picture) needs the security read as well as counsel's Q45(c) (`02-consent-texts-DRAFT-FOR-COUNSEL.md`, counsel question 3, part of gate 1). The read already exists as a conditional yes: `docs/tdd/new-scope/security.md` section 3.5, "Security read for NS-03 Arm V", Yes if V1 to V4 hold. It counts only once `security-architect` posts it dated on BL-935's PR or in the pilot file, and that dated posting is what is missing. The kit meets V1 in Instruction V, V3 in the rules above and `01-session-script.md` sections 0 and 10, V4 in consent version V, and puts V2 in gate 4 below. Section 3.5 is headed for Arm V; whether the dated posting also covers Arm W's screenshot under E23 is for `security-architect` to say in it (PR body, "Open for the exec team"). Without a dated read that covers an arm, that arm does not start.
3. For Arm V also: counsel's read of the voice lines (`docs/legal/COUNSEL_PACKET.md` Q45(d)) is dated on or before that parent's consent date (NS-03-R2). Without it, every parent is in Arm W.
4. `qa` has filed, in the pilot plan, before recruiting:
   - a yes or no for the Asha fixture recording playing in WhatsApp on Android, Gmail on the web and Apple Mail (NS-03-R9). A client that can't play it is named in Instruction V;
   - the atom dump of one Asha `.m4a` fixture, confirming it carries no device name, account id or location (security V2, `docs/tdd/new-scope/security.md` section 3.5). Unverified until then;
   - because an export's recording can also be an `.aac` file (an ADTS stream; `packages/content/src/features/export.en.ts`, the `audio/` line; export schema 1.2.0), the same check on one Asha `.aac` fixture: no tag in the file carries a device name, account id or location, and the same playback check. This widens NS-03-R9 and V2, which name `.m4a` only (PR body, "Open for the exec team");
   - a dry-run of the Arm V export steps in `01-session-script.md` section 4 with the Asha fixture.
5. The success lines and the outcome table (NS-03 section 8) are copied word for word into the pilot file and hashed before the first parent's day 0 (NS-03-R6).
6. `mobile` has answered whether a one-letter PDF can be made. This session read the export code (`apps/mobile/src/lib/export/pack.ts`, `build.logic.ts`): it makes one PDF per child's book, not per letter. So the scripts here lead with the screenshot fallback. Read, not run on a device.

## What is not here

- The read-out file (counts and outcome only): BL-1325, after the last day 7, in `docs/research/studies/`.
- The pilot-file checklist and deletion notes: BL-127.
- Any message to recipients. The team never contacts them (NS-03 section 7, Script C).
