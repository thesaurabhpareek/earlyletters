# Runbook: the seven rollback rehearsals (RB-15b, go/no-go B2-14 and B2-23 to B2-28)

`docs/qa/ALPHA_GO_NO_GO.md` (build 2) requires seven rollback rehearsals before build 2 goes to Family and Friends. This file is the one place that lists them, who may run each, the exact steps, the evidence and the pass rule. It does not replace the click-by-click run sheets: `docs/qa/run-sheets/AL-08-server-kill-switch.md` (parts B and C) and `docs/qa/run-sheets/AL-10-rehearsals.md` (parts A to F) stay the step source, and this file points at their row numbers. The undo each one rehearses is in `docs/release/AUTOMATION.md` section 2.10.

## Status on 28 Oct 2026

None of the seven has run. The go/no-go rows B2-14 and B2-23 to B2-28 are all "open: not run" [V: read in `ALPHA_GO_NO_GO.md`]. This file does not change that. An agent cannot run any of the seven end to end: each needs a Supabase organization, a build on a phone, App Store Connect, or the live pack host. What an agent can run is one local slice of rehearsal 4 (below), which narrows what the founder's real run has to prove. It is not a substitute for it.

## The seven

| # | Go/no-go | Rehearsal | Run sheet | Who | Agent-runnable here |
|---|---|---|---|---|---|
| 1 | B2-14 | The kill path on R1: a switch-off build of the same commit keeps every letter; sign-ups off on staging | AL-08 parts B and C | Founder (a build, two drill phones, the staging dashboard) | No |
| 2 | B2-23 | The staging stop on a scratch project: sign-ups off, sessions out, named publishable key revoked | AL-10 part A | Founder only (secret keys, staging organization, spend approval) | No |
| 3 | B2-24 | `packDownloads` kill switch on the live pack host | AL-10 part B | Founder (signing key, pack host, SE 3) | Config and app logic only, by existing tests |
| 4 | B2-25 | Database restore drill on throwaway projects | AL-10 part C | Founder only (service-role keys) | The replay and epoch slice only |
| 5 | B2-26 | TestFlight expiry of R1 | AL-10 part D | Founder (App Store Connect, Phone B) | No |
| 6 | B2-27 | An Edge Function back to the previous commit | AL-10 part E | Founder only (agents never deploy, AUTOMATION 2.11) | No |
| 7 | B2-28 | A mistaken promotion undone | AL-10 part F | Founder (App Store Connect, Phone B) | No |

Numbering differs between documents: RA-19-05 and the run sheets call 1 to 5 "rehearsals 1 to 5" in the order kill path, staging stop, pack switch, restore, expiry, and AUTOMATION 2.10 dates 6 and 7 (Edge Functions, mistaken promotion). `ALPHA_GO_NO_GO.md` row text numbers them the same way as the table above except B2-23 is "rehearsal 2", B2-24 "3", B2-25 "4", B2-26 "5", B2-27 "6", B2-28 "7".

## Rules for all seven

- Agents never run a founder-only rehearsal, never hold the keys, never use a connector against staging or production, and never deploy (AUTOMATION 0.1 item 8 and 2.11; COORDINATION section 6). An agent may prepare, review the evidence file, and run the local slice.
- Drill identities and the drill-phone check come first (`docs/qa/run-sheets/README.md`, "Drill identities", rule 3).
- Keys never reach shell history: `read -rs NAME`, pass as `"$NAME"`, JSON bodies on stdin, `unset` at the end of the part.
- No key, project URL, token, user id or address in evidence. Write status codes, times, counts and words on screen.
- Evidence file: `docs/qa/evidence/<YYYY-MM-DD>-rehearsal-<name>.md`, one per rehearsal (names in each section). A step that behaves differently from AUTOMATION 2.10 does not fail the build: it changes the undo plan, so request the edit to `AUTOMATION.md` (S20) or the runbook (S07) before the go/no-go.
- A rehearsal passes when every expected result below holds and its evidence file exists. "Not run" and "ran partly" are written as such, never as pass.

Evidence table to copy into each evidence file (one row per step id from the run sheet):

| Step id | Done by (handle) | UTC date and time | Expected | Observed (status code, count, minutes, words on screen) | Pass / fail / not run |
|---|---|---|---|---|---|
| | | | | | |

