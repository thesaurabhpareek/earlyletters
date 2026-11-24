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

## Gates before any parent is contacted

These come from NS-03 sections 0, 5 and 10. The full checklist is BL-127's work (NS-03-R1 to R8); this list is here so the script is never used without it.

1. Counsel has read the consent texts, the recruiting note and the instructions, and a dated yes is in the private pilot file (NS-03-R1). Due 27 Nov, the founder's step. Without it, no arm starts and every step moves by the same number of days.
2. For Arm V only: the `security-architect` read of NS-03 sections 3, 4 and 15 and counsel's read of the voice lines are both dated on or before that parent's consent date (NS-03-R2). Without both, every parent is in Arm W.
3. `qa` has filed a yes or no for the Asha fixture recording playing in WhatsApp on Android, Gmail on the web and Apple Mail (NS-03-R9). A client that can't play it is named in Instruction V.
4. The success lines and the outcome table (NS-03 section 8) are copied word for word into the pilot file and hashed before the first parent's day 0 (NS-03-R6).
5. `mobile` has answered whether a one-letter PDF can be made. This session read the export code (`apps/mobile/src/lib/export/pack.ts`, `build.logic.ts`): it makes one PDF per child's book, not per letter. So the scripts here lead with the screenshot fallback. Read, not run on a device.

## What is not here

- The read-out file (counts and outcome only): BL-1325, after the last day 7, in `docs/research/studies/`.
- The pilot-file checklist and deletion notes: BL-127.
- Any message to recipients. The team never contacts them (NS-03 section 7, Script C).
