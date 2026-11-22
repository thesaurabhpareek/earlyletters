# Engineering's questions, closed one by one (20 Nov 2026)

Status: CURRENT | Owner: product | Replaces: none | Load when: you asked a question on #934, #935 or a data and security pack PR (#999 to #1011), or you want to know whether CF-1, CF-8 or Q57 is still open

Written by product for Karma, 20 Nov 2026. This file points; the rulings live in `18-errata-after-lock.md` (E) and `GAP-LOG.md` "Closures 20 Nov" (CL). It changes no card. Rule used throughout: show less, store less, send less, undoable. "Founder" and "counsel" mean the default stands and the item is in the founder digest (`22-final-holistic-spec.md` section 7); it is not closed for good.

Basis: 24 product questions on #934 (merged), 13 design questions on #935 (closed, replaced by #978), rulings in `docs/design/e2e/RULINGS-20nov.md`, the second-round check, and engineering's ask to drop CF-1, CF-8 and Q57. At the start of this round the 24 product questions had an E and CL id; the 13 design ones had only the design file (four of them also E68), so 28 of 37 had an id. E69 gives all 13 an id. Every question has an answer. Founder-only and counsel-only defaults stay open for him or counsel, not closed for good. Items that are not requirement questions are listed at the end with their owner.

## 1. The 24 product questions (#934)

