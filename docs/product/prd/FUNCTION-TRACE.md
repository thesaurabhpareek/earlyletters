# Function requirements trace (forward table, reverse view per card, rulings, questions, engineering rows, design needs)

Owner: `product` for Karma (CTO role, product side). Written 20 Nov 2026 (UTC). Docs only: nothing here is built, no string is live, no decision is recorded in `DECISIONS.md`. The people who wrote the function files are Claude roles, not licensed professionals; every legal reading in them says "counsel must confirm" and nothing here is legal advice.

Fictional family: Asha only. ASCII only.

## 0. What this file is and how it was made

Built by a script from the nine function files (`functions/support.md`, `marketing.md`, `operations.md`, `finance.md`, `data-and-measurement.md`, `privacy.md`, `legal.md`, `compliance.md`, `risk-security.md`), the cards `00` to `19`, `GAP-LOG.md`, and the e2e design under `docs/design/e2e/` read from the worktree of branch `docs/e2e-ux-20nov` (head `d94ed52d7` when read). The script is kept outside the repository at `/home/claude/trace-gen/` (not committed); rerun it when a function file changes. Every FR id, link, verdict, proposed change, question and engineering row below is read from those files; the only hand-written parts are the merge groups (which proposals are the same), the conflict recommendations, and the status derivation rule. Wording in quotes or after a handle is copied from the source file.

Source states to keep in mind:

- The function files were written while `19-from-download-to-first-letter.md` was a draft. NS-43 to NS-45 are on disk now (this run saw sections for NS-38 to NS-45). The function verdicts "missing" or "not reviewed" for NS-41 to NS-45 mean "card not yet written when the function reviewed", not "the card has a gap"; the function owners should re-read the cards that now exist.
- The Links column of an FR row is where the author names card rows, e2e ids and backlog rows (BRIEF "How each function's requirements get linked"). When an FR names none, this file says so and does not guess; where a screen in the FR is on the card 19 screen table, that card is shown as a suggestion only.
- `GAP-LOG.md` carries no ruling on any FR id yet (searched for "FR-"): nothing below is ruled by Karma.

### 0.1 Totals

| Function (code) | File | FR rows |
|---|---|---|
| support (SUP) | functions/support.md | 23 |
| policy (POL) | functions/support.md | 13 |
| marketing (MKT) | functions/marketing.md | 34 |
| operations (OPS) | functions/operations.md | 36 |
| finance (FIN) | functions/finance.md | 24 |
| data (DAT) | functions/data-and-measurement.md | 35 |
| privacy (PRV) | functions/privacy.md | 35 |
| legal (LEG) | functions/legal.md | 20 |
| compliance (CMP) | functions/compliance.md | 21 |
| security (SEC) | functions/risk-security.md | 25 |
| risk (RSK) | functions/risk-security.md | 6 |
| Total | | 272 |

Policy (POL) is in the support file; risk (RSK) and security (SEC) are in the risk-security file. FR-SEC-13 has no row and no reference anywhere (a numbering gap in the source; see 7.1).

### 0.2 Status column (how it is derived)

- `counsel`: a question to counsel (section 7 of the function file, or its counsel number) cites the FR, or the FR's owner lane names counsel.
- `founder`: a question to the founder cites the FR, or the owner lane names the founder.
- `needs Karma ruling`: a proposed card change cites the FR, or the FR names no locked card row (it is a new requirement the function adds, which Karma links or declines).
- `ruled`: none of the above. It rests on a locked card row or an existing decision and needs no new ruling. It does not mean Karma has ruled on the FR itself; see the GAP-LOG note above.
- Priority: the first priority in the FR's row, with its RR-4 reasons in brackets; `*` means the row carries more than one priority (read the source row).

## 1. Forward table: every FR, its function, priority, cards, e2e screens, backlog rows and status

Card cell: `NS-nn` with the row ids the author named; `(from text)` means the Links column names no card but the requirement text does; `NO CARD LINK` means neither does. e2e cell: ids from the Links column (with state suffix as written), `(text)` when read from the requirement text, `new screen needed` when the Links column says so. Backlog cell: BL ids from Links, `(text)` from the requirement or evidence text, `(eng table)` from section 6 of the function file, and `new row needed (NR-nn)` where section 6 asks for a row (NR numbers are working handles for section 5 of this file, not backlog ids; Karma allocates BL ids, none above BL-999).

| FR id | Function | Priority | Card(s) and rows | e2e screen ids | Backlog rows | Status |
|---|---|---|---|---|---|---|
| FR-SUP-01 | support | P0 (b) | pack-wide (frame or every card) | C-S01 | BL-100 | counsel; needs Karma ruling |
| FR-SUP-02 | support | P1 (a) * | NO CARD LINK (suggested via card 19 screen table: NS-39, NS-41, NS-10) | E-S01, E-S06.help, E-S09, E-S13 | new row needed (NR-01) | founder; needs Karma ruling |
| FR-SUP-03 | support | P0 (a) | NO CARD LINK | - | new row needed (NR-02) | founder; needs Karma ruling |
| FR-SUP-04 | support | P0 (b) * | NS-25; plus pack-wide | - | none named | counsel; needs Karma ruling |
| FR-SUP-05 | support | P0 (a) | NS-08; plus pack-wide | - | none named | counsel; needs Karma ruling |
| FR-SUP-06 | support | P1 | NO CARD LINK | - | new row needed (NR-03) | counsel; needs Karma ruling |
| FR-SUP-07 | support | P0 (b,a) * | NS-05; NS-10; NS-11; NS-21 | - | none named | counsel; founder; needs Karma ruling |
| FR-SUP-08 | support | P1 | NS-09; NS-35; NS-36; plus pack-wide | - | none named | counsel; founder; needs Karma ruling |
| FR-SUP-09 | support | P0 (a) | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-SUP-10 | support | P0 (a) | NO CARD LINK | - | none named | counsel; founder; needs Karma ruling |
| FR-SUP-11 | support | P0 (a) | NS-01; NS-02; NS-06 | - | none named | counsel; needs Karma ruling |
| FR-SUP-12 | support | P0 (a,b) | NO CARD LINK | E-S11 | BL-997 | founder; needs Karma ruling |
| FR-SUP-13 | support | P1 (a) * | NS-10 | C-S02 | BL-598, BL-597, BL-552 | counsel; needs Karma ruling |
| FR-SUP-14 | support | P0 (b) | NO CARD LINK (suggested via card 19 screen table: NS-45) | C-S20 | BL-551 | founder; needs Karma ruling |
| FR-SUP-15 | support | P0 (b) | NS-36 | - | BL-237, BL-783 | founder; needs Karma ruling |
| FR-SUP-16 | support | P0 (a) | NS-03; NS-23 | - | BL-105 (eng table) | counsel; needs Karma ruling |
| FR-SUP-17 | support | P0 (a) | NO CARD LINK | - | BL-105 (eng table) | founder; needs Karma ruling |
| FR-SUP-18 | support | P1 | NS-38 to NS-45 | E-S02, E-S14 | new row needed (NR-05) | needs Karma ruling |
| FR-SUP-19 | support | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-SUP-20 | support | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-SUP-21 | support | P0 (a) | NS-01; NS-08; NS-10 | - | none named | needs Karma ruling |
| FR-SUP-22 | support | P1 | NS-33; plus pack-wide | - | none named | needs Karma ruling |
| FR-SUP-23 | support | P0 (b) | NO CARD LINK | - | BL-100, BL-367 | founder; needs Karma ruling |
| FR-POL-01 | policy | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-POL-02 | policy | P0 (b) | NO CARD LINK | - | new row needed (NR-07) | counsel; founder; needs Karma ruling |
| FR-POL-03 | policy | P0 (b) | NS-03; NS-05; NS-25; NS-27; NS-28; NS-31 | - | none named | needs Karma ruling |
| FR-POL-04 | policy | P0 (a,b) | NS-25 | - | new row needed (NR-06) | counsel; needs Karma ruling |
| FR-POL-05 | policy | P0 (a) | NS-25 | - | none named | counsel; needs Karma ruling |
| FR-POL-06 | policy | P0 (b) | NO CARD LINK | - | none named | counsel; founder; needs Karma ruling |
| FR-POL-07 | policy | P0 (b) | NO CARD LINK (suggested via card 19 screen table: NS-40, NS-42) | E-S03 | BL-551 (text) | needs Karma ruling |
| FR-POL-08 | policy | P1 (b) * | NS-05; NS-16 | - | none named | counsel; needs Karma ruling |
| FR-POL-09 | policy | P2 | NS-05; NS-25 | - | none named | needs Karma ruling |
| FR-POL-10 | policy | P1 | NO CARD LINK | - | BL-552 | counsel; needs Karma ruling |
| FR-POL-11 | policy | P1 | NO CARD LINK | - | none named | counsel; needs Karma ruling |
| FR-POL-12 | policy | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-POL-13 | policy | P0 (b) | NS-03 | - | none named | founder; needs Karma ruling |
| FR-MKT-01 | marketing | P0 (a,b) | pack-wide (frame or every card) | E-S27 | none named | needs Karma ruling |
| FR-MKT-02 | marketing | P0 (b) | NO CARD LINK | - | new row needed (NR-03) | needs Karma ruling |
| FR-MKT-03 | marketing | P0 (a,b) | NS-24 | B-S19, B-S20 | none named | needs Karma ruling |
| FR-MKT-04 | marketing | P1 (a) | pack-wide (frame or every card) | E-S10, E-S11 | none named | needs Karma ruling |
| FR-MKT-05 | marketing | P0 (a) | NS-25 | - | none named | founder; needs Karma ruling |
| FR-MKT-06 | marketing | P0 (a,b) | NS-08 R7 | E-S27 | none named | founder |
| FR-MKT-07 | marketing | P0 (a) | NS-02; plus pack-wide | - | none named | needs Karma ruling |
| FR-MKT-08 | marketing | P0 (b) | NS-38 R2 | E-S02, E-S14, E-S27 | none named | needs Karma ruling |
| FR-MKT-09 | marketing | P0 (b) | NS-45; plus pack-wide | E-S16 | none named | needs Karma ruling |
| FR-MKT-10 | marketing | P1 (b) | pack-wide (frame or every card) | E-S27 | none named | needs Karma ruling |
| FR-MKT-11 | marketing | P0 (b) | NS-01; NS-02; NS-05; NS-06; NS-17 R4 | E-S27 | none named | founder; needs Karma ruling |
| FR-MKT-12 | marketing | P0 (b) | NS-01 R62 | A-S03, B-S04, B-S11, E-S27 | none named | founder |
| FR-MKT-13 | marketing | P1 (a) | NS-02 R11; NS-06 | B-S01, B-S05, B-S06 | none named | ruled |
| FR-MKT-14 | marketing | P1 (b) | NS-05 R4b R5b R16a R16b R19 | D-S01, D-S02, D-S03 | none named | needs Karma ruling |
| FR-MKT-15 | marketing | P0 (b) | pack-wide (frame or every card) | E-S27 | none named | founder; needs Karma ruling |
| FR-MKT-16 | marketing | P0 (b) | pack-wide (frame or every card) | C-S08, C-S21 | none named | needs Karma ruling |
| FR-MKT-17 | marketing | P1 (b) | NS-05; NS-25; NS-28 | E-S27 | none named | needs Karma ruling |
| FR-MKT-18 | marketing | P1 (b) | NS-33 | E-S27 | BL-984 | needs Karma ruling |
| FR-MKT-19 | marketing | P0 (a) | NS-05; plus pack-wide | D-S01, D-S03 | none named | needs Karma ruling |
| FR-MKT-20 | marketing | P0 (a) | NS-13; NS-18; NS-32 | D-S10, D-S11 | new row needed (NR-12) | needs Karma ruling |
| FR-MKT-21 | marketing | P1 (c) | NS-35; NS-38 to NS-45 | E-S02 | none named | needs Karma ruling |
| FR-MKT-22 | marketing | P0 (b) | NO CARD LINK (suggested via card 19 screen table: NS-44) | E-S10, E-S26, E-S11 | none named | needs Karma ruling |
| FR-MKT-23 | marketing | P1 (b) | NO CARD LINK (suggested via card 19 screen table: NS-44, NS-45) | A-S13, B-S18, B-S19, E-S10, C-S19, C-S20 | new row needed (NR-13) | founder; needs Karma ruling |
| FR-MKT-24 | marketing | P1 (a) | pack-wide (frame or every card) | A-S01, B-S17, B-S18, C-S06 | none named | needs Karma ruling |
| FR-MKT-25 | marketing | P0 (b) | NS-03 R7 | D-S23 | BL-981, BL-109 | ruled |
| FR-MKT-26 | marketing | P1 (b) | NS-17; NS-25 | - | BL-109 | founder; needs Karma ruling |
| FR-MKT-27 | marketing | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-MKT-28 | marketing | P0 (b) | NS-17 R4 | A-S10 | none named | ruled |
| FR-MKT-29 | marketing | P0 (a,b) | NS-08 R7 | C-S08, C-S21 | none named | ruled |
| FR-MKT-30 | marketing | P1 (b) | NO CARD LINK | E-S27 | none named | founder; needs Karma ruling |
| FR-MKT-31 | marketing | P1 (a) | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-MKT-32 | marketing | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-MKT-33 | marketing | P1 (b) | NS-38 to NS-45 | E-S02, E-S27 | none named | needs Karma ruling |
| FR-MKT-34 | marketing | P0 (a) | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-OPS-01 | operations | P1 | NS-01 R19; NS-02; NS-08 R14; NS-09 R17; NS-25 R11 | E-ST05, E-ST13c | new row needed (NR-22) | ruled |
| FR-OPS-02 | operations | P1 | NS-02 | E-ST13a | none named | needs Karma ruling |
| FR-OPS-03 | operations | P0 (a) | NS-08 R6 | E-ST17 | BL-961 | founder |
| FR-OPS-04 | operations | P1 | NS-16; NS-25 | E-ST29 | new row needed (NR-22) | needs Karma ruling |
| FR-OPS-05 | operations | P1 | NS-01; NS-02; NS-06; NS-12; NS-16; NS-25 | - | new row needed (NR-22) | needs Karma ruling |
| FR-OPS-06 | operations | P0 (b) | NS-06; NS-12; NS-16; NS-25 | - | BL-551 (text) | needs Karma ruling |
| FR-OPS-07 | operations | P1 | NS-06; NS-12; NS-16; NS-36 | E-ST17 | new row needed (NR-20), new row needed (NR-22) | needs Karma ruling |
| FR-OPS-08 | operations | P0 (a) | NS-06 B2 | - | new row needed (NR-20) | needs Karma ruling |
| FR-OPS-09 | operations | P0 (b) | NO CARD LINK | - | new row needed (NR-19) | needs Karma ruling |
| FR-OPS-10 | operations | P0 (c) | NS-25; NS-38 to NS-45 | E-S05.error-email, E-S06.error-rate, E-S14.outage | none named | founder; needs Karma ruling |
| FR-OPS-11 | operations | P0 (c) | pack-wide (frame or every card) | E-ST02, E-ST03 | none named | founder; needs Karma ruling |
| FR-OPS-12 | operations | P1 (a) * | NS-08 | E-ST02 | new row needed (NR-18) | needs Karma ruling |
| FR-OPS-13 | operations | P1 | NO CARD LINK | E-ST02 | none named | founder; needs Karma ruling |
| FR-OPS-14 | operations | P0 (a) | NO CARD LINK (suggested via card 19 screen table: NS-41) | E-ST02, E-ST03, E-S14 | new row needed (NR-17) | needs Karma ruling |
| FR-OPS-15 | operations | P0 (a) | NS-08 R1 | - | BL-976 | ruled |
| FR-OPS-16 | operations | P0 (a) | NS-08 R14 R16 R19 | E-ST10, E-ST11 | BL-976 (eng table) | needs Karma ruling |
| FR-OPS-17 | operations | P0 (a) | NS-01; NS-02; NS-16; NS-18 | - | none named | needs Karma ruling |
| FR-OPS-18 | operations | P1 | pack-wide (frame or every card) | - | new row needed (NR-22) | needs Karma ruling |
| FR-OPS-19 | operations | P1 | NO CARD LINK | E-ST01, E-ST02 | new row needed (NR-22) | needs Karma ruling |
| FR-OPS-20 | operations | P1 | NS-08 R7; plus pack-wide | E-ST02, E-ST03 | new row needed (NR-21) | founder |
| FR-OPS-21 | operations | P1 | NS-10; NS-25 | E-S14.outage, E-ST17, C-S12 (text) | BL-997 (text) | needs Karma ruling |
| FR-OPS-22 | operations | P1 | pack-wide (frame or every card) | - | BL-958, BL-988 (eng table) | needs Karma ruling |
| FR-OPS-23 | operations | P0 (a) | NS-01 R45; NS-08 R5 | - | BL-958, BL-988 (eng table) | ruled |
| FR-OPS-24 | operations | P0 (a) | NS-06 | - | none named | founder; needs Karma ruling |
| FR-OPS-25 | operations | P1 | NS-45 | E-S16, E-ST18 | new row needed (NR-16) | needs Karma ruling |
| FR-OPS-26 | operations | P1 | NS-05; NS-06; NS-07; NS-13; NS-23 | - | none named | needs Karma ruling |
| FR-OPS-27 | operations | P1 | NS-04; NS-06; NS-34 | - | none named | needs Karma ruling |
| FR-OPS-28 | operations | P0 (c) | NS-34 | - | none named | needs Karma ruling |
| FR-OPS-29 | operations | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-OPS-30 | operations | P1 * | (from text) NS-33, NS-34 | E-ST02, E-S14, E-ST35, E-ST37 (text) | BL-929, BL-948 | needs Karma ruling |
| FR-OPS-31 | operations | P0 (a) | NS-01 R62; NS-02 R48; NS-34 R5 | E-S27 | none named | founder |
| FR-OPS-32 | operations | P1 | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-OPS-33 | operations | P0 (c) | pack-wide (frame or every card) | E-S14, E-S24 | none named | needs Karma ruling |
| FR-OPS-36 | operations | P1 | NS-40 R9 | E-S14, E-S04.refused-region | none named | ruled |
| FR-OPS-34 | operations | P1 | NS-07 | - | none named | needs Karma ruling |
| FR-OPS-35 | operations | P1 | NO CARD LINK | - | BL-999 (text) | founder; needs Karma ruling |
| FR-FIN-01 | finance | P1 | NS-08 R2; plus pack-wide | - | none named | ruled |
| FR-FIN-02 | finance | P0 (a) | pack-wide (frame or every card) | - | BL-958, BL-988 | needs Karma ruling |
| FR-FIN-03 | finance | P0 (c) | NS-08; NS-10 | - | new row needed (NR-18) | needs Karma ruling |
| FR-FIN-04 | finance | P1 | NS-08; NS-12 | - | new row needed (NR-23) | needs Karma ruling |
| FR-FIN-05 | finance | P0 (a) | NS-08 R2 R17 | - | none named | ruled |
| FR-FIN-06 | finance | P1 | NS-01; NS-04; NS-06 | - | new row needed (NR-25) | needs Karma ruling |
| FR-FIN-07 | finance | P1 | NO CARD LINK (suggested via card 19 screen table: NS-41) | E-S04, E-S06, E-S14 | none named | needs Karma ruling |
| FR-FIN-08 | finance | P1 | NS-17 | - | new row needed (NR-26) | needs Karma ruling |
| FR-FIN-09 | finance | P0 (b) | NS-13 R11; NS-32 R12 | E-S10, E-S11, E-S12, E-S25, E-S26, D-S10 | new row needed (NR-03) | ruled |
| FR-FIN-10 | finance | P1 | NS-38 | E-S27 | new row needed (NR-27) | needs Karma ruling |
| FR-FIN-11 | finance | P0 (a) | NS-10 R10 | E-S11 | new row needed (NR-24) | needs Karma ruling |
| FR-FIN-12 | finance | P1 | NO CARD LINK | E-S11.grace | none named | needs Karma ruling |
| FR-FIN-13 | finance | P1 | NS-03 | E-S10, E-S11 | none named | needs Karma ruling |
| FR-FIN-14 | finance | P1 | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-FIN-15 | finance | P2 | pack-wide (frame or every card) | - | none named | founder; needs Karma ruling |
| FR-FIN-16 | finance | P1 | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-FIN-17 | finance | P1 | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-FIN-18 | finance | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-FIN-19 | finance | P1 | NS-06; NS-10; NS-25; NS-34 | - | none named | founder; needs Karma ruling |
| FR-FIN-20 | finance | P1 | NS-17 | - | none named | founder; needs Karma ruling |
| FR-FIN-21 | finance | P1 | pack-wide (frame or every card) | - | none named | founder; needs Karma ruling |
| FR-FIN-22 | finance | P0 (b) | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-FIN-23 | finance | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-FIN-24 | finance | P2 | NS-07; NS-30 | - | none named | founder |
| FR-DAT-01 | data | P0 (b) | NS-07 | - | BL-975, new row needed (NR-30) | ruled |
| FR-DAT-02 | data | P0 (a) | pack-wide (frame or every card) | C-S01, C-S04 | none named | needs Karma ruling |
| FR-DAT-03 | data | P0 (a) | pack-wide (frame or every card) | A-S13, B-S19, B-S20, E-S10, E-S26 | none named | needs Karma ruling |
| FR-DAT-04 | data | P0 (a) | pack-wide (frame or every card) | - | BL-981, new row needed (NR-28) | founder; needs Karma ruling |
| FR-DAT-05 | data | P0 (a) | pack-wide (frame or every card) | - | new row needed (NR-28) | founder; needs Karma ruling |
| FR-DAT-06 | data | P1 | pack-wide (frame or every card) | - | new row needed (NR-28) | needs Karma ruling |
| FR-DAT-07 | data | P1 | pack-wide (frame or every card) | - | new row needed (NR-28) | needs Karma ruling |
| FR-DAT-08 | data | P1 | NS-10; NS-14; NS-33; plus pack-wide | - | new row needed (NR-28) | needs Karma ruling |
| FR-DAT-09 | data | P0 (a) | NS-07; plus pack-wide | - | none named | founder; needs Karma ruling |
| FR-DAT-10 | data | P1 | NS-01 | - | BL-981 | needs Karma ruling |
| FR-DAT-11 | data | P1 | NS-01 | - | BL-981 | needs Karma ruling |
| FR-DAT-12 | data | P1 | NS-06 | - | BL-969, BL-970, BL-981 | founder; needs Karma ruling |
| FR-DAT-13 | data | P1 | NS-01; NS-11; NS-36 R5; plus pack-wide | C-S04 | new row needed (NR-28) | needs Karma ruling |
| FR-DAT-14 | data | P0 (a) | NS-08; NS-10; plus pack-wide | - | none named | founder; needs Karma ruling |
| FR-DAT-15 | data | P1 | NS-34 R1 R5; NS-37 | E-S23 | BL-929, BL-948 | ruled |
| FR-DAT-16 | data | P1 | NS-34; plus pack-wide | - | none named | needs Karma ruling |
| FR-DAT-17 | data | P1 | NS-07; NS-09; NS-35; NS-36; plus pack-wide | - | none named | needs Karma ruling |
| FR-DAT-18 | data | P2 | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-DAT-19 | data | P1 | pack-wide (frame or every card) | - | none named | founder; needs Karma ruling |
| FR-DAT-20 | data | P0 (a) | NS-07; plus pack-wide | - | none named | founder |
| FR-DAT-21 | data | P1 | pack-wide (frame or every card) | E-S26 | none named | needs Karma ruling |
| FR-DAT-22 | data | P1 | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-DAT-23 | data | P1 | NS-17 | - | none named | counsel; needs Karma ruling |
| FR-DAT-24 | data | P1 | NS-33 | - | none named | counsel; needs Karma ruling |
| FR-DAT-25 | data | P1 | NS-11; NS-24 | - | none named | needs Karma ruling |
| FR-DAT-26 | data | P2 | NO CARD LINK | - | new row needed (NR-29) | needs Karma ruling |
| FR-DAT-27 | data | P0 (a) | NS-02; NS-05; NS-06; NS-11; NS-16; NS-17; NS-18; NS-33 | - | none named | needs Karma ruling |
| FR-DAT-28 | data | P1 | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-DAT-29 | data | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-DAT-30 | data | P1 | NS-02 | - | none named | needs Karma ruling |
| FR-DAT-31 | data | P1 | (from text) NS-01 | - | none named | founder; needs Karma ruling |
| FR-DAT-32 | data | P0 (a) | NS-13; plus pack-wide | - | none named | needs Karma ruling |
| FR-DAT-33 | data | P1 | NS-39 | - | BL-994 | needs Karma ruling |
| FR-DAT-34 | data | P2 | (from text) NS-45 | E-S16 | none named | needs Karma ruling |
| FR-DAT-35 | data | P0 (b) | NS-40; NS-41 | E-S03, E-S04, E-S07 | none named | counsel; needs Karma ruling |
| FR-PRV-01 | privacy | P0 (b) | NO CARD LINK | C-S01; new screen needed | BL-485 | needs Karma ruling |
| FR-PRV-02 | privacy | P0 (b,c) | NS-42 | E-S03, E-S07, C-S11, D-S16, C-S21 (text) | BL-577, BL-579, BL-994 (eng table) | needs Karma ruling |
| FR-PRV-03 | privacy | P1 | NO CARD LINK | C-S04 | BL-577 (eng table) | needs Karma ruling |
| FR-PRV-04 | privacy | P1 | NS-42 | E-S02, E-S03, E-S07, C-S11, D-S16 (text) | BL-577, BL-994 (eng table) | needs Karma ruling |
| FR-PRV-05 | privacy | P1 | NS-41 | E-S07.declined, C-S11.declined | new row needed (NR-38) | needs Karma ruling |
| FR-PRV-06 | privacy | P0 (b) | NS-36 R6 | - | BL-960 | founder |
| FR-PRV-07 | privacy | P1 | NS-01 | - | BL-961 (eng table) | needs Karma ruling |
| FR-PRV-08 | privacy | P1 (b) | NS-08 | - | BL-960 (eng table) | needs Karma ruling |
| FR-PRV-09 | privacy | P1 (a) | NO CARD LINK | - | new row needed (NR-20) | counsel; needs Karma ruling |
| FR-PRV-10 | privacy | P0 (a) | NO CARD LINK (suggested via card 19 screen table: NS-43, NS-39, NS-41) | E-S08, E-S05 (text) | new row needed (NR-32) | needs Karma ruling |
| FR-PRV-11 | privacy | P0 (a) | NO CARD LINK | - | new row needed (NR-33) | needs Karma ruling |
| FR-PRV-12 | privacy | P1 | NO CARD LINK | - | new row needed (NR-02) | needs Karma ruling |
| FR-PRV-13 | privacy | P0 (a) | NS-02 R25; NS-25 R2 R6 | - | new row needed (NR-33) | ruled |
| FR-PRV-14 | privacy | P0 (a) | NO CARD LINK | E-S18 | BL-961, BL-994 (eng table) | needs Karma ruling |
| FR-PRV-15 | privacy | P0 (a) | NO CARD LINK (suggested via card 19 screen table: NS-45) | C-S03, C-S19 | BL-961 (eng table), BL-994 (eng table) | needs Karma ruling |
| FR-PRV-16 | privacy | P0 (a) | NS-01 R50; NS-06 A22; NS-21 R12 | A-S07, A-S06, B-S08, B-S11, B-S12, A-S09, D-S08, E-S08 (text) | BL-962 | ruled |
| FR-PRV-17 | privacy | P0 (a) | NS-04 R8; NS-06 | - | BL-962 | ruled |
| FR-PRV-18 | privacy | P0 (b) | NS-01 R31 | C-S20 (text) | BL-994 (eng table) | needs Karma ruling |
| FR-PRV-19 | privacy | P0 (a) | NS-17 R8 | - | new row needed (NR-34) | needs Karma ruling |
| FR-PRV-20 | privacy | P0 (a) | NS-10 | C-S11.declined | new row needed (NR-35) | needs Karma ruling |
| FR-PRV-21 | privacy | P1 (b) | NS-12 | - | BL-979 (eng table) | needs Karma ruling |
| FR-PRV-22 | privacy | P1 (b) | NS-16 | - | BL-980 (eng table) | needs Karma ruling |
| FR-PRV-23 | privacy | P2 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-PRV-24 | privacy | P0 (b) | NS-39; NS-40; NS-41; NS-43 | E-S01, E-S08, E-S02 (text) | BL-579, BL-994 (eng table) | needs Karma ruling |
| FR-PRV-25 | privacy | P0 (b) | NO CARD LINK | - | BL-994 (eng table) | needs Karma ruling |
| FR-PRV-26 | privacy | P0 (b) | NS-40 | E-S03.region | BL-994 (eng table), new row needed (NR-39) | needs Karma ruling |
| FR-PRV-27 | privacy | P0 (a) | NO CARD LINK (suggested via card 19 screen table: NS-41, NS-10) | E-S06, C-S10 | BL-994 (eng table) | counsel; needs Karma ruling |
| FR-PRV-28 | privacy | P0 (b) | NO CARD LINK (suggested via card 19 screen table: NS-42, NS-41, NS-43, NS-39) | E-S07, E-S08, E-S14, E-S24 | BL-994 (eng table) | needs Karma ruling |
| FR-PRV-35 | privacy | P1 | NS-41 | - | BL-994 (eng table), new row needed (NR-37) | needs Karma ruling |
| FR-PRV-29 | privacy | P1 | NS-07 | - | BL-975 | needs Karma ruling |
| FR-PRV-30 | privacy | P0 (b) | NS-01 | - | none named | needs Karma ruling |
| FR-PRV-31 | privacy | P0 (b) | NO CARD LINK | - | BL-958 (eng table), BL-988 (eng table) | needs Karma ruling |
| FR-PRV-32 | privacy | P1 (b) | NS-25 | E-S07, D-S13 (text) | none named | counsel; needs Karma ruling |
| FR-PRV-33 | privacy | P0 (b) | NO CARD LINK | C-S01 | none named | needs Karma ruling |
| FR-PRV-34 | privacy | P0 (a) | NS-01 R16 R52; NS-05 R10; NS-07; NS-36; NS-37 R5 | - | new row needed (NR-36) | ruled |
| FR-LEG-01 | legal | P0 (b) | NS-01 R26 R32 R61 | A-S03, B-S11 | BL-931 | ruled |
| FR-LEG-02 | legal | P0 (b) | NS-01 R31; NS-02; NS-06 B18 | C-S20, C-S19 | new row needed (NR-40) | needs Karma ruling |
| FR-LEG-03 | legal | P0 (a) | NS-25 | D-S18 | BL-444 | founder; needs Karma ruling |
| FR-LEG-04 | legal | P0 (b) | NS-10; NS-38; NS-41 | E-S02, E-S03, E-S07 | none named | counsel; founder; needs Karma ruling |
| FR-LEG-05 | legal | P1 (b) * | NS-05 R3a R3b R5b R7 R12 R24 | D-S01, D-S02 | none named | needs Karma ruling |
| FR-LEG-06 | legal | P0 (a) | NS-06 B1 | B-S13, B-S14, B-S16 | none named | needs Karma ruling |
| FR-LEG-07 | legal | P0 (b) | NS-06 B9 | B-S13 | new row needed (NR-44) | needs Karma ruling |
| FR-LEG-08 | legal | P0 (b) | NS-06; NS-12; NS-16 R3; NS-18; NS-36 | A-S09, B-S12, B-S13, D-S08 | none named | counsel; needs Karma ruling |
| FR-LEG-09 | legal | P0 (b) | NS-08; NS-10; NS-25 R17; NS-42 | E-S07, C-S11, D-S16, C-S21 | BL-577, new row needed (NR-41) | needs Karma ruling |
| FR-LEG-10 | legal | P0 (b) | NS-25 R13 R16 R17 | D-S13, D-S16, D-S19 | BL-404 (eng table), new row needed (NR-45) | counsel; needs Karma ruling |
| FR-LEG-11 | legal | P0 (b) | NS-03 R1 | D-S23 | none named | ruled |
| FR-LEG-12 | legal | P0 (b) * | NS-07 C28; NS-30 | C-S05 | new row needed (NR-42) | needs Karma ruling |
| FR-LEG-13 | legal | P0 (b) | NS-17 R4 | - | none named | ruled |
| FR-LEG-14 | legal | P1 | NS-01 | - | none named | needs Karma ruling |
| FR-LEG-15 | legal | P0 (b) | NS-16 R3 | A-S09 | new row needed (NR-43) | needs Karma ruling |
| FR-LEG-16 | legal | P1 (a) * | NS-08 | C-S21 | none named | founder; needs Karma ruling |
| FR-LEG-17 | legal | P2 * | NS-09; NS-12 | - | none named | ruled |
| FR-LEG-18 | legal | P0 (b) | pack-wide (frame or every card) | - | BL-104 | needs Karma ruling |
| FR-LEG-19 | legal | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-LEG-20 | legal | P0 (b) | NS-42 | E-S03, E-S07 | none named | counsel; founder; needs Karma ruling |
| FR-CMP-01 | compliance | P0 (b) | pack-wide (frame or every card) | - | new row needed (NR-50) | needs Karma ruling |
| FR-CMP-02 | compliance | P1 | NS-06; NS-17 | - | none named | ruled |
| FR-CMP-03 | compliance | P0 (b) | NS-01; NS-35 | E-S04, E-S07 | new row needed (NR-46) | founder; needs Karma ruling |
| FR-CMP-04 | compliance | P0 (b) | NS-01 R15 R26 R61 | - | new row needed (NR-50) | needs Karma ruling |
| FR-CMP-05 | compliance | P0 (b) | NS-05; NS-07; NS-08; NS-26; NS-28 | - | none named | ruled |
| FR-CMP-06 | compliance | P0 (b) | NS-33 | E-S23 | none named | founder; needs Karma ruling |
| FR-CMP-07 | compliance | P0 (b) | NS-33 | E-S03, E-S07, E-S10, E-S11, C-S20, D-S13, D-S16, D-S02 +2 more (text) | none named | ruled |
| FR-CMP-08 | compliance | P1 | NS-01 R38a R38b; NS-06; NS-21; plus pack-wide | B-S11, B-S12, B-S15 | none named | ruled |
| FR-CMP-09 | compliance | P1 | NS-38 to NS-45 | E-S05, E-S06 | new row needed (NR-49) | needs Karma ruling |
| FR-CMP-10 | compliance | P1 | NS-33 | - | BL-404 | needs Karma ruling |
| FR-CMP-11 | compliance | P0 (b) | NO CARD LINK | - | new row needed (NR-15) | founder; needs Karma ruling |
| FR-CMP-12 | compliance | P0 (b) | pack-wide (frame or every card) | - | none named | founder; needs Karma ruling |
| FR-CMP-13 | compliance | P0 (b) | NS-25 R2 R6 | E-S03, D-S14, D-S15, D-S16 | none named | needs Karma ruling |
| FR-CMP-14 | compliance | P0 (b) | NS-16 | - | BL-119 | needs Karma ruling |
| FR-CMP-15 | compliance | P0 (b) | NS-40 | E-S01, E-S03 | new row needed (NR-47) | counsel; founder; needs Karma ruling |
| FR-CMP-16 | compliance | P0 (a) | NO CARD LINK (suggested via card 19 screen table: NS-42, NS-41) | E-S07, C-S01 | new row needed (NR-48) | needs Karma ruling |
| FR-CMP-17 | compliance | P0 (b) | NS-10 | C-S20 | none named | needs Karma ruling |
| FR-CMP-18 | compliance | P0 (b) | NS-10 | E-S02 | none named | founder; needs Karma ruling |
| FR-CMP-19 | compliance | P0 (b) | NS-05; NS-25 | - | none named | founder; needs Karma ruling |
| FR-CMP-20 | compliance | P0 (b) | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-CMP-21 | compliance | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-SEC-01 | security | P0 (a) | NS-01 R29; NS-02 R24; NS-25 R19; NS-41 R6 | E-S18 | BL-961 | needs Karma ruling |
| FR-SEC-02 | security | P0 (a) | NO CARD LINK | E-S15 | BL-961 | needs Karma ruling |
| FR-SEC-03 | security | P0 (a) | NS-02 R24; NS-11 R22; NS-13 R13 | - | BL-961 (eng table) | needs Karma ruling |
| FR-SEC-04 | security | P0 (a) | NO CARD LINK | C-S19, E-S18 | none named | needs Karma ruling |
| FR-SEC-05 | security | P1 | NS-10 R5; NS-41 R5 | E-S24 | none named | ruled |
| FR-SEC-06 | security | P1 | NS-36; NS-45 | C-S19 | new row needed (NR-52) | counsel; founder; needs Karma ruling |
| FR-SEC-07 | security | P1 | NO CARD LINK (suggested via card 19 screen table: NS-45) | C-S03, E-S22 | none named | needs Karma ruling |
| FR-SEC-08 | security | P1 | NS-07; NS-11 | C-S04, C-S05 | none named | counsel; founder; needs Karma ruling |
| FR-SEC-21 | security | P0 (a) | NS-06; NS-32 R12 | A-S14, D-S10 | none named | needs Karma ruling |
| FR-SEC-22 | security | P0 (a) | NS-01 R13a; NS-23 R11 | E-S22 | none named | ruled |
| FR-SEC-09 | security | P1 | NS-25 R4 | D-S18, D-S19 | none named | needs Karma ruling |
| FR-SEC-10 | security | P1 | NS-25 | D-S16 | new row needed (NR-53) | needs Karma ruling |
| FR-SEC-11 | security | P2 | NS-41 R21 | E-S05 | new row needed (NR-53) | ruled |
| FR-SEC-12 | security | P1 | NS-45 | C-S02, C-S20 | none named | needs Karma ruling |
| FR-SEC-23 | security | P0 (a) | NS-25 R6 | D-S14 | none named | ruled |
| FR-SEC-14 | security | P1 | NS-01; NS-06 | - | new row needed (NR-54) | needs Karma ruling |
| FR-SEC-15 | security | P2 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-SEC-16 | security | P0 (a) | NO CARD LINK | - | new row needed (NR-55) | needs Karma ruling |
| FR-SEC-17 | security | P1 | NS-05; NS-26; NS-28 | - | none named | needs Karma ruling |
| FR-SEC-18 | security | P0 (a) | NS-01; NS-02; NS-06; NS-16; NS-18 | - | new row needed (NR-32) | needs Karma ruling |
| FR-SEC-19 | security | P1 | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-SEC-20 | security | P2 | NS-06; NS-12; NS-25 | - | new row needed (NR-56) | needs Karma ruling |
| FR-SEC-24 | security | P0 (b) | NS-41 R9 R10 | - | none named | founder |
| FR-SEC-25 | security | P1 | NS-39 R9; NS-43 R10 | E-S22, C-S03 | none named | ruled |
| FR-SEC-26 | security | P0 (b) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-RSK-01 | risk | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-RSK-02 | risk | P0 (b) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-RSK-03 | risk | P0 (b) | NS-06; plus pack-wide | - | none named | needs Karma ruling |
| FR-RSK-04 | risk | P0 (b) | NS-25 | - | none named | founder; needs Karma ruling |
| FR-RSK-05 | risk | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-RSK-06 | risk | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |

