# Registry: every file of the locked requirements pack, by id

Status: CURRENT | 20 Nov 2026 | Owner: `product` for Karma | Replaces: the file map in 22-final-holistic-spec.md section 8 (that section stays; this table adds layer, status and load-when) | Load when: you need to find a file, learn its status, or pick what to load (read LOAD-ORDER.md first, it points here by id).

Written on branch `docs/locked-pack-inputs-20nov`. Requirements rev 2 are LOCKED 20 Nov 2026 (`22-final-holistic-spec.md` section 10): changes only by an errata row (next free E number in `18-errata-after-lock.md`, highest E32), no duplicate copies, one home per fact, link by id. ASCII only.

## How to read this table

- Id: the handle other files use (`C09` is card 09, `F-PRV` is the privacy function review, `DS-C-DESIGN` is area C design). Link by id, never copy a row.
- Layer (founder items 9 and 15): product = what a parent needs and the acceptance rows; design = screens, states, motion, words; execution = backlog, PR, engineering plan, gates, trace. The product layer is meant to carry no tactical ids and the execution layer holds BL and PR ids with a map back.
- Status: CURRENT, LOCKED rev 2, WORKING-INPUT, or SUPERSEDED-BY <file>. A file marked SUPERSEDED-BY is not loaded; a part-only supersession names the part.
- Lines: approximate line count at 20 Nov 2026 so a loader can budget; load by section or by id (grep the NS or FR id), not whole, for any file over 400 lines.

Honest gap on the layer rule: the product-layer cards still carry BL and PR ids in 219 lines across 21 card files (grep for `BL-nnn` or `#nnn`). Ids were not stripped by script (22 section 10). The map back from execution rows to cards exists in `FUNCTION-TRACE.md` and `BACKLOG-GAPS.md`; a manual pass to move tactical ids out of card prose is owed and is not done.

## 1. Cards, records, errata and indexes (docs/product/prd)

