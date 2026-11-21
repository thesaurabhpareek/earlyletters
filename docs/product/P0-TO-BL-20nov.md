# Every P0 requirement id and the backlog row that names it (21 Nov 2026)

Status: CURRENT, 21 Nov 2026 | Owner: `product` | Load when: someone asks "does this P0 row have a backlog row" (gate G0).

Generated, not written by hand: `python3 -I docs/product/prd/tools/review/p0.py . --map`, then checked with `python3 -I docs/product/prd/tools/review/p0.py . --check-map docs/product/P0-TO-BL-20nov.md` (exit 0 means every P0 id is here, none maps to nothing, and every BL id has a heading in `docs/BACKLOG.md`). Pinned to `develop` `bc143cc` plus BL-1158 to BL-1182 (the first split batch, `docs/product/P0-SPLIT-PLAN-21nov.md`). Nothing here changes a requirement.

How to read the last column:
- `named in a row`: a backlog row (not a proposed group row) lists the id or a range that holds it.
- `cited in the requirement text`: the requirement's own text cites a BL row that exists.
- `proposed group row`: only one of the 38 group rows filed from `BACKLOG-GAPS.md` names it. It has a BL id, but the row is `proposed`, often size L, and has to be split or set `ready` before it counts as built work. Strict G0 (a row of its own) is the `named in a row` and `cited` lines only.
- `NONE`: nobody names it. There must be none.

