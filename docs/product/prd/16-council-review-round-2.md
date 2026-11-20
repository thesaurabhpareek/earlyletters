# 16. Council review, round 2: the record of the debate that locked the pack

Status: Locked v1.0, 20 Nov 2026. Owner: Karma (CTO role), with the CPO role.
Read with: `00-product-frame.md` (the rules every card follows), `15-council-review.md` (round 1), `14-test-plan.md` (gates G0 to G6), `13-engineering-plan.md`.

The founder approved the requirements on 19 Nov 2026 ("I approve all requirements.") and asked the full executive team to review, critique and give detailed feedback, and the CPO and product agents to enhance the requirements and lock them, so that engineering never needs to debate the why or the what. On 19 Nov he also delegated decisions ("Consult with exec team and make all decisions."). This file is the record of that round: who said what, where they disagreed, how each point was settled, and what changed in the cards. Every role here is a Claude role. None is a licensed lawyer, accountant or auditor, and every legal reading is marked "counsel must confirm".

## 1. How the round ran

1. Three review passes read the pack on `develop` at 697233d3, each in full, each from different lenses:
   - Pass 1: Chief Product Officer, Chief Design Officer, Chief Marketing Officer, Chief Business Officer.
   - Pass 2: Chief Privacy Officer, Chief Compliance Officer, Chief Legal Officer, CISO, Chief Data Officer, Chief AI Officer.
   - Pass 3: Chief Financial Officer, Karma (CTO, with the code read in the files named), quality.
2. Karma read every finding, checked each code claim against the files on `develop`, and wrote the rulings in section 3. Where two roles disagreed, both positions are recorded with the tie-break.
3. Apple facts were re-read from Apple's own pages on 20 Nov (section 6).
4. Four product agents rewrote the cards to the locked card shape (README, "Locked card shape"), each card carrying every applied finding. Frame-level changes were applied directly to `00`, `README`, `VISION`, `14` and the stack rank.
5. Nothing in this round decides spend, legal text, counsel's answers or a published promise. Those stay founder or counsel items and are marked in the cards.

## 2. What each role said (verdicts, in short)

| Role | Verdict before lock | What had to change |
|---|---|---|
| CPO | Most complete product record we have had; not lockable yet | Six contradictions with the record or the code (Home slip order, co-parent caption rows, stale seal reconciliation, "original" vs "stored copy", NS-13 vs shipped reminder rules); founder scenario list answered unevenly; measurement thin while analytics is off |
| Design | Standing rules right; edges not drawable | AX5 on SE 3 laid out per surface; 10 s undo windows break our time-limit rule for VoiceOver; Voice Control, Switch Control, Smart Invert, colour-independent recording state and Bold Text missing from NS-33; one Book-level explanation for new phone with backup off |
| CMO | Story stronger without more risk, if claims land in the inventory before flags | Shared letter drops fix marks, so "every change shown" is never said of it; "print-ready" becomes "printable"; BRAND.md co-parent promise; no "nothing leaves your phone" near a Siri doorway; Share earns trust, not installs; no pilot offer codes before read-out |
| CBO | Economics good; backup is the exception | Price NS-08 sizing before any flip talk; Plus's ongoing value said in one line; free stays free across 1.0.x; stored picture resolution is a one-way door |
| Privacy | Right shape; blocked on four items | Sign-out leaves a readable book (X4); NS-16 and NS-17 server data; L4 phone-only tests for place, photo text and the Find index; stale inventory home |
| Compliance | No store gate on NS-01 or NS-02 until X7 | Every Apple and legal fact re-read before submission; deletion text for pictures; plan-notice windows (Q41); accessibility claims; label unchanged while photos are local |
| Legal | Three founder-bound texts contradicted | Terms co-parent removal (NS-25 vs Q53); deletion promise for pictures; open-ended "no limit" on Read together; counsel numbers stale |
| CISO | Boundaries named, mostly machine-controlled | Label guard G11-1 must check DECISIONS.md and the label file, not PR text; device evidence on real phones (X3); system intelligence donation (X6) |
| Data | Model sound | Cards describe existing columns as new (X9); ADR 0028 classification conflict (X10); export version labels |
| AI | Constitution holds in every card | Structural tests for NS-17 other-language words, OS writing tools and donation (X6), NS-16 drift to voice attribution. Independence is of method only: one model family reviewed its own work |
| CFO | Backup flip on Free is not an option | 19 MB per active family per month, so Free storage holds about 52 family-months; every run-cost line states read date and unit; devices needed (SE 3, second phone, iPad) |
| Karma (CTO) | Seventeen engineering findings F1 to F17 | Trace cannot see NS ids (G0); P0 register gaps; existing features re-specified; photo and Find PR stacks; seal sync mechanism; reminder back-off pre-scheduled; build numbers out of cards |
| Quality | Test additions per card | New P0 rows per card (section 5); iPad and iOS 17 added to the device matrix; regression and candidate suites defined |

