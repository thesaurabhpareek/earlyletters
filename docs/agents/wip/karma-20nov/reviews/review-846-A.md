## Review A at 450bcb4a9efb4bf73991ee134d91662658de2426: CHANGES
<!-- agent:qa -->

Lens A: accuracy and internal consistency of the locked requirements pack v1.0 (cards 00 to 14, 16, README, VISION, stack rank, BACKLOG BL-952 to BL-987).

Must fix:
1. NS-10 says one hole remains (BL-922), but NS-10-R3 and R5 fail on develop, and its build is split across two rows. Section 2 (08:417) and section 22 (08:572) name only BL-922. On develop, nothing scopes the local book to an account: `account-claim.logic.ts:15-16` stops sync on an owner mismatch and "the letters stay", and `listChildren()` is not filtered by owner, so account B is shown account A's book. BL-961 holds this work ("Fails on old code: `[X4-R1]`", "NS-10 second-account rows"). BL-978 also claims "NS-10-R0 to NS-10-R14", but its scope has no second-account work and no `Depends on: BL-922` (it says only "Builds on BL-922"). As written, two builders could claim R3 and R5, and NS-10's builder reads that the gap is closed. Fix: in NS-10 sections 2 and 22, say R3 and R5 fail today and name BL-961. Take R3 and R5 out of BL-978's Satisfies, or make BL-978 depend on BL-961, and add `Depends on: BL-922`. Not in 18-errata.
2. NS-09-R6 (Storage line and Remove now) is not built, and no row builds it. A trace check would also count it as covered. Develop has no failure counter, no Storage line and no "Remove now" (searched `apps/mobile/src`, `packages/content/src`). NS-09 section 2 (08:240) says only BL-925 and BL-926 remain. BL-926 is the Review line (F04-REQ-009). BL-977 claims "NS-09-R9 to NS-09-R17", and its scope labels the failure counter `discard.failures.<draft id>` "R6", but the counter is NS-09-R15 (08:315). A test tagged `[NS-09-R6]` for the counter would mark the Storage row as covered when nothing has been built. Fix: correct the label in BL-977 to R15, and give R6 a row: extend BL-977 or add a new one. Also note that the built Storage screen says "Letters and recordings never appear here" (`apps/mobile/src/app/settings/storage.tsx:24-28`), so R6 needs a stated precedence over that rule or a ruling. Not in 18-errata.
3. Two cards point builders at superseded definitions of the consent trigger and the `book_entries` view. NS-25 section 10 (10:817) and NS-36 section 2 (11:607) say a new synced column "must be added to" the tuple at `20261003000000_security_and_family.sql:444-450` and the view at `20261002020000_data_governance.sql:210`. Both were replaced by `20261015030000_v1_wire_contract_columns.sql:145` (function, tuple at :174-186) and `:229` (view, :229-248). The older tuple lacks `author_edits`, `locked_spans`, `pack_ref`, `occurred_precision` and `base_direction`, so a `create or replace` built from the cited lines would drop five columns from the consent gate. NS-06 (06:158-159, 06:397-398) and the PR body already state the correction ("F12 cites: the latest content trigger and `book_entries` are in `20261015030000`"), so the pack contradicts itself. Fix: re-point both lines to the 20261015030000 definitions. 09:646, 09:707 and 01:228 cite the old files only to show a column is present; that is true but should be re-pointed in the same pass. Not in 18-errata (E1 and E2 are about other lines).

### What I checked