| Id | Path | Layer | Status | Owner | Replaces | Load when | Lines |
|---|---|---|---|---|---|---|---|
| BLGAPS | `docs/product/prd/BACKLOG-GAPS.md` | execution | CURRENT (header owned by the counts thread) | `qa` | none | closing gate G0 (a backlog row for every P0 row) | ~1174 |
| C00 | `docs/product/prd/00-product-frame.md` | product | CURRENT (LOCKED rev 2) | Karma with the CPO role | none | you need the principles, the three-tab IA, or the index of every card | ~210 |
| C01 | `docs/product/prd/01-photo-with-a-letter.md` | product | CURRENT (LOCKED rev 2) | `product` (CPO role) | none | building or testing NS-01 | ~366 |
| C02 | `docs/product/prd/02-find.md` | product | CURRENT (LOCKED rev 2) | `product` (CPO role) | none | building or testing NS-02 | ~297 |
| C03 | `docs/product/prd/03-family-hears-it-pilot.md` | product | CURRENT (LOCKED rev 2) | `product` (CPO role) | none | running or reviewing the NS-03 pilot | ~343 |
| C04 | `docs/product/prd/04-hands-free-capture-spike.md` | product | CURRENT (LOCKED rev 2) | `product` (CPO role) | none | running the NS-04 spike | ~244 |
| C05 | `docs/product/prd/05-share-one-letter.md` | product | CURRENT (LOCKED rev 2) | `product` (CPO role) | none | building or testing NS-05 | ~289 |
| C06 | `docs/product/prd/06-firsts-sealed-letter-quick-capture.md` | product | CURRENT (LOCKED rev 2) | `product` (CPO role) | none | building or testing NS-06 | ~716 |
| C07 | `docs/product/prd/07-remaining-capability-rows.md` | product | CURRENT (LOCKED rev 2) | `product` (CPO role) | none | building or testing NS-07 (C5, C28, G11) | ~591 |
| C08 | `docs/product/prd/08-keeping-and-trust.md` | product | CURRENT (LOCKED rev 2) | Karma with the CPO role | none | building or testing backup, let-go, new phone, Save a copy, earlier versions (NS-08 to NS-12) | ~922 |
| C09 | `docs/product/prd/09-capture.md` | product | CURRENT (LOCKED rev 2) | Karma with the CPO role | none | building or testing capture, reminders, books, languages (NS-13 to NS-20) | ~1309 |
| C10 | `docs/product/prd/10-reading-and-family.md` | product | CURRENT (LOCKED rev 2) | Karma with the CPO role | none | building or testing reading, family and sharing (NS-21 to NS-31) | ~972 |
| C11 | `docs/product/prd/11-foundations.md` | product | CURRENT (LOCKED rev 2) | Karma with the CPO role | none | building or testing foundations: plan notices, accessibility, data rules (NS-32 to NS-37) | ~915 |
| C12 | `docs/product/prd/12-parked-and-not-built.md` | product | CURRENT (LOCKED rev 2) | Karma with the CPO role | none | someone proposes a parked item, or you need what would change our mind | ~28 |
| C13 | `docs/product/prd/13-engineering-plan.md` | execution | CURRENT | Karma | sections 4 and 5 are superseded by 23-dependency-map-and-plan.md sections 2 and 2.1 | you need sizes, skills, order or dependencies for NS-01 to NS-52 | ~159 |
| C14 | `docs/product/prd/14-test-plan.md` | execution | CURRENT | Karma with `qa` | none | you need journeys, the device matrix, gates G0 to G6 or the P0 register | ~151 |
| C15 | `docs/product/prd/15-council-review.md` | product | WORKING-INPUT (record; findings applied in the cards; do not load) | Karma with the CPO role | none | auditing why a round 1 finding was made; otherwise do not load | ~65 |
| C16 | `docs/product/prd/16-council-review-round-2.md` | product | WORKING-INPUT (record of the round 2 debate; rulings live in GAP-LOG and the cards; do not load) | Karma with the CPO role | none | auditing the round 2 debate; otherwise do not load | ~129 |
| C18 | `docs/product/prd/18-errata-after-lock.md` | execution | CURRENT (LOCKED rev 2) (errata register, highest E32) | Karma (CTO role, product side) | none | a card statement and engineering seem to differ, or you change a locked statement (next free E number) | ~42 |
| C19 | `docs/product/prd/19-from-download-to-first-letter.md` | product | CURRENT (LOCKED rev 2) | `product` (PM role, with the CPO role) | none | building or testing sign-up, consent, first letter or account life (NS-38 to NS-45) | ~1768 |
| C20 | `docs/product/prd/20-founder-direction-20nov.md` | product | SUPERSEDED-BY 21-days-cultural-photos-home.md, 22-final-holistic-spec.md section 7 and 27-photo-moments-and-media.md | Karma (product) | none | you need the founder's first-round direction in context; otherwise do not load | ~139 |
| C21 | `docs/product/prd/21-days-cultural-photos-home.md` | product | CURRENT (LOCKED rev 2) | `product` (PM role) | none | building or testing days, background, notification catalogue, picture-first start or Home today (NS-46 to NS-50) | ~1201 |
| C22 | `docs/product/prd/22-final-holistic-spec.md` | product | CURRENT (LOCKED rev 2) (entry point) | `product` | none | FIRST for every role: the whole pack in one reading, the eight founder answers (section 7), the file map (section 8) and the lock (section 10) | ~168 |
| C23 | `docs/product/prd/23-dependency-map-and-plan.md` | execution | CURRENT | `product` | parts of docs/ROADMAP.md, roadmap order tables and 13-engineering-plan.md sections 4 and 5 (section 8 lists them) | you need workstreams, order, gates or the founder queue | ~408 |
| C24 | `docs/product/prd/24-engineering-handoff.md` | execution | CURRENT | `principal-architect` | parts of docs/ARCHITECTURE.md (section 7 lists them) | building the days, catalogue, culture, pictures or Home today work (NS-46 to NS-52) | ~332 |
| C25 | `docs/product/prd/25-instruction-coverage-audit.md` | execution | WORKING-INPUT (audit) | `qa` | none | deciding whether to start development or closing an audit gap; otherwise do not load | ~186 |
| C26 | `docs/product/prd/26-founder-direction-photos-library-and-media.md` | product | WORKING-INPUT (founder direction; carried by 27-photo-moments-and-media.md) | founder, via Karma | none | you need the founder's own words on photo moments and media; otherwise load 27 | ~49 |
| C27 | `docs/product/prd/27-photo-moments-and-media.md` | product | CURRENT | `product` (PM role) | none | building, reviewing or pricing photo-library moments (NS-51) or several pictures and videos per letter (NS-52) | ~483 |
| FEEDBACK | `docs/product/prd/FEEDBACK-LOOP.md` | execution | CURRENT (header already present) | `product` | none | any question, feedback or review comment touches a requirement | ~272 |
| FOUNDERMSG | `docs/product/prd/FOUNDER-MESSAGES-VERBATIM.md` | product | CURRENT (source record) | `product` (extracted from the founder chat) | none | you need the founder's exact words or the instruction index; otherwise do not load | ~163 |
| GAPLOG | `docs/product/prd/GAP-LOG.md` | product | CURRENT | Karma | none | you need the ruling for an open question id (K, RV, CL, D, T, X ids) | ~624 |
| README | `docs/product/prd/README.md` | product | CURRENT (index) | `product` | none | you need the pack index and card shape | ~180 |
| RESUME | `docs/product/prd/RESUME.md` | execution | CURRENT | `product` | none | restarting after a usage limit or outage | ~15 |
| TOOLS-P0 | `docs/product/prd/tools/review/p0.py` | execution | CURRENT (generator; owned by the counts thread, not edited here) | `qa` | none | regenerating the P0 register counts | ~349 |
| TRACE | `docs/product/prd/FUNCTION-TRACE.md` | execution | CURRENT (generated; header owned by the trace-gen thread) | `product` (script) | none | tracing a function requirement to cards, screens and backlog rows | ~4501 |