## 3. Where the roles disagreed, and the tie-breaks

| # | Question | Positions | Ruling (Karma, 20 Nov) |
|---|---|---|---|
| T1 | Read together "no limit" | CMO: say "Free, no session limit". CLO: an open-ended "no limit" in public binds the founder | Internal requirement: no session limit and no Plus gate. Public copy may say "Read together is free" only as the current listing does; no "forever", no "never limited". Counsel Q40 |
| T2 | New free features and principle 6 | CPO: everything free in 1.0.x never moves behind Plus. CBO: Plus needs ongoing value | Internal rule: every capability that ships free in 1.0.x falls under principle 6. Plus holds one paid act (keeping beyond the allowance); each feature raises the worth of a kept letter. Public copy says nothing either way. Founder may reverse |
| T3 | Stored picture size (one-way door) | CPO: keep pixels for print later. CFO: phone storage | Stored copy: the picked image at its own size up to 4,032 px long side, never below 2,550 px when the source is larger (8.5 inch page at 300 dpi), JPEG 0.85, metadata stripped. List copy about 512 px, page copy about 1,280 px. Camera original never stored. One term: "stored copy" |
| T4 | Undo windows and WCAG 2.2.1 | Design: 10 s windows close while VoiceOver reads | Every undo window stays open for its stated seconds, or until VoiceOver finishes the undo line plus that many seconds, whichever is later; with Switch Control on, until the parent moves on |
| T5 | Build numbers in cards | CTO: cards and roadmap disagree | Cards state order and gates only. The roadmap and engineering plan own timing |

## 4. Founder-class defaults adopted under the 19 Nov delegation

Each is reversible by the founder. Each card that applies one says "Ruled 20 Nov (Karma, council round 2)".

| # | Decision | Default adopted | Why |
|---|---|---|---|
| D1 | Sign-out and the book on the phone | Keep as built. Sign-out sheet says, as intent: "Your letters and recordings stay on this phone. Anyone who opens the app here can read them. Use Erase everything to remove them." A second account never sees, claims or uploads the first account's local letters (`[X4-R1]`) | Deleting would remove the only copy of the voice while backup is off |
| D2 | System writing tools on letter fields | Off on the Review editor, Firsts label, photo text, place, typed-day words, From name. `mobile` checks React Native exposes the switch; if not, that is a finding | A rewrite there puts machine words into a letter outside `verifyEdits` |
| D3 | System intelligence donation | Never (`[X6-R1]`) | Uncontrolled exit for letter text and child names |
| D4 | Pilot consent records | Kept 12 months after the read-out | Long enough to answer a participant, short enough to minimise |
| D5 | Hand-sent tester measures | Numbers only, founder's private sheet, deleted after 90 days | No content in the repo or a session |
| D6 | Account deleted before a seal opens | Sealed letter deleted with the account; the sheet says so | Deletion means deletion |
| D7 | Let-go draft that reached the server | Purged when the discard is acknowledged | "Let it go" must finish |
| D8 | Earlier versions | Author may remove one; raw transcript stays immutable; screen says versions are kept until removed | Parent control without touching the constitution |
| D9 | "The person speaking agreed" (NS-16) | An instruction to the parent, not an attestation; no record | We cannot verify consent of a non-user |
| D10 | Withheld other-language transcript (NS-17) | Kept on the phone and flagged; never shown, indexed, shared, printed or exported as words | No words the speaker did not say |
| D11 | Removing the other parent (NS-25) | The Terms' 72-hour undo only, until counsel Q53 | The Terms bind the founder |
| D12 | Withdrawing backup consent (NS-08) | Server copies deleted on the published clock | Matches the deletion promise |
| D13 | Device evidence | Separate install, test account with only the Asha book; no real name, letter, picture or voice in any evidence | CLAUDE.md privacy rules |

## 5. Findings applied, by theme

