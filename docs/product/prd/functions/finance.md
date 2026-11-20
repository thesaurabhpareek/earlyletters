# Function review of the requirements: finance (FIN)

Author: the Chief Financial Officer role (a Claude role, not an accountant, CPA, enrolled agent, lawyer or financial adviser; nothing here is tax, legal or investment advice). Backlog row BL-999. Written 20 Nov 2026 under `docs/product/prd/functions/BRIEF.md`. Docs only: nothing here spends, signs up, upgrades or accepts terms. Every money decision below is the founder's; each one carries a recommendation and a default, and every default is no spend.

Conventions. Every price says where it was read and when. "Read 20 Nov" means read in this session from the vendor's own page at the URL given. A figure not read this session is UNVERIFIED, even when the repo has it. Labels from the CFO skill: [F] fact read in code or a record, [A] assumption, [E] estimate. Every revenue figure says gross or net of Apple's commission, before tax, and run-rate or cash. Tax and entity points end with "the accountant must confirm"; legal readings with "counsel must confirm". No real income, balance or tax figure of the founder appears here.

## 1. What I reviewed, and what I did not

Reviewed (repo `/home/claude/earlyletters`, branch `docs/locked-pack-inputs-20nov`, head `7d0446d02`):
- The role's rules: `.claude/skills/early-letters-cfo/SKILL.md` (in full) and this brief.
- Cards: `00-product-frame.md` (in full); `README.md`; `13-engineering-plan.md` (in full); `16-council-review-round-2.md`; `18-errata-after-lock.md`; `GAP-LOG.md`; the "Free or Plus", "Plan lapsed", cost and dependency lines of every card `01` to `12` (by search, then the rows cited); NS-08 sizing arithmetic and NS-12 sections 1 to 7 read in full; `14-test-plan.md` journeys J-N22 and J-N25.
- The platform pass: `origin/docs/eng-eval-20nov:docs/engineering/eval-20nov/C-platform-quality-delivery.md` (head `6c0119199`), sections 5 to 8 in full, the rest by search.
- Design: `origin/docs/e2e-ux-20nov` (head `dfe0b8e58`): `E-foundations-and-system-states/DESIGN.md` (J-E10, J-E11, E-S10, E-S11, E-S12, E-S25, E-S26, E-S27 and the state table) and `WORDS.md` (billing rows); the plan and price lines of areas A, B, C and D by search.
- Records: `docs/DECISIONS.md` D-004, D-046, D-053, D-082, D-083, D-092, D-127, D-159, D-160 to D-162; `docs/FOUNDER_TASKS.md` costs table and FT-29; `docs/release/FOUNDER_QUEUE.md` Q2-09, Q3-07; `docs/legal/COUNSEL_PACKET.md` 1.5.0 (Q41 in full, the question index); `docs/legal/compliance-register.md` CR-120; `docs/ops/runbooks/free-tier-ops.md`; `docs/ops/PACKS_HOSTING.md` (cost section); `docs/prd/v2/features/F16-sync.md` (capacity table); `packages/content/src/pricing.ts`; `packages/content/src/emails/billing.en.ts` (header and price lines); the price comments in `apps/mobile/src/lib/billing/`.

Vendor and Apple pages read 20 Nov 2026 (this session):

| Id | Page | What it says that this file uses |
|---|---|---|
| V1 | Supabase pricing, https://supabase.com/pricing | Free: $0, 500 MB database per project, 1 GB file storage, 5 GB egress, 5 GB cached egress, 50,000 MAU, no automatic backups ("Not included in free"), spend caps "Available on Pro Plan". Pro: from $25 a month (first project included, more projects from $10), 8 GB disk then $0.125 per GB, 100 GB file storage then $0.0213 per GB, 250 GB egress then $0.09 per GB, 250 GB cached egress then $0.03 per GB, 100,000 MAU then $0.00325 per MAU, spend cap on by default, $10 a month compute credit, daily backups kept 7 days |
| V2 | Expo pricing, https://expo.dev/pricing | Free: "Up to 15 Android and 15 iOS builds", up to 1 concurrent on macOS. Starter: $19 a month "+additional usage cost", "$45 of build credit", then "usage-based pricing". No per-build price is listed for iOS medium or large workers (UNVERIFIED) |
| V3 | Cloudflare R2 pricing, https://developers.cloudflare.com/r2/pricing/ | Standard storage $0.015 per GB-month; Class A $4.50 per million; Class B $0.36 per million; egress free; free each month 10 GB-month, 1 million Class A, 10 million Class B; free tier on Standard only. The page does not say whether a payment method is needed (the repo's runbook assumes it is: UNVERIFIED) |
| V4 | Resend pricing, https://resend.com/pricing | Free: 3,000 emails a month, 100 emails a day, 3 domains. Pro: $20 a month, 50,000 emails a month; extra emails $0.90 per 1,000 |
| V5 | Vercel pricing, https://vercel.com/pricing | Hobby $0; Pro $20 a month per developer seat with $20 of included usage credit. The page read does not say Hobby is non-commercial; the repo says Vercel's fair use guidelines do (`PACKS_HOSTING.md`), which I did not read this session: UNVERIFIED |
| V6 | Apple, App Store Small Business Program, https://developer.apple.com/app-store/small-business-program/ | "a reduced commission rate of 15% on paid apps and Apple In-App Purchases"; eligible with no more than 1 million USD in proceeds in the prior calendar year and the current year, counting Associated Developer Accounts; new developers qualify; past the threshold "the standard commission rate will apply to future sales"; "Your proceeds will be adjusted fifteen (15) days after the end of the fiscal calendar month in which your enrollment is approved" |
| V7 | Apple, Auto-renewable subscriptions, https://developer.apple.com/app-store/subscriptions/ | 70% in a subscriber's first year, 85% after a year of paid service, "minus applicable taxes"; free trials excluded from days of paid service; 60-day resume rule; Small Business Program members get 85% "regardless of whether or not the subscription has accumulated one year of paid service"; Billing Grace Period of 3, 16 or 28 days, set in App Store Connect; Apple retries a failed renewal for 60 days; offer codes exist as one-time or custom codes (no cost or cap stated) |
| V8 | Apple, Handling refund notifications, https://developer.apple.com/documentation/storekit/handling-refund-notifications.md | Customers request refunds from Apple Customer Support, at reportaproblem.apple.com, or through their payment issuer; the App Store processes the refund |
| V9 | Apple, Handling Subscriptions Billing, https://developer.apple.com/documentation/storekit/handling-subscriptions-billing.md | "they can receive a refund by contacting Apple customer service ... customer support can cancel the subscription and issue a full or partial refund"; billing retry "for up to 60 days"; an app may deep link to `https://apps.apple.com/account/billing` and `https://apps.apple.com/account/subscriptions` |
| V10 | Apple, Become a member, https://developer.apple.com/programs/enroll/ | "99 USD per membership year"; an individual's name "will be displayed as the seller name" |