## 2. Reverse view per card, NS-01 to NS-45

Verdict key: C covered, P partly, M missing, n/a not applicable to that function, NR the function did not review the card (written after, or not on disk), `-` the function file has no row for the card. Where a function split a card into parts (NS-06 A, B, C; NS-07 C5, C28, G11) the worst part is shown and the parts are in 2c.

### 2a. Function verdicts per card

| Card | support | marketing | operations | finance | data | privacy | legal | compliance | security and risk | FRs touching |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-01 | P | P | P | C | P | C | P | P | P | 44 |
| NS-02 | C | P | P | C | P | C | C | C | P | 27 |
| NS-03 | P | C | C | C | C | C | P | C | C | 8 |
| NS-04 | C | C | C | C | C | C | C | C | C | 3 |
| NS-05 | P | P | P | C | P | C | P | P | C | 27 |
| NS-06 | P | P | P | P | P | P | P | P | P | 41 |
| NS-07 | P | C | P | P | P | P | P | C | P | 17 |
| NS-08 | P | P | P | P | P | P | P | P | C | 29 |
| NS-09 | C | C | C | C | C | C | C | C | C | 8 |
| NS-10 | P | C | P | P | P | P | P | P | P | 21 |
| NS-11 | P | C | C | C | P | P | C | C | P | 12 |
| NS-12 | C | C | P | M | P | P | P | C | C | 12 |
| NS-13 | C | P | P | C | P | C | C | C | C | 9 |
| NS-14 | C | C | C | C | P | C | C | C | C | 5 |
| NS-15 | C | C | C | C | P | C | C | C | C | 1 |
| NS-16 | M | C | P | C | P | P | P | P | C | 16 |
| NS-17 | C | P | P | P | P | P | P | P | P | 14 |
| NS-18 | C | C | C | C | C | C | P | C | C | 7 |
| NS-19 | C | C | C | n/a | n/a | C | C | C | C | 1 |
| NS-20 | C | C | C | n/a | n/a | C | C | C | C | 1 |
| NS-21 | P | C | C | C | C | C | C | C | C | 6 |
| NS-22 | C | C | C | C | C | C | C | C | C | 2 |
| NS-23 | P | C | C | C | C | C | C | C | C | 8 |
| NS-24 | C | P | C | C | P | C | C | C | C | 6 |
| NS-25 | M | P | P | P | P | P | M | P | P | 38 |
| NS-26 | C | C | C | P | n/a | C | C | C | C | 6 |
| NS-27 | C | C | C | n/a | n/a | C | C | C | C | 2 |
| NS-28 | C | C | C | P | n/a | C | C | C | C | 6 |
| NS-29 | C | C | C | C | n/a | C | C | C | C | 2 |
| NS-30 | C | C | C | P | n/a | C | C | C | C | 4 |
| NS-31 | C | C | C | n/a | n/a | C | C | C | C | 2 |
| NS-32 | C | P | C | C | C | C | C | C | C | 6 |
| NS-33 | P | C | P | C | P | C | C | P | C | 10 |
| NS-34 | C | C | P | P | C | C | C | C | C | 7 |
| NS-35 | C | C | C | C | C | C | C | C | C | 5 |
| NS-36 | P | C | P | C | C | P | P | P | C | 12 |
| NS-37 | C | C | C | C | C | C | C | C | C | 3 |
| NS-38 | NR | P | NR | P | P | C | P | P | C | 23 |
| NS-39 | NR | P | NR | C | C | C | C | C | C | 15 |
| NS-40 | NR | P | NR | C | P | P | C | P | C | 17 |
| NS-41 | NR | M | NR | NR | P | P | P | P | C | 27 |
| NS-42 | NR | M | NR | NR | M | M | P | P | C | 21 |
| NS-43 | NR | M | NR | NR | M | M | NR | NR | C | 20 |
| NS-44 | NR | M | NR | NR | M | M | NR | NR | C | 20 |
| NS-45 | NR | M | NR | NR | M | M | NR | NR | M | 23 |

Totals per function over NS-01 to NS-45 (cards where a function split the card count once, at the worst part):

| Function | C | P | M | n/a | NR | no row |
|---|---|---|---|---|---|---|
| support | 23 | 12 | 2 | 0 | 8 | 0 |
| marketing | 27 | 13 | 5 | 0 | 0 | 0 |
| operations | 22 | 15 | 0 | 0 | 8 | 0 |
| finance | 24 | 11 | 1 | 4 | 5 | 0 |
| data | 13 | 20 | 4 | 8 | 0 | 0 |
| privacy | 29 | 12 | 4 | 0 | 0 | 0 |
| legal | 26 | 15 | 1 | 0 | 3 | 0 |
| compliance | 28 | 14 | 0 | 0 | 3 | 0 |
| security and risk | 36 | 8 | 1 | 0 | 0 | 0 |

Cards where at least one function says M (missing):

- NS-12: finance
- NS-16: support
- NS-25: support, legal
- NS-41: marketing
- NS-42: marketing, data, privacy
- NS-43: marketing, data, privacy
- NS-44: marketing, data, privacy
- NS-45: marketing, data, privacy, security

Pack-wide verdict rows that name no card:

- marketing, "Pack-wide: Apple rating prompt (F13-REQ-020)": missing. No card owns when the rating request may and may not appear (FR-MKT-23)
- data, "Frame North Star": Missing. "Families with a letter in the last 7 days, testers by hand" has no fixed question in any card or in the frame (FR-DAT-21, C-04)

### 2b. FRs that touch each card

Union of: the Links column (no mark), the requirement text (`~t`), and the FR rows named in that function's own verdict row for the card (`~v`). FRs whose Links column names only the frame or "every card" are in 2d, not repeated here.

| Card | FR ids |
|---|---|
| NS-01 | SUP-04~t~v; SUP-11; SUP-21; MKT-01~t; MKT-11; MKT-12; MKT-17~t; OPS-01; OPS-05; OPS-17; OPS-18~t~v; OPS-22~v; OPS-23; OPS-27~t~v; OPS-28~t~v; OPS-31; FIN-06; DAT-07~t; DAT-10; DAT-11; DAT-13; DAT-21~t; DAT-31~t; PRV-06~v; PRV-07; PRV-16; PRV-18; PRV-30; PRV-34; LEG-01; LEG-02; LEG-14; LEG-18~t; CMP-01~t; CMP-03; CMP-04; CMP-06~t; CMP-08; CMP-12~t; CMP-20~t; SEC-01; SEC-22; SEC-14; SEC-18 |
| NS-02 | SUP-04~t~v; SUP-11; MKT-01~t; MKT-07; MKT-11; MKT-13; MKT-17~t; OPS-01; OPS-02; OPS-05; OPS-17; OPS-18~t; OPS-22~v; OPS-23~v; OPS-31; DAT-06~t; DAT-21~t; DAT-27; DAT-30; PRV-10~v; PRV-13; PRV-14~v; LEG-02; CMP-03~v; SEC-01; SEC-03; SEC-18 |
| NS-03 | SUP-16; POL-03; POL-13; MKT-25; FIN-13; DAT-08~t; DAT-10~t; LEG-11 |
| NS-04 | OPS-27; FIN-06; PRV-17 |
| NS-05 | SUP-04~t; SUP-07; POL-03; POL-08; POL-09; MKT-01~t; MKT-11; MKT-14; MKT-17; MKT-19; OPS-01~v; OPS-18~t; OPS-23~v; OPS-26; DAT-06~t; DAT-27; PRV-13~v; PRV-34; LEG-05; LEG-18~t; CMP-01~t; CMP-05; CMP-06~t; CMP-07~t; CMP-12~t; CMP-19; SEC-17 |
| NS-06 | SUP-04~t; SUP-07~t~v; SUP-11; MKT-01~t; MKT-11; MKT-13; MKT-17~t; OPS-05; OPS-06; OPS-07; OPS-08; OPS-18~t; OPS-23~v; OPS-24; OPS-26; OPS-27; OPS-28~t; FIN-02~t; FIN-06; FIN-19; DAT-12; DAT-27; PRV-10~v; PRV-16; PRV-17; PRV-18~v; LEG-02; LEG-06; LEG-07; LEG-08; LEG-18~t; CMP-02; CMP-03~v; CMP-07~t; CMP-08; CMP-12~t; SEC-21; SEC-14; SEC-18; SEC-20; RSK-03 |
| NS-07 | SUP-20~v; MKT-01~t; OPS-26; OPS-34; FIN-24; DAT-01; DAT-09; DAT-17; DAT-20; PRV-17~v; PRV-29; PRV-34; LEG-12; LEG-13~v; CMP-05; SEC-06~v; SEC-08 |
| NS-08 | SUP-05; SUP-07~v; SUP-21; MKT-06; MKT-29; OPS-01; OPS-03; OPS-12; OPS-15; OPS-16; OPS-18~t; OPS-20; OPS-23; OPS-24~t; FIN-01; FIN-02~t; FIN-03; FIN-04; FIN-05; DAT-14; PRV-06~v; PRV-08; PRV-09~v; PRV-30~t~v; LEG-09; LEG-16; CMP-03~v; CMP-05; CMP-12~t |
| NS-09 | SUP-04~t; SUP-08; MKT-01~t; OPS-01; OPS-18~t~v; DAT-09~t~v; DAT-17; LEG-17 |
| NS-10 | SUP-02~v; SUP-04~t; SUP-07; SUP-13; SUP-21; MKT-01~t; OPS-07~v; OPS-14~v; OPS-21; FIN-03; FIN-11; FIN-19; DAT-08; DAT-14; PRV-14~v; PRV-20; LEG-04; LEG-09; CMP-17; CMP-18; SEC-05 |
| NS-11 | SUP-04~t; SUP-07; SUP-20~v; MKT-01~t; OPS-18~t; DAT-13; DAT-25; DAT-27; PRV-14~v; SEC-03; SEC-06~v; SEC-08 |
| NS-12 | SUP-04~t; SUP-07~t~v; OPS-05; OPS-06; OPS-07; OPS-24~t; FIN-02~t; FIN-04; PRV-21; LEG-08; LEG-17; SEC-20 |
| NS-13 | SUP-04~t~v; MKT-01~t; MKT-20; OPS-01~v; OPS-18~t; OPS-26; FIN-09; DAT-32; SEC-03 |
| NS-14 | SUP-04~t~v; OPS-18~t; DAT-08; DAT-09~t; CMP-03~t |
| NS-15 | SUP-04~v |
| NS-16 | POL-08; OPS-04; OPS-05; OPS-06; OPS-07; OPS-17; DAT-27; PRV-14~v; PRV-22; PRV-30~t; LEG-08; LEG-15; LEG-18~t; CMP-12~t; CMP-14; SEC-18 |
| NS-17 | SUP-04~v; MKT-11; MKT-26; MKT-28; OPS-24~t~v; OPS-25~v; FIN-02~t; FIN-08; FIN-20; DAT-23; DAT-27; PRV-19; LEG-13; CMP-02 |
| NS-18 | SUP-04~t~v; MKT-20; OPS-17; DAT-27; PRV-14~v; LEG-08; SEC-18 |
| NS-19 | SUP-04~v |
| NS-20 | SUP-04~t~v |
| NS-21 | SUP-04~t; SUP-07; OPS-18~t; OPS-22~v; PRV-16; CMP-08 |
| NS-22 | OPS-18~t; OPS-22~v |
| NS-23 | SUP-04~t~v; SUP-16; OPS-18~t; OPS-22~v; OPS-26; DAT-09~t; PRV-14~v; SEC-22 |
| NS-24 | SUP-04~v; MKT-01~t; MKT-03; OPS-18~t; OPS-22~v; DAT-25 |
| NS-25 | SUP-04; SUP-07~v; POL-03; POL-04; POL-05; POL-09; MKT-01~t; MKT-05; MKT-17; MKT-26; OPS-01; OPS-04; OPS-05; OPS-06; OPS-10; OPS-18~t; OPS-21; FIN-02~t; FIN-19; PRV-13; PRV-30~t~v; PRV-32; LEG-03; LEG-09; LEG-10; LEG-18~t; CMP-01~t; CMP-03~t~v; CMP-07~t; CMP-12~t; CMP-13; CMP-19; SEC-01; SEC-09; SEC-10; SEC-23; SEC-20; RSK-04 |
| NS-26 | SUP-09~v; POL-03~v; FIN-02~t; PRV-30~t; CMP-05; SEC-17 |
| NS-27 | SUP-09~v; POL-03 |
| NS-28 | SUP-09~v; POL-03; MKT-17; FIN-02~t; CMP-05; SEC-17 |
| NS-29 | SUP-09~v; POL-03~v |
| NS-30 | SUP-09~v; POL-03~v; FIN-24; LEG-12 |
| NS-31 | SUP-09~v; POL-03 |
| NS-32 | SUP-04~t~v; MKT-01~t; MKT-20; FIN-09; DAT-09~t; SEC-21 |
| NS-33 | SUP-22; MKT-18; OPS-30~t~v; DAT-08; DAT-24; DAT-27; CMP-06; CMP-07; CMP-08~v; CMP-10 |
| NS-34 | OPS-27; OPS-28; OPS-30~t~v; OPS-31; FIN-19; DAT-15; DAT-16 |
| NS-35 | SUP-08; MKT-21; OPS-30~v; DAT-17; CMP-03 |
| NS-36 | SUP-08; SUP-15; MKT-01~t; OPS-07; OPS-24~v; DAT-09~t; DAT-13; DAT-17; PRV-06; PRV-34; LEG-08; SEC-06 |
| NS-37 | OPS-30~v; DAT-15; PRV-34 |
| NS-38 | SUP-02~v; SUP-17~v; SUP-18; MKT-05~v; MKT-06~v; MKT-08; MKT-09~v; MKT-11~v; MKT-15~v; MKT-21; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36~v; FIN-10; PRV-30~v; LEG-04; CMP-06~v; CMP-09; CMP-19~v; SEC-26~v |
| NS-39 | SUP-02~v; SUP-17~v; SUP-18; MKT-21; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36~v; DAT-33; PRV-24; CMP-09; SEC-07~v; SEC-25 |
| NS-40 | SUP-02~v; SUP-17~v; SUP-18; MKT-21; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36; DAT-33~t; DAT-35; PRV-24; PRV-25~v; PRV-26; CMP-09; CMP-15 |
| NS-41 | SUP-02~v; SUP-17~v; SUP-18; MKT-09~v; MKT-21; MKT-22~v; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36~v; DAT-33~t; DAT-35; PRV-05; PRV-14~v; PRV-24; PRV-27~v; PRV-35; LEG-04; CMP-09; CMP-13~v; SEC-01; SEC-02~v; SEC-05; SEC-11; SEC-24 |
| NS-42 | SUP-02~v; SUP-17~v; SUP-18; MKT-09~v; MKT-21; MKT-22~v; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36~v; DAT-33~t~v; DAT-34~v; PRV-02; PRV-04; PRV-32~v; LEG-09; LEG-20; CMP-07~v; CMP-09 |
| NS-43 | SUP-02~v; SUP-17~v; SUP-18; MKT-09~v; MKT-21; MKT-22~v; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36~v; DAT-33~t~v; DAT-34~v; PRV-24; PRV-28~v; LEG-02~v; CMP-09; CMP-17~v; SEC-25 |
| NS-44 | SUP-02~v; SUP-17~v; SUP-18; MKT-09~v; MKT-21; MKT-22~v; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36~v; DAT-33~t~v; DAT-34~v; PRV-10~v; PRV-16~v; PRV-24~v; LEG-02~v; CMP-09; CMP-17~v |
| NS-45 | SUP-02~v; SUP-17~v; SUP-18; MKT-09; MKT-21; MKT-22~v; MKT-33; OPS-10; OPS-11~v; OPS-25; OPS-33~v; OPS-36~v; DAT-33~v; DAT-34~t~v; PRV-14~v; PRV-15~v; PRV-18~v; LEG-02~v; CMP-09; CMP-17~v; SEC-06; SEC-07~v; SEC-12 |

