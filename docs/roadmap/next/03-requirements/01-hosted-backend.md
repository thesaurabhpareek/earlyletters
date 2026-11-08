# Theme 1: The hosted backend my letters live on

| | |
|---|---|
| Working label | NX-01 (id: to be assigned; backlog ids from BL-740 per `next-id.mjs` on 8 Nov 2026) |
| Refines | F02-REQ-024 (R-17 gate), F16 (sync), F19 (config, kill switches), D-100, D-121 item 1, D-138 item 2 |
| Tag | EVIDENCE for the gap (`docs/release/BUILD12-GAP-MAP-2026-11-08.md` sections 0, 2, 5; `release:ready` S-50 to S-54 FAIL on 8 Nov). HYPOTHESIS for every number marked "proposed" |
| Size | M in agent PRs (gap map rank 3, 9, 10, 11, 17; feasibility R3, R4, R12). The feasibility file has no single row for this theme; the size is my sum of those ranks |
| Gate | Founder (project, plan, tag approvals, decision entry). Counsel only for the policy text that must be live before anyone outside the family signs in (theme 3). Apple: none at this step |
| Order | 1 of 12. Nothing else in this folder can be proven on a phone until it exists |

## What the parent will see and do

Nothing, on a good day. A parent signs in, speaks a letter, closes the app. Another day they pick up a new phone and the letters are there. The work in this theme is what makes that boring.

The founder's route is a public App Store release with build 12 on the production servers and no staging rehearsal (gap map section 0). That removes the usual rehearsal, so this theme puts one back in the cheapest form: a throwaway hosted project.

## The check

Working ids are labels only. "Old code" means develop at `cda0ba83`.

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-01-R1 | EVIDENCE | Given a blank throwaway hosted project, When all migration files on develop apply in file order, Then 0 errors, and the grants test (`supabase/tests/grants.mjs`) passes against that hosted project. | No hosted project exists; the 32 access-test files run only in embedded Postgres. | Gap map 1.5, 5 (RLS tests row) |
| NX-01-R2 | EVIDENCE | Given the same project with policy versions `terms` and `sensitive-data` not published, When a synthetic Asha account signs in, Then setup stops with the known refusal and a check script reports "policy versions missing". Given both published, the script signs in, creates 1 letter, syncs it, reads it back on a second client and deletes it, with 0 failed steps. Proposed number: the whole run under 60 seconds. | No such script runs after deploy; `docs/ops/runbooks/staging-smoke.md` is staging only. | Gap map section 5 (setup traps); `docs/release/TESTFLIGHT.md` lines 74 to 82 |
| NX-01-R3 | EVIDENCE | Given legacy Supabase keys switched off on the throwaway project, When each of the 10 Edge Function folders (except `_shared`) gets its health call, Then 9 of 9 answer without a key error. | #602 (BL-594) is open; functions read the old keys only. | Gap map 1.2, 2; #602 |
| NX-01-R4 | EVIDENCE | Given a production build profile, When `npm run preflight` runs with an `http` Supabase URL, a service-role key, or servers set to off while the recorded decision says on, Then it fails, 3 of 3 cases. | Production profile writes servers `off`; no equality check with a decision; #633 is a draft. | Gap map 2 (server switch row); #633 |
| NX-01-R5 | EVIDENCE | Given a nightly dump of the throwaway project, When it restores into a second throwaway project, Then every table row count for the Asha fixture matches (100%) and the minutes taken are written in the runbook. | Backup drafted for staging only (#622); no restore ever run (DL-03 "not run"). | Gap map 1.6, 5 (backups row) |
| NX-01-R6 | HYPOTHESIS (not shown on a phone yet) | Given the signed `sync` switch set off in remote config, When a build that has sync refreshes config, Then it makes 0 sync uploads from that moment. | Switch exists in code; no device run proves it (gap map: NOT VERIFIED on a device). | Gap map section 5 (kill switch); `capabilities.ts` |
| NX-01-R7 | EVIDENCE | Given the R-17 checklist (BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322, BL-349), When it runs on the throwaway project, Then 6 of 6 items pass and the evidence file is committed under `docs/qa/evidence/`. | Code merged 23 Oct; checklist never run; evidence folder holds 2 files, README and TEMPLATE. | `docs/release/1.0.0.md` lines 38 to 39; feasibility R1 |

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

## Not verified

Whether the founder has already created any hosted project since 1 Nov (the setup record learns from a tick). Real download size. Supabase plan cost. Whether #602 has been read by the founder.
