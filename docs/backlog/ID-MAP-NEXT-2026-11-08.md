# Id map for the next roadmap: working id to requirement id to backlog id

Status: written 8 Nov 2026 (UTC) by `product`, docs only. It decides nothing.

This is the file `docs/roadmap/next/_ID-MAP.md` that `_CONVENTIONS.md` section 4 asks for. The roadmap folder lives on PR #664's branch (`docs/next-roadmap-8nov`) and is not on `develop` yet, so the map is written here. When #664 merges, `product` moves this file to `docs/roadmap/next/_ID-MAP.md` in a normal edit and leaves a pointer here.

Rules (from `_CONVENTIONS.md` section 4): the map is the only place that holds both names. Test titles keep the working bracket and gain the real one beside it. Nothing is renamed.

Columns: working id, the `F##-REQ` (or the nearest cited id when the requirement file names no REQ number, marked "none numbered"), the BL id, the date. "reserved" means the id is reserved in PR #638 (`docs/backlog/READINESS-2026-11-08.md`) and has no row on `develop` yet. "held" means the requirement file marks it held and no id is taken.

Ids start at BL-757. `node scripts/agents/next-id.mjs` prints BL-740 today, but PR #638 section 1 renumbers #587's 18 items to start at BL-739, so BL-739 to BL-756 are held for them.

## Theme 1 (hosted backend)

| NX id | F##-REQ | BL | Date |
|---|---|---|---|
| NX-01-R1 | F02-REQ-024 | BL-757 | 2026-11-08 |
| NX-01-R2 | F02-REQ-024 | BL-757 | 2026-11-08 |
| NX-01-R3 | none numbered (BL-594) | BL-757 | 2026-11-08 |
| NX-01-R4 | none numbered (BL-600, F19) | BL-757 | 2026-11-08 |
| NX-01-R5 | DATA-REQ-030, DATA-REQ-031 | BL-761 | 2026-11-08 |
| NX-01-R6 | F19-REQ-006, F19-REQ-007 | BL-761 | 2026-11-08 |
| NX-01-R7 | F02-REQ-024 | BL-757 | 2026-11-08 |

## Theme 2 (sign-in and session)

| NX id | F##-REQ | BL | Date |
|---|---|---|---|
| NX-02-R1 | F02-REQ-015 | BL-758 | 2026-11-08 |
| NX-02-R2 | none numbered (BL-598 area) | BL-758 | 2026-11-08 |
| NX-02-R3 | F02-REQ-005 | BL-758 | 2026-11-08 |
| NX-02-R4 | F02-REQ-001 | BL-758 | 2026-11-08 |
| NX-02-R5 | F02-REQ-023 | BL-597 (existing, rank 3) | 2026-11-08 |
| NX-02-R6 | none numbered (BL-599) | BL-599 (existing, rank 3) | 2026-11-08 |
| NX-02-R7 | none numbered (BL-600) | BL-600 (existing, rank 3) | 2026-11-08 |
| NX-02-R8 | none numbered (BL-568) | BL-568 (existing, rank 3) | 2026-11-08 |
| NX-02-R9 | F02-REQ-018, F02-REQ-020 | BL-758 | 2026-11-08 |
| NX-02-R10 | none numbered (BL-598) | BL-758 | 2026-11-08 |

## Theme 3 (adults only, agreement, age signal, region)

| NX id | F##-REQ | BL | Date |
|---|---|---|---|
| NX-03-R0 | none numbered (CODE-R02) | BL-759 | 2026-11-08 |
| NX-03-R1a | F01-REQ-001 (PRD-REQ-019) | BL-759 | 2026-11-08 |
| NX-03-R1b | F02-REQ-026, F01-REQ-002 | BL-759 | 2026-11-08 |
| NX-03-R1c | F02-REQ-026 | BL-759 | 2026-11-08 |
| NX-03-R2 | LEGAL-REQ-002 | BL-759 | 2026-11-08 |
| NX-03-R3 | none numbered (BL-575, BL-564) | BL-759 | 2026-11-08 |
| NX-03-R4 | none numbered (BL-577, PRIV-R21) | BL-759 | 2026-11-08 |
| NX-03-R5 | none numbered (BL-578, BL-585) | BL-759 | 2026-11-08 |
| NX-03-R6 | F01-REQ-003, F01-REQ-010 (CR-004, CR-005); held | BL-759 (held tail) | 2026-11-08 |
| NX-03-R7 | none numbered (D-131, D-136); held | BL-759 (held tail) | 2026-11-08 |
| NX-03-R8 | none numbered (F21) | BL-759 | 2026-11-08 |

