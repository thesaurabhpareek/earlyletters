# Engineering project plan for the locked pack: work mapping and sequence

Status: input, 20 Nov 2026. Owner: Karma (CTO role, product-side session). This is the product-side sequencing input to the engineering thread's task-level plan, `docs/product/prd/17-engineering-project-plan.md` (PR #847), which is the plan of record; where they differ, #847 wins on engineering order and the cards win on behaviour (CR-66). Design: `docs/tdd/new-scope/`. Tasks: `docs/BACKLOG.md` rows BL-922 to BL-987.

This plan sets order, lanes and gates. It sets no dates: release dates and what each store build carries are the founder's. Where this plan and a card differ, the card wins and this plan is fixed.

## 1. What we are building, in one paragraph

Thirty-seven cards, of which twenty-six build software in this plan and the rest are research, decision records or parked. The founder's order holds (closed question X1): keep what families made safe and true first, then photo with a letter and Find, then the reading and keeping features, then the gated features (Firsts, sealed letters, quick capture, someone else speaks, the other parent in the store app, backup). The work is 61 open backlog rows, about 128 reviewable PRs at the review limit (400 added lines, 20 files), each needing two counted reviews: about 256 reviews. Review, not coding, sets the pace.

## 2. How a task moves

1. The harness picks a row whose Status is `ready`, or `blocked` only on rows that are done, with every `Depends on` row done (`scripts/agents/lib.mjs`). Rows blocked on a counsel answer, a founder step or an unmerged PR are moved by a person.
2. The PR names the card rows it satisfies and the test titles that prove them (`[NS-nn-Rn] ...`). Every P0 row has a test before its card's flag turns on outside the founder's family (RR-3).
3. Two counted reviews of different lenses at the 40-character head sha (CR-44; `PASS WITH NOTES` with "Must fix: none." counts, CR-63), green CI, squash merge.
4. Flags stay off in `production` until gates G0 to G6 hold for that card (`14-test-plan.md` section 6).

## 3. Phases and sequence

Depth is the longest chain of backlog dependencies under a row. Rows at the same depth in one phase can run in parallel, subject to lane capacity (section 5).

### Phase 0. Foundations and keeping (start now, all in parallel)

| Order | Row | What | Lane | Size | Waits on |
|---|---|---|---|---|---|
| 0.1 | BL-964 | Traceability sees NS ids (gate G0) | qa | S | nothing |
| 0.2 | BL-965 | Words for the locked pack (PROPOSED keys) | content | M | nothing; founder approves words |
| 0.3 | BL-957 | One length rule (graphemes in app, code points in DB) | mobile, data-architect | S | nothing |
| 0.4 | BL-958 | Build profiles carry the new flags; free-space check | ops (platform) | S | nothing |
| 0.5 | BL-961 | Second account never sees the first (`[X4-R1]`), sign-out line | mobile | M | BL-965 for the words only |
| 0.6 | BL-962 | No system intelligence donation (`[X6-R1]`), writing tools off | mobile | S | nothing |
| 0.7 | BL-963 | Home slip registry (`[FRAME-SLIP]`) | mobile | S | nothing |
| 0.8 | BL-966 | One notification budget (NS-32) | mobile (reminders owner) | M | nothing |
| 0.9 | BL-967 | Signing out cancels reminders (NS-13-R14) | mobile (reminders owner) | S | nothing |
| 0.10 | BL-985 | Quiet this book has a home (F12-REQ-011) | mobile | S | nothing |
| 0.11 | BL-978 | New phone: close the last gap (NS-10) | mobile | M | BL-922 alongside |
| 0.12 | BL-922 | needsConsent session held out of the child step | mobile | M | nothing |
| 0.13 | BL-974 | Quiet days stay the author's own | mobile | S | nothing |
| 0.14 | BL-975 | Privacy label guard (G11) | ops (platform) | S | nothing; CI job is a proposal |
| 0.15 | BL-927, then BL-928 | Accessibility audit note, then fixes | design-systems, then mobile | S, S | nothing |
| 0.16 | BL-929, BL-930 | Device baseline run sheet; NFR rewording | qa | S, S | nothing |
| 0.17 | BL-925, BL-926, BL-977 | Let it go words, Review line, remaining rows | content, mobile, sync | S, S, S | founder word approval for BL-925 |
| 0.18 | BL-949 | Counsel questions in the packet | legal | S | nothing; founder sends the packet |
| 0.19 | BL-960 | Data inventory home brought to built facts | privacy (pair) | S | founder merges `docs/legal/**` |
| 0.20 | BL-987 | Engineering facts the cards wait on | sync, data-architect, mobile (pair) | S | nothing |
| 0.21 | BL-935 | Pilot kit | user-research (interactive) | S | counsel reads consent texts before any contact |

