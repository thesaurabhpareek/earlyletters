# BRIEF BL-976-WIRE: run the keep-safe preflight inside the TestFlight and production preflights (NS-08-R5)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U]. Card and `14-test-plan.md` line cites are at the locked pack `450bcb4a` (#846, unmerged: `git show origin/docs/prd-lock-v1-20nov:<path>`); develop still holds the older cards.

**Blocked until: nothing. This is code under `apps/mobile/scripts` and its test; no workflow edit, no secret, no spend. A founder decision that turns recording backup on is a separate PR that changes the same files (header of preflight-keepsafe.mjs lines 14-16).**

```
BRIEF BL-976-WIRE                                 Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10 (+ Pack 5 backup)   Build: 13   Wave: 1   (BL-976 follow-up; #875 merged)

1. GOAL: When `npm run preflight:testflight` or `preflight:production` runs, a store profile whose EXPO_PUBLIC_BACKUP is not written "off" produces a FAIL line with id
   `backup-off` and a non-zero exit, from the same function the standalone script uses.

2. CARD ROWS and TEST TITLES: NS-08-R5 (card 08; catalogue D line 100: `[NS-08-R5] backup off in store profiles (existing preflight check)`).
   Tests, in apps/mobile/test/preflight-keepsafe.test.ts (exists; add) and preflight-production.test.ts / a preflight-testflight case:
     [NS-08-R5] the testflight preflight fails when a store profile writes backup on
     [NS-08-R5] the production preflight reports backup-off for every store profile
   Red on develop 16e61549: both fail because `grep -n keepSafeChecks apps/mobile/scripts/preflight-testflight.mjs apps/mobile/scripts/preflight-production.mjs` has 0 hits [V];
   the function is only called by its own `main` (preflight-keepsafe.mjs:49-62).

3. FILES
   Touch: apps/mobile/scripts/preflight-testflight.mjs (import and fold results; the file already imports preflight-lib and store-flags at :29-31),
          apps/mobile/scripts/preflight-production.mjs (same, or keep its own `backup` id and add `backup-off` beside it), apps/mobile/scripts/preflight-keepsafe.mjs (export only if needed),
          apps/mobile/test/preflight-keepsafe.test.ts, docs/ops/PRODUCTION_VARIABLES.md (one line), docs/agents/checkins/ops-rd-h3-wire.md
   Never: eas.json (any value), workflows, backup code in lib/backup/**, packages/content.
   Shared file: preflight-production.mjs conflicts with main [V merge-tree]; BRIEF 830 now names it for per-hunk review; whichever lands second merges develop.

4. READING PACK: Pack 10 item 4; Pack 5 (keeping) BL-976 rows; preflight-keepsafe.mjs (all, ~70 lines); preflight-lib.mjs `createReport`; testflight.yml:104 (the only workflow that runs a preflight).

5. CODE ENTRY POINTS (verified at 16e61549)
   apps/mobile/scripts/preflight-keepsafe.mjs:33   `keepSafeChecks(eas)` one result per store profile, id `backup-off`
   apps/mobile/scripts/preflight-testflight.mjs:55 `const { results, pass, warn, fail, unverified, check } = createReport()`; :229-231 folds store-flag problems the same way (copy the pattern)
   apps/mobile/scripts/preflight-production.mjs:180 existing `backup` check ('EXPO_PUBLIC_BACKUP', id `backup`): decide one id, do not report twice
   scripts/release/store-flags.mjs `storeProfiles` (:41) and preflight-keepsafe `storeProfiles` are two copies of the same idea: unify on store-flags' (it resolves `extends`), say so in the PR

6. DATA AND SECURITY: none. Reads eas.json only; no build, no network, no secret (header). Boundary: backup off until the founder flips it (NS-08, seven conditions); a lost recording is
   never-list. Read: security-architect. Fail closed: unreadable eas.json = FAIL.

7. LIBRARIES: none.
8. BUDGETS: negligible (JSON read).

9. ACCEPTANCE: one `backup-off` line per store profile in both scripts; exit 1 on any; the standalone script still works. Done also means red on mutant: set `"EXPO_PUBLIC_BACKUP": "on"` in a
   fixture eas.json for `production` (the test must go red), and a second mutant that deletes the new call.

10. PR BREAKDOWN: PR 1 | ~90 lines, 4 files | base develop | flag-off proof: with eas.json as it is today both scripts print the same results as before plus `backup-off` PASS lines.

11. LENSES: A security-architect, B principal-architect (script duplication); mobile reads (apps/mobile/scripts and test).

12. ORDER: before BRIEF B13-CHECKS step (b). After nothing. Blocked by nothing.

13. DONE: [ ] focused tests; [ ] `npm test -w apps/mobile` baseline only; [ ] `cd apps/mobile && npx tsc --noEmit` 5 known errors; [ ] ASCII only; [ ] PR body per HARNESS-RUN; [ ] journal #22; [ ] check-in.

14. ONLY A PHONE CAN PROVE: nothing. EAS dashboard variables can still override (header lines 6-9: UNVERIFIED which of the two EAS sources wins); the founder checks the `production` environment on expo.dev.

15. STOP AND ASK: the two preflights disagree on which profiles are store profiles; a change to eas.json is needed; the perf profile (BRIEF BL-929-PERF) lands first and is a store profile.

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-976wire agent:ops -->`; branch chore/ops-bl-976-preflight-keepsafe-wiring; labels agent:ops, from:agent.
```