Not reviewed, and why:
- `19-from-download-to-first-letter.md`: absent from every branch at the start of this session; later in the session it appeared in the working tree as an untracked draft (591 lines) holding NS-38 to NS-40 only. I read those three cards' Free or Plus, plan-lapse and pricing lines, not the whole file. NS-41 to NS-45 were not written at the time of reading and are marked "not reviewed"; the finance rows that touch first run and Plus (FR-FIN-09, FR-FIN-11, FR-FIN-12) apply to them when they land.
- Apple's Developer Program License Agreement Schedule 2 (payment timing, section 3.5) and the Exhibits (sales tax agent role) were read by the CFO skill on 31 Oct 2026, not in this session: cited below as "read 31 Oct, UNVERIFIED this session".
- Apple guideline 3.1.2 (subscriptions) and the App Review guidelines: not read this session.
- Porkbun domain renewals, used-iPhone prices, counsel and accountant fees, insurance quotes: no vendor page read; every figure is the repo's [A] or [E] and UNVERIFIED.
- The Project doc `infra/cost-decisions-2026-10-03.md` and the exec record that holds the proof-book amount (`infra/exec-rulings-2026-11-19-scope-decisions.md`): this session has no Project read tool.
- Code: I did not read the StoreKit entitlement code end to end; whether a refunded or revoked transaction is handled as a lapse today is UNVERIFIED (FR-FIN-11 asks for the test).

## 2. Coverage verdict per card (finance lens)

"Covered" means the card states its server cost, its spend gate and its plan behaviour. "Partly" means one of those is missing or rests on an unread price. "n/a" means the card is not taken up or parked with no money effect yet.

| Card | Verdict | Why |
|---|---|---|
| NS-01 Photo | covered | $0 server cost (on the phone); free under T2; native builds count against D-092 (rollout line). Phone storage is the parent's cost, not ours |
| NS-02 Find | covered | "Server cost $0"; works after lapse (R47) |
| NS-03 Pilot | covered | "No spend"; about 8 founder hours [E]; no offer codes |
| NS-04 Spike | covered | 5 `mobile` days plus 1 `security-architect` day; builds count against D-092 |
| NS-05 Share | covered | Level 1 $0; Level 3 hosting is named as a founder spend decision |
| NS-06 A Firsts | covered | Two synced columns per letter; negligible bytes; free |
| NS-06 B Seals | partly | Server columns and the pull clause add database rows and pull work with no per-family line; `pg_cron` on Free is UNVERIFIED (errata E4 chose option (b), which needs no `pg_cron`) |
| NS-06 C Doorways | covered | Native builds count against D-092 |
| NS-07 C5 Quiet day | covered | $0 |
| NS-07 C28 Printable file | partly | Proof-book amount is "in the exec record", not in the card, and not readable here; default no spend (OQ-1) |
| NS-08 Backup | partly | Sizing arithmetic is sound; paid prices were UNVERIFIED in the card. Read today: see section 3.1 |
| NS-09 Let it go | covered | $0 |
| NS-10 New phone | partly | A full pull of words is about 12 MB per account [A, F16]; restores count against Free's 5 GB egress, which the weekly job does not read |
| NS-11 Save a copy | covered | $0; export never gated |
| NS-12 Earlier versions | missing | `entry_versions` already stores every version on the server, kept "until removed" (D8). No size per version, no growth line, no ceiling |
| NS-13 Reminders | covered | Local only; R11 "reminders never sell" |
| NS-14 Whose book | covered | $0 |
| NS-15 Another day | covered | Existing column |
| NS-16 From name | covered | Existing column |
| NS-17 Second language | partly | Reviewer cost about $1,000 to $1,500 per language [E]; model hosting is "small" with no number; no rule against prepaying several languages |
| NS-18 Typed days | covered | Never synced |
| NS-19 Continue a draft | n/a | Not taken up; cost written when it is |
| NS-20 Two books | n/a | Not taken up |
| NS-21 Letter page | covered | $0 |
| NS-22 Calm header | covered | $0 |
| NS-23 One past letter | covered | $0 |
| NS-24 Read the year back | covered | $0; R10 reads after lapse |
| NS-25 Other parent | partly | Adds a second account per family (MAU, rows, pulls) with no cost line; Plus reaches the second parent only through Family Sharing (D-053); "Plus outside one Apple Family" is open for the founder |
| NS-26 Push (parked) | partly | Names a server sender as a cost; unpriced |
| NS-27 Per-person visibility | n/a | Parked |
| NS-28 Family link (parked) | partly | Hosting spend named as founder's; audio egress unpriced; depends on NS-08 |
| NS-29 Read-along | covered | Parked; free if built |
| NS-30 A book to hold | partly | File free; a printed book makes the founder a seller outside Apple (refunds, card fees, sales tax, ADR 0007): no money path specified |
| NS-31 Library of moments | n/a | Parked |
| NS-32 Notification budget | covered | Plan notices outside the budget; R12 no price, count or child name |
| NS-33 Accessibility | covered | Device time named; device spend is NS-34's |
| NS-34 Speed | partly | SE 3 "used, about $150 to $350 [A, E]" and an iPad: no decision record, no vendor price read |
| NS-35 One start | covered | Done |
| NS-36 Data follows the letter | covered | $0; export minors |
| NS-37 Book stays fast | covered | On the phone |
| NS-38 App Store page | partly | Pricing is out of the card's scope, but the listing it ships (`store.en.ts`, PLUS section) writes "$4.99" and "$49.99" as literals instead of reading `pricing.ts`, so a price change can leave the listing wrong (FR-FIN-10) |
| NS-39 First launch | covered | NS-39-R12: no Plus price, trial or button in first run |
| NS-40 Age and region | covered | No money effect; US storefront only (D-013) |
| NS-41 to NS-45 | not reviewed | Not written at the time of reading (section 1) |

