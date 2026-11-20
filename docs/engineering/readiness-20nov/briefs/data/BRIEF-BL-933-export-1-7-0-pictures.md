BRIEF BL-933: Export 1.7.0 carries the stored picture copy, with a golden and old-file reads (NS-01-R14, NS-36-R5, NS-36-R7, NS-11-R10)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: mobile   Lane: Pack 1 (photo) with Pack 8 (data rules)   Build: 14 on (merged dark before)   Wave: 2   Size: M: design 2 PRs (schema 1.7.0, then the golden), each within 400 lines
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: BL-868 merged by the founder (E25), BL-931 (all photo slices) merged. The golden needs the stored copy from #836 and the entry_media store from #835 (both open, A and B PASS WITH NOTES, waiting on size exceptions).

1. GOAL: When a parent exports a book with pictures, then the ZIP holds each stored copy at photos/<entry_id>/<media_id>.jpg, the manifest counts them, the version is the next free minor (1.7.0 if it merges before Firsts), and a 1.6.0 file still reads.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R14, NS-36-R5, NS-36-R7, NS-36-R2, NS-11-R10 (PR #926 catalogue B and #927 catalogue D).
   Tests (exact):
     [NS-01-R14][NX-39-R32] export carries the stored copy only    mutant: write the list copy instead of the stored copy
     [NS-36-R5] export 1.7.0 golden                                 mutant: change the photo path pattern
     [NS-36-R7] export versions one way                             mutant: loosen the 1.6.0 schema to ignore unknown keys
     [NS-36-R2] export holds every part (picture, copies, first, seal when they exist)   mutant: skip the photo object in the writer
     [NS-11-R10] the copy holds every picture                       mutant: skip the stored copy for the oldest
   Positive control for the no-Exif check: a synthetic Asha source JPEG that carries GPS Exif (latitude and longitude in the GPS IFD, plus XMP and IPTC blocks) is committed as a fixture; the scan helper first asserts it FINDS GPS in the source, then asserts it finds none in the exported copy. Mutant: copy the original bytes (red because the scan then finds GPS).
     [NS-01-R14][NX-39-R32] export names are built from ids only    hostile-name test: a letter whose caption is `../../x` and place is `a/b\c` and whose ids are valid; assert every path in the ZIP matches photos/<uuid>/<uuid>.jpg and no entry contains `..`, `/` from text or a separator from text. Mutant: put the caption in the filename.
   Red on develop: lib/export has no photo writer; EXPORT_SCHEMA_VERSION is 1.6.0 (schema.ts:90).

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  apps/mobile/src/lib/export/{schema.ts,build.logic.ts,pack.ts,verify.ts,copy.ts}, the published JSON schema file and its test (export-schema-published.test.ts), test/helpers/asha-export.ts, test/export-golden.test.ts, docs/agents/checkins/mobile-bl-933.md
   Never:  lib/photos/** (the photo stack), supabase/**, docs/legal/** (BL-868), the sync contract, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: export schema is also bumped by NS-06 Firsts (E2, 1.8.0) and seals (E3, 1.9.0): the next free minor at merge, never a fixed number (CP1).

4. READING PACK
PR #917 KNOWLEDGE-PACKS.md Pack 1 and KNOWLEDGE-PACKS-2.md Pack 8; data-and-sync.md sections 2.5, 3.1, 3.6 PR 9 (develop); ADR 0028 D2; BACKLOG BL-933 (line 3599 at 450bcb4a).
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   apps/mobile/src/lib/export/schema.ts:7-10, :90        versioning rule (semver, one-way, each minor reads earlier minors); the constant
   apps/mobile/src/lib/export/device.ts:295               file name without account data
   apps/mobile/test/export-golden.test.ts, export-schema.test.ts, export-schema-published.test.ts   the golden and the published schema
   apps/mobile/test/helpers/asha-export.ts                the Asha fixture to add one picture to
   #836 (open, 6e613591) photos stored-copy writer; #835 (open, 39cf30d3) entry_media (migration 11)

6. DATA AND SECURITY
   Data classes: stored picture copy L4, in the export only; ids L3; no Exif, XMP, IPTC or location in the file (assert it on the fixture). A picture leaves the phone only through the parent's own export (X2 note: parent-initiated share sheet).
   Boundary: export. Owner of the read: security-architect (path traversal in names: every name is built from ids, never from text).

7. LIBRARIES ALLOWED
Use installed fflate and the existing export writer; stream, never hold the whole copy (peak under 150 MB). None new.

8. BUDGETS
Export peak memory 150 MB or less, streamed (M-04, PR #928, HOLD for video; apply to pictures too); progress within 500 ms and 1,000 letters resume or report (NS-11-R9, R24). Checked by: Node shape test; SE 3 export of the year-1 fixture: not measured.

9. ACCEPTANCE
   Experience: none new on screen. Test cases: PR #926 catalogue B (NS-01-R14), PR #927 D (NS-11-R10), catalogue A NS-36 rows. Security: PR #914 export section.
   Done also means: an export made by 1.6 still reads (BL-933 done line); each test red on old code and its mutant.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: schema 1.7.0 (optional photo fields), published JSON schema, [R7] one-way test | about 200 lines, 5 files | base develop | no flag; photos off writes no picture
   PR 2: the writer, README line, golden with one Asha picture, [R14][R5][R2][NS-11-R10] | about 350 lines, 8 files | after PR 1 and #836

11. REVIEW LENSES
Lens A: data-steward. Lens B: compliance-engineer.

12. ORDER AND DEPENDENCIES
After: BL-868 (founder merge), BL-931. Before: BL-973 (printed pages), NS-11 R10. Blocked by: founder merging BL-868; size exceptions on #835 and #836.

13. DEFINITION OF DONE
   [ ] focused tests (red on old code, red on the named mutant), then `npm test -w apps/mobile` (baseline: 8 files, 73 tests fail for missing expo-local-authentication, expo-clipboard; nothing else)
   [ ] `cd apps/mobile && npx tsc --noEmit`: only the 5 known errors
   [ ] `npm test -w packages/content` if any string or content key changed (new keys are PROPOSED)
   [ ] ASCII only in added lines; no content in logs; fictional family Asha only
   [ ] PR body per HARNESS-RUN.md (Agent, Mode, Satisfies, Data classes touched); labels agent:mobile, from:agent (+ needs:founder)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
A real export of a book with pictures shared to Files on a phone; the ZIP opens on a Mac; no location in the JPEG (ten fixtures through ImageIO are #836's device row).

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - a picture has an original-only path; - the version number is already taken by another merge: take the next free minor.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #8 first; marker `<!-- journal run:sess-20261120-mobile-bl-933 agent:mobile -->`.
   Check-in: docs/agents/checkins/mobile-bl-933.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: feat/mobile-bl-933a-export-1-7-0-schema in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:mobile -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
