# Answer sheet: the family-hears-it pilot (NS-03)

Status: DRAFT, 24 Nov 2026, `user-research` (Claude role). This is the blank layout. The filled sheet lives only in the founder's private store, never in this repo, a Claude session or a Project doc (NS-03 section 14, NS-03-R8).

Source: NS-03 sections 8, 14 and 23 (`docs/product/prd/03-family-hears-it-pilot.md`).

## 1. Four files and the thread, one per deletion clock

Each kind of record has its own clock, so each sits in its own file and can be deleted on the day without touching the others. Every clock runs from the read-out, the Counts file's included, as `README.md` ("Days and clocks, said once") defines it; the consent texts call it "the day we count everyone's answers".

| File | Holds | Deleted | Rule |
|---|---|---|---|
| Key | Participant code to person | With the answers: 30 days after the read-out, or that parent's row within 2 working days of a withdrawal, or the same day for a participant found to be under 18 | NS-03 section 14 ("Deleted with the raw notes") |
| Consent | The consent record (section 2) and the consent log (section 5a): the withdrawal and under-18 lines and the dated deletion notes, nothing else | 12 months after the read-out | Ruling D4 |
| Answers | Coded answers and short notes, the consent questions (section 3) and the event log (section 5b) | 30 days after the read-out, or within 2 working days of a withdrawal for that parent's row, consent-question lines and event lines, or the same day for a participant found to be under 18 | NS-03-R4, NS-03-R5 |
| Contact details | The pilot messages in the founder's own thread with each parent, from the recruiting note on; no copy elsewhere. The founder's ordinary contact with that person is not part of it | 30 days after the read-out, or with that parent's notes on a withdrawal or an under-18 finding | NS-03 section 14, NS-03-R4 |
| Counts | Numbers only, with no code (section 4) | 90 days after the read-out (ruling D5's "90 days after the round", read as the read-out) | Ruling D5 |

Every deletion of a file, or of one parent's rows, gets a dated note in the Consent file's log (section 5a): what was deleted, by code, and the date. The note never repeats what was deleted. An item a parent sent by mistake is deleted the same day, and that event goes in the Answers file's event log (section 5b).

## 2. Consent record (Consent file)

One row per parent. Nothing else is recorded about consent.

| Code | Arm | Yes or No | Consent text hash | Date (Pacific) | Method |
|---|---|---|---|---|---|
| P01 | W or V | Yes or No | SHA-256 of the rendered text sent | YYYY-MM-DD | Message or call |

Check before each row: the `security-architect` read is dated on or before this date, for either arm, since both can send a picture (erratum E23, `README.md` gate 2). Before each Arm V row, also check that both voice reads are dated on or before this date (NS-03-R2).

## 3. Answers (Answers file)

One row per parent who said Yes. Codes only, except the two free-words columns and the consent questions below, which hold the parent's own words about how sending went with every name taken out. Never the letter's words, what the letter is about, the child's name or the recipient's name (`01-session-script.md` section 9).

| Column | Values | From |
|---|---|---|
| Code | P01 to P10 | |
| Arm | W or V (a V parent with no recording on this phone is moved to W and counted in W; see the event log, section 5b) | Consent |
| Day 0 | YYYY-MM-DD, Pacific: the day the parent got the instruction | Founder |
| Took part | Yes; or No, could not make a screenshot, with the reason coded as phone or app, access, or other or not said, and nothing more. No only on the parent's own word that their phone or app cannot make one; a parent who couldn't work it out, or hasn't got to it, is Yes (and Not yet in A1). A parent who never answers is Yes. A No leaves N and S (section 4) | Founder |
| Form sent | Screenshot, one-letter PDF, or none | Day 3 or day 7 |
| Recording sent | Yes, No (Arm V only: whether the recording went with the letter; blank for W) | Day 3 or day 7 |
| Send date | YYYY-MM-DD, Pacific, or none by the cap. The day the parent gives, in Script A Q1, in reply to "Which day was that?" (asked once, `01-session-script.md` section 5) or with a later "sent". Only if they still give no day, the day their Yes or "sent" reached us. "None by the cap" when no send date came by the cut-off (`README.md`, "Days and clocks, said once") | Parent: Script A Q1, the reply to "Which day was that?", or a later "sent", by the cut-off |
| A1 Sent by day 3 | Sent, Not yet. Coded from the Send date, not from the day an answer arrives: Sent if the send date is on or before day 3 counted from day 0. Send date "none by the cap" is Not yet (no answer counts as not sent). A send on day 4 or later, up to the cap, is Not yet here but still counts in S | Send date |
| A2 Reason if not yet | did not get to it, did not want to, unclear. Every Not yet parent gets one code. Unclear: the words fit neither, Q2 was skipped, or Script A was never answered. Unclear never counts as "did not get to it" | Script A Q2 |
| A3 Questions dropped | The question numbers, or none | Script A Q3 |
| B1 Read | Yes, No, missing | Script B Q1 |
| B1 Replied | Yes, No, missing (missing counts as No for SC-3) | Script B Q1 |
| B1 Asked for another | Yes, No, missing (missing counts as No for SC-3) | Script B Q1 |
| B1 Listened | Yes, No, missing (Arm V only; blank for W) | Script B Q1 |
| B1 Nothing known | Yes, No, missing | Script B Q1 |
| B1 Asked to hear | Yes, No (Arm W only: the recipient asked, unprompted, to hear the voice) | Script B Q1 free text |
| B2 Managed | on their own, needed help, file did not arrive, could not play | Script B Q2 |
| B3 How it felt | Free words, names taken out | Script B Q3 |
| B4 How they'd send it | Free words, names taken out | Script B Q4 |
| B5 Another next week | Yes, No, Not sure, missing (only Yes meets SC-4; missing counts as not met) | Script B Q5 |
| B6 Reached | only them, someone else, not sure; and passed on against their wish: Yes, No, not known | Script B Q6 |
| C Read without help | Yes, No, missing (missing counts as No; a B2 "could not play" makes this No) | Script C, relayed |
| Relayed | Always Yes for C; marks the answer as second-hand | |

**Missing.** For a parent in S, a Script B or C question with no answer by the answer cut-off (the end of the 3rd working day after that parent's Script B and C went, `README.md`) is coded missing, whether it was skipped or Script B was never answered. Missing counts as not met for SC-2, SC-3 and SC-4. An answer that arrives after the cut-off is not counted and is logged in the event log (section 5b).

Practice row, never counted: P00, the fictional Asha family, Arm W, Took part Yes, Form sent Screenshot, Send date day 1, Recording sent blank, A1 Sent, B1 Read Yes and Replied Yes, B2 on their own, B5 Yes, B6 only them and No, C Yes. Use it once to check the sheet's formulas, then delete it before P01's day 0.

**Consent questions (Answers file).** A question a parent asked that the consent text does not answer (`01-session-script.md` section 3, step 2; `02-consent-texts-DRAFT-FOR-COUNSEL.md` section 3). A parent who said No has a line here too, under their code. On the Answers clocks.

| Code | Date | The question, in a few words, with no name |
|---|---|---|
| P0n | YYYY-MM-DD | |

Only the question's wording, with no code or date, goes on to the list for counsel and the next round.

## 4. Counts (Counts file)

Numbers only. These are the only figures that reach the read-out (BL-1325).

| Line | Count | Threshold | Met |
|---|---|---|---|
| N, parents who consented (W, V), as defined below | | | |
| Beside N: could not make a screenshot, so did not take part | count | reported beside N; not in N or S | |
| Beside N: withdrew before the read-out | count | reported beside N; not in N or S, and none of their answers is counted | |
| S, parents in N who sent by the cap, with the send date reported by the cut-off (W, V) | | | |
| Arm V senders who also sent the recording | x of S (V) | reported beside SC-2, so the read-out can say how many V recipients had the voice | |
| SC-1 sent by day 3, counted from day 0 | x of N | ceil(0.75 x N) | |
| SC-2 recipient read (or listened) without help | x of S | ceil(0.6 x S) | |
| Transport failures beside SC-2 (file did not arrive, could not play) | x of S | reported beside SC-2; does not change the SC-2 count (each recipient still counts by their Script C answer, and "could not play" is a No) | |
| SC-3 replied or asked for another | x of S | ceil(0.5 x S) | |
| SC-4 would send another next week | x of S | ceil(0.6 x S) | |
| SC-5 reached someone unintended, or passed on against the parent's wish | count | 0 | |
| SC-6 Arm W recipients who asked to hear the voice | x of n (Arm W senders) | signal only | |
| Main reason for Not yet (A2) | the count of each code among the Not yet parents | the code held by more Not yet parents than either other code; a tie means no main reason. Only "did not get to it" as the main reason meets outcome row 3 | |

**Who is in N and S.**

- N is every parent with a Yes row in the Consent file, less a parent coded Took part No (could not make a screenshot, NS-03 section 6: they do not take part, and are reported beside N), less a parent who withdrew before the read-out (reported beside N as a count only), and less a participant found to be under 18 (stop rule 4, so the read-out records STOP).
- A parent who consented and then never answers stays in N, and counts as not sent for SC-1 and not in S.
- A parent who withdraws before the read-out is counted only as a number: the count of withdrawal lines in the Consent file (section 5a), reported beside N. None of their answers is kept or counted, Took part included, so they are in neither N nor S, and SC-1 to SC-4 are worked out on N and S without them. Nothing is copied from their row before it is deleted. A stop rule that fired before the withdrawal stays in the event log's "all" line, so the outcome is still STOP.
- A parent who withdraws after the read-out has their notes deleted the same way, within 2 working days. The read-out already written holds numbers only, with no code, and is not changed.
- At the read-out, N from the Answers file (rows coded Took part Yes) equals N from the Consent file (Yes rows, less the withdrawal and under-18 lines in section 5a, less the rows coded Took part No in the Answers file). If the two differ, find out why before writing any line.
- S is the parents in N with a send date on or before the cap, reported by the cut-off. A send after the cap, or one reported after the cut-off, is not in S.
- The read-out is written no sooner than the day after the last answer cut-off for Script B and C, and never before the day after the last day-7 note for a parent who did not send has gone (`README.md`, "Days and clocks, said once").

Thresholds. The formulas in the table above govern; this lists them for every N and S from 1 to 10, since a parent who cannot make a screenshot or who withdraws can take N below 8:

| n | SC-1 needs (n = N) | SC-2 and SC-4 need (n = S) | SC-3 needs (n = S) |
|---|---|---|---|
| 1 | 1 | 1 | 1 |
| 2 | 2 | 2 | 1 |
| 3 | 3 | 2 | 2 |
| 4 | 3 | 3 | 2 |
| 5 | 4 | 3 | 3 |
| 6 | 5 | 4 | 3 |
| 7 | 6 | 5 | 4 |
| 8 | 6 | 5 | 4 |
| 9 | 7 | 6 | 5 |
| 10 | 8 | 6 | 5 |

"Missed by n" is the threshold minus the count.

**Outcome.** Apply the outcome table in NS-03 section 8 top to bottom, as copied and hashed into the pilot file on the first parent's day 0 (NS-03-R6). Record the order number that decided it and the outcome word: STOP, GO, LIMITED GO, HOLD or NO-GO. Record whether Arm V ran with at least 4 parents.

Every number is written as "x of n", never as a percentage, because n is under 20 (NS-03 section 23).

## 5. Logs

By code and date only. One line per event. Two logs, so that nothing outlives the clock the consent texts state for it.

### 5a. Consent log (Consent file, 12 months after the read-out)

Only the lines that show a withdrawal or an under-18 finding, and the dated deletion notes. The consent texts promise "a short record that you agreed, and that you stopped if you did"; nothing else goes here.

| Date | Code | Event | Stop rule |
|---|---|---|---|
| YYYY-MM-DD | P0n | withdrew; notes, consent-question lines, event lines, key row and contact details deleted | |
| YYYY-MM-DD | P0n | under 18; notes, consent-question lines, event lines, key row and contact details deleted | 4 |
| YYYY-MM-DD | all | answers, key and contact details deleted (30 days after the read-out) | |
| YYYY-MM-DD | all | counts deleted (90 days after the read-out) | |

The consent file is itself deleted at 12 months, so the note of that deletion goes in the founder's own dated record outside it (NS-03-R4).

### 5b. Event log (Answers file, on the Answers clocks)

Deleted with the Answers file 30 days after the read-out; a parent's lines within 2 working days of their withdrawal, or the same day for a participant found to be under 18.

| Date | Code | Event | Stop rule |
|---|---|---|---|
| YYYY-MM-DD | P0n | item received, deleted on every device the same day | 3 if not deleted |
| YYYY-MM-DD | P0n | sent after the cap; not counted in S | |
| YYYY-MM-DD | P0n | send reported after the cut-off; not counted in S | |
| YYYY-MM-DD | P0n | Script B or C answer after the answer cut-off; not counted, coded missing | |
| YYYY-MM-DD | P0n | moved to W, no recording on this phone | |
| YYYY-MM-DD | P0n | reached someone unintended | 1 |
| YYYY-MM-DD | P0n | distress reported | 2 |
| YYYY-MM-DD | all | stop rule fired; founder told | n |

## 6. What reaches the repo

Only the read-out (BL-1325): N and S by arm, the counts beside N (could not make a screenshot; withdrew before the read-out), each line above as x of n, the transport failures, the main reason for Not yet, and the outcome with its order number. No quotes, no participant codes next to an answer, no names (NS-03-R3).
