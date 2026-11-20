# Load order: the least an agent role reads, in order, with line caps

Status: CURRENT | 20 Nov 2026 (all 26 roster handles have a row) | Owner: `product` for Karma | Replaces: the proposed token-light loading rule in 25-instruction-coverage-audit.md section 4b | Load when: you start any task in the requirements pack and want the smallest set of files for your role. Ids are in `REGISTRY.md`; nothing is copied here.

Rules:
- Stop at the cap. If the task needs more, read by id: grep the NS, FR, K, RV, CL or E id and read only that row or section (REGISTRY "Lines" column says what a whole file costs).
- Never load a file whose REGISTRY status is SUPERSEDED-BY or whose "Load when" says do not load (the review records, except section 8 of REV-eng-A and REV-eng-B, which C18 cites; the first-round direction file C20, the older PRD sets, the Project docs).
- "Area" means the design area (A to E) of the card you are working on; `docs/product/prd/22-final-holistic-spec.md` section 3 and `00-product-frame.md` give the card to area map. Design files are on branch `docs/e2e-ux-20nov`.
- A locked statement is changed only by an errata row in C18 (next free E number; highest E80). Rulings are read from GAPLOG by id, not re-argued.

## Everyone, first (about 90 lines)

1. C22: sections 1, 3 and 10 (about 55 lines), then section 7 only if the task touches a founder decision (30 lines).
2. The one card the task names (C01 to C12, C19, C21, C27), its acceptance table only: rows NS-nn-Rn (cap 120 lines).
3. GAPLOG: grep the NS or ruling id (cap 20 lines per id).

## By role (read after "Everyone")

| Role | Then load, in this order (id, part, cap in lines) | Cap after "Everyone" |
|---|---|---|
| mobile | C24 sections 3 and 4 (110); C18 whole (40); REV-eng-B section 8 (30); the card's data and engineering section (60); F-LCY, F-PHS or F-NTC rows by FR id (60); DS-area-DESIGN, the screen ids only (120) | 420 |
| qa | C14 sections 3, 5, 6 (100); C18 whole (40); F-QAL rows by FR id (60); BLGAPS section 1 and 2 (40) | 240 |
| content | C00 principles (50); DS-area-WORDS for the area (150); F-DAY or F-NTC rows only if days or notifications (80); repo `packages/content/VOICE.md` and CLAUDE.md content rules (outside the pack) | 280 |
| design-systems | DS-area-DESIGN (200); DS-IA-AUDIT sections for the area (60); C00 IA section (50); GAPLOG "Card gaps" for the area (50) | 360 |
| data-architect | C24 sections 1 and 2 (100); REV-eng-A section 8 (40); C18 E1 to E12 and E29 (25); F-DAT and F-PRV rows by FR id (60); the card's data inventory (50) | 275 |
| security | F-SEC (120); I-AUTH (100); C24 section 3 (40); C18 E23 and E29 (10); F-PHS security rows (30) | 300 |
| privacy | F-PRV (120); F-CUL and F-PHS rows by FR id (60); GAPLOG K13 and RV-12 (20); the card's data inventory and label effect (50) | 250 |
| legal | F-LEG (120); F-CMP (80); I-CMP (100); C22 section 7 row F6 (5); GAPLOG FOUNDER rows by id (30) | 335 |
| ops | F-OPS (100); F-REL (100); C23 sections 3 and 4 (100); C14 section 6 (20); C24 section 4 (45) | 365 |
| analytics | F-DAT (120); C00 measures section (40); the card's Instrumentation rows by grep (30); GAPLOG K ids touching measurement (20) | 210 |
| sync | F-LCY (120); REV-eng-A section 8 (40); C18 E3 to E7 and E29 (20); C08 NS-10 acceptance (40); C19 NS-45 acceptance and K15 (45) | 265 |
| speech | F-AIS (100); F-LOC (100); C09 NS-17 acceptance including R11 and R12 (30); C18 E10 and E12 (5); GAPLOG K17 (5) | 240 |
| product | C22 whole (170); C23 sections 1 to 4 (150); GAPLOG by id (as needed); C18 whole (40) | 360 |
| marketing | F-MKT (120); C22 section 7 (30); C00 claims rules (40); F-PRT only for print and K14 (40); GAPLOG RV-12 (10) | 240 |
| support | F-SUP (100); F-BKO (80); F-LCY rows FR-LCY-11, 19, 27 (25); C19 K15 paragraph (10) | 215 |
| user-research | F-RSH (120); F-OPP (80); C03 acceptance (60); the `user-research` skill in `.claude/skills` (outside the pack) | 260 |
| red-team | C22 section 10 and section 7 (50); C18 whole (40); FEEDBACK section 3 (60); GAPLOG by id for the ruling under attack (30); F-SEC rows by FR id (40) | 220 |
| payments | F-FIN (100); F-PRT (60); C22 section 7 rows on price and Plus (20); C19 NS-44 allowance rows only (40); GAPLOG CL ids for Plus and Apple commission (20) | 240 |
| principal-architect | C24 whole (330, in two reads); C23 sections 2 to 4 (120); C18 whole (40); REV-eng-A and REV-eng-B section 8 (70); C13 section 5 (30) | 590 |
| data-steward | F-DAT (100); F-PRV (100); F-CUL rows by FR id (40); the card's data inventory (50); C18 E1 to E12 and E29 (25) | 315 |
| security-architect | F-SEC (120); I-AUTH (100); C24 section 3 (40); C18 E23 and E29 (10); F-PHS security rows (30); C19 NS-41 acceptance (40) | 340 |
| compliance-engineer | F-CMP (80); I-CMP (100); C14 section 3 gates G0 to G6 (40); C19 NS-38 to NS-40 acceptance (60); F-LOC rows by FR id (30) | 310 |
| ai-eng-lead | F-AIS (100); F-LOC (60); C09 NS-17 acceptance including R11 and R12 (30); C18 E10 and E12 (5); GAPLOG K12 and K17 (10); C27 NS-52 video rows only (40) | 245 |
| decision-science | F-DAT (100); F-RSH (60); C00 measures section (40); the card's Instrumentation rows by grep (30); FEEDBACK section on metrics (30) | 260 |
| chief-of-staff | C22 section 1, 7 and 10 (80); FEEDBACK whole (270, in two reads); RESUME whole (30); C23 section 7 founder queue (40) | 420 |
| regulatory-affairs | F-CMP (80); F-LEG (80); I-CMP (100); F-DAY and F-CUL rows by FR id (60); C22 section 7 row F6 (5) | 325 |

Check (every roster handle has a row; prints nothing when complete):
`python3 -c "import json;r=json.load(open('agents/roster.json'))['agents'];t=open('docs/product/prd/LOAD-ORDER.md').read();print([x['handle'] for x in r if '| '+x['handle']+' |' not in t])"` (run from the repo root; `agents` in the roster is a list of objects with a `handle`; expected output `[]`).

Founder messages (FOUNDERMSG, 161 lines) and the function trace (TRACE, over 4,000 lines) are never loaded whole: read FOUNDERMSG's instruction index (about 35 lines at the end) only when a requirement's source is in doubt, and grep TRACE by FR id.

## What this file could not verify

- The caps are budgets from line counts at 20 Nov 2026 and from the section headings I read; no agent run has measured the token saving. `qa` or `ops` should sample one harness run per role and adjust the caps.
- The card to design-area map was not re-read for every card; use C22 section 3.
- F-code ids (for example F-LCY) and C-ids are the REGISTRY ids; the FR row ids (FR-LCY-11) are in the function files themselves.
