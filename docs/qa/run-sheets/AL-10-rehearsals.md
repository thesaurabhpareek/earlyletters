# AL-10 Rollback rehearsals: staging stop, pack downloads switch, database restore, TestFlight expiry, function redeploy, mistaken promotion

> **Founder only for parts A, C and E.** Their steps use the Supabase dashboard of the staging organization, a project's secret or service-role key, or the founder's Supabase access token (to deploy). Agents never hold those keys or tokens, never run these parts, and never use the Supabase connector for them (`docs/release/AUTOMATION.md` 0.1 item 8 and 2.11). Part A also spends Pro compute on a scratch project for a few hours: that is a spending decision, so the founder approves it first (COORDINATION section 1).
>
> **Drill identities first.** Follow `README.md` "Drill identities". Nothing here touches staging's data while it holds the family's letters: part A runs on a scratch project, part C on two throwaway projects with fictional data only, part B changes one switch on the live pack host at a quiet hour, part D expires only the R1 rehearsal build, part E redeploys one function at a quiet hour with no data change, and part F uses a throwaway build. Do the drill-phone check (rule 3) before parts B, D and F. No key, project URL, token, user id or address goes into evidence: write status codes, times and words on screen.
>
> **Keys never reach shell history.** Read each key or password into a variable with `read -rs NAME` (it is not echoed or saved), pass it as `"$NAME"`, send JSON bodies on stdin (`--data @-`), and `unset` every variable at the end of the part. Run part C in a fresh terminal window and close it afterwards.

| | |
|---|---|
| Proves | The undo paths in `docs/release/AUTOMATION.md` section 2.10 that are marked "until rehearsed" work as written: a Pro project cannot be paused, so the staging stop is sign-ups off, sessions signed out and the alpha builds' named publishable key revoked; the `packDownloads` kill switch stops new pack downloads and its real delay replaces #162's "about 5 minutes"; `scripts/ops/restore-drill.ts` restores and verifies a copy (DATA-REQ-030, DATA-REQ-031); an expired TestFlight build stops new installs; an Edge Function goes back to the previous commit's code; a build promoted by mistake leaves a group. RA-19-05 assigns parts A to D and the kill path on R1 (AL-08 parts B and C, B2-14); parts E and F are the two other rehearsals 2.10 dates |
| Builds | Parts A, C and E: none (dashboard and the founder's computer). Part B: build 1 or build 2 on the SE 3. Part D: R1 on Phone B, after build 2 is in TestFlight. Part F: a throwaway build already in App Store Connect |
| Plan | Not relevant to parts A, C, E and F. Part B: Free or Plus; nothing is kept. Part D: whatever Phone B held after AL-08 |
| Phones and accounts | Part B: Phone A (SE 3), a drill phone. Parts D and F: Phone B, a drill phone. Part A test users: `delivered+scratch-stop@resend.dev` and `delivered+scratch-stop2@resend.dev`, never a person's |
| Founder time | A about 45 min, B about 40 min, C about 90 min (mostly waiting), D about 10 min (parts A to D about 3 h), E about 20 min, F about 15 min: **about 3 h 40 min** [E], on top of the alpha plan's hours (#152) and AUTOMATION's. Part C falls on or before Wed 21, already a 3.25 h founder day |
| When | C by Wed 21 Oct; F Wed 21 Oct; A and E before Thu 22 Oct; B Fri 23 Oct; D Tue 27 or Wed 28 Oct (AUTOMATION 2.10; 0.2 item 15 gives the staging stop the same date, before Thu 22) |
| Record in | one evidence file per part: `docs/qa/evidence/<YYYY-MM-DD>-rehearsal-<staging-stop, pack-switch, restore, testflight-expiry, function-redeploy, promotion-undo>.md`, rows AL-10.A1 and on |

## Part A: the staging stop, on a scratch project (B2-23). Founder only

Supabase cannot pause a paid project (AUTOMATION 2.10, [V35]), so the stop is three steps. Rehearse them on a scratch project in the staging organization, never on staging itself while the family uses it.

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-10.A1 | Founder: with the spend approved, create a scratch project (for example `scribe-scratch-stop`) in the staging organization, on the same plan. Apply nothing. Settings > API Keys: create a publishable key named `alpha-scratch` and a secret key, and deactivate the legacy keys. | Keys created; legacy keys off | yes or no |
| AL-10.A2 | Founder's computer: `read -rs KEY` (paste the `alpha-scratch` key), then `curl -s -o /dev/null -w '%{http_code}\n' "https://<scratch-ref>.supabase.co/auth/v1/settings" -H "apikey: $KEY"`. | `200` | the status code |
| AL-10.A3 | Founder: Authentication: add one user with the first test address and a long random password. Turn off "Allow new users to sign up". Then `read -rs PW` and `printf '{"email":"delivered+scratch-stop2@resend.dev","password":"%s"}' "$PW" \| curl -s -o /dev/null -w '%{http_code}\n' -X POST "https://<scratch-ref>.supabase.co/auth/v1/signup" -H "apikey: $KEY" -H 'content-type: application/json' --data @-`. | Sign-up refused (a 4xx code); the existing user stays | the status code; seconds from the switch to the refusal |
| AL-10.A4 | Founder: sign the first test user in once (`grant_type=password`, the body on stdin as in A3) and keep the refresh token in a variable (`REFRESH`), sign that user's sessions out in the dashboard (the user's row, sign-out action [U: its name]), then try the refresh token (`grant_type=refresh_token`, body on stdin). | The refresh is refused | the status code |
| AL-10.A5 | Founder: revoke `alpha-scratch` (Settings > API Keys). Repeat AL-10.A2 every 10 s. | The gateway refuses the revoked key (`401` [U until now]): this is what every installed build would get | seconds until refused; the status code |
| AL-10.A6 | Founder: create a new publishable key, `read -rs KEY` again and repeat AL-10.A2; create a new secret key and revoke the old one. Then `unset KEY PW REFRESH`. | `200` with the new key: a new build would work again | yes or no |
| AL-10.A7 | Founder: delete the scratch project the same day. Send S20 what happened in each step, to replace the [U] marks in AUTOMATION 2.10 (one writer). | Project gone | yes or no |