## 2. Function reviews (docs/product/prd/functions)

| Id | Path | Layer | Status | Owner | Replaces | Load when | Lines |
|---|---|---|---|---|---|---|---|
| F-AIS | `docs/product/prd/functions/ai-and-speech.md` | product | CURRENT (LOCKED rev 2) (function review) | `speech` | none | AI, speech, faithful-edit and model-tier work (FR-AIS) | ~416 |
| F-BKO | `docs/product/prd/functions/back-office.md` | product | CURRENT (LOCKED rev 2) (function review) | `ops` (operations and support engineering role) | none | staff tools, hands, suspension, account acts (FR-BKO) | ~368 |
| F-BRIEF | `docs/product/prd/functions/BRIEF.md` | product | CURRENT (LOCKED rev 2) (brief) | Karma | none | writing or refreshing a function review | ~31 |
| F-CMP | `docs/product/prd/functions/compliance.md` | product | CURRENT (LOCKED rev 2) (function review) | `legal` (compliance lens) | none | store rules, age assurance, evidence per build (FR-CMP) | ~283 |
| F-CUL | `docs/product/prd/functions/cultural-background-data.md` | product | CURRENT (LOCKED rev 2) (function review) | `privacy` | none | cultural background and days data handling (FR-CUL) | ~337 |
| F-DAT | `docs/product/prd/functions/data-and-measurement.md` | product | CURRENT (LOCKED rev 2) (function review) | `decision-science` | none | analytics, metrics, measurement (FR-DAT) | ~347 |
| F-DAY | `docs/product/prd/functions/days-library.md` | product | CURRENT (LOCKED rev 2) (function review) | `content` with `regulatory-affairs` | none | building or reviewing the library of days (FR-DAY) | ~697 |
| F-FIN | `docs/product/prd/functions/finance.md` | product | CURRENT (LOCKED rev 2) (function review) | CFO role | none | price, cost, runway or Apple commission (FR-FIN) | ~363 |
| F-LCY | `docs/product/prd/functions/lifecycle-and-platforms.md` | product | CURRENT (LOCKED rev 2) (function review) | `sync` | none | phone changes, claims, deletion across phones, platforms (FR-LCY) | ~348 |
| F-LEG | `docs/product/prd/functions/legal.md` | product | CURRENT (LOCKED rev 2) (function review) | `legal` | none | Terms, IP, counsel questions, contracts (FR-LEG) | ~234 |
| F-LOC | `docs/product/prd/functions/languages-and-localisation.md` | product | CURRENT (LOCKED rev 2) (function review) | `speech` and `content` | none | languages, locale, calendar pins, right-to-left (FR-LOC) | ~335 |
| F-MKT | `docs/product/prd/functions/marketing.md` | product | CURRENT (LOCKED rev 2) (function review) | `marketing` | none | listing, site, claims, launch, email (FR-MKT) | ~333 |
| F-MSG | `docs/product/prd/functions/messaging-and-entry-points.md` | product | CURRENT (LOCKED rev 2) (function review) | `product` (second wave) | none | notifications, deep links, widgets and entry points (FR-MSG) | ~342 |
| F-NTC | `docs/product/prd/functions/notification-catalogue.md` | product | CURRENT (LOCKED rev 2) (function review) | `content` and `mobile` | none | the notification catalogue and rotation (FR-NTC, NS-48) | ~404 |
| F-OPP | `docs/product/prd/functions/feature-opportunities.md` | product | CURRENT (LOCKED rev 2) (function review) | `product` and `user-research` | none | weighing a feature not in the cards (FR-OPP) | ~353 |
| F-OPS | `docs/product/prd/functions/operations.md` | product | CURRENT (LOCKED rev 2) (function review) | `ops` | none | runbooks, releases, data requests (FR-OPS) | ~265 |
| F-PHS | `docs/product/prd/functions/photos-and-suggestions.md` | product | CURRENT (LOCKED rev 2) (function review) | `mobile`, `privacy`, `security` | none | photo suggestions, levels 1 to 3 (FR-PHS) | ~342 |
| F-PRT | `docs/product/prd/functions/print-and-fulfilment.md` | product | CURRENT (LOCKED rev 2) (function review) | CBO role | none | print, fulfilment, partners (FR-PRT; nothing ships in 1.0) | ~414 |
| F-PRV | `docs/product/prd/functions/privacy.md` | product | CURRENT (LOCKED rev 2) (function review) | `privacy` | none | consent, retention, deletion, data rights, the privacy label (FR-PRV) | ~335 |
| F-QAL | `docs/product/prd/functions/quality.md` | product | CURRENT (LOCKED rev 2) (function review) | `qa` | none | test coverage, device rows, regression (FR-QAL) | ~802 |
| F-REL | `docs/product/prd/functions/reliability.md` | product | CURRENT (LOCKED rev 2) (function review) | `ops` | none | reliability, observability, capacity, recovery (FR-REL) | ~360 |
| F-RSH | `docs/product/prd/functions/research-validation.md` | product | CURRENT (LOCKED rev 2) (function review) | `user-research` | none | research and validation plan (FR-RSH) | ~436 |
| F-SEC | `docs/product/prd/functions/risk-security.md` | product | CURRENT (LOCKED rev 2) (function review) | `security-architect` | none | threats, keys, enterprise risk (FR-SEC, FR-RSK) | ~346 |
| F-SUP | `docs/product/prd/functions/support.md` | product | CURRENT (LOCKED rev 2) (function review) | `support` | none | support, trust and safety, policy (FR-SUP, FR-POL) | ~311 |

