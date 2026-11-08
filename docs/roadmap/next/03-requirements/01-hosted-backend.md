# Theme 1: The hosted backend my letters live on

Readiness: 25 of 28 (audit 8 Nov: 18). Author's re-score, `qa` to confirm. Remains: `security-architect` rules on the smoke-script sign-in method (R2, C8); the founder clicks F1, F2, F4 (C14); the tests in "Trace and tests" are named but not written.

| | |
|---|---|
| Working label | NX-01 (working id, see `_CONVENTIONS.md`; real ids from `next-id.mjs`, which printed BL-740 on 8 Nov 2026, assigned by product later) |
| Refines | F02-REQ-024 (R-17 gate), F16 (sync), F19 (config, kill switches), D-100, D-121 item 1, D-138 item 2 |
| Tag | EVIDENCE for the gap (`docs/release/BUILD12-GAP-MAP-2026-11-08.md` sections 0, 2, 5; `release:ready` S-50 to S-54 FAIL on 8 Nov). HYPOTHESIS for every number marked "proposed" |
| Size | M in agent PRs (gap map rank 3, 9, 10, 11, 17; feasibility R3, R4, R12). The feasibility file has no single row for this theme; the size is my sum of those ranks |
| Gate | Founder (project, plan, tag approvals, decision entry). Counsel only for the policy text that must be live before anyone outside the family signs in (theme 3). Apple: none at this step |
| Order | 1 of 12. Nothing else in this folder can be proven on a phone until it exists |

## What the parent will see and do

Nothing, on a good day. A parent signs in, speaks a letter, closes the app. Another day they pick up a new phone and the letters are there. The work in this theme is what makes that boring.

The founder's route is a public App Store release with build 12 on the production servers and no staging rehearsal (gap map section 0). That removes the usual rehearsal, so this theme puts one back in the cheapest form: a throwaway hosted project.

## The check

Working ids are labels only. "Old code" means the tree this branch holds (develop at `caba0215` plus docs), searched 8 Nov 2026.

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-01-R1 | EVIDENCE | Given a blank throwaway hosted project, When all migration files on develop apply in file order, Then 0 errors, and the grants test (`supabase/tests/grants.mjs`) passes against that hosted project. | No hosted project exists as far as the repo shows; `npm run test:db` (every file it runs, 38 `*.test.mjs` files today) runs only in embedded Postgres. | Gap map 1.5, 5 (RLS tests row) |
| NX-01-R2 | EVIDENCE | Given the same project with policy versions `terms` and `sensitive-data` not published, When a synthetic Asha account signs in, Then setup stops with the known refusal and a check script reports "policy versions missing". Given both published, the script signs in, creates 1 letter, syncs it, reads it back on a second client and deletes it, with 0 failed steps. Proposed number: the whole run under 60 seconds. Sign-in method: the script signs in through the Auth admin API with a test-only key held in the CI secret store (never in the app, EAS variables or the repo), for the Asha account only; it uses the real email path once, to prove the template renders. The method is named in `docs/ops/` and `security-architect` rules on it before merge (the SEC rules were not read for this clause). | No such script runs after deploy; `docs/ops/runbooks/staging-smoke.md` is staging only. | Gap map section 5 (setup traps); `docs/release/TESTFLIGHT.md` lines 74 to 82 |
| NX-01-R3 | EVIDENCE | Given legacy Supabase keys switched off on the throwaway project, When the script calls each folder under `supabase/functions` other than `_shared` (the script lists them; 8 today: analytics-forget, apple-token, config, content, escrow, invite-redeem, purge-worker, subscription-status), Then 8 of 8 answer their documented no-op call without a key error. A function with no safe no-op call gets one in the same PR, named in the PR body. | The functions read the legacy keys only (BL-594); no run with legacy keys off exists, and no function was found to expose a no-op health route by search (UNVERIFIED per handler). | Gap map 1.2, 2; #602 |
| NX-01-R4 | EVIDENCE | Given a production build profile, When `npm run preflight` runs with an `http` Supabase URL, a service-role key, or servers set to off while the recorded decision says on, Then it fails, 3 of 3 cases. | The production profile writes servers `off` today and `npm run preflight` has no check that compares the profile with a recorded decision or refuses an `http` URL. | Gap map 2 (server switch row); #633 |
| NX-01-R5 | EVIDENCE | Given a dump of the throwaway project, When it restores into a second throwaway project, Then every table row count for the Asha fixture matches (100%) and the restore finishes in 4 hours or less (the RTO in `06-nfr.md`, Server RPO and RTO row: RPO 24 h, RTO 4 h, PITR off at launch). The minutes taken are written in `docs/ops/runbooks/restore-drill.md`. If the founder turns on point-in-time recovery (F4), the `06-nfr.md` row changes to the new RPO in the same PR, marked Rev D-###. | Backup is written for staging only (`docs/ops/runbooks/staging-backup-free.md`); no restore has been run on a hosted project (DL-03 "not run"). | Gap map 1.6, 5 (backups row) |
| NX-01-R6 | HYPOTHESIS (not shown on a phone yet) | Given the signed `sync` switch set off in remote config, When a build that has sync refreshes config, Then it makes 0 sync uploads from 60 seconds after that refresh completes (proposed tolerance; the harness reads the outbox, not a log). | Switch exists in code; no device run proves it (gap map: NOT VERIFIED on a device). | Gap map section 5 (kill switch); `capabilities.ts` |
| NX-01-R7 | EVIDENCE | Given the F02-REQ-024 checklist, When it runs on the throwaway project, Then every item passes: the 6 code items (BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322, BL-349), migrations applied to the hosted project, F11-REQ-025 green, and `/terms` and `/privacy` live. The `/health-privacy` item in F02-REQ-024 is retired if BL-564 stands (the consent sheet links Terms and Privacy only, unless counsel answers Q32 the other way); product edits F02-REQ-024 in a separate PR marked Rev BL-564, counsel confirms no health page is owed. The evidence file is committed under `docs/qa/evidence/`. | Code merged 23 Oct; the checklist has never been run on a hosted project; `apps/web/src/app/(legal)` serves `privacy` and `terms` only, so the list's `/health-privacy` item cannot pass as written; the evidence folder holds 2 files, README and TEMPLATE. | `docs/release/1.0.0.md` lines 38 to 39; feasibility R1 |

