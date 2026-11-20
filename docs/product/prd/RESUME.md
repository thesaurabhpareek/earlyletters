# Resume sheet for the product pack (20 Nov)

Status: CURRENT | 20 Nov 2026 | Owner: `product` | Replaces: none | Load when: restarting after a usage limit or outage.

Status detail: LOCKED 20 Nov 2026, requirements rev 2 (cards 00 to 27, function files, design areas A to E). Founder, 20 Nov: "Go with all default answers. Focus on what's best for customer experience. And proceed to lock all requirements and once done inform harness and engg leads working on architecture." Changes only by an errata row (next free E number in `18-errata-after-lock.md`, highest E68); no duplicate copies; rulings by id in `GAP-LOG.md` "Closures 20 Nov"; what remains is execution-side (`22-final-holistic-spec.md` section 10). Remaining threads below are execution-side or historical; the closures are applied in place (`GAP-LOG.md` "Closures 20 Nov").

If a usage limit or outage stops any session, restart at 03:01 Pacific (founder, 19 Nov). Anything not pushed is lost, so every thread pushes to `docs/locked-pack-inputs-20nov` (product) or `docs/e2e-ux-20nov` (design) at least every 30 minutes. No force push. Do not move the head of #846.

## Where the pack stands (20 Nov 2026)

Done, in place on this branch:
- Cards 00 to 27, errata E1 to E73 and the function files (23 reviews and the brief in `functions/`) are locked at rev 2; the eight founder answers are in `22-final-holistic-spec.md` section 7.
- Wave 3 (days library, notification catalogue, cultural data, IA audit, photos, feature opportunities) is written and folded into cards 21 and 27.
- Reviews: council rounds 1 and 2 (`15`, `16`), the ten NS-46 to NS-50 reviews and the engineering evaluations (`tools/review/`) are answered in the cards and `GAP-LOG.md`.
- Closures: `GAP-LOG.md` "Closures 20 Nov" is applied in place. K12, K14, K15, K16 and K17 are carried into the cards (K12 in NS-48-R34, K14 in NS-30, K15 after NS-45-R18 and NS-10-R14, K16 in `14-test-plan.md` section 7, K17 as NS-17-R11 and R12); no errata row was needed.
- Registry and load order: `REGISTRY.md` (every file, with layer, status, owner, load-when, lines) and `LOAD-ORDER.md` (the least each role reads). Status headers are on every pack file except `FUNCTION-TRACE.md` and `BACKLOG-GAPS.md`; superseded files carry a SUPERSEDED-BY banner (list in `REGISTRY.md`).

Still to do:
- Done in the final audit (`25-instruction-coverage-audit.md`): headers on `FUNCTION-TRACE.md` and `BACKLOG-GAPS.md`; P0 counts re-run with `p0.py` (1,048 rows; 781 without a row-level backlog row at that time, now 1,050 and 771 after E43 to E60); `tools/review/p0-table.md` and BACKLOG-GAPS section 7 regenerated; errata E33.
- The Project doc `claude/Karma-requirements-locked-2026-11-20.md`: update in place (status, rev 2 LOCKED, file map by `REGISTRY.md` pointer, the eight answers by pointer to `22` section 7, stale counts removed). Needs a session with the Projects tool; not done from the repo session.
- The PDF: build with `python3 -I docs/product/prd/tools/pdf/build.py` (writes `/tmp/pdf/early-letters-requirements-rev2.pdf`; not committed). Upload to Drive: not done (the coordinator).
- Inform the harness and engineering architecture leads: the lock was posted on the readiness-folders claim at 18:27 UTC with the plan question (founder items 34 to 38); no engineering reply at 18:40 UTC. Engineering findings are triaged in `25` section 3.
- Execution side only: spikes, device rows, counsel batch (F6), founder hands, gates G0 to G6 (`22` section 10). A manual pass to move BL and PR ids out of product-layer card prose is owed (`REGISTRY.md` states the count).

## Evening pass, 20 Nov (rulings 1 to 24 on engineering's questions, reviews A and B)

Done on this branch, by `product` for Karma:
- Errata E43 to E73 (`18-errata-after-lock.md`), one per ruling or tight group, each ending "Plan delta:"; closures CL-117 to CL-147 in `GAP-LOG.md` (CL-001 to CL-147 now). E30 to E32 got Plan delta lines; E23's line cites are corrected.
- Card edits in place: 01 (R36, R61), 05 (picture gated by Q45 and the security read), 08 and frame (X4-R1), 09 (NS-18-R3), 11 (NS-34, NS-37), 19 (NS-40-R8, R9, NS-42-R17, R18, NS-45 R13 to R17, O-13), 21 (Drop D, level 3 wording, NS-46-R25, NS-47-R14, R37, R38, no Days ask flag), 22 (Drop D, founder digest, ids moved out), 27 (position and poster name, R10 floor), FR-PRV-25, FR-LCY-13, FR-SEC-06, FR-QAL-02 and BL-577's last criterion.
- Founder digest in `22-final-holistic-spec.md` section 7: E43, E46, E47, E56, E59 and the acceptance lines for CL-008, 015, 052, 097, 099, 103 (default in force, deadline Mon 23 Nov).
- Counts now equal `p0.py`: 1,050 P0 rows (536 NS, 514 FR); 198 row-covered, 81 cite-covered, 44 card-level only, 727 none; 771 without a row-level backlog row. Re-run `tools/trace-gen` (parse, gen, check: all passed, 947 FR rows) and `tools/review/p0.py`.
- Design rulings 25 to 37 (PR #978) have ids: E69, CL-143; rulings 27, 29, 31 and 33 are carried into the cards (E68). Not done: new rows for E46, E48, E51 and E63 have no BL id: none is made until the four-digit dispatcher fix (PR #912) merges (E60). The founder says which devices he holds. The review B items 3, 5 and 6 (merge-approval sha on record, which of #934 and #846 to merge, the NS-49-R9 constitution reading) are for the founder, the merge owner and the CAIO or Karma, not for this pass.

## Threads to restart
- FUNCTION-TRACE builder: writes `docs/product/prd/FUNCTION-TRACE.md`.
- Integration (product session): re-run the trace over all function files, route engineering rows to #846, send design leads their "Function needs accounted for". The second-wave function reviews are all written; none needs restarting.

## Harness
Agent PRs label `agent:<handle>`; they never merge. New BL rows only up to BL-999 until the dispatcher id format is fixed.
