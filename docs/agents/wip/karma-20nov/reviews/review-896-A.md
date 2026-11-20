## Review A at a5280d118a3dcabed2d6719273192058cb9c8a36: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. 4 files, +162 -0 (under CODE-R02).

Must fix: none.

### What I checked
- Diff `origin/develop...a5280d11`: `scripts/release/store-flags.mjs` (new, 73 lines), `apps/mobile/test/store-flags.test.ts` (new, 77), `apps/mobile/scripts/preflight-testflight.mjs` (+10 at :226-234), check-in file.
- Body facts at develop `20553b18`, 9 of 9 held: `eas.json` profiles (development internal; e2e internal plus simulator; preview store; production no `distribution`; testflight store); neither flag is written anywhere on develop (git grep); `preflight-testflight.mjs:172-180` loops BACKUP and STATUS_REPORT only; `preflight-production.mjs:177-189` the same pair; the B-9 store reading at `preflight-testflight.mjs:218`; `testflight.yml:104` runs the preflight; `release-ios.yml:103` runs `npm test` and `:136` has `build` need `checks`; `lib/photos/flag.ts` at #837 head `7ace6aea` and `lib/find/flag.ts` at #798 head `7f36031a` are on only for trimmed lower-case `on`.
- Ran `npx vitest run test/store-flags.test.ts` in a worktree of the head: 8 pass. The module and test are new, so the old code fails by absence.
- Turned a flag on in the real `eas.json` and reran the test (then restored it):
  - production PHOTOS `on`, preview BOOK_SEARCH `1`, testflight PHOTOS ` ON `, testflight BOOK_SEARCH empty string, PHOTOS `null`: each fails test 1.
  - A new profile `beta` with no `distribution` key and PHOTOS on: `storeProfiles` lists it and `storeFlagProblems` returns `beta` (no distribution is store, as EAS defaults). Test 1 also fails on the pinned profile list, so a new store profile needs a look.
  - A base profile with `distribution: internal` and PHOTOS on, extended by production: production fails (the merge is read through `extends`).
  - Both flags `on` in `development`, and both in `e2e`: 8 pass. No false positive on internal or simulator profiles.
  - `off` and `OFF` in store profiles: 8 pass.
- Ran `node scripts/preflight-testflight.mjs --skip-prebuild` with production PHOTOS on: it prints `FAIL eas.json store profile "production" sets EXPO_PUBLIC_PHOTOS="on"...` and one UNVERIFIED line for the EAS environment. Clean: `PASS EXPO_PUBLIC_PHOTOS, EXPO_PUBLIC_BOOK_SEARCH off in every store profile (preview, production, testflight; BL-958)`. Both runs also FAIL on `expo config --type public`, which fails the same way on a develop tree in this sandbox (baseline, not this PR).
- Mutants on `store-flags.mjs`: missing distribution read as internal (3 tests fail), off read as unset only (2 fail), `extends` ignored (1 fails), `allowedOn` ignored (1 fails). One survives, see finding 1.
- Affected suites (every test that reads the preflight or `scripts/release`): the same 5 files fail at this head and on a develop tree in my sandbox setup (a symlinked node_modules); `account-deletion-switch.test.ts`, which spawns the preflight, passes.

### Findings, most serious first
1. Low, test gap. The simulator exclusion in `isStoreProfile` (`store-flags.mjs:38`, `p?.ios?.simulator !== true`) is never exercised: deleting it leaves all 8 tests green. The fixture's `e2e` profile is `distribution: internal`, so test 5's title "ignores the internal and simulator profiles" only proves the internal half. Add a profile `{ distribution: 'store', ios: { simulator: true }, env: { EXPO_PUBLIC_PHOTOS: 'on' } }` to that test.
2. Low. An empty string (`EXPO_PUBLIC_PHOTOS: ""`) fails the check, while both flag readers treat it as off. That is the safe direction and matches "a store profile should say plainly what it ships" (`store-flags.mjs:50-51`); say it in the doc comment so nobody "fixes" it.
3. Info. A profile value that is not an object (for example `null`) counts as a store profile with no env, so it passes silently (`resolveProfile` returns null and `isStoreProfile(null)` is true). EAS would reject such a file, so this is harmless.
4. Info. Test 8 checks the preflight by regex over its source, not by running it. The runtime path is covered by my manual run above and by `account-deletion-switch.test.ts` spawning the script.
5. Info. The `extends` merge (child keys win, `env` and `ios` merged) is the author's reading of EAS, marked unverified in the code (`store-flags.mjs:26-27`). No profile extends another today.

### Not verified
- EAS `extends` semantics against the EAS docs or eas-cli source.
- A real EAS build. The EAS environment on expo.dev can still set either flag; the preflight says so as UNVERIFIED.
- Full apps/mobile suite: my full run under load average 54 hit 62 files failing from timeouts and the shared node_modules, so I used CI and the affected-file comparison instead.

CI at this head (12:10 UTC): `required`, `tests and content rules`, `typecheck`, `database rules`, Deno, B-8 all success; `store-profile Release launch` queued. The head was more than 10 minutes old when I finished.

Reviewer: independent of the author (CR-44).
