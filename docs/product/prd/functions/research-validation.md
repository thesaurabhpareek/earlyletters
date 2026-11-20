# Function review: user research and validation plan (RSH)

Owner: `user-research` (second-wave function review; the first nine are done). Written 20 Nov 2026 (UTC) to `docs/product/prd/functions/BRIEF.md` on branch `docs/locked-pack-inputs-20nov`. Docs only: nothing here is built, no recruiting has started, no spend is committed, no decision is recorded. Karma rules every proposal through `GAP-LOG.md`.

I am a Claude role, not a licensed researcher, lawyer, clinician or tax adviser. I do not talk to participants: the founder or a human researcher runs sessions from a guide I prepare, and I plan and synthesise. Every legal reading says "counsel must confirm". Every number is read from a named source, computed with the arithmetic shown, or marked PROPOSED. Nothing here is observed data: no parent has been studied by this team yet (frame line 16; `docs/research/USER_RESEARCH.md` line 3: "desk research ... No primary interviews yet").

Example family: the fictional Asha (and Kiran for two books). No real family detail appears anywhere in this file.

---

## 1. What I reviewed, and what I did not

### Read this session (branch `docs/locked-pack-inputs-20nov`, working tree, 20 Nov 2026)

| Source | What I read |
|---|---|
| `docs/product/prd/functions/BRIEF.md` | In full (30 lines). `/home/claude/review/gap-agents-common.md` in full |
| `docs/product/prd/README.md` | In full. Lines 147 to 158 are the existing "Studies and the spike: owner, trigger, default" table; lines 63 to 85 the founder asks and the reads that gate anything |
| `00-product-frame.md` | In full (sections 1 to 10). Lines 16, 32 to 53 (confidence, North Star, hand-sent measures), 69 to 75 (standing states), 81 to 96 (legal and privacy inputs) matter most here |
| `14-test-plan.md` | In full. Line 7 (G0), line 13 (P0 blocks any build to anyone outside the founder's family), line 90 (device evidence, Asha only), line 96 (gates G0 to G6), lines 104 to 135 (P0 register) |
| `03-family-hears-it-pilot.md` (NS-03) | In full (342 lines): arms, scripts, success and stop lines, consent text, retention clocks |
| `18-errata-after-lock.md`, `GAP-LOG.md` | Both in full. GAP-LOG ids used below: A, B, C, D, E rows and the Karma rulings at the end |
| `19-from-download-to-first-letter.md` | Lines 1 to 120 only (path table and NS-38 through its acceptance rows). NS-39 to NS-45 not read by me; the data review says NS-42 to NS-45 had no text when it read |
| `functions/data-and-measurement.md` | In full (285 lines). I build on it and do not repeat it: sections 3.2 (what 5, 10, 20 can tell), 3.3 (FR-DAT-01 to 35), 3.4 (decision rules) |
| `functions/support.md` | Lines 1 to 169 (coverage table, FR-SUP and FR-POL rows, door lines, design needs) |
| `functions/privacy.md` | Lines 1 to 90 (sources, coverage table). I did not read its requirement rows, so I cite no FR-PRV id |
| `docs/research/USER_RESEARCH.md` | Lines 1 to 60 only: top findings, behaviour, segments, onboarding |
| e2e design (worktree `/home/claude/wt/E`, branch `docs/e2e-ux-20nov`) | `E-foundations-and-system-states/DESIGN.md` lines 1 to 150 (journeys J-E01 to J-E16); `A-capture/DESIGN.md` lines 1 to 100 (A-S01 to A-S15, A-J01 to A-J11); `B-book-and-reading/DESIGN.md` lines 1 to 50 (B-S01 to B-S16); `C-keeping-and-trust/DESIGN.md` lines 1 to 45 (C-S01 to C-S18) |

### Not read

- Area D's DESIGN.md (the path I tried did not exist; no directory listing tool was available to me). D screen ids below (D-S02, D-S04, D-S11, D-S15, D-S20, D-S21, D-S23) come only from GAP-LOG and `data-and-measurement.md`, so treat them as second-hand.
- Every `WORDS.md`, `MOTION.md`, `PROTOTYPE.html`, and the design system files.
- Cards 01, 02, 04 to 13 and 21 to 37 in full. Where I name a card's study line, I cite `data-and-measurement.md` section 3.4 (which read them) or the README table, not the card. I did not read NS-05 section 20, NS-06 A20 and B20, NS-13 section 21 or NS-25 myself.
- `16-council-review-round-2.md` (rulings D1 to D13, T1 to T5 cited second-hand), `13-engineering-plan.md`, `docs/BACKLOG.md`, `COUNSEL_PACKET.md`, `COORDINATION.md` section 10, `VOICE.md`, `.claude/skills/user-research/`.
- Whether `docs/research/studies/**` or `docs/research/QUESTION-BANK.md` exist: I did not look beyond `USER_RESEARCH.md`. The data review says the question bank does not exist (FR-DAT-06 evidence column).
- No tool to run commands was available, so I could not list folders, read other branches, or run any test. Nothing was run on a phone.

### Outside sources

None read this session. Anything about incentives, tax, research ethics, recording consent, or Apple rules below is UNVERIFIED, and where a legal or tax point arises it says "counsel must confirm" or "needs a number from legal".

---

## 2. Coverage check: what the repo already says about research and validation

| What exists | Where | What it does not do |
|---|---|---|
| Confidence statement: "We have no evidence from our own families yet. Every Value score is a judgment, and confidence on parent behaviour is low. The cheapest way to raise it comes first" | frame line 16 | Names no study, sample, or order |
| Hand-sent measures (testers type numbers into their own message; founder keeps a private sheet, deletes after 90 days; reported "x of n", never a percentage under 20; at most 5 questions per round) | frame lines 36 to 53 | Says nothing about interviews, observation, prototypes or diaries |
| Five-parent studies for photos, Find, share, and one combined Firsts and sealed study; the pilot; the spike | README lines 151 to 158 | No first-run study, no diary, no other-parent study, no reminder-tolerance study, no printed-book study, no prototype usability, no recruiting plan |
| The pilot with consent, scripts, outcomes fixed before day 0, retention clocks | NS-03 (whole file) | Covers one idea (family hears it) and one group (8 to 10 warm parents) |
| What 5, 10 and 20 can and cannot tell; decision rules per measure; reporting rules | data-and-measurement 3.2, 3.4, FR-DAT-08, 10, 11, 29 | Rules on how to read data, not how to run or recruit a study |
| First run "never measured in the field in 1.0"; time to first kept letter read only in a five-parent study with a stopwatch, seconds only | FR-DAT-33 | The README table has no such study, so nobody owns it |
| Device evidence on the fictional Asha install only | 14-test-plan line 90 | Applies to device rows; says nothing for sessions with real parents |
| P0 blocks any build outside the founder's family; G0 to G6 | 14-test-plan lines 13, 7, 96 | Does not say where a study of a flagged feature may run before G0 (see finding F1) |
| Desk research: competitors, Reddit, store reviews, segments | `USER_RESEARCH.md` | Dated 1 Oct, labelled assumption-heavy, and its top finding 5 (lifetime price, 6-month trial, line 16) is superseded by the frame (gifts and lifetime refused, frame line 179; Plus is one gate after 2 letters, frame line 18) |

### What is missing for a launch-ready, customer-first product

1. No map from P0 promises to evidence. 296 P0 rows (14-test-plan line 102) are tested for correctness; very few are tested for being the right thing for a tired parent.
2. No plan for strangers. Every measure comes from "15 to 25 friendly families who know the founder" (data-and-measurement closing line). First run, the store page and the Keep gate are met first by strangers.
3. No first-run study, no week-of-use study, no other-parent join study, no reminder-tolerance study, no printed-book willingness study.
4. No recruiting, consent, incentive or wellbeing rules for studies other than the pilot.
5. No rule about relatives as participants (NS-03 section 7 keeps recipients out of notes entirely; NS-25 and the sealed letter need adults other than the author).
6. No calendar tied to gates G0 to G6, and an unresolved sequence question (F1 below).
7. No list of design decisions that wait on evidence versus those that proceed on a default.
8. No exclusion rule for studies against the constitution (a study of machine edits would be testing a feature that touches a person's words).
9. Two retention clocks already conflict (NS-03: notes 30 days, consent 12 months; frame: hand-sent sheet 90 days) with nothing for a study that is neither.
10. `USER_RESEARCH.md` carries no evidenced / assumed / contradicted marking per belief (standing duty 1).

### Findings that need a ruling (details in sections 3 to 7)

- F1: sequence conflict. G0 forbids any NS flag on "in any build outside the founder's family" (14-test-plan line 7), yet the README table triggers five-parent studies when the feature "is in TestFlight" (README lines 153 to 156). Parents who are not the founder's family cannot hold the flagged build before G0. Proposed resolution: moderated sessions on a founder-owned test phone with the Asha-only install (FR-RSH-03).
- F2: no first-run study is owned although first run is where every stranger starts (FR-RSH-04).
- F3: the most dangerous untested comprehension is that a recording lives on one phone while backup is off (RA-14, FR-RSH-10).
- F4: bias. Everything planned reaches friends first. Without some strangers, 1.0 numbers will lean warm (FR-RSH-18).
- F5: the Review screen shows machine-marked small fixes. A usability study of that part would test a feature that edits a person's words, which my charter forbids. Excluded (FR-RSH-16); needs Karma's ruling that this is the right reading.

---

## 3. P0 assumptions that no evidence from parents supports yet

Source for "untested": frame line 16 and `USER_RESEARCH.md` line 3. "P0 rows touched" are named only where I know what the row says from a file I read; otherwise I name the card's P0 set in the register (14-test-plan lines 106 to 135) and say the exact row mapping is for `product` to confirm. Evidence status is "assumed" for every row below until a study ends (standing duty 1).

| Id | Assumption (what we believe about parents) | P0 and where it bites | Evidence today | Cheapest study that would settle it | Decision it changes |
|---|---|---|---|---|---|
| RA-01 | A tired parent, one hand free, starts a letter in one tap from Home and gets to Keep unaided | Core loop (c): NS-35 (R1, R3, R4, R7), J-N20 | Device speed targets only; none measured (14-test-plan line 141) | S1 task set A on A-J01 and A-J02 | Home layout, A-S01 capture cluster |
| RA-02 | Starting from a photo is the third, quietest start and does not feel like a second start | NS-01 P0 set; NS-01 section 21 line (data 3.4) | None | Five-parent photo study (README line 153) as S-B1 | A-S01 and B-S04 change, rerun once |
| RA-03 | A parent finds a known letter with Find in 20 seconds, and the no-match line is not read as a reproach | NS-02 P0 set (NS-02-R4, R5, R14 and others) | None; may have no tester with 40 letters (data 3.2 and card gap) | S-B2 with a labelled fixture book (FR-DAT-30) | B-S06 no-match line |
| RA-04 | A parent who shares one letter understands that the recording does not go | NS-05-R16a, R16b (register line 110), the comprehension line outranks speed (data 3.4) | None | S-B3 five-parent share study | D-S02 wording before any send-speed work |
| RA-05 | A grandparent can read or hear a letter without help and asks for more | NS-03 SC-2, SC-3 (pilot lines 147 to 149) | HYPOTHESIS only (NS-03 section 2) | The pilot as written; do not re-plan | Whether any hosted listening is drafted |
| RA-06 | A stranger who downloads from the store completes age, agreement, Welcome, sign-in, first book and first kept letter in about 90 seconds and without feeling tricked by the account or the two free letters | NS-38 to NS-44 P0 rows (card 19; NS-38-R2, R5, R7 are about the listing and review notes); frame guardrail "zero paywalls before a parent has seen their words" | The 90 s is an assumption on record (FR-DAT-33); order "age before Welcome" is as built (card 19 line 42) | S2 first-run test, 5 parents, at least 3 strangers | E-S03, E-S02, E-S07, E-S08 order and words; whether to ask for an account later |
| RA-07 | The neutral lock-screen lines, evening timing, and the quiet back-off after a week of silence are tolerable and never read as guilt | J-N4 P0 (guilt line), J-N22, J-N24; NS-13 P0 set (register line 118); NS-32 | None; the 12% and 10% targets are "not measurable in 1.0" (FR-DAT-32) | S6 reading test plus two-week field question | NS-13 back-off schedule and evening words (data 3.4) |
| RA-08 | At the third letter, a parent who sees the Keep sheet understands their words are held and safe, and does not feel a paywall before seeing their words | Frame guardrail; E-S10, E-S12, E-S26; the 5% paid-start line is an assumption on record (frame line 44) | None | S9 trust comprehension on E-S10 (paper or prototype) | E-S10 body, "Keep it here for now" label |
| RA-09 | A parent with one phone understands that recordings live on that phone only while backup is off | NS-08-R6, R7 (register line 113); D1 sign-out sheet; J-N21 (P0) | None | S9, one comprehension question on C-S03 and C-S08 | C-S03 and C-S08 wording; whether "Save a copy" gets more prominence |
| RA-10 | Parents hear "hidden until a day" as a letter for the child later, not as a way to hide from the other parent | NS-06-B20 (register line 111; data FR-DAT-12 makes it a stop line) | None | S5 combined Firsts and sealed session | Park or build seals (BL-969) |
| RA-11 | Parents would mark a first unasked, and do not want a list of suggested firsts | NS-06 A20 (data 3.4: under 3 of 5 or 2 name a list parks Firsts) | None | S5 | Park or build Firsts (BL-968) |
| RA-12 | A second adult who gets an invite joins, understands what they are agreeing to, and can undo it | NS-25 P0 set (register line 129); GAP D G-D16 (FOUNDER: agreement step); Q48, Q49 | None | S4 other-parent join test, 3 pairs | Whether NS-25 ships, and the shape of its agreement step |
| RA-13 | "Saved" after Save a copy means what the parent thinks, and a birthday-week slip is a kindness, not a nag | NS-11-R5, R8, R10, R12, R23 (register line 116); GAP C G4 | None | S1 task set C on C-S04 and C-S06 | C-S04 words; slip window |
| RA-14 | Parents who speak another language at home accept "This was in another language" and typing the words themselves | NS-17-R5, R7, R8 (GAP X NS17); J-N16, J-N23 (P0) | Desk research only: Hinglish risk (`USER_RESEARCH.md` line 49) | S11, 5 parents (pooled, FR-DAT-23) | A-S10 states |
| RA-15 | VoiceOver and Switch Control parents can start, stop, review and keep with no sighted help | NS-33 P0 set; NS-33-R6; J-N20 | Device walks only; no user | S10 with VoiceOver users of their own | A-S05 announcement timing, E-S23 rows |
| RA-16 | A printed or printable keepsake is something parents would actually make | NS-07 C28 P0 set is correctness; NS-30 is parked | Desk research only | S7 | Whether to unpark NS-30; the proof-book spend (default: none, README line 74) |
| RA-17 | Two-book families (twins, siblings) can tell books apart on Home | NS-14-R3, R4, R8, R11 (register line 119; wrong book is P0) | D-045 plans one twins family; one family cannot carry "x of n" (data coverage table) | Fold into S1 task set A with fixtures; do not generalise | A-S02 labels |
| RA-18 | Weekly making is a habit these parents can sustain with one prompt and two minutes | North Star candidate (frame line 32); `USER_RESEARCH.md` 1.2 (drop-off at weeks 2 to 8 and at leave end is an assumption, line 31) | None | S3 diary week | Reminder timing, prompt choice, whether Quiet day matters |

Three riskiest assumptions for the next release, with the cheapest study each (standing duty 2; for `product`, as backlog proposals in section 8). "Next release" here means the first store build after Build 13; the roadmap owns timing and I did not read it.

1. RA-06, first run with strangers. Every downloader meets it, the order (age, then agreement, then account) is as built and never watched, and NS-38 to NS-44 have P0 rows with no evidence. Cheapest: S2, 5 parents, one hour each, stopwatch seconds only.
2. RA-09, recordings live on one phone. It is the one belief whose failure loses a voice for good (frame section 8: "No recording backup yet"). Cheapest: one comprehension question on paper inside S2 (15 minutes added).
3. RA-07, reminders and silence. Habit is the North Star and the guilt line is P0. Cheapest: S6 reading test with printed mock-ups (no build needed), then the existing NS-13 yes or no question.

RA-08 (the Keep gate) is a close fourth and rides in the same S2 and S9 sessions at no extra cost.

---

## 4. The smallest studies

Rules that apply to every study (each is a requirement in section 6): a decision first; a plan PR to `product` before any recruiting; success, hold and stop lines written before the first session and not moved (NS-03 section 8 shape; FR-DAT-10); counsel's read of consent and scripts before any contact (NS-03 section 0; Q44); participants are adult parents only; the Asha fixtures only; no real letters, names or voices in the room; notes by participant code only; results as "x of n".

Effort figures are estimates [E], not measured: about 1 hour per session including notes, 3 hours to prepare, 3 hours to synthesise.

| Id | Study | Decision it changes | n and who | Method and length | Materials | Pass, hold, stop (PROPOSED; founder fixes before day 0) | Runs when | What it cannot tell |
|---|---|---|---|---|---|---|---|---|
| S1 | Usability on the e2e prototypes (`PROTOTYPE.html` in each area folder) | Design of A, B, C, D, E screens before build | 5 per task set, one rerun after fixes, so at most 10 sessions per set | Moderated, 30 to 45 min, think-aloud, task cards. Task sets: A (A-J01, A-J02, A-J03), B (B-S06 Find, B-S08 letter page), C (C-S04 Save a copy, C-S03 sign-out), D (D-S02 share preview, D-S04 reminder ask) | Prototype in "participant mode" (state switcher hidden); Asha book | A task set passes when 4 of 5 finish unaided; any one report of a lost or changed word, or a guilt or count line, is a stop for that screen | Now (no build needed) | Real habit, real data, speed. A prototype is not the product |
| S2 | First-run test | RA-06, RA-08: E-S01 to E-S08, A-S01 first, E-S10 | 5 parents, at least 3 not known to the founder | Moderated, 45 to 60 min. Fresh install on a founder-owned phone with the Asha-only test account (D13); stopwatch from first launch to the first kept letter, seconds only; then 4 comprehension questions (why an account; what "the first two are free" means; where the recording lives; what Keep it here for now does) | Founder-owned phone and a test sign-in. The age question is asked as part of the flow but the answer is never recorded (FR-DAT-33) | Median and range of seconds reported, never a rate; the 90 s assumption is "met" only if 4 of 5 finish at or under 90 s; hold if 2 or more describe the account or the gate as a trick; stop if 1 or more believes a letter was lost | When the first-run build exists on the test phone (after BL-922 and card 19's rows are built, and card 19 is locked). Before that: prototype E | Whether strangers on their own phones, with their own children asleep next to them, behave the same |
| S3 | Diary week | RA-18, RA-07 field half, RA-13 | 8 to 10 parents, adults; can overlap the C1 families and the pilot parents but never in the same week as the pilot | One week on their own phone and own data, so only after G0 and P0 tests for the flags on (see section 7). Outside the app: the founder sends 3 fixed questions by message each evening (made a letter today: yes or no; kept it: yes or no; what got in the way: a fixed list: baby, tired, forgot, nothing to say, a problem with the app, other). Optional every day. A 20 min call on day 8 | Question bank rows (FR-DAT-06); the app composes and sends nothing (FR-DAT-02) | Report "x of n" per day and for the week. No target. A missed day is never followed up and never counted against the parent. Stop if 1 or more says a message felt like pressure | After G4 for the flags the build has on | Why. Diaries tell what happened, not why; the day 8 call carries the why. A warm, self-selected group |
| S4 | Other-parent join test | RA-12: NS-25, GAP D G-D16 | 3 pairs of adults who parent the same child together (6 adults). Each consents separately; a partner who declines does not cost the other their thank-you | Moderated, 45 min each, on the prototype (D-S15 invite, D-S20 undo) with a fictional Asha book and test accounts; no real letters shared. Never a store-build surface, so no "coming soon" (frame line 67) | Prototype D; two test phones | Pass: 2 of 3 pairs complete the join and each partner can say what they agreed to; stop: a partner reports they felt pushed to join. Note: this tests understanding, and records no agreement | Concept stage now; the agreement step only after counsel reads Q48 and Q49 (NS-25 waits on them, frame line 90) | Real family dynamics. We do not ask about disputes, custody or relationship health |
| S5 | Sealed letter and Firsts combined | RA-10, RA-11: BL-968, BL-969 | 5 parents (README line 156: one combined session) | Moderated, 45 min; two concept walks on B-S12, B-S13, B-S14, B-S16 | Prototype B | NS-06 A20 and B20 lines as the data review recorded them (data 3.4); any parent who describes sealing as hiding from the other parent stops the study and goes to the founder (FR-DAT-12) | After Share Level 1 ships (README line 156), concept walk earlier on prototype allowed; counsel read on minors and "open on a day" first (README line 84) | Whether anyone will use it for years. We cannot wait 18 years |
| S6 | Reminder tolerance | RA-07: NS-13, NS-32; D-S04, D-S11 | Reading test: 5 parents. Field: the existing NS-13 question to C1 testers | Reading test: 15 min. Show five printed or on-screen mock notifications from the neutral set (GAP D G-D19) and ask three fixed questions: what do you think this is; would you open it; would you want fewer or none. Field: the NS-13 "too much" and "still on after 2 weeks" yes or no questions (frame line 47) | Mock-ups with Asha only; no child name; no count, no days | 1 or more "too much" yes triggers review of the back-off and evening words, not the budget (data 3.4); any "this made me feel I was failing" is a stop for that line | Reading test now; field after G4 | Real tolerance over weeks. A reading test shows reaction to words only |
| S7 | Printed-book willingness | RA-16: whether to unpark NS-30, the proof-book spend | 5 parents plus, only through them, no direct contact with relatives (FR-RSH-19) | 30 min interview. Show the printable book of the Asha fixture on screen (C-S05) and ask about what they have actually done: have they made or bought a photo book or printed anything for the child; when; what stopped them finishing. No price shown or asked (FR-DAT-20; NS-03 section 22). Ask what they would do with the file we make | Asha fixture PDF; the printable file (C28) in whatever state exists | Report "x of n have made a printed keepsake before" and "x of n said they would send this file to a printer or a relative". Stated intent overstates behaviour; past behaviour is the signal. A proof-book spend stays "no spend" (README line 74) unless the founder rules otherwise | Now (no build) | Willingness to pay. This study does not measure price |
| S9 | Trust comprehension | RA-08, RA-09, RA-04 | 5 parents; may share the S2 sessions | Paper or prototype, 15 min, one question per screen, read aloud: "In your words, what happens if you lose this phone?" (C-S03, C-S08); "what happens to your words and the recording if you tap Keep it here for now" (E-S10); "what is sent when you tap Share" (D-S02) | Screens as drawn | A trust line passes when 4 of 5 answer in a way that matches the true behaviour; any answer that implies a recording survives a lost phone while backup is off is a stop for that line and goes to `content` and the CCO role | Now (prototype) | Behaviour. Comprehension is not the same as action |
| S10 | Assistive-technology session | RA-15 | 3 to 5 parents who use VoiceOver, Switch Control or Voice Control themselves | Moderated, 45 min, own phone or the test phone; task: start, stop, review, undo, keep (J-N20) | Test phone, Asha | Any "no" is a P0 bug on the matching device-walk row (data 3.4, NS-33 row). Report pooled unless 5 or more (FR-DAT-24) | After the device walk on a candidate exists (E-S23) | Everyone with a disability. n is small |
| S11 | Another-language session | RA-14 | 5 parents who speak another language at home | 30 min; walk A-S10 with a Spanish or Hindi fixture take (Asha) | Prototype A, fixtures | Pooled across languages unless 5 or more in one (FR-DAT-23); the native reviewer's corpus result is a separate check, not research | After A-S10 exists in a prototype | Transcription quality; that is the native reviewer's job |
| S-B1 to S-B3 | The three build studies already in the README (photos, Find, share) | RA-02, RA-03, RA-04 | 5 parents each | As in the README (lines 151 to 155) and the data review (3.4), run in moderated sessions on a founder-owned test phone (F1) | Build with the flag on, Asha install | As in the cards. Pass-chance table attached to each read-out (FR-DAT-11) | When the flag is on in a build the founder holds | As in `data-and-measurement.md` 3.2 |
| S8 | The pilot (NS-03) | RA-05 | 8 to 10 | As written in NS-03. I add nothing | NS-03 | NS-03 section 8 | As written | As NS-03 section 21 |

Cost of the lot, if run in the order of section 7: S1, S2, S9, S6 reading test, S7 are about 5 sessions each, so about 25 sessions at 1 hour plus preparation and read-out, about 40 founder or researcher hours [E]. That is the whole point: no build, no spend, and the first three answer the three riskiest assumptions.

---

## 5. What to measure with 5, 10 and 20 (applies `data-and-measurement.md` 3.2; the numbers there are not repeated, the extras below are mine)

The probability that a study sees a problem at least once is 1 minus (1 minus p) to the power n. Computed here (arithmetic: for p = 0.10 and n = 5, 0.9^5 = 0.590, so 1 - 0.590 = 41%). The misses at 5% to 20% agree with data 3.2.

| A problem that hits this share of parents | Seen at least once in 5 | In 10 | In 20 |
|---|---|---|---|
| 5% | 23% | 40% | 64% |
| 10% | 41% | 65% | 88% |
| 20% | 67% | 89% | 99% |
| 30% | 83% | 97% | about 100% (99.9%) |

| Sample | What it is for | What to measure | What to report | What never to claim |
|---|---|---|---|---|
| 5 | Find problems that hit about 1 in 3 or more parents; check a comprehension line | Per task: finished unaided, finished with a prompt, did not finish (counts). Seconds (range, not average). Per comprehension question: matched the true behaviour or not. Every breakdown point observed, with the screen id. Any stop-rule event | "x of 5". A list of problems with the screen id and how many of 5 hit it. The pass-chance table (data 3.2) beside any pass line | A rate, a percentage, an adoption or satisfaction number (FR-DAT-11). "0 of 5" never means absent: a problem hitting 10% shows 0 of 5 about 59% of the time |
| 10 | Find problems that hit about 1 in 5; read a diary week; pilot-sized groups | Everything at 5, plus: per day counts for the diary (made, kept, what got in the way as codes); one split only (for example first-time letter makers against not), with each side shown as x of n and never compared | "x of 10", still no percentage (frame rule: under 20). The share of the group who named each fixed reason | A difference between two groups of 5. A subgroup of 1 to 4 is never reported alone (FR-DAT-08) |
| 20 | First size at which the frame allows percentages (frame line 38); check that a common problem is not there | Everything at 10, plus: percentages with the interval beside them (data 3.2: 10 of 20 spans 27 to 73%); "0 of 20" can be written "not seen in 20", consistent with up to 17% | A rate with its interval, labelled with the biases of the group (FR-DAT-29) | A variant against a variant. Data 3.2 shows 50% against 70% needs about 93 per arm. There are no A/B tests in the 1.0 line |

Practical rules that follow:
- Five twice beats ten once. Run 5, fix, run 5 more (the existing "rerun once" rule, data 3.4). A third round on the same decision needs the founder.
- Count what is observed (finished, stopped, said), not what is felt. Feelings are noted as words in the private notes and never as scores.
- The hand-sent rounds (frame lines 36 to 53) stay at 5 questions or fewer. The diary and the studies carry their own scripts and consent, as NS-03 does (data change C-09).
- Pool or suppress any cell that could name a family the founder knows (twins, the one VoiceOver user) (FR-DAT-08).

---

## 6. Function requirements

Priority: P0 with RR-4 reason (a) a promise, (b) a legal or store duty, (c) the core loop; else P1 or P2. Links: card rows, e2e screen ids, backlog rows. Backlog rows named are existing ones I read cited by other files; BL-981 is the five-parent study row; "new row needed" otherwise. No id above BL-999 is used.

### 6.1 Study discipline

| Id | Requirement (Given, When, Then where testable) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-RSH-01 | Given a proposed study, When it is planned, Then its `PLAN.md` opens with the decision it will change, the card rows or screen ids it touches, the default if no study is run, and the lines for pass, hold and stop; a study with no decision is not run | All cards; every e2e screen named in section 4; BL-981 (scope gains this rule) | P1 | `user-research`, `product` | Charter ("start every study with the decision"); FR-DAT-10, FR-DAT-22 |
| FR-RSH-02 | Given a plan, When it is ready, Then it goes in a PR for `product` review before any recruiting, consent, incentive or paid tool; recruiting, incentives and any paid tool are founder decisions; the lines are hashed at day 0 and unchanged at read-out (NS-03-R6 pattern) | NS-03-R6; BL-981; new row needed (a `docs/research/studies/<id>/` template with PLAN, GUIDE, FINDINGS) | P1 | `user-research`, founder | Charter; NS-03 section 10 |
| FR-RSH-03 | Given a study of a feature whose flag is off outside the founder's family, When sessions run before G0 is met, Then they are moderated, on a founder-owned phone with the Asha-only install and a test account, the parent never installs or signs in, and no real letter, picture, voice or name is created; after G0 and the card's P0 tests are green, the same study may run on a TestFlight build the parent holds | 14-test-plan lines 7, 13, 90; README lines 151 to 156; S-B1 to S-B3; new row needed (`qa`, a founder-family flag profile for moderated sessions) | P0 (a): no real family data (CLAUDE.md privacy rules); resolves F1 | `qa`, `user-research`, founder | 14-test-plan line 90 (D13); G0 (line 7). Whether the founder-family profile already exists: UNVERIFIED |
| FR-RSH-04 | Given first run is where every stranger starts, When the first-run build exists on the test phone, Then a first-run test (S2) runs with 5 parents, at least 3 not known to the founder, measuring seconds from first launch to first kept letter and four comprehension questions; the age answer and the agreement text are never recorded; the result feeds NS-38 to NS-44 and is added to the README table | NS-38 to NS-44 (card 19); NS-39; E-S01, E-S02, E-S03, E-S07, E-S08, A-S01.first, E-S10; BL-994; BL-981 gains S2 | P1 (P0 (c) core loop for the decision it informs) | `user-research`, founder | FR-DAT-33; card 19 lines 24 to 42. Cards NS-39 to NS-45 not read by me |
| FR-RSH-05 | Given the diary week (S3), When it runs, Then every question is sent by the founder in his own message, each is optional, none asks for letter words, a child's name, age, date or health detail, a missed day is never followed up or counted, and the day 8 call is by choice; the app composes and sends nothing | NS-13, NS-32, NS-18; D-S04, D-S11; A-S01; new row needed (question bank rows for the diary, with FR-DAT-06) | P1 | `user-research`, founder | FR-DAT-02, FR-DAT-04, FR-DAT-25; frame "celebrate what exists, never count gaps" (CLAUDE.md) |
| FR-RSH-06 | Given the other-parent join test (S4), When it runs, Then it uses the prototype and test accounts only; each adult consents separately, sees nothing of the other's answers, and may stop alone; nothing records an agreement; no question touches disputes, custody, safety, or the relationship; if a participant raises distress, FR-RSH-21 applies; and the agreement-step design waits for counsel (Q48, Q49) before any build | NS-25 (R1 to R19 P0 set); D-S15, D-S20; GAP D G-D16 (FOUNDER); FR-POL-04, FR-POL-05; BL-983 | P0 (b): another adult's data (Q48) | `user-research`, counsel | Frame line 90; support.md FR-POL-04, 05 |
| FR-RSH-07 | Given the sealed letter and Firsts study (S5), When a parent describes sealing as a way to hide a letter from the other parent, Then the study stops and the founder decides before BL-969; and the concept walk shows the honest limit "hidden, not locked" exactly as drawn; counsel reads "open on a day" and minors first | NS-06 A and B; B-S12, B-S13, B-S14, B-S16; BL-968, BL-969, BL-970, BL-981 | P1 | `user-research`, founder, counsel | FR-DAT-12; README line 84 |
| FR-RSH-08 | Given the reminder study (S6), When it runs, Then mock notifications carry no child name, no count, no days since, no streak wording and only the neutral bodies the cards allow, and a "this made me feel I was failing" answer to any line is a stop for that line | NS-13, NS-32; D-S04, D-S11; J-N4, J-N24 (P0); BL-943 | P1 (P0 (a) for the guilt-line stop) | `user-research`, `content` | GAP D G-D19; J-N4 |
| FR-RSH-09 | Given the printed-book study (S7), When it runs, Then it asks about past behaviour, shows no price and tests no price, makes no promise of a printed product, and the read-out says stated intent is weak evidence; any proof-book spend stays a founder decision with default "no spend" | NS-07 C28; NS-30 (parked); C-S05; BL-973 | P2 | `user-research`, founder | README line 74; FR-DAT-20; NS-03 section 22 |
| FR-RSH-10 | Given trust lines (recording on one phone, Keep gate, Share), When they are tested (S9), Then each is read aloud and answered in the parent's own words, and a line passes only when 4 of 5 match the true behaviour; any answer implying a recording survives a lost phone while backup is off goes to `content` and the CCO role the same day | NS-08-R6, R7; NS-05-R16a, R16b; C-S03, C-S08, E-S10, D-S02; BL-961, BL-939 | P0 (a): frame section 7 ("no public surface may imply a recording survives a lost phone") | `user-research`, `content` | Frame line 87; register lines 110, 113 |
| FR-RSH-11 | Given the build studies in the README, When one runs, Then it follows its card's lines, uses the pass-chance table, and a fixture stand-in is labelled "stand-in" and never counted as a tester (FR-DAT-30) | NS-01, NS-02, NS-05; B-S04, B-S06, D-S02; BL-931, BL-952, BL-939, BL-981 | P1 | `user-research`, `qa` | README lines 151 to 155; FR-DAT-30 |
| FR-RSH-12 | Given an assistive-technology or language study (S10, S11), When it is read out, Then the repo pools answers unless 5 or more share a group and names no technology or language per person | NS-33, NS-17; A-S05, A-S10, E-S23; BL-948, BL-984 | P1 | `user-research`, `privacy` | FR-DAT-23, FR-DAT-24 |

### 6.2 People, consent and privacy

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-RSH-13 | Given any study, When a person is screened, Then only adults take part, by a single yes or no ("are you 18 or over") with no birth date kept; anyone under 18 is never recruited, interviewed, observed or recorded; a participant found to be under 18 ends the session and the notes are deleted the same day | NS-03 section 1 and stop rule 4; NS-40 (age as a boolean, D-026 per card 19 line 47) | P0 (b): children's privacy (counsel packet Q45; counsel must confirm) | `user-research`, founder | NS-03 lines 26, 173; charter ("never interview or record a child") |
| FR-RSH-14 | Given any session, Then no child takes part or is addressed; a child in the room is not recorded, named or described in notes; no audio or video of a session is made unless the founder rules otherwise with counsel (default: notes by code only); no session asks a parent to play, show or send a recording of a child's voice | NS-03 section 3 and Arm V gate; Q45; BL-981 | P0 (b), counsel must confirm | `user-research`, founder, counsel | NS-03 sections 0 and 3; frame line 89 |
| FR-RSH-15 | Given any prototype, build or device used in a study, Then it holds the fictional Asha book only; no participant creates, types, speaks or imports their own letter, picture, child name or voice; if a participant starts to, the researcher stops it and writes nothing about it; the `no-real-family-data` test runs on every PR that adds a plan, guide or findings | 14-test-plan line 90; NS-03-R3; PROTOTYPE.html in areas A to E; new row needed (prototype participant mode, design-systems) | P0 (a): CLAUDE.md privacy rules | `user-research`, `design-systems`, `qa` | CLAUDE.md; 14-test-plan line 90 Superseded in part by FR-RSH-30 on 20 Nov (post-G0 own-phone field test only). |
| FR-RSH-16 | Given the constitution, Then no study tests, tunes or scores a feature that writes, rewrites, summarises or shapes a person's words, and no task asks a parent to judge the machine's small fixes; the only word-fidelity question allowed is the guardrail Q-FID-1 ("Did the app ever show a word you did not say?"), which tests nothing and reads one yes as an incident | NS-17, A-S07 (words states); FR-DAT-32; BL-962 | P0 (a): the constitution | `user-research`, Karma | Charter ("never test a feature that writes"); CLAUDE.md. Whether Review's marked fixes count as "writing" is for Karma to rule (finding F5) |
| FR-RSH-17 | Given a study, When a person agrees, Then they see the study's consent text before agreeing, in words that pass the content rules, with these four lines. **Shown:** what the study is, how long, that they may skip anything or stop at any time, that we never see their real letters, voices, pictures or child's name, and what we keep. **Records:** code, the word Yes or No, the consent text version (hash), the date, the method (message or call), in the founder's private store (L3 and L2); never in the repo, an agent session or a Project doc. **Never:** a letter, recording, picture, child's name, recipient's name or contact, a screenshot, a location, a device identifier, anything said by a child, payment conditioned on the answers. **Decline and withdraw:** No thanks ends it with no follow-up; withdrawal at any time by message; notes deleted within 2 working days; no effect on the app, book or allowance | NS-03 section 15 (the pattern); PRIV-R21 does not apply (not an app agreement); Q44, Q51 | P0 (b): counsel Q44, Q51; counsel must confirm | `user-research`, counsel, founder | NS-03 lines 259 to 273; COORDINATION section 10 (not read; cited via NS-03 line 257) |
| FR-RSH-18 | Given recruiting, Then the founder recruits by his own messages from a list he already holds, plus a small number of people he does not know (at least 3 of 5 in S2, and in each study at least 2 of 5 where the list allows) reached by a method the founder rules; nothing recruits inside the app, on the store page, or in any notification; no one is recruited who is paid by us, works for a competitor, reviews for the App Store, or is under 18; at least 2 of 5 per study are not first-time parents of a newborn where the list allows (second children, older babies) | `USER_RESEARCH.md` 1.4 (second children, fathers, co-parents); persona P1 to P5 (frame line 9); FR-DAT-02, FR-DAT-29 | P1 | founder, `user-research` | NS-03 line 26 (not recruited); frame line 9. The channel for strangers is a founder decision (section 9) |
| FR-RSH-19 | Given a study needs another adult (a relative, a co-parent), Then the default is relay through the parent, as NS-03: the team does not contact relatives and notes second-hand answers as second-hand; a relative or other parent may take part directly only when they are asked by the founder with the parent's introduction, consent for themselves with their own consent record, take part as an adult in their own right, and are never asked about the child's data, only about their own experience | NS-03 section 7 (Script C), section 21; NS-16, NS-25, NS-05; Q48, Q22 | P0 (b): another adult's data, Q48; counsel must confirm | `user-research`, counsel | NS-03 lines 132 to 135 |
| FR-RSH-20 | Given incentives, Then none is offered before the founder rules; the default is a thank-you message only, no money, gift or offer code before the read-out, and never a Plus code as a thank-you; any later offer code carries the endorsement disclosure line; an incentive, if ruled, is the same for every participant, unconditional on completing or on any answer, paid by the founder, and cleared with counsel and a tax adviser (needs a number from legal; counsel must confirm; UNVERIFIED) | NS-03-R7, OQ-3; frame line 18 (T2); new row needed (founder spend line) | P0 (b) for the no-code-before-read-out rule in the pilot (NS-03-R7); P1 elsewhere | founder | NS-03 lines 216, 338 |
| FR-RSH-21 | Given research with tired and sometimes struggling parents, Then every guide opens with: no right answers; the app is being tested, not the parent; stop or skip at any time; sessions are short (45 minutes at most, 60 for S2) and can pause or move when a baby needs the parent; when a participant shows or says they are struggling or in danger, the researcher stops the study questions, does not counsel, offers the in-app "If you are struggling" lines and Find A Helpline as support.md FR-SUP-16 and FR-SUP-17 define, tells the founder the same day (code only, no content), and nothing about it enters notes beyond "stopped for wellbeing" | NS-03 stop rule 2; NS-23 (a past letter can bring back a hard day); C-S01 "If you are struggling"; E-S27 and E-S28 (proposed by support.md) | P0 (a): we promise no guilt and care for people (VOICE.md); FR-SUP-16 is P0 (a) | `user-research`, `support`, founder | support.md FR-SUP-16, FR-SUP-17, FR-POL-07 |
| FR-RSH-22 | Given research data, Then one table of clocks holds in the founder's private store, outside the repo: raw notes (L4) deleted 30 days after the read-out; contact details 30 days after; consent records 12 months after (D4, counsel Q51); hand-sent round sheets 90 days after the round (D5); the repo keeps only counts and "Raw answers deleted on {date}" lines; agents never read private notes (NS-03-R8) | NS-03-R4, R5, R8; FR-DAT-05; FR-DAT-04 | P0 (a) | founder, `user-research` | NS-03 lines 212 to 217, 245 to 253; data-and-measurement FR-DAT-05. NS-03 uses 30 days and D5 uses 90 days; this row keeps both and names which applies |
| FR-RSH-23 | Given a study scheduled around a person's life, Then nothing is timed by a child's birthday or due date; an expecting parent is screened by a yes or no only; no due date, date of birth or pregnancy detail is asked or kept | NS-24, NS-11, NS-13 (birthday weeks); FR-DAT-25; persona P3 | P1 | `user-research`, `privacy` | FR-DAT-25 |

### 6.3 Reading and using what we learn

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-RSH-24 | Given a read-out, Then it states n asked and n answered, uses "x of n" below 20, attaches the pass-chance table for any pass line, opens with the biases (friendly families, recall, one parent answering), names no group under 5 that the founder could identify, holds no quotes and no codes joined to answers, and says "usability check, not a rate" | NS-03-R3; BL-981 | P1 | `user-research` | FR-DAT-08, FR-DAT-11, FR-DAT-29 |
| FR-RSH-25 | Given a study ends, Then within the same PR cycle `FINDINGS.md` lands under `docs/research/studies/<id>/`, `USER_RESEARCH.md` marks each belief it touches as evidenced (with the study id), assumed, or contradicted, implications go to `product` as backlog proposals, usability issues to `design-systems`, copy issues to `content`, and anything that should become a metric to `decision-science` | USER_RESEARCH.md; GAP-LOG ruling kinds; new row needed (first marking pass: the 1 Oct desk findings stay "assumed", finding 5 marked "superseded by D-082 and the frame") | P1 | `user-research` | Charter standing duty 1 |
| FR-RSH-26 | Given any study result, Then it is never used as a public claim, a store line, a website sentence or a quote: a pass is an internal go or hold, not "parents love it" (FR-DAT-11) | NS-38-R2; claims inventory | P0 (a): claims must be true of the build | `user-research`, CMO role, CCO role | Frame line 87; FR-DAT-11 |
| FR-RSH-27 | Given a stop rule fires in any study (lost or changed words, a guilt or count line, an unintended recipient, distress, a participant under 18), Then the study pauses the same day, the founder is told, and the finding is logged as an incident by code with no content; the card's flag does not move to a wider cohort until the cause is known | FR-DAT-09; NS-03 stop rules; J-N4, J-N18 | P0 (a) | `user-research`, founder | FR-DAT-09; NS-03 lines 168 to 173 |
| FR-RSH-28 | Given the gates, Then a design decision listed in section 8 as "blocked" does not pass G3 (founder has approved the words) until its study has a read-out, and one listed as "proceeds on a default" ships on the default and is revisited when the study ends | 14-test-plan line 96 (G3); section 8 of this file; BL-981 | P1 | `product`, `user-research` | Section 8 |
| FR-RSH-29 | Given the next release is planned, Then `user-research` hands `product` the three riskiest assumptions and the cheapest study for each, as backlog proposals, at the start of planning, not the end; the first list is section 3 | Section 3; new row needed | P1 | `user-research` | Charter standing duty 2 |

---

## 7. Research calendar tied to gates G0 to G6

Cards state order and gates, never dates or build numbers (ruling T5; README line 3), so this is an order. Gate meanings are 14-test-plan line 96: G0 trace sees NS ids and every P0 has a test and a backlog row; G1 on-device data rules (ADR 0028, PR #797) and export schema merged; G2 the counsel reads each card names; G3 the founder has approved the words; G4 every P0 device row passes on the candidate; G5 privacy label and claims match what the build sends; G6 no `production` flag on while its card has an open P0. C1 is 15 to 25 friendly families (data 3.2).

| Stage | Trigger | Studies that can run | Decisions they unlock |
|---|---|---|---|
| 0. Before G0 (today) | Counsel has read consent and scripts (NS-03 section 0, Q44). No build with a flag on outside the founder's family | S1 (prototype), S9 (trust comprehension), S6 reading test, S7, S4 concept walk, S5 concept walk (after counsel's minors read), S11, S10 on prototype. Plan PRs, guides, question bank, tester guide. Pilot Arm W once counsel's read is on record | A to E screen design defaults confirmed or changed; RA-04, RA-08, RA-09 answered before a word is final |
| 1. G0 met, flag on in the founder's family | The card's P0 rows each have a test and a backlog row | S-B1 to S-B3 and S2 as moderated sessions on a founder-owned phone (F1 resolution) | NS-01 and NS-02 lines; first-run order; NS-05 comprehension line |
| 2. G1 met | ADR 0028 and export 1.7.0 merged | Two-phone checks of new phone and seals with test accounts (these are `qa` device rows, not research); S3 diary may start for flags whose P0 tests are green | Diary read for RA-18 |
| 3. G2 met | Counsel reads named by each card (photo label, minors and "open on a day", another adult) | S4 agreement step; S5 after Share Level 1 ships; pilot Arm V only after both voice reads (NS-03-R2) | NS-25 agreement shape; Firsts and seals build or park |
| 4. G3 met | Founder has approved the words | Re-run any trust line whose words changed (S9, rerun once) | Final words for E-S10, C-S03, D-S02 |
| 5. G4 met on a candidate | Every P0 device row passes | S3 diary and the tester rounds on real devices and own data (frame section 3 questions) | RA-07 field half, RA-18, NS-13 back-off |
| 6. G5 met | Label and claims match the build; analytics still off (D-124) | Read-outs published; no study result enters a public claim (FR-RSH-26) | Whether any claim needs a row |
| 7. G6 met, store build live | No production flag on with an open P0 | Post-launch: support tally, ratings tally, interviews with strangers who found the app in the store (the first unbiased group), repeat S2 with strangers | First evidence outside friends; any change to the first-run order |

Founder time, rough [E]: stage 0 about 25 sessions plus preparation, about 40 hours, no spend; stage 1 about 15 sessions, about 25 hours; later stages depend on C1 size.

---

## 8. Design decisions blocked on research, and those that are not

A decision is blocked only when shipping the default could hurt a parent or break a promise; otherwise design proceeds on the default and revisits. Defaults here are PROPOSED; `product` rules.

| Decision | Screens | Study | Blocked or proceeds | Default if no study |
|---|---|---|---|---|
| Build Firsts at all | B-S05, B-S12; BL-968 | S5 | Blocked (README line 58: after the five-parent study) | Parked; stays in `12` |
| Build sealed letters at all | B-S13, B-S14, B-S16; BL-969, BL-970 | S5 plus counsel on minors | Blocked | Parked |
| Any hosted family listening | NS-05 Levels 2 and 3, NS-28 | Pilot; security and counsel reads | Blocked | Not pursued; Level 1 stays |
| NS-25 in a store build | D-S15, D-S20; GAP D G-D16 | S4 and counsel Q48, Q49, Q53; safety runbook (FR-POL-04) | Blocked | Stays off in store builds, no surface (frame line 67) |
| NS-17 per-language gate | A-S10 | Native reviewer corpus, plus S11 | Blocked for each language | Language stays out of the picker (data 3.4) |
| Final words of the recording-on-one-phone lines | C-S03, C-S08 | S9 | Blocked at G3 | The built D1 sentences |
| Final words of the Keep sheet | E-S10 | S9, S2 | Blocked at G3 | As built |
| Share preview wording | D-S02 | S-B3, S9 | Blocked ahead of send-speed work (data 3.4) | As in NS-05 |
| First-run order (age, agreement, Welcome, sign-in) | E-S03, E-S02, E-S07 | S2 | Proceeds on the built order (card 19 line 42); revisit if 2 of 5 call it a trick | The built order |
| Reminder evening words and back-off | D-S04, D-S11 | S6 | Proceeds on the neutral set (GAP D G-D19); revisit on any "too much" yes | Neutral set |
| Photos start position | A-S01, B-S04 | S-B1 | Proceeds (data 3.4: under 4 of 5 means one change, rerun once) | Third and quietest start |
| Find no-match line | B-S06 | S-B2 | Proceeds | As in NS-02 |
| Birthday-week Save a copy slip | C-S06 | S1 set C | Proceeds | 7-day window (GAP C G14) |
| Printed book unpark | C-S05, NS-30 | S7 | Not a design block; it is a roadmap block | Parked, no spend |
| Two-book labels | A-S02 | S1 set A with fixtures | Proceeds | As in GAP A G-04 |
| VoiceOver recording announcement | A-S05, NS-33-R6 | S10 | Proceeds, device confirmation is `a11y` | GAP A M-CG-2 |
| First kept letter in 90 seconds | A-S01 to A-S13 | S2 | Proceeds; the 90 s is an assumption, not a gate | Seconds reported only |

---

## 9. Recruitment, incentives and consent in one place

Recruiting (founder decisions in bold):
- Who: adult parents of children under 5, and expecting parents by yes or no; second parents and fathers deliberately (`USER_RESEARCH.md` 1.4); a few parents who speak another language at home; a few who use assistive technology; at most 2 of 5 per study from the pilot list.
- Where: the founder's own list first. **A method for reaching people the founder does not know** is open (a parent group the founder belongs to, a friend's introduction, an existing newsletter if one exists). Whatever he picks, the first message and its words pass counsel's read, name no child, and promise no reward unless he rules one.
- Never: inside the app, on the store page, in a notification, or through any paid tool without the founder's approval (charter).
- Relatives: by relay through the parent, as in NS-03; or directly, only after the parent's introduction and with the relative's own consent (FR-RSH-19). Co-parents join S4 as adults in their own right.
- Minors: never recruited, interviewed, observed or recorded. A baby in the room is not part of the study and is not mentioned in notes.

Consent: the four-line pattern in FR-RSH-17, hashed text versions, counsel's read before any contact (counsel numbers Q44 tester texts, Q51 retention, Q45 children and a baby's voice, Q48 another adult, Q22 a recipient abroad; counsel must confirm each).

Incentives: default none beyond a thank-you message until the founder rules (FR-RSH-20). My recommendation, not the default: because unpaid recruiting skews toward friends and enthusiasts, consider a small fixed thank-you for people the founder does not know, paid by him, the same for everyone, never tied to answers or completion, never a Plus offer code. Whether that creates a tax or reporting duty is UNVERIFIED and needs a number from legal.

Where data lives: the founder's private store; the repo keeps counts only; no agent reads raw notes (FR-RSH-22).

---

## 10. Design needs

| Where | Need | For |
|---|---|---|
| Every prototype (`PROTOTYPE.html` in areas A to E) | A "participant mode" that hides the state switcher and any researcher-only controls, plays a task path end to end, and shows the Asha book only. The state switcher stays for researchers (C DESIGN line 5 describes one) | FR-RSH-03, FR-RSH-15; S1, S2 |
| A-S01.first, A-S04.primer, E-S02, E-S03, E-S07, E-S08, E-S10, E-S12 | A clickable first-run path with no dead ends, so S2 can run on a prototype before a build exists | FR-RSH-04 |
| C-S03, C-S08, E-S10, D-S02 | Print-ready "read aloud" cards of each screen, one per comprehension question | FR-RSH-10 |
| D-S04, D-S11 and the neutral notification set (GAP D G-D19) | Five mock notifications as images (Asha, no child name), for the reading test | FR-RSH-08 |
| D-S15, D-S20 | A two-phone prototype path for the join test | FR-RSH-06 |
| B-S12, B-S13, B-S14, B-S16 | Concept walk states for seals and Firsts exactly as drawn, with the limit line shown | FR-RSH-07 |
| C-S05 | The printable book as an Asha fixture file | FR-RSH-09 |
| No app screen | Nothing in the product asks a research question, shows a survey, or composes a message (FR-DAT-02). Nothing here adds an app screen | all |
| New artefacts outside the app | Tester guide; consent texts (one per study); question bank rows; read-out template with the pass-chance tables. `content` writes the words and the founder approves; they pass the content rules; none implies the app writes anything | FR-RSH-17, FR-RSH-24 |

---

## 11. Card changes I propose (for Karma to rule)

| # | Card row | Change | Why |
|---|---|---|---|
| C-1 | README lines 151 to 158 (studies table) | Add rows for S2 first-run test, S3 diary week, S4 other-parent join, S6 reminder tolerance, S7 printed-book, S9 trust comprehension, with owner `user-research`, trigger as an event, default if nobody sets it | The table has none of them; first run has no study owner (F2) |
| C-2 | README lines 153 to 156 and 14-test-plan line 7 | State that five-parent studies of a flagged feature run moderated on a founder-owned phone with the Asha install until G0 is met, and on a parent's own TestFlight build only after | Resolves F1 |
| C-3 | NS-39 or NS-44 section 21 (card 19) | Add a study line for the 90 second assumption: seconds only, 5 parents, stopwatch, the lines in S2 | FR-DAT-33 says it is read only in a five-parent study; no card holds the study |
| C-4 | NS-25 (new row, section 21) | Add a research row: a join comprehension test (S4) before the agreement step is fixed; no agreement recorded in research | GAP D G-D16 is FOUNDER-ruled with no evidence |
| C-5 | NS-07 C28 and NS-30 reopen line | Define the willingness measure as past behaviour, no price | FR-DAT-20; S7 |
| C-6 | NS-03 section 14 and frame lines 52 to 53 | Add one retention table naming which clock applies to which kind of research data (FR-RSH-22) | 30 days against 90 days |
| C-7 | 14-test-plan section 8 ("Tests owed today") | Add "Studies owed: S1, S2, S9 first" | The section lists device rows only |
| C-8 | `docs/research/USER_RESEARCH.md` header and finding 5 | Mark status "desk research, no interviews" per belief, and mark finding 5 superseded | Standing duty 1; frame lines 18, 179 |
| C-9 | Frame line 38 | Say the 5-question cap applies to hand-sent rounds; the diary and moderated studies have their own scripts and consent (as data C-09 proposes) | Avoids reading the cap onto studies |

---

## 12. Engineering needs (backlog rows to add or change)

- BL-981 (change): scope gains S2 first-run test, the sealed study (data review already asks), the lines-before-day-0 rule, and the F1 resolution. Corrects section references.
- New row, `user-research`, S, docs only: `docs/research/studies/<id>/` template (PLAN, GUIDE, FINDINGS), the question bank rows for studies and the diary, the consent text set, the read-out template. Blocked by nothing; counsel reads before use.
- New row, `design-systems`, S: prototype participant mode in each area's `PROTOTYPE.html` (FR-RSH-15).
- New row, `qa`, S: a way to run the flagged build for moderated sessions on a founder-owned phone with the Asha-only install (FR-RSH-03). I did not check whether the existing `testflight` or alpha profile already does this; UNVERIFIED.
- New row, `qa`: confirm the `no-real-family-data` test covers `docs/research/studies/**` (NS-03-R3 relies on it for read-outs).
- No app code change for any study (FR-DAT-01, FR-DAT-02).

---

## 13. Founder and counsel questions, each with a recommended default

| # | Question | Recommended default |
|---|---|---|
| RQ-1 | Founder: how do we reach parents the founder does not know? | A friend's introduction or a parent group he already belongs to; no paid recruiting tool; no recruiting in the app. If unanswered, S2 and S-B1 to S-B3 run with the founder's list only and every read-out says the group is friendly (FR-DAT-29) CLOSED 20 Nov, see GAP-LOG Closures CL-073 |
| RQ-2 | Founder: any incentive? | None beyond a thank-you message, as NS-03 OQ-3. My recommendation to consider: a small fixed thank-you for people he does not know. Any spend is his decision FOUNDER-ANSWERED 20 Nov, default accepted (CL-074, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel and accountant engagement |
| RQ-3 | Founder and counsel: may a session be audio or video recorded? | No. Notes by code only. Needs a number from legal if ever asked (a baby may be audible; Q45) FOUNDER-ANSWERED 20 Nov, default accepted (CL-075, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement |
| RQ-4 | Founder and counsel: may a relative or co-parent take part directly? | Relay through the parent by default; direct only with the parent's introduction and the relative's own consent (FR-RSH-19). Counsel Q48 for another adult, Q22 for a recipient abroad FOUNDER-ANSWERED 20 Nov, default accepted (CL-075, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement |
| RQ-5 | Counsel: tester and study texts, and retention | Q44 and Q51 as the pilot uses; default D4 (12 months for consent records) and the clocks of FR-RSH-22 FOUNDER-ANSWERED 20 Nov, default accepted (CL-075, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement |
| RQ-6 | Counsel: does asking an expecting parent to take part, even by yes or no, touch information that needs more care? | Needs a number from legal. Default: yes or no only, nothing kept, FR-RSH-23. I did not verify Apple's or any regulator's treatment of pregnancy information; the privacy review reports Apple lists it as sensitive info (privacy.md line 40, second-hand) FOUNDER-ANSWERED 20 Nov, default accepted (CL-075, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement |
| RQ-7 | Counsel and tax adviser: any duty from a thank-you payment | Needs a number from legal. Default: none given until answered; UNVERIFIED FOUNDER-ANSWERED 20 Nov, default accepted (CL-074, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel and accountant engagement |
| RQ-8 | Karma: does Review's marking of small fixes make it "a feature that writes" for research purposes? | Yes, excluded from every study; only Q-FID-1 is asked (FR-RSH-16). Karma rules CLOSED 20 Nov, see GAP-LOG Closures CL-076 |
| RQ-9 | Founder: the sequence in F1 | Moderated on a founder-owned phone, Asha only, until G0; parents' own builds only after G0 and green P0 tests CLOSED 20 Nov, see GAP-LOG Closures CL-073 |
| RQ-10 | Founder: C1 composition. Should at least a third of C1 be people he did not know before? | Yes, if the list allows; otherwise label every number "friendly group" and treat stranger evidence from stage 7 as the first unbiased read CLOSED 20 Nov, see GAP-LOG Closures CL-073 |
| RQ-11 | Founder: who runs sessions? | The founder or a human researcher he names, from my guide; I never speak to participants CLOSED 20 Nov, see GAP-LOG Closures CL-073 |

---

## 14. Summary

- 29 function requirements (FR-RSH-01 to 29): 10 P0 (some conditional), the rest P1 or P2.
- 18 untested assumptions listed (RA-01 to RA-18); three riskiest for the next release: first run with strangers, recordings live on one phone, reminders and silence.
- 11 studies and rounds (S1 to S11, with S-B1 to S-B3 and the pilot S8), none needing a build to start; the first three cost about 25 sessions and answer the three riskiest assumptions.
- 5 findings, 9 card changes, 5 backlog changes, 11 founder or counsel questions.
- Not verified: every outside fact (none read), the area D screen ids, cards 01 to 13 and 21 to 37 in full, NS-39 to NS-45, the roadmap, and whether `docs/research/studies/` exists.

Signed: `user-research` (Claude role, not a licensed researcher or lawyer).

## Addendum 20 Nov 2026: photo moments and pictures and videos

Source: `26-founder-direction-photos-library-and-media.md`. Cards NS-51 "Photo moments" and NS-52 "Pictures and videos with a letter" are now in `27-photo-moments-and-media.md` (NS-51-R1 to R42; I read it after drafting, so rows are aligned to it where an "Aligned" note says so); I cite them by name and cite NS-49 section 21, FR-RSH-03, 11, 13 to 17, 24 and section 5 of this file instead of repeating them. I am a Claude role; I do not run sessions. No outside source read; consent and tax readings are UNVERIFIED and "counsel must confirm". Nothing here is observed data.

The core difficulty, stated plainly: the value of NS-51 depends on a parent's real library, and FR-RSH-14 and FR-RSH-15 forbid the team from seeing or creating real pictures, children or voices. So some questions can be tested on fictional material and some cannot be tested by us at all before a build runs on a parent's own phone.

### B.1 Assumptions added (continue RA-19)

| Id | Assumption | P0 and where it bites | Evidence today | Cheapest study | Decision it changes |
|---|---|---|---|---|---|
| RA-19 | Parents have pictures from days they meant to write about and did not | NS-51 value; direction section 2 | None. NS-49 s21(a) asks the same past-behaviour question for level 2 | Reuse that question in S1 sessions (no new study); add "what did you do with pictures from a day you wanted to remember" | Whether NS-51 is worth a spike |
| RA-20 | A date-only invitation ("pictures from the weekend are here") reads as "my pictures, my words", not "the app is watching" | Stop line carried over from NS-49 s21 ("0 of 5 say it felt like the app reading their photos") | None | S12 comprehension on prototype with a fictional library | Wording; whether the permission ask is shown before or after the first moment |
| RA-21 | Limited access (a parent picks which pictures the app may see) is understood and accepted, and the moments list still feels useful with few pictures | Q-PM-1 | None | S12 with the limited-access states drawn | Default access level |
| RA-22 | A parent who sees a moment starts a letter from it more often than from a blank page, and the words stay theirs | Core loop (c) | None | Field yes or no question after G4 (B.3), 5 to 10 parents | Whether moments stay on Home |
| RA-23 | Parents want several pictures and a short video in the book, and not as a way to skip the words | NS-52; Q-PM-2 | Desk research only | S13 past-behaviour interview: what they already do with video of the child | Limits; whether video ships |
| RA-24 | No invitation reads as a count of what the parent has not written | Constitution (celebrate what exists, never count gaps) | None | S12: "did this make you feel you had missed something?" with a printed mock-up; any yes is a stop for that line | Wording and rank |
| RA-25 | Parents understand where a picture or video lives (on the phone, in the iPhone backup; on our servers only if Q-PM-3 is answered yes) | NS-52; label | None | S9 trust comprehension row for the new where-it-lives lines | Final words, G3 |

### B.2 Testing without real family photos

- Fixtures (FR-RSH-15 holds): a fictional Asha library inside the prototype's participant mode: illustrated or generated images, generated timestamps, one generated video; no real face, even synthetic photoreal faces are avoided (a generated face can read as a real child). Built once and shared with `qa` (quality FR-QAL-28), not made twice.
- What fixtures can test: comprehension of the invitation, the permission explainer and the limited-access states; where-it-lives lines; reading order; whether an invitation feels like counting; the attach flow on Review. All on a founder-owned phone or prototype, Asha only (FR-RSH-03).
- What fixtures cannot test: whether the moments the date rule finds match the days a real parent cares about; whether a real library's mess (screenshots, receipts, burst photos, other people's pictures) makes the list noisy; real performance. Only a parent's own library can answer these.
- Founder device walk (NS-49 s21(b) pattern): the founder runs it on his own phone and records pass or fail of the card's rows and of "was the list sensible: yes, no, with a reason in words not shown to anyone". Not a tester session. Whether the founder's library may be used is his call; nothing from it is committed or sent.

### B.3 Parent diary study with consent (design)

Applies only after G0, the card's P0 tests green and the flag on in a build the parent holds (FR-RSH-03, stage 5 of section 7). It is the only way to learn B.2's "cannot test" items.

- Who: 8 to 10 adult parents, at least 3 not known to the founder where the list allows (FR-RSH-18); not in the same week as the pilot.
- What the parent does: uses the build for 2 weeks on their own phone and library. We see no pictures, no screenshots, no library data and no child's name. The app sends nothing (analytics off, FR-DAT-02).
- Questions, sent by the founder in his own message, optional, fixed list, 3 per evening at most: "Did you open a moment from your pictures today (yes or no)? Did you write or say a letter from it (yes or no)? What got in the way (a fixed list: not the right day, too many pictures, too few, did not want the app near my pictures, did not understand, nothing)". A missed day is never followed up or counted (FR-RSH-05).
- Day 15 call (by choice, 20 minutes): was a moment ever wrong or uncomfortable; what did they think the app could see. No questions about pictures' content, people in them, or any child.
- Consent (four lines, FR-RSH-17): Shown: what the app can see (dates only, on the phone, access the parent chose), that we never see pictures, and that they may stop; Records: code, Yes or No, text hash, date; Never: pictures, screenshots, filenames, places, names, library counts; Decline and withdraw: no effect on the app; notes deleted within 2 working days. Counsel reads it first (Q44, Q51).
- Report: "x of n" per day and for the period; no percentage under 20; the biases of the group first (FR-RSH-24; section 5 of this file for what 5, 10 and 20 can tell).
- Stop lines: any parent says a moment showed something that upset them (an ex-partner, a loss) goes to the founder the same day and pauses the study (FR-RSH-21, FR-RSH-27); any report of a picture or video shown to someone it should not be; 1 or more says the invitation felt like pressure.

### B.4 Hypotheses and tests (PROPOSED lines; the founder fixes them before day 0)

| Id | Hypothesis | Test | Pass | Hold | Stop |
|---|---|---|---|---|---|
| H-MOM-1 | The invitation reads as an offer, not a count | S12 reading of 3 printed mock-ups | 4 of 5 say "an offer" or equivalent | 2 or more say "I should have written more" | Any "this made me feel I was failing" for that line |
| H-MOM-2 | The permission explainer is understood | S12: "what can the app see after you choose Limited?" | 4 of 5 answer in line with the real behaviour | 2 or more think it reads or uploads pictures | Any belief that pictures leave the phone when they do not (or the reverse) |
| H-MOM-3 | A moment starts letters | Field question (B.3), after G4 | Report x of n; no pass number until 10 | none | Any report of a letter changed or words suggested |
| H-ATT-1 | Attaching several pictures and a video on Review is possible unaided | S1 task set on the prototype | 4 of 5 finish unaided | 2 or more fail at the limit lines | Any report of a lost picture |
| H-ATT-2 | Where-it-lives lines match behaviour | S9 | 4 of 5 match | any mismatch goes to `content` the same day | A belief that a video survives a lost phone when it does not |
| H-VID-1 | Parents want video at all | S13 past behaviour | x of 5 have kept a video of the child as a keepsake | none | none (this tests desire, never a price) |

Stated intent overstates behaviour (FR-RSH-09 reading): past behaviour and diary yes or no outrank opinions.

### B.5 Function requirements (continue FR-RSH-30 onward)

| Id | Requirement (Given, When, Then) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-RSH-30 | Given a study of moments or media, Then sessions the team observes use the fictional Asha library only (FR-RSH-15); the post-G0 own-phone diary may use the parent's own library because it is theirs and nothing leaves the phone, but the team sees only the yes or no answers; no pictures, screenshots or screen recordings are made or shared by either side. Counsel must confirm | NS-51; NS-52; FR-RSH-03, 14, 15 | P0 (b): children's images (counsel Q45) | `user-research`; counsel | Direction section 1 |
| FR-RSH-31 | Given a fictional library for studies, Then it is one fixture shared with `qa` (FR-QAL-28), illustrated or generated, with no real or photoreal face, no real child, and the `no-real-family-data` test covers it | NS-51; NS-52; FR-RSH-15 | P0 (a) | `user-research`; `qa` | Quality Annex E.3 (illustrated images only) |
| FR-RSH-32 | Given S12 (invitation and permission comprehension), When it runs, Then it uses H-MOM-1 and H-MOM-2 with the lines in B.4, 5 parents, prototype only, and counts the stop events | NS-51; A new screens; BL-981 gains S12 | P1 | `user-research` | B.4 |
| FR-RSH-33 | Given the diary of B.3, When it runs, Then it follows FR-RSH-05, 17, 21, 22, 24 and 27, plus the library-specific stop lines; no question asks what is in a picture | NS-51; FR-RSH-05 | P1 (P0 (a) for the stop lines) | `user-research`; founder | B.3 |
| FR-RSH-34 | Given S13 (video past-behaviour) and RA-23, When read out, Then it asks about what parents already do, shows no price, makes no promise of print or QR, and the read-out says it tests desire, not willingness to pay | NS-52; FR-RSH-09 | P2 | `user-research` | FR-DAT-20 |
| FR-RSH-35 | Given the moments feature, Then no study score, tuning or "moment quality" rating is made: a study never asks a parent to rate how good the app's choice of day was in a way that would be used to tune a ranking by picture content (there is none). Only "sensible, not sensible" on dates, by the parent, in words not stored | NS-51; FR-RSH-16 | P0 (a) | `user-research`; Karma | Constitution |

### B.6 Design needs, card changes, engineering

- Design (areas A, C): prototype participant mode with a fictional library; permission explainer and limited-access states drawn for S12; mock-up images of the invitation in Home slip, in the capture cluster and as a lock-screen line (neutral only); where-it-lives lines as read-aloud cards (FR-RSH-10 pattern).
- Card changes (for Karma): README studies table gains S12 and S13 (the S2 to S11 additions from C-1 stand); NS-51 section 21 and NS-52 section 21 reference B.3 and B.4 and state "no pass number before 10"; FR-RSH-15 carries the pointer above.
- Engineering: BL-981 gains S12 and S13; new row (`design-systems`, S) fictional library fixture; new row (`qa`) confirm `no-real-family-data` covers `docs/research/studies/**` (already asked in section 12).

### B.7 Questions, each with a default (who answers)

| Id | Question | To | Recommended default |
|---|---|---|---|
| RQ-12 | May the post-G0 diary use parents' own libraries on their phones? | Founder, counsel (needs a number from legal) | Only after G0 and green P0 tests, only the founder's family and warm list first, answers by yes or no only FOUNDER-ANSWERED 20 Nov, default accepted (CL-075, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement |
| RQ-13 | May the founder use his own library for a device walk? | Founder | His choice; pass or fail recorded, nothing committed CLOSED 20 Nov, see GAP-LOG Closures CL-076 |
| RQ-14 | Is a consent text for "app looks at dates of pictures on the phone" distinct enough to need its own counsel read? | Counsel (needs a number from legal) | Yes: counsel reads it before any contact FOUNDER-ANSWERED 20 Nov, default accepted (CL-075, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement |
| RQ-15 | Is a generated image library acceptable as stand-in or does a licensed set exist? | Founder | Generated or illustrated, licence allows test use (counsel must confirm) CLOSED 20 Nov, see GAP-LOG Closures CL-076 |

### B.8 Cannot assess yet

- Whether moments are valuable: no parent has seen one; every claim here is an assumption (RA-19 to 25).
- Moments quality on a real, messy library: not testable without real libraries; the diary is the only route and starts late.
- The effect of different access levels (limited versus full) on usefulness: unmeasured; depends on Q-PM-1.
- Any rate: n is 5 to 10; see section 5 of this file.
- Whether parents will accept a Photos permission ask at all in a baby-memory app: no evidence; S12 tests comprehension, not behaviour.

Totals for this addendum: 7 assumptions (RA-19 to 25), 2 new studies (S12, S13), 6 hypotheses, 6 requirements (FR-RSH-30 to 35): P0 3, P1 2, P2 1 (first token of the Priority cell); 4 questions (RQ-12 to 15).