Cross-cutting (applied to every card where they apply):
- X1 and F10: counsel numbers moved to packet 1.5.0 (Q4 to Q45, Q2 to Q48, Q29 to Q49, Q27 to Q50, Q13 and Q26 to Q51, Q1 to Q47, Q7 to Q54). Backup is ADR 0024. Export bump rules cite the `export/schema.ts` header.
- X2: every inventory row lands in the same PR in `docs/legal/data-policy.md` section 4 and `DATA_CLASSIFICATION.md`; `privacy` with `data-architect` brings data-policy section 4 to Build 12 facts first, or the PR names `DATA_CLASSIFICATION.md` as the interim inventory.
- X3 and D13: device evidence on the Asha-only test install; evidence path `docs/qa/evidence/<date>-<build>-<phone>.md`.
- X5: every RR-5 state table carries the kill switch (`serverFeaturesEnabled()` off), the card's remote pause, and plan lapse.
- X6, D2, D3: Never line and test `[X6-R1]` on every card that stores a parent's words.
- X7 and F2: the P0 register in `14` section 7 is rebuilt from each card's Priority column.
- X8 and F11: every card carries a "Label effect" line; the G11-2 guard checks every `## NS-` heading.
- X9 and F3, F4: NS-15, NS-16, NS-29 and NS-36 rescoped to the columns that exist (`occurred_on`, `author_signs_as`, `stt_meta`).
- X10, X11, F5: ADR 0028 cited as "ADR 0028 (PR #797)" until it merges on `develop`; L3 classification for ids fixed in the ADR before NS-36-R4 counts it.
- X12: settings and picks say "Records: on the phone only. No PRIV-R21 row".
- F1: no card claims traceability until gate G0 (trace sees NS ids) passes.
- F12: every new synced column is added to the `entries` content trigger tuple and the `book_entries` view in the same migration, with a test.
- F15 and T5: build numbers removed from cards.
- F16 and T3: one term, "stored copy".

Per card (the card itself is the full record; this is the index):
- NS-01: stored copy sizes (T3); data shape, modules, error codes, budgets, flag and pause key from the CTO pass; P0 rows R30 to R32; second-account isolation.
- NS-02: FTS5 index derived, never synced or exported; one visibility function shared with seals; P0 R24, R25; split of #798.
- NS-05: shared letter drops fix marks, so "every change shown" is never said of it; temp picture removed on launch (R18).
- NS-06: sync of first fields through the trigger tuple and view; seal sync mechanism chosen in the card (F13) with two-phone test B8b; undo windows per T4; D6.
- NS-07: "printable", not "print-ready"; G11 guard checks DECISIONS.md and the label file (CISO).
- NS-08: ADR 0024; sizing at 19 MB per active family per month; Storage not in the nightly dump on Free; D12.
- NS-09: failure counter persists (R6); D7.
- NS-10: kill switch at sign-in; one Book-level explanation when backup is off.
- NS-11: copy holds every stored picture when photos are on (R10).
- NS-12: new read RPC with its grant; D8.
- NS-13: back-off pre-scheduled into the plan (7 daily, weekly for 4 weeks, then none); clamp 07:00 to 21:30; at most one notification a day across books; P0 R18, R19.
- NS-14: reuses the child switcher; no data change.
- NS-15: size S; Review dateline opens the existing DateSheet; `BACKDATE_YEARS = 3`; BL-944 superseded.
- NS-16: 1 to 30 characters, settable only before first upload; D9; R6.
- NS-17: extends `language-hold.ts`; D10.
- NS-23: changes the built resurfaced card to "the same day of an earlier month or year"; reconciled with #721.
- NS-25: Terms 72-hour undo until Q53 (D11); gates add #827, Q48, Q49.
- NS-32: comes before NS-13; #758 reworked without Memory Library classes; plan notices outside the budget.
- NS-33: Voice Control, Switch Control, Smart Invert, colour-independent recording state, Bold Text added.
- NS-36: export 1.7.0 adds only `photos/`; R7 schema round trip.
- NS-37: list and page derivatives written by the stored-copy writer; erase removes all three files.
- Home slips: one fixed order, registry test fails on an unregistered slip (frame `[FRAME-SLIP]`).

## 6. Apple facts read on 20 Nov 2026

From Apple's own pages, read in session: guideline 4.5.4 names push notifications; 2.1(a) asks that placeholder and temporary content be scrubbed; 2.5.19 forbids hidden or undocumented features; `PHPickerViewController` needs no photo-library permission; notification "Show Previews" is a user setting the app cannot change, and an app may set `hiddenPreviewsBodyPlaceholder` on a category. The Compliance role's standing rule holds: every Apple and legal fact is re-read from the source before submission.

## 7. What was not applied, and why

- CMO "Free, no session limit" in public: replaced by T1; an open-ended public promise binds the founder.
- CBO "Plus needs new paid features": replaced by T2; moving a free feature behind Plus later is the move that always costs reviews.
- Deleting the book on sign-out: rejected (D1); it would destroy the only copy of the voice while backup is off.
- A server table for consent to NS-16 speakers: rejected (D9); we cannot verify a non-user's consent and a record would be false comfort.
- Build-number timing in cards: removed (T5); the roadmap owns it.

## 8. What stays open (not ours to close)

- Counsel: Q40 (Read together wording), Q41 (plan-notice windows), Q45, Q47 to Q51, Q53, Q54, and the label read for pictures. Every card that depends on one names it as a gate.
- Founder: spend (devices, EAS beyond Free, any paid Supabase plan), any published promise, dates. The CFO numbers in `00` section 9 are the inputs.
- Engineering: G0 (trace sees NS ids, rework of #819) and ADR 0028 merging on `develop` (#797).

Karma