## 3. Inputs (docs/product/prd/inputs)

| Id | Path | Layer | Status | Owner | Replaces | Load when | Lines |
|---|---|---|---|---|---|---|---|
| I-AUTH | `docs/product/prd/inputs/first-run-auth-security.md` | execution | WORKING-INPUT | `security` | none | building or reviewing sign-up and sign-in security (NS-38 to NS-45) | ~346 |
| I-CMP | `docs/product/prd/inputs/first-run-compliance.md` | execution | WORKING-INPUT | `regulatory-affairs` | none | a compliance or risk check of the first run (NS-38 to NS-45) | ~259 |

## 4. Review records and generators (docs/product/prd/tools)

| Id | Path | Layer | Status | Owner | Replaces | Load when | Lines |
|---|---|---|---|---|---|---|---|
| REV-00-rulings-round2 | `docs/product/prd/tools/review/00-rulings-round2.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~49 |
| REV-AGENT-BRIEF | `docs/product/prd/tools/review/AGENT-BRIEF.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~59 |
| REV-bl-new | `docs/product/prd/tools/review/bl-new.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~258 |
| REV-design-reconcile-BRIEF | `docs/product/prd/tools/review/design-reconcile-BRIEF.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~5 |
| REV-eng-A-data-and-sync | `docs/product/prd/tools/review/eng/A-data-and-sync.md` | execution | WORKING-INPUT (engineering evaluation behind errata E1 to E32; findings applied in C18) | the review role named in the file | none | reading section 8, which C18 cites; otherwise do not load | ~410 |
| REV-eng-B-mobile-client | `docs/product/prd/tools/review/eng/B-mobile-client.md` | execution | WORKING-INPUT (engineering evaluation behind errata E1 to E32; findings applied in C18) | the review role named in the file | none | reading section 8, which C18 cites; otherwise do not load | ~541 |
| REV-eng-C-platform-quality-delivery | `docs/product/prd/tools/review/eng/C-platform-quality-delivery.md` | execution | WORKING-INPUT (engineering evaluation behind errata E1 to E32; findings applied in C18) | the review role named in the file | none | reading section 8, which C18 cites; otherwise do not load | ~530 |
| REV-gap-agents-common | `docs/product/prd/tools/review/gap-agents-common.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~5 |
| REV-handback-notes | `docs/product/prd/tools/review/handback-notes.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~19 |
| REV-ns46-50-BRIEF | `docs/product/prd/tools/review/ns46-50/BRIEF.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~5 |
| REV-ns46-50-analytics | `docs/product/prd/tools/review/ns46-50/analytics.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~201 |
| REV-ns46-50-compliance | `docs/product/prd/tools/review/ns46-50/compliance.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~133 |
| REV-ns46-50-content | `docs/product/prd/tools/review/ns46-50/content.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~233 |
| REV-ns46-50-design-systems | `docs/product/prd/tools/review/ns46-50/design-systems.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~220 |
| REV-ns46-50-marketing | `docs/product/prd/tools/review/ns46-50/marketing.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~188 |
| REV-ns46-50-mobile | `docs/product/prd/tools/review/ns46-50/mobile.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~213 |
| REV-ns46-50-privacy | `docs/product/prd/tools/review/ns46-50/privacy.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~193 |
| REV-ns46-50-product | `docs/product/prd/tools/review/ns46-50/product.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~221 |
| REV-ns46-50-qa | `docs/product/prd/tools/review/ns46-50/qa.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~268 |
| REV-ns46-50-security | `docs/product/prd/tools/review/ns46-50/security.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~174 |
| REV-p0-table | `docs/product/prd/tools/review/p0-table.md` | execution | WORKING-INPUT (generated; no header added because the script rewrites it) | `qa` | none | reading per-card P0 counts; otherwise do not load | ~70 |
| REV-queue | `docs/product/prd/tools/review/queue.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~4 |
| REV-r1-product-design-cmo-cbo | `docs/product/prd/tools/review/r1-product-design-cmo-cbo.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~399 |
| REV-r2-privacy-legal-security-data-ai | `docs/product/prd/tools/review/r2-privacy-legal-security-data-ai.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~802 |
| REV-r3-cfo-cto-quality | `docs/product/prd/tools/review/r3-cfo-cto-quality.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~63 |
| REV-round2-karma | `docs/product/prd/tools/review/round2-karma.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~5 |
| REV-wave3-briefs | `docs/product/prd/tools/review/wave3-briefs.md` | execution | WORKING-INPUT (record; findings applied in the cards; do not load) | the review role named in the file | none | auditing where a finding came from; otherwise do not load | ~14 |
| TOOLS-TRACE | `docs/product/prd/tools/trace-gen/*.py (9 scripts)` | execution | CURRENT (generator; owned by the trace thread, not edited here) | `product` | none | regenerating FUNCTION-TRACE.md | ~1619 |