## 3. Function requirements

| Id | Requirement (Given, When, Then where testable) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-FIN-01 | One run-cost register lists every vendor line (Supabase, EAS, R2, Resend, Vercel, Apple, domains) with: price, URL, read date, unit (per family per month, per month, per build, per year), the free limit, the trigger that starts a bill, the annual figure, what happens if nobody cancels, and how to cancel. Given any line whose read date is older than 90 days, When a decision cites it, Then the decision waits for a re-read | Frame section 8; NS-08-R2; D-092; D-159 | P1 | CFO role with `ops` | CFO ruling in `00` section 8 ("every run-cost line must state its read date"); V1 to V5 |
| FR-FIN-02 | Given a card whose flag adds server cost per family (NS-06 B, NS-08, NS-12, NS-17, NS-25, NS-26, NS-28), When its production flag is proposed for on, Then the G6 gate record carries a per-family monthly cost line (low, base, high) with prices read within 30 days, and the founder's note that he accepts the recurring cost. Principle 6 (T2) makes every free feature free for the whole 1.0.x line, so turning one on is a cost commitment that cannot be priced back later | T2; frame principle 6; platform pass 2.3 (G6); BL-958, BL-988 (proposed) | P0 (a) | `ops` (gate record), CFO role | `16` T2; frame section 8 |
| FR-FIN-03 | Given production on Supabase Free (D-159), When the weekly limits job runs, Then it reads database size, file storage, egress and MAU (today Storage and egress print NOT CHECKED), alerts at 80% of 500 MB, 1 GB, 5 GB and 50,000, and at 60% of any one of them opens a founder spend question (Pro, $25 a month, $300 a year) so the move happens before the 95% read-only point, never after | NS-10; NS-08; D-159; `free-tier-ops.md` | P0 (c) | `ops` | V1; `free-tier-ops.md` (95% read-only; restrictions can return 402 for all API requests, which stops sign-in and new-phone restore) |
| FR-FIN-04 | Given the Asha fixture book on a test database, When `data-architect` measures it, Then the sizing note states bytes per kept letter, per held draft and per earlier version, and months until 475 MB (95% of Free) at 100, 300 and 1,000 families, counting free families' held drafts and `entry_versions` | NS-12; NS-08 "CFO case"; F16 capacity table | P1 | `data-architect` with CFO role | F16: "about 10 KB per letter" [A]; section 3.1 below |
| FR-FIN-05 | Given the backup flip question (NS-08), When the sizing note goes to the founder, Then it prices Supabase Pro storage and egress from the page read that day, shows per family per month and the total at 300 and 1,000 families for 12 months, states that backup stays free and never Plus (D-111 item 6), and states that a flip on Free is not an option | NS-08-R2, R17; D-111; ADR 0024 | P0 (a) at flip | CFO role, `sync`, `ops` | V1; section 3.1 |
| FR-FIN-06 | Given each EAS build, When it is queued, Then the build record notes it against the calendar month's count; at 12 iOS builds in a month the release manager either batches the remaining native changes or sends the founder the Starter question ($19 a month plus usage, $45 build credit). Never an automatic upgrade | D-092; platform pass R19 and section 6; NS-01 rollout; NS-04; NS-06 C | P1 | `ops` (release manager) | V2 |
| FR-FIN-07 | Given sign-in mail through Resend Free (3,000 a month, 100 a day), When sends pass 70 in a day or 2,000 in a month, Then the founder gets the Pro question ($20 a month, $240 a year); and Given the daily cap is hit, When an email link fails to send, Then the parent sees the sign-in outage line (E-S14) with Sign in with Apple still offered, and no letter is affected | E-S04 to E-S06, E-S14; D-121 (no Plus emails in the first store build) | P1 | `ops`, auth engineer | V4 |
| FR-FIN-08 | Given a pack or model upload to R2, When `publish` finishes, Then it prints total stored GB (old versions included, since they are never deleted) against the 10 GB-month free tier; a new language's model size is entered in the register (FR-FIN-01) before upload | NS-17; D-046; D-097 | P1 | `ops`, `speech` | V3; `PACKS_HOSTING.md` (0.8 GB with models; 574 MB model, about 35 reads per install) |
| FR-FIN-09 | Given any string the app shows or schedules (Keep gate, Plan, Plus confirmed, plan reminder note, Home Plus line, every notification), Then it carries no price, currency amount, trial length or "free trial"; the price appears only on Apple's purchase and subscription sheets. A source scan over the `packages/content` keys used by `apps/mobile` fails on a currency symbol or a price pattern, with `en.plus.legal.*` allow-listed only until counsel retires its trial-length lines | D-083; NS-13-R11; NS-32-R12; J-N22; E-S10, E-S11, E-S12, E-S25, E-S26, D-S10 | P0 (b) | `content` | D-083; `plan-notice.tsx`, `plan-reminders.logic.ts` comments [F]; counsel Q41 must confirm the notice duties |
| FR-FIN-10 | Given the store listing and the website, When either shows a price, Then it comes only from `packages/content/src/pricing.ts`, and a release checklist line confirms it equals the App Store Connect price on the day of each price change | E-S27; NS-38; `store.en.ts` line 88 (literal prices today); D-082 | P1 | `content`, `ops` | `pricing.ts` header [F] |
| FR-FIN-11 | Given Plus refunded or revoked by Apple, When the app next checks entitlements, Then it treats the plan as lapsed (E-S11.ended, E-S26), every letter kept while Plus was active stays kept, readable, playable and exportable, nothing is hidden, un-kept or deleted, and the app offers no refund of its own: the Plan refund row points to Apple (reportaproblem.apple.com) | D-082; J-N25; E-S11 `plan.refund`; NS-10-R10 | P0 (a) | payments engineer (`mobile`) | V8, V9; D-080 (no App Store Server Notifications, so the phone is the only place a refund is seen) |
| FR-FIN-12 | Given Apple's billing grace or retry, When StoreKit reports it, Then Plan shows the registered grace or retry line with Apple's billing page (`https://apps.apple.com/account/billing`), with no price and no countdown, and Keep keeps working during grace; Given grace ends unrecovered, Then the lapse rules of J-N25 apply | E-S11.grace, .retry; J-E11 step 4 | P1 | payments engineer, design area E | V7, V9 |
| FR-FIN-13 | Given an offer code, When anyone proposes to create or hand one out, Then it waits for the founder's approval; no code gives more than 31 days free until counsel answers Q41(f); no code in the pilot or before its read-out. "Redeem a code" stays as Apple's redemption sheet only | E-S10, E-S11; NS-03; Q41(f) | P1 | CFO role, CBO role | D-082 ("Offer codes come from Apple"); V7; `16` CMO finding |
| FR-FIN-14 | Given any revenue or proceeds figure in `docs/`, Then it says gross, net of Apple's commission or net of tax, and run-rate or cash; real proceeds stay in App Store Connect and the founder's private records, never in the repo | Frame section 3 business number | P1 | CFO role | CFO skill section 4 |
| FR-FIN-15 | Given the business number (paid starts over first-time downloads), When it is read, Then it is read per install-week cohort from App Store Connect, never blended, with trial-to-paid and first renewal per cohort; "x of n" when n is under 20 | Frame section 3; D-124 | P2 | founder, CFO role | Frame section 3 |
| FR-FIN-16 | Given the Small Business Program (FT-29), When Plus is first sold in production, Then the founder has confirmed enrolment and its approval date, because the 15% rate starts 15 days after the end of Apple's fiscal month of approval | FT-29; Q3-07; Q2-09 | P1 | founder | V6, V7 |
| FR-FIN-17 | Given any vendor setting that could spend (spend cap, overage, auto-upgrade, a trial that converts, a card on file), Then it stays in the no-spend position unless the founder changed it; Supabase Pro, if bought, keeps its spend cap on (the default) | Frame section 8; D-159 | P1 | `ops` | V1 ("Spend cap ... On by default") |
| FR-FIN-18 | Given the review load of the pack (about 122 PRs and at least 244 counted reviews, about 300 review sessions with re-reviews [E]), When work is planned, Then the plan states counted reviews per wave, the harness stays on no paid inference (D-127), and any proposal that needs paid inference, a paid CI minute plan or a paid tool is a founder spend question | `13` section 1; platform pass 5.3 to 5.6 | P1 | Karma | Platform pass section 5.3 [E] |
| FR-FIN-19 | Given the device matrix (SE 3, iOS 17, second phone, iPad), When the first run sheet of a candidate is planned, Then the founder has said which phones he holds, and any purchase is a recorded founder decision with its price read that day; until then the iPad rows run on the simulator and the rows that need a second phone stay off in production | NS-34; NS-10; NS-06 B8b; NS-25; `14` device matrix; platform pass R6, Q10 | P1 | founder, `qa` | `FOUNDER_TASKS.md` [A]; not read this session |
| FR-FIN-20 | Given a second spoken language (NS-17), When it is proposed, Then the founder approves one language at a time with its reviewer cost [E] and model hosting (FR-FIN-08) written down; no prepayment for several languages | NS-17 section 22 | P1 | founder, `speech` | NS-17 "about $1,000 to $1,500 per language" [E] |
| FR-FIN-21 | Given counsel's work on the pack's gates (Q41, Q45, Q48, Q49, Q51, Q53, Q54 and the photo label), When the packet goes out, Then it goes as one scoped request with a fixed-fee ask, and the cost is a founder decision before engagement | Frame section 7; `16` section 8 | P1 | founder, CLO role | `FOUNDER_TASKS.md` "low five figures" [A] |
| FR-FIN-22 | Given the first Apple payout, When it is expected, Then the accountant brief (section 7, A1 to A9) has gone to an engaged accountant | CR-120; Q2-09 | P0 (b) | founder | CR-120 status Gap |
| FR-FIN-23 | Given D-004's entity triggers (1,000 families; $2,000 a month in proceeds; public link or paid marketing; first hire with data access; Android), When a monthly founder note is written, Then it states where each trigger stands; $2,000 a month is about 534 paying families at the blended net in section 3.2 | D-004 points 3 and 4 | P1 | CFO role | D-004 [F]; section 3.2 arithmetic |
| FR-FIN-24 | Given a printed book (NS-30) or any sale outside Apple, When it is proposed, Then a money path exists before any build: who sells, who takes card payments and their fees, refunds and support, sales tax, and whether an entity sells; it is a separate purchase outside Plus | NS-30; NS-07 C28; ADR 0007; X3 | P2 | founder, CBO, CFO and CLO roles | CFO skill 9.1 (BK-14 [E]) |