| Q | Row id | E | CL | Founder or counsel only? | Default that stands |
|---|---|---|---|---|---|
| P1 | NS-38 | E43 | CL-117 | Founder (release content) | Drop D, after wave 1 and Drop A, before any family outside his signs in |
| P2 | NS-52-S10 | E44 | CL-118 | No | `position` and a poster name derived from the media id |
| P3 | NS-47-R38 | E45 | CL-119 | No | One fixed neutral body, no `{child}`; key `days.lock.body.neutral` PROPOSED |
| P4 | FR-CMP-16 | E46 | CL-120 | Founder, counsel-adjacent | One new P0 row NS-42-R17; built before anyone outside the family signs in |
| P5 | NS-40-R9 | E47, restated E72 | CL-121, CL-146 | Counsel only | Fail open and count; hook off until counsel and the CCO answer |
| P6 | NS-01-R36 | E48 | CL-122 | No | Holds until NS-52 ships, then "unless NS-52-R40" |
| P7 | NS-47-R37 | E45 | CL-119 | No | All day words follow `notifications.dayNames` |
| P8 | X4-R1 | E49 | CL-123 | No | B sees nothing of A; D1 line is for A at sign-out only |
| P9 | NS-40-R7 | E50 (clean-up E63, E71) | CL-124, CL-137, CL-145 | No (legal text in the clean-up is the founder's merge) | No `age_signal` anywhere; `age_attested: true` only |
| P10 | NS-42 | E51 | CL-125 | Founder approves the words | NS-42-R18 PROPOSED; links only (R14) until he approves |
| P11 | NS-37 | E52 | CL-126 | No | As locked until NS-52 ships; 150 MB and 120 MB are two named numbers |
| P12 | NS-34 | E53 | CL-127 | No | 20 samples, marked `[stand-in]`, never green |
| P13 | NS-47-R14 | E45 | CL-119 | No | Switch shows when a ticked or typed day exists; default off |
| P14 | NS-01-R61 | E48 | CL-122 | No | New row for `data-architect`; "closed once BL-870 merges"; no BL id until #912 |
| P15 | FR-SEC-06 | E54 | CL-128 | No | Delete account: no owner check; Erase everything: owner check |
| P16 | FR-QAL-02 | E55 | CL-129 | No (the script work is `qa`) | Locked cards first, then 19, 21, 27 and function files as they merge |
| P17 | NS-40-R8 | E56 | CL-130 | Founder (legal text) | A No sends nothing, writes no server row; BL-580 deferred |
| P18 | NS-52-R10 | E44 | CL-118 | No | 200 MB floor; free >= 2 x min(bytes, 100 MB) + 50 MB; both PROPOSED |
| P19 | NS-34-R6 | E53 | CL-127 | No | Invented text only |
| P20 | EXPO_PUBLIC_DAYS_ASK | E57 | CL-131 | No | No new flag; rides on `EXPO_PUBLIC_DAYS` |
| P21 | NS-46-R25 | E57 (phone reader E64) | CL-131, CL-138 | No | A paused family gets no day notes; the phone owns the setting in Drop A |
| P22 | NS-45-R13 | E58 | CL-132 | No | R13 and R14 as written; the hiding hook exists, nothing reads it |
| P23 | NS-44-O13 | E59 | CL-133 | Founder (promise to a user) | Per phone |
| P24 | NS-45 | E58 | CL-132 | No | Reading B: the purge worker sends both emails; R17 is a test and a deployment check |

## 2. The 13 design questions (#935, answered against #978)

| Q | Row id | E | CL | Founder or counsel only? | Default that stands |
|---|---|---|---|---|---|
| P25 | DS2-03 | E69 | CL-143 | No (CDesO approves on the PR) | v2 radii, one token PR with screenshots; revert one file |
| P26 | MOTION-OPEN-2 | E69 | CL-143 | No | `spring.standard` 0.30 s; one device clip |
| P27 | NS-01-R41 | E68, E69 | CL-142, CL-143 | No | Token `mediaFrame` (dark #716A62), named in R41 |
| P28 | FOUNDATIONS-Q1 | E69 | CL-143 | No (CDesO picks from numbers) | Dim token at 35 percent; DS2-12 measures 35 or 45 |
| P29 | NS-33-R1 | E68, E69 | CL-142, CL-143 | No | Trait test; level from a VoiceOver rotor read, `[stand-in]`; row stays partial |
| P30 | FOUNDATIONS-Q5 | E69 | CL-143 | No | `glassFallback` #282421, line HC edge, 1 pt; pair tests decide |
| P31 | MOTION-OPEN-1 | E68, E69 | CL-142, CL-143 | `expo-battery` is the founder's (E67) | Lamp is the one ambient exception; Breathe retired in waiting states |
| P32 | COMPONENTS-G3 | E69 | CL-143 | No | As built: tab roots show the bar, the letter page hides it; T-MIN spike decides minimising |
| P33 | MOTION-OPEN-3 | E68, E69 | CL-142, CL-143 | No | Trim to the MOTION section 9 list with a test; first Keep keeps its one success |
| P34 | FOUNDATIONS-Q4 | E69 | CL-143 | No | Keep `moon.stars` behind one mapping entry |
| P35 | FOUNDATIONS-Q6 | E69 | CL-143 | `expo-symbols` is the founder's (E67) | Chrome only; Phosphor stays behind the Icon wrapper |
| P36 | OQ-H1 | E69 | CL-143 | No | No reserved height; an SE 3 device row decides |
| P37 | MOTION-ACCEPTANCE-8 | E69 | CL-143 | No | `MOTION.md` and `tokens.v2.json` are the only timing source |

(Q-P1 to Q-P24 are rulings 1 to 24 in the order of #934; P25 to P37 are rulings 25 to 37.)

## 3. The three items engineering asked to drop

| Item | Answer | E | CL | Founder or counsel only? | Default |
|---|---|---|---|---|---|
| CF-1 (age_signal leftovers) | Closed for the cards: NS-40-R2, R6, R7, FR-PRV-25, FR-CMP-15 and BL-577's last criterion all say `age_attested: true` and no age signal. The rest is the E63 clean-up row | E50, E63, E71 | CL-124, CL-137, CL-145 | Legal text merge is the founder's | Clean-up row for `data-architect`, never applied without `approve-migration` |
| CF-8 (region_refused at Send) | Card wording final (NS-41-R2, NS-40-R9). Same wait screen for every address; the phone holds a refusal in memory for that attempt and shows the refused screen at the code step. A security read at FP-6 checks the server answer | E62, E70 | CL-136, CL-144 | No | As written |
| Q57 (region hook fail open or closed) | Counsel's and the founder's. Product proposes sub-question (g) for Q57; it does not block the build because FP-6 builds both screens | E47, E72 | CL-121, CL-146 | Counsel only | Fail open and count; hook off until answered |

## 4. The eleven questions on the data and security pack (#999 to #1011)

Read 20 Nov by listing every issue comment and review on #999 to #1011 and filtering for the marker `<!-- req-question:`. Found on #999 (1), #1000 (1), #1001 (6), #1003 (2) and #1004 (1); none on #1002 and #1005 to #1011. #934 and #935 were re-checked: the 37 markers there are exactly P1 to P37 above, nothing new. Rule used: show less, store less, send less, undoable. Founder-only items keep a stated default and sit in the digest (`22-final-holistic-spec.md` section 7), never closed for good.

| Q | Row id (PR) | Already closed? | E | CL | Founder or counsel only? | Default that stands |
|---|---|---|---|---|---|---|
| P38 | FR-PRV-03-audit-rows (#999) | Export half only (CL-081); the screen question was not | E74 | CL-148 | No | No screen; own rows only in Save a copy |
| P39 | FR-MKT-app-user-email (#1000) | No | E75 | CL-149 | Founder (promise to a user); waitlist class is counsel's (Q34) | Transactional mail only to app addresses; waitlist never joined to accounts |
| P40 | Q-COM-1 (#1001) | No | E76, E78 | CL-150, CL-152 | The new-device part is a founder line | Only what is built or sent by the sign-in service; new-device email gated before the backup flip |
| P41 | Q-COM-2 (#1001, with Karma's correction) | No | E77 | CL-151 | No | "Sign out other devices" as built, sends no email; no sign-out-everywhere control |
| P42 | Q-COM-3 (#1001) | No | E76 | CL-150 | No | Security alerts are not held by quiet hours |
| P43 | Q-COM-4 (#1001) | No | E76 | CL-150 | No | New address masked (`a***@example.com`), or not named |
| P44 | Q-COM-5 (#1001, with Karma's correction) | No | E77 | CL-151 | No (a server count or paging job is `security-architect`'s) | No email on wrong codes; the phone pause only |
| P45 | Q-COM-6 (#1001) | No | E76 | CL-150 | No | No echo screen; the email is the record |
| P46 | F02-REQ-017 (#1003) | No | E78 | CL-152 | Founder line (what a user is told about account safety) | Not built for 1.0; built and read before the backup flip (NS-08-R21) |
| P47 | NS-26 (#1003) | Parked on record (frame row 41, card 10) but no E or CL said "no 1.0 row needs push" | E79 | CL-153 | Founder only if he reopens it; no digest line today | No remote push, no APNs key, no token table |
| P48 | FR-AIS-34 (#1004) | No | E80 | CL-154 | No | Dictionary on the phone only; server table stays unreachable |

Conflict list on #1001 (comment "Conflicts found in document 07"), not requirement questions, so not ruled here: C1 and C2 (`docs/emails/CATALOG.md` still plans one billing push and lists `welcome-coparent` and `coparent-invite` at 1.0; CL-064 and CL-063 already say no) go to `content` and `payments`; C3 (64 versus 60 notifications) is E13 and CR-69 A1, `mobile` BL-966; C5 (no hidden-preview category in `apps/mobile`) is `mobile`; C6 is Q-COM-1 (E76, E78); C4 (the birthday title) is G-D21 in `GAP-LOG.md`, a founder item whose default is already the neutral title with names off, so `content` follows that default.

## 5. Things that are not requirement questions (owner, not ruled here)

| Item | Owner and closing line |
|---|---|
| FR-QAL-02 script retarget (`scripts/trace.mjs` still reads `docs/prd/v2`) | `qa`; product text is E55 |
| CR-69 A4 "wider adoption", A12 and A13 stale lines | Engineering edits CR-69. A4 is answered by E73; A12's Q-E10 is E64; A13's questions are E43 to E59 and E69 |
| Dependencies `expo-symbols`, `expo-battery`, `expo-image` | Engineering CR-69 A8; the founder approves; digest line in E67; not added until he does |
| Folding DS2, ENG-M and ES-A into one build list (GAP-LOG:344) | Product backlog task, not a requirement; not done in this PR |
| SOQ S-1 (G1 gate) and S-4 (X2 read for NS-52 Variant A) | `security-architect` with the founder; not ruled by product |
| Plan #847 re-sync (Q8 text) | Karma; E13 and CR-69 A1 already say 60 in total |

Signed: product, for Karma.
