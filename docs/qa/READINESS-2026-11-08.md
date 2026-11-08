# Readiness for TestFlight build 9, 8 Nov 2026

Status: **At risk.** Everything that runs on a Linux box is green on `origin/develop` (29dcd7d). Nothing that needs a phone, Maestro, a browser or a sandbox account has run. None of the 13 candidate fixes is on `develop` yet (all open), so these results describe `develop` without them. Re-run the table's first rows on the build 9 commit once the fixes merge.
Ask for the founder: run `docs/qa/TESTFLIGHT-BUILD-9-DEVICE-CHECK.md` on the phone after the build installs, and tell qa which pull requests the build contains.

Run on 8 Nov 2026 at about 08:30 to 10:00 UTC, Linux, 2 cores, Node 22.23.4, one `npm ci`. The only changes versus `develop` are docs, the catalog rows and the board claim.

| Check | Command | Result |
|---|---|---|
| Typecheck, every workspace | `npm run typecheck` | PASS (exit 0, 3 min) |
| Mobile unit tests | `npm test -w @scribe/mobile` | PASS, 193 files, 3716 tests (includes the release catalog test with the 13 new rows) |
| Core | `npm test -w @scribe/core` | PASS, 34 files, 1231 tests |
| Content | `npm test -w @scribe/content` | PASS, 12 files, 280 tests |
| api, analytics, brand, emails, design-tokens, experiments | `npm test` in each | PASS (api 287 and 185 from its two runs, analytics 129, brand 50, emails 60, design-tokens 92, experiments 78) |
| Root node tests and trace | `node --test scripts/trace.test.mjs ... "compliance/**/*.test.mjs"`, `node scripts/trace.mjs --no-write` | PASS, 69 of 69; trace exit 0 in report mode, which still lists undefined ids such as F16-REQ-029b and F16-REQ-029c (not failing) |
| Known failures `prompts.preBirth` (4) | `npm test -w @scribe/core` on clean develop | DID NOT REPRODUCE. Verified: core ran 1231 of 1231 green on a tree that differs from `develop` only in docs and catalog rows. They are not recorded as known failures |
| Preflight for build 1 | `cd apps/mobile && node scripts/preflight-testflight.mjs` | PASS: 0 fail, 2 warn, 3 unverified, 58 pass. Unverified: EAS "preview" env contents, the published pack manifest. Warn: ITMS-91053 email after upload, ExpoFileSystem framework manifest |
| Seam guard, unit | `node --test .github/scripts/seam-guard.test.mjs` | PASS, 21 of 21 |
| Seam guard, store bundles | `node .github/scripts/seam-guard.mjs --store-profiles --e2e-control` | PASS: testflight, preview and production bundles hold none of the 10 seam identifiers; the e2e control bundle does carry the seam, so the search can see it |
| Database access rules | `npm run test:db` | PASS, 38 files |
| Web journeys | `npm run e2e:web -w @scribe/mobile` | NOT RUN: no Playwright browser is installed on this box, and a full run took 16 minutes on 2 cores in #532, with load-dependent flakes (#533) |
| Edge Function tests | `npm run test:functions` | NOT RUN: needs Deno through npx; not attempted in this window |
| Maestro flows (E2E-01 to E2E-16) | `apps/mobile/e2e` | NOT RUN: needs a Mac and a simulator. Maestro cannot drive a physical iPhone |
| Kill harness (DL-01, DL-02) | `.github/workflows/kill-harness.yml` | NOT RUN: needs a macOS simulator |
| Build 9 device rows 1 to 38 | `docs/qa/TESTFLIGHT-BUILD-9-DEVICE-CHECK.md` | NOT RUN: need the founder's iPhone |
| Sandbox rows (Plus, offline grace, RT-B9-12) | `docs/qa/run-sheets/AL-09-storekit-sandbox.md` | NOT RUN: need a sandbox tester and Xcode Transaction Manager; also the `.preview` app cannot load Plus (preflight note) |
| Server-on rows (consent sheet, RT-B9-03) | server-on build against staging | NOT RUN: build 1 has servers off; the consent sheet is not reachable |
| Unit proof of the 13 fixes | each PR's own test files | NOT RUN here: the PRs are open and not on `develop`. Their authors report passing runs in the PR bodies; qa did not reproduce them |

## Per-fix coverage (PR, catalog row, unit proof, device proof)

| PR | Row | Unit proof (in the PR) | Device proof |
|---|---|---|---|
| #540 DOB picker | RT-B9-01 | `apps/mobile/test/date-field.test.ts` | check 2 to 6, NOT RUN |
| #595 Listen finishing (BL-563) | RT-B9-02 | `[BL-563]` in `listen.test.ts` | check 7 and 8, NOT RUN |
| #589 Consent links (BL-564) | RT-B9-03 | `[BL-564]` in `privacy-documents.test.ts` | check 37, NOT RUN, server-on only |
| #544 Book month type | RT-B9-04 | `text-trim.test.ts` | check 27 and 28 (S1-38), NOT RUN |
| #532 Listen reads child once (#480) | RT-B9-05 | `listen.test.ts` | check 9, NOT RUN |
| #519 Help rows fallback | RT-B9-06 | `settings-help.test.ts` | check 23 to 26, NOT RUN |
| #508 Tonight Plus line | RT-B9-07 | `tonight-plus.test.ts` | check 16 to 18, NOT RUN |
| #523 VoiceOver and primer | RT-B9-08 | `listen-voiceover.test.ts` | check 10 to 12, NOT RUN |
| #522 Review survives a kill | RT-B9-09 | `review-persist.*.test.ts`, `migrations.v9.test.ts` | check 20 to 22, NOT RUN |
| #521 Age gate confirm | RT-B9-10 | `age-gate-screen.test.ts` | check 13 to 15, NOT RUN |
| #520 Delete book, Erase everything | RT-B9-11 | per PR body | check 29 to 32, NOT RUN |
| #517 Plus offline, grace | RT-B9-12 | `billing-keep-gate-*.test.ts` | check 33 to 36, NOT RUN |
| #510 Notes count | RT-B9-13 | `[D-133]` in `billing-ledger.test.ts` | check 19, NOT RUN |

## Risks to read before the build

- **Local database v9 (#522).** It is a migration on an install over build 8; check 1 and check 21 cover it. PR #522 says to renumber if another lane lands a v9 first.
- **Overlap in `listen.tsx`.** #595, #523 and #532 all edit it; the later two to merge rebase. Re-run the Listen unit tests on the merged head.
- **Shared catalog and plan files.** #517 and #540 and #544 also edit `release-test-catalog.csv` or `DEVICE_TEST_PLAN.md`. This PR only appends rows and one new Part 4, so the CSV needs `node scripts/qa/release-catalog.mjs` after each merge (the catalog test fails if it is stale).
- **Freeze (D-130).** #508, #517, #520, #544 say they merge after the 9 Nov go/no-go unless Karma takes them as S1. Whether they are in build 9 is the coordinator's call.
- **#520 is T2** (deletes data): two reviews and the Chief Privacy Officer before merge.
- **Box limits.** This machine is shared and 2-core; a first full `npm test` was killed (SIGTERM) by another process and its log was overwritten in the shared scratchpad. The results above are from a re-run per workspace with private logs.