### 3.1 Run cost per family and per month (prices read 20 Nov 2026)

All volumes are the repo's assumptions: about 10 KB per letter in the database (F16, citing TDD 06) [A]; about 20 letters per family per month (F16: 240 per family in 12 months) [A]; 1.5 accounts per family and under 5 MB of sync data per active account per month (F16) [A]; 19.2 MB of recordings per active family per month (ADR 0005; NS-08) [A].

| Line | Today (Free tiers) | Per family per month | Trigger that starts a bill | If billed |
|---|---|---|---|---|
| Database (words, drafts, versions) | Supabase Free, 500 MB (V1) | about 0.2 MB of growth [A]; $0 | 475 MB (95%) puts the database read-only (`free-tier-ops.md`). At 0.2 MB per family per month: about 24 months at 100 families, about 8 months at 300, about 2.4 months at 1,000 [arithmetic on A]. If `stt_meta` stays on the phone (F16: 290 GB becomes 120 GB), multiply the months by about 2.4. Free families' held drafts count too: 1,000 free families x 20 held drafts x 10 KB = about 200 MB, 40% of Free | Pro $25 a month ($300 a year); 8 GB disk included, then $0.125 per GB (V1). Marginal per family about $0.00 |
| Egress (sync, new-phone pulls) | 5 GB (V1) | up to 7.5 MB [A] | about 660 active families at 7.5 MB, before any new-phone pull (12 MB each, F16) | Pro: 250 GB included, then $0.09 per GB. Marginal about $0.00 below about 33,000 families |
| Recording backup (NS-08, off) | 1 GB file storage (V1) | 19.2 MB new storage [A] | Never on Free: 1 GB holds about 52 family-months (NS-08) | Pro: 100 GB included, then $0.0213 per GB-month. At 1,000 families, about 19.2 GB a month: the included 100 GB lasts about 5 months; at month 12 about 230 GB stored, about $2.77 a month over the included amount, under $0.01 per family per month. A new-phone restore of one year (about 230 MB) is about $0.02 of egress past 250 GB [arithmetic on V1 and A] |
| Speech models and packs | R2, 0.8 GB with models (`PACKS_HOSTING.md`) | $0 | 10 GB-month storage or 10 million reads a month; about 35 reads per install for the 574 MB model, so about 285,000 installs a month before reads cost [arithmetic] | $0.015 per GB-month, $0.36 per million reads, egress free (V3). Whether R2 needs a card on file is UNVERIFIED (V3 is silent): founder-only either way |
| Email (sign-in, account mail) | Resend Free, 3,000 a month, 100 a day (V4) | about 1 email per sign-in [A]; $0 | 100 sends in one day (a launch day) or 3,000 in a month | Pro $20 a month ($240 a year), 50,000 a month, then $0.90 per 1,000 (V4). Plus emails are not sent in the first store build (D-121); if they ship, each payer adds about 3 to 5 a year [A] |
| EAS builds | Free, 15 iOS a month (V2) | n/a (per build) | the 16th iOS build in a month, or a queue that holds up a candidate (D-092) | Starter $19 a month ($228 a year) plus usage; $45 build credit included; per-build price UNVERIFIED (V2 lists none) |
| Website | Vercel Hobby $0 (V5) | n/a | Commercial use on Hobby: UNVERIFIED this session | Pro $20 a month per seat ($240 a year) (V5) |
| Apple Developer Program | $99 a year (V10) | n/a | Renews yearly | $8.25 a month equivalent |
| Analytics, crash, push | None (D-124; frame section 8) | $0 | If the founder turns one on | not priced |