## 5. Design, areas A to E and the e2e index (listed by path only)

Paths are on branch `docs/e2e-ux-20nov`, read from worktree `/home/claude/wt/E` (not edited from here). Each DESIGN.md is part of the lock (22 section 10); the headers inside design files read DRAFT or v2 and have not been normalised to the founder header on that branch.

| Id | Path | Layer | Status | Owner | Replaces | Load when | Lines |
|---|---|---|---|---|---|---|---|
| DS-A-DESIGN | `docs/design/e2e/A-capture/DESIGN.md` | design | CURRENT (LOCKED rev 2 per 22 section 10; the file header on the design branch still reads DRAFT or v2) | design lead, area A | none | building or reviewing the screens and states of area A | ~1044 |
| DS-A-MOTION | `docs/design/e2e/A-capture/MOTION.md` | design | WORKING-INPUT (draft or v2 on the design branch) | design lead, area A (motion) | none | implementing motion for area A | ~371 |
| DS-A-MOTIONPROTO | `docs/design/e2e/A-capture/MOTION-PROTOTYPE.html` | design | WORKING-INPUT (prototype; no header) | design lead, area A | none | seeing the area A flow; do not read as source | ~1061 |
| DS-A-PROTO | `docs/design/e2e/A-capture/PROTOTYPE.html` | design | WORKING-INPUT (prototype; no header) | design lead, area A | none | seeing the area A flow; do not read as source | ~505 |
| DS-A-WORDS | `docs/design/e2e/A-capture/WORDS.md` | design | WORKING-INPUT (strings await founder word approval) | `content` (area A) | none | writing or reviewing strings for area A | ~499 |
| DS-B-DESIGN | `docs/design/e2e/B-book-and-reading/DESIGN.md` | design | CURRENT (LOCKED rev 2 per 22 section 10; the file header on the design branch still reads DRAFT or v2) | design lead, area B | none | building or reviewing the screens and states of area B | ~872 |
| DS-B-MOTION | `docs/design/e2e/B-book-and-reading/MOTION.md` | design | WORKING-INPUT (draft or v2 on the design branch) | design lead, area B (motion) | none | implementing motion for area B | ~266 |
| DS-B-MOTIONPROTO | `docs/design/e2e/B-book-and-reading/MOTION-PROTOTYPE.html` | design | WORKING-INPUT (prototype; no header) | design lead, area B | none | seeing the area B flow; do not read as source | ~1089 |
| DS-B-PROTO | `docs/design/e2e/B-book-and-reading/PROTOTYPE.html` | design | WORKING-INPUT (prototype; no header) | design lead, area B | none | seeing the area B flow; do not read as source | ~582 |
| DS-B-WORDS | `docs/design/e2e/B-book-and-reading/WORDS.md` | design | WORKING-INPUT (strings await founder word approval) | `content` (area B) | none | writing or reviewing strings for area B | ~519 |
| DS-BRIEF | `docs/design/e2e/BRIEF.md` | design | WORKING-INPUT (brief) | design lead (area E) or `design-systems` | none | see the file | ~71 |
| DS-C-DESIGN | `docs/design/e2e/C-keeping-and-trust/DESIGN.md` | design | CURRENT (LOCKED rev 2 per 22 section 10; the file header on the design branch still reads DRAFT or v2) | design lead, area C | none | building or reviewing the screens and states of area C | ~1080 |
| DS-C-MOTION | `docs/design/e2e/C-keeping-and-trust/MOTION.md` | design | WORKING-INPUT (draft or v2 on the design branch) | design lead, area C (motion) | none | implementing motion for area C | ~324 |
| DS-C-MOTIONPROTO | `docs/design/e2e/C-keeping-and-trust/MOTION-PROTOTYPE.html` | design | WORKING-INPUT (prototype; no header) | design lead, area C | none | seeing the area C flow; do not read as source | ~972 |
| DS-C-PROTO | `docs/design/e2e/C-keeping-and-trust/PROTOTYPE.html` | design | WORKING-INPUT (prototype; no header) | design lead, area C | none | seeing the area C flow; do not read as source | ~793 |
| DS-C-WORDS | `docs/design/e2e/C-keeping-and-trust/WORDS.md` | design | WORKING-INPUT (strings await founder word approval) | `content` (area C) | none | writing or reviewing strings for area C | ~675 |
| DS-D-DESIGN | `docs/design/e2e/D-family-sharing-reminders/DESIGN.md` | design | CURRENT (LOCKED rev 2 per 22 section 10; the file header on the design branch still reads DRAFT or v2) | design lead, area D | none | building or reviewing the screens and states of area D | ~1186 |
| DS-D-MOTION | `docs/design/e2e/D-family-sharing-reminders/MOTION.md` | design | WORKING-INPUT (draft or v2 on the design branch) | design lead, area D (motion) | none | implementing motion for area D | ~373 |
| DS-D-MOTIONPROTO | `docs/design/e2e/D-family-sharing-reminders/MOTION-PROTOTYPE.html` | design | WORKING-INPUT (prototype; no header) | design lead, area D | none | seeing the area D flow; do not read as source | ~950 |
| DS-D-PROTO | `docs/design/e2e/D-family-sharing-reminders/PROTOTYPE.html` | design | WORKING-INPUT (prototype; no header) | design lead, area D | none | seeing the area D flow; do not read as source | ~638 |
| DS-D-WORDS | `docs/design/e2e/D-family-sharing-reminders/WORDS.md` | design | WORKING-INPUT (strings await founder word approval) | `content` (area D) | none | writing or reviewing strings for area D | ~804 |
| DS-E-DESIGN | `docs/design/e2e/E-foundations-and-system-states/DESIGN.md` | design | CURRENT (LOCKED rev 2 per 22 section 10; the file header on the design branch still reads DRAFT or v2) | design lead, area E | none | building or reviewing the screens and states of area E | ~959 |
| DS-E-MOTION | `docs/design/e2e/E-foundations-and-system-states/MOTION.md` | design | WORKING-INPUT (draft or v2 on the design branch) | design lead, area E (motion) | none | implementing motion for area E | ~501 |
| DS-E-MOTIONPROTO | `docs/design/e2e/E-foundations-and-system-states/MOTION-PROTOTYPE.html` | design | WORKING-INPUT (prototype; no header) | design lead, area E | none | seeing the area E flow; do not read as source | ~500 |
| DS-E-PROTO | `docs/design/e2e/E-foundations-and-system-states/PROTOTYPE.html` | design | WORKING-INPUT (prototype; no header) | design lead, area E | none | seeing the area E flow; do not read as source | ~565 |
| DS-E-WORDS | `docs/design/e2e/E-foundations-and-system-states/WORDS.md` | design | WORKING-INPUT (strings await founder word approval) | `content` (area E) | none | writing or reviewing strings for area E | ~639 |
| DS-IA-AUDIT | `docs/design/e2e/IA-AUDIT.md` | design | WORKING-INPUT (audit; DRAFT on the design branch) | design lead (area E) or `design-systems` | none | seeing the information architecture and one owner per fact | ~269 |
| DS-INDEX | `docs/design/e2e/INDEX.md` | design | CURRENT (generated index by script) | design lead (area E) or `design-systems` | none | finding a screen or state id across areas | ~892 |
| DS-tools-build-index | `docs/design/e2e/tools/build-index.py` | design | CURRENT (generator) | design lead (area E) or `design-systems` | none | see the file | ~841 |

