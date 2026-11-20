# Engineering plan: size, skills, order and dependencies (Karma, 19 Nov 2026)

Status: CURRENT | Updated: 20 Nov 2026 | Load when: you need sizes, skills, order or dependencies for NS-01 to NS-52 (cards 19, 21 and 27: section 3H).

> SUPERSEDED-BY 23-dependency-map-and-plan.md sections 2 and 2.1 (parts only: section 4 Order and section 5 Dependencies in one picture; sizes in section 3 stay CURRENT) | 20 Nov 2026 | Source: 23 section 8 | Registry: REGISTRY.md

Status: Locked v1.0 with the pack, 20 Nov 2026. Council round 2 rescopes (NS-13, NS-15, NS-16, NS-23, NS-25, NS-32) are applied in section 3; the cards win wherever this file and a card differ.

For the harness and the engineers. The product cards say what and why; this file says how big, who, and in what order. It sets no dates: release dates are the founder's. Sizes are estimates [E] and are re-sized by the engineer who picks the work.

## 1. How to read a size

| Size | Means |
|---|---|
| S | One change inside the review limit (400 added lines, 20 files), no native code, no schema change |
| M | Two to four such changes, or one with a local migration |
| L | Five or more, or a native module, a server schema change, a new entitlement, or a counsel gate on the build |

Every change costs two counted reviews of different lenses and green CI. Review, not building, sets the pace. Device time is batched: one run sheet per build, run by the founder.

## 2. Skills (agent handles in `agents/roster.json`)

| Skill | Handles |
|---|---|
| iPhone app screens and flows | `mobile` |
| Sync, server functions, API contracts | `sync` |
| Database, access rules, migrations | `data-architect` (with `data-steward` review) |
| Native modules (Swift) | `mobile`, reviewed by `security-architect` |
| Words | `content` |
| Design system, accessibility | `design-systems` |
| Privacy, data inventory | `privacy`, `compliance-engineer` |
| Legal drafts for counsel | `legal`, `regulatory-affairs` |
| Tests, device run sheets, traceability | `qa` |
| Research with parents | `user-research` |
| Requirements, backlog order | `product` (run by an interactive session; the agent has no backlog owner name) |
| Release tooling, CI | `ops` |

## 3. Buckets, with size and skills

### A. Keeping

| Card | Size | Skills | Depends on | Gate |
|---|---|---|---|---|
| NS-09 Let it go finishes | S (3 changes) | mobile, content, qa | none | founder approves one line |
| NS-10 New phone, last gap | M | mobile, qa | none | device row on two phones |
| NS-08 Backup readiness | S to M (reads and notes; code not read) | sync, security-architect, privacy, ops | none | flip is a founder decision with six conditions |
| NS-11 Save a copy | S | mobile, content, design-systems | none (it lives in Me and on Home) | founder approves words |
| NS-12 Earlier versions | L (versions enter the sync contract) | mobile, sync, data-steward | NS-21 | retention and removal decided |

### B. Capture

| Card | Size | Skills | Depends on | Gate |
|---|---|---|---|---|
| NS-13 Reminders proven | M (the back-off is pre-scheduled in the plan; sign-out must cancel; one note a day across books) | mobile, qa, content | NS-32 (ruled 20 Nov: NS-32 first) | device run with a time-zone change |
| NS-14 Whose book | S | mobile, design-systems | none | none |
| NS-15 Another day | S (rescoped 20 Nov: `occurred_on` already stored, synced and exported; Review dateline opens the existing DateSheet; BL-944 superseded) | mobile | fills an NS-21 row | none |
| NS-16 Someone else speaks | S to M (rescoped 20 Nov: `author_signs_as` exists, 1 to 30 characters, insert-only) | mobile, content, privacy | none (it lives on Review) | counsel (Q45, Q46, Q48, Q54(f)) |
| NS-17 Second language | L per language | speech, content, qa | none | native reviewer and the founder |
| NS-18 Typed days | S to M | mobile, content | NS-32 | none |
| NS-19 Continue a draft | L | mobile, data-architect | NS-35 | constitution review |
| NS-20 Two books | L | data-architect, sync, mobile | a product decision | none yet |
| NS-04 Hands-free spike | S (time-boxed) | mobile | NS-35 | its own exit criteria |

### C. Reading and keepsakes

