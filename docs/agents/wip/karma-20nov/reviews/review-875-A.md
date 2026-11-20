## Review A at c65822f0f1d948dec26441ef95ff79d269aa7113: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. Two new files: `apps/mobile/scripts/preflight-keepsafe.mjs` (67 lines) and `apps/mobile/test/preflight-keepsafe.test.ts` (88 lines). Within CODE-R02 (155 lines, 2 files).

Must fix: none.

### What I checked
- Head c65822f0, committed 11:11 UTC on 20 Nov, more than 10 minutes old at review. Merge base with develop is ea31f09d. `eas.json`, `preflight-testflight.mjs` and `preflight-production.mjs` are unchanged between that base and develop now.
- CI at the head: `required`, `tests and content rules`, `typecheck`, `database rules` and the Deno job all passed. `store-profile Release launch` was still running when I wrote this, and the iOS simulator build was skipped (no native change). One `compliance-fence` run was cancelled; its sibling run succeeded.
- I ran it in a worktree of the head with the repo's own packages:
  - `npx vitest run test/preflight-keepsafe.test.ts`: 11 passed.
  - `node scripts/preflight-keepsafe.mjs`: 3 PASS, exit 0.
  - `preflight-production.test.ts` "the real repository" fails in this sandbox because `expo config` cannot evaluate here. It fails the same way on the develop base, so it is not caused by this PR.
- Old code: the test imports a module that does not exist on develop, so it is red there. The point that matters is that it is stricter than develop. Develop's `test/backup-gate.test.ts:56` reads an unwritten value as `off`. Here the `production` and `testflight` "not written" fixtures FAIL.
- Mutations I ran on the script:
  - Only an explicit `distribution: "store"` counts as a store profile: 3 tests fail, because `production` drops out.
  - Anything but `on` passes: 4 tests fail.
- Facts in the body. All hold:
  - `preflight-production.mjs:178-188`: the build-flag check for the production profile.
  - `preflight-testflight.mjs:172-179`: WARN on `on`, FAIL on anything else that is not `off`.
  - `backup-gate.test.ts:56`.
  - `eas.json` today: `preview` and `testflight` are `distribution: "store"`; `production` names none; `development` and `e2e` are internal. Every profile writes `off`, and none uses `extends`.
- Card: NS-08-R5 (card 08 at `450bcb4a`, line 118). The describe title is the card's test title, `[NS-08-R5] backup off in store profiles`.
- Shape: it reuses `createReport` from `scripts/preflight-lib.mjs`, matches the other preflight scripts, has no network and no secrets, and its output names only the profile and the flag value.

### Findings (notes, most serious first)
1. Nothing runs the script yet except this test. That is enough for now: `npm test` runs the test on the real `eas.json` in CI, so a store profile that turns backup on or stops writing it fails `tests and content rules` today. The `preflight-testflight.mjs` wiring is `ops`' file (#855). Open it as a `handoff` to `ops`, not just a line in the PR body, so it is tracked. When it lands, the WARN at `:178` and the new FAIL disagree about `on`, as the body says. Ops should drop the WARN for `EXPO_PUBLIC_BACKUP` in the same PR, so the report does not say both.
2. `extends` is not resolved. A profile's `env` and `distribution` are read only from the profile itself. Today no profile uses `extends`, so this is correct. Every gap I could build errs towards FAIL, never a false PASS: an inherited `off` reads as "not written", and an internal base with no own distribution reads as store. Add one line to the header comment saying so, or resolve `extends` before the check, so the first profile that uses it is not met by a puzzling FAIL.
3. The header says a profile with no distribution "EAS builds for the store". The repo already treats `production` that way, but I could not reach the Expo docs from this session to confirm the default. The PR's own UNVERIFIED (which value wins when `eas.json` and expo.dev both name the variable) also stands. Both belong on the release device sheet, not here.
4. Backup is now checked in four places: this script, the production preflight's `backup` id, the TestFlight loop, and `backup-gate.test.ts:56`, which is looser. Once ops wires this in, retire or tighten the `backup-gate` assertion, so a reader does not take the looser rule for the real one.
5. The production-preflight case builds its input with `as never`. If `productionChecks` gains a required field, this case can stop testing `backup` without failing. It finds the result by id and asserts PASS, so a missing result shows as `undefined`, not PASS. Acceptable, but it could assert `.toBeDefined()` first.

### Not verified
- The EAS default distribution, and EAS precedence between `eas.json` `env` and the expo.dev environment (docs.expo.dev was not reachable from this session).
- `store-profile Release launch` had not finished at the time of writing.

Reviewer: independent of the author (CR-44).
