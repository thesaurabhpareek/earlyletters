# Backlog gaps: P0 rows with no backlog row (20 Nov 2026)

Written by `qa` for gate G0 (`14-test-plan.md`: every P0 row has a test and a backlog row) and errata E30 (`18-errata-after-lock.md`). Docs only. The groups below are filed as 38 `proposed` rows in `docs/BACKLOG.md` (section "Locked pack: P0 rows with no backlog row"; 5.1 maps group to id, and `docs/BACKLOG.md` wins if the two differ); Karma or the founder sets them to `ready`. The list is generated: `python3 -I docs/product/prd/tools/review/p0.py <repo-root> --gaps | --md | --groups | --json` (script header explains the rules). Re-run it after every backlog edit; the numbers below are for this branch (`docs/locked-pack-inputs-20nov`). Counts refreshed 20 Nov 2026 by running `p0.py` at head f8eead016: 850 P0 rows, 588 with no row-level backlog row (first version: 826 and 565).

## 1. Result in one paragraph

850 P0 rows were read: 479 acceptance rows in cards 01 to 12, 19 and 21 (NS-01 to NS-50 with P0 rows) and 371 P0 FR rows in `functions/*.md`. 186 are named by a row-level id or range in a backlog block. 76 more cite an existing `BL-nnn` in the row's own text (4 NS rows, 72 FR rows). **588 have no row-level backlog row**: 544 with no backlog mention at all, and 44 (NS-01, NS-05, NS-11) where only a whole-card `Satisfies:` line (NS-01 by BL-931, BL-933, BL-958 and the study row BL-981; NS-05 by BL-939 and BL-981; NS-11 by BL-963) names the card. **Superseded: E30's "about 70".** E30 (`18-errata-after-lock.md`) counted only the 20 Nov additions to a few locked cards. The real figure under a row-level reading is 588 (about eight times E30's), because cards 19 and 21 (183 P0 rows: 96 in NS-38 to NS-45 and 87 in NS-46 to NS-50) and the function reviews (299 P0 FR rows with no cite) have no backlog rows by design: each card says "new rows needed (no id invented)". The 20 Nov regeneration (`p0.py`, after the ten reviews of NS-46 to NS-50 took card 21 from 63 to 87 P0 rows) moved the totals from 826 / 565 to 850 / 588; the earlier NS-46 to NS-50 counts (14, 17, 11, 17, 4) were stale and are replaced below (22, 27, 13, 21, 4). Cards 22 to 27 are not read by `p0.py` (it reads cards 00 to 21 and `functions/*.md`), so the P0 rows of NS-51 and NS-52 (card 27: 27 and 26 rows with Priority P0 in the section 7 tables, counted by a table parse in a later session, 53 in all, all drop C) are not in the script's totals. They are groups G36 and G37 in 5.1.

**Update, 20 Nov (later run, same branch, function files edited since).** `p0.py --json` now reads 993 P0 rows: 479 in NS cards (unchanged: 186 row-covered, 4 cite-covered, 44 card-level only, 245 gap) and 514 in `functions/*.md` (75 cite-covered, 439 gap), so 728 rows have no row-level backlog row (684 with no mention, 44 card-level only), not 588. The 140 extra FR gap rows are the 20 Nov addenda to the function reviews (FR rows that section 7 does not list); they are group G38 and are not in the per-card numbers of sections 3 and 7, which stay as first generated. With NS-51 and NS-52 the figures are 1,046 P0 rows and 781 with no row (588 + 140 + 53, the sum of the 38 groups). NS-46 to NS-50 counts (22, 27, 13, 21, 4) were checked against `p0.py --md` and match sections 3 and 7. `p0.py --groups` stops with `StopIteration` at the new FR-AIS rows (FR-AIS-57 and later are in no entry of its `AIS` table), so the group counts in section 5 come from section 7, not from a new run; `qa` owns the script.

Card 20 (`20-founder-direction-20nov.md`), 00, 13, 12 hold no P0 acceptance rows. `14-test-plan.md` holds the P0 register (a copy), `15`, `16`, `18` are review records: none is read as a row source.

## 2. Premises checked

| Premise | Result |
|---|---|
| The dispatcher parses only `BL-\d{3}` | Confirmed. `scripts/agents/lib.mjs:52` `const BL_RE = /\bBL-\d{3}\b/g;` (used for `Depends on` at `:100` and blockers at `:107`); `:74` heading regex `^#### (BL-\d{3})\s+(.*)$`; `:141` `takenIds` reads `bl-(\d{3})` from PR branches and titles. `lib.test.mjs:130` counts `^#### BL-\d{3}`. `BL-1000` matches none of them (no word boundary after three digits). `id-collisions.mjs:35` and `hardening.mjs:60` already accept 3 or 4 digits, so `node scripts/agents/next-id.mjs` printed `{"BL":"BL-1000",...}` when run here and steers the next author to an id the dispatcher cannot see. The note under BL-999 (`docs/BACKLOG.md:4052`) says the same. |
| Queue order depends on the id | No. `queueFor` (`lib.mjs:148`) filters the tasks in file order; an id in a gap behaves like any other if its heading is in `docs/BACKLOG.md`. |
| Highest used id | BL-999 (the five function-review rows BL-995 to BL-999 at `docs/BACKLOG.md:4022-4046`). There are 521 `####` headings, 13 `- **BL-nnn` bullet rows (for example BL-551, BL-552, BL-553, BL-561) and 58 `| BL-nnn |` table rows. Only the 521 headings are visible to the dispatcher. 658 distinct ids appear in `docs/BACKLOG.md`; 66 of those have no heading, bullet or table definition (they are only mentioned). |
| Every BL id the cards and function files cite exists | Not all. 111 distinct ids are cited in cards 00 to 21 and `functions/*.md`; 100 are `####` headings. The rest: BL-551, BL-552, BL-553, BL-561 are bullet rows (the dispatcher cannot see them); BL-196, BL-321 are table rows only; BL-790, BL-882 to BL-889 are open-PR ids with no row in `docs/BACKLOG.md`; BL-917 is "never filed" (`19-...md:331`); BL-1000 is cited as "invisible" in `privacy.md:263` and `cultural-background-data.md:193`. FR rows citing a non-heading id: FR-BKO-07 (BL-552), FR-BKO-10 (BL-551), FR-LOC-10 (BL-321), FR-MSG-14 (BL-196), FR-OPS-06, FR-REL-13, FR-SUP-14, FR-POL-07 (BL-551). These count as gaps (the cite does not resolve to a dispatchable row). |
| p0.py's first-version count of cards 01-12 | Reproduced: 221 P0 rows in NS-01 to NS-18, equal to the sum of the old `p0-table.md`; 221 + 75 (NS-19 to NS-37) = 296, the figure in `functions/quality.md:7`. Card 19: 96 P0 rows, equal to `quality.md:7`. FR P0 rows: 371 by an independent grep (`| FR-... | ... | P0`) equals the script's 355 + 16 FR-QAL. |
| Rows covered by a backlog row that cannot deliver | Demoted. A covering row whose status starts `superseded` or whose title starts `Function review`, `End-to-end experience`, `Requirements from`, `Requirements completion` does not count. Effect: NS-08-R19 is a gap (BL-976 says R10 to R19 wait for the founder), and cites to BL-995 to BL-999 and BL-988 are gaps. |

## 3. Counts per card

Columns: P0 rows; row-covered (id or range in a backlog block); cite-covered (the row text cites an existing, usable BL); card-level only (a `Satisfies:` line names the whole card, not the row); gap (nothing). Cards with no P0 row are absent. `FR-xxx` is a function review file.

| Card | P0 rows | Row-covered | Cite-covered | Card-only (weak) | Gap |
|---|---|---|---|---|---|
| NS-01 | 37 | 10 | 1 | 26 | 0 |
| NS-02 | 18 | 18 | 0 | 0 | 0 |
| NS-03 | 7 | 0 | 0 | 0 | 7 |
| NS-04 | 6 | 6 | 0 | 0 | 0 |
| NS-05 | 17 | 2 | 0 | 15 | 0 |
| NS-06 | 31 | 31 | 0 | 0 | 0 |
| NS-07 | 14 | 14 | 0 | 0 | 0 |
| NS-08 | 13 | 5 | 0 | 0 | 8 |
| NS-09 | 13 | 6 | 0 | 0 | 7 |
| NS-10 | 9 | 9 | 0 | 0 | 0 |
| NS-11 | 5 | 2 | 0 | 3 | 0 |
| NS-12 | 5 | 5 | 0 | 0 | 0 |
| NS-13 | 18 | 18 | 0 | 0 | 0 |
| NS-14 | 4 | 2 | 0 | 0 | 2 |
| NS-15 | 4 | 4 | 0 | 0 | 0 |
| NS-16 | 8 | 8 | 0 | 0 | 0 |
| NS-17 | 9 | 0 | 0 | 0 | 9 |
| NS-18 | 3 | 3 | 0 | 0 | 0 |
| NS-19 | 2 | 0 | 0 | 0 | 2 |
| NS-21 | 5 | 2 | 0 | 0 | 3 |
| NS-22 | 2 | 2 | 0 | 0 | 0 |
| NS-23 | 5 | 5 | 0 | 0 | 0 |
| NS-24 | 3 | 2 | 0 | 0 | 1 |
| NS-25 | 13 | 13 | 0 | 0 | 0 |
| NS-32 | 8 | 8 | 0 | 0 | 0 |
| NS-33 | 13 | 6 | 0 | 0 | 7 |
| NS-34 | 3 | 0 | 0 | 0 | 3 |
| NS-35 | 4 | 1 | 0 | 0 | 3 |
| NS-36 | 14 | 2 | 0 | 0 | 12 |
| NS-37 | 3 | 2 | 0 | 0 | 1 |
| NS-38 | 8 | 0 | 0 | 0 | 8 |
| NS-39 | 10 | 0 | 0 | 0 | 10 |
| NS-40 | 11 | 0 | 0 | 0 | 11 |
| NS-41 | 18 | 0 | 1 | 0 | 17 |
| NS-42 | 13 | 0 | 1 | 0 | 12 |
| NS-43 | 11 | 0 | 0 | 0 | 11 |
| NS-44 | 10 | 0 | 0 | 0 | 10 |
| NS-45 | 15 | 0 | 0 | 0 | 15 |
| NS-46 | 22 | 0 | 1 | 0 | 21 |
| NS-47 | 27 | 0 | 0 | 0 | 27 |
| NS-48 | 13 | 0 | 0 | 0 | 13 |
| NS-49 | 21 | 0 | 0 | 0 | 21 |
| NS-50 | 4 | 0 | 0 | 0 | 4 |
| FR-AIS | 43 | 0 | 6 | 0 | 37 |
| FR-BKO | 11 | 0 | 4 | 0 | 7 |
| FR-CMP | 16 | 0 | 1 | 0 | 15 |
| FR-CUL | 16 | 0 | 1 | 0 | 15 |
| FR-DAT | 11 | 0 | 2 | 0 | 9 |
| FR-DAY | 12 | 0 | 5 | 0 | 7 |
| FR-FIN | 6 | 0 | 1 | 0 | 5 |
| FR-LCY | 18 | 0 | 0 | 0 | 18 |
| FR-LEG | 15 | 0 | 4 | 0 | 11 |
| FR-LOC | 20 | 0 | 3 | 0 | 17 |
| FR-MKT | 20 | 0 | 1 | 0 | 19 |
| FR-MSG | 23 | 0 | 14 | 0 | 9 |
| FR-NTC | 9 | 0 | 0 | 0 | 9 |
| FR-OPP | 4 | 0 | 0 | 0 | 4 |
| FR-OPS | 15 | 0 | 3 | 0 | 12 |
| FR-PHS | 23 | 0 | 0 | 0 | 23 |
| FR-POL | 8 | 0 | 0 | 0 | 8 |
| FR-PRT | 4 | 0 | 1 | 0 | 3 |
| FR-PRV | 22 | 0 | 7 | 0 | 15 |
| FR-QAL | 16 | 0 | 3 | 0 | 13 |
| FR-REL | 15 | 0 | 6 | 0 | 9 |
| FR-RSH | 14 | 0 | 4 | 0 | 10 |
| FR-RSK | 4 | 0 | 0 | 0 | 4 |
| FR-SEC | 11 | 0 | 2 | 0 | 9 |
| FR-SUP | 15 | 0 | 4 | 0 | 11 |
| TOTAL | 850 | 186 | 76 | 44 | 544 |

## 4. Free ids

Highest used id is BL-999, so no id above it is allowed by the dispatcher. Only holes below BL-950 are free. I checked three sources for each id 001 to 999: any mention in `docs/BACKLOG.md`; any mention in any `.md`, `.mjs`, `.ts`, `.json`, `.yml`, `.sql`, `.tsx` file in the repo (717 distinct ids); any mention in a commit subject, body or branch name (`git log --all`, 3,687 commits, local clone only).

| Tier | Meaning | Count | Ranges |
|---|---|---|---|
| Used | Appears in `docs/BACKLOG.md` | 658 | - |
| A | Free by all three checks and inside no id range that a commit message allocated ("BL-621 to BL-726" style) | 4 | 826 to 829 |
| B | Free by all three checks as an individual id, but inside a range an old commit allocated; the rows were evidently never written or were removed | 246 (250 with Tier A) | 6 to 8, 12, 17 to 19, 25 to 29, 38 to 39, 45 to 49, 56 to 59, 91 to 98, 126 to 128, 132, 162 to 163, 168, 181 to 188, 198, 208, 291 to 298, 328, 350, 606, 609 to 619, 623, 625 to 628, 630, 632, 634 to 636, 639 to 658, 661 to 669, 672 to 674, 677 to 725, 729 to 735, 738 to 756, 758 to 763, 767 to 769, 771, 773, 784 to 787, 789, 792 to 800, 803, 805 to 813, 818 to 824, 831 to 839, 907 to 914 |
| Held back | Free in `docs/BACKLOG.md` but named somewhere else (a doc, a commit, a branch), for example 9, 11, 13, 61 to 69, 72 to 89, 736, 737, 883 to 888, 898 to 906, 915, 917 to 920 | 91 | not proposed |

Findings: BL-736 and BL-737 exist only in commit subjects and the branch `test/bl-736-alpha-allowance`; BL-917 to BL-921 are proposed in `docs/design/specs/FIRST-RUN-AND-SIGN-IN-JOURNEY-10nov.md` (BACKLOG.md:3137 says so) and BL-922 was taken after them. Using any Tier B id risks colliding with an id a person remembers from a commit message; ask Karma to confirm one block. Recommended block if the fine plan is used: **BL-677 to BL-711** (35 consecutive Tier B ids, one per group G01 to G35). If only Tier A is accepted, use the coarse plan in section 6 (four groups, BL-826 to BL-829). The better fix is the engineering row to read four-digit ids (`lib.mjs:52`, `:74`, `:141`, `lib.test.mjs:130`); then `BL-1000` onward is free and no hole is needed. I did not open that row; it is a person's call.


Recheck 20 Nov (this run). Checked for each id 001 to 999: `docs/BACKLOG.md`; every tracked and untracked file in the repo; `git log --all` messages (3,798 commits); local and remote branch names and tags; the titles, branch names and bodies of all 854 pull requests (178 open, 676 closed) read through the REST API; the ids that `node scripts/agents/id-collisions.mjs` lists as added by open PRs (it ran; the API worked, and it still lists collisions among open PRs on BL-771 to BL-774, which are not among the 38); and the full history of changed lines (`git log --all -G`) for the ids used. Result: Tier A (826 to 829) is now named in `23-dependency-map-and-plan.md` (BL-826 reserved for the four-digit id fix) and is kept for the engineering rows listed in its section 6.4; most of Tier B is named by an open PR (BL-621 to BL-726 are added by #599, BL-727 and BL-728 by #621, BL-757 to BL-825 by #684 and #707, BL-830 to BL-840 by #733, BL-898 to BL-915 by #790) or by a range in an open PR's text (606, 611 to 619, 730 to 732, 735, 741 to 755), so the recommended block BL-677 to BL-711 is **not free**. The ids filed are the 38 listed in 5.1: the ids the backlog's own Numbering paragraph calls free for later splits and no file, commit or PR uses (126 to 128, 181 to 188, 198, 208, 291 to 298, 328), then 6 to 8, 17 to 19, 25 to 29, 38, 39 and 45 to 47, which no file, commit, branch or PR has ever named. BL-055 to BL-099 are never used (the Numbering rule), BL-350 is named in an old header, and 48 and 49 are spare.

## 5. Proposed grouping: 35 new backlog rows

Rules used: one group is one deliverable or one reviewable stack; rows stay in the owner lane the card or function file names; a group that mostly adds "Satisfies" ids to an existing row says so (cheaper than a new row). `Depends on` names existing headings; none of the proposals depends on a row that lacks a heading. Status of each dependency was read on this branch. Sizes follow the harness meaning (S under a day of agent work, M a few PRs, L a stack of reviewable PRs) and are estimates, not measurements.

| Group | Title (as a heading would read) | Covers P0 rows | Rows | Depends on | Size | Backlog id (filed in docs/BACKLOG.md, 5.1) |
|---|---|---|---|---|---|---|
| G01 | Name the card rows in the rows that already carry them (no new work, edit `Satisfies:` lines) | NS-01 (26 rows: R4, R8, R9a, R9b, R13a, R13b, R15, R16a-c, R17a, R17c, R18, R21b, R22, R25, R26, R27, R31, R33, R35, R36, R51, R52, R55, R62); NS-05 (15); NS-11 R10, R12, R23 | 44 | BL-931, BL-939, BL-963 (the rows edited) | S | BL-126 |
| G02 | Pilot privacy and consent handling (NS-03) | NS-03-R1 to R5, R7, R8 | 7 | BL-935 (ready; it holds only the kit and names the card file, not these rows) | S | BL-127 |
| G03 | Recording backup flip rows (NS-08 R10 to R19) | NS-08-R10, R11, R13, R14, R16, R17, R18, R19 | 8 | BL-976 (blocked, PR #622); waits for the founder's flip decision, as BL-976 says | L | BL-128 |
| G04 | Let it go and child switcher: the rows BL-923 to BL-926 do not name | NS-09-R1 to R4b, R7, R8; NS-14-R8, R11 | 9 | BL-925, BL-926, BL-977, BL-941. BL-923 and BL-924 are `done (#832)` and probably already satisfy NS-09-R1 to R3 in code: add the ids, then test | M | BL-181 |
| G05 | Languages: only what is shipped, in a store build (NS-17, FR-LOC) | NS-17-R1 to R8, R10; FR-LOC-01 to 05, 08, 10, 13, 19 to 24, 26, 28, 29 | 26 | BL-965, BL-958; FR-LOC-10 cites BL-321, which has only a table row | L | BL-182 |
| G06 | Capture and reading stragglers of the 20 Nov lock | NS-19-R1, R4; NS-21-R9, R11, R13; NS-24-R10; NS-35-R1, R3, R4; NS-37-R2 | 10 | BL-931, BL-952, BL-947 | M | BL-183 |
| G07 | Accessibility floor rows (NS-33 R1 to R8) | NS-33-R1, R2, R4 to R8 | 7 | BL-927, BL-928, BL-984. BL-927 to BL-928 satisfy LEGAL-REQ-051, not these ids: the fix may be Satisfies lines | S | BL-184 |
| G08 | Quality gates: test plan rows, trace ratchet for backlog rows (NS-34, FR-QAL) | NS-34-R2, R5, R6; FR-QAL-01, 03, 05, 06, 11, 12, 15, 16, 17, 20 to 23 | 16 | BL-929, BL-948, BL-964 (trace sees NS ids). Proposed new check: `p0.py` as a CI step (`docs/ops/proposed/` patch, qa cannot edit workflows) | M | BL-185 |
| G09 | Data follows the letter (NS-36) | NS-36-R1a to R1d, R2, R3, R5, R7, R8, R10, R11, R12 | 12 | BL-933 (blocked), BL-959 (blocked), BL-960, BL-952 | M | BL-186 |
| G10 | Store candidate gate evidence and App Store record (NS-38, FR-CMP) | NS-38-R1 to R5, R7 to R9; FR-CMP-01, 03 to 07, 11 to 13, 15 to 20 | 23 | BL-958, BL-965, BL-975. Founder steps for the store record are not agent work | M | BL-187 |
| G11 | First launch: age first, no prompt, offline (NS-39) | NS-39-R1 to R6, R10, R11, R12, R14 | 10 | BL-965, BL-958 | M | BL-188 |
| G12 | The age gate and the country hook (NS-40) | NS-40-R1 to R3, R5 to R10, R12, R13 | 11 | BL-965; D-131 counsel path | M | BL-198 |
| G13 | Sign in: Apple, email code, link, session (NS-41) | NS-41-R1 to R5, R7, R9, R10, R11, R13, R14, R16, R18 to R20, R22, R23 | 17 | BL-053 (needs-founder FT-07/12/13), BL-961; split into three PRs (screens, server limits, Apple) | L | BL-208 |
| G14 | Agree to the Terms and the sensitive-data question (NS-42) | NS-42-R1 to R6, R9, R10, R11, R13, R15, R16 | 12 | BL-577, BL-579 (both deferred), G13. NS-42-R7 is cite-covered by BL-577 | M | BL-291 |
| G15 | The first book: name, birthday, signs-as (NS-43) | NS-43-R1 to R4, R6, R7, R8, R10, R11, R13, R14 | 11 | G12, G14 | M | BL-292 |
| G16 | The first Keep and the allowance gate (NS-44) | NS-44-R1 to R4, R6 to R10, R12 | 10 | G15, BL-965 | M | BL-293 |
| G17 | Sign out and Delete account on the phone (NS-45) | NS-45-R1 to R3, R5 to R13, R15, R16, R18 | 15 | BL-237 (done in part), BL-961, G13 | L | BL-294 |
| G18 | Days we mark and the Home slip (NS-46, NS-50, FR-DAY) | NS-46-R2, R4, R5, R7, R8, R14, R16, R17, R19, R22, R23, R26, R27, R30, R31, R32, R34, R35, R36, R46, R48; NS-50-R2, R3, R8, R11; FR-DAY-02, 04, 06, 15, 20, 23, 25 | 32 | BL-966, BL-963, BL-965, BL-537 (deferred). Counsel and a tradition reviewer gate public days (NS-46-R23, FR-DAY-23) | L | BL-295 |
| G19 | Cultural background store and lock-screen rules (NS-47, FR-CUL) | NS-47-R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13, R15, R16, R17, R18, R21, R22, R23, R24, R25, R26, R29, R34, R36, R38; FR-CUL-01, 02, 03, 04, 05, 06, 07, 08, 09, 11, 12, 16, 21, 22, 23 | 42 | G18, BL-961, BL-975 (label guard). Privacy review before any build outside the founder's family | L | BL-296 |
| G20 | Notification catalogue and rotation (NS-48, FR-NTC) | NS-48-R1, R2, R3, R4, R5, R9, R10, R11, R21, R26, R28, R30, R36; FR-NTC-01, 02, 03, 04, 05, 08, 09, 10, 11 | 22 | BL-966, G18, BL-537 | M | BL-297 |
| G21 | Suggestions from the library, level 2 (NS-49, FR-PHS, FR-OPP) | NS-49-R3, R6, R7, R9, R10, R11, R12, R13, R15, R16, R17, R19, R21, R23, R24, R25, R26, R27, R28, R33, R35; FR-OPP-03, 05, 06, 09; FR-PHS-04, 11, 12, 14, 15, 17, 19, 20, 22, 23, 33, 40, 41, 43, 44, 50, 51, 52, 53, 54, 55, 56, 57 | 48 | BL-931, BL-952, BL-962; build in two stacks (module, then governance and label) | L | BL-298 |
| G22 | Engine guard tests: edit types, verifier, raw words (FR-AIS) | FR-AIS-01, 02, 03, 06, 07, 08, 35, 39, 40, 45, 54, 56 | 12 | none | S | BL-328 |
| G23 | Model files: trust, licence record, download, memory (FR-AIS) | FR-AIS-09, 10, 13, 15, 16, 17, 19, 43 | 8 | BL-043 (needs-founder, cited by four AIS rows) | M | BL-006 |
| G24 | Voice and language handling in the engine (FR-AIS) | FR-AIS-21, 23, 25, 26, 27, 29, 33, 34 | 8 | G05 | M | BL-007 |
| G25 | AI governance: test sets, agent permissions, source scan (FR-AIS) | FR-AIS-36, 37, 46, 47, 48, 49, 50, 51, 53 | 9 | none; AIS-46 asks counsel a new numbered question | S | BL-008 |
| G26 | Back office, operations and finance runbooks (FR-BKO, FR-OPS, FR-FIN) | all FR-BKO, FR-OPS, FR-FIN gaps (24) | 24 | BL-237; BL-551 to BL-553 exist only as bullets: convert to headings first | M | BL-017 |
| G27 | Reliability and lifecycle (FR-REL, FR-LCY) | all FR-REL, FR-LCY gaps (27) | 27 | BL-961, BL-566, BL-978, BL-929 | L | BL-018 |
| G28 | Security and risk rows (FR-SEC, FR-RSK) | all FR-SEC, FR-RSK gaps (13) | 13 | BL-961, BL-962, BL-552 (bullet only) | M | BL-019 |
| G29 | Measurement guardrails (FR-DAT) | all FR-DAT gaps (9) | 9 | BL-975 | S | BL-025 |
| G30 | Privacy engineering rows (FR-PRV) | all FR-PRV gaps (15) | 15 | BL-960, BL-962, BL-577 | M | BL-026 |
| G31 | Legal texts and print rules (FR-LEG, FR-PRT) | all FR-LEG gaps (11), FR-PRT-02, 39, 45 | 14 | BL-973 (blocked), BL-949; counsel answers gate the public texts | M | BL-027 |
| G32 | Marketing claims and store words (FR-MKT) | all FR-MKT gaps (19) | 19 | BL-965, BL-958 | M | BL-028 |
| G33 | Support and policy (FR-SUP, FR-POL) | all FR-SUP, FR-POL gaps (19) | 19 | BL-364, BL-444, BL-551 and BL-552 (bullets) | M | BL-029 |
| G34 | Research and validation rules (FR-RSH) | all FR-RSH gaps (10) | 10 | BL-981 | S | BL-038 |
| G35 | Messaging and entry points (FR-MSG) | all FR-MSG gaps (9) | 9 | BL-364, BL-510, BL-053 | M | BL-039 |

Row counts sum to 588 (check: `p0.py --groups`). Every gap row sits in exactly one group; the per-row group is the last column of section 7. The 76 cite-covered rows are not in any group; section 8 lists them because a cite to a deferred, needs-founder or done row is weaker than a `Satisfies:` line.

### 5.1 Group to backlog id (the same ids as `docs/BACKLOG.md`, section "Locked pack: P0 rows with no backlog row")

If this table and `docs/BACKLOG.md` ever differ, `docs/BACKLOG.md` wins and this table is corrected. G36 and G37 are the P0 rows of NS-51 and NS-52 (`27-photo-moments-and-media.md`, 27 and 26 rows, all drop C, counted by a table parse because `p0.py` does not read card 27). G38 is the 140 FR rows added to `functions/*.md` on 20 Nov that section 7 does not list. Status of every row is `proposed`. Owner is the backlog owner name; the agent handle is the roster agent that name maps to (`agents/roster.json`). `product` has no owner name in the roster, so G01 and G38 carry the founder as Owner in the backlog and the product agent does the edit.

| Group | Backlog id | Owner (backlog name) | Agent handle | Size | Rows |
|---|---|---|---|---|---|
| G01 | BL-126 | founder (done by product) | product | S | 44 |
| G02 | BL-127 | user researcher | user-research | S | 7 |
| G03 | BL-128 | sync owner | sync | L | 8 |
| G04 | BL-181 | mobile engineer | mobile | M | 9 |
| G05 | BL-182 | content, speech engineer | content | L | 26 |
| G06 | BL-183 | mobile engineer | mobile | M | 10 |
| G07 | BL-184 | mobile engineer, design systems | mobile | S | 7 |
| G08 | BL-185 | qa engineer | qa | M | 16 |
| G09 | BL-186 | export owner, mobile engineer | mobile | M | 12 |
| G10 | BL-187 | platform, content | ops | M | 23 |
| G11 | BL-188 | mobile engineer | mobile | M | 10 |
| G12 | BL-198 | mobile engineer, privacy engineer | mobile | M | 11 |
| G13 | BL-208 | auth owner | security | L | 17 |
| G14 | BL-291 | privacy engineer, mobile engineer | privacy | M | 12 |
| G15 | BL-292 | mobile engineer | mobile | M | 11 |
| G16 | BL-293 | mobile engineer, payments engineer | mobile | M | 10 |
| G17 | BL-294 | mobile engineer, privacy engineer | mobile | L | 15 |
| G18 | BL-295 | mobile engineer, content | mobile | L | 32 |
| G19 | BL-296 | privacy engineer, mobile engineer | privacy | L | 42 |
| G20 | BL-297 | reminders owner | mobile | M | 22 |
| G21 | BL-298 | mobile engineer | mobile | L | 48 |
| G22 | BL-328 | speech engineer | speech | S | 12 |
| G23 | BL-006 | speech engineer | speech | M | 8 |
| G24 | BL-007 | speech engineer | speech | M | 8 |
| G25 | BL-008 | speech engineer | speech | S | 9 |
| G26 | BL-017 | platform | ops | M | 24 |
| G27 | BL-018 | platform | ops | L | 27 |
| G28 | BL-019 | security engineer | security | M | 13 |
| G29 | BL-025 | analytics engineer | analytics | S | 9 |
| G30 | BL-026 | privacy engineer | privacy | M | 15 |
| G31 | BL-027 | legal | legal | M | 14 |
| G32 | BL-028 | content | content | M | 19 |
| G33 | BL-029 | content | content | M | 19 |
| G34 | BL-038 | user researcher | user-research | S | 10 |
| G35 | BL-039 | content | content | M | 9 |
| G36 | BL-045 | mobile engineer, privacy engineer | mobile | L | 27 |
| G37 | BL-046 | mobile engineer, privacy engineer | mobile | L | 26 |
| G38 | BL-047 | founder (done by product) | product | M | 140 |
| Total | | | | | 781 |

Check: 588 rows in G01 to G35, 53 in G36 and G37, 140 in G38 (781). Ids not used: BL-826 to BL-829 are reserved for the engineering rows in `23-dependency-map-and-plan.md` section 6.4, BL-048 and BL-049 are spare.

## 6. Coarse plan if only four ids are allowed (Tier A, BL-826 to BL-829)

| Coarse row | Contains | Rows | Size |
|---|---|---|---|
| C1 (BL-826) Locked-card residue, cards 01 to 37 | G01 to G09 | 139 | L |
| C2 (BL-827) First run, sign-in, consent, first Keep, sign out and store gate (NS-38 to NS-45, FR-CMP) | G10 to G17 | 109 | L |
| C3 (BL-828) Days, cultural background, notifications, suggestions (NS-46 to NS-50 and their FR rows) | G18 to G21 | 144 | L |
| C4 (BL-829) Function-review rows without a card (AIS, ops, reliability, security, privacy, legal, marketing, support, research, messaging, data) | G22 to G35 | 196 | L |

Check: 139 + 109 + 144 + 196 = 588. A single row of 100 to 190 P0 rows cannot be reviewed in one pass; each carries a "Done when: every listed row has a test title and passes" and would have to be split in `Scope` into the G-groups above. The fine plan is better for gate G0; the coarse plan is the fallback E30 allows ("or cover several P0 rows each").

## 7. Full gap list (588 rows)

Band `none` means nothing in the backlog names the row or its card. Band `card-level only` means a backlog row names the whole card. Group is the proposed row of section 5. One-line text is the first 100 characters of the Given, When, Then cell (FR rows start with the rule's title); `(cut)` marks a shortened line.

### NS-01 (26 of 37 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-01-R4 | Given a picked picture and no speech or typing started, When the parent goes back or closes, Then 0 (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R8 | Given any add, replace, undo or remove of a picture, or an edit of its words or place, Then the (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R9a | Given a kept letter with a picture and no photo words, When the letter page opens, Then the picture (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R9b | Given any picture on any surface, Then no machine caption, title, tag, description, date or place (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R13a | Given any screen showing a picture, When the app becomes inactive or goes to the background, Then (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R13b | Given App lock on, When the app opens cold or returns, Then no picture draws until App lock is (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R15 | Given sync on, When a letter with a picture pushes and pulls, Then the push carries no photo_path (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R16a | Given a kept letter with a picture, When it is deleted, Then the picture is hidden in the same step (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R16b | Given a deleted letter with a picture inside the Recently deleted window (F17), When it is (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R16c | Given the window has passed or Delete now is chosen, When the purge runs, Then the picture file is (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R17a | Given an attach that is cancelled, fails to decode, times out, finds too little space or fails to (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R17c | Given a Live Photo, Then only the still is stored and the paired video is never read (NX-39-R12). | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R18 | Given the plan engine, Then attaching, replacing, removing, viewing, the lens and exporting a (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R21b | Given any picture, Then the app never fills in, suggests or reads from the file a photo word or a (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R22 | Given every door to a picture, Then it opens only the iOS system picker, returning one still; there (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R25 | Given a quiet-day mark ("Not much today", D-084), Then no picture control is offered on it and an (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R26 | Given a letter with photo words and a typed place, When sync pushes, Then the payload carries (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R27 | Given a stored copy, Then its file and the photos folder are not excluded from the iPhone backup (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R31 | Given photos on in any build, Then the account-deletion text (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R33 | Given apps/mobile/src/lib/photos and apps/mobile/modules/scribe-photo, Then a source scan finds (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R35 | Given a database at local version 10 with 1,000 letters, drafts, agreements and outbox rows, When (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R36 | Given a kill between writing the stored file and inserting its row, When the app next launches, (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R51 | Given a forced failure of each closed code (section 10), Then logs, breadcrumbs, crash payloads and (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R52 | Given the picker's temporary copy in Caches/ImagePicker and the re-encode's in (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R55 | Given a letter with a picture erased on another phone of the same author, When this phone pulls (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |
| NS-01-R62 | Given each device row of this card, Then it runs on a separate install signed in to a test account (cut) | 01-photo-with-a-letter.md | card-level only: BL-931, BL-933 +2 | G01 |

### NS-03 (7 of 7 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-03-R1 | Given the pilot file, When any parent is contacted, Then a dated counsel read of the consent and (cut) | 03-family-hears-it-pilot.md | none | G02 |
| NS-03-R2 | Given any parent assigned to Arm V, Then both the security read and counsel's voice read are dated (cut) | 03-family-hears-it-pilot.md | none | G02 |
| NS-03-R3 | Given the read-out file in the repo, Then it holds counts and the outcome only: 0 quotes, 0 (cut) | 03-family-hears-it-pilot.md | none | G02 |
| NS-03-R4 | Given the private pilot log, Then raw notes and contact details are deleted 30 days after the (cut) | 03-family-hears-it-pilot.md | none | G02 |
| NS-03-R5 | Given a withdrawal, Then that parent's notes and contact details are deleted within 2 working days (cut) | 03-family-hears-it-pilot.md | none | G02 |
| NS-03-R7 | Given any participant, Then 0 offer codes, payments or gifts are given before the read-out; any (cut) | 03-family-hears-it-pilot.md | none | G02 |
| NS-03-R8 | Given any agent session, Then it never reads the private pilot log; only the read-out counts reach the repo | 03-family-hears-it-pilot.md | none | G02 |

### NS-05 (15 of 17 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-05-R3a | Given Continue, Then the iOS share sheet receives the text and, only if toggled on, one image file; (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R3b | Given the share sheet completes, Then the activity type it returns is never read, stored or logged (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R4a | Given a share, Then the text equals the R18 wrapper around final_text (the version the Book (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R5a | Given any share, Then it contains 0 audio files and no MIME type starting audio/ | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R5b | Given a letter with a stored picture on this phone, Then the picture is attached only if the parent (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R6a | Given an attached picture, Then its file name is exactly letter-photo.jpg (changed 20 Nov from (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R6b | Given the attached file's metadata, Then it holds no child name, email, device name, account id, (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R7 | Given another parent's letter, a sealed letter before it opens, a quiet-day mark, a letter with no (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R10a | Given the share sheet completes (sent, cancelled or failed), Then the temporary picture file is (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R10b | Given a file left in tmp/share (app killed after Continue), When the app next launches, Then the (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R12 | Given any share, Then no row, column, counter, "shared" badge or "last shared" date is stored on (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R18 | Given a share, Then the wrapper is exactly: the letter's about-day (occurred_on; a long date in (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R21 | Given the share call, Then no subject, title or email subject is passed to the share sheet (the (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R25 | Given the letter page or the share flow, Then no NSUserActivity, Spotlight item, Siri suggestion (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |
| NS-05-R27 | Given account A signed out and account B signed in on the same phone, Then B's letter pages offer (cut) | 05-share-one-letter.md | card-level only: BL-939, BL-981 | G01 |

### NS-08 (8 of 13 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-08-R10 | (Flip build) Given a second phone on the same account, Then it downloads recordings and never (cut) | 08-keeping-and-trust.md | none | G03 |
| NS-08-R11 | (Flip build) Given account B signs in on a phone holding A's recordings, Then none of A's (cut) | 08-keeping-and-trust.md | none | G03 |
| NS-08-R13 | (Flip build) Given a lost server answer, Then a retry uses the same object key (entry id plus (cut) | 08-keeping-and-trust.md | none | G03 |
| NS-08-R14 | (Flip build) Given killSwitches.backupUploads turns on during an upload, Then uploads stop and no (cut) | 08-keeping-and-trust.md | none | G03 |
| NS-08-R16 | (Flip build) Given account deletion, Then every object for the account is purged and its escrow (cut) | 08-keeping-and-trust.md | none | G03 |
| NS-08-R17 | (Flip build) Given the plan lapses, Then backup continues, free | 08-keeping-and-trust.md | none | G03 |
| NS-08-R18 | (Flip build) Given the storage quota is reached on our side, Then capture and Keep still work and (cut) | 08-keeping-and-trust.md | none | G03 |
| NS-08-R19 | (Flip build) Given the parent stops backup, Then uploads stop at once and server copies are deleted (cut) | 08-keeping-and-trust.md | none | G03 |

### NS-09 (7 of 13 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-09-R1 | Given one draft marked discarding with its file present, When the launch sweep runs, Then the (cut) | 08-keeping-and-trust.md | none | G04 |
| NS-09-R2 | Given a discarding draft whose delete throws, When the sweep runs, Then the row remains marked (cut) | 08-keeping-and-trust.md | none | G04 |
| NS-09-R3 | Given Discard on Listen and a delete that throws, Then the draft row remains, marked discarding | 08-keeping-and-trust.md | none | G04 |
| NS-09-R4a | Given Let it go in Review and a delete that fails, Then the line is shown once for that take, on (cut) | 08-keeping-and-trust.md | none | G04 |
| NS-09-R4b | Given the line is shown, Then VoiceOver announces it after the screen settles | 08-keeping-and-trust.md | none | G04 |
| NS-09-R7 | Given a let-go of a synced held draft, Then the discard is queued and stays queued until the server (cut) | 08-keeping-and-trust.md | none | G04 |
| NS-09-R8 | Given the discard is applied on a second phone, Then that phone holds neither the row nor the audio (cut) | 08-keeping-and-trust.md | none | G04 |

### NS-11 (3 of 5 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-11-R10 | Given pictures are on (NS-01), Then the copy holds every stored picture copy of the book | 08-keeping-and-trust.md | card-level only: BL-963 | G01 |
| NS-11-R12 | Given a lapsed plan, Then the export runs in full | 08-keeping-and-trust.md | card-level only: BL-963 | G01 |
| NS-11-R23 | Given the share sheet completes or is cancelled, Then the temporary ZIP is deleted; any left after (cut) | 08-keeping-and-trust.md | card-level only: BL-963 | G01 |

### NS-14 (2 of 4 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-14-R8 | Given Listen is open, Then no switcher is on screen | 09-capture.md | none | G04 |
| NS-14-R11 | Given A's selection and B signs in on the same phone, Then the selection resets and no name of A's shows | 09-capture.md | none | G04 |

### NS-17 (9 of 9 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-17-R1 | Given a language without a signed gate, Then it is absent from every picker in a store build | 09-capture.md | none | G05 |
| NS-17-R2 | Given fixture recordings in each unoffered language, Then the English pipeline's output is measured (cut) | 09-capture.md | none | G05 |
| NS-17-R3 | Given any letter, Then no surface offers or performs translation or transliteration | 09-capture.md | none | G05 |
| NS-17-R4 | Given a language that ships, Then the store listing names it and no language that has not shipped | 09-capture.md | none | G05 |
| NS-17-R5 | Given an English-only build and a take, Then Review offers in one tap to mark it as another (cut) | 09-capture.md | none | G05 |
| NS-17-R6 | Given every transcription call, Then it passes the author's chosen language code, never (cut) | 09-capture.md | none | G05 |
| NS-17-R7 | Given a withheld take, Then its machine output is never shown, indexed, shared, printed or exported (cut) | 09-capture.md | none | G05 |
| NS-17-R8 | Given a withheld take, Then its machine output is not synced; if already pushed as a held draft, (cut) | 09-capture.md | none | G05 |
| NS-17-R10 | Given a recording in a held language, Then it is never handed to the recogniser and asks for no (cut) | 09-capture.md | none | G05 |

### NS-19 (2 of 2 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-19-R1 | Given a kept letter, Then no control anywhere records new audio into it | 09-capture.md | none | G06 |
| NS-19-R4 | Given two takes, Then each keeps its own immutable raw transcript and its own verifyEdits pass; (cut) | 09-capture.md | none | G06 |

### NS-21 (3 of 5 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-21-R9 | Given a private letter in a book with one adult, Then the Who can read it row shows | 10-reading-and-family.md | none | G06 |
| NS-21-R11 | Given the other parent's letter, Then no author-only control is present (Who can read it, Sealed (cut) | 10-reading-and-family.md | none | G06 |
| NS-21-R13 | Given this page, Then nothing on it is donated to Spotlight, NSUserActivity search, Siri (cut) | 10-reading-and-family.md | none | G06 |

### NS-24 (1 of 3 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-24-R10 | Given a lapsed plan, Then a year reads in full | 10-reading-and-family.md | none | G06 |

### NS-33 (7 of 13 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-33-R1 | Given the letter page, Then its dateline is a level 1 heading | 11-foundations.md | none | G07 |
| NS-33-R2 | Given Me, Then the screen heading equals the tab label | 11-foundations.md | none | G07 |
| NS-33-R4 | Given the Book, the letter page, Home and Review at the largest text size on an iPhone SE 3, Then (cut) | 11-foundations.md | none | G07 |
| NS-33-R5 | Given Reduce Motion, Then no screen runs a moving loop (device) | 11-foundations.md | none | G07 |
| NS-33-R6 | Given VoiceOver on an iPhone SE 3, Then a parent can start, stop, review, undo a small fix and Keep (cut) | 11-foundations.md | none | G07 |
| NS-33-R7 | Given the largest text size with Bold Text, Then Home, Review, the Book and the letter page pass (cut) | 11-foundations.md | none | G07 |
| NS-33-R8 | Given Increase Contrast, Then every text colour on those four screens holds at least 4.5:1 (token (cut) | 11-foundations.md | none | G07 |

### NS-34 (3 of 3 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-34-R2 | Given a miss, Then the feature behind it is held from a store build until fixed or the target is (cut) | 11-foundations.md | none | G08 |
| NS-34-R5 | Given any device run, Then it uses the Asha test install, and no run sheet, trace or screenshot (cut) | 11-foundations.md | none | G08 |
| NS-34-R6 | Given perf markers, Then they carry no letter text, child name or path (PRIV-R10) | 11-foundations.md | none | G08 |

### NS-35 (3 of 4 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-35-R1 | Given every screen outside Home, Then none starts a new letter or take | 11-foundations.md | none | G06 |
| NS-35-R3 | Given a doorway from outside the app (a notification tap, later a widget or shortcut), Then it (cut) | 11-foundations.md | none | G06 |
| NS-35-R4 | Given a share extension, a notification action or a Siri intent, Then it counts as a doorway under (cut) | 11-foundations.md | none | G06 |

### NS-36 (12 of 14 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-36-R1a | Given a letter with a picture (the stored copy and both smaller copies), a first and a seal, When (cut) | 11-foundations.md | none | G09 |
| NS-36-R1b | Given that letter is restored within the Recently deleted window (30 days), Then all come back | 11-foundations.md | none | G09 |
| NS-36-R1c | Given the window has passed, Then the purge removes every picture file and row for it on the phone | 11-foundations.md | none | G09 |
| NS-36-R1d | Given any letter, Then the entry-photos bucket holds 0 objects for it (ADR 0028 D6 write-deny) | 11-foundations.md | none | G09 |
| NS-36-R2 | Given the export of such a letter, Then every part is in it | 11-foundations.md | none | G09 |
| NS-36-R3 | Given a sealed letter, Then it opens at the same instant on two of the author's own phones set to (cut) | 11-foundations.md | none | G09 |
| NS-36-R5 | Given export 1.7.0, Then it carries each picture at photos/<entry_id>/<media_id>.jpg with the (cut) | 11-foundations.md | none | G09 |
| NS-36-R7 | Given an export at 1.7.0, Then the 1.6.0 schema rejects it and the 1.7.0 schema it carries reads it | 11-foundations.md | none | G09 |
| NS-36-R8 | Given a letter's Find index row, Then it is deleted, hidden and restored with the letter (ties NS-02-R16) | 11-foundations.md | none | G09 |
| NS-36-R10 | Given a new column, Then its migration comment states its level and the classification test passes | 11-foundations.md | none | G09 |
| NS-36-R11 | Given a new synced column, Then the same migration updates the entries content trigger tuple and (cut) | 11-foundations.md | none | G09 |
| NS-36-R12 | Given the log canary, Then no new field's value appears in any log, crash report or analytics event | 11-foundations.md | none | G09 |

### NS-37 (1 of 3 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-37-R2 | Given a recording in progress, Then no picture is decoded | 11-foundations.md | none | G06 |

### NS-38 (8 of 8 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-38-R1 | Given the App Store Connect record before submission, Then the age rating is 18+ (override), (cut) | 19-from-download-to-first-letter.md | none | G10 |
| NS-38-R2 | Given store.en.ts and the build's serverFeaturesEnabled(), When the rules test runs, Then no (cut) | 19-from-download-to-first-letter.md | none | G10 |
| NS-38-R3 | Given the listing and the store name, Then the name equals brand.storeName and no other file (cut) | 19-from-download-to-first-letter.md | none | G10 |
| NS-38-R4 | Given the App Privacy answers, Then they declare what the submitted build collects as listed in (cut) | 19-from-download-to-first-letter.md | none | G10 |
| NS-38-R5 | Given the Notes for Review, Then they name the reason the app asks for an account (letters' words (cut) | 19-from-download-to-first-letter.md | none | G10 |
| NS-38-R7 | Given screenshots, Then each comes from the release build with the Asha book only and shows no (cut) | 19-from-download-to-first-letter.md | none | G10 |
| NS-38-R8 | Given a phone restored from an iCloud device backup, When the app opens, Then Home shows the (cut) | 19-from-download-to-first-letter.md | none | G10 |
| NS-38-R9 | Given the export compliance answer in App Store Connect, Then it matches counsel packet Q24 and the (cut) | 19-from-download-to-first-letter.md | none | G10 |

### NS-39 (10 of 10 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-39-R1 | Given airplane mode and a fresh install, When the app cold starts, Then the age question is (cut) | 19-from-download-to-first-letter.md | none | G11 |
| NS-39-R2 | Given a fresh install through "The book is open.", Then no OS permission prompt appeared (cut) | 19-from-download-to-first-letter.md | none | G11 |
| NS-39-R3 | Given the speech card, Then no speech model byte is requested until the person taps "Download on (cut) | 19-from-download-to-first-letter.md | none | G11 |
| NS-39-R4 | Given the person chose Not now or the download has not finished, When they record a letter, Then (cut) | 19-from-download-to-first-letter.md | none | G11 |
| NS-39-R5 | Given offline after the age answer on a store build, Then E-S14.offline shows within 1 s with Try (cut) | 19-from-download-to-first-letter.md | none | G11 |
| NS-39-R6 | Given serverFeaturesEnabled() off, Then the Welcome shows "Begin the book" only and no sign-in, (cut) | 19-from-download-to-first-letter.md | none | G11 |
| NS-39-R10 | Given the microphone was never asked, When the person first taps Speak, Then our primer shows (cut) | 19-from-download-to-first-letter.md | none | G11 |
| NS-39-R11 | Given the database cannot open at launch, Then E-S01.recovery shows with Try again and Export (cut) | 19-from-download-to-first-letter.md | none | G11 |
| NS-39-R12 | Given a store build, Then the first-run path shows no story card, no "coming soon" line and no Plus (cut) | 19-from-download-to-first-letter.md | none | G11 |
| NS-39-R14 | Given an invite or email link opened before the age answer, When the answer is No, Then the held (cut) | 19-from-download-to-first-letter.md | none | G11 |

### NS-40 (11 of 11 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-40-R1 | Given a fresh install opened by icon, invite link, email link or any deep link, Then the first (cut) | 19-from-download-to-first-letter.md | none | G12 |
| NS-40-R2 | Given Yes and a tick, Then the phone stores ageGate.passed = '1' and no age, birth date, range or (cut) | 19-from-download-to-first-letter.md | none | G12 |
| NS-40-R3 | Given No, Then the stop shows, exactly one row ageGate.stoppedAt exists, a held invite or link (cut) | 19-from-download-to-first-letter.md | none | G12 |
| NS-40-R5 | Given iOS 26.2 or later and an eligible account (when the module ships), When the system answers (cut) | 19-from-download-to-first-letter.md | none | G12 |
| NS-40-R6 | Given any system age answer, Then a test spying on the settings store, the Keychain, the logger and (cut) | 19-from-download-to-first-letter.md | none | G12 |
| NS-40-R7 | Given a new account's Terms record, Then it carries age_attested: true and no age_signal value, (cut) | 19-from-download-to-first-letter.md | none | G12 |
| NS-40-R8 | Given No on the consent sheet's age step, Then the session ends locally, the 18+ gate closes, and (cut) | 19-from-download-to-first-letter.md | none | G12 |
| NS-40-R9 | Given D-131's hook on, When a sign-up comes from a refused country, Then the app shows the neutral (cut) | 19-from-download-to-first-letter.md | none | G12 |
| NS-40-R10 | Given D-131's hook on, When Apple, Google (if on) and email sign-ups are each made from a test (cut) | 19-from-download-to-first-letter.md | none | G12 |
| NS-40-R12 | Given the hook's daily counts, Then they hold counts by result and the country code for refusals (cut) | 19-from-download-to-first-letter.md | none | G12 |
| NS-40-R13 | Given VoiceOver, Then focus starts on the question, the answers read as a choice of two with none (cut) | 19-from-download-to-first-letter.md | none | G12 |

### NS-41 (17 of 18 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-41-R1 | Given a store build with servers on, Then the Welcome offers exactly Sign in with Apple (where (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R2 | Given a known and an unknown address, When Send is tapped, Then the screens, the words and the (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R3 | Given an email link requested on phone A, When it is opened on phone B or by another person, Then (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R4 | Given an account signed in on this phone, When any email link opens the app, Then the session is (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R5 | Given letters on the phone owned by no account, When sign-in and consent finish, Then no letter is (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R7 | Given each AuthErrorKind, Then the screen shows its WORDS 4.2 line with a glyph and words, (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R9 | Given five wrong codes for one address within 15 minutes, Then code entry pauses 15 minutes with (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R10 | Given the code length setting, Then the server's otp_length and the app's (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R11 | Given a code or link, Then each is single use and expires 900 s after sending, and the phone's (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R13 | Given an Apple sign-in, Then the authorization code is posted once to apple-token without (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R14 | Given a session and no book on this phone (a new phone or a reinstall), Then the person never meets (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R16 | Given any sign-in path, Then no email address, code, token hash, Apple code, name or user id (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R18 | Given a Hide My Email address, Then sign-in mail reaches it (the sending domain is registered with (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R19 | Given a session and the session's Keychain items, Then they use (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R20 | Given a store build, Then no Google button and no passkey control renders, and auth.noEmailHelp (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R22 | Given VoiceOver, Then each sign-in screen's heading takes focus, the code field reads as one field (cut) | 19-from-download-to-first-letter.md | none | G13 |
| NS-41-R23 | Given a password set on an account through the API (staging), When password sign-in is tried, Then (cut) | 19-from-download-to-first-letter.md | none | G13 |

### NS-42 (12 of 13 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-42-R1 | Given every visit to E-S03, Then the box is unticked, Continue is enabled and says why when it (cut) | 19-from-download-to-first-letter.md | none | G14 |
| NS-42-R2 | Given Yes and a tick, Then exactly two local rows are written in the same transaction as the age (cut) | 19-from-download-to-first-letter.md | none | G14 |
| NS-42-R3 | Given the Terms step, Then the agreement line is directly above "Agree and continue", the links (cut) | 19-from-download-to-first-letter.md | none | G14 |
| NS-42-R4 | Given the sensitive-data step, Then both answers are the same size and width, nothing is (cut) | 19-from-download-to-first-letter.md | none | G14 |
| NS-42-R5 | Given a decline of sensitive data, Then zero entries are uploaded, the person stays signed in, and (cut) | 19-from-download-to-first-letter.md | none | G14 |
| NS-42-R6 | Given an account with Terms but no sensitive-data consent, When the phone writes an entry, Then the (cut) | 19-from-download-to-first-letter.md | none | G14 |
| NS-42-R9 | Given the version constants on the phone and the documents the links open, Then they are the same (cut) | 19-from-download-to-first-letter.md | none | G14 |
| NS-42-R10 | Given a new major version while signed in, Then the sheet shows before sync resumes, and recording, (cut) | 19-from-download-to-first-letter.md | none | G14 |
| NS-42-R11 | Given a decline of a new version, Then Delete account works from this phone without agreeing, and (cut) | 19-from-download-to-first-letter.md | none | G14 |
| NS-42-R13 | Given any store build, Then no agreement, notice or privacy line names an invitation, "the people (cut) | 19-from-download-to-first-letter.md | none | G14 |
| NS-42-R15 | Given AX5 on SE 3, Then the agreement line and links are fully visible above the buttons they (cut) | 19-from-download-to-first-letter.md | none | G14 |
| NS-42-R16 | Given "Not now" on the Terms step, Then nothing is recorded, nothing syncs, and the book on the (cut) | 19-from-download-to-first-letter.md | none | G14 |

### NS-43 (11 of 11 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-43-R1 | Given a birthday and no name, When the last step is reached, Then one book exists with an empty (cut) | 19-from-download-to-first-letter.md | none | G15 |
| NS-43-R2 | Given no date, Then Continue waits with the reason in words, announced, and no book is made | 19-from-download-to-first-letter.md | none | G15 |
| NS-43-R3 | Given a birthday after today, before 1900-01-01 or not a real day, Then the phone refuses it with (cut) | 19-from-download-to-first-letter.md | none | G15 |
| NS-43-R4 | Given a name of 61 code points after NFC and trimming, Then the phone shows the limit line and the (cut) | 19-from-download-to-first-letter.md | none | G15 |
| NS-43-R6 | Given three children added together, Then three books exist, no Plus surface appeared, and the (cut) | 19-from-download-to-first-letter.md | none | G15 |
| NS-43-R7 | Given signs-as empty or over 30 code points, Then Continue waits with its reason; a valid value (cut) | 19-from-download-to-first-letter.md | none | G15 |
| NS-43-R8 | Given a returning account whose book may be on its way, Then this card's screens are never shown (NS-10-R0) | 19-from-download-to-first-letter.md | none | G15 |
| NS-43-R10 | Given the last step, Then the person lands on Home with the new book active and no sheet, prompt (cut) | 19-from-download-to-first-letter.md | none | G15 |
| NS-43-R11 | Given an English-only build, Then no language row and no "other languages are coming" line appear (cut) | 19-from-download-to-first-letter.md | none | G15 |
| NS-43-R13 | Given AX5 on SE 3 and VoiceOver, Then every field, choice and reason is reachable and read in (cut) | 19-from-download-to-first-letter.md | none | G15 |
| NS-43-R14 | Given a server refusal of a first-run book, Then the book stays on the phone, nothing is deleted, (cut) | 19-from-download-to-first-letter.md | none | G15 |

### NS-44 (10 of 10 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-44-R1 | Given a fresh install from the App Store page to the first kept letter, Then no price, trial, Plus (cut) | 19-from-download-to-first-letter.md | none | G16 |
| NS-44-R2 | Given the first and second Keep with words, Then neither meets E-S10, and both count once each | 19-from-download-to-first-letter.md | none | G16 |
| NS-44-R3 | Given the third Keep with words and Plus off, Then E-S10 rises only after the words were on screen, (cut) | 19-from-download-to-first-letter.md | none | G16 |
| NS-44-R4 | Given a save with no letters or digits in its text, Then it never counts and never meets the gate | 19-from-download-to-first-letter.md | none | G16 |
| NS-44-R6 | Given the microphone never asked, Then the primer comes before iOS's prompt, and a denial leads to (cut) | 19-from-download-to-first-letter.md | none | G16 |
| NS-44-R7 | Given the speech model not on the phone, When a letter is recorded, Then the recording is kept and (cut) | 19-from-download-to-first-letter.md | none | G16 |
| NS-44-R8 | Given Plus status unknown at the third Keep, Then no sheet shows and the letter is held, never discarded | 19-from-download-to-first-letter.md | none | G16 |
| NS-44-R9 | Given "Keep it here for now", Then the letter waits on Home exactly as it is, and any later Keep asks again | 19-from-download-to-first-letter.md | none | G16 |
| NS-44-R10 | Given a remote freeLettersAllowance below 2, Then the phone uses 2 | 19-from-download-to-first-letter.md | none | G16 |
| NS-44-R12 | Given the first Keep, Then the success haptic plays once and no confetti, badge, count or streak appears | 19-from-download-to-first-letter.md | none | G16 |

### NS-45 (15 of 15 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-45-R1 | Given Sign out, Then the book stays readable, playable and exportable on the phone, and the sheet (cut) | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R2 | Given 3 unsent letters and Sign out with sync able to run, Then the session stays until they are (cut) | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R3 | Given a session ended elsewhere (revoked refresh token, Sign out other devices, epoch raised, Apple (cut) | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R5 | Given Delete account, Then step 1 says what leaves our servers, what stays on this phone (letters, (cut) | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R6 | Given the typed word and the request, Then request_account_deletion schedules deletion 30 days (cut) | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R7 | Given an outstanding Terms version, Then Delete account works without agreeing (NS-10-R4a) | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R8 | Given the deletion date passes, Then the account's server rows, books, letters, consent rows (cut) | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R9 | Given a pending deletion, When the account signs in on any phone, Then the scheduled screen shows (cut) | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R10 | Given Cancel within 30 days, Then letters and books return as they were | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R11 | Given a sealed letter at deletion, Then the server copy is deleted with the account (D6), and its (cut) | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R12 | Given pictures on the phone, When the account is deleted, Then the pictures stay on the phone and (cut) | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R13 | Given a build below minSupportedVersion, or a server answer upgrade_required, Then Me shows the (cut) | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R15 | Given Delete account offline, Then the line says nothing changed and that a connection is needed, (cut) | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R16 | Given servers off in the build, Then no Account, Sign out or Delete account row shows, and Erase (cut) | 19-from-download-to-first-letter.md | none | G17 |
| NS-45-R18 | Given VoiceOver and AX5 on SE 3, Then the sign-out sheet, both deletion steps, the scheduled screen (cut) | 19-from-download-to-first-letter.md | none | G17 |

### NS-46 (21 of 22 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-46-R2 | Given Days, Browse, or the ask slip is opened, Then no day is ticked; a day is scheduled only after (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R4 | Given the NS-32 registry after this card, Then it has no new class and the planner emits a (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R5 | Given a typed day delivered (NS-18-R7), Then it is deleted the day after as before, and no code (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R7 | Given two budgeted notes due on one date, Then the order is: a day the parent typed, birthday, (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R8 | Given two ticked days on one date (planner, store, landing and lock-screen tests use synthetic ids (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R14 | Given a moving day, Then the row carries an authority and a country or tradition and precision: (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R16 | Given Memorial Day, Veterans Day, Good Friday, Yom Kippur or a national day whose name refers to a (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R17 | Given every days.landing.*, days.lock.*, days.picker.*, days.nextYear.* and days.door.* (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R19 | Given a day the library does not hold, Then Add a day (NS-18) takes it in the parent's own words (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R22 | Given a day note, Then no title, body or landing says "last year", "again", "another" or shows (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R23 | Given a tradition's rows, Then a member of that tradition has reviewed them and the review is on (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R26 | Given VoiceOver, Voice Control, Switch Control and AX5 with Bold Text on an SE 3, Then every (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R27 | Given any day note, Then it names no Plus, price, allowance or Keep step (NS-13-R11) and the (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R30 | Given the planner builds candidates for every source (typedDay, birthday, libraryDay, (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R31 | Given reminders are off and notifications are allowed, Then libraryDay and typedDay still plan (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R32 | Given a library-day note is tapped, Then the handler routes to Home (not the Book), the payload (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R34 | Given a delivered or opened note of kind libraryDay or typedDay with analytics consent granted, (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R35 | Given the first tick, Then the line shown before it says a reminder arrives on that day and that (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R36 | Given publicTitleOk, Then it is a hand-listed allowlist in the data, true only for seasonal and (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R46 | Given the release that turns days on, When the listing and the support page are read, Then the (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-46-R48 | Given the library, Then it is one file identical for every phone and any refresh is a single (cut) | 21-days-cultural-photos-home.md | none | G18 |

### NS-47 (27 of 27 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-47-R1 | Given any value that states or implies a tradition, a country a family is from, or the list of (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R2 | Given the ask or the Browse sheet, When the parent picks a tradition or a country, Then it is held (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R3 | Given any answer, Then no column, key or label on a child, a book, a letter or a share says the (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R4 | Given the ask, a tick, a clear, the claim step and a re-plan, Then a network fake sees 0 requests (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R5 | Given a tap on a library-day note, Then Home shows an ordinary prompt from the existing catalogue; (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R6 | Given the store, Then it lives in a file or database in Application Support (not Caches) excluded (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R7 | Given the claim step (E-S24) or a new phone, Then a claimed book re-keys the store unchanged and (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R8 | Given the log canary with synthetic tradition and day keys (for example zz-test-tradition, never (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R9 | Given opt-in analytics (off through 1.0, D-124) or the k-anonymised insights, Then no event, (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R10 | Given a Save a copy file built with every key set, Then no file holds a key, day, tradition or (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R11 | Given the module boundary, Then only the days module reads the store; the planner gets opaque slots (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R12 | Given a library-day note of any layer with the day-name switch off (the default) or App lock on, (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R13 | Given the lock-screen title, Then a seasonal or civic day (publicTitleOk true) may be its own (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R15 | Given account A signs out (book kept, D1), Then the store and its scheduled notes are cleared at (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R16 | Given Erase everything, When it finishes, Then the store, the flag and every pending library-day (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R17 | Given Delete account, Then this phone clears the store at once and every other phone clears it when (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R18 | Given first run (E-S01 to E-S08), Then no field, card, picker or line about tradition, faith or (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R21 | Given Days, Then every ticked day can be unticked in one tap and "Clear all" (one confirm, an F6 (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R22 | Given the call-out at the point of choice, Then every sentence has a claims-inventory row true of (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R23 | Given a store candidate, Then privacy re-runs the label against the binary: "not collected" holds (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R24 | Given two parents on one book (NS-25), Then each phone holds its own store and nothing on the (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R25 | Given the ask slip, C-S25 and C-S24 at AX5 with Bold Text, VoiceOver, Voice Control and Switch (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R26 | Given the Days page, Browse, Day detail, the day slip and the ask slip, When the app goes inactive, (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R29 | Given the ask slip, C-S25 and C-S24, Then the call-out is a static DoorNote (new shared (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R34 | Given packages/analytics/test/, Then FORBIDDEN_KEY and a new enum-value and event-name test (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R36 | Given every notification category, Then none sets hiddenPreviewsShowTitle (a test reads the (cut) | 21-days-cultural-photos-home.md | none | G19 |
| NS-47-R38 | Given every lock-screen title and body in any switch state, Then none holds both a day name of a (cut) | 21-days-cultural-photos-home.md | none | G19 |

### NS-48 (13 of 13 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-48-R1 | Given any planned evening or day note, When the planner asks for its words, Then a pure function in (cut) | 21-days-cultural-photos-home.md | none | G20 |
| NS-48-R2 | Given the catalogue on or off and the same plan inputs across cadences, books and time zones, Then (cut) | 21-days-cultural-photos-home.md | none | G20 |
| NS-48-R3 | Given a plan for any future date, Then every input is computable at plan time: recency is the fire (cut) | 21-days-cultural-photos-home.md | none | G20 |
| NS-48-R4 | Given recency r1 to r4, Then the copy is a question or an invitation that is shorter and more open (cut) | 21-days-cultural-photos-home.md | none | G20 |
| NS-48-R5 | Given a last letter within 6 days, Then the question follows from its kind, only spoke and (cut) | 21-days-cultural-photos-home.md | none | G20 |
| NS-48-R9 | Given a family, tradition, culture-led or national day, or names off, Then the lock-screen title (cut) | 21-days-cultural-photos-home.md | none | G20 |
| NS-48-R10 | Given any variant in either rendering, Then the title is at most 40 characters and the body at most (cut) | 21-days-cultural-photos-home.md | none | G20 |
| NS-48-R11 | Given names off (the default) or App lock on, Then no title or body contains a child name; a new (cut) | 21-days-cultural-photos-home.md | none | G20 |
| NS-48-R21 | Given a quieted or hidden book, or one with "Include in my reminders" off, Then it contributes no (cut) | 21-days-cultural-photos-home.md | none | G20 |
| NS-48-R26 | Given the planner, When NS-46 and NS-48 add sources and keys, Then the one-a-day rule lives only in (cut) | 21-days-cultural-photos-home.md | none | G20 |
| NS-48-R28 | Given every key in days.lock.*, days.landing.*, ntc.* and notifications.dayNames.*, When (cut) | 21-days-cultural-photos-home.md | none | G20 |
| NS-48-R30 | Given any ntc.kind.* or age-band line, Then it asks about the child without stating or implying (cut) | 21-days-cultural-photos-home.md | none | G20 |
| NS-48-R36 | Given a book with a due date and no birth date, Then every title and body in either rendering names (cut) | 21-days-cultural-photos-home.md | none | G20 |

### NS-49 (21 of 21 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-49-R3 | Given a letter that began from a picture, When Home next shows a reminder note or a slip, Then (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R6 | Given the parent taps the suggestions start, Then the system picker opens in Apple's process, the (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R7 | Given a picked suggestion with at least one photo or Live Photo, Then the first still is copied (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R9 | Given a suggestion with a title or date range, Then they show only as "From your phone: (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R10 | Given a suggestion that holds a location, workout, contact, song, podcast, media, steps, state of (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R11 | Given the parent cancels or dismisses the picker, declines Apple's first-use sheet, has Journaling (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R12 | Given App lock is up or the app goes inactive during the picker, Then the picker cannot be started (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R13 | Given a letter kept from the suggestions path, Then it holds one stored copy and no suggestion (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R15 | Given the entitlement com.apple.developer.journal.allow, Then it is added in the Expo config's (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R16 | Given level 2 ships, Then the where-it-lives lines and the privacy policy say in plain words that (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R17 | Given AX5 and VoiceOver, Voice Control and Switch Control, Then the suggestions choice and the (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R19 | Given the Apple file URL, Then the app accepts it only if it is a regular file readable in the (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R21 | Given the suggestion id on the notification path, Then the handler never logs or stores it and (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R23 | Given a child's picture or a picture showing another adult arrives through level 2, Then nothing (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R24 | Given a canary suggestion title, place name and workout name through the module, Then 0 hits in (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R25 | Given any production, preview or testflight build in the 1.x line, Then there is no photo-library (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R26 | Given a level 3 spike is asked for, Then it runs only on exp/photos-library-nudge, on a (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R27 | Given the privacy label, Then its effect for level 2 is "no change while only the chosen picture (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R28 | Given a binary built with the module and the entitlement, When it launches and runs the core loop (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R33 | Given the whole suggestion flow (open, pick, cancel, keep, erase), Then a network fake sees 0 (cut) | 21-days-cultural-photos-home.md | none | G21 |
| NS-49-R35 | Given level 2, Then DPLA 3.3.3(H) (the API only "for journaling purposes", the use "clearly evident (cut) | 21-days-cultural-photos-home.md | none | G21 |

### NS-50 (4 of 4 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| NS-50-R2 | Given a ticked day whose date is today, Then Home shows its name and one line; Given any other (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-50-R3 | Given the slip, Then its words are the NS-46 landing words (days.landing.*) and a quiet day (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-50-R8 | Given a quieted or hidden active book, or "Include in my reminders" off, Then no day slip shows for (cut) | 21-days-cultural-photos-home.md | none | G18 |
| NS-50-R11 | Given Home on any day, Then at most one slip rank shows at a time (rank 1, the waiting set, keeps (cut) | 21-days-cultural-photos-home.md | none | G18 |

### FR-AIS (37 of 43 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-AIS-01 | Given the repo, When CI runs, Then a test fails if the EditType union in (cut) | functions/ai-and-speech.md | none | G22 |
| FR-AIS-02 | Given any machine edit in the product (rule, model, dictionary, script, punctuation), When it is (cut) | functions/ai-and-speech.md | none | G22 |
| FR-AIS-03 | Given a model-proposed edit set, When the share of raw words changed by applied model edits exceeds (cut) | functions/ai-and-speech.md | none | G22 |
| FR-AIS-06 | Given a restore of an earlier version, a new phone, or a re-download, When words come back, Then no (cut) | functions/ai-and-speech.md | none | G22 |
| FR-AIS-07 | Given words the parent typed (A-S06, Change words, the words sheet B-S08, typed-day words, a Firsts (cut) | functions/ai-and-speech.md | none | G22 |
| FR-AIS-08 | Given the other parent's account, When they read the book, Then raw_transcript, stt_meta, (cut) | functions/ai-and-speech.md | none | G22 |
| FR-AIS-09 | Given any model file the app can download (speech, VAD, or a future edit model), When it is added (cut) | functions/ai-and-speech.md | none | G23 |
| FR-AIS-10 | Given the five catalog models, Then the licence record states these facts as of 20 Nov: (cut) | functions/ai-and-speech.md | none | G23 |
| FR-AIS-13 | Given a model file downloaded or already on the phone, Then it is trusted only after its SHA-256 (cut) | functions/ai-and-speech.md | none | G23 |
| FR-AIS-15 | Given a model change (new file, new revision, new quantisation, new tier mapping), When the PR is (cut) | functions/ai-and-speech.md | none | G23 |
| FR-AIS-16 | Given a family that never downloads a model, or whose download failed, When they record, Then the (cut) | functions/ai-and-speech.md | none | G23 |
| FR-AIS-17 | Given v1.0, Then all transcription runs on the phone and no audio, transcript chunk or prompt is (cut) | functions/ai-and-speech.md | none | G23 |
| FR-AIS-19 | Given the future edit-pass model (ADR 0003: hosted Qwen3.5-9B on DeepInfra when on; on-device (cut) | functions/ai-and-speech.md | none | G23 |
| FR-AIS-21 | Given the report, Then its words state the honest limits every time: the recordings come from about (cut) | functions/ai-and-speech.md | none | G24 |
| FR-AIS-23 | Given a native speaker for each non-English language, Then before the language's gate can pass: (a) (cut) | functions/ai-and-speech.md | none | G24 |
| FR-AIS-25 | Given a whispered take (the commonest 2 AM voice), When the voice detector drops all or part of it, (cut) | functions/ai-and-speech.md | none | G24 |
| FR-AIS-26 | Given a child's voice in the take (a baby babbling, a toddler saying "Mama", Asha answering), Then (cut) | functions/ai-and-speech.md | none | G24 |
| FR-AIS-27 | Given two adults speaking in one take (the other parent chimes in), Then the words appear in the (cut) | functions/ai-and-speech.md | none | G24 |
| FR-AIS-29 | Given silence, noise only, a whisper the detector drops, or a chunk the recogniser cannot hear, (cut) | functions/ai-and-speech.md | none | G24 |
| FR-AIS-33 | Given a language the pack's table is not vetted for, Then the engine runs in punctuation-safe mode: (cut) | functions/ai-and-speech.md | none | G24 |
| FR-AIS-34 | Given a name the family taught the app (DictionaryTerm), Then it is spelled that way when the (cut) | functions/ai-and-speech.md | none | G24 |
| FR-AIS-35 | Given the engine's golden and regression corpora, Then every item is fictional (the Asha family, (cut) | functions/ai-and-speech.md | none | G22 |
| FR-AIS-36 | Given the evaluation kit, Then audio, recordings, model files, transcripts and per-clip results (cut) | functions/ai-and-speech.md | none | G25 |
| FR-AIS-37 | Given the audio test sets, Then they are made only by (a) adult volunteers with written consent (cut) | functions/ai-and-speech.md | none | G25 |
| FR-AIS-39 | Given a change to a model file, pack, prompt rendering, voice detector settings, chunk planner, (cut) | functions/ai-and-speech.md | none | G22 |
| FR-AIS-40 | Given any change to packages/core/src, Then the PR contains the engine drift report (cut) | functions/ai-and-speech.md | none | G22 |
| FR-AIS-43 | Given a phone under 4 GB or one with two memory kills, Then it uses the compact tier (small q5_1) (cut) | functions/ai-and-speech.md | none | G23 |
| FR-AIS-45 | Given a speech model that turns a voice into words, Then no feature stores, compares, matches or (cut) | functions/ai-and-speech.md | none | G22 |
| FR-AIS-46 | Given the EU AI Act, Then counsel is asked, as a new numbered question, whether it reaches Early (cut) | functions/ai-and-speech.md | none | G25 |
| FR-AIS-47 | Given any feature that sends words or a voice to a model hosted by someone else, Then the App (cut) | functions/ai-and-speech.md | none | G25 |
| FR-AIS-48 | Given public copy (App Store page, website, in-app words, support articles), Then it says what the (cut) | functions/ai-and-speech.md | none | G25 |
| FR-AIS-49 | Given a transcript, a model reply, a dictionary term, a letter's words or a recording's name, When (cut) | functions/ai-and-speech.md | none | G25 |
| FR-AIS-50 | Given a harness agent (including this role) that reads an issue, a PR comment, a web page, a model (cut) | functions/ai-and-speech.md | none | G25 |
| FR-AIS-51 | Given the harness agents' permissions, Then no agent can: commit audio or model files; change (cut) | functions/ai-and-speech.md | none | G25 |
| FR-AIS-53 | Given any request (from a user, a tester, a competitor review, a stakeholder, an agent or the (cut) | functions/ai-and-speech.md | none | G25 |
| FR-AIS-54 | Given the card text, the packages/content keys and the code, Then a scan fails on the (cut) | functions/ai-and-speech.md | none | G22 |
| FR-AIS-56 | Given a screen that shows a machine-made result (the small fixes in Review), Then it shows only (cut) | functions/ai-and-speech.md | none | G22 |

### FR-BKO (7 of 11 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-BKO-01 | One access page. Given the repo, Then docs/ops/ACCESS.md holds the matrix of section 4 (data (cut) | functions/back-office.md | none | G26 |
| FR-BKO-09 | The weekly clock. Given every open data request has a due date (received plus 45 days, with the (cut) | functions/back-office.md | none | G26 |
| FR-BKO-13 | Triage in the same day, with no content. Given a report arrives, When the founder reads it, Then (cut) | functions/back-office.md | none | G26 |
| FR-BKO-14 | The co-parent safety card. Given NS-25 is in a store build and one parent writes that the other is (cut) | functions/back-office.md | none | G26 |
| FR-BKO-16 | Letters from lawyers, courts and the police. Given one arrives, Then the card copies (cut) | functions/back-office.md | none | G26 |
| FR-BKO-18 | The founder cannot act. Given a founder who is ill, away or lost a device, Then there is a written (cut) | functions/back-office.md | none | G26 |
| FR-BKO-21 | Agents hold no production power. Given the harness opens pull requests and never merges, Then the (cut) | functions/back-office.md | none | G26 |

### FR-CMP (15 of 16 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-CMP-01 | Given the locked pack, Then compliance-register.md gains a section "Obligations by card" with the (cut) | functions/compliance.md | none | G10 |
| FR-CMP-03 | Given a store candidate, When the Notes for Review are prepared, Then a check compares the flags on (cut) | functions/compliance.md | none | G10 |
| FR-CMP-04 | Given EXPO_PUBLIC_PHOTOS on in any build, Then app-store-privacy-labels.md is versioned with: (cut) | functions/compliance.md | none | G10 |
| FR-CMP-05 | Given a store candidate, When G5 runs, Then the App Store Connect answers equal the label file's (cut) | functions/compliance.md | none | G10 |
| FR-CMP-06 | Given the Accessibility Nutrition Labels in App Store Connect, Then a feature (VoiceOver, Voice (cut) | functions/compliance.md | none | G10 |
| FR-CMP-07 | Given LEGAL-REQ-051 (WCAG 2.2 AA), When the accessibility walk runs for a store candidate, Then it (cut) | functions/compliance.md | none | G10 |
| FR-CMP-11 | Given a store candidate, Then one gate record (cut) | functions/compliance.md | none | G10 |
| FR-CMP-12 | Given a card names a counsel read as gating its production flag (NS-01 label line Q43; NS-05 (cut) | functions/compliance.md | none | G10 |
| FR-CMP-13 | Given any path that creates an account, including an invite opened on a phone with no install (cut) | functions/compliance.md | none | G10 |
| FR-CMP-15 | Given an install where the platform offers the age-range signal, When the app launches, Then it (cut) | functions/compliance.md | none | G10 |
| FR-CMP-16 | Given the store build syncs letters after the sensitive-data consent, Then a withdrawal control (cut) | functions/compliance.md | none | G10 |
| FR-CMP-17 | Given a store build that lets a person create an account, Then Delete account is visible in Me (the (cut) | functions/compliance.md | none | G10 |
| FR-CMP-18 | Given the store build requires sign-in (D-160), Then the Notes for Review state the account-based (cut) | functions/compliance.md | none | G10 |
| FR-CMP-19 | Given NS-05 or NS-25 is on in a candidate, Then the App Store Connect age-rating questionnaire is (cut) | functions/compliance.md | none | G10 |
| FR-CMP-20 | Given a store candidate, Then every public line in packages/content/src/store.en.ts, the site and (cut) | functions/compliance.md | none | G10 |

### FR-CUL (15 of 16 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-CUL-01 | Given any value that states or implies a religion, a tradition, a country or region a family is (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-02 | Given the ask card or Me, Days we mark, When a parent picks a tradition or a country, Then it is a (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-03 | Given any answer, Then no value is attached to the child: no column, key or label on children, (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-04 | Given the store, Then it is never synced, uploaded or sent: no migration adds a column, table or (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-05 | Given a notification from a library day, When the parent taps it, Then Home opens a generic prompt (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-06 | Given the store, Then it lives in a file or database excluded from the iPhone backup (as (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-07 | Given the claim step on the "Start on this phone" path (E-S24) or the new-phone path, When a book (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-08 | Given the log canary (FR-PRV-10), When it runs with synthetic tradition and day keys in every new (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-09 | Given opt-in analytics (a later decision, off through 1.0, D-124) or the k-anonymised insights, (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-11 | Given the module boundary, Then only the days module reads the store; the planner receives opaque (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-12 | Given a library-day note of any layer (seasonal, family, civic, tradition, national), Then by (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-16 | Given Erase everything (C-S19), When it finishes, Then the store, its flag and every pending (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-21 | Given any day offered, Then the parent ticks it; nothing is pre-ticked; a day the parent ticks can (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-22 | Given the call-out at the point of choice, Then every sentence in it has a row in the claims (cut) | functions/cultural-background-data.md | none | G19 |
| FR-CUL-23 | Given a store candidate, Then privacy re-runs the label against the binary (FR-PRV-30): the label (cut) | functions/cultural-background-data.md | none | G19 |

### FR-DAT (9 of 11 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-DAT-02 | Given any screen in any 1.0.x build, Then no control, sheet or notification asks a parent a (cut) | functions/data-and-measurement.md | none | G29 |
| FR-DAT-03 | Given any parent-facing screen, notification, widget or store page, Then it shows no count made for (cut) | functions/data-and-measurement.md | none | G29 |
| FR-DAT-05 | Given a tester round ends, When 90 days pass, Then the founder deletes its raw answers and the repo (cut) | functions/data-and-measurement.md | none | G29 |
| FR-DAT-09 | Zero-target guardrails trip on one report. Given any one report from T, ST, AR or M of: a lost (cut) | functions/data-and-measurement.md | none | G29 |
| FR-DAT-14 | Given a tester sends audio_missing or audio_mismatch above 0, When the same tester answers "no" (cut) | functions/data-and-measurement.md | none | G29 |
| FR-DAT-20 | Pricing experiment limits in the 1.0 line: no randomised price or allowance arms (no join from arm (cut) | functions/data-and-measurement.md | none | G29 |
| FR-DAT-27 | Never an event, in any version, for this pack: anything at a seal's opening time; typed-day (cut) | functions/data-and-measurement.md | none | G29 |
| FR-DAT-32 | Targets with no 1.0 source are marked "not measurable in 1.0" wherever they appear (frame, (cut) | functions/data-and-measurement.md | none | G29 |
| FR-DAT-35 | Server-side counts named by cards (NS-40 refusals by country code, NS-41 sign-in success per (cut) | functions/data-and-measurement.md | none | G29 |

### FR-DAY (7 of 12 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-DAY-02 | Nothing is ticked for a parent. Given a parent opens Days, Browse or the ask card, When the list (cut) | functions/days-library.md | none | G18 |
| FR-DAY-04 | A ticked day is stored as an id with optional overrides, per account and per book, never as a date (cut) | functions/days-library.md | none | G18 |
| FR-DAY-06 | Moving days: each lunar or lunisolar row carries an authority and a country or tradition, and (cut) | functions/days-library.md | none | G18 |
| FR-DAY-15 | The parent can always add any date. Given a day that is not in the library, When the parent wants (cut) | functions/days-library.md | none | G18 |
| FR-DAY-20 | No analytics. Given any build, Then no analytics event, log line or crash report carries a day id, (cut) | functions/days-library.md | none | G18 |
| FR-DAY-23 | Licence and counsel. Before any source table ships, counsel confirms the right to use each source's (cut) | functions/days-library.md | none | G18 |
| FR-DAY-25 | A note on a day is never a count or comparison with a previous year; the library never says "last (cut) | functions/days-library.md | none | G18 |

### FR-FIN (5 of 6 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-FIN-03 | Given production on Supabase Free (D-159), When the weekly limits job runs, Then it reads database (cut) | functions/finance.md | none | G26 |
| FR-FIN-05 | Given the backup flip question (NS-08), When the sizing note goes to the founder, Then it prices (cut) | functions/finance.md | none | G26 |
| FR-FIN-09 | Given any string the app shows or schedules (Keep gate, Plan, Plus confirmed, plan reminder note, (cut) | functions/finance.md | none | G26 |
| FR-FIN-11 | Given Plus refunded or revoked by Apple, When the app next checks entitlements, Then it treats the (cut) | functions/finance.md | none | G26 |
| FR-FIN-22 | Given the first Apple payout, When it is expected, Then the accountant brief (section 7, A1 to A9) (cut) | functions/finance.md | none | G26 |

### FR-LCY (18 of 18 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-LCY-01 | Given a database file at each shipped user_version (0 to the latest), filled by a fixture with (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-02 | Given any local migration, Then it is additive: no drop or rename of a table or column that holds a (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-03 | Given a database whose user_version is higher than the build knows (a TestFlight rollback, a (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-04 | Given unsent outbox rows written by any shipped build, When a newer build starts, Then every row is (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-06 | Given alpha builds and the store build are different apps, Then a recorded decision says, for each (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-07 | Given staging holds real family letters (ENVIRONMENTS.md:8) and is to be retired, When it is (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-09 | Given a phone restored from an iCloud device backup (database, recordings, pictures present; (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-10 | Given a restore or a new phone signs in with a different account from the one that owns the letters (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-11 | Given an account was deleted (on this phone or another) and this phone still holds the book, When (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-12 | Given no server can be reached (a build with servers off, an outage, a paused project, a closed (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-13 | Given one parent with two phones on one account, Then: words arrive on both, recordings stay on the (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-14 | Given a parent asks "how do my recordings get to my new phone", Then the help article and macro (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-17 | Given minSupportedVersion above the installed build, or a 426 and SCVER answer, Then Me shows (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-19 | Given phone A deletes the account while phone B is signed in with a synced book and unsent letters, (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-20 | Given a Save a copy file and a computer with no app, no account and no network, When a person who (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-21 | Given a book that grows for years, Then a copy never fails for size: above 2 GB the export splits (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-28 | Given every lifecycle surface above, Then its words pass the legacy rule (time and love, never (cut) | functions/lifecycle-and-platforms.md | none | G27 |
| FR-LCY-34 | Given the test plan, Then these journeys exist and run on every release candidate: J-L1 upgrade (cut) | functions/lifecycle-and-platforms.md | none | G27 |

### FR-LEG (11 of 15 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-LEG-02 | Given any build, When the deletion texts are read (in-app delete sheet C-S20, (cut) | functions/legal.md | none | G31 |
| FR-LEG-04 | Given the store build requires sign-in (D-160), When the Terms and Privacy Policy that build links (cut) | functions/legal.md | none | G31 |
| FR-LEG-06 | Given NS-06 Part B on in a build, When the Terms and Privacy Policy that build links are read, Then (cut) | functions/legal.md | none | G31 |
| FR-LEG-07 | Given the seal date sheet (B-S13), Then it offers no age-keyed choice ("at 18", "on their 18th (cut) | functions/legal.md | none | G31 |
| FR-LEG-08 | Given any card whose flag adds a field that reaches our servers or a notification, When its flag (cut) | functions/legal.md | none | G31 |
| FR-LEG-10 | Given the inviter on the invite sheet (D-S13) and the invitee on the accept sheet (D-S16), Before (cut) | functions/legal.md | none | G31 |
| FR-LEG-11 | Given the NS-03 pilot, Then each consent text (W and V) has a document key (proposed (cut) | functions/legal.md | none | G31 |
| FR-LEG-12 | Given the printable PDF (NS-07 C28), When the PDF builder embeds a font, Then the face is on an (cut) | functions/legal.md | none | G31 |
| FR-LEG-13 | Given a speech pack for a second language (NS-17) or any font, model or image added to the app, (cut) | functions/legal.md | none | G31 |
| FR-LEG-15 | Given NS-16 on in a build, Then the Terms say: if you sign a letter as someone else, do it only (cut) | functions/legal.md | none | G31 |
| FR-LEG-20 | Given any build that records an agreement (E-S03 local row, E-S07 server row), Then the version it (cut) | functions/legal.md | none | G31 |

### FR-LOC (17 of 20 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-LOC-01 | Given any store build, When a language appears in a picker, a listing, a keyword, a page or a help (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-02 | Given the first store build, Then it hears English only, and no parent-facing line promises another (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-03 | Given a language is proposed, When the gate runs, Then it runs on the shipped model, pack and (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-04 | Given the bars, Then they are fixed per language as built: English, Spanish, French, Portuguese (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-05 | Given a non-English pack, When it is proposed for a store build, Then a native speaker who is also (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-08 | Given the 1.0 and every early multi-language build, Then each letter has one language, the author's (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-10 | Given any build through 1.0.x, Then the interface is English and the spoken language is a separate (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-13 | Given a book whose letters are in a language other than English, When it is read, exported or (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-19 | Given any parent-facing text in a language other than English (store, site, help, prompts, later (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-20 | Given the 115 English prompts (PROMPT_LIBRARY_VERSION 4), When a language unlocks, Then its (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-21 | Given the machine edits for a language, Then the pack's house style (dashes: replace, quotes: (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-22 | Given store metadata, Then en-US only ships at 1.0. A later locale (first es-MX, fr-FR, pt-BR (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-23 | Given the six draft translations in localisation.md, Then they stay unused drafts, are rewritten (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-24 | Given Terms, Privacy Policy, Subscription Terms, consents and registered disclosures (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-26 | Given any language that is proposed for a store build, Then a dossier file exists, one per (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-28 | Given a language is paused or removed (manifest pause, a defect, the correction-rate guardrail, or (cut) | functions/languages-and-localisation.md | none | G05 |
| FR-LOC-29 | Given language is sensitive data (it can stand for ethnicity), Then no language code, language (cut) | functions/languages-and-localisation.md | none | G05 |

### FR-MKT (19 of 20 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-MKT-01 | Given a card's enabled claim (NS-01 s19, NS-02 s19, NS-05 s18, NS-06 A18, B18, C18, NS-07 3.18 and (cut) | functions/marketing.md | none | G32 |
| FR-MKT-02 | Given the union of every card's Forbids list (appendix A), When a test reads the public surfaces (cut) | functions/marketing.md | none | G32 |
| FR-MKT-03 | Given Read together in any public copy, Then it may be called free only in the words the current (cut) | functions/marketing.md | none | G32 |
| FR-MKT-05 | Given the website draws the app (apps/web/src/content/site.ts scenes s02 to s07), Then the drawn (cut) | functions/marketing.md | none | G32 |
| FR-MKT-06 | Given the waitlist welcome email (site.ts welcomeEmail), When Build 12 requires sign-in and (cut) | functions/marketing.md | none | G32 |
| FR-MKT-07 | Given a privacy promise on any public surface, Then it is en.trust.promise word for word (D-061) (cut) | functions/marketing.md | none | G32 |
| FR-MKT-08 | Given the store listing submitted with Build 12 (sign-in required, D-160), Then every description (cut) | functions/marketing.md | none | G32 |
| FR-MKT-09 | Given a release that turns a card's production flag on, When What's New is written, Then it names (cut) | functions/marketing.md | none | G32 |
| FR-MKT-11 | Given the keyword field (100 characters), Then it holds only words true of the submitted build: no (cut) | functions/marketing.md | none | G32 |
| FR-MKT-12 | Given any store screenshot, preview or website image of the app, Then it is captured from the build (cut) | functions/marketing.md | none | G32 |
| FR-MKT-15 | Given the app preview video, Then it is re-captured on device from the submitted build after D-161 (cut) | functions/marketing.md | none | G32 |
| FR-MKT-16 | Given a card's Label effect line changes the App Privacy answers, Then in the same release the (cut) | functions/marketing.md | none | G32 |
| FR-MKT-19 | Given Share one letter, Then the shared text carries no brand, link or "sent from" line (cut) | functions/marketing.md | none | G32 |
| FR-MKT-20 | Given the notification registry (NS-32 lib/reminders/budget.ts), Then no class exists for (cut) | functions/marketing.md | none | G32 |
| FR-MKT-22 | Given the Keep gate (E-S10) and the Home Plus line (E-S26), Then neither shows a testimonial, (cut) | functions/marketing.md | none | G32 |
| FR-MKT-28 | Given a spoken language, Then every public surface names it only once it ships in the submitted (cut) | functions/marketing.md | none | G32 |
| FR-MKT-29 | Given recording backup is off, Then NS-08-R7's check also reads the welcome email, /support and the (cut) | functions/marketing.md | none | G32 |
| FR-MKT-32 | Given any marketing material (store, preview, screenshots, emails, posts, recruitment), Then the (cut) | functions/marketing.md | none | G32 |
| FR-MKT-34 | Given launch measurement with analytics off (D-124), Then the website, emails and store links carry (cut) | functions/marketing.md | none | G32 |

### FR-MSG (9 of 23 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-MSG-11 | Given a launch announcement, a press mention, or a public TestFlight link, When it is scheduled, (cut) | functions/messaging-and-entry-points.md | none | G35 |
| FR-MSG-12 | Given the footer promise "A person reads every one", Then it is a row in the claims inventory with (cut) | functions/messaging-and-entry-points.md | none | G35 |
| FR-MSG-14 | Given the question of invite email, Then no email is sent to an address a parent types for someone (cut) | functions/messaging-and-entry-points.md | none | G35 |
| FR-MSG-15 | Given a sign-in-capable build, When earlyletters.com is down, Resend is down, or the cap is hit, (cut) | functions/messaging-and-entry-points.md | none | G35 |
| FR-MSG-18 | Given any notification the product shows, local or later remote, Then it never carries a child (cut) | functions/messaging-and-entry-points.md | none | G35 |
| FR-MSG-19 | Given a fresh install, When the person finishes first run, Then no notification permission has been (cut) | functions/messaging-and-entry-points.md | none | G35 |
| FR-MSG-22 | Given any push or email that could count as promotion or direct marketing, Then none is sent in v1; (cut) | functions/messaging-and-entry-points.md | none | G35 |
| FR-MSG-24 | Given each way a link can arrive, Then one table states what the person sees, and a device run (cut) | functions/messaging-and-entry-points.md | none | G35 |
| FR-MSG-28 | Given the invite page, Then it never states or implies whether the invite is valid or expired (the (cut) | functions/messaging-and-entry-points.md | none | G35 |

### FR-NTC (9 of 9 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-NTC-01 | Given any planned evening or day notification, When the planner asks for its words, Then a pure (cut) | functions/notification-catalogue.md | none | G20 |
| FR-NTC-02 | Given the catalogue is on or off, When a plan is built from the same inputs, Then the set of (id, (cut) | functions/notification-catalogue.md | none | G20 |
| FR-NTC-03 | Given a plan for any future date, Then every input is computable at plan time: recency is fireDate (cut) | functions/notification-catalogue.md | none | G20 |
| FR-NTC-04 | Given recency r1 to r4, Then copy is a question or an invitation that gets shorter and more open as (cut) | functions/notification-catalogue.md | none | G20 |
| FR-NTC-05 | Given the last letter's kind (spoke, typed, picture, first, small), When it is within 6 days, Then (cut) | functions/notification-catalogue.md | none | G20 |
| FR-NTC-08 | Given a parent-chosen day or ticked season, Then it takes the one budgeted slot as a typedDay, (cut) | functions/notification-catalogue.md | none | G20 |
| FR-NTC-09 | Given a family or faith day, or names off, Then the lock-screen title is neutral ("Something for (cut) | functions/notification-catalogue.md | none | G20 |
| FR-NTC-10 | Given any variant, Then title is at most 40 characters and body at most 110, and no emoji, dash, (cut) | functions/notification-catalogue.md | none | G20 |
| FR-NTC-11 | Given names off (the default) or App lock on, Then no title or body contains a child name; names (cut) | functions/notification-catalogue.md | none | G20 |

### FR-OPP (4 of 4 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-OPP-03 | Given a suggestion or picture is chosen, Then only the chosen item reaches the app, anything beyond (cut) | functions/feature-opportunities.md | none | G21 |
| FR-OPP-05 | Given a doorway is added after the spike (OPP-02), When the control is used on a locked phone, Then (cut) | functions/feature-opportunities.md | none | G21 |
| FR-OPP-06 | Given a doorway control exists, When the NS-04 exit has not passed on that phone and iOS version, (cut) | functions/feature-opportunities.md | none | G21 |
| FR-OPP-09 | Given any opportunity touches a child's voice or another adult's voice, Then counsel reads before (cut) | functions/feature-opportunities.md | none | G21 |

### FR-OPS (12 of 15 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-OPS-06 | Route 1 (delete an account by email) opens before server-held additions ship. Given any card that (cut) | functions/operations.md | none | G26 |
| FR-OPS-08 | No seal is revealed by a restore. Given a server restored to a point before an author sealed a (cut) | functions/operations.md | none | G26 |
| FR-OPS-09 | Sanctions: suspend one account without deleting it. Given a possible match, When the founder blocks (cut) | functions/operations.md | none | G26 |
| FR-OPS-10 | Sign-in email has room. Given a servers-on store build, When it is submitted, Then its release (cut) | functions/operations.md | none | G26 |
| FR-OPS-11 | The three D-159 jobs are proven running. Given production on Free, When any build reaches people (cut) | functions/operations.md | none | G26 |
| FR-OPS-14 | A restricted project looks like an outage, never like a loss. Given Supabase answers 402, 5xx or a (cut) | functions/operations.md | none | G26 |
| FR-OPS-16 | Backup on and off runbooks exist before the flip. Given a flip, Then "turn on" (migration first, (cut) | functions/operations.md | none | G26 |
| FR-OPS-17 | Every signal is content-free. Given any alert, log line, ops issue, script output or release (cut) | functions/operations.md | none | G26 |
| FR-OPS-24 | Server migrations go out first. Given a card with a server migration (NS-06 A and B, NS-17 E7, (cut) | functions/operations.md | none | G26 |
| FR-OPS-28 | 40 MB per candidate. Given an RC, Then the App Store Connect download size of the largest variant (cut) | functions/operations.md | none | G26 |
| FR-OPS-31 | Device evidence on Asha only. Given any device row, Then it runs on a separate install signed in to (cut) | functions/operations.md | none | G26 |
| FR-OPS-33 | First run survives a server outage. Given sign-in is unreachable (a paused or restricted project, a (cut) | functions/operations.md | none | G26 |

### FR-PHS (23 of 23 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-PHS-04 | Given the parent finishes a letter that began from a picture, When Home next shows its reminder (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-11 | Given the parent taps the suggestions start, Then the system picker opens in Apple's process, the (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-12 | Given the parent picks a suggestion that holds at least one photo or Live Photo, Then the first (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-14 | Given a picked suggestion has a title or a date range, Then they show only as a label above the (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-15 | Given a picked suggestion that holds a location, workout, contact, song, podcast, media, steps, (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-17 | Given the parent cancels the picker, dismisses it, or the first-use Apple consent sheet is (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-19 | Given App lock is up or the app goes inactive during the picker, Then a result that returns while (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-20 | Given the suggestions path ends in a kept letter, Then the letter holds one stored copy and no (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-22 | Given the entitlement com.apple.developer.journal.allow is added, Then it is added in the Expo (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-23 | Given level 2 ships, Then the where-it-lives lines and the privacy policy say, in plain words, that (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-33 | Given the Apple notification tap lands in the app, Then the universal link handler never logs the (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-40 | Given any production, preview or testflight build in the 1.x line, Then there is no photo-library (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-41 | Given the founder asks for a level 3 spike, Then it runs only on a branch (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-43 | Given any future nudge derived from the library, Then it carries only facts the parent can verify (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-44 | Given a parent whose library access is limited or denied, Then no screen of ours shows a prompt (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-50 | Given the data inventory, Then it adds three transient rows and no persistent one for level 2: (1) (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-51 | Given the log canary (J-N18 pattern), Then a canary suggestion title, a canary place name and a (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-52 | Given a stored picture, Then it is not marked as "from the phone's suggestion" in any table, file (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-53 | Given the Apple suggestion file URL, Then the app accepts it only if it is a regular file readable (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-54 | Given the privacy label, Then the label effect is stated for level 2 as "no change while only the (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-55 | Given App Review, Then the review notes name the entitlement, say the picker is Apple's own and (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-56 | Given the Apple Developer Program License Agreement section that A2 points to for suggestion data, (cut) | functions/photos-and-suggestions.md | none | G21 |
| FR-PHS-57 | Given a child's picture and a picture showing another adult arrive through level 2, Then nothing (cut) | functions/photos-and-suggestions.md | none | G21 |

### FR-POL (8 of 8 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-POL-02 | Given a report of apparent child sexual abuse material (Terms 9: "We report apparent child sexual (cut) | functions/support.md | none | G33 |
| FR-POL-03 | Given share and family surfaces, Then trust and safety controls scale with what we host: Level 1 (cut) | functions/support.md | none | G33 |
| FR-POL-04 | Given NS-25 in a store build, When a parent writes that the other parent is a risk, or asks for (cut) | functions/support.md | none | G33 |
| FR-POL-05 | Given a custody or family dispute, When either parent writes, Then M14 says, in the same words to (cut) | functions/support.md | none | G33 |
| FR-POL-06 | Given a letter from a lawyer, a court or the police, When it arrives, Then there is no reply, no (cut) | functions/support.md | none | G33 |
| FR-POL-07 | Given a report that an account holder or a family contributor is under 18, Then support uses the (cut) | functions/support.md | none | G33 |
| FR-POL-12 | Given any Claude session, the support agent included, Then it never reads the mailbox, never (cut) | functions/support.md | none | G33 |
| FR-POL-13 | Given a parent reports that someone else can see their letters, or that data reached someone it (cut) | functions/support.md | none | G33 |

### FR-PRT (3 of 4 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-PRT-02 | Given the free printable file in 1.0 (NS-07 C28), When a parent reads the line above its button, (cut) | functions/print-and-fulfilment.md | none | G31 |
| FR-PRT-39 | Given any printed page, When it is designed, Then it has no QR code, no link, no printed URL and no (cut) | functions/print-and-fulfilment.md | none | G31 |
| FR-PRT-45 | Given a printed page contains a real family's words, When a proof, test or support check is run, (cut) | functions/print-and-fulfilment.md | none | G31 |

### FR-PRV (15 of 22 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-PRV-10 | Given the Asha fixtures with canary strings in every new field (Find query, photo words, place, (cut) | functions/privacy.md | none | G30 |
| FR-PRV-11 | Given any throw, new Error(...), rejected promise or error code in apps/mobile and (cut) | functions/privacy.md | none | G30 |
| FR-PRV-13 | Given the route table, deep links and universal links, Then no route parameter or query holds L3 or (cut) | functions/privacy.md | none | G30 |
| FR-PRV-15 | Given no one is signed in on a phone that holds books (never signed in, or signed out after (cut) | functions/privacy.md | none | G30 |
| FR-PRV-18 | Given C-S20 "What happens", Then it states, in plain lines or a link to Privacy section 10: the (cut) | functions/privacy.md | none | G30 |
| FR-PRV-19 | Given a take marked as another language after its held draft reached the server, When the next sync (cut) | functions/privacy.md | none | G30 |
| FR-PRV-20 | Given an account whose required consent is not current, When the phone calls sync_pull, Then the (cut) | functions/privacy.md | none | G30 |
| FR-PRV-25 | Given the age step, Then only ageGate.passed (after Yes) or ageGate.stoppedAt (after No) is (cut) | functions/privacy.md | none | G30 |
| FR-PRV-26 | Given the D-131 country check at account creation, When it runs, Then the IP address is used in (cut) | functions/privacy.md | none | G30 |
| FR-PRV-27 | Given email sign-in (E-S05, E-S06), Then the address and the code never appear in a log, URL, (cut) | functions/privacy.md | none | G30 |
| FR-PRV-28 | Given first run, When the child's name and date are entered, Then on the account-first path they (cut) | functions/privacy.md | none | G30 |
| FR-PRV-30 | Given each store candidate, Then privacy re-runs label section 3.2 against the binary and records (cut) | functions/privacy.md | none | G30 |
| FR-PRV-31 | Given any 1.0.x build, When preflight-production.mjs runs, Then it fails if the dependency tree (cut) | functions/privacy.md | none | G30 |
| FR-PRV-33 | Given Me, Privacy, Then it has a design id and every state (signed in with consent on, off or (cut) | functions/privacy.md | none | G30 |
| FR-PRV-34 | Given Erase everything on a phone that held pictures, Find, typed days, shares and printable files, (cut) | functions/privacy.md | none | G30 |

### FR-QAL (13 of 16 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-QAL-01 | Given the locked pack, When 14-test-plan.md section 7 is next regenerated, Then it holds three (cut) | functions/quality.md | none | G08 |
| FR-QAL-03 | Given a P0 row whose "How proven" is E or P (a record, a counsel read, a gate record, an App Store (cut) | functions/quality.md | none | G08 |
| FR-QAL-05 | Given card 19, When the journeys of 14 section 4 are extended, Then J-N28 to J-N36 exist: J-N28 (cut) | functions/quality.md | none | G08 |
| FR-QAL-06 | Given the canary strings of J-N18, When the new first-run fields are filled (email, code, age (cut) | functions/quality.md | none | G08 |
| FR-QAL-11 | Given the unhappy-path lists of Annex D, When a P0 row's card names an unhappy case (core loop, (cut) | functions/quality.md | none | G08 |
| FR-QAL-12 | Given any test, run sheet, screenshot, trace, fixture or defect report, When it is created, Then it (cut) | functions/quality.md | none | G08 |
| FR-QAL-15 | Given a change to capture, store, save, erase or the first-run steps, When it merges to develop, (cut) | functions/quality.md | none | G08 |
| FR-QAL-16 | Given a store candidate, When each of G0 to G6 is claimed, Then the artifact named for that gate in (cut) | functions/quality.md | none | G08 |
| FR-QAL-17 | Given a defect, When it is triaged, Then it carries the severity of Annex I (S0 to S3) assigned by (cut) | functions/quality.md | none | G08 |
| FR-QAL-20 | Given a store candidate, When G4 runs, Then one pass is App Review's: a clean install of the (cut) | functions/quality.md | none | G08 |
| FR-QAL-21 | Given a candidate, When it is tested, Then an upgrade from the last store build with a seeded (cut) | functions/quality.md | none | G08 |
| FR-QAL-22 | Given the sign-in rows (E-S05, E-S06, J-E08), When they are tested, Then CI proves every error kind (cut) | functions/quality.md | none | G08 |
| FR-QAL-23 | Given a P0 device row, When no suitable phone is available, Then the founder may waive it in (cut) | functions/quality.md | none | G08 |

### FR-REL (9 of 15 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-REL-13 | Deleted stays deleted after a restore, proven by a canary. Given the drill, When an Asha letter and (cut) | functions/reliability.md | none | G27 |
| FR-REL-17 | Sev 0 events skip every budget and need no threshold: a lost or silently changed letter; a letter, (cut) | functions/reliability.md | none | G27 |
| FR-REL-23 | The log canary is built before any servers-on build reaches people outside the family. It plants a (cut) | functions/reliability.md | none | G27 |
| FR-REL-24 | Error messages are enums. Given any thrown error, reason or log line, Then it holds a code, never a (cut) | functions/reliability.md | none | G27 |
| FR-REL-33 | Record latency under stress, not only cold and warm: Speak while the previous take's words are (cut) | functions/reliability.md | none | G27 |
| FR-REL-41 | No Tier 0 screen waits on the network. Given the screens and actions of the contract, Then a test (cut) | functions/reliability.md | none | G27 |
| FR-REL-43 | The outbox survives everything: kill, reboot, update, a full disk, months offline. After months (cut) | functions/reliability.md | none | G27 |
| FR-REL-45 | The conflict note is built. Given the author's two phones change one letter's words while offline, (cut) | functions/reliability.md | none | G27 |
| FR-REL-61 | Switching phones with backup off is explained before it hurts, in the help centre and the existing (cut) | functions/reliability.md | none | G27 |

### FR-RSH (10 of 14 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-RSH-03 | Given a study of a feature whose flag is off outside the founder's family, When sessions run before (cut) | functions/research-validation.md | none | G34 |
| FR-RSH-13 | Given any study, When a person is screened, Then only adults take part, by a single yes or no ("are (cut) | functions/research-validation.md | none | G34 |
| FR-RSH-15 | Given any prototype, build or device used in a study, Then it holds the fictional Asha book only; (cut) | functions/research-validation.md | none | G34 |
| FR-RSH-17 | Given a study, When a person agrees, Then they see the study's consent text before agreeing, in (cut) | functions/research-validation.md | none | G34 |
| FR-RSH-19 | Given a study needs another adult (a relative, a co-parent), Then the default is relay through the (cut) | functions/research-validation.md | none | G34 |
| FR-RSH-20 | Given incentives, Then none is offered before the founder rules; the default is a thank-you message (cut) | functions/research-validation.md | none | G34 |
| FR-RSH-21 | Given research with tired and sometimes struggling parents, Then every guide opens with: no right (cut) | functions/research-validation.md | none | G34 |
| FR-RSH-22 | Given research data, Then one table of clocks holds in the founder's private store, outside the (cut) | functions/research-validation.md | none | G34 |
| FR-RSH-26 | Given any study result, Then it is never used as a public claim, a store line, a website sentence (cut) | functions/research-validation.md | none | G34 |
| FR-RSH-27 | Given a stop rule fires in any study (lost or changed words, a guilt or count line, an unintended (cut) | functions/research-validation.md | none | G34 |

### FR-RSK (4 of 4 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-RSK-02 | Given any incident where letters, voices, pictures or a child's details may have reached the wrong (cut) | functions/risk-security.md | none | G28 |
| FR-RSK-03 | Given any public sentence about safety (store listing, website, in-app), Then it makes no claim of (cut) | functions/risk-security.md | none | G28 |
| FR-RSK-04 | Given no person outside the founding family stores letters on the server, Then the R-17 review (cut) | functions/risk-security.md | none | G28 |
| FR-RSK-06 | Given a kill switch per surface (ADR 0029), Then each card's switch is tested in .killSwitch (cut) | functions/risk-security.md | none | G28 |

### FR-SEC (9 of 11 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-SEC-03 | Given A's book is hidden from B, Then none of A's data reaches B by any path: Home, waiting cards, (cut) | functions/risk-security.md | none | G28 |
| FR-SEC-04 | Given A's book is hidden after B signed in, When anyone opens the app, Then A's book opens again (cut) | functions/risk-security.md | none | G28 |
| FR-SEC-21 | Given any quick-capture doorway (widget, Control Center control, Action Button, Siri phrase) or (cut) | functions/risk-security.md | none | G28 |
| FR-SEC-22 | Given any screen that shows L4 data (Review editor, letter page, Find results, Save a copy preview, (cut) | functions/risk-security.md | none | G28 |
| FR-SEC-23 | Given scraping of public pages, Then the invite page (D-S14) and every public route show no child (cut) | functions/risk-security.md | none | G28 |
| FR-SEC-16 | Given the signed remote config, Then a valid signature can only hide a surface, stop a write, or (cut) | functions/risk-security.md | none | G28 |
| FR-SEC-18 | Given Find, From name, Firsts labels, typed days and photo paths, Then no query, label, name or (cut) | functions/risk-security.md | none | G28 |
| FR-SEC-24 | O-6 (code length): I agree with the default (8 digits, 900 s, the app length set in the same (cut) | functions/risk-security.md | none | G28 |
| FR-SEC-26 | Given the App Review demo sign-in, Then the reviewer account holds only the Asha book and is not a (cut) | functions/risk-security.md | none | G28 |

### FR-SUP (11 of 15 P0 rows)

| Row | One line | Card file | Band | Group |
|---|---|---|---|---|
| FR-SUP-03 | Given every call to supportMailto or mailTarget, When the test builds each URL, Then the (cut) | functions/support.md | none | G33 |
| FR-SUP-04 | Given the store build of each release, When it ships, Then a public help centre exists at a Support (cut) | functions/support.md | none | G33 |
| FR-SUP-05 | Given any help article or macro, When it is published or saved, Then every sentence is true of the (cut) | functions/support.md | none | G33 |
| FR-SUP-07 | Given a parent writes in, When support answers, Then the answer starts from a saved macro with a (cut) | functions/support.md | none | G33 |
| FR-SUP-09 | Given any support exchange, Then we may ask only for: what they tapped, the words they saw on the (cut) | functions/support.md | none | G33 |
| FR-SUP-10 | Given an email that carries letter text, a recording, a picture or a child's name, When it arrives, (cut) | functions/support.md | none | G33 |
| FR-SUP-11 | Given any help article, macro or in-app line about what we can see, Then it says what is true: (cut) | functions/support.md | none | G33 |
| FR-SUP-12 | Given a billing question, When support answers, Then it never promises, grants or estimates a (cut) | functions/support.md | none | G33 |
| FR-SUP-14 | Given a deletion request, Then the help centre and M3 point first to Me, Delete account (C-S20; (cut) | functions/support.md | none | G33 |
| FR-SUP-17 | Given any build, When a parent taps "If you are struggling" in Me, Then the page shows the lines (cut) | functions/support.md | none | G33 |
| FR-SUP-21 | Given a parent asks us to bring back pictures, recordings or a sealed letter's words from a lost or (cut) | functions/support.md | none | G33 |

## 8. Rows covered only by a cite (76), for review

Row-level `Satisfies:` ids are stronger than a cite in a function row's Links cell. These rows cite an existing heading, so they are not gaps, but each cite should be read: a status of `deferred`, `needs-founder` or `done` means the work is not scheduled, or is finished and untested against this row.

```
NS-01-R61 BL-870
NS-41-R6 BL-961
NS-42-R7 BL-577
NS-46-R25 BL-985
FR-AIS-04 BL-987
FR-AIS-11 BL-043
FR-AIS-20 BL-043
FR-AIS-22 BL-043
FR-AIS-42 BL-043
FR-AIS-55 BL-962
FR-BKO-03 BL-237
FR-BKO-04 BL-237
FR-BKO-07 BL-597,BL-598
FR-BKO-10 BL-779
FR-CMP-14 BL-119
FR-CUL-15 BL-961
FR-DAT-01 BL-975
FR-DAT-04 BL-981
FR-DAY-03 BL-966,BL-982
FR-DAY-07 BL-966
FR-DAY-09 BL-965
FR-DAY-10 BL-965
FR-DAY-11 BL-965
FR-FIN-02 BL-958
FR-LOC-15 BL-411
FR-LOC-17 BL-411
FR-LOC-18 BL-105
FR-LEG-01 BL-931
FR-LEG-03 BL-444
FR-LEG-09 BL-577
FR-LEG-18 BL-104
FR-MKT-25 BL-109,BL-981
FR-MSG-01 BL-053,BL-368
FR-MSG-03 BL-368
FR-MSG-06 BL-053
FR-MSG-09 BL-053
FR-MSG-10 BL-053
FR-MSG-16 BL-546
FR-MSG-23 BL-364,BL-510
FR-MSG-25 BL-053,BL-510
FR-MSG-29 BL-420,BL-421
FR-MSG-32 BL-243,BL-364
FR-MSG-33 BL-364
FR-MSG-34 BL-243,BL-364
FR-MSG-35 BL-364,BL-510
FR-MSG-36 BL-364
FR-OPS-03 BL-961
FR-OPS-15 BL-976
FR-OPS-23 BL-958
FR-PRT-01 BL-973
FR-PRV-01 BL-485
FR-PRV-02 BL-577,BL-579
FR-PRV-06 BL-960
FR-PRV-14 BL-961
FR-PRV-16 BL-962
FR-PRV-17 BL-962
FR-PRV-24 BL-579
FR-QAL-02 BL-002
FR-QAL-07 BL-929
FR-QAL-09 BL-929
FR-REL-12 BL-566
FR-REL-40 BL-929
FR-REL-42 BL-978
FR-REL-48 BL-929
FR-REL-49 BL-929
FR-REL-59 BL-978
FR-RSH-06 BL-983
FR-RSH-10 BL-939,BL-961
FR-RSH-14 BL-981
FR-RSH-16 BL-962
FR-SEC-01 BL-961
FR-SEC-02 BL-961
FR-SUP-01 BL-100
FR-SUP-15 BL-237,BL-783
FR-SUP-16 BL-105
FR-SUP-23 BL-100,BL-367
```

## 9. What I could not verify

- Update 20 Nov: the GitHub REST API worked in the later run (`id-collisions.mjs` printed 22 collisions among open PRs, none on the 38 ids filed; `gh pr list` does not work here because GraphQL is blocked, so PRs were read with `gh api repos/<owner>/<repo>/pulls`). Not checked: issue titles and comments, pull request review comments, and other forks. All pages of open and closed pull requests were read (854). The 38 ids are therefore free as far as those checks can say; a collision with an id remembered by a person is still possible.
- Open pull requests (first run). `node scripts/agents/next-id.mjs` and `id-collisions.mjs` call the GitHub API; the first printed `BL-1000` here but I cannot say whether the API calls succeeded (they are allowed to fail silently), so ids held by open PRs (for example BL-790 and BL-882 to BL-889 appear in cards but not in `docs/BACKLOG.md`) are not excluded from the free-id tiers. Ask Karma to run `node scripts/agents/id-collisions.mjs` before allocating.
- Whether a gap is real work. A row with no backlog row may already be built and tested (NS-09-R1 to R3 look done through #832; the NS-01 to NS-02 rows may be built in the stacked PRs #833 and later). I read no code and ran no test for this file; "gap" means no backlog row, not no implementation.
- Whether each of the 186 row-covered rows is satisfied by the row that names it. A range such as `NS-13-R1 to NS-13-R33` is taken at its word; I did not read the 186 covering rows' scope against each Given/When/Then.
- Ids used in other repos, other branches that were not fetched, or deleted PR titles: only the local clone's `git log --all` and `git branch -a` were searched.
- Statuses of dependencies were read on this branch only; `main` and `develop` may differ.
- The script's parser reads Priority from the table header. A P0 row in a table with no `Priority` header, or a P0 written outside a table (for example the 18-errata mention in E5 "NS-36-R5 (P0)"), is not seen. The row-count cross-checks in section 2 (221, 96, 371) support completeness for the tables it reads, but not for prose.
- One-line texts are mechanical truncations of the Given cell; they were not edited and a few start mid-sentence after the leading "Given".
- `docs/product/prd/tools/review/p0-table.md` was regenerated by the new `p0.py` (all cards 01 to 21 plus function files; it used to list cards 01 to 12 only). The file is tracked, so the old table is in git history.