### 2c. Cards a function split into parts

- marketing, NS-06: A = P; B = P; C = P
- marketing, NS-07: C5 = C; C28 = C; G11 = C
- finance, NS-06: A = C; B = P; C = C
- finance, NS-07: C5 = C; C28 = P
- data, NS-06: A = P; B = P; C = P
- data, NS-07: C5 = C; C28 = P; G11 = C
- privacy, NS-06: A = P; B = C; C = C
- legal, NS-06: A = P; B = P; C = C
- legal, NS-07: C5 = C; C28 = P; G11 = C
- compliance, NS-06: A = C; B = P; C = P
- compliance, NS-07: C5 = C; C28 = C
- security, NS-06: A = C; B = P; C = P
- security, NS-07: C5 = C; C28 = P

### 2d. FRs that name the frame or every card and no single card

33 FRs: SUP-01, MKT-01, MKT-04, MKT-10, MKT-15, MKT-16, MKT-24, MKT-31, MKT-34, OPS-11, OPS-18, OPS-22, OPS-33, FIN-02, FIN-14, FIN-15, FIN-17, FIN-21, DAT-02, DAT-03, DAT-04, DAT-05, DAT-06, DAT-07, DAT-18, DAT-19, DAT-21, DAT-22, LEG-18, CMP-01, CMP-12, CMP-20, SEC-19.

## 3. Needs a ruling: proposed card changes, deduplicated, and conflicts between functions

Karma rules each in `GAP-LOG.md` like a design gap (ruling kinds CARD, DEFAULT, FOUNDER, ENG, NONE). Counts: 122 proposed card changes in the nine files (support 16, marketing 12, operations 13, finance 10, data 15, privacy 23, legal 15, compliance 10, security and risk 8); after merging overlapping ones there are 87 rulings to make (R-001 to R-087), of which 24 merge two or more proposals.

Cards NS-43 to NS-45 are on disk now, so proposals marked "(when written)" in the function files should be applied to the written rows, not to a future card.

### 3a. Conflicts between functions (both positions shown, one recommended)

**K1. Class of the child's name, birthday, due date, letter languages and first letter (privacy: L4; compliance input: L3 or L2)**

- privacy: PRV C21 (R-083) on NS-43 (when written) and the compliance input section 3: Classes: the child's name or nickname, birthday, due date and letter languages are L4, not L3 or L2; the signature stays L3. This is a `privacy` classification ruling (my charter) Why: `DATA_CLASSIFICATION.md` rules 6 and 7 and section 4.5 (`children.name`, `birthday`, `due_date`, `language.spoken` are L4)
- privacy: PRV C22 (R-084) on NS-44 (when written) and the compliance input section 3 row 18: The first letter's words and recording are L4 content, not "L3, sensitive" Why: `DATA_CLASSIFICATION.md` level table: letter text and audio are L4
- privacy: FR-PRV-24 (privacy, P0 (b)): Given first run in a store build (E-S01 to E-S08), Then it collects only: the age answer as a boolean on the phone; the local agreement record (phone, uploaded unchanged at first sign-in, deleted by Erase everything); the Apple account identifier and the email Apple shares, or the email the parent types, verified by Apple or by the emailed link or code; a name only if Apple shares one; PRIV-R21 rows; the child's name (optional); a birthday or due date (required); what the child calls the parent. Never a phone number, password, the parent's birth date, age or age range, the child's surname or gender, a location or contacts. A field-inventory test over E-S02 to E-S08 fails on a new input without an inventory row. Classes: the child's name or nickname, birthday, due date and letter languages are L4 (rules 6 and 7; section 4.5); the email, Apple id, Apple name and signature L3; codes, tokens and the Apple refresh token L4
- compliance input (the compliance function file indexes it and does not restate the classes): `inputs/first-run-compliance.md` row 13, "Child name or nickname": class L3.
- compliance input: `inputs/first-run-compliance.md` row 14, "Birthday or due date": class L3; a due date shows a pregnancy (health-adjacent, K-25, Q32).
- compliance input: `inputs/first-run-compliance.md` row 16, "Letter languages": class L2.
- compliance input: `inputs/first-run-compliance.md` row 18, "First letter (words, recording)": class L3, sensitive (Privacy 9).
- Recommendation: Privacy. `DATA_CLASSIFICATION.md` lists `name`, `birthday`, `due_date`, `nickname` as L4 (line 627), `due_date` as L4 consumer health data (line 185) and `language.spoken` as L4 (line 703), which I read this session. The class of a field is the privacy lead's ruling (charter), so NS-43 and NS-44 carry L4 and the compliance input table is corrected in the same PR; the signature stays L3 as both agree. Counsel must confirm nothing here; it is the repository's own classification.
- Related: PRV C21, PRV C22

**K2. The Home Plus line wording (design change versus the marketing and Terms 8.2 rule)**