- Head 450bcb4a (read from the API), committed 05:07 UTC on 20 Nov, more than 6 hours old. Merge base with develop is 4f89d659. Develop has moved to 21e0341a, with no change under `docs/product` since then. GitHub reports it mergeable.
- CI at the head: all 10 checks completed with success, including `required`, `tests and content rules`, `agent team consistent`, `applied migrations unchanged` and `compliance-fence`.
- PR body and all 8 comments, including the product thread's 05:14 UTC request for two lenses. `docs/product/prd/18-errata-after-lock.md` on `docs/locked-pack-inputs-20nov` (7fcdf7c2, E1 to E22) is the known-corrections list.
- Ids, all of them, by script over cards 01 to 12:
  - 636 acceptance-row ids are defined, with 0 duplicates. Every row's test-title tag matches its id except one (note 4). 0 test titles are duplicated.
  - The 14 section 7 P0 register has 296 rows, all unique, and equals the set of rows whose Priority cell starts `P0`: 0 missing, 0 extra.
  - Every full-form `NS-xx-...` reference across `docs/product/prd`, BACKLOG, VISION and the stack rank resolves, apart from stale references to split ids (note 5). Short forms ("R37b", "C5-6") resolved against their card: no dangling id other than ids from other schemes (FS-R10, PRIV-R21, NX-39-R51 and similar).
  - BL-952 to BL-987: 36 headings, unique, with no clash against develop (BL-949 was the last there). Every NS id they cite exists, except NS-01-R17 (split) in the section intro and NS-04 Q1 to Q15, which are spike questions, not rows.
- Code cites (file:line), checked against develop at 4f89d659:
  - 142 path:line cites in the cards and the new BACKLOG section. Sampled 36 at random (seeds 846 and 2026; 33 distinct), plus 30 targeted. The targeted ones were every cite behind the PR body's "code facts" list (`ScribePhotoModule.swift:50-51` 4,096 px and q 0.9; `kill-switches.ts:15-16`; `prefs.ts:114-117`; `planner.ts:313-316`; `store.ts:390` setChildQuiet with no caller; stt_meta at `sync.ts:161`, `transcribe.ts:53`, `build.logic.ts:689` writes null), plus reminders, export, content and migration cites.
  - About 63 distinct cites read. All quote or describe the cited line correctly, with two exceptions: `sync_v1_server.sql:1589-1602` as the held-section builder (wrong, already erratum E2) and the superseded-definition cites in must fix 3.
  - Cards 08, 09 and 11 say they were read at 697233d3. The only code changes between that and 4f89d659 are new photo files, so no cited line moved.
- Built-or-not claims:
  - NS-10-R3 fails today, and the card does not say so (must fix 1).
  - NS-32-R14 fails today: `prefs.ts:116` maps only `remindersOn`, and `Child.quiet` is never read by the planner. The card states it as a requirement and makes no "built" claim, so the PR adds nothing false. Erratum E16 already covers the code fact and the new row.
  - NS-09-R6 is not built, and no row builds it (must fix 2).
  - NS-13-R14 is correctly marked "not built today": develop calls `forgetReminders` only from `erase-everything.ts:84`.
  - NS-22: `setChildQuiet` has no UI (true).
  - NS-01 native caps (true at `ScribePhotoModule.swift:50-51`).
- Acceptance rows: I read every row of NS-03, NS-09, NS-10, NS-13 and NS-36, and about 40 more across the other cards. They are Given/When/Then with a measurable Then. Rows that only a process can check name their check (NS-03 checklists, NS-34-R2). Exceptions are in note 6.
- Cross-card contradictions: checked Home slip order (00, 08, 10, NS-11-R4, NS-23-R6: consistent), stored copy (T3, in 01 and 11: consistent), Free or Plus (every card section 20: free and consistent with D-082, T2), the back-off (note 1) and the pending ceiling (E13). These were already ruled in 18-errata and I did not raise them again: seal publication (E4), export 1.8.0 (E5), the app switcher snapshot (E18), the BL-939 share text (E14), BL-947 private letters (E15), the length units (E10 to E12), and consent pulls (E9).
- ASCII and content rules:
  - All 20 changed files are ASCII only.
  - I scanned every double-quoted string in cards 00 to 12 for loss, fear, AI, streak, count, "coming soon" and gendered words. Every hit is inside a Banned, Forbids or Never list or quotes a parent's feeling, except one (note 7).
  - Every parent-facing line is marked intent or PROPOSED, with `content` to write it and the founder to approve.
