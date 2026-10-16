# AL-10 Rollback rehearsals: staging stop, pack downloads switch, database restore, TestFlight expiry

> **Drill identities first.** Follow `README.md` "Drill identities". Nothing here touches staging while it holds the family's letters: part A runs on a scratch project, part C on two throwaway projects with fictional data only, part B changes one switch on the live pack host at a quiet hour, and part D expires only the R1 rehearsal build. Do the drill-phone check (rule 3) before parts B and D. No key, project URL, token, user id or address goes into evidence: write status codes, times and words on screen.

| | |
|---|---|
| Proves | The undo paths in `docs/release/AUTOMATION.md` section 2.10 that are marked "until rehearsed" work as written: a Pro project cannot be paused, so the staging stop is sign-ups off, sessions signed out and the alpha builds' named publishable key revoked; the `packDownloads` kill switch stops new pack downloads and its real delay replaces #162's "about 5 minutes"; `scripts/ops/restore-drill.ts` restores and verifies a copy (DATA-REQ-030, DATA-REQ-031); an expired TestFlight build stops new installs. RA-19-05. The fifth rehearsal, the kill path on R1, is AL-08 parts B and C (B2-14) |
| Builds | Part A and C: none (dashboard and the founder's computer). Part B: build 1 or build 2 on the SE 3. Part D: R1 on Phone B, after build 2 is in TestFlight |
| Plan | Not relevant to parts A and C. Part B: Free or Plus; nothing is kept. Part D: whatever Phone B held after AL-08 |
| Phones and accounts | Part B: Phone A (SE 3), a drill phone. Part D: Phone B, a drill phone with R1 installed. Part A test user: a `delivered+scratch-stop@resend.dev` address, never a person's |
| Time | A about 45 min; B about 40 min; C about 90 min, mostly waiting; D about 10 min [E] |
| When | A before Thu 22 Oct; B Fri 23 Oct; C by Wed 21 Oct; D Tue 27 or Wed 28 Oct (AUTOMATION 2.10) |
| Record in | one evidence file per part: `docs/qa/evidence/<YYYY-MM-DD>-rehearsal-<staging-stop, pack-switch, restore, testflight-expiry>.md`, rows AL-10.A1 and on |

## Part A: the staging stop, on a scratch project (B2-23)

Supabase cannot pause a paid project (AUTOMATION 2.10, [V35]), so the stop is three steps. Rehearse them on a scratch project in the staging organization, never on staging itself while the family uses it.

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-10.A1 | Create a scratch project (for example `scribe-scratch-stop`) in the staging organization, on the same plan. Apply nothing. Settings > API Keys: create a publishable key named `alpha-scratch`, a secret key, and deactivate the legacy keys. | Keys created; legacy keys off | yes or no |
| AL-10.A2 | From the founder's computer: `curl -s -o /dev/null -w '%{http_code}\n' "https://<scratch-ref>.supabase.co/auth/v1/settings" -H "apikey: <alpha-scratch key>"`. Keep the key in the shell only. | `200` | the status code |
| AL-10.A3 | Authentication: add one user with the test address and a long random password. Then turn off "Allow new users to sign up" and try a sign-up with a second test address (`curl -X POST .../auth/v1/signup` with the same `apikey` header and a JSON body with `email` and `password`). | Sign-up refused (a 4xx code); the existing user stays | the status code; seconds from the switch to the refusal |
| AL-10.A4 | Sign in the test user once with `curl` (`/auth/v1/token?grant_type=password`), keep the refresh token in the shell, then sign that user's sessions out in the dashboard (the user's row, sign-out action [U: its name]) and try the refresh token (`grant_type=refresh_token`). | The refresh is refused | the status code |
| AL-10.A5 | Revoke `alpha-scratch` (Settings > API Keys). Repeat AL-10.A2 every 10 s. | The gateway refuses the revoked key (`401` [U until now]): this is what every installed build would get | seconds until refused; the status code |
| AL-10.A6 | Create a new publishable key and repeat AL-10.A2 with it; create a new secret key and revoke the old one. | `200` with the new key: a new build would work again | yes or no |
| AL-10.A7 | Delete the scratch project the same day. Send S20 what happened in each step, to replace the [U] marks in AUTOMATION 2.10 (one writer). | Project gone | yes or no |

## Part B: the `packDownloads` switch on the live pack host (B2-24)