- design, `docs/design/e2e/E-foundations-and-system-states/WORDS.md` line 342 (read this session): Built line: "Adding new letters to the book needs Plus. Recording, reading and export are always free." CHANGE proposed by design: "Adding new letters to the book needs Plus. Recording, reading and export stay free." (reason: "always free" is an open-ended promise; "stay free" matches the pinned membership line).
- finance: Endorses the design change from "always free" to "stay free" (finance section 4, E-S26; BL-965 carries `plusLine` "stay free"; finance question Q40 default "stay free", never "always free").
- marketing: FR-MKT-04 (marketing, P1 (a)): Given a public line about what stays free (reading, playing recordings, export), Then it uses the Terms 8.2 permanent list in substance, speaks of letters a family kept, and says nothing about the future of any other capability (ruling T2). Lines to check: `pages.en.ts:80` "/about What it costs"; `apps/web/src/lib/support/copy.ts` "Reading, listening and your copy stay free" ("listening" must mean playing a kept letter's recording, not Read together); `site.ts` s10 `promise` says "made" where D-082 says "kept"
- marketing: FR-MKT-22 (marketing, P0 (b)): Given the Keep gate (E-S10) and the Home Plus line (E-S26), Then neither shows a testimonial, rating, review count, "most popular", discount, countdown, comparison or price; the Plus line is one static string (no rotation, no A/B copy); offer codes are redeemed only through Apple's Redeem a code; no rating prompt is requested in a session in which the gate sheet was shown
- design, WORDS line 264 (the pinned membership line): "Your first two letters are free. After that, Plus keeps the book growing. Reading, listening and your copy stay free."
- Recommendation: Marketing does not comment on the plusLine words; the conflict is between the design's changed line and marketing FR-MKT-04 (public lines about what stays free follow the Terms 8.2 permanent list in substance: reading kept letters, playing their recordings, export, and say nothing about the future of other capability). "Recording" is not on that list, and the pinned membership line already says "Reading, listening and your copy stay free". Recommend one string for both places: drop "Recording" and use the pinned membership wording ("Reading, listening and your copy stay free"), keep "stay", never "always". The founder approves the words; counsel Q40 stays open for the Read together line.
- Related: MKT C01, MKT C07; question MKT MQ-1

**K3. First-time downloads before the allowance rule may fire (500 or 1,000)**

- data (the only function file that takes a position): DAT FQ-02: "Minimum first-time downloads before the allowance rule fires: 500 (D-125) or 1,000 (F14 6.9)?" Default: 500, the later ruling, with the 95% interval printed beside the point. At 500 the interval around 4% runs 2.3% to 5.7%, so a read near the line is close to a coin toss; the founder sees that before acting Owner: founder
- data: DAT C-11 (R-086) on F14 6.9 vs D-125 item 3: One minimum: F14 says "at least 1,000 first-time downloads"; D-125 says 500. Default: 500 (the later ruling) with the interval reported (FQ-02) Why: Two numbers on record
- Recommendation: Not a conflict between two functions: the two numbers are two records (F14 6.9 says 1,000, D-125 item 3 says 500), and no other function file mentions the minimum (searched). Recommend 500 with the 95% interval printed beside the point, as data proposes, because D-125 is the later ruling; the founder confirms.
- Related: DAT C-11

**K4. What the deletion texts say (legal versus the card row versus privacy)**

- card, NS-01-R31 (read in `01-photo-with-a-letter.md`): Given photos on in any build, the account-deletion text (`packages/content/src/pages.en.ts:240`) no longer says pictures are removed from places the server cannot reach, and says pictures on a phone go when that phone is erased. P0 (b); one content test.
- legal: LEG C-3 (R-018) on NS-01-R31: Extend from `pages.en.ts:240` to Privacy 7 and `delete-account-page.md`, and add the build-truth clause (no status report or analytics lines while off) Why: The legal texts make the same promise as the in-app page (FR-LEG-02)
- legal: FR-LEG-02 (legal, P0 (b)): Given any build, When the deletion texts are read (in-app delete sheet C-S20, `pages.en.ts:236-244`, `delete-account-page.md`, Privacy 7), Then each says: (a) with photos on, pictures and the Find index live only on the phone, account deletion cannot reach them, and Erase everything or deleting the app removes them; (b) with seals on, letters hidden until a day are deleted with the account (D6); (c) only systems the build uses are named: no "status of your Plus plan that the app reported to us" while the status report is off, and no analytics provider while analytics is off. A content test fails on (c) for the build's flags.
- privacy: FR-PRV-18 (privacy, P0 (b)): Given C-S20 "What happens", Then it states, in plain lines or a link to Privacy section 10: the 30-day change of mind; the 31, 38 and 45-day clock; the sent-email copy kept to about day 60; the kept-author book entry (child's name, birth date, due date) while a former member's letters remain (D-116); that pictures and recordings stay on each phone until that phone is erased (NS-01-R31); that saved copies and iPhone backups are the parent's own and are not reached; that letters hidden until a day are deleted and never open (D6); that consent records are kept 3 years without the person's id; and that Plus billing continues through Apple until cancelled
- support: FR-SUP-14 (support, P0 (b)): Given a deletion request, Then the help centre and M3 point first to Me, Delete account (C-S20; Guideline 5.1.1(v)) and to the web page `brand.web.deleteAccount`, say the 30 days to change your mind (Terms 10.1), and say that the Apple plan is cancelled separately. By email, Route 1 stays closed until BL-551 and the reply promises no date
- operations: OPS Q7: "Can a restore on Free be promised not to bring back deleted items?" Default: No promise; the privacy text must not say deletions survive a disaster restore on Free (`free-tier-ops.md`) Owner: counsel Q51 (retention and deletion exceptions); counsel must confirm
- privacy: PRV PQ-10: "Is the restore-window limit (up to 24 hours of deletions can return after losing the project on the Free plan) something the policy must say?" Default: Say it in the incident notice, not in the policy; prove the replay (FR-PRV-09) so the window shrinks to zero where the ledger survives Owner: Counsel Q51
- Recommendation: Take legal's scope (all four texts: the C-S20 sheet, `pages.en.ts:236-244`, `delete-account-page.md`, Privacy 7) because one promise cannot be true in the app and false on the web; take privacy FR-PRV-18 as the content of the C-S20 sheet (it lists what is kept); take the support FR-SUP-14 pointer; and on restores take ops and privacy together: the policy does not say deletions survive a disaster restore on Free, and the 24-hour window goes in the incident notice. Put all lines in one `packages/content` key family so the four places cannot drift, with the NS-01-R31 test extended as legal asks. Counsel must confirm the retention sentences.
- Related: LEG C-3, PRV C23

**K5. The Texas and California age signal: store nothing (compliance) versus record an enum (privacy)**

- compliance: FR-CMP-15 (compliance, P0 (b)): Given an install where the platform offers the age-range signal, When the app launches, Then it requests the signal before the 18+ question, treats a minor signal as the gate's No (stop, nothing reachable, nothing stored beyond the existing `ageGate.stoppedAt`), stores and sends no age range anywhere, and treats no signal (older iOS, declined, error) as today's gate. Until the module ships, every store candidate's gate record carries the founder's dated risk acceptance for Texas (compliance input G1). Installs from before 1 Jan 2027 follow counsel's answer to Q46.
- compliance: CMP C-2: "Installs made before 1 Jan 2027: must the app ask the platform for an age signal for existing users, and by when? May a signal be kept with the Terms acceptance as evidence?" Default: Request at every launch on iOS 26+ from 1 Jan 2027; keep nothing Owner: counsel Q46
- compliance: CMP C-3: "Texas SB 2420: which developer duties apply to an 18+ app with an 18+ rating while the stay holds?" Default: Honour the store's age category signal as in FR-CMP-15; rating 18+ Owner: counsel Q46 (with CR-004)
- privacy: FR-PRV-25 (privacy, P0 (b)): Given the age step, Then only `ageGate.passed` (after Yes) or `ageGate.stoppedAt` (after No) is kept, on the phone; a store age signal, when one is read, is used in memory and recorded only as the `age_signal` enum in the Terms record's context; never a date, age or range on the phone or server
- support: SUP Q-SUP-13: "Keep "I answered by mistake" on the age stop in store builds?" Default: Keep it (LEGAL-REQ-002 neutrality). Support never acts on an age answer it cannot see Owner: counsel, Q46 (area E CG14)
- Recommendation: Compliance. FR-CMP-15 says the app "stores and sends no age range anywhere" and keeps nothing beyond `ageGate.stoppedAt`, and the question to counsel (C-2) defaults to "keep nothing". FR-PRV-25 would record an `age_signal` enum in the Terms record. Recommend no record until counsel Q46 says evidence of the signal is needed; privacy removes the enum from FR-PRV-25 and keeps it as a conditional row. Also needed: the founder's dated risk acceptance for Texas on every store candidate (FR-CMP-15) and the module before 1 Jan 2027. Counsel must confirm the statutes (secondary sources only in the compliance file).
- Related: FR-CMP-15, FR-PRV-25, Q46

**K6. Is the age-rating questionnaire re-answered for NS-05 Level 1 (compliance: yes; marketing: no change)**

- compliance: FR-CMP-19 (compliance, P0 (b)): Given NS-05 or NS-25 is on in a candidate, Then the App Store Connect age-rating questionnaire is answered again (User-Generated Content, Messaging, Social Media) and the answers saved in the gate record; the 18+ override and "Made for Kids: No" stay.
- compliance: CMP K-5 (R-025) on NS-05 section 17 and NS-25 section 17: Add the age-rating re-answer as a gate (FR-CMP-19) Why: ASC says "letters are never distributed"
- marketing: FR-MKT-17 (marketing, P1 (b)): Given a release that ships NS-25 (two parents in one book), NS-05 Level 2 or 3, or NS-28, Then the age rating questionnaire (User-Generated Content, Messaging and Chat) is re-answered and recorded in `docs/store/app-store-connect-1.0.md` before submission; NS-01, NS-02, NS-05 Level 1 and NS-06 are proposed as no change, because nothing is distributed inside the app (Share leaves through the parent's own share sheet)
- marketing: MKT MQ-8: "Age rating at NS-25: does two parents reading one book change User-Generated Content or Messaging answers?" Default: No change for NS-01 to NS-06; re-answer at NS-25 with counsel's view Owner: Counsel: needs a number from legal
- support: SUP Q-SUP-7: "Is the two-parent book "user-generated content" under Guideline 1.2?" Default: Treat it as not, while it stays capped at two parents who invite each other. Treat anything hosted for a third person as 1.2 Owner: counsel and the founder (needs a number from legal)
- Recommendation: Compliance, as a cheap re-read: the recorded answer says user-generated content is "No (letters are never distributed)", and a share goes through the parent's own share sheet; at Level 1 the answer is expected not to change, but the gate asks for the re-answer to be saved in the gate record (P0 (b)) rather than assumed (marketing P1 (b)). Counsel must confirm; rating values are unverified in both files.
- Related: MKT C08, CMP K-5

**K7. Names of the store-build gates (G0 to G6 used for two different lists)**

- operations: OPS C12 (R-013) on `14-test-plan.md` section 6: Rename the store-build gates (for example SG0 to SG6) or point to `RELEASE.md` 1.3: both files use G0 to G5 for different things today Why: Two "G4"s in one release checklist will be misread
- compliance: CMP K-3 (R-013) on `14-test-plan.md` section 6: Add the evidence column of section 3c and the gate record path; add to G5: Notes for Review versus flags, age-rating answers, accessibility labels Why: Gates are defined, their proof is not
- compliance: FR-CMP-11 (compliance, P0 (b)): Given a store candidate, Then one gate record `docs/legal/evidence/store/<version>-<build>/gates.md` exists with the evidence of section 3c for G0 to G6, each line naming the file, commit or console screenshot that proves it, and the founder's dated sign-off; a candidate with a missing line is not submitted.
- Recommendation: Operations' point stands: `RELEASE.md` 1.3 and `14-test-plan.md` section 6 both use G0 to G5 for different things, and compliance builds a generator on G0 to G6. Rename one set before the generator is written. Recommend prefixing the test-plan gates as store-build gates SG0 to SG6 (operations' example) and keeping `RELEASE.md` names; Karma rules and `qa` edits `14`.
- Related: OPS C12, CMP K-3

**K8. Thresholds for moving to paid vendor tiers (finance versus operations)**

- finance: FIN F1: "When does production move to Supabase Pro ($25 a month, $300 a year)?" Default: Stay on Free (D-159) (recommendation: At 60% of any Free limit on the weekly check, or before any backup flip. Keep the spend cap on) Owner: founder
- operations: OPS Q1: "When a Free quota passes 80%, move to Pro for that month?" Default: Yes, same week, because after the first grace period Supabase gives no second one (billing FAQ, 20 Nov). Pro's price was not read this session: read it on the day Owner: founder
- finance: FIN F7: "Resend Pro" Default: Stay on Free (recommendation: Upgrade before a public launch day if 100 a day could be reached) Owner: founder
- operations: OPS Q2: "Resend at public launch" Default: Stay on Free until expected email sign-ins pass 50 a day (half the 100-a-day cap), then a paid tier; paid prices not read this session Owner: founder
- finance: FIN F6: "EAS Starter" Default: Stay on Free (D-092) (recommendation: Batch native changes; upgrade only for a month that needs it) Owner: founder
- operations: OPS Q3: "EAS Starter in a heavy month" Default: Yes for any month past 12 planned builds (D-092 already allows it) Owner: founder
- Recommendation: Not a contradiction once ordered: finance's 60% is when the founder is asked, operations' 80% is when the move is made that week (finance's own engineering row for FR-FIN-03 says alert at 80%, founder question at 60%). Recommend one rule in the run-cost register: ask at 60% of any Free limit, move to Pro the same week at 80%. For Resend take operations' sign-in trigger (50 a day, half the 100-a-day cap) because it is measurable. EAS: both agree on Starter only for a month that needs it. Paid prices are unverified in both files; the founder confirms.
- Related: FIN C01, OPS C13

**K9. Screen ids proposed by functions that collide with the e2e design**

- support (section 4): Proposes new screens E-S27 and E-S28 for "If you are struggling" and "Lines in other countries" (support says no e2e area gave them ids).
- design, E `DESIGN.md` section 5: E-S27 is "App Store page and install" and E-S28 is "Permission asks map" in the design read this session (highest E screen id is E-S29), so both ids are taken.
- privacy: Proposes C-S23 for "Privacy in Me" and C-S23.withdraw. Highest C screen id in the design is C-S22, so C-S23 is free.
- operations: Proposes E-ST47 for "Server restored". Highest E state id in the design is E-ST46, so it is free.
- Recommendation: Support takes new ids from the free range of area E (E-S30 and E-S31 proposed) or lets area E number them; keep C-S23 and E-ST47 as proposed. The area leads decide; this file does not allocate ids.

**K10. Country count at sign-up: weekly aggregate (data) versus daily count kept 2 years (privacy)**

- data: FR-DAT-35 (data, P0 (b)): Server-side counts named by cards (NS-40 refusals by country code, NS-41 sign-in success per method) are read only as weekly aggregates through a named runbook that writes an audit row; no person row, email, address or user id leaves the query. Each count is published as 0 or at least 10, with the complement rule, and a country with fewer than 10 refusals joins "other". The NS-40 count never carries, or is derived from, an age answer (TRACKING_PLAN: "An under-18 answer is never sent"). Each count gets a level, a retention clock and a deletion path in `DATA_CLASSIFICATION.md` in the same PR that builds it
- privacy: FR-PRV-26 (privacy, P0 (b)): Given the D-131 country check at account creation, When it runs, Then the IP address is used in memory and dropped; only a daily count by check, outcome and jurisdiction code (refusals only) is kept for 2 years (D-136); the refusal shows one line and asks nothing; the label stays unchanged unless counsel answers Q57(f) otherwise. And the IP addresses and emails Supabase Auth keeps in its own audit log have their retention read for the production plan and written in data-policy 4.2, so no sentence says "we do not keep your IP address" without naming that vendor log
- data: DAT FQ-09: "Founder and counsel: may the NS-40 refusal counts by country and the NS-41 sign-in counts be computed in the 1.0 line?" Default: Needs a number from legal for the country count. Default: yes for NS-41 as an aggregate under a runbook (it serves a reliability target); NS-40 only with the FR-DAT-35 limits and a privacy read first Owner: counsel
- privacy: PRV PQ-7: "Is a country derived in memory at sign-up and never kept "collected" for the label?" Default: Not collected; label unchanged (CPrivO-2) Owner: Counsel Q57(f)
- Recommendation: Compatible but not the same: privacy keeps a daily count by check, outcome and jurisdiction code for 2 years (D-136) and nothing else; data reads it as a weekly aggregate with a 10-person floor and "other". Recommend privacy's storage rule as the source and data's reading rule on top, and the NS-40 count stays off until the privacy read data asks for is on record (data's own default).
- Related: DAT C-13

### 3b. Proposed card changes, merged (one ruling each)

Ordered frame first, then the test plan and README, then cards by number. "Handles" are `<function code> <id in that file>`; `Overlap` says whether merged proposals add to each other (complementary) or differ and need one answer (differs). FRs cited by the proposals are listed so a ruling can be traced back to section 1.

**R-001** (compliance). Target: Frame section 5 (T4)

- Change: Add: "T4 is confirmed against WCAG 2.2.1 by an accessibility reviewer, or each timed undo has an untimed path"
- Why: 2.2.1's options are turn off, adjust, or extend with a warning [S6]
- Handle: CMP K-2 (`functions/compliance.md`). FRs: none cited

**R-002** (data). Target: Frame section 3 table

- Change: Add the North Star questions Q-NS-1 and Q-NS-2 and Q-FID-1. Change "Letters made, and letters kept, per family per week" source to "Q-NS-2 bucket for made; manifest `counts.entries` read twice a week apart for kept, which includes the other parent's letters"
- Why: No card holds a North Star question; the manifest has no made count (waiting letters are not counted)
- Handle: DAT C-04 (`functions/data-and-measurement.md`). FRs: none cited

**R-003** (data). Target: Frame section 3; `03-goals` 4.2 and 4.3; `pack-pdf/03-measure.md`

- Change: Mark reminders 12%, mute 10%, revert rate under 5%, retention and field activation "not measurable in 1.0"
- Why: Frame's own rule; NS-13 already says so
- Handle: DAT C-05 (`functions/data-and-measurement.md`). FRs: none cited

**R-004** (data). Target: Frame section 3

- Change: "Each tester round asks at most 5 questions" applies to tester rounds; studies with their own consent (NS-03) set their own scripts
- Why: NS-03 Script B has 6 questions
- Handle: DAT C-09 (`functions/data-and-measurement.md`). FRs: none cited

**R-005** Frame section 8 run-cost table and vendor reads. Overlap: complementary. Proposed by 2 files: operations, finance

- FIN C01 on `00` section 8, run-cost table: Replace with section 3.1's lines and read dates (V1 to V5, V10); add the database line (words, held drafts, versions) as the first Free limit; replace "the limit is not stated here" for Resend with 3,000 a month and 100 a day; EAS Starter includes $45 of build credit Why: CFO ruling in `00` asks for read dates and units; the 500 MB database binds before storage
- OPS C13 on `00-product-frame.md` section 8: EAS row: re-read 20 Nov (15 iOS builds; Starter $19 plus usage; Free one macOS build at a time). Email row: Resend Free is 3,000 a month and 100 a day (read 20 Nov), shared by sign-in codes and deletion receipts Why: The frame asks for dated reads
- FRs: none cited
- Conflict: see K8 in 3a

**R-006** (finance). Target: `00` section 8, "Cards that add zero server cost"

- Change: Add the list of cards that do add it: NS-06 B, NS-08, NS-12, NS-17, NS-25, NS-26, NS-28, each pointing to FR-FIN-02
- Why: T2 makes their cost permanent once on
- Handle: FIN C02 (`functions/finance.md`). FRs: FIN-02

**R-007** (legal). Target: `00-product-frame.md` section 4 and README ground rules

- Change: "D-161 as drafted in #827" becomes "D-161 (DECISIONS.md, decided 11 Nov 2026)"; D-160's "coming soon" half is superseded
- Why: D-161 and D-162 are on `develop` (`docs/DECISIONS.md:668-669`) [F]
- Handle: LEG C-14 (`functions/legal.md`). FRs: none cited

**R-008** Claims scope: every public surface (help articles, macros, welcome email, /support, keywords) is read by the claims check. Overlap: complementary. Proposed by 2 files: support, marketing

- MKT C01 on Frame s7 (claims): Add: "Read together is free" as a claims row (T1 words only); add the website welcome email and /support to the surfaces every claims check reads Why: T1 is in the cards but the existing FAQ drift is not named; the email is a public surface that is not in any card
- MKT C05 on NS-08-R7: Name the waitlist welcome email and /support among the surfaces checked Why: The email promises recordings and letters "stay on your iPhone" today
- MKT C06 on NS-17-R4: Extend from "the store listing" to "every public surface, keywords and custom product pages" Why: `pages.en.ts` names seven languages
- MKT C07 on NS-24 s19: Name `packages/content/src/site.en.ts:109` as drift to fix under T1 Why: The line puts Read together in a "never locked away" list
- SUP C10 on NS-08 section 19 (claims): "No public surface" includes help articles and support macros Why: Macros are where a lost-phone parent hears the answer
- FRs: none cited
- Conflict: see K2 in 3a

**R-009** Frame guardrails: no marketing in notifications, slips, first run or the Keep gate; a home for the Apple rating request. Overlap: complementary. Proposed by 1 files: marketing

- MKT C02 on Frame s3 or s4: Add a guardrail: no marketing in notifications, slips, first run or the Keep gate (FR-MKT-20 to 24) Why: No card owns these moments for marketing
- MKT C03 on Frame (new section) or a card in `19`: Give F13-REQ-020 (Apple rating request) a home with FR-MKT-23's rules and a P1 row Why: No card specifies the rating moment
- FRs: MKT-20, MKT-21, MKT-22, MKT-23, MKT-24

**R-010** (security and risk). Target: `00-product-frame.md` sign-out paragraph (D1)

- Change: Add: "`[X4-R1]` keeps A's book from being seen, claimed or uploaded while another account is signed in. It does not make a signed-out book private; App lock and Erase everything do."
- Why: Prevents X4-R1 being read as a confidentiality claim (section 5)
- Handle: SEC CC-1 (`functions/risk-security.md`). FRs: none cited

**R-011** Frame section 3 measure: the support tally list. Overlap: differs. Proposed by 2 files: support, data

- SUP C13 on Frame section 3 (tally): Replace "lost, confused, billing, other" with the FR-SUP-08 list, versioned in `docs/support/` Why: The cards already add five categories the frame does not list
- DAT C-10 on Frame section 3 sources: Add the support tally list of FR-DAT-17 under the four categories Why: Card categories do not map today
- FRs: SUP-08, DAT-17

**R-012** Frame section 7 and README: add standing inputs (what support can see; inventory home; content inputs; counsel reads that gate). Overlap: complementary. Proposed by 3 files: support, privacy, legal

- SUP C14 on Frame section 7: Add "What support can see" (FR-SUP-11) as a standing input, and route the Privacy 3 line "if you ask us for help" to counsel Why: The policy permits more than support will ever do
- SUP C15 on README "How to read a card" section 16: Content inputs name the help article line and any macro the card needs Why: Keeps articles in step with cards
- PRV C17 on Frame section 7 "Inventory home": Name the sign-up rows (FR-PRV-24) and the backup copies (FR-PRV-08) as rows the inventory owes before NS-38 locks Why: Frame lists card data only
- LEG C-13 on README "Reads that gate anything": Add: counsel Q48 and Q45 for NS-16; Q53 and Q48 for NS-25; the minors question for NS-06 B (already in the card); Q45 for the NS-05 picture toggle Why: One place lists every counsel gate
- FRs: SUP-11, PRV-08, PRV-24

**R-013** 14-test-plan section 6: store-build gate names and evidence. Overlap: differs. Proposed by 2 files: operations, compliance

- OPS C12 on `14-test-plan.md` section 6: Rename the store-build gates (for example SG0 to SG6) or point to `RELEASE.md` 1.3: both files use G0 to G5 for different things today Why: Two "G4"s in one release checklist will be misread
- CMP K-3 on `14-test-plan.md` section 6: Add the evidence column of section 3c and the gate record path; add to G5: Notes for Review versus flags, age-rating answers, accessibility labels Why: Gates are defined, their proof is not
- FRs: none cited
- Conflict: see K7 in 3a

**R-014** 14-test-plan section 7: P0 rows and cross-cutting ids. Overlap: complementary. Proposed by 2 files: finance, security

- SEC CC-2 on `14-test-plan.md` section 7 cross-cutting ids: Split `[X4-R1]` into `[X4-R1a]` gate (FR-SEC-01), `[X4-R1b]` B's letters (FR-SEC-02), `[X4-R1c]` every surface (FR-SEC-03), `[X4-R1d]` release (FR-SEC-04) Why: One test hides which surface leaks
- FIN C10 on `14` section 7: Add a P0 row under J-N25: "a refunded or revoked Plus behaves as a lapse; kept letters unchanged" Why: FR-FIN-11 has no test today
- FRs: FIN-11, SEC-01, SEC-02, SEC-03, SEC-04

**R-015** (marketing). Target: BL-109

- Change: Rewrite coverage to the store-build scope (FR-MKT-26)
- Why: It still asks for co-parent pairs and Hindi and Spanish speakers
- Handle: MKT C11 (`functions/marketing.md`). FRs: MKT-26

**R-016** NS-01 gates: label file and rights record for store art. Overlap: complementary. Proposed by 2 files: marketing, compliance

- CMP K-4 on NS-01 section 17: Add: the label file's Photos note and checklist line change in the photo PR (FR-CMP-04) Why: The current checklist line fails the first photo build
- MKT C10 on NS-01 s19: Add: a rights record for every picture used in store art, kept in `docs/store/art/` Why: Licensed or illustrated images need provenance
- FRs: CMP-04

**R-017** (data). Target: NS-01 section 21

- Change: Add: testers read `manifest.json` from the copy (C-S04 shows no numbers); `counts.photos` from export 1.7.0 only. Mark `media_added` "proposed for the catalogue; not in it"
- Why: FR-DAT-13; `catalog.ts` v8 has no such event
- Handle: DAT C-03 (`functions/data-and-measurement.md`). FRs: DAT-13

**R-018** (legal). Target: NS-01-R31

- Change: Extend from `pages.en.ts:240` to Privacy 7 and `delete-account-page.md`, and add the build-truth clause (no status report or analytics lines while off)
- Why: The legal texts make the same promise as the in-app page (FR-LEG-02)
- Handle: LEG C-3 (`functions/legal.md`). FRs: LEG-02
- Conflict: see K4 in 3a

**R-019** (privacy). Target: NS-01 section 10, NS-02 section 10, NS-36-R4

- Change: Record the `privacy` confirmation: `entry_media.entry_id`, `draft_id` and `letter_search_rows.entry_id` are L3
- Why: Asked of `privacy` in each card; errata E22
- Handle: PRV C03 (`functions/privacy.md`). FRs: none cited

**R-020** (data). Target: NS-02 and NS-05 section 21

- Change: Mark `book_search_used` and `letter_share_started` "proposed for the catalogue; not in it"
- Why: `catalog.ts` v8
- Handle: DAT C-06 (`functions/data-and-measurement.md`). FRs: none cited

**R-021** (operations). Target: NS-02 section 10

- Change: Add: "`killSwitches.bookSearch` is in the binary before `EXPO_PUBLIC_BOOK_SEARCH` turns on in production; one device row sets it on staging"
- Why: A config key the binary does not know does nothing (FR-OPS-02)
- Handle: OPS C01 (`functions/operations.md`). FRs: OPS-02

**R-022** (security and risk). Target: NS-02 acceptance

- Change: Add a P0 (a) row: no query string in any log (FR-SEC-18)
- Why: TB8
- Handle: SEC CC-6 (`functions/risk-security.md`). FRs: SEC-18

**R-023** (support). Target: NS-03 stop rules 1 and 2

- Change: "Any report" names who receives it (the founder) and says that distress goes to M6 first
- Why: The pilot is the first time real families report a harm to us
- Handle: SUP C07 (`functions/support.md`). FRs: none cited

**R-024** (marketing). Target: NS-05 s18

- Change: Add: no referral, reward or "tell a friend" prompt after a share; screenshot rule of FR-MKT-14
- Why: Keeps Share a trust act; A1 5.6.3
- Handle: MKT C04 (`functions/marketing.md`). FRs: MKT-14

**R-025** Age-rating questionnaire re-answered as a gate (NS-05 and NS-25). Overlap: differs. Proposed by 2 files: marketing, compliance

- MKT C08 on NS-25 s22: Add the age rating re-answer (FR-MKT-17) and the website tab drawing (FR-MKT-05) to the gates Why: Metadata must match the build (A1 2.3)
- CMP K-5 on NS-05 section 17 and NS-25 section 17: Add the age-rating re-answer as a gate (FR-CMP-19) Why: ASC says "letters are never distributed"
- FRs: MKT-05, MKT-17, CMP-19
- Conflict: see K6 in 3a

**R-026** (operations). Target: NS-05, NS-06 A and B, NS-07 C28, NS-13, NS-23 rollback lines

- Change: Add: "rollback is a PATCH build with the flag off and an expedited review (days); two EAS builds a month are held for it"
- Why: Sets the real response time (FR-OPS-26)
- Handle: OPS C05 (`functions/operations.md`). FRs: OPS-26

**R-027** NS-05 gates (Levels 2 and 3; Terms and Privacy lines). Overlap: complementary. Proposed by 2 files: support, legal

- SUP C03 on NS-05 section 22, Levels 2 and 3: Add the Guideline 1.2 set (FR-POL-03) as a gate next to the `security-architect` and counsel reads Why: Hosted content triggers report, block and filter duties
- LEG C-10 on NS-05 section 17: Add the Terms and Privacy lines of FR-LEG-05 as a production gate Why: Sharing has no description in the legal texts
- FRs: POL-03, LEG-05

**R-028** NS-06 B17 and B18 and B20: minors, delivery and "hide from the other parent". Overlap: complementary. Proposed by 2 files: data, legal

- LEG C-4 on NS-06-B17 and B18: Add a P0 (b) row for FR-LEG-07 (no age-keyed seal choices or claims; content scan) and cite the new counsel question once numbered Why: Minors and delivery are a counsel question; the card forbids the claim but has no test
- LEG C-5 on NS-06-B12 and B17: Add the Terms and Privacy lines of FR-LEG-06 as a dependency of the production flag Why: The seal changes who sees what, a major change under POLICY_VERSIONING 2.1 item 8
- DAT C-08 on NS-06 B20: "None describe it as a way to hide from the other parent" becomes a stop line Why: FR-DAT-12
- FRs: DAT-12, LEG-06, LEG-07

**R-029** (operations). Target: NS-06 Part B

- Change: New row (proposed id NS-06-B28, P0 (a), active once any second reader exists in a store build): after a server restore, no other reader sees a sealed letter's words before the author's phone re-uploads its seal
- Why: FR-OPS-08
- Handle: OPS C07 (`functions/operations.md`). FRs: OPS-08

**R-030** NS-06 B10.1 seal-sync option (a): evidence and watermark fix. Overlap: complementary. Proposed by 2 files: operations, security

- OPS C08 on NS-06 B10.1: Option (a) evidence: "pg_cron and pg_net proven on production" is met by the purge-worker schedule's healthy check (`purge-failing.md` section 1) with a dated record Why: Makes E4's condition checkable
- SEC CC-8 on NS-06 B10.1: Apply the E3 watermark fix in the card body, not only in errata Why: TB5 correctness
- FRs: none cited

**R-031** (privacy). Target: NS-06 A17

- Change: "User Content is already declared in label 1.4.0" becomes "label 2.2.0"
- Why: The label file is 2.2.0 (10 Nov)
- Handle: PRV C01 (`functions/privacy.md`). FRs: none cited

**R-032** NS-06 A11 inventory rows and confirmations. Overlap: complementary. Proposed by 1 files: privacy

- PRV C02 on NS-06 A11: Add `held_drafts.first_mark` and `held_drafts.first_label` rows (L3, L4), synced with the held draft only Why: Errata E2 adds the columns; the inventory lacks them
- PRV C04 on NS-06 A11: Record the `privacy` confirmation: `entries.first_mark` L3 Why: Asked of `privacy` in the card
- FRs: none cited

**R-033** (security and risk). Target: NS-06 Part C acceptance

- Change: Add a P0 (a) row from FR-SEC-21
- Why: Doorways sit on the lock screen
- Handle: SEC CC-5 (`functions/risk-security.md`). FRs: SEC-21

**R-034** (finance). Target: NS-07 OQ-1

- Change: Write the proof-book amount and its read date into the card instead of "the amount in the exec record"
- Why: A spend decision must be readable where it is asked
- Handle: FIN C07 (`functions/finance.md`). FRs: none cited

**R-035** (legal). Target: NS-07 section 4.17

- Change: Replace "CLO: NEEDS EVIDENCE" with the OFL FAQ 1.12 and 1.13 reading [S5] and add the font allowlist row (FR-LEG-12)
- Why: Evidence now read; one test closes the rest
- Handle: LEG C-6 (`functions/legal.md`). FRs: LEG-12

**R-036** NS-07 G11: label guard check and where the workflow lives. Overlap: complementary. Proposed by 2 files: operations, privacy

- OPS C04 on NS-07 G11 section 10: "a CI job in `.github/workflows/`" becomes "a proposed workflow in `docs/ops/proposed/workflows/`, applied by the founder" Why: Agents cannot edit workflows (FR-OPS-34)
- PRV C16 on NS-07 G11: Add check (d) of FR-PRV-29 Why: G11 does not see donation APIs or new hosts
- FRs: OPS-34, PRV-29

**R-037** (finance). Target: NS-08 sizing arithmetic

- Change: Replace "Paid storage prices are not read in this session (UNVERIFIED)" with V1's Pro figures (read 20 Nov) and section 3.1's 1,000-family row; keep the conclusion
- Why: NS-08-R2 asks for priced paths
- Handle: FIN C03 (`functions/finance.md`). FRs: none cited

**R-038** (legal). Target: NS-08 section 12

- Change: Reconcile the record: card says surface `backup_sheet`; code sends method `backup_sheet` and surface `settings.backup`; schema allows neither method. Pick method `consent_sheet`, surface `backup_sheet` (or `settings.backup`) and add a P0 (b) row
- Why: Otherwise the backup consent act is refused at the flip (FR-LEG-09)
- Handle: LEG C-7 (`functions/legal.md`). FRs: LEG-09

**R-039** NS-08 flip gates (runbooks, weekly check as numbers, deletion replay proven, inventory rows). Overlap: complementary. Proposed by 2 files: operations, privacy

- OPS C02 on NS-08 section 2, condition (6): "A weekly egress and storage check running" reads "a weekly check that reports Storage bytes and egress as numbers (NOT CHECKED fails the job)" Why: Today's job prints NOT CHECKED for both (FR-OPS-12)
- OPS C03 on NS-08 section 10: Add the on and off runbooks as a flip gate Why: FR-OPS-16
- PRV C08 on NS-08 section 11: At the flip, the inventory rows are the seven tables of `DATA_CLASSIFICATION.md` 4.3.1 (or ADR 0024's final list) plus the bucket and the consent row, not two Why: The flip collects device ids, key wraps and logs too
- PRV C09 on NS-08 section 22: Add a gate: the Free plan's Storage is not in the nightly dump, so the deletion replay after a restore (FR-PRV-09) is proven before the flip Why: `free-tier-ops.md:76-79`
- FRs: OPS-12, OPS-16, PRV-09

**R-040** (finance). Target: NS-10 section 8

- Change: Add: a full pull is about 12 MB per account [A] and counts against Free egress (FR-FIN-03)
- Why: Restores share the 5 GB
- Handle: FIN C09 (`functions/finance.md`). FRs: FIN-03

**R-041** NS-10 store-build gates (Terms 3.1 and Privacy "Which builds"; delete account visible; no terms needed to delete). Overlap: complementary. Proposed by 2 files: legal, compliance

- LEG C-11 on NS-10 section 17: Add Terms 3.1 and the Privacy "Which builds" section to the gate (FR-LEG-04) Why: The store build requires sign-in (D-160)
- CMP K-9 on NS-10 section 22: Add FR-CMP-17 and FR-CMP-18 as store gates Why: Sign-in is required in the store build (D-160)
- FRs: LEG-04, CMP-17, CMP-18

**R-042** (legal). Target: NS-10 section 12

- Change: Method `tap` becomes `consent_sheet` (or `reconsent_sheet`), surface `returning_consent_sheet`
- Why: The schema check refuses `tap` (FR-LEG-09)
- Handle: LEG C-8 (`functions/legal.md`). FRs: LEG-09

**R-043** (privacy). Target: NS-10 section 7

- Change: Add a P0 row for FR-PRV-20 (server refuses content pull while consent is outstanding), beside the phone rule errata E9 adds
- Why: PRIV-R08: consent that gates a server feature is checked on the server
- Handle: PRV C10 (`functions/privacy.md`). FRs: PRV-20

**R-044** (privacy). Target: NS-10, NS-11 section 11

- Change: `newPhoneLine.dismissed` and `copySlip.*` are per account (C E9, E10)
- Why: FR-PRV-14
- Handle: PRV C11 (`functions/privacy.md`). FRs: PRV-14

**R-045** (support). Target: NS-10 section 5 and section 16

- Change: `noBook` and `accountDeleted` gain "Write to us" (SUP-02)
- Why: Dead ends today
- Handle: SUP C08 (`functions/support.md`). FRs: SUP-02

**R-046** (security and risk). Target: NS-11 section 13 threats

- Change: Add row: "Whole book, an unlocked phone (A1, A3) / owner check with App lock; honest line on ready / FR-SEC-06, FR-SEC-08"
- Why: Missing threat
- Handle: SEC CC-3 (`functions/risk-security.md`). FRs: SEC-06, SEC-08

**R-047** (support). Target: NS-11 section 5 (too big)

- Change: Name what support offers after "Write to us" (M16). If nothing real exists, change the error to offer per-book or per-year export in the app instead
- Why: A button that leads to a reply with no answer breaks the promise
- Handle: SUP C09 (`functions/support.md`). FRs: none cited

**R-048** NS-12 section 10: size line and export default. Overlap: complementary. Proposed by 2 files: finance, privacy

- FIN C04 on NS-12 section 10 and a new row NS-12-R9 (P1): Add a size line: bytes per version and growth per family per month, measured (FR-FIN-04); a ceiling or removal path is a product decision if growth is material Why: Versions already accumulate on the server, kept until removed (D8)
- PRV C12 on NS-12 section 10: Export default changes from "not exported until decided" to FR-PRV-21's rule Why: Access right; counsel PQ-5
- FRs: FIN-04, PRV-21

**R-049** (operations). Target: NS-13 OQ (`killSwitches.reminders`)

- Change: Ops agrees with the default (no key); record the binary rollback above
- Why: Local notifications; a key would only narrow the window that remote config already can (C-NFR-009)
- Handle: OPS C06 (`functions/operations.md`). FRs: none cited

**R-050** (data). Target: NS-15 section 21

- Change: Drop "from the export manifest by hand"; keep only the tester question
- Why: `Manifest.counts` has no about-day field (`schema.ts:358`). Adding one changes the family's export for our measurement; I recommend against it
- Handle: DAT C-02 (`functions/data-and-measurement.md`). FRs: none cited

**R-051** (privacy). Target: NS-16 section 10

- Change: Record the `privacy` confirmation: the typed From name and `signAs.recent` are L3; `signAs.recent` is per account and cleared at sign-out
- Why: Asked in the card; X4
- Handle: PRV C05 (`functions/privacy.md`). FRs: none cited

**R-052** (privacy). Target: NS-16 section 3

- Change: Add the correction rule of FR-PRV-22 (or the plain line)
- Why: Right to correct; counsel PQ-4
- Handle: PRV C13 (`functions/privacy.md`). FRs: PRV-22

**R-053** NS-16 section 17 gates (child-input tag, Terms line, removal request by a non-user). Overlap: complementary. Proposed by 3 files: support, legal, compliance

- SUP C06 on NS-16 section 17: Add FR-POL-08 (a non-user asks for removal) as a counsel item under Q48, and make it a gate Why: No rule exists for a person with no account
- LEG C-9 on NS-16 section 17: Add the Terms line of FR-LEG-15 as a production gate, and tag the flag `child-input` (LEGAL-REQ-059) Why: A sibling speaking puts a child's voice in a letter with our knowledge
- CMP K-7 on NS-16 section 17: Tag the flag `child-input` (FR-CMP-14) Why: LEGAL-REQ-059
- FRs: POL-08, LEG-15, CMP-14

**R-054** (compliance). Target: NS-17 section 17

- Change: "guideline 2.3" becomes "guideline 2.3.1(a)", read 20 Nov 2026
- Why: The rule on misleading marketing is 2.3.1(a) [S1]
- Handle: CMP K-8 (`functions/compliance.md`). FRs: none cited

**R-055** (data). Target: NS-17 section 11 or 21

- Change: Inventory: per-language tester answers are L4 in the founder's sheet; repo pooling per FR-DAT-23
- Why: TRACKING_PLAN 6.2
- Handle: DAT C-07 (`functions/data-and-measurement.md`). FRs: DAT-23

**R-056** (finance). Target: NS-17 section 22

- Change: Replace "plus model hosting on the pack host" with the R2 figures (V3) and FR-FIN-20's one-language-at-a-time rule
- Why: Cost is $0 within the free tier, but it must be counted
- Handle: FIN C06 (`functions/finance.md`). FRs: FIN-20

**R-057** (privacy). Target: NS-17 section 10

- Change: Replace "the next push sets them null" with the E7 server call (FR-PRV-19)
- Why: Errata E7
- Handle: PRV C14 (`functions/privacy.md`). FRs: PRV-19

**R-058** (privacy). Target: NS-18 open question

- Change: Default ruled: typed-day words are not exported (phone-only, deleted after delivery, never held by us)
- Why: Asked of the CPrivO role in the card
- Handle: PRV C06 (`functions/privacy.md`). FRs: none cited

**R-059** (privacy). Target: NS-23 section 11

- Change: Record: both settings L2, not exported (CPrivO confirms, as asked)
- Why: Asked in the card
- Handle: PRV C07 (`functions/privacy.md`). FRs: none cited

**R-060** (support). Target: NS-23 section 16

- Change: An article line says how to turn off past letters on Home
- Why: A hard memory needs a quick off switch
- Handle: SUP C11 (`functions/support.md`). FRs: none cited

**R-061** (data). Target: NS-24 section 21

- Change: "Asked only in birthday weeks" becomes "asked every round, with a not-yet answer"
- Why: A research schedule set by a birthday puts an L4 date in the sheet (TRACKING_PLAN 6.4 logic)
- Handle: DAT C-01 (`functions/data-and-measurement.md`). FRs: none cited

**R-062** (compliance). Target: NS-25 section 22

- Change: Add: demo sign-in with a two-parent Asha book in the Notes (FR-CMP-03); invitee passes the age gate (FR-CMP-13)
- Why: 2.1(a) [S1]; skill section 2
- Handle: CMP K-6 (`functions/compliance.md`). FRs: CMP-03, CMP-13

**R-063** (finance). Target: NS-25 section 22

- Change: Add a per-two-parent-family cost line (MAU, rows, pulls) under FR-FIN-02
- Why: Second account per family is the largest change in server load in the pack
- Handle: FIN C05 (`functions/finance.md`). FRs: FIN-02

**R-064** (legal). Target: NS-25 section 12 (Invite, Accept) and a new row NS-25-R20

- Change: Invite and accept state the 72-hour undo and the no-removal rule before agreement; P0 (b: consent design, Q53, Q48)
- Why: A permanent, one-way sharing term should be read before the act, not only in the Terms (FR-LEG-10)
- Handle: LEG C-1 (`functions/legal.md`). FRs: LEG-10

**R-065** (legal). Target: NS-25 section 22 (gates)

- Change: Add: Terms 4.3 and 10.1 match the build's Leave (FR-LEG-03); a Report a concern route exists (LEGAL-REQ-056)
- Why: Terms promise Leave and a safety limit that the build has no door for
- Handle: LEG C-2 (`functions/legal.md`). FRs: LEG-03

**R-066** (privacy). Target: NS-25 section 12

- Change: Add the conditional door line: if counsel Q48 requires a separate sharing consent, it is a PRIV-R21 row with surface `invite_send` and its own document
- Why: D-050; S2 5.1.2(i) speaks of explicit permission before sharing with third parties (whether a co-parent is a third party there: counsel must confirm)
- Handle: PRV C15 (`functions/privacy.md`). FRs: none cited

**R-067** (security and risk). Target: NS-25 acceptance

- Change: Add a P1 row from FR-SEC-09
- Why: Wrong-adult join found only by chance
- Handle: SEC CC-4 (`functions/risk-security.md`). FRs: SEC-09

**R-068** NS-25 gate: the removal-after-72-hours runbook and its tool exist. Overlap: complementary. Proposed by 2 files: support, operations

- SUP C01 on NS-25 section 22 (gates): Add: "The safety-removal runbook and its tool (FR-POL-04), and macros M14 and M6, exist before the store flag turns on." Why: Terms 4.4 promises it, and the card leans twice on a runbook that does not exist
- SUP C02 on NS-25 section 5, row "P1 tries to remove P2 after 72 hours": "only the support runbook" becomes "only the safety-removal runbook (FR-POL-04), on counsel's evidence standard (Q50)" Why: Names a real path
- OPS C11 on NS-25 section 22: Add a gate: the removal-after-72-hours support route and runbook exist (Q53) Why: `SCPAR` sends parents to support (E catalogue 6.6)
- FRs: POL-04

**R-069** (support). Target: NS-28, NS-27, NS-31 "what would reopen it"

- Change: Add "and the 1.2 controls of FR-POL-03"
- Why: Same reason
- Handle: SUP C04 (`functions/support.md`). FRs: POL-03

**R-070** (support). Target: NS-30 reopen line

- Change: Add "refunds and support for a physical product are ours, not Apple's"
- Why: Support cannot point printed-book refunds to Apple
- Handle: SUP C05 (`functions/support.md`). FRs: none cited

**R-071** (marketing). Target: NS-32 s3

- Change: Add a row: the registry admits no announcement, offer, win-back, Plus or rating class; a test fails on an unknown class id
- Why: Turns a promise ("only if you want them") into a test
- Handle: MKT C09 (`functions/marketing.md`). FRs: none cited

**R-072** NS-33 rows: the floor reaches Help, first launch, sign-in, purchase and settings. Overlap: complementary. Proposed by 2 files: support, compliance

- SUP C12 on NS-33: A row: the Help path, the Copy fallback and the help centre meet the floor (FR-SUP-22) Why: Not covered today
- CMP K-1 on NS-33 section 3 and R4, R7: Add first launch, sign-in, the Keep gate, Plan and Delete account to the screens (mirrors area E K-E08), and a P0 (b) row: no Accessibility Nutrition Label is declared unless every common task passes with it Why: Apple's common tasks include first launch, login, purchase and settings [S4]
- FRs: SUP-22

**R-073** NS-34 section 10 and 22: perf profile and device price. Overlap: complementary. Proposed by 2 files: operations, finance

- OPS C09 on NS-34 section 10: Add: the `perf` profile is internal distribution only, spends EAS builds (D-092), and preflight refuses its marker flag in production Why: FR-OPS-22, 27
- FIN C08 on NS-34 section 22: Mark the device price UNVERIFIED and point to FR-FIN-19's decision record Why: No vendor price was read
- FRs: OPS-22, OPS-27, FIN-19

**R-074** (legal). Target: NS-36 section 3

- Change: Add rule 9: the Privacy Policy and the notice at collection name the field in the same release as the flag
- Why: Rule 4 covers the inventory, not what a parent is told (FR-LEG-08)
- Handle: LEG C-12 (`functions/legal.md`). FRs: LEG-08

**R-075** (data). Target: NS-38 section 21

- Change: Mark "product page conversion" with whether ASC computes it from opt-in usage data (UNVERIFIED)
- Why: Frame rule: name the blind spot of every number
- Handle: DAT C-15 (`functions/data-and-measurement.md`). FRs: none cited

**R-076** (marketing). Target: NS-38 (draft) R2 and s3

- Change: Add "without an account" to R2's phrase list; name keywords, promotional text, What's New and the preview video in scope (or point to FR-MKT-09, 11, 15); give the website and welcome email a card owner, since NS-38 puts the website out of scope
- Why: The listing line in FR-MKT-08 passes R2 as drafted; no card owns the site
- Handle: MKT C12 (`functions/marketing.md`). FRs: MKT-08, MKT-09, MKT-11, MKT-15

**R-077** NS-38 to NS-45: carry lists for the sign-up path. Overlap: complementary. Proposed by 2 files: support, compliance

- SUP C16 on NS-38 to NS-45 (when written): Include SUP-02 (E-S06 Write to us), SUP-18 (struggling before a book), the region line (CG10), and an NS-45 path for a phone that cannot update Why: First run is where most people get stuck
- CMP K-10 on NS-38 to NS-45 (when written): Carry section 3d as the sign-up path's legal and store rows, with FR-CMP-13, -15, -16, -17, -18 Why: BL-994 scope names risk checks and verification
- FRs: SUP-02, SUP-18, CMP-13

**R-078** (data). Target: NS-40 section 21

- Change: Add: k = 10 with "other" for small countries, never an age answer, level, retention and deletion path (FR-DAT-35)
- Why: A refusal next to a country code, in small numbers, can point at one family
- Handle: DAT C-13 (`functions/data-and-measurement.md`). FRs: DAT-35
- Conflict: see K10 in 3a

**R-079** (privacy). Target: NS-40 section 11, row "Sign-up IP address"

- Change: Add: "Supabase Auth's own audit log may also hold the IP and email; retention read for the production plan and stated in data-policy 4.2"
- Why: Our hook keeps nothing, but the vendor log does (FR-PRV-26)
- Handle: PRV C18 (`functions/privacy.md`). FRs: PRV-26

**R-080** (data). Target: NS-41 section 21

- Change: Add: the rate is read as an aggregate under a runbook with an audit row; in C1 it is reported as "x of n sign-ins", not against 97%
- Why: Auth logs hold L3 data; C1 volume cannot test 97%
- Handle: DAT C-14 (`functions/data-and-measurement.md`). FRs: none cited

**R-081** (privacy). Target: NS-41 open items O-8 and O-12

- Change: Record the `privacy` position: O-8 drop the full-name scope (FR-PRV-35, a collect-less ruling); O-12 purge never-confirmed rows after 7 days (agree with the card's default)
- Why: Both are minimisation; O-12's 7 days is a retention period, so the founder confirms it with PQ-2
- Handle: PRV C19 (`functions/privacy.md`). FRs: PRV-35

**R-082** NS-42 (now on disk): the version recorded and the privacy rows. Overlap: complementary. Proposed by 2 files: privacy, legal

- PRV C20 on NS-42 (when written): Carries FR-PRV-02 and FR-PRV-04 as P0 and P1 rows, the BL-579 upload, and the answer to the input's Q-D (agree or acknowledge the Privacy Policy); default: one `privacy` acknowledge row beside `terms`, so the record names the policy version the person was shown Why: Compliance input section 5 gap list
- LEG C-15 on NS-42 (new P0 (b) row): The version recorded is a published version whose file and hash the link serves (FR-LEG-20) Why: POLICY_VERSIONING 2.4; an agreement to an unpublished draft number proves little
- FRs: PRV-02, PRV-04, LEG-20

**R-083** (privacy). Target: NS-43 (when written) and the compliance input section 3

- Change: Classes: the child's name or nickname, birthday, due date and letter languages are L4, not L3 or L2; the signature stays L3. This is a `privacy` classification ruling (my charter)
- Why: `DATA_CLASSIFICATION.md` rules 6 and 7 and section 4.5 (`children.name`, `birthday`, `due_date`, `language.spoken` are L4)
- Handle: PRV C21 (`functions/privacy.md`). FRs: none cited
- Conflict: see K1 in 3a

**R-084** (privacy). Target: NS-44 (when written) and the compliance input section 3 row 18

- Change: The first letter's words and recording are L4 content, not "L3, sensitive"
- Why: `DATA_CLASSIFICATION.md` level table: letter text and audio are L4
- Handle: PRV C22 (`functions/privacy.md`). FRs: none cited
- Conflict: see K1 in 3a

**R-085** NS-45 (now on disk): carry the sign-out, delete, update and outage rows. Overlap: complementary. Proposed by 3 files: operations, privacy, security

- OPS C10 on NS-45 (when written): Carry FR-OPS-25 (update line, never a lock) and FR-OPS-10, FR-OPS-33 (sign-in capacity, outage path) Why: GAP-LOG E K-5
- SEC CC-7 on `19-from-download-to-first-letter.md` NS-45 (when written): Carry FR-SEC-06, FR-SEC-07, FR-SEC-12 (input G5, G6) and the D1 sheet; add FR-SEC-02 to NS-41-R6 ("B's own letters never stop syncing without a word") Why: NS-45 has no section yet
- PRV C23 on NS-45 (when written): Carries FR-PRV-14, 15 and 18 for sign-out, Erase everything and Delete account Why: Section 2
- FRs: OPS-10, OPS-25, OPS-33, PRV-14, PRV-15, PRV-18, SEC-02, SEC-06, SEC-07, SEC-12
- Conflict: see K4 in 3a

**R-086** (data). Target: F14 6.9 vs D-125 item 3

- Change: One minimum: F14 says "at least 1,000 first-time downloads"; D-125 says 500. Default: 500 (the later ruling) with the interval reported (FQ-02)
- Why: Two numbers on record
- Handle: DAT C-11 (`functions/data-and-measurement.md`). FRs: none cited
- Conflict: see K3 in 3a

**R-087** (data). Target: `pack-pdf/03-measure.md` section 14

- Change: Question wording for Find and Share taken from NS-02 and NS-05
- Why: Fixed wording rule
- Handle: DAT C-12 (`functions/data-and-measurement.md`). FRs: none cited

## 4. Founder and counsel question index

Every question in section 7 of the nine files (the risk-security file numbers it section 10). 99 questions; after merging the same question asked by more than one function there are 74 entries (QI-01 onward): counsel first, then founder. Defaults are copied per source; where two sources give different defaults both are shown. Due dates are shown only where the source row states one; every other entry has no due date in the files. Finance and data have no "To" column: owner there is read from the question (data: "Counsel:" prefix) or, for finance, set by me from the question text and marked by the source file. Counsel numbers are packet 1.5.0 as the files cite them; "needs a number from legal" is shown as written.

### 4.1 Counsel questions

**QI-01** Co-parent removal and what limits a parent's access

- Owner as stated: counsel, Q50; counsel; counsel Q50, Q53. Counsel numbers: Q50, Q53. Due: not stated.
- SUP Q-SUP-6 (`functions/support.md`): What evidence lets us limit a co-parent's access (Terms 4.4)? Default: A verified court order, or a counsel decision case by case, using the counsel-led runbook
- LEG L-1 (`functions/legal.md`): Co-parent removal: is the 72-hour undo plus no later removal enforceable and fair between separating parents, and is it enough that the rule is shown at invite and accept (FR-LEG-10)? What evidence standard limits a parent's access under Terms 4.4? Default: As drafted (D11); the rule shown on both sheets; access limited only on a verified court order or a safety report checked by the founder Number: Q53, Q50
- SEC Q-S7 (`functions/risk-security.md`): May a co-parent be removed for safety after 72 hours? Default: Keep the Terms (72 hours only) until counsel answers
- FRs cited: SUP-06, LEG-10

**QI-02** Is the two-parent book or a shared letter user-generated content (Guideline 1.2) and the age-rating answers

- Owner as stated: counsel and the founder (needs a number from legal); Counsel: needs a number from legal; counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: not stated.
- SUP Q-SUP-7 (`functions/support.md`): Is the two-parent book "user-generated content" under Guideline 1.2? Default: Treat it as not, while it stays capped at two parents who invite each other. Treat anything hosted for a third person as 1.2
- MKT MQ-8 (`functions/marketing.md`): Age rating at NS-25: does two parents reading one book change User-Generated Content or Messaging answers? Default: No change for NS-01 to NS-06; re-answer at NS-25 with counsel's view
- CMP C-5 (`functions/compliance.md`): Does guideline 1.2 (user-generated content: filtering, reporting, blocking) apply to a book shared by two parents, and to a letter sent through the parent's own share sheet? Default: Treat NS-25 as in scope for a report route (LEGAL-REQ-056, `legal.md` FR-LEG-10); NS-05 out of scope (we host nothing) Number: needs a number from legal (with CR-086)
- FRs cited: SUP-07, LEG-10

**QI-03** Someone else speaks (NS-16): a non-user's name and words in a letter

- Owner as stated: counsel, Q48; counsel; Counsel. Counsel numbers: Q45, Q46, Q48, Q54. Due: not stated.
- SUP Q-SUP-8 (`functions/support.md`): A person with no account whose words are in another parent's letter asks for removal. What do we owe them? Default: We tell them we cannot see or change the letter, and suggest they ask the author. NS-16 waits on the answer
- LEG L-6 (`functions/legal.md`): Someone else speaks: on the parent's say-so, may we store another adult's name and words in the parent's letter, and what if the speaker is a child? Default: Instruction line only (D9); flag off in production until read; tagged `child-input` Number: Q48, Q45, Q46
- CMP C-6 (`functions/compliance.md`): Under 5.1.2(i), is storing a non-user's name and words in a parent's synced letter (NS-16) on the parent's say-so acceptable, or does App Review expect the speaker's permission in the app? Default: Instruction line only (D9); describe the feature in the Notes Number: Q48
- PRV PQ-8 (`functions/privacy.md`): Is a typed name of a non-user (NS-16) a Contact Info row? Default: No row; the flag stays off in production until answered Number: Q54 (proposed sub-question (f))
- FRs cited: SUP-08

**QI-04** Pilot and tester texts, consent and retention

- Owner as stated: counsel; counsel, founder. Counsel numbers: Q44, Q45, Q51. Due: not stated.
- LEG L-7 (`functions/legal.md`): Concierge pilot with tester families: consent texts W and V, notes retention 30 days, consent records 12 months, and Arm V (a child's voice sent by the parent to a relative) Default: Arm W only until the reads; texts as NS-03 section 15 Number: needs a number from legal; with Q44, Q45, Q51
- LEG L-13 (`functions/legal.md`): May the founding family and outside testers agree to texts published as 0.9.0 test versions, and must the app re-ask at 1.0.0? Until then, which version does the store build record (FR-LEG-20)? Default: Record only a published version; 0.9.0 for testers, 1.0.0 with re-consent after counsel Number: Q44
- DAT FQ-08 (`functions/data-and-measurement.md`): Counsel: the tester round text and retention Default: Q44 (real families under draft texts) and Q51 (retention), packet 1.5.0, as the frame already cites. Default: D5
- FRs cited: LEG-20

**QI-05** Tester answers that are personal data (language, assistive technology)

- Owner as stated: counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: not stated.
- DAT FQ-06 (`functions/data-and-measurement.md`): Counsel: per-language tester answers in the founder's sheet (L4) Default: Needs a number from legal. Default: FR-DAT-23. Packet Q6 (the analytics language code) is deferred to v1.1 and does not cover this
- DAT FQ-07 (`functions/data-and-measurement.md`): Counsel: tester answers that reveal assistive-technology use Default: Needs a number from legal. Default: FR-DAT-24. Counsel must confirm whether this is sensitive data
- FRs cited: DAT-23, DAT-24

**QI-06** Offer codes to pilot, study or TestFlight families

- Owner as stated: Counsel: needs a number from legal (Q41(f) covers only what an offer code must say); founder; counsel Q41(f). Counsel numbers: Q41. Due: not stated.
- MKT MQ-9 (`functions/marketing.md`): Offer codes to pilot, study or TestFlight families after their read-outs: is a free Plus period a material connection that each family must disclose if they post or review? Default: Treat it as one: no code before the read-out, and any code carries a disclosure line (F1)
- FIN F11 (`functions/finance.md`): Offer codes Default: None (recommendation: None until counsel answers Q41(f) and the pilot reads out)

**QI-07** Sign-in required in the store build (Terms 3.1, 5.1.1(v), listing variant)

- Owner as stated: founder; founder, counsel; Founder; counsel Q43. Counsel numbers: Q43, Q44. Due: not stated.
- LEG L-8 (`functions/legal.md`): Terms 3.1 and sign-in required (D-160): rewrite the Terms to say an account is needed in this version, or keep local use without an account? Default: Rewrite Terms 3.1 and the Privacy "Which builds" section to Build 12 facts (FR-LEG-04); App Review risk is in `compliance.md` (C-4) Number: founder decision; counsel reads with Q44
- CMP C-4 (`functions/compliance.md`): Sign-in required in Build 12: is the account-based feature set (sync, second phone, co-parent later, deletion) enough under 5.1.1(v), or should local use without an account return? Default: Keep sign-in required; state the account features in the Notes; if App Review objects, the servers-off first-run path (E-S02.serversOff) is the fallback Number: needs a number from legal (same question as compliance input G6); founder decision
- MKT MQ-5 (`functions/marketing.md`): Which listing variant goes with Build 12, given "Without an account, your book stays on your phone" and sign-in required? Default: The servers-on variant, re-checked line by line against the Build 12 binary
- FRs cited: LEG-04

**QI-08** Notifications: Apple 4.5.4 and names in notifications

- Owner as stated: counsel. Counsel numbers: Q41, Q43. Due: not stated.
- LEG L-12 (`functions/legal.md`): Typed days and names in notifications: is the opt-in for typed words and the child's name enough under Privacy 5 and Apple 4.5.4 for local notifications? Default: As built; never by default; Privacy 5 says so (FR-LEG-08) Number: Q43
- CMP C-7 (`functions/compliance.md`): Does guideline 4.5.4 apply to local notifications, and are plan notices "sensitive personal information"? Default: Treat 4.5.4 as applying; no names or words by default; plan notices carry dates, not amounts (D-083) Number: Q41
- FRs cited: LEG-08

**QI-09** Age signals and the under-18 stop (Texas, California, "I answered by mistake")

- Owner as stated: counsel; counsel, Q46 (area E CG14). Counsel numbers: Q46. Due: 1 Jan 2027 is the date in the question (stated).
- CMP C-2 (`functions/compliance.md`): Installs made before 1 Jan 2027: must the app ask the platform for an age signal for existing users, and by when? May a signal be kept with the Terms acceptance as evidence? Default: Request at every launch on iOS 26+ from 1 Jan 2027; keep nothing Number: Q46
- CMP C-3 (`functions/compliance.md`): Texas SB 2420: which developer duties apply to an 18+ app with an 18+ rating while the stay holds? Default: Honour the store's age category signal as in FR-CMP-15; rating 18+ Number: Q46 (with CR-004)
- SUP Q-SUP-13 (`functions/support.md`): Keep "I answered by mistake" on the age stop in store builds? Default: Keep it (LEGAL-REQ-002 neutrality). Support never acts on an age answer it cannot see
- FRs cited: SUP-13, CMP-15

**QI-10** Restore window on the Free plan and what the policy may say about deletions

- Owner as stated: Counsel; counsel Q51 (retention and deletion exceptions); counsel must confirm. Counsel numbers: Q51. Due: not stated.
- PRV PQ-10 (`functions/privacy.md`): Is the restore-window limit (up to 24 hours of deletions can return after losing the project on the Free plan) something the policy must say? Default: Say it in the incident notice, not in the policy; prove the replay (FR-PRV-09) so the window shrinks to zero where the ledger survives Number: Q51
- OPS Q7 (`functions/operations.md`): Can a restore on Free be promised not to bring back deleted items? Default: No promise; the privacy text must not say deletions survive a disaster restore on Free (`free-tier-ops.md`)
- FRs cited: PRV-09

**QI-11** Earlier versions: access and deletion rights

- Owner as stated: counsel; Counsel. Counsel numbers: Q48, Q51, Q55. Due: not stated.
- LEG L-11 (`functions/legal.md`): Earlier versions and the right to delete: does a deletion right reach a removed earlier version, and on what clock? Default: Erased on the deleted-letter clock (D8) Number: Q51, Q48
- PRV PQ-5 (`functions/privacy.md`): Does an access request reach server-held data the phone's copy lacks (earlier versions, `audit_events` and `deletion_requests` rows about the person)? Default: Yes: include the person's own rows in `account.json` and the versions in the author's copy Number: needs a number from legal (near Q55)

**QI-12** Leak and breach notification clocks

- Owner as stated: needs a number from legal; counsel must confirm; counsel Q28. Counsel numbers: Q28. Due: not stated.
- OPS Q9 (`functions/operations.md`): Notification clocks for the new data kinds in a leak (From name of another adult, first labels, seal dates) Default: Treat each as the letter's own class (L4) until counsel says otherwise
- SEC Q-S5 (`functions/risk-security.md`): Breach notice: do letters, a child's details, voice recordings or pictures held by this app count as personal information or a personal health record under California Civil Code 1798.82 and the FTC HBNR, and on which clock? Default: Treat as covered for readiness (packet Q28 default). Counsel must confirm

**QI-13** Accessibility label and statement

- Owner as stated: founder; counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: not stated.
- CMP C-1 (`functions/compliance.md`): Declare any Accessibility Nutrition Label for the first store build? Default: Declare none until the FR-CMP-06 walk passes on the candidate; then Dark Interface first (the store draft), VoiceOver and Reduced Motion only after the walk covers sign-in and purchase Number: founder decision
- CMP C-8 (`functions/compliance.md`): Is WCAG 2.2 AA the right target to state publicly, and should the accessibility statement say "aim" rather than "meet" while gaps remain? Default: "We aim to meet WCAG 2.2 AA" plus known gaps Number: needs a number from legal (with CR-070)
- FRs cited: CMP-06

**QI-14** Country at sign-up: derived in memory versus counted

- Owner as stated: counsel; Counsel. Counsel numbers: Q57. Due: not stated.
- DAT FQ-09 (`functions/data-and-measurement.md`): Founder and counsel: may the NS-40 refusal counts by country and the NS-41 sign-in counts be computed in the 1.0 line? Default: Needs a number from legal for the country count. Default: yes for NS-41 as an aggregate under a runbook (it serves a reliability target); NS-40 only with the FR-DAT-35 limits and a privacy read first
- PRV PQ-7 (`functions/privacy.md`): Is a country derived in memory at sign-up and never kept "collected" for the label? Default: Not collected; label unchanged (CPrivO-2) Number: Q57(f)
- FRs cited: DAT-35

**QI-15** Privacy 3 says we read letters "only if you ask us for help". May support refuse to read letters even when a parent asks, and should that phrase be removed?

- Owner as stated: counsel, Q43 (claims). Counsel numbers: Q43. Due: not stated.
- SUP Q-SUP-1 (`functions/support.md`): Privacy 3 says we read letters "only if you ask us for help". May support refuse to read letters even when a parent asks, and should that phrase be removed? Default: Support never reads. Remove "if you ask us for help" from Privacy 3, or narrow it to "if you ask us in writing to look at a specific letter". Counsel must confirm
- FRs cited: SUP-01

**QI-16** How long do we keep support emails, and emails that arrived with letter content?

- Owner as stated: counsel, Q51. Counsel numbers: Q51. Due: not stated.
- SUP Q-SUP-4 (`functions/support.md`): How long do we keep support emails, and emails that arrived with letter content? Default: Correspondence: 12 months after the ticket closes. A message carrying content: delete the content and attachments when the request closes, and keep only the log row
- FRs cited: SUP-04

**QI-17** Does support ever call emergency services for someone who writes in danger?

- Owner as stated: counsel (needs a number from legal), BL-105. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: not stated.
- SUP Q-SUP-5 (`functions/support.md`): Does support ever call emergency services for someone who writes in danger? Default: No. Support gives the emergency number and the helplines (M6) and the founder reads it the same day. Counsel and the BL-105 clinician must confirm
- FRs cited: SUP-05

**QI-18** Executors and guardians after a death

- Owner as stated: counsel, Q49. Counsel numbers: Q49. Due: before C1 (stated in the row).
- SUP Q-SUP-10 (`functions/support.md`): Executors and guardians after a death Default: No clause and no action. Write the runbook before C1
- FRs cited: SUP-10

**QI-19** After a loss, may billing notices stop while Apple still bills?

- Owner as stated: counsel, Q52. Counsel numbers: Q52. Due: not stated.
- SUP Q-SUP-11 (`functions/support.md`): After a loss, may billing notices stop while Apple still bills? Default: They continue (packet default). Support explains how to cancel through Apple
- FRs cited: SUP-11

**QI-20** The FAQ answer in `site.en.ts:109` lists Read together as "never locked away". Replace it?

- Owner as stated: Founder; counsel Q40. Counsel numbers: Q40. Due: not stated.
- MKT MQ-1 (`functions/marketing.md`): The FAQ answer in `site.en.ts:109` lists Read together as "never locked away". Replace it? Default: Yes: list only what the Terms 8.2 permanent list covers (reading kept letters, playing their recordings, export) and say "Read together is free" with no time word

**QI-21** The welcome email says letters and recordings "stay on your iPhone", false once sign-in syncs letters (D-160). Remove now?

- Owner as stated: Founder; counsel Q34, Q43. Counsel numbers: Q34, Q43. Due: not stated.
- MKT MQ-2 (`functions/marketing.md`): The welcome email says letters and recordings "stay on your iPhone", false once sign-in syncs letters (D-160). Remove now? Default: Yes: remove the line in one PR to `main` (removing a false claim promises less); classify the email before any further send

**QI-22** The site says "Your letters are never used to train AI." Replace with the D-061 promise words?

- Owner as stated: Founder; counsel Q16, Q43. Counsel numbers: Q16, Q43. Due: not stated.
- MKT MQ-3 (`functions/marketing.md`): The site says "Your letters are never used to train AI." Replace with the D-061 promise words? Default: Yes

**QI-23** Keep specific prices in the store description (Apple advises against it)?

- Owner as stated: Founder; counsel Q37, Q41. Counsel numbers: Q37, Q41. Due: not stated.
- MKT MQ-4 (`functions/marketing.md`): Keep specific prices in the store description (Apple advises against it)? Default: Remove the prices from the description; keep the subscription and auto-renewal paragraph; prices stay on Apple's page and the website (D-075)

**QI-24** Trademark: the name is not cleared (D-121 note). Hold paid placement and permanent printed uses until cleared?

- Owner as stated: Counsel Q10. Counsel numbers: Q10. Due: not stated.
- MKT MQ-12 (`functions/marketing.md`): Trademark: the name is not cleared (D-121 note). Hold paid placement and permanent printed uses until cleared? Default: Yes

**QI-25** A status page

- Owner as stated: founder; every public sentence is a claim: counsel Q43 (privacy claims) where it touches privacy. Counsel numbers: Q43. Due: not stated.
- OPS Q4 (`functions/operations.md`): A status page Default: Yes: a static page on the website, no subscriptions, no times; content-free

**QI-26** Suspending an account on a possible sanctions match

- Owner as stated: counsel Q57; counsel must confirm. Counsel numbers: Q57. Due: not stated.
- OPS Q8 (`functions/operations.md`): Suspending an account on a possible sanctions match Default: Suspend sign-in, keep everything, tell counsel the same day

**QI-27** Counsel

- Owner as stated: founder (engages counsel). Counsel numbers: none cited (a source may say "needs a number from legal"). Due: not stated.
- FIN F5 (`functions/finance.md`): Counsel Default: No engagement (recommendation: One packet with the pack's gating questions, fixed fee)

**QI-28** D-004 hedge: start an entity in parallel (due 27 Nov)

- Owner as stated: founder, accountant, counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: due 27 Nov (stated).
- FIN F12 (`functions/finance.md`): D-004 hedge: start an entity in parallel (due 27 Nov) Default: No entity, no spend; the 5.1.1(ix) risk stays accepted (recommendation: Talk to the accountant and counsel first; the $800 California LLC tax and formation costs are the accountant's to confirm)

**QI-29** When a parent withdraws sensitive-data consent, what happens to letters already on our server?

- Owner as stated: Founder, then counsel. Counsel numbers: Q48. Due: not stated.
- PRV PQ-1 (`functions/privacy.md`): When a parent withdraws sensitive-data consent, what happens to letters already on our server? Default: Writes stop at once; nothing is deleted by the withdrawal itself; the sheet offers Save a copy and Delete account in the same place. A deletion offer that is one tap away keeps withdrawal as easy as agreeing without making it destructive Number: Q48 (consent design); OQ-L1 in BL-485

**QI-30** Is GitHub, holding our nightly dump encrypted to a key only the founder holds, a processor we must name?

- Owner as stated: Counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: not stated.
- PRV PQ-3 (`functions/privacy.md`): Is GitHub, holding our nightly dump encrypted to a key only the founder holds, a processor we must name? Default: Name it in `subprocessors.md` and the policy's backup sentence anyway; minimal cost, no surprise Number: needs a number from legal

**QI-31** Does a right to correct reach a letter's raw transcript, or a From name that is insert-only today?

- Owner as stated: Counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: not stated.
- PRV PQ-4 (`functions/privacy.md`): Does a right to correct reach a letter's raw transcript, or a From name that is insert-only today? Default: The raw transcript stays as the record of what was heard and is never changed; the author corrects the final text; the From name becomes correctable by its author Number: needs a number from legal

**QI-32** Does a separate consent apply before the first invite shares earlier letters that may mention health?

- Owner as stated: Counsel. Counsel numbers: Q48. Due: not stated.
- PRV PQ-9 (`functions/privacy.md`): Does a separate consent apply before the first invite shares earlier letters that may mention health? Default: No second consent; the invite sheet's line (FR-PRV-32); one tap at the first share is ready if counsel says yes Number: Q48 (D-050)
- FRs cited: PRV-32

**QI-33** A baby's voice on a parent's recording: provided by the parent, or collected from a child?

- Owner as stated: Counsel. Counsel numbers: Q45. Due: not stated.
- PRV PQ-11 (`functions/privacy.md`): A baby's voice on a parent's recording: provided by the parent, or collected from a child? Default: Unchanged: parent-as-user; no speaker identification, no voiceprints; the FTC FAQ treats a child's voice as personal information (S5 F.6), so this stays the open edge before backup ships Number: Q45

**QI-34** Sign-in codes as sensitive personal information

- Owner as stated: Counsel. Counsel numbers: Q56. Due: not stated.
- PRV PQ-12 (`functions/privacy.md`): Sign-in codes as sensitive personal information Default: Treat as sensitive; never logged (FR-PRV-27) Number: Q56
- FRs cited: PRV-27

**QI-35** Sealed letters and minors: may a letter be hidden until a day in the child's minority or adulthood with no delivery by us? Does "open at 18" wording, or any later reading by the grown child, create a duty to deliver, verify age or obtain consent? Who may open a sole author's sealed letter after death or incapacity?

- Owner as stated: counsel. Counsel numbers: Q49. Due: not stated.
- LEG L-2 (`functions/legal.md`): Sealed letters and minors: may a letter be hidden until a day in the child's minority or adulthood with no delivery by us? Does "open at 18" wording, or any later reading by the grown child, create a duty to deliver, verify age or obtain consent? Who may open a sole author's sealed letter after death or incapacity? Default: Ordinary dates only, latest the 25th birthday, no age wording, no delivery, deleted with the account (D6); no fiduciary clause yet Number: needs a number from legal; with Q49

**QI-36** A sealed letter and a court order or custody dispute: may the author hide a letter from the other parent (B8), and what do we do with an order for a hidden letter?

- Owner as stated: counsel. Counsel numbers: Q50. Due: not stated.
- LEG L-3 (`functions/legal.md`): A sealed letter and a court order or custody dispute: may the author hide a letter from the other parent (B8), and what do we do with an order for a hidden letter? Default: Yes, the author may hide; orders handled under the Q50 runbook; the hiding does not change what we hand over Number: Q50

**QI-37** Shared letter: is a parent sending a picture of their child, or a letter naming another adult, through their own share sheet outside our collection and responsibility, as with Export?

- Owner as stated: counsel. Counsel numbers: Q45, Q48. Due: not stated.
- LEG L-4 (`functions/legal.md`): Shared letter: is a parent sending a picture of their child, or a letter naming another adult, through their own share sheet outside our collection and responsibility, as with Export? Default: Same as Export: the parent's own act; we collect nothing; the picture toggle off by default; flag off in production until the read is on record Number: Q45, Q48

**QI-38** Is the NX-33 label line above the photo picker, and the "Pictures stay on this phone" claim, accurate and sufficient?

- Owner as stated: counsel. Counsel numbers: Q43. Due: not stated.
- LEG L-5 (`functions/legal.md`): Is the NX-33 label line above the photo picker, and the "Pictures stay on this phone" claim, accurate and sufficient? Default: Line absent until read; claim used only while NS-01-R15, R26, R61 pass on the candidate Number: Q43

**QI-39** Printable PDF: are OFL fonts embedded in a parent's PDF, printed by a print shop of the parent's choice, within Terms 5.6 "personal and family use", or should 5.6 name print shops?

- Owner as stated: founder, counsel. Counsel numbers: Q12. Due: not stated.
- LEG L-10 (`functions/legal.md`): Printable PDF: are OFL fonts embedded in a parent's PDF, printed by a print shop of the parent's choice, within Terms 5.6 "personal and family use", or should 5.6 name print shops? Default: Add "including through a print shop you choose" to 5.6; OFL allows the embedding [S5] Number: Q12 (IP), counsel confirms

**QI-40** Should Save a copy and the printable book ask for the owner check when App lock is off?

- Owner as stated: founder; counsel to confirm the step does not conflict with LEGAL-REQ-040. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: not stated.
- SEC Q-S2 (`functions/risk-security.md`): Should Save a copy and the printable book ask for the owner check when App lock is off? Default: No. Keep as built (ask only with App lock) and add the FR-SEC-08 line. Export is never gated (LEGAL-REQ-040), and an owner check is not a gate, but it adds a step where none is required. Erase and Delete do get the check (FR-SEC-06)
- FRs cited: SEC-06, SEC-08

**QI-41** Is a join by the wrong adult through a forwarded invite link a security incident needing notice, or a support case?

- Owner as stated: counsel Q23, Q50. Counsel numbers: Q23, Q50. Due: not stated.
- SEC Q-S6 (`functions/risk-security.md`): Is a join by the wrong adult through a forwarded invite link a security incident needing notice, or a support case? Default: Support case with the 72-hour undo, logged as a security event; counsel must confirm

### 4.2 Founder (and other owner) questions

**QI-42** When production moves to Supabase Pro

- Owner as stated: founder. Due: not stated.
- FIN F1 (`functions/finance.md`): When does production move to Supabase Pro ($25 a month, $300 a year)? Default: Stay on Free (D-159) (recommendation: At 60% of any Free limit on the weekly check, or before any backup flip. Keep the spend cap on)
- OPS Q1 (`functions/operations.md`): When a Free quota passes 80%, move to Pro for that month? Default: Yes, same week, because after the first grace period Supabase gives no second one (billing FAQ, 20 Nov). Pro's price was not read this session: read it on the day

**QI-43** EAS Starter in a heavy month

- Owner as stated: founder. Due: not stated.
- FIN F6 (`functions/finance.md`): EAS Starter Default: Stay on Free (D-092) (recommendation: Batch native changes; upgrade only for a month that needs it)
- OPS Q3 (`functions/operations.md`): EAS Starter in a heavy month Default: Yes for any month past 12 planned builds (D-092 already allows it)

**QI-44** Resend before a public launch

- Owner as stated: founder. Due: not stated.
- FIN F7 (`functions/finance.md`): Resend Pro Default: Stay on Free (recommendation: Upgrade before a public launch day if 100 a day could be reached)
- OPS Q2 (`functions/operations.md`): Resend at public launch Default: Stay on Free until expected email sign-ins pass 50 a day (half the 100-a-day cap), then a paid tier; paid prices not read this session

**QI-45** Which test phones exist

- Owner as stated: founder. Due: before the first run sheet (stated); before the first run sheet of the pack (stated).
- FIN F2 (`functions/finance.md`): Which phones do you hold (SE 3, iOS 17, a second phone, an iPad)? Default: Buy nothing; iPad rows on the simulator; second-phone rows stay off in production (recommendation: Name them before the first run sheet; buy a used SE 3 only if none is held)
- OPS Q11 (`functions/operations.md`): Which test phones exist Default: The founder lists them before the first run sheet of the pack; missing rows are waivers in the build record

**QI-46** Do we state a response time for ordinary support (not data requests)?

- Owner as stated: founder. Due: not stated.
- SUP Q-SUP-2 (`functions/support.md`): Do we state a response time for ordinary support (not data requests)? Default: No public time. Data requests keep Privacy 10's 45 days
- FRs cited: SUP-02

**QI-47** Support in languages other than English?

- Owner as stated: founder. Due: not stated.
- SUP Q-SUP-3 (`functions/support.md`): Support in languages other than English? Default: English only at 1.0. The help centre says so once
- FRs cited: SUP-03

**QI-48** If a printed book (NS-30) ever ships, who handles refunds and delivery problems?

- Owner as stated: founder. Due: not stated.
- SUP Q-SUP-9 (`functions/support.md`): If a printed book (NS-30) ever ships, who handles refunds and delivery problems? Default: Decide before NS-30 reopens. It is not Apple
- FRs cited: SUP-09

**QI-49** May the Help mail subject carry the app version and build (not an id), to save a question?

- Owner as stated: founder, `privacy`. Due: not stated.
- SUP Q-SUP-12 (`functions/support.md`): May the Help mail subject carry the app version and build (not an id), to save a question? Default: No. Ask for the version in the reply (M20)
- FRs cited: SUP-12

**QI-50** Can the 0.9.0 pages go live while their by-hand promises (Route 1, "we offer to delete what was synced") cannot be kept?

- Owner as stated: founder. Due: not stated.
- SUP Q-SUP-14 (`functions/support.md`): Can the 0.9.0 pages go live while their by-hand promises (Route 1, "we offer to delete what was synced") cannot be kept? Default: No. Change the sentences first, or build BL-551 first (CR-60)
- FRs cited: SUP-14

**QI-51** Pictures in NS-01 store art: illustration or licensed photography?

- Owner as stated: Founder (spend if licensed). Due: not stated.
- MKT MQ-6 (`functions/marketing.md`): Pictures in NS-01 store art: illustration or licensed photography? Default: Illustration (no likeness, no release, no spend); never an AI-generated photo of a child

**QI-52** Rating request: when may Apple's prompt be called?

- Owner as stated: Founder. Due: not stated.
- MKT MQ-7 (`functions/marketing.md`): Rating request: when may Apple's prompt be called? Default: FR-MKT-23 as written; first request no earlier than the second kept letter
- FRs cited: MKT-23

**QI-53** The welcome email renders the D-118 name from `site.ts` into a separate surface. Does D-118 cover the email?

- Owner as stated: Founder. Due: not stated.
- MKT MQ-10 (`functions/marketing.md`): The welcome email renders the D-118 name from `site.ts` into a separate surface. Does D-118 cover the email? Default: No: the email uses Asha

**QI-54** Add any keyword for photos, Find or Share when they ship?

- Owner as stated: Founder (keyword field as submitted). Due: not stated.
- MKT MQ-11 (`functions/marketing.md`): Add any keyword for photos, Find or Share when they ship? Default: No keyword added for them; language names only when shipped

**QI-55** Ever block an old app version?

- Owner as stated: founder. Due: not stated.
- OPS Q5 (`functions/operations.md`): Ever block an old app version? Default: No in the 1.0.x line: a line in Me only; servers stay compatible with every live build

**QI-56** The seventh flip condition (copy of the Storage objects)

- Owner as stated: founder with security-architect. Due: not stated.
- OPS Q6 (`functions/operations.md`): The seventh flip condition (copy of the Storage objects) Default: No flip until a copy job of the encrypted `entry-audio` objects to a second store exists, with a monthly restore check

**QI-57** Re-enable `agents.yml`

- Owner as stated: founder. Due: not stated.
- OPS Q10 (`functions/operations.md`): Re-enable `agents.yml` Default: Keep it disabled until open agent PRs are under `max_open_agent_prs` (66 against 10 today) or the cap is raised by the founder; ops changes nothing

**QI-58** Second languages

- Owner as stated: founder. Due: not stated.
- FIN F3 (`functions/finance.md`): Second languages Default: No spend (recommendation: One at a time, after a corpus pre-check)

**QI-59** Proof books

- Owner as stated: founder. Due: not stated.
- FIN F4 (`functions/finance.md`): Proof books Default: No spend (taken 20 Nov) (recommendation: Wait until NS-07 is next in the wave)

**QI-60** Is the website allowed on Vercel Hobby?

- Owner as stated: founder. Due: not stated.
- FIN F8 (`functions/finance.md`): Is the website allowed on Vercel Hobby? Default: No change (recommendation: Read Vercel's fair use page; if commercial use needs Pro, decide with that page open)

**QI-61** Is the Small Business Program enrolment approved, and on what date?

- Owner as stated: founder. Due: not stated.
- FIN F9 (`functions/finance.md`): Is the Small Business Program enrolment approved, and on what date? Default: Not enrolled (30% in year one) (recommendation: Enrol now if not done; it costs $0 and the rate starts 15 days after the fiscal month of approval)

**QI-62** Billing Grace Period in App Store Connect

- Owner as stated: founder. Due: not stated.
- FIN F10 (`functions/finance.md`): Billing Grace Period in App Store Connect Default: Off (recommendation: On, 16 days, paid renewals only: no lost days of paid service when recovered (V7); trial-to-paid failures excluded)

**QI-63** Engage an accountant before the first payout (CR-120)

- Owner as stated: founder (engages accountant). Due: before the first payout (CR-120) (stated).
- FIN F13 (`functions/finance.md`): Engage an accountant before the first payout (CR-120) Default: Not engaged (CR-120 stays Gap) (recommendation: Yes, with the brief below)

**QI-64** May the server `insights` aggregates be read in the 1.0 line?

- Owner as stated: founder. Due: not stated.
- DAT FQ-01 (`functions/data-and-measurement.md`): May the server `insights` aggregates be read in the 1.0 line? Default: No. The frame does not list them as a source, INSIGHTS_LOOP is superseded for v1.0, what production holds is unknown to sessions, and at C1 size k = 10 suppresses nearly every cell. Revisit after launch with a runbook and audit row (FR-DAT-28)
- FRs cited: DAT-28

**QI-65** Minimum first-time downloads before the allowance rule fires: 500 (D-125) or 1,000 (F14 6.9)?

- Owner as stated: founder. Due: not stated.
- DAT FQ-02 (`functions/data-and-measurement.md`): Minimum first-time downloads before the allowance rule fires: 500 (D-125) or 1,000 (F14 6.9)? Default: 500, the later ruling, with the 95% interval printed beside the point. At 500 the interval around 4% runs 2.3% to 5.7%, so a read near the line is close to a coin toss; the founder sees that before acting

**QI-66** Are offer-code starts excluded from the business number?

- Owner as stated: founder. Due: not stated.
- DAT FQ-03 (`functions/data-and-measurement.md`): Are offer-code starts excluded from the business number? Default: Yes; the founder subtracts the codes he gave by hand until ASC's report fields are verified (UNVERIFIED)

**QI-67** Round cadence and length during C1

- Owner as stated: founder. Due: not stated.
- DAT FQ-04 (`functions/data-and-measurement.md`): Round cadence and length during C1 Default: Every 2 weeks, 5 questions at most, Q-NS-1 and Q-FID-1 always

**QI-68** Withdrawal clock for a tester's rows

- Owner as stated: founder. Due: not stated.
- DAT FQ-05 (`functions/data-and-measurement.md`): Withdrawal clock for a tester's rows Default: Deleted within 7 days of the request, dated note

**QI-69** Should sign-up rows that hold only an email be deleted after a period: an address that never confirmed its code (NS-41 O-12), and a confirmed account that never accepted the Terms and holds nothing?

- Owner as stated: Founder (retention). Counsel numbers cited: Q51. Due: not stated.
- PRV PQ-2 (`functions/privacy.md`): Should sign-up rows that hold only an email be deleted after a period: an address that never confirmed its code (NS-41 O-12), and a confirmed account that never accepted the Terms and holds nothing? Default: Yes: never-confirmed rows after 7 days (the card's default); confirmed rows with no Terms and no book after 30 days, by the purge path with a receipt and no email Number: Q51

**QI-70** Once a book has a birthday, may the parent clear the due date, or should it clear itself?

- Owner as stated: Founder. Due: not stated.
- PRV PQ-6 (`functions/privacy.md`): Once a book has a birthday, may the parent clear the due date, or should it clear itself? Default: Keep it, with a Clear control in Me; never clear it without the parent

**QI-71** Leave: ship BL-444 before co-parent is in a store build, or keep the Terms wording "not in the app yet"?

- Owner as stated: founder. Due: not stated.
- LEG L-9 (`functions/legal.md`): Leave: ship BL-444 before co-parent is in a store build, or keep the Terms wording "not in the app yet"? Default: Keep the 0.9.0 wording in the next Terms version; ship Leave before NS-25's store flag Number: founder decision

**QI-72** When ADR 0031 hides A's book and A can no longer sign in, may the phone owner (device passcode) open a hidden book only to Save a copy?

- Owner as stated: founder. Due: not stated.
- SEC Q-S1 (`functions/risk-security.md`): When ADR 0031 hides A's book and A can no longer sign in, may the phone owner (device passcode) open a hidden book only to Save a copy? Default: Yes, only Save a copy, after the owner check and a line naming the risk. It is no weaker than D1, which already lets anyone read a signed-out book, and it keeps the only copy of a voice from being stranded

**QI-73** Fund an independent penetration test before the first person outside the family stores letters on the server?

- Owner as stated: founder (spend). Due: before the first person outside the family stores letters on the server (stated).
- SEC Q-S3 (`functions/risk-security.md`): Fund an independent penetration test before the first person outside the family stores letters on the server? Default: Yes, scoped to sign-in, invite links and codes, Edge Functions, RLS and the iOS build; Asha data only. Without it, say plainly that the R-17 review is self-assessed

**QI-74** Bot check on email send (card O-7)

- Owner as stated: founder. Due: not stated.
- SEC Q-S4 (`functions/risk-security.md`): Bot check on email send (card O-7) Default: Agree with O-7: Turnstile before the public TestFlight link, subprocessor page first, Apple unaffected

## 5. Engineering rows needed

From section 6 of each function file (section 9 of risk-security). 98 source rows merge into 88 entries. New rows carry a working handle NR-nn; the backlog id is Karma's to allocate, and none may be above BL-999 (the dispatcher reads only three-digit ids; privacy and the dispatcher note under BL-999 say so). Sizes are given only where the source gave them; splitting into PRs a reviewer can read in ten minutes is for the engineering thread.

Data's section 6.2 (candidate analytics events) is not an engineering row: none is in the catalogue and adding any is a founder decision while analytics is off (FR-DAT-26), so it is not listed here.

### 5.1 New rows needed

| Handle | Row | Asked by | Owner as stated | FRs | Existing rows named alongside |
|---|---|---|---|---|---|
| NR-01 (new row needed) | New: Help actions on dead-end screens | support | `mobile`, `content` | SUP-02 | - |
| NR-02 (new row needed) | Pin every support mail target (fixed subject, empty body, no ids) | support, privacy | `qa`, `mobile`; FR-PRV-12 | PRV-12, SUP-03 | - |
| NR-03 (new row needed) | Content-rules scans extended (public-surface forbid list, price pattern, help content) | support, marketing, finance | `content`; content | FIN-09, MKT-02, SUP-06 | - |
| NR-04 (new row needed) | New: Helpline freshness on the release calendar | support | `support`, `content` | none cited | - |
| NR-05 (new row needed) | New: Struggling page before a book | support | `mobile` | SUP-18 | - |
| NR-06 (new row needed) | New: Safety-removal tool and runbook | support | `data-architect`, `ops`, counsel | POL-04 | - |
| NR-07 (new row needed) | New: CSAM report procedure | support | founder, counsel | POL-02 | - |
| NR-08 (new row needed) | New: `docs/support/` on `develop` | support | `support` | none cited | - |
| NR-09 (new row needed) | Claims-capability map for new flags | marketing | content, mobile | none cited | - |
| NR-10 (new row needed) | Website three tabs and claim fixes | marketing | web owner | none cited | - |
| NR-11 (new row needed) | Reference FAQ and /about fixes | marketing | content | none cited | - |
| NR-12 (new row needed) | Notification class allow-list test | marketing | mobile | MKT-20 | - |
| NR-13 (new row needed) | Rating request (F13-REQ-020) | marketing | mobile | MKT-23 | - |
| NR-14 (new row needed) | Store art pipeline | marketing | design-systems, marketing | none cited | - |
| NR-15 (new row needed) | Store-candidate gate record and claims diff generator | marketing, compliance | qa, release; FR-CMP-11 | CMP-11 | - |
| NR-16 (new row needed) | `minSupportedVersion` consumer and the E-S16 line, App Store link from `packages/brand` (G-E03, FR-OPS-25) | operations | mobile | OPS-25 | - |
| NR-17 (new row needed) | Sync classifies 402, 5xx and read-only errors as retryable and never as rejected writes; a test with each (FR-OPS-14) | operations | sync | OPS-14 | - |
| NR-18 (new row needed) | Weekly Free-limits job reads Storage and egress, and NOT CHECKED fails | operations, finance | ops; `ops` | FIN-03, OPS-12 | - |
| NR-19 (new row needed) | Suspend one account's sign-in without deleting it, with a test (FR-OPS-09; sanctions gap) | operations | data-architect, security-architect | OPS-09 | - |
| NR-20 (new row needed) | Restore drill covers new columns and proves the purge replay | operations, privacy | ops, data-architect; FR-PRV-09 | OPS-07, OPS-08, PRV-09 | - |
| NR-21 (new row needed) | Status page on the website, static, founder-published (FR-OPS-20) | operations | web, content | OPS-20 | - |
| NR-22 (new row needed) | New (ops docs): Runbook edits: kill switches (new), suspected leak, restore drill, data requests, sign-everyone-out record, TDD 06 5.6 and RB-3 re [cont. in source] | operations | ops | OPS-01, OPS-04, OPS-05, OPS-07, OPS-18, OPS-19 | - |
| NR-23 (new row needed) | New: bytes per letter, held draft and version on the Asha fixture | finance | `data-architect` | FIN-04 | - |
| NR-24 (new row needed) | New: refund and revocation test | finance | payments engineer (`mobile`) | FIN-11 | - |
| NR-25 (new row needed) | New: build ledger | finance | `ops` | FIN-06 | - |
| NR-26 (new row needed) | New: R2 storage line in `publish` output (FR-FIN-08) | finance | `ops` | FIN-08 | - |
| NR-27 (new row needed) | New: listing price from one source (FR-FIN-10) | finance | `content` | FIN-10 | - |
| NR-28 (new row needed) | New row, user-research, S: `docs/research/QUESTION-BANK.md`, the round plan, the tester guide, and a read-out template with the section 3.2 tables (FR-DAT-04 [cont. in source] | data | see source | DAT-04, DAT-05, DAT-06, DAT-07, DAT-08, DAT-13 | - |
| NR-29 (new row needed) | New row, analytics, S, needs-decision (FOUNDER, because it changes what could be collected): when v1.1 planning starts, the catalogue PR of FR-DAT-26 and section 6.2 candidates. Not before. | data | see source | DAT-26 | - |
| NR-30 (new row needed) | New row, analytics, S: a test that fails if any 1.0.x profile in `eas.json` sets `EXPO_PUBLIC_ANALYTICS` on, if none exists (FR-DAT-01). I did not check  [cont. in source] | data | see source | DAT-01 | - |
| NR-31 (new row needed) | New row, data-architect, M, only if FQ-01 is answered yes: an `insights` view for weekly making families that counts held letters, with grants in its own migration and in `supabase/tests/gr [cont. in source] | data | see source | none cited | - |
| NR-32 (new row needed) | Log canary with new-field fixtures (Find queries, labels, From names, typed days, photo paths) | privacy, security | FR-PRV-10; privacy, qa | PRV-10, SEC-18 | - |
| NR-33 (new row needed) | New (mobile): Error-message scan (FR-PRV-11) and route-registry scan (FR-PRV-13) | privacy | FR-PRV-11, 13 | PRV-11, PRV-13 | - |
| NR-34 (new row needed) | New (sync, data-architect): Server call to empty withheld words (errata E7 already asks for this row) | privacy | FR-PRV-19 | PRV-19 | - |
| NR-35 (new row needed) | New (sync, data-architect): `sync_pull` consent check (FR-PRV-20), beside errata E9's phone rule | privacy | FR-PRV-20 | PRV-20 | - |
| NR-36 (new row needed) | New (mobile): Erase scan test (FR-PRV-34) | privacy | FR-PRV-34 | PRV-34 | - |
| NR-37 (new row needed) | New (mobile): Apple scope to email only (FR-PRV-35, NS-41 O-8) | privacy | FR-PRV-35 | PRV-35 | - |
| NR-38 (new row needed) | New (data-architect), founder-gated: Purge of never-confirmed sign-up rows after 7 days (NS-41 O-12), and of confirmed accounts that never accepted the Terms if the fo [cont. in source] | privacy | FR-PRV-05 | PRV-05 | - |
| NR-39 (new row needed) | New (privacy, platform): Read the Supabase Auth audit log retention for the production plan and record it in data-policy 4.2 (OQ-5) | privacy | FR-PRV-26 | PRV-26 | - |
| NR-40 (new row needed) | Content test: the account-deletion texts name only systems the build's flags turn on (status report, analytics, pictures, seals).  [cont. in source] | legal | FR-LEG-02 | LEG-02 | - |
| NR-41 (new row needed) | Consent records: rendered text hash, app build, OS, locale, allowed method on every call site | legal | FR-LEG-09 | LEG-09 | - |
| NR-42 (new row needed) | PDF font allowlist test, and move Amiri and Noto Serif SC with their OFL notices into the shared fonts folder if the PDF uses them | legal | FR-LEG-12 | LEG-12 | - |
| NR-43 (new row needed) | Tag the NS-16 flag child-input in the flag registry | legal | FR-LEG-15 | LEG-15 | - |
| NR-44 (new row needed) | Seal options scan: no age-keyed preset or string (NS-06 B) | legal | FR-LEG-07 | LEG-07 | - |
| NR-45 (new row needed) | New (or BL-404 scope): Report a concern in Me, Help (LEGAL-REQ-056), no content prefill | legal | FR-LEG-10 | LEG-10 | BL-404 |
| NR-46 (new row needed) | Notes for Review check: flags on in `production` versus Notes sections | compliance | FR-CMP-03 | CMP-03 | - |
| NR-47 (new row needed) | Declared Age Range on iOS 26+: request at launch, minor signal stops like the gate, nothing stored; unit test with an injected sig [cont. in source] | compliance | FR-CMP-15 | CMP-15 | - |
| NR-48 (new row needed) | Sensitive-data consent withdrawal control | compliance | FR-CMP-16 | CMP-16 | - |
| NR-49 (new row needed) | Code field: `textContentType` one-time code and paste on E-S06 (check what is built first) | compliance | FR-CMP-09 | CMP-09 | - |
| NR-50 (new row needed) | Register update (FR-CMP-01) and label file update (FR-CMP-04): docs rows for `legal` and `privacy` | compliance | FR-CMP-01, -04 | CMP-01, CMP-04 | - |
| NR-51 (new row needed) | ADR 0031 (write): One phone, two accounts, as in eval C 1.4, plus the founder answer to Q-S1 | security | principal-architect, security-architect | none cited | - |
| NR-52 (new row needed) | Owner-check helper over `expo-local-authentication` for Erase everything and Delete account (FR-SEC-06) | security | mobile | SEC-06 | - |
| NR-53 (new row needed) | Invite brake event and alert (FR-SEC-10); DMARC report reading while sign-in is public (FR-SEC-11) | security | security, ops | SEC-10, SEC-11 | - |
| NR-54 (new row needed) | `scripts/guards/native-intake.mjs`: fails a PR that changes the lockfile or `apps/mobile/modules/**` together with unrelated code, [cont. in source] | security | security | SEC-14 | - |
| NR-55 (new row needed) | Hostile signed remote-config test (FR-SEC-16) | security | mobile | SEC-16 | - |
| NR-56 (new row needed) | `security_events` table and writers for the new acts (FR-SEC-20, SEC-R24) | security | data-architect | SEC-20 | - |

Merged duplicates (same row asked by more than one function): NR-02 = support New: Mail URL test, privacy New (mobile); NR-03 = support New: Help content in the rules scan, marketing Public-surface forbid scan, finance New: price scan in content rules; NR-15 = marketing Store candidate claims diff, compliance New; NR-18 = operations New, finance New: weekly limits job reads Storage and egress; NR-20 = operations New, privacy New (ops, sync); NR-32 = privacy New (qa, platform), security New.

### 5.2 Existing backlog rows to change

| BL row | Status in BACKLOG.md | What each function asks to add or change | FRs |
|---|---|---|---|
| BL-551 | BL-551 (listed in an older format; see BACKLOG.md) | support: Raise in priority: Route 1 and the under-18 promise depend on it (SUP-14, POL-07) | POL-07, SUP-14 |
| BL-552, BL-597, BL-598 | BL-552 (listed in an older format; see BACKLOG.md), BL-597 deferred, BL-598 deferred | support: Needed before NS-25 ships (SUP-13) | SUP-13 |
| BL-367 | BL-367 needs-decision | support: Founder decision on the mailbox route and the `privacy@` alias (SUP-23) | SUP-23 |
| BL-783 | BL-783 needs-founder | support: The data-request replies name the path the app shows (SUP-15) | SUP-15 |
| BL-105 | BL-105 deferred | support: Clinician read of the struggling page and of macro M6 (SUP-16, SUP-17) | SUP-16, SUP-17 |
| BL-109 | BL-109 needs-founder | marketing: Coverage and recruitment drafts (FR-MKT-26) | MKT-26 |
| BL-958, BL-988 | BL-958 ready, BL-988 in-progress | operations: Widen from two flags to every card flag; add the gate record and the unknown-flag allowlist (FR-OPS-22, 23); add the `release-ios.yml` call as a proposal; finance: The G6 gate record gains a "run cost" column for cards in FR-FIN-02; privacy: Preflight SDK guard (FR-PRV-31) (the PRV row asks for a new preflight SDK guard, so this entry is existing BL-958 plus new scope) | FIN-02, OPS-22, OPS-23, PRV-31 |
| BL-976 | BL-976 blocked | operations: Add the on and off runbooks and the evidence page (FR-OPS-15, 16) | OPS-15, OPS-16 |
| BL-929, BL-948 | BL-929 ready, BL-948 blocked | operations: One run sheet per candidate including the E system-state rows (FR-OPS-30) | OPS-30 |
| BL-965 | BL-965 ready | finance: Carries `plusLine` "stay free" and the `plan.retry` wording fix | - |
| BL-981 | BL-981 blocked | data: add the NS-06 B study; correct the section references (study lines are in NS-01 section 21, NS-02 section 21, NS-05 section 20, NS-06 A20, B20); add "lines written before day 0" (FR-DAT-10). | DAT-10 |
| BL-485 | BL-485 needs-decision | privacy: Move from needs-decision to ready once PQ-1 has a default the founder accepts; scope FR-PRV-01 | PRV-01 |
| BL-577 | BL-577 deferred | privacy: Undefer: the consent builder with `rendered_sha256`, `app_build`, `os_major` and the shown locale, before any store build writes more rows | PRV-02, PRV-03 |
| BL-960 | BL-960 ready | privacy: Unchanged scope; it is the gate for FR-PRV-06 and gains FR-PRV-08's rows (GitHub dump, drill copy) | PRV-06, PRV-08 |
| BL-961 | BL-961 ready | privacy: Gains FR-PRV-07's registry as the source the `[X4-R1]` test enumerates, and the C G2, E1, E9, E10 items; security: Scope adds: `hasLocalBook` filtered by owner (FR-SEC-01); B's letters never stuck behind a phone-wide owner (FR-SEC-02); hidden-book surfaces (FR-SEC-03); the four split test ids (CC-2). Size moves from M to L | PRV-07, PRV-14, PRV-15, SEC-01, SEC-02, SEC-03 |
| BL-962 | BL-962 ready | privacy: Gains the full API list of FR-PRV-17 and the E-S08 signs-as field; on React Native, record the finding with the native fallback | PRV-16, PRV-17 |
| BL-975 | BL-975 ready | privacy: Gains check (d) | PRV-29 |
| BL-979 | BL-979 blocked | privacy: Gains FR-PRV-21 (versions in the author's copy or the manifest line) | PRV-21 |
| BL-980 | BL-980 blocked | privacy: Gains FR-PRV-22 (correction of the From name) after PQ-4 | PRV-22 |
| BL-994 | BL-994 in-progress | privacy: `privacy` reviews NS-42 to NS-45 before lock against FR-PRV-02, 04, 14, 15, 18, 24 to 28 and 35, and the class corrections in section 5 | PRV-02, PRV-04, PRV-14, PRV-15, PRV-18, PRV-24, PRV-25, PRV-26, PRV-27, PRV-28, PRV-35 |
| BL-579 | BL-579 deferred | privacy: Undefer with BL-577: upload the local agreement rows unchanged at first sign-in | PRV-02 |
| BL-444 | BL-444 ready | legal: Either ship Leave before NS-25's store flag, or record that the Terms keep the "not in the app yet" wording | LEG-03 |
| BL-104 | BL-104 needs-founder | legal: Counsel packet 1.6.0 (FR-LEG-18) before engagement | LEG-18 |
| BL-404 | BL-404 ready | compliance: Accessibility statement and its Help link (scope already names it) | CMP-10 |
| BL-119 | BL-119 ready | compliance: `child-input` tag on the NS-16 flag | CMP-14 |

### 5.3 Changes to other existing items (PRs, ADRs, docs) and notes

| Item | Asked by | What |
|---|---|---|
| #798 split | operations | The first PR adds `bookSearch` to `KILL_SWITCH_KEYS` with the M14-style parse test (FR-OPS-02) |
| Existing note | operations | Dispatcher id format beyond BL-999 (BACKLOG note under BL-999) |
| TRACKING_PLAN.md (change, analytics) | data | North Star text says WKF; the frame says WMF with WKF beside it. Update at v1.1 planning. The CDO skill says 70 events; the catalogue has 68. |
| qa run sheet template (change) | data | FR-DAT-15 columns. |
| Note | privacy | BL-1000 and later ids are invisible to the dispatcher (BL-999 note); Karma allocates ids |
| #819 rework | compliance | Trace sees NS ids (G0) |
| Existing, unblock | security | `SECURITY.md`, `docs/ops/INCIDENT.md`, `docs/ops/SECRETS.md`, threat model (SEC-R01, R02, R23); SHA pins in `ci.yml` (SEC-R10) |

Related pairs to keep together when the rows are written: BL-485 (privacy) and the compliance withdrawal control are the same control; BL-577 (privacy) and the legal consent-record row are the same record writer; the BL-961 change (privacy and security) must list the four split test ids from the security proposal CC-2 (R-014 in 3b).

## 6. Design: function needs per e2e area, for the design leads

Each area lead records these as "Function needs accounted for" with the FR id (BRIEF step 5). 6.x.1 is every design-needs row the functions filed (section 4 of their files; section 7 of risk-security) whose screen id is in that area; 6.x.2 is the FRs whose Links column names a screen of the area but that no function filed a design-needs row for (the design response is then the FR requirement itself; read it in section 1). Screen ids are as written by the function; ids are checked against the five `DESIGN.md` files (section 7). A row naming screens in two areas appears in both. The design response is copied from the function row; it is a request, not a ruling.

### 6.1 A. Capture

Design folder: `docs/design/e2e/A-capture/`.

Conflicts in section 3a that touch this area: K2 (the Home Plus line sits on A-S01).

**6.1.1 Design-needs rows filed by the functions**

| From | Screen or state | Design response needed | FR ids |
|---|---|---|---|
| marketing | A-S01 Home | Frame 1 recaptured with the Home tab label (not Tonight); no Plus line (E-S26) and no slip in the frame | MKT-05, MKT-15, MKT-24 |
| marketing | A-S07 Review | Frame 2 as today; letter words in Asha's fixture only | MKT-12 |
| marketing | A-S03 and B-S11 Picture | New frame at NS-01: an illustrated or licensed picture; no face of a real child; rights record in `docs/store/art/` | MKT-12 |
| marketing | New: rating moment | A state on B-S01 after A-S13.saved where Apple's request may be called, with the exclusion list of FR-MKT-23 drawn as a state table (new screen state needed) | MKT-23 |
| finance | E-S26 Home Plus line, A-S01.plusLine | Endorse the WORDS CHANGE from "always free" to "stay free": "always" is an open-ended promise (T1, principle 6) | FIN-09 |
| data | A-S13 saved moment; B-S19, B-S20 Read together | No ordinal or total ("your 10th letter", "you read 12 letters"). The existing VoiceOver position line "Letter {n} of {count}" stays (a position, not a total) | DAT-03 |
| privacy | A-S06, A-S07, A-S09, B-S08, B-S11, B-S12, D-S08, E-S08 | No visual change; the writing tools switch is a property of each field. The design spec for each field states "Writing Tools: off" so it is not lost in a component swap | PRV-16 |
| privacy | A-S14 doorways | No doorway shows letter words or a name on a widget, control or Siri response | PRV-17 |
| legal | A-S09 From sheet | Keep "Ask before you record someone else"; add nothing that reads as an attestation (D9). | LEG-15 |
| legal | A-S03 Picker | The NX-33 label line stays absent until counsel's Q43 read (NS-01 section 12). | LEG-01 |
| security | A-S14 doorways, D-S10 | Every widget, control and placeholder string is neutral; no name in any state | SEC-21 |

**6.1.2 FRs naming screens of this area with no design-needs row**

MKT-28 (A-S10); LEG-08 (A-S09)

### 6.2 B. Book and reading

Design folder: `docs/design/e2e/B-book-and-reading/`.

Conflicts in section 3a that touch this area: none.

**6.2.1 Design-needs rows filed by the functions**

| From | Screen or state | Design response needed | FR ids |
|---|---|---|---|
| marketing | A-S03 and B-S11 Picture | New frame at NS-01: an illustrated or licensed picture; no face of a real child; rights record in `docs/store/art/` | MKT-12 |
| marketing | B-S01 The Book | Frame 4 without legible letter counts (crop or a state without month meta) | MKT-13 |
| marketing | B-S06 Find | Optional frame: underline plus medium weight, no count | MKT-13 |
| marketing | B-S12, B-S13 | Optional frames: no count; no lock, wax or vault imagery | MKT-13 |
| marketing | B-S17, B-S18 Home slips | No promotional slip type; no rating ask on a seal-opened day | MKT-23, MKT-24 |
| marketing | B-S19, B-S20 Read together | Frame 5 dark; year title "Asha's first year" allowed; no "year in review" | MKT-03 |
| marketing | New: rating moment | A state on B-S01 after A-S13.saved where Apple's request may be called, with the exclusion list of FR-MKT-23 drawn as a state table (new screen state needed) | MKT-23 |
| data | A-S13 saved moment; B-S19, B-S20 Read together | No ordinal or total ("your 10th letter", "you read 12 letters"). The existing VoiceOver position line "Letter {n} of {count}" stays (a position, not a total) | DAT-03 |
| data | B-S07 year rows, B-S01 month openers | As drawn: year rows carry no subtitle; lens month openers carry no count line | DAT-03 |
| privacy | B-S08 letter page | The From name row: an author-only Change action, or one line that the name cannot be changed (FR-PRV-22, per Karma's ruling) | PRV-22 |
| privacy | A-S06, A-S07, A-S09, B-S08, B-S11, B-S12, D-S08, E-S08 | No visual change; the writing tools switch is a property of each field. The design spec for each field states "Writing Tools: off" so it is not lost in a component swap | PRV-16 |
| legal | B-S13 Hide until a day | The honest limits as NS-06 B12 lists, plus "Only you can see it until then; we never send it to anyone". No age presets in the picker; a date only. Counsel reads. | LEG-06, LEG-07 |
| legal | B-S16 Sealed card, B-S22 Recently deleted | No words, no countdown; nothing else from legal. | LEG-06 |
| compliance | E-S03, E-S07, E-S10, E-S11, C-S20, D-S13, D-S16, D-S02, B-S13 | AX5 with Bold Text and VoiceOver layouts drawn and walked; links announced as links; no truncated agreement text | CMP-07 |
| compliance | B-S11, B-S12 | If T4 is not confirmed against 2.2.1, an untimed way back (add the picture or the mark again) is visible on the letter page | CMP-08 |
| security | Every L4 screen | `.backgrounded` state drawn blank (as B-S04 already does for pictures) | SEC-22 |

**6.2.2 FRs naming screens of this area with no design-needs row**

LEG-01 (B-S11); LEG-08 (B-S12, B-S13)

### 6.3 C. Keeping and trust

Design folder: `docs/design/e2e/C-keeping-and-trust/`.

Conflicts in section 3a that touch this area: K4 (C-S20 deletion lines), K9 (C-S23 proposed by privacy).

**6.3.1 Design-needs rows filed by the functions**

| From | Screen or state | Design response needed | FR ids |
|---|---|---|---|
| support | C-S01 Me, "Help and legal" | Draw the built section (Help with trailing "Write to us", "If you are struggling", Legal) in every C-S01 state: `.signedout`, `.local`, `.second-account`, `.lapsed`, killswitch, `.ax5`. Design lists it only as "as built" (C DESIGN line 315) | SUP-01, SUP-17 |
| support | C-S04 `.error-tooBig` | Built ("Write to us"). The words under it should say what happens next ("We'll reply with a way to save it in parts", intent, only if FR-SUP-07 M16 has a real answer) | SUP-07 |
| support | C-S05 printable failed (`exportCopy.printable.failed`) | On a second failure, offer "Write to us" | SUP-20 |
| marketing | C-S08 Where your letters live | Source for the privacy frame (frame 6); its words follow the label in force (section 3b) | MKT-16, MKT-29 |
| finance | C-S18 Storage | No change; the parent's phone space for pictures is theirs and the screen already names it (for: NS-01) | (none cited in the row) |
| data | C-S04 Save a copy | Keep "What is inside" as words with no numbers, as drawn. Do not add counts back for measurement; testers read `manifest.json` (FR-DAT-13) | DAT-03, DAT-13 |
| privacy | New screen: Privacy in Me (proposed id C-S23) | Draw the built `app/settings/privacy.tsx` with every state in FR-PRV-33; the sensitive-data row becomes pressable and opens the withdrawal sheet; the iPhone backup line; Who can see it; App lock and names rows; Save a copy, Recently deleted, and Erase everything when signed out; the two documents | PRV-01, PRV-33 |
| privacy | New sheet: Stop syncing letters (proposed C-S23.withdraw) | Door lines: Shown (what stops, what stays, Save a copy, Delete account); Records (one PRIV-R21 row); Never (a deletion as a side effect; a preselected choice); Decline (Cancel, first and default, records nothing). Two equal buttons, Cancel first, AX5 on SE 3 | PRV-01 |
| privacy | C-S03 Sign-out sheet | As drawn (D1 lines, pictures variant, "Sign out and erase this phone") | PRV-15 |
| privacy | C-S19 Erase everything | `.signedoutSynced` body variant and the "every book on this phone" line (G2, K-E04); the after-erase announcement | PRV-15, PRV-34 |
| privacy | C-S20 Delete account | The retained-data lines of FR-PRV-18 in `C-S20.what`, each one line, AX5 without truncation; the Plus card only when Plus renews; reachable from C-S11.declined (E8) | PRV-18 |
| privacy | C-S04 Save a copy | A manifest line when server-held data (earlier versions) is not in the copy, PROPOSED, only if FR-PRV-21 takes that option | PRV-21 |
| privacy | C-S15 A book in Me | "Clear the due date" when a birthday exists, if the founder takes PQ-6 | PRV-23 |
| legal | C-S20 Delete account | Lines for pictures and the Find index (stay on this phone until Erase everything), hidden-until letters (deleted with the account), and no line about a status report or analytics the build does not have. State for photos on and off; seals on and off. Counsel reads. | LEG-02 |
| legal | C-S19 Erase everything | Names pictures among what is erased (already in NS-01-R52 scope; confirm the words name them). | LEG-02 |
| legal | C-S05 Making the printable book | No licence text is needed inside the PDF (OFL FAQ 1.10, embedded in a document) [S5]; no design change. Me, Licences (C-S01 path) lists the faces. | LEG-12 |
| legal | C-S11 Returning consent sheet | Records with an allowed method (FR-LEG-09); no design change. | LEG-09 |
| legal | C-S21 Recording backup (flip only) | The consent sheet with D-102 wording and the versioned Privacy 4 link; decline and withdraw states. Drawn now, built at the flip. | LEG-16 |
| compliance | E-S03, E-S07, E-S10, E-S11, C-S20, D-S13, D-S16, D-S02, B-S13 | AX5 with Bold Text and VoiceOver layouts drawn and walked; links announced as links; no truncated agreement text | CMP-07 |
| compliance | C-S01 Me, Privacy and Help | Withdrawal control for the sensitive-data consent (FR-CMP-16); accessibility statement link (FR-CMP-10); Delete account visible in store builds (FR-CMP-17) | CMP-10, CMP-16, CMP-17 |
| security | C-S03 sign-out sheet | Add a secondary "Turn on App lock" action when App lock is off, under the D1 lines | SEC-07 |
| security | C-S19 Erase everything | After the confirm, the system owner check (Face ID or passcode); cancel returns to the confirm unchanged; new state `.ownerCheckCancelled` (no message) | SEC-06 |
| security | C-S04.ready, C-S05.ready | One line (PROPOSED intent): "Anyone who has this file can read and hear everything in it." | SEC-08 |
| security | E-S22, C-S03, Me | App lock offered in Me and on the sign-out sheet only; nothing at the end of first run | SEC-07, SEC-25 |

**6.3.2 FRs naming screens of this area with no design-needs row**

SUP-13 (C-S02); SUP-14 (C-S20); MKT-23 (C-S19, C-S20); MKT-24 (C-S06); DAT-02 (C-S01, C-S04); PRV-03 (C-S04); PRV-05 (C-S11.declined); PRV-20 (C-S11.declined); PRV-27 (C-S10); SEC-04 (C-S19); SEC-12 (C-S02, C-S20)

### 6.4 D. Family, sharing and reminders

Design folder: `docs/design/e2e/D-family-sharing-reminders/`.

Conflicts in section 3a that touch this area: none.

**6.4.1 Design-needs rows filed by the functions**

| From | Screen or state | Design response needed | FR ids |
|---|---|---|---|
| support | D-S19 (co-parent removal after 72 hours) | Design says "Removal after that is the support runbook only" (D DESIGN line 181). Nothing in the app may point a parent to that runbook until POL-04 exists | POL-04 |
| marketing | D-S01 to D-S03 Share | Frame from D-S02 only; picture toggle off; no third-party app icons; no "tell a friend" after the sheet closes (D G2: focus returns to Share) | MKT-14, MKT-19 |
| marketing | D-S06, D-S10 Reminders | If a reminders frame is used, the lock screen shows the neutral placeholder, never a child's name | MKT-20 |
| marketing | D-S10, D-S11 Notifications | No class or body that announces a feature, offer or rating | MKT-20 |
| finance | E-S25 Plan reminder note; D-S10 `plan` class; D-S11.plan | No price, amount, trial length or child name (already NS-32-R12); the lock-screen placeholder "A reminder about your plan" | FIN-09 |
| data | D-S23 pilot artefacts | Read-out template: counts only, x of n, no quotes; Script B stays as written | DAT-08 |
| privacy | D-S13 Invite sheet | The health-details line of FR-PRV-32, after counsel | PRV-32 |
| privacy | A-S06, A-S07, A-S09, B-S08, B-S11, B-S12, D-S08, E-S08 | No visual change; the writing tools switch is a property of each field. The design spec for each field states "Writing Tools: off" so it is not lost in a component swap | PRV-16 |
| privacy | D-S10 Lock screen | As drawn (neutral by default, placeholder when previews are hidden) (for: NS-13, NS-32) | (none cited in the row) |
| legal | D-S13 Invite sheet, D-S16 Accept | Add the removal rule (72-hour undo by the inviter, then no removal) and one line on where to go if someone feels unsafe; the accept sheet's Terms link opens the version recorded. Counsel reads. | LEG-10 |
| legal | D-S18 Family page | No Leave row and no "coming soon" (D-161, D-113); if BL-444 ships first, Leave with the choice "leave my letters in the book" or "take them out", nothing preselected (Terms 4.3). | LEG-03 |
| legal | D-S02 Share preview | Keep the where-it-goes line (R24). When the picture toggle is on, one line that the picture goes wherever the letter goes. No "private" or "secure" word. Counsel reads with Q45 and Q43. | LEG-05 |
| legal | D-S23 Pilot artefacts | Consent W and V shown with their version; withdrawal line "we delete your notes" (NS-03 section 15). | LEG-11 |
| compliance | E-S03, E-S07, E-S10, E-S11, C-S20, D-S13, D-S16, D-S02, B-S13 | AX5 with Bold Text and VoiceOver layouts drawn and walked; links announced as links; no truncated agreement text | CMP-07 |
| compliance | D-S14 Invite link page (web) | Path through the age gate before accept on a new install; WCAG AA on the web page; privacy link | CMP-07, CMP-13 |
| security | D-S18 Family page | `.undo-open` names who joined in the first line, with Undo | SEC-09 |
| security | D-S16 | Error line for `codes_paused` that suggests asking for the link instead | SEC-10 |
| security | A-S14 doorways, D-S10 | Every widget, control and placeholder string is neutral; no name in any state | SEC-21 |

**6.4.2 FRs naming screens of this area with no design-needs row**

MKT-25 (D-S23); LEG-08 (D-S08); LEG-09 (D-S16); SEC-23 (D-S14)

### 6.5 E. Foundations and system states

Design folder: `docs/design/e2e/E-foundations-and-system-states/`.

Conflicts in section 3a that touch this area: K2 (E-S26 line), K5 (E-S03 minor-signal state versus "store nothing"), K9 (E-S27 and E-S28 are taken; E-ST47 is free), K10 (E-S03 country count).

**6.5.1 Design-needs rows filed by the functions**

| From | Screen or state | Design response needed | FR ids |
|---|---|---|---|
| support | New screen needed: "If you are struggling" and "Lines in other countries" | No e2e area gives these screens an id (grep of every DESIGN.md finds none). Propose E-S27 and E-S28, drawn from `STRUGGLING.md`, with states: a region with lines, the IN case (emergency and directory only), any other region, iPad or no SIM (the Copy fallback), offline (the directory link needs a connection), VoiceOver, AX5 | SUP-17 |
| support | E-S06.help | "Write to us" becomes a tappable text button (the mail target with a sign-in subject). Drop Google from `auth.noEmailHelp` (CG13) | SUP-02 |
| support | E-S01.recovery | After "It did not open this time either.", add a "Write to us" text button below "Export what's readable". The readme inside the export must name the address | SUP-02 |
| support | E-S13 (and the proposed E-S13.noBook) | On a second fault in one session, add "Write to us" below "Go to Home" | SUP-02 |
| support | E-S09 `noBook`, `accountDeleted` | Add "Write to us" as the last, quietest action | SUP-02 |
| support | E-S02 or E-S14 | A quiet "If you are struggling" link that does not need an account, unless proof shows Me is reachable before the first book | SUP-18 |
| support | Error code: launch fault, `exportNothing`, `exportFailed` (4.5) | Parent line: "The book could not open" / what support needs: M20, plus an article "If the book does not open" that never promises recovery | (none cited in the row) |
| support | Error code: `GlobalErrorCode` fatal, repeated (4.5) | Parent line: "This page did not open" / what support needs: M20 | (none cited in the row) |
| support | Error code: `deleted`, `deleted`/`purged` on a new phone (4.1) | Parent line: "This account was deleted on another phone." / what support needs: M9 variant: we cannot restore a deleted account after its 30 days | (none cited in the row) |
| support | Error code: account has no book (4.3) | Parent line: "No book here yet" / "Did you use a different way to sign in last time?" / what support needs: M9 | (none cited in the row) |
| support | Error code: `code_paused`, `email_wait`, `rate_limited`, no email after a minute (4.2) | Parent line: "You can try a code again in 15 minutes." and others / what support needs: M11 | (none cited in the row) |
| support | Error code: `under_18` (4.2) | Parent line: "{app} is currently for adults 18 and over" / what support needs: POL-07, and an article line on "I answered by mistake" if counsel keeps it (CG14) | (none cited in the row) |
| support | Error code: `other_phone`, `other_phone_spent`, `already_signed_in` (4.2) | Parent line: the refused-link lines / what support needs: Signing-in article | (none cited in the row) |
| support | Error code: `last_parent`, `parents_full`, `invite_unusable` (4.1) | Parent line: area D's lines / what support needs: Co-parent article (held until NS-25) | (none cited in the row) |
| support | Error code: restore purchases nothing or failed (4.6) | Parent line: "No Plus was found for this Apple Account." / what support needs: M8 | (none cited in the row) |
| support | Error code: Export `tooBig` (4.6) | Parent line: "This book is too big for one file" / what support needs: M16 | (none cited in the row) |
| support | Error code: `print_pdf_failed` (4.6) | Parent line: "The book could not be made this time." / what support needs: Article line; M20 on repeat | (none cited in the row) |
| support | Error code: `JobFailure.file_missing` (4.4) | Parent line: "The recording did not save" / what support needs: Article line: we hold no copy (FR-SUP-21) | (none cited in the row) |
| support | Error code: `quota_full` (4.1, HOLD) | Parent line: "Write to us and we'll help." / what support needs: A macro must exist before backup turns on, or the line changes | (none cited in the row) |
| support | Error code: `consent_required` `family-share` (4.1) | Parent line: "Update {app} to see it, then try again." / what support needs: none (self-fix) | (none cited in the row) |
| support | Error code: `upgrade_required`, `gone` (4.1), NS-45 | Parent line: "This version of {app} can no longer reach your account." / what support needs: Article "Updating the app" (iOS too old for the current version: say what still works) | (none cited in the row) |
| marketing | E-S27 App Store page | A storyboard of up to 10 frames, ordered so frames 1 to 3 tell the five-second story in search ("talk", "your words, every change marked", "your voice kept"); each frame names its source screen id, build, flag state and claims row; one dark-mode frame | MKT-01, MKT-12, MKT-13 |
| marketing | E-S02 Welcome | Descriptor matches the store subtitle's promise; no price, no trial, no tour (as designed) | MKT-21, MKT-33 |
| marketing | E-S10 Keep gate, E-S26 Plus line | No testimonial, rating, count, discount or countdown (as designed); a note that a rating request is never made in a session where E-S10 showed | MKT-22, MKT-23 |
| marketing | E-S16 App update line, NS-45 | The update line never lists features; What's New lives on Apple's page | MKT-09, MKT-21 |
| operations | E-ST13c | Withdraw `shareLetter`, `firsts`, `seals`, `printBook`, `quickCapture`, `earlierVersions`, `signAsOther` as pause keys: the cards say none and GAP-LOG B E-03 ruled "cards win". Render for these: "build flag only; no remote state" | OPS-01 |
| operations | E-ST05, K-E07, G-E12 | Ops supports the paused Sync value ("Paused for now", PROPOSED): the founder pauses `sync` during a restore (FR-OPS-07), and "Waiting for a connection" would send parents to check their Wi-Fi | OPS-07, OPS-14 |
| operations | E-ST02 | Add the restricted-project case (402 or read-only) to the trigger column: same render as an outage | OPS-14 |
| operations | New state E-ST47 (proposed id) | "Server restored": everyone is signed out once (sessions not in the dump) and phones re-upload. Render as E-ST17 (J-E21): book stays, `session_expired` once in Me, nothing on Home | OPS-07 |
| operations | E-S14 | Confirm Start on this phone is shown for every outage kind on first run, not only some codes, and name the device row | OPS-33 |
| operations | E-S16, E-ST18, J-E15 | Keep "never blocks". If NS-45 adds a "required" state, it is the same line with stronger words, never a lock screen, because a lock would stop reading and export (LEGAL-REQ-040) | OPS-25 |
| operations | E-S13 (K-E06) | Ops agrees with the default: the safety sentence only on the React boundary path, never after a database failure | OPS-20 |
| operations | E design section 9 matrix | Add the system-state rows of FR-OPS-30 to the E-S23 matrix so one sheet carries them | OPS-30 |
| finance | E-S10 Keep gate (all states) | Keep as designed: no price, trial, count or countdown; "Redeem a code" opens Apple's redemption sheet only | FIN-09, FIN-13 |
| finance | E-S11 Plan in Me, `.grace` and `.retry` | Add a quiet action that opens Apple's billing page (`https://apps.apple.com/account/billing`); no price, no date countdown; replace "safe" in `plan.retry` as WORDS flag CG5 proposes | FIN-12 |
| finance | E-S11 Plan, `plan.refund` row | Points to Apple (reportaproblem.apple.com); no in-app refund flow, no form | FIN-11 |
| finance | E-S11.ended after a refund | Confirm the `.ended` state covers a refund or revocation with the same words as a lapse; no word that blames or names the refund | FIN-11 |
| finance | E-S12 Plus confirmed | No price on this screen; plan name, dates, cancel-by and how to cancel only | FIN-09 |
| finance | E-S25 Plan reminder note; D-S10 `plan` class; D-S11.plan | No price, amount, trial length or child name (already NS-32-R12); the lock-screen placeholder "A reminder about your plan" | FIN-09 |
| finance | E-S26 Home Plus line, A-S01.plusLine | Endorse the WORDS CHANGE from "always free" to "stay free": "always" is an open-ended promise (T1, principle 6) | FIN-09 |
| finance | `en.plus.legal.*` above Apple's sheet (E-S10, E-S11) | Keep until counsel retires its two trial-length lines; it is the scan's only allow-list entry | FIN-09 |
| finance | E-S27 App Store page; website | Prices only from `pricing.ts`; a price change updates App Store Connect, `pricing.ts`, the StoreKit file and the listing together | FIN-10 |
| finance | E-S04 to E-S06, E-S14 | Email sign-in failing at the provider's daily cap shows the outage line with Sign in with Apple still offered | FIN-07 |
| data | E-S10 Keep gate, E-S26 Home Plus line, E-S11 Plan | The allowance may be stated as a fact; never as a meter or countdown ("1 left", "2 of 2 used") | DAT-03 |
| data | E-S23 accessibility walk and speed sheet | Columns for phone, iOS, build, runs, p50, p95, unit, budget, met or missed | DAT-15 |
| privacy | E-S02 Welcome | A short notice at collection above the agreement line (what the app collects to make the book, and that letters are never sold, never used for ads and never used to train models), with the Privacy link going to the section on collection. The compliance input reads 11 CCR 7012 as asking for a notice at or before collection and a link to the specific section (I did not read the regulation); F01 asks for a two-sentence notice here (A-REQ-035, K-16) and the built Welcome may not render one (UNVERIFIED). Every sentence needs a claims row | PRV-24, PRV-32 |
| privacy | E-S03 Age gate | No new field. The Terms and Privacy links open the versioned pages. E-S03.region stays HOLD, one line, nothing asked | PRV-04, PRV-25, PRV-26 |
| privacy | E-S05, E-S06 Sign in | No full email on any screen but the field; wrongAccount names the method only (as drawn) | PRV-27 |
| privacy | E-S07 Agreements | One plain line naming what syncs (letters, the child's name and dates; a due date shows a pregnancy), after counsel Q48; versioned links | PRV-28, PRV-32 |
| privacy | E-S08 First book | A short "why we ask" line under the date (the book's chapters follow the child's age), PROPOSED; writing tools off on signs-as; nothing else asked | PRV-16, PRV-24 |
| privacy | E-S18, J-E17, J-C05 | Keep the decision: nothing about A's book on B's screens. Add the K-E02 rule (the book of the account that signed out last shows) to the state table | PRV-14 |
| privacy | A-S06, A-S07, A-S09, B-S08, B-S11, B-S12, D-S08, E-S08 | No visual change; the writing tools switch is a property of each field. The design spec for each field states "Writing Tools: off" so it is not lost in a component swap | PRV-16 |
| privacy | E-S27 App Store page | The privacy label as shipped per FR-PRV-30; screenshots only from the Asha book (D13) | PRV-30 |
| privacy | E-S13 Something broke | The safety sentence follows the claims check (K-E06); no error text shown that carries a path or a name | PRV-11 |
| legal | E-S03 Age gate, E-S07 Agreements | Terms and Privacy links open the exact versions the act records; the agree line is unchanged until FR-LEG-04's rewrite is approved. | LEG-04, LEG-09 |
| compliance | E-S23 Accessibility walk and speed sheet | Add the common tasks Apple names (first launch, login, purchase, settings) and each flag-on card's main flow; one column per declarable feature; pass or fail per task | CMP-06 |
| compliance | E-S03, E-S07, E-S10, E-S11, C-S20, D-S13, D-S16, D-S02, B-S13 | AX5 with Bold Text and VoiceOver layouts drawn and walked; links announced as links; no truncated agreement text | CMP-07 |
| compliance | E-S05, E-S06 | Code field allows paste and one-time-code autofill; no disabled Continue without words (area E K-E11 already) | CMP-09 |
| compliance | E-S01, E-S03 | A state for "platform says a minor": the gate's stop room, same words, nothing stored; drawn now, built for 1 Jan 2027 | CMP-15 |
| compliance | E-S03.region (HOLD, K-E10) | Stays a HOLD; no in-app region check unless counsel asks (Q57) (for: 3d) | (none cited in the row) |
| compliance | E-S27 App Store page | Only declared accessibility features and claims with inventory rows | CMP-06, CMP-20 |
| security | E-S18 (second account) | Draw the states `signedInB-ownerMismatch` (A's book hidden, B's arrives or "No book here yet") and `signedInB-localOnly` (B's letters stay on this phone: one SystemLine, E-S15) | SEC-01, SEC-02, SEC-04 |
| security | E-S06 code screen | Field drawn for 8 digits as well as 6 (O-6); the input's F17 paused state stands | SEC-24 |
| security | E-S22, C-S03, Me | App lock offered in Me and on the sign-out sheet only; nothing at the end of first run | SEC-07, SEC-25 |

**6.5.2 FRs naming screens of this area with no design-needs row**

SUP-12 (E-S11); POL-07 (E-S03); MKT-04 (E-S10, E-S11); MKT-06 (E-S27); MKT-08 (E-S02, E-S14, E-S27); MKT-10 (E-S27); MKT-11 (E-S27); MKT-15 (E-S27); MKT-17 (E-S27); MKT-18 (E-S27); MKT-30 (E-S27); OPS-02 (E-ST13a); OPS-03 (E-ST17); OPS-04 (E-ST29); OPS-10 (E-S05.error-email, E-S06.error-rate, E-S14.outage); OPS-11 (E-ST02, E-ST03); OPS-12 (E-ST02); OPS-13 (E-ST02); OPS-16 (E-ST10, E-ST11); OPS-19 (E-ST01, E-ST02); OPS-31 (E-S27); OPS-36 (E-S14, E-S04.refused-region); DAT-21 (E-S26); DAT-34 (E-S16); DAT-35 (E-S03, E-S04, E-S07); PRV-05 (E-S07.declined); LEG-20 (E-S03, E-S07); CMP-03 (E-S04, E-S07); CMP-13 (E-S03); CMP-16 (E-S07); CMP-18 (E-S02); SEC-05 (E-S24); SEC-22 (E-S22); SEC-11 (E-S05)

### 6.F Needs that name no screen of any area (cross-area, website, artefacts)

| From | Where | Need | FR ids |
|---|---|---|---|
| support | New state: the Help fallback sheet | Mail did not open: address plus Copy (`helpLinks.noMail*`). It exists in code and is not drawn | SUP-01, SUP-22 |
| support | Web: help centre pages and the Support URL | New pages in `apps/web` built from `packages/content`, at the NS-33 floor | SUP-04, SUP-22 |
| marketing | Website (no e2e id) | `site.ts` scenes redrawn with three tabs; any drawn letter uses words from the sample letter, no new real names | MKT-05, MKT-32 |
| operations | New screen needed (website, not the app) | A status page: what works, what waits, no times, no form; dark and light; AX5 reflow; words from `content` with claims rows | OPS-20 |
| finance | Printed book purchase (NS-30) | New screen needed only if NS-30 is ever taken up: a purchase outside Apple, not designed now | FIN-24 |
| data | Every screen, every area | No research question, survey card, feedback composer with counts, or "send us your numbers" control. Nothing here needs a new screen | DAT-02 |
| data | New artefact, not an app screen: tester round message and tester guide | Fixed wording from the question bank; the "numbers only" line; steps to open `manifest.json` in Files; content rules apply. `content` writes, the founder approves | DAT-04, DAT-06, DAT-13 |
| data | No screen | No variant UI for experiments: no arm-specific Keep sheet, allowance line or price display | DAT-20 |
| data | No screen in 1.0 | The analytics consent sheet and its Settings switch are not designed for 1.0 (D-095) | DAT-01 |
| legal | New screen needed: Report a concern (Me, Help) | A plain route for a safety worry or a co-parent problem, opening support with no letter content prefilled (LEGAL-REQ-056). Needed before NS-25 is in a store build, because Terms 4.4's safety limit has no door today. | LEG-10 |

## 7. Checks and findings

### 7.1 Counts reconcile

- FR rows read from the nine files: 272 (support 23; policy 13; marketing 34; operations 36; finance 24; data 35; privacy 35; legal 20; compliance 21; security 25; risk 6).
- Rows in the forward table: 272; distinct FR ids in it: 272; every FR id appears exactly once: yes.
- FR ids written in any of the nine files that have no row: none (every cross-reference resolves).
- Gap in the source numbering: FR-SEC-13 has no row and is cited nowhere. The security author should either fill or retire it.
- Proposed card changes read: 122; rulings after merging: 87. Questions read: 99; index entries: 74. Engineering rows read: 98; entries: 88 (new rows needed: 56).

### 7.2 Card links

- FRs whose Links column names at least one NS card: 168. Frame or every-card only: 33. No NS card in Links but one in the requirement text: 3. No card link at all: 68.
- FRs with no card link at all (the author named decisions, counsel questions, e2e screens, files or code instead of a card row). Per the BRIEF each FR should name a card row or "new card row needed"; these name neither. Suggested card, where shown, comes only from the card 19 screen table:

| FR id | Function | What the Links column names | Suggested card |
|---|---|---|---|
| FR-SUP-02 | support | E-S01, E-S06.help, E-S09, E-S13; WORDS 4.2, 4.3, 4.5; `errors.launch.readme` (BACKLOG line 2224: help offered with no address) | NS-39, NS-41, NS-10 |
| FR-SUP-03 | support | `brand/index.ts:147-149` (LEGAL-REQ-014); J-N18 | none derivable |
| FR-SUP-06 | support | CLAUDE.md content rules; CR-25 | none derivable |
| FR-SUP-09 | support | Mission (charter); runbook section 0 "Never by email"; LEGAL-REQ-014 | none derivable |
| FR-SUP-10 | support | `DATA_CLASSIFICATION.md` (support mailbox is L4); runbook section 0 | none derivable |
| FR-SUP-12 | support | E-S11; `subscription-terms.md` (cancel, refunds, Family Sharing); BL-997 charter | none derivable |
| FR-SUP-14 | support | C-S20, J-C08; runbook Route 1; BL-551 | NS-45 |
| FR-SUP-17 | support | D-034, D-059, CCO-11, FT-36, Q25; `STRUGGLING.md` | none derivable |
| FR-SUP-19 | support | `docs/ops/RELEASE.md`; FR-SUP-05 | none derivable |
| FR-SUP-20 | support | WORDS sections 2 and 4 | none derivable |
| FR-SUP-23 | support | BL-100, BL-367; runbook section 0 | none derivable |
| FR-POL-01 | policy | Terms 9, 10.2, 15 | none derivable |
| FR-POL-02 | policy | Terms 9; Q50 ("CSAM reporting duty") | none derivable |
| FR-POL-06 | policy | runbook section 0; Q50; DSR-R10, R11 | none derivable |
| FR-POL-07 | policy | E-S03 (`ageGate.*`, "I answered by mistake", CG14); Terms 2.1; Q46 | NS-40, NS-42 |
| FR-POL-10 | policy | Terms 10.2; BL-552 | none derivable |
| FR-POL-11 | policy | Q49; Q52 | none derivable |
| FR-POL-12 | policy | charter Never; runbook section 0; PRINCIPLES item 17 | none derivable |
| FR-MKT-02 | marketing | All s19 Claims sections; README appendix A; `packages/content/test/rules.test.ts` | none derivable |
| FR-MKT-22 | marketing | E-S10, E-S26, E-S11; F13-REQ-020; D-082, D-083 | NS-44 |
| FR-MKT-23 | marketing | F13-REQ-020; A-S13, B-S18, B-S19, E-S10, C-S19, C-S20 | NS-44, NS-45 |
| FR-MKT-27 | marketing | `14-test-plan.md` gates; T5; ROADMAP | none derivable |
| FR-MKT-30 | marketing | E-S27; D-075, D-083 | none derivable |
| FR-MKT-32 | marketing | D-118; D13 | none derivable |
| FR-OPS-09 | operations | `sanctions-match.md` gaps table; Q57; D-121, D-137 | none derivable |
| FR-OPS-13 | operations | E-ST02, J-E13 | none derivable |
| FR-OPS-14 | operations | E-ST02, E-ST03, E-S14, J-E03, J-E13; `LOCAL_START_FALLBACK` | NS-41 |
| FR-OPS-19 | operations | E design section 2 rules 1 to 3; E-ST01, E-ST02 | none derivable |
| FR-OPS-29 | operations | `RELEASE.md` 1.3 G5, 7.2; Apple phased release page | none derivable |
| FR-OPS-32 | operations | test plan section 5, 6 | none derivable |
| FR-OPS-35 | operations | `agents/roster.json` limits; ADR 0018, 0019 | none derivable |
| FR-FIN-07 | finance | E-S04 to E-S06, E-S14; D-121 (no Plus emails in the first store build) | NS-41 |
| FR-FIN-12 | finance | E-S11.grace, .retry; J-E11 step 4 | none derivable |
| FR-FIN-16 | finance | FT-29; Q3-07; Q2-09 | none derivable |
| FR-FIN-18 | finance | `13` section 1; platform pass 5.3 to 5.6 | none derivable |
| FR-FIN-22 | finance | CR-120; Q2-09 | none derivable |
| FR-FIN-23 | finance | D-004 points 3 and 4 | none derivable |
| FR-DAT-26 | data | TRACKING_PLAN 6.5; D-161; `12` C-42; D-111 | none derivable |
| FR-DAT-28 | data | TRACKING_PLAN section 4; INSIGHTS_LOOP banner; CDO skill section 4 | none derivable |
| FR-DAT-29 | data | D-045; TRACKING_PLAN 1.4 | none derivable |
| FR-PRV-01 | privacy | BL-485; LEGAL-REQ-006, -008; PRIV-R06, R08, R21; D-128; C-S01 "Privacy" row; new screen (section 4) | none derivable |
| FR-PRV-03 | privacy | DSR-R14; DATA-REQ-050; C-S04 | none derivable |
| FR-PRV-09 | privacy | DSR-R09; `free-tier-ops.md` lines 76 to 86; DATA-REQ-030 | none derivable |
| FR-PRV-10 | privacy | J-N18; OBS-R10; PRIV-R10; LEGAL-REQ-014 | NS-43, NS-39, NS-41 |
| FR-PRV-11 | privacy | OBS-R02, R05; label "Diagnostics: No" (Apple's own reports) | none derivable |
| FR-PRV-12 | privacy | data-policy 4.5 (support prefill, C-NFR-005); PRIV-R10 | none derivable |
| FR-PRV-14 | privacy | `[X4-R1]`; BL-961; G-E05; C E9, E10; K-E02; J-C05; J-E17; E-S18 | none derivable |
| FR-PRV-15 | privacy | D1; C G2, E1; K-E04; C-S03, C-S19 | NS-45 |
| FR-PRV-23 | privacy | DATA_CLASSIFICATION rule 7 (due date is health data); label Sensitive Info row | none derivable |
| FR-PRV-25 | privacy | D-026; PRIV-R21 context allowlist; Q46 | none derivable |
| FR-PRV-27 | privacy | Q56; PRIV-R10; E-S06; C-S10 | NS-41, NS-10 |
| FR-PRV-28 | privacy | E-S07, E-S08, E-S14, E-S24; D-039; J-N26; PRIV-R08 | NS-42, NS-41, NS-43, NS-39 |
| FR-PRV-31 | privacy | D-095, D-124; PRIV-R05, R13; label 2.2.0 Usage Data row | none derivable |
| FR-PRV-33 | privacy | C-S01 "Privacy" row (no screen id); `privacy.tsx`; PRIV-R17 | none derivable |
| FR-LEG-19 | legal | all; LEGAL-REQ-064 | none derivable |
| FR-CMP-11 | compliance | `14-test-plan.md` section 6; LEGAL-REQ-042 path | none derivable |
| FR-CMP-16 | compliance | E-S07, C-S01; D-128; Privacy 9; Q48 | NS-42, NS-41 |
| FR-CMP-21 | compliance | CR-004, CR-005; skill section 5 | none derivable |
| FR-SEC-02 | security | J-E17, E-S15, BL-961, ADR 0031 | none derivable |
| FR-SEC-04 | security | J-E17, C-S19, E-S18, ADR 0031 | none derivable |
| FR-SEC-07 | security | C-S03, D1, E-S22 | NS-45 |
| FR-SEC-15 | security | design system COMPONENTS `GlassSurface`, DS2-07 | none derivable |
| FR-SEC-16 | security | ADR 0029 rule 7, E21, J-E21, LEGAL-REQ-040 | none derivable |
| FR-SEC-26 | security | `proposals/app-review-demo-signin.md` (project doc, not read here) | none derivable |
| FR-RSK-01 | risk | eval C 2.3, `14-test-plan.md:98` | none derivable |
| FR-RSK-02 | risk | Q28, Q23, SEC-R05, SEC-R23 | none derivable |
| FR-RSK-05 | risk | FR-SEC-10, FR-SEC-11, `docs/ops/runbooks/free-tier-ops.md` | none derivable |
| FR-RSK-06 | risk | E21, ADR 0029 rule 4 | none derivable |

- FRs whose card appears only in the requirement text: OPS-30, DAT-31, DAT-34.
- No-card-link counts by function code: CMP 3, DAT 3, FIN 6, LEG 1, MKT 6, OPS 7, POL 7, PRV 14, RSK 4, SEC 6, SUP 11.

### 7.3 e2e screen ids and backlog links

- FRs with no e2e screen id in Links or text: 150 of 272 (many are policy, finance, data or documentation requirements with no screen). They are: SUP-03, SUP-04, SUP-05, SUP-06, SUP-07, SUP-08, SUP-09, SUP-10, SUP-11, SUP-15, SUP-16, SUP-17, SUP-19, SUP-20, SUP-21, SUP-22, SUP-23, POL-01, POL-02, POL-03, POL-04, POL-05, POL-06, POL-08, POL-09, POL-10, POL-11, POL-12, POL-13, MKT-02, MKT-05, MKT-07, MKT-26, MKT-27, MKT-31, MKT-32, MKT-34, OPS-05, OPS-06, OPS-08, OPS-09, OPS-15, OPS-17, OPS-18, OPS-22, OPS-23, OPS-24, OPS-26, OPS-27, OPS-28, OPS-29, OPS-32, OPS-34, OPS-35, FIN-01, FIN-02, FIN-03, FIN-04, FIN-05, FIN-06, FIN-08, FIN-14, FIN-15, FIN-16, FIN-17, FIN-18, FIN-19, FIN-20, FIN-21, FIN-22, FIN-23, FIN-24, DAT-01, DAT-04, DAT-05, DAT-06, DAT-07, DAT-08, DAT-09, DAT-10, DAT-11, DAT-12, DAT-14, DAT-16, DAT-17, DAT-18, DAT-19, DAT-20, DAT-22, DAT-23, DAT-24, DAT-25, DAT-26, DAT-27, DAT-28, DAT-29, DAT-30, DAT-31, DAT-32, DAT-33, PRV-06, PRV-07, PRV-08, PRV-09, PRV-11, PRV-12, PRV-13, PRV-17, PRV-19, PRV-21, PRV-22, PRV-23, PRV-25, PRV-35, PRV-29, PRV-30, PRV-31, PRV-34, LEG-13, LEG-14, LEG-17, LEG-18, LEG-19, CMP-01, CMP-02, CMP-04, CMP-05, CMP-10, CMP-11, CMP-12, CMP-14, CMP-19, CMP-20, CMP-21, SEC-03, SEC-14, SEC-15, SEC-16, SEC-17, SEC-18, SEC-19, SEC-20, SEC-24, SEC-26, RSK-01, RSK-02, RSK-03, RSK-04, RSK-05, RSK-06.
- FRs that say "new screen needed" in Links: PRV-01.
- Screen ids in FR rows that are not in the five DESIGN.md files: none (all 88 distinct ids resolve to the design inventory, 162 ids).
- FRs with no backlog row named in Links, text or any engineering table: 149 of 272. Many are docs, founder or counsel items; Karma decides which need a row: SUP-04, SUP-05, SUP-07, SUP-08, SUP-09, SUP-10, SUP-11, SUP-19, SUP-20, SUP-21, SUP-22, POL-01, POL-03, POL-05, POL-06, POL-08, POL-09, POL-11, POL-12, POL-13, MKT-01, MKT-03, MKT-04, MKT-05, MKT-06, MKT-07, MKT-08, MKT-09, MKT-10, MKT-11, MKT-12, MKT-13, MKT-14, MKT-15, MKT-16, MKT-17, MKT-19, MKT-21, MKT-22, MKT-24, MKT-27, MKT-28, MKT-29, MKT-30, MKT-31, MKT-32, MKT-33, MKT-34, OPS-02, OPS-10, OPS-11, OPS-13, OPS-17, OPS-24, OPS-26, OPS-27, OPS-28, OPS-29, OPS-31, OPS-32, OPS-33, OPS-36, OPS-34, FIN-01, FIN-05, FIN-07, FIN-12, FIN-13, FIN-14, FIN-15, FIN-16, FIN-17, FIN-18, FIN-19, FIN-20, FIN-21, FIN-22, FIN-23, FIN-24, DAT-02, DAT-03, DAT-09, DAT-14, DAT-16, DAT-17, DAT-18, DAT-19, DAT-20, DAT-21, DAT-22, DAT-23, DAT-24, DAT-25, DAT-27, DAT-28, DAT-29, DAT-30, DAT-31, DAT-32, DAT-34, DAT-35, PRV-23, PRV-30, PRV-32, PRV-33, LEG-04, LEG-05, LEG-06, LEG-08, LEG-11, LEG-13, LEG-14, LEG-16, LEG-17, LEG-19, LEG-20, CMP-02, CMP-05, CMP-06, CMP-07, CMP-08, CMP-12, CMP-13, CMP-17, CMP-18, CMP-19, CMP-20, CMP-21, SEC-04, SEC-05, SEC-07, SEC-08, SEC-21, SEC-22, SEC-09, SEC-12, SEC-23, SEC-15, SEC-17, SEC-19, SEC-24, SEC-25, SEC-26, RSK-01, RSK-02, RSK-03, RSK-04, RSK-05, RSK-06.
- BL ids cited by FR rows that do not appear in `docs/BACKLOG.md`: none. BL ids above BL-999 anywhere in the nine files: privacy one mention (privacy mentions "BL-1000" only to say such ids are invisible to the dispatcher).

### 7.4 Coverage tables

- Every function has a verdict row for every card NS-01 to NS-45 (ranges counted).

### 7.5 ASCII scan

- Characters above 127 in this file: 0 (em dash, en dash, curly quotes, ellipsis character, emoji all count). The source files had 0.