## Part B: the `packDownloads` switch on the live pack host (B2-24)

Needs, merged and in the build on Phone A: the pack host (#126), pack publishing (#162), and the signing-keys PR (BL-335: the public key in `packages/api/src/keys.ts`, AUTOMATION 0.2 item 7; not opened on 16 Oct), because no signed config reaches a phone before the keys are in a build. Also the pack host live (founder steps F09, F13) and the signing key on the founder's computer. A quiet hour: the switch reaches every installed app, the family's included; installed packs keep working, only new downloads wait.

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-10.B0 | The drill-phone check on Phone A. Open the app; Settings > Spoken language lists a language not installed whose only new pack is its text rules (a few KB; for example Portuguese when its speech model is shared), never one that needs a speech model download. | Passes. If not, **stop** | pass or stop; the language chosen |
| AL-10.B1 | Founder, on the founder's computer: set `"packDownloads": true` under `killSwitches` in `scripts/packs/remote-config.json`, then `release` and `upload` as `docs/ops/PACKS_HOSTING.md` says (#162, "Emergency brake"); commit the file and both `published.ts` files. Note the UTC time the upload finished. | `npx tsx scripts/packs/publish.ts verify` all ok; `curl -sI https://packs.earlyletters.app/functions/v1/config/v1/remote-config` answers `200` with `cache-control: no-cache` | UTC time; verify verdict |
| AL-10.B2 | Phone A, app in the foreground. Do not tap before the app can have the switch: wait until the App Privacy Report shows a contact with `packs.earlyletters.app` after AL-10.B1's time, then add the chosen language once. If a download starts anyway, remove it at once (Settings > Storage, the pack in progress, Remove), write down the time, and wait for the next contact before you try again. | Once the switch is on the phone no new download starts: the row shows the paused state (`language.row.<code>.status.waiting-downloads_paused`) and says so in words; English letters still get their words | **minutes from AL-10.B1 to the first refused start** (replaces "about 5 minutes"); downloads that started first and were removed (count); the words on screen |
| AL-10.B3 | Founder: set it back to `false`, `release`, `upload`, commit again. Phone A: try again after the next contact. | The download starts again | minutes until it starts |

## Part C: the database restore drill, on throwaway projects (B2-25). Founder only

`docs/ops/runbooks/restore-drill.md` part 1, with a throwaway source project playing production. Never staging while it holds letters, never production.

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-10.C1 | Founder: create two throwaway projects in the staging organization: a source (`scribe-drill-source`) and a target (`scribe-drill-restore`). Apply every migration to the source in `supabase/APPLY.md` order. Put fictional data in it: a development build pointed at the source, a drill mailbox account, three typed letters "Asha restore drill 1" to "3". If that is not possible in time, run with the migrated, empty source and say so. | Source migrated; `select public.ops_schema_health();` all zeros | letter count on the source |
| AL-10.C2 | Founder: restore the source's newest backup into the target (Database > Backups, restore to a new project if offered [U]), or else `pg_dump` the source into a folder you will delete today and load it into the target with `psql`. Unschedule cron jobs on the target (runbook step 2). Note the restore point and the start time. | The target holds a copy | restore point; start time |
| AL-10.C3 | Founder, in a fresh terminal window: `read -rs` the four values into `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (the target's), `PROD_SUPABASE_URL` and `PROD_SERVICE_ROLE_KEY` (the source's) and `export` them, then `OPS_OPERATOR=<your handle> node scripts/ops/restore-drill.ts --mode drill --project-ref <target> --prod-ref <source> --ticket DRILL-ALPHA --restore-point <ISO> --started-at <ISO> --replay --out ~/ops/drill-alpha.json` (runbook step 3; the script refuses to start without `OPS_OPERATOR`). Then `unset` the four and close the window. | `PASS`, or a list of findings; the hash sample matches (3 of 3 with fictional letters) | verdict; RTO in minutes; hash sample counts (from the JSON record, counts only) |
| AL-10.C4 | Founder: add the drill line to the runbook's drill log (S07's file: send it to S07), delete both projects and any `pg_dump` file the same day (it holds the drill account's auth rows). | Projects and dump gone | yes or no |

## Part D: TestFlight expiry (B2-26)

This is AL-08.11 at the time AUTOMATION 2.10 sets: after build 2 is in TestFlight. Never expire build 1: it stays as the fallback.

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-10.D0 | The drill-phone check on Phone B, which has R1 installed. | Passes. If not, **stop** | pass or stop |
| AL-10.D1 | Founder, App Store Connect: TestFlight > R1 > Expire build (R1 went only to the "Founder" group). | R1 shows as expired; build 1 and build 2 are untouched | yes or no |
| AL-10.D2 | Phone B: open the installed R1. Then open TestFlight. | Record what happens: whether R1 still opens (TESTFLIGHT.md marks this unverified), and that TestFlight offers no install of R1 | what happened, in words |

## Part E: an Edge Function back to the previous commit (B2-27). Founder only

AUTOMATION 2.10, "Edge Functions": a no-op change deployed and reverted on staging. Agents never deploy (2.11). One function with a health path, at a quiet hour; nothing else on staging changes.

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-10.E1 | Founder: note the commit the staging functions came from. On a scratch branch, add one comment line to one function with a public read path (for example `content`), and deploy that function alone to staging from the founder's computer, with the flags its `index.ts` names (`npx supabase functions deploy content --project-ref <staging-ref> --no-verify-jwt --use-api`; without `--no-verify-jwt` the public path starts refusing phones). | Deployed | UTC time; the function's name |
| AL-10.E2 | `curl -s -o /dev/null -w '%{http_code}\n' "https://<staging-ref>.supabase.co/functions/v1/content/v1/bundle?locale=en"` (no key needed; `supabase/functions/config/serve.test.ts` expects 200 for it), or the health path RA-07-06's `scripts/ops/staging-smoke.ts` checks once it lands. | `200` | the status code |
| AL-10.E3 | Founder: check out the noted commit and deploy the same function again with the same command (the undo). Repeat AL-10.E2. | `200`; the deployed version matches the noted commit (Dashboard > Edge Functions, the function's deployments) | minutes for the undo; the status code |

## Part F: a build promoted by mistake leaves the group (B2-28)

AUTOMATION 2.10, "Mistaken promotion": the R-17 undo if a servers-on build reaches "Friends". Rehearsed with a throwaway build in "Founder" only, so no tester outside the founder's phones ever sees it. Never touch build 1 or build 2 in "Family" or "Friends".

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-10.F0 | The drill-phone check on Phone B (signed in to TestFlight as a "Founder" group tester). | Passes. If not, **stop** | pass or stop |
| AL-10.F1 | Founder, App Store Connect: pick a superseded build already uploaded (no new EAS build is spent) and add it to the "Founder" group. Phone B: TestFlight shows it. | Listed on Phone B | minutes until listed |
| AL-10.F2 | Founder: remove that build from "Founder", then expire it. Phone B: refresh TestFlight. | It is no longer offered | minutes until gone |

## Pass rule

Each part passes when its rows show the expected result and its evidence file exists. A step that behaves differently from AUTOMATION 2.10 is not a fail of the build: it changes the undo plan (request to S20 for `docs/release/AUTOMATION.md`, to S07 for `PACKS_HOSTING.md` and the runbook) before the go/no-go.

## Stop rule

Part B: if a family member reports that a language will not download, set the switch back at once. Part C: if anything shows real family data in a throwaway project, delete it at once and tell the founder. Part E: if the health path does not answer 200 after either deploy, deploy the noted commit again at once and tell S07 and S20.