Header lines for the file: build and commit, phones used (tags only), rehearsal name, who ran it, and anything the step did not say that you had to do.

## 1. The kill path on R1 (B2-14). Founder

**Preconditions.** R1 (the `preview` profile, servers on, against staging) installed on Phone A and Phone B, both drill phones holding only drill letters. A switch-off build from the same commit available in TestFlight or as an EAS install link. Nobody from the family is signing in (rule 4 of the run sheet). Time: about 50 minutes. Not runnable before a build exists (`docs/release/TESTFLIGHT.md`).

**Steps.** Run `AL-08-server-kill-switch.md` rows AL-08.0, then Part B (AL-08.4 to AL-08.8: sign-ups off, refusal on Phone B, existing session still saves, sessions signed out, sign-ups back on within 20 minutes), then Part C (AL-08.9 to AL-08.11: switch-off build over R1, then R1 over it). Part A (build 1 has no server path) is a separate pass.

**Evidence.** `docs/qa/evidence/<date>-<build>-<device>.md` per the evidence README (this one has phones). Rows AL-08.4 to AL-08.10: times in UTC, minutes sign-ups were off, letter count before and after AL-08.9 (must match), count on staging after AL-08.10.

**Pass.** Part A, Part C and AL-08.0 pass; Part B passes when sign-ups stop with nothing lost on any phone and sign-ups are back on within 20 minutes. Letters lost or doubled in Part C is S0: the switch-off build is not the kill path until fixed.

## 2. The staging stop on a scratch project (B2-23). Founder only

**Preconditions.** The founder approved the scratch project's Pro compute (a spending decision, COORDINATION section 1). A scratch project in the staging organization, never staging while the family uses it. Test users `delivered+scratch-stop@resend.dev` and `delivered+scratch-stop2@resend.dev` only. Time: about 45 minutes. Needs a real Supabase project: not runnable here.

**Steps.** `AL-10-rehearsals.md` AL-10.A1 to AL-10.A7. In short: create a named publishable key and a secret key and deactivate the legacy keys; check `curl -s -o /dev/null -w '%{http_code}\n' "https://<scratch-ref>.supabase.co/auth/v1/settings" -H "apikey: $KEY"` answers 200; turn sign-ups off and check a signup returns 4xx while the existing user stays; sign the user out and check the refresh token is refused; revoke the named key and poll every 10 s until the gateway refuses it (expected 401, unverified until now); create a new key and confirm 200; delete the project the same day.

**Evidence.** `docs/qa/evidence/<date>-rehearsal-staging-stop.md`. Status code per step, seconds from the sign-up switch to the refusal, seconds until the revoked key is refused.

**Pass.** Every expected result of A2 to A6 holds and the project is deleted (A7). The measured seconds replace the [U] marks in AUTOMATION 2.10 (send them to S20, one writer).

## 3. The `packDownloads` switch on the live pack host (B2-24). Founder

**Preconditions.** Pack host live (F09, F13); signing key on the founder's computer; the public signing key in `packages/api/src/keys.ts` and in the build on the SE 3 (BL-335; empty on `develop` per `ALPHA_GO_NO_GO.md` B2-24, so this is blocked today [V: read]); Phone A is a drill phone and Settings > Spoken language lists a language not installed whose only new pack is its text rules. A quiet hour: the switch reaches every installed app, the family's included. Time: about 40 minutes.

**Steps.** AL-10.B0 to AL-10.B3. The switch is flipped with the existing tool, not by hand:

```bash
npx tsx scripts/packs/publish.ts config --kill packDownloads      # sets "packDownloads": true in scripts/packs/remote-config.json and signs it
npx tsx scripts/packs/publish.ts verify                           # expected: all ok
curl -sI https://packs.earlyletters.app/functions/v1/config/v1/remote-config   # expected: 200, cache-control: no-cache
```

Follow `docs/ops/PACKS_HOSTING.md` ("Emergency brake") for the upload step the tool prints; commit the changed files. Note the UTC time the upload finished. On Phone A wait until the App Privacy Report shows a contact with the pack host after that time, then add the chosen language once. To undo: `publish.ts config --unkill packDownloads`, upload, commit, retry after the next contact. The exact `publish.ts` argument form is read from its header comment and `scripts/packs/publish.ts` lines 280 to 300 [V]; run `npx tsx scripts/packs/publish.ts` with no argument to see its usage before the live run, and use what it prints if it differs.

