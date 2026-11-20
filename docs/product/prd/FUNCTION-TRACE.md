# Function requirements trace (forward table, reverse view per card, rulings, questions, engineering rows, design needs)

Status: CURRENT (generated; LOCKED rev 2 inputs) | 20 Nov 2026 | Owner: `product` (script `tools/trace-gen/gen.py`) | Replaces: none | Load when: tracing one function requirement (FR id) to cards, screens, rulings and backlog rows; grep by FR id, never load whole (over 4,000 lines).

Owner: `product` for Karma (CTO role, product side). Written 20 Nov 2026 (UTC). Docs only: nothing here is built, no string is live, no decision is recorded in `DECISIONS.md`. The people who wrote the function files are Claude roles, not licensed professionals; every legal reading in them says "counsel must confirm" and nothing here is legal advice.

Fictional family: Asha only. ASCII only.

## 0. What this file is and how it was made

Built by a script from the 23 function files in `docs/product/prd/functions/` (first wave: `support`, `marketing`, `operations`, `finance`, `data-and-measurement`, `privacy`, `legal`, `compliance`, `risk-security`; second wave: `back-office`, `messaging-and-entry-points`, `languages-and-localisation`, `reliability`, `ai-and-speech`, `research-validation`, `quality`, `lifecycle-and-platforms`, `print-and-fulfilment`; third wave: `days-library`, `notification-catalogue`, `cultural-background-data`, `photos-and-suggestions`, `feature-opportunities`; `BRIEF.md` is the brief and is not read as a function), the cards `00` to `19` (titles, row ids and the first-run screen table of card 19) and `20-founder-direction-20nov.md` (the proposed cards NS-46 to NS-50), and `21-days-cultural-photos-home.md`, `GAP-LOG.md` (the rulings K1 to K10, R-IA-1 to R-IA-6, N-1 to N-8, CB-1 to CB-6 and DL-1 to DL-10 are read from it and marked on the items they decide), and the e2e design inventory read from `origin/docs/e2e-ux-20nov` (head `` when read; 0 of 5 `DESIGN.md` files found). The script is kept in the repository at `docs/product/prd/tools/trace-gen/` (`gen.py`, `parse.py`, `model.py`, `groups.py`, `eng.py`, `calc.py`, `rulings.py`, plus `check.py`, an independent re-parse); rerun `python3 docs/product/prd/tools/trace-gen/gen.py` then `python3 docs/product/prd/tools/trace-gen/check.py` when a function file, a card or `GAP-LOG.md` changes. Every FR id, link, verdict, proposed change, question and engineering row below is read from those files; the only hand-written parts are the merge groups in `groups.py` (which proposals are the same), the conflict texts in `gen.py` (positions are quoted from the files; recommendations are Karma-side proposals, not rulings), the mapping from a GAP-LOG ruling to the items it decides (`rulings.py`), and the status derivation rule. Wording in quotes or after a handle is copied from the source file.

Source states to keep in mind:

- The first-wave function files were written while `19-from-download-to-first-letter.md` was a draft. NS-38 to NS-45 are on disk now. First-wave verdicts "missing" or "not reviewed" for NS-41 to NS-45 mean "card not yet written when the function reviewed", not "the card has a gap"; the function owners should re-read the cards that now exist.
- NS-46 to NS-50: written in `21-days-cultural-photos-home.md` (LOCKED rev 2, 20 Nov: the open items are closed in `GAP-LOG.md` "Closures 20 Nov" and `22-final-holistic-spec.md` section 7) and read by ten reviews in `tools/review/ns46-50/` and by the third-wave function files (days, notification catalogue, cultural data, photos, opportunities); the first and second wave files did not read them, so their verdicts for NS-46 to NS-50 are "not reviewed". The reverse view in section 2 lists the FRs that name them, from the FR Links, the requirement text and (`~c`) the card's own text.
- The Links column of an FR row is where the author names card rows, e2e ids and backlog rows (BRIEF "How each function's requirements get linked"). When an FR names none, this file says so and does not guess; where a screen in the FR is on the card 19 screen table, or a linked FR has a card, that card is shown as a suggestion only.
- `GAP-LOG.md` rulings taken so far on function items: 41 (K1 to K10 and the SEC-13 note, R-IA-1 to R-IA-6, N-1 to N-8, CB-1 to CB-6, DL-1 to DL-10). Items they decide are marked `ruled (id)` below. A ruling that only says "founder confirms" or "counsel must confirm" is marked ruled with that open step kept in the item.
- The 20 Nov addenda to the function files (photo moments, pictures and videos; cards NS-51 and NS-52 in `27-photo-moments-and-media.md`) are read for their FR rows (sections 0.1 and 1, so every FR id of the addenda has a forward row and a P0 count) and for their Design needs subsections (section 6). Their card changes, questions and engineering rows are NOT read into sections 3, 4 and 5, and section 2 has no row for NS-51 and NS-52: an FR link to those two cards is kept in the forward table only. Read the addenda in the function files for those.

### 0.1 Totals

| Function (code) | File | FR rows | P0 rows |
|---|---|---|---|
| support (SUP) | functions/support.md | 30 | 20 |
| policy (POL) | functions/support.md | 15 | 9 |
| marketing (MKT) | functions/marketing.md | 44 | 27 |
| operations (OPS) | functions/operations.md | 44 | 19 |
| finance (FIN) | functions/finance.md | 34 | 8 |
| data (DAT) | functions/data-and-measurement.md | 44 | 16 |
| privacy (PRV) | functions/privacy.md | 48 | 35 |
| legal (LEG) | functions/legal.md | 27 | 21 |
| compliance (CMP) | functions/compliance.md | 28 | 23 |
| security (SEC) | functions/risk-security.md | 35 | 18 |
| risk (RSK) | functions/risk-security.md | 7 | 4 |
| back-office (BKO) | functions/back-office.md | 36 | 17 |
| messaging (MSG) | functions/messaging-and-entry-points.md | 46 | 28 |
| languages (LOC) | functions/languages-and-localisation.md | 37 | 24 |
| reliability (REL) | functions/reliability.md | 72 | 24 |
| ai-and-speech (AIS) | functions/ai-and-speech.md | 68 | 54 |
| research (RSH) | functions/research-validation.md | 35 | 17 |
| quality (QAL) | functions/quality.md | 31 | 21 |
| lifecycle (LCY) | functions/lifecycle-and-platforms.md | 43 | 24 |
| print (PRT) | functions/print-and-fulfilment.md | 56 | 8 |
| days (DAY) | functions/days-library.md | 33 | 18 |
| notifications (NTC) | functions/notification-catalogue.md | 31 | 17 |
| cultural-data (CUL) | functions/cultural-background-data.md | 36 | 23 |
| photos (PHS) | functions/photos-and-suggestions.md | 52 | 35 |
| opportunities (OPP) | functions/feature-opportunities.md | 17 | 5 |
| Total | | 949 | 515 |

Policy (POL) is in the support file; risk (RSK) and security (SEC) are in the risk-security file. FR ids with a letter suffix (FR-PRT-34a, FR-LCY-33 "(proposal)") are kept as written. Photos numbers its FRs in bands (01 to 04, 10 to 25, 30 to 34, 40 to 44, 50 to 57), so FR-PHS-05 to 09 and the other gaps are not missing rows. Quality's file also lists 143 existing FR ids in its P0 register (section 3c) and 296 + 96 card rows; those are index lines, not FR definitions, and are not counted here (see K16).

### 0.2 Status column (how it is derived)

- `counsel`: a question to counsel (section 7 of the function file, or its counsel number) cites the FR, or the FR's owner lane names counsel.
- `founder`: a question to the founder cites the FR, or the owner lane names the founder.
- `needs Karma ruling`: a proposed card change cites the FR, or the FR names no locked card row (it is a new requirement the function adds, which Karma links or declines), and no GAP-LOG ruling, errata row (E) or closure (CL) decides it. An FR that an E or CL row names shows `ruled (E##)`.
- `ruled (id)`: it would need a ruling, and a GAP-LOG ruling decides it: the ruling names the FR, or every proposed card change that cites the FR is ruled. `amended` means the ruling changes what the FR says (the FR text is not edited; see 3c).
- `locked row`: none of the above. It rests on a locked card row or an existing decision and needs no new ruling. (This is what the earlier version of this file called "ruled"; it does not mean Karma has ruled on the FR itself.)
- Priority: the first priority in the FR's row, with its RR-4 reasons in brackets; `*` means the row carries more than one priority (read the source row).

## 1. Forward table: every FR, its function, priority, cards, e2e screens, backlog rows and status

Card cell: `NS-nn` with the row ids the author named; `(from text)` means the Links column names no card but the requirement text does; `NO CARD LINK` means neither does. e2e cell: ids from the Links column (with state suffix as written), `(text)` when read from the requirement text, `new screen needed` when the Links column says so. Backlog cell: BL ids from Links, `(text)` from the requirement or evidence text, `(eng table)` from the engineering section of the function file, and `new row needed (NR-nn)` where that section asks for a row (NR numbers are working handles for section 5 of this file, not backlog ids; Karma allocates BL ids, none above BL-999). Status: see 0.2.

| FR id | Function | Priority | Card(s) and rows | e2e screen ids | Backlog rows | Status |
|---|---|---|---|---|---|---|
| FR-SUP-01 | support | P0 (b) | pack-wide (frame or every card) | C-S01 | BL-100 | needs Karma ruling |
| FR-SUP-02 | support | P1 (a) * | NO CARD LINK (suggested via card 19 screen table: NS-39, NS-41, NS-10) | E-S01, E-S06.help, E-S09, E-S13 | new row needed (NR-01) | needs Karma ruling |
| FR-SUP-03 | support | P0 (a) | NO CARD LINK | - | new row needed (NR-02) | needs Karma ruling |
| FR-SUP-04 | support | P0 (b) * | NS-25; plus pack-wide | - | none named | needs Karma ruling |
| FR-SUP-05 | support | P0 (a) | NS-08; plus pack-wide | - | none named | needs Karma ruling |
| FR-SUP-06 | support | P1 | NO CARD LINK | - | new row needed (NR-03) | needs Karma ruling |
| FR-SUP-07 | support | P0 (b,a) * | NS-05; NS-10; NS-11; NS-21 | - | none named | founder; needs Karma ruling |
| FR-SUP-08 | support | P1 | NS-09; NS-35; NS-36; plus pack-wide | - | none named | founder; needs Karma ruling |
| FR-SUP-09 | support | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-SUP-10 | support | P0 (a) | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-SUP-11 | support | P0 (a) | NS-01; NS-02; NS-06 | - | none named | needs Karma ruling |
| FR-SUP-12 | support | P0 (a,b) | NO CARD LINK | E-S11 | BL-997 | needs Karma ruling |
| FR-SUP-13 | support | P1 (a) * | NS-10 | C-S02 | BL-598, BL-597, BL-552 | needs Karma ruling |
| FR-SUP-14 | support | P0 (b) | NO CARD LINK (suggested via card 19 screen table: NS-45) | C-S20 | BL-551 | needs Karma ruling |
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
| FR-POL-10 | policy | P1 | NO CARD LINK | - | BL-552, BL-551 (eng table) | counsel; needs Karma ruling |
| FR-POL-11 | policy | P1 | NO CARD LINK | - | none named | counsel; needs Karma ruling |
| FR-POL-12 | policy | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-POL-13 | policy | P0 (b) | NS-03 | - | none named | founder; needs Karma ruling |
| FR-SUP-24 | support | P0 (a) | NS-51; NS-52 | - | new row needed | needs Karma ruling |
| FR-SUP-25 | support | P0 (a) | NS-36; NS-51; NS-52 | - | new row needed | needs Karma ruling |
| FR-SUP-26 | support | P0 (a,b) | NS-52 | - | none named | needs Karma ruling |
| FR-SUP-27 | support | P0 (a,b) | NS-52 | - | none named | needs Karma ruling |
| FR-SUP-28 | support | P0 (b) | NS-36; NS-52 | - | BL-551 | needs Karma ruling |
| FR-SUP-29 | support | P1 | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-SUP-30 | support | P1 | NS-33; NS-52 | - | none named | needs Karma ruling |
| FR-POL-14 | policy | P0 (b) | NS-52 | - | none named | counsel; founder; needs Karma ruling |
| FR-POL-15 | policy | P1 (b) | NS-52 | - | none named | counsel; needs Karma ruling |
| FR-MKT-01 | marketing | P0 (a,b) | pack-wide (frame or every card) | E-S27 | none named | needs Karma ruling |
| FR-MKT-02 | marketing | P0 (b) | NO CARD LINK | - | new row needed (NR-03) | needs Karma ruling |
| FR-MKT-03 | marketing | P0 (a,b) | NS-24 | B-S19, B-S20 | none named | needs Karma ruling |
| FR-MKT-04 | marketing | P1 (a) | pack-wide (frame or every card) | E-S10, E-S11 | none named | needs Karma ruling |
| FR-MKT-05 | marketing | P0 (a) | NS-25 | - | none named | ruled (K6); founder |
| FR-MKT-06 | marketing | P0 (a,b) | NS-08 R7 | E-S27 | none named | founder |
| FR-MKT-07 | marketing | P0 (a) | NS-02; plus pack-wide | - | none named | needs Karma ruling |
| FR-MKT-08 | marketing | P0 (b) | NS-38 R2 | E-S02, E-S14, E-S27 | none named | needs Karma ruling |
| FR-MKT-09 | marketing | P0 (b) | NS-45; plus pack-wide | E-S16 | none named | needs Karma ruling |
| FR-MKT-10 | marketing | P1 (b) | pack-wide (frame or every card) | E-S27 | none named | needs Karma ruling |
| FR-MKT-11 | marketing | P0 (b) | NS-01; NS-02; NS-05; NS-06; NS-17 R4 | E-S27 | none named | founder; needs Karma ruling |
| FR-MKT-12 | marketing | P0 (b) | NS-01 R62 | A-S03, B-S04, B-S11, E-S27 | none named | founder |
| FR-MKT-13 | marketing | P1 (a) | NS-02 R11; NS-06 | B-S01, B-S05, B-S06 | none named | locked row |
| FR-MKT-14 | marketing | P1 (b) | NS-05 R4b R5b R16a R16b R19 | D-S01, D-S02, D-S03 | none named | needs Karma ruling |
| FR-MKT-15 | marketing | P0 (b) | pack-wide (frame or every card) | E-S27 | none named | founder; needs Karma ruling |
| FR-MKT-16 | marketing | P0 (b) | pack-wide (frame or every card) | C-S08, C-S21 | none named | needs Karma ruling |
| FR-MKT-17 | marketing | P1 (b) | NS-05; NS-25; NS-28 | E-S27 | none named | ruled (K6) |
| FR-MKT-18 | marketing | P1 (b) | NS-33 | E-S27 | BL-984 | needs Karma ruling |
| FR-MKT-19 | marketing | P0 (a) | NS-05; plus pack-wide | D-S01, D-S03 | none named | needs Karma ruling |
| FR-MKT-20 | marketing | P0 (a) | NS-13; NS-18; NS-32 | D-S10, D-S11 | new row needed (NR-12) | needs Karma ruling |
| FR-MKT-21 | marketing | P1 (c) | NS-35; NS-38 to NS-45 | E-S02 | none named | needs Karma ruling |
| FR-MKT-22 | marketing | P0 (b) | NO CARD LINK (suggested via card 19 screen table: NS-44) | E-S10, E-S26, E-S11 | none named | needs Karma ruling |
| FR-MKT-23 | marketing | P1 (b) | NO CARD LINK (suggested via card 19 screen table: NS-44, NS-45) | A-S13, B-S18, B-S19, E-S10, C-S19, C-S20 | new row needed (NR-13) | founder; needs Karma ruling |
| FR-MKT-24 | marketing | P1 (a) | pack-wide (frame or every card) | A-S01, B-S17, B-S18, C-S06 | none named | needs Karma ruling |
| FR-MKT-25 | marketing | P0 (b) | NS-03 R7 | D-S23 | BL-981, BL-109 | locked row |
| FR-MKT-26 | marketing | P1 (b) | NS-17; NS-25 | - | BL-109 | founder; needs Karma ruling |
| FR-MKT-27 | marketing | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-MKT-28 | marketing | P0 (b) | NS-17 R4 | A-S10 | none named | locked row |
| FR-MKT-29 | marketing | P0 (a,b) | NS-08 R7 | C-S08, C-S21 | none named | locked row |
| FR-MKT-30 | marketing | P1 (b) | NO CARD LINK | E-S27 | none named | founder; needs Karma ruling |
| FR-MKT-31 | marketing | P1 (a) | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-MKT-32 | marketing | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-MKT-33 | marketing | P1 (b) | NS-38 to NS-45 | E-S02, E-S27 | none named | needs Karma ruling |
| FR-MKT-34 | marketing | P0 (a) | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-MKT-35 | marketing | P0 (a,b) | NS-51; NS-52 | - | new row needed | needs Karma ruling |
| FR-MKT-36 | marketing | P0 (b) | NS-51; NS-52 | C-S08, C-S21 | new row needed | needs Karma ruling |
| FR-MKT-37 | marketing | P0 (b) | NS-51; NS-52 | A-S03, B-S04, E-S27 | none named | needs Karma ruling |
| FR-MKT-38 | marketing | P1 (a) | NS-46 R33 | - | none named | locked row |
| FR-MKT-39 | marketing | P0 (b) | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-MKT-40 | marketing | P0 (b) | NS-51 | - | new row needed | needs Karma ruling |
| FR-MKT-41 | marketing | P0 (a) | NS-52 | E-S11 | none named | founder; needs Karma ruling |
| FR-MKT-42 | marketing | P1 (b) | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-MKT-43 | marketing | P1 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-MKT-44 | marketing | P0 (b) | NO CARD LINK | - | none named | ruled (E75) |
| FR-OPS-01 | operations | P1 | NS-01 R19; NS-02; NS-08 R14; NS-09 R17; NS-25 R11 | E-ST05, E-ST13c | new row needed (NR-22) | locked row |
| FR-OPS-02 | operations | P1 | NS-02 | E-ST13a | none named | needs Karma ruling |
| FR-OPS-03 | operations | P0 (a) | NS-08 R6 | E-ST17 | BL-961 | founder |
| FR-OPS-04 | operations | P1 | NS-16; NS-25 | E-ST29 | new row needed (NR-22) | needs Karma ruling |
| FR-OPS-05 | operations | P1 | NS-01; NS-02; NS-06; NS-12; NS-16; NS-25 | - | new row needed (NR-22) | needs Karma ruling |
| FR-OPS-06 | operations | P0 (b) | NS-06; NS-12; NS-16; NS-25 | - | BL-551 (text), BL-552 (eng table) | needs Karma ruling |
| FR-OPS-07 | operations | P1 | NS-06; NS-12; NS-16; NS-36 | E-ST17 | new row needed (NR-20), new row needed (NR-22) | needs Karma ruling |
| FR-OPS-08 | operations | P0 (a) | NS-06 B2 | - | new row needed (NR-20) | needs Karma ruling |
| FR-OPS-09 | operations | P0 (b) | NO CARD LINK | - | new row needed (NR-19) | needs Karma ruling |
| FR-OPS-10 | operations | P0 (c) | NS-25; NS-38 to NS-45 | E-S05.error-email, E-S06.error-rate, E-S14.outage | none named | founder; needs Karma ruling |
| FR-OPS-11 | operations | P0 (c) | pack-wide (frame or every card) | E-ST02, E-ST03 | none named | founder; needs Karma ruling |
| FR-OPS-12 | operations | P1 (a) * | NS-08 | E-ST02 | new row needed (NR-18) | needs Karma ruling |
| FR-OPS-13 | operations | P1 | NO CARD LINK | E-ST02 | none named | founder; needs Karma ruling |
| FR-OPS-14 | operations | P0 (a) | NO CARD LINK (suggested via card 19 screen table: NS-41) | E-ST02, E-ST03, E-S14 | new row needed (NR-17) | needs Karma ruling |
| FR-OPS-15 | operations | P0 (a) | NS-08 R1 | - | BL-976 | locked row |
| FR-OPS-16 | operations | P0 (a) | NS-08 R14 R16 R19 | E-ST10, E-ST11 | BL-976 (eng table) | needs Karma ruling |
| FR-OPS-17 | operations | P0 (a) | NS-01; NS-02; NS-16; NS-18 | - | none named | needs Karma ruling |
| FR-OPS-18 | operations | P1 | pack-wide (frame or every card) | - | new row needed (NR-22) | needs Karma ruling |
| FR-OPS-19 | operations | P1 | NO CARD LINK | E-ST01, E-ST02 | new row needed (NR-22) | needs Karma ruling |
| FR-OPS-20 | operations | P1 | NS-08 R7; plus pack-wide | E-ST02, E-ST03 | new row needed (NR-21) | founder |
| FR-OPS-21 | operations | P1 | NS-10; NS-25 | E-S14.outage, E-ST17, C-S12 (text) | BL-997 (text) | needs Karma ruling |
| FR-OPS-22 | operations | P1 | pack-wide (frame or every card) | - | BL-958, BL-988 (eng table) | needs Karma ruling |
| FR-OPS-23 | operations | P0 (a) | NS-01 R45; NS-08 R5 | - | BL-958, BL-988 (eng table) | locked row |
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
| FR-OPS-36 | operations | P1 | NS-40 R9 | E-S14, E-S04.refused-region | none named | locked row |
| FR-OPS-34 | operations | P1 | NS-07 | - | none named | needs Karma ruling |
| FR-OPS-35 | operations | P1 | NO CARD LINK | - | BL-999 (text), new row needed (NR-62) | founder; needs Karma ruling |
| FR-OPS-37 | operations | P1 | NS-52 | - | new row needed | needs Karma ruling |
| FR-OPS-38 | operations | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-OPS-39 | operations | P0 (a) | NS-51; NS-52 | - | none named | ruled (E38) |
| FR-OPS-40 | operations | P1 | NS-52 | - | none named | founder; needs Karma ruling |
| FR-OPS-41 | operations | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-OPS-42 | operations | P0 (b) | NS-52 | - | none named | needs Karma ruling |
| FR-OPS-43 | operations | P0 (a) | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-OPS-44 | operations | P0 (b) | NS-51; NS-52 | - | BL-958 | needs Karma ruling |
| FR-FIN-01 | finance | P1 | NS-08 R2; plus pack-wide | - | none named | locked row |
| FR-FIN-02 | finance | P0 (a) | pack-wide (frame or every card) | - | BL-958, BL-988 | needs Karma ruling |
| FR-FIN-03 | finance | P0 (c) | NS-08; NS-10 | - | new row needed (NR-18) | needs Karma ruling |
| FR-FIN-04 | finance | P1 | NS-08; NS-12 | - | new row needed (NR-23) | needs Karma ruling |
| FR-FIN-05 | finance | P0 (a) | NS-08 R2 R17 | - | none named | locked row |
| FR-FIN-06 | finance | P1 | NS-01; NS-04; NS-06 | - | new row needed (NR-25) | needs Karma ruling |
| FR-FIN-07 | finance | P1 | NO CARD LINK (suggested via card 19 screen table: NS-41) | E-S04, E-S06, E-S14 | none named | needs Karma ruling |
| FR-FIN-08 | finance | P1 | NS-17 | - | new row needed (NR-26) | founder; needs Karma ruling |
| FR-FIN-09 | finance | P0 (b) | NS-13 R11; NS-32 R12 | E-S10, E-S11, E-S12, E-S25, E-S26, D-S10 | new row needed (NR-03) | locked row |
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
| FR-FIN-20 | finance | P1 | NS-17 | - | BL-043 (eng table), new row needed (NR-97) | founder; needs Karma ruling |
| FR-FIN-21 | finance | P1 | pack-wide (frame or every card) | - | none named | founder; needs Karma ruling |
| FR-FIN-22 | finance | P0 (b) | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-FIN-23 | finance | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-FIN-24 | finance | P2 | NS-07; NS-30 | - | none named | counsel; founder |
| FR-FIN-25 | finance | P1 | NS-51; NS-52 | - | new row needed | founder; needs Karma ruling |
| FR-FIN-26 | finance | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-FIN-27 | finance | P1 | NS-52 | - | none named | founder; needs Karma ruling |
| FR-FIN-28 | finance | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-FIN-29 | finance | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-FIN-30 | finance | P0 (a) | NS-52 | E-S10, E-S12 | none named | founder; needs Karma ruling |
| FR-FIN-31 | finance | P1 | (from text) NS-52 | - | none named | needs Karma ruling |
| FR-FIN-32 | finance | P0 (b) | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-FIN-33 | finance | P1 | NS-51 | - | none named | needs Karma ruling |
| FR-FIN-34 | finance | P2 | (from text) NS-51, NS-52 | - | none named | needs Karma ruling |
| FR-DAT-01 | data | P0 (b) | NS-07 | - | BL-975, new row needed (NR-30) | locked row |
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
| FR-DAT-15 | data | P1 | NS-34 R1 R5; NS-37 | E-S23 | BL-929, BL-948 | locked row |
| FR-DAT-16 | data | P1 | NS-34; plus pack-wide | - | none named | needs Karma ruling |
| FR-DAT-17 | data | P1 | NS-07; NS-09; NS-35; NS-36; plus pack-wide | - | none named | needs Karma ruling |
| FR-DAT-18 | data | P2 | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-DAT-19 | data | P1 | pack-wide (frame or every card) | - | none named | founder; needs Karma ruling |
| FR-DAT-20 | data | P0 (a) | NS-07; plus pack-wide | - | none named | founder; needs Karma ruling |
| FR-DAT-21 | data | P1 | pack-wide (frame or every card) | E-S26 | none named | needs Karma ruling |
| FR-DAT-22 | data | P1 | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-DAT-23 | data | P1 | NS-17 | - | none named | counsel; needs Karma ruling |
| FR-DAT-24 | data | P1 | NS-33 | - | none named | counsel; needs Karma ruling |
| FR-DAT-25 | data | P1 | NS-11; NS-24 | - | none named | needs Karma ruling |
| FR-DAT-26 | data | P2 | NO CARD LINK | - | new row needed (NR-29) | needs Karma ruling |
| FR-DAT-27 | data | P0 (a) | NS-02; NS-05; NS-06; NS-11; NS-16; NS-17; NS-18; NS-33 | - | none named | needs Karma ruling |
| FR-DAT-28 | data | P1 | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-DAT-29 | data | P1 | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-DAT-30 | data | P1 | NS-02 | - | none named | needs Karma ruling |
| FR-DAT-31 | data | P1 | (from text) NS-01 | - | none named | founder; needs Karma ruling |
| FR-DAT-32 | data | P0 (a) | NS-13; plus pack-wide | - | none named | needs Karma ruling |
| FR-DAT-33 | data | P1 | NS-39 | - | BL-994 | needs Karma ruling |
| FR-DAT-34 | data | P2 | (from text) NS-45 | E-S16 | none named | needs Karma ruling |
| FR-DAT-35 | data | P0 (b) | NS-40; NS-41 | E-S03, E-S04, E-S07 | none named | ruled (K10); counsel |
| FR-DAT-36 | data | P0 (a) | NS-51; NS-52 | - | new row needed | needs Karma ruling |
| FR-DAT-37 | data | P0 (a) | NS-51; NS-52 | C-S18 | none named | ruled (E38) |
| FR-DAT-38 | data | P0 (a) | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-DAT-39 | data | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-DAT-40 | data | P0 (a) | NS-51; NS-52 | - | none named | founder; needs Karma ruling |
| FR-DAT-41 | data | P1 | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-DAT-42 | data | P1 | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-DAT-43 | data | P1 | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-DAT-44 | data | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-PRV-01 | privacy | P0 (b) | NO CARD LINK | C-S01; new screen needed | BL-485 | needs Karma ruling |
| FR-PRV-02 | privacy | P0 (b,c) | NS-42 | E-S03, E-S07, C-S11, D-S16, C-S21 (text) | BL-577, BL-579, BL-994 (eng table) | needs Karma ruling |
| FR-PRV-03 | privacy | P1 | NO CARD LINK | C-S04 | BL-577 (eng table) | ruled (E74) |
| FR-PRV-04 | privacy | P1 | NS-42 | E-S02, E-S03, E-S07, C-S11, D-S16 (text) | BL-577, BL-994 (eng table) | needs Karma ruling |
| FR-PRV-05 | privacy | P1 | NS-41 | E-S07.declined, C-S11.declined | new row needed (NR-38) | needs Karma ruling |
| FR-PRV-06 | privacy | P0 (b) | NS-36 R6 | - | BL-960 | founder |
| FR-PRV-07 | privacy | P1 | NS-01 | - | BL-961 (eng table) | needs Karma ruling |
| FR-PRV-08 | privacy | P1 (b) | NS-08 | - | BL-960 (eng table) | needs Karma ruling |
| FR-PRV-09 | privacy | P1 (a) | NO CARD LINK | - | new row needed (NR-20) | counsel; founder; needs Karma ruling |
| FR-PRV-10 | privacy | P0 (a) | NO CARD LINK (suggested via card 19 screen table: NS-43, NS-39, NS-41) | E-S08, E-S05 (text) | new row needed (NR-32) | needs Karma ruling |
| FR-PRV-11 | privacy | P0 (a) | NO CARD LINK | - | new row needed (NR-33), new row needed (NR-162) | needs Karma ruling |
| FR-PRV-12 | privacy | P1 | NO CARD LINK | - | new row needed (NR-02) | needs Karma ruling |
| FR-PRV-13 | privacy | P0 (a) | NS-02 R25; NS-25 R2 R6 | - | new row needed (NR-33), new row needed (NR-162) | locked row |
| FR-PRV-14 | privacy | P0 (a) | NO CARD LINK | E-S18 | BL-961, BL-994 (eng table) | needs Karma ruling |
| FR-PRV-15 | privacy | P0 (a) | NO CARD LINK (suggested via card 19 screen table: NS-45) | C-S03, C-S19 | BL-961 (eng table), BL-994 (eng table) | ruled (K4) |
| FR-PRV-16 | privacy | P0 (a) | NS-01 R50; NS-06 A22; NS-21 R12 | A-S07, A-S06, B-S08, B-S11, B-S12, A-S09, D-S08, E-S08 (text) | BL-962 | locked row |
| FR-PRV-17 | privacy | P0 (a) | NS-04 R8; NS-06 | - | BL-962 | locked row |
| FR-PRV-18 | privacy | P0 (b) | NS-01 R31 | C-S20 (text) | BL-994 (eng table) | ruled (K4) |
| FR-PRV-19 | privacy | P0 (a) | NS-17 R8 | - | new row needed (NR-34) | needs Karma ruling |
| FR-PRV-20 | privacy | P0 (a) | NS-10 | C-S11.declined | new row needed (NR-35) | needs Karma ruling |
| FR-PRV-21 | privacy | P1 (b) | NS-12 | - | BL-979 (eng table) | needs Karma ruling |
| FR-PRV-22 | privacy | P1 (b) | NS-16 | - | BL-980 (eng table) | needs Karma ruling |
| FR-PRV-23 | privacy | P2 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-PRV-24 | privacy | P0 (b) | NS-39; NS-40; NS-41; NS-43 | E-S01, E-S08, E-S02 (text) | BL-579, BL-994 (eng table) | needs Karma ruling |
| FR-PRV-25 | privacy | P0 (b) | (from text) NS-40 | - | BL-994 (eng table) | ruled (K5, E50, E71) |
| FR-PRV-26 | privacy | P0 (b) | NS-40 | E-S03.region | BL-994 (eng table), new row needed (NR-39) | needs Karma ruling |
| FR-PRV-27 | privacy | P0 (a) | NO CARD LINK (suggested via card 19 screen table: NS-41, NS-10) | E-S06, C-S10 | BL-994 (eng table) | counsel; founder; needs Karma ruling |
| FR-PRV-28 | privacy | P0 (b) | NO CARD LINK (suggested via card 19 screen table: NS-42, NS-41, NS-43, NS-39) | E-S07, E-S08, E-S14, E-S24 | BL-994 (eng table) | needs Karma ruling |
| FR-PRV-35 | privacy | P1 | NS-41 | - | BL-994 (eng table), new row needed (NR-37) | needs Karma ruling |
| FR-PRV-29 | privacy | P1 | NS-07 | - | BL-975 | needs Karma ruling |
| FR-PRV-30 | privacy | P0 (b) | NS-01 | - | none named | needs Karma ruling |
| FR-PRV-31 | privacy | P0 (b) | NO CARD LINK | - | BL-958 (eng table), BL-988 (eng table) | needs Karma ruling |
| FR-PRV-32 | privacy | P1 (b) | NS-25 | E-S07, D-S13 (text) | none named | counsel; founder; needs Karma ruling |
| FR-PRV-33 | privacy | P0 (b) | NO CARD LINK | C-S01 | none named | needs Karma ruling |
| FR-PRV-34 | privacy | P0 (a) | NS-01 R16 R52; NS-05 R10; NS-07; NS-36; NS-37 R5 | - | new row needed (NR-36) | ruled (E33) |
| FR-PRV-36 | privacy | P0 (b) | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-PRV-37 | privacy | P0 (b) | NS-39; NS-51 | E-S01, E-S08 | none named | needs Karma ruling |
| FR-PRV-38 | privacy | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-PRV-39 | privacy | P0 (a) | NS-02; NS-51 | - | none named | needs Karma ruling |
| FR-PRV-40 | privacy | P0 (a) | NS-01 R33 | - | none named | locked row |
| FR-PRV-41 | privacy | P0 (a) | NS-52 | C-S19, C-S20 | none named | needs Karma ruling |
| FR-PRV-42 | privacy | P0 (b) | NS-11; NS-52 | - | none named | needs Karma ruling |
| FR-PRV-43 | privacy | P0 (b) | NS-01 R27 | - | none named | locked row |
| FR-PRV-44 | privacy | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-PRV-45 | privacy | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-PRV-46 | privacy | P0 (a) | NS-32; NS-48 | - | none named | needs Karma ruling |
| FR-PRV-47 | privacy | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-PRV-48 | privacy | P0 (b) | NS-01 R32 | - | none named | locked row |
| FR-LEG-01 | legal | P0 (b) | NS-01 R26 R32 R61 | A-S03, B-S11 | BL-931 | locked row |
| FR-LEG-02 | legal | P0 (b) | NS-01 R31; NS-02; NS-06 B18 | C-S20, C-S19 | new row needed (NR-40) | ruled (K4) |
| FR-LEG-03 | legal | P0 (a) | NS-25 | D-S18 | BL-444 | founder; needs Karma ruling |
| FR-LEG-04 | legal | P0 (b) | NS-10; NS-38; NS-41 | E-S02, E-S03, E-S07 | none named | counsel; founder; needs Karma ruling |
| FR-LEG-05 | legal | P1 (b) * | NS-05 R3a R3b R5b R7 R12 R24 | D-S01, D-S02 | none named | needs Karma ruling |
| FR-LEG-06 | legal | P0 (a) | NS-06 B1 | B-S13, B-S14, B-S16 | none named | needs Karma ruling |
| FR-LEG-07 | legal | P0 (b) | NS-06 B9 | B-S13 | new row needed (NR-44) | needs Karma ruling |
| FR-LEG-08 | legal | P0 (b) | NS-06; NS-12; NS-16 R3; NS-18; NS-36 | A-S09, B-S12, B-S13, D-S08 | none named | counsel; needs Karma ruling |
| FR-LEG-09 | legal | P0 (b) | NS-08; NS-10; NS-25 R17; NS-42 | E-S07, C-S11, D-S16, C-S21 | BL-577, new row needed (NR-41) | needs Karma ruling |
| FR-LEG-10 | legal | P0 (b) | NS-25 R13 R16 R17 | D-S13, D-S16, D-S19 | BL-404 (eng table), new row needed (NR-45) | counsel; needs Karma ruling |
| FR-LEG-11 | legal | P0 (b) | NS-03 R1 | D-S23 | none named | locked row |
| FR-LEG-12 | legal | P0 (b) * | NS-07 C28; NS-30 | C-S05 | new row needed (NR-42) | needs Karma ruling |
| FR-LEG-13 | legal | P0 (b) | NS-17 R4 | - | new row needed (NR-93) | founder |
| FR-LEG-14 | legal | P1 | NS-01 | - | none named | needs Karma ruling |
| FR-LEG-15 | legal | P0 (b) | NS-16 R3 | A-S09 | new row needed (NR-43) | needs Karma ruling |
| FR-LEG-16 | legal | P1 (a) * | NS-08 | C-S21 | none named | founder; needs Karma ruling |
| FR-LEG-17 | legal | P2 * | NS-09; NS-12 | - | none named | locked row |
| FR-LEG-18 | legal | P0 (b) | pack-wide (frame or every card) | - | BL-104 | needs Karma ruling |
| FR-LEG-19 | legal | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-LEG-20 | legal | P0 (b) | NS-42 | E-S03, E-S07 | none named | counsel; founder; needs Karma ruling |
| FR-LEG-21 | legal | P0 (b) | NS-51 | - | none named | needs Karma ruling |
| FR-LEG-22 | legal | P0 (b) | NS-52 | - | none named | needs Karma ruling |
| FR-LEG-23 | legal | P0 (b) | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-LEG-24 | legal | P0 (b) | NS-51 | - | none named | needs Karma ruling |
| FR-LEG-25 | legal | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-LEG-26 | legal | P0 (b) | NS-51 | - | none named | needs Karma ruling |
| FR-LEG-27 | legal | P0 (b) | NS-52 | - | none named | needs Karma ruling |
| FR-CMP-01 | compliance | P0 (b) | pack-wide (frame or every card) | - | new row needed (NR-50) | needs Karma ruling |
| FR-CMP-02 | compliance | P1 | NS-06; NS-17 | - | none named | founder |
| FR-CMP-03 | compliance | P0 (b) | NS-01; NS-35 | E-S04, E-S07 | new row needed (NR-46) | founder; needs Karma ruling |
| FR-CMP-04 | compliance | P0 (b) | NS-01 R15 R26 R61 | - | new row needed (NR-50) | needs Karma ruling |
| FR-CMP-05 | compliance | P0 (b) | NS-05; NS-07; NS-08; NS-26; NS-28 | - | none named | locked row |
| FR-CMP-06 | compliance | P0 (b) | NS-33 | E-S23 | none named | founder; needs Karma ruling |
| FR-CMP-07 | compliance | P0 (b) | NS-33 | E-S03, E-S07, E-S10, E-S11, C-S20, D-S13, D-S16, D-S02 +2 more (text) | none named | locked row |
| FR-CMP-08 | compliance | P1 | NS-01 R38a R38b; NS-06; NS-21; plus pack-wide | B-S11, B-S12, B-S15 | none named | locked row |
| FR-CMP-09 | compliance | P1 | NS-38 to NS-45 | E-S05, E-S06 | new row needed (NR-49) | needs Karma ruling |
| FR-CMP-10 | compliance | P1 | NS-33 | - | BL-404 | needs Karma ruling |
| FR-CMP-11 | compliance | P0 (b) | NO CARD LINK | - | new row needed (NR-15) | founder; needs Karma ruling |
| FR-CMP-12 | compliance | P0 (b) | pack-wide (frame or every card) | - | none named | founder; needs Karma ruling |
| FR-CMP-13 | compliance | P0 (b) | NS-25 R2 R6 | E-S03, D-S14, D-S15, D-S16 | none named | needs Karma ruling |
| FR-CMP-14 | compliance | P0 (b) | NS-16 | - | BL-119 | needs Karma ruling |
| FR-CMP-15 | compliance | P0 (b) | NS-40 | E-S01, E-S03 | new row needed (NR-47) | ruled (K5); counsel; founder |
| FR-CMP-16 | compliance | P0 (a) | NO CARD LINK (suggested via card 19 screen table: NS-42, NS-41) | E-S07, C-S01 | new row needed (NR-48) | ruled (E46) |
| FR-CMP-17 | compliance | P0 (b) | NS-10 | C-S20 | none named | needs Karma ruling |
| FR-CMP-18 | compliance | P0 (b) | NS-10 | E-S02 | none named | founder; needs Karma ruling |
| FR-CMP-19 | compliance | P0 (b) | NS-05; NS-25 | - | none named | ruled (K6); founder |
| FR-CMP-20 | compliance | P0 (b) | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-CMP-21 | compliance | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-CMP-22 | compliance | P0 (b) | NS-51 | - | none named | founder; needs Karma ruling |
| FR-CMP-23 | compliance | P0 (b) | NS-01 R22 | - | none named | locked row |
| FR-CMP-24 | compliance | P0 (b) | NS-51 | - | none named | needs Karma ruling |
| FR-CMP-25 | compliance | P0 (b) | NS-52 | - | none named | needs Karma ruling |
| FR-CMP-26 | compliance | P0 (b) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-CMP-27 | compliance | P0 (b) | NS-39 | E-S03 | none named | needs Karma ruling |
| FR-CMP-28 | compliance | P0 (b) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-SEC-01 | security | P0 (a) | NS-01 R29; NS-02 R24; NS-25 R19; NS-41 R6 | E-S18 | BL-961 | needs Karma ruling |
| FR-SEC-02 | security | P0 (a) | NO CARD LINK | E-S15 | BL-961 | needs Karma ruling |
| FR-SEC-03 | security | P0 (a) | NS-02 R24; NS-11 R22; NS-13 R13 | - | BL-961 (eng table) | needs Karma ruling |
| FR-SEC-04 | security | P0 (a) | NO CARD LINK | C-S19, E-S18 | none named | ruled (E49) |
| FR-SEC-05 | security | P1 | NS-10 R5; NS-41 R5 | E-S24 | none named | locked row |
| FR-SEC-06 | security | P1 | NS-36; NS-45 | C-S19 | new row needed (NR-52) | ruled (E54); counsel; founder |
| FR-SEC-07 | security | P1 | NO CARD LINK (suggested via card 19 screen table: NS-45) | C-S03, E-S22 | none named | needs Karma ruling |
| FR-SEC-08 | security | P1 | NS-07; NS-11 | C-S04, C-S05 | none named | counsel; founder; needs Karma ruling |
| FR-SEC-21 | security | P0 (a) | NS-06; NS-32 R12 | A-S14, D-S10 | none named | needs Karma ruling |
| FR-SEC-22 | security | P0 (a) | NS-01 R13a; NS-23 R11 | E-S22 | none named | locked row |
| FR-SEC-09 | security | P1 | NS-25 R4 | D-S18, D-S19 | none named | needs Karma ruling |
| FR-SEC-10 | security | P1 | NS-25 | D-S16 | new row needed (NR-53) | needs Karma ruling |
| FR-SEC-11 | security | P2 | NS-41 R21 | E-S05 | new row needed (NR-53) | locked row |
| FR-SEC-12 | security | P1 | NS-45 | C-S02, C-S20 | none named | needs Karma ruling |
| FR-SEC-23 | security | P0 (a) | NS-25 R6 | D-S14 | none named | locked row |
| FR-SEC-14 | security | P1 | NS-01; NS-06 | - | new row needed (NR-54) | needs Karma ruling |
| FR-SEC-15 | security | P2 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-SEC-16 | security | P0 (a) | NO CARD LINK | - | new row needed (NR-55) | needs Karma ruling |
| FR-SEC-17 | security | P1 | NS-05; NS-26; NS-28 | - | none named | needs Karma ruling |
| FR-SEC-18 | security | P0 (a) | NS-01; NS-02; NS-06; NS-16; NS-18 | - | new row needed (NR-32) | needs Karma ruling |
| FR-SEC-19 | security | P1 | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-SEC-20 | security | P2 | NS-06; NS-12; NS-25 | - | new row needed (NR-56) | needs Karma ruling |
| FR-SEC-24 | security | P0 (b) | NS-41 R9 R10 | - | none named | founder |
| FR-SEC-25 | security | P1 | NS-39 R9; NS-43 R10 | E-S22, C-S03 | none named | locked row |
| FR-SEC-26 | security | P0 (b) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-RSK-01 | risk | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-RSK-02 | risk | P0 (b) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-RSK-03 | risk | P0 (b) | NS-06; plus pack-wide | - | none named | needs Karma ruling |
| FR-RSK-04 | risk | P0 (b) | NS-25 | - | none named | founder; needs Karma ruling |
| FR-RSK-05 | risk | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-RSK-06 | risk | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-SEC-27 | security | P0 (a) | NS-06; NS-25; NS-52 | - | BL-870 | needs Karma ruling |
| FR-SEC-28 | security | P0 (a) | NS-52 | - | none named | needs Karma ruling |
| FR-SEC-29 | security | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-SEC-30 | security | P0 (a) | NS-01 R6; NS-05 R6b; NS-52 | - | none named | locked row |
| FR-SEC-31 | security | P0 (a) | NS-01; NS-49 R19 | - | none named | locked row |
| FR-SEC-32 | security | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-SEC-33 | security | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-SEC-34 | security | P0 (a) | (from text) NS-51, NS-52 | - | BL-961 (text) | needs Karma ruling |
| FR-SEC-35 | security | P0 (a) | NS-05; NS-11 | - | none named | needs Karma ruling |
| FR-SEC-36 | security | P1 (b) | NS-08 R21; NS-45 R3 | - | none named | locked row; ruling also E76, E77, E78, E81, E83 |
| FR-RSK-07 | risk | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-BKO-01 | back-office | P0 (a) | NS-45 | - | new row needed (NR-60) | needs Karma ruling |
| FR-BKO-02 | back-office | P1 (a) * | NS-36; NS-45 | - | new row needed (NR-57) | needs Karma ruling |
| FR-BKO-03 | back-office | P0 (a) | NO CARD LINK | - | BL-237 | founder; needs Karma ruling |
| FR-BKO-04 | back-office | P0 (a) | NS-45 | - | BL-237, new row needed (NR-61) | needs Karma ruling |
| FR-BKO-05 | back-office | P1 | NO CARD LINK | - | BL-236, BL-237, new row needed (NR-58) | needs Karma ruling |
| FR-BKO-06 | back-office | P1 | NO CARD LINK | - | new row needed | founder; needs Karma ruling |
| FR-BKO-07 | back-office | P0 (a) | NS-10; NS-41; NS-45 | E-S06, E-S09, C-S02 | BL-598, BL-597, BL-552, BL-551 (eng table) | needs Karma ruling |
| FR-BKO-08 | back-office | P1 | NO CARD LINK | - | BL-598, BL-597 (eng table) | founder; needs Karma ruling |
| FR-BKO-09 | back-office | P0 (b) | NO CARD LINK | - | new row needed | founder; needs Karma ruling |
| FR-BKO-10 | back-office | P0 (b) | NO CARD LINK | - | BL-779 | founder; needs Karma ruling |
| FR-BKO-11 | back-office | P2 | NO CARD LINK | - | BL-237, new row needed | founder; needs Karma ruling |
| FR-BKO-12 | back-office | P1 (b) * | NS-05; NS-25 to NS-28 | E-S01, C-S01, D-S18 | new row needed (NR-63) | counsel; needs Karma ruling |
| FR-BKO-13 | back-office | P0 (a) | NO CARD LINK | - | new row needed (NR-63) | founder; needs Karma ruling |
| FR-BKO-14 | back-office | P0 (a,b) | NS-25 R3 R4 R13 | D-S18, D-S19, D-S20; new screen needed | new row needed (NR-59), new row needed (NR-63) | counsel; needs Karma ruling |
| FR-BKO-15 | back-office | P1 | NS-25 R4 | D-S20; new screen needed | new row needed (NR-59), new row needed (NR-63) | locked row |
| FR-BKO-16 | back-office | P0 (b) | NO CARD LINK | - | new row needed (NR-63) | counsel; founder; needs Karma ruling |
| FR-BKO-17 | back-office | P1 | NO CARD LINK | E-ST05, E-ST13c; new screen needed | new row needed (NR-63) | founder; needs Karma ruling |
| FR-BKO-18 | back-office | P0 (a) * | NO CARD LINK | - | new row needed (NR-63) | counsel; founder; needs Karma ruling |
| FR-BKO-19 | back-office | P2 | NO CARD LINK | E-ST05, E-ST13c | new row needed (NR-63) | needs Karma ruling |
| FR-BKO-20 | back-office | P1 (a) * | NO CARD LINK | - | new row needed (NR-60), new row needed (NR-63) | founder; needs Karma ruling |
| FR-BKO-21 | back-office | P0 (a) | NO CARD LINK | - | new row needed (NR-62), new row needed (NR-63) | founder; needs Karma ruling |
| FR-BKO-22 | back-office | P1 | NO CARD LINK | - | new row needed (NR-63) | founder; needs Karma ruling |
| FR-BKO-23 | back-office | P1 | NO CARD LINK | - | new row needed (NR-63) | founder; needs Karma ruling |
| FR-BKO-24 | back-office | P1 | NO CARD LINK | C-S01 | new row needed (NR-63) | founder; needs Karma ruling |
| FR-BKO-25 | back-office | P1 | NO CARD LINK | - | new row needed (NR-63) | needs Karma ruling |
| FR-BKO-26 | back-office | P1 | NS-45 | E-S15, E-ST02, C-S04, C-S20 | BL-552, BL-553, BL-551 (eng table) | needs Karma ruling |
| FR-BKO-27 | back-office | P1 | NS-45 | C-S02 | new row needed (NR-64) | counsel; needs Karma ruling |
| FR-BKO-28 | back-office | P0 (a) | NS-52 | - | new row needed | needs Karma ruling |
| FR-BKO-29 | back-office | P0 (a) | NS-52 | - | none named | needs Karma ruling |
| FR-BKO-30 | back-office | P0 (a) | NS-09; NS-52 | - | none named | needs Karma ruling |
| FR-BKO-31 | back-office | P0 (b) | NS-52 | - | none named | founder; needs Karma ruling |
| FR-BKO-32 | back-office | P0 (b) | NS-52 | - | none named | counsel; founder; needs Karma ruling |
| FR-BKO-33 | back-office | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-BKO-34 | back-office | P1 | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-BKO-35 | back-office | P0 (a) | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-BKO-36 | back-office | P1 | NS-51 | - | none named | needs Karma ruling |
| FR-MSG-01 | messaging | P0 (c) | NS-41 R18 R11 | E-S05, E-S06 | BL-053, BL-368, BL-364 (eng table), BL-510 (eng table), new row needed (NR-65), new row needed (NR-74) | founder; needs Karma ruling |
| FR-MSG-02 | messaging | P1 | NS-41 | E-S05 | BL-368 | needs Karma ruling |
| FR-MSG-03 | messaging | P0 (c) | NS-41 R18 | E-S02, E-S24 | BL-368, new row needed (NR-74) | founder; needs Karma ruling |
| FR-MSG-04 | messaging | P1 | NS-41 R18 | E-S06.help | new row needed | locked row |
| FR-MSG-05 | messaging | P1 | NS-41 R18 R17 | E-S24, E-S11 | new row needed (NR-72) | locked row |
| FR-MSG-06 | messaging | P0 (c) * | NS-41 | E-S06 | BL-053, new row needed (NR-66) | needs Karma ruling |
| FR-MSG-07 | messaging | P1 | NS-10; NS-41 | E-S11; new screen needed | new row needed (NR-66), new row needed (NR-72) | needs Karma ruling |
| FR-MSG-08 | messaging | P1 | NS-41 R12 R21 | E-S06.help, E-S06.noAddress, E-S14 | new row needed (NR-67) | needs Karma ruling |
| FR-MSG-09 | messaging | P0 (b) | NS-39 R2; NS-41 | E-S02 | BL-053, new row needed (NR-68) | locked row |
| FR-MSG-10 | messaging | P0 (b) | NS-41 R11 R16 | E-S06 | BL-053 | locked row |
| FR-MSG-11 | messaging | P0 (c) | NS-41 R12 R21 | E-S05.error-email, E-S14 | new row needed | locked row |
| FR-MSG-12 | messaging | P0 (a) | NS-33 | E-S13 | none named | needs Karma ruling |
| FR-MSG-13 | messaging | P1 | pack-wide (frame or every card) | - | new row needed (NR-03) | needs Karma ruling |
| FR-MSG-14 | messaging | P0 (a) | NS-25 R16 R2 | D-S13, D-S15 | BL-196 | counsel; needs Karma ruling |
| FR-MSG-15 | messaging | P0 (c) | NS-41 R21 R25 | E-S14.outage | new row needed (NR-71) | needs Karma ruling |
| FR-MSG-16 | messaging | P0 (b) | NS-13; NS-26; NS-32 | D-S04, E-S28 | BL-546 | needs Karma ruling |
| FR-MSG-17 | messaging | P1 | NS-26; NS-32 R4b | D-S10, D-S04, E-S28 | BL-546 | needs Karma ruling |
| FR-MSG-18 | messaging | P0 (a) | NS-13; NS-18 R3; NS-32 | D-S10, D-S11 | none named | locked row |
| FR-MSG-19 | messaging | P0 (c) | NS-13; NS-32; NS-39 R2 | D-S04, D-S05, E-S12.withAsk, E-S28 | none named | locked row |
| FR-MSG-20 | messaging | P1 | NS-13; NS-32 R4 | D-S06.denied, D-S06.error-schedule, D-S24 | none named | locked row |
| FR-MSG-21 | messaging | P1 | NS-13; NS-32 | D-S06.lateClamp, D-S07 | none named | needs Karma ruling |
| FR-MSG-22 | messaging | P0 (b) | NS-32 | E-S28 | none named | needs Karma ruling |
| FR-MSG-23 | messaging | P0 (c) | NS-25; NS-41 | E-S05, D-S14 | BL-510, BL-364, BL-368 (eng table), new row needed (NR-65) | needs Karma ruling |
| FR-MSG-24 | messaging | P0 (c) | NS-25 R6; NS-39 R14; NS-40 R3 | D-S14.iphone, E-S03 | new row needed (NR-74) | needs Karma ruling |
| FR-MSG-25 | messaging | P0 (c) | NS-41 R11 R16 | E-S06 | BL-053, BL-510 | needs Karma ruling |
| FR-MSG-26 | messaging | P1 | NS-38; NS-39 | E-S27 | BL-510, BL-364, new row needed (NR-69) | needs Karma ruling |
| FR-MSG-27 | messaging | P1 | NS-25 R6 | D-S14.iphone, D-S14.other-device | BL-420, BL-421, new row needed (NR-69) | needs Karma ruling |
| FR-MSG-28 | messaging | P0 (a) | NS-25 R18 R2 | D-S14, D-S15 | none named | needs Karma ruling |
| FR-MSG-29 | messaging | P0 (a) | NS-25 R2 R6 R18 | D-S14, D-S15, D-S18.undo-open | BL-420, BL-421 | locked row |
| FR-MSG-30 | messaging | P1 | NS-25; NS-39 R14; NS-40 R3 | D-S14.copied, D-S15.signed-out, E-S03 | new row needed (NR-73) | locked row |
| FR-MSG-31 | messaging | P1 | NS-22 R6 | E-S20 | BL-383 | locked row |
| FR-MSG-32 | messaging | P0 (b) | NS-38; NS-42 R13 | E-S27 | BL-243, BL-364, BL-368 (eng table), BL-510 (eng table), new row needed (NR-65) | needs Karma ruling |
| FR-MSG-33 | messaging | P0 (b) | NS-33; NS-38 | E-S13 | BL-364 | needs Karma ruling |
| FR-MSG-34 | messaging | P0 (b) | NS-36 | C-S20, D-S18 | BL-243, BL-364, new row needed (NR-70) | counsel; needs Karma ruling |
| FR-MSG-35 | messaging | P0 (b) | NS-36 | D-S18 | BL-364, BL-510, new row needed (NR-70) | needs Karma ruling |
| FR-MSG-36 | messaging | P0 (a) | NS-25 R6; NS-41 R16 | D-S14 | BL-364 | locked row |
| FR-MSG-37 | messaging | P1 | NS-33 | - | BL-364 | needs Karma ruling |
| FR-MSG-38 | messaging | P1 | NS-41 | E-S05 | BL-100, BL-368, new row needed (NR-71) | founder; needs Karma ruling |
| FR-MSG-39 | messaging | P1 | NS-35 R5; NS-49 R2 R4; NS-51; NS-52 | - | none named | locked row |
| FR-MSG-40 | messaging | P0 (c,a) | NS-51 | D-S04; new screen needed | none named | needs Karma ruling |
| FR-MSG-41 | messaging | P0 (a) | NS-32; NS-48 R5; NS-51 R11 R12 R25 | - | none named | locked row |
| FR-MSG-42 | messaging | P1 (a) * | NS-50 R4 R5; NS-51 | - | none named | locked row |
| FR-MSG-43 | messaging | P0 (b) | NS-49 R25; NS-51 | - | none named | locked row |
| FR-MSG-44 | messaging | P0 (b) | NS-01 R22 R49; NS-04; NS-51; NS-52 | - | none named | locked row |
| FR-MSG-45 | messaging | P0 (a,b) | NS-05; NS-52 | - | none named | counsel; needs Karma ruling |
| FR-MSG-46 | messaging | P1 | NS-01 R31; NS-45 | - | none named | locked row |
| FR-LOC-01 | languages | P0 (a) | NS-17 R1 R4 | A-S10, E-S08 | new row needed (NR-75) | locked row |
| FR-LOC-02 | languages | P0 (a) | NS-17 R4 | - | none named | founder |
| FR-LOC-03 | languages | P0 (a) | NS-17 R2 | - | BL-109 (eng table), new row needed (NR-75) | founder |
| FR-LOC-04 | languages | P0 (a) | NS-17 R2 | - | none named | founder |
| FR-LOC-05 | languages | P0 (a) | NS-17 | - | none named | founder; needs Karma ruling |
| FR-LOC-06 | languages | P1 | NS-17 | - | none named | founder; needs Karma ruling |
| FR-LOC-07 | languages | P1 | NS-17 | C-S18 | none named | needs Karma ruling |
| FR-LOC-08 | languages | P0 (a) | NS-17 R6 | A-S07.language | none named | locked row |
| FR-LOC-09 | languages | P2 (a) * | NS-17 | A-S10 | none named | founder; needs Karma ruling |
| FR-LOC-10 | languages | P0 (a) | NS-17 | C-S01 | BL-321, new row needed (NR-82) | needs Karma ruling |
| FR-LOC-11 | languages | P1 (c) * | NS-15; NS-24; NS-43 | A-S08 | new row needed (NR-76) | needs Karma ruling |
| FR-LOC-12 | languages | P1 | NS-15; NS-43 R4 | - | new row needed (NR-76) | locked row |
| FR-LOC-13 | languages | P0 (a) * | NS-05; NS-07; NS-11 | B-S08 | none named | founder |
| FR-LOC-14 | languages | P1 | NS-10 | E-S08, C-S18 | none named | needs Karma ruling |
| FR-LOC-15 | languages | P0 (b) * | NS-07 C28 | C-S05 | BL-411, new row needed (NR-79) | locked row |
| FR-LOC-16 | languages | P1 | NS-23 R2; NS-33 | B-S08, B-S04, A-S07 | none named | locked row |
| FR-LOC-17 | languages | P0 (a) * | NS-17 | D-S02.rtl, B-S05.rtlLabel, A-S07 | BL-411, new row needed (NR-80) | needs Karma ruling |
| FR-LOC-18 | languages | P0 (a) | NS-03; NS-23 | C-S01 | BL-105, new row needed (NR-78) | founder; needs Karma ruling |
| FR-LOC-19 | languages | P0 (a) | NS-17 | - | new row needed (NR-77) | needs Karma ruling |
| FR-LOC-20 | languages | P0 (a) * | NS-35 | A-S01 | none named | founder; needs Karma ruling |
| FR-LOC-21 | languages | P0 (a) | NS-17 R2 | - | none named | locked row |
| FR-LOC-22 | languages | P0 (b) | NS-17 R4; NS-38 | - | none named | locked row |
| FR-LOC-23 | languages | P0 (a) | NS-38 | - | none named | needs Karma ruling |
| FR-LOC-24 | languages | P0 (b) * | NS-39; NS-40 | E-S02 | none named | counsel; needs Karma ruling |
| FR-LOC-25 | languages | P1 | NO CARD LINK | C-S01 | none named | needs Karma ruling |
| FR-LOC-26 | languages | P0 (a,b) | NS-17 R1 R2 R4 | - | new row needed (NR-75) | founder; needs Karma ruling |
| FR-LOC-27 | languages | P1 | NS-17 | - | none named | founder; needs Karma ruling |
| FR-LOC-28 | languages | P0 (a) | NS-17 R10 | A-S07.language | new row needed (NR-81) | locked row |
| FR-LOC-29 | languages | P0 (a) | NS-17 | - | none named | needs Karma ruling |
| FR-LOC-30 | languages | P0 (b) | NS-51; NS-52 | - | BL-321 | counsel; needs Karma ruling |
| FR-LOC-31 | languages | P1 | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-LOC-32 | languages | P1 | NS-51 | - | none named | needs Karma ruling |
| FR-LOC-33 | languages | P1 | NS-01 R11; NS-52 | - | none named | locked row |
| FR-LOC-34 | languages | P0 (a) | NS-01 R21a R54; NS-52 | - | none named | locked row |
| FR-LOC-35 | languages | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-LOC-36 | languages | P1 | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-LOC-37 | languages | P0 (a,b) | NS-38 | - | none named | needs Karma ruling |
| FR-REL-01 | reliability | P1 | NS-10 R8; NS-34; NS-35 | E-ST01, E-ST04 | BL-999 | needs Karma ruling |
| FR-REL-02 | reliability | P1 | NS-38 to NS-45 | E-ST02, E-ST03, E-S14, E-S16 | new row needed (NR-91) | needs Karma ruling |
| FR-REL-03 | reliability | P1 | NS-41 | E-S05, E-S06, E-S14.outage | BL-994 | needs Karma ruling |
| FR-REL-04 | reliability | P1 | NS-08 | - | new row needed (NR-91) | founder; needs Karma ruling |
| FR-REL-05 | reliability | P1 | NO CARD LINK | E-ST02, E-ST03; new screen needed | none named | founder; needs Karma ruling |
| FR-REL-06 | reliability | P2 | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-REL-07 | reliability | P1 | NS-08; NS-10 | E-ST47 | BL-976 | needs Karma ruling |
| FR-REL-08 | reliability | P1 | NS-10; NS-17 | - | new row needed (NR-87) | founder; needs Karma ruling |
| FR-REL-09 | reliability | P1 (a) * | NS-08 | - | BL-976 (eng table), new row needed | founder; needs Karma ruling |
| FR-REL-10 | reliability | P1 | NO CARD LINK | E-ST02 | BL-976 (eng table), new row needed (NR-84) | needs Karma ruling |
| FR-REL-11 | reliability | P1 | NO CARD LINK | - | BL-976 (eng table), new row needed (NR-84) | counsel; founder; needs Karma ruling |
| FR-REL-12 | reliability | P0 (a) | NS-09 | - | BL-566, BL-976 (eng table), new row needed (NR-84) | needs Karma ruling |
| FR-REL-13 | reliability | P0 (a) | NS-09; NS-36 | E-ST47 | BL-551, new row needed (NR-85) | needs Karma ruling |
| FR-REL-14 | reliability | P1 | NO CARD LINK | E-ST47 | new row needed | founder; needs Karma ruling |
| FR-REL-15 | reliability | P1 | NS-10 R14 | E-ST17 | new row needed (NR-85) | locked row |
| FR-REL-16 | reliability | P1 | NO CARD LINK | - | new row needed (NR-91) | needs Karma ruling |
| FR-REL-17 | reliability | P0 (a) | NS-06; NS-09; NS-36 | - | none named | needs Karma ruling |
| FR-REL-18 | reliability | P1 (b) * | NS-08 R7 | E-ST02, E-ST03, E-ST47, E-S13 | new row needed | locked row |
| FR-REL-19 | reliability | P1 | NO CARD LINK | E-ST02, E-ST05 | BL-997 | needs Karma ruling |
| FR-REL-20 | reliability | P2 | NO CARD LINK | - | new row needed | needs Karma ruling |
| FR-REL-21 | reliability | P1 | NO CARD LINK (suggested via card 19 screen table: NS-41) | E-S13, E-S14 | BL-367 | founder; needs Karma ruling |
| FR-REL-22 | reliability | P1 | NO CARD LINK | E-ST02 | new row needed (NR-91) | needs Karma ruling |
| FR-REL-23 | reliability | P0 (a) | NS-01; NS-02; NS-16; NS-18 | - | BL-999, new row needed (NR-32) | needs Karma ruling |
| FR-REL-24 | reliability | P0 (a) | NO CARD LINK | E-S13, E-ST40 | new row needed (NR-32) | needs Karma ruling |
| FR-REL-25 | reliability | P1 | NO CARD LINK | - | new row needed | needs Karma ruling |
| FR-REL-26 | reliability | P1 | NO CARD LINK | E-ST02 | new row needed (NR-86) | needs Karma ruling |
| FR-REL-27 | reliability | P1 | NS-34; plus pack-wide | - | none named | needs Karma ruling |
| FR-REL-28 | reliability | P1 | NO CARD LINK | E-ST02 | new row needed (NR-86) | founder; needs Karma ruling |
| FR-REL-29 | reliability | P1 | NS-34; plus pack-wide | - | none named | needs Karma ruling |
| FR-REL-30 | reliability | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-REL-31 | reliability | P1 | NS-33; NS-34 | - | BL-929, BL-948 | founder; needs Karma ruling |
| FR-REL-32 | reliability | P1 | NS-34 R1 R7; NS-35 | E-S01, E-ST37, E-ST41 | BL-929 | locked row |
| FR-REL-33 | reliability | P0 (c) | NS-34 R2; NS-35 | E-ST35, E-ST36, E-ST38, A-S04 | none named | locked row |
| FR-REL-34 | reliability | P1 | NS-34; NS-37 R1 R6 R7 | - | BL-929 | locked row |
| FR-REL-35 | reliability | P1 | NS-34 | - | none named | needs Karma ruling |
| FR-REL-36 | reliability | P1 | NS-34 | E-ST36 | none named | needs Karma ruling |
| FR-REL-37 | reliability | P1 | NS-08; NS-34; NS-37 | E-ST32, C-S18 | BL-929 | needs Karma ruling |
| FR-REL-38 | reliability | P1 | NS-34 R1 R2 R4 | - | BL-929 (eng table), BL-948 (eng table), new row needed | needs Karma ruling |
| FR-REL-39 | reliability | P1 | NS-02; NS-10 R2; NS-37 | - | BL-929 | locked row |
| FR-REL-40 | reliability | P0 (c) | NS-34; NS-35 | E-ST01 | BL-929, new row needed (NR-88) | needs Karma ruling |
| FR-REL-41 | reliability | P0 (c) | NS-35 | E-S10, E-ST01 | new row needed (NR-88) | needs Karma ruling |
| FR-REL-42 | reliability | P0 (a) | NS-06; NS-09; NS-10 | E-ST02 | BL-978, new row needed (NR-88) | needs Karma ruling |
| FR-REL-43 | reliability | P0 (a) | NS-10 | E-ST39 | new row needed | needs Karma ruling |
| FR-REL-44 | reliability | P2 | NO CARD LINK | E-ST05 | new row needed (NR-89) | needs Karma ruling |
| FR-REL-45 | reliability | P0 (a) | NS-12; NS-21; NS-36 | new screen needed | new row needed (NR-83) | needs Karma ruling |
| FR-REL-46 | reliability | P1 | NS-06 A8; NS-36 | - | new row needed | locked row |
| FR-REL-47 | reliability | P1 | NS-09; NS-10 R6; NS-12 | - | new row needed (NR-83) | locked row |
| FR-REL-48 | reliability | P0 (a,c) | NS-01; NS-07; NS-10; NS-34; NS-35 | E-S17, E-ST32, E-ST34 | BL-929 | locked row |
| FR-REL-49 | reliability | P0 (c) | NS-01; NS-02; NS-34; NS-37 R2 | E-ST38, E-ST39 | BL-929 | locked row |
| FR-REL-50 | reliability | P1 | NS-17; NS-34 | - | none named | needs Karma ruling |
| FR-REL-51 | reliability | P1 | NO CARD LINK | E-ST02 | BL-976, new row needed (NR-91) | needs Karma ruling |
| FR-REL-52 | reliability | P1 | NO CARD LINK (suggested via card 19 screen table: NS-41) | E-S05, E-S06, E-S14 | none named | founder; needs Karma ruling |
| FR-REL-53 | reliability | P1 | NS-10 | - | none named | needs Karma ruling |
| FR-REL-54 | reliability | P1 | NS-15; NS-22; NS-23; NS-43 R3 | A-S05 | BL-929, new row needed (NR-90) | locked row |
| FR-REL-55 | reliability | P1 | NO CARD LINK (suggested via card 19 screen table: NS-41) | E-ST02, E-S14 | new row needed (NR-90) | needs Karma ruling |
| FR-REL-56 | reliability | P1 | NS-06; NS-11; NS-13 R7; NS-23; NS-32 R6 | - | BL-929, new row needed (NR-90) | locked row |
| FR-REL-57 | reliability | P2 | NS-22; NS-24 | - | BL-929, new row needed (NR-90) | needs Karma ruling |
| FR-REL-58 | reliability | P1 | NS-40 | E-S03 | new row needed (NR-90) | counsel; founder; needs Karma ruling |
| FR-REL-59 | reliability | P0 (a) | NS-08 R8; NS-10 R6; NS-37 R4; NS-44 R5 | E-ST37, E-ST17 | BL-978, new row needed (NR-90) | needs Karma ruling |
| FR-REL-60 | reliability | P1 | NS-10 R14 R6 | - | BL-961, BL-978 (eng table) | needs Karma ruling |
| FR-REL-61 | reliability | P0 (a) | NS-08 R8; NS-10 R13; NS-11 | C-S12 | none named | locked row |
| FR-REL-62 | reliability | P0 (a) | NS-01 R17a; NS-52 | - | none named | locked row |
| FR-REL-63 | reliability | P0 (c) | NS-49; NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-REL-64 | reliability | P0 (c) | NS-01; NS-52 | - | none named | locked row |
| FR-REL-65 | reliability | P0 (c) | NS-34; NS-37 R2; NS-51; NS-52 | - | none named | locked row |
| FR-REL-66 | reliability | P1 | NS-37; NS-52 | - | none named | needs Karma ruling |
| FR-REL-67 | reliability | P0 (a) | NS-51; NS-52 | C-S18 | none named | needs Karma ruling |
| FR-REL-68 | reliability | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-REL-69 | reliability | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-REL-70 | reliability | P0 (a) | NS-01 R27; NS-10; NS-52 | - | none named | locked row |
| FR-REL-71 | reliability | P0 (a) | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-REL-72 | reliability | P0 (c) | NS-34; NS-37; NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-AIS-01 | ai-and-speech | P0 (a) | NS-12 R3; NS-19 R4 | - | new row needed (NR-92) | founder; needs Karma ruling |
| FR-AIS-02 | ai-and-speech | P0 (a) | NS-06 A5 | - | new row needed (NR-92) | founder; needs Karma ruling |
| FR-AIS-03 | ai-and-speech | P0 (a) | NO CARD LINK | - | new row needed (NR-92) | needs Karma ruling |
| FR-AIS-04 | ai-and-speech | P0 (a) | NS-09 R14; NS-12 R3; NS-17 R7 R8 | - | BL-987, new row needed (NR-92) | locked row |
| FR-AIS-05 | ai-and-speech | P1 | NS-07 C28; NS-11 | - | none named | locked row |
| FR-AIS-06 | ai-and-speech | P0 (a) | NS-10; NS-12 R3 | - | none named | locked row |
| FR-AIS-07 | ai-and-speech | P0 (a) | NS-16; NS-17 R9; NS-18; NS-19 R4 | A-S06, B-S08 | new row needed (NR-92) | needs Karma ruling |
| FR-AIS-08 | ai-and-speech | P0 (a,b) | NS-21; NS-25 R16 | - | none named | locked row |
| FR-AIS-09 | ai-and-speech | P0 (b) | NS-17 R4 | E-S08.open | new row needed (NR-93) | locked row |
| FR-AIS-10 | ai-and-speech | P0 (b) | NS-17 | - | new row needed (NR-93) | needs Karma ruling |
| FR-AIS-11 | ai-and-speech | P0 (a) | NS-17 R1 R4 | - | BL-043, new row needed (NR-94) | founder |
| FR-AIS-12 | ai-and-speech | P1 | NS-39 R3 R13 | - | new row needed (NR-94) | locked row |
| FR-AIS-13 | ai-and-speech | P0 (b) | NS-39 R3 | E-S08.open | new row needed (NR-94) | locked row |
| FR-AIS-14 | ai-and-speech | P1 | NS-39 R13 | E-S08.open | none named | locked row |
| FR-AIS-15 | ai-and-speech | P0 (a) | NO CARD LINK | - | new row needed (NR-95) | founder; needs Karma ruling |
| FR-AIS-16 | ai-and-speech | P0 (a,c) | NS-17; NS-39 R4 | A-S07 | none named | locked row |
| FR-AIS-17 | ai-and-speech | P0 (b) | pack-wide (frame or every card) | - | new row needed (NR-96) | needs Karma ruling |
| FR-AIS-18 | ai-and-speech | P1 (a) | NO CARD LINK | - | new row needed (NR-96) | needs Karma ruling |
| FR-AIS-19 | ai-and-speech | P0 (a,b) | NO CARD LINK | - | new row needed (NR-96) | needs Karma ruling |
| FR-AIS-20 | ai-and-speech | P0 (a) | NS-17 R1 R2 | E-S08.open | BL-043 | founder |
| FR-AIS-21 | ai-and-speech | P0 (a) | NS-38 | - | BL-043 (eng table) | needs Karma ruling |
| FR-AIS-22 | ai-and-speech | P0 (a) | NS-17 R1 R4 | - | BL-043 | founder |
| FR-AIS-23 | ai-and-speech | P0 (a) | NS-17 R1 | - | BL-043 (eng table), new row needed (NR-97) | founder |
| FR-AIS-24 | ai-and-speech | P1 (c) * | NS-04; NS-17 | - | new row needed (NR-98) | needs Karma ruling |
| FR-AIS-25 | ai-and-speech | P0 (c) | NS-39 R4 | A-S07 | new row needed (NR-98) | founder |
| FR-AIS-26 | ai-and-speech | P0 (b,a) | NS-03; NS-16 R5 | - | new row needed (NR-98) | counsel; needs Karma ruling |
| FR-AIS-27 | ai-and-speech | P0 (a,b) | NS-16 R9 | A-S09 | new row needed (NR-98), new row needed (NR-103) | needs Karma ruling |
| FR-AIS-28 | ai-and-speech | P1 (a) * | NS-17 R2 R6 | - | BL-043, new row needed (NR-98), new row needed (NR-103) | needs Karma ruling |
| FR-AIS-29 | ai-and-speech | P0 (a) | NS-39 R4 | A-S07, A-S04 | none named | locked row |
| FR-AIS-30 | ai-and-speech | P1 | NO CARD LINK (suggested via card 19 screen table: NS-44) | A-S07 | none named | needs Karma ruling |
| FR-AIS-31 | ai-and-speech | P2 (a) | NO CARD LINK (suggested via card 19 screen table: NS-44) | A-S07, B-S08 | new row needed (NR-99) | founder; needs Karma ruling |
| FR-AIS-32 | ai-and-speech | P1 | NS-02 R5; NS-05; NS-07 | - | new row needed (NR-99) | locked row |
| FR-AIS-33 | ai-and-speech | P0 (a) | NS-17 | - | none named | needs Karma ruling |
| FR-AIS-34 | ai-and-speech | P0 (a) | NS-16; NS-17 | - | none named | ruled (E80) |
| FR-AIS-35 | ai-and-speech | P0 (a) | NS-34 R5 | - | new row needed (NR-92) | locked row |
| FR-AIS-36 | ai-and-speech | P0 (a) | NS-34 R5 | - | new row needed (NR-100) | locked row |
| FR-AIS-37 | ai-and-speech | P0 (a,b) | NS-34 R5 | - | none named | counsel; founder |
| FR-AIS-38 | ai-and-speech | P1 | pack-wide (frame or every card) | - | none named | needs Karma ruling |
| FR-AIS-39 | ai-and-speech | P0 (a) | NO CARD LINK | - | new row needed (NR-95) | needs Karma ruling |
| FR-AIS-40 | ai-and-speech | P0 (a) | NO CARD LINK | - | new row needed (NR-92) | founder; needs Karma ruling |
| FR-AIS-41 | ai-and-speech | P2 | NS-24; NS-29 | - | none named | needs Karma ruling |
| FR-AIS-42 | ai-and-speech | P0 (c) | NS-34 | - | BL-043, new row needed (NR-101) | needs Karma ruling |
| FR-AIS-43 | ai-and-speech | P0 (a) | NS-17 | - | BL-043 (eng table), new row needed (NR-101) | needs Karma ruling |
| FR-AIS-44 | ai-and-speech | P1 | NS-34; NS-39 R4 | E-S17, E-S19 | none named | locked row |
| FR-AIS-45 | ai-and-speech | P0 (b) | NS-16 R9 | - | new row needed (NR-92) | counsel |
| FR-AIS-46 | ai-and-speech | P0 (b) | NS-06 A5 | - | none named | counsel |
| FR-AIS-47 | ai-and-speech | P0 (b) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-AIS-48 | ai-and-speech | P0 (a,b) | NS-38; plus pack-wide | - | none named | counsel; needs Karma ruling |
| FR-AIS-49 | ai-and-speech | P0 (a) | NO CARD LINK | - | new row needed (NR-92) | needs Karma ruling |
| FR-AIS-50 | ai-and-speech | P0 (b) | NO CARD LINK | - | new row needed (NR-102) | needs Karma ruling |
| FR-AIS-51 | ai-and-speech | P0 (b) | NS-34 R5 | - | new row needed (NR-102) | locked row |
| FR-AIS-52 | ai-and-speech | P1 | NO CARD LINK | - | new row needed (NR-102) | needs Karma ruling |
| FR-AIS-53 | ai-and-speech | P0 (a) | NS-01 R50; NS-06; NS-17 R3; NS-21 R12; plus pack-wide | - | none named | needs Karma ruling |
| FR-AIS-54 | ai-and-speech | P0 (a) | NS-05 R17; NS-06 A5 | - | none named | ruled (E39) |
| FR-AIS-55 | ai-and-speech | P0 (a) | NS-01 R50; NS-06 A22; NS-21 R12 | A-S06, A-S07, B-S08 | BL-962 | locked row |
| FR-AIS-56 | ai-and-speech | P0 (a) | NS-09; plus pack-wide | A-S07, B-S08 | none named | needs Karma ruling |
| FR-AIS-57 | ai-and-speech | P0 (a) | NS-01 R33; NS-49 R25; NS-51 R5 R29 R33 | - | new row needed | locked row |
| FR-AIS-58 | ai-and-speech | P0 (a) | NS-46; NS-51 R7 | - | none named | locked row |
| FR-AIS-59 | ai-and-speech | P0 (a) | NS-01 R3 R9a R9b R21b R21c; NS-49 R9; NS-51; NS-52 | - | none named | locked row |
| FR-AIS-60 | ai-and-speech | P0 (a) | NO CARD LINK | - | new row needed | needs Karma ruling |
| FR-AIS-61 | ai-and-speech | P0 (a) | NS-51 | - | none named | ruled (E39) |
| FR-AIS-62 | ai-and-speech | P0 (a,b) | NS-02 R5; NS-52 | - | new row needed | locked row |
| FR-AIS-63 | ai-and-speech | P1 (a) | NS-52 | - | none named | founder; needs Karma ruling |
| FR-AIS-64 | ai-and-speech | P0 (a) | NS-01 R8; NS-52 | - | none named | locked row |
| FR-AIS-65 | ai-and-speech | P0 (b) | NS-51 | - | none named | needs Karma ruling |
| FR-AIS-66 | ai-and-speech | P0 (a) | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-AIS-67 | ai-and-speech | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-AIS-68 | ai-and-speech | P0 (a) | NS-01 R21a R50; NS-52 | - | none named | locked row |
| FR-RSH-01 | research | P1 | pack-wide (frame or every card) | - | BL-981 | needs Karma ruling |
| FR-RSH-02 | research | P1 | NS-03 R6 | - | BL-981, new row needed | founder |
| FR-RSH-03 | research | P0 (a) | NO CARD LINK | - | new row needed (NR-106) | founder; needs Karma ruling |
| FR-RSH-04 | research | P1 (c) * | NS-38 to NS-44 | E-S01, E-S02, E-S03, E-S07, E-S08, A-S01.first, E-S10 | BL-994, BL-981 | founder; needs Karma ruling |
| FR-RSH-05 | research | P1 | NS-13; NS-18; NS-32 | D-S04, D-S11, A-S01 | new row needed | founder; needs Karma ruling |
| FR-RSH-06 | research | P0 (b) | NS-25 | D-S15, D-S20 | BL-983 | counsel; needs Karma ruling |
| FR-RSH-07 | research | P1 | NS-06 | B-S12, B-S13, B-S14, B-S16 | BL-968, BL-969, BL-970, BL-981 | counsel; founder; needs Karma ruling |
| FR-RSH-08 | research | P1 (a) * | NS-13; NS-32 | D-S04, D-S11 | BL-943 | needs Karma ruling |
| FR-RSH-09 | research | P2 | NS-07; NS-30 | C-S05 | BL-973 | founder |
| FR-RSH-10 | research | P0 (a) | NS-05 R16a R16b; NS-08 R6 R7 | C-S03, C-S08, E-S10, D-S02 | BL-961, BL-939 | locked row |
| FR-RSH-11 | research | P1 | NS-01; NS-02; NS-05 | B-S04, B-S06, D-S02 | BL-931, BL-952, BL-939, BL-981 | needs Karma ruling |
| FR-RSH-12 | research | P1 | NS-17; NS-33 | A-S05, A-S10, E-S23 | BL-948, BL-984 | needs Karma ruling |
| FR-RSH-13 | research | P0 (b) | NS-03; NS-40 | - | none named | founder; needs Karma ruling |
| FR-RSH-14 | research | P0 (b) | NS-03 | - | BL-981 | counsel; founder; needs Karma ruling |
| FR-RSH-15 | research | P0 (a) | NS-03 R3 | - | new row needed (NR-105) | locked row |
| FR-RSH-16 | research | P0 (a) | NS-17 | A-S07 | BL-962 | founder; needs Karma ruling |
| FR-RSH-17 | research | P0 (b) | NS-03 | - | none named | counsel; founder; needs Karma ruling |
| FR-RSH-18 | research | P1 | pack-wide (frame or every card) | - | none named | founder; needs Karma ruling |
| FR-RSH-19 | research | P0 (b) | NS-03; NS-05; NS-16; NS-25 | - | none named | counsel; founder; needs Karma ruling |
| FR-RSH-20 | research | P0 (b) * | NS-03 R7; plus pack-wide | - | new row needed | founder |
| FR-RSH-21 | research | P0 (a) | NS-03; NS-23 | C-S01, E-S27, E-S28 | none named | founder; needs Karma ruling |
| FR-RSH-22 | research | P0 (a) | NS-03 R4 R5 R8 | - | none named | counsel; founder; needs Karma ruling |
| FR-RSH-23 | research | P1 | NS-11; NS-13; NS-24 | - | none named | counsel; needs Karma ruling |
| FR-RSH-24 | research | P1 | NS-03 R3 | - | BL-981 | locked row |
| FR-RSH-25 | research | P1 | pack-wide (frame or every card) | - | new row needed | needs Karma ruling |
| FR-RSH-26 | research | P0 (a) | NS-38 R2 | - | none named | locked row |
| FR-RSH-27 | research | P0 (a) | NS-03 | - | none named | founder; needs Karma ruling |
| FR-RSH-28 | research | P1 | NO CARD LINK | - | BL-981 | needs Karma ruling |
| FR-RSH-29 | research | P1 | NO CARD LINK | - | new row needed | needs Karma ruling |
| FR-RSH-30 | research | P0 (b) | NS-51; NS-52 | - | none named | counsel; needs Karma ruling |
| FR-RSH-31 | research | P0 (a) | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-RSH-32 | research | P1 | NS-51 | new screen needed | BL-981 | needs Karma ruling |
| FR-RSH-33 | research | P1 (a) * | NS-51 | - | none named | founder; needs Karma ruling |
| FR-RSH-34 | research | P2 | NS-52 | - | none named | needs Karma ruling |
| FR-RSH-35 | research | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-QAL-01 | quality | P0 (a) | NS-38 to NS-45 | - | new row needed | needs Karma ruling |
| FR-QAL-02 | quality | P0 (a) | NO CARD LINK | - | BL-002 | ruled (E55); founder |
| FR-QAL-03 | quality | P0 (a) | NO CARD LINK | E-S27 | BL-002 (eng table), new row needed | needs Karma ruling |
| FR-QAL-04 | quality | P1 | (from text) NS-41 | - | new row needed | needs Karma ruling |
| FR-QAL-05 | quality | P0 (c) | NS-38 to NS-45 | E-S01, E-S10, E-S14, E-S24, E-S26 | new row needed | needs Karma ruling |
| FR-QAL-06 | quality | P0 (a) | NS-39 to NS-43 | E-S05, E-S06, E-S08 | new row needed | needs Karma ruling |
| FR-QAL-07 | quality | P0 (b) | NS-33 R4; NS-34 R1 | E-S23 | BL-929 | founder |
| FR-QAL-08 | quality | P1 | NO CARD LINK (suggested via card 19 screen table: NS-44) | A-S01, A-S07, B-S01, B-S15, C-S01 | new row needed (NR-110) | needs Karma ruling |
| FR-QAL-09 | quality | P0 (b) | NS-33 R1 | E-S23 | BL-929 | locked row |
| FR-QAL-10 | quality | P1 | NS-33 R16 | - | new row needed (NR-111) | locked row |
| FR-QAL-11 | quality | P0 (c) * | NO CARD LINK | - | new row needed | needs Karma ruling |
| FR-QAL-12 | quality | P0 (a) | NS-01 R62; NS-02 R48; NS-34 R5 | - | none named | locked row |
| FR-QAL-13 | quality | P1 | NS-06; NS-13; NS-32; NS-40 | - | none named | needs Karma ruling |
| FR-QAL-14 | quality | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-QAL-15 | quality | P0 (a) | NS-09; NS-39 to NS-43; NS-45 | - | new row needed (NR-113) | needs Karma ruling |
| FR-QAL-16 | quality | P0 (b) | NO CARD LINK | - | new row needed | needs Karma ruling |
| FR-QAL-17 | quality | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-QAL-18 | quality | P1 | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-QAL-19 | quality | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-QAL-20 | quality | P0 (b) | NS-38 R5 R9 | E-S27 | none named | founder |
| FR-QAL-21 | quality | P0 (a) | NS-36; NS-37; NS-42; NS-45 | - | none named | needs Karma ruling |
| FR-QAL-22 | quality | P0 (c) | NS-41 | E-S05, E-S06, E-S14 | new row needed | needs Karma ruling |
| FR-QAL-23 | quality | P0 (b) | NS-33 R6 R12; NS-40 | - | none named | founder; needs Karma ruling |
| FR-QAL-24 | quality | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-QAL-25 | quality | P0 (a) | NS-51; NS-52 | - | new row needed | needs Karma ruling |
| FR-QAL-26 | quality | P0 (c) | NS-49 R28; NS-51; NS-52 | - | none named | founder |
| FR-QAL-27 | quality | P0 (a) | NS-48 R28; NS-51; NS-52 | - | none named | locked row |
| FR-QAL-28 | quality | P0 (a) | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-QAL-29 | quality | P0 (a) | NS-51; NS-52 | - | none named | founder; needs Karma ruling |
| FR-QAL-30 | quality | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-QAL-31 | quality | P1 | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-LCY-01 | lifecycle | P0 (a) | NS-01 | E-S01, E-ST37 | new row needed (NR-116) | needs Karma ruling |
| FR-LCY-02 | lifecycle | P0 (a) | NS-39 R11 | E-S01.recovery, E-S01.recovery-exporting | new row needed (NR-116) | needs Karma ruling |
| FR-LCY-03 | lifecycle | P0 (a) | NS-45 R13 | E-S16, E-S01 | new row needed (NR-117) | locked row |
| FR-LCY-04 | lifecycle | P0 (a) | NS-10 R11 | C-S08 | new row needed (NR-118) | locked row |
| FR-LCY-05 | lifecycle | P1 | NS-38 to NS-44 | E-S03.agreeOnly, E-S24, E-S10, E-S11 | new row needed | needs Karma ruling |
| FR-LCY-06 | lifecycle | P0 (a) | NS-38 | - | new row needed (NR-125) | founder; needs Karma ruling |
| FR-LCY-07 | lifecycle | P0 (b) | NO CARD LINK | - | new row needed (NR-125) | founder; needs Karma ruling |
| FR-LCY-08 | lifecycle | P1 | NO CARD LINK | - | new row needed (NR-125) | needs Karma ruling |
| FR-LCY-09 | lifecycle | P0 (a) | NS-10 R6; NS-45 R3 | C-S10, C-S01 | new row needed (NR-121) | needs Karma ruling |
| FR-LCY-10 | lifecycle | P0 (a,b) | NS-10 R3 R5 R12 | E-S18, C-S10, C-S19 | none named | locked row |
| FR-LCY-11 | lifecycle | P0 (a) | NS-10 R9; NS-45 | E-S24, E-S18, C-S20; new screen needed | new row needed (NR-120) | needs Karma ruling |
| FR-LCY-12 | lifecycle | P0 (a) | NS-10; NS-11 | C-S04, C-S10 | new row needed | needs Karma ruling |
| FR-LCY-13 | lifecycle | P0 (a) | NS-08; NS-10 R1 R13 R14 | C-S09, C-S12 | none named | locked row; ruling also E59 |
| FR-LCY-14 | lifecycle | P0 (a) | NS-08; NS-10 | - | new row needed | needs Karma ruling |
| FR-LCY-15 | lifecycle | P1 | NS-33; NS-34 | E-ST46 | new row needed | needs Karma ruling |
| FR-LCY-16 | lifecycle | P1 | NO CARD LINK | E-S27 | new row needed | founder; needs Karma ruling |
| FR-LCY-17 | lifecycle | P0 (a,c) | NS-45 R13 R14 | E-S16, E-ST18 | new row needed (NR-119) | needs Karma ruling |
| FR-LCY-18 | lifecycle | P1 | NS-45 | - | new row needed (NR-119), new row needed (NR-127) | needs Karma ruling |
| FR-LCY-19 | lifecycle | P0 (a,b) | NS-45 R9 R10 R3 R7 | C-S10, C-S20 | new row needed (NR-120) | locked row |
| FR-LCY-20 | lifecycle | P0 (a) | NS-11 R6a R6b; NS-36 R2 R7 | C-S04 | new row needed (NR-123) | locked row |
| FR-LCY-21 | lifecycle | P0 (a) | NS-01 R59; NS-07; NS-11 R9 R18 | C-S04 | new row needed (NR-122) | needs Karma ruling |
| FR-LCY-22 | lifecycle | P1 | NS-11; NS-36 R2 | C-S04 | new row needed (NR-123) | locked row |
| FR-LCY-23 | lifecycle | P1 | NS-36 R7 | - | new row needed (NR-124) | locked row |
| FR-LCY-24 | lifecycle | P1 | NO CARD LINK (suggested via card 19 screen table: NS-45) | E-S16 | new row needed (NR-125) | needs Karma ruling |
| FR-LCY-25 | lifecycle | P1 | NS-06; NS-11 | C-S04 | new row needed | needs Karma ruling |
| FR-LCY-26 | lifecycle | P1 | NS-10; NS-45 | E-S02, C-S10 | new row needed | needs Karma ruling |
| FR-LCY-27 | lifecycle | P1 | NO CARD LINK | - | new row needed | counsel; needs Karma ruling |
| FR-LCY-28 | lifecycle | P0 (a) | NO CARD LINK | - | new row needed (NR-126) | needs Karma ruling |
| FR-LCY-29 | lifecycle | P2 | NS-36 R10 | - | new row needed | needs Karma ruling |
| FR-LCY-30 | lifecycle | P2 | NS-25; NS-44 | E-S11 | new row needed | needs Karma ruling |
| FR-LCY-31 | lifecycle | P2 | NS-01 R59 | - | new row needed | needs Karma ruling |
| FR-LCY-32 | lifecycle | P2 | NS-25 | - | none named | needs Karma ruling |
| FR-LCY-33 | lifecycle | P1 | NO CARD LINK | new screen needed | new row needed | needs Karma ruling |
| FR-LCY-34 | lifecycle | P0 (a) | NO CARD LINK | - | new row needed | needs Karma ruling |
| FR-LCY-35 | lifecycle | P0 (a) | NS-01 R35; NS-52 | - | new row needed | locked row |
| FR-LCY-36 | lifecycle | P0 (a) | NS-11; NS-52 | - | new row needed | needs Karma ruling |
| FR-LCY-37 | lifecycle | P0 (a) | NS-01 R27 R28 R56; NS-10; NS-51; NS-52 | C-S08 | new row needed | locked row |
| FR-LCY-38 | lifecycle | P1 | NS-52 | - | none named | counsel; needs Karma ruling |
| FR-LCY-39 | lifecycle | P1 | NS-49 R18; NS-51; NS-52 | - | new row needed | locked row |
| FR-LCY-40 | lifecycle | P0 (b) | NS-25; NS-52 | - | new row needed | counsel; needs Karma ruling |
| FR-LCY-41 | lifecycle | P0 (a,b) | NS-01 R16c R31 R55; NS-45; NS-52 | - | none named | locked row |
| FR-LCY-42 | lifecycle | P0 (a) | NS-01 R29 R30; NS-51; NS-52 | - | none named | locked row |
| FR-LCY-43 | lifecycle | P1 | NS-52 | - | none named | founder; needs Karma ruling |
| FR-PRT-01 | print | P0 (b) | NS-07 C28; NS-30 | C-S04 | BL-973, new row needed (NR-128) | locked row |
| FR-PRT-02 | print | P0 (a) | NS-07 C28 | C-S04, C-S05 | none named | locked row |
| FR-PRT-03 | print | P1 | NO CARD LINK | C-S05.ready | none named | needs Karma ruling |
| FR-PRT-04 | print | P1 | NS-07 | - | none named | locked row |
| FR-PRT-05 | print | P2 | NS-07 C28 | B-S19; new screen needed | new row needed (NR-129) | founder |
| FR-PRT-06 | print | P2 | NS-30 | - | new row needed (NR-129) | founder; needs Karma ruling |
| FR-PRT-07 | print | P2 (a) * | NS-07 C28 | new screen needed | new row needed (NR-129) | locked row |
| FR-PRT-08 | print | P2 | NS-07 C28 | - | new row needed (NR-129) | locked row |
| FR-PRT-09 | print | P2 | NO CARD LINK | - | new row needed (NR-129) | needs Karma ruling |
| FR-PRT-10 | print | P2 (b) * | NS-07 C28; NS-17 | - | new row needed (NR-129), new row needed (NR-136) | locked row |
| FR-PRT-11 | print | P2 | NS-07 C28 | B-S08 | new row needed (NR-129), new row needed (NR-136) | locked row |
| FR-PRT-12 | print | P2 | NS-01; NS-07 C28 | - | new row needed (NR-129) | needs Karma ruling |
| FR-PRT-13 | print | P2 | NO CARD LINK | - | new row needed (NR-129) | needs Karma ruling |
| FR-PRT-14 | print | P2 | NS-07 C28 | B-S08 | new row needed (NR-130) | locked row |
| FR-PRT-15 | print | P2 | NO CARD LINK | E-S23 | new row needed (NR-130) | needs Karma ruling |
| FR-PRT-16 | print | P2 | NS-07 C28; NS-12 | C-S04, C-S06, B-S02 | none named | locked row |
| FR-PRT-17 | print | P2 | NO CARD LINK (suggested via card 19 screen table: NS-41, NS-42) | E-S04, E-S07, E-S18 | none named | needs Karma ruling |
| FR-PRT-18 | print | P2 (b) * | NO CARD LINK (suggested via card 19 screen table: NS-42, NS-41) | E-S07 | none named | needs Karma ruling |
| FR-PRT-19 | print | P2 (b) * | NO CARD LINK | E-S27 | new row needed (NR-133) | needs Karma ruling |
| FR-PRT-20 | print | P2 | NO CARD LINK | - | new row needed (NR-132) | needs Karma ruling |
| FR-PRT-21 | print | P2 (b) * | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-PRT-22 | print | P2 | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-PRT-23 | print | P2 | NO CARD LINK | - | new row needed (NR-132) | needs Karma ruling |
| FR-PRT-24 | print | P2 | NO CARD LINK (suggested via card 19 screen table: NS-42, NS-41) | E-S07 | none named | needs Karma ruling |
| FR-PRT-25 | print | P2 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-PRT-26 | print | P2 | NO CARD LINK (suggested via card 19 screen table: NS-41) | E-S14 | new row needed (NR-131) | needs Karma ruling |
| FR-PRT-27 | print | P2 | NO CARD LINK | - | new row needed (NR-131) | needs Karma ruling |
| FR-PRT-28 | print | P2 (b) * | NO CARD LINK | - | new row needed (NR-131) | needs Karma ruling |
| FR-PRT-29 | print | P2 | NO CARD LINK | - | new row needed (NR-131) | founder; needs Karma ruling |
| FR-PRT-30 | print | P2 | NO CARD LINK | - | new row needed (NR-131) | needs Karma ruling |
| FR-PRT-31 | print | P2 (b) * | NO CARD LINK | - | new row needed (NR-131) | needs Karma ruling |
| FR-PRT-32 | print | P2 | NO CARD LINK | - | new row needed (NR-131) | needs Karma ruling |
| FR-PRT-33 | print | P2 | NO CARD LINK | E-S13, C-S01 | new row needed (NR-131), new row needed (NR-138) | needs Karma ruling |
| FR-PRT-34a | print | P2 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-PRT-35 | print | P2 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-PRT-36 | print | P2 | NO CARD LINK | D-S18 | none named | needs Karma ruling |
| FR-PRT-37 | print | P2 | NS-07 C28; NS-25 | D-S18 | none named | counsel; founder; needs Karma ruling |
| FR-PRT-38 | print | P2 | NO CARD LINK | - | new row needed (NR-134) | needs Karma ruling |
| FR-PRT-39 | print | P0 (a) | NS-07 C28; NS-30 | - | none named | locked row |
| FR-PRT-40 | print | P2 | NO CARD LINK | - | new row needed (NR-135) | needs Karma ruling |
| FR-PRT-41 | print | P2 | NO CARD LINK | E-S13 | BL-973 (eng table), new row needed (NR-128) | founder; needs Karma ruling |
| FR-PRT-42 | print | P2 | NS-07 C28 | E-S17 | new row needed (NR-129) | locked row |
| FR-PRT-43 | print | P1 | NS-07 | - | none named | founder |
| FR-PRT-44 | print | P2 | NO CARD LINK | - | new row needed (NR-137) | needs Karma ruling |
| FR-PRT-45 | print | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-PRT-46 | print | P2 (b) * | NO CARD LINK | - | none named | founder; needs Karma ruling |
| FR-PRT-47 | print | P2 (b) * | NO CARD LINK | - | none named | needs Karma ruling |
| FR-PRT-34 | print | P2 | NS-30 | - | none named | founder; needs Karma ruling |
| FR-PRT-48 | print | P2 | NS-30; NS-52 | - | none named | needs Karma ruling |
| FR-PRT-49 | print | P0 (b) | NS-30; NS-52; plus pack-wide | - | none named | needs Karma ruling |
| FR-PRT-50 | print | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-PRT-51 | print | P0 (a) | NS-30; NS-52 | - | none named | needs Karma ruling |
| FR-PRT-52 | print | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-PRT-53 | print | P1 | NS-30 | - | none named | needs Karma ruling |
| FR-PRT-54 | print | P0 (a) | NS-52 | - | none named | needs Karma ruling |
| FR-PRT-55 | print | P0 (a) | NS-30; NS-51 | - | none named | needs Karma ruling |
| FR-DAY-01 | days | P1 | NS-18; NS-46 R1 | - | new row needed | locked row |
| FR-DAY-02 | days | P0 (a) | NS-46 R2 | A-S01; new screen needed | new row needed | locked row |
| FR-DAY-03 | days | P0 (c) | NS-18; NS-32 | D-S10, D-S11 | BL-982, BL-966 | ruled (CB-2, N-2; amended) |
| FR-DAY-04 | days | P0 (a) | NS-18; NS-46 R3 | new screen needed | new row needed | locked row |
| FR-DAY-05 | days | P1 | NS-46 R4 | new screen needed | new row needed | locked row; ruling also DL-4 |
| FR-DAY-06 | days | P0 (a) | NS-46 R5 | D-S08, D-S09; new screen needed | new row needed | locked row; ruling also DL-3 |
| FR-DAY-07 | days | P0 (a) | NS-32 | D-S10.oneDay, D-S10.twoDays | BL-966, new row needed | ruled (DL-2) |
| FR-DAY-08 | days | P1 | NS-13; NS-46 R6 | D-S10 | BL-943, new row needed | locked row; ruling also DL-6 |
| FR-DAY-09 | days | P0 (a) | NS-13; NS-32; NS-46 R7 | D-S10, D-S11; new screen needed | BL-965, new row needed | locked row; ruling also N-3, CB-5, DL-10 |
| FR-DAY-10 | days | P0 (a) | NS-46 R8 | D-S10, D-S11 | BL-965, new row needed | locked row |
| FR-DAY-11 | days | P0 (a) | NS-46 R9 | D-S11; new screen needed | BL-965, new row needed | locked row; ruling also DL-1 |
| FR-DAY-12 | days | P1 | NS-46 R10 | new screen needed | new row needed | locked row |
| FR-DAY-13 | days | P1 | NS-46 | - | new row needed | needs Karma ruling |
| FR-DAY-14 | days | P1 | NS-46 R11 | - | new row needed | locked row |
| FR-DAY-15 | days | P0 (a) | NS-18; NS-46 R12 | D-S08; new screen needed | new row needed | locked row |
| FR-DAY-16 | days | P1 | NS-18; NS-46 R13 | D-S06, D-S09; new screen needed | new row needed | locked row; ruling also R-IA-2 |
| FR-DAY-17 | days | P1 | NS-46 R14 | new screen needed | new row needed | locked row |
| FR-DAY-18 | days | P2 | NS-46 R15 | - | new row needed | locked row; ruling also DL-7 |
| FR-DAY-19 | days | P2 | NS-46 R16 | D-S11 | new row needed | locked row |
| FR-DAY-20 | days | P0 (a) | NS-46 R17 | - | new row needed | locked row |
| FR-DAY-21 | days | P1 | NO CARD LINK | - | new row needed | needs Karma ruling |
| FR-DAY-22 | days | P1 | NS-46 | - | none named | needs Karma ruling |
| FR-DAY-23 | days | P0 (b) | NS-46 | - | none named | ruled (DL-4); counsel; founder |
| FR-DAY-24 | days | P1 | NS-46 R5 | - | none named | locked row; ruling also DL-3 |
| FR-DAY-25 | days | P0 (a) | NS-31; NS-46 R18 | - | new row needed | locked row |
| FR-DAY-26 | days | P0 (a) | NS-32 R1 R3; NS-50 R1; NS-51 | - | none named | locked row |
| FR-DAY-27 | days | P0 (a) | NS-50 R1 R2 | A-S01 | none named | locked row |
| FR-DAY-28 | days | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-DAY-29 | days | P0 (a,b) | NS-51 | - | none named | needs Karma ruling |
| FR-DAY-30 | days | P1 | NS-46 R8 | - | none named | locked row |
| FR-DAY-31 | days | P1 | NS-32 R3 | - | none named | locked row |
| FR-DAY-32 | days | P0 (a,b) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-DAY-33 | days | P0 (a) | NS-01 | - | none named | needs Karma ruling |
| FR-NTC-01 | notifications | P0 (a) | NS-32 R11; NS-48 | - | new row needed | locked row |
| FR-NTC-02 | notifications | P0 (a) | NS-13 R19; NS-32 R1 R7 | - | new row needed | locked row |
| FR-NTC-03 | notifications | P0 (a) | NS-13 R18 | - | new row needed | locked row; ruling also N-6 |
| FR-NTC-04 | notifications | P0 (a) | NS-13 R14; NS-32 | - | new row needed | locked row |
| FR-NTC-05 | notifications | P0 (a) | NS-48 | - | new row needed | ruled (N-4) |
| FR-NTC-06 | notifications | P1 | NS-13; NS-32 R1 | - | new row needed | locked row |
| FR-NTC-07 | notifications | P1 | NS-32; NS-48 | - | new row needed | needs Karma ruling |
| FR-NTC-08 | notifications | P0 (c) | NS-18 R3; NS-32 R3 R9; NS-46 | - | none named | locked row |
| FR-NTC-09 | notifications | P0 (b) | NS-32 R12 R13; NS-46; NS-47 | - | new row needed | locked row; ruling also N-3 |
| FR-NTC-10 | notifications | P0 (a) | NS-32 R11 | - | new row needed | locked row; ruling also N-5 |
| FR-NTC-11 | notifications | P0 (a) | NS-13; NS-32 R12 | - | none named | locked row |
| FR-NTC-12 | notifications | P1 | NS-13 | - | new row needed | ruled (N-8) |
| FR-NTC-13 | notifications | P1 | NS-48 | - | new row needed | ruled (N-7) |
| FR-NTC-14 | notifications | P1 | NS-13 R6a R6b | - | new row needed | locked row |
| FR-NTC-15 | notifications | P1 | NO CARD LINK | - | new row needed | needs Karma ruling |
| FR-NTC-16 | notifications | P1 | NS-32 R10 R13 | - | none named | locked row |
| FR-NTC-17 | notifications | P1 | NS-48 | - | new row needed | needs Karma ruling |
| FR-NTC-18 | notifications | P1 | NS-48 | - | new row needed | ruled (N-1, DL-5) |
| FR-NTC-19 | notifications | P1 | NS-13; NS-32 R3 | - | none named | locked row |
| FR-NTC-20 | notifications | P1 | NS-13; NS-32 | - | none named | needs Karma ruling |
| FR-NTC-21 | notifications | P2 | NS-17 | - | none named | needs Karma ruling |
| FR-NTC-22 | notifications | P0 (a) | NS-32 R1 R2 R3 R5 R15; NS-51 | - | none named | locked row |
| FR-NTC-23 | notifications | P0 (a) | NS-13; NS-32 R1 R7 R15 | - | new row needed (NR-160) | locked row |
| FR-NTC-24 | notifications | P0 (a) | NS-13 R18 R19 | - | new row needed (NR-160) | locked row |
| FR-NTC-25 | notifications | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-NTC-26 | notifications | P0 (a) | NS-32 R10 R12 R13 | - | none named | locked row |
| FR-NTC-27 | notifications | P0 (a,b) | NS-13; NS-51 | - | none named | locked row |
| FR-NTC-28 | notifications | P0 (a) | NS-32 R14; NS-51 | - | new row needed (NR-160) | locked row |
| FR-NTC-29 | notifications | P0 (a) | NS-48 R5; NS-49 R3 | - | none named | locked row |
| FR-NTC-30 | notifications | P1 (a) | NS-13; NS-49 R25; NS-51 | - | none named | locked row |
| FR-NTC-31 | notifications | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-CUL-01 | cultural-data | P0 (a) | NS-36; NS-47 | C-S24 | new row needed (NR-161) | ruled (CB-1) |
| FR-CUL-02 | cultural-data | P0 (a) | NS-18; NS-47 R1 | D-S06, C-S24 | new row needed (NR-161) | locked row |
| FR-CUL-03 | cultural-data | P0 (a) | NS-47 R2 | C-S15 | none named | locked row |
| FR-CUL-04 | cultural-data | P0 (a) | NS-47 R3 | E-S24 | new row needed (NR-32), new row needed (NR-162), new row needed (NR-163), new row needed (NR-165) | locked row |
| FR-CUL-05 | cultural-data | P0 (a) | NS-13; NS-35; NS-47 R4 | - | new row needed (NR-163) | locked row; ruling also CB-3 |
| FR-CUL-06 | cultural-data | P0 (a) | NS-37 R4; NS-47 R5 | - | new row needed (NR-161) | locked row; ruling also E37 |
| FR-CUL-07 | cultural-data | P0 (a) | NS-13 R22; NS-47 R6 | E-S24, C-S10 | new row needed (NR-32) | locked row |
| FR-CUL-08 | cultural-data | P0 (a) | NS-47 R7 | - | new row needed (NR-32) | locked row |
| FR-CUL-09 | cultural-data | P0 (a) | NS-47 R8 | - | new row needed (NR-165) | locked row |
| FR-CUL-10 | cultural-data | P1 (a) | NS-11; NS-47 R9 | C-S04 | new row needed (NR-32) | ruled (CB-4) |
| FR-CUL-11 | cultural-data | P0 (a,b) | NS-32; NS-47 R10 | - | new row needed (NR-162) | locked row |
| FR-CUL-12 | cultural-data | P0 (a) | NS-13; NS-32 R12 R13; NS-47 R11 | D-S06, D-S10 | new row needed (NR-164), new row needed (NR-167) | ruled (CB-5, N-2) |
| FR-CUL-13 | cultural-data | P1 | NS-23; NS-47 R12 | A-S01, C-S24 | none named | locked row |
| FR-CUL-14 | cultural-data | P1 (b) | NS-32 | - | none named | ruled (CB-5); counsel |
| FR-CUL-15 | cultural-data | P0 (a) | NS-47 R13 | C-S03 | BL-961, new row needed (NR-161) | ruled (CB-4) |
| FR-CUL-16 | cultural-data | P0 (a) | NS-36; NS-47 R14 | C-S19 | new row needed (NR-161) | needs Karma ruling |
| FR-CUL-17 | cultural-data | P1 (b) | NS-45; NS-47 R15 | C-S20 | none named | ruled (CB-4) |
| FR-CUL-18 | cultural-data | P1 (b) | NS-39; NS-47 R16 | E-S01, E-S08 | none named | locked row; ruling also CB-6 |
| FR-CUL-19 | cultural-data | P1 | NS-13; NS-47 R17 | A-S13, D-S04, A-S01 | new row needed (NR-166) | locked row; ruling also CB-6 |
| FR-CUL-20 | cultural-data | P1 | NS-47 R18 | - | none named | locked row; ruling also CB-6 |
| FR-CUL-21 | cultural-data | P0 (b) | NS-47 R19 | C-S24 | new row needed (NR-166) | locked row |
| FR-CUL-22 | cultural-data | P0 (a) | NS-47 R20 | - | none named | locked row |
| FR-CUL-23 | cultural-data | P0 (b) | NS-47 | E-S27 | BL-975 (eng table) | counsel; needs Karma ruling |
| FR-CUL-24 | cultural-data | P1 (b) | NS-46 | - | none named | needs Karma ruling |
| FR-CUL-25 | cultural-data | P1 | NS-18; NS-25 | D-S13, D-S18 | none named | needs Karma ruling |
| FR-CUL-26 | cultural-data | P1 (b) | NS-33 | C-S24, A-S01.daysAsk | none named | needs Karma ruling |
| FR-CUL-27 | cultural-data | P2 | NS-47 | - | none named | founder; needs Karma ruling |
| FR-CUL-28 | cultural-data | P0 (a,b) | NS-51 | - | none named | needs Karma ruling |
| FR-CUL-29 | cultural-data | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-CUL-30 | cultural-data | P0 (a,b) | NS-51 | - | none named | needs Karma ruling |
| FR-CUL-31 | cultural-data | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-CUL-32 | cultural-data | P1 (a) | NS-13; NS-51 | - | none named | needs Karma ruling |
| FR-CUL-33 | cultural-data | P0 (a) | NS-36 | - | none named | needs Karma ruling |
| FR-CUL-34 | cultural-data | P0 (a,b) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-CUL-35 | cultural-data | P0 (a,b) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-CUL-36 | cultural-data | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-PHS-01 | photos | P1 | NS-01 R1 R23a; NS-35 | A-S04; new screen needed | new row needed | locked row |
| FR-PHS-02 | photos | P1 | NS-01 R1; NS-35; NS-50 | - | new row needed (NR-171) | locked row; ruling also R-IA-3 |
| FR-PHS-03 | photos | P1 | NS-01 R8 R9b | - | new row needed (NR-171) | locked row |
| FR-PHS-04 | photos | P0 (a) | NS-01 R21b R33; NS-48 | - | none named | locked row |
| FR-PHS-10 | photos | P1 | NS-01 R59 R19 | new screen needed | new row needed (NR-168) | locked row |
| FR-PHS-11 | photos | P0 (a) | NS-01 R2 R22 | - | new row needed (NR-168) | locked row |
| FR-PHS-12 | photos | P0 (a) | NS-01 R3 R6 R17c R52 | - | new row needed (NR-168) | locked row |
| FR-PHS-13 | photos | P1 | NS-01 | new screen needed | new row needed (NR-168) | needs Karma ruling |
| FR-PHS-14 | photos | P0 (a) | NS-01 R8 R9b R21a R21b | new screen needed | new row needed (NR-168) | founder |
| FR-PHS-15 | photos | P0 (a) | NS-01 R9b R33 | - | new row needed (NR-168) | locked row |
| FR-PHS-16 | photos | P1 | NS-01 R17a | new screen needed | new row needed (NR-168) | locked row |
| FR-PHS-17 | photos | P0 (a) | NS-01 R4 | new screen needed | new row needed (NR-168) | locked row |
| FR-PHS-18 | photos | P1 | NS-01 R2 | new screen needed | new row needed (NR-168) | locked row |
| FR-PHS-19 | photos | P0 (a) | NS-01 R13a R47 | - | new row needed (NR-168) | locked row |
| FR-PHS-20 | photos | P0 (a) | NS-01 R14 R15 R26 | - | new row needed (NR-168) | locked row |
| FR-PHS-21 | photos | P1 | NS-01 R19 | - | new row needed | locked row |
| FR-PHS-22 | photos | P0 (b) | NS-35 | - | new row needed | needs Karma ruling |
| FR-PHS-23 | photos | P0 (b) | NS-01 R32 | - | new row needed | locked row |
| FR-PHS-24 | photos | P1 | NS-01 R20a | - | none named | locked row |
| FR-PHS-25 | photos | P1 | NS-01 | - | none named | needs Karma ruling |
| FR-PHS-30 | photos | P2 | NS-32 | - | new row needed | needs Karma ruling |
| FR-PHS-31 | photos | P1 | NS-13; NS-32 R1 | new screen needed | none named | locked row |
| FR-PHS-32 | photos | P1 | NS-13; NS-32 R1 | new screen needed | none named | locked row |
| FR-PHS-33 | photos | P0 (a) | NS-01 R51 | - | new row needed | locked row |
| FR-PHS-34 | photos | P1 | NO CARD LINK | - | new row needed | needs Karma ruling |
| FR-PHS-40 | photos | P0 (a) | NS-01 R22 R33 | - | new row needed | locked row |
| FR-PHS-41 | photos | P0 (a) | NS-01 R62 | - | new row needed | locked row |
| FR-PHS-42 | photos | P1 | NO CARD LINK | - | new row needed | needs Karma ruling |
| FR-PHS-43 | photos | P0 (a) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-PHS-44 | photos | P0 (a) | NS-01 | - | none named | needs Karma ruling |
| FR-PHS-50 | photos | P0 (a) | NS-01 | - | new row needed (NR-173) | needs Karma ruling |
| FR-PHS-51 | photos | P0 (a) | NS-01 R51 | - | new row needed (NR-32) | locked row |
| FR-PHS-52 | photos | P0 (a) | NS-01 R6 R14 | - | none named | locked row |
| FR-PHS-53 | photos | P0 (a) | NS-01 | - | none named | needs Karma ruling |
| FR-PHS-54 | photos | P0 (b) | NS-01 | - | none named | ruled (RV-12) |
| FR-PHS-55 | photos | P0 (b) | NS-01 | - | new row needed (NR-173) | needs Karma ruling |
| FR-PHS-56 | photos | P0 (b) | NO CARD LINK | - | none named | needs Karma ruling |
| FR-PHS-57 | photos | P0 (a) | NS-01 R33 | - | none named | locked row |
| FR-PHS-58 | photos | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-PHS-59 | photos | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-PHS-60 | photos | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-PHS-61 | photos | P0 (a) | NS-32; NS-51 | - | none named | needs Karma ruling |
| FR-PHS-62 | photos | P1 | NS-51 | - | none named | needs Karma ruling |
| FR-PHS-63 | photos | P0 (a) | NS-51 | - | none named | needs Karma ruling |
| FR-PHS-64 | photos | P0 (a) | NS-49; NS-51 | - | none named | needs Karma ruling |
| FR-PHS-65 | photos | P0 (a) | NS-01; NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-PHS-66 | photos | P0 (a) | NS-01 R22; NS-52 | - | none named | locked row |
| FR-PHS-67 | photos | P0 (c) | NS-52 | - | none named | needs Karma ruling |
| FR-PHS-68 | photos | P1 | NS-01 R6; NS-52 | - | none named | locked row |
| FR-PHS-69 | photos | P0 (a) | NS-52 | - | none named | needs Karma ruling |
| FR-PHS-70 | photos | P0 (b) | NS-49 R30; NS-52 | - | none named | locked row |
| FR-PHS-71 | photos | P0 (a) | NS-01; NS-02; NS-52 | - | none named | needs Karma ruling |
| FR-OPP-01 | opportunities | P1 | NS-35 R3 | - | none named | locked row |
| FR-OPP-02 | opportunities | P1 | NS-01 R1 R19 R20a | A-S01, A-S03 | BL-931 | locked row; ruling also R-IA-3 |
| FR-OPP-03 | opportunities | P0 (a) | NS-01; NS-32 | A-S03 | new row needed | ruled (RV-12) |
| FR-OPP-04 | opportunities | P1 | NS-23 | A-S01 | new row needed | needs Karma ruling |
| FR-OPP-05 | opportunities | P0 (a) | NS-04; NS-06; NS-35 R3 R4 R7 | A-S14 | new row needed | locked row |
| FR-OPP-06 | opportunities | P0 (a) | NS-04 | A-S14 | new row needed | needs Karma ruling |
| FR-OPP-07 | opportunities | P1 | NS-16 | A-S09 | BL-980, new row needed | needs Karma ruling |
| FR-OPP-08 | opportunities | P1 | NS-06 | A-S03 | new row needed | needs Karma ruling |
| FR-OPP-09 | opportunities | P0 (b) | NO CARD LINK | - | none named | counsel; founder; needs Karma ruling |
| FR-OPP-10 | opportunities | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-OPP-11 | opportunities | P2 | NS-09 | A-S07 | new row needed | needs Karma ruling |
| FR-OPP-12 | opportunities | P1 | NO CARD LINK | - | none named | needs Karma ruling |
| FR-OPP-13 | opportunities | P1 | NS-52 | - | none named | needs Karma ruling |
| FR-OPP-14 | opportunities | P0 (a) | NS-51; NS-52 | - | none named | needs Karma ruling |
| FR-OPP-15 | opportunities | P1 | NS-23 | - | none named | needs Karma ruling |
| FR-OPP-16 | opportunities | P1 | NS-07; NS-24; NS-52 | - | none named | locked row |
| FR-OPP-17 | opportunities | P1 | NO CARD LINK | - | none named | needs Karma ruling |

## 2. Reverse view per card, NS-01 to NS-50

Verdict key: C covered, P partly, M missing, n/a not applicable to that function, NR the function did not review the card (written after, or not on disk), `-` the function file has no per-card verdict row for the card. Where a function split a card into parts (NS-06 A, B, C; NS-07 C5, C28, G11) the worst part is shown and the parts are in 2c. Functions with no per-card verdict table at all are listed under the first table.

### 2a. Function verdicts per card

Card titles are read from the cards on disk (NS-46 to NS-50 are the proposed titles, no card yet).

**First wave (nine functions)**

| Card | support | marketing | operations | finance | data | privacy | legal | compliance | security and risk | FRs touching |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-01 | P | P | P | C | P | C | P | P | P | 119 |
| NS-02 | C | P | P | C | P | C | C | C | P | 37 |
| NS-03 | P | C | C | C | C | C | P | C | C | 21 |
| NS-04 | C | C | C | C | C | C | C | C | C | 8 |
| NS-05 | P | P | P | C | P | C | P | P | C | 40 |
| NS-06 | P | P | P | P | P | P | P | P | P | 58 |
| NS-07 | P | C | P | P | P | P | P | C | P | 41 |
| NS-08 | P | P | P | P | P | P | P | P | C | 44 |
| NS-09 | C | C | C | C | C | C | C | C | C | 19 |
| NS-10 | P | C | P | P | P | P | P | P | P | 49 |
| NS-11 | P | C | C | C | P | P | C | C | P | 28 |
| NS-12 | C | C | P | M | P | P | P | C | C | 18 |
| NS-13 | C | P | P | C | P | C | C | C | C | 42 |
| NS-14 | C | C | C | C | P | C | C | C | C | 8 |
| NS-15 | C | C | C | C | P | C | C | C | C | 6 |
| NS-16 | M | C | P | C | P | P | P | P | C | 26 |
| NS-17 | C | P | P | P | P | P | P | P | P | 54 |
| NS-18 | C | C | C | C | C | C | P | C | C | 23 |
| NS-19 | C | C | C | n/a | n/a | C | C | C | C | 6 |
| NS-20 | C | C | C | n/a | n/a | C | C | C | C | 4 |
| NS-21 | P | C | C | C | C | C | C | C | C | 13 |
| NS-22 | C | C | C | C | C | C | C | C | C | 7 |
| NS-23 | P | C | C | C | C | C | C | C | C | 17 |
| NS-24 | C | P | C | C | P | C | C | C | C | 15 |
| NS-25 | M | P | P | P | P | P | M | P | P | 61 |
| NS-26 | C | C | C | P | n/a | C | C | C | C | 8 |
| NS-27 | C | C | C | n/a | n/a | C | C | C | C | 2 |
| NS-28 | C | C | C | P | n/a | C | C | C | C | 7 |
| NS-29 | C | C | C | C | n/a | C | C | C | C | 2 |
| NS-30 | C | C | C | P | n/a | C | C | C | C | 15 |
| NS-31 | C | C | C | n/a | n/a | C | C | C | C | 2 |
| NS-32 | C | P | C | C | C | C | C | C | C | 48 |
| NS-33 | P | C | P | C | P | C | C | P | C | 25 |
| NS-34 | C | C | P | P | C | C | C | C | C | 34 |
| NS-35 | C | C | C | C | C | C | C | C | C | 19 |
| NS-36 | P | C | P | C | C | P | P | P | C | 31 |
| NS-37 | C | C | C | C | C | C | C | C | C | 14 |
| NS-38 | NR | P | NR | P | P | C | P | P | C | 43 |
| NS-39 | NR | P | NR | C | C | C | C | C | C | 42 |
| NS-40 | NR | P | NR | C | P | P | C | P | C | 34 |
| NS-41 | NR | M | NR | NR | P | P | P | P | C | 56 |
| NS-42 | NR | M | NR | NR | M | M | P | P | C | 33 |
| NS-43 | NR | M | NR | NR | M | M | NR | NR | C | 34 |
| NS-44 | NR | M | NR | NR | M | M | NR | NR | C | 30 |
| NS-45 | NR | M | NR | NR | M | M | NR | NR | M | 49 |
| NS-46 | - | - | - | - | - | - | - | - | - | 38 |
| NS-47 | - | - | - | - | - | - | - | - | - | 35 |
| NS-48 | - | - | - | - | - | - | - | - | - | 32 |
| NS-49 | - | - | - | - | - | - | - | - | - | 60 |
| NS-50 | - | - | - | - | - | - | - | - | - | 7 |

**Second and third wave (fourteen functions)**

| Card | back-office | messaging | languages | reliability | ai-and-speech | research | quality | lifecycle | print | days | notifications | cultural-data | photos | opportunities | FRs touching |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NS-01 | - | NR | C | P | C | - | P | P | C | n/a | - | n/a | - | - | 119 |
| NS-02 | - | NR | n/a | P | C | - | P | P | - | n/a | - | - | - | - | 37 |
| NS-03 | - | NR | - | C | P | - | P | n/a | - | n/a | - | - | - | - | 21 |
| NS-04 | - | NR | - | C | P | - | P | n/a | - | n/a | - | - | - | - | 8 |
| NS-05 | - | NR | P | P | C | - | P | C | - | n/a | - | - | - | - | 40 |
| NS-06 | - | NR | - | P | C | - | P | P | C | n/a | - | - | - | - | 58 |
| NS-07 | - | NR | P | P | n/a | - | P | P | P | n/a | - | - | - | - | 41 |
| NS-08 | - | NR | - | P | P | - | P | P | C | n/a | - | - | - | - | 44 |
| NS-09 | - | NR | - | P | C | - | P | C | - | n/a | - | - | - | - | 19 |
| NS-10 | - | P | P | P | P | - | P | P | - | n/a | - | - | - | - | 49 |
| NS-11 | - | NR | - | P | C | - | P | P | C | n/a | - | M | - | - | 28 |
| NS-12 | - | NR | - | P | C | - | P | P | C | n/a | - | - | - | - | 18 |
| NS-13 | - | C | - | C | n/a | - | P | P | - | P | - | P | - | - | 42 |
| NS-14 | - | NR | - | P | n/a | - | P | P | - | n/a | - | - | - | - | 8 |
| NS-15 | - | NR | - | P | n/a | - | P | P | - | n/a | - | - | - | - | 6 |
| NS-16 | - | NR | C | P | P | - | P | P | - | n/a | - | - | - | - | 26 |
| NS-17 | - | NR | P | P | C | - | P | P | P | n/a | - | - | - | - | 54 |
| NS-18 | - | C | - | P | C | - | P | P | - | P | - | P | - | - | 23 |
| NS-19 | - | NR | - | P | C | - | P | P | - | n/a | - | - | - | - | 6 |
| NS-20 | - | NR | - | P | n/a | - | P | P | - | n/a | - | - | - | - | 4 |
| NS-21 | - | NR | - | P | C | - | P | C | - | n/a | - | - | - | - | 13 |
| NS-22 | - | NR | - | P | n/a | - | P | C | P | n/a | - | - | - | - | 7 |
| NS-23 | - | NR | C | P | n/a | - | P | C | - | n/a | - | - | - | - | 17 |
| NS-24 | - | NR | P | P | n/a | - | P | C | C | n/a | - | - | - | - | 15 |
| NS-25 | - | P | - | P | P | - | P | P | P | n/a | - | C | - | - | 61 |
| NS-26 | - | C | - | C | C | - | - | C | - | n/a | - | - | - | - | 8 |
| NS-27 | - | NR | - | C | C | - | - | C | - | n/a | - | - | - | - | 2 |
| NS-28 | - | NR | - | C | C | - | - | C | C | n/a | - | - | - | - | 7 |
| NS-29 | - | NR | - | C | C | - | - | C | - | n/a | - | - | - | - | 2 |
| NS-30 | - | NR | - | C | C | - | - | C | P | n/a | - | - | - | - | 15 |
| NS-31 | - | NR | - | C | C | - | - | C | - | C | - | - | - | - | 2 |
| NS-32 | - | C | - | C | n/a | - | P | C | - | P | - | P | - | - | 48 |
| NS-33 | - | NR | P | C | n/a | - | P | P | - | n/a | - | - | - | - | 25 |
| NS-34 | - | NR | - | P | P | - | P | P | - | n/a | - | - | - | - | 34 |
| NS-35 | - | NR | - | C | n/a | - | C | P | - | n/a | - | - | - | - | 19 |
| NS-36 | - | NR | C | P | n/a | - | P | P | - | n/a | - | M | - | - | 31 |
| NS-37 | - | NR | - | P | n/a | - | P | n/a | - | n/a | - | - | - | - | 14 |
| NS-38 | - | P | P | P | P | - | P | P | - | - | - | - | - | - | 43 |
| NS-39 | - | C | C | P | C | - | M | P | - | - | - | C | - | - | 42 |
| NS-40 | - | C | C | P | n/a | - | M | P | - | - | - | C | - | - | 34 |
| NS-41 | - | P | C | P | n/a | - | M | P | - | - | - | C | - | - | 56 |
| NS-42 | - | NR | C | P | n/a | - | M | P | - | - | - | - | - | - | 33 |
| NS-43 | - | - | C | P | n/a | - | M | P | - | - | - | - | - | - | 34 |
| NS-44 | - | - | NR | P | n/a | - | M | P | - | - | - | P | - | - | 30 |
| NS-45 | - | - | NR | P | n/a | - | M | P | - | - | - | M | - | - | 49 |
| NS-46 | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 38 |
| NS-47 | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 35 |
| NS-48 | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 32 |
| NS-49 | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 60 |
| NS-50 | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 7 |

No per-card verdict table in the file (all cells `-` above): back-office, research, notifications, photos, opportunities. Of these, back-office gives a verdict per back-office area, not per card (its section 2.3); research, photos and opportunities give a coverage check and no verdict; notifications gives a coverage check and the proposed card NS-48.

Totals per function over NS-01 to NS-50 (cards where a function split the card count once, at the worst part):

| Function | C | P | M | n/a | NR | no row |
|---|---|---|---|---|---|---|
| support | 23 | 12 | 2 | 0 | 8 | 5 |
| marketing | 27 | 13 | 5 | 0 | 0 | 5 |
| operations | 22 | 15 | 0 | 0 | 8 | 5 |
| finance | 24 | 11 | 1 | 4 | 5 | 5 |
| data | 13 | 20 | 4 | 8 | 0 | 5 |
| privacy | 29 | 12 | 4 | 0 | 0 | 5 |
| legal | 26 | 15 | 1 | 0 | 3 | 5 |
| compliance | 28 | 14 | 0 | 0 | 3 | 5 |
| security and risk | 36 | 8 | 1 | 0 | 0 | 5 |
| back-office | 0 | 0 | 0 | 0 | 0 | 50 |
| messaging | 6 | 4 | 0 | 0 | 32 | 8 |
| languages | 9 | 7 | 0 | 1 | 2 | 31 |
| reliability | 12 | 33 | 0 | 0 | 0 | 5 |
| ai-and-speech | 18 | 8 | 0 | 19 | 0 | 5 |
| research | 0 | 0 | 0 | 0 | 0 | 50 |
| quality | 1 | 31 | 7 | 0 | 0 | 11 |
| lifecycle | 13 | 29 | 0 | 3 | 0 | 5 |
| print | 7 | 5 | 0 | 0 | 0 | 38 |
| days | 1 | 3 | 0 | 33 | 0 | 13 |
| notifications | 0 | 0 | 0 | 0 | 0 | 50 |
| cultural-data | 4 | 4 | 3 | 1 | 0 | 38 |
| photos | 0 | 0 | 0 | 0 | 0 | 50 |
| opportunities | 0 | 0 | 0 | 0 | 0 | 50 |

Cards where at least one function says M (missing):

- NS-11: cultural-data
- NS-12: finance
- NS-16: support
- NS-25: support, legal
- NS-36: cultural-data
- NS-39: quality
- NS-40: quality
- NS-41: marketing, quality
- NS-42: marketing, data, privacy, quality
- NS-43: marketing, data, privacy, quality
- NS-44: marketing, data, privacy, quality
- NS-45: marketing, data, privacy, security, quality, cultural-data

Pack-wide verdict rows that name no card:

- marketing, "Pack-wide: Apple rating prompt (F13-REQ-020)": missing. No card owns when the rating request may and may not appear (FR-MKT-23)
- data, "Frame North Star": Missing. "Families with a letter in the last 7 days, testers by hand" has no fixed question in any card or in the frame (FR-DAT-21, C-04)

### 2b. FRs that touch each card

Union of: the Links column (no mark), the requirement text (`~t`), the FR rows named in that function's own verdict row for the card (`~v`), and the FR ids the card itself names (`~c`; only card 21 names any today). FRs whose Links column names only the frame or "every card" are in 2d, not repeated here. The Card column carries the title and the file it is read from.

| Card | FR ids |
|---|---|
| NS-01 Photo with a letter (01-photo-with-a-letter.md) | SUP-04~t~v; SUP-11; SUP-21; MKT-01~t; MKT-11; MKT-12; MKT-17~t; OPS-01; OPS-05; OPS-17; OPS-18~t~v; OPS-22~v; OPS-23; OPS-27~t~v; OPS-28~t~v; OPS-31; OPS-39~t; FIN-06; DAT-07~t; DAT-10; DAT-11; DAT-13; DAT-21~t; DAT-31~t; DAT-43~t; PRV-06~v; PRV-07; PRV-16; PRV-18; PRV-30; PRV-34; PRV-40; PRV-43; PRV-48; LEG-01; LEG-02; LEG-14; LEG-18~t; CMP-01~t; CMP-03; CMP-04; CMP-06~t; CMP-08; CMP-12~t; CMP-20~t; CMP-23; SEC-01; SEC-22; SEC-14; SEC-18; SEC-27~t; SEC-30; SEC-31; MSG-44; MSG-46; LOC-33; LOC-34; REL-23; REL-34~v; REL-48; REL-49; REL-59~t; REL-62; REL-64; REL-70; AIS-53; AIS-55; AIS-57; AIS-59; AIS-64; AIS-68; RSH-11; QAL-12; LCY-01; LCY-21; LCY-31; LCY-35; LCY-37; LCY-41; LCY-42; PRT-12; PRT-13~v; DAY-33; PHS-01; PHS-02; PHS-03; PHS-04; PHS-10; PHS-11; PHS-12; PHS-13; PHS-14; PHS-15; PHS-16; PHS-17; PHS-18; PHS-19; PHS-20; PHS-21; PHS-23; PHS-24; PHS-25; PHS-33; PHS-40; PHS-41; PHS-44; PHS-50; PHS-51; PHS-52; PHS-53; PHS-54; PHS-55; PHS-57; PHS-65; PHS-66; PHS-68; PHS-71; OPP-02; OPP-03 |
| NS-02 Find (02-find.md) | SUP-04~t~v; SUP-11; MKT-01~t; MKT-07; MKT-11; MKT-13; MKT-17~t; OPS-01; OPS-02; OPS-05; OPS-17; OPS-18~t; OPS-22~v; OPS-23~v; OPS-31; DAT-06~t; DAT-21~t; DAT-27; DAT-30; PRV-10~v; PRV-13; PRV-14~v; PRV-39; LEG-02; CMP-03~v; SEC-01; SEC-03; SEC-18; REL-23; REL-39; REL-48~v; REL-49; AIS-32; AIS-62; RSH-11; QAL-12; PHS-71 |
| NS-03 The family-hears-it pilot (03-family-hears-it-pilot.md) | SUP-16; POL-03; POL-13; MKT-25; FIN-13; DAT-08~t; DAT-10~t; LEG-11; LOC-18; AIS-26; RSH-02; RSH-13; RSH-14; RSH-15; RSH-17; RSH-19; RSH-20; RSH-21; RSH-22; RSH-24; RSH-27 |
| NS-04 Hands-free capture (04-hands-free-capture-spike.md) | OPS-27; FIN-06; PRV-17; MSG-44; AIS-24; PHS-22~t; OPP-05; OPP-06 |
| NS-05 Share one letter (05-share-one-letter.md) | SUP-04~t; SUP-07; POL-03; POL-08; POL-09; MKT-01~t; MKT-11; MKT-14; MKT-17; MKT-19; OPS-01~v; OPS-18~t; OPS-23~v; OPS-26; DAT-06~t; DAT-27; PRV-13~v; PRV-34; LEG-05; LEG-18~t; CMP-01~t; CMP-05; CMP-06~t; CMP-07~t; CMP-12~t; CMP-19; SEC-17; SEC-30; SEC-35; BKO-12; MSG-45; LOC-13; REL-54~v; REL-55~v; REL-56~v; AIS-32; AIS-54; RSH-10; RSH-11; RSH-19 |
| NS-06 Firsts, the sealed letter and quick capture (06-firsts-sealed-letter-quick-capture.md) | SUP-04~t; SUP-07~t~v; SUP-11; MKT-01~t; MKT-11; MKT-13; MKT-17~t; OPS-05; OPS-06; OPS-07; OPS-08; OPS-18~t; OPS-23~v; OPS-24; OPS-26; OPS-27; OPS-28~t; FIN-02~t; FIN-06; FIN-19; DAT-12; DAT-27; PRV-10~v; PRV-16; PRV-17; PRV-18~v; LEG-02; LEG-06; LEG-07; LEG-08; LEG-18~t; CMP-02; CMP-03~v; CMP-07~t; CMP-08; CMP-12~t; SEC-21; SEC-14; SEC-18; SEC-20; RSK-03; SEC-27; REL-13~v; REL-17; REL-42; REL-45~v; REL-46; REL-56; AIS-02; AIS-46; AIS-53; AIS-54; AIS-55; RSH-07; QAL-13; LCY-25; OPP-05; OPP-08 |
| NS-07 Remaining rows of the capability map (NX-42): quiet days (C5), the printable book (C28), the label guard (G11), and what is cited or parked (07-remaining-capability-rows.md) | SUP-20~v; MKT-01~t; OPS-26; OPS-34; FIN-24; DAT-01; DAT-09; DAT-17; DAT-20; PRV-17~v; PRV-29; PRV-34; LEG-12; LEG-13~v; CMP-05; SEC-06~v; SEC-08; LOC-13; LOC-15; REL-48; REL-49~v; AIS-05; AIS-32; RSH-09; LCY-21; PRT-01; PRT-02; PRT-04; PRT-05; PRT-07; PRT-08; PRT-10; PRT-11; PRT-12; PRT-14; PRT-16; PRT-37; PRT-39; PRT-42; PRT-43; OPP-16 |
| NS-08 Recording backup: get ready, do not turn it on (08-keeping-and-trust.md) | SUP-05; SUP-07~v; SUP-21; MKT-06; MKT-29; OPS-01; OPS-03; OPS-12; OPS-15; OPS-16; OPS-18~t; OPS-20; OPS-23; OPS-24~t; FIN-01; FIN-02~t; FIN-03; FIN-04; FIN-05; DAT-14; PRV-06~v; PRV-08; PRV-09~v; PRV-30~t~v; LEG-09; LEG-16; CMP-03~v; CMP-05; CMP-12~t; SEC-36; REL-04; REL-07; REL-09; REL-10~v; REL-11~v; REL-12~v; REL-18; REL-37; REL-59; REL-61; RSH-10; LCY-13; LCY-14; PRT-39~t~v |
| NS-09 Let it go always finishes (08-keeping-and-trust.md) | SUP-04~t; SUP-08; MKT-01~t; OPS-01; OPS-18~t~v; OPS-39~t; DAT-09~t~v; DAT-17; LEG-17; BKO-30; REL-12; REL-13; REL-17; REL-42; REL-47; AIS-04; AIS-56; QAL-15; OPP-11 |
| NS-10 A new phone: close the last gap (08-keeping-and-trust.md) | SUP-02~v; SUP-04~t; SUP-07; SUP-13; SUP-21; MKT-01~t; OPS-07~v; OPS-14~v; OPS-21; FIN-03; FIN-11; FIN-19; DAT-08; DAT-14; PRV-14~v; PRV-20; LEG-04; LEG-09; CMP-17; CMP-18; SEC-05; BKO-07; MSG-07; LOC-14; REL-01; REL-07; REL-08; REL-15; REL-39; REL-42; REL-43; REL-47; REL-48; REL-53; REL-59; REL-60; REL-61; REL-70; AIS-06; QAL-05~t; LCY-04; LCY-09; LCY-10; LCY-11; LCY-12; LCY-13; LCY-14; LCY-26; LCY-37 |
| NS-11 Save a copy of the year (08-keeping-and-trust.md) | SUP-04~t; SUP-07; SUP-20~v; MKT-01~t; OPS-18~t; DAT-13; DAT-25; DAT-27; PRV-14~v; PRV-42; SEC-03; SEC-06~v; SEC-08; SEC-35; LOC-13; REL-54~v; REL-55~v; REL-56; REL-61; AIS-05; RSH-23; LCY-12; LCY-20; LCY-21; LCY-22; LCY-25; LCY-36; CUL-10 |
| NS-12 Earlier versions of my own words (08-keeping-and-trust.md) | SUP-04~t; SUP-07~t~v; OPS-05; OPS-06; OPS-07; OPS-24~t; FIN-02~t; FIN-04; PRV-21; LEG-08; LEG-17; SEC-20; REL-45; REL-47; AIS-01; AIS-04; AIS-06; PRT-16 |
| NS-13 Reminders that help and then step back (09-capture.md) | SUP-04~t~v; MKT-01~t; MKT-20; OPS-01~v; OPS-18~t; OPS-26; FIN-09; DAT-32; SEC-03; MSG-16; MSG-18; MSG-19; MSG-20; MSG-21; REL-56; RSH-05; RSH-08; RSH-23; QAL-13; DAY-03~v; DAY-08; DAY-09; NTC-02; NTC-03; NTC-04; NTC-06; NTC-11; NTC-12; NTC-14; NTC-19; NTC-20; NTC-23; NTC-24; NTC-27; NTC-30; CUL-05; CUL-07; CUL-12; CUL-19; CUL-32; PHS-31; PHS-32 |
| NS-14 Whose book this letter goes to (09-capture.md) | SUP-04~t~v; OPS-18~t; DAT-08; DAT-09~t; CMP-03~t; REL-54~v; REL-55~v; REL-56~v |
| NS-15 A letter for another day (09-capture.md) | SUP-04~v; LOC-11; LOC-12; REL-54; REL-55~v; REL-56~v |
| NS-16 Someone else speaks (09-capture.md) | POL-08; OPS-04; OPS-05; OPS-06; OPS-07; OPS-17; DAT-27; PRV-14~v; PRV-22; PRV-30~t; LEG-08; LEG-15; LEG-18~t; CMP-12~t; CMP-14; SEC-18; REL-13~v; REL-23; REL-46~v; AIS-07; AIS-26; AIS-27; AIS-34; AIS-45; RSH-19; OPP-07 |
| NS-17 A second spoken language, when it passes its gate (09-capture.md) | SUP-04~v; MKT-11; MKT-26; MKT-28; OPS-24~t~v; OPS-25~v; FIN-02~t; FIN-08; FIN-20; DAT-23; DAT-27; PRV-19; LEG-13; CMP-02; LOC-01; LOC-02; LOC-03; LOC-04; LOC-05; LOC-06; LOC-07; LOC-08; LOC-09; LOC-10; LOC-17; LOC-18~c; LOC-19; LOC-21; LOC-22; LOC-26; LOC-27; LOC-28; LOC-29; REL-08; REL-50; AIS-04; AIS-07; AIS-09; AIS-10; AIS-11; AIS-16; AIS-20; AIS-22; AIS-23; AIS-24; AIS-28; AIS-33; AIS-34; AIS-43; AIS-53; RSH-12; RSH-16; PRT-10; NTC-21 |
| NS-18 Typed days in reminders (09-capture.md) | SUP-04~t~v; MKT-20; OPS-17; DAT-27; PRV-14~v; LEG-08; SEC-18; MSG-18; REL-23; REL-54~v; REL-55~v; REL-56~v; AIS-07; RSH-05; DAY-01; DAY-03; DAY-04; DAY-15; DAY-16; NTC-08; CUL-02; CUL-15~t; CUL-25 |
| NS-19 Add more to this letter (09-capture.md) | SUP-04~v; REL-54~v; REL-55~v; REL-56~v; AIS-01; AIS-07 |
| NS-20 A letter to two books (09-capture.md) | SUP-04~t~v; REL-54~v; REL-55~v; REL-56~v |
| NS-21 The letter page reads as one place (10-reading-and-family.md) | SUP-04~t; SUP-07; OPS-18~t; OPS-22~v; PRV-16; CMP-08; REL-45; REL-54~v; REL-55~v; REL-56~v; AIS-08; AIS-53; AIS-55 |
| NS-22 The Book header stays calm (10-reading-and-family.md) | OPS-18~t; OPS-22~v; MSG-31; REL-54; REL-55~v; REL-56~v; REL-57 |
| NS-23 One past letter on Home (10-reading-and-family.md) | SUP-04~t~v; SUP-16; OPS-18~t; OPS-22~v; OPS-26; DAT-09~t; PRV-14~v; SEC-22; LOC-16; LOC-18; REL-54; REL-55~v; REL-56; RSH-21; CUL-13; OPP-04; OPP-15 |
| NS-24 Read the year back (10-reading-and-family.md) | SUP-04~v; MKT-01~t; MKT-03; OPS-18~t; OPS-22~v; DAT-25; LOC-11; REL-54~v; REL-55~v; REL-56~v; REL-57; AIS-41; RSH-23; PRT-05~v; OPP-16 |
| NS-25 The other parent, in the store app (10-reading-and-family.md) | SUP-04; SUP-07~v; POL-03; POL-04; POL-05; POL-09; MKT-01~t; MKT-05; MKT-17; MKT-26; OPS-01; OPS-04; OPS-05; OPS-06; OPS-10; OPS-18~t; OPS-21; FIN-02~t; FIN-19; PRV-13; PRV-30~t~v; PRV-32; LEG-03; LEG-09; LEG-10; LEG-18~t; CMP-01~t; CMP-03~t~v; CMP-07~t; CMP-12~t; CMP-13; CMP-19; SEC-01; SEC-09; SEC-10; SEC-23; SEC-20; RSK-04; SEC-27; BKO-12; BKO-14; BKO-15; MSG-14; MSG-23; MSG-24; MSG-27; MSG-28; MSG-29; MSG-30; MSG-36; REL-13~v; REL-46~v; AIS-08; RSH-06; RSH-19; LCY-30; LCY-32; LCY-40; PRT-26~v; PRT-37; CUL-25 |
| NS-26 Hear when the other parent writes (10-reading-and-family.md) | POL-03~v; FIN-02~t; PRV-30~t; CMP-05; SEC-17; BKO-12; MSG-16; MSG-17 |
| NS-27 Who can read each letter (10-reading-and-family.md) | POL-03; BKO-12 |
| NS-28 A family link or circle (10-reading-and-family.md) | POL-03; MKT-17; FIN-02~t; CMP-05; SEC-17; BKO-12; PRT-39~t~v |
| NS-29 Words that light up as they are read (10-reading-and-family.md) | POL-03~v; AIS-41 |
| NS-30 A book you can hold (10-reading-and-family.md) | POL-03~v; FIN-24; LEG-12; RSH-09; PRT-01; PRT-06; PRT-23~c; PRT-39; PRT-34; PRT-48; PRT-49; PRT-51; PRT-52~t; PRT-53; PRT-55 |
| NS-31 A library of moments (10-reading-and-family.md) | POL-03; DAY-25 |
| NS-32 One notification budget (11-foundations.md) | SUP-04~t~v; MKT-01~t; MKT-20; FIN-09; DAT-09~t; PRV-46; SEC-21; MSG-16; MSG-17; MSG-18; MSG-19; MSG-20; MSG-21; MSG-22; MSG-41; REL-56; RSH-05; RSH-08; QAL-13; DAY-03; DAY-07; DAY-09; DAY-26; DAY-31; NTC-01; NTC-02; NTC-04; NTC-06; NTC-07; NTC-08; NTC-09; NTC-10; NTC-11; NTC-16; NTC-19; NTC-20; NTC-22; NTC-23; NTC-26; NTC-28; CUL-11; CUL-12; CUL-14; PHS-30; PHS-31; PHS-32; PHS-61; OPP-03 |
| NS-33 Everyone can use it (11-foundations.md) | SUP-22; SUP-30; MKT-18; OPS-30~t~v; DAT-08; DAT-24; DAT-27; CMP-06; CMP-07; CMP-08~v; CMP-10; MSG-12; MSG-33; MSG-37; LOC-16; REL-31; REL-40~v; REL-41~v; RSH-12; QAL-07; QAL-09; QAL-10; QAL-23; LCY-15; CUL-26 |
| NS-34 It feels quick on the smallest phone (11-foundations.md) | OPS-27; OPS-28; OPS-30~t~v; OPS-31; FIN-19; DAT-15; DAT-16; REL-01; REL-27; REL-29; REL-31; REL-32; REL-33; REL-34; REL-35; REL-36; REL-37; REL-38; REL-39~t; REL-40; REL-48; REL-49; REL-50; REL-65; REL-72; AIS-35; AIS-36; AIS-37; AIS-42; AIS-44; AIS-51; QAL-07; QAL-12; LCY-15 |
| NS-35 Only Home starts a letter, and a test proves it (11-foundations.md) | SUP-08; MKT-21; OPS-30~v; DAT-17; CMP-03; MSG-39; LOC-20; REL-01; REL-32; REL-33; REL-40; REL-41; REL-48; CUL-05; PHS-01; PHS-02; PHS-22; OPP-01; OPP-05 |
| NS-36 New kinds of data follow the letter (11-foundations.md) | SUP-08; SUP-15; SUP-25; SUP-28; MKT-01~t; OPS-07; OPS-24~v; DAT-09~t; DAT-13; DAT-17; PRV-06; PRV-07~v; PRV-34; LEG-08; SEC-06; BKO-02; MSG-34; MSG-35; REL-13; REL-17; REL-45; REL-46; REL-47~v; QAL-21; LCY-20; LCY-22; LCY-23; LCY-29; CUL-01; CUL-16; CUL-33 |
| NS-37 The Book stays fast as it grows (11-foundations.md) | OPS-30~v; DAT-15; PRV-34; REL-34; REL-37; REL-39; REL-48~v; REL-49; REL-59; REL-65; REL-66; REL-72; QAL-21; CUL-06 |
| NS-38 The App Store page and install (19-from-download-to-first-letter.md) | SUP-02~v; SUP-17~v; SUP-18; MKT-05~v; MKT-06~v; MKT-08; MKT-09~v; MKT-11~v; MKT-15~v; MKT-21; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36~v; FIN-10; PRV-30~v; LEG-04; CMP-06~v; CMP-09; CMP-11~v; CMP-19~v; SEC-26~v; MSG-26; MSG-32; MSG-33; LOC-22; LOC-23; LOC-37; REL-02; REL-03~v; REL-55~v; REL-59~v; AIS-21; AIS-48; RSH-04; RSH-26; QAL-01; QAL-05; QAL-20; LCY-05; LCY-06 |
| NS-39 First launch and the first interaction (19-from-download-to-first-letter.md) | SUP-02~v; SUP-17~v; SUP-18; MKT-21; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36~v; DAT-33; PRV-24; PRV-37; CMP-09; CMP-27; SEC-07~v; SEC-25; MSG-09; MSG-19; MSG-24; MSG-26; MSG-30; LOC-24; REL-02; REL-03~v; REL-55~v; REL-59~v; AIS-12; AIS-13; AIS-14; AIS-16; AIS-25; AIS-29; AIS-44; RSH-04; QAL-01; QAL-05; QAL-06; QAL-15; LCY-02; LCY-05; CUL-18 |
| NS-40 Age and region checks (19-from-download-to-first-letter.md) | SUP-02~v; SUP-17~v; SUP-18; MKT-21; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36; DAT-33~t; DAT-35; PRV-24; PRV-25~t~v; PRV-26; CMP-09; CMP-15; MSG-24; MSG-30; LOC-24; REL-02; REL-03~v; REL-55~v; REL-58; REL-59~v; RSH-04; RSH-13; QAL-01; QAL-05; QAL-06; QAL-13; QAL-15; QAL-23; LCY-05 |
| NS-41 Sign up and sign in (19-from-download-to-first-letter.md) | SUP-02~v; SUP-17~v; SUP-18; MKT-09~v; MKT-21; MKT-22~v; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36~v; DAT-33~t; DAT-35; PRV-05; PRV-14~v; PRV-24; PRV-27~v; PRV-35; LEG-04; CMP-09; CMP-13~v; SEC-01; SEC-02~v; SEC-05; SEC-11; SEC-24; BKO-07; MSG-01; MSG-02; MSG-03; MSG-04; MSG-05; MSG-06; MSG-07; MSG-08; MSG-09; MSG-10; MSG-11; MSG-15; MSG-23; MSG-25; MSG-36; MSG-38; REL-02; REL-03; REL-55~v; REL-59~v; RSH-04; QAL-01; QAL-04~t; QAL-05; QAL-06; QAL-15; QAL-22; LCY-05 |
| NS-42 Agreements and notices at collection (19-from-download-to-first-letter.md) | SUP-02~v; SUP-17~v; SUP-18; MKT-09~v; MKT-21; MKT-22~v; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36~v; DAT-33~t~v; DAT-34~v; PRV-02; PRV-04; PRV-32~v; LEG-09; LEG-20; CMP-07~v; CMP-09; MSG-32; REL-02; REL-03~v; REL-55~v; REL-59~v; RSH-04; QAL-01; QAL-05; QAL-06; QAL-15; QAL-21; LCY-05 |
| NS-43 Setting up the first book (19-from-download-to-first-letter.md) | SUP-02~v; SUP-17~v; SUP-18; MKT-09~v; MKT-21; MKT-22~v; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36~v; DAT-33~t~v; DAT-34~v; PRV-24; PRV-28~v; LEG-02~v; CMP-09; CMP-17~v; SEC-25; LOC-11; LOC-12; REL-02; REL-03~v; REL-54; REL-55~v; REL-56~t; REL-59~v; RSH-04; QAL-01; QAL-05; QAL-06; QAL-15; LCY-05 |
| NS-44 The first letter and the allowance (19-from-download-to-first-letter.md) | SUP-02~v; SUP-17~v; SUP-18; MKT-09~v; MKT-21; MKT-22~v; MKT-33; OPS-10; OPS-11~v; OPS-25~v; OPS-33~v; OPS-36~v; DAT-33~t~v; DAT-34~v; PRV-10~v; PRV-16~v; PRV-24~v; LEG-02~v; CMP-09; CMP-17~v; REL-02; REL-03~v; REL-55~v; REL-59; RSH-04; QAL-01; QAL-05; LCY-05; LCY-13~t~c; LCY-30 |
| NS-45 Account life after first run (19-from-download-to-first-letter.md) | SUP-02~v; SUP-17~v; SUP-18; MKT-09; MKT-21; MKT-22~v; MKT-33; OPS-10; OPS-11~v; OPS-25; OPS-33~v; OPS-36~v; DAT-33~v; DAT-34~t~v; PRV-14~v; PRV-15~v; PRV-18~v; LEG-02~v; CMP-09; CMP-17~v; SEC-06; SEC-07~v; SEC-12; SEC-36; BKO-01; BKO-02; BKO-04; BKO-07; BKO-26; BKO-27; MSG-46; REL-02; REL-03~v; REL-55~v; REL-59~v; QAL-01; QAL-05; QAL-15; QAL-21; LCY-03; LCY-09; LCY-11; LCY-17; LCY-18; LCY-19; LCY-26; LCY-27~c; LCY-41; CUL-17 |
| NS-46 Days we mark (21-days-cultural-photos-home.md) | MKT-38; CMP-01~c; MSG-42~t; LOC-32~t; AIS-58; RSH-24~c; QAL-09~c; DAY-01; DAY-02; DAY-03~c; DAY-04; DAY-05; DAY-06; DAY-07~c; DAY-08; DAY-09; DAY-10; DAY-11; DAY-12; DAY-13; DAY-14; DAY-15; DAY-16; DAY-17; DAY-18; DAY-19; DAY-20; DAY-21~c; DAY-22; DAY-23; DAY-24; DAY-25; DAY-30; NTC-08; NTC-09; CUL-04~c; CUL-24; PHS-60~t |
| NS-47 Cultural background: the optional ask, what is kept, and the lock-screen rules (21-days-cultural-photos-home.md) | PRV-07~c; PRV-24~c; PRV-34~c; SEC-22~c; LOC-32~t; RSH-21~c; LCY-31~c; NTC-09; CUL-01; CUL-02; CUL-03; CUL-04; CUL-05; CUL-06; CUL-07; CUL-08; CUL-09; CUL-10; CUL-11; CUL-12; CUL-13; CUL-14~c; CUL-15; CUL-16; CUL-17; CUL-18; CUL-19; CUL-20; CUL-21; CUL-22; CUL-23; CUL-24~c; CUL-25~c; CUL-26~c; CUL-27 |
| NS-48 Notification catalogue and rotation (21-days-cultural-photos-home.md) | PRV-46; MSG-41; LOC-10~c; LOC-11~c; LOC-12~c; LOC-32~t; REL-32~c; RSH-08~c; QAL-27; NTC-01; NTC-02~c; NTC-03~c; NTC-04~c; NTC-05; NTC-06~c; NTC-07; NTC-08~c; NTC-09~c; NTC-10~c; NTC-11~c; NTC-12~c; NTC-13; NTC-14~c; NTC-15~c; NTC-16~c; NTC-17; NTC-18; NTC-19~c; NTC-20~c; NTC-21~c; NTC-29; PHS-04 |
| NS-49 Picture-first start and Journaling Suggestions (21-days-cultural-photos-home.md) | PRV-34~c; CMP-23~t; SEC-31; MSG-39; MSG-43; LOC-32~t; LOC-37~t; REL-63; AIS-54~c; AIS-57; AIS-59; RSH-03~c; QAL-26; QAL-28~t; LCY-31~c; LCY-39; NTC-29; NTC-30; PHS-01~c; PHS-02~c; PHS-03~c; PHS-04~c; PHS-10~c; PHS-11~c; PHS-12~c; PHS-13~c; PHS-14~c; PHS-15~c; PHS-16~c; PHS-17~c; PHS-18~c; PHS-19~c; PHS-20~c; PHS-21~c; PHS-22~c; PHS-23~c; PHS-24~c; PHS-25~c; PHS-30~c; PHS-31~c; PHS-32~c; PHS-33~c; PHS-34~c; PHS-40~c; PHS-41~c; PHS-42~c; PHS-43~c; PHS-44~c; PHS-50~c; PHS-51~c; PHS-52~c; PHS-53~c; PHS-54~t~c; PHS-55~c; PHS-56~c; PHS-57~c; PHS-64; PHS-70; OPP-02~c; OPP-03~t |
| NS-50 Home today (21-days-cultural-photos-home.md) | MKT-23~c; MKT-24~c; MSG-42; LOC-32~t; DAY-26; DAY-27; PHS-02 |

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
- messaging, NS-13: whole = C; whole = NR
- messaging, NS-18: whole = C; whole = NR
- messaging, NS-32: whole = C; whole = NR

### 2d. FRs that name the frame or every card and no single card

40 FRs: SUP-01, MKT-01, MKT-04, MKT-10, MKT-15, MKT-16, MKT-24, MKT-31, MKT-34, OPS-11, OPS-18, OPS-22, OPS-33, FIN-02, FIN-14, FIN-15, FIN-17, FIN-21, DAT-02, DAT-03, DAT-04, DAT-05, DAT-06, DAT-07, DAT-18, DAT-19, DAT-21, DAT-22, LEG-18, LEG-23, CMP-01, CMP-12, CMP-20, SEC-19, MSG-13, AIS-17, AIS-38, RSH-01, RSH-18, RSH-25.

## 3. Needs a ruling: proposed card changes, deduplicated, and conflicts between functions

Karma rules each in `GAP-LOG.md` like a design gap (ruling kinds CARD, DEFAULT, FOUNDER, ENG, NONE). Counts: 237 proposed card changes in the 23 files (support 16, marketing 12, operations 13, finance 10, data 15, privacy 23, legal 15, compliance 10, security and risk 8, back-office 6, messaging 9, languages 8, reliability 10, ai-and-speech 11, research 9, quality 12, lifecycle 9, print 8, days 9, notifications 0, cultural-data 10, photos 8, opportunities 6); after merging overlapping ones there are 152 rulings to make (R-001 to R-152), of which 39 merge two or more proposals. 14 of the 152 are already ruled in `GAP-LOG.md` and marked `ruled (id)`; 3 are partly ruled (some of the merged proposals are).

Cards NS-43 to NS-45 are on disk now, so proposals marked "(when written)" in the first-wave files should be applied to the written rows, not to a future card. Proposals for NS-46 to NS-50 (days, cultural background, catalogue, picture-first and suggestions, the Home slip) target cards that are proposed and not on disk; they are ruled together with the card outlines in the days, cultural-data, notification-catalogue, photos and opportunities files.

### 3a. Conflicts between functions (both positions shown; ruled ones carry the GAP-LOG text)

21 conflicts: K1 to K10 were in the earlier version of this file and are ruled in `GAP-LOG.md` ("Function conflict rulings K1 to K10"); K11 to K17 are new overlaps from the second and third wave functions (K11 and K12 are partly ruled by GAP-LOG rulings on the data side, K13 to K17 are open); K18 to K21 are overlaps between the third wave files that GAP-LOG already rules (CB-2, CB-5, DL-5, N-1, N-3, N-5, N-2, DL-10).

**K1. Class of the child's name, birthday, due date, letter languages and first letter (privacy: L4; compliance input: L3 or L2) [RULED K1]**

- privacy: PRV C21 (R-126) on NS-43 (when written) and the compliance input section 3: Classes: the child's name or nickname, birthday, due date and letter languages are L4, not L3 or L2; the signature stays L3. This is a `privacy` classification ruling (my charter) Why: `DATA_CLASSIFICATION.md` rules 6 and 7 and section 4.5 (`children.name`, `birthday`, `due_date`, `language.spoken` are L4)
- privacy: PRV C22 (R-127) on NS-44 (when written) and the compliance input section 3 row 18: The first letter's words and recording are L4 content, not "L3, sensitive" Why: `DATA_CLASSIFICATION.md` level table: letter text and audio are L4
- privacy: FR-PRV-24 (privacy, P0 (b)): Given first run in a store build (E-S01 to E-S08), Then it collects only: the age answer as a boolean on the phone; the local agreement record (phone, uploaded unchanged at first sign-in, deleted by Erase everything); the Apple account identifier and the email Apple shares, or the email the parent types, verified by Apple or by the emailed link or code; a name only if Apple shares one; PRIV-R21 rows; the child's name (optional); a birthday or due date (required); what the child calls the parent. Never a phone number, password, the parent's birth date, age or age range, the child's surname or gender, a location or contacts. A field-inventory test over E-S02 to E-S08 fails on a new input [cut; see source]
- compliance input (the compliance function file indexes it and does not restate the classes): `inputs/first-run-compliance.md` row 13, "Child name or nickname": class L3.
- compliance input: `inputs/first-run-compliance.md` row 14, "Birthday or due date": class L3; a due date shows a pregnancy (health-adjacent, K-25, Q32).
- compliance input: `inputs/first-run-compliance.md` row 16, "Letter languages": class L2.
- compliance input: `inputs/first-run-compliance.md` row 18, "First letter (words, recording)": class L3, sensitive (Privacy 9).
- Ruled K1 (GAP-LOG): child name, birthday, due date, letter languages, first letter are L4 (DATA_CLASSIFICATION.md). The compliance input rows 13, 14, 16, 18 are corrected.
- Merged rulings: R-126, R-127

**K2. The Home Plus line wording (design change versus the marketing and Terms 8.2 rule) [RULED K2]**

- design, `docs/design/e2e/E-foundations-and-system-states/WORDS.md` line 342 (read earlier): Built line: "Adding new letters to the book needs Plus. Recording, reading and export are always free." CHANGE proposed by design: "Adding new letters to the book needs Plus. Recording, reading and export stay free."
- finance: Endorses the design change from "always free" to "stay free" (finance section 4, E-S26; BL-965 carries `plusLine` "stay free"; finance question Q40 default "stay free", never "always free").
- marketing: FR-MKT-04 (marketing, P1 (a)): Given a public line about what stays free (reading, playing recordings, export), Then it uses the Terms 8.2 permanent list in substance, speaks of letters a family kept, and says nothing about the future of any other capability (ruling T2). Lines to check: `pages.en.ts:80` "/about What it costs"; `apps/web/src/lib/support/copy.ts` "Reading, listening and your copy stay free" ("listening" must mean playing a kept letter's recording, not Read together); `site.ts` s10 `promise` says "made" where D-082 says "kept"
- marketing: FR-MKT-22 (marketing, P0 (b)): Given the Keep gate (E-S10) and the Home Plus line (E-S26), Then neither shows a testimonial, rating, review count, "most popular", discount, countdown, comparison or price; the Plus line is one static string (no rotation, no A/B copy); offer codes are redeemed only through Apple's Redeem a code; no rating prompt is requested in a session in which the gate sheet was shown
- design, WORDS line 264 (the pinned membership line): "Your first two letters are free. After that, Plus keeps the book growing. Reading, listening and your copy stay free."
- Ruled K2 (GAP-LOG): one Plus line string reusing the pinned "Reading, listening and your copy stay free"; the design WORDS "Recording, reading and export stay free" is withdrawn (not on the Terms 8.2 list).

**K3. First-time downloads before the allowance rule may fire (500 or 1,000) [RULED K3]**

- data (the only function file that takes a position): DAT FQ-02: "Minimum first-time downloads before the allowance rule fires: 500 (D-125) or 1,000 (F14 6.9)?" Default: 500, the later ruling, with the 95% interval printed beside the point. At 500 the interval around 4% runs 2.3% to 5.7%, so a read near the line is close to a coin toss; the founder sees that before acting Owner: founder
- data: DAT C-11 (R-135) on F14 6.9 vs D-125 item 3: One minimum: F14 says "at least 1,000 first-time downloads"; D-125 says 500. Default: 500 (the later ruling) with the interval reported (FQ-02) Why: Two numbers on record
- Ruled K3 (GAP-LOG): pricing allowance rule fires at 500 first-time downloads with the 95% interval shown (D-125); F14 6.9's 1,000 is superseded.
- Merged rulings: R-135

**K4. What the deletion texts say (legal versus the card row versus privacy) [RULED K4]**

- card, NS-01-R31 (read in `01-photo-with-a-letter.md`): Given photos on in any build, the account-deletion text (`packages/content/src/pages.en.ts:240`) no longer says pictures are removed from places the server cannot reach, and says pictures on a phone go when that phone is erased. P0 (b); one content test.
- legal: LEG C-3 (R-023) on NS-01-R31: Extend from `pages.en.ts:240` to Privacy 7 and `delete-account-page.md`, and add the build-truth clause (no status report or analytics lines while off) Why: The legal texts make the same promise as the in-app page (FR-LEG-02)
- legal: FR-LEG-02 (legal, P0 (b)): Given any build, When the deletion texts are read (in-app delete sheet C-S20, `pages.en.ts:236-244`, `delete-account-page.md`, Privacy 7), Then each says: (a) with photos on, pictures and the Find index live only on the phone, account deletion cannot reach them, and Erase everything or deleting the app removes them; (b) with seals on, letters hidden until a day are deleted with the account (D6); (c) only systems the build uses are named: no "status of your Plus plan that the app reported to us" while the status report is off, and no analytics provider while analytics is off. A content test fails on (c) for the build's flags.
- privacy: FR-PRV-18 (privacy, P0 (b)): Given C-S20 "What happens", Then it states, in plain lines or a link to Privacy section 10: the 30-day change of mind; the 31, 38 and 45-day clock; the sent-email copy kept to about day 60; the kept-author book entry (child's name, birth date, due date) while a former member's letters remain (D-116); that pictures and recordings stay on each phone until that phone is erased (NS-01-R31); that saved copies and iPhone backups are the parent's own and are not reached; that letters hidden until a day are deleted and never open (D6); that consent records are kept 3 years without the person's id; and that Plus billing continues through Apple until cancelled
- support: FR-SUP-14 (support, P0 (b)): Given a deletion request, Then the help centre and M3 point first to Me, Delete account (C-S20; Guideline 5.1.1(v)) and to the web page `brand.web.deleteAccount`, say the 30 days to change your mind (Terms 10.1), and say that the Apple plan is cancelled separately. By email, Route 1 stays closed until BL-551 and the reply promises no date
- operations: OPS Q7: "Can a restore on Free be promised not to bring back deleted items?" Default: No promise; the privacy text must not say deletions survive a disaster restore on Free (`free-tier-ops.md`) Owner: counsel Q51 (retention and deletion exceptions); counsel must confirm
- privacy: PRV PQ-10: "Is the restore-window limit (up to 24 hours of deletions can return after losing the project on the Free plan) something the policy must say?" Default: Say it in the incident notice, not in the policy; prove the replay (FR-PRV-09) so the window shrinks to zero where the ledger survives Owner: Counsel Q51 FOUNDER-ANSWERED 20 Nov, default accepted (CL-081, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- Ruled K4 (GAP-LOG): deletion texts: legal's scope (four texts and a build-truth rule), privacy's retained-list on C-S20, support's Me-first entry; one key family in `packages/content`. The Free-plan restore line is ruled by counsel Q-note; default: say it plainly in Privacy 7.
- Merged rulings: R-023, R-128

**K5. The Texas and California age signal: store nothing (compliance) versus record an enum (privacy) [RULED K5]**

- compliance: FR-CMP-15 (compliance, P0 (b)): Given an install where the platform offers the age-range signal, When the app launches, Then it requests the signal before the 18+ question, treats a minor signal as the gate's No (stop, nothing reachable, nothing stored beyond the existing `ageGate.stoppedAt`), stores and sends no age range anywhere, and treats no signal (older iOS, declined, error) as today's gate. Until the module ships, every store candidate's gate record carries the founder's dated risk acceptance for Texas (compliance input G1). Installs from before 1 Jan 2027 follow counsel's answer to Q46.
- compliance: CMP C-2: "Installs made before 1 Jan 2027: must the app ask the platform for an age signal for existing users, and by when? May a signal be kept with the Terms acceptance as evidence?" Default: Request at every launch on iOS 26+ from 1 Jan 2027; keep nothing Owner: counsel Q46
- compliance: CMP C-3: "Texas SB 2420: which developer duties apply to an 18+ app with an 18+ rating while the stay holds?" Default: Honour the store's age category signal as in FR-CMP-15; rating 18+ Owner: counsel Q46 (with CR-004)
- privacy: FR-PRV-25 (privacy, P0 (b)): Given the age step, Then only `ageGate.passed` (after Yes) or `ageGate.stoppedAt` (after No) is kept, on the phone; a store age signal, when one is read, is used in memory only and is never stored or sent (NS-40-R2, R6, R7; the card wins, CR-66, E50); never a date, age or range on the phone or server
- support: SUP Q-SUP-13: "Keep "I answered by mistake" on the age stop in store builds?" Default: Keep it (LEGAL-REQ-002 neutrality). Support never acts on an age answer it cannot see Owner: counsel, Q46 (area E CG14) FOUNDER-ANSWERED 20 Nov, default accepted (CL-100, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- Ruled K5 (GAP-LOG): store nothing on the Texas age signal until counsel Q46 answers (FR-CMP-15 over FR-PRV-25).

**K6. Is the age-rating questionnaire re-answered for NS-05 Level 1 (compliance: yes; marketing: no change) [RULED K6]**

- compliance: FR-CMP-19 (compliance, P0 (b)): Given NS-05 or NS-25 is on in a candidate, Then the App Store Connect age-rating questionnaire is answered again (User-Generated Content, Messaging, Social Media) and the answers saved in the gate record; the 18+ override and "Made for Kids: No" stay.
- compliance: CMP K-5 (R-033) on NS-05 section 17 and NS-25 section 17: Add the age-rating re-answer as a gate (FR-CMP-19) Why: ASC says "letters are never distributed"
- marketing: FR-MKT-17 (marketing, P1 (b)): Given a release that ships NS-25 (two parents in one book), NS-05 Level 2 or 3, or NS-28, Then the age rating questionnaire (User-Generated Content, Messaging and Chat) is re-answered and recorded in `docs/store/app-store-connect-1.0.md` before submission; NS-01, NS-02, NS-05 Level 1 and NS-06 are proposed as no change, because nothing is distributed inside the app (Share leaves through the parent's own share sheet)
- marketing: MKT MQ-8: "Age rating at NS-25: does two parents reading one book change User-Generated Content or Messaging answers?" Default: No change for NS-01 to NS-06; re-answer at NS-25 with counsel's view Owner: Counsel: needs a number from legal
- support: SUP Q-SUP-7: "Is the two-parent book "user-generated content" under Guideline 1.2?" Default: Treat it as not, while it stays capped at two parents who invite each other. Treat anything hosted for a third person as 1.2 Owner: counsel and the founder (needs a number from legal) FOUNDER-ANSWERED 20 Nov, default accepted (CL-100, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- Ruled K6 (GAP-LOG): re-read the age rating at NS-05 Level 1 (cheap check), full re-answer at NS-25 and NS-05 Levels 2 and 3.
- Merged rulings: R-033

**K7. Names of the store-build gates (G0 to G6 used for two different lists) [RULED K7]**

- operations: OPS C12 (R-015) on `14-test-plan.md` section 6: Rename the store-build gates (for example SG0 to SG6) or point to `RELEASE.md` 1.3: both files use G0 to G5 for different things today Why: Two "G4"s in one release checklist will be misread
- compliance: CMP K-3 (R-015) on `14-test-plan.md` section 6: Add the evidence column of section 3c and the gate record path; add to G5: Notes for Review versus flags, age-rating answers, accessibility labels Why: Gates are defined, their proof is not
- compliance: FR-CMP-11 (compliance, P0 (b)): Given a store candidate, Then one gate record `docs/legal/evidence/store/<version>-<build>/gates.md` exists with the evidence of section 3c for G0 to G6, each line naming the file, commit or console screenshot that proves it, and the founder's dated sign-off; a candidate with a missing line is not submitted.
- Ruled K7 (GAP-LOG): gate names: G0 to G6 stay the release gates (ops list); compliance evidence gates are renamed CG0 to CG6.
- Merged rulings: R-015

**K8. Thresholds for moving to paid vendor tiers (finance versus operations) [RULED K8]**

- finance: FIN F1: "When does production move to Supabase Pro ($25 a month, $300 a year)?" Default: Stay on Free (D-159) (recommendation: At 60% of any Free limit on the weekly check, or before any backup flip. Keep the spend cap on) Owner: founder
- operations: OPS Q1: "When a Free quota passes 80%, move to Pro for that month?" Default: Yes, same week, because after the first grace period Supabase gives no second one (billing FAQ, 20 Nov). Pro's price was not read this session: read it on the day Owner: founder
- finance: FIN F7: "Resend Pro" Default: Stay on Free (recommendation: Upgrade before a public launch day if 100 a day could be reached) Owner: founder
- operations: OPS Q2: "Resend at public launch" Default: Stay on Free until expected email sign-ins pass 50 a day (half the 100-a-day cap), then a paid tier; paid prices not read this session Owner: founder
- finance: FIN F6: "EAS Starter" Default: Stay on Free (D-092) (recommendation: Batch native changes; upgrade only for a month that needs it) Owner: founder
- operations: OPS Q3: "EAS Starter in a heavy month" Default: Yes for any month past 12 planned builds (D-092 already allows it) Owner: founder
- Ruled K8 (GAP-LOG): paid-tier triggers: ask the founder at 60% of a limit, move at 80%.
- Merged rulings: R-005

**K9. Screen ids proposed by functions that collide with the e2e design [RULED K9]**

- support (section 4): Proposes new screens E-S27 and E-S28 for "If you are struggling" and "Lines in other countries" (support says no e2e area gave them ids).
- design, E `DESIGN.md` section 5: E-S27 is "App Store page and install" and E-S28 is "Permission asks map" in the design read earlier (highest E screen id is E-S29), so both ids are taken.
- privacy: Proposes C-S23 for "Privacy in Me" and C-S23.withdraw. Highest C screen id in the design is C-S22, so C-S23 is free.
- operations: Proposes E-ST47 for "Server restored". Highest E state id in the design is E-ST46, so it is free.
- Ruled K9 (GAP-LOG): support's E-S27 and E-S28 are taken; use C-S23 and E-ST47.

**K10. Country count at sign-up: weekly aggregate (data) versus daily count kept 2 years (privacy) [RULED K10]**

- data: FR-DAT-35 (data, P0 (b)): Server-side counts named by cards (NS-40 refusals by country code, NS-41 sign-in success per method) are read only as weekly aggregates through a named runbook that writes an audit row; no person row, email, address or user id leaves the query. Each count is published as 0 or at least 10, with the complement rule, and a country with fewer than 10 refusals joins "other". The NS-40 count never carries, or is derived from, an age answer (TRACKING_PLAN: "An under-18 answer is never sent"). Each count gets a level, a retention clock and a deletion path in `DATA_CLASSIFICATION.md` in the same PR that builds it
- privacy: FR-PRV-26 (privacy, P0 (b)): Given the D-131 country check at account creation, When it runs, Then the IP address is used in memory and dropped; only a daily count by check, outcome and jurisdiction code (refusals only) is kept for 2 years (D-136); the refusal shows one line and asks nothing; the label stays unchanged unless counsel answers Q57(f) otherwise. And the IP addresses and emails Supabase Auth keeps in its own audit log have their retention read for the production plan and written in data-policy 4.2, so no sentence says "we do not keep your IP address" without naming that vendor log
- data: DAT FQ-09: "Founder and counsel: may the NS-40 refusal counts by country and the NS-41 sign-in counts be computed in the 1.0 line?" Default: Needs a number from legal for the country count. Default: yes for NS-41 as an aggregate under a runbook (it serves a reliability target); NS-40 only with the FR-DAT-35 limits and a privacy read first Owner: counsel
- privacy: PRV PQ-7: "Is a country derived in memory at sign-up and never kept "collected" for the label?" Default: Not collected; label unchanged (CPrivO-2) Owner: Counsel Q57(f) FOUNDER-ANSWERED 20 Nov, default accepted (CL-081, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- Ruled K10 (GAP-LOG): country counts: privacy's storage rule is the source (daily count, 2 years); data's weekly k=10 view reads from it.
- Merged rulings: R-120

**K11. Reminders and the notification catalogue versus reliability (what re-plans a schedule, and what a wrong clock does to the recency axis) [PARTLY RULED: N-6; the open part is the recommendation below]**

- notifications: FR-NTC-02 (notifications, P0 (a)): Given the catalogue is on or off, When a plan is built from the same inputs, Then the set of (id, date, time, class) is identical, so the catalogue never raises volume
- notifications: FR-NTC-03 (notifications, P0 (a)): Given a plan for any future date, Then every input is computable at plan time: recency is `fireDate - anchorDate` and never a clock read at delivery
- GAP-LOG N-6: "the axis is days between the fire date and the newest made letter, not hours (every input must be known at plan time, iOS schedules up to 35 days ahead). Depends on NS-13's anchor and back-off, not yet built." (rules the axis, not what triggers a re-plan)
- reliability: FR-REL-59 (reliability, P0 (a)): Device restore and phone-to-phone transfer, as one matrix kept next to NS-10: what returns (the database and recordings in the iPhone backup, D-033; Keychain items depending on the backup type, UNVERIFIED), what does not (speech models, packs, listening copies, list and page picture copies, caches: NS-37-R4; stored picture copies DO return with the iPhone backup, NS-01-R27. Superseded in part by FR-REL-70 on 20 Nov), and what must be rebuilt (Find index, planned notifications, the Plus decision). Required results: letters appear once (NS-10-R6); the free allowance counts the same (NS-44-R5 "Keychain ledger plus mirror plus letters"); notifications are re-planned at the first launch after a [cut; see source]
- reliability: FR-REL-56 (reliability, P1): Time zones and the date line. Given the parent keeps a letter at UTC+14 or UTC-12, near midnight, or flies across the date line with auto time zone on or off, Then the letter's day is the phone's local date, the server accepts it (the server range is "to tomorrow", NS-43 line 1230), the age on that day never shifts (`dates.ts` uses noon UTC so "no time zone can shift the date"), and the birthday-week slip uses the local date. Spring-forward and fall-back nights (repeated 01:30): two letters keep distinct, ordered. Run by setting the date, time and zone by hand
- reliability: FR-REL-54 (reliability, P1): A wrong device clock never corrupts the book. Given the phone's date is set a year back, a year forward, before the child's birth, or to 2001, When a letter is kept, Then it keeps, its day is shown and can be changed with the "another day" control (NS-15), month chapters and age math use the letter's day, ordering inside a day is stable (by day, then time, then id, so an id built from a wrong clock moves only its own letter), and nothing else reorders. How Keep handles a date before birth (`isBeforeBirth` exists in `dates.ts`) is UNVERIFIED
- messaging: FR-MSG-21 (messaging, P1): Given quiet hours, Then local reminders are clamped to 07:00 to 21:30, no email other than sign-in mail and a notice whose legal window would close is sent in 21:30 to 07:00 in the person's time zone, and a time zone change re-plans the schedule
- Ruled N-6 (GAP-LOG): the axis is days between the fire date and the newest made letter, not hours (every input must be known at plan time, iOS schedules up to 35 days ahead). Depends on NS-13's anchor and back-off, not yet built.
- Recommendation (not a ruling): The catalogue does not say what re-plans it; reliability and messaging do (restore, time zone change), and a wrong clock or a changed letter day moves the anchor the recency axis reads. Recommend one rule in NS-13 and NS-32 (Karma rules): the plan is rebuilt on first launch after a restore, on a time zone change and on a clock change; the anchor is the newest made letter's stored local day (the day the parent can change with "another day"), never a delivery-time clock read, clamped so it is never after the plan date; and a rebuild on the same inputs gives the same set of (id, date, time, class), which is FR-NTC-02 applied to a rebuild. Add that as a test row to NS-48. N-6 stands.

**K12. Languages versus the days library (calendar pin and English-only names versus lunar and lunisolar days and a "which calendar" question) [PARTLY RULED: DL-3, DL-4; the open part is the recommendation below]**

- languages: FR-LOC-11 (languages, P1 (c) *): Given a device whose locale or calendar setting is not Gregorian (for example an English phone set to a Buddhist or Islamic calendar), When any date shows (dateline, birthday, Months, year labels), Then it shows the Gregorian date in Western digits: `dates.ts` pins `calendar: 'gregory'` and the Latin numbering system, with a test over locale tags such as `en-u-ca-buddhist` and `en-u-ca-islamic`. The date a parent entered is stored as ISO Gregorian (YYYY-MM-DD) and never converted
- languages: FR-LOC-12 (languages, P1): Given age math, Then the age of {child} is counted in Gregorian calendar months and weeks (`ageOn`) in every language and every calendar; no card converts a birthday to a lunar, Hijri, Hebrew or Hindu date. A family that keeps another calendar is told, in a help article, that the book counts in the calendar the phone uses for ordinary dates, and that the letter's own words may carry any date they like
- languages: FR-LOC-13 (languages, P0 (a) *): Given a book whose letters are in a language other than English, When it is read, exported or printed, Then the frame (dateline, age sentence, "exactly as heard" labels, signature words, cover and index) is in English at 1.0 and the letters' words are untouched, in their own script and direction. The help article and the listing say "the app is in English" in plain words. Making the frame follow the spoken language is a later, separately reviewed row
- languages: FR-LOC-02 (languages, P0 (a)): Given the first store build, Then it hears English only, and no parent-facing line promises another language, "later" or "soon" (X CS-1 default). A later release adds one language at a time, in the release whose listing names it
- days: FR-DAY-06 (days, P0 (a)): Moving days: each lunar or lunisolar row carries an `authority` and a `country` or tradition, and `precision: about`; the picker and landing say "around"; where authorities differ the picker asks one calm question ("Which calendar does your family follow?"); the parent can move the date for one year or for always, and that date is the parent's own.
- days: FR-DAY-19 (days, P2): Language and reading. The names are in English at version 1 (VOICE.md says the app is in English); no translation is promised; VoiceOver reads "around" with the date; days with names from other languages keep the family's spelling ("Eid al-Fitr", "Diwali", "Hanukkah"), not a respelling. The languages review owns the translation rule per language.
- GAP-LOG DL-3, DL-4, DL-9: DL-3: one row per authority and the parent picks or moves the date. DL-4: rule-based dates computed on the phone, astronomical days stored as a UTC instant. DL-9: Lunar New Year, Mid-Autumn and Norooz offered as culture-led days. (Rules the data and the computation; does not touch the display pin.)
- Ruled DL-3 (GAP-LOG): authorities disagree on the same festival (Eid al-Fitr 2026: 20 or 21 Mar; Diwali 2027: 28 or 29 Oct; Buddha's birthday 2026 has four dates), so the data carries one row per authority and the parent picks or moves the date. Years no authority has published are not shipped; the picker says so calmly. No date is written from memory.
- Ruled DL-4 (GAP-LOG): rule-based dates are computed on the phone, not copied from third-party tables; astronomical days are stored as a UTC instant and shown in local time, with Southern Hemisphere season names. Source licences: counsel must confirm before any table ships (FR-DAY-23).
- Recommendation (not a ruling): Compatible if scoped: FR-LOC-11 and FR-LOC-12 govern what the parent sees and the age arithmetic (Gregorian, Western digits, no card converts a birthday to another calendar). The days module may use non-Gregorian arithmetic inside to find a date, but every date it shows is Gregorian in Western digits, and the question "Which calendar does your family follow?" (FR-DAY-06) is about which authority, so its words should say "which list" and not promise a calendar conversion. FR-LOC-11's test over `en-u-ca-*` locale tags must be scoped to display so it does not forbid the days module. English names (FR-DAY-19) are consistent with English-only at 1.0 (FR-LOC-02, FR-LOC-13); a day name in a script the build does not hear is the family's own words when they type it. Karma rules; DL-3, DL-4 stand.

**K13. Photos versus privacy (the suggestion title and date, the new transient copy and the erase scan, and the label line) [OPEN]**

- photos: FR-PHS-14 (photos, P0 (a)): Given a picked suggestion has a `title` or a `date` range, Then they show only as a label above the picture that the parent can edit or clear, marked in the design as from the phone's suggestion, stored only if the parent keeps the letter, held in the existing editable fields (`photo_text` and the letter date), never prefilled into the letter's words, never used for a prompt, a nudge or Find ranking. Whether a date chip uses `date` is OQ-1 (parent-confirmed only)
- photos: FR-PHS-50 (photos, P0 (a)): Given the data inventory, Then it adds three transient rows and no persistent one for level 2: (1) the suggestion file copy in `Caches` (L4, deleted once read, swept at launch, deleted by Erase everything, never logged, never synced, not in export); (2) the in-memory `title` and `date` (L3 if it names a place or event; memory only until the parent keeps them as `photo_text` or letter date, which are already L4 and L2); (3) the in-memory suggestion id on the notification path (L3, FR-PHS-33). `privacy` confirms classes in the same PR
- photos: FR-PHS-33 (photos, P0 (a)): Given the Apple notification tap lands in the app, Then the universal link handler never logs the suggestion id, never stores it, and drops it after the picker returns; the id counts as L3 for log purposes (it identifies a moment in a person's life)
- photos: FR-PHS-54 (photos, P0 (b)): Given the privacy label, Then the label effect is stated for level 2 as "no change while only the suggestion the parent picks reaches the app, the app uses only its picture, and nothing leaves the phone" (RV-12, NS-49-R16), re-read if the Journaling Suggestions entitlement changes the label questions in App Store Connect; counsel must confirm
- privacy: FR-PRV-34 (privacy, P0 (a)): Given Erase everything on a phone that held pictures, Find, typed days, shares and printable files, When it finishes, Then a scan of `scribe.db` settings and tables, `Application Support/photos`, `tmp/share`, the printable PDF temp, `Caches/ImagePicker` and `Caches/ScribePhoto` finds nothing of the book; the same scan runs after a letter's purge for that letter's files
- privacy: FR-PRV-30 (privacy, P0 (b)): Given each store candidate, Then `privacy` re-runs label section 3.2 against the binary and records the evidence per version; the answers follow the build's flags: Photos or Videos No while NS-01-R15, R26 and R61 hold; Audio Data and Device ID Yes from the NS-08 flip build; NS-16's typed name per Q54(f); co-parent per NS-25; push tokens per Q54(d) if NS-26 is ever built; Sensitive Info Yes for the due date
- privacy: FR-PRV-06 (privacy, P0 (b)): Given a PR that turns on a new-data flag (`EXPO_PUBLIC_PHOTOS`, `EXPO_PUBLIC_BOOK_SEARCH`, Firsts, seals, `EXPO_PUBLIC_SIGN_AS_OTHER`, typed days, backup) in any profile outside the founder's family, Then `data-policy.md` section 4 is at Build 12 facts and holds every row of that card's section 11 with the same class, store, sync, retention, deletion path, export and log rule as `DATA_CLASSIFICATION.md`; otherwise gate G5 fails
- Recommendation (not a ruling): Two gaps and one tension. (1) FR-PHS-50 classes the in-memory title and date "L3 if it names a place or event" while the privacy registry gives each field one class (FR-PRV-07; the privacy lead rules a class, as K1 did); until privacy rules, treat both as L4 because a title can name a place and becomes the parent's photo words if kept. (2) FR-PHS-12 puts the Apple-provided copy in `Caches` and deletes it once read, but FR-PRV-34's Erase scan lists `Caches/ImagePicker` and `Caches/ScribePhoto` only: add the suggestion folder to the scan and to the log canary of FR-PRV-10 (FR-PHS-51). (3) FR-PHS-54 says the label effect is "no change" for level 2 and FR-PRV-30 answers "Photos or Videos No while NS-01-R15, R26 and R61 hold": both rest on "only the chosen picture reaches the app"; privacy re-runs the label per build and records it, and counsel reads FR-PHS-56. Karma rules; the founder is not needed.

**K14. Print versus finance and legal (who sells, tax, margin figures, Print Terms) [OPEN]**

- print: FR-PRT-21 (print, P2 (b) *): Given a US order, When sales tax is calculated and collected, Then the tool and the states are chosen by the accountant before the first order, the pilot is limited to states where that is settled, and the tax line is never a guess; as an individual seller (D-004) the founder carries personal liability for sales-tax duties; counsel and the accountant must confirm nexus, rates, registration, who collects (seller or partner), and whether an entity should be the seller
- print: FR-PRT-22 (print, P2): Given any money path, When it is proposed to build, Then the founder has answered in writing: who sells (the individual, or an entity), whose Stripe account (or other processor), who owns refunds and support, who pays tax, and the margin floor (35% [A], BK-14) is met at the partner's real quote
- print: FR-PRT-23 (print, P2): Given the processor's fees (2.9% plus $0.30 and $15 a dispute, S6) and the partner's unknown wholesale cost, When the price is set, Then the founder sees section 3.4 re-done with a real partner quote and the real card fee before he approves a price
- print: FR-PRT-46 (print, P2 (b) *): Given the order flow, When the flag is first turned on, Then these exist and are merged by the founder: Print Terms (not drafted today; Terms 15 is "not offered yet" per BK-14), the Terms 5.6 wording on print shops (FR-LEG-13, L-10), Privacy Policy changes (FR-PRT-31), subprocessor entries for the partner and the processor (Q11), a refund and delivery policy in plain words, and a counsel read of SB 478, the FTC rule, state tax and any children's-product rule (CPSIA is UNVERIFIED and listed in Q-PRT-8)
- print: FR-PRT-19 (print, P2 (b) *): Given the order flow, When payment is taken, Then it is by card or Apple Pay on a hosted page opened outside the app (or a payment sheet that uses Apple Pay), never in-app purchase, no StoreKit product exists for a book, and the app never sees a card number; the App Review notes say the app sells a physical good paid outside in-app purchase under 3.1.3(e) and give a reviewer a path that shows the flow without placing a real order
- finance: FR-FIN-24 (finance, P2): Given a printed book (NS-30) or any sale outside Apple, When it is proposed, Then a money path exists before any build: who sells, who takes card payments and their fees, refunds and support, sales tax, and whether an entity sells; it is a separate purchase outside Plus
- finance: FIN F13: "Engage an accountant before the first payout (CR-120)" Default: Not engaged (CR-120 stays Gap) (recommendation: Yes, with the brief below) Owner: founder (engages accountant)
- legal: FR-LEG-12 (legal, P0 (b) *): Given the printable PDF (NS-07 C28), When the PDF builder embeds a font, Then the face is on an allowlist whose every entry has its licence file in the repo and a licence that permits embedding in documents (today: Literata, Mukta, Tiro Devanagari Hindi under OFL 1.1 in `packages/design-tokens/fonts/`; for Arabic and Chinese, Amiri and Noto Serif SC, whose OFL notices sit in `apps/web/src/scenes/parts/act3/fonts/` and would move to the shared fonts folder). A test fails on a face with no licence file beside it. Me, Licences lists every face the app or the PDF embeds.
- Recommendation (not a ruling): Three differences. (a) Timing: print wants the accountant settled before the first order (FR-PRT-21), finance before the first payout (F13, CR-120); take the earlier (before the first order) and tell finance. (b) Numbers: print's margin floor (35% [A]) and card fee (2.9% plus $0.30) are its own arithmetic and say "check against finance.md"; finance's run-cost register has no print row. Finance owns the register: when a partner quote exists it adds the print rows and the margin check; print does not publish a price before then (FR-PRT-23). (c) Terms: print says Print Terms and Terms 5.6 on print shops are needed before the flag (FR-PRT-46) while the free file ships in 1.0; legal's FR-LEG-12 covers the font allowlist only. Recommend legal drafts a one-line Terms note for the free file now and the Print Terms only when FR-PRT-34 is true. Nothing here ships in 1.0 (FR-PRT-01). Karma rules; the seller question (Q-PRT-2) is the founder's.

**K15. Lifecycle versus back-office on deletion, claim and hand acts [OPEN]**

- lifecycle: FR-LCY-11 (lifecycle, P0 (a)): Given an account was deleted (on this phone or another) and this phone still holds the book, When the person signs in to a new account (a new user id, even with the same email), Then the claim screen is offered again and, after the masked-email tap, the letters on this phone are claimed by the new account; they are never stranded behind `sync_account_mismatch`. Nothing uploads before that tap
- lifecycle: FR-LCY-19 (lifecycle, P0 (a,b)): Given phone A deletes the account while phone B is signed in with a synced book and unsent letters, When B next talks to the server and gets `deleted`, Then B signs out once with one plain line in Me, its whole book stays readable, playable and exportable, its unsent letters are kept (never discarded), nothing uploads, and the person is offered the claim path of FR-LCY-11 on a later sign-in. During the 30-day window the account is not deleted: B keeps syncing; Cancel deletion on any phone returns everything (NS-45-R9, R10)
- lifecycle: FR-LCY-27 (lifecycle, P1): Given a person writes that the parent has died or cannot act, When support reads it, Then the first reply is human and kind, makes no promise about access, says what we can and cannot see (recordings are not on our servers while backup is off; no one at the company reads letters), and follows a runbook that counsel has read before the first store release has outside families: who may receive one export of a sole parent's book, on what documents, and never an account takeover (counsel Q49 default is "no clause; runbook before C1"). Claude roles are not lawyers; counsel must confirm RUFADAA and any other law, none of which I read. Apple's Legacy Contact page lists "device backups" among data [cut; see source]
- lifecycle: LCY LQ-9: "Death or inability to act: a clause, or a runbook only? Who may receive one export of a sole parent's book, on what documents, and what do we say to the family on day one?" Default: No clause; a counsel-read runbook before outside families sign in; one export, never an account takeover, only after documents counsel names Owner: counsel Q49, support Q-SUP-10 FOUNDER-ANSWERED 20 Nov, default accepted (CL-079, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- back-office: FR-BKO-07 (back-office, P0 (a)): One recovery card, one decision table. Given the recovery runbook BL-598 asks for (PR #620 is not on this branch), Then `docs/ops/runbooks/account-recovery.md` decides each case once. (1) "I lost my email": nothing changes by hand; point to Apple's own account recovery if the person signed in with Apple, or to the mail provider's recovery if the sign-in is a code to an email; the sign-in email is never edited (`double_confirm_changes`, runbook section 0). (2) "My new phone shows no book": the person used a different sign-in way last time; macro M9; no hand merge of two accounts in 1.0, because a merge moves one account's letters into another on a stranger's word (default; Q-BKO-1). (3) [cut; see source]
- back-office: FR-BKO-26 (back-office, P1): A suspended or limited account looks like itself, not like a loss. Given BL-552 suspends sign-in and sync for one account while keeping all data, When that person opens the app, Then the book stays readable on the phone, sync waits, and one neutral line is shown (not "banned", not a reason); the person can still Save a copy and Delete account; Terms 10.2's "export for at least 30 days" is met by that route. No state implies the data is gone
- back-office: FR-BKO-27 (back-office, P1): A hand act is visible to the person it affects. Given any back-office change to one person's account (a suspension, a deletion opened for them, an access limit, a hand consent act), When it is done, Then a content-free email goes to the address on the account naming only the kind of act and the date, except where counsel rules a safety case must not (Q-BKO-4), and an audit row exists. This adopts input G5 and G6 (email on deletion request, new-sign-in email) already proposed under FR-SEC-12, and adds the by-hand acts to the same list
- back-office: BKO Q-BKO-1: "May support ever merge two accounts, or move letters from one account to another, for a parent who signed in two different ways?" Default: No, never by hand in 1.0. The parent signs in the original way. It would move one account's letters on a stranger's word. Reopen when there is an in-app way to link identities, proved by both sign-ins FOUNDER-ANSWERED 20 Nov, default accepted (CL-066, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: two offline key copies, abuse@ alias, counsel second reader Owner: Founder, with `security-architect`
- Recommendation (not a ruling): Three points. (1) A parent who cannot act: lifecycle plans a runbook for who may receive one export of a sole parent's book (FR-LCY-27, LQ-9), back-office's rule is that nothing is changed or moved by hand and support never reads letters (FR-BKO-07, FR-BKO-02). These agree only if the export is made by the account holder's own phone or by a counsel-read process that hands over the Save a copy file the person already holds; recommend FR-LCY-27 says so and that no staff tool exports a book. (2) States: a deleted-elsewhere phone (FR-LCY-19, one line in Me) and a suspended account (FR-BKO-26, one neutral line) must not share words; ask `content` and area E for two lines and two states. (3) Claim after deletion (FR-LCY-11: the new account claims the phone's letters after the masked-email tap) is parent-driven and does not conflict with "no hand merge" (Q-BKO-1), provided the claim is never done by staff; say so in FR-LCY-11. A back-office deletion opened for someone (FR-BKO-27) sends the content-free email; the 30-day window in FR-LCY-19 applies to both. Counsel must confirm the death runbook; Karma rules the rest.

**K16. Quality's 552 P0 rows versus the test plan register (and the P0 rows the later files add) [OPEN]**

- quality, section 3d: Register in 14 section 7 (cards 01 to 12) 296; card 19 96; errata row 1; function review rows 143; QAL rows 16; "Total P0 rows named by the pack 296 + 96 + 1 + 143 + 16 = 552". "Not 552 distinct tests."
- quality, FR-QAL-01 and FR-QAL-02: 14 section 7 regenerated with three tables plus the errata row, and `scripts/trace.mjs` reading `docs/product/prd` including `functions/*.md`.
- test plan, `14-test-plan.md` section 7: "Rebuilt 20 Nov 2026 ... 296 P0 rows" for cards 01 to 12 only (this script counted 296 ids in the register).
- this script, recount: Card 19 P0 rows: 98 of 125 (quality: 96 of 123, matches). P0 FR rows now: 515 across the 23 files (first-wave files 200, QAL 21, the other thirteen later files 294). Quality counted 143 from the nine first-wave files and 16 for itself, so its 552 omits the later files' 294 P0 FR rows.
- Recommendation (not a ruling): Quality's arithmetic reconciles with the register and card 19 and is right for the pack as it stood when quality wrote it; it is now stale. The new total of P0 ids the pack names is 296 + 98 + 1 + 515 (every P0 FR row in the 23 files, QAL included) = 910, and it is a list of ids, not of tests (quality says so). Recommend `qa` regenerates 14 section 7 with all 23 function files (FR-QAL-01 already asks for the extended script), prints the total, and does not publish 552. Quality's 143 for the nine first-wave files is exact (this script counts 200 rows whose priority cell starts "P0"). 29 rows (first-wave and later) have a priority cell that mentions P0 without starting with it (SUP-02, SUP-13, POL-08, OPS-12, OPS-30, LEG-05, LEG-16, BKO-02, BKO-12, BKO-20, MSG-42, LOC-09, LOC-11, REL-09, REL-18, AIS-24, AIS-28, RSH-04, RSH-08, RSH-33, PRT-07, PRT-10, PRT-18, PRT-19, PRT-21, PRT-28, PRT-31, PRT-46, PRT-47); the script does not count them as P0, and their owners should settle one priority before the register is regenerated.

**K17. Two proposals for the same row id NS-17-R11 [OPEN]**

- languages: LOC CC-LOC-7 (R-076) on NS-17 new row: NS-17-R11 (P0 (a)): no claim that a letter in another language is noticed for distress until FR-LOC-18 (a) holds Why: English-only patterns
- ai-and-speech: AIS C03 (R-076) on New row NS-17-R11: Given a letter in a language that passed its gate on the full tier but not on the compact tier, then a compact-tier phone does not offer it Why: FR-AIS-43; F05 gate is per tier
- Recommendation (not a ruling): The two rows are different (LOC-7: no claim that a letter in another language is noticed for distress until FR-LOC-18(a) holds; AIS C03: a compact-tier phone does not offer a language that passed only on the full tier). Both are P0 (a). Keep both, number them NS-17-R11 and NS-17-R12 in the order Karma rules them, and update the FR links (FR-LOC-18, FR-AIS rows) after the cards are edited.
- Merged rulings: R-076

**K18. Days library versus cultural data: is a chosen day a typedDay or a separate source (and does NS-18 change) [RULED CB-2, N-2]**

- days: FR-DAY-03 (days, P0 (c)): A ticked day is a `typedDay`. Given the NS-32 registry, When the library ships, Then the registry has no new class (ruling N-2) and the planner emits a `typedDay` item with the key `days.<id>`, using NS-32's priority, budget and lock-screen rules.
- days: DAY C1 (R-079) on NS-18 section 3, "Not in scope": Remove "Recurring days" and "Days the app suggests" for library days only; keep "Syncing typed days" Why: A library day recurs and the app offers the list
- days: DAY C2 (R-100) on NS-32 section 3, classes: State that `typedDay` carries both a parent's typed day and a library day (no new class), per ruling N-2 Why: One budget, one registry
- cultural-data: CUL C01 (R-079) on NS-18 section 3 "Not in scope" and the direction 3.1 sentence "A chosen day becomes a typed day": Either (a) keep typed days one-off and per phone, and have NS-47 own a separate yearly store that feeds the same planner slot, or (b) change NS-18 to allow suggested and recurring days. I recommend (a). The direction's sentence should read "a chosen day uses the typed day's planner slot and lock-screen rules" Why: NS-18 forbids recurring and suggested days; its deletion rule (the day after delivery) would delete a yearly day
- cultural-data: CUL C02 (R-100) on NS-32 section 3 classes; direction Q-FD-6: If `occasion` is reopened, name the class `libraryDay`, give it the top priority the direction asks for, one neutral body for every layer, and inherit R12 and R13 Why: FR-CUL-12
- cultural-data: CUL CUL-Q12: "The yearly store versus NS-18's "no recurring days": rule (a) separate store, or (b) change NS-18 (section 5)?" Default: (a) Owner: Karma none
- card 21 (NS-46 to NS-50), "Conflicts and open items" item 8: **NS-32-R5 says "no `occasion` class".** Still true (N-2). `libraryDay` is a ranked source of the `typedDay` group (NS-46-R29); NS-32-R3 and R5 gain that ranking. A registry row would be a new class and contradict N-2.
- Ruled CB-2 (GAP-LOG): a chosen day is NOT a typed day. NS-18 says "Not in scope: recurring days, days the app suggests, syncing typed days" and deletes a typed day after delivery. This amends 20-founder-direction section 3.1: the library uses a separate yearly store that feeds the same planner slot and the same one-a-day budget (`libraryDay` source, not a new class; N-2 stands).
- Ruled N-2 (GAP-LOG): `occasion` returns only as a source of typed days, never as a new class (Q-FD-6 first half ruled yes). No class is added to the NS-32 registry.
- Merged rulings: R-079, R-100

**K19. Days library versus cultural data: one names switch or a separate switch for a day's name on the lock screen [RULED CB-5, N-3, DL-10]**

- days: FR-DAY-09 (days, P0 (a)): Lock screen. Given "Names in notifications" off, When a seasonal or civic day fires, Then the title may be the day's name; When a family, tradition, culture-led or national day fires, Then the title is the neutral "A day you wanted to remember" and the body is neutral; Given the switch on, Then the name shows, never with App lock on; Given the tradition field, Then it is never in a title, body, log, analytics event or crash report. A snapshot test enumerates every key.
- days: DAY C5 (R-065) on NS-13 and NS-32 lock-screen rows: Reference the one "Names in notifications" switch as covering day names (N-3, N-7) Why: Section 5.1
- cultural-data: CUL C03 (R-065) on NS-13 settings table and `prefs.ts`: Add the separate day-name switch beside `notifications.lockScreenNames`; document that app lock forces both off Why: FR-CUL-12
- cultural-data: CUL CUL-Q9: "Separate switch for the day's name in a note, default off, forced off by App lock?" Default: Yes. The direction says the faith is named "only when the parent has switched on names in notifications"; a separate switch avoids exposing a faith just because the child's name was switched on Owner: Founder none
- notifications: FR-NTC-09 (notifications, P0 (b)): Given a family or faith day, or names off, Then the lock-screen title is neutral ("Something for the book today") and the day shows when unlocked; a faith or family day's name appears in a title only with names on
- notifications: NTC Q-NTC-2: "Which days may name themselves in a lock-screen title: public only, or family days too (Mother's Day on a lock screen reveals little but may hurt in some homes)" Default: Public only; family and faith need names on CLOSED 20 Nov, see GAP-LOG Closures CL-040 Owner: not stated (read as founder)
- card 21 (NS-46 to NS-50), "Conflicts and open items" item 1: **One names switch or two (CB-5 and DL-10 against N-7 and DAY 5.1).** Compatible: N-7 is about the child's name, CB-5 about a day's name. Resolution (RV-13): the day-name switch lives on the Days page (C-S24) so Reminders keeps one names switch; a typed day's words follow the same switch (RV-8, NS-47-R37, needs an NS-18-R3 errata row). Karma confirms.
- card 21 (NS-46 to NS-50), "Conflicts and open items" item 2: **A public day's name in a title (N-3) against "the day's name shows only behind its own switch" (CB-5).** Resolution (RV-1): `publicTitleOk` is a hand-listed allowlist and with App lock on every title is neutral (NS-46-R36); default pending founder: Q-FD-18.
- card 21 (NS-46 to NS-50), "Conflicts and open items" item 3: **The same neutral words, three drafts.** Kept as three strings for three jobs (typed-day title; library-day neutral title; hidden-preview placeholder) plus one neutral body per tone (NS-46-R37); the DAY 5.1 and 5.4 samples are superseded. `content` decides the words.
- Ruled CB-5 (GAP-LOG): lock screen: every library-day note shares one neutral body; the day's name shows only behind its own switch, default off and forced off while App lock is on, separate from `notifications.lockScreenNames`.
- Ruled N-3 (GAP-LOG): only public days (seasons, civic) may name themselves in a lock-screen title; family and faith days need "names in notifications" on.
- Ruled DL-10 (GAP-LOG): a tradition day's name on the lock screen only with its own names switch on (CB-5); privacy and counsel decide beyond that.
- Merged rulings: R-065

**K20. Variants per day, per season and per grid cell (notification catalogue versus days library) [RULED N-1, DL-5]**

- notifications: NTC Q-NTC-1: "Variants per grid cell: the founder's 8 to 12, or 6" Default: 6; revisit after the first tester sheet CLOSED 20 Nov, see GAP-LOG Closures CL-040 Owner: not stated (read as founder)
- days: DAY Q-DAY-7: "Variants per day: 4 and 3 (direction 4.3) against 8 to 12 (N-1)" Default: 4 per day and 3 per season; 8 to 12 only for the evening grid Owner: Karma CLOSED 20 Nov, see GAP-LOG Closures CL-085
- days: DAY C8 (R-137) on GAP-LOG N-1: Reconcile the 8 to 12 variants per layer with 4 per day and 3 per season for a once-a-year day (4.6) Why: Q-DAY-7
- Ruled N-1 (GAP-LOG): 6 variants per grid cell (one plan holds at most 11 evening nudges, each cell is visited about once); the founder's 8 to 12 applies to the day, season and last-letter layers. Launch floor about 128 variants, filled later in content drops.
- Ruled DL-5 (GAP-LOG): 4 variants per day and 3 per season (a day recurs once a year).
- Merged rulings: R-137

**K21. Exclamation marks in notifications: VOICE.md line 70 versus line 160 and the checker [RULED N-5]**

- notifications: VOICE.md:70 says "At most one exclamation mark per month across all notifications." VOICE.md:160 says exclamation marks are budgeted per surface, three in all, "none in notifications". The checker enforces none (notification-catalogue 12.1).
- notifications: NTC Q-NTC-7: "Exclamation marks in notifications" Default: Zero; correct `VOICE.md:70` CLOSED 20 Nov, see GAP-LOG Closures CL-040 Owner: not stated (read as founder)
- Ruled N-5 (GAP-LOG): zero exclamation marks. VOICE.md line 70 is corrected to match line 160 and the checker.

### 3b. Proposed card changes, merged (one ruling each)

Ordered frame first, then the test plan and README, then cards by number. "Handles" are `<function code> <id in that file>`; `Overlap` says whether merged proposals add to each other (complementary) or differ and need one answer (differs). FRs cited by the proposals are listed so a ruling can be traced back to section 1. `Ruled` marks a proposal a GAP-LOG ruling already decides, with the ruling id.

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

**R-004** (days). Target: Frame (`00-product-frame.md` table row 33, C-15 "Typed days in reminders")

- Change: Add a row or note: C-xx "Days we mark" next to it, Attractive, B Capture
- Why: Rank and kind to be set by Karma
- Handle: DAY C9 (`functions/days-library.md`). FRs: none cited

**R-005** Frame section 8 run-cost table and vendor reads. Overlap: complementary. Proposed by 3 files: operations, finance, reliability

- FIN C01 on `00` section 8, run-cost table: Replace with section 3.1's lines and read dates (V1 to V5, V10); add the database line (words, held drafts, versions) as the first Free limit; replace "the limit is not stated here" for Resend with 3,000 a month and 100 a day; EAS Starter includes $45 of build credit Why: CFO ruling in `00` asks for read dates and units; the 500 MB database binds before storage
- OPS C13 on `00-product-frame.md` section 8: EAS row: re-read 20 Nov (15 iOS builds; Starter $19 plus usage; Free one macOS build at a time). Email row: Resend Free is 3,000 a month and 100 a day (read 20 Nov), shared by sign-in codes and deletion receipts Why: The frame asks for dated reads
- REL C08 on `00-product-frame.md` section 8: State "no uptime SLA on Free (read 20 Nov)" and "RTO if the project is lost = App Review time unless FR-REL-08" Why: FR-REL-01, 07
- FRs: REL-01, REL-07, REL-08
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

**R-009** Frame guardrails: no marketing in notifications, slips, first run or the Keep gate; a home for the Apple rating request. Overlap: complementary. Proposed by 1 files: marketing

- MKT C02 on Frame s3 or s4: Add a guardrail: no marketing in notifications, slips, first run or the Keep gate (FR-MKT-20 to 24) Why: No card owns these moments for marketing
- MKT C03 on Frame (new section) or a card in `19`: Give F13-REQ-020 (Apple rating request) a home with FR-MKT-23's rules and a P1 row Why: No card specifies the rating moment
- FRs: MKT-20, MKT-21, MKT-22, MKT-23, MKT-24

**R-010** (print). Target: README, section "Parked" or frame row 43

- Change: State that a printed book needs a server-side order system and a new data flow (words and pictures leave the phone on purpose), so the label effect is not "None" (NS-30 says "None for the file", which is right; for the book it is not)
- Why: NS-30 only mentions the hosted-audio label effect
- Handle: PRT PC-7 (`functions/print-and-fulfilment.md`). FRs: none cited

**R-011** Frame line 38 and the README studies table: the 5-question cap and the studies rows. Overlap: complementary. Proposed by 2 files: data, research

- RSH C-9 on Frame line 38: Say the 5-question cap applies to hand-sent rounds; the diary and moderated studies have their own scripts and consent (as data C-09 proposes) Why: Avoids reading the cap onto studies
- DAT C-09 on Frame section 3: "Each tester round asks at most 5 questions" applies to tester rounds; studies with their own consent (NS-03) set their own scripts Why: NS-03 Script B has 6 questions
- RSH C-1 on README lines 151 to 158 (studies table): Add rows for S2 first-run test, S3 diary week, S4 other-parent join, S6 reminder tolerance, S7 printed-book, S9 trust comprehension, with owner `user-research`, trigger as an event, default if nobody sets it Why: The table has none of them; first run has no study owner (F2)
- RSH C-2 on README lines 153 to 156 and 14-test-plan line 7: State that five-parent studies of a flagged feature run moderated on a founder-owned phone with the Asha install until G0 is met, and on a parent's own TestFlight build only after Why: Resolves F1
- FRs: none cited

**R-012** (security and risk). Target: `00-product-frame.md` sign-out paragraph (D1)

- Change: Add: "`[X4-R1]` keeps A's book from being seen, claimed or uploaded while another account is signed in. It does not make a signed-out book private; App lock and Erase everything do."
- Why: Prevents X4-R1 being read as a confidentiality claim (section 5)
- Handle: SEC CC-1 (`functions/risk-security.md`). FRs: none cited

**R-013** Frame section 3 measure: the support tally list. Overlap: differs. Proposed by 4 files: support, data, back-office, ai-and-speech

- SUP C13 on Frame section 3 (tally): Replace "lost, confused, billing, other" with the FR-SUP-08 list, versioned in `docs/support/` Why: The cards already add five categories the frame does not list
- DAT C-10 on Frame section 3 sources: Add the support tally list of FR-DAT-17 under the four categories Why: Card categories do not map today
- BKO C05 on `00-product-frame.md` section 3 (tally): Add the weekly card (FR-BKO-23) as the place the tally is read Why: One place, one rhythm
- AIS C09 on `00-product-frame.md` section 3 KPI table: Add one line: "Words the parent had to retype after saying them: x of n testers, by hand, numbers only" Why: The frame optimises habit but has no accuracy line; tester notes are the only evidence without analytics (D-124)
- FRs: SUP-08, DAT-17, BKO-23

**R-014** Frame section 7 and README: add standing inputs (what support can see; inventory home; content inputs; counsel reads that gate). Overlap: complementary. Proposed by 5 files: support, privacy, legal, ai-and-speech, cultural-data

- SUP C14 on Frame section 7: Add "What support can see" (FR-SUP-11) as a standing input, and route the Privacy 3 line "if you ask us for help" to counsel Why: The policy permits more than support will ever do
- SUP C15 on README "How to read a card" section 16: Content inputs name the help article line and any macro the card needs Why: Keeps articles in step with cards
- PRV C17 on Frame section 7 "Inventory home": Name the sign-up rows (FR-PRV-24) and the backup copies (FR-PRV-08) as rows the inventory owes before NS-38 locks Why: Frame lists card data only
- LEG C-13 on README "Reads that gate anything": Add: counsel Q48 and Q45 for NS-16; Q53 and Q48 for NS-25; the minors question for NS-06 B (already in the card); Q45 for the NS-05 picture toggle Why: One place lists every counsel gate
- AIS C10 on `00-product-frame.md` section 7: Add the standing position: a speech model change is gated on FR-AIS-15 Why: The constitution is stated; the model-change rule is not
- CUL C08 on Frame section 7 "Inventory home": Add this store as a row the inventory owes before NS-47 locks Why: Same as FR-PRV-24's request
- FRs: SUP-11, PRV-08, PRV-24, AIS-15

**R-015** [PARTLY RULED K7: OPS C12, CMP K-3] 14-test-plan section 6: store-build gate names and evidence. Overlap: differs. Proposed by 3 files: operations, compliance, quality

- OPS C12 on `14-test-plan.md` section 6: Rename the store-build gates (for example SG0 to SG6) or point to `RELEASE.md` 1.3: both files use G0 to G5 for different things today Why: Two "G4"s in one release checklist will be misread
- CMP K-3 on `14-test-plan.md` section 6: Add the evidence column of section 3c and the gate record path; add to G5: Notes for Review versus flags, age-rating answers, accessibility labels Why: Gates are defined, their proof is not
- QAL C05 on 14 s6: Add the evidence column of Annex H; add the non-waivable rows of FR-QAL-23 Why: `compliance.md` K-3 asks for the same column; avoid two versions
- FRs: QAL-23
- Ruled K7 (GAP-LOG): gate names: G0 to G6 stay the release gates (ops list); compliance evidence gates are renamed CG0 to CG6.
- Conflict: see K7 in 3a

**R-016** (quality). Target: 14 s2

- Change: Add two levels: Evidence (a dated record that must exist) and Process (an act no test proves), with the rule of FR-QAL-03
- Why: 54 of 143 FR rows are E, P or include E
- Handle: QAL C02 (`functions/quality.md`). FRs: QAL-03

**R-017** 14-test-plan sections 4 and 5: new journeys J-N28 to J-N36 and J-L1 to J-L7; device table and link matrix. Overlap: complementary. Proposed by 3 files: messaging, quality, lifecycle

- QAL C03 on 14 s4: Add J-N28 to J-N36 (FR-QAL-05) Why: card 19 has no journeys in the plan
- LCY C09 on `14-test-plan.md`: Add journeys J-L1 to J-L7 and an iPad smoke row that states the support line Why: FR-LCY-34, 15
- QAL C04 on 14 s5: Replace the device table with Annex B; add Reduce Transparency and Differentiate Without Colour to the settings list; add iOS 26 glass versus fallback Why: the list omits both settings; design depends on them
- MSG C09 on `14-test-plan.md` device table: Add the link matrix of FR-MSG-24 as device rows, and AASA and URL checks as release-gate rows Why: Device-only facts
- FRs: MSG-24, QAL-05, LCY-15, LCY-34

**R-018** (research). Target: 14-test-plan section 8 ("Tests owed today")

- Change: Add "Studies owed: S1, S2, S9 first"
- Why: The section lists device rows only
- Handle: RSH C-7 (`functions/research-validation.md`). FRs: none cited

**R-019** 14-test-plan section 7: P0 rows and cross-cutting ids. Overlap: complementary. Proposed by 3 files: finance, security, quality

- SEC CC-2 on `14-test-plan.md` section 7 cross-cutting ids: Split `[X4-R1]` into `[X4-R1a]` gate (FR-SEC-01), `[X4-R1b]` B's letters (FR-SEC-02), `[X4-R1c]` every surface (FR-SEC-03), `[X4-R1d]` release (FR-SEC-04) Why: One test hides which surface leaks
- FIN C10 on `14` section 7: Add a P0 row under J-N25: "a refunded or revoked Plus behaves as a lapse; kept letters unchanged" Why: FR-FIN-11 has no test today
- QAL C01 on 14 s7: Add tables 3a, 3b and 3c of this file; add the "How proven" key and an owner column; regenerate by the extended script Why: the register stops at card 12
- FRs: FIN-11, SEC-01, SEC-02, SEC-03, SEC-04

**R-020** (marketing). Target: BL-109

- Change: Rewrite coverage to the store-build scope (FR-MKT-26)
- Why: It still asks for co-parent pairs and Hindi and Spanish speakers
- Handle: MKT C11 (`functions/marketing.md`). FRs: MKT-26

**R-021** NS-01 gates: label file and rights record for store art. Overlap: complementary. Proposed by 2 files: marketing, compliance

- CMP K-4 on NS-01 section 17: Add: the label file's Photos note and checklist line change in the photo PR (FR-CMP-04) Why: The current checklist line fails the first photo build
- MKT C10 on NS-01 s19: Add: a rights record for every picture used in store art, kept in `docs/store/art/` Why: Licensed or illustrated images need provenance
- FRs: CMP-04

**R-022** (data). Target: NS-01 section 21

- Change: Add: testers read `manifest.json` from the copy (C-S04 shows no numbers); `counts.photos` from export 1.7.0 only. Mark `media_added` "proposed for the catalogue; not in it"
- Why: FR-DAT-13; `catalog.ts` v8 has no such event
- Handle: DAT C-03 (`functions/data-and-measurement.md`). FRs: DAT-13

**R-023** [RULED K4] (legal). Target: NS-01-R31

- Change: Extend from `pages.en.ts:240` to Privacy 7 and `delete-account-page.md`, and add the build-truth clause (no status report or analytics lines while off)
- Why: The legal texts make the same promise as the in-app page (FR-LEG-02)
- Handle: LEG C-3 (`functions/legal.md`). FRs: LEG-02
- Ruled K4 (GAP-LOG): deletion texts: legal's scope (four texts and a build-truth rule), privacy's retained-list on C-S20, support's Me-first entry; one key family in `packages/content`. The Free-plan restore line is ruled by counsel Q-note; default: say it plainly in Privacy 7.
- Conflict: see K4 in 3a

**R-024** NS-01 rows for the suggestions picker: the one-picture rule, the Shown line, no library access. Overlap: complementary. Proposed by 1 files: photos

- PHS C01 on NS-01 section 3: Add one line: "A picture can also come from the phone's recent-days list (NS-49); the same one picture, same pipeline." Why: Keeps one pipeline and one stored-copy rule
- PHS C02 on NS-01-R22: Extend the "only source" wording: the system picker or the Journaling Suggestions picker, both out of process, one still returned; no library access in either Why: R22 as written lists only the iOS system picker
- PHS C03 on NS-01 section 12: Add the suggestions picker to the Shown line and keep "Never: ... location" Why: Door lines must name every door
- FRs: none cited

**R-025** (privacy). Target: NS-01 section 10, NS-02 section 10, NS-36-R4

- Change: Record the `privacy` confirmation: `entry_media.entry_id`, `draft_id` and `letter_search_rows.entry_id` are L3
- Why: Asked of `privacy` in each card; errata E22
- Handle: PRV C03 (`functions/privacy.md`). FRs: none cited

**R-026** (data). Target: NS-02 and NS-05 section 21

- Change: Mark `book_search_used` and `letter_share_started` "proposed for the catalogue; not in it"
- Why: `catalog.ts` v8
- Handle: DAT C-06 (`functions/data-and-measurement.md`). FRs: none cited

**R-027** (operations). Target: NS-02 section 10

- Change: Add: "`killSwitches.bookSearch` is in the binary before `EXPO_PUBLIC_BOOK_SEARCH` turns on in production; one device row sets it on staging"
- Why: A config key the binary does not know does nothing (FR-OPS-02)
- Handle: OPS C01 (`functions/operations.md`). FRs: OPS-02

**R-028** (security and risk). Target: NS-02 acceptance

- Change: Add a P0 (a) row: no query string in any log (FR-SEC-18)
- Why: TB8
- Handle: SEC CC-6 (`functions/risk-security.md`). FRs: SEC-18

**R-029** (research). Target: NS-03 section 14 and frame lines 52 to 53

- Change: Add one retention table naming which clock applies to which kind of research data (FR-RSH-22)
- Why: 30 days against 90 days
- Handle: RSH C-6 (`functions/research-validation.md`). FRs: RSH-22

**R-030** (support). Target: NS-03 stop rules 1 and 2

- Change: "Any report" names who receives it (the founder) and says that distress goes to M6 first
- Why: The pilot is the first time real families report a harm to us
- Handle: SUP C07 (`functions/support.md`). FRs: none cited

**R-031** (ai-and-speech). Target: NS-04

- Change: Add a question Q16: does the trigger path (Siri, widget, Action Button) change recorded audio quality (a phone in a pocket, the microphone route) enough to change recognition? Answer form Yes, No, or Yes with a stated cost, measured by one fictional-script clip
- Why: The spike asks about processing paths, not about what the recogniser then hears
- Handle: AIS C06 (`functions/ai-and-speech.md`). FRs: none cited

**R-032** (marketing). Target: NS-05 s18

- Change: Add: no referral, reward or "tell a friend" prompt after a share; screenshot rule of FR-MKT-14
- Why: Keeps Share a trust act; A1 5.6.3
- Handle: MKT C04 (`functions/marketing.md`). FRs: MKT-14

**R-033** [RULED K6] Age-rating questionnaire re-answered as a gate (NS-05 and NS-25). Overlap: differs. Proposed by 2 files: marketing, compliance

- MKT C08 on NS-25 s22: Add the age rating re-answer (FR-MKT-17) and the website tab drawing (FR-MKT-05) to the gates Why: Metadata must match the build (A1 2.3)
- CMP K-5 on NS-05 section 17 and NS-25 section 17: Add the age-rating re-answer as a gate (FR-CMP-19) Why: ASC says "letters are never distributed"
- FRs: MKT-05, MKT-17, CMP-19
- Ruled K6 (GAP-LOG): re-read the age rating at NS-05 Level 1 (cheap check), full re-answer at NS-25 and NS-05 Levels 2 and 3.
- Conflict: see K6 in 3a

**R-034** (operations). Target: NS-05, NS-06 A and B, NS-07 C28, NS-13, NS-23 rollback lines

- Change: Add: "rollback is a PATCH build with the flag off and an expedited review (days); two EAS builds a month are held for it"
- Why: Sets the real response time (FR-OPS-26)
- Handle: OPS C05 (`functions/operations.md`). FRs: OPS-26

**R-035** NS-05 gates (Levels 2 and 3; Terms and Privacy lines). Overlap: complementary. Proposed by 2 files: support, legal

- SUP C03 on NS-05 section 22, Levels 2 and 3: Add the Guideline 1.2 set (FR-POL-03) as a gate next to the `security-architect` and counsel reads Why: Hosted content triggers report, block and filter duties
- LEG C-10 on NS-05 section 17: Add the Terms and Privacy lines of FR-LEG-05 as a production gate Why: Sharing has no description in the legal texts
- FRs: POL-03, LEG-05

**R-036** NS-06 B17 and B18 and B20: minors, delivery and "hide from the other parent". Overlap: complementary. Proposed by 2 files: data, legal

- LEG C-4 on NS-06-B17 and B18: Add a P0 (b) row for FR-LEG-07 (no age-keyed seal choices or claims; content scan) and cite the new counsel question once numbered Why: Minors and delivery are a counsel question; the card forbids the claim but has no test
- LEG C-5 on NS-06-B12 and B17: Add the Terms and Privacy lines of FR-LEG-06 as a dependency of the production flag Why: The seal changes who sees what, a major change under POLICY_VERSIONING 2.1 item 8
- DAT C-08 on NS-06 B20: "None describe it as a way to hide from the other parent" becomes a stop line Why: FR-DAT-12
- FRs: DAT-12, LEG-06, LEG-07

**R-037** (operations). Target: NS-06 Part B

- Change: New row (proposed id NS-06-B28, P0 (a), active once any second reader exists in a store build): after a server restore, no other reader sees a sealed letter's words before the author's phone re-uploads its seal
- Why: FR-OPS-08
- Handle: OPS C07 (`functions/operations.md`). FRs: OPS-08

**R-038** NS-06 B10.1 seal-sync option (a): evidence and watermark fix. Overlap: complementary. Proposed by 2 files: operations, security

- OPS C08 on NS-06 B10.1: Option (a) evidence: "pg_cron and pg_net proven on production" is met by the purge-worker schedule's healthy check (`purge-failing.md` section 1) with a dated record Why: Makes E4's condition checkable
- SEC CC-8 on NS-06 B10.1: Apply the E3 watermark fix in the card body, not only in errata Why: TB5 correctness
- FRs: none cited

**R-039** (privacy). Target: NS-06 A17

- Change: "User Content is already declared in label 1.4.0" becomes "label 2.2.0"
- Why: The label file is 2.2.0 (10 Nov)
- Handle: PRV C01 (`functions/privacy.md`). FRs: none cited

**R-040** NS-06 A11 inventory rows and confirmations. Overlap: complementary. Proposed by 1 files: privacy

- PRV C02 on NS-06 A11: Add `held_drafts.first_mark` and `held_drafts.first_label` rows (L3, L4), synced with the held draft only Why: Errata E2 adds the columns; the inventory lacks them
- PRV C04 on NS-06 A11: Record the `privacy` confirmation: `entries.first_mark` L3 Why: Asked of `privacy` in the card
- FRs: none cited

**R-041** (security and risk). Target: NS-06 Part C acceptance

- Change: Add a P0 (a) row from FR-SEC-21
- Why: Doorways sit on the lock screen
- Handle: SEC CC-5 (`functions/risk-security.md`). FRs: SEC-21

**R-042** (finance). Target: NS-07 OQ-1

- Change: Write the proof-book amount and its read date into the card instead of "the amount in the exec record"
- Why: A spend decision must be readable where it is asked
- Handle: FIN C07 (`functions/finance.md`). FRs: none cited

**R-043** (legal). Target: NS-07 section 4.17

- Change: Replace "CLO: NEEDS EVIDENCE" with the OFL FAQ 1.12 and 1.13 reading [S5] and add the font allowlist row (FR-LEG-12)
- Why: Evidence now read; one test closes the rest
- Handle: LEG C-6 (`functions/legal.md`). FRs: LEG-12

**R-044** NS-07 G11: label guard check and where the workflow lives. Overlap: complementary. Proposed by 2 files: operations, privacy

- OPS C04 on NS-07 G11 section 10: "a CI job in `.github/workflows/`" becomes "a proposed workflow in `docs/ops/proposed/workflows/`, applied by the founder" Why: Agents cannot edit workflows (FR-OPS-34)
- PRV C16 on NS-07 G11: Add check (d) of FR-PRV-29 Why: G11 does not see donation APIs or new hosts
- FRs: OPS-34, PRV-29

**R-045** NS-07 C28 rows: order of the file, no message, interior pages only. Overlap: complementary. Proposed by 1 files: print

- PRT PC-1 on NS-07-C28-3: Replace "in book order" with "in the order the preview shows: oldest first by chapter and by date"; say that the free file also reads oldest first Why: The Book tab is newest first; a paper book that starts at this month would read backwards; Read together already goes oldest first
- PRT PC-2 on NS-07-C28-8: Keep "no message" for the free file; add that an order preview may carry one line about softer pictures (FR-PRT-12) Why: A parent who pays should know before they pay; the free file is not a purchase
- PRT PC-3 on NS-07 section 4.3 "Not in scope": Add: "a cover and a spine: the free file holds interior pages only; the help article says so" Why: BK-13 listed a cover file with a computed spine; the card dropped it without saying so; a parent taking the file to a shop deserves to know
- FRs: PRT-12

**R-046** NS-30 reopen line and claims: what must be true before anyone designs the printed book. Overlap: complementary. Proposed by 3 files: support, research, print

- SUP C05 on NS-30 reopen line: Add "refunds and support for a physical product are ours, not Apple's" Why: Support cannot point printed-book refunds to Apple
- PRT PC-4 on NS-30 "What must be true before anyone designs it": Add the FR-PRT-34 list (partner, quote, proofs, Print Terms, accountant, support runbook, margin at the real quote) Why: Today it names three gates; the others are what failed the category's competitors (late parcels, lost orders; BK-14 cites them)
- PRT PC-5 on NS-30 "Claims": Add: "Forbids 'photo book', 'keepsake' as a price word, 'free shipping' and any delivery date until the partner's data supports it" Why: FTC delivery statements need a basis (S2)
- RSH C-5 on NS-07 C28 and NS-30 reopen line: Define the willingness measure as past behaviour, no price Why: FR-DAT-20; S7
- FRs: DAT-20, PRT-34

**R-047** (finance). Target: NS-08 sizing arithmetic

- Change: Replace "Paid storage prices are not read in this session (UNVERIFIED)" with V1's Pro figures (read 20 Nov) and section 3.1's 1,000-family row; keep the conclusion
- Why: NS-08-R2 asks for priced paths
- Handle: FIN C03 (`functions/finance.md`). FRs: none cited

**R-048** (legal). Target: NS-08 section 12

- Change: Reconcile the record: card says surface `backup_sheet`; code sends method `backup_sheet` and surface `settings.backup`; schema allows neither method. Pick method `consent_sheet`, surface `backup_sheet` (or `settings.backup`) and add a P0 (b) row
- Why: Otherwise the backup consent act is refused at the flip (FR-LEG-09)
- Handle: LEG C-7 (`functions/legal.md`). FRs: LEG-09

**R-049** NS-08 flip gates (runbooks, weekly check as numbers, deletion replay proven, inventory rows). Overlap: complementary. Proposed by 2 files: operations, privacy

- OPS C02 on NS-08 section 2, condition (6): "A weekly egress and storage check running" reads "a weekly check that reports Storage bytes and egress as numbers (NOT CHECKED fails the job)" Why: Today's job prints NOT CHECKED for both (FR-OPS-12)
- OPS C03 on NS-08 section 10: Add the on and off runbooks as a flip gate Why: FR-OPS-16
- PRV C08 on NS-08 section 11: At the flip, the inventory rows are the seven tables of `DATA_CLASSIFICATION.md` 4.3.1 (or ADR 0024's final list) plus the bucket and the consent row, not two Why: The flip collects device ids, key wraps and logs too
- PRV C09 on NS-08 section 22: Add a gate: the Free plan's Storage is not in the nightly dump, so the deletion replay after a restore (FR-PRV-09) is proven before the flip Why: `free-tier-ops.md:76-79`
- FRs: OPS-12, OPS-16, PRV-09

**R-050** (reliability). Target: NS-08 section 2

- Change: Add conditions: key custody drill, second copy outside GitHub, backup freshness alert, ledger second home
- Why: FR-REL-09 to 12
- Handle: REL C05 (`functions/reliability.md`). FRs: REL-09, REL-10, REL-11, REL-12

**R-051** (opportunities). Target: NS-09 / A-S07

- Change: Add a design target on the number of controls on Review before Keep
- Why: Friction found in the prototype
- Handle: OPP C-6 (`functions/feature-opportunities.md`). FRs: none cited

**R-052** (reliability). Target: NS-09

- Change: Add the canary: a deletion after the dump stays deleted after a restore
- Why: FR-REL-13
- Handle: REL C06 (`functions/reliability.md`). FRs: REL-13

**R-053** NS-10 rows: new phone, restore and re-arrival (clone beside the original, no re-run of speech, restored from a device backup, consent outstanding). Overlap: complementary. Proposed by 5 files: back-office, reliability, ai-and-speech, quality, lifecycle

- BKO C04 on NS-10 unhappy path "new phone shows no book": Add: the decision is no hand merge in 1.0 (default); the macro is M9 Why: Case (2) of FR-BKO-07
- REL C03 on NS-10 section 5: Add the clone-beside-original case and the egress count of a restore Why: FR-REL-59, 60, 53
- AIS C05 on NS-10: Add: re-download or new-phone arrival never re-runs transcription or cleaning; stored words return as stored Why: NS-12-R3 states it for versions only
- LCY C03 on NS-10 section 5: Add a row "Restored from a device backup, then sign-in: signed out on first open, book readable, no claim screen when the account is the same" and a row "no server: only the phone's own backup brings the book" Why: FR-LCY-09, 12
- QAL C10 on NS-10: Add the P0 row NS-10-Rdecline (errata E9, FR-PRV-20) Why: the errata already says it gains one
- FRs: PRV-20, BKO-07, REL-53, REL-59, REL-60, LCY-09, LCY-12

**R-054** (finance). Target: NS-10 section 8

- Change: Add: a full pull is about 12 MB per account [A] and counts against Free egress (FR-FIN-03)
- Why: Restores share the 5 GB
- Handle: FIN C09 (`functions/finance.md`). FRs: FIN-03

**R-055** NS-10 store-build gates (Terms 3.1 and Privacy "Which builds"; delete account visible; no terms needed to delete). Overlap: complementary. Proposed by 2 files: legal, compliance

- LEG C-11 on NS-10 section 17: Add Terms 3.1 and the Privacy "Which builds" section to the gate (FR-LEG-04) Why: The store build requires sign-in (D-160)
- CMP K-9 on NS-10 section 22: Add FR-CMP-17 and FR-CMP-18 as store gates Why: Sign-in is required in the store build (D-160)
- FRs: LEG-04, CMP-17, CMP-18

**R-056** (legal). Target: NS-10 section 12

- Change: Method `tap` becomes `consent_sheet` (or `reconsent_sheet`), surface `returning_consent_sheet`
- Why: The schema check refuses `tap` (FR-LEG-09)
- Handle: LEG C-8 (`functions/legal.md`). FRs: LEG-09

**R-057** (privacy). Target: NS-10 section 7

- Change: Add a P0 row for FR-PRV-20 (server refuses content pull while consent is outstanding), beside the phone rule errata E9 adds
- Why: PRIV-R08: consent that gates a server feature is checked on the server
- Handle: PRV C10 (`functions/privacy.md`). FRs: PRV-20

**R-058** (privacy). Target: NS-10, NS-11 section 11

- Change: `newPhoneLine.dismissed` and `copySlip.*` are per account (C E9, E10)
- Why: FR-PRV-14
- Handle: PRV C11 (`functions/privacy.md`). FRs: PRV-14

**R-059** (support). Target: NS-10 section 5 and section 16

- Change: `noBook` and `accountDeleted` gain "Write to us" (SUP-02)
- Why: Dead ends today
- Handle: SUP C08 (`functions/support.md`). FRs: SUP-02

**R-060** [PARTLY RULED CB-4: CUL C05] NS-11: Save a copy claim guard, the 2 GB split, and what the file leaves out. Overlap: complementary. Proposed by 2 files: lifecycle, cultural-data

- LCY C04 on NS-11 sections 3 and 19: Add the claim guard: Save a copy is "a copy in open formats", never a restore; and add the split above 2 GB to NS-11 or to a new row, gated before pictures are on in production Why: FR-LCY-12, 21
- CUL C05 on NS-11 section 3: One line: "Not included: the list of days you mark (phone only)" Why: FR-CUL-10
- FRs: LCY-12, LCY-21, CUL-10
- Ruled CB-4 (GAP-LOG): sign-out clears the store (as NS-13 and NS-18 do); the list is not in Save a copy, with a test that no phone-settings key leaks into the export.

**R-061** (security and risk). Target: NS-11 section 13 threats

- Change: Add row: "Whole book, an unlocked phone (A1, A3) / owner check with App lock; honest line on ready / FR-SEC-06, FR-SEC-08"
- Why: Missing threat
- Handle: SEC CC-3 (`functions/risk-security.md`). FRs: SEC-06, SEC-08

**R-062** (support). Target: NS-11 section 5 (too big)

- Change: Name what support offers after "Write to us" (M16). If nothing real exists, change the error to offer per-book or per-year export in the app instead
- Why: A button that leads to a reply with no answer breaks the promise
- Handle: SUP C09 (`functions/support.md`). FRs: none cited

**R-063** NS-12 section 10: size line and export default. Overlap: complementary. Proposed by 2 files: finance, privacy

- FIN C04 on NS-12 section 10 and a new row NS-12-R9 (P1): Add a size line: bytes per version and growth per family per month, measured (FR-FIN-04); a ceiling or removal path is a product decision if growth is material Why: Versions already accumulate on the server, kept until removed (D8)
- PRV C12 on NS-12 section 10: Export default changes from "not exported until decided" to FR-PRV-21's rule Why: Access right; counsel PQ-5
- FRs: FIN-04, PRV-21

**R-064** (reliability). Target: NS-12 or NS-21

- Change: Add the conflict note as a row (or a new row in NS-36), P0 (a)
- Why: FR-REL-45
- Handle: REL C04 (`functions/reliability.md`). FRs: REL-45

**R-065** [RULED CB-5, N-3] NS-13 and NS-32 lock-screen rows: one names switch or a separate switch for a day name. Overlap: differs. Proposed by 2 files: days, cultural-data

- DAY C5 on NS-13 and NS-32 lock-screen rows: Reference the one "Names in notifications" switch as covering day names (N-3, N-7) Why: Section 5.1
- CUL C03 on NS-13 settings table and `prefs.ts`: Add the separate day-name switch beside `notifications.lockScreenNames`; document that app lock forces both off Why: FR-CUL-12
- FRs: CUL-12
- Ruled CB-5 (GAP-LOG): lock screen: every library-day note shares one neutral body; the day's name shows only behind its own switch, default off and forced off while App lock is on, separate from `notifications.lockScreenNames`.
- Ruled N-3 (GAP-LOG): only public days (seasons, civic) may name themselves in a lock-screen title; family and faith days need "names in notifications" on.
- Conflict: see K19 in 3a
- Note on DAY C5: CB-5 and DL-10 amend this proposal: a library day's name has its own switch, separate from `notifications.lockScreenNames` (N-3 stands for public days).

**R-066** (operations). Target: NS-13 OQ (`killSwitches.reminders`)

- Change: Ops agrees with the default (no key); record the binary rollback above
- Why: Local notifications; a key would only narrow the window that remote config already can (C-NFR-009)
- Handle: OPS C06 (`functions/operations.md`). FRs: none cited

**R-067** (data). Target: NS-15 section 21

- Change: Drop "from the export manifest by hand"; keep only the tester question
- Why: `Manifest.counts` has no about-day field (`schema.ts:358`). Adding one changes the family's export for our measurement; I recommend against it
- Handle: DAT C-02 (`functions/data-and-measurement.md`). FRs: none cited

**R-068** (ai-and-speech). Target: NS-16

- Change: Add a row: a recording that carries a child's or a second adult's voice produces words in the order heard with no speaker marks; and a consent line for any test set (FR-AIS-26, 27)
- Why: NS-16-R5 and R9 forbid inviting a child and diarization but do not say what the words card does
- Handle: AIS C07 (`functions/ai-and-speech.md`). FRs: AIS-26, AIS-27

**R-069** (privacy). Target: NS-16 section 10

- Change: Record the `privacy` confirmation: the typed From name and `signAs.recent` are L3; `signAs.recent` is per account and cleared at sign-out
- Why: Asked in the card; X4
- Handle: PRV C05 (`functions/privacy.md`). FRs: none cited

**R-070** (privacy). Target: NS-16 section 3

- Change: Add the correction rule of FR-PRV-22 (or the plain line)
- Why: Right to correct; counsel PQ-4
- Handle: PRV C13 (`functions/privacy.md`). FRs: PRV-22

**R-071** NS-16 section 17 gates (child-input tag, Terms line, removal request by a non-user). Overlap: complementary. Proposed by 3 files: support, legal, compliance

- SUP C06 on NS-16 section 17: Add FR-POL-08 (a non-user asks for removal) as a counsel item under Q48, and make it a gate Why: No rule exists for a person with no account
- LEG C-9 on NS-16 section 17: Add the Terms line of FR-LEG-15 as a production gate, and tag the flag `child-input` (LEGAL-REQ-059) Why: A sibling speaking puts a child's voice in a letter with our knowledge
- CMP K-7 on NS-16 section 17: Tag the flag `child-input` (FR-CMP-14) Why: LEGAL-REQ-059
- FRs: POL-08, LEG-15, CMP-14

**R-072** (ai-and-speech). Target: New: NS-AI (a card or a section of NS-17) "What the machine may and may not do"

- Change: Add rows NS-AI-R1 to R4 from FR-AIS-01 to 03, 07, 53: the EditType test, the ceiling test, typed words never edited, the refusal list. Owner `speech`. Priority P0 (a)
- Why: The constitution has tests in core but no card row, so no NS trace reaches it
- Handle: AIS C01 (`functions/ai-and-speech.md`). FRs: AIS-01, AIS-02, AIS-03, AIS-07, AIS-53

**R-073** (compliance). Target: NS-17 section 17

- Change: "guideline 2.3" becomes "guideline 2.3.1(a)", read 20 Nov 2026
- Why: The rule on misleading marketing is 2.3.1(a) [S1]
- Handle: CMP K-8 (`functions/compliance.md`). FRs: none cited

**R-074** (data). Target: NS-17 section 11 or 21

- Change: Inventory: per-language tester answers are L4 in the founder's sheet; repo pooling per FR-DAT-23
- Why: TRACKING_PLAN 6.2
- Handle: DAT C-07 (`functions/data-and-measurement.md`). FRs: DAT-23

**R-075** NS-17 section 22 cost line: the per-language cost table replaces the one-line cost. Overlap: complementary. Proposed by 2 files: finance, languages

- FIN C06 on NS-17 section 22: Replace "plus model hosting on the pack host" with the R2 figures (V3) and FR-FIN-20's one-language-at-a-time rule Why: Cost is $0 within the free tier, but it must be counted
- LOC CC-LOC-4 on NS-17 section 22: Replace the one-line cost with the table in section 4.7 and FR-LOC-27 Why: Finance reviewed one number; five lines are unpriced
- FRs: FIN-20, LOC-27

**R-076** NS-17 sections 3, 5, 16 and new rows: mixed-language sentences, prompts, detection, compact tier and the distress claim (LOC and AIS both propose a row NS-17-R11). Overlap: differs. Proposed by 2 files: languages, ai-and-speech

- LOC CC-LOC-1 on NS-17 section 5, row "Mixed-language sentences" (`09-capture.md:801`): Replace with F05 7.8's wording (written as heard under the chosen language; recording one tap away; parent may type). Drop "the page says the words are not written there" unless design adds that state Why: The card promises a behaviour F05 does not describe and no design state draws
- LOC CC-LOC-5 on NS-17 section 16 and NS-35: Add: prompts for another language are original writing by a native parent-reviewer, never translations; a language with no reviewed set shows English prompts Why: Prevents literal translation and machine drafts
- LOC CC-LOC-7 on NS-17 new row: NS-17-R11 (P0 (a)): no claim that a letter in another language is noticed for distress until FR-LOC-18 (a) holds Why: English-only patterns
- AIS C02 on NS-17 section 3: Move "automatic language detection" and "a low-confidence Review line" out of Not in scope into "Proposed separately: FR-AIS-31, FR-AIS-28"; state the false-accept measure auto-detect would need before it could be opened (a measured false-accept rate; default stays: no auto-detect) Why: `09-capture.md:786` defers both to the CAIO with no id
- AIS C03 on New row NS-17-R11: Given a letter in a language that passed its gate on the full tier but not on the compact tier, then a compact-tier phone does not offer it Why: FR-AIS-43; F05 gate is per tier
- FRs: LOC-18, AIS-28, AIS-31, AIS-43
- Conflict: see K17 in 3a

**R-077** (languages). Target: NS-17-R1

- Change: Add: and its dossier (FR-LOC-26) is complete; the picker, listing, keywords, pages and help follow one list
- Why: One definition of "offered"
- Handle: LOC CC-LOC-3 (`functions/languages-and-localisation.md`). FRs: LOC-26

**R-078** (privacy). Target: NS-17 section 10

- Change: Replace "the next push sets them null" with the E7 server call (FR-PRV-19)
- Why: Errata E7
- Handle: PRV C14 (`functions/privacy.md`). FRs: PRV-19

**R-079** [RULED CB-2] NS-18 section 3 "Not in scope": recurring days and the library. Overlap: differs. Proposed by 2 files: days, cultural-data

- DAY C1 on NS-18 section 3, "Not in scope": Remove "Recurring days" and "Days the app suggests" for library days only; keep "Syncing typed days" Why: A library day recurs and the app offers the list
- CUL C01 on NS-18 section 3 "Not in scope" and the direction 3.1 sentence "A chosen day becomes a typed day": Either (a) keep typed days one-off and per phone, and have NS-47 own a separate yearly store that feeds the same planner slot, or (b) change NS-18 to allow suggested and recurring days. I recommend (a). The direction's sentence should read "a chosen day uses the typed day's planner slot and lock-screen rules" Why: NS-18 forbids recurring and suggested days; its deletion rule (the day after delivery) would delete a yearly day
- FRs: none cited
- Ruled CB-2 (GAP-LOG): a chosen day is NOT a typed day. NS-18 says "Not in scope: recurring days, days the app suggests, syncing typed days" and deletes a typed day after delivery. This amends 20-founder-direction section 3.1: the library uses a separate yearly store that feeds the same planner slot and the same one-a-day budget (`libraryDay` source, not a new class; N-2 stands).
- Conflict: see K18 in 3a

**R-080** (privacy). Target: NS-18 open question

- Change: Default ruled: typed-day words are not exported (phone-only, deleted after delivery, never held by us)
- Why: Asked of the CPrivO role in the card
- Handle: PRV C06 (`functions/privacy.md`). FRs: none cited

**R-081** (opportunities). Target: NS-23

- Change: Add one sentence: the offered prompt on the same day later (OPP-03) is a separate rule from the past-letter slip and never shows the old answer
- Why: Avoids two cards both claiming the Home slot
- Handle: OPP C-3 (`functions/feature-opportunities.md`). FRs: none cited

**R-082** (privacy). Target: NS-23 section 11

- Change: Record: both settings L2, not exported (CPrivO confirms, as asked)
- Why: Asked in the card
- Handle: PRV C07 (`functions/privacy.md`). FRs: none cited

**R-083** (support). Target: NS-23 section 16

- Change: An article line says how to turn off past letters on Home
- Why: A hard memory needs a quick off switch
- Handle: SUP C11 (`functions/support.md`). FRs: none cited

**R-084** (data). Target: NS-24 section 21

- Change: "Asked only in birthday weeks" becomes "asked every round, with a not-yet answer"
- Why: A research schedule set by a birthday puts an L4 date in the sheet (TRACKING_PLAN 6.4 logic)
- Handle: DAT C-01 (`functions/data-and-measurement.md`). FRs: none cited

**R-085** (languages). Target: NS-24 and NS-15 localisation rows

- Change: Add: dates are Gregorian and Western digits at 1.0; calendar pinned
- Why: FR-LOC-11
- Handle: LOC CC-LOC-6 (`functions/languages-and-localisation.md`). FRs: LOC-11

**R-086** (compliance). Target: NS-25 section 22

- Change: Add: demo sign-in with a two-parent Asha book in the Notes (FR-CMP-03); invitee passes the age gate (FR-CMP-13)
- Why: 2.1(a) [S1]; skill section 2
- Handle: CMP K-6 (`functions/compliance.md`). FRs: CMP-03, CMP-13

**R-087** (finance). Target: NS-25 section 22

- Change: Add a per-two-parent-family cost line (MAU, rows, pulls) under FR-FIN-02
- Why: Second account per family is the largest change in server load in the pack
- Handle: FIN C05 (`functions/finance.md`). FRs: FIN-02

**R-088** (legal). Target: NS-25 section 12 (Invite, Accept) and a new row NS-25-R20

- Change: Invite and accept state the 72-hour undo and the no-removal rule before agreement; P0 (b: consent design, Q53, Q48)
- Why: A permanent, one-way sharing term should be read before the act, not only in the Terms (FR-LEG-10)
- Handle: LEG C-1 (`functions/legal.md`). FRs: LEG-10

**R-089** (legal). Target: NS-25 section 22 (gates)

- Change: Add: Terms 4.3 and 10.1 match the build's Leave (FR-LEG-03); a Report a concern route exists (LEGAL-REQ-056)
- Why: Terms promise Leave and a safety limit that the build has no door for
- Handle: LEG C-2 (`functions/legal.md`). FRs: LEG-03

**R-090** (messaging). Target: NS-25 section 4 step 1 and new row beside NS-25-R6

- Change: Add "the link page gives the App Store link in launch mode" and "the page never states validity" (FR-MSG-27, 28)
- Why: The built page differs from the card (C-5)
- Handle: MSG C02 (`functions/messaging-and-entry-points.md`). FRs: MSG-27, MSG-28

**R-091** (messaging). Target: NS-25 section 12

- Change: Add the sentence that no email is sent to a typed address (FR-MSG-14); drop the `coparent-invite` email from the catalog
- Why: Conflict C-2
- Handle: MSG C03 (`functions/messaging-and-entry-points.md`). FRs: MSG-14

**R-092** (print). Target: NS-25

- Change: Add a line: the other parent's in-book letters can appear in a printed book the first parent orders; the other parent sees a notice, not an approval (counsel confirms)
- Why: FR-PRT-37
- Handle: PRT PC-6 (`functions/print-and-fulfilment.md`). FRs: PRT-37

**R-093** (privacy). Target: NS-25 section 12

- Change: Add the conditional door line: if counsel Q48 requires a separate sharing consent, it is a PRIV-R21 row with surface `invite_send` and its own document
- Why: D-050; S2 5.1.2(i) speaks of explicit permission before sharing with third parties (whether a co-parent is a third party there: counsel must confirm)
- Handle: PRV C15 (`functions/privacy.md`). FRs: none cited

**R-094** (research). Target: NS-25 (new row, section 21)

- Change: Add a research row: a join comprehension test (S4) before the agreement step is fixed; no agreement recorded in research
- Why: GAP D G-D16 is FOUNDER-ruled with no evidence
- Handle: RSH C-4 (`functions/research-validation.md`). FRs: none cited

**R-095** (security and risk). Target: NS-25 acceptance

- Change: Add a P1 row from FR-SEC-09
- Why: Wrong-adult join found only by chance
- Handle: SEC CC-4 (`functions/risk-security.md`). FRs: SEC-09

**R-096** NS-25 gate: the removal-after-72-hours runbook and its tool exist. Overlap: complementary. Proposed by 3 files: support, operations, back-office

- SUP C01 on NS-25 section 22 (gates): Add: "The safety-removal runbook and its tool (FR-POL-04), and macros M14 and M6, exist before the store flag turns on." Why: Terms 4.4 promises it, and the card leans twice on a runbook that does not exist
- SUP C02 on NS-25 section 5, row "P1 tries to remove P2 after 72 hours": "only the support runbook" becomes "only the safety-removal runbook (FR-POL-04), on counsel's evidence standard (Q50)" Why: Names a real path
- OPS C11 on NS-25 section 22: Add a gate: the removal-after-72-hours support route and runbook exist (Q53) Why: `SCPAR` sends parents to support (E catalogue 6.6)
- BKO C01 on NS-25 section 5 rows "P1 tries to remove P2 after 72 hours" and "Separation, or an ex-partner": "only the support runbook" becomes "only the safety-removal runbook (FR-POL-04, FR-BKO-14), on counsel's evidence standard (Q50)"; add to section 22 (gates): the limit tool and `safety-removal.md` exist before the store flag Why: Same change `support.md` proposes; this file supplies the tool contract
- FRs: POL-04, BKO-14

**R-097** (messaging). Target: NS-26

- Change: Replace the open list in lines 885 to 896 with the gate list of FR-MSG-17
- Why: One gate list for push
- Handle: MSG C05 (`functions/messaging-and-entry-points.md`). FRs: MSG-17

**R-098** (support). Target: NS-28, NS-27, NS-31 "what would reopen it"

- Change: Add "and the 1.2 controls of FR-POL-03"
- Why: Same reason
- Handle: SUP C04 (`functions/support.md`). FRs: POL-03

**R-099** [RULED N-2] (days). Target: NS-31

- Change: The `occasion` class stays out; the parked "on this day" part is separate and untouched by this card
- Why: Direction Q-FD-6, N-2
- Handle: DAY C6 (`functions/days-library.md`). FRs: none cited
- Ruled N-2 (GAP-LOG): `occasion` returns only as a source of typed days, never as a new class (Q-FD-6 first half ruled yes). No class is added to the NS-32 registry.

**R-100** [RULED N-2] NS-32 section 3 classes: how a library day reaches the planner. Overlap: differs. Proposed by 2 files: days, cultural-data

- DAY C2 on NS-32 section 3, classes: State that `typedDay` carries both a parent's typed day and a library day (no new class), per ruling N-2 Why: One budget, one registry
- CUL C02 on NS-32 section 3 classes; direction Q-FD-6: If `occasion` is reopened, name the class `libraryDay`, give it the top priority the direction asks for, one neutral body for every layer, and inherit R12 and R13 Why: FR-CUL-12
- FRs: CUL-12
- Ruled N-2 (GAP-LOG): `occasion` returns only as a source of typed days, never as a new class (Q-FD-6 first half ruled yes). No class is added to the NS-32 registry.
- Conflict: see K18 in 3a
- Note on DAY C2: CB-2 amends this proposal: a chosen day is a separate `libraryDay` source that feeds the same slot and budget, not a `typedDay` (card 21 reads it as a ranked source inside the typedDay group and asks Karma to confirm, its item 8).

**R-101** [RULED DL-2] (days). Target: NS-32 section 3, priority

- Change: A birthday beats a library day on the same date; a parent's own typed day still beats a birthday
- Why: A first birthday on Thanksgiving must be sent (Q-DAY-5)
- Handle: DAY C3 (`functions/days-library.md`). FRs: none cited
- Ruled DL-2 (GAP-LOG): a birthday wins over a library day on the same date (amends the NS-32 priority list: birthday, then library day, then month, then evening; a typed day the parent typed still ranks first). Two ticked library days on one date give one note naming both after the tap.

**R-102** [RULED DL-2] (days). Target: NS-32 section 5

- Change: Add the two-ticked-days case: one note, both named after the tap, neutral title
- Why: Section 3.3
- Handle: DAY C4 (`functions/days-library.md`). FRs: none cited
- Ruled DL-2 (GAP-LOG): a birthday wins over a library day on the same date (amends the NS-32 priority list: birthday, then library day, then month, then evening; a typed day the parent typed still ranks first). Two ticked library days on one date give one note naming both after the tap.

**R-103** (marketing). Target: NS-32 s3

- Change: Add a row: the registry admits no announcement, offer, win-back, Plus or rating class; a test fails on an unknown class id
- Why: Turns a promise ("only if you want them") into a test
- Handle: MKT C09 (`functions/marketing.md`). FRs: none cited

**R-104** (messaging). Target: NS-32 and `CATALOG.md` row `trial-ending-final`

- Change: Rule that the "one billing push" is replaced by the local plan notice already in NS-32-R4b, so v1 carries no push (FR-MSG-16)
- Why: Conflict C-1; Guideline 4.5.4 and no dormant surface
- Handle: MSG C04 (`functions/messaging-and-entry-points.md`). FRs: MSG-16

**R-105** (photos). Target: NS-32

- Change: Add a note: Apple's suggestion notifications (iOS 26) are the system's, outside the budget and outside our control
- Why: Direction 4.1 promise "one a day" must not be read to cover them
- Handle: PHS C04 (`functions/photos-and-suggestions.md`). FRs: none cited

**R-106** NS-33 rows: the floor reaches Help, first launch, sign-in, purchase and settings. Overlap: complementary. Proposed by 3 files: support, compliance, quality

- SUP C12 on NS-33: A row: the Help path, the Copy fallback and the help centre meet the floor (FR-SUP-22) Why: Not covered today
- CMP K-1 on NS-33 section 3 and R4, R7: Add first launch, sign-in, the Keep gate, Plan and Delete account to the screens (mirrors area E K-E08), and a P0 (b) row: no Accessibility Nutrition Label is declared unless every common task passes with it Why: Apple's common tasks include first launch, login, purchase and settings [S4]
- QAL C06 on NS-33 s3: Add E-S01 to E-S08, E-S14, E-S24 to the screen set Why: first run is where a new parent starts
- QAL C07 on NS-33-R6, R12: Mark non-waivable at G4 Why: the core loop for a person using VoiceOver
- QAL C08 on NS-33-R16: Say where the audit runs (a macOS runner nightly and on a candidate) and that "zero critical violations" is a gate Why: the row names a tool, not a place
- FRs: SUP-22

**R-107** NS-34 section 10 and 22: perf profile and device price. Overlap: complementary. Proposed by 5 files: operations, finance, reliability, ai-and-speech, quality

- OPS C09 on NS-34 section 10: Add: the `perf` profile is internal distribution only, spends EAS builds (D-092), and preflight refuses its marker flag in production Why: FR-OPS-22, 27
- FIN C08 on NS-34 section 22: Mark the device price UNVERIFIED and point to FR-FIN-19's decision record Why: No vendor price was read
- REL C01 on NS-34 section 3: Add Tier B (oldest supported) spot run and the ratchet (15% worse holds the feature); record battery capacity Why: FR-REL-31, 35, 38
- AIS C04 on NS-34: Add rows for transcription: p90 30 s per 2-minute letter, 2% battery, 1.4 GB peak, 0 jetsam in 30 runs, context released at 45 s, on the SE 3 and iOS 17 and latest, Asha audio only (D13) Why: `11-foundations.md:415-421` has no transcription row; F05 section 9 has the numbers
- QAL C09 on NS-34-R7: Propose P0 (b) from P1: "both iOS versions recorded" Why: iOS 17 is the lowest supported (D-098, `app.config.ts:44`) and no run on it is on record (DEVICE_TEST_PLAN: oldest "Before C1")
- FRs: OPS-22, OPS-27, FIN-19, REL-31, REL-35, REL-38

**R-108** (reliability). Target: NS-34 section 6

- Change: Offline row adds "hung server" and "captive portal"
- Why: FR-REL-40
- Handle: REL C02 (`functions/reliability.md`). FRs: REL-40

**R-109** (photos). Target: NS-35

- Change: Add `suggestion` to the closed list of start sources if the founder rules level 2 in
- Why: Navigation test N3
- Handle: PHS C05 (`functions/photos-and-suggestions.md`). FRs: none cited

**R-110** NS-36 and the Erase rows: each card names its local migration step, fixture and erase scan entry. Overlap: complementary. Proposed by 2 files: lifecycle, cultural-data

- LCY C06 on NS-36 section 10: Each card that adds a local table or column states its local migration step and the fixture row (FR-LCY-01); "Migrations: none" is replaced by "Local: step n" or "Local: none" Why: FR-LCY-01, 02
- CUL C04 on NS-36 and the Erase rows: Add the store to the erase scan and the registry Why: FR-CUL-16, FR-PRV-07, 34
- FRs: PRV-07, PRV-34, LCY-01, LCY-02, CUL-16

**R-111** (legal). Target: NS-36 section 3

- Change: Add rule 9: the Privacy Policy and the notice at collection name the field in the same release as the flag
- Why: Rule 4 covers the inventory, not what a parent is told (FR-LEG-08)
- Handle: LEG C-12 (`functions/legal.md`). FRs: LEG-08

**R-112** (messaging). Target: NS-36 or NS-41 (one owner)

- Change: Name the deletion routes after C-3 is ruled (FR-MSG-34)
- Why: Three documents disagree
- Handle: MSG C07 (`functions/messaging-and-entry-points.md`). FRs: MSG-34

**R-113** (data). Target: NS-38 section 21

- Change: Mark "product page conversion" with whether ASC computes it from opt-in usage data (UNVERIFIED)
- Why: Frame rule: name the blind spot of every number
- Handle: DAT C-15 (`functions/data-and-measurement.md`). FRs: none cited

**R-114** NS-38 section 3: listing fields, claims forbidden and enabled. Overlap: complementary. Proposed by 3 files: marketing, messaging, ai-and-speech

- MSG C06 on NS-38 section 3: Add the Support URL, Privacy Policy URL, Marketing URL (optional) and privacy choices URL as checked fields (FR-MSG-32) Why: Apple requires working URLs (2.1(a), verified)
- AIS C08 on NS-38: Add to Claims forbidden: any accuracy figure, any "works in all languages", any "AI" word, any model name; and to Claims enabled: the one registry sentence of FR-AIS-48 Why: The card has no claim rule for the speech product
- MKT C12 on NS-38 (draft) R2 and s3: Add "without an account" to R2's phrase list; name keywords, promotional text, What's New and the preview video in scope (or point to FR-MKT-09, 11, 15); give the website and welcome email a card owner, since NS-38 puts the website out of scope Why: The listing line in FR-MKT-08 passes R2 as drafted; no card owns the site
- FRs: MKT-08, MKT-09, MKT-11, MKT-15, MSG-32, AIS-48

**R-115** (quality). Target: NS-38 to NS-45

- Change: Add a "How proven" key to each P0 row
- Why: lets trace and the register agree
- Handle: QAL C11 (`functions/quality.md`). FRs: none cited

**R-116** NS-38 to NS-45: carry lists for the sign-up path. Overlap: complementary. Proposed by 3 files: support, compliance, lifecycle

- SUP C16 on NS-38 to NS-45 (when written): Include SUP-02 (E-S06 Write to us), SUP-18 (struggling before a book), the region line (CG10), and an NS-45 path for a phone that cannot update Why: First run is where most people get stuck
- CMP K-10 on NS-38 to NS-45 (when written): Carry section 3d as the sign-up path's legal and store rows, with FR-CMP-13, -15, -16, -17, -18 Why: BL-994 scope names risk checks and verification
- LCY C05 on NS-38 to NS-44 (new rows): One row for an existing alpha install (agreement only, claim, allowance on the next Keep) Why: FR-LCY-05
- FRs: SUP-02, SUP-18, CMP-13, CMP-15, CMP-16, CMP-17, CMP-18, LCY-05

**R-117** (back-office). Target: `19-from-download-to-first-letter.md` NS-39, E-S01.recovery

- Change: Nothing to change; FR-SUP-02 already asks for the Write to us button
- Why: Noted so no one adds it twice
- Handle: BKO C06 (`functions/back-office.md`). FRs: SUP-02

**R-118** NS-41 and NS-39: the emailed code works when the link page or the app link does not. Overlap: complementary. Proposed by 2 files: messaging, reliability

- MSG C01 on NS-41, new rows: Add: sender authentication and relay registration checked before a signing build (FR-MSG-01, 03); bounce receiver and alert (FR-MSG-06); not-arriving help order (FR-MSG-08); site-down and mail-down fallback (FR-MSG-15) Why: NS-41-R18 states the outcome with no gate or monitor
- MSG C08 on NS-39 section 5: Add the row "an email link opened with no app installed or a build with no entitlement lands on the web page; the code still works" (FR-MSG-24, 25) Why: Edge case missing
- REL C07 on NS-41 section 5: Add "email link page unavailable: the code still works" Why: FR-REL-03
- FRs: MSG-01, MSG-03, MSG-06, MSG-08, MSG-15, MSG-24, MSG-25, REL-03

**R-119** (research). Target: NS-39 or NS-44 section 21 (card 19)

- Change: Add a study line for the 90 second assumption: seconds only, 5 parents, stopwatch, the lines in S2
- Why: FR-DAT-33 says it is read only in a five-parent study; no card holds the study
- Handle: RSH C-3 (`functions/research-validation.md`). FRs: DAT-33

**R-120** [RULED K10] (data). Target: NS-40 section 21

- Change: Add: k = 10 with "other" for small countries, never an age answer, level, retention and deletion path (FR-DAT-35)
- Why: A refusal next to a country code, in small numbers, can point at one family
- Handle: DAT C-13 (`functions/data-and-measurement.md`). FRs: DAT-35
- Ruled K10 (GAP-LOG): country counts: privacy's storage rule is the source (daily count, 2 years); data's weekly k=10 view reads from it.
- Conflict: see K10 in 3a

**R-121** (privacy). Target: NS-40 section 11, row "Sign-up IP address"

- Change: Add: "Supabase Auth's own audit log may also hold the IP and email; retention read for the production plan and stated in data-policy 4.2"
- Why: Our hook keeps nothing, but the vendor log does (FR-PRV-26)
- Handle: PRV C18 (`functions/privacy.md`). FRs: PRV-26

**R-122** (back-office). Target: NS-41 section 12 (door lines)

- Change: Add a Never line: "support never edits a sign-in email or links an identity by hand, and never merges two accounts" (FR-BKO-07)
- Why: The rule is in a runbook and BL-598, not on the card that a parent's sign-in lives in
- Handle: BKO C03 (`functions/back-office.md`). FRs: BKO-07

**R-123** (data). Target: NS-41 section 21

- Change: Add: the rate is read as an aggregate under a runbook with an audit row; in C1 it is reported as "x of n sign-ins", not against 97%
- Why: Auth logs hold L3 data; C1 volume cannot test 97%
- Handle: DAT C-14 (`functions/data-and-measurement.md`). FRs: none cited

**R-124** (privacy). Target: NS-41 open items O-8 and O-12

- Change: Record the `privacy` position: O-8 drop the full-name scope (FR-PRV-35, a collect-less ruling); O-12 purge never-confirmed rows after 7 days (agree with the card's default)
- Why: Both are minimisation; O-12's 7 days is a retention period, so the founder confirms it with PQ-2
- Handle: PRV C19 (`functions/privacy.md`). FRs: PRV-35

**R-125** NS-42 (now on disk): the version recorded and the privacy rows. Overlap: complementary. Proposed by 2 files: privacy, legal

- PRV C20 on NS-42 (when written): Carries FR-PRV-02 and FR-PRV-04 as P0 and P1 rows, the BL-579 upload, and the answer to the input's Q-D (agree or acknowledge the Privacy Policy); default: one `privacy` acknowledge row beside `terms`, so the record names the policy version the person was shown Why: Compliance input section 5 gap list
- LEG C-15 on NS-42 (new P0 (b) row): The version recorded is a published version whose file and hash the link serves (FR-LEG-20) Why: POLICY_VERSIONING 2.4; an agreement to an unpublished draft number proves little
- FRs: PRV-02, PRV-04, LEG-20

**R-126** [RULED K1] (privacy). Target: NS-43 (when written) and the compliance input section 3

- Change: Classes: the child's name or nickname, birthday, due date and letter languages are L4, not L3 or L2; the signature stays L3. This is a `privacy` classification ruling (my charter)
- Why: `DATA_CLASSIFICATION.md` rules 6 and 7 and section 4.5 (`children.name`, `birthday`, `due_date`, `language.spoken` are L4)
- Handle: PRV C21 (`functions/privacy.md`). FRs: none cited
- Ruled K1 (GAP-LOG): child name, birthday, due date, letter languages, first letter are L4 (DATA_CLASSIFICATION.md). The compliance input rows 13, 14, 16, 18 are corrected.
- Conflict: see K1 in 3a

**R-127** [RULED K1] (privacy). Target: NS-44 (when written) and the compliance input section 3 row 18

- Change: The first letter's words and recording are L4 content, not "L3, sensitive"
- Why: `DATA_CLASSIFICATION.md` level table: letter text and audio are L4
- Handle: PRV C22 (`functions/privacy.md`). FRs: none cited
- Ruled K1 (GAP-LOG): child name, birthday, due date, letter languages, first letter are L4 (DATA_CLASSIFICATION.md). The compliance input rows 13, 14, 16, 18 are corrected.
- Conflict: see K1 in 3a

**R-128** [PARTLY RULED K4, CB-4: PRV C23, CUL C06] NS-45 (now on disk): carry the sign-out, delete, update and outage rows. Overlap: complementary. Proposed by 6 files: operations, privacy, security, back-office, lifecycle, cultural-data

- OPS C10 on NS-45 (when written): Carry FR-OPS-25 (update line, never a lock) and FR-OPS-10, FR-OPS-33 (sign-in capacity, outage path) Why: GAP-LOG E K-5
- SEC CC-7 on `19-from-download-to-first-letter.md` NS-45 (when written): Carry FR-SEC-06, FR-SEC-07, FR-SEC-12 (input G5, G6) and the D1 sheet; add FR-SEC-02 to NS-41-R6 ("B's own letters never stop syncing without a word") Why: NS-45 has no section yet
- PRV C23 on NS-45 (when written): Carries FR-PRV-14, 15 and 18 for sign-out, Erase everything and Delete account Why: Section 2
- BKO C02 on NS-45 (account life after first run): Add a P1 row: when an account is suspended or an access limited, the book stays readable and one neutral line shows (FR-BKO-26); add a P1 row for the account-act emails (FR-BKO-27, adopting G5 and G6) Why: Terms 10.2 promises export after an ending; no card says what the parent sees
- LCY C01 on NS-45-R14: Reword to match K-E05: a build at or above `minSupportedVersion` shows nothing; below it, one line in Me; "update available" is the same line, softer words Why: Two lines disagree today (FR-LCY-17)
- LCY C02 on NS-45 section 5, row "Deleted and purged; this phone opens later": Add: the new account can claim the letters on this phone through the claim screen Why: FR-LCY-11
- CUL C06 on NS-45 (when written): Carries FR-CUL-15 (sign-out clears) and FR-CUL-17 (Delete account line) Why: Section 2
- FRs: OPS-10, OPS-25, OPS-33, PRV-14, PRV-15, PRV-18, SEC-02, SEC-06, SEC-07, SEC-12, BKO-26, BKO-27, LCY-11, LCY-17, CUL-15, CUL-17
- Ruled K4 (GAP-LOG): deletion texts: legal's scope (four texts and a build-truth rule), privacy's retained-list on C-S20, support's Me-first entry; one key family in `packages/content`. The Free-plan restore line is ruled by counsel Q-note; default: say it plainly in Privacy 7.
- Ruled CB-4 (GAP-LOG): sign-out clears the store (as NS-13 and NS-18 do); the list is not in Save a copy, with a test that no phone-settings key leaks into the export.
- Conflict: see K4 in 3a

**R-129** (days). Target: New card NS-46

- Change: Days we mark (section 13); to be added after the nine expert reviews
- Why: Brief 1
- Handle: DAY C7 (`functions/days-library.md`). FRs: none cited

**R-130** (cultural-data). Target: NS-47 (new)

- Change: Section 8 outline
- Why: Direction section 8 item 3
- Handle: CUL C10 (`functions/cultural-background-data.md`). FRs: none cited

**R-131** (opportunities). Target: NS-49 (proposed, direction section 8)

- Change: Keep picture-first start and suggestions in one card; include the picture-edge gaps G-08, G-14, G-15, G-19 as acceptance rows
- Why: Picture-first makes them first-run
- Handle: OPP C-1 (`functions/feature-opportunities.md`). FRs: none cited

**R-132** (ai-and-speech). Target: Appendix A, Code deny-list

- Change: Widen from the Firsts folder to all of `packages/core/src` and `apps/mobile/src` with the names in FR-AIS-54
- Why: FR-AIS-54
- Handle: AIS C11 (`functions/ai-and-speech.md`). FRs: AIS-54

**R-133** [RULED CB-1] (cultural-data). Target: `DATA_CLASSIFICATION.md` section 4.5 (device) and `data-policy.md` section 4

- Change: New device row: L4, per account, excluded from backup, cleared at sign-out and Erase, never exported or synced
- Why: FR-CUL-01 (privacy owns; schema is not touched)
- Handle: CUL C07 (`functions/cultural-background-data.md`). FRs: CUL-01
- Ruled CB-1 (GAP-LOG): all of it is L4 (religion, country a family is from, the ticked days). Apple's label and GDPR Article 9 name religion and origin; counsel must confirm how they apply to data that never leaves the phone.

**R-134** (cultural-data). Target: `privacy-policy.md`, `in-app-disclosures.md`

- Change: One sentence on the optional list of days; wording to `legal`
- Why: FR-CUL-23
- Handle: CUL C09 (`functions/cultural-background-data.md`). FRs: CUL-23

**R-135** [RULED K3] (data). Target: F14 6.9 vs D-125 item 3

- Change: One minimum: F14 says "at least 1,000 first-time downloads"; D-125 says 500. Default: 500 (the later ruling) with the interval reported (FQ-02)
- Why: Two numbers on record
- Handle: DAT C-11 (`functions/data-and-measurement.md`). FRs: none cited
- Ruled K3 (GAP-LOG): pricing allowance rule fires at 500 first-time downloads with the 95% interval shown (D-125); F14 6.9's 1,000 is superseded.
- Conflict: see K3 in 3a

**R-136** (data). Target: `pack-pdf/03-measure.md` section 14

- Change: Question wording for Find and Share taken from NS-02 and NS-05
- Why: Fixed wording rule
- Handle: DAT C-12 (`functions/data-and-measurement.md`). FRs: none cited

**R-137** [RULED DL-5] (days). Target: GAP-LOG N-1

- Change: Reconcile the 8 to 12 variants per layer with 4 per day and 3 per season for a once-a-year day (4.6)
- Why: Q-DAY-7
- Handle: DAY C8 (`functions/days-library.md`). FRs: none cited
- Ruled DL-5 (GAP-LOG): 4 variants per day and 3 per season (a day recurs once a year).
- Conflict: see K20 in 3a

**R-138** (lifecycle). Target: `12-parked-and-not-built.md`

- Change: Add parked rows: "Bring a copy in (import)" with reopen trigger "a family cannot get a book to a new phone any other way, or the closing runbook needs it"; "A trusted person receives one copy" with reopen trigger "counsel Q49 answered"; both under the legacy rule
- Why: FR-LCY-27, 33
- Handle: LCY C07 (`functions/lifecycle-and-platforms.md`). FRs: LCY-27, LCY-33

**R-139** (lifecycle). Target: `12-parked` C-39 Android

- Change: Add the do-not-build list of FR-LCY-29 to 32 as its guard
- Why: FR-LCY-29 to 32
- Handle: LCY C08 (`functions/lifecycle-and-platforms.md`). FRs: LCY-29, LCY-30, LCY-31, LCY-32

**R-140** (languages). Target: CLAUDE.md content rules and `rules.test.ts` header

- Change: State that the typography bans (dashes, curly quotes, ellipsis characters) apply to English strings, and that other languages follow a per-language rules file written by the native reviewer; fear, guilt, AI, gender and gap rules apply to all
- Why: Applying English typography rules to French, Spanish, Hindi, Chinese or Arabic copy would be wrong or unenforceable
- Handle: LOC CC-LOC-2 (`functions/languages-and-localisation.md`). FRs: none cited

**R-141** (languages). Target: `CLAUDE.md` Where things live

- Change: "111 prompts" reads 115 (library version 4)
- Why: Stale count
- Handle: LOC CC-LOC-8 (`functions/languages-and-localisation.md`). FRs: none cited

**R-142** (opportunities). Target: `12-parked...` row C-10

- Change: State the reopen test as two steps: the NS-04 exit, then the demand check "wanted to start and could not" (3 of 5)
- Why: The existing reopen test is only technical
- Handle: OPP C-2 (`functions/feature-opportunities.md`). FRs: none cited

**R-143** (opportunities). Target: `12-parked...` or a new row

- Change: Add "Ask {child}" as a prompt-set candidate (OPP-04) with Q45 as the gate
- Why: No row names it
- Handle: OPP C-4 (`functions/feature-opportunities.md`). FRs: none cited

**R-144** (opportunities). Target: `07-remaining...` row 6.6

- Change: Name the reopen question: "Where do you keep recordings or messages about {child} today?"
- Why: Makes the "arrivals with history" test runnable
- Handle: OPP C-5 (`functions/feature-opportunities.md`). FRs: none cited

**R-145** (photos). Target: Direction 6.1 table

- Change: Replace "needs a special entitlement" with "needs the Journaling Suggestions capability (A3); whether Apple approves it separately is UNVERIFIED" and add "iOS 17.2 and later; our target is 17.0"
- Why: Two facts the direction left open
- Handle: PHS C06 (`functions/photos-and-suggestions.md`). FRs: none cited

**R-146** (photos). Target: Direction 6.1 notes

- Change: "Not read: whether Apple's suggestion notifications can open our app" is now read: yes on iOS 26 and later, only if the parent chooses our app in Settings and the app carries a universal link (A6, A7)
- Why: Closes a stated gap
- Handle: PHS C07 (`functions/photos-and-suggestions.md`). FRs: none cited

**R-147** (photos). Target: NX-39 R27

- Change: Keep closed for level 3; open a narrow exception only for the chosen-picture picker (level 2), which reads nothing the parent did not pick
- Why: Q-FD-6 default
- Handle: PHS C08 (`functions/photos-and-suggestions.md`). FRs: none cited

**R-148** (print). Target: GAP-LOG C E5

- Change: Register the order flag and the server pause key as two separate registry rows, off in store builds
- Why: Flag registry
- Handle: PRT PC-8 (`functions/print-and-fulfilment.md`). FRs: none cited

**R-149** (quality). Target: `docs/tdd/07` 11.3

- Change: Replace with Annex I, keeping S0 to S3 and the SLAs
- Why: ties severity to the constitution
- Handle: QAL C12 (`functions/quality.md`). FRs: none cited

**R-150** (reliability). Target: TDD 06 sections 2.3, 5.6, 6.1

- Change: Mark 99.9% budgets, `ops-health`, Sentry and PowerSync rows as written for Pro and a different stack; point to this file
- Why: Drift
- Handle: REL C09 (`functions/reliability.md`). FRs: none cited

**R-151** (reliability). Target: `restore-drill.md` header

- Change: Replace "RTO 4 hours" with the per-class table
- Why: FR-REL-07
- Handle: REL C10 (`functions/reliability.md`). FRs: REL-07

**R-152** (research). Target: `docs/research/USER_RESEARCH.md` header and finding 5

- Change: Mark status "desk research, no interviews" per belief, and mark finding 5 superseded
- Why: Standing duty 1; frame lines 18, 179
- Handle: RSH C-8 (`functions/research-validation.md`). FRs: none cited

### 3c. FRs whose text a ruling amends

- FR-DAY-03: CB-2 amends it: a chosen day is not a typed day; it is a separate yearly store with a `libraryDay` source (no new class); card 21 reads it as a ranked source inside the typedDay group and asks Karma to confirm (its item 8). The FR text in the function file is not edited; the owner updates it in the next pass.
- FR-PHS-02: R-IA-3 amends it: one more rank in the single Home slip slot, not a strip of several items. The FR text in the function file is not edited; the owner updates it in the next pass.

### 3d. Open items card 21 raises for Karma (NS-46 to NS-50)

`21-days-cultural-photos-home.md` ends with 14 items it does not resolve. They are between rulings and cards, not between functions, so only the cross-reference to the conflicts above is added here; the text is the card's.

- Item 1 (K19): **One names switch or two (CB-5 and DL-10 against N-7 and DAY 5.1).** Compatible: N-7 is about the child's name, CB-5 about a day's name. Resolution (RV-13): the day-name switch lives on the Days page (C-S24) so Reminders keeps one names switch; a typed day's words follow the same switch (RV-8, NS-47-R37, needs an NS-18-R3 errata row). Karma confirms.
- Item 2 (K19): **A public day's name in a title (N-3) against "the day's name shows only behind its own switch" (CB-5).** Resolution (RV-1): `publicTitleOk` is a hand-listed allowlist and with App lock on every title is neutral (NS-46-R36); default pending founder: Q-FD-18.
- Item 3 (K19 (words)): **The same neutral words, three drafts.** Kept as three strings for three jobs (typed-day title; library-day neutral title; hidden-preview placeholder) plus one neutral body per tone (NS-46-R37); the DAY 5.1 and 5.4 samples are superseded. `content` decides the words.
- Item 4 (K18): **A ticked day per account or per book.** Per account, cleared at sign-out (CB-4); the landing uses the active book's `{child}`; a quiet or hidden book gets none (R-IA-6); with every included book quiet or hidden no library reminder is sent.
- Item 5 (K11 (Home slip versus typed-day line is not a function overlap; ruled by Karma on card 21)): **Library day on Home: a slip (R-IA-3) against the typed-day line.** Resolution (RV-6): one way, the slip, however the parent arrives; the D-S11 library-day state is dropped. Karma confirms.
- Item 6 (K11): **Where the one-a-day budget is enforced.** Answered by `mobile`: nowhere (`planner.ts:320-350`; `plan-reminders.ts` is a second scheduler); `budget.ts` (NS-46-R30) is a hard prerequisite of NS-46 and NS-48, and `setChildQuiet` has no planner reader (errata E16, BL-985).
- Item 7 (no function conflict (design and test T3 decide)): **Rank of the Days ask slip.** Resolution (RV-5): rank 3b, after Save a copy, retired after two unanswered showings; T3 may move it.
- Item 8 (K18): **NS-32-R5 says "no `occasion` class".** Still true (N-2). `libraryDay` is a ranked source of the `typedDay` group (NS-46-R29); NS-32-R3 and R5 gain that ranking. A registry row would be a new class and contradict N-2.
- Item 9 (-): **The remote pause is not deliverable in a servers-off build (RV-10).** One boolean, fail-open, wired outside `mayRun`, a `kill-switches.ts` vocabulary and proposed ADR 0029 (no file yet) change; a per-tradition hold waits for Drop C.
- Item 10 (-): **Reminders off, and the first permission ask (RV-9).** Day sources get their own gate; ticking the first day makes the one iOS ask after one sentence; Karma confirms this does not break E K-E13.
- Item 11 (-): **N-4 last-letter kinds (RV-2).** `picture` dropped; `first` and `small` only with names on and App lock off.
- Item 12 (-): **The Days ask against FR-MKT-24 (no promotional slip).** Accepted as one family question, once per account (NS-50-R16); FR-MKT-24 is reworded.
- Item 13 (-): **TRACKING_PLAN 6.4 for a parent's chosen days.** Extension proposed (Q-AN-5), Karma decides.
- Item 14 (-): **BRAND.md bans "journal" in prose while DPLA 3.3.3(H) needs the journaling purpose "clearly evident".** Default keep the ban (Q-FD-34); counsel and the founder decide.

## 4. Founder and counsel question index

Every question in the question section of the 23 function files (first-wave section 7, risk-security section 10; the later files number their sections differently and are found by heading). 240 questions read; after merging the same question asked by more than one function there are 190 entries (QI-01 onward): counsel first, then founder. Defaults are copied per source; where two sources give different defaults both are shown. Owner is as the source states it; a file with no owner column (finance, data, notifications, quality, photos, research, languages, opportunities) is read from the question (a "Counsel:" or "Founder:" prefix) and marked "not stated (read as founder)" otherwise. Counsel numbers are packet 1.5.0 as the files cite them; "needs a number from legal" is shown as written. **Due dates:** no function file states a calendar date for most questions and the roadmap of record has no dated gate list for them, so a due date is given only where the source row states one ("stated"); every other entry carries a proposed due rule tied to the gate it blocks, labelled "proposed" so it is not read as a source date. Ruled entries carry the GAP-LOG ruling id.

One row of the photos file ("Existing numbers", Q43 Q45 Q48 Q54 "unchanged") is a note, not a question, and is not counted.

### 4.1 Counsel questions

**QI-01** Co-parent removal and what limits a parent's access

- Owner as stated: counsel, Q50 FOUNDER-ANSWERED 20 Nov, default accepted (CL-100, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement; counsel; counsel Q50, Q53 FOUNDER-ANSWERED 20 Nov, default accepted (CL-071, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement; Counsel (Q50 family; needs a number from legal); Founder, counsel. Counsel numbers: Q50, Q53. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- SUP Q-SUP-6 (`functions/support.md`): What evidence lets us limit a co-parent's access (Terms 4.4)? Default: A verified court order, or a counsel decision case by case, using the counsel-led runbook
- LEG L-1 (`functions/legal.md`): Co-parent removal: is the 72-hour undo plus no later removal enforceable and fair between separating parents, and is it enough that the rule is shown at invite and accept (FR-LEG-10)? What evidence standard limits a parent's access under Terms 4.4? Default: As drafted (D11); the rule shown on both sheets; access limited only on a verified court order or a safety report checked by the founder Number: Q53, Q50
- SEC Q-S7 (`functions/risk-security.md`): May a co-parent be removed for safety after 72 hours? Default: Keep the Terms (72 hours only) until counsel answers
- BKO Q-BKO-4 (`functions/back-office.md`): In a safety case, is the limited person told, and when? Terms 10.2 says "where we can, we will tell you why first"; Terms 4.4 says "after checking, we may limit". They can pull in opposite directions when the reporter may be at risk Default: Counsel decides per case until a standard exists; default is no notice beyond the neutral in-app line and the one content-free email of FR-BKO-27 sent only if counsel says it is safe FOUNDER-ANSWERED 20 Nov, default accepted (CL-066, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: two offline key copies, abuse@ alias, counsel second reader
- BKO Q-BKO-5 (`functions/back-office.md`): Does the 4-hour or same-day handling of a safety report need a second reader, given one founder? Default: Counsel is the second reader for any act that limits or ends an account. For a macro M6 reply, no second reader: speed matters more FOUNDER-ANSWERED 20 Nov, default accepted (CL-066, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: two offline key copies, abuse@ alias, counsel second reader
- FRs cited: LEG-10, BKO-27

**QI-02** [PARTLY RULED K6: MKT MQ-8] Is the two-parent book or a shared letter user-generated content (Guideline 1.2) and the age-rating answers

- Owner as stated: counsel and the founder (needs a number from legal) FOUNDER-ANSWERED 20 Nov, default accepted (CL-100, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement; Counsel: needs a number from legal; counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- SUP Q-SUP-7 (`functions/support.md`): Is the two-parent book "user-generated content" under Guideline 1.2? Default: Treat it as not, while it stays capped at two parents who invite each other. Treat anything hosted for a third person as 1.2
- MKT MQ-8 (`functions/marketing.md`): Age rating at NS-25: does two parents reading one book change User-Generated Content or Messaging answers? Default: No change for NS-01 to NS-06; re-answer at NS-25 with counsel's view
- CMP C-5 (`functions/compliance.md`): Does guideline 1.2 (user-generated content: filtering, reporting, blocking) apply to a book shared by two parents, and to a letter sent through the parent's own share sheet? Default: Treat NS-25 as in scope for a report route (LEGAL-REQ-056, `legal.md` FR-LEG-10); NS-05 out of scope (we host nothing) Number: needs a number from legal (with CR-086)
- Ruled K6 (GAP-LOG): re-read the age rating at NS-05 Level 1 (cheap check), full re-answer at NS-25 and NS-05 Levels 2 and 3.
- FRs cited: LEG-10

**QI-03** Someone else speaks (NS-16): a non-user's name and words in a letter

- Owner as stated: counsel, Q48 FOUNDER-ANSWERED 20 Nov, default accepted (CL-100, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement; counsel; Counsel. Counsel numbers: Q45, Q46, Q48, Q54. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- SUP Q-SUP-8 (`functions/support.md`): A person with no account whose words are in another parent's letter asks for removal. What do we owe them? Default: We tell them we cannot see or change the letter, and suggest they ask the author. NS-16 waits on the answer
- LEG L-6 (`functions/legal.md`): Someone else speaks: on the parent's say-so, may we store another adult's name and words in the parent's letter, and what if the speaker is a child? Default: Instruction line only (D9); flag off in production until read; tagged `child-input` Number: Q48, Q45, Q46
- CMP C-6 (`functions/compliance.md`): Under 5.1.2(i), is storing a non-user's name and words in a parent's synced letter (NS-16) on the parent's say-so acceptable, or does App Review expect the speaker's permission in the app? Default: Instruction line only (D9); describe the feature in the Notes Number: Q48
- PRV PQ-8 (`functions/privacy.md`): Is a typed name of a non-user (NS-16) a Contact Info row? Default: No row; the flag stays off in production until answered Number: Q54 (proposed sub-question (f)) FOUNDER-ANSWERED 20 Nov, default accepted (CL-081, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- OPP OQ-4 (`functions/feature-opportunities.md`): Counsel: a child's voice and a third party's voice in a letter Default: Needs a number from legal (Q45, Q48); default: parked until read FOUNDER-ANSWERED 20 Nov, default accepted (CL-060): Counsel Q45 and Q48; parked until read. Decision made, action pending founder hands: counsel engagement

**QI-04** Pilot and tester texts, consent and retention

- Owner as stated: counsel; counsel, founder. Counsel numbers: Q44, Q45, Q51. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LEG L-7 (`functions/legal.md`): Concierge pilot with tester families: consent texts W and V, notes retention 30 days, consent records 12 months, and Arm V (a child's voice sent by the parent to a relative) Default: Arm W only until the reads; texts as NS-03 section 15 Number: needs a number from legal; with Q44, Q45, Q51
- LEG L-13 (`functions/legal.md`): May the founding family and outside testers agree to texts published as 0.9.0 test versions, and must the app re-ask at 1.0.0? Until then, which version does the store build record (FR-LEG-20)? Default: Record only a published version; 0.9.0 for testers, 1.0.0 with re-consent after counsel Number: Q44
- DAT FQ-08 (`functions/data-and-measurement.md`): Counsel: the tester round text and retention Default: Q44 (real families under draft texts) and Q51 (retention), packet 1.5.0, as the frame already cites. Default: D5
- RSH RQ-5 (`functions/research-validation.md`): Counsel: tester and study texts, and retention Default: Q44 and Q51 as the pilot uses; default D4 (12 months for consent records) and the clocks of FR-RSH-22 FOUNDER-ANSWERED 20 Nov, default accepted (CL-075, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- FRs cited: LEG-20, RSH-22

**QI-05** Tester answers that are personal data (language, assistive technology)

- Owner as stated: counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- DAT FQ-06 (`functions/data-and-measurement.md`): Counsel: per-language tester answers in the founder's sheet (L4) Default: Needs a number from legal. Default: FR-DAT-23. Packet Q6 (the analytics language code) is deferred to v1.1 and does not cover this
- DAT FQ-07 (`functions/data-and-measurement.md`): Counsel: tester answers that reveal assistive-technology use Default: Needs a number from legal. Default: FR-DAT-24. Counsel must confirm whether this is sensitive data
- FRs cited: DAT-23, DAT-24

**QI-06** Offer codes to pilot, study or TestFlight families

- Owner as stated: Counsel: needs a number from legal (Q41(f) covers only what an offer code must say); founder; counsel Q41(f); founder; counsel. Counsel numbers: Q41. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- MKT MQ-9 (`functions/marketing.md`): Offer codes to pilot, study or TestFlight families after their read-outs: is a free Plus period a material connection that each family must disclose if they post or review? Default: Treat it as one: no code before the read-out, and any code carries a disclosure line (F1)
- FIN F11 (`functions/finance.md`): Offer codes Default: None (recommendation: None until counsel answers Q41(f) and the pilot reads out)
- RSH RQ-2 (`functions/research-validation.md`): Founder: any incentive? Default: None beyond a thank-you message, as NS-03 OQ-3. My recommendation to consider: a small fixed thank-you for people he does not know. Any spend is his decision FOUNDER-ANSWERED 20 Nov, default accepted (CL-074, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel and accountant engagement
- RSH RQ-7 (`functions/research-validation.md`): Counsel and tax adviser: any duty from a thank-you payment Default: Needs a number from legal. Default: none given until answered; UNVERIFIED FOUNDER-ANSWERED 20 Nov, default accepted (CL-074, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel and accountant engagement

**QI-07** Sign-in required in the store build (Terms 3.1, 5.1.1(v), listing variant)

- Owner as stated: founder; founder, counsel; Founder; counsel Q43. Counsel numbers: Q43, Q44. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LEG L-8 (`functions/legal.md`): Terms 3.1 and sign-in required (D-160): rewrite the Terms to say an account is needed in this version, or keep local use without an account? Default: Rewrite Terms 3.1 and the Privacy "Which builds" section to Build 12 facts (FR-LEG-04); App Review risk is in `compliance.md` (C-4) Number: founder decision; counsel reads with Q44
- CMP C-4 (`functions/compliance.md`): Sign-in required in Build 12: is the account-based feature set (sync, second phone, co-parent later, deletion) enough under 5.1.1(v), or should local use without an account return? Default: Keep sign-in required; state the account features in the Notes; if App Review objects, the servers-off first-run path (E-S02.serversOff) is the fallback Number: needs a number from legal (same question as compliance input G6); founder decision
- MKT MQ-5 (`functions/marketing.md`): Which listing variant goes with Build 12, given "Without an account, your book stays on your phone" and sign-in required? Default: The servers-on variant, re-checked line by line against the Build 12 binary
- FRs cited: LEG-04

**QI-08** Notifications: Apple 4.5.4 and names in notifications

- Owner as stated: counsel; Counsel. Counsel numbers: Q41, Q43. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LEG L-12 (`functions/legal.md`): Typed days and names in notifications: is the opt-in for typed words and the child's name enough under Privacy 5 and Apple 4.5.4 for local notifications? Default: As built; never by default; Privacy 5 says so (FR-LEG-08) Number: Q43
- CMP C-7 (`functions/compliance.md`): Does guideline 4.5.4 apply to local notifications, and are plan notices "sensitive personal information"? Default: Treat 4.5.4 as applying; no names or words by default; plan notices carry dates, not amounts (D-083) Number: Q41
- CUL CUL-Q11 (`functions/cultural-background-data.md`): Is a note that names a faith day "sensitive personal information" for the purposes of 4.5.4 even though it is local? Default: Treat as yes; neutral by default (FR-CUL-14) Number: Q41 (compliance C-7)
- FRs cited: LEG-08, CUL-14

**QI-09** [RULED K5] Age signals and the under-18 stop (Texas, California, "I answered by mistake")

- Owner as stated: counsel; counsel, Q46 (area E CG14) FOUNDER-ANSWERED 20 Nov, default accepted (CL-100, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement. Counsel numbers: Q46. Due: 1 Jan 2027 is the date in the question (stated).
- CMP C-2 (`functions/compliance.md`): Installs made before 1 Jan 2027: must the app ask the platform for an age signal for existing users, and by when? May a signal be kept with the Terms acceptance as evidence? Default: Request at every launch on iOS 26+ from 1 Jan 2027; keep nothing Number: Q46
- CMP C-3 (`functions/compliance.md`): Texas SB 2420: which developer duties apply to an 18+ app with an 18+ rating while the stay holds? Default: Honour the store's age category signal as in FR-CMP-15; rating 18+ Number: Q46 (with CR-004)
- SUP Q-SUP-13 (`functions/support.md`): Keep "I answered by mistake" on the age stop in store builds? Default: Keep it (LEGAL-REQ-002 neutrality). Support never acts on an age answer it cannot see
- Ruled K5 (GAP-LOG): store nothing on the Texas age signal until counsel Q46 answers (FR-CMP-15 over FR-PRV-25).
- FRs cited: CMP-15

**QI-10** [RULED K4] Restore window on the Free plan and what the policy may say about deletions

- Owner as stated: Counsel; counsel Q51 (retention and deletion exceptions); counsel must confirm. Counsel numbers: Q51. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PRV PQ-10 (`functions/privacy.md`): Is the restore-window limit (up to 24 hours of deletions can return after losing the project on the Free plan) something the policy must say? Default: Say it in the incident notice, not in the policy; prove the replay (FR-PRV-09) so the window shrinks to zero where the ledger survives Number: Q51 FOUNDER-ANSWERED 20 Nov, default accepted (CL-081, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- OPS Q7 (`functions/operations.md`): Can a restore on Free be promised not to bring back deleted items? Default: No promise; the privacy text must not say deletions survive a disaster restore on Free (`free-tier-ops.md`)
- Ruled K4 (GAP-LOG): deletion texts: legal's scope (four texts and a build-truth rule), privacy's retained-list on C-S20, support's Me-first entry; one key family in `packages/content`. The Free-plan restore line is ruled by counsel Q-note; default: say it plainly in Privacy 7.
- FRs cited: PRV-09

**QI-11** Earlier versions: access and deletion rights

- Owner as stated: counsel; Counsel. Counsel numbers: Q48, Q51, Q55. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LEG L-11 (`functions/legal.md`): Earlier versions and the right to delete: does a deletion right reach a removed earlier version, and on what clock? Default: Erased on the deleted-letter clock (D8) Number: Q51, Q48
- PRV PQ-5 (`functions/privacy.md`): Does an access request reach server-held data the phone's copy lacks (earlier versions, `audit_events` and `deletion_requests` rows about the person)? Default: Yes: include the person's own rows in `account.json` and the versions in the author's copy Number: needs a number from legal (near Q55) FOUNDER-ANSWERED 20 Nov, default accepted (CL-081, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement

**QI-12** Leak and breach notification clocks

- Owner as stated: needs a number from legal; counsel must confirm; counsel Q28 FOUNDER-ANSWERED 20 Nov, default accepted (CL-071, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement. Counsel numbers: Q28. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- OPS Q9 (`functions/operations.md`): Notification clocks for the new data kinds in a leak (From name of another adult, first labels, seal dates) Default: Treat each as the letter's own class (L4) until counsel says otherwise
- SEC Q-S5 (`functions/risk-security.md`): Breach notice: do letters, a child's details, voice recordings or pictures held by this app count as personal information or a personal health record under California Civil Code 1798.82 and the FTC HBNR, and on which clock? Default: Treat as covered for readiness (packet Q28 default). Counsel must confirm

**QI-13** Accessibility label and statement

- Owner as stated: founder; counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- CMP C-1 (`functions/compliance.md`): Declare any Accessibility Nutrition Label for the first store build? Default: Declare none until the FR-CMP-06 walk passes on the candidate; then Dark Interface first (the store draft), VoiceOver and Reduced Motion only after the walk covers sign-in and purchase Number: founder decision
- CMP C-8 (`functions/compliance.md`): Is WCAG 2.2 AA the right target to state publicly, and should the accessibility statement say "aim" rather than "meet" while gaps remain? Default: "We aim to meet WCAG 2.2 AA" plus known gaps Number: needs a number from legal (with CR-070)
- FRs cited: CMP-06

**QI-14** [RULED K10] Country at sign-up: derived in memory versus counted

- Owner as stated: counsel; Counsel. Counsel numbers: Q57. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- DAT FQ-09 (`functions/data-and-measurement.md`): Founder and counsel: may the NS-40 refusal counts by country and the NS-41 sign-in counts be computed in the 1.0 line? Default: Needs a number from legal for the country count. Default: yes for NS-41 as an aggregate under a runbook (it serves a reliability target); NS-40 only with the FR-DAT-35 limits and a privacy read first
- PRV PQ-7 (`functions/privacy.md`): Is a country derived in memory at sign-up and never kept "collected" for the label? Default: Not collected; label unchanged (CPrivO-2) Number: Q57(f) FOUNDER-ANSWERED 20 Nov, default accepted (CL-081, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- Ruled K10 (GAP-LOG): country counts: privacy's storage rule is the source (daily count, 2 years); data's weekly k=10 view reads from it.
- FRs cited: DAT-35

**QI-15** Who may open the recovery kit ("if I cannot act") and whether a second person has production reach

- Owner as stated: Founder, counsel (needs a number from legal); Founder; founder; needs a number from legal FOUNDER-ANSWERED 20 Nov, default accepted (CL-091, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: sealed key sheet holder, Vercel plan check, counsel engagement. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- BKO Q-BKO-3 (`functions/back-office.md`): Is a second person with any production reach acceptable, and what must the policy say first? Default: No second person by default. If the founder names one, the policy line 55 and any health-privacy text are changed first, the person holds sealed recovery only, and counsel confirms the access fits Privacy 3 and the sensitive-data consent FOUNDER-ANSWERED 20 Nov, default accepted (CL-066, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: two offline key copies, abuse@ alias, counsel second reader
- BKO Q-BKO-6 (`functions/back-office.md`): Who holds the sealed recovery kit if the founder names no one: nobody, or an attorney or a family member? Default: Nobody; the plan records the accepted risk and the pre-staged pause. Revisit at the first month with a person outside the founder's family FOUNDER-ANSWERED 20 Nov, default accepted (CL-066, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: two offline key copies, abuse@ alias, counsel second reader
- REL Q-REL-3 (`functions/reliability.md`): Who may open the key and the "if I cannot act" sheet? Default: One trusted adult holds the sealed sheet; opening it gives the key, not family data access without a second step. Counsel must confirm any access consequence

**QI-16** Backup copies: GitHub as a named processor, a second copy outside GitHub, and the decryption key copies

- Owner as stated: Counsel; founder; counsel PQ-3 FOUNDER-ANSWERED 20 Nov, default accepted (CL-090, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: monthly second backup copy, second-provider status page, second contact route, borrow a phone; Founder, `security-architect`. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PRV PQ-3 (`functions/privacy.md`): Is GitHub, holding our nightly dump encrypted to a key only the founder holds, a processor we must name? Default: Name it in `subprocessors.md` and the policy's backup sentence anyway; minimal cost, no surprise Number: needs a number from legal FOUNDER-ANSWERED 20 Nov, default accepted (CL-081, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- REL Q-REL-2 (`functions/reliability.md`): Second copy of the backup outside GitHub (FR-REL-11)? Default: Yes, monthly, to one place the founder controls; name it in the policy's backup sentence if counsel asks
- BKO Q-BKO-7 (`functions/back-office.md`): Is the nightly backup's decryption key held only by the founder? Is there a second offline copy, and has a restore from it been tested? Default: Two offline copies in different places, restore tested at the first monthly drill and recorded. UNVERIFIED today which copies exist FOUNDER-ANSWERED 20 Nov, default accepted (CL-066, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: two offline key copies, abuse@ alias, counsel second reader
- FRs cited: REL-11

**QI-17** Training-data terms of each speech model (counsel Q9)

- Owner as stated: Counsel (Q9); not stated (read as founder). Counsel numbers: Q9. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- AIS AQ-5 (`functions/ai-and-speech.md`): Counsel Q9: the training-data terms of the Hindi small model (S2: GramVaani, ULCA, Shrutilipi, FLEURS) and of Whisper large-v3-turbo; is shipping them in a paid app acceptable? Default: Counsel must confirm before Hindi ships; until then English only FOUNDER-ANSWERED 20 Nov, default accepted (CL-095, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- LOC C-LOC-3 (`functions/languages-and-localisation.md`): Training-data terms for each speech model (Hindi small, any model for Mandarin or Arabic) Default: Packet Q9, Q12, live. Default: no language ships until Q9 is answered for its model (FR-LEG-13). Counsel must confirm.
- FRs cited: LEG-13

**QI-18** A child's voice: in a parent's recording and in a test set

- Owner as stated: Counsel; Counsel (Q45). Counsel numbers: Q45. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PRV PQ-11 (`functions/privacy.md`): A baby's voice on a parent's recording: provided by the parent, or collected from a child? Default: Unchanged: parent-as-user; no speaker identification, no voiceprints; the FTC FAQ treats a child's voice as personal information (S5 F.6), so this stays the open edge before backup ships Number: Q45 FOUNDER-ANSWERED 20 Nov, default accepted (CL-081, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- AIS AQ-8 (`functions/ai-and-speech.md`): Counsel Q45 and the child's voice: may a test set contain a child speaking, and with what consent text? Default: No child in any test set until counsel answers; adult actors and scripted clips only (FR-AIS-26, 37) FOUNDER-ANSWERED 20 Nov, default accepted (CL-095, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- FRs cited: AIS-26, AIS-37

**QI-19** Is the ticked-days list special-category data by inference (GDPR Article 9 and US state rules)

- Owner as stated: Counsel (needs a number from legal) FOUNDER-ANSWERED 20 Nov, default accepted (CL-088, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement; Counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- DAY Q-DAY-11 (`functions/days-library.md`): Is the ticked-days list "special category" data by inference, wherever it is stored (GDPR Article 9 and similar laws)? Default: Counsel must confirm. Keep it on the phone only and out of analytics, logs, crash reports and the exported copy until counsel answers (see `functions/cultural-background-data.md`)
- CUL CUL-Q6 (`functions/cultural-background-data.md`): Does GDPR Article 9, or a US state sensitive-data rule, reach religion or origin data that is stored only on the user's own phone and never received by us? Is an app maker a controller for it? Does a US-only storefront (compliance.md line 161) change the answer? Default: Design as if it did: explicit, optional, withdrawable, never received; counsel confirms. S3 Art 9(1), 9(2)(a) and S4 are the only texts read Number: needs a number from legal

**QI-20** [RULED DL-10, CB-5, N-3] Whether a day's name may show on the lock screen

- Owner as stated: Privacy, counsel (needs a number from legal) CLOSED 20 Nov, see GAP-LOG Closures CL-087; Founder; not stated (read as founder). Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- DAY Q-DAY-6 (`functions/days-library.md`): May a tradition day's name show on the lock screen when "Names in notifications" is on? Does it need a second, plain line? Default: One switch, one plain line: "This can also show the name of a day your family keeps."
- CUL CUL-Q9 (`functions/cultural-background-data.md`): Separate switch for the day's name in a note, default off, forced off by App lock? Default: Yes. The direction says the faith is named "only when the parent has switched on names in notifications"; a separate switch avoids exposing a faith just because the child's name was switched on
- NTC Q-NTC-2 (`functions/notification-catalogue.md`): Which days may name themselves in a lock-screen title: public only, or family days too (Mother's Day on a lock screen reveals little but may hurt in some homes) Default: Public only; family and faith need names on CLOSED 20 Nov, see GAP-LOG Closures CL-040
- Ruled DL-10 (GAP-LOG): a tradition day's name on the lock screen only with its own names switch on (CB-5); privacy and counsel decide beyond that.
- Ruled CB-5 (GAP-LOG): lock screen: every library-day note shares one neutral body; the day's name shows only behind its own switch, default off and forced off while App lock is on, separate from `notifications.lockScreenNames`.
- Ruled N-3 (GAP-LOG): only public days (seasons, civic) may name themselves in a lock-screen title; family and faith days need "names in notifications" on.

**QI-21** Who sells a printed book, sales tax and the accountant

- Owner as stated: founder, counsel, accountant; accountant, counsel; founder (engages accountant). Counsel numbers: Q47. Due: before the first order (stated in the question); before the first payout (CR-120) (stated).
- PRT Q-PRT-2 (`functions/print-and-fulfilment.md`): Who is the seller: the founder as an individual (D-004), or an entity formed first (BK-14 recommends the entity before the first order)? Default: Entity first; selling physical goods as an individual carries personal liability; accountant and counsel to confirm Number: Q47 CLOSED 20 Nov, see GAP-LOG Closures CL-097
- PRT Q-PRT-6 (`functions/print-and-fulfilment.md`): Sales tax: which states, who collects, which tool, and does an individual seller change the answer? Default: Pilot only where the accountant has settled; use a tax tool (S6 lists one) Number: CR-120; FR-FIN-24; finance A7 CLOSED 20 Nov, see GAP-LOG Closures CL-097
- FIN F13 (`functions/finance.md`): Engage an accountant before the first payout (CR-120) Default: Not engaged (CR-120 stays Gap) (recommendation: Yes, with the brief below)
- FRs cited: FIN-24

**QI-22** Privacy 3 says we read letters "only if you ask us for help". May support refuse to read letters even when a parent asks, and should that phrase be removed?

- Owner as stated: counsel, Q43 (claims) CLOSED 20 Nov, see GAP-LOG Closures CL-099. Counsel numbers: Q43. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- SUP Q-SUP-1 (`functions/support.md`): Privacy 3 says we read letters "only if you ask us for help". May support refuse to read letters even when a parent asks, and should that phrase be removed? Default: Support never reads. Remove "if you ask us for help" from Privacy 3, or narrow it to "if you ask us in writing to look at a specific letter". Counsel must confirm

**QI-23** How long do we keep support emails, and emails that arrived with letter content?

- Owner as stated: counsel, Q51 CLOSED 20 Nov, see GAP-LOG Closures CL-099. Counsel numbers: Q51. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- SUP Q-SUP-4 (`functions/support.md`): How long do we keep support emails, and emails that arrived with letter content? Default: Correspondence: 12 months after the ticket closes. A message carrying content: delete the content and attachments when the request closes, and keep only the log row

**QI-24** Does support ever call emergency services for someone who writes in danger?

- Owner as stated: counsel (needs a number from legal), BL-105 FOUNDER-ANSWERED 20 Nov, default accepted (CL-100, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- SUP Q-SUP-5 (`functions/support.md`): Does support ever call emergency services for someone who writes in danger? Default: No. Support gives the emergency number and the helplines (M6) and the founder reads it the same day. Counsel and the BL-105 clinician must confirm

**QI-25** If a printed book (NS-30) ever ships, who handles refunds and delivery problems?

- Owner as stated: founder FOUNDER-ANSWERED 20 Nov, default accepted (CL-100, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- SUP Q-SUP-9 (`functions/support.md`): If a printed book (NS-30) ever ships, who handles refunds and delivery problems? Default: Decide before NS-30 reopens. It is not Apple

**QI-26** Executors and guardians after a death

- Owner as stated: counsel, Q49 FOUNDER-ANSWERED 20 Nov, default accepted (CL-100, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement. Counsel numbers: Q49. Due: before C1 (stated in the row).
- SUP Q-SUP-10 (`functions/support.md`): Executors and guardians after a death Default: No clause and no action. Write the runbook before C1

**QI-27** After a loss, may billing notices stop while Apple still bills?

- Owner as stated: counsel, Q52 FOUNDER-ANSWERED 20 Nov, default accepted (CL-100, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement. Counsel numbers: Q52. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- SUP Q-SUP-11 (`functions/support.md`): After a loss, may billing notices stop while Apple still bills? Default: They continue (packet default). Support explains how to cancel through Apple

**QI-28** Can the 0.9.0 pages go live while their by-hand promises (Route 1, "we offer to delete what was synced") cannot be kept?

- Owner as stated: founder FOUNDER-ANSWERED 20 Nov, default accepted (CL-100, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- SUP Q-SUP-14 (`functions/support.md`): Can the 0.9.0 pages go live while their by-hand promises (Route 1, "we offer to delete what was synced") cannot be kept? Default: No. Change the sentences first, or build BL-551 first (CR-60)

**QI-29** The FAQ answer in `site.en.ts:109` lists Read together as "never locked away". Replace it?

- Owner as stated: Founder; counsel Q40. Counsel numbers: Q40. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- MKT MQ-1 (`functions/marketing.md`): The FAQ answer in `site.en.ts:109` lists Read together as "never locked away". Replace it? Default: Yes: list only what the Terms 8.2 permanent list covers (reading kept letters, playing their recordings, export) and say "Read together is free" with no time word

**QI-30** The welcome email says letters and recordings "stay on your iPhone", false once sign-in syncs letters (D-160). Remove now?

- Owner as stated: Founder; counsel Q34, Q43. Counsel numbers: Q34, Q43. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- MKT MQ-2 (`functions/marketing.md`): The welcome email says letters and recordings "stay on your iPhone", false once sign-in syncs letters (D-160). Remove now? Default: Yes: remove the line in one PR to `main` (removing a false claim promises less); classify the email before any further send

**QI-31** The site says "Your letters are never used to train AI." Replace with the D-061 promise words?

- Owner as stated: Founder; counsel Q16, Q43. Counsel numbers: Q16, Q43. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- MKT MQ-3 (`functions/marketing.md`): The site says "Your letters are never used to train AI." Replace with the D-061 promise words? Default: Yes

**QI-32** Keep specific prices in the store description (Apple advises against it)?

- Owner as stated: Founder; counsel Q37, Q41. Counsel numbers: Q37, Q41. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- MKT MQ-4 (`functions/marketing.md`): Keep specific prices in the store description (Apple advises against it)? Default: Remove the prices from the description; keep the subscription and auto-renewal paragraph; prices stay on Apple's page and the website (D-075)

**QI-33** Trademark: the name is not cleared (D-121 note). Hold paid placement and permanent printed uses until cleared?

- Owner as stated: Counsel Q10. Counsel numbers: Q10. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- MKT MQ-12 (`functions/marketing.md`): Trademark: the name is not cleared (D-121 note). Hold paid placement and permanent printed uses until cleared? Default: Yes

**QI-34** A status page

- Owner as stated: founder; every public sentence is a claim: counsel Q43 (privacy claims) where it touches privacy. Counsel numbers: Q43. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- OPS Q4 (`functions/operations.md`): A status page Default: Yes: a static page on the website, no subscriptions, no times; content-free

**QI-35** Suspending an account on a possible sanctions match

- Owner as stated: counsel Q57; counsel must confirm. Counsel numbers: Q57. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- OPS Q8 (`functions/operations.md`): Suspending an account on a possible sanctions match Default: Suspend sign-in, keep everything, tell counsel the same day

**QI-36** Counsel

- Owner as stated: founder (engages counsel). Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- FIN F5 (`functions/finance.md`): Counsel Default: No engagement (recommendation: One packet with the pack's gating questions, fixed fee)

**QI-37** D-004 hedge: start an entity in parallel (due 27 Nov)

- Owner as stated: founder, accountant, counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: due 27 Nov (stated).
- FIN F12 (`functions/finance.md`): D-004 hedge: start an entity in parallel (due 27 Nov) Default: No entity, no spend; the 5.1.1(ix) risk stays accepted (recommendation: Talk to the accountant and counsel first; the $800 California LLC tax and formation costs are the accountant's to confirm)

**QI-38** When a parent withdraws sensitive-data consent, what happens to letters already on our server?

- Owner as stated: Founder, then counsel. Counsel numbers: Q48. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PRV PQ-1 (`functions/privacy.md`): When a parent withdraws sensitive-data consent, what happens to letters already on our server? Default: Writes stop at once; nothing is deleted by the withdrawal itself; the sheet offers Save a copy and Delete account in the same place. A deletion offer that is one tap away keeps withdrawal as easy as agreeing without making it destructive Number: Q48 (consent design); OQ-L1 in BL-485 FOUNDER-ANSWERED 20 Nov, default accepted (CL-081, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement

**QI-39** Should sign-up rows that hold only an email be deleted after a period: an address that never confirmed its code (NS-41 O-12), and a confirmed account that never accepted the Terms and holds nothing?

- Owner as stated: Founder (retention). Counsel numbers: Q51. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PRV PQ-2 (`functions/privacy.md`): Should sign-up rows that hold only an email be deleted after a period: an address that never confirmed its code (NS-41 O-12), and a confirmed account that never accepted the Terms and holds nothing? Default: Yes: never-confirmed rows after 7 days (the card's default); confirmed rows with no Terms and no book after 30 days, by the purge path with a receipt and no email Number: Q51 FOUNDER-ANSWERED 20 Nov, default accepted (CL-081, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement

**QI-40** Does a right to correct reach a letter's raw transcript, or a From name that is insert-only today?

- Owner as stated: Counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PRV PQ-4 (`functions/privacy.md`): Does a right to correct reach a letter's raw transcript, or a From name that is insert-only today? Default: The raw transcript stays as the record of what was heard and is never changed; the author corrects the final text; the From name becomes correctable by its author Number: needs a number from legal FOUNDER-ANSWERED 20 Nov, default accepted (CL-081, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement

**QI-41** Does a separate consent apply before the first invite shares earlier letters that may mention health?

- Owner as stated: Counsel. Counsel numbers: Q48. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PRV PQ-9 (`functions/privacy.md`): Does a separate consent apply before the first invite shares earlier letters that may mention health? Default: No second consent; the invite sheet's line (FR-PRV-32); one tap at the first share is ready if counsel says yes Number: Q48 (D-050) FOUNDER-ANSWERED 20 Nov, default accepted (CL-081, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- FRs cited: PRV-32

**QI-42** Sign-in codes as sensitive personal information

- Owner as stated: Counsel. Counsel numbers: Q56. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PRV PQ-12 (`functions/privacy.md`): Sign-in codes as sensitive personal information Default: Treat as sensitive; never logged (FR-PRV-27) Number: Q56 FOUNDER-ANSWERED 20 Nov, default accepted (CL-081, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- FRs cited: PRV-27

**QI-43** Sealed letters and minors: may a letter be hidden until a day in the child's minority or adulthood with no delivery by us? Does "open at 18" wording, or any later reading by the grown child, create a duty to deliver, verify age or obtain consent? Who may open a sole author's sealed letter after death or incapacity?

- Owner as stated: counsel. Counsel numbers: Q49. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LEG L-2 (`functions/legal.md`): Sealed letters and minors: may a letter be hidden until a day in the child's minority or adulthood with no delivery by us? Does "open at 18" wording, or any later reading by the grown child, create a duty to deliver, verify age or obtain consent? Who may open a sole author's sealed letter after death or incapacity? Default: Ordinary dates only, latest the 25th birthday, no age wording, no delivery, deleted with the account (D6); no fiduciary clause yet Number: needs a number from legal; with Q49

**QI-44** A sealed letter and a court order or custody dispute: may the author hide a letter from the other parent (B8), and what do we do with an order for a hidden letter?

- Owner as stated: counsel. Counsel numbers: Q50. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LEG L-3 (`functions/legal.md`): A sealed letter and a court order or custody dispute: may the author hide a letter from the other parent (B8), and what do we do with an order for a hidden letter? Default: Yes, the author may hide; orders handled under the Q50 runbook; the hiding does not change what we hand over Number: Q50

**QI-45** Shared letter: is a parent sending a picture of their child, or a letter naming another adult, through their own share sheet outside our collection and responsibility, as with Export?

- Owner as stated: counsel. Counsel numbers: Q45, Q48. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LEG L-4 (`functions/legal.md`): Shared letter: is a parent sending a picture of their child, or a letter naming another adult, through their own share sheet outside our collection and responsibility, as with Export? Default: Same as Export: the parent's own act; we collect nothing; the picture toggle off by default; flag off in production until the read is on record Number: Q45, Q48

**QI-46** Is the NX-33 label line above the photo picker, and the "Pictures stay on this phone" claim, accurate and sufficient?

- Owner as stated: counsel. Counsel numbers: Q43. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LEG L-5 (`functions/legal.md`): Is the NX-33 label line above the photo picker, and the "Pictures stay on this phone" claim, accurate and sufficient? Default: Line absent until read; claim used only while NS-01-R15, R26, R61 pass on the candidate Number: Q43

**QI-47** Printable PDF: are OFL fonts embedded in a parent's PDF, printed by a print shop of the parent's choice, within Terms 5.6 "personal and family use", or should 5.6 name print shops?

- Owner as stated: founder, counsel. Counsel numbers: Q12. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LEG L-10 (`functions/legal.md`): Printable PDF: are OFL fonts embedded in a parent's PDF, printed by a print shop of the parent's choice, within Terms 5.6 "personal and family use", or should 5.6 name print shops? Default: Add "including through a print shop you choose" to 5.6; OFL allows the embedding [S5] Number: Q12 (IP), counsel confirms

**QI-48** Should Save a copy and the printable book ask for the owner check when App lock is off?

- Owner as stated: founder; counsel to confirm the step does not conflict with LEGAL-REQ-040 CLOSED 20 Nov, see GAP-LOG Closures CL-068. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- SEC Q-S2 (`functions/risk-security.md`): Should Save a copy and the printable book ask for the owner check when App lock is off? Default: No. Keep as built (ask only with App lock) and add the FR-SEC-08 line. Export is never gated (LEGAL-REQ-040), and an owner check is not a gate, but it adds a step where none is required. Erase and Delete do get the check (FR-SEC-06)
- FRs cited: SEC-06, SEC-08

**QI-49** Is a join by the wrong adult through a forwarded invite link a security incident needing notice, or a support case?

- Owner as stated: counsel Q23, Q50 FOUNDER-ANSWERED 20 Nov, default accepted (CL-071, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement. Counsel numbers: Q23, Q50. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- SEC Q-S6 (`functions/risk-security.md`): Is a join by the wrong adult through a forwarded invite link a security incident needing notice, or a support case? Default: Support case with the 72-hour undo, logged as a security event; counsel must confirm

**QI-50** Do we send any invite email (C-2)?

- Owner as stated: founder; counsel must confirm provider and consent effect (needs a number from legal). Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- MSG Q-MSG-3 (`functions/messaging-and-entry-points.md`): Do we send any invite email (C-2)? Default: No. The parent shares the link from their own messages FOUNDER-ANSWERED 20 Nov, default accepted (CL-063, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement

**QI-51** Deletion page: build `/delete-account` from counsel's draft, or keep the content inside the Privacy Policy (C-3)?

- Owner as stated: founder, counsel must confirm (needs a number from legal). Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- MSG Q-MSG-5 (`functions/messaging-and-entry-points.md`): Deletion page: build `/delete-account` from counsel's draft, or keep the content inside the Privacy Policy (C-3)? Default: Build the page: it is where a person who lost the phone and the `deletion-confirm` email land; the in-app route stays primary FOUNDER-ANSWERED 20 Nov, default accepted (CL-063, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement

**QI-52** May the founder tell families that deleted items might reappear after a restore?

- Owner as stated: counsel Q51 FOUNDER-ANSWERED 20 Nov, default accepted (CL-091, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: sealed key sheet holder, Vercel plan check, counsel engagement. Counsel numbers: Q51. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- REL Q-REL-7 (`functions/reliability.md`): May the founder tell families that deleted items might reappear after a restore? Default: Yes, in the incident message only, not in the policy (`privacy.md` PQ-10); counsel must confirm

**QI-53** Is Vercel Hobby acceptable for a commercial site?

- Owner as stated: founder; counsel must confirm FOUNDER-ANSWERED 20 Nov, default accepted (CL-091, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: sealed key sheet holder, Vercel plan check, counsel engagement. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- REL Q-REL-8 (`functions/reliability.md`): Is Vercel Hobby acceptable for a commercial site? Default: UNVERIFIED (the page read does not say). Confirm the plan; finance assumes Pro ($20)

**QI-54** Is the age stop's clock a compliance issue?

- Owner as stated: counsel; needs a number from legal FOUNDER-ANSWERED 20 Nov, default accepted (CL-091, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: sealed key sheet holder, Vercel plan check, counsel engagement. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- REL Q-REL-9 (`functions/reliability.md`): Is the age stop's clock a compliance issue? Default: Ask compliance to read FR-REL-58
- FRs cited: REL-58

**QI-55** Counsel: does the EU AI Act reach this app, and is a transcription that never adds words outside Article 50's marking duty (S3 carve-out for assistive standard editing)?

- Owner as stated: Counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- AIS AQ-6 (`functions/ai-and-speech.md`): Counsel: does the EU AI Act reach this app, and is a transcription that never adds words outside Article 50's marking duty (S3 carve-out for assistive standard editing)? Default: Needs a number from legal; reading in FR-AIS-46; do not publish an EU statement until answered FOUNDER-ANSWERED 20 Nov, default accepted (CL-095, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- FRs cited: AIS-46

**QI-56** Counsel: do biometric laws (BIPA, Texas, Washington) or CCPA reach a pipeline that turns a voice into text and keeps no voice template, and does a speech model's temporary embedding count?

- Owner as stated: Counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- AIS AQ-7 (`functions/ai-and-speech.md`): Counsel: do biometric laws (BIPA, Texas, Washington) or CCPA reach a pipeline that turns a voice into text and keeps no voice template, and does a speech model's temporary embedding count? Default: Needs a number from legal; meanwhile no voiceprint, no speaker identification, no diarization (FR-AIS-45) FOUNDER-ANSWERED 20 Nov, default accepted (CL-095, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- FRs cited: AIS-45

**QI-57** Counsel: advertising law on any accuracy claim (FR-AIS-48)

- Owner as stated: Counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- AIS AQ-9 (`functions/ai-and-speech.md`): Counsel: advertising law on any accuracy claim (FR-AIS-48) Default: Needs a number from legal; no accuracy claim until answered FOUNDER-ANSWERED 20 Nov, default accepted (CL-095, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- FRs cited: AIS-48

**QI-58** Is a server transcription path ever wanted (older phones, a re-run)?

- Owner as stated: Founder, security-architect, counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- AIS AQ-10 (`functions/ai-and-speech.md`): Is a server transcription path ever wanted (older phones, a re-run)? Default: No for 1.0 (X2); revisit only with a measured need and the full Shown, Records, Never and Decline set CLOSED 20 Nov, see GAP-LOG Closures CL-094

**QI-59** Counsel: does asking an expecting parent to take part, even by yes or no, touch information that needs more care?

- Owner as stated: counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- RSH RQ-6 (`functions/research-validation.md`): Counsel: does asking an expecting parent to take part, even by yes or no, touch information that needs more care? Default: Needs a number from legal. Default: yes or no only, nothing kept, FR-RSH-23. I did not verify Apple's or any regulator's treatment of pregnancy information; the privacy review reports Apple lists it as sensitive info (privacy.md line 40, second-hand) FOUNDER-ANSWERED 20 Nov, default accepted (CL-075, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- FRs cited: RSH-23

**QI-60** The alpha families used builds that are a different app from the store app. Do they keep the alpha app (updated in place, data stays), or move to the store app (starting empty, books on staging not carried)? What happens to their books on staging when the alpha ends: moved to production, or deleted after a notice and a Save a copy?

- Owner as stated: founder. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LCY LQ-1 (`functions/lifecycle-and-platforms.md`): The alpha families used builds that are a different app from the store app. Do they keep the alpha app (updated in place, data stays), or move to the store app (starting empty, books on staging not carried)? What happens to their books on staging when the alpha ends: moved to production, or deleted after a notice and a Save a copy? Default: Alpha families stay on the alpha app until each says otherwise; the store app starts clean for them; staging is kept until each family has a Save a copy and a dated notice, then retired; the decision is recorded in `DECISIONS.md` Number: needs a number from legal for any duty to them as users FOUNDER-ANSWERED 20 Nov, default accepted (CL-077): Default: tell them before build; founder gift decision. Decision made, action pending founder hands: tell the alpha families, gift decision

**QI-61** Alpha testers with more kept letters than the allowance: give them anything?

- Owner as stated: founder, counsel. Counsel numbers: Q40. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LCY LQ-7 (`functions/lifecycle-and-platforms.md`): Alpha testers with more kept letters than the allowance: give them anything? Default: Tell them before the build; change nothing in the ledger; a Plus offer code is a founder gift decision, outside the app Number: Q40 FOUNDER-ANSWERED 20 Nov, default accepted (CL-079, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement

**QI-62** Ordinary hand-on: is "Save a copy, given on" enough for a grown child, with no delivery by us, no age trigger and no account for {child}?

- Owner as stated: founder, counsel. Counsel numbers: Q45. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LCY LQ-8 (`functions/lifecycle-and-platforms.md`): Ordinary hand-on: is "Save a copy, given on" enough for a grown child, with no delivery by us, no age trigger and no account for {child}? Default: Yes Number: needs a number from legal; with L-2 and Q45 FOUNDER-ANSWERED 20 Nov, default accepted (CL-079, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement

**QI-63** Death or inability to act: a clause, or a runbook only? Who may receive one export of a sole parent's book, on what documents, and what do we say to the family on day one?

- Owner as stated: counsel. Counsel numbers: Q49. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LCY LQ-9 (`functions/lifecycle-and-platforms.md`): Death or inability to act: a clause, or a runbook only? Who may receive one export of a sole parent's book, on what documents, and what do we say to the family on day one? Default: No clause; a counsel-read runbook before outside families sign in; one export, never an account takeover, only after documents counsel names Number: Q49, support Q-SUP-10 FOUNDER-ANSWERED 20 Nov, default accepted (CL-079, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement

**QI-64** Inactive accounts: confirm "no automatic deletion in v1" against storage limits

- Owner as stated: counsel. Counsel numbers: Q51. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- LCY LQ-10 (`functions/lifecycle-and-platforms.md`): Inactive accounts: confirm "no automatic deletion in v1" against storage limits Default: Keep as is; revisit at the first real inactive account Number: data policy OQ-11, Q51 FOUNDER-ANSWERED 20 Nov, default accepted (CL-079, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement

**QI-65** Price and shipping: $59 first copy with US shipping, $39 each extra (BK-14 [R])

- Owner as stated: founder, CFO. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PRT Q-PRT-4 (`functions/print-and-fulfilment.md`): Price and shipping: $59 first copy with US shipping, $39 each extra (BK-14 [R]) Default: Do not fix any price until a real wholesale quote and card fee are in section 3.4; price shown all-in with tax visible Number: needs a number from legal (SB 478, UNVERIFIED) CLOSED 20 Nov, see GAP-LOG Closures CL-097

**QI-66** Is the FTC Mail Order Rule (S2) applicable to a personalised book; what must the Print Terms and delay notices say?

- Owner as stated: counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PRT Q-PRT-5 (`functions/print-and-fulfilment.md`): Is the FTC Mail Order Rule (S2) applicable to a personalised book; what must the Print Terms and delay notices say? Default: Assume it applies; build to its notice and refund timing Number: needs a number from legal CLOSED 20 Nov, see GAP-LOG Closures CL-097

**QI-67** Is the other parent asked before their in-book letters are printed in a book the first parent buys?

- Owner as stated: founder, counsel. Counsel numbers: Q30. Due: before their in-book letters are printed in a book the first parent buys? (stated in the question).
- PRT Q-PRT-7 (`functions/print-and-fulfilment.md`): Is the other parent asked before their in-book letters are printed in a book the first parent buys? Default: Notice, not approval (FR-PRT-37) Number: Q30 (printed books row); Terms 7.1 CLOSED 20 Nov, see GAP-LOG Closures CL-097
- FRs cited: PRT-37

**QI-68** Does a printed book named for a baby bring any children's-product or labelling rules (CPSIA, ink and materials); and is the PCI level SAQ A with a hosted page (CR-054)?

- Owner as stated: counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PRT Q-PRT-8 (`functions/print-and-fulfilment.md`): Does a printed book named for a baby bring any children's-product or labelling rules (CPSIA, ink and materials); and is the PCI level SAQ A with a hosted page (CR-054)? Default: Counsel to answer; assume none until told Number: needs a number from legal CLOSED 20 Nov, see GAP-LOG Closures CL-097

**QI-69** Emoji and unusual characters in letters: print a blank, or bundle an OFL emoji face for print?

- Owner as stated: founder, content. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PRT Q-PRT-9 (`functions/print-and-fulfilment.md`): Emoji and unusual characters in letters: print a blank, or bundle an OFL emoji face for print? Default: Blank with a choice to change the letter themselves; no automatic substitution Number: needs a number from legal for the face licence CLOSED 20 Nov, see GAP-LOG Closures CL-097

**QI-70** Where does the partner keep and delete our file, who at the partner can see it, and is the partner a processor or an independent controller (data-policy line 170)?

- Owner as stated: counsel, CLO. Counsel numbers: Q11. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PRT Q-PRT-12 (`functions/print-and-fulfilment.md`): Where does the partner keep and delete our file, who at the partner can see it, and is the partner a processor or an independent controller (data-policy line 170)? Default: Processor, with deletion after shipping; if the partner will not accept that, it is not the partner Number: Q11 CLOSED 20 Nov, see GAP-LOG Closures CL-097

**QI-71** [RULED DL-8] May the library offer days of a religion without a member of that community reviewing them?

- Owner as stated: Founder, counsel CLOSED 20 Nov, see GAP-LOG Closures CL-087. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- DAY Q-DAY-9 (`functions/days-library.md`): May the library offer days of a religion without a member of that community reviewing them? Default: No: a reviewer from each of the six biggest groups reads the tradition's rows and names before ship; costs a small fee or a volunteer; a family can always add their own
- Ruled DL-8 (GAP-LOG): a member of each tradition reviews its rows before ship.

**QI-72** Licence of the sources (FR-DAY-23)

- Owner as stated: Counsel (needs a number from legal) FOUNDER-ANSWERED 20 Nov, default accepted (CL-088, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- DAY Q-DAY-10 (`functions/days-library.md`): Licence of the sources (FR-DAY-23) Default: Compute rule-based dates; license or cite each table; counsel confirms
- FRs cited: DAY-23

**QI-73** Is the list left out of Save a copy (default)?

- Owner as stated: Founder, counsel. Counsel numbers: Q55. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- CUL CUL-Q5 (`functions/cultural-background-data.md`): Is the list left out of Save a copy (default)? Default: Yes, left out; one line says so Number: needs a number from legal (near Q55, access)

**QI-74** Do we leave the privacy label's answer as "not collected" for this data, relying on the on-device rule (S1), and do we add the Privacy Policy sentence?

- Owner as stated: Counsel, legal. Counsel numbers: Q57. Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- CUL CUL-Q7 (`functions/cultural-background-data.md`): Do we leave the privacy label's answer as "not collected" for this data, relying on the on-device rule (S1), and do we add the Privacy Policy sentence? Default: Yes to both; the label is re-run per build (FR-CUL-23) Number: Q57(f)-adjacent: needs a number from legal
- FRs cited: CUL-23

**QI-75** (a) The Developer Program License Agreement duties on suggestion data (A2 links to it; not read). (b) Whether using the picker changes the Apple privacy label or App Review notes (5.1.1(iii)). (c) Whether the wording above the picker counts as a notice under any law the packet lists. (d) Level 3: a library permission for a child's pictures (COPPA-style readings; the privacy review's S5 says a child's image is personal information when collected online; we collect nothing today)

- Owner as stated: counsel. Counsel numbers: none cited (a source may say "needs a number from legal"). Due: proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds.
- PHS Counsel (new, needs a number from legal) (`functions/photos-and-suggestions.md`): (a) The Developer Program License Agreement duties on suggestion data (A2 links to it; not read). (b) Whether using the picker changes the Apple privacy label or App Review notes (5.1.1(iii)). (c) Whether the wording above the picker counts as a notice under any law the packet lists. (d) Level 3: a library permission for a child's pictures (COPPA-style readings; the privacy review's S5 says a child's image is personal information when collected online; we collect nothing today) Default: Counsel must confirm; defaults as above

### 4.2 Founder (and other owner) questions

**QI-76** [RULED K8] When production moves to Supabase Pro

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- FIN F1 (`functions/finance.md`): When does production move to Supabase Pro ($25 a month, $300 a year)? Default: Stay on Free (D-159) (recommendation: At 60% of any Free limit on the weekly check, or before any backup flip. Keep the spend cap on)
- OPS Q1 (`functions/operations.md`): When a Free quota passes 80%, move to Pro for that month? Default: Yes, same week, because after the first grace period Supabase gives no second one (billing FAQ, 20 Nov). Pro's price was not read this session: read it on the day
- Ruled K8 (GAP-LOG): paid-tier triggers: ask the founder at 60% of a limit, move at 80%.

**QI-77** [RULED K8] EAS Starter in a heavy month

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- FIN F6 (`functions/finance.md`): EAS Starter Default: Stay on Free (D-092) (recommendation: Batch native changes; upgrade only for a month that needs it)
- OPS Q3 (`functions/operations.md`): EAS Starter in a heavy month Default: Yes for any month past 12 planned builds (D-092 already allows it)
- Ruled K8 (GAP-LOG): paid-tier triggers: ask the founder at 60% of a limit, move at 80%.

**QI-78** [RULED K8] Resend before a public launch

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- FIN F7 (`functions/finance.md`): Resend Pro Default: Stay on Free (recommendation: Upgrade before a public launch day if 100 a day could be reached)
- OPS Q2 (`functions/operations.md`): Resend at public launch Default: Stay on Free until expected email sign-ins pass 50 a day (half the 100-a-day cap), then a paid tier; paid prices not read this session
- Ruled K8 (GAP-LOG): paid-tier triggers: ask the founder at 60% of a limit, move at 80%.

**QI-79** Which test phones exist

- Owner as stated: founder; not stated (read as founder); founder FOUNDER-ANSWERED 20 Nov, default accepted (CL-090, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: monthly second backup copy, second-provider status page, second contact route, borrow a phone. Due: before the first run sheet (stated); before the first run sheet of the pack (stated).
- FIN F2 (`functions/finance.md`): Which phones do you hold (SE 3, iOS 17, a second phone, an iPad)? Default: Buy nothing; iPad rows on the simulator; second-phone rows stay off in production (recommendation: Name them before the first run sheet; buy a used SE 3 only if none is held)
- OPS Q11 (`functions/operations.md`): Which test phones exist Default: The founder lists them before the first run sheet of the pack; missing rows are waivers in the build record
- QAL Q1 (`functions/quality.md`): Which phones does the founder hold, and will he buy or borrow one on iOS 17 and one on iOS 26 or later? (14 s5: not recorded; spend is his call) Default: Use the SE 3 and one current phone daily (as DEVICE_TEST_PLAN says), borrow an iOS 17 phone; until a pass has a phone it is "not run" and G4 does not pass
- REL Q-REL-6 (`functions/reliability.md`): Buy or borrow a 3 GB class phone for the Tier B spot run? Default: Borrow if possible; otherwise a waiver line, never for a lost letter

**QI-80** What a support or takeover reply may promise about time

- Owner as stated: Founder; founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- BKO Q-BKO-2 (`functions/back-office.md`): May a takeover reply promise a time? BL-598 says 4 hours. Default: No published time. Internal target "same day". Reword BL-598's acceptance line to "within 4 hours of the founder reading the report". Counsel must confirm that no speed appears in Terms or Privacy FOUNDER-ANSWERED 20 Nov, default accepted (CL-066, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: two offline key copies, abuse@ alias, counsel second reader
- MSG Q-MSG-6 (`functions/messaging-and-entry-points.md`): What reply time do we promise at `hello@`? Default: "Within 2 working days", only if a person reads it each working day FOUNDER-ANSWERED 20 Nov, default accepted (CL-065, default as stated in the row and in GAP-LOG Closures)

**QI-81** Which languages the first store build promises, and the order after it

- Owner as stated: Founder; not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- AIS AQ-2 (`functions/ai-and-speech.md`): Which languages are promised for 1.0: English only, or more? A language needs a recorded gate, a native sign-off, a hosted model and a licence record Default: English only until another passes all four; one language at a time (FR-AIS-11, 23, finance FR-FIN-20) CLOSED 20 Nov, see GAP-LOG Closures CL-094
- LOC Q-LOC-1 (`functions/languages-and-localisation.md`): Which language unlocks second, third and so on? Default: Spanish, Portuguese, French, Mandarin, Hindi, Arabic, one at a time (FR-LOC-06). The founder may put his own families first; the order is never promised to a parent. CLOSED 20 Nov, see GAP-LOG Closures CL-098
- FRs cited: FIN-20, LOC-06, AIS-11, AIS-23

**QI-82** [RULED N-1, DL-5] Variants per grid cell and per day

- Owner as stated: not stated (read as founder); Karma CLOSED 20 Nov, see GAP-LOG Closures CL-085. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- NTC Q-NTC-1 (`functions/notification-catalogue.md`): Variants per grid cell: the founder's 8 to 12, or 6 Default: 6; revisit after the first tester sheet CLOSED 20 Nov, see GAP-LOG Closures CL-040
- NTC Q-NTC-8 (`functions/notification-catalogue.md`): Ship the full set at freeze, or the floor at freeze and the rest in a content drop Default: Floor at freeze, rest as a content drop (Design B already planned this, `NOTIFICATIONS.md:59`) CLOSED 20 Nov, see GAP-LOG Closures CL-041
- DAY Q-DAY-7 (`functions/days-library.md`): Variants per day: 4 and 3 (direction 4.3) against 8 to 12 (N-1) Default: 4 per day and 3 per season; 8 to 12 only for the evening grid
- Ruled N-1 (GAP-LOG): 6 variants per grid cell (one plan holds at most 11 evening nudges, each cell is visited about once); the founder's 8 to 12 applies to the day, season and last-letter layers. Launch floor about 128 variants, filled later in content drops.
- Ruled DL-5 (GAP-LOG): 4 variants per day and 3 per season (a day recurs once a year).

**QI-83** [PARTLY RULED DL-9: DAY Q-DAY-12] What "East East" meant (Q-FD-1)

- Owner as stated: Founder; Founder FOUNDER-ANSWERED 20 Nov, default accepted (CL-089): Culture group not religion; same plain-words ask as Q-FD-1. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- CUL CUL-Q1 (`functions/cultural-background-data.md`): What does "East East" mean (Q-FD-1)? Default: There is no such option. "Another tradition" and "Not now" cover it; "Prefer not to say" is the same as "Not now"
- DAY Q-DAY-12 (`functions/days-library.md`): Q-FD-1 "East East": if the founder meant "East Asian", that is a culture or origin group, not a religion, and its days (Lunar New Year, Lantern, Mid-Autumn, Chuseok, Dragon Boat) are in the culture-led group above and need no religion answer Default: Treat "East Asian" as a region choice only if the founder confirms; otherwise stay with "Prefer not to say"
- Ruled DL-9 (GAP-LOG): "East East" may mean East Asian, a culture or origin group, not a religion; the founder confirms (Q-FD-1). The library offers Lunar New Year, Mid-Autumn and Norooz as culture-led days.

**QI-84** Do we state a response time for ordinary support (not data requests)?

- Owner as stated: founder CLOSED 20 Nov, see GAP-LOG Closures CL-099. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- SUP Q-SUP-2 (`functions/support.md`): Do we state a response time for ordinary support (not data requests)? Default: No public time. Data requests keep Privacy 10's 45 days

**QI-85** Support in languages other than English?

- Owner as stated: founder CLOSED 20 Nov, see GAP-LOG Closures CL-099. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- SUP Q-SUP-3 (`functions/support.md`): Support in languages other than English? Default: English only at 1.0. The help centre says so once

**QI-86** May the Help mail subject carry the app version and build (not an id), to save a question?

- Owner as stated: founder, `privacy` CLOSED 20 Nov, see GAP-LOG Closures CL-099. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- SUP Q-SUP-12 (`functions/support.md`): May the Help mail subject carry the app version and build (not an id), to save a question? Default: No. Ask for the version in the reply (M20)

**QI-87** Pictures in NS-01 store art: illustration or licensed photography?

- Owner as stated: Founder (spend if licensed). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- MKT MQ-6 (`functions/marketing.md`): Pictures in NS-01 store art: illustration or licensed photography? Default: Illustration (no likeness, no release, no spend); never an AI-generated photo of a child

**QI-88** Rating request: when may Apple's prompt be called?

- Owner as stated: Founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- MKT MQ-7 (`functions/marketing.md`): Rating request: when may Apple's prompt be called? Default: FR-MKT-23 as written; first request no earlier than the second kept letter
- FRs cited: MKT-23

**QI-89** The welcome email renders the D-118 name from `site.ts` into a separate surface. Does D-118 cover the email?

- Owner as stated: Founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- MKT MQ-10 (`functions/marketing.md`): The welcome email renders the D-118 name from `site.ts` into a separate surface. Does D-118 cover the email? Default: No: the email uses Asha

**QI-90** Add any keyword for photos, Find or Share when they ship?

- Owner as stated: Founder (keyword field as submitted). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- MKT MQ-11 (`functions/marketing.md`): Add any keyword for photos, Find or Share when they ship? Default: No keyword added for them; language names only when shipped

**QI-91** Ever block an old app version?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- OPS Q5 (`functions/operations.md`): Ever block an old app version? Default: No in the 1.0.x line: a line in Me only; servers stay compatible with every live build

**QI-92** The seventh flip condition (copy of the Storage objects)

- Owner as stated: founder with security-architect. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- OPS Q6 (`functions/operations.md`): The seventh flip condition (copy of the Storage objects) Default: No flip until a copy job of the encrypted `entry-audio` objects to a second store exists, with a monthly restore check

**QI-93** Re-enable `agents.yml`

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- OPS Q10 (`functions/operations.md`): Re-enable `agents.yml` Default: Keep it disabled until open agent PRs are under `max_open_agent_prs` (66 against 10 today) or the cap is raised by the founder; ops changes nothing

**QI-94** Second languages

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- FIN F3 (`functions/finance.md`): Second languages Default: No spend (recommendation: One at a time, after a corpus pre-check)

**QI-95** Proof books

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- FIN F4 (`functions/finance.md`): Proof books Default: No spend (taken 20 Nov) (recommendation: Wait until NS-07 is next in the wave)

**QI-96** Is the website allowed on Vercel Hobby?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- FIN F8 (`functions/finance.md`): Is the website allowed on Vercel Hobby? Default: No change (recommendation: Read Vercel's fair use page; if commercial use needs Pro, decide with that page open)

**QI-97** Is the Small Business Program enrolment approved, and on what date?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- FIN F9 (`functions/finance.md`): Is the Small Business Program enrolment approved, and on what date? Default: Not enrolled (30% in year one) (recommendation: Enrol now if not done; it costs $0 and the rate starts 15 days after the fiscal month of approval)

**QI-98** Billing Grace Period in App Store Connect

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- FIN F10 (`functions/finance.md`): Billing Grace Period in App Store Connect Default: Off (recommendation: On, 16 days, paid renewals only: no lost days of paid service when recovered (V7); trial-to-paid failures excluded)

**QI-99** May the server `insights` aggregates be read in the 1.0 line?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- DAT FQ-01 (`functions/data-and-measurement.md`): May the server `insights` aggregates be read in the 1.0 line? Default: No. The frame does not list them as a source, INSIGHTS_LOOP is superseded for v1.0, what production holds is unknown to sessions, and at C1 size k = 10 suppresses nearly every cell. Revisit after launch with a runbook and audit row (FR-DAT-28)
- FRs cited: DAT-28

**QI-100** [RULED K3] Minimum first-time downloads before the allowance rule fires: 500 (D-125) or 1,000 (F14 6.9)?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- DAT FQ-02 (`functions/data-and-measurement.md`): Minimum first-time downloads before the allowance rule fires: 500 (D-125) or 1,000 (F14 6.9)? Default: 500, the later ruling, with the 95% interval printed beside the point. At 500 the interval around 4% runs 2.3% to 5.7%, so a read near the line is close to a coin toss; the founder sees that before acting
- Ruled K3 (GAP-LOG): pricing allowance rule fires at 500 first-time downloads with the 95% interval shown (D-125); F14 6.9's 1,000 is superseded.

**QI-101** Are offer-code starts excluded from the business number?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- DAT FQ-03 (`functions/data-and-measurement.md`): Are offer-code starts excluded from the business number? Default: Yes; the founder subtracts the codes he gave by hand until ASC's report fields are verified (UNVERIFIED)

**QI-102** Round cadence and length during C1

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- DAT FQ-04 (`functions/data-and-measurement.md`): Round cadence and length during C1 Default: Every 2 weeks, 5 questions at most, Q-NS-1 and Q-FID-1 always

**QI-103** Withdrawal clock for a tester's rows

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- DAT FQ-05 (`functions/data-and-measurement.md`): Withdrawal clock for a tester's rows Default: Deleted within 7 days of the request, dated note

**QI-104** Once a book has a birthday, may the parent clear the due date, or should it clear itself?

- Owner as stated: Founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- PRV PQ-6 (`functions/privacy.md`): Once a book has a birthday, may the parent clear the due date, or should it clear itself? Default: Keep it, with a Clear control in Me; never clear it without the parent Number: none CLOSED 20 Nov, see GAP-LOG Closures CL-082: Keep with Clear control in Me

**QI-105** Leave: ship BL-444 before co-parent is in a store build, or keep the Terms wording "not in the app yet"?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LEG L-9 (`functions/legal.md`): Leave: ship BL-444 before co-parent is in a store build, or keep the Terms wording "not in the app yet"? Default: Keep the 0.9.0 wording in the next Terms version; ship Leave before NS-25's store flag Number: founder decision

**QI-106** When ADR 0031 hides A's book and A can no longer sign in, may the phone owner (device passcode) open a hidden book only to Save a copy?

- Owner as stated: founder CLOSED 20 Nov, see GAP-LOG Closures CL-068. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- SEC Q-S1 (`functions/risk-security.md`): When ADR 0031 hides A's book and A can no longer sign in, may the phone owner (device passcode) open a hidden book only to Save a copy? Default: Yes, only Save a copy, after the owner check and a line naming the risk. It is no weaker than D1, which already lets anyone read a signed-out book, and it keeps the only copy of a voice from being stranded

**QI-107** Fund an independent penetration test before the first person outside the family stores letters on the server?

- Owner as stated: founder (spend) FOUNDER-ANSWERED 20 Nov, default accepted (CL-069, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: pen test spend. Due: before the first person outside the family stores letters on the server (stated).
- SEC Q-S3 (`functions/risk-security.md`): Fund an independent penetration test before the first person outside the family stores letters on the server? Default: Yes, scoped to sign-in, invite links and codes, Edge Functions, RLS and the iOS build; Asha data only. Without it, say plainly that the R-17 review is self-assessed

**QI-108** Bot check on email send (card O-7)

- Owner as stated: founder CLOSED 20 Nov, see GAP-LOG Closures CL-070: Turnstile before public TestFlight link. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- SEC Q-S4 (`functions/risk-security.md`): Bot check on email send (card O-7) Default: Agree with O-7: Turnstile before the public TestFlight link, subprocessor page first, Apple unaffected

**QI-109** May support ever merge two accounts, or move letters from one account to another, for a parent who signed in two different ways?

- Owner as stated: Founder, with `security-architect`. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- BKO Q-BKO-1 (`functions/back-office.md`): May support ever merge two accounts, or move letters from one account to another, for a parent who signed in two different ways? Default: No, never by hand in 1.0. The parent signs in the original way. It would move one account's letters on a stranger's word. Reopen when there is an in-app way to link identities, proved by both sign-ins FOUNDER-ANSWERED 20 Nov, default accepted (CL-066, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: two offline key copies, abuse@ alias, counsel second reader

**QI-110** Set up `abuse@` as an alias to the founder's inbox?

- Owner as stated: Founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- BKO Q-BKO-8 (`functions/back-office.md`): Set up `abuse@` as an alias to the founder's inbox? Default: Yes, with `security@`, when the aliases are made live. Until then the policy and Help say `hello@` only. Liveness UNVERIFIED FOUNDER-ANSWERED 20 Nov, default accepted (CL-066, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: two offline key copies, abuse@ alias, counsel second reader

**QI-111** Is the live DMARC record still `p=none` with reports to `hello@`, and do we move reports to a `dmarc@` inbox now (C-4)?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- MSG Q-MSG-1 (`functions/messaging-and-entry-points.md`): Is the live DMARC record still `p=none` with reports to `hello@`, and do we move reports to a `dmarc@` inbox now (C-4)? Default: Yes: `dmarc@`, stage 1, move on by the clean-report rule FOUNDER-ANSWERED 20 Nov, default accepted (CL-062, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: DMARC record and hello@ and dmarc@ mailboxes

**QI-112** How does the founder reply from `hello@` (which provider), so DMARC and the Apple relay both pass (SECURITY Q4)?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- MSG Q-MSG-2 (`functions/messaging-and-entry-points.md`): How does the founder reply from `hello@` (which provider), so DMARC and the Apple relay both pass (SECURITY Q4)? Default: Reply through a provider that signs with a registered domain, or send replies through Resend; register whatever is chosen FOUNDER-ANSWERED 20 Nov, default accepted (CL-062, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: DMARC record and hello@ and dmarc@ mailboxes

**QI-113** Is the one billing push dropped for v1 (C-1)?

- Owner as stated: founder, Karma. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- MSG Q-MSG-4 (`functions/messaging-and-entry-points.md`): Is the one billing push dropped for v1 (C-1)? Default: Yes. Local plan notice only; push waits for BL-546 CLOSED 20 Nov, see GAP-LOG Closures CL-064

**QI-114** Is a Marketing URL set in App Store Connect, and is it the home page?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- MSG Q-MSG-7 (`functions/messaging-and-entry-points.md`): Is a Marketing URL set in App Store Connect, and is it the home page? Default: Set it to the home page only when the claims are checked (marketing) FOUNDER-ANSWERED 20 Nov, default accepted (CL-065, default as stated in the row and in GAP-LOG Closures)

**QI-115** Does the email font set stay off (EMAIL_IDENTITY 4.5) and the logo stay inline?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- MSG Q-MSG-8 (`functions/messaging-and-entry-points.md`): Does the email font set stay off (EMAIL_IDENTITY 4.5) and the logo stay inline? Default: Yes, keep both off to preserve "no request tells us it was opened" FOUNDER-ANSWERED 20 Nov, default accepted (CL-062, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: DMARC record and hello@ and dmarc@ mailboxes

**QI-116** Time Sensitive interruption level for a restore request, when push is reopened

- Owner as stated: founder, sync. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- MSG Q-MSG-9 (`functions/messaging-and-entry-points.md`): Time Sensitive interruption level for a restore request, when push is reopened Default: Do not ask for it until NS-08 is live and Apple's rule is read FOUNDER-ANSWERED 20 Nov, default accepted (CL-062, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: DMARC record and hello@ and dmarc@ mailboxes

**QI-117** Is clipboard paste after an invite install acceptable in the invite sheet's words, given iOS shows its own paste prompt (UNVERIFIED)?

- Owner as stated: founder, privacy. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- MSG Q-MSG-10 (`functions/messaging-and-entry-points.md`): Is clipboard paste after an invite install acceptable in the invite sheet's words, given iOS shows its own paste prompt (UNVERIFIED)? Default: Yes, only on the person's tap, with one line before it FOUNDER-ANSWERED 20 Nov, default accepted (CL-065, default as stated in the row and in GAP-LOG Closures)

**QI-118** Hindi script default (D-031, listed Open): Devanagari, Roman or automatic

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LOC Q-LOC-2 (`functions/languages-and-localisation.md`): Hindi script default (D-031, listed Open): Devanagari, Roman or automatic Default: Devanagari for Hindi words and Latin for English words, per author, never transliterated (the gate already checks this); the founder rules after the 14-recording experiment results. CLOSED 20 Nov, see GAP-LOG Closures CL-098

**QI-119** Prompts: which language do they show in when a second language is chosen?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LOC Q-LOC-3 (`functions/languages-and-localisation.md`): Prompts: which language do they show in when a second language is chosen? Default: English until a reviewed set exists; then the author's primary spoken language, never a machine translation (FR-LOC-20). CLOSED 20 Nov, see GAP-LOG Closures CL-098
- FRs cited: LOC-20

**QI-120** Should the Book's frame (dateline, labels, cover) follow the spoken language?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LOC Q-LOC-4 (`functions/languages-and-localisation.md`): Should the Book's frame (dateline, labels, cover) follow the spoken language? Default: No at 1.0; English frame with an honest line; a later row with its own reviewer (FR-LOC-13). CLOSED 20 Nov, see GAP-LOG Closures CL-098
- FRs cited: LOC-13

**QI-121** When do interface languages open, and which first?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LOC Q-LOC-5 (`functions/languages-and-localisation.md`): When do interface languages open, and which first? Default: Not before the second speech language ships; Hindi first if opened (BL-321); each its own reviewer and decision. CLOSED 20 Nov, see GAP-LOG Closures CL-098

**QI-122** Who are the native reviewers and what is the budget?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LOC Q-LOC-6 (`functions/languages-and-localisation.md`): Who are the native reviewers and what is the budget? Default: One native parent-reviewer per language for tables, prompts, listing and rules; founder names a role, not a person, in the evidence file; the [E] $1,000 to $1,500 stands until a quote exists. CLOSED 20 Nov, see GAP-LOG Closures CL-098

**QI-123** Is the distress-pattern clinician review (BL-105) a gate for every language, or only English?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LOC Q-LOC-7 (`functions/languages-and-localisation.md`): Is the distress-pattern clinician review (BL-105) a gate for every language, or only English? Default: A gate for each language before any line implies noticing; "If you are struggling" stays for all. CLOSED 20 Nov, see GAP-LOG Closures CL-098

**QI-124** Is an English-only consent, privacy policy and subscription notice enough for a parent in the US storefront who speaks another language?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LOC C-LOC-1 (`functions/languages-and-localisation.md`): Is an English-only consent, privacy policy and subscription notice enough for a parent in the US storefront who speaks another language? Default: Needs a number from legal. Default: English only at 1.0 (US storefront only, LEGAL-REQ-058), with the question asked before any non-English listing or interface. Counsel must confirm.

**QI-125** Who may translate Terms, Privacy and consents, and what makes a translation valid alongside "English controls"?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LOC C-LOC-2 (`functions/languages-and-localisation.md`): Who may translate Terms, Privacy and consents, and what makes a translation valid alongside "English controls"? Default: Needs a number from legal. Default: no translation until counsel provides or approves it; per-locale hash and the English version number. Counsel must confirm.

**QI-126** Does naming a language in the listing, or a locale-specific screenshot, create a claim Apple can test (guideline 2.3.1)?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LOC C-LOC-4 (`functions/languages-and-localisation.md`): Does naming a language in the listing, or a locale-specific screenshot, create a claim Apple can test (guideline 2.3.1)? Default: Packet question via `compliance` (FR-CMP-02). Default: name only languages whose dossier is complete. Counsel must confirm.
- FRs cited: CMP-02

**QI-127** May support translate an incoming message with a tool?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LOC C-LOC-5 (`functions/languages-and-localisation.md`): May support translate an incoming message with a tool? Default: Needs a number from legal. Default: no.

**QI-128** Accept that a lost project means days, not hours, until FR-REL-08 is done, and say nothing public about recovery time?

- Owner as stated: founder FOUNDER-ANSWERED 20 Nov, default accepted (CL-090, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: monthly second backup copy, second-provider status page, second contact route, borrow a phone. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- REL Q-REL-1 (`functions/reliability.md`): Accept that a lost project means days, not hours, until FR-REL-08 is done, and say nothing public about recovery time? Default: Yes. Read the Supabase custom-domain option on the day Pro is considered
- FRs cited: REL-08

**QI-129** Host the status page off Vercel (FR-REL-05)?

- Owner as stated: founder FOUNDER-ANSWERED 20 Nov, default accepted (CL-090, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: monthly second backup copy, second-provider status page, second contact route, borrow a phone. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- REL Q-REL-4 (`functions/reliability.md`): Host the status page off Vercel (FR-REL-05)? Default: Yes, a plain static page on a second provider
- FRs cited: REL-05

**QI-130** Second contact route on another domain (FR-REL-21)?

- Owner as stated: founder FOUNDER-ANSWERED 20 Nov, default accepted (CL-090, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: monthly second backup copy, second-provider status page, second contact route, borrow a phone. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- REL Q-REL-5 (`functions/reliability.md`): Second contact route on another domain (FR-REL-21)? Default: Yes
- FRs cited: REL-21

**QI-131** Do we accept the F05 bars (English, Spanish, French, Portuguese, Mandarin 10%; Hindi 15%; Arabic 20% per dialect group; names 95%; zero phantom words) as the pass line for v1.0, to be re-ruled after the first real run?

- Owner as stated: Founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- AIS AQ-1 (`functions/ai-and-speech.md`): Do we accept the F05 bars (English, Spanish, French, Portuguese, Mandarin 10%; Hindi 15%; Arabic 20% per dialect group; names 95%; zero phantom words) as the pass line for v1.0, to be re-ruled after the first real run? Default: Yes, as proposals; re-rule after the first run (FR-AIS-22). F05 Q2 CLOSED 20 Nov, see GAP-LOG Closures CL-093
- FRs cited: AIS-22

**QI-132** Should a whispered take that the detector drops be a hard stop on shipping a language?

- Owner as stated: Founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- AIS AQ-3 (`functions/ai-and-speech.md`): Should a whispered take that the detector drops be a hard stop on shipping a language? Default: Not a numeric bar until the first measurement; the failure must be visible and recoverable (FR-AIS-25) CLOSED 20 Nov, see GAP-LOG Closures CL-093
- FRs cited: AIS-25

**QI-133** May `speech` add the "Check this" mark (FR-AIS-31) on Review? It adds a surface; the constitution allows it (it marks, never changes)

- Owner as stated: Founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- AIS AQ-4 (`functions/ai-and-speech.md`): May `speech` add the "Check this" mark (FR-AIS-31) on Review? It adds a surface; the constitution allows it (it marks, never changes) Default: No for 1.0. Park as P2; build after the first gate shows what the real doubtful-word rate is CLOSED 20 Nov, see GAP-LOG Closures CL-093
- FRs cited: AIS-31

**QI-134** Mirror the model files on our own host before the store build, at what storage cost (`finance` FR-FIN-08)?

- Owner as stated: Founder. Due: before the store build (stated in the question).
- AIS AQ-11 (`functions/ai-and-speech.md`): Mirror the model files on our own host before the store build, at what storage cost (`finance` FR-FIN-08)? Default: Yes: one extra model copy (574,041,195 bytes) is far inside the free tier the finance row reads; confirm with FR-FIN-08 CLOSED 20 Nov, see GAP-LOG Closures CL-094
- FRs cited: FIN-08

**QI-135** Founder: how do we reach parents the founder does not know?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- RSH RQ-1 (`functions/research-validation.md`): Founder: how do we reach parents the founder does not know? Default: A friend's introduction or a parent group he already belongs to; no paid recruiting tool; no recruiting in the app. If unanswered, S2 and S-B1 to S-B3 run with the founder's list only and every read-out says the group is friendly (FR-DAT-29) CLOSED 20 Nov, see GAP-LOG Closures CL-073
- FRs cited: DAT-29

**QI-136** Founder and counsel: may a session be audio or video recorded?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- RSH RQ-3 (`functions/research-validation.md`): Founder and counsel: may a session be audio or video recorded? Default: No. Notes by code only. Needs a number from legal if ever asked (a baby may be audible; Q45) FOUNDER-ANSWERED 20 Nov, default accepted (CL-075, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement

**QI-137** Founder and counsel: may a relative or co-parent take part directly?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- RSH RQ-4 (`functions/research-validation.md`): Founder and counsel: may a relative or co-parent take part directly? Default: Relay through the parent by default; direct only with the parent's introduction and the relative's own consent (FR-RSH-19). Counsel Q48 for another adult, Q22 for a recipient abroad FOUNDER-ANSWERED 20 Nov, default accepted (CL-075, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement
- FRs cited: RSH-19

**QI-138** Karma: does Review's marking of small fixes make it "a feature that writes" for research purposes?

- Owner as stated: karma. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- RSH RQ-8 (`functions/research-validation.md`): Karma: does Review's marking of small fixes make it "a feature that writes" for research purposes? Default: Yes, excluded from every study; only Q-FID-1 is asked (FR-RSH-16). Karma rules CLOSED 20 Nov, see GAP-LOG Closures CL-076
- FRs cited: RSH-16

**QI-139** Founder: the sequence in F1

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- RSH RQ-9 (`functions/research-validation.md`): Founder: the sequence in F1 Default: Moderated on a founder-owned phone, Asha only, until G0; parents' own builds only after G0 and green P0 tests CLOSED 20 Nov, see GAP-LOG Closures CL-073

**QI-140** Founder: C1 composition. Should at least a third of C1 be people he did not know before?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- RSH RQ-10 (`functions/research-validation.md`): Founder: C1 composition. Should at least a third of C1 be people he did not know before? Default: Yes, if the list allows; otherwise label every number "friendly group" and treat stranger evidence from stage 7 as the first unbiased read CLOSED 20 Nov, see GAP-LOG Closures CL-073

**QI-141** Founder: who runs sessions?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- RSH RQ-11 (`functions/research-validation.md`): Founder: who runs sessions? Default: The founder or a human researcher he names, from my guide; I never speak to participants CLOSED 20 Nov, see GAP-LOG Closures CL-073

**QI-142** Which P0 device rows can never be waived?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- QAL Q2 (`functions/quality.md`): Which P0 device rows can never be waived? Default: The four of 14 s6 plus NS-33-R6, NS-33-R12, NS-40 age gate and stop, and `[X4-R1]` (FR-QAL-23)
- FRs cited: QAL-23

**QI-143** Does the trace ratchet block merges? (`trace.mjs` header: 07 Q8, founder)

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- QAL Q3 (`functions/quality.md`): Does the trace ratchet block merges? (`trace.mjs` header: 07 Q8, founder) Default: Report only until FR-QAL-02 lands, then block only new P0 rows without proof
- FRs cited: QAL-02

**QI-144** A separate e2e Supabase project and a test inbox (a possible vendor or cost)

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- QAL Q4 (`functions/quality.md`): A separate e2e Supabase project and a test inbox (a possible vendor or cost) Default: Founder creates one free-tier project and a mailbox he controls; no real person's address; if refused, J-N30 runs on stand-ins and the email rows stay "not run"

**QI-145** Will the founder ask a person who uses VoiceOver daily to run NS-33-R6 before the first public build, on the Asha install only?

- Owner as stated: not stated (read as founder). Due: before the first public build (stated in the question).
- QAL Q5 (`functions/quality.md`): Will the founder ask a person who uses VoiceOver daily to run NS-33-R6 before the first public build, on the Asha install only? Default: Yes if one can be found; this is a tester arrangement, so it needs a consent text and a number from legal; if not, `qa` and the founder run it eyes-closed with Screen Curtain (EC-10) and the row says who ran it

**QI-146** Who may overrule a severity?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- QAL Q6 (`functions/quality.md`): Who may overrule a severity? Default: Founder, in writing, in the issue

**QI-147** Is a nightly macOS accessibility audit worth its runner cost?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- QAL Q7 (`functions/quality.md`): Is a nightly macOS accessibility audit worth its runner cost? Default: Yes, nightly only; cost UNVERIFIED (not priced here)

**QI-148** Speech fixtures: a synthetic voice or a consenting non-family reader

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- QAL Q8 (`functions/quality.md`): Speech fixtures: a synthetic voice or a consenting non-family reader Default: A reader who has agreed in writing, or a synthetic voice whose licence allows test use; counsel must confirm either

**QI-149** Build "Bring a copy in" (import of a Save a copy file)?

- Owner as stated: founder, `product`. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LCY LQ-2 (`functions/lifecycle-and-platforms.md`): Build "Bring a copy in" (import of a Save a copy file)? Default: Not for the first store release. Reopen if a family cannot move a book any other way, or the closing runbook needs it. If built, verbatim restore only, through `verifyEdits` Number: none CLOSED 20 Nov, see GAP-LOG Closures CL-078

**QI-150** Export split above 2 GB: before pictures are on in production, or later?

- Owner as stated: founder, `product`. Due: before pictures are on in production (stated in the question).
- LCY LQ-3 (`functions/lifecycle-and-platforms.md`): Export split above 2 GB: before pictures are on in production, or later? Default: Before pictures are on in production (it also removes the 3.9 GB ceiling) Number: none CLOSED 20 Nov, see GAP-LOG Closures CL-078

**QI-151** Stay iPhone-only with iPad as a compatibility smoke row, portrait only?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LCY LQ-4 (`functions/lifecycle-and-platforms.md`): Stay iPhone-only with iPad as a compatibility smoke row, portrait only? Default: Yes through the 1.0.x line; no "works on iPad" claim Number: none CLOSED 20 Nov, see GAP-LOG Closures CL-078

**QI-152** Keep iOS 17 as the floor through 1.0.x?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LCY LQ-5 (`functions/lifecycle-and-platforms.md`): Keep iOS 17 as the floor through 1.0.x? Default: Yes Number: D-040 CLOSED 20 Nov, see GAP-LOG Closures CL-078

**QI-153** Server support window for old builds

- Owner as stated: founder, `ops`. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LCY LQ-6 (`functions/lifecycle-and-platforms.md`): Server support window for old builds Default: The current and previous wire version, and any build installable in the last 12 months; additive changes first Number: none CLOSED 20 Nov, see GAP-LOG Closures CL-078

**QI-154** If `.aac` does not play in a browser, may the export carry a lossless rewrap beside the original?

- Owner as stated: Karma, founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LCY LQ-11 (`functions/lifecycle-and-platforms.md`): If `.aac` does not play in a browser, may the export carry a lossless rewrap beside the original? Default: Keep the original byte for byte; add a rewrap only if the browser test fails, and only as an extra file Number: none CLOSED 20 Nov, see GAP-LOG Closures CL-078

**QI-155** Should an account made only with Apple be able to add an email sign-in so it can ever be used on another platform?

- Owner as stated: `security`, founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- LCY LQ-12 (`functions/lifecycle-and-platforms.md`): Should an account made only with Apple be able to add an email sign-in so it can ever be used on another platform? Default: Ask `security` to review before C-39 reopens; not now Number: none CLOSED 20 Nov, see GAP-LOG Closures CL-078

**QI-156** Build the printed book at all, or stay with the free file?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- PRT Q-PRT-1 (`functions/print-and-fulfilment.md`): Build the printed book at all, or stay with the free file? Default: Ship the free file in 1.0; decide at the go/no-go on evidence; do not build ordering before FR-PRT-34 is true Number: none CLOSED 20 Nov, see GAP-LOG Closures CL-097
- FRs cited: PRT-34

**QI-157** Which partner, and may the CBO role request a written quote (a contact, which the CBO role may not do)?

- Owner as stated: founder. Counsel numbers cited: Q11. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- PRT Q-PRT-3 (`functions/print-and-fulfilment.md`): Which partner, and may the CBO role request a written quote (a contact, which the CBO role may not do)? Default: No contact until the founder says so; shortlist Lulu first, Gelato second, from public pages only Number: Q11 for the DPA CLOSED 20 Nov, see GAP-LOG Closures CL-097

**QI-158** Where is the line between a defect (we pay) and the parent's own content (they pay)? And a goodwill allowance?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- PRT Q-PRT-10 (`functions/print-and-fulfilment.md`): Where is the line between a defect (we pay) and the parent's own content (they pay)? And a goodwill allowance? Default: FR-PRT-29 as written; a founder-set goodwill reprint allowance, 1 per 20 orders [A] Number: none CLOSED 20 Nov, see GAP-LOG Closures CL-097
- FRs cited: PRT-29

**QI-159** Are page order and the Year One range (FR-PRT-05, -06) as recommended?

- Owner as stated: founder, product. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- PRT Q-PRT-11 (`functions/print-and-fulfilment.md`): Are page order and the Year One range (FR-PRT-05, -06) as recommended? Default: Oldest first; Before You plus months 0 to 11 Number: none CLOSED 20 Nov, see GAP-LOG Closures CL-097
- FRs cited: PRT-05, PRT-06

**QI-160** Pilot limit: 50 orders a month and a holiday cutoff?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- PRT Q-PRT-13 (`functions/print-and-fulfilment.md`): Pilot limit: 50 orders a month and a holiday cutoff? Default: Yes Number: none CLOSED 20 Nov, see GAP-LOG Closures CL-097

**QI-161** Do the library's two tones (bright, quiet) and the neutral lock-screen rule in 5.1 stand?

- Owner as stated: Karma, founder CLOSED 20 Nov, see GAP-LOG Closures CL-085. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- DAY Q-DAY-1 (`functions/days-library.md`): Do the library's two tones (bright, quiet) and the neutral lock-screen rule in 5.1 stand? Default: Yes

**QI-162** [RULED DL-1] R-FD-3: are Memorial Day and Veterans Day offered?

- Owner as stated: Karma, founder CLOSED 20 Nov, see GAP-LOG Closures CL-086: Offer both quiet, never pre-ticked. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- DAY Q-DAY-2 (`functions/days-library.md`): R-FD-3: are Memorial Day and Veterans Day offered? Default: Offer both with the `quiet` tone and the name only; never pre-ticked. If the founder prefers, offer Veterans Day only and leave Memorial Day to a typed day
- Ruled DL-1 (GAP-LOG): Memorial Day and Veterans Day are offered with the quiet tone, name only, never pre-ticked.

**QI-163** [RULED DL-6] Time of day for a library day

- Owner as stated: Founder CLOSED 20 Nov, see GAP-LOG Closures CL-025. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- DAY Q-DAY-3 (`functions/days-library.md`): Time of day for a library day Default: 09:00 local, the birthday time
- Ruled DL-6 (GAP-LOG): 09:00 local for a library day; one budgeted note a day still holds.

**QI-164** [RULED DL-7] Which countries' national days and country-specific dates ship, and when

- Owner as stated: Founder CLOSED 20 Nov, see GAP-LOG Closures CL-022. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- DAY Q-DAY-4 (`functions/days-library.md`): Which countries' national days and country-specific dates ship, and when Default: US only in the first release; India, Mexico, China, Japan, South Korea, Singapore, Indonesia and Sri Lanka lists (section 4.5) in a later drop, each after its authority is read
- Ruled DL-7 (GAP-LOG): US-only national days at first, others when the founder names a country field in scope (founder).

**QI-165** [RULED DL-2] A birthday and a library day on the same date

- Owner as stated: Karma CLOSED 20 Nov, see GAP-LOG Closures CL-085. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- DAY Q-DAY-5 (`functions/days-library.md`): A birthday and a library day on the same date Default: The birthday is sent; the library day yields
- Ruled DL-2 (GAP-LOG): a birthday wins over a library day on the same date (amends the NS-32 priority list: birthday, then library day, then month, then evening; a typed day the parent typed still ranks first). Two ticked library days on one date give one note naming both after the tap.

**QI-166** Is a regional or sub-community day (Pongal, Onam, Parsi New Year, Norooz) in the first release?

- Owner as stated: Content CLOSED 20 Nov, see GAP-LOG Closures CL-023. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- DAY Q-DAY-8 (`functions/days-library.md`): Is a regional or sub-community day (Pongal, Onam, Parsi New Year, Norooz) in the first release? Default: Yes if its list was read and the parent can move it; no if not

**QI-167** [RULED N-4] May a visible body mention the kind of the last letter ("a picture with it?")

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- NTC Q-NTC-3 (`functions/notification-catalogue.md`): May a visible body mention the kind of the last letter ("a picture with it?") Default: Yes in the body, never in the title; kind is not a name or a faith. Karma may rule it off when names are off, in which case the last-letter layer runs only with names on Superseded by NS-48-R5 on 20 Nov: no "a picture with it?" body. CLOSED 20 Nov, see GAP-LOG Closures CL-040
- Ruled N-4 (GAP-LOG): a visible body may mention the kind of the last letter; a title never does.

**QI-168** Mixed-age siblings with names off

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- NTC Q-NTC-4 (`functions/notification-catalogue.md`): Mixed-age siblings with names off Default: No age questions; the grid runs CLOSED 20 Nov, see GAP-LOG Closures CL-040

**QI-169** Do more variants reduce turn-off?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- NTC Q-NTC-5 (`functions/notification-catalogue.md`): Do more variants reduce turn-off? Default: Hypothesis, test with the tester sheet; ship the floor, measure, then fill CLOSED 20 Nov, see GAP-LOG Closures CL-041

**QI-170** [RULED N-7] Reuse Design B's 87 rows and the "Show celebration names" separate switch (`COPY_INVENTORY.md` recommendation 3) or the direction's single names switch

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- NTC Q-NTC-6 (`functions/notification-catalogue.md`): Reuse Design B's 87 rows and the "Show celebration names" separate switch (`COPY_INVENTORY.md` recommendation 3) or the direction's single names switch Default: One names switch (fewer settings); mine the 87 rows for wording CLOSED 20 Nov, see GAP-LOG Closures CL-040
- Ruled N-7 (GAP-LOG): content mines the existing 87 rows and 174 variants in docs/design/NOTIFICATIONS.md and docs/design/notifications/COPY_INVENTORY.md first; one text per variant with a `{child}` slot, one names switch (the separate "Show celebration names" switch is refused).

**QI-171** [RULED N-5] Exclamation marks in notifications

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- NTC Q-NTC-7 (`functions/notification-catalogue.md`): Exclamation marks in notifications Default: Zero; correct `VOICE.md:70` CLOSED 20 Nov, see GAP-LOG Closures CL-040
- Ruled N-5 (GAP-LOG): zero exclamation marks. VOICE.md line 70 is corrected to match line 160 and the checker.

**QI-172** Age band edges for preterm and corrected age (`NOTIFICATIONS.md` line 57 says a preterm switch is needed for month messages)

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- NTC Q-NTC-9 (`functions/notification-catalogue.md`): Age band edges for preterm and corrected age (`NOTIFICATIONS.md` line 57 says a preterm switch is needed for month messages) Default: Use the age the Book shows; a corrected-age family is a separate ruling CLOSED 20 Nov, see GAP-LOG Closures CL-041

**QI-173** Keep a tradition and a country as stored fields (the founder's ask) or only the days the parent ticks (my recommendation)?

- Owner as stated: Founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- CUL CUL-Q2 (`functions/cultural-background-data.md`): Keep a tradition and a country as stored fields (the founder's ask) or only the days the parent ticks (my recommendation)? Default: Only the ticked days. The field adds nothing the list does not hold, and is one more sensitive value to protect. If the founder wants fields, each gets a registry row and a Clear control, and counsel's answers CUL-Q6 and Q7 gate the flag

**QI-174** [RULED CB-4] At sign-out, clear the store (default) or keep it per account?

- Owner as stated: Founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- CUL CUL-Q3 (`functions/cultural-background-data.md`): At sign-out, clear the store (default) or keep it per account? Default: Clear. Matches reminders and typed days; no cross-account risk; makes Delete account reach every phone
- Ruled CB-4 (GAP-LOG): sign-out clears the store (as NS-13 and NS-18 do); the list is not in Save a copy, with a test that no phone-settings key leaks into the export.

**QI-175** Exclude the store from the iPhone backup (default), or keep it in `scribe.db` and widen the call-out?

- Owner as stated: Founder, privacy. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- CUL CUL-Q4 (`functions/cultural-background-data.md`): Exclude the store from the iPhone backup (default), or keep it in `scribe.db` and widen the call-out? Default: Exclude; the short truthful call-out

**QI-176** Would App Review read an optional faith or origin question as breaching 5.1.1(iii), data minimisation?

- Owner as stated: Founder (Notes for Review). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- CUL CUL-Q8 (`functions/cultural-background-data.md`): Would App Review read an optional faith or origin question as breaching 5.1.1(iii), data minimisation? Default: Describe the field in the Notes (FR-CMP-03). If a reviewer objects, the fallback is to remove the ask card and keep a plain list of days to browse and tick in Me, with no question about the family at all: the same data, no question. UNVERIFIED
- FRs cited: CMP-03

**QI-177** [RULED CB-6] Ask after the first kept letter in a later sitting (default), after the first letter in the same sitting, in first run, or only in Me?

- Owner as stated: Founder (Q-FD-2). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- CUL CUL-Q10 (`functions/cultural-background-data.md`): Ask after the first kept letter in a later sitting (default), after the first letter in the same sitting, in first run, or only in Me? Default: Later sitting; fall back to Me only if more than one tester in five calls the question too personal (FR-CUL-27)
- Ruled CB-6 (GAP-LOG): ask never in first run; after the first kept letter but not in the same sitting; once, "Not now" final for Home, Me > Days stays reachable. No "Eastern" option: "Another tradition" and "Not now" only; several traditions allowed; never prefilled from locale or storefront; country and tradition never suggest each other.
- FRs cited: CUL-27

**QI-178** [RULED CB-2] The yearly store versus NS-18's "no recurring days": rule (a) separate store, or (b) change NS-18 (section 5)?

- Owner as stated: Karma. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- CUL CUL-Q12 (`functions/cultural-background-data.md`): The yearly store versus NS-18's "no recurring days": rule (a) separate store, or (b) change NS-18 (section 5)? Default: (a)
- Ruled CB-2 (GAP-LOG): a chosen day is NOT a typed day. NS-18 says "Not in scope: recurring days, days the app suggests, syncing typed days" and deletes a typed day after delivery. This amends 20-founder-direction section 3.1: the library uses a separate yearly store that feeds the same planner slot and the same one-a-day budget (`libraryDay` source, not a new class; N-2 stands).

**QI-179** Do we want level 2 in the first photo release or after NS-01 reaches `testflight`?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- PHS Q-PHS-1 (`functions/photos-and-suggestions.md`): Do we want level 2 in the first photo release or after NS-01 reaches `testflight`? Default: After NS-01 on `testflight`; the picture flow is proved first CLOSED 20 Nov, see GAP-LOG Closures CL-037

**QI-180** Raise `IOS_DEPLOYMENT_TARGET` from 17.0 to 17.2, or hide the suggestions start on 17.0 and 17.1?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- PHS Q-PHS-2 (`functions/photos-and-suggestions.md`): Raise `IOS_DEPLOYMENT_TARGET` from 17.0 to 17.2, or hide the suggestions start on 17.0 and 17.1? Default: Hide it (keep 17.0). Raising drops phones; no figure read CLOSED 20 Nov, see GAP-LOG Closures CL-037

**QI-181** Does the Journaling Suggestions entitlement need an Apple request?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- PHS Q-PHS-3 (`functions/photos-and-suggestions.md`): Does the Journaling Suggestions entitlement need an Apple request? Default: `mobile` enables it on the test App ID in step 1 of the spike and reports; if it needs approval, `founder` files it FOUNDER-ANSWERED 20 Nov, default accepted (CL-042): Same as Q-FD-11. Decision made, action pending founder hands: Apple entitlement request if the portal needs one

**QI-182** Apple's notifications (iOS 26 and later) open our app: yes, in a second step, or never in 1.x?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- PHS Q-PHS-4 (`functions/photos-and-suggestions.md`): Apple's notifications (iOS 26 and later) open our app: yes, in a second step, or never in 1.x? Default: Second step, after the spike; not in the first level 2 build CLOSED 20 Nov, see GAP-LOG Closures CL-043

**QI-183** May the suggestion's `title` appear as an editable label above the picture?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- PHS Q-PHS-5 (`functions/photos-and-suggestions.md`): May the suggestion's `title` appear as an editable label above the picture? Default: Yes, as Apple's text, editable and clearable, never prefilled into the letter's words (FR-PHS-14) CLOSED 20 Nov, see GAP-LOG Closures CL-035
- FRs cited: PHS-14

**QI-184** Do we ever read a place, workout or other item from a suggestion?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- PHS Q-PHS-6 (`functions/photos-and-suggestions.md`): Do we ever read a place, workout or other item from a suggestion? Default: No in 1.x CLOSED 20 Nov, see GAP-LOG Closures CL-043

**QI-185** Level 3 spike: run it at all?

- Owner as stated: not stated (read as founder). Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- PHS Q-PHS-7 (`functions/photos-and-suggestions.md`): Level 3 spike: run it at all? Default: No now. If yes, section 6 only; Q-FD-4's default stands CLOSED 20 Nov, see GAP-LOG Closures CL-043

**QI-186** Founder: which two of the five go to a card first?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- OPP OQ-1 (`functions/feature-opportunities.md`): Founder: which two of the five go to a card first? Default: OPP-01 (already NS-49) and OPP-03 (cheapest); decide OPP-02 after the NS-04 result CLOSED 20 Nov, see GAP-LOG Closures CL-058: OPP-01 and OPP-03; OPP-02 after NS-04 result

**QI-187** Founder: may the lock-screen doorway study run before the spike?

- Owner as stated: founder. Due: before the spike? (stated in the question).
- OPP OQ-2 (`functions/feature-opportunities.md`): Founder: may the lock-screen doorway study run before the spike? Default: Yes, the demand question only (section 6.3 b); no build CLOSED 20 Nov, see GAP-LOG Closures CL-059

**QI-188** Founder: is OPP-04 wanted, given the parent holds the phone and the child is not a user?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- OPP OQ-3 (`functions/feature-opportunities.md`): Founder: is OPP-04 wanted, given the parent holds the phone and the child is not a user? Default: Yes, as a prompt set only; no child screen CLOSED 20 Nov, see GAP-LOG Closures CL-059

**QI-189** Founder: is OPP-09 (a next step after Keep) wanted at all?

- Owner as stated: founder. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- OPP OQ-5 (`functions/feature-opportunities.md`): Founder: is OPP-09 (a next step after Keep) wanted at all? Default: No, hold CLOSED 20 Nov, see GAP-LOG Closures CL-059

**QI-190** Karma: does OPP-03 reopen NS-23's slot rule?

- Owner as stated: karma. Due: proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds.
- OPP OQ-6 (`functions/feature-opportunities.md`): Karma: does OPP-03 reopen NS-23's slot rule? Default: No; separate rule, same one-slip limit CLOSED 20 Nov, see GAP-LOG Closures CL-059

### 4.3 Summary

| | Entries |
|---|---|
| Counsel entries | 75 |
| Founder and other-owner entries | 115 |
| With a due date stated in a source | 11 |
| With a proposed due rule only | 179 |
| Ruled in GAP-LOG (every merged question) | 20 |
| Partly ruled | 2 |
| Open | 168 |

## 5. Engineering rows needed

From the engineering section of each function file (section 6 of the first-wave files, section 9 of risk-security, found by heading in the others; days and notifications keep theirs in sections 11 and 8 and 12.3). 249 source rows merge into 226 entries. New rows carry a working handle NR-nn; the backlog id is Karma's to allocate, and none may be above BL-999 (the dispatcher reads only three-digit ids; privacy and the dispatcher note under BL-999 say so). Sizes are given only where the source gave them; splitting into PRs a reviewer can read in ten minutes is for the engineering thread. A later-wave row is classed "new" unless it starts with a BL id, says "change" beside a BL id, or sits in a BL column.

Data's section 6.2 (candidate analytics events) is not an engineering row: none is in the catalogue and adding any is a founder decision while analytics is off (FR-DAT-26), so it is not listed here. Several later files also list sections that are not rows (BKO "Runbook cards that need writing" section 6 is covered by its row "report-a-concern.md ..."; REL and QAL tables of limits and fixtures are inputs to rows). Rows from the photos file that read "Planner change for NS-32: none" and from lifecycle "No row from this file for server migrations" are kept as notes in 5.3.

### 5.1 New rows needed

| Handle | Row | Asked by | Owner as stated | FRs | Existing rows named alongside |
|---|---|---|---|---|---|
| NR-01 (new row needed) | New: Help actions on dead-end screens | support | `mobile`, `content` | SUP-02 | - |
| NR-02 (new row needed) | Pin every support mail target (fixed subject, empty body, no ids) | support, privacy | `qa`, `mobile`; FR-PRV-12 | SUP-03, PRV-12 | - |
| NR-03 (new row needed) | Content-rules scans extended (public-surface forbid list, price pattern, help content) | support, marketing, finance, messaging, quality, notifications | `content`; content | SUP-06, MKT-02, FIN-09, MSG-13 | - |
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
| NR-18 (new row needed) | Weekly Free-limits job reads Storage and egress, and NOT CHECKED fails | operations, finance | ops; `ops` | OPS-12, FIN-03 | - |
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
| NR-32 (new row needed) | Log canary with new-field fixtures (Find queries, labels, From names, typed days, photo paths, suggestion titles, tradition and day keys) | privacy, security, reliability, cultural-data, photos | FR-PRV-10; privacy, qa; privacy, ops; qa | PRV-10, SEC-18, REL-23, REL-24, CUL-04, CUL-07, CUL-08, CUL-10, PHS-51 | - |
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
| NR-57 (new row needed) | `ops_support_summary(p_profile, p_ticket)`: service role only, counts and states only, audit row first, canary test, grant in `grants.mjs` | back-office | `data-architect` | BKO-02 | - |
| NR-58 (new row needed) | Migration (new file) widening the `ops.audit_log` runbook check with `support_lookup`, `account_recovery`, `suspension`, `access_limit`, `kill_switch`, `key_cha [cont. in source] | back-office | `data-architect`, `ops` | BKO-05 | - |
| NR-59 (new row needed) | `ops_limit_member_access` (limit one member's read of one book, reversible, audited, no delete) and its test; sync behaviour for the limited member | back-office | `data-architect`, `sync` | BKO-14, BKO-15 | - |
| NR-60 (new row needed) | `docs/ops/ACCESS.md` and its test (policy sentence versus roles) | back-office | `ops`, `privacy` | BKO-01, BKO-20 | - |
| NR-61 (new row needed) | A claims-registry flag for "every access is logged", false until LEGAL-REQ-025's conditions hold; content scan | back-office | `content`, `legal` | BKO-04 | - |
| NR-62 (new row needed) | Secret-scan and connector rule for agent sessions (list of what an agent job may read) | back-office | `security-architect`, `ops` | OPS-35, BKO-21 | - |
| NR-63 (new row needed) | `report-a-concern.md`, `safety-removal.md`, `account-recovery.md`, `kill-switch-and-pause.md`, `founder-unavailable.md`, `weekly-card.md` (section 6) | back-office | `ops`, `support` | BKO-12, BKO-13, BKO-14, BKO-15, BKO-16, BKO-17, BKO-18, BKO-19, BKO-20, BKO-21, BKO-22, BKO-23, BKO-24, BKO-25 | - |
| NR-64 (new row needed) | Account-act email templates in `packages/emails` | back-office | `emails`, `content` | BKO-27 | - |
| NR-65 (new row needed) | Release gate script: AASA, store URLs, DNS and relay registration evidence (extends BL-510, BL-364, BL-368) | messaging | ops, web | MSG-01, MSG-23, MSG-32 | BL-364, BL-368, BL-510 |
| NR-66 (new row needed) | Resend event receiver in `supabase/functions` with signature check, content-free store, alert; in `DATA_CLASSIFICATION.md` in the same PR | messaging | sync | MSG-06, MSG-07 | - |
| NR-67 (new row needed) | Staging test: does Supabase SMTP surface a suppressed address as an error? | messaging | mobile, ops | MSG-08 | - |
| NR-68 (new row needed) | Test that lists every email template against the catalog table | messaging | mobile | MSG-09 | - |
| NR-69 (new row needed) | `/j` store link in launch mode; Android line on `/open`; `site.ts` copy updates | messaging | web | MSG-26, MSG-27 | - |
| NR-70 (new row needed) | Web pages: `/subscription-terms`, `/delete-account` and `/delete-account/confirm` (after ruling), `/stop` and `/cancel` when their features ship (BL-364 scope) | messaging | web | MSG-34, MSG-35 | BL-364 |
| NR-71 (new row needed) | Runbook "sign-in mail stopped" and renewal calendar | messaging | ops | MSG-15, MSG-38 | - |
| NR-72 (new row needed) | Bounce row in Me account and relay "why you got this" variant | messaging | mobile, content | MSG-05, MSG-07 | - |
| NR-73 (new row needed) | Clipboard paste only on tap, covered by a test (paired with NS-25) | messaging | mobile | MSG-30 | - |
| NR-74 (new row needed) | Device-check task for the founder: the link matrix, a relay address, three real inboxes | messaging | human | MSG-01, MSG-03, MSG-24 | - |
| NR-75 (new row needed) | Language dossier file format and a CI check that fails if `SPOKEN_LANGUAGES` names an incomplete language; extends `npm run gate - [cont. in source] | languages | see source | LOC-01, LOC-03, LOC-26 | - |
| NR-76 (new row needed) | `dates.ts` pins `calendar: 'gregory'` and Latin digits; test over `en-u-ca-*` tags and the device date picker output (ISO Gregoria [cont. in source] | languages | see source | LOC-11, LOC-12 | - |
| NR-77 (new row needed) | Per-language rules file and banned-phrase list loader for the content rules test (English files unchanged) / FR-LOC-19 | languages | see source | LOC-19 | - |
| NR-78 (new row needed) | Per-language distress pattern set, behind a flag per language, with fictional-line tests; or an explicit "not offered" state / FR- [cont. in source] | languages | see source | LOC-18 | - |
| NR-79 (new row needed) | Fonts for Arabic and Chinese in the PDF and the app; fixtures per script; missing-glyph check in the PDF test / FR-LOC-15 | languages | see source | LOC-15 | - |
| NR-80 (new row needed) | Right-to-left state walk on device and its evidence file / FR-LOC-17 | languages | see source | LOC-17 | - |
| NR-81 (new row needed) | Pause and return test for a held language (second account, new phone) / FR-LOC-28 | languages | see source | LOC-28 | - |
| NR-82 (new row needed) | Locale-ready string structure (`strings.<locale>.ts` convention, CLDR plurals through `Intl.PluralRules`, no sentence assembled in [cont. in source] | languages | see source | LOC-10 | - |
| NR-83 (new row needed) | Conflict note screen and wiring of `listConflicts` and `resolveConflict` / FR-REL-45, 47 | reliability | mobile | REL-45, REL-47 | - |
| NR-84 (new row needed) | Backup freshness and second-copy jobs as proposals under `docs/ops/proposed/workflows/` / FR-REL-10, 11, 12 | reliability | ops | REL-10, REL-11, REL-12 | - |
| NR-85 (new row needed) | `restore-drill.ts` canary for post-dump deletions, held drafts and new ledger kinds; 300-phone re-upload script / FR-REL-13, 15 | reliability | ops, data-architect | REL-13, REL-15 | - |
| NR-86 (new row needed) | Daily counts-only server view; outside probe / FR-REL-26, 28 | reliability | data-architect, ops | REL-26, REL-28 | - |
| NR-87 (new row needed) | Pinned API base alternative or Supabase custom domain read / FR-REL-08 | reliability | security-architect | REL-08 | - |
| NR-88 (new row needed) | Timeout and no-network-await test for Tier 0 paths; captive-portal and hung-server stubs / FR-REL-40 to 42 | reliability | mobile | REL-40, REL-41, REL-42 | - |
| NR-89 (new row needed) | Pull-interval floor in remote config / FR-REL-44 | reliability | platform | REL-44 | - |
| NR-90 (new row needed) | Notifications re-planned on first launch after restore; clock and zone device rows / FR-REL-54 to 59 | reliability | mobile, qa | REL-54, REL-55, REL-56, REL-57, REL-58, REL-59 | - |
| NR-91 (new row needed) | New (docs): `INCIDENT.md`, `DEPENDENCIES.md`, `CAPACITY.md`, expiry calendar, Monday read / FR-REL-02, 04, 16, 22, 51 | reliability | ops | REL-02, REL-04, REL-16, REL-22, REL-51 | - |
| NR-92 (new row needed) | BL-new-A | ai-and-speech | speech engineer | AIS-01, AIS-02, AIS-03, AIS-04, AIS-07, AIS-35, AIS-40, AIS-45, AIS-49 | - |
| NR-93 (new row needed) | BL-new-B | ai-and-speech | speech engineer with legal | LEG-13, AIS-09, AIS-10 | - |
| NR-94 (new row needed) | BL-new-C | ai-and-speech | ops with speech engineer; founder uploads | AIS-11, AIS-12, AIS-13 | - |
| NR-95 (new row needed) | BL-new-D | ai-and-speech | speech engineer; ops (proposed file in `docs/ops/proposed/workflows/`) | AIS-15, AIS-39 | - |
| NR-96 (new row needed) | BL-new-E | ai-and-speech | speech engineer, security-architect | AIS-17, AIS-18, AIS-19 | - |
| NR-97 (new row needed) | BL-new-F | ai-and-speech | speech engineer; founder spends | FIN-20, AIS-23 | BL-043 |
| NR-98 (new row needed) | BL-new-G | ai-and-speech | speech engineer; user-research for consent text | AIS-24, AIS-25, AIS-26, AIS-27, AIS-28 | - |
| NR-99 (new row needed) | BL-new-H | ai-and-speech | speech, mobile, design, content | AIS-31, AIS-32 | - |
| NR-100 (new row needed) | BL-new-I | ai-and-speech | speech engineer; ops | AIS-36 | - |
| NR-101 (new row needed) | BL-new-J | ai-and-speech | speech engineer with mobile; the founder's phone | AIS-42, AIS-43 | BL-043 |
| NR-102 (new row needed) | BL-new-K | ai-and-speech | speech engineer, security-architect | AIS-50, AIS-51, AIS-52 | - |
| NR-103 (new row needed) | BL-new-L | ai-and-speech | mobile with speech engineer | AIS-27, AIS-28 | - |
| NR-104 (new row needed) | `user-research`, S, docs only: `docs/research/studies/<id>/` template (PLAN, GUIDE, FINDINGS), the question bank rows for studies  [cont. in source] | research | see source | none cited | - |
| NR-105 (new row needed) | `design-systems`, S: prototype participant mode in each area's `PROTOTYPE.html` (FR-RSH-15). | research | see source | RSH-15 | - |
| NR-106 (new row needed) | `qa`, S: a way to run the flagged build for moderated sessions on a founder-owned phone with the Asha-only install (FR-RSH-03). I  [cont. in source] | research | see source | RSH-03 | - |
| NR-107 (new row needed) | `qa`: confirm the `no-real-family-data` test covers `docs/research/studies/**` (NS-03-R3 relies on it for read-outs). | research | see source | none cited | - |
| NR-108 (new row needed) | Register generator: `p0.py` or a Node port that prints 3a, 3b, 3c and the total (3e) | quality | see source | none cited | - |
| NR-109 (new row needed) | Asha fixture library: one module, generated data, every catalogue entry of Annex E | quality | see source | none cited | - |
| NR-110 (new row needed) | Glass fallback scan (FR-QAL-08) | quality | see source | QAL-08 | - |
| NR-111 (new row needed) | XCUITest accessibility audit target and nightly job (FR-QAL-10) | quality | see source | QAL-10 | - |
| NR-112 (new row needed) | E2E backend project, test inbox and a first-run Maestro set rewritten to card 19's order | quality | see source | none cited | - |
| NR-113 (new row needed) | Kill at each first-run step (FR-QAL-15, J-N34) | quality | see source | QAL-15 | - |
| NR-114 (new row needed) | Evidence-file checker: format, Asha-only, build and iOS recorded, a "not run" status allowed | quality | see source | none cited | - |
| NR-115 (new row needed) | Injected clock for the age stop, trial end and seals on a device build | quality | see source | none cited | - |
| NR-116 (new row needed) | New row: local upgrade fixtures for every shipped `user_version` with Asha data, plus the additive-only scan of `MIGRATIONS` | lifecycle | `mobile`, `qa` | LCY-01, LCY-02 | - |
| NR-117 (new row needed) | New row: older build on a newer file never rewrites unknown columns; round-trip test | lifecycle | `mobile` | LCY-03 | - |
| NR-118 (new row needed) | New row: contract test of every shipped outbox op type against the current client and server | lifecycle | `sync` | LCY-04 | - |
| NR-119 (new row needed) | New row: the `minSupportedVersion` consumer and the E-S16 line (this is G-E03 in `GAP-LOG.md:333`); `SCVER` and `p_api_version` | lifecycle | `mobile`, `sync` | LCY-17, LCY-18 | - |
| NR-120 (new row needed) | New row: claim after a deleted account (owner release or replace after the masked-email tap), with a `security` read | lifecycle | `sync`, `security` | LCY-11, LCY-19 | - |
| NR-121 (new row needed) | New row: device-restore state test (files present, Keychain empty) | lifecycle | `mobile`, `qa` | LCY-09 | - |
| NR-122 (new row needed) | New row: export split by child and year above 2 GB, each part complete; remove the dead-end `tooBig` path | lifecycle | `mobile`, `data-architect` | LCY-21 | - |
| NR-123 (new row needed) | New row: cold-read test of a copy and playback of `.aac` and `.m4a` in `index.html` | lifecycle | `qa` | LCY-20, LCY-22 | - |
| NR-124 (new row needed) | New row: the public export format page, schemas, and sample archive from the CDN | lifecycle | `web`, `legal` | LCY-23 | - |
| NR-125 (new row needed) | New rows (ops): alpha-to-store decision record, staging retirement, TestFlight expiry message, closing runbook | lifecycle | `ops`, `release` | LCY-06, LCY-07, LCY-08, LCY-24 | - |
| NR-126 (new row needed) | New row: content scan for the loss and ending words covers help articles and the website pages that carry lifecycle copy | lifecycle | `content` | LCY-28 | - |
| NR-127 (new row needed) | New row: support window and the previous-build contract test in `packages/api` | lifecycle | `sync` | LCY-18 | - |
| NR-128 (new row needed) | Flag and pause key | print | see source | PRT-01, PRT-41 | BL-973 |
| NR-129 (new row needed) | Order-file builder | print | see source | PRT-05, PRT-06, PRT-07, PRT-08, PRT-09, PRT-10, PRT-11, PRT-12, PRT-13, PRT-42 | - |
| NR-130 (new row needed) | Preview screens | print | see source | PRT-14, PRT-15 | - |
| NR-131 (new row needed) | Order service | print | see source | PRT-26, PRT-27, PRT-28, PRT-29, PRT-30, PRT-31, PRT-32, PRT-33 | - |
| NR-132 (new row needed) | Partner and processor integration | print | see source | PRT-20, PRT-23 | - |
| NR-133 (new row needed) | Hosted checkout and return | print | see source | PRT-19 | - |
| NR-134 (new row needed) | Emails | print | see source | PRT-38 | - |
| NR-135 (new row needed) | Support tooling | print | see source | PRT-40 | - |
| NR-136 (new row needed) | Fonts | print | see source | PRT-10, PRT-11 | - |
| NR-137 (new row needed) | Metrics | print | see source | PRT-44 | - |
| NR-138 (new row needed) | Account deletion | print | see source | PRT-33 | - |
| NR-139 (new row needed) | Add `days` data and the calendar tests (rule dates equal the table for 2026 to 2030, the astronomical instants, no `preTicked`, `n/r` only as a literal) | days | see source | none cited | - |
| NR-140 (new row needed) | Add the planner kind that resolves a ticked day to its next date in the phone's calendar; extend `PlannedKind` beyond evening, monthAge and birthday, with the t [cont. in source] | days | see source | none cited | BL-982 |
| NR-141 (new row needed) | Storage for ticked ids and overrides (phone-only, per account and book; erased by Erase everything; excluded from analytics) | days | see source | none cited | - |
| NR-142 (new row needed) | Resolve an astronomical instant to a local date; hemisphere names | days | see source | none cited | - |
| NR-143 (new row needed) | Table refresh route: bundle in the app and refresh each year with an app update (recommended); a downloadable pack (`packs/` pattern) is the alternative if a mi [cont. in source] | days | see source | none cited | - |
| NR-144 (new row needed) | An annual October review task and its runbook line | days | see source | none cited | - |
| NR-145 (new row needed) | Replace the numeric variant with a key | notifications | see source | none cited | - |
| NR-146 (new row needed) | Break the tie between name rotation and the 8 variants | notifications | see source | none cited | - |
| NR-147 (new row needed) | New planner inputs: `PlanInput` (`planner.ts:66 to 90`) / `lastLetter: { localDate, kind }`, an anchor (NS-13 3a), `chosenDays` (when NS-46 lands), th [cont. in source] | notifications | see source | none cited | - |
| NR-148 (new row needed) | A reader for the last letter's kind | notifications | see source | none cited | - |
| NR-149 (new row needed) | Age band per fire date | notifications | see source | none cited | - |
| NR-150 (new row needed) | Day part filter | notifications | see source | none cited | - |
| NR-151 (new row needed) | Tap payload | notifications | see source | none cited | - |
| NR-152 (new row needed) | Core function | notifications | see source | none cited | - |
| NR-153 (new row needed) | Out of scope for NS-48, but a prerequisite | notifications | see source | none cited | BL-537 |
| NR-154 (new row needed) | core function and tests | notifications | see source | none cited | - |
| NR-155 (new row needed) | content catalogue file and rules test additions (`{day}` slot, shape tag, both renderings) | notifications | see source | none cited | - |
| NR-156 (new row needed) | planner change of section 8 | notifications | see source | none cited | - |
| NR-157 (new row needed) | `lastMadeLetter()` reader | notifications | see source | none cited | - |
| NR-158 (new row needed) | day-part filter and migration of the 8 built variants | notifications | see source | none cited | - |
| NR-159 (new row needed) | tester-sheet row for retirement | notifications | see source | none cited | - |
| NR-160 (new row needed) | Note: `selectNotificationKey` pool for `ntc.pm.*` under `evening`; planner input `momentsKnown` as a boolean per date with no asset data [cont. in source] | notifications | see source | NTC-23, NTC-24, NTC-28 | - |
| NR-161 (new row needed) | New (mobile): The days module with its single store, excluded from backup, per-account scope, sign-out and Erase hooks; registry entry / FR-CUL- [cont. in source] | cultural-data | see source | CUL-01, CUL-02, CUL-06, CUL-15, CUL-16 | - |
| NR-162 (new row needed) | New (mobile, qa): Import-boundary test (one reader); route-registry and error-message scans gain the FR-CUL-04 name list / FR-CUL-11; FR-PRV-11, 13 | cultural-data | see source | PRV-11, PRV-13, CUL-04, CUL-11 | - |
| NR-163 (new row needed) | New (data-architect): Migration lint: no column, view or RPC argument named like tradition, religion, faith, country, origin or culture; no `prompt_key` [cont. in source] | cultural-data | see source | CUL-04, CUL-05 | - |
| NR-164 (new row needed) | New (mobile): Planner: a `libraryDay` slot with one neutral body; no day key in an identifier or `userInfo`; the day-name switch and its app-loc [cont. in source] | cultural-data | see source | CUL-12 | - |
| NR-165 (new row needed) | New (analytics): Allowlist negative test for the FR-CUL-04 names and for any count of these choices / FR-CUL-09 | cultural-data | see source | CUL-04, CUL-09 | - |
| NR-166 (new row needed) | New (mobile): Home `daysAsk` card state and its show rules; Me, Days we mark / FR-CUL-19, 21 | cultural-data | see source | CUL-19, CUL-21 | - |
| NR-167 (new row needed) | New (device walk): J-CUL-01: lock screen, Notification Center, Apple Watch mirror, Focus summary, Show Previews set to Never, App lock on and off, na [cont. in source] | cultural-data | see source | CUL-12 | - |
| NR-168 (new row needed) | `scribe-photo` suggestions module (SwiftUI picker in a hosting controller, `isAvailable()` by OS version, `pickSuggestion()` retur [cont. in source] | photos | mobile | PHS-10, PHS-11, PHS-12, PHS-13, PHS-14, PHS-15, PHS-16, PHS-17, PHS-18, PHS-19, PHS-20 | - |
| NR-169 (new row needed) | Expo config entitlement `com.apple.developer.journal.allow` behind `EXPO_PUBLIC_SUGGESTIONS`; `security` plist and entitlement rev [cont. in source] | photos | mobile, security | none cited | - |
| NR-170 (new row needed) | source scan test that bans any `JournalingSuggestion.*` type other than Photo and LivePhoto and any PhotoKit authorisation, fetch  [cont. in source] | photos | mobile | none cited | - |
| NR-171 (new row needed) | `startCapture` `source` closed list gains `suggestion` (FR-PHS-02); the source is never persisted (FR-PHS-03). Owner `mobile`. | photos | mobile | PHS-02, PHS-03 | - |
| NR-172 (new row needed) | spike SP-PHS-1 and an ADR (section 6). Owner `mobile`, `architect`. | photos | mobile, architect | none cited | - |
| NR-173 (new row needed) | privacy and data rows (FR-PHS-50), claims inventory row, App Review notes (FR-PHS-55). Owner `privacy`, `legal`, `content`. | photos | privacy, legal | PHS-50, PHS-55 | - |
| NR-174 (new row needed) | Note: `content`, S: a prompt set for the child to answer, and the same-question rule's wording (OPP-03, OPP-04). | opportunities | see source | none cited | - |
| NR-175 (new row needed) | Note: `mobile`, S: the prompt-by-date selection rule, pure function, with tests (OPP-03). | opportunities | see source | none cited | - |
| NR-176 (new row needed) | Note: `mobile`, M: Lock Screen control behind a flag, after the NS-04 exit (OPP-02). | opportunities | see source | none cited | - |
| NR-177 (new row needed) | Note: `mobile`, M: bring-in start through the system picker (OPP-05). | opportunities | see source | none cited | - |
| NR-178 (new row needed) | Note: `qa`, S: tests that no offered surface carries a count or an earlier answer's words. | opportunities | see source | none cited | - |

Merged duplicates (same row asked by more than one function): NR-02 = support New: Mail URL test, privacy New (mobile); NR-03 = support New: Help content in the rules scan, marketing Public-surface forbid scan, finance New: price scan in content rules, messaging Export email copy to `rules.test.ts` if it is stil, quality Source scans for the 40 S-kind FR rows, grouped by, notifications Copy home; NR-15 = marketing Store candidate claims diff, compliance New; NR-18 = operations New, finance New: weekly limits job reads Storage and egress; NR-20 = operations New, privacy New (ops, sync); NR-32 = privacy New (qa, platform), security New, reliability New, cultural-data New (qa, platform), photos New.

### 5.2 Existing backlog rows to change

| BL row | Status in BACKLOG.md | What each function asks to add or change | FRs |
|---|---|---|---|
| BL-551 | BL-551 (listed in an older format, or not in BACKLOG.md; see it) | support: Raise in priority: Route 1 and the under-18 promise depend on it (SUP-14, POL-07) | SUP-14, POL-07 |
| BL-552, BL-597, BL-598 | BL-552 (listed in an older format, or not in BACKLOG.md; see it), BL-597 deferred, BL-598 deferred | support: Needed before NS-25 ships (SUP-13) | SUP-13 |
| BL-367 | BL-367 needs-decision | support: Founder decision on the mailbox route and the `privacy@` alias (SUP-23) | SUP-23 |
| BL-783 | BL-783 needs-founder | support: The data-request replies name the path the app shows (SUP-15) | SUP-15 |
| BL-105 | BL-105 deferred | support: Clinician read of the struggling page and of macro M6 (SUP-16, SUP-17) | SUP-16, SUP-17 |
| BL-109 | BL-109 needs-founder | marketing: Coverage and recruitment drafts (FR-MKT-26); languages: BL-109 (beta recruitment): Hindi and Spanish speaker rows apply to the gate corpus, not the store build (see FR-MKT-26) / FR-LOC-03 | MKT-26, LOC-03 |
| BL-958, BL-988 | BL-958 ready, BL-988 in-progress | operations: Widen from two flags to every card flag; add the gate record and the unknown-flag allowlist (FR-OPS-22, 23); add the `release-ios.yml` call as a proposal; finance: The G6 gate record gains a "run cost" column for cards in FR-FIN-02; privacy: Preflight SDK guard (FR-PRV-31) (the PRV row asks for a new preflight SDK guard, so this entry is existing BL-958 plus new scope) | OPS-22, OPS-23, FIN-02, PRV-31 |
| BL-976 | BL-976 blocked | operations: Add the on and off runbooks and the evidence page (FR-OPS-15, 16); reliability: Add FR-REL-09 to 12 to the flip evidence page / FR-REL-09 | OPS-15, OPS-16, REL-09, REL-10, REL-11, REL-12 |
| BL-929, BL-948 | BL-929 ready, BL-948 blocked | operations: One run sheet per candidate including the E system-state rows (FR-OPS-30); reliability: Tier B, ratchet, new system rows / FR-REL-31, 38 | OPS-30, REL-31, REL-38 |
| BL-965 | BL-965 ready | finance: Carries `plusLine` "stay free" and the `plan.retry` wording fix | - |
| BL-981 | BL-981 blocked | data: add the NS-06 B study; correct the section references (study lines are in NS-01 section 21, NS-02 section 21, NS-05 section 20, NS-06 A20, B20); add "lines written before day 0" (FR-DAT-10).; research: scope gains S2 first-run test, the sealed study (data review already asks), the lines-before-day-0 rule, and the F1 resolution. Corrects section references. | DAT-10 |
| BL-485 | BL-485 needs-decision | privacy: Move from needs-decision to ready once PQ-1 has a default the founder accepts; scope FR-PRV-01 | PRV-01 |
| BL-577 | BL-577 deferred | privacy: Undefer: the consent builder with `rendered_sha256`, `app_build`, `os_major` and the shown locale, before any store build writes more rows | PRV-02, PRV-03 |
| BL-960 | BL-960 ready | privacy: Unchanged scope; it is the gate for FR-PRV-06 and gains FR-PRV-08's rows (GitHub dump, drill copy) | PRV-06, PRV-08 |
| BL-961 | BL-961 ready | privacy: Gains FR-PRV-07's registry as the source the `[X4-R1]` test enumerates, and the C G2, E1, E9, E10 items; security: Scope adds: `hasLocalBook` filtered by owner (FR-SEC-01); B's letters never stuck behind a phone-wide owner (FR-SEC-02); hidden-book surfaces (FR-SEC-03); the four split test ids (CC-2). Size moves from M to L; cultural-data: Gains this store in its `[X4-R1]` enumeration / FR-CUL-15 | PRV-07, PRV-14, PRV-15, SEC-01, SEC-02, SEC-03, CUL-15 |
| BL-962 | BL-962 ready | privacy: Gains the full API list of FR-PRV-17 and the E-S08 signs-as field; on React Native, record the finding with the native fallback; ai-and-speech: Existing: writing tools off on every words field; add the full field list of FR-AIS-55 / FR-AIS-55 / BL-962 | PRV-16, PRV-17, AIS-55 |
| BL-975 | BL-975 ready | privacy: Gains check (d); cultural-data: Gains the "derived off-device" check (FR-PRV-29(d) pattern) for this store / FR-CUL-23 | PRV-29, CUL-23 |
| BL-979 | BL-979 blocked | privacy: Gains FR-PRV-21 (versions in the author's copy or the manifest line) | PRV-21 |
| BL-980 | BL-980 blocked | privacy: Gains FR-PRV-22 (correction of the From name) after PQ-4 | PRV-22 |
| BL-994 | BL-994 in-progress | privacy: `privacy` reviews NS-42 to NS-45 before lock against FR-PRV-02, 04, 14, 15, 18, 24 to 28 and 35, and the class corrections in section 5 | PRV-02, PRV-04, PRV-14, PRV-15, PRV-18, PRV-24, PRV-25, PRV-26, PRV-27, PRV-28, PRV-35 |
| BL-579 | BL-579 deferred | privacy: Undefer with BL-577: upload the local agreement rows unchanged at first sign-in | PRV-02 |
| BL-444 | BL-444 ready | legal: Either ship Leave before NS-25's store flag, or record that the Terms keep the "not in the app yet" wording | LEG-03 |
| BL-104 | BL-104 needs-founder | legal: Counsel packet 1.6.0 (FR-LEG-18) before engagement | LEG-18 |
| BL-404 | BL-404 ready | compliance: Accessibility statement and its Help link (scope already names it) | CMP-10 |
| BL-119 | BL-119 ready | compliance: `child-input` tag on the NS-16 flag | CMP-14 |
| BL-551, BL-552 | BL-551 (listed in an older format, or not in BACKLOG.md; see it), BL-552 (listed in an older format, or not in BACKLOG.md; see it) | back-office: BKO-07, -26 / Before any outside sign-in | POL-10, OPS-06, BKO-07, BKO-26 |
| BL-597, BL-598 | BL-597 deferred, BL-598 deferred | back-office: BKO-07, -08 / Before any outside sign-in | BKO-07, BKO-08 |
| BL-546 | BL-546 blocked | messaging: FR-MSG-17 | MSG-17 |
| BL-411 | BL-411 ready | languages: BL-411 (letter fixtures for ar, hi, zh; layout at AX5): add the six-language Asha fixtures and the PDF check / FR-LOC-15, 17 | LOC-15, LOC-17 |
| BL-321 | BL-321 (listed in an older format, or not in BACKLOG.md; see it) | languages: BL-321 (Hindi app UI): mark "after interface languages are opened (Q-LOC-5)" / FR-LOC-10 | LOC-10 |
| BL-978 | BL-978 ready | reliability: Add the restore-epoch and clone cases / FR-REL-59, 60 | REL-59, REL-60 |
| BL-043 | BL-043 needs-founder | ai-and-speech: Existing, founder's phone: add the extra rows of BL-new-G and BL-new-J, and run the first gate for English / FR-AIS-20 to 22, 42 / BL-043 | AIS-20, AIS-21, AIS-22, AIS-42 |
| BL-002 | BL-002 ready | quality: BL-002 (change); #819 per 14 / `qa` | QAL-02, QAL-03 |
| BL-966 | BL-966 ready | days: the NS-32 registry tests / BL-966 | - |
| BL-537 | BL-537 deferred | notifications: BL-537 back-off | - |
| BL-869 | BL-869 ready | notifications: BL-869 (#758) | - |
| BL-982 | BL-982 blocked | notifications: BL-982 typed-day key shape | - |

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
| No row from this file for server migrations. Any schema change that a requirement above implies goes to `data-architect` as a migration task; I do not write migrations | lifecycle | none |
| Note | notifications | Rules-test forbidden-word list additions for FR-NTC-25. |
| Note | notifications | Cancel-on-switch-off and on-permission-change hooks (extends sign-out `forgetReminders`). |
| Note | photos | Planner change for NS-32: none for level 2. Apple's notification is not scheduled by our planner (`planner.ts` kinds stay `evening`, `monthAge`, `birthday`, line 106). |

Related pairs to keep together when the rows are written: BL-485 (privacy) and the compliance withdrawal control are the same control; BL-577 (privacy) and the legal consent-record row are the same record writer; the BL-961 change (privacy, security and cultural-data, which adds its store to the `[X4-R1]` enumeration) must list the four split test ids from the security proposal CC-2 (R-019 in 3b).

## 6. Design: function needs per e2e area, for the design leads

Each area lead records these as "Function needs accounted for" with the FR id (BRIEF step 5). 6.x.1 is every design-needs row the functions filed (design-needs section of their files, read by heading) whose screen id is in that area; 6.x.2 is the FRs whose Links column names a screen of the area but that no function filed a design-needs row for (the design response is then the FR requirement itself; read it in section 1). Screen ids are as written by the function; ids are checked against the five `DESIGN.md` files (section 7). A row naming screens in two areas appears in both. The design response is copied from the function row; it is a request, not a ruling. Rows that carry no screen id are in 6.F.

### 6.1 A. Capture

Design folder: `docs/design/e2e/A-capture/`.

Conflicts in section 3a that touch this area: K2 (the Home Plus line sits on A-S01), K13 (picture start and suggestions on A-S01, A-S03), K19 and K18 (the Home days ask card).

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
| messaging | Capture cluster sheet (A-S01 area, new states) | Moments entry inside "Start from a photo"; Photos explainer; limited-access state; denied state silent | (none cited in the row) |
| messaging | Home slip (A-S01 slip states) | Moment rank, words only; no thumbnail; "Not now" | (none cited in the row) |
| languages | A-S07.language, A-S10, E-S08 | A reconciled line for A-S10 and the held-language card when a build hears more than one language: the language chip on Review, the "another language" mark when the list has one entry (G-06), and the waiting line with its first sentence only / FR-LOC-01, 02, 28 | LOC-01, LOC-02, LOC-28 |
| languages | B-S04, B-S05, B-S08, A-S07; C-S05 | Font decision for Arabic and Chinese in the app and the PDF with a size cost; Hindi line-height and Bold Text states for the letter page, Book card and Find snippet / FR-LOC-15, 16 | LOC-15, LOC-16 |
| languages | A-S07, B-S05.rtlLabel, B-S07, D-S02.rtl | A right-to-left state list with a mixed-direction line, each state drawn once (Review, letter page, Book card, Find, Months, Firsts, share sheet, export) / FR-LOC-17 | LOC-17 |
| languages | Review and letter page media tiles (A-S07, B-S08) | Parent-words field with Devanagari and Arabic examples; no truncation at AX5 | (none cited in the row) |
| reliability | E-S17, A-S04.lowSpace | Draw the under 1 GB line (G-E04) and the 0 bytes at Keep case ("Recorded before the app closed" returns) / FR-REL-48 | REL-48 |
| ai-and-speech | A-S07 Review, words card | The "recorded but no words" state names whisper and noise in plain words and keeps Type the words as the one primary action. Title revised from "No talking in this one" to a line that also fits a whisper (F05-U13 proposes "We could not make out words this time"; `content` writes). The recording is always playable / 25, 29 / A | (none cited in the row) |
| ai-and-speech | A-S07 Review, small fixes | One quiet "Check this" mark for a flagged span: dotted underline, tappable, 44 pt target, not by colour alone (Differentiate Without Colour), VoiceOver reads "Check this word" with the heard text; never a count, never a gap line / 31, 32 / A | (none cited in the row) |
| ai-and-speech | A-S07 / A-S10 Another language | The "This was in another language" control stays; its hint is as drawn. Add the state for a take that is a mix (code-switched): no new control; the parent edits by typing / 28 / A | (none cited in the row) |
| ai-and-speech | A-S10.withheld | The machine output is never drawn; the card gap G-05 on its words stays / 33 / A | (none cited in the row) |
| ai-and-speech | A-S06 Write and every words field | Writing tools, autocorrect and predictive text off, shown as a design annotation on each field; a test id per field / 55 / A, B | (none cited in the row) |
| ai-and-speech | A-S04 Listen, A-S05 recording | When the take is mostly silent or under the speech floor, one calm line before Finish: "That was quiet. The recording is kept." (intent; `content` writes). Never says nothing was heard as a fault / 25, 29 / A | (none cited in the row) |
| ai-and-speech | Review, small-fix explainer | A one-line help sentence that says what the fixes are (removed "um", repeats, spelling of a name you taught, a full stop) and that nothing is added; no "AI" and no "we cleaned" wording / 48, 56 / A, content | (none cited in the row) |
| ai-and-speech | Picture and video tiles on Review and the letter page (A-S07, B-S08) | Fixed accessibility phrase; parent's words field with writing tools off; no generated alt text; video has no transcript affordance / 59, 62, 68 | (none cited in the row) |
| research | A-S01.first, A-S04.primer, E-S02, E-S03, E-S07, E-S08, E-S10, E-S12 | A clickable first-run path with no dead ends, so S2 can run on a prototype before a build exists / FR-RSH-04 | RSH-04 |
| quality | A-S12, B-S11, B-S15, D-S19, C-S17 | Undo window seconds per toast and sheet, in one table / NS-33-R15 and T4 tie windows to VoiceOver; a test needs the seconds. FR-QAL-09 | QAL-09 |
| days | A-S01 slip rank (R-IA-3, R-IA-5) | Ask card on Home / "Would you like a note on days that matter to your family?" with Choose and Not now; shown once; pending Q-FD-2 | (none cited in the row) |
| days | A-S01 | A-S01 Home on a ticked day: one slot, the day's landing, Start from a picture stays in its usual place; a state with a moment present and a state on a `quiet` day (new states needed). | (none cited in the row) |
| cultural-data | A-S01 Home (state `daysAsk`, proposed) | One card, used once, in the slot where the Home slips already rise. Words: the question, "Choose days", "Not now". Equal weight for both buttons. No count, no badge. Gone after either answer / FR-CUL-19, 26 | CUL-19, CUL-26 |
| cultural-data | A-S01 Home slip (day slip, NS-50) | A day we mark today shows its name; nothing for tomorrow; never a list / FR-CUL-13 | CUL-13 |
| cultural-data | A-S13 After Keep | No change: the ask never rises here; keep the Keep gate and reminder ask as the only hand-offs / FR-CUL-19 | CUL-19 |
| photos | new screen needed (Home, A-S04 family; NS-01 section 15 states extend) | Home: the picture start with a "Pick from recent days" choice inside it (light, dark, AX5 on SE 3), absent on 17.0 and 17.1 | (none cited in the row) |
| opportunities | A-S01 | A version of Home with picture-first as an equal start, tested against the SE 3 at AX5 / FR-OPP-02 | OPP-02 |
| opportunities | A-S01 | A prompt-offer state for "the same question again" (no old words shown) / FR-OPP-04 | OPP-04 |
| opportunities | A-S14 | Lock Screen control and Home Screen prompt widget, one state set, redacted text while locked / FR-OPP-05 | OPP-05 |
| opportunities | A-S07 | A first view of Review with fewer controls before Keep / FR-OPP-11 | OPP-11 |
| opportunities | A-S09 | A "from {child}" path in plain words / FR-OPP-07 | OPP-07 |
| opportunities | A-S01 | A-S01: the "same question again" state with no old words (existing need) gains a version where last year's letter's picture is shown only on the NS-23 slip. | (none cited in the row) |

**6.1.2 FRs naming screens of this area with no design-needs row**

MKT-28 (A-S10); MKT-37 (A-S03); LEG-08 (A-S09); LOC-08 (A-S07.language); LOC-09 (A-S10); LOC-11 (A-S08); LOC-20 (A-S01); REL-33 (A-S04); REL-54 (A-S05); AIS-07 (A-S06); AIS-16 (A-S07); AIS-25 (A-S07); AIS-27 (A-S09); AIS-29 (A-S07, A-S04); AIS-30 (A-S07); AIS-31 (A-S07); AIS-55 (A-S06, A-S07); AIS-56 (A-S07); RSH-05 (A-S01); RSH-12 (A-S05, A-S10); RSH-16 (A-S07); QAL-08 (A-S01, A-S07); DAY-02 (A-S01); DAY-27 (A-S01); PHS-01 (A-S04); OPP-03 (A-S03); OPP-06 (A-S14); OPP-08 (A-S03)

### 6.2 B. Book and reading

Design folder: `docs/design/e2e/B-book-and-reading/`.

Conflicts in section 3a that touch this area: K12 (dates and digits on the letter page and the book frame).

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
| languages | C-S05 (printable), C-S04, B-S08 | Honest "the app is in English" lines where a non-English book is read, exported or printed (printable book intro, Save a copy screen, Plus or Me help) / FR-LOC-13 | LOC-13 |
| languages | B-S04, B-S05, B-S08, A-S07; C-S05 | Font decision for Arabic and Chinese in the app and the PDF with a size cost; Hindi line-height and Bold Text states for the letter page, Book card and Find snippet / FR-LOC-15, 16 | LOC-15, LOC-16 |
| languages | A-S07, B-S05.rtlLabel, B-S07, D-S02.rtl | A right-to-left state list with a mixed-direction line, each state drawn once (Review, letter page, Book card, Find, Months, Firsts, share sheet, export) / FR-LOC-17 | LOC-17 |
| languages | Review and letter page media tiles (A-S07, B-S08) | Parent-words field with Devanagari and Arabic examples; no truncation at AX5 | (none cited in the row) |
| ai-and-speech | B-S08 letter page | "Exactly as said" and "With small fixes" appear for the author only and never for the other parent / 08 / B | (none cited in the row) |
| ai-and-speech | Picture and video tiles on Review and the letter page (A-S07, B-S08) | Fixed accessibility phrase; parent's words field with writing tools off; no generated alt text; video has no transcript affordance / 59, 62, 68 | (none cited in the row) |
| research | B-S12, B-S13, B-S14, B-S16 | Concept walk states for seals and Firsts exactly as drawn, with the limit line shown / FR-RSH-07 | RSH-07 |
| quality | A-S12, B-S11, B-S15, D-S19, C-S17 | Undo window seconds per toast and sheet, in one table / NS-33-R15 and T4 tie windows to VoiceOver; a test needs the seconds. FR-QAL-09 | QAL-09 |
| lifecycle | B-S08 letter page | Missing media state for pictures and video; media removed for another adult (state to add) | (none cited in the row) |
| print | PRT-S01 A book to hold (sheet) | Choose the book and the run of chapters (default Before You plus 0 to 11), see the authors named, one line saying what happens next; entry only from C-S04, B-S02 and C-S06 / FR-PRT-06, -16 | PRT-06, PRT-16 |
| print | PRT-S02 Preview, every page | Full-page paging of the exact file; changes route back to B-S08; the one softer-picture line; the emoji and missing-glyph states; the order approve button; AX5, VoiceOver, offline / FR-PRT-05 to -15 | PRT-05, PRT-06, PRT-07, PRT-08, PRT-09, PRT-10, PRT-11, PRT-12, PRT-13, PRT-14, PRT-15 |

**6.2.2 FRs naming screens of this area with no design-needs row**

MKT-37 (B-S04); LEG-01 (B-S11); LEG-08 (B-S12, B-S13); AIS-07 (B-S08); AIS-31 (B-S08); AIS-55 (B-S08); AIS-56 (B-S08); RSH-11 (B-S04, B-S06); QAL-08 (B-S01, B-S15)

### 6.3 C. Keeping and trust

Design folder: `docs/design/e2e/C-keeping-and-trust/`.

Conflicts in section 3a that touch this area: K4 (C-S20 deletion lines), K9 (C-S23 proposed by privacy), K15 (the suspended-account and deleted-elsewhere lines on C-S10 and C-S20).

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
| back-office | C-S01 (Me, Help and legal), E-S01.recovery, E-S06 | Help route for a concern / Reuse the Help row and "Write to us" (FR-SUP-01, -02). No new parent screen. The help centre gets one page, "Report a concern" (FR-BKO-12) | SUP-01, SUP-02, BKO-12 |
| back-office | E-S15 SystemLine; **new state needed** on C-S02 | A suspended account's line (FR-BKO-26) / The book stays readable; sync waits; Save a copy and Delete account stay reachable | BKO-26 |
| languages | C-S05 (printable), C-S04, B-S08 | Honest "the app is in English" lines where a non-English book is read, exported or printed (printable book intro, Save a copy screen, Plus or Me help) / FR-LOC-13 | LOC-13 |
| languages | B-S04, B-S05, B-S08, A-S07; C-S05 | Font decision for Arabic and Chinese in the app and the PDF with a size cost; Hindi line-height and Bold Text states for the letter page, Book card and Find snippet / FR-LOC-15, 16 | LOC-15, LOC-16 |
| languages | C-S01, C-S18, E-ST08 | Settings, Spoken language and Storage language rows in a multi-language build: sizes, Wi-Fi only, paused, needs newer app, removed language; no teaser for a language the build does not hear / FR-LOC-01, 07, 28 | LOC-01, LOC-07, LOC-28 |
| reliability | C-S18 Me, Storage | Show size per kind and the actions that free space / FR-REL-37 | REL-37 |
| ai-and-speech | Me, Languages (new screen needed) | One place that lists the languages that passed, each with its download state and size; a language that has not passed is not listed; a language with a failed gate is never shown as "coming soon" (the frame's no-"coming soon" rule) / 11, 22 / C (Me) | (none cited in the row) |
| research | C-S03, C-S08, E-S10, D-S02 | Print-ready "read aloud" cards of each screen, one per comprehension question / FR-RSH-10 | RSH-10 |
| research | C-S05 | The printable book as an Asha fixture file / FR-RSH-09 | RSH-09 |
| quality | A-S12, B-S11, B-S15, D-S19, C-S17 | Undo window seconds per toast and sheet, in one table / NS-33-R15 and T4 tie windows to VoiceOver; a test needs the seconds. FR-QAL-09 | QAL-09 |
| lifecycle | C-S10, C-S11 | A state for "this phone's letters belong to another sign-in": names the method, offers Save a copy and Erase everything / FR-LCY-10 | LCY-10 |
| lifecycle | C-S04 | A state for a split copy (part names, one sentence, no count of what is missing); `tooBig` stops being a dead end that points to "Write to us" / FR-LCY-21 | LCY-21 |
| lifecycle | C-S01 signed-out card | The signed-out state after a device restore reads as normal, not as a fault / FR-LCY-09 | LCY-09 |
| lifecycle | C-S10 and sign-out sheets | Name pictures and videos once where media exists (NS-01-R30 extended); deleted-elsewhere state names media | (none cited in the row) |
| lifecycle | C-S04 Save a copy | Size estimate and split line for media; no promise of video playback in every program | (none cited in the row) |
| print | C-S04, C-S05 (existing) | The 1.0 file: one plain line saying what the file is and is not (FR-PRT-02); no change to the buttons; add the help-article link / FR-PRT-02, -03 | PRT-02, PRT-03 |
| print | PRT-S01 A book to hold (sheet) | Choose the book and the run of chapters (default Before You plus 0 to 11), see the authors named, one line saying what happens next; entry only from C-S04, B-S02 and C-S06 / FR-PRT-06, -16 | PRT-06, PRT-16 |
| print | C-S06 (year-end slip) | A quiet line to a book to hold, no countdown, off when the flag is off / FR-PRT-16 | PRT-16 |
| cultural-data | New screen needed: Me, Days we mark (proposed C-S24) | Row in C-S01 under Reminders or Family; list of ticked days with untick; "Browse by tradition" and "Browse by country" as two flat alphabetical lists; "Another tradition" add; "Clear all"; one line: "Not in Save a copy"; the call-out at the top; states: empty, some, browse, clear-confirm, offline (no network is needed), AX5 / FR-CUL-02, 10, 20, 21, 22 | CUL-02, CUL-10, CUL-20, CUL-21, CUL-22 |
| cultural-data | C-S03 Sign-out sheet | One line: "Days you chose on this phone are cleared" (content writes it); fits the D1 lines / FR-CUL-15 | CUL-15 |
| cultural-data | C-S19 Erase everything | No new body; the "everything" list includes the days list (the scan proves it) / FR-CUL-16 | CUL-16 |
| cultural-data | C-S20 Delete account | The FR-CUL-17 line in "What happens" / FR-CUL-17 | CUL-17 |
| cultural-data | C-S04 Save a copy | No change to the file; the one line lives on C-S24 / FR-CUL-10 | CUL-10 |

**6.3.2 FRs naming screens of this area with no design-needs row**

SUP-13 (C-S02); SUP-14 (C-S20); MKT-23 (C-S19, C-S20); MKT-24 (C-S06); MKT-36 (C-S08, C-S21); DAT-02 (C-S01, C-S04); DAT-37 (C-S18); PRV-03 (C-S04); PRV-05 (C-S11.declined); PRV-20 (C-S11.declined); PRV-27 (C-S10); PRV-41 (C-S19, C-S20); SEC-04 (C-S19); SEC-12 (C-S02, C-S20); BKO-07 (C-S02); BKO-24 (C-S01); BKO-27 (C-S02); MSG-34 (C-S20); LOC-10 (C-S01); LOC-14 (C-S18); LOC-18 (C-S01); LOC-25 (C-S01); REL-61 (C-S12); REL-67 (C-S18); RSH-21 (C-S01); QAL-08 (C-S01); LCY-04 (C-S08); LCY-11 (C-S20); LCY-12 (C-S04, C-S10); LCY-13 (C-S09, C-S12); LCY-19 (C-S10, C-S20); LCY-20 (C-S04); LCY-22 (C-S04); LCY-25 (C-S04); LCY-26 (C-S10); LCY-37 (C-S08); PRT-01 (C-S04); PRT-33 (C-S01); CUL-01 (C-S24); CUL-03 (C-S15); CUL-07 (C-S10); CUL-13 (C-S24); CUL-26 (C-S24)

### 6.4 D. Family, sharing and reminders

Design folder: `docs/design/e2e/D-family-sharing-reminders/`.

Conflicts in section 3a that touch this area: K11 (reminders on D-S04 to D-S10), K12 and K18 and K19 (the days page and the day-name switch on D-S08, D-S10, D-S11), K21 (no exclamation marks in notifications).

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
| back-office | D-S20 is the nearest state (the other parent's phone after an undo); otherwise **new screen state needed** | A limited member's line (FR-BKO-15) / One neutral SystemLine on the Book of the limited person; no reason, no name; content's words | BKO-15 |
| messaging | D-S14 (invite link page) | Add the App Store button in launch mode above the copy steps, with `.iphone` and `.other-device` both keeping the "ignore it" and write-to-us lines; no expiry wording; decide the link-preview card (generic, no name) / FR-MSG-27, FR-MSG-28, FR-MSG-29 | MSG-27, MSG-28, MSG-29 |
| messaging | D-S15 (peek) | `.error-expired`, `.error-used`, `.error-revoked` carry all the validity language; add the line for a person who pasted an invite after install / FR-MSG-28, FR-MSG-30 | MSG-28, MSG-30 |
| messaging | D-S04, D-S06.denied, E-S12.withAsk | No change to design; add the rule that "No" is never asked again / FR-MSG-19, FR-MSG-20 | MSG-19, MSG-20 |
| messaging | Me, Reminders (D-S06) | Line that moments do not send reminders; the existing reminder setting unchanged | (none cited in the row) |
| languages | A-S07, B-S05.rtlLabel, B-S07, D-S02.rtl | A right-to-left state list with a mixed-direction line, each state drawn once (Review, letter page, Book card, Find, Months, Firsts, share sheet, export) / FR-LOC-17 | LOC-17 |
| research | C-S03, C-S08, E-S10, D-S02 | Print-ready "read aloud" cards of each screen, one per comprehension question / FR-RSH-10 | RSH-10 |
| research | D-S04, D-S11 and the neutral notification set (GAP D G-D19) | Five mock notifications as images (Asha, no child name), for the reading test / FR-RSH-08 | RSH-08 |
| research | D-S15, D-S20 | A two-phone prototype path for the join test / FR-RSH-06 | RSH-06 |
| quality | A-S12, B-S11, B-S15, D-S19, C-S17 | Undo window seconds per toast and sheet, in one table / NS-33-R15 and T4 tie windows to VoiceOver; a test needs the seconds. FR-QAL-09 | QAL-09 |
| days | D-S09 pattern, new state | Day detail / The day's name, the date ("around"), a "Move this date" control (one year, always), Remove; no tradition label | (none cited in the row) |
| days | D-S10 new states | Lock-screen renders / `libraryDay-public`, `libraryDay-neutral`, `libraryDay-named`, `libraryDay-quiet`, `twoDays` | (none cited in the row) |
| days | D-S11 new state | Notification landing / `libraryDay`: Home shows the day's name and one line above the prompt (like the typed day); `quiet` has no prompt line; `twoDays` names both | (none cited in the row) |
| days | D-S06 | Names switch help line / The one "Names in notifications" switch gains one plain line that it also covers day names (Q-DAY-6) | (none cited in the row) |
| cultural-data | D-S06 Me, Reminders | One switch "Show the day's name in the note" under the names switch, default off, shown disabled with a reason while App lock is on (the built `.appLock` state pattern) / FR-CUL-12 | CUL-12 |
| cultural-data | D-S10 Lock screen | New class `libraryDay`: one neutral body for every layer; placeholder for hidden previews; a drawn state for the switch on (day name only) / FR-CUL-12 | CUL-12 |
| cultural-data | D-S11 Notification landing | New state `.libraryDay`: opens Home with a generic prompt; no route parameter holds the day / FR-CUL-05 | CUL-05 |
| cultural-data | D-S08 / D-S09 Add a day | No change (typed days stay one-off). Make the difference between "a day you type" and "a day we mark" visible by placing the two in different sections / FR-CUL-02 | CUL-02 |

**6.4.2 FRs naming screens of this area with no design-needs row**

MKT-25 (D-S23); LEG-08 (D-S08); LEG-09 (D-S16); SEC-23 (D-S14); BKO-12 (D-S18); BKO-14 (D-S18, D-S19, D-S20); MSG-14 (D-S13, D-S15); MSG-16 (D-S04); MSG-17 (D-S10, D-S04); MSG-18 (D-S10, D-S11); MSG-21 (D-S06.lateClamp, D-S07); MSG-23 (D-S14); MSG-24 (D-S14.iphone); MSG-34 (D-S18); MSG-35 (D-S18); MSG-36 (D-S14); MSG-40 (D-S04); RSH-05 (D-S04, D-S11); RSH-11 (D-S02); PRT-36 (D-S18); PRT-37 (D-S18); DAY-03 (D-S10, D-S11); DAY-06 (D-S08, D-S09); DAY-07 (D-S10.oneDay, D-S10.twoDays); DAY-08 (D-S10); DAY-09 (D-S10, D-S11); DAY-10 (D-S10, D-S11); DAY-11 (D-S11); DAY-15 (D-S08); DAY-16 (D-S06, D-S09); DAY-19 (D-S11); CUL-19 (D-S04); CUL-25 (D-S13, D-S18)

### 6.5 E. Foundations and system states

Design folder: `docs/design/e2e/E-foundations-and-system-states/`.

Conflicts in section 3a that touch this area: K2 (E-S26 line), K5 (E-S03 minor-signal state versus "store nothing"), K9 (E-S27 and E-S28 are taken; E-ST47 is free), K10 (E-S03 country count), K15 (E-S15 and E-S24 states).

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
| back-office | C-S01 (Me, Help and legal), E-S01.recovery, E-S06 | Help route for a concern / Reuse the Help row and "Write to us" (FR-SUP-01, -02). No new parent screen. The help centre gets one page, "Report a concern" (FR-BKO-12) | SUP-01, SUP-02, BKO-12 |
| back-office | E-S15 SystemLine; **new state needed** on C-S02 | A suspended account's line (FR-BKO-26) / The book stays readable; sync waits; Save a copy and Delete account stay reachable | BKO-26 |
| back-office | E-ST05 to E-ST13c | Pause renders / Already designed per key. FR-BKO-17 needs nothing new, but E-ST13c lists seven keys behind one render; confirm each key in `kill-switches.ts` has a row (today `bookSearch` is absent: FR-OPS-02) | OPS-02, BKO-17 |
| messaging | E-S06 (code and verify), states `.help`, `.noAddress` | Order the not-arriving help as in FR-MSG-08, add the Hide My Email hint line, keep the "write to us" row at the same weight; check at AX5 / FR-MSG-08, FR-MSG-03 | MSG-03, MSG-08 |
| messaging | E-S11 or the Me account section (state to add) | The quiet "We could not reach {email}" row with Fix address; a relay-address variant shows the method, not the address / FR-MSG-05, FR-MSG-07 | MSG-05, MSG-07 |
| messaging | E-S14 (outage and offline) | Confirm it names that Apple sign-in and the local start stay open when mail or the site is down / FR-MSG-15 | MSG-15 |
| messaging | D-S04, D-S06.denied, E-S12.withAsk | No change to design; add the rule that "No" is never asked again / FR-MSG-19, FR-MSG-20 | MSG-19, MSG-20 |
| languages | A-S07.language, A-S10, E-S08 | A reconciled line for A-S10 and the held-language card when a build hears more than one language: the language chip on Review, the "another language" mark when the list has one entry (G-06), and the waiting line with its first sentence only / FR-LOC-01, 02, 28 | LOC-01, LOC-02, LOC-28 |
| languages | C-S01, C-S18, E-ST08 | Settings, Spoken language and Storage language rows in a multi-language build: sizes, Wi-Fi only, paused, needs newer app, removed language; no teaser for a language the build does not hear / FR-LOC-01, 07, 28 | LOC-01, LOC-07, LOC-28 |
| reliability | E-ST47 (proposed by operations) | Add the "Server restored" state with the same render as E-ST17 and the sentence for message 3 / FR-REL-18, 07 | REL-07, REL-18 |
| reliability | E-S14 | Confirm Start on this phone for every outage kind; add the clock hint as help, not as a banner; the sign-in email shows "or type the code" / FR-REL-03, 55 | REL-03, REL-55 |
| reliability | E-S17, A-S04.lowSpace | Draw the under 1 GB line (G-E04) and the 0 bytes at Keep case ("Recorded before the app closed" returns) / FR-REL-48 | REL-48 |
| ai-and-speech | E-S08.open (speech card) | Size line is read from the catalog (bytes), never typed; states: ask, downloading, waiting for Wi-Fi in words, verifying, stopped with Try again, paused remotely, not enough space / 13, 14, 16 / E | (none cited in the row) |
| research | A-S01.first, A-S04.primer, E-S02, E-S03, E-S07, E-S08, E-S10, E-S12 | A clickable first-run path with no dead ends, so S2 can run on a prototype before a build exists / FR-RSH-04 | RSH-04 |
| research | C-S03, C-S08, E-S10, D-S02 | Print-ready "read aloud" cards of each screen, one per comprehension question / FR-RSH-10 | RSH-10 |
| quality | E-S01 to E-S08, E-S14, E-S24 (E owns) | Add E-S01 to E-S08, E-S14, E-S24 to NS-33's walk list; draw a reading order, heading level and focus target for each state / NS-33 s3 names Home, Listen, Review, the Book, the letter page, Me and Read together; first run is not named. FR-QAL-09 | QAL-09 |
| quality | E-S04, E-S05, E-S06, E-S07, E-S14 | For each error row of J-E08 (16 kinds), the string VoiceOver announces and where focus lands / A test needs an oracle; the table says "focus to field" for one kind only. FR-QAL-09, FR-QAL-11 | QAL-09, QAL-11 |
| quality | E-S03.default, E-S03.stop, E-S02 | Selected, error and recording states shown by text or shape as well as colour on the age answer, the agreement tick and the sign-in method buttons / NS-33-R12 is written for the recording state only; the same WCAG 1.4.1 reading applies to the age choice. Counsel must confirm any legal reading. FR-QAL-09 | QAL-09 |
| quality | E-S23 | The evidence-sheet layout for the eight passes of Annex B / E-S23 is "Accessibility walk and speed sheet"; it needs the pass names. FR-QAL-07 | QAL-07 |
| lifecycle | E-S24 claim screen | New state: "your earlier account was deleted; keep these letters in this account?" Same masked-email and tap rules as ADR 0023 layer 3; words say what happens, not who is at fault / FR-LCY-11, 19 | LCY-11, LCY-19 |
| lifecycle | E-S16 | One line, one rule: the "update available" and "can no longer reach your account" words as two states of the same line, absent when current. Resolves NS-45-R14 against K-E05 / FR-LCY-17 | LCY-17 |
| lifecycle | E-S01.recovery | Keep "Export what's readable" on every recovery state; it must run against an older-schema file / FR-LCY-02 | LCY-02 |
| lifecycle | E-S24 and the deletion screens | Media and thumbnails in what is removed, by words, not file names | (none cited in the row) |
| print | E-S13 and E-S14 | Order screens under outage and offline: the order status reads the last known state; creation of an order is disabled offline with a line; pause line from FR-PRT-41 / FR-PRT-41 | PRT-41 |
| cultural-data | E-S01 to E-S08 | No change; a design check that none gains a tradition or country field / FR-CUL-18 | CUL-18 |
| cultural-data | E-S27 App Store page | Screenshots only from the Asha book; a screenshot of Days we mark uses a synthetic tradition or seasonal days only, never a real tradition on a fictional family / FR-CUL-08, 23 | CUL-08, CUL-23 |

**6.5.2 FRs naming screens of this area with no design-needs row**

SUP-12 (E-S11); POL-07 (E-S03); MKT-04 (E-S10, E-S11); MKT-06 (E-S27); MKT-08 (E-S02, E-S14, E-S27); MKT-10 (E-S27); MKT-11 (E-S27); MKT-15 (E-S27); MKT-17 (E-S27); MKT-18 (E-S27); MKT-30 (E-S27); MKT-37 (E-S27); MKT-41 (E-S11); OPS-03 (E-ST17); OPS-04 (E-ST29); OPS-10 (E-S05.error-email, E-S06.error-rate, E-S14.outage); OPS-11 (E-ST02, E-ST03); OPS-12 (E-ST02); OPS-13 (E-ST02); OPS-16 (E-ST10, E-ST11); OPS-19 (E-ST01, E-ST02); OPS-31 (E-S27); OPS-36 (E-S14, E-S04.refused-region); FIN-30 (E-S10, E-S12); DAT-21 (E-S26); DAT-34 (E-S16); DAT-35 (E-S03, E-S04, E-S07); PRV-05 (E-S07.declined); PRV-37 (E-S01, E-S08); LEG-20 (E-S03, E-S07); CMP-03 (E-S04, E-S07); CMP-13 (E-S03); CMP-16 (E-S07); CMP-18 (E-S02); CMP-27 (E-S03); SEC-05 (E-S24); SEC-22 (E-S22); SEC-11 (E-S05); BKO-07 (E-S06, E-S09); BKO-19 (E-ST05, E-ST13c); MSG-01 (E-S05, E-S06); MSG-02 (E-S05); MSG-04 (E-S06.help); MSG-06 (E-S06); MSG-09 (E-S02); MSG-10 (E-S06); MSG-11 (E-S05.error-email, E-S14); MSG-12 (E-S13); MSG-16 (E-S28); MSG-17 (E-S28); MSG-22 (E-S28); MSG-23 (E-S05); MSG-24 (E-S03); MSG-25 (E-S06); MSG-26 (E-S27); MSG-30 (E-S03); MSG-31 (E-S20); MSG-32 (E-S27); MSG-33 (E-S13); MSG-38 (E-S05); LOC-14 (E-S08); LOC-24 (E-S02); REL-01 (E-ST01, E-ST04); REL-02 (E-ST02, E-ST03, E-S14, E-S16); REL-05 (E-ST02, E-ST03); REL-10 (E-ST02); REL-13 (E-ST47); REL-14 (E-ST47); REL-15 (E-ST17); REL-19 (E-ST02, E-ST05); REL-21 (E-S13, E-S14); REL-22 (E-ST02); REL-24 (E-S13, E-ST40); REL-26 (E-ST02); REL-28 (E-ST02); REL-32 (E-S01, E-ST37, E-ST41); REL-33 (E-ST35, E-ST36, E-ST38); REL-36 (E-ST36); REL-37 (E-ST32); REL-40 (E-ST01); REL-41 (E-S10, E-ST01); REL-42 (E-ST02); REL-43 (E-ST39); REL-44 (E-ST05); REL-49 (E-ST38, E-ST39); REL-51 (E-ST02); REL-52 (E-S05, E-S06, E-S14); REL-58 (E-S03); REL-59 (E-ST37, E-ST17); AIS-09 (E-S08.open); AIS-13 (E-S08.open); AIS-14 (E-S08.open); AIS-20 (E-S08.open); AIS-44 (E-S17, E-S19); RSH-12 (E-S23); RSH-21 (E-S27, E-S28); QAL-03 (E-S27); QAL-05 (E-S01, E-S10, E-S14, E-S24, E-S26); QAL-06 (E-S05, E-S06, E-S08); QAL-20 (E-S27); QAL-22 (E-S05, E-S06, E-S14); LCY-01 (E-S01, E-ST37); LCY-03 (E-S16, E-S01); LCY-05 (E-S03.agreeOnly, E-S24, E-S10, E-S11); LCY-10 (E-S18); LCY-15 (E-ST46); LCY-16 (E-S27); LCY-24 (E-S16); LCY-26 (E-S02); LCY-30 (E-S11); PRT-15 (E-S23); PRT-17 (E-S04, E-S07, E-S18); PRT-18 (E-S07); PRT-19 (E-S27); PRT-24 (E-S07); PRT-26 (E-S14); PRT-33 (E-S13); PRT-42 (E-S17); CUL-04 (E-S24); CUL-07 (E-S24)

### 6.F Needs that name no screen of any area (cross-area, website, artefacts)

| From | Where | Need | FR ids |
|---|---|---|---|
| support | New state: the Help fallback sheet | Mail did not open: address plus Copy (`helpLinks.noMail*`). It exists in code and is not drawn | SUP-01, SUP-22 |
| support | Web: help centre pages and the Support URL | New pages in `apps/web` built from `packages/content`, at the NS-33 floor | SUP-04, SUP-22 |
| support | In-app "Pictures and videos" and "Photo moments" rows need a Help link to their article (Me, Help and legal; new row, ids not read). |  | (none cited in the row) |
| support | Error states with a help path (section 4.2 pattern): upload failed, storage full, iCloud download pending, limited access, video too long. Each keeps the system-state voice, no "error", "Write to us" outside the `SystemLine`. |  | (none cited in the row) |
| support | The empty "my pictures are missing" state in a letter says where the picture is (on this phone, in iCloud) in the parent's terms; new screen or state needed. |  | (none cited in the row) |
| marketing | Website (no e2e id) | `site.ts` scenes redrawn with three tabs; any drawn letter uses words from the sample letter, no new real names | MKT-05, MKT-32 |
| marketing | Store frames: if a media frame is wanted, one Ready or Review frame with an illustrated picture; none for photo moments (permission and moment list are the parent's own library, hard to show honestly). |  | (none cited in the row) |
| marketing | Explainer and permission copy must be read by marketing for claim drift (key set to `content`). |  | (none cited in the row) |
| marketing | A synthetic-library install for captures (design-systems, qa). |  | (none cited in the row) |
| operations | New screen needed (website, not the app) | A status page: what works, what waits, no times, no form; dark and light; AX5 reflow; words from `content` with claims rows | OPS-20 |
| finance | Printed book purchase (NS-30) | New screen needed only if NS-30 is ever taken up: a purchase outside Apple, not designed now | FIN-24 |
| data | Every screen, every area | No research question, survey card, feedback composer with counts, or "send us your numbers" control. Nothing here needs a new screen | DAT-02 |
| data | New artefact, not an app screen: tester round message and tester guide | Fixed wording from the question bank; the "numbers only" line; steps to open `manifest.json` in Files; content rules apply. `content` writes, the founder approves | DAT-04, DAT-06, DAT-13 |
| data | No screen | No variant UI for experiments: no arm-specific Keep sheet, allowance line or price display | DAT-20 |
| data | No screen in 1.0 | The analytics consent sheet and its Settings switch are not designed for 1.0 (D-095) | DAT-01 |
| legal | New screen needed: Report a concern (Me, Help) | A plain route for a safety worry or a co-parent problem, opening support with no letter content prefilled (LEGAL-REQ-056). Needed before NS-25 is in a store build, because Terms 4.4's safety limit has no door today. | LEG-10 |
| back-office | `packages/emails` templates; no screen | Account-act emails (FR-BKO-27) / Content-free; kind and date only; the same voice as the other transactional mail | BKO-27 |
| back-office | none in app | Public status page / Owned by FR-OPS-20; this file adds only that the holding line for FR-BKO-18 is the same static page | OPS-20, BKO-18 |
| back-office | none | Out-of-office text / FR-BKO-24; a fixed text file | BKO-24 |
| messaging | `/open` and `/auth/confirm` (web, no e2e id yet: new screen id needed in area E) | Treat both as designed screens: states installed-fallback, not-installed (store link), Android or computer, fragment dropped, prelaunch / FR-MSG-25, FR-MSG-26, FR-MSG-24 | MSG-24, MSG-25, MSG-26 |
| messaging | New screen needed (area E): the web not-found page and the website Support, deletion and legal pages | Design, copy and accessibility pass in the same frame as the legal pages / FR-MSG-31, FR-MSG-33, FR-MSG-34, FR-MSG-37 | MSG-31, MSG-33, MSG-34, MSG-37 |
| messaging | Email templates (`packages/emails`) | A relay-address variant of "why you got this" (FR-MSG-05); the bounce-row string; templates for any new email only after the catalog table (FR-MSG-09) / FR-MSG-05, FR-MSG-07, FR-MSG-09 | MSG-05, MSG-07, MSG-09 |
| messaging | New settings screen in Me (area C) | Moments on, pause, albums that count, remove what the app remembers (shared with the AI addendum) | (none cited in the row) |
| languages | none | New screen needed: a one-line "the date is kept in the calendar your phone uses" note is not required on any screen (help article only); no new screen for calendars at 1.0 / FR-LOC-12 | LOC-12 |
| languages | New explainer, limit lines, attach states (areas A, C) | Longest-string and AX5 states in English at 1.0.x; a layout that does not depend on English line length; RTL states drawn (FR-LOC-36) | LOC-36 |
| languages | Video player (new, area B) | Controls and captions area: no caption we generate; a parent's words only | (none cited in the row) |
| reliability | Letter page (area B; id to assign) | New state: the conflict note, one line and two actions, in the letter's own place, in dark and light, AX5 and VoiceOver; no count, no badge; words from `content`. / FR-REL-45 | REL-45 |
| reliability | Website (new screen needed) | Status page on a second host: what works, what waits, no times, no form; dark, light, AX5 / FR-REL-05, 19 | REL-05, REL-19 |
| reliability | E design section 9 matrix | Add rows: Tier B phone, hung server, captive portal, clock back and forward, DST night, date line, device restore, two-phone clone, memory warning in each long operation / FR-REL-31 to 60 | REL-31, REL-32, REL-33, REL-34, REL-35, REL-36, REL-37, REL-38, REL-39, REL-40, REL-41, REL-42, REL-43, REL-44, REL-45, REL-46, REL-47, REL-48, REL-49, REL-50, REL-51, REL-52, REL-53, REL-54, REL-55, REL-56, REL-57, REL-58, REL-59, REL-60 |
| ai-and-speech | Moment invitation and the permission explainer (new screen needed, area A) | Words say: your phone's pictures stay on the phone; the app looks at dates only. Never "we found", "best", "memories"; no thumbnails in any lock-screen or Home-slip rendering; no count / 57, 59, 61 | (none cited in the row) |
| ai-and-speech | Me, Pictures settings (new screen needed, area C) | Moments on, pause, albums that count (album choice is a filter the parent sets, no album names read for words), "Remove what the app remembers" / 57, 58 | (none cited in the row) |
| research | Every prototype (`PROTOTYPE.html` in areas A to E) | A "participant mode" that hides the state switcher and any researcher-only controls, plays a task path end to end, and shows the Asha book only. The state switcher stays for researchers (C DESIGN line 5 describes one) / FR-RSH-03, FR-RSH-15; S1, S2 | RSH-03, RSH-15 |
| research | No app screen | Nothing in the product asks a research question, shows a survey, or composes a message (FR-DAT-02). Nothing here adds an app screen / all | DAT-02 |
| research | New artefacts outside the app | Tester guide; consent texts (one per study); question bank rows; read-out template with the pass-chance tables. `content` writes the words and the founder approves; they pass the content rules; none implies the app writes anything / FR-RSH-17, FR-RSH-24 | RSH-17, RSH-24 |
| research | (no screen named) | Design (areas A, C): prototype participant mode with a fictional library; permission explainer and limited-access states drawn for S12; mock-up images of the invitation in Home slip, in the capture cluster and as a lock-screen line (neutral only); where-it-lives lines as read-aloud cards (FR-RSH-10 pattern). | RSH-10 |
| research | (no screen named) | Card changes (for Karma): README studies table gains S12 and S13 (the S2 to S11 additions from C-1 stand); NS-51 section 21 and NS-52 section 21 reference B.3 and B.4 and state "no pass number before 10"; FR-RSH-15 carries the pointer above. | RSH-15 |
| research | (no screen named) | Engineering: BL-981 gains S12 and S13; new row (`design-systems`, S) fictional library fixture; new row (`qa`) confirm `no-real-family-data` covers `docs/research/studies/**` (already asked in section 12). | (none cited in the row) |
| quality | `docs/design/system/tokens.v2.json`; A 3a fallback | A measured contrast pair list (text token on background token) for Home, Review, the Book, the letter page, and for each glass fallback surface / NS-33-R8 is a token test; it needs the pair list as data. FR-QAL-08, FR-QAL-09 | QAL-08, QAL-09 |
| quality | none | No design change for fixtures; test seams are never visible to a parent / keeps the constitution: a test control that writes or shapes words must not ship | (none cited in the row) |
| quality | (no screen named) | Design: states for limited, denied and restricted library on the explainer; video poster and player states with App lock and Reduce Motion; storage and iCloud download states; limit lines. Areas A, C, E: "Function needs accounted for: FR-QAL-26". | QAL-26 |
| quality | (no screen named) | Card changes (for Karma): `14` s5 gains P9 to P15; `14` s4 gains journeys J-N40 to J-N43 (moment to kept letter; attach several and a video; media after restore; media after deletion), ids for Karma to confirm after the card 19 and ns46-50 numbering (J-N37 to J-N39 are proposed in the ns46-50 qa review F-14); Annex E.3 changes "Pictures: licensed or illustrated images only" to include generated videos with a tone. | (none cited in the row) |
| quality | (no screen named) | Engineering (new rows needed, none above BL-999 invented): media fixture library (`qa`, `mobile`); the library boundary stand-in with the five authorisation states; binary strings read per candidate for library and speech APIs (extends ns46-50 qa F-08); video encode test on the candidate job; rules-test drift extension (F-01). | (none cited in the row) |
| lifecycle | New screen needed | Only if LQ-2 is ruled yes: "Bring a copy in" (choose a file, a plain check, what came in). No id yet / FR-LCY-33 | LCY-33 |
| lifecycle | Outside the app (help centre) | Articles: "A new phone", "Where my recordings are", "Giving {child} the book", "If you cannot sign in", "If someone cannot use their account", "Opening a copy on a computer". Written by `content` under the legacy rule / FR-LCY-12, 14, 25, 26, 27 | LCY-12, LCY-14, LCY-25, LCY-26, LCY-27 |
| lifecycle | A new screen in Me | Where pictures and videos live, one place, true for the build (default: phone and phone backup) | (none cited in the row) |
| print | PRT-S03 Where to send it, and what it costs | Address (US only), copies and addresses, price with shipping and tax, delivery range, the Print Terms link, the hosted payment hand-off; the unsupported-country line / FR-PRT-19 to -25, -32, -34a | PRT-19, PRT-20, PRT-21, PRT-22, PRT-23, PRT-24, PRT-25, PRT-32, PRT-34a |
| print | PRT-S04 Order status | State list in plain words, tracking link, cancel while on hold, Write to us / FR-PRT-26 to -28, -38, -40 | PRT-26, PRT-27, PRT-28, PRT-38, PRT-40 |
| print | PRT-S05 Orders and Order again | History, reorder through a new preview / FR-PRT-35 | PRT-35 |
| print | PRT-S06 Something is wrong with an order | Case chooser (not arrived, damaged or misprinted, wrong address), one-photo rule for damage, no photo of pages, outcome words / FR-PRT-29, -30 | PRT-29, PRT-30 |
| print | PRT-S07 What leaves the phone | The door sheet with Shown, Records, Never, Decline; Not now returns without loss / FR-PRT-18, -31 | PRT-18, PRT-31 |
| print | Design questions | DQ-1: how the cover looks in a small set of colours (design); DQ-2: whether the preview should offer a two-page spread; DQ-3: the open-hand pages for a thin book, and how they are worded without counting; DQ-4: the exact calm refusal for a non-US address / FR-PRT-09, -13, -24 | PRT-09, PRT-13, PRT-24 |
| days | New screen needed (R-IA-2: Me, Notes and days, Days) | The Days page / One list of ticked days (typed days and library days), "Add a day", "Browse days"; each row name, next date, "around" where it applies; empty state says nothing about gaps; the line for a day with no next-year date (FR-DAY-12); no counts | DAY-12 |
| days | New screen needed | Browse days sheet / Groups in the order in FR-DAY-17; tick per day; "Dates differ by country" picker question for authority variants; nothing pre-ticked; "Done" is the only exit; no "select all" | DAY-17 |
| days | `WORDS.md` for area D | Words / New key family `days.*`: names, the neutral lock strings, the two landing templates, the quiet landing, the picker question, the "around" line, the next-year line; all from section 5, all through the rules test | (none cited in the row) |
| days | Browse days sheet | Hemisphere / Season names for the parent's hemisphere; a small switch in the row, not a setting elsewhere | (none cited in the row) |
| days | (no screen named) | Capture area moments view: a day with a ticked day shows no day name beside the cluster (label by date only). | (none cited in the row) |
| notifications | (no screen named) | Me > Reminders (screen id not read): a way to see, without changing volume, what the next notification will read like. `reminders.en.ts` has a "How it will look" preview and a "Next:" line already; they must call the same selection so the preview matches what arrives. | (none cited in the row) |
| notifications | (no screen named) | Me > Reminders: no new switch for the catalogue. Variety is not a setting. | (none cited in the row) |
| notifications | (no screen named) | No new screen for NS-48. NS-46 owns the days picker and "Days we mark". | (none cited in the row) |
| notifications | (no screen named) | Lock-screen neutral title and neutral placeholder strings for NS-46 and NS-47 days: "Something for the book today" is mine (sample `ntc.occ.neutral.01`); the direction's own wording is the same line. | (none cited in the row) |
| notifications | (no screen named) | Me, Reminders: no new switch here; the Photo moments switch lives with NS-51's settings, and Me, Reminders "Next:" preview must show a moment nudge's neutral wording through the same selection. | (none cited in the row) |
| notifications | (no screen named) | Capture area: a moments view that a tap lands on, with an empty state that never says "nothing found" or counts. | (none cited in the row) |
| cultural-data | (no screen named) | Permission explainer for the library (new screen needed) with no cultural wording; checked by this lens before design signs off. | (none cited in the row) |
| cultural-data | (no screen named) | Moments view: clusters labelled by date only, one visual treatment for every date. | (none cited in the row) |
| photos | new screen needed | One-choice sheet when a suggestion holds several photos | (none cited in the row) |
| photos | new screen needed; extends NS-01 Ready with a picture | Ready with a suggestion label (title, date) that reads as Apple's text, editable, clearable | (none cited in the row) |
| photos | new screen needed | Suggestion with no photo: one calm line, picture-less letter | (none cited in the row) |
| photos | new screen needed | Empty or cancelled picker, Journaling Suggestions off: "Pick a photo instead" | (none cited in the row) |
| photos | new screen needed (D area: reminders) | Me reminders page: one calm line about the phone's own journal suggestions being separate (FR-PHS-32) | PHS-32 |
| photos | owned by NS-50 | Home strip tile for the picker (NS-50) | (none cited in the row) |
| photos | `content` | Words: all lines by `content`, none implying the app finds, chooses, writes or understands a picture; banned: memory, moment, album, best, caption, AI, smart, suggested for you | (none cited in the row) |
| opportunities | New screen needed | A "Bring in" start and its picker states / FR-OPP-08 | OPP-08 |
| opportunities | (no screen named) | Review and the Book: a video's cover-frame chooser (new screen needed). | (none cited in the row) |

## 7. Checks and findings

### 7.1 Counts reconcile

- FR rows read from the 23 files: 949 (support 30; policy 15; marketing 44; operations 44; finance 34; data 44; privacy 48; legal 27; compliance 28; security 35; risk 7; back-office 36; messaging 46; languages 37; reliability 72; ai-and-speech 68; research 35; quality 31; lifecycle 43; print 56; days 33; notifications 31; cultural-data 36; photos 52; opportunities 17).
- Rows in the forward table: 949; distinct FR ids in it: 949; every FR id appears exactly once: yes.
- FR ids written in any of the 23 files that have no row: none (every cross-reference resolves).
- Gap in the source numbering: FR-SEC-13 has no row; GAP-LOG (K-SEC13 note) says the security author fills or retires it. FR-PHS numbers in bands and has no 05 to 09, 26 to 29, 35 to 39, 45 to 49 by design. FR-PRT-34a and FR-LCY-33 "(proposal)" are read as written.
- Proposed card changes read: 237; rulings after merging: 152. Questions read: 240; index entries: 190. Engineering rows read: 249; entries: 226 (new rows needed: 178). Design-needs rows read: 280.
- Rulings read from GAP-LOG: 41 (CB-1, CB-2, CB-3, CB-4, CB-5, CB-6, DL-1, DL-2, DL-3, DL-4, DL-5, DL-6, DL-7, DL-8, DL-9, DL-10, K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K-SEC13, N-1, N-2, N-3, N-4, N-5, N-6, N-7, N-8, R-IA-1, R-IA-2, R-IA-3, R-IA-4, R-IA-5, R-IA-6). FRs marked ruled: 36. Card-change rulings marked ruled or partly ruled: 17 of 152. Question entries ruled or partly ruled: 22 of 190. Conflicts ruled in full: 14 of 21 (plus 2 partly ruled).
- BL ids above BL-999 in the 23 files: none proposed. The string "BL-1000" appears twice, both times to say that ids from BL-1000 are invisible to the dispatcher (cultural-data, privacy); no function file allocates a BL id, every new row is "new row needed" and Karma allocates ids with `next-id.mjs`. Section 5 uses NR-nn working handles only. (The numbering rules at the top of `docs/BACKLOG.md` leave BL-055 to BL-099 unused; nothing here allocates in that range.)

### 7.2 Card links

- FRs whose Links column names at least one NS card: 706. Frame or every-card only: 40. No NS card in Links but one in the requirement text: 8. No card link at all: 195.
- FRs with no card link at all (the author named decisions, counsel questions, e2e screens, files, other FRs or code instead of a card row; some name a proposed card such as NS-AI, which is not a card number). Per the BRIEF each FR should name a card row or "new card row needed"; these name neither. Suggested card, where shown, comes from the card 19 screen table or from a linked FR that has a card; it is a suggestion only:

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
| FR-SUP-19 | support | `docs/ops/RELEASE.md`; FR-SUP-05 | via linked FR (SUP-05: NS-08) |
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
| FR-MKT-43 | marketing | FR-MKT-31; section 3c | none derivable |
| FR-MKT-44 | marketing | LEGAL-REQ-053; FR-MKT-06; FR-MKT-24; `docs/emails/CATALOG.md` `news-confirm` (later); counsel Q34 (waitlist class) | via linked FR (MKT-06: NS-08) |
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
| FR-FIN-32 | finance | FR-FIN-22; F13 | none derivable |
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
| FR-PRV-27 | privacy | Q56; PRIV-R10; E-S06; C-S10 | NS-41, NS-10 |
| FR-PRV-28 | privacy | E-S07, E-S08, E-S14, E-S24; D-039; J-N26; PRIV-R08 | NS-42, NS-41, NS-43, NS-39 |
| FR-PRV-31 | privacy | D-095, D-124; PRIV-R05, R13; label 2.2.0 Usage Data row | none derivable |
| FR-PRV-33 | privacy | C-S01 "Privacy" row (no screen id); `privacy.tsx`; PRIV-R17 | none derivable |
| FR-PRV-44 | privacy | FR-PRV-14; FR-SEC-01 to 03; `[X4-R1]` | via linked FR (SEC-01: NS-01, NS-02, NS-25, NS-41; SEC-03: NS-02, NS-11, NS-13) |
| FR-PRV-45 | privacy | FR-PRV-10; OBS-R10; D-124 | none derivable |
| FR-PRV-47 | privacy | Q-PM-4; FR-PRV-36 | via linked FR (PRV-36: NS-51, NS-52) |
| FR-LEG-19 | legal | all; LEGAL-REQ-064 | none derivable |
| FR-CMP-11 | compliance | `14-test-plan.md` section 6; LEGAL-REQ-042 path | none derivable |
| FR-CMP-16 | compliance | E-S07, C-S01; D-128; Privacy 9; Q48 | NS-42, NS-41 |
| FR-CMP-21 | compliance | CR-004, CR-005; skill section 5 | none derivable |
| FR-CMP-26 | compliance | FR-CMP-01; FR-LEG-24 | via linked FR (LEG-24: NS-51) |
| FR-CMP-28 | compliance | FR-CMP-05; FR-PRV-36 | via linked FR (CMP-05: NS-05, NS-07, NS-08, NS-26, NS-28; PRV-36: NS-51, NS-52) |
| FR-SEC-02 | security | J-E17, E-S15, BL-961, ADR 0031 | none derivable |
| FR-SEC-04 | security | J-E17, C-S19, E-S18, ADR 0031 | none derivable |
| FR-SEC-07 | security | C-S03, D1, E-S22 | NS-45 |
| FR-SEC-15 | security | design system COMPONENTS `GlassSurface`, DS2-07 | none derivable |
| FR-SEC-16 | security | ADR 0029 rule 7, E21, J-E21, LEGAL-REQ-040 | none derivable |
| FR-SEC-26 | security | `proposals/app-review-demo-signin.md` (project doc, not read here) | none derivable |
| FR-RSK-01 | risk | eval C 2.3, `14-test-plan.md:98` | none derivable |
| FR-RSK-02 | risk | Q28, Q23, SEC-R05, SEC-R23 | none derivable |
| FR-RSK-05 | risk | FR-SEC-10, FR-SEC-11, `docs/ops/runbooks/free-tier-ops.md` | via linked FR (SEC-10: NS-25; SEC-11: NS-41) |
| FR-RSK-06 | risk | E21, ADR 0029 rule 4 | none derivable |
| FR-RSK-07 | risk | FR-RSK-05; FIN addendum | none derivable |
| FR-BKO-03 | back-office | Card row: new card row needed; no screen; BL-237 | none derivable |
| FR-BKO-05 | back-office | BL-236 (done in part), BL-237; FR-SEC-20 (security events); no screen; new row needed | via linked FR (SEC-20: NS-06, NS-12, NS-25) |
| FR-BKO-06 | back-office | LEGAL-REQ-025; SEC-R25; FR-RSK-01; no screen; new row needed | none derivable |
| FR-BKO-08 | back-office | BL-598; FR-SUP-16; Q-BKO-2; no screen | via linked FR (SUP-16: NS-03, NS-23) |
| FR-BKO-09 | back-office | FR-SUP-15; `data-requests-by-email.md` sections 0 and 1; no screen; new row needed | via linked FR (SUP-15: NS-36) |
| FR-BKO-10 | back-office | BL-779 (as cited by the runbook); FR-OPS-06, FR-SUP-15; no screen | via linked FR (OPS-06: NS-06, NS-12, NS-16, NS-25; SUP-15: NS-36) |
| FR-BKO-11 | back-office | BL-237; FR-SUP-15; no screen; new row needed (only when a trigger trips) | via linked FR (SUP-15: NS-36) |
| FR-BKO-13 | back-office | FR-SUP-10, -16; `data-requests-by-email.md` section 0 | via linked FR (SUP-16: NS-03, NS-23) |
| FR-BKO-16 | back-office | FR-POL-06; Q50; no screen | none derivable |
| FR-BKO-17 | back-office | FR-OPS-01, -02; RSK-06; E-ST05 to E-ST13c; no new screen | via linked FR (OPS-01: NS-01, NS-02, NS-08, NS-09, NS-25; OPS-02: NS-02) |
| FR-BKO-18 | back-office | FR-OPS-01, -03; SEC-R25; RSK-22; open question 4 of `06-security-engineering.md`; no screen | via linked FR (OPS-01: NS-01, NS-02, NS-08, NS-09, NS-25; OPS-03: NS-08) |
| FR-BKO-19 | back-office | FR-OPS-01, -30; RELEASE.md section 9.6; E-ST05 to E-ST13c | via linked FR (OPS-01: NS-01, NS-02, NS-08, NS-09, NS-25) |
| FR-BKO-20 | back-office | FR-PRV-08 (the dump is encrypted to the founder's key), FR-OPS-07; LEGAL-REQ-026; no screen; new row needed | via linked FR (PRV-08: NS-08; OPS-07: NS-06, NS-12, NS-16, NS-36) |
| FR-BKO-21 | back-office | FR-POL-12; RSK-22; SEC-R12 (named in the security chapter's open question 2); no screen; new row needed | none derivable |
| FR-BKO-22 | back-office | `SECURITY.md:100-107`; `PACKS_HOSTING.md:86`; no screen | none derivable |
| FR-BKO-23 | back-office | FR-SUP-08, -17; FR-OPS-10, -11; FR-SEC-11; no screen; new row needed | via linked FR (SUP-08: NS-09, NS-35, NS-36; OPS-10: NS-25, NS-38, NS-39, NS-40, NS-41, NS-42; SEC-11: NS-41) |
| FR-BKO-24 | back-office | FR-SUP-16, -17; C-S01 "If you are struggling"; no screen | via linked FR (SUP-16: NS-03, NS-23) |
| FR-BKO-25 | back-office | FR-OPS-21, FR-OPS-03; no screen; new row needed | via linked FR (OPS-21: NS-10, NS-25; OPS-03: NS-08) |
| FR-LOC-25 | languages | FR-SUP-04, FR-SUP-10; C-S01 Help | via linked FR (SUP-04: NS-25) |
| FR-REL-05 | reliability | FR-OPS-20; E-ST02, E-ST03; new screen needed (status page) | via linked FR (OPS-20: NS-08) |
| FR-REL-06 | reliability | status.supabase.com; status.expo.dev | none derivable |
| FR-REL-10 | reliability | FR-OPS-11; E-ST02; new row needed | none derivable |
| FR-REL-11 | reliability | FR-PRV-08, PQ-3; FR-OPS-07 | via linked FR (PRV-08: NS-08; OPS-07: NS-06, NS-12, NS-16, NS-36) |
| FR-REL-14 | reliability | FR-OPS-07; E-ST47; new row needed | via linked FR (OPS-07: NS-06, NS-12, NS-16, NS-36) |
| FR-REL-16 | reliability | FR-OPS-35; `risk-security.md:275`; new row needed | none derivable |
| FR-REL-19 | reliability | E-ST02, E-ST05, K-E07; FR-OPS-19, FR-OPS-20; BL-997 | via linked FR (OPS-20: NS-08) |
| FR-REL-20 | reliability | FR-OPS-17; new row needed | via linked FR (OPS-17: NS-01, NS-02, NS-16, NS-18) |
| FR-REL-21 | reliability | FR-SUP-23; E-S13, E-S14; BL-367 (cited by support) | NS-41 |
| FR-REL-22 | reliability | FR-OPS-18, FR-OPS-12, FR-DAT-17; E-ST02; new row needed | via linked FR (OPS-12: NS-08; DAT-17: NS-07, NS-09, NS-35, NS-36) |
| FR-REL-24 | reliability | E-S13, E-ST40; FR-SEC-18; J-N18; new row needed | via linked FR (SEC-18: NS-01, NS-02, NS-06, NS-16, NS-18) |
| FR-REL-25 | reliability | FR-SUP-09; PRIV-R21; C-S-Me support rows; `06-nfr.md:366`; new row needed | none derivable |
| FR-REL-26 | reliability | FR-OPS-12, FR-OPS-18; E-ST02; new row needed (data-architect) | via linked FR (OPS-12: NS-08) |
| FR-REL-28 | reliability | FR-REL-01; FR-OPS-11; E-ST02; new row needed | via linked FR (REL-01: NS-10, NS-34, NS-35) |
| FR-REL-30 | reliability | FR-OPS-26, FR-OPS-29; RELEASE G5 | via linked FR (OPS-26: NS-05, NS-06, NS-07, NS-13, NS-23) |
| FR-REL-44 | reliability | E-ST05, K-E07; FR-OPS-02; `06-nfr.md:147, 400` (15 s pull); new row needed | via linked FR (OPS-02: NS-02) |
| FR-REL-51 | reliability | FR-FIN-03, FR-OPS-12, FR-OPS-13; E-ST02; BL-976; new row needed | via linked FR (FIN-03: NS-08, NS-10; OPS-12: NS-08) |
| FR-REL-52 | reliability | E-S05, E-S06, E-S14; FR-OPS-10, FR-FIN-07; `finance.md:100` | NS-41; via linked FR (OPS-10: NS-25, NS-38, NS-39, NS-40, NS-41, NS-42) |
| FR-REL-55 | reliability | E-ST02, E-S14; FR-SUP-20; new help article needed | NS-41 |
| FR-AIS-03 | ai-and-speech | NS-AI-R1; BL-new-A | none derivable |
| FR-AIS-15 | ai-and-speech | FR-AIS-35 to 41; BL-new-D | via linked FR (AIS-35: NS-34; AIS-36: NS-34; AIS-37: NS-34; AIS-41: NS-24, NS-29) |
| FR-AIS-18 | ai-and-speech | FR-AIS-17; privacy FR-PRV-16 | via linked FR (PRV-16: NS-01, NS-06, NS-21) |
| FR-AIS-19 | ai-and-speech | NS-AI-R2; FR-AIS-17; privacy FR-PRV-16; BL-new-E | via linked FR (PRV-16: NS-01, NS-06, NS-21) |
| FR-AIS-30 | ai-and-speech | FR-AIS-31; A-S07 | NS-44 |
| FR-AIS-31 | ai-and-speech | A-S07; B-S08; new card row needed (NS-AI-R3); BL-new-H | NS-44 |
| FR-AIS-39 | ai-and-speech | F05-REQ-006; BL-new-D | none derivable |
| FR-AIS-40 | ai-and-speech | CLAUDE.md; BL-new-A | none derivable |
| FR-AIS-47 | ai-and-speech | FR-AIS-17; privacy FR-PRV-02; compliance FR-CMP | via linked FR (PRV-02: NS-42) |
| FR-AIS-49 | ai-and-speech | FR-AIS-19; FR-AIS-02; BL-new-A | via linked FR (AIS-02: NS-06) |
| FR-AIS-50 | ai-and-speech | OPERATING_MODEL.md; risk-security RSK; BL-new-K | none derivable |
| FR-AIS-52 | ai-and-speech | FR-AIS-36; FR-AIS-50 | via linked FR (AIS-36: NS-34) |
| FR-AIS-60 | ai-and-speech | FR-AIS-57, 59; BL new row | via linked FR (AIS-57: NS-01, NS-49, NS-51; AIS-59: NS-01, NS-49, NS-51, NS-52) |
| FR-RSH-03 | research | 14-test-plan lines 7, 13, 90; README lines 151 to 156; S-B1 to S-B3; new row needed (`qa`, a founder-family flag profile for moderated sessions) | none derivable |
| FR-RSH-28 | research | 14-test-plan line 96 (G3); section 8 of this file; BL-981 | none derivable |
| FR-RSH-29 | research | Section 3; new row needed | none derivable |
| FR-QAL-02 | quality | G0; 14 intro; none; BL-002 (and the reworked #819 per 14) | none derivable |
| FR-QAL-03 | quality | G0, G5, G6; FR-CMP-11 gate record path; E-S27; none; new row needed | none derivable |
| FR-QAL-08 | quality | A-S01 to A-S07, B-S01 to B-S15, C-S01; `docs/design/system/BRIEF.md` s3 (cited by A 3a); new row needed | NS-44 |
| FR-QAL-11 | quality | A-U01 to A-U62; B, C, D journeys; J-E03 to J-E25; new row needed | none derivable |
| FR-QAL-14 | quality | all; none; none (nightly fuzz exists) | none derivable |
| FR-QAL-16 | quality | G0 to G6; none; new row needed | none derivable |
| FR-QAL-17 | quality | all; none; TDD 07 11.3 | none derivable |
| FR-QAL-18 | quality | G4; all; none | none derivable |
| FR-QAL-19 | quality | all; none; none | none derivable |
| FR-QAL-24 | quality | none; none; none | none derivable |
| FR-LCY-07 | lifecycle | new card row needed; none; new row needed (ops) | none derivable |
| FR-LCY-08 | lifecycle | none (outside the app); none; new row needed (release) | none derivable |
| FR-LCY-16 | lifecycle | none; E-S27 (App Store page); new row needed | none derivable |
| FR-LCY-24 | lifecycle | none; E-S16; new row needed (ops, with `legal`) | NS-45 |
| FR-LCY-27 | lifecycle | none; none; new row needed (support and legal runbook) | none derivable |
| FR-LCY-28 | lifecycle | none; none; new row needed (content rules test) | none derivable |
| FR-LCY-33 | lifecycle | new card row needed; new screen needed; new row needed | none derivable |
| FR-LCY-34 | lifecycle | new rows in `14-test-plan.md`; none; new row needed | none derivable |
| FR-PRT-03 | print | C-S05.ready; new help article | none derivable |
| FR-PRT-09 | print | PRT-S02; C28-5 | none derivable |
| FR-PRT-13 | print | PRT-S02; BK-14 solution 1 | none derivable |
| FR-PRT-15 | print | PRT-S02; E-S23 (accessibility walk) | none derivable |
| FR-PRT-17 | print | E-S04 to E-S07, PRT-S01; E-S18 | NS-41, NS-42 |
| FR-PRT-18 | print | PRT-S07; E-S07 (pattern); PRV rules | NS-42, NS-41 |
| FR-PRT-19 | print | PRT-S03; E-S27; CR-087, CR-054 | none derivable |
| FR-PRT-20 | print | PRT-S03 | none derivable |
| FR-PRT-21 | print | PRT-S03; CR-120 | none derivable |
| FR-PRT-22 | print | all PRT; finance.md FR-FIN-24 | via linked FR (FIN-24: NS-07, NS-30) |
| FR-PRT-23 | print | none | none derivable |
| FR-PRT-24 | print | PRT-S03; E-S07 | NS-42, NS-41 |
| FR-PRT-25 | print | none | none derivable |
| FR-PRT-26 | print | PRT-S04; E-S14 (offline) | NS-41 |
| FR-PRT-27 | print | PRT-S04; PRT-S06 | none derivable |
| FR-PRT-28 | print | PRT-S04, PRT-S06 | none derivable |
| FR-PRT-29 | print | PRT-S06; FR-SUP | none derivable |
| FR-PRT-30 | print | PRT-S06 | none derivable |
| FR-PRT-31 | print | PRT-S07; PRT-S04 | none derivable |
| FR-PRT-32 | print | PRT-S03; BK-16 legal | none derivable |
| FR-PRT-33 | print | E-S13; C-S01; DELETION_AND_EXPORT_SPEC (not re-read) | none derivable |
| FR-PRT-34a | print | PRT-S03; BK-16 | none derivable |
| FR-PRT-35 | print | PRT-S05; PRT-S02 | none derivable |
| FR-PRT-36 | print | PRT-S03; D-S18 | none derivable |
| FR-PRT-38 | print | PRT-S04; docs/emails | none derivable |
| FR-PRT-40 | print | PRT-S06; FR-SUP-04; Q-SUP-9 | via linked FR (SUP-04: NS-25) |
| FR-PRT-41 | print | PRT-S01; E-S13 | none derivable |
| FR-PRT-44 | print | PRT-S04; FR-DAT | none derivable |
| FR-PRT-45 | print | all | none derivable |
| FR-PRT-46 | print | PRT-S03, PRT-S07 | none derivable |
| FR-PRT-47 | print | all order screens | none derivable |
| FR-DAY-21 | days | `functions/support.md`; BL: new row needed (NR-DAY-13) | none derivable |
| FR-DAY-32 | days | FR-DAY-04, 20; FR-CUL-29 | via linked FR (DAY-04: NS-18, NS-46; DAY-20: NS-46; CUL-29: NS-51) |
| FR-NTC-15 | notifications | new card row needed; new row needed | none derivable |
| FR-NTC-31 | notifications | FR-NTC-17; `CLAUDE.md` privacy rules | via linked FR (NTC-17: NS-48) |
| FR-CUL-31 | cultural-data | FR-DAY-29; FR-CUL-20 | via linked FR (DAY-29: NS-51; CUL-20: NS-47) |
| FR-CUL-34 | cultural-data | FR-CUL-08; FR-PRV-10 | via linked FR (CUL-08: NS-47) |
| FR-CUL-35 | cultural-data | FR-DAY-29, 32; `CLAUDE.md` privacy rules | via linked FR (DAY-29: NS-51) |
| FR-CUL-36 | cultural-data | FR-CUL-27 | via linked FR (CUL-27: NS-47) |
| FR-PHS-34 | photos | `app.config.ts:257`; new row needed | none derivable |
| FR-PHS-42 | photos | new ADR; new row needed | none derivable |
| FR-PHS-43 | photos | CLAUDE.md content rules; direction 4.2 | none derivable |
| FR-PHS-56 | photos | new counsel number needed | none derivable |
| FR-OPP-09 | opportunities | Q45, Q48 as cited in research-validation | none derivable |
| FR-OPP-10 | opportunities | `functions/research-validation.md` FR-RSH-01 to 03, 14, 15, 21, 24 | via linked FR (RSH-02: NS-03; RSH-14: NS-03; RSH-15: NS-03; RSH-21: NS-03, NS-23; RSH-24: NS-03) |
| FR-OPP-12 | opportunities | All A to E areas; G-05 | none derivable |
| FR-OPP-17 | opportunities | `research-validation.md` FR-RSH-01 to 03, 21 | via linked FR (RSH-02: NS-03; RSH-21: NS-03, NS-23) |

- FRs whose card appears only in the requirement text: OPS-30, FIN-31, FIN-34, DAT-31, DAT-34, PRV-25, SEC-34, QAL-04.
- No-card-link counts by function code: AIS 13, BKO 18, CMP 5, CUL 4, DAT 3, DAY 2, FIN 7, LCY 8, LEG 1, LOC 1, MKT 8, NTC 2, OPP 4, OPS 7, PHS 4, POL 7, PRT 31, PRV 16, QAL 10, REL 19, RSH 3, RSK 5, SEC 6, SUP 11.

### 7.3 e2e screen ids and backlog links

- FRs with no e2e screen id in Links or text: 595 of 949 (many are policy, finance, data or documentation requirements with no screen). They are: SUP-03, SUP-04, SUP-05, SUP-06, SUP-07, SUP-08, SUP-09, SUP-10, SUP-11, SUP-15, SUP-16, SUP-17, SUP-19, SUP-20, SUP-21, SUP-22, SUP-23, POL-01, POL-02, POL-03, POL-04, POL-05, POL-06, POL-08, POL-09, POL-10, POL-11, POL-12, POL-13, SUP-24, SUP-25, SUP-26, SUP-27, SUP-28, SUP-29, SUP-30, POL-14, POL-15, MKT-02, MKT-05, MKT-07, MKT-26, MKT-27, MKT-31, MKT-32, MKT-34, MKT-35, MKT-38, MKT-39, MKT-40, MKT-42, MKT-43, MKT-44, OPS-05, OPS-06, OPS-08, OPS-09, OPS-15, OPS-17, OPS-18, OPS-22, OPS-23, OPS-24, OPS-26, OPS-27, OPS-28, OPS-29, OPS-32, OPS-34, OPS-35, OPS-37, OPS-38, OPS-39, OPS-40, OPS-41, OPS-42, OPS-43, OPS-44, FIN-01, FIN-02, FIN-03, FIN-04, FIN-05, FIN-06, FIN-08, FIN-14, FIN-15, FIN-16, FIN-17, FIN-18, FIN-19, FIN-20, FIN-21, FIN-22, FIN-23, FIN-24, FIN-25, FIN-26, FIN-27, FIN-28, FIN-29, FIN-31, FIN-32, FIN-33, FIN-34, DAT-01, DAT-04, DAT-05, DAT-06, DAT-07, DAT-08, DAT-09, DAT-10, DAT-11, DAT-12, DAT-14, DAT-16, DAT-17, DAT-18, DAT-19, DAT-20, DAT-22, DAT-23, DAT-24, DAT-25, DAT-26, DAT-27, DAT-28, DAT-29, DAT-30, DAT-31, DAT-32, DAT-33, DAT-36, DAT-38, DAT-39, DAT-40, DAT-41, DAT-42, DAT-43, DAT-44, PRV-06, PRV-07, PRV-08, PRV-09, PRV-11, PRV-12, PRV-13, PRV-17, PRV-19, PRV-21, PRV-22, PRV-23, PRV-25, PRV-35, PRV-29, PRV-30, PRV-31, PRV-34, PRV-36, PRV-38, PRV-39, PRV-40, PRV-42, PRV-43, PRV-44, PRV-45, PRV-46, PRV-47, PRV-48, LEG-13, LEG-14, LEG-17, LEG-18, LEG-19, LEG-21, LEG-22, LEG-23, LEG-24, LEG-25, LEG-26, LEG-27, CMP-01, CMP-02, CMP-04, CMP-05, CMP-10, CMP-11, CMP-12, CMP-14, CMP-19, CMP-20, CMP-21, CMP-22, CMP-23, CMP-24, CMP-25, CMP-26, CMP-28, SEC-03, SEC-14, SEC-15, SEC-16, SEC-17, SEC-18, SEC-19, SEC-20, SEC-24, SEC-26, RSK-01, RSK-02, RSK-03, RSK-04, RSK-05, RSK-06, SEC-27, SEC-28, SEC-29, SEC-30, SEC-31, SEC-32, SEC-33, SEC-34, SEC-35, SEC-36, RSK-07, BKO-01, BKO-02, BKO-03, BKO-04, BKO-05, BKO-06, BKO-08, BKO-09, BKO-10, BKO-11, BKO-13, BKO-16, BKO-18, BKO-20, BKO-21, BKO-22, BKO-23, BKO-25, BKO-28, BKO-29, BKO-30, BKO-31, BKO-32, BKO-33, BKO-34, BKO-35, BKO-36, MSG-13, MSG-37, MSG-39, MSG-41, MSG-42, MSG-43, MSG-44, MSG-45, MSG-46, LOC-02, LOC-03, LOC-04, LOC-05, LOC-06, LOC-12, LOC-19, LOC-21, LOC-22, LOC-23, LOC-26, LOC-27, LOC-29, LOC-30, LOC-31, LOC-32, LOC-33, LOC-34, LOC-35, LOC-36, LOC-37, REL-04, REL-06, REL-08, REL-09, REL-11, REL-12, REL-16, REL-17, REL-20, REL-23, REL-25, REL-27, REL-29, REL-30, REL-31, REL-34, REL-35, REL-38, REL-39, REL-46, REL-47, REL-50, REL-53, REL-56, REL-57, REL-60, REL-62, REL-63, REL-64, REL-65, REL-66, REL-68, REL-69, REL-70, REL-71, REL-72, AIS-01, AIS-02, AIS-03, AIS-04, AIS-05, AIS-06, AIS-08, AIS-10, AIS-11, AIS-12, AIS-15, AIS-17, AIS-18, AIS-19, AIS-21, AIS-22, AIS-23, AIS-24, AIS-26, AIS-28, AIS-32, AIS-33, AIS-34, AIS-35, AIS-36, AIS-37, AIS-38, AIS-39, AIS-40, AIS-41, AIS-42, AIS-43, AIS-45, AIS-46, AIS-47, AIS-48, AIS-49, AIS-50, AIS-51, AIS-52, AIS-53, AIS-54, AIS-57, AIS-58, AIS-59, AIS-60, AIS-61, AIS-62, AIS-63, AIS-64, AIS-65, AIS-66, AIS-67, AIS-68, RSH-01, RSH-02, RSH-03, RSH-13, RSH-14, RSH-15, RSH-17, RSH-18, RSH-19, RSH-20, RSH-22, RSH-23, RSH-24, RSH-25, RSH-26, RSH-27, RSH-28, RSH-29, RSH-30, RSH-31, RSH-33, RSH-34, RSH-35, QAL-01, QAL-02, QAL-04, QAL-10, QAL-11, QAL-12, QAL-13, QAL-14, QAL-15, QAL-16, QAL-17, QAL-18, QAL-19, QAL-21, QAL-23, QAL-24, QAL-25, QAL-26, QAL-27, QAL-28, QAL-29, QAL-30, QAL-31, LCY-06, LCY-07, LCY-08, LCY-14, LCY-18, LCY-23, LCY-27, LCY-28, LCY-29, LCY-31, LCY-32, LCY-34, LCY-35, LCY-36, LCY-38, LCY-39, LCY-40, LCY-41, LCY-42, LCY-43, PRT-04, PRT-06, PRT-08, PRT-09, PRT-10, PRT-12, PRT-13, PRT-20, PRT-21, PRT-22, PRT-23, PRT-25, PRT-27, PRT-28, PRT-29, PRT-30, PRT-31, PRT-32, PRT-34a, PRT-35, PRT-38, PRT-39, PRT-40, PRT-43, PRT-44, PRT-45, PRT-46, PRT-47, PRT-34, PRT-48, PRT-49, PRT-50, PRT-51, PRT-52, PRT-53, PRT-54, PRT-55, DAY-01, DAY-13, DAY-14, DAY-18, DAY-20, DAY-21, DAY-22, DAY-23, DAY-24, DAY-25, DAY-26, DAY-28, DAY-29, DAY-30, DAY-31, DAY-32, DAY-33, NTC-01, NTC-02, NTC-03, NTC-04, NTC-05, NTC-06, NTC-07, NTC-08, NTC-09, NTC-10, NTC-11, NTC-12, NTC-13, NTC-14, NTC-15, NTC-16, NTC-17, NTC-18, NTC-19, NTC-20, NTC-21, NTC-22, NTC-23, NTC-24, NTC-25, NTC-26, NTC-27, NTC-28, NTC-29, NTC-30, NTC-31, CUL-05, CUL-06, CUL-08, CUL-09, CUL-11, CUL-14, CUL-20, CUL-22, CUL-24, CUL-27, CUL-28, CUL-29, CUL-30, CUL-31, CUL-32, CUL-33, CUL-34, CUL-35, CUL-36, PHS-02, PHS-03, PHS-04, PHS-11, PHS-12, PHS-15, PHS-19, PHS-20, PHS-21, PHS-22, PHS-23, PHS-24, PHS-25, PHS-30, PHS-33, PHS-34, PHS-40, PHS-41, PHS-42, PHS-43, PHS-44, PHS-50, PHS-51, PHS-52, PHS-53, PHS-54, PHS-55, PHS-56, PHS-57, PHS-58, PHS-59, PHS-60, PHS-61, PHS-62, PHS-63, PHS-64, PHS-65, PHS-66, PHS-67, PHS-68, PHS-69, PHS-70, PHS-71, OPP-01, OPP-09, OPP-10, OPP-12, OPP-13, OPP-14, OPP-15, OPP-16, OPP-17.
- FRs that say "new screen needed" in Links: PRV-01, BKO-14, BKO-15, BKO-17, MSG-07, MSG-40, REL-05, REL-45, RSH-32, LCY-11, LCY-33, PRT-05, PRT-07, DAY-02, DAY-04, DAY-05, DAY-06, DAY-09, DAY-11, DAY-12, DAY-15, DAY-16, DAY-17, PHS-01, PHS-10, PHS-13, PHS-14, PHS-16, PHS-17, PHS-18, PHS-31, PHS-32.
- Screen ids in FR rows that are not in the five DESIGN.md files: A-S01, A-S03, A-S04, A-S05, A-S06, A-S07, A-S08, A-S09, A-S10, A-S13, A-S14, B-S01, B-S02, B-S04, B-S05, B-S06, B-S08, B-S11, B-S12, B-S13, B-S14, B-S15, B-S16, B-S17, B-S18, B-S19, B-S20, C-S01, C-S02, C-S03, C-S04, C-S05, C-S06, C-S08, C-S09, C-S10, C-S11, C-S12, C-S15, C-S18, C-S19, C-S20, C-S21, C-S24, D-S01, D-S02, D-S03, D-S04, D-S05, D-S06, D-S07, D-S08, D-S09, D-S10, D-S11, D-S13, D-S14, D-S15, D-S16, D-S18, D-S19, D-S20, D-S23, D-S24, E-S01, E-S02, E-S03, E-S04, E-S05, E-S06, E-S07, E-S08, E-S09, E-S10, E-S11, E-S12, E-S13, E-S14, E-S15, E-S16, E-S17, E-S18, E-S19, E-S20, E-S22, E-S23, E-S24, E-S25, E-S26, E-S27, E-S28, E-S29, E-ST01, E-ST02, E-ST03, E-ST04, E-ST05, E-ST10, E-ST11, E-ST13a, E-ST13b, E-ST13c, E-ST17, E-ST18, E-ST29, E-ST32, E-ST34, E-ST35, E-ST36, E-ST37, E-ST38, E-ST39, E-ST40, E-ST41, E-ST46, E-ST47. (116 distinct ids in FR rows; the design inventory holds 0 ids.)
- FRs with no backlog row named in Links, text or any engineering table: 463 of 949. Many are docs, founder or counsel items; Karma decides which need a row: SUP-04, SUP-05, SUP-07, SUP-08, SUP-09, SUP-10, SUP-11, SUP-19, SUP-20, SUP-21, SUP-22, POL-01, POL-03, POL-05, POL-06, POL-08, POL-09, POL-11, POL-12, POL-13, SUP-26, SUP-27, SUP-29, SUP-30, POL-14, POL-15, MKT-01, MKT-03, MKT-04, MKT-05, MKT-06, MKT-07, MKT-08, MKT-09, MKT-10, MKT-11, MKT-12, MKT-13, MKT-14, MKT-15, MKT-16, MKT-17, MKT-19, MKT-21, MKT-22, MKT-24, MKT-27, MKT-28, MKT-29, MKT-30, MKT-31, MKT-32, MKT-33, MKT-34, MKT-37, MKT-38, MKT-39, MKT-41, MKT-42, MKT-43, MKT-44, OPS-02, OPS-10, OPS-11, OPS-13, OPS-17, OPS-24, OPS-26, OPS-27, OPS-28, OPS-29, OPS-31, OPS-32, OPS-33, OPS-36, OPS-34, OPS-38, OPS-39, OPS-40, OPS-41, OPS-42, OPS-43, FIN-01, FIN-05, FIN-07, FIN-12, FIN-13, FIN-14, FIN-15, FIN-16, FIN-17, FIN-18, FIN-19, FIN-21, FIN-22, FIN-23, FIN-24, FIN-26, FIN-27, FIN-28, FIN-29, FIN-30, FIN-31, FIN-32, FIN-33, FIN-34, DAT-02, DAT-03, DAT-09, DAT-14, DAT-16, DAT-17, DAT-18, DAT-19, DAT-20, DAT-21, DAT-22, DAT-23, DAT-24, DAT-25, DAT-27, DAT-28, DAT-29, DAT-30, DAT-31, DAT-32, DAT-34, DAT-35, DAT-37, DAT-38, DAT-39, DAT-40, DAT-41, DAT-42, DAT-43, DAT-44, PRV-23, PRV-30, PRV-32, PRV-33, PRV-36, PRV-37, PRV-38, PRV-39, PRV-40, PRV-41, PRV-42, PRV-43, PRV-44, PRV-45, PRV-46, PRV-47, PRV-48, LEG-04, LEG-05, LEG-06, LEG-08, LEG-11, LEG-14, LEG-16, LEG-17, LEG-19, LEG-20, LEG-21, LEG-22, LEG-23, LEG-24, LEG-25, LEG-26, LEG-27, CMP-02, CMP-05, CMP-06, CMP-07, CMP-08, CMP-12, CMP-13, CMP-17, CMP-18, CMP-19, CMP-20, CMP-21, CMP-22, CMP-23, CMP-24, CMP-25, CMP-26, CMP-27, CMP-28, SEC-04, SEC-05, SEC-07, SEC-08, SEC-21, SEC-22, SEC-09, SEC-12, SEC-23, SEC-15, SEC-17, SEC-19, SEC-24, SEC-25, SEC-26, RSK-01, RSK-02, RSK-03, RSK-04, RSK-05, RSK-06, SEC-28, SEC-29, SEC-30, SEC-31, SEC-32, SEC-33, SEC-35, SEC-36, RSK-07, BKO-29, BKO-30, BKO-31, BKO-32, BKO-33, BKO-34, BKO-35, BKO-36, MSG-12, MSG-18, MSG-19, MSG-20, MSG-21, MSG-22, MSG-28, MSG-39, MSG-40, MSG-41, MSG-42, MSG-43, MSG-44, MSG-45, MSG-46, LOC-02, LOC-04, LOC-05, LOC-06, LOC-07, LOC-08, LOC-09, LOC-13, LOC-14, LOC-16, LOC-20, LOC-21, LOC-22, LOC-23, LOC-24, LOC-25, LOC-27, LOC-29, LOC-31, LOC-32, LOC-33, LOC-34, LOC-35, LOC-36, LOC-37, REL-05, REL-06, REL-17, REL-27, REL-29, REL-30, REL-33, REL-35, REL-36, REL-50, REL-52, REL-53, REL-61, REL-62, REL-63, REL-64, REL-65, REL-66, REL-67, REL-68, REL-69, REL-70, REL-71, REL-72, AIS-05, AIS-06, AIS-08, AIS-14, AIS-16, AIS-29, AIS-30, AIS-33, AIS-34, AIS-37, AIS-38, AIS-41, AIS-44, AIS-46, AIS-47, AIS-48, AIS-53, AIS-54, AIS-56, AIS-58, AIS-59, AIS-61, AIS-63, AIS-64, AIS-65, AIS-66, AIS-67, AIS-68, RSH-13, RSH-17, RSH-18, RSH-19, RSH-21, RSH-22, RSH-23, RSH-26, RSH-27, RSH-30, RSH-31, RSH-33, RSH-34, RSH-35, QAL-12, QAL-13, QAL-14, QAL-17, QAL-18, QAL-19, QAL-20, QAL-21, QAL-23, QAL-24, QAL-26, QAL-27, QAL-28, QAL-29, QAL-30, QAL-31, LCY-10, LCY-13, LCY-32, LCY-38, LCY-41, LCY-42, LCY-43, PRT-02, PRT-03, PRT-04, PRT-16, PRT-17, PRT-18, PRT-21, PRT-22, PRT-24, PRT-25, PRT-34a, PRT-35, PRT-36, PRT-37, PRT-39, PRT-43, PRT-45, PRT-46, PRT-47, PRT-34, PRT-48, PRT-49, PRT-50, PRT-51, PRT-52, PRT-53, PRT-54, PRT-55, DAY-22, DAY-23, DAY-24, DAY-26, DAY-27, DAY-28, DAY-29, DAY-30, DAY-31, DAY-32, DAY-33, NTC-08, NTC-11, NTC-16, NTC-19, NTC-20, NTC-21, NTC-22, NTC-25, NTC-26, NTC-27, NTC-29, NTC-30, NTC-31, CUL-03, CUL-13, CUL-14, CUL-17, CUL-18, CUL-20, CUL-22, CUL-24, CUL-25, CUL-26, CUL-27, CUL-28, CUL-29, CUL-30, CUL-31, CUL-32, CUL-33, CUL-34, CUL-35, CUL-36, PHS-04, PHS-24, PHS-25, PHS-31, PHS-32, PHS-43, PHS-44, PHS-52, PHS-53, PHS-54, PHS-56, PHS-57, PHS-58, PHS-59, PHS-60, PHS-61, PHS-62, PHS-63, PHS-64, PHS-65, PHS-66, PHS-67, PHS-68, PHS-69, PHS-70, PHS-71, OPP-01, OPP-09, OPP-10, OPP-12, OPP-13, OPP-14, OPP-15, OPP-16, OPP-17.
- BL ids cited by FR rows that do not appear in `docs/BACKLOG.md`: none. Several are ids the function file says it has not read on this branch (for example BL-999, BL-997, BL-992 in the reliability file are range-end ids the backlog may not carry yet); Karma checks them against `next-id.mjs` before the rows are filed.

### 7.4 Coverage tables

- Functions with a per-card verdict table but gaps in it: messaging has no verdict row for NS-43, NS-44, NS-45; languages has no verdict row for NS-03, NS-04, NS-06, NS-08, NS-09, NS-11, NS-12, NS-13, NS-14, NS-15, NS-18, NS-19, NS-20, NS-21, NS-22, NS-25, NS-26, NS-27, NS-28, NS-29, NS-30, NS-31, NS-32, NS-34, NS-35, NS-37; quality has no verdict row for NS-26, NS-27, NS-28, NS-29, NS-30, NS-31; print has no verdict row for NS-02, NS-03, NS-04, NS-05, NS-09, NS-10, NS-13, NS-14, NS-15, NS-16, NS-18, NS-19, NS-20, NS-21, NS-23, NS-26, NS-27, NS-29, NS-31, NS-32, NS-33, NS-34, NS-35, NS-36, NS-37, NS-38, NS-39, NS-40, NS-41, NS-42, NS-43, NS-44, NS-45; days has no verdict row for NS-38, NS-39, NS-40, NS-41, NS-42, NS-43, NS-44, NS-45; cultural-data has no verdict row for NS-02, NS-03, NS-04, NS-05, NS-06, NS-07, NS-08, NS-09, NS-10, NS-12, NS-14, NS-15, NS-16, NS-17, NS-19, NS-20, NS-21, NS-22, NS-23, NS-24, NS-26, NS-27, NS-28, NS-29, NS-30, NS-31, NS-33, NS-34, NS-35, NS-37, NS-38, NS-42, NS-43.
- Functions with no per-card verdict table: back-office, research, notifications, photos, opportunities.
- No function gives a verdict for NS-46 to NS-50 (no function reviewed them: they were written afterwards, in card 21); the days, cultural-data, notification-catalogue, photos and opportunities files outline them.

### 7.5 What the parser could not read

- back-office: no per-card verdicts read.
- research: no per-card verdicts read.
- notifications: no card changes read.
- notifications: no per-card verdicts read.
- photos: no per-card verdicts read.
- opportunities: no per-card verdicts read.
- Notification catalogue has no table of card changes (it proposes the new card NS-48 in its section 11 instead); its engineering section is a paragraph ("New rows needed ...; Existing rows ...") plus a table of planner changes, both read.
- Back-office gives its verdict by back-office area (section 2.3), not by card; those verdicts are not in the reverse view.
- Research, photos and opportunities give a coverage check and no per-card verdict.
- Quality's P0 register (3a, 3b, 3c, and Annex A to I) are index lines and test annexes, not FR rows; only the 24 FR-QAL rows are read as requirements. Annexes A to I (case tables, fixtures, charters, gate artifacts) are test annexes and are not parsed.
- Photos: one row in the question table ("Existing numbers") is a note and is skipped. FR-PHS-05 to 09 and other band gaps are not missing rows.
- Some engineering and design bullets in the research, opportunities, photos and notifications files are prose items; each bullet is read as one row, and a bullet that names no screen is listed under 6.F.
- Where a function file reads a bare number list in an FR column (for example lifecycle "01, 02, 09, 21") it is read as FR ids of that file's own code.

### 7.6 ASCII scan

- Characters above 127 in this file: 0 (em dash, en dash, curly quotes, ellipsis character, emoji all count). The source files had 0.