## Edge cases

- The `main` branch was last merged from `develop` on 1 Nov; the `db-v` tag must sit on a commit that holds every migration. Check by listing files at the tag against develop (gap map section 2).
- A wrong consent pepper breaks invite codes: the smoke script (R2) also joins by code once.
- Email delivery limit of about 100 an hour: the smoke script must not use the real mail path more than twice per run.
- Three consent and audit migrations (#634, #636, #637) apply in the order #655 sets.

## Offline behaviour

Not a phone feature, but the rule it protects: a phone keeps every letter locally. If the server is down or paused, record, read and export keep working (F16, PRIV-R09). The kill-path check R6 must show this: switch off, then 1 letter recorded, saved, read, exported with 0 errors.

## What we never do

- Never put a service-role key, escrow key or consent pepper in the app, EAS variables or the repo (preflight already refuses a service-role key).
- Never edit an applied migration; fixes ship as new files.
- Never put a letter's words, a child's name or audio in a smoke script's logs. The smoke script uses the fictional family Asha only.
- Never apply a migration from a laptop; applying goes through the tagged CI flow and the `approve-migration` label.

## Copy needs (packages/content)

None for parents. One operator note in `docs/ops/` for the hosted smoke (not a content key).

## Analytics events (opt-in, content-free, names only)

None new. Analytics stay off in every build profile for the 1.0 line (D-124). Server health is read from Supabase logs and the smoke script, not from the app. Existing names used if later switched on: `sync_failed`, `error_shown`.

## Device rows

- Existing: S1-27 (account screen), DL-03 (restore, not run), B2-11 (kill harness 500 of 500, belongs to the freeze commit).
- New row needed: "kill switch off, then record, keep, read, export" on an iPhone SE 3.

## Dependencies

#602 (read by the founder), #655 and #634, #636, #637 (consent and audit chain), #656 (per-project migrations record), #633 (https only), #622 (dump workflow). Founder steps in gap map section 4D ranks 19, 20, 34.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Record in `docs/DECISIONS.md` that build 12 reverses D-121 item 1 (servers on in `production`) and accepts no staging pass | Yes, and add the one throwaway rehearsal (R1 to R7) before the first `db-v` tag. It costs about a day and removes the largest risk (gap map section 6 question 1) |
| Supabase plan for production | Pro with point-in-time recovery from the day a friend signs in. The monthly cost is UNVERIFIED here; read Supabase's pricing page first |
| Update channel before the store freeze (feasibility AD-3) | Server-driven content only for now; decide the disabled `expo-updates` option with `security-architect` before any build that goes to review. Whether Expo update signing meets SEC-R10 is NOT VERIFIED |
| Who may sign in to build 12 | Family only (internal TestFlight) until counsel answers Q44 and the 0.9.0 policy is live (theme 3) |

## Engineering block (cross-cutting, added 8 Nov 2026 after the readiness audit, G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | No new type. Each function keeps its type in `packages/api/src/server/`; any no-op route added for R3 gets its type and a case in `packages/api/test/server-contracts.test.ts` (exists). Version: additive. |
| Budget (`06-nfr.md`) | Edge Function light: p95 600 ms, p99 1.5 s with cold start. Sync pull: 300 ms a page p95. Restore: RTO 4 h. Smoke run: under 60 s (proposed, this file). |
| Accessibility | None: no screen. |
| Switch, off behaviour, noticed by | Switch: the signed remote-config kill switches in `packages/api/src/kill-switches.ts` (`KILL_SWITCH_KEYS`; sync is the one R6 tests). Off: the phone keeps record, read, export. Noticed by: the smoke script's exit code in CI, and the `ops-health` views in `06-nfr.md` (purge backlog, stuck deletions, oldest transaction). Rollback of a bad migration is a new forward migration; a bad function is redeployed from the previous tag. |
| Data class and retention | The smoke script touches only the fictional Asha family: no real L4. The test-only auth key is L3 secret material: CI secret store only, rotated when a person leaves, never in logs. |
| Schema and grants | No new table or function in this theme. It applies the existing migrations in file order and runs `supabase/tests/grants.mjs` against the hosted project. The consent and audit chain (#634, #636, #637) lands in the order #655 sets. |
| Analytics events | None. In 1.0 analytics are off (D-124). Server health comes from Supabase logs and the script. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-01-R1 | F02-REQ-024; D-100 | ops script (proposed `scripts/ops/hosted-check.mjs`) plus `supabase/tests/grants.mjs` against the hosted URL; `[NX-01-R1] every migration applies to a blank hosted project` | setup S-51 (founder creates the project) |
| NX-01-R2 | F02-REQ-024; F16 | ops script, same file; `[NX-01-R2] policy-missing refusal, then sign in, keep, pull, delete in under 60 s` | setup S-52 (auth settings) |
| NX-01-R3 | BL-594 | script lists `supabase/functions/*` and calls each; `[NX-01-R3] 8 of 8 functions answer with legacy keys off` | none (script) |
| NX-01-R4 | BL-600; F19 | unit test beside `scripts/` preflight (proposed `scripts/release/preflight.test.mjs`); `[NX-01-R4] preflight fails on http, service key, servers off against the decision` | none |
| NX-01-R5 | DATA-REQ-030, -031 | runbook drill, minutes in `docs/ops/runbooks/restore-drill.md`; `[NX-01-R5] restore matches row counts in 4 hours or less` | DL-03 |
| NX-01-R6 | F19 kill switches | device harness on an iPhone SE 3; `[NX-01-R6] sync off means 0 uploads and record, keep, read, export still work` | new: kill switch off then record, keep, read, export |
| NX-01-R7 | F02-REQ-024 | checklist run, evidence in `docs/qa/evidence/`; `[NX-01-R7] outside sign-in checklist passes` | setup S-54 (purge worker secrets) |

Trace: NX-01-R1..R7 -> F02-REQ-024, F16, F19, D-100, D-121 item 1, D-138 item 2.

## Not verified

Whether the founder has already created any hosted project since 1 Nov (the setup record learns from a tick). Real download size. Supabase plan cost. Whether #602 has been read by the founder.
