> v2-era document; dispositions superseded by spec section 27 and 27b at PR #1314; kept as review history.

# Moments tab: reconciliation and founder decisions

Status: PROPOSED. Docs only. Nothing here is decided, built or in `DECISIONS.md`. 21 Nov 2026.
Author: reconciliation lead, for the founder. Fictional family Asha only. Not legal advice; every legal or store point is "counsel must confirm".

Read: the brief, 27 lead docs (P1-P5, D1-D6, A1-A5, T1-T5, X1-X6, B1), and PRs #1264, #1267, #1269, #1270, #1276. A3 to A5, T-docs and X-docs on PRs #1277 to #1279 are the same branches. No p6 or d7 exists. Items I took from the coordinator and did not re-read are marked "(per integrator)".

## 1. What the founder asked, and where it is answered

1. "Basically learn from this and do what this does in a smarter way and relevant to my usecase. This is really critical for me. Doesn't need to be a half sheet but this can be one new tab like explore etc or suitable word." Answered by: P1 (job), D1 and PR1270 (layout), D3 (cards), PR1269 (what is possible), B1 (market).
2. "The default tab can be showcasing value props nicely and if not given permission for your photos then get that permission. If you gave them show relevant things like screenshots I provided." Answered by: P3, D2, D5 (value and ask), T2 and A3 (motion), X1 and X4 (App Review limits on forcing access).
3. "Assign 5 product leads 5 design leads 5 animation leads and 5 transition leads and 5 xfn leads ..." Done: P1-P5, D1-D5, A1-A5, T1-T5, X1-X5, plus B1, D6 and X6.
4. "It doesn't need to be default but think if it can be second tab or centre tab or how we organise ... reason to come back everyday ... email nudges and push notifications nudges not just this app feed." Answered by: P1 section 4 and 6, P2, P5 section 7 and 8, X3 section 11 to 13, X6.
5. "Think we go with Moments". Answered by: D6 and PR #1276 (open, awaiting your merge; you said "Change brand.md and I approve moments").
6. 21 Nov, relayed by the coordinator: send "the signal of occasion and some meta data info"; only after photo access; the email is a lifecycle email, not marketing. Answered by: X6.

## 2. The converged design, in 15 lines

