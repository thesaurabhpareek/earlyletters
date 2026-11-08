# Runbook: production kill, rollback and restore (DRAFT, UNVERIFIED)

Backlog 08 rank 9 (NX-01-R5, NX-01-R6). Written 8 Nov 2026 (UTC) by `ops` as a draft. Nothing in it has been run: no hosted project is known to exist (`docs/ops/DEPLOY.md` says `scribe-prod` "does not exist yet"), no menu name was checked on a screen, and every Supabase, App Store Connect, Vercel and EAS step below is from the repository's own docs or from memory and marked where it is not verified.

**This runbook runs only after the founder decides F1 (build 12 reverses D-121 item 1: servers on), F2 (staging first, or production directly; this is the backlog 08 F2, not the age-gate "F2" in PR #635) and F4 (the Supabase plan for production, default Pro with point-in-time recovery, cost UNVERIFIED).** Until then it is reading material. It does not replace `suspected-data-leak.md`, `incident-notification.md`, `restore-drill.md`, `purge-failing.md` or the alpha kill path in `docs/release/TESTFLIGHT.md` ("If something goes wrong"); it links to them.

Companions (also drafts): `scripts/release/hosted-smoke.draft.mjs` (run it after every step below that changes the project), `docs/ops/drafts/db-production-dump.workflow.draft.yml.txt` (the nightly dump).

## 0. Who clicks what

Agents never touch a hosted project, an account or a secret (COORDINATION section 6). Every click below is the founder's unless it says "agent". Agents write the migration file, the PR, the notes and the smoke output.

| Step | Where | Who | Needs |
|---|---|---|---|
| Pause or resume the project; sign-ups off; sign users out; rotate keys | Supabase dashboard | Founder | F1, F2 |
| Backups page, point-in-time restore | Supabase dashboard | Founder | F4 (plan with PITR) |
| Approve a migration; push a `db-v*` tag | GitHub (`db-production` environment) and a terminal | Founder | F2 |
| Deploy or redeploy Edge Functions | Founder's computer (the CI token is staging-only by design, DEPLOY.md lines 158 to 162) | Founder | F2 |
| Write a forward-fix migration, open the PR, run `npm run test:db` | Repository | Agent (`data-architect`, `ops`) | none |
| Expire a TestFlight build; remove from sale; pause a phased release | App Store Connect | Founder | build 12 shipped |
| Change an EAS variable; new build | EAS, `testflight.yml` dispatch with the `testflight` environment approval | Founder | none |
| Roll the website back | Vercel dashboard (Instant Rollback; name UNVERIFIED) | Founder | none |
| Tell families | Email and the in-app status line | Founder, wording by `content` | none |
| Rehearse everything here | Scratch project | Founder clicks, agent prepares and reads | F4 for the PITR drill |

## 1. First decide the case

Same split as the alpha path:

- **Data may be exposed** (an access rule wrong, a key leaked, letters seen by the wrong person): go to section 2 step A at once, then `suspected-data-leak.md` for the first hour and `incident-notification.md` for who is told and when (counsel decides on any legal duty; agents do not).
- **Something is broken, nothing is exposed** (a bad migration, a failing function, sync errors): sections 2 steps C and D, then section 3 (rollback, which means fix forward).
- **The data itself is wrong or gone**: section 4 (restore).

Write down the time you started. The restore targets are in `restore-drill.md`: RPO 24 hours or less (daily backups) or minutes with point-in-time recovery, RTO 4 hours or less. Those numbers were set before F4 and are not measured.

## 2. The kill switch, fastest first

Local first is the safety net: letters already on a phone stay on that phone, and sync waits (TESTFLIGHT.md, "If something goes wrong").

A. **Stop reads now: pause the project.** Supabase dashboard, Project Settings, General, Pause project (menu names UNVERIFIED). It is the only step that stops reads at once, because an access token already issued stays valid until it expires (AUTH_SETUP 1.3 recommends 900 seconds; the project default is UNVERIFIED). Cost: every signed-in phone loses sync and sign-in until you resume. Resume time is UNVERIFIED; a paused project may take minutes to come back. Rehearse it on the scratch project and write the time down.

B. **If a key leaked.** Rotate it before anything else: Project Settings, API Keys. A leaked service key reaches only the functions granted to it (`backup_svc_*`, purge and ops RPCs) since `20261023060000`, but those read and delete people's data: it is still an incident. Rotating the **publishable** key also cuts off every installed build, which is the fastest app-side stop if pausing is not possible, and it means every installed copy needs a new build that carries the new key. Decide that with eyes open. Never print a key in a chat or a log. Remove an old secret from EAS (`npx eas-cli@24.10.0 env:list --environment production`, names only without the sensitive flag).

C. **Stop new accounts and end sessions.** Authentication, turn off "Allow new users to sign up"; Authentication, Users, sign users out if sessions must end (a signed-out person keeps their phone copy).

D. **Remote switches.** The signed config can pause `sync` and `invites` in a build that has them (`apps/mobile/src/lib/capabilities.ts`; the signed manifest answers per gap map S-11). The doc `TESTFLIGHT.md` line 180 says none reached a phone before the signing keys shipped; the keys now trust. **NOT VERIFIED on a device.** Prove it on a TestFlight build before a public submission (gap map section 5), and write the result here.

E. **The build switch is in the bundle.** `EXPO_PUBLIC_SERVER_FEATURES` is read at build time; a shipped store build cannot be switched off from here. A public App Store build also cannot be expired like a TestFlight build. The levers are: App Store Connect, remove the app from sale (App Store availability; name UNVERIFIED), pause a phased release if one is running (not verified that the release uses one), and ship a servers-off build through review (slow; build numbers come only from EAS). For TestFlight builds: App Store Connect, TestFlight, the build, Expire build.

F. **Say it plainly.** The family email and the status line say what happened and what was or was not exposed. Words by `content`; no fear, guilt or loss language; counsel decides on notices.

After any of A to E, run the smoke: `SUPABASE_PUBLISHABLE_KEY=... node scripts/release/hosted-smoke.draft.mjs https://<ref>.supabase.co` and record the output (checks and statuses only).

## 3. Rollback: forward-only

Migrations are forward-only. An applied file is never edited or deleted (CLAUDE.md, PRINCIPLES 9). "Rollback" of the database means a new migration that undoes the effect, and "rollback" of the app means a build.

1. **Prefer expand then contract**, so the previous app build keeps working against the newer schema: add first, switch the app, remove later in a separate release.
2. **Write the fix as a new file** `supabase/migrations/<timestamp>_<name>.sql` (agent), with its own grants (CLAUDE.md: every new table, view, sequence or function carries its grants and `supabase/tests/grants.mjs`). Open a PR; two independent reviews on the head; `npm run test:db` green; the `approve-migration` label; the founder reads the fenced diff.
3. **Apply through CI only**: a `db-v*` tag on a commit on `main` (DEPLOY.md production row), then approval in the `db-production` environment, then the dry run (read it: it lists the files it will apply), then the push. Whether `main` holds the files is a check, not an assumption (gap map section 5: `main` lagged `develop`).
4. **A migration that failed part way**: stop. Do not retry the tag. Read the failing statement in the job log. Whether the Supabase CLI wraps a file in one transaction, and whether `supabase migration repair` is the right tool here, is UNVERIFIED; it needs the database URL on the founder's computer and is a founder-only step. Ask `data-architect` for the exact repair before touching it.
5. **Edge Functions**: redeploy the previous commit's functions from the founder's computer (or `deploy-functions.yml` when a production path exists; none is documented). Check `GET /functions/v1/<name>/health` afterwards with the smoke script.
6. **App**: keep the previous TestFlight build installable. A store rollback is a new build and a review. Website: promote the previous deployment in Vercel.
7. **Record** what changed and why in `docs/ops/` before the next build.

## 4. Restore

Prefer fixing forward. Restore only when the data itself is wrong and cannot be repaired. Two facts from `restore-drill.md` shape everything:
- Storage files are not in database backups and deleted files are not restored.
- `purge_ledger` lives in the database, so a restore rolls it back. The daily `ops-ledger/purges/` files survive; replay them before anyone reconnects, or deleted letters and accounts come back (a broken promise).

Also, the consent pepper is a database setting and not a row, so a dump does not hold it: set it again after a restore (supabase/APPLY.md step 6) or invite codes break. Cron jobs and the purge worker secrets need checking too (APPLY.md steps 7 and 15).

### 4.1 Point-in-time recovery (needs F4)

All of this is UNVERIFIED: whether PITR needs an add-on on top of Pro, its price, its retention window, whether a restore happens in place or into a new project, and how long the project is down during one. Read Supabase's pricing and backups pages first (`docs/ops/runbooks/staging-backup-free.md` records they were last read 1 Nov 2026 for the free plan).

1. Stop writes: pause the purge jobs and the hourly purge (`purge-failing.md` section 6); set the sign-ups off (step C); pause `sync` if the remote switch is proven.
2. Note the target time (UTC) one minute before the damage. Note the start time.
3. Dashboard, Database, Backups, point-in-time restore to that time (menu names UNVERIFIED). If the platform restores into a new project, the app builds still point at the old URL: a new project means a new URL, a new EAS variable and a new build, so in that case restore into a scratch project only, inspect, and fix forward in production.
4. Replay the purge ledger before anyone reconnects:
   `node scripts/ops/restore-drill.ts --mode restore ...` as in `restore-drill.md` Part 2 (read that file's flags; do not copy them from here).
5. Set the pepper again, check cron, run `hosted-smoke.draft.mjs`, then resume sign-ups and the purge.
6. Phones re-upload after a restore epoch (DATA-REQ-030); letters are also on the phones. Tell families in plain words.

### 4.2 The nightly dump as the second path (needs F2)

If PITR is not bought, the dump from `db-production-dump.workflow.draft.yml.txt` is the only copy. Download the newest artifact from the private repository, decrypt with the key on the founder's Mac (or the sealed paper key), restore into a scratch Postgres 17 as in `staging-backup-free.md` "Monthly restore drill", and check with `scripts/ops/restore-check.ts`. That proves the file opens and holds the rows. It does not rehearse a Supabase restore with Auth, Storage and extensions working.

## 5. Restore drill from point-in-time recovery

Never against production. Do it on a scratch project that has the same plan and PITR (cost for the days it runs is UNVERIFIED; delete it the same day, because a restore of real data into it would hold real families' letters; use synthetic Asha data only).

1. Create the scratch project and apply the production migration set through the real path (a `db-v` tag on a rehearsal branch is not possible; use the same CI job against the scratch URL and note any difference).
2. Wait until PITR reports a restore window (time UNVERIFIED).
3. Insert synthetic Asha rows through the app or the seed script. Record T1 (UTC).
4. Damage on purpose: delete a row, apply a harmless rehearsal migration, or purge an entry. Record T2.
5. Restore to T1 plus one minute. Record the start and the finish.
6. Check: the Asha rows are back, the damage is gone, `restore-drill.ts` reports PASS, the pepper must be set again (confirm that it is not retained), cron is intact, `hosted-smoke.draft.mjs` is green.
7. Write the date, T1, T2, the restore time in minutes, what you had to redo by hand, and PASS or FAIL in the drill log table in `restore-drill.md`. Delete the scratch project.

Exit test for the backlog row: a drill log line exists with a measured RTO under 4 hours, and the kill path in section 2 was rehearsed on the scratch project with the pause and resume times written down.

## 6. Founder hand steps, in order (about 3 to 4 hours, estimate)

| # | Step | Needs | Rough time |
|---|---|---|---|
| 1 | Decide F1, F2, F4 and say so in a message that names them | none | minutes |
| 2 | Read Supabase's pricing and backups pages; choose the plan; note the monthly cost in the decision | F4 | 20 min |
| 3 | Create the scratch project (same plan) | F4 | 30 min |
| 4 | Create `scribe-prod`; apply the migration set through the tag flow (DEPLOY.md) | F1, F2 | counted in the 7 founder hours in the gap map |
| 5 | Run `backup-role.sql` on production; create the private repository secrets and variables for the dump workflow; copy the workflow there; run it once by hand | F2 | 30 min |
| 6 | Run `hosted-smoke.draft.mjs` and send the output (statuses only) to `ops` | step 4 | 10 min |
| 7 | Rehearse section 2 on the scratch project; write down pause and resume times | step 3 | 45 min |
| 8 | Run the PITR drill (section 5) | step 3, F4 | 60 min |
| 9 | Name GitHub as a subprocessor (docs/legal, founder merge) before real families' data goes in the dump | step 5 | per legal |
| 10 | Put the three runbook pages and the sealed key location where you can find them at 3 AM | none | 15 min |

## 7. NOT VERIFIED

- Whether any hosted project exists, which plan it is on, what PITR costs, its window, and whether a restore is in place or into a new project.
- Every dashboard menu name, the pause and resume times, and whether a paused project keeps its URL and keys.
- The remote switches on a real phone; any store-side lever (remove from sale, phased release, expire build) for a public release.
- That `supabase migration repair` applies; whether a migration file runs in one transaction.
- That the drill steps work end to end; none was run.
- The production dump workflow and the smoke script were checked only as described in their headers (YAML parse, a mock server, a two-key `age` round trip).
