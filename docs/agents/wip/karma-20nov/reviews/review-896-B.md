## Review B at a5280d118a3dcabed2d6719273192058cb9c8a36: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B: security, privacy and release safety (SEC chapter; release path).

Must fix: none.

## What I checked

- The diff at the head (4 files, +162): `scripts/release/store-flags.mjs`, `apps/mobile/test/store-flags.test.ts`, the +10 block in `apps/mobile/scripts/preflight-testflight.mjs`, the check-in file.
- Cites in the PR body against develop (now `2f2beb77`; the body read `20553b18`). 11 of 11 hold: `eas.json` profiles at :8, :22, :40, :55, :70 with the line ranges given; neither flag is written in any profile; `preflight-production.mjs:178-189` and `preflight-testflight.mjs:172-180` name BACKUP and STATUS_REPORT only; `preflight-testflight.mjs:217-218` is the B-9 store-profile reading the new module copies; `release-ios.yml:103` runs `npm test`, `:136` makes `build` need `checks`, `:163` builds `--profile production` on EAS; `testflight.yml:104` runs the TestFlight preflight; handoff #900 to mobile for NS-01-R45 exists and is open.
- `apps/mobile/vitest.config.ts` includes `test/**/*.test.ts`, so the new test runs in `npm test`, which the release-ios `checks` job runs on the tag commit before the production build.
- Paths a flag could take into a store build, one by one:
  - A different profile name: covered. `storeProfiles` reads every profile in `build`, and the first test pins the set to exactly `preview`, `production`, `testflight`, so a new store profile fails `npm test` until someone looks.
  - `extends`: covered, and safe either way. `resolveProfile` merges `env` key by key. If EAS replaces `env` instead (the comment says this reading is unverified), the check over-reports, it never under-reports. Cycles return a value, not a hang.
  - Values: anything but unset or `off` fails, including `ON`, `1` and booleans. Good.
  - EAS environment on expo.dev: not readable; see note 1.
  - Committed `.env*` files: see note 2.
  - Local shell on a `--local` build: see note 3.
- Privacy: the module and the preflight block print profile names, variable names and the written value of two build flags. No user data, no secret. Nothing here is a log of a person.
- ASCII only in all four files.

## Findings (notes, most serious first)

1. The release path never prints the expo.dev caveat for production. The UNVERIFIED line names `prof?.environment ?? PROFILE`, which is the profile `testflight.yml` is building (preview). `release-ios.yml` runs neither preflight, so a value set in the EAS "production" environment reaches an RC with nothing on screen. The UNVERIFIED line is honest for the alpha build it runs in. The PR body's "no store profile ships either flag on" is wider than the check, which reads `eas.json` only. Suggest: a step in the release-ios `checks` job that writes the same caveat to the step summary (the `EXPO_PUBLIC_DOCS_BASE_URL` step at release-ios.yml:121-133 is the pattern), or the `preflight-production.mjs` follow-up the body names. Reword the claim to "no store profile in eas.json".
2. `.env*` files on the release path. Expo bakes `EXPO_PUBLIC_*` from `.env`, `.env.local` and `.env.production` into a release bundle. They are gitignored, but `git add -f` gets one in, and only `env-file-guard.mjs` inside the TestFlight preflight looks for it. release-ios runs neither. Cheap close: the store-flags test also reads `git ls-files apps/mobile/.env*` and fails if either name appears.
3. Local builds read the shell. The B-9 block checks `process.env.EXPO_PUBLIC_E2E` for that reason (`preflight-testflight.mjs:223` at the head, :222 on develop). The flag block does not check the shell for the two flags. Low risk while every store build runs on EAS servers.
4. The PASS line reads "off in every store profile". Say "in eas.json" so it does not read as covering expo.dev.
5. Out of this PR's scope, for the record: the flag modules themselves (`lib/photos/flag.ts` in #837, `lib/find/flag.ts` in #798) decide the default. A change there turns a feature on with `eas.json` untouched. Their own tests own that.

## Not verified

- I did not run the test or the preflight; I read CI instead.
- EAS `extends` merge semantics (the PR also marks this unverified; the reading is conservative).
- CI at the head (read 12:37 UTC, head 40 minutes old): every Linux check green, `required` green (tests and content rules, typecheck, database rules, Deno, B-8 seam, migration guard, compliance-fence; the cancelled compliance-fence run is a superseded duplicate). The macOS "store-profile Release launch" job is still queued or running; I did not wait for it, and it does not exercise this change.

Reviewer: independent of the author (CR-44).
