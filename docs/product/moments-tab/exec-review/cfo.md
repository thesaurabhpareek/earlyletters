Status: REVIEW (CFO seat; nothing here is decided, approved or spent; every money decision is the founder's)
Date: 21 Nov 2026
Reviewer: Chief Financial Officer (Claude role; not a CPA, not an adviser; no tax or legal advice)
Reviews: `docs/product/prd/28-moments-tab.md` on `wip/moments-prd` (head 5bebd892), NS-53-R1 to R191, section 25.5
Read first: `docs/agents/exec/COUNCIL.md`, the CFO skill, the whole PRD (1187 lines)

# CFO review of the Moments tab master requirements

## Verdict: ACCEPT-WITH-CHANGES

Founder rulings of 21 Nov (library read in the first release; places and special occasions in) are taken as given. This review does not reopen them. It asks that the money they imply be written down, labelled and put in front of the founder, because today the PRD has no cost section and several of its gates and rows imply spend or a founder money decision.

Cash cost of the tab itself is near zero: the library read, the place lookup and the local reminders run on the phone and add no server table, column or vendor (R116, R61, R131, R167). The money sits elsewhere: counsel, the founder's hours, agent effort, build count, and phase 2 email. None of it is approved here.

Counts: 0 BLOCKER, 7 MAJOR, 6 MINOR (13 findings).

### Conditions for ACCEPT-WITH-CHANGES

1. Add a "Money implied" section (EX-CFO-1) listing every spend or founder money decision this PRD touches, each marked FOUNDER, default no spend.
2. Add release gate G11, dataset licence and hosting read-out for the place table (EX-CFO-3), before F2 can be turned on.
3. State the effort total, include the pieces the recon table left out (places, holidays, teaching verbs, thumbnails), and say who pays for the runs (EX-CFO-4).
4. Name one measurable and one keep-or-stop number that ties the spend to value, usable with analytics off at 1.0 (EX-CFO-5).
5. Phase 2 email must not share a send budget with sign-in mail (EX-CFO-7). This can wait for phase 2 but the row text should change now.

## Evidence conventions and what I could not read

- [F] fact read in a repo file this session; [A] assumption; [E] estimate; [arith] arithmetic shown.
- Every price below is as recorded in a repo file I read this session (`docs/product/prd/functions/finance.md` V1 to V10, `docs/FOUNDER_TASKS.md` costs table, `docs/ARCHITECTURE.md` section 7, `docs/DECISIONS.md` D-092 and D-127, `docs/ops/RELEASE.md` line 130). I did not re-read any vendor page myself: fetches of resend.com, geonames.org and naturalearthdata.com were blocked in this session, and Apple's CLGeocoder page returned only a script notice. So every vendor price here is UNVERIFIED by me this session, even where the repo file says it was read on 20 Nov. Re-read the vendor page before any recommendation goes to the founder.
- No real founder income, balance or tax figure appears here.

## Findings

### EX-CFO-1 | MAJOR | NS-53-R169, R171, section 21, section 25.5, section 23

Finding. The PRD has no cost section. Spend or a founder money decision is implied in at least these places, and none is labelled: counsel scope (G2, G8, G9, CQ-16, CQ-17, Q43, Q45, Q48), place dataset (R61, G1), hours of the founder's phone and five parents (G1, G4, G7), agent effort (section 19.3), build count (R169 to R171, E2), phase 2 email (R141), entity and insurance (G10 context), trademark (O-28), Route A entitlement (phase 3). The 36 open questions in section 23 are product questions; none is a money question, so the founder would approve money by accident, inside a product ruling. COUNCIL section 6 forbids splitting a money call into small rulings, and the CFO skill says any default must never be a spend.

Proposed change. Add a section "Money implied by this PRD" after section 21: one table, one row per item, columns: item, what it buys, one-off or recurring, cost with source or UNVERIFIED, what happens if nobody acts, how to cancel, trigger as a number, owner. Every row marked FOUNDER, default "no spend". Add one sentence to R171: no gate read-out may be bought; a gate that needs paid work waits for the founder's word. Do not add any gate that says "counsel engaged" without the founder's money answer recorded.

Evidence. PRD sections 19.3, 21, 23 read in full; COUNCIL section 6; CFO skill sections 5 and 12.

### EX-CFO-2 | MAJOR | NS-53-R72, R80, R81, R135, R141, R143, R175, R62, section 21 G2, G8, G9, O-28

Finding. Counsel is the largest money line the PRD creates. The library read moved from "later" to the first release, so the counsel questions moved with it: CQ-16 and App Review 5.1.2(vi) (picture-timed reminder), the per-type label, the purpose string, the policy and backup line, Q43, Q45, Q48 (G2); the place data flow (G8, only if P-B); K-SUG (G9, later); CAN-SPAM classification CQ-17 (phase 2); the "Moments" name (O-28). The repo prices counsel only as "low five figures for about ten documents" [A, F: FOUNDER_TASKS costs table; finance.md section 3.3 "Counsel"], an estimate for the original v1.0 package, not for this scope. Finance FR-FIN-21 already says the packet goes as one scoped request with a fixed-fee ask and the cost is a founder decision. This PRD adds questions to that request and a hard date: G2 gates F2.

Proposed change. (a) Add to the money section a single row "Counsel read for the Moments gates" with the question list taken from G2, G8, G9 and CQ-17, price UNVERIFIED, FOUNDER, default no spend and F2 off. (b) Mark which questions are needed for the first build (G2 only; G8 and G9 are not, per the PRD's own defaults) so the founder can scope the fee to the smallest set. (c) Ask the CLO to say whether the G2 questions can ride in the existing counsel packet (`docs/legal/COUNSEL_PACKET.md`) rather than a new engagement. I rule none of this; the founder decides the engagement and the fee.

Evidence. PRD section 21 table G2, G8, G9; `docs/FOUNDER_TASKS.md` "Costs at a glance" (Counsel row); `docs/product/prd/functions/finance.md` lines 116 and 169; no counsel quote exists in the repo, so any per-hour or fixed fee is UNVERIFIED.

### EX-CFO-3 | MAJOR | NS-53-R61, R117, 7a.1 option P-A, RK-5, G1

Finding. The recommended place path (P-A, offline table) rests on a dataset whose licence nobody has read. The PRD says so itself ("dataset licence and bundle size (UNVERIFIED, mobile measures)", RK-5), but G1 measures size and accuracy only; there is no gate for the licence. `docs/adr/DRAFT-memory-library-architecture-10nov.md` line 164 records "GeoNames is CC BY 4.0 [U: not read]" with an attribution duty. A dataset with attribution or share-alike terms we miss is a legal and trust cost after the build is signed. The PRD also says "bundled" (7a.1) while repo practice is a downloadable pack on R2 (D-097, `docs/ops/PACKS_HOSTING.md`); these have different costs: bundling grows the binary (no cash), a pack uses R2, which the finance file records as $0.015 per GB-month, egress free, 10 GB-month free (V3, UNVERIFIED by me) and says whether R2 needs a card on file is UNVERIFIED and founder-only either way.

Proposed change. Add G11 "Place table licence and hosting": owner `mobile` with `legal`; pass means a dated read-out naming the dataset, its licence read from the publisher's own page, the attribution text placed in Settings licences, the file size, and whether it ships in the binary or as a signed pack on the existing R2 host. The no-spend rule: only a dataset free to use commercially; any paid or rate-limited dataset or map API is a FOUNDER decision and is not assumed anywhere. R61 should say which delivery (bundle or pack) so the cost is known.

Evidence. PRD 7a.1, RK-5, G1; ADR draft line 164 and line 303 (item 7); `docs/ops/PACKS_HOSTING.md`; finance.md V3. Dataset licence itself: UNVERIFIED (publisher pages not readable this session).

### EX-CFO-4 | MAJOR | section 19.3, NS-53-R171, section 25.5 (first question), RK-12

Finding. Effort. The recon table (`RECONCILIATION-AND-FOUNDER-DECISIONS.md` section 8, on `wip/moments-recon`) is ASSUMED, "S is 1, M is 2.5, L is 5 agent-days, plus or minus 50 percent, excluding review, device time, counsel and founder hours". The pieces that now sit in the first release, from that table: tab shell 2 to 3, no-permission blocks 4 to 6, value-prop view 3 to 4, Route B 28 to 34, spikes about 2. Sum [arith]: 39 to 49 agent-days. With the stated plus or minus 50 percent: about 20 to 74 agent-days. That sum does not include places (R61 to R65, R117), public holidays by date (R66, O-33), the teaching verbs (R54 to R57, including a stored picture id and album id if O-13 and O-14 are signed), the day sheet and viewer (R149), thumbnails and the bounded LRU (R112), or the 191 rows' test layers L3 to L5. Those have no estimate. The PRD says "the harness assigns engineers after freeze" (25.12) and the Build 13 freeze date was not read by any lead (section 27). So the effort against the store date cannot be judged.

Who pays. D-127 (founder, 30 Oct): no money on inference for the agent harness; the harness stays off; how the coordinator session is billed "is not recorded in the repo: unverified". The harness author's figures were about $2.40 a day typical, $17 heavy, $64 at the cap [A, unverified, D-127]. As an upper-bound illustration only, and assuming an agent-day equals a harness-day [A], 39 to 49 days would be about $94 to $118 at the typical rate and $663 to $833 at the heavy rate. These are not a plan and nothing here authorises that route; D-127 says no. The honest cash answer today is $0 by decision, with the real cost being the founder's hours and review capacity (every PR needs two counted reviews, finance.md section 3.4).

Proposed change. (a) Add an effort table to section 19.3 or the money section: pieces, agent-days [A], with places, holidays, teaching verbs, viewer and thumbnails given an estimate by `mobile` or marked "no estimate yet" in plain words. (b) State that no run cost is authorised, citing D-127, and that how agent sessions are paid for is unrecorded. (c) Add the founder's hours as one dated step in `docs/release/FOUNDER_QUEUE.md` for G1 (device spike on his phone), G4 (five-parent check), G7 (real-iPhone checks) and G10 (signing 22 reversals); I would not ask for those hours until the schedule is set. (d) Do not quote a store date from this table.

Evidence. Recon section 8 (read on `origin/wip/moments-recon`); `docs/DECISIONS.md` D-127 text; PRD 19.3, 25.12, 27; finance.md 3.4.

### EX-CFO-5 | MAJOR | NS-53-R167, R87, G-2, section 4.4, section 20 (E2, E4), R174, O-04

Finding. There is no way to see whether the spend pays back. The PRD states the daily-return claim is a hypothesis with no parent evidence (4.4, 20). G-2 measures "letters started with `source: moment` among opted-in analytics users", E2 compares letters started between two builds with n of at least 20 per group, but R167 says analytics is off at 1.0 and queues nothing, and R87 says no database field, log or event records that a letter began from a moment. Section 25.10 asks the CDO the same thing and has no answer. So the main goals cannot be read in the first release, and the spend (item 4 above plus counsel plus hours) has no stated benefit, number or stop line.

Money mechanism, honestly stated [A]: Plus holds one paid act, keeping beyond the first 2 free kept letters (D-082, D-103; finance.md principle 6). Moments is free and no paid feature depends on it (MT-X4-R11, 2.2). The only path to revenue is more letters started, then more parents reaching the allowance gate. That is plausible, unproven and unmeasured. Net per payer is $3.75 a month blended, before tax [A], from `finance.md` section 3.2 ($42.49 annual and $4.24 monthly at 15% in the Small Business Program, 70% annual mix); that program rate depends on the founder's enrolment (FT-29, status open as of 28 Oct in the skill's record, not re-checked).

Proposed change. Add to section 20 one measure and one stop line, stated as numbers before the build: for example, read trial-to-paid and first-renewal per install-week cohort from App Store Connect (never blended), compared for the cohorts before and after the tab ships, and say in advance what result means "keep" and what means "stop investing in phase 2". If the answer is "we cannot measure", say that and treat the whole first release as a bet on the founder's judgment, not on data. The CDO should confirm which of these work with analytics off. Do not use LTV from assumed churn to justify any spend (CFO skill section 8).

Evidence. PRD 2.1 G-2, 4.4, 18, 20, R87, R167; finance.md 3.2 and principle 6; D-124 (analytics off) per ARCHITECTURE line 18.

### EX-CFO-6 | MAJOR | NS-53-R165, R175, section 21 G10, RV-01 to RV-22; D-004 point 4 (27 Nov)

Finding. This is the first feature that reads pictures of children from a parent's library, published by the founder as an individual (D-004, no entity). D-004 point 4 asks the founder to decide by 27 Nov whether to start an entity in parallel as the Apple 5.1.1(ix) hedge (DECISIONS "Decisions that still need the founder", item 5). The PRD's own open-question deadlines fall the same week (24 and 28 Nov). It also names no insurance. These are money questions the PRD does not mention: entity formation and its California annual tax, an accountant, and errors-and-omissions and cyber cover (FT-37, optional, open). Personal and business money are not legally separate today (D-004 points 2 and 6).

Figures I can give, all UNVERIFIED by me this session: California Franchise Tax Board states an LLC doing business in California pays an annual tax of $800 (as read on 31 Oct by the CFO skill, FTB page updated 5 Mar 2026); formation fee, accountant fee and insurance premium are not priced anywhere in the repo.

Proposed change. In the money section add three FOUNDER rows with no price assumed: entity timing (decide with G10, not separately), accountant engagement (CR-120 status Gap: before the first payout), insurance quotes (FT-37). Ask the CLO whether the library read changes the D-004 point 4 recommendation. Accountant brief additions (I draft; the founder sends): are counsel fees, test devices and any dataset costs for this feature deductible and how to keep records; what changes if the app moves to an entity after the library read ships. Accountant and counsel must confirm.

Evidence. `docs/DECISIONS.md` D-004 and "Decisions that still need the founder" item 5; CFO skill section 6; compliance register CR-120 (cited in skill, not re-read this session); FOUNDER_TASKS FT-37.

### EX-CFO-7 | MAJOR (phase 2; fix the row text now) | NS-53-R140, R141, R142, R188, 13.6, H-4

Finding. The lifecycle email shares Resend with sign-in mail. Recorded plan limits: Free 3,000 emails a month, 100 a day, 3 domains; Pro $20 a month, 50,000 a month, $0.90 per 1,000 extra (finance.md V4, UNVERIFIED by me). 13.6 allows up to one email a week per opted-in parent. [arith] 52 weeks / 12 = 4.33 a month; 3,000 / 4.33 = about 690 parents before the monthly cap, but the 100 a day cap binds first if a weekly job sends on one weekday: 100 recipients a day. Finance FR-FIN-07 already says that when the daily cap is hit, sign-in links fail. A Moments email batch could therefore lock parents out of sign-in. At Pro overage, marginal cost per email is $0.90 / 1,000 = $0.0009, so about $0.0039 per parent per month at weekly frequency [arith], small and inside the 50,000 included. The money risk is the outage and the $240 a year (12 x $20) step, not the per-email cost.

CAN-SPAM design to the commercial standard (H-4) needs a postal address. FT-19 mailing address service is open and recorded as about $10 to $30 a month [A, not checked against a vendor page]: $120 to $360 a year [arith], recurring.

Proposed change. R141 adds: lifecycle sends use a separate budget and are rate-limited so they never use the last share of the daily allowance; sign-in and account mail has priority and a lifecycle job halts when sends in a day pass 70 (the trigger the finance file already uses). Add to the money section: Resend Pro (FOUNDER, trigger 70 sends in a day or 2,000 in a month, how to cancel in Resend billing, renews monthly) and the mailing address (FOUNDER, recurring). Also confirm with the CMO and CLO whether Resend's broadcast or marketing features have different limits or price than its transactional sending: UNVERIFIED, not read.

Evidence. finance.md lines 25, 102, 131, 172; FOUNDER_TASKS costs table "Mailing address"; PRD 13.6.

### EX-CFO-8 | MINOR | NS-53-R169, R170, R171, E2, RK-2, RK-12, section 25.5 (second question)

Finding. Cost of a rejected or delayed submission versus shipping with the flag off. In cash terms the flag-off fallback costs nothing extra: the tab ships on its no-library content and the library code stays dark (R169, R171). A delay costs the fixed monthly floor and the first-cash lag. The repo's finance file puts the paid-tier floor (Supabase Pro $25, EAS Starter $19, Resend Pro $20, Vercel Pro $20, plus Apple) at $92.25 a month, $1,107 a year, covered at about 25 paying families, and first cash from an annual start at about 3.5 to 4 months, because Apple pays up to 45 days after its fiscal month closes (Schedule 2 section 3.5; the skill's reading, UNVERIFIED by me). Pre-revenue the floor is only what the founder has actually switched on; not all four tiers are on today. I cannot say how much of it is currently being paid.

