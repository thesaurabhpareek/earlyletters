# Answer sheet: the family-hears-it pilot (NS-03)

Status: DRAFT, 24 Nov 2026, `user-research` (Claude role). This is the blank layout. The filled sheet lives only in the founder's private store, never in this repo, a Claude session or a Project doc (NS-03 section 14, NS-03-R8).

Source: NS-03 sections 8, 14 and 23 (`docs/product/prd/03-family-hears-it-pilot.md`).

## 1. Four files, one per deletion clock

Each kind of record has its own clock, so each sits in its own file and can be deleted on the day without touching the others.

| File | Holds | Deleted | Rule |
|---|---|---|---|
| Key | Participant code to person | With the answers, 30 days after the read-out | NS-03 section 14 |
| Consent | The consent record (section 2) and the log (section 5) | 12 months after the read-out | Ruling D4 |
| Answers | Coded answers and short notes (section 3) | 30 days after the read-out, or within 2 working days of a withdrawal for that parent's row | NS-03-R4, NS-03-R5 |
| Counts | Numbers only (section 4) | 90 days after the round | Ruling D5 |

Every deletion gets a dated note in the consent file's log: what was deleted, by code, and the date. The log entry never repeats what was deleted.

## 2. Consent record (Consent file)

One row per parent. Nothing else is recorded about consent.

| Code | Arm | Yes or No | Consent text hash | Date (Pacific) | Method |
|---|---|---|---|---|---|
| P01 | W or V | Yes or No | SHA-256 of the rendered text sent | YYYY-MM-DD | Message or call |

Check before each row: the `security-architect` read is dated on or before this date, for either arm, since both can send a picture (erratum E23, `README.md` gate 2). Before each Arm V row, also check that both voice reads are dated on or before this date (NS-03-R2).

## 3. Answers (Answers file)

One row per parent who said Yes. Codes only, except the two free-words columns, which hold the parent's own words about how sending went with every name taken out. Never the letter's words, what the letter is about, the child's name or the recipient's name (`01-session-script.md` section 9).

| Column | Values | From |
|---|---|---|
| Code | P01 to P10 | |
| Arm | W or V (a V parent with no recording on this phone is moved to W and counted in W; see the log) | Consent |
| Form sent | Screenshot, one-letter PDF, or none | Day 3 or day 7 |
| Send date | YYYY-MM-DD, Pacific | Parent |
| A1 Sent by day 3 | Sent, Not yet (no answer counts as Not yet) | Script A Q1 |
| A2 Reason if not yet | did not get to it, did not want to, unclear | Script A Q2 |
| A3 Questions dropped | The question numbers, or none | Script A Q3 |
| B1 Read | Yes, No | Script B Q1 |
| B1 Replied | Yes, No | Script B Q1 |
| B1 Asked for another | Yes, No | Script B Q1 |
| B1 Listened | Yes, No (Arm V only; blank for W) | Script B Q1 |
| B1 Nothing known | Yes, No | Script B Q1 |
| B1 Asked to hear | Yes, No (Arm W only: the recipient asked, unprompted, to hear the voice) | Script B Q1 free text |
| B2 Managed | on their own, needed help, file did not arrive, could not play | Script B Q2 |
| B3 How it felt | Free words, names taken out | Script B Q3 |
| B4 How they'd send it | Free words, names taken out | Script B Q4 |
| B5 Another next week | Yes, No, Not sure | Script B Q5 |
| B6 Reached | only them, someone else, not sure; and passed on against their wish: Yes, No, not known | Script B Q6 |
| C Read without help | Yes, No, missing (missing counts as No; a B2 "could not play" makes this No) | Script C, relayed |
| Relayed | Always Yes for C; marks the answer as second-hand | |

Practice row, never counted: P00, the fictional Asha family, Arm W, Form sent Screenshot, A1 Sent, B1 Read Yes and Replied Yes, B2 on their own, B5 Yes, B6 only them and No, C Yes. Use it once to check the sheet's formulas, then delete it before P01's day 0.

## 4. Counts (Counts file)

Numbers only. These are the only figures that reach the read-out (BL-1325).

| Line | Count | Threshold | Met |
|---|---|---|---|
| N, parents who consented (W, V) | | | |
| S, parents who sent (W, V) | | | |
| SC-1 sent by day 3 | x of N | ceil(0.75 x N) | |
| SC-2 recipient read (or listened) without help | x of S | ceil(0.6 x S) | |
| Transport failures beside SC-2 (file did not arrive, could not play) | x of S | reported beside SC-2; does not change the SC-2 count (each recipient still counts by their Script C answer, and "could not play" is a No) | |
| SC-3 replied or asked for another | x of S | ceil(0.5 x S) | |
| SC-4 would send another next week | x of S | ceil(0.6 x S) | |
| SC-5 reached someone unintended, or passed on against the parent's wish | count | 0 | |
| SC-6 Arm W recipients who asked to hear the voice | x of n (Arm W senders) | signal only | |

Thresholds for the group sizes this pilot can have:

| N | SC-1 needs | | S | SC-2 and SC-4 need | SC-3 needs |
|---|---|---|---|---|---|
| 8 | 6 | | 1 | 1 | 1 |
| 9 | 7 | | 2 | 2 | 1 |
| 10 | 8 | | 3 | 2 | 2 |
| | | | 4 | 3 | 2 |
| | | | 5 | 3 | 3 |
| | | | 6 | 4 | 3 |
| | | | 7 | 5 | 4 |
| | | | 8 | 5 | 4 |
| | | | 9 | 6 | 5 |
| | | | 10 | 6 | 5 |

"Missed by n" is the threshold minus the count.

**Outcome.** Apply the outcome table in NS-03 section 8 top to bottom, as copied and hashed into the pilot file on the first parent's day 0 (NS-03-R6). Record the order number that decided it and the outcome word: STOP, GO, LIMITED GO, HOLD or NO-GO. Record whether Arm V ran with at least 4 parents.

Every number is written as "x of n", never as a percentage, because n is under 20 (NS-03 section 23).

## 5. Log (Consent file)

By code and date only. One line per event.

| Date | Code | Event | Stop rule |
|---|---|---|---|
| YYYY-MM-DD | P0n | item received, deleted on every device | 3 if not deleted |
| YYYY-MM-DD | P0n | withdrew; notes and contact details deleted | |
| YYYY-MM-DD | P0n | moved to W, no recording on this phone | |
| YYYY-MM-DD | P0n | reached someone unintended | 1 |
| YYYY-MM-DD | P0n | distress reported | 2 |
| YYYY-MM-DD | all | stop rule fired; founder told | n |
| YYYY-MM-DD | all | answers and key deleted (30 days after read-out) | |
| YYYY-MM-DD | all | counts deleted (90 days) | |

The consent file is itself deleted at 12 months, so the note of that deletion goes in the founder's own dated record outside it (NS-03-R4).

## 6. What reaches the repo

Only the read-out (BL-1325): N and S by arm, each line above as x of n, the transport failures, and the outcome with its order number. No quotes, no participant codes next to an answer, no names (NS-03-R3).