Needs #162 merged (pack publishing), the pack host live (founder steps F09, F13) and the signing keys on the founder's computer. A quiet hour: the switch reaches every installed app, the family's included; installed packs keep working, only new downloads wait.

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-10.B0 | The drill-phone check on Phone A. Open the app; Settings > Spoken language lists at least one language not installed (for example Portuguese). | Passes. If not, **stop** | pass or stop |
| AL-10.B1 | Founder's computer: set `"packDownloads": true` under `killSwitches` in `scripts/packs/remote-config.json`, then `release` and `upload` as `docs/ops/PACKS_HOSTING.md` says (#162, "Emergency brake"); commit the file and both `published.ts` files. Note the time the upload finished. | `npx tsx scripts/packs/publish.ts verify` all ok; `curl -sI https://packs.earlyletters.app/functions/v1/config/v1/remote-config` answers `200` with `cache-control: no-cache` | UTC time; verify verdict |
| AL-10.B2 | Phone A, app in the foreground: every minute, add the missing language (or tap Retry on its row). | Once the switch arrives no new download starts: the row shows the paused state (`language.row.<code>.status.waiting-downloads_paused`) and says so in words; English letters still get their words | **minutes from AL-10.B1 to the first refused start** (replaces "about 5 minutes"); the words on screen |
| AL-10.B3 | Set it back to `false`, `release`, `upload`, commit again. Keep trying on Phone A. | The download starts again | minutes until it starts |

## Part C: the database restore drill, on throwaway projects (B2-25)

`docs/ops/runbooks/restore-drill.md` part 1, with a throwaway source project playing production. Never staging while it holds letters, never production.

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-10.C1 | Create two throwaway projects in the staging organization: a source (`scribe-drill-source`) and a target (`scribe-drill-restore`). Apply every migration to the source in `supabase/APPLY.md` order. Put fictional data in it: a development build pointed at the source, a drill mailbox account, three typed letters "Asha restore drill 1" to "3". If that is not possible in time, run with the migrated, empty source and say so. | Source migrated; `select public.ops_schema_health();` all zeros | letter count on the source |
| AL-10.C2 | Restore the source's newest backup into the target (Database > Backups, restore to a new project if offered [U]), or else `pg_dump` the source and load it into the target with `psql`. Unschedule cron jobs on the target (runbook step 2). Note the restore point and the start time. | The target holds a copy | restore point; start time |
| AL-10.C3 | Run the drill: `node scripts/ops/restore-drill.ts --mode drill --project-ref <target> --prod-ref <source> --ticket DRILL-ALPHA --restore-point <ISO> --started-at <ISO> --replay --out ~/ops/drill-alpha.json`, with the target's URL and secret key in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` and the source's in `PROD_SUPABASE_URL` and `PROD_SERVICE_ROLE_KEY` (runbook step 3). | `PASS`, or a list of findings; the hash sample matches (3 of 3 with fictional letters) | verdict; RTO in minutes; hash sample counts (from the JSON record, counts only) |
| AL-10.C4 | Add the drill line to the runbook's drill log (S07's file: send it to S07), and delete both projects the same day. | Projects gone | yes or no |

## Part D: TestFlight expiry (B2-26)

This is AL-08.11 at the time AUTOMATION 2.10 sets: after build 2 is in TestFlight. Never expire build 1: it stays as the fallback.

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-10.D0 | The drill-phone check on Phone B, which has R1 installed. | Passes. If not, **stop** | pass or stop |
| AL-10.D1 | Founder, App Store Connect: TestFlight > R1 > Expire build (R1 went only to the "Founder" group). | R1 shows as expired; build 1 and build 2 are untouched | yes or no |
| AL-10.D2 | Phone B: open the installed R1. Then open TestFlight. | Record what happens: whether R1 still opens (TESTFLIGHT.md marks this unverified), and that TestFlight offers no install of R1 | what happened, in words |

## Pass rule

Each part passes when its rows show the expected result and its evidence file exists. A step that behaves differently from AUTOMATION 2.10 is not a fail of the build: it changes the undo plan (request to S20 for `docs/release/AUTOMATION.md`, to S07 for `PACKS_HOSTING.md` and the runbook) before the go/no-go.

## Stop rule

Part B: if a family member reports that a language will not download, set the switch back at once. Part C: if anything shows real family data in a throwaway project, delete it at once and tell the founder.
