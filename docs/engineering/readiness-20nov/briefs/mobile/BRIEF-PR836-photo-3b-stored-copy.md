Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549` and head `6e613591`, 20 Nov 18:55 UTC).
Blocked until: #835 merged (this PR's base is `feat/mobile-photo-3-store`); the founder's size exception at the new size (981 added, 34 removed, 16 files; the exception covered 704 when given, so the slice grew by 311) [V `gh api pulls/836`, plan 2.1]; #854 merged; the character-limit line (founder, words). Code is complete and reviewed; the agent's job is to keep it landable.

```
BRIEF PR-836 (BL-931 slice 3b)                    Filled by: mobile RD-H1 for Karma, 20 Nov 2026 18:55 UTC
Agent: mobile   Lane: Pack 1 (Photo and media)   Build: 13 dark, 14 on (Q2)   Wave: 1

1. GOAL: When a parent keeps a picture with a letter, the stored copy is an upright JPEG with no metadata, a failure at any
   step leaves 0 files and 0 rows with the letter kept, and neither push nor pull touches `entry_media`.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R2, R4, R5, R6, R15, R17a, R21a, R21b, R54; NX-39-R8, R33. Card 01 at 450bcb4a.
   Titles (catalogue B, PR #926, exact):
     [NS-01-R6][NX-39-R8] 0 of 10 stored files carry metadata
     [NS-01-R15][NX-39-R33] sync carries no picture
     [NS-01-R17a] a failed picture leaves nothing and keeps the letter
     [NS-01-R21a] photo words and place are optional and capped
     [NS-01-R54] caps count graphemes and the database agrees
   Today the PR titles read `[NS-01-R21][BL-957]` (`photos-device.test.ts:228`) and `[NS-01-R17]` (`:288`): retitle to the exact
   catalogue titles (the P-8 pattern, #888), or `scripts/trace.mjs` skips the row.
   Red on develop: no `lib/photos/strip.ts`, `session.ts`, `text.ts` there. Mutants (catalogue B): keep the JFIF APP0 thumbnail
   or trailing bytes (`strip.ts:109-113`); remove the restore at `session.ts:139-146`; pull handler deletes `entry_media` rows;
   ceiling 140 code points.

3. FILES  Touch: lib/photos/{entry-media,session,strip,text,types}.ts, lib/db/migrations.ts (comments only),
   lib/capture/sweep.ts, lib/erase-everything.ts, tests photos-capture, photos-c8, photos-device, photos-phone, photos-surfaces, photos-helpers.
   Never: sync/merge.ts (read only; one assert goes in a test), lib/find/**, packages/content, later slices' files.
   Shared file rule: none beyond the stack; fixes to a lower slice go up by merge, never by rebase (HARNESS-GAPS H3, `stacked-prs` section 5).

4. READING PACK: Pack 1 items 1, 2, 4, 7; card 01 R6, R15, R17, R21; `stacked-prs` skill section 5 (rebuild after a squash merge).

5. CODE ENTRY POINTS (head 6e613591, branch feat/mobile-photo-3b-stored-copy)
   src/lib/photos/strip.ts:109-113     keeps one bare 16-byte JFIF APP0, drops JFXX and the thumbnail
   src/lib/photos/session.ts:139-146   the take-back after a failed row insert
   src/lib/photos/text.ts:11           CODE_POINTS_PER_CHARACTER = 16 (Hermes has no Intl.Segmenter, ADR 0014)
   test/photos-device.test.ts:228, :288   caps and the take-back tests; test/photos-surfaces.test.ts:41 the pull test
   develop: src/lib/sync/merge.ts:110  applyEntryState, the push-result path with no test (review A note 1)

6. DATA AND SECURITY
   Data classes: L4 picture bytes and L3 words and place, local only. New storage: files under Application Support/photos; none sent, none logged.
   Boundary: B1 (module/file), NSC-08 temp copies; AB-51 hostile picture (PR #915 ABUSE-AND-FAILURE-CASES); X2: nothing leaves the phone.
   Owner of the read: compliance-engineer posted B; add security-architect for the strip (metadata is the leak).
   Checklist: SECURE-CODING-CHECKLIST 1, 2, 6, 9 (PR #915).

7. LIBRARIES: none new. ImageIO stays in `scribe-photo` (LD-06 OWN, PR #919). No expo-image-manipulator (LD-13 AVOID).

8. BUDGETS (PR #928): D-01 stored copy at most 4,032 px, JPEG 0.85, no metadata (unit, BLOCK; the 4,032 cap is BL-953, not here);
   C-03 thumbnail p95 1,000 ms and stored copy p95 1,500 ms (device, HOLD flag); C-08 kill while attaching: 0 orphans (sim).
   Checked: D-01 strip by unit; C-03 and C-08 not measured here (device row).

9. ACCEPTANCE  Experience: A-S07 Review picture card (EXPERIENCE-ACCEPTANCE, PR #921). Test cases: catalogue B rows above.
   Security: SPA section 5 items 2 and 3 (store in X4-R1 enumeration, Erase scan). Done also means: each new test red on the old code and on its mutant.
   Open review notes to turn into tests only if cheap and in size: (1) assert `entry_media` unchanged after `applyPushResponse` (kills B8);
   (2) pin the cap edge with a 16-code-point cluster x 140 (kills T5, T6); (3) the Hermes fallback splits flags and Thai clusters
   (review A): a known gap, say so, do not widen.

10. PR BREAKDOWN: exists (#836, base feat/mobile-photo-3-store). When #835 merges: retarget to develop, rebuild per `stacked-prs` 5,
    two counted reviews at the final head, macOS launch. Flag-off proof: `photos-phone.test.ts` (switch off registers nothing).

11. LENSES: A data-steward, B compliance-engineer (plan: principal-architect / compliance-engineer). Both PASS WITH NOTES at 6e613591.

12. ORDER: after #835; before #837. Blocked by: founder (size exception, words), #854.

13. DEFINITION OF DONE
    [ ] new or retitled tests red on old code; `npm test -w apps/mobile`: only the 8 baseline files (73 tests) red
    [ ] `cd apps/mobile && npx tsc --noEmit`: only the 5 known errors; ASCII only; no path, hash or caption in any log
    [ ] size named on the PR (1,015 lines against the 704 the exception covered); labels agent:mobile, from:agent, needs:founder
    [ ] journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: ten fixtures through the real ImageIO (HEIC, rotated, oversize); GPS gone from the written bytes
    (AB-43); stored file and folder carry no backup exclusion (NS-01-R27, CI simulator). Plan "Gate: D" column.

15. STOP AND ASK: the cap needs a different count than code points x 16; a finding that the strip misses a marker (security-architect first);
    a change to `sync/merge.ts` itself; the base moves; two failed attempts.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-pr836 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-pr836.md`. Branch feat/mobile-photo-3b-stored-copy (exists, no force). Comments start `<!-- agent:mobile -->`.
```