Today's fixed recurring cash: $99 a year to Apple plus domain renewals (UNVERIFIED), about $8.25 a month before domains. Per family per month: about $0.00 at every volume above until a Free limit is reached. The binding limit is the 500 MB database, not storage or egress.

### 3.2 Plus pricing maths (net of Apple, before tax; run-rate unless it says cash)

Prices from D-082 and `pricing.ts`: Plus Monthly $4.99 with 1 month free; Plus Annual $49.99 with 2 months free.

| Case | Formula | Net per period | Net per month |
|---|---|---|---|
| Monthly, Small Business Program (V6, V7) | 4.99 x 0.85 | $4.24 | $4.24 |
| Annual, Small Business Program | 49.99 x 0.85 | $42.49 | $3.54 |
| Monthly, not enrolled, first year (V7) | 4.99 x 0.70 | $3.49 | $3.49 |
| Annual, not enrolled, first year | 49.99 x 0.70 | $34.99 | $2.92 |
| Gap per annual subscriber in year one | 42.49 - 34.99 | $7.50 | |
| Blended per payer, program, 70% annual [A] | 0.7 x 3.541 + 0.3 x 4.2415 | | $3.75 |

"Minus applicable taxes" is Apple's wording (V7): the figures above are before any tax effect, and the accountant must confirm how they are reported.

