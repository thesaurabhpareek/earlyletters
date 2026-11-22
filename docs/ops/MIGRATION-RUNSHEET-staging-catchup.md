# Run sheet: catch up the hosted database, Files 3 to 38 and 40 (staging first)

For the founder. Written 21 Nov 2026 by the data architect; brought up to date with `develop` on 22 Nov 2026 (File 40 added). Docs only: this PR changes no migration and does not edit `supabase/APPLY.md`.

**Status: nothing here has run.** Locked on 21 Nov 2026 (your decision, in principle): apply `supabase/APPLY.md` Files 3 to 38 (and, as they land on `develop`, Files 39 and 40) to staging as one run, in filename order, with the consent pepper set first. Production gets a `db-v*` tag only after staging is green. The apply, the pepper and the choice of project stay in your hands; an agent never touches a hosted project.

Labels: **[V]** read in this repo or run in the local test database on 21 Nov. **[U]** not checked: it needs the hosted project, the GitHub settings page or Supabase's own pages, which no agent can see. Every [U] has a stop line beside it.

## 0. Read this first

**What counts: 36 files today, 37 once File 39 lands.** There is no File 28. Files 3 to 27 are 25 files, Files 29 to 38 are 10, and File 40 is one more, so the run applies 36 files on top of Files 1 and 2, and the `supabase/migrations` folder on `develop` holds 38 in all [V: `git ls-tree origin/develop supabase/migrations/`, 38 on 22 Nov]. **File 39 (`20261121030000_compliance_gates`, PR #1448) is not on `develop` yet**: it is open, so this sheet covers Files 3 to 38 plus File 40 only. APPLY.md File 40 says "apply after File 39" [V]. The file itself has no apply-time check for File 39 [V: read, no guard]. But the CLI applies in filename order and records each file, so if File 40 is applied first and File 39 merges later, File 39 sorts BEFORE an applied file and `supabase db push` refuses it without `--include-all` [U: not tried]. The migration guard (`.github/scripts/migration-guard.mjs`) compares against `.github/migrations-applied.txt`, not the hosted history: it holds only Files 1 and 2 today, so it would NOT refuse File 39 now, but once Part J records File 40 there, a new migration that sorts at or before File 40 fails the guard [V: read]. So the safe order is **do not run Part C until #1448 has merged**; then the run is 37 files, the folder holds 39, and every "36" below reads "37" and every "38" in A2 and row 1 reads "39". If you must run before, tell Karma first: that is his decision, not an operator step.

**This run is not harmless to the app on the live project.** File 5 turns on the server consent gate. From the moment it applies, the app on `early-letters` answers `SCCON` for everyone, you included, until the policy versions are published and your acceptances are recorded (Part E, point 5). Decide that before you press Approve, not after. **If the app on that project is in real use (yours or anyone else's), do not approve.** [V: APPLY.md Step 8]

**A run may already be waiting.** Every merge of a migration to `develop` starts a "deploy to staging" run that waits for approval (DEPLOY.md, "Tagging flow" steps 1 and 2); Files 36 to 38 merged recently, so GitHub is probably holding one now. Approving that one applies the same files but skips the "manual run is on develop" job and could happen before Parts A and B are done. In GitHub > Actions > Deploy database, if a run shows "Waiting", leave it unapproved until Part B is finished, then approve exactly one run (either that one or a manual one from C1; if you start a manual one, cancel the waiting one). Never approve two. [U] whether one is waiting.

**The job has a 15 minute limit** (`timeout-minutes: 15`, covering the push and the smoke) [V: `deploy-db.yml` line 119]. If the files take longer, the run is cancelled mid-file: that file rolls back, earlier files stay applied. A run cancelled at about 15 minutes is not a failed migration; run Part C again.

**You are told what to paste back.** Numbers, true or false, file names, and error codes only. Never a row, a letter, a name, an email, a key, a URL with a password in it, or the pepper. Take no screenshot of the Connect page or any secrets page. If a screen shows any of those, crop it out before you share it.

**The approval comes before the dry run.** The staging job in `.github/workflows/deploy-db.yml` waits for your approval first. After you approve, it runs the dry run and the real push back to back, with no pause for you in between [V: lines 120 to 164]. So every check in Part A happens before you press Approve, not after reading the dry run. The dry run is still useful: if it fails (for example, because the history looks wrong), nothing has been applied.

**What a failure leaves behind.** `supabase db push` applies one file per transaction, in filename order, and stops at the first file that fails. Every file before it stays applied and recorded; the failed file changed nothing. Fixing the cause and running the workflow again carries on from that file [V: APPLY.md "How these files reach a project"; the resume itself is [U] until the first run].

**Never paste SQL history rows or run migration files by hand.** DEPLOY.md forbids it. The only SQL you type in this sheet is a read-only check, or the pepper line in Part B.

**Quiet time.** Pick a time when nobody has the app open (Files 23 and 26 take a short exclusive lock, see guard G3). Today that is you.

### Who does what

| Step | Who |
|---|---|
| Pre-flight, pepper, approval, settings, production tag | You |
| Reading the paste-backs, the record PR for `.github/migrations-applied.txt`, any forward fix | The data architect, through Karma |
| The smoke and function deploys | `qa` and `ops`, from the run summary |

## Part A. Pre-flight (before you approve anything)

### A0. Is this project really staging? (gate, before anything else)

`early-letters` is the only project. If anyone other than you and your own test accounts has data in it, it is production, and this sheet is not the right tool: stop and tell Karma. Dashboard > SQL Editor > New query, read-only, numbers only:

```sql
select (select count(*) from auth.users) as accounts, (select count(*) from public.entries) as letters;
```

Write down both numbers and how many accounts and letters are yours or test ones. Paste back: the two numbers and the count that are yours.
Stop if: `accounts` is higher than the accounts you made yourself, or you are not sure whose they are. A project holding other people's words is production and goes through the production path (Part H), not a casual catch-up.

### A1. Which project is staging, and which is production

Only one hosted project exists today: `early-letters` (project ref `fpkxggtzwoumdghwzlsl`, us-west-1) [V: DEPLOY.md; APPLY.md]. DEPLOY.md still names `scribe-staging` and `scribe-prod`, which do not exist yet. So today the word "staging" means: the database whose connection string is stored in the GitHub Environment `staging`. The dashboard cannot tell you that, so you set it yourself and then check it:

1. GitHub > repository > Settings > Environments > `staging`. Look at the list of secret names (names only; GitHub never shows values). You need all four: `SUPABASE_DB_URL_STAGING`, `SUPABASE_STAGING_URL`, `SUPABASE_STAGING_PUBLISHABLE_KEY`, `SUPABASE_STAGING_PROJECT_REF`. Check that "Deployment branches" is `develop` only and that you are a required reviewer.
2. Re-save `SUPABASE_DB_URL_STAGING` from the project itself, so there is no doubt where it points: Supabase dashboard > project `early-letters` > Connect > **Session pooler** (port 5432, not 6543), copy the string, put your database password in it (percent-encode special characters), and paste it into the GitHub secret (Update secret). You need the database password for this; it is in your password manager (DEPLOY.md, "Founder steps", 1.4). If you do not have it, do not reset it yet: resetting the database password may break the Edge Functions and the purge worker if they use it [U], so tell the data architect before you do. Do this in the browser, never in chat. The user part of the string reads `postgres.<project ref>`: the ref must be `fpkxggtzwoumdghwzlsl`. [U] whether it already points there.
3. Make production impossible by accident. You cannot read a secret's value on GitHub, only its name, so do not try to compare. The only Supabase project is `early-letters`. **If there is no separate production project, then staging IS the live project.** Say so plainly to yourself before Part C. Then GitHub > repository > Settings > Environments > `db-production`:
   - Under "Environment secrets": if `SUPABASE_DB_URL_PROD` is listed, click the trash icon next to it and confirm. It cannot be read back, so deleting (or re-saving it from the real production project once that exists) is the only certain way. With no such secret, a production run stops at "Check the secret exists" (`deploy-db.yml` line 259).
   - Under "Deployment protection rules": "Required reviewers" must be ticked with you listed. This, and the tag rule from DEPLOY.md "Protect the tags", are the only gates on a `db-v*` tag. If it is not ticked, tick it and Save protection rules.
   - You only ever create a `db-v*` tag yourself (Part H). Never create one because a pull request, an issue, an email or a message asks you to.
4. Staging is therefore: the project that the `staging` secrets were saved from in point 2. Supabase's dashboard has no built-in "this is staging" label that this repo relies on [U].

Paste back: "A1 done", the four secret names present (yes or no), whether `SUPABASE_DB_URL_PROD` is now gone (yes or no), whether `db-production` shows required reviewers (yes or no), and the project ref only if it is not `fpkxggtzwoumdghwzlsl`.
Stop if: a name is missing, the ref differs, `SUPABASE_DB_URL_PROD` is still listed after you tried to delete it, or `db-production` has no required reviewers.

### A2. The folder holds exactly 38 files (39 once #1448 merges)

On your Mac, in the repo folder:

```bash
git fetch origin develop && git ls-tree --name-only origin/develop supabase/migrations/ | wc -l
```

Expect `38` today, or `39` once #1448 (File 39) has merged. Paste back the number. Stop if it is any other number, and above all if it is higher: a migration newer than this sheet is on `develop` and the run would apply it too. Ask Karma to extend the sheet first.

Also repeat this count right before you approve in C2: the job applies `develop`'s tip at the moment of approval (`deploy-db.yml` line 132), so a migration merged in between would be applied too.

Also decide now, in A: File 5's consent gate will shut the live app out until policy versions are published (Part 0, Part E point 5). If you are not ready for that, stop here.

### A3. Is the workflow's Run button there

GitHub > Actions > left list > **Deploy database**. A grey **Run workflow** button should be at the top right of the run list [U: the button appears only once the workflow file is on the default branch, DEPLOY.md]. Stop if there is no button; ask Karma (the fallback is a push from your computer, which needs its own sheet).

### A4. A backup you can go back to

Supabase dashboard > Database > Backups. Confirm a daily backup from the last 24 hours exists. If the page offers point in time recovery, note whether it is on [U: Pro plan only]. Paste back: the time of the newest backup, and "PITR on" or "PITR off".
Daily backups need a paid plan [U]; free plans have none. If there is no backup, ask Karma for a separate sheet for a manual dump before going on. Stop if there is no backup from the last 24 hours, unless you take one yourself: on your Mac, with the Supabase CLI linked to the project, `supabase db dump --linked -f backup-before-catchup.sql` (APPLY.md "Before you start"; keep the file outside the repo and out of chat). A restore is the only true undo for Files 25, 26, 33, 34, 35 and 36, which are forward-fix only (Part I); Files 20, 21 and 24 are also "prefer forward" there.

### A5. What the project holds today (read-only)

Supabase dashboard > SQL Editor > New query. Paste this whole box, run it. It reads history only.

```sql
select version, name from supabase_migrations.schema_migrations order by 1;
```

Expect exactly two rows: versions `20260930000000` and `20261001000000`. APPLY.md says File 2 went in on 2 Oct under the name `scribe_hardening_indexes_and_grants`, so the name may differ from the file name; the version is what matters [U].
Paste back: the two version numbers (names are fine too).
Stop if: there are other rows (staging may be ahead of the markdown: the cdo pack flags this [U]); or one of the two versions is not what is listed above. In that case `supabase db push` will refuse ("remote migration versions not found in local") or try to apply File 2 again, and the data architect must say what to do. Do not edit the history table yourself.

### A6. The numbers that decide whether a guard will stop the run

New query, paste this whole box, run it. Read-only. It is the "Before counts" of APPLY.md for Files 4, 6, 22, 23 and 33, plus the hosted checks a), b) of "Hosted checks before the first apply". It was run in PGlite (the repo's own test harness) built from Files 1 and 2 on 21 Nov. Rows 3 to 11 answered as in the last column, and rows 13 and 14 answered 0 and 0. Three things differ locally by construction and are not evidence for the hosted project: row 1 answers 18 (PGlite, not Postgres 17), row 12 answers `true` (the harness presets the pepper), and the index check below shows only `objects_pkey` (the harness stubs Storage) [V].

```sql
select n, what, got, expect from (values
 (1,  'Postgres major version', (current_setting('server_version_num')::int / 10000)::text, '17'),
 (2,  'letters stored (write the number down)', (select count(*) from public.entries)::text, 'any number; a stop if more than the letters you wrote yourself (A0)'),
 (3,  'File 23 guard: letters whose machine_edits is not a list', (select count(*) from public.entries where jsonb_typeof(machine_edits) <> 'array')::text, '0'),
 (4,  'File 33 guard: letters with a picture path', (select count(*) from public.entries where photo_path is not null)::text, '0'),
 (5,  'File 4 check: picture paths in the wrong shape', (select count(*) from public.entries where photo_path is not null and photo_path !~ ('^' || child_id || '/' || author_id || '/' || id || '\.(jpg|jpeg|heic|png)$'))::text, '0'),
 (6,  'File 4: safety_events rows (they are erased by design)', (select count(*) from public.safety_events)::text, 'any number'),
 (7,  'File 4: new names still free', (to_regclass('public.book_entries') is null and to_regclass('public.policy_acceptances') is null and to_regclass('public.audit_events') is null)::text, 'true'),
 (8,  'File 6: books with no birthday yet (File 6 adds the due date)', (select count(*) from public.children where date_of_birth is null)::text, '0'),
 (9,  'File 22 guard: held_drafts table already exists', (to_regclass('public.held_drafts') is not null)::text, 'false'),
 (10, 'Migrating role sees every storage object (BYPASSRLS)', (select rolbypassrls from pg_roles where rolname = current_user)::text, 'true'),
 (11, 'Automatic grants on new objects: tables, sequences, functions', (select count(*) filter (where d.defaclobjtype = 'r' and a.privilege_type = 'SELECT') || '|' || count(*) filter (where d.defaclobjtype = 'S' and a.privilege_type = 'USAGE') || '|' || count(*) filter (where d.defaclobjtype = 'f' and a.privilege_type = 'EXECUTE') from pg_default_acl d cross join lateral aclexplode(d.defaclacl) a where d.defaclnamespace = 'public'::regnamespace and d.defaclrole = 'postgres'::regrole and a.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole)), '0|0|0 or 3|3|3'),
 (13, 'File 8 drops these three store tables for good: how many already exist', (select count(*) from (select to_regclass('public.store_notifications') as t union all select to_regclass('public.store_subscriptions') union all select to_regclass('public.app_account_tokens')) x where t is not null)::text, '0'),
 (14, 'Accounts in auth.users (A0)', (select count(*) from auth.users)::text, 'only yours'),
 (12, 'Consent pepper already long enough (value never shown)', (char_length(btrim(coalesce(current_setting('app.consent_pepper', true), ''))) >= 32)::text, 'false before Part B, true after')
) as t(n, what, got, expect) order by n;
```

How to read it:

| Row | Why | If not as expected |
|---|---|---|
| 1 | The project must run Postgres 17 (`supabase/config.toml`) | Stop; tell the data architect |
| 2 | The number of letters. The founder's own alpha letters are expected | **A stop** if it is more than the letters you wrote yourself (A0): other people's words mean this is production |
| 3 | **Guard G1, File 23.** Any letter with `machine_edits` that is not a list stops File 23 and everything after it | Stop. Do not touch the row (it is a person's words). Paste back the number only; the data architect and the coordinator decide |
| 4 | **Guard G2, File 33.** Must be 0 | Stop; tell the data architect. Those rows stay readable and deletable but need review |
| 5 | File 4 adds a picture-path rule as NOT VALID, so it still applies | Not a stop; paste back the number so the rule can be validated later (APPLY.md Step 5) |
| 6 | File 4 deletes `safety_events` on purpose (a health inference the product decided not to keep) | Not a stop; paste back the number. The rows cannot be undone: only a backup brings them back |
| 7 | File 4 needs the three names free | Stop if `false` |
| 8 | File 6 needs every book to have a date; a book with none is flagged for repair | Not a stop; paste back the number |
| 9 | **File 22 count.** `held_drafts` is created by File 17 inside this same run, so it starts empty and has nothing to count. `false` is the expected answer | If `true`, File 17 is somehow already in: stop (A5 should have shown it) |
| 10 | The role that applies the files must see every Storage object, or the legal-hold checks of File 21 answer "not held" | Stop if `false` |
| 11 | Informational. `3\|3\|3` is the old automatic grants, `0\|0\|0` the new. Both are fine: File 25 sets the end state in this same run | Anything else: stop |
| 12 | Before Part B this should be `false` (or `true` if you set it earlier) | Informational |
| 13 | **Guard G8, File 8.** File 8 runs `drop table` on `store_notifications`, `store_subscriptions` and `app_account_tokens` with no guard [V: `20261004000000` lines 123 to 125]. File 6 creates them inside this same run, so on a project with only Files 1 and 2 they do not exist yet and the answer is 0 | If not 0, stop: someone created them by hand. Their rows are gone for good once File 8 runs; only a restore from backup (A4) brings them back |
| 14 | Same as A0 | Stop if it is more than the accounts that are yours |

Paste back: the fourteen "got" values, one per line.

Also run the index check (APPLY.md "Hosted checks", c). It reads names only:

```sql
select indexname, indexdef ~ '\(bucket_id, name' as bucket_and_name, indexdef ~ 'text_pattern_ops' as name_prefix
  from pg_indexes where schemaname = 'storage' and tablename = 'objects' order by 1;
```

Expect a row `bucketid_objname | true | false` and a row `name_prefix_search | false | true`. If neither a `bucket_and_name` nor a `name_prefix` row is true, stop and tell the data architect (every purge run would scan all of Storage).

### A7. Exposed schemas

Dashboard > Project Settings > Data API > **Exposed schemas**: `public` only (APPLY.md Step 15). Never `ops`, `insights` or `sync_private`; if one is listed, remove it. Paste back: the list, as shown.

### A8. The local suite is green

On your Mac, on the same commit `develop` has: `npm install`, then `npm run test:db`. Expect every file to pass. Paste back the last line. Stop on any failure. (The suite builds every file in the folder in an embedded Postgres, so it is the best dress rehearsal short of the hosted run; it does not see hosted-only things such as roles, the Auth hook or Storage's own policies.)

## Part B. Set the consent pepper (once, before the run)

The pepper is a secret random value that turns an old account id into a hash. Rules: it is made on your Mac, it lives in your password manager and, until B2 step 4 says `true`, in one file outside the repo, and it never goes in chat, in a GitHub secret, in a commit or in a screenshot. It is set once and never changed afterwards (old and new hashes would stop matching).

What the pepper guards, honestly: File 14 and File 30 do **not** refuse to apply without it. Their guard sits inside `finalize_account_deletion` and the pseudonymise triggers, which refuse (`55000`) at the moment an account deletion runs [V: `20261015010000` lines 53 to 61, `20261108010000` lines 64 to 77]. Without it the run still goes through, but the smoke is red on `consent pepper`, and the first deletion stalls. You set it first because you decided that, and because a deletion that runs before it is set stalls.

### B1. Make it, on your Mac (Terminal)

**First, before anything is copied or made:** turn off any clipboard manager (Raycast, Alfred, Paste, Maccy and similar) and Universal Clipboard (System Settings > General > AirDrop & Handoff > untick Handoff), because they keep or sync what you copy, and B1 already asks you to copy the pepper into your password manager. If you forget and copied first, open each manager afterwards and delete the entry that holds the pepper.

If you have no pepper yet for this project, make one. This writes it to a file only you can read, outside the repo, and shows nothing:

```bash
( umask 077; mkdir -p "$HOME/el-secrets" && openssl rand -hex 32 > "$HOME/el-secrets/consent-pepper-early-letters.txt" && wc -c "$HOME/el-secrets/consent-pepper-early-letters.txt" )
```

Expect `65` (64 characters and a newline; on macOS the number may have spaces in front of it). Read the value in plain Terminal with `cat "$HOME/el-secrets/consent-pepper-early-letters.txt"` (no editor or viewer, so no recent-file or swap copy), type or copy it into your password manager, then clear the screen with `clear` and close the Terminal tab. Save it in the password manager under "Early Letters consent pepper, early-letters project", and keep the file until B2 step 4 shows `true` (step 1 below may need it). Then delete it (`rm "$HOME/el-secrets/consent-pepper-early-letters.txt"`): a plain file is picked up by Time Machine and by any iCloud sync of its folder (not the case for `$HOME/el-secrets` by default [U]). If you keep it instead, you accept that risk.

If you already have a pepper in your password manager, do not make a new one. Put it in the file without it appearing on screen:

```bash
( umask 077; mkdir -p "$HOME/el-secrets"; printf 'Pepper: '; read -rs P; echo; printf '%s\n' "$P" > "$HOME/el-secrets/consent-pepper-early-letters.txt"; unset P; wc -c "$HOME/el-secrets/consent-pepper-early-letters.txt" )
```

`read -rs` hides what you paste, and this form is meant to work in both zsh (the Mac default) and bash (tested here in bash only; zsh was not available [U]). The pepper must be at least 32 characters. The number printed is its length plus one: a 64 character pepper prints `65`, and any pepper you already have prints its length plus 1, at least `33`. If it prints less than `33`, the pepper is too short: stop.

### B2. Put it into the database, without typing it

0. **First check that the database will not log the line you are about to run.** Dashboard > SQL Editor > New query, run each of these (they show settings, not data):
   ```sql
   show log_statement;
   ```
   ```sql
   show log_min_duration_statement;
   ```
   Expect `none` and `-1`. The smoke accepts `ddl` for the first (`scripts/ops/lib/smoke.ts` line 423), but `ddl` would write the `alter database` statement, pepper included, into the Postgres logs. If `log_statement` is anything but `none` (`ddl`, `mod`, `all`), or the second is not `-1`, **stop**: do not run the pepper line. Turn logging off first (docs/ops/SECURITY.md section 4; ask Supabase support if the dashboard has no switch [U]), or tell the data architect.
0a. Check that the clipboard step at the start of B1 (clipboard managers and Universal Clipboard off) is still true, because you copy again here.
1. Get the value onto the clipboard once. Best: open it in your password manager and copy it there (a password manager clears the clipboard itself [U]; this skips `pbcopy`). Or, from the file:
   ```bash
   tr -d '\n' < "$HOME/el-secrets/consent-pepper-early-letters.txt" | pbcopy
   ```
2. Dashboard > SQL Editor > New query. Type this much by hand, then paste the clipboard between the two quote marks, then type the last quote and semicolon:
   ```sql
   alter database postgres set app.consent_pepper = '';
   ```
   Run it. Expect "Success. No rows returned". Do not use the Supabase Assistant or any AI panel for this line, and do not click Save or Run-and-save on it. Afterwards close the tab and discard the snippet without saving.
3. Clear the clipboard and remove the secret from the editor. Then:
   ```bash
   printf '' | pbcopy
   ```
   That clears only the current clipboard. It does not remove the value from a clipboard-history manager, nor from other devices: with Universal Clipboard on, a nearby iPhone or iPad may have received it, so clear the clipboard there too (copy any harmless word on that device).
   Afterwards, if statement logging was ever on for this project, look in Dashboard > Logs for the value and tell the data architect if it appears [U]. Then delete the query from the SQL Editor (clear the tab, and delete the saved snippet or history entry if the editor kept one). Whether Supabase keeps SQL Editor history that shows the value is [U]; delete anything that does, and also be aware the owner role can read the setting by design (APPLY.md Step 6).
4. Check, new query (this shows only true or false, never the value):
   ```sql
   select char_length(btrim(coalesce(current_setting('app.consent_pepper', true), ''))) >= 32 as pepper_ready;
   ```
   Expect `true`. A database setting reaches new connections only [U]; if the editor still says `false`, close the tab, open a new query and run it again. Connections already open in the pooler keep the old value until they are recycled [U], so wait a few minutes (or restart the project from the dashboard, your decision) before the first account deletion.

Once step 4 is `true` and the pepper is saved in your password manager, delete the file now: `rm "$HOME/el-secrets/consent-pepper-early-letters.txt"`.

Paste back: `pepper_ready = true`. Never the value, never the file.
Stop if: still `false` after a fresh tab. Do not run Part C.

## Part C. The run

### C1. Start it

GitHub > Actions > **Deploy database** > **Run workflow** > branch **develop** > Run workflow. (A run on any other branch fails on purpose.) A new run appears; open it. Its first job, "manual run is on develop", goes green. The job "deploy to staging" then waits: "Review pending deployments".

### C2. Approve

Repeat the A2 count first. **Last check: from the moment you approve, your own phone on `early-letters` gets `SCCON` until `policy_versions` has published rows and your acceptances are recorded (Part E point 5). If the app is in real use, stop and do not approve.** Approve only the run you started yourself (check its "Run workflow" actor and time): if Karma merges a migration meanwhile, a second pending "Review deployments" appears, and it is not yours to approve. Then click Review deployments > tick `staging` > Approve and deploy. This is the moment the apply starts. It is your hand, and the only one in this part.

### C3. Watch, and read the summary

Open "deploy to staging". The steps run in this order [V]: commit being deployed, set up CLI, check the secret exists, **Dry run**, **Push**, files to record, smoke secrets, psql, **Content-free smoke**.

- Dry run: expect a list of 36 files (37 with File 39) [U: the exact print format], in filename order, ending with `20261121040000_value_free_validation_triggers.sql`.
- Push: expect each file applied with no error. This takes minutes; File 17, 22 and 23 may be the slowest.
- The run page's Summary (top left, "Summary") ends with a box titled "staging: migrations not yet in .github/migrations-applied.txt": it lists all 36 file names (37 with File 39), and no others.

Paste back: the colour of each step (green, red, skipped), the **first red step's name** and its error code only (a line like `ERROR: ... (SQLSTATE 55P03)`). Do not paste the full log if it quotes data; the guard messages carry counts and names only [V: APPLY.md file 22, 23], but check before you paste.

### C4. The smoke will probably be red on the first pass, and that is expected

The smoke (`--db-only`) reads policy versions, pepper, statement logging and the `scribe-*` cron jobs. On a first run it normally shows:
- `consent pepper`: green (Part B).
- `policy version terms` and `sensitive-data`: "none published". Publishing needs counsel-approved text and is your decision (APPLY.md Step 8, point 2). Not a blocker for the database.
- `cron scribe-purge-due`, `scribe-sync-housekeeping`, `scribe-purge-worker`, `scribe-purge-worker-daily`: red until Part E schedules them.
- `statement logging`: red only if logging is on; turn it off (docs/ops/SECURITY.md section 4).

A red smoke fails the job after the push; the files are applied anyway [V: DEPLOY.md]. Do not treat a red smoke as a failed migration. A failed Dry run or Push is.

## Part D. Verify (read-only)

Dashboard > SQL Editor > New query. Paste this whole box, run it, and read the `got` and `expect` columns side by side. It ran in PGlite (the repo's test harness) with all 38 files applied (every migration on `develop` on 22 Nov), a stub history table of 38 rows and a stub role `supabase_auth_admin` created after the files, with File 36's hook grant run by hand (the file grants it only `if exists` that role, `20261121000000` line 188): all 29 rows matched, row 27 included. Row 16 locally listed three policies. Only the hosted answer is [U], most of all row 27, because the real role and the real history table are Supabase's own [V].

```sql
select n, what, got, expect from (values
 (1,  'migrations recorded in history (39 once File 39 is in)', (select count(*) from supabase_migrations.schema_migrations)::text, '38'),
 (2,  'columns with no L1-L4 label', (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace join pg_attribute a on a.attrelid = c.oid where n.nspname = 'public' and c.relkind in ('r','v') and a.attnum > 0 and not a.attisdropped and coalesce(col_description(c.oid, a.attnum), '') !~ '^L[1-4]\M')::text, '0'),
 (3,  'public tables without row security', (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity)::text, '0'),
 (4,  'safety_events table gone', (to_regclass('public.safety_events') is null)::text, 'true'),
 (5,  'default grants left for the three API roles', (select count(*) from pg_default_acl d cross join lateral aclexplode(d.defaclacl) a where d.defaclnamespace = 'public'::regnamespace and d.defaclrole = 'postgres'::regrole and a.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole))::text, '0'),
 (6,  'TRUNCATE/REFERENCES/TRIGGER/MAINTAIN held by an API role', (select count(*) from pg_class c cross join unnest(array['anon', 'authenticated', 'service_role']) r cross join unnest(array['TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']) p where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p', 'v', 'm') and has_table_privilege(r, c.oid, p))::text, '0'),
 (7,  'explicit grants present (file 25)', (has_table_privilege('anon', 'public.policy_versions', 'SELECT') and has_table_privilege('authenticated', 'public.entries', 'INSERT') and has_table_privilege('authenticated', 'public.held_drafts', 'UPDATE') and has_table_privilege('authenticated', 'public.my_policy_state', 'SELECT') and not has_table_privilege('anon', 'public.entries', 'SELECT') and not has_table_privilege('authenticated', 'public.children', 'UPDATE') and not has_table_privilege('service_role', 'public.policy_acceptances', 'SELECT') and not has_column_privilege('authenticated', 'public.children', 'date_of_birth', 'SELECT'))::text, 'true'),
 (8,  'functions with a loose search_path', (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public', 'ops', 'insights', 'sync_private') and p.prokind = 'f' and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e') and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c ~ '^search_path=(""|pg_catalog(, [a-z_]+)*, pg_temp)$'))::text, '0'),
 (9,  'consent pepper long enough (the value is never shown)', (char_length(btrim(coalesce(current_setting('app.consent_pepper', true), ''))) >= 32)::text, 'true'),
 (10, 'api roles cannot read birth or due dates', (not has_column_privilege('authenticated', 'public.children', 'date_of_birth', 'select') and not has_column_privilege('authenticated', 'public.children', 'due_date', 'select') and has_column_privilege('authenticated', 'public.children', 'name', 'select'))::text, 'true'),
 (11, 'sync_private: signed in yes, anon no, helpers not RPCs', (has_schema_privilege('authenticated', 'sync_private', 'usage') and not has_schema_privilege('anon', 'sync_private', 'usage') and (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('note_applied', 'dup_outcome', 'held_upsert', 'held_discard', 'erase_entry', 'erase_held')) = 0)::text, 'true'),
 (12, 'ops and insights not reachable by signed-in people', (not has_schema_privilege('authenticated', 'ops', 'usage') and not has_schema_privilege('authenticated', 'insights', 'usage'))::text, 'true'),
 (13, 'held_drafts checks validated (file 22)', (select count(*) from pg_constraint where conrelid = 'public.held_drafts'::regclass and convalidated and conname in ('held_drafts_capture_mode_check', 'held_drafts_edit_level_check', 'held_drafts_machine_edits_shape', 'held_drafts_author_edits_shape', 'held_drafts_locked_spans_shape'))::text, '5'),
 (14, 'entries machine_edits check validated (file 23)', (select convalidated from pg_constraint where conrelid = 'public.entries'::regclass and conname = 'entries_machine_edits_shape')::text, 'true'),
 (15, 'service_role write rights on consent tables (files 20, 24)', (select count(*) from unnest(array['policy_acceptances', 'subscription_consents']) t cross join unnest(array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']) p where has_table_privilege('service_role', 'public.' || t, p))::text, '0'),
 (16, 'storage policies on the photo folder (file 26 then 33)', (select string_agg(polname, ',' order by polname) from pg_policy where polrelid = 'storage.objects'::regclass and polname like 'entry_photos_%'), 'entry_photos_author_delete,entry_photos_no_anonymous,entry_photos_read'),
 (17, 'photo_entry_is_purged exists (file 26)', (to_regprocedure('public.photo_entry_is_purged(text)') is not null)::text, 'true'),
 (18, 'invite_redeem_by_code exists (file 27)', (select count(*) from pg_proc where proname = 'invite_redeem_by_code')::text, '1'),
 (19, 'record_policy_act ends with the new arguments (file 29)', (pg_get_function_identity_arguments('public.record_policy_act'::regproc) like '%p_app_build text, p_os_major integer')::text, 'true'),
 (20, 'deletion_requests.subject_hash and consent-records function (file 30)', ((select count(*) from pg_attribute where attrelid = 'public.deletion_requests'::regclass and attname = 'subject_hash' and not attisdropped) + (select count(*) from pg_proc where proname = 'ops_deletion_consent_records'))::text, '2'),
 (21, 'append-only triggers (file 31)', (select count(*) from pg_trigger where not tgisinternal and tgname in ('audit_events_guard', 'audit_events_no_truncate', 'policy_acceptances_no_truncate', 'audit_log_no_truncate'))::text, '4'),
 (22, 'children name check (file 32)', (select pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.children'::regclass and conname = 'children_name_check'), 'CHECK ((char_length(name) <= 60))'),
 (23, 'photo-closed trigger (file 33)', (select count(*) from pg_trigger where tgname = 'entries_15_photo_closed')::text, '1'),
 (24, 'authenticator can become insights_reader (file 34)', (select count(*) from pg_auth_members m join pg_roles r on r.oid = m.roleid join pg_roles g on g.oid = m.member where r.rolname = 'insights_reader' and g.rolname = 'authenticator')::text, '0'),
 (25, 'legal_holds audit trigger and empty security_events (file 35)', ((select count(*) from pg_trigger where tgname = 'legal_holds_audit') || ' and ' || (select count(*) from ops.security_events))::text, '1 and 0'),
 (26, 'new-device tables empty (file 36)', (select count(*) from ops.account_sessions_seen)::text, '0'),
 (27, 'hook runnable by Auth only (file 36)', (has_function_privilege('supabase_auth_admin', 'public.hook_new_device_sign_in(jsonb)', 'execute') and not has_function_privilege('anon', 'public.hook_new_device_sign_in(jsonb)', 'execute') and not has_function_privilege('authenticated', 'public.hook_new_device_sign_in(jsonb)', 'execute'))::text, 'true'),
 (28, 'sender and fill functions: service only (files 37, 38)', (has_function_privilege('service_role', 'public.ops_new_device_token_mint(uuid,uuid,bytea,interval)', 'execute') and has_function_privilege('service_role', 'public.ops_new_device_pending_fill(uuid,uuid,text,bytea)', 'execute') and has_function_privilege('service_role', 'public.ops_new_device_rekey(uuid,bytea,bytea)', 'execute') and not has_function_privilege('anon', 'public.ops_new_device_rekey(uuid,bytea,bytea)', 'execute') and not has_function_privilege('authenticated', 'public.ops_new_device_rekey(uuid,bytea,bytea)', 'execute'))::text, 'true'),
 (29, 'value-free validation triggers (file 40)', (select count(*) from pg_trigger where tgname like '%\_validate\_limits' and not tgisinternal)::text, '4')
) as t(n, what, got, expect) order by n;
```

Paste back: the table's `n` and `got` columns, or just the numbers of the rows that differ from `expect`.
Stop if: any row differs. Do not start Part G. Which test explains each row is in the table below, and the data architect reads the paste.

### What each check is the proof of

| Rows | Files | Test in `supabase/tests` that runs the same assertion in CI |
|---|---|---|
| 1 | all | the migration history itself (nothing in the suite; it is the run's own proof) |
| 2, 3, 4 | 4 | `classification.test.mjs`, `data_governance.test.mjs`, `rls.test.mjs` |
| 5, 6, 7 | 25 | `explicit_grants.test.mjs`, `access_matrix.test.mjs`, `grants.mjs` |
| 8 | 13, 26 | `pg_temp_search_path.test.mjs`, `v1_gate_search_path.test.mjs` |
| 9 | 14, 30 | `v1_gate_limits_peek_pepper.test.mjs`, `deletion_subject_hash.test.mjs` |
| 10 | 13 | `v1_gate_hardening.test.mjs` |
| 11, 12 | 9, 10, 11, 17 | `sync_v1_server.test.mjs`, `sync_engine.test.mjs`, `ops_deletion_worker.test.mjs`, `insights_aggregates.test.mjs` |
| 13 | 22 | `held_drafts_write_checks.test.mjs` |
| 14 | 23 | `entries_machine_edits_check.test.mjs` |
| 15 | 20, 24 | `consent_service_role.test.mjs`, `consent_grants_tightening.test.mjs` |
| 16, 17 | 26, 33 | `purged_id_never_returns.test.mjs`, `photo_bucket_closed.test.mjs` |
| 18 | 27 | `invite_redeem_by_code.test.mjs` |
| 19 | 29 | `consent_record_fields.test.mjs` |
| 20 | 30 | `deletion_subject_hash.test.mjs` |
| 21 | 31 | `audit_append_only.test.mjs` |
| 22 | 32 | `child_name_optional.test.mjs` |
| 23 | 33 | `photo_bucket_closed.test.mjs` |
| 24 | 34 | `insights_reader_not_via_api.test.mjs` |
| 25 | 35 | `audit_writers_security_events.test.mjs` |
| 26, 27 | 36 | `new_device_sign_in.test.mjs` |
| 28 | 37, 38 | `new_device_sender.test.mjs`, `new_device_fill_rekey.test.mjs` |
| 29 | 40 | `value_free_validation.test.mjs` (row 29 counts every trigger named `%_validate_limits`: if a later file adds a similar trigger on another table it reads 5 or more; that is not a failure, tell the data architect the number) |

Row 16 lists three policies, not two as APPLY.md's File 33 check says: `entry_photos_no_anonymous` is also on the folder [V: local run]. The APPLY.md line is out of date on that one point; this sheet does not edit it. The File 18 and 19 tables (subscription status, backup) are covered by `subscription_status.test.mjs`, `audio_backup.test.mjs`, `audio_backup_escrow.test.mjs`, `audio_backup_purge.test.mjs`, `backup_role.test.mjs` in CI; no hosted check is added for them because both stay dark (guard in Part G).

### D2. Advisors

Dashboard > Advisors > Security and Performance. Expected and accepted (APPLY.md Steps 4, 10, 21, 24 and the File 26 section): **0010** security definer view on `public.book_entries`; **0029** for the RPCs a signed-in person calls, and for `photo_entry_is_purged`; `sync_rate_windows` as an unlogged table. **0011** (mutable search path) must be clear. Anything else new: **stop** and tell the data architect and the CISO. Paste back: the list of advisor names and counts, no more.

## Part E. Settings after the run (founder, dashboard)

These are database settings, not migrations, so CI does not apply them.

1. **Purge schedules.** Dashboard > Integrations > Cron (turns on `pg_cron`). Then in the SQL Editor, one box at a time:
   ```sql
   select cron.schedule('scribe-purge-due', '17 * * * *', $$ select public.purge_due(); $$);
   ```
   ```sql
   select cron.schedule('scribe-sync-housekeeping', '43 * * * *', $$ select public.sync_housekeeping(); $$);
   ```
   Each answers a job number. The purge-worker jobs (`scribe-purge-worker`, `scribe-purge-worker-daily`) come from `supabase/cron/purge-worker.sql` and need the `purge-worker` function deployed and two Vault secrets; follow `docs/ops/runbooks/purge-failing.md` "Install or reinstall the schedule" [U: not run here].
2. **Daily retention for File 36.** The file expects `select public.ops_new_device_retention();` to run daily. There is no schedule in the repo yet: this sheet gives none, and it is deferred to the time the new-device work is switched on (Part G, row 5). The data architect supplies the command then.
3. **Validate the rules File 4 and File 6 added as NOT VALID**, only after Part A6 rows 5 and 8 were 0 (APPLY.md Steps 5 and 12). Otherwise leave them and tell the data architect the numbers.
4. **Leave these off:** `app.contributors_enabled`, `app.family_share_consent_required`, `app.consent_fields_required` [V: APPLY.md, steps 22 and File 29].
5. **Consent gate warning for your own phone.** File 5 turns on the server consent gate: from that moment no letter, book or setting is accepted from anyone without a current Terms acceptance (with the age attestation) and a current sensitive-data acceptance. Until `policy_versions` has published rows (APPLY.md Step 8) and your own acceptances are recorded, the app on `early-letters` will answer `SCCON`. Publishing the text is your decision with counsel; it is not part of this run [V: APPLY.md Step 8].
6. **Run the workflow once more** (Part C1, then approve) after steps 1 to 5. With nothing pending the dry run lists nothing and the push is a no-op [U], and the smoke should go green. That green run is the evidence for the record.

## Part F. The guards, and what to do when each stops the run

| Guard | What it checks | How you will see it | What to do |
|---|---|---|---|
| G1. File 23 CHECK | A stored letter fails `entries_machine_edits_shape` (`machine_edits` not a list) | Push stops at `20261023040000`: `55000` with a count and the check name only. The file rolls back; files 3 to 22 stay applied; files 24 to 38 are not applied | Do not touch the row. Paste back the count. The data architect and the coordinator decide the repair (APPLY.md "If the count is not 0"). Run Part C again when the count is 0 |
| G2. File 33 `photo_path` count | Letters with a picture path | Caught in A6 row 4, before approving. The file itself does not refuse; it closes the door to new picture paths and leaves old ones readable | If not 0, do not run. Tell the data architect; those rows need review |
| G3. Lock timeout `55P03` on Files 23 and 26 | The file waits at most 5 seconds for an exclusive lock on `entries` (File 23) or `storage.objects` (File 26) | Push stops with "canceling statement due to lock timeout", SQLSTATE `55P03`. Nothing changed and nothing is recorded for that file | Wait ten minutes, close the app on every phone, run Part C again. It resumes at that file. Three `55P03` in a row: stop and ask |
| G4. File 30 pepper | `finalize_account_deletion` refuses (`55000`, nothing changed) without a 32-character pepper | Not at apply. At the first account deletion, and as a red smoke line `consent pepper`, and the alert `pepper_missing` from the purge worker | Part B again; then re-check `pepper_ready`. Never set a different value later |
| G5. Re-run refusals | Most files refuse a second run (`55000`): at least 13, 14, 15, 17, 20, 21, 22, 23, 24, 25, 27, 29, 30, 31, 33, 35 and 36 [V: "already applied" in the files] | Only if the history row is missing while the objects exist | Stop. Do not rerun by hand. The data architect reads A5 and the Verify table and decides |
| G6. File 25 in the same run | Without File 25 every table answers `42501` to the app | Verify rows 5, 6 and 7 | Files 3 to 24 are applied but the app is shut. Run Part C again; if File 25 itself failed, paste the error |
| G7. Photo-path trigger `SCPHO` (File 33) | A new picture path is refused by the server | After the run, from a build with photos on | Expected. The server is closed to pictures on purpose until the photo design ships |
| G8. File 8 drops tables | `store_notifications`, `store_subscriptions`, `app_account_tokens` are dropped for good | A6 row 13, before approving | Stop if not 0; only a backup restores them |

If the failure is not in this table: stop, paste the failing step's name and the SQLSTATE, and nothing else.

## Part G. What goes on, in what order (server before flag)

A servers-on build, a photos build and the new-device email all assume database files. The rule is the same each time: the file first, the switch second.

| Order | Switch | Needs these first | Why [V unless marked] |
|---|---|---|---|
| 1 | Any build with `EXPO_PUBLIC_SERVER_FEATURES=on` (preview and production profiles in `apps/mobile/eas.json`, lines 47 and 61) | Files 1 to 25, verified (Part D rows 5 to 7), plus the policy versions published (Part E 5) | Otherwise sign-in, consent and sync answer `42501` or `SCCON` |
| 2 | Any servers-on build that contains #701 (an empty first-book name) | **File 32** applied and Part D row 22 matched | Today's server refuses the empty name with `22023` and the whole first-run batch is rejected, so the account gets no book |
| 3 | Photos on outside your own family (`EXPO_PUBLIC_PHOTOS`) | **File 33** applied and Part D rows 16 and 23 matched | Server before flag. `EXPO_PUBLIC_PHOTOS` is not in `eas.json` on `develop`; whether another config sets it is [U] |
| 4 | `EXPO_PUBLIC_BACKUP`, `STATUS_REPORT` | Files 18 and 19 live, `app.status_report_enabled` set | Both are off in every profile today |
| 5 | The new-device email: `NEW_DEVICE_EMAIL=on` on the Edge Functions `new-device-email` and `new-device-fill`, and `EXPO_PUBLIC_NEW_DEVICE_EMAIL=on` in a build | **Files 36, 37 and 38** applied; Part D rows 26 to 28 matched; then the **Custom Access Token hook switched on** (below), H1 true, and proofs A3 and A4 recorded; secrets `NEW_DEVICE_SENDER_SECRET`, `DEVICE_HASH_KEY`, `RESEND_API_KEY` set; the app's fill call exists (NDS-2) | The function and the build flag are dark by default [V: `flag.ts`]. Do not turn `NEW_DEVICE_EMAIL` on before the fill call exists (APPLY.md File 38). Gate G6 also applies [V: `flag.ts` header] |
| 6 | Edge Functions deploy | Staging holds every migration on `develop` | `deploy-functions.yml` deploys nothing until then [V: DEPLOY.md]; approve Deploy database first. `invite-redeem` needs File 27 |

### G-hook. The hook, H1, A3 and A4 (after Files 36 to 38, before row 5 above)

All founder steps in the dashboard and SQL Editor; none is proved by the test suite [V: APPLY.md File 36].

1. Authentication > Hooks > Custom Access Token > choose Postgres function `public.hook_new_device_sign_in`. [U] exact menu wording and whether a hosted plan limits it. The function fails open: a hook error lets the sign-in through and counts one failure [V].
2. H1, read-only. Expect `true`:
   ```sql
   select has_table_privilege('postgres', 'auth.sessions', 'DELETE');
   ```
   If `false`, the "sign this device out" lever does not exist on hosted: stop; keep `NEW_DEVICE_EMAIL` off; the data architect decides.
3. A3: refresh with the ended session's refresh token and record the exact error name; it must be refused. A4: count that session's refresh-token rows; it must be zero. Both need a test session on the app; the exact steps are in `docs/engineering/readiness-20nov/data-security/09-new-device-email-security-answers.md` section 3.3 and 3.4 [U: not run]. If A4 is not zero, section 3.4 applies. Paste back: the error name and the count.
4. Remember what "signed out" means: the press ends the session, not the access token already issued; that one lives out its 15 minutes (`jwt_expiry = 900`) [V].

## Part H. Production, later (only after staging is green)

Not part of today. Written down so the order is not lost.

1. Preconditions: Part D green on staging; Part E 6 green; the record PR (Part J) merged; Files 3 to 38 and 40 reached `main` (the tag job refuses a commit that is not on `main`) [U whether they have]; `SUPABASE_DB_URL_PROD` re-saved from the new production project (A1 point 3); a backup and the same Part A and B repeated for production, with a **different** pepper.
2. Tag a commit on `main` and push it [V: DEPLOY.md "Tagging flow"]:
   ```bash
   git fetch origin
   git tag -a db-v2026.11.21.1 -m "DB: catch-up, Files 3 to 38 and 40" <commit on origin/main>
   git push origin db-v2026.11.21.1
   ```
   Only a tag push reaches production; a manual run never does. The tag name is a suggestion; anything starting with `db-v` works.
3. Actions > Deploy database > the tag's run: approve `db-production` (your hand; the same approve-before-dry-run order as C2). Repeat Parts A5, A6, D and E against production, with its own numbers.
4. Anything the run lists that the staging record PR did not include goes into a follow-up record PR.

## Part I. Undo, or fix forward, per file

The honest rule: after a run, the only complete undo is restoring a backup (Part A4), and a restore loses everything written since. Everything below is a forward fix in a new migration or a small, named reversal in the SQL Editor; the data architect writes it. "Forward-fix only" means the file's header gives no safe reversal. Do not run any of these without the data architect's go-ahead; paste back the symptom first.

| File | Undo or forward fix | Source |
|---|---|---|
| 3 | Recreate the two old SELECT policies, drop `entries_select` (a transaction, in APPLY.md) | APPLY.md Step 1 |
| 4 | "Rolling back step 3 after it committed" | APPLY.md |
| 5 to 7 | "Rolling back files 5 to 7" | APPLY.md |
| 8 | Drops the three store tables for good (guard G8, A6 row 13). Data cannot be restored except from a backup; no other reversal | APPLY.md File 8 section |
| 9 to 11 | Tables and functions only; `drop schema ops cascade` and `drop schema insights cascade` before any real use; File 9 adds two columns with defaults | APPLY.md Step 14 |
| 12 | "Rolling back file 12" | APPLY.md |
| 13 to 16 | "Rolling back files 13 to 16": partial switches, each safe (revoke the new invite call, revoke the undo call, raise a limit) | APPLY.md |
| 17 | "Rolling back file 17" | APPLY.md |
| 18 | Only before a real purchase is recorded | APPLY.md File 18 |
| 19 | Per its section | APPLY.md File 19 |
| 20 | Prefer forward-fix; reversal only while `purged_at` is null everywhere. Never grant the consent tables back to `service_role` | APPLY.md File 20 |
| 21 | Prefer forward-fix; re-run `purge_due`, `prepare_account_purge`, `ops_deletion_sla` from File 20, then drop `book_purge_held` | APPLY.md File 21 |
| 22 | Drop the five checks in one transaction; no data changes | APPLY.md File 22 |
| 23 | `alter table public.entries drop constraint entries_machine_edits_shape;` (brief exclusive lock). The history row stays, so it never reruns | APPLY.md File 23 |
| 24 | Prefer not to; if a path needs a privilege, grant that one privilege to that one role in a new file, never `grant all` | APPLY.md File 24 |
| 25 | Forward-fix only: a path that needs a grant gets that one grant in a new file. A reversal reopens TRUNCATE on 13 tables on an old-grants project; on a new project there is nothing to go back to | APPLY.md File 25 |
| 26 | Forward-fix preferred. The reversal is a boxed transaction in APPLY.md; it restores the role setting and the two policies and then drops the function (in that order, or `2BP01`) | APPLY.md File 26 |
| 27 | `drop function public.invite_redeem_by_code(uuid, text, bytea, text[], text[], text[]); drop table public.invite_redeem_failures;`; typed codes then answer 503 | APPLY.md File 27 |
| 29 | Only before any row carries `app_build`; see the file header | APPLY.md File 29 |
| 30 | See the file header | APPLY.md File 30 |
| 31 | See the file header | APPLY.md File 31 |
| 32 | Only while no book has an empty name; restore the 1 to 60 check and re-create two functions as written in APPLY.md | APPLY.md File 32 |
| 33 | **Forward-fix only** | APPLY.md File 33 |
| 34 | **Forward-fix only:** `grant insights_reader to authenticator;` restores the old path, but never as a quick fix: it reopens the Data API's path to the analytics role | APPLY.md File 34 |
| 35 | **Forward-fix only**; refuses a second run | APPLY.md File 35 |
| 36 | Switch the hook **off first**, then forward-fix; refuses a second run | APPLY.md File 36 |
| 37 | Drop the three functions | APPLY.md File 37 |
| 38 | Drop the two functions | APPLY.md File 38 |
| 39 | Not on `develop` yet (#1448); add its row here when it lands | APPLY.md File 39 [U] |
| 40 | Forward-fix only: drop the four triggers and four functions; the CHECKs stay and keep refusing, with the row in the error detail | APPLY.md File 40 |

Two things to remember. If the hook is on and a file under it is changed, a sign-in can be affected, which is why the hook goes off first. And once a migration is recorded in `.github/migrations-applied.txt` it can never be edited; a fix is always a new file after the newest one.

## Part J. After the run: record it

After Part D is green, the data architect opens a PR that adds the 36 file names (37 with File 39) (the list in the run summary, C3) to `.github/migrations-applied.txt` [V: DEPLOY.md "After a deploy"]. Once merged, the migration guard blocks any edit of those files. Paste the run summary's file list to the data architect if they do not have it. Karma merges under CR-70 and CR-73; the label `approve-migration` is not a merge step.

## Part K. Unverified, in one place

- [U] What the hosted project's history holds (A5), and whether File 2's version matches the file (a mismatch breaks `db push`).
- [U] Whether `SUPABASE_DB_URL_STAGING` already points at `early-letters`, and whether `db-production` exists and points elsewhere.
- [U] Whether the Run workflow button is available (the workflow must be on the default branch).
- [U] That a second run after a failure resumes from the failed file, and that a no-op push exits clean. Both follow from how `supabase db push` records history per file [V: APPLY.md], neither has run here.
- [U] Whether Supabase's SQL Editor keeps a copy of the pepper line in history (B2).
- [U] Whether point in time recovery is on.
- [U] The Custom Access Token hook's menu wording, `auth.sessions` DELETE on hosted (H1), and the A3 and A4 proofs.
- [U] Whether Files 3 to 38 and 40 are on `main` yet (production tag).
- [U] The purge-worker cron's Vault secrets and the `purge-worker` function's deploy state.
- [V but local only] The two big read-only queries ran in PGlite (the repo harness), not against the hosted project. Locally row 1 of A6 answers 18, row 12 answers true and the index check shows only `objects_pkey`; Part D passes all 29 rows including row 27 with a stub `supabase_auth_admin` role. The hosted answers are [U].
- [U] That pooled connections pick up the pepper after a few minutes.