## Theme 4 (delete account, erase phone)

| NX id | F##-REQ | BL | Date |
|---|---|---|---|
| NX-04-R1 | DATA-REQ-023 | BL-760 | 2026-11-08 |
| NX-04-R2 | F02-REQ-004 | BL-760 | 2026-11-08 |
| NX-04-R3 | F21-REQ-014 (D-042) | BL-760 | 2026-11-08 |
| NX-04-R4 | F02-REQ-007 | BL-760 | 2026-11-08 |
| NX-04-R5 | DATA-REQ-024 | BL-640 (#520, filed in #599, not on develop yet) | 2026-11-08 |
| NX-04-R6 | none numbered (F11) | BL-760 | 2026-11-08 |
| NX-04-R7 | none numbered (F17) | BL-760 | 2026-11-08 |

## Theme 5 (reviewer sign-in, store pack)

| NX id | F##-REQ | BL | Date |
|---|---|---|---|
| NX-05-R1 | F21-REQ-006, F21-REQ-031 (BL-341) | BL-763 | 2026-11-08 |
| NX-05-R2 | none numbered (F21); held | BL-763 (held tail) | 2026-11-08 |
| NX-05-R3 | F19-REQ-024 | BL-763 | 2026-11-08 |
| NX-05-R4 | F21-REQ-028 (D-121, #498) | BL-763 | 2026-11-08 |
| NX-05-R5 | F21-REQ-012 | BL-763 | 2026-11-08 |
| NX-05-R6 | none numbered (LEGAL-REQ, RA-17-01) | BL-763 | 2026-11-08 |
| NX-05-R7 | F21-REQ-008 (BL-340) | BL-763 | 2026-11-08 |
| NX-05-R8 | none numbered (S-34, S-12b) | BL-763 | 2026-11-08 |
| NX-05-R9 | none numbered (APP_SIZE) | BL-763 | 2026-11-08 |

## Theme 6 (recording that behaves)

| NX id | F##-REQ | BL | Date |
|---|---|---|---|
| NX-06-R1 | F04-REQ-048 | BL-764 | 2026-11-08 |
| NX-06-R2 | F04-REQ-048, F04-REQ-008 | BL-734 (reserved) | 2026-11-08 |
| NX-06-R3 | none numbered (BL-563) | BL-764 | 2026-11-08 |
| NX-06-R4 | none numbered (BL-736) | BL-736 (reserved) | 2026-11-08 |
| NX-06-R5 | F03-REQ-005, F04-REQ-044 (opportunity 4) | BL-764 | 2026-11-08 |
| NX-06-R6 | none numbered (opportunity 2) | BL-764 (evidence row) | 2026-11-08 |
| NX-06-R7 | none numbered (opportunity 3) | BL-764 | 2026-11-08 |
| NX-06-R8 | none numbered (UR R1) | BL-764 (study row) | 2026-11-08 |
| NX-06-R9 | none numbered (feasibility R6, #533) | BL-765 | 2026-11-08 |

## Theme 7 (letters on every phone)

| NX id | F##-REQ | BL | Date |
|---|---|---|---|
| NX-07-R1 | F16-REQ-029 | BL-766 | 2026-11-08 |
| NX-07-R2 | F16-REQ-029c | BL-766 | 2026-11-08 |
| NX-07-R3 | F16-REQ-029a | BL-766 | 2026-11-08 |
| NX-07-R4 | F16-REQ-026 | BL-766 | 2026-11-08 |
| NX-07-R5 | F16-REQ-027 | BL-766 | 2026-11-08 |
| NX-07-R6 | none numbered (feasibility R12) | BL-766 | 2026-11-08 |
| NX-07-R7 | none numbered (brief B7) | BL-766 | 2026-11-08 |
| NX-07-R8 | none numbered (D-121, ADR 0024, AL-06) | BL-766 | 2026-11-08 |

## Theme 8 (Plus and billing trust)

| NX id | F##-REQ | BL | Date |
|---|---|---|---|
| NX-08-R1 | F14-REQ-016, F14-REQ-003 (M1, RR-5) | BL-767 | 2026-11-08 |
| NX-08-R2 | F14-REQ-001 (3.1.2, RR-10) | BL-767 | 2026-11-08 |
| NX-08-R3 | none numbered (gap map 1.8) | BL-767 (device row) | 2026-11-08 |
| NX-08-R4 | none numbered (counsel packet item 6) | BL-767 | 2026-11-08 |
| NX-08-R5 | none numbered (G7) | BL-767 (study row) | 2026-11-08 |
| NX-08-R6 | none numbered (BL-342) | BL-767 | 2026-11-08 |
| NX-08-R7 | F14-REQ-082 (D-133 in the file's Refines) | BL-736 (reserved) | 2026-11-08 |
| NX-08-R8 | none numbered (RR-10) | BL-767 | 2026-11-08 |

## Theme 9 (co-parent and shared voice)

| NX id | F##-REQ | BL | Date |
|---|---|---|---|
| NX-09-R1 | F11-REQ-006 (D-120, F11) | BL-771 | 2026-11-08 |
| NX-09-R2 | F02-REQ-021 | BL-771 | 2026-11-08 |
| NX-09-R3 | none numbered (D-126, #607) | BL-771 | 2026-11-08 |
| NX-09-R4 | none numbered (feasibility item 10); held | none (rank 31, held) | 2026-11-08 |
| NX-09-R5 | none numbered (AD-2); held | none (rank 31, held) | 2026-11-08 |
| NX-09-R6 | none numbered (#605) | BL-771 | 2026-11-08 |

## Theme 10 (reminders)

| NX id | F##-REQ | BL | Date |
|---|---|---|---|
| NX-10-R1 | none numbered (PRIV-R10, F13) | BL-770 (device row) | 2026-11-08 |
| NX-10-R2 | none numbered (feasibility item 6; F13-REQ-004 is the prompt rule, not this) | BL-770 | 2026-11-08 |
| NX-10-R3 | F13-REQ-019 (F13-U18, C-REQ-008) | BL-770 | 2026-11-08 |
| NX-10-R4 | none numbered (F13) | BL-770 | 2026-11-08 |
| NX-10-R5 | none numbered (CLAUDE.md content rules) | BL-770 | 2026-11-08 |
| NX-10-R6 | none numbered (HYPOTHESIS) | BL-770 | 2026-11-08 |

## Theme 11 (relatives add a hello)

All seven rows (NX-11-R1 to R7) are held by design behind ADRs and a counsel memo (backlog 08 rank 31). No BL id is taken. F37, F32, FAM-05, FAM-06, FAM-07 and D-131 are the cited ids.

## Theme 12 (names and languages)

| NX id | F##-REQ | BL | Date |
|---|---|---|---|
| NX-12-R1 | none numbered (D-121, #498) | BL-772 | 2026-11-08 |
| NX-12-R2 | none numbered (feasibility R13); held | none (rank 32, parked) | 2026-11-08 |
| NX-12-R3a | F07-REQ-004 | BL-772 | 2026-11-08 |
| NX-12-R3b | F07-REQ-005, F07-REQ-006 (the file also cites F07-REQ-001) | BL-772 | 2026-11-08 |
| NX-12-R4 | none numbered (feasibility item 4) | BL-772 | 2026-11-08 |
| NX-12-R5 | none numbered (CVL-06); held | none (rank 32, parked) | 2026-11-08 |
| NX-12-R6 | none numbered (feasibility item 5) | BL-772 | 2026-11-08 |

## Themes 15, 16, 17, 24, 27

| NX id | F##-REQ | BL | Date |
|---|---|---|---|
| NX-15-R1 | none numbered (D-095, D-124) | BL-769 | 2026-11-08 |
| NX-15-R2 | PRD-REQ-001, PRD-REQ-016 | BL-769 | 2026-11-08 |
| NX-15-R3 | LEGAL-REQ-017 | BL-769 | 2026-11-08 |
| NX-15-R4 | none numbered (CLAUDE.md privacy) | BL-769 | 2026-11-08 |
| NX-15-R5 | none numbered (plan section 14) | BL-769 | 2026-11-08 |
| NX-15-R6 | none numbered (plan section 4) | BL-769 | 2026-11-08 |
| NX-15-R7 | none numbered (plan section 8) | BL-769 | 2026-11-08 |
| NX-15-R8 | none numbered (plan section 8) | BL-769 | 2026-11-08 |
| NX-15-R9 | none numbered (plan section 9) | BL-769 | 2026-11-08 |
| NX-16-R1 | none numbered (F21) | BL-768 | 2026-11-08 |
| NX-16-R2 | F20-REQ-006 (PRIV-R10) | BL-768 | 2026-11-08 |
| NX-16-R3 | none numbered (opportunity 24) | BL-768 | 2026-11-08 |
| NX-16-R4 | F20-REQ-010, F20-REQ-012 (NX-02-R10) | BL-768 | 2026-11-08 |
| NX-16-R5 | none numbered (`06-nfr.md` section 14) | BL-768 | 2026-11-08 |
| NX-17-R1 | none numbered (`06-nfr.md` section 14) | BL-762 | 2026-11-08 |
| NX-17-R2 | LEGAL-REQ-014 | BL-762 | 2026-11-08 |
| NX-17-R3 | none numbered (D-135) | BL-762 | 2026-11-08 |
| NX-17-R4 | none numbered | BL-762 | 2026-11-08 |
| NX-17-R5 | none numbered | BL-762 | 2026-11-08 |
| NX-17-R6 | none numbered (`06-nfr.md` section 14) | BL-762 | 2026-11-08 |
| NX-24-R1 | F13-REQ-020, F21-REQ-033 (PR #587 ratings item) | BL-773 | 2026-11-08 |
| NX-24-R2 | F13-REQ-020 (F14 never-list) | BL-773 | 2026-11-08 |
| NX-24-R3 | none numbered (content rules) | BL-773 | 2026-11-08 |
| NX-24-R4 | F21-REQ-008 (BL-340) | BL-773 | 2026-11-08 |
| NX-24-R5 | none numbered (`06-nfr.md` section 8) | BL-773 (device row) | 2026-11-08 |
| NX-24-R6 | F21-REQ-005 (F21, D-139 in the file) | BL-773 | 2026-11-08 |
| NX-24-R7 | none numbered (PR #587) | BL-773 (dated record) | 2026-11-08 |
| NX-27-R1 | F04-REQ-015, F09-REQ-003 | BL-774 | 2026-11-08 |
| NX-27-R2 | F04-REQ-015 | BL-774 | 2026-11-08 |
| NX-27-R3 | none numbered (D-083) | BL-774 | 2026-11-08 |
| NX-27-R4 | none numbered; held | none (rank 29 tail, held) | 2026-11-08 |
| NX-27-R5 | none numbered (PRIV-R09); held | none (rank 29 tail, held) | 2026-11-08 |
| NX-27-R6 | none numbered; held | none (rank 29 tail, held) | 2026-11-08 |
| NX-27-R7 | none numbered; held | none (rank 29 tail, held) | 2026-11-08 |

## Judgement calls and known gaps

- Backlog 08 rank 5 counts all 7 rows of theme 1; rank 10 names R5 and R6. I gave R5 and R6 to BL-761 (rank 10) and R1 to R4, R7 to BL-757 (rank 5), so no row is in two BL ids.
- NX-06-R9 is mapped to BL-765 (rank 15). Backlog 08 names "`04` R6" (the feasibility file) as rank 15's requirement; reading NX-06-R9 as that row is my judgement.
- NX-27-R6 and the other held NX-27 and NX-09 rows keep no id until the block that holds them lifts.
- Update 8 Nov (second pass): I searched `docs/prd/v2/features` on develop and filled every number I could find (F01, F03, F04, F13, F14, F19, F20, F21 rows above). "none numbered" now means I searched and found none, or the row is about code or a decision with no REQ. Theme 17 (alerts) has no REQ at all.
- NX-24 cites F21-REQ-005 and F21-REQ-010; on develop those are category and age rating, and export compliance. The rating ask itself is F13-REQ-020 and F21-REQ-033. The roadmap file should be corrected by its owner.
- The four cells that cite F02-REQ-026, F02-REQ-027, F14-REQ-081 and F14-REQ-082 point at definitions that exist on the PR #638 branch and not on `develop`.
- Follow-up for the roadmap PR (#664), not edited here: the headers of NX-15, NX-16, NX-17, NX-24 and NX-27 say "backlog rank 15, 16, 17, 24, 27". Those are the old numbers from `00-stack-rank.md`; in backlog 08 the ranks are 22, 18, 11, 28, 29. Backlog 08 rank 4 (independent security test) and rank 8 (withdraw consent) are the two rows whose requirement files are being written today; they must not be confused with themes NX-04 and NX-08, which are other subjects.