- Break-even on fixed costs: Supabase Pro plus Apple, $33.25 a month / $3.75 = 9 paying families. All four paid tiers (Supabase Pro $25, EAS Starter $19, Resend Pro $20, Vercel Pro $20) plus Apple: $92.25 a month ($1,107 a year) / $3.75 = 25 paying families. The repo's older $91 floor included Sentry Team, which is not in the stack (frame section 8: no crash SDK).
- Cash, not run-rate: an annual subscriber pays nothing for 2 months; a monthly one for 1 month. Apple then pays no later than 45 days after the close of its fiscal month (Schedule 2 section 3.5, read 31 Oct by the CFO skill; UNVERIFIED this session). Plan first cash from an annual start at about 3.5 to 4 months, not 2.
- Free allowance (D-082, planned raise 2, 5, 10): the allowance costs no cash; it delays revenue. Its run cost is the database rows of families who never pay (FR-FIN-04). Raising it moves when a family meets the gate, never what they keep.
- Principle 6 (ruling T2): Plus holds one paid act, keeping beyond the allowance. Every capability that ships free in 1.0.x stays free, so new cards add value per payer without adding a price. The money consequence: any free card that adds server cost (FR-FIN-02) is paid for out of the same $3.75 per payer for as long as 1.0.x lasts. Today every such card costs under $0.01 per family per month on Pro (section 3.1); the gate keeps it that way.
- The Small Business Program rate ends for future sales if proceeds pass 1 million USD in a calendar year (V6). Not a near-term number; noted so no model assumes 85% forever.

### 3.3 Spend gates the founder must approve (default for each: no spend)

| Gate | Cost | Recurring? | What happens if nobody cancels | How to cancel | Recommended trigger |
|---|---|---|---|---|---|
| Supabase Pro (production) | $25 a month, $300 a year (V1) | yes | Renews monthly; overage off while the spend cap stays on | Supabase dashboard, billing | When the weekly check passes 60% of any Free limit, or before any backup flip, whichever first |
| Recording backup flip (NS-08) | Pro (above) plus under $0.01 per family per month in year one (3.1) | yes | Storage grows every month and is kept "until removed" | Flip off; copies deleted on the published clock (D12) | Only after the six NS-08 conditions, counsel Q42 and a CFO sizing note read that week |
| Test devices | used SE 3 about $150 to $350 [A, E]; second phone; iPad (simulator default) | no | n/a | n/a | When he names the phones he holds and one is missing for a P0 row |
| Each second language (NS-17) | about $1,000 to $1,500 reviewer checks [E], plus R2 at $0 within the free tier | no (per language) | n/a | n/a | One language at a time, after its corpus pre-check |
| Proof books (NS-07 C28) | amount in the exec record; not readable here, UNVERIFIED | no | n/a | n/a | Default no spend (taken 20 Nov); layout numbers stay open |
| Counsel | "low five figures" for about ten documents [A] | no (per engagement) | n/a | n/a | One scoped packet, fixed fee |
| Accountant | not priced (UNVERIFIED) | likely yearly | Annual engagements renew | Engagement letter | Before the first payout (CR-120) |
| EAS Starter | $19 a month plus usage (V2) | yes | Renews; usage past the $45 credit bills | expo.dev billing | Over 15 iOS builds in a month, or a queue blocking a candidate (D-092) |
| Resend Pro | $20 a month (V4) | yes | Renews; overage at $0.90 per 1,000 | Resend billing | 70 sends in a day or 2,000 in a month |
| Vercel Pro | $20 a month per seat (V5) | yes | Renews | Vercel billing | If Hobby's terms rule out a commercial site (UNVERIFIED) |
| R2 with a card on file | $0 within free tier (V3) | usage-based | Bills past the free tier | Cloudflare billing | Already D-097; confirm a card is on file and that usage alerts exist |
| Billing Grace Period (Apple setting) | revenue setting, not a cost | n/a | n/a | App Store Connect | Section 7, F10 |
| Offer codes | revenue given away | n/a | n/a | App Store Connect | Section 7, F11 |

### 3.4 Build cost in PRs and review load