## 6. Plan documents

| Id | Path | Layer | Status | Owner | Replaces | Load when | Lines |
|---|---|---|---|---|---|---|---|
| PL-LOCKEDPACK | `docs/engineering/plans/locked-pack-plan.md` | execution | SUPERSEDED-BY docs/product/prd/23-dependency-map-and-plan.md (parts: sections 3 to 7; banner added); engineering order defers to 24 section 4 | Karma (product-side session) | none | you need the work mapping that 23 and 24 cite; otherwise load 24 section 4 | ~152 |
| PL-ROADMAP2027 | `docs/roadmap/ROADMAP-2026-12-to-2027-05.md` | execution | SUPERSEDED-BY docs/product/prd/23-dependency-map-and-plan.md (parts: the order of value table; banner added); its dates table stays CURRENT | CPO role with Karma | dates in docs/backlog/FUTURE.md | you need provisional release windows | ~41 |
| OPS-FEEDBACK | `docs/ops/proposed/requirements-feedback-loop.md` | execution | WORKING-INPUT (PROPOSAL; header already present) | `product` | none | you own scripts/agents, the roster, .github or a charter and want to automate the feedback loop | ~36 |
| PL-STACKRANK | `docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md` | execution | SUPERSEDED-BY docs/product/prd/23-dependency-map-and-plan.md (parts: section 2 In flight, the rank order for waves; banner added) | Karma with the CPO role | none | you need the 19 Nov sizing numbers; use 23 for order | ~178 |