**Evidence.** `docs/qa/evidence/<date>-rehearsal-pack-switch.md`. UTC upload time, `verify` verdict, minutes from upload to the first refused start (replaces "about 5 minutes"), downloads that started first and were removed (count), words on screen, minutes until the download starts again after the undo.

**Pass.** After the switch the language row shows the paused state (`language.row.<code>.status.waiting-downloads_paused`) and says so in words, no new download starts, installed packs and English letters keep working; after the undo the download starts. Stop rule: if a family member reports a language will not download, undo at once.

**What agents may run now (the logic, not the rehearsal).** These prove the config and the phone's refusal in code and do not touch any host. Last run 28 Oct 2026 on this branch [V]:

```bash
npx vitest run scripts/packs/s3.test.ts                     # 19 passed: verify reports "kill switches on: packDownloads"
(cd packages/api && npx vitest run test/remote-config.test.ts)   # 17 passed: switch names, stale-config rule
(cd apps/mobile && npx vitest run src/lib/packs/__tests__/engine.test.ts)   # 46 passed: downloadsPaused refuses ensurePack
```

They do not measure the delay, the signed document on the real host, or the screen text. Those are the founder's run.

## 4. The database restore drill (B2-25). Founder only; one slice runs locally

**Preconditions.** Two throwaway projects in the staging organization (`scribe-drill-source`, `scribe-drill-restore`), every migration applied to the source in `supabase/APPLY.md` order, fictional data only ("Asha restore drill 1" to "3" or an empty migrated source, said so). Never staging while it holds letters, never production. `OPS_OPERATOR` set. Any `pg_dump` file deleted the same day. Time: about 90 minutes, mostly waiting.

**Steps.** AL-10.C1 to AL-10.C4, which follow `docs/ops/runbooks/restore-drill.md` part 1: restore or dump-and-load the source into the target; unschedule cron on the target; in a fresh terminal `read -rs` the four values into `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (target), `PROD_SUPABASE_URL`, `PROD_SERVICE_ROLE_KEY` (source), `export` them, then

```bash
OPS_OPERATOR=<handle> node scripts/ops/restore-drill.ts --mode drill --project-ref <target> --prod-ref <source> \
  --ticket DRILL-ALPHA --restore-point <ISO> --started-at <ISO> --replay --out ~/ops/drill-alpha.json