From `13-engineering-plan.md` (S is 1 PR, M 2 to 4, L 5 or more; every PR costs two counted reviews) and the platform pass section 5.3 [E]:
- Critical path to Photos and Find on in production: about 38 to 40 PRs, at least 80 counted reviews.
- Whole pack, parked cards excluded, NS-17 counted as one language: about 122 PRs, at least 244 counted reviews; with one re-review on half of them, about 300 review sessions.
- Largest cards by PRs: NS-01 17, NS-06 B 7, NS-12 6, NS-17 6 (per language), NS-02 6, NS-25 6, cross-cutting 14.
- Cash cost: $0 marginal under D-127 (no paid inference; counted reviews come from the founder's own interactive sessions). The real cost is the founder's review hours and plan usage, which set the pace (platform pass R1, rated H x H). Each extra language adds about 6 PRs and 12 counted reviews.
- Builds: no over-the-air updates (platform pass section 6), so every shipped change is a store build. Native work (photo module, writing-tools prop, doorways) should be batched into one candidate per milestone to stay inside 15 iOS builds a month.

## 4. Design needs

| Screen or state | Need | Why |
|---|---|---|
| E-S10 Keep gate (all states) | Keep as designed: no price, trial, count or countdown; "Redeem a code" opens Apple's redemption sheet only | FR-FIN-09, FR-FIN-13; D-083 |
| E-S11 Plan in Me, `.grace` and `.retry` | Add a quiet action that opens Apple's billing page (`https://apps.apple.com/account/billing`); no price, no date countdown; replace "safe" in `plan.retry` as WORDS flag CG5 proposes | FR-FIN-12; V9 |
| E-S11 Plan, `plan.refund` row | Points to Apple (reportaproblem.apple.com); no in-app refund flow, no form | FR-FIN-11; V8 |
| E-S11.ended after a refund | Confirm the `.ended` state covers a refund or revocation with the same words as a lapse; no word that blames or names the refund | FR-FIN-11 |
| E-S12 Plus confirmed | No price on this screen; plan name, dates, cancel-by and how to cancel only | FR-FIN-09; D-083 |
| E-S25 Plan reminder note; D-S10 `plan` class; D-S11.plan | No price, amount, trial length or child name (already NS-32-R12); the lock-screen placeholder "A reminder about your plan" | FR-FIN-09 |
| E-S26 Home Plus line, A-S01.plusLine | Endorse the WORDS CHANGE from "always free" to "stay free": "always" is an open-ended promise (T1, principle 6) | FR-FIN-09; Q40 |
| `en.plus.legal.*` above Apple's sheet (E-S10, E-S11) | Keep until counsel retires its two trial-length lines; it is the scan's only allow-list entry | FR-FIN-09; Q41 |
| E-S27 App Store page; website | Prices only from `pricing.ts`; a price change updates App Store Connect, `pricing.ts`, the StoreKit file and the listing together | FR-FIN-10 |
| E-S04 to E-S06, E-S14 | Email sign-in failing at the provider's daily cap shows the outage line with Sign in with Apple still offered | FR-FIN-07 |
| C-S18 Storage | No change; the parent's phone space for pictures is theirs and the screen already names it | NS-01 |
| Printed book purchase (NS-30) | New screen needed only if NS-30 is ever taken up: a purchase outside Apple, not designed now | FR-FIN-24 |

## 5. Card changes I propose (for Karma to rule)

| Card row | Change | Why |
|---|---|---|
| `00` section 8, run-cost table | Replace with section 3.1's lines and read dates (V1 to V5, V10); add the database line (words, held drafts, versions) as the first Free limit; replace "the limit is not stated here" for Resend with 3,000 a month and 100 a day; EAS Starter includes $45 of build credit | CFO ruling in `00` asks for read dates and units; the 500 MB database binds before storage |
| `00` section 8, "Cards that add zero server cost" | Add the list of cards that do add it: NS-06 B, NS-08, NS-12, NS-17, NS-25, NS-26, NS-28, each pointing to FR-FIN-02 | T2 makes their cost permanent once on |
| NS-08 sizing arithmetic | Replace "Paid storage prices are not read in this session (UNVERIFIED)" with V1's Pro figures (read 20 Nov) and section 3.1's 1,000-family row; keep the conclusion | NS-08-R2 asks for priced paths |
| NS-12 section 10 and a new row NS-12-R9 (P1) | Add a size line: bytes per version and growth per family per month, measured (FR-FIN-04); a ceiling or removal path is a product decision if growth is material | Versions already accumulate on the server, kept until removed (D8) |
| NS-25 section 22 | Add a per-two-parent-family cost line (MAU, rows, pulls) under FR-FIN-02 | Second account per family is the largest change in server load in the pack |
| NS-17 section 22 | Replace "plus model hosting on the pack host" with the R2 figures (V3) and FR-FIN-20's one-language-at-a-time rule | Cost is $0 within the free tier, but it must be counted |
| NS-07 OQ-1 | Write the proof-book amount and its read date into the card instead of "the amount in the exec record" | A spend decision must be readable where it is asked |
| NS-34 section 22 | Mark the device price UNVERIFIED and point to FR-FIN-19's decision record | No vendor price was read |
| NS-10 section 8 | Add: a full pull is about 12 MB per account [A] and counts against Free egress (FR-FIN-03) | Restores share the 5 GB |
| `14` section 7 | Add a P0 row under J-N25: "a refunded or revoked Plus behaves as a lapse; kept letters unchanged" | FR-FIN-11 has no test today |

## 6. Engineering needs (backlog rows to add or change)

| Row | Change | Owner |
|---|---|---|
| New: weekly limits job reads Storage and egress | `scripts/ops/free-limits.ts` prints NOT CHECKED for both today; read them (or add a dated manual step) and alert at 80%, founder question at 60% (FR-FIN-03) | `ops` |
| New: bytes per letter, held draft and version on the Asha fixture | One measurement script and a sizing note (FR-FIN-04) | `data-architect` |
| New: price scan in content rules | Extend `packages/content/test/rules.test.ts` with the FR-FIN-09 pattern and the one allow-list entry | `content` |
| New: refund and revocation test | A StoreKit test-session case where a transaction is refunded: plan reads lapsed, kept letters unchanged, Keep of a new letter meets E-S10 (FR-FIN-11) | payments engineer (`mobile`) |
| New: build ledger | Each candidate's build record counts EAS iOS builds in the month (FR-FIN-06) | `ops` |
| New: R2 storage line in `publish` output (FR-FIN-08) | Print bytes stored after upload | `ops` |
| New: listing price from one source (FR-FIN-10) | `store.en.ts` builds its PLUS sentence from `plusPriceLine` in `pricing.ts`, or a test asserts the two agree | `content` |
| BL-958 and BL-988 (proposed) | The G6 gate record gains a "run cost" column for cards in FR-FIN-02 | `ops` |
| BL-965 (words) | Carries `plusLine` "stay free" and the `plan.retry` wording fix | `content` |

## 7. Founder, counsel and accountant questions, each with a recommended default

Founder (every default is no spend):

| # | Question | My recommendation | Default if no answer |
|---|---|---|---|
| F1 | When does production move to Supabase Pro ($25 a month, $300 a year)? | At 60% of any Free limit on the weekly check, or before any backup flip. Keep the spend cap on | Stay on Free (D-159) |
| F2 | Which phones do you hold (SE 3, iOS 17, a second phone, an iPad)? | Name them before the first run sheet; buy a used SE 3 only if none is held | Buy nothing; iPad rows on the simulator; second-phone rows stay off in production |
| F3 | Second languages | One at a time, after a corpus pre-check | No spend |
| F4 | Proof books | Wait until NS-07 is next in the wave | No spend (taken 20 Nov) |
| F5 | Counsel | One packet with the pack's gating questions, fixed fee | No engagement |
| F6 | EAS Starter | Batch native changes; upgrade only for a month that needs it | Stay on Free (D-092) |
| F7 | Resend Pro | Upgrade before a public launch day if 100 a day could be reached | Stay on Free |
| F8 | Is the website allowed on Vercel Hobby? | Read Vercel's fair use page; if commercial use needs Pro, decide with that page open | No change |
| F9 | Is the Small Business Program enrolment approved, and on what date? | Enrol now if not done; it costs $0 and the rate starts 15 days after the fiscal month of approval | Not enrolled (30% in year one) |
| F10 | Billing Grace Period in App Store Connect | On, 16 days, paid renewals only: no lost days of paid service when recovered (V7); trial-to-paid failures excluded | Off |
| F11 | Offer codes | None until counsel answers Q41(f) and the pilot reads out | None |
| F12 | D-004 hedge: start an entity in parallel (due 27 Nov) | Talk to the accountant and counsel first; the $800 California LLC tax and formation costs are the accountant's to confirm | No entity, no spend; the 5.1.1(ix) risk stays accepted |
| F13 | Engage an accountant before the first payout (CR-120) | Yes, with the brief below | Not engaged (CR-120 stays Gap) |

Counsel (packet 1.5.0; counsel must confirm every reading):
- Q41: (a) to (i) as written, plus: does the "price only on Apple's sheet" rule (D-083) satisfy California 17602 for in-app notices, given our own Plus emails with the price are not sent in the first store build (D-121)? Default: phone reminders without a price, as built; Apple's receipts carry the amount (UNVERIFIED that they reach these buyers in the windows).
- Q41(f): may an offer code give more than 31 days free? Default: no code over 31 days.
- Q40: is "stay free" in the Home Plus line a binding promise? Default: "stay free" (present state), never "always free".
- Q16: "backup is never a Plus feature" stays internal until costed and read (NS-08 section 20). Default: internal only.
- Q37 and Q52: refunds wording ("Refunds are handled by Apple", "no partial refunds for unused time" in `billing.en.ts`) for the Plan screen and the grief case. Default: as drafted.
- Q30, row "Printed books": the seller, refunds and sales tax for any sale outside Apple. Default: no sale outside Apple.

Accountant (the accountant must confirm each; the founder sends this list; real figures stay with him):
- A1. How are App Store proceeds reported for an individual publisher in California (D-004), and what estimated payments apply at federal and state level?
- A2. Which tax forms does App Store Connect need from a US individual, and what will Apple issue at year end?
- A3. Apple collects and remits US sales tax as the developer's agent (Exhibit B; read 31 Oct, UNVERIFIED this session), but Exhibit C section 15.2 leaves the developer primarily liable for tax Apple did not collect. What must the founder keep or register because of that?
- A4. Are pre-launch costs (counsel, test devices, language reviewers, proof books, the $99 Apple fee, vendor plans) deductible, and how should records be kept?
- A5. Refunds: Apple refunds the customer (V8, V9); how do refunds and chargebacks show in proceeds and in the founder's books?
- A6. When does an LLC or a corporation make sense here, and which; what does the $800 California annual LLC tax (FTB page read 5 Mar 2026 by the CFO skill; UNVERIFIED this session) mean for timing? Note D-004's triggers: $2,000 a month in proceeds is about 534 paying families at $3.75 net each (section 3.2).
- A7. If a printed book is ever sold (NS-30), where is sales tax owed, and what changes if an entity sells?
- A8. If money is ever raised, what entity and tax structure does that need?
- A9. Small Business Program eligibility counts Associated Developer Accounts (V6): does any other account the founder owns or controls count?

New questions that need a number from legal: none.

Chief Financial Officer (Claude role)