| Card | Size | Skills | Depends on | Gate |
|---|---|---|---|---|
| NS-21 Letter page list | S | mobile, design-systems | NS-33 (same files) | none |
| NS-22 Calm header | M | design-systems, mobile | NS-02 landed | none |
| NS-01 Photo | L in total, split into five slices | mobile, security-architect, data-architect, privacy | slices 1 and 2: none; slice 3: NS-36; slice 4: NS-35; slice 5: NS-37; fills an NS-21 row | label line read by counsel for store builds |
| NS-02 Find | M (built; a draft, #798) | mobile, privacy | NS-36 | device row |
| NS-23 One past letter | S (changes the built resurfaced card; reconcile open #721) | mobile, content | NS-21 | none |
| NS-24 Read the year back | S to M | mobile | none | none |
| NS-06 Firsts and seals | M (Firsts), L (seals) | mobile, sync, data-architect, legal | NS-05 Level 1 shipped; five-parent study; NS-36 seal clock (Part B); fills NS-21 rows | counsel on seals |
| NS-07 Printable book (PDF) | M | mobile | NS-36 export rule | proof-book spend for layout numbers |
| NS-29 Read-along | L | speech, mobile | engine keeps word timings | none |

### D. Family

| Card | Size | Skills | Depends on | Gate |
|---|---|---|---|---|
| NS-03 Pilot | S (no code) | user-research, legal | none | counsel reads consent texts |
| NS-05 Share one letter, text | S to M | mobile, content | NS-21 | words approved; no recording path |
| NS-25 Other parent in store app | L (the rank file's "S to M" was for switching it on only; the gates make it L) | sync, mobile, data-architect, security | the co-parent backlog rows | counsel (Q49, Q48, Q53) and the founder |
| NS-26, NS-27, NS-28 | L each | not started | NS-25 | X2 for NS-28 |

### F. Foundations

| Card | Size | Skills | Depends on | Gate |
|---|---|---|---|---|
| NS-34 Speed baseline | S (a run sheet) | qa | none | the founder's phone and time |
| NS-33 Accessibility floor | S (2 changes) | design-systems, mobile, qa | none | device walk |
| NS-35 One start | done (#828, `5f5dfaf4`) | mobile | none | none |
| NS-36 Data follows the letter | S to M | data-architect, privacy, mobile | ADR 0028 accepted | data inventory rows |
| NS-37 Book stays fast | M | mobile | NS-01 slice 2 (the native module) | device row |
| NS-32 Notification budget | S to M (rework #758 without Memory Library classes; plan notices outside the budget; no backlog row yet) | mobile | none | none |

### E. Engineering only (no card)

| Item | Size | Skills |
|---|---|---|
| Split the oversized photo change into five | M | mobile |
| Doc and code drift list, copied into the repo and fixed | S | product, mobile |
| Low Power Mode guard for loops | S to M | mobile |

### H. Added 20 Nov 2026 (cards 19, 21 and 27)

Sizes, per-row build order and the hand-off to the harness are in `24-engineering-handoff.md` (being written); the full dependency map and plan are in `23-dependency-map-and-plan.md` (being written). This section only names the rows and prerequisites so the two stay the one source; if they differ, 23 and 24 win.

| Card | Skills | Hard prerequisites (not built unless stated) | Gate |
|---|---|---|---|
| NS-38 to NS-45 first run (card 19) | mobile, content, qa, privacy, legal | NS-10 and NS-35 (built); area E design; BL-994 | Karma's rulings on card 19's open items; counsel on agreements and age |
| NS-46 Days we mark | mobile, content, privacy | `lib/reminders/budget.ts` (the one-a-day chooser; does not exist); BL-966; BL-982 typed days; BL-985 quiet reader (`Child.quiet` has no reader, errata E16); BL-963 slip registry; planner gate split so day sources do not need evening reminders on; `dateOfAge` moved to `packages/core` (R-IA-1) | Counsel on any copied table licence; tradition-member review |
| NS-47 Cultural background | mobile, privacy, security-architect | Days store (L4, excluded from backup, registered and Erase-scanned: BL-961); NS-46 is one release unit with it | Counsel CUL-Q5 to Q7 and Q11; J-CUL-01 device walk |
| NS-48 Notification catalogue | mobile, content | Phase 1 none; recency needs the NS-13 anchor and back-off; selection a pure function of cell and slot ordinal (no stored "last key") | Content owns the words; rules-test coverage (NS-48-R28) |
| NS-49 Picture-first and Suggestions | mobile (Swift), security-architect, privacy | Level 1 needs NS-01 on `testflight` (the `photo` start is reserved in `start-capture.logic.ts:20`); level 2 needs the journaling entitlement, a weak-linked module guarded for iOS 17.2 (floor is 17.0) | Security read; counsel; launch run on iOS 17.0 to 17.2 and 26 |
| NS-50 Home today | mobile, design-systems | The slip host and registry (BL-963); NS-46 days store | Tree test T3 before any strip |
| NS-51, NS-52 (card 27, being written) | to be set in 24 | Direction in `26-founder-direction-photos-library-and-media.md`; reverses level 3 closed, no video, one picture per letter | Founder confirms limits; counsel and security; no card yet |

Superseded corrections, each from `tools/review/ns46-50/mobile.md` (code read, nothing run on a device):
- Superseded: "one note a day across books" (NS-13 row, NS-32 row) read as built -> not enforced anywhere; the planner can send two notes on one date and `plan-reminders.ts` is a second scheduler with its own cap of 4 (M-01); `budget.ts` is a hard prerequisite of NS-46 and NS-48.
- Superseded: the 35-day horizon (NS-13 row, "back-off pre-scheduled") as an iOS rule -> NS-13's own policy; library days plan on their own horizon (M-06; card 21 RV-4).
- Superseded: "60 budgeted plus 4 plan notices" -> 60 pending in total with plan notices first (errata E13; M-07).
- Superseded: `[FRAME-SLIP]` and a Home slip registry as existing -> not built; BL-963 (M-13).
- Superseded: a quiet book is skipped by reminders -> `setChildQuiet` has no planner reader (M-01 evidence; BL-985).

## 4. Order

The harness picks any row whose dependencies are done. This is the order of preference when several are free.

| Wave | Work | Why first |
|---|---|---|
| 1 | NS-09 (#832 merged; BL-926 left), NS-34 run sheet, NS-33, NS-10, NS-32 (#758, a draft since 10 Nov), NS-03 kit, NS-01 photo as eight PRs, all slices (in progress); NS-35 merged and NS-36's ADR accepted (CR-62) | Keeping and the floor; cheap; no decision blocks them |
| 2 | NS-13 device proof, NS-21, NS-02 lands, NS-37 | Truth on screen, then the founder's order: photo and Find first (closed question X1) |
| 3 | NS-01 slice 5, NS-22, NS-11, NS-14, NS-05 Level 1, NS-15, NS-23 | After photo and Find: the rest of the reading and capture items, ordered by rank where dependencies allow |
| 4 | NS-04 spike (first in this wave; X1 puts the spike after the pilot and leaves Share unordered, and the rank puts Share ahead; the spike's start is set in the roadmap), NS-24, NS-07, NS-06 Part A, NS-18 | Reading back and the keepsake |
| 5 | NS-06 Part B, NS-25, NS-16, NS-17 | Each behind a counsel or founder gate |

Parallel lanes that never wait on each other: words (`content`), research (`user-research`), legal drafts (`legal`), test plans (`qa`). Engineers never wait on words: they build behind a flag with the PROPOSED key and the founder approves the words before the flag turns on.

## 5. Dependencies in one picture

```
NS-33 -> NS-21 -> NS-05, NS-12, NS-23
NS-21 rows filled by: NS-15, NS-01 slice 5, NS-06, NS-08
NS-35 -> NS-01 slice 4, NS-04, NS-19
NS-36 -> NS-01 slice 3, NS-02, NS-06, NS-07, NS-15
NS-01 slice 2 -> NS-37 -> NS-01 slice 5
NS-02 lands -> NS-22
NS-32 -> NS-13, NS-18
NS-05 Level 1 shipped + five-parent study -> NS-06
co-parent rows + counsel -> NS-25 -> NS-26, NS-27
security read + counsel (X2) -> NS-28, pictures leaving the phone
BL-966 -> BL-963 + BL-985 -> budget.ts + BL-982 -> NS-46 -> NS-48 key function -> NS-50 ranks -> NS-49 level 2 (card 21 build order; full map in 23)
```

## 6. What the harness needs from each row

A backlog row is ready to hand out only when it names (rows without a Plan line need no install, device or founder step unless their Done line says so): the card id it satisfies; scope in one paragraph; a test that fails on the old code; a done line; the owner skill; its dependencies; and whether it needs an install, a device or the founder. Rows BL-923 to BL-949 meet that. Every row from wave 2 on is held with a status the dispatcher does not hand out (the founder hold is the first item in the status parenthetical, so `lib.mjs` reads it) until the founder approves the requirements in chat. Karma then releases them by one status-change PR to `docs/BACKLOG.md`. Later rows are written by `product` from these cards, wave by wave, so the backlog never runs more than one wave ahead of review.