Exit: G0 passes (trace sees every P0 row); the keeping P0 rows (NS-09, NS-10, NS-13-R14, NS-32) pass; `[X4-R1]`, `[X6-R1]`, `[FRAME-SLIP]` run in CI.

### Phase 1. Photo with a letter and Find (the founder's first two; X1)

| Order | Row | What | Lane | Size | Waits on |
|---|---|---|---|---|---|
| 1.1 | BL-931 | Photo stack, eight to ten stacked PRs in order: #834 native module, #841, #842, #835 local migration 11, #836 stored copy, #837 picker, #838 capture and Review, #839 letter page, #840 Photos lens | mobile (engineering thread runs it) | L | in progress |
| 1.2 | BL-952 | Find split into at most six PRs from #798 | mobile | L | nothing; runs beside 1.1 |
| 1.3 | BL-953, BL-954, BL-955 | Stored copy to T3; undo helper (T4); pick survives a kill | mobile | S each | BL-931 |
| 1.4 | BL-932 | List and page copies (512 px, 1,280 px) | mobile | M | BL-931 |
| 1.5 | BL-868, then BL-933 | Export spec line (founder merges), then export 1.7.0 with pictures | data-architect, mobile (export owner) | S, M | BL-931; the founder's legal merge |
| 1.6 | BL-956 | Pictures at large text, Smart Invert, fit, light lens | mobile | M | BL-931, BL-932 |
| 1.7 | BL-938 | Calm Book header | mobile | M | BL-952 |
| 1.8 | BL-959 | Ids are L3 in ADR 0028 and migration 11 | data-architect | S | #797 merged |

Exit: NS-01, NS-02, NS-37 and NS-36 (export 1.7.0) P0 rows pass; flags on in preview and TestFlight, off in production until G1 to G5 (counsel label read Q43, word approvals, P0 device rows, label and claims match).

### Phase 2. Reading, keeping and capture (after photo and Find land)

| Order | Row | What | Lane | Size | Waits on |
|---|---|---|---|---|---|
| 2.1 | BL-937 | Letter page as one list | mobile | S | BL-928 |
| 2.2 | BL-941 | Child switcher on Home | mobile | S | BL-931, BL-952 |
| 2.3 | BL-945 | A letter for another day (rescoped, S) | mobile | S | BL-931, BL-952 |
| 2.4 | BL-942 | Save a copy of the year | mobile | S | BL-931, BL-952, BL-963 |
| 2.5 | BL-946 | One past letter on Home | mobile | S | BL-937, BL-963 |
| 2.6 | BL-943 | Reminders proven, back-off pre-scheduled | mobile (reminders owner) | M | BL-966, BL-967 |
| 2.7 | BL-939 | Share one letter, Level 1 | mobile | M | BL-937; counsel Q45 before its production flag |
| 2.8 | BL-947 | Read the year back | mobile | S | BL-931, BL-952 |
| 2.9 | BL-982 | Typed days in reminders | mobile (reminders owner) | S | BL-943 |
| 2.10 | BL-984 | Accessibility beyond VoiceOver | mobile | M | BL-928 |
| 2.11 | BL-948 | Device rows for every new card | qa | S | BL-929 |
| 2.12 | BL-973 | Printable book (PDF) | mobile (export owner) | M | BL-933; CLO font evidence |
| 2.13 | BL-981 | Five-parent studies | user-research (interactive) | M | the builds in TestFlight |

Exit: their P0 rows pass; words approved; device rows pass on the candidate.

### Phase 3. Gated features (each starts when its gate clears)