1. Name: Moments, approved. In app only. Not in store text until a trademark check (X1 Q-X1-12, D6).
2. Job and verb: "I go to Moments to choose a day to tell {child} about." Verb: choose (P1, D6).
3. Position: second of four, Home, Moments, Book, Me. Home stays the landing tab. 19 of the lead docs agree.
4. Dissent: A1 4.8, A2, A3, A5 and D4 are written as if Moments is the landing tab. They predate or ignore the UPDATE. They need a pass (table row 1).
5. Two parts: For you (typed days, age days, a year ago, prompts, pictures already picked) and Recent (days of pictures, newest first, only with access).
6. Phase 1 has no library: no usage string, no entitlement, no PhotoKit. BL-1305 untouched (X3 s14, P5 O2, PR1269 s9).
7. Route A (Apple's picker): no library permission, Apple draws the sheet, needs iOS 17.2 and an entitlement. A door only. It cannot feed Recent, push or email.
8. Route B (our own on-device read, Limited honoured): the only way to show Recent in our design. Dates and pictures only. No title, place, person guess.
9. Phase order is still split (table row 14). Not one doc says build both at once.
10. Permission flow: value first with Asha examples, one plain sentence, one tap, then Apple's sheet. Not now is comfortable. Denied, Limited and Restricted all still show real things. One ask, never repeated.
11. Grouping rules (NS-51-R7, numbers ASSUMED until a spike): a local day with at least 5 pictures, or 4 within 3 hours, or at least 1 on a marked day. Newest first. 90 day window. No counts.
12. Cards: paper content, glass only on controls. One day card with a collage, a date line, the parent's own label, a compose button. Set aside with Undo, kept on the phone as a day key.
13. Motion: paper first, nothing moves under the thumb, no loops, no shimmer, no count animation, controls never animate in, Reduce Motion is a cross-fade (A1).
14. Nudges: local only, planned while the app is open, identical words to the ordinary evening reminder, no library signal in push or email. No tab badge or dot.
15. Email: not at 1.0. If you want it, a lifecycle email to the account address, designed to the stricter commercial standard (sender, truthful subject, postal address, one-click unsubscribe, its own switch). Whether it is transactional or commercial is counsel's call (X6, CQ-17).

## 3. Contradictions between docs

Resolutions are recommendations. Owners are role names.

| # | Topic | Doc A says | Doc B says | Recommended resolution | Owner |
|---|---|---|---|---|---|
| 1 | Tab position | A1 4.8, A2, A3 first render, A5, D4: Moments is the default landing tab; A3 argues an inline primer on it | P1-P5, B1, T1 s4, X1 row 2, X3, X4 s11, PR1270, PR1269 5.4: second of four, Home default | Second of four, Home default. Rewrite A1-A5 and D4 landing text. A3 primer stays inline on the Moments tab, not on Home | animation, design, product |
| 2 | Typed days known to the server | Brief, P1 6.2 (unverified), B1 s7, PR1270, X1 9.1: server knows them | X3 s2, X5 F6, X6 F2, P5 OQ-5, T5, X2: never (ADR 0032, NS-47-R11, NS-46-R47, BL-1307) | Not server-known. No email from typed days. Brief wording is wrong | founder confirms; data-architect |
| 3 | Child date of birth in email | X3 s12, P1 6.3, P2 8.4, P5 7.1, B1: a month-age or birthday email is fine if the server holds the date | X2 F2, X4 F4, X6 F5, D4 of X6: CATALOG lines 139 and 161 bar it | Not at 1.0. A parent-chosen date is safer than a computed one (X6 Tier 2). CQ-21 | founder, counsel |
| 4 | Ids ML-3, ML-6 | Brief, P1, P2, P3, P5, A-docs cite ML-3 and ML-6 | PR1267 s1, X3 s2, X1: no such rows in the repo. Text is NX-39 ruling 3 and K1 (no library notification) and NX-39-R16 (date range, no place or thumbnail). ML-4 exists (wheel, X5) | Cite NX-39 ruling 3 and NX-39-R16 until product confirms the ML numbers. The ML Project doc is not readable here | product |
| 5 | Index contents | ML-4 (via PR1264, X5): no asset id or derived value kept; BL-877: no per-asset row | NS-51-R6 as amended by E37: up to 30 moments, up to 6 identifiers each, L4 | X5 option P: store no library identifier, rebuild from dates (PR1269 2.4: lost index costs one fetch). Needs your word (F1) | founder, data-architect |
| 6 | Rule numbering J3 vs J4 | Brief: "J4 only Home starts a letter" | P1 s2 and s11: it is J3 in NEW-SCOPE-INDEX s5; PR1270 s0: J2, J3, J8 | Cite by IA-R3, N3, NS-35 until the charter text is found | product, content |
| 7 | Tab after Keep | Brief asks a return to the tab (A4 R20) | T1 R15, T3 R25, P4 s8: land on the Book as today | Book for 1.x. Test return-to-tab with five parents. Your call to change | founder |
| 8 | Where a notification tap lands | T5 s4.2: Home (a different landing would reveal a moment-driven nudge) | T1 (cold start lands on Moments), P4 OQ-P4-1, X1 R8, PR1267 s10: opens the tab. T1 also found cold-start taps land Home today | Home, same as every evening reminder. T5 reasoning is the stricter one | transition, privacy |
| 9 | Empty and Limited state | PR1270 s11: "No days to show yet." for Limited too | NS-51-R18: Limited shows no message. T2 R19 split: full access gets one quiet line, Limited none. D3 R19: note with Choose more at the top; PR1270 and P3: control at the foot | Limited silent. One quiet "Choose which pictures" control, at the foot. Full access, no day: one line | content, design |
| 10 | Denied state wording | Wheel NS-53-R4, Q-HEW-3: after No no screen mentions access | P3 7.4, PR1269 s4, D2, D5: one calm line and Open Settings, on the tab only | Not now: nothing. Denied: one calm line and Open Settings, tab only, never Home. Restricted: line only | founder (Q-HEW-3) |
| 11 | When the ask may appear | X2 Q2, P5 RV-2: only after the first kept letter | P3, D2, PR1269 s4, X3: on a tap in Moments any time after first run | Tap only, after first run. Gating on a first letter is the stricter choice (decision B3) | founder |
| 12 | Set-aside flag storage | T4 OQ-T4-4, P2 R24: inside the NS-51 index file | X5 R3: its own table, day key only; X3 s7: a separate decisions store | One phone-only decisions store, day key and time only, wiped by Turn off and Erase. Not in the index | data-architect |
| 13 | Tap target in a collage | A2 s306: the whole collage is one target, tiles are not | T4 R1 and D3 s7: tiles open the viewer; D3 R25: tiles 96 pt | In the feed, one target opens the day. Inside the opened day, tiles open the viewer | design |
| 14 | Route order | PR1269 s9, P3, X4 s12 and CQ-19: Route A first, cheaper (about a third of B), friendlier to 5.1.1(iii) | X1 s16, X2 Q1, X3 s5, PR1267 CQ-8: Route B first or as the engine. X1 Q-X1-2: do not ship A. X3: A is an optional door, not in phases 1 and 2. X5 and T3 specify A as if it ships | Phase 1 first. Run spikes D1 to D4 before choosing. Default B as the engine, A only after the entitlement answer. T3 and X5 keep A as an adapter | founder |
| 15 | Route A and iOS floor | PR1269 s7, X4 R13, D3 Q14, X1: keep 17.0, hide the A control below 17.2 | D2 Q4: hide the tab or degrade | Keep 17.0 (D-098). Hide only the A control. The tab stays | mobile |
| 16 | Apple's title | NS-49-R9: "From your phone: {title}" may show | Brief, P4 OQ-P4-8, X2 Q5: never stored or shown | Follow the brief. Reword NS-49-R9 | founder |
| 17 | Label claim | PR1267 s0, CQ-1: "Data Not Collected" | X2 F1, X4 R19: label of record answers Yes for five types, so say it per type: "Photos or Videos: not collected", true only while attached pictures do not sync (NS-52 Variant B) | Per type. Privacy rewords | privacy, legal |
| 18 | Year-ago letter home | P1 RV-11, P2 Q2: moves from Home to Moments | Wheel and NS-50-R5: stays on Home rank 4 | Move it while Moments is on. Founder call | founder |
| 19 | Tab name | D5: recommends "Gather" (withdrawn); PR1270 picks "Days"; P2 verb "look back" | D6, #1276: Moments, verb choose | Moments. Drop D5 s4 and PR1270 s2 | content |
| 20 | First-view arrival motion (per integrator) | A1: enter dy 8, 280 ms | A1 row 2 and A3: heroEnter dy 12, 420 ms, first view only; T1: opacity 0.6 to 1, y 6 to 0 on the Book spring. Reduce Motion variants differ | One token set from A1, T1 reads it. Reduce Motion is a plain fade for all | animation, transition |
| 21 | Placeholder grace (per integrator) | A1 R8 and Q5, A5 R14: measure on a device | A3 R14: fixes 300 ms | Do not fix a number before the SE 3 run. A3 becomes "to be measured" | animation |
| 22 | K-02 (per integrator) | T1 R24: not touched; T2 line 511: stays | T2 line 22: touched; X1, X3, X4 differ | Not reopened under second-of-four. A tap-only ask on Moments after first run is the one change. State it once | product |
| 23 | Reversal lists (per integrator) | Each doc lists a different set (BL-1305, ML-6, J4, NS-51 R1, R8, R19) | None is complete | Use the single table in section 4 | product |
| 24 | Collage cap (per integrator) | A2 R5 open | T4 and X3: up to 4 tiles; NS-51-R6: up to 6 identifiers | 4 tiles, up to 6 in the opened day, "Show all" with no number (T4) | design |
| 25 | Thumbnail cache (per integrator) | A5 flags the image library's disk cache | T4 R8: never to disk; A3 R13: memory only | Memory only. No disk cache for library assets. Allow the image library only if mobile proves the disk cache is off | mobile |
| 26 | Haptics (per integrator) | A3: none for grants | A4: the existing success haptic on Keep; T2 did not read SOUND.md | Existing Keep haptic only. Read SOUND.md before sign-off | animation |
| 27 | Server features in store builds | X1, X3, X5: store build is server-free | X6 F1: eas.json has server features on in production and preview | X6 is right per its read. mobile confirms. Email and sync claims change with it | mobile |
| 28 | Motion helper | A1, MOTION 5j: Low Power Mode via a battery module | A5: that module is not in package.json | Drop the helper. The system already reduces animation | mobile |
| 29 | Stale cross references (per integrator) | Several docs say the privacy, feasibility and concept docs do not exist | They are PRs #1267, #1269, #1270 | One reconcile pass on cross references after merge | each lead |
| 31 | Old tab name keys (per integrator A) | D5 MT-D5-F1: `gather.*` keys and `notifications.gather.*` push keys; D2, P1 call Moments a working label | Founder approved Moments. D6 s6 lists the edits | Rename keys to the Moments label once #1276 merges. Push keys stay neutral text | content |
| 32 | If Moments were default (per integrator A) | P3 5.3: default only after the first kept letter, so K-02 holds | P4 4.1, P5 4.4: a flat default. P1-P5, D1, B1: Home default | Moot under row 1. If you ever choose default, use P3 5.3 | founder |
| 33 | Ask at 1.0 (per integrator A) | P5 s4 O2: tab ships with Asha examples, no ask, no usage string, no PhotoKit | P3 6.3, D2 S1 to S3: the ask shows on first open | Phase 1 has no ask button (PR1269 s9). Design the ask screens now, ship them with Route B | product, design |
| 34 | Email at 1.0 (per integrator A) | P1 s6, P5 RV-6: none at 1.0 | P2 s8: birthday and month email as an opt-in class; B1 s7: optional weekly email | None at 1.0, per decision 13. P2 s8 and B1 s7 are design only | founder |
| 35 | Length of Recent (per integrator A) | P2 R18: one screen, no Show more | D3 s9: first month newest first, then more; P3 Q-P3-6: 14 days | One screen, no count, no older link (wheel NS-53-R9). Window set by the spike | product, design |
| 36 | Deadlines (per integrator A) | P1 Q-P1-1: Mon 24 Nov, tied to Q-HEW-1 | Other docs: 28 Nov, 1 Dec, "before build" | Section 5 sets three dates. The Build 13 freeze date was not read by any lead | product |
| 37 | VoiceOver count (per integrator A) | NS-01-R11: no count | NS-52-R28: "Picture 2 of 4" | R11 is the Book lens, R28 is inside one letter (P4 OQ-P4-9). A position inside one letter is not a count of gaps; reviewer confirms | reviewer |
| 30 | Wheel timing | PR1264 Q-HEW-1: the tab is Drop C (after 1.0) unless you say otherwise | P5 O2: tab first, library in 1.0.x; X3: phase 1 in Build 13 scope | Tab shell without library in the first public build if you rule before freeze. PR1269 R1 says keep it out of Build 13 | founder |

## 4. Reversals you own, deduped

You said (relayed by the coordinator, 21 Nov): "change any of our current principles because if we don't solve customer problems there's no value of these principles". A principles review is on `wip/moments-principles` and the master PRD on `wip/moments-prd`; I read neither. This table stays your list. The constitution (the machine never adds meaning) is on none of these rows and no lead proposed touching it.

Each earlier ruling is overturned or bent. Marked R for needed, O for only under an option.

| Earlier ruling | Needed for | Our default |
|---|---|---|
| Three tabs (infra scope-stack ruling, IA-R1, N1, N4, D-161) | Any tab (R) | Accept, four tabs |
| J3/J4, NS-35: only Home starts a letter | Capture from a card (R) | One `moment` doorway, hand-off to Home's capture |
| NS-51-R1: only the Me row asks | Ask on the tab (R) | Tap only, once |
| NS-51-R8, R7, R40: newest only, no list | Recent (R) | One screen, no count |
| ML-6 / NX-39-R16: no thumbnail | Thumbnails (R) | Own pictures on the phone only. No place |
| BL-1305, NS-49-R25: no usage string, no PhotoKit in 1.x | Route B (O) | Keep for the first build; lift for one flagged profile |
| K-02: no ask in first run | Only if landing is Moments (O) | Not reopened |
| NS-50-R5: past letter on Home | Moving it (O) | Move |
| ML-3 / NX-39 ruling 3 and K1: no library-timed notification | Library nudge (O) | Not at 1.0 |
| NS-51-R26, E75, FR-MKT-44, CATALOG principle 5 and line 161 | Any email (O) | No email at 1.0 |
| D-098 floor 17.0 | Only if you raise it (O) | Keep |
| NS-49-R9 Apple title | Route A (O) | Never shown |

## 5. Founder decisions: answer in under ten minutes

Pick A or B. If you say nothing by the deadline, our default applies for docs and test builds only, never for public text.

By Mon 24 Nov (blocks design and build rows):
1. Four tabs, Home, Moments, Book, Me. A: yes (recommended). B: no, put it in Home as a card group (weaker for push and links).
2. Moments is not the landing tab. A: agree (recommended). B: make it landing after the first kept letter only (P3 5.3).
3. First public build holds the tab with no library. A: yes, no permission, no usage string (recommended). B: wait for the library part.
4. One `moment` doorway so a card can start a letter. A: yes. B: the card opens Home with the item chosen.
5. After a letter is kept, land on the Book. A: yes (recommended, T1, T3, P4). B: return to Moments.
6. Apple's title is never shown by us. A: yes (recommended). B: allow "From your phone".

By Fri 28 Nov:
7. Library route first. A: Route B behind a flag, A later as a door (recommended). B: Route A first if Apple grants the entitlement. Both after the device spikes.
8. Ask for photos: A: on a tap in Moments after first run. B: only after the first kept letter (X2 Q2).
9. No stored library identifier (X5 option P). A: yes (recommended). B: keep up to 6 per day (NS-51-R6).
10. Past letter moves from Home to Moments. A: yes. B: stays on Home.
11. Denied: A: one calm line and Open Settings, tab only. B: no words (wheel).

By Mon 1 Dec:
12. Push: A: local only, planned while the app is open (recommended). B: also a library-timed local note in the identical-words form, own switch, off.
13. Email: A: none at 1.0 (recommended). B: lift E75 in phase 2 for one lifecycle email to the account address, opt-in, off by default, one parent-chosen date, at most one a week (X6 D1, D3, D11). Not by date of birth (X6 D4).
14. Raise the iOS floor to 17.2. A: no, keep 17.0 (recommended). B: yes.

## 6. Counsel questions: the ten that block a store build

Raw counts: CQ-1 to CQ-15 (PR1267), CQ-16 to CQ-22 (X4), Q-X1-1 to Q-X1-12, CQ-X2-1 to CQ-X2-6, and X6's own. Many repeat. Top ten:

1. Route B in a 1.x build, label kept (CQ-1, Q-X1-1). Also CQ-19: why the out-of-process picker is not enough (5.1.1(iii)).
2. Does a tap-only ask with a working No meet 5.1.1(iv) and 5.1.2(i) (CQ-7)?
3. Label per data type, and the policy sentences that must change in the same build (CQ-9, X2 F1 and F3, Q-X1-10).
4. Purpose string wording that names the reminder use, if a nudge ships (5.1.2(ii), X4).
5. Is a picture-timed local reminder barred by 5.1.2(vi) or 4.5.4 (CQ-14, CQ-16, Q-X1-6)? Does its existence disclose a fact (CQ-12, Q-X1-8)?
6. Pictures of other people and other children, shared books (Q-X1-3, CQ-X2-3, CQ-X2-5).
7. Face imagery and biometric laws when we show but never process faces (Q-X1-4); the actual-knowledge duty (Q-X1-11).
8. Route A: entitlement review and DPLA 3.3.3(H) "journaling purposes" (CQ-2, CQ-3, Q-X1-2, Q-X1-5). Blocks A only.
9. Coordinates to Apple's geocoder (CQ-4). Default: avoid, no place. Blocks nothing if we keep it out.
10. Lifecycle email: transactional or commercial (CQ-17, CQ-X2-4, X6), month-age timing (CQ-21), the tab name in store text (Q-X1-12).

## 7. What cannot be verified without a real iPhone

Nothing below was run by any lead. Hardware is required.

- Route A (PR1269 D1): entitlement through Expo signing; picker from a hosted view; photo URL lifetime; can types be limited to photos; weak linking on 17.0 and 17.1; first-use consent sheet.
- Permission states (D2): not determined, Limited, full, denied, Restricted; automatic alert suppressed; limited picker; status after a Settings change. The alert key name is read from Apple's page (PR1269 4.1).
- 20,000 picture library on an iPhone SE 3 (D3): fetch time, index build, memory, cold start p50 1.2 s and p90 2.0 s.
- Limited and new pictures (D4, BL-871); iCloud-only thumbnails; time zone change moves a day.
- Background behaviour (D5, BL-872, 14 days): only if a background top-up is ever wanted.
- Tab order from declaration order (D6, simulator is enough).
- Accessibility walk W1 to W12 (D4 doc): VoiceOver, AX5, Bold Text, Reduce Motion, Reduce Transparency, Increase Contrast, greyscale, one hand, Voice Control, Switch Control. A simulator pass does not count for W1, W2, W5, W8, W9, W10, W11.
- Motion on device (A2, A5): hitches, frame time on 60 and 120 Hz, Low Power Mode, Prefer Cross-Fade.
- Does a cold-start notification tap land Home today (T5 Q5)?
- Local notification timing and quiet hours with a time zone change (Build 13 rows).

## 8. Build phases and gates

Phase 1, no library. Tab, intro with Asha examples, For you from dates, typed days, a year ago, prompts, pictures already picked, the existing system picker. No usage string, no entitlement, BL-1305 untouched. Gate: your decisions 1 to 6 and the words.
Phase 2, Route B behind a flag, off in every profile until gates close. Gates (P5 G1 to G7): device spike, counsel read, five-parent check, accessibility pass, content rules, your signature on the reversals. Native module PRs open only after the photo lane merges (PR1269 R2).
Phase 3, Route A as a door, and any library-timed local note. Gate: the entitlement answer, spike D1, counsel (CQ-2, CQ-16), your decision 12.
Nudges only after consent: no library read until the parent says yes; no library signal in push, email, analytics, logs or crash reports.
Email: dark first, send-to-self, own switch. Designed to the stricter commercial standard whatever counsel calls it.
Server note: X6 says production has server features on. Confirm before any "server-free" claim.

Effort ranges from PR1269 section 6. ASSUMED: S is 1, M is 2.5, L is 5 agent-days, plus or minus 50 percent, excluding review, device time, counsel and founder hours.

| Piece | Agent-days (ASSUMED) |
|---|---|
| Tab shell, second of four, Home landing | 2 to 3 |
| Tab shell if landing changes | 6 to 8 |
| No-permission blocks | 4 to 6 |
| Value-prop view and words | 3 to 4 |
| Route A | 8 to 11 |
| Route B | 28 to 34 |
| Local moment nudge | 2 to 3 |
| Spikes D1 to D4 | about 2, plus a phone |

## 9. Still being written

- No p6, x6-beyond-this, or d7 other than X6 (found, read, 555 lines). B1 branch exists.
- PRs open and unmerged: #1264 (wheel, being reworked for the tab), #1267, #1269, #1270, #1276 (your merge), #1277, #1278, #1279.
- D6 DECISIONS entry is ready to paste; the number must be checked.
- A one-time pass to align A1-A5 and D4 landing text (row 1) and the cross references (row 29).
- Not done: no screenshots opened, no BACKLOG or CLAIMS edit, no PR.