```

`unset` the four and close the window. Add the drill line to the runbook's drill log (send it to S07), delete both projects and any dump.

**Evidence.** `docs/qa/evidence/<date>-rehearsal-restore.md` and the drill log line. Verdict, RTO in minutes, backup age, ledger ids, hash sample counts (3 of 3 with fictional letters), counts only from the JSON record.

**Pass.** The script prints `PASS` (or every finding is explained and the runbook is fixed), the hash sample matches, RTO is within 4 hours, both projects are gone.

**Local slice, agent-runnable.** `scripts/ops/rehearsal/restore-replay.mjs` runs in embedded Postgres (PGlite) with every migration. It plays the restored state with the harness: a kept letter and a letter purged after the restore point, then `ops_replay_ledger`, then `sync_begin_epoch`, then a phone pull on the old epoch. Checks:

| Id | Rule it guards |
|---|---|
| RH4.1 | A letter purged after the restore point is gone after replay (restore-drill.md step 3: otherwise deleted letters come back) |
| RH4.2 | A kept letter survives the replay |
| RH4.3 | Replaying the same ledger twice deletes nothing the second time |
| RH4.4 | The kept letter's `raw_transcript` hash is unchanged (DATA-REQ-031 hash sample) |
| RH4.5, RH4.6 | After `sync_begin_epoch` a phone on the old epoch is told to start over, epoch +1 (restore-drill.md part 2 step 4) |
| RH4.7 | Only the service role can begin an epoch |

```bash
node scripts/ops/rehearsal/restore-replay.mjs                       # all 7 pass, about 15 s
node scripts/ops/rehearsal/restore-replay.mjs --sabotage skip-replay   # RH4.1 and RH4.3 FAIL, exit 1
node --test scripts/ops/rehearsal/restore-replay.test.mjs           # 5 tests: clean run plus four plants
```

Plants: `skip-replay`, `skip-epoch`, `over-delete`, `tamper-raw`. The script takes no URL or key and cannot reach a real database. It does not prove the dashboard restore, Storage files, Auth users, the HTTP script `restore-drill.ts`, or the RTO: that is the founder's run. A green local run does not tick B2-25.

## 5. TestFlight expiry (B2-26). Founder

**Preconditions.** Build 2 is already in TestFlight (the freeze is proposed for Tue 3 Nov, until the founder confirms). R1 on Phone B (a drill phone) and went only to the "Founder" group. Never expire build 1: it stays as the fallback. Time: about 10 minutes.

**Steps.** AL-10.D0 (drill-phone check), D1 (App Store Connect > TestFlight > R1 > Expire build; build 1 and 2 untouched), D2 (open the installed R1, then TestFlight).

**Evidence.** `docs/qa/evidence/<date>-rehearsal-testflight-expiry.md`. Whether R1 still opens (`TESTFLIGHT.md` marks this unverified), and that TestFlight offers no install of R1, in words.

**Pass.** R1 shows expired, build 1 and 2 untouched, and the installed copy's behaviour is recorded. A surprising result changes `TESTFLIGHT.md` (request to S20), not the pass.

## 6. An Edge Function back to the previous commit (B2-27). Founder only

**Preconditions.** Staging with functions deployed (AF-13, #152 F16 and F17); a quiet hour; nothing else on staging changing. Agents never deploy (AUTOMATION 2.11). Time: about 20 minutes.

**Steps.** AL-10.E1 to E3: note the commit the staging functions came from; on a scratch branch add one comment line to the `content` function and deploy it alone with the flags its `index.ts` names (`npx supabase functions deploy content --project-ref <staging-ref> --no-verify-jwt --use-api`; without `--no-verify-jwt` phones are refused); check `curl -s -o /dev/null -w '%{http_code}\n' "https://<staging-ref>.supabase.co/functions/v1/content/v1/bundle?locale=en"` answers 200; check out the noted commit, deploy the same function with the same command, repeat the check.

**Evidence.** `docs/qa/evidence/<date>-rehearsal-function-redeploy.md`. UTC time and function name, status code after each deploy, minutes for the undo, the deployed version matching the noted commit.

**Pass.** 200 after both deploys and the deployed version matches the noted commit. Stop rule: if either check is not 200, redeploy the noted commit at once and tell S07 and S20. Not runnable here: needs staging and the founder's token.

## 7. A mistaken promotion undone (B2-28). Founder

**Preconditions.** A superseded build already uploaded to App Store Connect (no new EAS build is spent); Phone B signed in to TestFlight as a "Founder" group tester and passing the drill-phone check. Never touch build 1 or 2 in "Family" or "Friends". Time: about 15 minutes.

**Steps.** AL-10.F0 to F2: add the superseded build to "Founder" and confirm Phone B lists it; remove it from "Founder", expire it, refresh TestFlight on Phone B.

**Evidence.** `docs/qa/evidence/<date>-rehearsal-promotion-undo.md`. Minutes until listed, minutes until no longer offered.

**Pass.** The build is listed after the add and no longer offered after remove and expire. Not runnable here: needs App Store Connect and a phone.

## What changes when a rehearsal is run

1. The founder (or S19 for the harness parts) writes the evidence file from the table above.
2. Flip the row in `docs/qa/ALPHA_GO_NO_GO.md` from "open: not run" to the real result, with the evidence path. That file is owned by S19; send the request rather than editing it from here.
3. If a result differs from AUTOMATION 2.10, request the edit to S20 (AUTOMATION) or S07 (PACKS_HOSTING and the restore runbook).

## Open points [U]

- The dashboard action name for signing a user's sessions out (AL-10.A4) and whether "restore to a new project" is offered (restore-drill.md step 1) are unverified in the sources and stay so until the founder's run.
- Exact `publish.ts config --kill` argument form for rehearsal 3 was read from the code, not run live.
- The local slice runs against the migration set at this commit only; a new migration that changes `ops_replay_ledger` or `sync_begin_epoch` is covered the next time the script runs. It is not wired into CI by this change.