| Row | What | Gate that starts it |
|---|---|---|
| BL-968 | Firsts (NS-06 A) | BL-939 shipped and the five-parent study read-out (BL-981) |
| BL-969, then BL-970 | Sealed letters, server then phone | BL-968, BL-959; counsel Q49, Q50; the B10.1 choice (default pull clause) |
| BL-972, then BL-971 | Hands-free spike, then doorways | BL-935 pilot; spike exit lines |
| BL-976 | Backup readiness reads | #622 merged; the flip stays the founder's |
| BL-979 | Earlier versions | counsel Q51, Q32, Q48 |
| BL-980 | Someone else speaks | counsel Q45, Q46, Q48, Q54 |
| BL-983 | The other parent in the store app | #827 and #767 merged; counsel Q48, Q49, Q53 |
| NS-17 per language | A second spoken language | native reviewer, founder sign-off and spend |

## 4. The critical paths

Two chains decide when locked-pack features can reach a store build:

1. Photo: #834, #841, #842, #835, #836, #837, #838, #839, #840 (nine serial merges), then BL-932 and BL-933 (BL-933 also waits on the founder's merge of the export spec line, BL-868), then the P0 device rows, then the candidate. About twelve serial PRs: 24 counted reviews at the floor, about 48 at the rate seen so far.
2. Firsts and seals: BL-928, BL-937, BL-939, the study, BL-968, BL-969, BL-970. Seven rows in series, two of them gated outside engineering (the study, counsel).

Everything in Phase 0 is off both chains and should not wait for them.

## 5. Lanes and capacity

| Lane (agent) | Rows | PRs (est.) | Notes |
|---|---|---|---|
| mobile (mobile engineer, reminders owner, export owner) | 37 | about 79 | The bottleneck. The photo stack runs in the engineering thread's interactive sessions, not the agent lane |
| data-architect | 3 | about 15 | BL-969 and BL-979 are L (server schema) |
| sync (sync owner, family owner) | 3 | about 11 | BL-983 is L and counsel-gated |
| content | 3 | about 7 | Founder word approvals batched in one step |
| qa | 4 | about 4 | BL-964 first: it is gate G0 |
| ops (platform) | 2 | about 2 | Workflow changes are proposals (D-124) |
| user-research, speech, design-systems, legal, privacy | 6 | about 10 | Pair rows need an interactive session |

Estimates: S is 1 PR, M about 3, L about 7 (`13-engineering-plan.md` section 1).

Rulings for this plan (Karma, T1, two-way):
- The mobile lane takes Phase 0 rows in the order of section 3 before any Phase 2 row; the photo stack and Find stay with interactive sessions so the lane never waits on them.
- Work in progress: at most three open PRs per lane and ten agent PRs in all (`max_open_agent_prs`, roster); at the cap, agents review and fix only.
- Review pairing: every PR takes one review from the owning steward lens (principal-architect, data-steward, security-architect, compliance-engineer or ai-eng-lead by path) and one from red-team or a second steward.
- The harness's first switch-on of any unattended lane, and any spend it needs, stays the founder's (CTO skill section 3). This plan does not switch anything on.

## 6. Gates, restated

| Gate | Holds when | Checked by |
|---|---|---|
| G0 | `scripts/trace.mjs` sees every P0 row with a test title in code | BL-964 ratchet in CI |
| G1 | ADR 0028 on develop, export spec line merged, export 1.7.0 golden test passes | data-architect, founder merge |
| G2 | Counsel has read what each card names | founder sends the packet |
| G3 | Founder approved the words | content, founder |
| G4 | Every P0 device row passes on the candidate (Asha-only install, D13) | founder runs the sheet with qa |
| G5 | Privacy label and claims inventory match what the build sends | label guard (BL-975), compliance-engineer |
| G6 | No production flag on while its card has an open P0 | preflight (BL-958) |

## 7. Risks to the plan

| Risk | Likelihood x impact | Mitigation |
|---|---|---|
| Review capacity, not code, stalls the critical path | 4 x 4 | Phase 0 runs beside the photo chain; reviews paired by steward lens; PASS WITH NOTES counts (CR-63) |
| The mobile lane saturates (about 79 PRs) | 4 x 3 | Photo and Find in interactive sessions; S rows first; merge-conflict map in the design (`letter/[id].tsx`, Home) |
| Counsel answers arrive late | 3 x 3 | Only gated rows wait; each has a default and stays off in production |
| A card is wrong against the code | 3 x 2 | CR-66: raise with file and line; Karma rules within two working days |
| Device time (founder hours) is the last gate | 3 x 4 | One batched run sheet per candidate (BL-929, BL-948); Asha-only install |
| Real family data reaches evidence | 1 x 5 | D13; the no-real-family-data test on every evidence PR |

Karma
