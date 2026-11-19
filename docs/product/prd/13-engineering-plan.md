# Engineering plan: size, skills, order and dependencies (Karma, 19 Nov 2026)

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
| NS-13 Reminders proven | S to M | mobile, qa, content | none to start; re-run its device rows once NS-32 lands (NS-32 is small and already in review, so take it first when both are free) | device run with a time-zone change |
| NS-14 Whose book | S | mobile, design-systems | none | none |
| NS-15 Another day | L (a new synced field) | mobile, sync, data-architect, privacy | NS-36 rule; fills an NS-21 row | data inventory row |
| NS-16 Someone else speaks | L (a counsel gate; a synced name about a non-user) | mobile, sync, content, privacy | none (it lives on Review) | counsel (packet Q2 and the COPPA question) |
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
| NS-02 Find | M (built; in review) | mobile, privacy | NS-36 | device row |
| NS-23 One past letter | S | mobile, content | NS-21 | none |
| NS-24 Read the year back | S to M | mobile | none | none |
| NS-06 Firsts and seals | M (Firsts), L (seals) | mobile, sync, data-architect, legal | NS-05 Level 1 shipped; five-parent study; NS-36 seal clock (Part B); fills NS-21 rows | counsel on seals |
| NS-07 Print-ready file | M | mobile | NS-36 export rule | proof-book spend for layout numbers |
| NS-29 Read-along | L | speech, mobile | engine keeps word timings | none |

### D. Family

| Card | Size | Skills | Depends on | Gate |
|---|---|---|---|---|
| NS-03 Pilot | S (no code) | user-research, legal | none | counsel reads consent texts |
| NS-05 Share one letter, text | S to M | mobile, content | NS-21 | words approved; no recording path |
| NS-25 Other parent in store app | L (the rank file's "S to M" was for switching it on only; the gates make it L) | sync, mobile, data-architect, security | the co-parent backlog rows | counsel (Q29, Q2) and the founder |
| NS-26, NS-27, NS-28 | L each | not started | NS-25 | X2 for NS-28 |

### F. Foundations

| Card | Size | Skills | Depends on | Gate |
|---|---|---|---|---|
| NS-34 Speed baseline | S (a run sheet) | qa | none | the founder's phone and time |
| NS-33 Accessibility floor | S (2 changes) | design-systems, mobile, qa | none | device walk |
| NS-35 One start | S to M (merged on develop 19 Nov) | mobile | none | none |
| NS-36 Data follows the letter | S to M | data-architect, privacy, mobile | ADR 0028 accepted | data inventory rows |
| NS-37 Book stays fast | M | mobile | NS-01 slice 2 (the native module) | device row |
| NS-32 Notification budget | S (in review) | mobile | none | none |

### E. Engineering only (no card)

| Item | Size | Skills |
|---|---|---|
| Split the oversized photo change into five | M | mobile |
| Doc and code drift list, copied into the repo and fixed | S | product, mobile |
| Low Power Mode guard for loops | S to M | mobile |

## 4. Order

The harness picks any row whose dependencies are done. This is the order of preference when several are free.

| Wave | Work | Why first |
|---|---|---|
| 1 | NS-09, NS-34 run sheet, NS-33, NS-10, NS-35 review, NS-36 review, NS-32 review, NS-03 kit, the photo split | Keeping and the floor; cheap; no decision blocks them |
| 2 | NS-13 device proof, NS-21, NS-14, NS-11, NS-02 lands, NS-37 | Truth on screen and capture without friction |
| 3 | NS-01 slices 3 to 5, NS-22, NS-05 Level 1, NS-15, NS-23 | The founder's order: photo, Find, then share |
| 4 | NS-24, NS-07, NS-06 Part A, NS-18, NS-04 spike | Reading back and the keepsake |
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
```

## 6. What the harness needs from each row

A backlog row is ready to hand out only when it names: the card id it satisfies; scope in one paragraph; a test that fails on the old code; a done line; the owner skill; its dependencies; and whether it needs an install, a device or the founder. Rows BL-923 to BL-941 meet that. Later rows are written by `product` from these cards, wave by wave, so the backlog never runs more than one wave ahead of review.
