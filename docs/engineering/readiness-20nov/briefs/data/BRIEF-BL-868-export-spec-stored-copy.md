BRIEF BL-868: Fix the export spec: the stored copy only, per-item filenames (NX-39-R32)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: data-architect   Lane: Pack 8 (foundations) with `legal`   Build: n/a (docs/legal; the founder merges, D-125)   Wave: 2   Size: S: 1 file, about 40 lines
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: nothing to write today; the merge is the founder's (docs/legal, D-125) and BL-933 waits for it (E25). Words in the README line are `content`'s and PROPOSED.

1. GOAL: When the founder merges this edit, then DELETION_AND_EXPORT_SPEC 4.2 says the export holds the stored, re-encoded copy with no Exif, XMP, IPTC or location, at photos/<entry_id>/<media_id>.<ext>, and no longer promises original bytes.

2. CARD ROWS and TEST TITLES
   Rows: NX-39-R32, NS-01-R6, NS-01-R14, NS-36-R5 (card 01 and 11; BL-868 row at docs/BACKLOG.md line 3395 on 450bcb4a); LEGAL-REQ-013, DATA-REQ-056.
   Test titles: none in code. Doc check (catalogue C, PR #926): [NS-01-R14][NX-39-R32] export carries the stored copy only is the BL-933 test; this PR makes the spec agree with it.
   Fails on old code: the spec line (docs/legal/DELETION_AND_EXPORT_SPEC.md:335 at develop) reads `photos/<entry_id>.<jpg|heic>  original bytes`, which contradicts LEGAL-REQ-013 and ADR 0028 D2.

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  docs/legal/DELETION_AND_EXPORT_SPEC.md (section 4.2 only), docs/agents/checkins/data-architect-bl-868.md
   Never:  docs/legal/data-policy.md and DATA_CLASSIFICATION.md (BL-960, privacy), export code (BL-933), ADR 0028 (BL-959), charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: DELETION_AND_EXPORT_SPEC.md is also edited by BL-960's neighbours; rebase on develop before pushing.

4. READING PACK
PR #917 KNOWLEDGE-PACKS-2.md Pack 8 and Pack 9; docs/adr/0028-photo-seal-find-on-device-data.md D1, D2 and Q3; data-and-sync.md sections 2.5 and 3.1 (develop); the spec's 4.2 file tree.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   docs/legal/DELETION_AND_EXPORT_SPEC.md:335         the line to change (checked on develop 16e61549)
   docs/legal/DELETION_AND_EXPORT_SPEC.md:355         the manifest example the new path must match
   apps/mobile/src/lib/export/schema.ts:90            EXPORT_SCHEMA_VERSION = '1.6.0' (the next free minor at merge, not hard-coded in the spec)
   docs/adr/0028-photo-seal-find-on-device-data.md    D2: the export path

6. DATA AND SECURITY
   Data classes: none new (documents the L4 stored copy that is already classified). No code, no storage, no send.
   Boundary: export. Owner of the read: compliance-engineer. The edit must not widen what leaves the phone.

7. LIBRARIES ALLOWED
none (docs only).

8. BUDGETS
none (docs only).

9. ACCEPTANCE
   Experience: none. Test cases: none in code; the BL-933 golden (PR #926 catalogue B NS-01-R14) is the proof the spec matches.
   Done also means: the exported README line says the derived index and the parent's hidden choices are not exported (BL-868 scope); the version number is described as 'the next free minor at merge' (CP1, AX-3).

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: the 4.2 edit and the README line, marked PROPOSED where a word is read by a parent | about 40 lines, 1 file | base develop | n/a

11. REVIEW LENSES
Lens A: compliance-engineer. Lens B: data-steward. The founder merges.

12. ORDER AND DEPENDENCIES
After: #797 (merged). Before: BL-933. Blocked by: the founder's merge (needs:founder).

13. DEFINITION OF DONE
   [ ] every claim in the doc is tagged [V] (file:line or sha), [E] (basis) or [U]; at least 10 cites re-opened and the count stated in the PR body
   [ ] ASCII only; no real family detail; no word a parent reads is final (PROPOSED only)
   [ ] PR body per HARNESS-RUN.md; labels agent:data-architect, from:agent (+ needs:founder when only the founder can merge)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
none (a document). The ZIP layout is proved by the BL-933 golden, and a real export on a phone is a BL-929 row.

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - the ADR and the spec disagree on the path; - HEIC copy handling needs a ruling (spec edit says 'may also carry a .jpg copy').

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #9 first; marker `<!-- journal run:sess-20261120-data-architect-bl-868 agent:data-architect -->`.
   Check-in: docs/agents/checkins/data-architect-bl-868.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: docs/legal-bl-868-export-spec-stored-copy in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:data-architect -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