I have not read any Apple page that states a per-submission fee for review or resubmission; whether one exists is UNVERIFIED, though none is recorded in the repo.

The real recurring risk is EAS builds. D-092: Free gives 15 iOS builds a month (shared by both lanes, low priority, one at a time); plan about 4 release candidates, one preview build per candidate, and about 7 other preview builds a month (RELEASE.md line 130), which is already 15. The library read adds candidates (a build with F2 on, a fallback build with F2 off, a point release to turn it off per RK-2) and E2 asks for two builds. Past 15, Starter is $19 a month plus usage, $228 a year [arith] (D-092; V2 says $45 of build credit then usage-based pricing and no per-build iOS price: UNVERIFIED).

Proposed change. Add a build-count line to the money section with the D-092 trigger as a number (more than 15 iOS builds in a month, or a queue blocking a candidate) and the default: stay on Free, drop optional preview builds first. This stays the founder's call.

Evidence. D-092; `docs/ops/RELEASE.md` line 130; finance.md 3.2 and 3.3.

### EX-CFO-9 | MINOR | NS-53-R167, section 18

Finding. Analytics is off at 1.0 so event cost is $0 now. When it is turned on (founder decision, D-124 per ARCHITECTURE line 18), `ui.moments_card.impressed` fires per card drawn. [arith] A parent who opens the tab daily (30 opens) with 1 screen view and up to 4 impression events each is up to 150 events a month, on top of the architecture's assumed 300 events per family per month: 450. Against a recorded free tier of 1 million events a month (FOUNDER_TASKS "V" row; ARCHITECTURE [S35], not re-read by me), that is about 2,200 families instead of about 3,300 before overage [arith]. Only opted-in families count, so this is an upper bound. ARCHITECTURE already advises cutting to about 50 events per family. Overage pricing is UNVERIFIED in the repo.