- Dates and promises:
  - No card sets a calendar date or a build number (T5 holds in 01 to 12).
  - Every promise to a parent sits behind a counsel read or the founder's approval. That includes the pilot deletion clocks (NS-03-R1 gates contact on counsel) and "never a Plus feature" (08, marked for counsel).
  - The founder defaults in the PR body ("Open for the founder") are marked as taken under the 19 Nov delegation and reversible.

### Notes (not blocking)

1. NS-32 section 3 (11:36) and its edge-case table (11:56) say the back-off applies "to the `evening` class only", "7 daily". NS-13 3a step 3 and NS-13-R4 also stop month and birthday notes after day 35, and NS-13-R32 makes days 1 to 7 follow the chosen cadence. NS-32's Not in scope defers "what each class says and when" to NS-13, so NS-13 wins. Change the NS-32 wording when the card is next touched.
2. Many P0 rows have no backlog row citing them, so gate G0 ("every P0 has a test and a backlog row", 14 section 6) cannot pass yet. Earlier rows' Satisfies ranges were not extended to the rows added on 20 Nov:
   - BL-942 stops at NS-11-R9 (misses P0 R10, R12, R23).
   - BL-941 stops at NS-14-R7 (misses R8, R11).
   - BL-947 stops at NS-24-R3 (misses R10).
   - BL-937 stops at NS-21-R5 (misses R9, R11, R13).
   - These cards have no row at all: NS-17 (P0 R1 to R8, R10), NS-19 (R1, R4), NS-33-R1 to R8, NS-34 (R2, R5, R6), NS-35 (R1, R3, R4), NS-37-R2, and NS-36 apart from R4 and R6.
   - The NS-03 pilot rows are founder process and arguably need no row.
   - Not a false fact, but the PR body says "No backlog rows are added here" while the diff adds BL-952 to BL-987. Erratum E7 and GAP-LOG cover NS-17 only in part.
3. Stale status lines. 13-engineering-plan (NS-32 row) and the stack rank row 23 say NS-32 has no backlog row, but BL-966 is that row. NS-16 is sized "S to M" in 13 and "M to L" in the stack rank (row 29). BL-959 waits on "#797 merged", but #797 is merged (E22 covers it).
4. NS-09-R4b's test title is tagged `[NS-09-R4]` (08:304). That id does not exist, so the trace will never see R4b, which is P0. NS-36-R4 and R6 (P0) have "the acceptance record" and "inventory check" in place of a test title.
5. Some lines still reference ids that were split on 20 Nov with no marker kept:
   - NS-01-R9, R10, R17, R21 and R23 (README 104, 119, 123, 124, 144; 02:29, 02:102; BACKLOG intro).
   - NS-02-R16 (11:682) and NS-05-R4 (README 127).
   - NS-11-R6 (BL-942 "Fails on old code"; now R6a and R6b).
   - BL-950 and BL-951 belong to engineering and cite "NS-01-R17", which is now R17a to R17c.
6. "PROPOSED" thresholds are testable once set, but a few rows lean on words a test cannot check alone: "one calm line" (NS-01-R46, R58; NS-16-R6) and "feel safe" (NS-34-R2's reason). The content key and the founder's approval make them checkable; worth naming the key in each row.
7. The NS-10 tester question (08:569) asks "Did anything look missing...", while NS-10's own content section bans "missing" (08:554). It is a hand-sent question that parents read; reword it to match.
8. README tables still carry Build 13, 14 and 15 in defaults and study triggers (README 69 to 74, 117, 124, 149 to 157). Line 76 says the roadmap supersedes the timing words, so this is consistent with T5, but cleaner without them.
9. The shape is not uniform. Cards 04 to 07 have 22 numbered sections, with Label effect in the header, and 03 has 25. README says every card has 23 sections, "may not be missing". Each card does carry the content.

### Not verified

- Facts read from open PRs (#798 rebuild in one transaction and the missing debounce; #835 and #836 CHECKs; #837 `flag.ts`; #758 registry; #838 `surface.ts`): those heads were not read in this pass.
- Counsel packet 1.5.0 question numbers, and the research notes' readings of Apple pages.
- Whether every RR-4 reason letter fits its row.
- Anything on a phone.

Reviewer: independent of the author (CR-44).
