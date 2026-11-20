Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 19:30 UTC).
Blocked until: BL-868 merged (the `docs/legal` edit, founder merges it, D-125, CR-62 item 3; legal and content draft the words; BL-868 is "ready, not written" [V plan 2.2]); BL-931 done (#835 to #840 merged); Karma rules the export minor (errata E25 holds BL-933 until the founder merges the legal edit; E5 allocates minors in merge order). Conflict for product: NS-52 (several items per letter, unlocked, PACK-DELTA-3 in PR #932) cannot fit `ExportEntry.photo: ExportPhoto | null`; AX-3 (export for minors) is a CR-67 item in the same ADR amendment (BL-959, not seen merged [U]). Build the locked card: one picture.

```
BRIEF BL-933 (export schema 1.7.0)                Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:30 UTC
Agent: mobile (export owner)   Lane: Pack 1 (Photo and media)   Build: 14 on   Wave: 2

1. GOAL: When a parent exports the book, each kept picture is in the ZIP at `photos/<entry_id>/<media_id>.jpg` as the stored copy only, with no
   metadata, the schema reads 1.7.0, and an export made by 1.6.0 still reads.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R14, R6 (export bytes); NS-36-R2, R5, R7; NX-39-R32. Cards 01 and 11 at 450bcb4a.
   Titles (catalogue A and B, PRs #925 and #926, exact):
     [NS-01-R14][NX-39-R32] export carries the stored copy only
     [NS-36-R2] export holds every part
     [NS-36-R5] export 1.7.0 golden
     [NS-36-R7] export versions one way
     [NS-01-R6][NX-39-R8] 0 of 10 stored files carry metadata   (export bytes half)
   Red on develop: `EXPORT_SCHEMA_VERSION = '1.6.0'` (`lib/export/schema.ts:90`), no `photo` field. Mutants: write the list copy instead of the stored copy (R14);
   skip the photo object in the writer (NS-36-R2); change the photo path pattern (R5); loosen the 1.6.0 schema to ignore unknown keys (R7).

3. FILES  Touch: lib/export/{schema,build.logic,pack,verify}.ts, lib/photos/export.ts (new), test/export-golden.test.ts and its golden dir (freeze today's as `_v1.6.0/`),
   test/helpers/asha-photo.ts (new, fixtures do not count toward CODE-R02), test/helpers/asha-export.ts; README and `index.html` lines are PROPOSED content keys.
   Never: lib/photos/{strip,session}.ts, lib/find/**, supabase/**, docs/legal/** (BL-868's), packages/api.
   Shared file rule: `packages/content` export keys have one owner in wave 2; list new keys PROPOSED.

4. READING PACK: Pack 1 item 2 (ADR 0028 D2, lines 68-76) and 11-foundations section 8.3; `docs/engineering/readiness-20nov/` PR #915 checklist section 9 (export); Pack 9 (data contracts, PR #917 part 2).

5. CODE ENTRY POINTS (develop 16e61549)
   apps/mobile/src/lib/export/schema.ts:90        EXPORT_SCHEMA_VERSION = '1.6.0'; versioning rules in the header comment (additive optional field = minor)
   apps/mobile/src/lib/export/{build.logic,pack,verify}.ts   builder, writer, sha256 check as for audio
   apps/mobile/test/export-golden.test.ts          the golden; export-schema.test.ts, export-schema-published.test.ts
   `entry_media` is on #835's head (src/lib/photos/entry-media.ts), not on develop

6. DATA AND SECURITY
   Data classes: L4 picture bytes leave the phone ONLY by the parent's own share-sheet hand-off of the ZIP (as recordings do): no new X2 path; security-architect reads it as a lens.
   Boundary: B6 recipient and export; AB-42 (export built with every key set holds none of Days, moments, index), AB-43 (GPS in stored bytes: the scan over written bytes fails the build), AB-44 (recovery export).
   Checklist: PR #915 section 9. Never read the list copy for export; only export reads the stored copy (NS-37-R8).

7. LIBRARIES: fflate (zip) and @noble/hashes (sha256) already installed (LD-33 USE, PR #920). No new dependency.

8. BUDGETS (PR #928): export peak memory under 150 MB: stream, never hold (`06-nfr.md` 2.5; M-04 for video, later); D-01 stored copy size 2 to 4 MB each; N-01 0 network calls.
   Checked: add a test that the writer streams a 20-picture Asha fixture without holding all bytes [Rec]; not measured on a device.

9. ACCEPTANCE  Experience: C export screen (settings/export, EXPERIENCE-ACCEPTANCE-2 C-S, PR #921): the estimate adds picture bytes (F15-REQ-010).
   Test cases above. Security: AB-42, AB-43. Done also means: each test red on old code and on its mutant; the 1.6.0 golden still reads.

10. PR BREAKDOWN (design 8.3: two PRs)
    PR a: `lib/photos/export.ts` and schema 1.7.0 | about 300 lines, 7 files | base develop (after the stack) | flag-off proof: with no pictures the ZIP equals 1.6.0 plus version 1.7.0
    PR b: the golden (frozen 1.6.0, regenerated 1.7.0 with one Asha picture) | about 250 lines excl. fixtures | base PR a
    Both wait for BL-868 merged by the founder, and for #835 and #836.

11. LENSES: A data-steward, B compliance-engineer (plan 2.2). Add security-architect on the writer.

12. ORDER: after BL-868, BL-931; before BL-973 (proof book, wave 4). Blocked by: founder (BL-868 merge), counsel/legal words, Karma (minor number).

13. DEFINITION OF DONE
    [ ] tests red on old code; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only 5 known errors
    [ ] `npm test -w packages/content` (README keys); ASCII only; Asha only in fixtures; labels agent:mobile, from:agent, needs:founder
    [ ] journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: an export of a real-size book opened on a second device or computer; the share sheet hand-off; free-space refusal (D-07).

15. STOP AND ASK: the minor number is contested; the export must carry several pictures or video (NS-52); a column is classed without privacy; `docs/legal/**` must change.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl933 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl933.md`. Branches `feat/mobile-bl-933-{a-schema,b-golden}`. Comments start `<!-- agent:mobile -->`.
```
