# NS-05: Share one letter (the verb that could justify a Share tab)

Status: Draft v1, 11 Nov 2026 (UTC). Docs only. Author: `product`. Rank 5 of 7. Index: `README.md`.
Build target: Level 1 in Build 14 at the earliest (see section 12). Levels 2 and 3 are not scheduled and are gated.

Tags: EVIDENCE = repo file or PR read this session. HYPOTHESIS = about parents. UNVERIFIED = not read or not run. Rules on tabs come from `closed-questions-2026-11-11.md` (N1 to N4) and `NAV-TAB-ROLES-10nov.md` (PR #789, head `c5897792` when I read it). Aligned on 11 Nov to the design spec `docs/design/specs/03-SHARE-ONE-LETTER-11nov.md` (PR #794, head `e872793d`): text first, an action on the letter page, not a tab. I did not open the Export code or run the share sheet.

## 1. Job to be done

I go to a letter I kept to send it to one person I choose, so that they can read it (and, later, hear it) without an account or an app.

## 2. Who and when

- A parent who kept a letter about something a grandparent would love to know ("she said her first word"). HYPOTHESIS. Seven of the 12 products read have family following, and sharing with relatives is the most-cited praise in listings (research file, headline 2 and table stakes). Demand from our own parents: none yet; NS-03 measures it.
- Only the parent who can already read the letter. Not the child. Not the recipient (they do not need an account).

## 3. The single capture entry rule

Sharing is an OUTPUT, never a capture. It starts from one place: a "Share this letter" button on the letter page (rule P9, object action on the object). It makes nothing new: no new letter, no new words. It opens the Share sheet and does nothing of its own (rule P4). Home, the Photos lens and Find do not start a share.

## 4. The three levels

| Level | What leaves the phone | Through what | Gate before it can ship |
|---|---|---|---|
| 1 | The words as plain text (date line, body, signature line), and optionally the stored picture; no recording | The iOS share sheet (the parent's own Messages, Mail, WhatsApp). Nothing passes through our servers | None beyond the usual content and review rules. A child's name may appear only if the parent said it in the words |
| 2 | Level 1 plus the recording file | Same, the parent's own app | `security-architect` read and counsel read first (closed X2). The pilot (NS-03) Arm V result |
| 3 | A link to a page with words and sound, hosted by us | Our hosted page | `security-architect` and counsel reads; the pilot reports Go; the founder decides audio hosting spend; the privacy label moves Audio Data to collected and linked (exec Q1, Apple page read by the council 10 Nov) |

This PRD specifies Level 1 in full. Levels 2 and 3 get only the guards above and the rules in section 8; their requirements are written after the gates, not before.

## 5. User stories (Level 1)

| Id | Story |
|---|---|
| S1 | As a parent, I open a letter, tap Share this letter, see exactly what will be sent, and choose the person in my own message app. |
| S2 | As a parent, I choose whether the picture goes with it. It does not by default. |
| S3 | As a parent, I change my mind and close the sheet. Nothing was sent and nothing is left on my phone. |
| S4 | As a grandparent, I get a message I can read on any phone, without an app or an account. |

## 6. Acceptance criteria (Level 1)

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-05-R1 | Given the letter page with `EXPO_PUBLIC_SHARE_LETTER` on, Then exactly 1 "Share this letter" button exists. Given Home, Book list, Photos lens, Find results and Me, Then 0 share controls exist. | `[NS-05-R1] the only share control is on the letter page` |
| NS-05-R2 | Given a tap, Then a preview sheet shows what will leave: the words, the signature and date line, the picture if toggled on, and the line "The recording stays in your book." (words by `content`). A Continue and a Not now control have the same size, weight and type at AX5. | `[NS-05-R2] the preview names what leaves and what does not` |
| NS-05-R3 | Given Continue, Then the iOS share sheet opens with the words as plain text, plus the picture file only if toggled on. The app records no destination, app or recipient. | `[NS-05-R3] the share sheet gets the words and the app learns nothing back` |
| NS-05-R4 | Given the shared text, Then it equals date line, `final_text` (the view the Book shows) and signature line, with nothing else added, for 20 fixtures including Devanagari, Arabic and Chinese. No title, caption, summary or tag is added. The words always go: their toggle is on and disabled (design spec 03). | `[NS-05-R4] the shared text is the letter's words and nothing more` |
| NS-05-R5 | Given the share, Then it contains 0 audio files; the picture is attached only if its toggle was turned on by the parent (default off), as the stored stripped copy (`NX-39-R8`: 0 metadata segments). The preview has no recording toggle at Level 1. | `[NS-05-R5] no audio; picture only if chosen` |
| NS-05-R6 | Given any attached file name or metadata, Then neither holds the child's name, an email, a device name or an app account id. A picture's file name is the letter's date and nothing else. | `[NS-05-R6] file name and metadata hold no personal data` |
| NS-05-R7 | Given another parent's letter, a sealed or hidden-until letter, a quiet-day mark or a letter with no words, Then Share is absent: own, open letters only (design spec 03, SH-R5). | `[NS-05-R7] only own, open letters can be shared` |
| NS-05-R8 | Given the plan engine, Then sharing is never gated; it works after the allowance is used and after Plus lapses. | `[NS-05-R8] Share is never gated` |
| NS-05-R9 | Given airplane mode, Then the text is built and the sheet opens (sending depends on the parent's own app). 0 network calls come from our code. | `[NS-05-R9] building the share makes 0 network calls` |
| NS-05-R10 | Given the sheet is dismissed, a send fails, or the app is killed, Then the temporary file is deleted at the next launch at the latest. | `[NS-05-R10] no temporary file survives` |
| NS-05-R11 | Given a letter of 1,000 words, Then the sheet opens within 1 second on an SE-class phone (PROPOSED; mobile confirms by device run). | `[NS-05-R11] the sheet opens within 1 second` (device) |
| NS-05-R12 | Given any share, Then no row, column, counter, "shared" badge or "last shared" date is stored on the letter or in the book, and none is shown. | `[NS-05-R12] nothing remembers that a letter was shared` (schema test) |
| NS-05-R13 | Given VoiceOver, AX5 and Reduce Motion, Then the button, the preview and the toggle are labelled, 44 pt or more, one column at AX5. | `[NS-05-R13] the share flow passes VoiceOver and AX5` (device) |
| NS-05-R14 | Given App lock on, Then the button is reachable only once the app is open past App lock, and the preview is blank in the app switcher snapshot. | `[NS-05-R14] the preview is blank in the switcher` |
| NS-05-R15 | Given the shared text, Then the last line is one small muted line with the brand name from `packages/brand` and nothing else: no link, no tracker, no "sent with", no invitation to install. Default stands unless the founder rules otherwise (OQ-2). | `[NS-05-R15] one footer line, no link` |
| NS-05-R16 | Given the strings, Then they pass the content rules test: no dash, curly quote, ellipsis character or emoji; no "gift", no machine-writing implication; `{child}` for the child. | existing rules test, extended |

## 7. Edge cases, empty and error states

| Case | Behaviour |
|---|---|
| Letter has no words yet (recording still being made) | Share is not offered until the words exist. No empty PDF. |
| Letter has a picture but the picture file is missing | The toggle is hidden; words only. No error. |
| Very long letter | Plain text has no length limit; nothing is truncated. |
| Right-to-left or Devanagari text | Sent as text; the recipient's phone draws it. |
| iOS share sheet has no apps | iOS decides; nothing from us. |
| Quiet day | Cannot be shared (no words, D-084). |
| Servers off | Same behaviour (the feature is on the phone). |
| Sharing a letter about another person | The app does nothing different; counsel owns the other-people position (`NX-39-R38`). |
| The parent shares to the wrong person | Our app cannot know or undo it. The preview says plainly that the file goes where the parent sends it. A sent file cannot be recalled. This is the main reason Level 1 carries no voice. |

## 8. Privacy and constitution check

- The machine adds no meaning. The file is the parent's words, nothing else. No AI wording anywhere.
- Door lines (the parent's act of sending is not a consent record):
  - Shown: the preview sheet (R2).
  - Records: nothing (R12).
  - Never: audio at Level 1; the recipient; the app chosen; a "shared" count; the child's name in the file name or metadata; a tracking link.
  - Decline: Not now. Nothing is built, nothing sent.
- Levels 2 and 3 guards (binding on any future PRD): per-letter and by the author only; never default on; no "seen by", no open counts, no reactions, no counts of shares; an unguessable link that expires and can be revoked; no recipient account; no machine caption; no loss or legacy-death wording; the privacy label and Apple guideline 1.2 position read first (exec Q1: UNVERIFIED by me).
- No streaks, points or gap counting: nothing says "you have not shared a letter".

## 9. Free vs Plus (recommendation)

- Level 1: free, ungated, forever. A parent keeps the right to export what they kept (D-082: what a family kept stays theirs to read, hear and export). Sharing one letter is the smallest version of export.
- Levels 2 and 3: no new gate and no second tier (closed X3, exec rules 1 and 2). Sharing follows keeping: any letter the parent could keep under the existing allowance (2, planned raise 2, 5, 10) can be shared; more letters need Plus because keeping them does. Family listening may be described later as part of what Plus holds, under the same single gate. This needs the founder and counsel on wording; no price or "free forever" text on any surface.
- Capture is never blocked and sharing does not touch capture.

## 10. Does this justify a Share tab? (the question asked)

Recommendation: no, not at Level 1.

- The closed decision is Home | Book | Me, and a fourth tab ships only when share-one-letter exists and passes the job-clarity checklist (N2).
- NAV-TAB-ROLES gives the test for a new tab: a verb no other tab has, material no other tab holds, and a day-one state that is not empty or mostly a promise. Level 1 gives a verb (Give) but no material that only a Share tab holds: Export already sits in Me, and sharing starts from a letter page. A Share tab at Level 1 would hold one quiet row on day one.
- Revisit the tab only when all three hold: Level 2 or 3 is live; Export, "share one letter" and people with access are three outputs a parent actually uses (measured in a study, not in telemetry); the job-clarity checklist passes with five parents. Until then Level 1 is a button on the letter page and Export stays in Me. This agrees with design spec 03 section 9 (the Share tab test).
- Co-parent "coming soon" stays at most one caption line in Me (N1).

## 11. Metrics (content-free)

None in the app. A study of five parents: can they send one letter in under 60 seconds without help, and does the preview make clear what leaves (4 of 5 can say that the recording does not go). Opt-in analytics, if on, may carry `letter_share_started` with no property; it never carries a destination or count of shares per child.

## 12. Dependencies, risks, rollout

Dependencies: the letter page, the stored picture (NS-01), App lock, `packages/content` strings, design lead's sheet spec. Level 2 and 3: NS-03, reads, audio hosting decision (not decided; nothing builds on it).

| Risk | Mitigation |
|---|---|
| The recipient's phone shows the text badly (very long line breaks) | Plain paragraphs only; no formatting characters. |
| A parent expects the voice and is disappointed | R2 says what stays; Level 2 waits for the reads. |
| The footer reads as advertising | Default is one muted line; founder may drop it (OQ-2). |
| Wrong recipient | Said in the preview; no voice at Level 1. |

Rollout: flag `EXPO_PUBLIC_SHARE_LETTER` (name proposed). Target Build 14 for Level 1, after Photos and Find ship in Build 13 and the NS-03 read-out is in (Fri 11 Dec 2026). Level 1 does not wait for the pilot to finish if the founder prefers; the default is to wait, to keep Build 13 about the tabs release (exec Q4).

## 13. Open questions (every one has a default)

| Id | Question | Owner | Default if no answer | By |
|---|---|---|---|---|
| OQ-1 | Is Level 1 in Build 14 or later? | Founder | Build 14, after the pilot read-out. Per the 11 Nov design report the founder's default is that it is built, text first; only the build number is open. | Fri 20 Nov 2026 |
| OQ-2 | Footer line yes or no | Founder with `content` | Yes, one muted line, no link. | Design freeze |
| OQ-3 | Which view goes in the text: With small fixes or Exactly as said? | `content`, `product` | The view the Book shows. | Design freeze |
| OQ-4 | Picture on or off by default in the preview | `design-systems` | Off. | Design freeze |
| OQ-5 | Share tab | Founder | No tab (section 10). | Revisit after Level 2 or 3 |

## 14. Not fully testable

R11 and R13 need devices. R4 needs a fixture set that does not exist yet. How the iOS share sheet hands text and a picture to each app is UNVERIFIED. Levels 2 and 3 are deliberately not testable here because their requirements are not written.
