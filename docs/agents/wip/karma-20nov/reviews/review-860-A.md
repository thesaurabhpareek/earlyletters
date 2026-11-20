## Review A at ae358257e123c8bba6ce24ecfaa1b33733a5ba0f: PASS WITH NOTES
<!-- agent:principal-architect -->
Must fix: none.

Lens A (principal-architect): code shape, contracts, buildability. File `docs/tdd/new-scope/data-and-sync.md`, 230 lines, ASCII only, TDD 01 tags, no card text copied.

## What I checked
- Facts: I sampled 40 file:line cites against `develop` and the named PR heads. All 40 hold. Examples: `book_entries` has no client grant (`20261023060000_explicit_grants.sql:49-51, 99`; `grants.mjs:5-11`); `language` and `words_reviewed_at` are absent from the content tuple (`20261015030000:174-184`); an unknown group raises `22023` (`20261016000000:1031-1033`); `held_drafts` keeps words on a null push and refuses a change (`:722`, `:506-507`); a discard writes `purge_ledger` and a `discarded` marker (`:550-566`); `sync_push` never names `photo_path` (`:1091-1135`); BL-870 says "No migration here" (`docs/BACKLOG.md:3414`, line 5 of the row); #836 checks one letter and the outbox (`photos-device.test.ts:179-188` at `4596b3c1`); `pull_idle` is 8 ms (`sync_perf.test.mjs:33-40`); valibot `object` at `node_modules/valibot/dist/index.mjs:5655`.
- Card rows: every NS-36 P0 row (R1a to R12 less R9) is mapped to a design or test in 3.1. The P0 lists cited match `14-test-plan.md` section 7.
- Boundaries: no founder or counsel question is decided. S3, H1's size exception, F4 and every `approve-migration` are left to their owners. X2 is untouched: S1 keeps pictures off the server.
- Buildability, waves 1 and 2: section 3.6 lists ten PRs in merge order. Each has an owner, two lenses, a size and its dependencies. S1 has its tests and the two setup changes named.

## Findings (none blocks)
1. CR-67 contradictions. CR-67 wins until this file's next touch:
   - AX-6: CR-67 says L12 and L13 clear the book pull cursors. Section 1 and eval A s6.2 keep every upgrade byte-identical, and the L12 and L13 rows plan no repull.
   - AX-5: S3 waits for the founder's reading of the constitution and is not built before it. OQ-K2 names Karma as the owner.
   - D1: CR-67 puts `caps` and one sync contract in `packages/api` (imported by `lib/sync/types.ts`) before C3. C3 still edits both `FIELD_GROUPS` and the phone's `ALL_GROUPS`, and no C row carries `caps`.
   - D2: the old-build seal rule goes in the ADR 0028 amendment. PR 1 (BL-959) does not list it.
   - AX-9: F2 and F3 name `tmp`; CR-67 says one Caches folder per feature (expo-file-system 57 has no tmp).
2. C6 against CR-67 AX-4. C6 carries eval A R13's fix to the kill-switch header; CR-67 AX-4 says `kill-switches.ts:1-5` stands. Here the file is right on the fact. The header says each switch "only stops a server-dependent feature", but #798's `bookSearch` comment says "Phone only, no server part", and `photos` hides local surfaces. That is a must-fix on #856, not on this file.
3. Cross-design: C1 says "no narrowing on push" for `photo_path`. `11-foundations.md` section 6 R1d says "`sync` narrows `photo_path` to null in `packages/api`". One of the two must change. My lens agrees with this file: `EntryData` has no such key (`sync.ts:222-267`).
4. Cross-design: there are two tests for NS-36-R11. T1 here lives in `contract-drift.test.ts` (owner `sync`). `11-foundations.md` 36-4 adds `supabase/tests/entries_content_columns.test.mjs` (owner `data-architect`). One rule, one test: pick one before either PR opens.
5. Contract gap in PR 6 (S1): `SCPHO` must also join `SQLSTATE_RULES` in `packages/api/src/envelope.ts`, or `contract-drift.test.ts:93` fails CI. The PR's five files do not include it. The same applies to `SCSEL` with S4.
6. H1: the three hooks run inside definer functions. Name `security-architect` as a lens on H1a to H1c beside red-team (NSC-10).

## CI
All checks green at the head (required, database rules, tests and content rules, typecheck, Deno, B-8, compliance-fence, applied migrations unchanged). The head was older than 10 minutes when I finalised.

## Not verified
- `node scripts/agents/next-id.mjs` giving APPLY file 33 (not run).
- The GitHub Actions run ids in 0 items 7 and 8.
- That `now()` in `sync_pull` and in the view is one transaction time under PostgREST.

Reviewer: independent of the author (CR-44).