Proposed change. R167 adds a budget: at most one impression event per kind per local day, or tap events only. No money action needed until analytics is on.

Evidence. `docs/ARCHITECTURE.md` lines 18, 174; FOUNDER_TASKS costs table (PostHog); PRD section 18.

### EX-CFO-10 | MINOR | NS-53-R62, F3, 7a.1 option P-B, G8, U27

Finding. Apple's geocoder (P-B) is off and gated, good. Its price, rate limits and logging are UNVERIFIED: Apple's CLGeocoder page did not render for me this session, and the PRD itself marks Apple's logging and the map tile region as UNVERIFIED. "At most one request per card shown" may still hit throttling at scale; I cannot give the limit. Separately, R43 bans network geocoders and map search outside the adapter, which is right, but the adapter is described only as Apple's. A paid place or map vendor would need a card and an account, and would be founder-only.

Proposed change. Name P-B as Apple's service only in R62 and add one sentence: no third-party or paid place, map or geocoding service is assumed or authorised; adding one is a FOUNDER decision with its own G8-style read-out.

Evidence. PRD 7a.1, R43, R62, section 27 UNVERIFIED list.

### EX-CFO-11 | MINOR | NS-53-R82, R94, phase 3, O-36, RK-13

Finding. Route A (Apple's journaling suggestions picker) needs an entitlement and a licence read (H-3, DPLA 3.3.3(H)); it is phase 3. The Apple Developer Program fee is $99 per membership year (V10, finance.md, and FOUNDER_TASKS: enrolment Active 29 Oct). I found no recorded fee for the entitlement and did not read any Apple page on it, so whether it costs anything is UNVERIFIED. No spend is implied in phases 1 and 2.

Proposed change. Add the entitlement to the money section as "no cost known, UNVERIFIED, no spend implied, phase 3". Nothing else.

Evidence. PRD 3.1 H-3, 19.3; finance.md V10.

### EX-CFO-12 | MINOR | NS-53-R8, O-28, RK-11, D6 and PR #1276

Finding. Keeping "Moments" in-app only until counsel clears it avoids a filing and keeps rename cost low (a content key). The repo records a trademark knockout search as $0 and filing as "believed about US $350 per class" [U] (FOUNDER_TASKS), and FT-35 a counsel opinion only if FT-28 found something. If the founder later wants the name in store text, that becomes a filing and counsel question with a cost. Not in scope for the first release.

Proposed change. In the money section: "Name filing: not needed while in-app only; if store use is wanted, price UNVERIFIED, FOUNDER." No change to R8.

Evidence. FOUNDER_TASKS costs table and FT-28, FT-35; PRD R8, O-28.

### EX-CFO-13 | MINOR | NS-53-R104, R113, 2.2 non-goals, MT-X4 Variant B reference

Finding. The PRD correctly syncs no pictures (Variant A, R104, R116) and adds no server table in phase 1, so Supabase storage cost does not move. Account-level photo sync (NS-52 Variant B) is a non-goal here but is the one change that would turn pictures into a per-family storage and egress cost. The architecture assumes 19 MB of audio per family per month (ARCHITECTURE section 7) and records Supabase Pro storage at $0.0213 per GB beyond 100 GB and egress at $0.09 per GB beyond 250 GB (V1, UNVERIFIED by me); no picture-size assumption exists in the repo. Not sized.

Proposed change. Add one line to non-goals: any later move to Variant B, or to any server holding pictures, needs a CFO sizing note and a founder money decision before it is specified, because the per-family run cost target (about $0.02 to $0.10 a month, ARCHITECTURE section 7) would change. Principle 6 means a free card that adds server cost is paid out of the same $3.75 per payer.

Evidence. PRD 2.2, R104, R116; ARCHITECTURE 7; finance.md principle 6.

## Answers to section 25.5

1. Effort against store date: 39 to 49 agent-days for the pieces the recon table priced, wide uncertainty, places and several other first-release pieces unpriced, freeze date unread (EX-CFO-4). Cost of the place table: licence unread, hosting choice open, $0 path possible; no paid dataset or geocoder assumed (EX-CFO-3, EX-CFO-10).
2. Rejected or delayed submission versus flag off: flag-off costs no extra cash; delay costs time against a recorded fixed floor and the cash lag; the recurring risk is EAS build count (EX-CFO-8). I found no per-submission Apple fee in the repo; UNVERIFIED.

## Founder money decisions this review surfaces (all FOUNDER, default no spend, none approved here)

| Item | Recurring? | Figure and source | If nobody acts |
|---|---|---|---|
| Counsel read for the Moments gates | no, per engagement | UNVERIFIED; repo estimate "low five figures" for the original packet [A] | F2 stays off; the tab ships on no-library content |
| Entity timing, accountant, insurance | accountant likely yearly; LLC tax annual | LLC $800 a year per FTB as read by the skill on 31 Oct, UNVERIFIED by me; others unpriced | No entity; CR-120 stays Gap |
| EAS Starter | yes | $19 a month plus usage, D-092 (V2 UNVERIFIED by me) | Stay on Free; renews monthly if bought, cancel in expo.dev billing |
| Resend Pro (phase 2) | yes | $20 a month, $240 a year (V4, UNVERIFIED by me) | Stay on Free |
| Mailing address (phase 2) | yes | about $10 to $30 a month [A] | No lifecycle email |
| Paid place dataset or map API | n/a | none assumed | not used |
| Trademark filing for the name in store text | no | about $350 a class [U] | Name stays in-app only |
| Agent run cost | n/a | $0 by D-127; billing of coordinator session unrecorded | no paid inference |
| The founder's hours (G1, G4, G7, G10) | no | not priced | not scheduled until he asks |

## For the record

Open items from the CFO skill that this PRD touches and I could not close: FT-29 Small Business Program enrolment (open as of the skill's 28 Oct record, unchecked since); Q2-09 Paid Apps agreement, tax and bank; the Project doc `infra/cost-decisions-2026-10-03.md` (no Project read tool in this session). The 15 percent net figures above assume the program enrolment.

Chief Financial Officer (Claude role)