Counts of the table below (the generator's own output, 21 Nov 2026, 1,052 rows):

| How | Rows |
|---|---|
| named in a row | 548 |
| cited in the requirement text | 77 |
| proposed group row | 427 |

Strict G0 holds for 625 of 1,052 (548 plus 77). On `develop` `bc143cc` alone, before BL-1158 to BL-1182, the generator gives 292 named, 77 cited and 683 proposed group rows (369 of 1,052 strict, 683 not). Batch 1 (BL-1158 to BL-1182) moved 101 rows to 393 named, 77 cited and 582 proposed (470 strict); batch 2 (BL-1209 to BL-1234, written on `develop` `0ee5339`) moved 155 more to 548 named, 77 cited and 427 proposed (625 strict). Earlier text that says 368 and 684 (`READINESS-20nov.md`) came from an earlier head and could not be reproduced on `bc143cc`.

| P0 id | Card or file | BL id | How |
|---|---|---|---|
| NS-01-R13a | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R13b | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R14 | 01-photo-with-a-letter.md | BL-868 | named in a row |
| NS-01-R15 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R16a | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R16b | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R16c | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R17a | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R17c | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R18 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R21b | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R22 | 01-photo-with-a-letter.md | BL-1006 | named in a row |
| NS-01-R25 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R26 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R27 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R29 | 01-photo-with-a-letter.md | BL-961 | named in a row |
| NS-01-R30 | 01-photo-with-a-letter.md | BL-961 | named in a row |
| NS-01-R31 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R32 | 01-photo-with-a-letter.md | BL-955, BL-965 | named in a row |
| NS-01-R33 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R35 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R36 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R37a | 01-photo-with-a-letter.md | BL-953 | named in a row |
| NS-01-R38a | 01-photo-with-a-letter.md | BL-954 | named in a row |
| NS-01-R38b | 01-photo-with-a-letter.md | BL-954 | named in a row |
| NS-01-R4 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R49 | 01-photo-with-a-letter.md | BL-962 | named in a row |
| NS-01-R50 | 01-photo-with-a-letter.md | BL-962, BL-287 | named in a row |
| NS-01-R51 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R52 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R55 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R6 | 01-photo-with-a-letter.md | BL-868 | named in a row |
| NS-01-R61 | 01-photo-with-a-letter.md | BL-870 | cited in the requirement text |
| NS-01-R62 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R8 | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R9a | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-01-R9b | 01-photo-with-a-letter.md | BL-126 | proposed group row |
| NS-02-R14 | 02-find.md | BL-952 | named in a row |
| NS-02-R15 | 02-find.md | BL-952 | named in a row |
| NS-02-R16a | 02-find.md | BL-952 | named in a row |
| NS-02-R16b | 02-find.md | BL-952 | named in a row |
| NS-02-R16c | 02-find.md | BL-952 | named in a row |
| NS-02-R16d | 02-find.md | BL-952 | named in a row |
| NS-02-R18 | 02-find.md | BL-952 | named in a row |
| NS-02-R22 | 02-find.md | BL-952, BL-1078 | named in a row |
| NS-02-R24 | 02-find.md | BL-952, BL-961 | named in a row |
| NS-02-R25 | 02-find.md | BL-952 | named in a row |
| NS-02-R26 | 02-find.md | BL-952, BL-962 | named in a row |
| NS-02-R31 | 02-find.md | BL-952 | named in a row |
| NS-02-R4 | 02-find.md | BL-952 | named in a row |
| NS-02-R44 | 02-find.md | BL-952 | named in a row |
| NS-02-R47 | 02-find.md | BL-952 | named in a row |
| NS-02-R48 | 02-find.md | BL-952 | named in a row |
| NS-02-R49 | 02-find.md | BL-952 | named in a row |
| NS-02-R5 | 02-find.md | BL-952 | named in a row |
| NS-03-R1 | 03-family-hears-it-pilot.md | BL-129 | named in a row |
| NS-03-R2 | 03-family-hears-it-pilot.md | BL-129 | named in a row |
| NS-03-R3 | 03-family-hears-it-pilot.md | BL-1234 | named in a row |
| NS-03-R4 | 03-family-hears-it-pilot.md | BL-129 | named in a row |
| NS-03-R5 | 03-family-hears-it-pilot.md | BL-129 | named in a row |
| NS-03-R7 | 03-family-hears-it-pilot.md | BL-129 | named in a row |
| NS-03-R8 | 03-family-hears-it-pilot.md | BL-132 | named in a row |
| NS-04-R2 | 04-hands-free-capture-spike.md | BL-972 | named in a row |
| NS-04-R4 | 04-hands-free-capture-spike.md | BL-972, BL-290 | named in a row |
| NS-04-R5 | 04-hands-free-capture-spike.md | BL-972 | named in a row |
| NS-04-R6 | 04-hands-free-capture-spike.md | BL-972 | named in a row |
| NS-04-R7 | 04-hands-free-capture-spike.md | BL-972 | named in a row |
| NS-04-R8 | 04-hands-free-capture-spike.md | BL-972 | named in a row |
| NS-05-R10a | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R10b | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R12 | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R16a | 05-share-one-letter.md | BL-939 | named in a row |
| NS-05-R16b | 05-share-one-letter.md | BL-939 | named in a row |
| NS-05-R18 | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R21 | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R25 | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R27 | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R3a | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R3b | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R4a | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R5a | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R5b | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R6a | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R6b | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-05-R7 | 05-share-one-letter.md | BL-126 | proposed group row |
| NS-06-A13 | 06-firsts-sealed-letter-quick-capture.md | BL-968 | named in a row |
| NS-06-A15 | 06-firsts-sealed-letter-quick-capture.md | BL-968 | named in a row |
| NS-06-A17 | 06-firsts-sealed-letter-quick-capture.md | BL-968 | named in a row |
| NS-06-A22 | 06-firsts-sealed-letter-quick-capture.md | BL-962, BL-968, BL-287 | named in a row |
| NS-06-A25 | 06-firsts-sealed-letter-quick-capture.md | BL-968 | named in a row |
| NS-06-A2a | 06-firsts-sealed-letter-quick-capture.md | BL-968 | named in a row |
| NS-06-A4 | 06-firsts-sealed-letter-quick-capture.md | BL-968 | named in a row |
| NS-06-A5 | 06-firsts-sealed-letter-quick-capture.md | BL-968 | named in a row |
| NS-06-B1 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B10 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B12 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B16 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B17 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B18 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B1b | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B2 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B20 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B21 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B22 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B23 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B26 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B5 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B6 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B8 | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-B8b | 06-firsts-sealed-letter-quick-capture.md | BL-969 | named in a row |
| NS-06-C1 | 06-firsts-sealed-letter-quick-capture.md | BL-971 | named in a row |
| NS-06-C2 | 06-firsts-sealed-letter-quick-capture.md | BL-971 | named in a row |
| NS-06-C3 | 06-firsts-sealed-letter-quick-capture.md | BL-971 | named in a row |
| NS-06-C4 | 06-firsts-sealed-letter-quick-capture.md | BL-971 | named in a row |
| NS-06-C7 | 06-firsts-sealed-letter-quick-capture.md | BL-971 | named in a row |
| NS-06-C9 | 06-firsts-sealed-letter-quick-capture.md | BL-971 | named in a row |
| NS-07-C28-11 | 07-remaining-capability-rows.md | BL-973 | named in a row |
| NS-07-C28-12 | 07-remaining-capability-rows.md | BL-973 | named in a row |
| NS-07-C28-13 | 07-remaining-capability-rows.md | BL-973, BL-299 | named in a row |
| NS-07-C28-17 | 07-remaining-capability-rows.md | BL-973 | named in a row |
| NS-07-C28-18 | 07-remaining-capability-rows.md | BL-973 | named in a row |
| NS-07-C28-2 | 07-remaining-capability-rows.md | BL-973 | named in a row |
| NS-07-C28-3 | 07-remaining-capability-rows.md | BL-973 | named in a row |
| NS-07-C28-4 | 07-remaining-capability-rows.md | BL-973 | named in a row |
| NS-07-C28-5 | 07-remaining-capability-rows.md | BL-973 | named in a row |
| NS-07-C5-12 | 07-remaining-capability-rows.md | BL-974 | named in a row |
| NS-07-C5-3 | 07-remaining-capability-rows.md | BL-974 | named in a row |
| NS-07-C5-9 | 07-remaining-capability-rows.md | BL-974 | named in a row |
| NS-07-G11-1a | 07-remaining-capability-rows.md | BL-975 | named in a row |
| NS-07-G11-3 | 07-remaining-capability-rows.md | BL-975 | named in a row |
| NS-08-R10 | 08-keeping-and-trust.md | BL-1179 | named in a row |
| NS-08-R11 | 08-keeping-and-trust.md | BL-1179 | named in a row |
| NS-08-R13 | 08-keeping-and-trust.md | BL-1179 | named in a row |
| NS-08-R14 | 08-keeping-and-trust.md | BL-1179 | named in a row |
| NS-08-R16 | 08-keeping-and-trust.md | BL-1180 | named in a row |
| NS-08-R17 | 08-keeping-and-trust.md | BL-1180 | named in a row |
| NS-08-R18 | 08-keeping-and-trust.md | BL-1180 | named in a row |
| NS-08-R19 | 08-keeping-and-trust.md | BL-1180 | named in a row |
| NS-08-R21 | 08-keeping-and-trust.md | BL-1048 | named in a row |
| NS-08-R4 | 08-keeping-and-trust.md | BL-976, BL-290 | named in a row |
| NS-08-R5 | 08-keeping-and-trust.md | BL-976 | named in a row |
| NS-08-R6 | 08-keeping-and-trust.md | BL-976 | named in a row |
| NS-08-R7 | 08-keeping-and-trust.md | BL-976 | named in a row |
| NS-08-R9 | 08-keeping-and-trust.md | BL-976, BL-290 | named in a row |
| NS-09-R1 | 08-keeping-and-trust.md | BL-1181 | named in a row |
| NS-09-R10 | 08-keeping-and-trust.md | BL-977 | named in a row |
| NS-09-R11 | 08-keeping-and-trust.md | BL-977 | named in a row |
| NS-09-R12 | 08-keeping-and-trust.md | BL-977 | named in a row |
| NS-09-R14 | 08-keeping-and-trust.md | BL-977 | named in a row |
| NS-09-R15 | 08-keeping-and-trust.md | BL-977 | named in a row |
| NS-09-R2 | 08-keeping-and-trust.md | BL-1181 | named in a row |
| NS-09-R3 | 08-keeping-and-trust.md | BL-1181 | named in a row |
| NS-09-R4a | 08-keeping-and-trust.md | BL-1181 | named in a row |
| NS-09-R4b | 08-keeping-and-trust.md | BL-138 | named in a row |
| NS-09-R7 | 08-keeping-and-trust.md | BL-1182 | named in a row |
| NS-09-R8 | 08-keeping-and-trust.md | BL-1182 | named in a row |
| NS-09-R9 | 08-keeping-and-trust.md | BL-977 | named in a row |
| NS-10-R0 | 08-keeping-and-trust.md | BL-978 | named in a row |
| NS-10-R1 | 08-keeping-and-trust.md | BL-978 | named in a row |
| NS-10-R10 | 08-keeping-and-trust.md | BL-978 | named in a row |
| NS-10-R3 | 08-keeping-and-trust.md | BL-978 | named in a row |
| NS-10-R4a | 08-keeping-and-trust.md | BL-978 | named in a row |
| NS-10-R4b | 08-keeping-and-trust.md | BL-978 | named in a row |
| NS-10-R5 | 08-keeping-and-trust.md | BL-978 | named in a row |
| NS-10-R6 | 08-keeping-and-trust.md | BL-978 | named in a row |
| NS-10-R8 | 08-keeping-and-trust.md | BL-978 | named in a row |
| NS-11-R10 | 08-keeping-and-trust.md | BL-126 | proposed group row |
| NS-11-R12 | 08-keeping-and-trust.md | BL-126 | proposed group row |
| NS-11-R23 | 08-keeping-and-trust.md | BL-126 | proposed group row |
| NS-11-R5 | 08-keeping-and-trust.md | BL-942 | named in a row |
| NS-11-R8 | 08-keeping-and-trust.md | BL-942 | named in a row |
| NS-12-R2 | 08-keeping-and-trust.md | BL-979 | named in a row |
| NS-12-R3 | 08-keeping-and-trust.md | BL-979 | named in a row |
| NS-12-R6 | 08-keeping-and-trust.md | BL-979 | named in a row |
| NS-12-R7 | 08-keeping-and-trust.md | BL-979 | named in a row |
| NS-12-R8 | 08-keeping-and-trust.md | BL-979 | named in a row |
| NS-13-R10 | 09-capture.md | BL-943 | named in a row |
| NS-13-R11 | 09-capture.md | BL-943 | named in a row |
| NS-13-R12 | 09-capture.md | BL-943 | named in a row |
| NS-13-R13 | 09-capture.md | BL-943 | named in a row |
| NS-13-R14 | 09-capture.md | BL-943, BL-967 | named in a row |
| NS-13-R15 | 09-capture.md | BL-943 | named in a row |
| NS-13-R18 | 09-capture.md | BL-943 | named in a row |
| NS-13-R19 | 09-capture.md | BL-943 | named in a row |
| NS-13-R23 | 09-capture.md | BL-943 | named in a row |
| NS-13-R24 | 09-capture.md | BL-943 | named in a row |
| NS-13-R27 | 09-capture.md | BL-943 | named in a row |
| NS-13-R3 | 09-capture.md | BL-943 | named in a row |
| NS-13-R30 | 09-capture.md | BL-943 | named in a row |
| NS-13-R31 | 09-capture.md | BL-943 | named in a row |
| NS-13-R4 | 09-capture.md | BL-943 | named in a row |
| NS-13-R5 | 09-capture.md | BL-943 | named in a row |
| NS-13-R6a | 09-capture.md | BL-943 | named in a row |
| NS-13-R6b | 09-capture.md | BL-943 | named in a row |
| NS-14-R11 | 09-capture.md | BL-1182 | named in a row |
| NS-14-R3 | 09-capture.md | BL-941 | named in a row |
| NS-14-R4 | 09-capture.md | BL-941 | named in a row |
| NS-14-R8 | 09-capture.md | BL-1182 | named in a row |
| NS-15-R11 | 09-capture.md | BL-945 | named in a row |
| NS-15-R16 | 09-capture.md | BL-945 | named in a row |
| NS-15-R18 | 09-capture.md | BL-945 | named in a row |
| NS-15-R4 | 09-capture.md | BL-945 | named in a row |
| NS-16-R15 | 09-capture.md | BL-980 | named in a row |
| NS-16-R16 | 09-capture.md | BL-980 | named in a row |
| NS-16-R18 | 09-capture.md | BL-980 | named in a row |
| NS-16-R3 | 09-capture.md | BL-980 | named in a row |
| NS-16-R4 | 09-capture.md | BL-980 | named in a row |
| NS-16-R5 | 09-capture.md | BL-980 | named in a row |
| NS-16-R6 | 09-capture.md | BL-957, BL-980 | named in a row |
| NS-16-R9 | 09-capture.md | BL-980 | named in a row |
| NS-17-R1 | 09-capture.md | BL-1221 | named in a row |
| NS-17-R10 | 09-capture.md | BL-1221 | named in a row |
| NS-17-R11 | 09-capture.md | BL-1223 | named in a row |
| NS-17-R12 | 09-capture.md | BL-1221 | named in a row |
| NS-17-R2 | 09-capture.md | BL-327 | named in a row |
| NS-17-R3 | 09-capture.md | BL-1222 | named in a row |
| NS-17-R4 | 09-capture.md | BL-1224 | named in a row |
| NS-17-R5 | 09-capture.md | BL-1221 | named in a row |
| NS-17-R6 | 09-capture.md | BL-1222 | named in a row |
| NS-17-R7 | 09-capture.md | BL-1222 | named in a row |
| NS-17-R8 | 09-capture.md | BL-1222 | named in a row |
| NS-18-R3 | 09-capture.md | BL-982 | named in a row |
| NS-18-R6 | 09-capture.md | BL-982 | named in a row |
| NS-18-R8 | 09-capture.md | BL-982 | named in a row |
| NS-19-R1 | 09-capture.md | BL-1174 | named in a row |
| NS-19-R4 | 09-capture.md | BL-1174 | named in a row |
| NS-21-R11 | 10-reading-and-family.md | BL-1175 | named in a row |
| NS-21-R12 | 10-reading-and-family.md | BL-962, BL-287 | named in a row |
| NS-21-R13 | 10-reading-and-family.md | BL-1175 | named in a row |
| NS-21-R4 | 10-reading-and-family.md | BL-937 | named in a row |
| NS-21-R9 | 10-reading-and-family.md | BL-1175 | named in a row |
| NS-22-R2 | 10-reading-and-family.md | BL-938 | named in a row |
| NS-22-R3 | 10-reading-and-family.md | BL-938 | named in a row |
| NS-23-R11 | 10-reading-and-family.md | BL-946 | named in a row |
| NS-23-R15 | 10-reading-and-family.md | BL-946 | named in a row |
| NS-23-R17 | 10-reading-and-family.md | BL-946 | named in a row |
| NS-23-R5 | 10-reading-and-family.md | BL-946 | named in a row |
| NS-23-R8 | 10-reading-and-family.md | BL-946 | named in a row |
| NS-24-R10 | 10-reading-and-family.md | BL-1175 | named in a row |
| NS-24-R2 | 10-reading-and-family.md | BL-947 | named in a row |
| NS-24-R3 | 10-reading-and-family.md | BL-947 | named in a row |
| NS-25-R1 | 10-reading-and-family.md | BL-983 | named in a row |
| NS-25-R10 | 10-reading-and-family.md | BL-983 | named in a row |
| NS-25-R12 | 10-reading-and-family.md | BL-983 | named in a row |
| NS-25-R14 | 10-reading-and-family.md | BL-983 | named in a row |
| NS-25-R15 | 10-reading-and-family.md | BL-983 | named in a row |
| NS-25-R16 | 10-reading-and-family.md | BL-983 | named in a row |
| NS-25-R17 | 10-reading-and-family.md | BL-983 | named in a row |
| NS-25-R19 | 10-reading-and-family.md | BL-983 | named in a row |
| NS-25-R2 | 10-reading-and-family.md | BL-983 | named in a row |
| NS-25-R3 | 10-reading-and-family.md | BL-983 | named in a row |
| NS-25-R4 | 10-reading-and-family.md | BL-983 | named in a row |
| NS-25-R6 | 10-reading-and-family.md | BL-983 | named in a row |
| NS-25-R7 | 10-reading-and-family.md | BL-983 | named in a row |
| NS-32-R1 | 11-foundations.md | BL-966 | named in a row |
| NS-32-R11 | 11-foundations.md | BL-966 | named in a row |
| NS-32-R12 | 11-foundations.md | BL-966 | named in a row |
| NS-32-R14 | 11-foundations.md | BL-966 | named in a row |
| NS-32-R1b | 11-foundations.md | BL-966, BL-1152 | named in a row |
| NS-32-R4 | 11-foundations.md | BL-966, BL-1152 | named in a row |
| NS-32-R4b | 11-foundations.md | BL-966, BL-163, BL-1152 | named in a row |
| NS-32-R8 | 11-foundations.md | BL-966 | named in a row |
| NS-33-R1 | 11-foundations.md | BL-1172 | named in a row |
| NS-33-R10 | 11-foundations.md | BL-984, BL-139 | named in a row |
| NS-33-R12 | 11-foundations.md | BL-984 | named in a row |
| NS-33-R15 | 11-foundations.md | BL-954, BL-984 | named in a row |
| NS-33-R16 | 11-foundations.md | BL-984, BL-162 | named in a row |
| NS-33-R2 | 11-foundations.md | BL-1172 | named in a row |
| NS-33-R3 | 11-foundations.md | BL-931 | named in a row |
| NS-33-R4 | 11-foundations.md | BL-1172 | named in a row |
| NS-33-R5 | 11-foundations.md | BL-1173 | named in a row |
| NS-33-R6 | 11-foundations.md | BL-1172 | named in a row |
| NS-33-R7 | 11-foundations.md | BL-1173 | named in a row |
| NS-33-R8 | 11-foundations.md | BL-1173 | named in a row |
| NS-33-R9 | 11-foundations.md | BL-984, BL-139 | named in a row |
| NS-34-R2 | 11-foundations.md | BL-168 | named in a row |
| NS-34-R5 | 11-foundations.md | BL-185 | proposed group row |
| NS-34-R6 | 11-foundations.md | BL-1047, BL-168 | named in a row |
| NS-35-R1 | 11-foundations.md | BL-1174 | named in a row |
| NS-35-R3 | 11-foundations.md | BL-1174 | named in a row |
| NS-35-R4 | 11-foundations.md | BL-1174 | named in a row |
| NS-35-R7 | 11-foundations.md | BL-952 | named in a row |
| NS-36-R10 | 11-foundations.md | BL-1178 | named in a row |
| NS-36-R11 | 11-foundations.md | BL-1178 | named in a row |
| NS-36-R12 | 11-foundations.md | BL-1178 | named in a row |
| NS-36-R1a | 11-foundations.md | BL-1176 | named in a row |
| NS-36-R1b | 11-foundations.md | BL-1176 | named in a row |
| NS-36-R1c | 11-foundations.md | BL-1176 | named in a row |
| NS-36-R1d | 11-foundations.md | BL-1176 | named in a row |
| NS-36-R2 | 11-foundations.md | BL-1177 | named in a row |
| NS-36-R3 | 11-foundations.md | BL-1177 | named in a row |
| NS-36-R4 | 11-foundations.md | BL-959, BL-254 | named in a row |
| NS-36-R5 | 11-foundations.md | BL-1177 | named in a row |
| NS-36-R6 | 11-foundations.md | BL-960, BL-254 | named in a row |
| NS-36-R7 | 11-foundations.md | BL-1177 | named in a row |
| NS-36-R8 | 11-foundations.md | BL-1176 | named in a row |
| NS-37-R2 | 11-foundations.md | BL-1174 | named in a row |
| NS-37-R4 | 11-foundations.md | BL-956 | named in a row |
| NS-37-R5 | 11-foundations.md | BL-956 | named in a row |
| NS-38-R1 | 19-from-download-to-first-letter.md | BL-1225 | named in a row |
| NS-38-R2 | 19-from-download-to-first-letter.md | BL-1021 | named in a row |
| NS-38-R3 | 19-from-download-to-first-letter.md | BL-1225 | named in a row |
| NS-38-R4 | 19-from-download-to-first-letter.md | BL-1225 | named in a row |
| NS-38-R5 | 19-from-download-to-first-letter.md | BL-1021 | named in a row |
| NS-38-R7 | 19-from-download-to-first-letter.md | BL-1226 | named in a row |
| NS-38-R8 | 19-from-download-to-first-letter.md | BL-1227 | named in a row |
| NS-38-R9 | 19-from-download-to-first-letter.md | BL-1225 | named in a row |
| NS-39-R1 | 19-from-download-to-first-letter.md | BL-1032 | named in a row |
| NS-39-R10 | 19-from-download-to-first-letter.md | BL-1171 | named in a row |
| NS-39-R11 | 19-from-download-to-first-letter.md | BL-1171 | named in a row |
| NS-39-R12 | 19-from-download-to-first-letter.md | BL-1032 | named in a row |
| NS-39-R14 | 19-from-download-to-first-letter.md | BL-1032 | named in a row |
| NS-39-R2 | 19-from-download-to-first-letter.md | BL-1032 | named in a row |
| NS-39-R3 | 19-from-download-to-first-letter.md | BL-1170 | named in a row |
| NS-39-R4 | 19-from-download-to-first-letter.md | BL-1170 | named in a row |
| NS-39-R5 | 19-from-download-to-first-letter.md | BL-1170 | named in a row |
| NS-39-R6 | 19-from-download-to-first-letter.md | BL-1170 | named in a row |
| NS-40-R1 | 19-from-download-to-first-letter.md | BL-1168 | named in a row |
| NS-40-R10 | 19-from-download-to-first-letter.md | BL-1169 | named in a row |
| NS-40-R12 | 19-from-download-to-first-letter.md | BL-1169 | named in a row |
| NS-40-R13 | 19-from-download-to-first-letter.md | BL-1168 | named in a row |
| NS-40-R2 | 19-from-download-to-first-letter.md | BL-1168 | named in a row |
| NS-40-R3 | 19-from-download-to-first-letter.md | BL-1168 | named in a row |
| NS-40-R5 | 19-from-download-to-first-letter.md | BL-1031 | named in a row |
| NS-40-R6 | 19-from-download-to-first-letter.md | BL-577, BL-1031 | named in a row |
| NS-40-R7 | 19-from-download-to-first-letter.md | BL-577 | named in a row |
| NS-40-R8 | 19-from-download-to-first-letter.md | BL-1168 | named in a row |
| NS-40-R9 | 19-from-download-to-first-letter.md | BL-1169 | named in a row |
| NS-41-R1 | 19-from-download-to-first-letter.md | BL-1158 | named in a row |
| NS-41-R10 | 19-from-download-to-first-letter.md | BL-1028 | named in a row |
| NS-41-R11 | 19-from-download-to-first-letter.md | BL-1027 | named in a row |
| NS-41-R13 | 19-from-download-to-first-letter.md | BL-1160 | named in a row |
| NS-41-R14 | 19-from-download-to-first-letter.md | BL-1159 | named in a row |
| NS-41-R16 | 19-from-download-to-first-letter.md | BL-1160 | named in a row |
| NS-41-R18 | 19-from-download-to-first-letter.md | BL-1160 | named in a row |
| NS-41-R19 | 19-from-download-to-first-letter.md | BL-1159 | named in a row |
| NS-41-R2 | 19-from-download-to-first-letter.md | BL-1158 | named in a row |
| NS-41-R20 | 19-from-download-to-first-letter.md | BL-1158 | named in a row |
| NS-41-R22 | 19-from-download-to-first-letter.md | BL-1158 | named in a row |
| NS-41-R23 | 19-from-download-to-first-letter.md | BL-1159 | named in a row |
| NS-41-R3 | 19-from-download-to-first-letter.md | BL-1159 | named in a row |
| NS-41-R4 | 19-from-download-to-first-letter.md | BL-1159 | named in a row |
| NS-41-R5 | 19-from-download-to-first-letter.md | BL-1159 | named in a row |
| NS-41-R6 | 19-from-download-to-first-letter.md | BL-961 | cited in the requirement text |
| NS-41-R7 | 19-from-download-to-first-letter.md | BL-1158 | named in a row |
| NS-41-R9 | 19-from-download-to-first-letter.md | BL-1026, BL-1027 | named in a row |
| NS-42-R1 | 19-from-download-to-first-letter.md | BL-1166 | named in a row |
| NS-42-R10 | 19-from-download-to-first-letter.md | BL-1166 | named in a row |
| NS-42-R11 | 19-from-download-to-first-letter.md | BL-1166 | named in a row |
| NS-42-R13 | 19-from-download-to-first-letter.md | BL-1023 | named in a row |
| NS-42-R15 | 19-from-download-to-first-letter.md | BL-1166 | named in a row |
| NS-42-R16 | 19-from-download-to-first-letter.md | BL-1166 | named in a row |
| NS-42-R17 | 19-from-download-to-first-letter.md | BL-1040 | named in a row |
| NS-42-R18 | 19-from-download-to-first-letter.md | BL-1022 | named in a row |
| NS-42-R2 | 19-from-download-to-first-letter.md | BL-1022 | named in a row |
| NS-42-R3 | 19-from-download-to-first-letter.md | BL-1022 | named in a row |
| NS-42-R4 | 19-from-download-to-first-letter.md | BL-1167 | named in a row |
| NS-42-R5 | 19-from-download-to-first-letter.md | BL-1167 | named in a row |
| NS-42-R6 | 19-from-download-to-first-letter.md | BL-1167 | named in a row |
| NS-42-R7 | 19-from-download-to-first-letter.md | BL-1022 | named in a row |
| NS-42-R9 | 19-from-download-to-first-letter.md | BL-1023 | named in a row |
| NS-43-R1 | 19-from-download-to-first-letter.md | BL-1164 | named in a row |
| NS-43-R10 | 19-from-download-to-first-letter.md | BL-1033 | named in a row |
| NS-43-R11 | 19-from-download-to-first-letter.md | BL-1165 | named in a row |
| NS-43-R13 | 19-from-download-to-first-letter.md | BL-1165 | named in a row |
| NS-43-R14 | 19-from-download-to-first-letter.md | BL-1165 | named in a row |
| NS-43-R2 | 19-from-download-to-first-letter.md | BL-1164 | named in a row |
| NS-43-R3 | 19-from-download-to-first-letter.md | BL-1164 | named in a row |
| NS-43-R4 | 19-from-download-to-first-letter.md | BL-1164 | named in a row |
| NS-43-R6 | 19-from-download-to-first-letter.md | BL-1033 | named in a row |
| NS-43-R7 | 19-from-download-to-first-letter.md | BL-1164 | named in a row |
| NS-43-R8 | 19-from-download-to-first-letter.md | BL-1165 | named in a row |
| NS-44-R1 | 19-from-download-to-first-letter.md | BL-1034 | named in a row |
| NS-44-R10 | 19-from-download-to-first-letter.md | BL-1034 | named in a row |
| NS-44-R12 | 19-from-download-to-first-letter.md | BL-1034 | named in a row |
| NS-44-R2 | 19-from-download-to-first-letter.md | BL-1034 | named in a row |
| NS-44-R3 | 19-from-download-to-first-letter.md | BL-1034 | named in a row |
| NS-44-R4 | 19-from-download-to-first-letter.md | BL-1034 | named in a row |
| NS-44-R6 | 19-from-download-to-first-letter.md | BL-1034 | named in a row |
| NS-44-R7 | 19-from-download-to-first-letter.md | BL-1034 | named in a row |
| NS-44-R8 | 19-from-download-to-first-letter.md | BL-1034 | named in a row |
| NS-44-R9 | 19-from-download-to-first-letter.md | BL-1034 | named in a row |
| NS-45-R1 | 19-from-download-to-first-letter.md | BL-1036 | named in a row |
| NS-45-R10 | 19-from-download-to-first-letter.md | BL-1162 | named in a row |
| NS-45-R11 | 19-from-download-to-first-letter.md | BL-1163 | named in a row |
| NS-45-R12 | 19-from-download-to-first-letter.md | BL-1163 | named in a row |
| NS-45-R13 | 19-from-download-to-first-letter.md | BL-1035 | named in a row |
| NS-45-R15 | 19-from-download-to-first-letter.md | BL-1162 | named in a row |
| NS-45-R16 | 19-from-download-to-first-letter.md | BL-1161 | named in a row |
| NS-45-R18 | 19-from-download-to-first-letter.md | BL-1163 | named in a row |
| NS-45-R2 | 19-from-download-to-first-letter.md | BL-1161 | named in a row |
| NS-45-R3 | 19-from-download-to-first-letter.md | BL-1161 | named in a row |
| NS-45-R5 | 19-from-download-to-first-letter.md | BL-1036 | named in a row |
| NS-45-R6 | 19-from-download-to-first-letter.md | BL-1162 | named in a row |
| NS-45-R7 | 19-from-download-to-first-letter.md | BL-1162 | named in a row |
| NS-45-R8 | 19-from-download-to-first-letter.md | BL-1039 | named in a row |
| NS-45-R9 | 19-from-download-to-first-letter.md | BL-1162 | named in a row |
| NS-46-R14 | 21-days-cultural-photos-home.md | BL-1229 | named in a row |
| NS-46-R16 | 21-days-cultural-photos-home.md | BL-1229 | named in a row |
| NS-46-R17 | 21-days-cultural-photos-home.md | BL-1230 | named in a row |
| NS-46-R19 | 21-days-cultural-photos-home.md | BL-1013 | named in a row |
| NS-46-R2 | 21-days-cultural-photos-home.md | BL-1013 | named in a row |
| NS-46-R22 | 21-days-cultural-photos-home.md | BL-1230 | named in a row |
| NS-46-R23 | 21-days-cultural-photos-home.md | BL-1011 | named in a row |
| NS-46-R25 | 21-days-cultural-photos-home.md | BL-985 | cited in the requirement text |
| NS-46-R26 | 21-days-cultural-photos-home.md | BL-1013 | named in a row |
| NS-46-R27 | 21-days-cultural-photos-home.md | BL-1013 | named in a row |
| NS-46-R30 | 21-days-cultural-photos-home.md | BL-1012 | named in a row |
| NS-46-R31 | 21-days-cultural-photos-home.md | BL-1007 | named in a row |
| NS-46-R32 | 21-days-cultural-photos-home.md | BL-1012 | named in a row |
| NS-46-R34 | 21-days-cultural-photos-home.md | BL-1005 | named in a row |
| NS-46-R35 | 21-days-cultural-photos-home.md | BL-1230 | named in a row |
| NS-46-R36 | 21-days-cultural-photos-home.md | BL-1009 | named in a row |
| NS-46-R4 | 21-days-cultural-photos-home.md | BL-1228 | named in a row |
| NS-46-R46 | 21-days-cultural-photos-home.md | BL-1231 | named in a row |
| NS-46-R48 | 21-days-cultural-photos-home.md | BL-1231 | named in a row |
| NS-46-R5 | 21-days-cultural-photos-home.md | BL-1228 | named in a row |
| NS-46-R7 | 21-days-cultural-photos-home.md | BL-1228 | named in a row |
| NS-46-R8 | 21-days-cultural-photos-home.md | BL-1228 | named in a row |
| NS-47-R1 | 21-days-cultural-photos-home.md | BL-1010 | named in a row |
| NS-47-R10 | 21-days-cultural-photos-home.md | BL-1216 | named in a row |
| NS-47-R11 | 21-days-cultural-photos-home.md | BL-1010 | named in a row |
| NS-47-R12 | 21-days-cultural-photos-home.md | BL-1002, BL-1009 | named in a row |
| NS-47-R13 | 21-days-cultural-photos-home.md | BL-1009 | named in a row |
| NS-47-R15 | 21-days-cultural-photos-home.md | BL-1218 | named in a row |
| NS-47-R16 | 21-days-cultural-photos-home.md | BL-1218 | named in a row |
| NS-47-R17 | 21-days-cultural-photos-home.md | BL-1218 | named in a row |
| NS-47-R18 | 21-days-cultural-photos-home.md | BL-1218 | named in a row |
| NS-47-R2 | 21-days-cultural-photos-home.md | BL-1215 | named in a row |
| NS-47-R21 | 21-days-cultural-photos-home.md | BL-1219 | named in a row |
| NS-47-R22 | 21-days-cultural-photos-home.md | BL-1219 | named in a row |
| NS-47-R23 | 21-days-cultural-photos-home.md | BL-1219 | named in a row |
| NS-47-R24 | 21-days-cultural-photos-home.md | BL-1218 | named in a row |
| NS-47-R25 | 21-days-cultural-photos-home.md | BL-1015 | named in a row |
| NS-47-R26 | 21-days-cultural-photos-home.md | BL-1220 | named in a row |
| NS-47-R29 | 21-days-cultural-photos-home.md | BL-1220 | named in a row |
| NS-47-R3 | 21-days-cultural-photos-home.md | BL-1215 | named in a row |
| NS-47-R34 | 21-days-cultural-photos-home.md | BL-1005 | named in a row |
| NS-47-R36 | 21-days-cultural-photos-home.md | BL-1009 | named in a row |
| NS-47-R38 | 21-days-cultural-photos-home.md | BL-1220 | named in a row |
| NS-47-R4 | 21-days-cultural-photos-home.md | BL-1216 | named in a row |
| NS-47-R5 | 21-days-cultural-photos-home.md | BL-1217 | named in a row |
| NS-47-R6 | 21-days-cultural-photos-home.md | BL-1002, BL-1010 | named in a row |
| NS-47-R7 | 21-days-cultural-photos-home.md | BL-1216 | named in a row |
| NS-47-R8 | 21-days-cultural-photos-home.md | BL-1217 | named in a row |
| NS-47-R9 | 21-days-cultural-photos-home.md | BL-1217 | named in a row |
| NS-48-R1 | 21-days-cultural-photos-home.md | BL-1002, BL-1004 | named in a row |
| NS-48-R10 | 21-days-cultural-photos-home.md | BL-1004 | named in a row |
| NS-48-R11 | 21-days-cultural-photos-home.md | BL-1004 | named in a row |
| NS-48-R2 | 21-days-cultural-photos-home.md | BL-1004 | named in a row |
| NS-48-R21 | 21-days-cultural-photos-home.md | BL-1233 | named in a row |
| NS-48-R26 | 21-days-cultural-photos-home.md | BL-1233 | named in a row |
| NS-48-R28 | 21-days-cultural-photos-home.md | BL-1003 | named in a row |
| NS-48-R3 | 21-days-cultural-photos-home.md | BL-1016 | named in a row |
| NS-48-R30 | 21-days-cultural-photos-home.md | BL-1016 | named in a row |
| NS-48-R36 | 21-days-cultural-photos-home.md | BL-1004 | named in a row |
| NS-48-R4 | 21-days-cultural-photos-home.md | BL-1016 | named in a row |
| NS-48-R5 | 21-days-cultural-photos-home.md | BL-1016 | named in a row |
| NS-48-R9 | 21-days-cultural-photos-home.md | BL-1233 | named in a row |
| NS-49-R10 | 21-days-cultural-photos-home.md | BL-1210 | named in a row |
| NS-49-R11 | 21-days-cultural-photos-home.md | BL-1209 | named in a row |
| NS-49-R12 | 21-days-cultural-photos-home.md | BL-1211 | named in a row |
| NS-49-R13 | 21-days-cultural-photos-home.md | BL-1210 | named in a row |
| NS-49-R15 | 21-days-cultural-photos-home.md | BL-1212 | named in a row |
| NS-49-R16 | 21-days-cultural-photos-home.md | BL-1212 | named in a row |
| NS-49-R17 | 21-days-cultural-photos-home.md | BL-1212 | named in a row |
| NS-49-R19 | 21-days-cultural-photos-home.md | BL-1209 | named in a row |
| NS-49-R21 | 21-days-cultural-photos-home.md | BL-1211 | named in a row |
| NS-49-R23 | 21-days-cultural-photos-home.md | BL-1213 | named in a row |
| NS-49-R24 | 21-days-cultural-photos-home.md | BL-1211 | named in a row |
| NS-49-R25 | 21-days-cultural-photos-home.md | BL-1001, BL-1006 | named in a row |
| NS-49-R26 | 21-days-cultural-photos-home.md | BL-1006 | named in a row |
| NS-49-R27 | 21-days-cultural-photos-home.md | BL-1017 | named in a row |
| NS-49-R28 | 21-days-cultural-photos-home.md | BL-1017 | named in a row |
| NS-49-R3 | 21-days-cultural-photos-home.md | BL-1006 | named in a row |
| NS-49-R33 | 21-days-cultural-photos-home.md | BL-1212 | named in a row |
| NS-49-R35 | 21-days-cultural-photos-home.md | BL-1213 | named in a row |
| NS-49-R6 | 21-days-cultural-photos-home.md | BL-1001 | named in a row |
| NS-49-R7 | 21-days-cultural-photos-home.md | BL-1209 | named in a row |
| NS-49-R9 | 21-days-cultural-photos-home.md | BL-1210 | named in a row |
| NS-50-R11 | 21-days-cultural-photos-home.md | BL-1228 | named in a row |
| NS-50-R2 | 21-days-cultural-photos-home.md | BL-1014 | named in a row |
| NS-50-R3 | 21-days-cultural-photos-home.md | BL-1014 | named in a row |
| NS-50-R8 | 21-days-cultural-photos-home.md | BL-1231 | named in a row |
| NS-51-R1 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R10 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R11 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R12 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R15 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R16 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R17 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R18 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R19 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R2 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R23 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R24 | 27-photo-moments-and-media.md | BL-1019 | named in a row |
| NS-51-R25 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R26 | 27-photo-moments-and-media.md | BL-1019 | named in a row |
| NS-51-R28 | 27-photo-moments-and-media.md | BL-1047 | named in a row |
| NS-51-R29 | 27-photo-moments-and-media.md | BL-1019 | named in a row |
| NS-51-R3 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R30 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R31 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R33 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R34 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R37 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R42 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R5 | 27-photo-moments-and-media.md | BL-1019 | named in a row |
| NS-51-R6 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R8 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-51-R9 | 27-photo-moments-and-media.md | BL-045 | proposed group row |
| NS-52-R10 | 27-photo-moments-and-media.md | BL-046 | proposed group row |
| NS-52-R11 | 27-photo-moments-and-media.md | BL-046 | proposed group row |
| NS-52-R15 | 27-photo-moments-and-media.md | BL-1018 | named in a row |
| NS-52-R16 | 27-photo-moments-and-media.md | BL-1018 | named in a row |
| NS-52-R17 | 27-photo-moments-and-media.md | BL-1018 | named in a row |
| NS-52-R18 | 27-photo-moments-and-media.md | BL-1018 | named in a row |
| NS-52-R19 | 27-photo-moments-and-media.md | BL-1018 | named in a row |
| NS-52-R2 | 27-photo-moments-and-media.md | BL-046 | proposed group row |
| NS-52-R21 | 27-photo-moments-and-media.md | BL-1020 | named in a row |
| NS-52-R22 | 27-photo-moments-and-media.md | BL-1020 | named in a row |
| NS-52-R23 | 27-photo-moments-and-media.md | BL-1020 | named in a row |
| NS-52-R25 | 27-photo-moments-and-media.md | BL-1020 | named in a row |
| NS-52-R28 | 27-photo-moments-and-media.md | BL-046 | proposed group row |
| NS-52-R29 | 27-photo-moments-and-media.md | BL-046 | proposed group row |
| NS-52-R3 | 27-photo-moments-and-media.md | BL-046 | proposed group row |
| NS-52-R30 | 27-photo-moments-and-media.md | BL-046 | proposed group row |
| NS-52-R32 | 27-photo-moments-and-media.md | BL-046 | proposed group row |
| NS-52-R36 | 27-photo-moments-and-media.md | BL-046 | proposed group row |
| NS-52-R37 | 27-photo-moments-and-media.md | BL-046 | proposed group row |
| NS-52-R38 | 27-photo-moments-and-media.md | BL-046 | proposed group row |
| NS-52-R4 | 27-photo-moments-and-media.md | BL-1018 | named in a row |
| NS-52-R40 | 27-photo-moments-and-media.md | BL-046 | proposed group row |
| NS-52-R44 | 27-photo-moments-and-media.md | BL-1047 | named in a row |
| NS-52-R5 | 27-photo-moments-and-media.md | BL-1018 | named in a row |
| NS-52-R6 | 27-photo-moments-and-media.md | BL-1018 | named in a row |
| NS-52-R8 | 27-photo-moments-and-media.md | BL-046 | proposed group row |
| FR-AIS-01 | functions/ai-and-speech.md | BL-328 | proposed group row |
| FR-AIS-02 | functions/ai-and-speech.md | BL-328 | proposed group row |
| FR-AIS-03 | functions/ai-and-speech.md | BL-328 | proposed group row |
| FR-AIS-04 | functions/ai-and-speech.md | BL-987 | cited in the requirement text |
| FR-AIS-06 | functions/ai-and-speech.md | BL-328 | proposed group row |
| FR-AIS-07 | functions/ai-and-speech.md | BL-328 | proposed group row |
| FR-AIS-08 | functions/ai-and-speech.md | BL-328 | proposed group row |
| FR-AIS-09 | functions/ai-and-speech.md | BL-006 | proposed group row |
| FR-AIS-10 | functions/ai-and-speech.md | BL-006 | proposed group row |
| FR-AIS-11 | functions/ai-and-speech.md | BL-043 | cited in the requirement text |
| FR-AIS-13 | functions/ai-and-speech.md | BL-006 | proposed group row |
| FR-AIS-15 | functions/ai-and-speech.md | BL-006 | proposed group row |
| FR-AIS-16 | functions/ai-and-speech.md | BL-006 | proposed group row |
| FR-AIS-17 | functions/ai-and-speech.md | BL-006 | proposed group row |
| FR-AIS-19 | functions/ai-and-speech.md | BL-006 | proposed group row |
| FR-AIS-20 | functions/ai-and-speech.md | BL-043 | cited in the requirement text |
| FR-AIS-21 | functions/ai-and-speech.md | BL-007 | proposed group row |
| FR-AIS-22 | functions/ai-and-speech.md | BL-043 | cited in the requirement text |
| FR-AIS-23 | functions/ai-and-speech.md | BL-007 | proposed group row |
| FR-AIS-25 | functions/ai-and-speech.md | BL-007 | proposed group row |
| FR-AIS-26 | functions/ai-and-speech.md | BL-007 | proposed group row |
| FR-AIS-27 | functions/ai-and-speech.md | BL-007 | proposed group row |
| FR-AIS-29 | functions/ai-and-speech.md | BL-007 | proposed group row |
| FR-AIS-33 | functions/ai-and-speech.md | BL-007 | proposed group row |
| FR-AIS-34 | functions/ai-and-speech.md | BL-007 | proposed group row |
| FR-AIS-35 | functions/ai-and-speech.md | BL-328 | proposed group row |
| FR-AIS-36 | functions/ai-and-speech.md | BL-008 | proposed group row |
| FR-AIS-37 | functions/ai-and-speech.md | BL-008 | proposed group row |
| FR-AIS-39 | functions/ai-and-speech.md | BL-328 | proposed group row |
| FR-AIS-40 | functions/ai-and-speech.md | BL-328 | proposed group row |
| FR-AIS-42 | functions/ai-and-speech.md | BL-043 | cited in the requirement text |
| FR-AIS-43 | functions/ai-and-speech.md | BL-006 | proposed group row |
| FR-AIS-45 | functions/ai-and-speech.md | BL-328 | proposed group row |
| FR-AIS-46 | functions/ai-and-speech.md | BL-008 | proposed group row |
| FR-AIS-47 | functions/ai-and-speech.md | BL-008 | proposed group row |
| FR-AIS-48 | functions/ai-and-speech.md | BL-008 | proposed group row |
| FR-AIS-49 | functions/ai-and-speech.md | BL-008 | proposed group row |
| FR-AIS-50 | functions/ai-and-speech.md | BL-008 | proposed group row |
| FR-AIS-51 | functions/ai-and-speech.md | BL-008 | proposed group row |
| FR-AIS-53 | functions/ai-and-speech.md | BL-008 | proposed group row |
| FR-AIS-54 | functions/ai-and-speech.md | BL-328 | proposed group row |
| FR-AIS-55 | functions/ai-and-speech.md | BL-962 | cited in the requirement text |
| FR-AIS-56 | functions/ai-and-speech.md | BL-328 | proposed group row |
| FR-AIS-57 | functions/ai-and-speech.md | BL-047 | proposed group row |
| FR-AIS-58 | functions/ai-and-speech.md | BL-047 | proposed group row |
| FR-AIS-59 | functions/ai-and-speech.md | BL-047 | proposed group row |
| FR-AIS-60 | functions/ai-and-speech.md | BL-047 | proposed group row |
| FR-AIS-61 | functions/ai-and-speech.md | BL-047 | proposed group row |
| FR-AIS-62 | functions/ai-and-speech.md | BL-047 | proposed group row |
| FR-AIS-64 | functions/ai-and-speech.md | BL-047 | proposed group row |
| FR-AIS-65 | functions/ai-and-speech.md | BL-047 | proposed group row |
| FR-AIS-66 | functions/ai-and-speech.md | BL-047 | proposed group row |
| FR-AIS-67 | functions/ai-and-speech.md | BL-047 | proposed group row |
| FR-AIS-68 | functions/ai-and-speech.md | BL-047 | proposed group row |
| FR-BKO-01 | functions/back-office.md | BL-017 | proposed group row |
| FR-BKO-03 | functions/back-office.md | BL-237 | cited in the requirement text |
| FR-BKO-04 | functions/back-office.md | BL-237 | cited in the requirement text |
| FR-BKO-07 | functions/back-office.md | BL-597, BL-598 | cited in the requirement text |
| FR-BKO-09 | functions/back-office.md | BL-017 | proposed group row |
| FR-BKO-10 | functions/back-office.md | BL-779 | cited in the requirement text |
| FR-BKO-13 | functions/back-office.md | BL-017 | proposed group row |
| FR-BKO-14 | functions/back-office.md | BL-017 | proposed group row |
| FR-BKO-16 | functions/back-office.md | BL-017 | proposed group row |
| FR-BKO-18 | functions/back-office.md | BL-017 | proposed group row |
| FR-BKO-21 | functions/back-office.md | BL-017 | proposed group row |
| FR-BKO-28 | functions/back-office.md | BL-047 | proposed group row |
| FR-BKO-29 | functions/back-office.md | BL-047 | proposed group row |
| FR-BKO-30 | functions/back-office.md | BL-047 | proposed group row |
| FR-BKO-31 | functions/back-office.md | BL-047 | proposed group row |
| FR-BKO-32 | functions/back-office.md | BL-047 | proposed group row |
| FR-BKO-35 | functions/back-office.md | BL-047 | proposed group row |
| FR-CMP-01 | functions/compliance.md | BL-1226 | named in a row |
| FR-CMP-03 | functions/compliance.md | BL-1226 | named in a row |
| FR-CMP-04 | functions/compliance.md | BL-1225 | named in a row |
| FR-CMP-05 | functions/compliance.md | BL-1225 | named in a row |
| FR-CMP-06 | functions/compliance.md | BL-1225 | named in a row |
| FR-CMP-07 | functions/compliance.md | BL-1227 | named in a row |
| FR-CMP-11 | functions/compliance.md | BL-1226 | named in a row |
| FR-CMP-12 | functions/compliance.md | BL-1226 | named in a row |
| FR-CMP-13 | functions/compliance.md | BL-1227 | named in a row |
| FR-CMP-14 | functions/compliance.md | BL-119 | cited in the requirement text |
| FR-CMP-15 | functions/compliance.md | BL-1227 | named in a row |
| FR-CMP-16 | functions/compliance.md | BL-1040 | named in a row |
| FR-CMP-17 | functions/compliance.md | BL-1227 | named in a row |
| FR-CMP-18 | functions/compliance.md | BL-1226 | named in a row |
| FR-CMP-19 | functions/compliance.md | BL-1227 | named in a row |
| FR-CMP-20 | functions/compliance.md | BL-1226 | named in a row |
| FR-CMP-22 | functions/compliance.md | BL-047 | proposed group row |
| FR-CMP-23 | functions/compliance.md | BL-047 | proposed group row |
| FR-CMP-24 | functions/compliance.md | BL-047 | proposed group row |
| FR-CMP-25 | functions/compliance.md | BL-047 | proposed group row |
| FR-CMP-26 | functions/compliance.md | BL-047 | proposed group row |
| FR-CMP-27 | functions/compliance.md | BL-047 | proposed group row |
| FR-CMP-28 | functions/compliance.md | BL-047 | proposed group row |
| FR-CUL-01 | functions/cultural-background-data.md | BL-1215 | named in a row |
| FR-CUL-02 | functions/cultural-background-data.md | BL-1215 | named in a row |
| FR-CUL-03 | functions/cultural-background-data.md | BL-1215 | named in a row |
| FR-CUL-04 | functions/cultural-background-data.md | BL-1216 | named in a row |
| FR-CUL-05 | functions/cultural-background-data.md | BL-1217 | named in a row |
| FR-CUL-06 | functions/cultural-background-data.md | BL-1216 | named in a row |
| FR-CUL-07 | functions/cultural-background-data.md | BL-1216 | named in a row |
| FR-CUL-08 | functions/cultural-background-data.md | BL-1217 | named in a row |
| FR-CUL-09 | functions/cultural-background-data.md | BL-1217 | named in a row |
| FR-CUL-11 | functions/cultural-background-data.md | BL-1215 | named in a row |
| FR-CUL-12 | functions/cultural-background-data.md | BL-1220 | named in a row |
| FR-CUL-15 | functions/cultural-background-data.md | BL-961 | cited in the requirement text |
| FR-CUL-16 | functions/cultural-background-data.md | BL-1218 | named in a row |
| FR-CUL-21 | functions/cultural-background-data.md | BL-1219 | named in a row |
| FR-CUL-22 | functions/cultural-background-data.md | BL-1219 | named in a row |
| FR-CUL-23 | functions/cultural-background-data.md | BL-1219 | named in a row |
| FR-CUL-28 | functions/cultural-background-data.md | BL-047 | proposed group row |
| FR-CUL-29 | functions/cultural-background-data.md | BL-047 | proposed group row |
| FR-CUL-30 | functions/cultural-background-data.md | BL-047 | proposed group row |
| FR-CUL-31 | functions/cultural-background-data.md | BL-047 | proposed group row |
| FR-CUL-33 | functions/cultural-background-data.md | BL-047 | proposed group row |
| FR-CUL-34 | functions/cultural-background-data.md | BL-047 | proposed group row |
| FR-CUL-35 | functions/cultural-background-data.md | BL-047 | proposed group row |
| FR-DAT-01 | functions/data-and-measurement.md | BL-1065, BL-1105 | named in a row |
| FR-DAT-02 | functions/data-and-measurement.md | BL-025 | proposed group row |
| FR-DAT-03 | functions/data-and-measurement.md | BL-025 | proposed group row |
| FR-DAT-04 | functions/data-and-measurement.md | BL-981 | cited in the requirement text |
| FR-DAT-05 | functions/data-and-measurement.md | BL-025 | proposed group row |
| FR-DAT-09 | functions/data-and-measurement.md | BL-025 | proposed group row |
| FR-DAT-14 | functions/data-and-measurement.md | BL-025 | proposed group row |
| FR-DAT-20 | functions/data-and-measurement.md | BL-025 | proposed group row |
| FR-DAT-27 | functions/data-and-measurement.md | BL-025 | proposed group row |
| FR-DAT-32 | functions/data-and-measurement.md | BL-025 | proposed group row |
| FR-DAT-35 | functions/data-and-measurement.md | BL-025 | proposed group row |
| FR-DAT-36 | functions/data-and-measurement.md | BL-047 | proposed group row |
| FR-DAT-37 | functions/data-and-measurement.md | BL-047 | proposed group row |
| FR-DAT-38 | functions/data-and-measurement.md | BL-047 | proposed group row |
| FR-DAT-39 | functions/data-and-measurement.md | BL-047 | proposed group row |
| FR-DAT-40 | functions/data-and-measurement.md | BL-047 | proposed group row |
| FR-DAY-02 | functions/days-library.md | BL-1229 | named in a row |
| FR-DAY-03 | functions/days-library.md | BL-966, BL-982 | cited in the requirement text |
| FR-DAY-04 | functions/days-library.md | BL-1229 | named in a row |
| FR-DAY-06 | functions/days-library.md | BL-1229 | named in a row |
| FR-DAY-07 | functions/days-library.md | BL-966 | cited in the requirement text |
| FR-DAY-09 | functions/days-library.md | BL-965 | cited in the requirement text |
| FR-DAY-10 | functions/days-library.md | BL-965 | cited in the requirement text |
| FR-DAY-11 | functions/days-library.md | BL-965 | cited in the requirement text |
| FR-DAY-15 | functions/days-library.md | BL-1230 | named in a row |
| FR-DAY-20 | functions/days-library.md | BL-1231 | named in a row |
| FR-DAY-23 | functions/days-library.md | BL-1011 | named in a row |
| FR-DAY-25 | functions/days-library.md | BL-1230 | named in a row |
| FR-DAY-26 | functions/days-library.md | BL-047 | proposed group row |
| FR-DAY-27 | functions/days-library.md | BL-047 | proposed group row |
| FR-DAY-28 | functions/days-library.md | BL-047 | proposed group row |
| FR-DAY-29 | functions/days-library.md | BL-047 | proposed group row |
| FR-DAY-32 | functions/days-library.md | BL-047 | proposed group row |
| FR-DAY-33 | functions/days-library.md | BL-047 | proposed group row |
| FR-FIN-02 | functions/finance.md | BL-958 | cited in the requirement text |
| FR-FIN-03 | functions/finance.md | BL-017 | proposed group row |
| FR-FIN-05 | functions/finance.md | BL-017 | proposed group row |
| FR-FIN-09 | functions/finance.md | BL-017 | proposed group row |
| FR-FIN-11 | functions/finance.md | BL-017 | proposed group row |
| FR-FIN-22 | functions/finance.md | BL-017 | proposed group row |
| FR-FIN-30 | functions/finance.md | BL-047 | proposed group row |
| FR-FIN-32 | functions/finance.md | BL-047 | proposed group row |
| FR-LCY-01 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-02 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-03 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-04 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-06 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-07 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-09 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-10 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-11 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-12 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-13 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-14 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-17 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-19 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-20 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-21 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-28 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-34 | functions/lifecycle-and-platforms.md | BL-018 | proposed group row |
| FR-LCY-35 | functions/lifecycle-and-platforms.md | BL-047 | proposed group row |
| FR-LCY-36 | functions/lifecycle-and-platforms.md | BL-047 | proposed group row |
| FR-LCY-37 | functions/lifecycle-and-platforms.md | BL-047 | proposed group row |
| FR-LCY-40 | functions/lifecycle-and-platforms.md | BL-047 | proposed group row |
| FR-LCY-41 | functions/lifecycle-and-platforms.md | BL-047 | proposed group row |
| FR-LCY-42 | functions/lifecycle-and-platforms.md | BL-047 | proposed group row |
| FR-LEG-01 | functions/legal.md | BL-931 | cited in the requirement text |
| FR-LEG-02 | functions/legal.md | BL-027 | proposed group row |
| FR-LEG-03 | functions/legal.md | BL-444 | cited in the requirement text |
| FR-LEG-04 | functions/legal.md | BL-027 | proposed group row |
| FR-LEG-06 | functions/legal.md | BL-027 | proposed group row |
| FR-LEG-07 | functions/legal.md | BL-027 | proposed group row |
| FR-LEG-08 | functions/legal.md | BL-027 | proposed group row |
| FR-LEG-09 | functions/legal.md | BL-577 | cited in the requirement text |
| FR-LEG-10 | functions/legal.md | BL-027 | proposed group row |
| FR-LEG-11 | functions/legal.md | BL-027 | proposed group row |
| FR-LEG-12 | functions/legal.md | BL-027 | proposed group row |
| FR-LEG-13 | functions/legal.md | BL-027 | proposed group row |
| FR-LEG-15 | functions/legal.md | BL-027 | proposed group row |
| FR-LEG-18 | functions/legal.md | BL-104 | cited in the requirement text |
| FR-LEG-20 | functions/legal.md | BL-027 | proposed group row |
| FR-LEG-21 | functions/legal.md | BL-047 | proposed group row |
| FR-LEG-22 | functions/legal.md | BL-047 | proposed group row |
| FR-LEG-23 | functions/legal.md | BL-047 | proposed group row |
| FR-LEG-24 | functions/legal.md | BL-047 | proposed group row |
| FR-LEG-26 | functions/legal.md | BL-047 | proposed group row |
| FR-LEG-27 | functions/legal.md | BL-047 | proposed group row |
| FR-LOC-01 | functions/languages-and-localisation.md | BL-1221 | named in a row |
| FR-LOC-02 | functions/languages-and-localisation.md | BL-1221 | named in a row |
| FR-LOC-03 | functions/languages-and-localisation.md | BL-1223 | named in a row |
| FR-LOC-04 | functions/languages-and-localisation.md | BL-1223 | named in a row |
| FR-LOC-05 | functions/languages-and-localisation.md | BL-1223 | named in a row |
| FR-LOC-08 | functions/languages-and-localisation.md | BL-1222 | named in a row |
| FR-LOC-10 | functions/languages-and-localisation.md | BL-1222 | named in a row |
| FR-LOC-13 | functions/languages-and-localisation.md | BL-1224 | named in a row |
| FR-LOC-15 | functions/languages-and-localisation.md | BL-411 | cited in the requirement text |
| FR-LOC-17 | functions/languages-and-localisation.md | BL-411 | cited in the requirement text |
| FR-LOC-18 | functions/languages-and-localisation.md | BL-105 | cited in the requirement text |
| FR-LOC-19 | functions/languages-and-localisation.md | BL-1224 | named in a row |
| FR-LOC-20 | functions/languages-and-localisation.md | BL-1224 | named in a row |
| FR-LOC-21 | functions/languages-and-localisation.md | BL-1223 | named in a row |
| FR-LOC-22 | functions/languages-and-localisation.md | BL-1224 | named in a row |
| FR-LOC-23 | functions/languages-and-localisation.md | BL-1224 | named in a row |
| FR-LOC-24 | functions/languages-and-localisation.md | BL-1224 | named in a row |
| FR-LOC-26 | functions/languages-and-localisation.md | BL-1223 | named in a row |
| FR-LOC-28 | functions/languages-and-localisation.md | BL-1221 | named in a row |
| FR-LOC-29 | functions/languages-and-localisation.md | BL-1222 | named in a row |
| FR-LOC-30 | functions/languages-and-localisation.md | BL-047 | proposed group row |
| FR-LOC-34 | functions/languages-and-localisation.md | BL-047 | proposed group row |
| FR-LOC-35 | functions/languages-and-localisation.md | BL-047 | proposed group row |
| FR-LOC-37 | functions/languages-and-localisation.md | BL-047 | proposed group row |
| FR-MKT-01 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-02 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-03 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-05 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-06 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-07 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-08 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-09 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-11 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-12 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-15 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-16 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-19 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-20 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-22 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-25 | functions/marketing.md | BL-109, BL-981 | cited in the requirement text |
| FR-MKT-28 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-29 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-32 | functions/marketing.md | BL-028 | proposed group row |
| FR-MKT-34 | functions/marketing.md | BL-1103 | named in a row |
| FR-MKT-35 | functions/marketing.md | BL-047 | proposed group row |
| FR-MKT-36 | functions/marketing.md | BL-047 | proposed group row |
| FR-MKT-37 | functions/marketing.md | BL-047 | proposed group row |
| FR-MKT-39 | functions/marketing.md | BL-047 | proposed group row |
| FR-MKT-40 | functions/marketing.md | BL-047 | proposed group row |
| FR-MKT-41 | functions/marketing.md | BL-047 | proposed group row |
| FR-MKT-44 | functions/marketing.md | BL-1049 | named in a row |
| FR-MSG-01 | functions/messaging-and-entry-points.md | BL-053, BL-368 | cited in the requirement text |
| FR-MSG-03 | functions/messaging-and-entry-points.md | BL-368 | cited in the requirement text |
| FR-MSG-06 | functions/messaging-and-entry-points.md | BL-053 | cited in the requirement text |
| FR-MSG-09 | functions/messaging-and-entry-points.md | BL-053 | cited in the requirement text |
| FR-MSG-10 | functions/messaging-and-entry-points.md | BL-053 | cited in the requirement text |
| FR-MSG-11 | functions/messaging-and-entry-points.md | BL-039 | proposed group row |
| FR-MSG-12 | functions/messaging-and-entry-points.md | BL-039 | proposed group row |
| FR-MSG-14 | functions/messaging-and-entry-points.md | BL-039 | proposed group row |
| FR-MSG-15 | functions/messaging-and-entry-points.md | BL-039 | proposed group row |
| FR-MSG-16 | functions/messaging-and-entry-points.md | BL-546 | cited in the requirement text |
| FR-MSG-18 | functions/messaging-and-entry-points.md | BL-039 | proposed group row |
| FR-MSG-19 | functions/messaging-and-entry-points.md | BL-039 | proposed group row |
| FR-MSG-22 | functions/messaging-and-entry-points.md | BL-039 | proposed group row |
| FR-MSG-23 | functions/messaging-and-entry-points.md | BL-364, BL-510 | cited in the requirement text |
| FR-MSG-24 | functions/messaging-and-entry-points.md | BL-039 | proposed group row |
| FR-MSG-25 | functions/messaging-and-entry-points.md | BL-053, BL-510 | cited in the requirement text |
| FR-MSG-28 | functions/messaging-and-entry-points.md | BL-039 | proposed group row |
| FR-MSG-29 | functions/messaging-and-entry-points.md | BL-420, BL-421 | cited in the requirement text |
| FR-MSG-32 | functions/messaging-and-entry-points.md | BL-243, BL-364 | cited in the requirement text |
| FR-MSG-33 | functions/messaging-and-entry-points.md | BL-364 | cited in the requirement text |
| FR-MSG-34 | functions/messaging-and-entry-points.md | BL-243, BL-364 | cited in the requirement text |
| FR-MSG-35 | functions/messaging-and-entry-points.md | BL-364, BL-510 | cited in the requirement text |
| FR-MSG-36 | functions/messaging-and-entry-points.md | BL-364 | cited in the requirement text |
| FR-MSG-40 | functions/messaging-and-entry-points.md | BL-047 | proposed group row |
| FR-MSG-41 | functions/messaging-and-entry-points.md | BL-047 | proposed group row |
| FR-MSG-43 | functions/messaging-and-entry-points.md | BL-047 | proposed group row |
| FR-MSG-44 | functions/messaging-and-entry-points.md | BL-047 | proposed group row |
| FR-MSG-45 | functions/messaging-and-entry-points.md | BL-047 | proposed group row |
| FR-NTC-01 | functions/notification-catalogue.md | BL-1232 | named in a row |
| FR-NTC-02 | functions/notification-catalogue.md | BL-1232 | named in a row |
| FR-NTC-03 | functions/notification-catalogue.md | BL-1232 | named in a row |
| FR-NTC-04 | functions/notification-catalogue.md | BL-1232 | named in a row |
| FR-NTC-05 | functions/notification-catalogue.md | BL-1232 | named in a row |
| FR-NTC-08 | functions/notification-catalogue.md | BL-1233 | named in a row |
| FR-NTC-09 | functions/notification-catalogue.md | BL-1233 | named in a row |
| FR-NTC-10 | functions/notification-catalogue.md | BL-1232 | named in a row |
| FR-NTC-11 | functions/notification-catalogue.md | BL-1233 | named in a row |
| FR-NTC-22 | functions/notification-catalogue.md | BL-047 | proposed group row |
| FR-NTC-23 | functions/notification-catalogue.md | BL-047 | proposed group row |
| FR-NTC-24 | functions/notification-catalogue.md | BL-047 | proposed group row |
| FR-NTC-25 | functions/notification-catalogue.md | BL-047 | proposed group row |
| FR-NTC-26 | functions/notification-catalogue.md | BL-047 | proposed group row |
| FR-NTC-27 | functions/notification-catalogue.md | BL-047 | proposed group row |
| FR-NTC-28 | functions/notification-catalogue.md | BL-047 | proposed group row |
| FR-NTC-29 | functions/notification-catalogue.md | BL-047 | proposed group row |
| FR-OPP-03 | functions/feature-opportunities.md | BL-1213 | named in a row |
| FR-OPP-05 | functions/feature-opportunities.md | BL-1214 | named in a row |
| FR-OPP-06 | functions/feature-opportunities.md | BL-1214 | named in a row |
| FR-OPP-09 | functions/feature-opportunities.md | BL-1213 | named in a row |
| FR-OPP-14 | functions/feature-opportunities.md | BL-047 | proposed group row |
| FR-OPS-03 | functions/operations.md | BL-961 | cited in the requirement text |
| FR-OPS-06 | functions/operations.md | BL-017 | proposed group row |
| FR-OPS-08 | functions/operations.md | BL-017 | proposed group row |
| FR-OPS-09 | functions/operations.md | BL-017 | proposed group row |
| FR-OPS-10 | functions/operations.md | BL-017 | proposed group row |
| FR-OPS-11 | functions/operations.md | BL-017 | proposed group row |
| FR-OPS-14 | functions/operations.md | BL-017 | proposed group row |
| FR-OPS-15 | functions/operations.md | BL-976 | cited in the requirement text |
| FR-OPS-16 | functions/operations.md | BL-017 | proposed group row |
| FR-OPS-17 | functions/operations.md | BL-017 | proposed group row |
| FR-OPS-23 | functions/operations.md | BL-958 | cited in the requirement text |
| FR-OPS-24 | functions/operations.md | BL-017 | proposed group row |
| FR-OPS-28 | functions/operations.md | BL-017 | proposed group row |
| FR-OPS-31 | functions/operations.md | BL-017 | proposed group row |
| FR-OPS-33 | functions/operations.md | BL-017 | proposed group row |
| FR-OPS-39 | functions/operations.md | BL-047 | proposed group row |
| FR-OPS-42 | functions/operations.md | BL-047 | proposed group row |
| FR-OPS-43 | functions/operations.md | BL-047 | proposed group row |
| FR-OPS-44 | functions/operations.md | BL-958 | cited in the requirement text |
| FR-PHS-04 | functions/photos-and-suggestions.md | BL-1211 | named in a row |
| FR-PHS-11 | functions/photos-and-suggestions.md | BL-1209 | named in a row |
| FR-PHS-12 | functions/photos-and-suggestions.md | BL-1209 | named in a row |
| FR-PHS-14 | functions/photos-and-suggestions.md | BL-1210 | named in a row |
| FR-PHS-15 | functions/photos-and-suggestions.md | BL-1210 | named in a row |
| FR-PHS-17 | functions/photos-and-suggestions.md | BL-1209 | named in a row |
| FR-PHS-19 | functions/photos-and-suggestions.md | BL-1211 | named in a row |
| FR-PHS-20 | functions/photos-and-suggestions.md | BL-1210 | named in a row |
| FR-PHS-22 | functions/photos-and-suggestions.md | BL-1212 | named in a row |
| FR-PHS-23 | functions/photos-and-suggestions.md | BL-1212 | named in a row |
| FR-PHS-33 | functions/photos-and-suggestions.md | BL-1211 | named in a row |
| FR-PHS-40 | functions/photos-and-suggestions.md | BL-1214 | named in a row |
| FR-PHS-41 | functions/photos-and-suggestions.md | BL-1214 | named in a row |
| FR-PHS-43 | functions/photos-and-suggestions.md | BL-1214 | named in a row |
| FR-PHS-44 | functions/photos-and-suggestions.md | BL-1214 | named in a row |
| FR-PHS-50 | functions/photos-and-suggestions.md | BL-1214 | named in a row |
| FR-PHS-51 | functions/photos-and-suggestions.md | BL-1211 | named in a row |
| FR-PHS-52 | functions/photos-and-suggestions.md | BL-1210 | named in a row |
| FR-PHS-53 | functions/photos-and-suggestions.md | BL-1209 | named in a row |
| FR-PHS-54 | functions/photos-and-suggestions.md | BL-1212 | named in a row |
| FR-PHS-55 | functions/photos-and-suggestions.md | BL-1213 | named in a row |
| FR-PHS-56 | functions/photos-and-suggestions.md | BL-1213 | named in a row |
| FR-PHS-57 | functions/photos-and-suggestions.md | BL-1213 | named in a row |
| FR-PHS-58 | functions/photos-and-suggestions.md | BL-047 | proposed group row |
| FR-PHS-59 | functions/photos-and-suggestions.md | BL-047 | proposed group row |
| FR-PHS-60 | functions/photos-and-suggestions.md | BL-047 | proposed group row |
| FR-PHS-61 | functions/photos-and-suggestions.md | BL-047 | proposed group row |
| FR-PHS-63 | functions/photos-and-suggestions.md | BL-047 | proposed group row |
| FR-PHS-64 | functions/photos-and-suggestions.md | BL-047 | proposed group row |
| FR-PHS-65 | functions/photos-and-suggestions.md | BL-047 | proposed group row |
| FR-PHS-66 | functions/photos-and-suggestions.md | BL-047 | proposed group row |
| FR-PHS-67 | functions/photos-and-suggestions.md | BL-047 | proposed group row |
| FR-PHS-69 | functions/photos-and-suggestions.md | BL-047 | proposed group row |
| FR-PHS-70 | functions/photos-and-suggestions.md | BL-047 | proposed group row |
| FR-PHS-71 | functions/photos-and-suggestions.md | BL-047 | proposed group row |
| FR-POL-02 | functions/support.md | BL-029 | proposed group row |
| FR-POL-03 | functions/support.md | BL-029 | proposed group row |
| FR-POL-04 | functions/support.md | BL-029 | proposed group row |
| FR-POL-05 | functions/support.md | BL-029 | proposed group row |
| FR-POL-06 | functions/support.md | BL-029 | proposed group row |
| FR-POL-07 | functions/support.md | BL-029 | proposed group row |
| FR-POL-12 | functions/support.md | BL-029 | proposed group row |
| FR-POL-13 | functions/support.md | BL-029 | proposed group row |
| FR-POL-14 | functions/support.md | BL-047 | proposed group row |
| FR-PRT-01 | functions/print-and-fulfilment.md | BL-973 | cited in the requirement text |
| FR-PRT-02 | functions/print-and-fulfilment.md | BL-027 | proposed group row |
| FR-PRT-39 | functions/print-and-fulfilment.md | BL-027 | proposed group row |
| FR-PRT-45 | functions/print-and-fulfilment.md | BL-027 | proposed group row |
| FR-PRT-49 | functions/print-and-fulfilment.md | BL-047 | proposed group row |
| FR-PRT-51 | functions/print-and-fulfilment.md | BL-047 | proposed group row |
| FR-PRT-54 | functions/print-and-fulfilment.md | BL-047 | proposed group row |
| FR-PRT-55 | functions/print-and-fulfilment.md | BL-047 | proposed group row |
| FR-PRV-01 | functions/privacy.md | BL-485 | cited in the requirement text |
| FR-PRV-02 | functions/privacy.md | BL-577, BL-579 | cited in the requirement text |
| FR-PRV-06 | functions/privacy.md | BL-960 | cited in the requirement text |
| FR-PRV-10 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-11 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-13 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-14 | functions/privacy.md | BL-961 | cited in the requirement text |
| FR-PRV-15 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-16 | functions/privacy.md | BL-962 | cited in the requirement text |
| FR-PRV-17 | functions/privacy.md | BL-962 | cited in the requirement text |
| FR-PRV-18 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-19 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-20 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-24 | functions/privacy.md | BL-579 | cited in the requirement text |
| FR-PRV-25 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-26 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-27 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-28 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-30 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-31 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-33 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-34 | functions/privacy.md | BL-026 | proposed group row |
| FR-PRV-36 | functions/privacy.md | BL-047 | proposed group row |
| FR-PRV-37 | functions/privacy.md | BL-047 | proposed group row |
| FR-PRV-38 | functions/privacy.md | BL-047 | proposed group row |
| FR-PRV-39 | functions/privacy.md | BL-047 | proposed group row |
| FR-PRV-40 | functions/privacy.md | BL-047 | proposed group row |
| FR-PRV-41 | functions/privacy.md | BL-047 | proposed group row |
| FR-PRV-42 | functions/privacy.md | BL-047 | proposed group row |
| FR-PRV-43 | functions/privacy.md | BL-047 | proposed group row |
| FR-PRV-44 | functions/privacy.md | BL-047 | proposed group row |
| FR-PRV-45 | functions/privacy.md | BL-047 | proposed group row |
| FR-PRV-46 | functions/privacy.md | BL-047 | proposed group row |
| FR-PRV-47 | functions/privacy.md | BL-047 | proposed group row |
| FR-PRV-48 | functions/privacy.md | BL-047 | proposed group row |
| FR-QAL-01 | functions/quality.md | BL-185 | proposed group row |
| FR-QAL-02 | functions/quality.md | BL-002 | cited in the requirement text |
| FR-QAL-03 | functions/quality.md | BL-185 | proposed group row |
| FR-QAL-05 | functions/quality.md | BL-185 | proposed group row |
| FR-QAL-06 | functions/quality.md | BL-185 | proposed group row |
| FR-QAL-07 | functions/quality.md | BL-929 | cited in the requirement text |
| FR-QAL-09 | functions/quality.md | BL-929 | cited in the requirement text |
| FR-QAL-11 | functions/quality.md | BL-185 | proposed group row |
| FR-QAL-12 | functions/quality.md | BL-185 | proposed group row |
| FR-QAL-15 | functions/quality.md | BL-185 | proposed group row |
| FR-QAL-16 | functions/quality.md | BL-185 | proposed group row |
| FR-QAL-17 | functions/quality.md | BL-185 | proposed group row |
| FR-QAL-20 | functions/quality.md | BL-185 | proposed group row |
| FR-QAL-21 | functions/quality.md | BL-185 | proposed group row |
| FR-QAL-22 | functions/quality.md | BL-185 | proposed group row |
| FR-QAL-23 | functions/quality.md | BL-185 | proposed group row |
| FR-QAL-25 | functions/quality.md | BL-047 | proposed group row |
| FR-QAL-26 | functions/quality.md | BL-047 | proposed group row |
| FR-QAL-27 | functions/quality.md | BL-047 | proposed group row |
| FR-QAL-28 | functions/quality.md | BL-047 | proposed group row |
| FR-QAL-29 | functions/quality.md | BL-047 | proposed group row |
| FR-REL-12 | functions/reliability.md | BL-566 | cited in the requirement text |
| FR-REL-13 | functions/reliability.md | BL-018 | proposed group row |
| FR-REL-17 | functions/reliability.md | BL-018 | proposed group row |
| FR-REL-23 | functions/reliability.md | BL-018 | proposed group row |
| FR-REL-24 | functions/reliability.md | BL-018 | proposed group row |
| FR-REL-33 | functions/reliability.md | BL-018 | proposed group row |
| FR-REL-40 | functions/reliability.md | BL-929 | cited in the requirement text |
| FR-REL-41 | functions/reliability.md | BL-018 | proposed group row |
| FR-REL-42 | functions/reliability.md | BL-978 | cited in the requirement text |
| FR-REL-43 | functions/reliability.md | BL-018 | proposed group row |
| FR-REL-45 | functions/reliability.md | BL-018 | proposed group row |
| FR-REL-48 | functions/reliability.md | BL-929 | cited in the requirement text |
| FR-REL-49 | functions/reliability.md | BL-929 | cited in the requirement text |
| FR-REL-59 | functions/reliability.md | BL-978 | cited in the requirement text |
| FR-REL-61 | functions/reliability.md | BL-018 | proposed group row |
| FR-REL-62 | functions/reliability.md | BL-047 | proposed group row |
| FR-REL-63 | functions/reliability.md | BL-047 | proposed group row |
| FR-REL-64 | functions/reliability.md | BL-047 | proposed group row |
| FR-REL-65 | functions/reliability.md | BL-047 | proposed group row |
| FR-REL-67 | functions/reliability.md | BL-047 | proposed group row |
| FR-REL-68 | functions/reliability.md | BL-047 | proposed group row |
| FR-REL-70 | functions/reliability.md | BL-047 | proposed group row |
| FR-REL-71 | functions/reliability.md | BL-047 | proposed group row |
| FR-REL-72 | functions/reliability.md | BL-047 | proposed group row |
| FR-RSH-03 | functions/research-validation.md | BL-038 | proposed group row |
| FR-RSH-06 | functions/research-validation.md | BL-983 | cited in the requirement text |
| FR-RSH-10 | functions/research-validation.md | BL-939, BL-961 | cited in the requirement text |
| FR-RSH-13 | functions/research-validation.md | BL-038 | proposed group row |
| FR-RSH-14 | functions/research-validation.md | BL-981 | cited in the requirement text |
| FR-RSH-15 | functions/research-validation.md | BL-038 | proposed group row |
| FR-RSH-16 | functions/research-validation.md | BL-962 | cited in the requirement text |
| FR-RSH-17 | functions/research-validation.md | BL-038 | proposed group row |
| FR-RSH-19 | functions/research-validation.md | BL-038 | proposed group row |
| FR-RSH-20 | functions/research-validation.md | BL-038 | proposed group row |
| FR-RSH-21 | functions/research-validation.md | BL-038 | proposed group row |
| FR-RSH-22 | functions/research-validation.md | BL-038 | proposed group row |
| FR-RSH-26 | functions/research-validation.md | BL-038 | proposed group row |
| FR-RSH-27 | functions/research-validation.md | BL-038 | proposed group row |
| FR-RSH-30 | functions/research-validation.md | BL-047 | proposed group row |
| FR-RSH-31 | functions/research-validation.md | BL-047 | proposed group row |
| FR-RSH-35 | functions/research-validation.md | BL-047 | proposed group row |
| FR-RSK-02 | functions/risk-security.md | BL-019 | proposed group row |
| FR-RSK-03 | functions/risk-security.md | BL-019 | proposed group row |
| FR-RSK-04 | functions/risk-security.md | BL-019 | proposed group row |
| FR-RSK-06 | functions/risk-security.md | BL-019 | proposed group row |
| FR-SEC-01 | functions/risk-security.md | BL-961 | cited in the requirement text |
| FR-SEC-02 | functions/risk-security.md | BL-961 | cited in the requirement text |
| FR-SEC-03 | functions/risk-security.md | BL-019 | proposed group row |
| FR-SEC-04 | functions/risk-security.md | BL-019 | proposed group row |
| FR-SEC-16 | functions/risk-security.md | BL-019 | proposed group row |
| FR-SEC-18 | functions/risk-security.md | BL-019 | proposed group row |
| FR-SEC-21 | functions/risk-security.md | BL-019 | proposed group row |
| FR-SEC-22 | functions/risk-security.md | BL-019 | proposed group row |
| FR-SEC-23 | functions/risk-security.md | BL-019 | proposed group row |
| FR-SEC-24 | functions/risk-security.md | BL-019 | proposed group row |
| FR-SEC-26 | functions/risk-security.md | BL-019 | proposed group row |
| FR-SEC-27 | functions/risk-security.md | BL-870 | cited in the requirement text |
| FR-SEC-28 | functions/risk-security.md | BL-047 | proposed group row |
| FR-SEC-30 | functions/risk-security.md | BL-047 | proposed group row |
| FR-SEC-31 | functions/risk-security.md | BL-047 | proposed group row |
| FR-SEC-33 | functions/risk-security.md | BL-047 | proposed group row |
| FR-SEC-34 | functions/risk-security.md | BL-961 | cited in the requirement text |
| FR-SEC-35 | functions/risk-security.md | BL-047 | proposed group row |
| FR-SUP-01 | functions/support.md | BL-100 | cited in the requirement text |
| FR-SUP-03 | functions/support.md | BL-029 | proposed group row |
| FR-SUP-04 | functions/support.md | BL-029 | proposed group row |
| FR-SUP-05 | functions/support.md | BL-029 | proposed group row |
| FR-SUP-07 | functions/support.md | BL-029 | proposed group row |
| FR-SUP-09 | functions/support.md | BL-029 | proposed group row |
| FR-SUP-10 | functions/support.md | BL-029 | proposed group row |
| FR-SUP-11 | functions/support.md | BL-029 | proposed group row |
| FR-SUP-12 | functions/support.md | BL-029 | proposed group row |
| FR-SUP-14 | functions/support.md | BL-029 | proposed group row |
| FR-SUP-15 | functions/support.md | BL-237, BL-783 | cited in the requirement text |
| FR-SUP-16 | functions/support.md | BL-105 | cited in the requirement text |
| FR-SUP-17 | functions/support.md | BL-029 | proposed group row |
| FR-SUP-21 | functions/support.md | BL-029 | proposed group row |
| FR-SUP-23 | functions/support.md | BL-100, BL-367 | cited in the requirement text |
| FR-SUP-24 | functions/support.md | BL-047 | proposed group row |
| FR-SUP-25 | functions/support.md | BL-047 | proposed group row |
| FR-SUP-26 | functions/support.md | BL-047 | proposed group row |
| FR-SUP-27 | functions/support.md | BL-047 | proposed group row |
| FR-SUP-28 | functions/support.md | BL-047 | proposed group row |