## 7. Older sources and superseded files

| Id | Path | Layer | Status | Owner | Replaces | Load when | Lines |
|---|---|---|---|---|---|---|---|
| OLD-BACKLOG | `docs/BACKLOG.md (section Critical path to submission, 3 Oct)` | execution | SUPERSEDED-BY docs/product/prd/23-dependency-map-and-plan.md sections 2.1 and 2.2 (part: the 12 critical-path rows; file shared, no banner added); rest of the file is CURRENT | backlog PM | none | finding a BL row; read the row, never the file | n/a |
| OLD-NEXT | `docs/roadmap/next/03-requirements/ (NX-39 x2, NX-40; 3 files)` | product | WORKING-INPUT (10 Nov new-scope requirements, earlier set; the NS cards carry them; supersession not stated in the files, so no banner) | Karma | none | tracing where NS-10 or NS-38 to NS-45 came from | n/a |
| OLD-PRD13 | `docs/prd/PRD.md` | product | SUPERSEDED-BY docs/prd/v2/ (own banner, D-105) | PRD leads | none | do not load; requirement ids keep their meaning in v2 | ~969 |
| OLD-PRD13-A | `docs/prd/A-entry-and-auth.md` | product | SUPERSEDED (by chain: own header defers to PRD.md, whose banner says superseded by v2; no direct statement, so no banner added) | section lead A | none | do not load; history only | ~284 |
| OLD-PRD13-B | `docs/prd/B-first-run-and-family.md` | product | SUPERSEDED (by chain: own header defers to PRD.md, whose banner says superseded by v2; no direct statement, so no banner added) | section lead B | none | do not load; history only | ~363 |
| OLD-PRD13-C | `docs/prd/C-habits-pricing-settings.md` | product | SUPERSEDED (by chain: own header defers to PRD.md, whose banner says superseded by v2; no direct statement, so no banner added) | section lead C | none | do not load; history only | ~397 |
| OLD-PRDV2 | `docs/prd/v2/ (13 files: README, 01 to 11, _AUTHORING)` | product | CURRENT (baseline: spec of record since PR #124 per its README; the new-scope pack adds NS cards on top and keeps its requirement ids) | PRD V2 leads | PRD.md | you need a V2 requirement id, a non-functional budget (06) or the quality bar (07); read one file, not the set | n/a |
| OLD-QUEUE | `docs/release/FOUNDER_QUEUE.md` | execution | SUPERSEDED-BY docs/product/prd/23-dependency-map-and-plan.md (parts: the 28 Oct queue and the Build 12 section; banner added) | release manager | none | running release:ready steps; open founder items are in 23 section 4 | ~260 |
| OLD-ROADMAP | `docs/ROADMAP.md` | execution | SUPERSEDED-BY docs/prd/v2/08-delivery.md (own banner, D-101, D-106; 23 section 8) | coordinator | none | do not load; history only | ~140 |
| OLD-SPECS | `docs/design/specs/ (14 files, 10 to 11 Nov design specs)` | design | WORKING-INPUT (e2e re-draws them per card; 25 section 4b proposes marking each superseded once reconciled; not marked here) | design | none | tracing the 11 Nov design source a card cites | n/a |
| OLD-TASKS | `docs/FOUNDER_TASKS.md` | execution | SUPERSEDED-BY docs/product/prd/23-dependency-map-and-plan.md (parts: the FT list of 3 Oct; banner added) | backlog PM | none | do not load; history only | ~534 |
| VISION | `docs/product/VISION.md` | product | CURRENT (not re-verified here) | CPO role | none | you need the vision before the frame | ~60 |

## 8. Project docs (claude.ai Project "Letters & Memories App"; not readable from this session)

No Projects tool was available in this session, so these rows are from the Project doc list in the session context and from file 25 section 4b, not from the docs themselves. Lines unknown (0).

| Id | Path | Layer | Status | Owner | Replaces | Load when | Lines |
|---|---|---|---|---|---|---|---|
| PJ-Karma-new-scope-pack-ready-2026-11-19 | `Project doc claude/Karma-new-scope-pack-ready-2026-11-19.md` | product | UNVERIFIED (not readable here); the v1.0 pack-ready note of 19 Nov, expected SUPERSEDED-BY the 20 Nov doc | Karma / founder | none | do not load; the repo pack is the source after the lock | n/a |
| PJ-Karma-requirements-locked-2026-11-20 | `Project doc claude/Karma-requirements-locked-2026-11-20.md` | product | CURRENT (to be updated in place to rev 2 LOCKED; NOT done, no Projects tool in this session) | Karma / founder | none | do not load; the repo pack is the source after the lock | n/a |
| PJ-exec-rulings-2026-11-19-scope-decisions | `Project doc infra/exec-rulings-2026-11-19-scope-decisions.md` | execution | UNVERIFIED (not readable here); v1.0 scope rulings, expected SUPERSEDED-BY GAP-LOG closures where they differ | Karma / founder | none | do not load; the repo pack is the source after the lock | n/a |
| PJ-exec-rulings-2026-11-20-pre-kickoff-deba | `Project doc infra/exec-rulings-2026-11-20-pre-kickoff-debate.md` | execution | UNVERIFIED here; the brief says it already carries a Status header | Karma / founder | none | do not load; the repo pack is the source after the lock | n/a |
| PJ-final-stack-rank-sizing-and-tasks-2026-1 | `Project doc infra/final-stack-rank-sizing-and-tasks-2026-11-19.md` | execution | UNVERIFIED (not readable here); expected partly SUPERSEDED-BY 23 section 8 like PL-STACKRANK | Karma / founder | none | do not load; the repo pack is the source after the lock | n/a |
| PJ-scope-stack-rank-and-ia-redesign-2026-11 | `Project doc infra/scope-stack-rank-and-ia-redesign-2026-11-19.md` | execution | UNVERIFIED (not readable here) | Karma / founder | none | do not load; the repo pack is the source after the lock | n/a |

## Part-only supersessions (source: 23-dependency-map-and-plan.md section 8)

Banners were added to the top of: `13-engineering-plan.md` (sections 4 and 5), `20-founder-direction-20nov.md` (whole file; verified in 22 section 7 and in file 25 section 4b), `docs/roadmap/ROADMAP-2026-12-to-2027-05.md`, `docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`, `docs/engineering/plans/locked-pack-plan.md`, `docs/release/FOUNDER_QUEUE.md`, `docs/FOUNDER_TASKS.md`. Not bannered, with the reason in its row: `docs/BACKLOG.md` (shared file), `docs/prd/A,B,C` (supersession only by chain), `docs/design/specs/*` and the Project docs (not verified). `docs/ROADMAP.md` and `docs/prd/PRD.md` already carried their own banners.

## What this file could not verify

- Project docs: not readable from this session; statuses are expectations, marked UNVERIFIED.
- `docs/product/prd/17-engineering-project-plan.md` (PR #847) is not on this branch and has no row.
- Design file headers and line counts are read from the design worktree head at the time of writing; that branch moves.
- `FUNCTION-TRACE.md` and `BACKLOG-GAPS.md` have no founder header yet: another thread owns those files and their counts. Add `Status: CURRENT | 20 Nov 2026 | Owner: ... | Replaces: none | Load when: ...` after that thread finishes.
- Owners are taken from each file's own header text; where a file named no agent handle, the role is written as the file words it.
